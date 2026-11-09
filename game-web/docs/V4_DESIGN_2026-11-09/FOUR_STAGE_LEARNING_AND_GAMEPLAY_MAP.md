# 4단계 학습·플레이 맵

| 단계 | 목적 | 플레이어 행동 | 새 학습 개념 | 단계 산출물 | 다음 단계 전달 | 재사용 자산 |
|---|---|---|---|---|---|---|
| STEP 01 차량 도메인 원리 | 정상 동작을 직접 만들며 위치–연결–판단 이해 | OFF에서 READY, 기어, 입력을 순서대로 조작하고 3관점 탐색 | Vehicle/System, E/E, Control SW의 역할 | 정상 상태·신호·부품 기준 | 정상 기준과 익숙한 그래픽/용어 | 차량 3D, `EeBlueprint`, `SimulinkDiagram`, 도메인 카드 |
| STEP 02 도미노 원인 역추적 | 증거로 최초 편차와 원인 후보 좁히기 | 증거 관찰, 도미노 추적, 메모판에 후보 부착·연결 | 관찰값, 최초 편차, 근본 원인 후보의 차이 | `InvestigationResult` | 가설, 증거, 관찰 지점, 미확인 범위 | 폴라로이드, 도미노, E/E 노드, 메모판 |
| STEP 03 요구사항 기반 로직·실험 퍼즐 | 가설을 구분할 실행 가능한 시험 준비 | 목적·입력·상태·기대·관찰을 블록으로 구성 | 요구사항 기반 시험, 경계/전이/인터페이스/시스템 실험 | `ExperimentPlan` | STEP 04 실행 설정과 기대값 | 기존 `RefPuzzle`, 카드/블록 보관함 |
| STEP 04 시뮬레이션 검증 | 준비한 시험을 실제 실행·비교·판정 | 정상/사건 실행, 그래프 비교, 조치 후 재시험 | 검증 수준, 시험 행동, 판정 한계, 회귀 | `VerificationRun`과 고객 대응 카드 | 사건 해결/추가 시험 루프 | `TwinBenchExperience`, 그래프, 차량 모델, 결과 UI |

## 단계 간 계약

```text
NormalReference
  → InvestigationResult
  → ExperimentPlan
  → VerificationRun[]
  → ResolutionSummary
```

- STEP 02는 관찰하지 않은 값을 생성하지 않는다.
- STEP 03은 STEP 02의 가설을 바꾸지 않고 시험 가능 형태로 구체화한다.
- STEP 04는 STEP 03의 조건·기대값을 임의로 교체하지 않는다.
- 결론이 부족하면 STEP 02 또는 STEP 03으로 돌아가 추가 관찰/시험을 만든다.

## UI 전환 원칙

각 단계의 첫 진입 팝업, 행동 전, 행동 후 상태를 별도로 보존한다. 같은 수준의 차량 도메인 선택은 대표 한 번으로 검수하되, Vehicle/System·E/E Architecture·Control Software처럼 UI 구조가 달라지는 관점은 각각 검수한다. 이 전환 규칙은 교육·QA 설계이며 표준 요구사항이 아니다.
