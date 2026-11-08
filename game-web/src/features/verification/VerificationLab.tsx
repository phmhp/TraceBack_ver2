import React, { useMemo, useState, type CSSProperties } from "react";
import type { Campaign, CaseId } from "../../game/runtime";
import { HYP_LABEL, SCENARIOS, SCENARIO_META, judgeRun, type HypStatus, type Obs } from "../../game/scenarios";
import { BenchVisual, EmbeddedBench3D, PursuitRouteBar, RestoredPuzzleVisual, type BenchTab } from "../../experiences";
import { RefPuzzleTrack } from "../wiring/RefPuzzle";
import { StageIntro, showVerdict } from "../../ui/Verdict";
import { SAMPLES, divergeIndex, firstMismatch, simulate, type Lv, type Series, type Tech } from "./simModel";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";
import { play } from "../../ui/sfx";
import { ENGINEER } from "../../game/cast";
import { Icon } from "../../ui/Icon";

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
    why: "의심 구간이 VCU 안 SW 계산이에요. SW만 돌려 보는 단위 검증(MIL/SIL)에서 바로 관찰할 수 있어요. 가장 싸고 빠른 레벨이에요.",
    wrong: "그 단계에서도 보여요. 다만 원인이 SW 블록 안의 보정값이라 더 이른 단계에서 잡을 수 있어요.",
  },
  thermal: {
    answer: "embedded",
    why: "의심 구간이 ECU 출력단·배선·팬 모터예요. SW만 돌리면 명령 100%로 정상이라 안 보여요. 실제 ECU와 부품 신호를 붙인 HIL에서 관찰할 수 있어요.",
    wrong: "그 레벨로는 의심 구간(출력단·배선·팬 모터)을 관찰할 수 없거나, 더 이른 레벨에서 볼 수 있어요.",
  },
  brake: {
    answer: "embedded",
    why: "의심 구간이 유압 모듈·라인·캘리퍼예요. 실제 ECU와 유압 부하를 붙인 HIL에서 '명령 42 bar, 실제 8 bar'를 관찰할 수 있어요.",
    wrong: "그 레벨로는 의심 구간(유압 경로)을 관찰할 수 없거나, 더 이른 레벨에서 볼 수 있어요.",
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
        {pick && <div className={`vrBubble ${correct ? "ok" : "hint"}`}><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{correct ? check.why : check.wrong}</p></div>}
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

// Bench v6 (docs/VERIFICATION_FLOW_STANDARD.md §3–4):
// 0 검증 레벨 → 1 시험 기법 → 2 정상 시나리오 vs 현장 기록 비교(프로브·🚩) → 3 고치기 → 4 다시 실행·회귀
// ISO 26262 separates the test METHOD from how the test CASES are derived (Part 6 §9–11, Part 4 §7).
type Method = "req" | "iface" | "inject";
type Deriv = "reqa" | "equiv" | "bound" | "guess" | "usecase";
const METHODS: { id: Method; name: string; sub: string }[] = [
  { id: "req", name: "요구사항 기반 시험", sub: "요구사항이 말한 대로 동작하는지" },
  { id: "iface", name: "인터페이스 시험", sub: "주고받는 신호의 형식·범위·시점" },
  { id: "inject", name: "고장 주입 시험", sub: "일부러 고장을 넣고 반응 확인" },
];
const DERIVS: { id: Deriv; name: string; sub: string }[] = [
  { id: "reqa", name: "요구사항 분석", sub: "요구사항에서 입력·기대값을 뽑기" },
  { id: "equiv", name: "동치 분할", sub: "같은 동작을 하는 값끼리 묶어 대표값" },
  { id: "bound", name: "경계값 분석", sub: "한계·임계 바로 위아래" },
  { id: "guess", name: "오류 추정", sub: "경험상 자주 틀리는 곳" },
  { id: "usecase", name: "운용 사용 사례 분석", sub: "실제로 쓰는 조건 그대로" },
];
const TEST_ANSWER: Record<CaseId, { method: Method[]; deriv: Deriv[]; input: string; whyM: Record<Method, string>; whyD: Record<Deriv, string> }> = {
  propulsion: { method: ["req"], deriv: ["reqa", "equiv"], input: "페달 60% 계단 입력 · D단 · READY",
    whyM: { req: "요구사항 '60% → 204 Nm'를 그대로 확인하는 방법이에요. 이번 구간에 맞아요.", iface: "신호 형식·범위 문제가 아니에요. 들어오는 값은 모두 정상이었어요.", inject: "고장 주입은 고장 감지·대응 기능을 확인할 때 써요. 지금은 정상 계산과 같은지부터 봐야 해요." },
    whyD: { reqa: "요구사항 '페달 60% → 204 Nm'에서 입력과 기대값을 바로 뽑을 수 있어요.", equiv: "페달 0·30·60·100%처럼 구간별 대표값을 넣는 방법이에요. 이번 결함도 잡혀요.", bound: "임계 근처 문제가 아니에요. 60%처럼 평범한 값에서도 달라졌어요.", guess: "경험에 기대기보다 요구사항이 분명하니 거기서 뽑는 게 근거가 있어요.", usecase: "실제 주행 조건에는 다른 요인이 섞여요. 계산 구간만 볼 때는 요구사항 값이 깔끔해요." } },
  thermal: { method: ["req"], deriv: ["usecase"], input: "장시간 고속 주행 · 냉각수 64 → 78°C",
    whyM: { req: "'65°C를 넘으면 팬이 1850 rpm으로 돈다'는 요구가 실제 부품에서 지켜지는지 확인해요.", iface: "ECU 출력 신호(PWM·전원)는 정상이었어요. 형식 문제가 아니에요.", inject: "고장 주입은 '팬이 멈추면 SW가 감지·경고하는지' 볼 때 써요. 원인 확정에는 요구 동작 확인이 먼저예요." },
    whyD: { usecase: "오래 고속으로 달린 조건을 그대로 만들어야 열이 쌓이고 팬이 켜져야 하는 상황이 생겨요.", reqa: "요구 값을 순간만 넣으면 온도가 오르기 전이라 팬이 켜질 조건이 안 만들어져요.", equiv: "온도 구간별 대표값은 판단 로직 확인용이에요. 열이 쌓이는 시간이 필요해요.", bound: "65°C 경계는 이미 넘었고 팬 명령도 100%였어요. 경계 판단 문제가 아니에요.", guess: "근거 없이 고르기보다 사건이 난 사용 조건을 재현하는 게 확실해요." } },
  brake: { method: ["req"], deriv: ["bound"], input: "페달 55% · 배터리 가득(회생 0) 경계",
    whyM: { req: "'페달 55% → 3.2 m/s²' 요구가 실제 유압 경로에서 지켜지는지 확인해요.", iface: "압력 명령 신호는 42 bar로 정상이었어요. 형식 문제가 아니에요.", inject: "고장 주입은 누설을 감지·경고하는지 볼 때 써요. 원인 확정에는 요구 동작 확인이 먼저예요." },
    whyD: { bound: "배터리가 가득 차 회생이 0이 되는 경계에서는 마찰 제동이 전부를 맡아요. 유압 경로 문제가 가장 크게 드러나요.", reqa: "가능하지만 회생 제동이 일부를 메워 차이가 작게 보여요.", equiv: "대표값만으로는 회생이 섞여 마찰 쪽 차이가 흐려져요.", guess: "근거 없이 고르기보다 회생이 0이 되는 경계를 쓰는 게 확실해요.", usecase: "실제 주행 기록엔 회생이 섞여 마찰 쪽 차이가 흐려져요." } },
};
const SIM_INPUT: Record<Deriv, Tech> = { reqa: "req", equiv: "req", guess: "req", bound: "boundary", usecase: "soak" };
// v7: only test-case derivations whose input really differs in the numeric model are offered, per case,
// with the exact input that is applied (equivalence partitioning and error guessing are not performed, so not shown).
const CASE_DERIVS: Record<CaseId, { id: Deriv; tech: Tech; input: string }[]> = {
  propulsion: [
    { id: "reqa", tech: "req", input: "페달 60% 계단 입력 (요구사항 값)" },
    { id: "bound", tech: "boundary", input: "페달 100% (맵 최대 · 토크 한계 260 Nm)" },
    { id: "usecase", tech: "replay", input: "추월 구간 주행 기록 (0 → 60% 밟기)" },
  ],
  thermal: [
    { id: "reqa", tech: "req", input: "열 부하 높임 → 낮춤 (65°C 켜짐 · 60°C 꺼짐)" },
    { id: "usecase", tech: "soak", input: "장거리 고속 주행 열 부하 (사건 조건)" },
  ],
  brake: [
    { id: "reqa", tech: "req", input: "페달 55% · 회생 가능 (요구사항 값)" },
    { id: "bound", tech: "boundary", input: "페달 55% · 배터리 가득, 회생 0 (경계)" },
  ],
};
// Verification levels (what is verified) — ISO 26262-6 §9, §10, §11 and ISO 26262-4 §7.
// Test environments (where it runs: MIL/SIL/PIL/HIL/차량) are a separate axis, shown as chips.
// Names use one word ("시험") and say whether the level is SW (ISO 26262-6) or system (ISO 26262-4).
const LV: { id: Lv; name: string; group: "SW 레벨" | "시스템 레벨"; std: string; env: string[]; scope: string }[] = [
  { id: "unit", name: "SW 단위 시험", group: "SW 레벨", std: "26262-6 · 9절", env: ["MIL", "SIL", "PIL"], scope: "SW 단위 하나만 실행해요. 입력값을 직접 넣고 출력값을 봐요." },
  { id: "swint", name: "SW 통합 시험", group: "SW 레벨", std: "26262-6 · 10절", env: ["SIL", "PIL"], scope: "여러 SW 컴포넌트를 연결해 실행해요. 부품은 모델이 대신해요." },
  { id: "embedded", name: "통합 SW·제어기 I/O 시험", group: "SW 레벨", std: "26262-6 · 11절", env: ["PIL", "HIL"], scope: "통합된 SW를 제어기 입출력(핀·CAN)까지 연결해 봐요. 센서·부품은 모델이 대신해요." },
  { id: "vehicle", name: "시스템 통합 시험", group: "시스템 레벨", std: "26262-4 · 7절", env: ["HIL+실부품", "차량"], scope: "실제 부품과 제어기를 연결한 시스템을 봐요. 부품 고장이 여기서부터 보여요." },
];
const LV_ANSWER: Record<CaseId, { answer: Lv; why: string }> = {
  propulsion: { answer: "unit", why: "의심 구간이 VCU 안 SW 계산이에요. 그 SW 단위에 입력값을 인가하는 SW 단위 시험에서 바로 관찰할 수 있어요. 가장 싸고 빠른 레벨이에요." },
  thermal: { answer: "vehicle", why: "의심 구간이 출력단 뒤 배선·팬 모터 같은 실제 부품이에요. 임베디드 SW 시험까지는 HIL이 팬을 시뮬레이션해서 고장이 안 보여요. 실제 부품을 연결하는 시스템 통합 시험(HW·SW 통합)부터 관찰돼요." },
  brake: { answer: "vehicle", why: "의심 구간이 유압 모듈·라인·캘리퍼 같은 실제 부품이에요. 임베디드 SW 시험까지는 유압을 시뮬레이션해서 안 보여요. 실제 유압 부품을 연결하는 시스템 통합 시험(HW·SW 통합)부터 관찰돼요." },
};

// v6 (level → technique quiz → compare) kept unused; v7 below follows docs/REDESIGN_2026-11-08.md
export function TwinBenchV6({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const config = experimentConfig[caseId];
  const scenario = SCENARIOS[caseId];
  const tech = TEST_ANSWER[caseId];
  const lvAnswer = LV_ANSWER[caseId];
  const correctCause = state.hypothesis[caseId] === scenario.root;
  const expectedProgram = caseId === "propulsion" ? "nominal" : caseId === "thermal" ? "thermal_closed_loop" : "blended_brake";
  const section = (() => { try { return sessionStorage.getItem(`tb-section-${caseId}`) ?? ""; } catch { return ""; } })();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Lv | null>(null);
  const [method, setMethod] = useState<Method | null>(null);
  const [deriv, setDeriv] = useState<Deriv | null>(null);
  const technique: Tech | null = deriv ? SIM_INPUT[deriv] : null;
  const [probes, setProbes] = useState<string[]>([]); // "<level>:<signal id>"
  const [flag, setFlag] = useState<number | null>(null);
  const [fix, setFix] = useState<number | null>(null);
  const [u, setU] = useState(0); // test time 0..1
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState<Lv | null>(null);
  const [simTab, setSimTab] = useState<Lv>("unit");
  const [regDone, setRegDone] = useState(0);
  const [bubble, setBubble] = useState("앞에서 좁힌 구간을 검증할 차례예요. 이 구간을 처음 관찰할 수 있는 검증 레벨을 고르세요. 아래 칩은 그 레벨을 돌리는 시험 환경이에요.");
  const [mistakes, setMistakes] = useState(0);
  const fixed = step >= 4;
  const sim = useMemo(() => simulate(caseId, technique ?? SIM_INPUT[tech.deriv[0]], fixed), [caseId, technique, fixed, tech.deriv]);
  const list = sim.levels[simTab];
  const chosenList = sim.levels[level ?? lvAnswer.answer];
  const first = firstMismatch(chosenList);
  const sample = (arr: number[]) => arr[Math.min(arr.length - 1, Math.round(u * (arr.length - 1)))];
  const regression: string[] = (() => { try { const fromBoard = JSON.parse(sessionStorage.getItem(`tb-impact-${caseId}`) ?? "null"); return Array.isArray(fromBoard) && fromBoard.length ? fromBoard : regressionTests[caseId]; } catch { return regressionTests[caseId]; } })();
  const nope = (text: string) => { setBubble(text); setMistakes(value => value + 1); play("error"); };
  const order = (id: Lv) => LV.findIndex(item => item.id === id);

  const pickLevel = (id: Lv) => {
    setLevel(id);
    if (id !== lvAnswer.answer) {
      nope(order(id) < order(lvAnswer.answer)
        ? `${LV[order(id)].name}에서는 ${LV[order(id)].scope} 의심 구간(${section || "앞에서 좁힌 구간"})이 그 안에 없어서 고장이 보이지 않아요.`
        : `${LV[order(id)].name}에서도 보이지만 범위가 넓어 비싸고 느려요. 더 이른 레벨에서 관찰할 수 있어요.`);
      return;
    }
    play("stamp"); setBubble(lvAnswer.why); setSimTab(id);
    window.setTimeout(() => { setStep(1); setBubble("먼저 시험 방법을 고르고, 이어서 입력 값을 어떻게 뽑을지 고르세요."); }, 900);
  };
  const pickMethod = (id: Method) => {
    setMethod(id);
    if (!tech.method.includes(id)) { nope(tech.whyM[id]); return; }
    play("stamp"); setBubble(tech.whyM[id] + " 이제 입력 값을 어떻게 뽑을지 고르세요.");
  };
  const pickDeriv = (id: Deriv) => {
    if (!method || !tech.method.includes(method)) return;
    setDeriv(id);
    if (!tech.deriv.includes(id)) { nope(tech.whyD[id]); return; }
    play("stamp"); setBubble(tech.whyD[id]);
    window.setTimeout(() => { setStep(2); setBubble("같은 입력을 정상 설계와 현장 대상에 함께 넣어 비교해요. 보고 싶은 신호에 관측점을 꽂고 실행하세요. 다른 레벨 탭도 열어 볼 수 있어요."); }, 900);
  };
  const key = (lv: Lv, i: number) => `${lv}:${sim.levels[lv][i].id}`;
  const toggleProbe = (index: number) => {
    if (running) return;
    const k = key(simTab, index);
    setProbes(previous => previous.includes(k) ? previous.filter(item => item !== k) : [...previous, k]);
    play(probes.includes(k) ? "pop" : "zip", .9 + index * .06);
  };
  const runSim = (after: boolean) => {
    if (running) return;
    const tab = simTab;
    setRunning(true); setRan(null); setU(0); play("zip");
    const started = performance.now();
    const tick = () => {
      const next = Math.min(1, (performance.now() - started) / 2600);
      setU(next);
      if (next < 1) { requestAnimationFrame(tick); return; }
      setRunning(false); setRan(tab);
      const seen = firstMismatch(sim.levels[tab]);
      if (after) {
        play("stamp"); window.setTimeout(() => play("success"), 150);
        setBubble("PASS. 모든 신호가 정상 설계와 겹쳐요. 영향 범위로 찾은 곳도 다시 확인(회귀 시험)해요.");
        regression.forEach((_, index) => window.setTimeout(() => { setRegDone(index + 1); play("pop", 1 + index * .1); }, 600 + index * 420));
      } else if (tab !== level) {
        play(seen === null ? "pop" : "error");
        setBubble(seen === null ? `${LV[order(tab)].name}에서는 정상 설계와 현장 대상이 똑같이 움직여요. 이 레벨 안에는 고장이 없다는 뜻이에요.` : `${LV[order(tab)].name}에서도 차이가 보여요(${sim.levels[tab][seen].name}). 하지만 원인 위치를 확정하는 건 선택한 레벨(${LV[order(level!)].name})에서 해요.`);
      } else { play("error"); setBubble("FAIL 재현. 점선(정상 설계)과 실선(현장 대상)이 갈라지는 신호가 있어요. 가장 먼저 갈라진 신호에 깃발을 꽂으세요."); }
    };
    requestAnimationFrame(tick);
  };
  const plantFlag = (index: number) => {
    if (ran !== level || step !== 2 || first === null) return;
    setFlag(index);
    const sig = chosenList[index];
    const at = divergeIndex(sig);
    const firstAt = divergeIndex(chosenList[first])!;
    const upstreamUnchecked = chosenList.slice(0, first).some((_, i) => !probes.includes(key(level!, i)));
    const secs = (i: number) => (i / SAMPLES * sim.seconds).toFixed(1);
    if (at === null) { nope(`${sig.name}${eunNeun(sig.name)} 정상 설계와 똑같이 움직였어요. 갈라진 신호를 찾으세요.`); return; }
    if (index !== first && at > firstAt) { nope(`${sig.name}${eunNeun(sig.name)} ${secs(at)}${sim.timeUnit}에 갈라졌어요. 더 먼저 갈라진 신호가 있다면 이건 결과예요. 빨간 세로선 위치를 비교하세요.`); return; }
    if (index !== first) { nope(`${sig.name}도 같은 순간에 달라졌지만, 신호 흐름상 더 앞쪽 신호가 먼저예요. 앞쪽을 보세요.`); return; }
    if (upstreamUnchecked) { nope("앞쪽 신호를 모두 확인하지 않았어요. 거기서 먼저 갈라졌을 수 있어요. 앞쪽에도 프로브를 꽂고 다시 실행하세요."); return; }
    play("stamp"); setBubble(`${sig.name}에서 처음 갈라졌어요 — FIRST MISMATCH. 원인이 확정됐어요. 이제 수정 방법을 고르세요.`);
    window.setTimeout(() => { setStep(3); setBubble("원인을 없애는 방법을 고르세요. 증상만 가리는 임시 조치는 안 돼요."); }, 900);
  };
  const pickFix = (index: number) => {
    setFix(index);
    const item = FIXES[caseId][index];
    if (!item.ok) { nope(item.why); return; }
    play("squish"); setBubble(item.why + " 같은 시험을 다시 실행하세요.");
    if (state.program[caseId] !== expectedProgram) send({ type: "COMPILE", program: expectedProgram });
    window.setTimeout(() => { setStep(4); setRan(null); setU(0); setSimTab(level ?? lvAnswer.answer); setProbes(sim.levels[level ?? lvAnswer.answer].map(item => `${level ?? lvAnswer.answer}:${item.id}`)); }, 700);
  };
  const finish = () => send({ type: "BENCH_RESULT", pass: true, causeCorrect: correctCause });
  const revealAnswer = () => { send({ type: "DEV_SOLVE" }); setLevel(lvAnswer.answer); setSimTab(lvAnswer.answer); setMethod(tech.method[0]); setDeriv(tech.deriv[0]); setFix(FIXES[caseId].findIndex(item => item.ok)); setStep(4); setU(1); setRan(lvAnswer.answer); setRegDone(regression.length); setProbes(sim.levels[lvAnswer.answer].map(item => `${lvAnswer.answer}:${item.id}`)); };
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const benchWorks = fixed || firstMismatch(list) === null;
  const simVisual = simTab === "unit" || simTab === "swint" ? <RefPuzzleTrack key={simTab} mode={simTab === "unit" ? "unit" : "swint"} caseId={caseId} progress={u} fixed={fixed || firstMismatch(list) === null} running={running} />
    : simTab === "embedded" ? <EmbeddedBench3D caseId={caseId} running={running} works={benchWorks} />
      : caseId === "propulsion" ? <BenchVisual tab="vehicle" caseId={caseId} running={running} works={fixed} /> : <EmbeddedBench3D caseId={caseId} running={running} works={benchWorks} />;
  const ranHere = ran === simTab;

  return <div className="vbBench">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="SIMULATION VERIFICATION" title="시뮬레이션 검증" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <main className="vbLayout">
      <header className="vbHead">
        <div className="vbReq"><small>{section ? `의심 구간 · ${section}` : config.requirementId}</small><b>{config.requirement}</b></div>
        <ol className="vbSteps">{["검증 레벨", "시험 기법", "정상 vs 현장 비교", "고치기", "다시 실행 · 회귀"].map((name, index) => <li key={name} className={index < step ? "done" : index === step ? "now" : ""}><i>{index < step ? "✓" : index + 1}</i>{name}</li>)}</ol>
      </header>

      {step === 0 && <section className="vbStage">
        <h2><Icon name="tag" /> 이 구간을 <b>처음</b> 관찰할 수 있는 검증 레벨은?</h2>
        <p className="vbSub">{section ? `의심 구간: ${section}` : "앞 단계에서 좁힌 구간"} · 왼쪽일수록 범위가 좁고 싸고 빨라요</p>
        <div className="vbChoices four vbLevels">{LV.map((item, index) => <React.Fragment key={item.id}>{index > 0 && <i className="vbLvArrow">→</i>}<button className={level === item.id ? item.id === lvAnswer.answer ? "right" : "wrong" : ""} onClick={() => pickLevel(item.id)}><small className="vbGroup">{item.group}</small><b>{item.name}</b><em>{item.std}</em><span className="vbEnvRow">{item.env.map(env => <i key={env} className="vbEnv">{env}</i>)}</span></button></React.Fragment>)}</div>
      </section>}

      {step === 1 && <section className="vbStage">
        <h2>어떻게 시험할까요?</h2>
        <p className="vbSub">사건 특징: {scenario.symptom}</p>
        <div className="vbAsk"><small>① 시험 방법</small><div className="vbChoices compact">{METHODS.map(item => <button key={item.id} className={method === item.id ? tech.method.includes(item.id) ? "right" : "wrong" : ""} onClick={() => pickMethod(item.id)}><b>{item.name}</b><em>{item.sub}</em></button>)}</div></div>
        <div className={`vbAsk ${method && tech.method.includes(method) ? "" : "locked"}`}><small>② 테스트 케이스 도출 (입력 값을 뽑는 방법)</small><div className="vbChoices compact">{DERIVS.map(item => <button key={item.id} className={deriv === item.id ? tech.deriv.includes(item.id) ? "right" : "wrong" : ""} onClick={() => pickDeriv(item.id)}><b>{item.name}</b><em>{item.sub}</em></button>)}</div></div>
      </section>}

      {step === 3 && <section className="vbStage">
        <h2><Icon name="wrench" /> 어떻게 고칠까요?</h2>
        <p className="vbSub">처음 갈라진 곳: <b>{first !== null ? chosenList[first].name : "-"}</b> · 원인을 없애야 해요</p>
        <div className="vbChoices">{FIXES[caseId].map((item, index) => <button key={item.label} className={fix === index ? item.ok ? "right" : "wrong" : ""} onClick={() => pickFix(index)}>
          <img src={item.img} alt="" /><b>{item.label}</b>
        </button>)}</div>
      </section>}

      {(step === 2 || step === 4) && <section className="vbLab">
        <div className="vbSim">
          <nav>{LV.map(tab => <button key={tab.id} className={`${simTab === tab.id ? "on" : ""} ${level === tab.id ? "chosen" : ""}`} onClick={() => { if (running) return; setSimTab(tab.id); setU(ran === tab.id ? 1 : 0); play("pop"); }}><b>{tab.name}</b><small>{tab.env.map(env => <i key={env} className="vbEnv">{env}</i>)}{level === tab.id ? " ✓" : ""}</small></button>)}</nav>
          <div className={`vbSimView ${running ? "running" : ""}`}>{simVisual}{ranHere && <span className={`vbStamp ${firstMismatch(list) === null ? "pass" : "fail"}`}>{firstMismatch(list) === null ? "PASS" : "FAIL"}</span>}</div>
          <p className="vbScope"><b>{LV[order(simTab)].std}</b> {LV[order(simTab)].scope}</p>
        </div>
        <div className="vbMonitor">
          <header><b><Icon name="monitor" /> 신호 모니터 · 차이를 잡을 관측 경계 · {LV[order(simTab)].name}</b><span><Icon name="clock" /> {(u * sim.seconds).toFixed(1)} / {sim.seconds} {sim.timeUnit}</span></header>
          <p className="vbLegend">입력: {tech.input} · <i className="d" /> 정상 설계 <i className="s" /> {fixed ? "고친 설계" : "현장 대상"} · 줄을 눌러 관측점 꽂기{step === 2 && ranHere && simTab === level ? " · 깃발 = 처음 갈라진 곳" : ""}</p>
          <ul>{list.map((sig, index) => { const probed = probes.includes(key(simTab, index)); const value = sample(sig.run); const off = probed && ranHere && divergeIndex(sig) !== null; return <li key={sig.id} className={`${probed ? "probed" : ""} ${off ? "off" : ""} ${flag === index && simTab === level ? "flagged" : ""}`}>
            <button className="vbClip" onClick={() => toggleProbe(index)} title="관측점 꽂기/빼기">{probed ? <Icon name="probe" /> : "○"}</button>
            <span className="vbSigName"><small>{index === 0 ? "입력 쪽" : index === list.length - 1 ? "출력 쪽" : `${index + 1}번째`}</small><b>{sig.name}</b></span>
            <SeriesTrace sig={sig} upto={u} probed={probed} />
            <em className="vbVal">{probed ? `${value.toFixed(sig.max < 10 ? 1 : 0)} ${sig.unit}` : "—"}</em>
            {step === 2 && ranHere && simTab === level && probed && <button className="vbFlag" onClick={() => plantFlag(index)}><Icon name="flag" /></button>}
          </li>; })}</ul>
          <div className="vbMonitorFoot">
            {step === 2 && <button className="vbGo" disabled={running || !list.some((_, i) => probes.includes(key(simTab, i)))} onClick={() => runSim(false)}>{running ? "시험 중…" : ranHere ? "▶ 다시 실행" : list.some((_, i) => probes.includes(key(simTab, i))) ? "▶ 시험 실행" : "프로브를 먼저 꽂아요"}</button>}
            {step === 4 && !ranHere && <button className="vbGo" disabled={running} onClick={() => runSim(true)}>{running ? "시험 중…" : "▶ 고친 설계로 다시 실행"}</button>}
          </div>
        </div>
        {step === 4 && ran && <div className="vbAfter">
          <div className="vbReg"><b><Icon name="repeat" /> 회귀 시험 (영향 범위)</b><ul>{regression.map((name, index) => <li key={name} className={index < regDone ? "ok" : ""}><span>{name}</span><em>{index < regDone ? "PASS" : "…"}</em></li>)}</ul></div>
          {regDone >= regression.length && <div className="vbDone"><span><small>방금 사용한 검증 사고법</small><b>{LV[order(level ?? lvAnswer.answer)].name} · {METHODS.find(item => item.id === method)?.name} · {DERIVS.find(item => item.id === deriv)?.name} → FIRST MISMATCH → 근본 수정 → 회귀</b></span><b className="vbStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</b><button className="vbGo" onClick={finish}>검증 완료 · 수리 적용 →</button></div>}
        </div>}
      </section>}

      <div className="vbBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{bubble}</p></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}

/** Reference (dashed) vs this run (solid) from computed samples; red line = first divergence. */
function SeriesTrace({ sig, upto, probed }: { sig: Series; upto: number; probed: boolean }) {
  if (!probed) return <svg className="vbTrace off" viewBox="0 0 200 36"><line x1="0" y1="34" x2="200" y2="34" /></svg>;
  const n = sig.ref.length - 1, last = Math.round(upto * n);
  const pts = (arr: number[]) => arr.slice(0, last + 1).map((v, i) => `${(i / n * 200).toFixed(1)},${(34 - clampTo(v / sig.max) * 30).toFixed(1)}`).join(" ");
  const d = divergeIndex(sig);
  return <svg className="vbTrace" viewBox="0 0 200 36"><polyline className="ref" points={pts(sig.ref)} /><polyline className={`run ${d === null ? "ok" : ""}`} points={pts(sig.run)} />{d !== null && last >= d && <g className="split"><line x1={d / n * 200} y1="0" x2={d / n * 200} y2="36" /><circle cx={d / n * 200} cy={34 - clampTo(sig.run[d] / sig.max) * 30} r="3" /></g>}</svg>;
}
const clampTo = (v: number) => Math.max(0, Math.min(1.05, v));

// ===== Bench v7 (docs/REDESIGN_2026-11-08.md §2) =====
// Mission A · 정상 시나리오 확인: requirement input — does this level behave as the requirement says?
// Mission B · 고장 재현: field condition — does the same symptom come back, and where does it first split?
// Every choice runs for real (no locked "answer"); stars come from the total test cost.
const LV_COST: Record<Lv, number> = { unit: 1, swint: 2, embedded: 3, vehicle: 5 };
const BEST_COST: Record<CaseId, number> = { propulsion: 2, thermal: 10, brake: 10 };
const ROOT_SIGNAL: Record<CaseId, string> = { propulsion: "proc", thermal: "rpm", brake: "line" };
const PROBE_LIMIT = 3;
const REQ_DERIV: Deriv[] = ["reqa", "equiv", "bound"];
type Verdict = "PASS" | "FAIL" | "INCONCLUSIVE";
type RunLog = { mission: "A" | "B" | "C"; level: Lv; deriv: Deriv; pass: boolean; verdict: Verdict; first?: string; obs: Record<string, Obs>; vals?: Record<string, string> };
const VERDICT_KO: Record<Verdict, string> = { PASS: "PASS", FAIL: "FAIL", INCONCLUSIVE: "판단 불가" };
/** Only what was probed counts: same / higher / lower than the reference at the first split. */
function observe(list: Series[], probedIds: string[]) {
  const obs: Record<string, Obs> = {};
  list.forEach(sig => { if (!probedIds.includes(sig.id)) return; const d = divergeIndex(sig); obs[sig.id] = d === null ? "same" : sig.run[d] > sig.ref[d] ? "higher" : "lower"; });
  const anyDiff = Object.values(obs).some(v => v !== "same");
  const verdict: Verdict = anyDiff ? "FAIL" : obs[list[list.length - 1].id] ? "PASS" : "INCONCLUSIVE";
  return { obs, verdict };
}

export function TwinBenchExperience({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const config = experimentConfig[caseId];
  const scenario = SCENARIOS[caseId];
  const tech = TEST_ANSWER[caseId];
  const correctCause = state.hypothesis[caseId] === scenario.root;
  const expectedProgram = caseId === "propulsion" ? "nominal" : caseId === "thermal" ? "thermal_closed_loop" : "blended_brake";
  const section = (() => { try { return sessionStorage.getItem(`tb-section-${caseId}`) ?? ""; } catch { return ""; } })();
  const [mission, setMission] = useState<"A" | "B" | "fix" | "C" | "done">("A");
  const [phase, setPhase] = useState<"level" | "input" | "lab">("level");
  const [noteOpen, setNoteOpen] = useState(false);
  const [level, setLevel] = useState<Lv>("unit");
  const [method, setMethod] = useState<Method>("req");
  const [deriv, setDeriv] = useState<Deriv>("reqa");
  const [probes, setProbes] = useState<string[]>([]);
  const [u, setU] = useState(0);
  const [running, setRunning] = useState(false);
  const [ranKey, setRanKey] = useState<string | null>(null);
  const [log, setLog] = useState<RunLog[]>([]);
  const [failLevel, setFailLevel] = useState<Lv | null>(null);
  const [flag, setFlag] = useState<number | null>(null);
  const [fix, setFix] = useState<number | null>(null);
  const [regDone, setRegDone] = useState(0);
  const [judgeMistakes, setJudgeMistakes] = useState(0);
  const [bubble, setBubble] = useState("미션 A: 요구사항 입력을 넣어 요구사항대로 동작하는지 확인합니다. 시험 레벨과 입력을 고르고, 관측점을 꽂은 뒤 실행하세요.");
  const fixed = mission === "C" || mission === "done";
  const derivs = CASE_DERIVS[caseId];
  const derivNow = derivs.find(item => item.id === deriv) ?? derivs[0];
  const sim = useMemo(() => simulate(caseId, derivNow.tech, fixed), [caseId, derivNow.tech, fixed]);
  const list = sim.levels[level];
  const runKey = `${mission}:${level}:${deriv}`;
  const ran = ranKey === runKey;
  const cost = log.filter(item => item.mission !== "C").reduce((sum, item) => sum + LV_COST[item.level], 0); // re-test after the fix is not counted
  const stars = Math.max(1, (cost <= BEST_COST[caseId] + 2 ? 3 : cost <= BEST_COST[caseId] + 7 ? 2 : 1) - (judgeMistakes >= 2 ? 1 : 0));
  const key = (i: number) => `${level}:${list[i].id}`;
  const probed = list.map((_, i) => probes.includes(key(i)));
  const probeCount = probed.filter(Boolean).length;
  const order = (id: Lv) => LV.findIndex(item => item.id === id);
  const regression: string[] = (() => { try { const fromBoard = JSON.parse(sessionStorage.getItem(`tb-impact-${caseId}`) ?? "null"); return Array.isArray(fromBoard) && fromBoard.length ? fromBoard : regressionTests[caseId]; } catch { return regressionTests[caseId]; } })();
  const sample = (arr: number[]) => arr[Math.min(arr.length - 1, Math.round(u * (arr.length - 1)))];
  // Hypotheses change only when the PLAYER judges a run correctly (judgment note); stage-1 refutations carry over.
  const meta = SCENARIO_META[caseId];
  const [judged, setJudged] = useState<Record<string, { status: "supported" | "refuted"; why: string; evidence: string }>>(() =>
    Object.fromEntries(meta.hypotheses.filter(h => h.stage1).map(h => [h.id, { status: "refuted" as const, why: h.stage1!, evidence: "1단계 원인 역추적 측정" }])));
  const [note, setNote] = useState<{ run: number; done: Record<string, boolean> } | null>(null);
  const hyps = meta.hypotheses.map(h => {
    const j = judged[h.id];
    const status: HypStatus = j ? j.status : log.some(item => item.mission !== "C") ? "open" : "untested";
    return { ...h, status, why: j?.why ?? "", evidence: j?.evidence ?? "" };
  });
  const [hypOpen, setHypOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"sw" | "ecu" | "plant">("sw");
  const lastVerdict = ran ? log[log.length - 1]?.verdict : undefined;

  const pickLevel = (id: Lv) => { if (running) return; setLevel(id); setViewTab(id === "unit" || id === "swint" ? "sw" : id === "embedded" ? "ecu" : "plant"); setU(0); setFlag(null); play("pop"); setPhase("input"); };
  const pickDeriv = (id: Deriv) => {
    if (running) return; setDeriv(id); setU(0); play("pop"); setPhase("lab");
    if (mission === "A" && !REQ_DERIV.includes(id)) setBubble("이 입력은 실제 사용 조건이에요. 미션 A(요구사항대로 동작하나)보다는 미션 B(고장 재현)에 맞아요. 그래도 실행은 할 수 있어요.");
    else if (mission === "B" && REQ_DERIV.includes(id) && id !== "bound") setBubble("요구사항 입력은 정상 동작 확인용이에요. 고장을 재현하려면 사건이 난 조건(운용 사용 사례·경계값)을 쓰는 게 좋아요.");
  };
  const toggleProbe = (i: number) => {
    if (running) return;
    const k = key(i);
    if (probes.includes(k)) { setProbes(p => p.filter(x => x !== k)); play("pop"); return; }
    if (probeCount >= PROBE_LIMIT) { setBubble(`관측점은 한 번에 ${PROBE_LIMIT}개까지 꽂을 수 있어요. 입력 쪽 1개와 출력 쪽 1개는 꼭 넣고, 남은 하나로 의심 지점을 보세요.`); play("error"); return; }
    setProbes(p => [...p, k]); play("zip", .9 + i * .06);
  };
  const run = () => {
    if (running || !probeCount) return;
    setRunning(true); setU(0); setFlag(null); play("zip");
    const started = performance.now(), m = mission, lv = level, d = deriv, lst = list;
    const tick = () => {
      const next = Math.min(1, (performance.now() - started) / 2600);
      setU(next);
      if (next < 1) { requestAnimationFrame(tick); return; }
      setRunning(false); setRanKey(`${m}:${lv}:${d}`);
      const first = firstMismatch(lst);
      const { obs, verdict } = observe(lst, lst.filter(sig => probes.includes(`${lv}:${sig.id}`)).map(sig => sig.id));
      const pass = verdict === "PASS";
      const seenFirst = first !== null && lst.slice(0, first + 1).some((_, i) => probes.includes(`${lv}:${lst[i].id}`)) ? lst[first].name : undefined;
      const vals = Object.fromEntries(lst.filter(sig => obs[sig.id]).map(sig => { const at = divergeIndex(sig) !== null ? sig.ref.reduce((best, v, i) => (Math.abs(v - sig.run[i]) > Math.abs(sig.ref[best] - sig.run[best]) ? i : best), 0) : sig.ref.reduce((best, v, i) => (v > sig.ref[best] ? i : best), 0), f = (v: number) => v.toFixed(sig.max < 10 ? 1 : 0); return [sig.id, `${sig.name} ${f(sig.run[at])} ${sig.unit} (기준 ${f(sig.ref[at])})`]; }));
      setLog(l => { if (m !== "C" && verdict !== "INCONCLUSIVE") setNote({ run: l.length, done: {} }); return [...l, { mission: m === "C" ? "C" : m === "B" ? "B" : "A", level: lv, deriv: d, pass, verdict, first: seenFirst, obs, vals }]; });
      const lvName = LV[order(lv)].name;
      if (verdict === "INCONCLUSIVE") { play("pop"); setBubble(`${lvName}: 판단 불가. 꽂은 관측점은 모두 기준과 같지만 출력 쪽을 보지 않아서 기대 결과와 비교할 수 없어요. 출력 쪽 신호에 관측점을 꽂으세요.`); return; }
      if (m === "A") {
        if (pass) { play("pop"); setBubble(`${lvName}: PASS. 이 레벨 범위는 요구사항대로 동작해요. 판정 노트에서 이 결과가 각 가설에 무엇을 뜻하는지 판정하세요.`); }
        else { play("error"); setFailLevel(lv); setBubble(`${lvName}: FAIL. 요구사항 입력인데 기대값과 다르게 동작했어요. 결함이 이 레벨 안에 있다는 뜻이에요. 미션 B로 같은 증상이 재현되는지, 어디서 처음 갈라지는지 확인하세요.`); }
      } else if (m === "B") {
        if (pass) { play("pop"); setBubble(`${lvName}에서는 증상이 재현되지 않아요. 이 레벨에서 고장 원인이 보이지 않는다는 뜻이에요.`); }
        else { play("error"); setBubble("증상 재현. 먼저 판정 노트에서 이 결과가 각 가설에 무엇을 뜻하는지 판정하세요. 그다음 가장 먼저 갈라진 신호에 깃발을 꽂아요."); }
      } else {
        if (pass) { play("stamp"); window.setTimeout(() => play("success"), 150); setBubble("PASS. 고친 설계는 같은 시험에서 기대값과 같아요. 영향 범위로 찾은 곳도 회귀 시험해요."); regression.forEach((_, i) => window.setTimeout(() => { setRegDone(i + 1); play("pop", 1 + i * .1); }, 600 + i * 420)); window.setTimeout(() => setMission("done"), 700 + regression.length * 420); }
        else setBubble("아직 기대값과 달라요. 수정을 다시 고르세요.");
      }
    };
    requestAnimationFrame(tick);
  };
  const judgeNow = note ? judgeRun(caseId, { level: log[note.run].level, fixed: false, obs: log[note.run].obs }) : [];
  const noteRows = note ? hyps.filter(h => !judged[h.id] && !note.done[h.id]) : [];
  const answer = (hypId: string, pick: "supported" | "refuted" | "open") => {
    if (!note) return;
    const key = judgeNow.find(item => item.id === hypId)!;
    const h = meta.hypotheses.find(item => item.id === hypId)!;
    const runItem = log[note.run];
    if (pick !== key.verdict) {
      setJudgeMistakes(n => n + 1); showVerdict(false);
      setBubble(key.verdict === "open"
        ? `'${h.label}'${eunNeun(h.label)} 이 시험으로는 가를 수 없어요. 이 가설이 맞든 틀리든 지금 관측한 값은 똑같이 나와요. ${LV[order(runItem.level)].scope}`
        : `다시 보세요. ${key.why} 그래서 '${h.label}'${eunNeun(h.label)} ${key.verdict === "supported" ? "지지돼요" : "반박돼요"}.`);
      return;
    }
    play(pick === "open" ? "pop" : "stamp");
    if (pick === "open") setBubble(`맞아요. 이 시험은 '${h.label}'${eunNeun(h.label)} 가르지 못해요. 다른 레벨이나 관측점이 필요해요.`);
    else {
      const evidence = `${LV[order(runItem.level)].name} · ${DERIVS.find(d => d.id === runItem.deriv)?.name} · ${key.need.map(id => runItem.vals?.[id]).filter(Boolean).join(", ")}`;
      setJudged(prev => ({ ...prev, [hypId]: { status: pick, why: key.why, evidence } }));
      showVerdict(true, pick === "supported" ? "지지" : "반박");
      setBubble(`${key.why} → '${h.label}' ${pick === "supported" ? "지지" : "반박"}.`);
    }
    setNote(prev => prev && { ...prev, done: { ...prev.done, [hypId]: true } });
  };
  const plantFlag = (i: number) => {
    if (mission !== "B" || !ran) return;
    setFlag(i);
    const first = firstMismatch(list);
    const sig = list[i];
    if (first === null) return;
    if (i !== first) { setBubble(`${sig.name}${eunNeun(sig.name)} 가장 먼저 갈라진 신호가 아니에요. 빨간 세로선이 가장 왼쪽에 있는 신호를 찾으세요.`); showVerdict(false); return; }
    const upstreamProbed = first === 0 || list.slice(0, first).some((_, k) => probes.includes(key(k)));
    if (!upstreamProbed) { setBubble("앞쪽 신호를 하나도 보지 않아서, 여기서 처음 갈라졌는지 확신할 수 없어요. 앞쪽에 관측점을 하나 꽂고 다시 실행하세요."); showVerdict(false); return; }
    if (sig.id !== ROOT_SIGNAL[caseId]) { setBubble(`이 레벨에서 처음 갈라진 곳은 ${sig.name}예요. 하지만 이 레벨에서는 그 앞의 계산이나 부품을 볼 수 없어요. 더 안쪽을 관찰할 수 있는 레벨에서 다시 확인하세요.`); showVerdict(false, "더 안쪽"); return; }
    const open = hyps.filter(h => h.truth ? h.status !== "supported" : h.status !== "refuted");
    if (noteRows.length) { setBubble("판정 노트를 먼저 끝내세요. 이번 결과가 각 가설에 무엇을 뜻하는지 정해야 결론을 낼 수 있어요."); showVerdict(false); return; }
    if (open.length) { setBubble(`처음 갈라진 곳은 맞아요. 하지만 아직 근거로 정리하지 못한 가설이 있어요: ${open.map(h => h.label).join(", ")}. 이 가설을 가를 관측점을 꽂고 다시 시험한 뒤 판정하세요.`); showVerdict(false, "추가 증거 필요"); return; }
    showVerdict(true, "원인 확정"); setBubble(`${sig.name}에서 처음 갈라졌고, 근거로 남은 가설은 '${hyps.find(h => h.truth)!.label}' 하나예요. 검증 결과 보고서를 확인하고 수정 담당에 요청할 조치를 고르세요.`);
    window.setTimeout(() => setMission("fix"), 900);
  };
  const pickFix = (i: number) => {
    setFix(i);
    const item = FIXES[caseId][i];
    if (!item.ok) { setBubble(item.why); showVerdict(false); return; }
    showVerdict(true); setBubble(item.why + " 같은 레벨·같은 입력으로 다시 시험하세요.");
    if (state.program[caseId] !== expectedProgram) send({ type: "COMPILE", program: expectedProgram });
    window.setTimeout(() => { setMission("C"); setPhase("lab"); setU(0); setRanKey(null); }, 700);
  };
  const goB = () => { setPhase("input"); setMission("B"); setDeriv(tech.deriv[0] === "reqa" ? "usecase" : tech.deriv[0]); if (failLevel) setLevel(failLevel); setU(0); setRanKey(null); setBubble("미션 B: 사건이 난 조건을 입력으로 넣어 같은 증상이 나오는지 확인하고, 처음 갈라진 신호를 지목하세요."); play("pop"); };
  const finish = () => send({ type: "BENCH_RESULT", pass: true, causeCorrect: correctCause });
  const revealAnswer = () => { send({ type: "DEV_SOLVE" }); setLevel(LV_ANSWER[caseId].answer); setMission("done"); setFix(FIXES[caseId].findIndex(item => item.ok)); setRegDone(regression.length); setLog([{ mission: "A", level: LV_ANSWER[caseId].answer, deriv: "reqa", pass: false, verdict: "FAIL", obs: {} }]); setJudged(Object.fromEntries(meta.hypotheses.map(h => [h.id, { status: h.truth ? "supported" as const : "refuted" as const, why: h.stage1 ?? h.rules[0]?.why ?? "", evidence: "개발용 정답" }]))); };
  const fixedView = fixed || firstMismatch(list) === null;
  const simVisual = level === "unit" || level === "swint" ? <RefPuzzleTrack key={level} mode={level === "unit" ? "unit" : "swint"} caseId={caseId} progress={u} fixed={fixed} same={firstMismatch(list) === null} running={running} />
    : level === "embedded" ? <EmbeddedBench3D caseId={caseId} running={running} works={fixedView} />
      : caseId === "propulsion" ? <BenchVisual tab="vehicle" caseId={caseId} running={running} works={fixed} /> : <EmbeddedBench3D caseId={caseId} running={running} works={fixedView} />;
  // Left view tabs: the same run seen as SW logic / controller & I/O / parts & vehicle.
  // Parts that are not connected at this level are shown as models with a note.
  const swSame = firstMismatch(sim.levels.unit) === null;
  const ecuReal = level === "embedded" || level === "vehicle", plantReal = level === "vehicle";
  const tabVisual = viewTab === "sw" ? <RefPuzzleTrack key={`sw-${level}`} mode={level === "unit" ? "unit" : "swint"} caseId={caseId} progress={u} fixed={fixed} same={fixed || swSame} running={running} />
    : viewTab === "ecu" ? <EmbeddedBench3D caseId={caseId} running={running} works={ecuReal ? fixedView : true} />
      : caseId === "propulsion" ? <BenchVisual tab="vehicle" caseId={caseId} running={running} works={plantReal ? fixed || firstMismatch(list) === null : true} /> : <EmbeddedBench3D caseId={caseId} running={running} works={plantReal ? fixedView : true} />;
  const tabNote = viewTab === "ecu" && !ecuReal ? "이 레벨에서는 제어기 하드웨어가 연결되지 않아요. SW만 PC에서 실행해요."
    : viewTab === "plant" && !plantReal ? "이 레벨에서는 부품·차량이 모델로 대체돼요. 실제 부품 고장은 여기서 보이지 않아요." : "";
  const missions = [["A", "정상 시나리오 확인"], ["B", "고장 재현·원인 확정"], ["fix", "수정"], ["C", "재시험·회귀"]] as const;
  const mIndex = mission === "done" ? 4 : missions.findIndex(([id]) => id === mission);
  const todo = mission === "A" ? ["시험 레벨 고르기", "입력값 고르기", `관측점 꽂기 (최대 ${PROBE_LIMIT}개)`, "실행 → PASS/FAIL 판정"]
    : mission === "B" ? ["사건 조건 입력 고르기", "입력 쪽·출력 쪽 관측점", "실행", "가장 먼저 갈라진 신호에 깃발"]
      : mission === "C" ? ["같은 레벨·입력으로 실행", "PASS 확인", "회귀 시험"] : [];

  const missionLabel = mission === "A" ? "미션 A · 정상 시나리오 확인" : mission === "B" ? "미션 B · 고장 재현" : mission === "C" ? "재시험 · 회귀" : mission === "fix" ? "결과 보고 · 조치 요청" : "완료";
  const missionGoal = mission === "A" ? "요구사항 입력을 넣었을 때 요구사항대로 동작하는지 확인합니다. FAIL이 나오는 레벨에 결함이 있어요."
    : mission === "B" ? "사건이 난 조건을 넣어 같은 증상을 재현하고, 가장 먼저 갈라지는 신호를 찾아 원인을 확정합니다."
      : mission === "C" ? "고친 설계를 같은 조건으로 다시 시험하고, 영향 범위를 회귀 시험합니다." : "";
  const plan = <div className="v7Plan">
    <span className="v7PlanMission">{missionLabel}</span>
    {mission !== "fix" && mission !== "done" && <>
      <button className={`v7Card ${phase === "level" ? "now" : ""}`} disabled={running || mission === "C"} onClick={() => setPhase("level")}><small>시험 레벨</small><b>{LV[order(level)].name}</b></button>
      <i>→</i>
      <button className={`v7Card ${phase === "input" ? "now" : ""}`} disabled={running || mission === "C" || phase === "level"} onClick={() => setPhase("input")}><small>입력값</small><b>{phase === "level" ? "?" : `${DERIVS.find(d => d.id === deriv)?.name}`}</b></button>
      <i>→</i>
      <span className={`v7Card ${phase === "lab" ? "now" : ""}`}><small>시험</small><b>{phase === "lab" ? `관측점 ${probeCount}/${PROBE_LIMIT}` : "?"}</b></span>
    </>}
    <button className="v7NoteBtn" onClick={() => setNoteOpen(v => !v)}><Icon name="clipboard" /> 실험 노트 {log.length}</button>
    <div className="v7Hyp" onClick={() => setHypOpen(v => !v)} title="가설별 근거 보기">
      <small>가설</small>
      {hyps.map(h => <span key={h.id} className={`hyp-${h.status}`}><b>{h.label}</b><em>{HYP_LABEL[h.status]}</em></span>)}
    </div>
    {hypOpen && <div className="v7NotePop v7HypPop"><ul>{hyps.map(h => <li key={h.id} className={`hyp-${h.status}`}><b>{HYP_LABEL[h.status]}</b><span><strong>{h.label}</strong>{h.why || "아직 판정하지 않았어요."}{h.evidence && <small> · 근거: {h.evidence}</small>}</span></li>)}</ul></div>}
    <span className="v7CostChip">비용 {cost} · {"★".repeat(stars)}{"☆".repeat(3 - stars)}</span>
    {noteOpen && <div className="v7NotePop">{log.length === 0 ? <p>아직 실행한 시험이 없어요.</p> : <ul>{log.map((item, k) => <li key={k} className={item.pass ? "pass" : "fail"}><b>{item.mission}</b><span>{LV[order(item.level)].name} · {DERIVS.find(d => d.id === item.deriv)?.name}</span><em>{item.verdict === "FAIL" ? `FAIL${item.first ? ` · ${item.first}` : ""}` : VERDICT_KO[item.verdict]}</em></li>)}</ul>}</div>}
  </div>;

  return <div className="vbBench v7">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="SIMULATION VERIFICATION" title="시뮬레이션 검증" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <StageIntro id="bench" title="시뮬레이션 검증" goal="의심 구간을 실제로 시험해서 원인을 증명하는 단계예요." steps={[
      { icon: "monitor", text: "레벨·입력·관측점을 골라 시험해요. 왼쪽 탭으로 같은 결과를 SW·제어기·부품 관점에서 볼 수 있어요." },
      { icon: "clipboard", text: "시험이 끝나면 판정 노트에서 결과가 각 가설을 지지하는지, 반박하는지, 판단할 수 없는지 직접 골라요." },
      { icon: "flag", text: "근거로 원인 하나만 남으면 처음 갈라진 신호에 깃발 → 검증 결과 보고서 → 조치 요청 → 재시험." },
    ]} />
    <main className="vbLayout">
      {plan}
      {mission === "fix" ? <section className="vbStage v7Fix">
        <article className="v7Report">
          <header><small>검증 결과 보고 · 고객사 회신용</small><b>원인: {hyps.find(h => h.truth)!.label}</b></header>
          <ul>{hyps.map(h => <li key={h.id} className={`hyp-${h.status}`}><em>{h.truth ? "문제 있음" : "문제 없음"}</em><span><strong>{h.label}</strong>{h.why}<small>근거: {h.evidence}</small></span></li>)}</ul>
        </article>
        <h2><Icon name="wrench" /> 수정 담당에 요청할 조치를 고르세요</h2>
        <p className="vbSub">검증은 직접 고치지 않아요. 원인을 없애는 조치를 요청하고, 같은 시험으로 다시 확인해요.</p>
        <div className="vbChoices">{FIXES[caseId].map((item, index) => <button key={item.label} className={fix === index ? item.ok ? "right" : "wrong" : ""} onClick={() => pickFix(index)}><img src={item.img} alt="" /><b>{item.label}</b></button>)}</div>
      </section> : phase === "level" && mission !== "C" && mission !== "done" ? <section className="vbStage">
        <p className="v7Goal">{missionGoal}</p>
        <h2>어느 레벨에서 시험할까요?</h2>
        <p className="vbSub">왼쪽일수록 범위가 좁고 비용이 적어요. 결과를 보고 다른 레벨로 바꿔도 돼요.</p>
        <div className="vbChoices four">{LV.map(item => <button key={item.id} className={level === item.id ? "on" : ""} onClick={() => pickLevel(item.id)}><small className="vbGroup">{item.group} · 비용 {LV_COST[item.id]}</small><b>{item.name}</b><em>{item.scope}</em></button>)}</div>
      </section> : phase === "input" && mission !== "C" && mission !== "done" ? <section className="vbStage">
        <p className="v7Goal">{missionGoal}</p>
        <h2>어떤 입력값으로 시험할까요?</h2>
        <p className="vbSub">시험 방법: <b>요구사항 기반 시험</b> · 2단계에서 맞춘 정상 동작을 기대값으로 비교해요. 아래 입력은 고른 기법대로 실제로 인가돼요.</p>
        <div className={`vbChoices ${derivs.length > 2 ? "four" : ""}`}>{derivs.map(item => { const info = DERIVS.find(d => d.id === item.id)!; return <button key={item.id} className={deriv === item.id ? "on" : ""} onClick={() => pickDeriv(item.id)}><small className="vbGroup">{info.name}</small><b>{item.input}</b><em>{info.sub}</em></button>; })}</div>
      </section> : <section className="v7Lab2">
        <div className="v7View">
          <nav className="v7Tabs">{([["sw", "SW 로직"], ["ecu", "제어기·I/O"], ["plant", "부품·차량"]] as const).map(([id, name]) => <button key={id} className={viewTab === id ? "on" : ""} onClick={() => { setViewTab(id); play("pop"); }}>{name}{(id === "sw" ? true : id === "ecu" ? level === "embedded" || level === "vehicle" : level === "vehicle") ? <i>실물</i> : <i className="model">모델</i>}</button>)}</nav>
          <div className={`vbSimView ${running ? "running" : ""}`}>{tabVisual}{tabNote && <span className="v7TabNote">{tabNote}</span>}{ran && lastVerdict && <span className={`vbStamp ${lastVerdict === "PASS" ? "pass" : lastVerdict === "FAIL" ? "fail" : "unk"}`}>{VERDICT_KO[lastVerdict]}</span>}</div>
          <p className="vbScope">{LV[order(level)].scope} <small className="vbModelNote">교육용 수치 모델로 계산 · 실제 시험 장비 연동 아님</small></p>
          {note && noteRows.length > 0 && <div className="v7Judge">
            <header><b><Icon name="clipboard" /> 판정 노트</b><small>이번 결과가 각 가설에 무엇을 뜻하나요?</small></header>
            <p className="v7JudgeEv">{LV[order(log[note.run].level)].name} · {VERDICT_KO[log[note.run].verdict]} · {Object.values(log[note.run].vals ?? {}).join(" · ")}</p>
            {noteRows.map(h => <div key={h.id} className="v7JudgeRow"><b>{h.label}</b><span>
              <button onClick={() => answer(h.id, "supported")}>지지</button>
              <button onClick={() => answer(h.id, "refuted")}>반박</button>
              <button onClick={() => answer(h.id, "open")}>이 시험으론 판단 불가</button>
            </span></div>)}
          </div>}
        </div>
        <div className="vbMonitor">
          <header><b><Icon name="monitor" /> 신호 모니터 · {LV[order(level)].name}</b><span><Icon name="clock" /> {(u * sim.seconds).toFixed(1)} / {sim.seconds} {sim.timeUnit}</span></header>
          <p className="vbLegend">{mission === "B" && ran ? "가장 먼저 갈라진 신호에 깃발을 꽂으세요" : `관측점을 꽂고 실행하세요 (최대 ${PROBE_LIMIT}개: 입력 쪽 1 + 출력 쪽 1 권장)`} · <i className="d" /> 정상 설계(2단계 퍼즐의 기준) <i className="s" /> {fixed ? "고친 설계" : "시험 대상"}</p>
          <ul>{list.map((sig, index) => { const on = probed[index]; const value = sample(sig.run); const off = on && ran && divergeIndex(sig) !== null; return <li key={sig.id} className={`${on ? "probed" : ""} ${off ? "off" : ""} ${flag === index ? "flagged" : ""}`}>
            <button className="vbClip" onClick={() => toggleProbe(index)} title="관측점 꽂기/빼기">{on ? <Icon name="probe" /> : "○"}</button>
            <span className="vbSigName"><small>{index === 0 ? "입력 쪽" : index === list.length - 1 ? "출력 쪽" : `${index + 1}번째`}</small><b>{sig.name}</b></span>
            <SeriesTrace sig={sig} upto={u} probed={on} />
            <em className="vbVal">{on ? `${value.toFixed(sig.max < 10 ? 1 : 0)} ${sig.unit}` : "—"}</em>
            {mission === "B" && ran && on && <button className="vbFlag" onClick={() => plantFlag(index)}><Icon name="flag" /></button>}
          </li>; })}</ul>
          {(mission === "C" || mission === "done") && regDone > 0 && <div className="vbReg"><b><Icon name="repeat" /> 회귀 시험</b><ul>{regression.map((name, index) => <li key={name} className={index < regDone ? "ok" : ""}><span>{name}</span><em>{index < regDone ? "PASS" : "…"}</em></li>)}</ul></div>}
          <div className="vbMonitorFoot">
            {mission === "A" && failLevel && <button className="vbGo" onClick={goB}>미션 B로 →</button>}
            {mission !== "done" && <button className="vbGo" disabled={running || !probeCount} onClick={run}>{running ? "시험 중…" : !probeCount ? "관측점을 먼저 꽂아요" : ran ? "▶ 다시 실행" : "▶ 시험 실행"}</button>}
            {mission === "done" && <button className="vbGo" onClick={finish}>검증 완료 · 수리 적용 →</button>}
          </div>
        </div>
      </section>}
      <div className="vbBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{bubble}</p></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}
