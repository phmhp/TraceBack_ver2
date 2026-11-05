import React, { useMemo, useState, type CSSProperties } from "react";
import type { Campaign, CaseId } from "../../game/runtime";
import { SCENARIOS } from "../../game/scenarios";
import { BenchVisual, EmbeddedBench3D, RestoredPuzzleVisual, type BenchTab } from "../../experiences";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";

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
    missionTitle: "신호등 출발 가속을 그대로 재현하라",
    missionBrief: "정차 후 녹색 신호가 켜진 순간의 페달 램프 입력을 재현하고, 요청 토크가 처음 작아지는 경계를 찾습니다.",
    precondition: "READY · D2 · 차속 0 km/h · 브레이크 해제",
    stimuli: [
      { label: "무입력 유지", hint: "기준 상태만 확인", sequence: "0% · 3 s" },
      { label: "출발 가속", hint: "주행 기록과 동일", sequence: "0→60% / 0.3 s · 3 s 유지" },
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
    requirement: "모터 온도 65°C 초과 시 팬 명령과 실제 회전이 발생해야 한다.",
    missionTitle: "재출발 뒤 누적된 열부하를 재현하라",
    missionBrief: "신호 대기 후 재가속하면서 기록된 온도 상승을 재현하고, 팬 명령과 실제 회전이 갈라지는 경계를 찾습니다.",
    precondition: "READY · 냉각팬 OFF · 모터 62°C · 차량 정차",
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
    precondition: "72 km/h · D3 · SOC 82% · ABS 비활성",
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
  { id: "sw", label: "SW 로직", short: "제어 흐름", observation: "입력·검증·계산·출력 중 어느 블록에서 처음 값이 달라지는가" },
  { id: "embedded", label: "ECU·I/O", short: "제어기·하니스", observation: "입력 센서, ECU 계산, 출력 액추에이터와 피드백이 이어지는가" },
  { id: "system", label: "시스템 통합", short: "다중 ECU·기능", observation: "ECU·네트워크·플랜트가 함께 차량 기능 요구를 만족하는가" },
  { id: "vehicle", label: "차량 시나리오", short: "주행 응답", observation: "같은 입력에서 정상 기준과 실제 주행 응답이 일치하는가" },
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
    { cell: [0, 1], role: "SENSOR INPUT", label: "NTC 온도 센서", signal: "78.4°C", kind: "input" },
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
      { stage: "INPUT", label: "NTC 온도", expected: "78.4°C", faulty: "78.4°C" },
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

export function TwinBenchExperience({ state, send }: { state: Campaign; send: Send }) {
  const requestedTab = new URLSearchParams(location.search).get("tab") as BenchTab | null;
  const [tab, setTab] = useState<BenchTab>(requestedTab && lenses.some(item => item.id === requestedTab) ? requestedTab : "sw");
  const [stimulus, setStimulus] = useState<number | null>(null);
  const [probe, setProbe] = useState<ProbeId | null>(null);
  const [experimentState, setExperimentState] = useState<ExperimentState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
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
        <button className="verificationContinue primary" disabled={!conclusive} onClick={() => send({ type: "BENCH_RESULT", pass: works, causeCorrect: correctCause })}>{!conclusive ? `실험 설계 ${attempts ? `· ${attempts}회 시도` : ""}` : works ? "검증 근거로 수리 적용 →" : "실패 경계 해설 보기 →"}</button>
      </footer>
    </main>
    {helpOpen && <aside className="verificationRules" role="dialog" aria-modal="true"><button onClick={() => setHelpOpen(false)} aria-label="도움말 닫기">×</button><small>HOW TO VALIDATE</small><h2>주행 사건을 하나의 시험 케이스로 재현합니다</h2><ol><li><b>미션 초기조건</b>을 확인합니다. 기어·READY·차속·온도처럼 결과를 바꾸는 조건입니다.</li><li><b>시간 시퀀스</b>를 선택합니다. 단일 값이 아니라 변화율과 유지시간까지 사건 기록과 맞춰야 합니다.</li><li><b>관측쌍</b>을 정합니다. 경계 앞·뒤 값을 동시에 비교해야 최초 불일치를 좁힐 수 있습니다.</li><li>실행 후 SW·ECU·시스템·차량 탭에서 <b>같은 TC의 인가점과 관측점이 어떻게 달라지는지</b> 확인합니다.</li></ol><p>정답을 외우는 문제가 아니라, 증상을 재현할 조건과 결함을 분리할 측정 위치를 고르는 검증 미션입니다.</p></aside>}
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}
