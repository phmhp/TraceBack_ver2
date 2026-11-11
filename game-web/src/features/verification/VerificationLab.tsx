import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { numify } from "../../ui/numify";
import type { Campaign, CaseId } from "../../game/runtime";
import { HYP_LABEL, SCENARIOS, SCENARIO_META, judgeRun, type HypStatus, type Obs } from "../../game/scenarios";
import { BenchVisual, EmbeddedBench3D, PursuitRouteBar, RestoredPuzzleVisual, type BenchTab } from "../../experiences";
import { RefPuzzleTrack, normalScenarioLines } from "../wiring/RefPuzzle";
import { StageIntro, showVerdict } from "../../ui/Verdict";
import { SAMPLES, assessContractRun, divergeIndex, firstMismatch, simulate, type ContractRunAssessment, type Lv, type Series, type Tech } from "./simModel";
import { GameHeader, SceneBackdrop, StageFolderSubtitle } from "../../ui/game-shell";
import { play } from "../../ui/sfx";
import { DRIVER as DRIVER_NAME, ENGINEER } from "../../game/cast";
import { Icon } from "../../ui/Icon";
import { contractStorageKey, fallbackVerificationContract, validateVerificationContract, type VerificationContract, type VerificationExecution } from "../../game/verificationContract";
import { ReplayConfirm } from "../../ui/ReplayConfirm";
import { CASES as TRACE_CASES } from "../board/DominoTrace";

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
    mismatch: "팬 요청 이후 PWM 출력 어댑터",
    technique: "고장 재현 + SW I/O 경계 관측",
    lesson: "팬 요청 계산값과 I/O 어댑터 출력값을 함께 관측해, SW 실행 순서에서 처음 갈라졌음을 확인했습니다.",
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
    mismatch: "Regen/Friction Blend 이후 I/O 전송값",
    technique: "조건 조합 + SW 인터페이스 비교",
    lesson: "내부 압력 계산값과 I/O 전송값을 비교해 중복 스케일링이 처음 발생한 SW 경계를 찾았습니다.",
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
    why: "의심 구간이 VCU 내부 SW 계산이에요. SW만 돌려 보는 단위 검증(MIL/SIL)에서 바로 관찰할 수 있어요. 가장 싸고 빠른 레벨이에요.",
    wrong: "그 단계에서도 보여요. 다만 원인이 SW 블록 안의 보정값이라 더 이른 단계에서 잡을 수 있어요.",
  },
  thermal: {
    answer: "embedded",
    why: "의심 구간이 ECU의 PWM 출력 어댑터 SW예요. 통합 SW를 제어기 I/O까지 연결하면 팬 요청 100%와 출력 0%를 함께 관찰할 수 있어요.",
    wrong: "그 레벨로는 SW I/O 어댑터 경계를 관찰할 수 없거나, 더 이른 레벨에서 볼 수 있어요.",
  },
  brake: {
    answer: "embedded",
    why: "의심 구간이 압력 명령 I/O 어댑터 SW예요. 통합 SW를 제어기 I/O까지 연결하면 계산값 42 bar와 전송값 8 bar를 함께 관찰할 수 있어요.",
    wrong: "그 레벨로는 계산값과 I/O 전송값 사이 경계를 관찰할 수 없거나, 더 이른 레벨에서 볼 수 있어요.",
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
        <span className={`vrStamp ${works ? "pass" : "fail"}`}>{works ? "통과" : "실패"}</span>
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
    { label: "토크 지도 값을 2.2배로 키워 보상", img: "/assets/board-photos/torque_cmd.png", ok: false, why: "증상만 가리는 임시 조치예요. 다른 페달 위치에선 토크가 너무 커져서 새 고장이 생겨!" },
    { label: "끼어든 '보정 계수 ×0.45' 블록 제거", img: "/assets/board-photos/pedal_processed.png", ok: true, why: "원인(설계에 없는 블록)을 없애 기준 설계와 같게 만들었어요." },
    { label: "모터 최대 출력 한계 올리기", img: "/assets/ending-thumbs/traction_motor.png", ok: false, why: "모터 한계는 원인이 아니에요. 안전 여유만 줄어들어요." },
  ],
  thermal: [
    { label: "팬 요청을 항상 100%로 고정", img: "/assets/ending-thumbs/thermal_ecu.png", ok: false, why: "팬 요청 계산은 이미 100%였어요. I/O 출력 누락은 고쳐지지 않아요." },
    { label: "출력 제한(보호) 기능 끄기", img: "/assets/board-photos/thermal_protection.png", ok: false, why: "보호 기능은 고장이 아니라 과열을 막아 준 거야. 끄면 모터가 손상돼." },
    { label: "PWM 출력 어댑터 주기 작업 복원", img: "/assets/ending-thumbs/thermal_ecu.png", ok: true, why: "팬 요청 뒤 빠져 있던 SW 실행 순서를 복원해 PWM 쓰기가 다시 수행돼요." },
  ],
  brake: [
    { label: "I/O 어댑터 중복 스케일링 제거", img: "/assets/ending-thumbs/brake_ecu.png", ok: true, why: "내부 계산 뒤 0.19가 다시 적용되던 SW 인터페이스 오류를 제거했어요." },
    { label: "회생 제동을 더 세게 설정", img: "/assets/board-photos/regen_request.png", ok: false, why: "회생 제동은 배터리가 가득 차면 줄어들어요. 마찰 제동 고장을 가릴 뿐이에요." },
    { label: "압력 계산값을 5배로 키우기", img: "/assets/ending-thumbs/brake_ecu.png", ok: false, why: "증상만 보상하는 값이에요. 경계 조건에서 과한 압력을 만들 수 있어요." },
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
  thermal: { seconds: 8, first: 2, list: [
    { name: "냉각수 온도", unit: "°C", zone: "센서", ref: u => 64 + 6 * ramp(u, .4) - 2 * lag(u, .5, .5), fault: u => 64 + 14 * ramp(u, .9), max: 90 },
    { name: "팬 명령", unit: "%", zone: "제어기 SW", ref: u => u > .08 ? 100 : 0, fault: u => u > .08 ? 100 : 0, max: 110 },
    { name: "PWM 출력 어댑터", unit: "%", zone: "제어기 SW I/O", ref: u => u > .09 ? 100 : 0, fault: () => 0, max: 110 },
    { name: "팬 실제 회전", unit: "rpm", zone: "부품", ref: u => 1850 * lag(u, .1, .12), fault: () => 0, max: 2100 },
    { name: "모터 온도", unit: "°C", zone: "부품", ref: u => 70 + 4 * ramp(u, .5), fault: u => 70 + 26 * lag(u, .3, .7), max: 110 },
  ] },
  brake: { seconds: 3, first: 3, list: [
    { name: "브레이크 페달", unit: "%", zone: "센서", ref: u => 55 * ramp(u, .2), fault: u => 55 * ramp(u, .2), max: 100 },
    { name: "제동 요청", unit: "m/s²", zone: "제어기 SW", ref: u => 3.2 * lag(u, .02, .2), fault: u => 3.2 * lag(u, .02, .2), max: 4 },
    { name: "압력 명령", unit: "bar", zone: "제어기 SW", ref: u => 42 * lag(u, .04, .2), fault: u => 42 * lag(u, .04, .2), max: 50 },
    { name: "I/O 전송 압력 명령", unit: "bar", zone: "제어기 SW I/O", ref: u => 42 * lag(u, .06, .2), fault: u => 8 * lag(u, .06, .2), max: 50 },
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
    whyM: { req: "'65°C를 넘으면 팬이 1850 rpm으로 돈다'는 요구를 같은 열부하에서 확인해요.", iface: "팬 요청 계산값과 PWM I/O 출력값을 비교하면 SW 인터페이스 오류를 구분할 수 있어요.", inject: "비정상 열부하는 SW 검증 입력으로 쓸 수 있지만, 근본 원인은 출력 어댑터 SW 실행 순서예요." },
    whyD: { usecase: "오래 고속으로 달린 조건을 그대로 만들어야 열이 쌓이고 팬이 켜져야 하는 상황이 생겨요.", reqa: "요구 값을 순간만 넣으면 온도가 오르기 전이라 팬이 켜질 조건이 안 만들어져요.", equiv: "온도 구간별 대표값은 판단 로직 확인용이에요. 열이 쌓이는 시간이 필요해요.", bound: "65°C 경계는 이미 넘었고 팬 명령도 100%였어요. 경계 판단 문제가 아니에요.", guess: "근거 없이 고르기보다 사건이 난 사용 조건을 재현하는 게 확실해요." } },
  brake: { method: ["req"], deriv: ["bound"], input: "페달 55% · 배터리 가득(회생 0) 경계",
    whyM: { req: "'페달 55% → 3.2 m/s²' 요구를 같은 제동 입력에서 확인해요.", iface: "내부 압력 계산값과 I/O 전송값을 비교하면 중복 스케일링을 구분할 수 있어요.", inject: "회생 0 조건은 SW 경계를 드러내는 입력 조건이며, 근본 원인은 I/O 어댑터의 데이터 처리 오류예요." },
    whyD: { bound: "배터리가 가득 차 회생이 0이 되는 경계에서는 마찰 압력 명령이 커져 I/O 스케일링 오류가 가장 뚜렷해요.", reqa: "가능하지만 회생 제동이 일부를 메워 차이가 작게 보여요.", equiv: "대표값만으로는 회생이 섞여 마찰 쪽 차이가 흐려져요.", guess: "근거 없이 고르기보다 회생이 0이 되는 경계를 쓰는 게 확실해요.", usecase: "실제 주행 기록엔 회생이 섞여 마찰 쪽 차이가 흐려져요." } },
};
const SIM_INPUT: Record<Deriv, Tech> = { reqa: "req", equiv: "req", guess: "req", bound: "boundary", usecase: "soak" };
// v7: only test-case derivations whose input really differs in the numeric model are offered, per case,
// with the exact input that is applied (equivalence partitioning and error guessing are not performed, so not shown).
const CASE_DERIVS: Record<CaseId, { id: Deriv; tech: Tech; input: string }[]> = {
  propulsion: [
    { id: "reqa", tech: "req", input: "요구사항 기준 · 페달 60%를 계단 입력으로 인가하고 유지" },
    { id: "bound", tech: "boundary", input: "상한 확인 · 페달 100% 계단 입력 (맵 340 Nm → 가용 한계 260 Nm)" },
    { id: "usecase", tech: "replay", input: "사건 재현 · 기록된 페달 0 → 60% (0.3초 램프) 재생" },
  ],
  thermal: [
    { id: "reqa", tech: "req", input: "요구사항 기준 · 냉각수 60 → 70°C로 올려 65°C 켜짐 확인" },
    { id: "usecase", tech: "soak", input: "사건 재현 · 장거리 고속 열부하 (냉각수 65.1 → 78.4°C)" },
  ],
  brake: [
    { id: "reqa", tech: "req", input: "요구사항 기준 · 페달 55%, 회생 가능 1.1 m/s²" },
    { id: "bound", tech: "boundary", input: "경계 조건 · 페달 55%, 배터리 가득(회생 0) → 마찰 제동만" },
  ],
};
/**
 * 2026-11-12: each input condition is a real, different stimulus (STEP03 contract = the case reproduction input).
 * Only the stimulus / initial state change; the comparison is still normal model vs fault model with the same input.
 */
const INPUT_EXEC: Record<CaseId, Partial<Record<Deriv, (base: VerificationExecution) => VerificationExecution>>> = {
  propulsion: {
    reqa: base => ({ ...base, stimulus: { ...base.stimulus, startValue: 0, endValue: 60, rampSeconds: 0 } }),
    bound: base => ({ ...base, stimulus: { ...base.stimulus, startValue: 0, endValue: 100, rampSeconds: 0 } }),
  },
  thermal: {
    reqa: base => ({ ...base, stimulus: { ...base.stimulus, startValue: 60, endValue: 70, rampSeconds: 4, holdSeconds: Math.max(0, base.durationSeconds - 4) } }),
  },
  brake: {
    bound: base => ({ ...base, initial: base.initial.map(item => item.signalId === "regenAvailable" ? { ...item, value: 0 } : item) }),
  },
};
/** The contract actually executed for an input: expected outputs come from the healthy (normal) model run with the same input. */
function contractForInput(caseId: CaseId, contract: VerificationContract, deriv: Deriv, tech: Tech): VerificationContract {
  const build = INPUT_EXEC[caseId][deriv];
  if (!build) return contract;
  const execution = build(contract.execution);
  const normal = simulate(caseId, tech, true, execution);
  const all = Object.values(normal.levels).flat();
  const expectedOutputs = contract.execution.expectedOutputs.map(item => {
    const sig = all.find(signal => signal.id === item.signalId);
    if (!sig) return item;
    const v = sig.ref[sig.ref.length - 1];
    return { ...item, value: Math.abs(v) < 10 ? Math.round(v * 10) / 10 : Math.round(v) };
  });
  return { ...contract, execution: { ...execution, expectedOutputs } };
}
/** What each input condition is for. The input sequence itself is printed from the executed contract, never hand-written. */
const INPUT_INFO: Record<CaseId, Partial<Record<Deriv, { tag: string; purpose: string }>>> = {
  propulsion: {
    reqa: { tag: "대표 요구사항 시험", purpose: "정상 요구사항의 대표 입력(페달 60% → 토크 204 Nm)에서 기대 출력이 나오는지 확인" },
    bound: { tag: "경계 시험", purpose: "입력 범위 끝(100%)에서 토크 제한(가용 한계 260 Nm)이 정상 동작하는지 확인" },
    usecase: { tag: "고장 상황 재현 시험", purpose: "고장 당시 기록을 바탕으로 재구성한 조작으로 같은 출력 저하가 다시 나타나는지 확인" },
  },
  thermal: {
    reqa: { tag: "대표 요구사항 시험", purpose: "65°C 켜짐 기준을 지날 때 팬이 켜지고 목표 회전수로 제어되는지 확인" },
    usecase: { tag: "고장 상황 재현 시험", purpose: "고장 당시 장거리 고속 열부하를 재구성해 팬이 돌지 않는 현상이 다시 나타나는지 확인" },
  },
  brake: {
    reqa: { tag: "고장 상황 재현 · 대표 요구사항 시험", purpose: "고장 당시와 같은 제동 조작(페달 55%, 회생 가능)에서 감속 3.2 m/s²가 나오는지 확인" },
    bound: { tag: "경계 시험", purpose: "회생이 0인 경계(배터리 가득)에서 마찰 제동이 감속 전부를 채우는지 확인" },
  },
};
const fmtNum = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1);
/** Plain description of the executed stimulus: values, change shape and hold time. */
function inputSequenceText(execution: VerificationExecution, base: VerificationExecution) {
  const st = execution.stimulus;
  const shape = st.rampSeconds <= 0 ? "한 번에 바꾸는 계단 입력" : `${fmtNum(st.rampSeconds)}초 동안 점진적으로 변화`;
  const changed = execution.initial.filter(item => base.initial.find(b => b.signalId === item.signalId)?.value !== item.value).map(item => `${contractSignalLabel(item.signalId)} ${fmtNum(item.value)} ${item.unit}`);
  return `${contractSignalLabel(st.signalId)} ${fmtNum(st.startValue)} → ${fmtNum(st.endValue)} ${st.unit} · ${shape}${st.holdSeconds ? ` · ${fmtNum(st.holdSeconds)}초 유지` : ""}${changed.length ? ` · ${changed.join(", ")}` : ""}`;
}
/** Final cause cards: name, cause type (the actual fault mechanism in simModel), location, short explanation. */
// photos are the same assets as the STEP02 domino polaroids, so the card and the evidence look alike
const CAUSE_IMG = { board: (name: string) => `/assets/board-photos/${name}.png`, part: (name: string) => `/assets/ending-thumbs/${name}.png` };
const CAUSES: Record<CaseId, { hyp: string; name: string; type: string; where: string; desc: string; img: string }[]> = {
  propulsion: [
    { hyp: "vcu_sw", name: "페달 처리 SW의 설계 외 보정 계수(×0.45)", type: "신호 변환·스케일링 오류", where: "VCU · 페달 처리 SW", desc: "필터를 지난 페달값에 설계에 없는 계수가 곱해져 토크 요청이 낮아짐", img: CAUSE_IMG.board("pedal_processed") },
    { hyp: "vcu_hw", name: "VCU 입력 회로의 신호 변환 이상", type: "입력 회로·신호 변환 오류(HW)", where: "VCU · 입력 회로", desc: "페달 전압을 디지털 값으로 바꾸는 회로가 값을 틀리게 읽음", img: CAUSE_IMG.part("vcu") },
  ],
  thermal: [
    { hyp: "fan_sw", name: "PWM 출력 어댑터 주기 작업 누락", type: "타이밍·실행 순서 오류", where: "Thermal ECU · 출력 어댑터 SW", desc: "팬 요청 계산 뒤 PWM 쓰기 작업이 실행 순서에서 빠져 출력이 0%", img: CAUSE_IMG.board("fan_actual") },
    { hyp: "fan_path", name: "팬 켜기 상태 전이 SW 오류", type: "SW 로직 오류(상태 전이)", where: "Thermal ECU · 팬 제어 SWC", desc: "65°C 켜짐 · 60°C 꺼짐 상태 전이가 잘못되어 팬 요청이 나오지 않음", img: CAUSE_IMG.part("thermal_ecu") },
    { hyp: "fan_motor", name: "팬 회전 피드백 처리 SW 오류", type: "SW 로직 오류(피드백 처리)", where: "Thermal ECU · 피드백 처리 SW", desc: "읽어 온 회전수를 잘못 처리해 PI 제어가 틀린 값을 계산", img: CAUSE_IMG.part("cooling_fan") },
  ],
  brake: [
    { hyp: "blend_sw", name: "회생·마찰 배분 계산 SW 오류", type: "SW 로직 오류(배분 계산)", where: "Brake ECU · 제동 배분 SWC", desc: "회생과 마찰 몫을 잘못 나눠 압력 계산값이 틀어짐", img: CAUSE_IMG.board("regen_request") },
    { hyp: "hyd_path", name: "압력 명령 I/O 어댑터 중복 스케일링(×0.19)", type: "인터페이스 오류(I/O 스케일링 중복)", where: "Brake ECU · I/O 어댑터 SW", desc: "내부 계산 42 bar에 출력 단계에서 축척을 한 번 더 곱해 8 bar로 전송", img: CAUSE_IMG.board("brake_actual") },
    { hyp: "caliper", name: "압력 피드백 데이터 처리 SW 오류", type: "SW 로직 오류(피드백 처리)", where: "Brake ECU · 피드백 처리 SW", desc: "읽어 온 라인 압력을 잘못 처리해 압력 제어가 틀어짐", img: CAUSE_IMG.part("brake_caliper") },
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
  propulsion: { answer: "unit", why: "의심 구간이 VCU 내부 SW 계산이에요. 그 SW 단위에 입력값을 인가하는 SW 단위 시험에서 바로 관찰할 수 있어요. 가장 싸고 빠른 레벨이에요." },
  thermal: { answer: "embedded", why: "의심 구간이 PWM 출력 어댑터 SW예요. 통합 SW·제어기 I/O 시험에서 요청값과 실제 출력값을 함께 보면 가장 먼저 잡을 수 있어요." },
  brake: { answer: "embedded", why: "의심 구간이 압력 명령 I/O 어댑터 SW예요. 통합 SW·제어기 I/O 시험에서 계산값과 전송값을 비교하면 가장 먼저 잡을 수 있어요." },
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
    <GameHeader chapter="검증" title="시뮬레이션 검증" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
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
          <div className={`vbSimView ${running ? "running" : ""}`}>{simVisual}{ranHere && <span className={`vbStamp ${firstMismatch(list) === null ? "pass" : "fail"}`}>{firstMismatch(list) === null ? "통과" : "실패"}</span>}</div>
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
          <div className="vbReg"><b><Icon name="repeat" /> 회귀 시험 (영향 범위)</b><ul>{regression.map((name, index) => <li key={name} className={index < regDone ? "ok" : ""}><span>{name}</span><em>{index < regDone ? "통과" : "…"}</em></li>)}</ul></div>
          {regDone >= regression.length && <div className="vbDone"><span><small>방금 사용한 검증 사고법</small><b>{LV[order(level ?? lvAnswer.answer)].name} · {METHODS.find(item => item.id === method)?.name} · {DERIVS.find(item => item.id === deriv)?.name} → FIRST MISMATCH → 근본 수정 → 회귀</b></span><b className="vbStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</b><button className="vbGo" onClick={finish}>검증 완료 · 수리 적용 →</button></div>}
        </div>}
      </section>}

      <div className="vbBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{numify(bubble)}</p></div>
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

/** Normal scenario (dashed, full) overlaid with this test (solid, drawn up to `upto`); red mark = first divergence. */
function OverlayGraph({ list, upto, look, note }: { list: Series[]; upto: number; look: Set<string>; note?: string }) {
  return <div className="ovGraph">
    <p className="ovLegend"><i className="ref" /> 정상 시나리오 <i className="run" /> 이번 시험 <i className="split" /> 처음 달라진 때</p>
    {note && <p className="ovNote">{note}</p>}
    {list.map(sig => {
      const n = sig.ref.length - 1, last = Math.round(upto * n), d = divergeIndex(sig);
      const y = (v: number) => (34 - clampTo(v / sig.max) * 30).toFixed(1);
      const pts = (arr: number[], to: number) => arr.slice(0, to + 1).map((v, i) => `${(i / n * 200).toFixed(1)},${y(v)}`).join(" ");
      return <div key={sig.id} className={`ovRow ${look.has(sig.id) ? "look" : ""}`}>
        <span>{sig.name}<small>{sig.unit}</small></span>
        <svg className="vbTrace" viewBox="0 0 200 36" preserveAspectRatio="none"><polyline className="ref" points={pts(sig.ref, n)} />{upto > 0 && <polyline className={`run ${d === null ? "ok" : ""}`} points={pts(sig.run, last)} />}{d !== null && upto > 0 && last >= d && <g className="split"><line x1={d / n * 200} y1="0" x2={d / n * 200} y2="36" /></g>}</svg>
      </div>;
    })}
  </div>;
}

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
const VERDICT_KO: Record<Verdict, string> = { PASS: "통과", FAIL: "실패", INCONCLUSIVE: "판정 불가" };
/** Only what was probed counts: same / higher / lower than the reference at the first split. */
function observe(list: Series[], probedIds: string[]) {
  const obs: Record<string, Obs> = {};
  list.forEach(sig => { if (!probedIds.includes(sig.id)) return; const d = divergeIndex(sig); obs[sig.id] = d === null ? "same" : sig.run[d] > sig.ref[d] ? "higher" : "lower"; });
  const anyDiff = Object.values(obs).some(v => v !== "same");
  const verdict: Verdict = anyDiff ? "FAIL" : obs[list[list.length - 1].id] ? "PASS" : "INCONCLUSIVE";
  return { obs, verdict };
}

/** v7 (missions A/B + judgment note). Kept unused; the Q&A version below is live. */
export function TwinBenchV7({ state, send }: { state: Campaign; send: Send }) {
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
    <GameHeader chapter="검증" title="시뮬레이션 검증" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
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
          <p className="vbScope">{LV[order(level)].scope}</p>
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
          <p className="vbLegend">{mission === "B" && ran ? "가장 먼저 갈라진 신호에 깃발을 꽂으세요" : `관측점을 꽂고 실행하세요 (최대 ${PROBE_LIMIT}개: 입력 쪽 1 + 출력 쪽 1 권장)`} · <i className="d" /> 정상 설계 · 기대값: {(() => { try { return sessionStorage.getItem(`tb-expect-${caseId}`) ?? "2단계 퍼즐의 기준"; } catch { return "2단계 퍼즐의 기준"; } })()} <i className="s" /> {fixed ? "고친 설계" : "시험 대상"}</p>
          <ul>{list.map((sig, index) => { const on = probed[index]; const value = sample(sig.run); const off = on && ran && divergeIndex(sig) !== null; return <li key={sig.id} className={`${on ? "probed" : ""} ${off ? "off" : ""} ${flag === index ? "flagged" : ""}`}>
            <button className="vbClip" onClick={() => toggleProbe(index)} title="관측점 꽂기/빼기">{on ? <Icon name="probe" /> : "○"}</button>
            <span className="vbSigName"><small>{index === 0 ? "입력 쪽" : index === list.length - 1 ? "출력 쪽" : `${index + 1}번째`}</small><b>{sig.name}</b></span>
            <SeriesTrace sig={sig} upto={u} probed={on} />
            <em className="vbVal">{on ? `${value.toFixed(sig.max < 10 ? 1 : 0)} ${sig.unit}` : "—"}</em>
            {mission === "B" && ran && on && <button className="vbFlag" onClick={() => plantFlag(index)}><Icon name="flag" /></button>}
          </li>; })}</ul>
          {(mission === "C" || mission === "done") && regDone > 0 && <div className="vbReg"><b><Icon name="repeat" /> 회귀 시험</b><ul>{regression.map((name, index) => <li key={name} className={index < regDone ? "ok" : ""}><span>{name}</span><em>{index < regDone ? "통과" : "…"}</em></li>)}</ul></div>}
          <div className="vbMonitorFoot">
            {mission === "A" && failLevel && <button className="vbGo" onClick={goB}>미션 B로 →</button>}
            {mission !== "done" && <button className="vbGo" disabled={running || !probeCount} onClick={run}>{running ? "시험 중…" : !probeCount ? "관측점을 먼저 꽂아요" : ran ? "▶ 다시 실행" : "▶ 시험 실행"}</button>}
            {mission === "done" && <button className="vbGo" onClick={finish}>검증 완료 · 수리 적용 →</button>}
          </div>
        </div>
      </section>}
      <div className="vbBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{numify(bubble)}</p></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}


// ===== Stage 3 v2 · "볼트의 질문에 시험으로 답하기" (docs/PLAY_FLOW_V2_2026-11-08.md) =====
// One question = one hypothesis. Pick a test card → pick up to 3 measuring points → run → answer with one of
// three buttons (문제 있음 / 문제 없음 / 이 시험으로는 모름). The answer key is the scenario registry (judgeRun).
// All answered → report (auto) → fix request → same test again with the fixed design → regression.
const QUESTIONS: Record<CaseId, { hyp: string; ask: string }[]> = {
  propulsion: [
    { hyp: "vcu_sw", ask: "VCU 내부 계산 SW가 잘못된 거야?" },
    { hyp: "vcu_hw", ask: "아니면 VCU 입력 회로(신호 변환)가 문제야?" },
  ],
  thermal: [
    { hyp: "fan_sw", ask: "PWM 출력 어댑터 SW의 실행 순서가 빠진 거야?" },
    { hyp: "fan_path", ask: "팬 켜기 상태 전이 SW가 잘못된 거야?" },
    { hyp: "fan_motor", ask: "팬 회전 피드백 처리 SW가 잘못된 거야?" },
  ],
  brake: [
    { hyp: "blend_sw", ask: "회생·마찰 나누는 SW가 잘못된 거야?" },
    { hyp: "hyd_path", ask: "I/O 어댑터가 압력 명령을 다시 줄인 거야?" },
    { hyp: "caliper", ask: "압력 피드백 처리 SW가 잘못된 거야?" },
  ],
};
const TEST_CARD: Record<Lv, { name: string; pic: "chip" | "grid" | "monitor" | "car" }> = {
  unit: { name: "SW 단위 시험", pic: "chip" },
  swint: { name: "소프트웨어 통합 시험 (PC 실행)", pic: "grid" },
  embedded: { name: "제어기 I/O 통합 시험", pic: "monitor" },
  vehicle: { name: "시스템 통합 시험", pic: "car" },
};
/** Short subtitle under each test level (tab names stay short). */
const LEVEL_SUB: Record<Lv, string> = { unit: "SW 단독 실행 · PC 환경 · 제어기·부품은 모델", swint: "여러 SW 연결 · PC 환경 · 부품은 모델", embedded: "SW와 제어기 입출력 연결 · 부품은 모델", vehicle: "SW·제어기·실제 부품 통합 실행" };
const QA_LEVELS: Lv[] = ["unit", "embedded", "vehicle"];
const qaDeriv = (caseId: CaseId, lv: Lv): Deriv => lv === "unit" || lv === "swint" ? "reqa" : CASE_DERIVS[caseId].some(d => d.id === "usecase") ? "usecase" : "bound";
type Answer = "supported" | "refuted" | "open";
const ANSWER_KO: Record<Answer, string> = { supported: "가설 지지", refuted: "가설 반박", open: "판단 보류" };

/** Q&A v1 (probe picking + small answer overlay). Kept unused; v2 below is live. */
export function TwinBenchQAV1({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const meta = SCENARIO_META[caseId];
  const questions = QUESTIONS[caseId];
  const expect = (() => { try { return sessionStorage.getItem(`tb-expect-${caseId}`) ?? ""; } catch { return ""; } })();
  const regression: string[] = (() => { try { const fromBoard = JSON.parse(sessionStorage.getItem(`tb-impact-${caseId}`) ?? "null"); return Array.isArray(fromBoard) && fromBoard.length ? fromBoard : regressionTests[caseId]; } catch { return regressionTests[caseId]; } })();
  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<"pick" | "lab" | "report" | "retest" | "done">("pick");
  const [level, setLevel] = useState<Lv>("unit");
  const [probes, setProbes] = useState<string[]>([]);
  const [u, setU] = useState(0);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<{ obs: Record<string, Obs>; vals: Record<string, string>; verdict: Verdict; fixed: boolean } | null>(null);
  const [answers, setAnswers] = useState<Record<string, { answer: Answer; why: string; evidence: string }>>({});
  const [cost, setCost] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [fix, setFix] = useState<number | null>(null);
  const [regDone, setRegDone] = useState(0);
  const [viewTab, setViewTab] = useState<"sw" | "ecu" | "plant">("sw");
  const [bubble, setBubble] = useState(`${DRIVER_NAME}의 질문에 시험 결과로 답하세요. 먼저 어떤 시험으로 확인할지 고르세요.`);
  const q = questions[qi];
  const hyp = meta.hypotheses.find(h => h.id === q?.hyp);
  const fixed = phase === "retest" || phase === "done";
  const deriv = qaDeriv(caseId, level);
  const tech = CASE_DERIVS[caseId].find(d => d.id === deriv)!;
  const sim = useMemo(() => simulate(caseId, tech.tech, fixed), [caseId, tech.tech, fixed]);
  const list = sim.levels[level];
  const key = (i: number) => `${level}:${list[i].id}`;
  const probed = list.map((_, i) => probes.includes(key(i)));
  const probeCount = probed.filter(Boolean).length;
  const order = (id: Lv) => LV.findIndex(item => item.id === id);
  const stars = cost <= BEST_COST[caseId] + 2 && mistakes <= 1 ? 3 : cost <= BEST_COST[caseId] + 8 && mistakes <= 3 ? 2 : 1;
  const sample = (arr: number[]) => arr[Math.min(arr.length - 1, Math.round(u * (arr.length - 1)))];
  const swSame = firstMismatch(sim.levels.unit) === null;
  const ecuReal = level === "embedded" || level === "vehicle", plantReal = level === "vehicle";
  const works = fixed || firstMismatch(list) === null;

  const pickTest = (lv: Lv) => { setLevel(lv); setViewTab(lv === "unit" || lv === "swint" ? "sw" : lv === "embedded" ? "ecu" : "plant"); setProbes([]); setU(0); setLastRun(null); setPhase("lab"); play("pop");
    setBubble(`${TEST_CARD[lv].name}. 오른쪽에서 잴 곳을 최대 ${PROBE_LIMIT}개 고르고 실행하세요.`); };
  const toggleProbe = (i: number) => {
    if (running || lastRun) return;
    const k = key(i);
    if (probes.includes(k)) { setProbes(p => p.filter(x => x !== k)); play("pop"); return; }
    if (probeCount >= PROBE_LIMIT) { setBubble(`잴 곳은 ${PROBE_LIMIT}개까지예요. 질문에 답하는 데 필요한 곳을 고르세요.`); play("error"); return; }
    setProbes(p => [...p, k]); play("zip", .9 + i * .06);
  };
  const run = () => {
    if (running || !probeCount) return;
    setRunning(true); setU(0); play("zip");
    if (!fixed) setCost(c => c + LV_COST[level]);
    const started = performance.now(), lst = list, lv = level, isFixed = fixed;
    const tick = () => {
      const next = Math.min(1, (performance.now() - started) / 2400);
      setU(next);
      if (next < 1) { requestAnimationFrame(tick); return; }
      setRunning(false);
      const { obs, verdict } = observe(lst, lst.filter(sig => probes.includes(`${lv}:${sig.id}`)).map(sig => sig.id));
      const vals = Object.fromEntries(lst.filter(sig => obs[sig.id]).map(sig => { const at = divergeIndex(sig) !== null ? sig.ref.reduce((best, v, i) => (Math.abs(v - sig.run[i]) > Math.abs(sig.ref[best] - sig.run[best]) ? i : best), 0) : sig.ref.reduce((best, v, i) => (v > sig.ref[best] ? i : best), 0), f = (v: number) => v.toFixed(sig.max < 10 ? 1 : 0); return [sig.id, `${sig.name} ${f(sig.run[at])} ${sig.unit} (기준 ${f(sig.ref[at])})`]; }));
      setLastRun({ obs, verdict, vals, fixed: isFixed });
      if (isFixed) {
        if (verdict === "PASS") { play("stamp"); showVerdict(true, "통과"); setBubble("수리한 차량이 같은 시험에서 기대값과 같아요. 영향을 받았던 곳도 회귀 시험해요."); regression.forEach((_, i) => window.setTimeout(() => { setRegDone(i + 1); play("pop", 1 + i * .1); }, 600 + i * 420)); window.setTimeout(() => setPhase("done"), 700 + regression.length * 420); }
        else setBubble("아직 기대값과 달라요. 잴 곳을 확인하세요.");
        return;
      }
      play(verdict === "FAIL" ? "error" : "pop");
      setBubble(verdict === "INCONCLUSIVE" ? "출력 쪽을 재지 않아서 기대값과 비교할 수 없어요. 그래도 답할 수 있는지 생각해 보세요."
        : `${VERDICT_KO[verdict]}. 이 결과로 ${DRIVER_NAME}의 질문에 답하세요.`);
    };
    requestAnimationFrame(tick);
  };
  const answer = (pick: Answer) => {
    if (!lastRun || !q || !hyp) return;
    const keyAns = judgeRun(caseId, { level, fixed: false, obs: lastRun.obs }).find(item => item.id === q.hyp)!;
    if (pick !== keyAns.verdict) {
      setMistakes(n => n + 1); showVerdict(false);
      setBubble(keyAns.verdict === "open"
        ? `이 시험으로는 가를 수 없어요. ${LV[order(level)].scope} 다른 시험을 골라 보세요.`
        : `다시 보세요. ${keyAns.why}`);
      return;
    }
    if (pick === "open") { play("pop"); setBubble("맞아요. 이 시험으로는 답할 수 없어요. 다른 시험 카드를 고르세요."); setPhase("pick"); return; }
    const evidence = `${TEST_CARD[level].name} · ${keyAns.need.map(id => lastRun.vals[id]).filter(Boolean).join(", ")}`;
    setAnswers(prev => ({ ...prev, [q.hyp]: { answer: pick, why: keyAns.why, evidence } }));
    showVerdict(true, ANSWER_KO[pick]); play("stamp");
    setBubble(`${keyAns.why} → "${ANSWER_KO[pick]}"`);
    window.setTimeout(() => {
      if (qi + 1 < questions.length) { setQi(qi + 1); setBubble("다음 질문이에요. 방금 결과로 답할 수 있으면 바로 답하고, 아니면 '다른 시험 고르기'를 누르세요."); }
      else { setPhase("report"); setBubble(`질문에 모두 답했어요. 보고서를 ${DRIVER_NAME}에게 보여 주고, 수정 담당에 요청할 조치를 고르세요.`); }
    }, 1100);
  };
  // the test that proved the cause is re-run after the repair
  const proof = questions.map(item => answers[item.hyp]).find(a => a?.answer === "supported");
  const pickFix = (i: number) => {
    setFix(i);
    const item = FIXES[caseId][i];
    if (!item.ok) { setMistakes(n => n + 1); setBubble(item.why); showVerdict(false); return; }
    showVerdict(true, "조치 요청"); setBubble(`${item.why} 같은 시험으로 다시 확인하세요.`);
    const expectedProgram = caseId === "propulsion" ? "nominal" : caseId === "thermal" ? "thermal_closed_loop" : "blended_brake";
    if (state.program[caseId] !== expectedProgram) send({ type: "COMPILE", program: expectedProgram });
    const truthQ = questions.find(item2 => meta.hypotheses.find(h => h.id === item2.hyp)?.truth);
    const lv = truthQ ? (Object.keys(TEST_CARD) as Lv[]).find(l => proof?.evidence.startsWith(TEST_CARD[l].name)) ?? "vehicle" : "vehicle";
    window.setTimeout(() => { setLevel(lv); setViewTab(lv === "unit" || lv === "swint" ? "sw" : lv === "embedded" ? "ecu" : "plant"); const sigs = sim.levels[lv], pick = [...new Set([sigs[0].id, ROOT_SIGNAL[caseId], sigs[sigs.length - 1].id])].filter(id => sigs.some(sig => sig.id === id)); setProbes(pick.map(id => `${lv}:${id}`)); setU(0); setLastRun(null); setPhase("retest"); }, 800);
  };
  const finish = () => send({ type: "BENCH_RESULT", pass: true, causeCorrect: true });
  const reveal = () => { setAnswers(Object.fromEntries(questions.map(item => { const h = meta.hypotheses.find(x => x.id === item.hyp)!; return [item.hyp, { answer: h.truth ? "supported" as Answer : "refuted" as Answer, why: h.rules[0]?.why ?? h.stage1 ?? "", evidence: "개발용 정답" }]; }))); setPhase("report"); };

  const tabVisual = viewTab === "sw" ? <RefPuzzleTrack key={`sw-${level}-${fixed}`} mode={level === "unit" ? "unit" : "swint"} caseId={caseId} progress={u} fixed={fixed} same={fixed || swSame} running={running} />
    : viewTab === "ecu" ? <EmbeddedBench3D caseId={caseId} running={running} works={ecuReal ? works : true} />
      : caseId === "propulsion" ? <BenchVisual tab="vehicle" caseId={caseId} running={running} works={plantReal ? works : true} /> : <EmbeddedBench3D caseId={caseId} running={running} works={plantReal ? works : true} />;
  const tabNote = viewTab === "ecu" && !ecuReal ? "이 시험에는 제어기 하드웨어가 연결되지 않아요. SW만 PC에서 실행해요."
    : viewTab === "plant" && !plantReal ? "이 시험에는 실제 부품·차량이 연결되지 않아요. 부품은 모델이 대신해요." : "";
  const word = (sig: Series) => { const d = divergeIndex(sig); if (d === null) return "같음"; return sig.run[d] > sig.ref[d] ? "높음" : "낮음"; };

  return <div className="vbBench v7 qa">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="검증" title="시뮬레이션 검증" distanceMeters={state.policeGapMeters} progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <StageFolderSubtitle className="benchStageFolder" action="의심한 SW를 시험·수정하고 정상 차량과 결과를 비교하세요." detail={<>이전 결과: 테스트 설계서 <i>|</i> 비교: 정상 기준선 ↔ 수정 후 차량</>} />
    <StageIntro id="bench-qa" title="시뮬레이션 검증" goal={`${DRIVER_NAME}의 질문에 시험 결과로 답해요. 무엇이 고장이고 무엇은 멀쩡한지 근거로 설명하는 단계예요.`} steps={[
      { icon: "clipboard", text: `${DRIVER_NAME}의 질문 카드를 읽고, 확인할 시험 카드를 골라요.` },
      { icon: "probe", text: "잴 곳을 최대 3개 고르고 실행해요. 결과는 기준과 같음·낮음·높음으로 나와요." },
      { icon: "flag", text: "문제 있음 / 문제 없음 / 이 시험으로는 모름 중에서 답해요. 다 답하면 보고서 → 수리 요청 → 같은 시험으로 재확인." },
    ]} />
    <main className="vbLayout">
      <div className="qaTop">
        {phase === "report" || phase === "retest" || phase === "done"
          ? <div className="qaAsk done"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><small>{DRIVER_NAME}</small><b>{phase === "report" ? "그래서 뭘 고치면 돼?" : "고친 뒤에는 괜찮아?"}</b></p></div>
          : <div className="qaAsk"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><small>{DRIVER_NAME}의 질문 {numify(`${qi + 1}/${questions.length}`)}</small><b>"{q.ask}"</b></p></div>}
        <ol className="qaDots">{questions.map((item, k) => { const a = answers[item.hyp]; return <li key={item.hyp} className={a ? `a-${a.answer}` : k === qi && phase !== "report" ? "now" : ""} title={item.ask}>{a ? ANSWER_KO[a.answer] : k + 1}</li>; })}</ol>
        {expect && <span className="qaExpect"><Icon name="clipboard" /> 기대값 · {expect}</span>}
        <span className="v7CostChip">비용 {cost} · {"★".repeat(stars)}{"☆".repeat(3 - stars)}</span>
      </div>

      {phase === "pick" ? <section className="vbStage">
        <h2>어떤 시험으로 확인할까요?</h2>
        <p className="vbSub">비용이 낮을수록 빠르고 싸지만, 볼 수 있는 범위가 좁아요.</p>
        <div className="vbChoices qaTests">{QA_LEVELS.map(lv => <button key={lv} onClick={() => pickTest(lv)}><i><Icon name={TEST_CARD[lv].pic} /></i><b>{TEST_CARD[lv].name}</b><small className="vbGroup">{LV[order(lv)].name} · 비용 {LV_COST[lv]}</small><em>{LV[order(lv)].scope}</em></button>)}</div>
      </section>
        : phase === "report" ? <section className="vbStage v7Fix">
          <article className="v7Report">
            <header><small>검증 결과 보고 · {DRIVER_NAME}에게</small><b>원인: {meta.hypotheses.find(h => h.truth)!.label}</b></header>
            <ul>{questions.map(item => { const a = answers[item.hyp]; return <li key={item.hyp} className={a?.answer === "supported" ? "hyp-supported" : "hyp-refuted"}><em>{a ? ANSWER_KO[a.answer] : "-"}</em><span><strong>"{item.ask}"</strong>{a?.why}<small>근거: {a?.evidence}</small></span></li>; })}
              {meta.hypotheses.filter(h => h.stage1 && !questions.some(item => item.hyp === h.id)).map(h => <li key={h.id} className="hyp-refuted"><em>가능성 낮음</em><span><strong>{h.label}</strong>{h.stage1}<small>근거: 도미노 역추적 측정</small></span></li>)}</ul>
          </article>
          <h2><Icon name="wrench" /> 수정 담당에 요청할 조치를 고르세요</h2>
          <div className="vbChoices">{FIXES[caseId].map((item, index) => <button key={item.label} className={fix === index ? item.ok ? "right" : "wrong" : ""} onClick={() => pickFix(index)}><img src={item.img} alt="" /><b>{item.label}</b></button>)}</div>
        </section>
          : <section className="v7Lab2">
            <div className="v7View">
              <nav className="v7Tabs">{([["sw", "SW 로직"], ["ecu", "제어기·I/O"], ["plant", "부품·차량"]] as const).map(([id, name]) => <button key={id} className={viewTab === id ? "on" : ""} onClick={() => { setViewTab(id); play("pop"); }}>{name}{(id === "sw" ? true : id === "ecu" ? ecuReal : plantReal) ? <i>실물</i> : <i className="model">모델</i>}</button>)}</nav>
              <div className={`vbSimView ${running ? "running" : ""}`}>{tabVisual}{tabNote && <span className="v7TabNote">{tabNote}</span>}{lastRun && <span className={`vbStamp ${lastRun.verdict === "PASS" ? "pass" : lastRun.verdict === "FAIL" ? "fail" : "unk"}`}>{VERDICT_KO[lastRun.verdict]}</span>}</div>
              <p className="vbScope"><b>{TEST_CARD[level].name}</b> · 입력: {tech.input}</p>
              {phase === "lab" && lastRun && <div className="v7Judge qaAnswer">
                <header><b><Icon name="clipboard" /> {DRIVER_NAME}에게 답하기</b><small>"{q.ask}"</small></header>
                <p className="v7JudgeEv">{Object.values(lastRun.vals).join(" · ")}</p>
                <div className="qaBtns">{(["supported", "refuted", "open"] as Answer[]).map(a => <button key={a} className={`ans-${a}`} onClick={() => answer(a)}>{ANSWER_KO[a]}</button>)}</div>
              </div>}
            </div>
            <div className="vbMonitor">
              <header><b><Icon name="monitor" /> 잴 곳 고르기 · {LV[order(level)].name}</b><span><Icon name="clock" /> {(u * sim.seconds).toFixed(1)} / {sim.seconds} {sim.timeUnit}</span></header>
              <p className="vbLegend"><i className="d" /> 기준(정상 설계) <i className="s" /> {fixed ? "수리한 차량" : "시험 대상"} · 최대 {PROBE_LIMIT}곳</p>
              <ul>{list.map((sig, index) => { const on = probed[index]; const done = on && (lastRun || running) && u >= 1; return <li key={sig.id} className={`${on ? "probed" : ""} ${done && divergeIndex(sig) !== null ? "off" : ""}`}>
                <button className="vbClip" onClick={() => toggleProbe(index)} title="잴 곳 고르기">{on ? <Icon name="probe" /> : "○"}</button>
                <span className="vbSigName"><small>{index === 0 ? "입력 쪽" : index === list.length - 1 ? "출력 쪽" : `${index + 1}번째`}</small><b>{sig.name}</b></span>
                <SeriesTrace sig={sig} upto={u} probed={on} />
                <em className="vbVal">{on ? done ? <><b className={`w-${word(sig)}`}>{word(sig)}</b> {sample(sig.run).toFixed(sig.max < 10 ? 1 : 0)}{sig.unit}</> : `${sample(sig.run).toFixed(sig.max < 10 ? 1 : 0)} ${sig.unit}` : "—"}</em>
              </li>; })}</ul>
              {(phase === "retest" || phase === "done") && regDone > 0 && <div className="vbReg"><b><Icon name="repeat" /> 회귀 시험</b><ul>{regression.map((name, index) => <li key={name} className={index < regDone ? "ok" : ""}><span>{name}</span><em>{index < regDone ? "통과" : "…"}</em></li>)}</ul></div>}
              <div className="vbMonitorFoot">
                {phase === "lab" && <button className="vbGo ghost" disabled={running} onClick={() => { setPhase("pick"); setLastRun(null); }}>다른 시험 고르기</button>}
                {phase !== "done" && !(phase === "lab" && lastRun) && <button className="vbGo" disabled={running || !probeCount} onClick={run}>{running ? "시험 중…" : !probeCount ? "잴 곳을 먼저 골라요" : phase === "retest" ? "▶ 같은 시험 다시" : "▶ 시험 실행"}</button>}
                {phase === "done" && <button className="vbGo" onClick={finish}>수리 적용 · 다시 달리기 →</button>}
              </div>
            </div>
          </section>}
      <div className="vbBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{numify(bubble)}</p></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={reveal}>정답 보기</button>
  </div>;
}


// ===== Stage 3 · Q&A v2: no probe picking, result table, a "판단 기준" card for every question =====
// The card states the prediction ("if this suspect is the cause, this test must show …") and which parts are real
// in the chosen test, so the answer is reasoned from expectation vs. observation, not guessed.
const PREDICT: Record<string, string> = {
  vcu_sw: "VCU SW가 원인이라면: SW만 PC에서 돌려도 '페달 처리값'이 낮게 나와요. 제어기·차량 시험에서는 이 값이 안 보여서 SW인지 입력 회로인지 구별이 안 돼요.",
  vcu_hw: "입력 회로가 원인이라면: 입력 회로가 없는 'SW만 PC' 시험에서는 '페달 처리값'이 정상으로 나와요. 제어기·차량 시험에서는 이 값이 안 보여서 구별이 안 돼요.",
  fan_sw: "출력 어댑터 실행 순서가 원인이라면: 팬 요청 계산은 정상이지만 임베디드 I/O 시험의 'PWM 출력값'부터 0이어야 해요.",
  fan_path: "상태 전이 SW가 원인이라면: SW 시험의 팬 요청 또는 PWM 계산값부터 기준과 달라야 해요.",
  fan_motor: "피드백 처리 SW가 원인이라면: PWM 출력은 정상이고 읽어 온 회전값만 기준과 달라야 해요.",
  blend_sw: "배분 SW가 원인이라면: SW만 PC에서 돌려도 '압력 명령'이 기준과 달라야 해요.",
  hyd_path: "I/O 스케일링 SW가 원인이라면: 내부 압력 계산은 42 bar지만 전송값부터 약 8 bar여야 해요.",
  caliper: "피드백 처리 SW가 원인이라면: 전송 명령은 정상이고 읽어 온 압력값만 낮아야 해요.",
};
const ANSWER_BTN: Record<Answer, [string, string]> = { supported: ["가설 지지", "관찰한 신호·출력 변화가 이 가설의 예측과 일치"], refuted: ["가설 반박", "관찰한 결과가 이 가설의 예측과 모순"], open: ["판단 보류", "필요한 신호를 이 수준에서 볼 수 없거나 다른 원인과 구분할 증거 부족"] };
const CONTRACT_SIGNAL_LABEL: Record<string, string> = {
  ready: "READY 상태",
  gearDrive: "변속 위치 D",
  vehicleSpeed: "차량 속도",
  brakePedal: "브레이크 입력",
  fanCommand: "냉각팬 명령",
  coolantTemperature: "냉각수 온도",
  batterySoc: "배터리 SOC",
  absActive: "ABS 상태",
  regenAvailable: "회생 제동 가용 감속도",
  aps: "가속 페달 입력",
};
const contractSignalLabel = (signalId: string) => CONTRACT_SIGNAL_LABEL[signalId] ?? signalId;

/** One finished test run. Runs are stored per test level (fault-unit / fault-embedded / fault-vehicle) plus "fixed" for the repair re-test. */
type BenchRun = { obs: Record<string, Obs>; vals: Record<string, string>; verdict: Verdict; fixed: boolean; level: Lv; assessment: ContractRunAssessment; input?: string; hyp?: string };
// 2026-11-12: fault runs are kept per hypothesis and per level (`${hyp}:fault-${lv}`), so a hypothesis can only be
// judged from a test that was actually run for it. The repair re-test stays one shared "fixed" record.
const runKey = (fixed: boolean, lv: Lv, hyp = "") => (fixed ? "fixed" : `${hyp}:fault-${lv}`);
/** Older saves kept one result per level (`fault-${lv}`); they belong to the hypothesis that was open at the time. */
const migrateRuns = (raw: Record<string, BenchRun>, hyp: string) => Object.fromEntries(Object.entries(raw).map(([key, value]) => [key.startsWith("fault-") ? `${hyp}:${key}` : key, value]));
/** The simulation view each test level observes (shown as the subtitle of the level tab). */
const VIEW_SUB: Record<Lv, string> = { unit: "SW 로직", swint: "SW 로직", embedded: "제어기·I/O", vehicle: "부품·차량" };
const viewOf = (lv: Lv): "sw" | "ecu" | "plant" => (lv === "unit" || lv === "swint" ? "sw" : lv === "embedded" ? "ecu" : "plant");

export function TwinBenchExperience({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const requestedView = (() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "embedded") return "ecu";
    if (tab === "system" || tab === "vehicle") return "plant";
    return (["sw", "ecu", "plant", "graph"] as const).includes(tab as any) ? tab as "sw" | "ecu" | "plant" | "graph" : "sw";
  })();
  const requestedLevel: Lv = requestedView === "ecu" ? "embedded" : requestedView === "plant" ? "vehicle" : "unit";
  const contractLoad = (() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(contractStorageKey(caseId)) ?? "null");
      return validateVerificationContract(saved, caseId);
    } catch { return { ok: false as const, errors: ["저장된 테스트 설계서를 읽을 수 없습니다."] }; }
  })();
  const contractReady = contractLoad.ok;
  const contractErrors = contractLoad.ok ? [] : contractLoad.errors;
  // The fallback is display-only. A missing/incomplete STEP03 contract never enables a bench run.
  const contract: VerificationContract = contractLoad.ok ? contractLoad.contract : fallbackVerificationContract(caseId);
  const meta = SCENARIO_META[caseId];
  const questions = QUESTIONS[caseId];
  const expect = (() => { try { return sessionStorage.getItem(`tb-expect-${caseId}`) ?? ""; } catch { return ""; } })();
  const progressKey = `tb-step04-progress-${caseId}`;
  const savedProgress = (() => { try { return JSON.parse(sessionStorage.getItem(progressKey) ?? "null") ?? {}; } catch { return {}; } })();
  // STEP02 "먼저 시험할 가설" opens first; every hypothesis is still tested and judged before the report.
  const [qi, setQi] = useState<number>(savedProgress.qi ?? Math.max(0, questions.findIndex(item => item.hyp === state.hypothesis[caseId])));
  // Start with the driver's question and one decision, rather than presenting a dense lab console.
  const [phase, setPhase] = useState<"pick" | "lab" | "report" | "ab" | "repair" | "retest" | "done">(savedProgress.phase ?? "pick");
  // final cause chosen after the report, and the A/B comparison run (normal model vs. cause-removed model)
  const [cause, setCause] = useState<string | null>(savedProgress.cause ?? null);
  const [abDone, setAbDone] = useState<boolean>(Boolean(savedProgress.abDone));
  const [abTab, setAbTab] = useState<"graph" | "result">("result");
  const [level, setLevel] = useState<Lv>(savedProgress.level ?? requestedLevel);
  const [u, setU] = useState<number>(savedProgress.u ?? 0);
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState<Record<string, BenchRun>>(() => migrateRuns(savedProgress.runs ?? (savedProgress.lastRun ? { [savedProgress.lastRun.fixed ? "fixed" : `fault-${savedProgress.lastRun.level}`]: savedProgress.lastRun } : {}), questions[savedProgress.qi ?? 0]?.hyp ?? ""));
  // hypotheses judged "판단 보류" on a level: the player still has to run another level for them
  const [held, setHeld] = useState<Record<string, Lv[]>>(savedProgress.held ?? {});
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  // test materials the player has opened: STEP03 design sheet (TC) and STEP02 reproduction log
  const [seen, setSeen] = useState<{ tc: boolean; log: boolean }>(savedProgress.seen ?? { tc: false, log: false });
  const [answers, setAnswers] = useState<Record<string, { answer: Answer; why: string; evidence: string }>>(savedProgress.answers ?? {});
  const [cost, setCost] = useState<number>(savedProgress.cost ?? 0);
  const [mistakes, setMistakes] = useState<number>(savedProgress.mistakes ?? 0);
  const [fix, setFix] = useState<number | null>(savedProgress.fix ?? null);
  const [viewTab, setViewTab] = useState<"sw" | "ecu" | "plant" | "graph">(savedProgress.viewTab ?? requestedView);
  const [bubble, setBubble] = useState(savedProgress.bubble ?? `${DRIVER_NAME}의 질문에 시험 결과로 답하세요. 시험 수준과 입력 조건을 고르고 '시험 실행'을 누르세요.`);
  const [help, setHelp] = useState(false);
  const [runLog, setRunLog] = useState<{ level: Lv; verdict: Verdict; fixed: boolean; q: number; input: string; hyp?: string }[]>(savedProgress.runLog ?? []);
  const q = questions[qi];
  const fixed = phase === "retest" || phase === "done";
  // results are kept per test level: switching levels never hides or deletes another level's result
  const lastRun: BenchRun | null = runs[runKey(fixed, level, q?.hyp)] ?? null;
  // the player chooses the input condition of the test (same input goes to the normal and the fault model)
  const [pickedDeriv, setPickedDeriv] = useState<Deriv | null>(savedProgress.pickedDeriv ?? null);
  const [show3d, setShow3d] = useState<"run" | "normal">(savedProgress.show3d ?? "run");
  const [replayOpen, setReplayOpen] = useState(false);
  const deriv = pickedDeriv ?? qaDeriv(caseId, level);
  const tech = CASE_DERIVS[caseId].find(d => d.id === deriv)!;
  // the contract actually executed for the chosen input (stimulus + expected outputs for that input)
  const activeContract = useMemo(() => contractForInput(caseId, contract, deriv, tech.tech), [caseId, contract, deriv, tech.tech]);
  const sim = useMemo(() => simulate(caseId, tech.tech, fixed, activeContract.execution), [caseId, tech.tech, fixed, activeContract]);
  const causeOk = Boolean(cause && meta.hypotheses.find(h => h.id === cause)?.truth);
  // A/B: left = normal model, right = model with the chosen cause removed (a wrong cause leaves the fault in place)
  const abSim = useMemo(() => simulate(caseId, tech.tech, causeOk, activeContract.execution), [caseId, tech.tech, causeOk, activeContract]);
  const list = sim.levels[level];
  const order = (id: Lv) => LV.findIndex(item => item.id === id);
  const stars = cost <= BEST_COST[caseId] + 2 && mistakes <= 1 ? 3 : cost <= BEST_COST[caseId] + 8 && mistakes <= 3 ? 2 : 1;
  const swSame = firstMismatch(sim.levels.unit) === null;
  const ecuReal = level === "embedded" || level === "vehicle", plantReal = level === "vehicle";
  const works = fixed || firstMismatch(list) === null;
  const hypDef = meta.hypotheses.find(h => h.id === q?.hyp);
  // signals the current question's rules look at on this level (highlighted as "볼 곳")
  const lookAt = new Set((hypDef?.rules ?? []).filter(rule => !rule.levels || rule.levels.includes(level)).flatMap(rule => Object.keys(rule.need)));
  const hypothesisSignals = [...lookAt].map(id => list.find(sig => sig.id === id)?.name ?? id);
  // levels where this hypothesis can actually be decided (scenario rules), shown as the next-test hint
  // levels that decide this hypothesis under the scenario fault (scenario data, checked against the rules by tests)
  const decisiveLevels = QA_LEVELS.filter(lv => hypDef?.decideAt ? hypDef.decideAt.includes(lv) : (hypDef?.rules ?? []).some(rule => !rule.levels || rule.levels.includes(lv) || (lv === "unit" && rule.levels.includes("swint"))));
  const hypothesisStep = Math.min(qi + 1, questions.length);
  const answeredHypotheses = questions.filter(item => answers[item.hyp]).length;
  const at = (sig: Series) => divergeIndex(sig) !== null ? sig.ref.reduce((best, v, i) => (Math.abs(v - sig.run[i]) > Math.abs(sig.ref[best] - sig.run[best]) ? i : best), 0) : sig.ref.reduce((best, v, i) => (v > sig.ref[best] ? i : best), 0);
  const fmtV = (sig: Series, v: number) => `${v.toFixed(sig.max < 10 ? 1 : 0)} ${sig.unit}`;
  const word = (sig: Series) => { const d = divergeIndex(sig); if (d === null) return "같음"; return sig.run[d] > sig.ref[d] ? "높음" : "낮음"; };
  const shown = Boolean(lastRun && !running);
  const roadmapStep = phase === "pick" ? 0 : phase === "lab" ? (shown || running ? 2 : 1) : phase === "report" || phase === "ab" || phase === "repair" ? 3 : 4;
  const sameConditionCompare = phase === "retest" || phase === "done";
  const inNormalRange = (sig: Series) => fixed && shown && word(sig) === "같음";
  const hypothesisGoal = hypDef?.label ?? q?.ask ?? "수리 후 정상 범위 확인";
  const needsInputPick = CASE_DERIVS[caseId].length > 1 && !pickedDeriv;
  // STEP02 → STEP04 read-only evidence link (no invented values: missing data shows 기록 없음).
  const step02 = (() => {
    const read = <T,>(key: string): T | null => { try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; } };
    const progress = read<{ chain?: string[]; attached?: string[]; measured?: string[] }>(`tb-step02-progress-${caseId}`);
    const impact = read<string[]>(`tb-impact-${caseId}`);
    let section: string | null = null;
    try { section = sessionStorage.getItem(`tb-section-${caseId}`); } catch { /* ignore */ }
    const doms = TRACE_CASES[caseId]?.doms ?? [];
    const named = (ids?: string[]) => (ids ?? []).map(id => doms.find(item => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
    const chain = named(progress?.chain), attached = named(progress?.attached), measured = named(progress?.measured);
    const linked = Boolean(progress || section || (Array.isArray(impact) && impact.length));
    return { linked, chain, attached, measured, section, impact: Array.isArray(impact) ? impact : [] };
  })();
  const materialsReady = fixed || (seen.tc && (seen.log || !step02.linked));
  // Player-facing next action, derived from the real phase/run state (shown in the bottom cat panel).
  const guidance = !contractReady
    ? "STEP03 테스트 설계서가 없어서 시험을 실행할 수 없어요. 위쪽 안내의 'STEP03에서 테스트 설계서 다시 발급'을 눌러 설계서를 만들어 오세요."
    : phase === "pick"
      ? `이번에 확인할 가설은 “${hypothesisGoal}”(${qi + 1}/${questions.length})예요. 아래 시험 카드 중 하나를 골라 어떤 수준으로 확인할지 정하세요. 시험 수준이 낮을수록 볼 수 있는 범위가 좁아요.`
      : phase === "lab" && running
        ? "시험을 실행 중이에요. 정상 기준(점선)과 같은 입력이 고장 모델에도 들어가고 있어요. 끝나면 결과 표가 채워져요."
        : phase === "lab" && !shown && !materialsReady
          ? `${step02.linked ? "STEP02 고장 재현 로그는 '고장 때 실제로 이렇게 나왔다', " : ""}STEP03 시험 설계서는 '정상이면 이렇게 나와야 한다'예요. 두 자료를 열어 비교한 뒤 시험해요.`
          : phase === "lab" && !shown
            ? (needsInputPick ? "고장 당시 운전 조작과 차량 상태를 시험 입력으로 재구성해, 정상 기준 모델과 고장이 들어 있는 시험 대상 SW에 똑같이 넣어요. 확인하려는 목적에 맞는 입력을 고르세요." : `${TEST_CARD[level].name}(${VIEW_SUB[level]})입니다. 왼쪽 시험 입력을 확인하고 실행하세요. 실행 중에는 모니터링에서 점선(정상)과 실선(이번 시험)이 갈라지는 곳을 보세요.`)
            : phase === "lab" && feedback
              ? bubble
            : phase === "lab"
              ? `판정 근거 · 이 가설이 맞다면: ${PREDICT[q?.hyp ?? ""] ?? "-"} · 이 수준에서 볼 신호: ${hypothesisSignals.length ? hypothesisSignals.join(", ") : "없음(이 수준으로는 이 가설을 가를 수 없어요)"} · 가를 수 있는 시험: ${decisiveLevels.map(lv => TEST_CARD[lv].name).join(", ") || "없음"}`
            : phase === "report"
              ? "가설 판정을 모두 마쳤어요. 보고서의 판정과 근거를 보고, 원인 유형·발생 위치까지 맞는 최종 고장 원인을 고르세요."
              : phase === "ab"
                ? (abDone ? (causeOk ? "원인을 제거한 모델이 정상 모델과 같아졌어요. 이 원인을 없애는 수리 방법을 고르세요." : "원인을 제거해도 정상 모델과 달라요. 최종 원인을 다시 고르세요.") : "왼쪽은 정상 모델, 오른쪽은 고른 원인을 제거한 모델이에요. 같은 조건으로 동시에 실행해 비교하세요.")
              : phase === "repair"
                ? "확정한 원인을 실제로 없애는 수리 방법을 고르세요. 증상만 가리는 조치는 다른 조건에서 문제를 만들어요."
              : phase === "retest" && !shown
                ? "수리한 SW로 같은 초기 조건·입력을 다시 실행해서 정상 기준선과 비교하세요. ‘동일 조건 기준선 비교 실행’을 누르세요."
                : phase === "retest"
                  ? "아직 정상 범위를 벗어난 신호가 있어요. 오른쪽 표의 ‘미충족’ 신호를 확인하고 다시 실행하세요."
                  : "정상 범위를 확인했어요. ‘수리 적용 · 주행 복귀’를 눌러 주행으로 돌아가세요.";
  // Why the question counter exists: one candidate hypothesis per question.
  const questionWhy = `이 사건의 후보 가설은 ${questions.length}개예요. 가설마다 시험 한 번으로 답하므로 ${qi + 1}/${questions.length}은 ‘${questions.length}개 중 ${qi + 1}번째 가설’이라는 뜻이에요.`;
  const nextReason = answeredHypotheses >= questions.length
    ? "모든 가설 판정 완료 → 수리 조치로 넘어가요."
    : answers[q?.hyp ?? ""]
      ? "이 가설은 판정됐어요. 아직 판정하지 않은 후보가 남아 다음 가설로 넘어가요."
      : answeredHypotheses > 0
        ? `앞 가설은 판정했어요. 남은 ${questions.length - answeredHypotheses}개 후보도 같은 방식으로 확인해야 원인을 가를 수 있어요.`
        : "후보를 하나씩 확인해야 원인을 가를 수 있어요. 판정하면 다음 가설로 넘어가요.";
  const logSummary = !step02.linked ? "기록 없음" : step02.chain.length ? `최초 편차 · ${step02.chain[step02.chain.length - 1].label}${step02.section ? ` · 의심 구간 ${step02.section}` : ""}` : step02.section ? `의심 구간 · ${step02.section}` : "STEP02 진행 기록";
  const [chip, setChip] = useState<"tc" | "log" | null>(null);
  const initialConditionRows = activeContract.execution.initial.map(item => ({ label: contractSignalLabel(item.signalId), value: item.value, unit: item.unit }));
  const stimulusRows = [
    { label: contractSignalLabel(activeContract.execution.stimulus.signalId), value: `${activeContract.execution.stimulus.startValue} → ${activeContract.execution.stimulus.endValue}`, unit: activeContract.execution.stimulus.unit },
    { label: "입력 변화 시간", value: activeContract.execution.stimulus.rampSeconds === 0 ? "0 (계단)" : activeContract.execution.stimulus.rampSeconds, unit: "s" },
    { label: "입력 유지 시간", value: activeContract.execution.stimulus.holdSeconds, unit: "s" },
  ];
  const observationGoal = hypothesisSignals.length ? hypothesisSignals.join(" · ") : contract.observations.map(item => item.label).join(" · ");
  useEffect(() => { try { sessionStorage.setItem(progressKey, JSON.stringify({ qi, phase, level, u, runs, seen, answers, cost, mistakes, fix, viewTab, bubble, pickedDeriv, show3d, runLog, held, cause, abDone })); } catch { /* ignore */ } }, [qi, phase, level, u, runs, seen, answers, cost, mistakes, fix, viewTab, bubble, pickedDeriv, show3d, runLog, held, cause, abDone, progressKey]);
  const resetStage = () => { setQi(0); setPhase("pick"); setLevel(requestedLevel); setU(0); setRunning(false); setRuns({}); setSeen({ tc: false, log: false }); setAnswers({}); setCost(0); setMistakes(0); setFix(null); setViewTab(requestedView); setPickedDeriv(null); setShow3d("run"); setHeld({}); setFeedback(null); setCause(null); setAbDone(false); setBubble(`${DRIVER_NAME}의 질문에 시험 결과로 답하세요. 시험 수준과 입력 조건을 고르고 '시험 실행'을 누르세요.`); try { sessionStorage.removeItem(progressKey); } catch { /* ignore */ } };

  // choosing a test level = choosing its simulation view; every level keeps its own result
  const selectLevel = (lv: Lv) => { setShow3d("run"); setLevel(lv); setViewTab(viewOf(lv)); setFeedback(null); setU(runs[runKey(fixed, lv, q?.hyp)] ? 1 : 0); };
  // hypothesis number = which hypothesis is being verified; its own runs, input pick and judgement stay separate
  const selectHypothesis = (k: number) => {
    if (running || (phase !== "lab" && phase !== "pick") || k === qi) return;
    setQi(k); setPickedDeriv(null); setFeedback(null); setU(runs[runKey(false, level, questions[k].hyp)] ? 1 : 0); play("pop");
    setBubble(`가설 ${k + 1}을 검증해요. 이 가설에 맞는 시험 수준과 입력 조건을 골라 직접 실행해야 판정할 수 있어요.`);
  };
  const pickTest = (lv: Lv) => { setPickedDeriv(null); selectLevel(lv); setPhase("lab"); play("pop");
    setBubble(`${TEST_CARD[lv].name}(${VIEW_SUB[lv]})을 골랐어요. 시험 자료를 확인한 뒤 시험을 실행하세요.`); };
  const openMaterial = (kind: "tc" | "log") => { setChip(chip === kind ? null : kind); setSeen(prev => ({ ...prev, [kind]: true })); play("pop"); };
  const run = () => {
    if (running || !contractReady) {
      if (!contractReady) setBubble(`시험 계약 오류: ${contractErrors.join(" ")}`);
      return;
    }
    if (!materialsReady) { setBubble("먼저 시험 자료(STEP03 시험 설계서, STEP02 고장 재현 로그)를 확인하세요."); play("error"); return; }
    setRunning(true); setU(0); setFeedback(null); setViewTab("graph"); play("zip");
    if (!fixed) setCost(c => c + LV_COST[level]);
    const started = performance.now(), lst = list, lv = level, isFixed = fixed;
    const tick = () => {
      const next = Math.min(1, (performance.now() - started) / 2000);
      setU(next);
      if (next < 1) { requestAnimationFrame(tick); return; }
      setRunning(false);
      const requiredSignalIds = activeContract.execution.observationSignalIds[lv];
      const { obs } = observe(lst, requiredSignalIds);
      const assessment = assessContractRun(activeContract, lv, lst);
      const verdict = assessment.verdict;
      const vals = Object.fromEntries(lst.map(sig => { const i = at(sig); return [sig.id, `${sig.name} ${fmtV(sig, sig.run[i])} (기준 ${fmtV(sig, sig.ref[i])})`]; }));
      const hyp = q?.hyp ?? "";
      setRuns(prev => ({ ...prev, [runKey(isFixed, lv, hyp)]: { obs, verdict, vals, fixed: isFixed, level: lv, assessment, input: tech.input, hyp } }));
      setRunLog(log => [...log, { level: lv, verdict, fixed: isFixed, q: qi, input: tech.input, hyp: isFixed ? undefined : hyp }]);
      setViewTab(viewOf(lv));
      if (isFixed) {
        if (verdict === "PASS") { play("stamp"); showVerdict(true, "통과"); setBubble("수정 후 결과가 같은 입력·초기 조건의 정상 기준선과 같아요. 신호·제어 출력·차량 반응이 정상 범위를 충족했는지 확인하세요."); window.setTimeout(() => setPhase("done"), 700); }
        else if (verdict === "INCONCLUSIVE") setBubble(`계약에 필요한 관찰 신호를 확인할 수 없습니다: ${assessment.missingSignalIds.join(", ") || "기대 출력 신호 없음"}`);
        else setBubble(`아직 계약의 정상 범위를 충족하지 못했습니다: ${[...assessment.outOfRangeSignalIds, ...assessment.expectedOutputFailures].join(", ")}`);
        return;
      }
      play(verdict === "FAIL" ? "error" : "pop");
      setBubble(`결과가 나왔어요. 그래프의 점선(정상)과 실선(이번 시험)을 비교하고, 판단 기준대로 답하세요.`);
    };
    requestAnimationFrame(tick);
  };
  const answer = (pick: Answer) => {
    if (!lastRun || !q) return;
    const keyAns = judgeRun(caseId, { level: lastRun.level, fixed: false, obs: lastRun.obs }).find(item => item.id === q.hyp)!;
    if (pick !== keyAns.verdict) {
      setMistakes(n => n + 1); showVerdict(false);
      const text = keyAns.verdict === "open" ? `이 시험만으로는 가를 수 없어요. ${PREDICT[q.hyp] ?? ""}` : `다시 비교해 보세요. ${keyAns.why}`;
      setFeedback({ ok: false, text }); setBubble(text);
      return;
    }
    if (pick === "open") {
      play("pop"); setHeld(prev => ({ ...prev, [q.hyp]: [...new Set([...(prev[q.hyp] ?? []), lastRun.level])] }));
      const hold = hypDef?.hold?.[lastRun.level];
      const next = (hold?.next ?? decisiveLevels).filter(lv => lv !== lastRun.level).map(lv => TEST_CARD[lv].name);
      const text = `판단 보류로 기록했어요. ${TEST_CARD[lastRun.level].name}에서는 ${hold ? `이 가설을 가를 신호(${hold.unseen})를 볼 수 없어요. ${hold.why}` : "이 가설을 가를 신호를 볼 수 없어요."}${next.length ? ` 다음에는 ${next.join(" 또는 ")}을 골라 이 가설로 다시 실행하세요.` : " 다른 시험 수준에서 다시 실행하세요."}`;
      setFeedback({ ok: true, text: hold ? `판단 보류 · 이 시험에서 볼 수 없는 신호: ${hold.unseen}${next.length ? ` → 다음: ${next.join(" 또는 ")}` : ""}` : text }); setBubble(text); return;
    }
    const evidence = `${TEST_CARD[lastRun.level].name} · ${keyAns.need.map(id => lastRun.vals[id]).filter(Boolean).join(", ")}`;
    const nextAnswers = { ...answers, [q.hyp]: { answer: pick, why: keyAns.why, evidence } };
    setAnswers(nextAnswers);
    showVerdict(true, ANSWER_KO[pick]); play("stamp");
    setFeedback({ ok: true, text: `${keyAns.why} → ${ANSWER_KO[pick]}` });
    setBubble(`${keyAns.why} → "${ANSWER_KO[pick]}"`);
    window.setTimeout(() => {
      const nextIndex = questions.findIndex((item, k) => k !== qi && !nextAnswers[item.hyp]);
      setFeedback(null);
      if (nextIndex >= 0) { setQi(nextIndex); setPickedDeriv(null); setU(runs[runKey(false, level, questions[nextIndex].hyp)] ? 1 : 0); setBubble(`다음은 가설 ${nextIndex + 1}이에요. 이 가설로 시험을 직접 실행해야 판정할 수 있어요. 시험 수준과 입력 조건을 고르세요.`); }
      else { setPhase("report"); setBubble("모든 가설을 시험 결과로 판정했어요. 보고서를 확인하고 최종 고장 원인을 고르세요."); }
    }, 1100);
  };
  const pickCause = (hyp: string) => {
    if (running) return;
    setCause(hyp); setAbDone(false); setAbTab("result"); setU(0); setFeedback(null); play("pop");
    const picked = CAUSES[caseId].find(item => item.hyp === hyp);
    setBubble(`최종 원인으로 '${picked?.name ?? hyp}'을(를) 골랐어요. 정상 모델과 이 원인을 제거한 모델을 같은 조건으로 동시에 실행해 비교하세요.`);
    setPhase("ab");
  };
  const runAb = () => {
    if (running) return;
    setRunning(true); setU(0); setAbTab("graph"); play("zip");
    const started = performance.now();
    const tick = () => {
      const next = Math.min(1, (performance.now() - started) / 2400);
      setU(next);
      if (next < 1) { requestAnimationFrame(tick); return; }
      setRunning(false); setAbDone(true); setAbTab("result");
      if (causeOk) { play("stamp"); showVerdict(true, "정상 기준과 일치"); setBubble("원인을 제거한 모델이 같은 조건의 정상 모델과 일치해요. 이 원인을 실제로 없애는 수리 방법을 고르세요."); }
      else { play("error"); showVerdict(false); setBubble("원인을 제거한 모델이 아직 정상 모델과 달라요. 고른 원인이 실제 고장 메커니즘이 아니에요. 시험 결과를 다시 보고 최종 원인을 다시 고르세요."); }
    };
    requestAnimationFrame(tick);
  };
  const pickFix = (i: number) => {
    setFix(i);
    const item = FIXES[caseId][i];
    if (!item.ok) { setMistakes(n => n + 1); setBubble(item.why); showVerdict(false); return; }
    showVerdict(true, "조치 요청"); setBubble(`${item.why} 같은 시험으로 다시 확인하세요.`);
    const expectedProgram = caseId === "propulsion" ? "nominal" : caseId === "thermal" ? "thermal_closed_loop" : "blended_brake";
    if (state.program[caseId] !== expectedProgram) send({ type: "COMPILE", program: expectedProgram });
    // The repair check keeps the selected contract input and initial state, then
    // uses the vehicle-level record so signal, controller output, and response share one comparison table.
    const compareLevel: Lv = "vehicle";
    window.setTimeout(() => { setLevel(compareLevel); setViewTab("plant"); setU(0); setPhase("retest"); setBubble("같은 초기 조건과 입력으로 정상 기준선·수정 후 신호·제어 출력·차량 반응을 비교하세요."); }, 800);
  };
  const trueHypothesis = meta.hypotheses.find(item => item.truth)?.id;
  const causeCorrect = Boolean(trueHypothesis
    && answers[trueHypothesis]?.answer === "supported"
    && questions.filter(item => item.hyp !== trueHypothesis).every(item => answers[item.hyp]?.answer === "refuted"));
  const retestPassed = Boolean(contractReady && phase === "done" && lastRun?.fixed && lastRun.verdict === "PASS");
  const finish = () => {
    if (!retestPassed) { setBubble("재시험이 계약의 정상 기준을 통과해야 주행으로 복귀할 수 있습니다."); return; }
    send({ type: "BENCH_RESULT", pass: retestPassed, causeCorrect });
  };
  const reveal = () => { setAnswers(Object.fromEntries(questions.map(item => { const h = meta.hypotheses.find(x => x.id === item.hyp)!; return [item.hyp, { answer: h.truth ? "supported" as Answer : "refuted" as Answer, why: h.rules[0]?.why ?? h.stage1 ?? "", evidence: "개발용 정답" }]; }))); setPhase("report"); };

  const tabVisual = viewTab === "graph" ? <OverlayGraph list={list} upto={shown ? 1 : running ? u : 0} look={lookAt} note={lookAt.size ? "빨간 이름이 이 가설을 가를 신호예요. 점선(정상)과 실선(이번 시험)이 처음 갈라지는 곳을 보세요." : "이 수준에는 이 가설을 가를 신호가 없어요. 어떤 신호가 정상과 갈라지는지만 확인하세요."} />
    : viewTab === "sw" ? <RefPuzzleTrack key={`sw-${level}-${fixed}`} mode={level === "unit" ? "unit" : "swint"} caseId={caseId} progress={u} fixed={fixed} same={fixed || swSame} running={running} />
    : viewTab === "ecu" ? <EmbeddedBench3D caseId={caseId} running={running} works={show3d === "normal" || (ecuReal ? works : true)} />
      : caseId === "propulsion" ? <BenchVisual tab="vehicle" caseId={caseId} running={running} works={show3d === "normal" || (plantReal ? works : true)} /> : <EmbeddedBench3D caseId={caseId} running={running} works={show3d === "normal" || (plantReal ? works : true)} />;
  const realChips = <span className="qaReal"><i className="on">SW 실물</i><i className={ecuReal ? "on" : ""}>제어기 {ecuReal ? "실물" : "없음"}</i><i className={plantReal ? "on" : ""}>부품·차량 {plantReal ? "실물" : "모델"}</i></span>;

  const coach = state.completedCases.length ? "" : phase === "lab" && !shown ? "run" : phase === "lab" ? "answer" : "";
  return <div className="vbBench v7 qa qa2" data-coach={coach}>
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="검증" title="시뮬레이션 검증" distanceMeters={state.policeGapMeters} raceDistanceMeters={state.raceDistance} progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <StageFolderSubtitle className="benchStageFolder" action="의심한 SW를 시험·수정하고 정상 차량과 결과를 비교하세요." detail={<>이전 결과: 테스트 설계서 <i>|</i> 비교: 정상 기준선 ↔ 수정 후 차량</>} />
    <StageIntro id="bench-qa2" stage="STEP 04 · 실험 검증" title="실험 검증" goal="추리한 고장 원인 가설이 실제 원인인지 시험으로 확인합니다." steps={[
      { icon: "clipboard", text: "정상 동작 기준(STEP03)과 고장 당시 기록(STEP02)을 비교합니다." },
      { icon: "monitor", text: "고장 당시 조건을 재현할 시험 입력을 고르고 실행합니다." },
      { icon: "search", text: "실행 결과와 신호 변화를 관찰합니다." },
      { icon: "flag", text: "관측 증거를 근거로 원인 가설을 판정합니다." },
    ]} />
    <main className="vbLayout">
      {!contractReady && <aside className="qaCriteria big" role="alert"><small><Icon name="clipboard" /> 테스트 설계서 오류</small><p>{contractErrors.join(" ")}</p><button onClick={() => send({ type: "OPEN_WIRING" })}>STEP03에서 테스트 설계서 다시 발급</button></aside>}
      <header className="qaInfo" aria-label="검증 요약">
        <div className="qaInfoMain">
          <div className="qaHypo">
            <small>{phase === "pick" || phase === "lab" ? numify(`검증 대상 고장 원인 가설 · ${hypothesisStep}/${questions.length}`) : phase === "report" ? "가설 판정 완료" : phase === "ab" ? "최종 원인 확인" : phase === "repair" ? "수리 선택" : "수리 후 확인"}</small>
            <b title={phase === "pick" || phase === "lab" ? hypothesisGoal : undefined}>{phase === "pick" || phase === "lab" ? hypothesisGoal : phase === "report" ? "최종 고장 원인 선택" : phase === "ab" ? "정상 모델 vs 원인 제거 모델 (A/B)" : phase === "repair" ? "원인을 제거할 수리 방법 선택" : "동일 조건 기준선 재시험"}</b>
            {(phase === "pick" || phase === "lab") && q && <span>“{q.ask}”</span>}
          </div>
          <div className="qaProg">
            <ol className="qaDots" aria-label="검증할 고장 원인 가설 선택">{questions.map((item, k) => { const a = answers[item.hyp]; const label = meta.hypotheses.find(h => h.id === item.hyp)?.label ?? item.ask; const status = a ? ANSWER_KO[a.answer] : held[item.hyp]?.length ? "판단 보류 · 다른 수준 시험 필요" : k === qi && (phase === "lab" || phase === "pick") ? "검증 중" : "미판정"; return <li key={item.hyp} className={`${a ? `a-${a.answer}` : held[item.hyp]?.length ? "a-open" : ""} ${k === qi && phase !== "report" ? "now" : ""}`}>
              <button type="button" disabled={running || (phase !== "lab" && phase !== "pick")} aria-pressed={k === qi} aria-label={`가설 ${k + 1}: ${label} · ${status}`} onClick={() => selectHypothesis(k)}>{k + 1}</button>
              <span className="qaDotTip" role="tooltip"><b>가설 {k + 1} · {label}</b><small>{status}</small></span>
            </li>; })}</ol>
          </div>
          <ol className="qaSteps" aria-label="검증 단계">{([["시험 범위 선택", "시험 수준을 고르세요"], ["고장 조건 재현", "입력 조건을 확인하고 실행하세요"], ["가설 검증·결과 비교", "기대값과 실제값을 비교해 가설을 판정하세요"], ["원인 확정·수리", "원인에 맞는 수리 조치를 고르세요"], ["동일 조건 재시험", "같은 조건으로 다시 실행하세요"]] as const).map(([label, action], index) => <li key={label} className={index < roadmapStep ? "done" : index === roadmapStep ? "now" : ""} aria-current={index === roadmapStep ? "step" : undefined}><i>{index < roadmapStep ? "✓" : index + 1}</i><span><b>{label}</b>{index === roadmapStep && <em>{action}</em>}</span></li>)}</ol>
          <button className="qaHelpBtn" aria-label="도움말" onClick={() => { setHelp(v => !v); play("pop"); }}>?</button>
          {phase === "done" && <button className="stageReplayBtn" onClick={() => setReplayOpen(true)}>다시 풀기</button>}
        </div>
        <div className="qaChips" role="group" aria-label="시험 자료 불러오기">
          <button className={`qaChip qaMatChip ${chip === "log" ? "on" : ""} ${seen.log ? "seen" : ""} ${step02.linked ? "" : "empty"}`} aria-expanded={chip === "log"} onClick={() => openMaterial("log")}><small><Icon name="probe" /> STEP02 고장 재현 로그 열기{seen.log ? " ✓" : ""}</small><b>{numify(logSummary)}</b></button>
          <button className={`qaChip qaMatChip ${chip === "tc" ? "on" : ""} ${seen.tc ? "seen" : ""}`} aria-expanded={chip === "tc"} onClick={() => openMaterial("tc")}><small><Icon name="clipboard" /> STEP03 시험 설계서 열기{seen.tc ? " ✓" : ""}</small><b>{numify(expect || contract.expected.value)}</b></button>
        </div>
        {chip && <div className="qaScrim" aria-hidden="true" onClick={() => setChip(null)} />}
        {chip && <aside className="qaChipPop qaMaterial" role="dialog" aria-modal="true" aria-label="시험 자료">
          <button className="qaChipClose" aria-label="닫기" onClick={() => setChip(null)}>×</button>
          {chip === "tc" && <><h4>STEP03 시험 설계서 · {contract.stimulus.label}</h4>
            <p className="qaMatRole"><b>정상 기준</b>정상일 때 어떤 입력에서 어떤 출력이 나와야 하는지 확인하는 자료예요.</p>
            <p className="qaMatLine"><b>무엇을 검증하나요</b>{contract.objective}</p>
            <div className="qaMatLine"><b>정상 시나리오</b><ul className="qaMatList">{normalScenarioLines(caseId).map(line => <li key={line}>{line}</li>)}</ul></div>
            <table className="qaMatTable"><thead><tr><th>정상일 때 기대 출력</th><th>기대값</th><th>허용 오차</th><th>단위</th></tr></thead><tbody>{contract.execution.expectedOutputs.map((item, index) => <tr key={item.signalId}><td>{index === 0 ? contract.expected.signal : contractSignalLabel(item.signalId)}</td><td><code>{item.value}</code></td><td><code>±{item.tolerance}</code></td><td>{item.unit}</td></tr>)}</tbody></table>
            <p className="qaMatLine"><b>이번 시험 입력</b>{pickedDeriv ? tech.input : "아직 고르지 않았어요 · 가운데 카드에서 선택"}</p>
            <p className="qaMatLine"><b>무엇과 비교하나요</b>같은 입력을 넣은 정상 기준 모델</p>
            <details className="qaMatMore"><summary>세부 정보</summary><p className="qaMatLine"><b>관찰 신호</b>{contract.observations.map(item => item.label).join(" · ")}</p><p className="qaMatLine"><b>비교 조건</b>{numify(`${contract.comparison.timeAxis} · 허용 ±${contract.execution.comparisonTolerancePercent}%`)}</p></details></>}
          {chip === "log" && (step02.linked ? <><h4>STEP02 고장 재현 로그 · 도미노 역추적 결과</h4>
            <p className="qaMatRole"><b>고장 당시 기록</b>실제 고장 때 입력·출력과 신호가 정상과 얼마나 달랐는지 확인하는 자료예요.</p>
            <p className="qaMatLine"><b>선택한 가설</b>{meta.hypotheses.find(h => h.id === contract.hypothesisId)?.label ?? meta.hypotheses.find(h => h.id === state.hypothesis[caseId])?.label ?? contract.hypothesisLabel}</p>
            <p className="qaMatLine"><b>최초 편차 신호</b>{step02.chain.length ? step02.chain[step02.chain.length - 1].label : "기록 없음"}</p>
            <p className="qaMatLine"><b>의심 구간</b>{step02.section ?? "STEP02에서 구간을 고르지 않음"}</p>
            {step02.chain.length > 0 ? <table className="qaMatTable"><thead><tr><th>핵심 신호</th><th>정상</th><th>고장</th></tr></thead><tbody>{[...step02.chain].reverse().map(item => <tr key={item.id}><td>{item.label}</td><td><code>{item.ref}</code> {item.unit}</td><td><code>{item.run}</code> {item.unit}</td></tr>)}</tbody></table> : <p className="qaMatLine"><b>핵심 신호</b>기록 없음</p>}
            <p className="qaMatLine"><b>대표 증거</b>{step02.chain.length ? `증상 ${step02.chain[0].label} → 최초 편차 ${step02.chain[step02.chain.length - 1].label}` : "기록 없음"}</p>
            {step02.measured.length > 3 && <details className="qaMatMore"><summary>측정한 지점 전체 ({step02.measured.length}곳)</summary><p className="qaMatLine"><b>측정 지점</b>{step02.measured.map(item => item.label).join(" · ")}</p></details>}</> : <p className="qaChipEmpty">STEP02 저장 기록이 이 세션에 없어요. 값을 임의로 채우지 않고 ‘기록 없음’으로 표시해요.</p>)}
        </aside>}
      </header>
      {help && <aside className="qaHelpCard" role="dialog" aria-label="검증 도움말">
        <b>질문 수가 사건마다 다른 이유</b>
        <p>{questionWhy} 사건마다 의심해 볼 SW 후보가 달라서 질문 수도 달라져요. 후보를 모두 판정해야 수리 조치로 넘어가요.</p>
        <b>시험 수준과 결론</b>
        <p>모든 단계에서 실패가 발생할 수 있고, 그 단계에서도 원인을 일부 찾아낼 수 있어요. 다만 무엇을 관찰할 수 있는지와 시험 범위에 따라 결론의 구체성이 달라져요.</p>
        <p>제어 로직 시험은 내부 판단 오류를 확인하는 데 유용하지만 실제 부품 고장을 직접 보여주지는 못할 수 있어요. 시스템 시험은 차량 동작 이상을 보여주지만 내부 측정이 부족하면 원인을 특정하기 어려워요.</p>
        <p>같은 시험 수준이라도 어떤 신호를 측정하는지가 중요해요.</p>
        <ul><li><em>시험 결과</em> 통과(PASS) · 실패(FAIL) · 판정 불가(INCONCLUSIVE) — 요구사항 대비</li><li><em>가설 판단</em> 가설 지지 · 가설 반박 · 판단 보류 — 시험 결과와 별개</li></ul>
        <button onClick={() => setHelp(false)}>닫기</button>
      </aside>}

      {phase === "pick" ? <section className="vbStage qaPick">
        <p className="qaPickQuestion"><small>{DRIVER_NAME}의 질문 {numify(`${qi + 1}/${questions.length}`)}</small>“{q.ask}”</p>
        <div className="qaCriteria big"><small><Icon name="target" /> 판단 기준</small><p>{numify(PREDICT[q.hyp])}</p></div>
        <h2>어떤 시험으로 확인할까요?</h2>
        <div className="vbChoices qaTests">{QA_LEVELS.map(lv => <button key={lv} onClick={() => pickTest(lv)}><i><Icon name={TEST_CARD[lv].pic} /></i><b>{TEST_CARD[lv].name}</b><small className="vbGroup">{`0${QA_LEVELS.indexOf(lv) + 1}`}</small><em>{LEVEL_SUB[lv]}</em></button>)}</div>
      </section>
        : phase === "report" ? <section className="vbStage v7Fix">
          <article className="v7Report">
            <header><small>검증 결과 보고</small><b>가설 판정 결과 · 지지 {questions.filter(item => answers[item.hyp]?.answer === "supported").length} · 반박 {questions.filter(item => answers[item.hyp]?.answer === "refuted").length}</b></header>
            <ul>{questions.map(item => { const a = answers[item.hyp]; const label = meta.hypotheses.find(h => h.id === item.hyp)?.label ?? item.ask; return <li key={item.hyp} className={a?.answer === "supported" ? "hyp-supported" : "hyp-refuted"}><em>{a ? ANSWER_KO[a.answer] : "-"}</em><span><mark className="v7HypName">{label}</mark><span className="v7HypWhy">설명: {a?.why}</span><small>근거: {a?.evidence}</small></span></li>; })}
              {meta.hypotheses.filter(h => h.stage1 && !questions.some(item => item.hyp === h.id)).map(h => <li key={h.id} className="hyp-refuted"><em>가능성 낮음</em><span><mark className="v7HypName">{h.label}</mark><span className="v7HypWhy">설명: {h.stage1}</span><small>근거: 도미노 역추적 측정</small></span></li>)}</ul>
            <div className="v7Runs"><small>시험 기록 · 실제로 실행한 시험만 표시</small>{runLog.length ? <ol>{runLog.map((r, k) => { const hypId = r.hyp ?? questions[r.q]?.hyp; const hypIndex = questions.findIndex(item => item.hyp === hypId); const judged = hypId ? answers[hypId] : undefined; const judgement = r.fixed ? "" : judged && judged.evidence.startsWith(TEST_CARD[r.level].name) ? ANSWER_KO[judged.answer] : hypId && held[hypId]?.includes(r.level) ? "판단 보류" : "판정에 쓰지 않음"; return <li key={k}><i>{k + 1}</i><span>{TEST_CARD[r.level].name} · {r.fixed ? "수리 후 재시험" : `가설 ${hypIndex + 1}`}{judgement && <small> · 판정: {judgement}</small>}</span><em className={`rv-${r.verdict.toLowerCase()}`}>{VERDICT_KO[r.verdict]}</em></li>; })}</ol> : <p>이 세션에 저장된 시험 기록이 없어요.</p>}</div>
          </article>
          <h2><Icon name="target" /> 최종 고장 원인을 고르세요</h2>
          <div className="vbChoices causeCards">{CAUSES[caseId].map(item => <button key={item.hyp} className={`causeCard ${cause === item.hyp ? causeOk ? "right" : "wrong" : ""}`} onClick={() => pickCause(item.hyp)}><span className="causePhoto"><img src={item.img} alt="" /></span><em className="causeType">{item.type}</em><b>{item.name}</b><small className="causeWhere">발생 위치 · {item.where}</small><span>{item.desc}</span></button>)}</div>
        </section>
        : phase === "repair" ? <section className="vbStage v7Fix">
          {(() => { const c = CAUSES[caseId].find(item => item.hyp === cause); const a = cause ? answers[cause] : undefined; return <article className="finalJudge">
            <header><small>최종 판단 보고</small><b>{c?.name}</b><em>{c?.type}</em></header>
            <p><span>요약</span>{c?.desc} · 발생 위치 {c?.where}</p>
            <p><span>관측 근거</span>{a ? `${a.why} (${a.evidence})` : "시험 판정 기록 없음"} · A/B 비교에서 원인을 제거한 모델이 정상 모델과 일치</p>
            <p><span>한계</span>{contract.limitation}</p>
          </article>; })()}
          <h2><Icon name="wrench" /> 이 원인을 제거할 수리 방법을 고르세요</h2>
          <div className="vbChoices">{FIXES[caseId].map((item, index) => <button key={item.label} className={fix === index ? item.ok ? "right" : "wrong" : ""} onClick={() => pickFix(index)}><img src={item.img} alt="" /><b>{item.label}</b></button>)}</div>
        </section>
        : phase === "ab" ? <section className="v7Lab2 qaLab abLab">
            <aside className="qaSetupPanel" aria-label="동일 시험 조건">
              <header><small>01 · 동일 조건</small><b>{activeContract.stimulus.label}</b><span>두 모델에 같은 초기 상태·입력·시간축을 적용</span></header>
              <section className="qaConditionBlock"><h3>초기 상태</h3><table><thead><tr><th>신호</th><th>설정값</th><th>단위</th></tr></thead><tbody>{initialConditionRows.map(item => <tr key={item.label}><td>{item.label}</td><td><code>{item.value}</code></td><td>{item.unit}</td></tr>)}</tbody></table></section>
              <section className="qaConditionBlock"><h3>시험 입력</h3><p className="qaPickedInput"><small>입력 조건</small><b>{numify(tech.input)}</b></p><table><thead><tr><th>항목</th><th>설정값</th><th>단위</th></tr></thead><tbody>{stimulusRows.map(item => <tr key={item.label}><td>{item.label}</td><td><code>{item.value}</code></td><td>{item.unit}</td></tr>)}</tbody></table></section>
              <p className="qaSetupNote"><b>실행 시간</b>{numify(`${abSim.seconds} ${abSim.timeUnit} · 동일 시간축`)}</p>
            </aside>
            <div className="v7View abView">
              {(["normal", "fixed"] as const).map(side => <section key={side} className={`abPane ab-${side}`}><header><b>{side === "normal" ? "정상 시나리오 시뮬레이션" : "이번 시험 · 고장 원인 제거 시뮬레이션"}</b><small>{side === "normal" ? "정상 설계 모델" : CAUSES[caseId].find(item => item.hyp === cause)?.name ?? "선택한 원인 제거"}</small></header>
                <div className={`vbSimView abSim ${running ? "running" : ""}`}>{caseId === "propulsion" ? <BenchVisual tab="vehicle" caseId={caseId} running={running} works={side === "normal" || causeOk} /> : <EmbeddedBench3D caseId={caseId} running={running} works={side === "normal" || causeOk} />}{abDone && side === "fixed" && <span className={`vbStamp ${causeOk ? "pass" : "fail"}`}>{causeOk ? "정상과 일치" : "정상과 다름"}</span>}</div>
              </section>)}
            </div>
            <aside className="qaPanel qaObservePanel abPanel" aria-label="A/B 비교 결과">
              <nav className="abTabs" role="tablist"><button role="tab" aria-selected={abTab === "graph"} className={abTab === "graph" ? "on" : ""} onClick={() => setAbTab("graph")}>모니터링</button><button role="tab" aria-selected={abTab === "result"} className={abTab === "result" ? "on" : ""} disabled={running} onClick={() => setAbTab("result")}>결과</button></nav>
              {abTab === "graph" ? <div className="abGraph"><OverlayGraph list={abSim.levels.vehicle} upto={running ? u : abDone ? 1 : 0} look={new Set()} /><p className="abLegend">점선 = 정상 모델 · 실선 = 원인 제거 모델</p></div>
                : <section className="qaResultBlock abResult">{(() => { const assessment = abDone ? assessContractRun(activeContract, "vehicle", abSim.levels.vehicle) : null; return <>
                  <div className={`qaResultState ${assessment ? (causeOk ? "pass" : "fail") : "pending"}`}><b>{assessment ? causeOk ? "원인 제거 모델 = 정상 모델" : "원인 제거 모델 ≠ 정상 모델" : "동시 실행 전"}</b><span>{assessment ? `요구사항(시험 설계서) 판정: ${VERDICT_KO[assessment.verdict]} (${assessment.verdict})` : "두 모델을 같은 조건으로 실행하면 결과가 표시돼요."}</span></div>
                  <table className="qaTable"><thead><tr><th>신호</th><th>정상 기준</th><th>원인 제거 후</th><th>전 구간 최대 차이</th></tr></thead><tbody>{abSim.levels.vehicle.map(sig => { const i = sig.ref.length - 1, d = sig.run.reduce((m, v, k) => Math.abs(v - sig.ref[k]) > Math.abs(m) ? v - sig.ref[k] : m, 0), same = Math.abs(d) <= sig.max * .02; return <tr key={sig.id}><td>{sig.name}</td><td><code>{fmtV(sig, sig.ref[i])}</code></td><td>{abDone ? <code>{fmtV(sig, sig.run[i])}</code> : "—"}</td><td>{abDone ? <b className={`qaW ${same ? "w-같음" : "w-낮음"}`}>{same ? "일치" : `${d > 0 ? "+" : ""}${d.toFixed(sig.max < 10 ? 1 : 0)} ${sig.unit}`}</b> : "—"}</td></tr>; })}</tbody></table>
                  <p className="qaVerdictNote">차량 수준 전 신호를 전 시간 구간에서 비교해, 원인 제거 외에 달라진 동작이 없는지(회귀) 확인해요. 실제 수리 효과는 수리 뒤 재시험에서 따로 확인해요.</p>
                </>; })()}</section>}
            </aside>
            <section className={`qaActionDock phase-ab ${abDone ? "is-result" : running ? "is-running" : "is-ready"} ${running ? "" : "your-turn"}`} aria-label="질문과 선택지">
              <div className={`qaQuestion ${abDone ? causeOk ? "fb-ok" : "fb-bad" : ""}`}><small>A/B 비교</small><b>{running ? "두 모델을 동시에 실행하고 있어요" : !abDone ? "정상 모델과 원인 제거 모델을 같은 조건으로 실행할까요?" : causeOk ? "원인을 제거하니 정상 모델과 같아졌어요" : "원인을 제거해도 정상 모델과 달라요"}</b><span>{running ? "같은 초기 상태·입력·시간축으로 두 시뮬레이션이 함께 진행돼요." : !abDone ? "차이는 선택한 고장 원인의 제거 여부뿐이에요." : causeOk ? "이 원인을 실제로 없애는 수리 방법을 고르세요." : "고른 원인이 실제 고장 메커니즘이 아니에요. 최종 원인을 다시 고르세요."}</span></div>
              <div className="qaChoices" role="group" aria-label="선택지">{!abDone ? <button className="vbGo qaChoice qaRunButton" disabled={running} onClick={runAb}>▶ 두 모델 동시 실행</button>
                : causeOk ? <button className="qaChoice qaRunButton" onClick={() => { setPhase("repair"); play("pop"); setBubble("확정한 원인을 없애는 수리 방법을 고르세요. 증상만 가리는 조치는 고르지 마세요."); }}>수리 방법 고르기 →</button>
                  : <button className="qaChoice" onClick={() => { setPhase("report"); setCause(null); setAbDone(false); setMistakes(n => n + 1); play("pop"); }}>최종 원인 다시 고르기</button>}</div>
            </section>
          </section>
          : <section className="v7Lab2 qaLab">
            <aside className="qaSetupPanel" aria-label="시험 계약 조건">
              <header><small>01 · 시험 계약</small><b>{contract.stimulus.label}</b><span>{phase === "lab" ? `현재 확인: ${hypothesisGoal}` : "수리 후 동일 조건 재시험"}</span></header>
              <section className="qaConditionBlock">
                <h3>초기 상태</h3>
                <table><thead><tr><th>신호</th><th>설정값</th><th>단위</th></tr></thead><tbody>{initialConditionRows.map(item => <tr key={item.label}><td>{item.label}</td><td><code>{item.value}</code></td><td>{item.unit}</td></tr>)}</tbody></table>
              </section>
              <section className="qaConditionBlock">
                <h3>시험 입력</h3>
                <p className="qaPickedInput"><small>선택한 입력 조건</small><b>{pickedDeriv || CASE_DERIVS[caseId].length === 1 ? numify(tech.input) : "선택 전"}</b></p>
                <table><thead><tr><th>항목</th><th>설정값</th><th>단위</th></tr></thead><tbody>{stimulusRows.map(item => <tr key={item.label}><td>{item.label}</td><td><code>{item.value}</code></td><td>{item.unit}</td></tr>)}</tbody></table>
              </section>
              <p className="qaSetupNote"><b>관찰 신호</b>{observationGoal}</p>
            </aside>
            <div className="v7View">
              <nav className="v7Tabs qaLevelTabs" role="tablist" aria-label="시험 수준과 관찰 화면">{QA_LEVELS.map(lv => { const done = runs[runKey(fixed, lv, q?.hyp)]; const on = viewTab !== "graph" && level === lv; return <button key={lv} role="tab" aria-selected={on} className={on ? "on" : ""} disabled={running || (fixed && lv !== "vehicle")} onClick={() => { selectLevel(lv); play("pop"); }}><b>{TEST_CARD[lv].name}</b><small>{VIEW_SUB[lv]}{done ? <> · <em className={`rv-${done.verdict.toLowerCase()}`}>{VERDICT_KO[done.verdict]}</em></> : ""}</small></button>; })}<button role="tab" aria-selected={viewTab === "graph"} className={`graphTab ${viewTab === "graph" ? "on" : ""}`} onClick={() => { setViewTab("graph"); play("pop"); }}><b>모니터링</b><small>시간축 신호 비교</small></button></nav>
              {/* qaTabQuestion: the long explanatory copy moved to the action dock; keep the simulation surface labelled for QA. */}
              <div className={`vbSimView ${running ? "running" : ""}`} aria-label={`같은 입력: ${contract.stimulus.sequence}`}>{tabVisual}
                {phase === "lab" && materialsReady && needsInputPick && !running && <div className="qaInputGuide" role="group" aria-label="입력 조건 안내">
                  <p className="qaInputWhy"><b>왜 입력 조건을 고르나요?</b>같은 입력을 정상 기준 모델과 시험 대상(고장이 든 현장 SW)에 넣고, 나타나는 신호 차이로 가설을 확인해요.</p>
                  {CASE_DERIVS[caseId].map(d => { const info = INPUT_INFO[caseId][d.id]; const exec = contractForInput(caseId, contract, d.id, d.tech).execution; const observe = activeContract.execution.observationSignalIds[level].map(id => list.find(sig => sig.id === id)?.name ?? id); return <button key={d.id} className="qaInputCard" onClick={() => { setPickedDeriv(d.id); play("pop"); setBubble(`입력을 '${d.input}'(으)로 골랐어요. 정상 모델과 시험 대상에 같은 입력이 들어가요.`); }}>
                    <em className="qaInputTag">{info?.tag ?? "시험 입력"}</em><b>{info?.purpose ?? d.input}</b><small>입력 · {inputSequenceText(exec, contract.execution)}</small><small>관찰 · {observe.join(", ") || "-"}</small>
                  </button>; })}
                </div>}{shown && lastRun && <span className={`vbStamp ${lastRun.verdict === "PASS" ? "pass" : lastRun.verdict === "FAIL" ? "fail" : "unk"}`}>{VERDICT_KO[lastRun.verdict]}</span>}</div>
              {(viewTab === "ecu" || viewTab === "plant") && <span className="v3dToggle">{([["normal", "정상 시나리오"], ["run", "이번 시험"]] as const).map(([id, label]) => <button key={id} className={show3d === id ? "on" : ""} onClick={() => { setShow3d(id); play("pop"); }}>{label}</button>)}</span>}
            </div>
            <aside className="qaPanel qaObservePanel" aria-label="관찰 결과와 가설 판정">
              <section className="qaResultBlock" aria-label="시험 결과">
                <header className="qaObserveHead"><small>03 · 시험 결과</small><b>기대값과 실제값 비교</b></header>
                <div className={`qaResultState ${shown && lastRun ? lastRun.verdict.toLowerCase() : "pending"}`}><b>{shown && lastRun ? `시험 결과: ${VERDICT_KO[lastRun.verdict]} (${lastRun.verdict})` : running ? "시험 실행 중" : "시험 실행 전"}</b><span>{shown && lastRun ? (() => { const a = lastRun.assessment; const nameOf = (id: string) => list.find(sig => sig.id === id)?.name ?? id; const off = [...new Set([...a.outOfRangeSignalIds, ...a.expectedOutputFailures])].map(nameOf); return lastRun.verdict === "PASS" ? "관찰한 출력이 정상 기준의 기대값·허용 범위를 만족했어요." : lastRun.verdict === "FAIL" ? `관찰한 출력이 정상 기준을 벗어났어요 · 벗어난 신호: ${off.join(", ") || "-"}` : a.missingSignalIds.length ? `이 수준에서는 시험 설계서가 요구한 관찰 신호(${a.missingSignalIds.map(nameOf).join(", ")})를 볼 수 없어 요구사항 판정을 못 해요.` : `이 수준에서는 기대 출력(${contract.expected.signal})을 관찰할 수 없어 요구사항 판정을 못 해요.`; })() : phase === "lab" ? `${TEST_CARD[level].name}은(는) 아직 실행하지 않았어요` : "동일 조건 기준선 비교 검증을 준비합니다."}{shown && lastRun && !fixed && <em className="qaVerdictNote">시험 결과일 뿐, 원인 판정은 아래 질문에서 신호 근거로 따로 해요.</em>}</span></div>
                <table className="qaTable">
                  <thead><tr><th>신호</th><th>{sameConditionCompare ? "정상 기준선" : "기대값"}</th><th>{sameConditionCompare ? "수정 후" : "실제값"}</th><th>{sameConditionCompare ? "정상 범위" : "비교"}</th></tr></thead>
                  <tbody>{list.map(sig => { const i = at(sig), w = word(sig), look = phase === "lab" && lookAt.has(sig.id); return <tr key={sig.id} className={`${look ? "look" : ""}`}>
                    <td>{look && <em className="qaLook">볼 곳</em>}{sig.name}</td>
                    <td><code>{fmtV(sig, sig.ref[i])}</code></td>
                    <td>{shown ? <code>{fmtV(sig, sig.run[i])}</code> : running ? "측정 중…" : "—"}</td>
                    <td>{shown ? <b className={`qaW w-${w}`}>{sameConditionCompare ? inNormalRange(sig) ? "충족" : "미충족" : w}</b> : "—"}</td>
                  </tr>; })}</tbody>
                </table>
                {shown && lastRun && (() => {
                  const tcOut = activeContract.execution.expectedOutputs[0];
                  const tcSig = tcOut ? list.find(sig => sig.id === tcOut.signalId) : undefined; // UI-V3-17: only what this level can observe
                  const actual = tcSig ? tcSig.run[tcSig.run.length - 1] : undefined;
                  const tcOk = tcOut && actual !== undefined ? Math.abs(actual - tcOut.value) <= tcOut.tolerance : null;
                  const traceFirst = TRACE_CASES[caseId]?.doms.find(item => item.id === TRACE_CASES[caseId].first)?.label;
                  const fm = firstMismatch(list);
                  return <div className="qaProof" aria-label="정상 기준과 고장 재현 로그 대조">
                    <p><small>정상 기준 TC</small>{tcOut ? <span>{numify(`${tcSig?.name ?? contract.expected.signal} 기준 ${tcOut.value} ${tcOut.unit} ±${tcOut.tolerance}`)} → {actual !== undefined ? numify(`이번 ${actual.toFixed(tcOut.value < 10 ? 1 : 0)} ${tcOut.unit}`) : "이 수준에서는 관찰 불가"} {tcOk === null ? "" : <b className={tcOk ? "ok" : "bad"}>{tcOk ? "범위 안" : "범위 밖"}</b>}</span> : <span>기록 없음</span>}</p>
                    <p><small>고장 재현 로그</small>{step02.linked && traceFirst ? <span>STEP02 최초 편차 {traceFirst} ↔ 이번 첫 불일치 {fm !== null ? list[fm].name : "없음(이 수준에서는 같음)"}</span> : <span>기록 없음 (STEP02 저장 기록 없음)</span>}</p>
                  </div>;
                })()}
              </section>
            </aside>
            <section className={`qaActionDock phase-${phase} ${shown ? "is-result" : running ? "is-running" : "is-ready"} ${running ? "" : "your-turn"}`} aria-label="질문과 선택지">
              {(() => {
                const matBtn = (kind: "tc" | "log", label: string) => <button key={kind} className={`qaChoice ${seen[kind] ? "on" : ""}`} onClick={() => openMaterial(kind)}>{seen[kind] ? "✓ " : ""}{label}</button>;
                let question = "", sub = "", choices: React.ReactNode = null;
                if (!contractReady) { question = "시험 설계서를 불러올 수 없어요"; sub = "STEP03에서 테스트 설계서를 다시 발급하세요."; }
                else if (phase === "lab" && running) { question = "시험을 실행하고 있어요"; sub = "정상 기준과 같은 입력이 고장 모델에도 들어갑니다."; }
                else if (phase === "lab" && shown) {
                  question = "시험 결과가 선택한 고장 원인 가설을 뒷받침합니까?"; sub = feedback ? feedback.text : `가설 ${qi + 1} · ${hypothesisGoal} — ${TEST_CARD[level].name} 결과로 판단하세요. 시험의 통과·실패와 가설 판단은 별개입니다.`;
                  choices = (["supported", "refuted", "open"] as Answer[]).map(a => <button key={a} className={`qaChoice ans-${a}`} onClick={() => answer(a)}><b>{ANSWER_BTN[a][0]}</b><small>{ANSWER_BTN[a][1]}</small></button>);
                } else if (phase === "lab" && !materialsReady) {
                  question = "시험 자료를 확인하세요"; sub = "정상 기준(STEP03)과 고장 당시 기록(STEP02)을 불러온 뒤 시험합니다.";
                  choices = <>{step02.linked && matBtn("log", "STEP02 고장 재현 로그 열기")}{matBtn("tc", "STEP03 시험 설계서 열기")}</>;
                } else if (phase === "lab" && needsInputPick) {
                  question = "확인 목적에 맞는 시험 입력을 고르세요"; sub = "가운데 카드에서 시험 유형·입력 방식·관찰 신호를 비교하고 고르세요. 같은 입력이 정상 모델과 시험 대상에 들어가요.";
                  choices = CASE_DERIVS[caseId].map(d => <button key={d.id} className="qaChoice" onClick={() => { setPickedDeriv(d.id); play("pop"); setBubble(`입력을 '${d.input}'(으)로 골랐어요. 정상 모델과 시험 대상에 같은 입력이 들어가요.`); }}><span>{INPUT_INFO[caseId][d.id]?.tag ?? numify(d.input)}</span></button>);
                } else if (phase === "lab") {
                  question = `${TEST_CARD[level].name}을 실행할까요?`; sub = numify(`입력 조건 · ${tech.input}`) as unknown as string;
                  choices = <><button className="vbGo qaChoice qaRunButton" disabled={!contractReady} onClick={run}>▶ 시험 실행</button>{CASE_DERIVS[caseId].length > 1 && <button className="qaChoice" onClick={() => { setPickedDeriv(null); play("pop"); }}>입력 조건 바꾸기</button>}</>;
                } else if (phase === "retest") {
                  question = "수리한 SW로 같은 조건을 다시 시험할까요?"; sub = shown ? "아직 정상 범위를 벗어난 신호가 있어요. 오른쪽 표를 확인하고 다시 실행하세요." : "초기 조건과 입력은 처음 시험과 같습니다.";
                  choices = <button className="vbGo qaChoice qaRunButton" disabled={running} onClick={run}>▶ 동일 조건 기준선 비교 실행</button>;
                } else { question = "정상 범위를 확인했어요"; sub = "정상 범위 충족 여부 표시됨 · 아래 안내에서 수리 적용 후 주행으로 복귀하세요."; }
                return <><div className={`qaQuestion ${feedback ? feedback.ok ? "fb-ok" : "fb-bad" : ""}`}><small>{phase === "lab" && shown ? "원인 판정" : phase === "lab" && !materialsReady ? "시험 자료 확인" : phase === "lab" && needsInputPick ? "입력 조건" : phase === "retest" ? "재시험" : "시험"}</small><b>{question}</b><span>{sub}</span></div><div className="qaChoices" role="group" aria-label="선택지">{choices}</div></>;
              })()}
            </section>
          </section>}
    </main>
    <footer className="qaCatDock" aria-live="polite" aria-label="안내">
      <img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" />
      <p><b>{ENGINEER}</b><span className="qaCatAct">{numify(guidance)}</span>{!bubble.startsWith(`${DRIVER_NAME}의 질문에 시험 결과로`) && <small className="qaCatNote">{numify(bubble)}</small>}</p>
      {phase === "done" && <button className="qaFinishBtn stageProgressAction" onClick={finish}>수리 적용 · 주행 복귀 →</button>}
    </footer>
    <button className="secretSolve" title="개발용 정답 적용" onClick={reveal}>정답 보기</button>
    {replayOpen && <ReplayConfirm onCancel={() => setReplayOpen(false)} onConfirm={() => { setReplayOpen(false); resetStage(); }} />}
  </div>;
}
