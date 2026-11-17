# 상호작용과 상태 모델

## 공통 입력 버튼

`DriveActionButton`은 고정 슬롯, 순서 배지, 라벨, 상태 아이콘을 가진다.

상태는 `locked | available | active | completed`이며 상태 변경으로 크기·위치·문구 폭이 변하지 않는다.

## 차고 상태

```ts
type GarageInteractionState = {
  power: "off" | "lv" | "ready";
  gear: "P" | "R" | "N" | "D";
  conditions: Set<string>;
  heldInput: string | null;
  reachedStep: number;
  flow: { lv: boolean; control: boolean; hv: boolean; torque: boolean; feedback: boolean };
};
```

## STEP 02→03 계약

```ts
type InvestigationResult = {
  caseId: CaseId;
  hypotheses: { id: string; status: "open" | "refuted" | "supported"; evidenceIds: string[] }[];
  firstDeviation?: { signalId: string; time: number; boundary: string };
  observations: Observation[];
  unresolved: string[];
};
```

## STEP 03→04 계약

```ts
type ExperimentPlan = {
  hypothesisIds: string[];
  objective: string;
  initialState: Record<string, string | number | boolean>;
  stimulus: { id: string; profile: string; value?: number; unit?: string };
  observationIds: string[];
  expected: ExpectedObservation[];
  comparison: { sameInitialState: boolean; sameStimulus: boolean; timeBase: string };
  allowedLevels: VerificationScope[];
};
```

## STEP 04 결과

```ts
type VerificationRun = {
  planId: string;
  scope: VerificationScope;
  result: "pass" | "fail" | "inconclusive";
  hypothesisUpdates: { id: string; status: "more_likely" | "less_likely" | "unresolved" }[];
  firstDeviation?: ObservationRef;
  limitations: string[];
  nextTests: string[];
};
```

시험 실패는 근본 원인 확정과 동일하지 않다.

