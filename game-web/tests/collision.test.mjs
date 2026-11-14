import test from "node:test";
import assert from "node:assert/strict";
import { classifyImpact, impactEffect, speedAfterImpact } from "../src/game/collision.ts";

test("impact level grows with the closing speed", () => {
  assert.equal(classifyImpact(10), 1);
  assert.equal(classifyImpact(30), 2);
  assert.equal(classifyImpact(60), 3);
  assert.equal(classifyImpact(-60), 3); // sign does not matter
});

test("only strong hits cut the high voltage and cost pursuit distance", () => {
  assert.equal(impactEffect(10).hvCut, false);
  assert.equal(impactEffect(30).hvCut, false);
  const strong = impactEffect(70);
  assert.equal(strong.hvCut, true);
  assert.ok(strong.gapPenalty > impactEffect(30).gapPenalty && impactEffect(30).gapPenalty > impactEffect(10).gapPenalty);
});

test("speed after impact falls with level and never drops below the other car", () => {
  const speeds = [10, 30, 70].map(rel => speedAfterImpact(100, 100 - rel, impactEffect(rel)));
  assert.ok(speeds[0] > speeds[1] && speeds[1] > speeds[2]);
  assert.ok(speedAfterImpact(30, 25, impactEffect(5)) >= 25 * .6);
});

test("traffic: 13 cars, a slow same-direction platoon (jam) and extra oncoming cars", async () => {
  const { TRAFFIC_COUNT, trafficStateFor } = await import("../src/game/traffic.ts");
  assert.equal(TRAFFIC_COUNT, 13);
  const cars = Array.from({ length: TRAFFIC_COUNT }, (_, i) => trafficStateFor({ elapsed: 20 }, i));
  const platoon = cars.slice(7, 10);
  assert.ok(platoon.every(c => !c.opposite && c.speedKph < 35), "jam cars are slow and same direction");
  assert.ok(Math.max(...platoon.map(c => c.distance)) - Math.min(...platoon.map(c => c.distance)) < 60, "platoon stays together");
  assert.ok(cars.slice(10).every(c => c.opposite), "extra oncoming cars");
  assert.ok(cars.every(c => c.distance >= 0 && c.distance < 1380));
});
