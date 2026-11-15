# 진행 로그 (Codex·다음 세션이 바로 이어받기 위한 문서)

규칙: 작업 단계가 끝날 때마다 아래 "현재 작업"과 "다음 할 일"을 갱신하고 커밋한다. 작업이 중간에 끊겨도 이 문서만 보면 이어갈 수 있게 한다.
미리보기: `.claude/launch.json`의 `game-web-v3`(포트 5183). 기본 `game-web`은 옛 폴더를 띄운다. 검증은 1600x900.

## 완료 (커밋됨, 2026-11-15)
- 도미노(STEP02) 개편, 실험대(STEP04) 3단계, 정비소 3영역 공개, 퍼즐 안내·폴더 설계서, 규칙 R18~R23.
- 상태: `npx tsc --noEmit` 오류 없음, `npm test` 135 통과.

## 현재 작업
- 사용자 피드백 29항목 후속 수정 중. 최신 구현을 다시 대조한 결과, 정비소 내부 breadcrumb, 레벨 선택 사건 그래픽, 도미노 증거 필터·단계 브리지, E/E 부품 층 채도, 공통 하단 높이 보정을 반영했다.
- 문서: `docs/FEEDBACK_2026-11-15_B.md`에 29항목 상태를 갱신했고, `docs/TERMINOLOGY_GLOSSARY_V3.md`를 추가했다. `PLAYER_FLOW_AUDIT_2026-11-15.md`의 실험대 흐름도 R21에 맞게 고쳤다.
- 브라우저에서 최신 변경을 확인한 뒤, 레이싱 코스 다양화는 `trackFrame`의 공통 경로 키프레임으로 반영했고, 출발 직후 추격 HUD·미니맵 경찰 표시는 경찰 합류 뒤에만 보이도록 했다.
- 도미노 확인 신호는 패널 안에서 말줄임·줄바꿈을 제한했고, 증거 탭은 이상 판정으로 등록한 신호만 보인다. 전용 고양이 사건 이미지와 C04/C06 증거 이미지는 사용자 에셋 승인 대기다.
- 이번 후속 수정에서 전체 보기의 파워트레인·섀시·차량 제어 역할 설명, 레벨 선택 사건 그래픽 위 고양이 오버레이, 검증 단계의 수리 후 재시험 잔여 문구 제거를 반영했다. 실험대는 원인 제거 확인 후 `수리 적용 · 주행 복귀` 한 경로만 남긴다.
- 1600×900 Chrome에서 앱 재로드 후 컴파일 오류·경고가 없고 타이틀 화면이 정상 렌더링되는 것을 확인했다. 3D 쇼룸도 직접 진입해 브라우저 오류가 없음을 확인했다.

## 주의
- `node`/`npm` 실행 파일이 현재 셸 PATH에 없어 자동 테스트를 아직 실행하지 못했다. 브라우저 개발 서버(포트 5183)는 이미 실행 중이며 Chrome에서 화면 대조를 진행한다.

## gear 구현 진행 (tsc 오류 0, 테스트 140 통과, 브라우저 검증 완료: STEP02 도미노, STEP03 퍼즐, STEP04 실험대 → 수리 장면)
- 완료: CaseId `gear`, 레벨 6(finale은 7로 이동, 허브 7노드), `simModel`(gear 모델·VIEW, 관찰 0.35초), `scenarios`, `verificationContract`, `VerificationLab` 표 전부, `RefPuzzle`(블록 조립 UI로 구현), `experiences`, `DominoBoard/Trace`, `EeTrace`, `CaseFileEnding`, `OpenBook`, `DevMenu`, 이미지 프롬프트 3장, 레이스 고장 `GEAR_FAULT`(faultSchedule, 이벤트 gearChange 0.8초 창, reverseOnly 0.5초 버스트, 두 번째 발생 때 FAULT_CUE), 테스트 `tests/gear-case.test.mjs`.
- 남음 gear: (1) 레이스 화면은 로드·안내 카드 확인함(실제 주행 트리거는 단위 테스트로 검증, 브라우저 rAF 정지로 플레이 확인 못 함) (2) 신호 경로 UI는 1차 구현 완료(`ref.ui: "path"` → 노드 박스 + CAN 버스 막대). 더 다듬으려면 `puzzle-v3.css`의 `.pathMode`/`.rpBus` 수정 (3) 사용자 이미지 대기: 변속 레버·게이트웨이 부품 사진(임시로 accel_pedal/can_harness/diagnostic_port 썸네일 사용), 증거 3장(`motor_reverse_log`, `dtc_gear_timeout`, `bus_load_scope`).
- 기억할 점: 벤치 QA 기본 입력(`qaDeriv`)은 gear만 항상 `reqa`(버스 부하 85 %). 3D 벤치 부품 id는 `gear_selector`(포트 gear_out → VCU gear_in).

## 레벨별 엔딩 (완료, 단위 테스트 통과, 브라우저는 허브만 확인)
- `runtime.ts`: `levelFinish`, `START_LEVEL`에서 거리 0 초기화, `APPLY_REPAIR` → `CHASE_RESUME`(levelFinish), `NEXT_LEVEL`. `experiences.tsx`: `finishRun`으로 고장·증상·구간 카드 끄고 1700 m에서 `START_FINAL_ESCAPE`. `CaseFileEnding`: levelFinish면 "다음 레벨 →". `LevelSelect`: finale 노드 숨김, 6노드.
- 확인 못 한 것: 실제 주행(브라우저 rAF 정지)으로 수리 → 1700 m → 엔딩 → 다음 레벨 전체 플레이. 사용자가 한 번 플레이해 확인 필요. 특히 레벨 2에서 열관리 고장(1300 m)까지의 주행 시간.

## C06 `cold` 구현 진행 (사용자 승인 2026-11-15, 자리 비움 중 7시까지 자율 진행)
- 시트 `docs/fault-cases/c06_cold_regen_limit.md`. 레벨 7(선택), 마지막 탈출은 8로 이동. 절차는 C04(`gear`)와 동일: CaseId 추가 → tsc 표 채우기 → EeTrace 문자열 표 → main.tsx QA 허용 목록/DevMenu → 레벨·runtime·레이스 고장 → 테스트.
- 진행: [x] sim/scenarios [x] contract+VerificationLab [x] RefPuzzle/Domino/Ending/OpenBook/EeTrace [x] levels(7레벨, finale 8)/runtime/faultSchedule(COLD_FAULT, regenScale)/experiences [x] tests/cold-case.test.mjs(147 통과) [x] 브라우저 검증(STEP02~04 수리 장면까지, 허브 7노드) [x] 문서 마무리. C06 완료.
- 임시 이미지: 증거 3장(`cold_decel_log`, `regen_limit_compare`, `battery_temp_view`) 미제작, 부품은 기존 썸네일(`bms`, `brake_ecu`, `can_harness`, `traction_motor`, `motor_temp_sensor`, `brake_caliper`) 사용

## 다음 할 일 (순서)
1. 사용자 제공 전용 고양이 사건 이미지와 C04/C06 증거 이미지가 준비되면 임시 오버레이·썸네일을 교체한다.
2. 사용자 브라우저에서 실제 레벨 2·3·4의 수리 후 1700 m 주행 → 엔딩 → 다음 레벨 흐름을 확인한다. 현재 셸은 `node`/`npm` PATH가 없어 자동 테스트 재실행은 환경 복구 후 진행한다.
