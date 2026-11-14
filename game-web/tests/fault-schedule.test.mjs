import test from "node:test";
import assert from "node:assert/strict";
import { PROPULSION_FAULT, THERMAL_FAULT, levelFaults, DEMO_FAULTS, newFaultRuntime, stepFault, mergeEffects, applyEffectToSpeed, gapRateMps, policeSpeedKph, secondsToCatch, triggerHolds } from "../src/game/faultSchedule.ts";

const ctx = (o = {}) => ({ speedKph: 0, pedal: 0, braking: false, gear: "D", steerAbs: 0, distanceM: 0, elapsedS: 0, sinceEvent: {}, zones: [], ready: true, ...o });
const run = (spec, frames, rand = () => 0.5) => {
  let rt = newFaultRuntime(); let last;
  for (const [c, dt, restarted] of frames) { last = stepFault(spec, rt, c, dt, rand, restarted); rt = last.runtime; }
  return last;
};
const seconds = (n, c, dt = .1) => Array.from({ length: Math.round(n / dt) }, () => [c, dt]);

test("release trigger: needs speed, released pedal and the hold time", () => {
  const spec = DEMO_FAULTS.release;
  assert.equal(run(spec, seconds(2, ctx({ speedKph: 30 }))).active, false, "below 40 km/h");
  assert.equal(run(spec, seconds(2, ctx({ speedKph: 60, pedal: 1 }))).active, false, "pedal applied");
  assert.equal(run(spec, seconds(.2, ctx({ speedKph: 60 }))).active, false, "hold time not reached");
  const hit = run(spec, seconds(1, ctx({ speedKph: 60 })));
  assert.equal(hit.active, true);
  assert.ok(hit.effect.coastAccelKphPerS > 0);
});

test("permanent fault disappears when the condition ends and needs the hold time again", () => {
  const spec = DEMO_FAULTS.release;
  const frames = [...seconds(1, ctx({ speedKph: 60 })), ...seconds(.5, ctx({ speedKph: 60, pedal: 1 }))];
  assert.equal(run(spec, frames).active, false);
  assert.equal(run(spec, [...frames, ...seconds(.2, ctx({ speedKph: 60 }))]).active, false);
});

test("stationary latched fault: arms after 4 s at rest, stays until restart", () => {
  const spec = DEMO_FAULTS.stationary;
  assert.equal(run(spec, seconds(3, ctx())).active, false);
  const on = run(spec, seconds(4.5, ctx()));
  assert.equal(on.active, true); assert.equal(on.effect.shutdown, true);
  const moving = run(spec, [...seconds(4.5, ctx()), ...seconds(2, ctx({ speedKph: 50, pedal: .5 }))]);
  assert.equal(moving.active, true, "latched: stays after the trigger ends");
  const restarted = run(spec, [...seconds(4.5, ctx()), [ctx(), .1, true]]);
  assert.equal(restarted.active, false, "R restart clears the latch");
});

test("prestart fault applies only while READY is not established", () => {
  const spec = DEMO_FAULTS.prestart;
  assert.equal(run(spec, seconds(1, ctx({ ready: false }))).effect.readyBlockedTries, 3);
  assert.equal(run(spec, seconds(1, ctx({ ready: true }))).active, false);
});

test("intermittent random fault produces short bursts with quiet time", () => {
  const spec = { id: "t", caseId: "x", trigger: { phase: "random", probabilityPerSec: 1 }, persistence: "intermittent", burst: { onSec: .5, offSec: 2 }, effect: { driveCut: true }, chase: { note: "" } };
  let rt = newFaultRuntime(); let on = 0, off = 0;
  for (let i = 0; i < 100; i++) { const s = stepFault(spec, rt, ctx({ speedKph: 60 }), .1, () => 0.1); rt = s.runtime; s.active ? on++ : off++; }
  assert.ok(on > 5 && off > on, `bursts ${on} quiet ${off}`);
});

test("event trigger: only within the window after a collision", () => {
  const spec = { id: "t", caseId: "x", trigger: { phase: "event", afterEvent: "collision", withinSec: 5 }, persistence: "permanent", effect: { steerScale: .5 }, chase: { note: "" } };
  assert.equal(run(spec, seconds(1, ctx({ sinceEvent: { collision: 2 } }))).active, true);
  assert.equal(run(spec, seconds(1, ctx({ sinceEvent: { collision: 9 } }))).active, false);
  assert.equal(run(spec, seconds(1, ctx())).active, false);
});

test("environment, elapsed and steering conditions", () => {
  assert.equal(triggerHolds({ phase: "environment", zone: "wet" }, ctx({ zones: ["wet"] })), true);
  assert.equal(triggerHolds({ phase: "environment", zone: "wet" }, ctx({ zones: [] })), false);
  assert.equal(triggerHolds({ phase: "elapsed", afterElapsedS: 30 }, ctx({ elapsedS: 31 })), true);
  assert.equal(triggerHolds({ phase: "steering", steerMin: .5 }, ctx({ speedKph: 40, steerAbs: .6 })), true);
});

test("mergeEffects: most restrictive wins, unintended acceleration adds", () => {
  const m = mergeEffects([{ speedCapKph: 80, pedalScale: .5, coastAccelKphPerS: 2 }, { speedCapKph: 55, pedalScale: .5, coastAccelKphPerS: 3, shutdown: true }]);
  assert.deepEqual([m.speedCapKph, m.pedalScale, m.coastAccelKphPerS, m.shutdown], [55, .25, 5, true]);
});

test("applyEffectToSpeed: runaway accelerates without pedal, shutdown cuts drive, cap limits", () => {
  assert.ok(applyEffectToSpeed(60, 0, 2, { coastAccelKphPerS: 6 }, 1) > 60);
  assert.ok(applyEffectToSpeed(60, 0, 2, {}, 1) < 60);
  assert.ok(applyEffectToSpeed(60, 20, 2, { shutdown: true }, 1) <= 60);
  assert.equal(applyEffectToSpeed(60, 20, 2, { speedCapKph: 55 }, 1), 55);
  assert.ok(applyEffectToSpeed(60, 0, 30, { brakeScale: .2 }, 1) > 50, "weak brake");
  assert.ok(applyEffectToSpeed(0, 20, 2, { reverseOnly: true }, 1) < 0, "reverse only moves backwards");
});

test("chase coupling: stopped or reversing closes the gap faster than driving", () => {
  assert.equal(policeSpeedKph(0), 24);
  assert.ok(gapRateMps(0) < 0 && gapRateMps(-10) < gapRateMps(0));
  assert.ok(gapRateMps(120) > 0);
  assert.equal(secondsToCatch(100, 120), Infinity);
  assert.ok(secondsToCatch(100, 0) < 20);
});

test("demo specs for reverse-only and output limit couple to the chase", () => {
  assert.equal(run(DEMO_FAULTS.reverse, seconds(1, ctx())).effect.reverseOnly, true);
  assert.equal(run(DEMO_FAULTS.limit, seconds(5, ctx({ elapsedS: 5 }))).active, false);
  const limited = run(DEMO_FAULTS.limit, seconds(1, ctx({ elapsedS: 12 })));
  assert.equal(limited.effect.speedCapKph, 55);
  assert.ok(gapRateMps(55) < 0, "55 km/h is slower than the police");
  assert.ok(secondsToCatch(60, 55) < Infinity);
});

test("migrated cases: propulsion fault needs the zone and the pedal, keeps its throttle seconds; thermal needs distance and heat", () => {
  assert.deepEqual(levelFaults("normal", "propulsion").map(s => s.id), ["case-propulsion"]);
  assert.deepEqual(levelFaults("resume", "propulsion").map(s => s.id), ["case-thermal"]);
  assert.deepEqual(levelFaults("resume", "thermal"), []);
  assert.deepEqual(levelFaults("ship", "thermal"), []);
  const before = run(PROPULSION_FAULT, seconds(1, ctx({ speedKph: 80, pedal: 1, distanceM: 100 })));
  assert.equal(before.active, false);
  const inZone = run(PROPULSION_FAULT, seconds(2, ctx({ speedKph: 80, pedal: 1, distanceM: 200 })));
  assert.equal(inZone.active, true);
  assert.equal(inZone.effect.pedalScale, .45); assert.equal(inZone.effect.accelCapKph, 55);
  assert.ok(Math.abs(inZone.runtime.heldSec - 2) < .01, "throttle seconds accumulate");
  const released = run(PROPULSION_FAULT, [...seconds(2, ctx({ speedKph: 80, pedal: 1, distanceM: 200 })), ...seconds(1, ctx({ speedKph: 80, pedal: 0, distanceM: 210 }))]);
  assert.ok(released.runtime.heldSec > 1.9, "kept while the pedal is released (decay 0)");
  assert.equal(run(THERMAL_FAULT, seconds(1, ctx({ distanceM: 1400, heat: 70 }))).active, false);
  assert.equal(run(THERMAL_FAULT, seconds(1, ctx({ distanceM: 1200, heat: 90 }))).active, false);
  assert.equal(run(THERMAL_FAULT, seconds(1, ctx({ distanceM: 1400, heat: 85 }))).effect.speedCapKph, 55);
});
