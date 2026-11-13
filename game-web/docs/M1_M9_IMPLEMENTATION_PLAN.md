# M1_M9_IMPLEMENTATION_PLAN — 필수 수정 M1~M9 구체화와 의존 관계

- 작성일 2026-11-13 · 기준 `contest/v2` @ `d4e9f996` · 읽기 전용(코드·CSS·에셋 미수정, 기존 감사 문서 미수정, 새 문서만 작성)
- 이 문서의 **실측값**은 저장소 밖(scratchpad)에서 기존 `simModel.ts`를 그대로 import해 실행한 결과다(저장소 파일 변경 없음). 이전 감사의 "손계산"을 대체한다.
- 출처 표기: **[코드]** 이번에 코드에서 직접 확인 · **[실측]** 모델 실행값 · **[기존]** 기존 감사 문서 결과 · **[근거]** 표준·기술 근거 · **[가설]** 추가 검증 필요 · **[결정]** ChatGPT·사용자 결정 필요

---
## 0. 정정 (이전 감사 문서의 오류 — 먼저 읽을 것)

이번 재검증에서 `AUDIT_EXECUTIVE_SUMMARY.md` 등의 일부 판단이 **틀렸거나 과장**된 것을 확인했다. 기존 문서는 요청에 따라 수정하지 않았고 여기에 정정한다.

| ID | 이전 주장 | 재검증 결과 | 영향 |
|---|---|---|---|
| E1 | "STEP02 완료 시 가설이 정답 id로 자동 설정됨(`EeTrace.tsx:401`)" = T-25 잔존, **M6 필수** | **틀림.** 401행은 **레거시 `EeTrace`**(`EeTrace.tsx:341~`)이고, 실제 장면은 `EeTraceV2`(`main.tsx:66`에서 `EeTrace`로 alias, `:1521`). `EeTraceV2.finish`는 플레이어가 보류한 가설 중 `carryId`를 `SELECT_HYPOTHESIS`로 보낸다(`EeTrace.tsx:187`). `tests/v4-step01-layout.test.mjs:137`이 "정답 id 자동 설정 금지"를 이미 검증한다 | **M6 철회·재정의**(아래 M6) |
| E2 | "STEP03 thermal 현장 값(`field.pi/driver`=PWM 100%)이 화면에 표시되어 결함을 HW처럼 보이게 함(F-01 높음)" | **과장.** `field`는 `RefPuzzleTrack`에서 `same=false`일 때만 쓰이는데(`RefPuzzle.tsx:717`), STEP04의 `same`은 `firstMismatch(sim.levels.unit)===null`(`VerificationLab.tsx:1516`)이고 thermal·brake의 unit 수준 신호는 모두 `model:true`라 항상 `same=true` → **`field` 값은 화면에 표시되지 않는다**(휴면 데이터). STEP03 퍼즐 자체의 예시 값은 `PWM 68%/0%`로 일관 | F-01 **높음→낮음(휴면 데이터, 정리 대상)**. 단 `driver` 블록이 `kind:"hw"`인 개념 문제는 유지 |
| E3 | "STEP02에서 커넥터 PWM이 정상(100%)으로 표시되어 STEP04와 모순(T-01 높음)" | **잠재적.** `fan_pwm`·`fan_power`·`fan_block`은 어떤 노드의 `causes`에도 없어 STEP02에서 **도달 불가(죽은 데이터)** [코드 `DominoTrace.tsx:97~106`]. 플레이어는 모순을 보지 못한다. 다만 STEP04 `fpwm`(pwmOut) 규칙은 살아 있다 | T-01 **높음→낮음(죽은 데이터)** |
| E4 | `STEP02_04` §7 표 "thermal 결함 현장 값 … 커넥터 PWM 100%" | E2·E3의 결과로 해당 행은 "표시되지 않는 불일치" | |

> 이전 문서에서 **유효 유지**되는 핵심: 요청(ON)과 PWM 듀티가 "100%"로 합쳐진 표기(F-05), thermal 정상 기준 3종 불일치(100/68/65.5), brake 속도·정지거리 불일치, 모델이 읽지 않는 계약 전제, INCONCLUSIVE 표시 문제, 반말 문구, 신호 id 불일치.

---
## 1. 이번에 실측한 모델 값 (기존 `simModel.ts` 실행, 계약 `BASE` 사용)

| 사건 | 항목 | 정상(ref) | 결함(run) | 최초 편차 시각 |
|---|---|---|---|---|
| propulsion | 처리값 / 토크요청 / CAN / 모터 / 가속도 | 60 % / 204 / 204 / 204 Nm / 2.79 m/s² | 27 % / 91.8 / 92 / 92 Nm / 1.09 m/s² | 0.05 s(처리값)→0.08 s(모터) |
| thermal (계약 경로) | PWM 출력·팬 rpm | 65.47 % · 1778.9 rpm | 0 % · 0 rpm | 0.40 s |
| thermal (계약 경로) | 냉각수 `tc` / 모터 `tm` / 출력허용 `der` | 78.39 / 85.45 / 100 | **78.39 / 85.45 / 100 (정상과 동일)** | 편차 없음 |
| thermal (레거시 경로, 계약 없음) | `tc` / `tm` / `der` | 70.31 / 70.47 / 100 | 80.75 / 95.02 / 60.32 | 1.27 s / 1.60 s / 6.13 s |
| brake | 압력 계산 / I/O 출력 / 캘리퍼 / 감속 | 42 / 42 / 42 bar / 3.20 m/s² | 42 / 7.98 / 7.98 bar / 1.50 m/s² | 0.05 s(출력)→0.13 s(감속) |
| brake (72 km/h, 3 s 적분) | 3 s 후 속도 | 41.5 km/h | 57.0 km/h | **3 s 안에 정지하지 않음** |
| 해석 계산(감속 일정) | 정지거리 72 km/h, a=3.2 | **62.5 m, 6.3 s** | a=1.5 → 133.3 m | — |
| 해석 계산 | 정지거리 50 km/h | a=3.2 → 30.1 m | a=1.4 → 68.9 m, a=1.5 → 64.3 m | — |

요구사항 판정(`assessContractRun`) 실측:

| 사건 | SW 단위 | SW 통합 | 제어기 I/O | 시스템 통합 | 수리 후 |
|---|---|---|---|---|---|
| propulsion | **INCONCLUSIVE** (out-of-range: proc, req) | **INCONCLUSIVE** (proc, cansig) | FAIL | FAIL | PASS |
| thermal | INCONCLUSIVE (편차 신호 없음) | INCONCLUSIVE | FAIL (pwm, rpm) | FAIL | PASS |
| brake | INCONCLUSIVE | INCONCLUSIVE | **INCONCLUSIVE** (out-of-range: cmdOut, line) | FAIL | PASS |

---
## 2. 의존 관계

```
M9 신호 id 체계 ─┬─► M1 thermal 정상 기준 통일 ──► M3(정리) ──► (테스트 T-M1)
                 ├─► M4 brake 속도·정지거리·시간축 ─► (테스트 T-M4)
                 ├─► M5 미모델 전제 정리            ─► (테스트 T-M5)
                 └─► M7 판정 병기(요청/출력 중간 오라클을 쓰려면 M9 필요)
M1 ──► M2 (퍼즐 블록 분류·field 정리는 M1의 정상값이 정해진 뒤)
M4·M5 ──► 계약(BASE) 수정 → STEP03 영수증·STEP04 입력 카드 문구에 파급
M8 (문구)는 독립이나 M1·M4의 최종 문구가 정해진 뒤 한 번에 적용
M6'(carry 의미 확인)은 독립
공통 선결: 시나리오 수치 데이터를 node에서 import 가능한 순수 .ts로 분리(아래 §4 [결정])
```

| 의존 쌍 | 이유 |
|---|---|
| M9 → M1 | "팬 100%"를 요청/듀티/출력 중 무엇으로 부를지 신호 id가 먼저 정해져야 문구 정정이 가능 |
| M1 → M2 | 퍼즐의 `driver` 블록 분류(HW/SW)와 `field` 정리는 정상 듀티 값(100/68/65)이 확정된 뒤에만 의미 |
| M4 ↔ M5 | 둘 다 `BASE.*.execution.initial`(차속·SOC·ABS) 편집 — 한 번에 |
| M1·M4·M5 → M7·M8 | 화면 문구·병기 UI는 수치·신호 정의 확정 후 |
| (테스트) | 기존 `feedback-1112`·`verification-contract-execution` 테스트가 모델 시리즈를 `deepEqual`/허용오차로 단정 → 모델·BASE 수치를 바꾸면 영향 |

---
## 3. M1~M9 상세

### M1. thermal 정상 기준 통일 (요청 ON vs PWM 듀티 vs 100% / 68% / 65.5%) — **우선순위 최상**

| 항목 | 내용 |
|---|---|
| 현재 문제 | thermal의 "정상 팬 출력"이 **3가지 숫자**로 표기됨: **100 %** (STEP02 `fan_cmd` ref 100, 증거 문구 "Fan PWM 명령이 100%로 기록됨", STEP02 `req`), **68 %** (STEP03 `pi.out`·`driver.out`, STEP03 예시 슬라이더, `VerificationLab` SW 로직 `PWM 출력 expected "68% duty"`), **65.47 %** (모델 실측 PI 듀티). 100은 모델에서 **히스테리시스 ON 플래그(`fanReq=on*100`)**이지 PWM 듀티가 아니다 |
| 관련 파일·함수 | `scenarios.ts:42`(evidence `fan_command`), `DominoTrace.tsx` thermal `req`·`fan_cmd`(ref 100, **도달 가능** — `fan_rpm.causes`에 포함)·`fan_rpm`(ref 100 → run 0), `EeTrace.tsx:317·337`(`signals:"팬 PWM 명령"`, `outLabel:"PWM 출력 0% (기준 100)"`), `RefPuzzle.tsx` thermal `req`/`blocks.pi`/`SPEC.thermal`/`exampleValue`(542행), `VerificationLab.tsx:77·136·246`, `simModel.ts:73~79`(`fanReq`, `duty`, `pwmOut`), `verificationContract.ts` thermal `BASE`(기대 rpm 1850±120) |
| 플레이어가 보는 현상 | STEP02에서 "팬 PWM 어댑터 100→0 %"를 보고, STEP03 퍼즐 슬라이더에서 "PWM 68%"를 보며, STEP04 그래프에서 정상 PWM이 **약 65%**로 그려진다. 같은 "정상 PWM" 값이 단계마다 달라 어느 쪽이 기준인지 알 수 없다. 또 "팬 요청 100%인데 출력 0%"라는 핵심 대비가 "100 vs 0"으로만 보이고 **듀티 65% vs 0%**라는 실제 값은 STEP04에서야 나온다 |
| 기술적 원인 | (1) 요청(ON/OFF 불리언)과 듀티(연속량)를 한 이름 "팬 명령/PWM 명령"으로 표기 (2) STEP02·03·04 값이 각각 손으로 입력됨(자동 일치 검증 없음, `scenarios.ts:71` 주석만 "must match") (3) 모델의 PI 기본 듀티 `60 + 0.002e + int` 결과(≈65.5)와 문구 "68%"가 다름 |
| 수정할 데이터·로직 | **데이터**: 요청 신호 `fanRequest`(ON)·듀티 `fanDuty`(%)·출력 `pwmOut`(%)을 분리해 STEP02 `fan_cmd`(→"팬 요청 ON")·evidence 문구·`outLabel`·STEP03 `pi/driver`·SW 로직 뷰의 숫자를 **하나의 정상 듀티 값**으로 통일. 정상 듀티는 (a) 모델 실측 ≈65%로 문구를 맞추거나 (b) 모델 상수를 조정해 68%를 내도록 변경 — [결정] **로직(소)**: 없음(상수 조정 시 `simModel.ts:73`) |
| 다른 STEP 영향 | STEP02(증거 카드·기준 막대), STEP03(퍼즐 블록 출력·영수증 `SPEC.expect`), STEP04(기대 rpm/그래프 값·`VerificationLab` 라벨), 엔딩(`CaseFileEnding` thermal 계측 막대 "PWM 100%" [기존: END-0071]) |
| 수정 후 검증 | 신규 테스트 T-M1: (a) 모델 실행으로 PI 듀티 정상값을 계산해 문구에 쓰인 값과 일치(허용 ±1 %p) (b) `fanRequest`·`fanDuty` id가 STEP02~04 데이터에서 같은 의미로만 쓰임(regex) (c) 기존 `verification-contract-execution` 3개 + `feedback-1112` hold/decide 테스트 유지 |
| 의존 | **선행: M9**. 후행: M2·M3·M7·M8 |

### M2. thermal STEP03 퍼즐 `field`/`driver` 정리 — **우선순위 하향(휴면 데이터)**

| 항목 | 내용 |
|---|---|
| 현재 문제 | `REF.thermal.field = { pi: "PWM 100%", driver: "PWM 100% · 12V", fan: "0 rpm" }`는 실제 결함(PWM 쓰기 생략 → 출력 0%)과 모순 — 그러나 **화면에 표시되지 않음**(E2). 별개로 `driver` 블록이 `kind:"hw", ee:true`("팬 구동 출력단·전원")이고 결함은 "출력 어댑터 SW"라 **SW 어댑터와 HW 출력단이 한 블록으로 표현되지 않음** |
| 관련 파일·함수 | `RefPuzzle.tsx:97~107`(blocks.pi/driver, field), `:717`(`got = fixed||same ? want : ref.field[id]`), `VerificationLab.tsx:1516`(`swSame`) |
| 플레이어 현상 | 현재 없음. `swSame`이 항상 참이라 STEP04 SW 트랙에는 정상 값만 보임. 단 STEP03에서 "ECU 출력단"이 HW 블록으로 보여 "결함이 HW 출력단인가?"로 오해 가능 [가설] |
| 원인 | 구 설계(결함을 출력단 이후에 두던 시절)의 데이터 잔존 + 퍼즐 블록 모델이 SW/HW 구분을 `kind` 한 필드로만 표현 |
| 수정 | **데이터**: `field.pi/driver`를 실제 결함 값(`PWM 0%`)으로 정리하거나 삭제. `driver`를 "PWM 출력 어댑터(SW) + 구동단(HW)" 2블록 또는 라벨에 SW/HW 병기 — [결정] **로직**: 없음 |
| 다른 STEP | STEP03 퍼즐 정답 보드(`board`/`gaps`/`spares`)가 바뀌면 `v4-step01-layout.test.mjs`의 문자열 단정 영향 가능, STEP04 SW 트랙 |
| 검증 | 신규 T-M2: `field`의 각 값이 `simModel` 결함 값과 모순되지 않는지(휴면이라도 데이터 일관). 기존 테스트 실행 |
| 의존 | 선행 M1 |

### M3. STEP02 죽은 노드(`fan_pwm`·`fan_power`·`fan_block`) 정리 및 `fpwm` 규칙 정합 — **우선순위 하향**

| 항목 | 내용 |
|---|---|
| 현재 문제 | 위 3노드가 `causes`에 없어 도달 불가(E3). 이 노드들은 본래 "HW 가설 반박용 정상 관측값"(커넥터 PWM·전원·걸림)이며 STEP04의 `fpwm`/`fv` 신호와 대응. 정상으로 표기된 `fan_pwm=100`은 `fan_rpm`(PWM 출력 어댑터=0)과 모순되는 값이 **데이터에는 남아 있다**. 또 `SCENARIO_META` thermal `fan_sw`의 `fpwm: lower` 규칙은 이 시험 신호를 사용 |
| 파일 | `DominoTrace.tsx:97~106`, `scenarios.ts:139·153`, `simModel.ts:150~151` |
| 플레이어 현상 | 현재 없음(도달 불가). 재설계에서 "HW 반박 증거"로 되살리면 즉시 모순이 드러남 |
| 원인 | SW-only 정책 적용 시 `causes`에서 제거만 하고 노드는 남김 |
| 수정 | **데이터**: (a) 삭제 또는 (b) 의미 재정의 — `fan_pwm`(커넥터 PWM)은 **어댑터 출력과 같은 신호**이므로 `ref 65, run 0, bad`로 하거나, "팬 전원 12 V 정상/걸림 없음"만 정상 반박 증거로 유지 [결정: HW 반박 증거를 STEP02에서 보여줄지] |
| 다른 STEP | STEP04 `fpwm`·`fv` 라벨, brake·propulsion의 유사 죽은 노드(`cluster`, `rear_warn` 등) |
| 검증 | 신규 T-M3: 각 사건에서 `causes` 도달 불가 노드 목록을 테스트로 고정(의도적 예외만 허용) |
| 의존 | 선행 M1 |

### M4. brake 속도·정지거리·시간축 정합

| 항목 | 내용 |
|---|---|
| 현재 문제 | 계약 전제 **72 km/h**(실제로 모델이 사용), STEP02 정지거리 **32→58 m**. [실측] 72 km/h·3.2 m/s²이면 정상 **62.5 m**, 결함(1.5 m/s²) **133 m**. 32 m는 50 km/h(30.1 m)와, 58 m는 어떤 속도·감속도 조합과도 맞지 않음. 또 계약 "정지까지 동일 시간축"인데 `durationSeconds=3` → [실측] 3 s 후 정상 41.5 km/h, 결함 57.0 km/h로 **정지하지 않는다** |
| 파일·함수 | `DominoTrace.tsx` brake `stop`(ref 32/run 58, t 3)·`decel`(3.2→1.4, t 0.2)·`caliper`(42→8, t 0.1), `verificationContract.ts` brake `BASE`(`vehicleSpeed 72`, `timeAxis`, `durationSeconds 3`), `simModel.ts:83~97`(`v` 초기값 `initialValue(…vehicleSpeed,50)`), `INPUT_INFO.brake` |
| 플레이어 현상 | STEP03 영수증/STEP04 계약에는 "72 km/h", STEP02 시작 카드에는 "정지거리 32 m". 숫자를 대조하는 플레이어는 어느 쪽이 맞는지 알 수 없음. STEP04 그래프에서 정지 거리는 표시되지 않고(신호 `dec`만) 결과 표 마지막 값만 보임 |
| 원인 | 원 속도 50 km/h 시절 STEP02 상수가 남음(모델은 계약 속도를 읽도록 변경됨, `dce7e505`). 정지거리 시리즈는 모델이 계산하지 않아 일치 테스트도 없음 |
| 수정 | **데이터 선택지** [결정]: (A) 72 km/h 유지 → STEP02 정지거리를 62.5→133 m로 변경(또는 `dec` 표기만 사용), (B) 50 km/h로 되돌림 → 계약·`INPUT_INFO` 수정(30.1→64.3 m). 시간축: `durationSeconds`를 정지 소요(≥ 6.3 s 또는 14 s)로 늘리거나 "정지까지" 문구를 "3초간" 으로 변경. **로직(소)**: 정지거리 신호 `dist`를 모델에 추가하면 STEP02 값과 자동 일치 테스트 가능 — 모델 변경이므로 [결정] |
| 다른 STEP | STEP02 시작 카드·막대, STEP03 계약 영수증, STEP04 입력 카드(`bound`, `equiv`)·그래프 축·`expectedOutputs`(dec만), 엔딩 `CASE_VISUAL`(`brake`) [기존: END-0081] |
| 검증 | 신규 T-M4: (a) 계약 `vehicleSpeed`·기대 감속에서 해석 정지거리 `v²/2a`를 계산해 STEP02 `stop.ref` 와 ±5 % (b) `durationSeconds ≥ v0/a_ref` 또는 문구에 "정지" 미사용 (c) 기존 계약 실행 테스트 |
| 의존 | 선행 M9, 병행 M5 |

### M5. 모델이 읽지 않는 계약 전제 정리

| 항목 | 내용 |
|---|---|
| 현재 문제 | `execution.initial`에 있으나 **모델이 읽지 않는** 값: brake `batterySoc 82`, `absActive 0`, `gearDrive 1`; thermal `vehicleSpeed 0`, `fanCommand 0`, `ready`; propulsion `ready`/`gearDrive`/`brakePedal`. 또 thermal `coolantTemperature 62`는 읽히지만 `execution` 경로에서는 `s.tc = rampInput(...)`로 **즉시 덮어써져** 의미가 없음(`simModel.ts:64~65`) |
| 파일 | `verificationContract.ts` `BASE.*.execution.initial`, `simModel.ts` `initialValue` 사용처(propulsion `vehicleSpeed`; thermal `coolantTemperature`; brake `regenAvailable`, `vehicleSpeed`) |
| 플레이어 현상 | STEP03 영수증과 STEP04 계약에 "SOC 82%·ABS 비활성·정차" 등이 표시되나 시험 결과에 영향이 전혀 없다 — "전제조건이 실제 시험에 반영된다"는 학습 메시지가 거짓이 됨. 같은 이유로 `INPUT_EXEC` 입력 카드가 바꾸는 초기값 중 일부만 효과 |
| 원인 | 계약 스키마를 먼저 만들고 모델이 일부만 구현 |
| 수정 | **데이터**: 미모델 전제를 (a) 계약 표기에서 제거하거나 (b) "참고(모델 미반영)"로 분리 표기. **로직**: 모델 반영(예: SOC→회생 가용량 매핑, ABS 활성 시 마찰 몫 제한) — 신규 모델, [결정] |
| 다른 STEP | STEP03 영수증·STEP04 입력 카드·`contractSignalLabel` |
| 검증 | 신규 T-M5: `execution.initial`의 모든 `signalId`가 모델(`simModel`)에서 **읽히는지** 정적 확인(표에 명시한 "표시 전용" 제외). 기존 테스트 유지 |
| 의존 | 병행 M4 |

### M6. (재정의) STEP02→STEP03 가설 전달의 **의미** 확정 — *E1에 따라 자동 정답화 수정은 철회*

| 항목 | 내용 |
|---|---|
| 현재 사실 [코드] | `EeTraceV2`는 `sortHyp`에서 가설마다 반박/보류를 분류하고(정답 분류는 `h.stage1` 유무로 데이터 결정, `:168~172`), 보류 가설 중 `carryId`를 STEP03으로 보낸다(`:178~180, 187`). HW 가설은 라벨 `(HW)` 정규식으로 carry 후보에서 제외(`:177`). 테스트 `v4-step01-layout.test.mjs:137`이 정답 자동 설정을 금지 |
| 남은 문제 | (1) thermal은 3가설 모두 `stage1`이 없어 **전부 보류** → 플레이어가 고르는 `carry`가 어느 것이든 STEP03 계약에는 **이름 문자열만** 전달(`buildVerificationContract` `hypothesisId/hypothesisLabel/suspectSection`), 시험 내용은 동일 → 선택이 결과에 영향이 없음 (2) STEP04의 가설 판정(`judgeRun`)은 **모든 가설을 항상 평가**해 carry 가설과 무관 (3) 반박 분류 학습은 propulsion(2개)·brake(1개)에만 존재, thermal은 반박 경험 0 |
| 플레이어 현상 | thermal에서 "보류 3개 중 아무거나 골라도 같은 시험이 진행"됨 |
| 원인 | 가설 전달은 표시용 문자열이며 STEP03 퍼즐 유형·요구사항·시험 설계를 바꾸지 않음(구조) [기존 UX_AUDIT §9.3] |
| 수정 | **설계 결정**: carry 가설이 (a) 시험 계약의 `hypothesisId`로 STEP04 가설 시험 순서·강조·질문에 쓰이게 할지, (b) 현 상태(표시용) 유지할지 [결정]. thermal에 STEP02 반박 근거(`stage1`) 추가는 **정답 변경이 아니라 데이터 보강**(예: `fan_path`: "히스테리시스는 요청 100%로 정상" 의 STEP02 측정 가능 여부) — 기술 근거 필요 [가설] |
| 다른 STEP | STEP03 퍼즐 유형 선택(가설 유형→퍼즐 유형, `FAULT_TAXONOMY` A7→A8), STEP04 가설 시험 UI |
| 검증 | 신규 T-M6: carry 가설 id가 `contract.hypothesisId`에 보존(`verification-contract-execution`에 케이스 추가), thermal 보류 3개 중 어느 선택이든 흐름이 막히지 않음 |
| 의존 | 독립. 재설계 결정(STEP03 범용화)과 함께 |

### M7. 요구사항 판정(PASS/FAIL/INCONCLUSIVE)과 가설 판정의 병기·사유 표시

| 항목 | 내용 |
|---|---|
| 현재 문제 | [실측] `assessContractRun`은 **기대 출력 신호가 그 수준에 없으면** 편차가 있어도 INCONCLUSIVE를 반환한다. propulsion 단위 시험은 `proc`·`req`가 정상과 크게 달라(out-of-range) 있지만 INCONCLUSIVE. brake **제어기 I/O**(가설 `hyd_path`가 **결정되는 수준**)는 `cmdOut`·`line`이 크게 벗어나도 INCONCLUSIVE, 같은 화면에서 가설은 지지 |
| 관련 파일·함수 | `simModel.ts:211~234`(`assessContractRun`: `!hasExpectedOutput → INCONCLUSIVE`가 `outOfRange`보다 우선), `VerificationLab.tsx:1625`(호출), `:1836`(A/B), `scenarios.ts:215`(`judgeRun`) |
| 플레이어 현상 | "시험 결과: 판정 불가(INCONCLUSIVE)"와 "가설: 지지됨"이 동시 표시. 편차 신호는 빨갛게 보이는데 판정은 불가 |
| 원인 | 요구사항 판정이 "기대 출력(최종 신호)" 하나에 종속. 중간 신호 오라클이 없음(계약 `expectedOutputs`는 1개) |
| 수정 | **데이터**: 계약에 수준별 **중간 오라클**(예: brake `cmd`==`cmdOut`) 추가. **로직(소)**: `assessContractRun`이 `outOfRange`만 있고 기대 출력이 없으면 "FAIL(중간 신호 이탈)"/"INCONCLUSIVE(기대 출력 미관측)" 구분 반환. **UI**: 두 판정을 별도 칸·사유 문구 — [결정]: 판정 정의 변경이므로 사용자 확인 필요 |
| 다른 STEP | STEP04 결과 표·A/B·재시험(`assessContractRun` 3곳), STEP03 계약 스키마(`expectedOutputs`), `tests/feedback-1112` hold/decide 테스트와의 정합 |
| 검증 | 신규 T-M7: 사건×수준 12조합의 (요구사항 판정, 가설 판정) 기대 표를 고정하고 모델 실행 결과와 비교. 기존 `Scenario data: hold reasons…` 테스트 유지 |
| 의존 | 선행 M9, 중간 오라클은 M1 |

### M8. 문구 정책 정리 (반말·"시뮬레이션"·표준 절 번호 노출)

| 항목 | 내용 |
|---|---|
| 현재 문제 | 반말 종결: `FIXES.why` "…생겨!"(`VerificationLab.tsx:488`), "…손상돼."(`:494`), 고장 대사·수리 컷(`StaticCutscenes.tsx:84`) [기존]. `LV[].std`에 "26262-6 · 9절" 등 노출(`VerificationLab.tsx:684~`) — 목차 확인상 절 번호 자체는 맞음 [근거: ISO 26262-6 §9/10/11, 26262-4 §7 공개 목차] 이나 표시 정책 충돌 |
| 플레이어 현상 | 어투 혼재, 표준 번호가 학습 화면에 노출 |
| 원인 | 말투 규칙(CLAUDE.md)과 교육 단순화 표시 정책(J-3)의 충돌이 미해결 [기존 A3] |
| 수정 | **데이터(문구)** — [결정]: 절 번호 노출 여부, 어투 규칙 최신본 확인 후 일괄 적용. "시뮬레이션"을 "교육용 수치 모델 + 규칙 기반 판정"으로 표현할지 |
| 다른 STEP | 전 단계 문구, `tests/v4-step01-layout`의 문자열 단정(문구 변경 시 갱신 필요) |
| 검증 | 신규 T-M8: 지정 파일 문자열에 금지 어미 패턴(예: `(해|야|어)!` 종결) 부재 — 허용 예외 목록 필요 |
| 의존 | **M1·M4 이후 최종 문구 확정, 한 번에 적용** |

### M9. 신호 id·이름 체계 통일 (STEP01~04 공통) — **가장 큰 선행 과제**

| 항목 | 내용 |
|---|---|
| 현재 문제 | 같은 신호가 4가지 표현으로 흩어짐: STEP01 `featureFlows` 블록 이름·`flowSignals()` 파생 라벨, STEP02 `Dom.id`(`fan_cmd`, `fan_rpm`, `vcu_in`…), STEP03 `REF.blocks` id(`pi`, `driver`, `filter`…), STEP04 모델 id(`duty`, `pwmOut`, `fpwm`, `proc`…) + 계약 `signalId`(`coolantTemperature`, `aps`…). **같은 의미의 신호에 대응 표가 없다.** 예: STEP02 `fan_rpm`(이름 "팬 PWM 출력 어댑터")는 모델 `pwmOut`, 그런데 id 이름은 rpm |
| 파일 | 위 4곳 + `components.ts`(`Fan_PWM` 포트), `vehicleSim.ts`(`Fan_PWM` 로그) |
| 플레이어 현상 | 단계를 넘나들 때 같은 값을 다른 이름으로 마주침(예: STEP02 "팬 명령", STEP03 "PI 제어 PWM", STEP04 "PWM 출력 어댑터 값"); STEP02 id `fan_rpm`이 실제론 PWM 출력 |
| 원인 | 단계별로 따로 작성된 데이터, 공통 신호 레지스트리 없음 |
| 수정 | **데이터**: `signals` 레지스트리(id, 이름, 단위, 종류=요청/출력/피드백, 소유 SW, 모델 src, STEP02 node id, STEP03 block id)를 한 파일로 정의하고 나머지는 참조. **로직(중)**: 각 단계가 레지스트리를 읽도록 리팩터링 — 2일 내 불가 가능성 높음. 최소안: 레지스트리를 **문서/테스트용 매핑 표**로만 먼저 작성하고 불일치 검출 테스트 추가 |
| 다른 STEP | 전 STEP. 특히 STEP01 신호 태그(`flowSignals`)를 명시 필드로 대체할 때 |
| 검증 | 신규 T-M9: 매핑 표의 모든 id가 각 단계 데이터에 존재하는지, 매핑에 없는 모델 신호가 `VIEW`에 없는지 |
| 의존 | **다른 모든 M의 선행** |

---
## 4. 공통 기술 제약 · 결정 사항

| # | 내용 | 구분 |
|---|---|---|
| C1 | 일치 테스트가 STEP02 수치(`DominoTrace.tsx`)를 읽으려면 **React/JSX 없이 import 가능한 순수 데이터 모듈**이 필요하다. 현재 테스트는 이를 import하지 못해 **소스 문자열 regex**로 단정한다(`feedback-1112`, `v4-step01-layout`). 데이터 모듈 분리 없이는 M1·M4·M9의 자동 정합 테스트 불가 | [코드] / [결정] |
| C2 | 기존 테스트 중 수치·문구에 의존하는 것: `verification-contract-execution`(3), `feedback-1112`(hold/decide, 입력 조건), `v4-step01-layout`(다수 문자열). 수정 후 전체 `npm test` 필요(이번에 실행하지 않음) | [코드] |
| C3 | thermal 계약 경로에서 `tc`를 입력으로 강제해 정상 기준(ref)조차 **78.4°C에서 팬 1779 rpm을 도는 비현실적 기준**이 됨 [실측]. 건강한 차량은 레거시 경로에서 70.3 °C에서 평형. 증상 사슬(`tm`·`der`) 재현을 원하면 계약 경로의 모델 구조 변경 필요(`SCENARIO_TECHNICAL_CORRECTION_PLAN.md` T-3) | [실측] / [결정] |
| C4 | 정답·최종 원인은 어떤 M 항목도 변경하지 않는다 | 제한 준수 |

## 5. 권장 구현 순서 (제안)

| 순서 | 항목 | 규모 | 비고 |
|---|---|---|---|
| 0 | C1 결정(순수 데이터 모듈 분리 여부), M9 최소안(매핑 표) | 설계 | 모든 후속의 전제 |
| 1 | M1 + M4 + M5 데이터 정정 | 데이터 | 수치 확정 → 테스트 T-M1/M4/M5 동시 |
| 2 | M2·M3 정리, M6' 결정 반영 | 데이터 | 낮은 위험 |
| 3 | M7 판정 병기(로직 소 + UI) | 로직 소 | 판정 정의 결정 필요 |
| 4 | M8 문구 일괄 | 문구 | 마지막 |
| 5 | 전체 `npm test`, 사건×수준 12조합 표 검증 | 검증 | |

## 6. 미확인 / 후속 검증
- 전체 `npm test`와 앱 구동은 이번에 실행하지 않음. `VerificationLab.tsx:136·246`(SW 로직 뷰 `68% duty`)·`experiences.tsx:2159·2379·2448`(`100%` 표기)가 **라이브 경로인지 레거시인지** 호출 그래프를 확인하지 않음 [가설: D1_UNREACHABLE 기준 레거시 가능성].
- `CaseFileEnding` thermal 계측 막대 값과 `경고등` 문구는 이번에 재확인하지 않음 [기존: END-0071/0081].
