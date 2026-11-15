// Small numeric models for the bench. Every run is actually computed step by step (dt = 5 ms of model time):
// the reference run uses the healthy design, the field run injects the case's fault, the fixed run removes it.
// Levels follow ISO 26262: Part 6 단위 검증(9절) → SW 통합 검증(10절) → 임베디드 SW 시험(11절),
// then system integration → vehicle verification (one tab "시스템·차량 통합").
// The test environment is a separate axis (MIL/SIL/PIL/HIL/차량). Up to the embedded SW test the plant
// (sensors, loads, vehicle) is SIMULATED. Fault injection is limited to SW logic, data and interfaces.
import type { CaseId } from "../../game/runtime";
import type { VerificationContract, VerificationExecution, VerificationLevel } from "../../game/verificationContract";

export type Lv = "unit" | "swint" | "embedded" | "vehicle";
export type Tech = "req" | "replay" | "boundary" | "soak" | "inject";
/** `min` (default 0) lets a signal be signed, e.g. a regenerative torque request of -40 Nm. */
export type Series = { id: string; name: string; unit: string; min?: number; max: number; ref: number[]; run: number[] };
export const span = (s: Pick<Series, "min" | "max">) => s.max - (s.min ?? 0);
export type SimResult = { seconds: number; timeUnit: string; levels: Record<Lv, Series[]> };

export const SAMPLES = 120;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Runs `step` over the model time and samples every output SAMPLES+1 times. */
function integrate<S>(seconds: number, init: S, step: (s: S, t: number, dt: number) => void, read: (s: S) => Record<string, number>) {
  const dt = .005, out: Record<string, number[]> = {};
  const total = Math.round(seconds / dt), every = total / SAMPLES;
  let next = 0;
  for (let k = 0; k <= total; k++) {
    const t = k * dt;
    if (k >= next - 1e-9) { const r = read(init); for (const key in r) (out[key] ??= []).push(r[key]); next += every; }
    step(init, t, dt);
  }
  for (const key in out) out[key] = out[key].slice(0, SAMPLES + 1);
  return out;
}

// ── 구동: 페달 → (필터 → [×0.45 끼어든 보정] → 페달 맵 → 허용 → MIN → 램프) → CAN → 인버터·모터 → 차량 ──
const initialValue = (execution: VerificationExecution | undefined, signalId: string, fallback: number) => execution?.initial.find(item => item.signalId === signalId)?.value ?? fallback;
const rampInput = (execution: VerificationExecution, t: number) => {
  const { startValue, endValue, rampSeconds } = execution.stimulus;
  if (rampSeconds <= 0) return endValue;
  return startValue + (endValue - startValue) * clamp(t / rampSeconds, 0, 1);
};

function propulsion(tech: Tech, fault: boolean, execution?: VerificationExecution) {
  // req: 60 % step (requirement value) · boundary: 100 % step (top of the pedal map, torque limit 260 Nm) · replay: field ramp with driver wobble
  const pedal = (t: number) => execution ? rampInput(execution, t) : tech === "replay" ? (t < .1 ? 0 : Math.min(60, (t - .1) * 150 + Math.sin(t * 9) * 1.2)) : t < .1 ? 0 : tech === "boundary" ? 100 : 60;
  const seconds = execution?.durationSeconds ?? 3;
  return integrate(seconds, { filt: execution?.stimulus.startValue ?? 0, ramp: 0, can: 0, mot: 0, v: initialValue(execution, "vehicleSpeed", 60) / 3.6, acc: 0, p: 0, proc: 0, req: 0, arb: 0 }, (s, t, dt) => {
    s.p = pedal(t);
    s.filt += (s.p - s.filt) * dt / .04;
    s.proc = s.filt * (fault ? .45 : 1);           // the fault: a calibration block that is not in the design
    s.req = 3.4 * s.proc;                           // pedal map: 60 % → 204 Nm
    s.arb = Math.min(s.req, 260);                   // available torque limit (BMS · temperature)
    s.ramp += clamp(s.arb - s.ramp, -600 * dt, 600 * dt);
    s.can += (Math.round(s.ramp) - s.can) * dt / .01;
    s.mot += (s.can - s.mot) * dt / .03;
    s.acc = s.mot * 9 / .33 / 1800 - .3;
    s.v += s.acc * dt;
  }, s => ({ aps: s.p, filt: s.filt, proc: s.proc, req: s.req, arb: s.arb, can: s.can, mot: s.mot, cur: s.mot * 1.5, pin: .5 + s.p / 100 * 4, acc: s.acc, spd: s.v * 3.6 }));
}

// ── 열관리: 열 부하 → 냉각수 온도 → (범위 검사 → 필터 → 히스테리시스 → PI) → PWM 출력단 → 팬 모터 → 냉각 ──
function thermal(tech: Tech, fault: boolean, execution?: VerificationExecution) {
  const heat = tech === "soak" || tech === "replay" ? 57 : 50; // a short requirement pulse heats less
  const initialTemperature = initialValue(execution, "coolantTemperature", 64);
  const seconds = execution?.durationSeconds ?? 8;
  return integrate(seconds, { tc: initialTemperature, tf: initialTemperature, on: 0, int: 0, duty: 0, rpm: 0, tm: 70, der: 100 }, (s, t, dt) => {
    if (execution) s.tc = rampInput(execution, t);
    else {
      const load = tech === "req" && t > 2 ? 30 : heat;
      s.tc += (load - (1 + .267 * s.rpm / 1850) * (s.tc - 25)) / 3 * dt;
    }
    s.tf += (s.tc - s.tf) * dt / .2;
    if (s.tf > 65) s.on = 1; else if (s.tf < 60) s.on = 0;    // hysteresis 65 / 60 °C
    const e = s.on ? 1850 - s.rpm : 0;
    s.int = s.on ? clamp(s.int + e * dt * .004, -40, 40) : 0;
    s.duty = s.on ? clamp(60 + .002 * e + s.int, 0, 100) : 0;   // PI on the measured fan speed
    const pwmOut = s.duty * (fault ? 0 : 1);                    // fault: output-adapter SW skips the PWM write
    const target = pwmOut / 68 * 1850;
    s.rpm += (target - s.rpm) * dt / .3;
    s.tm += ((70 + 2.6 * (s.tc - 70)) - s.tm) * dt / 1.5;
    s.der += ((s.tm > 90 ? 60 : 100) - s.der) * dt / .4;
  }, s => ({ tc: s.tc, tf: s.tf, fanReq: s.on * 100, duty: s.duty, pwmOut: s.duty * (fault ? 0 : 1), pinV: 4.5 - s.tc * .03, supply: 12, rpm: s.rpm, diag: 0, tm: s.tm, der: s.der, acc: 2.8 * s.der / 100 }));
}

// ── 제동: 페달 → (요구 → 회생 MIN → 잔여력 → 마찰 압력) → 밸브 → 유압 라인 → 캘리퍼 → 차량 감속 ──
function brake(tech: Tech, fault: boolean, execution?: VerificationExecution) {
  const regenMax = initialValue(execution, "regenAvailable", tech === "boundary" ? 0 : 1.1); // battery full → no regeneration: friction carries everything
  const seconds = execution?.durationSeconds ?? 3;
  return integrate(seconds, { p: execution?.stimulus.startValue ?? 0, req: 0, regen: 0, fric: 0, cmd: 0, line: 0, cal: 0, v: initialValue(execution, "vehicleSpeed", 50) / 3.6, dec: 0 }, (s, t, dt) => {
    s.p = execution ? rampInput(execution, t) : clamp((t - .05) / .2, 0, 1) * 55;
    s.req = s.p * 3.2 / 55;
    s.regen += (Math.min(s.req, regenMax) - s.regen) * dt / .05;
    s.fric = Math.max(0, s.req - s.regen);
    s.cmd = s.fric * 20;                                          // 2.1 m/s² → 42 bar
    const cmdOut = s.cmd * (fault ? .19 : 1);                     // fault: output-interface SW applies a second scale
    s.line += (cmdOut - s.line) * dt / .08;
    s.cal += (s.line - s.cal) * dt / .02;
    s.dec = s.regen + s.cal / 20;
    s.v = Math.max(0, s.v - s.dec * dt);
  }, s => ({ p: s.p, req: s.req, avail: regenMax, fric: s.fric, cmd: s.cmd, cmdOut: s.cmd * (fault ? .19 : 1), valve: s.cmd * (fault ? .19 : 1) * 1.4, cur: s.cmd * (fault ? .19 : 1) * .02, line: s.line, cal: s.cal, regen: s.regen, dec: s.dec, spd: s.v * 3.6 }));
}

// ── 회생(코스팅): 회생 요청(−) → VCU 변환(부호 반영 → 한계 → 램프) → CAN → 인버터·모터 → 차량 가감속 ──
function regen(tech: Tech, fault: boolean, execution?: VerificationExecution) {
  // req: -40 Nm (requirement value) · boundary: -80 Nm (largest regeneration request) · replay: field ramp with driver wobble
  const request = (t: number) => execution ? rampInput(execution, t) : tech === "replay" ? (t < .1 ? 0 : Math.max(-40, -(t - .1) * 80 + Math.sin(t * 9) * 1.5)) : t < .1 ? 0 : tech === "boundary" ? -80 : -40;
  const seconds = execution?.durationSeconds ?? 5.5;
  return integrate(seconds, { req: 0, sgn: 0, lim: 0, ramp: 0, can: 0, mot: 0, v: initialValue(execution, "vehicleSpeed", 60) / 3.6, acc: 0 }, (s, t, dt) => {
    s.req = request(t);
    s.sgn = fault ? Math.abs(s.req) : s.req;      // the fault: the sign block of the design is missing, only the magnitude is used
    s.lim = clamp(s.sgn, -80, 80);                // available regeneration limit (battery)
    s.ramp += clamp(s.lim - s.ramp, -600 * dt, 600 * dt);
    s.can += (Math.round(s.ramp) - s.can) * dt / .01;
    s.mot += (s.can - s.mot) * dt / .03;
    s.acc = s.mot / 80;                           // 80 Nm per 1 m/s² on level ground
    s.v += s.acc * dt;
  }, s => ({ ped: 0, req: s.req, vcuOut: s.sgn, ramp: s.ramp, cansig: s.can, can: s.can, mot: s.mot, acc: s.acc, spd: s.v * 3.6 }));
}

// ── 시동(프리차지): 시동 요청 → (조건 확인 → 프리차지 접촉기 → 대기[버스 95 % 또는 타임아웃] → 주 접촉기) → READY ──
function ready(tech: Tech, fault: boolean, execution?: VerificationExecution) {
  // req: normal precharge (tau 250 ms) · boundary: cold start, slower charging (tau 350 ms) · replay: same as req
  const tau = (execution ? initialValue(execution, "prechargeTau", 250) : tech === "boundary" ? 350 : 250) / 1000;
  const pack = initialValue(execution, "packVoltage", 400);
  const timeout = fault ? .5 : 1.5;                                  // the fault: the wait limit of the design (1500 ms) is configured as 500 ms
  const seconds = execution?.durationSeconds ?? 1.6;
  return integrate(seconds, { req: 0, tStart: -1, vbus: 0, seq: 0, main: 0, ready: 0 }, (s, t, dt) => {
    s.req = execution ? rampInput(execution, t) : t < .05 ? 0 : 1;
    if (s.req >= .5 && s.tStart < 0) { s.tStart = t; s.seq = 1; }    // 1 = PRECHARGE
    if (s.tStart >= 0) s.vbus = pack * (1 - Math.exp(-(t - s.tStart) / tau));
    if (s.seq === 1) {
      if (s.vbus >= pack * .95) { s.seq = 2; s.main = 1; }           // 2 = READY: main contactor closed
      else if (t - s.tStart >= timeout) s.seq = 3;                   // 3 = FAIL: precharge timeout
    }
    s.ready = s.seq === 2 ? 1 : 0;
  }, s => ({ req: s.req, bms: 1, tmo: timeout * 1000, seq: s.seq, vbus: s.vbus, main: s.main, ready: s.ready }));
}


// ── 변속(통신 폴백): 레버 P→D → 게이트웨이 → CAN(메시지 간격) → VCU 수신(타임아웃 100 ms → 폴백 값) → 구동 지령 → 모터 → 차량 ──
function gear(tech: Tech, fault: boolean, execution?: VerificationExecution) {
  // req: bus load 85 % right after the shift (gap 120 ms) · boundary: bus load 70 % (gap 90 ms, still under the timeout) · replay: same as req
  const load = initialValue(execution, "busLoad", tech === "boundary" ? 70 : 85);
  const gapMs = load >= 80 ? 120 : load >= 60 ? 90 : 20;           // worst-case message gap while the bus is busy
  const seconds = execution?.durationSeconds ?? 0.35;
  const pedalAt = execution ? 0 : .2;
  return integrate(seconds, { lever: 0, gap: 20, tmo: 0, g: 0, cmd: 0, mot: 0, v: 0, ped: 0 }, (s, t, dt) => {
    s.lever = t < .1 ? 0 : 1;                                       // 0 = P, 1 = D
    s.ped = execution ? rampInput(execution, t) : t < pedalAt ? 0 : 40;
    s.gap = t >= .1 && t < .4 ? gapMs : 20;                          // the busy window lasts 0.3 s after the shift
    s.tmo = s.gap > 100 ? 1 : 0;                                    // VCU: no new message within 100 ms (5 cycles of 20 ms) -> communication error
    const fallback = fault ? -1 : 0;                                // the fault: the fallback value is R (-1) instead of the safe value N (0)
    s.g = s.tmo ? fallback : s.lever;                               // gear value the VCU uses: -1 R, 0 N, 1 D
    s.cmd = s.g * s.ped * 1.5;                                      // drive command (Nm): sign follows the gear value
    s.mot += (s.cmd - s.mot) * dt / .08;
    s.v += (s.mot / 10) * dt * 3.6;                                  // km/h
  }, s => ({ lever: s.lever, gap: s.gap, gw: s.lever, tmo: s.tmo, g: s.g, cmd: s.cmd, mot: s.mot, spd: s.v, ped: s.ped }));
}

type Def = { id: string; name: string; unit: string; min?: number; max: number; src: string; model?: boolean };
// per level: which signals exist there. `model: true` = taken from the healthy run (plant is a model at that level)
const VIEW: Record<CaseId, Record<Lv, Def[]>> = {
  propulsion: {
    unit: [
      { id: "aps", name: "입력값 인가 · 페달", unit: "%", max: 100, src: "aps" },
      { id: "filt", name: "입력 필터 출력", unit: "%", max: 100, src: "filt" },
      { id: "proc", name: "페달 처리값 (보정 후)", unit: "%", max: 100, src: "proc" },
      { id: "req", name: "페달 맵 · 토크 요청", unit: "Nm", max: 260, src: "req" },
    ],
    swint: [
      { id: "aps", name: "APS 입력 SWC 출력", unit: "%", max: 100, src: "filt" },
      { id: "proc", name: "토크 요청 SWC · 처리값", unit: "%", max: 100, src: "proc" },
      { id: "arb", name: "토크 중재(MIN) 출력", unit: "Nm", max: 260, src: "arb" },
      { id: "cansig", name: "통신 SWC · CAN 송신값", unit: "Nm", max: 260, src: "can" },
    ],
    embedded: [
      { id: "pin", name: "APS 핀 전압", unit: "V", max: 5, src: "pin" },
      { id: "can", name: "CAN 토크 명령 (버스)", unit: "Nm", max: 260, src: "can" },
      { id: "mot", name: "인버터 모델 · 모터 토크", unit: "Nm", max: 260, src: "mot" },
      { id: "cur", name: "모터 전류", unit: "A", max: 400, src: "cur" },
    ],
    vehicle: [
      { id: "aps", name: "페달 (로거)", unit: "%", max: 100, src: "aps" },
      { id: "can", name: "CAN 토크 (로거)", unit: "Nm", max: 260, src: "can" },
      { id: "mot", name: "모터 실제 토크", unit: "Nm", max: 260, src: "mot" },
      { id: "acc", name: "차량 가속도", unit: "m/s²", max: 4, src: "acc" },
      { id: "spd", name: "차량 속도", unit: "km/h", max: 110, src: "spd" },
    ],
  },
  thermal: {
    unit: [
      { id: "tin", name: "입력값 인가 · 냉각수 온도", unit: "°C", max: 100, src: "tc", model: true },
      { id: "tf", name: "필터 출력", unit: "°C", max: 100, src: "tf", model: true },
      { id: "req", name: "히스테리시스 · 팬 요청", unit: "%", max: 110, src: "fanReq", model: true },
      { id: "duty", name: "PI 출력 PWM 비율", unit: "%", max: 110, src: "duty", model: true },
    ],
    swint: [
      { id: "temp", name: "온도 SWC 출력", unit: "°C", max: 100, src: "tf", model: true },
      { id: "req", name: "팬 요청 SWC", unit: "%", max: 110, src: "fanReq", model: true },
      { id: "duty", name: "PWM 서비스 비율", unit: "%", max: 110, src: "duty", model: true },
      { id: "rpmModel", name: "팬 모델 회전", unit: "rpm", max: 2100, src: "rpm", model: true },
    ],
    embedded: [
      { id: "pinV", name: "온도 센서 핀 전압", unit: "V", max: 5, src: "pinV", model: true },
      { id: "pwm", name: "PWM 출력 어댑터 값", unit: "%", max: 110, src: "pwmOut" },
      { id: "supply", name: "팬 전원 전압", unit: "V", max: 14, src: "supply", model: true },
      { id: "rpm", name: "팬 부하 모델 회전", unit: "rpm", max: 2100, src: "rpm" },
    ],
    vehicle: [
      { id: "fpwm", name: "팬 커넥터 PWM", unit: "%", max: 110, src: "pwmOut" },
      { id: "fv", name: "팬 커넥터 전원 전압", unit: "V", max: 14, src: "supply" },
      { id: "rpm", name: "팬 실제 회전 (실부품 연결)", unit: "rpm", max: 2100, src: "rpm" },
      { id: "tc", name: "냉각수 온도", unit: "°C", max: 100, src: "tc" },
      { id: "tm", name: "모터 온도", unit: "°C", max: 110, src: "tm" },
      { id: "der", name: "출력 허용", unit: "%", max: 110, src: "der" },
    ],
  },
  brake: {
    unit: [
      { id: "req", name: "입력값 인가 · 제동 요구", unit: "m/s²", max: 4, src: "req", model: true },
      { id: "avail", name: "회생 가용량", unit: "m/s²", max: 4, src: "avail", model: true },
      { id: "fric", name: "잔여력 · 마찰 몫", unit: "m/s²", max: 4, src: "fric", model: true },
      { id: "cmd", name: "마찰 압력 명령", unit: "bar", max: 70, src: "cmd", model: true },
    ],
    swint: [
      { id: "p", name: "페달 SWC 출력", unit: "%", max: 100, src: "p", model: true },
      { id: "regen", name: "회생 요청 (→ VCU)", unit: "m/s²", max: 4, src: "regen", model: true },
      { id: "cmd", name: "압력 명령", unit: "bar", max: 70, src: "cmd", model: true },
      { id: "valve", name: "밸브 PWM 명령", unit: "%", max: 110, src: "valve", model: true },
    ],
    embedded: [
      { id: "cmd", name: "압력 계산값", unit: "bar", max: 70, src: "cmd", model: true },
      { id: "cmdOut", name: "I/O 어댑터 출력값", unit: "bar", max: 70, src: "cmdOut" },
      { id: "cur", name: "밸브 구동 전류", unit: "A", max: 1.5, src: "cur", model: true },
      { id: "line", name: "유압 모델 라인 압력", unit: "bar", max: 70, src: "line" },
    ],
    vehicle: [
      { id: "p", name: "제동 페달 (로거)", unit: "%", max: 100, src: "p" },
      { id: "cmd", name: "압력 계산값", unit: "bar", max: 70, src: "cmd" },
      { id: "cmdOut", name: "전송된 압력 명령", unit: "bar", max: 70, src: "cmdOut" },
      { id: "line", name: "캘리퍼 입구 압력 (실부품 연결)", unit: "bar", max: 70, src: "line" },
      { id: "cal", name: "캘리퍼 실제 압력", unit: "bar", max: 70, src: "cal" },
      { id: "dec", name: "차량 감속", unit: "m/s²", max: 4, src: "dec" },
    ],
  },
  regen: {
    unit: [
      { id: "req", name: "입력값 인가 · 회생 요청", unit: "Nm", min: -80, max: 80, src: "req", model: true },
      { id: "vcuOut", name: "토크 지령 변환 출력 (부호 반영)", unit: "Nm", min: -80, max: 80, src: "vcuOut" },
      { id: "ramp", name: "램프율 제한 출력", unit: "Nm", min: -80, max: 80, src: "ramp" },
    ],
    swint: [
      { id: "req", name: "회생 요청 SWC 출력", unit: "Nm", min: -80, max: 80, src: "req", model: true },
      { id: "vcuOut", name: "토크 지령 SWC · 변환 출력", unit: "Nm", min: -80, max: 80, src: "vcuOut" },
      { id: "cansig", name: "통신 SWC · CAN 송신값", unit: "Nm", min: -80, max: 80, src: "cansig" },
    ],
    embedded: [
      { id: "vcuOut", name: "토크 지령 변환 출력", unit: "Nm", min: -80, max: 80, src: "vcuOut" },
      { id: "can", name: "CAN 토크 지령 (버스)", unit: "Nm", min: -80, max: 80, src: "can" },
      { id: "mot", name: "인버터 모델 · 모터 토크", unit: "Nm", min: -80, max: 80, src: "mot" },
    ],
    vehicle: [
      { id: "ped", name: "가속 페달 (로거)", unit: "%", max: 100, src: "ped", model: true },
      { id: "req", name: "회생 요청 (로거)", unit: "Nm", min: -80, max: 80, src: "req", model: true },
      { id: "can", name: "CAN 토크 지령 (로거)", unit: "Nm", min: -80, max: 80, src: "can" },
      { id: "mot", name: "모터 실제 토크", unit: "Nm", min: -80, max: 80, src: "mot" },
      { id: "acc", name: "차량 가감속", unit: "m/s²", min: -2, max: 2, src: "acc" },
    ],
  },
  ready: {
    unit: [
      { id: "req", name: "입력값 인가 · 시동 요청", unit: "", max: 1, src: "req", model: true },
      { id: "tmo", name: "프리차지 대기 시간 설정", unit: "ms", max: 2000, src: "tmo" },
      { id: "seq", name: "시동 시퀀스 상태 (1 대기 · 2 READY · 3 실패)", unit: "", max: 3, src: "seq" },
    ],
    swint: [
      { id: "req", name: "시동 요청 SWC 출력", unit: "", max: 1, src: "req", model: true },
      { id: "seq", name: "프리차지 시퀀스 SWC 상태 (1 대기 · 2 READY · 3 실패)", unit: "", max: 3, src: "seq" },
      { id: "tmo", name: "프리차지 대기 시간 설정", unit: "ms", max: 2000, src: "tmo" },
      { id: "main", name: "주 접촉기 명령", unit: "", max: 1, src: "main" },
    ],
    embedded: [
      { id: "vbus", name: "HV 버스 전압 (프리차지 회로 모델)", unit: "V", max: 450, src: "vbus", model: true },
      { id: "seq", name: "시퀀스 상태 (1 대기 · 2 READY · 3 실패)", unit: "", max: 3, src: "seq" },
      { id: "tmo", name: "프리차지 대기 시간 설정", unit: "ms", max: 2000, src: "tmo" },
      { id: "main", name: "주 접촉기 명령", unit: "", max: 1, src: "main" },
    ],
    vehicle: [
      { id: "req", name: "시동 요청 (로거)", unit: "", max: 1, src: "req", model: true },
      { id: "vbus", name: "HV 버스 전압 (실부품 연결)", unit: "V", max: 450, src: "vbus", model: true },
      { id: "main", name: "주 접촉기 명령 (로거)", unit: "", max: 1, src: "main" },
      { id: "ready", name: "READY 상태", unit: "", max: 1, src: "ready" },
    ],
  },
  gear: {
    unit: [
      { id: "lever", name: "입력값 인가 · 변속 레버 위치 (0 P · 1 D)", unit: "", max: 1, src: "lever", model: true },
      { id: "g", name: "VCU 기어 값 (-1 R · 0 N · 1 D)", unit: "", min: -1, max: 1, src: "g", model: true },
      { id: "cmd", name: "구동 지령", unit: "Nm", min: -90, max: 90, src: "cmd", model: true },
    ],
    swint: [
      { id: "lever", name: "변속 입력 SWC 출력 (0 P · 1 D)", unit: "", max: 1, src: "lever", model: true },
      { id: "g", name: "변속 수신 SWC · 기어 값 (-1 R · 0 N · 1 D)", unit: "", min: -1, max: 1, src: "g", model: true },
      { id: "cmd", name: "토크 요청 SWC · 구동 지령", unit: "Nm", min: -90, max: 90, src: "cmd", model: true },
    ],
    embedded: [
      { id: "lever", name: "시프터 핀 입력 (0 P · 1 D)", unit: "", max: 1, src: "lever" },
      { id: "g", name: "VCU 기어 값 (-1 R · 0 N · 1 D)", unit: "", min: -1, max: 1, src: "g", model: true },
      { id: "cmd", name: "구동 지령", unit: "Nm", min: -90, max: 90, src: "cmd", model: true },
    ],
    vehicle: [
      { id: "lever", name: "변속 레버 위치 (0 P · 1 D)", unit: "", max: 1, src: "lever" },
      { id: "gw", name: "게이트웨이 출력 기어 (0 P · 1 D)", unit: "", max: 1, src: "gw" },
      { id: "gap", name: "변속 메시지 간격 (버스 부하 재현)", unit: "ms", max: 150, src: "gap" },
      { id: "g", name: "VCU 기어 값 (-1 R · 0 N · 1 D)", unit: "", min: -1, max: 1, src: "g" },
      { id: "cmd", name: "구동 지령", unit: "Nm", min: -90, max: 90, src: "cmd" },
      { id: "spd", name: "차량 속도", unit: "km/h", min: -8, max: 8, src: "spd" },
    ],
  },
};
const MODELS = { propulsion, thermal, brake, regen, ready, gear };
const TIME: Record<CaseId, [number, string]> = { propulsion: [3, "s"], thermal: [8, "분(압축)"], brake: [3, "s"], regen: [5.5, "s"], ready: [1.6, "s"], gear: [0.35, "s"] };

/** Reference = healthy design, run = field fault (or the fixed design). Same input for both. */
export function simulate(caseId: CaseId, tech: Tech, fixed: boolean, execution?: VerificationExecution): SimResult {
  const ref = MODELS[caseId](tech, false, execution);
  const run = MODELS[caseId](tech, !fixed, execution);
  const levels = {} as Record<Lv, Series[]>;
  (Object.keys(VIEW[caseId]) as Lv[]).forEach(lv => {
    levels[lv] = VIEW[caseId][lv].map(d => ({ id: d.id, name: d.name, unit: d.unit, min: d.min, max: d.max, ref: ref[d.src], run: d.model ? ref[d.src] : run[d.src] }));
  });
  return { seconds: execution?.durationSeconds ?? TIME[caseId][0], timeUnit: TIME[caseId][1], levels };
}

export type ContractRunVerdict = "PASS" | "FAIL" | "INCONCLUSIVE";
export type ContractRunAssessment = {
  verdict: ContractRunVerdict;
  requiredSignalIds: string[];
  missingSignalIds: string[];
  outOfRangeSignalIds: string[];
  expectedOutputFailures: string[];
};

/** Evaluates only signals declared by the STEP03 contract. Hypothesis judgment remains separate. */
export function assessContractRun(contract: VerificationContract, level: VerificationLevel, list: Series[]): ContractRunAssessment {
  const requiredSignalIds = contract.execution.observationSignalIds[level] ?? [];
  const byId = new Map(list.map(signal => [signal.id, signal]));
  const missingSignalIds = requiredSignalIds.filter(id => !byId.has(id));
  const threshold = contract.execution.comparisonTolerancePercent / 100;
  const outOfRangeSignalIds = requiredSignalIds.filter(id => {
    const signal = byId.get(id);
    return signal ? signal.run.some((value, index) => Math.abs(value - signal.ref[index]) > span(signal) * threshold) : false;
  });
  const expectedOutputFailures: string[] = [];
  for (const expected of contract.execution.expectedOutputs) {
    const signal = byId.get(expected.signalId);
    if (!signal) continue;
    const actual = signal.run[signal.run.length - 1];
    if (Math.abs(actual - expected.value) > expected.tolerance) expectedOutputFailures.push(expected.signalId);
  }
  const hasExpectedOutput = contract.execution.expectedOutputs.some(expected => byId.has(expected.signalId));
  const verdict: ContractRunVerdict = missingSignalIds.length || !hasExpectedOutput
    ? "INCONCLUSIVE"
    : outOfRangeSignalIds.length || expectedOutputFailures.length
      ? "FAIL"
      : "PASS";
  return { verdict, requiredSignalIds, missingSignalIds, outOfRangeSignalIds, expectedOutputFailures };
}

/** First sample where the run leaves the reference by more than 2 % of full scale (null = never). */
export function divergeIndex(s: Series) {
  for (let i = 0; i < s.ref.length; i++) if (Math.abs(s.ref[i] - s.run[i]) > span(s) * .02) return i;
  return null;
}
/** The signal that diverges first on this level (ties → the one earlier in the signal flow). */
export function firstMismatch(list: Series[]) {
  let best: number | null = null, at = Infinity;
  list.forEach((s, i) => { const d = divergeIndex(s); if (d !== null && d < at) { at = d; best = i; } });
  return best;
}
