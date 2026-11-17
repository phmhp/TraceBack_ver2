# TraceBack 홍보 페이지 구현 보고서

## 구현 범위

- 기존 `src/`, `public/assets/`, 테스트, 설정, 빌드 결과물은 수정하지 않았다.
- 신규 폴더 `promotion/` 안에 독립형 랜딩페이지와 게시판용 HTML을 작성했다.
- 홍보 전용으로 사용할 기존 에셋만 `promotion/assets/`에 복사했다.
- 첨부된 시연영상 `고장추리레이싱게임_박혜민_시연영상_1080p.mp4`를 홍보용 동영상으로 복사해 controls 기반으로 추가했다. 자동재생하지 않는다.
- 랜딩페이지에는 공개 정적 호스팅된 게임을 본문 안에 직접 보여주는 실행 영역과, CTA를 눌렀을 때 크게 여는 게임 실행 모달을 함께 추가했다.
- `landing/script.js`의 `GAME_URL`은 현재 공개 게임 URL로 연결되어 있다. 별도 호스트로 이전할 때만 실제 게임 주소로 교체한다.

콘텐츠 사실의 기준은 첨부 설명자료의 개발 배경·목적·활용 방안·플레이 학습 흐름이며, 시연영상은 별도 광고형 미디어로 사용했다.

## 생성 파일

```text
promotion/
├── landing/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── board/
│   └── board.html
├── assets/
│   ├── *.png
│   ├── traceback-demo-1080p.mp4
│   └── board-photos/*.png
├── PROMOTION_DESIGN_SPEC.md
└── PROMOTION_IMPLEMENTATION_REPORT.md
```

## 실제 사용한 대표 에셋

- `menu-garage.png`: 첫 화면의 붉은 EV·고양이 듀오·차고
- `chase-coast.png`: 해안 추격 장면
- `cutscene-character-master-v1.png`: 볼트·너트·폭스 세계관 소개
- `ASSET_100_Empty_Cork_Evidence_Board.png` + `board-photos/*.png`: 도미노 역추적 시각화
- `lab-comparison-board-v1.png`: 정상/고장 비교 실험
- `verification-spec-sheet.png`: 시험 설계서 보조 이미지
- `system-atlas-v7.png`: AI 제작 과정 배경
- `ship-escape.png`, `cutscene-ship-jump-v1.png`, `cutscene-ship-land-v1.png`: 마지막 탈출과 CTA
- `traceback-demo-1080p.mp4`: 실제 시연 흐름을 보여주는 광고형 데모 영상

## 구현된 시각 효과

- 스크롤 진행률 바
- `IntersectionObserver` 기반 짧은 등장 효과
- 이미지의 미세한 패럴랙스
- 증거 카드의 중첩·hover 이동
- 추격 HUD와 검증 단계의 시각적 리듬
- 모바일용 별도 crop/열 방향/버튼 배치
- `prefers-reduced-motion` 대응
- 플레이 URL 미설정 시 안내 토스트
- same-origin 게임 실행 모달 및 iframe fallback 구조

시연영상은 추가했지만, 추격·도미노·퍼즐·검증·엔딩을 각각 짧게 보여주는 GIF/무음 MP4 클립은 아직 별도 제작하지 않았다.

이번 보완에서는 실제 QA 캡처를 홍보용 복사본으로 추가했다.

- `assets/stage-01-garage.png`: 실제 정비소·차량 시스템 화면
- `assets/stage-02-racing.png`: 실제 해안도로 레이싱 화면
- `assets/stage-02-domino.png`: 실제 도미노 역추적 화면
- `assets/stage-03-puzzle.png`: 실제 정상 로직 조립 퍼즐 화면
- `assets/stage-04-experiment.png`: 실제 시험 조건 선택 화면
- `assets/stage-05-verification-result.png`: 실제 정상·고장 결과 비교 화면

따라서 랜딩페이지의 학습 흐름은 장식용 빈 보드가 아니라 실제 게임 화면으로 확인할 수 있다.

## 게시판용 버전

`board/board.html`은 외부 JS, iframe, 외부 웹폰트, autoplay를 사용하지 않는다. CSS는 파일 내부에 포함했고, 이미지·시연영상 경로는 `promotion/assets/`를 기준으로 한다. 게시판에서 iframe이 허용되는 경우 `board/iframe-embed.html`로 공개 랜딩페이지를 삽입할 수 있으며, 차단되는 경우 이미지 중심 본문과 게임 링크를 사용한다.

게시판에 붙이기 전 다음을 확인해야 한다.

1. 게시판이 `<style>` 태그와 `background-image`를 허용하는지 확인
2. 허용되지 않으면 안전한 이미지 호스팅 URL로 `../assets/` 경로 교체
3. 실제 게임 배포 후 `board.html`의 플레이 링크를 실제 주소로 교체
4. 게시판의 링크·이미지 sanitize 및 외부 도메인 허용 정책 확인

## 배포 메모

현재 Vite 설정은 `promotion/`을 자동으로 `dist/`에 복사하지 않는다. 정적 배포 시에는 랜딩페이지와 `promotion/assets/`를 최종 공개 루트에 함께 복사하거나, 별도 정적 호스트에 올린 뒤 `GAME_URL`을 게임 배포 주소로 설정해야 한다.

## 게임 페이지 내 실행 방식

랜딩페이지의 직접 실행 영역과 CTA 모달은 `promotion/landing/script.js`의 공개 `GAME_URL`을 게임 iframe에 넣는다. 현재 배포 구조에서는 게시판 iframe → 랜딩페이지 → 게임 iframe의 중첩 구조가 된다.

이 방식이 가능한 이유는 기존 `src/entry.tsx`가 `?embed=1`을 인식해 외부 스케일 프레임 대신 게임 앱을 직접 마운트하기 때문이다. 따라서 게임을 홍보 페이지 안에서 실행하려면 다음 조건이 필요하다.

- 랜딩페이지와 게임이 같은 호스트에 있거나, 게임 서버가 외부 iframe을 허용해야 한다.
- 게임의 `/assets/` 루트 경로가 실제 공개 경로와 일치해야 한다.
- 모바일에서는 기존 게임의 키보드 주행 의존성 때문에 PC 플레이 안내를 유지해야 한다.
- 사내 게시판 버전은 iframe·JS를 사용하지 않으므로 링크 방식만 사용한다.

## 검증 상태

- 정적 파일·경로·구조 확인: 수행
- 랜딩페이지 브라우저 검수: 구현 후 홍보 페이지에 한정해 수행
- 기존 게임 브라우저 검수: 수행하지 않음
- 기존 게임 대규모 빌드: 수행하지 않음
- 실제 게시판 삽입 검수: 게시판 정책 미확인으로 미수행
- `game-web` 루트 Vite 서버에서 `/promotion/landing/`, `/?embed=1`, 시연영상 파일이 모두 HTTP 200으로 응답하는 것을 확인했다.
- 게시판 내부의 실제 미리보기는 게시판 권한과 편집기 정책에 좌우되므로 별도 확인이 필요하다. 공개 URL의 랜딩·게임·영상·핵심 이미지는 HTTP 응답을 확인했다.

## 공개 배포 상태 (2026-11-17 / live game embed revision)

- 공개 URL: https://traceback-game-promo.exactsunbird8.chatgpt.site/
- 랜딩페이지는 공개 `/?embed=1` 게임 화면을 본문 iframe으로 표시하고, 직접 플레이 CTA에서도 같은 URL을 모달 iframe으로 연다.
- 랜딩페이지와 게시판용 HTML의 새 탭 플레이 링크를 공개 게임 URL로 연결했다.
- 공개 호스팅 업로드 한도 때문에 전체 `assets/intake`가 아니라 도미노·정비소 핵심 참조에 필요한 HMI·ECU·garage-additions·주요 센서 이미지를 포함한 경량 배포본을 사용했다. 3D 게임 로직과 게임 번들은 유지된다.
- 공개 URL, `/?embed=1`, 랜딩/게시판 HTML, JavaScript, MP4, 핵심 참조 이미지의 HTTP 200 응답과 iframe 차단 헤더 부재를 확인했다. 실제 브라우저 클릭·플레이 시각 검수는 브라우저 자동화 연결 불가로 미완료다.
- 랜딩 본문에 `PLAY THE BUILD` 영역을 추가해 공개 게임을 직접 iframe으로 표시했다. 게시판에서 랜딩을 iframe으로 삽입하면 게시판 iframe → 랜딩페이지 → 게임 iframe의 구조로 실제 플레이 화면이 노출된다.
- 팝업 게임 영역은 16:9 고정 비율로 조정했고, 단계별 화면은 좌우 교차 레이아웃으로 배치했다. 중복되던 별도 도미노·실험대 설명 블록은 제거하고 전체 학습 흐름 카드에 통합했다.
