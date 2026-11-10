# SCENARIO_AUTHORING_TEMPLATE — 신규 고장 시나리오 작성 규격 (D-2)

- 근거: D-1 원문 추출(`D1_*.md`), A/B/C 감사, 최신 SSOT. **코드·SSOT는 수정하지 않음.**
- 필드 수: 총 123 (AS-IS 100 / TO-BE 14 / PROPOSED 9)
- **구분(반드시 구분해서 읽을 것)**
  - **AS-IS**: 현재 코드에 실제로 있는 데이터 필드. 코드 위치 열이 실제 소스.
  - **TO-BE**: SSOT가 요구하지만 아직 없거나 부분 구현인 데이터. 현재 값으로 취급 금지.
  - **PROPOSED**: 구현에 필요해 보이나 확정되지 않은 제안(SSOT 요구 아님 또는 SSOT 근거 불충분).
- **요구 구분**: 필수 / 선택 / 공통(사건마다 입력하지 않음) / 자동(다른 입력에서 계산) / 필수(예정)=TO-BE 필수.
- **중요**: AS-IS 필드라도 **신규 CaseId 추가는 데이터만으로 불가**(코드 수정 필요 — C8). 아래 "코드 수정 필요 필드"는 `코드` 유형.
- 수치 리터럴(숫자)은 D-1의 문자열 추출에 없으므로, 사건별 원본 값은 `D3_<사건>.md`의 소스 원문 블록(verbatim)을 본다.

## 작성 방법
1. 아래 "작성 양식"을 복사해 `[카테고리]: 내용` 한 줄씩 채운다. 리스트 항목은 `[카테고리 n]` 형태로 번호를 붙인다.
2. 값은 **실제 모델·코드 변수와 일치**해야 하는 항목(신호 id·단위·수치)을 `코드 필드` 열에서 확인한다.
3. 필드 상태가 TO-BE/PROPOSED이면 내용은 `(미구현)`으로 비워 두거나 설계 의도만 쓴다 — 현재 게임에 반영된다고 쓰지 않는다.

## 필드 정의표

### M. 사건 메타

| ID | [카테고리] | 상태 | 요구 | 자료형 | 단위·허용값 | 코드 필드 | SSOT ID | 비고 |
|---|---|---|---|---|---|---|---|---|
| M01 | [사건 ID] | **AS-IS** | 필수 | string(CaseId) | propulsion \| thermal \| brake (닫힌 유니온 — 신규 ID는 코드 수정) | `runtime.ts:CaseId` | H-8.1·H-8.2 | 모든 `Record<CaseId,…>`의 키 |
| M02 | [사건 제목] | **AS-IS** | 필수 | string | 한 줄, 해요체/명사형(증상 서술, 원인 비공개) | `scenarios.ts:SCENARIOS[id].title` | UI-RULE-01(제목 아님)·L-3 |  |
| M03 | [챕터 라벨] | **AS-IS** | 필수 | string | `사건 N · 짧은 제목` 또는 `선택 사건 · …` | `scenarios.ts:SCENARIOS[id].chapter` |  | 엔딩 WANTED가 `사건`→`CASE`로 치환해 사용 |
| M04 | [도메인(표시명)] | **AS-IS** | 필수 | string | 구동 \| 열관리 \| 제동 (표시 한글명; STEP01 DomainId와 별개) | `scenarios.ts:SCENARIO_META[id].domain` | K-3·L-3 |  |
| M05 | [교육 목표] | **AS-IS** | 필수 | string | 1문장 | `scenarios.ts:SCENARIO_META[id].goal` | H-3·H-9 |  |
| M06 | [필수/선택 사건] | **AS-IS** | 필수 | enum | implemented \| optional | `scenarios.ts:SCENARIO_META[id].status` | FB-P1-06 | 실제 필수 사건 판정은 코드 하드코딩(`REQUIRED_CASES`, `escapeUnlocked`, `completedCases`) |
| M07 | [검수 메모] | **AS-IS** | 선택 | string | 자유 | `scenarios.ts:SCENARIO_META[id].review` | H-8.6 |  |
| M08 | [SW 근본 원인 분류] | **AS-IS** | 필수 | string | 현재 값은 자유 문장. TO-BE 허용 분류: 제어 로직/상태 · 계산·보정 · 스케일링 · 통신 처리 · ECU SW 인터페이스 · 주기·타이밍 · 예외·제한 조건 | `ui/CaseFileEnding.tsx:CATEGORY[id]` | L-3.1~3.3 | 허용값 목록은 SSOT L-3.1에서 옴 → 열거형으로 강제하는 코드 없음 |
| M09 | [근본 원인(주입) 서술] | **AS-IS** | 필수 | string | SW 경계 안의 결함 위치 + 코드 변수명 | `scenarios.ts:SCENARIO_META[id].injection` | L-3.1·H-5.E | HW 단독 원인 금지(L-3.2) |
| M10 | [고장 모델 수치 요약] | **AS-IS** | 필수 | string | `입력 → 중간값 → 출력` 화살표 한 줄 | `scenarios.ts:SCENARIO_META[id].faultModel` | H-5.E | 모델 코드의 수치와 일치해야 함(D-4 참조) |
| M11 | [정상 사양] | **AS-IS** | 필수 | string | 요구사항 문장(값·단위 포함) | `scenarios.ts:SCENARIO_META[id].normalSpec` | K-6.3 |  |
| M12 | [수리 방법] | **AS-IS** | 필수 | string ×2 | `SCENARIOS.repair`(레거시) + `META.fix` | `scenarios.ts:SCENARIOS[id].repair / SCENARIO_META[id].fix` | FB-P1-07 |  |
| M13 | [회귀(재시험) 기준] | **AS-IS** | 필수 | string | 같은 시험 PASS + 영향 범위 신호 | `scenarios.ts:SCENARIO_META[id].regression` | H-5.H |  |
| M14 | [레거시 정답 id] | **AS-IS** | 필수 | string | `SCENARIOS[id].root` — META 가설 id와 다름 | `scenarios.ts:SCENARIOS[id].root` | L-4.3 | `SCENARIO_META.hypotheses[].truth`와 이중 관리(C 감사) |
| M15 | [저장 호환 프로그램 id] | **AS-IS** | 필수 | string | 초기 `underreport_45pct`/`open_loop_fan`/`friction_only` → 수리 후 `nominal`/`thermal_closed_loop`/`blended_brake` | `runtime.ts:initialCampaign.program, VerificationLab.pickFix, RefPuzzle REF.program` | N-01 |  |
| M16 | [선행 사건·사건 순서·해금] | **PROPOSED** | 선택 | CaseId[] | (현재 없음 — thermal 트리거가 `caseId==='propulsion'`에 코드로 의존) | `(신규) SCENARIO_META[id].requires` | H-8.1 | FB-P2-02 확장 시 필요 추정 |

### S1. STEP01 연계 · 주행 증상 · 고장 발동

| ID | [카테고리] | 상태 | 요구 | 자료형 | 단위·허용값 | 코드 필드 | SSOT ID | 비고 |
|---|---|---|---|---|---|---|---|---|
| S101 | [차량 도메인 ID(STEP01)] | **AS-IS** | 필수 | string(DomainId) | drive \| brake \| steer \| gear \| power \| thermal \| suspension | `experiences.tsx:DomainId, domainContent[id]` | M-01·K-4 | 사건과 STEP01 도메인 매핑 테이블은 **코드에 없음**(BOOK의 domain 필드로만 연결) |
| S102 | [차고 노트(오픈북) 카드] | **AS-IS** | 선택 | {domain,feature,name,req}[] | feature=기능 인덱스(number), req=요구사항 문장 | `OpenBook.tsx:BOOK[id]` | B-9·L-7 | 정답 비공개 검수 필요 |
| S103 | [운전자 증상 한 줄] | **AS-IS** | 필수 | string | 경고등·체감 서술만, 원인 비공개 | `scenarios.ts:SCENARIOS[id].symptom` | M-3 |  |
| S104 | [발생 트리거 설명] | **AS-IS** | 필수 | string | 설명용 문자열 — **동작에 연결되지 않음** | `scenarios.ts:SCENARIO_META[id].trigger` | FB-P2-02 |  |
| S105 | [레이스 발동 구간(거리)] | **AS-IS** | 필수 | number[2] (m) | 코드 상수 `OVERTAKE_ZONE=[150,330]`, `CLIMB_ZONE=[760,960]` | `experiences.tsx:OVERTAKE_ZONE/CLIMB_ZONE` | L-3.3 | **데이터가 아니라 코드 상수** → 신규 사건은 코드 수정 |
| S106 | [상태 기반 발생 전제조건] | **PROPOSED** | 선택 | {ready,gear,speedKmh,pedalPct,heldSeconds,distanceM,stoppedSeconds} | READY/기어(P·R·N·D)/속도 km/h/페달 %/시간 s/거리 m 중 필요한 항목만 | `(신규) SCENARIO_META[id].triggerCondition` | FB-P2-02·H-8.5 | 현재는 거리·가속 누적만 사용 |
| S107 | [레이스 증상 연출 규칙] | **AS-IS** | 필수 | 코드 | 속도 증가량 ×0.45 · 상한 55 km/h 등 | `experiences.tsx:RaceExperience (1721-1728, 1797-1799)` | A-1.6·M-3 | 연출임(simModel 토크 모델과 연결 없음) |
| S108 | [고장 발동 조건(코드)] | **AS-IS** | 필수 | 코드 | `FAULT_CUE` 이벤트 전송 조건 | `experiences.tsx:RaceExperience (1840-1845)` |  |  |
| S109 | [운전자 고장 대사] | **AS-IS** | 필수 | string | 사건별 1줄 | `experiences.tsx:FaultDialogue.DRIVER_LINE[id]` | G-4.3 | 말투 규칙 미충족 가능(D-4) |
| S110 | [엔지니어 대사] | **AS-IS** | 공통 | string | 사건 무관 1줄 | `experiences.tsx:FaultDialogue.dialogue[1]` |  |  |
| S111 | [경고등 표시] | **AS-IS** | 필수 | {label,note} | label 짧은 명칭, note 부연 | `EeTrace.tsx:LAMP[id]` | M-3 |  |
| S112 | [관찰 가능한 증상 4종] | **AS-IS** | 필수 | {icon,label,value}[] | icon ∈ detective\|warning\|clipboard\|road | `EeTrace.tsx:OBSERVED[id]` | K-5.1 |  |
| S113 | [주행 구간 안내·존 표지] | **AS-IS** | 선택 | string | 코드 내 문구(`.raceFeed`) | `experiences.tsx:RaceExperience 구간 표지` | G-4 | 신규 사건은 코드에 문구 추가 |
| S114 | [수리 후 체크포인트·격차 하한·복귀 장면] | **AS-IS** | 필수 | 코드 | propulsion→harbor_entry/105 m, thermal→dock_approach/115 m, brake→SHIP_ESCAPE/65 m | `runtime.ts:APPLY_REPAIR` | P0-B |  |
| S115 | [재주행 회귀 조건] | **AS-IS** | 선택 | 코드 | propulsion 풀가속 1.5 s, thermal 지속 가속 2 s | `experiences.tsx:RaceExperience regression effect` | FB-P1-07 | STEP04 동일 조건 비교와 역할 중복(A3 #8) |

### S2. STEP02 원인 역추적 (도미노·증거·가설)

| ID | [카테고리] | 상태 | 요구 | 자료형 | 단위·허용값 | 코드 필드 | SSOT ID | 비고 |
|---|---|---|---|---|---|---|---|---|
| S201 | [증거 카드 ID] | **AS-IS** | 필수 | string | 영문 소문자_밑줄 — 증거 이미지 파일명 키 | `scenarios.ts:SCENARIOS[id].evidence[].id` | K-5.1 |  |
| S202 | [증거 라벨] | **AS-IS** | 필수 | string | 관찰된 사실 1문장 | `…evidence[].label` | K-5.2 |  |
| S203 | [증거 값] | **AS-IS** | 필수 | string | 측정값+단위 또는 상태 | `…evidence[].value` | K-5.1 |  |
| S204 | [증거 종류] | **AS-IS** | 필수 | string | 주행 현상 \| 입력 계측 \| 제어 명령 \| 물리 응답 \| 상태 계측 | `…evidence[].kind` | K-5.2 | 허용값은 현재 데이터에서 관찰된 값 5종(코드 열거형 없음) |
| S205 | [증거 이미지] | **AS-IS** | 필수 | 파일 | `public/assets/board-photos/<증거id>.png`, 부품 컷아웃 `ending-thumbs/<부품id>.png` | `DominoTrace.tsx:B()/E()` | G-17·CLAUDE.md | 증거 id별 이미지 필수; `image-prompts.test.mjs`가 프롬프트 누락 검사 |
| S206 | [도미노 시작 노드(출력 증상)] | **AS-IS** | 필수 | string(dom id) | doms[].id 중 하나 | `DominoTrace.tsx:CASES[id].start` | K-5.1 |  |
| S207 | [최초 어긋남 노드] | **AS-IS** | 필수 | string(dom id) | doms[].id 중 하나, 입력이 모두 정상 | `CASES[id].first` | K-5.1·K-5.4 |  |
| S208 | [시간 단위] | **AS-IS** | 필수 | string | ms \| s 등 | `CASES[id].timeUnit` | K-5.3 |  |
| S209 | [요구사항 문장(STEP02)] | **AS-IS** | 필수 | string | `요구사항: …` 한 문장, 값·단위 포함 | `CASES[id].req` | K-5.3 |  |
| S210 | [도미노 노드 식별·표시] | **AS-IS** | 필수 | {id,label,img} | id=snake_case, label=짧은 명사구, img=에셋 경로 | `CASES[id].doms[]` | K-5.2 |  |
| S211 | [노드 구역] | **AS-IS** | 필수 | enum | 센서 \| 제어기 \| CAN \| 부품 \| 차량 | `doms[].zone (Zone)` | K-5.2 |  |
| S212 | [기준값·이번 값·단위] | **AS-IS** | 필수 | number|string + string | ref/run 숫자 또는 문자, unit 문자열 | `doms[].ref / run / unit` | K-5.1 | simModel 수치와 일치 검증 필요(D-4) |
| S213 | [노드 상태] | **AS-IS** | 필수 | enum | ok \| tol \| bad | `doms[].status` | K-5.1 |  |
| S214 | [달라진 시각 t] | **AS-IS** | 필수 | number (timeUnit) | 작을수록 먼저. 최초 어긋남 노드가 최소, 함정(결과)은 더 큼 | `doms[].t` | K-5.1·K-5.4 | 원인 vs 함정 판별 근거 |
| S215 | [역추적 간선(원인 후보)] | **AS-IS** | 필수 | string[](dom id) | 자기보다 상류 노드 id | `doms[].causes` | K-5.1 | 측정으로 확실히 배제되는 후보만(CLAUDE.md 라운드 11) |
| S216 | [노드→증거 연결] | **AS-IS** | 선택 | string(evidence id) | SCENARIOS evidence id | `doms[].ev` | K-5.2 |  |
| S217 | [확대 보기(zoom)] | **AS-IS** | 선택 | {where,kind,reference[],run[],part?,culprit,lesson} | kind ∈ sw\|hw | `CaseData.zoom` | L-4.1 | EeTraceV2에서의 사용 여부 [미확인] |
| S218 | [의심 구간 이름·선택지] | **AS-IS** | 필수 | {name, choices[{label,ok,why}]} | choices 3개, ok=true 정확히 1개 | `CaseData.section` | K-5.4·L-4.3 | 정답이 `ok` 플래그로 데이터에 있음 |
| S219 | [가설 목록(레거시)] | **AS-IS** | 필수 | {id,label,desc}[] | 3~4개 | `SCENARIOS[id].hypotheses` | L-4.3 | HW 가설 포함 가능(반박용) |
| S220 | [가설 목록(META)] | **AS-IS** | 필수 | {id,label,truth,stage1?,rules[]}[] | truth=true 정확히 1개 | `SCENARIO_META[id].hypotheses` | L-4.3·K-7.7 |  |
| S221 | [가설 1단계 반박 근거] | **AS-IS** | 선택 | string | 있으면 STEP02에서 `배제`가 정답, 없으면 `보류` | `hypotheses[].stage1` | L-4.3 | 정답 판정 키를 겸함 |
| S222 | [가설 판정 규칙] | **AS-IS** | 필수 | {levels?,need{신호:Obs[]},verdict,why}[] | Obs ∈ same\|higher\|lower · levels ∈ unit\|swint\|embedded\|vehicle · verdict ∈ supported\|refuted | `hypotheses[].rules` | K-7.5·K-7.7 | 신호 id는 simModel VIEW의 id와 일치해야 함 |
| S223 | [고장 당시 입력 재생 라벨] | **AS-IS** | 필수 | string | `… 기록` | `EeTrace.tsx:REPLAY[id]` | K-5.3 |  |
| S224 | [부분 확대(SUBSYS)] | **AS-IS** | 선택 | {where,inLabel,outLabel,stages[]} | stages 3개 | `EeTrace.tsx:SUBSYS[id]` | L-4.1 |  |
| S225 | [말풍선 인용] | **AS-IS** | 선택 | string |  | `EeTrace.tsx:QUOTE` |  | 키 구조 [미확인] |
| S226 | [영향 목록(회귀 후보)] | **AS-IS** | 자동 | string[] | 추적 경로 + 오답으로 짚은 함정에서 자동 생성 → sessionStorage `tb-impact-<id>` | `EeTrace.tsx:finish` | FB-P1-07 | 입력 항목 아님 |
| S227 | [Hover 정상·이상 짧은 설명] | **TO-BE** | 필수(예정) | {normal,abnormal} | 카드별 1문장씩 | `(신규)` | L-4.2·M-4 | 현재 구현 없음 |
| S228 | [후보 STACK·정오 근거] | **TO-BE** | 필수(예정) | 미정 |  | `(신규)` | L-4.2 | 현재 구현 없음 |
| S229 | [자유 실 연결 규칙] | **TO-BE** | 선택 | 미정 |  | `(신규)` | K-5.3·A-2.5 |  |
| S230 | [미측정 증거 생성 금지 검수] | **PROPOSED** | 자동 | 검증기 | 모든 evidence/dom 값이 simModel 또는 명시 측정에서 도출되는지 | `(신규) validator` | H-8.5·M-6.5 |  |

### S3. STEP03 로직 퍼즐 · 시험 계약

| ID | [카테고리] | 상태 | 요구 | 자료형 | 단위·허용값 | 코드 필드 | SSOT ID | 비고 |
|---|---|---|---|---|---|---|---|---|
| S301 | [퍼즐 도메인·기능·제어기] | **AS-IS** | 필수 | {domain,feature,ecu} | 문자열 | `RefPuzzle.tsx:REF[id]` | K-6.2 |  |
| S302 | [퍼즐 프로그램 id] | **AS-IS** | 필수 | string | COMPILE 이벤트로 저장되는 id | `REF[id].program` | K-6.1 |  |
| S303 | [보드 블록 순서·빈칸·예비] | **AS-IS** | 필수 | {board:id[], gaps:number[], spares:id[], joints:Nub[]} | gaps는 board 인덱스, 연속 ≤2(CLAUDE.md), joints round\|square\|zigzag | `REF[id].board/gaps/spares/joints` | K-6.2·K-6.4 | 함정 조각은 spares에 포함 |
| S304 | [옆 입력(사이드)] | **AS-IS** | 필수 | {pieces,into,value,label} | into=board 인덱스 | `REF[id].side` | K-6.3 |  |
| S305 | [요구사항 줄] | **AS-IS** | 필수 | {text,slot}[] | slot=gaps 순번 | `REF[id].req` | K-6.2·M-05 |  |
| S306 | [블록 정의] | **AS-IS** | 필수 | Record<id,Blk> | Blk={id,label,kind,ee?,spec?,img?,tag?,out?,bad?,why?,from,does?}, kind=Kind\|hw | `REF[id].blocks` | K-6.4·M-05 | `Kind` 열거 값 [미조사] |
| S307 | [현장 기록 값] | **AS-IS** | 선택 | Record<blockId,string> | 기준과 다른 블록만 | `REF[id].field` | K-6.2 |  |
| S308 | [차고 노트 연결] | **AS-IS** | 선택 | {domain,feature,name}[] |  | `REF[id].notes` | B-9 |  |
| S309 | [SW 컴포넌트 범위(검증 뷰)] | **AS-IS** | 필수 | {unit{name,ids[]},swc[{name,ids[]}]} | ids ⊂ REF.blocks | `RefPuzzle.tsx:SCOPE[id]` | M-05 | STEP04 SW 탭과 공유 |
| S310 | [퍼즐 목적 한 줄] | **AS-IS** | 필수 | string | `…하기 위해서예요.` | `RefPuzzle.tsx:WHY[id]` | K-6.4 |  |
| S311 | [리그 목표(시험 가설 요약)] | **AS-IS** | 필수 | string | `A 문제인지, B 문제인지` | `RefPuzzle.tsx:RIG_GOAL[id]` | K-6.5 |  |
| S312 | [요구 사양 문장] | **AS-IS** | 필수 | string | 값·단위·조건 포함 | `RefPuzzle.tsx:SPEC[id].text` | K-6.3 |  |
| S313 | [예시 입력 슬라이더] | **AS-IS** | 선택 | {label,unit,min,max,at} | min<at<max | `SPEC[id].input` | A-1.6·CLAUDE.md(숫자 직접 입력 금지) | brake는 없음 |
| S314 | [기준 확정 기대값] | **AS-IS** | 필수 | string | `입력 → 중간 → 출력` — sessionStorage `tb-expect-<id>` | `SPEC[id].expect` | K-6.5 |  |
| S315 | [액추에이터 반응] | **AS-IS** | 필수 | {id,ok,weak} | id=부품 모델 id(partModels) | `RefPuzzle.tsx:ACTUATOR[id]` | K-4.2 |  |
| S316 | [예시 값 계산(퍼즐 값 흐름)] | **AS-IS** | 필수 | 코드 | `exampleValue()` — propulsion·thermal만 구현, brake는 null | `RefPuzzle.tsx:exampleValue` | K-6.3 | 데이터화 안 됨 → 신규 사건은 코드 수정 |
| S317 | [계약 목적] | **AS-IS** | 필수 | string | `…를 같은 조건에서 구분한다.` | `verificationContract.ts:BASE[id].objective` | K-6.5 |  |
| S318 | [계약 전제 조건] | **AS-IS** | 필수 | string[] | READY/기어/속도/온도/SOC 등 | `BASE[id].preconditions` | K-6.5 | STEP04 simulate 입력과 연결 안 됨(C7) |
| S319 | [계약 자극] | **AS-IS** | 필수 | {label,sequence} |  | `BASE[id].stimulus` | K-6.5 |  |
| S320 | [계약 기대 신호] | **AS-IS** | 필수 | string |  | `BASE[id].expectedSignal` | K-6.5 |  |
| S321 | [계약 관찰 3종] | **AS-IS** | 필수 | {id:input|control|output,label}[3] |  | `BASE[id].observations` | K-6.5 |  |
| S322 | [계약 비교 조건] | **AS-IS** | 필수 | {baseline,sameInput:true,timeAxis,units} |  | `BASE[id].comparison` | K-7.3 |  |
| S323 | [계약 한계] | **AS-IS** | 필수 | string |  | `BASE[id].limitation` | I-2·K-6.5 |  |
| S324 | [계약 자동 필드] | **AS-IS** | 자동 | version,caseId,hypothesisId/Label,suspectSection,expected.value,createdBy | STEP02·03 결과로 자동 채움 | `verificationContract.ts:buildVerificationContract` | K-6.1 |  |
| S325 | [STEP03 소제목 2줄] | **TO-BE** | 자동 | string ×2 | 1줄 행동 + `이전 결과: {…} \| 의심 구간: {…}`(실제 상태값) | `(신규)` | UI-RULE-01·소제목 데이터 계약 |  |
| S326 | [긴 로직 줌 설정] | **TO-BE** | 선택 | 미정 | 현재는 자동 맞춤만 확인 | `RefPuzzle.tsx(fit)` | M-04 |  |
| S327 | [계약 → STEP04 시험 입력 구동] | **PROPOSED** | 선택 | 계약 필드→simulate 인자 매핑 | 현재 STEP04는 `CASE_DERIVS`로 입력 결정 | `(신규)` | K-6.5·H-8.5 |  |

### S4. STEP04 시뮬레이션 · 관찰 · 판정 · 수리 · 재시험

| ID | [카테고리] | 상태 | 요구 | 자료형 | 단위·허용값 | 코드 필드 | SSOT ID | 비고 |
|---|---|---|---|---|---|---|---|---|
| S401 | [볼트 질문] | **AS-IS** | 필수 | {hyp,ask}[] | hyp ∈ META.hypotheses[].id, 2~3개 | `VerificationLab.tsx:QUESTIONS[id]` | M-08·H-7 | 질문 순서가 가설 순서를 고정 |
| S402 | [가설별 판단 기준 문구] | **AS-IS** | 필수 | string | 가설 id 키 | `VerificationLab.tsx:PREDICT[hypId]` | M-11 | 사건 키가 아니라 가설 id 키 |
| S403 | [입력 조건 후보] | **AS-IS** | 필수 | {id,tech,input}[] | id ∈ reqa\|bound\|usecase(타입엔 equiv\|guess도 있음) · tech ∈ req\|replay\|boundary\|soak\|inject | `VerificationLab.tsx:CASE_DERIVS[id]` | K-7.1·H-5.B~D | tech→simModel 모델 분기와 일치해야 함 |
| S404 | [시뮬레이션 모델 함수] | **AS-IS** | 필수 | 코드 | `integrate()` 기반, dt 5 ms, 정상/결함 2회 계산 | `simModel.ts:propulsion/thermal/brake + MODELS` | L-5.2·H-5.E | **데이터가 아닌 코드** — 신규 사건은 함수 추가 |
| S405 | [시뮬 시간·단위] | **AS-IS** | 필수 | [number,string] |  | `simModel.ts:TIME[id]` | K-7.3 |  |
| S406 | [레벨별 관측 신호] | **AS-IS** | 필수 | Record<Lv,{id,name,unit,max,src,model?}[]> | Lv ∈ unit\|swint\|embedded\|vehicle · `model:true`=정상 plant 모델 값 | `simModel.ts:VIEW[id]` | K-7.6·M-6.2 | src는 모델 함수 반환 키와 일치해야 함 |
| S407 | [결함 주입 위치] | **AS-IS** | 필수 | 코드+서술 | 모델 함수 내 `fault ? … : …` 한 곳 + `META.injection` | `simModel.ts / SCENARIO_META.injection` | L-3.1·H-5.E | 최종 출력만 위조 금지 |
| S408 | [권장 시험 레벨] | **AS-IS** | 선택 | {answer:Lv,why} |  | `VerificationLab.tsx:LV_ANSWER[id]` | K-7.5 | live STEP04에서 사용 여부 [미확인] |
| S409 | [최적 비용·근본 신호] | **AS-IS** | 필수 | number / string | 비용: 단위1·SW통합2·임베디드3·시스템5 합 | `BEST_COST[id], ROOT_SIGNAL[id]` | M-6.4 | 별점 계산 기준(자동) |
| S410 | [수리 카드] | **AS-IS** | 필수 | {label,img,ok,why}[3] | ok=true 정확히 1개 | `VerificationLab.tsx:FIXES[id]` | M-11·FB-P1-07 |  |
| S411 | [공통 시험 카드·답 버튼] | **AS-IS** | 공통 | 고정 | TEST_CARD 4레벨·ANSWER_BTN 3종 | `VerificationLab.tsx:TEST_CARD/ANSWER_BTN/LV` | K-7.1 | 사건별 입력 불필요 |
| S412 | [재시험 비교·별점] | **AS-IS** | 자동 | 계산 | `simulate(case,tech,fixed=true)` vs 정상 | `VerificationLab.tsx:TwinBenchExperience` | FB-P1-07 | 수리 선택이 모델에 반영되지 않음(D-4) |
| S413 | [탭별 의문형 관찰 목표] | **TO-BE** | 필수(예정) | string ×4 | SW/제어기 I/O/부품·차량/모니터링 각 1줄, 정답·원인 선공개 금지 | `(신규)` | M-09 | live 위치 미확인 |
| S414 | [관찰 신호 선택 제한] | **TO-BE** | 필수(예정) | {max:number, candidates[]} | legacy `PROBE_LIMIT=3` | `(신규; V7에만 존재)` | M-6.4 장면 2·H-5 |  |
| S415 | [모니터링 데이터 유형] | **TO-BE** | 필수(예정) | enum | continuous \| state \| event (데이터 있을 때만) | `(신규)` | M-10·M-6.3 | 통신 이벤트 로그는 모델에 데이터가 있을 때만(허구 금지) |
| S416 | [수리 카드 근거 연결] | **TO-BE** | 선택 | evidenceId[] |  | `(신규)` | M-6.4 장면 6 |  |
| S417 | [오답 수리 시뮬레이션] | **PROPOSED** | 선택 | fix→fault 매핑 | 현재는 설명문 `why`만 | `(신규)` | H-5.H·I-4 | FIXES.why의 부작용 주장이 모델로 검증되지 않음 |
| S418 | [고객 한 장 요약 카드] | **TO-BE** | 자동 | 7항목 | 증상/선택 가설/결정적 근거/조치/동일 조건 결과/회귀 결과/남은 한계 | `(신규)` | M-6.4 장면 7 |  |

### S5. 재주행 · 엔딩 · 보고서

| ID | [카테고리] | 상태 | 요구 | 자료형 | 단위·허용값 | 코드 필드 | SSOT ID | 비고 |
|---|---|---|---|---|---|---|---|---|
| S501 | [엔딩 신호 체인] | **AS-IS** | 필수 | {img,label,role}[] | role ∈ 입력\|제어\|출력, img=ending-thumbs 부품 id | `CaseFileEnding.tsx:CASE_VISUAL[id].chain` | P1-B |  |
| S502 | [엔딩 고장 위치] | **AS-IS** | 필수 | {at:node|link,index,label} |  | `CASE_VISUAL[id].fault` | P1-B |  |
| S503 | [엔딩 계측 막대] | **AS-IS** | 필수 | {label,unit,normal,actual,max} | 수치는 simModel과 일치 | `CASE_VISUAL[id].meter` | P1-B | 고정 수작성 값(D-4) |
| S504 | [한 줄 교훈] | **AS-IS** | 필수 | string |  | `CASE_VISUAL[id].lesson` | P1-B |  |
| S505 | [안전 관점] | **AS-IS** | 선택 | {hazard,detect,safeState,insight} |  | `CaseFileEnding.tsx:CASE_SAFETY[id]` | P0(안전 관점 토글) |  |
| S506 | [신호 경로 문장] | **AS-IS** | 필수 | string | `A → B → C` 화살표 나열 | `CaseFileEnding.tsx:SIGNAL_PATH[id]` | P1-B |  |
| S507 | [WANTED 포함 여부] | **AS-IS** | 공통 | 코드 | `REQUIRED_CASES=[propulsion,thermal]` | `CaseFileEnding.tsx:REQUIRED_CASES` | FB-P1-06 | 신규 사건 추가 시 코드 수정 |
| S508 | [분석 보고서 항목] | **AS-IS** | 자동 | 계산·조합 | META + STEP02/03/04 세션 기록 | `CaseFileEnding.tsx:reportItems` | P1-B | 기록 없으면 `기록 없음` |
| S509 | [전용 증명사진·머그샷 이미지] | **PROPOSED** | 선택 | 파일 | 현재 `cutscene-character-master-v1.png` 잘라 사용 | `(신규)` | (CLAUDE.md) | SSOT 요구 아님 |

### X. 공통·자동·검수 규칙

| ID | [카테고리] | 상태 | 요구 | 자료형 | 단위·허용값 | 코드 필드 | SSOT ID | 비고 |
|---|---|---|---|---|---|---|---|---|
| X01 | [헤더 2줄 소제목(자동 조합)] | **TO-BE** | 자동 | string ×2 | STEP별 계약 문구 + `{실제 상태값}` | `(신규)` | UI-RULE-01 |  |
| X02 | [추격 거리 보상·페널티] | **AS-IS** | 공통 | 코드 | 조사 −0.08 m/s, HINT −5, BENCH ±20 | `runtime.ts` | P1-A |  |
| X03 | [SW-only 근본 원인 검수] | **TO-BE** | 자동 | 검증기 | 분류 7종 외 금지·HW 단독 원인 금지 | `(신규)` | L-3.1~3.3 | 현재는 테스트 문자열 매칭만 |
| X04 | [말투 규칙 검수] | **PROPOSED** | 자동 | 검증기 | 해요체/합니다체·감탄 금지·이모지 금지 | `(신규)` | (CLAUDE.md) | SSOT 미반영 요구 |
| X05 | [수치 일관성 검수(3 모델·데이터)] | **PROPOSED** | 자동 | 검증기 | SCENARIOS/DominoTrace/BASE/CASE_VISUAL 수치 ↔ simModel | `(신규)` | H-8.6 | D-4 이슈 다수가 이 항목 |
| X06 | [결정론 재현 테스트] | **TO-BE** | 자동 | 테스트 | 같은 (case,tech,fixed) → 같은 결과 | `(신규; 현재 테스트 없음)` | H-8.6 |  |
| X07 | [사건 스키마 검증기] | **TO-BE** | 자동 | 검증기 | `SCENARIO_DATA_SCHEMA.md` 설계 — 구현 없음 | `(신규)` | H-8.3~H-8.4 |  |
| X08 | [단일 사건 레지스트리] | **PROPOSED** | 선택 | 구조 | 약 12곳의 `Record<CaseId,…>` 통합 | `(신규)` | H-8.1·H-8.10 |  |

## 작성 양식 (복사용)

> 상태 접두: `(AS-IS)` 실제 입력 가능 · `(TO-BE)`/`(PROPOSED)` 현재 미구현 — 채워도 게임에 반영되지 않음. `(자동)`/`(공통)`은 입력하지 않음.

```text

# M. 사건 메타
[사건 ID]:   # M01 · AS-IS · 필수 · string(CaseId)
[사건 제목]:   # M02 · AS-IS · 필수 · string
[챕터 라벨]:   # M03 · AS-IS · 필수 · string
[도메인(표시명)]:   # M04 · AS-IS · 필수 · string
[교육 목표]:   # M05 · AS-IS · 필수 · string
[필수/선택 사건]:   # M06 · AS-IS · 필수 · enum
[검수 메모]:   # M07 · AS-IS · 선택 · string
[SW 근본 원인 분류]:   # M08 · AS-IS · 필수 · string
[근본 원인(주입) 서술]:   # M09 · AS-IS · 필수 · string
[고장 모델 수치 요약]:   # M10 · AS-IS · 필수 · string
[정상 사양]:   # M11 · AS-IS · 필수 · string
[수리 방법]:   # M12 · AS-IS · 필수 · string ×2
[회귀(재시험) 기준]:   # M13 · AS-IS · 필수 · string
[레거시 정답 id]:   # M14 · AS-IS · 필수 · string
[저장 호환 프로그램 id]:   # M15 · AS-IS · 필수 · string
[선행 사건·사건 순서·해금]:   # M16 · PROPOSED · 선택 · CaseId[]

# S1. STEP01 연계 · 주행 증상 · 고장 발동
[차량 도메인 ID(STEP01)]:   # S101 · AS-IS · 필수 · string(DomainId)
[차고 노트(오픈북) 카드]:   # S102 · AS-IS · 선택 · {domain,feature,name,req}[]
[운전자 증상 한 줄]:   # S103 · AS-IS · 필수 · string
[발생 트리거 설명]:   # S104 · AS-IS · 필수 · string
[레이스 발동 구간(거리)]:   # S105 · AS-IS · 필수 · number[2] (m)
[상태 기반 발생 전제조건]:   # S106 · PROPOSED · 선택 · {ready,gear,speedKmh,pedalPct,heldSeconds,distanceM,stoppedSeconds}
[레이스 증상 연출 규칙]:   # S107 · AS-IS · 필수 · 코드
[고장 발동 조건(코드)]:   # S108 · AS-IS · 필수 · 코드
[운전자 고장 대사]:   # S109 · AS-IS · 필수 · string
[엔지니어 대사]: (입력 안 함)  # S110 · 공통 · 공통 · string
[경고등 표시]:   # S111 · AS-IS · 필수 · {label,note}
[관찰 가능한 증상 4종]:   # S112 · AS-IS · 필수 · {icon,label,value}[]
[주행 구간 안내·존 표지]:   # S113 · AS-IS · 선택 · string
[수리 후 체크포인트·격차 하한·복귀 장면]:   # S114 · AS-IS · 필수 · 코드
[재주행 회귀 조건]:   # S115 · AS-IS · 선택 · 코드

# S2. STEP02 원인 역추적 (도미노·증거·가설)
[증거 카드 ID]:   # S201 · AS-IS · 필수 · string
[증거 라벨]:   # S202 · AS-IS · 필수 · string
[증거 값]:   # S203 · AS-IS · 필수 · string
[증거 종류]:   # S204 · AS-IS · 필수 · string
[증거 이미지]:   # S205 · AS-IS · 필수 · 파일
[도미노 시작 노드(출력 증상)]:   # S206 · AS-IS · 필수 · string(dom id)
[최초 어긋남 노드]:   # S207 · AS-IS · 필수 · string(dom id)
[시간 단위]:   # S208 · AS-IS · 필수 · string
[요구사항 문장(STEP02)]:   # S209 · AS-IS · 필수 · string
[도미노 노드 식별·표시]:   # S210 · AS-IS · 필수 · {id,label,img}
[노드 구역]:   # S211 · AS-IS · 필수 · enum
[기준값·이번 값·단위]:   # S212 · AS-IS · 필수 · number|string + string
[노드 상태]:   # S213 · AS-IS · 필수 · enum
[달라진 시각 t]:   # S214 · AS-IS · 필수 · number (timeUnit)
[역추적 간선(원인 후보)]:   # S215 · AS-IS · 필수 · string[](dom id)
[노드→증거 연결]:   # S216 · AS-IS · 선택 · string(evidence id)
[확대 보기(zoom)]:   # S217 · AS-IS · 선택 · {where,kind,reference[],run[],part?,culprit,lesson}
[의심 구간 이름·선택지]:   # S218 · AS-IS · 필수 · {name, choices[{label,ok,why}]}
[가설 목록(레거시)]:   # S219 · AS-IS · 필수 · {id,label,desc}[]
[가설 목록(META)]:   # S220 · AS-IS · 필수 · {id,label,truth,stage1?,rules[]}[]
[가설 1단계 반박 근거]:   # S221 · AS-IS · 선택 · string
[가설 판정 규칙]:   # S222 · AS-IS · 필수 · {levels?,need{신호:Obs[]},verdict,why}[]
[고장 당시 입력 재생 라벨]:   # S223 · AS-IS · 필수 · string
[부분 확대(SUBSYS)]:   # S224 · AS-IS · 선택 · {where,inLabel,outLabel,stages[]}
[말풍선 인용]:   # S225 · AS-IS · 선택 · string
[영향 목록(회귀 후보)]: (입력 안 함)  # S226 · 자동 · 자동 · string[]
[Hover 정상·이상 짧은 설명]:   # S227 · TO-BE · 필수(예정) · {normal,abnormal}
[후보 STACK·정오 근거]:   # S228 · TO-BE · 필수(예정) · 미정
[자유 실 연결 규칙]:   # S229 · TO-BE · 선택 · 미정
[미측정 증거 생성 금지 검수]: (입력 안 함)  # S230 · 자동 · 자동 · 검증기

# S3. STEP03 로직 퍼즐 · 시험 계약
[퍼즐 도메인·기능·제어기]:   # S301 · AS-IS · 필수 · {domain,feature,ecu}
[퍼즐 프로그램 id]:   # S302 · AS-IS · 필수 · string
[보드 블록 순서·빈칸·예비]:   # S303 · AS-IS · 필수 · {board:id[], gaps:number[], spares:id[], joints:Nub[]}
[옆 입력(사이드)]:   # S304 · AS-IS · 필수 · {pieces,into,value,label}
[요구사항 줄]:   # S305 · AS-IS · 필수 · {text,slot}[]
[블록 정의]:   # S306 · AS-IS · 필수 · Record<id,Blk>
[현장 기록 값]:   # S307 · AS-IS · 선택 · Record<blockId,string>
[차고 노트 연결]:   # S308 · AS-IS · 선택 · {domain,feature,name}[]
[SW 컴포넌트 범위(검증 뷰)]:   # S309 · AS-IS · 필수 · {unit{name,ids[]},swc[{name,ids[]}]}
[퍼즐 목적 한 줄]:   # S310 · AS-IS · 필수 · string
[리그 목표(시험 가설 요약)]:   # S311 · AS-IS · 필수 · string
[요구 사양 문장]:   # S312 · AS-IS · 필수 · string
[예시 입력 슬라이더]:   # S313 · AS-IS · 선택 · {label,unit,min,max,at}
[기준 확정 기대값]:   # S314 · AS-IS · 필수 · string
[액추에이터 반응]:   # S315 · AS-IS · 필수 · {id,ok,weak}
[예시 값 계산(퍼즐 값 흐름)]:   # S316 · AS-IS · 필수 · 코드
[계약 목적]:   # S317 · AS-IS · 필수 · string
[계약 전제 조건]:   # S318 · AS-IS · 필수 · string[]
[계약 자극]:   # S319 · AS-IS · 필수 · {label,sequence}
[계약 기대 신호]:   # S320 · AS-IS · 필수 · string
[계약 관찰 3종]:   # S321 · AS-IS · 필수 · {id:input|control|output,label}[3]
[계약 비교 조건]:   # S322 · AS-IS · 필수 · {baseline,sameInput:true,timeAxis,units}
[계약 한계]:   # S323 · AS-IS · 필수 · string
[계약 자동 필드]: (입력 안 함)  # S324 · 자동 · 자동 · version,caseId,hypothesisId/Label,suspectSection,expected.value,createdBy
[STEP03 소제목 2줄]: (입력 안 함)  # S325 · 자동 · 자동 · string ×2
[긴 로직 줌 설정]:   # S326 · TO-BE · 선택 · 미정
[계약 → STEP04 시험 입력 구동]:   # S327 · PROPOSED · 선택 · 계약 필드→simulate 인자 매핑

# S4. STEP04 시뮬레이션 · 관찰 · 판정 · 수리 · 재시험
[볼트 질문]:   # S401 · AS-IS · 필수 · {hyp,ask}[]
[가설별 판단 기준 문구]:   # S402 · AS-IS · 필수 · string
[입력 조건 후보]:   # S403 · AS-IS · 필수 · {id,tech,input}[]
[시뮬레이션 모델 함수]:   # S404 · AS-IS · 필수 · 코드
[시뮬 시간·단위]:   # S405 · AS-IS · 필수 · [number,string]
[레벨별 관측 신호]:   # S406 · AS-IS · 필수 · Record<Lv,{id,name,unit,max,src,model?}[]>
[결함 주입 위치]:   # S407 · AS-IS · 필수 · 코드+서술
[권장 시험 레벨]:   # S408 · AS-IS · 선택 · {answer:Lv,why}
[최적 비용·근본 신호]:   # S409 · AS-IS · 필수 · number / string
[수리 카드]:   # S410 · AS-IS · 필수 · {label,img,ok,why}[3]
[공통 시험 카드·답 버튼]: (입력 안 함)  # S411 · 공통 · 공통 · 고정
[재시험 비교·별점]: (입력 안 함)  # S412 · 자동 · 자동 · 계산
[탭별 의문형 관찰 목표]:   # S413 · TO-BE · 필수(예정) · string ×4
[관찰 신호 선택 제한]:   # S414 · TO-BE · 필수(예정) · {max:number, candidates[]}
[모니터링 데이터 유형]:   # S415 · TO-BE · 필수(예정) · enum
[수리 카드 근거 연결]:   # S416 · TO-BE · 선택 · evidenceId[]
[오답 수리 시뮬레이션]:   # S417 · PROPOSED · 선택 · fix→fault 매핑
[고객 한 장 요약 카드]: (입력 안 함)  # S418 · 자동 · 자동 · 7항목

# S5. 재주행 · 엔딩 · 보고서
[엔딩 신호 체인]:   # S501 · AS-IS · 필수 · {img,label,role}[]
[엔딩 고장 위치]:   # S502 · AS-IS · 필수 · {at:node|link,index,label}
[엔딩 계측 막대]:   # S503 · AS-IS · 필수 · {label,unit,normal,actual,max}
[한 줄 교훈]:   # S504 · AS-IS · 필수 · string
[안전 관점]:   # S505 · AS-IS · 선택 · {hazard,detect,safeState,insight}
[신호 경로 문장]:   # S506 · AS-IS · 필수 · string
[WANTED 포함 여부]: (입력 안 함)  # S507 · 공통 · 공통 · 코드
[분석 보고서 항목]: (입력 안 함)  # S508 · 자동 · 자동 · 계산·조합
[전용 증명사진·머그샷 이미지]:   # S509 · PROPOSED · 선택 · 파일

# X. 공통·자동·검수 규칙
[헤더 2줄 소제목(자동 조합)]: (입력 안 함)  # X01 · 자동 · 자동 · string ×2
[추격 거리 보상·페널티]: (입력 안 함)  # X02 · 공통 · 공통 · 코드
[SW-only 근본 원인 검수]: (입력 안 함)  # X03 · 자동 · 자동 · 검증기
[말투 규칙 검수]: (입력 안 함)  # X04 · 자동 · 자동 · 검증기
[수치 일관성 검수(3 모델·데이터)]: (입력 안 함)  # X05 · 자동 · 자동 · 검증기
[결정론 재현 테스트]: (입력 안 함)  # X06 · 자동 · 자동 · 테스트
[사건 스키마 검증기]: (입력 안 함)  # X07 · 자동 · 자동 · 검증기
[단일 사건 레지스트리]:   # X08 · PROPOSED · 선택 · 구조
```

## 신규 사건 추가 시 코드 수정이 필요한 항목 (데이터만으로 불가)

- M01 [사건 ID] — `runtime.ts:CaseId`
- S105 [레이스 발동 구간(거리)] — `experiences.tsx:OVERTAKE_ZONE/CLIMB_ZONE`
- S107 [레이스 증상 연출 규칙] — `experiences.tsx:RaceExperience (1721-1728, 1797-1799)`
- S108 [고장 발동 조건(코드)] — `experiences.tsx:RaceExperience (1840-1845)`
- S114 [수리 후 체크포인트·격차 하한·복귀 장면] — `runtime.ts:APPLY_REPAIR`
- S115 [재주행 회귀 조건] — `experiences.tsx:RaceExperience regression effect`
- S316 [예시 값 계산(퍼즐 값 흐름)] — `RefPuzzle.tsx:exampleValue`
- S404 [시뮬레이션 모델 함수] — `simModel.ts:propulsion/thermal/brake + MODELS`
- S407 [결함 주입 위치] — `simModel.ts / SCENARIO_META.injection`
- S507 [WANTED 포함 여부] — `CaseFileEnding.tsx:REQUIRED_CASES`
- X02 [추격 거리 보상·페널티] — `runtime.ts`

## 조사 한계
- 자료형·허용값 중 "관찰된 값"으로 표기한 것은 코드 열거형이 아니라 현재 데이터에서 본 값이다.
- `Kind`(블록 종류), `Nub`, EeTrace `QUOTE` 키 구조, `zoom` 사용 여부는 이번에 확인하지 않음.
- 필드 정의는 읽은 소스 기준이며, UI 렌더 시 필수로 간주되는지는 실행하지 않아 확인 못 함.
