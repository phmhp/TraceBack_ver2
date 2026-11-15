import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dispatch, initialCampaign } from "../src/game/runtime.ts";
import { LEVELS, levelStatus } from "../src/game/levels.ts";
import { SCENARIOS, SCENARIO_META, hypothesisStatus } from "../src/game/scenarios.ts";
import { simulate, firstMismatch } from "../src/features/verification/simModel.ts";
import { buildVerificationContract } from "../src/game/verificationContract.ts";
import { GEAR_FAULT, levelFaults, newFaultRuntime, stepFault } from "../src/game/faultSchedule.ts";

const at = (completed) => ({ ...initialCampaign(), scene: "LEVEL_SELECT", completedCases: completed });

test("C04 level: bonus level 6 after thermal, a race first, finale is level 7", () => {
  const level = LEVELS[5];
  assert.deepEqual([level.level, level.kind, level.caseId], [6, "bonus", "gear"]);
  assert.equal(LEVELS[6].kind, "finale");
  assert.equal(levelStatus(at([]), level), "locked");
  assert.equal(levelStatus(at(["propulsion", "thermal"]), level), "open");
  const started = dispatch(at(["propulsion", "thermal"]), { type: "START_LEVEL", level: 6 });
  assert.equal(started.scene, "CHASE_RESUME"); assert.equal(started.caseId, "gear");
  const cue = dispatch(started, { type: "FAULT_CUE", caseId: "gear", distance: 900, gap: 100, elapsed: 20 });
  assert.equal(cue.scene, "FAULT_CUE"); assert.equal(dispatch(cue, { type: "CONTINUE_FAULT" }).scene, "BOARD");
});

test("C04 race fault: a launch within the window after a gear change pulls the car backwards in a burst", () => {
  assert.deepEqual(levelFaults("resume", "gear").map(s => s.id), ["case-gear"]);
  assert.equal(GEAR_FAULT.trigger.afterEvent, "gearChange");
  assert.equal(GEAR_FAULT.effect.reverseOnly, true);
  const ctx = (sinceGear, pedal) => ({ speedKph: 0, pedal, braking: false, gear: "D", steerAbs: 0, distanceM: 100, elapsedS: 30, sinceEvent: { gearChange: sinceGear }, zones: [], ready: true });
  const quick = stepFault(GEAR_FAULT, newFaultRuntime(), ctx(.2, 1), .02, () => 0);
  assert.ok(quick.active && quick.effect.reverseOnly, "fault appears when the pedal is applied soon after the shift");
  const late = stepFault(GEAR_FAULT, newFaultRuntime(), ctx(3, 1), .02, () => 0);
  assert.ok(!late.active, "waiting a few seconds hides the fault (intermittent)");
});

test("C04 sim: the fallback is R only when the message gap exceeds the 100 ms timeout", () => {
  const exec = buildVerificationContract("gear", { hypothesisId: "x", hypothesisLabel: "x", suspectSection: "x" }).execution;
  const v = simulate("gear", "req", false, exec).levels.vehicle;
  const g = v.find(s => s.id === "g");
  assert.ok(Math.min(...g.run) === -1 && Math.min(...g.ref) === 0, "fault: R(-1) while the normal design uses N(0)");
  assert.equal(v[firstMismatch(v)].id, "g", "the VCU gear value is the first signal that leaves the reference");
  const calm = { ...exec, initial: exec.initial.map(item => item.signalId === "busLoad" ? { ...item, value: 40 } : item) };
  const c = simulate("gear", "req", false, calm).levels.vehicle.find(s => s.id === "g");
  assert.deepEqual(c.run, c.ref, "calm bus: the fault is not exercised");
  const fixed = simulate("gear", "req", true, exec).levels.vehicle;
  assert.ok(fixed.every(s => s.run.every((x, i) => Math.abs(x - s.ref[i]) < 1e-9)), "fallback N restored: same as normal");
});

test("C04 hypotheses: only the vehicle (system integration) level decides the fallback setting; single-ECU levels hold", () => {
  const meta = SCENARIO_META.gear;
  assert.equal(meta.hypotheses.filter(h => h.truth).length, 1);
  assert.equal(meta.hypotheses.find(h => h.truth).id, "gear_fallback");
  const exec = buildVerificationContract("gear", { hypothesisId: "x", hypothesisLabel: "x", suspectSection: "x" }).execution;
  const obsAt = (lv, ids) => { const o = {}; simulate("gear", "req", false, exec).levels[lv].filter(s => ids.includes(s.id)).forEach(s => { const i = s.ref.findIndex((x, k) => Math.abs(x - s.run[k]) > (s.max - (s.min ?? 0)) * .02); o[s.id] = i < 0 ? "same" : s.run[i] > s.ref[i] ? "higher" : "lower"; }); return o; };
  const unit = hypothesisStatus("gear", [{ level: "unit", fixed: false, obs: obsAt("unit", ["g", "cmd"]) }]).find(h => h.id === "gear_fallback");
  assert.notEqual(unit.status, "supported");
  const vehicle = hypothesisStatus("gear", [{ level: "vehicle", fixed: false, obs: obsAt("vehicle", ["gap", "g"]) }]).find(h => h.id === "gear_fallback");
  assert.equal(vehicle.status, "supported");
});

test("C04 data: scenario, board and ending are present and the first deviation is the VCU gear value", () => {
  assert.equal(SCENARIOS.gear.root, "gear_fallback");
  const src = readFileSync(new URL("../src/features/board/DominoTrace.tsx", import.meta.url), "utf8");
  const board = src.slice(src.indexOf('  gear: {\n    start: "launch_dir"'), src.indexOf("export const fmt"));
  assert.match(board, /start: "launch_dir", first: "vcu_gear"/);
  const times = Object.fromEntries([...board.matchAll(/id: "(\w+)"[^\n]*status: "bad", t: (\d+)/g)].map(m => [m[1], Number(m[2])]));
  assert.equal(times.vcu_gear, 100);
  assert.ok(Object.entries(times).every(([id, t]) => id === "vcu_gear" || t > times.vcu_gear));
  assert.equal((board.match(/ok: true/g) ?? []).length, 1);
});

test("per-level ending: every level starts at 0 m, a repair leads to a clean race, the ending offers the next level", () => {
  for (const [level, done] of [[2, ["propulsion"]], [4, ["propulsion", "thermal"]], [5, ["propulsion", "thermal"]], [6, ["propulsion", "thermal"]]]) {
    const started = dispatch({ ...at(done), raceDistance: 900, raceElapsedSeconds: 70, levelFinish: true }, { type: "START_LEVEL", level });
    assert.equal(started.raceDistance, 0, `level ${level} starts from 0 m`);
    assert.equal(started.levelFinish, false);
  }
  const repaired = dispatch({ ...initialCampaign(), scene: "REPAIR", caseId: "gear", completedCases: ["propulsion", "thermal"] }, { type: "APPLY_REPAIR" });
  assert.equal(repaired.scene, "CHASE_RESUME"); assert.equal(repaired.levelFinish, true);
  const ship = dispatch({ ...repaired, raceDistance: 1700 }, { type: "START_FINAL_ESCAPE" });
  assert.equal(ship.scene, "SHIP_ESCAPE");
  assert.equal(dispatch({ ...ship, scene: "ENDING" }, { type: "NEXT_LEVEL" }).scene, "LEVEL_SELECT");
});

test("puzzle UI types are all in use: blocks (propulsion…), signal path (gear), state transition (ready)", () => {
  const src = readFileSync(new URL("../src/features/wiring/RefPuzzle.tsx", import.meta.url), "utf8");
  assert.match(src, /domain: "변속·주차"[^\n]*ui: "path"/);
  assert.match(src, /precharge_timeout_1500", ui: "state"/);
  assert.match(src, /ui\?: "blocks" \| "path" \| "state"/);
});
