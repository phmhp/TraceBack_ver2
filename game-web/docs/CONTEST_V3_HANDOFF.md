# contest/v3 작업 인수인계

## 현재 상태 (WP0 완료)
- 브랜치 `contest/v3` = stable(dce7e505) + 정리 커밋. 작업 폴더 `TraceBack_ver2-v3` (git worktree). stable·contest/v2 폴더는 건드리지 않음.
- (초기 확인, 아래 WP1 정정 참조) 로컬 contest/v2에는 소스 변경이 없었으나 원격에 소스 포함 커밋이 있었음.
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

## WP2 완료 (DEV 메뉴)
- `src/ui/dev/` — `DevMenu`(좌하단 DEV 토글: 정답 적용 / 다음 단계 / 전체 초기화 / 사건 선택 / 장면 이동), `devActions.ts`(`useDevActions`로 활성 STEP이 정답 적용 동작을 등록). 정답 팝업 없음, 기존 `reveal`/`solve` 상태 전이 재사용. STEP02·03·04에 연결, 숨은 `secretSolve` 버튼은 활성 컴포넌트에서 제거(레거시 미사용 컴포넌트엔 남음).
- 프로덕션 번들 미포함 확인(dist에 devToggle 0). 검증: STEP03 정답 적용→연결 확인→기준 확정→DEV 다음 단계→STEP04 진입, STEP02 정답 적용→가설 정리, STEP04 정답 적용, 장면 이동 정상.
- 미구현: STEP01 자동 진행(WP3에서 STEP01 재설계 때 연결), 레이싱 중 DEV 도구.

## WP3 (부분 완료) STEP01
- 성능: 이 PC(빠른 GPU)에서는 FPS 저하 재현 불가(rAF 8.3ms 고정). 대신 `DevRenderProbe`(GPU 동기)로 측정 — 전체/겹쳐 보기 draw call 592→406, 삼각형 36.3만→24.9만(-31%): 전체 도메인 보기에서 그림자·AA 끄고 dpr 1 고정(`experiences.tsx` MechanismViewer Canvas). 단일 도메인 111 call/6.5만 삼각형. 약한 GPU(사무용 노트북) 실측은 미실시. 남은 큰 비용 = AllDomainsSystem 부품 모델 약 400 call(지오메트리 병합 미적용).
- 조작형 체험: `features/garage/PedalLab.tsx` — 구동›운전자 토크 요청에서 페달 0~100% 슬라이더 → `stepVehicle` 계산값(토크 요청·모터·바퀴·가속도)이 실시간 반영. 60% → 204 Nm로 STEP03 요구사항과 일치. 우측 컬럼에 맞춰 넘침 0.
- 이미 stable에 있던 것(재사용): 3관점 공유 신호 단계(activeStep/inputSelected), 선행 조건 미션(READY→D→페달), 5단계 신호 흐름 카드, 부품 길게 누르기.
- DEV: STEP01 정답 적용 연결(조건·입력·마지막 단계·완료 처리).
- 미구현: 페달 값을 3D·E/E·SW 뷰 그래픽에 직접 반영, 구동 외 도메인 값 체험, 5단계(기능 체험→기계→E/E→SW→통합) 중 '통합' 단계, 필수/선택 구분 표시.

## 다음
WP1 잔여(동적 상태 잘림 점검·STEP01 H1) → WP2 DEV 메뉴 → WP3 STEP01.
