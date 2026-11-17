# D-4 1차 기술 검수 (코드·데이터 텍스트 기준)

- **방법의 한계**: 소스와 D-1/D-3 원문만 읽었다. **실행하지 않았고 물리적 정확성을 검증한 것이 아니다.** 아래 "손계산"은 코드 상수로 계산한 추정이며 실행 값과 다를 수 있다.
- 판정 구분: **확정 오류** = 같은 코드·데이터 안에서 서로 모순되는 것을 텍스트로 직접 확인 / **의심** = 모순 가능성, 의도 확인 필요 / **실행 검증 필요** = 모델을 돌려야 확정
- 심각도: 높음(교육 정답·판정 근거 훼손) · 중간(설명·수치 불일치) · 낮음(표현·경미)
- 근거 표기: `파일코드-라인`은 D-1 ID의 앞부분(라인 안 문자열 전체). 파일코드는 `D1_INDEX.md`.
- 관련 필드: `SCENARIO_AUTHORING_TEMPLATE.md`의 ID.

## A. 확정 오류 (데이터/코드 내부 모순)

| # | 사건 | 지적 | 관련 콘텐츠 ID · 소스 | 필드 | 심각도 | 판정 |
|---|---|---|---|---|---|---|
| T-01 | thermal | STEP02에서 **팬 커넥터 PWM 신호(fan_pwm)는 status ok·기준 100%**인데, 상류인 **PWM 출력 어댑터(fan_rpm)는 실제 0%**. 어댑터 출력이 0이면 커넥터 PWM도 0이어야 함. STEP04 시뮬레이션 `VIEW.thermal.vehicle.fpwm`은 `src:"pwmOut"`(= 결함 시 0)이고 `SCENARIO_META` 규칙도 `fpwm: lower`를 근거로 씀 → **같은 신호를 STEP02는 정상, STEP04는 이상으로 표시** | DOT-0099, DOT-0093, SIM `VIEW.thermal.vehicle`(simModel.ts:134), SCN `hypotheses[fan_sw].rules`(scenarios.ts:124) | S212, S213, S406, S222 | 높음 | 확정 |
| T-02 | brake | 경고등 표현 3곳 불일치: `LAMP.brake.label`="제동 경고 없음", `OBSERVED.brake` 계기판="브레이크 경고등", 운전자 대사="브레이크 경고등까지 켜졌어!" | EET-0032, EET-0294, EXP-1974 | S109, S111, S112 | 중간 | 확정 |
| T-03 | brake | 계약 전제 **차속 72 km/h** vs `simModel.brake` 초기 속도 **50/3.6 m/s(50 km/h)**. STEP02 정지 거리 기준 32 m(3.2 m/s²)는 약 50 km/h와 맞고 72 km/h(≈62 m)와 맞지 않음 | VCT-0060, simModel.ts:71, DOT-0125 | S318, S406, S212 | 중간 | 확정(상수 불일치) |
| T-04 | brake | 계약 자극 **0→55% / 0.6 s** vs 모델 `p = clamp((t−.05)/.2)·55`(**0.2 s 램프**). 계약 전제 `SOC 82%`·`ABS 비활성`은 모델에 변수 없음(미모델 전제) | VCT-0061, VCT-0060, simModel.ts:72 | S318, S319 | 중간 | 확정(램프) / 의심(미모델 전제) |
| T-05 | thermal | 계약 전제 **냉각수 62°C**·`차량 정차` vs 모델 초기 `tc=64`, 사건은 "고속 주행 후" | VCT-0044, simModel.ts:52, SCN-0036 | S318 | 중간 | 확정(62 vs 64) / 의심(정차 vs 고속) |
| T-06 | thermal | 시간축 불일치: 계약 "0~8 s 동일 시간축", 모델 `TIME.thermal=[8,"분(압축)"]`, STEP02 `timeUnit` "초" | VCT-0052, SIM-0170, DOT-0086 | S208, S322, S405 | 중간 | 확정 |
| T-07 | propulsion | 계약 자극 **0→60% / 0.3 s**, 모델 `req`는 t=0.1 s에 **즉시 60%(계단)**, `replay`는 150%/s 램프(약 0.4 s) | VCT-0029, simModel.ts:34 | S319, S403 | 낮음 | 확정 |
| T-08 | thermal | STEP02 **STEP03 요구사항 문장**이 "65°C 넘으면 팬을 100%로"(DOT-0087)이나 STEP03 사양은 "목표 1850 rpm으로 PWM 조절"(REF-0419), 모델의 정상 PI는 정상 상태에서 **듀티 약 68%**(`target = pwmOut/68·1850`)로 설계됨. 정상 기준을 "PWM 100%"(DOT-0093, EET-0300, END-0071)로 쓰는 곳과 모델이 불일치 | DOT-0087, REF-0419, EET-0300, DOT-0093, END-0071, simModel.ts:59-61 | S209, S212, S312, S503 | 높음 | 확정(문구 간 불일치) · 모델 값은 손계산 → 실행 검증 필요 |
| T-09 | thermal | STEP02 의심 구간 선택지는 "팬 켜기 상태 전이 SW — 켜기 판단은 정상"으로 단정(DOT 선택지 why)하지만 `SCENARIO_META`에서 `fan_path`는 `stage1`이 없어 STEP02 가설 분류의 정답이 **"보류"**(반박 아님) | DOT-0108~0111(section), SCN-0126, EET `sortHyp` | S218, S221 | 중간 | 확정(내부 불일치) |
| T-10 | thermal | 레이스 회귀 카드 "냉각수 … (고장 당시 **84°C** 이상)" vs 증거·STEP02·계약의 고장 시 냉각수 **78°C(78.4)** | EXP-1882, SCN-0040, DOT-0092, VCT-0045 | S115, S203 | 중간 | 확정(수치 불일치; 레이스 `heat`가 냉각수와 같은 양인지는 [미확인]) |
| T-11 | brake | STEP02 노드 `caliper`는 "I/O 어댑터 **압력 명령**"(zone 제어기)인데 연결 증거 `brake_actual`은 "**캘리퍼 압력**이 낮게 측정"(물리 응답). 모델은 `cmdOut`(명령)과 `line/cal`(캘리퍼)을 별도 신호로 가짐. 또한 SCENARIOS 증거 3개 중 `brake_request`는 어떤 STEP02 노드 `ev`에도 연결되지 않음 | DOT-0127, SCN-0060, SCN-0058, simModel.ts:157-164 | S205, S216 | 중간 | 확정 |
| T-12 | thermal·brake·propulsion | 엔딩 계측 막대: brake `normal:55, actual:8, max:60, unit:"%"`("마찰 제동 응답") — 55는 페달 입력 %와 같은 수치, 실제 결함 비율은 8/42(19%)이며 8/55(14.5%)와 다름. 의미 불명 | END-0081 | S503 | 중간 | 확정(수치 의미 불일치) |

## B. 의심 — 모델/수치 정합 (실행 검증 필요 포함)

| # | 지적 | 관련 ID · 소스 | 필드 | 심각도 | 판정 |
|---|---|---|---|---|---|
| T-13 | **제동 압력→감속 계수가 모델마다 3배 차이**: `simModel` `dec = regen + cal/20`(42 bar → 2.1 m/s²) vs `vehicleSim` `brakeTorquePerBarNm 95`·R 0.33·질량 1850(42 bar ≈ 6.5 m/s²). vehicleSim은 런타임 미사용(테스트 전용)이라 게임 화면 영향은 없으나 테스트가 보증하는 수치와 STEP04 수치가 다름 | simModel.ts:80, vehicleSim.ts:27/137-153 | S404 | 중간 | 확정(상수) · 영향은 의심 |
| T-14 | **팬 켜짐 기준 신호 불일치**: simModel=냉각수 `tf`로 65/60 °C, vehicleSim=모터 온도 `motorTempC`로 65/60 | simModel.ts:56, vehicleSim.ts:99 | S404 | 중간 | 확정(상수) |
| T-15 | **출력 제한(derate) 기준 3종**: simModel `tm>90→60%`, vehicleSim 75~90 °C → 최대 50%, 레이스 `heat≥80 → 55 km/h` | simModel.ts:64, vehicleSim.ts:103, EXP(experiences.tsx:1727) | S105, S404 | 중간 | 확정(상수) |
| T-16 | **STEP02 고정 수치 vs 모델**(손계산): propulsion 차량 가속 `run:1.2`(모델 ≈1.09), thermal `run:1.9`(모델 `acc=2.8·der/100`, der≈60 → ≈1.68), brake 차량 감속 `run:1.4`(모델 ≈1.5), brake 정지 거리 `run:58 m`(50 km/h·1.4 m/s²이면 ≈69 m) | DOT-0055, DOT-0089, DOT-0126, DOT-0125, simModel.ts:44/64/80 | S212 | 낮음~중간 | 의심 · 실행 검증 필요 |
| T-17 | thermal 증거 "Fan PWM 명령 100%"는 모델에서 **적분 포화 후**(손계산: 팬 요청 ON 후 약 5 s)의 값. 초기 듀티는 약 64%. STEP02 노드는 시점 없이 100% 고정 | SCN-0042, simModel.ts:58-59 | S201, S212 | 중간 | 의심 · 실행 검증 필요 |
| T-18 | thermal 고장 시 냉각수: 계약 "65.1→78.4°C / 8 s", 모델은 열 부하(`heat` 57)에서 `tc`가 계산됨(손계산: 8 s 시점 약 80°C대 — **지정값이 아니라 결과**) | VCT-0045, simModel.ts:51-54 | S319, S212 | 중간 | 실행 검증 필요 |
| T-19 | propulsion **결함 위치 표현이 단계마다 다름**: STEP02 "VCU **페달 처리값** 27%"(필터 뒤·맵 앞), 모델 `proc = filt × .45`, STEP03 함정 조각 `mapB`("**표 B**: 60% → 92 Nm", 맵 값 자체를 바꿈). 최종 92 Nm은 같지만 중간값(27% vs 60%)이 다름 | DOT-0058, simModel.ts:38, REF `blocks.mapB`(RefPuzzle.tsx:64) | S212, S306 | 중간 | 의심 |
| T-20 | brake "회생 22%": 모델은 `regen=min(req,1.1)` m/s²(요구 3.2의 약 34%). 22%의 분모(5 m/s²?)가 코드 어디에도 없음 | DOT-0133, SCN-0059, simModel.ts:73-75 | S212, S203 | 낮음 | 의심 |
| T-21 | BMS 허용 출력 160 kW(STEP02 propulsion·thermal) vs vehicleSim `maxPowerKw 150` | DOT-0066, DOT-0095, vehicleSim.ts:25 | S212 | 낮음 | 확정(상수) · 영향 낮음 |

## C. 고정 판정·연출 vs 실제 계산 (구조)

| # | 지적 | 소스 | 필드 | 심각도 | 판정 |
|---|---|---|---|---|---|
| T-22 | **수리 후 "통과"는 결함 항목을 제거한 같은 모델 재실행**(`simulate(case,tech,fixed=true)` → `run=ref`). 수리 카드 선택은 모델 입력이 아니라 `ok` 플래그 검사 후 단계 전환. 잘못된 수리는 시뮬레이션되지 않고 `why` 설명만 표시 | simModel.ts:173-181, VerificationLab.tsx:1374, pickFix(≈1436) | S410, S412 | 높음 | 확정(구조) |
| T-23 | 오답 수리 `why`의 부작용 주장이 모델로 검증되지 않음. 특히 propulsion "토크 지도 값을 **2.2배**로 키워 보상 → 다른 페달 위치에선 토크가 너무 커져서 새 고장" — 모델은 선형(`req=3.4·proc`, `proc=filt·.45`)이라 3.4×2.2×.45≈3.37로 **전 구간 보상**됨(260 Nm 한계 내). brake "5배"(0.19×5=0.95)도 거의 보상 | LAB-0488, LAB-0500, simModel.ts:38-40/77 | S410, S417 | 높음 | 의심(주장과 모델 불일치) |
| T-24 | **STEP03 계약이 STEP04 시험 입력을 구동하지 않음**: 계약은 표시(`contract.*` 라벨·시퀀스)에만 쓰이고 `simulate` 인자는 `CASE_DERIVS`(플레이어 선택)로 결정. 위 T-03~T-07의 계약↔모델 불일치가 화면에서 드러나지 않는 이유 | VerificationLab.tsx:1479-1529/1374 | S318~S327 | 높음 | 확정(구조) |
| T-25 | STEP02 완료 시 캠페인 가설을 **정답 id(`scenario.root`)로 자동 설정** — 플레이어의 선택과 무관 | EeTrace.tsx:154 | S220 | 중간 | 확정(구조) · 의도 확인 |
| T-26 | live STEP04는 선택한 레벨의 **모든 신호를 관측**(`observe(lst, lst.map(sig=>sig.id))`) — SSOT의 관측점 선택·제한(M-6.4 장면 2)과 달리 판정 불가(INCONCLUSIVE)가 드물게 발생 | VerificationLab.tsx:1405 | S414 | 중간 | 확정(구조) |
| T-27 | `BENCH_RESULT {pass:true, causeCorrect:true}` 고정 → 추격 +20 m(항상). 오답·비용은 별점에만 반영 | VerificationLab.tsx:1449, runtime.ts:305-315 | X02 | 중간 | 확정(구조) |
| T-28 | **레이스 증상은 토크 모델과 무관한 운동학 연출**(속도 증가량 ×0.45, 상한 55 km/h, `heat` 가산식)이며 simModel/vehicleSim과 연결 없음. "고장을 실제 계산으로 주입"이라고 서술하면 부정확 | experiences.tsx:1725-1728/1798 | S107 | 중간 | 확정(구조) |
| T-29 | 사건 설정 문자열(`trigger`/`normalSpec`)은 설명용이며 동작에 연결되지 않음. thermal 실제 발동은 "propulsion 수리 후 + 거리 ≥760 m의 가속 `heat`≥84 또는 거리 ≥960 m"로, 설명("장거리 고속")과 가속 없이도 발동되는 조건이 다름 | SCN-0114, experiences.tsx:1722/1842 | S104, S105 | 중간 | 확정(구조) |

## D. SW 고장 인과·정책

| # | 지적 | 소스 | 필드 | 심각도 | 판정 |
|---|---|---|---|---|---|
| T-30 | 3사건 주입 위치는 모두 SW 경계 안이며 이후 신호로 전파됨(최종 출력만 위조하지 않음): propulsion `proc` 계수, thermal `pwmOut` 쓰기 생략, brake `cmdOut` 계수 | simModel.ts:38/60/77 | S407 | — | **적합(코드 근거)** · 실행 검증 필요 |
| T-31 | 가설 `vcu_hw`(입력 회로·신호 변환 **HW**)·`drive`(인버터·모터)가 활성 사건의 가설 목록에 존재 — SW-only 근본 원인 정책상 반박용 오답 후보로만 쓰이는지 사용자 확인 필요. 모델에서 `vcu_hw`는 SW 시험에서 결함이 항상 재현되도록 결함이 SW에 주입돼 있어 "반박"이 구조적으로 보장됨 | SCN-0105, SCN-0108 | S220, X03 | 낮음 | 의심(정책 해석) |
| T-32 | 정답 키 이중화: `SCENARIOS.root`(gateway/fan_actuator/brake_actuator) ↔ `SCENARIO_META hypotheses[].truth`(vcu_sw/fan_sw/hyd_path) — id 불일치. 레거시 `correctCause` 비교는 `scenario.root` 사용 | scenarios.ts:18/55, VerificationLab.tsx:364 | M14, S220 | 중간 | 확정(구조) |

## E. 표현·말투 (CLAUDE.md 규칙 대비)

| # | 지적 | 관련 ID | 심각도 | 판정 |
|---|---|---|---|---|
| T-33 | 운전자·엔지니어 대사에 반말·감탄·붙여쓰기("왜이러지?", "안나와!", "내가 바로 고쳐볼게!"). CLAUDE.md 말투 규칙(해요체/합니다체, 감탄 금지)과 충돌 | EXP-1972~1974(운전자 대사), FaultDialogue.dialogue[1](엔지니어 대사) | 낮음 | 확정(규칙 대비) · 규칙 최신성은 사용자 확인 |
| T-34 | 수리 카드 `why`에 반말 종결("새 고장이 생겨!", "끄면 모터가 손상돼.", "…때문이야") | LAB-0488~0500 | 낮음 | 확정(규칙 대비) |
| T-35 | `LV[].std`에 ISO 26262 절 번호를 화면 노출("26262-6 · 9절" 등) — SSOT J-3 "교육 단순화 표시"/CLAUDE.md "단순화 문구 금지"와 정책 충돌, 절 번호 정확성 미검증 | LAB-0602~0605 | 낮음 | 의심(정책·정확성) |

## 요약 집계
- 항목 35건: 확정(구조 포함) 26 / 의심 8 / 적합 판정 1(T-30). 이 중 모델 실행 검증이 필요한 항목 5(T-08 모델값·T-16·T-17·T-18·T-30)
- 심각도 높음 5 (T-01, T-08, T-22, T-23, T-24) / 중간 다수 / 낮음 소수
- **교육 정답 근거에 직접 영향**: T-01, T-08, T-22, T-23, T-24

## 조사 대상
D-1 추출 결과(`_d1_rows.json`)·D-3 원문 블록, `simModel.ts`, `vehicleSim.ts`, `verificationContract.ts`, `scenarios.ts`, `DominoTrace.tsx`, `EeTrace.tsx`, `VerificationLab.tsx`(live 본체), `experiences.tsx`(레이스 발췌).

## 미확인/미수행
- 모델 실행·수치 대조(손계산 값은 추정), 3D·차고(STEP01) 데이터 정합, 컷신 대사, 레거시(미도달) 콘텐츠 내용 검수, `PREDICT`·`featureFlows` 본문 기술 검수
- 물리적 정확성(차량 동역학·열 모델 계수)은 검증하지 않음
