// Garage "E/E Architecture" view: one 2D blueprint of the whole vehicle network.
// Every domain controller sits on a shared CAN backbone through the gateway; sensors on the left,
// actuators and vehicle behaviour on the right. The selected function's parts are highlighted,
// everything else stays visible but dimmed (whole-vehicle view, domain as a highlight filter).
import React, { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../../ui/Icon";
import { Canvas } from "@react-three/fiber";
import { FittedPart } from "../parts/PartModel";

type Role = "input" | "control" | "network" | "actuator" | "result";
const ECU_BOXES = [
  { id: "vcu", label: "VCU", row: 0, col: 0, match: /VCU|Interlock|Coordinator/ },
  { id: "mcu", label: "MCU·인버터 ECU", row: 0, col: 1, match: /MCU|인버터 ECU/ },
  { id: "eps", label: "EPS ECU", row: 0, col: 2, match: /EPS ECU/ },
  { id: "bms", label: "BMS", row: 1, col: 0, match: /BMS/ },
  { id: "tms", label: "Thermal ECU", row: 1, col: 1, match: /Thermal ECU/ },
  { id: "brk", label: "Brake ECU", row: 1, col: 2, match: /Brake ECU|ABS ECU|ESC ECU|Hydraulic ECU|압력 제어기/ },
  // Park ECU (shift-by-wire parking lock) belongs to the drivetrain side, the chassis ECU to the chassis side.
  { id: "chs", label: "Chassis ECU", row: 1, col: 3, match: /Chassis ECU/ },
  { id: "dcu", label: "변속·Park ECU", row: 0, col: 3, match: /Park ECU|Cluster|PRND/ },
];

export type EeLayer = "logic" | "part" | "mix";
export type EeInspector = { index: number; input: string; does: string; output: string; tag: string };

export function EeBlueprint({ chain, roles, active, energizedThrough = active, removed, onPick, signals, marks, layer = "logic", photo, inspector, onCloseInspector, showPath, partId }: {
  chain: string[]; roles: Role[]; active: number; removed: number | null; onPick?: (index: number) => void; signals?: string[];
  /** Last node reached by a live input. -1 keeps the diagram visible but electrically inactive. */
  energizedThrough?: number;
  /** logic = connection diagram, part = the same nodes shown as the real part, mix = both (opacity layers) */
  layer?: EeLayer; photo?: (index: number) => string | undefined;
  /** code-built part id for a node (drawn in 3D inside the node in the part / mix layers) */
  partId?: (index: number) => string | undefined;
  /** node popup: what the clicked node receives, does and sends */
  inspector?: EeInspector | null; onCloseInspector?: () => void;
  /** hide a signal arrow until the player has earned it (root-cause trace: both ends measured) */
  showPath?: (index: number) => boolean;
  /** optional per-part state (root-cause trace): measured normal / abnormal / first deviation / can be measured now */
  marks?: Record<number, "ok" | "bad" | "first" | "next">;
}) {
  // place each part of the selected chain on the blueprint
  const sensors = chain.map((label, i) => ({ label, i })).filter(item => roles[item.i] === "input");
  const actuators = chain.map((label, i) => ({ label, i })).filter(item => roles[item.i] === "actuator" || roles[item.i] === "result");
  const network = chain.map((label, i) => ({ label, i })).filter(item => roles[item.i] === "network");
  const ecuParts = (box: (typeof ECU_BOXES)[number]) => chain.map((label, i) => ({ label, i })).filter(item => roles[item.i] === "control" && box.match.test(item.label));
  // flow arrows: measure every chip and connect them in signal order (input → control → CAN → part → car)
  const box = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; i: number; x1: number; y1: number; x2: number; y2: number; mx: number; my: number }[]>([]);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [chipBox, setChipBox] = useState<Record<number, { x: number; y: number; w: number; h: number }>>({});
  useLayoutEffect(() => {
    const measure = () => {
      const root = box.current; if (!root) return;
      const base = root.getBoundingClientRect();
      setSize({ w: base.width, h: base.height });
      const rects = chain.map((_, i) => root.querySelector<HTMLElement>(`[data-ee="${i}"]`)?.getBoundingClientRect());
      const next: typeof paths = [];
      for (let i = 0; i + 1 < chain.length; i += 1) {
        const a = rects[i], b = rects[i + 1]; if (!a || !b) continue;
        const ac = { x: a.left + a.width / 2 - base.left, y: a.top + a.height / 2 - base.top };
        const bc = { x: b.left + b.width / 2 - base.left, y: b.top + b.height / 2 - base.top };
        const horizontal = Math.abs(bc.x - ac.x) > Math.abs(bc.y - ac.y) * .6;
        const dir = horizontal ? Math.sign(bc.x - ac.x) || 1 : Math.sign(bc.y - ac.y) || 1;
        const x1 = horizontal ? ac.x + dir * a.width / 2 : ac.x, y1 = horizontal ? ac.y : ac.y + dir * a.height / 2;
        const x2 = horizontal ? bc.x - dir * b.width / 2 : bc.x, y2 = horizontal ? bc.y : bc.y - dir * b.height / 2;
        const k = horizontal ? Math.max(24, Math.abs(x2 - x1) / 2) : Math.max(18, Math.abs(y2 - y1) / 2);
        const d = horizontal ? `M${x1} ${y1} C${x1 + dir * k} ${y1} ${x2 - dir * k} ${y2} ${x2} ${y2}` : `M${x1} ${y1} C${x1} ${y1 + dir * k} ${x2} ${y2 - dir * k} ${x2} ${y2}`;
        next.push({ d, i, x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 });
      }
      setPaths(next);
      const boxes: Record<number, { x: number; y: number; w: number; h: number }> = {};
      rects.forEach((r, i) => { if (r) boxes[i] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }; });
      setChipBox(boxes);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [chain.join("|"), roles.join("|"), layer]); // eslint-disable-line react-hooks/exhaustive-deps
  const hue = (i: number) => 205 - (i / Math.max(1, chain.length - 1)) * 190; // blue (input) → red (vehicle)
  const chip = (item: { label: string; i: number }) => <button data-ee={item.i} key={`${item.label}-${item.i}`} className={`eeChip ${item.i === active ? "active" : ""} ${item.i === removed ? "out" : ""} ${marks?.[item.i] ? `mark-${marks[item.i]}` : ""}`} onClick={() => onPick?.(item.i)}>{item.i === removed ? <><Icon name="ban" /> </> : null}{item.label}{marks?.[item.i] === "ok" && <em className="eeMark">정상</em>}{marks?.[item.i] === "bad" && <em className="eeMark">이상</em>}{marks?.[item.i] === "first" && <em className="eeMark">처음 어긋남</em>}</button>;
  const pop = inspector && chipBox[inspector.index];
  const popLeft = pop ? Math.max(8, Math.min(size.w - 308, pop.x + pop.w / 2 - 150)) : 0;
  const popTop = pop ? (pop.y + pop.h + 112 > size.h ? Math.max(4, pop.y - 110) : pop.y + pop.h + 8) : 0;
  const parts3d = layer !== "logic" && partId ? chain.map((_, i) => ({ i, id: partId(i), box: chipBox[i] })).filter(item => item.id && item.box) : [];
  return <div className={`eeBlueprint layer-${layer}`} ref={box}>
    {parts3d.length > 0 && <Canvas className="eeParts3d" orthographic camera={{ position: [0, 0, 400], zoom: 1, near: .1, far: 2000 }} dpr={[1, 1.5]} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
      <hemisphereLight intensity={1.7} color="#fff5dc" groundColor="#6d8c7b" />
      <directionalLight position={[200, 300, 400]} intensity={2.4} />
      {parts3d.map(({ i, id, box: b }) => <group key={i} position={[b!.x + b!.w / 2 - size.w / 2, size.h / 2 - (b!.y + 30), 0]} rotation={[.42, -.62, 0]}>
        <FittedPart id={id!} size={48} castShadow={false} demo={i <= energizedThrough && energizedThrough < chain.length} />
      </group>)}
    </Canvas>}
    {inspector && pop && <div className="eeInspector" style={{ left: popLeft, top: popTop }} role="dialog">
      <header><span>{inspector.tag}</span><b>{chain[inspector.index]}</b><button aria-label="닫기" onClick={onCloseInspector}>×</button></header>
      <div><p><small>받는 값</small>{inspector.input}</p><i>→</i><p><small>하는 일</small>{inspector.does}</p><i>→</i><p><small>보내는 값</small>{inspector.output}</p></div>
    </div>}
    <svg className="eeFlow" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
      <defs>
        {paths.map(p => <linearGradient key={p.i} id={`eeG${p.i}`} gradientUnits="userSpaceOnUse" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}><stop offset="0" stopColor={`hsl(${hue(p.i)} 75% 55%)`} /><stop offset="1" stopColor={`hsl(${hue(p.i + 1)} 75% 55%)`} /></linearGradient>)}
        {paths.map(p => <marker key={p.i} id={`eeM${p.i}`} viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={`hsl(${hue(p.i + 1)} 75% 50%)`} /></marker>)}
      </defs>
      {paths.filter(p => !showPath || showPath(p.i)).map(p => <g key={p.i} className={p.i === energizedThrough ? "hot" : p.i < energizedThrough ? "done" : "later"}>
        <path d={p.d} className="eeFlowBase" stroke={`url(#eeG${p.i})`} markerEnd={`url(#eeM${p.i})`} />
        <path d={p.d} className="eeFlowRun" style={{ animationDelay: `${p.i * -0.25}s` }} />
        <circle cx={p.mx} cy={p.my} r="9" className="eeStepDot" fill={`hsl(${hue(p.i)} 70% 48%)`} /><text x={p.mx} y={p.my + 3.5} textAnchor="middle" className="eeStepNum">{p.i + 1}</text>
      </g>)}
    </svg>
    {signals && paths.filter(p => p.i === energizedThrough && (!showPath || showPath(p.i))).map(p => <span key={p.i} className="eeSignalTag" style={{ left: p.mx + (Math.abs(p.x2 - p.x1) < 60 ? 90 : 0), top: p.my }}>{signals[p.i]}</span>)}
    <div className="eeCol eeSensors"><small>센서 · 운전자 입력</small>{sensors.map(chip)}</div>
    <div className="eeCore">
      {[0, 1].map(row => <div key={row} className="eeRow">{ECU_BOXES.filter(box => box.row === row).map(box => { const parts = ecuParts(box); return <div key={box.id} className={`eeEcu ${parts.length ? "lit" : ""}`}><b>{box.label}</b>{parts.map(chip)}</div>; })}</div>)}
      <div className="eeBus"><span>CAN 버스</span><i>게이트웨이</i>{network.map(chip)}</div>
      <div className="eePower"><Icon name="bolt" /> 12V·고전압 전원선 (모든 제어기에 공급)</div>
    </div>
    <div className="eeCol eeActuators"><small>부품 · 차량 반응</small>{actuators.map(chip)}</div>
  </div>;
}
