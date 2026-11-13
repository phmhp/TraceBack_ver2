# SCENARIO_SCHEMA_PROPOSAL — 공통 시나리오 명세 템플릿 제안 및 기존 사건 매핑

- 작성일 2026-11-13 · 기준 `contest/v2` @ `d4e9f996` · 읽기 전용 · **제안 문서(구현 아님)**
- 선행 자료: `content-audit-by-claude/SCENARIO_AUTHORING_TEMPLATE.md`(AS-IS 100 / TO-BE 14 / PROPOSED 9 필드)가 이미 있다. 이 문서는 그것을 **재작성하지 않고**, 14축 분류(`FAULT_TAXONOMY.md`)와 검증 개념(`STEP02_04_VERIFICATION_AUDIT.md`)을 얹은 **차이(delta) 필드**를 제안한다.
- 표기: `[코드]` 현재 코드에 존재하는 필드 / `[신규]` 이 제안에서 추가 / `[변경]` 기존 필드를 구조화 / `[문서]` 기존 템플릿 필드 ID 참조

## 1. 스키마 (YAML 형태, 키는 제안 이름)

```yaml
# 1. 식별
id: thermal                        # [코드] CaseId
status: implemented|optional|draft # [코드] SCENARIO_META.status
title / chapter / symptom          # [코드] SCENARIOS.*
version: 1                         # [신규] 시나리오 데이터 버전 (저장 호환 판단)

# 2. 분류 (FAULT_TAXONOMY 14축) — 전부 [신규] (현재 문자열 설명)
taxonomy:
  domain:        { primary: thermal, secondary: [drive] }   # A1  (현재 SCENARIO_META.domain 단일 문자열)
  scope:         { feature: "thermal.f1", ecu: ThermalECU, swc: FanControlSWC, unit: PwmOutputAdapter }  # A2
  faultLocation: [io_adapter]                               # A3
  faultNature:   { primary: timing_order, secondary: [] }  # A4
  symptom:       [performance_loss, warning_indicator]     # A5
  firstDeviation:{ signalId: pwmOut, type: continuous, relation: request_vs_output }  # A6
  hypothesisTypes: [sw_logic, sw_interface, sw_feedback, input_sensor]               # A7
  prepPuzzle:    [logic_assembly, signal_mapping]          # A8
  verification:  { level: [embedded, vehicle], env: [PIL, HIL], technique: [requirements, equivalence, field_replay] }  # A9~A11
  observation:   [continuous_graph, event_lane]            # A12
  oracle:        [requirement_formula, golden_model, request_output_match]  # A13
  repair:        { type: schedule_restore }                # A14

# 3. 정상 요구사항 (EARS, 분해)
requirements:                        # [변경] 현재 req(1줄)+REF.req[] 두 곳 → 하나의 목록으로
  - id: REQ-THM-001
    pattern: when                    # ubiquitous|when|while|if_then|where|complex  [EARS]
    text: "냉각수 온도가 상승해 65 °C 이상이 되면 Thermal ECU는 팬 요청을 ON으로 설정해야 한다."
    subject: ThermalECU
    trigger: { signal: coolantFiltered, op: ">=", value: 65, unit: degC }
    response: { signal: fanRequest, value: ON }
    timing: { within_ms: null }       # 근거 확보 전 null 허용
    basisKind: game_model_constant    # standard|industry|game_model_constant|educational
    verifies: [TC-THM-01, TC-THM-02]  # 요구↔시험 추적
  # REQ-THM-002 (While: PI 폐루프) / 003 (When: OFF 60) / 004 (인터페이스: 요청=출력)

# 4. 레이싱 트리거 (연출) vs 기술 조건 분리
raceTrigger:                         # [변경] 현재 experiences.tsx 상수/조건문
  staging: { zone: [760, 960], afterCase: propulsion, orderIndex: 2 }   # 연출용
  gameEvent: { type: FAULT_CUE, conditions: ["heat>=84 | distance>=960"] }
  technical:                          # 기술 조건 (시험대 전제조건과 같은 id를 사용해야 함)
    preconditions: [ {signal: ready, value: 1}, {signal: coolantTemperature, ramp: [65.1, 78.4], unit: degC, sec: 8} ]
faultActivation: { when: always_on_in_bench, injectionPoint: pwmOutputWrite, magnitude: skip }

# 5. 최초 편차 · STEP02
firstDeviation: { nodeId: fan_rpm, t: 0, unit: "%", ref: 100, run: 0 }  # [코드] DominoTrace.CaseData.first / Dom
evidence:  [ {id, label, kind, nodeRef} ]   # [코드] SCENARIOS.evidence + Dom.ev
hypotheses:                                  # [코드] SCENARIO_META.hypotheses
  - { id: fan_sw, type: sw_interface, role: root_cause, refutedBy: null, stage1: null, rules: [...] }
  # [신규] role: root_cause|refuted_upstream_normal|refuted_downstream_effect|hold_type

# 6. STEP03 시험 준비
prepPuzzle:
  types: [logic_assembly, signal_mapping]   # [신규]
  logic: { ... }                             # [코드] REF.board/gaps/spares/blocks
  contract: { preconditions, stimulus, expected, observation, comparison }  # [코드] BASE
  oracle: { kind: [formula, golden_model], intermediate: [{ id: reqVsOut, compare: [fanDuty, pwmOut] }] }  # [신규] 중간 오라클

# 7. STEP04 시험
verification:
  testCases: [ {id: TC-THM-01, technique: requirements, input: {...}, level: [embedded, vehicle], env: PIL, oracleRef, expected} ]  # [변경] CASE_DERIVS+INPUT_EXEC+INPUT_INFO 통합
  levels: [ {id: embedded, visibleSignals: [pinV, pwm, rpm], stubs: [pinV, supply]} ]   # [코드] VIEW, model:true→stubs 로 명명
  verdictRequirement: [PASS, FAIL, INCONCLUSIVE]                                         # [코드] assessContractRun
  verdictHypothesis:  { rules: [...], hold: {...}, decideAt: [...] }                     # [코드] judgeRun
repair: { options: [{id, type, ok, why, simulatable: false}], retest: {sameInput: true, scope: [REQ-THM-001..004]} }  # [코드] FIXES + [신규] type/simulatable
```

## 2. 필드 그룹별 현재 코드 상태

| 그룹 | 현재 코드 | 상태 | 비고 |
|---|---|---|---|
| 식별 | `SCENARIOS`, `SCENARIO_META` | 존재 | 키가 두 레지스트리에 나뉨(`root` vs `truth` id 불일치, T-32) |
| 분류 14축 | `SCENARIO_META.domain`, `injection`, `faultModel`, `CAUSES[].type/where`(문자열) | 문자열 부분 | **구조화 필드 없음** |
| 요구사항 | `CASES[].req`, `REF[].req[]`, `SCENARIO_META.normalSpec`, `BASE` | 4곳 분산 | 요구 ID·EARS 패턴·추적 없음 |
| 레이싱 트리거 | `experiences.tsx` 상수·조건문 | 코드에만 | `SCENARIO_META.trigger`는 설명용 |
| 최초 편차 | `CaseData.first`, 노드 `t` | 존재 | 연속량 전제 |
| 증거·가설 | `SCENARIOS.evidence/hypotheses`, `SCENARIO_META.hypotheses` | 존재 | 이중 레지스트리 |
| STEP03 | `REF`, `SPEC`, `BASE` | 존재 | 퍼즐 조립이 계약에 영향 없음 |
| STEP04 | `CASE_DERIVS`, `INPUT_EXEC`, `INPUT_INFO`, `VIEW`, `FIXES`, `CAUSES` | 존재(분산) | 시험케이스 통합 필드 없음 |
| 시뮬레이션 지원 여부 | `SCENARIO_META.status` | 부분 | "모델 있음/없음/부분" 구분 필드 없음 |
| 근거·검수 | `SCENARIO_META.review` 문자열 | 부분 | 수치 근거·검수 상태 구조화 없음 |

## 3. 기존 시나리오 1개 실제 매핑 — thermal

매핑하면서 확인된 **누락·충돌**을 우측에 표시한다.

| 스키마 필드 | thermal 현재 값 [코드 근거] | 누락·충돌 |
|---|---|---|
| id/title | `thermal` / "장시간 고속 주행 후 출력 제한·경고등 점등" `scenarios.ts:33` | — |
| domain | `열관리`(문자열) | secondary(구동 derate) 표현 불가 |
| faultLocation | I/O 어댑터+스케줄링 | 코드엔 `injection` 문자열뿐 |
| faultNature | 타이밍·실행 순서(`CAUSES.fan_sw.type`) | — |
| symptom | 성능 저하+경고·표시 | `SCENARIOS.symptom` 문장 |
| firstDeviation | `fan_rpm`(출력 어댑터) 100→0 %, t=0 | 요청 100은 **ON 플래그**(F-05) |
| requirements | ① "65°C 넘으면 팬 100%" ② "1850 rpm PI PWM 조절" 등 | **충돌**: ①②가 서로 다른 요구, 요구 ID 없음, 출력 어댑터 요구 없음 |
| raceTrigger.staging | `CLIMB_ZONE=[760,960]`, propulsion 수리 후 | 문자열 `trigger`("장거리 고속")와 실제(거리·`heat`) 불일치 |
| raceTrigger.technical | 없음 | 레이싱과 시험대 전제조건 연결 없음 |
| bench preconditions | READY, 팬 OFF, 냉각수 **62 °C**, **차량 정차** | 모델은 62·정차를 **읽지 않음**(T-05) |
| stimulus | 냉각수 65.1→78.4 °C / 8 s | 시간축 "분(압축)" 표기 충돌(T-06) |
| evidence | 4개(주행 현상·상태 계측·제어 명령·물리 응답) | "Fan PWM 명령 100%"가 PWM 듀티처럼 보임(F-05) |
| hypotheses | `fan_sw`(정답)·`fan_path`·`fan_motor` | `fan_path`의 STEP02 반박 `stage1` 없음 → 전부 보류 가능(T-09). `SCENARIOS` 레지스트리와 id 불일치 |
| prepPuzzle | 로직 조립 + 표 A/B(`hystB` 95/90 °C) | **STEP03 현장 값이 PWM 100 %로 표시되어 SW 결함 위치와 충돌**(F-01) |
| oracle | 기대 rpm 1850 ±120(최종 신호) | 결함 위치를 가리는 **중간 오라클 없음**(요청↔출력 일치) |
| levels | unit(모든 신호 model:true)/swint/embedded/vehicle | `model:true`가 수작업 플래그(UX_AUDIT §9.2③) |
| verdictRequirement | `assessContractRun` | 시험 수준별 INCONCLUSIVE 사유 표시 부족 |
| verdictHypothesis | `hold`/`decideAt` 데이터 + 테스트 `feedback-1112` | — (양호) |
| repair | 정답 "PWM 출력 어댑터 주기 작업 복원" / 오답 2 | 오답 수리 **모델 미실행**, 반말 문구 |
| 시뮬레이션 지원 | 폐루프 사슬(팬 정지→온도 상승→출력 제한) **계약 경로에서 끊김** | `s.tc = rampInput` 덮어쓰기(F-03) |
| 근거·검수 | `review: "팬 요청은 정상·PWM 출력부터 FAIL인 SW I/O 경계 확인"` | 수치 근거·표준 근거 칸 없음 |

### 3.1 이 매핑이 드러낸 스키마 설계 결론
1. **요청과 출력은 반드시 서로 다른 신호 id**여야 한다(`fanRequest` ON/OFF, `fanDuty` %, `pwmOut` %). 현재 증거·퍼즐·모델이 "팬 100 %"를 같은 이름으로 쓴다.
2. **레이싱 트리거(staging)와 기술 전제조건(technical)을 같은 신호 id 공간**에서 정의해야 레이싱↔시험대 재현이 연결된다.
3. **오라클은 목록**이어야 한다(최종 출력 + 중간 요청↔출력 일치).
4. 요구사항은 **ID가 있는 하나의 목록**에서 STEP02 줄·STEP03 줄·계약이 파생(현재 4곳 분산).
5. `status`와 별도로 **`simulationSupport`** (`full|partial|display_only`)와 **`openIssues[]`**를 둔다(예: thermal = partial, 열 사슬 미재현).

## 4. 필드의 신규 구현 필요 여부

| 필드/그룹 | 데이터만 | 코드 필요 |
|---|---|---|
| `taxonomy.*` enum 기록 | ✔ (기록용으로만) | 이 값으로 UI·모델을 **분기**하려면 코드 필요 |
| `requirements[]` 통합 | 데이터 이관 | STEP02/03 화면이 목록을 읽도록 수정 |
| `raceTrigger.staging/technical` | — | `RaceExperience` 조건문을 데이터 구동으로 리팩터링 |
| `verification.testCases[]` | — | `CASE_DERIVS`/`INPUT_EXEC`/`INPUT_INFO` 통합 + 화면 |
| 중간 오라클 | 데이터 | `assessContractRun` 확장 |
| `repair.simulatable` | 데이터 | 오답 수리 모델링 시 모델 확장 |
| 검증기(스키마 validator) | — | 신규 |

## 5. 권장 도입 순서 (제안)
1. **문서 우선**: 이 스키마로 기존 3사건을 `docs/`에서 YAML로 먼저 작성(코드 변경 없음)해 불일치를 확정한다(thermal 위 3장을 propulsion·brake로 반복).
2. 불일치 해소가 데이터 수정만으로 가능한 것(수치·문구)부터 코드에 반영.
3. 신호 id 체계와 요구사항 목록이 확정된 뒤 UI 리디자인이 그 구조를 읽도록 구현.
