import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const experience = readFileSync(new URL("../src/experiences.tsx", import.meta.url), "utf8");
const latestCss = readFileSync(new URL("../src/p4-fix-1109.css", import.meta.url), "utf8");
const capture = readFileSync(new URL("../scripts/capture-ui.mjs", import.meta.url), "utf8");
const vehicleLayout = readFileSync(new URL("../src/features/garage/VehicleLayout.tsx", import.meta.url), "utf8");
const eeBlueprint = readFileSync(new URL("../src/features/garage/EeBlueprint.tsx", import.meta.url), "utf8");

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
