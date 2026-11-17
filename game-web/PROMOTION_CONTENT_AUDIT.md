# TraceBack 홍보 콘텐츠 사전 조사

- 조사일: 2026-11-16
- 조사 범위: `TraceBack_ver2/game-web`
- 조사 방식: 소스·정적 데이터·기존 캡처·기존 문서 확인, 대표 이미지 시각 확인
- 이번 단계에서 하지 않은 일: 기존 소스/에셋 수정, HTML 홍보 페이지 구현, 브라우저 검수, 대규모 빌드

## 읽는 법

- **[확인]** 현재 소스, 에셋, 캡처 또는 문서에서 직접 확인한 사실
- **[제안]** 홍보 페이지에서의 표현·구성 제안
- **[주의]** 사실은 있으나 홍보 문구로 단정하기 전에 범위를 제한해야 하는 항목
- **[미구현/미검증]** 설계 문서나 코드 일부에는 있으나 실제 홍보 문구로 확정하지 말아야 하는 항목

## 1. 한 줄 정의

### [확인] 게임의 목적

TraceBack은 붉은 EV를 몰고 도주하는 동안 발생한 이상 증상을 관찰하고, 차량 신호의 첫 편차를 역추적한 뒤, 정상 로직을 조립하고 시뮬레이션으로 검증해 수리한 다음 추격을 이어가는 웹 게임이다.

근거:

- 게임 제목 화면 문구: `src/main.tsx:519-535`의 `증상에서 원인까지, 검증으로 증명하기`
- 상태 전이: `src/game/runtime.ts:239-414`
- 실제 화면 분기: `src/main.tsx:1507-1542`
- 원인 추적 화면 제목·목표: `src/features/board/EeTrace.tsx:331-345`
- 정상 기준 퍼즐: `src/features/wiring/RefPuzzle.tsx:384-507`
- 검증·수리 연결: `src/game/runtime.ts:334-414`, `src/features/cutscenes/StaticCutscenes.tsx:70-104`

### [확인] 이야기와 캐릭터

드라이버 고양이 `볼트`, 엔지니어 고양이 `너트`, 후원사 대표 `폭스`가 등장한다. 두 고양이는 직접 만든 차로 우승했지만 후원사 대표에게 상금을 빼앗기고 누명을 쓴 뒤, 상금을 되찾아 자신들의 차를 증명하기 위해 도주·레이스를 시작한다.

근거: `src/game/cast.ts:1-13`, `src/main.tsx:584-607`.

### [제안] 타깃

코드에 명시된 마케팅 타깃은 없다. 다음은 게임 구조에서 도출한 제안이다.

- 1차: 자동차·레이싱·추리 게임을 좋아하는 사내 구성원
- 2차: 차량 신호·제어 SW·테스트 사고를 가볍게 체험하고 싶은 비전공자/신입
- 3차: 요구사항 → 정상 기준 → 시험 → 재시험의 흐름을 아는 실무자

홍보 문구에서는 “자동차 SW를 배워야 하는 게임”보다 “추격을 멈추고, 차가 왜 이상해졌는지 직접 찾아내는 게임”을 앞에 두는 편이 실제 플레이 경험에 맞다.

## 2. 핵심 플레이 경험

### [확인] 플레이어가 체감하는 재미

1. **추격의 압박**: 주행 중 경찰차가 합류하고 `policeGapMeters`가 줄어든다. 정차·추리·실험 중에도 추격 격차가 소모될 수 있다. `src/main.tsx:145-151`, `src/game/runtime.ts:227-238`.
2. **증상에서 원인으로 거꾸로 생각하기**: 출력부터 앞쪽 신호로 이동하며 기준값과 이번 값을 비교하고, 첫 편차와 의심 구간을 고른다. `src/features/board/EeTrace.tsx:331-406, 496-566`.
3. **정상 로직 맞추기**: 빈칸에 로직 블록을 배치하고 `▶ 실행`으로 값이 흐르는 순서를 확인한다. 틀린 블록에서는 첫 불일치가 멈춘다. `src/features/wiring/RefPuzzle.tsx:384-507`.
4. **실험으로 확인하기**: 시험 레벨별 입력·관찰 신호·정상 기준을 보고 실행 후 PASS/FAIL을 확인한다. `src/features/verification/VerificationLab.tsx:1719-2301`.
5. **수리 후 같은 주행으로 복귀하기**: 검증된 수정만 적용하고 달리던 거리·추격 격차를 유지한 채 `CHASE_RESUME`으로 돌아간다. `src/game/runtime.ts:334-372`, `src/features/cutscenes/StaticCutscenes.tsx:159-216`.

### [제안] 짧은 홍보 키워드

`고양이 듀오` · `붉은 EV` · `해안 추격` · `도미노 역추적` · `정상 로직 조립` · `실험으로 검증` · `수리 후 재주행`

## 3. 실제 구현된 흐름과 플레이어 행동

| 순서 | 실제 장면/상태 | 플레이어 행동 | 다음 조건 | 근거 |
|---|---|---|---|---|
| 0 | `TITLE` | 새 게임 시작 또는 이어하기, 설정/조작법 확인 | 새 게임이면 `PROLOGUE` | `src/main.tsx:507-582` |
| 1 | `PROLOGUE` | 컷신 5장면을 버튼/Enter/Space로 넘김 | 마지막 장면에서 계속 | `src/main.tsx:584-623` |
| 2 | `GARAGE_L1~L4` | 차량 기능의 4 관점과 도메인 신호 흐름을 보고, 부품을 클릭/길게 눌러 입력을 확인 | L4에서 테스트 드라이브 | `src/experiences.tsx:837-1076`, `src/main.tsx:632-760` |
| 3 | `LEVEL_SELECT` | 사건/레벨 선택 | 잠금 조건 충족 시 시작 | `src/features/levels/LevelSelect.tsx:1-100`, `src/game/runtime.ts:239-275` |
| 4 | `DRIVE_BRIEFING` | 도주 컷신·경찰 합류·고장·해적선 목표를 읽고 시작 | `도주 시작` | `src/features/cutscenes/StaticCutscenes.tsx:24-68` |
| 5 | `CHASE_NORMAL/RESUME` | 키보드로 가속·브레이크·조향, P/R/N/D, 회생 단계를 조작하고 충돌을 피함 | 사건별 조건에서 고장 발생 | `src/experiences.tsx:1692-2179`, `src/game/faultSchedule.ts` |
| 6 | `FAULT_CUE` | 운전자 증상과 경고/무경고 상태를 확인하고 대화를 넘김 | `계속` 후 원인 추적 | `src/experiences.tsx:2200-2255` |
| 7 | `BOARD` / 화면 제목 `도미노` | 기준/이번 값을 측정하고 출력에서 거꾸로 따라가 첫 편차·의심 구간·가설을 분류 | 가설 후보를 정리하면 퍼즐 | `src/features/board/EeTrace.tsx:331-411, 496-566` |
| 8 | `WIRING` | 정상 기준 로직 블록을 빈칸에 드래그해 놓고 실행으로 값 흐름을 확인 | PASS 후 시험 설계서 확정/벤치 이동 | `src/features/wiring/RefPuzzle.tsx:384-507, 714-773` |
| 9 | `TWIN_BENCH` | 시험 레벨·기법·입력·관측 신호를 고르고 정상/고장 결과를 실행해 비교 | 결과에 따라 수리 또는 해설 | `src/features/verification/VerificationLab.tsx:1719-2301`, `src/game/runtime.ts:334-356` |
| 10 | `VERIFY_FAIL` | 실패 원인 해설의 정상 경로를 단계별로 확인 | 가이드 수리로 이동 | `src/experiences.tsx:3062-3081` |
| 11 | `REPAIR` | 검증된 수정 적용 과정을 보고 자동 주행 복귀 | `APPLY_REPAIR` 후 `CHASE_RESUME` | `src/features/cutscenes/StaticCutscenes.tsx:70-104`, `src/game/runtime.ts:334-372` |
| 12 | `SHIP_ESCAPE/SHIP_BOARDING` | 해안 도로를 달려 램프·해적선 갑판에 진입 | 거리 조건 충족 후 엔딩 | `src/experiences.tsx:1300-1350, 2034-2051`, `src/features/cutscenes/StaticCutscenes.tsx:218-256` |
| 13 | `ENDING` 또는 `CAUGHT` | 사건 보고/탈출 성공 또는 이어하기 확인 | 메인 메뉴/새 사건 | `src/main.tsx:1537-1542`, `src/ui/CaseFileEnding.tsx` |

### [확인] 사건 범위

런타임에는 `propulsion`, `thermal`, `brake`, `regen`, `ready`, `gear`, `cold` 사건이 정의되어 있다. 고정 레벨 순서와 잠금 조건은 `src/game/runtime.ts:239-275`에 있다. 엔딩 화면의 필수 사건은 `propulsion`과 `thermal` 2건으로 집계되며, 나머지는 선택/추가 사건 성격이다(`src/main.tsx:1537-1538`, `src/ui/CaseFileEnding.tsx`).

홍보 페이지에서는 “7개 사건을 모두 클리어한다”고 단정하지 말고, **“주요 사건을 추리하고, 추가 고장도 시험할 수 있다”** 정도로 범위를 제한한다.

## 4. 가장 인상적인 실제 장면

### [확인] 1순위: 붉은 EV와 고양이 듀오가 보이는 타이틀/차고

- 시각 포인트: `public/assets/stitch23/menu-garage.png` 1376×768, 로고·붉은 차·두 고양이·해안도로가 한 프레임에 있다.
- 실제 사용: `Title`의 배경으로 사용, `src/main.tsx:519-522`.
- 추천 역할: 첫 화면 히어로. 텍스트는 `TraceBack`과 “차가 왜 이상해졌는지, 직접 찾아낸다” 정도로 짧게.

### [확인] 2순위: 해안 도로 추격

- 시각 포인트: `public/assets/stitch23/chase-coast.png` 1376×768. 붉은 오픈카, 고양이 2명, 해안 곡선 도로, 석양.
- 실제 사용: 런타임 주행은 Three.js `RaceWorldScene`이고, 이 이미지는 씬 배경/캡처·컷신 소재로 사용 가능. `src/experiences.tsx:1459-1681`, `src/features/cutscenes/StaticCutscenes.tsx`.
- 경찰 합류 조건: 일반 주행에서 경과 3초 및 45m 이후 `policeHasJoined`가 참이 된다(`src/experiences.tsx:1974-1979`).
- 추천 역할: 관심을 끄는 1면 또는 핵심 재미 섹션.

### [확인] 3순위: `BOARD` 도미노 화면

- 시각 포인트: 코르크판, 실사진 폴라로이드, 기준/이번 값, 도미노 단계.
- 실제 사용: 현재 `main.tsx`는 `BOARD`에서 `EeTraceV2`를 마운트한다. `DominoTrace`는 import되어 있으나 현재 라이브 분기에서는 사용하지 않는다(`src/main.tsx:1530`, `src/features/board/EeTrace.tsx:331-566`).
- 추천 역할: “출력에서 거꾸로 따라가 첫 편차를 찾는다”를 보여주는 핵심 증거. `--help/27_evidence_board.png`는 과거/실행 캡처이므로 라이브 화면과 동일하다고 단정하지 않는다.

### [확인] 4순위: 정상 로직 조립 퍼즐

- 실제 화면: `WIRING` → `RefPuzzle`.
- 실행 조건: `BOARD`에서 가설/증거 조건을 충족해 `OPEN_WIRING`, 퍼즐을 채운 뒤 `▶ 실행`이 PASS이면 벤치로 이동.
- 시각 포인트: 블록을 끼우고 값이 슬롯별로 흐르다가 첫 불일치에서 멈추는 장면.
- 추천 역할: “추리”와 “개발”을 동시에 보여주는 인터랙션 컷. `--help/28_wiring_puzzle.png`를 참고하되 실제 캡처는 현재 화면에서 다시 확보해야 한다.

### [확인] 5순위: 실험 검증 그래프

- 실제 화면: `TWIN_BENCH`에서 정상 기준선과 고장 실행선을 비교하고 PASS/FAIL을 판단.
- 근거: `src/features/verification/VerificationLab.tsx:1719-2301`, 실행 모델 `src/features/verification/simModel.ts`.
- 추천 역할: 학습 가치 섹션. “정답을 찍는 게 아니라, 정상과 실제를 같은 조건에서 비교한다.”

### [확인] 6순위: 해적선 램프 도약·착지

- 실제 장면: `ShipBoardingSequence`, 0프레임 도약 → 1프레임 착지, 각 프레임 4.5초 후 전환 또는 클릭. `src/features/cutscenes/StaticCutscenes.tsx:218-256`.
- 핵심 조건: `SHIP_ESCAPE`에서 `FINISH_ESCAPE`가 거리 1080 이상일 때 `ENDING`으로 전환(`src/game/runtime.ts:391-404`).
- 추천 역할: 마지막 플레이 유도 섹션. “고쳤다면, 다시 달려 탈출한다.”

## 5. AI 활용 개발 과정 중 코드·문서로 확인되는 내용

### [확인] 확인 가능한 개발 흔적

- `CODEX_REFACTOR_MASTER.md:4`에 대상 개발 도구가 OpenAI Codex로 기록되어 있다.
- `CLAUDE.md:1, 8-9, 24-34`에 Claude용 인수인계, React/TypeScript/Vite 스택, 실행 명령, 소스 구조가 기록되어 있다.
- `docs/CROSSCHECK_STEP01.md:6, 394`에는 GPT 교차 검토를 후보로 사용하고 Claude가 수정 반영하는 절차가 기록되어 있다.
- `docs/image-prompts/*.md`와 `scripts/image-prompt-data.mjs`에는 이미지 프롬프트를 원본 데이터에서 생성하는 흐름이 기록되어 있다.
- `src/features/vehicle`, `src/features/garage`, `src/features/verification`에는 절차형 Three.js 모델, 로직 흐름, 수치 기반 검증 모델이 구현되어 있다. `WORK_HANDOFF.md`는 현재 차량이 GLB/GLTF가 아닌 절차형 Three.js 모델임을 기록한다.
- `tests/*.mjs`와 `package.json`에는 게임 로직·차량·시나리오·검증을 자동 확인하는 테스트 구조가 있다.

### [주의] 홍보에 쓸 수 있는 표현

- “AI를 활용해 아이디어·화면·에셋·코드를 빠르게 만들고, 사람이 실제 게임 흐름과 테스트로 검증했다.”
- “AI가 만든 결과를 그대로 사용한 것이 아니라, 차량 신호 흐름·사건 데이터·검증 계약·테스트를 연결해 플레이 가능한 형태로 다듬었다.”

### [미확인] 단정하지 말아야 하는 표현

- “AI가 게임을 전부 자동 개발했다.”
- “실제 차량 ECU/HIL을 연결했다.” 현재는 웹 내 시뮬레이션/교육 모델이며, `IMPLEMENTATION_AUDIT_V14.md`도 실제 ECU/실시간 Plant가 없음을 명시한다.
- “AI가 모든 에셋을 생성했다.” 일부는 이미지 프롬프트/생성 기록이 있지만, 차량·부품은 코드 제작 모델과 이미지 에셋이 혼합되어 있다.

## 6. 홍보 페이지 정보 발견 순서 제안

### [제안] 스크롤 내러티브

1. **상황** — “고양이 듀오의 붉은 EV가 경찰에게 쫓긴다.” `menu-garage` 또는 `chase-coast`
2. **추리의 재미** — “출력에서 거꾸로. 처음 어긋난 곳을 찾는다.” `BOARD`
3. **학습 가치** — “정상 로직을 조립하고, 같은 조건에서 비교한다.” `WIRING` + `TWIN_BENCH`
4. **AI 제작 과정** — 짧은 4단계: 아이디어/프롬프트 → 코드/3D 조립 → 시뮬레이션 → 테스트·수정
5. **플레이 유도** — 해적선 도약/엔딩 + `게임 시작` 버튼

### [제안] 모바일 첫 화면

모바일에서는 고정 1600×900 게임 캔버스를 축소한 현재 게임 UI를 그대로 홍보 페이지의 첫 화면으로 사용하지 않는다. 제목을 상단, 세로로 잘리지 않는 대표 장면을 중앙, 버튼을 하단 고정에 가깝게 두고, `chase-coast` 또는 `menu-garage`를 모바일용 crop으로 별도 배치한다. 이는 홍보 페이지 제안이며 게임 소스의 모바일 지원을 의미하지 않는다.

