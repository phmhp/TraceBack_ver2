// Control SW view data: Input / Parameter / State / Decision / Output for the functions that have a verified model.
// Values marked "model" come from simModel.simulate (the same models STEP04 uses) with the SAME contract values;
// values marked "rule" are STEP01 explanation rules that the bench model does not compute — the UI shows them as such.
import { simulate, type Series } from "../verification/simModel.ts";
import { fallbackVerificationContract, type VerificationExecution } from "../../game/verificationContract.ts";
import type { CaseId } from "../../game/runtime.ts";

export type SwChip = { label: string; value: string; note?: string; kind: "model" | "rule" };
export type SwSlider = { id: string; label: string; unit: string; min: number; max: number; step: number; value: number };
export type SwView = {
  input: SwChip[]; parameter: SwChip[]; state: SwChip[]; decision: SwChip[]; output: SwChip[];
  sliders: SwSlider[]; note: string;
};
export type SwInputs = { ready: boolean; gearD: boolean; level: number; regen: boolean; fanOn: boolean };

const last = (list: Series[], id: string) => { const s = list.find(item => item.id === id); return s ? s.ref[s.ref.length - 1] : NaN; };
const num = (v: number, d = 0) => Number.isFinite(v) ? String(Math.round(v * 10 ** d) / 10 ** d) : "—";
const exec = (caseId: CaseId, patch: (base: VerificationExecution) => VerificationExecution) => patch(fallbackVerificationContract(caseId).execution);

export const hasSwView = (domain: string, feature: number) => ["drive:0", "drive:1", "thermal:1", "brake:1"].includes(`${domain}:${feature}`);

// ── thresholds are read from the model, not typed in ──
let thermalCache: { on: number; off: number; rpm: number } | null = null;
export function thermalThresholds() {
  if (thermalCache) return thermalCache;
  const rise = simulate("thermal", "req", true, exec("thermal", b => ({ ...b, durationSeconds: 60, stimulus: { ...b.stimulus, startValue: 40, endValue: 100, rampSeconds: 60, holdSeconds: 0 } })));
  const fall = simulate("thermal", "req", true, exec("thermal", b => ({ ...b, durationSeconds: 60, initial: b.initial.map(i => i.signalId === "coolantTemperature" ? { ...i, value: 100 } : i), stimulus: { ...b.stimulus, startValue: 100, endValue: 40, rampSeconds: 60, holdSeconds: 0 } })));
  const req = (r: typeof rise, id: string) => r.levels.unit.find(s => s.id === id)!;
  const onIndex = req(rise, "req").ref.findIndex(v => v >= 50);
  const fallOn = req(fall, "req").ref.findIndex(v => v >= 50); // the fan first switches on (the model starts with the fan off)
  const offIndex = req(fall, "req").ref.findIndex((v, i) => i > fallOn && v < 50);
  thermalCache = {
    on: Math.round(req(rise, "tin").ref[onIndex]), off: Math.round(req(fall, "tin").ref[offIndex]),
    rpm: fallbackVerificationContract("thermal").execution.expectedOutputs.find(o => o.signalId === "rpm")!.value,
  };
  return thermalCache;
}

export function swView(domain: string, feature: number, inp: SwInputs): SwView | null {
  const key = `${domain}:${feature}`;
  if (key === "drive:0") {
    const pedal = inp.level;
    const run = simulate("propulsion", "req", true, exec("propulsion", b => ({ ...b, durationSeconds: 1.5, stimulus: { ...b.stimulus, startValue: 0, endValue: pedal, rampSeconds: 0 } })));
    const full = simulate("propulsion", "boundary", true);
    const gain = last(full.levels.unit, "req") / 100, limit = last(full.levels.swint, "arb");
    const req = last(run.levels.unit, "req"), arb = last(run.levels.swint, "arb");
    const permit = inp.ready && inp.gearD;
    return {
      sliders: [{ id: "level", label: "가속 페달", unit: "%", min: 0, max: 100, step: 5, value: pedal }],
      note: "구동 허용은 STEP01 조건 규칙이에요(시험 모델은 READY·D단을 전제로 계산). 나머지 값은 STEP04와 같은 정상 모델 계산값이에요.",
      input: [{ label: "페달 위치 aps", value: `${num(last(run.levels.unit, "aps"))} %`, kind: "model" }, { label: "READY / D단", value: `${inp.ready ? "켜짐" : "꺼짐"} / ${inp.gearD ? "D" : "—"}`, kind: "rule" }],
      parameter: [{ label: "페달 맵 기울기", value: `${num(gain, 1)} Nm/%`, kind: "model" }, { label: "가용 토크 한계", value: `${num(limit)} Nm`, kind: "model" }],
      state: [{ label: "필터 출력 filt", value: `${num(last(run.levels.unit, "filt"))} %`, kind: "model" }, { label: "구동 허용 상태", value: permit ? "허용" : "차단", kind: "rule" }],
      decision: [{ label: "구동 허용 (READY ∧ D)", value: permit ? "통과" : "차단", kind: "rule" }, { label: "한계 MIN", value: req > limit + 0.5 ? `요청 ${num(req)} > 한계 → ${num(limit)}로 제한` : `요청 ${num(req)} ≤ 한계 → 그대로`, kind: "model" }],
      output: [{ label: "토크 명령 (CAN)", value: permit ? `${num(last(run.levels.embedded, "can"))} Nm` : "0 Nm", note: permit ? undefined : "허용 규칙으로 차단", kind: permit ? "model" : "rule" }, { label: "모터 토크", value: permit ? `${num(last(run.levels.vehicle, "mot"))} Nm` : "0 Nm", kind: permit ? "model" : "rule" }],
    };
  }
  if (key === "drive:1") {
    const permit = inp.ready && inp.gearD;
    return {
      sliders: [], note: "이 기능은 조건 규칙을 설명하는 구조예요. 시험 모델에는 없어서 계산 값이 아니에요.",
      input: [{ label: "기어 위치", value: inp.gearD ? "D" : "P/N/R", kind: "rule" }, { label: "READY", value: inp.ready ? "켜짐" : "꺼짐", kind: "rule" }],
      parameter: [{ label: "허용 기어", value: "D", kind: "rule" }],
      state: [{ label: "고장 래치", value: "해제", note: "고장 입력이 없는 상태", kind: "rule" }],
      decision: [{ label: "Gear == D", value: inp.gearD ? "참" : "거짓", kind: "rule" }, { label: "HV READY", value: inp.ready ? "참" : "거짓", kind: "rule" }, { label: "Permit Gate = AND", value: permit ? "열림" : "닫힘", kind: "rule" }],
      output: [{ label: "인버터 Enable", value: permit ? "허용 (1)" : "차단 (0)", kind: "rule" }],
    };
  }
  if (key === "thermal:1") {
    const t = thermalThresholds(), temp = inp.level;
    const from = inp.fanOn ? 100 : 40;
    const run = simulate("thermal", "req", true, exec("thermal", b => ({ ...b, durationSeconds: 40, initial: b.initial.map(i => i.signalId === "coolantTemperature" ? { ...i, value: from } : i), stimulus: { ...b.stimulus, startValue: from, endValue: temp, rampSeconds: 30, holdSeconds: 10 } })));
    const on = inp.fanOn;
    return {
      sliders: [{ id: "level", label: "냉각수 온도", unit: "°C", min: 40, max: 100, step: 1, value: temp }],
      note: "켜짐·꺼짐 기준과 PWM·회전수는 STEP04와 같은 정상 모델에서 계산한 값이에요(두 기준 사이는 이전 상태를 따라요).",
      input: [{ label: "냉각수 온도", value: `${num(temp)} °C`, kind: "model" }],
      parameter: [{ label: "켜짐 기준", value: `≥ ${t.on} °C`, kind: "model" }, { label: "꺼짐 기준", value: `≤ ${t.off} °C`, kind: "model" }, { label: "목표 회전수", value: `${t.rpm} rpm`, kind: "model" }],
      state: [{ label: "팬 요청 상태", value: on ? "켜짐 (ON)" : "꺼짐 (OFF)", note: temp > t.off && temp < t.on ? "기준 사이: 이전 상태 유지" : undefined, kind: "model" }],
      decision: [{ label: "히스테리시스", value: temp >= t.on ? `${t.on}°C 이상 → 켜기` : temp <= t.off ? `${t.off}°C 이하 → 끄기` : "기준 사이 → 유지", kind: "model" }],
      output: [{ label: "팬 PWM 듀티", value: `${num(last(run.levels.unit, "duty"))} %`, kind: "model" }, { label: "팬 회전수", value: `${num(last(run.levels.embedded, "rpm"))} rpm`, kind: "model" }],
    };
  }
  if (key === "brake:1") {
    const pedal = inp.level;
    const base = fallbackVerificationContract("brake").execution;
    const regenMax = base.initial.find(i => i.signalId === "regenAvailable")!.value;
    const run = simulate("brake", "req", true, exec("brake", b => ({ ...b, durationSeconds: 2, initial: b.initial.map(i => i.signalId === "regenAvailable" ? { ...i, value: inp.regen ? regenMax : 0 } : i), stimulus: { ...b.stimulus, startValue: 0, endValue: pedal, rampSeconds: 0 } })));
    const ref55 = simulate("brake", "req", true);
    const perM = last(ref55.levels.unit, "cmd") / last(ref55.levels.unit, "fric");
    return {
      sliders: [{ id: "level", label: "브레이크 페달", unit: "%", min: 0, max: 100, step: 5, value: pedal }],
      note: "모든 값이 STEP04와 같은 정상 모델 계산값이에요(회생 가용량은 배터리 상태 입력).",
      input: [{ label: "페달 위치", value: `${num(pedal)} %`, kind: "model" }, { label: "회생 가용량", value: inp.regen ? `${regenMax} m/s²` : "0 m/s² (배터리 가득)", kind: "model" }],
      parameter: [{ label: "압력 환산", value: `${num(perM)} bar / (m/s²)`, kind: "model" }],
      state: [{ label: "회생 몫", value: `${num(last(run.levels.swint, "regen"), 1)} m/s²`, kind: "model" }],
      decision: [{ label: "목표 감속 (요구)", value: `${num(last(run.levels.unit, "req"), 1)} m/s²`, kind: "model" }, { label: "마찰 몫 = 요구 − 회생", value: `${num(last(run.levels.unit, "fric"), 1)} m/s²`, kind: "model" }],
      output: [{ label: "마찰 압력 명령", value: `${num(last(run.levels.unit, "cmd"))} bar`, kind: "model" }],
    };
  }
  return null;
}
