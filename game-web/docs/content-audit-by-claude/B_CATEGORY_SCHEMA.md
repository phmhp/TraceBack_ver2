# B4~B6. 콘텐츠 카테고리 스키마 · 코드 매핑 · 현재 vs 최종

- 조사일 2026-11-10 / 읽기 전용. **실제 문구·정답·수치는 추출하지 않았다.** 각 카테고리의 "원문 위치"는 D 작업(원문 추출)의 시작점이다.
- 표기: **공통** = 사건과 무관하게 고정 / **가변** = `CaseId`(또는 `DomainId`)별로 달라짐 / **동적** = 플레이·시뮬 결과로 생성(실행 후에만 추출 가능)

---

## B4. 콘텐츠 카테고리 정의

| 코드 | 카테고리 | 설명 |
|---|---|---|
| T1 | 화면 제목 | `GameHeader chapter/title`, `StageIntro title` |
| T2 | 소제목·목표 | `StageIntro goal`, SSOT 2줄 소제목 계약(UI-RULE-01) |
| T3 | 단계/진행 라벨 | 진행 바 `journeyStages`(label/detail), 헤더 단계명 |
| D1 | 캐릭터 대사 | 볼트(드라이버)·너트(엔지니어) 말풍선, 컷신 대사, 폭스 |
| D2 | 안내 말풍선·코칭 | `bubble` 상태, `etBubble`, `StageIntro.steps`, 첫 사건 `data-coach` |
| H1 | 도움말·오픈북 | `OpenBook`, `help`, `rpBubble`(블록 ?), `PartIntroCard`, `ControllerCard` |
| Q1 | 문제(질문) | STEP02 의심 구간 질문, STEP04 `QUESTIONS.ask`, 도미노 "원인은?" |
| C1 | 선택지 | 의심 구간 3지선다, 퍼즐 블록 보관함, 입력 조건 `CASE_DERIVS`, 시험 레벨 카드, 답 버튼 3종, 수리 카드 `FIXES` |
| A1 | 정답 키 | `judgeRun`/`hypothesisStatus`의 rules, `FIXES.ok`, `REF.gaps` 정답 블록, `SCENARIO_META.hypotheses.truth` |
| F1 | 정답/오답 피드백 | `showVerdict`, `FIXES.why`, `judgeRun.why`, 퍼즐 `WHY`, 도미노 오답 문구 |
| E1 | 증거 | `SCENARIOS.evidence`, 폴라로이드(`board-photos`·`ending-thumbs`·증거 아틀라스), `OBSERVED` |
| I1 | 이미지·아이콘 | `Icon.tsx`, 컷아웃 사진, 에셋 경로 |
| M1 | 애니메이션·연출 | 컷신, 도장, 쓰러짐/흐름 화살표, 영수증 출력, 부품 회전(휠·팬) |
| G1 | 그래프 | `OverlayGraph`, `SeriesTrace`, `RefPuzzleTrack` 값 흐름 |
| N1 | 수치·단위 | 기준값/현장값, 단위, 허용 한계, 신호 값 `SIGNAL_VALUE` |
| S1 | 신호·부품 정의 | `components.ts`(부품 28·연결 38·ECU 6), `featureFlows`, `TRACE.chain`, `SIGNALS` |
| P1 | 팝업·오버레이 | `Overlay`(PAUSE/CAUGHT), `ReplayConfirm`, 도움말 카드, `PartInspector`, 판정 도장 |
| R1 | 시험 결과 | `lastRun.verdict`(PASS/FAIL/INCONCLUSIVE), 관측 표, 가설 판정(가능성 높음/낮음/아직 모름) |
| R2 | 수리 결과 | 수리 카드 선택 결과, 동일 조건 재시험 PASS, 회귀 목록/회귀 카드 |
| W1 | 주행 HUD·알림 | 계기판 `cluster1109`, 조작법 바, 미니맵, `.raceFeed` 카드, 생선 말풍선 |
| X1 | 상태 표시·잠금 사유 | `journeyStageAccess.reason`, 버튼 잠김 문구, `gateMsg`, `pickNotice` |
| Y1 | 요약·보고서 | WANTED 사건 파일·분석 보고서·최종 결과, 계약(설계서) 카드 |
| Z1 | 오디오 | 효과음·BGM(`sfx.ts`) — 텍스트 아님, 별도 점검 대상 |

---

## B5/B6. 화면 × 카테고리 매트릭스 (코드 매핑 + 현재/최종 차이)

범례: ●=현재 존재 / ◐=부분 / ○=없음(SSOT상 추가·변경 예정) / ─=해당 없음

### 인트로 (TITLE · PROLOGUE)
| 카테고리 | 현재 | 가변성 | 코드 위치 | 최종 차이 |
|---|---|---|---|---|
| T1/T2 | ● | 공통 | `main.tsx` `Title` h1/eyebrow/small | 말투 규칙 점검 |
| D1 | ● | 공통 | `main.tsx` `Prologue`(5슬라이드) | 문구 승인 필요(G-15) |
| P1(설정·조작법 패널) | ● | 공통 | `Title` `panel` | FB-P2-03 오디오 설정 확장 |
| Z1 | ● | 공통 | `sfx.ts` | BGM 유지 규칙 |

### STEP01 차고 (GarageExperience)
| 카테고리 | 현재 | 가변성 | 코드 위치 | 최종 차이 |
|---|---|---|---|---|
| T1 | ● | 공통 | `StageIntro id="garage"`(experiences.tsx:1036) | UI-RULE-01 2줄 소제목(도메인 가변) |
| T2 | ◐ | 가변(도메인) | `StageIntro goal` | 소제목 계약 적용 시 `{도메인}` 실값 |
| D2/D1 | ● | 가변(도메인·기능) | 말풍선 `bubble`, `flowCard` | L-7.1 순차 안내·다시 보기 |
| H1 | ● | 가변 | `PartIntroCard`, `ControllerCard`, `PartInspector`, `PullOutBubble` | 오픈북 현재 노드 맞춤 |
| C1 | ● | 가변 | 도메인 탭 7+전체보기, 기능 선택, 조건 버튼(`INPUT_MISSION`) | 타 도메인 직접 조작 확장 |
| S1 | ● | 가변(도메인) | `domainContent`(:49), `featureFlows`(:127), `getFeatureLayer`(:205), `components.ts` | 용어·단위 전수 |
| M1 | ● | 가변 | 3D 흐름, 휠 회전, E/E 신호선 | L-2 P2 3D·배선 정밀화 |
| N1/G1 | ◐ | 가변 | 단위 카드, `SimulinkDiagram.tsx`, `EeBlueprint.tsx` | 값 확장 |
| X1 | ● | 공통 | `gateMsg`, `pickNotice`, 단계 rail | |
| 상태 보존 | ○ | — | `useState`만 | L-6.3 |

### 주행 (DRIVE_BRIEFING · CHASE_* · FAULT_CUE)
| 카테고리 | 현재 | 가변성 | 코드 위치 | 최종 차이 |
|---|---|---|---|---|
| T1 | ● | 공통 | `GameHeader` | |
| D1 | ● | 공통(브리핑)/가변(고장 대사) | `StaticCutscenes.DriveBriefing`, `FaultDialogue.DRIVER_LINE` | 말투·감탄 규칙 점검 |
| W1 | ● | 공통+가변(존 표지) | `RaceExperience`(HUD, `.raceFeed`, `OVERTAKE_ZONE`/`CLIMB_ZONE`) | FB-P2-03/04/05 연출·BGM |
| M1 | ● | 공통 | `RaceWorldScene`, 컷신 | 피니시 5초 FINISH!/CAUGHT! |
| N1 | ● | 공통 | 속도·거리·격차 | |
| 신규 사건 트리거 | ○ | 가변 | (없음) | FB-P2-02 정차 중 발생 |

### STEP02 원인 역추적 (EeTraceV2)
| 카테고리 | 현재 | 가변성 | 코드 위치 | 최종 차이 |
|---|---|---|---|---|
| T1/T2 | ● | 가변(실제 증상) | `StageIntro id="trace-v2"`, 폴더 소제목 | UI-RULE-01 2줄 |
| Q1 | ● | 가변 | 의심 구간 질문, 후보 `causes` | |
| C1 | ● | 가변 | `CASES[case].doms`, 후보 3지선다, `SUBSYS.stages` | |
| E1/I1 | ● | 가변 | `OBSERVED`, `SCENARIOS.evidence`, 폴라로이드(`Polaroid`) | Hover 정상·이상 |
| N1/G1 | ● | 가변 | 기준/현장 막대, 달라진 시각 `t` | |
| A1 | ● | 가변 | `CASES.first`, `TRACE.first`, 함정 `t` | |
| F1 | ● | 가변 | `LAMP`, `QUOTE`, `bubble`, `STAMP_KO` | |
| S1 | ● | 가변 | `TRACE.chain`, `OTHER_ECUS` | |
| R1 | ◐ | 가변 | `tb-section`, `tb-impact` 저장 | 가설 정리 UI |
| 상태 | ● | — | `tb-step…` | |

### STEP03 로직 퍼즐 (RefPuzzle)
| 카테고리 | 현재 | 가변성 | 코드 위치 | 최종 차이 |
|---|---|---|---|---|
| T1/T2 | ● | 가변 | 제목 "요구사항 기반 로직 퍼즐"(CLAUDE.md), 의심 구간 | 소제목 2줄 계약 |
| Q1/C1/A1 | ● | 가변 | `REF`(블록·`gaps`·함정 표 B), `SPEC.input`, `FACE`, 보관함 | 시나리오 확장 |
| H1 | ● | 가변 | `rpBubble`, `doesOf`, 차고 노트(`OpenBook`) | |
| F1 | ● | 가변 | `WHY`, `showVerdict`, 실행 결과 | |
| N1/G1 | ● | 가변 | 값 흐름 실행, 기대값 `SPEC.expect` | |
| Y1 | ● | 가변 | 시험 설계서(`VerificationContract`, 영수증 렌더) | |
| M1 | ● | 공통 | 영수증·도장 | reduced-motion 확인 |

### STEP04 시뮬레이션 검증 (TwinBenchExperience)
| 카테고리 | 현재 | 가변성 | 코드 위치 | 최종 차이 |
|---|---|---|---|---|
| T1/T2/D1 | ● | 가변 | `StageIntro id="bench-qa2"`, 볼트 질문 `q.ask` | 탭별 의문형 목표(M-09) |
| Q1 | ● | 가변 | `QUESTIONS[case]` | |
| C1 | ● | 가변+공통 | 시험 카드 `TEST_CARD`(공통 4종), 입력 `CASE_DERIVS`, 답 `ANSWER_BTN`(공통), 수리 `FIXES` | 관찰 신호 선택(미구현) |
| A1/F1 | ● | 가변 | `SCENARIO_META.hypotheses[].rules`, `judgeRun`, `FIXES.ok/why`, `PREDICT` | |
| N1/G1/S1 | ● | 가변+동적 | `simModel.VIEW`, `simulate()`, `OverlayGraph`, 관측 표 | 모니터링 상태·이벤트 시각화 |
| R1 | ● | 동적 | `lastRun.verdict`, `ANSWER_KO` | |
| R2 | ● | 동적 | retest PASS, `regression`(`tb-impact`) | 고객 카드(M-6.4 장면 7) |
| P1 | ● | 공통 | 도움말, `ReplayConfirm` | |
| 관찰 신호 선택 / 이 시험으로 모름 안내 | ○ | — | live에는 "이 레벨의 모든 신호 관측"(`observe(lst, lst.map(sig=>sig.id))`) | M-6.4 장면 2 |

### 재주행 (CHASE_RESUME)
| 카테고리 | 현재 | 가변성 | 코드 위치 | 최종 차이 |
|---|---|---|---|---|
| W1/R2 | ● | 가변 | `regressionCard`(experiences.tsx:1930), `regRef` | STEP04 동일 조건 비교와 역할 정리 |

### WANTED / 엔딩 (WantedEnding · BustedEnding)
| 카테고리 | 현재 | 가변성 | 코드 위치 | 최종 차이 |
|---|---|---|---|---|
| Y1 | ● | 가변+동적 | `CASE_VISUAL`, `CASE_SAFETY`, `SIGNAL_PATH`, `CATEGORY`, 세션 기록 | 실행 검증, 전용 사진 에셋 |
| T1/D1 | ● | 공통 | WANTED 전단 문구 | |
| 페이지/타이핑 | ● | 동적 | `page`, `typed` | |

### 공통 UI
| 카테고리 | 현재 | 코드 위치 | 최종 차이 |
|---|---|---|---|
| 헤더·진행 바 | ● | `game-shell.tsx` `GameHeader`, `JourneyProgress` | 10/30/40/20 분할 |
| 단계 이동 | ● (2종) | `journeyRail`, `stageHistoryNav` | 폴더 탭 도입 여부 결정 |
| 오픈북 | ● | `OpenBook.tsx` `BOOK`(사건별 3~n 카드) | 현재 노드 맞춤·정답 비공개 검수 |
| 판정 도장·안내 | ● | `Verdict.tsx` | |
| 버튼·키캡·상태 알약 | ● | `game-shell.tsx` `ActionButton`, `Keycap`, `StatusPill` | |

---

## 공통 vs 사건별 가변 콘텐츠 요약

| 구분 | 항목 |
|---|---|
| **공통 고정** | 타이틀·프롤로그·브리핑·진행 바 라벨·검증 레벨 4종(`LV`)·시험 카드 4종(`TEST_CARD`)·답 버튼 3종·`StageIntro` 구조·판정 도장·헤더·엔딩 틀 |
| **도메인 가변(STEP01)** | `domainContent`·`featureFlows`·`INPUT_MISSION`(7 도메인, 사건과 독립) |
| **사건 가변(3종)** | `SCENARIOS`, `SCENARIO_META`, `DominoTrace.CASES`, `EeTrace.TRACE/OBSERVED/SUBSYS/REPLAY`, `RefPuzzle.REF/SPEC/WHY/ACTUATOR/RIG_GOAL/SCOPE`, `verificationContract.BASE`, `Lab.QUESTIONS/PREDICT/FIXES/CASE_DERIVS/LV_ANSWER/BEST_COST/ROOT_SIGNAL`, `simModel.VIEW/MODELS/TIME`, `OpenBook.BOOK`, `CaseFileEnding.CASE_VISUAL/CASE_SAFETY/SIGNAL_PATH/CATEGORY`, `FaultDialogue.DRIVER_LINE`, 레이스 트리거 상수 |
| **동적(실행 후)** | 시뮬 신호 값, 측정 결과 문자열 `vals`, 별점, WANTED 보고서 세션 기록, 회귀 카드 판정 |

→ 사건 데이터가 **약 15곳의 서로 다른 파일/상수**에 `Record<CaseId,…>`로 흩어져 있음(신규 사건 추가 비용, C8 참조).

## 현재 구현 vs 최종 요구 — 추가·변경될 카테고리

| 구분 | 내용 | 근거 ID |
|---|---|---|
| 신규 | 소제목 2줄(T2) 공통 포맷, 하단 안내/다음 슬롯 문구, 폴더 탭 라벨(`이전|다음`) | UI-RULE-01 |
| 신규 | STEP04 탭별 의문형 목표, 관찰 신호 선택 장면, "이 시험으로 모름" 안내, 고객 한 장 요약 카드(Y1) | M-09, M-6.4 |
| 신규 | 모니터링 상태 타임라인·통신 이벤트 타임라인(데이터 있을 때만) | M-10 |
| 신규 | Hover 정상·이상 설명(E1), STACK | L-4.2 |
| 신규 | 튜토리얼 순차 말풍선 확대·다시 보기(D2) | L-7.1 |
| 신규 | 오디오 전환·피니시/체포 연출 문구 | FB-P2-03/04 |
| 신규(사건) | 정차 중 발생형 신규 사건 | FB-P2-02, `FAULT_SCENARIOS_2026-11-09.md` |
| 변경 | 말투 규칙(해요체) 적용 범위(D1·F1), "교육 단순화" 문구 정책(충돌, A3) | CLAUDE.md vs J-3 |
| 변경 | 영수증 출력 방식(고정 종이+텍스트 출력) | FB-P1-05 |
| 제외 | 도미노 재생 팝업, 독립 HW 검증 | M-03, H-4 |

---

## 조사 대상 파일
`src/main.tsx`, `src/experiences.tsx`(상수·export 목록), `src/features/{board,wiring,verification,cutscenes}/*`(export·상수명), `src/game/{scenarios,verificationContract,cast}.ts`, `src/ui/{game-shell,Verdict,OpenBook,CaseFileEnding}.tsx`, `src/sim/components.ts`(이름만).

## 조사 완료 항목
카테고리 22종 정의, 화면별 매핑표(인트로~공통), 공통/가변/동적 구분, 현재↔최종 차이 목록.

## 미확인/미완료 항목
- `domainContent`/`featureFlows` 내부 필드 구조, `INPUT_MISSION` 7개 도메인 키별 항목 수
- 레이스 HUD 문구 위치(JSX 분산) 전수
- `SimulinkDiagram.tsx`·`EeBlueprint.tsx`·`DominoBoard.tsx` 등 미사용/보조 파일 내부
- 컷신 대사 수·이미지 에셋 목록(`public/` 참조 전수 확인 안 함)

## 실제 코드 근거
상수명은 위 표에 파일 단위로 기재. 대표: `Lab:1107(QUESTIONS)`, `Lab:486(FIXES)`, `Lab:583(CASE_DERIVS)`, `Lab:1123(TEST_CARD)`, `EeTrace.tsx:276-303`, `RefPuzzle.tsx:36/43/387-436`, `verificationContract.ts:23`, `CaseFileEnding.tsx:48/88/194/199`.

## 다음 단계에서 추가 확인할 사항
1. D(원문 추출) 시 위 상수 단위로 추출 — 사건당 약 15개 상수 × 3사건
2. 대사·피드백 말투 규칙 확정 후 D1/F1/Q1/C1 문구 일괄 재검수
3. 최종 구현 후 W1(레이스 HUD) 문구 재추출
