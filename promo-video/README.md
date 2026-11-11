# TraceBack 전시 홍보·시연 영상 제작 프로젝트

최종 영상: `output/TraceBack_Promo_55s_1080p.mp4`

GitHub 파일 크기 제한(100 MB) 때문에 저장소에는 영상이 45 MB 조각(`output/*.part-aa~ac`)으로 들어 있습니다. 받은 뒤 한 번 합치면 됩니다.

- Windows: `output/join-windows.bat` 더블클릭 (끝에 SHA256 값 표시)
- macOS: `sh output/join-mac.sh` (`.sha256` 파일로 자동 검증)
- 원본 SHA256: `fd5fcecc241423999a6045f5cf872adc09c981c8e4802866e6af7bd06287c8c5`

| 항목 | 값 |
|---|---|
| 해상도·비율 | 1920×1080, 16:9, 가로 |
| 영상 | H.264 High 프로파일 레벨 4.0, 고정 30 fps(1650프레임), 약 16 Mbps, SDR BT.709 태그(colr nclx) |
| 오디오 | AAC-LC 48 kHz 스테레오 192 kbps, 피크 −0.6 dBFS |
| 길이 | 55.0 s (오디오 55.08 s) |
| 게임 화면 | 1440×900 원본(16:10)을 1.5배(2160×1350)로 녹화, 16:10 비율 그대로 배치·확대 |

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `recorder/` | 실제 게임 녹화 스크립트(Chrome DevTools Protocol). 실제 마우스·키보드 입력으로 플레이하고 프레임과 입력 이벤트를 기록 |
| `captures/<clip>/` | 녹화 원본(JPEG 프레임 + `clip.json`: 프레임 시각, 커서·클릭·드래그 이벤트, 구간 표시). 약 5.1 GB, 다시 렌더링할 때 필요 |
| `compositor/` | 편집 프로젝트: `timeline.js`(편집표·자막 문구), `render.js`(합성·모션그래픽), `audio.js`(음악·효과음 합성), `index.html`(H.264/AAC 인코딩·MP4 생성), `server.mjs` |
| `compositor/fonts`, `compositor/lib` | 사용 폰트, MP4 muxer |
| `docs/STORYBOARD.md` | 최종 스토리보드와 장면별 사용 게임 화면 목록 |
| `previews/` | 검수용 정지 화면 |

## 다시 렌더링하기

게임 개발 서버(`127.0.0.1:5180`)는 녹화할 때만 필요합니다. 편집만 바꿀 때는 아래 두 단계면 됩니다.

```bash
node compositor/server.mjs
```

```bash
S=/tmp/tb node --experimental-websocket recorder/drive-compositor.mjs render && node recorder/tag-bt709.mjs output/TraceBack_Promo_55s_1080p.mp4 output/tmp.mp4 && mv output/tmp.mp4 output/TraceBack_Promo_55s_1080p.mp4
```

- 미리보기 정지 화면: `drive-compositor.mjs snap 12.0,34.9 p` → `previews/`
- 파일 검사: `node recorder/inspect-mp4.mjs output/TraceBack_Promo_55s_1080p.mp4`
- 재생 검사(끝까지 1배속 재생, 끊김·오류·음량): `recorder/verify-playback.mjs`
- 편집 수정 위치: 샷 순서·구간·확대 영역은 `compositor/timeline.js`의 `SHOTS`, 자막은 `STEPS`·`CAPTIONS`·`AI_FLOW`

다시 녹화하기(게임 서버 실행 중): `rec-race.mjs captures/race`, `rec-garage.mjs captures/garage`, `rec-investigation.mjs`(STEP02→03), `rec-bench.mjs`(STEP04→수리→주행 복귀), `rec-ending.mjs`. 모두 `node --experimental-websocket`로 실행하며 `S` 환경 변수에 임시 폴더를 지정합니다. 녹화는 별도 Chrome 프로필로 실행되어 평소 브라우저의 저장 데이터와 섞이지 않습니다.

## 사용 폰트·에셋

| 이름 | 용도 | 출처·라이선스 |
|---|---|---|
| Pretendard 1.3.9 (Regular~Black) | 자막·본문 | orioncactus/pretendard, SIL Open Font License 1.1 |
| Jalnan2 (게임 내 `TraceRounded`) | `TraceBack` 타이틀·STEP 번호 | 게임 저장소 `public/assets/Jalnan2.otf` (게임과 동일 폰트) |
| mp4-muxer 5.1.3 | MP4 컨테이너 작성 | Vanilagy/mp4-muxer, MIT |
| 게임 화면 | 모든 장면의 실제 플레이 | TraceBack 저장소 최신 UI(브랜치 `refactor/ev-logic-lab-mvp` 작업본) |
| 음악·효과음 | 배경음악·UI 효과음 | 이 프로젝트에서 Web Audio로 직접 합성(외부 음원 없음) |

외부 이미지·영상·음원은 사용하지 않았습니다.

## 제작 방식과 사실 관계

- 게임 소스와 판정 로직은 바꾸지 않았습니다. 모든 게임 화면은 실제 입력으로 플레이한 녹화입니다.
- STEP02 판단은 화면에 보이는 정보(카드의 달라진 시점, 측정값)만으로 결정하도록 녹화 스크립트를 작성했습니다(오답 0).
- 커서는 녹화된 실제 마우스 위치·클릭 시각으로 다시 그렸습니다(헤드리스 녹화에는 OS 커서가 찍히지 않음). 주행 장면은 키보드 조작이라 커서를 표시하지 않습니다.
- 영상 편집용 그래픽(자막, 강조 테두리, 말풍선형 설명, 경고 파형, A/B 라벨)은 게임 UI와 구분되는 어두운 칩 스타일로 그렸고, 게임 화면 위에 `LIVE GAMEPLAY · 실제 게임 플레이 화면` 표시를 둡니다.
- 녹화 편의상 쓴 진입 방법(투명하게 기록):
  - 주행 장면은 QA 진입(`?qa=CHASE_NORMAL&distance=95`)으로 고장 구간 직전에서 시작했습니다.
  - STEP02~04는 한 브라우저 세션에서 이어서 플레이했고, STEP04는 STEP03 직후 저장 상태를 그대로 불러와 이어 했습니다. 이때 QA 진입 때문에 0 m로 되어 있던 주행 위치를 주행 장면의 고장 지점(165 m)으로 맞춰 주행 복귀 장면이 이어지게 했습니다.
  - 엔딩의 WANTED 화면은 두 번째 사건·탈출을 플레이하지 않고 개발용 진입(`?qa=ENDING`)에 이번 녹화 세션의 기록을 넣어 열었습니다. 영상에는 왼쪽 WANTED 포스터만 보입니다.
