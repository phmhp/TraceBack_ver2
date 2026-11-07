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
- 스타일: 동물의숲처럼 아기자기·뽀짝, 설명은 루·밍 말풍선 위주, 텍스트보다 그래픽. 숫자 직접 입력 같은 '일하는 느낌' 금지(고르기·끌기만). 클릭·선 긋기는 쫀득한 촉감+효과음.

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

## 남은 일 (우선순위 순)
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
