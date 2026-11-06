# EV Vehicle Logic Lab — 리팩토링 Gap Analysis 및 6일 MVP 계획

작성일: 2026-11-06 · 기준 문서: `CODEX_REFACTOR_MASTER.md` · 기준 커밋: `cd1d72e`
이 문서는 분석 산출물이며, 이 시점까지 **소스 코드는 변경하지 않았다.**

---

## 1. 현재 프로젝트 상태

| 항목 | 확인 결과 |
|---|---|
| 프로젝트 루트 | `261103codex/game-web` (Git 저장소 루트는 상위 `261103codex/`) |
| 브랜치 / 최근 커밋 | `main` / `cd1d72e Feat: Game UI 수정 필요` |
| 미커밋 변경 | `CODEX_REFACTOR_MASTER.md` 미추적 파일 1개뿐 |
| 실행 가능 여부 | `npm test` 15/15 통과, `tsc -b` 오류 0, `vite build` 성공 |
| 스택 | React 19.3 · TypeScript · Vite 8 · three 0.187 · @react-three/fiber 9.8 · drei (모두 `latest` 지정) |
| 번들 | JS 단일 청크 1.33 MB(gzip 370 KB), CSS 282 KB (v5~v18 CSS 18개 누적) |
| 3D 모델 파일 | **GLB/GLTF/FBX/OBJ/Blend 0개** (프로젝트·핸드오프 전체 검색). 모든 3D는 코드 내 기본 도형(box 37, cylinder 33, sphere 23, torus 20 …) 조합 |
| 2D 에셋 | `public/assets` 69 MB (배경·컷신·캐릭터·부품 컷아웃 PNG) |
| Blender | 미설치 (Python 3.14, Node 24는 있음) |

### 1-1. 실제 렌더 경로 (진행 흐름)

`main.tsx`의 `App()`이 `runtime.ts` 장면 상태기계를 따라 아래 컴포넌트를 렌더한다.

```
TITLE → PROLOGUE(3컷) → GARAGE_L1~L4 (GarageExperience)
 → DRIVE_BRIEFING (컷신) → CHASE_NORMAL (RaceExperience)
 → FAULT_CUE (FaultDialogue) → BOARD (InvestigationBoard, 메모판)
 → WIRING (WiringPuzzle, SW 로직/배선) → TWIN_BENCH (features/verification/VerificationLab)
 → VERIFY_FAIL ↔ / REPAIR → CHASE_RESUME → (2번째 사건: thermal 반복)
 → OPTIONAL_FAULT(brake) → SHIP_ESCAPE → ENDING
```

- 사건 3개: `propulsion`(필수), `thermal`(필수), `brake`(선택) — `game/scenarios.ts`
- 스토리: 루·밍(고양이) 콤비, 차고 포위 → 항구 4번 부두 해적선 탈출. 레이싱 차량은 **고양이 두 마리가 탄 붉은 오픈카**.

### 1-2. 주의할 기존 구조

- `main.tsx` 안의 `ToyCar / Garage / Race / Board / Wiring / Bench / Repair …`(약 1,000줄)는 **현재 렌더되지 않는 이전 버전 구현**이다. 삭제하지 않고 보존하되, 신규 작업은 `experiences.tsx`·`features/` 쪽에만 한다.
- `experiences.tsx` 1,792줄에 차고·레이싱·메모판·배선·시험대 3D가 모두 들어 있다.
- 핸드오프 패키지 `03_CONTROL_CORE/.../TraceBack-develop/src`에 **39종 블록 실행 엔진**(`campaign/signalBlocks.ts`, `engine/graph.ts·simulation.ts·SimulationClock.ts`)과 도메인 모델(propulsion·braking·eps·thermal·hv·bms …, 총 2,467줄)이 있으나 **game-web에는 통합되지 않았다.** PART 8 구현에 재사용 가능.

---

## 2. 요구사항별 Gap Analysis

범례 — **①** 기존 그대로 재사용 · **②** 기존 수정 필요 · **③** 신규 구현 · **④** 외부 3D 에셋 확보 필요 · **⑤** 6일 내 불가/고위험

| # | 요구사항 (문서 PART) | 현재 구현 | 분류 | 비고 |
|---|---|---|---|---|
| 1 | 스토리·진행 흐름 보존 (P2, P18-P0) | 완성, 테스트로 고정 | ① | `runtime.ts`·`scenarios.ts`·컷신 변경 금지 |
| 2 | 차고지 도메인 학습 (2-1) | 7도메인 × 기능 × 4관점, OrbitControls 3D, 예측 미션 | ①+② | 구조 재사용, 부품 렌더만 교체 |
| 3 | 메모판 (2-2) | 증거 선택/취소, 가설, 폴라로이드·드래그 | ① | |
| 4 | SW 로직 작업대 (2-3) | 요구사항 흐름 + 블록 퍼즐(정답/오답 블록) | ①+② | 블록이 실제 값을 계산하지 않음(표시용) |
| 5 | E/E·HW/SW 배선 (2-4) | WiringPuzzle 노드/엣지 배선 | ② | 포트 타입·단위 검사 없음 |
| 6 | 쌍둥이 실험대 (2-5) | 4개 관점 탭, 자극·관측점 선택, 기준 vs 사용자 비교 | ①+② | 값은 하드코딩 테이블(`experimentConfig`, `softwareFlows`) |
| 7 | 레이싱·체크포인트·재시도 (2-6) | 완성 (곡선 도로, 교통, 경찰, 램프 점프, CAUGHT→체크포인트) | ① | |
| 8 | 레이싱 차체 비율·외형 (3-1) | RoundedBox 조합 오픈카, 휠 비율 과장(토이풍) | ②+④ | 오픈카+고양이 2마리는 스토리 요소라 유지 필요 |
| 9 | 운전자/외부 카메라 시점 (3-1) | 외부 추격 카메라만 | ③ | |
| 10 | 운전자 입력장치 3D (3-2, 7-3) | 차고에 페달·시동버튼·기어 기본 도형 있음. 레이싱엔 없음 | ③+④ | 레이싱 HUD/콕핏에 연동되는 모델 없음 |
| 11 | 키 매핑 Enter/W/S/A/D/Space (7-1) | W/S/A/D·Q/E(D1~D3)·R(READY 재시동). Enter·Space 미사용 | ② | 기존 Q/E·R 유지하고 Enter=시동, Space=보조제동 추가 |
| 12 | 입력→신호(APP/BPP/Steering/StartRequest) (7-2, Q4) | 키 → `speed` 직접 가감 | ③ | 신호 계층 신설 필요 (핵심 P0) |
| 13 | 앞바퀴 조향각·계기판 연동 (7-3) | `steer` 상태로 앞바퀴 회전 O, 계기판 속도 O | ① | 신호값 표시로 확장 |
| 14 | 학습/검증용 고품질 PBR 부품 (3-3, 추가정책) | 전 부품 기본 도형 | ④+⑤ | **아래 3장 참고 — 최대 위험 항목** |
| 15 | 무작위 색 제거·재질 색상 체계 (3-3) | 부품마다 임의 색(`#f08a52` 등), active 시 주황 발광 | ② | 재질 토큰 + 상태 하이라이트(외곽선)로 분리 |
| 16 | 학습·검증 동일 에셋 공유 (6) | 차고와 시험대가 같은 `HardwarePart` 함수를 씀 (공유 구조는 이미 있음) | ② | `modelAssetId` 기반 공통 로더로 교체하면 자동 충족 |
| 17 | 360 회전·확대 (6-1) | 차고 OrbitControls O, 시험대 일부 | ① | |
| 18 | 부품 선택·정보·강조 (6-1) | hover 라벨만 | ② | |
| 19 | 분해/조립·단면·내부 구조 (6-1, Q7) | 없음 | ③+④ | 분리된 메시 에셋 필요. 6일 내 1~2개 부품만 현실적 |
| 20 | 포트 표시·연결 부품 이동 (6-1) | 없음 (케이블은 장식) | ③ | 포트 데이터 정의 후 3D 앵커 표시 |
| 21 | 공통 부품 데이터 (Component/Port/Domain ID 등) (6-2) | 없음. 라벨 문자열 정규식으로 종류 추정(`hardwareKindFor`) | ③ | 데이터 레지스트리 신설 |
| 22 | 7계층 시뮬레이션 (8-1) | 없음 | ③ | 6일 내 구동(propulsion) 경로 1개만 |
| 23 | Simulink형 블록 16종 (8-2) | 게임 내 없음 / 핸드오프 엔진에 39종 존재 | ②(이식) | 핸드오프 엔진 이식·검증 |
| 24 | SW 출력→HW 입력, 피드백 (8-3) | 시각적 화살표만 | ③ | 구동 경로 VCU→MCU→Inverter→Motor→Gear→Shaft→Wheel + WSS 피드백 |
| 25 | 흐름 종류별 선 구분 (8-4) | 케이블 색만 다름, 단위/방향 없음 | ② | 전력/토크/회전/유압/열/디지털/아날로그/CAN 8종 스타일 |
| 26 | Step fwd/back/play/pause/reset/속도 (8-5) | 실험 실행 1회 애니메이션만 | ③ | 스냅샷 기록 방식으로 Back 지원 |
| 27 | 부품 Visibility/Selection/Inclusion/Connection/Dependency (9) | 없음 | ③ (구조만) | P2 — 상태 필드와 간단한 영향 표시까지 |
| 28 | E/E 관점(Component/Domain/E/E/Vehicle) & ECU 노드 (10) | 차고 4관점 + 시험대 시스템 탭에 부분 존재 | ② | ECU 정의를 데이터화 |
| 29 | OEM 독립·용어 정확성 (11) | 대체로 일반 용어. 일부 확인 필요(예: 문구 "HILS 관점"은 레거시 코드에만) | ② | 검토 패스 1회 |
| 30 | 성능: 레이싱/학습 모델 분리, Lazy, Draco/Meshopt (12) | 단일 번들, 에셋 없음 | ③ | 씬별 `React.lazy` + `useGLTF` 지연 로딩 |
| 31 | 에셋 출처·라이선스 기록 (5-3, 16) | 없음 | ③ | `docs/ASSET_LICENSES.md` 신설 |
| 32 | 전체 의존성 분석 엔진, 모든 도메인 물리 모델 (Q14) | 없음 | ⑤ | 문서도 후속 범위로 분리함 |

---

## 3. 3D 에셋 — 가장 큰 위험

**문서의 "학습·검증 화면의 모든 부품을 고품질 에셋으로, 기본 도형 금지" 정책은 6일 안에 전 부품 충족이 불가능할 가능성이 높다.** 근거:

1. 실제 검색 결과(`docs/ASSET_CANDIDATES.md`) 라이선스가 명확한(CC0/CC-BY) EV 전용 부품 — 배터리 팩/모듈, 인버터, BMS, HV 정션박스, DC/DC, OBC, 감속기/차동기어, EPS 랙 — 은 **후보가 거의 없거나 0건**이었다.
2. 후보가 있는 부품(모터, 브레이크 디스크·캘리퍼, 18650 셀, 라디에이터, 워터펌프, 컨택터)도 제작자·스타일·스케일이 제각각이라 통일 가공이 필요한데, **Blender가 설치되어 있지 않다.** (glTF-Transform 같은 Node 도구로 크기·재질·압축은 처리 가능, 메시 분리·피벗 재설정은 제한적)
3. Sketchfab 다운로드 API는 **로그인/API 토큰이 필요(401 확인)**, GrabCAD는 접근 거부(403), BlenderKit은 계정+Blender 애드온 필요. 계정 생성·토큰 입력은 제가 할 수 없으므로 **다운로드는 사용자가 직접** 해야 한다.
4. BlenderKit "Royalty Free"는 에셋 자체의 재배포를 제한하는데, 웹게임은 GLB 파일이 그대로 배포되므로 **해석이 애매하다.** 공모전·사업화 목적이면 CC0 > CC-BY 우선.
5. 차량·스티어링 휠 후보 상당수가 실제 브랜드(Lamborghini, BMW, Mustang 등) 재현물이다. 상표·디자인권 문제로 **제외**해야 한다.

**권장 대응:** 시나리오에 실제 등장하는 부품부터 우선 확보(아래 4장 Tier A). 공개 에셋을 못 구한 부품은 문서 PART 5-5 / 추가정책 4-5항에 따라 "교육용 단순화 모델" 배지를 화면에 명시해 구분한다. (이 대체 방식은 사용자 승인 필요)

---

## 4. 부품 우선순위 (시나리오 사용 빈도 기준)

| Tier | 부품 | 사용 화면 | 공개 에셋 상황 |
|---|---|---|---|
| A (P0) | 레이싱 차체(오픈카), 경찰차 | 레이싱 | Kenney Car Kit(CC0, 토이풍), Sketchfab CC-BY 저폴리 후보 있음. 오픈카 형태는 드묾 |
| A (P0) | 스티어링 휠, 가속/브레이크 페달, 시동 버튼, 기어 셀렉터, 계기판 | 레이싱 콕핏·차고 | 휠·셀렉터·시동버튼 후보 있음. 페달·계기판 단품은 거의 없음 |
| A (P0) | 구동 모터(PMSM), 인버터 | 사건1 propulsion 전 화면 | 모터 후보 다수(산업용 형상). 차량용 인버터는 없음 |
| A (P0) | 라디에이터·냉각팬, 냉각 펌프, 온도 센서 | 사건2 thermal | 라디에이터·펌프 후보 있음 |
| B (P1) | 브레이크 디스크·캘리퍼, 유압 모듈레이터, 휠 속도 센서 | 선택 사건 brake | 디스크·캘리퍼 후보 있음, 모듈레이터 없음 |
| B (P1) | 배터리 셀/모듈/팩, 컨택터, VCU/ECU 하우징 | 전원 도메인·E/E 관점 | 셀·산업용 컨택터만 있음 |
| C (P2) | 감속기·차동, 드라이브샤프트, EPS 랙, 서스펜션, OBC, DC/DC, 충전 포트 | 확장 도메인 | 거의 없음 |

---

## 5. 공통 데이터 모델 설계 (초안, 신규 `src/sim/`)

기존 화면 코드를 건드리지 않고 옆에 추가하는 순수 TypeScript 모듈.

```ts
type FlowType = "electrical_power" | "mechanical_torque" | "rotational_speed" | "hydraulic_pressure"
              | "thermal" | "digital" | "analog" | "can_message";
type ComponentCategory = "driver_input" | "sensor" | "controller" | "actuator"
                       | "passive_mechanical" | "energy" | "network";   // Q3 분류, 복수 가능
type Port = { id: string; direction: "in" | "out"; flow: FlowType; unit: string; signal?: string };
type ComponentDef = {
  id: string; name: string; domainId: DomainId; categories: ComponentCategory[];
  modelAssetId: string;            // 3D 에셋과 시뮬레이션의 유일한 연결 고리
  modelFidelity: "sourced" | "educational_simplified";   // 화면 배지 표시용
  ports: Port[]; relatedEcu?: string; animation?: { type: "spin" | "travel" | "press"; node: string; driver: string };
};
type Connection = { from: `${string}.${string}`; to: `${string}.${string}`; flow: FlowType };
type ComponentRuntimeState = { visible: boolean; selected: boolean; included: boolean;
                               connected: boolean; physical: Record<string, number> };
```

- 구동 경로 예시: `APP(pedal).out.APP_Position → VCU.in → VCU.out.TorqueRequest(CAN) → MCU → Inverter(전력) → Motor(토크) → ReductionGear → DriveShaft → Wheel`, 피드백 `WheelSpeedSensor → VCU`, `MotorPositionSensor → MCU`.
- 운전자 입력 계층: 키보드 → `DriverInputs { StartRequest, APP_Position(0~100%), BPP_Position, Steering_Angle(deg), Gear_Request }` → 제어 SW → 차량 동역학. 레이싱의 기존 `speed` 계산은 이 신호를 입력으로 받도록 감싼다(주행감·고장 체험 수치는 유지).

---

## 6. 6일 MVP 작업 계획 (2026-11-06 ~ 11-11)

| Day | 작업 | 산출물 | 기존 화면 영향 |
|---|---|---|---|
| 1 (11/06) | 분석·보고(완료), 복구 지점 확보(작업 브랜치), `src/sim/` 부품·포트·신호 레지스트리, 운전자 입력 신호 계층 + 단위 테스트 | 데이터 모듈, 테스트 | 없음 (화면 미연결) |
| 2 (11/07) | 에셋 후보 승인 → 사용자 다운로드 → 라이선스 대장, glTF-Transform 최적화 파이프라인(npm devDependency), `public/models/racing`·`parts` 분리 | GLB, `ASSET_LICENSES.md` | 없음 |
| 3 (11/08) | 공통 `PartModel`(modelAssetId → GLB 지연 로딩, 없으면 기존 도형 + "교육용 단순화" 배지)로 차고·시험대의 `HardwarePart` 교체, 재질 색상 토큰, 부품 선택·정보·포트 앵커 | 동일 에셋 공유 | 차고·시험대 3D 외형만 변경 |
| 4 (11/09) | 레이싱: 신호 계층 연결, Enter 시동/READY, Space 보조제동, 콕핏 입력장치(페달·휠·시동버튼) 연동 HUD, 운전자 시점 토글(C), 차체 교체·최적화 | 레이싱 연동 | 조작키 추가만, 기존 키·흐름 유지 |
| 5 (11/10) | 핸드오프 블록 엔진 이식(구동 사건 한정), 시험대 SW 탭 Step 재생(앞/뒤/재생/정지/리셋/속도), 3D 모터 회전을 시뮬레이션 값에 동기화, 흐름 종류별 선 스타일 | Step 시뮬레이션 | 시험대 SW 탭 내부 |
| 6 (11/11) | 전체 흐름 회귀(qa 파라미터 전 장면), 성능 측정, 용어 검토, 미완성 목록·실행 안내 문서 | 제출 버전 | — |

일정이 밀리면 축소 순서: 분해 애니메이션 → Tier B/C 부품 → Step Backward → 운전자 시점.

---

## 7. 위험요소 및 대안

| 위험 | 영향 | 대안 |
|---|---|---|
| 전 부품 고품질 정책 미충족 | 검수 기준 15-1, 추가정책 6항 미달 | Tier A 우선 확보 + 미확보 부품 "교육용 단순화" 명시 (승인 필요) |
| 레이싱 오픈카+고양이 탑승은 스토리 요소 | 일반 차량 에셋으로 바꾸면 스토리 훼손 | 오픈카 형태 에셋을 찾거나, 기존 실루엣 유지하며 비율·재질만 개선 (선택 필요) |
| Sketchfab/BlenderKit 다운로드에 사용자 계정 필요 | 에셋 확보 지연 | 사용자가 `game-web/asset-intake/`에 수동 다운로드 → 이후 처리는 제가 담당 |
| Blender 미설치 | 메시 분리·피벗 수정 제한 | glTF-Transform으로 가능한 범위만, 필요 시 Blender 설치 요청 |
| `experiences.tsx` 1.8천 줄·CSS 18겹 | 수정 시 회귀 위험 | 신규 코드는 별도 모듈, 기존 함수 시그니처 유지, 테스트 추가 |
| 의존성 `latest` 고정 안 됨 | 재설치 시 빌드 깨짐 | lock 파일 유지, 제출 전 버전 고정 검토 |
| 번들 1.33 MB 단일 청크 | 초기 로딩 | 씬별 lazy import (Day 4~6) |
| Step Backward 구현 비용 | 일정 | 틱별 스냅샷 기록으로 단순화 |
