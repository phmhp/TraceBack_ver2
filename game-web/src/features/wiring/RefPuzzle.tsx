// "정상 기준 만들기" v2 — the reference is assembled from the SAME Control SW blocks the player
// saw in the garage (same picto, same tag, same plain words), so the moment reads "아, 차고에서 본 거!".
// - Any piece fits any gap (shape = signal type of the board, never a hint about which piece goes where).
// - Placing a piece draws nothing and shows no value. The player checks the build by pressing ▶ 실행:
//   values flow left → right and stop at the first slot that breaks the requirement (first mismatch).
// - Parallel logic: a side input (limit / other sensors) climbs into the merge block.
// - 📒 차고 노트 = open book: re-open the garage Control SW drawing (costs a hint).
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Campaign, CaseId } from "../../game/runtime";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";
import { play } from "../../ui/sfx";
import { KIND_TAG, Picto, SimulinkDiagram, blockKind, plainText, type Kind } from "../garage/SimulinkDiagram";
import { getFeatureLayer, piecePath, type DomainId, type Nub } from "../../experiences";

type Send = React.Dispatch<any>;
type Blk = { id: string; label: string; kind: Kind | "hw"; img?: string; tag?: string; out?: string; bad?: string; why?: string; from: string; does?: string };
type Ref = {
  domain: string; feature: string; ecu: string; program: string;
  board: string[]; gaps: number[]; spares: string[]; joints: Nub[];
  side: { pieces: string[]; into: number; value: string };
  req: { text: string; slot: number }[];
  blocks: Record<string, Blk>;
  notes: { domain: DomainId; feature: number; name: string }[];
};

const T = "/assets/ending-thumbs/", P = "/assets/board-photos/";
const REF: Record<CaseId, Ref> = {
  propulsion: {
    domain: "구동", feature: "페달 → 토크 요청", ecu: "VCU", program: "nominal",
    board: ["aps", "corr", "filter", "map", "permit", "min", "ramp", "out", "inv"], gaps: [3, 4, 5],
    spares: ["map", "mapB", "permit", "est", "min"], joints: ["round", "round", "round", "square", "square", "square", "square", "zigzag"],
    side: { pieces: ["bms"], into: 5, value: "한계 260 Nm" },
    req: [
      { text: "운전자가 가속 페달을 60% 밟는다 (센서 A·B)", slot: 0 },
      { text: "두 센서 값이 서로 같은지 먼저 확인한다", slot: 1 },
      { text: "잠깐 튀는 값은 걸러 낸다", slot: 2 },
      { text: "페달 60%는 토크 204 Nm가 된다", slot: 3 },
      { text: "D단 · READY일 때만 토크를 통과시킨다", slot: 4 },
      { text: "배터리·온도 한계를 넘으면 한계값을 쓴다", slot: 5 },
      { text: "토크는 갑자기 말고 천천히 올린다", slot: 6 },
      { text: "인버터로 보내 모터가 204 Nm를 낸다", slot: 8 },
    ],
    blocks: {
      aps: { id: "aps", label: "APS A/B 가속 페달", kind: "hw", img: `${T}accel_pedal.png`, out: "A 60% · B 60%", from: "구동 · 운전자 토크 요청" },
      corr: { id: "corr", label: "A/B 상관성", kind: "check", out: "60% ✓", from: "구동 · 운전자 토크 요청" },
      filter: { id: "filter", label: "입력 필터", kind: "delay", out: "60%", from: "구동 · 운전자 토크 요청" },
      map: { id: "map", label: "페달 맵", tag: "표 A", kind: "lut", out: "204 Nm", from: "구동 · 운전자 토크 요청" },
      mapB: { id: "mapB", label: "페달 맵", tag: "표 B", kind: "lut", bad: "92 Nm", from: "구동 · 운전자 토크 요청",
        why: "실행해 보니 92 Nm! 요구사항은 '60% → 204 Nm'이에요. 같은 '페달 맵'이라도 안에 든 표 값이 달라요." },
      permit: { id: "permit", label: "구동 허용", kind: "switch", out: "204 Nm · D", from: "구동 · 운전자 토크 요청" },
      min: { id: "min", label: "가용 토크 MIN", kind: "min", out: "204 Nm", from: "구동 · 운전자 토크 요청" },
      est: { id: "est", label: "토크 추정", kind: "calc", from: "구동 · 모터 토크 만들기 (인버터)",
        why: "'토크 추정'은 인버터 안에서 모터가 실제로 낸 토크를 짐작하는 블록이에요. VCU의 토크 요청 경로에는 없어요." },
      ramp: { id: "ramp", label: "램프율", kind: "delay", out: "204 Nm ↗", from: "구동 · 운전자 토크 요청" },
      out: { id: "out", label: "토크 출력", kind: "calc", out: "CAN 204 Nm", from: "구동 · 운전자 토크 요청" },
      inv: { id: "inv", label: "인버터 · 전륜 모터", kind: "hw", img: `${T}traction_motor.png`, out: "모터 204 Nm", from: "구동 · 운전자 토크 요청" },
      bms: { id: "bms", label: "BMS · 온도 한계", kind: "hw", img: `${T}bms.png`, out: "한계 260 Nm", from: "배터리 · 출력 한계 계산" },
    },
    notes: [{ domain: "drive", feature: 0, name: "구동 · 운전자 토크 요청" }],
  },
  thermal: {
    domain: "열관리", feature: "출력 제한(보호) 판단", ecu: "Thermal ECU → VCU", program: "thermal_closed_loop",
    board: ["coolant", "range", "filter", "max", "stage", "ramp", "vcu"], gaps: [2, 3, 4],
    spares: ["max", "pi", "stage", "filter", "stageB"], joints: ["tri", "tri", "tri", "tri", "square", "square"],
    side: { pieces: ["motorT"], into: 3, value: "모터 96°C · 배터리 41°C" },
    req: [
      { text: "냉각수 온도를 잰다 (78°C)", slot: 0 },
      { text: "센서 값이 말이 되는 범위인지 확인한다", slot: 1 },
      { text: "잠깐 튀는 값은 걸러 낸다", slot: 2 },
      { text: "여러 부품 온도 중 가장 뜨거운 값으로 판단한다", slot: 3 },
      { text: "90°C를 넘으면 출력을 60%로 제한한다", slot: 4 },
      { text: "힘은 갑자기 말고 천천히 줄인다", slot: 5 },
      { text: "VCU가 토크 상한을 지키고 파워다운 표시등을 켠다", slot: 6 },
    ],
    blocks: {
      coolant: { id: "coolant", label: "냉각수 온도 센서", kind: "hw", img: `${T}motor_temp_sensor.png`, out: "78°C", from: "열관리 · 온도 상태 만들기" },
      range: { id: "range", label: "범위 검사", kind: "check", out: "78°C ✓", from: "열관리 · 온도 상태 만들기" },
      filter: { id: "filter", label: "필터", kind: "delay", out: "78°C", from: "열관리 · 온도 상태 만들기" },
      max: { id: "max", label: "최대값 선택", kind: "min", out: "96°C (모터)", from: "열관리 · 온도 상태 만들기" },
      stage: { id: "stage", label: "단계 임계", tag: "표 A", kind: "switch", out: "출력 60%", from: "열관리 · 출력 제한(보호)" },
      stageB: { id: "stageB", label: "단계 임계", tag: "표 B", kind: "switch", bad: "출력 20%", from: "열관리 · 출력 제한(보호)",
        why: "실행해 보니 출력 20%! 요구사항은 '90°C 넘으면 60%'예요. 같은 '단계 임계'라도 표 값이 달라요." },
      pi: { id: "pi", label: "PI 제어", kind: "pi", from: "열관리 · 펌프·팬 제어 (냉각)",
        why: "'PI 제어'는 펌프·팬을 목표 온도에 맞추는 냉각 기능 블록이에요. 출력을 줄일지 판단하는 경로에는 없어요." },
      ramp: { id: "ramp", label: "램프 제한", kind: "delay", out: "100% → 60% ↘", from: "열관리 · 출력 제한(보호)" },
      vcu: { id: "vcu", label: "VCU 토크 상한", kind: "hw", img: `${T}vcu.png`, out: "상한 60% · 파워다운 표시등", from: "열관리 · 출력 제한(보호)" },
      motorT: { id: "motorT", label: "모터·배터리 온도", kind: "hw", img: `${P}motor_temp.png`, out: "모터 96°C · 배터리 41°C", from: "열관리 · 온도 상태 만들기" },
    },
    notes: [{ domain: "thermal", feature: 0, name: "열관리 · 온도 상태 만들기" }, { domain: "thermal", feature: 3, name: "열관리 · 출력 제한(보호)" }],
  },
  brake: {
    domain: "제동", feature: "회생 + 마찰 협조 제동", ecu: "Brake ECU", program: "blended_brake",
    board: ["pedal", "recv", "rmin", "rest", "press", "caliper"], gaps: [2, 3, 4],
    spares: ["press", "slip", "rmin", "pressB", "rest"], joints: ["round", "square", "square", "square", "tri"],
    side: { pieces: ["bms", "avail"], into: 2, value: "회생 가능 1.1 m/s²" },
    req: [
      { text: "운전자가 브레이크를 55% 밟는다", slot: 0 },
      { text: "목표 감속 3.2 m/s²를 받는다", slot: 1 },
      { text: "회생은 배터리가 받을 수 있는 만큼만 쓴다", slot: 2 },
      { text: "모자란 만큼은 마찰 제동이 채운다", slot: 3 },
      { text: "마찰 몫 2.1 m/s²는 압력 42 bar가 된다", slot: 4 },
      { text: "캘리퍼가 바퀴를 잡아 합계 3.2 m/s²", slot: 5 },
    ],
    blocks: {
      pedal: { id: "pedal", label: "브레이크 페달 센서", kind: "hw", img: `${T}brake_pedal.png`, out: "55%", from: "제동 · 페달 → 감속 요구" },
      recv: { id: "recv", label: "요구 수신", kind: "calc", out: "3.2 m/s²", from: "제동 · 회생·마찰 협조" },
      rmin: { id: "rmin", label: "회생 MIN", kind: "min", out: "회생 1.1", from: "제동 · 회생·마찰 협조" },
      rest: { id: "rest", label: "잔여력 계산", kind: "calc", out: "마찰 2.1", from: "제동 · 회생·마찰 협조" },
      press: { id: "press", label: "마찰 압력", tag: "표 A", kind: "lut", out: "42 bar", from: "제동 · 회생·마찰 협조" },
      pressB: { id: "pressB", label: "마찰 압력", tag: "표 B", kind: "lut", bad: "8 bar", from: "제동 · 회생·마찰 협조",
        why: "실행해 보니 8 bar! 요구사항은 '2.1 m/s² → 42 bar'예요. 같은 '마찰 압력'이라도 표 값이 달라요." },
      slip: { id: "slip", label: "슬립 임계", kind: "switch", from: "제동 · ABS 잠김 방지",
        why: "'슬립 임계'는 바퀴가 잠기려 할 때만 끼어드는 ABS 블록이에요. 평소 협조 제동 경로에는 없어요." },
      caliper: { id: "caliper", label: "캘리퍼 · 바퀴", kind: "hw", img: `${T}brake_caliper.png`, out: "감속 3.2 m/s² ✓", from: "제동 · 회생·마찰 협조" },
      bms: { id: "bms", label: "BMS 배터리 수용량", kind: "hw", img: `${T}bms.png`, out: "충전 여유 적음", from: "제동 · 회생·마찰 협조" },
      avail: { id: "avail", label: "회생 가용량", kind: "lut", out: "회생 가능 1.1 m/s²", from: "제동 · 회생·마찰 협조" },
    },
    notes: [{ domain: "brake", feature: 1, name: "제동 · 회생·마찰 협조" }],
  },
};

// SW blocks take the garage's own picto/tag rule, so the piece looks exactly like the garage block
Object.values(REF).forEach(ref => Object.values(ref.blocks).forEach(b => { if (b.kind !== "hw") b.kind = blockKind(b.label); }));

const PITCH = 116, PIECE = 140, MAIN_Y = 64, SIDE_Y = 250, SPARE_Y = 446, PAD = 24;
const doesOf = (b: Blk) => b.does ?? (b.kind === "hw" ? "실제 부품" : plainText(b.label, b.kind));
const eunNeun = (word: string) => { const c = word.charCodeAt(word.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? "은" : "는"; };

function PieceFace({ b }: { b: Blk }) {
  return <>
    {b.kind === "hw"
      ? <div className="rpPic hw"><img src={b.img} alt="" draggable={false} /><small>부품</small></div>
      : <div className={`rpPic sw kind-${b.kind}`}><div className="flowBlock"><Picto kind={b.kind} /><small>{KIND_TAG[b.kind]}</small></div></div>}
    {b.tag && <em className="rpTag">{b.tag}</em>}
    <b className="rpLabel">{b.label}</b>
  </>;
}

export function RefPuzzle({ state, send }: { state: Campaign; send: Send }) {
  const ref = REF[state.caseId];
  const n = ref.board.length;
  const boardW = PAD * 2 + (n - 1) * PITCH + PIECE, spareGap = 156;
  const W = Math.max(boardW, ref.spares.length * spareGap + PAD * 2 + 10), H = SPARE_Y + 170;
  const ox = (W - boardW) / 2; // centre a short board above a wide spare tray
  const slotX = (i: number) => ox + PAD + i * PITCH;
  const sideStart = ref.side.into - (ref.side.pieces.length - 1);
  const spareHome = (id: string) => { const k = ref.spares.indexOf(id), gap = spareGap, w = ref.spares.length * gap - (gap - PIECE); return { x: (W - w) / 2 + k * gap, y: SPARE_Y + 14 }; };
  const [place, setPlace] = useState<Record<number, string | null>>(() => Object.fromEntries(ref.gaps.map(g => [g, null])));
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; dx: number; dy: number; moved: boolean } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [run, setRun] = useState<{ step: number; status: "running" | "fail" | "pass"; failAt?: number } | null>(null);
  const [fails, setFails] = useState(0);
  const [msg, setMsg] = useState("왼쪽 요구사항을 읽고 빈칸 3곳에 조각을 끼운 다음 ▶ 실행해 봐. 다 차고에서 본 블록이야!");
  const [zoom, setZoom] = useState<Blk | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [scale, setScale] = useState(.8);
  const stage = useRef<HTMLDivElement>(null);
  const noteKey = `${state.caseId}:garageNote`;
  const noteUsed = Boolean(state.hintClaims[noteKey]);

  useLayoutEffect(() => {
    const fit = () => { const r = stage.current?.getBoundingClientRect(); if (r && r.width) setScale(Math.min(r.width / W, r.height / H, 1.1)); };
    fit();
    const ob = new ResizeObserver(fit); if (stage.current) ob.observe(stage.current);
    return () => ob.disconnect();
  }, [W, H]);

  const inSlot = (id: string) => { const g = ref.gaps.find(k => place[k] === id); return g === undefined ? null : g; };
  const pieceAt = (slot: number) => ref.gaps.includes(slot) ? place[slot] : ref.board[slot];
  const filled = ref.gaps.every(g => place[g]);
  const world = (cx: number, cy: number) => { const r = stage.current!.querySelector(".rpWorld")!.getBoundingClientRect(); return { x: (cx - r.left) / scale, y: (cy - r.top) / scale }; };

  const putIn = (id: string, slot: number | null) => {
    setPlace(prev => {
      const next = { ...prev };
      ref.gaps.forEach(g => { if (next[g] === id) next[g] = null; });
      if (slot !== null) next[slot] = id; // a piece already there goes back to the spare tray
      return next;
    });
    setRun(null);
  };
  const nearestGap = (x: number, y: number) => {
    let best: number | null = null, dist = 90;
    ref.gaps.forEach(g => { const d = Math.hypot(x - slotX(g), y - MAIN_Y); if (d < dist) { dist = d; best = g; } });
    return best;
  };
  const onDown = (event: React.PointerEvent, id: string) => {
    if (event.button !== 0 || run?.status === "running") return;
    const p = world(event.clientX, event.clientY);
    const slot = inSlot(id); const home = slot !== null ? { x: slotX(slot), y: MAIN_Y } : spareHome(id);
    setDrag({ id, x: home.x, y: home.y, dx: p.x - home.x, dy: p.y - home.y, moved: false });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onMove = (event: React.PointerEvent) => {
    if (!drag) return;
    const p = world(event.clientX, event.clientY);
    const x = p.x - drag.dx, y = p.y - drag.dy;
    setDrag({ ...drag, x, y, moved: drag.moved || Math.hypot(x - drag.x, y - drag.y) > 4 });
  };
  const onUp = () => {
    if (!drag) return;
    if (!drag.moved) { // a click: pick up / put down
      const slot = inSlot(drag.id);
      if (slot !== null) { putIn(drag.id, null); play("pop"); }
      else { setPicked(picked === drag.id ? null : drag.id); play("pop"); }
    } else {
      const g = nearestGap(drag.x, drag.y);
      putIn(drag.id, g); play(g !== null ? "squish" : "pop"); setPicked(null);
    }
    setDrag(null);
  };
  const clickGap = (g: number) => { if (picked) { putIn(picked, g); setPicked(null); play("squish"); } };

  // ▶ run: values travel slot by slot and stop at the first mismatch
  const start = () => {
    if (!filled || run?.status === "running") return;
    setRun({ step: 0, status: "running" }); play("zip");
    setMsg("신호가 흘러가는 중… 값이 요구사항과 맞는지 지켜봐!");
  };
  useEffect(() => {
    if (!run || run.status !== "running") return;
    const timer = window.setTimeout(() => {
      const slot = run.step;
      const id = pieceAt(slot)!;
      const ok = id === ref.board[slot];
      if (!ok) {
        const b = ref.blocks[id], want = ref.req.find(r => r.slot === slot);
        setRun({ step: slot, status: "fail", failAt: slot }); setFails(f => f + 1); play("error");
        const trapHere = Boolean(b.bad) && ref.blocks[ref.board[slot]].label === b.label;
        setMsg(b.why && (trapHere || !b.bad && !ref.board.includes(id)) ? b.why : `${slot + 1}번 칸 요구사항은 "${want?.text ?? "다음 단계"}"인데, '${b.label}'${eunNeun(b.label)} "${doesOf(b)}" 블록이라 값이 맞지 않아요.`);
        return;
      }
      if (slot === n - 1) { setRun({ step: slot, status: "pass" }); play("success"); setMsg(`✓ 모든 요구사항 통과! 이게 이번 사건의 '정상 기준'이야. 메모판에서 실제 주행 값과 비교해 보자.`); return; }
      play("pop", 1 + slot * .06);
      setRun({ step: slot + 1, status: "running" });
    }, run.step === 0 ? 350 : 520);
    return () => clearTimeout(timer);
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  const solve = () => { setPlace(Object.fromEntries(ref.gaps.map(g => [g, ref.board[g]]))); setRun(null); setMsg("정답 배치 완료. ▶ 실행으로 확인해 봐."); };
  const reset = () => { setPlace(Object.fromEntries(ref.gaps.map(g => [g, null]))); setRun(null); setPicked(null); setMsg("처음부터! 요구사항을 하나씩 읽어 봐."); play("squish"); };
  const openNote = () => { if (!noteUsed) send({ type: "HINT", key: noteKey }); setNoteOpen(true); play("pop"); };
  const stars = fails === 0 ? 3 : fails === 1 ? 2 : 1;
  const reached = (slot: number) => run && (run.step > slot || (run.step === slot && run.status === "pass"));
  const valueAt = (slot: number) => {
    const id = pieceAt(slot); if (!id) return null;
    if (run?.failAt === slot) { const b = ref.blocks[id]; const trapHere = b.bad && ref.blocks[ref.board[slot]].label === b.label; return { text: trapHere ? b.bad! : "✗ ?", bad: true }; }
    if (!reached(slot)) return null;
    return { text: ref.blocks[ref.board[slot]].out ?? "", bad: false };
  };
  const sideLit = Boolean(run && run.step >= ref.side.into);
  const jointsIo = (slot: number) => ({ in: slot > 0 ? ref.joints[slot - 1] : undefined, out: slot < n - 1 ? ref.joints[slot] : undefined });

  const piece = (b: Blk, x: number, y: number, opts: { io?: { in?: Nub; out?: Nub }; locked?: boolean; cls?: string }) =>
    <div key={`${opts.locked ? "fixed" : "move"}-${b.id}`} className={`rpPiece ${b.kind === "hw" ? "hw" : "sw"} ${opts.locked ? "locked" : ""} ${opts.cls ?? ""}`}
      style={{ left: x, top: y, ...({ "--piece": opts.io ? piecePath(opts.io) : "inset(6px 12px 6px 12px round 12px)" } as React.CSSProperties) }}
      title={`${b.label} · ${doesOf(b)}`}
      onDoubleClick={event => { event.stopPropagation(); setZoom(b); }}
      onPointerDown={opts.locked ? undefined : event => onDown(event, b.id)}>
      <PieceFace b={b} />
    </div>;

  const requirementDone = (slot: number) => Boolean(reached(slot));
  return <div className="refPuzzle">
    <SceneBackdrop image="/assets/stitch23/prologue-plan.png" position="center" shade="soft" />
    <GameHeader chapter="BUILD THE REFERENCE" title="정상 기준 만들기" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <header className="rpHead">
      <div><small>CONTROL SW · {ref.ecu} 안쪽</small><h1>{ref.domain} · {ref.feature}</h1><p>차고 <b>Control Software</b> 화면에서 본 블록으로 <b>정상일 때의 동작</b>을 다시 조립해요.</p></div>
      <div className="rpTools">
        <button onClick={openNote}>📒 차고 노트 다시 보기{noteUsed ? "" : " · -5m"}</button>
        <button onClick={reset}>↺ 초기화</button>
      </div>
    </header>
    <main className="rpMain">
      <aside className="rpReq">
        <small>요구사항 · 정상이면 이렇게</small>
        {ref.req.map((r, k) => { const bad = run?.failAt === r.slot; const done = !bad && requirementDone(r.slot); return <div key={r.text} className={`${done ? "done" : ""} ${bad ? "bad" : ""} ${ref.gaps.includes(r.slot) ? "gap" : ""}`}>
          <i>{done ? "✓" : bad ? "✗" : r.slot + 1}</i><span>{r.text}</span>
        </div>; })}
      </aside>
      <section className="rpStage" ref={stage} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
        <div className="rpWorld" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          <div className="rpTray main" style={{ left: slotX(0) - 14, top: MAIN_Y - 40, width: (n - 1) * PITCH + PIECE + 28, height: PIECE + 56 }}><span>정상 기준 퍼즐판 · 왼쪽 → 오른쪽으로 값이 흘러요</span></div>
          <div className="rpTray side" style={{ left: slotX(sideStart) - 10, top: SIDE_Y - 12, width: (ref.side.pieces.length - 1) * PITCH + PIECE + 20, height: PIECE + 24 }}><span>함께 들어오는 값</span></div>
          <div className="rpTray spare" style={{ left: PAD, top: SPARE_Y - 10, width: W - PAD * 2, height: PIECE + 30 }}><span>남은 조각 · 끌어서 빈칸에 · 두 번 누르면 크게 보기</span></div>
          {/* side input climbing into the merge block */}
          <svg className={`rpSideWire ${sideLit ? "lit" : ""}`} width={W} height={H}>
            <path d={`M${slotX(ref.side.into) + 70} ${SIDE_Y + 4} V${MAIN_Y + PIECE - 2}`} />
            <path d={`M${slotX(ref.side.into) + 62} ${MAIN_Y + PIECE + 8} L${slotX(ref.side.into) + 70} ${MAIN_Y + PIECE - 2} L${slotX(ref.side.into) + 78} ${MAIN_Y + PIECE + 8}`} />
          </svg>
          <span className={`rpSidePill ${sideLit ? "lit" : ""}`} style={{ left: slotX(ref.side.into) + 82, top: (SIDE_Y + MAIN_Y + PIECE) / 2 - 12 }}>{ref.side.value}</span>
          {ref.side.pieces.map((id, k) => piece(ref.blocks[id], slotX(sideStart + k), SIDE_Y, { locked: true, io: { in: k > 0 ? "square" : undefined, out: k < ref.side.pieces.length - 1 ? "square" : undefined }, cls: "side" }))}
          {/* empty gaps */}
          {ref.gaps.map(g => <button key={`gap-${g}`} className={`rpGap ${picked ? "ready" : ""}`} style={{ left: slotX(g), top: MAIN_Y }} onClick={() => clickGap(g)}><b>?</b><small>{g + 1}번 칸</small></button>)}
          {/* fixed pieces of the board */}
          {ref.board.map((id, slot) => ref.gaps.includes(slot) ? null : piece(ref.blocks[id], slotX(slot), MAIN_Y, { io: jointsIo(slot), locked: true }))}
          {/* movable pieces: in a gap or in the spare tray */}
          {ref.spares.map(id => {
            const b = ref.blocks[id], slot = inSlot(id);
            const dragging = drag?.id === id && drag.moved;
            const pos = dragging ? { x: drag!.x, y: drag!.y } : slot !== null ? { x: slotX(slot), y: MAIN_Y } : spareHome(id);
            return piece(b, pos.x, pos.y, { io: slot !== null && !dragging ? jointsIo(slot) : undefined, cls: `${dragging ? "dragging" : ""} ${picked === id ? "picked" : ""} ${run?.failAt === slot && slot !== null ? "fail" : ""}` });
          })}
          {/* values that flowed during ▶ run */}
          {ref.board.map((_, slot) => { const v = valueAt(slot); return v && <span key={`v-${slot}`} className={`rpValue ${v.bad ? "bad" : ""}`} style={{ left: slotX(slot) + 70, top: MAIN_Y - 34 }}>{v.text}</span>; })}
          {run && <i className={`rpPulse ${run.status}`} style={{ left: slotX(run.step) + 70, top: MAIN_Y + 70 }} />}
        </div>
      </section>
    </main>
    <footer className="rpFoot">
      <div className="rpMing"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>밍</b>{msg}</p></div>
      <span className="rpStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}<small>실행 실패 {fails}번</small></span>
      <button className="rpRun" disabled={!filled || run?.status === "running"} onClick={start}>{filled ? "▶ 실행해서 확인" : `빈칸 ${ref.gaps.filter(g => !place[g]).length}개 남음`}</button>
      <button className="rpNext" disabled={run?.status !== "pass"} onClick={() => { send({ type: "COMPILE", program: ref.program }); send({ type: "OPEN_BOARD" }); }}>정상 기준 완성 → 메모판에서 비교</button>
    </footer>
    <button className="secretSolve" title="개발용 정답 적용" onClick={solve}>정답 보기</button>

    {zoom && <div className="pieceZoom" onClick={() => setZoom(null)}><article className="pieceZoomCard" onClick={event => event.stopPropagation()}>
      <button className="pieceZoomClose" onClick={() => setZoom(null)}>×</button>
      <div className="pieceZoomStage rpZoomStage"><div className={`rpPiece ${zoom.kind === "hw" ? "hw" : "sw"}`} style={{ "--piece": "inset(6px 12px 6px 12px round 12px)" } as React.CSSProperties}><PieceFace b={zoom} /></div></div>
      <div className="pieceZoomText">
        <small>{zoom.kind === "hw" ? "부품 (하드웨어)" : `SW 블록 · ${KIND_TAG[zoom.kind]}`}</small><h2>{zoom.label}{zoom.tag ? ` · ${zoom.tag}` : ""}</h2>
        <p className="pzDo">💡 {doesOf(zoom)}</p>
        <p className="rpFrom">🔧 차고에서 본 곳: <b>{zoom.from}</b></p>
        <p className="pzTip">값이 맞는지는 끼운 뒤 ▶ 실행해서 확인해요.</p>
      </div>
    </article></div>}

    {noteOpen && <div className="pieceZoom" onClick={() => setNoteOpen(false)}><article className="rpNote" onClick={event => event.stopPropagation()}>
      <button className="pieceZoomClose" onClick={() => setNoteOpen(false)}>×</button>
      <small>📒 차고 노트 · Control Software</small><h2>차고에서 본 그림</h2>
      {ref.notes.map(note => <section key={note.name}><b>{note.name}</b>
        <SimulinkDiagram logic={getFeatureLayer(note.domain, note.feature, 3)} components={getFeatureLayer(note.domain, note.feature, 2)} inputLabel={getFeatureLayer(note.domain, note.feature, 0)[0]} outputLabel={getFeatureLayer(note.domain, note.feature, 0).at(-1)!} activeStep={-1} />
      </section>)}
      <p className="pzTip">차고 그림은 기능 전체예요. 이번 퍼즐판에는 이번 사건에 필요한 칸만 있어요. 표 값은 그림에 없으니 ▶ 실행으로 확인해요.</p>
    </article></div>}
  </div>;
}
