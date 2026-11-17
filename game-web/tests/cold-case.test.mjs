import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dispatch, initialCampaign } from "../src/game/runtime.ts";
import { LEVELS, levelStatus } from "../src/game/levels.ts";
import { SCENARIOS, SCENARIO_META, hypothesisStatus } from "../src/game/scenarios.ts";
import { simulate, firstMismatch } from "../src/features/verification/simModel.ts";
import { buildVerificationContract } from "../src/game/verificationContract.ts";
import { COLD_FAULT, levelFaults, newFaultRuntime, stepFault, mergeEffects } from "../src/game/faultSchedule.ts";

const at = (completed) => ({ ...initialCampaign(), scene: "LEVEL_SELECT", completedCases: completed });
const exec0 = () => buildVerificationContract("cold", { hypothesisId: "x", hypothesisLabel: "x", suspectSection: "x" }).execution;

test("C06 level: bonus level 7 after thermal, a race first, finale is level 8", () => {
  const level = LEVELS[6];
  assert.deepEqual([level.level, level.kind, level.caseId], [7, "bonus", "cold"]);
  assert.equal(LEVELS[7].kind, "finale");
  assert.equal(levelStatus(at([]), level), "locked");
  assert.equal(levelStatus(at(["propulsion", "thermal"]), level), "open");
  const started = dispatch(at(["propulsion", "thermal"]), { type: "START_LEVEL", level: 7 });
  assert.equal(started.scene, "CHASE_RESUME"); assert.equal(started.caseId, "cold"); assert.equal(started.raceDistance, 0);
  const cue = dispatch(started, { type: "FAULT_CUE", caseId: "cold", distance: 400, gap: 100, elapsed: 20 });
  assert.equal(cue.scene, "FAULT_CUE"); assert.equal(dispatch(cue, { type: "CONTINUE_FAULT" }).scene, "BOARD");
});

test("C06 race fault: lifting the pedal at speed inside the cold segment multiplies the coasting deceleration", () => {
  assert.deepEqual(levelFaults("resume", "cold").map(s => s.id), ["case-cold"]);
  const ctx = (distanceM) => ({ speedKph: 60, pedal: 0, braking: false, gear: "D", steerAbs: 0, distanceM, elapsedS: 20, sinceEvent: {}, zones: [], ready: true });
  let rt = newFaultRuntime(), out;
  for (let i = 0; i < 20; i++) { out = stepFault(COLD_FAULT, rt, ctx(300), .05, () => 0); rt = out.runtime; }
  assert.ok(out.active && mergeEffects([out.effect]).regenScale === 3);
  const later = stepFault(COLD_FAULT, newFaultRuntime(), ctx(1200), 1, () => 0);
  assert.ok(!later.active, "after the cold segment the battery limit is no longer the issue");
});

test("C06 sim: only the brake domain's own limit leaves the reference; BMS and gateway limits stay normal", () => {
  const v = simulate("cold", "req", false, exec0()).levels.vehicle;
  const by = Object.fromEntries(v.map(s => [s.id, s]));
  assert.deepEqual(by.bms.run, by.bms.ref); assert.deepEqual(by.gw.run, by.gw.ref);
  assert.equal(Math.max(...by.lim.run), 60); assert.equal(Math.max(...by.lim.ref), 20);
  assert.equal(v[firstMismatch(v)].id, "lim", "the brake domain limit is the first signal that leaves the reference");
  const warm = { ...exec0(), initial: exec0().initial.map(item => item.signalId === "batteryTemp" ? { ...item, value: 25 } : item) };
  const w = simulate("cold", "req", false, warm).levels.vehicle.find(s => s.id === "lim");
  assert.deepEqual(w.run, w.ref, "25 degC: the fixed value equals the received limit, the fault is not exercised");
  const fixed = simulate("cold", "req", true, exec0()).levels.vehicle;
  assert.ok(fixed.every(s => s.run.every((x, i) => Math.abs(x - s.ref[i]) < 1e-9)));
});

test("C06 hypotheses: only system integration decides the limit-usage setting", () => {
  assert.equal(SCENARIO_META.cold.hypotheses.find(h => h.truth).id, "brake_fixed");
  const obsAt = (lv, ids) => { const o = {}; simulate("cold", "req", false, exec0()).levels[lv].filter(s => ids.includes(s.id)).forEach(s => { const i = s.ref.findIndex((x, k) => Math.abs(x - s.run[k]) > (s.max - (s.min ?? 0)) * .02); o[s.id] = i < 0 ? "same" : s.run[i] > s.ref[i] ? "higher" : "lower"; }); return o; };
  const unit = hypothesisStatus("cold", [{ level: "unit", fixed: false, obs: obsAt("unit", ["lim", "regen"]) }]).find(h => h.id === "brake_fixed");
  assert.notEqual(unit.status, "supported");
  const vehicle = hypothesisStatus("cold", [{ level: "vehicle", fixed: false, obs: obsAt("vehicle", ["bms", "gw", "lim"]) }]).find(h => h.id === "brake_fixed");
  assert.equal(vehicle.status, "supported");
});

test("C06 data: scenario, domino board (first deviation is the brake domain limit) and domain-level path puzzle", () => {
  assert.equal(SCENARIOS.cold.root, "brake_fixed");
  const src = readFileSync(new URL("../src/features/board/DominoTrace.tsx", import.meta.url), "utf8");
  const board = src.slice(src.indexOf('  cold: {\n    start: "decel"'), src.indexOf("export const fmt"));
  assert.match(board, /start: "decel", first: "brk_lim"/);
  const times = Object.fromEntries([...board.matchAll(/id: "(\w+)"[^\n]*status: "bad", t: (\d+)/g)].map(m => [m[1], Number(m[2])]));
  assert.equal(times.brk_lim, 100);
  assert.ok(Object.entries(times).every(([id, t]) => id === "brk_lim" || t > times.brk_lim));
  assert.equal((board.match(/ok: true/g) ?? []).length, 1);
  const puzzle = readFileSync(new URL("../src/features/wiring/RefPuzzle.tsx", import.meta.url), "utf8");
  assert.match(puzzle, /domain: "제동 · 구동 · 고전압 전원"[^\n]*ui: "path"/);
});
