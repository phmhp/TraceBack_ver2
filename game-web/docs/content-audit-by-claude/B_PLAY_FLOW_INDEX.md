# B1~B3. 전체 플레이 흐름·화면 상태·사건별 분기 (실제 코드 기준)

- 조사일 2026-11-10 / 읽기 전용 / 실행·브라우저 검증 없음 (`[실행 검증 필요]` 표시는 코드만으로 단정 불가)
- 근거 파일: `src/game/runtime.ts`(상태머신 `dispatch`), `src/main.tsx`(`App` 라우팅 1499-1530), `src/experiences.tsx`, `src/features/*`, `src/ui/*`
- 이 문서는 **구조 인덱스**다. 실제 대사·문제·선지·정답·수치 원문은 추출하지 않았다(D 작업 범위).

---

## B1. 전체 플레이 경로

```
TITLE ──NEW_GAME──▶ PROLOGUE ──CONTINUE_PROLOGUE──▶ GARAGE_L1 (STEP01)
   │ (이어하기: LOAD_SAVE → 저장 scene 로 복귀)         │ START_RACE
   │                                                   ▼
   │                                          DRIVE_BRIEFING (범행·도주 컷신)
   │                                                   │ BEGIN_RACE
   │                                                   ▼
   │                                          CHASE_NORMAL (주행 #1, mode=normal)
   │                           추월 구간 150–330 m 에서 FAULT_CUE (사건 1: propulsion)
   │                                                   ▼
   │                                          FAULT_CUE (고장 대사 2줄) ──CONTINUE_FAULT──▶
   │                                                   ▼
   │   STEP02  BOARD   (EeTraceV2: 원인 역추적)  ──OPEN_WIRING(가설 필수)──▶
   │   STEP03  WIRING  (RefPuzzle: 요구사항 기반 정상 동작) ──COMPILE+OPEN_BENCH──▶
   │   STEP04  TWIN_BENCH (TwinBenchExperience: 시뮬레이션 검증) ──BENCH_RESULT(pass)──▶
   │           REPAIR   (RepairSequence 컷신, 카운트다운) ──APPLY_REPAIR──▶
   │   [propulsion 완료] ▶ CHASE_RESUME (checkpoint harbor_entry, mode=resume)
   │                    연속 고부하 구간 760–960 m / 냉각 열 ≥ 84 → FAULT_CUE (사건 2: thermal) ▶ STEP02~04 반복
   │   [thermal 완료]  ▶ CHASE_RESUME (checkpoint dock_approach) → 거리 ≥ 1050 → START_FINAL_ESCAPE
   │                    ▶ SHIP_ESCAPE (mode=ship, 해적선 램프·갑판)
   │                       갑판 안착(deckSettled) 후 FINISH_ESCAPE(거리 ≥ 1080) ──▶ ENDING (WantedEnding)
   │
   └ 어느 주행·조사 장면에서든 추격 격차 ≤ 0 → CAUGHT (BustedEnding) ──RETRY_CHECKPOINT──▶ 체크포인트 복귀
     PAUSE ⇄ RESUME (previousScene), NAV_BACK/NAV_FORWARD/NAV_STAGE (단계 이동)
```

장면 수: `Scene` 22종 중 실제 App이 분기하는 것은 TITLE, PROLOGUE, GARAGE_L1~L4(동일 컴포넌트), DRIVE_BRIEFING, CHASE_NORMAL, ASSIST_CHASE, CHASE_RESUME, SHIP_ESCAPE, FAULT_CUE, BOARD, WIRING, TWIN_BENCH, VERIFY_FAIL, REPAIR, OPTIONAL_FAULT, SHIP_BOARDING, ENDING, CAUGHT, PAUSE(기본 분기=`Overlay`).

### B1-a. 화면 ↔ 컴포넌트 ↔ 진행 바 단계
`src/ui/game-shell.tsx` `journeyStages`(8칸) / `stageForScene`:

| 진행 바 | 장면 | 컴포넌트(파일) |
|---|---|---|
| 0 차고지 | GARAGE_L1~L4 | `GarageExperience` (experiences.tsx:921) |
| 1 범행·도주 | DRIVE_BRIEFING | `DriveBriefing` (StaticCutscenes.tsx:24) + 3D `HeistCutsceneScene`(experiences.tsx:1186) |
| 2 주행 | CHASE_NORMAL / CHASE_RESUME / ASSIST_CHASE / FAULT_CUE | `RaceExperience`(experiences.tsx:1622), `FaultDialogue`(:1961) |
| 3 원인 역추적 | BOARD / OPTIONAL_FAULT | `EeTraceV2`(features/board/EeTrace.tsx:41, main에서 `EeTrace`로 import) |
| 4 로직 퍼즐 | WIRING | `RefPuzzle`(features/wiring/RefPuzzle.tsx:436) |
| 5 검증 | TWIN_BENCH / VERIFY_FAIL | `TwinBenchExperience`(features/verification/VerificationLab.tsx:1331) / `FailureAnalysis` |
| 6 수리 | REPAIR | `RepairSequence`(StaticCutscenes.tsx:70) |
| 7 해적선 | SHIP_*, ENDING, CAUGHT | `RaceExperience mode=ship`, `ShipBoardingSequence`, `WantedEnding`/`BustedEnding`(ui/CaseFileEnding.tsx:333/358) |

---

## B1-b. 코드상 도달 가능성 점검 (중요)

| 항목 | 결과 | 근거 |
|---|---|---|
| 사건 3 **brake** 진입 | **일반 플레이 경로 없음** `[실행 검증 필요]` | `OPTIONAL_BRAKE`를 보내는 곳은 `main.tsx:770, 1381, 1387`의 **미사용 레거시 컴포넌트**(`Race`/`Optional`)뿐. `App()`은 `OPTIONAL_PROMPT` 장면을 렌더하지 않음. 레이스에도 brake용 `FAULT_CUE` 트리거 없음(experiences.tsx:1841-1843은 propulsion/thermal만). DEV `?qa=<scene>&case=brake`로만 진입 가능 |
| `VERIFY_FAIL`/`FailureAnalysis` | **현 STEP04에서 도달 안 함** | live `finish()`가 `BENCH_RESULT {pass:true, causeCorrect:true}`만 전송(Lab:1448). `pass:false`를 보내는 live 코드 없음 |
| `SHIP_BOARDING` / `ShipBoardingSequence` | **일반 경로에서 도달 안 함** | `FINISH_ESCAPE`가 곧바로 `ENDING`으로 전환(runtime.ts:347-348). `COMPLETE_ENDING`은 `SHIP_BOARDING`에서만 유효하고 `SHIP_BOARDING`으로 들어가는 이벤트가 `runtime.ts`에 없음(QA `?qa=SHIP_BOARDING`만) |
| `ASSIST_CHASE` | 도달 안 함 | 이를 `enter`하는 이벤트 없음 |
| `GARAGE_L4` | `GARAGE_GOTO level=4`로만 | `GARAGE_ADVANCE`는 L1→L3까지 |
| `GUIDED_REPAIR`, `SOLVE_BOARD`, `DEV_SOLVE`, `RETRY_WIRING` | 개발/레거시 | UI 호출 위치: 레거시 `InvestigationBoard`·`WiringPuzzle`·구 Lab, QA 정답 버튼 |
| `RETRY_CHECKPOINT` 후 장면 | **[기술 검토 필요]** | `checkpoint==="propulsion_fault"` 또는 `"thermal_fault"`면 **WIRING으로 복귀**(runtime.ts:363-367). BOARD를 거치지 않고, `enter()`는 `unlockInvestigation`을 호출하지 않으며 가설 선택 여부도 확인하지 않음 |
| `BENCH_RESULT` 추격 보상 | live에서 항상 +20 m | `causeCorrect:true` 고정 전송 → STEP04 오답/비용이 추격 거리에 반영되지 않음(별점은 `cost/mistakes`로만 반영) `[기술 검토 필요: 의도 확인]` |

---

## B2. 화면별 상태

공통 영속화: `useEffect`에서 TITLE 외 모든 상태를 `localStorage["traceback-v16-save"]`에 저장(main.tsx:131-134). 진행 키는 `sessionStorage` `tb-*`(B2-x). **TITLE → 새 게임**은 `tb-*` 및 save 삭제, **처음으로 돌아가기(TITLE)** 는 보존(P0-A).

| 화면 | 진입 전 / 진입 조건 | 진행 중 상태 | 완료 / 정답·오답 | 재시도·복귀·잠금 | 팝업·예외 |
|---|---|---|---|---|---|
| TITLE | 저장 있으면 `이어하기` 라벨(`STAGE_NAME[scene]`+추격 거리) | 패널 토글 `none/settings/keys`, Enter=이어하기/새 게임 | — | 설정: 효과음·배경음 토글 | 저장 scene 이 `STAGE_NAME`에 없으면 라벨 없음 |
| PROLOGUE | NEW_GAME | `slide` 0~4(5장) | slide 4 → `CONTINUE_PROLOGUE` | Enter/Space 진행 | |
| GARAGE (STEP01) | PROLOGUE 완료 | `domain`(7), `chosen`(전체보기=false), `routeLevel`(0 Vehicle/System · 1 E/E · 2 Control SW), `feature`, `activeStep`, `conds`(Set), `inputSelected`, `eeLayer`, `autoPlaying`, `labMode`, 선택 부품 등 — **모두 `useState`(비영속)** | `cleared`/`completedLessons` | 도메인·기능 변경 시 `conds·cleared·inputSelected·autoPlaying` 리셋(experiences.tsx:1007). 전체보기 복귀는 강조만 해제. 미선택 상태에서 level>0 선택 불가(`pickNotice`+error 효과음) | 조건 미충족 시 `gateMsg`; `PartInspector`(이벤트 `tb-part-inspect`), `ControllerCard`, `PartIntroCard`, `StageIntro` |
| DRIVE_BRIEFING | START_RACE | 컷신 비트 `onBeat`, `ready` | BEGIN_RACE | NAV_BACK → GARAGE_L1 | |
| CHASE_NORMAL / RESUME | BEGIN_RACE / APPLY_REPAIR | `sim`(speed·lane·steer·distance·gap·heat·elapsed), `countdown`, `gear` P/R/N/D, `regen` 0~3, `driveMission`(restart 등), `zoneThrottle`, `impact`, `regression`(수리 후 회귀 카드) | 고장 트리거(아래 B3) → `FAULT_CUE` | 충돌 `COLLISION`(집계), 격차 0 → `CAUGHT`; `SYNC_RACE`로 거리·격차 동기화 | 존 표지·경고·토스트(`.raceFeed`), 가드레일 접촉 문구, 물 추락 `waterFall` |
| FAULT_CUE | 레이스에서 `FAULT_CUE` 이벤트 | `step` 0/1(대사 2개), `dialogueSim` 정지 장면 | `CONTINUE_FAULT` → BOARD | 추격은 `TICK_PURSUIT`로 진행 | |
| BOARD (STEP02) | CONTINUE_FAULT 또는 OPEN_BOARD | `phase`, `chain`, `measured`, `stamps`, `mistakes`, `sectionPick`, `replayed`, `evidencePage`, `attached`… (`tb-step…` 진행 키, EeTrace:51/72) | 처음 어긋남 선택 → 의심 구간 3지선다 → `tb-section-<case>`·`tb-impact-<case>` 저장 → `OPEN_WIRING` | 오답 시 `mistakes`↑(별 3→1), 완료 후 `다시 풀기`(ReplayConfirm)가 이후 단계 기록 초기화 | `StageIntro` 1회, 오픈북, 폴라로이드 확대, `showVerdict` 도장 |
| WIRING (STEP03) | `hypothesis[case]` 선택됨 + (BOARD or 증거≥2) | `place`(빈칸 배치), `picked`, `check`(연결 확인/실행), `x`(예시 입력 슬라이더), `confirmed`, `fails`, 줌 `scale` (`tb-step…`, RefPuzzle:444/470) | 기준 확정 → `tb-expect-<case>`·`tb-verification-contract-<case>` 저장 → `COMPILE` + `OPEN_BENCH` | 완료 후 다시 풀기. 실행 1회 실패 후 오픈북 카드(HINT −5 m) | `rpBubble`(블록 ? 말풍선), 계약 영수증(`specSheet`) |
| TWIN_BENCH (STEP04) | OPEN_BENCH | `phase` pick→lab→report→retest→done, `qi`(질문 순번), `level`(unit/embedded/vehicle), `pickedDeriv`, `lastRun`(obs·verdict·vals), `answers`, `cost`, `mistakes`, `fix`, `viewTab`(sw/ecu/plant/graph) (`tb-step04-progress-<case>`, Lab:1350/1389) | 질문 모두 답 → report → 수리 카드 정답 → retest(차량 수준 동일 조건) PASS → done → `수리 적용 · 주행 복귀`(`finish`) | 수리 카드 오답 시 `mistakes`↑·설명, 정답까지 반복 | `StageIntro`, 도움말 `help`, 재생 확인 `replayOpen`, 3D `show3d` 정상/이번 토글 |
| REPAIR | BENCH_RESULT pass | 카운트다운 | `APPLY_REPAIR` | | |
| CHASE_RESUME | APPLY_REPAIR | B3 참조 | | | |
| SHIP_ESCAPE | START_FINAL_ESCAPE | 램프 진입(RAMP_START)·갑판(DECK_TOUCH)·`deckSettled` 2.1 s 타이머 | `FINISH_ESCAPE` | 격차 0 → CAUGHT | 물 추락 |
| ENDING (WANTED) | FINISH_ESCAPE | `page` 0·1·2(CASE 1 → CASE 2 → 최종 결과), `typed`(우측 타이핑, 전체 표시로 건너뛰기) | 새 사건 시작/메인 메뉴 | 세션 기록 없으면 "기록 없음" 표시 | |
| CAUGHT | 격차 ≤ 0 | BustedEnding(머그샷 수감 기록) | RETRY_CHECKPOINT | 체크포인트별 복귀 장면: 위 B1-b | |
| PAUSE | 헤더 일시정지 | `previousScene` 복원 | RESUME | | |

### B2-x. 상태 보존 키 목록

| 저장소 | 키 | 소유 |
|---|---|---|
| localStorage | `traceback-v16-save` | 캠페인 전체 |
| localStorage | `tb-music-v2`, `tb-race-music`, 효과음 설정 | `sfx.ts` (CLAUDE.md 기재) |
| localStorage | `StageIntro` `storageKey` | 도움말 1회 닫힘 (Verdict.tsx:27) |
| sessionStorage | `tb-step…`(EeTrace/RefPuzzle) · `tb-step04-progress-<case>` | 각 단계 진행 |
| sessionStorage | `tb-section-<case>` | STEP02→03·04 의심 구간 이름 |
| sessionStorage | `tb-impact-<case>` | STEP02→04 영향 목록(회귀 후보) |
| sessionStorage | `tb-expect-<case>` | STEP03→04 기대값 문자열 |
| sessionStorage | `tb-verification-contract-<case>` | STEP03→04 `VerificationContract` |
| sessionStorage | `tb-intro-…` | 안내 팝업 표시 이력(P0-A 삭제 대상) |
| (없음) | STEP01 전체, 주행 | 비영속 |

---

## B3. 사건별 분기

코드상 `CaseId = propulsion | thermal | brake`. 사건 식별자로 갈라지는 지점:

| 구분 | propulsion(사건 1, 구동) | thermal(사건 2, 열관리) | brake(사건 3, 선택·미연결) |
|---|---|---|---|
| 레이스 트리거 | `CHASE_NORMAL`, 거리 ≥150 m(`OVERTAKE_ZONE` 150–330)에서 풀가속 누적 `zoneThrottle` ≥1.8 s 또는 거리 ≥330 | `CHASE_RESUME`+`caseId==="propulsion"`, 열 `heat` ≥84 또는 거리 ≥960(`CLIMB_ZONE` 760–960) | 없음 |
| 레이스 증상(화면 연출) | 속도 변화량 ×0.45 및 상한(`Math.max(prev,55)`) | `heat ≥80`에서 속도 55 km/h 상한 | — |
| 고장 대사(`FaultDialogue.DRIVER_LINE`) | 사건별 1줄 + 엔지니어 공통 1줄 | 〃 | 〃(대사만 존재) |
| STEP02 데이터 | `DominoTrace.CASES`(도미노 후보·`t` 시각·`causes`·함정) + `EeTrace.TRACE/OBSERVED/SUBSYS/REPLAY` | 〃 | 〃 |
| STEP02 증거(`SCENARIOS.evidence`) | 4개 | 4개 | 3개 |
| STEP03 | `REF`(블록·빈칸·함정 표 B)·`SPEC`(예시 입력 슬라이더·expect)·`WHY`·`ACTUATOR`·`RIG_GOAL`·`SCOPE` | 〃 | 〃 |
| 시험 계약 `BASE` | 목적·전제 조건·자극·관찰 3개·한계 | 〃 | 〃 |
| STEP04 질문 `QUESTIONS` | 2개 | 3개 | 3개 |
| 입력 조건 `CASE_DERIVS` | req / boundary / replay(추월 기록) | req / soak | req / boundary(배터리 만충) |
| 시뮬 신호 `VIEW` | 4레벨 × 4신호 | 4레벨 × 4~6신호 | 4레벨 × 4신호 |
| 수리 카드 `FIXES` | 3(정답 1) | 3(정답 1) | 3(정답 1) |
| 레벨 추천 `LV_ANSWER` | unit | embedded | embedded |
| 최적 비용 `BEST_COST` | 2 | 10 | 10 |
| 수리 후 | APPLY_REPAIR → CHASE_RESUME(`harbor_entry`) | APPLY_REPAIR → CHASE_RESUME(`dock_approach`) | APPLY_REPAIR → 곧바로 `SHIP_ESCAPE`, 격차 ≥65 |
| 엔딩 | `CASE_VISUAL`/`CASE_SAFETY`/`SIGNAL_PATH`/`CATEGORY` | 〃 | 데이터 존재하나 WANTED 페이지는 필수 2사건만 |
| 차고 오픈북 `BOOK` | 해당 도메인 카드 연결 | 〃 | 〃 |

### B3-x. 사건에 무관한 공통 화면
TITLE, PROLOGUE, GARAGE(도메인 기반이며 사건과 무관), DRIVE_BRIEFING, 주행 월드·HUD, PAUSE, CAUGHT 화면 틀, WANTED 틀, 헤더·진행 바·`StageIntro`·`Verdict`.

### B3-y. 추격 경제 (사건 공통 규칙)
- 초기 격차 185 m(`START_RACE`), 최대 220, 필수 2사건 완료 전 하한 10 m(`pursuitFloor`)
- 조사·검증 장면(`FAULT_CUE`,`BOARD`,`WIRING`,`TWIN_BENCH`,`VERIFY_FAIL`,`REPAIR`)에서 1초마다 −0.08 m
- `HINT`(key별 1회) −5 m, `BENCH_RESULT` 정/오 ±20 m(사건당 1회 판정 갱신), 수리 후 최소 보장(propulsion 105 / thermal 115 / brake 65)

---

## 조사 대상 파일
`src/game/runtime.ts`(전체), `src/main.tsx`(라우팅·Title·QA 훅·저장), `src/experiences.tsx`(Garage 상태·Race 시뮬/트리거 발췌), `src/ui/game-shell.tsx`(진행 바), `src/features/verification/VerificationLab.tsx`(STEP04 본체 상태·phase), `src/features/board/EeTrace.tsx`·`wiring/RefPuzzle.tsx`(상태 키·데이터 이름), `src/ui/CaseFileEnding.tsx`(페이지 상태), `src/features/cutscenes/StaticCutscenes.tsx`(이벤트).

## 조사 완료 항목
B1 경로·도달 가능성, B2 화면별 상태·저장 키, B3 사건별 분기 표.

## 미확인/미완료 항목
- Race HUD 세부 상태(존 표지·토스트 종류·미션 종류) 전수, `BustedEnding` 버튼·분기 세부, `DriveBriefing`/`RepairSequence` 컷신 비트 수
- `GarageExperience`의 `labMode` 탭 4종 중 실제 노출(`SHOW_PULL_TABS=false`) 및 L4 진입 UI
- STEP02/03 내부 `phase` 값 전체(EeTrace·RefPuzzle 파일 중반부 미열람)
- 각 상태의 실제 UI 동작 — 실행 검증 없음

## 실제 코드 근거
`runtime.ts:204-427`(이벤트), `runtime.ts:137-187`(`journeyStageAccess`), `main.tsx:1499-1530`, `experiences.tsx:1721-1727/1840-1851/1951-1952`, `Lab:1331-1450`, `CaseFileEnding.tsx:229-277`.

## 다음 단계에서 추가 확인할 사항
1. brake 사건을 최종 게임에 포함할지, 포함 시 진입 이벤트·레이스 트리거 설계
2. `VERIFY_FAIL`·`SHIP_BOARDING`·`ASSIST_CHASE`를 유지(보존)할지, 도달 경로를 복구할지 사용자 결정
3. `RETRY_CHECKPOINT` → WIRING 복귀가 의도인지 확인
4. STEP01·주행 상태 보존 필요 범위(L-6.3)
