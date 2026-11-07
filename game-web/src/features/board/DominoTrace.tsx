// Memo board v4 — "쓰러진 도미노 거꾸로 따라가기" (mystery: trace fallen dominoes backward).
// One small question per screen: "Who knocked this domino over?"
//  1) Start from the symptom domino (already fallen).
//  2) Flip the face-down upstream candidates (investigate = compare reference vs this drive).
//     Fallen one → follow it. Standing ones are ruled out.
//  3) When every candidate in front is standing, call it: "🎯 이게 첫 도미노!"
//  4) Replay the cascade, zoom into the first domino (SW block or HW part), and the fallen chain
//     becomes the bench's regression list (impact analysis).
import React, { useState } from "react";
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
type CaseData = { start: string; first: string; doms: Dom[]; zoom: Zoom };

const ZONES: Zone[] = ["센서", "제어기", "CAN", "부품", "차량"];

const CASES: Record<CaseId, CaseData> = {
  propulsion: {
    start: "accel", first: "vcu_in",
    doms: [
      { id: "accel", label: "차량 가속", icon: "🚗", zone: "차량", ref: 2.8, run: 1.2, unit: "m/s²", status: "bad", causes: ["motor_tq", "regen"], expertCauses: ["tire"], ev: "pedal_raw" },
      { id: "motor_tq", label: "모터 힘(토크)", icon: "⚙️", zone: "부품", ref: 204, run: 91, unit: "Nm", status: "bad", causes: ["can_cmd", "batt_lim"], expertCauses: ["motor_temp"], ev: "motor_actual" },
      { id: "can_cmd", label: "CAN 토크 명령", icon: "📡", zone: "CAN", ref: 204, run: 92, unit: "Nm", status: "bad", causes: ["vcu_in", "gateway"], ev: "torque_cmd" },
      { id: "vcu_in", label: "VCU 페달 처리값", icon: "🧠", zone: "제어기", ref: 60, run: 27, unit: "%", status: "bad", causes: ["aps"], expertCauses: ["brake_sw"], ev: "pedal_processed" },
      { id: "aps", label: "가속 페달 센서", icon: "🦶", zone: "센서", ref: 60, run: 60, unit: "%", status: "ok" },
      { id: "brake_sw", label: "브레이크 스위치", icon: "🛑", zone: "센서", ref: 0, run: 0, unit: "꺼짐", status: "ok" },
      { id: "regen", label: "회생 제동", icon: "♻️", zone: "제어기", ref: 0, run: 0, unit: "%", status: "ok" },
      { id: "batt_lim", label: "배터리 출력 한계", icon: "🔋", zone: "제어기", ref: 160, run: 160, unit: "kW", status: "ok" },
      { id: "gateway", label: "게이트웨이 전달", icon: "🔀", zone: "CAN", ref: 100, run: 100, unit: "%", status: "ok" },
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
    doms: [
      { id: "accel", label: "차량 가속", icon: "🚗", zone: "차량", ref: 2.8, run: 1.9, unit: "m/s²", status: "bad", causes: ["tq_limit", "regen"], expertCauses: ["tire"] },
      { id: "tq_limit", label: "모터 힘 한계", icon: "⚙️", zone: "제어기", ref: 240, run: 150, unit: "Nm", status: "bad", causes: ["derate", "batt_lim"] },
      { id: "derate", label: "출력 허용", icon: "🚦", zone: "제어기", ref: 100, run: 62, unit: "%", status: "bad", causes: ["coolant", "air_temp"], ev: "thermal_protection" },
      { id: "coolant", label: "냉각수 온도", icon: "🌡️", zone: "센서", ref: 65, run: 78, unit: "°C", status: "bad", causes: ["fan_rpm", "pump"], ev: "motor_temp" },
      { id: "fan_rpm", label: "냉각 팬 회전", icon: "🌀", zone: "부품", ref: 1850, run: 0, unit: "rpm", status: "bad", causes: ["fan_cmd", "fan_power"], ev: "fan_actual" },
      { id: "fan_cmd", label: "팬 명령 (Thermal ECU)", icon: "🧠", zone: "제어기", ref: 100, run: 100, unit: "%", status: "ok", ev: "fan_command" },
      { id: "fan_power", label: "팬 전원 12V", icon: "⚡", zone: "부품", ref: 12, run: 12, unit: "V", status: "ok" },
      { id: "pump", label: "냉각수 펌프", icon: "💧", zone: "부품", ref: 12, run: 11.8, unit: "L/min", status: "tol" },
      { id: "air_temp", label: "바깥 기온", icon: "☀️", zone: "센서", ref: 25, run: 26, unit: "°C", status: "tol" },
      { id: "regen", label: "회생 제동", icon: "♻️", zone: "제어기", ref: 0, run: 0, unit: "%", status: "ok" },
      { id: "batt_lim", label: "배터리 출력 한계", icon: "🔋", zone: "제어기", ref: 160, run: 160, unit: "kW", status: "ok" },
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
    doms: [
      { id: "stop", label: "정지 거리", icon: "📏", zone: "차량", ref: 32, run: 58, unit: "m", status: "bad", causes: ["decel", "road"] },
      { id: "decel", label: "차량 감속", icon: "🚗", zone: "차량", ref: 3.2, run: 1.4, unit: "m/s²", status: "bad", causes: ["caliper", "regen"], expertCauses: ["tire"] },
      { id: "caliper", label: "캘리퍼 압력", icon: "🗜️", zone: "부품", ref: 42, run: 8, unit: "bar", status: "bad", causes: ["p_cmd"], expertCauses: ["wheel"], ev: "brake_actual" },
      { id: "p_cmd", label: "압력 명령 (Brake ECU)", icon: "🧠", zone: "제어기", ref: 42, run: 42, unit: "bar", status: "ok", causes: ["bpp"] },
      { id: "bpp", label: "브레이크 페달", icon: "🦶", zone: "센서", ref: 55, run: 55, unit: "%", status: "ok", ev: "brake_request" },
      { id: "regen", label: "회생 제동", icon: "♻️", zone: "제어기", ref: 22, run: 22, unit: "%", status: "ok", ev: "regen_request" },
      { id: "road", label: "노면 미끄러움", icon: "🛣️", zone: "차량", ref: 0.8, run: 0.8, unit: "μ", status: "ok" },
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

/** Reference vs this drive as two bars: dashed outline = reference, filled = this drive. */
function Gauge({ dom }: { dom: Dom }) {
  if (dom.unit === "꺼짐") return <div className="dtGauge"><span className="dtGaugeTxt">기준 꺼짐 · 지금 꺼짐</span></div>;
  const max = Math.max(dom.ref, dom.run, 0.001) * 1.15;
  return <div className={`dtGauge g-${dom.status}`}>
    <div className="dtTrack"><i className="ref" style={{ width: `${dom.ref / max * 100}%` }} /><i className="run" style={{ width: `${Math.max(2, dom.run / max * 100)}%` }} /></div>
    <span className="dtGaugeTxt">기준 {fmt(dom.ref)} · 지금 <b>{fmt(dom.run)}</b> {dom.unit}</span>
  </div>;
}

function Tile({ dom, state, small, onClick, children }: { dom: Dom; state: "down" | "fallen" | "standing" | "wobble" | "hidden"; small?: boolean; onClick?: () => void; children?: React.ReactNode }) {
  return <div className={`dtTile t-${state} ${small ? "small" : ""} ${onClick ? "click" : ""}`} onClick={onClick}>
    {state === "hidden"
      ? <div className="dtBack"><span>?</span><small>{dom.icon} {dom.label}</small><em>🔍 조사하기</em></div>
      : <div className="dtFace"><span className="dtIcon">{dom.icon}</span><b>{dom.label}</b><Gauge dom={dom} />{children}</div>}
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
  const [bubble, setBubble] = useState("차가 느려졌어! 쓰러진 도미노를 거꾸로 따라가서 처음 넘어진 도미노를 찾자.");
  const [shake, setShake] = useState("");
  const [help, setHelp] = useState(true);
  const [replay, setReplay] = useState(false);
  const [extra, setExtra] = useState(0);
  const current = chain[chain.length - 1];
  const candidates = causesOf(current);
  // Expert: limited investigations. best = one lucky flip per step + all flips at the first domino.
  const route: string[] = []; for (let id: string | undefined = data.start; id; id = causesOf(id).find(c => dom(c).status === "bad")) route.push(id);
  const best = route.length - 1 + causesOf(data.first).length;
  const worst = route.reduce((sum, id) => sum + causesOf(id).length, 0);
  const budget = Math.max(best + 1, worst - 2) + extra;
  const left = budget - checked.length;
  const stars = checked.length <= best + 1 ? 3 : checked.length <= best + 3 ? 2 : 1;

  const setMode = (next: "rookie" | "expert") => { try { localStorage.setItem(MODE_KEY, next); } catch { /* ignore */ } setModeState(next); reset(); };
  const reset = () => { setChain([data.start]); setChecked([]); setPhase("trace"); setFallIdx(-1); setZoomPick(null); setExtra(0); setBubble("처음부터! 맨 끝 도미노에서 거꾸로 따라가 보자."); play("squish"); };
  const nope = (id: string, text: string) => { setBubble(text); setShake(id); play("error"); window.setTimeout(() => setShake(""), 420); };

  const investigate = (id: string) => {
    if (checked.includes(id)) return;
    if (expert && left <= 0) { nope(id, "조사 기회를 다 썼어. '+1 기회'를 쓰면 추격차가 5m 가까워져."); return; }
    setChecked(previous => [...previous, id]);
    const d = dom(id);
    play("zip");
    window.setTimeout(() => play(d.status === "bad" ? "crash" : "pop"), 160);
    setBubble(d.status === "bad" ? `${d.label}도 쓰러져 있어! 따라가 볼까?`
      : d.status === "tol" ? `${d.label}은 살짝 흔들릴 뿐 서 있어. 허용 범위라 범인이 아니야.`
        : `${d.label}은 똑바로 서 있어. 범인이 아니야.`);
  };
  const follow = (id: string) => { setChain(previous => [...previous, id]); play("squish"); setBubble(`이번엔 '${dom(id).label}'을 넘어뜨린 걸 찾아보자.`); };
  const callFirst = () => {
    const unchecked = candidates.filter(id => !checked.includes(id));
    if (unchecked.length) { nope(current, "아직 뒤집어 보지 않은 도미노가 있어! 다 확인해야 확실해."); return; }
    const fallen = candidates.find(id => dom(id).status === "bad");
    if (fallen) { nope(current, `앞에 쓰러진 '${dom(fallen).label}'이 있잖아! 그쪽을 따라가 봐.`); return; }
    if (current !== data.first) { nope(current, "흠… 이건 정답 경로가 아닌 것 같아."); return; }
    play("stamp");
    setPhase("cascade");
    setBubble("찾았다! 첫 도미노부터 다시 넘어뜨려 볼게.");
    const order = [...chain].reverse();
    setFallIdx(-1);
    order.forEach((_, index) => window.setTimeout(() => { setFallIdx(index); play("pop", 1 + index * .15); }, 600 + index * 450));
    window.setTimeout(() => { setPhase("zoom"); setBubble(`이제 '${dom(data.first).label}' 안을 확대해서 기준 설계와 다른 곳을 찾자!`); play("success"); }, 1200 + order.length * 450);
  };
  const pickZoom = (name: string) => {
    setZoomPick(name);
    if (name === data.zoom.culprit) { setBubble(data.zoom.lesson); play("stamp"); window.setTimeout(() => play("success"), 120); window.setTimeout(() => setPhase("done"), 900); }
    else { setBubble(data.zoom.kind === "hw" ? "이 SW 블록은 기준과 똑같아. 값이 다른 곳을 찾아봐!" : "이 블록은 기준에도 있어. 기준에 없는 블록을 찾아봐!"); play("error"); }
  };
  const effects = chain.filter(id => id !== data.first).map(dom);
  const finish = () => {
    try { sessionStorage.setItem(`tb-impact-${caseId}`, JSON.stringify(effects.map(d => `${d.label} 정상 복귀 (기준 ${fmt(d.ref)} ${d.unit})`))); } catch { /* ignore */ }
    const evidence = data.doms.filter(d => d.ev && (chain.includes(d.id) || checked.includes(d.id))).map(d => d.ev!);
    evidence.filter(id => !state.evidence[caseId].includes(id)).forEach(id => send({ type: "RECORD_EVIDENCE", id }));
    if (state.hypothesis[caseId] !== scenario.root) send({ type: "SELECT_HYPOTHESIS", id: scenario.root });
    send({ type: "OPEN_BENCH" });
  };

  const ordered = [...chain].reverse(); // cause → effect (left → right)
  const step = phase === "trace" ? 0 : phase === "cascade" ? 1 : phase === "zoom" ? 1 : 2;
  const zoneNow = dom(phase === "trace" ? current : data.first).zone;

  return <div className="dtBoard">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="INCIDENT INVESTIGATION" title="도미노 추리판" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <main className="dtLayout">
      <header className="dtHead">
        <div className="dtSteps">{["거꾸로 따라가기", "첫 도미노 안 확대", "영향 범위 → 검증"].map((label, index) => <span key={label} className={index < step ? "done" : index === step ? "now" : ""}><i>{index < step ? "✓" : index + 1}</i>{label}</span>)}</div>
        <div className="dtButtons">
          <span className="dtMode"><button className={!expert ? "on" : ""} onClick={() => setMode("rookie")}>신입</button><button className={expert ? "on" : ""} onClick={() => setMode("expert")}>실무자</button></span>
          <button onClick={() => setHelp(true)}>❔ 방법</button>
          <button onClick={() => setReplay(true)}>▶ 리플레이</button>
          <button onClick={reset}>↺</button>
        </div>
      </header>

      {/* where in the vehicle are we? (mini E/E path) */}
      <div className="dtZones">{ZONES.map((zone, index) => <React.Fragment key={zone}>{index > 0 && <i>→</i>}<span className={zone === zoneNow ? "now" : chain.some(id => dom(id).zone === zone) ? "seen" : ""}>{zone}</span></React.Fragment>)}</div>

      {/* the fallen chain, cause → effect */}
      <section className="dtChain">
        <span className="dtChainHint">← 원인 쪽</span>
        {ordered.map((id, index) => {
          const tileState = phase === "trace" ? "fallen" : phase === "cascade" ? (index <= fallIdx ? "fallen" : "standing") : "fallen";
          return <React.Fragment key={id}>
            {index > 0 && <i className={`dtArrow ${phase !== "trace" && index <= fallIdx ? "lit" : ""}`} />}
            <div className={`dtChainItem ${id === current && phase === "trace" ? "current" : ""} ${id === data.first && phase !== "trace" ? "first" : ""} ${shake === id ? "shake" : ""}`}>
              {id === data.start && <em className="dtBadge">증상</em>}
              {id === data.first && phase !== "trace" && <em className="dtBadge red">첫 도미노</em>}
              <Tile dom={dom(id)} state={tileState} small={id !== current || phase !== "trace"} />
            </div>
          </React.Fragment>;
        })}
        <span className="dtChainHint">결과 쪽 →</span>
      </section>

      {phase === "trace" && <section className="dtQuestion">
        <h2>🤔 <b>{dom(current).label}</b>을(를) 넘어뜨린 건?</h2>
        <div className="dtCands">{candidates.map(id => {
          const d = dom(id); const open = checked.includes(id);
          const tileState = !open ? "hidden" : d.status === "bad" ? "fallen" : d.status === "tol" ? "wobble" : "standing";
          return <div key={id} className={`dtCand ${shake === id ? "shake" : ""}`}>
            <Tile dom={d} state={tileState} onClick={open ? undefined : () => investigate(id)} />
            {open && d.status === "bad" && <button className="dtFollow" onClick={() => follow(id)}>← 따라가기</button>}
            {open && d.status !== "bad" && <span className="dtClear">✓ 범인 아님</span>}
          </div>;
        })}</div>
        <div className="dtCall">
          {expert && <span className="dtBudget">조사 {"●".repeat(Math.max(0, left))}{"○".repeat(Math.min(budget, checked.length))}{left <= 0 && <button onClick={() => { send({ type: "HINT", key: `${caseId}:trace${extra + 1}` }); setExtra(value => value + 1); play("squish"); }}>+1 기회 · 추격 −5m</button>}</span>}
          <button className="dtFirst" onClick={callFirst}>🎯 {dom(current).label}이(가) 첫 도미노!</button>
        </div>
      </section>}

      {(phase === "zoom" || phase === "done") && <section className="dtZoom">
        <h2>🔍 {data.zoom.where} 안을 확대 — 기준 설계와 다른 곳은?</h2>
        <div className="dtFlowRow"><small>기준</small>{data.zoom.reference.map(([name, value], index) => <React.Fragment key={name}>{index > 0 && <i>→</i>}<span className="dtBlk ref"><b>{name}</b><em>{value}</em></span></React.Fragment>)}</div>
        <div className="dtFlowRow"><small>이번</small>{data.zoom.run.map(([name, value], index) => <React.Fragment key={name}>{index > 0 && <i>→</i>}<button className={`dtBlk ${zoomPick === name ? name === data.zoom.culprit ? "right" : "wrong" : ""}`} onClick={() => phase === "zoom" && pickZoom(name)}><b>{name}</b><em>{value}</em></button></React.Fragment>)}
          {data.zoom.part && <><i>→</i><button className={`dtBlk part ${zoomPick === data.zoom.part[0] ? "right" : ""}`} onClick={() => phase === "zoom" && pickZoom(data.zoom.part![0])}><b>🔧 {data.zoom.part[0]}</b><em>기준 {data.zoom.part[1]} · 지금 {data.zoom.part[2]}</em></button></>}
        </div>
        {phase === "done" && <div className="dtImpact">
          <h3>📋 함께 쓰러진 도미노 = 고친 뒤 다시 확인할 곳 (회귀 검증)</h3>
          <div>{effects.map(d => <span key={d.id}>{d.icon} {d.label}</span>)}</div>
          {expert && <b className="dtStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</b>}
          <button className="dtNext" onClick={finish}>벤치에서 고치고 검증하기 →</button>
        </div>}
      </section>}

      <div className="dtBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>밍</b>{bubble}</p></div>
    </main>

    {help && <div className="dtModal" onClick={() => setHelp(false)}><article onClick={event => event.stopPropagation()}>
      <h2>🕵️ 도미노 추리, 이렇게 해요</h2>
      <div className="dtHow">
        <div><span className="pic">🚗<i className="fall" /></span><b>1. 증상에서 시작</b><small>쓰러진 마지막 도미노</small></div>
        <div><span className="pic">❓❓</span><b>2. 앞 도미노 뒤집기</b><small>쓰러졌으면 따라가기</small></div>
        <div><span className="pic">🎯</span><b>3. 첫 도미노 지목</b><small>앞이 모두 서 있을 때</small></div>
      </div>
      <p className="dtHowNote">막대: <i className="dash" /> 기준 · <i className="fill" /> 이번 주행</p>
      <button onClick={() => setHelp(false)}>시작!</button>
    </article></div>}
    {replay && <div className="replayModal" onClick={() => setReplay(false)}><div onClick={event => event.stopPropagation()}><button onClick={() => setReplay(false)}>×</button><small>QUICK REPLAY</small><h2>고장 직전 주행 다시 보기</h2><ReplayRaceView caseId={caseId} /></div></div>}
  </div>;
}
