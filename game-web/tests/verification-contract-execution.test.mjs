import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildVerificationContract,
  validateVerificationContract,
} from "../src/game/verificationContract.ts";
import {
  assessContractRun,
  simulate,
} from "../src/features/verification/simModel.ts";
import { judgeRun } from "../src/game/scenarios.ts";

const contractFor = (caseId) => buildVerificationContract(caseId, {
  hypothesisId: "test-hypothesis",
  hypothesisLabel: "시험 가설",
  suspectSection: "시험 구간",
  expectedValue: "STEP03 기대값",
});

test("STEP03 contracts contain executable initial values, stimulus, observations, and tolerances", () => {
  for (const caseId of ["propulsion", "thermal", "brake"]) {
    const contract = contractFor(caseId);
    assert.equal(validateVerificationContract(contract, caseId).ok, true);
    assert.ok(contract.execution.initial.length > 0);
    assert.ok(contract.execution.stimulus.signalId);
    assert.ok(contract.execution.expectedOutputs.length > 0);
    assert.ok(contract.execution.observationSignalIds.vehicle.length > 0);
  }
});

test("contract stimulus overrides legacy derivative defaults and drives the model input", () => {
  const cases = [
    ["propulsion", "aps", 60],
    ["thermal", "tc", 78.4],
    ["brake", "p", 55],
  ];
  for (const [caseId, signalId, expected] of cases) {
    const contract = contractFor(caseId);
    // boundary previously changed the input independently of STEP03; contract values now win.
    const result = simulate(caseId, "boundary", false, contract.execution);
    const signal = result.levels.vehicle.find(item => item.id === signalId);
    assert.ok(signal, `${caseId} exposes ${signalId}`);
    assert.ok(Math.abs(signal.run.at(-1) - expected) < 0.02, `${caseId} uses the contract input`);
    assert.equal(result.seconds, contract.execution.durationSeconds);
  }
});

test("normal baseline and fault/fixed runs share the exact contract condition", () => {
  for (const caseId of ["propulsion", "thermal", "brake"]) {
    const contract = contractFor(caseId);
    const fault = simulate(caseId, "req", false, contract.execution);
    const fixed = simulate(caseId, "req", true, contract.execution);
    for (const level of ["unit", "swint", "embedded", "vehicle"]) {
      const fixedById = new Map(fixed.levels[level].map(signal => [signal.id, signal]));
      for (const signal of fault.levels[level]) {
        assert.deepEqual(signal.ref, fixedById.get(signal.id).ref, `${caseId}/${level}/${signal.id} baseline`);
      }
    }
  }
});

test("an incomplete or mismatched contract is rejected instead of silently defaulting", () => {
  const missingExecution = { ...contractFor("propulsion"), execution: undefined };
  const invalid = validateVerificationContract(missingExecution, "propulsion");
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(" "), /실행 조건/);
  const wrongCase = validateVerificationContract(contractFor("thermal"), "propulsion");
  assert.equal(wrongCase.ok, false);
  assert.match(wrongCase.errors.join(" "), /사건 ID/);
});

test("fault retest fails and repaired retest passes against contract observations and expected output", () => {
  for (const caseId of ["propulsion", "thermal", "brake"]) {
    const contract = contractFor(caseId);
    const fault = simulate(caseId, "req", false, contract.execution);
    const fixed = simulate(caseId, "req", true, contract.execution);
    assert.equal(assessContractRun(contract, "vehicle", fault.levels.vehicle).verdict, "FAIL");
    assert.equal(assessContractRun(contract, "vehicle", fixed.levels.vehicle).verdict, "PASS");
  }
});

test("missing contract observation produces INCONCLUSIVE", () => {
  const contract = contractFor("propulsion");
  contract.execution.observationSignalIds.vehicle.push("not-measured");
  const fixed = simulate("propulsion", "req", true, contract.execution);
  const assessment = assessContractRun(contract, "vehicle", fixed.levels.vehicle);
  assert.equal(assessment.verdict, "INCONCLUSIVE");
  assert.deepEqual(assessment.missingSignalIds, ["not-measured"]);
});

test("hypothesis support and a failed test verdict remain independent", () => {
  const contract = contractFor("thermal");
  const fault = simulate("thermal", "soak", false, contract.execution);
  const assessment = assessContractRun(contract, "embedded", fault.levels.embedded);
  const obs = Object.fromEntries(contract.execution.observationSignalIds.embedded.map(id => {
    const signal = fault.levels.embedded.find(item => item.id === id);
    const changed = signal.run.some((value, index) => Math.abs(value - signal.ref[index]) > signal.max * 0.02);
    return [id, changed ? (signal.run.at(-1) < signal.ref.at(-1) ? "lower" : "higher") : "same"];
  }));
  const fanSw = judgeRun("thermal", { level: "embedded", fixed: false, obs }).find(item => item.id === "fan_sw");
  assert.equal(assessment.verdict, "FAIL");
  assert.equal(fanSw.verdict, "supported");
});

test("contract and STEP04 progress data survive JSON storage round trips", () => {
  const contract = contractFor("propulsion");
  const restoredContract = JSON.parse(JSON.stringify(contract));
  assert.equal(validateVerificationContract(restoredContract, "propulsion").ok, true);
  const progress = {
    phase: "done",
    answers: { vcu_sw: { answer: "supported" }, vcu_hw: { answer: "refuted" } },
    lastRun: { fixed: true, verdict: "PASS", level: "vehicle" },
  };
  assert.deepEqual(JSON.parse(JSON.stringify(progress)), progress);
});

test("live STEP04 sends computed BENCH_RESULT values instead of hardcoded success", () => {
  const source = readFileSync(new URL("../src/features/verification/VerificationLab.tsx", import.meta.url), "utf8");
  const live = source.slice(source.indexOf("export function TwinBenchExperience"));
  assert.match(live, /pass: retestPassed, causeCorrect/);
  assert.doesNotMatch(live, /pass: true, causeCorrect: true/);
  assert.match(live, /lastRun\?\.fixed && lastRun\.verdict === "PASS"/);
  assert.match(live, /answers\[trueHypothesis\]\?\.answer === "supported"/);
});
