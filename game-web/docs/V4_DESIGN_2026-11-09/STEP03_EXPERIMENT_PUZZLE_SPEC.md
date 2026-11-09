# STEP 03 실험 퍼즐 사양

## 역할

STEP 03은 “블록을 정답 순서로 놓는 화면”이 아니라 STEP 02의 가설을 STEP 04에서 실행 가능한 실험 계획으로 바꾸는 작업대다. 기존 `RefPuzzle` 프레임과 조작감을 유지하고 사건 유형에 따라 블록 의미만 바꾼다.

## 공통 화면

- 상단: 현재 가설, 확보 증거, 확인하려는 질문.
- 중앙: 목적 → 초기 상태 → 입력 → 기대 결과 → 관찰 지점의 연결 퍼즐.
- 하단: 현재 단계에 필요한 블록만 담은 보관함.
- 우측 또는 완료 카드: 계획 요약과 아직 확인하지 못하는 범위.

## 퍼즐 유형

| 가설 유형 | 블록 구성 | 완료 조건 | 대표 피드백 |
|---|---|---|---|
| SW 계산/조건 | 입력값, 전제 조건, 계산, 기대 출력 | 입력과 기대가 요구사항에 추적 가능 | “출력은 볼 수 있지만 어떤 조건이 계산을 막는지는 아직 못 봐요.” |
| 경계 조건 | 기준값, 전/경계/후 입력, 기대 상태 | 최소 3점과 비교 기준 존재 | “경계 전후를 비교하면 전환 위치를 구분할 수 있어요.” |
| 상태 전이 | 현재 상태, 이벤트, 허용/금지 다음 상태 | 정상 및 금지 전이 중 하나 이상 포함 | “한 경로 통과만으로 모든 전이를 보장하지 않아요.” |
| 인터페이스/통합 | 송신값, 수신값, 순서/시간, 관찰 지점 | 양 끝 또는 중간 관찰로 후보 구분 가능 | “최종 출력만 보면 송신과 수신 문제를 나누기 어려워요.” |
| 시스템 기능 | 운전 조건, 기능 요구, 차량 반응 | 실행 가능한 조건과 관찰 가능한 반응 | “차량 반응은 확인하지만 내부 SW 원인은 추가 시험이 필요해요.” |

## 단계적 공개

1. “무엇을 구분할까?” 목적 블록 1개를 고른다.
2. 초기 상태를 구성한다.
3. 사건에 필요한 입력 행동만 공개한다.
4. 기대 결과를 요구사항 카드와 연결한다.
5. 가설을 구분할 관찰값을 고른다.
6. 정상/사건 비교 설정을 확인한다.

잘못된 블록은 즉시 오답 처리하지 않고 해당 선택으로 확인 가능한 범위와 빠진 범위를 설명한다.

## 출력 계약

```ts
type ExperimentPlan = {
  scenarioId: string;
  hypothesisIds: string[];
  objective: string;
  verificationScope: 'swe4' | 'swe5' | 'swe6' | 'sys4' | 'sys5';
  environment: { target: string; cycleMs?: number; ioMode?: string };
  initialConditions: Record<string, string | number | boolean>;
  actions: Array<{ control: string; value: string | number | boolean }>;
  expected: Array<{ requirementId: string; signal: string; matcher: string }>;
  observations: Array<{ signal: string; unit?: string; sampleMode: string }>;
  comparison: { nominalScenarioId: string; faultScenarioId: string; lockConditions: string[] };
  knownLimitations: string[];
};
```

현재 `sessionStorage` 문자열 전달은 위 타입의 버전 지정 직렬화 계약으로 교체한다. STEP 04는 이 계획을 읽기만 하며 임의 기대값을 추가하지 않는다.

## 기존 구현 재사용

- `src/features/wiring/RefPuzzle.tsx`: 블록 배치, 요구사항/예상 결과, 완료 흐름.
- 기존 카드·소켓·연결선 스타일: 조작감 유지.
- `src/game/scenarios.ts`: 사건 선택의 진입점. 최종적으로 데이터 스키마로 분리.

## 완료 기준

- 각 현재 시나리오가 최소 한 개 이상의 실행 가능한 계획을 생성한다.
- 일부 유효 계획도 저장 가능하며 `knownLimitations`가 비어 있지 않게 한다.
- 새 시나리오는 컴포넌트 분기 추가 없이 데이터로 퍼즐 유형을 선택한다.
