/**
 * Realistic road situations, set 1 (docs/ROAD_SITUATIONS_CATALOG.md, docs/RACING_DESIGN_IDEAS.md 9.5):
 *  - signalised crosswalks with pedestrians (junctions at 300 m and 920 m; the mission junction at 620 m keeps its own script),
 *  - a lead car that brakes hard,
 *  - a car that hits the player from behind after a hard stop.
 * Everything here is a pure function of the race clock / positions so it can be unit-tested and is deterministic.
 * Cats are never hurt: a pedestrian contact is an emergency stop + penalty, never an injury scene.
 */

export type SignalPhase = "green" | "yellow" | "red";

/** Junctions whose signal runs on the cycle. The 620 m junction belongs to the red-light mission (experiences.tsx). */
export const CYCLE_JUNCTIONS = [300, 920] as const;
export const SIGNAL_CYCLE = { green: 13, yellow: 2.5, red: 8.5 } as const;
const CYCLE_LENGTH = SIGNAL_CYCLE.green + SIGNAL_CYCLE.yellow + SIGNAL_CYCLE.red;
const SIGNAL_OFFSET: Record<number, number> = { 300: 4, 920: 10 };
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Signal phase for the player's direction at a cycle junction. */
export function signalPhase(junctionM: number, elapsedS: number): SignalPhase {
  const t = mod(elapsedS + (SIGNAL_OFFSET[junctionM] ?? 0), CYCLE_LENGTH);
  if (t < SIGNAL_CYCLE.green) return "green";
  if (t < SIGNAL_CYCLE.green + SIGNAL_CYCLE.yellow) return "yellow";
  return "red";
}

/** Seconds since the current red phase began (negative when not red). */
export function redAge(junctionM: number, elapsedS: number): number {
  const t = mod(elapsedS + (SIGNAL_OFFSET[junctionM] ?? 0), CYCLE_LENGTH);
  return t >= SIGNAL_CYCLE.green + SIGNAL_CYCLE.yellow ? t - SIGNAL_CYCLE.green - SIGNAL_CYCLE.yellow : -1;
}

/** Crosswalk footprint around the junction centre: ±2.1 m along the road, lateral ±6.4 m in road coordinates. */
export const CROSSWALK = { halfLength: 2.1, halfWidth: 6.4 } as const;
const WALK_START_DELAY = 1.2; // pedestrians step off after the car signal is red
const WALK_SECONDS = 6.4;     // time to cross the full width
const PED_COUNT = 3;

export type Pedestrian = { id: string; junctionM: number; distance: number; lateral: number; heading: 1 | -1 };

/** Pedestrians currently on the crosswalk of a cycle junction. */
export function pedestriansAt(junctionM: number, elapsedS: number): Pedestrian[] {
  const age = redAge(junctionM, elapsedS);
  if (age < 0) return [];
  const out: Pedestrian[] = [];
  for (let i = 0; i < PED_COUNT; i++) {
    const heading: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const progress = (age - WALK_START_DELAY - i * .7) / WALK_SECONDS;
    if (progress < 0 || progress > 1) continue;
    const lateral = (heading === 1 ? -1 : 1) * CROSSWALK.halfWidth + heading * progress * CROSSWALK.halfWidth * 2;
    out.push({ id: `${junctionM}-${i}`, junctionM, distance: junctionM - CROSSWALK.halfLength + (i + .5) * (CROSSWALK.halfLength * 2 / PED_COUNT), lateral, heading });
  }
  return out;
}

/** The pedestrian the car touches, if any (car half length 2.2 m, half width 0.9 m, pedestrian radius 0.35 m). */
export function pedestrianContact(playerDistanceM: number, playerLaneM: number, elapsedS: number, junctions: readonly number[] = CYCLE_JUNCTIONS): Pedestrian | null {
  for (const j of junctions) {
    if (Math.abs(playerDistanceM - j) > CROSSWALK.halfLength + 2.6) continue;
    for (const p of pedestriansAt(j, elapsedS)) {
      if (Math.abs(p.distance - playerDistanceM) < 2.2 + .35 && Math.abs(p.lateral - playerLaneM) < .9 + .35) return p;
    }
  }
  return null;
}

/**
 * Hint for the HUD: the next cycle junction ahead within `range` metres, its signal phase, and whether pedestrians are crossing.
 * The player decides; nothing is enforced except the contact above.
 */
export function junctionAhead(playerDistanceM: number, elapsedS: number, range = 90, junctions: readonly number[] = CYCLE_JUNCTIONS) {
  const j = junctions.find(m => m - playerDistanceM >= -CROSSWALK.halfLength && m - playerDistanceM <= range);
  if (j === undefined) return null;
  return { junctionM: j, distanceM: j - playerDistanceM, phase: signalPhase(j, elapsedS), crossing: pedestriansAt(j, elapsedS).length > 0 };
}

/** Distance (m) the player needs to stop from `speedKph` with a comfortable 6 m/s^2 brake (for the HUD hint and tests). */
export const stoppingDistanceM = (speedKph: number, decel = 6): number => { const v = speedKph / 3.6; return v * v / (2 * decel); };

// ---------------------------------------------------------------- lead car that brakes hard

/** One scripted hard-braking event of a same-direction traffic car: it slows to `floorScale` of its speed, holds, then recovers. */
export type LeadBrake = { carIndex: number; startS: number; rampS: number; holdS: number; floorScale: number };
export const LEAD_BRAKES: readonly LeadBrake[] = [
  { carIndex: 2, startS: 40, rampS: 1.2, holdS: 2.2, floorScale: .08 },
  { carIndex: 4, startS: 95, rampS: 1, holdS: 2.6, floorScale: .05 },
];

/** Speed factor (0..1) of the scripted braking at a moment of the race clock. */
export function leadBrakeScale(b: LeadBrake, elapsedS: number): number {
  const t = elapsedS - b.startS;
  if (t < 0) return 1;
  if (t < b.rampS) return 1 - (1 - b.floorScale) * (t / b.rampS);
  if (t < b.rampS + b.holdS) return b.floorScale;
  if (t < 2 * b.rampS + b.holdS) return b.floorScale + (1 - b.floorScale) * ((t - b.rampS - b.holdS) / b.rampS);
  return 1;
}

/** Distance (m) this car lost against its schedule because of the scripted braking (integral of (1 - scale) * speed). */
export function leadBrakeLagM(carIndex: number, speedKph: number, elapsedS: number): number {
  let lag = 0;
  for (const b of LEAD_BRAKES) {
    if (b.carIndex !== carIndex) continue;
    const end = Math.min(elapsedS, b.startS + 2 * b.rampS + b.holdS);
    for (let t = b.startS; t < end; t += .1) lag += (1 - leadBrakeScale(b, t + .05)) * Math.min(.1, end - t) * speedKph / 3.6;
  }
  return lag;
}

/** True while this car is braking hard (brake lights on, HUD warning "앞차 급제동"). */
export const leadBraking = (carIndex: number, elapsedS: number): boolean =>
  LEAD_BRAKES.some(b => b.carIndex === carIndex && elapsedS >= b.startS && elapsedS < b.startS + 2 * b.rampS + b.holdS && leadBrakeScale(b, elapsedS) < .6);

// ---------------------------------------------------------------- hit from behind

/**
 * A following car appears behind the player after a hard stop (speed fell below `triggerKph` after being above `fromKph` within `withinS`)
 * and arrives at `followKph`. If the player is still slower than that when it arrives, the rear-end collision happens
 * with closing speed `followKph - playerSpeed`. The player can avoid it by driving away. Stops within 90 m of a junction (`atJunction`) never arm it. Pure bookkeeping, state lives in the caller.
 */
export const REAR_HIT = { fromKph: 55, triggerKph: 12, withinS: 3.5, followKph: 58, startGapM: 70 } as const;

export type RearState = { armedAtS: number | null; fromAtS: number; follower: number | null; hitDone: boolean };
export const newRearState = (): RearState => ({ armedAtS: null, fromAtS: -Infinity, follower: null, hitDone: false });

/** Advance the rear-end situation by dt; `follower` is the gap (m) of the car behind (positive = behind the player). */
export function stepRear(s: RearState, playerSpeedKph: number, elapsedS: number, dt: number, atJunction = false): { state: RearState; hitClosingKph: number | null } {
  const next: RearState = { ...s };
  if (playerSpeedKph >= REAR_HIT.fromKph) next.fromAtS = elapsedS;
  // a stop at a signalised junction is expected traffic behaviour: following cars stop behind in that case
  if (next.follower === null && !next.hitDone && !atJunction && playerSpeedKph < REAR_HIT.triggerKph && elapsedS - next.fromAtS <= REAR_HIT.withinS) {
    next.follower = REAR_HIT.startGapM; next.armedAtS = elapsedS;
  }
  let hitClosingKph: number | null = null;
  if (next.follower !== null) {
    next.follower -= (REAR_HIT.followKph - playerSpeedKph) / 3.6 * dt;
    if (next.follower <= 4.4) { hitClosingKph = Math.max(0, REAR_HIT.followKph - playerSpeedKph); next.follower = null; next.hitDone = true; }
    else if (next.follower > REAR_HIT.startGapM + 40) next.follower = null; // the player drove off: the car never arrives
  }
  return { state: next, hitClosingKph };
}

/** True within `range` metres of any junction stop line (cycle junctions and the 620 m mission junction). */
export const nearJunction = (distanceM: number, range = 90): boolean => [...CYCLE_JUNCTIONS, 620].some(j => Math.abs(distanceM - j) <= range);
