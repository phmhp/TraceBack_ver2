# 작업 인계

- HEAD: 이 문서가 포함된 최신 커밋
- 공식 추적표(SSOT): `docs/REQUIREMENT_TRACEABILITY_FINAL_2026-11-10.md`
- 2026-11-11 P0 차량 바퀴 축 수정: 현재 HEAD(`467951b`)에는 GLB/GLTF 원본이 없으며 차량은 절차형 Three.js 모델이다. 공용 `HeroConvertible`과 레이싱·후방 거울·경찰·교통차의 `RaceWheel`은 각각 차축 X축 기준으로 이미 정상이다. 다만 첨부 캡처가 가리킨 STEP01 `VehicleLayout` 컨텍스트 차량은 전방이 -X, 좌우 차축이 Z인데 `ContextWheel`이 X축 회전을 사용해 타이어/허브/스포크 면이 전후를 향했다. `VehicleLayout.tsx`에서 타이어는 기본 X/Y 평면, 허브는 Y축 +π/2, 스포크·애니메이션은 Z축으로 통일했다. `CarContext`가 같은 컴포넌트를 네 위치에 반복하므로 전·후·좌·우에 전역 반영된다. macOS Chrome 1536×960 및 1054×723 STEP01 Vehicle/System 실제 렌더에서 좌우 방향과 레이아웃을 확인했다. E/E·Control SW는 차량 컨텍스트 메시를 렌더하지 않으며 기존 전환만 회귀 확인했다.
- 완료: N-01/N-02, P0-A/P0-B, P1-A/P1-B (UI 검증 대기 별도)
- 완료: K-4.1/K-4.3/K-4.4/K-4.5의 공통 수동 신호 단계 보존(부분 구현, UI 검증 대기).
- 완료: FB-P0-02~04 (STEP01 길게 누르기 토글·공통 단계/자동재생·라벨 넘침). 브라우저 UI 검증 대기.
- 완료 · UI 검증 대기: FB-P0-01. STEP02는 좌측 도미노/후보와 우측 전체높이 `관찰·계측 증거 / 추리 보드`를 분리하고, 실제 획득 폴라로이드와 선택 기록 카드만 렌더링한다. 사진 `1:0.97`·전체 카드 `1:1.22`, 상태 보존·증거 부착·판정은 유지한다.
- 공통 프레임 구현 완료 · 헤더 내부 Grid/추격 레일 증분 구현 · 브라우저 QA 대기: UI-RULE-01/N-UI-01/FB-P1-04. 기존 64px 헤더·폴더·탭·본문 시작선 토큰은 보존했다. 제목과 진도 Rail이 10/30/40/20fr의 같은 셀 안에서 경쟁하던 문제를 1101px 이상 `150px / (제목 300~440px + 진행 276~420px) / 138px`, 1100px 이하 `128px / (제목 230px 이상 + 진행 264px) / 132px` 최소폭 Grid로 교체했다. 상단 격차는 실제 `raceDistance`·`policeGapMeters` 계산의 경찰차·자차 미니 레일과 수치로 표시하며, 레이싱 화면은 기존 `PursuitRouteBar`와 동일 `gap` 기반 `RearMirror3D` 깊이 표현을 유지한다. 레이싱 직전 정적 브리핑은 두 열 및 3개 미션 가로 Grid를 명시했다. STEP02 추리 보드/폴라로이드, STEP03 퍼즐, STEP04 시험 로직은 보존했다. 이전 macOS Chrome 1536×960/1054×723 프레임 검증은 이전 헤더 내부 구조에 대한 기록으로 유지한다. 이번 증분의 두 해상도·반복 진입·Windows Chrome QA는 로컬 서버 종료로 미검증이다.
- 부분 구현 · UI 검증 대기: FB-P1-01. 구동 최종 바퀴 회전, 비입력 부품 클릭·hover 선택/신호 정보에 더해, 모든 도메인의 실제 첫 입력·센서 부품은 기존 380ms 길게 누르기로 선택·강조되고 입력 선택/대기 피드백을 표시한다. 겹쳐/나란히/따로 보기의 배치·추가 직접 조작·1054×723 검증은 남는다.
- 완료: FB-P1-02 E/E 신호선을 부품/3D 부품 아래 레이어로 고정하고 화살촉을 축소했으며, `연결·겹쳐·실제 부품`을 본문 우측 상단 `E/E 보기`로 이동(브라우저 UI 검증 대기).
- 완료: FB-P1-03 Control SW 정상·피드백 화살촉 축소와 wire → port → node 레이어 정리, 세 관점 공통 우하단 단계 제어 rail 정렬(브라우저 UI 검증 대기).
- 완료: FB-P1-04 주행 로고·고양이/시간 한 행, 계기판·미니맵 대칭 lane, 추격 거리 아래 BGM·효과음 토글 정렬(브라우저 UI 검증 대기).
- 완료: FB-P1-05 STEP03/04 `테스트 설계서` 표시 통일, 보드 내부 확대 도구, 고정 종이·텍스트 출력 및 우하단 빨간 도장형 확정(브라우저 UI 검증 대기).
- 완료: FB-P1-06 WANTED 기본 2사건 CASE 1→CASE 2→최종 결과 페이지, 실제 STEP02~04 기록·건너뛸 수 있는 우측 타이핑(브라우저 UI 검증 대기).
- 완료: FB-P1-07 STEP04 최초 가설 검증→SW 수정→동일 조건 기준선 비교→주행 복귀, 자동 회귀 목록 제거(브라우저 UI 검증 대기).
- 남은 요구사항: FB-P1-01 잔여 도메인 직접 조작·라벨/배치 → K-5/L-4.2 → K-6/K-7/L-5.2/L-6.3/L-7~L-9 → FB-P2-01~06/P2 L-2.x. N/P0/P1/K-4/FB-P0/UI-RULE-01/FB-P1-01~07 연결 브라우저 UI 검증 대기.
- 마지막 수정: `src/ui/game-shell.tsx`, `src/experiences.tsx`, `src/features/board/EeTrace.tsx`, `src/features/wiring/RefPuzzle.tsx`, `src/features/verification/VerificationLab.tsx`, `src/features/cutscenes/StaticCutscenes.tsx`, `src/p4-fix-1109.css`, `docs/REQUIREMENT_TRACEABILITY_FINAL_2026-11-10.md`, `WORK_HANDOFF.md` (이번 P0 감사는 문서만 갱신, 3D 코드·에셋 변경 없음)
- 검증: 2026-11-11 P0 바퀴 축 감사에서 nvm Node `v20.20.2`/npm `10.8.2`로 `npm test`와 `npm run build`를 각각 1회 실행했다. 테스트는 49개 중 45개 통과·4개 실패이며, 실패 원인은 `tests/image-prompts.test.mjs`·`part-models.test.mjs`·`sim.test.mjs`가 `src/sim/components.ts`를, `vehicle.test.mjs`가 `src/features/vehicle/bake.ts`를 Node 기본 ESM loader로 직접 import해 `ERR_UNKNOWN_FILE_EXTENSION`이 난 기존 러너 설정이다. 빌드는 `node_modules/.bin/tsc: Permission denied`로 타입 검사 시작 전에 중단됐다. 브라우저는 로컬 `127.0.0.1:5180`에서 macOS Chrome 1536×960 공용 차량 쇼룸 및 CHASE_NORMAL, 1054×723 STEP01 Vehicle/System·E/E·Control SW를 실제 확인했다. 기존 Chrome 탭(`localhost:5180`) 오류 및 과거 UI 프레임 QA 기록은 보존한다.
- 다음 작업: 기능 P0는 T-25(플레이어 가설 자동 덮어쓰기) → T-24(STEP03 계약의 실제 모델 입력 연결) → T-22(수리 선택의 모델 효과) → T-01/T-08(thermal 정답 기준/PWM 정합) 순서로 수정·실행 검증한다. UI 작업을 재개할 때는 개별 N-S02/N-S03/N-S04보다 먼저 UI-RULE-01/N-UI-01의 공통 헤더·폴더 연결부·본문 시작선·하단 80/20을 하나의 토큰 계약으로 정규화하고, STEP02 보드는 재배치하지 않는다. 이후 두 macOS 해상도와 Windows Chrome(L-9.3)에서 비교 QA한다.

## 2026-11-11 공통 UI 잔여 복구 / 설계 기준선

- 완료한 범위: `UI-RULE-01`/`N-UI-01`/`L-9` 공통 폴더 표면·탭 token과 STEP03·04 하단 CTA 충돌을 최소 CSS로 복구했다. STEP04 완료 CTA는 기존 `BENCH_RESULT` 동작을 유지한 채 하단 안내 슬롯으로 옮겼다. `DriveBriefing` 1/2·2/2 카드의 공통 최소 높이와 CTA 기준선을 맞췄다. 실제 추격차 미니 레일은 `21d17b8`부터 실제 거리 상태를 쓰는 기존 구현임을 재확인했다.
- 설계 자료: `docs/STEP02_STEP04_FLOW_BASELINE_2026-11-11.md` — STEP02·04의 실제 상태/행동/질문/판정/전이/전달 데이터와 향후 결정 항목만 기록했다. 게임 흐름·추리/시뮬레이션 판정은 바꾸지 않았다.
- 검증: `npm test` 69/69 통과, `npm run build` 통과. Windows Chrome UI QA는 컴퓨터 사용 연결의 URL 정책 확인 실패로 **미검증**이다. 빌드가 `dist/` 산출물을 갱신했으나 사용자 작업으로 보존하고 커밋하지 않는다.
- 남은 우선순위: 기능 P0 `N-TECH-01/T-25` → `N-TECH-02/T-24` → `T-22` → `T-01/T-08`; 이후 N-S02/N-S03/N-S04 내부 작업대 설계를 사용자 승인 후 별도 진행한다. 실제 UI QA(1536×960, 1054×723)는 Windows Chrome 연결이 가능할 때 수행한다.

## 2026-11-11 상단 헤더·제목 박스 보정

- 구현: `GameHeader`의 `chapterChip` DOM을 제거하고 모든 사용 장면의 8단계 `JourneyProgress` rail을 로고 오른쪽 `clamp(520px, 46vw, 680px)` 폭으로 배치했다. rail은 가로 flex로 복원해 `NOW · n/8`과 현재 단계명이 카드 아래로 내려가지 않는다. `GarageExperience`는 추격 거리 props를 전달하지 않아 차고지에서 추격 HUD가 DOM/레이아웃에 포함되지 않는다. 주행·조사·수리 장면은 기존 실제 거리 기반 `headerPursuitGraphic`을 `clamp(220px, 18vw, 280px)` 가로 레일로 유지한다.
- 구현: STEP01~04 공통 제목 박스의 장식용 `.stageFolderSubtitle::before` 돌출부를 제거했다. 본문·단계 이동 탭·제목 내용은 유지한다.
- 검증: `npm test` 69/69 통과, `npm run build` 통과. 실제 Chrome CDP에서 1440×765 rail 662px, 강제 1054×723 rail 520px·수평 오버플로 없음과 도주 장면 `NOW · 2/8` 한 행 배치를 확인했다. 1536×960 실제 창 및 다른 STEP 화면은 추가 검증 대기다.
- 다음 작업: Windows Chrome에서 헤더 8단계 rail, 차고지 HUD 숨김, 주행 HUD 거리 연동, 제목 박스/이전 단계 탭 및 수평 오버플로를 실제 확인한다. 이후 기능 P0 `T-25 → T-24 → T-22 → T-01/T-08` 순서를 유지한다.
