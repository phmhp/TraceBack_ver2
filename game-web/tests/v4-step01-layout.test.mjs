import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const experience = readFileSync(new URL("../src/experiences.tsx", import.meta.url), "utf8");
const latestCss = readFileSync(new URL("../src/p4-fix-1109.css", import.meta.url), "utf8");
const capture = readFileSync(new URL("../scripts/capture-ui.mjs", import.meta.url), "utf8");
const vehicleLayout = readFileSync(new URL("../src/features/garage/VehicleLayout.tsx", import.meta.url), "utf8");
const eeBlueprint = readFileSync(new URL("../src/features/garage/EeBlueprint.tsx", import.meta.url), "utf8");
const simulinkDiagram = readFileSync(new URL("../src/features/garage/SimulinkDiagram.tsx", import.meta.url), "utf8");
const eeTrace = readFileSync(new URL("../src/features/board/EeTrace.tsx", import.meta.url), "utf8");
const replayConfirm = readFileSync(new URL("../src/ui/ReplayConfirm.tsx", import.meta.url), "utf8");
const refPuzzle = readFileSync(new URL("../src/features/wiring/RefPuzzle.tsx", import.meta.url), "utf8");
const verificationLab = readFileSync(new URL("../src/features/verification/VerificationLab.tsx", import.meta.url), "utf8");
const verificationContract = readFileSync(new URL("../src/game/verificationContract.ts", import.meta.url), "utf8");
const scenarios = readFileSync(new URL("../src/game/scenarios.ts", import.meta.url), "utf8");
const simModel = readFileSync(new URL("../src/features/verification/simModel.ts", import.meta.url), "utf8");
const vehicleSim = readFileSync(new URL("../src/sim/vehicleSim.ts", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const gameShell = readFileSync(new URL("../src/ui/game-shell.tsx", import.meta.url), "utf8");

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

test("UI-RULE-01 shares live header gap, folder subtitle, and stage navigation rails", () => {
  assert.match(gameShell, /className="stageHeaderInfo"/);
  assert.match(gameShell, /className="gameHeaderSpacer"/);
  assert.match(gameShell, /export function StageFolderSubtitle/);
  assert.match(experience, /학습 대상: \{chosen \? content\.label : "전체 도메인"\}/);
  assert.match(eeTrace, /출발 증거: \{scenario\.symptom\}/);
  assert.match(refPuzzle, /이전 결과: \{section\}/);
  assert.match(verificationLab, /이전 결과: 테스트 설계서/);
  assert.match(latestCss, /grid-template-columns: minmax\(92px, 10fr\) minmax\(220px, 30fr\) minmax\(0, 40fr\) minmax\(132px, 20fr\)/);
  assert.match(latestCss, /\.stageFolderSubtitle \{/);
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
  assert.match(experience, /window\.setTimeout\(\(\) => \{ inputHold\.current = null; toggleInput\(inputIndex\); \}, 380\)/);
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
  assert.match(vehicleLayout, /wheel\.current\.rotation\.z -= delta \* 7/);
  assert.match(vehicleLayout, /<PartModel id="wheel"/);
  assert.match(vehicleLayout, /domain === "drive" && \[0, 2, 3\]\.includes\(feature\) && inputOn/);
  assert.match(vehicleLayout, /<CarContext strong=\{shell\} wheelActive=\{wheelActive\}/);
});

test("K-5 keeps the reverse trace central, evidence/stack on the right, and candidates below", () => {
  assert.match(eeTrace, /중앙 도미노 역추적/);
  assert.match(eeTrace, /관찰·계측 증거/);
  assert.match(eeTrace, /etEvidenceTabs/);
  assert.match(eeTrace, /검증 전에는 확정하지 않음/);
  assert.match(latestCss, /\.etLayout > \.etBoard \{ grid-column: 1; grid-row: 1; \}/);
  assert.match(latestCss, /\.etLayout > \.etEvidence \{ grid-column: 2; grid-row: 1 \/ 3; \}/);
  assert.match(latestCss, /\.etLayout > \.etMugs \{ grid-column: 1; grid-row: 2; \}/);
  assert.match(latestCss, /-webkit-line-clamp: 2/);
});

test("P0 STEP02 keeps initial observations compact and attaches earned output polaroids by click", () => {
  const liveTrace = eeTrace.slice(eeTrace.indexOf("export function EeTraceV2"), eeTrace.indexOf("// ===== v3"));
  assert.match(liveTrace, /const \[attached, setAttached\]/);
  assert.match(liveTrace, /const attachEvidence/);
  assert.match(liveTrace, /증거판에 붙이기/);
  assert.match(liveTrace, /item\.id === "quote" && phase === "evidence"/);
  assert.doesNotMatch(liveTrace, /id: "road"/);
  assert.match(latestCss, /grid-template-rows: minmax\(0, 1fr\) 154px 58px/);
});

test("STEP02 keeps evidence and reasoning stack in the persisted right rail without displacing candidates", () => {
  const liveTrace = eeTrace.slice(eeTrace.indexOf("export function EeTraceV2"), eeTrace.indexOf("// ===== v3"));
  assert.match(liveTrace, /const \[memoTab, setMemoTab\] = useState<"evidence" \| "stack">\(saved\.memoTab/);
  assert.match(liveTrace, /attached, sorted, memoTab, bubble/);
  assert.match(liveTrace, /etEvidenceTabs/);
  assert.match(liveTrace, /추리 보드/);
  assert.doesNotMatch(liveTrace, /etEvidenceAttach/);
  assert.match(liveTrace, /etEvidenceStack/);
  assert.match(liveTrace, /etReasonPath/);
  // N-S02-01 (2026-11-11): the stack shows only the trace; selected candidates and hypotheses stay internal.
  assert.doesNotMatch(liveTrace, /etReasonCandidates/);
  assert.doesNotMatch(liveTrace, /etReasonHypotheses/);
  assert.match(liveTrace, /etStack/);
  // T-25: the hypothesis handed to STEP03 is the player's own pick, never the answer key.
  assert.doesNotMatch(liveTrace, /SELECT_HYPOTHESIS", id: scenario\.root/);
  assert.match(liveTrace, /carryId/);
  assert.match(liveTrace, /etCandidateRow/);
  assert.match(latestCss, /\.etEvidence > header > \.etEvidenceTabs/);
  assert.match(latestCss, /\.etMugs \{ display: flex !important/);
  assert.match(latestCss, /\.etCandidateRow \{[\s\S]*overflow: hidden/);
});

test("FB-P0-01 makes the STEP02 rail a folder-tabbed evidence and reasoning board", () => {
  assert.match(eeTrace, /etStageFolder/);
  assert.match(eeTrace, /관찰한 이상 증상에서 출발해 고장 원인 후보를 좁히세요/);
  assert.match(eeTrace, /item\.dom && !attached\.includes\(item\.id\)/);
  assert.match(latestCss, /\.eeTrace \.etEvidence \{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\)/);
  assert.match(latestCss, /\.eeTrace \.etEvidence \.pol \{[\s\S]*aspect-ratio: 1 \/ 1\.22/);
  assert.match(latestCss, /\.eeTrace \.etEvidence \.pol \.polPhoto \{[\s\S]*aspect-ratio: 1 \/ \.97/);
  assert.match(latestCss, /\.eeTrace \.stageProgressAction \{ position: static !important/);
});

test("FB-P1-01 keeps hover part labels as plain chocolate text", () => {
  assert.match(latestCss, /\.garage3dLabel\.hoverPartLabel \{[\s\S]*border: 0 !important[\s\S]*color: #6b422d !important[\s\S]*font: 400 12px/);
});

test("FB-P1-01 selects real Vehicle/System parts without treating camera drags as clicks", () => {
  assert.match(vehicleLayout, /selectedIndex = null, onSelect/);
  assert.match(vehicleLayout, /if \(\(event as any\)\.delta > 6\) return/);
  assert.match(vehicleLayout, /onSelect\?\.\(node\.index\)/);
  assert.match(vehicleLayout, /garageVehiclePartLabel/);
  assert.match(experience, /const \[selectedVehiclePart, setSelectedVehiclePart\] = useState<number \| null>\(null\)/);
  assert.match(experience, /selectedVehiclePart=\{selectedVehiclePart\}/);
  assert.match(experience, /onVehiclePartSelect=\{index => \{ setSelectedVehiclePart\(index\); setActiveStep\(index\); play\("pop"\); \}\}/);
  assert.match(experience, /vehiclePartInfo/);
  assert.match(latestCss, /\.vehiclePartInfo \{/);
});

test("FB-P1-01 long-presses a real input part before preserving its Vehicle/System selection", () => {
  assert.match(vehicleLayout, /detail: \{ action, index: node\.index \}/);
  assert.match(experience, /const toggleInput = \(inputIndex\?: number\)/);
  assert.match(experience, /setSelectedVehiclePart\(inputIndex\)/);
  assert.match(experience, /beginInputHold\(Number\.isInteger/);
  assert.match(experience, /입력이 선택됨 · 다음 스텝으로 신호를 관찰하세요/);
  assert.match(latestCss, /\.vehiclePartInfo > strong\.inputActive/);
});

test("FB-P1-02 keeps E/E signal lines behind components and view controls in the body", () => {
  assert.match(eeBlueprint, /viewBox="0 0 8 8" refX="6\.5" refY="4" markerWidth="4" markerHeight="4"/);
  assert.match(eeBlueprint, /M0 0 L8 4 L0 8 Z/);
  assert.match(experience, /className="eeBodyTools" role="group" aria-label="E\/E 보기"/);
  assert.match(experience, /onEeLayerChange=\{layer => \{ setEeLayer\(layer\); play\("pop"\); \}\}/);
  assert.doesNotMatch(experience, /className="eeLayerSwitch"/);
  assert.match(latestCss, /\.eeBlueprint \.eeFlow \{ z-index: 1 !important; \}/);
  assert.match(latestCss, /\.eeBlueprint \.eeCol, \.eeBlueprint \.eeCore \{ position: relative; z-index: 3; \}/);
  assert.match(latestCss, /\.eeBodyTools \{ position: absolute; z-index: 12; top: 12px; right: 12px/);
});

test("FB-P1-03 layers compact Control SW arrows under ports and uses one shared control rail", () => {
  assert.match(simulinkDiagram, /viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4"/);
  assert.match(simulinkDiagram, /className="simWireLayer"[\s\S]*className="simPortLayer"[\s\S]*className="simNodeLayer"/);
  assert.match(simulinkDiagram, /markerEnd=\{`url\(#\$\{wire\.cls\.includes\("feedback"\) \? "arrowFb" : "arrow"\}\)`\}/);
  assert.match(experience, /const onStep = \(event: Event\) => \{ stopAuto\(\); setActiveStep/);
  assert.match(experience, /return \(\) => window\.clearInterval\(timer\);/);
  assert.match(latestCss, /\.garageMechanismCard > \.garageStepControls \{ top: auto; right: 14px; bottom: 14px; max-width: calc\(100% - 28px\);/);
  assert.match(latestCss, /\.garageMechanismCard > \.garageStepControls \.ctlBtn \{ width: 96px; min-width: 96px; height: 36px; \}/);
});

test("FB-P1-04 keeps the race HUD in reserved symmetric lanes", () => {
  assert.match(experience, /className="raceTopHud"[\s\S]*className="raceIdentity"[\s\S]*className="raceTripHud"/);
  assert.match(latestCss, /\.raceV2 \.raceTopHud \{ position: absolute; z-index: 5; left: 14px; top: 13px;/);
  assert.match(latestCss, /\.raceV2 \.raceTopHud \.raceIdentity > button img \{ width: 30px; height: 30px;/);
  assert.match(latestCss, /\.raceV2 \.cockpitGauge\.cluster1109, \.raceV2 \.raceMiniMap \{ box-sizing: border-box; width: 164px !important; min-height: 132px; bottom: 18px !important;/);
  assert.match(latestCss, /body:has\(\.raceV2\) \.soundToggle \{ right: 14px; top: 72px; bottom: auto; \}/);
});

test("FB-P1-05 keeps the design sheet fixed while its text and confirmation stamp print", () => {
  assert.match(refPuzzle, /className="rpBoardZoom rpZoomTools"/);
  assert.match(refPuzzle, /STEP04 테스트 설계서 · 보기/);
  assert.match(refPuzzle, /STEP03 → STEP04 · 테스트 설계서/);
  assert.match(refPuzzle, /설계서 확정/);
  assert.match(verificationLab, /STEP03 테스트 설계서/);
  assert.match(latestCss, /\.verificationContractModal > article\.specSheet\.receiptPrinting \{ animation: none; transform: none; \}/);
  assert.match(latestCss, /@keyframes specSheetTextPrint/);
  // P2: the confirm button lives inside the paper (static, no tilt) and only the sheet content reveals top to bottom.
  assert.match(latestCss, /\.specSheet \.contractCommit \{ position: static !important;/);
  assert.match(latestCss, /@keyframes ssReveal/);
});

test("replay confirmation uses the shared stamp action treatment without changing dialog controls", () => {
  assert.match(replayConfirm, /className="replayCancel"/);
  assert.match(replayConfirm, /className="primary replayConfirmAction"/);
  assert.match(latestCss, /\.replayConfirm footer \.replayConfirmAction \{ border: 2px solid #a0281e/);
  assert.match(latestCss, /\.replayConfirm footer \.replayConfirmAction:hover:not\(:disabled\)/);
  assert.match(latestCss, /\.replayConfirm footer button:focus-visible/);
});

test("K-6 hands an explicit STEP03 experiment contract to STEP04", () => {
  for (const field of ["hypothesisId", "objective", "preconditions", "stimulus", "expected", "observations", "comparison", "limitation", "createdBy"]) {
    assert.match(verificationContract, new RegExp(field));
  }
  assert.match(refPuzzle, /contractStorageKey/);
  assert.match(refPuzzle, /STEP03 → STEP04 · 테스트 설계서/);
  assert.match(verificationLab, /fallbackVerificationContract/);
  assert.match(verificationLab, /STEP03 테스트 설계서/);
});

test("K-7 exposes every simulation view to Chrome QA without a technique-name quiz", () => {
  for (const tab of ["sw", "ecu", "plant", "graph"]) {
    assert.match(capture, new RegExp(`qa=TWIN_BENCH&tab=${tab}`));
  }
  assert.match(verificationLab, /requestedView/);
  assert.match(verificationLab, /같은 입력:/);
  assert.match(verificationLab, /가설 지지/);
  assert.match(verificationLab, /가설 반박/);
  assert.match(verificationLab, /판단 보류/);
  assert.match(verificationLab, /PASS/);
  assert.match(verificationLab, /FAIL/);
  assert.match(verificationLab, /INCONCLUSIVE|판정 불가/);
  assert.doesNotMatch(verificationLab.slice(verificationLab.indexOf("export function TwinBenchExperience")), /기법명 객관식/);
});

test("FB-P1-07 verifies the repaired software against one same-condition baseline", () => {
  const bench = verificationLab.slice(verificationLab.indexOf("export function TwinBenchExperience"));
  assert.match(bench, /const compareLevel: Lv = "vehicle"/);
  assert.match(bench, /동일 조건 기준선 비교 검증/);
  assert.match(bench, /정상 기준선/);
  assert.match(bench, /수정 후 결과/);
  assert.match(bench, /정상 범위 충족 여부 표시됨/);
  assert.match(bench, /inNormalRange\(sig\) \? "충족" : "미충족"/);
  assert.doesNotMatch(bench, /regression\.forEach/);
  assert.doesNotMatch(bench, /▶ 정상·사건 동시 실행/);
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
