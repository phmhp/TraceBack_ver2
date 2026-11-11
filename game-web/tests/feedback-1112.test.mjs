import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildVerificationContract } from "../src/game/verificationContract.ts";
import { simulate } from "../src/features/verification/simModel.ts";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const eeTrace = read("../src/features/board/EeTrace.tsx");
const live02 = eeTrace.slice(eeTrace.indexOf("export function EeTraceV2"), eeTrace.indexOf("// ===== v3"));
const domino = read("../src/features/board/DominoTrace.tsx");
const lab = read("../src/features/verification/VerificationLab.tsx");
const live04 = lab.slice(lab.indexOf("export function TwinBenchExperience"));
const verdict = read("../src/ui/Verdict.tsx");
const experiences = read("../src/experiences.tsx");
const css = read("../src/p4-fix-1109.css");

test("STEP02: every suspect must be judged before moving to the next output", () => {
  assert.match(live02, /const pending = suspects\.filter\(item => !next\[item\]\)/);
  assert.match(live02, /if \(pending\.length\) \{/);
  assert.match(live02, /const advancing = useRef\(false\)/);
  assert.match(live02, /const unstamp = \(id: string\)/);
  // a judgement belongs to the output it was compared with
  assert.match(live02, /causesOf\(likely\[0\]\)\.forEach\(item => \{ delete kept\[item\]; \}\)/);
});

test("STEP02: change times used by the feedback are shown on the play surface", () => {
  assert.match(live02, /에 기준과 달라짐`/);
  assert.match(live02, /className="etWhen"/);
  assert.match(live02, /<em>유력<\/em> 기준과 다르고 지금 출력보다 먼저 달라짐/);
  assert.doesNotMatch(live02, /재기|재 보세요/);
  assert.match(live02, /측정하기/);
  assert.match(live02, /다음 시험에서 먼저 확인할 가설을 선택하세요/);
});

test("STEP02: polaroids use real part photos instead of icon cards", () => {
  assert.doesNotMatch(domino, /OK\("gear", "기어 위치", SENSOR/);
  assert.doesNotMatch(domino, /label: "(계기판 출력 게이지|파워다운 표시등|후방 추돌 경고)", img: ECU/);
  assert.doesNotMatch(live02, /polIcon/);
  assert.match(css, /\.eeTrace :is\(\.etEvidence, \.etMugs\) \.pol \{ display: flex !important; flex-direction: column; aspect-ratio: 88 \/ 107/);
});

test("Stage entry overlay is shown on every entry with a 풀기 button and pauses the race", () => {
  assert.doesNotMatch(verdict, /localStorage\.setItem\(storageKey/);
  assert.match(verdict, /풀기 \(Enter\)/);
  assert.match(experiences, /if \(introOpenRef\.current\) return previous;/);
  assert.match(experiences, /if \(!countdown \|\| introOpen\) return;/);
  assert.doesNotMatch(experiences, /className="vehicleReadout"/);
});

test("STEP04: input conditions change the executed stimulus; expected outputs come from the normal model", () => {
  assert.match(lab, /const INPUT_EXEC: Record<CaseId/);
  assert.match(live04, /const activeContract = useMemo\(\(\) => contractForInput\(/);
  assert.match(live04, /simulate\(caseId, tech\.tech, fixed, activeContract\.execution\)/);
  assert.match(live04, /assessContractRun\(activeContract, lv, lst\)/);
  const contract = buildVerificationContract("propulsion", { hypothesisId: "vcu_sw", hypothesisLabel: "VCU", suspectSection: "VCU" });
  const step100 = { ...contract.execution, stimulus: { ...contract.execution.stimulus, startValue: 0, endValue: 100, rampSeconds: 0 } };
  const normal = simulate("propulsion", "boundary", true, step100).levels.vehicle.find(sig => sig.id === "mot");
  // 100 % pedal: map 340 Nm is limited to the 260 Nm available torque in the normal design
  assert.ok(Math.abs(normal.ref.at(-1) - 260) < 3, `normal motor torque at 100 % = ${normal.ref.at(-1)}`);
});

test("STEP04 A/B: removing the true cause matches the normal model; a wrong cause keeps the fault", () => {
  for (const caseId of ["propulsion", "thermal", "brake"]) {
    const contract = buildVerificationContract(caseId, { hypothesisId: "x", hypothesisLabel: "x", suspectSection: "x" });
    const fixed = simulate(caseId, "req", true, contract.execution).levels.vehicle;
    const fault = simulate(caseId, "req", false, contract.execution).levels.vehicle;
    assert.ok(fixed.every(sig => sig.run.every((v, i) => Math.abs(v - sig.ref[i]) <= sig.max * .02)), `${caseId}: cause removed = normal`);
    assert.ok(fault.some(sig => sig.run.some((v, i) => Math.abs(v - sig.ref[i]) > sig.max * .02)), `${caseId}: wrong cause keeps the fault`);
  }
  assert.match(lab, /const CAUSES: Record<CaseId, \{ hyp: string; name: string; type: string; where: string; desc: string \}\[\]>/);
  assert.match(live04, /className="causeType">\{item\.type\}/);
  assert.match(live04, /simulate\(caseId, tech\.tech, causeOk, activeContract\.execution\)/);
  // the report no longer reveals the answer before the player picks the final cause
  assert.doesNotMatch(live04, /<b>원인: \{meta\.hypotheses\.find\(h => h\.truth\)!\.label\}<\/b>/);
});
