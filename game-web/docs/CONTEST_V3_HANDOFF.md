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

## STEP01 레이아웃 v3 (A안, 2026-11-14)
- 구조: `GarageExperience`의 작업 영역을 `.gv3Work` 그리드(`features/garage/garage-v3.css`)로 감싸 기존 절대좌표 규칙을 무력화. 영역: MissionBar / 도메인 탭 + 관점 탭(기계 동작·E/E 신호·제어 SW) / 3D·다이어그램 무대 + 우측 기능·페달 패널 / 하단 신호 흐름 + 고정 '다음' 버튼. 세로 ≤820px 압축 규칙 포함.
- 공통: `ui/MissionBar.tsx`(지금 할 일 한 문장 + Q + 진행 막대), `ui/stepRoadmap.ts` 이정표 클릭 이동(`useReportSubStep(step, index, {max, goTo})`; 뒤로 자유, 앞은 도달 전까지 잠금). STEP01만 goTo 연결됨, STEP02~04는 미연결.
- 줄바꿈 원칙: 띄어쓰기 외 줄바꿈 금지(`keep-all` + 짧은 라벨 nowrap), 본문 12px 이상, 내용은 짧고 핵심만.
- 검수 도구(브라우저 콘솔): localStorage `auditSrc`(레이아웃 검사), `sweepSrc`(STEP01 전수 순회). 가려진 클릭·화면 이탈·줄바꿈·잘림·패널 스크롤·문서 스크롤 검사. 결과: 1440×900 339조합 위반 0(제어 SW 노드 내부 띄어쓰기 줄바꿈 제외), 1280×720 샘플 위반 0. 미실시: 1428×800, 1600×900 전수.
- 알려진 문제: 상단 공통 진행 표시줄 글자 7~10px(전 장면 공유), STEP01 제어 SW 노드 안 설명 2줄 줄바꿈.
- 결정 대기: 1600×900 고정 캔버스 비례 축소(zoom/scale) 도입 여부 — 세로 낮은 화면 문제를 근본 해결하나 전 장면 영향.

## STEP02 레이아웃 v3 (2026-11-14)
- `features/board/step02-v3.css` + `EeTrace.tsx`(live = `EeTraceV2`, main.tsx가 별칭 import). MissionBar(단계별 행동·Q·진행) 추가, 그리드 56/1fr/278/auto, 증거 레일·신호 지도·행동 도크 높이 정리. 세로 ≤820px에서는 후보 카드를 가로형으로 바꿔 도크 176px.
- 이정표 뒤로 이동 연결: `reached`(sessionStorage 저장) + `goTo`(데이터 유지, 단계만 되돌림), 추적 단계 복귀 시 자동 전진 방지(`holdTrace`).
- 원래부터 있던 결함 수정: 추적 단계 도크 내용(268px)이 행동 영역(210px)보다 커 `측정하기`가 고양이 줄에 가려짐, 열관리 '부품' 열 8노드 잘림, 증거 폴라로이드 카드 겹침/잘림.
- 검수: `localStorage.sweep02Src`(상태 순회) — 구동·열관리·제동 × 19상태, 1440×900·1280×720 모두 위반 0(완료 요약 오버레이가 보드를 덮는 의도된 상태 제외). 섹션 선택 오답/정답 상태도 0. 미실시: 1428×800·1600×900, 가설 정리 부분 진행 상태.
- 교훈: 화면 전체 비례 축소(transform/zoom)는 R3F 캔버스 좌표(offsetX 대비 rect 폭)를 틀어 3D 클릭이 깨질 위험 → 도입 시 캔버스별 pointer 보정 필요. 현재는 세로 낮은 화면용 반응형 규칙으로 대응.
- 이정표 이동: STEP01·02만 연결. STEP03·04 미연결.

## 고정 캔버스(1600x900 비례 축소, 2026-11-14)
- `src/entry.tsx`(index.html 진입): 최상위에서는 `ui/ScaledFrame.tsx`가 게임을 **1600x900 iframe**에 넣고 창에 맞춰 통째로 `scale`(레터박스, 중앙). iframe 안(`?embed=1`)에서는 `main.tsx`를 로드. 안에서는 브라우저가 항상 1600x900으로 인식 → 미디어쿼리·vw/vh·드래그·R3F 3D 클릭이 수정 없이 정확(실제 클릭으로 3D 부품 선택 확인). `?noscale`로 우회 가능.
- 검수 스크립트(auditSrc/sweepSrc/sweep02Src)는 iframe 안에서 실행: `document.querySelector('iframe').contentWindow.eval(localStorage.xxx)`. 더 이상 해상도별 반복 불필요(캔버스 고정). 이전의 `@media (max-height)` 압축 규칙은 제거함.
- 확인: 1280x720, 900x900, 1800x600 모두 내부 1600x900·중앙 정렬, 프로덕션 빌드·미리보기 동작.

## 다음
WP1 잔여(동적 상태 잘림 점검·STEP01 H1) → WP2 DEV 메뉴 → WP3 STEP01.

## EV 데이터 1차 (2026-11-14)
- 기준 문서 `docs/EV_DOMAIN_SPEC_DRAFT.md`(3묶음 11도메인, 승인됨). 데이터는 `src/features/garage/evData.ts`(`EV_DOMAINS`, `DOMAIN_ORDER`)가 단일 출처. `experiences.tsx`는 여기서 `domainContent`/`featureFlows`/`getFeatureLayer`를 파생.
- 이번 단계 도메인 9개: 구동·고전압 전원·충전·열관리 / 제동·조향·현가·변속·주차 / 통신·진단. 기능 4개씩, 4층(기능 흐름·부품 E/E·SW 컴포넌트·SW 로직). 2층 이름은 AUTOSAR식 SWC명(시각화는 아직 없음, 레이아웃 단계에서 연결).
- 기능 인덱스는 다른 화면이 번호로 참조함: drive0·thermal0/1/3·brake1(오픈북·퍼즐 노트). 구동은 3번=토크 배분·제한, 4번=인버터 제어(`OWNER_OVERRIDE`는 `drive-3`).
- 남은 것: 차량 통합(VCU)·운전자 지원·HMI 도메인(2차), 협조 신호 맵, STEP01 레이아웃 개편(묶음 가로 내비, 수직 4층, SWC 층, 전체 보기 9칸 배치 — 현재 3×3으로 겹쳐 보임), 새 부품 3D/이미지 연결(`partModelFor`는 이미지 도착 후), 충전·통신 도메인의 3D 장면은 모델 있는 부품만 표시.
- 기존 문제(기준선에도 있음): 도메인 탭 전환 시 콘솔에 drei Html removeChild / "synchronously unmount a root" 오류(화면은 정상 동작).

## STEP01 레이아웃 개편 (2026-11-14, 승인 반영)
- 그리드: 열 `84px(층 레일) | 1fr(스테이지) | 360px(우측)`, 행 `56 / 64(도메인 내비) / 1fr / 150`. 우측 360px 절충안 확정, STEP02~04도 같은 비율 기준으로 맞출 것.
- 도메인 내비: 전체보기 + 3묶음(파워트레인·섀시·차량 제어) 한 줄. 층 레일: 기능 흐름 / 부품·E/E / SW 구성 / SW 로직(내부 level 0~3, `garageLayerSource=[0,1,2,3]`). 새 level 2 = `SwcView`(실행 제어기 안 SWC 상자·포트).
- 로드맵 칩 5개(차량 전체·기능 흐름·부품·E/E·SW 구성·SW 로직). 전체보기로 가면 level 0으로 되돌림.
- SW 로직 도식은 7블록까지 한 줄(예전 2줄 배치는 글자가 약 7px로 줄었음).
- 전수 검수(1600×900, 9도메인×4기능×4층, 초기+입력 완료 상태 289조합): 가려짐·화면 이탈·잘림·스크롤 0. 남은 것은 SW 로직 블록 설명이 띄어쓰기 지점에서 두 줄로 접히는 것(허용 범위).
- 전체보기 = `ArchitectureOverview.tsx`(왼쪽 입력·가운데 3묶음 도메인·오른쪽 출력·네트워크 띠, 협조 신호 7종 `COORD_SIGNALS`, 3D 차량 토글). 데이터 `OVERVIEW_IO`, `COORD_SIGNALS`는 evData.ts. 푸터(흐름 카드+다음 버튼)는 전체 열을 차지하고 다음 버튼은 우측 360px 열 바로 아래.
- 남은 것: 새 부품 3D 연결, 2차 도메인(VCU, ADAS·HMI).

## STEP02 v4 (2026-11-14, 승인 반영)
- 3단계: 증상 확인(기준과 다른 출력 선택, 카드는 기준 vs 이번 값) → 역방향 추적(후보 노드를 눌러 측정+비교, 판단 버튼 2개 "먼저 달라짐/같거나 늦음", 로그 재생 단계 제거) → 가설 정리(의심 구간 → 가설 반박/보류 → 먼저 시험할 가설). 로드맵 칩 3개.
- 레이아웃: 열 `1fr | 360px`, 행 `56 / 1fr / 150`. 우측 360px 패널 탭 = 증거 / 측정 / 구간 / 가설. 하단 도크 150px = 고양이 한 줄 + 이 단계의 질문 하나. 다음 버튼은 우측 360px 아래(STEP01과 같은 자리).
- 측정 횟수 제한·별점 연동은 넣지 않음(난이도 피드백). 나중에 넣으려면 `measure()`에서 `measured.length` 상한 검사만 추가하면 됨.
- 정답 힌트 완화: 의심 구간 선택지를 같은 형식·길이로 맞추고 정답 위치를 사건마다 다르게 함(1/3/2번째). 사건별 고장 종류 다양화는 WP7.
- 검수: 3사건 전 과정(증상→측정·판단→구간→가설→다음 활성) 1600×900 위반 0. 테스트 6개를 새 계약으로 갱신.

## 2차 도메인 (2026-11-14)
- 차량 통합(vcu)·운전자 지원·HMI(adas) 추가 → 11도메인 44기능. 차량 제어 묶음 = 차량 통합 / 통신·진단 / 운전자 지원·HMI. 협조 신호 9종(안전 상태, ADAS 감속 요청 추가).
- 새 부품 이미지(전방 카메라·레이더, ADAS ECU 등)는 `partModelFor` 미연결(이미지 도착 후 모델/카드 연결). 해당 기능의 3D는 모델 있는 부품만 표시.
- 검수: 새 도메인 8기능×4층 + 전체보기 신호 9종 위반 0(SW 로직 설명 띄어쓰기 줄바꿈 제외). 교차 검토 자료 `docs/CROSSCHECK_STEP01.md`는 11도메인으로 재생성됨.

## STEP03 v3 (2026-11-14)
- 3단계(정상 기준 구성 / 연결·값 확인 / 시험 설계 확정), 우측 360px 패널 탭(요구사항·설계서 + 오픈북), 150px 도크, 다음 버튼은 패널 아래. 설계서는 모달 대신 패널 탭. 상세는 `DESIGN_DECISIONS_V3.md` 6절·13절.
- 고장 종류별 UI 분기(logic/path)는 구조만 계획, 아직 미구현.

## STEP04 v4 (2026-11-14)
- 4단계 + 우측 360px 패널(조건/결과/자료) + 150px 도크, 다음 버튼 패널 아래. 상세는 `DESIGN_DECISIONS_V3.md` 8절.
- 검수 스크립트(브라우저 localStorage): `s3Src`(STEP03), `s4Src`(STEP04 전 과정). 개발 모드 TWIN_BENCH 직행 시 STEP03 계약 자동 생성.

## 레벨 선택·상단바·학습 연결 (2026-11-14)
- 레벨 선택 `features/levels/LevelSelect.tsx`, 데이터 `game/levels.ts`. 흐름: 정비소 "다음" → `LEVEL_SELECT` → 레벨 시작(`START_LEVEL`) → 주행·STEP02~04·수리 → 다시 `LEVEL_SELECT`. 레벨 4(탈출)는 구동·열관리 클리어 후 열림, 제동은 선택 레벨.
- 상단바: `PursuitHud`(game-shell.tsx)가 모든 장면에서 상단 우측 같은 자리. `PursuitRouteBar`는 호환용 래퍼. 버튼 공통 스타일 `ui/buttons-unified.css`.
- 학습 연결: `ui/OpenBook.tsx` `OpenBookModal`(4층 탭, focus 하이라이트), STEP03 `rpGarageLink`, 레벨 카드 `principles`.
- 기존 사건 규칙 검수: `docs/fault-cases/AUDIT_EXISTING_2026-11-14.md`.


## 2026-11-14 레이싱 1차 진행 (다음 에이전트용)
- 완료·커밋: 충돌 v2(`src/game/collision.ts`, race-impact.css), 추리 시간 배지 `.timeDilation`(game-shell.tsx), 고장 스케줄 모델(`src/game/faultSchedule.ts`, `docs/fault-cases/RACING_FAULT_MODEL.md`, `tests/fault-schedule.test.mjs`) + 레이스 연결(`?faultdemo=` 개발 스위치).
- 다음 순서: (1) 상황 세트 1(신호등+횡단보도+보행자, 앞차 급제동, 뒤차 추돌) → (2) 추격 연동 실제 반영(정지/후진/출력 제한 시 추격차 곡선 확인, 교통 밀도·"피하지 않는 차") → (3) 기존 두 사건을 스펙으로 이전 → (4) N01 시트 승인 후 구현.
- 규칙: 레이싱 레이아웃을 크게 바꾸기 전에 사용자에게 HUD/충돌 시안을 먼저 보여 준다. 모든 승인 설계는 DESIGN_DECISIONS_V3.md에 추가. 검증은 1600x900 브라우저 + `npm test`(현재 109 통과).
- 2026-11-14 추가 완료: 상황 세트 1(신호 주기·횡단보도 보행자·앞차 급제동·뒤차 추돌) `src/game/situations.ts` + 레이싱 연결, 상세 `docs/ROAD_SITUATIONS_CATALOG.md` 하단 "구현 현황". 개발 도구 `tb-dev-seek`, `tb-dev-hit`, `?faultdemo=`.
- 남은 순서: 추격 연동 실제 반영(고장→추격차: 정지/후진/출력 제한 곡선·후진 주행), 교통 밀도·정체, 기존 두 사건을 `FaultSpec`으로 이전, 사건 N01 시트 승인 후 구현, 레이싱 HUD/충돌 시안을 사용자에게 먼저 제시.
- 2026-11-14 추격 연동 반영: 추격 속도 계산 단일화(`policeSpeedKph`), 후진 주행(`reverseOnly`), 출력 제한은 속도 상한으로 자동 반영, 경찰 접근 예상 시간 카드(`situationHint` chase). 충돌 연출은 차체만 흔들림(카메라 고정). 구간 표 `ROAD_ZONES`는 배선만 완료.

## 화면 확인 기준 (모든 에이전트 필수)
- 게임은 **1600x900 고정 화면(iframe)을 비율 유지로 통째로 축소**해서 보여 준다(`src/ui/ScaledFrame.tsx`). 크롬 전체화면도 같은 레이아웃의 확대·축소일 뿐이다. 따라서 레이아웃은 항상 1600x900 기준으로 만들고 검증한다.
- 직접 테스트용 `?embed=1` 페이지는 창 크기를 그대로 쓰므로, 확인 전에 반드시 뷰포트를 1600x900으로 맞추고 `innerWidth x innerHeight`를 찍어 확인한다(브라우저 패널은 턴이 끝나면 크기를 초기화함). 작은 창에서 찍은 화면으로 판단하면 겹침이 거짓으로 보이거나 놓친다.
- 1600x900 겹침 검사 예: 백미러 `.policeMirror`(686–914, 상단) vs 추격 HUD `.pursuitHud`(1128–1488, 상단)는 겹치지 않아야 한다. 새 카드는 `.raceFeed`(570–1030, y 128~) 안에만 쌓는다.
- 2026-11-14: 도로변 가로등이 길에서 11~20 m 떨어진 풀밭에 서 있던 위치 버그, 바다 쪽 지붕 없는 상자 건물을 수정(가로등은 도로 가장자리 `-8.6`, 건물은 육지 쪽만).
- 2026-11-14 교통 밀도·정체 반영(13대, 서행 군집). 남은 순서: 환경 구간 맵 연출(`ROAD_ZONES`), 기존 두 사건 `FaultSpec` 이전, N01 시트 승인 후 구현.
- 2026-11-14 환경 구간 1종(우천) 반영. 남은 순서: 터널·야간 연출, 기존 두 사건 `FaultSpec` 이전, N01 시트 승인 후 구현, 엔딩 고양이 얼굴·코스 길이 연장.
- 2026-11-14 기존 구동·열관리 사건을 `FaultSpec`(`PROPULSION_FAULT`, `THERMAL_FAULT`, `levelFaults`)으로 이전 완료. 동작은 이전과 동일(브라우저로 두 사건 발동 확인, 테스트 123개).
- 2026-11-14 코스 연장: `TRACK_LENGTH` 1380 → 2200 m(`src/game/traffic.ts`). 이벤트 위치는 `src/game/course.ts` 한 곳(`OVERTAKE_ZONE` 150~330, `CLIMB_ZONE` 1300~1500, `FINAL_ESCAPE_M` 1700, 승선 램프 = TRACK_LENGTH - 170). 신호 교차로 3곳(300·920·1560 m, 620 m 미션, 1180 m 정적 횡단보도), 우천 2곳(380~540, 1000~1140), 교통 17대, 앞차 급제동 3회, 가로수·가로등은 길이에 맞춰 자동 배치. 진행 바·미니맵은 TRACK_LENGTH 기준. 브라우저로 1660 m → 엔딩까지 확인.
- 코스를 더 늘리거나 이벤트를 옮길 때: `course.ts`와 `TRACK_LENGTH`만 바꾸고 `tests/v16-refactor.test.mjs`(TRACK_LENGTH 값)·`collision.test.mjs`(교통 대수)·`fault-schedule.test.mjs`(열관리 거리) 기대값을 같이 갱신.
- 2026-11-14 엔딩 고양이 표정: `src/game/endingMoods.ts`(별 비율 → 표정·후일담, 체포는 실망/놀람·"다친 곳은 없어요"), `CaseFileEnding.tsx`의 `CatFace`가 `public/assets/cat-expr/<lou|ming>-<mood>.png`를 읽고 없으면 초상 크롭으로 대체. 도장은 흐름 안으로 옮겨 문장 가림 해결. 1600x900에서 성공·체포 화면 확인. 이미지 제작 안내는 `docs/USER_TODO.md`.
- 2026-11-14 새 사건 N01(`regen`, 회생 부호 오류) 구현: STEP02~04·허브(4레벨 선택, 탈출은 5레벨)·엔딩·정비소 노트 연결, 모델 `simModel.regen`, 테스트 `tests/regen-case.test.mjs`. **레이스 고장 트리거는 미연결**(제동 사건과 같은 선택 레벨 형태). 새 사건을 더 추가할 때는 `CaseId`에 추가해 `tsc -b`가 알려주는 `Record<CaseId,…>` 표를 모두 채우고, EeTrace의 `Record<string,…>` 표(LAMP·QUOTE·TRACE·OBSERVED·REPLAY·SUBSYS)는 타입 오류가 안 나므로 따로 확인한다. 브라우저 확인 때 STEP04 시험 실행이 멈추면 패널이 안 그려져서이니 화면 캡처로 깨운다. C01·C05·C08·C12는 사건 시트 작성부터 필요.
- 2026-11-14 터널·야간 구간 연출 완료(`ROAD_ZONES` tunnel 700~860, night 1520~1690). 남은 환경: 경사·저온·눈부심 연출.
- 2026-11-14 N01 레이스 연결: 레벨 4 시작 → 레이스(`REGEN_FAULT`) → 고장 컷신 → STEP02. 레벨 시작 전이는 `runtime.ts` START_LEVEL 4(`CHASE_RESUME`, caseId regen).
- 2026-11-14 둘째 사건 시트 작성: `docs/fault-cases/c01_ready_fail.md`(C01 시동 불가, 프리차지 타임아웃 500 vs 1500 ms, 시동 전·영구, 임베디드에서 판정). 승인 전에는 코드를 쓰지 않는다. 다음 후보 시트: C05(저속 회생·마찰 전환), C08(시간 경과 간헐), C12(P 해제 후 밀림) — 한 번에 하나씩.
- 2026-11-14 C01(`ready`, 시동 불가·프리차지 타임아웃) 구현 완료: 5레벨(선택), 탈출은 6레벨. 레이스 `READY_FAULT`(R 키 3회 실패 → 컷신), STEP02~04·엔딩·정비소 노트. 테스트 135개. 다음 후보: C05 → C08 → C12 시트부터(한 번에 하나).
- 2026-11-14 셋째 사건 시트 작성: `docs/fault-cases/c05_lowspeed_blend.md`(C05, 회생·마찰 전환 구간 불일치, 감속·저속·영구, SW 통합에서 판정, 진단 미탐). 승인 전 코드 없음. 구현 때 필요한 신규 요소: 약한/강한 제동 입력 구분, `FaultEffect` 구간 내 제동 배율, `simModel.blend`. 다음 후보 시트: C08, C12.
- 2026-11-15 사용자 검토 피드백 대응: (고침) 정비소 전체보기 글자 넘침, 레벨 허브 노드 움직임, 폴라로이드 확대 비율·Enter/Esc. (문서) `PLAYER_FLOW_AUDIT_2026-11-15.md`(단계별 세부 구성+캡처 20장 `docs/captures-2026-11-15/`, 문제 원인, 단순화·실험대·레벨 엔딩 제안, 규칙 R18~R23 제안, 용어 사전), `RACE_VARIATION_MAP.md`(주행 요소 활성 조건·고장 연결), `fault-cases/c04_gear_fallback.md`(시스템 수준 신호 경로 선택 퍼즐용 사건 시트). **제안은 모두 승인 전이며 코드 변경 없음.** 다음 에이전트는 사용자 승인 뒤 감사 문서 7절 순서로 구현(도미노 재설계 먼저, 구현 전 화면 시안 제시).
