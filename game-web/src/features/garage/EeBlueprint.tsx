// Garage "E/E Architecture" view: one 2D blueprint of the whole vehicle network.
// Every domain controller sits on a shared CAN backbone through the gateway; sensors on the left,
// actuators and vehicle behaviour on the right. The selected function's parts are highlighted,
// everything else stays visible but dimmed (whole-vehicle view, domain as a highlight filter).
import React, { useLayoutEffect, useRef, useState } from "react";

type Role = "input" | "control" | "network" | "actuator" | "result";
const ECU_BOXES = [
  { id: "vcu", label: "VCU", row: 0, col: 0, match: /VCU|Interlock|Coordinator/ },
  { id: "mcu", label: "MCU·인버터 ECU", row: 0, col: 1, match: /MCU|인버터 ECU/ },
  { id: "eps", label: "EPS ECU", row: 0, col: 2, match: /EPS ECU/ },
  { id: "bms", label: "BMS", row: 1, col: 0, match: /BMS/ },
  { id: "tms", label: "Thermal ECU", row: 1, col: 1, match: /Thermal ECU/ },
  { id: "brk", label: "Brake ECU", row: 1, col: 2, match: /Brake ECU|ABS ECU|ESC ECU|Hydraulic ECU|압력 제어기/ },
  { id: "chs", label: "Chassis·Park ECU", row: 1, col: 3, match: /Chassis ECU|Park ECU/ },
  { id: "dcu", label: "변속·클러스터", row: 0, col: 3, match: /Cluster|PRND/ },
];

export function EeBlueprint({ chain, roles, active, removed, onPick, signals }: {
  chain: string[]; roles: Role[]; active: number; removed: number | null; onPick?: (index: number) => void; signals?: string[];
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
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [chain.join("|"), roles.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const hue = (i: number) => 205 - (i / Math.max(1, chain.length - 1)) * 190; // blue (input) → red (vehicle)
  const chip = (item: { label: string; i: number }) => <button data-ee={item.i} key={`${item.label}-${item.i}`} className={`eeChip ${item.i === active ? "active" : ""} ${item.i === removed ? "out" : ""}`} onClick={() => onPick?.(item.i)}>{item.i === removed ? "🚫 " : ""}{item.label}</button>;
  return <div className="eeBlueprint" ref={box}>
    <svg className="eeFlow" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
      <defs>
        {paths.map(p => <linearGradient key={p.i} id={`eeG${p.i}`} gradientUnits="userSpaceOnUse" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}><stop offset="0" stopColor={`hsl(${hue(p.i)} 75% 55%)`} /><stop offset="1" stopColor={`hsl(${hue(p.i + 1)} 75% 55%)`} /></linearGradient>)}
        {paths.map(p => <marker key={p.i} id={`eeM${p.i}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill={`hsl(${hue(p.i + 1)} 75% 50%)`} /></marker>)}
      </defs>
      {paths.map(p => <g key={p.i} className={p.i === active ? "hot" : p.i < active ? "done" : "later"}>
        <path d={p.d} className="eeFlowBase" stroke={`url(#eeG${p.i})`} markerEnd={`url(#eeM${p.i})`} />
        <path d={p.d} className="eeFlowRun" style={{ animationDelay: `${p.i * -0.25}s` }} />
        <circle cx={p.mx} cy={p.my} r="9" className="eeStepDot" fill={`hsl(${hue(p.i)} 70% 48%)`} /><text x={p.mx} y={p.my + 3.5} textAnchor="middle" className="eeStepNum">{p.i + 1}</text>
      </g>)}
    </svg>
    {signals && paths.filter(p => p.i === active).map(p => <span key={p.i} className="eeSignalTag" style={{ left: p.mx, top: p.my }}>✉ {signals[p.i]}</span>)}
    <div className="eeCol eeSensors"><small>센서 · 운전자 입력</small>{sensors.map(chip)}</div>
    <div className="eeCore">
      {[0, 1].map(row => <div key={row} className="eeRow">{ECU_BOXES.filter(box => box.row === row).map(box => { const parts = ecuParts(box); return <div key={box.id} className={`eeEcu ${parts.length ? "lit" : ""}`}><b>{box.label}</b>{parts.map(chip)}</div>; })}</div>)}
      <div className="eeBus"><span>CAN 버스</span><i>게이트웨이</i>{network.map(chip)}</div>
      <div className="eePower">⚡ 12V·고전압 전원선 (모든 제어기에 공급)</div>
    </div>
    <div className="eeCol eeActuators"><small>부품 · 차량 반응</small>{actuators.map(chip)}</div>
  </div>;
}
