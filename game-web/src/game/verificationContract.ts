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
  limitation: string;
  createdBy: "STEP03";
};

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
    limitation: "최초 편차와 가설의 관련성을 시험하며, 이 결과 하나만으로 근본 원인을 자동 확정하지 않는다.",
    createdBy: "STEP03",
  },
  thermal: {
    version: 1,
    caseId: "thermal",
    objective: "팬 제어 SW, 출력단·배선·전원, 팬 모터 가설을 같은 열부하에서 구분한다.",
    preconditions: ["READY", "냉각팬 OFF", "냉각수 62°C", "차량 정차"],
    stimulus: { label: "사건 열부하", sequence: "냉각수 65.1→78.4°C / 8 s" },
    expectedSignal: "팬 명령과 실제 회전",
    observations: [
      { id: "input", label: "냉각수 온도" },
      { id: "control", label: "팬 PWM 명령" },
      { id: "output", label: "팬 실제 RPM" },
    ],
    comparison: { baseline: "STEP03 정상 기준 장치", sameInput: true, timeAxis: "0~8 s 동일 시간축", units: "°C, %, rpm" },
    limitation: "명령과 실제 회전의 경계를 구분하며, 관찰하지 않은 배선 내부 고장을 만들어내지 않는다.",
    createdBy: "STEP03",
  },
  brake: {
    version: 1,
    caseId: "brake",
    objective: "제동 배분 SW, 유압 경로, 캘리퍼 가설을 같은 제동 입력에서 구분한다.",
    preconditions: ["차속 72 km/h", "D단", "SOC 82%", "ABS 비활성"],
    stimulus: { label: "정지선 제동", sequence: "제동 0→55% / 0.6 s · 정지까지 유지" },
    expectedSignal: "제동 명령과 캘리퍼 압력",
    observations: [
      { id: "input", label: "제동 요구" },
      { id: "control", label: "회생·마찰 배분" },
      { id: "output", label: "캘리퍼 압력" },
    ],
    comparison: { baseline: "STEP03 정상 기준 장치", sameInput: true, timeAxis: "정지까지 동일 시간축", units: "%, m/s², bar" },
    limitation: "협조 제동의 최초 편차를 찾되 시험 결과와 부품 근본 원인 판정을 분리한다.",
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
