# TraceBack game-web — 작업 인수인계 (Claude용)

새 세션은 이 파일만 읽고 바로 이어서 작업한다. 긴 문서는 필요할 때만 연다.

## 프로젝트
- EV 차량 SW 교육용 웹 게임 TraceBack. 목표: `CODEX_REFACTOR_MASTER.md`("EV Vehicle Logic Lab") 기준 6일 공모전 MVP.
- git 루트는 상위 폴더 `261103codex/`, 앱은 `game-web/`. 작업 브랜치 `refactor/ev-logic-lab-mvp` (origin: github.com/phmhp/TraceBack_ver2).
- 스택: React 19, TypeScript, Vite 8, three + @react-three/fiber/drei.
- 명령: `npm run dev` (포트 5180, `.claude/launch.json`의 "game-web"), `npm test` (node --test, .ts 직접 import), `npm run build`, `npm run prompts`.

## 사용자 원칙 (반드시 지킬 것)
- 기존 스토리·화면 구성·흐름 유지가 최우선. 승인 안 된 코드는 삭제·재작성 금지. 기존 git 변경 보존.
- 3D 모델은 공개 에셋 먼저 검색. 오픈카·고양이·Tier C 부품은 사용자 승인으로 코드 직접 제작.
- 도구는 ChatGPT 외 무료만. Hunyuan3D 금지(한국 제외 라이선스), Tripo 보류, TRELLIS(MIT) 1순위, Meshy 무료는 CC BY 표기.
- 답변은 한국어, 짧고 쉽게. **매 작업 단계마다 커밋**(작성자: 박혜민 <phm6318@sookmyung.ac.kr>, 이 저장소 git config에 설정됨). push는 사용자가 요청할 때만. `node_modules` 변경은 커밋하지 않음.
- 대상은 20대 후반 신입~40·50대 시니어. 문구는 간결한 실무자 말투(해요체/합니다체), 유아어·감탄 금지. 이모지 금지(직접 만든 에셋 사용, 고양이는 기존 `ASSET_003_Cat_Face_Identity_REFERENCE.png`). UI 톤: 핑크~갈색 계열(버튼·강조는 핑크가 섞인 더스티 로즈 브라운 #9b6b64 계열, 칩·라벨 글자 500·버튼 600, 보라 금지), 살짝 비치는 유리 광택(Frutiger Aero)+클레이 버튼, 적용 스킨 `src/p2-notepaper.css`(추리 3단계) + `src/p3-notepaper-world.css`(차고·레이싱 HUD·컷신·대화·수리·공용 버튼), 시안 `docs/mockups/style-skeuo.html`. 아이콘은 `src/ui/Icon.tsx`(이모지 금지).
- 스타일: 동물의숲처럼 아기자기·뽀짝, 설명은 루·밍 말풍선 위주, 텍스트보다 그래픽. 숫자 직접 입력 같은 '일하는 느낌' 금지(고르기·끌기만). 클릭·선 긋기는 쫀득한 촉감+효과음.

## 이야기·인물 (원작 설정, 2026-11-08)
- F1 드라이버·엔지니어 고양이 듀오가 시즌 최고 상금을 땀 → 후원사 대표(사기꾼)가 상금을 빼돌리고 경기 조작 누명 → 해고·무일푼 → 사기꾼 저택 금고에서 상금 되찾기 + 직접 만든 차가 여전히 최고임을 증명하려 레이싱 → 주행 중 고장 → 원인 밝혀 수리 → 해적선(파라다이스로 가는 뒷길) 탑승 = 엔딩.
- 이름은 `src/game/cast.ts` 한 곳(드라이버 볼트·엔지니어 너트·사기꾼 폭스). 예전 이름 루·밍은 화면에서 제거(주석·미사용 레거시 파일엔 남음).

## 구조 요점
- 씬 상태머신 `src/game/runtime.ts`, 실제 렌더 씬 `src/experiences.tsx` (`main.tsx`에는 안 쓰는 레거시 컴포넌트가 남아 있음, 지우지 말 것).
- 시뮬 데이터 `src/sim/`: types, components(부품 28·연결 38·ECU 6), registry(포함/제외 영향 분석), driverInput(Enter 시동, W/S, A/D, Space 보조브레이크), vehicleSim(시나리오 수치 재현, 고장 훅 pedalScale/fanStuck/brakePressureGain).
- 차량 `src/features/vehicle/`: carBody(로프트 차체, 앞=-Z), bake(재질별 병합), HeroConvertible(Lou 운전·Ming 동승), CatCharacter. 레거시 `Convertible`은 `?car=legacy`로 비교용 유지.
- 부품 3D `src/features/parts/`: `partModels.ts`(코드 제작 부품 모델, 팔레트·m 단위·포트 앵커=포트 ID·움직이는 그룹), `PartModel.tsx`(`<PartModel id input />`), `PartShowroom.tsx`. 차고·벤치 연결: `experiences.tsx`의 `partModelFor(domain,label)`가 라벨→부품 ID를 찾고, 모델이 있으면 `FittedPart`, 없으면 기존 도형(`PrimitiveHardwarePart`)을 씀. 앞으로 만들 부품 ID(hv_battery, main_contactor, inverter, traction_motor, brake_caliper 등)도 미리 매핑돼 있어 모델만 추가하면 자동 반영. 벤치 ECU(상태 패널 붙은 박스)는 그대로 둠.
- 개발 전용(프로덕션 번들 제외): `?showroom=car`, `?showroom=parts[&part=id|&grid=1]`, `window.__tbProbe.race|parts|garage|bench(frames)`.
- 메모판 폴라로이드: 틀 `polaroid-frame-real-v1.png`(`.polaroidCard`), 사진은 아틀라스 `diagnostic-evidence-sheet-v1.png` + `evidenceAtlasCell`.

## 이미지 프롬프트 (v3, 커밋됨)
- 원본 데이터 `scripts/image-prompt-data.mjs` → `npm run prompts` → `docs/PART_IMAGE_PROMPTS.md`, `docs/image-prompts/01~12.md` 생성. md 직접 수정 금지.
- 규칙: 코드블록 1개 = 요청 1번 = 이미지 1장, 파일명 `<id>__REF|TURN|EXPL|CUT|EVID-ok|EVID-fault.png`, EVID는 틀 없는 정사각형 사진. 생성 이미지는 실제로 `public/assets/intake/images/<HMI|sensors|ecu|...>/`에 폴더별로 저장됨(문서의 asset-intake 경로와 다름). 오타 파일 `sensors/teering_torque_sensor__EXPL.png` 있음.
- `tests/image-prompts.test.mjs`가 부품·증거 누락을 막는다.

## 부품 모델링 진행 (2026-11-07)
- 선별 기준: 시뮬 필수 부품(`components.ts` 28종) + 3D 방식 "직접" + REF/TURN 이미지 있음. 필수 ECU 중 REF 없는 것(mcu·thermal/brake/eps_ecu)은 CUT 기준.
- 2차(11-07): power-battery·drivetrain·brake·steering-suspension 폴더에서 필수 12종 추가 — hv_battery, main_contactor, inverter, traction_motor(축 회전), reduction_gear, differential(회전), drive_shaft(회전), wheel(허브 회전), hydraulic_modulator(코드), brake_caliper(디스크 회전·패드 포함), eps_motor, steering_rack(랙 슬라이드). 시뮬 28종 중 26종 완료, 남은 건 cooling_fan·cooling_pump(열관리 이미지 대기).
- 1차 14종: bms(TRELLIS 대신 코드), accel_pedal, brake_pedal, steering_wheel, gear_selector, start_button, vcu, mcu(뚜껑 분해), thermal_ecu, brake_ecu, eps_ecu, wheel_speed_sensor(톤링 회전), rotor_position_sensor(로터 회전), motor_temp_sensor.
- TRELLIS.2 Space(MIT)는 API로 호출 가능하나 출력 최소 10만 면+2K 텍스처, 비로그인 GPU 할당 몇 분/일 → 상자형 부품은 코드 제작이 더 가볍고 포트 앵커도 맞음. 형상이 복잡한 부품에만 시도.
- 보류: 시뮬 비필수 AI 방식(pack_current_sensor, imu, gateway), 시뮬 비필수(steering_column, coolant_temp/steering_angle/steering_torque/brake_pressure 센서, cell_monitor_board), 2D(instrument_cluster, epb_switch).
- 2차에서 제외(시뮬 비필수): battery_cell/module, cooling_plate, hv_junction_box, precharge_circuit(컨택터에 포함), dcdc, lv_battery, service_disconnect, hv_cable, lv_harness, motor_stator/rotor, master_cylinder, brake_booster, brake_disc/pad(캘리퍼에 포함), brake_line, tie_rod(랙에 포함), knuckle, control_arm, coil_spring, damper, strut, anti_roll_bar.
- 다음: 열관리(fan·pump) → 충전 → 통신·진단. 벤치 가운데 ECU는 아직 기존 보라색 상자(상태 패널 때문).
- 엔딩 UI 교체 완료(11-07): `src/ui/CaseFileEnding.tsx` + `src/ending-v19.css`. 성공(ENDING)=WANTED 전단, 실패(CAUGHT)=머그샷 수감 기록, 둘 다 오른쪽에 그래픽 사건 개요(사건별 입력→제어→출력 부품 사진 체인 + 고장 위치 표시, 정상 vs 고장 당시 막대, 4단계 진행 아이콘, 한 줄 교훈; 사건별 그림 데이터는 `CASE_VISUAL`). 썸네일은 `public/assets/ending-thumbs/`(CUT 이미지 256px 축소). 고양이 사진은 `cutscene-character-master-v1.png`를 잘라 씀(나중에 전용 증명사진·머그샷 이미지로 교체 가능). 기존 `Ending` 함수는 main.tsx에 미사용으로 남김, PAUSE 팝업은 그대로. 전후 캡처 `docs/ending-captures/`.

## 환경 주의
- `node_modules`가 Windows에서 설치된 것이라 Mac 네이티브 패키지가 없었음 → `@rolldown/binding-darwin-arm64`, `@typescript/typescript-darwin-arm64`를 `--no-save`로 추가. `.bin` 실행 권한이 없어 `node node_modules/vite/bin/vite.js`, `node node_modules/typescript/bin/tsc -b`로 실행. 미리보기 설정은 상위 폴더 `.claude/launch.json`.
- 이 Mac의 Node는 v20이라 `npm test`의 .ts import 테스트(sim, image-prompts, vehicle, part-models)는 실패함. Node 22+ 필요.
- 브라우저 패널이 숨겨져 있으면 R3F가 안 그려짐 → `window.dispatchEvent(new Event('resize'))` 후 `__tbProbe.parts(2)`로 강제 렌더.

## 2026-11-07 P0 반영
- 고장 감지 화면 수치 → "?" + 경고등 카드, 레이싱 1~3단 → 회생 단계(Q/E 0~3)·EV 가속 곡선, 열관리 측정값을 "구동계 냉각수 온도"로 통일·벤치 출력 제한 LEVEL 1, 차고 "기어" → "변속·주차", 엔딩 "🛡 안전 관점" 토글(`CASE_SAFETY`). 스타일 `src/p0-v20.css`. 테스트 v5-flow의 HUD 문구 기대값 갱신.
- 다음 순서(마감 화~수): 벤치 테스트 케이스 카드+회귀+FTTI 시간 막대 → 메모판 측정 지점·측정 예산 → 레이싱 조건부 고장. 상세 `docs/GAME_REVIEW_2026-11-07.md` §11.

## 2026-11-07 2차 반영 (각 단계 커밋)
- 벤치 검증 리포트: TC 카드+PASS/FAIL 도장, "어느 검증 단계에서 처음 잡히나"(단위 MIL/SIL·임베디드 HIL·통합·차량), 회귀 체크 (`VerificationLab.tsx` `VerificationReport`).
- 차고: 예측 퀴즈 → "빼 보기 실험"(부품 빼면 3D에서 사라지고 밍이 역할·증상·안전 반응 설명, `partRole`/`ROLE_TEXT`/`DOMAIN_SYMPTOM`).
- 레이스: 고장이 구간 조건에서 발생(`OVERTAKE_ZONE` 풀가속 → 페달 45%, `CLIMB_ZONE` 고부하 → 온도·출력 제한), 구간 표지판, 거리 안전장치 유지. **실제 주행감은 브라우저 패널이 보일 때 플레이 테스트 필요.**
- 효과: `src/ui/sfx.ts`(Web Audio 합성 효과음·오르골 BGM, 우하단 토글), `src/ui/ComicBurst.tsx`(성게 말풍선: 경찰 접근·충돌·고장 클로즈업), 모든 버튼 스프링 눌림(CSS `scale`).
- 레이스 배경: CSS 평면 이미지 → 3D 하늘 돔(지평선=안개색)+구름+원경 산/섬, 지면·바다 확장. 선박 모드 배경은 기존 유지.
- 마감 후 후보: 맵 고도화(날씨·시간대, 신호등·횡단보도, 장애물(오토바이·고라니·멧돼지), 가로수·보도블럭, 갈림길·지하도·고가도로·오르막/내리막), 우편식 CAN 화면, 정비소 손님 의뢰, 매뉴얼 기반 신규 사건(참고 차종: 최신 EV인 Electrified G80 2027 — GV80은 EV 아님).

## 2026-11-07 3차 반영 (각 단계 커밋)
- 차고: 빼 보기는 E/E 관점(view 1)에서만. 제어기 클릭 → `ControllerCard`(받는 것·하는 일·시키는 것·통신 칩, `ECUS` 데이터), 말풍선 한 줄+칩, "범인 찾기" 미니게임(몰래 빠진 부품을 증상·단서로 맞히기).
- 성게 말풍선: `public/assets/ui/`의 SVG 에셋(burst-police/crash/fault, icon-police/skull/crash), 한 단어 제목, 부품은 개체만, 카트라이더식 대시 등장(`burstDash`).
- Control Software(view 2): `src/features/garage/SimulinkDiagram.tsx` — 로직 단계 키워드로 블록 종류 결정(맵·MIN·PI·1/z·상태기·스위치·비교), 병렬(A/B)·합류(MIN+CAN)·폐루프(Σ+피드백)·재귀(자기 루프), SW 컴포넌트 점선 서브시스템.
- 메모판: `MEASURE_RAIL`(사건별 측정 지점·정상값·✓/✗), 처음 어긋남 표시, 가설 자동 "반박/유력" 도장(`verdictFor`). 기존 드래그·실 연결·성공 조건은 그대로.

## 2026-11-07 4차 반영
- 레이스 긴장 알림: 생선 말풍선(`public/assets/ui/bubble-fish-*.svg`, `.fishAlert`), 좌·우만, 고장 순간·경찰 근접만. 충돌은 효과음만.
- 메모판: 미션 "어디서 처음 어긋났을까?" + 측정 기회 3번(`MEASURE_BUDGET`), 측정 +1은 HINT 이벤트(−5m), 별점. 연필 버그(제목이 카드 덮음, 실이 놓기 가로챔) 수정. 폴라로이드 그림: 주행 현상=`public/assets/board-photos/`, 계측=측정값 화면, 가설=부품 컷아웃(`SYMPTOM_PHOTO`/`SUSPECT_PART`).
- 퍼즐: 선 아래 신호 값(`SIGNAL_VALUE`), 요구사항 줄 ✓(`REQ_OF_STEP`), 함정 블록 메시지(`TRAP_MSG`).

## 2026-11-08 5차 반영
- Control Software: `SimulinkDiagram.tsx`를 그림 아이콘 + 한 줄 쉬운 설명(`plainText`) 흐름도로, 4개씩 지그재그 줄바꿈, 수식 표기 없음.
- 레이스: 키캡 조작 바(하단) + 출발 전 조작법 카드(왼쪽).
- 생선 말풍선: 동글·클레이 입체, 외곽선 없음(`bubble-fish-*.svg` 재작성).
- 폴라로이드: 3:4 + 정사각 사진창, CSS 종이 액자(예전 `polaroid-frame-real-v1.png` 배경은 사진창이 안 맞아 메모판에서 덮어씀), 실제 사진 `board-photos/`, 측정 후에만 값 스티커, '미분류' 문구 제거.
- 메모판: 출력은 처음부터 ✗(무료), `boundaryFound`(첫 ✗와 그 앞 ✓ 둘 다 측정) 시 성공, 측정 기회는 출력 제외 3번, 단계 바(`boardStepper`).

## 2026-11-08 6차 반영
- 차고: 3D 뷰 하단 여백 제거, 차체 기본 숨김(`shellToggle`), E/E 패널 탭 ① 부품 소개(`PartIntroCard`) ② 빼 보기 ③ 범인 찾기(밍 퀴즈, 보기 버튼).
- 흐름도: 줄 간 연결선은 점선 영역 밖, 외부 입력·피드백은 블록 위 태그(`fromTag`: CAN 한계 / ↩ 실제 값).
- 생선 말풍선: 아이보리 단색 + 갈색 외곽선, 눈은 점(경찰)·✕(고장).
- 메모판 → `src/features/board/SuspectBoard.tsx`(용의자 메모판): 출력 ✗ 무료, 측정 3번, 증거를 용의자에 끌어 무죄/유력 판정(`judge`), 1명 남고 유력이면 범인 확정. 구동 사건에 `aps_sensor` 가설 추가. 옛 `InvestigationBoard`는 미사용 보존.
- 다음 제안: E/E 관점을 도메인 공통 2D 설계도(전 도메인 ECU·게이트웨이·CAN 버스, 현재 도메인 강조)로, 퍼즐을 모양 다른 직소 조각·자동 연결(연필·지우개 제거)로.

## 2026-11-08 7차 반영 (흐름 재구성)
- 흐름: 고장 → **퍼즐(정상 기준 만들기)** → **메모판(도미노)** → 벤치. runtime `CONTINUE_FAULT`·체크포인트·선택 제동 → WIRING, 퍼즐 완료 → `OPEN_BOARD`, 메모판 완료 → `OPEN_BENCH`. 진행 바: 4 정상 기준, 5 메모판.
- 퍼즐: 조각 실루엣이 신호 종류별(`PIECE_IO`/`TAB`/`SOCKET` clip-path), 끼우면 자동 연결, 연필·지우개 숨김, 간격 156px.
- 메모판: `src/features/board/DominoBoard.tsx` — 전 도메인 E/E 설계도 위 신호 카드(정상/허용/이상), 이상 카드마다 시작점·원인 화살표·무시 판정, 도미노 연출, 시작점 제어기 확대(기준 SW vs 이번 SW, HW면 부품), 영향 카드 → sessionStorage `tb-impact-<case>` → 벤치 회귀 목록. 신입/실무자 모드(localStorage `tb-board-mode`): 실무자는 엉뚱한 단서·측정 전 카드(기회 2 + HINT −5m)·시간 순서 숨김. 옛 InvestigationBoard·SuspectBoard는 미사용 보존.
- 차고 E/E 관점: `src/features/garage/EeBlueprint.tsx` 전 차량 2D 설계도(선택 도메인 강조), Vehicle/System은 3D 유지.
- 대화 넘기기 Enter 지원. 생선 말풍선은 실루엣 외곽선만·작은 동그란 꼬리.

## 라운드 8 (메모판 재설계)
- 메모판 = `src/features/board/DominoTrace.tsx` "쓰러진 도미노 거꾸로 따라가기". 증상 도미노에서 시작 → 앞 후보 뒤집기(기준 점선 막대 vs 이번 막대) → 쓰러졌으면 따라가기 → 앞이 모두 서 있으면 🎯 첫 도미노 → 연쇄 애니메이션 → 안을 확대(SW 블록/HW 부품) → 함께 쓰러진 도미노 = 회귀 목록(sessionStorage tb-impact-<case>). 실무자 모드: 헷갈리는 후보 추가·조사 횟수 제한·별점. 옛 DominoBoard/SuspectBoard는 미사용 보존.
- 퍼즐은 화면 맞춤으로 시작. 줄바꿈은 띄어쓰기에서만(keep-all 전역).
- E/E 설계도: 신호 순서대로 그라데이션 흐름 화살표(파랑 입력 → 빨강 차량 반응). Vehicle/System: "🧩 전체 도메인 보기" 토글(7개 도메인 동시 표시, 선택 도메인만 동작).
- 알려진 작은 문제: 전체 도메인 보기에서 '구동' 이름표가 안 보일 때가 있음. tests 중 .ts를 직접 불러오는 4개 파일은 이 Node 버전에서 못 돌림(기존 환경 문제).

## 라운드 9
- 도미노 추리판(`DominoTrace.tsx`) v5: 한 화면(스크롤 없음)·기울기 없음. 질문은 "○○이(가) 기준과 달라진 원인은?". 후보 3개(실무자는 4개). 이상값은 빨강이 아닌 주황 '🔎 단서'. 단서가 나오면 '따라가기'만, 앞 후보가 모두 정상일 때만 '🎯 시작점' 버튼(실무자는 미리 추리 가능, 틀리면 조사 1회 차감). 좌상단 '🗺 전체 지도' = 센서→제어기→CAN→부품→차량 서브시스템, 출력부터 거꾸로 쓰러지는 애니메이션. 확대 단계에 요구사항 한 줄(📘). 좌하단 정답 보기.
- 퍼즐: HW는 실제 부품 사진(ending-thumbs, 잘리지 않게 안전 영역 안), SW는 그림 아이콘. 흐름 밖 후보 조각은 사각형(모양으로 정답 유추 불가), 빈칸에 끼우면 직소 모양. 빨간 연결선 숨김.
- E/E: 잘림 원인(.eeBlueprint position 덮어쓰기) 제거. 아래 패널 첫 탭 '🧭 흐름 따라가기' = 단계별 받는 값 → 하는 일 → 보내는 값, 화살표 번호·전달 값 태그, 자동 재생.
- Vehicle/System: 이 도메인 / 나란히 / 겹쳐 보기. drei Html은 Canvas 재마운트 직후 첫 라벨을 빠뜨려서 숨은 spacer 라벨을 먼저 둠.

## 라운드 10
- 도미노 v6: 신입/실무자 모드 없앰(하나로 통일). 카드는 폴라로이드 사진(board-photos·ending-thumbs·증거 아틀라스·차 이미지). 측정하면 기준/지금 막대 + ⏱ 달라진 시각. 각 단계 후보 3개 = 진짜 원인(더 먼저 달라짐) + 함정(더 나중에 달라짐 = 결과) + 정상. '이게 원인!'으로 지목, 함정 지목 시 ♥ 감소·영향 목록에 추가. 타임라인 그래픽으로 먼저/나중 비교. 함정도 회귀 목록에 들어감. '옛 보정' → '보정 계수 ×0.45'.
- 퍼즐 v3: 퍼즐판 테두리 안에 조각이 맞물린 상태(간격 116px), 빈칸 2개 + 아래 '남은 조각' 칸. 조각 내용은 안전 영역 안(잘림 없음). HW = 부품 사진, SW = 실행되는 제어기 사진(증거 아틀라스) + 로직 배지. 더블클릭 = 큰 조각 + 하는 일·받는/보내는 신호·요구 값. 함정 조각 설명은 범인 노출 없이 중립 문구.

## 라운드 11
- 레이싱: 키는 event.code(물리 위치)로 읽음 → 한글 입력 상태에서도 동작(R이 "ㄱ"으로 와서 재시동이 안 되던 원인). 방향키 기본 표기, WASD도 됨. Q=회생 강하게(왼쪽 패들), E=약하게. P→D는 브레이크 없이도 되고 팁만 표시. 기어 P/R/N/D(1~4키). 주행 중 P/R 금지, 정차 중 변속은 S(브레이크) 필요 = 변속 인터록. 첫 레이스는 P에서 시작('S 밟고 4' 안내). Q/E는 회생 단계(EV 패들) 유지. 신호등 램프가 운전자 쪽을 보도록 수정(빨강 위·초록 아래). '오르막 고부하' → '🔥 연속 고부하 구간'(실제 언덕 없음), 760m부터·출력 제한 55 km/h. R 재시동 뒤 느려진 건 바로 과열 구간에 들어가서였음.
- 도미노: 후보는 측정으로 확실히 배제되는 것만(정상값 또는 더 나중에 달라진 결과). 마지막 단계는 그 부품의 입력을 전부 보여 줌(입력 모두 정상 + 출력만 다름 → 원인은 내부).
- 벤치 v4(`TwinBenchExperience`): 재현 입력 → 관측 경계 → 고치기 전 실행(FAIL) → 고치기(원인 제거 vs 땜질 3택) → 다시 실행(PASS)·회귀·검증 단계 질문. 옛 화면은 `TwinBenchClassic`으로 보존(미사용).

## 라운드 12
- 레이싱 HUD: 고정(추격 거리·백미러·계기판·조작법·미니맵) 외 안내 카드(존 표지·경고·미션·기어 안내·토스트·자동 정차·최종 램프)는 `.raceFeed` 한 칸에 세로로 쌓음. 미니맵 경로·마커는 `trackFrame`에서 샘플링(MINIMAP_PATH)이라 항상 도로 위. 미니맵은 사운드 버튼 위로.
- 벤치 v5: 사건 재현 입력 → 프로브 꽂고 실행(신호 모니터: 신호마다 기준 점선 vs 이번 실선 + 갈라진 시점 빨간 선, 🚩로 처음 갈라진 신호 지목 · 시간 비교로 판정) → 고치기 → 다시 실행(PASS)·회귀·검증 단계. 왼쪽 시뮬레이션 탭 5개(SW 로직=RestoredPuzzleVisual, E/E=HardwareRigVisual, 기계 부품=EmbeddedBench3D, 시스템=SystemNetworkVisual, 실차=BenchVisual vehicle)가 실행 중 동적으로 움직임. 신호 데이터는 `SIGNALS`.
- 도미노: 수상한 사진의 📌 압정을 끌어 빨간 실로 위 도미노에 연결(드롭 대상 강조), 측정 시 카드 뒤집기 애니메이션.

## 라운드 13 (중간 평가 반영 계획)
- 완료: 퍼즐 조각 안쪽 여백 통일(본체 기준 좌우 14px), 배경음 기본 끔(키 tb-music-v2), 열관리 사건 정답 노출 문구 제거(제목 '오래 달리자 힘이 빠지고 경고등이 켜졌다', 팝업 '힘이 빠져!', 경고 '파워다운 표시등 · 출력 제한', 구간 '장거리 고속 구간', 경고등 설명은 설명서식 원인 후보 3개).
- 계획 1 완료(라운드 14): 새 퍼즐 `src/features/wiring/RefPuzzle.tsx`(WIRING 장면, 옛 WiringPuzzle은 미사용 보존). 블록 이름·그림은 차고 Control SW(getFeatureLayer 3번 층, blockKind/Picto/KIND_TAG)와 같음. 어떤 조각이든 빈칸에 들어가고 자동 연결·값 표시 없음 → '▶ 실행'으로 값이 칸마다 흐르다 첫 불일치에서 멈춤(요구사항 ✗, 밍 설명). 함정은 '표 B'(같은 블록, 다른 표 값)와 다른 기능 블록. 옆 입력(BMS 한계·다른 온도·회생 가용량)이 MIN/최대값 블록으로 올라오는 병렬 구조. 📒 차고 노트(오픈북, HINT -5m)로 차고 그림 다시 보기. 열관리 퍼즐은 '출력 제한(보호) 판단' 경로(팬 언급 없음). 개발용 URL `?qa=WIRING&case=thermal`.
- (원래 계획 1) 퍼즐을 차고 Control Software와 같은 쉬운 말 블록·그림으로, 맞춘 뒤 '실행'으로 값이 흐르는지 확인(자동 연결·값 표시로 정답 노출 금지). 열관리 퍼즐은 '냉각 팬 제어'가 아니라 증상 쪽 '출력 제한(파워다운) 판단' 경로로 바꿔 스포일러 제거.
- 계획 2: 차고를 3D 하드웨어 + E/E(배선·통신) + Control SW(ECU 안 계산)를 같은 단계 번호로 연동, 자동 재생 대신 직접 넘기기.
- 계획 3: 정비 노트(오픈북) — 차고에서 본 카드를 모아 두고 퍼즐·도미노에서 다시 열기.
- 계획 4: 레이싱 긴장감(사이렌 거리감·조작 미션) + 신규 고장(정차 후 READY 불가 등).

## 라운드 15 (기준 수립)
- **단계 순서·역할의 기준 = `docs/VERIFICATION_FLOW_STANDARD.md`.** 피드백은 이 문서에 비추어 판단(오락가락 금지). 핵심: 도미노(원인 역추적·의심 구간에서 멈춤) → 퍼즐(요구사항 기반 정상 동작 복원, 의심 구간 전체·E/E·HW 포함) → 벤치(시뮬레이션 검증: 레벨 질문·기법 선택·정상 vs 현장 기록 비교). 오답은 단계 안에서 교정, 분기 없음. 순서 변경은 사용자 확인 대기.
- 완료: 차고 첫 화면 = 도메인 선택 없음 + 전체 도메인 나란히, 하단 '…' 잘림 제거, 좌측 '차량 레이어 관점', '같은 위치·다른 관점' 제거. 레이싱 전용 배경음(sfx setMusicScene, 키 tb-race-music 기본 켜짐). 퍼즐: 요구사항 우측, 값 표시창·화살표, 빈칸 분산(연속 ≤2), 차고 노트는 순서 없는 카드·실행 1회 실패 후, 밝은 색, 제목 '요구사항 기반 정상 동작 복원'. 말투: 사건 제목·레이싱 팝업·도미노·벤치 안내를 해요체로(컷신 대사 일부는 아직 반말·감탄).

## 라운드 16 (순서 변경 완료)
- 흐름: 고장 → BOARD(DominoTrace: 원인 역추적, 마지막에 '의심 구간' 3지선다, 도미노 쓰러짐+영향 갈래) → WIRING(RefPuzzle: 의심 구간의 정상 동작, 열관리=팬 구동 경로·E/E 출력단, 제동=유압 모듈까지) → TWIN_BENCH(v6: 검증 레벨 → 시험 기법 5종 → 정상 시나리오 vs 현장 기록 비교·프로브는 레벨에서 보이는 신호만 → 고치기 → 다시 실행·회귀). runtime CONTINUE_FAULT→BOARD, OPEN_WIRING은 BOARD에서 가설만 있으면 통과, 퍼즐 끝 OPEN_BENCH. 의심 구간은 sessionStorage `tb-section-<case>`.
- 벤치 SW 탭 = RefPuzzleTrack(퍼즐과 같은 조각, 위=정상 값, 아래=현장 값). 탭은 LEVELS 4개(단위/임베디드/통합/차량). 신호 곡선은 아직 미리 정한 함수(실제 수치 모델 아님).
- 라운드 17: 수치 모델 완료(`simModel.ts`, dt 5ms 적분, 정상/현장/수정 3회 계산). 레벨 = 단위→SW 통합→임베디드→차량, 탭마다 신호 목록이 다름, 첫 불일치는 계산값으로 판정.
- 남은 것: 시스템 통합 3D 재정비, HIL 3D 라벨 겹침, 컷신 대사 말투, 도미노 측정 비용.

## 라운드 18 (재설계 대기)
- **다음 큰 작업의 기준 = `docs/REDESIGN_2026-11-08.md`** (시뮬레이션 검증: 정상 시나리오 확인 → 고장 재현 2미션, 선택이 실제 시험에 반영, 로직 흐름/하드웨어 시뮬레이션 보기 분리, 관측점 개수 제한 / 원인 역추적: E/E 판 + 틀린그림찾기 → 거꾸로 도미노 → 카드로 좁히기 / 차고: 단계형 + 3D·E/E·Control SW 동기 화면). 사용자 승인 후 구현.
- 시험 레벨 이름: SW 단위 시험 / SW 통합 시험 / 임베디드 SW 시험(SW 레벨, 26262-6) / 시스템 통합 시험(시스템 레벨, 26262-4). "자극" 대신 "입력값 인가". 모델-코드 비교(back-to-back)는 게임에서 수행 불가라 제외.
- 퍼즐 이름 "요구사항 기반 로직 퍼즐", 블록 ? 버튼 말풍선(표 값 표시, Delete/Esc로 닫기), 단위 표시창 "? %", 맞출 칸 요구사항 노란색, 판 가운데 정렬. 비유 표현 금지(객관적 서술).
- 차고 배경 타이머(1.45초 자동 진행)가 흐름 카드 멈춤과 충돌하던 버그 → `garageAutoTour=false`. 빼 보기·범인 찾기 탭 숨김(`SHOW_PULL_TABS=false`).

## 남은 일 (우선순위 순)
0. 차고(도메인 동작 원리) 페이지를 '정비소 첫날' 단계형 체험으로: 정보 양 줄이기.
0. 신규 고장 아이디어: 신호 대기 정차 후 READY 꺼짐·재시동 불가(전원 도메인).
1. 생성 이미지가 들어오면 메모판을 아틀라스 대신 개별 증거 이미지 파일로 전환. (부품 모델 차고·벤치 연결은 완료)
2. Day 2~6: 레이스에 driverInput 연결, 단계별 시뮬레이션, 차고·벤치 공용 부품 에셋, Tier C 부품 직접 모델링(규격은 `docs/TIER_C_ASSET_PLAN.md` 4절).
3. 실제 주행 fps 측정 (브라우저 패널이 보이는 상태여야 함. 숨겨져 있으면 rAF 정지).
4. 기존 React 경고: RaceExperience가 setSim 업데이터 안에서 send 호출 (미수정).
5. 선택: `node_modules/.vite`가 커밋에 섞임 → .gitignore 추가 제안만 한 상태.

## 참고 문서 (필요할 때만)
- `docs/GAME_REVIEW_2026-11-07.md`: 다각도 평가·페이지별 개선안·제네시스 매뉴얼 활용·신규 고장 시나리오 10개·P0~P2 로드맵 (다음 작업의 기준).
`docs/REFACTOR_GAP_ANALYSIS.md`(분석·6일 계획), `docs/ASSET_CANDIDATES.md`, `docs/ASSET_LICENSES.md`, `docs/TIER_C_ASSET_PLAN.md`.

## 세션 끝낼 때
"남은 일"과 바뀐 사실을 이 파일에 갱신하고 커밋·push 여부를 사용자에게 묻는다.
