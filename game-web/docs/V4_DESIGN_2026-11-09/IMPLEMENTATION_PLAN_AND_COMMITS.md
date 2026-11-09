# 구현 계획과 커밋 단위

## 전제

- 사용자 승인 전 런타임 소스·데이터·레이아웃·자산을 수정하지 않는다.
- 현재 working tree의 사용자 미커밋 변경을 보존하고 먼저 범위·diff를 확인한다.
- 구현은 한 기능군씩 `구현 → 실행 → 회귀 테스트 → Chrome 1054×723 캡처 → 커밋`한다.
- 각 의미 있는 변경 후 `npm test`, `npm run build`, `npm run check:independence`를 통과시킨다.

## 단계

| 단계 | 작업 | 주요 예상 파일 | 재사용 | 통과 기준 | 권장 커밋 |
|---|---|---|---|---|---|
| 0 | 감사 기준선·요구 추적 승인 | `docs/V4_DESIGN_2026-11-09/*` | 현재 캡처/감사 | 승인된 결정·보류 항목 명확 | `chore: add V4 design and audit baseline` |
| 1 | 공통 프레임·버튼·레이어 토큰 | `src/experiences.tsx`, CSS 계층 | 현 관점 탭/도메인 카드 | 세 관점 bbox 동일, 이동·겹침 없음 | `refactor: unify vehicle learning layout` |
| 2 | OFF→READY 대표 구동 상호작용 | `src/experiences.tsx`, `src/sim/*` | 기존 차량/흐름 모델 | 상태·신호·에너지·토크가 조건에 맞게 활성 | `feat: connect propulsion state and flow` |
| 3 | E/E 물리 배치·포트 연결 | `EeBlueprint` 관련, assets | 기존 E/E/차량 자산 | 논리 노드–부품–포트 추적 가능 | `feat: map E/E nodes to physical components` |
| 4 | 도미노 우측 증거·촉각 메모판 | `EeTrace.tsx`, Domino/Suspect 구성 | 폴라로이드, 도미노, 보드 | 1054px 라벨 보존, 최초 편차와 후보 분리 | `feat: restore evidence investigation board` |
| 5 | STEP 02→03→04 타입 계약 | runtime, scenario, puzzle, lab | 현 scene machine/session | 계획이 버전 계약으로 정확히 전달 | `refactor: add typed investigation experiment contract` |
| 6 | STEP 03 사건별 실험 퍼즐 | `RefPuzzle.tsx`, scenario data | 블록/소켓/카드 | 3사건 계획 생성, 부분 유효 피드백 | `feat: adapt puzzle to experiment planning` |
| 7 | STEP 04 실제 실행·복수 경로 | `VerificationLab.tsx`, `simModel.ts` | TwinBench/그래프 | 동일 조건 비교, 결과/가설 분리, 판정 불가 | `feat: execute multiple valid verification paths` |
| 8 | 조치·확인·회귀 루프 | runtime/result UI | 현 결과 화면 | 동일 조건 재시험 및 회귀 결과 저장 | `feat: add repair confirmation and regression loop` |
| 9 | 시나리오 스키마 마이그레이션 | `src/game/scenarios*`, `src/sim/*` | 3 기존 사건 | 새 사건 데이터 추가 가능, 참조 검증 | `refactor: separate scenario data from game engine` |
| 10 | 통합 QA·문서 | tests, captures, docs | 기존 QA 도구 | Chrome 전체 장면 캡처, 콘솔/UX 결함 기록 | `test: add regression checks and final QA captures` |

## 위험과 대응

- CSS 다층 오버라이드: 새 규칙 추가 전 실제 적용 순서와 소유자를 정리한다.
- live board와 legacy Domino 병존: 삭제하지 않고 현재 라우팅을 기준으로 필요한 상호작용만 이식한다.
- 세션 문자열 계약: 먼저 호환 읽기 계층을 넣고 타입 계약으로 전환한다.
- 시뮬레이션 가짜 표현 위험: 모델에 없는 관찰/고장은 UI에 노출하지 않는다.
- 기존 dirty tree 충돌: 승인 후 사용자 변경 처리 방식을 먼저 확인하고 관련 파일만 좁게 수정한다.

## 미완료 기록 형식

`요구 ID / 현재 상태 / 미완료 이유 / 영향 / 안전한 다음 작업 / 재현·검증 방법`을 남기며 요구를 삭제하지 않는다.
