/**
 * Fault schedule model (racing). Pure functions, no React, no three.
 *
 * A fault is data: WHEN it appears (phase + condition + hold time + delay/probability),
 * HOW LONG it stays (persistence), WHAT it does to the car (effect) and how that changes the chase.
 * The race loop (`RaceExperience` in src/experiences.tsx) builds a `FaultContext` every frame, calls
 * `stepFault`, merges the active effects and applies them. Adding a case = adding a `FaultSpec`
 * (see docs/fault-cases/RACING_FAULT_MODEL.md); no new race code is needed for the existing effect fields.
 *
 * Source of the taxonomy: docs/FAULT_CASE_SELECTION_V3.md section 4, requirements: docs/fault-cases/RULES.md R6, R17.
 */

/** Operating phase the fault belongs to (what the driver is doing / what state the car is in). */
import { CLIMB_ZONE, OVERTAKE_ZONE } from "./course";

export type FaultPhase =
  | "prestart"     // key/READY not yet established (before the race starts or after a restart)
  | "stationary"   // vehicle at rest, READY on (traffic light, waiting)
  | "launch"       // pulling away, low speed with pedal applied
  | "accel"        // pedal applied (tip-in / full throttle) above launch speed
  | "cruise"       // steady pedal, steady speed
  | "release"      // pedal released while moving (coasting / regen)
  | "braking"      // brake pedal applied
  | "steering"     // steering input above a threshold
  | "sustained"    // accumulated load (thermal and similar)
  | "environment"  // a map zone: slope, wet road, tunnel, cold ...
  | "elapsed"      // time or distance since the start of the level
  | "event"        // after something happened (collision, gear change, restart)
  | "random"       // may appear at any moment while driving
  | "always";      // no trigger: present from the very beginning

export type FaultPersistence =
  | "permanent"    // active while the condition holds
  | "latched"      // once triggered it stays until the key cycle (R restart)
  | "intermittent";// short bursts (onSec) with a quiet time (offSec) between

export type FaultEventKind = "collision" | "gearChange" | "restart";

export type FaultTrigger = {
  phase: FaultPhase;
  /** km/h window in which the condition counts (inclusive). */
  minSpeedKph?: number;
  maxSpeedKph?: number;
  /** accel-pedal requirement; default "any". "full" means pedal >= .9 */
  pedal?: "released" | "applied" | "full" | "any";
  gear?: "P" | "R" | "N" | "D";
  /** steering input magnitude 0..1 must be at least this (phase "steering"). */
  steerMin?: number;
  /** the condition must hold continuously this long before the fault arms (seconds). */
  holdSec?: number;
  /** the hold timer decays at this fraction of real time while the condition is off: 0 = it is kept, undefined = it resets. */
  decay?: number;
  /** phase "environment": the map zone tag that must be active (see `zones` in FaultContext). */
  zone?: string;
  /** phase "elapsed": level distance (m) or elapsed seconds after which the condition is true. */
  afterDistanceM?: number;
  afterElapsedS?: number;
  /** phase "event": the event kind and how long after it the condition stays true. */
  afterEvent?: FaultEventKind;
  withinSec?: number;
  /** any phase: the level distance window in which the condition counts (AND with the phase condition). */
  beforeDistanceM?: number;
  /** any phase: coolant / motor temperature (C) must be at least this. */
  heatMinC?: number;
  /** phase "random": probability per second while the base condition holds. */
  probabilityPerSec?: number;
};

/** What the active fault does. Every field is optional; missing means "healthy". Merge with `mergeEffects`. */
export type FaultEffect = {
  /** multiplier on the pedal signal (0.45 = scaled to 45 percent). */
  pedalScale?: number;
  /** acceleration cannot raise the speed above max(current speed, this) (km/h): the car keeps what it has but cannot gain more. */
  accelCapKph?: number;
  /** absolute output speed limit (km/h) = derating. */
  speedCapKph?: number;
  /** speed increase with NO pedal input (km/h per s): runaway / wrong-sign regen. */
  coastAccelKphPerS?: number;
  /** multiplier on brake deceleration (1 = healthy). */
  brakeScale?: number;
  /** multiplier on steering authority (1 = healthy, 0 = no steering). */
  steerScale?: number;
  /** READY is lost: the car loses drive and must be restarted with R. */
  shutdown?: boolean;
  /** before the start: READY cannot be established until the player has pressed R this many times. */
  readyBlockedTries?: number;
  /** drive torque cut: no acceleration at all, coasting only. */
  driveCut?: boolean;
  /** only reverse is possible; forward pedal does nothing. */
  reverseOnly?: boolean;
  /** cluster presentation hint for the HUD: dark cluster, warning lamp names. */
  cluster?: { blackout?: boolean; lamps?: string[] };
};

export type ChaseCoupling = {
  /** one sentence for the case sheet: how this fault changes the chase (R17). The numbers come from `gapRateMps`. */
  note: string;
};

export type FaultSpec = {
  id: string;
  /** case this spec belongs to (CaseId in runtime.ts or "N01" style sheet id). */
  caseId: string;
  trigger: FaultTrigger;
  /** seconds between the arming of the trigger and the fault becoming visible. */
  delaySec?: number;
  persistence: FaultPersistence;
  /** intermittent bursts: active onSec, then quiet offSec (random jitter is applied by the caller via `rand`). */
  burst?: { onSec: number; offSec: number };
  effect: FaultEffect;
  chase: ChaseCoupling;
};

/** Per-frame facts the race loop supplies. */
export type FaultContext = {
  speedKph: number;
  /** pedal 0..1 (accelerator actually pressed by the player). */
  pedal: number;
  braking: boolean;
  gear: "P" | "R" | "N" | "D";
  steerAbs: number;
  /** coolant / motor temperature (C), when the level simulates it. */
  heat?: number;
  distanceM: number;
  elapsedS: number;
  /** seconds since the last event of each kind (Infinity if never). */
  sinceEvent: Partial<Record<FaultEventKind, number>>;
  /** map zones the car is inside right now. */
  zones: readonly string[];
  /** READY established. false before the first start and after a shutdown. */
  ready: boolean;
};

export type FaultRuntime = {
  heldSec: number;
  armed: boolean;
  armedAtSec: number;
  latched: boolean;
  /** intermittent: seconds left in the current burst / in the quiet time. */
  burstLeft: number;
  quietLeft: number;
};

export const newFaultRuntime = (): FaultRuntime => ({ heldSec: 0, armed: false, armedAtSec: 0, latched: false, burstLeft: 0, quietLeft: 0 });

export const NO_EFFECT: FaultEffect = Object.freeze({});

/** Does the base condition of the trigger hold right now? (hold time, delay and probability are handled in stepFault) */
export function triggerHolds(t: FaultTrigger, c: FaultContext): boolean {
  if (t.minSpeedKph !== undefined && c.speedKph < t.minSpeedKph) return false;
  if (t.maxSpeedKph !== undefined && c.speedKph > t.maxSpeedKph) return false;
  if (t.gear && c.gear !== t.gear) return false;
  if (t.afterDistanceM !== undefined && c.distanceM < t.afterDistanceM) return false;
  if (t.beforeDistanceM !== undefined && c.distanceM >= t.beforeDistanceM) return false;
  if (t.afterElapsedS !== undefined && c.elapsedS < t.afterElapsedS) return false;
  if (t.heatMinC !== undefined && (c.heat ?? 0) < t.heatMinC) return false;
  const pedalOk = t.pedal === undefined || t.pedal === "any"
    || (t.pedal === "released" && c.pedal < .05)
    || (t.pedal === "applied" && c.pedal >= .05)
    || (t.pedal === "full" && c.pedal >= .9);
  if (!pedalOk) return false;
  switch (t.phase) {
    case "prestart": return !c.ready;
    case "stationary": return c.ready && c.speedKph < 1;
    case "launch": return c.speedKph < 25 && c.pedal >= .05 && c.ready;
    case "accel": return c.pedal >= .05 && c.speedKph >= 25;
    case "cruise": return c.pedal >= .05 && c.pedal < .9 && c.speedKph >= 25;
    case "release": return c.pedal < .05 && c.speedKph >= 1 && !c.braking;
    case "braking": return c.braking && c.speedKph >= 1;
    case "steering": return c.steerAbs >= (t.steerMin ?? .3) && c.speedKph >= 1;
    case "sustained": return c.pedal >= .05 && c.ready;
    case "environment": return t.zone !== undefined && c.zones.includes(t.zone);
    case "elapsed": return (t.afterDistanceM === undefined || c.distanceM >= t.afterDistanceM) && (t.afterElapsedS === undefined || c.elapsedS >= t.afterElapsedS);
    case "event": return t.afterEvent !== undefined && (c.sinceEvent[t.afterEvent] ?? Infinity) <= (t.withinSec ?? 30);
    case "random": return c.ready && c.speedKph >= 1;
    case "always": return true;
  }
}

export type FaultStep = { runtime: FaultRuntime; active: boolean; effect: FaultEffect };

/**
 * Advance one fault by dt seconds. `rand` is a [0,1) source (injectable so tests are deterministic).
 * `restarted` = the key cycle happened this frame (R pressed): latched faults clear, timers reset.
 */
export function stepFault(spec: FaultSpec, previous: FaultRuntime, ctx: FaultContext, dt: number, rand: () => number, restarted = false): FaultStep {
  const rt: FaultRuntime = restarted ? newFaultRuntime() : { ...previous };
  const t = spec.trigger;
  const holds = triggerHolds(t, ctx);
  if (holds) rt.heldSec += dt;
  else rt.heldSec = t.decay === undefined ? 0 : Math.max(0, rt.heldSec - dt * t.decay);

  if (!rt.armed && rt.heldSec >= (t.holdSec ?? 0) && holds) { rt.armed = true; rt.armedAtSec = 0; }
  if (rt.armed) rt.armedAtSec += dt;
  const visible = rt.armed && rt.armedAtSec >= (spec.delaySec ?? 0);

  let active = false;
  if (spec.persistence === "latched") {
    if (visible) rt.latched = true;
    active = rt.latched;
  } else if (spec.persistence === "permanent") {
    active = visible && holds;
    if (!holds) rt.armed = false; // must re-arm (hold + delay) the next time the condition appears
  } else {
    // intermittent bursts; a "random" trigger starts a burst with probabilityPerSec while the condition holds
    const burst = spec.burst ?? { onSec: 1, offSec: 3 };
    if (rt.burstLeft > 0) { rt.burstLeft = Math.max(0, rt.burstLeft - dt); active = true; if (rt.burstLeft === 0) rt.quietLeft = burst.offSec * (.6 + rand() * .8); }
    else if (rt.quietLeft > 0) rt.quietLeft = Math.max(0, rt.quietLeft - dt);
    else if (visible && holds) {
      const p = t.phase === "random" ? 1 - Math.pow(1 - (t.probabilityPerSec ?? .2), dt) : 1;
      if (rand() < p) { rt.burstLeft = burst.onSec; active = true; }
    }
    if (!holds && rt.burstLeft === 0) rt.armed = false;
  }
  return { runtime: rt, active, effect: active ? spec.effect : NO_EFFECT };
}

/** Combine the effects of all active faults (most restrictive wins; unintended acceleration adds up). */
export function mergeEffects(effects: readonly FaultEffect[]): FaultEffect {
  const out: FaultEffect = {};
  for (const e of effects) {
    if (e.accelCapKph !== undefined) out.accelCapKph = Math.min(out.accelCapKph ?? Infinity, e.accelCapKph);
    if (e.pedalScale !== undefined) out.pedalScale = (out.pedalScale ?? 1) * e.pedalScale;
    if (e.speedCapKph !== undefined) out.speedCapKph = Math.min(out.speedCapKph ?? Infinity, e.speedCapKph);
    if (e.coastAccelKphPerS !== undefined) out.coastAccelKphPerS = (out.coastAccelKphPerS ?? 0) + e.coastAccelKphPerS;
    if (e.brakeScale !== undefined) out.brakeScale = (out.brakeScale ?? 1) * e.brakeScale;
    if (e.steerScale !== undefined) out.steerScale = (out.steerScale ?? 1) * e.steerScale;
    if (e.shutdown) out.shutdown = true;
    if (e.readyBlockedTries !== undefined) out.readyBlockedTries = Math.max(out.readyBlockedTries ?? 0, e.readyBlockedTries);
    if (e.driveCut) out.driveCut = true;
    if (e.reverseOnly) out.reverseOnly = true;
    if (e.cluster) out.cluster = { blackout: out.cluster?.blackout || e.cluster.blackout, lamps: [...(out.cluster?.lamps ?? []), ...(e.cluster.lamps ?? [])] };
  }
  return out;
}

/**
 * Apply an effect to one frame of the longitudinal model. `healthyAccelKphPerS` is what the healthy car would add
 * this frame with the pedal pressed (0 when no pedal). Returns the new speed (km/h, never below 0 forward;
 * reverse speed is returned negative so the chase can use it).
 */
export function applyEffectToSpeed(speedKph: number, healthyAccelKphPerS: number, decelKphPerS: number, effect: FaultEffect, dt: number): number {
  let v = speedKph;
  if (effect.reverseOnly) {
    // forward pedal is ignored: pedal pulls the car backwards slowly, brake still works
    v -= healthyAccelKphPerS * .35 * dt;
    if (healthyAccelKphPerS === 0) v = v < 0 ? Math.min(0, v + decelKphPerS * dt) : Math.max(0, v - decelKphPerS * dt);
    return Math.max(-25, v);
  }
  if (effect.shutdown || effect.driveCut) healthyAccelKphPerS = 0;
  v += healthyAccelKphPerS * (effect.pedalScale ?? 1) * dt;
  if (healthyAccelKphPerS === 0 && effect.coastAccelKphPerS) v += effect.coastAccelKphPerS * dt;
  else v -= decelKphPerS * dt * (effect.brakeScale ?? 1);
  if (effect.speedCapKph !== undefined) v = Math.min(v, effect.speedCapKph);
  return v;
}

/** Police speed (km/h) as a function of the player's signed speed. Same numbers the race used before the model. */
export const policeSpeedKph = (speedKph: number): number => (speedKph < 4 ? 24 : Math.min(88, Math.max(68, 68 + speedKph * .12)));

/** Rate (m/s) at which the gap to the police changes: positive = escaping, negative = police closing. Negative player speed (reversing) is worse than standing still. */
export const gapRateMps = (speedKph: number): number => (speedKph - policeSpeedKph(speedKph)) / 3.6;

/** Seconds until the police reach the player at the current rate (Infinity if the gap is not closing). */
export const secondsToCatch = (gapM: number, speedKph: number): number => {
  const r = gapRateMps(speedKph);
  return r >= 0 ? Infinity : gapM / -r;
};

/**
 * Ready-made specs for the three first trigger types (docs/fault-cases/RACING_FAULT_MODEL.md).
 * They are generic demos used by the dev switch `?faultdemo=` and by tests; real cases register their own spec.
 */
export const DEMO_FAULTS: Record<"release" | "stationary" | "prestart" | "reverse" | "limit", FaultSpec> = {
  release: {
    id: "demo-release", caseId: "N01",
    trigger: { phase: "release", minSpeedKph: 40, holdSec: .4 },
    persistence: "permanent",
    effect: { coastAccelKphPerS: 6, cluster: { lamps: [] } },
    chase: { note: "Speed rises without pedal: the gap widens but collision risk is high; stopping lets the police close in." },
  },
  stationary: {
    id: "demo-stationary", caseId: "C01",
    trigger: { phase: "stationary", holdSec: 4 },
    persistence: "latched",
    effect: { shutdown: true, cluster: { blackout: true } },
    chase: { note: "READY lost while stopped: no drive until R restart, police close at 24 km/h." },
  },
  prestart: {
    id: "demo-prestart", caseId: "C01",
    trigger: { phase: "prestart" },
    persistence: "permanent",
    effect: { readyBlockedTries: 3 },
    chase: { note: "The race starts only after READY is established; every failed try costs time but the gap is fixed until departure." },
  },
  reverse: {
    id: "demo-reverse", caseId: "C12",
    trigger: { phase: "always" },
    persistence: "permanent",
    effect: { reverseOnly: true },
    chase: { note: "Only reverse is possible: the car rolls back towards the police, the gap closes faster than when standing still." },
  },
  limit: {
    id: "demo-limit", caseId: "C08",
    trigger: { phase: "elapsed", afterElapsedS: 10 },
    persistence: "permanent",
    effect: { speedCapKph: 55, cluster: { lamps: ["출력 제한"] } },
    chase: { note: "Output limited to 55 km/h: below the police speed (68-88 km/h), so the gap shrinks steadily until repaired." },
  },
};

/**
 * The two original cases expressed as specs (migrated from hard-coded zones, 2026-11-14).
 * propulsion: after OVERTAKE_ZONE[0] (course.ts) the pedal signal is scaled to 45 % and acceleration cannot take the car above 55 km/h.
 *             `heldSec` of this spec = seconds of throttle inside the zone (symptom after .25 s, FAULT_CUE after 1.8 s).
 * thermal:    after CLIMB_ZONE[0] (course.ts), once the coolant reaches 80 C the output is limited to 55 km/h.
 */
export const PROPULSION_FAULT: FaultSpec = {
  id: "case-propulsion", caseId: "propulsion",
  trigger: { phase: "sustained", afterDistanceM: OVERTAKE_ZONE[0], decay: 0 },
  persistence: "permanent",
  effect: { pedalScale: .45, accelCapKph: 55 },
  chase: { note: "Weak acceleration: the car cannot reach the police speed, so the gap shrinks while the pedal is pressed." },
};
export const THERMAL_FAULT: FaultSpec = {
  id: "case-thermal", caseId: "thermal",
  trigger: { phase: "always", afterDistanceM: CLIMB_ZONE[0], heatMinC: 80 },
  persistence: "permanent",
  effect: { speedCapKph: 55, cluster: { lamps: ["출력 제한"] } },
  chase: { note: "Output limited to 55 km/h below the police speed: the gap shrinks until the cooling fault is repaired." },
};

/**
 * N01 (docs/fault-cases/n01_regen_sign.md): the regeneration sign is dropped, so lifting the pedal at 40 km/h or more
 * makes the car accelerate (+6 km/h per s, the wrong-direction coasting torque). `heldSec` = seconds of the fault being felt
 * (kept while the speed stays above 40 km/h); the fault cue fires after 2.2 s.
 */
export const REGEN_FAULT: FaultSpec = {
  id: "case-regen", caseId: "regen",
  trigger: { phase: "release", minSpeedKph: 40, holdSec: .4, decay: 0 },
  persistence: "permanent",
  effect: { coastAccelKphPerS: 6 },
  chase: { note: "Speed rises without the pedal: the gap widens, but a crash costs speed and gap; stopping lets the police close in." },
};

/** Fault specs that run in a race mode. `caseId` is the case of the campaign (the case that was repaired last when resuming). */
export function levelFaults(mode: "normal" | "resume" | "assist" | "ship", caseId: string): FaultSpec[] {
  if (mode === "normal") return [PROPULSION_FAULT];
  if (mode === "resume" && caseId === "propulsion") return [THERMAL_FAULT];
  if (mode === "resume" && caseId === "regen") return [REGEN_FAULT];
  return [];
}
