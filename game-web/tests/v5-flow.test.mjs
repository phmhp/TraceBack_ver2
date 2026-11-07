import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const runtime = readFileSync(new URL("../src/game/runtime.ts", import.meta.url), "utf8");
const experience = readFileSync(new URL("../src/experiences.tsx", import.meta.url), "utf8");
const polish = readFileSync(new URL("../src/v6.css", import.meta.url), "utf8");
const architecturePolish = readFileSync(new URL("../src/v7.css", import.meta.url), "utf8");
const physicsPolish = readFileSync(new URL("../src/v8.css", import.meta.url), "utf8");
const investigationPolish = readFileSync(new URL("../src/v9.css", import.meta.url), "utf8");
const earlyFlowPolish = readFileSync(new URL("../src/v10.css", import.meta.url), "utf8");
const latestPolish = readFileSync(new URL("../src/v11.css", import.meta.url), "utf8");
const learningPolish = readFileSync(new URL("../src/v12.css", import.meta.url), "utf8");
const finalPolish = readFileSync(new URL("../src/v14.css", import.meta.url), "utf8");
const labAndFinalePolish = readFileSync(new URL("../src/v15.css", import.meta.url), "utf8");

test("pursuit state persists across investigation and guarantees two required faults", () => {
  assert.match(runtime, /raceDistance: number/);
  assert.match(runtime, /policeGapMeters: number/);
  assert.match(runtime, /s\.completedCases\.length < 2 \? 10 : 0/);
  // Faults appear under driving conditions, with a distance fallback so both always happen.
  assert.match(experience, /zoneThrottle\.current >= 1\.8 \|\| sim\.distance >= OVERTAKE_ZONE\[1\]/);
  assert.match(experience, /sim\.heat >= 84 \|\| sim\.distance >= CLIMB_ZONE\[1\]/);
  assert.match(runtime, /const routeGate = s\.caseId === "propulsion" \? 540/);
  assert.match(runtime, /policeGapMeters <= 0 \? enter\(s, "CAUGHT"\)/);
  assert.match(runtime, /nextScore = correct \? 20 : -20/);
  assert.match(runtime, /policeGapMeters: Math\.max\(s\.completedCases\.length < 2 \? 35 : 18/);
});

test("interaction rebuild keeps the requested core surfaces", () => {
  assert.match(experience, /OrbitControls/);
  assert.match(experience, /QUICK REPLAY/);
  assert.match(experience, /chooseWireNode/);
  assert.match(experience, /정상 시나리오 설계/);
  assert.match(experience, /내가 만든 설계/);
  assert.match(experience, /OTA 업데이트로 페달 신호 변환을 정상화했어/);
});

test("freeform detective board, race-quality replay, and polaroid wiring stay explicit", () => {
  assert.match(experience, /cardPositions/);
  assert.match(experience, /movePinned/);
  assert.match(experience, /evidenceThreads/);
  assert.match(experience, /onDoubleClick/);
  assert.match(experience, /ReplayRaceView/);
  assert.match(experience, /LabRaceView/);
  assert.match(experience, /logicNodePhoto/);
  assert.match(investigationPolish, /grid-template-columns:180px minmax\(0,1fr\) 198px/);
  assert.match(investigationPolish, /diagnostic-evidence-sheet-v1\.png/);
  assert.match(investigationPolish, /vehicle-component-cutouts-v1\.png/);
});

test("v7 architecture, hints, guided recovery, and wide wiring are present", () => {
  assert.match(experience, /featureFlows/);
  assert.match(experience, /DriveBriefing/);
  assert.match(experience, /PursuitRouteBar compact/);
  assert.match(experience, /힌트 보기 · -5m/);
  assert.match(experience, /FailureAnalysis/);
  assert.match(experience, /componentAssetPhoto/);
  assert.match(runtime, /GUIDED_REPAIR/);
  assert.match(runtime, /s\.policeGapMeters - 5/);
  assert.match(architecturePolish, /grid-template-areas:"canvas requirement" "tray tray"/);
});

test("v8 curved driving, tangible wiring, hidden QA solves, and 3D validation are present", () => {
  assert.match(experience, /const trackFrame/);
  assert.match(experience, /가드레일 접촉/);
  assert.match(experience, /DRIVE · 회생 Q\/E/);
  assert.match(experience, /EmbeddedBench3D/);
  assert.match(experience, /right-drag|우클릭 드래그/i);
  assert.match(experience, /className="secretSolve"/);
  assert.match(runtime, /case "SOLVE_BOARD"/);
  assert.match(runtime, /case "DEV_SOLVE"/);
  assert.match(physicsPolish, /grid-template-areas:"canvas requirement"/);
  assert.match(physicsPolish, /\.logicNode \.wirePort\.input/);
});

test("v9 keeps the three-layer garage, automatic recovery, and pirate-ship finale", () => {
  assert.match(experience, /const garageLayerSource = \[0, 1, 3\]/);
  assert.match(experience, /VehiclePlatformShell active/);
  assert.doesNotMatch(experience, /이 탭은 왜 통과했나요/);
  assert.match(experience, /초 후 달리던 지점에서 자동 주행 복귀/);
  assert.match(experience, /ShipBoardingSequence/);
  assert.match(runtime, /SHIP_BOARDING/);
  assert.match(investigationPolish, /\.shipBoarding/);
});

test("v10 uses variable-depth domain flows, route-triggered faults, and explicit board threading", () => {
  assert.match(experience, /featureLayerOverrides/);
  assert.match(experience, /function DomainSignature/);
  assert.match(experience, /function HeistCutsceneScene/);
  assert.match(experience, /previous\.distance >= 45/);
  assert.doesNotMatch(experience, /className="threadHandle"/);
  assert.doesNotMatch(experience, /pinSocket evidencePin/);
  assert.match(experience, /onPointerDown=\{event => beginThread\(card\.id, event\)\}/);
  assert.match(experience, /threadDraft/);
  assert.match(experience, /linkedEvidence\.length < 2/);
  assert.match(experience, /function RearMirror3D/);
  assert.match(experience, /<PoliceInterceptor spin=\{gap\*\.08\}/);
  assert.match(experience, /function CivilianCar/);
  assert.match(experience, /START 시동 버튼/);
  assert.match(experience, /전륜 PMSM·감속기/);
  assert.match(earlyFlowPolish, /@keyframes threadCrawl/);
  assert.match(latestPolish, /\.boardV3 \.investigationBoard\.detectiveLayout/);
  assert.match(latestPolish, /\.faultBeacon\{left:22px/);
  assert.match(learningPolish, /\.journeyRail/);
  assert.match(learningPolish, /\.boardToolbox/);
});

test("v14 keeps strict tools, the four-level V-model lab, underfloor EV architecture, and jump finale", () => {
  assert.match(experience, /type BenchTab = "sw" \| "embedded" \| "system" \| "vehicle"/);
  assert.match(experience, /요구사항 기반 V-모델 검증 실험실/);
  assert.match(experience, /TEST CASE · \{report\.id\}/);
  assert.match(experience, /경계값/);
  assert.match(experience, /고장 주입/);
  assert.doesNotMatch(experience, /검증 여권/);
  assert.match(experience, /function ShipJumpScene/);
  assert.match(experience, /THELMA-STYLE DOCK JUMP/);
  assert.match(experience, /FINISH_ESCAPE", distance: sim\.distance, gap: Math\.max\(10, sim\.gap\)/);
  assert.match(runtime, /finishDistance >= 1080/);
  assert.match(experience, /4\.70m × 1\.85m × 1\.45m/);
  assert.match(experience, /하부 배터리\/HV·LV 분기 하니스/);
  assert.doesNotMatch(experience, /className="wirePort/);
  assert.doesNotMatch(experience, /className="pinSocket/);
  assert.match(finalPolish, /cursor-hand-open-v1\.png/);
  assert.match(finalPolish, /cursor-hand-grab-v1\.png/);
  assert.match(finalPolish, /\.wirePort\{display:none!important\}/);
  assert.match(labAndFinalePolish, /lab-comparison-board-v1\.png/);
  assert.match(labAndFinalePolish, /ui-button-plate-v1\.png/);
  assert.match(labAndFinalePolish, /\.benchV2 \.benchSwVisual\.detailed/);
  assert.match(labAndFinalePolish, /width:min\(470px,40%\)!important/);
});
