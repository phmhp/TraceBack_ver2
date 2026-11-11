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
  assert.match(lab, /const CAUSES: Record<CaseId, \{ hyp: string; name: string; type: string; where: string; desc: string; img: string \}\[\]>/);
  // every cause card shows a real part photo from the STEP02 polaroid assets
  assert.equal((lab.match(/img: CAUSE_IMG\.(board|part)\("[a-z_]+"\)/g) ?? []).length, 8);
  assert.match(live04, /<span className="causePhoto"><img src=\{item\.img\} alt="" \/><\/span>/);
  // A/B compares every vehicle signal over the whole run (regression), not the last sample only
  assert.match(live04, /<th>전 구간 최대 차이<\/th>/);
  assert.match(live04, /원인 제거 외에 달라진 동작이 없는지\(회귀\) 확인해요\. 실제 수리 효과는 수리 뒤 재시험에서 따로 확인해요/);
  // before the two required cases the stopped car is not caught and the interceptor is not drawn
  assert.match(experiences, /<RaceWorld sim=\{dialogueSim\} ship=\{false\} policeVisible=\{state\.completedCases\.length >= 2\} \/>/);
  assert.match(live04, /className="causeType">\{item\.type\}/);
  assert.match(live04, /simulate\(caseId, tech\.tech, causeOk, activeContract\.execution\)/);
  // the report no longer reveals the answer before the player picks the final cause
  assert.doesNotMatch(live04, /<b>원인: \{meta\.hypotheses\.find\(h => h\.truth\)!\.label\}<\/b>/);
});

test("STEP04 learning flow: purpose, material roles, input cards, PASS/FAIL meaning, evidence guide", () => {
  assert.match(live04, /title="실험 검증" goal="추리한 고장 원인 가설이 실제 원인인지 시험으로 확인합니다\."/);
  assert.match(live04, /className="qaScrim"/);
  assert.match(live04, /className="qaMatRole"><b>정상 기준<\/b>/);
  assert.match(live04, /className="qaMatRole"><b>고장 당시 기록<\/b>/);
  // input cards: test type + purpose, sequence printed from the executed contract (not hand-written)
  assert.match(lab, /const INPUT_INFO: Record<CaseId/);
  assert.match(lab, /function inputSequenceText\(execution: VerificationExecution, base: VerificationExecution\)/);
  assert.match(live04, /inputSequenceText\(exec, contract\.execution\)/);
  // PASS/FAIL is a test result, not the cause judgement; deviating signals are listed from the assessment
  assert.match(live04, /관찰한 출력이 정상 기준의 기대값·허용 범위를 만족했어요/);
  assert.match(live04, /a\.outOfRangeSignalIds, \.\.\.a\.expectedOutputFailures/);
  assert.match(live04, /시험 결과일 뿐, 원인 판정은 아래 질문에서 신호 근거로 따로 해요/);
  // evidence guide and next-level hint come from the scenario rules
  assert.match(live04, /const decisiveLevels = QA_LEVELS\.filter/);
  assert.match(live04, /다음에는 \$\{next\.join\(" 또는 "\)\}을 골라 이 가설로 다시 실행하세요/);
  assert.match(live04, /className="finalJudge"/);
  assert.match(live04, /<span>한계<\/span>\{contract\.limitation\}/);
});

test("Scenario data: hold reasons and deciding levels match the judging rules under each fault", async () => {
  const { judgeRun, SCENARIO_META } = await import("../src/game/scenarios.ts");
  const asked = { propulsion: ["vcu_sw", "vcu_hw"], thermal: ["fan_sw", "fan_path", "fan_motor"], brake: ["blend_sw", "hyd_path", "caliper"] };
  const firstSplit = sig => sig.ref.findIndex((v, i) => Math.abs(sig.run[i] - v) > sig.max * .02);
  for (const caseId of Object.keys(asked)) {
    const contract = buildVerificationContract(caseId, { hypothesisId: "x", hypothesisLabel: "x", suspectSection: "x" });
    const sim = simulate(caseId, "req", false, contract.execution);
    for (const hyp of asked[caseId]) {
      const def = SCENARIO_META[caseId].hypotheses.find(h => h.id === hyp);
      const decided = [];
      for (const level of ["unit", "embedded", "vehicle"]) {
        const ids = contract.execution.observationSignalIds[level], obs = {};
        sim.levels[level].forEach(sig => { if (!ids.includes(sig.id)) return; const d = firstSplit(sig); obs[sig.id] = d < 0 ? "same" : sig.run[d] > sig.ref[d] ? "higher" : "lower"; });
        const verdict = judgeRun(caseId, { level, fixed: false, obs }).find(item => item.id === hyp).verdict;
        if (verdict === "open") {
          const hold = def.hold?.[level];
          assert.ok(hold && hold.seen && hold.unseen && hold.why, `${caseId}/${hyp}/${level}: hold reason`);
          assert.ok(hold.next.length && hold.next.every(lv => def.decideAt.includes(lv)), `${caseId}/${hyp}/${level}: next level decides`);
        } else {
          decided.push(level);
          assert.equal(def.hold?.[level], undefined, `${caseId}/${hyp}/${level}: no hold where the rules decide`);
        }
      }
      assert.deepEqual(def.decideAt, decided, `${caseId}/${hyp}: decideAt`);
      assert.ok(def.decide, `${caseId}/${hyp}: deciding test text`);
    }
  }
});

test("STEP04 hold feedback uses the scenario hold data; the dialogue bar shows the full reason after an answer", () => {
  assert.match(live04, /const hold = hypDef\?\.hold\?\.\[lastRun\.level\];/);
  assert.match(live04, /hypDef\?\.decideAt \? hypDef\.decideAt\.includes\(lv\)/);
  assert.match(live04, /: phase === "lab" && feedback\n\s+\? bubble/);
});

test("Live screens carry no emoji in the journey rail and STEP01 part cards", () => {
  const shell = read("../src/ui/game-shell.tsx");
  assert.doesNotMatch(shell, /🔒/);
  assert.match(shell, /<Icon name="lock" \/>/);
  assert.doesNotMatch(experiences, /🅿️|〰️|✉️/);
});
