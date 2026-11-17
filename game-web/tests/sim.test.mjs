import test from "node:test";
import assert from "node:assert/strict";
import { COMPONENTS, CONNECTIONS, ECUS } from "../src/sim/components.ts";
import { affectedByExclusion, applyInclusion, createRuntimeState, neighbors, resolveEndpoint, validateRegistry } from "../src/sim/registry.ts";
import { initialDriverInputs, requestGear, roadWheelAngle, stepDriverInputs } from "../src/sim/driverInput.ts";
import { initialVehicleState, stepVehicle } from "../src/sim/vehicleSim.ts";

const keys = (...names) => new Set(names);
const run = (state, input, seconds, faults, dt = 0.02) => {
  let result = { state };
  for (let t = 0; t < seconds; t += dt) result = stepVehicle(result.state, input, dt, faults);
  return result;
};

test("registry: every component has unique IDs, ports and a model asset ID", () => {
  assert.equal(new Set(COMPONENTS.map(c => c.id)).size, COMPONENTS.length);
  for (const c of COMPONENTS) {
    assert.ok(c.modelAssetId.startsWith("asset."), c.id);
    assert.ok(c.ports.length > 0, c.id);
  }
  // No licensed 3D asset is recorded yet, so nothing may claim to be sourced.
  assert.ok(COMPONENTS.every(c => c.modelFidelity === "educational_simplified"));
});

test("registry: connections run out→in with matching flow type and unit", () => {
  const errors = validateRegistry().filter(issue => issue.level === "error");
  assert.deepEqual(errors, []);
});

test("registry: validation catches a power line wired into a data port", () => {
  const bad = [...CONNECTIONS, { id: "bad", from: "inverter.ac_out", to: "vcu.app_in", flow: "electrical_power" }];
  const errors = validateRegistry(COMPONENTS, bad).filter(issue => issue.level === "error");
  assert.ok(errors.some(issue => issue.message.includes("bad")));
});

test("registry: the full propulsion path and its feedback loops exist (doc 8-3)", () => {
  const forward = ["vcu.torque_req_out>mcu.torque_req_in", "mcu.gate_cmd_out>inverter.gate_in", "inverter.ac_out>traction_motor.ac_in",
    "traction_motor.shaft_out>reduction_gear.in", "differential.left_out>drive_shaft.in", "drive_shaft.out>wheel.drive_torque_in"];
  const pairs = CONNECTIONS.map(c => `${c.from}>${c.to}`);
  for (const link of forward) assert.ok(pairs.includes(link), link);
  const feedbackTargets = CONNECTIONS.filter(c => c.feedback).map(c => c.to.split(".")[0]);
  for (const ecu of ["brake_ecu", "mcu", "bms", "thermal_ecu"]) assert.ok(feedbackTargets.includes(ecu), ecu);
  assert.equal(resolveEndpoint("accel_pedal.app_out").port.signal, "APP_Position");
  assert.ok(neighbors("traction_motor").includes("reduction_gear"));
  assert.ok(ECUS.every(ecu => COMPONENTS.some(c => c.id === ecu.id)));
});

test("inclusion: hiding is separate from excluding, and excluding the battery degrades downstream parts", () => {
  const affected = affectedByExclusion(["hv_battery"]);
  for (const id of ["main_contactor", "inverter", "traction_motor", "wheel", "bms"]) assert.ok(affected.includes(id), id);
  const state = applyInclusion(createRuntimeState(), ["hv_battery"]);
  assert.equal(state.hv_battery.included, false);
  assert.equal(state.hv_battery.visible, true);
  assert.equal(state.inverter.degraded, true);
  assert.equal(state.brake_pedal.degraded, false);
});

test("driver input: keys move pedals and wheel at finite rates and spring back", () => {
  let s = initialDriverInputs();
  s = stepDriverInputs(s, keys("w"), 0.1);
  assert.ok(s.APP_Position > 0 && s.APP_Position < 100);
  for (let i = 0; i < 10; i++) s = stepDriverInputs(s, keys("w", "d"), 0.1);
  assert.equal(s.APP_Position, 100);
  assert.equal(s.Steering_Angle, 420);
  assert.ok(Math.abs(roadWheelAngle(s.Steering_Angle) - 28.97) < 0.01);
  for (let i = 0; i < 10; i++) s = stepDriverInputs(s, keys(), 0.1);
  assert.equal(s.APP_Position, 0);
  assert.equal(s.Steering_Angle, 0);
  s = stepDriverInputs(s, keys(" "), 1);
  assert.equal(s.BPP_Position, 100, "Space works as auxiliary brake");
});

test("driver input: Enter produces a one-tick StartRequest pulse", () => {
  let s = stepDriverInputs(initialDriverInputs(), keys("enter"), 0.02);
  assert.equal(s.StartRequest, true);
  s = stepDriverInputs(s, keys("enter"), 0.02);
  assert.equal(s.StartRequest, false);
});

test("driver input: leaving P needs the brake pedal", () => {
  const released = initialDriverInputs();
  assert.equal(requestGear(released, "D").Gear_Request, "P");
  assert.equal(requestGear({ ...released, BPP_Position: 40 }, "D").Gear_Request, "D");
});

test("vehicle: START with brake → READY; no READY means no torque", () => {
  const drive = { StartRequest: false, APP_Position: 60, BPP_Position: 0, Steering_Angle: 0, Gear_Request: "D" };
  const off = run(initialVehicleState(), drive, 1);
  assert.equal(off.state.powerMode, "OFF");
  assert.equal(off.state.vehicleSpeedMps, 0);
  const noBrake = stepVehicle(initialVehicleState(), { ...drive, StartRequest: true, APP_Position: 0 }, 0.02);
  assert.equal(noBrake.state.powerMode, "OFF");
  const ready = stepVehicle(initialVehicleState(), { ...drive, StartRequest: true, APP_Position: 0, BPP_Position: 50 }, 0.02);
  assert.equal(ready.state.powerMode, "READY");
});

test("vehicle: APP 60 % gives the case reference 204 Nm; the propulsion fault gives 27 % / 92 Nm", () => {
  const input = { StartRequest: false, APP_Position: 60, BPP_Position: 0, Steering_Angle: 0, Gear_Request: "D" };
  const ready = initialVehicleState({ powerMode: "READY" });
  const healthy = stepVehicle(ready, input, 0.02);
  assert.equal(healthy.outputs.torqueRequestNm, 204);
  const faulty = stepVehicle(ready, input, 0.02, { pedalScale: 0.45 });
  assert.equal(Math.round(faulty.outputs.pedalProcessedPct), 27);
  assert.equal(Math.round(faulty.outputs.torqueRequestNm), 92);
  const a = run(ready, input, 3), b = run(ready, input, 3, { pedalScale: 0.45 });
  assert.ok(a.state.vehicleSpeedMps > b.state.vehicleSpeedMps * 1.8, "fault visibly weakens acceleration");
});

test("vehicle: trace walks driver → control → communication → plant → dynamics → feedback", () => {
  const { trace } = stepVehicle(initialVehicleState({ powerMode: "READY", vehicleSpeedMps: 10 }),
    { StartRequest: false, APP_Position: 60, BPP_Position: 0, Steering_Angle: 0, Gear_Request: "D" }, 0.02);
  const firstIndex = layer => trace.findIndex(entry => entry.layer === layer);
  assert.ok(firstIndex("driver") < firstIndex("control"));
  assert.ok(firstIndex("communication") < trace.findIndex(entry => entry.componentId === "traction_motor"));
  assert.ok(firstIndex("dynamics") < firstIndex("feedback"));
  assert.ok(trace.find(entry => entry.signal === "Wheel_Speed").value > 0);
  for (const entry of trace) assert.ok(COMPONENTS.some(c => c.id === entry.componentId), entry.componentId);
});

test("vehicle: brakes stop the car, brake demand 55 % ≈ 42 bar, brake overrides throttle", () => {
  const moving = initialVehicleState({ powerMode: "READY", vehicleSpeedMps: 20 });
  const both = { StartRequest: false, APP_Position: 100, BPP_Position: 55, Steering_Angle: 0, Gear_Request: "D" };
  const first = stepVehicle(moving, both, 0.02);
  assert.equal(Math.round(first.outputs.brakePressureBar), 42);
  assert.equal(first.outputs.torqueRequestNm, 0);
  const stopped = run(moving, both, 8);
  assert.equal(stopped.state.vehicleSpeedMps, 0);
  const weak = run(moving, both, 2, { brakeCommandScale: 0.2 });
  const strong = run(moving, both, 2);
  assert.ok(weak.state.vehicleSpeedMps > strong.state.vehicleSpeedMps, "brake fault lengthens stopping");
});

test("vehicle: fan turns on above 65 °C; a skipped PWM write reads 0 rpm and overheating derates torque", () => {
  const input = { StartRequest: false, APP_Position: 0, BPP_Position: 0, Steering_Angle: 0, Gear_Request: "D" };
  const hot = initialVehicleState({ powerMode: "READY", motorTempC: 78.4 });
  const healthy = stepVehicle(hot, input, 0.02);
  assert.equal(healthy.outputs.fanRpm, 1850);
  const skippedWrite = stepVehicle(hot, input, 0.02, { fanPwmOutputScale: 0 });
  assert.equal(skippedWrite.outputs.fanRpm, 0);
  const derated = stepVehicle(initialVehicleState({ powerMode: "READY", motorTempC: 85 }), { ...input, APP_Position: 100 }, 0.02);
  assert.ok(derated.outputs.deratePct > 0 && derated.outputs.torqueRequestNm < 340);
});
