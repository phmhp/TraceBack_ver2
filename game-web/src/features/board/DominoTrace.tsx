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

type Send = React.Dispatch<any>;
type Status = "ok" | "tol" | "bad";
type Zone = "센서" | "제어기" | "CAN" | "부품" | "차량";
type Dom = {
  id: string; label: string; img: string; zone: Zone;
  ref: number | string; run: number | string; unit: string; status: Status;
  t?: number; causes?: string[]; ev?: string;
};
type Zoom = { where: string; kind: "sw" | "hw"; reference: [string, string][]; run: [string, string][]; part?: [string, string, string]; culprit: string; lesson: string };
type CaseData = { start: string; first: string; timeUnit: string; req: string; doms: Dom[]; zoom: Zoom };

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
    zoom: {
      where: "VCU", kind: "sw",
      reference: [["페달 신호 읽기", "60%"], ["토크 지도", "204 Nm"], ["CAN 토크 명령", "204 Nm"]],
      run: [["페달 신호 읽기", "60%"], ["보정 계수 ×0.45", "27%"], ["토크 지도", "92 Nm"], ["CAN 토크 명령", "92 Nm"]],
      culprit: "보정 계수 ×0.45",
      lesson: "기준 설계에 없는 '보정 계수 ×0.45' 블록이 끼어 있었어! 페달 값을 0.45배로 줄여 버린 잘못된 보정값이야.",
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
      { id: "fan_rpm", label: "냉각 팬 회전", img: E("cooling_fan"), zone: "부품", ref: 1850, run: 0, unit: "rpm", status: "bad", t: 0, causes: ["fan_cmd", "fan_pwm", "fan_power", "fan_block"], ev: "fan_actual" },
      { id: "warn_lamp", label: "냉각 경고등", img: ECU, zone: "차량", ref: "꺼짐", run: "켜짐", unit: "", status: "bad", t: 75 },
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
    zoom: {
      where: "냉각 팬", kind: "hw",
      reference: [["온도 읽기", "78°C"], ["65°C 넘으면 켜기", "켜짐"], ["팬 명령", "100%"]],
      run: [["온도 읽기", "78°C"], ["65°C 넘으면 켜기", "켜짐"], ["팬 명령", "100%"]],
      part: ["냉각 팬 모터", "1850 rpm", "0 rpm"],
      culprit: "냉각 팬 모터",
      lesson: "SW는 기준대로 100% 명령을 냈어. 명령을 받은 팬(부품)이 안 돌았으니 범인은 HW야!",
    },
  },
  brake: {
    start: "stop", first: "caliper", timeUnit: "초",
    req: "요구사항: 브레이크를 55% 밟으면 3.2 m/s²로 감속해야 한다.",
    doms: [
      { id: "stop", label: "정지 거리", img: CAR, zone: "차량", ref: 32, run: 58, unit: "m", status: "bad", t: 3, causes: ["decel", "road", "rear_warn"] },
      { id: "decel", label: "차량 감속", img: B("brake_request"), zone: "차량", ref: 3.2, run: 1.4, unit: "m/s²", status: "bad", t: 0.2, causes: ["pitch", "caliper", "regen"] },
      { id: "caliper", label: "캘리퍼 압력", img: B("brake_actual"), zone: "부품", ref: 42, run: 8, unit: "bar", status: "bad", t: 0.1, causes: ["p_cmd", "pad_temp", "bpp", "fluid"], ev: "brake_actual" },
      { id: "rear_warn", label: "후방 추돌 경고", img: ECU, zone: "차량", ref: "꺼짐", run: "켜짐", unit: "", status: "bad", t: 3.2 },
      { id: "pitch", label: "차체 앞 쏠림", img: CAR, zone: "차량", ref: 3, run: 1.2, unit: "°", status: "bad", t: 0.4 },
      { id: "pad_temp", label: "브레이크 패드 온도", img: ATLAS(7), zone: "부품", ref: 180, run: 60, unit: "°C", status: "bad", t: 0.5 },
      OK("p_cmd", "압력 명령 (Brake ECU)", E("brake_ecu"), "제어기", 42, "bar"),
      OK("bpp", "브레이크 페달", E("brake_pedal"), "센서", 55, "%"),
      { ...OK("regen", "회생 제동", B("regen_request"), "제어기", 22, "%"), ev: "regen_request" },
      OK("road", "노면 마찰", CAR, "차량", 0.8, "μ"),
      OK("fluid", "브레이크액 양", ATLAS(8), "부품", 100, "%"),
    ],
    zoom: {
      where: "캘리퍼", kind: "hw",
      reference: [["제동 요청", "3.2 m/s²"], ["회생·마찰 나누기", "나눔"], ["압력 명령", "42 bar"]],
      run: [["제동 요청", "3.2 m/s²"], ["회생·마찰 나누기", "나눔"], ["압력 명령", "42 bar"]],
      part: ["캘리퍼·유압", "42 bar", "8 bar"],
      culprit: "캘리퍼·유압",
      lesson: "제동 SW는 기준대로 42 bar를 명령했어. 실제 압력이 8 bar뿐이니 유압·캘리퍼(HW) 문제야!",
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
  const [zoomPick, setZoomPick] = useState<string | null>(null);
  const [bubble, setBubble] = useState(`${dom(data.start).label}${josa(dom(data.start).label, "이", "가")} 기준과 달라! 후보를 측정해서 원인을 찾아보자. ⏱ 언제 달라졌는지가 중요해.`);
  const [shake, setShake] = useState("");
  const [help, setHelp] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [replay, setReplay] = useState(false);
  const current = chain[chain.length - 1];
  const cur = dom(current);
  const candidates = causesOf(current);
  const opened = candidates.filter(id => checked.includes(id));
  const allOpen = opened.length === candidates.length;
  const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
  const route: string[] = []; for (let id: string | undefined = data.start; id; id = causesOf(id).find(c => dom(c).status === "bad" && (dom(c).t ?? 0) < (dom(id!).t ?? 0))) route.push(id);

  const reset = () => { setChain([data.start]); setChecked([]); setTraps([]); setMistakes(0); setPhase("trace"); setFallIdx(-1); setZoomPick(null); setBubble("처음부터! 출력 쪽에서 거꾸로 따라가 보자."); play("squish"); };
  const nope = (id: string, text: string) => { setBubble(text); setShake(id); play("error"); window.setTimeout(() => setShake(""), 420); };

  const measure = (id: string) => {
    if (checked.includes(id)) return;
    setChecked(previous => [...previous, id]);
    const d = dom(id);
    play("zip");
    window.setTimeout(() => play(d.status === "bad" ? "stamp" : "pop"), 160);
    setBubble(d.status === "bad" ? `${d.label}도 기준과 달라! ⏱ ${fmt(d.t!)}${unit}에 달라지기 시작했어. ${cur.label}(⏱ ${fmt(cur.t!)}${unit})보다 먼저야, 나중이야?`
      : d.status === "tol" ? `${d.label}${josa(d.label, "은", "는")} 아주 조금 달라. 허용 범위라 원인이 아니야.`
        : `${d.label}${josa(d.label, "은", "는")} 기준과 같아. 원인이 아니야.`);
  };
  const accuse = (id: string) => {
    const d = dom(id);
    if ((d.t ?? 0) > (cur.t ?? 0)) {
      // trap: it changed AFTER the current domino → it is an effect, not the cause
      setTraps(previous => previous.includes(id) ? previous : [...previous, id]);
      setMistakes(value => value + 1);
      nope(id, `앗, ${d.label}${josa(d.label, "은", "는")} ⏱ ${fmt(d.t!)}${unit}에 달라졌어. ${cur.label}(⏱ ${fmt(cur.t!)}${unit})보다 늦어! 원인은 결과보다 먼저 일어나야 해. 이건 ${cur.label} 때문에 생긴 영향이야.`);
      return;
    }
    play("squish");
    setChain(previous => [...previous, id]);
    setBubble(`맞아, ${d.label}${josa(d.label, "이", "가")} 더 먼저 달라졌어. 이제 ${d.label}${josa(d.label, "이", "가")} 왜 달라졌는지 찾아보자.`);
  };
  const startCascade = (nextChain: string[]) => {
    setPhase("cascade");
    setBubble("찾았다! 시작점부터 다시 쓰러뜨려 볼게.");
    setFallIdx(-1);
    nextChain.forEach((_, index) => window.setTimeout(() => { setFallIdx(index); play("pop", 1 + index * .15); }, 500 + index * 420));
    window.setTimeout(() => { setPhase("zoom"); setBubble(`이제 ${dom(data.first).label} 안을 확대해서 기준 설계와 다른 곳을 찾자!`); play("success"); }, 1000 + nextChain.length * 420);
  };
  const callFirst = () => {
    if (current !== data.first) { nope(current, "흠… 이건 아닌 것 같아."); return; }
    play("stamp");
    startCascade(chain);
  };
  const pickZoom = (name: string) => {
    setZoomPick(name);
    if (name === data.zoom.culprit) { setBubble(data.zoom.lesson); play("stamp"); window.setTimeout(() => play("success"), 120); window.setTimeout(() => setPhase("done"), 900); }
    else { setBubble(data.zoom.kind === "hw" ? "이 SW 블록은 기준과 똑같아. 값이 다른 곳을 찾아봐!" : "이 블록은 기준에도 있어. 기준에 없는 블록을 찾아봐!"); play("error"); }
  };
  const revealAnswer = () => { setChain(route); setChecked(route.flatMap(id => causesOf(id))); setZoomPick(data.zoom.culprit); setPhase("done"); setFallIdx(route.length); setBubble(data.zoom.lesson); };
  // impact = everything that fell because of the first domino (chain effects + side effects found as traps)
  const effects = [...chain.filter(id => id !== data.first), ...traps].map(dom);
  const finish = () => {
    try { sessionStorage.setItem(`tb-impact-${caseId}`, JSON.stringify(effects.map(d => `${d.label} 정상 복귀 (기준 ${refText(d)})`))); } catch { /* ignore */ }
    const evidence = data.doms.filter(d => d.ev && (chain.includes(d.id) || checked.includes(d.id))).map(d => d.ev!);
    evidence.filter(id => !state.evidence[caseId].includes(id)).forEach(id => send({ type: "RECORD_EVIDENCE", id }));
    if (state.hypothesis[caseId] !== scenario.root) send({ type: "SELECT_HYPOTHESIS", id: scenario.root });
    send({ type: "OPEN_BENCH" });
  };
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
    <GameHeader chapter="INCIDENT INVESTIGATION" title="도미노 추리판" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <main className="dtLayout">
      <header className="dtHead">
        <button className="dtMapBtn" onClick={() => { setMapOpen(true); play("pop"); }}>
          <span className="dtMini">{ZONES.map(zone => <i key={zone} className={zone === cur.zone && !traced ? "now" : chain.some(id => dom(id).zone === zone) ? "seen" : ""} />)}</span>
          🗺 전체 지도
        </button>
        <div className="dtSteps">{["거꾸로 따라가기", "시작점 안 확대", "영향 범위 → 검증"].map((label, index) => <span key={label} className={index < step ? "done" : index === step ? "now" : ""}><i>{index < step ? "✓" : index + 1}</i>{label}</span>)}</div>
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
          <div className={`dtChainItem ${id === current && !traced ? "current" : ""} ${shake === id ? "shake" : ""}`}>
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
          return <div key={id} className={`dtCand ${shake === id ? "shake" : ""}`}>
            <Polaroid dom={d} unit={unit} state={tileState} onClick={open ? undefined : () => measure(id)}>
              {open && d.status === "bad" && !traps.includes(id) && <button className="dtAccuse" onClick={event => { event.stopPropagation(); accuse(id); }}>이게 원인! →</button>}
            </Polaroid>
          </div>;
        })}</div>
        <div className="dtCall">
          {allOpen && !earlierBad
            ? <button className="dtFirst" onClick={callFirst}>들어오는 입력이 모두 정상 → 🎯 {cur.label}{josa(cur.label, "이", "가")} 시작점!</button>
            : <span className="dtTip">사진을 눌러 측정 · 원인은 결과보다 <b>먼저</b> 달라져요</span>}
        </div>
      </section>}

      {(phase === "zoom" || phase === "done") && <section className="dtZoom">
        <h2>🔍 {data.zoom.where} 안을 확대 · 기준 설계와 다른 곳은?</h2>
        <p className="dtReq">📘 {data.req}</p>
        <div className="dtFlowRow"><small>기준</small>{data.zoom.reference.map(([name, value], index) => <React.Fragment key={name}>{index > 0 && <i>→</i>}<span className="dtBlk ref"><b>{name}</b><em>{value}</em></span></React.Fragment>)}</div>
        <div className="dtFlowRow"><small>이번</small>{data.zoom.run.map(([name, value], index) => <React.Fragment key={name}>{index > 0 && <i>→</i>}<button className={`dtBlk ${zoomPick === name ? name === data.zoom.culprit ? "right" : "wrong" : ""}`} onClick={() => phase === "zoom" && pickZoom(name)}><b>{name}</b><em>{value}</em></button></React.Fragment>)}
          {data.zoom.part && <><i>→</i><button className={`dtBlk part ${zoomPick === data.zoom.part[0] ? "right" : ""}`} onClick={() => phase === "zoom" && pickZoom(data.zoom.part![0])}><b>🔧 {data.zoom.part[0]}</b><em>기준 {data.zoom.part[1]} · 지금 {data.zoom.part[2]}</em></button></>}
        </div>
        {phase === "done" && <div className="dtImpact">
          <b>📋 함께 쓰러진 곳 = 고친 뒤 다시 확인할 곳 (회귀 검증)</b>
          <div>{effects.map(d => <span key={d.id}>{d.label}</span>)}</div>
          <b className="dtStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</b>
          <button className="dtNext" onClick={finish}>벤치에서 고치고 검증하기 →</button>
        </div>}
      </section>}

      <div className="dtBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>밍</b>{bubble}</p></div>
    </main>

    {mapOpen && <TraceMap data={data} chain={chain} checked={checked} traps={traps} first={traced ? data.first : null} onClose={() => setMapOpen(false)} />}

    {help && <div className="dtModal" onClick={() => setHelp(false)}><article onClick={event => event.stopPropagation()}>
      <h2>🕵️ 도미노 추리, 이렇게 해요</h2>
      <div className="dtHow">
        <div><span className="pic">📸</span><b>1. 사진 측정</b><small>기준과 같은지, 언제 달라졌는지</small></div>
        <div><span className="pic">⏱</span><b>2. 먼저 달라진 쪽이 원인</b><small>나중에 달라진 건 결과(함정)</small></div>
        <div><span className="pic">🎯</span><b>3. 시작점 찾기</b><small>입력이 모두 정상인데 출력만 다를 때</small></div>
      </div>
      <p className="dtHowNote">막대: <i className="dash" /> 기준 · <i className="fill" /> 이번 주행 · 틀리면 ♥이 줄어요</p>
      <button onClick={() => setHelp(false)}>시작!</button>
    </article></div>}
    {replay && <div className="replayModal" onClick={() => setReplay(false)}><div onClick={event => event.stopPropagation()}><button onClick={() => setReplay(false)}>×</button><small>QUICK REPLAY</small><h2>고장 직전 주행 다시 보기</h2><ReplayRaceView caseId={caseId} /></div></div>}
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}

/** Whole E/E path as Simulink-like subsystems; the trace falls backward from the output. */
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
