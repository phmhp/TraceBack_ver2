import React, { useMemo, useState, type CSSProperties } from "react";
import type { Campaign, CaseId } from "../../game/runtime";
import { SCENARIOS } from "../../game/scenarios";
import { BenchVisual, EmbeddedBench3D, RestoredPuzzleVisual, type BenchTab } from "../../experiences";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";
import { play } from "../../ui/sfx";

type Send = React.Dispatch<any>;
type ProbeId = "input" | "control" | "output";
type ExperimentState = "idle" | "running" | "inconclusive" | "conclusive";

type ExperimentConfig = {
  requirementId: string;
  requirement: string;
  missionTitle: string;
  missionBrief: string;
  precondition: string;
  stimuli: { label: string; hint: string; sequence: string }[];
  target: number;
  probe: ProbeId;
  expected: string;
  healthyActual: string;
  faultyActual: string;
  mismatch: string;
  technique: string;
  lesson: string;
  probeCopy: Record<ProbeId, string>;
};

const experimentConfig: Record<CaseId, ExperimentConfig> = {
  propulsion: {
    requirementId: "REQ-DRV-01",
    requirement: "APS 60%에서 요청 토크 204 Nm가 생성되어야 한다.",
    missionTitle: "추월 구간 가속을 그대로 재현하라",
    missionBrief: "정차 후 녹색 신호가 켜진 순간의 페달 램프 입력을 재현하고, 요청 토크가 처음 작아지는 경계를 찾습니다.",
    precondition: "READY · D · 차속 60 km/h · 브레이크 해제",
    stimuli: [
      { label: "무입력 유지", hint: "기준 상태만 확인", sequence: "0% · 3 s" },
      { label: "추월 가속", hint: "주행 기록과 동일", sequence: "0→60% / 0.3 s · 3 s 유지" },
      { label: "급가속", hint: "상한 포화만 확인", sequence: "0→100% / 0.1 s" },
    ],
    target: 1,
    probe: "control",
    expected: "204 Nm",
    healthyActual: "204 Nm",
    faultyActual: "92 Nm",
    mismatch: "Driver Torque Map 출력",
    technique: "대표값 + 원인–결과 추적",
    lesson: "증상이 나타난 대표 입력을 재현하고, 입력과 액추에이터 사이의 제어 경계를 관측해 최초 불일치를 찾았습니다.",
    probeCopy: { input: "APS 원신호", control: "토크 맵 출력", output: "모터 실제 토크" },
  },
  thermal: {
    requirementId: "REQ-THM-02",
    requirement: "구동계 냉각수 온도 65°C 초과 시 팬 명령과 실제 회전이 발생해야 한다.",
    missionTitle: "재출발 뒤 누적된 열부하를 재현하라",
    missionBrief: "신호 대기 후 재가속하면서 기록된 온도 상승을 재현하고, 팬 명령과 실제 회전이 갈라지는 경계를 찾습니다.",
    precondition: "READY · 냉각팬 OFF · 냉각수 62°C · 차량 정차",
    stimuli: [
      { label: "경계 아래", hint: "팬 OFF 확인", sequence: "64.9°C · 5 s" },
      { label: "경계 통과", hint: "ON 전환 확인", sequence: "64.9→65.1°C / 1 s" },
      { label: "주행 열부하", hint: "사건 기록과 동일", sequence: "65.1→78.4°C / 8 s" },
    ],
    target: 2,
    probe: "output",
    expected: "1850 RPM",
    healthyActual: "1846 RPM",
    faultyActual: "0 RPM",
    mismatch: "Fan PWM 이후 실제 회전 피드백",
    technique: "고장 재현 + 출력 피드백 관측",
    lesson: "명령만 확인하지 않고 실제 액추에이터 피드백까지 관측해, 명령 이후의 물리 경계가 끊겼음을 확인했습니다.",
    probeCopy: { input: "NTC 온도", control: "Fan PWM 명령", output: "팬 실제 RPM" },
  },
  brake: {
    requirementId: "REQ-BRK-03",
    requirement: "제동 요구 55%에서 회생·마찰 제동이 함께 감속 요구를 만족해야 한다.",
    missionTitle: "적색 신호 정지 미션을 재현하라",
    missionBrief: "주행 중 적색 신호를 발견한 시점부터 정지선까지의 제동 입력을 재현하고 회생·마찰 제동의 협조 경계를 확인합니다.",
    precondition: "72 km/h · D · SOC 82% · ABS 비활성",
    stimuli: [
      { label: "약제동", hint: "회생 우선 구간", sequence: "0→10% / 1.0 s" },
      { label: "정지선 제동", hint: "미션 기록과 동일", sequence: "0→55% / 0.6 s · 정지까지 유지" },
      { label: "비상 제동", hint: "ABS 개입 구간", sequence: "0→100% / 0.1 s" },
    ],
    target: 1,
    probe: "output",
    expected: "42 bar",
    healthyActual: "42 bar",
    faultyActual: "8 bar",
    mismatch: "Regen/Friction Blend 이후 유압 응답",
    technique: "조건 조합 + 실제 응답 비교",
    lesson: "회생제동 명령만 보고 통과시키지 않고 마찰제동의 실제 압력까지 비교해 협조 제동 누락을 찾았습니다.",
    probeCopy: { input: "제동 요구", control: "회생·마찰 배분", output: "캘리퍼 압력" },
  },
};

const lenses: { id: BenchTab; label: string; short: string; observation: string }[] = [
  { id: "sw", label: "SW 로직", short: "단위 검증 · MIL/SIL", observation: "입력·검증·계산·출력 중 어느 블록에서 처음 값이 달라지는가" },
  { id: "embedded", label: "ECU·I/O", short: "임베디드 검증 · HIL", observation: "입력 센서, ECU 계산, 출력 액추에이터와 피드백이 이어지는가" },
  { id: "system", label: "시스템 통합", short: "통합 검증 · 다중 ECU", observation: "ECU·네트워크·플랜트가 함께 차량 기능 요구를 만족하는가" },
  { id: "vehicle", label: "차량 시나리오", short: "차량 검증 · 실차", observation: "같은 입력에서 정상 기준과 실제 주행 응답이 일치하는가" },
];

const probeOptions: { id: ProbeId; label: string; icon: string }[] = [
  { id: "input", label: "입력 경계", icon: "①" },
  { id: "control", label: "제어 경계", icon: "②" },
  { id: "output", label: "출력·피드백", icon: "③" },
];

type RigPart = {
  cell: readonly [number, number];
  role: string;
  label: string;
  signal: string;
  kind: "input" | "controller" | "transfer" | "output";
};

const rigParts: Record<CaseId, readonly RigPart[]> = {
  propulsion: [
    { cell: [0, 0], role: "DRIVER INPUT", label: "APS 이중 페달", signal: "0.6 V / 1.2 V", kind: "input" },
    { cell: [1, 0], role: "CONTROL", label: "VCU 제어기", signal: "Torque request", kind: "controller" },
    { cell: [2, 0], role: "POWER STAGE", label: "3상 인버터", signal: "PWM · HV", kind: "transfer" },
    { cell: [3, 0], role: "PHYSICAL OUTPUT", label: "PMSM 구동 모터", signal: "204 Nm", kind: "output" },
  ],
  thermal: [
    { cell: [0, 1], role: "SENSOR INPUT", label: "냉각수 온도 센서(NTC)", signal: "78.4°C", kind: "input" },
    { cell: [1, 0], role: "CONTROL", label: "열관리 ECU", signal: "Fan request", kind: "controller" },
    { cell: [2, 0], role: "POWER DRIVER", label: "PWM 구동단", signal: "68% duty", kind: "transfer" },
    { cell: [1, 1], role: "PHYSICAL OUTPUT", label: "냉각 팬 모듈", signal: "1850 RPM", kind: "output" },
  ],
  brake: [
    { cell: [0, 0], role: "DRIVER INPUT", label: "브레이크 페달", signal: "Pedal 55%", kind: "input" },
    { cell: [1, 0], role: "CONTROL", label: "Brake ECU", signal: "Blend request", kind: "controller" },
    { cell: [2, 1], role: "PRESSURE STAGE", label: "유압 모듈레이터", signal: "42 bar command", kind: "transfer" },
    { cell: [3, 1], role: "PHYSICAL OUTPUT", label: "디스크 · 캘리퍼", signal: "42 bar", kind: "output" },
  ],
};

function ComponentCutout({ part }: { part: RigPart }) {
  const [column, row] = part.cell;
  const style = {
    "--atlas-x": `${column * 33.333}%`,
    "--atlas-y": `${row * 100}%`,
  } as CSSProperties;
  return <article className={`rigComponent ${part.kind}`}>
    <div className="rigPhoto"><i className="rigCutout" style={style} /></div>
    <span><small>{part.role}</small><b>{part.label}</b><em>{part.signal}</em></span>
  </article>;
}

function HardwareRigVisual({ caseId, running, works, conclusive }: { caseId: CaseId; running: boolean; works: boolean; conclusive: boolean }) {
  const parts = rigParts[caseId];
  const result = !conclusive ? "neutral" : works ? "pass" : "fail";
  const outputCopy = caseId === "propulsion" ? "모터 토크" : caseId === "thermal" ? "팬 회전" : "캘리퍼 압력";
  return <section className={`hardwareRigVisual case-${caseId} ${running ? "running" : ""} result-${result}`}>
    <header>
      <span><small>ECU–HW INTEGRATION RIG</small><b>실제 부품 경계를 따라 신호와 물리 응답을 함께 관측</b></span>
      <em><i />{running ? "신호 인가 중" : conclusive ? works ? "응답 일치" : "경계 불일치" : "시험 준비"}</em>
    </header>
    <div className="hardwareRigCanvas">
      <svg className="rigHarness" viewBox="0 0 1000 280" preserveAspectRatio="none" aria-hidden="true">
        <path className="loom loom-shadow" d="M108 150 C205 110 245 110 326 148 S480 188 558 150 S720 109 890 150" />
        <path className="loom loom-power" d="M108 145 C205 105 245 105 326 143 S480 183 558 145 S720 104 890 145" />
        <path className="loom loom-data" d="M108 154 C205 114 245 114 326 152 S480 192 558 154 S720 113 890 154" />
        <path className="loom loom-feedback" d="M890 178 C765 239 608 237 507 214 S264 184 108 188" />
        <g className="signalDots">
          <circle r="8"><animateMotion dur="1.7s" repeatCount="indefinite" path="M108 145 C205 105 245 105 326 143 S480 183 558 145 S720 104 890 145" /></circle>
          <circle r="6"><animateMotion dur="2.1s" begin="-.8s" repeatCount="indefinite" path="M890 178 C765 239 608 237 507 214 S264 184 108 188" /></circle>
        </g>
      </svg>
      <div className="rigParts">{parts.map(part => <ComponentCutout key={part.kind} part={part} />)}</div>
      <div className="rigBoundaryLegend"><span><i />입력 인가</span><span><i />ECU 계산</span><span><i />전력·압력 전달</span><span><i />{outputCopy} + 피드백</span></div>
    </div>
  </section>;
}

const systemScenario: Record<CaseId, { input: string; network: string; response: string; units: string }> = {
  propulsion: { input: "가속 요구 60%", network: "VCU ↔ BMS ↔ Inverter", response: "종가속도 · 모터 토크", units: "204 Nm · 2.1 m/s²" },
  thermal: { input: "열부하 78.4°C", network: "Thermal ECU ↔ VCU ↔ BMS", response: "온도 기울기 · 팬 응답", units: "-1.8°C/min · 1850 RPM" },
  brake: { input: "제동 요구 55%", network: "Brake ECU ↔ VCU ↔ ABS", response: "감속도 · 휠 슬립", units: "3.2 m/s² · 4%" },
};

function SystemNetworkVisual({ caseId, running, works, conclusive }: { caseId: CaseId; running: boolean; works: boolean; conclusive: boolean }) {
  const copy = systemScenario[caseId];
  const result = !conclusive ? "neutral" : works ? "pass" : "fail";
  return <section className={`systemNetworkVisual ${running ? "running" : ""} result-${result}`}>
    <div className="dynamicVehicleRig" aria-label="동적으로 실행되는 차량 시스템 모델">
      <div className="vehicleSilhouette"><i /><i /><i /><i /><span>EV SYSTEM PLANT</span></div>
      <div className="systemDynamicNodes">
        <article className="driverNode"><small>① SCENARIO INPUT</small><b>{copy.input}</b><span>운전자·환경 경계</span></article>
        <article className="networkNode"><small>② FUNCTION NETWORK</small><b>{copy.network}</b><span>상태·인터록·중재</span></article>
        <article className="responseNode"><small>③ VEHICLE RESPONSE</small><b>{copy.response}</b><span>{conclusive && !works ? "요구 범위 이탈" : copy.units}</span></article>
      </div>
      <svg viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
        <path id={`system-request-${caseId}`} className="systemSignal request" d="M145 90 C250 84 295 145 405 164" />
        <path id={`system-command-${caseId}`} className="systemSignal command" d="M405 164 C555 192 690 170 850 270" />
        <path id={`system-feedback-${caseId}`} className="systemSignal feedback" d="M850 292 C700 340 500 334 405 250 S250 155 145 118" />
        <g className="systemSignalPackets">
          <circle r="9"><animateMotion dur="1.45s" repeatCount="indefinite" path="M145 90 C250 84 295 145 405 164 C555 192 690 170 850 270" /></circle>
          <circle r="7"><animateMotion dur="1.9s" begin="-.7s" repeatCount="indefinite" path="M850 292 C700 340 500 334 405 250 S250 155 145 118" /></circle>
        </g>
      </svg>
    </div>
    <footer><span><i />요구값</span><span><i />ECU 간 기능 흐름</span><span><i />플랜트 피드백</span><strong>{running ? "통합 시나리오 실행 중" : conclusive ? works ? "요구사항 충족" : "최초 불일치 추적" : "시험 대기"}</strong></footer>
  </section>;
}

type SoftwareFlowNode = {
  stage: string;
  label: string;
  expected: string;
  faulty: string;
  kind?: "decision" | "output";
};

const softwareFlows: Record<CaseId, { nodes: SoftwareFlowNode[]; mismatchIndex: number }> = {
  propulsion: {
    mismatchIndex: 3,
    nodes: [
      { stage: "INPUT", label: "APS A/B", expected: "60.0 / 60.2%", faulty: "60.0 / 60.2%" },
      { stage: "VALIDATE", label: "상호 타당성", expected: "편차 < 2%", faulty: "편차 < 2%", kind: "decision" },
      { stage: "NORMALIZE", label: "페달 정규화", expected: "0.60", faulty: "0.60" },
      { stage: "MAP", label: "Driver Torque", expected: "204 Nm", faulty: "92 Nm" },
      { stage: "INTERLOCK", label: "주행 허용", expected: "D · READY", faulty: "D · READY", kind: "decision" },
      { stage: "LIMIT", label: "가용 토크 제한", expected: "min(REQ,LIM)", faulty: "min(REQ,LIM)" },
      { stage: "RAMP", label: "토크 변화율", expected: "+24 Nm/s", faulty: "+9 Nm/s" },
      { stage: "OUTPUT", label: "CAN Torque Cmd", expected: "204 Nm", faulty: "92 Nm", kind: "output" },
    ],
  },
  thermal: {
    mismatchIndex: 5,
    nodes: [
      { stage: "INPUT", label: "냉각수 온도(NTC)", expected: "78.4°C", faulty: "78.4°C" },
      { stage: "VALIDATE", label: "범위·단선 검사", expected: "VALID", faulty: "VALID", kind: "decision" },
      { stage: "FILTER", label: "Debounce", expected: "120 ms", faulty: "120 ms" },
      { stage: "STATE", label: "Hysteresis", expected: "FAN ON", faulty: "FAN ON", kind: "decision" },
      { stage: "CONTROL", label: "팬 목표 계산", expected: "1850 RPM", faulty: "1850 RPM" },
      { stage: "DRIVER", label: "PWM 출력", expected: "68% duty", faulty: "0% duty" },
      { stage: "PLANT", label: "팬 모터", expected: "1846 RPM", faulty: "0 RPM" },
      { stage: "FEEDBACK", label: "회전 피드백", expected: "정상 추종", faulty: "무응답", kind: "output" },
    ],
  },
  brake: {
    mismatchIndex: 4,
    nodes: [
      { stage: "INPUT", label: "Pedal A/B", expected: "55 / 55.3%", faulty: "55 / 55.3%" },
      { stage: "VALIDATE", label: "상호 타당성", expected: "MATCH", faulty: "MATCH", kind: "decision" },
      { stage: "TARGET", label: "감속 목표", expected: "3.2 m/s²", faulty: "3.2 m/s²" },
      { stage: "LIMIT", label: "회생 한계", expected: "1.1 m/s²", faulty: "1.1 m/s²" },
      { stage: "BLEND", label: "협조 제동 배분", expected: "회생 + 마찰", faulty: "회생만" },
      { stage: "GUARD", label: "ABS 보호", expected: "NO SLIP", faulty: "NO SLIP", kind: "decision" },
      { stage: "OUTPUT", label: "Pressure Cmd", expected: "42 bar", faulty: "8 bar" },
      { stage: "FEEDBACK", label: "휠 감속 응답", expected: "요구 만족", faulty: "감속 부족", kind: "output" },
    ],
  },
};

function SoftwareLogicVisual({ caseId, running, works, conclusive, reference }: { caseId: CaseId; running: boolean; works: boolean; conclusive: boolean; reference: boolean }) {
  const flow = softwareFlows[caseId];
  const revealFailure = !reference && conclusive && !works;
  return <section className={`traceSwVisual ${running ? "running" : ""} ${revealFailure ? "failed" : ""}`}>
    <header><span><small>SW FUNCTION LOGIC</small><b>입력 → 검증 → 제어 계산 → 명령 → 피드백</b></span><em>{reference ? "정상 기준" : conclusive ? works ? "기준과 일치" : "최초 차이 표시" : "관측 전"}</em></header>
    <div className="traceSwCanvas">
      <div className="traceSwLane">
      {flow.nodes.map((node, index) => {
        const failed = revealFailure && index >= flow.mismatchIndex;
        const value = !reference && !conclusive ? "관측 전" : failed ? node.faulty : node.expected;
        return <React.Fragment key={`${node.stage}-${node.label}`}><article className={`traceSwNode ${node.kind ?? "process"} ${failed ? "mismatch" : ""}`}>
          <i>{String(index + 1).padStart(2, "0")}</i><span><small>{node.stage}</small><b>{node.label}</b><em>{value}</em></span><u className="inPort" /><u className="outPort" />
        </article>{index < flow.nodes.length - 1 && <div className={`traceSwLink ${running ? "live" : ""}`}><i /></div>}</React.Fragment>;
      })}
      </div>
      <div className="traceFeedbackTag"><i /> 출력 피드백이 진단·상태 경계로 되돌아갑니다</div>
    </div>
  </section>;
}

// Verification report shown before leaving the bench: test-case card with a
// PASS/FAIL stamp, "which level first catches this fault?" pick, regression list.
const LEVELS: { id: BenchTab; name: string; sub: string; icon: string }[] = [
  { id: "sw", name: "단위 검증", sub: "MIL/SIL · SW 블록만", icon: "ƒ" },
  { id: "embedded", name: "임베디드 검증", sub: "HIL · 실제 ECU·부품 신호", icon: "▣" },
  { id: "system", name: "통합 검증", sub: "여러 ECU·통신", icon: "⌘" },
  { id: "vehicle", name: "차량 검증", sub: "실차 주행", icon: "◉" },
];
const levelCheck: Record<CaseId, { answer: BenchTab; why: string; wrong: string }> = {
  propulsion: {
    answer: "sw",
    why: "신호 변환 비율(보정값)이 SW 블록 안에 있으니까, SW만 돌려 보는 단위 검증에서 바로 잡혀! 가장 싸고 빠른 단계야.",
    wrong: "그 단계에서도 보여요. 다만 원인이 SW 블록 안의 보정값이라 더 이른 단계에서 잡을 수 있어요.",
  },
  thermal: {
    answer: "embedded",
    why: "SW는 팬에 100% 명령을 잘 보내고 있어서 SW만 보면 정상이야. 실제 팬과 피드백을 연결한 HIL에서야 '명령은 있는데 안 돈다'가 보여!",
    wrong: "SW 블록만 보면 명령은 100%로 정상이라 못 잡아. 실제 부품 응답이 함께 보이는 단계가 필요해!",
  },
  brake: {
    answer: "embedded",
    why: "제동 SW는 압력 명령을 제대로 내고 있어. 실제 유압 장치와 캘리퍼 응답을 붙인 HIL에서 '명령 42 bar, 실제 8 bar'가 드러나!",
    wrong: "명령값만 보면 정상이라 SW 단계에선 안 보여. 실제 유압 응답이 보이는 단계가 필요해!",
  },
};
const regressionTests: Record<CaseId, string[]> = {
  propulsion: ["브레이크를 함께 밟으면 구동 토크 차단", "APS 두 센서 값이 어긋나면 토크 제한", "P단에서는 페달을 밟아도 토크 0"],
  thermal: ["냉각수 온도가 내려가면 팬 정지(히스테리시스)", "팬 피드백이 없으면 고장 코드·경고", "출력 제한 해제 후 정상 가속 복귀"],
  brake: ["회생 가능 범위에서는 회생 우선", "ABS 작동 시 압력 조절 정상", "브레이크 경고등 소등"],
};

function VerificationReport({ caseId, config, works, actual, onDone, onClose }: { caseId: CaseId; config: ExperimentConfig; works: boolean; actual: string; onDone: () => void; onClose: () => void }) {
  const [pick, setPick] = useState<BenchTab | null>(null);
  const check = levelCheck[caseId];
  React.useEffect(() => { const timer = window.setTimeout(() => play("stamp"), 420); return () => clearTimeout(timer); }, []);
  const correct = pick === check.answer;
  return <div className="vrOverlay" role="dialog" aria-modal="true">
    <div className="vrCard">
      <button className="vrClose" onClick={onClose} aria-label="닫기">×</button>
      <section className="vrTc">
        <small>TEST CASE · {config.requirementId}</small>
        <b className="vrReq">{config.requirement}</b>
        <ol>
          <li><em>사전 조건</em><span>{config.precondition}</span></li>
          <li><em>입력</em><span>{config.stimuli[config.target].sequence}</span></li>
          <li><em>기대 결과</em><span>{config.expected}</span></li>
          <li><em>실제 결과</em><span>{actual}</span></li>
        </ol>
        <span className={`vrStamp ${works ? "pass" : "fail"}`}>{works ? "PASS" : "FAIL"}</span>
      </section>
      <section className="vrLevels">
        <h3>🔍 이 고장은 어느 검증 단계에서 <u>처음</u> 잡을 수 있을까?</h3>
        <div className="vrLevelRow">{LEVELS.map(level => <button key={level.id} className={`${pick === level.id ? (level.id === check.answer ? "is-right" : "is-wrong") : ""} ${pick && level.id === check.answer ? "is-answer" : ""}`} onClick={() => { setPick(level.id); window.setTimeout(() => play(level.id === check.answer ? "success" : "error"), 60); }}>
          <i>{level.icon}</i><b>{level.name}</b><small>{level.sub}</small>
        </button>)}</div>
        {pick && <div className={`vrBubble ${correct ? "ok" : "hint"}`}><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>밍</b>{correct ? check.why : check.wrong}</p></div>}
      </section>
      {works && <section className="vrRegression">
        <h3>🔁 메모판에서 찾은 영향 범위 다시 확인 (회귀 검증)</h3>
        <ul>{(() => { try { const fromBoard = JSON.parse(sessionStorage.getItem(`tb-impact-${caseId}`) ?? "null"); return Array.isArray(fromBoard) && fromBoard.length ? fromBoard as string[] : regressionTests[caseId]; } catch { return regressionTests[caseId]; } })().map((name, index) => <li key={name} style={{ animationDelay: `${.15 + index * .25}s` }}><span>{name}</span><em>PASS</em></li>)}</ul>
      </section>}
      <button className="vrNext" disabled={!pick} onClick={onDone}>{!pick ? "검증 단계를 먼저 골라 보세요" : works ? "검증 완료 · 수리 적용 →" : "실패 원인 해설 보기 →"}</button>
    </div>
  </div>;
}

/** Previous bench layout (lens tabs + side-by-side visuals). Kept for reference, no longer routed. */
export function TwinBenchClassic({ state, send }: { state: Campaign; send: Send }) {
  const requestedTab = new URLSearchParams(location.search).get("tab") as BenchTab | null;
  const [tab, setTab] = useState<BenchTab>(requestedTab && lenses.some(item => item.id === requestedTab) ? requestedTab : "sw");
  const [stimulus, setStimulus] = useState<number | null>(null);
  const [probe, setProbe] = useState<ProbeId | null>(null);
  const [experimentState, setExperimentState] = useState<ExperimentState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const config = experimentConfig[state.caseId];
  const scenario = SCENARIOS[state.caseId];
  const correctCause = state.hypothesis[state.caseId] === scenario.root;
  const expectedProgram = state.caseId === "propulsion" ? "nominal" : state.caseId === "thermal" ? "thermal_closed_loop" : "blended_brake";
  const correctProgram = state.program[state.caseId] === expectedProgram;
  const works = correctCause && correctProgram;
  const selectedLens = lenses.find(item => item.id === tab)!;
  const conclusive = experimentState === "conclusive";
  const observedActual = works ? config.healthyActual : config.faultyActual;
  const choiceReady = stimulus !== null && probe !== null;
  const experimentFeedback = useMemo(() => {
    if (experimentState === "idle") return "주행 기록과 같은 시간 시퀀스를 고르고, 정상값과 실제값을 동시에 비교할 관측쌍을 정하세요.";
    if (experimentState === "running") return "같은 시험 시퀀스가 SW → ECU·I/O → 시스템 → 차량 경계를 동적으로 통과하고 있습니다.";
    if (experimentState === "inconclusive") {
      if (stimulus !== config.target) return "이 시간 시퀀스에서는 주행 중 증상이 재현되지 않았습니다. 미션의 초기조건과 입력 변화율을 다시 비교하세요.";
      return "증상은 재현됐지만 이 관측쌍만으로는 최초 불일치 경계를 분리할 수 없습니다. 앞·뒤 값이 함께 보이는 경계를 선택하세요.";
    }
    return works
      ? `기대값 ${config.expected}와 실제값 ${observedActual}이 허용 범위 안에서 일치했습니다.`
      : `${config.mismatch}에서 기대값 ${config.expected}와 실제값 ${observedActual}이 처음 갈라졌습니다.`;
  }, [config, experimentState, observedActual, probe, stimulus, works]);

  const runExperiment = () => {
    if (!choiceReady || experimentState === "running") return;
    setExperimentState("running");
    setAttempts(value => value + 1);
    window.setTimeout(() => {
      setExperimentState(stimulus === config.target && probe === config.probe ? "conclusive" : "inconclusive");
    }, 1200);
  };
  const revealAnswer = () => {
    send({ type: "DEV_SOLVE" });
    setStimulus(config.target);
    setProbe(config.probe);
    setExperimentState("conclusive");
  };
  const renderLensVisual = (reference: boolean) => {
    const displayWorks = reference ? true : conclusive ? works : true;
    const displayConclusive = reference || conclusive;
    if (tab === "sw") return <RestoredPuzzleVisual caseId={state.caseId} running={experimentState === "running"} works={reference ? true : correctProgram} reference={reference} />;
    if (tab === "embedded") return <EmbeddedBench3D caseId={state.caseId} running={experimentState === "running"} works={displayWorks} compact />;
    if (tab === "system") return <SystemNetworkVisual caseId={state.caseId} running={experimentState === "running"} works={displayWorks} conclusive={displayConclusive} />;
    return <BenchVisual tab={tab} caseId={state.caseId} running={experimentState === "running"} works={displayWorks} />;
  };

  return <div className={`verificationV3 lens-${tab}`}>
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="MING'S TRACE LAB" title="정상 기준 추적 실험" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <main className="verificationShell">
      <header className="verificationHeader">
        <div className="verificationMentor">
          <img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" />
          <span><small>ENGINEER MING · REFERENCE VS MY DESIGN</small><h1>사건을 재현하고, 값이 처음 갈라진 곳을 찾자</h1></span>
        </div>
        <div className="requirementTicket"><small>{config.requirementId}</small><b>{config.requirement}</b></div>
        <button className="verificationHelpButton" onClick={() => setHelpOpen(true)}>규칙 · 도움말</button>
      </header>

      <nav className="verificationLensTabs" aria-label="검증 관점">
        {lenses.map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
          <i>{item.id === "sw" ? "ƒ" : item.id === "embedded" ? "▣" : item.id === "system" ? "⌘" : "◉"}</i>
          <span><b>{item.label}</b><small>{item.short}</small></span>
          {conclusive && <em>✓</em>}
        </button>)}
      </nav>

      <section className="experimentStage">
        <div className="experimentVisual">
          <header title={selectedLens.observation}><span><small>OBSERVATION LENS</small><b>{selectedLens.label}</b></span><p>{selectedLens.observation}</p></header>
          <div className="experimentViewport twinComparisonViewport">
            <div className="twinCompareStage">
              <section className="comparisonPane referencePane"><header><i>✓</i><span><small>REFERENCE</small><b>정상 시나리오</b></span></header><div>{renderLensVisual(true)}</div></section>
              <section className={`comparisonPane playerPane ${conclusive ? works ? "pass" : "fail" : "pending"}`}><header><i>{conclusive ? works ? "✓" : "!" : "?"}</i><span><small>MY DESIGN</small><b>내가 복원한 설계</b></span></header><div>{renderLensVisual(false)}</div></section>
            </div>
            {experimentState === "running" && <div className="experimentScan"><i /><span>신호 경계를 추적하는 중…</span></div>}
          </div>
          <div className="comparisonInstruction"><b>비교 기준</b><span>같은 TC ID · 같은 입력</span><i>→</i><span>관점에 따라 인가점·관측점만 변경</span></div>
        </div>

        <aside className="experimentToolBay">
          <section className="validationMissionCard" title={`${config.missionBrief} · 초기조건: ${config.precondition}`}><small>DRIVING EVENT → VALIDATION MISSION</small><b>{config.missionTitle}</b><span><strong>초기조건</strong>{config.precondition}</span></section>
          <section className="experimentStep">
            <header><i>1</i><span><b>사건 재현 입력</b><small>주행 기록과 같은 시간 시퀀스를 고르세요</small></span></header>
            <div className="stimulusDial">{config.stimuli.map((item, index) => <button key={item.label} title={`${item.sequence} · ${item.hint}`} className={stimulus === index ? "active" : ""} onClick={() => { setStimulus(index); setExperimentState("idle"); }}><b>{item.label}</b><em>{item.sequence}</em></button>)}</div>
          </section>
          <section className="experimentStep">
            <header><i>2</i><span><b>차이를 잡을 관측 경계</b><small>앞·뒤 값을 함께 비교할 지점을 고르세요</small></span></header>
            <div className="probeChoices">{probeOptions.map(item => <button key={item.id} title={config.probeCopy[item.id]} className={probe === item.id ? "active" : ""} onClick={() => { setProbe(item.id); setExperimentState("idle"); }}><i>{item.icon}</i><span><b>{item.label}</b></span></button>)}</div>
          </section>
          <button className="experimentRun" disabled={!choiceReady || experimentState === "running"} onClick={runExperiment}>
            <i>{experimentState === "running" ? "…" : "▶"}</i><span><b>{experimentState === "running" ? "동적 시뮬레이션 실행 중" : "미션 시뮬레이션 실행"}</b><small>{choiceReady ? `${config.stimuli[stimulus!].sequence} · ${config.probeCopy[probe!]}` : "시퀀스와 관측쌍을 먼저 선택"}</small></span>
          </button>
        </aside>
      </section>

      <footer className={`experimentFooter ${experimentState}`}>
        <section className="experimentFinding"><i>{conclusive ? works ? "✓" : "!" : experimentState === "inconclusive" ? "?" : "⌁"}</i><span><small>{conclusive ? "CONCLUSIVE EVIDENCE" : experimentState === "inconclusive" ? "INCONCLUSIVE · 다시 설계" : "EXPERIMENT NOTE"}</small><b>{experimentFeedback}</b></span></section>
        {conclusive && <section className="traceCompare">
          <span><small>EXPECTED</small><b>{config.expected}</b></span><i>{works ? "≈" : "≠"}</i><span><small>ACTUAL</small><b>{observedActual}</b></span><em><small>FIRST MISMATCH</small><b>{works ? "없음 · 요구 충족" : config.mismatch}</b></em>
        </section>}
        {conclusive && <section className="learnedTechnique"><small>방금 사용한 검증 사고법</small><b>{config.technique}</b><p>{config.lesson}</p></section>}
        <button className="verificationContinue primary" disabled={!conclusive} onClick={() => setReportOpen(true)}>{!conclusive ? `실험 설계 ${attempts ? `· ${attempts}회 시도` : ""}` : works ? "검증 근거로 수리 적용 →" : "실패 경계 해설 보기 →"}</button>
      </footer>
    </main>
    {reportOpen && <VerificationReport caseId={state.caseId} config={config} works={works} actual={observedActual} onClose={() => setReportOpen(false)} onDone={() => send({ type: "BENCH_RESULT", pass: works, causeCorrect: correctCause })} />}
    {helpOpen && <aside className="verificationRules" role="dialog" aria-modal="true"><button onClick={() => setHelpOpen(false)} aria-label="도움말 닫기">×</button><small>HOW TO VALIDATE</small><h2>주행 사건을 하나의 시험 케이스로 재현합니다</h2><ol><li><b>미션 초기조건</b>을 확인합니다. 기어·READY·차속·온도처럼 결과를 바꾸는 조건입니다.</li><li><b>시간 시퀀스</b>를 선택합니다. 단일 값이 아니라 변화율과 유지시간까지 사건 기록과 맞춰야 합니다.</li><li><b>관측쌍</b>을 정합니다. 경계 앞·뒤 값을 동시에 비교해야 최초 불일치를 좁힐 수 있습니다.</li><li>실행 후 SW·ECU·시스템·차량 탭에서 <b>같은 TC의 인가점과 관측점이 어떻게 달라지는지</b> 확인합니다.</li></ol><p>정답을 외우는 문제가 아니라, 증상을 재현할 조건과 결함을 분리할 측정 위치를 고르는 검증 미션입니다.</p></aside>}
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}


// ===== Bench v4: one question per step =====
// 1 재현 입력 → 2 관측 경계 → 3 고치기 전 실행(FAIL 재현) → 4 고치기 → 5 다시 실행(PASS)·회귀·검증 단계
const CHAIN_PHOTO: Record<CaseId, [string, string, string]> = {
  propulsion: ["accel_pedal", "vcu", "traction_motor"],
  thermal: ["motor_temp_sensor", "thermal_ecu", "cooling_fan"],
  brake: ["brake_pedal", "brake_ecu", "brake_caliper"],
};
const WAVES: Record<CaseId, string[]> = {
  propulsion: ["M4 30 H76", "M4 30 H18 L28 12 H76", "M4 30 H16 L19 4 H76"],
  thermal: ["M4 20 H76", "M4 20 H38 L42 16 H76", "M4 26 H14 C40 24 52 10 76 6"],
  brake: ["M4 30 H20 L36 26 H76", "M4 30 H18 L30 14 H76", "M4 30 H16 L19 4 H76"],
};
type Fix = { label: string; img: string; ok: boolean; why: string };
const FIXES: Record<CaseId, Fix[]> = {
  propulsion: [
    { label: "토크 지도 값을 2.2배로 키워 보상", img: "/assets/board-photos/torque_cmd.png", ok: false, why: "증상만 가리는 땜질이야. 다른 페달 위치에선 토크가 너무 커져서 새 고장이 생겨!" },
    { label: "끼어든 '보정 계수 ×0.45' 블록 제거", img: "/assets/board-photos/pedal_processed.png", ok: true, why: "원인(설계에 없는 블록)을 없애 기준 설계와 같게 만들었어요." },
    { label: "모터 최대 출력 한계 올리기", img: "/assets/ending-thumbs/traction_motor.png", ok: false, why: "모터 한계는 원인이 아니에요. 안전 여유만 줄어들어요." },
  ],
  thermal: [
    { label: "팬 명령을 항상 100%로 고정", img: "/assets/ending-thumbs/thermal_ecu.png", ok: false, why: "명령은 이미 100%였어요. 팬이 돌지 않는 건 명령 문제가 아니에요." },
    { label: "출력 제한(보호) 기능 끄기", img: "/assets/board-photos/thermal_protection.png", ok: false, why: "위험해! 보호 기능은 고장이 아니라 과열을 막아 준 거야. 끄면 모터가 손상돼." },
    { label: "냉각 팬 모터 교체", img: "/assets/ending-thumbs/cooling_fan.png", ok: true, why: "명령·전원·신호가 모두 정상인데 돌지 않은 팬 모터 자체를 교체했어요." },
  ],
  brake: [
    { label: "캘리퍼·유압 라인 수리", img: "/assets/ending-thumbs/brake_caliper.png", ok: true, why: "명령은 42 bar로 정상이었으니 압력이 새는 유압·캘리퍼를 고쳐야 해요." },
    { label: "회생 제동을 더 세게 설정", img: "/assets/board-photos/regen_request.png", ok: false, why: "회생 제동은 배터리가 가득 차면 줄어들어요. 마찰 제동 고장을 가릴 뿐이에요." },
    { label: "압력 명령을 5배로 키우기", img: "/assets/ending-thumbs/brake_ecu.png", ok: false, why: "명령은 정상이었어요. 키우면 수리 후 과한 압력으로 바퀴가 잠길 수 있어요." },
  ],
};
const STEP_NAMES = ["재현 입력", "관측 경계", "고치기 전 실행", "고치기", "다시 실행 · 회귀"];

// Live signal monitor: every signal on the path, reference (dashed) vs this run (solid), over test time u ∈ [0, 1].
type Sig = { name: string; unit: string; zone: string; ref: (u: number) => number; fault: (u: number) => number; max: number };
const ramp = (u: number, until: number) => Math.min(1, u / until);
const lag = (u: number, delay: number, until: number) => Math.max(0, Math.min(1, (u - delay) / until));
const SIGNALS: Record<CaseId, { seconds: number; first: number; list: Sig[] }> = {
  propulsion: { seconds: 3, first: 1, list: [
    { name: "APS 페달", unit: "%", zone: "센서", ref: u => 60 * ramp(u, .1), fault: u => 60 * ramp(u, .1), max: 100 },
    { name: "VCU 페달 처리값", unit: "%", zone: "제어기 SW", ref: u => 60 * lag(u, .01, .1), fault: u => 27 * lag(u, .01, .1), max: 100 },
    { name: "토크 요청", unit: "Nm", zone: "제어기 SW", ref: u => 204 * lag(u, .02, .1), fault: u => 92 * lag(u, .02, .1), max: 260 },
    { name: "CAN 토크 명령", unit: "Nm", zone: "CAN", ref: u => 204 * lag(u, .04, .1), fault: u => 92 * lag(u, .04, .1), max: 260 },
    { name: "모터 실제 토크", unit: "Nm", zone: "부품", ref: u => 204 * lag(u, .07, .16), fault: u => 91 * lag(u, .07, .16), max: 260 },
    { name: "차량 속도", unit: "km/h", zone: "차량", ref: u => 60 + 34 * lag(u, .1, .9), fault: u => 60 + 14 * lag(u, .1, .9), max: 110 },
  ] },
  thermal: { seconds: 8, first: 3, list: [
    { name: "냉각수 온도", unit: "°C", zone: "센서", ref: u => 64 + 6 * ramp(u, .4) - 2 * lag(u, .5, .5), fault: u => 64 + 14 * ramp(u, .9), max: 90 },
    { name: "팬 명령", unit: "%", zone: "제어기 SW", ref: u => u > .08 ? 100 : 0, fault: u => u > .08 ? 100 : 0, max: 110 },
    { name: "팬 커넥터 PWM", unit: "%", zone: "E/E 배선", ref: u => u > .09 ? 100 : 0, fault: u => u > .09 ? 100 : 0, max: 110 },
    { name: "팬 실제 회전", unit: "rpm", zone: "부품", ref: u => 1850 * lag(u, .1, .12), fault: () => 0, max: 2100 },
    { name: "모터 온도", unit: "°C", zone: "부품", ref: u => 70 + 4 * ramp(u, .5), fault: u => 70 + 26 * lag(u, .3, .7), max: 110 },
  ] },
  brake: { seconds: 3, first: 3, list: [
    { name: "브레이크 페달", unit: "%", zone: "센서", ref: u => 55 * ramp(u, .2), fault: u => 55 * ramp(u, .2), max: 100 },
    { name: "제동 요청", unit: "m/s²", zone: "제어기 SW", ref: u => 3.2 * lag(u, .02, .2), fault: u => 3.2 * lag(u, .02, .2), max: 4 },
    { name: "압력 명령", unit: "bar", zone: "제어기 SW", ref: u => 42 * lag(u, .04, .2), fault: u => 42 * lag(u, .04, .2), max: 50 },
    { name: "캘리퍼 압력", unit: "bar", zone: "부품", ref: u => 42 * lag(u, .07, .2), fault: u => 8 * lag(u, .07, .2), max: 50 },
    { name: "차량 감속", unit: "m/s²", zone: "차량", ref: u => 3.2 * lag(u, .1, .2), fault: u => 1.4 * lag(u, .1, .2), max: 4 },
  ] },
};
const SIM_TABS: { id: string; label: string; sub: string }[] = [
  { id: "sw", label: "SW 로직", sub: "MIL/SIL" },
  { id: "ee", label: "E/E·ECU 신호", sub: "배선·통신" },
  { id: "hil", label: "기계 부품", sub: "HIL 벤치" },
  { id: "system", label: "시스템 통합", sub: "여러 ECU" },
  { id: "vehicle", label: "실차 주행", sub: "차량 검증" },
];

const eunNeun = (word: string) => { const h = word.replace(/[^가-힣]/g, ""); const c = h.charCodeAt(h.length - 1) - 0xac00; return c >= 0 && c % 28 ? "은" : "는"; };
/** First test time where this run leaves the reference (null = never). */
const divergeAt = (sig: Sig) => { for (let i = 0; i <= 100; i++) { const u = i / 100; if (Math.abs(sig.ref(u) - sig.fault(u)) > sig.max * .02) return u; } return null; };
function Trace({ sig, upto, fixed, probed }: { sig: Sig; upto: number; fixed: boolean; probed: boolean }) {
  const points = (fn: (u: number) => number) => Array.from({ length: 41 }, (_, i) => i / 40).filter(u => u <= upto + 1e-6).map(u => `${(u * 200).toFixed(1)},${(34 - fn(u) / sig.max * 30).toFixed(1)}`).join(" ");
  if (!probed) return <svg className="vbTrace off" viewBox="0 0 200 36"><line x1="0" y1="34" x2="200" y2="34" /></svg>;
  const d = fixed ? null : divergeAt(sig);
  return <svg className="vbTrace" viewBox="0 0 200 36"><polyline className="ref" points={points(sig.ref)} /><polyline className={`run ${fixed ? "ok" : ""}`} points={points(fixed ? sig.ref : sig.fault)} />{d !== null && upto >= d && <g className="split"><line x1={d * 200} y1="0" x2={d * 200} y2="36" /><circle cx={d * 200} cy={34 - sig.fault(d) / sig.max * 30} r="3" /></g>}</svg>;
}

export function TwinBenchExperience({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const config = experimentConfig[caseId];
  const scenario = SCENARIOS[caseId];
  const signals = SIGNALS[caseId];
  const correctCause = state.hypothesis[caseId] === scenario.root;
  const expectedProgram = caseId === "propulsion" ? "nominal" : caseId === "thermal" ? "thermal_closed_loop" : "blended_brake";
  const [step, setStep] = useState(0); // 0 재현 입력 · 1 프로브·실행 · 2 고치기 · 3 다시 실행·회귀
  const [stimulus, setStimulus] = useState<number | null>(null);
  const [probes, setProbes] = useState<number[]>([]);
  const [flag, setFlag] = useState<number | null>(null);
  const [fix, setFix] = useState<number | null>(null);
  const [u, setU] = useState(0); // simulated test time 0..1
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [simTab, setSimTab] = useState(caseId === "propulsion" ? "sw" : "hil");
  const [level, setLevel] = useState<BenchTab | null>(null);
  const [regDone, setRegDone] = useState(0);
  const [bubble, setBubble] = useState("메모판에서 찾은 고장을 시험 케이스로 재현해 보자. 먼저 주행 기록과 같은 입력을 골라!");
  const [mistakes, setMistakes] = useState(0);
  const fixed = step >= 3;
  const regression: string[] = (() => { try { const fromBoard = JSON.parse(sessionStorage.getItem(`tb-impact-${caseId}`) ?? "null"); return Array.isArray(fromBoard) && fromBoard.length ? fromBoard : regressionTests[caseId]; } catch { return regressionTests[caseId]; } })();
  const check = levelCheck[caseId];
  const nope = (text: string) => { setBubble(text); setMistakes(value => value + 1); play("error"); };

  const pickStimulus = (index: number) => {
    setStimulus(index);
    if (index !== config.target) { nope(`'${config.stimuli[index].label}' 입력으로는 사건이 재현되지 않아. 주행 기록(${config.missionTitle.replace(/하라$/, "")})과 같은 입력을 골라 봐.`); return; }
    play("stamp"); setBubble("사건과 같은 입력이에요. 보고 싶은 신호에 🔌 프로브를 꽂고 시험을 실행하세요.");
    window.setTimeout(() => setStep(1), 600);
  };
  const toggleProbe = (index: number) => {
    if (running) return;
    setProbes(previous => previous.includes(index) ? previous.filter(i => i !== index) : [...previous, index]);
    play(probes.includes(index) ? "pop" : "zip", .9 + index * .06);
  };
  const runSim = (after: boolean) => {
    if (running) return;
    setRunning(true); setRan(false); setU(0); play("zip");
    const started = performance.now();
    const tick = () => {
      const next = Math.min(1, (performance.now() - started) / 2600);
      setU(next);
      if (next < 1) requestAnimationFrame(tick);
      else {
        setRunning(false); setRan(true);
        if (!after) { play("error"); setBubble("FAIL 재현! 점선(기준)과 실선(이번)이 갈라지는 신호가 있어. 가장 먼저 갈라진 신호에 🚩를 꽂아 봐."); }
        else {
          play("stamp"); window.setTimeout(() => play("success"), 150);
          setBubble(`PASS! 모든 신호가 기준과 겹쳐. 이제 함께 쓰러졌던 곳도 다시 확인(회귀 검증)하자.`);
          regression.forEach((_, index) => window.setTimeout(() => { setRegDone(index + 1); play("pop", 1 + index * .1); }, 600 + index * 420));
        }
      }
    };
    requestAnimationFrame(tick);
  };
  const plantFlag = (index: number) => {
    if (!ran || step !== 1) return;
    setFlag(index);
    const sig = signals.list[index];
    const at = divergeAt(sig);
    const firstAt = divergeAt(signals.list[signals.first])!;
    const upstreamUnchecked = signals.list.slice(0, signals.first).some((_, i) => !probes.includes(i));
    if (at === null) { nope(`${sig.name}${eunNeun(sig.name)} 기준과 똑같이 움직였어. 갈라진 신호를 찾아봐!`); return; }
    if (index !== signals.first && at > firstAt) { nope(`${sig.name}${eunNeun(sig.name)} ⏱ ${(at * signals.seconds).toFixed(1)}s에 갈라졌어요. 더 먼저 갈라진 신호가 있다면 이건 결과예요. 빨간 세로선 위치를 비교해 봐!`); return; }
    if (index !== signals.first) { nope(`${sig.name}도 다르긴 한데, 신호가 흐르는 더 앞쪽에서 이미 갈라졌어. 앞쪽 신호를 봐!`); return; }
    if (upstreamUnchecked) { nope("앞쪽 신호를 모두 확인하지 않았어요. 거기서 먼저 갈라졌을 수 있어요. 앞쪽에도 프로브를 꽂고 다시 실행하세요."); return; }
    play("stamp"); setBubble(`${sig.name}에서 처음 갈라졌어요 — FIRST MISMATCH. 이제 수정 방법을 고르세요.`);
    window.setTimeout(() => { setStep(2); setBubble("원인을 없애는 방법을 고르세요. 증상만 가리는 임시 조치는 안 돼요."); }, 900);
  };
  const pickFix = (index: number) => {
    setFix(index);
    const item = FIXES[caseId][index];
    if (!item.ok) { nope(item.why); return; }
    play("squish"); setBubble(item.why + " 같은 시험을 다시 돌려 보자.");
    if (state.program[caseId] !== expectedProgram) send({ type: "COMPILE", program: expectedProgram });
    window.setTimeout(() => { setStep(3); setRan(false); setU(0); setProbes(signals.list.map((_, i) => i)); }, 700);
  };
  const pickLevel = (id: BenchTab) => { setLevel(id); if (id === check.answer) { play("success"); setBubble(check.why); } else { play("error"); setBubble(check.wrong); } };
  const finish = () => send({ type: "BENCH_RESULT", pass: true, causeCorrect: correctCause });
  const revealAnswer = () => { send({ type: "DEV_SOLVE" }); setStimulus(config.target); setProbes(signals.list.map((_, i) => i)); setFlag(signals.first); setFix(FIXES[caseId].findIndex(item => item.ok)); setStep(3); setU(1); setRan(true); setRegDone(regression.length); setLevel(check.answer); };
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const works = fixed;
  const simRunning = running;
  const simVisual = simTab === "sw" ? <RestoredPuzzleVisual caseId={caseId} running={simRunning} works={works} reference={false} />
    : simTab === "ee" ? <HardwareRigVisual caseId={caseId} running={simRunning} works={works} conclusive={ran} />
      : simTab === "hil" ? <EmbeddedBench3D caseId={caseId} running={simRunning} works={works} />
        : simTab === "system" ? <SystemNetworkVisual caseId={caseId} running={simRunning} works={works} conclusive={ran} />
          : <BenchVisual tab="vehicle" caseId={caseId} running={simRunning} works={works} />;

  return <div className="vbBench">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="MING'S TRACE LAB" title="정상 기준 추적 실험" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <main className="vbLayout">
      <header className="vbHead">
        <div className="vbReq"><small>{config.requirementId}</small><b>{config.requirement}</b></div>
        <ol className="vbSteps">{["사건 재현 입력", "프로브 꽂고 실행", "고치기", "다시 실행 · 회귀"].map((name, index) => <li key={name} className={index < step ? "done" : index === step ? "now" : ""}><i>{index < step ? "✓" : index + 1}</i>{name}</li>)}</ol>
      </header>

      {step === 0 && <section className="vbStage">
        <h2>🧪 사건을 재현할 <b>사건 재현 입력</b>은?</h2>
        <p className="vbSub">주행 기록: {config.missionTitle} · 초기조건 {config.precondition}</p>
        <div className="vbChoices">{config.stimuli.map((item, index) => <button key={item.label} className={stimulus === index ? index === config.target ? "right" : "wrong" : ""} onClick={() => pickStimulus(index)}>
          <svg viewBox="0 0 80 34"><path d={WAVES[caseId][index]} /></svg><b>{item.label}</b><em>{item.sequence}</em>
        </button>)}</div>
      </section>}

      {step === 2 && <section className="vbStage">
        <h2>🔧 어떻게 고칠까?</h2>
        <p className="vbSub">처음 갈라진 곳: <b>{signals.list[signals.first].name}</b> · 원인을 없애야 해요</p>
        <div className="vbChoices">{FIXES[caseId].map((item, index) => <button key={item.label} className={fix === index ? item.ok ? "right" : "wrong" : ""} onClick={() => pickFix(index)}>
          <img src={item.img} alt="" /><b>{item.label}</b>
        </button>)}</div>
      </section>}

      {(step === 1 || step === 3) && <section className="vbLab">
        <div className="vbSim">
          <nav>{SIM_TABS.map(tab => <button key={tab.id} className={simTab === tab.id ? "on" : ""} onClick={() => { setSimTab(tab.id); play("pop"); }}><b>{tab.label}</b><small>{tab.sub}</small></button>)}</nav>
          <div className={`vbSimView ${running ? "running" : ""}`}>{simVisual}{ran && <span className={`vbStamp ${fixed ? "pass" : "fail"}`}>{fixed ? "PASS" : "FAIL"}</span>}</div>
        </div>
        <div className="vbMonitor">
          <header><b>📟 신호 모니터 · 차이를 잡을 관측 경계</b><span>⏱ {(u * signals.seconds).toFixed(1)} / {signals.seconds} s</span></header>
          <p className="vbLegend"><i className="d" /> 기준 <i className="s" /> 이번 시험 · 줄을 눌러 🔌 프로브 꽂기{step === 1 && ran ? " · 🚩로 처음 갈라진 곳 표시" : ""}</p>
          <ul>{signals.list.map((sig, index) => { const probed = probes.includes(index); const value = (fixed ? sig.ref : sig.fault)(u); const off = probed && ran && Math.abs(sig.ref(1) - sig.fault(1)) > sig.max * .02 && !fixed; return <li key={sig.name} className={`${probed ? "probed" : ""} ${off ? "off" : ""} ${flag === index ? "flagged" : ""}`}>
            <button className="vbClip" onClick={() => toggleProbe(index)} title="프로브 꽂기/빼기">{probed ? "🔌" : "○"}</button>
            <span className="vbSigName"><small>{sig.zone}</small><b>{sig.name}</b></span>
            <Trace sig={sig} upto={u} fixed={fixed} probed={probed} />
            <em className="vbVal">{probed ? `${value.toFixed(sig.max < 10 ? 1 : 0)} ${sig.unit}` : "—"}</em>
            {step === 1 && ran && probed && <button className="vbFlag" onClick={() => plantFlag(index)}>🚩</button>}
          </li>; })}</ul>
          <div className="vbMonitorFoot">
            {step === 1 && <button className="vbGo" disabled={running || !probes.length} onClick={() => runSim(false)}>{running ? "시험 중…" : ran ? "▶ 다시 실행" : probes.length ? "▶ 시험 실행" : "프로브를 먼저 꽂아요"}</button>}
            {step === 3 && !ran && <button className="vbGo" disabled={running} onClick={() => runSim(true)}>{running ? "시험 중…" : "▶ 고친 설계로 다시 실행"}</button>}
          </div>
        </div>
        {step === 3 && ran && <div className="vbAfter">
          <div className="vbReg"><b>🔁 회귀 검증</b><ul>{regression.map((name, index) => <li key={name} className={index < regDone ? "ok" : ""}><span>{name}</span><em>{index < regDone ? "PASS" : "…"}</em></li>)}</ul></div>
          {regDone >= regression.length && <div className="vbLevel"><b>🏷 이 고장을 <u>처음</u> 잡을 수 있는 검증 단계는?</b><div>{LEVELS.map(item => <button key={item.id} className={level === item.id ? item.id === check.answer ? "right" : "wrong" : ""} onClick={() => pickLevel(item.id)}><i>{item.icon}</i><b>{item.name}</b><small>{item.sub}</small></button>)}</div></div>}
          {level === check.answer && <div className="vbDone"><span><small>방금 사용한 검증 사고법</small><b>{config.technique}</b></span><b className="vbStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</b><button className="vbGo" onClick={finish}>검증 완료 · 수리 적용 →</button></div>}
        </div>}
      </section>}

      <div className="vbBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>밍</b>{bubble}</p></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}
