import type { CaseId } from "./runtime";

export type VerificationContract = {
  version: 1;
  caseId: CaseId;
  hypothesisId: string;
  hypothesisLabel: string;
  suspectSection: string;
  objective: string;
  preconditions: string[];
  stimulus: { label: string; sequence: string };
  expected: { signal: string; value: string };
  observations: { id: "input" | "control" | "output"; label: string }[];
  comparison: { baseline: string; sameInput: true; timeAxis: string; units: string };
  execution: VerificationExecution;
  limitation: string;
  createdBy: "STEP03";
};

export type VerificationLevel = "unit" | "swint" | "embedded" | "vehicle";

export type VerificationExecution = {
  initial: { signalId: string; value: number; unit: string }[];
  stimulus: {
    signalId: string;
    startValue: number;
    endValue: number;
    unit: string;
    rampSeconds: number;
    holdSeconds: number;
  };
  durationSeconds: number;
  observationSignalIds: Record<VerificationLevel, string[]>;
  expectedOutputs: { signalId: string; value: number; unit: string; tolerance: number }[];
  comparisonTolerancePercent: number;
};

export type ContractValidation =
  | { ok: true; contract: VerificationContract }
  | { ok: false; errors: string[] };

type ContractBase = Omit<VerificationContract, "hypothesisId" | "hypothesisLabel" | "suspectSection" | "expected"> & {
  expectedSignal: string;
};

const BASE: Record<CaseId, ContractBase> = {
  propulsion: {
    version: 1,
    caseId: "propulsion",
    objective: "가속 출력 저하가 VCU 계산 SW인지 입력 회로인지 같은 조건에서 구분한다.",
    preconditions: ["READY", "D단", "차속 60 km/h", "브레이크 해제"],
    stimulus: { label: "사건 재현 가속", sequence: "APS 0→60% / 0.3 s · 3 s 유지" },
    expectedSignal: "요청 토크와 모터 토크",
    observations: [
      { id: "input", label: "APS 원신호" },
      { id: "control", label: "VCU 토크 맵 출력" },
      { id: "output", label: "모터 실제 토크" },
    ],
    comparison: { baseline: "STEP03 정상 기준 장치", sameInput: true, timeAxis: "0~3.3 s 동일 시간축", units: "%, Nm" },
    execution: {
      initial: [
        { signalId: "ready", value: 1, unit: "bool" },
        { signalId: "gearDrive", value: 1, unit: "bool" },
        { signalId: "vehicleSpeed", value: 60, unit: "km/h" },
        { signalId: "brakePedal", value: 0, unit: "%" },
      ],
      stimulus: { signalId: "aps", startValue: 0, endValue: 60, unit: "%", rampSeconds: 0.3, holdSeconds: 3 },
      durationSeconds: 3.3,
      observationSignalIds: {
        unit: ["aps", "proc", "req"],
        swint: ["aps", "proc", "cansig"],
        embedded: ["pin", "can", "mot"],
        vehicle: ["aps", "can", "mot"],
      },
      expectedOutputs: [{ signalId: "mot", value: 204, unit: "Nm", tolerance: 5 }],
      comparisonTolerancePercent: 2,
    },
    limitation: "최초 편차와 가설의 관련성을 시험하며, 이 결과 하나만으로 근본 원인을 자동 확정하지 않는다.",
    createdBy: "STEP03",
  },
  thermal: {
    version: 1,
    caseId: "thermal",
    objective: "팬 요청 계산 SW와 PWM 출력 어댑터 SW의 실행 순서를 같은 열부하에서 구분한다.",
    preconditions: ["READY", "냉각팬 OFF", "냉각수 62°C", "차량 정차"],
    stimulus: { label: "사건 열부하", sequence: "냉각수 65.1→78.4°C / 8 s" },
    expectedSignal: "팬 명령과 실제 회전",
    observations: [
      { id: "input", label: "냉각수 온도" },
      { id: "control", label: "팬 PWM 명령" },
      { id: "output", label: "팬 실제 RPM" },
    ],
    comparison: { baseline: "STEP03 정상 기준 장치", sameInput: true, timeAxis: "0~8 s 동일 시간축", units: "°C, %, rpm" },
    execution: {
      initial: [
        { signalId: "ready", value: 1, unit: "bool" },
        { signalId: "fanCommand", value: 0, unit: "%" },
        { signalId: "coolantTemperature", value: 62, unit: "°C" },
        { signalId: "vehicleSpeed", value: 0, unit: "km/h" },
      ],
      stimulus: { signalId: "coolantTemperature", startValue: 65.1, endValue: 78.4, unit: "°C", rampSeconds: 8, holdSeconds: 0 },
      durationSeconds: 8,
      observationSignalIds: {
        unit: ["tin", "req", "duty"],
        swint: ["temp", "duty", "rpmModel"],
        embedded: ["pinV", "pwm", "rpm"],
        vehicle: ["tc", "fpwm", "rpm"],
      },
      expectedOutputs: [{ signalId: "rpm", value: 1850, unit: "rpm", tolerance: 120 }],
      comparisonTolerancePercent: 2,
    },
    limitation: "SW 계산값과 I/O 출력값의 경계를 구분하며, 관찰하지 않은 HW 고장을 원인으로 만들지 않는다.",
    createdBy: "STEP03",
  },
  brake: {
    version: 1,
    caseId: "brake",
    objective: "제동 배분 계산 SW와 압력 명령 I/O 어댑터 SW를 같은 제동 입력에서 구분한다.",
    preconditions: ["차속 72 km/h", "D단", "SOC 82%", "ABS 비활성"],
    stimulus: { label: "정지선 제동", sequence: "제동 0→55% / 0.6 s · 정지까지 유지" },
    expectedSignal: "제동 명령과 캘리퍼 압력",
    observations: [
      { id: "input", label: "제동 요구" },
      { id: "control", label: "회생·마찰 배분" },
      { id: "output", label: "캘리퍼 압력" },
    ],
    comparison: { baseline: "STEP03 정상 기준 장치", sameInput: true, timeAxis: "정지까지 동일 시간축", units: "%, m/s², bar" },
    execution: {
      initial: [
        { signalId: "vehicleSpeed", value: 72, unit: "km/h" },
        { signalId: "gearDrive", value: 1, unit: "bool" },
        { signalId: "batterySoc", value: 82, unit: "%" },
        { signalId: "absActive", value: 0, unit: "bool" },
        { signalId: "regenAvailable", value: 1.1, unit: "m/s²" },
      ],
      stimulus: { signalId: "brakePedal", startValue: 0, endValue: 55, unit: "%", rampSeconds: 0.6, holdSeconds: 2.4 },
      durationSeconds: 3,
      observationSignalIds: {
        unit: ["req", "cmd"],
        swint: ["p", "cmd", "valve"],
        embedded: ["cmd", "cmdOut", "line"],
        vehicle: ["p", "cmdOut", "cal", "dec"],
      },
      expectedOutputs: [{ signalId: "dec", value: 3.2, unit: "m/s²", tolerance: 0.15 }],
      comparisonTolerancePercent: 2,
    },
    limitation: "협조 제동의 최초 편차를 찾되 시험 결과와 SW 근본 원인 판정을 분리한다.",
    createdBy: "STEP03",
  },
};

export function buildVerificationContract(caseId: CaseId, input: {
  hypothesisId: string;
  hypothesisLabel: string;
  suspectSection: string;
  expectedValue: string;
}): VerificationContract {
  const base = BASE[caseId];
  return {
    ...base,
    hypothesisId: input.hypothesisId,
    hypothesisLabel: input.hypothesisLabel,
    suspectSection: input.suspectSection,
    expected: { signal: base.expectedSignal, value: input.expectedValue },
  };
}

export function fallbackVerificationContract(caseId: CaseId): VerificationContract {
  return buildVerificationContract(caseId, {
    hypothesisId: "unselected",
    hypothesisLabel: "선택 가설 없음",
    suspectSection: "미지정",
    expectedValue: "STEP03 기대값 미확정",
  });
}

export function contractStorageKey(caseId: CaseId) {
  return `tb-verification-contract-${caseId}`;
}

const LEVELS: VerificationLevel[] = ["unit", "swint", "embedded", "vehicle"];

export function validateVerificationContract(value: unknown, caseId?: CaseId): ContractValidation {
  const errors: string[] = [];
  if (!value || typeof value !== "object") return { ok: false, errors: ["시험 계약 데이터가 없습니다."] };
  const contract = value as Partial<VerificationContract>;
  if (contract.version !== 1) errors.push("지원하지 않는 시험 계약 버전입니다.");
  if (!contract.caseId || (caseId && contract.caseId !== caseId)) errors.push("현재 사건과 시험 계약의 사건 ID가 일치하지 않습니다.");
  if (contract.createdBy !== "STEP03") errors.push("STEP03에서 발급된 시험 계약이 아닙니다.");
  if (!Array.isArray(contract.preconditions) || contract.preconditions.length === 0) errors.push("초기 조건이 없습니다.");
  if (!contract.stimulus?.sequence) errors.push("입력 시퀀스 설명이 없습니다.");
  if (!contract.expected?.signal || !contract.expected?.value) errors.push("기대 출력이 없습니다.");
  if (!Array.isArray(contract.observations) || contract.observations.length === 0) errors.push("관찰 신호가 없습니다.");
  const execution = contract.execution;
  if (!execution) errors.push("기계 판독 가능한 시험 실행 조건이 없습니다. STEP03에서 테스트 설계서를 다시 발급하세요.");
  else {
    if (!Array.isArray(execution.initial) || execution.initial.length === 0 || execution.initial.some(item => !item?.signalId || !Number.isFinite(item.value) || !item.unit)) errors.push("초기 조건의 신호 ID·값·단위가 불완전합니다.");
    const stimulus = execution.stimulus;
    if (!stimulus?.signalId || !stimulus.unit || !Number.isFinite(stimulus.startValue) || !Number.isFinite(stimulus.endValue) || !Number.isFinite(stimulus.rampSeconds) || stimulus.rampSeconds < 0 || !Number.isFinite(stimulus.holdSeconds) || stimulus.holdSeconds < 0) errors.push("입력 시퀀스의 신호 ID·값·시간·단위가 불완전합니다.");
    if (!Number.isFinite(execution.durationSeconds) || execution.durationSeconds <= 0) errors.push("시험 실행 시간이 올바르지 않습니다.");
    if (!execution.observationSignalIds || LEVELS.some(level => !Array.isArray(execution.observationSignalIds[level]) || execution.observationSignalIds[level].length === 0)) errors.push("시험 수준별 관찰 신호 ID가 불완전합니다.");
    if (!Array.isArray(execution.expectedOutputs) || execution.expectedOutputs.length === 0 || execution.expectedOutputs.some(item => !item?.signalId || !Number.isFinite(item.value) || !item.unit || !Number.isFinite(item.tolerance) || item.tolerance < 0)) errors.push("기대 출력의 신호 ID·값·단위·허용 오차가 불완전합니다.");
    if (!Number.isFinite(execution.comparisonTolerancePercent) || execution.comparisonTolerancePercent < 0) errors.push("정상 기준선 비교 허용 오차가 올바르지 않습니다.");
  }
  return errors.length ? { ok: false, errors } : { ok: true, contract: contract as VerificationContract };
}

/** Player-facing names of the contract signals (display only; the contract data itself is unchanged). */
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
export const contractSignalLabel = (signalId: string) => CONTRACT_SIGNAL_LABEL[signalId] ?? signalId;
