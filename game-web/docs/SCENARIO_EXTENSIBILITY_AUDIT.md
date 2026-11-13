# SCENARIO_EXTENSIBILITY_AUDIT — 고장 시나리오·레이싱 트리거 확장성

- 작성일 2026-11-13 · 기준 `contest/v2` @ `d4e9f996` · 읽기 전용 · 앱 미실행
- 재사용: `content-audit-by-claude/C_SCENARIO_ARCHITECTURE.md`(C1~C10), `SCENARIO_AUTHORING_TEMPLATE.md`(123필드, AS-IS 100/TO-BE 14/PROPOSED 9), `FAULT_SCENARIOS_2026-11-09.md`. 그 문서의 결론 중 **현재 코드와 다시 대조해 일치한 것만** 인용하고 불일치는 표시했다.
- 코드 근거: `src/game/runtime.ts`, `src/game/scenarios.ts`, `src/experiences.tsx`(`RaceExperience` :1703~, `OVERTAKE_ZONE`/`CLIMB_ZONE` :2025), `src/main.tsx`

## 1. 시나리오 목록과 실제 플레이 가능 여부

| CaseId | 등록 | 플레이 진입 경로 | 근거 |
|---|---|---|---|
| propulsion | ✔ `implemented` | **첫 사건**: `CHASE_NORMAL`에서 `FAULT_CUE` 발동 | `experiences.tsx:1900` |
| thermal | ✔ `implemented` | **두 번째 사건**: propulsion 수리 후 `CHASE_RESUME`에서 발동 | `:1902` |
| brake | ✔ `optional` | **일반 플레이로 진입 불가.** 선택 안내 컴포넌트 `Optional`(`main.tsx:1360`)은 **어디에서도 렌더되지 않음**(grep 0건), 장면 `OPTIONAL_FAULT`로 진입하는 `enter()` 호출도 없음, thermal 수리 뒤는 곧바로 `START_FINAL_ESCAPE`(`optionalBrake:"skipped"`) | `runtime.ts:333~340`, `experiences.tsx:1905` |

- 위 brake 판단은 C_SCENARIO_ARCHITECTURE C1과 **일치**(이번에 grep으로 재확인).
- brake는 개발용 `?qa=…&case=brake`(DEV 전용)에서만 STEP02~04가 동작한다 [UX_AUDIT·CAPTURE_INDEX 명시].

## 2. 트리거 분해: 연출용 vs 기술 조건

| 사건 | 게임 이벤트 발동 조건 [코드] | 연출용(레이싱 맵) 조건 | **실제 SW 결함을 유발하는 기술적 조건** | 결함 활성화 시점 |
|---|---|---|---|---|
| propulsion | `mode==="normal"` 이고 `zoneThrottle≥1.8 s`(구간 [150,330] m 안 풀가속 누적) **또는** 거리 ≥330 m | 거리 구간 `OVERTAKE_ZONE=[150,330]`, 증상 연출 속도 ×0.45·상한 55 km/h(운동학) | **없음**(레이스는 simModel과 무관). 기술 조건은 simModel/`BASE`에만: READY·D·60 km/h·페달 60 % | 레이스 중 **고장 상태가 존재하지 않음**, 발동 후 STEP02부터 항상 결함 주입 상태 |
| thermal | `mode==="resume"` 이고 `state.caseId==="propulsion"`(수리 직후) 이고 `heat≥84` **또는** 거리 ≥960 m(`CLIMB_ZONE=[760,960]`) | `heat` 가산식(가속 시 증가)·≥80이면 55 km/h 상한 | simModel: 냉각수 65.1→78.4 °C, 팬 요청 ON → PWM 쓰기 생략 | 동일 |
| brake | **없음** | 없음 | simModel만 | — |

- **레이싱 트리거는 기술 조건이 아니다.** 3사건 모두 "거리 구간 / 가속 누적 / 사건 순서"로 결정되며, 결함 SW 상태(예: 팬 요청 ON인데 PWM 쓰기 없음)와 연결되지 않는다(T-28/T-29 일치 확인).
- thermal은 설명("장거리 고속")과 달리 **가속하지 않아도 거리 960 m에서 발동**한다 [코드 `:1902`].
- 시험대(STEP04)에서 재현 가능한 **기능적 전제조건**은 계약 `execution.initial`(READY·D·차속·냉각수 온도 등)이다. 이 중 **모델이 읽는 것은 일부**다: 구동(`vehicleSpeed`) 읽음, 열관리(`coolantTemperature`는 덮어쓰기됨, `vehicleSpeed` 미사용), 제동(`vehicleSpeed`·`regenAvailable` 읽음, `batterySoc`·`absActive` 미사용). → 레이싱 트리거 조건과 시험대 전제조건을 **같은 스키마에서 파생**시키려면 먼저 이 불일치를 해소해야 한다.

## 3. 선택·순회·저장·재현성

| 점검 | 현재 | 근거 |
|---|---|---|
| 시나리오 선택 | 하드코딩된 **순서**(propulsion → thermal → 최종 탈출). 사용자 선택·무작위 없음 | `FAULT_CUE` 분기, `journeyStageAccess.escapeUnlocked`(propulsion·thermal 필수) |
| 순회 | `completedCases`에 사건 추가, 다음 사건은 `CHASE_RESUME` 조건으로 결정 | `runtime.ts:318~332` |
| 사건 독립성 | thermal이 `state.caseId==="propulsion"`에 의존해 **단독 시작 불가** | `:1902` |
| 저장·복원 | `localStorage["traceback-v16-save"]`에 `Campaign` 전체 저장, `hydrateCampaign`으로 복원 | `main.tsx:126~133, 484` |
| 재시작 | `RETRY_CHECKPOINT`: `propulsion_fault`/`thermal_fault` 체크포인트는 **WIRING(STEP03)** 으로 복귀, `dock_approach`는 `CHASE_RESUME`, 그 외 `CHASE_NORMAL` | `runtime.ts:355~370` |
| 재현성 | 발동 플래그 `fired.current`(ref)는 **저장되지 않음**: 장면 재진입 시 `useEffect([mode])`로 리셋. 발동 위치는 `raceDistance`(저장됨)와 `zoneThrottle`(**저장 안 됨**, 플레이어 조작 의존) → **발동 시점은 플레이마다 다름**(≥330 m 상한까지 가변) | `experiences.tsx:1895~1899`, `runtime.ts:30~53` |
| 여러 조건 충돌·우선순위 | `if / else if` 사슬로 **CAUGHT(`gap≤0`)가 사건 발동보다 우선**. 동시 발동 불가(1회 `fired`). 사건 2개 이상 동시 활성 개념 없음 | `:1897~1905` |
| 시나리오 데이터 ↔ 트리거 | `SCENARIO_META.trigger/normalSpec`은 **설명 문자열**이며 동작 연결 없음(T-29) | `scenarios.ts:97, 129, 163` |

## 4. 확장 범위: 데이터만 vs 코드 필요

C_SCENARIO_ARCHITECTURE C8 결론("데이터만으로 확장 가능: 사실상 없음")이 **현재 코드에서도 유지됨**을 확인했다(`CaseId`가 닫힌 유니온 `runtime.ts:1`, 사건 데이터가 파일별 `Record<CaseId,…>`로 분산).

| 범위 | 항목 | 이유 |
|---|---|---|
| **데이터 추가만으로 가능(가정: 기존 모델 변형 사용)** | 기존 3사건의 문구·수치·가설 문구·증거 문구 수정, 선택지 순서 | 파일별 상수 편집 |
| **데이터 + 소규모 코드** | 같은 모델 구조의 **파라미터 변형 사건**(예: propulsion 계수 0.45→다른 값, brake 0.19→다른 값) | `simModel`의 상수 1곳 + `BASE`·`SCENARIO_META`·STEP02 `CASES` 수치 동시 수정 필요(수치 일치 테스트 없음) |
| **신규 시뮬레이션 필요** | 새 도메인·새 결함 위치·상태 전이/이벤트/진단/통신 결함 | `simModel`에 새 모델 함수 + `VIEW` + `TIME`, 필요 시 `vehicleSim` `FaultSet` |
| **신규 UI 필요** | 연속량이 아닌 최초 편차(상태·이벤트) 표현, 신규 퍼즐 유형, 이벤트 레인 | STEP02_04 문서 §5·§6 |
| **레이싱 신규 구현 필요** | 새 트리거(정차 중 발생, 특정 조작 조건) | `RaceExperience`의 `if/else if` 사슬, 구간 상수, 증상 연출, `FAULT_CUE` 분기 |
| **타입·상태 수정** | 신규 `CaseId` | `initialCampaign` 3곳, `SOLVE_BOARD`/`DEV_SOLVE`/`GUIDED_REPAIR` 표, `APPLY_REPAIR` 분기, `escapeUnlocked` |
| **에셋** | 증거 사진 폴라로이드(증거 id별 PNG), 이미지 프롬프트 데이터, 테스트 `image-prompts.test.mjs` | |

### 4.1 신규 사건 추가 비용 요약
- 사건당 **약 15곳의 서로 다른 파일/상수**를 동시에 편집(B_CATEGORY_SCHEMA 144행, D3 필드 표).
- 2일 내 신규 사건 1건은 **기존 사건과 같은 연속량·같은 퍼즐 유형·같은 그래프**만 쓰는 경우에 한해 현실적이다. 기술 제약: 사건 id 유니온·트리거·모델 3곳을 코드로 수정해야 하므로 "데이터만 추가"는 **불가**.

## 5. 분류 축 관점의 확장 가능성(`FAULT_TAXONOMY.md` 연계)

| 신규 결함 조합 | 데이터만? | 모델 | UI | 레이싱 트리거 |
|---|---|---|---|---|
| (A3=SW 단위, A4=계산, A6=연속량) 변형 | 거의 가능 | 상수 변경 | 재사용 | 구간 상수 |
| (A3=I/O 어댑터, A4=스케일링, A6=연속량) | 가능(brake 유사) | 함수 복제 | 재사용 | 구간 상수 |
| (A4=상태 전이, A6=이산 상태) | 불가 | 상태 모델(히스테리시스는 `on`으로 존재) | **상태 표시 신규** | 조건 신규 |
| (A4=타이밍, A6=이벤트) | 불가 | **주기·순서 개념 신규** | 이벤트 레인 신규 | 조건 신규 |
| (A4=진단 누락, A6=진단 이벤트) | 불가 | `diag` 모델 신규 | 진단 로그 신규 | |
| (A3=통신 메시지) | 불가 | 버스 모델 신규 | 메시지 뷰 신규 | |

## 6. 위험 요소 (확장 시)
| 위험 | 근거 |
|---|---|
| 정답 키 이중 레지스트리(`SCENARIOS.root` vs `SCENARIO_META.truth`)로 신규 사건에서 id 불일치 가능 | `scenarios.ts:18 vs 106~` (T-32) |
| STEP02 수치 상수 ↔ 모델 값 일치를 자동 검증하는 테스트 없음 | `SCENARIO_META.review` 메모뿐 |
| 저장 호환: `brake` 근본원인 id를 `brake_actuator`로 유지(저장 호환 주석) | `scenarios.ts:55` |
| 테스트가 문자열 매칭에 의존(`v4-step01-layout.test.mjs`) → 문구·구조 변경 시 다수 실패 가능 | C8 |
| 레이싱 발동이 조작 의존 → 시나리오 재현 문서화·QA가 어려움 | 3장 |

## 7. 요약 판정
| 항목 | 판정 |
|---|---|
| 현재 확장성 | 낮음: 3 고정 사건, 데이터 주도 아님 |
| 가장 큰 구조 부채 | (1) 사건 데이터 15곳 분산 (2) 레이싱 트리거와 시험대 전제조건 불연결 (3) brake 진입 경로 없음 |
| 신규 시나리오 승인 전 필수 선결 | 신호 id 체계 통일, 트리거·전제조건 스키마 통일(`SCENARIO_SCHEMA_PROPOSAL.md`) |
| 미확인 | 런타임에서 `zoneThrottle` 가변 범위의 실제 발동 시점 분포(실행 안 함) |
