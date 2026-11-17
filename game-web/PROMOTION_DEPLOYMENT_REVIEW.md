# TraceBack 홍보 페이지 배포 검토

- 조사일: 2026-11-16
- 범위: 현재 `game-web`의 PC/모바일 실행, 입력 의존성, 정적 배포, 게시판 HTML/외부 랜딩페이지 분리
- 이번 단계에서 하지 않은 일: 브라우저 검수, 서버 공개, iframe 실제 삽입 시험, 빌드 재실행

## 표기

- **[확인]** 코드·설정·기존 실행 기록에서 확인
- **[제안]** 홍보 페이지 구현 시 권장
- **[위험]** 배포 전에 별도 검증이 필요한 항목
- **[미검증]** 현재 조사만으로 보장할 수 없는 항목

## 1. 현재 기술 스택과 배포 단위

### [확인]

- `package.json`: React, TypeScript, Vite, Three.js, `@react-three/fiber`, `@react-three/drei`.
- 개발 서버: `npm run dev`.
- 빌드: `npm run build` = `tsc -b && vite build`.
- 진입점: `index.html`의 `/src/entry.tsx`.
- 현재 `dist/` 디렉터리와 `dist/assets/` 산출물이 이미 존재하지만, 이 조사에서 빌드를 다시 실행하지 않았다.
- Vite 기본 산출 구조이므로, 빌드가 성공하면 서버 측 API 없이 정적 파일을 제공할 수 있는 구조다.

### [주의]

정적 호스팅 가능성은 **코드 구조상 높음**이지만, 실제 호스팅 서비스의 SPA fallback, MIME type, 경로 대소문자, 캐시 정책은 별도 확인이 필요하다. `dist/`를 현재 상태 그대로 배포 가능하다고 확정하지 않는다.

## 2. PC/모바일 지원 상태

### [확인] 게임 UI의 실제 레이아웃 방식

게임은 최상위에서 1600×900 iframe을 만들고, 창 크기에 맞춰 전체를 축소·레터박스한다.

- `src/entry.tsx:1-7`: 고정 1600×900 캔버스와 iframe 스케일링 설명
- `src/ui/ScaledFrame.tsx:1-35`: `CANVAS_W = 1600`, `CANVAS_H = 900`, `fit()`으로 `min(window.innerWidth / 1600, window.innerHeight / 900)` 계산
- `src/ui/scaled-frame.css:1-3`: viewport 전체 overflow hidden, 중앙 transform scale
- iframe에는 `allow="autoplay; fullscreen"`이 설정된다.

### [확인] 반응형 보정은 존재하지만, 모바일 전용 레이아웃은 아니다

CSS에는 `@media (max-width: ...)`, `@media (max-height: ...)`, `@media (max-aspect-ratio: 4/3)`가 다수 존재한다. 다만 iframe 내부 앱은 1600×900 좌표계로 동작하므로, 휴대폰 화면에서의 미디어쿼리는 실제 기기 폭을 직접 기준으로 하지 않고 스케일된 게임 프레임 안에서 동작한다.

### [판정]

| 구분 | 현재 상태 | 홍보 페이지 판단 |
|---|---|---|
| PC 키보드 | **지원** | 실제 플레이 CTA에 사용 가능 |
| PC 마우스 | **부분 지원** | 버튼·3D 부품·드래그 퍼즐·보드 조작에 사용 |
| 모바일 터치 | **부분 지원** | 차고·보드·퍼즐의 Pointer Events는 존재하지만 전체 게임의 플레이 보장은 아님 |
| 모바일 레이싱 | **미지원에 가까움** | `RaceExperience`가 `keydown/keyup`과 `event.code`로 주행 입력을 받음 |
| 모바일 첫 화면 | **축소 표시** | 1600×900 프레임을 통째로 줄이므로 텍스트·버튼이 작아질 수 있음 |

근거:

- 레이싱 입력: `src/experiences.tsx:1780-1833, 1839-1848, 2175-2185`
- Pointer Events: `src/features/wiring/RefPuzzle.tsx:430-459, 781-870`, `src/features/board/DominoTrace.tsx:418-480`, `src/experiences.tsx:1017, 2536-2541`
- 모바일/폭 보정 CSS: `src/p4-fix-1109.css`, `src/p5-ui-fixes.css`, `src/style.css`, `src/v13.css`, `src/v18.css`

## 3. 모바일에서 예상되는 UI 문제

### [확인/추론]

- 고정 16:9 프레임을 세로 화면에 맞추면 상하 레터박스가 크고, 실제 게임 요소가 작아진다.
- `overflow: hidden`인 scale host 때문에 화면을 확대해 텍스트를 읽는 경험이 제한될 수 있다.
- 레이싱은 키보드 의존성이 있어 모바일에서 핵심 추격을 진행하기 어렵다.
- 보드·퍼즐은 Pointer Events와 `touch-action: none`을 쓰지만, 드래그 가능한 영역이 작아지면 손가락으로 정확히 조작하기 어렵다.
- iframe 안의 포커스가 끊기면 키보드 입력이 멈출 수 있다. `ScaledFrame.tsx`가 focus를 되돌리는 보정은 있지만, 모바일에는 키보드가 없다.
- Web Audio는 사용자 제스처 이후에만 안정적으로 시작되는 브라우저가 많아, 자동 BGM을 홍보 페이지에서 전제하지 않는 편이 안전하다.

### [제안] 대응

- 사내 게시판용: 게임을 바로 임베드하지 말고, 이미지/GIF 중심의 짧은 홍보 카드와 외부 플레이 링크를 둔다.
- 외부 랜딩페이지용: 모바일에서는 홍보 페이지 자체를 유동형으로 만들고, 게임은 “PC에서 플레이” 또는 별도 플레이 버튼으로 분리한다.
- 모바일용 CTA 문구: `PC에서 직접 플레이`, `장면 먼저 보기`, `게임 열기` 중 실제 배포 방식에 맞는 하나만 사용한다.
- 모바일용 대표 이미지: 16:9 원본을 단순 축소하지 말고 `menu-garage`, `chase-coast`, `ship-escape`를 세로 crop으로 별도 배치한다.

## 4. 사내 게시판용 HTML과 외부 랜딩페이지의 분리

### [구현] 홍보 페이지 안에서 게임 실행

독립형 랜딩페이지에는 `promotion/landing/script.js`의 `GAME_URL`을 iframe 모달에 연결하는 방식이 구현되어 있다. 기본값은 `../../?embed=1`이며, `game-web` 루트에서 `promotion/landing/`을 제공할 때 현재 게임을 같은 페이지 안에서 실행하는 경로다.

- 같은 origin에서 게임과 홍보 페이지를 함께 호스팅하면 가장 단순하다.
- 별도 도메인에 게임을 호스팅하면 `GAME_URL`을 실제 HTTPS 주소로 교체하고 `X-Frame-Options`/CSP의 iframe 허용 정책을 확인해야 한다.
- 기존 게임은 `/assets/` 루트 경로를 사용하므로 서브경로 배포 시 Vite `base`와 실제 호스팅 루트를 함께 검증해야 한다.
- 게시판 버전은 보안 정책을 고려해 iframe과 JS를 사용하지 않으며, 플레이 링크만 제공한다.
- 현재 Vite 빌드는 `promotion/`을 자동으로 `dist/`에 포함하지 않으므로, 배포 패키지에서 홍보 폴더를 별도로 복사하거나 정적 호스팅 루트를 하나로 구성해야 한다.

### A. 사내 게시판에 붙여 넣는 HTML

#### [제안] 권장 범위

- 인라인 CSS 중심
- 외부 JS·웹폰트·외부 이미지 의존 최소화
- `<script>`, `<iframe>`, `<video autoplay>`, CSS `@import`는 게시판 정책상 차단될 수 있으므로 기본안에서 제외
- 실제 에셋은 게시판이 허용하는 이미지 업로드/첨부 URL을 사용
- 장면 3~5개, 짧은 문장, 외부 플레이 링크 1개
- GIF는 용량이 작고 정적 poster가 있는 경우에만 사용

#### [위험]

게시판마다 허용 태그와 sanitize 규칙이 다르다. 인라인 CSS만으로도 `style` 속성 자체가 제거될 수 있으므로, 붙여 넣기 전 해당 게시판의 안전한 샘플 HTML로 확인해야 한다. 이번 조사에서는 실제 게시판에 붙여 넣지 않았다.

### B. 외부 호스팅 랜딩페이지

#### [제안] 허용 범위

- Vite/React 또는 순수 HTML/CSS/JS
- 스크롤 기반 장면 전환, `IntersectionObserver`, sticky 캡션, scroll-snap
- 이미지 lazy loading, `prefers-reduced-motion`, 모바일 전용 crop
- GIF 대신 MP4/WebM poster/video를 사용할 수 있음
- 게임 실행은 새 탭/새 페이지 또는 명시적 iframe 영역 중 하나

#### [위험] iframe

- 게임 자체는 top-level에서 iframe을 사용하고, 내부 앱은 `?embed=1`로 로드되는 구조다(`src/entry.tsx`, `src/ui/ScaledFrame.tsx`). 따라서 외부 랜딩페이지에서 게임을 다시 iframe으로 감쌀 때 중첩 iframe이 된다.
- 현재 코드에는 `X-Frame-Options`, `Content-Security-Policy`, `postMessage` 계약을 확인할 수 있는 서버 설정이 없다. 실제 호스팅 서버/프록시 정책을 확인해야 한다.
- 상대 경로가 아닌 `/assets/...` 절대 루트 경로를 많이 사용하므로, 게임을 서브경로(`/contest/traceback/`)에 배포하면 asset 경로가 깨질 수 있다. Vite `base` 설정이 현재 보이지 않으므로 서브경로 배포는 별도 수정·검증이 필요하다.
- 게시판 iframe 삽입은 게시판의 `iframe` 허용 여부, 외부 도메인 허용 목록, `sandbox`, `allow` 속성, autoplay 정책에 좌우된다.
- 게임은 `localStorage`의 `traceback-v16-save`와 여러 `sessionStorage` 키를 사용한다(`src/main.tsx:94-141`, `src/game/runtime.ts`). iframe의 origin이 달라지면 저장이 분리되고, private browsing/브라우저 정책에 따라 저장이 제한될 수 있다.

## 5. 공개 범위와 빌드 결과물

### [확인]

- 원본 코드와 설계 문서는 `src/`, `docs/`, `tests/`, `scripts/`에 있다.
- 빌드 산출물은 `dist/`에 있고 `dist/assets/` 아래 대부분의 공개 이미지가 복사된다.
- `package.json`의 production build는 서버 코드가 아니라 클라이언트 번들을 만든다.

### [제안] 공개 범위

| 공개 대상 | 권장 여부 | 이유 |
|---|---|---|
| 홍보용 이미지/GIF/짧은 설명 | 공개 | 게시판과 랜딩페이지의 기본 소재 |
| `dist/` 정적 결과물 | 플레이 링크 제공 시 공개 | 원본 구조보다 배포에 적합 |
| `src/` 전체 | 선택 | 공모전에서 AI·개발 과정을 보여줄 때만 공개 |
| `docs/` 전체 | 비공개 또는 선별 | 내부 작업 이력·미완료 항목·환경 정보 포함 |
| `tests/` | 선별 공개 | 검증 문화를 보여주는 일부만 선택 |
| `.env`, 계정·서비스 설정 | 절대 공개하지 않음 | 현재 파일 존재 여부와 무관하게 기본 원칙 |

### [주의]

`public/assets/intake`에는 부품 이미지가 대량 포함되어 있고, `CLAUDE.md`와 이미지 프롬프트 문서에 외부 생성 도구/라이선스 검토 내용이 있다. 공개 전 에셋별 라이선스·출처·사내 공개 가능 범위를 별도 확인해야 한다.

## 6. 배포 전 체크리스트

### [제안]

1. 정적 호스팅 루트(`/`)와 서브경로(`/contest/.../`)에서 asset 경로 확인
2. PC Chrome에서 키보드 주행과 저장/이어하기 확인
3. 모바일 Safari/Chrome에서 첫 화면, 버튼, GIF, 외부 플레이 링크 확인
4. iframe 중첩 시 `X-Frame-Options`/CSP/게시판 sanitize 확인
5. 이미지 로딩 실패 시 alt text와 poster 확인
6. `prefers-reduced-motion`에서 자동 재생/스크롤 애니메이션 완화
7. 외부 공개 전에 `dist/`만 배포할지, 원본 저장소도 공개할지 결정
8. 실행 게임을 홍보 페이지 안에 넣는 경우, 모바일에서 “플레이 불가”를 숨기지 말고 PC 안내를 명시

