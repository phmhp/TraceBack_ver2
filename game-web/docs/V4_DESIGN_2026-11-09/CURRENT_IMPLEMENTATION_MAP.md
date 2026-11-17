# 현재 구현 맵

대상은 `C:\Users\user\OneDrive\Desktop\261103codex\game-web`의 `traceback-game-web` 패키지와 이 저장소가 실행한 `http://127.0.0.1:5173/` 앱으로 고정한다.

## 런타임과 장면

| 영역 | 현재 파일 | 현재 역할 |
|---|---|---|
| 캠페인 상태 | `src/game/runtime.ts` | `TITLE`부터 `ENDING/CAUGHT`까지 장면, 사건, 증거, 가설, 프로그램, 추격 상태를 관리 |
| 장면 라우팅 | `src/main.tsx` | 차고, 주행, BOARD, WIRING, TWIN_BENCH, 수리, 엔딩을 실제 컴포넌트에 연결 |
| 차고·주행 | `src/experiences.tsx` | 7개 도메인, 3개 관점, 입력 미션, 3D/2D/SW 흐름, 레이스와 고장 발생 |
| 사건 정의 | `src/game/scenarios.ts` | 구동·열관리·제동의 증상, 근본 원인 ID, 증거, 가설, 고장 주입 설명 |

현재 플레이 순서는 `차고 → 주행 → 도미노/원인 역추적 → 요구사항 퍼즐 → 검증 → 수리·재주행`이다. 교육용 핵심 네 단계는 차고, BOARD, WIRING, TWIN_BENCH다.

## STEP 01 차량 도메인 원리

- `GarageExperience`는 `experiences.tsx`에 있다.
- 도메인: `drive`, `brake`, `steer`, `power`, `gear`, `thermal`, `suspension`.
- 관점: Vehicle/System, E/E Architecture, Control Software.
- `EeBlueprint.tsx`는 E/E 연결/겹쳐/실제 부품 뷰를 제공한다.
- `VehicleLayout.tsx`, `partModels.ts`, `PartModel.tsx`는 차량/부품과 포트 앵커를 제공한다.
- `SimulinkDiagram.tsx`는 Control Software 흐름을 제공한다.
- `INPUT_MISSION`, `conds`, `activeStep`, `applyState`가 조건 충족과 순차 흐름을 관리한다.
- 현재 공통 차량 시뮬레이션 상태와 차고 입력 상태는 완전히 같은 모델이 아니다. 차고는 교육용 로컬 상태가 중심이다.

## STEP 02 도미노 원인 역추적

- 현재 `main.tsx`의 BOARD는 `EeTraceV2`를 `EeTrace`라는 이름으로 마운트한다.
- `EeTrace.tsx`는 폴라로이드 증거, E/E 판, 후보/가설 축소를 제공한다.
- `DominoTrace.tsx`, `DominoBoard.tsx`, `SuspectBoard.tsx`는 저장돼 있으나 현재 BOARD 진입점에는 마운트되지 않는다.
- 현 UI는 좌측 증거 레일이므로 최신 요구의 우측 고정 증거 패널과 다르다.
- QA에서 1054×723 기준 카드 제목 말줄임과 해결 후 증거 밀집 문제가 확인됐다.

## STEP 03 요구사항 기반 퍼즐

- `src/features/wiring/RefPuzzle.tsx`가 라이브 구현이다.
- 사건별 블록, 요구사항, 함정, 연결, 기대값, 액추에이터 반응을 제공한다.
- 결과는 `sessionStorage`의 `tb-expect-<case>` 등에 저장돼 검증 단계가 읽는다.
- 현재 구조는 재사용 가치가 높지만, 가설 유형별 실험 설정 데이터가 명시적 계약으로 분리돼 있지 않다.

## STEP 04 시뮬레이션 검증

- 라이브 컴포넌트는 `TwinBenchExperience`이다.
- `simModel.ts`는 5ms 모델 스텝으로 정상/고장/수정 결과를 계산하고 120개 샘플을 만든다.
- 레벨 타입은 `unit | swint | embedded | vehicle`, 접근 타입은 `req | replay | boundary | soak | inject`다.
- 탭은 SW 로직, 제어기·I/O, 부품·차량, 신호 그래프다.
- 시험 결과 `PASS/FAIL/INCONCLUSIVE`와 가설 판단 `가능성 높음/낮음/아직 모름`을 분리한다.
- 현재 UI는 시험 카드 선택이 강하고, STEP 03에서 만든 목적·조건·관찰 계약을 명시적으로 이어받는 구조는 제한적이다.

## 시뮬레이션·3D·에셋

- `src/sim/vehicleSim.ts`: 차량 상태, 고장 훅, 추적 로그.
- `src/sim/components.ts`, `registry.ts`: 부품/연결/ECU 레지스트리.
- `src/features/parts/partModels.ts`: 코드 제작 부품과 포트.
- `public/assets`: 자체 제작/기존 TraceBack 이미지와 폴라로이드 자료.

## 스타일과 테스트

- CSS는 `style.css`, `v5`~`v18`, `p0`~`p4`가 누적 적용된다. 후순위 파일이 많은 규칙을 덮어쓴다.
- 테스트는 런타임, 시뮬레이션, 차량, 부품, 이미지 프롬프트, 흐름 계약을 다룬다.
- 기존 작업 트리는 이미 수정 상태다. 2026-11-09 재확인 시 추적 소스 변경은 `src/features/verification/VerificationLab.tsx`, `src/p4-fix-1109.css`였고 Vite 캐시·`tsconfig.tsbuildinfo`·기존 QA 산출물도 변경/추가 상태다. 모두 사용자 변경으로 간주해 보존하며, 구현 시작 직전에 다시 상태를 확인한다.

