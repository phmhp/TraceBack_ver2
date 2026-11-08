// Memo board v6 — "쓰러진 도미노 거꾸로 따라가기" with time clues.
// One question per screen: "Why did <this value> differ from the reference?"
//  1) Flip (measure) the 3 polaroid candidates: reference vs this drive + WHEN it started to differ.
//  2) Two candidates can be abnormal: the real cause went wrong EARLIER than the current domino,
//     the trap went wrong LATER (it is an effect of the current domino, not its cause).
//     → the player reasons from the timeline, not from prior domain knowledge.
//  3) When every candidate in front is normal, the current domino is the first domino.
//  4) Cascade replay → zoom inside the first domino (SW block or HW part) →
//     every fallen domino (chain + traps found = side effects) becomes the bench's regression list.
// "🗺 전체 지도" shows the E/E path (센서 → 제어기 → CAN → 부품 → 차량) as subsystems,
// with the trace falling backward from the output.
import React, { useEffect, useState } from "react";
import type { Campaign, CaseId } from "../../game/runtime";
import { SCENARIOS } from "../../game/scenarios";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";
import { play } from "../../ui/sfx";
import { PursuitRouteBar, ReplayRaceView } from "../../experiences";
import { ENGINEER } from "../../game/cast";

type Send = React.Dispatch<any>;
type Status = "ok" | "tol" | "bad";
type Zone = "센서" | "제어기" | "CAN" | "부품" | "차량";
type Dom = {
  id: string; label: string; img: string; zone: Zone;
  ref: number | string; run: number | string; unit: string; status: Status;
  t?: number; causes?: string[]; ev?: string;
};
type Zoom = { where: string; kind: "sw" | "hw"; reference: [string, string][]; run: [string, string][]; part?: [string, string, string]; culprit: string; lesson: string };
// the board ends on a SUSPECT SECTION (inputs normal, output wrong), not on the exact part:
// the exact cause is confirmed later on the bench by simulation.
type Section = { name: string; choices: { label: string; ok: boolean; why: string }[] };
type CaseData = { start: string; first: string; timeUnit: string; req: string; doms: Dom[]; zoom: Zoom; section: Section };

const ZONES: Zone[] = ["센서", "제어기", "CAN", "부품", "차량"];
const ZONE_ICON: Record<Zone, string> = { 센서: "🦶", 제어기: "🧠", CAN: "📡", 부품: "⚙️", 차량: "🚗" };

// generated images: evidence photos, part cut-outs, the 3×3 evidence atlas and the car
const B = (name: string) => `/assets/board-photos/${name}.png`;
const E = (name: string) => `/assets/ending-thumbs/${name}.png`;
const ATLAS = (cell: number) => `atlas:${cell}`;
const CAR = "/assets/traceback-red-ev-v2.png";
const SENSOR = "/assets/ASSET_090_Input_Sensor_Node.png";
const ECU = "/assets/ASSET_091_ECU_Controller_Node.png";
const RADIATOR = "/assets/ASSET_030_Radiator_Cooling_Fan_TRANSPARENT.png";

const OK = (id: string, label: string, img: string, zone: Zone, ref: number | string, unit: string, status: Status = "ok", run?: number | string): Dom => ({ id, label, img, zone, ref, run: run ?? ref, unit, status });

const CASES: Record<CaseId, CaseData> = {
  propulsion: {
    start: "accel", first: "vcu_in", timeUnit: "ms",
    req: "요구사항: 가속 페달을 60% 밟으면 모터가 204 Nm를 내야 한다.",
    doms: [
      { id: "accel", label: "차량 가속", img: CAR, zone: "차량", ref: 2.8, run: 1.2, unit: "m/s²", status: "bad", t: 60, causes: ["motor_tq", "cluster", "regen"], ev: "pedal_raw" },
      { id: "motor_tq", label: "모터 힘", img: B("motor_actual"), zone: "부품", ref: 204, run: 91, unit: "Nm", status: "bad", t: 30, causes: ["batt_i", "can_cmd", "motor_temp"], ev: "motor_actual" },
      { id: "can_cmd", label: "CAN 토크 명령", img: B("torque_cmd"), zone: "CAN", ref: 204, run: 92, unit: "Nm", status: "bad", t: 20, causes: ["inv_i", "gateway", "vcu_in"], ev: "torque_cmd" },
      { id: "vcu_in", label: "VCU 페달 처리값", img: B("pedal_processed"), zone: "제어기", ref: 60, run: 27, unit: "%", status: "bad", t: 10, causes: ["aps", "brake_sw", "gear", "bms_lim", "temp_lim"], ev: "pedal_processed" },
      // traps: abnormal, but they changed LATER than the domino they are offered for
      { id: "cluster", label: "계기판 출력 게이지", img: ECU, zone: "차량", ref: 60, run: 27, unit: "%", status: "bad", t: 70 },
      { id: "batt_i", label: "배터리 방전 전류", img: E("bms"), zone: "부품", ref: 180, run: 85, unit: "A", status: "bad", t: 40 },
      { id: "inv_i", label: "인버터 전류", img: E("mcu"), zone: "부품", ref: 310, run: 140, unit: "A", status: "bad", t: 25 },
      OK("aps", "가속 페달 센서", B("pedal_raw"), "센서", 60, "%"),
      OK("brake_sw", "브레이크 스위치", E("brake_pedal"), "센서", "꺼짐", ""),
      OK("gear", "기어 위치", SENSOR, "센서", "D", ""),
      OK("bms_lim", "BMS 허용 출력", E("bms"), "제어기", 160, "kW"),
      OK("temp_lim", "온도 보호 제한", B("thermal_protection"), "제어기", "없음", ""),
      OK("regen", "회생 제동", B("regen_request"), "제어기", 0, "%"),
      OK("motor_temp", "모터 온도", B("motor_temp"), "부품", 62, "°C"),
      OK("gateway", "게이트웨이 전달", ATLAS(1), "CAN", 100, "%"),
    ],
    section: { name: "VCU 안 페달 처리·토크 계산 (SW)", choices: [
      { label: "가속 페달 센서·배선", ok: false, why: "페달 센서 값은 60%로 기준과 같아요. 센서 쪽이 원인이면 들어오는 값부터 달랐어야 해요." },
      { label: "VCU 안 페달 처리·토크 계산 (SW)", ok: true, why: "들어오는 값은 모두 정상인데 VCU가 내놓은 값만 달라요. 원인은 VCU 안쪽 계산 구간이에요." },
      { label: "인버터·구동 모터", ok: false, why: "인버터·모터는 VCU 다음이에요. VCU 출력부터 이미 달랐으니 이쪽은 결과예요." },
    ] },
    zoom: {
      where: "VCU", kind: "sw",
      reference: [["페달 신호 읽기", "60%"], ["토크 지도", "204 Nm"], ["CAN 토크 명령", "204 Nm"]],
      run: [["페달 신호 읽기", "60%"], ["보정 계수 ×0.45", "27%"], ["토크 지도", "92 Nm"], ["CAN 토크 명령", "92 Nm"]],
      culprit: "보정 계수 ×0.45",
      lesson: "기준 설계에 없는 '보정 계수 ×0.45' 블록이 들어가 있었어요. 페달 값을 0.45배로 줄이는 잘못된 보정값이에요.",
    },
  },
  thermal: {
    start: "accel", first: "fan_rpm", timeUnit: "초",
    req: "요구사항: 냉각수가 65°C를 넘으면 냉각 팬을 100%로 돌려야 한다.",
    doms: [
      { id: "accel", label: "차량 가속", img: CAR, zone: "차량", ref: 2.8, run: 1.9, unit: "m/s²", status: "bad", t: 72, causes: ["derate", "regen", "warn_lamp"] },
      { id: "derate", label: "출력 허용", img: B("thermal_protection"), zone: "제어기", ref: 100, run: 62, unit: "%", status: "bad", t: 70, causes: ["batt_out", "motor_temp", "bms_req"], ev: "thermal_protection" },
      { id: "motor_temp", label: "모터 온도", img: B("motor_temp"), zone: "부품", ref: 70, run: 96, unit: "°C", status: "bad", t: 55, causes: ["coolant", "inv_temp", "pump"] },
      { id: "coolant", label: "냉각수 온도", img: E("motor_temp_sensor"), zone: "센서", ref: 65, run: 78, unit: "°C", status: "bad", t: 40, causes: ["batt_temp", "coolant_lv", "fan_rpm"], ev: "motor_temp" },
      { id: "fan_rpm", label: "냉각 팬 회전", img: E("cooling_fan"), zone: "부품", ref: 1850, run: 0, unit: "rpm", status: "bad", t: 0, causes: ["fan_cmd", "air_temp", "pump"], ev: "fan_actual" },
      { id: "warn_lamp", label: "파워다운 표시등", img: ECU, zone: "차량", ref: "꺼짐", run: "켜짐", unit: "", status: "bad", t: 75 },
      { id: "batt_out", label: "배터리 출력", img: E("bms"), zone: "부품", ref: 160, run: 100, unit: "kW", status: "bad", t: 71 },
      { id: "inv_temp", label: "인버터 온도", img: E("mcu"), zone: "부품", ref: 60, run: 84, unit: "°C", status: "bad", t: 60 },
      { id: "batt_temp", label: "배터리 온도", img: E("bms"), zone: "센서", ref: 30, run: 41, unit: "°C", status: "bad", t: 50 },
      { ...OK("fan_cmd", "팬 명령 (Thermal ECU)", E("thermal_ecu"), "제어기", 100, "%"), ev: "fan_command" },
      OK("fan_pwm", "팬 커넥터 PWM 신호", ATLAS(5), "부품", 100, "%"),
      OK("fan_power", "팬 커넥터 전압", ATLAS(5), "부품", 12, "V"),
      OK("fan_block", "팬 걸림 (이물질)", RADIATOR, "부품", "없음", ""),
      OK("pump", "냉각수 펌프 유량", RADIATOR, "부품", 12, "L/min"),
      OK("bms_req", "BMS 출력 제한 요청", E("bms"), "제어기", "없음", ""),
      OK("coolant_lv", "냉각수 양", RADIATOR, "부품", 100, "%"),
      OK("air_temp", "바깥 기온", SENSOR, "센서", 25, "°C", "tol", 26),
      OK("regen", "회생 제동", B("regen_request"), "제어기", 0, "%"),
    ],
    section: { name: "팬 명령 이후 구동 경로 (ECU 출력단·배선·전원·팬 모터)", choices: [
      { label: "Thermal ECU 안 팬 제어 로직 (SW)", ok: false, why: "팬 명령은 기준대로 100%였어요. 제어 로직이 원인이면 명령부터 달랐어야 해요." },
      { label: "팬 명령 이후 구동 경로 (ECU 출력단·배선·전원·팬 모터)", ok: true, why: "명령은 100%로 정상인데 팬은 0 rpm이에요. 원인은 명령이 나간 뒤의 구동 경로 안쪽이에요." },
      { label: "출력 제한(보호) 로직", ok: false, why: "출력 제한은 온도가 오른 뒤에 달라졌어요. 시간상 결과 쪽이에요." },
    ] },
    zoom: {
      where: "냉각 팬", kind: "hw",
      reference: [["온도 읽기", "78°C"], ["65°C 넘으면 켜기", "켜짐"], ["팬 명령", "100%"]],
      run: [["온도 읽기", "78°C"], ["65°C 넘으면 켜기", "켜짐"], ["팬 명령", "100%"]],
      part: ["냉각 팬 모터", "1850 rpm", "0 rpm"],
      culprit: "냉각 팬 모터",
      lesson: "SW는 기준대로 100% 명령을 냈어요. 명령을 받은 팬(부품)이 돌지 않았으니 원인은 HW예요.",
    },
  },
  brake: {
    start: "stop", first: "caliper", timeUnit: "초",
    req: "요구사항: 브레이크를 55% 밟으면 3.2 m/s²로 감속해야 한다.",
    doms: [
      { id: "stop", label: "정지 거리", img: CAR, zone: "차량", ref: 32, run: 58, unit: "m", status: "bad", t: 3, causes: ["decel", "road", "rear_warn"] },
      { id: "decel", label: "차량 감속", img: B("brake_request"), zone: "차량", ref: 3.2, run: 1.4, unit: "m/s²", status: "bad", t: 0.2, causes: ["pitch", "caliper", "regen"] },
      { id: "caliper", label: "캘리퍼 압력", img: B("brake_actual"), zone: "부품", ref: 42, run: 8, unit: "bar", status: "bad", t: 0.1, causes: ["p_cmd", "pad_temp", "bpp"], ev: "brake_actual" },
      { id: "rear_warn", label: "후방 추돌 경고", img: ECU, zone: "차량", ref: "꺼짐", run: "켜짐", unit: "", status: "bad", t: 3.2 },
      { id: "pitch", label: "차체 앞 쏠림", img: CAR, zone: "차량", ref: 3, run: 1.2, unit: "°", status: "bad", t: 0.4 },
      { id: "pad_temp", label: "브레이크 패드 온도", img: ATLAS(7), zone: "부품", ref: 180, run: 60, unit: "°C", status: "bad", t: 0.5 },
      OK("p_cmd", "압력 명령 (Brake ECU)", E("brake_ecu"), "제어기", 42, "bar"),
      OK("bpp", "브레이크 페달", E("brake_pedal"), "센서", 55, "%"),
      { ...OK("regen", "회생 제동", B("regen_request"), "제어기", 22, "%"), ev: "regen_request" },
      OK("road", "노면 마찰", CAR, "차량", 0.8, "μ"),
      OK("fluid", "브레이크액 양", ATLAS(8), "부품", 100, "%"),
    ],
    section: { name: "압력 명령 이후 유압 경로 (유압 모듈·라인·캘리퍼)", choices: [
      { label: "Brake ECU 안 회생·마찰 배분 로직 (SW)", ok: false, why: "압력 명령은 기준대로 42 bar였어요. 배분 로직이 원인이면 명령부터 달랐어야 해요." },
      { label: "브레이크 페달 센서", ok: false, why: "페달 값 55%는 기준과 같아요. 들어오는 값은 정상이에요." },
      { label: "압력 명령 이후 유압 경로 (유압 모듈·라인·캘리퍼)", ok: true, why: "명령은 42 bar인데 실제 압력은 8 bar예요. 원인은 명령 이후 유압 경로 안쪽이에요." },
    ] },
    zoom: {
      where: "캘리퍼", kind: "hw",
      reference: [["제동 요청", "3.2 m/s²"], ["회생·마찰 나누기", "나눔"], ["압력 명령", "42 bar"]],
      run: [["제동 요청", "3.2 m/s²"], ["회생·마찰 나누기", "나눔"], ["압력 명령", "42 bar"]],
      part: ["캘리퍼·유압", "42 bar", "8 bar"],
      culprit: "캘리퍼·유압",
      lesson: "제동 SW는 기준대로 42 bar를 명령했어요. 실제 압력이 8 bar뿐이니 유압·캘리퍼(HW) 문제예요.",
    },
  },
};

const fmt = (value: number | string) => typeof value === "string" ? value : Number.isInteger(value) ? String(value) : value.toFixed(1);
/** Korean particle: picks 이/가, 은/는 … from the last Hangul syllable. */
const josa = (word: string, withBatchim: string, without: string) => {
  const hangul = word.replace(/\([^)]*\)/g, "").replace(/[^가-힣]/g, "");
  const code = hangul.charCodeAt(hangul.length - 1) - 0xac00;
  return code >= 0 && code % 28 ? withBatchim : without;
};
const refText = (d: Dom) => `${fmt(d.ref)}${d.unit ? ` ${d.unit}` : ""}`;

function Photo({ src }: { src: string }) {
  if (src.startsWith("atlas:")) { const cell = Number(src.slice(6)); return <i className="dtPhoto atlas" style={{ backgroundPosition: `${(cell % 3) * 50}% ${Math.floor(cell / 3) * 50}%` }} />; }
  return <i className="dtPhoto"><img src={src} alt="" draggable={false} /></i>;
}

/** Reference vs this drive: dashed outline = reference, filled = this drive. */
function Gauge({ dom }: { dom: Dom }) {
  if (typeof dom.ref === "string" || typeof dom.run === "string") return <div className={`dtGauge g-${dom.status}`}><span className="dtGaugeTxt">기준 {fmt(dom.ref)} · 지금 <b>{fmt(dom.run)}</b></span></div>;
  const max = Math.max(dom.ref, dom.run, 0.001) * 1.15;
  return <div className={`dtGauge g-${dom.status}`}>
    <div className="dtTrack"><i className="ref" style={{ width: `${Math.max(3, dom.ref / max * 100)}%` }} /><i className="run" style={{ width: `${Math.max(3, dom.run / max * 100)}%` }} /></div>
    <span className="dtGaugeTxt">기준 {fmt(dom.ref)} · 지금 <b>{fmt(dom.run)}</b> {dom.unit}</span>
  </div>;
}

type TileState = "hidden" | "clue" | "normal" | "tol" | "first" | "trap";
function Polaroid({ dom, state, unit, small, onClick, fell, children }: { dom: Dom; state: TileState; unit: string; small?: boolean; onClick?: () => void; fell?: boolean; children?: React.ReactNode }) {
  const mark = state === "clue" ? "🔎 단서" : state === "first" ? "🎯 시작점" : state === "trap" ? "↪ 결과였어" : state === "tol" ? "≈ 허용 범위" : "✓ 정상";
  return <div className={`dtPol t-${state} ${small ? "small" : ""} ${onClick ? "click" : ""} ${fell ? "fell" : ""}`} onClick={onClick}>
    <div className="dtPolPic"><Photo src={dom.img} />{state === "hidden" && <span className="dtQ">?</span>}{state !== "hidden" && dom.t !== undefined && dom.status === "bad" && <em className="dtTime">⏱ {fmt(dom.t)}{unit}</em>}</div>
    <b>{dom.label}</b>
    {state === "hidden" ? <em className="dtCheck">🔍 측정하기</em> : <><Gauge dom={dom} />{!small && <i className="dtMark">{mark}</i>}</>}
    {children}
  </div>;
}

export function DominoTrace({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const scenario = SCENARIOS[caseId];
  const data = CASES[caseId];
  const unit = data.timeUnit;
  const dom = (id: string) => data.doms.find(item => item.id === id)!;
  const causesOf = (id: string) => dom(id).causes ?? [];

  const [chain, setChain] = useState<string[]>([data.start]); // symptom → … (backward)
  const [checked, setChecked] = useState<string[]>([]);
  const [traps, setTraps] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<"trace" | "cascade" | "zoom" | "done">("trace");
  const [fallIdx, setFallIdx] = useState(-1);
  const [zoomPick, setZoomPick] = useState<string | null>(null); // picked section label
  const [bubble, setBubble] = useState(`${dom(data.start).label}${josa(dom(data.start).label, "이", "가")} 기준과 달라요. 후보를 측정해 원인 쪽으로 거슬러 올라가세요. ⏱ 언제 달라졌는지가 핵심이에요.`);
  const [shake, setShake] = useState("");
  const [help, setHelp] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [replay, setReplay] = useState(false);
  // red string dragged from a polaroid's pushpin onto the domino being investigated
  const [thread, setThread] = useState<{ id: string; x0: number; y0: number; x: number; y: number; hot: boolean } | null>(null);
  const [justOpened, setJustOpened] = useState("");
  const current = chain[chain.length - 1];
  const cur = dom(current);
  const candidates = causesOf(current);
  const opened = candidates.filter(id => checked.includes(id));
  const allOpen = opened.length === candidates.length;
  const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
  const route: string[] = []; for (let id: string | undefined = data.start; id; id = causesOf(id).find(c => dom(c).status === "bad" && (dom(c).t ?? 0) < (dom(id!).t ?? 0))) route.push(id);

  const reset = () => { setChain([data.start]); setChecked([]); setTraps([]); setMistakes(0); setPhase("trace"); setFallIdx(-1); setZoomPick(null); setBubble("초기화했어요. 증상 쪽에서 거꾸로 따라가세요."); play("squish"); };
  const nope = (id: string, text: string) => { setBubble(text); setShake(id); play("error"); window.setTimeout(() => setShake(""), 420); };

  const measure = (id: string) => {
    if (checked.includes(id)) return;
    setChecked(previous => [...previous, id]);
    setJustOpened(id); window.setTimeout(() => setJustOpened(""), 500);
    const d = dom(id);
    play("zip");
    window.setTimeout(() => play(d.status === "bad" ? "stamp" : "pop"), 160);
    setBubble(d.status === "bad" ? `${d.label}도 기준과 달라요. ⏱ ${fmt(d.t!)}${unit}에 달라지기 시작했어요. ${cur.label}(⏱ ${fmt(cur.t!)}${unit})보다 먼저인가요, 나중인가요?`
      : d.status === "tol" ? `${d.label}${josa(d.label, "은", "는")} 조금 다르지만 허용 범위예요. 원인이 아니에요.`
        : `${d.label}${josa(d.label, "은", "는")} 기준과 같아요. 원인이 아니에요.`);
  };
  const accuse = (id: string) => {
    const d = dom(id);
    if ((d.t ?? 0) > (cur.t ?? 0)) {
      // trap: it changed AFTER the current domino → it is an effect, not the cause
      setTraps(previous => previous.includes(id) ? previous : [...previous, id]);
      setMistakes(value => value + 1);
      nope(id, `${d.label}${josa(d.label, "은", "는")} ⏱ ${fmt(d.t!)}${unit}에 달라졌어요. ${cur.label}(⏱ ${fmt(cur.t!)}${unit})보다 늦어요. 원인은 결과보다 먼저 일어나야 해요. 이건 ${cur.label} 때문에 생긴 영향이에요.`);
      return;
    }
    play("squish");
    setChain(previous => [...previous, id]);
    setBubble(`${d.label}${josa(d.label, "이", "가")} 더 먼저 달라졌어요. 이제 ${d.label}${josa(d.label, "이", "가")} 왜 달라졌는지 찾으세요.`);
  };
  const startCascade = (nextChain: string[]) => {
    setPhase("cascade");
    setBubble("처음 어긋난 지점이에요. 그 앞 입력이 모두 정상인지 정리할게요.");
    setFallIdx(-1);
    nextChain.forEach((_, index) => window.setTimeout(() => { setFallIdx(index); play("pop", 1 + index * .15); }, 500 + index * 420));
    window.setTimeout(() => { setPhase("zoom"); setBubble(`들어오는 값은 정상, ${dom(data.first).label}만 달라요. 어느 구간을 정밀 검증할지 고르세요.`); play("success"); }, 1000 + nextChain.length * 420);
  };
  const callFirst = () => {
    if (current !== data.first) { nope(current, "아직 더 앞쪽에 달라진 값이 있어요."); return; }
    play("stamp");
    startCascade(chain);
  };
  const okSection = data.section.choices.find(c => c.ok)!;
  const pickSection = (label: string) => {
    const choice = data.section.choices.find(c => c.label === label)!;
    setZoomPick(label); setBubble(choice.why);
    if (choice.ok) { play("stamp"); window.setTimeout(() => play("success"), 120); window.setTimeout(() => setPhase("done"), 700); }
    else { setMistakes(value => value + 1); play("error"); }
  };
  const revealAnswer = () => { setChain(route); setChecked(route.flatMap(id => causesOf(id))); setZoomPick(okSection.label); setPhase("done"); setFallIdx(route.length); setBubble(okSection.why); };
  // impact = everything that fell because of the first domino (chain effects + side effects found as traps)
  const effects = [...chain.filter(id => id !== data.first), ...traps].map(dom);
  const finish = () => {
    try { sessionStorage.setItem(`tb-impact-${caseId}`, JSON.stringify(effects.map(d => `${d.label} 정상 복귀 (기준 ${refText(d)})`))); } catch { /* ignore */ }
    const evidence = data.doms.filter(d => d.ev && (chain.includes(d.id) || checked.includes(d.id))).map(d => d.ev!);
    evidence.filter(id => !state.evidence[caseId].includes(id)).forEach(id => send({ type: "RECORD_EVIDENCE", id }));
    if (state.hypothesis[caseId] !== scenario.root) send({ type: "SELECT_HYPOTHESIS", id: scenario.root });
    try { sessionStorage.setItem(`tb-section-${caseId}`, data.section.name); } catch { /* ignore */ }
    send({ type: "OPEN_WIRING" });
  };
  const startThread = (id: string, event: React.PointerEvent) => {
    event.preventDefault(); event.stopPropagation();
    const pin = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setThread({ id, x0: pin.left + pin.width / 2, y0: pin.top + pin.height / 2, x: event.clientX, y: event.clientY, hot: false });
    play("pop", 1.3);
  };
  useEffect(() => {
    if (!thread) return;
    const overTarget = (x: number, y: number) => Boolean(document.elementFromPoint(x, y)?.closest(".dtChainItem.current"));
    const move = (event: PointerEvent) => setThread(previous => previous && { ...previous, x: event.clientX, y: event.clientY, hot: overTarget(event.clientX, event.clientY) });
    const up = (event: PointerEvent) => {
      const id = thread.id;
      setThread(null);
      if (overTarget(event.clientX, event.clientY)) { play("zip", .8); accuse(id); }
      else play("pop", .7);
    };
    addEventListener("pointermove", move); addEventListener("pointerup", up);
    return () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
  }, [thread?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setMapOpen(false); setHelp(false); } };
    addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey);
  }, []);

  const ordered = [...chain].reverse(); // cause → effect (left → right)
  const step = phase === "trace" ? 0 : phase === "done" ? 2 : 1;
  const traced = phase !== "trace";
  const earlierBad = opened.some(id => dom(id).status === "bad" && (dom(id).t ?? 0) < (cur.t ?? 0));
  // timeline markers for this step: the current domino + measured abnormal candidates
  const marks = [cur, ...opened.map(dom).filter(d => d.status === "bad")];
  const tMax = Math.max(...data.doms.filter(d => d.t !== undefined).map(d => d.t!)) || 1;

  return <div className="dtBoard">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="ROOT CAUSE TRACE" title="원인 역추적 · 의심 구간 좁히기" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <main className="dtLayout">
      <header className="dtHead">
        <button className="dtMapBtn" onClick={() => { setMapOpen(true); play("pop"); }}>
          <span className="dtMini">{ZONES.map(zone => <i key={zone} className={zone === cur.zone && !traced ? "now" : chain.some(id => dom(id).zone === zone) ? "seen" : ""} />)}</span>
          🗺 전체 지도
        </button>
        <div className="dtSteps">{["거꾸로 따라가기", "의심 구간 정하기", "영향 범위"].map((label, index) => <span key={label} className={index < step ? "done" : index === step ? "now" : ""}><i>{index < step ? "✓" : index + 1}</i>{label}</span>)}</div>
        <div className="dtButtons">
          <span className="dtHearts" title="실수">{"♥".repeat(3 - Math.min(2, mistakes))}{"♡".repeat(Math.min(2, mistakes))}</span>
          <button onClick={() => setHelp(true)}>방법</button>
          <button onClick={() => setReplay(true)}>▶ 리플레이</button>
          <button onClick={reset}>↺</button>
        </div>
      </header>

      <section className="dtChain">
        <span className="dtChainHint">원인 쪽</span>
        {!traced && <><div className="dtGhost">?</div><i className="dtArrow" /></>}
        {ordered.map((id, index) => <React.Fragment key={id}>
          {index > 0 && <i className={`dtArrow ${traced && index <= fallIdx ? "lit" : ""}`} />}
          <div className={`dtChainItem ${id === current && !traced ? "current" : ""} ${thread && id === current ? thread.hot ? "dropHot" : "dropReady" : ""} ${shake === id ? "shake" : ""}`}>
            {id === data.start && <em className="dtBadge">증상</em>}
            <Polaroid dom={dom(id)} unit={unit} state={traced && id === data.first ? "first" : "clue"} small fell={phase === "cascade" && index <= fallIdx} />
          </div>
        </React.Fragment>)}
        <span className="dtChainHint">결과 쪽</span>
      </section>

      {phase === "trace" && <section className="dtQuestion">
        <h2><b>{cur.label}</b>{josa(cur.label, "이", "가")} 기준과 달라진 원인은?</h2>
        <div className="dtTimeline">
          <span className="dtTlEdge">⏱ 먼저 달라짐</span>
          <div className="dtTlAxis">
            {marks.map(d => <i key={d.id} className={`dtTlMark ${d.id === current ? "cur" : (d.t ?? 0) < (cur.t ?? 0) ? "early" : "late"}`} style={{ left: `${4 + (d.t ?? 0) / tMax * 92}%` }}><em>{d.label} · {fmt(d.t!)}{unit}</em></i>)}
          </div>
          <span className="dtTlEdge">나중에 달라짐 ⏱</span>
        </div>
        <div className={`dtCands ${candidates.length > 3 ? "many" : ""}`}>{candidates.map(id => {
          const d = dom(id); const open = checked.includes(id);
          const tileState: TileState = !open ? "hidden" : traps.includes(id) ? "trap" : d.status === "bad" ? "clue" : d.status === "tol" ? "tol" : "normal";
          return <div key={id} className={`dtCand ${shake === id ? "shake" : ""} ${justOpened === id ? "flipIn" : ""}`}>
            <Polaroid dom={d} unit={unit} state={tileState} onClick={open ? undefined : () => measure(id)}>
              {open && d.status === "bad" && !traps.includes(id) && <span className="dtPinWrap"><button className={`dtPin ${thread?.id === id ? "pulling" : ""}`} onPointerDown={event => startThread(id, event)} title="압정을 끌어 위의 도미노에 연결" /><em>📌 끌어서 위 도미노에 연결</em></span>}
            </Polaroid>
          </div>;
        })}</div>
        <div className="dtCall">
          {allOpen && !earlierBad
            ? <button className="dtFirst" onClick={callFirst}>들어오는 입력이 모두 정상 → 🎯 {cur.label}{josa(cur.label, "이", "가")} 시작점!</button>
            : <span className="dtTip">사진을 눌러 측정 · 수상하면 📌 압정을 끌어 실로 연결 · 원인은 결과보다 <b>먼저</b> 달라져요</span>}
        </div>
      </section>}

      {(phase === "zoom" || phase === "done") && <section className="dtZoom">
        <h2>🔍 처음 어긋난 곳: 어느 구간을 정밀 검증할까요?</h2>
        <div className="dtBoundary">
          <div className="dtBIn"><small>들어오는 값 · 모두 정상</small>{causesOf(data.first).map(dom).map(d => <span key={d.id}>✓ {d.label} <em>{refText(d)}</em></span>)}</div>
          <i>→</i>
          <div className={`dtBBox ${phase === "done" ? "solved" : ""}`}><small>의심 구간</small><b>{phase === "done" ? data.section.name : "?"}</b></div>
          <i>→</i>
          <div className="dtBOut"><small>나가는 값 · 기준과 다름</small><span>✗ {dom(data.first).label}</span><em>기준 {refText(dom(data.first))} · 이번 {fmt(dom(data.first).run)}{dom(data.first).unit ? ` ${dom(data.first).unit}` : ""}</em></div>
        </div>
        {phase === "zoom" && <div className="dtSecChoices">{data.section.choices.map(c => <button key={c.label} className={zoomPick === c.label ? c.ok ? "right" : "wrong" : ""} onClick={() => pickSection(c.label)}>{c.label}</button>)}</div>}
        {phase === "done" && <div className="dtImpact">
          <DominoFall chain={ordered} traps={traps} parentOf={id => chain.find(c => causesOf(c).includes(id)) ?? data.start} labelOf={id => dom(id).label} />
          <b>📋 함께 쓰러진 곳 = 고친 뒤 다시 확인할 곳 (영향도 분석 → 회귀 시험 목록)</b>
          <div>{effects.map(d => <span key={d.id}>{d.label}</span>)}</div>
          <b className="dtStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</b>
          <button className="dtNext" onClick={finish}>이 구간의 정상 동작 복원하기 →</button>
        </div>}
      </section>}

      <div className="dtBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{bubble}</p></div>
    </main>

    {thread && <svg className="dtThread"><path d={`M${thread.x0} ${thread.y0} Q${(thread.x0 + thread.x) / 2} ${Math.max(thread.y0, thread.y) + 40} ${thread.x} ${thread.y}`} className={thread.hot ? "hot" : ""} /><circle cx={thread.x0} cy={thread.y0} r="7" /><circle cx={thread.x} cy={thread.y} r="5" className="tip" /></svg>}
    {mapOpen && <TraceMap data={data} chain={chain} checked={checked} traps={traps} first={traced ? data.first : null} onClose={() => setMapOpen(false)} />}

    {help && <div className="dtModal" onClick={() => setHelp(false)}><article onClick={event => event.stopPropagation()}>
      <h2>🕵️ 원인 역추적 방법</h2>
      <div className="dtHow">
        <div><span className="pic">📸</span><b>1. 사진 측정</b><small>기준과 같은지, 언제 달라졌는지</small></div>
        <div><span className="pic">⏱</span><b>2. 먼저 달라진 쪽이 원인</b><small>나중에 달라진 건 결과(함정)</small></div>
        <div><span className="pic">🎯</span><b>3. 의심 구간 정하기</b><small>입력이 모두 정상인데 출력만 다르면 그 안쪽</small></div>
      </div>
      <p className="dtHowNote">막대: <i className="dash" /> 기준 · <i className="fill" /> 이번 주행 · 틀리면 ♥이 줄어요</p>
      <button onClick={() => setHelp(false)}>시작</button>
    </article></div>}
    {replay && <div className="replayModal" onClick={() => setReplay(false)}><div onClick={event => event.stopPropagation()}><button onClick={() => setReplay(false)}>×</button><small>QUICK REPLAY</small><h2>고장 직전 주행 다시 보기</h2><ReplayRaceView caseId={caseId} /></div></div>}
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}

/** Whole E/E path as Simulink-like subsystems; the trace falls backward from the output. */
/** Dominoes fall cause → effect; side effects (traps found) fall off as branches = impact analysis. */
function DominoFall({ chain, traps, parentOf, labelOf }: { chain: string[]; traps: string[]; parentOf: (id: string) => string; labelOf: (id: string) => string }) {
  const [run, setRun] = useState(0);
  useEffect(() => { const timer = window.setTimeout(() => { setRun(1); chain.forEach((_, i) => window.setTimeout(() => play("pop", .8 + i * .12), i * 380)); }, 150); return () => clearTimeout(timer); }, [chain.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className={`dtFall ${run ? "go" : ""}`} onClick={() => { setRun(0); window.setTimeout(() => setRun(1), 60); }} title="눌러서 다시 쓰러뜨리기">
    {chain.map((id, i) => { const side = traps.filter(t => parentOf(t) === id); return <div key={id} className="dtFallCol">
      <span className={`dtDomino ${i === 0 ? "cause" : ""}`} style={{ animationDelay: `${i * .38}s` }}><b>{labelOf(id)}</b></span>
      {side.map((t, k) => <span key={t} className="dtDomino side" style={{ animationDelay: `${i * .38 + .25 + k * .2}s` }}><b>{labelOf(t)}</b></span>)}
    </div>; })}
  </div>;
}

function TraceMap({ data, chain, checked, traps, first, onClose }: { data: CaseData; chain: string[]; checked: string[]; traps: string[]; first: string | null; onClose: () => void }) {
  const dom = (id: string) => data.doms.find(item => item.id === id)!;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timers = chain.map((_, index) => window.setTimeout(() => { setShown(index + 1); play("pop", 1.3 - index * .1); }, 350 + index * 450));
    return () => timers.forEach(clearTimeout);
  }, [chain.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const order = (id: string) => chain.indexOf(id);
  const reached = new Set(chain.slice(0, shown).map(id => dom(id).zone));
  return <div className="dtModal" onClick={onClose}><article className="dtMap" onClick={event => event.stopPropagation()}>
    <header><h2>🗺 전체 지도 · 신호는 → 로 흐르고, 추리는 ← 로 거슬러 가요</h2><button onClick={onClose}>닫기</button></header>
    <div className="dtSubs">
      {ZONES.map((zone, zi) => {
        const inChain = chain.filter(id => dom(id).zone === zone);
        const others = checked.filter(id => !chain.includes(id) && dom(id).zone === zone);
        return <React.Fragment key={zone}>
          {zi > 0 && <div className="dtWire"><i className="fwd" /><i className={`back ${reached.has(zone) ? "on" : ""}`} /></div>}
          <div className={`dtSub ${reached.has(zone) ? "hit" : ""}`}>
            <span className="dtPort in" /><span className="dtPort out" />
            <small>Subsystem</small><b>{ZONE_ICON[zone]} {zone}</b>
            <div className="dtSubBody">
              {inChain.map(id => <span key={id} className={`dtChip ${order(id) < shown ? "fell" : ""} ${id === first ? "first" : ""}`}><em>{order(id) + 1}</em>{dom(id).label}</span>)}
              {others.map(id => traps.includes(id) ? <span key={id} className="dtChip trap">↪ {dom(id).label}</span> : dom(id).status === "bad" ? <span key={id} className="dtChip clue">🔎 {dom(id).label}</span> : <span key={id} className="dtChip ok">✓ {dom(id).label}</span>)}
              {!inChain.length && !others.length && <span className="dtChip unknown">?</span>}
            </div>
          </div>
        </React.Fragment>;
      })}
    </div>
    <p className="dtMapNote"><span className="dtChip fell"><em>1</em>단서</span> 출력부터 거꾸로 찾은 순서 · <span className="dtChip trap">↪</span> 함께 쓰러진 영향 · <span className="dtChip ok">✓</span> 정상 · <span className="dtChip unknown">?</span> 아직 안 감</p>
  </article></div>;
}
