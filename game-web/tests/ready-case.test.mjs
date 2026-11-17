import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dispatch, initialCampaign } from "../src/game/runtime.ts";
import { LEVELS, levelStatus } from "../src/game/levels.ts";
import { SCENARIOS, SCENARIO_META, hypothesisStatus, judgeRun } from "../src/game/scenarios.ts";
import { simulate, firstMismatch } from "../src/features/verification/simModel.ts";
import { buildVerificationContract } from "../src/game/verificationContract.ts";
import { READY_FAULT, levelFaults } from "../src/game/faultSchedule.ts";

const at = (completed) => ({ ...initialCampaign(), scene: "LEVEL_SELECT", completedCases: completed });

test("C01 level: bonus level 5 after thermal; a race with failed starts leads to the fault cue", () => {
  const level = LEVELS[4];
  assert.deepEqual([level.level, level.kind, level.caseId], [5, "bonus", "ready"]);
  assert.equal(levelStatus(at([]), level), "locked");
  assert.equal(levelStatus(at(["propulsion", "thermal"]), level), "open");
  const started = dispatch(at(["propulsion", "thermal"]), { type: "START_LEVEL", level: 5 });
  assert.equal(started.scene, "CHASE_RESUME"); assert.equal(started.caseId, "ready");
  const cue = dispatch(started, { type: "FAULT_CUE", caseId: "ready", distance: 1500, gap: 100, elapsed: 20 });
  assert.equal(cue.scene, "FAULT_CUE"); assert.equal(dispatch(cue, { type: "CONTINUE_FAULT" }).scene, "BOARD");
  assert.equal(dispatch(at(["propulsion"]), { type: "START_LEVEL", level: 5 }).scene, "LEVEL_SELECT");
});

test("C01 race fault: the prestart spec fails every start attempt (permanent)", () => {
  assert.deepEqual(levelFaults("resume", "ready").map(s => s.id), ["case-ready"]);
  assert.equal(READY_FAULT.trigger.phase, "prestart");
  assert.ok(READY_FAULT.effect.startFails >= 3);
});

test("C01 numbers follow the sheet: RC precharge 400 V, tau 250 ms, 95 % at ~750 ms, timeout 1500 vs 500 ms", () => {
  const meta = SCENARIO_META.ready;
  assert.equal(meta.hypotheses.filter(h => h.truth).length, 1);
  assert.equal(meta.hypotheses.find(h => h.truth).id, SCENARIOS.ready.root);
  assert.ok(meta.hypotheses.some(h => /HW/.test(h.label)));
  const contract = buildVerificationContract("ready", { hypothesisId: "seq_timeout", hypothesisLabel: "x", suspectSection: "x", expectedValue: "x" });
  const fault = simulate("ready", "req", false, contract.execution), fixed = simulate("ready", "req", true, contract.execution);
  const at = (levels, lv, id, f) => { const sig = levels[lv].find(s => s.id === id); return f(sig); };
  const vbusAt = ms => at(fault.levels, "embedded", "vbus", sig => sig.ref[Math.round((.025 + ms / 1000) / 1.6 * 120)]);
  assert.ok(Math.abs(vbusAt(500) - 345.9) < 4, `500 ms ${vbusAt(500)}`);
  assert.ok(Math.abs(vbusAt(750) - 380.1) < 4, `750 ms ${vbusAt(750)}`);
  assert.equal(at(fault.levels, "unit", "tmo", s => s.run[0]), 500); assert.equal(at(fault.levels, "unit", "tmo", s => s.ref[0]), 1500);
  assert.equal(at(fault.levels, "vehicle", "ready", s => s.ref.at(-1)), 1); assert.equal(at(fault.levels, "vehicle", "ready", s => s.run.at(-1)), 0);
  assert.equal(at(fixed.levels, "vehicle", "ready", s => s.run.at(-1)), 1);
  assert.equal(firstMismatch(fixed.levels.embedded), null);
  // the HV bus is a physical response: identical in the healthy and the faulty run
  const vbus = fault.levels.embedded.find(s => s.id === "vbus");
  assert.deepEqual(vbus.ref, vbus.run);
});

test("C01 judging: embedded test supports the timeout hypothesis, the bus curve refutes the HW one, unit only holds", () => {
  const runAt = (level) => { const contract = buildVerificationContract("ready", { hypothesisId: "x", hypothesisLabel: "x", suspectSection: "x", expectedValue: "x" }); const list = simulate("ready", "req", false, contract.execution).levels[level];
    const obs = {}; for (const s of list) { const d = s.run.at(-1) - s.ref.at(-1); obs[s.id] = Math.abs(d) < (s.max - (s.min ?? 0)) * .02 ? "same" : d > 0 ? "higher" : "lower"; } return { level, fixed: false, obs }; };
  const verdict = (level, id) => judgeRun("ready", runAt(level)).find(h => h.id === id).verdict;
  assert.equal(verdict("embedded", "seq_timeout"), "supported");
  assert.equal(verdict("unit", "seq_timeout"), "open");
  assert.equal(verdict("swint", "seq_timeout"), "open");
  assert.equal(verdict("vehicle", "seq_timeout"), "open");
  assert.equal(verdict("embedded", "precharge_hw"), "refuted");
  assert.equal(verdict("vehicle", "precharge_hw"), "refuted");
  const status = hypothesisStatus("ready", [runAt("embedded")]);
  assert.equal(status.find(h => h.id === "seq_timeout").status, "supported");
  assert.equal(status.find(h => h.id === "bms_link").status, "refuted");
});

test("C01 board data: first deviation is the VCU sequence state, trap changes later, one correct section", () => {
  const src = readFileSync(new URL("../src/features/board/DominoTrace.tsx", import.meta.url), "utf8");
  const board = src.slice(src.indexOf('  ready: {\n    start: "ready"'), src.indexOf('  gear: {\n    start: "launch_dir"'));
  assert.match(board, /start: "ready", first: "seq_state"/);
  const times = Object.fromEntries([...board.matchAll(/id: "(\w+)"[^\n]*status: "bad", t: (\d+)/g)].map(m => [m[1], Number(m[2])]));
  assert.equal(times.seq_state, 500);
  assert.ok(Object.entries(times).every(([id, t]) => id === "seq_state" || t > times.seq_state));
  assert.equal((board.match(/ok: true/g) ?? []).length, 1);
});
