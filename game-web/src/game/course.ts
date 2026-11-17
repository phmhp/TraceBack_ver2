// Course layout (metres along the road). One place for the fixed event positions of the race.
// The track itself (length, traffic) lives in traffic.ts (TRACK_LENGTH); the final ramp starts at TRACK_LENGTH - 170.

/** Overtake zone of the first case (propulsion): full throttle here exposes the weak acceleration. */
export const OVERTAKE_ZONE = [420, 720] as const;
/** Sustained high-load section of the second case (thermal): cooling must keep up. */
export const CLIMB_ZONE = [1300, 1500] as const;
/** From here the last escape (ship) begins, after the thermal case is repaired. */
export const FINAL_ESCAPE_M = 1700;
