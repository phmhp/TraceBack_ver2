// Race traffic: deterministic positions from the race clock, plus a short hesitation after a crash.
// Kept free of React so the rules can be unit-tested (tests/feedback-1112.test.mjs).
import * as THREE from "three";
import { leadBrakeLagM } from "./situations";

export const TRACK_LENGTH = 2200;
/** Cars 0-6 follow the original schedule formula; cars 7+ are explicit entries (a slow platoon = the jam, plus extra oncoming cars). */
export const TRAFFIC_COUNT = 17;
const EXTRA_TRAFFIC: readonly { opposite: boolean; speedKph: number; start: number; lane: number }[] = [
  { opposite: false, speedKph: 31, start: 470, lane: 1.42 }, // 7-9: slow platoon (jam) over both same-direction lanes
  { opposite: false, speedKph: 29, start: 488, lane: 5.3 },
  { opposite: false, speedKph: 33, start: 504, lane: 1.42 },
  { opposite: true, speedKph: 46, start: 260, lane: -1.72 }, // 10-12: more oncoming traffic
  { opposite: true, speedKph: 52, start: 640, lane: -5.1 },
  { opposite: true, speedKph: 44, start: 1010, lane: -1.72 },
  { opposite: false, speedKph: 36, start: 1450, lane: 5.3 }, // 13-16: traffic for the long second half
  { opposite: false, speedKph: 41, start: 1800, lane: 1.42 },
  { opposite: true, speedKph: 48, start: 1500, lane: -5.1 },
  { opposite: true, speedKph: 50, start: 1900, lane: -1.72 },
];
/** Only the race clock moves traffic. */
type TrafficSim = { elapsed: number };

// Traffic keeps its lane (no last-moment dodge): a crash happens only when the bodies really touch.
// Same-direction lanes sit slightly off the lane centres so a car driving on the lane line passes without
// scraping (player 1.8 m wide, traffic 1.83 m → bodies touch below 1.82 m centre distance).
export const CAR_CONTACT = { lateral: 1.82, longitudinal: 3.62 };
// After a crash the hit traffic car hesitates for a moment (it loses distance against its schedule).
const STALL_SECONDS = .7, STALL_SLOWDOWN = .85;
const trafficStall = { base: new Float64Array(TRAFFIC_COUNT), hitAt: new Float64Array(TRAFFIC_COUNT).fill(-1) };
export function resetTrafficStall() { trafficStall.base.fill(0); trafficStall.hitAt.fill(-1); }
export function trafficLag(index: number, elapsed: number, speedKph: number) {
  const hitAt = trafficStall.hitAt[index];
  const active = hitAt < 0 ? 0 : THREE.MathUtils.clamp(elapsed - hitAt, 0, STALL_SECONDS);
  return trafficStall.base[index] + active * speedKph / 3.6 * STALL_SLOWDOWN;
}
const hitLevel = new Uint8Array(TRAFFIC_COUNT).fill(1);
export function stallTraffic(index: number, elapsed: number, speedKph: number, level = 1) {
  if (trafficStall.hitAt[index] >= 0 && elapsed - trafficStall.hitAt[index] < STALL_SECONDS) return; // already hesitating
  trafficStall.base[index] = trafficLag(index, elapsed, speedKph);
  trafficStall.hitAt[index] = elapsed;
  hitLevel[index] = level;
}
/** how long ago (s) and how hard this traffic car was hit, while its knock-back animation still plays; null otherwise */
export function trafficHitVisual(index: number, elapsed: number) {
  const hitAt = trafficStall.hitAt[index];
  if (hitAt < 0) return null;
  const age = elapsed - hitAt;
  return age >= 0 && age < 1.6 ? { age, level: hitLevel[index] } : null;
}
export function trafficStateFor(sim: TrafficSim, index: number) {
  const extra = index >= 7 ? EXTRA_TRAFFIC[index - 7] : undefined;
  const opposite = extra ? extra.opposite : index % 2 === 1;
  const speedKph = extra ? extra.speedKph : 38 + index * 3.5;
  const start = extra ? extra.start : 105 + index * 148;
  const travel = sim.elapsed * speedKph / 3.6 - (opposite ? 0 : trafficLag(index, sim.elapsed, speedKph) + leadBrakeLagM(index, speedKph, sim.elapsed));
  const distance = opposite
    ? THREE.MathUtils.euclideanModulo(TRACK_LENGTH - start - travel, TRACK_LENGTH - 40)
    : THREE.MathUtils.euclideanModulo(start + travel, TRACK_LENGTH - 40);
  const lane = extra ? extra.lane : opposite ? (index % 4 === 1 ? -1.72 : -5.1) : index % 4 === 0 ? 1.42 : 5.3;
  return { opposite, distance, lane, speedKph, index };
}

