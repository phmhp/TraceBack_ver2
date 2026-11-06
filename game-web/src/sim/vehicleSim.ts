// Educational longitudinal EV model: Driver Input → Control SW → Communication
// → Hardware/Plant → Vehicle Dynamics → Feedback, in one shared state.
// Simplified on purpose (single-track, no tyre slip, lumped thermal mass);
// parameters are typical passenger-EV magnitudes, not any specific vehicle or
// production calibration. Values are chosen so the existing case data holds:
// APP 60 % → 204 Nm request, faulty 45 % pedal scaling → 27 % → 92 Nm,
// brake demand 55 % → ~42 bar.
import type { DriverInputs } from "./driverInput.ts";

export type SimLayer = "driver" | "sensor" | "control" | "communication" | "plant" | "dynamics" | "feedback";

/** One executed step: which port produced which value. Feeds step-by-step playback. */
export type TraceEntry = { order: number; layer: SimLayer; componentId: string; portId: string; signal: string; value: number | string | boolean; unit: string };

export type VehicleParams = {
  massKg: number; wheelRadiusM: number; gearRatio: number; gearEfficiency: number;
  maxMotorTorqueNm: number; maxPowerKw: number; motorTorqueTauS: number;
  dragCoefCdA: number; airDensity: number; rollingCoef: number;
  brakeBarPerPercent: number; brakeTorquePerBarNm: number;
  fanOnC: number; fanOffC: number; fanMaxRpm: number; derateStartC: number; derateFullC: number;
};

export const DEFAULT_VEHICLE: VehicleParams = {
  massKg: 1850, wheelRadiusM: 0.33, gearRatio: 9.0, gearEfficiency: 0.97,
  maxMotorTorqueNm: 340, maxPowerKw: 150, motorTorqueTauS: 0.05,
  dragCoefCdA: 0.62, airDensity: 1.2, rollingCoef: 0.011,
  brakeBarPerPercent: 0.76, brakeTorquePerBarNm: 95,
  fanOnC: 65, fanOffC: 60, fanMaxRpm: 1850, derateStartC: 75, derateFullC: 90,
};

/** Fault injection hooks (doc 2-5). Defaults are a healthy vehicle. */
export type FaultSet = {
  /** Multiplier applied to the APP signal inside the VCU input stage (case "propulsion": 0.45). */
  pedalScale?: number;
  /** Fan receives PWM but does not turn (case "thermal"). */
  fanStuck?: boolean;
  /** Fraction of commanded hydraulic pressure actually delivered (case "brake"). */
  brakePressureGain?: number;
};

export type PowerMode = "OFF" | "READY";

export type VehicleState = {
  powerMode: PowerMode;
  motorTorqueNm: number;
  vehicleSpeedMps: number;
  motorTempC: number;
  fanOn: boolean;
  rotorAngleDeg: number;
  timeS: number;
};

export const initialVehicleState = (overrides: Partial<VehicleState> = {}): VehicleState => ({
  powerMode: "OFF", motorTorqueNm: 0, vehicleSpeedMps: 0, motorTempC: 36, fanOn: false, rotorAngleDeg: 0, timeS: 0, ...overrides,
});

export type VehicleOutputs = {
  pedalProcessedPct: number;
  torqueRequestNm: number;
  wheelTorqueNm: number;
  brakePressureBar: number;
  wheelRpm: number;
  motorRpm: number;
  accelerationMps2: number;
  speedKph: number;
  fanRpm: number;
  deratePct: number;
};

const G = 9.81;
const rpmFromRadS = (value: number) => value * 60 / (2 * Math.PI);

export function stepVehicle(
  state: VehicleState,
  input: DriverInputs,
  dt: number,
  faults: FaultSet = {},
  params: VehicleParams = DEFAULT_VEHICLE,
): { state: VehicleState; outputs: VehicleOutputs; trace: TraceEntry[] } {
  const trace: TraceEntry[] = [];
  const log = (layer: SimLayer, componentId: string, portId: string, signal: string, value: number | string | boolean, unit: string) =>
    trace.push({ order: trace.length, layer, componentId, portId, signal, value: typeof value === "number" ? Math.round(value * 100) / 100 : value, unit });

  // 1. Driver input layer
  log("driver", "start_button", "start_out", "StartRequest", input.StartRequest, "bool");
  log("driver", "accel_pedal", "app_out", "APP_Position", input.APP_Position, "%");
  log("driver", "brake_pedal", "bpp_out", "BPP_Position", input.BPP_Position, "%");
  log("driver", "gear_selector", "gear_out", "Gear_Request", input.Gear_Request, "enum");

  // 2. Control SW — power mode (START with brake pressed → READY; START at standstill → OFF)
  let powerMode = state.powerMode;
  const standstill = Math.abs(state.vehicleSpeedMps) < 0.3;
  if (input.StartRequest && powerMode === "OFF" && input.BPP_Position >= 10) powerMode = "READY";
  else if (input.StartRequest && powerMode === "READY" && standstill) powerMode = "OFF";
  log("control", "vcu", "ready_out", "Vehicle_Ready", powerMode === "READY", "bool");
  log("control", "main_contactor", "hv_out", "Contactor_Closed", powerMode === "READY", "bool");

  // Thermal ECU (feedback from previous tick's temperature)
  const fanOn = state.motorTempC >= params.fanOnC ? true : state.motorTempC <= params.fanOffC ? false : state.fanOn;
  const fanPwm = fanOn ? 100 : 0;
  const fanRpm = faults.fanStuck ? 0 : fanPwm / 100 * params.fanMaxRpm;
  const deratePct = Math.min(50, Math.max(0, (state.motorTempC - params.derateStartC) / (params.derateFullC - params.derateStartC) * 50));
  log("sensor", "motor_temp_sensor", "temp_out", "Motor_Temperature", state.motorTempC, "°C");
  log("control", "thermal_ecu", "fan_pwm_out", "Fan_PWM", fanPwm, "%");
  log("plant", "cooling_fan", "speed_out", "Fan_Speed", fanRpm, "rpm");
  log("communication", "thermal_ecu", "derate_out", "Thermal_Derate", deratePct, "%");

  // VCU torque path: input stage → pedal map → interlock → limits
  const pedalProcessedPct = input.APP_Position * (faults.pedalScale ?? 1);
  log("control", "vcu", "app_in", "APP_Processed", pedalProcessedPct, "%");
  const mapTorque = pedalProcessedPct / 100 * params.maxMotorTorqueNm;
  const driveAllowed = powerMode === "READY" && (input.Gear_Request === "D" || input.Gear_Request === "R");
  const brakeOverride = input.BPP_Position > 5 && input.APP_Position > 0;
  const motorOmega = Math.abs(state.vehicleSpeedMps) / params.wheelRadiusM * params.gearRatio;
  const powerLimitNm = motorOmega > 1 ? params.maxPowerKw * 1000 / motorOmega : params.maxMotorTorqueNm;
  const limit = Math.min(params.maxMotorTorqueNm, powerLimitNm) * (1 - deratePct / 100);
  const direction = input.Gear_Request === "R" ? -1 : 1;
  const torqueRequestNm = driveAllowed && !brakeOverride ? direction * Math.min(mapTorque, limit) : 0;
  log("communication", "bms", "limit_out", "Discharge_Power_Limit", powerMode === "READY" ? params.maxPowerKw : 0, "kW");
  log("communication", "vcu", "torque_req_out", "Torque_Request", torqueRequestNm, "Nm");

  // 3. Hardware / plant — MCU + inverter + motor as a first-order torque lag
  const alpha = 1 - Math.exp(-dt / params.motorTorqueTauS);
  const motorTorqueNm = powerMode === "READY" ? state.motorTorqueNm + (torqueRequestNm - state.motorTorqueNm) * alpha : 0;
  log("plant", "mcu", "gate_cmd_out", "PWM_Duty", Math.min(100, Math.abs(torqueRequestNm) / params.maxMotorTorqueNm * 100), "%");
  log("plant", "traction_motor", "shaft_out", "Motor_Torque", motorTorqueNm, "Nm");
  const wheelTorqueNm = motorTorqueNm * params.gearRatio * params.gearEfficiency;
  log("plant", "reduction_gear", "out", "Gear_Output_Torque", wheelTorqueNm, "Nm");
  log("plant", "drive_shaft", "out", "Shaft_Torque_Per_Side", wheelTorqueNm / 2, "Nm");

  // Brake path: Brake ECU → modulator → caliper
  const pressureCmd = input.BPP_Position * params.brakeBarPerPercent;
  const brakePressureBar = pressureCmd * (faults.brakePressureGain ?? 1);
  const brakeTorqueNm = brakePressureBar * params.brakeTorquePerBarNm;
  log("control", "brake_ecu", "pressure_cmd_out", "Pressure_Command", pressureCmd, "bar");
  log("plant", "hydraulic_modulator", "pressure_out", "Brake_Pressure", brakePressureBar, "bar");
  log("plant", "brake_caliper", "brake_torque_out", "Brake_Torque", brakeTorqueNm, "Nm");

  // 4. Vehicle dynamics — longitudinal force balance
  const v = state.vehicleSpeedMps;
  const moving = Math.abs(v) > 0.05;
  const sign = moving ? Math.sign(v) : Math.sign(wheelTorqueNm) || 1;
  const driveForce = wheelTorqueNm / params.wheelRadiusM;
  const resist = 0.5 * params.airDensity * params.dragCoefCdA * v * v + (moving ? params.rollingCoef * params.massKg * G : 0);
  const brakeForce = brakeTorqueNm / params.wheelRadiusM;
  let net = driveForce - sign * resist;
  if (moving) net -= sign * brakeForce;
  else if (Math.abs(driveForce) <= brakeForce) net = 0; // held by brakes at standstill
  const accelerationMps2 = net / params.massKg;
  let vehicleSpeedMps = v + accelerationMps2 * dt;
  if (moving && Math.sign(vehicleSpeedMps) !== Math.sign(v)) vehicleSpeedMps = 0; // resistance/brakes cannot reverse motion
  log("dynamics", "wheel", "drive_torque_in", "Longitudinal_Accel", accelerationMps2, "m/s²");

  // 5. Feedback — sensors read the new physical state
  const wheelRpm = rpmFromRadS(vehicleSpeedMps / params.wheelRadiusM);
  const motorRpm = wheelRpm * params.gearRatio;
  const speedKph = vehicleSpeedMps * 3.6;
  const rotorAngleDeg = (state.rotorAngleDeg + motorRpm / 60 * 360 * dt) % 360;
  log("feedback", "wheel_speed_sensor", "signal_out", "Wheel_Speed", wheelRpm, "rpm");
  log("feedback", "brake_ecu", "vehicle_speed_out", "Vehicle_Speed", speedKph, "km/h");
  log("feedback", "rotor_position_sensor", "angle_out", "Rotor_Position", (rotorAngleDeg + 360) % 360, "deg");

  // Lumped thermal model: copper loss ∝ torque², fan increases cooling
  const heating = (motorTorqueNm / params.maxMotorTorqueNm) ** 2 * 1.6;
  const cooling = (state.motorTempC - 30) * (0.004 + fanRpm / params.fanMaxRpm * 0.03);
  const motorTempC = state.motorTempC + (heating - cooling) * dt;

  return {
    state: { powerMode, motorTorqueNm, vehicleSpeedMps, motorTempC, fanOn, rotorAngleDeg, timeS: state.timeS + dt },
    outputs: { pedalProcessedPct, torqueRequestNm, wheelTorqueNm, brakePressureBar, wheelRpm, motorRpm, accelerationMps2, speedKph, fanRpm, deratePct },
    trace,
  };
}
