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

test("latest scenario scope keeps every root cause in software", () => {
  assert.match(scenarios, /출력 어댑터 SW의 실행 순서/);
  assert.match(scenarios, /I\/O 어댑터 SW가 압력 계산값/);
  assert.doesNotMatch(scenarios, /fanStuck|brakePressureGain|truth:\s*true[^\n]*(팬 모터|유압 모듈|캘리퍼)/);
  assert.match(simModel, /output-adapter SW skips the PWM write/);
  assert.match(simModel, /output-interface SW applies a second scale/);
  assert.match(vehicleSim, /fanPwmOutputScale/);
  assert.match(vehicleSim, /brakeCommandScale/);
});
