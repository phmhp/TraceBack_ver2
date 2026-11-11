// Race traffic: deterministic positions from the race clock, plus a short hesitation after a crash.
// Kept free of React so the rules can be unit-tested (tests/feedback-1112.test.mjs).
import * as THREE from "three";

export const TRACK_LENGTH = 1380;
/** Only the race clock moves traffic. */
type TrafficSim = { elapsed: number };

// Traffic keeps its lane (no last-moment dodge): a crash happens only when the bodies really touch.
// Same-direction lanes sit slightly off the lane centres so a car driving on the lane line passes without
// scraping (player 1.8 m wide, traffic 1.83 m → bodies touch below 1.82 m centre distance).
export const CAR_CONTACT = { lateral: 1.82, longitudinal: 3.62 };
// After a crash the hit traffic car hesitates for a moment (it loses distance against its schedule).
const STALL_SECONDS = .7, STALL_SLOWDOWN = .85;
const trafficStall = { base: new Float64Array(7), hitAt: new Float64Array(7).fill(-1) };
export function resetTrafficStall() { trafficStall.base.fill(0); trafficStall.hitAt.fill(-1); }
export function trafficLag(index: number, elapsed: number, speedKph: number) {
  const hitAt = trafficStall.hitAt[index];
  const active = hitAt < 0 ? 0 : THREE.MathUtils.clamp(elapsed - hitAt, 0, STALL_SECONDS);
  return trafficStall.base[index] + active * speedKph / 3.6 * STALL_SLOWDOWN;
}
export function stallTraffic(index: number, elapsed: number, speedKph: number) {
  if (trafficStall.hitAt[index] >= 0 && elapsed - trafficStall.hitAt[index] < STALL_SECONDS) return; // already hesitating
  trafficStall.base[index] = trafficLag(index, elapsed, speedKph);
  trafficStall.hitAt[index] = elapsed;
}
export function trafficStateFor(sim: TrafficSim, index: number) {
  const opposite = index % 2 === 1;
  const speedKph = 38 + index * 3.5;
  const start = 105 + index * 148;
  const travel = sim.elapsed * speedKph / 3.6 - (opposite ? 0 : trafficLag(index, sim.elapsed, speedKph));
  const distance = opposite
    ? THREE.MathUtils.euclideanModulo(TRACK_LENGTH - start - travel, TRACK_LENGTH - 40)
    : THREE.MathUtils.euclideanModulo(start + travel, TRACK_LENGTH - 40);
  const lane = opposite ? (index % 4 === 1 ? -1.72 : -5.1) : index % 4 === 0 ? 1.42 : 5.3;
  return { opposite, distance, lane, speedKph, index };
}

