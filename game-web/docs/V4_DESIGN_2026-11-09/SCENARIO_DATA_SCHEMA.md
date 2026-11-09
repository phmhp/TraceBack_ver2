# 시나리오 데이터 스키마

## 목적

증상·증거·원인·모델·실험·검증·피드백을 화면 컴포넌트에서 분리해 새 사건을 데이터로 추가한다. 현재 `src/game/scenarios.ts`, `src/features/wiring/RefPuzzle.tsx`, `src/features/verification/simModel.ts`, `src/sim/*` 등에 흩어진 정의를 점진적으로 이 계약에 모은다.

## 최상위 구조

```ts
type ScenarioDefinition = {
  schemaVersion: 1;
  id: string;
  title: string;
  domain: 'propulsion' | 'thermal' | 'braking' | string;
  educationalNotice: string;
  briefing: Briefing;
  normalReference: NormalReference;
  evidence: EvidenceItem[];
  hypotheses: Hypothesis[];
  faultModels: FaultModel[];
  experimentTemplates: ExperimentTemplate[];
  verificationOptions: VerificationOption[];
  repairs: RepairAction[];
  feedback: FeedbackRule[];
  assets: AssetReference[];
};
```

## 필수 필드

```ts
type EvidenceItem = {
  id: string;
  label: string;
  imageAssetId: string;
  observationIds: string[];
  source: 'driver' | 'vehicle' | 'trace' | 'measurement';
};

type Hypothesis = {
  id: string;
  plainLabel: string;
  category: 'calculation' | 'boundary' | 'state' | 'interface' | 'system';
  supportingEvidenceIds: string[];
  competingHypothesisIds: string[];
};

type FaultModel = {
  id: string;
  causeHypothesisId: string;
  injectionPoint: string;
  mutation: { kind: string; parameters: Record<string, unknown> };
  observableEffects: string[];
  modelLimitations: string[];
};

type VerificationOption = {
  id: string;
  applicableHypothesisIds: string[];
  scopes: Array<'swe4' | 'swe5' | 'swe6' | 'sys4' | 'sys5'>;
  behaviors: string[];
  availableControls: string[];
  observableSignals: string[];
  discriminates: string[];
  cannotDistinguish: string[];
};
```

## 데이터 규칙

- 외부 URL 자산을 금지하고 프로젝트 내부 자산 ID만 사용한다.
- 화면용 쉬운 한글과 기술 보조 설명을 분리한다.
- 고장 주입점은 실행 모델의 실제 식별자와 검증한다.
- 정상 기대값은 요구사항 ID와 연결하며 STEP 04가 임의 생성하지 않는다.
- 관찰할 수 없는 내부값을 증거로 선언하지 않는다.
- 교육용 가정값은 `educationalAssumption: true`와 설명을 가진다.
- 시나리오 자체가 UI 좌표나 React 컴포넌트명을 가지지 않는다.
- 하드웨어 부품은 시스템 구성요소로 표현할 수 있으나 별도 HW 검증 트랙을 만들지 않는다.

## 검증기

빌드 전 정적 검증에서 다음을 확인한다.

1. 모든 참조 ID 존재.
2. 원인 가설과 고장 주입점 연결.
3. 정상/고장 비교의 잠금 조건 존재.
4. 최소 한 개의 실행 가능한 실험 템플릿.
5. 각 시험의 판별 가능/불가능 범위 명시.
6. 자산 파일이 프로젝트 내부에 존재.
7. 교육 고지와 모델 한계가 비어 있지 않음.
