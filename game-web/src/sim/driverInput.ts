// Driver Input Layer (doc PART 7, layer 1 of 8-1).
// Keyboard events never set vehicle speed directly. They move virtual input
// devices (pedals, wheel, button) at finite rates, and the devices produce the
// signals the control software reads: StartRequest, APP_Position, BPP_Position,
// Steering_Angle, Gear_Request.

export type GearPosition = "P" | "R" | "N" | "D";

export type DriverInputs = {
  /** One-tick pulse on the rising edge of the start key. */
  StartRequest: boolean;
  /** Accelerator pedal position, 0–100 %. */
  APP_Position: number;
  /** Brake pedal position, 0–100 %. */
  BPP_Position: number;
  /** Steering wheel angle in degrees, + = right. */
  Steering_Angle: number;
  Gear_Request: GearPosition;
};

export type DriverInputConfig = {
  pedalPressRate: number;      // %/s while the key is held
  pedalReleaseRate: number;    // %/s spring return
  steeringRate: number;        // deg/s while held
  steeringReturnRate: number;  // deg/s self-centering
  steeringMaxAngle: number;    // deg, lock-to-lock / 2
  steeringRatio: number;       // steering wheel deg per road wheel deg
  auxBrakeLevel: number;       // BPP % applied by the auxiliary brake key
};

// Educational defaults in a typical passenger-car range, not a specific vehicle.
export const DEFAULT_DRIVER_CONFIG: DriverInputConfig = {
  pedalPressRate: 260,
  pedalReleaseRate: 420,
  steeringRate: 420,
  steeringReturnRate: 560,
  steeringMaxAngle: 450,
  steeringRatio: 14.5,
  auxBrakeLevel: 100,
};

/** Doc 7-1 mapping. Arrow keys stay as aliases because the current race already uses them. */
export const KEY_BINDINGS = {
  start: ["enter"],
  accelerate: ["w", "arrowup"],
  brake: ["s", "arrowdown"],
  steerLeft: ["a", "arrowleft"],
  steerRight: ["d", "arrowright"],
  auxBrake: [" ", "space"],
} as const;

export type DriverInputState = DriverInputs & { startHeld: boolean };

export const initialDriverInputs = (): DriverInputState => ({
  StartRequest: false, APP_Position: 0, BPP_Position: 0, Steering_Angle: 0, Gear_Request: "P", startHeld: false,
});

const held = (keys: ReadonlySet<string>, names: readonly string[]) => names.some(name => keys.has(name));

const approach = (value: number, target: number, maxStep: number) =>
  value < target ? Math.min(target, value + maxStep) : Math.max(target, value - maxStep);

/**
 * Advances the input devices by `dt` seconds.
 * `keys` holds lowercase `KeyboardEvent.key` values currently pressed.
 */
export function stepDriverInputs(
  previous: DriverInputState,
  keys: ReadonlySet<string>,
  dt: number,
  config: DriverInputConfig = DEFAULT_DRIVER_CONFIG,
): DriverInputState {
  const startDown = held(keys, KEY_BINDINGS.start);
  const pedal = (current: number, target: number) =>
    approach(current, target, (target > current ? config.pedalPressRate : config.pedalReleaseRate) * dt);

  const appTarget = held(keys, KEY_BINDINGS.accelerate) ? 100 : 0;
  const bppTarget = Math.max(held(keys, KEY_BINDINGS.brake) ? 100 : 0, held(keys, KEY_BINDINGS.auxBrake) ? config.auxBrakeLevel : 0);

  const steerDirection = (held(keys, KEY_BINDINGS.steerRight) ? 1 : 0) - (held(keys, KEY_BINDINGS.steerLeft) ? 1 : 0);
  const steerTarget = steerDirection * config.steeringMaxAngle;
  const steerRate = steerDirection ? config.steeringRate : config.steeringReturnRate;

  return {
    StartRequest: startDown && !previous.startHeld,
    startHeld: startDown,
    APP_Position: pedal(previous.APP_Position, appTarget),
    BPP_Position: pedal(previous.BPP_Position, bppTarget),
    Steering_Angle: approach(previous.Steering_Angle, steerTarget, steerRate * dt),
    Gear_Request: previous.Gear_Request,
  };
}

/** Driver moves the selector. Leaving P requires the brake pedal (common shift-interlock practice). */
export function requestGear(state: DriverInputState, gear: GearPosition): DriverInputState {
  if (state.Gear_Request === "P" && gear !== "P" && state.BPP_Position < 10) return state;
  return { ...state, Gear_Request: gear };
}

/** Front road-wheel angle produced by the steering column and rack, in degrees. */
export const roadWheelAngle = (steeringAngle: number, config: DriverInputConfig = DEFAULT_DRIVER_CONFIG) =>
  steeringAngle / config.steeringRatio;
