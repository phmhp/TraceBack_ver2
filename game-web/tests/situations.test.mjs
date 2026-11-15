import test from "node:test";
import assert from "node:assert/strict";
import { ROAD_ZONES, zoneBrakeFactor, zonesAt, nearJunction, signalPhase, redAge, pedestriansAt, pedestrianContact, junctionAhead, stoppingDistanceM, LEAD_BRAKES, leadBrakeScale, leadBrakeLagM, leadBraking, newRearState, stepRear, REAR_HIT, SIGNAL_CYCLE } from "../src/game/situations.ts";

test("signal cycles green -> yellow -> red and repeats", () => {
  const seen = new Set(); for (let t = 0; t < 48; t += .5) seen.add(signalPhase(300, t));
  assert.deepEqual([...seen].sort(), ["green", "red", "yellow"]);
  const total = SIGNAL_CYCLE.green + SIGNAL_CYCLE.yellow + SIGNAL_CYCLE.red;
  assert.equal(signalPhase(300, 7), signalPhase(300, 7 + total));
  assert.notEqual(signalPhase(300, 10), signalPhase(920, 10), "junctions are offset");
});

test("pedestrians cross only while the car signal is red and finish before it turns green", () => {
  let crossing = 0, greenWithPeds = 0, redEnd = -1;
  for (let t = 0; t < 48; t += .25) {
    const peds = pedestriansAt(300, t);
    if (peds.length) crossing++;
    if (peds.length && signalPhase(300, t) !== "red") greenWithPeds++;
  }
  assert.ok(crossing > 10);
  assert.equal(greenWithPeds, 0);
  // red lasts 8.5 s; the last pedestrian starts at 1.2 + 1.4 s and needs 6.4 s -> 9.0 s: nobody may still be walking at green
  const total = SIGNAL_CYCLE.green + SIGNAL_CYCLE.yellow + SIGNAL_CYCLE.red;
  for (let t = 0; t < total; t += .1) if (signalPhase(300, t) === "green") assert.equal(pedestriansAt(300, t).length, 0);
});

test("pedestrian walks across the full crosswalk width", () => {
  const start = Array.from({ length: 480 }, (_, i) => i * .1).find(t => redAge(300, t) >= 0);
  const lateralOf = t => pedestriansAt(300, t).find(p => p.id.endsWith("-0"))?.lateral;
  const a = lateralOf(start + 1.5), b = lateralOf(start + 6);
  assert.ok(a !== undefined && b !== undefined && b > a, "moves along its heading");
  assert.ok(Math.abs(a) <= 6.4 && Math.abs(b) <= 6.4);
});

test("contact only when the car is on the crosswalk and meets a pedestrian", () => {
  const start = Array.from({ length: 480 }, (_, i) => i * .1).find(t => redAge(300, t) >= 0);
  const t = start + 4;
  const p = pedestriansAt(300, t)[0];
  assert.ok(p);
  assert.ok(pedestrianContact(p.distance, p.lateral, t), "driving into the pedestrian");
  assert.equal(pedestrianContact(p.distance - 30, p.lateral, t), null, "before the crosswalk");
  assert.equal(pedestrianContact(p.distance, 20, t), null, "off the crosswalk lateral range");
  assert.equal(pedestrianContact(p.distance, p.lateral, 0 + (signalPhase(300, 0) === "red" ? 20 : 0)), null, "no pedestrian when the light is green");
});

test("junctionAhead reports phase and crossing within range only", () => {
  assert.equal(junctionAhead(100, 0), null);
  const near = junctionAhead(250, 0);
  assert.equal(near.junctionM, 300);
  assert.ok(near.distanceM === 50 && ["green", "yellow", "red"].includes(near.phase));
});

test("stopping distance grows with the square of speed", () => {
  assert.ok(stoppingDistanceM(100) > stoppingDistanceM(50) * 3.9);
});

test("lead car braking: scale drops to the floor, recovers, and the car loses distance", () => {
  const b = LEAD_BRAKES[0];
  assert.equal(leadBrakeScale(b, b.startS - 1), 1);
  assert.equal(leadBrakeScale(b, b.startS + b.rampS + .1), b.floorScale);
  assert.equal(leadBrakeScale(b, b.startS + 2 * b.rampS + b.holdS + 1), 1);
  const before = leadBrakeLagM(b.carIndex, 45, b.startS - 1);
  const after = leadBrakeLagM(b.carIndex, 45, b.startS + 20);
  assert.equal(before, 0);
  assert.ok(after > 15 && after < 45 * b.holdS / 3.6 + 20, `lag ${after}`);
  assert.equal(leadBraking(b.carIndex, b.startS + b.rampS + .5), true);
  assert.equal(leadBraking(b.carIndex, b.startS - 5), false);
  assert.equal(leadBrakeLagM(5, 45, 200), 0, "other cars unaffected");
});

test("rear-end hit: hard stop arms a follower that hits a stopped car, but not one that drives away", () => {
  const run = (speedAt) => { let s = newRearState(), hit = null; for (let t = 0; t < 30; t += .05) { const r = stepRear(s, speedAt(t), t, .05); s = r.state; if (r.hitClosingKph !== null) { hit = r.hitClosingKph; break; } } return hit; };
  const stopAfterFast = t => (t < 2 ? 80 : 0);
  const hit = run(stopAfterFast);
  assert.ok(hit > 50 && hit <= REAR_HIT.followKph, `closing ${hit}`);
  assert.equal(run(t => (t < 2 ? 80 : t < 2.5 ? 30 : 90)), null, "player drove off in time");
  assert.equal(run(() => 0), null, "never was fast: no follower");
  assert.equal(run(t => 40), null, "slow cruising never triggers");
});

test("a stop at a junction does not arm the rear-end follower", () => {
  let s = newRearState(); let armed = false;
  for (let t = 0; t < 20; t += .05) { const r = stepRear(s, t < 2 ? 80 : 0, t, .05, true); s = r.state; if (r.state.follower !== null) armed = true; }
  assert.equal(armed, false);
  assert.equal(nearJunction(300), true); assert.equal(nearJunction(600), true); assert.equal(nearJunction(450), false); assert.equal(nearJunction(225), true);
});

test("zonesAt returns the tags of the zones that contain the distance", () => {
  const zones = [{ tag: "wet", fromM: 100, toM: 200 }, { tag: "tunnel", fromM: 150, toM: 300 }];
  assert.deepEqual(zonesAt(120, zones), ["wet"]);
  assert.deepEqual(zonesAt(170, zones), ["wet", "tunnel"]);
  assert.deepEqual(zonesAt(50, zones), []);
});

test("wet zone exists, lengthens braking, and feeds the environment fault trigger", () => {
  assert.ok(ROAD_ZONES.some(z => z.tag === "wet"));
  assert.ok(zoneBrakeFactor(zonesAt(420)) < 1);
  assert.equal(zoneBrakeFactor(zonesAt(100)), 1);
});

test("tunnel and night zones exist with positions that stay in the 3D driving part", () => {
  const tags = ROAD_ZONES.map(z => z.tag);
  assert.ok(tags.includes("tunnel") && tags.includes("night") && tags.includes("wet"));
  for (const zone of ROAD_ZONES) assert.ok(zone.fromM < zone.toM && zone.toM < 1700, `${zone.tag} ends before the final escape (the ship leg is an illustrated backdrop)`);
  assert.deepEqual(zonesAt(760), ["tunnel"]); assert.deepEqual(zonesAt(1600), ["night"]);
});
