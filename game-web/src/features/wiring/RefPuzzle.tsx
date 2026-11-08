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
import { KIND_TAG, Picto, blockKind, plainText, type Kind } from "../garage/SimulinkDiagram";
import { getFeatureLayer, piecePath, type DomainId, type Nub } from "../../experiences";

type Send = React.Dispatch<any>;
type Blk = { id: string; label: string; kind: Kind | "hw"; ee?: boolean; img?: string; tag?: string; out?: string; bad?: string; why?: string; from: string; does?: string };
type Ref = {
  domain: string; feature: string; ecu: string; program: string;
  board: string[]; gaps: number[]; spares: string[]; joints: Nub[];
  side: { pieces: string[]; into: number; value: string };
  req: { text: string; slot: number }[];
  blocks: Record<string, Blk>;
  notes: { domain: DomainId; feature: number; name: string }[];
  field: Record<string, string>; // values recorded in the faulty drive (only where they differ from the reference)
};

const T = "/assets/ending-thumbs/", P = "/assets/board-photos/";
const REF: Record<CaseId, Ref> = {
  propulsion: {
    domain: "구동", feature: "페달 → 토크 요청", ecu: "VCU", program: "nominal",
    board: ["aps", "corr", "filter", "map", "permit", "min", "ramp", "out", "inv"], gaps: [3, 5, 6],
    spares: ["ramp", "mapB", "min", "est", "map"], joints: ["round", "round", "round", "square", "square", "square", "square", "zigzag"],
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
        why: "실행 결과 92 Nm예요. 요구사항은 '60% → 204 Nm'이에요. 같은 '페달 맵'이라도 안에 든 표 값이 달라요." },
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
    field: { filter: "27% (×0.45)", map: "92 Nm", permit: "92 Nm · D", min: "92 Nm", ramp: "92 Nm ↗", out: "CAN 92 Nm", inv: "모터 91 Nm" },
  },
  thermal: {
    domain: "열관리", feature: "냉각 팬 구동 경로", ecu: "Thermal ECU → 팬", program: "thermal_closed_loop",
    board: ["coolant", "range", "filter", "hyst", "pi", "driver", "fan"], gaps: [1, 3, 5],
    spares: ["hystB", "driver", "derate", "range", "hyst"], joints: ["tri", "tri", "tri", "zigzag", "wave", "wave"],
    side: { pieces: ["rpm"], into: 4, value: "실제 회전 1850 rpm" },
    req: [
      { text: "냉각수 온도를 잰다 (78°C)", slot: 0 },
      { text: "센서 값이 말이 되는 범위인지 확인한다", slot: 1 },
      { text: "잠깐 튀는 값은 걸러 낸다", slot: 2 },
      { text: "65°C를 넘으면 팬을 켠다 (끌 때는 60°C, 깜빡임 방지)", slot: 3 },
      { text: "실제 회전수를 보며 목표 1850 rpm이 되게 PWM을 계속 조절한다", slot: 4 },
      { text: "ECU 출력단이 PWM 신호와 12V 전원을 팬에 보낸다", slot: 5 },
      { text: "팬이 1850 rpm으로 돈다", slot: 6 },
    ],
    blocks: {
      coolant: { id: "coolant", label: "냉각수 온도 센서", kind: "hw", img: `${T}motor_temp_sensor.png`, out: "78°C", from: "열관리 · 온도 상태 만들기" },
      range: { id: "range", label: "범위 검사", kind: "check", out: "78°C ✓", from: "열관리 · 온도 상태 만들기" },
      filter: { id: "filter", label: "필터", kind: "delay", out: "78°C", from: "열관리 · 온도 상태 만들기" },
      hyst: { id: "hyst", label: "히스테리시스", tag: "표 A", kind: "state", out: "팬 ON", from: "열관리 · 펌프·팬 제어" },
      hystB: { id: "hystB", label: "히스테리시스", tag: "표 B", kind: "state", bad: "팬 OFF", from: "열관리 · 펌프·팬 제어",
        why: "실행 결과 팬 OFF예요. 요구사항은 '65°C를 넘으면 켠다'예요. 같은 '히스테리시스'라도 켜는 기준값이 달라요." },
      pi: { id: "pi", label: "PI 제어", kind: "pi", out: "PWM 68%", from: "열관리 · 펌프·팬 제어" },
      derate: { id: "derate", label: "단계 임계", kind: "switch", from: "열관리 · 출력 제한(보호)",
        why: "'단계 임계'는 온도가 높을 때 구동 출력을 줄이는 보호 기능 블록이에요. 팬을 돌리는 경로에는 없어요." },
      driver: { id: "driver", label: "팬 구동 출력단 · 전원", kind: "hw", ee: true, img: `${T}thermal_ecu.png`, out: "PWM 68% · 12V", from: "열관리 · 펌프·팬 제어 (E/E)" },
      fan: { id: "fan", label: "냉각 팬 모터", kind: "hw", img: `${T}cooling_fan.png`, out: "1850 rpm", from: "열관리 · 펌프·팬 제어" },
      rpm: { id: "rpm", label: "팬 회전 피드백", kind: "hw", img: "/assets/ASSET_090_Input_Sensor_Node.png", out: "실제 1850 rpm", from: "열관리 · 펌프·팬 제어" },
    },
    notes: [{ domain: "thermal", feature: 1, name: "열관리 · 펌프·팬 제어" }, { domain: "thermal", feature: 0, name: "열관리 · 온도 상태 만들기" }],
    field: { pi: "PWM 100%", driver: "PWM 100% · 12V", fan: "0 rpm" },
  },
  brake: {
    domain: "제동", feature: "회생 + 마찰 협조 → 유압 경로", ecu: "Brake ECU → 유압", program: "blended_brake",
    board: ["pedal", "recv", "rmin", "rest", "press", "hmod", "caliper"], gaps: [1, 4, 5],
    spares: ["hmod", "slip", "press", "pressB", "recv"], joints: ["round", "square", "square", "square", "tri", "tri"],
    side: { pieces: ["bms", "avail"], into: 2, value: "회생 가능 1.1 m/s²" },
    req: [
      { text: "운전자가 브레이크를 55% 밟는다", slot: 0 },
      { text: "목표 감속 3.2 m/s²를 받는다", slot: 1 },
      { text: "회생은 배터리가 받을 수 있는 만큼만 쓴다", slot: 2 },
      { text: "모자란 만큼은 마찰 제동이 채운다", slot: 3 },
      { text: "마찰 몫 2.1 m/s²는 압력 42 bar가 된다", slot: 4 },
      { text: "유압 모듈이 명령대로 라인 압력 42 bar를 만든다", slot: 5 },
      { text: "캘리퍼가 바퀴를 잡아 합계 3.2 m/s²", slot: 6 },
    ],
    blocks: {
      pedal: { id: "pedal", label: "브레이크 페달 센서", kind: "hw", img: `${T}brake_pedal.png`, out: "55%", from: "제동 · 페달 → 감속 요구" },
      recv: { id: "recv", label: "요구 수신", kind: "calc", out: "3.2 m/s²", from: "제동 · 회생·마찰 협조" },
      rmin: { id: "rmin", label: "회생 MIN", kind: "min", out: "회생 1.1", from: "제동 · 회생·마찰 협조" },
      rest: { id: "rest", label: "잔여력 계산", kind: "calc", out: "마찰 2.1", from: "제동 · 회생·마찰 협조" },
      press: { id: "press", label: "마찰 압력", tag: "표 A", kind: "lut", out: "42 bar", from: "제동 · 회생·마찰 협조" },
      pressB: { id: "pressB", label: "마찰 압력", tag: "표 B", kind: "lut", bad: "8 bar", from: "제동 · 회생·마찰 협조",
        why: "실행 결과 8 bar예요. 요구사항은 '2.1 m/s² → 42 bar'예요. 같은 '마찰 압력'이라도 표 값이 달라요." },
      slip: { id: "slip", label: "슬립 임계", kind: "switch", from: "제동 · ABS 잠김 방지",
        why: "'슬립 임계'는 바퀴가 잠기려 할 때만 끼어드는 ABS 블록이에요. 평소 협조 제동 경로에는 없어요." },
      hmod: { id: "hmod", label: "유압 모듈 · 밸브·펌프", kind: "hw", ee: true, img: `${T}brake_ecu.png`, out: "라인 42 bar", from: "제동 · 페달 → 감속 요구 (E/E)" },
      caliper: { id: "caliper", label: "캘리퍼 · 바퀴", kind: "hw", img: `${T}brake_caliper.png`, out: "감속 3.2 m/s² ✓", from: "제동 · 회생·마찰 협조" },
      bms: { id: "bms", label: "BMS 배터리 수용량", kind: "hw", img: `${T}bms.png`, out: "충전 여유 적음", from: "제동 · 회생·마찰 협조" },
      avail: { id: "avail", label: "회생 가용량", kind: "lut", out: "회생 가능 1.1 m/s²", from: "제동 · 회생·마찰 협조" },
    },
    notes: [{ domain: "brake", feature: 1, name: "제동 · 회생·마찰 협조" }],
    field: { hmod: "라인 8 bar", caliper: "감속 1.4 m/s²" },
  },
};

// SW blocks take the garage's own picto/tag rule, so the piece looks exactly like the garage block
Object.values(REF).forEach(ref => Object.values(ref.blocks).forEach(b => { if (b.kind !== "hw") b.kind = blockKind(b.label); }));

const PITCH = 116, PIECE = 140, MAIN_Y = 92, SIDE_Y = 284, SPARE_Y = 476, PAD = 24;
const doesOf = (b: Blk) => b.does ?? (b.kind === "hw" ? "실제 부품" : plainText(b.label, b.kind));
const eunNeun = (word: string) => { const c = word.charCodeAt(word.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? "은" : "는"; };

function PieceFace({ b }: { b: Blk }) {
  return <>
    {b.kind === "hw"
      ? <div className={`rpPic hw ${b.ee ? "ee" : ""}`}><img src={b.img} alt="" draggable={false} /><small>{b.ee ? "E/E" : "부품"}</small></div>
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
  const [msg, setMsg] = useState(`오른쪽 요구사항을 읽고 빈칸 ${ref.gaps.length}곳에 블록을 넣은 뒤 ▶ 실행하세요. 모두 차고에서 본 블록·부품이에요.`);
  const [zoom, setZoom] = useState<Blk | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [scale, setScale] = useState(.8);
  const stage = useRef<HTMLDivElement>(null);
  const noteKey = `${state.caseId}:garageNote`;
  const section = (() => { try { return sessionStorage.getItem(`tb-section-${state.caseId}`) ?? ref.ecu; } catch { return ref.ecu; } })();
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
    setMsg("값이 흐르는 중이에요. 표시창 값이 요구사항과 맞는지 확인하세요.");
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
        setMsg(b.why && (trapHere || !b.bad && !ref.board.includes(id)) ? b.why : `${slot + 1}번 칸 요구사항은 "${want?.text ?? "다음 단계"}"예요. '${b.label}'${eunNeun(b.label)} "${doesOf(b)}" 블록이라 이 자리 값이 맞지 않아요.`);
        return;
      }
      if (slot === n - 1) { setRun({ step: slot, status: "pass" }); play("success"); setMsg("✓ 모든 요구사항을 만족해요. 이 값들이 이번 사건의 정상 기준이에요."); return; }
      play("pop", 1 + slot * .06);
      setRun({ step: slot + 1, status: "running" });
    }, run.step === 0 ? 350 : 520);
    return () => clearTimeout(timer);
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  const solve = () => { setPlace(Object.fromEntries(ref.gaps.map(g => [g, ref.board[g]]))); setRun(null); setMsg("정답 배치 완료. ▶ 실행으로 확인하세요."); };
  const reset = () => { setPlace(Object.fromEntries(ref.gaps.map(g => [g, null]))); setRun(null); setPicked(null); setMsg("초기화했어요. 요구사항을 하나씩 읽어 보세요."); play("squish"); };
  const noteReady = fails > 0 || noteUsed;
  const openNote = () => { if (!noteReady) return; if (!noteUsed) send({ type: "HINT", key: noteKey }); setNoteOpen(true); play("pop"); };
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
    <GameHeader chapter="REQUIREMENT-BASED REFERENCE" title="요구사항 기반 정상 동작 복원" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <header className="rpHead">
      <div><small>의심 구간 · {section}</small><h1>{ref.domain} · {ref.feature}</h1><p>앞에서 좁힌 구간이 <b>정상이라면</b> 어떻게 동작해야 하는지, 요구사항과 차고에서 본 블록으로 복원해요.</p></div>
      <div className="rpTools">
        <button onClick={openNote} disabled={!noteReady} title={noteReady ? "" : "한 번 실행해 본 뒤 열 수 있어요"}>📒 차고 노트{noteUsed ? "" : noteReady ? " · -5m" : " · 실행 후"}</button>
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
          <div className="rpTray main" style={{ left: slotX(0) - 14, top: MAIN_Y - 66, width: (n - 1) * PITCH + PIECE + 28, height: PIECE + 118 }}><span>입력 → 출력 · 표시창은 ▶ 실행할 때 채워져요</span></div>
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
          {/* Simulink-style display blocks: the value leaving each block, filled while ▶ runs */}
          {ref.board.map((_, slot) => { const v = valueAt(slot); const x = slot < n - 1 ? slotX(slot) + 128 : slotX(slot) + 70; return <React.Fragment key={`v-${slot}`}>
            <i className="rpStem" style={{ left: x, top: slot === n - 1 ? MAIN_Y + PIECE - 6 : MAIN_Y - 22 }} />
            <span className={`rpDisplay ${v ? v.bad ? "bad" : "ok" : ""} ${slot === 0 ? "first" : ""} ${slot === n - 1 ? "last" : ""}`} style={{ left: x, top: slot === n - 1 ? MAIN_Y + PIECE + 14 : MAIN_Y - 54 }}>{slot === 0 && <small>입력</small>}{slot === n - 1 && <small>출력</small>}{v ? v.text : "—"}</span>
          </React.Fragment>; })}
          {ref.board.slice(0, -1).map((_, slot) => <i key={`a-${slot}`} className="rpArrow" style={{ left: slotX(slot) + 128, top: MAIN_Y + 58 }}>▶</i>)}
          {run && <i className={`rpPulse ${run.status}`} style={{ left: slotX(run.step) + 70, top: MAIN_Y + 70 }} />}
        </div>
      </section>
    </main>
    <footer className="rpFoot">
      <div className="rpMing"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>밍</b>{msg}</p></div>
      <span className="rpStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}<small>실행 실패 {fails}번</small></span>
      <button className="rpRun" disabled={!filled || run?.status === "running"} onClick={start}>{filled ? "▶ 실행해서 확인" : `빈칸 ${ref.gaps.filter(g => !place[g]).length}개 남음`}</button>
      <button className="rpNext" disabled={run?.status !== "pass"} onClick={() => { send({ type: "COMPILE", program: ref.program }); send({ type: "OPEN_BENCH" }); }}>정상 동작 확정 → 시뮬레이션 검증</button>
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
      <small>📒 차고 노트 · Control Software</small><h2>차고에서 본 블록 카드</h2>
      <p className="pzTip">순서는 섞여 있어요. 각 블록이 하는 일만 다시 확인하고, 순서는 요구사항으로 판단하세요.</p>
      {ref.notes.map(note => <section key={note.name}><b>{note.name}</b><div className="rpNoteCards">
        {[...getFeatureLayer(note.domain, note.feature, 3)].sort((a, b) => a.localeCompare(b, "ko")).map(label => { const kind = blockKind(label); return <div key={label} className={`rpNoteCard kind-${kind}`}><div className="flowBlock"><Picto kind={kind} /><small>{KIND_TAG[kind]}</small></div><b>{label}</b><span>{plainText(label, kind)}</span></div>; })}
      </div></section>)}
    </article></div>}
  </div>;
}

/** Bench SW view in the same piece language as the puzzle: displays above = normal scenario (reference),
 *  displays below = this run. While running, values appear slot by slot; a differing value is red. */
export function RefPuzzleTrack({ caseId, progress, fixed, running }: { caseId: CaseId; progress: number; fixed: boolean; running: boolean }) {
  const ref = REF[caseId];
  const n = ref.board.length;
  const W = PAD * 2 + (n - 1) * PITCH + PIECE, H = 300, Y = 80;
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(.6);
  useLayoutEffect(() => {
    const fit = () => { const r = box.current?.getBoundingClientRect(); if (r && r.width) setScale(Math.max(Math.min(r.width / W, r.height / H, 1), Math.min(.62, r.height / H))); };
    fit(); const ob = new ResizeObserver(fit); if (box.current) ob.observe(box.current); return () => ob.disconnect();
  }, [W]);
  const shown = Math.floor(progress * n + (progress >= 1 ? 0 : .0001));
  const x = (i: number) => PAD + i * PITCH;
  return <div className={`rpTrack ${running ? "running" : ""}`} ref={box}>
    <div className="rpTrackSizer" style={{ width: W * scale, height: H * scale }}><div className="rpTrackWorld" style={{ width: W, height: H, transform: `scale(${scale})` }}>
      <span className="rpTrackTag top">정상 시나리오 (복원한 기준)</span>
      <span className="rpTrackTag bottom">{fixed ? "고친 설계" : "현장 기록 · 시험 대상"}</span>
      {ref.board.map((id, i) => { const b = ref.blocks[id]; return <div key={id} className={`rpPiece ${b.kind === "hw" ? "hw" : "sw"} locked`} style={{ left: x(i), top: Y, cursor: "default", ...({ "--piece": piecePath({ in: i > 0 ? ref.joints[i - 1] : undefined, out: i < n - 1 ? ref.joints[i] : undefined }) } as React.CSSProperties) }}><PieceFace b={b} /></div>; })}
      {ref.board.slice(0, -1).map((_, i) => <i key={`a${i}`} className="rpArrow" style={{ left: x(i) + 128, top: Y + 58 }}>▶</i>)}
      {ref.board.map((id, i) => { const on = i < shown || progress >= 1; const want = ref.blocks[id].out ?? ""; const got = fixed ? want : ref.field[id] ?? want; const cx = x(i) + 70; return <React.Fragment key={`d${id}`}>
        <span className={`rpDisplay ${on ? "ok" : ""}`} style={{ left: cx, top: Y - 44 }}>{on ? want : "—"}</span>
        <span className={`rpDisplay ${on ? got === want ? "ok" : "bad" : ""}`} style={{ left: cx, top: Y + PIECE + 10 }}>{on ? got : "—"}</span>
      </React.Fragment>; })}
    </div></div>
  </div>;
}
