// Simulink-style block diagram for one control function.
// Each logic step becomes a block whose shape follows what it does, so the
// diagram shows real structure instead of a straight line of boxes:
//   check  → two sensor inputs in parallel feed a comparison block
//   min    → several limits merge into a MIN block (side input from the network)
//   pi     → Σ + PI block with a feedback wire from the output (closed loop)
//   delay  → rate limiter / filter with a 1/z memory loop (recursive)
//   state  → state chart (ON ⇄ OFF) with a self-loop
//   lut    → lookup table (map)
//   switch → gate / condition
import React from "react";

type Kind = "check" | "lut" | "min" | "pi" | "delay" | "state" | "switch" | "calc";

export function blockKind(label: string): Kind {
  if (/PI|추종/.test(label)) return "pi";
  if (/상관성|유효성|범위 검사|E2E|진단|Plausibility|타당/.test(label)) return "check";
  if (/맵|보간|비율|기어비/.test(label)) return "lut";
  if (/MIN|제한|합계|최대값|선택/.test(label)) return "min";
  if (/램프|필터|디바운스|지연/.test(label)) return "delay";
  if (/래치|상태|히스테리시스|모드|전이|Latch/.test(label)) return "state";
  if (/Gate|==|확인|조건|인터록|임계|차속 0|타임아웃/.test(label)) return "switch";
  return "calc";
}

const KIND_TAG: Record<Kind, string> = { check: "비교·검증", lut: "맵(표)", min: "MIN 중재", pi: "PI 제어", delay: "1/z 기억", state: "상태기", switch: "조건 스위치", calc: "계산" };

function Icon({ kind, x, y }: { kind: Kind; x: number; y: number }) {
  const g = { transform: `translate(${x} ${y})` };
  switch (kind) {
    case "lut": return <g {...g}>{[0, 1, 2].map(r => [0, 1, 2].map(c => <rect key={`${r}${c}`} x={-12 + c * 8} y={-12 + r * 8} width={7} height={7} rx={1.5} className="ic" />))}</g>;
    case "min": return <g {...g}><text className="icText" textAnchor="middle" y={5}>MIN</text></g>;
    case "pi": return <g {...g}><text className="icText" textAnchor="middle" y={5}>PI</text></g>;
    case "delay": return <g {...g}><text className="icText" textAnchor="middle" y={-1} fontSize={11}>1</text><line x1={-9} x2={9} y1={2} y2={2} className="icLine" /><text className="icText" textAnchor="middle" y={14} fontSize={11}>z</text></g>;
    case "state": return <g {...g}><circle cx={-9} cy={0} r={7} className="ic" /><circle cx={9} cy={0} r={7} className="ic" /><path d="M-3 -5 Q0 -9 3 -5 M3 5 Q0 9 -3 5" className="icLine" /></g>;
    case "switch": return <g {...g}><circle cx={-10} cy={0} r={2.5} className="icDot" /><circle cx={10} cy={-6} r={2.5} className="icDot" /><line x1={-10} y1={0} x2={9} y2={-5} className="icLine" /></g>;
    case "check": return <g {...g}><path d="M-12 -6 L0 6 L12 -6" className="icLine" /><text className="icText" textAnchor="middle" y={-6} fontSize={10}>A≈B</text></g>;
    default: return <g {...g}><text className="icText" textAnchor="middle" y={5}>f(x)</text></g>;
  }
}

export function SimulinkDiagram({ logic, components, inputLabel, outputLabel, activeStep }: {
  logic: string[]; components: string[]; inputLabel: string; outputLabel: string; activeStep: number;
}) {
  const W = Math.max(640, 150 + logic.length * 100), H = 260, mid = 122;
  const kinds = logic.map(blockKind);
  const parallel = kinds[0] === "check";
  const piIndex = kinds.indexOf("pi");
  const left = 108, right = W - 92;
  const step = (right - left) / Math.max(1, logic.length);
  const bx = (i: number) => left + step * (i + .5); // block centre x
  const bw = Math.min(96, step - (kinds.includes("pi") ? 46 : 18)), bh = 62;
  // A Σ sum block sits just before the PI block when there is a feedback loop.
  const sumX = piIndex >= 0 ? bx(piIndex) - bw / 2 - 20 : 0;

  const wires: { d: string; cls: string }[] = [];
  // inputs → first block
  if (parallel) {
    wires.push({ d: `M60 ${mid - 34} H${bx(0) - 70} V${mid - 12} H${bx(0) - bw / 2}`, cls: "wire" });
    wires.push({ d: `M60 ${mid + 34} H${bx(0) - 70} V${mid + 12} H${bx(0) - bw / 2}`, cls: "wire" });
  } else {
    wires.push({ d: `M60 ${mid} H${(piIndex === 0 ? sumX - 12 : bx(0) - bw / 2)}`, cls: "wire" });
  }
  logic.forEach((_, i) => {
    if (i === logic.length - 1) return;
    const target = i + 1 === piIndex ? sumX - 12 : bx(i + 1) - bw / 2;
    wires.push({ d: `M${bx(i) + bw / 2} ${mid} H${target}`, cls: `wire ${activeStep > i ? "live" : ""}` });
  });
  if (piIndex >= 0) wires.push({ d: `M${sumX + 12} ${mid} H${bx(piIndex) - bw / 2}`, cls: "wire" });
  wires.push({ d: `M${bx(logic.length - 1) + bw / 2} ${mid} H${W - 60}`, cls: `wire ${activeStep >= logic.length - 1 ? "live" : ""}` });
  // feedback: output back to Σ along the bottom (closed loop)
  if (piIndex >= 0) wires.push({ d: `M${W - 76} ${mid} V${H - 26} H${sumX} V${mid + 12}`, cls: "wire feedback" });

  return <div className="simulinkSvgWrap">
    <svg viewBox={`0 0 ${W} ${H}`} className="simulinkSvg" role="img" aria-label="제어 로직 블록 다이어그램">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" className="arrowHead" /></marker>
        <marker id="arrowFb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" className="arrowHeadFb" /></marker>
      </defs>
      {/* SW component subsystems (dashed frames) */}
      {components.map((name, i) => {
        // spread the SW components over the blocks (a component may own several blocks)
        const first = Math.floor(i * logic.length / components.length), last = Math.max(first, Math.floor((i + 1) * logic.length / components.length) - 1);
        const x0 = bx(first) - step / 2 + 5, x1 = bx(last) + step / 2 - 5;
        return <g key={name}>
          <rect x={x0} y={22} width={x1 - x0} height={H - 58} rx={14} className="subsystem" />
          <text x={(x0 + x1) / 2} y={38} textAnchor="middle" className="subsystemName">{name}</text>
        </g>;
      })}
      {/* inputs */}
      {parallel ? <>
        <g><rect x={6} y={mid - 48} width={54} height={28} rx={14} className="port in" /><text x={33} y={mid - 30} textAnchor="middle" className="portText">센서 A</text></g>
        <g><rect x={6} y={mid + 20} width={54} height={28} rx={14} className="port in" /><text x={33} y={mid + 38} textAnchor="middle" className="portText">센서 B</text></g>
      </> : <g><rect x={6} y={mid - 14} width={54} height={28} rx={14} className="port in" /><text x={33} y={mid + 4} textAnchor="middle" className="portText">IN</text></g>}
      <text x={6} y={H - 8} className="boundaryText">▶ {inputLabel}</text>
      {/* output */}
      <g><rect x={W - 60} y={mid - 14} width={54} height={28} rx={14} className="port out" /><text x={W - 33} y={mid + 4} textAnchor="middle" className="portText">OUT</text></g>
      <text x={W - 6} y={H - 8} textAnchor="end" className="boundaryText">{outputLabel} ▶</text>
      {wires.map((wire, i) => <path key={i} d={wire.d} className={wire.cls} markerEnd={`url(#${wire.cls.includes("feedback") ? "arrowFb" : "arrow"})`} />)}
      {piIndex >= 0 && <g><circle cx={sumX} cy={mid} r={12} className="sum" /><text x={sumX} y={mid + 5} textAnchor="middle" className="icText">Σ</text><text x={sumX - 5} y={mid + 26} className="sign">−</text><text x={sumX - 22} y={mid - 6} className="sign">+</text>
        <text x={(sumX + W - 76) / 2} y={H - 30} textAnchor="middle" className="feedbackText">피드백(실제 값을 다시 비교)</text></g>}
      {/* blocks */}
      {logic.map((label, i) => {
        const kind = kinds[i];
        const x = bx(i) - bw / 2, y = mid - bh / 2;
        return <g key={label} className={`block kind-${kind} ${activeStep === i ? "active" : ""}`}>
          {kind === "min" && <>
            <path d={`M${bx(i)} 48 V${y}`} className="wire side" markerEnd="url(#arrow)" />
            <rect x={bx(i) - 34} y={44} width={68} height={0} className="noop" />
            <text x={bx(i) + 4} y={58} className="sideText">한계값(CAN)</text>
          </>}
          {(kind === "delay" || kind === "state") && <path d={`M${x + bw - 14} ${y} C${x + bw - 6} ${y - 30}, ${x + 14} ${y - 30}, ${x + 18} ${y}`} className="wire loop" markerEnd="url(#arrowFb)" />}
          <rect x={x} y={y} width={bw} height={bh} rx={kind === "state" ? 22 : 9} className="blockBody" />
          <Icon kind={kind} x={bx(i)} y={y + 20} />
          <text x={bx(i)} y={y + bh + 16} textAnchor="middle" className="blockLabel">{label}</text>
          <text x={bx(i)} y={y + bh - 6} textAnchor="middle" className="blockTag">{KIND_TAG[kind]}</text>
        </g>;
      })}
    </svg>
  </div>;
}
