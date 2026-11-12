# TraceBack UX 캡처 인덱스 (공모전 개선판 재설계용 자료)

- 기준 커밋 `dce7e505` (브랜치 `contest/v2`, 포트 5182)  ·  UI/로직은 수정하지 않고 현재 상태만 캡처
- 총 252장: 1440×900 226장 + 1428×800 26장(`@1428x800` 접미사). 브라우저 배율 100%(devicePixelRatio 1), 크롭 없음, 전체 화면 PNG
- 캡처 방법: 실제 게임을 Chrome DevTools로 구동. 키보드·마우스 입력과 화면 DOM 클릭으로 진행했고, 코드·정답 데이터·저장 구조는 건드리지 않음. 모든 파일은 `실제 캡처 = O`(합성·추측 이미지 없음)
- 진입 경로: 일반 플레이 경로(새 게임 → 프롤로그 → STEP01 → …) 또는 기존 개발용 `?qa=` 주소. 제동 사건은 정상 플레이에서 진입 불가라 `?qa=…&case=brake` 개발용 진입으로만 캡처하고 파일명·진입 조건에 표시함
- 문서 스크롤: 캡처 시점마다 `scrollWidth/Height − viewport`를 측정했고 전부 0(두 해상도)이었음
- 사건 표기: 구동(propulsion) / 열관리(thermal) / 제동(brake, 개발용). 구동·열관리는 콘텐츠가 달라 각각 캡처함

## 0. 향후 요구사항 대비 현재 상태 기록 (구현하지 않음)

| 항목 | 현재 상태(캡처로 확인) |
|---|---|
| 4.1 `MISSION`/`Q.` 태그 | 없음. 질문은 STEP02 하단 dock(12.5px), STEP03 하단 고양이 줄(14px), STEP04 하단 dock(13px)에 있고 고양이 줄·폴더 줄 설명과 같은 위계로 표시됨. 미션·질문·선택지·피드백이 시각적으로 구분되지 않음 |
| 4.2 이중 이정표 | LEVEL 1에 해당하는 8단계 상단 레일만 있음(정비소·범행·도주·도미노·퍼즐·검증·수리·해적선). STEP04에만 내부 5단계 로드맵(9.5px)이 있고 STEP01~03에는 내부 이정표가 없음 |
| 4.3 STEP01 | 도메인 탭 → 3관점(Vehicle/System, E/E, Control SW) → 조건 3개 선택·입력 꾹 누르기·'다음 스텝'. 완료 판정과 완료 피드백 없음. 기능을 바꾸면 조건이 초기화됨 |
| 4.4 STEP04 | A/B 비교와 재시험이 모두 있고 문구·버튼·결과 표 구조가 거의 같음(`ab-comparison-*`와 `retest-*` 캡처 비교). 중앙 주행 화면 하단의 하늘색 띠는 이 커밋의 모든 캡처 상태(구동·열관리·제동, 4개 탭, A/B, 재시험)에서 **재현되지 않음**(픽셀 검사: 하늘색 띠 없음). 원인 위치는 `v6.css:26`의 `.labRaceWorld{inset:0 0 47px}`이며 `p4-fix-1109.css:3038`이 이미 덮어씀 |
| 4.5 공통 UX | 고양이 말풍선은 하단 한 줄 형식(다시 듣기 없음). 오답 2회 이후 해설 시연 없음. 헤더·폴더 줄·이전/다음 단계 버튼은 STEP01~04에서 위치가 같고, 진행 버튼(다음)은 단계마다 크기·위치가 다름 |

## 1. 캡처하지 못한 화면·부분 캡처

| 화면 | 사유 |
|---|---|
| STEP01 학습 완료 판정·완료 피드백 | 현재 게임에 해당 UI가 없음(`다음 →` 상시 활성). 존재하지 않는 화면이라 캡처 불가 |
| STEP01 전원·조향·변속·주차·현가 도메인의 관점별 화면 | 구동·열관리·제동과 같은 레이아웃이라 전체보기와 세 도메인만 캡처(요청 규칙 5) |
| STEP02 제동 사건 전체 | 개발용 진입에서 출력 선택 후 '고장 당시 로그 재생' 버튼(`.etReplay`)이 나타나지 않아 자동 진행이 멈춤. 증거·출력 선택까지만 캡처(`step02-brake-*`) |
| STEP04 열관리·제동의 오답 피드백(가설 판정·원인·수리) | 구동에서만 캡처. 같은 컴포넌트를 쓰므로 레이아웃은 동일하나 사건별 문구는 미수집 |
| 정상 플레이 경로의 STEP04 시험 계약 없음 오류 | 정상 경로에서는 발생하지 않아 QA 직접 진입에서만 캡처(`07-common/step04-error-*`) |
| 엔딩 WANTED 화면의 실제 세션 기록 | 개발 진입은 세션 기록이 없어 '기록이 남아 있지 않음' 상태. 한 번에 실제 완주 플레이(구동→열관리)로 얻은 기록은 이번에 캡처하지 않음 |
| 도움말(STEP04 '?') 팝업 | 클릭은 수행했으나 팝업 구조를 확인하지 못했음(캡처된 `help-popup` 파일은 클릭 후 상태). 내용 검토 필요 |
| STEP03 `정비소 노트`(오픈북) 화면 | 실패 후에만 열리는 버튼이라 이번 흐름에서 열지 않음(STEP02 오픈북은 캡처) |
| 키보드 접근·소리·BGM 상태 | 캡처 대상 아님 |

## 2. ChatGPT에서 우선 재설계할 화면

1. **STEP04 실험 검증 전체 구조** — 정보 구역 4개(상단 정보 바·좌 계약·우 결과·하단 dock)로 질문(하단 66px)과 결과(우측)가 떨어져 있고, 결과 표 8.8px·고양이 줄 하단 잘림. A/B 비교와 재시험의 반복. (`05-step04/*run1-result*`, `*ab-comparison*`, `*retest*`)
2. **STEP02 도미노 하단 dock** — 질문이 12.5px로 작고 판·dock·증거 패널 사이 시선 이동이 큼. `오답` 도장이 판을 덮음. (`03-step02/*08-trace-start*`, `*12-section-question*`)
3. **STEP03 퍼즐 하단 줄** — 질문·진행 버튼이 맨 아래 한 줄에 있고 상태에 따라 버튼 글자·폭이 변함. (`04-step03/*01-puzzle-before-assembly*`, `*05-check-fail*`)
4. **STEP01 정비소** — 조작과 열람이 시각적으로 구분되지 않고 완료 판정이 없음. 관점 전환·기능 전환 시 상태 초기화. (`02-step01/*`)
5. **공통 이정표·질문/미션 태그·진행 버튼** — 전 단계 헤더 아래 폴더 줄과 상단 레일 구조.
6. **도주 준비·주행 안내** — 조작 안내가 모달·키캡 바·중앙 카드로 중복, R 재시동 안내 부족(`01-racing/*red-light*`, `*race2-high-load*`).
7. **수리 완료·고장 대화 컷** — 반말·옛 라벨, 플레이어 행동 없음.
8. **엔딩 WANTED 보고서** — 기록 칸 글자 크기·내부 ID 노출 가능.

## 3. 캡처 목록

열: 파일(폴더 기준) / 게임 단계·세부 화면 / 진입 조건 / 플레이어에게 표시되는 질문·행동 / 핵심 조작 영역 / UI 문제·특이사항 / 실제 캡처

`UI 문제·특이사항`은 캡처에서 직접 확인한 점과 기존 감사(`UX_AUDIT_2026-11-12.md`) 참조를 함께 적었음.

### 00 · 시작·메뉴·프롤로그  (`00-start/`, 10장)

| 파일 | 단계·화면 | 진입 조건 | 질문·행동 | 핵심 조작 영역 | UI 문제·특이사항 | 캡처 |
|---|---|---|---|---|---|---|
| `prologue-cut-1.png` | 프롤로그 컷 1/5 | 새 게임 시작 후 | Enter로 이야기 넘김, '우승 건너뛰기 »' | 하단 이야기 카드 + 계속(Enter) 버튼 | 6번째 Enter에서 바로 STEP01로 진입(별도 게임 소개·미션 브리핑 화면 없음) | O (1440×900) |
| `prologue-cut-2.png` | 프롤로그 컷 2/5 | 새 게임 시작 후 | Enter로 이야기 넘김, '우승 건너뛰기 »' | 하단 이야기 카드 + 계속(Enter) 버튼 | 6번째 Enter에서 바로 STEP01로 진입(별도 게임 소개·미션 브리핑 화면 없음) | O (1440×900) |
| `prologue-cut-3.png` | 프롤로그 컷 3/5 | 새 게임 시작 후 | Enter로 이야기 넘김, '우승 건너뛰기 »' | 하단 이야기 카드 + 계속(Enter) 버튼 | 6번째 Enter에서 바로 STEP01로 진입(별도 게임 소개·미션 브리핑 화면 없음) | O (1440×900) |
| `prologue-cut-4.png` | 프롤로그 컷 4/5 | 새 게임 시작 후 | Enter로 이야기 넘김, '우승 건너뛰기 »' | 하단 이야기 카드 + 계속(Enter) 버튼 | 6번째 Enter에서 바로 STEP01로 진입(별도 게임 소개·미션 브리핑 화면 없음) | O (1440×900) |
| `prologue-cut-5.png` | 프롤로그 컷 5/5 | 새 게임 시작 후 | Enter로 이야기 넘김, '우승 건너뛰기 »' | 하단 이야기 카드 + 계속(Enter) 버튼 | 6번째 Enter에서 바로 STEP01로 진입(별도 게임 소개·미션 브리핑 화면 없음) | O (1440×900) |
| `title-controls-popup.png` | 시작 화면 · 조작법 | 타이틀에서 '조작법' 선택 | 키 안내를 읽기 | 메뉴 카드 내부 | 별도 창이 아니라 카드 안 텍스트로 전환됨(기어·회생·READY·Enter 안내) | O (1440×900) |
| `title-menu-with-continue-saved-run.png` | 시작 화면 · 이어하기 표시 | 저장된 진행이 있을 때 타이틀 | 이어하기 / 새 게임 시작 / 설정 / 조작법 선택 | 좌상단 메뉴 카드 | 저장 장면 이름이 '주행 단계'로만 표시됨 | O (1440×900) |
| `title-menu.png` | 시작 화면 · 메뉴 | 첫 실행(?new) | 새 게임 시작 / 설정 / 조작법 | 좌상단 메뉴 카드 | 메뉴 카드가 화면 좌상단에 작게 놓이고 배경 일러스트가 대부분을 차지함 | O (1440×900) |
| `title-menu@1428x800.png` | 시작 화면 · 메뉴 | 첫 실행(?new) | 새 게임 시작 / 설정 / 조작법 | 좌상단 메뉴 카드 | 메뉴 카드가 화면 좌상단에 작게 놓이고 배경 일러스트가 대부분을 차지함 | O (1428×800) |
| `title-settings-popup.png` | 시작 화면 · 설정 | 타이틀에서 '설정' 선택 | 설정 확인 | 메뉴 카드 내부 | 설정 항목이 조작법과 같은 카드 영역을 씀 | O (1440×900) |

### 01 · 레이싱·고장·수리·복귀  (`01-racing/`, 27장)

| 파일 | 단계·화면 | 진입 조건 | 질문·행동 | 핵심 조작 영역 | UI 문제·특이사항 | 캡처 |
|---|---|---|---|---|---|---|
| `01-briefing-cutscene-early.png` | 도주 준비 컷신(초반) | STEP01 '다음 →' 이후(DRIVE_BRIEFING) | 컷 감상 | 좌하단 컷 카드 / 우측 도주 미션 카드 | 컷신 8컷 중 앞부분 | O (1440×900) |
| `02-briefing-cutscene-mid.png` | 도주 준비 컷신(중반) | 컷신 진행 중 | 컷 감상 | 동일 | 컷 캡션이 자동 진행 | O (1440×900) |
| `03-briefing-cutscene-end-start-button.png` | 도주 준비 · 도주 시작 버튼 | 컷신 종료 후 | '도주 시작 →' (Enter 또는 클릭) | 우측 도주 미션 카드 하단 버튼 | 도주 미션 카드(목표·경찰·고장)가 컷 위에 겹쳐 있고 카드가 하단 경계에 붙음. 1428×800에서도 동일 구조(감사 2.2: 카드 21px 잘림 보고) | O (1440×900) |
| `03-briefing-cutscene-end-start-button@1428x800.png` | 도주 준비 · 도주 시작 버튼 | 컷신 종료 후 | '도주 시작 →' (Enter 또는 클릭) | 우측 도주 미션 카드 하단 버튼 | 도주 미션 카드(목표·경찰·고장)가 컷 위에 겹쳐 있고 카드가 하단 경계에 붙음. 1428×800에서도 동일 구조(감사 2.2: 카드 21px 잘림 보고) | O (1428×800) |
| `04-race-intro-modal.png` | 주행 안내 모달 | 도주 시작 직후 | 조작 3줄 읽고 '풀기(Enter)' | 중앙 모달 | 주행 조작 안내가 모달·키캡 바·중앙 카드에 중복됨 | O (1440×900) |
| `04-race-intro-modal@1428x800.png` | 주행 안내 모달 | 도주 시작 직후 | 조작 3줄 읽고 '풀기(Enter)' | 중앙 모달 | 주행 조작 안내가 모달·키캡 바·중앙 카드에 중복됨 | O (1428×800) |
| `05-race-before-start-park-gear-prompt.png` | 주행 시작 전 · P단 안내 | 모달 닫은 직후, 속도 0 | '브레이크 밟고 4를 눌러 D로!' | 상단 중앙 안내 카드 + 하단 키캡 바 | 정차 상태에서도 추격차(경찰 접근)가 줄어듦 | O (1440×900) |
| `05-race-before-start-park-gear-prompt@1428x800.png` | 주행 시작 전 · P단 안내 | 모달 닫은 직후, 속도 0 | '브레이크 밟고 4를 눌러 D로!' | 상단 중앙 안내 카드 + 하단 키캡 바 | 정차 상태에서도 추격차(경찰 접근)가 줄어듦 | O (1428×800) |
| `06-race-gear-d-ready.png` | 주행 시작 전 · D단 선택 완료 | 브레이크+4 입력 후 | ↑ 가속 입력 대기 | 좌하단 속도·기어 카드 | READY·기어 표시가 좌하단 카드에만 있음 | O (1440×900) |
| `07-race-driving-normal.png` | 정상 주행(첫 사건) | D단 + 가속, 추월 구간 진입 | 가속 유지·조향 | 전체 3D 화면, 좌하단 속도, 하단 키캡 바 | 추월 구간 안내가 우상단 작은 카드 한 줄 | O (1440×900) |
| `08-race-fault-onset-beacon.png` | 고장 발생 직후(증상·경고) | 추월 구간 풀가속 누적 | 증상 관찰(말풍선 '가속 저하 발생') | 화면 우측 말풍선 + 상단 경고 카드 | 화면 어두운 비네팅 시작, 증상 말풍선이 작음 | O (1440×900) |
| `09-race-fault-after-onset.png` | 고장 발생 후 정지 | 고장 직후 약 1.5초 | 대화 대기 | 하단 대화 카드 | 차가 정지하고 추격차만 줄어듦 | O (1440×900) |
| `10-fault-dialogue-1-propulsion.png` | 고장 대화 1/2(구동) | 고장 직후 | 볼트 대사 → '다음 →' | 하단 대화 카드 | 대화 카드가 3D 화면 위에 올라옴. 말투가 반말(감사 3.1) | O (1440×900) |
| `11-fault-dialogue-2-propulsion.png` | 고장 대화 2/2(구동) | '다음 →' 후 | 너트 대사 → '원인 추적 시작 →' | 하단 대화 카드 | 다음 버튼이 STEP02로 이동 | O (1440×900) |
| `12-repair-cutscene-propulsion.png` | 수리 완료 컷(구동) | STEP04 '수리 적용 · 주행 복귀' 후 | 자동 3초 카운트다운 | 우측 카드(입력→ECU→출력, 복귀 지점) | 플레이어 행동 없음. 라벨 'ENGINEER MING'(옛 이름), 반말 문구(감사 2.7) | O (1440×900) |
| `12-repair-cutscene-propulsion@1428x800.png` | 수리 완료 컷(구동) | STEP04 '수리 적용 · 주행 복귀' 후 | 자동 3초 카운트다운 | 우측 카드(입력→ECU→출력, 복귀 지점) | 플레이어 행동 없음. 라벨 'ENGINEER MING'(옛 이름), 반말 문구(감사 2.7) | O (1428×800) |
| `13-resume-intro-modal.png` | 주행 복귀 안내 모달 | 수리 후 CHASE_RESUME | 조작 3줄 확인 → 풀기(Enter) | 중앙 모달 | 첫 주행 안내와 거의 같은 문구가 반복 | O (1440×900) |
| `14-resume-police-approach-fish-bubble.png` | 주행 복귀 · 경찰 접근 말풍선 | 복귀 후 카운트다운 종료 | 경찰 접근 경고 관찰 | 좌측 물고기 말풍선 | 기어는 자동 D이나 속도 0에서 시작 | O (1440×900) |
| `15-resume-approaching-red-light-card.png` | 복귀 주행 · 적색 신호 미션 카드 | 구동 수리 후 재주행 ~500m 이후 | '적색 신호 정지 · 제동 시퀀스 기록' | 상단 중앙 카드 2장 | R 키 재시동 안내는 이 카드에 없음 | O (1440×900) |
| `16-resume-stopped-at-red-light.png` | 복귀 주행 · 적색 신호 정지 | 정지선 도달 | S로 부드럽게 제동, 정지선 이탈 금지 | 상단 중앙 카드 + 횡단보도 | 가속 입력을 유지하면 속도 5km/h로 고정되어 막힌 것처럼 보임(R 안내 부족) | O (1440×900) |
| `17-resume-after-R-restart.png` | 복귀 주행 · R 입력 후 | 정지 후 R 키 | 재시동 확인 | 좌하단 속도 카드 |  | O (1440×900) |
| `18-resume-driving-after-restart.png` | 복귀 주행 · 재시동 후 주행 | R 후 가속 | 주행 지속 | 전체 3D 화면 | 장거리 고속 구간 안내 카드 등장 | O (1440×900) |
| `19-race2-high-load-zone-and-R-restart-mission-card.png` | 두 번째 고장 전 · 고부하 구간 + R 재시동 미션 | 복귀 주행 ~700m 이후 | '가속을 유지해 속도를 지키세요' / '정차 후 READY 재인가 · R 키로 재시동' | 상단 중앙 카드 2장 | R 안내 카드가 구간 카드와 함께 쌓임. R을 누르지 않으면 속도 7km/h에서 정지(감사 2.3) | O (1440×900) |
| `20-fault2-dialogue-1-thermal.png` | 고장 대화 1/2(열관리) | 고부하 구간에서 고장 2 | 볼트 대사 → '다음 →' | 하단 대화 카드 |  | O (1440×900) |
| `21-fault2-dialogue-2-thermal.png` | 고장 대화 2/2(열관리) | '다음 →' 후 | 너트 대사 → '원인 추적 시작 →' | 하단 대화 카드 |  | O (1440×900) |
| `22-repair-cutscene-thermal.png` | 수리 완료 컷(열관리) | 열관리 사건 STEP04 후 | 자동 카운트다운 | 우측 카드 | 구동과 같은 레이아웃·같은 옛 라벨 | O (1440×900) |
| `23-repair-cutscene-brake-dev-entry-only.png` | 수리 완료 컷(제동) | 개발용 QA 진입 사건 | 자동 카운트다운 | 우측 카드 | 정상 플레이에서 진입 불가(제동 사건 진입 이벤트 없음) | O (1440×900) |

### 02 · STEP01 차량 동작 원리  (`02-step01/`, 23장)

| 파일 | 단계·화면 | 진입 조건 | 질문·행동 | 핵심 조작 영역 | UI 문제·특이사항 | 캡처 |
|---|---|---|---|---|---|---|
| `step01-01-intro-modal.png` | STEP01 안내 모달 | 프롤로그 종료 / ?qa=GARAGE_L1 | 3줄 안내 읽고 풀기(Enter) | 중앙 모달 | 목표 문장은 모달에만 있고 이후 화면 질문은 상단 폴더 줄 한 줄뿐 | O (1440×900) |
| `step01-02-overview-all-domains.png` | STEP01 전체보기(처음 화면) | 모달 닫은 직후 | 도메인 탭 선택(오른쪽 패널: '도메인을 골라 보세요') | 상단 도메인 탭 8개 | 02·03 관점은 도메인 선택 전 잠김. 3D 도면이 작게 흩어져 보임. 하단 신호 흐름 패널이 비어 있음 | O (1440×900) |
| `step01-02-overview-all-domains@1428x800.png` | STEP01 전체보기(처음 화면) | 모달 닫은 직후 | 도메인 탭 선택(오른쪽 패널: '도메인을 골라 보세요') | 상단 도메인 탭 8개 | 02·03 관점은 도메인 선택 전 잠김. 3D 도면이 작게 흩어져 보임. 하단 신호 흐름 패널이 비어 있음 | O (1428×800) |
| `step01-03-drive-vehicle-system-initial.png` | STEP01 구동 · Vehicle/System | 구동 탭 선택 | 조건 3개(READY·D단·가속 페달 꾹) 선택, 기능 4개 선택 | 중앙 3D + 하단 조건 버튼 + 우측 기능 목록 | 조작(조건 버튼)과 열람(기능 목록·신호 카드)이 같은 시각 비중. '다음 →' 상시 활성(완료 판정 없음) | O (1440×900) |
| `step01-03-drive-vehicle-system-initial@1428x800.png` | STEP01 구동 · Vehicle/System | 구동 탭 선택 | 조건 3개(READY·D단·가속 페달 꾹) 선택, 기능 4개 선택 | 중앙 3D + 하단 조건 버튼 + 우측 기능 목록 | 조작(조건 버튼)과 열람(기능 목록·신호 카드)이 같은 시각 비중. '다음 →' 상시 활성(완료 판정 없음) | O (1428×800) |
| `step01-04-drive-vehicle-ready-on.png` | STEP01 구동 · READY 켜짐 | READY 켜기 클릭 | D단 → 가속 페달 순서로 진행 | 하단 조건 버튼 | 조건 순서 잠금(앞 조건 후 다음 활성) | O (1440×900) |
| `step01-05-drive-vehicle-pedal-holding.png` | STEP01 구동 · 가속 페달 꾹 누르는 중 | 가속 페달 버튼 길게 누름 | 입력 신호가 부품을 따라 전달되는 모습 관찰 | 3D 화면 + 하단 신호 카드 | 신호 강조가 3D 위 라벨로 작게 표시 | O (1440×900) |
| `step01-06-drive-vehicle-pedal-done.png` | STEP01 구동 · 입력 선택 완료 | 꾹 해제 후 | '다음 스텝'으로 신호 관찰 | '다음 스텝/자동재생' 버튼 | '입력이 선택됨 · 다음 스텝으로 관찰하세요' 안내가 3D 하단에 작게 표시 | O (1440×900) |
| `step01-07-drive-vehicle-signal-step.png` | STEP01 구동 · 신호 단계 진행 | 다음 스텝 반복 | 단계별 부품 하이라이트 관찰 | 하단 신호 흐름 5단계 카드 | 단계 수는 기능마다 다름 | O (1440×900) |
| `step01-08-drive-vehicle-feature2.png` | STEP01 구동 · 두 번째 기능(D단 구동 인터록) | 우측 기능 목록 2번 선택 | 기능 바꿔서 같은 조작 반복 | 우측 기능 목록 | 기능을 바꾸면 조건(READY·D단·페달)이 초기화되어 다시 눌러야 함 | O (1440×900) |
| `step01-09-drive-ee-initial.png` | STEP01 구동 · E/E Architecture | 02 E/E 관점 선택 | '먼저 입력을 길게 눌러 선택하세요' | 중앙 E/E 도면 + 하단 단계 패널 | 관점 전환 시 조건이 초기화되어 안내 문구 재표시. 도면의 활성 노드가 작음 | O (1440×900) |
| `step01-09-drive-ee-initial@1428x800.png` | STEP01 구동 · E/E Architecture | 02 E/E 관점 선택 | '먼저 입력을 길게 눌러 선택하세요' | 중앙 E/E 도면 + 하단 단계 패널 | 관점 전환 시 조건이 초기화되어 안내 문구 재표시. 도면의 활성 노드가 작음 | O (1428×800) |
| `step01-10-drive-ee-signal-step.png` | STEP01 구동 · E/E 신호 단계 | 다음 스텝 | 받는 값 → 하는 일 → 보내는 값 | 하단 단계 패널 | 같은 기능을 세 관점에서 보지만 진행 상태가 관점 간 공유되지 않음 | O (1440×900) |
| `step01-11-drive-sw-initial.png` | STEP01 구동 · Control Software | 03 SW 관점 선택 | SW 블록 흐름 관찰 | 중앙 SW 블록도 |  | O (1440×900) |
| `step01-11-drive-sw-initial@1428x800.png` | STEP01 구동 · Control Software | 03 SW 관점 선택 | SW 블록 흐름 관찰 | 중앙 SW 블록도 |  | O (1428×800) |
| `step01-12-drive-sw-signal-step.png` | STEP01 구동 · SW 신호 단계 | 다음 스텝 | 입력→출력 SW 블록 하이라이트 | 하단 단계 패널(2단계) | SW 단계 수가 3D·E/E와 다름(2개) | O (1440×900) |
| `step01-13-thermal-vehicle-system-initial.png` | STEP01 열관리 도메인 화면(관점은 파일명 참고) | 열관리 탭 선택 | 도메인 기능 관찰 | 중앙 도면 | 구동과 같은 레이아웃 | O (1440×900) |
| `step01-14-thermal-ee-initial.png` | STEP01 열관리 도메인 화면(관점은 파일명 참고) | 열관리 탭 선택 | 도메인 기능 관찰 | 중앙 도면 | 구동과 같은 레이아웃 | O (1440×900) |
| `step01-15-thermal-sw-initial.png` | STEP01 열관리 도메인 화면(관점은 파일명 참고) | 열관리 탭 선택 | 도메인 기능 관찰 | 중앙 도면 | 구동과 같은 레이아웃 | O (1440×900) |
| `step01-16-brake-vehicle-system-initial.png` | STEP01 제동 도메인 화면(관점은 파일명 참고) | 제동 탭 선택 | 도메인 기능 관찰 | 중앙 도면 | 구동과 같은 레이아웃 | O (1440×900) |
| `step01-17-brake-ee-initial.png` | STEP01 제동 도메인 화면(관점은 파일명 참고) | 제동 탭 선택 | 도메인 기능 관찰 | 중앙 도면 | 구동과 같은 레이아웃 | O (1440×900) |
| `step01-18-brake-sw-initial.png` | STEP01 제동 도메인 화면(관점은 파일명 참고) | 제동 탭 선택 | 도메인 기능 관찰 | 중앙 도면 | 구동과 같은 레이아웃 | O (1440×900) |
| `step01-19-brake-vehicle-overlay-mode.png` | STEP01 제동 도메인 화면(관점은 파일명 참고) | 제동 탭 선택 | 도메인 기능 관찰 | 중앙 도면 | 구동과 같은 레이아웃 | O (1440×900) |

### 03 · STEP02 도미노 원인 역추적  (`03-step02/`, 54장)

| 파일 | 단계·화면 | 진입 조건 | 질문·행동 | 핵심 조작 영역 | UI 문제·특이사항 | 캡처 |
|---|---|---|---|---|---|---|
| `step02-brake-00-stage-intro-modal.png` | STEP02 안내 모달(brake) | 고장 대화 후(BOARD) | 3줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `step02-brake-01-evidence-initial.png` | STEP02 도미노 · 증거 첫 화면(brake) | 모달 닫은 직후 | 증거 폴라로이드 확인 → 출력 노드 선택 | 우측 증거 패널 + 중앙 도미노 판 | 질문 문장이 화면 안에서 눈에 띄는 위치에 없음(폴더 줄·판 헤더·고양이 줄에 분산). 다음 버튼 상시 비활성 | O (1440×900) |
| `step02-brake-02-evidence-zoom.png` | STEP02 증거 확대(brake) | 폴라로이드 클릭 | 증거 내용 읽기 | 중앙 확대 카드 |  | O (1440×900) |
| `step02-brake-04-evidence-all-read.png` | STEP02 증거 모두 읽은 상태(brake) | 증거 확인 후 | 출력 노드 선택 | 중앙 판 노드 |  | O (1440×900) |
| `step02-brake-05-output-selected.png` | STEP02 출력 선택됨(brake) | 출력 노드 클릭 | '고장 당시 로그 재생' 클릭 | 하단 dock 질문 + 로그 재생 버튼 | 질문 글자가 12.5px로 고양이 줄(14px)보다 작음(감사 2.4) | O (1440×900) |
| `step02-propulsion-00-stage-intro-modal.png` | STEP02 안내 모달(propulsion) | 고장 대화 후(BOARD) | 3줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `step02-propulsion-01-evidence-initial.png` | STEP02 도미노 · 증거 첫 화면(propulsion) | 모달 닫은 직후 | 증거 폴라로이드 확인 → 출력 노드 선택 | 우측 증거 패널 + 중앙 도미노 판 | 질문 문장이 화면 안에서 눈에 띄는 위치에 없음(폴더 줄·판 헤더·고양이 줄에 분산). 다음 버튼 상시 비활성 | O (1440×900) |
| `step02-propulsion-01-evidence-initial@1428x800.png` | STEP02 도미노 · 증거 첫 화면(propulsion) | 모달 닫은 직후 | 증거 폴라로이드 확인 → 출력 노드 선택 | 우측 증거 패널 + 중앙 도미노 판 | 질문 문장이 화면 안에서 눈에 띄는 위치에 없음(폴더 줄·판 헤더·고양이 줄에 분산). 다음 버튼 상시 비활성 | O (1428×800) |
| `step02-propulsion-02-evidence-zoom.png` | STEP02 증거 확대(propulsion) | 폴라로이드 클릭 | 증거 내용 읽기 | 중앙 확대 카드 |  | O (1440×900) |
| `step02-propulsion-04-evidence-all-read.png` | STEP02 증거 모두 읽은 상태(propulsion) | 증거 확인 후 | 출력 노드 선택 | 중앙 판 노드 |  | O (1440×900) |
| `step02-propulsion-05-output-selected.png` | STEP02 출력 선택됨(propulsion) | 출력 노드 클릭 | '고장 당시 로그 재생' 클릭 | 하단 dock 질문 + 로그 재생 버튼 | 질문 글자가 12.5px로 고양이 줄(14px)보다 작음(감사 2.4) | O (1440×900) |
| `step02-propulsion-06-log-replay-running.png` | STEP02 로그 재생 중(propulsion) | 로그 재생 클릭 | 신호 변화 관찰 | 중앙 재생 오버레이 |  | O (1440×900) |
| `step02-propulsion-07-log-replay-done.png` | STEP02 로그 재생 완료(propulsion) | 재생 종료 | 닫고 후보 측정 | 재생 오버레이 |  | O (1440×900) |
| `step02-propulsion-08-trace-start.png` | STEP02 역추적 시작(propulsion) | 로그 재생 후 | 후보 카드 '증거 확보(측정)' → 반박/유력 선택 | 하단 후보 폴라로이드 3장 | 후보 카드·버튼 글자 10.5~11px | O (1440×900) |
| `step02-propulsion-08-trace-start@1428x800.png` | STEP02 역추적 시작(propulsion) | 로그 재생 후 | 후보 카드 '증거 확보(측정)' → 반박/유력 선택 | 하단 후보 폴라로이드 3장 | 후보 카드·버튼 글자 10.5~11px | O (1428×800) |
| `step02-propulsion-09-trace-first-measured.png` | STEP02 첫 후보 측정 후(propulsion) | 측정 클릭 | 기준 대비 달라진 시점을 보고 반박/유력 선택 | 후보 카드(막대·시점) |  | O (1440×900) |
| `step02-propulsion-10-trace-wrong-stamp-feedback.png` | STEP02 오답 피드백(propulsion) | 의도적으로 틀린 도장 선택 | 오답 확인 후 재선택 | 중앙에 큰 '오답' 도장 + 고양이 줄 | 오답 도장이 판 위를 크게 덮음. 오답 횟수는 단계 합계로만 기록 | O (1440×900) |
| `step02-propulsion-11-trace-question-2-start.png` | STEP02 역추적 2번째 출력(propulsion) | 이전 출력 판정 완료 | 새 출력의 후보 3개 판정 | 하단 후보 카드 | 단계가 진행될수록 판이 도미노 연쇄로 채워짐 | O (1440×900) |
| `step02-propulsion-11-trace-question-3-start.png` | STEP02 역추적 3번째 출력(propulsion) | 이전 출력 판정 완료 | 새 출력의 후보 3개 판정 | 하단 후보 카드 | 단계가 진행될수록 판이 도미노 연쇄로 채워짐 | O (1440×900) |
| `step02-propulsion-11-trace-question-4-start.png` | STEP02 역추적 4번째 출력(propulsion) | 이전 출력 판정 완료 | 새 출력의 후보 3개 판정 | 하단 후보 카드 | 단계가 진행될수록 판이 도미노 연쇄로 채워짐 | O (1440×900) |
| `step02-propulsion-12-section-question.png` | STEP02 의심 구간 선택(propulsion) | 모든 후보 판정 후 | 의심 구간 3지선다 | 하단 dock 3버튼 + VCU 내부 들여다보기 | 질문이 dock 안 작은 줄(12.5px) | O (1440×900) |
| `step02-propulsion-12-section-question@1428x800.png` | STEP02 의심 구간 선택(propulsion) | 모든 후보 판정 후 | 의심 구간 3지선다 | 하단 dock 3버튼 + VCU 내부 들여다보기 | 질문이 dock 안 작은 줄(12.5px) | O (1428×800) |
| `step02-propulsion-13-section-wrong-feedback.png` | STEP02 구간 오답 피드백(propulsion) | 의도적 오답 구간 선택 | 오답 확인 후 재선택 | dock + 고양이 줄 |  | O (1440×900) |
| `step02-propulsion-14-hypothesis-sort-start.png` | STEP02 가설 정리 시작(propulsion) | 의심 구간 선택 후 | 가설별 '반박/보류' 선택 | 하단 dock 2버튼 |  | O (1440×900) |
| `step02-propulsion-15-hypothesis-sort-2.png` | STEP02 가설 정리 진행(propulsion) | 가설 판정 진행 | 다음 가설 판정 | 하단 dock |  | O (1440×900) |
| `step02-propulsion-15-hypothesis-sort-3.png` | STEP02 가설 정리 진행(propulsion) | 가설 판정 진행 | 다음 가설 판정 | 하단 dock |  | O (1440×900) |
| `step02-propulsion-15-hypothesis-sort-4.png` | STEP02 가설 정리 진행(propulsion) | 가설 판정 진행 | 다음 가설 판정 | 하단 dock |  | O (1440×900) |
| `step02-propulsion-16-hypothesis-sorted-pick-next-test.png` | STEP02 가설 정리 완료 · 먼저 시험할 가설 선택(propulsion) | 모든 가설 정리 후 | 먼저 시험할 가설 선택 버튼 | 하단 dock | 열관리는 반박 0건·보류 3건으로 끝남(가설 3개 모두 보류) | O (1440×900) |
| `step02-propulsion-17-complete-next-enabled.png` | STEP02 완료(propulsion) | 가설 선택 후 | '다음: 요구사항 기반 퍼즐 →' | 우하단 진행 버튼 + 중앙 요약 | 완료 직후 판이 투명해지는 전환 중 프레임. 완료 피드백이 '가설 정리 완료' 한 줄 | O (1440×900) |
| `step02-propulsion-17-complete-next-enabled@1428x800.png` | STEP02 완료(propulsion) | 가설 선택 후 | '다음: 요구사항 기반 퍼즐 →' | 우하단 진행 버튼 + 중앙 요약 | 완료 직후 판이 투명해지는 전환 중 프레임. 완료 피드백이 '가설 정리 완료' 한 줄 | O (1428×800) |
| `step02-propulsion-18-evidence-panel-reasoning-board-tab.png` | STEP02 추리 보드 탭(propulsion) | 우측 '추리 보드' 탭 | 판정 결과 확인 | 우측 증거 패널 |  | O (1440×900) |
| `step02-propulsion-19-replay-confirm-popup.png` | STEP02 다시 풀기 확인 팝업(propulsion) | 완료 후 '다시 풀기' | 취소 / 다시 풀기 | 중앙 팝업 | STEP03·STEP04도 함께 초기화된다는 안내가 있음 | O (1440×900) |
| `step02-thermal-00-stage-intro-modal.png` | STEP02 안내 모달(thermal) | 고장 대화 후(BOARD) | 3줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `step02-thermal-01-evidence-initial.png` | STEP02 도미노 · 증거 첫 화면(thermal) | 모달 닫은 직후 | 증거 폴라로이드 확인 → 출력 노드 선택 | 우측 증거 패널 + 중앙 도미노 판 | 질문 문장이 화면 안에서 눈에 띄는 위치에 없음(폴더 줄·판 헤더·고양이 줄에 분산). 다음 버튼 상시 비활성 | O (1440×900) |
| `step02-thermal-02-evidence-zoom.png` | STEP02 증거 확대(thermal) | 폴라로이드 클릭 | 증거 내용 읽기 | 중앙 확대 카드 |  | O (1440×900) |
| `step02-thermal-04-evidence-all-read.png` | STEP02 증거 모두 읽은 상태(thermal) | 증거 확인 후 | 출력 노드 선택 | 중앙 판 노드 |  | O (1440×900) |
| `step02-thermal-05-output-selected.png` | STEP02 출력 선택됨(thermal) | 출력 노드 클릭 | '고장 당시 로그 재생' 클릭 | 하단 dock 질문 + 로그 재생 버튼 | 질문 글자가 12.5px로 고양이 줄(14px)보다 작음(감사 2.4) | O (1440×900) |
| `step02-thermal-06-log-replay-running.png` | STEP02 로그 재생 중(thermal) | 로그 재생 클릭 | 신호 변화 관찰 | 중앙 재생 오버레이 |  | O (1440×900) |
| `step02-thermal-07-log-replay-done.png` | STEP02 로그 재생 완료(thermal) | 재생 종료 | 닫고 후보 측정 | 재생 오버레이 |  | O (1440×900) |
| `step02-thermal-08-trace-start.png` | STEP02 역추적 시작(thermal) | 로그 재생 후 | 후보 카드 '증거 확보(측정)' → 반박/유력 선택 | 하단 후보 폴라로이드 3장 | 후보 카드·버튼 글자 10.5~11px | O (1440×900) |
| `step02-thermal-09-trace-first-measured.png` | STEP02 첫 후보 측정 후(thermal) | 측정 클릭 | 기준 대비 달라진 시점을 보고 반박/유력 선택 | 후보 카드(막대·시점) |  | O (1440×900) |
| `step02-thermal-10-trace-wrong-stamp-feedback.png` | STEP02 오답 피드백(thermal) | 의도적으로 틀린 도장 선택 | 오답 확인 후 재선택 | 중앙에 큰 '오답' 도장 + 고양이 줄 | 오답 도장이 판 위를 크게 덮음. 오답 횟수는 단계 합계로만 기록 | O (1440×900) |
| `step02-thermal-11-trace-question-2-start.png` | STEP02 역추적 2번째 출력(thermal) | 이전 출력 판정 완료 | 새 출력의 후보 3개 판정 | 하단 후보 카드 | 단계가 진행될수록 판이 도미노 연쇄로 채워짐 | O (1440×900) |
| `step02-thermal-11-trace-question-3-start.png` | STEP02 역추적 3번째 출력(thermal) | 이전 출력 판정 완료 | 새 출력의 후보 3개 판정 | 하단 후보 카드 | 단계가 진행될수록 판이 도미노 연쇄로 채워짐 | O (1440×900) |
| `step02-thermal-11-trace-question-4-start.png` | STEP02 역추적 4번째 출력(thermal) | 이전 출력 판정 완료 | 새 출력의 후보 3개 판정 | 하단 후보 카드 | 단계가 진행될수록 판이 도미노 연쇄로 채워짐 | O (1440×900) |
| `step02-thermal-11-trace-question-5-start.png` | STEP02 역추적 5번째 출력(thermal) | 이전 출력 판정 완료 | 새 출력의 후보 3개 판정 | 하단 후보 카드 | 단계가 진행될수록 판이 도미노 연쇄로 채워짐 | O (1440×900) |
| `step02-thermal-12-section-question.png` | STEP02 의심 구간 선택(thermal) | 모든 후보 판정 후 | 의심 구간 3지선다 | 하단 dock 3버튼 + VCU 내부 들여다보기 | 질문이 dock 안 작은 줄(12.5px) | O (1440×900) |
| `step02-thermal-14-hypothesis-sort-start.png` | STEP02 가설 정리 시작(thermal) | 의심 구간 선택 후 | 가설별 '반박/보류' 선택 | 하단 dock 2버튼 |  | O (1440×900) |
| `step02-thermal-15-hypothesis-sort-2.png` | STEP02 가설 정리 진행(thermal) | 가설 판정 진행 | 다음 가설 판정 | 하단 dock |  | O (1440×900) |
| `step02-thermal-15-hypothesis-sort-3.png` | STEP02 가설 정리 진행(thermal) | 가설 판정 진행 | 다음 가설 판정 | 하단 dock |  | O (1440×900) |
| `step02-thermal-16-hypothesis-sorted-pick-next-test.png` | STEP02 가설 정리 완료 · 먼저 시험할 가설 선택(thermal) | 모든 가설 정리 후 | 먼저 시험할 가설 선택 버튼 | 하단 dock | 열관리는 반박 0건·보류 3건으로 끝남(가설 3개 모두 보류) | O (1440×900) |
| `step02-thermal-17-complete-next-enabled.png` | STEP02 완료(thermal) | 가설 선택 후 | '다음: 요구사항 기반 퍼즐 →' | 우하단 진행 버튼 + 중앙 요약 | 완료 직후 판이 투명해지는 전환 중 프레임. 완료 피드백이 '가설 정리 완료' 한 줄 | O (1440×900) |
| `step02-thermal-18-evidence-panel-reasoning-board-tab.png` | STEP02 추리 보드 탭(thermal) | 우측 '추리 보드' 탭 | 판정 결과 확인 | 우측 증거 패널 |  | O (1440×900) |
| `step02-thermal-19-replay-confirm-popup.png` | STEP02 다시 풀기 확인 팝업(thermal) | 완료 후 '다시 풀기' | 취소 / 다시 풀기 | 중앙 팝업 | STEP03·STEP04도 함께 초기화된다는 안내가 있음 | O (1440×900) |

### 04 · STEP03 정상 동작 조립  (`04-step03/`, 40장)

| 파일 | 단계·화면 | 진입 조건 | 질문·행동 | 핵심 조작 영역 | UI 문제·특이사항 | 캡처 |
|---|---|---|---|---|---|---|
| `step03-brake-00-stage-intro-modal.png` | STEP03 안내 모달(brake) | STEP02 완료 후(WIRING) | 3줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `step03-brake-01-puzzle-before-assembly.png` | STEP03 퍼즐 · 조립 전(brake) | 모달 닫은 직후 | 빈칸 3곳에 조각을 끌어 넣고 '연결 확인' | 중앙 퍼즐판(빈칸 3) + 남은 조각 칸 + 우측 요구사항 8개 | 질문·행동 버튼이 화면 맨 아래 58px 줄에 있고 퍼즐 영역과 거리가 멂. 조각 설명은 19px '?' 버튼으로만 열림 | O (1440×900) |
| `step03-brake-02-block-help-bubble.png` | STEP03 조각 설명 말풍선(brake) | '?' 클릭 | 조각 기능 읽기 | 조각 옆 말풍선 |  | O (1440×900) |
| `step03-brake-03-assembly-one-placed.png` | STEP03 조립 중 · 1개 배치(brake) | 조각 1개 드래그 | 나머지 조각 배치 | 퍼즐판 빈칸 | 빈칸에 맞춘 조각이 바로 정답 여부를 알려주지 않음(의도) | O (1440×900) |
| `step03-brake-04-assembly-all-filled-one-wrong-before-check.png` | STEP03 조립 중 · 전체 배치(오답 포함)(brake) | 빈칸 3개 모두 채움 | '연결 확인' 클릭 | 하단 진행 버튼('연결 확인') | 하단 버튼이 상태에 따라 글자·폭이 바뀜(빈칸 n개 남음 → 연결 확인 → 기준 확정) | O (1440×900) |
| `step03-brake-05-check-fail-first-mismatch.png` | STEP03 오답 · 첫 불일치에서 멈춤(brake) | 오답 조각으로 연결 확인 | 고양이 설명 읽고 조각 교체 | 퍼즐판 신호값 + 요구사항 ✕ + 고양이 줄 | 오답 횟수(fails)는 저장되지 않아 새로고침 시 초기화 | O (1440×900) |
| `step03-brake-06-assembly-corrected-before-check.png` | STEP03 조립 · 수정 후(brake) | 정답 조각으로 교체 | 다시 '연결 확인' | 퍼즐판 |  | O (1440×900) |
| `step03-brake-07-check-pass-example-input-slider.png` | STEP03 연결 확인 통과 · 예시 입력(brake) | 정답 조립 후 연결 확인 | 슬라이더로 예시 입력 60% 맞추기 | 상단 슬라이더 + 퍼즐판 값 표시 |  | O (1440×900) |
| `step03-brake-08-example-input-set.png` | STEP03 예시 입력 설정 후(brake) | 슬라이더 이동 | '요구사항과 같아요 · 기준 확정' | 하단 진행 버튼 |  | O (1440×900) |
| `step03-brake-09-reference-confirmed-test-contract-receipt.png` | STEP03 기준 확정 · 시험 계약 영수증(brake) | 기준 확정 클릭 | '설계서 확정 · 시뮬레이션 검증으로' 또는 × | 중앙 설계서 카드(시험 목적·요구사항·입력·예상 출력) | 책 펼침 전환 중 프레임. 설계서 글자가 작고 카드 하단 버튼이 설계서 안에 있음 | O (1440×900) |
| `step03-brake-10-complete-receipt-closed-next-enabled.png` | STEP03 완료(brake) | 설계서 닫음 | '다음: 시뮬레이션 검증 →' / '다시 풀기' | 우하단 진행 버튼 + 하단 시험 계약 요약 | STEP03 퍼즐 배치는 STEP04 계산에 반영되지 않음(감사 9.3). 완료 피드백이 고양이 한 줄 | O (1440×900) |
| `step03-brake-11-replay-confirm-popup.png` | STEP03 다시 풀기 확인 팝업(brake) | '다시 풀기' 클릭 | 취소 / 다시 풀기 | 중앙 팝업 | 시험 계약·STEP04 기록도 초기화됨 안내 | O (1440×900) |
| `step03-propulsion-00-stage-intro-modal.png` | STEP03 안내 모달(propulsion) | STEP02 완료 후(WIRING) | 3줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `step03-propulsion-01-puzzle-before-assembly.png` | STEP03 퍼즐 · 조립 전(propulsion) | 모달 닫은 직후 | 빈칸 3곳에 조각을 끌어 넣고 '연결 확인' | 중앙 퍼즐판(빈칸 3) + 남은 조각 칸 + 우측 요구사항 8개 | 질문·행동 버튼이 화면 맨 아래 58px 줄에 있고 퍼즐 영역과 거리가 멂. 조각 설명은 19px '?' 버튼으로만 열림 | O (1440×900) |
| `step03-propulsion-01-puzzle-before-assembly@1428x800.png` | STEP03 퍼즐 · 조립 전(propulsion) | 모달 닫은 직후 | 빈칸 3곳에 조각을 끌어 넣고 '연결 확인' | 중앙 퍼즐판(빈칸 3) + 남은 조각 칸 + 우측 요구사항 8개 | 질문·행동 버튼이 화면 맨 아래 58px 줄에 있고 퍼즐 영역과 거리가 멂. 조각 설명은 19px '?' 버튼으로만 열림 | O (1428×800) |
| `step03-propulsion-02-block-help-bubble.png` | STEP03 조각 설명 말풍선(propulsion) | '?' 클릭 | 조각 기능 읽기 | 조각 옆 말풍선 |  | O (1440×900) |
| `step03-propulsion-03-assembly-one-placed.png` | STEP03 조립 중 · 1개 배치(propulsion) | 조각 1개 드래그 | 나머지 조각 배치 | 퍼즐판 빈칸 | 빈칸에 맞춘 조각이 바로 정답 여부를 알려주지 않음(의도) | O (1440×900) |
| `step03-propulsion-04-assembly-all-filled-one-wrong-before-check.png` | STEP03 조립 중 · 전체 배치(오답 포함)(propulsion) | 빈칸 3개 모두 채움 | '연결 확인' 클릭 | 하단 진행 버튼('연결 확인') | 하단 버튼이 상태에 따라 글자·폭이 바뀜(빈칸 n개 남음 → 연결 확인 → 기준 확정) | O (1440×900) |
| `step03-propulsion-05-check-fail-first-mismatch.png` | STEP03 오답 · 첫 불일치에서 멈춤(propulsion) | 오답 조각으로 연결 확인 | 고양이 설명 읽고 조각 교체 | 퍼즐판 신호값 + 요구사항 ✕ + 고양이 줄 | 오답 횟수(fails)는 저장되지 않아 새로고침 시 초기화 | O (1440×900) |
| `step03-propulsion-05-check-fail-first-mismatch@1428x800.png` | STEP03 오답 · 첫 불일치에서 멈춤(propulsion) | 오답 조각으로 연결 확인 | 고양이 설명 읽고 조각 교체 | 퍼즐판 신호값 + 요구사항 ✕ + 고양이 줄 | 오답 횟수(fails)는 저장되지 않아 새로고침 시 초기화 | O (1428×800) |
| `step03-propulsion-06-assembly-corrected-before-check.png` | STEP03 조립 · 수정 후(propulsion) | 정답 조각으로 교체 | 다시 '연결 확인' | 퍼즐판 |  | O (1440×900) |
| `step03-propulsion-07-check-pass-example-input-slider.png` | STEP03 연결 확인 통과 · 예시 입력(propulsion) | 정답 조립 후 연결 확인 | 슬라이더로 예시 입력 60% 맞추기 | 상단 슬라이더 + 퍼즐판 값 표시 |  | O (1440×900) |
| `step03-propulsion-07-check-pass-example-input-slider@1428x800.png` | STEP03 연결 확인 통과 · 예시 입력(propulsion) | 정답 조립 후 연결 확인 | 슬라이더로 예시 입력 60% 맞추기 | 상단 슬라이더 + 퍼즐판 값 표시 |  | O (1428×800) |
| `step03-propulsion-08-example-input-set.png` | STEP03 예시 입력 설정 후(propulsion) | 슬라이더 이동 | '요구사항과 같아요 · 기준 확정' | 하단 진행 버튼 |  | O (1440×900) |
| `step03-propulsion-09-reference-confirmed-test-contract-receipt.png` | STEP03 기준 확정 · 시험 계약 영수증(propulsion) | 기준 확정 클릭 | '설계서 확정 · 시뮬레이션 검증으로' 또는 × | 중앙 설계서 카드(시험 목적·요구사항·입력·예상 출력) | 책 펼침 전환 중 프레임. 설계서 글자가 작고 카드 하단 버튼이 설계서 안에 있음 | O (1440×900) |
| `step03-propulsion-10-complete-receipt-closed-next-enabled.png` | STEP03 완료(propulsion) | 설계서 닫음 | '다음: 시뮬레이션 검증 →' / '다시 풀기' | 우하단 진행 버튼 + 하단 시험 계약 요약 | STEP03 퍼즐 배치는 STEP04 계산에 반영되지 않음(감사 9.3). 완료 피드백이 고양이 한 줄 | O (1440×900) |
| `step03-propulsion-10-complete-receipt-closed-next-enabled@1428x800.png` | STEP03 완료(propulsion) | 설계서 닫음 | '다음: 시뮬레이션 검증 →' / '다시 풀기' | 우하단 진행 버튼 + 하단 시험 계약 요약 | STEP03 퍼즐 배치는 STEP04 계산에 반영되지 않음(감사 9.3). 완료 피드백이 고양이 한 줄 | O (1428×800) |
| `step03-propulsion-11-replay-confirm-popup.png` | STEP03 다시 풀기 확인 팝업(propulsion) | '다시 풀기' 클릭 | 취소 / 다시 풀기 | 중앙 팝업 | 시험 계약·STEP04 기록도 초기화됨 안내 | O (1440×900) |
| `step03-thermal-00-stage-intro-modal.png` | STEP03 안내 모달(thermal) | STEP02 완료 후(WIRING) | 3줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `step03-thermal-01-puzzle-before-assembly.png` | STEP03 퍼즐 · 조립 전(thermal) | 모달 닫은 직후 | 빈칸 3곳에 조각을 끌어 넣고 '연결 확인' | 중앙 퍼즐판(빈칸 3) + 남은 조각 칸 + 우측 요구사항 8개 | 질문·행동 버튼이 화면 맨 아래 58px 줄에 있고 퍼즐 영역과 거리가 멂. 조각 설명은 19px '?' 버튼으로만 열림 | O (1440×900) |
| `step03-thermal-02-block-help-bubble.png` | STEP03 조각 설명 말풍선(thermal) | '?' 클릭 | 조각 기능 읽기 | 조각 옆 말풍선 |  | O (1440×900) |
| `step03-thermal-03-assembly-one-placed.png` | STEP03 조립 중 · 1개 배치(thermal) | 조각 1개 드래그 | 나머지 조각 배치 | 퍼즐판 빈칸 | 빈칸에 맞춘 조각이 바로 정답 여부를 알려주지 않음(의도) | O (1440×900) |
| `step03-thermal-04-assembly-all-filled-one-wrong-before-check.png` | STEP03 조립 중 · 전체 배치(오답 포함)(thermal) | 빈칸 3개 모두 채움 | '연결 확인' 클릭 | 하단 진행 버튼('연결 확인') | 하단 버튼이 상태에 따라 글자·폭이 바뀜(빈칸 n개 남음 → 연결 확인 → 기준 확정) | O (1440×900) |
| `step03-thermal-05-check-fail-first-mismatch.png` | STEP03 오답 · 첫 불일치에서 멈춤(thermal) | 오답 조각으로 연결 확인 | 고양이 설명 읽고 조각 교체 | 퍼즐판 신호값 + 요구사항 ✕ + 고양이 줄 | 오답 횟수(fails)는 저장되지 않아 새로고침 시 초기화 | O (1440×900) |
| `step03-thermal-06-assembly-corrected-before-check.png` | STEP03 조립 · 수정 후(thermal) | 정답 조각으로 교체 | 다시 '연결 확인' | 퍼즐판 |  | O (1440×900) |
| `step03-thermal-07-check-pass-example-input-slider.png` | STEP03 연결 확인 통과 · 예시 입력(thermal) | 정답 조립 후 연결 확인 | 슬라이더로 예시 입력 60% 맞추기 | 상단 슬라이더 + 퍼즐판 값 표시 |  | O (1440×900) |
| `step03-thermal-08-example-input-set.png` | STEP03 예시 입력 설정 후(thermal) | 슬라이더 이동 | '요구사항과 같아요 · 기준 확정' | 하단 진행 버튼 |  | O (1440×900) |
| `step03-thermal-09-reference-confirmed-test-contract-receipt.png` | STEP03 기준 확정 · 시험 계약 영수증(thermal) | 기준 확정 클릭 | '설계서 확정 · 시뮬레이션 검증으로' 또는 × | 중앙 설계서 카드(시험 목적·요구사항·입력·예상 출력) | 책 펼침 전환 중 프레임. 설계서 글자가 작고 카드 하단 버튼이 설계서 안에 있음 | O (1440×900) |
| `step03-thermal-10-complete-receipt-closed-next-enabled.png` | STEP03 완료(thermal) | 설계서 닫음 | '다음: 시뮬레이션 검증 →' / '다시 풀기' | 우하단 진행 버튼 + 하단 시험 계약 요약 | STEP03 퍼즐 배치는 STEP04 계산에 반영되지 않음(감사 9.3). 완료 피드백이 고양이 한 줄 | O (1440×900) |
| `step03-thermal-11-replay-confirm-popup.png` | STEP03 다시 풀기 확인 팝업(thermal) | '다시 풀기' 클릭 | 취소 / 다시 풀기 | 중앙 팝업 | 시험 계약·STEP04 기록도 초기화됨 안내 | O (1440×900) |

### 05 · STEP04 실험 검증  (`05-step04/`, 79장)

| 파일 | 단계·화면 | 진입 조건 | 질문·행동 | 핵심 조작 영역 | UI 문제·특이사항 | 캡처 |
|---|---|---|---|---|---|---|
| `step04-brake-01-stage-intro-modal.png` | STEP04 안내 모달(brake) | STEP03 설계서 확정 후 | 4줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `step04-brake-02-level-pick-question.png` | STEP04 가설 시험 · 시험 수준 선택(brake) | 첫 가설 | 시험 수준 3개 중 선택(SW 단위/제어기 I/O 통합/시스템 통합) | 중앙 시험 카드 3장 + 판단 기준 카드 | 시험 수준 이름이 탭과 데이터에서 다름(감사 3.1). 상단 정보 바 5단계 로드맵이 9.5px | O (1440×900) |
| `step04-brake-03-materials-check-question.png` | STEP04 가설 시험 · 자료 확인(brake) | 시험 수준 선택 후 | STEP02 로그·STEP03 설계서 칩 열기 | 상단 자료 칩 2개 + 하단 dock | 자료를 모두 열어야 다음으로 진행 | O (1440×900) |
| `step04-brake-04-materials-popup-step02-log-step03-contract.png` | STEP04 자료 팝업(brake) | 자료 칩 클릭 | STEP02 기록/STEP03 설계서 읽기 | 중앙 팝업 | 구동에서 STEP02 로그는 '기록 없음'일 수 있음(QA 진입) | O (1440×900) |
| `step04-brake-05-input-condition-choice.png` | STEP04 가설 시험 · 입력 조건 선택(brake) | 자료 확인 후 | 입력 카드 3~4장 중 선택 | 중앙 입력 카드 영역 | 카드 4장이 1428×800에서 꽉 참. 질문 부가문이 '관찰 신호를 비교'라고 하나 카드에 관찰 신호 줄 없음(감사 6.3) | O (1440×900) |
| `step04-brake-06-run-question.png` | STEP04 가설 시험 · 실행 질문(brake) | 입력 선택 후 | '▶ 시험 실행' / '입력 조건 바꾸기' | 하단 dock |  | O (1440×900) |
| `step04-brake-07-run1-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 1)(brake) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-brake-08-view-tab-signal-graph.png` | STEP04 결과 관점 · 신호 그래프(모니터링)(brake) | '모니터링' 탭 | 정상 점선 vs 이번 실선 비교 | 중앙 그래프 영역 |  | O (1440×900) |
| `step04-brake-09-view-tab-controller-io.png` | STEP04 결과 관점 · 제어기 I/O(brake) | '제어기 I/O 통합 시험' 탭 | 제어기 입출력 연결 보기 | 중앙 E/E 시각화 | 탭 전환은 시험 수준 선택과 같은 버튼이라 '보기'와 '수준 선택'이 섞임 | O (1440×900) |
| `step04-brake-10-view-tab-system.png` | STEP04 결과 관점 · 시스템 통합(주행 시뮬레이션)(brake) | '시스템 통합 시험' 탭 | 차량 주행 시각화 보기 | 중앙 3D 주행 화면 | 하단에 '비교 방식' 설명 칩이 얹힘. 하늘색 띠는 없음 | O (1440×900) |
| `step04-brake-11-view-tab-sw-unit.png` | STEP04 결과 관점 · SW 로직(brake) | 'SW 단위 시험' 탭 | SW 블록 흐름 보기 | 중앙 SW 블록 |  | O (1440×900) |
| `step04-brake-12-run2-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 2)(brake) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-brake-13-run3-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 3)(brake) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-brake-14-run4-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 4)(brake) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-brake-15-final-cause-selection.png` | STEP04 최종 원인 선택(brake) | 모든 가설 판정 후 | 원인 카드 2~3장 중 선택(폴라로이드) | 중앙 원인 카드(폴라로이드 + 카테고리 태그) | 원인 카드 폴라로이드 안 글자가 작음. 상단 보고서 영역과 원인 카드의 정보가 일부 중복 | O (1440×900) |
| `step04-brake-16-ab-comparison-question.png` | STEP04 A/B 비교 · 실행 질문(brake) | 원인 선택 후 | '▶ 두 모델 동시 실행' | 하단 dock + 중앙 두 화면 | A/B와 재시험이 같은 차량 수준 신호를 비교(중복 인상) | O (1440×900) |
| `step04-brake-17-ab-comparison-result-after-run.png` | STEP04 A/B 비교 · 실행 후(brake) | 두 모델 실행 후 | 그래프/결과 탭 확인 | 중앙 두 3D 화면 + 우측 결과 표 |  | O (1440×900) |
| `step04-brake-18-ab-comparison-conclusion-next-button.png` | STEP04 A/B 비교 · 결론(brake) | 실행 완료 후 | '수리 방법 고르기 →' | 하단 dock | '정상 vs 원인 제거' 결과가 재시험과 같은 표·문구 구조 | O (1440×900) |
| `step04-brake-19-repair-method-selection.png` | STEP04 수리 방법 선택(brake) | A/B 후 | 수리 카드 3장 중 선택 | 중앙 수리 카드 | 오답 수리(증상 보상)는 설명 후 재선택 | O (1440×900) |
| `step04-brake-20-retest-question.png` | STEP04 재시험 · 실행 질문(brake) | 수리 선택 후 | '▶ 동일 조건 기준선 비교 실행' | 하단 dock | A/B 실행 버튼과 동일한 구조·문구 반복 | O (1440×900) |
| `step04-brake-21-retest-result.png` | STEP04 재시험 · 실행 후(brake) | 재시험 실행 후 | 정상 범위 확인 | 우측 결과 표('정상 기준선/수정 후') + 중앙 3D | A/B 결과와 값이 같음(둘 다 fixed=정상과 동일 계산) | O (1440×900) |
| `step04-brake-22-done-retest-pass-return-button.png` | STEP04 완료(brake) | 재시험 PASS 후 | '수리 적용 · 주행 복귀' / '다시 풀기' | 우하단 진행 버튼 | 완료 피드백이 고양이 한 줄('정상 범위를 확인했어요') | O (1440×900) |
| `step04-brake-23-replay-confirm-popup.png` | STEP04 다시 풀기 확인 팝업(brake) | '다시 풀기' 클릭 | 취소 / 다시 풀기 | 중앙 팝업 |  | O (1440×900) |
| `step04-propulsion-01-stage-intro-modal.png` | STEP04 안내 모달(propulsion) | STEP03 설계서 확정 후 | 4줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `step04-propulsion-01-stage-intro-modal@1428x800.png` | STEP04 안내 모달(propulsion) | STEP03 설계서 확정 후 | 4줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1428×800) |
| `step04-propulsion-02-level-pick-question.png` | STEP04 가설 시험 · 시험 수준 선택(propulsion) | 첫 가설 | 시험 수준 3개 중 선택(SW 단위/제어기 I/O 통합/시스템 통합) | 중앙 시험 카드 3장 + 판단 기준 카드 | 시험 수준 이름이 탭과 데이터에서 다름(감사 3.1). 상단 정보 바 5단계 로드맵이 9.5px | O (1440×900) |
| `step04-propulsion-03-materials-check-question.png` | STEP04 가설 시험 · 자료 확인(propulsion) | 시험 수준 선택 후 | STEP02 로그·STEP03 설계서 칩 열기 | 상단 자료 칩 2개 + 하단 dock | 자료를 모두 열어야 다음으로 진행 | O (1440×900) |
| `step04-propulsion-04-help-popup-question-mark.png` | STEP04 도움말(?) 팝업(propulsion) | 상단 '?' 클릭 | 도움말 읽기 | 상단 로드맵 우측 '?' | 도움말 내용 확인 필요(캡처에서 팝업 구조만 확인) | O (1440×900) |
| `step04-propulsion-05-materials-popup-step02-log-step03-contract.png` | STEP04 자료 팝업(propulsion) | 자료 칩 클릭 | STEP02 기록/STEP03 설계서 읽기 | 중앙 팝업 | 구동에서 STEP02 로그는 '기록 없음'일 수 있음(QA 진입) | O (1440×900) |
| `step04-propulsion-06-input-condition-choice.png` | STEP04 가설 시험 · 입력 조건 선택(propulsion) | 자료 확인 후 | 입력 카드 3~4장 중 선택 | 중앙 입력 카드 영역 | 카드 4장이 1428×800에서 꽉 참. 질문 부가문이 '관찰 신호를 비교'라고 하나 카드에 관찰 신호 줄 없음(감사 6.3) | O (1440×900) |
| `step04-propulsion-06-input-condition-choice@1428x800.png` | STEP04 가설 시험 · 입력 조건 선택(propulsion) | 자료 확인 후 | 입력 카드 3~4장 중 선택 | 중앙 입력 카드 영역 | 카드 4장이 1428×800에서 꽉 참. 질문 부가문이 '관찰 신호를 비교'라고 하나 카드에 관찰 신호 줄 없음(감사 6.3) | O (1428×800) |
| `step04-propulsion-07-run-question.png` | STEP04 가설 시험 · 실행 질문(propulsion) | 입력 선택 후 | '▶ 시험 실행' / '입력 조건 바꾸기' | 하단 dock |  | O (1440×900) |
| `step04-propulsion-08-run1-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 1)(propulsion) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-propulsion-08-run1-result-judge-question@1428x800.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 1)(propulsion) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1428×800) |
| `step04-propulsion-09-view-tab-signal-graph.png` | STEP04 결과 관점 · 신호 그래프(모니터링)(propulsion) | '모니터링' 탭 | 정상 점선 vs 이번 실선 비교 | 중앙 그래프 영역 |  | O (1440×900) |
| `step04-propulsion-10-view-tab-controller-io.png` | STEP04 결과 관점 · 제어기 I/O(propulsion) | '제어기 I/O 통합 시험' 탭 | 제어기 입출력 연결 보기 | 중앙 E/E 시각화 | 탭 전환은 시험 수준 선택과 같은 버튼이라 '보기'와 '수준 선택'이 섞임 | O (1440×900) |
| `step04-propulsion-11-view-tab-system.png` | STEP04 결과 관점 · 시스템 통합(주행 시뮬레이션)(propulsion) | '시스템 통합 시험' 탭 | 차량 주행 시각화 보기 | 중앙 3D 주행 화면 | 하단에 '비교 방식' 설명 칩이 얹힘. 하늘색 띠는 없음 | O (1440×900) |
| `step04-propulsion-12-view-tab-sw-unit.png` | STEP04 결과 관점 · SW 로직(propulsion) | 'SW 단위 시험' 탭 | SW 블록 흐름 보기 | 중앙 SW 블록 |  | O (1440×900) |
| `step04-propulsion-13-run2-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 2)(propulsion) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-propulsion-14-run3-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 3)(propulsion) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-propulsion-15-final-cause-selection.png` | STEP04 최종 원인 선택(propulsion) | 모든 가설 판정 후 | 원인 카드 2~3장 중 선택(폴라로이드) | 중앙 원인 카드(폴라로이드 + 카테고리 태그) | 원인 카드 폴라로이드 안 글자가 작음. 상단 보고서 영역과 원인 카드의 정보가 일부 중복 | O (1440×900) |
| `step04-propulsion-15-final-cause-selection@1428x800.png` | STEP04 최종 원인 선택(propulsion) | 모든 가설 판정 후 | 원인 카드 2~3장 중 선택(폴라로이드) | 중앙 원인 카드(폴라로이드 + 카테고리 태그) | 원인 카드 폴라로이드 안 글자가 작음. 상단 보고서 영역과 원인 카드의 정보가 일부 중복 | O (1428×800) |
| `step04-propulsion-16-ab-comparison-question.png` | STEP04 A/B 비교 · 실행 질문(propulsion) | 원인 선택 후 | '▶ 두 모델 동시 실행' | 하단 dock + 중앙 두 화면 | A/B와 재시험이 같은 차량 수준 신호를 비교(중복 인상) | O (1440×900) |
| `step04-propulsion-17-ab-comparison-result-after-run.png` | STEP04 A/B 비교 · 실행 후(propulsion) | 두 모델 실행 후 | 그래프/결과 탭 확인 | 중앙 두 3D 화면 + 우측 결과 표 |  | O (1440×900) |
| `step04-propulsion-17-ab-comparison-result-after-run@1428x800.png` | STEP04 A/B 비교 · 실행 후(propulsion) | 두 모델 실행 후 | 그래프/결과 탭 확인 | 중앙 두 3D 화면 + 우측 결과 표 |  | O (1428×800) |
| `step04-propulsion-18-ab-comparison-conclusion-next-button.png` | STEP04 A/B 비교 · 결론(propulsion) | 실행 완료 후 | '수리 방법 고르기 →' | 하단 dock | '정상 vs 원인 제거' 결과가 재시험과 같은 표·문구 구조 | O (1440×900) |
| `step04-propulsion-19-repair-method-selection.png` | STEP04 수리 방법 선택(propulsion) | A/B 후 | 수리 카드 3장 중 선택 | 중앙 수리 카드 | 오답 수리(증상 보상)는 설명 후 재선택 | O (1440×900) |
| `step04-propulsion-20-retest-question.png` | STEP04 재시험 · 실행 질문(propulsion) | 수리 선택 후 | '▶ 동일 조건 기준선 비교 실행' | 하단 dock | A/B 실행 버튼과 동일한 구조·문구 반복 | O (1440×900) |
| `step04-propulsion-21-retest-result.png` | STEP04 재시험 · 실행 후(propulsion) | 재시험 실행 후 | 정상 범위 확인 | 우측 결과 표('정상 기준선/수정 후') + 중앙 3D | A/B 결과와 값이 같음(둘 다 fixed=정상과 동일 계산) | O (1440×900) |
| `step04-propulsion-21-retest-result@1428x800.png` | STEP04 재시험 · 실행 후(propulsion) | 재시험 실행 후 | 정상 범위 확인 | 우측 결과 표('정상 기준선/수정 후') + 중앙 3D | A/B 결과와 값이 같음(둘 다 fixed=정상과 동일 계산) | O (1428×800) |
| `step04-propulsion-22-done-retest-pass-return-button.png` | STEP04 완료(propulsion) | 재시험 PASS 후 | '수리 적용 · 주행 복귀' / '다시 풀기' | 우하단 진행 버튼 | 완료 피드백이 고양이 한 줄('정상 범위를 확인했어요') | O (1440×900) |
| `step04-propulsion-22-done-retest-pass-return-button@1428x800.png` | STEP04 완료(propulsion) | 재시험 PASS 후 | '수리 적용 · 주행 복귀' / '다시 풀기' | 우하단 진행 버튼 | 완료 피드백이 고양이 한 줄('정상 범위를 확인했어요') | O (1428×800) |
| `step04-propulsion-23-replay-confirm-popup.png` | STEP04 다시 풀기 확인 팝업(propulsion) | '다시 풀기' 클릭 | 취소 / 다시 풀기 | 중앙 팝업 |  | O (1440×900) |
| `step04-propulsion-wrong-cause-ab-mismatch-result.png` | STEP04 오답 피드백 · 오답 원인으로 A/B 비교(propulsion) | 최종 원인에서 오답 카드 선택 후 두 모델 실행 | '정상과 다름' 확인 → 최종 원인 다시 고르기 | 중앙 두 모델 비교 + 결과 표 | 오답 원인은 A/B에서 불일치로 드러남(원인 제거 모델이 정상과 다름) | O (1440×900) |
| `step04-propulsion-wrong-hypothesis-verdict-feedback.png` | STEP04 오답 피드백 · 가설 판정 오답(propulsion) | 가설 판정에서 일부러 오답 선택 | 피드백 읽고 다시 판정 | 중앙 '오답' 도장 + 하단 질문 줄 + 고양이 줄 | '오답' 도장이 시험 수준 탭·결과 표를 덮음. 같은 피드백 문장이 질문 줄 부가문과 고양이 줄에서 2~3회 반복됨 | O (1440×900) |
| `step04-propulsion-wrong-repair-method-feedback.png` | STEP04 오답 피드백 · 수리 방법 오답(propulsion) | 수리 카드에서 증상 보상 카드 선택 | 설명 읽고 올바른 수리 재선택 | 중앙 수리 카드 + 오답 도장 |  | O (1440×900) |
| `step04-thermal-01-stage-intro-modal.png` | STEP04 안내 모달(thermal) | STEP03 설계서 확정 후 | 4줄 안내 후 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `step04-thermal-02-level-pick-question.png` | STEP04 가설 시험 · 시험 수준 선택(thermal) | 첫 가설 | 시험 수준 3개 중 선택(SW 단위/제어기 I/O 통합/시스템 통합) | 중앙 시험 카드 3장 + 판단 기준 카드 | 시험 수준 이름이 탭과 데이터에서 다름(감사 3.1). 상단 정보 바 5단계 로드맵이 9.5px | O (1440×900) |
| `step04-thermal-03-materials-check-question.png` | STEP04 가설 시험 · 자료 확인(thermal) | 시험 수준 선택 후 | STEP02 로그·STEP03 설계서 칩 열기 | 상단 자료 칩 2개 + 하단 dock | 자료를 모두 열어야 다음으로 진행 | O (1440×900) |
| `step04-thermal-04-materials-popup-step02-log-step03-contract.png` | STEP04 자료 팝업(thermal) | 자료 칩 클릭 | STEP02 기록/STEP03 설계서 읽기 | 중앙 팝업 | 구동에서 STEP02 로그는 '기록 없음'일 수 있음(QA 진입) | O (1440×900) |
| `step04-thermal-05-input-condition-choice.png` | STEP04 가설 시험 · 입력 조건 선택(thermal) | 자료 확인 후 | 입력 카드 3~4장 중 선택 | 중앙 입력 카드 영역 | 카드 4장이 1428×800에서 꽉 참. 질문 부가문이 '관찰 신호를 비교'라고 하나 카드에 관찰 신호 줄 없음(감사 6.3) | O (1440×900) |
| `step04-thermal-06-run-question.png` | STEP04 가설 시험 · 실행 질문(thermal) | 입력 선택 후 | '▶ 시험 실행' / '입력 조건 바꾸기' | 하단 dock |  | O (1440×900) |
| `step04-thermal-07-run1-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 1)(thermal) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-thermal-08-view-tab-signal-graph.png` | STEP04 결과 관점 · 신호 그래프(모니터링)(thermal) | '모니터링' 탭 | 정상 점선 vs 이번 실선 비교 | 중앙 그래프 영역 |  | O (1440×900) |
| `step04-thermal-09-view-tab-controller-io.png` | STEP04 결과 관점 · 제어기 I/O(thermal) | '제어기 I/O 통합 시험' 탭 | 제어기 입출력 연결 보기 | 중앙 E/E 시각화 | 탭 전환은 시험 수준 선택과 같은 버튼이라 '보기'와 '수준 선택'이 섞임 | O (1440×900) |
| `step04-thermal-10-view-tab-system.png` | STEP04 결과 관점 · 시스템 통합(주행 시뮬레이션)(thermal) | '시스템 통합 시험' 탭 | 차량 주행 시각화 보기 | 중앙 3D 주행 화면 | 하단에 '비교 방식' 설명 칩이 얹힘. 하늘색 띠는 없음 | O (1440×900) |
| `step04-thermal-11-view-tab-sw-unit.png` | STEP04 결과 관점 · SW 로직(thermal) | 'SW 단위 시험' 탭 | SW 블록 흐름 보기 | 중앙 SW 블록 |  | O (1440×900) |
| `step04-thermal-12-run2-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 2)(thermal) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-thermal-13-run3-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 3)(thermal) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-thermal-14-run4-result-judge-question.png` | STEP04 가설 시험 · 시험 결과 및 가설 판정(실행 4)(thermal) | 시험 실행 후 | 가설 지지 / 가설 반박 / 판단 보류 선택 | 우측 시험 결과 표 + 하단 dock 3버튼 | 질문(하단 66px)과 결과(우측)가 떨어져 있음. 결과 표 글자 8.8px. 고양이 줄 3번째 줄이 하단에서 잘림. 주행 화면은 하단 띠 없이 프레임을 가득 채움(하늘색 박스 미재현) | O (1440×900) |
| `step04-thermal-15-final-cause-selection.png` | STEP04 최종 원인 선택(thermal) | 모든 가설 판정 후 | 원인 카드 2~3장 중 선택(폴라로이드) | 중앙 원인 카드(폴라로이드 + 카테고리 태그) | 원인 카드 폴라로이드 안 글자가 작음. 상단 보고서 영역과 원인 카드의 정보가 일부 중복 | O (1440×900) |
| `step04-thermal-16-ab-comparison-question.png` | STEP04 A/B 비교 · 실행 질문(thermal) | 원인 선택 후 | '▶ 두 모델 동시 실행' | 하단 dock + 중앙 두 화면 | A/B와 재시험이 같은 차량 수준 신호를 비교(중복 인상) | O (1440×900) |
| `step04-thermal-17-ab-comparison-result-after-run.png` | STEP04 A/B 비교 · 실행 후(thermal) | 두 모델 실행 후 | 그래프/결과 탭 확인 | 중앙 두 3D 화면 + 우측 결과 표 |  | O (1440×900) |
| `step04-thermal-18-ab-comparison-conclusion-next-button.png` | STEP04 A/B 비교 · 결론(thermal) | 실행 완료 후 | '수리 방법 고르기 →' | 하단 dock | '정상 vs 원인 제거' 결과가 재시험과 같은 표·문구 구조 | O (1440×900) |
| `step04-thermal-19-repair-method-selection.png` | STEP04 수리 방법 선택(thermal) | A/B 후 | 수리 카드 3장 중 선택 | 중앙 수리 카드 | 오답 수리(증상 보상)는 설명 후 재선택 | O (1440×900) |
| `step04-thermal-20-retest-question.png` | STEP04 재시험 · 실행 질문(thermal) | 수리 선택 후 | '▶ 동일 조건 기준선 비교 실행' | 하단 dock | A/B 실행 버튼과 동일한 구조·문구 반복 | O (1440×900) |
| `step04-thermal-21-retest-result.png` | STEP04 재시험 · 실행 후(thermal) | 재시험 실행 후 | 정상 범위 확인 | 우측 결과 표('정상 기준선/수정 후') + 중앙 3D | A/B 결과와 값이 같음(둘 다 fixed=정상과 동일 계산) | O (1440×900) |
| `step04-thermal-22-done-retest-pass-return-button.png` | STEP04 완료(thermal) | 재시험 PASS 후 | '수리 적용 · 주행 복귀' / '다시 풀기' | 우하단 진행 버튼 | 완료 피드백이 고양이 한 줄('정상 범위를 확인했어요') | O (1440×900) |
| `step04-thermal-23-replay-confirm-popup.png` | STEP04 다시 풀기 확인 팝업(thermal) | '다시 풀기' 클릭 | 취소 / 다시 풀기 | 중앙 팝업 |  | O (1440×900) |

### 06 · 해적선·엔딩·체포  (`06-ending/`, 16장)

| 파일 | 단계·화면 | 진입 조건 | 질문·행동 | 핵심 조작 영역 | UI 문제·특이사항 | 캡처 |
|---|---|---|---|---|---|---|
| `caught-analysis-report-expanded.png` | 체포 · 분석 보고서 펼침 시도 | '고장 분석 보고서' 클릭 | 보고서 보기 | 우측 패널 | 체포 화면에는 펼치기 요소가 없어 변화 없음(캡처로 확인) | O (1440×900) |
| `caught-arrest-record-mugshot.png` | 체포 기록(CAUGHT) | 추격차 0m(실제 플레이로 도달) | '잡힌 지점부터 다시 →' / '처음으로' | 우측 사건 개요 + 하단 버튼 | 머그샷+사건 개요 구조. 두 사건 해결 후 체포 시 추격차 0 표시 | O (1440×900) |
| `caught-arrest-record-mugshot@1428x800.png` | 체포 기록(CAUGHT) | 추격차 0m(실제 플레이로 도달) | '잡힌 지점부터 다시 →' / '처음으로' | 우측 사건 개요 + 하단 버튼 | 머그샷+사건 개요 구조. 두 사건 해결 후 체포 시 추격차 0 표시 | O (1428×800) |
| `ending-wanted-1of3-safety-view-toggle.png` | 엔딩 WANTED 1/3 · 안전 관점 보기 | '안전 관점' 토글 | 관점 전환 | 우측 기록 칸 상단 토글 |  | O (1440×900) |
| `ending-wanted-1of3.png` | 엔딩 WANTED 분석 보고서 1/3 | 갑판 정차 후 약 3초 | '다음 →'로 사건 파일 넘김 | 우측 사건 기록 칸 | 개발 진입(QA)은 이번 세션 기록이 없어 '기록이 남아 있지 않음'으로 표시될 수 있음. 실제 플레이 완주 경로로 캡처 | O (1440×900) |
| `ending-wanted-1of3@1428x800.png` | 엔딩 WANTED 분석 보고서 1/3 | 갑판 정차 후 약 3초 | '다음 →'로 사건 파일 넘김 | 우측 사건 기록 칸 | 개발 진입(QA)은 이번 세션 기록이 없어 '기록이 남아 있지 않음'으로 표시될 수 있음. 실제 플레이 완주 경로로 캡처 | O (1428×800) |
| `ending-wanted-2of3.png` | 엔딩 WANTED 분석 보고서 2/3 | 다음 → | STEP02·03 기록 복습 | 우측 사건 기록 칸 |  | O (1440×900) |
| `ending-wanted-3of3.png` | 엔딩 WANTED 분석 보고서 3/3 | 다음 → | STEP04·수리 기록, 새 사건 시작/메인 메뉴 | 하단 버튼 |  | O (1440×900) |
| `ending-wanted-analysis-report-expanded.png` | 엔딩 · 고장 분석 보고서 펼침 | '고장 분석 보고서' 클릭 | 보고서 읽기 | 우측 보고서 패널 | 내부 ID가 노출될 수 있음(감사 2.8) | O (1440×900) |
| `ship-escape-after-intro-gear-d.png` | 해적선 구간 · 출발 | 모달 후 D단 | 램프까지 직진 | 전체 3D + 하단 키캡 |  | O (1440×900) |
| `ship-escape-camera-orbit-cat-cheer-1.png` | 해적선 · 카메라 회전(1) | 정차 후 약 1.2초 | 연출 관찰 | 전체 3D | 고양이 얼굴 연출 시간은 약 3초(확대 요청 사항) | O (1440×900) |
| `ship-escape-camera-orbit-cat-cheer-2.png` | 해적선 · 카메라 회전(2) · 고양이 만세 | 정차 후 약 2.7초 | 연출 관찰 | 전체 3D |  | O (1440×900) |
| `ship-escape-deck-landing-auto-brake.png` | 해적선 갑판 착지 · 자동 감속 | 램프 통과 | 네 바퀴 착지 확인 | 상단 안내 카드 |  | O (1440×900) |
| `ship-escape-deck-stopped-fireworks-0.png` | 해적선 갑판 정차 · 폭죽 시작 | 정차 직후 | 연출 관찰 | 전체 3D + 폭죽 오버레이 | 정차 안내 카드가 연출 중에도 화면에 남음 | O (1440×900) |
| `ship-escape-intro-modal.png` | 해적선 도주 안내 모달 | 열관리 수리 후 1050m 또는 QA SHIP_ESCAPE | 안내 읽고 풀기(Enter) | 중앙 모달 |  | O (1440×900) |
| `ship-escape-ramp-approach.png` | 해적선 램프 접근 | ~1200m | 중앙 유도로 램프 진입 | 상단 안내 카드 |  | O (1440×900) |

### 07 · 공통 팝업·특수 상태  (`07-common/`, 3장)

| 파일 | 단계·화면 | 진입 조건 | 질문·행동 | 핵심 조작 영역 | UI 문제·특이사항 | 캡처 |
|---|---|---|---|---|---|---|
| `pause-menu-popup.png` | 일시정지 메뉴 | 주행 중 Esc | 계속하기(ESC) / 처음으로 돌아가기 | 중앙 팝업 | 자동 저장 안내 문구 포함 | O (1440×900) |
| `step02-open-book-panel.png` | 오픈북 패널(STEP02) | STEP02 우측 '오픈북' | 정상 동작 확인 후 닫기 | 중앙 패널 | 정비소에서 본 정상 동작을 복습하는 카드. 화면 대부분을 덮음 | O (1440×900) |
| `step04-error-contract-missing-qa-entry.png` | STEP04 · 시험 계약 없음 오류 상태(QA 직접 진입) | ?qa=TWIN_BENCH(STEP03 계약 없이) | 'STEP03에서 테스트 설계서 다시 발급' | 상단 오류 카드 | 정상 플레이에서는 STEP03을 거치므로 나오지 않는 상태. 오류 시 '다음' 흐름 안내가 고양이 줄에만 있음 | O (1440×900) |
