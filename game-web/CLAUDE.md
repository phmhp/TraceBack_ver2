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
- 답변은 한국어, 짧고 쉽게. 커밋은 사용자가 요청할 때만.

## 구조 요점
- 씬 상태머신 `src/game/runtime.ts`, 실제 렌더 씬 `src/experiences.tsx` (`main.tsx`에는 안 쓰는 레거시 컴포넌트가 남아 있음, 지우지 말 것).
- 시뮬 데이터 `src/sim/`: types, components(부품 28·연결 38·ECU 6), registry(포함/제외 영향 분석), driverInput(Enter 시동, W/S, A/D, Space 보조브레이크), vehicleSim(시나리오 수치 재현, 고장 훅 pedalScale/fanStuck/brakePressureGain).
- 차량 `src/features/vehicle/`: carBody(로프트 차체, 앞=-Z), bake(재질별 병합), HeroConvertible(Lou 운전·Ming 동승), CatCharacter. 레거시 `Convertible`은 `?car=legacy`로 비교용 유지.
- 개발 전용(프로덕션 번들 제외): `?showroom=car`, `window.__tbProbe.race(frames)`.
- 메모판 폴라로이드: 틀 `polaroid-frame-real-v1.png`(`.polaroidCard`), 사진은 아틀라스 `diagnostic-evidence-sheet-v1.png` + `evidenceAtlasCell`.

## 이미지 프롬프트 (v3, 커밋됨)
- 원본 데이터 `scripts/image-prompt-data.mjs` → `npm run prompts` → `docs/PART_IMAGE_PROMPTS.md`, `docs/image-prompts/01~12.md` 생성. md 직접 수정 금지.
- 규칙: 코드블록 1개 = 요청 1번 = 이미지 1장, 파일명 `<id>__REF|TURN|EXPL|CUT|EVID-ok|EVID-fault.png`, EVID는 틀 없는 정사각형 사진. 생성 이미지는 `game-web/asset-intake/images/`에 저장.
- `tests/image-prompts.test.mjs`가 부품·증거 누락을 막는다.

## 남은 일 (우선순위 순)
1. 생성 이미지가 들어오면 메모판을 아틀라스 대신 개별 증거 이미지 파일로 전환.
2. Day 2~6: 레이스에 driverInput 연결, 단계별 시뮬레이션, 차고·벤치 공용 부품 에셋, Tier C 부품 직접 모델링(규격은 `docs/TIER_C_ASSET_PLAN.md` 4절).
3. 실제 주행 fps 측정 (브라우저 패널이 보이는 상태여야 함. 숨겨져 있으면 rAF 정지).
4. 기존 React 경고: RaceExperience가 setSim 업데이터 안에서 send 호출 (미수정).
5. 선택: `node_modules/.vite`가 커밋에 섞임 → .gitignore 추가 제안만 한 상태.

## 참고 문서 (필요할 때만)
`docs/REFACTOR_GAP_ANALYSIS.md`(분석·6일 계획), `docs/ASSET_CANDIDATES.md`, `docs/ASSET_LICENSES.md`, `docs/TIER_C_ASSET_PLAN.md`.

## 세션 끝낼 때
"남은 일"과 바뀐 사실을 이 파일에 갱신하고 커밋·push 여부를 사용자에게 묻는다.
