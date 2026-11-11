// Memo board v3 — "domino map" on an all-domain E/E blueprint.
// After building the normal reference (puzzle), the player compares it with this drive's log.
// Many signals differ (a fault cascades), so the task is impact analysis:
//   for every abnormal card decide: 🎯 start point · ➡ caused by another card · 🚫 ignore (tolerance / unrelated).
// Then zoom from the system level into the start point's controller and find the SW block (or the HW part).
// Effects found here become the bench's regression list.
import React, { useMemo, useState } from "react";
import type { Campaign, CaseId } from "../../game/runtime";
import { SCENARIOS } from "../../game/scenarios";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";
import { play } from "../../ui/sfx";
import { PursuitRouteBar, ReplayRaceView } from "../../experiences";

type Send = React.Dispatch<any>;
type Status = "ok" | "tol" | "bad";
type Role = "origin" | "effect" | "noise";
type SigNode = {
  id: string; label: string; x: number; y: number; ref: string; run: string; status: Status;
  t?: number; parent?: string; role?: Role; hidden?: boolean; expertOnly?: boolean; ev?: string;
};
type Assign = { kind: "origin" | "ignore" } | { kind: "parent"; parent: string };

// Shared blueprint: every domain's controllers on one CAN backbone (percent coordinates).
const ZONES = [
  { id: "hmi", label: "센서 · 운전자 입력", x: 1, y: 6, w: 15, h: 88 },
  { id: "vcu", label: "VCU", x: 18, y: 6, w: 18, h: 38, ecu: true },
  { id: "mcu", label: "MCU · 인버터", x: 38, y: 6, w: 18, h: 38, ecu: true },
  { id: "act", label: "부품 · 액추에이터", x: 58, y: 6, w: 18, h: 38 },
  { id: "bms", label: "BMS", x: 18, y: 56, w: 18, h: 38, ecu: true },
  { id: "tms", label: "Thermal ECU", x: 38, y: 56, w: 18, h: 38, ecu: true },
  { id: "brk", label: "Brake ECU", x: 58, y: 56, w: 18, h: 38, ecu: true },
  { id: "car", label: "차량 거동 · 부품", x: 78, y: 6, w: 21, h: 88 },
];

const CASES: Record<CaseId, { nodes: SigNode[]; zoom: Zoom }> = {
  propulsion: {
    nodes: [
      { id: "aps", label: "가속 페달 신호", x: 2.5, y: 14, ref: "60%", run: "60%", status: "ok" },
      { id: "vcu_in", label: "VCU 페달 처리값", x: 19.5, y: 12, ref: "60%", run: "27%", status: "bad", t: 10, role: "origin", ev: "pedal_processed" },
      { id: "can_cmd", label: "CAN 토크 명령", x: 19.5, y: 28, ref: "204 Nm", run: "92 Nm", status: "bad", t: 20, parent: "vcu_in", role: "effect", hidden: true, ev: "torque_cmd" },
      { id: "motor_tq", label: "모터 실제 토크", x: 39.5, y: 12, ref: "204 Nm", run: "91 Nm", status: "bad", t: 30, parent: "can_cmd", role: "effect", ev: "motor_actual" },
      { id: "batt_i", label: "배터리 방전 전류", x: 19.5, y: 62, ref: "180 A", run: "85 A", status: "bad", t: 40, parent: "motor_tq", role: "effect", hidden: true },
      { id: "motor_temp", label: "모터 온도", x: 39.5, y: 62, ref: "62°C", run: "60°C", status: "tol" },
      { id: "regen", label: "회생 제동량", x: 59.5, y: 62, ref: "22%", run: "22%", status: "ok" },
      { id: "accel", label: "차량 가속도", x: 80, y: 12, ref: "2.8 m/s²", run: "1.2 m/s²", status: "bad", t: 60, parent: "motor_tq", role: "effect", ev: "pedal_raw" },
      { id: "tire", label: "앞 타이어 공기압", x: 80, y: 62, ref: "2.4 bar", run: "2.1 bar", status: "bad", role: "noise", expertOnly: true },
    ],
    zoom: {
      where: "VCU", kind: "sw",
      reference: [["APS Signal Adapter", "60%"], ["Driver Torque Map", "204 Nm"], ["CAN Torque Command", "204 Nm"]],
      run: [["APS Signal Adapter", "60%"], ["Legacy Scale 45%", "27%"], ["Driver Torque Map", "92 Nm"], ["CAN Torque Command", "92 Nm"]],
      culprit: "Legacy Scale 45%",
      lesson: "기준(퍼즐로 만든 설계)에는 없는 블록이 이번 주행 SW에 끼어 있었어! 페달 신호를 45%로 줄여 버린 보정값 오류야.",
    },
  },
  thermal: {
    nodes: [
      { id: "coolant", label: "냉각수 온도", x: 2.5, y: 14, ref: "65°C", run: "78.4°C", status: "bad", t: 30, parent: "fan_rpm", role: "effect", ev: "motor_temp" },
      { id: "fan_cmd", label: "팬 PWM 명령", x: 39.5, y: 62, ref: "100%", run: "100%", status: "ok", ev: "fan_command" },
      { id: "derate", label: "출력 제한 단계", x: 39.5, y: 78, ref: "0", run: "1", status: "bad", t: 40, parent: "coolant", role: "effect", ev: "thermal_protection" },
      { id: "tq_limit", label: "모터 토크 한계", x: 19.5, y: 12, ref: "240 Nm", run: "150 Nm", status: "bad", t: 50, parent: "derate", role: "effect", hidden: true },
      { id: "accel", label: "차량 가속도", x: 80, y: 12, ref: "2.8 m/s²", run: "1.9 m/s²", status: "bad", t: 70, parent: "tq_limit", role: "effect" },
      { id: "fan_rpm", label: "팬 실제 회전", x: 80, y: 62, ref: "1850 rpm", run: "0 rpm", status: "bad", t: 10, role: "origin", ev: "fan_actual" },
      { id: "pump", label: "냉각수 펌프 유량", x: 80, y: 36, ref: "12 L/min", run: "11.8 L/min", status: "tol" },
      { id: "hvac", label: "실내 송풍 단계", x: 59.5, y: 12, ref: "3", run: "4", status: "bad", role: "noise", expertOnly: true },
    ],
    zoom: {
      where: "Thermal ECU", kind: "hw",
      reference: [["Temperature Filter", "78.4°C"], ["65°C Hysteresis", "팬 ON"], ["Fan PWM Command", "100%"]],
      run: [["Temperature Filter", "78.4°C"], ["65°C Hysteresis", "팬 ON"], ["Fan PWM Command", "100%"]],
      part: ["냉각 팬 모터", "1850 rpm", "0 rpm"],
      culprit: "냉각 팬 모터",
      lesson: "SW 블록은 기준과 똑같이 100% 명령을 냈어. 명령을 받은 팬(부품)이 돌지 않았으니 범인은 HW야!",
    },
  },
  brake: {
    nodes: [
      { id: "bpp", label: "브레이크 페달 신호", x: 2.5, y: 14, ref: "55%", run: "55%", status: "ok", ev: "brake_request" },
      { id: "wheel", label: "바퀴 속도 신호", x: 2.5, y: 62, ref: "정상 범위", run: "±1%", status: "tol" },
      { id: "regen", label: "회생 제동 명령", x: 59.5, y: 62, ref: "22%", run: "22%", status: "ok", ev: "regen_request" },
      { id: "p_cmd", label: "압력 명령", x: 59.5, y: 78, ref: "42 bar", run: "42 bar", status: "ok" },
      { id: "caliper", label: "캘리퍼 실제 압력", x: 80, y: 62, ref: "42 bar", run: "8 bar", status: "bad", t: 10, role: "origin", ev: "brake_actual" },
      { id: "decel", label: "차량 감속도", x: 80, y: 12, ref: "3.2 m/s²", run: "1.4 m/s²", status: "bad", t: 30, parent: "caliper", role: "effect" },
      { id: "stop", label: "정지 거리", x: 80, y: 36, ref: "32 m", run: "58 m", status: "bad", t: 60, parent: "decel", role: "effect", hidden: true },
    ],
    zoom: {
      where: "Brake ECU", kind: "hw",
      reference: [["Brake Force Request", "3.2 m/s²"], ["Regen/Friction Blend", "회생+마찰"], ["Pressure Command", "42 bar"]],
      run: [["Brake Force Request", "3.2 m/s²"], ["Regen/Friction Blend", "회생+마찰"], ["Pressure Command", "42 bar"]],
      part: ["캘리퍼·유압", "42 bar", "8 bar"],
      culprit: "캘리퍼·유압",
      lesson: "제동 SW는 기준대로 42 bar를 명령했어. 실제 압력이 8 bar밖에 안 나왔으니 유압·캘리퍼(HW) 쪽 문제야!",
    },
  },
};
type Zoom = { where: string; kind: "sw" | "hw"; reference: [string, string][]; run: [string, string][]; part?: [string, string, string]; culprit: string; lesson: string };

const MODE_KEY = "tb-board-mode";
const readMode = (): "rookie" | "expert" => { try { return localStorage.getItem(MODE_KEY) === "expert" ? "expert" : "rookie"; } catch { return "rookie"; } };

export function DominoBoard({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const scenario = SCENARIOS[caseId];
  const data = CASES[caseId];
  const [mode, setModeState] = useState(readMode);
  const expert = mode === "expert";
  const nodes = useMemo(() => data.nodes.filter(node => expert || !node.expertOnly), [data, expert]);
  const byId = (id: string) => nodes.find(node => node.id === id)!;
  const [revealed, setRevealed] = useState<string[]>([]);
  const [extra, setExtra] = useState(0);
  const [assign, setAssign] = useState<Record<string, Assign>>({});
  const [menu, setMenu] = useState<string | null>(null);
  const [pickingParentFor, setPickingParentFor] = useState<string | null>(null);
  const [bubble, setBubble] = useState("기준과 이번 주행이 다른 카드가 여러 개야! 빨간 카드를 하나씩 눌러서 시작점인지, 다른 이상 때문에 생긴 영향인지, 무시해도 되는지 정해 줘.");
  const [shake, setShake] = useState("");
  const [domino, setDomino] = useState(-1);
  const [zoomPick, setZoomPick] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [replay, setReplay] = useState(false);
  const budget = 2 + extra;
  const isHidden = (node: SigNode) => expert && node.hidden && !revealed.includes(node.id);
  const toJudge = nodes.filter(node => node.status !== "ok");
  const correctFor = (node: SigNode, a?: Assign) => !!a && (
    a.kind === "origin" ? node.role === "origin"
      : a.kind === "ignore" ? node.status === "tol" || node.role === "noise"
        : a.kind === "parent" && node.parent === a.parent);
  const solvedCount = toJudge.filter(node => correctFor(node, assign[node.id])).length;
  const mapDone = toJudge.length > 0 && solvedCount === toJudge.length;
  const zoomDone = zoomPick === data.zoom.culprit;
  const effects = nodes.filter(node => node.role === "effect");
  const origin = nodes.find(node => node.role === "origin")!;

  const setMode = (next: "rookie" | "expert") => { try { localStorage.setItem(MODE_KEY, next); } catch { /* ignore */ } setModeState(next); reset(); };
  const reset = () => { setRevealed([]); setExtra(0); setAssign({}); setMenu(null); setPickingParentFor(null); setDomino(-1); setZoomPick(null); setBubble("처음부터! 빨간 카드부터 하나씩 정해 보자."); play("squish"); };
  const wrong = (id: string, why: string) => { setBubble(why); setShake(id); play("error"); window.setTimeout(() => setShake(""), 400); };
  const accept = (id: string, value: Assign, why: string) => {
    const next = { ...assign, [id]: value };
    setAssign(next); setMenu(null); setPickingParentFor(null); setBubble(why);
    play(value.kind === "parent" ? "zip" : "stamp");
    const done = toJudge.every(node => correctFor(node, next[node.id]));
    if (done) runDomino();
  };
  const runDomino = () => {
    const order = [...toJudge].filter(node => node.t !== undefined).sort((a, b) => a.t! - b.t!);
    order.forEach((_, index) => window.setTimeout(() => { setDomino(index); play("pop", 1 + index * .12); }, 500 + index * 420));
    window.setTimeout(() => { setBubble(`도미노 완성! 시작점 '${origin.label}'에서 퍼졌어. 이제 ${data.zoom.where} 안으로 확대해서 진짜 범인을 찾자.`); play("success"); }, 700 + order.length * 420);
  };
  const clickNode = (node: SigNode) => {
    if (isHidden(node)) {
      if (revealed.length >= budget) { setBubble("측정 기회를 다 썼어. 오른쪽 '+1 기회'를 쓰면 추격차가 5m 가까워져."); play("error"); return; }
      setRevealed(previous => [...previous, node.id]); play("zip"); setBubble(`${node.label}을(를) 측정했어: 기준 ${node.ref} → 이번 ${node.run}`); return;
    }
    if (pickingParentFor) {
      const child = byId(pickingParentFor);
      if (node.id === child.id) return;
      if (child.parent === node.id) { accept(child.id, { kind: "parent", parent: node.id }, `맞아! '${node.label}' 이상 때문에 '${child.label}'도 이상해졌어.`); return; }
      const isDescendant = (from: string, target: string): boolean => nodes.some(item => item.parent === from && (item.id === target || isDescendant(item.id, target)));
      if (isDescendant(child.id, node.id)) return wrong(node.id, "그건 오히려 결과야! 화살표는 원인 → 결과 방향이야.");
      if (node.status === "ok") return wrong(node.id, "그 카드는 기준과 같아(정상). 정상인 값이 이상을 만들 순 없어.");
      return wrong(node.id, "그 둘은 직접 이어져 있지 않아. 신호가 흐르는 길(설계도의 선)을 따라가 봐.");
    }
    if (node.status === "ok") { setBubble(`${node.label}: 기준 ${node.ref}, 이번 ${node.run}. 정상이야 ✓`); play("pop"); return; }
    if (correctFor(node, assign[node.id])) return;
    setMenu(menu === node.id ? null : node.id); play("pop");
  };
  const chooseOrigin = (node: SigNode) => node.role === "origin"
    ? accept(node.id, { kind: "origin" }, `맞아! '${node.label}'이(가) 가장 먼저 이상해진 시작점이야.`)
    : wrong(node.id, node.role === "noise" ? "이건 이번 고장과 관계없는 이상이야. 신호 길로 이어지지 않아." : "이것보다 먼저(앞쪽에서) 이상해진 카드가 있어. 시간 순서와 신호 방향을 봐!");
  const chooseIgnore = (node: SigNode) => (node.status === "tol" || node.role === "noise")
    ? accept(node.id, { kind: "ignore" }, node.status === "tol" ? "좋아, 허용 범위 안의 작은 차이라 무시해도 돼." : "좋아, 이번 고장과 이어지지 않는 엉뚱한 단서야. 따로 기록만 해 두자.")
    : wrong(node.id, "이건 기준과 크게 달라. 무시하면 안 돼! 시작점인지, 다른 이상의 영향인지 정해 줘.");
  const finish = () => {
    try { sessionStorage.setItem(`tb-impact-${caseId}`, JSON.stringify(effects.map(node => `${node.label} 정상 복귀(기준 ${node.ref})`))); } catch { /* ignore */ }
    const evidence = nodes.filter(node => node.ev).map(node => node.ev!);
    evidence.filter(id => !state.evidence[caseId].includes(id)).forEach(id => send({ type: "RECORD_EVIDENCE", id }));
    if (state.hypothesis[caseId] !== scenario.root) send({ type: "SELECT_HYPOTHESIS", id: scenario.root });
    send({ type: "OPEN_BENCH" });
  };

  const center = (node: SigNode) => ({ x: node.x + 7, y: node.y + 6 });
  const arrows = nodes.flatMap(node => { const a = assign[node.id]; return a && a.kind === "parent" && correctFor(node, a) ? [{ from: center(byId(a.parent)), to: center(node), id: node.id }] : []; });
  const dominoOrder = [...toJudge].filter(node => node.t !== undefined).sort((a, b) => a.t! - b.t!).map(node => node.id);
  const step = zoomDone ? 3 : mapDone ? 2 : solvedCount > 0 ? 1 : 0;

  return <div className="dominoBoard">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="INCIDENT INVESTIGATION" title="도미노 메모판" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <main className="dbLayout">
      <header className="dbHead">
        <div><small>기준(정상 설계) vs 이번 주행 · 시스템 → 제어기 → SW로 좁혀 가기</small><h1>{scenario.title}</h1></div>
        <div className="dbButtons">
          <span className="dbMode"><button className={!expert ? "on" : ""} onClick={() => setMode("rookie")}>신입</button><button className={expert ? "on" : ""} onClick={() => setMode("expert")}>실무자</button></span>
          <button onClick={() => setRulesOpen(true)}>규칙</button>
          <button onClick={() => setReplay(true)}>▶ 리플레이</button>
          <button onClick={reset}>↺ 초기화</button>
        </div>
      </header>

      <section className={`dbMap ${pickingParentFor ? "picking" : ""}`}>
        {ZONES.map(zone => <div key={zone.id} className={`dbZone ${zone.ecu ? "ecu" : ""}`} style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}><span>{zone.label}</span></div>)}
        <div className="dbBus"><span>CAN</span></div>
        <div className="dbGateway">게이트웨이</div>
        <svg className="dbArrows" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs><marker id="dbArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#c0392b" /></marker></defs>
          {arrows.map(arrow => <path key={arrow.id} d={`M${arrow.from.x} ${arrow.from.y} Q${(arrow.from.x + arrow.to.x) / 2} ${Math.min(arrow.from.y, arrow.to.y) - 8} ${arrow.to.x} ${arrow.to.y}`} className="dbArrow" markerEnd="url(#dbArrow)" />)}
        </svg>
        {nodes.map(node => {
          const hidden = isHidden(node);
          const a = assign[node.id];
          const solved = correctFor(node, a);
          const tag = !solved ? "" : a!.kind === "origin" ? "🎯 시작점" : a!.kind === "ignore" ? "🚫 무시" : "➡ 영향";
          const fallen = domino >= 0 && dominoOrder.indexOf(node.id) >= 0 && dominoOrder.indexOf(node.id) <= domino;
          return <div key={node.id} className={`dbCard s-${hidden ? "hidden" : node.status} ${solved ? "solved" : ""} ${shake === node.id ? "shake" : ""} ${fallen ? "fallen" : ""} ${pickingParentFor === node.id ? "child" : ""}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={() => clickNode(node)}>
            <b>{node.label}</b>
            {hidden ? <em className="dbQ">? 측정하기</em> : <div className="dbVals"><span>기준 {node.ref}</span><strong>{node.run}</strong></div>}
            {!expert && !hidden && node.t !== undefined && <i className="dbTime">+{node.t}ms</i>}
            {tag && <i className="dbTag">{tag}</i>}
            {menu === node.id && <div className="dbMenu" onClick={event => event.stopPropagation()}>
              <button onClick={() => chooseOrigin(node)}>🎯 여기가 시작점</button>
              <button onClick={() => { setMenu(null); setPickingParentFor(node.id); setBubble(`'${node.label}'을(를) 만든 원인 카드를 눌러 줘.`); play("pop"); }}>➡ 원인 카드 고르기</button>
              <button onClick={() => chooseIgnore(node)}>🚫 무시(허용 범위·무관)</button>
            </div>}
          </div>;
        })}
      </section>

      <aside className="dbSide">
        <div className="dbBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>밍</b>{bubble}</p></div>
        <div className="dbProgress"><b>{solvedCount}/{toJudge.length}</b> 카드 정리</div>
        {expert && <div className="dbBudget">측정 기회 {"●".repeat(Math.max(0, budget - revealed.length))}{"○".repeat(Math.min(budget, revealed.length))}
          <button onClick={() => { send({ type: "HINT", key: `${caseId}:domino${extra + 1}` }); setExtra(value => value + 1); play("squish"); }}>+1 기회 · 추격 −5m</button></div>}
        <ul className="dbLegend"><li><i className="g" />기준과 같음</li><li><i className="y" />허용 범위 차이</li><li><i className="r" />기준과 다름</li>{expert && <li><i className="h" />측정 전</li>}</ul>
        {mapDone && <div className="dbZoom">
          <h3>🔍 {data.zoom.where} 안으로 확대</h3>
          <div className="dbRows">
            <div><small>기준 (내가 만든 정상 설계)</small><p>{data.zoom.reference.map(([name, value]) => <span key={name} className="blk"><b>{name}</b><em>{value}</em></span>)}</p></div>
            <div><small>이번 주행</small><p>{data.zoom.run.map(([name, value]) => <button key={name} className={`blk ${zoomPick === name ? (name === data.zoom.culprit ? "right" : "wrong") : ""}`} onClick={() => { setZoomPick(name); if (name === data.zoom.culprit) { setBubble(data.zoom.lesson); play("stamp"); play("success"); } else { setBubble(data.zoom.kind === "hw" ? "이 SW 블록은 기준과 똑같아. 값이 다른 곳을 찾아봐!" : "이 블록은 기준에도 똑같이 있어. 기준에 없는 블록을 찾아봐!"); play("error"); } }}><b>{name}</b><em>{value}</em></button>)}
              {data.zoom.part && <button className={`blk part ${zoomPick === data.zoom.part[0] ? "right" : ""}`} onClick={() => { setZoomPick(data.zoom.part![0]); setBubble(data.zoom.lesson); play("stamp"); play("success"); }}><b>🔧 {data.zoom.part[0]}</b><em>기대 {data.zoom.part[1]} · 실제 {data.zoom.part[2]}</em></button>}</p></div>
          </div>
        </div>}
        {zoomDone && <div className="dbImpact"><h3>📋 영향 범위 → 벤치 회귀 검증 목록</h3><ul>{effects.map(node => <li key={node.id}>{node.label}</li>)}</ul></div>}
      </aside>

      <footer className="dbFoot">
        <div className="boardStepper">{["이상 카드 정리", "원인 화살표 잇기", "ECU 내부 SW 로직 확대", "범인 확정"].map((label, index) => <span key={label} className={index < step ? "done" : index === step ? "now" : ""}><i>{index < step ? "✓" : index + 1}</i>{label}</span>)}</div>
        <button className="dbNext" disabled={!zoomDone} onClick={finish}>{zoomDone ? "벤치에서 고치고 검증하기 →" : `정리 ${solvedCount}/${toJudge.length}`}</button>
      </footer>
    </main>

    {rulesOpen && <div className="sbModal" onClick={() => setRulesOpen(false)}><article onClick={event => event.stopPropagation()}>
      <h2>🕵️ 도미노 메모판 규칙</h2>
      <ol>
        <li>방금 만든 <b>정상 기준</b>과 <b>이번 주행 기록</b>을 설계도 위에 나란히 놓았어요. 빨간 카드는 기준과 다른 곳이에요.</li>
        <li>고장은 <b>도미노처럼 번져요</b>. 빨간 카드마다 <b>🎯 시작점</b> / <b>➡ 다른 이상 때문에 생긴 영향</b> / <b>🚫 무시</b>(허용 범위·무관) 중 하나로 정해요.</li>
        <li>영향이라면 그 원인 카드를 눌러 <b>화살표</b>를 이어요. 신호는 설계도의 길(센서 → 제어기 → CAN → 부품 → 차량)을 따라 흘러요.</li>
        <li>다 정리하면 도미노가 넘어가고, 시작점이 있는 <b>ECU 내부 로직으로 확대</b>해 기준 설계와 다른 곳(SW 블록 또는 부품)을 찾아요.</li>
        <li>영향 카드들은 벤치의 <b>회귀 검증 목록</b>이 돼요. <b>실무자</b> 모드는 엉뚱한 단서·측정 전 카드가 섞이고 시간 순서가 숨겨져요.</li>
      </ol>
      <button onClick={() => setRulesOpen(false)}>알겠어!</button>
    </article></div>}
    {replay && <div className="replayModal" onClick={() => setReplay(false)}><div onClick={event => event.stopPropagation()}><button onClick={() => setReplay(false)}>×</button><small>QUICK REPLAY</small><h2>고장 직전 주행 다시 보기</h2><ReplayRaceView caseId={caseId} /></div></div>}
  </div>;
}
