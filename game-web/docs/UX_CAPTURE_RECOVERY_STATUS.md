# UX_CAPTURE_RECOVERY_STATUS — 252장 UX 캡처 자료 보존 현황과 재생성 방법 제안

- 작성일 2026-11-13 · 기준 `contest/v2` @ `d4e9f996` · **조사·제안 문서**. 이번 작업에서 캡처를 복구·재생성·압축·이동·삭제하지 않았다.
- 출처 표기: **[확인]** 이번 작업에서 직접 확인 · **[기존]** 기존 문서 기록 · **[가설]** 추가 검증 필요 · **[결정]** 사용자·ChatGPT 결정 필요

---
## 1. 현황 요약

| 자료 | 상태 | 근거 |
|---|---|---|
| `docs/ux-captures/CAPTURE_INDEX.md` | **존재** (76,858 B) | [확인] 저장소 추적 파일, `contest/v2` 커밋 `d4e9f996` |
| `docs/ux-captures/` 캡처 PNG 252장 | **존재·git 추적 중** (102.5 MB) | [확인] `git ls-files` 252건, 폴더별 00-start 10 · 01-racing 27 · 02-step01 23 · 03-step02 54 · 04-step03 40 · 05-step04 79 · 06-ending 16 · 07-common 3 = 252 |
| `TraceBack_ux-captures.zip` | **이 세션 초반에는 `Downloads`에 존재했으나 현재 그 경로에 없음.** 대신 **압축을 푼 사본이 clone 안 `game-web/TraceBack_ux-captures/ux-captures/`에 생겼다**(생성 14:01, untracked, 253파일, 102.5 MB) — 내가 만든 것이 아님 | 아래 §2 |
| 압축 해제 사본 ↔ 저장소 사본 | PNG 252장 **SHA-256 전부 동일**, `CAPTURE_INDEX.md`는 줄바꿈 차이만(내용 diff 0줄) | [확인] 해시 대조 |
| `docs/responsive-captures/` | **부분 존재**: PNG 41장(`00-start` 4 · `02-step01` 11 · `03-step02` 23 · `04-step03` 3), 14.3 MB, 로그·`_metrics.jsonl`, `_progress.txt`(내용 "started") | [확인] |
| `docs/VIEWPORT_FEASIBILITY.md` | **저장소에 없음** (체크리스트가 인용) | [확인] `git ls-files`·Glob 모두 0건 |
| `docs/responsive-captures/RESPONSIVE_CAPTURE_INDEX.md` | **없음** | [확인] |
| 기존 `main` 작업 폴더(`TraceBack_ver2`) | 해당 파일 **없음**(그 폴더엔 `game-web` 자체가 없음) | [확인] |

## 2. ZIP에 관한 사실 (임의로 복구했다고 보고하지 않음)

- 이번 작업 **앞부분**에서 `C:\Users\user\Downloads\TraceBack_ux-captures.zip`(106,650,269 B, 수정 2026-11-13 13:51)이 존재했고, 읽기 전용으로 항목만 열어 보았다: 항목 262개 = PNG 252 + `ux-captures/CAPTURE_INDEX.md` 1 + 폴더 항목. 폴더별 PNG 수가 저장소의 `docs/ux-captures/`와 **동일**했다(54/27/23/16/79/10/3/40). 파일명 전수 대조는 하지 못했다 [확인].
- **이후 같은 경로에서 ZIP 파일이 사라졌고** `C:\Users\user` 아래 깊이 4까지 재검색해도 `TraceBack_ux-captures.zip`은 없다 [확인]. 나는 ZIP을 이동·삭제·수정·압축 해제하지 않았다(읽기만 함). 사라진 원인은 모른다.
- 그 뒤 clone의 `game-web/TraceBack_ux-captures/ux-captures/`(14:01 생성)에 **같은 내용의 압축 해제본**이 나타났다 [확인]. 내가 만든 것이 아니므로 사용자가 ZIP을 풀어 넣은 것으로 추정된다 [가설]. 이 폴더의 PNG 252장은 저장소 `docs/ux-captures/`와 **SHA-256이 모두 일치**한다 [확인]. 따라서 ZIP의 **내용**은 저장소 사본과 같다. ZIP 파일 자체(압축 바이트)는 현재 확인할 수 없다.
- **위험**: 이 해제 폴더는 `git status`에 `?? game-web/TraceBack_ux-captures/`로 나타나는 untracked 102.5 MB 중복본이다. `git add -A`로 커밋하면 중복 102.5 MB가 이력에 들어간다. 이동·삭제는 하지 않았다 [결정: 저장소 밖으로 옮길지, `.gitignore`에 둘지].
- 따라서 **복구할 자료는 없다**(내용은 저장소에 보존). 필요한 것은 "어디에 두느냐"의 결정이다.
- `CAPTURE_INDEX.md`의 기준 커밋 표기는 `dce7e505`이고 저장소 HEAD(`d4e9f996`)는 그 뒤에 캡처를 추가한 커밋이다 [확인]. 캡처 후 화면 코드 변경 여부는 확인하지 않았다 [가설: `dce7e505..d4e9f996` 사이에는 캡처·문서 외 변경이 없을 가능성 — `git diff --stat`로 확인 필요].

## 3. 추가로 알게 된 위험

| 항목 | 내용 |
|---|---|
| 저장소 용량 | PNG 252장 102.5 MB + 반응형 14.3 MB가 git에 직접 추적됨. 로컬 `.git` pack이 5.01 GiB(이전 이력 포함). 이 캡처를 커밋 이력에 영구 포함하는 것이 적절한지 [결정] |
| 캡처 재현 스크립트 부재 | 252장은 `CAPTURE_INDEX.md` 기재상 "Chrome DevTools로 구동, 키보드·마우스·DOM 클릭" 수작업 흐름으로 촬영 — 이를 재현하는 스크립트는 저장소에 없음. 기존 `scripts/capture-ui.mjs`(314행, CDP)는 **고정 40화면**(타이틀·프롤로그·정비소 21·주행·검증 탭 등)을 `?qa=` URL로 촬영하는 용도 [확인] |
| 포트·설정 불일치 | `capture-ui.mjs` 기본 URL `127.0.0.1:5173`, `.claude/launch.json`은 `game-web`(5180)만 정의, 감사 문서가 쓰던 `game-web-stable`(5181)·캡처 포트 5182는 현재 launch.json에 없음 [확인] |
| 의존성 | `node_modules`가 clone에 없음(`.gitignore`로 미추적). 실행하려면 `npm install`(네트워크) 필요 [확인] |
| QA 진입 | `?qa=` 장면 진입은 DEV 빌드 전용(`main.tsx:88~99`, `import.meta.env.DEV`) [코드]. 운영 빌드에서는 동작하지 않음 |
| 이미지 도구 | 이 PC에서 `python`은 있으나 **Pillow 없음**, Node `sharp` 없음 [확인]. Chrome(`C:\Program Files\Google\Chrome\Application\chrome.exe`) 있음 [확인] |

---
## 4. 제안 A — 기존 252장에서 STEP별 저용량 Contact Sheet 만들기 (재촬영 없음)

**목적**: ChatGPT에 STEP별로 올릴 수 있는 작은 이미지(전체 ZIP 불필요). 기존 PNG를 **그대로 축소 배열**하므로 "새 캡처"가 아니다. 합성 이미지임을 시트 머리에 표기해야 한다.

### A-1. Chrome만 사용 (추가 설치 없음) — 권장
1. 임시 HTML(저장소 밖, 예: 스크래치/작업 폴더)을 **스크립트로 생성**: STEP 폴더 1개당 1페이지, `<figure><img src="file:///…/docs/ux-captures/03-step02/xxx.png" width=320><figcaption>파일명 축약</figcaption></figure>`를 6열 격자로.
2. `chrome --headless=new --window-size=1980,<높이>` + CDP `Page.captureScreenshot { format:"jpeg", quality:55 }`로 저장(기존 `capture-ui.mjs`의 `CdpClient`·`startChrome` 패턴 재사용 가능 [확인]). PNG `--screenshot` 옵션은 용량이 커서 JPEG 권장.
3. 규칙: 폴더당 **한 시트 = 최대 30장**(6×5), 넘으면 `-a`/`-b`로 분할. 셀 폭 320 px(원본 1440→약 22%), 파일명 캡션은 `step03-thermal-05-…` 수준.

**예상 용량 [가설, 실측 전]**: 시트 1장(30셀, 1980×~1300) JPEG q55 약 0.4~0.9 MB → 8개 폴더 합계 **약 6~10 MB**(원본 102.5 MB의 10% 미만).

| 시트 | 원본 | 장수 → 시트 수 |
|---|---|---|
| 00-start | 10 | 1 |
| 01-racing | 27 | 1 |
| 02-step01 | 23 | 1 |
| 03-step02 | 54 | 2 (구동/열관리/제동 파일명 접두로 분할) |
| 04-step03 | 40 | 2 |
| 05-step04 | 79 | 3 |
| 06-ending | 16 | 1 |
| 07-common | 3 | 합쳐서 1 |

### A-2. Pillow 사용 (설치 필요)
- `py -3 -m pip install pillow`(네트워크, **사용자 승인 필요** [결정]) 후 `Image.thumbnail((320,200))` + `ImageDraw` 캡션 + `save(quality=60, optimize=True)`. 구현이 가장 간단하나 설치가 필요하다.

### A-3. 보조: 핵심 화면만 선택하는 "핵심 12장" 세트
`CAPTURE_INDEX.md` §2 "ChatGPT에서 우선 재설계할 화면"(8항목)에 열거된 파일만 원본 크기로(PNG→JPEG q80, 장당 약 150~250 KB [가설]) 묶으면 **약 3 MB**. STEP04 결과·A/B·재시험, STEP02 하단 dock, STEP03 하단 줄, STEP01 3관점이 포함.

## 5. 제안 B — 현재 게임 기준 재촬영 (필요한 경우에만)

재촬영이 필요한 경우: (1) `dce7e505..d4e9f996` 사이 또는 이후 화면 코드가 바뀐 경우 (2) STEP02 제동 전체·STEP04 열관리/제동 오답 피드백처럼 **기존 캡처가 비어 있는 화면**(CAPTURE_INDEX §1 목록) (3) 새 UI 구현 후 회귀 비교.

| 단계 | 방법 | 비고 |
|---|---|---|
| 1. 환경 | `npm install` → `npx vite --host 127.0.0.1 --port 5180 --strictPort` (`.claude/launch.json`의 `game-web`) | 네트워크·승인 필요 [결정]. 포트는 launch.json 기준으로 통일 |
| 2. 뷰포트 | 고정 1440×900, DPR 1, 배율 100 %, 크롭 없음(기존 규칙 유지). 보조 1428×800 | `capture-ui.mjs`의 `TRACEBACK_CAPTURE_WIDTH/HEIGHT` 환경변수 [확인] |
| 3. 고정 화면 40장 | 기존 `scripts/capture-ui.mjs`(CDP) 그대로 사용: `?qa=GARAGE_L1&domain=…&view=…`, `?qa=BOARD`, `?qa=WIRING`, `?qa=TWIN_BENCH&tab=…` 등 | 옵션 환경변수 다수(`TRACEBACK_CAPTURE_SKIP_INTROS`, `…_BOARD_SOLVED`, `…_PUZZLE_SOLVED`, `…_BENCH_CONTRACT`, `…_BENCH_DRIVE` 등) [확인] |
| 4. 상태 의존 화면 | STEP04: `sessionStorage`에 `tb-verification-contract-<case>`·`tb-step04-progress-<case>` 시드 후 진입(`UX_AUDIT` §8 기재). STEP02 진행: `tb-step02-progress-<case>`. 사건은 `&case=propulsion|thermal|brake` | STEP02~04의 단계별 하위 상태(가설 분류·오답 피드백·A/B·재시험)는 **클릭 흐름 스크립트**가 필요 — 현재 저장소에 없음 [확인] |
| 5. 대기·결정성 | 장면별 대기(`wait` 값: 1.2~3.9 s)와 3D 안정화 대기, 애니메이션 중간 프레임 방지 | 기존 값 재사용 |
| 6. 산출 | 원본 PNG는 **저장소 밖**(작업 폴더)에 저장 → 제안 A 방식으로 시트 생성 → 시트만 커밋 | 원본 PNG 커밋 여부는 [결정] |
| 7. 대조 | 파일별 SHA-1(또는 픽셀 diff)로 기존 252장과 비교해 **바뀐 화면만 재교체** | 변경 감지로 재촬영 범위 축소 |

**주의(기술 제약)**: 재촬영 시 시험 계약·진행 저장 키를 시드하는 방식은 실제 플레이 경로와 다를 수 있다. 캡처 문서에는 "QA 진입 상태"임을 기록해야 한다(기존 CAPTURE_INDEX의 "진입 조건" 열 방식 유지).

## 6. 결정이 필요한 사항

| # | 질문 | 영향 |
|---|---|---|
| U1 | `game-web/TraceBack_ux-captures/`(압축 해제 중복본, untracked 102.5 MB)를 어디에 둘지(저장소 밖 이동 / 삭제 / `.gitignore`) | 실수 커밋 방지. 내용은 `docs/ux-captures/`와 동일 |
| U2 | 252장 PNG(102.5 MB)를 계속 git에 추적할지(LFS·릴리스 첨부·로컬 보관) | 저장소 용량·clone 시간 |
| U3 | Contact Sheet를 어느 도구로 만들지(Chrome / Pillow 설치) | 설치 승인 |
| U4 | 시트에 기존 캡처 기준 커밋(`dce7e505`)을 표기하고 사용할지, 최신 HEAD로 재촬영할지 | 시점 일관성 |
| U5 | 누락 문서 `VIEWPORT_FEASIBILITY.md`·`RESPONSIVE_CAPTURE_INDEX.md`를 (이전 작업물이라면) 어디서 가져올지 — 재작성 금지 | 체크리스트 근거 문서 |

## 7. 이번 작업에서 하지 않은 것
- 캡처 복구·재생성·압축, ZIP 생성, 이미지 합성, 패키지 설치, 개발 서버 실행, 브라우저 구동 — **전부 하지 않음**.
- 확인한 파일은 읽기 전용으로만 열었다(ZIP은 항목 목록만 조회).
