# contest/v3 작업 인수인계

## 현재 상태 (WP0 완료)
- 브랜치 `contest/v3` = stable(dce7e505) + 정리 커밋. 작업 폴더 `TraceBack_ver2-v3` (git worktree). stable·contest/v2 폴더는 건드리지 않음.
- 발견: contest/v2 커밋은 `src` 변경 없이 docs/UX 캡처만 추가함(이식할 코드 없음). 참고 자료: `docs/ux-captures/CAPTURE_INDEX.md`.
- 정리: node_modules·dist·.DS_Store git 추적 해제. 테스트가 Node 20에서 돌도록 `tsx` 추가(`npm test` 96/96 통과), `tsc -b`, `vite build` 통과.
- 개발 서버: `npm run dev`. Node v20.20.2만 설치됨.

## 알려진 사항
- `public/assets` 435MB 중 `intake` 361MB는 코드에서 6개 파일만 참조. 배포 빌드 경량화 필요(WP8).
- CSS 약 9천 줄(v5~v18, p0~p4 누적) — 공통 UI 정리 시 중복 제거 대상.

## WP1 진행 (부분)
- 정정: contest/v2 원격에 새 커밋 4fd05767(ChatGPT 작업, 소스 포함)이 있었음. 통째 이식 안 함. 참고할 것: `FixedStageShell`, `garage/swModel.ts`·`missions.ts`, docs `STEP01_REDESIGN_PROPOSAL.md`, `STEP02_04_VERIFICATION_AUDIT.md`. 가져오지 않을 것: QuestionCard, DevAnswerViewer(정답 팝업).
- 구현: `src/ui/stepRoadmap.ts(.css)` — STEP01~04 폴더 부제목 2번째 줄을 세부 단계 이정표(현재/완료 표시)로 교체. 각 STEP 컴포넌트가 `useReportSubStep`으로 현재 위치 보고(STEP01 전체/기계/E·E/SW, STEP02 5단계, STEP03 5단계, STEP04 5단계). 기존 슬롯·높이 불변.
- 개발 서버: 부모 `.claude/launch.json`의 `game-web-v3`(포트 5183). 기본 `game-web`(5180)은 옛 TraceBack_ver2를 서빙하므로 쓰지 말 것.
- 검증: 초기 상태 6화면×4해상도 문서 스크롤·버튼 이탈 0, STEP01 H1 1건 잘림. **미검증: 정답/오답/해설 후 최대 콘텐츠 상태, 실제 클릭 흐름.**

## 다음
WP1 잔여(동적 상태 잘림 점검·STEP01 H1) → WP2 DEV 메뉴 → WP3 STEP01.
