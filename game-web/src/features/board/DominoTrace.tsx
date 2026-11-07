// Memo board v5 — "쓰러진 도미노 거꾸로 따라가기" (mystery: trace the abnormal values backward).
// One question per screen: "Why did <this value> differ from the reference?"
//  1) Start from the symptom (vehicle output).
//  2) Flip the 3 face-down upstream candidates (compare reference vs this drive).
//     Abnormal one = clue → follow it. Normal ones are ruled out.
//  3) When every candidate in front is normal, this one is the first domino.
//  4) Replay the cascade, zoom inside the first domino (SW block or HW part),
//     and the fallen chain becomes the bench's regression list (impact analysis).
// The "전체 지도" overlay shows the whole E/E path as Simulink-like subsystems
// (센서 → 제어기 → CAN → 부품 → 차량) with the trace falling backward from the output.
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
  id: string; label: string; icon: string; zone: Zone;
  ref: number; run: number; unit: string; status: Status;
  causes?: string[]; expertCauses?: string[]; ev?: string;
};
type Zoom = { where: string; kind: "sw" | "hw"; reference: [string, string][]; run: [string, string][]; part?: [string, string, string]; culprit: string; lesson: string };
type CaseData = { start: string; first: string; req: string; doms: Dom[]; zoom: Zoom };

const ZONES: Zone[] = ["센서", "제어기", "CAN", "부품", "차량"];
const ZONE_ICON: Record<Zone, string> = { 센서: "🦶", 제어기: "🧠", CAN: "📡", 부품: "⚙️", 차량: "🚗" };

// shared "normal" candidates
const OK = (id: string, label: string, icon: string, zone: Zone, ref: number, unit: string): Dom => ({ id, label, icon, zone, ref, run: ref, unit, status: "ok" });

const CASES: Record<CaseId, CaseData> = {
  propulsion: {
    start: "accel", first: "vcu_in",
    req: "요구사항: 가속 페달을 60% 밟으면 모터가 204 Nm를 내야 한다.",
    doms: [
      { id: "accel", label: "차량 가속", icon: "🚗", zone: "차량", ref: 2.8, run: 1.2, unit: "m/s²", status: "bad", causes: ["motor_tq", "regen", "tire"], expertCauses: ["slope"], ev: "pedal_raw" },
      { id: "motor_tq", label: "모터 힘", icon: "⚙️", zone: "부품", ref: 204, run: 91, unit: "Nm", status: "bad", causes: ["batt_lim", "can_cmd", "motor_temp"], expertCauses: ["inv_lim"], ev: "motor_actual" },
      { id: "can_cmd", label: "CAN 토크 명령", icon: "📡", zone: "CAN", ref: 204, run: 92, unit: "Nm", status: "bad", causes: ["gateway", "drive_mode", "vcu_in"], expertCauses: ["can_err"], ev: "torque_cmd" },
      { id: "vcu_in", label: "VCU 페달 처리값", icon: "🧠", zone: "제어기", ref: 60, run: 27, unit: "%", status: "bad", causes: ["aps", "brake_sw", "gear"], expertCauses: ["aps2"], ev: "pedal_processed" },
      OK("aps", "가속 페달 센서", "🦶", "센서", 60, "%"),
      OK("aps2", "예비 페달 센서", "🦶", "센서", 30, "%"),
      { ...OK("brake_sw", "브레이크 스위치", "🛑", "센서", 0, "꺼짐") },
      { ...OK("gear", "기어 위치", "🅳", "센서", 0, "D") },
      OK("regen", "회생 제동", "♻️", "제어기", 0, "%"),
      OK("batt_lim", "배터리 출력 한계", "🔋", "제어기", 160, "kW"),
      OK("inv_lim", "인버터 전류 한계", "⚡", "부품", 400, "A"),
      OK("gateway", "게이트웨이 전달", "🔀", "CAN", 100, "%"),
      OK("can_err", "CAN 오류 횟수", "📡", "CAN", 0, "회"),
      { ...OK("drive_mode", "주행 모드", "🎚️", "제어기", 0, "보통") },
      OK("slope", "도로 경사", "⛰️", "차량", 0, "%"),
      { id: "tire", label: "타이어 공기압", icon: "🛞", zone: "부품", ref: 2.4, run: 2.3, unit: "bar", status: "tol" },
      { id: "motor_temp", label: "모터 온도", icon: "🌡️", zone: "부품", ref: 62, run: 60, unit: "°C", status: "tol" },
    ],
    zoom: {
      where: "VCU", kind: "sw",
      reference: [["페달 신호 읽기", "60%"], ["토크 지도", "204 Nm"], ["CAN 토크 명령", "204 Nm"]],
      run: [["페달 신호 읽기", "60%"], ["옛 보정 45%", "27%"], ["토크 지도", "92 Nm"], ["CAN 토크 명령", "92 Nm"]],
      culprit: "옛 보정 45%",
      lesson: "기준 설계에 없는 블록이 끼어 있었어! 페달 값을 45%로 줄인 옛 보정값이 범인이야.",
    },
  },
  thermal: {
    start: "accel", first: "fan_rpm",
    req: "요구사항: 냉각수가 65°C를 넘으면 냉각 팬을 100%로 돌려야 한다.",
    doms: [
      { id: "accel", label: "차량 가속", icon: "🚗", zone: "차량", ref: 2.8, run: 1.9, unit: "m/s²", status: "bad", causes: ["regen", "tq_limit", "tire"], expertCauses: ["slope"] },
      { id: "tq_limit", label: "모터 힘 한계", icon: "⚙️", zone: "제어기", ref: 240, run: 150, unit: "Nm", status: "bad", causes: ["batt_lim", "drive_mode", "derate"] },
      { id: "derate", label: "출력 허용", icon: "🚦", zone: "제어기", ref: 100, run: 62, unit: "%", status: "bad", causes: ["coolant", "air_temp", "batt_temp"], ev: "thermal_protection" },
      { id: "coolant", label: "냉각수 온도", icon: "🌡️", zone: "센서", ref: 65, run: 78, unit: "°C", status: "bad", causes: ["pump", "fan_rpm", "coolant_lv"], ev: "motor_temp" },
      { id: "fan_rpm", label: "냉각 팬 회전", icon: "🌀", zone: "부품", ref: 1850, run: 0, unit: "rpm", status: "bad", causes: ["fan_cmd", "fan_power", "fan_block"], expertCauses: ["fan_can"], ev: "fan_actual" },
      { ...OK("fan_cmd", "팬 명령", "🧠", "제어기", 100, "%"), ev: "fan_command" },
      OK("fan_power", "팬 전원", "⚡", "부품", 12, "V"),
      { ...OK("fan_block", "팬 막힘", "🍂", "부품", 0, "없음") },
      OK("fan_can", "팬 명령 전달", "📡", "CAN", 100, "%"),
      { id: "pump", label: "냉각수 펌프", icon: "💧", zone: "부품", ref: 12, run: 11.8, unit: "L/min", status: "tol" },
      OK("coolant_lv", "냉각수 양", "🧪", "부품", 100, "%"),
      { id: "air_temp", label: "바깥 기온", icon: "☀️", zone: "센서", ref: 25, run: 26, unit: "°C", status: "tol" },
      OK("batt_temp", "배터리 온도", "🔋", "센서", 30, "°C"),
      OK("regen", "회생 제동", "♻️", "제어기", 0, "%"),
      OK("batt_lim", "배터리 출력 한계", "🔋", "제어기", 160, "kW"),
      { ...OK("drive_mode", "주행 모드", "🎚️", "제어기", 0, "보통") },
      OK("slope", "도로 경사", "⛰️", "차량", 0, "%"),
      { id: "tire", label: "타이어 공기압", icon: "🛞", zone: "부품", ref: 2.4, run: 2.3, unit: "bar", status: "tol" },
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
    start: "stop", first: "caliper",
    req: "요구사항: 브레이크를 55% 밟으면 3.2 m/s²로 감속해야 한다.",
    doms: [
      { id: "stop", label: "정지 거리", icon: "📏", zone: "차량", ref: 32, run: 58, unit: "m", status: "bad", causes: ["road", "decel", "speed"] },
      { id: "decel", label: "차량 감속", icon: "🚗", zone: "차량", ref: 3.2, run: 1.4, unit: "m/s²", status: "bad", causes: ["regen", "tire", "caliper"], expertCauses: ["abs"] },
      { id: "caliper", label: "캘리퍼 압력", icon: "🗜️", zone: "부품", ref: 42, run: 8, unit: "bar", status: "bad", causes: ["p_cmd", "fluid", "wheel"], ev: "brake_actual" },
      OK("p_cmd", "압력 명령", "🧠", "제어기", 42, "bar"),
      OK("fluid", "브레이크액 양", "🧪", "부품", 100, "%"),
      { ...OK("regen", "회생 제동", "♻️", "제어기", 22, "%"), ev: "regen_request" },
      OK("road", "노면 미끄러움", "🛣️", "차량", 0.8, "μ"),
      OK("speed", "출발 속도", "🏁", "차량", 80, "km/h"),
      { ...OK("abs", "ABS 개입", "🅰️", "제어기", 0, "없음") },
      { id: "wheel", label: "바퀴 속도 센서", icon: "🛞", zone: "센서", ref: 100, run: 99, unit: "%", status: "tol" },
      { id: "tire", label: "타이어 공기압", icon: "🛞", zone: "부품", ref: 2.4, run: 2.3, unit: "bar", status: "tol" },
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

const MODE_KEY = "tb-board-mode";
const readMode = (): "rookie" | "expert" => { try { return localStorage.getItem(MODE_KEY) === "expert" ? "expert" : "rookie"; } catch { return "rookie"; } };
const fmt = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);
/** Korean particle: picks 이/가, 은/는 … from the last Hangul syllable. */
const josa = (word: string, withBatchim: string, without: string) => {
  const hangul = word.replace(/[^가-힣]/g, "");
  const code = hangul.charCodeAt(hangul.length - 1) - 0xac00;
  return code >= 0 && code % 28 ? withBatchim : without;
};
const isWord = (dom: Dom) => ["꺼짐", "D", "보통", "없음"].includes(dom.unit);

/** Reference vs this drive: dashed outline = reference, filled = this drive. */
function Gauge({ dom }: { dom: Dom }) {
  if (isWord(dom)) return <div className={`dtGauge g-${dom.status}`}><span className="dtGaugeTxt">기준 {dom.unit} · 지금 <b>{dom.unit}</b></span></div>;
  const max = Math.max(dom.ref, dom.run, 0.001) * 1.15;
  return <div className={`dtGauge g-${dom.status}`}>
    <div className="dtTrack"><i className="ref" style={{ width: `${Math.max(3, dom.ref / max * 100)}%` }} /><i className="run" style={{ width: `${Math.max(3, dom.run / max * 100)}%` }} /></div>
    <span className="dtGaugeTxt">기준 {fmt(dom.ref)} · 지금 <b>{fmt(dom.run)}</b> {dom.unit}</span>
  </div>;
}

type TileState = "hidden" | "clue" | "normal" | "tol" | "first";
function Tile({ dom, state, small, onClick, fell }: { dom: Dom; state: TileState; small?: boolean; onClick?: () => void; fell?: boolean }) {
  return <div className={`dtTile t-${state} ${small ? "small" : ""} ${onClick ? "click" : ""} ${fell ? "fell" : ""}`} onClick={onClick}>
    {state === "hidden"
      ? <div className="dtBack"><span className="dtIcon">{dom.icon}</span><b>{dom.label}</b><em>🔍 조사하기</em></div>
      : <div className="dtFace">
        <span className="dtIcon">{dom.icon}</span><b>{dom.label}</b><Gauge dom={dom} />
        <i className="dtMark">{state === "clue" ? "🔎 단서" : state === "first" ? "🎯 시작점" : state === "tol" ? "≈ 허용 범위" : "✓ 정상"}</i>
      </div>}
  </div>;
}

export function DominoTrace({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const scenario = SCENARIOS[caseId];
  const data = CASES[caseId];
  const dom = (id: string) => data.doms.find(item => item.id === id)!;
  const [mode, setModeState] = useState(readMode);
  const expert = mode === "expert";
  const causesOf = (id: string) => { const d = dom(id); return [...(d.causes ?? []), ...(expert ? d.expertCauses ?? [] : [])]; };

  const [chain, setChain] = useState<string[]>([data.start]); // symptom → … (backward)
  const [checked, setChecked] = useState<string[]>([]);
  const [phase, setPhase] = useState<"trace" | "cascade" | "zoom" | "done">("trace");
  const [fallIdx, setFallIdx] = useState(-1);
  const [zoomPick, setZoomPick] = useState<string | null>(null);
  const [bubble, setBubble] = useState(`${dom(data.start).label}${josa(dom(data.start).label, "이", "가")} 기준과 달라! 뒤집어서 원인을 하나씩 확인해 보자.`);
  const [shake, setShake] = useState("");
  const [help, setHelp] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [replay, setReplay] = useState(false);
  const [extra, setExtra] = useState(0);
  const current = chain[chain.length - 1];
  const candidates = causesOf(current);
  const clue = candidates.find(id => checked.includes(id) && dom(id).status === "bad");
  const allClear = candidates.every(id => checked.includes(id) && dom(id).status !== "bad");
  // expert: limited investigations. best = one lucky flip per step + all flips at the first domino
  const route: string[] = []; for (let id: string | undefined = data.start; id; id = causesOf(id).find(c => dom(c).status === "bad")) route.push(id);
  const best = route.length - 1 + causesOf(data.first).length;
  const worst = route.reduce((sum, id) => sum + causesOf(id).length, 0);
  const budget = Math.max(best + 2, worst - 3) + extra;
  const left = budget - checked.length;
  const stars = checked.length <= best + 1 ? 3 : checked.length <= best + 4 ? 2 : 1;

  const setMode = (next: "rookie" | "expert") => { try { localStorage.setItem(MODE_KEY, next); } catch { /* ignore */ } setModeState(next); reset(); };
  const reset = () => { setChain([data.start]); setChecked([]); setPhase("trace"); setFallIdx(-1); setZoomPick(null); setExtra(0); setBubble("처음부터! 출력 쪽에서 거꾸로 따라가 보자."); play("squish"); };
  const nope = (id: string, text: string) => { setBubble(text); setShake(id); play("error"); window.setTimeout(() => setShake(""), 420); };

  const investigate = (id: string) => {
    if (checked.includes(id) || clue) return;
    if (expert && left <= 0) { nope(id, "조사 기회를 다 썼어. '+1 기회'를 쓰면 추격차가 5m 가까워져."); return; }
    setChecked(previous => [...previous, id]);
    const d = dom(id);
    play("zip");
    window.setTimeout(() => play(d.status === "bad" ? "stamp" : "pop"), 160);
    setBubble(d.status === "bad" ? `찾았다, 단서! ${d.label}도 기준과 달라. 이걸 따라가 보자.`
      : d.status === "tol" ? `${d.label}은 아주 조금 달라. 허용 범위라 원인이 아니야.`
        : `${d.label}은 기준과 같아. 원인이 아니야.`);
  };
  const follow = (id: string) => { setChain(previous => [...previous, id]); play("squish"); const d = dom(id); setBubble(`좋아! 이제 ${d.label}${josa(d.label, "이", "가")} 왜 달라졌는지 찾아보자.`); };
  const startCascade = (nextChain: string[]) => {
    setPhase("cascade");
    setBubble("찾았다! 시작점부터 다시 쓰러뜨려 볼게.");
    setFallIdx(-1);
    nextChain.forEach((_, index) => window.setTimeout(() => { setFallIdx(index); play("pop", 1 + index * .15); }, 500 + index * 420));
    window.setTimeout(() => { setPhase("zoom"); setBubble(`이제 ${dom(data.first).label} 안을 확대해서 기준 설계와 다른 곳을 찾자!`); play("success"); }, 1000 + nextChain.length * 420);
  };
  const callFirst = () => {
    if (!allClear) {
      // expert may guess early: wrong if there is still an abnormal candidate in front
      const hiddenBad = candidates.find(id => dom(id).status === "bad");
      if (hiddenBad) { nope(current, "아직 앞쪽에 기준과 다른 값이 숨어 있어! 성급했어."); if (expert) setChecked(previous => [...previous, `penalty${previous.length}`]); return; }
    }
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
  const effects = chain.filter(id => id !== data.first).map(dom);
  const finish = () => {
    try { sessionStorage.setItem(`tb-impact-${caseId}`, JSON.stringify(effects.map(d => `${d.label} 정상 복귀 (기준 ${isWord(d) ? d.unit : `${fmt(d.ref)} ${d.unit}`})`))); } catch { /* ignore */ }
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
  const cur = dom(current);
  const traced = phase !== "trace";

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
          <span className="dtMode"><button className={!expert ? "on" : ""} onClick={() => setMode("rookie")}>신입</button><button className={expert ? "on" : ""} onClick={() => setMode("expert")}>실무자</button></span>
          <button onClick={() => setHelp(true)}>방법</button>
          <button onClick={() => setReplay(true)}>▶ 리플레이</button>
          <button onClick={reset}>↺</button>
        </div>
      </header>

      {/* the abnormal chain, cause → effect */}
      <section className="dtChain">
        <span className="dtChainHint">원인 쪽</span>
        {!traced && <><div className="dtGhost">?</div><i className="dtArrow" /></>}
        {ordered.map((id, index) => {
          const isFirst = traced && id === data.first;
          return <React.Fragment key={id}>
            {index > 0 && <i className={`dtArrow ${traced && index <= fallIdx ? "lit" : ""}`} />}
            <div className={`dtChainItem ${id === current && !traced ? "current" : ""} ${shake === id ? "shake" : ""}`}>
              {id === data.start && <em className="dtBadge">증상</em>}
              <Tile dom={dom(id)} state={isFirst ? "first" : "clue"} small fell={phase === "cascade" && index <= fallIdx} />
            </div>
          </React.Fragment>;
        })}
        <span className="dtChainHint">결과 쪽</span>
      </section>

      {phase === "trace" && <section className="dtQuestion">
        <h2><b>{cur.label}</b>{josa(cur.label, "이", "가")} 기준과 달라진 원인은?</h2>
        <div className="dtCands">{candidates.map(id => {
          const d = dom(id); const open = checked.includes(id);
          const tileState: TileState = !open ? "hidden" : d.status === "bad" ? "clue" : d.status === "tol" ? "tol" : "normal";
          return <div key={id} className={`dtCand ${shake === id ? "shake" : ""} ${clue && clue !== id ? "dim" : ""}`}>
            <Tile dom={d} state={tileState} onClick={open || clue ? undefined : () => investigate(id)} />
          </div>;
        })}</div>
        <div className="dtCall">
          {expert && <span className="dtBudget">조사 {"●".repeat(Math.max(0, left))}{"○".repeat(Math.max(0, Math.min(budget, budget - left)))}{left <= 0 && <button onClick={() => { send({ type: "HINT", key: `${caseId}:trace${extra + 1}` }); setExtra(value => value + 1); play("squish"); }}>+1 기회 · 추격 −5m</button>}</span>}
          {clue
            ? <button className="dtFollow" onClick={() => follow(clue)}>🔎 {dom(clue).label} 따라가기 →</button>
            : allClear
              ? <button className="dtFirst" onClick={callFirst}>앞쪽 원인이 모두 정상 → 🎯 {cur.label}{josa(cur.label, "이", "가")} 시작점!</button>
              : expert
                ? <button className="dtFirst ghost" onClick={callFirst}>🎯 여기가 시작점이라고 추리하기</button>
                : <span className="dtTip">카드를 눌러 기준과 비교해 봐</span>}
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
          <div>{effects.map(d => <span key={d.id}>{d.icon} {d.label}</span>)}</div>
          {expert && <b className="dtStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</b>}
          <button className="dtNext" onClick={finish}>벤치에서 고치고 검증하기 →</button>
        </div>}
      </section>}

      <div className="dtBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>밍</b>{bubble}</p></div>
    </main>

    {mapOpen && <TraceMap data={data} chain={chain} checked={checked} first={traced ? data.first : null} onClose={() => setMapOpen(false)} />}

    {help && <div className="dtModal" onClick={() => setHelp(false)}><article onClick={event => event.stopPropagation()}>
      <h2>🕵️ 도미노 추리, 이렇게 해요</h2>
      <div className="dtHow">
        <div><span className="pic">🚗</span><b>1. 증상에서 시작</b><small>기준과 다른 출력값</small></div>
        <div><span className="pic">🔍</span><b>2. 원인 후보 뒤집기</b><small>다르면 🔎 단서, 따라가기</small></div>
        <div><span className="pic">🎯</span><b>3. 시작점 찾기</b><small>앞쪽이 모두 정상일 때</small></div>
      </div>
      <p className="dtHowNote">막대: <i className="dash" /> 기준 · <i className="fill" /> 이번 주행 · 🗺 전체 지도에서 지금 위치를 봐요</p>
      <button onClick={() => setHelp(false)}>시작!</button>
    </article></div>}
    {replay && <div className="replayModal" onClick={() => setReplay(false)}><div onClick={event => event.stopPropagation()}><button onClick={() => setReplay(false)}>×</button><small>QUICK REPLAY</small><h2>고장 직전 주행 다시 보기</h2><ReplayRaceView caseId={caseId} /></div></div>}
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}

/** Whole E/E path as Simulink-like subsystems; the trace falls backward from the output. */
function TraceMap({ data, chain, checked, first, onClose }: { data: CaseData; chain: string[]; checked: string[]; first: string | null; onClose: () => void }) {
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
        const ruled = checked.filter(id => !id.startsWith("penalty") && !chain.includes(id) && dom(id).zone === zone);
        return <React.Fragment key={zone}>
          {zi > 0 && <div className="dtWire"><i className="fwd" /><i className={`back ${reached.has(zone) ? "on" : ""}`} /></div>}
          <div className={`dtSub ${reached.has(zone) ? "hit" : ""}`}>
            <span className="dtPort in" /><span className="dtPort out" />
            <small>Subsystem</small><b>{ZONE_ICON[zone]} {zone}</b>
            <div className="dtSubBody">
              {inChain.map(id => <span key={id} className={`dtChip ${order(id) < shown ? "fell" : ""} ${id === first ? "first" : ""}`}><em>{order(id) + 1}</em>{dom(id).label}</span>)}
              {ruled.map(id => dom(id).status === "bad" ? <span key={id} className="dtChip clue">🔎 {dom(id).label}</span> : <span key={id} className="dtChip ok">✓ {dom(id).label}</span>)}
              {!inChain.length && !ruled.length && <span className="dtChip unknown">?</span>}
            </div>
          </div>
        </React.Fragment>;
      })}
    </div>
    <p className="dtMapNote"><span className="dtChip fell"><em>1</em>단서</span> 출력에서부터 거꾸로 찾은 순서 · <span className="dtChip ok">✓</span> 조사해서 정상 · <span className="dtChip unknown">?</span> 아직 안 감</p>
  </article></div>;
}
