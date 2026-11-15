import test from "node:test";
import assert from "node:assert/strict";
import { dispatch, initialCampaign } from "../src/game/runtime.ts";
import { LEVELS, levelStatus } from "../src/game/levels.ts";
import { SCENARIOS, SCENARIO_META, hypothesisStatus, judgeRun } from "../src/game/scenarios.ts";
import { simulate, firstMismatch } from "../src/features/verification/simModel.ts";
import { buildVerificationContract } from "../src/game/verificationContract.ts";
import { readFileSync } from "node:fs";

const at = (completed) => ({ ...initialCampaign(), scene: "LEVEL_SELECT", completedCases: completed });

test("N01 level: bonus level 4 after thermal, finale is level 5", () => {
  assert.deepEqual(LEVELS.map(l => [l.level, l.kind, l.caseId]), [[1, "required", "propulsion"], [2, "required", "thermal"], [3, "bonus", "brake"], [4, "bonus", "regen"], [5, "finale", null]]);
  const regenLevel = LEVELS[3];
  assert.equal(levelStatus(at([]), regenLevel), "locked");
  assert.equal(levelStatus(at(["propulsion", "thermal"]), regenLevel), "open");
  assert.equal(levelStatus(at(["propulsion", "thermal", "regen"]), regenLevel), "cleared");
  const started = dispatch(at(["propulsion", "thermal"]), { type: "START_LEVEL", level: 4 });
  assert.equal(started.scene, "BOARD"); assert.equal(started.caseId, "regen");
  assert.equal(dispatch(at(["propulsion"]), { type: "START_LEVEL", level: 4 }).scene, "LEVEL_SELECT", "locked before thermal");
  assert.equal(dispatch(at(["propulsion", "thermal"]), { type: "START_LEVEL", level: 5 }).scene, "SHIP_ESCAPE");
  assert.equal(dispatch(at(["propulsion"]), { type: "START_LEVEL", level: 5 }).scene, "LEVEL_SELECT", "finale needs both required levels");
});

test("N01 repair returns to the level screen with stars and keeps the other levels", () => {
  const s = { ...initialCampaign(), scene: "REPAIR", caseId: "regen", completedCases: ["propulsion", "thermal"], hints: 0, gapJudgements: { regen: "correct" } };
  const done = dispatch(s, { type: "APPLY_REPAIR" });
  assert.equal(done.scene, "LEVEL_SELECT");
  assert.ok(done.completedCases.includes("regen"));
  assert.equal(done.levelStars.regen, 3);
});

test("N01 data is consistent: sheet numbers, one true hypothesis, board first deviation, model", () => {
  const scenario = SCENARIOS.regen, meta = SCENARIO_META.regen;
  assert.match(scenario.symptom, /경고등은 없습니다/);
  assert.equal(meta.hypotheses.filter(h => h.truth).length, 1);
  assert.equal(meta.hypotheses.find(h => h.truth).id, scenario.root);
  assert.ok(meta.hypotheses.some(h => /HW/.test(h.label)), "a hardware cause appears only as a refutable candidate");
  // the board data is a .tsx file (React + CSS imports), so it is checked from the source text
  const src = readFileSync(new URL("../src/features/board/DominoTrace.tsx", import.meta.url), "utf8");
  const board = src.slice(src.indexOf('  regen: {\n    start: "accel"'), src.indexOf("export const fmt"));
  assert.match(board, /start: "accel", first: "vcu_out"/);
  const times = Object.fromEntries([...board.matchAll(/id: "(\w+)"[^\n]*status: "bad", t: (\d+)/g)].map(m => [m[1], Number(m[2])]));
  assert.equal(times.vcu_out, 10);
  assert.ok(Object.entries(times).every(([id, t]) => id === "vcu_out" || t > times.vcu_out), "everything else differs later than the first deviation");
  assert.match(board, /id: "vcu_out"[^\n]*zone: "제어기"/);
  assert.equal((board.match(/ok: true/g) ?? []).length, 1, "one correct suspect section");
  // the model reproduces the sheet: -40 Nm request -> +40 Nm command, -0.5 -> +0.5 m/s2
  const contract = buildVerificationContract("regen", { hypothesisId: "vcu_sign", hypothesisLabel: "x", suspectSection: "x", expectedValue: "x" });
  const fault = simulate("regen", "req", false, contract.execution), fixed = simulate("regen", "req", true, contract.execution);
  const last = (levels, lv, id) => levels[lv].find(s => s.id === id).run.at(-1);
  assert.ok(Math.abs(last(fault.levels, "unit", "vcuOut") - 40) < 1);
  assert.ok(Math.abs(last(fault.levels, "vehicle", "acc") - .5) < .02);
  assert.ok(Math.abs(last(fixed.levels, "vehicle", "acc") + .5) < .02);
  assert.equal(fault.levels.unit[firstMismatch(fault.levels.unit)].id, "vcuOut");
  assert.equal(firstMismatch(fixed.levels.unit), null);
});

test("N01 judging: SW unit test supports the VCU hypothesis, vehicle test only holds, wiring is refuted by the earlier command", () => {
  const runAt = (level) => { const contract = buildVerificationContract("regen", { hypothesisId: "x", hypothesisLabel: "x", suspectSection: "x", expectedValue: "x" }); const list = simulate("regen", "req", false, contract.execution).levels[level];
    const obs = {}; for (const s of list) { const d = s.run.at(-1) - s.ref.at(-1); obs[s.id] = Math.abs(d) < (s.max - (s.min ?? 0)) * .02 ? "same" : d > 0 ? "higher" : "lower"; } return { level, fixed: false, obs }; };
  const verdict = (level, id) => judgeRun("regen", runAt(level)).find(h => h.id === id).verdict;
  assert.equal(verdict("unit", "vcu_sign"), "supported");
  assert.equal(verdict("vehicle", "vcu_sign"), "open");
  assert.equal(verdict("embedded", "inv_wire"), "refuted");
  assert.equal(verdict("vehicle", "inv_wire"), "refuted");
  const status = hypothesisStatus("regen", [runAt("unit")]);
  assert.equal(status.find(h => h.id === "vcu_sign").status, "supported");
  assert.equal(status.find(h => h.id === "brake_sw").status, "refuted");
});
