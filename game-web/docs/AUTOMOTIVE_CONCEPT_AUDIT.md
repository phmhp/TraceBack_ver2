# AUTOMOTIVE_CONCEPT_AUDIT — 자동차공학·시스템·E/E·SW 개념 정합성 감사

- 작성일 2026-11-13 · 기준 `contest/v2` @ `d4e9f996` · **읽기 전용**(코드·CSS·에셋·시뮬레이션·시나리오 미수정, 앱 미실행, 테스트 미실행)
- 이 문서가 재사용한 기존 조사: `content-audit-by-claude/D4_TECHNICAL_REVIEW.md`(11-10 스냅샷, T-01~T-35), `UX_AUDIT_2026-11-12.md` §6·§9, `content-audit-by-claude/C_SCENARIO_ARCHITECTURE.md`. 아래 4장에서 **현재 코드와 다시 대조**해 해소/잔존을 표시했다.
- 근거 표기: **[표준]** 공식 표준에서 확인 · **[업계]** 업계 일반 관행(표준 조문 아님) · **[교육]** 교육용 단순화 · **[게임]** 이 게임 자체 설계 · **[보류]** 원문 접근 불가/미확인(추측하지 않음) · **[코드]** 코드 직접 확인

## 1. 표준 근거 확인 현황 (정직한 한계)

| 자료 | 확인한 것 | 확인 방법 | 확인하지 못한 것 |
|---|---|---|---|
| ISO 26262-4:2018 | 7절 "System and item integration and testing"(7.4.1~7.4.4: 전략, HW-SW 통합·시험, 시스템 통합·시험, 차량 통합·시험), 8절 "Safety validation" | 공개 목차·미리보기 검색 | 본문 요구사항, 표 |
| ISO 26262-6:2018 | 9절 SW unit verification, 10절 SW integration and verification, 11절 Testing of the embedded software (11절에 시험 환경 표 존재) | 공개 목차·2차 자료 검색 | 본문, 표의 권장 수준(ASIL별) |
| Automotive SPICE PAM 4.0 (VDA QMC, 2023-11) | SWE.4 Software Unit Verification / SWE.5 Software Component Verification and Integration Verification / SWE.6 Software Verification, SYS.5 System Verification | 검색 결과의 PAM 목차 | SYS.4 정확한 공식명, 기본 실무(BP) 본문 **[보류]** |
| ISO/IEC/IEEE 29119-1:2022 | test item(4.1.4)·test basis(4.1.9)·test oracle(4.1.10) 절이 존재 | 목차 검색 | **용어 정의 원문(test case·test condition 등)** **[보류]** |
| ISO/IEC/IEEE 29119-4 (시험 설계 기법) | — | 접근 못함 | 기법 목록·정의 원문 **[보류]**. 아래 "등가 분할·경계값" 등은 [업계] |
| EARS (Mavin 외, RE'09) | 패턴: Ubiquitous / Event-driven(When) / State-driven(While) / Unwanted behaviour(If-Then) / Optional feature(Where) / Complex | 웹 요약 + 일반 지식 | 원 논문 대조(상태·선택 패턴 설명은 일반 지식) |
| INCOSE Guide to Writing Requirements v4 | 요구사항 개별 특성(필요·명확·완전·단일·실현 가능·검증 가능 등)의 일반 취지 | 일반 지식 | **원문 미열람 — 규칙 번호(R1~R42)·C번호 인용하지 않음** **[보류]** |
| AUTOSAR (Classic/Adaptive) | — | 접근 못함 | SWC·RTE·BSW·Runnable 정의 원문 **[보류]**. 게임의 "SWC"는 [교육] 차용으로 취급 |

> 이 표의 [보류]는 "틀렸다"가 아니라 "이번 감사에서 원문으로 확인하지 못했다"는 뜻이다. 구현 지시 전 사용자(또는 ChatGPT 검토)가 원문 대조할 것.

## 2. 개념 10구분 — 정의·게임 구현 위치·판정

| # | 구분 | 정의(근거 유형) | 게임에서의 위치 [코드] | 판정 |
|---|---|---|---|---|
| 1 | 자동차 기능 도메인 | E/E 아키텍처에서 기능을 도메인 제어기 단위로 묶은 분류 [업계]. `experiences.tsx:30` 주석도 "ISO 26262 용어 아님"이라 명시 | `DomainId` 7종(구동·제동·조향·전원·변속주차·열관리·현가), `DOMAIN_GROUP`(파워트레인/섀시) | 교육적 단순화로 허용. 도메인 목록이 사건 도메인과 1:1이 아님(사건은 3종) |
| 2 | 시스템·하위 시스템 | ISO 26262 Part 4의 item·system 개념은 [표준]이나 게임은 "도메인→기능(4개)"로 단순화 | `domainContent[d].functions[4]`, `featureFlows` | 기능 4개/도메인은 [게임] 설계. 하위 시스템 계층이 데이터에 명시되지 않음 |
| 3 | ECU와 SW 컴포넌트 | ECU 위에 SW가 올라가고 SW는 컴포넌트로 구성 [업계]. SWC 명칭은 AUTOSAR 유래 [보류] | `components.ts`(ECU 6·부품 28·연결 38), `RefPuzzle.SCOPE`(unit/swc), `VIEW`의 "…SWC" 이름 | 교육용 허용. SWC 이름이 사건별로 임의 구성됨(통일 규칙 없음) |
| 4 | 시스템 아키텍처 vs E/E 아키텍처 | 시스템 아키텍처=기능 배분, E/E=센서·ECU·네트워크·전원 배치 [업계] | `learningLayers`: "Vehicle/System"·"E/E Architecture"·"Control Software" | 3관점은 **[게임] 학습 렌즈**이며 표준의 3계층이 아님(주석의 "ISO 26262 abstraction"은 느슨한 대응). 4장 F-01 |
| 5 | 논리 신호 경로 vs 물리 연결 | 신호(논리)가 어떤 배선·버스로 실리는지는 별개 [업계] | E/E 렌즈에서 "APS→VCU→CAN→인버터"처럼 한 줄로 합쳐 표시 | **개선 필요**: 논리 신호(예: 토크 명령 Nm)와 물리 경로(CAN)를 구분하는 표시가 없음 |
| 6 | 제어 SW 입력·출력·상태·파라미터 | SW 단위의 I/O와 내부 상태·캘리브레이션 [업계] | `simModel.ts` 모델 함수는 4가지를 모두 가짐. 화면은 블록 이름만(STEP01) / 블록+값(STEP03) | 모델엔 있으나 **화면에 파라미터·상태가 구분되어 노출되지 않음** (`STEP01_DOMAIN_FUNCTION_AUDIT.md` 참조) |
| 7 | 요구사항·정상 동작 기준 | 요구사항은 시스템/SW가 충족해야 할 조건 [표준: ASPICE SYS.2/SWE.1 존재, 문구는 보류] | STEP02 `CASES[].req`(1줄), STEP03 `REF[].req`(7~8줄), `SCENARIO_META.normalSpec`, `BASE.expected` | 4곳에 표현이 흩어지고 서로 다름(예: thermal 100% vs 1850 rpm). STEP02_04 문서 §3 |
| 8 | 결함 위치·성격·관측 증상 | 서로 다른 개념(어디/어떤/어떻게 보임) [게임 제안: FAULT_TAXONOMY] | 현재는 `SCENARIO_META.injection/faultModel`(문자열), `CAUSES[].type/where`가 일부 구분 | 분류 축이 코드에 구조화되어 있지 않음(문자열) |
| 9 | 검증 대상·시험 수준·환경·기법 | 수준: ISO 26262-6 §9/10/11, 26262-4 §7 [표준 목차 확인]. 환경 MIL/SIL/PIL/HIL [업계]. 기법 [업계] | `LV[4]`(수준+std+env 칩), `Tech`(req/replay/boundary/soak/inject), `CASE_DERIVS` | **수준과 환경이 분리 표시되는 점은 우수**. 단 수준=같은 모델의 신호 보기(`VIEW`)이고 환경 차이는 계산되지 않음 |
| 10 | 테스트케이스·스텝·오라클·스텁 | 정의 원문은 [보류]. 업계 일반 의미 사용 | 테스트케이스≈입력 카드+계약, 스텝≈계약 `stimulus`, 오라클≈`expectedOutputs`+정상 모델, 스텁≈`VIEW.model:true` | 용어가 화면에 거의 등장하지 않아 학습 연결 약함 |

### 2.1 "3관점"이 공식 3계층인가?
아니다. [코드] `experiences.tsx:34-39` 주석은 "ISO 26262 abstraction: item → system architecture → SW architecture & unit design"이라 적지만, 이는 Part 4(시스템)·Part 6(SW) 개념에서 **착안한 교육용 렌즈**이다. 표준은 이 3개를 "계층 이름"으로 규정하지 않는다 [표준 원문 미열람이므로 단정 보류, 단 목차상 일치하는 3계층 명칭 없음]. 코드는 SW 렌즈를 내부 4행 중 1·2행(`garageLayerSource=[0,1,3]`)만 사용해 "SW 아키텍처" 행을 건너뛴다(주석에 명시). 화면 문구에서 "표준 3계층"으로 서술하지 않도록 권장(필수).

## 3. 정합성 높은 부분 (유지 권장)
- 결함 주입이 **SW 경계 안**이고 하류로 전파된다(propulsion `proc×.45` 이후 맵·MIN·램프를 통과, thermal `pwmOut` 쓰기 생략, brake `cmdOut ×.19`) [코드 `simModel.ts:47/74/92`].
- 시험 **수준**(무엇을 검증)과 **환경**(어디서 실행)을 별개 축으로 둔 점(`simModel.ts` 헤더, `LV[].env`) [게임, 업계 관행과 부합].
- 요구사항 판정(`assessContractRun`: PASS/FAIL/INCONCLUSIVE)과 가설 판정(`judgeRun`: 지지/반박/보류)이 코드에서 분리됨 [코드].
- 재현성: 난수·시계 없음, dt 5 ms 고정 [UX_AUDIT §9.4(7), 이번에 재실행하지 않음].

## 4. 기존 지적(T-xx) 현재 코드 재대조

| 기존 ID | 11-10 지적 | 현재(contest/v2) | 상태 |
|---|---|---|---|
| T-01 | thermal: STEP02 `fan_pwm` 정상 100% vs 모델 `fpwm=pwmOut=0` | `DominoTrace.tsx` `OK("fan_pwm",…,100)` 그대로, `simModel VIEW.thermal.vehicle fpwm src:pwmOut`, 규칙 `fpwm: lower` 그대로 | **잔존(높음)** |
| T-03 | brake 72 km/h vs 모델 50 km/h, 정지거리 32 m | 모델은 이제 계약의 `vehicleSpeed`(72)를 사용(`initialValue`). 그러나 STEP02 `stop` ref **32 m / run 58 m**는 그대로. 72 km/h(20 m/s)·3.2 m/s²이면 v²/2a = **약 62.5 m**(손계산) | **잔존(모순이 오히려 노출)** |
| T-03b(신규) | brake 계약 "정지까지 동일 시간축" | `durationSeconds:3` 고정. 20 m/s에서 3.2 m/s² 정지에는 약 6.3 s(손계산) 필요 | **신규** |
| T-04 | brake 램프 0.6 s·SOC·ABS | 램프는 `rampInput`으로 계약 값(0.6 s) 사용 → **해소**. `batterySoc`·`absActive`는 `initial`에만 있고 모델이 읽지 않음 | 램프 해소 / 미모델 전제 잔존 |
| T-05 | thermal 냉각수 62 vs 64, 정차 vs 고속 | `initial` 62를 읽지만 `execution` 있으면 `s.tc = rampInput`(65.1~78.4)으로 덮어씀 → 초기값은 무의미. `vehicleSpeed 0`도 미사용 | 부분 해소 / 미모델 전제 잔존 |
| T-06 | thermal 시간축 "8분(압축)" | `TIME.thermal=[8,"분(압축)"]` 그대로, 계약은 "0~8 s", STEP02 `timeUnit:"초"` | **잔존** |
| T-07 | propulsion 0.3 s 램프 vs 계단 | `INPUT_EXEC.reqa`가 `rampSeconds:0`(계단)으로 덮음, 표시는 `inputSequenceText`가 실행 계약에서 생성 | 표시 해소 / `BASE.stimulus.sequence` 문자열은 잔존 [어디에 표시되는지 미확인] |
| T-08 | thermal 정상 기준: "100%" vs PI 목표 1850 rpm / 듀티 ≈68% | STEP02 `req`="65°C 넘으면 팬 100%", STEP03 `req`="1850 rpm 목표 PWM 조절"·`pi.out:"PWM 68%"`, 증거 문구 "Fan PWM 명령 100%"(`scenarios.ts:42`). 모델: 팬 요청(ON)=100, PI 듀티 ≈65% | **잔존(높음)** |
| T-09 | thermal `fan_path` 반박 근거가 STEP02에 없음 | `SCENARIO_META` `fan_path`에 `stage1` 없음, 그대로 | 잔존 |
| T-19 | propulsion 결함 위치 표현 불일치(필터 뒤/맵 앞/맵 값) | STEP02 `vcu_in` "페달 처리값 27%", STEP03 `field.filter:"27% (×0.45)"`·함정 `mapB`(표 B), 모델 `proc=filt×.45`. 그대로 | 잔존(중간) |
| T-22/23 | 오답 수리는 시뮬레이션되지 않고 `why`만 표시, 부작용 주장 미검증 | `FIXES` 문구("새 고장이 생겨!" 등) 그대로, 오답 수리를 모델에 넣는 코드 없음 | **잔존(높음)** |
| T-24 | 계약이 STEP04 입력을 구동하지 않음 | `simulate(…, execution)`(1509·1512행)로 **구동하도록 변경됨**. 단 STEP03 퍼즐 배치·슬라이더는 여전히 계약에 영향 없음(UX_AUDIT §9.3) | **부분 해소** |
| T-32 | 정답 키 이중화(`root` vs `truth`) | `scenarios.ts` 그대로(`gateway`/`vcu_sw` 등) | 잔존 |
| T-33/34 | 반말·감탄 | `FIXES.why` "…생겨!", "…손상돼." 그대로 | 잔존(낮음) |
| T-35 | `LV[].std` 절 번호 노출 | 그대로. **이번 확인: 26262-6 §9/10/11, 26262-4 §7은 공개 목차와 일치**(본문 미열람) | 절 번호 정확성 우려는 **완화**, 표시 정책 문제만 잔존 |
| T-25 | STEP02 완료 시 가설을 정답 id로 자동 설정 | `EeTrace.tsx:401` `if (state.hypothesis[caseId] !== scenario.root) send(SELECT_HYPOTHESIS root)` 그대로(플레이어가 `carryId`를 고른 경우 :187은 별도) | **잔존(중간)** — "선택한 가설을 시험 대상으로 전달"하는 구조와 상충 |
| T-26·T-10 | 전 신호 관측·84°C | **이번에 재확인하지 않음** | [미재확인] |

## 5. 신규 발견 (이번 감사)

| ID | 내용 | 근거 | 심각도 |
|---|---|---|---|
| F-01 | **STEP03 thermal 퍼즐이 결함을 HW 쪽에 둔 것처럼 보임.** 현장값 `field.pi:"PWM 100%"`, `driver:"PWM 100% · 12V"`, `fan:"0 rpm"` → "PWM·12V는 정상 출력인데 팬만 0 rpm"으로 읽힌다. 실제 결함은 "PWM 쓰기 생략(출력 0%)"이며 SW-only 정책과도 어긋남. 또 출력단 블록 `driver`가 `kind:"hw", ee:true`로 SW 출력 어댑터와 구분되지 않음 | `RefPuzzle.tsx` thermal `blocks.driver`/`field` vs `simModel.ts:74` | **높음** |
| F-02 | brake 퍼즐 함정(표 B "2.1 m/s²→8 bar")은 **LUT 값 오류**(파라미터), 실제 결함은 LUT 뒤 **I/O 어댑터 ×0.19**(스케일링). 관측값(8 bar)은 같지만 결함 위치·성격이 다름 | `RefPuzzle.tsx` brake `pressB` vs `simModel.ts:92` | 중간 |
| F-03 | thermal 열 사슬 미재현(팬 정지 → 온도 상승 → 출력 제한): 계약 경로에서 냉각수를 입력 곡선으로 고정 | UX_AUDIT §9.4(10)-3(재확인 아님, 코드 `simModel.ts:65` 대조 일치) | 중간 |
| F-04 | **진단 반응 부재**: STEP01은 열관리에 "무응답 진단", 구동 등에 "고장 래치·진단 폴백"을 가르치지만 사건의 SW 결함은 진단되지 않으며 모델의 `diag`는 0 상수. "왜 ECU가 스스로 못 잡았나"를 학습할 수 없음 | `featureFlows.thermal[1]`, `simModel.ts:79 diag:0` | 중간(교육 완결성) |
| F-05 | STEP02 `fan_cmd` "팬 명령 100%"는 모델에서 **히스테리시스 ON 플래그(`fanReq`)**이고 PI 듀티는 ≈65%. 증거 문구는 "Fan PWM 명령 100%"로 합쳐 표기. 요청(ON/OFF)과 PWM 듀티가 학습자에게 구분되지 않음 | `scenarios.ts:42`, `simModel.ts:79` | 높음(T-08과 동일 근원) |
| F-06 | `Tech`에 `"inject"`가 선언돼 있으나 `CASE_DERIVS`에서 쓰이지 않음. `vehicleSim.ts`는 런타임 미사용(테스트 전용)이며 모델 상수가 `simModel`과 불일치(T-13~15) | `simModel.ts:12`, D4 | 낮음 |

## 6. 초보자 오해 위험 개념

| 개념 | 오해 | 현재 표현 | 권장 |
|---|---|---|---|
| 요청 vs 출력 | "팬 100%"를 PWM 출력으로 오해 | 한 카드에 병기 | 요청(Request)·출력(Output)·피드백을 항상 별도 신호로 |
| 시험 수준 vs 환경 | "HIL=시스템 통합"으로 혼동 | 수준 탭 + 환경 칩 | 유지(우수). "수준은 무엇을, 환경은 어디서" 한 줄 설명 |
| 요구사항 판정 vs 가설 판정 | "INCONCLUSIVE인데 왜 지지?" | 화면 혼재(UX_AUDIT §6.3-2) | 두 판정을 별도 칸으로 |
| 정상 모델 비교 = 요구사항 충족 | 오라클이 모델 출력에서 나옴 | `contractForInput` | 오라클 종류를 표시(식/골든 모델) |
| "시뮬레이션" | 3D 연출을 계산 결과로 오해 | 3D는 `works` 불리언 구동 | "교육용 수치 모델 + 규칙 기반 판정" 표기 |

## 7. 미확인·보류
- 표준 원문 대조 전부(1장 [보류]) · 모델 실행 재검증 없음(손계산만) · STEP01 용어·단위 전수 검수 · 레거시 콘텐츠 · `PREDICT`·본문 해설 문구의 기술 검수는 `content-audit-by-claude/D1_*`에서 이어서.
