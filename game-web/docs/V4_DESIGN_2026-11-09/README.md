# TraceBack V4 설계 패키지

상태: 구현 전 사용자 검토용. 이 패키지는 런타임 소스·스타일·에셋·데이터를 수정하지 않고 작성했다.

## 대상 잠금

- 유일한 대상 저장소: `C:\Users\user\OneDrive\Desktop\261103codex\game-web`
- 대상 앱: `http://127.0.0.1:5173/`
- 확인 당시 5173 포트의 Vite 프로세스도 위 저장소의 `node_modules/vite`를 가리켰다.
- 다른 `vehicle-logic-lab-v2`, 상위 저장소, 별도 로컬 앱은 대상이 아니다.
- 매 작업 시작 시 `TARGET_LOCK.md`의 확인 절차를 먼저 수행한다.

## 우선순위

1. 첨부 프롬프트 PART K
2. PART H와 A/B/D의 비충돌 요구
3. 보존 부록 G의 세부 요구
4. PART C는 문서가 명시한 폐기안이므로 구현 범위 결정에 사용하지 않음

## 핵심 해석

- Automotive SPICE, ISO 26262, ISTQB는 개발·검증 활동을 설명하는 근거다.
- 화면 순서, 버튼, 카드, 보상, 튜토리얼은 교육 효과와 플레이 경험을 기준으로 설계한다.
- 표준 프로세스와 게임의 네 단계를 1:1로 동일시하지 않는다.
- 사용자 승인 전에는 구현하지 않는다.

## 산출물

- 조사: `CURRENT_IMPLEMENTATION_MAP.md`, `CURRENT_IMPLEMENTATION_AUDIT.md`
- 화면·상태: `TRACEBACK_SCREEN_SPEC_V3.md`, `SHARED_ABSTRACTION_LAYOUT_SPEC.md`, `VEHICLE_STATE_AND_SIGNAL_FLOW.md`, `INTERACTION_AND_STATE_MODEL.md`, `EE_PHYSICAL_LAYOUT_SPEC.md`, `DOMINO_RIGHT_EVIDENCE_PANEL_SPEC.md`
- 교육·표준: `STANDARD_TRACEABILITY_MATRIX.md`, `VERIFICATION_EDUCATION_MODEL.md`, `VERIFICATION_LEVELS_AND_GAME_FLOW.md`, `FOUR_STAGE_LEARNING_AND_GAMEPLAY_MAP.md`
- 퍼즐·검증: `STEP03_EXPERIMENT_PUZZLE_SPEC.md`, `VERIFICATION_EXECUTION_MATRIX.md`, `MULTIPLE_VALID_TEST_PATHS.md`, `SIMULATION_UI_WIREFRAME_V2.md`
- 데이터·실행: `SCENARIO_DATA_SCHEMA.md`, `IMPLEMENTATION_PLAN_AND_COMMITS.md`, `HALF_DAY_IMPLEMENTATION_PLAN.md`
- 통제: `TARGET_LOCK.md`, `SOURCE_PROMPT_MANIFEST.md`, `REQUIREMENT_TRACEABILITY.md`, `APPROVAL_SUMMARY.md`

