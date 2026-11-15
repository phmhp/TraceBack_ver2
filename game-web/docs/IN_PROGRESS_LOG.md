# 진행 로그 (Codex·다음 세션이 바로 이어받기 위한 문서)

규칙: 작업 단계가 끝날 때마다 아래 "현재 작업"과 "다음 할 일"을 갱신하고 커밋한다. 작업이 중간에 끊겨도 이 문서만 보면 이어갈 수 있게 한다.
미리보기: `.claude/launch.json`의 `game-web-v3`(포트 5183). 기본 `game-web`은 옛 폴더를 띄운다. 검증은 1600x900.

## 완료 (커밋됨, 2026-11-15)
- 도미노(STEP02) 개편, 실험대(STEP04) 3단계, 정비소 3영역 공개, 퍼즐 안내·폴더 설계서, 규칙 R18~R23.
- 상태: `npx tsc --noEmit` 오류 없음, `npm test` 135 통과.

## 현재 작업
- 사건 `gear`(C04 변속 폴백, 시트 `docs/fault-cases/c04_gear_fallback.md`) 구현 시작 전. 방법: `src/game/runtime.ts`의 `CaseId`에 `"gear"` 추가 → `npx tsc --noEmit`이 알려 주는 `Record<CaseId,…>` 표를 전부 채움 → `EeTrace.tsx`의 `Record<string,…>` 표(LAMP, QUOTE, TRACE, OBSERVED, REPLAY, SUBSYS)도 채움(tsc가 못 잡음).
- 주의: `CaseId`만 추가하고 멈추면 tsc 오류 60여 곳이 생긴다. 그 상태로 커밋하지 말 것(작은 단위로 끝까지 채운 뒤 커밋).

## gear 구현 진행 (tsc 오류 0, 테스트 140 통과, 브라우저 검증 완료: STEP02 도미노, STEP03 퍼즐, STEP04 실험대 → 수리 장면)
- 완료: CaseId `gear`, 레벨 6(finale은 7로 이동, 허브 7노드), `simModel`(gear 모델·VIEW, 관찰 0.35초), `scenarios`, `verificationContract`, `VerificationLab` 표 전부, `RefPuzzle`(블록 조립 UI로 구현), `experiences`, `DominoBoard/Trace`, `EeTrace`, `CaseFileEnding`, `OpenBook`, `DevMenu`, 이미지 프롬프트 3장, 레이스 고장 `GEAR_FAULT`(faultSchedule, 이벤트 gearChange 0.8초 창, reverseOnly 0.5초 버스트, 두 번째 발생 때 FAULT_CUE), 테스트 `tests/gear-case.test.mjs`.
- 남음 gear: (1) 레이스 화면은 로드·안내 카드 확인함(실제 주행 트리거는 단위 테스트로 검증, 브라우저 rAF 정지로 플레이 확인 못 함) (2) 신호 경로 UI는 1차 구현 완료(`ref.ui: "path"` → 노드 박스 + CAN 버스 막대). 더 다듬으려면 `puzzle-v3.css`의 `.pathMode`/`.rpBus` 수정 (3) 사용자 이미지 대기: 변속 레버·게이트웨이 부품 사진(임시로 accel_pedal/can_harness/diagnostic_port 썸네일 사용), 증거 3장(`motor_reverse_log`, `dtc_gear_timeout`, `bus_load_scope`).
- 기억할 점: 벤치 QA 기본 입력(`qaDeriv`)은 gear만 항상 `reqa`(버스 부하 85 %). 3D 벤치 부품 id는 `gear_selector`(포트 gear_out → VCU gear_in).

## 레벨별 엔딩 (완료, 단위 테스트 통과, 브라우저는 허브만 확인)
- `runtime.ts`: `levelFinish`, `START_LEVEL`에서 거리 0 초기화, `APPLY_REPAIR` → `CHASE_RESUME`(levelFinish), `NEXT_LEVEL`. `experiences.tsx`: `finishRun`으로 고장·증상·구간 카드 끄고 1700 m에서 `START_FINAL_ESCAPE`. `CaseFileEnding`: levelFinish면 "다음 레벨 →". `LevelSelect`: finale 노드 숨김, 6노드.
- 확인 못 한 것: 실제 주행(브라우저 rAF 정지)으로 수리 → 1700 m → 엔딩 → 다음 레벨 전체 플레이. 사용자가 한 번 플레이해 확인 필요. 특히 레벨 2에서 열관리 고장(1300 m)까지의 주행 시간.

## C06 `cold` 구현 진행 (사용자 승인 2026-11-15, 자리 비움 중 7시까지 자율 진행)
- 시트 `docs/fault-cases/c06_cold_regen_limit.md`. 레벨 7(선택), 마지막 탈출은 8로 이동. 절차는 C04(`gear`)와 동일: CaseId 추가 → tsc 표 채우기 → EeTrace 문자열 표 → main.tsx QA 허용 목록/DevMenu → 레벨·runtime·레이스 고장 → 테스트.
- 진행: [x] sim/scenarios [x] contract+VerificationLab [x] RefPuzzle/Domino/Ending/OpenBook/EeTrace [x] levels(7레벨, finale 8)/runtime/faultSchedule(COLD_FAULT, regenScale)/experiences [x] tests/cold-case.test.mjs(147 통과) [ ] 브라우저 검증(STEP02~04, 허브 7노드) [ ] 문서 마무리
- 임시 이미지: 증거 3장(`cold_decel_log`, `regen_limit_compare`, `battery_temp_view`) 미제작, 부품은 기존 썸네일(`bms`, `brake_ecu`, `can_harness`, `traction_motor`, `motor_temp_sensor`, `brake_caliper`) 사용

## 다음 할 일 (순서)
1. gear 사건 표 채우기(STEP02/03/04, 시나리오, 계약, 엔딩, 오픈북).
2. 신호 경로 선택 퍼즐 UI(`RefPuzzle.tsx`), 시트 7절.
3. 네트워크 수치 모델(`simModel.ts`)과 레이스 고장(`faultSchedule.ts` `launch` 시점 + 변속 경과 시간).
4. 테스트(`tests/ready-case.test.mjs` 참고), 1600x900 검증, 문서 갱신.
5. (완료) 레벨별 해적선 엔딩 흐름.
6. (완료) 상태 전이도 채우기 유형: C01 `ready`를 `ui: "state"`로 배정. 도메인 수준 사건 C06 시트 초안 작성(`fault-cases/c06_cold_regen_limit.md`), 사용자 승인 후 구현(C04 구현 절차와 같은 순서).
