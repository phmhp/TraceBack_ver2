# TraceBack 잔여 요구사항 추적표

기준 커밋: `49de8a71`  
기준 브랜치: `main`  
작성 목적: 이전 감사에서 `부분 완료`·`미검증`·`미완료`로 남은 항목을 실제 코드 수정과 브라우저 검증으로 추적한다.

판정 규칙:

- `완료·검증 통과`: 코드/기능/화면/필요한 기술 검증을 모두 확인한 항목
- `구현 완료·검증 대기`: 코드 반영은 확인했지만 실제 조작 또는 화면 검증이 남은 항목
- `부분 완료`: 일부 경로만 반영됐거나 기술 정합성이 남은 항목
- `미완료`: 아직 코드 반영이 없는 항목
- 기존 보고서의 완료 표시는 재검증 전까지 그대로 신뢰하지 않는다.

## A. 정비소 3D·배선

| ID | 요구사항 | 이전 상태 | 이번 작업 기록 | 수정 파일 | 테스트/브라우저 증거 | 최종 상태 |
|---|---|---|---|---|---|---|
| G-3D-01 | 실제 클릭 부품과 단품 검사 모델 ID 일치 | 부분 완료 | 화면 인스턴스가 `inspectId`로 실제 모델 ID를 전달하도록 유지 | `src/experiences.tsx`, `src/features/garage/VehicleLayout.tsx` | `npm test` 통과; 실제 전 부품 더블클릭 미검증 | 구현 완료·검증 대기 |
| G-3D-02 | 구형 기본 도형을 플레이어 경로에서 제거 | 부분 완료 | 모델 미연결 시 컬러 기본 도형 대신 미연결 표식으로 표시 | `src/experiences.tsx` | `part-models` 및 전체 테스트 통과 | 완료·검증 통과 |
| G-3D-03 | 실제 에셋이 있는 부품을 실제 모델로 연결 | 부분 완료 | 신규 센서/ADAS/충전 관련 모델 ID 연결 확인 | `src/features/parts/partModels.ts`, `src/experiences.tsx` | `npm run assets:check` 15/15; 브라우저 일부 확인 | 구현 완료·검증 대기 |
| G-3D-04 | 차체 상부·곡면 카울·ADAS 장착면 | 부분 완료 | 절차적 곡면 카울/상부 쉘 추가, 투명도 조정 | `src/features/garage/VehicleLayout.tsx` | 1600×900 화면 캡처 확인; 장착면 기술 QA 미완료 | 부분 완료 |
| G-3D-05 | 실제 휠·허브·스포크 및 4코너 배치 | 부분 완료 | 4코너 휠 인스턴스, 허브·스포크 모델 및 회전축 유지 | `src/features/garage/VehicleLayout.tsx`, `src/features/parts/partModels.ts` | 코드/화면 확인; 회전축 수동 검증 대기 | 구현 완료·검증 대기 |
| G-3D-06 | CV 조인트·너클·허브의 개수/위치/방향/연결 | 부분 완료 | 허브 연결은 topology에 있으나 전용 CV/너클 모델의 개수·축 검증 필요 | `src/features/garage/VehicleLayout.tsx`, `src/features/garage/vehicleSpec.ts` | 자동 구조 검증 미구현 | 부분 완료 |
| G-3D-07 | 핸들·계기판·ADAS 카메라 local axis | 부분 완료 | authored 회전값을 명시하고 방향 주석 추가 | `src/features/garage/VehicleLayout.tsx` | 화면 방향 수동 QA 미완료 | 구현 완료·검증 대기 |
| G-3D-08 | 조향각 센서 모델/장착 | 미완료 | 독립 authored 모델·REF 연결 확인, column anchor QA 남음 | `src/features/parts/partModels.ts`, `src/features/garage/VehicleLayout.tsx` | 테스트 통과; 장착 위치 브라우저 미검증 | 구현 완료·검증 대기 |
| G-3D-09 | 냉각수 온도센서 모델/열 회로 연결 | 미완료 | 독립 probe 모델과 thermal component/connection 확인 | `src/features/parts/partModels.ts`, `src/sim/components.ts` | registry 테스트 통과; 실제 열 회로 화면 미검증 | 구현 완료·검증 대기 |
| G-3D-10 | 전륜 e-axle 내부 park pawl 모델/engagement | 미완료 | authored model 연결, 내부 engagement 위치는 미확정으로 숨김/미완료 표기 | `src/features/parts/partModels.ts`, `src/features/garage/vehicleSpec.ts` | 테스트 통과; 내부 단면/위치 검증 미완료 | 부분 완료 |
| G-WIRE-01 | 배선 탭/보기·숨기기 실제 동작 | 부분 완료 | 협조 신호와 차체/배선 토글을 분리 | `src/experiences.tsx`, `scripts/capture-ui.mjs` | `rework-qa-diagnostic2`: 배선 숨기기→배선 보기 DOM 조작 PASS | 완료·검증 통과 |
| G-WIRE-02 | 모든 배선 시작/종료 포트 ID 유효 | 부분 완료 | model anchor와 sim port를 우선 선택하는 anchor resolver 유지 | `src/features/garage/VehicleLayout.tsx`, `src/sim/registry.ts` | registry 테스트 통과; 모든 화면 segment 검사 필요 | 부분 완료 |
| G-WIRE-03 | 배선이 포트를 관통/공중 종료하지 않음 | 미검증 | static overview route를 부품 아래로 정리 | `src/features/garage/VehicleLayout.tsx` | 화면 일부 확인; 포트 접점 자동/브라우저 전수검증 대기 | 부분 완료 |
| G-WIRE-04 | 전원/통신/신호/유압/열/기계 연결 구분 | 부분 완료 | `FLOW_INFO`와 connection flow를 사용해 색/범례 분리 | `src/features/garage/VehicleLayout.tsx`, `src/sim/components.ts` | `npm test`의 flow/port 검증 PASS; 22개 정비소 화면 캡처에서 범례·레이아웃 확인 | 완료·검증 통과 |
| G-WIRE-05 | 전체보기와 도메인별 배선 데이터 일치 | 부분 완료 | 동일 `layoutOf`/anchor 기반으로 전체와 도메인 렌더링 | `src/features/garage/VehicleLayout.tsx` | `rework-qa-garage-all` 22개 조합 캡처·overflow PASS; 정적 연결 테스트 PASS | 완료·검증 통과 |

## B. 정비소 UI·탐색

| ID | 요구사항 | 이전 상태 | 이번 작업 기록 | 수정 파일 | 테스트/브라우저 증거 | 최종 상태 |
|---|---|---|---|---|---|---|
| G-UI-01 | 최초 전체보기 상하단 잘림/빈 공간 제거 | 부분 완료 | 고정 프레임과 garage layout 계약 유지 | `src/ui/ScaledFrame.tsx`, `src/features/garage/garage-v3.css` | 1600×900 overflow 없음; 다른 viewport 미검증 | 구현 완료·검증 대기 |
| G-UI-02 | 협조 신호 버튼이 실제 패널을 엶 | 완료 주장 | `garageCoordOverlay`와 `COORD_SIGNALS` 연결 확인 | `src/experiences.tsx`, `scripts/capture-ui.mjs` | `rework-qa-20261117`: 버튼 클릭 후 `.garageCoordOverlay` PASS | 완료·검증 통과 |
| G-UI-03 | 영역 아키텍처 그래픽 균등 배치 | 부분 완료 | ArchitectureOverview/영역 카드 구조 유지 | `src/features/garage/ArchitectureOverview.tsx` | 코드/캡처 확인; 전 영역 브라우저 조합 대기 | 부분 완료 |
| G-UI-04 | 전체→영역→도메인→기능 흐름 탐색 | 부분 완료 | architecture tree/crumb 경로 유지 | `src/features/garage/ArchitectureOverview.tsx`, `src/experiences.tsx`, `scripts/capture-ui.mjs` | `rework-qa-20261117`: 아키텍처→파워트레인→구동 탐색 PASS | 완료·검증 통과 |
| G-UI-05 | 도메인에서 다른 도메인 직접 이동 | 부분 완료 | 영역 crumb과 도메인 버튼을 유지 | `src/features/garage/ArchitectureOverview.tsx` | 실제 마우스 sequence 미검증 | 구현 완료·검증 대기 |
| G-UI-06 | 구조 탐색 컨트롤과 시각화 컨트롤 역할 분리 | 구현 완료 | architecture/협조 신호/배선/차체 버튼 분리 | `src/experiences.tsx`, `src/features/garage/ArchitectureOverview.tsx` | 전체보기 캡처에서 아키텍처·협조 신호·배선·차체 토글이 독립 컨트롤로 노출되고 조작 PASS | 완료·검증 통과 |

## C. 도미노

| ID | 요구사항 | 이전 상태 | 이번 작업 기록 | 수정 파일 | 테스트/브라우저 증거 | 최종 상태 |
|---|---|---|---|---|---|---|
| D-01 | 질문과 조작법 분리·모든 세부 질문 명시 | 부분 완료 | 현재 질문/가이드 구조 유지 | `src/features/board/DominoTrace.tsx`, `src/features/board/EeTrace.tsx` | 문자열/레이아웃 테스트 일부 | 부분 완료 |
| D-02 | 첫 편차 후보/기준값/현재값/시점 설명 | 부분 완료 | 후보 카드에 값과 시점 표시 | `src/features/board/DominoTrace.tsx` | 오답/정답 해설 전수검증 대기 | 부분 완료 |
| D-03 | 점선 레이어가 블록 위에 보임 | 부분 완료 | 점선 SVG를 보드 상단 레이어에 두고 블록과 pointer 이벤트를 분리 | `src/features/board/EeTrace.tsx`, `src/features/board/step02-v3.css` | `rework-qa-board-initial/27_evidence_board.png`에서 점선 경로가 블록 위에 노출; overflow 없음 | 완료·검증 통과 |
| D-04 | 우측 패널 여백/탭 배경 | 부분 완료 | evidence rail 고정 레이아웃 유지 | `src/features/board/step02-v3.css`, `src/p5-ui-fixes.css` | `rework-qa-board-initial` 캡처·1600×900 overflow PASS | 완료·검증 통과 |
| D-05 | 의심 구간 그래픽 선택지·힌트 분리 | 부분 완료 | 구조 그래픽은 evidence rail의 별도 탭으로, 힌트는 상단 `etHintButton`으로 분리 | `src/features/board/EeTrace.tsx`, `src/p5-ui-fixes.css`, `scripts/capture-ui.mjs` | `rework-qa-board-interaction6`: 오답 피드백, 힌트 클릭, `.etZoneTab` 생성 PASS | 완료·검증 통과 |
| D-06 | 가설 후보·먼저 시험할 가설 폴라로이드 | 부분 완료 | `Photo`/hypothesis tab 구조 유지 | `src/features/board/EeTrace.tsx`, `src/features/board/step02-v3.css` | 화면 조작 검증 대기 | 구현 완료·검증 대기 |
| D-07 | 정답/오답 해설 및 상태 보존 | 미검증 | 기존 state/send 경로 유지 | 관련 board files | 실제 조작 미검증 | 미검증 |

## D. 퍼즐

| ID | 요구사항 | 이전 상태 | 이번 작업 기록 | 수정 파일 | 테스트/브라우저 증거 | 최종 상태 |
|---|---|---|---|---|---|---|
| P-01 | 퍼즐판 본문 fit·외부 입력 겹침 없음 | 부분 완료 | puzzle-v3 layout 확인 및 고정 프레임에 맞춘 board sizing | `src/features/wiring/RefPuzzle.tsx`, `src/features/wiring/puzzle-v3.css` | `rework-qa-20261117/28_wiring_puzzle.png`, 1600×900 overflow PASS | 완료·검증 통과 |
| P-02 | 하단 후보→본문 연속 실제 drag/drop | 미검증 | 후보를 DOM에서 즉시 이동시키지 않고 pointer drag로 빈 홈에 놓는 경로 유지 | `src/features/wiring/RefPuzzle.tsx`, `scripts/capture-ui.mjs` | `rework-qa-20261117`: `[drag-audit] taken:1, dragging:0` PASS | 완료·검증 통과 |
| P-03 | 물음표 원형/중앙정렬/텍스트 겹침 | 부분 완료 | 물음표를 독립 원형 슬롯으로 고정하고 블록 텍스트와 분리 | `src/features/wiring/puzzle-v3.css` | `rework-qa-20261117/28_wiring_puzzle.png`에서 원형 슬롯·텍스트 겹침 없음 | 완료·검증 통과 |
| P-04 | 하단 버튼 위치 통일·다시 풀기 정렬 | 부분 완료 | 공통 dock 구조 확인 필요 | `src/features/wiring/RefPuzzle.tsx`, `src/features/wiring/puzzle-v3.css` | 조작 미검증 | 부분 완료 |
| P-05 | 시험 설계서 문서 팝업 중앙/dim/닫기 | 미검증 | supplied specification-sheet overlay 경로 유지 | `src/features/wiring/RefPuzzle.tsx`, `scripts/capture-ui.mjs` | `rework-qa-puzzle-contract3/28_wiring_puzzle.png`: 중앙 문서·dim·닫기 노출, overflow PASS | 완료·검증 통과 |
| P-06 | 정답/오답/재시도/단계 이동 상태 보존 | 미검증 | 상태 경로 확인 필요 | `src/features/wiring/RefPuzzle.tsx`, `src/main.tsx` | 브라우저 미검증 | 미검증 |

## E. 실험대·시험 설계

| ID | 요구사항 | 이전 상태 | 이번 작업 기록 | 수정 파일 | 테스트/브라우저 증거 | 최종 상태 |
|---|---|---|---|---|---|---|
| B-D-01 | 가설 폴라로이드와 텍스트 간격 | 부분 완료 | b4 review/hypothesis layout의 사진·요약·상태 간격을 고정 | `src/features/verification/VerificationLab.tsx`, `src/features/verification/bench-v4.css` | `rework-qa-bench-diag/29_lab_sw_logic.png` 및 interaction 캡처에서 카드 간격·overflow 없음 | 완료·검증 통과 |
| B-D-02 | 가설 제목 형광펜·수치 코드 스타일 | 부분 완료 | 가설 제목 `mark`, 수치/입력은 `code` 영역으로 분리 | `src/features/verification/VerificationLab.tsx`, `src/features/verification/bench-v4.css` | bench 화면/157개 테스트에서 스타일·계약 확인; 1600×900 overflow PASS | 완료·검증 통과 |
| B-D-03 | 역추적/첫 편차/의심 구간 그래픽 정보 | 부분 완료 | review panels 존재 | `src/features/verification/VerificationLab.tsx` | 화면 미검증 | 부분 완료 |
| B-D-04 | 시험 설계서·고장 기록 문서 팝업 | 부분 완료 | `rpFolderBack` 경로 존재 | `src/features/verification/VerificationLab.tsx`, `scripts/capture-ui.mjs` | `rework-qa-bench-interaction2`: 두 문서 open/close DOM 조작 PASS | 완료·검증 통과 |
| B-D-05 | 시험 수준 목적·기준 안내 | 구현 완료 | `b4WhyLevel`/pick guide 존재 | `src/features/verification/VerificationLab.tsx`, `src/features/verification/bench-v4.css` | hypothesis/level 선택 및 입력·실행 순서 interaction PASS, overflow 없음 | 완료·검증 통과 |

## F. 실험대·실행 판정

| ID | 요구사항 | 이전 상태 | 이번 작업 기록 | 수정 파일 | 테스트/브라우저 증거 | 최종 상태 |
|---|---|---|---|---|---|---|
| B-X-01 | 시험 입력 선택 후 시험 실행 순서 | 부분 완료 | level/input 선택을 실행 전 필수 상태로 만들고 선택 변경 시 이전 파생값 초기화 | `src/features/verification/VerificationLab.tsx`, `scripts/capture-ui.mjs` | `rework-qa-bench-interaction2`: `input:true`, `run:true` 순서 PASS | 완료·검증 통과 |
| B-X-02 | 시험 실행 버튼 padding·진행 표시 | 부분 완료 | CSS/visual header 확인 필요 | `src/features/verification/bench-v4.css` | 화면 미검증 | 미검증 |
| B-X-03 | 정상/결함/가설 제거 모델 의미 표시 | 부분 완료 | `b4Vis`/tabNote 존재 | `src/features/verification/VerificationLab.tsx` | 화면 미검증 | 부분 완료 |
| B-X-04 | 판단 불가·가설 강조 | 부분 완료 | verdict/stamp 경로 존재 | 관련 bench files | 화면 미검증 | 미검증 |
| B-X-05 | 우측 패널 3탭 순서/내용/잘림 없음 | 부분 완료 | `시험 설계 조건 → 가설 테스트 결과 → 시험 결과` 순서 고정 | `src/features/verification/VerificationLab.tsx`, `src/features/verification/bench-v4.css`, `scripts/capture-ui.mjs` | `rework-qa-bench-interaction2`: 탭 배열·결과 표시·overflow PASS | 완료·검증 통과 |
| B-X-06 | 가설 최대 2개·중복 방지·순차 실행 | 부분 완료 | state 경로 확인 필요 | `src/features/verification/VerificationLab.tsx` | 상태 전이 미검증 | 부분 완료 |
| B-X-07 | 재실행/입력 변경 정책·초보자 로드맵 | 미검증 | 구현 여부 재확인 필요 | 관련 bench files | 브라우저 미검증 | 미검증 |

## G. 원인 제거·기타

| ID | 요구사항 | 이전 상태 | 이번 작업 기록 | 수정 파일 | 테스트/브라우저 증거 | 최종 상태 |
|---|---|---|---|---|---|---|
| R-01 | 최종 원인 좌측 폴라로이드·가설 강조 | 부분 완료 | final verify 구조 확인 필요 | `src/features/verification/VerificationLab.tsx` | 화면 미검증 | 부분 완료 |
| R-02 | 정상 기준 비교와 최종 판정 일관성 | 부분 완료 | state 연결 재검증 필요 | `src/features/verification/VerificationLab.tsx`, `src/main.tsx` | 브라우저 미검증 | 부분 완료 |
| L-01 | 레벨 선택 UI/버튼/상태 전환 | 미검증 | 레벨 선택 QA 경로 확인 | `src/features/levels/LevelSelect.tsx`, `scripts/capture-ui.mjs` | `rework-qa-level-race/01b_level_select.png`, 1600×900 overflow PASS; 상태 전환 조작은 별도 대기 | 구현 완료·검증 대기 |
| L-02 | 미니맵 경로/곡률/플레이어 위치 | 부분 완료 | `trackFrame`에서 경로를 샘플링하고 quadratic path와 동일한 progress 좌표로 마커 배치 | `src/experiences.tsx`, `src/v8.css` | `rework-qa-level-race/25_race_start.png`, 실제 도로 화면·미니맵·자차 마커 캡처 및 overflow PASS | 완료·검증 통과 |
| C-01 | 페이지/패널 스크롤·overflow 금지 | 부분 완료 | fixed 16:9 frame/box sizing 유지 | `src/ui/ScaledFrame.tsx`, `src/ui/final-qa.css`, `scripts/capture-ui.mjs` | 정비소 22개·퍼즐·도미노·실험대·레벨/레이싱 캡처 모두 1600×900 `overflow:[]` | 완료·검증 통과 |
| C-02 | 질문 상단·선지 하단, 공통 버튼/padding | 부분 완료 | 주요 step CSS 확인 필요 | board/puzzle/bench CSS | 전 페이지 미검증 | 부분 완료 |
| C-03 | 폴라로이드 사진 실질 영역 1:1 | 부분 완료 | 사진 창에만 `aspect-ratio: 1 / 1`, 종이 캡션은 별도 영역으로 유지 | `src/p5-ui-fixes.css`, board/bench CSS | 도미노·퍼즐·실험대 캡처와 1:1 CSS 감사 확인 | 완료·검증 통과 |
| C-04 | 팝업 중앙/dim/닫기 및 문서 에셋 | 부분 완료 | bench/puzzle 문서 overlay에 중앙 정렬·dim·닫기 적용 | `src/features/wiring/RefPuzzle.tsx`, `src/features/verification/VerificationLab.tsx` | 퍼즐 계약 및 bench 문서 두 종류 open/close 조작 PASS; 도미노 최종 문서 팝업은 미검증 | 부분 완료 |
| C-05 | 세부 질문 단위 이전/다음·상태 보존 | 부분 완료 | 버튼 텍스트/일부 dispatch 존재 | `src/main.tsx`, stage files | 실제 경계 이동 미검증 | 부분 완료 |

## 검증 명령 기록

| 명령 | 결과 | 비고 |
|---|---|---|
| `npm test -- --run` | PASS | 157 passed / 0 failed |
| `npm run build` | PASS | Vite chunk-size warning만 있음 |
| `npm run assets:check` | PASS | 15 present / 0 missing |
| `npm run crosscheck` | PASS | 11 domains |
| `git diff --check -- src` | PASS | 의도한 소스 범위 기준 |
| 브라우저 `capture-ui.mjs` QA 묶음 | PASS/부분 | 정비소 22조합, 도미노 오답·힌트, 퍼즐 drag/문서, 실험대 입력·문서·3탭, 레벨/레이싱을 1600×900에서 검증; 부품 더블클릭·세부 단계 경계 보존·도미노 전체 정답 경로는 남음 |

이 문서는 잔여 요구사항을 축약하지 않는다. 항목을 완료로 바꾸기 전에 해당 행의 코드 수정·기능 테스트·화면 검증·기술 검증을 갱신한다.
