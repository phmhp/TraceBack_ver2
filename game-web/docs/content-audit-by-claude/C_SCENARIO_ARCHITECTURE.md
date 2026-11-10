# C. 시나리오·시뮬레이션 구조 감사 (C1~C10 전부 수행)

- 조사일 2026-11-10 / 읽기 전용 / **모델 실행·테스트 실행 없음.**
- 표기: `[실행 검증 필요]` 코드만으로 단정 불가 · `[기술 검토 필요]` 근거 코드와 함께 의심 지점 기록
- 핵심 근거 파일: `src/game/scenarios.ts`, `src/game/runtime.ts`, `src/game/verificationContract.ts`, `src/features/verification/simModel.ts`, `src/sim/vehicleSim.ts`, `src/experiences.tsx`(레이스), `src/features/{board,wiring,verification}/*`, `tests/*.mjs`

---

## 0. 한눈에 보는 결론

1. 사건은 **3종**(propulsion·thermal·brake). 일반 플레이 가능은 **2종**, brake는 데이터만 완비되고 게임 안 진입 경로가 없다(C1).
2. 수치 모델이 **서로 독립인 3개**다 — 레이스(`RaceExperience` 내부 운동학), STEP03·04(`simModel.ts`), 그리고 **런타임에서 쓰이지 않고 테스트에서만 쓰이는** `vehicleSim.ts`(C5·C6).
3. 고장 주입은 3모델 모두 **SW 경계 안**(입력 처리 계수·PWM 출력 어댑터·압력 명령 스케일)에 있고 하위 신호로 전파된다(L-3 일치). 단 레이스는 계수만 모사한 연출이다.
4. 수리 후 "PASS"는 `simulate(case, tech, fixed=true)`가 **결함 항목만 제거한 같은 모델**을 돌려 얻는다. 잘못된 수리 선택은 시뮬레이션되지 않고 선택 단계에서 설명 문구로만 차단된다(C6·C7).
5. STEP02 완료 시 캠페인 가설이 **정답(`scenario.root`)으로 자동 설정**된다(C7).
6. 신규 사건 추가는 **데이터만으로 불가** — `CaseId` 닫힌 유니온 + 약 12개 파일의 `Record<CaseId,…>` 수정 + 레이스·모델 코드 필요(C8).
7. 시나리오 재현성(결정론)은 코드 구조상 양호(난수 없음)하나 **simModel을 직접 검증하는 테스트가 없다**(C10).

---

## C1. 등록 사건 / 실제 플레이 가능 / 미구현

| CaseId | 등록 | 레이스 트리거 | STEP02~04 데이터 | 일반 플레이 진입 | 비고 |
|---|---|---|---|---|---|
| propulsion (구동 · 가속 저하) | ✔ `SCENARIOS`·`SCENARIO_META` status `implemented` | ✔ 추월 구간 | ✔ | ✔ 첫 사건 | |
| thermal (열관리 · 출력 제한) | ✔ `implemented` | ✔ propulsion 수리 후 연속 고부하 구간 | ✔ | ✔ 두 번째 사건 | |
| brake (제동 · 감속 부족) | ✔ `optional` | ✘ 없음 | ✔ 모두 존재(`CASES`·`REF`·`BASE`·`QUESTIONS`·`FIXES`·`VIEW`·`CASE_VISUAL`) | ✘ **경로 없음**(B_PLAY_FLOW_INDEX B1-b) | 개발용 `?qa=…&case=brake`로만 진입 `[실행 검증 필요]`. `scenarios.ts:144` "레이스 고장 트리거 미구현" 명시 |

| 구분 | 항목 |
|---|---|
| 미구현 사건(문서 후보만) | `docs/FAULT_SCENARIOS_2026-11-09.md` 4절 A1~A6 등 후보 목록, CLAUDE.md "신호 대기 정차 후 READY 꺼짐·재시동 불가"(전원 도메인), FB-P2-02 정차 중 발생 트리거 |
| `[기술 검토 필요]` 후보 목록의 원인 | 문서 A2(페달 센서 A/B 불일치)·A3(리졸버 신호 이상)·A4(**냉각 팬 모터 고착**)·A5(**펌프 정지**)·A6(온도 센서 값 튐)은 **HW/센서 원인** → L-3.1~3.2 SW-only 정책과 충돌. 또한 A4는 "(현재 사건 2)"로 표기되지만 현재 사건 2의 근본 원인은 PWM 출력 어댑터 SW 실행 순서 → **문서가 현 코드와 불일치(낡음)** |

---

## C2. 사건별 차량 도메인과 SW 근본 원인

| CaseId | 도메인(`SCENARIO_META.domain`) | 근본 원인(SW) | 의심 구간(STEP02 `data.section`) | 정답 id(이중 레지스트리) |
|---|---|---|---|---|
| propulsion | 구동 | VCU 입력 처리 단계에 설계에 없는 보정 계수 ×0.45 → 페달 60% → 처리값 27% → 토크 요청 92 Nm | VCU | `SCENARIOS.root="gateway"` / `SCENARIO_META` 진짜 가설 `vcu_sw` |
| thermal | 열관리 | Thermal ECU 출력 어댑터 SW가 주기 작업에서 누락되어 PWM 레지스터 쓰기 생략 → 팬 요청 100% / PWM 0% / 0 rpm | 팬 출력 SW 경계 | `root="fan_actuator"` / META `fan_sw` |
| brake | 제동 | Brake ECU I/O 어댑터 SW가 압력 계산값에 계수 0.19를 중복 적용 → 42 bar 계산 / 약 8 bar 전송 | 압력 출력 SW 경계 | `root="brake_actuator"` / META `hyd_path` |

`[기술 검토 필요]` **정답 키가 두 곳**: 레거시 `SCENARIOS.root`/`hypotheses`(STEP02에서 `SELECT_HYPOTHESIS`에 사용, 저장 호환 id 유지 주석 `scenarios.ts:55`)와 신규 `SCENARIO_META.hypotheses[].truth`(STEP04 판정). 두 목록의 id가 다름(`gateway`↔`vcu_sw`, `fan_actuator`↔`fan_sw`, `brake_actuator`↔`hyd_path`). STEP04 `correctCause`(Lab:364, experiences.tsx:2688)는 `scenario.root`와 비교하는 레거시 경로에서만 쓰임. 향후 일관성 위험.

---

## C3. 고장 발생 전제조건

코드: `RaceExperience` (`experiences.tsx:1703-1852`).

| 사건 | 필요 조건 | 근거 |
|---|---|---|
| propulsion | ① `mode==="normal"`(CHASE_NORMAL) ② 카운트다운 종료 ③ 기어 **D** + 가속 키 ④ 주행 거리 ≥150 m(`OVERTAKE_ZONE=[150,330]`) 에서 풀가속 누적 `zoneThrottle`>0.25 s부터 증상, **≥1.8 s이면 발동**. 또는 가속 없이도 **거리 ≥330 m**이면 발동 | :1721-1726, 1840 |
| thermal | ① `mode==="resume"` 이고 `state.caseId==="propulsion"`(= 사건 1 수리 완료 직후 상태) ② 거리 ≥760 m(`CLIMB_ZONE`)에서 가속 유지 시 `heat` 상승 ③ `heat`≥80 증상(55 km/h 상한) ④ **`heat`≥84 또는 거리 ≥960 m** 발동 | :1722/1727/1798/1842 |
| READY·속도·시간 조건 | 레이스 안 READY 시동은 별도 `driveMission` "restart"(CLAUDE.md 라운드 11 기재) — 고장 발동 조건에는 **불포함**. 시간 조건 없음, 거리·가속 누적 기반 `[실행 검증 필요]` | |
| brake | 없음 | |

`[기술 검토 필요]` thermal은 "고속 장시간"이 아니라 **구간 거리**로도 발동(가속을 안 해도 960 m 도달 시 발동). `FAULT_SCENARIOS` §1-4에도 "고장 위치가 맵 구간(거리)으로 정해진다"고 기록됨. 또한 thermal 트리거가 `state.caseId==="propulsion"`에 의존 → 사건 순서가 고정이며 thermal을 단독 시작할 수 없음.

---

## C4. 실제 고장 주입 위치와 활성화 조건

| 모델 | propulsion | thermal | brake |
|---|---|---|---|
| **레이스** (`RaceExperience`) | 속도 증가량에 ×0.45 + 속도 상한(`Math.max(prev,55)`) — **운동학 연출**(`:1725`) | `heat≥80`이면 속도 ≤55 km/h(`:1727-1728`); 팬 SW는 없음 | 없음 |
| **simModel**(STEP03·04) | 입력 필터 뒤 `proc = filt × (fault ? .45 : 1)` (`simModel.ts:38`) | 히스테리시스·PI 계산 뒤 `pwmOut = duty × (fault ? 0 : 1)` (`:60`) | `cmd` 계산 뒤 `cmdOut = cmd × (fault ? .19 : 1)` (`:77`) |
| **vehicleSim**(테스트 전용) | `FaultSet.pedalScale`(VCU 입력 `APP_Processed`) | `fanPwmOutputScale` | `brakeCommandScale` (`Pressure_Command_Encoded`) |

- 활성화 조건: simModel은 `simulate(caseId, tech, fixed)`에서 `MODELS[case](tech, !fixed)`로 항상 "현장 = 결함 포함, 수리 = 결함 제거" 2회 계산. **런타임 조건부 활성화 없음**(STEP04에서는 항상 주입된 상태로 시작).
- 주입 위치가 최종 출력 위조가 아니라 **SW 경계 안**이며 이후 신호가 모델 방정식으로 전파됨 → H-5.E, M-6.5 "최종 출력만 위조 금지"와 **부합**(코드 근거).

---

## C5. 입력 → SW 계산 → I/O → 부품 → 차량 반응 경로 (simModel)

| 사건 | 경로(코드 변수) |
|---|---|
| propulsion | `pedal(t)` → 필터 `filt`(τ 0.04 s) → **`proc`(×0.45 주입)** → 페달 맵 `req=3.4·proc` → 허용 한계 `arb=min(req,260)` → 램프 `ramp`(±600 Nm/s) → CAN `can`(τ 0.01) → 모터 `mot`(τ 0.03) → `acc = mot·9/.33/1800 − .3` → 속도 |
| thermal | 열 부하 → `tc` 냉각수 → 필터 `tf` → 히스테리시스 `on`(>65 켜짐·<60 꺼짐) → PI `duty`(팬 회전 피드백 사용) → **`pwmOut`(×0 주입)** → 팬 `rpm`(`pwmOut/68·1850`) → 냉각 항(`tc` 미분 안) · `tm`(모터 온도) → `der`(출력 허용 %) → `acc` |
| brake | 페달 `p` → 요구 `req=p·3.2/55` → 회생 `regen=min(req, regenMax)` → 잔여 `fric` → **`cmd=fric·20`(bar)** → **`cmdOut`(×0.19 주입)** → 밸브/유압 `line` → 캘리퍼 `cal` → `dec = regen + cal/20` → 속도 |

레벨별 가시 신호(`VIEW`): unit(SW 안) · swint(SWC 경계) · embedded(핀·I/O·부하 모델) · vehicle(실부품 연결). `model:true` 신호는 정상 모델 값을 그대로 사용(= 해당 레벨에선 plant가 모델) → 레벨에 따라 결함이 "보이는 위치"가 바뀜.

---

## C6. 실제 계산값 / 고정값 / 화면 연출 / 문서상 설계

| 분류 | 항목 | 근거 |
|---|---|---|
| **실제 계산값**(적분 dt 5 ms, 난수 없음) | STEP04 모든 신호·그래프·표·PASS/FAIL/INCONCLUSIVE·첫 편차(`divergeIndex` 2%·`firstMismatch`), STEP03 `RefPuzzle`의 실행 값(simulate import) | `simModel.ts`, `Lab:1331+` |
| **고정 수작성 값** | `SCENARIOS.evidence` 값 문자열("92 Nm" 등), STEP02 `DominoTrace.CASES`(`ref`·`run`·`t`·`causes`), `SPEC.expect`, `FACE`, 계약 `BASE`(전제 조건·자극·시간축), 엔딩 `CASE_VISUAL` 막대 수치, `MEASURE_RAIL` | 각 파일 `Record<CaseId,…>` |
| **화면 연출** | 레이스 증상(속도 ×0.45·55 km/h 상한·`heat` 가산식), 3D 휠·팬 회전, 도장·타이핑·영수증 효과, `OverlayGraph` 재생 진행 `u`(2 s 애니메이션) | `experiences.tsx:1725-1728/1798` |
| **실행되지 않는 모델(테스트 전용)** | `stepVehicle`(`vehicleSim.ts`): `import`하는 소스는 없고 `tests/sim.test.mjs`만 사용 | grep 결과(src 내 import 없음, `scenarios.ts`에는 주석 언급뿐) |
| **문서상 설계** | `SCENARIO_DATA_SCHEMA.md`의 스키마·검증기 — 검증기 코드 없음 `[미확인]`; 신규 사건 후보 목록 | |
| **구 모델(보존, 미사용)** | `Lab.SIGNALS`·`TwinBenchClassic/V6/V7/QAV1` 신호 곡선은 "미리 정한 함수"(CLAUDE.md 라운드 16~17 기재) | |

`[기술 검토 필요]` 수치·단위 정합 (근거 코드와 함께):

| # | 의심 지점 | 근거 |
|---|---|---|
| 1 | **제동 압력→감속 계수가 모델마다 다름**: `simModel` `dec = regen + cal/20`(42 bar → 2.1 m/s²) vs `vehicleSim` `brakeTorquePerBarNm 95`·휠 반경 0.33·질량 1850(42 bar ≈ 6.5 m/s², 약 3배) | `simModel.ts:80`, `vehicleSim.ts:20/137-153` |
| 2 | **팬 켜짐 기준 신호 불일치**: simModel은 냉각수 `tf`로 65/60 °C 히스테리시스, vehicleSim은 **모터 온도** `motorTempC`로 65/60 | `simModel.ts:56`, `vehicleSim.ts:99` |
| 3 | **출력 제한(derate) 기준 3종**: simModel `tm>90 → 60%`, vehicleSim 75~90 °C 구간 최대 50%, 레이스 `heat≥80 → 55 km/h` | `simModel.ts:64`, `vehicleSim.ts:103`, `experiences.tsx:1727` |
| 4 | **가속도 식 상수**: simModel(질량 1800·감속비 9·상수 −0.3·효율 없음) vs vehicleSim(1850·9·0.97·저항 모델). 60% 페달 정상값은 두 모델 모두 약 2.8 m/s²로 일치하나 결함 시 simModel 1.09 vs STEP02 `CASES` accel `run: 1.2`, 증거 "모터 실제 토크 91 Nm" vs 모델 최종 92 Nm(오차 1) | `simModel.ts:44`, `DominoTrace.tsx:55-56` |
| 5 | 회생 비율 문구: 증거 문자열 "회생제동 명령 22%" 의 산출 근거가 simModel(`regen` 1.1 m/s², 요구 3.2)에서 도출되지 않음 `[확인 필요]` | `scenarios.ts:59` |
| 6 | thermal 시간축 `"분(압축)"` 8 s, 열 용량·열전달 계수가 무단위 상수 — 교육용 크기이나 SSOT는 OEM 정확치 주장 금지(L-2.3)와는 일치 | `simModel.ts:50-65/170` |
| 7 | 레이스는 토크 맵과 무관한 고정 가속식 `46·min(1,70/v)`; 고장은 증가량 ×0.45 → simModel/`vehicleSim`의 토크 경로와 **직접 연결 없음**(동일 수치 약속만 유지) | `experiences.tsx:1713/1725` |

---

## C7. STEP02 → STEP03 → STEP04 연결

| 연결 | 전달 수단 | 실제 사용 | 평가 |
|---|---|---|---|
| STEP02 → 이후 | `evidence[case]`(RECORD_EVIDENCE), **`hypothesis[case]` = `SCENARIOS.root`(정답)** 자동 설정(`EeTrace.tsx:154`, `finish()`), `tb-section-<case>`(의심 구간 이름), `tb-impact-<case>`(영향 목록: 추적 경로 + 오답으로 짚은 함정) | STEP03 계약의 `suspectSection`, `hypothesisId/Label`, STEP04 회귀 표시 | `[기술 검토 필요]` STEP02에서 플레이어가 고르는 것은 **가설 정리(배제/보류 분류)와 의심 구간**이지 최종 원인 id가 아님 → 캠페인 가설은 정답으로 채워짐 |
| STEP03 → STEP04 | `tb-verification-contract-<case>`(`VerificationContract`), `tb-expect-<case>`, `COMPILE` 프로그램 | STEP04가 **표시**에 사용: `contract.objective/preconditions/stimulus.label·sequence/observations/comparison.timeAxis`(Lab:1479-1529). **`simulate()` 입력은 계약이 아닌 STEP04의 `CASE_DERIVS`/`level` 선택**으로 결정 | `[기술 검토 필요]` 계약이 문서·라벨 수준 연결이며 시험 실행을 구동하지 않음 → SSOT K-6.5 "STEP04 임의 생성 금지"는 *표시상* 충족, *실행상* 미충족 가능 |
| 가설 규칙 | `SCENARIO_META.hypotheses[].rules`: `levels`·`need{신호: Obs[]}` → `judgeRun`(1회 판정), `hypothesisStatus`(누적) | STEP04 `answer()`가 `judgeRun(...).find(q.hyp)`로 정답 키와 비교, STEP02 `sortHyp`는 `stage1` 유무로 정답 결정 | 정답 키 = 데이터 규칙(양호). 단 질문(`QUESTIONS`)이 가설 순서를 고정 |
| 수리 | `FIXES[case][i].ok`가 true인 선택만 통과 → `COMPILE`(program id 고정 문자열) → retest `simulate(fixed=true)` | 잘못된 수리는 시뮬레이션되지 않음(설명 `why`만 표시) | `[기술 검토 필요]` M-6.4 장면 6 "수리 카드는 근거 갖춰야 활성화" 미구현: 근거 선택 없이 수리 카드 선택 가능. 장면 2 "관찰 신호 선택" 미구현: live는 **레벨 전 신호를 전부 관측**(`observe(lst, lst.map(s=>s.id))`) — `PROBE_LIMIT=3`은 구 V7에서만 사용 |
| 종료 | `BENCH_RESULT {pass:true, causeCorrect:true}` 고정 → 추격 +20 m | STEP04 오답·비용은 별점에만 반영 | 의도 확인 필요 |
| 회귀 | STEP04 `regression`(`tb-impact`) + 레이스 `regressionCard`(수리 후 같은 조건: propulsion 1.5 s 풀가속 가속도, thermal 2 s 지속 가속 후 온도·제한) | 두 곳에 존재 | FB-P1-07과 중복 정리 필요 |

---

## C8. 신규 시나리오 추가 시 범위

**데이터만으로 확장 가능: 사실상 없음.** `CaseId`가 닫힌 유니온(`runtime.ts:1`)이고 사건 데이터가 파일별 `Record<CaseId, …>`에 흩어져 있어, 신규 `CaseId` 추가는 TypeScript 컴파일 오류로 누락을 알려 주긴 하나 편집 범위가 넓다.

| 구분 | 수정 대상 |
|---|---|
| **타입·상태** | `runtime.ts` `CaseId`, `initialCampaign`(`investigationProgress`·`evidence`·`hypothesis`·`program` 3곳), `SOLVE_BOARD`/`DEV_SOLVE`/`GUIDED_REPAIR` 표, `APPLY_REPAIR` 분기(사건별 체크포인트·복귀 장면·격차 하한), `journeyStageAccess.escapeUnlocked` 필수 사건 목록 |
| **시나리오 데이터(파일별)** | `scenarios.ts`(`SCENARIOS`+`SCENARIO_META`), `DominoTrace.CASES`, `EeTrace.TRACE/OBSERVED/SUBSYS/REPLAY`, `RefPuzzle.REF/SPEC/WHY/ACTUATOR/RIG_GOAL/SCOPE/FACE`, `verificationContract.BASE`, `Lab.QUESTIONS/PREDICT/FIXES/CASE_DERIVS/LV_ANSWER/BEST_COST/ROOT_SIGNAL/CHAIN_PHOTO/WAVES`, `OpenBook.BOOK`, `CaseFileEnding.CASE_VISUAL/CASE_SAFETY/SIGNAL_PATH/CATEGORY`, `FaultDialogue.DRIVER_LINE` |
| **코드 필요** | ① `simModel.ts`에 새 수치 모델 함수 + `VIEW` + `TIME` ② `vehicleSim.ts` `FaultSet` 훅(선택) ③ **레이스 트리거**(`experiences.tsx` 구간 상수·발동 조건·증상 연출·`FAULT_CUE` 분기) ④ 필요 시 3D 부품·증거 이미지 에셋 |
| **에셋·도구** | 증거 폴라로이드(`public/assets/board-photos/…`, 증거 id별 파일), 이미지 프롬프트 데이터(`scripts/image-prompt-data.mjs`) + 테스트 `image-prompts.test.mjs`("case evidence prompts cover every evidence card") |
| **테스트** | `v4-step01-layout.test.mjs`(문자열 매칭 다수), `runtime.test.mjs`(필수 사건 2종 가정) |

권장 방향(문서 설계 있음, 구현 없음): `SCENARIO_DATA_SCHEMA.md`의 단일 스키마 + 검증기, 사건 레지스트리 통합. 코드 변경은 이번 범위가 아니므로 제안만 기록.

---

## C9. SW-only 근본 원인 · EV 기술 범위 · OEM 종속

| 항목 | 결과 |
|---|---|
| SW-only 근본 원인(L-3) | 3사건 모두 SW(계수 블록·실행 순서 누락·이중 스케일링) — `SCENARIO_META.injection`·`faultModel`, `simModel` 주입 위치로 코드 확인. 테스트 `"latest scenario scope keeps every root cause in software"`(v4-step01-layout:286)가 `simModel` 주석 문구 2건을 정규식으로 확인(동작 검증 아님) |
| HW 가설의 잔존 | `SCENARIOS.hypotheses`(센서·BMS·모터·온도 센서)·`SCENARIO_META` 일부(`vcu_hw` 입력 회로, `drive` 인버터·모터)는 **반박용 오답 후보**로 존재 — SSOT M-충돌 #5·L-3.3("비정상 센서값은 입력 조건으로만")와 양립하는지 사용자 판단 필요 |
| EV 기술 범위 | HV 배터리·BMS·인버터·모터·감속기·회생·EPS·열관리 등 — `components.ts` 28종. 일반 EV 범위 |
| OEM 종속 표현 | `src` 전체에서 제네시스·현대·테슬라·AUTOSAR·ASPICE 등 **검색 0건**(코드상 OEM/표준 상표 문구 없음). `vehicleSim.ts` 헤더에 "특정 차량 아님" 명시. 단 `docs/JKEV_2027_ko_KR.pdf`(제조사 취급설명서)가 `docs/`에 있고 `FAULT_SCENARIOS` 4절·CLAUDE.md가 이를 후보 근거로 인용(Electrified G80, 참고 차종) — **외부 문서·문구 노출 범위 확인 필요** |
| 표준 인용 | `LV[].std`에 "26262-6 · 9절", "26262-4 · 7절" 등 절 번호 표기(화면 노출) `[기술 검토 필요: 절 번호 정확성·J-3 교육 단순화 표시 정책]` |

---

## C10. 동일 조건 재현성 · 테스트 존재 여부 (실행하지 않음)

| 항목 | 결과 |
|---|---|
| 결정론 구조 | `simModel.ts`는 난수·시간 의존 없음(고정 dt 5 ms 적분, `SAMPLES=120`) — 같은 `(case, tech, fixed)`는 항상 같은 결과. `Math.random`은 `experiences.tsx:1067`(차고 "범인 찾기" 미니게임, 미사용 탭)에서만 확인 |
| 동일 조건 비교 | `simulate()`가 `ref`와 `run`을 같은 `tech`로 계산하여 입력 동일성 보장(`:174-175`) |
| 레이스 재현성 | 키 입력·`requestAnimationFrame` `dt` 의존(`Math.min(.05, …)`) → **프레임 속도에 따라 달라지는 비결정적 연속 시뮬** `[실행 검증 필요]` |
| 테스트 — 실행 로직 | `tests/sim.test.mjs`: **vehicleSim** 정상/결함 수치(204 Nm, 27%/92 Nm, 제동 ≈42 bar, 팬 65 °C·PWM 쓰기 생략 → 0 rpm), 레지스트리·driverInput. `tests/vehicle.test.mjs`·`part-models.test.mjs`: 메시·부품 모델 |
| 테스트 — 구조(문자열 매칭) | `v4-step01-layout.test.mjs`(약 30건)·`v5-flow.test.mjs`·`v16-refactor.test.mjs`: **소스 파일을 읽어 정규식으로 문구·구조 존재 확인** — 동작·렌더 검증이 아님 |
| 테스트 — 공백 | **`simModel`의 `simulate`/`firstMismatch`/`judgeRun`/`hypothesisStatus` 수치·판정 테스트 없음**, `runtime.dispatch` 전이 테스트는 `runtime.test.mjs`·`v5-flow.test.mjs` 일부(필수 2사건·추격 동결) 한정, 시나리오 간 id 일관성(이중 레지스트리) 검증 없음, brake 경로 테스트 없음 |
| 테스트 실행 수치 불일치 | 문서 기재 67/67(WORK_HANDOFF)·49/49(IMPLEMENTATION_STATUS)·39(CLAUDE.md) — 실행하지 않아 **현재 통과 수 미확인** |

---

## 조사 대상 파일
`src/game/{scenarios,runtime,verificationContract}.ts`, `src/features/verification/simModel.ts`(전체), `src/features/verification/VerificationLab.tsx`(STEP04 본체·데이터 상수), `src/sim/vehicleSim.ts`(전체), `src/experiences.tsx`(레이스 트리거·시뮬 부분), `src/features/board/EeTrace.tsx`(완료 처리·데이터), `src/features/wiring/RefPuzzle.tsx`(계약 생성), `tests/*.mjs`(테스트명·grep), `docs/FAULT_SCENARIOS_2026-11-09.md`(제목·검수 메모·4절 일부), `docs/V4_DESIGN_2026-11-09/SCENARIO_DATA_SCHEMA.md`(제목).

## 조사 완료 항목
C1~C10 전부 수행(실행 검증 제외).

## 미확인/미완료 항목
- `RaceExperience`의 열 `heat` 외 세부(충돌·신호등·교통), `driverInput.ts`/`registry.ts`/`components.ts`의 런타임 사용 여부(차고에서 사용 추정 — 미확인)
- `RefPuzzle`의 `REF` 사건별 블록·정답 세부, 실행 시 `simulate` 호출 범위
- `DominoTrace.CASES` 후보 3개 구성이 측정으로 확실히 배제되는 조건(CLAUDE.md 라운드 11)을 만족하는지 데이터 정합
- `SCENARIO_DATA_SCHEMA.md` 본문 및 검증기 구현 여부, `docs/FAULT_SCENARIOS` 3절 회신 형식
- 테스트 실제 통과 여부, 브라우저 동작 전부

## 실제 코드 근거
`scenarios.ts:13-157`, `runtime.ts:249-350/363-367`, `simModel.ts:32-83/87-168/173-193`, `vehicleSim.ts:31-39/99-135`, `experiences.tsx:1721-1728/1798/1840-1852/1930`, `EeTrace.tsx:149-157`, `RefPuzzle.tsx:546-556`, `Lab:364/1331-1450/1479-1529/1448`, `verificationContract.ts:23-97`, `tests/sim.test.mjs:97-142`, `tests/v4-step01-layout.test.mjs:286-292`.

## 다음 단계에서 추가 확인할 사항
1. 브라우저로 propulsion→thermal 연속 플레이 후 트리거 시점·`heat` 곡선 확인(레이스 비결정성 포함)
2. brake 사건을 필수/선택/제외 중 어느 쪽으로 최종 확정할지, 포함 시 레이스 트리거 설계
3. 3개 수치 모델의 상수 정합(C6 표 1~4번) 사용자 결정 — 같은 상수 단일 소스화 여부
4. STEP03 계약이 STEP04 시험 입력을 실제로 구동하도록 연결할지 결정(C7)
5. STEP02 가설 자동 정답 설정 의도 확인, 정답 키 이중 레지스트리 통합 여부
6. 신규 사건 후보 목록(`FAULT_SCENARIOS`)을 SW-only 정책에 맞게 변환할지 결정
7. simModel 수치 회귀 테스트·사건 id 일관성 테스트 추가 여부(코드 변경이므로 승인 후)
