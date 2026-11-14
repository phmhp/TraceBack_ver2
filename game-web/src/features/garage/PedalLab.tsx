import { useMemo, useState } from "react";
import { initialVehicleState, stepVehicle } from "../../sim/vehicleSim";
import { initialDriverInputs } from "../../sim/driverInput";

/** Steady-state values of the accelerator-pedal → torque path, taken from the vehicle model (stepVehicle), not hard-coded. */
export function pedalPath(appPct: number) {
  let state = initialVehicleState({ powerMode: "READY" });
  let outputs = stepVehicle(state, { ...initialDriverInputs(), APP_Position: 0, Gear_Request: "D" }, 0.01).outputs;
  // brief settle so the motor torque lag (tau 50 ms) has converged; speed stays near standstill
  for (let i = 0; i < 40; i++) {
    const result = stepVehicle({ ...state, vehicleSpeedMps: 0 }, { ...initialDriverInputs(), APP_Position: appPct, BPP_Position: 0, Gear_Request: "D" }, 0.01);
    state = result.state; outputs = result.outputs;
  }
  return { app: appPct, processed: outputs.pedalProcessedPct, request: outputs.torqueRequestNm, motor: state.motorTorqueNm, wheel: outputs.wheelTorqueNm, accel: outputs.accelerationMps2 };
}

const ROWS: { key: "app" | "request" | "motor" | "wheel" | "accel"; label: string; where: string; unit: string; digits: number }[] = [
  { key: "app", label: "페달 위치", where: "입력 · APP 센서", unit: "%", digits: 0 },
  { key: "request", label: "토크 요청", where: "제어 SW · VCU", unit: "Nm", digits: 0 },
  { key: "motor", label: "모터 토크", where: "인버터·모터", unit: "Nm", digits: 0 },
  { key: "wheel", label: "바퀴 토크", where: "감속기·차동", unit: "Nm", digits: 0 },
  { key: "accel", label: "가속도", where: "차량 반응", unit: "m/s²", digits: 1 },
];

export function PedalLab() {
  const [pedal, setPedal] = useState(0);
  const path = useMemo(() => pedalPath(pedal), [pedal]);
  const max = 340; // DEFAULT_VEHICLE.maxMotorTorqueNm, used only for the bar scale
  return <section className="pedalLab" aria-label="가속 페달 값 체험">
    <header><b>페달 값 바꿔 보기</b></header>
    <label className="pedalSlider">
      <input type="range" min={0} max={100} step={5} value={pedal} onChange={event => setPedal(Number(event.target.value))} aria-label="가속 페달 위치 퍼센트" />
      <output>{pedal}%</output>
    </label>
    <ol>
      {ROWS.map(row => {
        const value = path[row.key];
        const ratio = row.key === "app" ? value / 100 : row.key === "accel" ? Math.min(1, value / 4) : Math.min(1, Math.abs(value) / (row.key === "wheel" ? max * 9 : max));
        return <li key={row.key}>
          <span><b>{row.label}</b><small>{row.where}</small></span>
          <i aria-hidden="true"><em style={{ width: `${Math.round(Math.max(0, ratio) * 100)}%` }} /></i>
          <code>{value.toFixed(row.digits)}<small>{row.unit}</small></code>
        </li>;
      })}
    </ol>
  </section>;
}
