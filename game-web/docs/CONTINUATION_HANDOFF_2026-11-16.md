# TraceBack v3 이어서 작업 인수인계 — 2026-11-16

## 문서 목적

다른 컴퓨터에서 같은 기준으로 이어서 작업하기 위한 요청·답변 형식의 요약이다. 대화 중 감정적 표현은 제외하고, 플레이어에게 보이는 동작·레이아웃·모델링·검수 요구만 기록한다.

## 현재 기준

- 작업 저장소: `TraceBack_ver2-v3/game-web`
- 비교 기준: `/Users/hyemin/Desktop/tracebackver2/TraceBack_ver2-stable/game-web`
- live STEP02/03/04 연결점: `main.tsx`의 `EeTraceV2`, `RefPuzzle`, `VerificationLab`
- stable 코드는 통째로 복사하지 말고 live 컴포넌트와 CSS를 비교해 필요한 UI만 이식한다.
- 수정 순서: 한 사건 기준 데이터 확인 → 구현 → 화면별 대조 → 활성화 전수 검수 → 문서 갱신.

## 요청 → 반영 및 남은 확인

### 1. EV 정비소 모델

요청: 차량 플랫폼 기준으로 배터리 팩, 충전 포트, 바퀴, 센서, 모터·인버터, 코일 스프링, 랙 앤 피니언의 실제 장착 위치·크기·회전축을 제3자 시점에서 검수한다. 배터리는 시트 아래 바닥 전체에 가깝게 보이고, 충전 포트는 차체 측면 장착 방향이어야 한다. 전체 보기 기본 상태는 배선을 숨겨야 한다.

반영: `VehicleLayout.tsx`의 공통 `PLACE` 기준을 사용하고, 배터리 팩 목표 크기를 키웠으며 충전 포트 회전을 90도 기준으로 조정했다. 전체 보기에는 도메인 체인에서 빠질 수 있는 필수 물리 부품을 보강했다.

남은 화면 확인: 전체 보기 겹쳐보기에서 부품이 차체와 겹치지 않는지, 앞쪽 모터룸·객실·바닥 배터리·측면 충전 포트·휠/현가·조향 랙의 상대 위치가 자연스러운지 실제 브라우저에서 확인한다. 이후 포트 대 포트 배선은 부품 배치가 확정된 뒤 연결한다.

### 2. 주행 추격 HUD

요청: 정비소·레벨 선택·레이싱 최초 출발 시 추격차 거리/접근 표시를 보이지 않는다. 실제 추격이 시작된 뒤에만 표시한다.

반영 기준: 공통 `GameHeader`는 정비소와 레벨 선택에서 거리를 넘기지 않으며, 레이스 HUD는 추격 시작 조건과 최소 주행 시간을 함께 검사한다.

남은 화면 확인: 정상 주행 시작 직후에는 경찰 접근 배너와 거리 HUD가 없고, 추격 시작 이후에만 나타나는지 확인한다.

### 3. 도미노

요청: 단계 명칭을 “도미노”로 통일하고, 영향 있음/없음 판단은 ↑/↓ 방향키와 화면 버튼 방향을 일치시킨다. 운전자 진술을 초기 폴라로이드로 보여주고, 증거 탭에는 플레이어가 이상으로 판정한 기록만 쌓는다. 의심 구간 구조는 우측 탭에만 두지 말고 본문에서 경로·하이라이트로 인식시킨다. 우측 패널은 사용 가능한 너비를 전부 사용해 글자가 세로로 찢어지지 않아야 한다.

반영: 키 입력을 ArrowUp/ArrowDown으로 변경했고, “도미노 역추적” 노출명을 “도미노/도미노 판”으로 정리했다. 운전자 진술 폴라로이드를 초기 증거에 추가했고, 본문 노드·경로의 불필요한 opacity/filter를 제거했다. 기본 증거 패널의 줄바꿈과 폴라로이드 이미지는 contain 기준을 적용했다.

남은 화면 확인: 첫 편차 출력 → 첫 편차 신호 → 의심 구간 → 가설 후보가 한 번에 겹치지 않고, 의심 구간 선택 시 본문에서 구조 경로가 강조되는지 확인한다. 후보 카드 hover 시 윗부분이 잘리지 않는지 확인한다.

### 4. 퍼즐

요청: 퍼즐 조각은 하단 영역에 두고, 본문에는 조작 설명을 남기지 않는다. 조각은 최대한 정사각형에 가깝게 보이며, 반드시 하단에서 본문 빈칸으로 드래그 앤 드롭한다. 빈칸을 클릭해 적용하는 동작은 허용하지 않는다. stable의 시험 설계서 폴더 UI를 기준으로 한다.

반영: 본문 spare tray의 조작 문구를 숨기고 하단 선택 영역에 남겼다. 하단 조각을 near-square 카드로 조정했으며, 빈칸 클릭 적용을 제거하고 pointer drag로만 배치하도록 변경했다.

남은 화면 확인: 포인터를 조각 위에 올렸을 때 카드 상단이 잘리지 않는지, 빠르게 드래그해도 빈칸에 정확히 들어가는지, 설계서 탭/폴더 보기에서 테이블이 넘치지 않는지 확인한다.

### 5. 실험대/검증

요청: “유력한 가설”은 하단 질문·선지 영역에서 선택하고 본문은 시험 수준과 시각화에 집중한다. 시각화와 그래프는 세로로 늘어뜨리지 말고 좌우로 배치한다. 정상 모델·고장 모델·원인 제거 모델을 구분해 안내하고, 시험 결과와 판단 가능/불가 이유를 보여준다. 시험 설계서와 고장 기록은 문서형 팝업으로 연다.

반영: 기존 문서 팝업과 모델 설명을 유지하면서, live 검증 레이아웃에서 시각화와 모니터링 그래프를 좌우 영역으로 배치하도록 CSS를 보강했다.

남은 화면 확인: 초기 가설 선택, 시험 수준 선택, 실행 중, 재생바 이동, 결과/판정불가, 원인 제거 비교, 설계서·고장 기록 팝업을 모두 열어 텍스트 겹침과 overflow를 확인한다.

## 내일 새 컴퓨터에서 먼저 읽을 파일

### 반드시 읽기

1. `CLAUDE.md`
2. `docs/IN_PROGRESS_LOG.md`
3. `docs/CONTEST_V3_HANDOFF.md`
4. `docs/DESIGN_DECISIONS_V3.md`
5. `docs/FEEDBACK_2026-11-15_B.md`
6. `docs/PLAYER_FLOW_AUDIT_2026-11-15.md`
7. `docs/fault-cases/README.md`
8. `docs/fault-cases/RULES.md`
9. `docs/fault-cases/CHECKLIST.md`
10. `docs/fault-cases/TEMPLATE_CASE_SHEET.md`

### 현재 live 구현

- `src/features/garage/VehicleLayout.tsx`
- `src/features/garage/EeBlueprint.tsx`
- `src/features/board/EeTrace.tsx`
- `src/features/board/step02-v3.css`
- `src/features/wiring/RefPuzzle.tsx`
- `src/features/wiring/puzzle-v3.css`
- `src/features/verification/VerificationLab.tsx`
- `src/features/verification/bench-v4.css`
- `src/experiences.tsx`
- `src/main.tsx`

### stable 비교 자료

- `stable/game-web/WORK_HANDOFF.md`
- `stable/game-web/CODEX_REFACTOR_MASTER.md`
- `stable/game-web/docs/REQUIREMENT_TRACEABILITY_FINAL_2026-11-10.md`
- `stable/game-web/REPORTS/SCREEN_QA.md`
- `stable/game-web/REPORTS/GAME_FLOW_QA.md`
- `stable/game-web/src/features/board/EeTrace.tsx`
- `stable/game-web/src/features/wiring/RefPuzzle.tsx`
- `stable/game-web/src/features/verification/VerificationLab.tsx`
- `stable/game-web/src/v5.css`, `v6.css`, `v8.css`, `v5-fixes.css`, `v5-board.css`, `v5-lab.css`

## 전수 검수 체크 순서

1. 레벨 선택: 카드 hover, 시작 버튼, 우측 문제 설명과 이미지, 개발 메뉴.
2. 정비소: 전체 보기/겹쳐보기, 도메인 선택, 네 개 레이어, 모델 hover·click·double-click, 배선 on/off.
3. 주행: 최초 출발, 추격 시작 전후, 고장 사건, 레이스 종료.
4. 도미노: 초기 증거, 출력 선택, 후보별 ↑/↓, 의심 구간 본문 강조, 가설 후보, 다음 버튼.
5. 퍼즐: 조각 hover, 드래그 시작·이동·놓기·취소, ? 설명, 실행, 설계서 탭, 폴더 보기.
6. 실험대: 가설 선택, 시험 수준 선택, 실행, 그래프 scrubber, 결과, 판정불가, 재검증, 문서 팝업.
7. 수리·주행 복귀: 중복 버튼, 결과 화면, 다음 레벨 전환.

각 상태마다 플레이어가 볼 수 있는 모든 문구가 박스 밖으로 나가지 않는지, 카드가 서로 겹치지 않는지, hover/focus/disabled 상태가 동일한 공통 버튼 규격을 사용하는지 확인한다.
