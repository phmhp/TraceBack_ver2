# contest/v3 작업 인수인계

## 현재 상태 (WP0 완료)
- 브랜치 `contest/v3` = stable(dce7e505) + 정리 커밋. 작업 폴더 `TraceBack_ver2-v3` (git worktree). stable·contest/v2 폴더는 건드리지 않음.
- 발견: contest/v2 커밋은 `src` 변경 없이 docs/UX 캡처만 추가함(이식할 코드 없음). 참고 자료: `docs/ux-captures/CAPTURE_INDEX.md`.
- 정리: node_modules·dist·.DS_Store git 추적 해제. 테스트가 Node 20에서 돌도록 `tsx` 추가(`npm test` 96/96 통과), `tsc -b`, `vite build` 통과.
- 개발 서버: `npm run dev`. Node v20.20.2만 설치됨.

## 알려진 사항
- `public/assets` 435MB 중 `intake` 361MB는 코드에서 6개 파일만 참조. 배포 빌드 경량화 필요(WP8).
- CSS 약 9천 줄(v5~v18, p0~p4 누적) — 공통 UI 정리 시 중복 제거 대상.

## 다음
WP1 공통 UI 재설계 및 진행 불가 수정.
