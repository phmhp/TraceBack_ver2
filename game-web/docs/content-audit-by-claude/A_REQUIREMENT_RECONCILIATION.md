# A. 최종 요구사항 대조 (읽기 전용 조사)

- 조사일: 2026-11-10 / 대상: `TEMP` 폴더만 / HEAD: `d385764 fix: reorganize step02 evidence board`
- 방식: SSOT(`docs/REQUIREMENT_TRACEABILITY_FINAL_2026-11-10.md`, 654줄 전체 읽음)를 기준으로, 소스 검색·부분 읽기로 코드 존재 여부 확인. **실행·브라우저·테스트는 수행하지 않음.**
- 상태 표기: `[코드상 구현 확인]` `[부분 구현]` `[미구현]` `[실행 검증 대기]` `[설계안]` `[미확인]` `[대체/제외]`
- 근거 구분: **코드확인** = 이번에 소스에서 직접 확인 / **SSOT기재** = SSOT·IMPLEMENTATION_STATUS 기록을 그대로 인용(이번 조사에서 코드 재확인 안 함).
- 화면 명칭 매핑: STEP01=차고지(GARAGE_L1~L3) · 주행=DRIVE_BRIEFING/CHASE_* · STEP02=BOARD(원인 역추적, `EeTraceV2`) · STEP03=WIRING(`RefPuzzle`) · STEP04=TWIN_BENCH(`TwinBenchExperience`) · 이후 REPAIR → CHASE_RESUME → SHIP_ESCAPE → ENDING.

---

## A1. SSOT 활성 요구사항 상태 대조

SSOT 구조: PART A~L(원문 보존) + PART M(M-01~13) + 구현 증분 로그(N-01/02, P0-A/B, P1-A/B, K-4.x, FB-P0-01~04, UI-RULE-01, FB-P1-01~07, FB-P2-01~06, L-2.x).
같은 상태·같은 근거인 행은 범위로 묶었다.

### A-1. PART A~F

| ID | 상태 | 근거 | 비고 |
|---|---|---|---|
| A-1.1~1.7 | 분류 비대상(운영·변경통제 규칙) | git 이력 | 코드 상태가 아니라 작업 규칙. 단 A-1.4(삭제 금지)는 미사용 레거시 컴포넌트 다수 보존(`main.tsx` 구 Race/Board/Optional 등)으로 준수 확인 |
| A-2.1~2.3 (세 관점 외부 프레임 동일) | [코드상 구현 확인] [실행 검증 대기] | 코드확인: `GarageExperience` 단일 컴포넌트 + `.garageV2`; 테스트 `v4-step01-layout.test.mjs`("one stable frame") 존재 | Chrome bbox QA는 SSOT기재 |
| A-2.4 (범위 가이드, 표준 포함 계층 단정 금지) | [설계안] | 문서만 | 코드 문구 전수 미확인 |
| A-2.5 (도미노 중앙·우측 증거·압정/실) | [부분 구현] | SSOT기재: "자유 실 연결 확장 대기" | 현재 STEP02 레이아웃은 FB-P0-01로 재배치됨(A3 참조) |
| A-2.6 (버튼 토큰·고정 슬롯·번호) | [부분 구현] | 코드확인: `INPUT_MISSION: Record<DomainId,…>`(experiences.tsx:1126), `garageStepControls` | 타 도메인 직접 조작 범위는 FB-P1-01 잔여 |
| A-2.7 (OFF 시작·조건 후 순차 활성) | [부분 구현] | 코드확인: 7개 도메인 `INPUT_MISSION`; SSOT기재: 대표 구동 경로만 완료(K-4.5) | |
| A-2.8 (배선 포트 앵커·부품 위치/각도) | [미구현] | SSOT기재 P2 | FB-P2-01, L-2.x |
| A-2.9 (E/E 보기 탭 **좌측 상단**) | [대체/제외] ← **충돌** | FB-P1-02: `E/E 보기`를 **본문 우측 상단**으로 이동 | A3 충돌 #1 |
| A-2.10 (기존 4탭·단일 검증 화면·9단계 흐름) | [부분 구현] | 코드확인: `viewTab = sw|ecu|plant|graph` | 9단계 중 "관찰 신호 선택" 단계가 현재 live STEP04에 없음(C7 참조) |
| A-2.11 (동적 시간 결과·임베디드=환경) | [코드상 구현 확인] | 코드확인: `simModel.ts` 레벨 4종, `LV[].env` 칩, `observe()` PASS/FAIL/INCONCLUSIVE | |
| A-2.12 (초보자 맥락·30~60초 루프) | [실행 검증 대기] | `StageIntro`, 질문 카드 존재 | 체감 검증은 사람 QA 필요 |
| B-1 (줌 비유 문구) | [설계안] | | **충돌**: CLAUDE.md "비유 표현 금지(객관적 서술)" (A2 참조) |
| B-2, B-3 | [코드상 구현 확인] [실행 검증 대기] | A-2.1~2.3과 동일 | |
| B-4.1~4.3 | [부분 구현] | SSOT기재: 대표 구동만 | |
| B-4.4, B-5 (포트 좌표·논리/실제/겹침 공유 모델) | [미구현](P2) | FB-P1-02로 `eeLayer`(연결·겹쳐·실제 부품) 토글만 구현 | 포트 좌표 정밀화는 P2 |
| B-6 (3열 도미노 + 하단 메모판) | [부분 구현] | SSOT기재 | FB-P0-01로 대체 재배치(A3) |
| B-7.1~7.4 (표준 근거·한계·레이아웃) | [설계안]→[부분 구현] | 코드확인: `LV[].std`("26262-6 · 9절" 등) | 표준 인용 문구 전수 검토 미실시 |
| B-8 (9단계 추리 흐름) | [부분 구현] | live STEP04는 질문→시험선택→입력→실행→답→수리→재시험 | "단계 3 관찰 신호 선택" 부재 |
| B-9 (첫 사건 튜토리얼·오픈북·재시도) | [부분 구현] | 코드확인: `StageIntro`(experiences/EeTrace/Lab/RefPuzzle), `OpenBookButton`, 루트 `data-coach`(EeTrace:200/374, Lab:1464) | STEP01 `data-coach` 없음 |
| C-1~C-5 | [대체/제외] | H-1이 시간 제한 철회 | |
| D-1~D-4 (QA 기준) | [실행 검증 대기] | SSOT기재 | Windows Chrome 전체화면 기준은 L-9.3으로 변경됨(미검증) |
| E-1~E-9 (산출물 9종) | [코드상 구현 확인](파일 존재) | 코드확인: `docs/V4_DESIGN_2026-11-09/`에 MAP·SHARED_ABSTRACTION·VEHICLE_STATE·EE_PHYSICAL·DOMINO_RIGHT·VERIFICATION_LEVELS·HALF_DAY·REQUIREMENT_TRACEABILITY·APPROVAL_SUMMARY 존재 | 문서 대상(코드 아님) |
| F-1~3, J-1~3 (표준 근거) | [설계안] | `STANDARD_TRACEABILITY_MATRIX.md` 존재 | **충돌**: J-3 "교육 단순화 표시" vs CLAUDE.md "교육용 단순화 문구 금지" |

### A-2. PART G~K

| ID | 상태 | 근거 | 비고 |
|---|---|---|---|
| G-0~G-17 (보존 부록) | [대체/제외](K·H로 승계) | SSOT 표 | G-15 팝업 원문은 "구현 전 카피 승인" 필요 → 원문 추출은 D 작업 |
| H-1.1~1.9, H-2.x, H-11, H-12 | 분류 비대상(운영) / H-12는 [코드상 구현 확인](문서 존재) | | |
| H-3.1~3.16 (교육 원칙) | [부분 구현] | 설계 문서 + StageIntro/말풍선 | 전수 UI 검수 미실시 |
| H-4.1~4.6 (독립 HW 검증 제외) | [대체/제외] 확정 | 코드확인: `LV`에 HW 전용 레벨 없음 | |
| H-5.A~H (시험 구성) | [부분 구현] | `CASE_DERIVS`(사건당 2~3개 입력), `judgeRun`, 수리·재시험 | "경계값·조건 조합·지연 주입"은 사건별 1~2종만 존재(C7) |
| H-6.1~6.4, I-1~5 | [설계안]→[부분 구현] | 코드확인: `Tech = req|replay|boundary|soak|inject`, `Deriv = reqa|equiv|guess|bound|usecase`(equiv·guess는 CASE_DERIVS에서 미사용) | |
| H-7.1~7.8 (한 번에 하나씩 공개) | [부분 구현] | live STEP04 `phase = pick/lab/report/retest/done` | |
| H-8.1 (시나리오 비하드코딩) | [부분 구현] | `SCENARIO_META` 레지스트리 있으나 화면 데이터가 파일마다 `Record<CaseId,…>`로 분산(C8) | |
| H-8.2~8.7 (10종 구조·스키마·검증기·재현 테스트) | [부분 구현] | 사건 **3종**만; `SCENARIO_DATA_SCHEMA.md`(설계)·검증기 코드 **[미확인: 검증기 구현 없음]**; 재현 테스트는 `sim.test.mjs`(vehicleSim) 한정 | |
| H-9, H-10 | [실행 검증 대기]/[미구현] | H-10.3 "방향 애니메이션·기계적 전환" 구현 대기 | |
| H-13.1~15 (최종 수락) | [부분 구현] | | |
| K-1~K-2 (표준 구분·레벨 설명) | [설계안]→[코드상 구현 확인] | `LV[]` 4레벨 name/std/scope | |
| K-3 (4단계 유지) | [코드상 구현 확인] | App 라우팅 | |
| K-4.1/4.3/4.4/4.5 | [부분 구현][실행 검증 대기] | SSOT기재(공통 `activeStep`) | 타 도메인 값·용어 전수 미검토 |
| K-4.2 (3D 직접 조작) | [부분 구현] | SSOT기재 FB-P1-01 | |
| K-5.1~5.4 (도미노 수락) | [부분 구현] | 코드확인: `EeTraceV2` 존재; 자유 실 연결 확장 대기(SSOT기재) | |
| K-6.1~6.5 (STEP03→04 계약) | [코드상 구현 확인] | 코드확인: `buildVerificationContract`, `contractStorageKey`, `RefPuzzle`가 `tb-verification-contract-<case>` 저장(RefPuzzle:553-554), STEP04가 소비(Lab:1342) | 사건 3종 한정 |
| K-7.1~7.7 (시뮬레이션) | [코드상 구현 확인](K-7.7)/[부분 구현](K-7.6.x) | 코드확인: `Verdict = PASS|FAIL|INCONCLUSIVE`, `ANSWER_KO`, `observe()` | |
| K-8, K-9 | 분류 비대상 / 문서 존재 | | |
| K-10.1~14 | [부분 구현] | SSOT기재 | |

### A-3. PART L

| ID | 상태 | 근거 | 비고 |
|---|---|---|---|
| L-0.1~0.3, L-10.1 | 분류 비대상(운영) | | |
| L-1.1~1.3 | [대체/제외](우선순위 규칙) | | L-1.3 P2 분류 확정 |
| L-2.1~2.4 | [미구현](P2) | SSOT기재 | FB-P2-01 |
| L-3.1~3.3 (SW-only 근본 원인) | [코드상 구현 확인](3사건) | 코드확인: `SCENARIO_META.injection`(PWM 출력 누락·압력 이중 스케일·보정 계수), `vehicleSim.FaultSet` 3 훅 | 레거시 id·가설 잔존(C9) |
| L-4.1 (E/E Viewer 재사용) | [코드상 구현 확인] | `EeTraceV2` | |
| L-4.2 (관찰/의심 분리·Hover 정상·이상·STACK) | [부분 구현] | SSOT기재: Hover 정상·이상, STACK 세부 대기 | |
| L-4.3 (경쟁 가설 유지) | [코드상 구현 확인] | 코드확인: `hypothesisStatus()`, `judgeRun()` | |
| L-5.1 (단계 목적 분리) | [부분 구현] | | |
| L-5.2 (입력·관찰·정상/고장·시간축·최초 편차·경쟁 가설·추가 시험) | [부분 구현] | 코드확인: `OverlayGraph`, `divergeIndex/firstMismatch` | "추가 시험 방향성"은 SSOT기재 대기 |
| L-5.3, L-5.4 | [코드상 구현 확인] | `answers` Answer 3값 + `lastRun.verdict` 분리 | |
| L-6.1, L-6.2 (단계 클릭 이동·해금) | [코드상 구현 확인] | 코드확인: `journeyStageAccess`, `NAV_STAGE`, `investigationProgress`(runtime.ts) | [실행 검증 대기] |
| L-6.3 (단계 내부 위치·답·조건 보존) | [부분 구현] | 코드확인: STEP02/03/04는 `sessionStorage` 진행 키(`tb-step…`, EeTrace:51/72, RefPuzzle:444/470, Lab:1350/1389). **STEP01(`GarageExperience`)·주행은 `useState`만 — 보존 없음** | SSOT는 "구현 대기" 표기. 상태 키 목록은 B_PLAY_FLOW_INDEX B2 |
| L-7.1 (말풍선 튜토리얼 순차·다시 보기) | [부분 구현] | `StageIntro`(id별 1회 `localStorage` 닫힘 저장, Verdict.tsx:27) | 다시 보기 UI는 오픈북 한정 |
| L-7.2, L-7.3 | [부분 구현] / [미구현](강제·자유 구분 전수 QA) | | |
| L-8.1, L-8.2 | [미구현](P1) / 준수 | SSOT기재 | |
| L-9.1~9.3 (스크롤·줄바꿈·QA 기준) | [부분 구현][실행 검증 대기] | CSS `overflow:hidden` 등 | L-9.3 Windows Chrome 전체화면 재검증 필요 |

### A-4. PART M (M-01~13)

| ID | 상태 | 근거 |
|---|---|---|
| M-01 전체보기 기본 | [코드상 구현 확인] [실행 검증 대기] | 코드확인: `chosen` state·`showAllDomains`(experiences.tsx:925-928) |
| M-02 증거 3열·무스크롤 | [코드상 구현 확인](SSOT: 6장 3×2) [실행 검증 대기] | `EeTraceV2` `evidencePage`. **FB-P0-01로 재배치되어 현재 형태 불명 — A3 충돌 #2** |
| M-03 재생 팝업 제외·역추적 방향 | [부분 구현] | SSOT기재 `DominoFall` 제거·정적 요약. 코드 재확인 안 함 |
| M-04 퍼즐 확대/축소/맞춤 | [부분 구현] | 코드확인: `RefPuzzle`에 ResizeObserver 자동 맞춤(`fit`, :190-192)·"맞춤" 문자열 2건. `+/−` 버튼·팬 동작 **[실행 검증 필요]** |
| M-05 STEP03/04 동일 로직 | [코드상 구현 확인] | `RefPuzzleTrack`(RefPuzzle:666) 공용, 동일 `REF` |
| M-06 설계서 영수증 출력 | [코드상 구현 확인] | `VerificationContract` → 명세서 에셋(`verification-spec-sheet.png`), FB-P1-05로 "영수증 슬라이드"는 **고정 종이+텍스트 출력**으로 변경(원문 대비 변경) |
| M-07 STEP04 스크롤 0 | [실행 검증 대기] | `overflow:hidden`(SSOT기재) |
| M-08 한 행동씩 안내 | [부분 구현] | live `phase` 구조 |
| M-09 탭별 한 줄 의문형 목표 | [미확인] | 의문형 문구는 `QUESTIONS`/`PREDICT`에서 확인했으나 **탭별 목표 문구 위치는 이번 조사에서 미확인**(V7 쪽에 있을 가능성) |
| M-10 모니터링(3종 시각화) | [부분 구현] | 코드확인: 탭 이름 "모니터링"(Lab). 연속값 선그래프(`OverlayGraph`)만 확인; **상태 계단/통신 이벤트 타임라인은 코드 미확인**(SSOT: 통신 이벤트 데이터 없음 → 의도적 미생성) |
| M-11 결과·판단·조치·재시험 | [코드상 구현 확인] | `answer()`/`pickFix()`/`phase retest` |
| M-12 3:4 캔버스 | [부분 구현] | 코드확인: CSS `aspect-ratio: 3 / 4`(p0-v20.css, p4-fix-1109.css). SSOT기재: **≤1054px에서만** 적용. 전체화면(L-9.3 기준) 적용 여부 [실행 검증 필요] |
| M-13 원문 보존 | [코드상 구현 확인](문서) | SSOT PART A~M 공존 |

### A-5. 구현 증분 로그 항목

| ID | 상태 | 근거 |
|---|---|---|
| N-01 풀이 상태 보존·다시 풀기 | [코드상 구현 확인][실행 검증 대기] | `ReplayConfirm`, `tb-step` 키 정리(main.tsx:122-125) |
| N-02 명세서 에셋 | [코드상 구현 확인] | `public/assets/ui/verification-spec-sheet.png`(git status에 untracked 표시 — **커밋 대기**) |
| P0-A 새 게임 초기화 | [코드상 구현 확인] | main.tsx:119-127 (`tb-step`·`tb-impact-`·`tb-section-`·`tb-expect-`·`tb-verification-contract-`·`tb-intro-` 삭제 + save 삭제) |
| P0-B 수리·주행 복귀 | [코드상 구현 확인] | `finish → BENCH_RESULT → REPAIR → APPLY_REPAIR → CHASE_RESUME` |
| P1-A 추격 동결 | [코드상 구현 확인] | `TICK_PURSUIT` 0.08 m/s, `pursuitScenes`(main.tsx:138) |
| P1-B WANTED 분석 보고서 | [코드상 구현 확인] | `CaseFileEnding.tsx`가 `SCENARIO_META` 사용(테스트 v5-flow:35) |
| FB-P0-01 STEP02 재배치 | [코드상 구현 확인][실행 검증 대기] | 커밋 `d385764` |
| FB-P0-02~04 | [코드상 구현 확인][실행 검증 대기] | 380 ms 길게 누르기(experiences.tsx `beginInputHold`) |
| UI-RULE-01 | [부분 구현] | 코드확인: **`folder`/탭 관련 클래스는 CSS 주석 1건(p4-fix-1109.css:677)뿐**. `GameHeader`는 단일 `.gameHeader`. 10/30/40/20 헤더 분할·`이전|다음` 폴더 탭·하단 80/20은 STEP02 일부만 — SSOT와 일치 |
| FB-P1-01 | [부분 구현] | SSOT기재 |
| FB-P1-02, 03 | [코드상 구현 확인][실행 검증 대기] | `eeLayer` 공유 상태, `garageStepControls` |
| FB-P1-04 주행 HUD | [코드상 구현 확인][실행 검증 대기] | `raceTopHud` |
| FB-P1-05 설계서 표시명·확정 도장 | [코드상 구현 확인][실행 검증 대기] | |
| FB-P1-06 WANTED 2사건 | [코드상 구현 확인][실행 검증 대기] | 코드확인: `REQUIRED_CASES=["propulsion","thermal"]`(CaseFileEnding:229), `page`/`typed` state, `pageLabel`("CASE 1/2"·"최종 결과", :277) |
| FB-P1-07 동일 조건 기준선 비교 | [코드상 구현 확인] | `pickFix → phase retest(level vehicle)`; 단, **수리 후 결과는 `simulate(…, fixed=true)`로 결함 플래그만 제거(C6)** |
| FB-P2-01 | [미구현](등록·구현 금지) | |
| FB-P2-02 (정차 중 발생 트리거) | [미구현] | `docs/FAULT_SCENARIOS_2026-11-09.md` 후보 4절과 연결 |
| FB-P2-03 (BGM 전환·효과) | [부분 구현] | 코드확인: `setMusicScene("race"|"calm")`(main.tsx:150); 카운트다운·결과 음악 등은 [미구현] |
| FB-P2-04 (피니시/체포 연출 5초 CAUGHT!/FINISH!) | [미구현] | |
| FB-P2-05, 06 | [미구현] | |

---

## A2. 프롬프트 요청 대화 기록 대조

**제공 자료 상태: [자료 없음]** — 사용자가 말한 "프롬프트 요청 대화 기록"은 이 세션·`TEMP`에 별도 파일로 존재하지 않는다.
확인된 관련 자료는 다음뿐이다(대화 기록 아님, 추측하지 않음):

| 자료 | 위치 | 상태 |
|---|---|---|
| V4 마스터 프롬프트 원문 | `C:\Users\user\Downloads\TraceBack_V4_…Codex프롬프트.md` (3204줄, SHA-256 `AEFB1442…C72E`) | **TEMP 밖 — 이번 범위에서 접근하지 않음**. 제목 인덱스만 `V4_DESIGN_2026-11-09/SOURCE_PROMPT_MANIFEST.md`에 있음 |
| Claude 설계검토 마스터프롬프트 | `docs/TraceBack_Claude_설계검토_마스터프롬프트.md` | 이번 조사에서 미열람(과거 프롬프트) |
| 사용자 원칙 요약 | `CLAUDE.md` | 읽음 — 아래 대조 |
| 이번 조사 지시문 | 이 세션 | 범위 정의 |

CLAUDE.md에서 추출한 요구 ↔ SSOT 대조:

| 요구(출처) | SSOT 반영 | 비고 |
|---|---|---|
| 이모지 금지·직접 만든 에셋(CLAUDE.md) | SSOT 미반영 | UI 규칙으로 SSOT에 없음. 코드: `Icon.tsx` 사용. **⚠ 코드 검색 없이 확정 불가** → [미확인]: 화면 문자열에 이모지 잔존 여부 |
| 해요체/합니다체, 감탄·유아어 금지(CLAUDE.md 라운드 15·20) | SSOT 미반영 | 현재 `FaultDialogue` 대사 `"…왜이러지?"`, `"내가 바로 고쳐볼게!"`, FIXES.why `"…새 고장이 생겨!"`, `"끄면 모터가 손상돼."`는 반말·감탄 → **기존 요구와 코드 충돌 후보** |
| "교육용 단순화/실제 모델 아님/실제 장비 연동 아님" 문구 금지(CLAUDE.md 라운드 20, 사용자 지시) | **기존 요구와 충돌**: J-3 "교육 단순화 표시", M-6.2 "모델 예측과 실제 계측을 구분" | 어느 쪽이 최신인지 사용자 확인 필요 |
| 비유 표현 금지·객관적 서술(CLAUDE.md 라운드 18) | **충돌**: B-1 "교육용 줌 비유" | `docs`의 "도미노" 은유는 게임 정체성이라 별개로 보임 — 확인 필요 |
| 숫자 직접 입력 금지(고르기·끌기만) | SSOT 미반영 | 현재 슬라이더·버튼 중심으로 일치 |
| 단계 순서: 도미노→퍼즐→벤치, 오답 분기 없음(VERIFICATION_FLOW_STANDARD) | 반영(K-3) | |
| 커밋: 박혜민, 단계마다 커밋, push는 요청 시(CLAUDE.md) | SSOT H-2와 일치 | |
| QA 해상도 | SSOT: 1054×723 → L-9.3 Windows Chrome 전체화면 | CLAUDE.md는 해상도 언급 없음 |

| 구분 | 건수/항목 |
|---|---|
| SSOT에 이미 반영 | 단계 순서, 커밋 규칙 |
| SSOT 미반영 | 이모지 금지, 말투 규칙, 숫자 직접 입력 금지 (3) |
| 기존 요구와 충돌 | "교육 단순화 문구" 금지 vs J-3/M-6.2, "비유 금지" vs B-1 (2) |
| 프롬프트 작성만 요청한 제안 | [자료 없음] |
| Codex/Claude 전달·승인 여부 미확인 | **전부 [미확인]** — 대화 기록 자체가 없음 |

---

## A3. 최신 UI 충돌·대체 관계 (원문 보존, 관계만 기록)

| # | 대상 | 관계 | 내용 |
|---|---|---|---|
| 1 | A-2.9 ↔ FB-P1-02 | **대체(최신 우선 추정)** | 원문 "E/E 보기 탭은 좌측 상단" → FB-P1-02 "본문 우측 상단 `E/E 보기`" |
| 2 | M-02 ↔ FB-P0-01 | **충돌 가능** | M-02: 우측 사건/증거 **3열 카드·6장 슬롯·묶음 교체**. FB-P0-01: 우측 **폴더 탭(증거/추리 보드)**, "중복 축소 카드 없음·실제 획득한 폴라로이드만". 테스트는 둘 다 존재(`v4-step01-layout` "M-01 through M-06 … fixed evidence slots" / "FB-P0-01 … folder-tabbed"). 현재 실제 화면이 어느 쪽인지 **[실행 검증 필요]** |
| 3 | UI-RULE-01 ↔ L-6.1 JourneyProgress | **중복 가능** | 단계 이동 수단 3종: ① 우측 상단 `journeyRail`(클릭 이동, L-6.1) ② `stageHistoryNav`(`NAV_BACK/FORWARD` 이전/다음 버튼, main.tsx:1502) ③ UI-RULE-01 폴더형 `이전|다음` 탭(미구현). ②와 ③이 동일 기능 |
| 4 | UI-RULE-01 하단 80/20 ↔ 기존 "하단 우측 진행 슬롯 1개" | 확장 | 테스트 "STEP02 through STEP04 reserve one bottom-right progression slot" 존재 → 80/20 재배치 시 테스트 수정 필요 |
| 5 | UI-RULE-01 "본문 남은 높이 최대" ↔ M-12 "3:4 상호작용 박스" | **충돌 가능** | 높이 최대 vs 폭:높이 3:4 고정. M-8 자체가 "비율과 무스크롤 동시 만족 QA" 명시 |
| 6 | M-07/L-9.1 무스크롤 ↔ A-2.5/B-6/K-5.2 "우측 독립 스크롤" | **대체(M 우선)** | SSOT M 충돌 해결 #1에 명시. 현재 FB-P0-01 문구에는 "우측 286px 독립 스크롤"(K-5.2 상태 칸)이 남아 있음 |
| 7 | FB-P1-05 ↔ M-06 | **변경** | M-06 "찌지직 영수증 슬라이드" → FB-P1-05 "종이 에셋 고정, 텍스트만 순차 출력, 도장 확정" |
| 8 | FB-P1-07 ↔ B-8/M-6.4 장면 7 | **부분 대체** | M-6.4 "차량 전체 회귀 주행" + 영향 목록 ↔ FB-P1-07 "별도 자동 회귀 목록 제거, 같은 STEP03 조건 기준선 비교". 코드에는 STEP04 내 `regression` 배열(Lab:882, `tb-impact-`)과 레이스 `regressionCard`가 **둘 다 남아 있음** |
| 9 | FB-P1-06 ↔ G/엔딩 원문 | 변경 | WANTED 2사건 페이지, 3번째 사건 데이터 보존 |
| 10 | L-6.1 ↔ UI-RULE-01 "프롤로그·차량 원리는 추리 진입 후 잠금" | 일치 | `journeyStageAccess`가 구현 |
| 11 | L-9.3 ↔ D-4 | **대체** | QA 기준 1054×723 → Windows Chrome 전체화면. 기존 QA 결과는 최종 완료 근거 아님 |
| 12 | L-3 SW-only ↔ SCENARIOS.hypotheses | **부분 충돌** | `SCENARIOS`(scenarios.ts)에 HW 가설 잔존(`aps_sensor`, `bms`, `motor`, `sensor`) + 레거시 `root` id(`gateway`/`fan_actuator`/`brake_actuator`). 반박용 오답 후보로는 SSOT M 충돌 #5·L-3.3과 양립 가능하나 **정답 키가 두 레지스트리에 이중화** |

---

## A4. 화면별 변경 예정 (SSOT 미완료 항목 기준)

| 화면 | 앞으로 바뀔 항목 | 근거 ID |
|---|---|---|
| 인트로(Title·Prologue) | 요구 거의 없음. BGM(준비 화면 유지), 새 게임 초기화 UX, 말투 점검 | FB-P2-03, P0-A, [CLAUDE.md 말투] |
| STEP01 차고 | 공통 폴더 프레임·소제목 2줄·하단 80/20, 타 도메인 직접 조작·액추에이터, 용어·단위 전수, 3D 크기·각도·E/E 포트 정밀(P2), 입력 상태 보존, 튜토리얼 말풍선 | UI-RULE-01, FB-P1-01, K-4.x, L-2, L-6.3, L-7.1 |
| 주행 | 레이싱 전용 BGM·카운트다운/시동/결과 효과, 피니시/체포 연출, 도로·해적선 진입부, 정차 중 고장 트리거(신규) | FB-P2-02~05 |
| STEP02 | 공통 프레임, Hover 정상·이상·STACK, 자유 실 연결, 1054×723·전체화면 검증, 미측정 증거 생성 금지 유지 | UI-RULE-01, L-4.2, K-5.3 |
| STEP03 | 공통 프레임·소제목 데이터 계약(3~4줄→2줄), 줌 +/−/맞춤 실동작, 추가 시나리오 확장 | UI-RULE-01, M-04, K-6.3 |
| STEP04 | 공통 프레임, 탭별 의문형 목표, 모니터링 상태/이벤트 시각화, 관찰 신호 선택 단계, 추가 시험 안내 | UI-RULE-01, M-09/10, L-5.2, L-7.2 |
| 재주행(CHASE_RESUME) | 수리 후 회귀 주행 판정과 STEP04 동일 조건 비교의 역할 정리 | FB-P1-07 |
| WANTED/엔딩 | 실행 검증, 건너뛰기, 저장 흐름; 전용 증명사진·머그샷 이미지 교체(CLAUDE.md) | FB-P1-06 |
| 공통 UI | 헤더 10/30/40/20, 단계 이동 3중 구조 정리, 3:4 규칙 범위, 모션 줄이기, 오디오 | UI-RULE-01, M-12, FB-P2-03 |

---

## A5. 콘텐츠 추출 가능 여부

| 화면 | 구분 | 이유 |
|---|---|---|
| 인트로(Title·Prologue·설정 패널) | [현재 원문 추출 가능] | `main.tsx` 정적 문자열 |
| STEP01 차고 | [일부만 추출 가능] | `domainContent`·`featureFlows`·`INPUT_MISSION` 정적 데이터는 가능하나 UI-RULE-01 소제목·용어 전수 검토·도메인 확장 미완 |
| 주행(Briefing·Race·FaultDialogue) | [일부만 추출 가능] | FaultDialogue·브리핑은 가능, 레이스 HUD 안내/존 문구는 JSX 분산, FB-P2 연출 문구 미확정 |
| STEP02 | [일부만 추출 가능] | `CASES`·`TRACE`·`OBSERVED`·`SUBSYS` 정적. FB-P0-01 레이아웃·Hover 문구 미확정 |
| STEP03 | [일부만 추출 가능] | `REF`·`SPEC`·`WHY`·`FACE`·계약 `BASE`. 소제목 2줄 계약·줌 미확정 |
| STEP04 | [일부만 추출 가능] | `QUESTIONS`·`PREDICT`·`FIXES`·`CASE_DERIVS`·`VIEW`. 탭별 목표 문구·모니터링 변형 미확정 |
| 재주행 | [일부만 추출 가능] | `regressionCard` 문구 JSX 내부 |
| WANTED/엔딩 | [일부만 추출 가능] | `CASE_VISUAL`/`CASE_SAFETY`/보고서 동적 조합(세션 기록 의존 → **실행 후에만 완전 추출**) |
| 공통 UI(헤더·오픈북·판정 도장·StageIntro) | [일부만 추출 가능] | `OpenBook.tsx` `BOOK`, `Verdict.tsx` |
| FB-P2 연출·신규 사건 | [미확정] / [구현 완료 후 추출] | |

---

## 조사 대상 파일
`docs/REQUIREMENT_TRACEABILITY_FINAL_2026-11-10.md`(전체), `docs/IMPLEMENTATION_STATUS_2026-11-10.md`, `WORK_HANDOFF.md`, `CLAUDE.md`, `docs/V4_DESIGN_2026-11-09/SOURCE_PROMPT_MANIFEST.md`·`TARGET_LOCK.md`(앞부분), `src/game/runtime.ts`, `src/game/scenarios.ts`, `src/game/verificationContract.ts`, `src/main.tsx`(라우팅·Title·QA 훅 부분), `src/experiences.tsx`(Garage·Race 발췌), `src/features/{board/EeTrace,wiring/RefPuzzle,verification/VerificationLab}.tsx`(발췌·grep), `src/features/verification/simModel.ts`, `src/sim/vehicleSim.ts`, `src/ui/{game-shell,Verdict,CaseFileEnding,OpenBook}.tsx`(grep), `tests/*.mjs`(테스트명).

## 조사 완료 항목
SSOT 전 행 분류(범위 묶음), 요청 지정 충돌 ID(UI-RULE-01·FB-P0-01·FB-P1-01~07·L-6~9·M-01~13) 관계 정리, 화면별 변경 예정·추출 가능 여부.

## 미확인/미완료 항목
- 대화 기록(프롬프트 요청 이력): **[자료 없음]**
- M-03(DominoFall 제거), M-09(탭별 의문형 목표), M-10(상태·이벤트 시각화), UI-RULE-01 헤더 CSS 비율, 이모지 잔존, 3:4 전체화면 적용: 코드 전수 재확인 안 함
- 테스트 수치 불일치(참고): WORK_HANDOFF "67/67", IMPLEMENTATION_STATUS "49/49", CLAUDE.md "39개" — **실행하지 않아 현재 값 미확인**
- 문서 불일치(참고): CLAUDE.md 상단은 git 루트·포트 5180·`game-web/` 구조를 서술하나 `TARGET_LOCK.md`는 포트 5173·`game-web` 저장소. 현재 `TEMP`는 상위 저장소에서 untracked(`?? ./`)로 표시됨

## 실제 코드 근거 (대표)
`runtime.ts:196-201` 추격 하한, `scenarios.ts:86-157` SCENARIO_META, `CaseFileEnding.tsx:229/262/277`, `main.tsx:119-127/1499-1530`, `experiences.tsx:925-928/1126`, `Lab:1331-1450`.

## 다음 단계에서 추가 확인할 사항
1. 사용자 대화 기록 원문 확보 후 A2 재대조
2. 브라우저에서 STEP02 실제 배치(M-02 vs FB-P0-01)와 3:4 비율 확인
3. J-3/B-1 vs CLAUDE.md 문구 규칙 충돌에 대한 사용자 결정
4. UI-RULE-01 적용 시 `stageHistoryNav`·`journeyRail`·폴더 탭 역할 정리 결정
