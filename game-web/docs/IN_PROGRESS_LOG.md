# 진행 로그 (Codex·다음 세션이 바로 이어받기 위한 문서)

규칙: 작업 단계가 끝날 때마다 아래 "현재 작업"과 "다음 할 일"을 갱신하고 커밋한다. 작업이 중간에 끊겨도 이 문서만 보면 이어갈 수 있게 한다.
미리보기: `.claude/launch.json`의 `game-web-v3`(포트 5183). 기본 `game-web`은 옛 폴더를 띄운다. 검증은 1600x900.

## 완료 (커밋됨, 2026-11-15)
- 도미노(STEP02) 개편, 실험대(STEP04) 3단계, 정비소 3영역 공개, 퍼즐 안내·폴더 설계서, 규칙 R18~R23.
- 상태: `npx tsc --noEmit` 오류 없음, `npm test` 135 통과.

## 현재 작업
- 사건 `gear`(C04 변속 폴백, 시트 `docs/fault-cases/c04_gear_fallback.md`) 구현 시작 전. 방법: `src/game/runtime.ts`의 `CaseId`에 `"gear"` 추가 → `npx tsc --noEmit`이 알려 주는 `Record<CaseId,…>` 표를 전부 채움 → `EeTrace.tsx`의 `Record<string,…>` 표(LAMP, QUOTE, TRACE, OBSERVED, REPLAY, SUBSYS)도 채움(tsc가 못 잡음).
- 주의: `CaseId`만 추가하고 멈추면 tsc 오류 60여 곳이 생긴다. 그 상태로 커밋하지 말 것(작은 단위로 끝까지 채운 뒤 커밋).

## gear 구현 진행 (tsc 오류 0, 테스트 135 통과 상태로 커밋)
- 완료: CaseId `gear`, 레벨 6(finale은 7로 이동, 허브 7노드), `simModel`(gear 모델·VIEW), `scenarios`, `verificationContract`, `VerificationLab` 표 전부 + `exercisesFaultPath`(gap 기준), `RefPuzzle`(블록 조립 UI로 먼저 구현: 레버·게이트웨이·CAN·수신 표 A/B·함정 직결/마지막 값 유지), `experiences`, `DominoBoard/Trace`, `EeTrace` 문자열 표, `CaseFileEnding`, `OpenBook`, `DevMenu`, 이미지 프롬프트 3장(motor_reverse_log, dtc_gear_timeout, bus_load_scope).
- 남음 gear: (1) 레이스 고장 `GEAR_FAULT`(faultSchedule: launch 시점 + 변속 후 경과 시간 FaultContext 필드, reverseOnly 0.5초) (2) 신호 경로 선택 UI(RefPuzzle에 새 모드, 현재는 블록 조립 UI로 동작) (3) 브라우저 검증(`?embed=1&qa=BOARD&case=gear` 등) (4) gear 전용 테스트 파일 (5) 증거 이미지·시프터/게이트웨이 부품 이미지는 사용자 제작 전까지 기존 썸네일로 대체(USER_TODO).
- 주의: 이미지 대체 — 변속 레버는 `accel_pedal.png`, 클러스터/진단은 `diagnostic_port.png`, 게이트웨이는 `can_harness.png`를 임시로 사용.

## 다음 할 일 (순서)
1. gear 사건 표 채우기(STEP02/03/04, 시나리오, 계약, 엔딩, 오픈북).
2. 신호 경로 선택 퍼즐 UI(`RefPuzzle.tsx`), 시트 7절.
3. 네트워크 수치 모델(`simModel.ts`)과 레이스 고장(`faultSchedule.ts` `launch` 시점 + 변속 경과 시간).
4. 테스트(`tests/ready-case.test.mjs` 참고), 1600x900 검증, 문서 갱신.
5. 레벨별 해적선 엔딩 흐름(`docs/PLAYER_FLOW_AUDIT_2026-11-15.md` 4절).
6. 상태 전이도 채우기 유형 사건·도메인 수준 사건(시트 작성부터).
