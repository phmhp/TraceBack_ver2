# D-1 인덱스

## 총계
- 추출 총 4178건 / 플레이 도달 후보 2243 / 장면 미도달 15 / brake 사건 미도달 389 / 코드 미참조(레거시) 1515 / 개발 전용 16

## 화면별 파일(도달 후보+장면/사건 미도달 포함)
| 화면 | 파일 | 항목 수 |
|---|---|---|
| 타이틀·프롤로그 | D1_TITLE_PROLOGUE.md | 47 |
| STEP01 차고(도메인 원리)·부품 정의 | D1_STEP01_GARAGE.md | 1106 |
| 도주 브리핑·주행·고장 대사·재주행 | D1_DRIVE_RACE.md | 88 |
| STEP02 원인 역추적 | D1_STEP02_TRACE.md | 329 |
| STEP03 로직 퍼즐·시험 계약 | D1_STEP03_PUZZLE.md | 310 |
| STEP04 시뮬레이션 검증 | D1_STEP04_VERIFICATION.md | 312 |
| 수리 컷신·엔딩·WANTED 보고서 | D1_REPAIR_ENDING.md | 177 |
| 공통 UI(헤더·진행 바·도장·오픈북·팝업·효과) | D1_COMMON.md | 65 |
| 사건 공통 레지스트리(scenarios·runtime) | D1_CASE_DATA.md | 129 |
| 도달 불가(레거시) | D1_UNREACHABLE.md | 1515 |
| 개발 전용 | D1_DEV_ONLY.md | 16 |

## ID 규칙
`<파일코드>-<4자리 라인>-<줄 내 순번>` — 예: `LAB-1107-1`. 파일코드 → 소스 경로는 아래 표. 소스 라인이 바뀌면 ID가 바뀌므로 변경 추적은 `_d1_rows.json` 재생성 후 diff.

## 소스별 건수·파일코드
| 코드 | 소스 | LIVE계 | 미참조 | DEV |
|---|---|---|---|---|
| EXP | src/experiences.tsx | 1141 | 332 | 3 |
| REF | src/features/wiring/RefPuzzle.tsx | 268 | 46 | 2 |
| LAB | src/features/verification/VerificationLab.tsx | 219 | 590 | 8 |
| DOT | src/features/board/DominoTrace.tsx | 171 | 76 | 1 |
| EET | src/features/board/EeTrace.tsx | 158 | 78 | 2 |
| END | src/ui/CaseFileEnding.tsx | 149 | 0 | 0 |
| SCN | src/game/scenarios.ts | 117 | 5 | 0 |
| CMP | src/sim/components.ts | 75 | 0 | 0 |
| SIM | src/features/verification/simModel.ts | 68 | 0 | 0 |
| MAIN | src/main.tsx | 57 | 194 | 0 |
| CUT | src/features/cutscenes/StaticCutscenes.tsx | 42 | 0 | 0 |
| VCT | src/game/verificationContract.ts | 42 | 0 | 0 |
| SMD | src/features/garage/SimulinkDiagram.tsx | 41 | 0 | 0 |
| SHL | src/ui/game-shell.tsx | 23 | 0 | 0 |
| EEB | src/features/garage/EeBlueprint.tsx | 20 | 0 | 0 |
| RUN | src/game/runtime.ts | 12 | 0 | 0 |
| OBK | src/ui/OpenBook.tsx | 12 | 0 | 0 |
| VLY | src/features/garage/VehicleLayout.tsx | 11 | 0 | 0 |
| CST | src/game/cast.ts | 7 | 0 | 0 |
| RPL | src/ui/ReplayConfirm.tsx | 7 | 0 | 0 |
| VRD | src/ui/Verdict.tsx | 4 | 0 | 0 |
| CBR | src/ui/ComicBurst.tsx | 2 | 0 | 0 |
| PMD | src/features/parts/partModels.ts | 1 | 0 | 0 |
| DOB | src/features/board/DominoBoard.tsx | 0 | 126 | 0 |
| SUS | src/features/board/SuspectBoard.tsx | 0 | 57 | 0 |
| REG | src/sim/registry.ts | 0 | 11 | 0 |
