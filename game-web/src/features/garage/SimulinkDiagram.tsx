// Control logic as a friendly flowchart: each step is a block with a small
// picture and a one-line plain-Korean explanation underneath (no formulas).
// Structure still shows what makes control logic non-linear:
//   two sensors in parallel → check, outside limits merging into a "safest value" block,
//   a feedback wire back into the "keep correcting" block, and memory/state self-loops.
// SW components are dashed frames that own one or more steps.
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

/** One short sentence a newcomer can read without knowing control theory. */
export function plainText(label: string, kind: Kind) {
  if (/필터/.test(label)) return "잡음을 걸러 값을 매끄럽게";
  if (/디바운스/.test(label)) return "잠깐 튀는 신호는 무시";
  if (/타임아웃/.test(label)) return "너무 오래 안 오면 고장으로 판단";
  if (/히스테리시스/.test(label)) return "켜고 끄는 기준을 달리해 깜빡임 방지";
  if (/래치|Latch/.test(label)) return "한 번 위험하면 풀릴 때까지 잠금";
  if (/PWM/.test(label)) return "명령을 켜짐·꺼짐 펄스로 바꿔 구동";
  if (/램프/.test(label)) return "값을 천천히 올리고 내리기";
  if (/dq 변환/.test(label)) return "모터 전류를 다루기 쉬운 형태로";
  if (/추정/.test(label)) return "실제로 낸 값을 짐작해 보기";
  if (/진단/.test(label)) return "이상하면 고장 기록을 남기기";
  if (/상관성|A\/B/.test(label)) return "두 센서 값이 서로 같은지 확인";
  if (/Crash|충돌/.test(label)) return "충돌 신호가 오면 바로 차단";
  if (/START|요청|수신|입력/.test(label)) return "운전자·다른 제어기의 요청 받기";
  if (/범위|임계/.test(label)) return "안전한 범위 안인지 확인";
  if (/온도 제한|디레이팅|토크 제한|전류 제한|힘 제한|압력 제한/.test(label)) return "뜨겁거나 무리하면 힘을 줄이기";
  if (/출력|명령|Port|송신|인코딩/.test(label)) return "결과를 다음 부품에 보내기";
  if (/변환|기하|계산/.test(label)) return "다음 단계가 쓸 값으로 바꾸기";
  if (/구동 의도|토크 요구|목표/.test(label)) return "운전자가 원하는 힘을 정하기";
  return {
    check: "값이 정상 범위인지 확인",
    lut: "표를 보고 알맞은 값으로 바꾸기",
    min: "여러 한계 중 가장 안전한 값 고르기",
    pi: "목표와 실제의 차이를 계속 줄이기",
    delay: "값이 갑자기 변하지 않게 부드럽게",
    state: "지금 상태를 기억했다가 바꾸기",
    switch: "조건이 맞을 때만 다음으로 통과",
    calc: "필요한 값을 계산하기",
  }[kind];
}

/** Small pictograms instead of math symbols. */
function Picto({ kind }: { kind: Kind }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg viewBox="0 0 32 32" className="picto" aria-hidden="true">
    {kind === "check" && <><path d="M16 4 L26 8 V15 C26 22 21 26 16 28 C11 26 6 22 6 15 V8 Z" {...common} /><path d="M11 16 L15 20 L21 12" {...common} /></>}
    {kind === "lut" && <><rect x="5" y="6" width="22" height="20" rx="3" {...common} /><path d="M5 13 H27 M5 19 H27 M13 6 V26 M20 6 V26" {...common} /><circle cx="16.5" cy="16" r="2.4" fill="currentColor" stroke="none" /></>}
    {kind === "min" && <><path d="M7 26 V12 M14 26 V7 M21 26 V17" {...common} strokeWidth={4} /><path d="M21 9 V13 M18.5 11 L21 13.5 L23.5 11" {...common} /></>}
    {kind === "pi" && <><circle cx="16" cy="16" r="10" {...common} /><circle cx="16" cy="16" r="4.5" {...common} /><path d="M27 5 L18 14" {...common} /><path d="M27 5 L22 5 M27 5 L27 10" {...common} /></>}
    {kind === "delay" && <><path d="M5 25 C14 25 12 7 27 7" {...common} /><path d="M5 25 H27" {...common} opacity=".35" /></>}
    {kind === "state" && <><circle cx="9" cy="16" r="5" {...common} /><circle cx="23" cy="16" r="5" {...common} /><path d="M13 11 Q16 8 19 11 M19 21 Q16 24 13 21" {...common} /></>}
    {kind === "switch" && <><rect x="5" y="11" width="22" height="10" rx="5" {...common} /><circle cx="21" cy="16" r="3.5" fill="currentColor" stroke="none" /></>}
    {kind === "calc" && <><circle cx="16" cy="16" r="5" {...common} /><path d="M16 4 V8 M16 24 V28 M4 16 H8 M24 16 H28 M7.5 7.5 L10.3 10.3 M21.7 21.7 L24.5 24.5 M7.5 24.5 L10.3 21.7 M21.7 10.3 L24.5 7.5" {...common} /></>}
  </svg>;
}

const KIND_TAG: Record<Kind, string> = { check: "확인", lut: "표 보기", min: "안전값 고르기", pi: "계속 맞추기", delay: "부드럽게", state: "상태 기억", switch: "통과 조건", calc: "계산" };

export function SimulinkDiagram({ logic, components, inputLabel, outputLabel, activeStep }: {
  logic: string[]; components: string[]; inputLabel: string; outputLabel: string; activeStep: number;
}) {
  const kinds = logic.map(blockKind);
  const parallel = kinds[0] === "check";
  const piIndex = kinds.indexOf("pi");
  const n = logic.length;
  const perRow = n <= 4 ? n : Math.ceil(n / Math.ceil(n / 4));
  const rows = Math.ceil(n / perRow);
  const colW = 142, rowH = 214, padX = 74, top = 10;
  const W = padX * 2 + colW * perRow, H = top + rows * rowH + 14;
  const bw = 84, bh = 64;
  // snake layout: even rows left→right, odd rows right→left (short arrows between rows)
  const place = (i: number) => {
    const row = Math.floor(i / perRow), col = i % perRow, x = row % 2 ? perRow - 1 - col : col;
    return { row, x: padX + colW * (x + .5), y: top + row * rowH + 92, dir: row % 2 ? -1 : 1 };
  };
  const pos = logic.map((_, i) => place(i));
  const first = pos[0], last = pos[n - 1];

  const wires: { d: string; cls: string }[] = [];
  const inX = 4 + 62;
  if (parallel) {
    wires.push({ d: `M${inX} ${first.y - 30} H${padX - 6} V${first.y - 10} H${first.x - bw / 2}`, cls: "wire" });
    wires.push({ d: `M${inX} ${first.y + 30} H${padX - 6} V${first.y + 10} H${first.x - bw / 2}`, cls: "wire" });
  } else wires.push({ d: `M${inX} ${first.y} H${first.x - bw / 2}`, cls: "wire" });
  for (let i = 0; i < n - 1; i++) {
    const a = pos[i], b = pos[i + 1], live = activeStep > i ? "live" : "";
    if (a.row === b.row) wires.push({ d: `M${a.x + a.dir * bw / 2} ${a.y} H${b.x - a.dir * bw / 2}`, cls: `wire ${live}` });
    else { const sideX = a.x + a.dir * (bw / 2 + 22); wires.push({ d: `M${a.x + a.dir * bw / 2} ${a.y} H${sideX} V${b.y} H${b.x + a.dir * bw / 2}`, cls: `wire ${live}` }); }
  }
  const outX = last.dir > 0 ? W - 66 : 4;
  wires.push({ d: `M${last.x + last.dir * bw / 2} ${last.y} H${last.dir > 0 ? outX : outX + 62}`, cls: `wire ${activeStep >= n - 1 ? "live" : ""}` });
  if (piIndex >= 0) {
    const p = pos[piIndex], belowOut = last.y + 52;
    wires.push({ d: `M${last.x} ${last.y + bh / 2} V${belowOut} H${p.x + 14} ${p.row === last.row ? "" : `V${p.y + bh / 2 + 70} `}V${p.y + bh / 2}`, cls: "wire feedback" });
  }
  // component frames, split per row
  const frames: { name: string; x0: number; x1: number; y: number; showName: boolean }[] = [];
  components.forEach((name, ci) => {
    const a = Math.floor(ci * n / components.length), b = Math.max(a, Math.floor((ci + 1) * n / components.length) - 1);
    let start = a;
    for (let i = a; i <= b; i++) {
      if (i === b || pos[i + 1].row !== pos[i].row) {
        const xs = [pos[start].x, pos[i].x];
        frames.push({ name, x0: Math.min(...xs) - colW / 2 + 6, x1: Math.max(...xs) + colW / 2 - 6, y: top + pos[i].row * rowH, showName: start === a });
        start = i + 1;
      }
    }
  });

  return <div className="simulinkSvgWrap">
    <svg viewBox={`0 0 ${W} ${H}`} className="simulinkSvg" role="img" aria-label="제어 로직 흐름도">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" className="arrowHead" /></marker>
        <marker id="arrowFb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" className="arrowHeadFb" /></marker>
      </defs>
      {frames.map((frame, i) => <g key={`${frame.name}-${i}`}>
        <rect x={frame.x0} y={frame.y} width={frame.x1 - frame.x0} height={rowH - 16} rx={18} className="subsystem" />
        <foreignObject x={frame.x0 + 8} y={frame.y + 8} width={frame.x1 - frame.x0 - 16} height={24}><div className="subsystemName">{frame.name}{frame.showName ? "" : " (이어서)"}</div></foreignObject>
      </g>)}
      {parallel ? <>
        <foreignObject x={4} y={first.y - 46} width={62} height={30}><div className="portChip in">센서 A</div></foreignObject>
        <foreignObject x={4} y={first.y + 16} width={62} height={30}><div className="portChip in">센서 B</div></foreignObject>
      </> : <foreignObject x={4} y={first.y - 15} width={62} height={30}><div className="portChip in">입력</div></foreignObject>}
      <foreignObject x={outX} y={last.y - 15} width={62} height={30}><div className="portChip out">출력</div></foreignObject>
      {wires.map((wire, i) => <path key={i} d={wire.d} className={wire.cls} markerEnd={`url(#${wire.cls.includes("feedback") ? "arrowFb" : "arrow"})`} />)}
      {logic.map((label, i) => {
        const kind = kinds[i], p = pos[i];
        return <g key={label} className={`block kind-${kind} ${activeStep === i ? "active" : ""}`}>
          {kind === "min" && <><path d={`M${p.x} ${p.y - bh / 2 - 22} V${p.y - bh / 2}`} className="wire side" markerEnd="url(#arrow)" />
            <foreignObject x={p.x + 6} y={p.y - bh / 2 - 24} width={colW / 2 + 10} height={20}><div className="sideNote">다른 제어기 한계</div></foreignObject></>}
          {(kind === "delay" || kind === "state") && <path d={`M${p.x + 24} ${p.y - bh / 2} C${p.x + 32} ${p.y - bh / 2 - 26}, ${p.x - 32} ${p.y - bh / 2 - 26}, ${p.x - 24} ${p.y - bh / 2}`} className="wire loop" markerEnd="url(#arrowFb)" />}
          {kind === "pi" && <foreignObject x={p.x + 18} y={p.y + bh / 2 + 2} width={colW / 2 + 20} height={18}><div className="loopNote">↩ 실제 값 다시 비교</div></foreignObject>}
          <foreignObject x={p.x - bw / 2} y={p.y - bh / 2} width={bw} height={bh}>
            <div className="flowBlock"><Picto kind={kind} /><small>{KIND_TAG[kind]}</small></div>
          </foreignObject>
          <foreignObject x={p.x - colW / 2 + 12} y={p.y + bh / 2 + (kind === "pi" ? 20 : 8)} width={colW - 24} height={60}>
            <div className="flowCaption"><b>{label}</b><span>{plainText(label, kind)}</span></div>
          </foreignObject>
        </g>;
      })}
    </svg>
    <div className="flowEnds"><span>▶ {inputLabel}</span><span>{outputLabel} ▶</span></div>
  </div>;
}
