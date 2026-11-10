import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const experience = readFileSync(new URL("../src/experiences.tsx", import.meta.url), "utf8");
const latestCss = readFileSync(new URL("../src/p4-fix-1109.css", import.meta.url), "utf8");
const capture = readFileSync(new URL("../scripts/capture-ui.mjs", import.meta.url), "utf8");
const vehicleLayout = readFileSync(new URL("../src/features/garage/VehicleLayout.tsx", import.meta.url), "utf8");
const eeBlueprint = readFileSync(new URL("../src/features/garage/EeBlueprint.tsx", import.meta.url), "utf8");
const eeTrace = readFileSync(new URL("../src/features/board/EeTrace.tsx", import.meta.url), "utf8");
const refPuzzle = readFileSync(new URL("../src/features/wiring/RefPuzzle.tsx", import.meta.url), "utf8");
const verificationLab = readFileSync(new URL("../src/features/verification/VerificationLab.tsx", import.meta.url), "utf8");
const verificationContract = readFileSync(new URL("../src/game/verificationContract.ts", import.meta.url), "utf8");
const scenarios = readFileSync(new URL("../src/game/scenarios.ts", import.meta.url), "utf8");
const simModel = readFileSync(new URL("../src/features/verification/simModel.ts", import.meta.url), "utf8");
const vehicleSim = readFileSync(new URL("../src/sim/vehicleSim.ts", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");

test("V4 STEP 01 keeps one stable frame across all three learning views", () => {
  assert.match(experience, /className="garageViewTools"/);
  assert.match(experience, /className="garageViewContext"/);
  assert.match(latestCss, /grid-template-rows:\s*44px minmax\(0, 1fr\) 122px/);
  assert.match(latestCss, /\.garageMechanismCard[^}]*min-height:\s*0/);
  assert.match(latestCss, /\.garageFlowPanel[^}]*height:\s*122px/);
});

test("V4 STEP 01 controls keep fixed geometry and visible sequence numbers", () => {
  assert.match(experience, /className={`ctlBtn conditionCtl/);
  assert.match(experience, /index \+ 1/);
  assert.match(experience, /mission\.needs\.length \+ 1/);
  assert.match(latestCss, /\.inputBar \.ctlBtn[^}]*width:\s*124px/);
  assert.match(latestCss, /\.inputBar \.mainCtl[^}]*width:\s*190px/);
  assert.match(latestCss, /\.garageMechanismCard > \.swStepControls/);
});

test("Chrome capture tooling can bypass intros and print layout metrics", () => {
  assert.match(capture, /TRACEBACK_CAPTURE_SKIP_INTROS/);
  assert.match(capture, /TRACEBACK_CAPTURE_METRICS/);
  assert.match(capture, /TRACEBACK_CAPTURE_GARAGE_ACTIVE/);
  assert.match(capture, /Emulation\.setDeviceMetricsOverride/);
  assert.match(capture, /\.garageMechanismCard/);
});

test("V4 STEP 01 is electrically quiet until conditions and live input are applied", () => {
  assert.match(vehicleLayout, /const energizedStep = inputOn \? activeStep : -1/);
  assert.match(vehicleLayout, /const on = inputOn && energizedStep > seg\.from\.index/);
  assert.match(eeBlueprint, /energizedThrough = active/);
  assert.match(experience, /energizedThrough=\{inputOn \? activeStep : -1\}/);
  assert.match(experience, /차량 OFF/);
  assert.match(experience, /disabled=\{locked\}/);
  assert.match(experience, /disabled=\{missing\.length > 0\}/);
});

test("K-4 keeps a manually inspected signal stage shared across the three views", () => {
  assert.match(experience, /const \[inputSelected, setInputSelected\] = useState\(false\)/);
  assert.match(experience, /const \[autoPlaying, setAutoPlaying\] = useState\(false\)/);
  assert.match(experience, /const signalVisible = inputSelected/);
  assert.match(experience, /inputOn=\{signalVisible\}/);
  assert.match(experience, /window\.setTimeout\(\(\) => \{ inputHold\.current = null; toggleInput\(\); \}, 380\)/);
  assert.match(experience, /다음 스텝/);
  assert.match(experience, /자동재생/);
  assert.match(experience, /setAutoPlaying\(false\)/);
  assert.doesNotMatch(experience, /setActiveStep\(0\); setRemoved\(null\); setEcuCard\(null\); setCulprit\(null\); setGuess\(null\); setLabMode\("flow"\); \}, \[feature, routeLevel\]\);/);
});

test("the representative propulsion lesson separates control, HV energy and mechanical torque to the wheel", () => {
  assert.match(experience, /MCU·인버터 ECU/);
  assert.match(experience, /전륜 PMSM 모터/);
  assert.match(experience, /전륜 감속기/);
  assert.match(experience, /차동기어/);
  assert.match(experience, /드라이브 샤프트/);
  assert.match(vehicleLayout, /hv_battery/);
  assert.match(vehicleLayout, /main_contactor/);
  assert.match(vehicleLayout, /flow="electrical_power"/);
  assert.match(vehicleLayout, /mechanical_torque/);
});

test("FB-P1-01 links the final drive signal to visible vehicle-wheel rotation", () => {
  assert.match(vehicleLayout, /function ContextWheel/);
  assert.match(vehicleLayout, /wheel\.current\.rotation\.x -= delta \* 7/);
  assert.match(vehicleLayout, /<PartModel id="wheel"/);
  assert.match(vehicleLayout, /domain === "drive" && \[0, 2, 3\]\.includes\(feature\) && inputOn/);
  assert.match(vehicleLayout, /<CarContext strong=\{shell\} wheelActive=\{wheelActive\}/);
});

test("K-5 keeps the reverse trace central, evidence on the right, and a tactile memo board below", () => {
  assert.match(eeTrace, /중앙 도미노 역추적/);
  assert.match(eeTrace, /관찰·계측 증거/);
  assert.match(eeTrace, /역추적 메모판/);
  assert.match(eeTrace, /검증 전에는 확정하지 않음/);
  assert.match(latestCss, /\.etLayout > \.etBoard \{ grid-column: 1; grid-row: 1; \}/);
  assert.match(latestCss, /\.etLayout > \.etEvidence \{ grid-column: 2; grid-row: 1; \}/);
  assert.match(latestCss, /\.etLayout > \.etMugs \{ grid-column: 1 \/ -1; grid-row: 2; \}/);
  assert.match(latestCss, /-webkit-line-clamp: 2/);
});

test("P0 STEP02 keeps initial observations compact and attaches earned output polaroids by click", () => {
  const liveTrace = eeTrace.slice(eeTrace.indexOf("export function EeTraceV2"), eeTrace.indexOf("// ===== v3"));
  assert.match(liveTrace, /const \[attached, setAttached\]/);
  assert.match(liveTrace, /const attachEvidence/);
  assert.match(liveTrace, /증거판에 붙이기/);
  assert.match(liveTrace, /item\.id === "quote" && phase === "evidence"/);
  assert.doesNotMatch(liveTrace, /id: "road"/);
  assert.match(latestCss, /grid-template-rows: minmax\(0, 1fr\) 176px 62px/);
});

test("K-6 hands an explicit STEP03 experiment contract to STEP04", () => {
  for (const field of ["hypothesisId", "objective", "preconditions", "stimulus", "expected", "observations", "comparison", "limitation", "createdBy"]) {
    assert.match(verificationContract, new RegExp(field));
  }
  assert.match(refPuzzle, /contractStorageKey/);
  assert.match(refPuzzle, /STEP03 → STEP04 · 실행 계약/);
  assert.match(verificationLab, /fallbackVerificationContract/);
  assert.match(verificationLab, /STEP03 계약/);
});

test("K-7 exposes every simulation view to Chrome QA without a technique-name quiz", () => {
  for (const tab of ["sw", "ecu", "plant", "graph"]) {
    assert.match(capture, new RegExp(`qa=TWIN_BENCH&tab=${tab}`));
  }
  assert.match(verificationLab, /requestedView/);
  assert.match(verificationLab, /같은 입력:/);
  assert.match(verificationLab, /가능성 높음/);
  assert.match(verificationLab, /가능성 낮음/);
  assert.match(verificationLab, /아직 모름/);
  assert.match(verificationLab, /PASS/);
  assert.match(verificationLab, /FAIL/);
  assert.match(verificationLab, /INCONCLUSIVE|판정 불가/);
  assert.doesNotMatch(verificationLab.slice(verificationLab.indexOf("export function TwinBenchExperience")), /기법명 객관식/);
});

test("M-01 through M-06 keep the whole view, fixed evidence slots, reverse trace, and receipt contract", () => {
  assert.match(experience, /전체보기/);
  assert.match(experience, /showAllDomains/);
  assert.match(eeTrace, /visiblePols/);
  assert.match(eeTrace, /next evidence|다음 증거 묶음/);
  assert.match(eeTrace, /출력에서 상류로 거슬러 올라간 경로/);
  assert.doesNotMatch(eeTrace.slice(eeTrace.indexOf("export function EeTraceV2"), eeTrace.indexOf("// ===== v3")), /<DominoFall/);
  assert.match(refPuzzle, /rpZoomTools/);
  assert.match(refPuzzle, /rpTrackZoom/);
  assert.match(refPuzzle, /receiptPrinting/);
  assert.match(latestCss, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important/);
  assert.match(latestCss, /receiptPrint/);
  assert.match(verificationLab, /모니터링/);
  assert.match(verificationLab, /qaTabQuestion/);
  assert.match(latestCss, /aspect-ratio: 3 \/ 4/);
});

test("N-01 and N-02 preserve each late-stage workspace, gate replay, and render the supplied specification sheet", () => {
  assert.match(eeTrace, /tb-step02-progress-/);
  assert.match(eeTrace, /ReplayConfirm/);
  assert.match(eeTrace, /tb-step03-progress-/);
  assert.match(refPuzzle, /tb-step04-progress-/);
  assert.match(latestCss, /verification-spec-sheet\.png/);
  assert.match(verificationLab, /tb-step04-progress-/);
  assert.match(verificationLab, /ReplayConfirm/);
  assert.match(latestCss, /specSheetPaper/);
});

test("P0 fresh games clear late-stage sessions while completed verification exposes an unclipped repair route", () => {
  assert.match(main, /event\.type === "NEW_GAME"/);
  assert.match(main, /tb-step/);
  assert.match(main, /tb-verification-contract-/);
  assert.match(verificationLab, /qaFinishBtn/);
  assert.match(verificationLab, /수리 적용 · 주행 복귀/);
  assert.match(latestCss, /\.qaFinishBtn/);
});

test("STEP02 through STEP04 reserve one bottom-right progression slot", () => {
  const liveTrace = eeTrace.slice(eeTrace.indexOf("export function EeTraceV2"), eeTrace.indexOf("// ===== v3"));
  assert.match(liveTrace, /className="dtNext stageProgressAction"/);
  assert.match(refPuzzle, /className="rpNext stageProgressAction"/);
  assert.match(verificationLab, /className="qaFinishBtn stageProgressAction"/);
  assert.match(latestCss, /\.stageProgressAction \{ position: fixed !important;[\s\S]*right: 112px !important;[\s\S]*bottom: 18px !important;[\s\S]*width: 214px !important/);
  assert.match(latestCss, /\.stageProgressAction \{[\s\S]*border: 2px solid #a0281e !important;[\s\S]*background: #fff6f3 !important/);
  assert.match(latestCss, /\.etMugs \{ padding-right: 236px !important; \}/);
  assert.match(refPuzzle, /className="primary contractCommit"/);
  assert.doesNotMatch(refPuzzle, /contractCommit stageProgressAction/);
});

test("latest scenario scope keeps every root cause in software", () => {
  assert.match(scenarios, /출력 어댑터 SW의 실행 순서/);
  assert.match(scenarios, /I\/O 어댑터 SW가 압력 계산값/);
  assert.doesNotMatch(scenarios, /fanStuck|brakePressureGain|truth:\s*true[^\n]*(팬 모터|유압 모듈|캘리퍼)/);
  assert.match(simModel, /output-adapter SW skips the PWM write/);
  assert.match(simModel, /output-interface SW applies a second scale/);
  assert.match(vehicleSim, /fanPwmOutputScale/);
  assert.match(vehicleSim, /brakeCommandScale/);
});
