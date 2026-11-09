import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const experience = readFileSync(new URL("../src/experiences.tsx", import.meta.url), "utf8");
const latestCss = readFileSync(new URL("../src/p4-fix-1109.css", import.meta.url), "utf8");
const capture = readFileSync(new URL("../scripts/capture-ui.mjs", import.meta.url), "utf8");

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
  assert.match(capture, /Emulation\.setDeviceMetricsOverride/);
  assert.match(capture, /\.garageMechanismCard/);
});
