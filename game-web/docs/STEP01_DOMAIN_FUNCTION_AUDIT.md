# STEP01_DOMAIN_FUNCTION_AUDIT — 정상 차량 기능·시스템 통합 감사

- 작성일 2026-11-13 · 기준 `contest/v2` @ `d4e9f996` · 읽기 전용 · 앱 미실행(화면 동작은 기존 UX 감사·캡처 인덱스 근거)
- 코드 근거: `src/experiences.tsx` — `domainContent`(:50), `featureFlows`(:128), `featureLayerOverrides`(:176), `getFeatureLayer`(:206), `INPUT_MISSION`(:1131), `INPUT_ACTION`/`NORMAL_RESPONSE`/`READY_RESPONSE`(:1143~), `learningLayers`(:34), `GarageExperience`(:928~)
- 재사용한 조사: `UX_AUDIT_2026-11-12.md` §4(STEP01 학습 단계), `ux-captures/CAPTURE_INDEX.md`(02-step01), `content-audit-by-claude/D1_STEP01_GARAGE.md`(1,106건 문자열 추출). **캡처·추출을 반복하지 않았다.**
- 분량 때문에 28기능 전부의 문구 검수는 하지 않았다. 아래는 **구조·정합 감사**이며 문구 전수 검수는 `D1_STEP01_GARAGE.md`를 기반으로 하는 별도 작업으로 남긴다.

## 1. 도메인·기능 전수 목록 (7 도메인 × 4 기능 = 28)

| 도메인(id) | 그룹 | 기능 0 | 기능 1 | 기능 2 | 기능 3 | 선행 입력(`INPUT_MISSION`) | 사건 연결 |
|---|---|---|---|---|---|---|---|
| 구동(drive) | 파워트레인 | 운전자 토크 요청 | D단 구동 인터록 | 인버터 전류·토크 제어 | 감속기·차동기어 전달 | READY, D단 | **propulsion → f0** |
| 제동(brake) | 섀시 | 제동력 요구 계산 | 회생·마찰 협조 | ABS·EBD 휠 제어 | ESC 차체 안정 제어 | READY | **brake → f1** (옵션 사건) |
| 조향(steer) | 섀시 | 전륜 각도 요청 | EPS 보조 토크 | 랙·타이로드 전달 | 요레이트 안정 협조 | READY | 없음 |
| 전원(power) | 파워트레인 | Pack Safe 판단 | 프리차지·접촉기 | 출력 가용량 계산 | OBC·DC/DC·12V 공급 | 브레이크 밟기 | 없음(brake의 회생 가용량이 간접 관련) |
| 변속·주차(gear) | 파워트레인 | PRND 입력 판독 | 방향 전환 인터록 | P단 잠금 제어 | 기어 상태 표시 | READY, 브레이크 | 없음 |
| 열관리(thermal) | 파워트레인 | 온도 상태 추정 | 펌프·팬 제어 | 냉각 회로 배분 | 열 한계 출력 제한 | READY | **thermal → f1**(+f3 derate 증상) |
| 현가(suspension) | 섀시 | 노면 충격 흡수 | 댐핑력 제어 | 차고·자세 유지 | 접지 상태 감시 | READY | 없음 |

- **사건과 연결되는 기능은 3/28**이다. 나머지 25개 기능은 STEP02~04에서 쓰이지 않는다 [코드: 사건 데이터가 3 CaseId뿐].
- 각 기능은 `featureFlows[d][f] = {summary, layers[4]}` 구조다. 4행 = Vehicle(기계 흐름) / E/E(부품 연결) / Control SW 블록 / Control SW 세부. 게임은 3관점 중 SW 렌즈에서 `garageLayerSource=[0,1,3]`로 행 3을 사용한다.
- `featureLayerOverrides`가 정의된 도메인은 **drive·brake·steer·power뿐**이다. gear·thermal·suspension은 빈 객체라 기본 3~4노드로 표시되어 **노드 수·상세도가 도메인 간 다르다**(열관리 f1: 3노드 vs 구동 f0: 5~10노드) [코드 :176~205].

## 2. 기능별 감사 항목 매핑 (요청 항목 ↔ 코드 존재 여부)

| 요청 항목 | 코드 존재 위치 | 존재 여부 | 비고 |
|---|---|---|---|
| 기능이 필요한 이유·사용 상황 | `domainContent[d].purpose`(도메인 단위 1문장), `featureFlows[].summary`(기능 단위 1문장) | **부분** | "왜 필요한가/언제 쓰나"를 **상황**으로 설명하는 필드는 없음 |
| 운전자 입력·차량 전제조건 | `INPUT_MISSION[d].needs`(READY/D단/브레이크) + `INPUT_ACTION` | 지원 | 전제조건 3종만 모델링 |
| 정상 차량 동작 | `NORMAL_RESPONSE[d]`(도메인당 1문장), `READY_RESPONSE` | **부분** | 기능 단위가 아니라 도메인 단위 |
| 다른 도메인과의 관계 | 없음(`side`는 STEP03 퍼즐 전용) | **없음** | 예: 구동↔전원(가용 토크), 제동↔전원(회생), 열관리→구동(derate)이 STEP01에 없음. **사건의 교차 도메인 인과가 STEP01에서 선행 학습되지 않음** |
| E/E 신호 흐름·인터페이스 | `featureFlows.layers[1]`(부품 이름 열) + `flowSignals()`(`experiences.tsx:785`)가 노드 사이 **신호 태그**를 생성 | **부분(파생값)** | 신호 태그는 별도 데이터가 아니라 **Vehicle 렌즈 문구(`layers[0]`)를 노드 수에 비례해 샘플링**한 것(예: "가속 의도", "요구 토크"). 실제 신호 이름·단위·버스 구분이 아님. `SIGNAL_UNIT` 정규식으로 단위 라벨만 추정(`unitOf`). 노드 수와 의미 문구 수가 다르면 신호가 엉뚱한 구간에 붙을 수 있음 |
| Control SW 입력·출력·상태·파라미터 | `layers[2~3]`(블록 이름) | **부분** | 블록 이름만. 입력·출력·상태·파라미터 **구분 없음** |
| 신호 이름·단위·값 | 없음 | **없음** | 아래 3장 |
| 제한·비활성·상태 변화 시 반응 | 일부 블록 이름("고장 래치", "폴백", "타임아웃") | **이름만** | 반응 동작은 설명·실행되지 않음 |

## 3. 신호·값 일관성 (STEP01 ↔ STEP03 ↔ simModel)

같은 기능이 3곳에서 **서로 다른 이름·다른 분해**로 나온다.

| 계층 | 구동 f0 (페달→토크) 표현 | 근거 |
|---|---|---|
| STEP01 Control SW 블록 | Signal Adapter → Driver Request SWC → Torque Arbiter → Command Port / 오버라이드: A/B 상관성 → 입력 필터 → 페달 맵 → 구동 허용 → 가용 토크 MIN → 램프율 → 토크 출력 | `featureFlows.drive[0]`, `featureLayerOverrides.drive[0][3]` |
| STEP03 퍼즐 블록 | aps → corr(A/B 상관성) → filter → map → permit → min → ramp → out → inv | `RefPuzzle.REF.propulsion.board` |
| STEP04 모델 신호 | `aps`·`filt`·`proc`·`req`·`arb`·`can`·`mot` (**corr·permit 단계 없음**, 결함용 `proc` 단계가 추가) | `simModel.ts:40~55`, `VIEW.propulsion` |

- 결론: STEP01의 7블록 중 `A/B 상관성`·`구동 허용`은 **STEP04 모델에 없다**(STEP03까지만). 학습자가 STEP01에서 배운 SW 구조가 STEP04 신호표와 1:1로 대응하지 않는다.
- STEP01에는 **정량 값·파라미터**가 없다(예: 3.4 Nm/%, 260 Nm 한계, 65/60 °C, 20 bar/(m/s²)). E/E 렌즈의 신호 태그는 위 2장대로 Vehicle 렌즈 문구에서 파생된 의미 라벨이며 단위는 `SIGNAL_UNIT` 정규식 추정이다. 정량 값은 STEP03 요구사항 줄에서 처음 나타난다. → STEP01이 "정상 기준값을 미리 보여주는 단계"가 아님.
- E/E 렌즈 `ROLE_DOES`(입력·제어·네트워크·액추에이터·결과 5역할)는 노드 역할 설명을 자동 생성한다. 입력·제어·출력 구분은 이 5역할이 유일한 구조이며, **상태·파라미터 역할은 없다**.

### 3.1 사건 관련 3기능의 SW 입력·출력·상태·파라미터 (simModel 기준 [코드], STEP01에 표시되지 않는 정보)

| 구분 | propulsion (구동 f0) | thermal (열관리 f1) | brake (제동 f1) |
|---|---|---|---|
| 입력 | 페달 `aps`(%, A/B), 기어 D, READY, 차속, 브레이크 | 냉각수 온도 `tc`(°C), 팬 회전 피드백 `rpm` | 페달 `p`(%), 회생 가용량 `avail`(m/s²) |
| 내부 상태 | 필터 `filt`, 램프 `ramp`, CAN 값 | 히스테리시스 ON/OFF(`on`), PI 적분 `int` | 회생 응답 `regen`(τ 50 ms) |
| 파라미터 | 필터 τ 40 ms, 맵 3.4 Nm/%, 한계 260 Nm, 램프 600 Nm/s | 65/60 °C, 목표 1850 rpm, PI 기본 60%·0.002·0.004·±40 | 요구 3.2 m/s²@55%, 20 bar/(m/s²) |
| 출력 | CAN 토크 명령(Nm) | PWM 듀티(%) → 출력 어댑터 | 압력 명령(bar) → 출력 어댑터 |
| 진단 | 없음 | **`diag:0` 상수** | 없음 |

## 4. 3관점(Vehicle/System · E/E · Control SW) 적절성

| 질문 | 판정 | 근거 |
|---|---|---|
| 표준의 공식 3계층인가 | **아니다**(교육용 렌즈) | `AUTOMOTIVE_CONCEPT_AUDIT.md` §2.1 |
| 교육 구조로서 적절한가 | **적절**: 기능 → 부품·연결 → SW 판단으로 추상도가 내려가는 자연스러운 순서 | [교육] |
| "Control Software" 이름 | 약함: ECU 내부 SW만 보여 "시스템 SW 구조(SWC 배치·스케줄)"는 없음 | 행 2(SW 아키텍처)를 건너뜀 |
| 논리 신호 vs 물리 연결 구분 | **없음** — E/E 행이 "APS→VCU→CAN→인버터"로 논리·물리가 섞임 | `featureFlows.layers[1]` |
| 같은 입력·상태가 관점 전환 후 유지되는가 | **유지되지 않음** [UX_AUDIT §4, 캡처 인덱스 §0 4.3: 기능 변경 시 조건 초기화·관점이 진행 상태 공유 안 함] — 이번에 재실행해 확인하지 않음 | |
| 3D·도식·로직 표현이 하나의 흐름으로 연결되는가 | **부분**: 3D 흐름 애니메이션과 E/E 도면·SW 블록도가 같은 기능을 보여 주지만 값·타이밍이 연결되지 않음(`SHOW_PULL_TABS=false`, `SHOW_EE_TABS=false`로 보조 탭도 숨김) | `experiences.tsx:31~33` |

## 5. 초보자 오해 위험 (STEP01)

| 개념 | 오해 | 근거 |
|---|---|---|
| READY | "시동 켜짐"과 동일시 | `INPUT_MISSION.why`: "READY가 꺼져 있으면 …"로만 설명 |
| 도메인 | 공식 분류로 오인 | 주석에만 "ISO 용어 아님", 화면엔 없음 [UX_AUDIT에서 확인한 바 없음 — 화면 표시 여부 **미확인**] |
| 회생·마찰 협조 | "회생이 제동력 전부" | 기능 한 줄 요약만 |
| ECU/SWC | SWC가 하드웨어 부품으로 보임 | 부품 이름 열과 SW 블록 이름 열이 같은 화면에 섞임 |
| 전원 도메인 입력 | "브레이크 밟기"가 입력 조건 | START 절차 순서(브레이크→시동)는 정확하나 구동 사건과의 관계 없음 |

## 6. 누락된 필수 기능·학습 내용 (사건 요구사항 기준)

| 누락 | 필요 이유 | 근거 |
|---|---|---|
| 요청↔출력 구분(Request vs Output) | thermal STEP02/03/04의 핵심(요청 100% vs PWM 0%) | AUTOMOTIVE_CONCEPT_AUDIT F-05 |
| SW I/O 어댑터(출력 인터페이스) 개념 | thermal·brake 근본 원인이 I/O 어댑터. STEP01 SW 블록은 `Command Port`/`Actuator Ports`라는 이름만 | `featureFlows.brake[1]`: "Actuator Ports" |
| 실행 순서(주기 작업) 개념 | thermal 근본 원인 | STEP01에 스케줄링 블록 없음 |
| 진단 반응(고장 대응) 동작 | F-04 | `featureLayerOverrides` thermal 없음 |
| 교차 도메인 관계(구동↔전원↔열관리) | thermal 증상 사슬 | 2장 |
| 검증 개념 입문(요구사항·시험 입력·기대 결과) | STEP03/04 전제 | STEP01에 없음. STEP03 퍼즐의 `notes`(정비소 노트)가 사건 기능만 링크 |

## 7. STEP01 발전 방향 — 기존 화면·에셋 재사용안 (제안, 구현 아님)

목표 경험: **기능의 필요성 → 차량 동작 관찰 → E/E 신호 추적 → SW 입력·판단·출력 → 시스템 통합 확인**

| 단계 | 기존 화면·요소 재사용 | 변경 범위(데이터) | 신규 구현 |
|---|---|---|---|
| ① 필요성 | 기능 목록 + `domainContent.purpose`, 우측 `주요 기능` 패널 | `featureFlows[].summary`를 "상황+이유" 2문장으로 확장하는 필드 추가 | 없음 |
| ② 차량 동작 관찰 | Vehicle 렌즈 3D 흐름 + `INPUT_MISSION` 입력 꾹 누르기 | 전제조건에 상태(브레이크·차속) 확대 | 없음 |
| ③ E/E 신호 추적 | E/E 렌즈 도면(`EeBlueprint`, `signals` prop·`eeSignalTag`·`PartInspector` 이미 존재) | `flowSignals()` 파생을 **명시 필드**(신호 이름·단위·논리/물리 구분)로 교체 | 기존 태그·팝업 재사용, 표시 필드만 추가(소규모 UI) |
| ④ SW 입력·판단·출력 | SW 렌즈 블록도(`SimulinkDiagram`) | 블록에 `role: input|state|param|output` 태그, 값 예시 | 블록 태그 표시(소규모 UI) |
| ⑤ 시스템 통합 확인 | **기존 전체보기**(`allDomains`) | 도메인 간 연결 쌍 데이터(예: 열관리→구동 derate) | 전체보기에서 입력 하나가 3관점에 같은 흐름으로 이어지는 **하이라이트**(중규모) |

- 새 탭은 추가하지 않는다. 관점 간 연결은 **공유 상태**(선택 기능·입력·조건)를 `GarageExperience` 상위 state로 올려 해결하는 방식이 최소 변경이다 [제안; 현재 `useState` 지역 상태 — 코드 확인].
- 위 ③④의 신호 이름은 **STEP03 블록 id·`simModel` 신호 id와 같은 명명 규칙**을 써야 STEP01→STEP04 연결이 성립한다(필수 기술 제약).
- 2일 내 현실 범위: ①②(문구·필드)와 `completedLessons` 표시(UX_AUDIT §4) 정도. ③④⑤ 데이터 확장은 3사건 기능(f0/f1/f1) 한정으로 가능하나 28기능 전체는 불가.

## 8. 요약 판정

| 항목 | 판정 |
|---|---|
| 도메인·기능 전수 목록 | 완료(위 1장) |
| 기술적 정합 | 구조적으로 타당(교육용 렌즈). **신호·단위·값 부재가 최대 약점** |
| 사건 연결 | 28기능 중 3개만 사건과 연결 |
| 필수 수정 | STEP01 SW 블록 이름과 STEP03/04 신호 id 대응표 마련, 요청↔출력 개념 노출 |
| 후속 심화 | 28기능 문구 전수 검수(`D1_STEP01_GARAGE.md`), 교차 도메인 학습 |
