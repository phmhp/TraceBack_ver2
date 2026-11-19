# 정비소 플레이어 노출·기술 검수 카탈로그

- 기준 커밋: `d19e1844cee87fbea5c0a41ffe01a20da556c28b`
- 정적 원문 행: 1435 · UI 동작 항목: 24
- 3개 영역 · 11개 도메인 · 44개 기능
- 전체 구조화 원자료: [GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.json](GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.json)
- 근거 기반 기술 검수 안내와 독립 검토 경계: [GARAGE_TECHNICAL_REVIEW_2026-11-19.md](GARAGE_TECHNICAL_REVIEW_2026-11-19.md)
- 원문 후보 출처: [PLAYER_CONTENT_CATALOG_2026-11-19.jsonl](PLAYER_CONTENT_CATALOG_2026-11-19.jsonl)

## 직접 검수하는 순서

1. 한 기능을 고르고 네 관점의 내용을 처음부터 끝까지 연결해 읽습니다. 화면에 표시된 순서만 보지 않고 입력·출력 경계, 제어 소유자, 전달 신호를 함께 확인합니다.
2. 각 선행·후행 신호를 다른 기능과 도메인에서도 대조합니다. 신호 이름이 같으면 송신자·수신자·단위·방향·조건이 같은지 확인합니다.
3. 구체적인 고장 시나리오가 그 기능 데이터와 실제 입력·출력 모델을 같은 방식으로 재사용하는지 대조합니다.
4. 문제 후보는 먼저 코드 근거로 재현 가능한 불일치인지 확인합니다. 외부 기술 규격을 근거로 삼는 주장은 해당 규격의 정확한 문서·절·판본을 확보하기 전까지 ‘미확인’으로 둡니다.
5. 렌더 조건·숨김 상태·클릭 후 결과는 브라우저에서 확인합니다. 정적 카탈로그만으로 실제 화면 노출을 확정하지 않습니다.

## 판정 기준

- **확인된 결함**: 동일 시스템 안의 명시적 데이터/핸들러가 서로 모순되거나, 요구된 상호작용이 코드상 도달 불가능함을 파일·줄·상태 전이로 입증할 수 있음.
- **교육상 모호성**: 코드 안에 입력·출력/신호의 소유 경계가 없거나 서로 다른 용어를 같은 값처럼 사용해 학습자가 흐름을 유일하게 해석할 수 없음. 관찰한 화면과 원문 근거를 함께 적음.
- **검증 대기**: 근거가 코드에 없거나 실제 렌더·모델·표준 확인을 해야만 판단 가능함. 결함으로 단정하지 않음.
- 각 finding은 주장 → 근거(파일·줄/화면 상태) → 시스템 영향 → 확인 방법 → 판정으로 기록합니다. 반대 근거와 범위를 제한하는 조건도 함께 적습니다.

## 화면 경로와 조작 인벤토리

| 화면/조작 | 현재 라벨 또는 라벨 범위 | 노출 조건·동작 | 근거 |
|---|---|---|---|
| 도메인 미선택 · 전체 차량 보기 | `아키텍처` | noDomain && level===0; overview3d=true; 전체 차량 3D를 닫고 ArchitectureOverview 표시 | [src/experiences.tsx:649,693-695](../src/experiences.tsx#L649) |
| 도메인 미선택 · 전체 차량 3D | `파워트레인 / 섀시 / 차량 제어 / 도메인 협조제어` | noDomain && level===0; 선택 영역의 아키텍처 화면으로 이동; 협조제어는 coord 상태 | [src/experiences.tsx:690-692,946-947](../src/experiences.tsx#L690) |
| 아키텍처 · 전체 영역 | `영역 보기 →` | ArchitectureOverview.open===null; 선택 영역의 도메인·입출력 요약 화면 표시 | [src/features/garage/ArchitectureOverview.tsx:99-114](../src/features/garage/ArchitectureOverview.tsx#L99) |
| 전체 차량 3D · 도메인 바로가기 | `11개 도메인명` | noDomain && overview3d; 선택 도메인 화면 열기; feature 기본 인덱스 0 | [src/experiences.tsx:1095-1100,1049-1051](../src/experiences.tsx#L1095) |
| 아키텍처 · 영역 카드/영역 상세 | `11개 도메인명` | ArchitectureOverview; 선택 도메인 기능 흐름 열기 | [src/features/garage/ArchitectureOverview.tsx:34-42,111-113,141-145](../src/features/garage/ArchitectureOverview.tsx#L34) |
| 우측 아키텍처 탐색 트리 | `파워트레인 / 섀시 / 차량 제어` | noDomain && level===0; 선택 영역 논리 뷰 열기 | [src/features/garage/ArchitectureOverview.tsx:24-43](../src/features/garage/ArchitectureOverview.tsx#L24) |
| 우측 아키텍처 탐색 트리 | `차량 전체 · 3D 보기 / 차량 3D 보기` | noDomain && level===0; 전체 차량 3D 뷰 열기 | [src/features/garage/ArchitectureOverview.tsx:27-45](../src/features/garage/ArchitectureOverview.tsx#L27) |
| 아키텍처 · 영역 상세 | `전체 영역 / 파워트레인 / 섀시 / 차량 제어` | open!==null; 전체 영역 카드 또는 선택 영역 화면 열기 | [src/features/garage/ArchitectureOverview.tsx:128-131](../src/features/garage/ArchitectureOverview.tsx#L128) |
| 아키텍처 · 전체 영역 | `협조 신호 이름 6개 미리보기` | open===null; COORD_SIGNALS.slice(0,6); 선택 신호의 송신/수신 도메인 경로 표시 | [src/features/garage/ArchitectureOverview.tsx:116-124](../src/features/garage/ArchitectureOverview.tsx#L116) |
| 아키텍처 · 영역 상세 | `협조 신호 이름 9개` | open!==null; 선택 신호 경로 토글 | [src/features/garage/ArchitectureOverview.tsx:153-157](../src/features/garage/ArchitectureOverview.tsx#L153) |
| 정비소 모든 상태 | `기능 흐름 / 부품·E/E / SW 구성 / SW 로직` | 항상 렌더; 도메인 미선택 시 2~4번째 버튼은 needsDomain 표시이며 클릭 핸들러가 선택을 막음; routeLevel 0..3 선택 | [src/experiences.tsx:963,1089-1093](../src/experiences.tsx#L963) |
| 도메인 선택 상태 | `차량 전체 / 영역명 / 다른 도메인 / 영역 바꾸기` | chosen===true; 차량 전체·영역·다른 도메인 화면으로 이동 | [src/experiences.tsx:1101-1110](../src/experiences.tsx#L1101) |
| 도메인 선택 상태 · 우측 주요 기능 패널 | `선택 도메인의 기능명 4개` | chosen===true; feature 인덱스 변경; 중앙 뷰·하단 흐름 데이터 동기화 | [src/experiences.tsx:1169-1173](../src/experiences.tsx#L1169) |
| 부품·E/E 관점 | `연결 / 겹쳐 / 실제 부품` | chosen && routeLevel===1; EeBlueprint의 eeLayer 변경; 노드 클릭의 세부 동작 변경 | [src/experiences.tsx:655-670](../src/experiences.tsx#L655) |
| 기능 흐름 3D | `배선 숨기기 / 배선 보기` | level===0; wiringVisible 토글; 전체/도메인 3D에 전달 | [src/experiences.tsx:615-617,683-699](../src/experiences.tsx#L615) |
| 기능 흐름 3D | `차체·카울 숨기기 / 차체·카울 보기` | level===0; 전체 차량은 bodyVisible, 도메인 뷰는 shell 토글 | [src/experiences.tsx:615-616,699](../src/experiences.tsx#L615) |
| 도메인별 기능 흐름 3D | `부품 클릭 선택` | level===0 && !allDomains && chosen; 선택 부품 정보 표시 및 활성 스텝 갱신 | [src/experiences.tsx:646-648,686-689](../src/experiences.tsx#L646) |
| 하단 신호 흐름 | `입력·중간 단계·출력 노드명` | chosen===true; 선택 단계와 activeStep 갱신 | [src/experiences.tsx:1175-1179](../src/experiences.tsx#L1175) |
| 도메인 선택 상태 | `도메인별 인터록 버튼 + 입력 동작 버튼` | chosen===true; 준비조건에 따라 버튼 disabled/status 변화; 조건 상태 갱신 후 길게 누른 입력에서 신호 흐름 활성화 | [src/experiences.tsx:1115-1119](../src/experiences.tsx#L1115) |
| 도메인 선택 상태 | `다음 스텝 / 처음으로 · 자동재생 / 일시정지` | chosen===true; 활성 신호 단계 진행 또는 자동재생 토글 | [src/experiences.tsx:1120](../src/experiences.tsx#L1120) |
| 정비소 본문 하단 | `다음 →` | 전체/도메인 상태 모두; OPEN_LEVELS로 레벨 선택 진입 | [src/experiences.tsx:1168-1179](../src/experiences.tsx#L1168) |
| 비노출 코드 경로 | `흐름 따라가기 / 부품 소개` | SHOW_EE_TABS=false라 탭 전체가 렌더되지 않음; 미노출 | [src/experiences.tsx:44-45,1121-1141](../src/experiences.tsx#L44) |
| 비노출 코드 경로 | `빼 보기 / 범인 찾기` | SHOW_PULL_TABS=false라 탭 렌더되지 않음; 미노출 | [src/experiences.tsx:44,1139-1141](../src/experiences.tsx#L44) |
| 공통 상단 단계 내비게이션 | `이전 단계` | 정비소 장면; feature → view → domain → 전체 차량 순으로 후퇴; 최상위에서 프롤로그 확인창 | [src/experiences.tsx:965-970](../src/experiences.tsx#L965) |

## 모든 영역·도메인·기능 원문

### 파워트레인 · 구동 (`drive`)

**목적 원문:** `가속 의도를 모터 토크와 바퀴 구동력으로 바꿉니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `운전자 토크 요청 해석` | `요구 해석` | `가속 페달 입력을 검증해 운전자가 원하는 토크로 바꿉니다.` | `가속 페달 조작 → 가속 의도 → 가용 토크 판단 → 전륜 추진력 → 차량 가속` | `APS A/B 가속 페달 → VCU → CAN 토크 → MCU·인버터 ECU → 인버터 → 전륜 PMSM 모터 → 전륜 감속기 → 차동기어 → 드라이브 샤프트 → 전륜` | `PedalInput → DriverRequest → TorqueArbiter → TorqueCmdTx` | `A/B 상관성 → 입력 필터 → 페달 맵 → 구동 허용 → 가용 토크 MIN → 램프율 → 토크 출력` |
| `구동 허용·인터록` | `제어·배분` | `D단과 READY 조건이 모두 맞을 때만 구동 토크를 허용합니다.` | `D단 선택 → READY 확인 → 구동 허용 → 안전 출발` | `PRND 센서 → VCU Interlock → CAN Permit → 인버터 Enable` | `GearInput → DrivePermit → FaultManager → PermitTx` | `Gear==D → HV READY → 브레이크 인터록 → 고장 래치 → Permit Gate` |
| `토크 배분·제한` | `제어·배분` | `배터리·모터·열 한계를 모아 낼 수 있는 최대 토크로 제한합니다.` | `토크 요청 → 한계 수집 → 가용 토크 판단 → 최종 토크 명령` | `VCU → BMS → 모터 NTC 센서 → Thermal ECU → CAN 토크 → MCU·인버터 ECU` | `LimitCollector → TorqueArbiter → RampLimiter → TorqueCmdTx` | `배터리 한계 수신 → 열 한계 수신 → 가용 토크 MIN → 램프율 → 토크 명령 확정` |
| `인버터 전류·토크 제어` | `실행·보호` | `토크 명령을 3상 전류로 만들어 전륜 PMSM·감속기 어셈블리의 축 토크를 냅니다.` | `토크 요구 → 전류 목표 → dq 제어 → PWM → 모터 회전 → 축 토크` | `VCU → CAN → 인버터 MCU → 3상 브리지 → PMSM → 리졸버` | `TorqueCmdRx → CurrentCtrl → PwmDriver → ResolverIf → MotorProtect` | `명령 수신 → dq 변환 → 전류 PI → 전압 제한 → PWM 생성 → 리졸버 피드백 → 토크 추정` |

### 파워트레인 · 고전압 전원 (`power`)

**목적 원문:** `고전압 팩을 안전하게 연결하고 각 도메인에 쓸 수 있는 전력을 알립니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `팩 안전 판단` | `요구 해석` | `전압·절연·온도를 확인해 고전압 팩을 쓸 수 있는지 판단합니다.` | `시동 버튼 → START 요청 → 팩 안전 확인 → 전원 허용 → READY` | `START 버튼 → 전압·절연·온도 센서 → BMS → VCU → HV 부하` | `PackMonitor → IsolationCheck → SafetyState → PackSafeTx` | `START 입력 → 전압 범위 → 절연 임계 → 온도 제한 → Crash 신호 → PackSafe 래치` |
| `프리차지·접촉기` | `제어·배분` | `인버터 커패시터를 먼저 충전한 뒤 주 접촉기를 닫습니다.` | `전원 요청 → 부하측 전압 확인 → 프리차지 → 전압 동기화 → 주 접촉기 → HV 연결` | `팩 전압센서 → BMS → 프리차지 저항 → 릴레이 → 주 접촉기 → HV 버스` | `VoltageRx → PrechargeSeq → ContactorDrv → WeldDiag` | `전압비 계산 → Precharge 상태기 → 타임아웃 → 주 접촉기 명령 → 용착 진단 → HV 피드백` |
| `출력 가용량 계산` | `제어·배분` | `SOC·온도·셀 편차로 방전·회생 출력 상한을 계산합니다.` | `팩 상태 → 열·SOC 한계 → 출력 예산 → 도메인 배분 → 가용 성능` | `BMS → VCU → Power Coordinator → CAN Limit → 인버터·부하` | `CellLimitCalc → SopEstimator → LimitTx` | `SOC 보정 → 온도 디레이팅 → 충방전 한계 → 합계 제한 → 도메인 우선순위 → 램프율` |
| `고장 차단·HVIL` | `실행·보호` | `인터록 단선·충돌 신호 등 위험 때 고전압을 차단합니다.` | `고장 감지 → 위험 등급 판단 → 고전압 차단 → 안전 상태` | `HVIL 루프 → 충돌 신호 → BMS → 주 접촉기 → 인버터 방전` | `HvilMonitor → CrashHandler → ShutdownCtrl → FaultLatch` | `루프 단선 검사 → 충돌 신호 확인 → 위험 등급 판단 → 접촉기 개방 명령 → 고장 래치` |

### 파워트레인 · 충전 (`charge`)

**목적 원문:** `외부 전력을 안전한 전류로 협상해 고전압 배터리를 충전합니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `충전 연결·잠금 확인` | `요구 해석` | `커넥터 연결을 확인하고 충전구를 잠근 뒤 충전을 준비합니다.` | `충전 커넥터 삽입 → 연결 확인 → 커넥터 잠금 → 충전 준비` | `충전 인렛 → CP·PP 신호 → 충전구 잠금 액추에이터 → EVCC → VCU` | `PlugDetect → LockControl → ChargeStateMgr` | `PP 저항 판독 → CP 전압 상태 확인 → 잠금 조건 → 잠금 확인 타임아웃 → 충전 상태 전이` |
| `충전 전류 협상` | `제어·배분` | `충전기 능력과 배터리 수용 한계를 비교해 충전 전류를 정합니다.` | `충전기 능력 → 허용 전류 비교 → 충전 전류 결정 → 충전 시작` | `충전기 → EVCC → BMS → CAN 충전 요구 → OBC` | `ChargerCapRx → CurrentNegotiator → ChargeReqTx` | `충전기 한계 수신 → 배터리 수용 한계 → 전류 MIN → PWM 듀티 해석 → 램프율` |
| `OBC 변환 제어` | `실행·보호` | `교류를 직류로 바꾸며 요청된 전류로 팩을 충전합니다.` | `교류 입력 → 역률 보정 → 직류 변환 → 팩 충전` | `충전 인렛 → OBC → 충전 접촉기 → HV 버스 → 고전압 배터리` | `ObcCtrl → PfcRegulator → CurrentLoop → OvpGuard` | `입력 전압 검사 → PFC 전압 PI → 전류 추종 PI → 출력 제한 → 과전압 진단` |
| `충전 중 보호·종료` | `실행·보호` | `온도·절연 이상이나 목표 도달 때 충전을 멈추고 잠금을 풉니다.` | `이상 감지 → 충전 중단 → 접촉기 개방 → 종료 기록` | `모터 NTC 센서 → 전압·절연 센서 → BMS → OBC → 충전구 잠금 액추에이터` | `ChargeMonitor → StopHandler → UnlockCtrl` | `온도 임계 → 절연 임계 → SOC 종료 조건 → 충전 중단 명령 → 잠금 해제 조건 → 종료 상태 래치` |

### 파워트레인 · 열관리 (`thermal`)

**목적 원문:** `배터리·모터·인버터·실내 온도를 목표 범위로 유지해 성능과 수명을 지킵니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `온도 상태 추정` | `요구 해석` | `여러 온도 센서를 검증·필터링해 보호에 쓸 열 상태를 만듭니다.` | `부품 발열 → 온도 측정 → 열 상태 판단 → 열 요구` | `모터 NTC 센서 → 냉각수 온도센서 → Thermal ECU → VCU` | `TempAdapter → PlausibilityCheck → ThermalState` | `범위 검사 → 필터 → 최대값 선택` |
| `펌프·팬·컴프레서 제어` | `제어·배분` | `목표 온도에 맞춰 펌프 유량과 팬 회전수를 폐루프로 제어합니다.` | `열 요구 → 목표 유량·풍량 → 구동 명령 → 온도 저감` | `Thermal ECU → 냉각 펌프 → 냉각 팬 → RPM Feedback` | `TargetManager → PumpFanCtrl → FeedbackMonitor` | `히스테리시스 → PI 제어 → 무응답 진단` |
| `냉각·난방 회로 배분` | `제어·배분` | `히트펌프로 배터리·구동계·실내 회로에 열을 나누어 보냅니다.` | `열원 우선순위 → 운전 모드 → 회로 전환 → 열 이동` | `VCU → Thermal ECU → 전동 컴프레서 → 칠러 → 전자식 팽창밸브 → Valve Manifold → PTC 히터` | `ThermalModeMgr → ValveCtrl → CompressorCtrl → PositionMonitor` | `모드 상태기 → 전환 지연 → 밸브 위치 확인 → 컴프레서 회전수 맵 → 피드백 진단` |
| `열 한계 출력 제한` | `실행·보호` | `냉각이 부족하면 구동 출력을 단계적으로 낮춰 부품을 보호합니다.` | `온도 초과 → 디레이팅 단계 → 출력 제한 요청 → 부품 보호` | `Thermal ECU → VCU → Inverter → Cluster` | `DerateRequest → TorqueLimiter → RecoveryMgr → WarningLamp` | `단계 임계 → 램프 제한 → 복귀 히스테리시스` |

### 섀시 · 제동 (`brake`)

**목적 원문:** `감속 요구를 회생과 마찰로 나눠 안전하게 멈춥니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `제동력 요구 계산` | `요구 해석` | `페달 입력을 목표 감속도와 총 제동력으로 바꿉니다.` | `페달 조작 → 감속 의도 → 목표 감속도 → 총 제동력 → 차량 감속` | `페달 A/B 센서 → Brake ECU → 압력 제어기 → 유압 라인 → 4륜 캘리퍼` | `PedalInput → BrakeRequest → ForceTarget → PressureCmdTx` | `입력 상관성 → 페달 필터 → 감속 맵 → 힘 제한 → 압력 변환 → 출력 램프` |
| `회생·마찰 협조` | `제어·배분` | `가능한 회생제동을 먼저 쓰고 부족분을 마찰제동으로 채웁니다.` | `총 제동 요구 → 배터리 수용량 → 회생 한계 → 마찰 보상 → 전·후륜 배분 → 일관된 감속` | `Brake ECU → VCU → BMS → 인버터 → Hydraulic ECU → 모터·캘리퍼` | `RegenLimitRx → BlendManager → FrictionComp → HydraulicCmd` | `요구 수신 → 회생 가용량 → 회생 MIN → 잔여력 계산 → 마찰 압력 → 블렌딩 피드백` |
| `ABS·EBD 휠 슬립 제어` | `실행·보호` | `휠 슬립을 감시해 잠김 직전 바퀴의 압력을 조절합니다.` | `휠 잠김 징후 → 차속 추정 → 슬립 계산 → 밸브 조절 → 조향 가능 제동` | `4륜 속도센서 → ABS ECU → 유압 모듈레이터 → 솔레노이드 밸브 → 캘리퍼` | `WheelSpeedRx → SlipEstimator → AbsStateMgr → ValveDriver` | `휠속 필터 → 기준 차속 → 슬립 임계 → 감압·유지·증압 → 밸브 PWM → 재평가` |
| `ESC 차체 안정 제어` | `실행·보호` | `요 움직임을 감지해 바퀴별 제동력으로 자세를 안정시킵니다.` | `회전 불안정 → 목표 요율 → 요 오차 → 개별 휠 제동 → 차체 안정` | `요·횡가속 센서 → ESC ECU → Brake ECU → 유압 모듈 → 4륜 캘리퍼` | `MotionObserver → YawController → WheelAllocator → PressurePorts` | `센서 융합 → 목표 요율 → 오차 PI → 휠 선택 → 압력 제한 → 개입 종료` |

### 섀시 · 조향 (`steer`)

**목적 원문:** `핸들 입력과 EPS 보조를 전륜 각도로 바꿉니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `조향 입력 해석` | `요구 해석` | `핸들 각도를 검증해 목표 전륜각으로 바꿉니다.` | `핸들 회전 → 운전자 조향 의도 → 목표 전륜각 → 랙 이동 → 진로 변경` | `핸들각 센서 → EPS ECU → EPS 모터 → 랙·타이로드 → 전륜` | `AngleAdapter → SteerTarget → RackPosCtrl → AngleFeedback` | `각도 보정 → 조향비 맵 → 목표 랙 위치 → 추종 PI → 각도 제한 → 피드백 진단` |
| `EPS 보조 토크 계산` | `제어·배분` | `차속과 운전자 토크로 자연스러운 보조 토크를 만듭니다.` | `운전자 토크 → 차속 보정 → 보조 토크 → EPS 모터 → 가벼운 조향` | `토크 센서 → 차속 CAN → EPS ECU → 모터 인버터 → 조향축` | `TorqueAdapter → AssistMap → CurrentCtrl → MotorPort` | `센터 보정 → 토크 필터 → 속도별 맵 → 복원 토크 → 전류 PI → 보호 제한` |
| `모터 전류 제어·랙 구동` | `실행·보호` | `EPS 모터 회전을 랙과 타이로드로 양쪽 전륜에 전달합니다.` | `EPS 모터 → 웜 감속 → 피니언 → 랙 직선 이동 → 타이로드 → 좌·우 전륜각` | `EPS 모터 → 감속기 → 피니언 → 랙 → 타이로드 → 전륜 너클` | `RackObserver → TravelLimit → AngleConvert → FeedbackPort` | `모터각 → 기어비 → 랙 변환 → 스트로크 제한 → 아커만 보정 → 각도 피드백` |
| `폴백·안정 협조` | `실행·보호` | `센서 고장 때 보조를 줄이고 ESC와 협조해 진로를 유지합니다.` | `조향 요구 → 차체 요 반응 → 안정도 판단 → 오버레이 토크 → 진로 유지` | `조향각 센서 → IMU → ESC ECU → EPS ECU → 전륜` | `MotionInput → StabilityCoord → OverlayTorque → EpsPort` | `요율 오차 → 횡가속 검증 → 안정 협조 → 보정 게인 → 개입 제한 → 폴백` |

### 섀시 · 현가 (`suspension`)

**목적 원문:** `노면 충격을 흡수하고 타이어 접지와 차체 자세를 안정적으로 유지합니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `노면 입력 해석` | `요구 해석` | `가속도·차고 센서 값으로 노면과 차체 움직임을 파악합니다.` | `노면 요철 → 휠 상하 운동 → 센서 측정 → 노면 상태 판단` | `IMU → 휠 가속도센서 → 차고 높이 센서 → Chassis ECU` | `MotionAdapter → RoadEstimator → SensorPlausibility` | `가속도 필터 → 변위 보정 → 범위 검사 → 노면 등급 판단` |
| `댐핑력 제어` | `제어·배분` | `전자제어 댐퍼가 차속과 차체 운동에 맞춰 감쇠력을 조절합니다.` | `차체 운동 → 목표 감쇠력 → 밸브 전류 → 감쇠력` | `IMU → Chassis ECU → 댐퍼 밸브 → 댐퍼` | `DampingMap → CurrentCommand → DriveModeMgr` | `신호 필터 → 차속별 맵 → 맵 보간 → 전류 제한 → 폴백 댐핑` |
| `차고·자세 유지` | `제어·배분` | `에어 스프링 사양에서 차고 오차를 압력 조절로 바로잡습니다.` | `차고 오차 → 목표 압력 → 밸브·컴프레서 구동 → 차고 복원` | `차고 높이 센서 → Chassis ECU → Air Compressor → Air Spring` | `HeightControl → PressureCmd → LeakMonitor` | `목표 차고 설정 → 밸브 상태기 → 압력 제한 → 누설 진단` |
| `센서 고장 폴백` | `실행·보호` | `센서 이상을 판별해 고정 댐핑으로 바꾸고 경고합니다.` | `이상 징후 → 센서 판정 → 보호 모드 → 경고` | `휠 가속도센서 → 차고 높이 센서 → Chassis ECU → Cluster` | `FaultMonitor → FallbackSelector → WarningReq` | `신호 타당성 진단 → 임계 판단 → 고정 댐핑 전환 → 복귀 조건 → 경고 요청` |

### 섀시 · 변속·주차 (`gear`)

**목적 원문:** `운전자의 변속 의도를 검증해 주행 방향과 주차 잠금을 결정합니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `PRND 입력 판독` | `요구 해석` | `접점과 통신 신호를 서로 검증해 변속 의도를 확정합니다.` | `PRND 조작 → 접점·통신 확인 → 변속 의도 → 유효 상태` | `PRND 센서 → VCU → Cluster` | `GearAdapter → GearPlausibility → GearStateMgr` | `디바운스 → 접점·통신 상관성 → 상태 래치 → 타임아웃 확인` |
| `방향 전환 인터록` | `제어·배분` | `주행 중 반대 방향 선택을 막고 브레이크 조건을 확인합니다.` | `방향 요청 → 차속·브레이크 확인 → 방향 허용 → 거부 시 현재 유지` | `PRND → VCU → Brake ECU → Inverter` | `ShiftRequest → SafetyInterlock → DirectionPermit` | `차속 임계 → 브레이크 조건 → 방향 허용 Gate → 거부 진단` |
| `P단 잠금 제어` | `실행·보호` | `정지를 확인한 뒤 전동 파킹 액추에이터를 체결합니다.` | `P 요청 → 정지 확인 → 잠금 체결 → 차량 고정` | `VCU → Park ECU → Lock Actuator → Position Sensor` | `ParkRequest → ActuatorControl → LockFeedback` | `차속 0 확인 → 전류 제한 → 체결 위치 확인 → 체결 실패 진단` |
| `기어 상태 배포·표시` | `실행·보호` | `확정된 기어 상태를 계기판과 관련 제어기에 일관되게 전달합니다.` | `기어 상태 → 네트워크 송신 → 수신 확인 → 표시·제어` | `VCU → CAN → Cluster → Park ECU` | `StatePublisher → E2EProtect → TimeoutMonitor` | `상태 인코딩 → E2E 확인 → 롤링 카운터 → 타임아웃 → 기본값 처리` |

### 차량 제어 · 차량 통합 (`vcu`)

**목적 원문:** `차량 상태를 관리하고 도메인 요구를 중재해 안전한 동작을 결정합니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `차량 상태 관리` | `제어·배분` | `시동 요청과 조건을 보고 SLEEP·READY·DRIVE·FAULT 상태를 전환합니다.` | `시동 요청 → 상태 판단 → 상태 전이 → 주행 가능` | `START 버튼 → VCU → CAN 상태 → BMS` | `WakeupMgr → VehicleStateMgr → StateTx` | `시동 조건 확인 → 상태 전이 표 → 브레이크 조건 → READY 래치 → SLEEP 타임아웃` |
| `도메인 요구 중재` | `제어·배분` | `구동·제동·열 요구가 겹칠 때 우선순위를 정해 최종 요구를 확정합니다.` | `토크 요구 → 제동 요구 → 우선순위 판단 → 최종 요구` | `APS 가속 페달 → Brake ECU → VCU → MCU·인버터 ECU` | `RequestCollector → PriorityArbiter → RequestTx` | `요구 수신 → 우선순위 선택 → 충돌 요구 MIN → 램프율 → 최종 요구 확정` |
| `12V 전원 관리` | `실행·보호` | `DC/DC 출력을 조절해 12V 전장품에 안정적으로 전원을 공급합니다.` | `저전압 감시 → DC/DC 목표 → 12V 공급 → 전장품 동작` | `12V 배터리 → DC/DC → VCU → LV 부하` | `LvMonitor → DcdcController → LoadShedding` | `전압 범위 검사 → DCDC 목표 전압 맵 → 전류 제한 → 저전압 보호 판단 → 부하 차단 상태` |
| `고장 등급·안전 상태` | `실행·보호` | `제어기 고장을 등급으로 나누고 림프홈 같은 안전 상태로 전이합니다.` | `고장 감지 → 등급 판단 → 안전 상태 전이 → 경고 요청` | `각 제어기 → CAN 고장 코드 → VCU → Cluster` | `FaultCollector → SeverityClassifier → SafeStateMgr → WarningReq` | `고장 코드 수신 → 디바운스 → 등급 분류 → 림프홈 조건 → 안전 상태 래치` |

### 차량 제어 · 통신·진단 (`comm`)

**목적 원문:** `제어기 사이 신호를 전달하고 건전성을 감시하며 진단·원격 업데이트를 처리합니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `도메인 간 신호 전달` | `요구 해석` | `송신 제어기의 신호를 CAN과 게이트웨이를 거쳐 수신 제어기에 전달합니다.` | `송신 제어기 → 메시지 전송 → 수신 제어기 → 신호 반영` | `송신 ECU → CAN 버스 → 게이트웨이 → 수신 ECU` | `ComTx → PduRouter → ComRx` | `신호 패킹 → 주기 송신 → ID 필터 → 신호 언패킹 → 값 범위 확인` |
| `통신 건전성 감시` | `제어·배분` | `카운터·CRC·수신 주기를 확인하고 이상이면 안전한 값으로 바꿉니다.` | `메시지 수신 → 주기 확인 → 오류 판정 → 폴백 값` | `CAN 버스 → 게이트웨이 → VCU → 수신 ECU` | `E2EProtect → TimeoutMonitor → FallbackProvider` | `롤링 카운터 확인 → CRC 확인 → 타임아웃 → 오류 디바운스 → 폴백 값 적용` |
| `진단 요청·응답` | `실행·보호` | `진단 장비의 요청을 해석해 대상 제어기의 DTC와 상태를 응답합니다.` | `진단 요청 → 서비스 해석 → 제어기 응답 → 결과 표시` | `진단 장비 → 진단 포트 → 게이트웨이 → 대상 ECU` | `DcmSession → DiagService → DtcManager` | `세션 확인 → 서비스 ID 해석 → DTC 조회 → 응답 구성 → 오류 응답 처리` |
| `원격 진단·OTA` | `실행·보호` | `텔레매틱스 제어기로 서버와 통신하며 조건이 맞을 때 소프트웨어를 갱신합니다.` | `서버 요청 → 조건 확인 → 원격 전송 → 업데이트·보고` | `서버 → 텔레매틱스 제어기 → 게이트웨이 → 대상 ECU` | `RemoteDiag → UpdateGuard → ImageTransfer` | `차량 상태 조건 → 배터리 전압 조건 → 이미지 서명 확인 → 전송 재시도 → 업데이트 롤백` |

### 차량 제어 · 운전자 지원·HMI (`adas`)

**목적 원문:** `전방을 인지해 감속과 경고를 요청하고 상태를 운전자에게 알립니다.`

| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |
|---|---|---|---|---|---|---|
| `전방 인지` | `요구 해석` | `카메라와 레이더 정보를 융합해 앞 물체와 위험 거리를 판단합니다.` | `전방 물체 → 센서 측정 → 물체 융합 → 위험 판단` | `전방 카메라 → 전방 레이더 → ADAS ECU → CAN 물체 정보` | `CameraIf → RadarIf → ObjectFusion` | `신호 타당성 검사 → 시간 동기 → 객체 연결 → 신뢰도 선택 → 위험 거리 계산` |
| `목표 감속·거리 제어` | `제어·배분` | `충돌 시간을 계산해 필요한 목표 감속도를 제동·구동 쪽에 요청합니다.` | `전방 거리 → 충돌 위험 → 목표 감속도 → 감속 요청` | `ADAS ECU → CAN 감속 요청 → Brake ECU → VCU` | `TtcCalculator → DecelPlanner → RequestTx` | `충돌 시간 계산 → 개입 임계 → 목표 감속 맵 → 저크 제한 → 요청 출력` |
| `경고·개입 협조` | `실행·보호` | `경고 단계를 올리고 운전자 조작을 확인하며 제동·조향 개입을 중재합니다.` | `위험 등급 → 경고 단계 → 제동·조향 중재 → 운전자 개입` | `ADAS ECU → Brake ECU → EPS ECU → Cluster` | `WarningStage → InterventionArbiter → DriverOverride` | `경고 단계 상태기 → 운전자 조작 확인 → 개입 우선순위 → 개입 종료 조건` |
| `클러스터 표시·경고등` | `실행·보호` | `수신한 상태를 점등 조건에 따라 계기판과 경고등에 표시합니다.` | `상태 수신 → 표시 조건 → 경고등 점등 → 운전자 인지` | `CAN 상태 → Cluster → 경고등 표시` | `StateRx → LampLogic → DisplayDriver` | `상태 수신 확인 → 타임아웃 → 점등 조건 → 깜빡임 주기 → 기본값 처리` |

## 물리 차량/3D 원문과 모델 배치 근거

아래 원자료 JSON의 `physicalViewSourceRows`에는 `VehicleLayout.tsx`의 배치·신호 라벨 및 `vehicleSpec.ts`의 물리 인스턴스·조립체·배치 상태 소스 후보를 넣었습니다. `physicalVehicleSpec`에는 차량 3D가 구성하는 인스턴스·조립체·신호·동작 바인딩 전체가 들어 있습니다.

### 저장소 자체 참조/배치 검사 결과

다음은 코드에 구현된 검사 함수의 출력입니다. 검사기 자체가 모든 자동차 시스템의 옳고 그름을 증명하지 않으므로 건수는 검토 대기 항목으로 취급합니다. 세부 원소와 메시지는 JSON의 `builtInConsistencyChecks`를 보세요.

- 차량 명세: 64개 물리 인스턴스, 8개 조립체, 6개 신호 객체.
- 도메인 부품 참조 대조: 미해결 라벨 29개, 없는 물리/신호 참조 27개. 참조 규칙은 `vehicleSpec.ts:349-373`에 있습니다. 규칙 매핑 누락도 가능하므로 이 수치만으로 실제 부품 결함이라 하지 않습니다.
- 물리 명세 검사: 오류 0개, 경고 4개. 검사기는 `vehicleSpec.ts:375` 이후에 있습니다.

## 모든 정적 원문 행

JSON의 `sourceRows`는 소스에 저장된 UI 문자열 후보와 3D/E/E 안내 문구를 보존합니다. 네 관점의 기능 레이어는 영어 SW 이름도 포함해 TypeScript 데이터에서 직접 읽어 원문을 누락 없이 저장했습니다. 각 행의 파일·라인·keyPath·rawSource는 원자료 JSON에서 확인할 수 있습니다. 아래 인덱스는 화면 문자열의 빠른 검색용입니다.

| 파일·라인 | 심볼 | keyPath | 카테고리 | 원문 value |
|---|---|---|---|---|---|
| [src/experiences.tsx:49](../src/experiences.tsx#L49) | `learningLayers` | `learningLayers.[0].name` | 이름/신호 라벨 | `"Vehicle / System"` |
| [src/experiences.tsx:49](../src/experiences.tsx#L49) | `learningLayers` | `learningLayers.[0].tag` | 유형 태그 | `"기계 동작 흐름 · 차량 부품 위치"` |
| [src/experiences.tsx:50](../src/experiences.tsx#L50) | `learningLayers` | `learningLayers.[1].name` | 이름/신호 라벨 | `"E/E Architecture"` |
| [src/experiences.tsx:50](../src/experiences.tsx#L50) | `learningLayers` | `learningLayers.[1].tag` | 유형 태그 | `"하드웨어·소프트웨어 연결 · 센서·ECU·통신"` |
| [src/experiences.tsx:51](../src/experiences.tsx#L51) | `learningLayers` | `learningLayers.[2].name` | 이름/신호 라벨 | `"SW Architecture"` |
| [src/experiences.tsx:51](../src/experiences.tsx#L51) | `learningLayers` | `learningLayers.[2].tag` | 유형 태그 | `"제어기 안의 SW 컴포넌트(SWC) 구성과 연결"` |
| [src/experiences.tsx:52](../src/experiences.tsx#L52) | `learningLayers` | `learningLayers.[3].name` | 이름/신호 라벨 | `"Control Software"` |
| [src/experiences.tsx:52](../src/experiences.tsx#L52) | `learningLayers` | `learningLayers.[3].tag` | 유형 태그 | `"ECU 내부 SW 로직 · 제어 판단"` |
| [src/experiences.tsx:164](../src/experiences.tsx#L164) | `domainHardware` | `domainHardware.drive.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"APS 이중 페달 센서"` |
| [src/experiences.tsx:164](../src/experiences.tsx#L164) | `domainHardware` | `domainHardware.drive.labels.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"VCU 제어기"` |
| [src/experiences.tsx:164](../src/experiences.tsx#L164) | `domainHardware` | `domainHardware.drive.labels.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"인버터"` |
| [src/experiences.tsx:164](../src/experiences.tsx#L164) | `domainHardware` | `domainHardware.drive.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PMSM 모터·감속기"` |
| [src/experiences.tsx:165](../src/experiences.tsx#L165) | `domainHardware` | `domainHardware.brake.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"브레이크 페달·이중 센서"` |
| [src/experiences.tsx:165](../src/experiences.tsx#L165) | `domainHardware` | `domainHardware.brake.labels.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"유압 모듈레이터"` |
| [src/experiences.tsx:165](../src/experiences.tsx#L165) | `domainHardware` | `domainHardware.brake.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"디스크·캘리퍼"` |
| [src/experiences.tsx:166](../src/experiences.tsx#L166) | `domainHardware` | `domainHardware.steer.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"조향각·토크 센서"` |
| [src/experiences.tsx:166](../src/experiences.tsx#L166) | `domainHardware` | `domainHardware.steer.labels.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"EPS 보조 모터"` |
| [src/experiences.tsx:166](../src/experiences.tsx#L166) | `domainHardware` | `domainHardware.steer.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"랙·타이로드"` |
| [src/experiences.tsx:167](../src/experiences.tsx#L167) | `domainHardware` | `domainHardware.gear.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PRND 셀렉터"` |
| [src/experiences.tsx:167](../src/experiences.tsx#L167) | `domainHardware` | `domainHardware.gear.labels.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"VCU 변속 중재"` |
| [src/experiences.tsx:167](../src/experiences.tsx#L167) | `domainHardware` | `domainHardware.gear.labels.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"P단 잠금 액추에이터"` |
| [src/experiences.tsx:167](../src/experiences.tsx#L167) | `domainHardware` | `domainHardware.gear.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"인버터 방향 허용"` |
| [src/experiences.tsx:168](../src/experiences.tsx#L168) | `domainHardware` | `domainHardware.power.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"START 시동 버튼"` |
| [src/experiences.tsx:168](../src/experiences.tsx#L168) | `domainHardware` | `domainHardware.power.labels.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"프리차지·접촉기"` |
| [src/experiences.tsx:168](../src/experiences.tsx#L168) | `domainHardware` | `domainHardware.power.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고전압 배터리"` |
| [src/experiences.tsx:169](../src/experiences.tsx#L169) | `domainHardware` | `domainHardware.thermal.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"온도·유량 센서"` |
| [src/experiences.tsx:169](../src/experiences.tsx#L169) | `domainHardware` | `domainHardware.thermal.labels.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"냉각 펌프·밸브"` |
| [src/experiences.tsx:169](../src/experiences.tsx#L169) | `domainHardware` | `domainHardware.thermal.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"라디에이터 팬"` |
| [src/experiences.tsx:170](../src/experiences.tsx#L170) | `domainHardware` | `domainHardware.suspension.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차고·가속도 센서"` |
| [src/experiences.tsx:170](../src/experiences.tsx#L170) | `domainHardware` | `domainHardware.suspension.labels.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전자 댐퍼 밸브"` |
| [src/experiences.tsx:170](../src/experiences.tsx#L170) | `domainHardware` | `domainHardware.suspension.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"스프링·댐퍼"` |
| [src/experiences.tsx:171](../src/experiences.tsx#L171) | `domainHardware` | `domainHardware.charge.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 인렛·CP/PP 신호"` |
| [src/experiences.tsx:171](../src/experiences.tsx#L171) | `domainHardware` | `domainHardware.charge.labels.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 접촉기"` |
| [src/experiences.tsx:171](../src/experiences.tsx#L171) | `domainHardware` | `domainHardware.charge.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고전압 배터리"` |
| [src/experiences.tsx:172](../src/experiences.tsx#L172) | `domainHardware` | `domainHardware.comm.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"송신 제어기"` |
| [src/experiences.tsx:172](../src/experiences.tsx#L172) | `domainHardware` | `domainHardware.comm.labels.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 버스"` |
| [src/experiences.tsx:172](../src/experiences.tsx#L172) | `domainHardware` | `domainHardware.comm.labels.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"게이트웨이"` |
| [src/experiences.tsx:172](../src/experiences.tsx#L172) | `domainHardware` | `domainHardware.comm.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"수신 제어기"` |
| [src/experiences.tsx:173](../src/experiences.tsx#L173) | `domainHardware` | `domainHardware.vcu.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"START 시동 버튼"` |
| [src/experiences.tsx:173](../src/experiences.tsx#L173) | `domainHardware` | `domainHardware.vcu.labels.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"VCU 제어기"` |
| [src/experiences.tsx:173](../src/experiences.tsx#L173) | `domainHardware` | `domainHardware.vcu.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"도메인 제어기들"` |
| [src/experiences.tsx:174](../src/experiences.tsx#L174) | `domainHardware` | `domainHardware.adas.labels.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전방 카메라·레이더"` |
| [src/experiences.tsx:174](../src/experiences.tsx#L174) | `domainHardware` | `domainHardware.adas.labels.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"Cluster 경고등"` |
| [src/experiences.tsx:564](../src/experiences.tsx#L564) | `OWNER_OVERRIDE` | `OWNER_OVERRIDE.drive-3` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"인버터 ECU"` |
| [src/experiences.tsx:723](../src/experiences.tsx#L723) | `ROLE_TEXT` | `ROLE_TEXT.input.tag` | 유형 태그 | `"입력·센서"` |
| [src/experiences.tsx:723](../src/experiences.tsx#L723) | `ROLE_TEXT` | `ROLE_TEXT.input.what` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어기가 상황을 몰라요"` |
| [src/experiences.tsx:723](../src/experiences.tsx#L723) | `ROLE_TEXT` | `ROLE_TEXT.input.safe` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"기능 제한 + 경고등"` |
| [src/experiences.tsx:723](../src/experiences.tsx#L723) | `ROLE_TEXT` | `ROLE_TEXT.input.clue` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어기는 멀쩡한데 들어오는 값이 0이래"` |
| [src/experiences.tsx:724](../src/experiences.tsx#L724) | `ROLE_TEXT` | `ROLE_TEXT.control.tag` | 유형 태그 | `"제어기(ECU)"` |
| [src/experiences.tsx:724](../src/experiences.tsx#L724) | `ROLE_TEXT` | `ROLE_TEXT.control.what` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"명령이 하나도 안 나가요"` |
| [src/experiences.tsx:724](../src/experiences.tsx#L724) | `ROLE_TEXT` | `ROLE_TEXT.control.safe` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"기능 정지 + 경고등"` |
| [src/experiences.tsx:724](../src/experiences.tsx#L724) | `ROLE_TEXT` | `ROLE_TEXT.control.clue` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"센서 값은 잘 오는데 아무 명령도 안 나간대"` |
| [src/experiences.tsx:725](../src/experiences.tsx#L725) | `ROLE_TEXT` | `ROLE_TEXT.network.tag` | 유형 태그 | `"통신(메시지)"` |
| [src/experiences.tsx:725](../src/experiences.tsx#L725) | `ROLE_TEXT` | `ROLE_TEXT.network.what` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어기끼리 소식이 끊겨요"` |
| [src/experiences.tsx:725](../src/experiences.tsx#L725) | `ROLE_TEXT` | `ROLE_TEXT.network.safe` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"안전한 기본값 사용"` |
| [src/experiences.tsx:725](../src/experiences.tsx#L725) | `ROLE_TEXT` | `ROLE_TEXT.network.clue` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"양쪽 제어기는 멀쩡한데 서로 연락이 끊겼대"` |
| [src/experiences.tsx:726](../src/experiences.tsx#L726) | `ROLE_TEXT` | `ROLE_TEXT.actuator.tag` | 유형 태그 | `"액추에이터·부품"` |
| [src/experiences.tsx:726](../src/experiences.tsx#L726) | `ROLE_TEXT` | `ROLE_TEXT.actuator.what` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"명령은 오는데 안 움직여요"` |
| [src/experiences.tsx:726](../src/experiences.tsx#L726) | `ROLE_TEXT` | `ROLE_TEXT.actuator.safe` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고장 감지 + 경고등"` |
| [src/experiences.tsx:726](../src/experiences.tsx#L726) | `ROLE_TEXT` | `ROLE_TEXT.actuator.clue` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"명령은 100% 나갔는데 실제로는 안 움직였대"` |
| [src/experiences.tsx:727](../src/experiences.tsx#L727) | `ROLE_TEXT` | `ROLE_TEXT.result.tag` | 유형 태그 | `"차량 반응"` |
| [src/experiences.tsx:727](../src/experiences.tsx#L727) | `ROLE_TEXT` | `ROLE_TEXT.result.what` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부품이 아니라 결과예요!"` |
| [src/experiences.tsx:730](../src/experiences.tsx#L730) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.drive` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"페달을 밟아도 가속이 안 되거나 약해져요"` |
| [src/experiences.tsx:731](../src/experiences.tsx#L731) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.brake` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제동이 약해지거나 정지 거리가 늘어나요"` |
| [src/experiences.tsx:732](../src/experiences.tsx#L732) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.steer` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"핸들이 무거워지거나 원하는 만큼 안 돌아요"` |
| [src/experiences.tsx:733](../src/experiences.tsx#L733) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.power` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"READY가 안 켜지거나 출력이 제한돼요"` |
| [src/experiences.tsx:734](../src/experiences.tsx#L734) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.gear` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"변속이 안 되거나 P에서 안 풀려요"` |
| [src/experiences.tsx:735](../src/experiences.tsx#L735) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.thermal` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"온도가 올라 출력이 제한돼요(파워다운)"` |
| [src/experiences.tsx:736](../src/experiences.tsx#L736) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.suspension` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"승차감이 나빠지고 자세 제어가 약해져요"` |
| [src/experiences.tsx:737](../src/experiences.tsx#L737) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.charge` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전이 시작되지 않거나 중간에 멈춰요"` |
| [src/experiences.tsx:738](../src/experiences.tsx#L738) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.comm` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"신호가 끊겨 제어기들이 안전 값으로 동작해요"` |
| [src/experiences.tsx:739](../src/experiences.tsx#L739) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.vcu` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"READY가 안 되거나 고장 후 림프홈으로 전환돼요"` |
| [src/experiences.tsx:740](../src/experiences.tsx#L740) | `DOMAIN_SYMPTOM` | `DOMAIN_SYMPTOM.adas` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"경고나 자동 감속이 늦거나 불필요하게 걸려요"` |
| [src/experiences.tsx:756](../src/experiences.tsx#L756) | `ROLE_INTRO` | `ROLE_INTRO.input` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"물리량(페달 위치·온도·압력 등)을 측정해 전기 신호로 제어기에 보내는 센서"` |
| [src/experiences.tsx:757](../src/experiences.tsx#L757) | `ROLE_INTRO` | `ROLE_INTRO.control` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"입력 신호로 계산·판단해 명령 값을 출력하는 제어기(ECU)"` |
| [src/experiences.tsx:758](../src/experiences.tsx#L758) | `ROLE_INTRO` | `ROLE_INTRO.network` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어기 사이에서 값을 메시지로 전달하는 통신(CAN)"` |
| [src/experiences.tsx:759](../src/experiences.tsx#L759) | `ROLE_INTRO` | `ROLE_INTRO.actuator` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"명령 값에 따라 토크·압력·회전을 만드는 구동 부품(액추에이터)"` |
| [src/experiences.tsx:760](../src/experiences.tsx#L760) | `ROLE_INTRO` | `ROLE_INTRO.result` | 결과 문구 | `"부품 동작으로 나타나는 차량의 실제 거동"` |
| [src/experiences.tsx:763](../src/experiences.tsx#L763) | `SIGNAL_UNIT` | `SIGNAL_UNIT.[9].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"명령"` |
| [src/experiences.tsx:770](../src/experiences.tsx#L770) | `ROLE_DOES` | `ROLE_DOES.input` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`측정한 물리량을 전기 신호(‘${out}’)로 변환해 출력`"` |
| [src/experiences.tsx:771](../src/experiences.tsx#L771) | `ROLE_DOES` | `ROLE_DOES.control` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`입력 신호로 계산해 ‘${out}’ 명령 값을 출력`"` |
| [src/experiences.tsx:772](../src/experiences.tsx#L772) | `ROLE_DOES` | `ROLE_DOES.network` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`‘${out}’ 값을 CAN 메시지로 다음 제어기에 전달`"` |
| [src/experiences.tsx:773](../src/experiences.tsx#L773) | `ROLE_DOES` | `ROLE_DOES.actuator` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`명령 값에 따라 ‘${out}’을(를) 물리적으로 생성`"` |
| [src/experiences.tsx:774](../src/experiences.tsx#L774) | `ROLE_DOES` | `ROLE_DOES.result` | 결과 문구 | `"`차량 거동으로 나타남: ‘${out}’`"` |
| [src/experiences.tsx:788](../src/experiences.tsx#L788) | `FlowStepCard` | `<div>.<div>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"/"` |
| [src/experiences.tsx:788](../src/experiences.tsx#L788) | `FlowStepCard` | `<div>.<div>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"단계"` |
| [src/experiences.tsx:790](../src/experiences.tsx#L790) | `FlowStepCard` | `<div>.<div>.<div>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"◀"` |
| [src/experiences.tsx:792](../src/experiences.tsx#L792) | `FlowStepCard` | `<div>.<div>.<div>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"▶"` |
| [src/experiences.tsx:793](../src/experiences.tsx#L793) | `FlowStepCard` | `<div>.<div>.<div>.<button>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"auto ? \"⏸ 멈춤\" : \"▶ 자동 재생\""` |
| [src/experiences.tsx:793](../src/experiences.tsx#L793) | `FlowStepCard` | `<div>.<div>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"⏸ 멈춤"` |
| [src/experiences.tsx:793](../src/experiences.tsx#L793) | `FlowStepCard` | `<div>.<div>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"▶ 자동 재생"` |
| [src/experiences.tsx:797](../src/experiences.tsx#L797) | `FlowStepCard` | `<div>.<div>.<div>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"받는 값"` |
| [src/experiences.tsx:798](../src/experiences.tsx#L798) | `FlowStepCard` | `<div>.<div>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/experiences.tsx:799](../src/experiences.tsx#L799) | `FlowStepCard` | `<div>.<div>.<div>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"하는 일"` |
| [src/experiences.tsx:800](../src/experiences.tsx#L800) | `FlowStepCard` | `<div>.<div>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/experiences.tsx:801](../src/experiences.tsx#L801) | `FlowStepCard` | `<div>.<div>.<div>.<small>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"step === chain.length - 1 ? \"최종 출력\" : \"보내는 값\""` |
| [src/experiences.tsx:801](../src/experiences.tsx#L801) | `FlowStepCard` | `<div>.<div>.<div>.<small>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"최종 출력"` |
| [src/experiences.tsx:801](../src/experiences.tsx#L801) | `FlowStepCard` | `<div>.<div>.<div>.<small>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"보내는 값"` |
| [src/experiences.tsx:811](../src/experiences.tsx#L811) | `GaragePartPreview` | `<div>.@aria-label` | 동적 JSX 표현식(런타임 값/분기 포함) | `"`${label} 3D 모델`"` |
| [src/experiences.tsx:811](../src/experiences.tsx#L811) | `GaragePartPreview` | `<div>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`${label} 3D 모델`"` |
| [src/experiences.tsx:818](../src/experiences.tsx#L818) | `GaragePartPreview` | `<div>.<Canvas>.<OrbitControls>.@target.[0]` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/experiences.tsx:818](../src/experiences.tsx#L818) | `GaragePartPreview` | `<div>.<Canvas>.<OrbitControls>.@target.[1]` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/experiences.tsx:818](../src/experiences.tsx#L818) | `GaragePartPreview` | `<div>.<Canvas>.<OrbitControls>.@target.[2]` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/experiences.tsx:827](../src/experiences.tsx#L827) | `PartIntroCard` | `<div>.<button>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"닫기"` |
| [src/experiences.tsx:827](../src/experiences.tsx#L827) | `PartIntroCard` | `<div>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"×"` |
| [src/experiences.tsx:828](../src/experiences.tsx#L828) | `PartIntroCard` | `<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"partId\n      ? <GaragePartPreview id={partId} label={label} />\n      : <div className=\"ecuAssetPending\" role=\"status\">\n        <Icon name=\"warning\" />\n        <span>전용 3D 에셋 준비 중</span>\n      </div>"` |
| [src/experiences.tsx:831](../src/experiences.tsx#L831) | `PartIntroCard` | `<div>.<div>.<Icon>.@name` | 이름/신호 라벨 | `"warning"` |
| [src/experiences.tsx:832](../src/experiences.tsx#L832) | `PartIntroCard` | `<div>.<div>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"전용 3D 에셋 준비 중"` |
| [src/experiences.tsx:834](../src/experiences.tsx#L834) | `PartIntroCard` | `<div>.<div>.<div>.<i>.<Icon>.@name` | 이름/신호 라벨 | `"bulb"` |
| [src/experiences.tsx:835](../src/experiences.tsx#L835) | `PartIntroCard` | `<div>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"role !== \"result\" && <button className=\"ecuPull\" onClick={onPull}>이 부품 빼 보기</button>"` |
| [src/experiences.tsx:835](../src/experiences.tsx#L835) | `PartIntroCard` | `<div>.<div>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"이 부품 빼 보기"` |
| [src/experiences.tsx:864](../src/experiences.tsx#L864) | `PartInspector` | `<div>.@aria-label` | 동적 JSX 표현식(런타임 값/분기 포함) | `"`${label} 자세히 보기`"` |
| [src/experiences.tsx:864](../src/experiences.tsx#L864) | `PartInspector` | `<div>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`${label} 자세히 보기`"` |
| [src/experiences.tsx:872](../src/experiences.tsx#L872) | `PartInspector` | `<div>.<article>.<section>.<Canvas>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"partId\n            ? <FittedPart id={partId} size={1.5} demo={moving} castShadow={false} />\n            : <Html center>\n              <span className=\"garageMissingModel garageMissingModel--inspection\">전용 3D 에셋 미연결</span>\n            </Html>"` |
| [src/experiences.tsx:875](../src/experiences.tsx#L875) | `PartInspector` | `<div>.<article>.<section>.<Canvas>.<Html>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"전용 3D 에셋 미연결"` |
| [src/experiences.tsx:877](../src/experiences.tsx#L877) | `PartInspector` | `<div>.<article>.<section>.<Canvas>.<OrbitControls>.@target.[0]` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/experiences.tsx:877](../src/experiences.tsx#L877) | `PartInspector` | `<div>.<article>.<section>.<Canvas>.<OrbitControls>.@target.[1]` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/experiences.tsx:877](../src/experiences.tsx#L877) | `PartInspector` | `<div>.<article>.<section>.<Canvas>.<OrbitControls>.@target.[2]` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/experiences.tsx:880](../src/experiences.tsx#L880) | `PartInspector` | `<div>.<article>.<section>.<div>.<button>.<Icon>.@name` | 이름/신호 라벨 | `"repeat"` |
| [src/experiences.tsx:880](../src/experiences.tsx#L880) | `PartInspector` | `<div>.<article>.<section>.<div>.<button>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"spin ? \"회전 멈춤\" : \"360° 회전\""` |
| [src/experiences.tsx:880](../src/experiences.tsx#L880) | `PartInspector` | `<div>.<article>.<section>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"회전 멈춤"` |
| [src/experiences.tsx:880](../src/experiences.tsx#L880) | `PartInspector` | `<div>.<article>.<section>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"360° 회전"` |
| [src/experiences.tsx:881](../src/experiences.tsx#L881) | `PartInspector` | `<div>.<article>.<section>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"model?.moving.length ? <button className={moving ? \"on\" : \"\"} onClick={() => setMoving(value => !value)}><Icon name=\"gear\" /> 동작 {moving ? \"멈춤\" : \"보기\"}</button> : null"` |
| [src/experiences.tsx:881](../src/experiences.tsx#L881) | `PartInspector` | `<div>.<article>.<section>.<div>.<button>.<Icon>.@name` | 이름/신호 라벨 | `"gear"` |
| [src/experiences.tsx:881](../src/experiences.tsx#L881) | `PartInspector` | `<div>.<article>.<section>.<div>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"동작 "` |
| [src/experiences.tsx:881](../src/experiences.tsx#L881) | `PartInspector` | `<div>.<article>.<section>.<div>.<button>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"moving ? \"멈춤\" : \"보기\""` |
| [src/experiences.tsx:881](../src/experiences.tsx#L881) | `PartInspector` | `<div>.<article>.<section>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"멈춤"` |
| [src/experiences.tsx:881](../src/experiences.tsx#L881) | `PartInspector` | `<div>.<article>.<section>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"보기"` |
| [src/experiences.tsx:883](../src/experiences.tsx#L883) | `PartInspector` | `<div>.<article>.<section>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"끌어서 돌리기 · 휠 확대/축소 · Esc 닫기"` |
| [src/experiences.tsx:886](../src/experiences.tsx#L886) | `PartInspector` | `<div>.<article>.<section>.<button>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"닫기"` |
| [src/experiences.tsx:886](../src/experiences.tsx#L886) | `PartInspector` | `<div>.<article>.<section>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"×"` |
| [src/experiences.tsx:887](../src/experiences.tsx#L887) | `PartInspector` | `<div>.<article>.<section>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"도메인 · "` |
| [src/experiences.tsx:887](../src/experiences.tsx#L887) | `PartInspector` | `<div>.<article>.<section>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"· "` |
| [src/experiences.tsx:887](../src/experiences.tsx#L887) | `PartInspector` | `<div>.<article>.<section>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"/"` |
| [src/experiences.tsx:887](../src/experiences.tsx#L887) | `PartInspector` | `<div>.<article>.<section>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"단계"` |
| [src/experiences.tsx:892](../src/experiences.tsx#L892) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dt>` | 화면에 직접 렌더되는 JSX 문구 | `"받는 것"` |
| [src/experiences.tsx:892](../src/experiences.tsx#L892) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"index > 0 ? <>{chain[index - 1]} → <em>{signals[index - 1]}</em></> : \"운전자 조작·물리량\""` |
| [src/experiences.tsx:892](../src/experiences.tsx#L892) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 화면에 직접 렌더되는 JSX 문구 | `"→ "` |
| [src/experiences.tsx:892](../src/experiences.tsx#L892) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전자 조작·물리량"` |
| [src/experiences.tsx:893](../src/experiences.tsx#L893) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dt>` | 화면에 직접 렌더되는 JSX 문구 | `"하는 일"` |
| [src/experiences.tsx:894](../src/experiences.tsx#L894) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dt>` | 화면에 직접 렌더되는 JSX 문구 | `"보내는 곳"` |
| [src/experiences.tsx:894](../src/experiences.tsx#L894) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"index < chain.length - 1 ? <>{chain[index + 1]}</> : \"차량 거동으로 나타남\""` |
| [src/experiences.tsx:894](../src/experiences.tsx#L894) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 거동으로 나타남"` |
| [src/experiences.tsx:895](../src/experiences.tsx#L895) | `PartInspector` | `<div>.<article>.<section>.<dl>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"comp && comp.ports.length > 0 && <div><dt>신호·단위</dt><dd className=\"piPorts\">{comp.ports.map(port => <em key={port.id} className={port.direction}>{port.direction === \"in\" ? \"입력\" : \"출력\"} {port.signal ?? port.id} <i>{port.unit}</i></em>)}</dd></div>"` |
| [src/experiences.tsx:895](../src/experiences.tsx#L895) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dt>` | 화면에 직접 렌더되는 JSX 문구 | `"신호·단위"` |
| [src/experiences.tsx:895](../src/experiences.tsx#L895) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"comp.ports.map(port => <em key={port.id} className={port.direction}>{port.direction === \"in\" ? \"입력\" : \"출력\"} {port.signal ?? port.id} <i>{port.unit}</i></em>)"` |
| [src/experiences.tsx:895](../src/experiences.tsx#L895) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>.<em>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"port.direction === \"in\" ? \"입력\" : \"출력\""` |
| [src/experiences.tsx:895](../src/experiences.tsx#L895) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"입력"` |
| [src/experiences.tsx:895](../src/experiences.tsx#L895) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"출력"` |
| [src/experiences.tsx:896](../src/experiences.tsx#L896) | `PartInspector` | `<div>.<article>.<section>.<dl>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"ecu && <div><dt>연결 제어기</dt><dd>{ecu.name} · {ecu.interfaces.join(\" · \")}</dd></div>"` |
| [src/experiences.tsx:896](../src/experiences.tsx#L896) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dt>` | 화면에 직접 렌더되는 JSX 문구 | `"연결 제어기"` |
| [src/experiences.tsx:896](../src/experiences.tsx#L896) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 화면에 직접 렌더되는 JSX 문구 | `"· "` |
| [src/experiences.tsx:897](../src/experiences.tsx#L897) | `PartInspector` | `<div>.<article>.<section>.<dl>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"ecu && ecuIdFor(label) && <div><dt>주요 기능</dt><dd>{ecu.functions.join(\" · \")}</dd></div>"` |
| [src/experiences.tsx:897](../src/experiences.tsx#L897) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dt>` | 화면에 직접 렌더되는 JSX 문구 | `"주요 기능"` |
| [src/experiences.tsx:898](../src/experiences.tsx#L898) | `PartInspector` | `<div>.<article>.<section>.<dl>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"ecu && ecuIdFor(label) && ecu.actuators.length > 0 && <div><dt>구동 대상</dt><dd>{ecu.actuators.map(ko).join(\" · \")}</dd></div>"` |
| [src/experiences.tsx:898](../src/experiences.tsx#L898) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dt>` | 화면에 직접 렌더되는 JSX 문구 | `"구동 대상"` |
| [src/experiences.tsx:899](../src/experiences.tsx#L899) | `PartInspector` | `<div>.<article>.<section>.<dl>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"model?.moving[0] && <div><dt>움직임</dt><dd>{MOVE_TEXT[model.moving[0].mode] ?? \"움직이는 부분\"} 표시</dd></div>"` |
| [src/experiences.tsx:899](../src/experiences.tsx#L899) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dt>` | 화면에 직접 렌더되는 JSX 문구 | `"움직임"` |
| [src/experiences.tsx:899](../src/experiences.tsx#L899) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"MOVE_TEXT[model.moving[0].mode] ?? \"움직이는 부분\""` |
| [src/experiences.tsx:899](../src/experiences.tsx#L899) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"움직이는 부분"` |
| [src/experiences.tsx:899](../src/experiences.tsx#L899) | `PartInspector` | `<div>.<article>.<section>.<dl>.<div>.<dd>` | 화면에 직접 렌더되는 JSX 문구 | `"표시"` |
| [src/experiences.tsx:901](../src/experiences.tsx#L901) | `PartInspector` | `<div>.<article>.<section>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"!partId && <p className=\"piNote\">이 부품의 전용 3D 에셋이 아직 연결되지 않았습니다. 검수 대상에서 누락으로 기록됩니다.</p>"` |
| [src/experiences.tsx:901](../src/experiences.tsx#L901) | `PartInspector` | `<div>.<article>.<section>.<p>` | 화면에 직접 렌더되는 JSX 문구 | `"이 부품의 전용 3D 에셋이 아직 연결되지 않았습니다. 검수 대상에서 누락으로 기록됩니다."` |
| [src/experiences.tsx:944](../src/experiences.tsx#L944) | `GarageExperience` | `max` | 화면·시나리오 수치/모델 기준값 | `"4"` |
| [src/experiences.tsx:944](../src/experiences.tsx#L944) | `GarageExperience` | `max` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/experiences.tsx:1063](../src/experiences.tsx#L1063) | `GV3_VIEW_NAMES` | `GV3_VIEW_NAMES.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"기능 흐름"` |
| [src/experiences.tsx:1063](../src/experiences.tsx#L1063) | `GV3_VIEW_NAMES` | `GV3_VIEW_NAMES.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부품·E/E"` |
| [src/experiences.tsx:1063](../src/experiences.tsx#L1063) | `GV3_VIEW_NAMES` | `GV3_VIEW_NAMES.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"SW 구성"` |
| [src/experiences.tsx:1063](../src/experiences.tsx#L1063) | `GV3_VIEW_NAMES` | `GV3_VIEW_NAMES.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"SW 로직"` |
| [src/experiences.tsx:1064](../src/experiences.tsx#L1064) | `GV3_QUESTIONS` | `GV3_QUESTIONS.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"어떤 부품이 실제로 움직일까?"` |
| [src/experiences.tsx:1064](../src/experiences.tsx#L1064) | `GV3_QUESTIONS` | `GV3_QUESTIONS.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"입력은 어떤 경로로 전달될까?"` |
| [src/experiences.tsx:1064](../src/experiences.tsx#L1064) | `GV3_QUESTIONS` | `GV3_QUESTIONS.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어기 안에서 어떤 SW 컴포넌트가 일할까?"` |
| [src/experiences.tsx:1064](../src/experiences.tsx#L1064) | `GV3_QUESTIONS` | `GV3_QUESTIONS.[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"SW는 어떤 조건으로 출력을 정할까?"` |
| [src/experiences.tsx:1066](../src/experiences.tsx#L1066) | `gv3Mission` | `gv3Mission.question` | 질문 | `"어떤 기능을 체험해 볼까?"` |
| [src/experiences.tsx:1067](../src/experiences.tsx#L1067) | `gv3Mission` | `gv3Mission.action` | 행동/버튼 안내 | `"도메인을 하나 고르세요"` |
| [src/experiences.tsx:1068](../src/experiences.tsx#L1068) | `gv3Mission` | `gv3Mission.action` | 행동/버튼 안내 | `"`다음 조작 · ${missing[0].label}`"` |
| [src/experiences.tsx:1069](../src/experiences.tsx#L1069) | `gv3Mission` | `gv3Mission.action` | 행동/버튼 안내 | `"`${INPUT_ACTION[domain]} · 길게 누르기`"` |
| [src/experiences.tsx:1070](../src/experiences.tsx#L1070) | `gv3Mission` | `gv3Mission.action` | 행동/버튼 안내 | `"‘다음 스텝’으로 신호 따라가기"` |
| [src/experiences.tsx:1071](../src/experiences.tsx#L1071) | `gv3Mission` | `gv3Mission.action` | 행동/버튼 안내 | `"완료 · 다른 관점으로 같은 신호 확인"` |
| [src/experiences.tsx:1073](../src/experiences.tsx#L1073) | `GarageExperience` | `label` | 표시 라벨/선택지 | `"STEP01"` |
| [src/experiences.tsx:1080](../src/experiences.tsx#L1080) | `GarageExperience` | `<div>.<GameHeader>.@chapter` | 사건·챕터 라벨 | `"정비소"` |
| [src/experiences.tsx:1080](../src/experiences.tsx#L1080) | `GarageExperience` | `<div>.<GameHeader>.@title` | 제목 | `"차량 도메인 동작 원리"` |
| [src/experiences.tsx:1081](../src/experiences.tsx#L1081) | `GarageExperience` | `<div>.<StageFolderSubtitle>.@action` | 행동/버튼 안내 | `"차량 기능이 어떤 부품과 신호를 거쳐 동작하는지 확인하세요."` |
| [src/experiences.tsx:1081](../src/experiences.tsx#L1081) | `GarageExperience` | `<div>.<StageFolderSubtitle>.@detail` | 동적 JSX 표현식(런타임 값/분기 포함) | `"<>학습 대상: {chosen ? content.label : \"전체 도메인\"}</>"` |
| [src/experiences.tsx:1081](../src/experiences.tsx#L1081) | `GarageExperience` | `<div>.<StageFolderSubtitle>.@detail` | 화면에 직접 렌더되는 JSX 문구 | `"학습 대상: "` |
| [src/experiences.tsx:1081](../src/experiences.tsx#L1081) | `GarageExperience` | `<div>.<StageFolderSubtitle>.@detail` | 동적 JSX 표현식(런타임 값/분기 포함) | `"chosen ? content.label : \"전체 도메인\""` |
| [src/experiences.tsx:1081](../src/experiences.tsx#L1081) | `GarageExperience` | `<div>.<StageFolderSubtitle>.@detail` | 세부 설명 | `"전체 도메인"` |
| [src/experiences.tsx:1082](../src/experiences.tsx#L1082) | `GarageExperience` | `<div>.<StageIntro>.@title` | 제목 | `"정비소"` |
| [src/experiences.tsx:1082](../src/experiences.tsx#L1082) | `GarageExperience` | `<div>.<StageIntro>.@goal` | 교육 목표 | `"차량 기능이 부품·신호·SW를 거쳐 어떻게 동작하는지 이해하기"` |
| [src/experiences.tsx:1082](../src/experiences.tsx#L1082) | `GarageExperience` | `<div>.<StageIntro>.@steps` | 동적 JSX 표현식(런타임 값/분기 포함) | `"[\n      { icon: \"car\", text: chosen ? \"위 탭에서 도메인, 오른쪽에서 기능을 고르기\" : \"전체보기에서 파워트레인·섀시·차량 제어와 협조 신호를 먼저 살펴보기\" },\n      { icon: \"layers\", text: \"왼쪽 세 관점으로 같은 기능을 비교하기 (부품 · E/E 연결 · Control SW)\" },\n      { icon: \"signal\", text: \"입력 부품을 길게 눌러 신호가 한 단계씩 전달되는 과정 보기\" },\n    ]"` |
| [src/experiences.tsx:1083](../src/experiences.tsx#L1083) | `GarageExperience` | `<div>.<StageIntro>.@steps.[0].text` | 화면 안내/대사 | `"위 탭에서 도메인, 오른쪽에서 기능을 고르기"` |
| [src/experiences.tsx:1083](../src/experiences.tsx#L1083) | `GarageExperience` | `<div>.<StageIntro>.@steps.[0].text` | 화면 안내/대사 | `"전체보기에서 파워트레인·섀시·차량 제어와 협조 신호를 먼저 살펴보기"` |
| [src/experiences.tsx:1084](../src/experiences.tsx#L1084) | `GarageExperience` | `<div>.<StageIntro>.@steps.[1].text` | 화면 안내/대사 | `"왼쪽 세 관점으로 같은 기능을 비교하기 (부품 · E/E 연결 · Control SW)"` |
| [src/experiences.tsx:1085](../src/experiences.tsx#L1085) | `GarageExperience` | `<div>.<StageIntro>.@steps.[2].text` | 화면 안내/대사 | `"입력 부품을 길게 눌러 신호가 한 단계씩 전달되는 과정 보기"` |
| [src/experiences.tsx:1089](../src/experiences.tsx#L1089) | `GarageExperience` | `<div>.<div>.<nav>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"관점 선택"` |
| [src/experiences.tsx:1090](../src/experiences.tsx#L1090) | `GarageExperience` | `<div>.<div>.<nav>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"learningLayers.map((layer, index) => <button key={layer.name} onClick={() => selectLevel(index)} className={`${routeLevel === index ? \"active\" : \"\"} ${!chosen && index > 0 ? \"needsDomain\" : \"\"}`} title={!chosen && index > 0 ? \"도메인을 먼저 고르면 열려요\" : layer.tag}>\n        <span>{index + 1}</span><b>{GV3_VIEW_NAMES[index]}</b>\n      </button>)"` |
| [src/experiences.tsx:1090](../src/experiences.tsx#L1090) | `GarageExperience` | `<div>.<div>.<nav>.<button>.@title` | 동적 JSX 표현식(런타임 값/분기 포함) | `"!chosen && index > 0 ? \"도메인을 먼저 고르면 열려요\" : layer.tag"` |
| [src/experiences.tsx:1090](../src/experiences.tsx#L1090) | `GarageExperience` | `<div>.<div>.<nav>.<button>.@title` | 제목 | `"도메인을 먼저 고르면 열려요"` |
| [src/experiences.tsx:1095](../src/experiences.tsx#L1095) | `GarageExperience` | `<div>.<div>.<main>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"!chosen && overview3d && <nav className=\"domainTabs\" aria-label=\"도메인 바로가기\">\n        {DOMAIN_GROUPS.map(group => <div key={group} className=\"domainGroup\" style={{ \"--n\": DOMAIN_ORDER.filter(id => domainContent[id].group === group).length } as React.CSSProperties}>\n          <em className=\"groupName\">{group}</em>\n          <div className=\"groupBtns\">{DOMAIN_ORDER.filter(id => domainContent[id].group === group).map(id => <button key={id} title={domainContent[id].label} aria-label={domainContent[id].label} style={{ \"--domain\": domainContent[id].accent } as React.CSSProperties} onClick={() => setDomain(id)}><span><Icon name={DOMAIN_ICON[id]} /></span><b>{domainContent[id].label}</b></button>)}</div>\n        </div>)}\n      </nav>"` |
| [src/experiences.tsx:1095](../src/experiences.tsx#L1095) | `GarageExperience` | `<div>.<div>.<main>.<nav>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"도메인 바로가기"` |
| [src/experiences.tsx:1101](../src/experiences.tsx#L1101) | `GarageExperience` | `<div>.<div>.<main>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"chosen && <nav className=\"garageBreadcrumb\" aria-label=\"현재 정비소 위치\">\n        <button onClick={showAllDomains}><Icon name=\"car\" /> 차량 전체</button><span>›</span>\n        <button className=\"garageGroupCrumb\" onClick={() => chooseOverviewArea(content.group)}>{content.group}</button><span>›</span><strong>{content.label}</strong>\n        <label className=\"garageDomainSwitch\">다른 도메인\n          <select value={domain} onChange={event => setDomain(event.target.value as DomainId)} aria-label=\"다른 도메인으로 바로 이동\">\n            {DOMAIN_ORDER.map(id => <option key={id} value={id}>{domainContent[id].label}</option>)}\n          </select>\n        </label>\n        <button className=\"changeDomain\" onClick={showAllDomains}>영역 바꾸기</button>\n      </nav>"` |
| [src/experiences.tsx:1101](../src/experiences.tsx#L1101) | `GarageExperience` | `<div>.<div>.<main>.<nav>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"현재 정비소 위치"` |
| [src/experiences.tsx:1102](../src/experiences.tsx#L1102) | `GarageExperience` | `<div>.<div>.<main>.<nav>.<button>.<Icon>.@name` | 이름/신호 라벨 | `"car"` |
| [src/experiences.tsx:1102](../src/experiences.tsx#L1102) | `GarageExperience` | `<div>.<div>.<main>.<nav>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"차량 전체"` |
| [src/experiences.tsx:1102](../src/experiences.tsx#L1102) | `GarageExperience` | `<div>.<div>.<main>.<nav>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"›"` |
| [src/experiences.tsx:1103](../src/experiences.tsx#L1103) | `GarageExperience` | `<div>.<div>.<main>.<nav>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"›"` |
| [src/experiences.tsx:1104](../src/experiences.tsx#L1104) | `GarageExperience` | `<div>.<div>.<main>.<nav>.<label>` | 화면에 직접 렌더되는 JSX 문구 | `"다른 도메인\n          "` |
| [src/experiences.tsx:1105](../src/experiences.tsx#L1105) | `GarageExperience` | `<div>.<div>.<main>.<nav>.<label>.<select>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"다른 도메인으로 바로 이동"` |
| [src/experiences.tsx:1109](../src/experiences.tsx#L1109) | `GarageExperience` | `<div>.<div>.<main>.<nav>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"영역 바꾸기"` |
| [src/experiences.tsx:1112](../src/experiences.tsx#L1112) | `GarageExperience` | `<div>.<div>.<main>.<section>.<header>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"› "` |
| [src/experiences.tsx:1112](../src/experiences.tsx#L1112) | `GarageExperience` | `<div>.<div>.<main>.<section>.<header>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"› "` |
| [src/experiences.tsx:1114](../src/experiences.tsx#L1114) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"주황 · 현재 선택 단계"` |
| [src/experiences.tsx:1114](../src/experiences.tsx#L1114) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"파랑 · 입력/센서"` |
| [src/experiences.tsx:1114](../src/experiences.tsx#L1114) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"보라 · ECU/SW"` |
| [src/experiences.tsx:1115](../src/experiences.tsx#L1115) | `GarageExperience` | `<div>.<div>.<main>.<section>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"chosen && <div className=\"inputBar\" aria-label=\"입력 넣기\">\n          <p className={`inputStatus ${gateMsg ? \"warn\" : cleared ? \"ok\" : \"\"}`} role=\"status\">{gateMsg \|\| (inputSelected ? \"입력이 선택됨 · 다음 스텝으로 신호를 관찰하세요\" : cleared ? NORMAL_RESPONSE[domain] : missing.length ? `${conds.size ? \"준비 중\" : \"차량 OFF\"} · ${missing[0].label}부터 켜세요` : READY_RESPONSE[domain])}</p>\n          {mission.needs.map((item, index) => { const locked = mission.needs.slice(0, index).some(previous => !conds.has(previous.id)); return <button key={item.id} disabled={locked} className={`ctlBtn conditionCtl ${conds.has(item.id) ? \"on\" : \"\"} ${locked ? \"locked\" : \"\"}`} onClick={() => toggleCondition(item.id, index)}><i>{conds.has(item.id) ? \"✓\" : index + 1}</i><span>{item.label}</span></button>; })}\n          <button disabled={missing.length > 0} className={`ctlBtn mainCtl ${inputSelected ? \"pressing\" : \"\"}`} onPointerDown={event => { event.preventDefault(); beginInputHold(); }} onPointerUp={endInputHold} onPointerLeave={endInputHold} onPointerCancel={endInputHold}><i>{mission.needs.length + 1}</i><span>{INPUT_ACTION[domain]}</span><small>{inputSelected ? \"선택됨 · 꾹 해제\" : \"꾹 · Space\"}</small></button>\n        </div>"` |
| [src/experiences.tsx:1115](../src/experiences.tsx#L1115) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"입력 넣기"` |
| [src/experiences.tsx:1116](../src/experiences.tsx#L1116) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<p>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"gateMsg \|\| (inputSelected ? \"입력이 선택됨 · 다음 스텝으로 신호를 관찰하세요\" : cleared ? NORMAL_RESPONSE[domain] : missing.length ? `${conds.size ? \"준비 중\" : \"차량 OFF\"} · ${missing[0].label}부터 켜세요` : READY_RESPONSE[domain])"` |
| [src/experiences.tsx:1116](../src/experiences.tsx#L1116) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<p>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"입력이 선택됨 · 다음 스텝으로 신호를 관찰하세요"` |
| [src/experiences.tsx:1116](../src/experiences.tsx#L1116) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<p>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`${conds.size ? \"준비 중\" : \"차량 OFF\"} · ${missing[0].label}부터 켜세요`"` |
| [src/experiences.tsx:1116](../src/experiences.tsx#L1116) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<p>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"준비 중"` |
| [src/experiences.tsx:1116](../src/experiences.tsx#L1116) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<p>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 OFF"` |
| [src/experiences.tsx:1118](../src/experiences.tsx#L1118) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>.<small>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"inputSelected ? \"선택됨 · 꾹 해제\" : \"꾹 · Space\""` |
| [src/experiences.tsx:1118](../src/experiences.tsx#L1118) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>.<small>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"선택됨 · 꾹 해제"` |
| [src/experiences.tsx:1118](../src/experiences.tsx#L1118) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>.<small>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"꾹 · Space"` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"chosen && <div className=\"swStepControls garageStepControls\" aria-label=\"공통 신호 단계 조작\"><button className=\"ctlBtn\" onClick={() => { stopAuto(); if (!inputSelected) { setGateMsg(\"먼저 입력을 길게 눌러 선택하세요.\"); play(\"error\"); return; } if (activeStep >= flowLength - 1) { setActiveStep(0); setCleared(false); } else setActiveStep(value => { const next = value + 1; if (next === flowLength - 1) { setCleared(true); setCompletedLessons(previous => new Set(previous).add(`${domain}-${feature}`)); } return next; }); play(\"pop\", 1.1); }}>{activeStep >= flowLength - 1 ? \"처음으로\" : \"다음 스텝\"}</button><button className=\"ctlBtn\" onClick={() => { if (!inputSelected) { setGateMsg(\"먼저 입력을 길게 눌러 선택하세요.\"); play(\"error\"); return; } setAutoPlaying(value => !value); }}>{autoPlaying ? \"일시정지\" : \"자동재생\"}</button></div>"` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"공통 신호 단계 조작"` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>.@onClick` | 동적 JSX 표현식(런타임 값/분기 포함) | `"() => { stopAuto(); if (!inputSelected) { setGateMsg(\"먼저 입력을 길게 눌러 선택하세요.\"); play(\"error\"); return; } if (activeStep >= flowLength - 1) { setActiveStep(0); setCleared(false); } else setActiveStep(value => { const next = value + 1; if (next === flowLength - 1) { setCleared(true); setCompletedLessons(previous => new Set(previous).add(`${domain}-${feature}`)); } return next; }); play(\"pop\", 1.1); }"` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>.@onClick` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"먼저 입력을 길게 눌러 선택하세요."` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"activeStep >= flowLength - 1 ? \"처음으로\" : \"다음 스텝\""` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"처음으로"` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"다음 스텝"` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>.@onClick` | 동적 JSX 표현식(런타임 값/분기 포함) | `"() => { if (!inputSelected) { setGateMsg(\"먼저 입력을 길게 눌러 선택하세요.\"); play(\"error\"); return; } setAutoPlaying(value => !value); }"` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>.@onClick` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"먼저 입력을 길게 눌러 선택하세요."` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"autoPlaying ? \"일시정지\" : \"자동재생\""` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"일시정지"` |
| [src/experiences.tsx:1120](../src/experiences.tsx#L1120) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<button>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"자동재생"` |
| [src/experiences.tsx:1121](../src/experiences.tsx#L1121) | `GarageExperience` | `<div>.<div>.<main>.<section>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"SHOW_EE_TABS && chosen && routeLevel === 1 && (() => {\n          const parts = chain.map((label, index) => ({ label, index, role: partRole(label, index, chain.length) })).filter(item => item.role !== \"result\");\n          const pullOut = (index: number) => { setRemoved(index); setActiveStep(index); setEcuCard(null); setTriedRemovals(previous => new Set(previous).add(`${domain}-${feature}-${index}`)); play(\"squish\"); };\n          const startHunt = () => {\n            const pick = parts[Math.floor(Math.random() * parts.length)];\n            setCulprit(pick.index); setGuess(null); setRemoved(null); setEcuCard(null); setLabMode(\"hunt\"); play(\"siren\");\n          };\n          const answer = (index: number) => {\n            if (culprit === null \|\| guess?.right) return;\n            const right = index === culprit;\n            setGuess({ index, right });\n            if (right) { setRemoved(index); setCaught(value => value + 1); window.setTimeout(() => { play(\"stamp\"); play(\"success\"); }, 60); } else play(\"error\");\n          };\n          return <div className={`pullOutLab mode-${labMode}`}>\n            <header>\n              <nav className=\"labTabs\">\n                <button className={labMode === \"flow\" ? \"on\" : \"\"} onClick={() => { setLabMode(\"flow\"); setRemoved(null); setCulprit(null); setEcuCard(null); setActiveStep(0); }}><Icon name=\"compass\" /> 흐름 따라가기</button>\n                <button className={labMode === \"intro\" ? \"on\" : \"\"} onClick={() => { setLabMode(\"intro\"); setRemoved(null); setCulprit(null); }}>① 부품 소개</button>\n                {SHOW_PULL_TABS && <button className={labMode === \"pull\" ? \"on\" : \"\"} onClick={() => { setLabMode(\"pull\"); setCulprit(null); setEcuCard(null); }}>② 빼 보기</button>}\n                {SHOW_PULL_TABS && <button className={labMode === \"hunt\" ? \"on\" : \"\"} onClick={startHunt}>③ 범인 찾기{caught ? ` · ${caught}` : \"\"}</button>}\n              </nav>\n              <em>{labMode === \"flow\" ? \"부품을 누르면 아래에 받는 값 · 하는 일 · 보내는 값이 나와요\" : labMode === \"intro\" ? \"부품을 눌러 무슨 일을 하는지 보세요\" : labMode === \"pull\" ? \"부품을 하나 빼면 차가 어떻게 될까?\" : `${ENGINEER}의 문제: 빠진 부품을 찾아보세요`}</em>\n            </header>\n            {labMode !== \"flow\" && <div className=\"pullOutChain\">{chain.map((label, index) => { const role = partRole(label, index, chain.length); return <React.Fragment key={`${label}-${index}`}>\n              {index > 0 && <i className={removed !== null && (removed === index \|\| removed === index - 1) ? \"broken\" : \"\"}>→</i>}\n              <button disabled={labMode === \"hunt\" \|\| (role === \"result\" && labMode === \"pull\")} className={`${removed === index ? \"is-out\" : \"\"} ${ecuCard === index ? \"is-open\" : \"\"} role-${role}`} onClick={() => {\n                if (labMode === \"intro\") { setEcuCard(ecuCard === index ? null : index); setActiveStep(index); play(\"pop\"); return; }\n                if (removed === index) { setRemoved(null); return; }\n                pullOut(index);\n              }}>\n                <small>{ROLE_TEXT[role].tag}</small><b>{label}</b>\n                <em>{labMode === \"intro\" ? \"소개\" : labMode === \"hunt\" ? \"?\" : removed === index ? \"↩ 다시 끼우기\" : role === \"result\" ? \"결과\" : \"빼 보기\"}</em>\n              </button>\n            </React.Fragment>; })}</div>}\n            {labMode === \"intro\" && ecuCard !== null && <PartIntroCard label={chain[ecuCard]} role={partRole(chain[ecuCard], ecuCard, chain.length)} domain={domain} onClose={() => setEcuCard(null)} onPull={() => { setLabMode(\"pull\"); pullOut(ecuCard); }} />}\n            {labMode === \"pull\" && removed !== null && <PullOutBubble domain={domain} label={chain[removed]} role={partRole(chain[removed], removed, chain.length)} />}\n            {labMode === \"hunt\" && culprit !== null && <div className=\"pullOutBubble huntQuiz\"><img src=\"/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png\" alt=\"\" /><div>\n              <p><b>{guess?.right ? \"맞아요. 빠진 부품을 찾았어요\" : guess ? \"그 부품은 정상이에요\" : \"어느 부품이 빠졌는지 단서로 찾아보세요\"}</b>{DOMAIN_SYMPTOM[domain]}<span className=\"pullOutChips\"><em><Icon name=\"clue\" /> 단서: {ROLE_TEXT[partRole(chain[culprit], culprit, chain.length)].clue}</em></span></p>\n              <div className=\"quizChoices\">{parts.map(item => <button key={item.index} disabled={Boolean(guess?.right)} className={guess?.index === item.index ? guess.right ? \"right\" : \"wrong\" : guess?.right && item.index === culprit ? \"right\" : \"\"} onClick={() => answer(item.index)}>{item.label}</button>)}</div>\n              {guess?.right && <button className=\"huntButton\" onClick={startHunt}>한 번 더!</button>}\n            </div></div>}\n          </div>;\n        })()"` |
| [src/experiences.tsx:1137](../src/experiences.tsx#L1137) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<nav>.<button>.<Icon>.@name` | 이름/신호 라벨 | `"compass"` |
| [src/experiences.tsx:1137](../src/experiences.tsx#L1137) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<nav>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"흐름 따라가기"` |
| [src/experiences.tsx:1138](../src/experiences.tsx#L1138) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<nav>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"① 부품 소개"` |
| [src/experiences.tsx:1139](../src/experiences.tsx#L1139) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<nav>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"SHOW_PULL_TABS && <button className={labMode === \"pull\" ? \"on\" : \"\"} onClick={() => { setLabMode(\"pull\"); setCulprit(null); setEcuCard(null); }}>② 빼 보기</button>"` |
| [src/experiences.tsx:1139](../src/experiences.tsx#L1139) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<nav>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"② 빼 보기"` |
| [src/experiences.tsx:1140](../src/experiences.tsx#L1140) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<nav>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"SHOW_PULL_TABS && <button className={labMode === \"hunt\" ? \"on\" : \"\"} onClick={startHunt}>③ 범인 찾기{caught ? ` · ${caught}` : \"\"}</button>"` |
| [src/experiences.tsx:1140](../src/experiences.tsx#L1140) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<nav>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"③ 범인 찾기"` |
| [src/experiences.tsx:1142](../src/experiences.tsx#L1142) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<em>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"labMode === \"flow\" ? \"부품을 누르면 아래에 받는 값 · 하는 일 · 보내는 값이 나와요\" : labMode === \"intro\" ? \"부품을 눌러 무슨 일을 하는지 보세요\" : labMode === \"pull\" ? \"부품을 하나 빼면 차가 어떻게 될까?\" : `${ENGINEER}의 문제: 빠진 부품을 찾아보세요`"` |
| [src/experiences.tsx:1142](../src/experiences.tsx#L1142) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부품을 누르면 아래에 받는 값 · 하는 일 · 보내는 값이 나와요"` |
| [src/experiences.tsx:1142](../src/experiences.tsx#L1142) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부품을 눌러 무슨 일을 하는지 보세요"` |
| [src/experiences.tsx:1142](../src/experiences.tsx#L1142) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부품을 하나 빼면 차가 어떻게 될까?"` |
| [src/experiences.tsx:1142](../src/experiences.tsx#L1142) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<header>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`${ENGINEER}의 문제: 빠진 부품을 찾아보세요`"` |
| [src/experiences.tsx:1144](../src/experiences.tsx#L1144) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"labMode !== \"flow\" && <div className=\"pullOutChain\">{chain.map((label, index) => { const role = partRole(label, index, chain.length); return <React.Fragment key={`${label}-${index}`}>\n              {index > 0 && <i className={removed !== null && (removed === index \|\| removed === index - 1) ? \"broken\" : \"\"}>→</i>}\n              <button disabled={labMode === \"hunt\" \|\| (role === \"result\" && labMode === \"pull\")} className={`${removed === index ? \"is-out\" : \"\"} ${ecuCard === index ? \"is-open\" : \"\"} role-${role}`} onClick={() => {\n                if (labMode === \"intro\") { setEcuCard(ecuCard === index ? null : index); setActiveStep(index); play(\"pop\"); return; }\n                if (removed === index) { setRemoved(null); return; }\n                pullOut(index);\n              }}>\n                <small>{ROLE_TEXT[role].tag}</small><b>{label}</b>\n                <em>{labMode === \"intro\" ? \"소개\" : labMode === \"hunt\" ? \"?\" : removed === index ? \"↩ 다시 끼우기\" : role === \"result\" ? \"결과\" : \"빼 보기\"}</em>\n              </button>\n            </React.Fragment>; })}</div>"` |
| [src/experiences.tsx:1144](../src/experiences.tsx#L1144) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"chain.map((label, index) => { const role = partRole(label, index, chain.length); return <React.Fragment key={`${label}-${index}`}>\n              {index > 0 && <i className={removed !== null && (removed === index \|\| removed === index - 1) ? \"broken\" : \"\"}>→</i>}\n              <button disabled={labMode === \"hunt\" \|\| (role === \"result\" && labMode === \"pull\")} className={`${removed === index ? \"is-out\" : \"\"} ${ecuCard === index ? \"is-open\" : \"\"} role-${role}`} onClick={() => {\n                if (labMode === \"intro\") { setEcuCard(ecuCard === index ? null : index); setActiveStep(index); play(\"pop\"); return; }\n                if (removed === index) { setRemoved(null); return; }\n                pullOut(index);\n              }}>\n                <small>{ROLE_TEXT[role].tag}</small><b>{label}</b>\n                <em>{labMode === \"intro\" ? \"소개\" : labMode === \"hunt\" ? \"?\" : removed === index ? \"↩ 다시 끼우기\" : role === \"result\" ? \"결과\" : \"빼 보기\"}</em>\n              </button>\n            </React.Fragment>; })"` |
| [src/experiences.tsx:1145](../src/experiences.tsx#L1145) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<React.Fragment>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/experiences.tsx:1152](../src/experiences.tsx#L1152) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<React.Fragment>.<button>.<em>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"labMode === \"intro\" ? \"소개\" : labMode === \"hunt\" ? \"?\" : removed === index ? \"↩ 다시 끼우기\" : role === \"result\" ? \"결과\" : \"빼 보기\""` |
| [src/experiences.tsx:1152](../src/experiences.tsx#L1152) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<React.Fragment>.<button>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"소개"` |
| [src/experiences.tsx:1152](../src/experiences.tsx#L1152) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<React.Fragment>.<button>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"↩ 다시 끼우기"` |
| [src/experiences.tsx:1152](../src/experiences.tsx#L1152) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<React.Fragment>.<button>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"결과"` |
| [src/experiences.tsx:1152](../src/experiences.tsx#L1152) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<React.Fragment>.<button>.<em>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"빼 보기"` |
| [src/experiences.tsx:1157](../src/experiences.tsx#L1157) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"labMode === \"hunt\" && culprit !== null && <div className=\"pullOutBubble huntQuiz\"><img src=\"/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png\" alt=\"\" /><div>\n              <p><b>{guess?.right ? \"맞아요. 빠진 부품을 찾았어요\" : guess ? \"그 부품은 정상이에요\" : \"어느 부품이 빠졌는지 단서로 찾아보세요\"}</b>{DOMAIN_SYMPTOM[domain]}<span className=\"pullOutChips\"><em><Icon name=\"clue\" /> 단서: {ROLE_TEXT[partRole(chain[culprit], culprit, chain.length)].clue}</em></span></p>\n              <div className=\"quizChoices\">{parts.map(item => <button key={item.index} disabled={Boolean(guess?.right)} className={guess?.index === item.index ? guess.right ? \"right\" : \"wrong\" : guess?.right && item.index === culprit ? \"right\" : \"\"} onClick={() => answer(item.index)}>{item.label}</button>)}</div>\n              {guess?.right && <button className=\"huntButton\" onClick={startHunt}>한 번 더!</button>}\n            </div></div>"` |
| [src/experiences.tsx:1157](../src/experiences.tsx#L1157) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<img>.@alt` | 이미지 대체 텍스트 | `""` |
| [src/experiences.tsx:1158](../src/experiences.tsx#L1158) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<div>.<p>.<b>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"guess?.right ? \"맞아요. 빠진 부품을 찾았어요\" : guess ? \"그 부품은 정상이에요\" : \"어느 부품이 빠졌는지 단서로 찾아보세요\""` |
| [src/experiences.tsx:1158](../src/experiences.tsx#L1158) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<div>.<p>.<b>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"맞아요. 빠진 부품을 찾았어요"` |
| [src/experiences.tsx:1158](../src/experiences.tsx#L1158) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<div>.<p>.<b>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"그 부품은 정상이에요"` |
| [src/experiences.tsx:1158](../src/experiences.tsx#L1158) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<div>.<p>.<b>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"어느 부품이 빠졌는지 단서로 찾아보세요"` |
| [src/experiences.tsx:1158](../src/experiences.tsx#L1158) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<div>.<p>.<span>.<em>.<Icon>.@name` | 이름/신호 라벨 | `"clue"` |
| [src/experiences.tsx:1158](../src/experiences.tsx#L1158) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<div>.<p>.<span>.<em>` | 화면에 직접 렌더되는 JSX 문구 | `"단서: "` |
| [src/experiences.tsx:1160](../src/experiences.tsx#L1160) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"guess?.right && <button className=\"huntButton\" onClick={startHunt}>한 번 더!</button>"` |
| [src/experiences.tsx:1160](../src/experiences.tsx#L1160) | `GarageExperience` | `<div>.<div>.<main>.<section>.<div>.<div>.<div>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"한 번 더!"` |
| [src/experiences.tsx:1165](../src/experiences.tsx#L1165) | `GarageExperience` | `<div>.<div>.<main>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"!chosen && <aside className=\"domainFunctionShelf garageArchitectureShelf\">\n        <div className=\"garageArchitectureSideMount\" aria-label=\"차량 아키텍처 탐색\" />\n      </aside>"` |
| [src/experiences.tsx:1166](../src/experiences.tsx#L1166) | `GarageExperience` | `<div>.<div>.<main>.<aside>.<div>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 아키텍처 탐색"` |
| [src/experiences.tsx:1168](../src/experiences.tsx#L1168) | `GarageExperience` | `<div>.<div>.<main>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"!chosen && <div className=\"garageFooterRow\"><section className=\"garageFlowPanel garageFlowEmpty\"><small>신호 흐름</small><b className=\"flowRelationship\">도메인과 기능을 고르면 입력 → ECU → 출력 순서가 여기에 나와요.</b><div /></section><button className=\"garageProceed primary stageProgressAction\" onClick={() => send({ type: \"OPEN_LEVELS\" })}>다음 →</button></div>"` |
| [src/experiences.tsx:1168](../src/experiences.tsx#L1168) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"신호 흐름"` |
| [src/experiences.tsx:1168](../src/experiences.tsx#L1168) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"도메인과 기능을 고르면 입력 → ECU → 출력 순서가 여기에 나와요."` |
| [src/experiences.tsx:1168](../src/experiences.tsx#L1168) | `GarageExperience` | `<div>.<div>.<main>.<div>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"다음 →"` |
| [src/experiences.tsx:1169](../src/experiences.tsx#L1169) | `GarageExperience` | `<div>.<div>.<main>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"chosen && <aside className={`domainFunctionShelf ${domain === \"drive\" && feature === 0 ? \"withPedalLab\" : \"\"}`}>\n        <small>주요 기능</small><h2>{content.label}의 주요 기능</h2>\n        {content.functions.map((item, index) => <button key={item} className={feature === index ? \"active\" : \"\"} onClick={() => setFeature(index)}><span>{index + 1}</span><b>{item}</b><em className=\"featureCat\">{content.categories[index]}</em><i>›</i></button>)}\n        <div className=\"functionNote\"><b>{content.functions[feature]}</b><p>{selectedFeature.summary}</p><small>{ownerController(domain, feature) ? `실행 제어기 · ${ownerController(domain, feature)!.name}` : \"여러 제어기가 나눠 실행\"}</small></div>\n        {domain === \"drive\" && feature === 0 && <PedalLab />}\n      </aside>"` |
| [src/experiences.tsx:1170](../src/experiences.tsx#L1170) | `GarageExperience` | `<div>.<div>.<main>.<aside>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"주요 기능"` |
| [src/experiences.tsx:1170](../src/experiences.tsx#L1170) | `GarageExperience` | `<div>.<div>.<main>.<aside>.<h2>` | 화면에 직접 렌더되는 JSX 문구 | `"의 주요 기능"` |
| [src/experiences.tsx:1171](../src/experiences.tsx#L1171) | `GarageExperience` | `<div>.<div>.<main>.<aside>.<button>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"›"` |
| [src/experiences.tsx:1172](../src/experiences.tsx#L1172) | `GarageExperience` | `<div>.<div>.<main>.<aside>.<div>.<small>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"ownerController(domain, feature) ? `실행 제어기 · ${ownerController(domain, feature)!.name}` : \"여러 제어기가 나눠 실행\""` |
| [src/experiences.tsx:1172](../src/experiences.tsx#L1172) | `GarageExperience` | `<div>.<div>.<main>.<aside>.<div>.<small>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`실행 제어기 · ${ownerController(domain, feature)!.name}`"` |
| [src/experiences.tsx:1172](../src/experiences.tsx#L1172) | `GarageExperience` | `<div>.<div>.<main>.<aside>.<div>.<small>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"여러 제어기가 나눠 실행"` |
| [src/experiences.tsx:1175](../src/experiences.tsx#L1175) | `GarageExperience` | `<div>.<div>.<main>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"chosen && <div className=\"garageFooterRow\"><section className=\"garageFlowPanel\">\n        <small>{content.functions[feature]} · {learningLayers[routeLevel].tag}</small>\n        <b className=\"flowRelationship\">{routeLevel === 3 ? \"핵심 제어 SW를 물리 입력·출력 경계와 함께 추적\" : routeLevel === 2 ? \"제어기 안 SW 컴포넌트가 포트로 값을 넘기는 순서\" : \"선택한 기능에 필요한 경계만 표시 · 단계 수는 기능마다 달라집니다\"}</b>\n        {routeLevel === 1 ? <FlowStepCard chain={chain} signals={flowSignals(domain, feature, chain.length)} step={Math.min(activeStep, chain.length - 1)} onStep={i => { setActiveStep(i); play(\"pop\", 1 + i * .08); }} /> : <div>{(routeLevel === 3 ? [getFeatureLayer(domain, feature, 1)[0], getFeatureLayer(domain, feature, 1).at(-1)!] : getFeatureLayer(domain, feature, garageLayerSource[routeLevel])).map((node, index, flow) => { const step = index ? (routeLevel === 3 ? getFeatureLayer(domain, feature, 3).length - 1 : index) : 0; return <React.Fragment key={`${node}-${index}`}><button onClick={() => inspectStep(index, step)} className={`${index === 0 \|\| index === flow.length - 1 ? \"focus\" : \"\"} ${(activeStep === index \|\| routeLevel === 3 && index === 1 && activeStep === getFeatureLayer(domain, feature, 3).length - 1) ? \"activeStep\" : \"\"}`}><i>{index + 1}</i><b>{node}</b><span>{index === 0 ? \"입력\" : index === flow.length - 1 ? \"출력\" : routeLevel === 0 ? \"기능 단계\" : routeLevel === 2 ? \"SW 컴포넌트\" : \"부품·제어기\"}</span></button>{index < flow.length - 1 && <em>→</em>}</React.Fragment>; })}</div>}\n      </section><button className=\"garageProceed primary stageProgressAction\" onClick={() => send({ type: \"OPEN_LEVELS\" })}>다음 →</button></div>"` |
| [src/experiences.tsx:1176](../src/experiences.tsx#L1176) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"· "` |
| [src/experiences.tsx:1177](../src/experiences.tsx#L1177) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<b>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"routeLevel === 3 ? \"핵심 제어 SW를 물리 입력·출력 경계와 함께 추적\" : routeLevel === 2 ? \"제어기 안 SW 컴포넌트가 포트로 값을 넘기는 순서\" : \"선택한 기능에 필요한 경계만 표시 · 단계 수는 기능마다 달라집니다\""` |
| [src/experiences.tsx:1177](../src/experiences.tsx#L1177) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<b>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"핵심 제어 SW를 물리 입력·출력 경계와 함께 추적"` |
| [src/experiences.tsx:1177](../src/experiences.tsx#L1177) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<b>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어기 안 SW 컴포넌트가 포트로 값을 넘기는 순서"` |
| [src/experiences.tsx:1177](../src/experiences.tsx#L1177) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<b>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"선택한 기능에 필요한 경계만 표시 · 단계 수는 기능마다 달라집니다"` |
| [src/experiences.tsx:1178](../src/experiences.tsx#L1178) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"routeLevel === 1 ? <FlowStepCard chain={chain} signals={flowSignals(domain, feature, chain.length)} step={Math.min(activeStep, chain.length - 1)} onStep={i => { setActiveStep(i); play(\"pop\", 1 + i * .08); }} /> : <div>{(routeLevel === 3 ? [getFeatureLayer(domain, feature, 1)[0], getFeatureLayer(domain, feature, 1).at(-1)!] : getFeatureLayer(domain, feature, garageLayerSource[routeLevel])).map((node, index, flow) => { const step = index ? (routeLevel === 3 ? getFeatureLayer(domain, feature, 3).length - 1 : index) : 0; return <React.Fragment key={`${node}-${index}`}><button onClick={() => inspectStep(index, step)} className={`${index === 0 \|\| index === flow.length - 1 ? \"focus\" : \"\"} ${(activeStep === index \|\| routeLevel === 3 && index === 1 && activeStep === getFeatureLayer(domain, feature, 3).length - 1) ? \"activeStep\" : \"\"}`}><i>{index + 1}</i><b>{node}</b><span>{index === 0 ? \"입력\" : index === flow.length - 1 ? \"출력\" : routeLevel === 0 ? \"기능 단계\" : routeLevel === 2 ? \"SW 컴포넌트\" : \"부품·제어기\"}</span></button>{index < flow.length - 1 && <em>→</em>}</React.Fragment>; })}</div>"` |
| [src/experiences.tsx:1178](../src/experiences.tsx#L1178) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"(routeLevel === 3 ? [getFeatureLayer(domain, feature, 1)[0], getFeatureLayer(domain, feature, 1).at(-1)!] : getFeatureLayer(domain, feature, garageLayerSource[routeLevel])).map((node, index, flow) => { const step = index ? (routeLevel === 3 ? getFeatureLayer(domain, feature, 3).length - 1 : index) : 0; return <React.Fragment key={`${node}-${index}`}><button onClick={() => inspectStep(index, step)} className={`${index === 0 \|\| index === flow.length - 1 ? \"focus\" : \"\"} ${(activeStep === index \|\| routeLevel === 3 && index === 1 && activeStep === getFeatureLayer(domain, feature, 3).length - 1) ? \"activeStep\" : \"\"}`}><i>{index + 1}</i><b>{node}</b><span>{index === 0 ? \"입력\" : index === flow.length - 1 ? \"출력\" : routeLevel === 0 ? \"기능 단계\" : routeLevel === 2 ? \"SW 컴포넌트\" : \"부품·제어기\"}</span></button>{index < flow.length - 1 && <em>→</em>}</React.Fragment>; })"` |
| [src/experiences.tsx:1178](../src/experiences.tsx#L1178) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<div>.<React.Fragment>.<button>.<span>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"index === 0 ? \"입력\" : index === flow.length - 1 ? \"출력\" : routeLevel === 0 ? \"기능 단계\" : routeLevel === 2 ? \"SW 컴포넌트\" : \"부품·제어기\""` |
| [src/experiences.tsx:1178](../src/experiences.tsx#L1178) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<div>.<React.Fragment>.<button>.<span>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"입력"` |
| [src/experiences.tsx:1178](../src/experiences.tsx#L1178) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<div>.<React.Fragment>.<button>.<span>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"출력"` |
| [src/experiences.tsx:1178](../src/experiences.tsx#L1178) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<div>.<React.Fragment>.<button>.<span>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"기능 단계"` |
| [src/experiences.tsx:1178](../src/experiences.tsx#L1178) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<div>.<React.Fragment>.<button>.<span>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"SW 컴포넌트"` |
| [src/experiences.tsx:1178](../src/experiences.tsx#L1178) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<div>.<React.Fragment>.<button>.<span>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부품·제어기"` |
| [src/experiences.tsx:1178](../src/experiences.tsx#L1178) | `GarageExperience` | `<div>.<div>.<main>.<div>.<section>.<div>.<React.Fragment>.<em>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/experiences.tsx:1179](../src/experiences.tsx#L1179) | `GarageExperience` | `<div>.<div>.<main>.<div>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"다음 →"` |
| [src/experiences.tsx:1188](../src/experiences.tsx#L1188) | `INPUT_MISSION` | `INPUT_MISSION.drive.needs.[0].label` | 표시 라벨/선택지 | `"READY 켜기"` |
| [src/experiences.tsx:1188](../src/experiences.tsx#L1188) | `INPUT_MISSION` | `INPUT_MISSION.drive.needs.[0].why` | 판정 근거/해설 | `"READY(주행 준비)가 꺼져 있으면 구동 토크가 나가지 않아요."` |
| [src/experiences.tsx:1188](../src/experiences.tsx#L1188) | `INPUT_MISSION` | `INPUT_MISSION.drive.needs.[1].label` | 표시 라벨/선택지 | `"D단"` |
| [src/experiences.tsx:1188](../src/experiences.tsx#L1188) | `INPUT_MISSION` | `INPUT_MISSION.drive.needs.[1].why` | 판정 근거/해설 | `"D단이 아니면 VCU가 구동 토크를 막아요(변속 인터록)."` |
| [src/experiences.tsx:1189](../src/experiences.tsx#L1189) | `INPUT_MISSION` | `INPUT_MISSION.brake.needs.[0].label` | 표시 라벨/선택지 | `"READY 켜기"` |
| [src/experiences.tsx:1189](../src/experiences.tsx#L1189) | `INPUT_MISSION` | `INPUT_MISSION.brake.needs.[0].why` | 판정 근거/해설 | `"READY가 꺼져 있으면 제동 협조(회생) 계산이 시작되지 않아요."` |
| [src/experiences.tsx:1190](../src/experiences.tsx#L1190) | `INPUT_MISSION` | `INPUT_MISSION.steer.needs.[0].label` | 표시 라벨/선택지 | `"READY 켜기"` |
| [src/experiences.tsx:1190](../src/experiences.tsx#L1190) | `INPUT_MISSION` | `INPUT_MISSION.steer.needs.[0].why` | 판정 근거/해설 | `"READY가 꺼져 있으면 EPS 보조가 동작하지 않아요."` |
| [src/experiences.tsx:1191](../src/experiences.tsx#L1191) | `INPUT_MISSION` | `INPUT_MISSION.power.needs.[0].label` | 표시 라벨/선택지 | `"브레이크 밟기"` |
| [src/experiences.tsx:1191](../src/experiences.tsx#L1191) | `INPUT_MISSION` | `INPUT_MISSION.power.needs.[0].why` | 판정 근거/해설 | `"브레이크를 밟은 상태에서 시동 버튼을 눌러야 READY가 돼요."` |
| [src/experiences.tsx:1192](../src/experiences.tsx#L1192) | `INPUT_MISSION` | `INPUT_MISSION.gear.needs.[0].label` | 표시 라벨/선택지 | `"READY 켜기"` |
| [src/experiences.tsx:1192](../src/experiences.tsx#L1192) | `INPUT_MISSION` | `INPUT_MISSION.gear.needs.[0].why` | 판정 근거/해설 | `"READY가 꺼져 있으면 변속할 수 없어요."` |
| [src/experiences.tsx:1192](../src/experiences.tsx#L1192) | `INPUT_MISSION` | `INPUT_MISSION.gear.needs.[1].label` | 표시 라벨/선택지 | `"브레이크 밟기"` |
| [src/experiences.tsx:1192](../src/experiences.tsx#L1192) | `INPUT_MISSION` | `INPUT_MISSION.gear.needs.[1].why` | 판정 근거/해설 | `"브레이크를 밟아야 P에서 다른 단으로 바뀌어요(변속 잠금)."` |
| [src/experiences.tsx:1193](../src/experiences.tsx#L1193) | `INPUT_MISSION` | `INPUT_MISSION.thermal.needs.[0].label` | 표시 라벨/선택지 | `"READY 켜기"` |
| [src/experiences.tsx:1193](../src/experiences.tsx#L1193) | `INPUT_MISSION` | `INPUT_MISSION.thermal.needs.[0].why` | 판정 근거/해설 | `"READY가 꺼져 있으면 냉각 펌프·팬 제어가 시작되지 않아요."` |
| [src/experiences.tsx:1194](../src/experiences.tsx#L1194) | `INPUT_MISSION` | `INPUT_MISSION.suspension.needs.[0].label` | 표시 라벨/선택지 | `"READY 켜기"` |
| [src/experiences.tsx:1194](../src/experiences.tsx#L1194) | `INPUT_MISSION` | `INPUT_MISSION.suspension.needs.[0].why` | 판정 근거/해설 | `"READY가 꺼져 있으면 전자제어 댐퍼가 동작하지 않아요."` |
| [src/experiences.tsx:1195](../src/experiences.tsx#L1195) | `INPUT_MISSION` | `INPUT_MISSION.charge.needs.[0].label` | 표시 라벨/선택지 | `"P단 정차"` |
| [src/experiences.tsx:1195](../src/experiences.tsx#L1195) | `INPUT_MISSION` | `INPUT_MISSION.charge.needs.[0].why` | 판정 근거/해설 | `"충전 중에는 차량이 움직이지 않도록 P단이어야 해요."` |
| [src/experiences.tsx:1196](../src/experiences.tsx#L1196) | `INPUT_MISSION` | `INPUT_MISSION.comm.needs.[0].label` | 표시 라벨/선택지 | `"READY 켜기"` |
| [src/experiences.tsx:1196](../src/experiences.tsx#L1196) | `INPUT_MISSION` | `INPUT_MISSION.comm.needs.[0].why` | 판정 근거/해설 | `"READY가 꺼져 있으면 대부분의 제어기 통신이 쉬고 있어요."` |
| [src/experiences.tsx:1197](../src/experiences.tsx#L1197) | `INPUT_MISSION` | `INPUT_MISSION.vcu.needs.[0].label` | 표시 라벨/선택지 | `"브레이크 밟기"` |
| [src/experiences.tsx:1197](../src/experiences.tsx#L1197) | `INPUT_MISSION` | `INPUT_MISSION.vcu.needs.[0].why` | 판정 근거/해설 | `"브레이크를 밟은 상태에서 시동 요청이 들어와야 READY로 전환돼요."` |
| [src/experiences.tsx:1198](../src/experiences.tsx#L1198) | `INPUT_MISSION` | `INPUT_MISSION.adas.needs.[0].label` | 표시 라벨/선택지 | `"READY 켜기"` |
| [src/experiences.tsx:1198](../src/experiences.tsx#L1198) | `INPUT_MISSION` | `INPUT_MISSION.adas.needs.[0].why` | 판정 근거/해설 | `"READY가 꺼져 있으면 전방 인지와 개입 로직이 동작하지 않아요."` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.drive` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가속 페달 밟기"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.brake` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"브레이크 밟기"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.steer` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"핸들 돌리기"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.power` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"시동 버튼 누르기"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.gear` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"D단 고르기"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.thermal` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고속 주행 열 부하"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.suspension` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요철 지나가기"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.charge` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 커넥터 꽂기"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.comm` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"진단 요청 보내기"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.vcu` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"시동 버튼 누르기"` |
| [src/experiences.tsx:1200](../src/experiences.tsx#L1200) | `INPUT_ACTION` | `INPUT_ACTION.adas` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"앞차에 가까워지기"` |
| [src/experiences.tsx:1202](../src/experiences.tsx#L1202) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.drive` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"토크 명령이 모터와 전륜까지 전달돼 차량이 가속해요."` |
| [src/experiences.tsx:1203](../src/experiences.tsx#L1203) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.brake` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"회생·마찰 제동 명령이 합쳐져 차량이 안정적으로 감속해요."` |
| [src/experiences.tsx:1204](../src/experiences.tsx#L1204) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.steer` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"EPS 보조 토크가 생기고 랙이 움직여 전륜 각도가 바뀌어요."` |
| [src/experiences.tsx:1205](../src/experiences.tsx#L1205) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.power` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"팩 안전 확인과 프리차지를 거쳐 접촉기가 닫히고 READY가 켜져요."` |
| [src/experiences.tsx:1206](../src/experiences.tsx#L1206) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.gear` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"변속 인터록을 통과한 D단 상태가 구동계와 계기판에 전달돼요."` |
| [src/experiences.tsx:1207](../src/experiences.tsx#L1207) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.thermal` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"펌프·팬 명령이 출력되고 냉각수가 순환해 온도를 낮춰요."` |
| [src/experiences.tsx:1208](../src/experiences.tsx#L1208) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.suspension` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"댐퍼 명령과 스프링 변위가 노면 충격을 흡수해 차체를 안정시켜요."` |
| [src/experiences.tsx:1209](../src/experiences.tsx#L1209) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.charge` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"연결과 잠금을 확인하고 협상한 전류로 OBC가 팩을 충전해요."` |
| [src/experiences.tsx:1210](../src/experiences.tsx#L1210) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.comm` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"메시지가 정해진 주기로 전달되고 수신 제어기가 값을 반영해요."` |
| [src/experiences.tsx:1211](../src/experiences.tsx#L1211) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.vcu` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"시동 조건을 확인해 상태가 전환되고 도메인 요구가 중재돼요."` |
| [src/experiences.tsx:1212](../src/experiences.tsx#L1212) | `NORMAL_RESPONSE` | `NORMAL_RESPONSE.adas` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전방 물체를 판단해 경고하고 필요하면 감속을 요청해요."` |
| [src/experiences.tsx:1215](../src/experiences.tsx#L1215) | `READY_RESPONSE` | `READY_RESPONSE.drive` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"구동 조건 완료 · 가속 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1216](../src/experiences.tsx#L1216) | `READY_RESPONSE` | `READY_RESPONSE.brake` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제동 제어 준비 완료 · 브레이크 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1217](../src/experiences.tsx#L1217) | `READY_RESPONSE` | `READY_RESPONSE.steer` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"EPS 준비 완료 · 핸들 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1218](../src/experiences.tsx#L1218) | `READY_RESPONSE` | `READY_RESPONSE.power` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"시동 조건 완료 · START 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1219](../src/experiences.tsx#L1219) | `READY_RESPONSE` | `READY_RESPONSE.gear` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"변속 조건 완료 · D단 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1220](../src/experiences.tsx#L1220) | `READY_RESPONSE` | `READY_RESPONSE.thermal` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"열관리 준비 완료 · 열 부하 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1221](../src/experiences.tsx#L1221) | `READY_RESPONSE` | `READY_RESPONSE.suspension` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"현가 제어 준비 완료 · 요철 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1222](../src/experiences.tsx#L1222) | `READY_RESPONSE` | `READY_RESPONSE.charge` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 조건 완료 · 커넥터 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1223](../src/experiences.tsx#L1223) | `READY_RESPONSE` | `READY_RESPONSE.comm` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"통신 준비 완료 · 진단 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1224](../src/experiences.tsx#L1224) | `READY_RESPONSE` | `READY_RESPONSE.vcu` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"상태 전환 조건 완료 · 시동 입력을 꾹 누르세요"` |
| [src/experiences.tsx:1225](../src/experiences.tsx#L1225) | `READY_RESPONSE` | `READY_RESPONSE.adas` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"지원 기능 준비 완료 · 접근 입력을 꾹 누르세요"` |
| [src/features/garage/ArchitectureOverview.tsx:25](../src/features/garage/ArchitectureOverview.tsx#L25) | `ArchitectureTreePanel` | `<aside>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 아키텍처 탐색"` |
| [src/features/garage/ArchitectureOverview.tsx:26](../src/features/garage/ArchitectureOverview.tsx#L26) | `ArchitectureTreePanel` | `<aside>.<header>.<Icon>.@name` | 이름/신호 라벨 | `"layers"` |
| [src/features/garage/ArchitectureOverview.tsx:26](../src/features/garage/ArchitectureOverview.tsx#L26) | `ArchitectureTreePanel` | `<aside>.<header>.<div>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"아키텍처 탐색"` |
| [src/features/garage/ArchitectureOverview.tsx:26](../src/features/garage/ArchitectureOverview.tsx#L26) | `ArchitectureTreePanel` | `<aside>.<header>.<div>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"차량 전체 › 영역 › 도메인"` |
| [src/features/garage/ArchitectureOverview.tsx:28](../src/features/garage/ArchitectureOverview.tsx#L28) | `ArchitectureTreePanel` | `<aside>.<button>.<Icon>.@name` | 이름/신호 라벨 | `"car"` |
| [src/features/garage/ArchitectureOverview.tsx:28](../src/features/garage/ArchitectureOverview.tsx#L28) | `ArchitectureTreePanel` | `<aside>.<button>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"차량 전체"` |
| [src/features/garage/ArchitectureOverview.tsx:28](../src/features/garage/ArchitectureOverview.tsx#L28) | `ArchitectureTreePanel` | `<aside>.<button>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"3D 보기"` |
| [src/features/garage/ArchitectureOverview.tsx:31](../src/features/garage/ArchitectureOverview.tsx#L31) | `ArchitectureTreePanel` | `<aside>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"DOMAIN_GROUPS.map((group, groupIndex) => {\n        const ids = DOMAIN_ORDER.filter(id => EV_DOMAINS[id].group === group);\n        return <section key={group} className={`garageTreeSection g-${groupIndex} ${activeGroup === group ? \"on\" : \"\"}`}>\n          <button className=\"garageTreeGroup\" onClick={() => onGroup(group)}>\n            <b>{group}</b><small>{ids.length}개 도메인</small>\n          </button>\n          <div className=\"garageTreeDomains\">\n            {ids.map(id => <button key={id} onClick={() => onDomain(id)} title={`${group} · ${EV_DOMAINS[id].label}`}>\n              <Icon name={icons[id]} /><span>{EV_DOMAINS[id].label}</span><small>기능 {EV_DOMAINS[id].features.length}개</small>\n            </button>)}\n          </div>\n        </section>;\n      })"` |
| [src/features/garage/ArchitectureOverview.tsx:35](../src/features/garage/ArchitectureOverview.tsx#L35) | `ArchitectureTreePanel` | `<aside>.<div>.<section>.<button>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"개 도메인"` |
| [src/features/garage/ArchitectureOverview.tsx:38](../src/features/garage/ArchitectureOverview.tsx#L38) | `ArchitectureTreePanel` | `<aside>.<div>.<section>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"ids.map(id => <button key={id} onClick={() => onDomain(id)} title={`${group} · ${EV_DOMAINS[id].label}`}>\n              <Icon name={icons[id]} /><span>{EV_DOMAINS[id].label}</span><small>기능 {EV_DOMAINS[id].features.length}개</small>\n            </button>)"` |
| [src/features/garage/ArchitectureOverview.tsx:38](../src/features/garage/ArchitectureOverview.tsx#L38) | `ArchitectureTreePanel` | `<aside>.<div>.<section>.<div>.<button>.@title` | 제목 | `"`${group} · ${EV_DOMAINS[id].label}`"` |
| [src/features/garage/ArchitectureOverview.tsx:39](../src/features/garage/ArchitectureOverview.tsx#L39) | `ArchitectureTreePanel` | `<aside>.<div>.<section>.<div>.<button>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"기능 "` |
| [src/features/garage/ArchitectureOverview.tsx:39](../src/features/garage/ArchitectureOverview.tsx#L39) | `ArchitectureTreePanel` | `<aside>.<div>.<section>.<div>.<button>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"개"` |
| [src/features/garage/ArchitectureOverview.tsx:45](../src/features/garage/ArchitectureOverview.tsx#L45) | `ArchitectureTreePanel` | `<aside>.<button>.<Icon>.@name` | 이름/신호 라벨 | `"car"` |
| [src/features/garage/ArchitectureOverview.tsx:45](../src/features/garage/ArchitectureOverview.tsx#L45) | `ArchitectureTreePanel` | `<aside>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"차량 3D 보기"` |
| [src/features/garage/ArchitectureOverview.tsx:94](../src/features/garage/ArchitectureOverview.tsx#L94) | `ioModels` | `ioModels.파워트레인` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"파워트레인"` |
| [src/features/garage/ArchitectureOverview.tsx:95](../src/features/garage/ArchitectureOverview.tsx#L95) | `ioModels` | `ioModels.섀시` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"섀시"` |
| [src/features/garage/ArchitectureOverview.tsx:96](../src/features/garage/ArchitectureOverview.tsx#L96) | `ioModels` | `ioModels.차량 제어` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 제어"` |
| [src/features/garage/ArchitectureOverview.tsx:100](../src/features/garage/ArchitectureOverview.tsx#L100) | `groupCards` | `groupCards.<div>.<p>.<span>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"영역을 선택하세요"` |
| [src/features/garage/ArchitectureOverview.tsx:100](../src/features/garage/ArchitectureOverview.tsx#L100) | `groupCards` | `groupCards.<div>.<p>.<span>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"영역 안의 도메인 버튼을 눌러 기능 흐름을 살펴볼 수 있어요."` |
| [src/features/garage/ArchitectureOverview.tsx:101](../src/features/garage/ArchitectureOverview.tsx#L101) | `groupCards` | `groupCards.<div>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"DOMAIN_GROUPS.map((group, gi) => {\n      const ids = DOMAIN_ORDER.filter(id => EV_DOMAINS[id].group === group);\n      const io = OVERVIEW_IO[group];\n      return <section key={group} className={`archGroupCard g-${gi}`}>\n        <button className=\"archGroupHeading\" onClick={() => pickGroup(group)}><span className=\"archAreaMark\"><Icon name={gi === 0 ? \"gear\" : gi === 1 ? \"wheel\" : \"chip\"} /></span><span><b>{group}</b><small>{GROUP_ROLE[group]}</small></span><i>영역 보기 →</i></button>\n        <div className=\"archGroupVisual\" aria-hidden=\"true\"><span><Icon name=\"signal\" /></span><i>→</i><div>{ids.map(id => <em key={id} style={{ \"--domain\": EV_DOMAINS[id].accent } as React.CSSProperties}><Icon name={icons[id]} /></em>)}</div><i>→</i><span><Icon name=\"car\" /></span></div>\n        <div className=\"archGroupIo\">\n          <div className=\"archIoItems\"><b>입력 요소</b>{io.inputs.map((item, index) => <span key={item}><img src={hardwareThumb(ioModels[group].inputs[index])} alt=\"\" /><i>{item}</i></span>)}</div>\n          <div className=\"archIoItems\"><b>출력 요소</b>{io.outputs.map((item, index) => <span key={item}><img src={hardwareThumb(ioModels[group].outputs[index])} alt=\"\" /><i>{item}</i></span>)}</div>\n        </div>\n        <div className=\"archDomainButtons\" aria-label={`${group} 도메인`}>\n          {ids.map(id => <button key={id} onClick={() => onPick(id)} style={{ \"--domain\": EV_DOMAINS[id].accent } as React.CSSProperties}><Icon name={icons[id]} /><span>{EV_DOMAINS[id].label}</span><small>열기</small></button>)}\n        </div>\n      </section>;\n    })"` |
| [src/features/garage/ArchitectureOverview.tsx:105](../src/features/garage/ArchitectureOverview.tsx#L105) | `groupCards` | `groupCards.<div>.<div>.<section>.<button>.<span>.<Icon>.@name` | 이름/신호 라벨 | `"gear"` |
| [src/features/garage/ArchitectureOverview.tsx:105](../src/features/garage/ArchitectureOverview.tsx#L105) | `groupCards` | `groupCards.<div>.<div>.<section>.<button>.<span>.<Icon>.@name` | 이름/신호 라벨 | `"wheel"` |
| [src/features/garage/ArchitectureOverview.tsx:105](../src/features/garage/ArchitectureOverview.tsx#L105) | `groupCards` | `groupCards.<div>.<div>.<section>.<button>.<span>.<Icon>.@name` | 이름/신호 라벨 | `"chip"` |
| [src/features/garage/ArchitectureOverview.tsx:105](../src/features/garage/ArchitectureOverview.tsx#L105) | `groupCards` | `groupCards.<div>.<div>.<section>.<button>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"영역 보기 →"` |
| [src/features/garage/ArchitectureOverview.tsx:106](../src/features/garage/ArchitectureOverview.tsx#L106) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.<span>.<Icon>.@name` | 이름/신호 라벨 | `"signal"` |
| [src/features/garage/ArchitectureOverview.tsx:106](../src/features/garage/ArchitectureOverview.tsx#L106) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/features/garage/ArchitectureOverview.tsx:106](../src/features/garage/ArchitectureOverview.tsx#L106) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/features/garage/ArchitectureOverview.tsx:106](../src/features/garage/ArchitectureOverview.tsx#L106) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.<span>.<Icon>.@name` | 이름/신호 라벨 | `"car"` |
| [src/features/garage/ArchitectureOverview.tsx:108](../src/features/garage/ArchitectureOverview.tsx#L108) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.<div>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"입력 요소"` |
| [src/features/garage/ArchitectureOverview.tsx:108](../src/features/garage/ArchitectureOverview.tsx#L108) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.<div>.<span>.<img>.@alt` | 이미지 대체 텍스트 | `""` |
| [src/features/garage/ArchitectureOverview.tsx:109](../src/features/garage/ArchitectureOverview.tsx#L109) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.<div>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"출력 요소"` |
| [src/features/garage/ArchitectureOverview.tsx:109](../src/features/garage/ArchitectureOverview.tsx#L109) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.<div>.<span>.<img>.@alt` | 이미지 대체 텍스트 | `""` |
| [src/features/garage/ArchitectureOverview.tsx:111](../src/features/garage/ArchitectureOverview.tsx#L111) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.@aria-label` | 동적 JSX 표현식(런타임 값/분기 포함) | `"`${group} 도메인`"` |
| [src/features/garage/ArchitectureOverview.tsx:111](../src/features/garage/ArchitectureOverview.tsx#L111) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"`${group} 도메인`"` |
| [src/features/garage/ArchitectureOverview.tsx:112](../src/features/garage/ArchitectureOverview.tsx#L112) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"ids.map(id => <button key={id} onClick={() => onPick(id)} style={{ \"--domain\": EV_DOMAINS[id].accent } as React.CSSProperties}><Icon name={icons[id]} /><span>{EV_DOMAINS[id].label}</span><small>열기</small></button>)"` |
| [src/features/garage/ArchitectureOverview.tsx:112](../src/features/garage/ArchitectureOverview.tsx#L112) | `groupCards` | `groupCards.<div>.<div>.<section>.<div>.<button>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"열기"` |
| [src/features/garage/ArchitectureOverview.tsx:116](../src/features/garage/ArchitectureOverview.tsx#L116) | `groupCards` | `groupCards.<div>.<section>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"도메인 협조 신호 미리보기"` |
| [src/features/garage/ArchitectureOverview.tsx:117](../src/features/garage/ArchitectureOverview.tsx#L117) | `groupCards` | `groupCards.<div>.<section>.<header>.<b>.<Icon>.@name` | 이름/신호 라벨 | `"signal"` |
| [src/features/garage/ArchitectureOverview.tsx:117](../src/features/garage/ArchitectureOverview.tsx#L117) | `groupCards` | `groupCards.<div>.<section>.<header>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"도메인 협조 신호"` |
| [src/features/garage/ArchitectureOverview.tsx:117](../src/features/garage/ArchitectureOverview.tsx#L117) | `groupCards` | `groupCards.<div>.<section>.<header>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"각 영역은 네트워크로 한계를 주고받으며 함께 차량을 제어합니다."` |
| [src/features/garage/ArchitectureOverview.tsx:118](../src/features/garage/ArchitectureOverview.tsx#L118) | `groupCards` | `groupCards.<div>.<section>.<div>.<button>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/features/garage/ArchitectureOverview.tsx:119](../src/features/garage/ArchitectureOverview.tsx#L119) | `groupCards` | `groupCards.<div>.<section>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"active && <article className=\"archSignalDetail\" aria-live=\"polite\">\n        <header><span className=\"archSignalKicker\">협조 신호 선택됨</span><b>{active.name}</b><button type=\"button\" aria-label=\"협조 신호 닫기\" onClick={() => setSignal(null)}>×</button></header>\n        <div className=\"archSignalRoute\"><strong>{EV_DOMAINS[active.from].label}</strong><i>→</i>{active.to.map(id => <React.Fragment key={id}><strong>{EV_DOMAINS[id].label}</strong>{id !== active.to.at(-1) && <i>→</i>}</React.Fragment>)}</div>\n        <p>{active.purpose}</p>\n        <small>입력·한계 신호가 네트워크를 통해 다음 도메인의 제어 판단으로 전달됩니다.</small>\n      </article>"` |
| [src/features/garage/ArchitectureOverview.tsx:120](../src/features/garage/ArchitectureOverview.tsx#L120) | `groupCards` | `groupCards.<div>.<section>.<article>.<header>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"협조 신호 선택됨"` |
| [src/features/garage/ArchitectureOverview.tsx:120](../src/features/garage/ArchitectureOverview.tsx#L120) | `groupCards` | `groupCards.<div>.<section>.<article>.<header>.<button>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"협조 신호 닫기"` |
| [src/features/garage/ArchitectureOverview.tsx:120](../src/features/garage/ArchitectureOverview.tsx#L120) | `groupCards` | `groupCards.<div>.<section>.<article>.<header>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"×"` |
| [src/features/garage/ArchitectureOverview.tsx:121](../src/features/garage/ArchitectureOverview.tsx#L121) | `groupCards` | `groupCards.<div>.<section>.<article>.<div>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/features/garage/ArchitectureOverview.tsx:121](../src/features/garage/ArchitectureOverview.tsx#L121) | `groupCards` | `groupCards.<div>.<section>.<article>.<div>.<React.Fragment>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/features/garage/ArchitectureOverview.tsx:123](../src/features/garage/ArchitectureOverview.tsx#L123) | `groupCards` | `groupCards.<div>.<section>.<article>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"입력·한계 신호가 네트워크를 통해 다음 도메인의 제어 판단으로 전달됩니다."` |
| [src/features/garage/ArchitectureOverview.tsx:129](../src/features/garage/ArchitectureOverview.tsx#L129) | `ArchitectureOverview` | `<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"open === null ? groupCards : <>\n    <nav className=\"archCrumb\" aria-label=\"현재 위치\"><button onClick={() => pickGroup(null)}>전체 영역</button><span>›</span>{DOMAIN_GROUPS.map(group => <button key={group} className={group === open ? \"on\" : \"\"} onClick={() => pickGroup(group)}>{group}</button>)}<small>도메인 버튼을 선택하면 기능 흐름이 열립니다</small></nav>\n    <div className=\"archCols one\">\n      {DOMAIN_GROUPS.filter(group => group === open).map(group => {\n        const ids = DOMAIN_ORDER.filter(id => EV_DOMAINS[id].group === group);\n        const io = OVERVIEW_IO[group];\n        return <div className=\"archRow\" key={group}>\n          <ul className=\"archIo in\">{io.inputs.map(item => <li key={item}>{item}</li>)}</ul>\n          <i className=\"archArrow\" aria-hidden=\"true\" />\n          <section className={`archGroup g-${DOMAIN_GROUPS.indexOf(group)}`} aria-label={group}>\n            <h3>{group}</h3>\n            <p className=\"archGroupRole\">{GROUP_ROLE[group]}</p>\n            <div className=\"archDomains\">{ids.map(id => <button key={id} ref={element => { buttons.current[id] = element; }} className={involved.has(id) ? (active?.from === id ? \"from\" : \"to\") : \"\"} style={{ \"--domain\": EV_DOMAINS[id].accent } as React.CSSProperties} onClick={() => onPick(id)}>\n              <span><Icon name={icons[id]} /></span><b>{EV_DOMAINS[id].label}</b><small>기능 {EV_DOMAINS[id].features.length}개</small>\n            </button>)}</div>\n          </section>\n          <i className=\"archArrow\" aria-hidden=\"true\" />\n          <ul className=\"archIo out\">{io.outputs.map(item => <li key={item}>{item}</li>)}</ul>\n        </div>;\n      })}\n      <div className=\"archNet\"><Icon name=\"signal\" /><b>차량 네트워크</b><span>CAN · 이더넷 · 게이트웨이로 모든 도메인이 연결돼요</span></div>\n    </div>\n    </>"` |
| [src/features/garage/ArchitectureOverview.tsx:130](../src/features/garage/ArchitectureOverview.tsx#L130) | `ArchitectureOverview` | `<div>.<nav>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"현재 위치"` |
| [src/features/garage/ArchitectureOverview.tsx:130](../src/features/garage/ArchitectureOverview.tsx#L130) | `ArchitectureOverview` | `<div>.<nav>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"전체 영역"` |
| [src/features/garage/ArchitectureOverview.tsx:130](../src/features/garage/ArchitectureOverview.tsx#L130) | `ArchitectureOverview` | `<div>.<nav>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"›"` |
| [src/features/garage/ArchitectureOverview.tsx:130](../src/features/garage/ArchitectureOverview.tsx#L130) | `ArchitectureOverview` | `<div>.<nav>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"도메인 버튼을 선택하면 기능 흐름이 열립니다"` |
| [src/features/garage/ArchitectureOverview.tsx:132](../src/features/garage/ArchitectureOverview.tsx#L132) | `ArchitectureOverview` | `<div>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"DOMAIN_GROUPS.filter(group => group === open).map(group => {\n        const ids = DOMAIN_ORDER.filter(id => EV_DOMAINS[id].group === group);\n        const io = OVERVIEW_IO[group];\n        return <div className=\"archRow\" key={group}>\n          <ul className=\"archIo in\">{io.inputs.map(item => <li key={item}>{item}</li>)}</ul>\n          <i className=\"archArrow\" aria-hidden=\"true\" />\n          <section className={`archGroup g-${DOMAIN_GROUPS.indexOf(group)}`} aria-label={group}>\n            <h3>{group}</h3>\n            <p className=\"archGroupRole\">{GROUP_ROLE[group]}</p>\n            <div className=\"archDomains\">{ids.map(id => <button key={id} ref={element => { buttons.current[id] = element; }} className={involved.has(id) ? (active?.from === id ? \"from\" : \"to\") : \"\"} style={{ \"--domain\": EV_DOMAINS[id].accent } as React.CSSProperties} onClick={() => onPick(id)}>\n              <span><Icon name={icons[id]} /></span><b>{EV_DOMAINS[id].label}</b><small>기능 {EV_DOMAINS[id].features.length}개</small>\n            </button>)}</div>\n          </section>\n          <i className=\"archArrow\" aria-hidden=\"true\" />\n          <ul className=\"archIo out\">{io.outputs.map(item => <li key={item}>{item}</li>)}</ul>\n        </div>;\n      })"` |
| [src/features/garage/ArchitectureOverview.tsx:141](../src/features/garage/ArchitectureOverview.tsx#L141) | `ArchitectureOverview` | `<div>.<div>.<div>.<section>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"ids.map(id => <button key={id} ref={element => { buttons.current[id] = element; }} className={involved.has(id) ? (active?.from === id ? \"from\" : \"to\") : \"\"} style={{ \"--domain\": EV_DOMAINS[id].accent } as React.CSSProperties} onClick={() => onPick(id)}>\n              <span><Icon name={icons[id]} /></span><b>{EV_DOMAINS[id].label}</b><small>기능 {EV_DOMAINS[id].features.length}개</small>\n            </button>)"` |
| [src/features/garage/ArchitectureOverview.tsx:142](../src/features/garage/ArchitectureOverview.tsx#L142) | `ArchitectureOverview` | `<div>.<div>.<div>.<section>.<div>.<button>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"기능 "` |
| [src/features/garage/ArchitectureOverview.tsx:142](../src/features/garage/ArchitectureOverview.tsx#L142) | `ArchitectureOverview` | `<div>.<div>.<div>.<section>.<div>.<button>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"개"` |
| [src/features/garage/ArchitectureOverview.tsx:149](../src/features/garage/ArchitectureOverview.tsx#L149) | `ArchitectureOverview` | `<div>.<div>.<div>.<Icon>.@name` | 이름/신호 라벨 | `"signal"` |
| [src/features/garage/ArchitectureOverview.tsx:149](../src/features/garage/ArchitectureOverview.tsx#L149) | `ArchitectureOverview` | `<div>.<div>.<div>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"차량 네트워크"` |
| [src/features/garage/ArchitectureOverview.tsx:149](../src/features/garage/ArchitectureOverview.tsx#L149) | `ArchitectureOverview` | `<div>.<div>.<div>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"CAN · 이더넷 · 게이트웨이로 모든 도메인이 연결돼요"` |
| [src/features/garage/ArchitectureOverview.tsx:153](../src/features/garage/ArchitectureOverview.tsx#L153) | `ArchitectureOverview` | `<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"open !== null && <div className=\"archSignals\">\n      <b>협조 신호</b>\n      {COORD_SIGNALS.map((item, index) => <button key={item.name} className={signal === index ? \"on\" : \"\"} onClick={() => setSignal(signal === index ? null : index)}>{item.name}</button>)}\n      <button className=\"arch3d\" onClick={onShow3d}><Icon name=\"car\" /> 3D 차량</button>\n    </div>"` |
| [src/features/garage/ArchitectureOverview.tsx:154](../src/features/garage/ArchitectureOverview.tsx#L154) | `ArchitectureOverview` | `<div>.<div>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"협조 신호"` |
| [src/features/garage/ArchitectureOverview.tsx:156](../src/features/garage/ArchitectureOverview.tsx#L156) | `ArchitectureOverview` | `<div>.<div>.<button>.<Icon>.@name` | 이름/신호 라벨 | `"car"` |
| [src/features/garage/ArchitectureOverview.tsx:156](../src/features/garage/ArchitectureOverview.tsx#L156) | `ArchitectureOverview` | `<div>.<div>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"3D 차량"` |
| [src/features/garage/ArchitectureOverview.tsx:158](../src/features/garage/ArchitectureOverview.tsx#L158) | `ArchitectureOverview` | `<div>.<p>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"active ? `${EV_DOMAINS[active.from].label} → ${active.to.map(id => EV_DOMAINS[id].label).join(\"·\")} · ${active.purpose}` : open === null ? \"\" : \"아래 협조 신호를 누르면 도메인 사이 신호가 보여요.\""` |
| [src/features/garage/ArchitectureOverview.tsx:158](../src/features/garage/ArchitectureOverview.tsx#L158) | `ArchitectureOverview` | `<div>.<p>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"아래 협조 신호를 누르면 도메인 사이 신호가 보여요."` |
| [src/features/garage/EeBlueprint.tsx:31](../src/features/garage/EeBlueprint.tsx#L31) | `ECU_BOXES` | `ECU_BOXES.[0].label` | 표시 라벨/선택지 | `"VCU"` |
| [src/features/garage/EeBlueprint.tsx:32](../src/features/garage/EeBlueprint.tsx#L32) | `ECU_BOXES` | `ECU_BOXES.[1].label` | 표시 라벨/선택지 | `"MCU·인버터 ECU"` |
| [src/features/garage/EeBlueprint.tsx:33](../src/features/garage/EeBlueprint.tsx#L33) | `ECU_BOXES` | `ECU_BOXES.[2].label` | 표시 라벨/선택지 | `"EPS ECU"` |
| [src/features/garage/EeBlueprint.tsx:34](../src/features/garage/EeBlueprint.tsx#L34) | `ECU_BOXES` | `ECU_BOXES.[3].label` | 표시 라벨/선택지 | `"BMS"` |
| [src/features/garage/EeBlueprint.tsx:35](../src/features/garage/EeBlueprint.tsx#L35) | `ECU_BOXES` | `ECU_BOXES.[4].label` | 표시 라벨/선택지 | `"Thermal ECU"` |
| [src/features/garage/EeBlueprint.tsx:36](../src/features/garage/EeBlueprint.tsx#L36) | `ECU_BOXES` | `ECU_BOXES.[5].label` | 표시 라벨/선택지 | `"Brake ECU"` |
| [src/features/garage/EeBlueprint.tsx:38](../src/features/garage/EeBlueprint.tsx#L38) | `ECU_BOXES` | `ECU_BOXES.[6].label` | 표시 라벨/선택지 | `"Chassis ECU"` |
| [src/features/garage/EeBlueprint.tsx:39](../src/features/garage/EeBlueprint.tsx#L39) | `ECU_BOXES` | `ECU_BOXES.[7].label` | 표시 라벨/선택지 | `"변속·Park ECU"` |
| [src/features/garage/EeBlueprint.tsx:100](../src/features/garage/EeBlueprint.tsx#L100) | `chip` | `chip.<button>.<Icon>.@name` | 이름/신호 라벨 | `"ban"` |
| [src/features/garage/EeBlueprint.tsx:100](../src/features/garage/EeBlueprint.tsx#L100) | `chip` | `chip.<button>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"marks?.[item.i] === \"ok\" && <em className=\"eeMark\">정상</em>"` |
| [src/features/garage/EeBlueprint.tsx:100](../src/features/garage/EeBlueprint.tsx#L100) | `chip` | `chip.<button>.<em>` | 화면에 직접 렌더되는 JSX 문구 | `"정상"` |
| [src/features/garage/EeBlueprint.tsx:100](../src/features/garage/EeBlueprint.tsx#L100) | `chip` | `chip.<button>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"marks?.[item.i] === \"bad\" && <em className=\"eeMark\">이상</em>"` |
| [src/features/garage/EeBlueprint.tsx:100](../src/features/garage/EeBlueprint.tsx#L100) | `chip` | `chip.<button>.<em>` | 화면에 직접 렌더되는 JSX 문구 | `"이상"` |
| [src/features/garage/EeBlueprint.tsx:100](../src/features/garage/EeBlueprint.tsx#L100) | `chip` | `chip.<button>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"marks?.[item.i] === \"first\" && <em className=\"eeMark\">처음 어긋남</em>"` |
| [src/features/garage/EeBlueprint.tsx:100](../src/features/garage/EeBlueprint.tsx#L100) | `chip` | `chip.<button>.<em>` | 화면에 직접 렌더되는 JSX 문구 | `"처음 어긋남"` |
| [src/features/garage/EeBlueprint.tsx:113](../src/features/garage/EeBlueprint.tsx#L113) | `EeBlueprint` | `<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"inspector && pop && <div className=\"eeInspector\" style={{ left: popLeft, top: popTop }} role=\"dialog\">\n      <header><span>{inspector.tag}</span><b>{chain[inspector.index]}</b><button aria-label=\"닫기\" onClick={onCloseInspector}>×</button></header>\n      <div><p><small>받는 값</small>{inspector.input}</p><i>→</i><p><small>하는 일</small>{inspector.does}</p><i>→</i><p><small>보내는 값</small>{inspector.output}</p></div>\n    </div>"` |
| [src/features/garage/EeBlueprint.tsx:114](../src/features/garage/EeBlueprint.tsx#L114) | `EeBlueprint` | `<div>.<div>.<header>.<button>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"닫기"` |
| [src/features/garage/EeBlueprint.tsx:114](../src/features/garage/EeBlueprint.tsx#L114) | `EeBlueprint` | `<div>.<div>.<header>.<button>` | 화면에 직접 렌더되는 JSX 문구 | `"×"` |
| [src/features/garage/EeBlueprint.tsx:115](../src/features/garage/EeBlueprint.tsx#L115) | `EeBlueprint` | `<div>.<div>.<div>.<p>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"받는 값"` |
| [src/features/garage/EeBlueprint.tsx:115](../src/features/garage/EeBlueprint.tsx#L115) | `EeBlueprint` | `<div>.<div>.<div>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/features/garage/EeBlueprint.tsx:115](../src/features/garage/EeBlueprint.tsx#L115) | `EeBlueprint` | `<div>.<div>.<div>.<p>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"하는 일"` |
| [src/features/garage/EeBlueprint.tsx:115](../src/features/garage/EeBlueprint.tsx#L115) | `EeBlueprint` | `<div>.<div>.<div>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"→"` |
| [src/features/garage/EeBlueprint.tsx:115](../src/features/garage/EeBlueprint.tsx#L115) | `EeBlueprint` | `<div>.<div>.<div>.<p>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"보내는 값"` |
| [src/features/garage/EeBlueprint.tsx:129](../src/features/garage/EeBlueprint.tsx#L129) | `EeBlueprint` | `<div>.<div>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"센서 · 운전자 입력"` |
| [src/features/garage/EeBlueprint.tsx:132](../src/features/garage/EeBlueprint.tsx#L132) | `EeBlueprint` | `<div>.<div>.<div>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"CAN 버스"` |
| [src/features/garage/EeBlueprint.tsx:132](../src/features/garage/EeBlueprint.tsx#L132) | `EeBlueprint` | `<div>.<div>.<div>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"게이트웨이"` |
| [src/features/garage/EeBlueprint.tsx:133](../src/features/garage/EeBlueprint.tsx#L133) | `EeBlueprint` | `<div>.<div>.<div>.<Icon>.@name` | 이름/신호 라벨 | `"bolt"` |
| [src/features/garage/EeBlueprint.tsx:133](../src/features/garage/EeBlueprint.tsx#L133) | `EeBlueprint` | `<div>.<div>.<div>` | 화면에 직접 렌더되는 JSX 문구 | `"12V·고전압 전원선 (모든 제어기에 공급)"` |
| [src/features/garage/EeBlueprint.tsx:135](../src/features/garage/EeBlueprint.tsx#L135) | `EeBlueprint` | `<div>.<div>.<small>` | 화면에 직접 렌더되는 JSX 문구 | `"부품 · 차량 반응"` |
| [src/features/garage/evData.ts:11](../src/features/garage/evData.ts#L11) | `module` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"파워트레인"` |
| [src/features/garage/evData.ts:11](../src/features/garage/evData.ts#L11) | `module` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"섀시"` |
| [src/features/garage/evData.ts:11](../src/features/garage/evData.ts#L11) | `module` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 제어"` |
| [src/features/garage/evData.ts:12](../src/features/garage/evData.ts#L12) | `module` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:12](../src/features/garage/evData.ts#L12) | `module` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:12](../src/features/garage/evData.ts#L12) | `module` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:31](../src/features/garage/evData.ts#L31) | `DOMAIN_GROUPS` | `DOMAIN_GROUPS.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"파워트레인"` |
| [src/features/garage/evData.ts:31](../src/features/garage/evData.ts#L31) | `DOMAIN_GROUPS` | `DOMAIN_GROUPS.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"섀시"` |
| [src/features/garage/evData.ts:31](../src/features/garage/evData.ts#L31) | `DOMAIN_GROUPS` | `DOMAIN_GROUPS.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 제어"` |
| [src/features/garage/evData.ts:35](../src/features/garage/evData.ts#L35) | `EV_DOMAINS` | `EV_DOMAINS.drive.label` | 표시 라벨/선택지 | `"구동"` |
| [src/features/garage/evData.ts:35](../src/features/garage/evData.ts#L35) | `EV_DOMAINS` | `EV_DOMAINS.drive.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"파워트레인"` |
| [src/features/garage/evData.ts:36](../src/features/garage/evData.ts#L36) | `EV_DOMAINS` | `EV_DOMAINS.drive.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가속 의도를 모터 토크와 바퀴 구동력으로 바꿉니다."` |
| [src/features/garage/evData.ts:38](../src/features/garage/evData.ts#L38) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].name` | 이름/신호 라벨 | `"운전자 토크 요청 해석"` |
| [src/features/garage/evData.ts:38](../src/features/garage/evData.ts#L38) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:38](../src/features/garage/evData.ts#L38) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].summary` | 요약/기능 설명 | `"가속 페달 입력을 검증해 운전자가 원하는 토크로 바꿉니다."` |
| [src/features/garage/evData.ts:40](../src/features/garage/evData.ts#L40) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가속 페달 조작"` |
| [src/features/garage/evData.ts:40](../src/features/garage/evData.ts#L40) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가속 의도"` |
| [src/features/garage/evData.ts:40](../src/features/garage/evData.ts#L40) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가용 토크 판단"` |
| [src/features/garage/evData.ts:40](../src/features/garage/evData.ts#L40) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전륜 추진력"` |
| [src/features/garage/evData.ts:40](../src/features/garage/evData.ts#L40) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 가속"` |
| [src/features/garage/evData.ts:41](../src/features/garage/evData.ts#L41) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"APS A/B 가속 페달"` |
| [src/features/garage/evData.ts:41](../src/features/garage/evData.ts#L41) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 토크"` |
| [src/features/garage/evData.ts:41](../src/features/garage/evData.ts#L41) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"MCU·인버터 ECU"` |
| [src/features/garage/evData.ts:41](../src/features/garage/evData.ts#L41) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"인버터"` |
| [src/features/garage/evData.ts:41](../src/features/garage/evData.ts#L41) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[1].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전륜 PMSM 모터"` |
| [src/features/garage/evData.ts:41](../src/features/garage/evData.ts#L41) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[1].[6]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전륜 감속기"` |
| [src/features/garage/evData.ts:41](../src/features/garage/evData.ts#L41) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[1].[7]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차동기어"` |
| [src/features/garage/evData.ts:41](../src/features/garage/evData.ts#L41) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[1].[8]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"드라이브 샤프트"` |
| [src/features/garage/evData.ts:41](../src/features/garage/evData.ts#L41) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[1].[9]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전륜"` |
| [src/features/garage/evData.ts:43](../src/features/garage/evData.ts#L43) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"A/B 상관성"` |
| [src/features/garage/evData.ts:43](../src/features/garage/evData.ts#L43) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"입력 필터"` |
| [src/features/garage/evData.ts:43](../src/features/garage/evData.ts#L43) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"페달 맵"` |
| [src/features/garage/evData.ts:43](../src/features/garage/evData.ts#L43) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"구동 허용"` |
| [src/features/garage/evData.ts:43](../src/features/garage/evData.ts#L43) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가용 토크 MIN"` |
| [src/features/garage/evData.ts:43](../src/features/garage/evData.ts#L43) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"램프율"` |
| [src/features/garage/evData.ts:43](../src/features/garage/evData.ts#L43) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[0].layers.[3].[6]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"토크 출력"` |
| [src/features/garage/evData.ts:45](../src/features/garage/evData.ts#L45) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].name` | 이름/신호 라벨 | `"구동 허용·인터록"` |
| [src/features/garage/evData.ts:45](../src/features/garage/evData.ts#L45) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:45](../src/features/garage/evData.ts#L45) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].summary` | 요약/기능 설명 | `"D단과 READY 조건이 모두 맞을 때만 구동 토크를 허용합니다."` |
| [src/features/garage/evData.ts:47](../src/features/garage/evData.ts#L47) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"D단 선택"` |
| [src/features/garage/evData.ts:47](../src/features/garage/evData.ts#L47) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"READY 확인"` |
| [src/features/garage/evData.ts:47](../src/features/garage/evData.ts#L47) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"구동 허용"` |
| [src/features/garage/evData.ts:47](../src/features/garage/evData.ts#L47) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"안전 출발"` |
| [src/features/garage/evData.ts:48](../src/features/garage/evData.ts#L48) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PRND 센서"` |
| [src/features/garage/evData.ts:48](../src/features/garage/evData.ts#L48) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"인버터 Enable"` |
| [src/features/garage/evData.ts:50](../src/features/garage/evData.ts#L50) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"브레이크 인터록"` |
| [src/features/garage/evData.ts:50](../src/features/garage/evData.ts#L50) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고장 래치"` |
| [src/features/garage/evData.ts:52](../src/features/garage/evData.ts#L52) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].name` | 이름/신호 라벨 | `"토크 배분·제한"` |
| [src/features/garage/evData.ts:52](../src/features/garage/evData.ts#L52) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:52](../src/features/garage/evData.ts#L52) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].summary` | 요약/기능 설명 | `"배터리·모터·열 한계를 모아 낼 수 있는 최대 토크로 제한합니다."` |
| [src/features/garage/evData.ts:54](../src/features/garage/evData.ts#L54) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"토크 요청"` |
| [src/features/garage/evData.ts:54](../src/features/garage/evData.ts#L54) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"한계 수집"` |
| [src/features/garage/evData.ts:54](../src/features/garage/evData.ts#L54) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가용 토크 판단"` |
| [src/features/garage/evData.ts:54](../src/features/garage/evData.ts#L54) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"최종 토크 명령"` |
| [src/features/garage/evData.ts:55](../src/features/garage/evData.ts#L55) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터 NTC 센서"` |
| [src/features/garage/evData.ts:55](../src/features/garage/evData.ts#L55) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 토크"` |
| [src/features/garage/evData.ts:55](../src/features/garage/evData.ts#L55) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[1].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"MCU·인버터 ECU"` |
| [src/features/garage/evData.ts:57](../src/features/garage/evData.ts#L57) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"배터리 한계 수신"` |
| [src/features/garage/evData.ts:57](../src/features/garage/evData.ts#L57) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"열 한계 수신"` |
| [src/features/garage/evData.ts:57](../src/features/garage/evData.ts#L57) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가용 토크 MIN"` |
| [src/features/garage/evData.ts:57](../src/features/garage/evData.ts#L57) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"램프율"` |
| [src/features/garage/evData.ts:57](../src/features/garage/evData.ts#L57) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[2].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"토크 명령 확정"` |
| [src/features/garage/evData.ts:59](../src/features/garage/evData.ts#L59) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].name` | 이름/신호 라벨 | `"인버터 전류·토크 제어"` |
| [src/features/garage/evData.ts:59](../src/features/garage/evData.ts#L59) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:59](../src/features/garage/evData.ts#L59) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].summary` | 요약/기능 설명 | `"토크 명령을 3상 전류로 만들어 전륜 PMSM·감속기 어셈블리의 축 토크를 냅니다."` |
| [src/features/garage/evData.ts:61](../src/features/garage/evData.ts#L61) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"토크 요구"` |
| [src/features/garage/evData.ts:61](../src/features/garage/evData.ts#L61) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전류 목표"` |
| [src/features/garage/evData.ts:61](../src/features/garage/evData.ts#L61) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"dq 제어"` |
| [src/features/garage/evData.ts:61](../src/features/garage/evData.ts#L61) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터 회전"` |
| [src/features/garage/evData.ts:61](../src/features/garage/evData.ts#L61) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[0].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"축 토크"` |
| [src/features/garage/evData.ts:62](../src/features/garage/evData.ts#L62) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"인버터 MCU"` |
| [src/features/garage/evData.ts:62](../src/features/garage/evData.ts#L62) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"3상 브리지"` |
| [src/features/garage/evData.ts:62](../src/features/garage/evData.ts#L62) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[1].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"리졸버"` |
| [src/features/garage/evData.ts:64](../src/features/garage/evData.ts#L64) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"명령 수신"` |
| [src/features/garage/evData.ts:64](../src/features/garage/evData.ts#L64) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"dq 변환"` |
| [src/features/garage/evData.ts:64](../src/features/garage/evData.ts#L64) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전류 PI"` |
| [src/features/garage/evData.ts:64](../src/features/garage/evData.ts#L64) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전압 제한"` |
| [src/features/garage/evData.ts:64](../src/features/garage/evData.ts#L64) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PWM 생성"` |
| [src/features/garage/evData.ts:64](../src/features/garage/evData.ts#L64) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"리졸버 피드백"` |
| [src/features/garage/evData.ts:64](../src/features/garage/evData.ts#L64) | `EV_DOMAINS` | `EV_DOMAINS.drive.features.[3].layers.[3].[6]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"토크 추정"` |
| [src/features/garage/evData.ts:69](../src/features/garage/evData.ts#L69) | `EV_DOMAINS` | `EV_DOMAINS.power.label` | 표시 라벨/선택지 | `"고전압 전원"` |
| [src/features/garage/evData.ts:69](../src/features/garage/evData.ts#L69) | `EV_DOMAINS` | `EV_DOMAINS.power.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"파워트레인"` |
| [src/features/garage/evData.ts:70](../src/features/garage/evData.ts#L70) | `EV_DOMAINS` | `EV_DOMAINS.power.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고전압 팩을 안전하게 연결하고 각 도메인에 쓸 수 있는 전력을 알립니다."` |
| [src/features/garage/evData.ts:72](../src/features/garage/evData.ts#L72) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].name` | 이름/신호 라벨 | `"팩 안전 판단"` |
| [src/features/garage/evData.ts:72](../src/features/garage/evData.ts#L72) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:72](../src/features/garage/evData.ts#L72) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].summary` | 요약/기능 설명 | `"전압·절연·온도를 확인해 고전압 팩을 쓸 수 있는지 판단합니다."` |
| [src/features/garage/evData.ts:74](../src/features/garage/evData.ts#L74) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"시동 버튼"` |
| [src/features/garage/evData.ts:74](../src/features/garage/evData.ts#L74) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"START 요청"` |
| [src/features/garage/evData.ts:74](../src/features/garage/evData.ts#L74) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"팩 안전 확인"` |
| [src/features/garage/evData.ts:74](../src/features/garage/evData.ts#L74) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전원 허용"` |
| [src/features/garage/evData.ts:75](../src/features/garage/evData.ts#L75) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"START 버튼"` |
| [src/features/garage/evData.ts:75](../src/features/garage/evData.ts#L75) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전압·절연·온도 센서"` |
| [src/features/garage/evData.ts:75](../src/features/garage/evData.ts#L75) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"HV 부하"` |
| [src/features/garage/evData.ts:77](../src/features/garage/evData.ts#L77) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"START 입력"` |
| [src/features/garage/evData.ts:77](../src/features/garage/evData.ts#L77) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전압 범위"` |
| [src/features/garage/evData.ts:77](../src/features/garage/evData.ts#L77) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"절연 임계"` |
| [src/features/garage/evData.ts:77](../src/features/garage/evData.ts#L77) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"온도 제한"` |
| [src/features/garage/evData.ts:77](../src/features/garage/evData.ts#L77) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"Crash 신호"` |
| [src/features/garage/evData.ts:77](../src/features/garage/evData.ts#L77) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[0].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PackSafe 래치"` |
| [src/features/garage/evData.ts:79](../src/features/garage/evData.ts#L79) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].name` | 이름/신호 라벨 | `"프리차지·접촉기"` |
| [src/features/garage/evData.ts:79](../src/features/garage/evData.ts#L79) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:79](../src/features/garage/evData.ts#L79) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].summary` | 요약/기능 설명 | `"인버터 커패시터를 먼저 충전한 뒤 주 접촉기를 닫습니다."` |
| [src/features/garage/evData.ts:81](../src/features/garage/evData.ts#L81) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전원 요청"` |
| [src/features/garage/evData.ts:81](../src/features/garage/evData.ts#L81) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부하측 전압 확인"` |
| [src/features/garage/evData.ts:81](../src/features/garage/evData.ts#L81) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"프리차지"` |
| [src/features/garage/evData.ts:81](../src/features/garage/evData.ts#L81) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전압 동기화"` |
| [src/features/garage/evData.ts:81](../src/features/garage/evData.ts#L81) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"주 접촉기"` |
| [src/features/garage/evData.ts:81](../src/features/garage/evData.ts#L81) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[0].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"HV 연결"` |
| [src/features/garage/evData.ts:82](../src/features/garage/evData.ts#L82) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"팩 전압센서"` |
| [src/features/garage/evData.ts:82](../src/features/garage/evData.ts#L82) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"프리차지 저항"` |
| [src/features/garage/evData.ts:82](../src/features/garage/evData.ts#L82) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"릴레이"` |
| [src/features/garage/evData.ts:82](../src/features/garage/evData.ts#L82) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"주 접촉기"` |
| [src/features/garage/evData.ts:82](../src/features/garage/evData.ts#L82) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[1].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"HV 버스"` |
| [src/features/garage/evData.ts:84](../src/features/garage/evData.ts#L84) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전압비 계산"` |
| [src/features/garage/evData.ts:84](../src/features/garage/evData.ts#L84) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"Precharge 상태기"` |
| [src/features/garage/evData.ts:84](../src/features/garage/evData.ts#L84) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"타임아웃"` |
| [src/features/garage/evData.ts:84](../src/features/garage/evData.ts#L84) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"주 접촉기 명령"` |
| [src/features/garage/evData.ts:84](../src/features/garage/evData.ts#L84) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"용착 진단"` |
| [src/features/garage/evData.ts:84](../src/features/garage/evData.ts#L84) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[1].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"HV 피드백"` |
| [src/features/garage/evData.ts:86](../src/features/garage/evData.ts#L86) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].name` | 이름/신호 라벨 | `"출력 가용량 계산"` |
| [src/features/garage/evData.ts:86](../src/features/garage/evData.ts#L86) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:86](../src/features/garage/evData.ts#L86) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].summary` | 요약/기능 설명 | `"SOC·온도·셀 편차로 방전·회생 출력 상한을 계산합니다."` |
| [src/features/garage/evData.ts:88](../src/features/garage/evData.ts#L88) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"팩 상태"` |
| [src/features/garage/evData.ts:88](../src/features/garage/evData.ts#L88) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"열·SOC 한계"` |
| [src/features/garage/evData.ts:88](../src/features/garage/evData.ts#L88) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"출력 예산"` |
| [src/features/garage/evData.ts:88](../src/features/garage/evData.ts#L88) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"도메인 배분"` |
| [src/features/garage/evData.ts:88](../src/features/garage/evData.ts#L88) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가용 성능"` |
| [src/features/garage/evData.ts:89](../src/features/garage/evData.ts#L89) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"인버터·부하"` |
| [src/features/garage/evData.ts:91](../src/features/garage/evData.ts#L91) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"SOC 보정"` |
| [src/features/garage/evData.ts:91](../src/features/garage/evData.ts#L91) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"온도 디레이팅"` |
| [src/features/garage/evData.ts:91](../src/features/garage/evData.ts#L91) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충방전 한계"` |
| [src/features/garage/evData.ts:91](../src/features/garage/evData.ts#L91) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"합계 제한"` |
| [src/features/garage/evData.ts:91](../src/features/garage/evData.ts#L91) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"도메인 우선순위"` |
| [src/features/garage/evData.ts:91](../src/features/garage/evData.ts#L91) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[2].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"램프율"` |
| [src/features/garage/evData.ts:93](../src/features/garage/evData.ts#L93) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].name` | 이름/신호 라벨 | `"고장 차단·HVIL"` |
| [src/features/garage/evData.ts:93](../src/features/garage/evData.ts#L93) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:93](../src/features/garage/evData.ts#L93) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].summary` | 요약/기능 설명 | `"인터록 단선·충돌 신호 등 위험 때 고전압을 차단합니다."` |
| [src/features/garage/evData.ts:95](../src/features/garage/evData.ts#L95) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고장 감지"` |
| [src/features/garage/evData.ts:95](../src/features/garage/evData.ts#L95) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"위험 등급 판단"` |
| [src/features/garage/evData.ts:95](../src/features/garage/evData.ts#L95) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고전압 차단"` |
| [src/features/garage/evData.ts:95](../src/features/garage/evData.ts#L95) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"안전 상태"` |
| [src/features/garage/evData.ts:96](../src/features/garage/evData.ts#L96) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"HVIL 루프"` |
| [src/features/garage/evData.ts:96](../src/features/garage/evData.ts#L96) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충돌 신호"` |
| [src/features/garage/evData.ts:96](../src/features/garage/evData.ts#L96) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"주 접촉기"` |
| [src/features/garage/evData.ts:96](../src/features/garage/evData.ts#L96) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"인버터 방전"` |
| [src/features/garage/evData.ts:98](../src/features/garage/evData.ts#L98) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"루프 단선 검사"` |
| [src/features/garage/evData.ts:98](../src/features/garage/evData.ts#L98) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충돌 신호 확인"` |
| [src/features/garage/evData.ts:98](../src/features/garage/evData.ts#L98) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"위험 등급 판단"` |
| [src/features/garage/evData.ts:98](../src/features/garage/evData.ts#L98) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"접촉기 개방 명령"` |
| [src/features/garage/evData.ts:98](../src/features/garage/evData.ts#L98) | `EV_DOMAINS` | `EV_DOMAINS.power.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고장 래치"` |
| [src/features/garage/evData.ts:103](../src/features/garage/evData.ts#L103) | `EV_DOMAINS` | `EV_DOMAINS.charge.label` | 표시 라벨/선택지 | `"충전"` |
| [src/features/garage/evData.ts:103](../src/features/garage/evData.ts#L103) | `EV_DOMAINS` | `EV_DOMAINS.charge.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"파워트레인"` |
| [src/features/garage/evData.ts:104](../src/features/garage/evData.ts#L104) | `EV_DOMAINS` | `EV_DOMAINS.charge.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"외부 전력을 안전한 전류로 협상해 고전압 배터리를 충전합니다."` |
| [src/features/garage/evData.ts:106](../src/features/garage/evData.ts#L106) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].name` | 이름/신호 라벨 | `"충전 연결·잠금 확인"` |
| [src/features/garage/evData.ts:106](../src/features/garage/evData.ts#L106) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:106](../src/features/garage/evData.ts#L106) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].summary` | 요약/기능 설명 | `"커넥터 연결을 확인하고 충전구를 잠근 뒤 충전을 준비합니다."` |
| [src/features/garage/evData.ts:108](../src/features/garage/evData.ts#L108) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 커넥터 삽입"` |
| [src/features/garage/evData.ts:108](../src/features/garage/evData.ts#L108) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"연결 확인"` |
| [src/features/garage/evData.ts:108](../src/features/garage/evData.ts#L108) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"커넥터 잠금"` |
| [src/features/garage/evData.ts:108](../src/features/garage/evData.ts#L108) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 준비"` |
| [src/features/garage/evData.ts:109](../src/features/garage/evData.ts#L109) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 인렛"` |
| [src/features/garage/evData.ts:109](../src/features/garage/evData.ts#L109) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CP·PP 신호"` |
| [src/features/garage/evData.ts:109](../src/features/garage/evData.ts#L109) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전구 잠금 액추에이터"` |
| [src/features/garage/evData.ts:111](../src/features/garage/evData.ts#L111) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PP 저항 판독"` |
| [src/features/garage/evData.ts:111](../src/features/garage/evData.ts#L111) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CP 전압 상태 확인"` |
| [src/features/garage/evData.ts:111](../src/features/garage/evData.ts#L111) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"잠금 조건"` |
| [src/features/garage/evData.ts:111](../src/features/garage/evData.ts#L111) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"잠금 확인 타임아웃"` |
| [src/features/garage/evData.ts:111](../src/features/garage/evData.ts#L111) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[0].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 상태 전이"` |
| [src/features/garage/evData.ts:113](../src/features/garage/evData.ts#L113) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].name` | 이름/신호 라벨 | `"충전 전류 협상"` |
| [src/features/garage/evData.ts:113](../src/features/garage/evData.ts#L113) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:113](../src/features/garage/evData.ts#L113) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].summary` | 요약/기능 설명 | `"충전기 능력과 배터리 수용 한계를 비교해 충전 전류를 정합니다."` |
| [src/features/garage/evData.ts:115](../src/features/garage/evData.ts#L115) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전기 능력"` |
| [src/features/garage/evData.ts:115](../src/features/garage/evData.ts#L115) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"허용 전류 비교"` |
| [src/features/garage/evData.ts:115](../src/features/garage/evData.ts#L115) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 전류 결정"` |
| [src/features/garage/evData.ts:115](../src/features/garage/evData.ts#L115) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 시작"` |
| [src/features/garage/evData.ts:116](../src/features/garage/evData.ts#L116) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전기"` |
| [src/features/garage/evData.ts:116](../src/features/garage/evData.ts#L116) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 충전 요구"` |
| [src/features/garage/evData.ts:118](../src/features/garage/evData.ts#L118) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전기 한계 수신"` |
| [src/features/garage/evData.ts:118](../src/features/garage/evData.ts#L118) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"배터리 수용 한계"` |
| [src/features/garage/evData.ts:118](../src/features/garage/evData.ts#L118) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전류 MIN"` |
| [src/features/garage/evData.ts:118](../src/features/garage/evData.ts#L118) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PWM 듀티 해석"` |
| [src/features/garage/evData.ts:118](../src/features/garage/evData.ts#L118) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[1].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"램프율"` |
| [src/features/garage/evData.ts:120](../src/features/garage/evData.ts#L120) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].name` | 이름/신호 라벨 | `"OBC 변환 제어"` |
| [src/features/garage/evData.ts:120](../src/features/garage/evData.ts#L120) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:120](../src/features/garage/evData.ts#L120) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].summary` | 요약/기능 설명 | `"교류를 직류로 바꾸며 요청된 전류로 팩을 충전합니다."` |
| [src/features/garage/evData.ts:122](../src/features/garage/evData.ts#L122) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"교류 입력"` |
| [src/features/garage/evData.ts:122](../src/features/garage/evData.ts#L122) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"역률 보정"` |
| [src/features/garage/evData.ts:122](../src/features/garage/evData.ts#L122) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"직류 변환"` |
| [src/features/garage/evData.ts:122](../src/features/garage/evData.ts#L122) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"팩 충전"` |
| [src/features/garage/evData.ts:123](../src/features/garage/evData.ts#L123) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 인렛"` |
| [src/features/garage/evData.ts:123](../src/features/garage/evData.ts#L123) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 접촉기"` |
| [src/features/garage/evData.ts:123](../src/features/garage/evData.ts#L123) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"HV 버스"` |
| [src/features/garage/evData.ts:123](../src/features/garage/evData.ts#L123) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고전압 배터리"` |
| [src/features/garage/evData.ts:125](../src/features/garage/evData.ts#L125) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"입력 전압 검사"` |
| [src/features/garage/evData.ts:125](../src/features/garage/evData.ts#L125) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PFC 전압 PI"` |
| [src/features/garage/evData.ts:125](../src/features/garage/evData.ts#L125) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전류 추종 PI"` |
| [src/features/garage/evData.ts:125](../src/features/garage/evData.ts#L125) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"출력 제한"` |
| [src/features/garage/evData.ts:125](../src/features/garage/evData.ts#L125) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[2].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"과전압 진단"` |
| [src/features/garage/evData.ts:127](../src/features/garage/evData.ts#L127) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].name` | 이름/신호 라벨 | `"충전 중 보호·종료"` |
| [src/features/garage/evData.ts:127](../src/features/garage/evData.ts#L127) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:127](../src/features/garage/evData.ts#L127) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].summary` | 요약/기능 설명 | `"온도·절연 이상이나 목표 도달 때 충전을 멈추고 잠금을 풉니다."` |
| [src/features/garage/evData.ts:129](../src/features/garage/evData.ts#L129) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"이상 감지"` |
| [src/features/garage/evData.ts:129](../src/features/garage/evData.ts#L129) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 중단"` |
| [src/features/garage/evData.ts:129](../src/features/garage/evData.ts#L129) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"접촉기 개방"` |
| [src/features/garage/evData.ts:129](../src/features/garage/evData.ts#L129) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"종료 기록"` |
| [src/features/garage/evData.ts:130](../src/features/garage/evData.ts#L130) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터 NTC 센서"` |
| [src/features/garage/evData.ts:130](../src/features/garage/evData.ts#L130) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전압·절연 센서"` |
| [src/features/garage/evData.ts:130](../src/features/garage/evData.ts#L130) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전구 잠금 액추에이터"` |
| [src/features/garage/evData.ts:132](../src/features/garage/evData.ts#L132) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"온도 임계"` |
| [src/features/garage/evData.ts:132](../src/features/garage/evData.ts#L132) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"절연 임계"` |
| [src/features/garage/evData.ts:132](../src/features/garage/evData.ts#L132) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"SOC 종료 조건"` |
| [src/features/garage/evData.ts:132](../src/features/garage/evData.ts#L132) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 중단 명령"` |
| [src/features/garage/evData.ts:132](../src/features/garage/evData.ts#L132) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"잠금 해제 조건"` |
| [src/features/garage/evData.ts:132](../src/features/garage/evData.ts#L132) | `EV_DOMAINS` | `EV_DOMAINS.charge.features.[3].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"종료 상태 래치"` |
| [src/features/garage/evData.ts:137](../src/features/garage/evData.ts#L137) | `EV_DOMAINS` | `EV_DOMAINS.thermal.label` | 표시 라벨/선택지 | `"열관리"` |
| [src/features/garage/evData.ts:137](../src/features/garage/evData.ts#L137) | `EV_DOMAINS` | `EV_DOMAINS.thermal.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"파워트레인"` |
| [src/features/garage/evData.ts:138](../src/features/garage/evData.ts#L138) | `EV_DOMAINS` | `EV_DOMAINS.thermal.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"배터리·모터·인버터·실내 온도를 목표 범위로 유지해 성능과 수명을 지킵니다."` |
| [src/features/garage/evData.ts:140](../src/features/garage/evData.ts#L140) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].name` | 이름/신호 라벨 | `"온도 상태 추정"` |
| [src/features/garage/evData.ts:140](../src/features/garage/evData.ts#L140) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:140](../src/features/garage/evData.ts#L140) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].summary` | 요약/기능 설명 | `"여러 온도 센서를 검증·필터링해 보호에 쓸 열 상태를 만듭니다."` |
| [src/features/garage/evData.ts:142](../src/features/garage/evData.ts#L142) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부품 발열"` |
| [src/features/garage/evData.ts:142](../src/features/garage/evData.ts#L142) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"온도 측정"` |
| [src/features/garage/evData.ts:142](../src/features/garage/evData.ts#L142) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"열 상태 판단"` |
| [src/features/garage/evData.ts:142](../src/features/garage/evData.ts#L142) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"열 요구"` |
| [src/features/garage/evData.ts:143](../src/features/garage/evData.ts#L143) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터 NTC 센서"` |
| [src/features/garage/evData.ts:143](../src/features/garage/evData.ts#L143) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"냉각수 온도센서"` |
| [src/features/garage/evData.ts:145](../src/features/garage/evData.ts#L145) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"범위 검사"` |
| [src/features/garage/evData.ts:145](../src/features/garage/evData.ts#L145) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"필터"` |
| [src/features/garage/evData.ts:145](../src/features/garage/evData.ts#L145) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"최대값 선택"` |
| [src/features/garage/evData.ts:147](../src/features/garage/evData.ts#L147) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].name` | 이름/신호 라벨 | `"펌프·팬·컴프레서 제어"` |
| [src/features/garage/evData.ts:147](../src/features/garage/evData.ts#L147) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:147](../src/features/garage/evData.ts#L147) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].summary` | 요약/기능 설명 | `"목표 온도에 맞춰 펌프 유량과 팬 회전수를 폐루프로 제어합니다."` |
| [src/features/garage/evData.ts:149](../src/features/garage/evData.ts#L149) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"열 요구"` |
| [src/features/garage/evData.ts:149](../src/features/garage/evData.ts#L149) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 유량·풍량"` |
| [src/features/garage/evData.ts:149](../src/features/garage/evData.ts#L149) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"구동 명령"` |
| [src/features/garage/evData.ts:149](../src/features/garage/evData.ts#L149) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"온도 저감"` |
| [src/features/garage/evData.ts:150](../src/features/garage/evData.ts#L150) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"냉각 펌프"` |
| [src/features/garage/evData.ts:150](../src/features/garage/evData.ts#L150) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"냉각 팬"` |
| [src/features/garage/evData.ts:152](../src/features/garage/evData.ts#L152) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"히스테리시스"` |
| [src/features/garage/evData.ts:152](../src/features/garage/evData.ts#L152) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PI 제어"` |
| [src/features/garage/evData.ts:152](../src/features/garage/evData.ts#L152) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"무응답 진단"` |
| [src/features/garage/evData.ts:154](../src/features/garage/evData.ts#L154) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].name` | 이름/신호 라벨 | `"냉각·난방 회로 배분"` |
| [src/features/garage/evData.ts:154](../src/features/garage/evData.ts#L154) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:154](../src/features/garage/evData.ts#L154) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].summary` | 요약/기능 설명 | `"히트펌프로 배터리·구동계·실내 회로에 열을 나누어 보냅니다."` |
| [src/features/garage/evData.ts:156](../src/features/garage/evData.ts#L156) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"열원 우선순위"` |
| [src/features/garage/evData.ts:156](../src/features/garage/evData.ts#L156) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전 모드"` |
| [src/features/garage/evData.ts:156](../src/features/garage/evData.ts#L156) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"회로 전환"` |
| [src/features/garage/evData.ts:156](../src/features/garage/evData.ts#L156) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"열 이동"` |
| [src/features/garage/evData.ts:157](../src/features/garage/evData.ts#L157) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전동 컴프레서"` |
| [src/features/garage/evData.ts:157](../src/features/garage/evData.ts#L157) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"칠러"` |
| [src/features/garage/evData.ts:157](../src/features/garage/evData.ts#L157) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전자식 팽창밸브"` |
| [src/features/garage/evData.ts:157](../src/features/garage/evData.ts#L157) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[1].[6]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PTC 히터"` |
| [src/features/garage/evData.ts:159](../src/features/garage/evData.ts#L159) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모드 상태기"` |
| [src/features/garage/evData.ts:159](../src/features/garage/evData.ts#L159) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전환 지연"` |
| [src/features/garage/evData.ts:159](../src/features/garage/evData.ts#L159) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"밸브 위치 확인"` |
| [src/features/garage/evData.ts:159](../src/features/garage/evData.ts#L159) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"컴프레서 회전수 맵"` |
| [src/features/garage/evData.ts:159](../src/features/garage/evData.ts#L159) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[2].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"피드백 진단"` |
| [src/features/garage/evData.ts:161](../src/features/garage/evData.ts#L161) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].name` | 이름/신호 라벨 | `"열 한계 출력 제한"` |
| [src/features/garage/evData.ts:161](../src/features/garage/evData.ts#L161) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:161](../src/features/garage/evData.ts#L161) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].summary` | 요약/기능 설명 | `"냉각이 부족하면 구동 출력을 단계적으로 낮춰 부품을 보호합니다."` |
| [src/features/garage/evData.ts:163](../src/features/garage/evData.ts#L163) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"온도 초과"` |
| [src/features/garage/evData.ts:163](../src/features/garage/evData.ts#L163) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"디레이팅 단계"` |
| [src/features/garage/evData.ts:163](../src/features/garage/evData.ts#L163) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"출력 제한 요청"` |
| [src/features/garage/evData.ts:163](../src/features/garage/evData.ts#L163) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부품 보호"` |
| [src/features/garage/evData.ts:166](../src/features/garage/evData.ts#L166) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"단계 임계"` |
| [src/features/garage/evData.ts:166](../src/features/garage/evData.ts#L166) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"램프 제한"` |
| [src/features/garage/evData.ts:166](../src/features/garage/evData.ts#L166) | `EV_DOMAINS` | `EV_DOMAINS.thermal.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"복귀 히스테리시스"` |
| [src/features/garage/evData.ts:171](../src/features/garage/evData.ts#L171) | `EV_DOMAINS` | `EV_DOMAINS.brake.label` | 표시 라벨/선택지 | `"제동"` |
| [src/features/garage/evData.ts:171](../src/features/garage/evData.ts#L171) | `EV_DOMAINS` | `EV_DOMAINS.brake.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"섀시"` |
| [src/features/garage/evData.ts:172](../src/features/garage/evData.ts#L172) | `EV_DOMAINS` | `EV_DOMAINS.brake.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"감속 요구를 회생과 마찰로 나눠 안전하게 멈춥니다."` |
| [src/features/garage/evData.ts:174](../src/features/garage/evData.ts#L174) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].name` | 이름/신호 라벨 | `"제동력 요구 계산"` |
| [src/features/garage/evData.ts:174](../src/features/garage/evData.ts#L174) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:174](../src/features/garage/evData.ts#L174) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].summary` | 요약/기능 설명 | `"페달 입력을 목표 감속도와 총 제동력으로 바꿉니다."` |
| [src/features/garage/evData.ts:176](../src/features/garage/evData.ts#L176) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"페달 조작"` |
| [src/features/garage/evData.ts:176](../src/features/garage/evData.ts#L176) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"감속 의도"` |
| [src/features/garage/evData.ts:176](../src/features/garage/evData.ts#L176) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 감속도"` |
| [src/features/garage/evData.ts:176](../src/features/garage/evData.ts#L176) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"총 제동력"` |
| [src/features/garage/evData.ts:176](../src/features/garage/evData.ts#L176) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 감속"` |
| [src/features/garage/evData.ts:177](../src/features/garage/evData.ts#L177) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"페달 A/B 센서"` |
| [src/features/garage/evData.ts:177](../src/features/garage/evData.ts#L177) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"압력 제어기"` |
| [src/features/garage/evData.ts:177](../src/features/garage/evData.ts#L177) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"유압 라인"` |
| [src/features/garage/evData.ts:177](../src/features/garage/evData.ts#L177) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"4륜 캘리퍼"` |
| [src/features/garage/evData.ts:179](../src/features/garage/evData.ts#L179) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"입력 상관성"` |
| [src/features/garage/evData.ts:179](../src/features/garage/evData.ts#L179) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"페달 필터"` |
| [src/features/garage/evData.ts:179](../src/features/garage/evData.ts#L179) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"감속 맵"` |
| [src/features/garage/evData.ts:179](../src/features/garage/evData.ts#L179) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"힘 제한"` |
| [src/features/garage/evData.ts:179](../src/features/garage/evData.ts#L179) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"압력 변환"` |
| [src/features/garage/evData.ts:179](../src/features/garage/evData.ts#L179) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[0].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"출력 램프"` |
| [src/features/garage/evData.ts:181](../src/features/garage/evData.ts#L181) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].name` | 이름/신호 라벨 | `"회생·마찰 협조"` |
| [src/features/garage/evData.ts:181](../src/features/garage/evData.ts#L181) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:181](../src/features/garage/evData.ts#L181) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].summary` | 요약/기능 설명 | `"가능한 회생제동을 먼저 쓰고 부족분을 마찰제동으로 채웁니다."` |
| [src/features/garage/evData.ts:183](../src/features/garage/evData.ts#L183) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"총 제동 요구"` |
| [src/features/garage/evData.ts:183](../src/features/garage/evData.ts#L183) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"배터리 수용량"` |
| [src/features/garage/evData.ts:183](../src/features/garage/evData.ts#L183) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"회생 한계"` |
| [src/features/garage/evData.ts:183](../src/features/garage/evData.ts#L183) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"마찰 보상"` |
| [src/features/garage/evData.ts:183](../src/features/garage/evData.ts#L183) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전·후륜 배분"` |
| [src/features/garage/evData.ts:183](../src/features/garage/evData.ts#L183) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[0].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"일관된 감속"` |
| [src/features/garage/evData.ts:184](../src/features/garage/evData.ts#L184) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"인버터"` |
| [src/features/garage/evData.ts:184](../src/features/garage/evData.ts#L184) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[1].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터·캘리퍼"` |
| [src/features/garage/evData.ts:186](../src/features/garage/evData.ts#L186) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 수신"` |
| [src/features/garage/evData.ts:186](../src/features/garage/evData.ts#L186) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"회생 가용량"` |
| [src/features/garage/evData.ts:186](../src/features/garage/evData.ts#L186) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"회생 MIN"` |
| [src/features/garage/evData.ts:186](../src/features/garage/evData.ts#L186) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"잔여력 계산"` |
| [src/features/garage/evData.ts:186](../src/features/garage/evData.ts#L186) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"마찰 압력"` |
| [src/features/garage/evData.ts:186](../src/features/garage/evData.ts#L186) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[1].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"블렌딩 피드백"` |
| [src/features/garage/evData.ts:188](../src/features/garage/evData.ts#L188) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].name` | 이름/신호 라벨 | `"ABS·EBD 휠 슬립 제어"` |
| [src/features/garage/evData.ts:188](../src/features/garage/evData.ts#L188) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:188](../src/features/garage/evData.ts#L188) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].summary` | 요약/기능 설명 | `"휠 슬립을 감시해 잠김 직전 바퀴의 압력을 조절합니다."` |
| [src/features/garage/evData.ts:190](../src/features/garage/evData.ts#L190) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"휠 잠김 징후"` |
| [src/features/garage/evData.ts:190](../src/features/garage/evData.ts#L190) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차속 추정"` |
| [src/features/garage/evData.ts:190](../src/features/garage/evData.ts#L190) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"슬립 계산"` |
| [src/features/garage/evData.ts:190](../src/features/garage/evData.ts#L190) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"밸브 조절"` |
| [src/features/garage/evData.ts:190](../src/features/garage/evData.ts#L190) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"조향 가능 제동"` |
| [src/features/garage/evData.ts:191](../src/features/garage/evData.ts#L191) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"4륜 속도센서"` |
| [src/features/garage/evData.ts:191](../src/features/garage/evData.ts#L191) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"유압 모듈레이터"` |
| [src/features/garage/evData.ts:191](../src/features/garage/evData.ts#L191) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"솔레노이드 밸브"` |
| [src/features/garage/evData.ts:191](../src/features/garage/evData.ts#L191) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"캘리퍼"` |
| [src/features/garage/evData.ts:193](../src/features/garage/evData.ts#L193) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"휠속 필터"` |
| [src/features/garage/evData.ts:193](../src/features/garage/evData.ts#L193) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"기준 차속"` |
| [src/features/garage/evData.ts:193](../src/features/garage/evData.ts#L193) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"슬립 임계"` |
| [src/features/garage/evData.ts:193](../src/features/garage/evData.ts#L193) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"감압·유지·증압"` |
| [src/features/garage/evData.ts:193](../src/features/garage/evData.ts#L193) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"밸브 PWM"` |
| [src/features/garage/evData.ts:193](../src/features/garage/evData.ts#L193) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[2].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"재평가"` |
| [src/features/garage/evData.ts:195](../src/features/garage/evData.ts#L195) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].name` | 이름/신호 라벨 | `"ESC 차체 안정 제어"` |
| [src/features/garage/evData.ts:195](../src/features/garage/evData.ts#L195) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:195](../src/features/garage/evData.ts#L195) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].summary` | 요약/기능 설명 | `"요 움직임을 감지해 바퀴별 제동력으로 자세를 안정시킵니다."` |
| [src/features/garage/evData.ts:197](../src/features/garage/evData.ts#L197) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"회전 불안정"` |
| [src/features/garage/evData.ts:197](../src/features/garage/evData.ts#L197) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 요율"` |
| [src/features/garage/evData.ts:197](../src/features/garage/evData.ts#L197) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요 오차"` |
| [src/features/garage/evData.ts:197](../src/features/garage/evData.ts#L197) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"개별 휠 제동"` |
| [src/features/garage/evData.ts:197](../src/features/garage/evData.ts#L197) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차체 안정"` |
| [src/features/garage/evData.ts:198](../src/features/garage/evData.ts#L198) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요·횡가속 센서"` |
| [src/features/garage/evData.ts:198](../src/features/garage/evData.ts#L198) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"유압 모듈"` |
| [src/features/garage/evData.ts:198](../src/features/garage/evData.ts#L198) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"4륜 캘리퍼"` |
| [src/features/garage/evData.ts:200](../src/features/garage/evData.ts#L200) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"센서 융합"` |
| [src/features/garage/evData.ts:200](../src/features/garage/evData.ts#L200) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 요율"` |
| [src/features/garage/evData.ts:200](../src/features/garage/evData.ts#L200) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"오차 PI"` |
| [src/features/garage/evData.ts:200](../src/features/garage/evData.ts#L200) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"휠 선택"` |
| [src/features/garage/evData.ts:200](../src/features/garage/evData.ts#L200) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"압력 제한"` |
| [src/features/garage/evData.ts:200](../src/features/garage/evData.ts#L200) | `EV_DOMAINS` | `EV_DOMAINS.brake.features.[3].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"개입 종료"` |
| [src/features/garage/evData.ts:205](../src/features/garage/evData.ts#L205) | `EV_DOMAINS` | `EV_DOMAINS.steer.label` | 표시 라벨/선택지 | `"조향"` |
| [src/features/garage/evData.ts:205](../src/features/garage/evData.ts#L205) | `EV_DOMAINS` | `EV_DOMAINS.steer.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"섀시"` |
| [src/features/garage/evData.ts:206](../src/features/garage/evData.ts#L206) | `EV_DOMAINS` | `EV_DOMAINS.steer.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"핸들 입력과 EPS 보조를 전륜 각도로 바꿉니다."` |
| [src/features/garage/evData.ts:208](../src/features/garage/evData.ts#L208) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].name` | 이름/신호 라벨 | `"조향 입력 해석"` |
| [src/features/garage/evData.ts:208](../src/features/garage/evData.ts#L208) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:208](../src/features/garage/evData.ts#L208) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].summary` | 요약/기능 설명 | `"핸들 각도를 검증해 목표 전륜각으로 바꿉니다."` |
| [src/features/garage/evData.ts:210](../src/features/garage/evData.ts#L210) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"핸들 회전"` |
| [src/features/garage/evData.ts:210](../src/features/garage/evData.ts#L210) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전자 조향 의도"` |
| [src/features/garage/evData.ts:210](../src/features/garage/evData.ts#L210) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 전륜각"` |
| [src/features/garage/evData.ts:210](../src/features/garage/evData.ts#L210) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"랙 이동"` |
| [src/features/garage/evData.ts:210](../src/features/garage/evData.ts#L210) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"진로 변경"` |
| [src/features/garage/evData.ts:211](../src/features/garage/evData.ts#L211) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"핸들각 센서"` |
| [src/features/garage/evData.ts:211](../src/features/garage/evData.ts#L211) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"EPS 모터"` |
| [src/features/garage/evData.ts:211](../src/features/garage/evData.ts#L211) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"랙·타이로드"` |
| [src/features/garage/evData.ts:211](../src/features/garage/evData.ts#L211) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전륜"` |
| [src/features/garage/evData.ts:213](../src/features/garage/evData.ts#L213) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"각도 보정"` |
| [src/features/garage/evData.ts:213](../src/features/garage/evData.ts#L213) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"조향비 맵"` |
| [src/features/garage/evData.ts:213](../src/features/garage/evData.ts#L213) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 랙 위치"` |
| [src/features/garage/evData.ts:213](../src/features/garage/evData.ts#L213) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"추종 PI"` |
| [src/features/garage/evData.ts:213](../src/features/garage/evData.ts#L213) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"각도 제한"` |
| [src/features/garage/evData.ts:213](../src/features/garage/evData.ts#L213) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[0].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"피드백 진단"` |
| [src/features/garage/evData.ts:215](../src/features/garage/evData.ts#L215) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].name` | 이름/신호 라벨 | `"EPS 보조 토크 계산"` |
| [src/features/garage/evData.ts:215](../src/features/garage/evData.ts#L215) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:215](../src/features/garage/evData.ts#L215) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].summary` | 요약/기능 설명 | `"차속과 운전자 토크로 자연스러운 보조 토크를 만듭니다."` |
| [src/features/garage/evData.ts:217](../src/features/garage/evData.ts#L217) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전자 토크"` |
| [src/features/garage/evData.ts:217](../src/features/garage/evData.ts#L217) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차속 보정"` |
| [src/features/garage/evData.ts:217](../src/features/garage/evData.ts#L217) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"보조 토크"` |
| [src/features/garage/evData.ts:217](../src/features/garage/evData.ts#L217) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"EPS 모터"` |
| [src/features/garage/evData.ts:217](../src/features/garage/evData.ts#L217) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가벼운 조향"` |
| [src/features/garage/evData.ts:218](../src/features/garage/evData.ts#L218) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"토크 센서"` |
| [src/features/garage/evData.ts:218](../src/features/garage/evData.ts#L218) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차속 CAN"` |
| [src/features/garage/evData.ts:218](../src/features/garage/evData.ts#L218) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터 인버터"` |
| [src/features/garage/evData.ts:218](../src/features/garage/evData.ts#L218) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"조향축"` |
| [src/features/garage/evData.ts:220](../src/features/garage/evData.ts#L220) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"센터 보정"` |
| [src/features/garage/evData.ts:220](../src/features/garage/evData.ts#L220) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"토크 필터"` |
| [src/features/garage/evData.ts:220](../src/features/garage/evData.ts#L220) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"속도별 맵"` |
| [src/features/garage/evData.ts:220](../src/features/garage/evData.ts#L220) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"복원 토크"` |
| [src/features/garage/evData.ts:220](../src/features/garage/evData.ts#L220) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전류 PI"` |
| [src/features/garage/evData.ts:220](../src/features/garage/evData.ts#L220) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[1].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"보호 제한"` |
| [src/features/garage/evData.ts:222](../src/features/garage/evData.ts#L222) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].name` | 이름/신호 라벨 | `"모터 전류 제어·랙 구동"` |
| [src/features/garage/evData.ts:222](../src/features/garage/evData.ts#L222) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:222](../src/features/garage/evData.ts#L222) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].summary` | 요약/기능 설명 | `"EPS 모터 회전을 랙과 타이로드로 양쪽 전륜에 전달합니다."` |
| [src/features/garage/evData.ts:224](../src/features/garage/evData.ts#L224) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"EPS 모터"` |
| [src/features/garage/evData.ts:224](../src/features/garage/evData.ts#L224) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"웜 감속"` |
| [src/features/garage/evData.ts:224](../src/features/garage/evData.ts#L224) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"피니언"` |
| [src/features/garage/evData.ts:224](../src/features/garage/evData.ts#L224) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"랙 직선 이동"` |
| [src/features/garage/evData.ts:224](../src/features/garage/evData.ts#L224) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"타이로드"` |
| [src/features/garage/evData.ts:224](../src/features/garage/evData.ts#L224) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[0].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"좌·우 전륜각"` |
| [src/features/garage/evData.ts:225](../src/features/garage/evData.ts#L225) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"EPS 모터"` |
| [src/features/garage/evData.ts:225](../src/features/garage/evData.ts#L225) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"감속기"` |
| [src/features/garage/evData.ts:225](../src/features/garage/evData.ts#L225) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"피니언"` |
| [src/features/garage/evData.ts:225](../src/features/garage/evData.ts#L225) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"랙"` |
| [src/features/garage/evData.ts:225](../src/features/garage/evData.ts#L225) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"타이로드"` |
| [src/features/garage/evData.ts:225](../src/features/garage/evData.ts#L225) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[1].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전륜 너클"` |
| [src/features/garage/evData.ts:227](../src/features/garage/evData.ts#L227) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터각"` |
| [src/features/garage/evData.ts:227](../src/features/garage/evData.ts#L227) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"기어비"` |
| [src/features/garage/evData.ts:227](../src/features/garage/evData.ts#L227) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"랙 변환"` |
| [src/features/garage/evData.ts:227](../src/features/garage/evData.ts#L227) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"스트로크 제한"` |
| [src/features/garage/evData.ts:227](../src/features/garage/evData.ts#L227) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"아커만 보정"` |
| [src/features/garage/evData.ts:227](../src/features/garage/evData.ts#L227) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[2].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"각도 피드백"` |
| [src/features/garage/evData.ts:229](../src/features/garage/evData.ts#L229) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].name` | 이름/신호 라벨 | `"폴백·안정 협조"` |
| [src/features/garage/evData.ts:229](../src/features/garage/evData.ts#L229) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:229](../src/features/garage/evData.ts#L229) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].summary` | 요약/기능 설명 | `"센서 고장 때 보조를 줄이고 ESC와 협조해 진로를 유지합니다."` |
| [src/features/garage/evData.ts:231](../src/features/garage/evData.ts#L231) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"조향 요구"` |
| [src/features/garage/evData.ts:231](../src/features/garage/evData.ts#L231) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차체 요 반응"` |
| [src/features/garage/evData.ts:231](../src/features/garage/evData.ts#L231) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"안정도 판단"` |
| [src/features/garage/evData.ts:231](../src/features/garage/evData.ts#L231) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"오버레이 토크"` |
| [src/features/garage/evData.ts:231](../src/features/garage/evData.ts#L231) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[0].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"진로 유지"` |
| [src/features/garage/evData.ts:232](../src/features/garage/evData.ts#L232) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"조향각 센서"` |
| [src/features/garage/evData.ts:232](../src/features/garage/evData.ts#L232) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[1].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전륜"` |
| [src/features/garage/evData.ts:234](../src/features/garage/evData.ts#L234) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요율 오차"` |
| [src/features/garage/evData.ts:234](../src/features/garage/evData.ts#L234) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"횡가속 검증"` |
| [src/features/garage/evData.ts:234](../src/features/garage/evData.ts#L234) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"안정 협조"` |
| [src/features/garage/evData.ts:234](../src/features/garage/evData.ts#L234) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"보정 게인"` |
| [src/features/garage/evData.ts:234](../src/features/garage/evData.ts#L234) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"개입 제한"` |
| [src/features/garage/evData.ts:234](../src/features/garage/evData.ts#L234) | `EV_DOMAINS` | `EV_DOMAINS.steer.features.[3].layers.[3].[5]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"폴백"` |
| [src/features/garage/evData.ts:239](../src/features/garage/evData.ts#L239) | `EV_DOMAINS` | `EV_DOMAINS.suspension.label` | 표시 라벨/선택지 | `"현가"` |
| [src/features/garage/evData.ts:239](../src/features/garage/evData.ts#L239) | `EV_DOMAINS` | `EV_DOMAINS.suspension.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"섀시"` |
| [src/features/garage/evData.ts:240](../src/features/garage/evData.ts#L240) | `EV_DOMAINS` | `EV_DOMAINS.suspension.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"노면 충격을 흡수하고 타이어 접지와 차체 자세를 안정적으로 유지합니다."` |
| [src/features/garage/evData.ts:242](../src/features/garage/evData.ts#L242) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].name` | 이름/신호 라벨 | `"노면 입력 해석"` |
| [src/features/garage/evData.ts:242](../src/features/garage/evData.ts#L242) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:242](../src/features/garage/evData.ts#L242) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].summary` | 요약/기능 설명 | `"가속도·차고 센서 값으로 노면과 차체 움직임을 파악합니다."` |
| [src/features/garage/evData.ts:244](../src/features/garage/evData.ts#L244) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"노면 요철"` |
| [src/features/garage/evData.ts:244](../src/features/garage/evData.ts#L244) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"휠 상하 운동"` |
| [src/features/garage/evData.ts:244](../src/features/garage/evData.ts#L244) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"센서 측정"` |
| [src/features/garage/evData.ts:244](../src/features/garage/evData.ts#L244) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"노면 상태 판단"` |
| [src/features/garage/evData.ts:245](../src/features/garage/evData.ts#L245) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"휠 가속도센서"` |
| [src/features/garage/evData.ts:245](../src/features/garage/evData.ts#L245) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차고 높이 센서"` |
| [src/features/garage/evData.ts:247](../src/features/garage/evData.ts#L247) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가속도 필터"` |
| [src/features/garage/evData.ts:247](../src/features/garage/evData.ts#L247) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"변위 보정"` |
| [src/features/garage/evData.ts:247](../src/features/garage/evData.ts#L247) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"범위 검사"` |
| [src/features/garage/evData.ts:247](../src/features/garage/evData.ts#L247) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"노면 등급 판단"` |
| [src/features/garage/evData.ts:249](../src/features/garage/evData.ts#L249) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].name` | 이름/신호 라벨 | `"댐핑력 제어"` |
| [src/features/garage/evData.ts:249](../src/features/garage/evData.ts#L249) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:249](../src/features/garage/evData.ts#L249) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].summary` | 요약/기능 설명 | `"전자제어 댐퍼가 차속과 차체 운동에 맞춰 감쇠력을 조절합니다."` |
| [src/features/garage/evData.ts:251](../src/features/garage/evData.ts#L251) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차체 운동"` |
| [src/features/garage/evData.ts:251](../src/features/garage/evData.ts#L251) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 감쇠력"` |
| [src/features/garage/evData.ts:251](../src/features/garage/evData.ts#L251) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"밸브 전류"` |
| [src/features/garage/evData.ts:251](../src/features/garage/evData.ts#L251) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"감쇠력"` |
| [src/features/garage/evData.ts:252](../src/features/garage/evData.ts#L252) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"댐퍼 밸브"` |
| [src/features/garage/evData.ts:252](../src/features/garage/evData.ts#L252) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"댐퍼"` |
| [src/features/garage/evData.ts:254](../src/features/garage/evData.ts#L254) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"신호 필터"` |
| [src/features/garage/evData.ts:254](../src/features/garage/evData.ts#L254) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차속별 맵"` |
| [src/features/garage/evData.ts:254](../src/features/garage/evData.ts#L254) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"맵 보간"` |
| [src/features/garage/evData.ts:254](../src/features/garage/evData.ts#L254) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전류 제한"` |
| [src/features/garage/evData.ts:254](../src/features/garage/evData.ts#L254) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[1].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"폴백 댐핑"` |
| [src/features/garage/evData.ts:256](../src/features/garage/evData.ts#L256) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].name` | 이름/신호 라벨 | `"차고·자세 유지"` |
| [src/features/garage/evData.ts:256](../src/features/garage/evData.ts#L256) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:256](../src/features/garage/evData.ts#L256) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].summary` | 요약/기능 설명 | `"에어 스프링 사양에서 차고 오차를 압력 조절로 바로잡습니다."` |
| [src/features/garage/evData.ts:258](../src/features/garage/evData.ts#L258) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차고 오차"` |
| [src/features/garage/evData.ts:258](../src/features/garage/evData.ts#L258) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 압력"` |
| [src/features/garage/evData.ts:258](../src/features/garage/evData.ts#L258) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"밸브·컴프레서 구동"` |
| [src/features/garage/evData.ts:258](../src/features/garage/evData.ts#L258) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차고 복원"` |
| [src/features/garage/evData.ts:259](../src/features/garage/evData.ts#L259) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차고 높이 센서"` |
| [src/features/garage/evData.ts:261](../src/features/garage/evData.ts#L261) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 차고 설정"` |
| [src/features/garage/evData.ts:261](../src/features/garage/evData.ts#L261) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"밸브 상태기"` |
| [src/features/garage/evData.ts:261](../src/features/garage/evData.ts#L261) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"압력 제한"` |
| [src/features/garage/evData.ts:261](../src/features/garage/evData.ts#L261) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"누설 진단"` |
| [src/features/garage/evData.ts:263](../src/features/garage/evData.ts#L263) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].name` | 이름/신호 라벨 | `"센서 고장 폴백"` |
| [src/features/garage/evData.ts:263](../src/features/garage/evData.ts#L263) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:263](../src/features/garage/evData.ts#L263) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].summary` | 요약/기능 설명 | `"센서 이상을 판별해 고정 댐핑으로 바꾸고 경고합니다."` |
| [src/features/garage/evData.ts:265](../src/features/garage/evData.ts#L265) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"이상 징후"` |
| [src/features/garage/evData.ts:265](../src/features/garage/evData.ts#L265) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"센서 판정"` |
| [src/features/garage/evData.ts:265](../src/features/garage/evData.ts#L265) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"보호 모드"` |
| [src/features/garage/evData.ts:265](../src/features/garage/evData.ts#L265) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"경고"` |
| [src/features/garage/evData.ts:266](../src/features/garage/evData.ts#L266) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"휠 가속도센서"` |
| [src/features/garage/evData.ts:266](../src/features/garage/evData.ts#L266) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차고 높이 센서"` |
| [src/features/garage/evData.ts:268](../src/features/garage/evData.ts#L268) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"신호 타당성 진단"` |
| [src/features/garage/evData.ts:268](../src/features/garage/evData.ts#L268) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"임계 판단"` |
| [src/features/garage/evData.ts:268](../src/features/garage/evData.ts#L268) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고정 댐핑 전환"` |
| [src/features/garage/evData.ts:268](../src/features/garage/evData.ts#L268) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"복귀 조건"` |
| [src/features/garage/evData.ts:268](../src/features/garage/evData.ts#L268) | `EV_DOMAINS` | `EV_DOMAINS.suspension.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"경고 요청"` |
| [src/features/garage/evData.ts:273](../src/features/garage/evData.ts#L273) | `EV_DOMAINS` | `EV_DOMAINS.gear.label` | 표시 라벨/선택지 | `"변속·주차"` |
| [src/features/garage/evData.ts:273](../src/features/garage/evData.ts#L273) | `EV_DOMAINS` | `EV_DOMAINS.gear.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"섀시"` |
| [src/features/garage/evData.ts:274](../src/features/garage/evData.ts#L274) | `EV_DOMAINS` | `EV_DOMAINS.gear.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전자의 변속 의도를 검증해 주행 방향과 주차 잠금을 결정합니다."` |
| [src/features/garage/evData.ts:276](../src/features/garage/evData.ts#L276) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].name` | 이름/신호 라벨 | `"PRND 입력 판독"` |
| [src/features/garage/evData.ts:276](../src/features/garage/evData.ts#L276) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:276](../src/features/garage/evData.ts#L276) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].summary` | 요약/기능 설명 | `"접점과 통신 신호를 서로 검증해 변속 의도를 확정합니다."` |
| [src/features/garage/evData.ts:278](../src/features/garage/evData.ts#L278) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PRND 조작"` |
| [src/features/garage/evData.ts:278](../src/features/garage/evData.ts#L278) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"접점·통신 확인"` |
| [src/features/garage/evData.ts:278](../src/features/garage/evData.ts#L278) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"변속 의도"` |
| [src/features/garage/evData.ts:278](../src/features/garage/evData.ts#L278) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"유효 상태"` |
| [src/features/garage/evData.ts:279](../src/features/garage/evData.ts#L279) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"PRND 센서"` |
| [src/features/garage/evData.ts:281](../src/features/garage/evData.ts#L281) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"디바운스"` |
| [src/features/garage/evData.ts:281](../src/features/garage/evData.ts#L281) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"접점·통신 상관성"` |
| [src/features/garage/evData.ts:281](../src/features/garage/evData.ts#L281) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"상태 래치"` |
| [src/features/garage/evData.ts:281](../src/features/garage/evData.ts#L281) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"타임아웃 확인"` |
| [src/features/garage/evData.ts:283](../src/features/garage/evData.ts#L283) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].name` | 이름/신호 라벨 | `"방향 전환 인터록"` |
| [src/features/garage/evData.ts:283](../src/features/garage/evData.ts#L283) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:283](../src/features/garage/evData.ts#L283) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].summary` | 요약/기능 설명 | `"주행 중 반대 방향 선택을 막고 브레이크 조건을 확인합니다."` |
| [src/features/garage/evData.ts:285](../src/features/garage/evData.ts#L285) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"방향 요청"` |
| [src/features/garage/evData.ts:285](../src/features/garage/evData.ts#L285) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차속·브레이크 확인"` |
| [src/features/garage/evData.ts:285](../src/features/garage/evData.ts#L285) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"방향 허용"` |
| [src/features/garage/evData.ts:285](../src/features/garage/evData.ts#L285) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"거부 시 현재 유지"` |
| [src/features/garage/evData.ts:288](../src/features/garage/evData.ts#L288) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차속 임계"` |
| [src/features/garage/evData.ts:288](../src/features/garage/evData.ts#L288) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"브레이크 조건"` |
| [src/features/garage/evData.ts:288](../src/features/garage/evData.ts#L288) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"방향 허용 Gate"` |
| [src/features/garage/evData.ts:288](../src/features/garage/evData.ts#L288) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"거부 진단"` |
| [src/features/garage/evData.ts:290](../src/features/garage/evData.ts#L290) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].name` | 이름/신호 라벨 | `"P단 잠금 제어"` |
| [src/features/garage/evData.ts:290](../src/features/garage/evData.ts#L290) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:290](../src/features/garage/evData.ts#L290) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].summary` | 요약/기능 설명 | `"정지를 확인한 뒤 전동 파킹 액추에이터를 체결합니다."` |
| [src/features/garage/evData.ts:292](../src/features/garage/evData.ts#L292) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"P 요청"` |
| [src/features/garage/evData.ts:292](../src/features/garage/evData.ts#L292) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"정지 확인"` |
| [src/features/garage/evData.ts:292](../src/features/garage/evData.ts#L292) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"잠금 체결"` |
| [src/features/garage/evData.ts:292](../src/features/garage/evData.ts#L292) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 고정"` |
| [src/features/garage/evData.ts:295](../src/features/garage/evData.ts#L295) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차속 0 확인"` |
| [src/features/garage/evData.ts:295](../src/features/garage/evData.ts#L295) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전류 제한"` |
| [src/features/garage/evData.ts:295](../src/features/garage/evData.ts#L295) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"체결 위치 확인"` |
| [src/features/garage/evData.ts:295](../src/features/garage/evData.ts#L295) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"체결 실패 진단"` |
| [src/features/garage/evData.ts:297](../src/features/garage/evData.ts#L297) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].name` | 이름/신호 라벨 | `"기어 상태 배포·표시"` |
| [src/features/garage/evData.ts:297](../src/features/garage/evData.ts#L297) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:297](../src/features/garage/evData.ts#L297) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].summary` | 요약/기능 설명 | `"확정된 기어 상태를 계기판과 관련 제어기에 일관되게 전달합니다."` |
| [src/features/garage/evData.ts:299](../src/features/garage/evData.ts#L299) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"기어 상태"` |
| [src/features/garage/evData.ts:299](../src/features/garage/evData.ts#L299) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"네트워크 송신"` |
| [src/features/garage/evData.ts:299](../src/features/garage/evData.ts#L299) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"수신 확인"` |
| [src/features/garage/evData.ts:299](../src/features/garage/evData.ts#L299) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"표시·제어"` |
| [src/features/garage/evData.ts:302](../src/features/garage/evData.ts#L302) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"상태 인코딩"` |
| [src/features/garage/evData.ts:302](../src/features/garage/evData.ts#L302) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"E2E 확인"` |
| [src/features/garage/evData.ts:302](../src/features/garage/evData.ts#L302) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"롤링 카운터"` |
| [src/features/garage/evData.ts:302](../src/features/garage/evData.ts#L302) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"타임아웃"` |
| [src/features/garage/evData.ts:302](../src/features/garage/evData.ts#L302) | `EV_DOMAINS` | `EV_DOMAINS.gear.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"기본값 처리"` |
| [src/features/garage/evData.ts:307](../src/features/garage/evData.ts#L307) | `EV_DOMAINS` | `EV_DOMAINS.vcu.label` | 표시 라벨/선택지 | `"차량 통합"` |
| [src/features/garage/evData.ts:307](../src/features/garage/evData.ts#L307) | `EV_DOMAINS` | `EV_DOMAINS.vcu.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 제어"` |
| [src/features/garage/evData.ts:308](../src/features/garage/evData.ts#L308) | `EV_DOMAINS` | `EV_DOMAINS.vcu.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 상태를 관리하고 도메인 요구를 중재해 안전한 동작을 결정합니다."` |
| [src/features/garage/evData.ts:310](../src/features/garage/evData.ts#L310) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].name` | 이름/신호 라벨 | `"차량 상태 관리"` |
| [src/features/garage/evData.ts:310](../src/features/garage/evData.ts#L310) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:310](../src/features/garage/evData.ts#L310) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].summary` | 요약/기능 설명 | `"시동 요청과 조건을 보고 SLEEP·READY·DRIVE·FAULT 상태를 전환합니다."` |
| [src/features/garage/evData.ts:312](../src/features/garage/evData.ts#L312) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"시동 요청"` |
| [src/features/garage/evData.ts:312](../src/features/garage/evData.ts#L312) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"상태 판단"` |
| [src/features/garage/evData.ts:312](../src/features/garage/evData.ts#L312) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"상태 전이"` |
| [src/features/garage/evData.ts:312](../src/features/garage/evData.ts#L312) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"주행 가능"` |
| [src/features/garage/evData.ts:313](../src/features/garage/evData.ts#L313) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"START 버튼"` |
| [src/features/garage/evData.ts:313](../src/features/garage/evData.ts#L313) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 상태"` |
| [src/features/garage/evData.ts:315](../src/features/garage/evData.ts#L315) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"시동 조건 확인"` |
| [src/features/garage/evData.ts:315](../src/features/garage/evData.ts#L315) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"상태 전이 표"` |
| [src/features/garage/evData.ts:315](../src/features/garage/evData.ts#L315) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"브레이크 조건"` |
| [src/features/garage/evData.ts:315](../src/features/garage/evData.ts#L315) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"READY 래치"` |
| [src/features/garage/evData.ts:315](../src/features/garage/evData.ts#L315) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[0].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"SLEEP 타임아웃"` |
| [src/features/garage/evData.ts:317](../src/features/garage/evData.ts#L317) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].name` | 이름/신호 라벨 | `"도메인 요구 중재"` |
| [src/features/garage/evData.ts:317](../src/features/garage/evData.ts#L317) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:317](../src/features/garage/evData.ts#L317) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].summary` | 요약/기능 설명 | `"구동·제동·열 요구가 겹칠 때 우선순위를 정해 최종 요구를 확정합니다."` |
| [src/features/garage/evData.ts:319](../src/features/garage/evData.ts#L319) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"토크 요구"` |
| [src/features/garage/evData.ts:319](../src/features/garage/evData.ts#L319) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제동 요구"` |
| [src/features/garage/evData.ts:319](../src/features/garage/evData.ts#L319) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"우선순위 판단"` |
| [src/features/garage/evData.ts:319](../src/features/garage/evData.ts#L319) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"최종 요구"` |
| [src/features/garage/evData.ts:320](../src/features/garage/evData.ts#L320) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"APS 가속 페달"` |
| [src/features/garage/evData.ts:320](../src/features/garage/evData.ts#L320) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"MCU·인버터 ECU"` |
| [src/features/garage/evData.ts:322](../src/features/garage/evData.ts#L322) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 수신"` |
| [src/features/garage/evData.ts:322](../src/features/garage/evData.ts#L322) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"우선순위 선택"` |
| [src/features/garage/evData.ts:322](../src/features/garage/evData.ts#L322) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충돌 요구 MIN"` |
| [src/features/garage/evData.ts:322](../src/features/garage/evData.ts#L322) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"램프율"` |
| [src/features/garage/evData.ts:322](../src/features/garage/evData.ts#L322) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[1].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"최종 요구 확정"` |
| [src/features/garage/evData.ts:324](../src/features/garage/evData.ts#L324) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].name` | 이름/신호 라벨 | `"12V 전원 관리"` |
| [src/features/garage/evData.ts:324](../src/features/garage/evData.ts#L324) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:324](../src/features/garage/evData.ts#L324) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].summary` | 요약/기능 설명 | `"DC/DC 출력을 조절해 12V 전장품에 안정적으로 전원을 공급합니다."` |
| [src/features/garage/evData.ts:326](../src/features/garage/evData.ts#L326) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"저전압 감시"` |
| [src/features/garage/evData.ts:326](../src/features/garage/evData.ts#L326) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"DC/DC 목표"` |
| [src/features/garage/evData.ts:326](../src/features/garage/evData.ts#L326) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"12V 공급"` |
| [src/features/garage/evData.ts:326](../src/features/garage/evData.ts#L326) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전장품 동작"` |
| [src/features/garage/evData.ts:327](../src/features/garage/evData.ts#L327) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"12V 배터리"` |
| [src/features/garage/evData.ts:327](../src/features/garage/evData.ts#L327) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"LV 부하"` |
| [src/features/garage/evData.ts:329](../src/features/garage/evData.ts#L329) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전압 범위 검사"` |
| [src/features/garage/evData.ts:329](../src/features/garage/evData.ts#L329) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"DCDC 목표 전압 맵"` |
| [src/features/garage/evData.ts:329](../src/features/garage/evData.ts#L329) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전류 제한"` |
| [src/features/garage/evData.ts:329](../src/features/garage/evData.ts#L329) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"저전압 보호 판단"` |
| [src/features/garage/evData.ts:329](../src/features/garage/evData.ts#L329) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[2].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부하 차단 상태"` |
| [src/features/garage/evData.ts:331](../src/features/garage/evData.ts#L331) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].name` | 이름/신호 라벨 | `"고장 등급·안전 상태"` |
| [src/features/garage/evData.ts:331](../src/features/garage/evData.ts#L331) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:331](../src/features/garage/evData.ts#L331) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].summary` | 요약/기능 설명 | `"제어기 고장을 등급으로 나누고 림프홈 같은 안전 상태로 전이합니다."` |
| [src/features/garage/evData.ts:333](../src/features/garage/evData.ts#L333) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고장 감지"` |
| [src/features/garage/evData.ts:333](../src/features/garage/evData.ts#L333) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"등급 판단"` |
| [src/features/garage/evData.ts:333](../src/features/garage/evData.ts#L333) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"안전 상태 전이"` |
| [src/features/garage/evData.ts:333](../src/features/garage/evData.ts#L333) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"경고 요청"` |
| [src/features/garage/evData.ts:334](../src/features/garage/evData.ts#L334) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"각 제어기"` |
| [src/features/garage/evData.ts:334](../src/features/garage/evData.ts#L334) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 고장 코드"` |
| [src/features/garage/evData.ts:336](../src/features/garage/evData.ts#L336) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고장 코드 수신"` |
| [src/features/garage/evData.ts:336](../src/features/garage/evData.ts#L336) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"디바운스"` |
| [src/features/garage/evData.ts:336](../src/features/garage/evData.ts#L336) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"등급 분류"` |
| [src/features/garage/evData.ts:336](../src/features/garage/evData.ts#L336) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"림프홈 조건"` |
| [src/features/garage/evData.ts:336](../src/features/garage/evData.ts#L336) | `EV_DOMAINS` | `EV_DOMAINS.vcu.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"안전 상태 래치"` |
| [src/features/garage/evData.ts:341](../src/features/garage/evData.ts#L341) | `EV_DOMAINS` | `EV_DOMAINS.comm.label` | 표시 라벨/선택지 | `"통신·진단"` |
| [src/features/garage/evData.ts:341](../src/features/garage/evData.ts#L341) | `EV_DOMAINS` | `EV_DOMAINS.comm.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 제어"` |
| [src/features/garage/evData.ts:342](../src/features/garage/evData.ts#L342) | `EV_DOMAINS` | `EV_DOMAINS.comm.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어기 사이 신호를 전달하고 건전성을 감시하며 진단·원격 업데이트를 처리합니다."` |
| [src/features/garage/evData.ts:344](../src/features/garage/evData.ts#L344) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].name` | 이름/신호 라벨 | `"도메인 간 신호 전달"` |
| [src/features/garage/evData.ts:344](../src/features/garage/evData.ts#L344) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:344](../src/features/garage/evData.ts#L344) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].summary` | 요약/기능 설명 | `"송신 제어기의 신호를 CAN과 게이트웨이를 거쳐 수신 제어기에 전달합니다."` |
| [src/features/garage/evData.ts:346](../src/features/garage/evData.ts#L346) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"송신 제어기"` |
| [src/features/garage/evData.ts:346](../src/features/garage/evData.ts#L346) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"메시지 전송"` |
| [src/features/garage/evData.ts:346](../src/features/garage/evData.ts#L346) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"수신 제어기"` |
| [src/features/garage/evData.ts:346](../src/features/garage/evData.ts#L346) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"신호 반영"` |
| [src/features/garage/evData.ts:347](../src/features/garage/evData.ts#L347) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"송신 ECU"` |
| [src/features/garage/evData.ts:347](../src/features/garage/evData.ts#L347) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 버스"` |
| [src/features/garage/evData.ts:347](../src/features/garage/evData.ts#L347) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"게이트웨이"` |
| [src/features/garage/evData.ts:347](../src/features/garage/evData.ts#L347) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"수신 ECU"` |
| [src/features/garage/evData.ts:349](../src/features/garage/evData.ts#L349) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"신호 패킹"` |
| [src/features/garage/evData.ts:349](../src/features/garage/evData.ts#L349) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"주기 송신"` |
| [src/features/garage/evData.ts:349](../src/features/garage/evData.ts#L349) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"ID 필터"` |
| [src/features/garage/evData.ts:349](../src/features/garage/evData.ts#L349) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"신호 언패킹"` |
| [src/features/garage/evData.ts:349](../src/features/garage/evData.ts#L349) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[0].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"값 범위 확인"` |
| [src/features/garage/evData.ts:351](../src/features/garage/evData.ts#L351) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].name` | 이름/신호 라벨 | `"통신 건전성 감시"` |
| [src/features/garage/evData.ts:351](../src/features/garage/evData.ts#L351) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:351](../src/features/garage/evData.ts#L351) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].summary` | 요약/기능 설명 | `"카운터·CRC·수신 주기를 확인하고 이상이면 안전한 값으로 바꿉니다."` |
| [src/features/garage/evData.ts:353](../src/features/garage/evData.ts#L353) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"메시지 수신"` |
| [src/features/garage/evData.ts:353](../src/features/garage/evData.ts#L353) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"주기 확인"` |
| [src/features/garage/evData.ts:353](../src/features/garage/evData.ts#L353) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"오류 판정"` |
| [src/features/garage/evData.ts:353](../src/features/garage/evData.ts#L353) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"폴백 값"` |
| [src/features/garage/evData.ts:354](../src/features/garage/evData.ts#L354) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 버스"` |
| [src/features/garage/evData.ts:354](../src/features/garage/evData.ts#L354) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"게이트웨이"` |
| [src/features/garage/evData.ts:354](../src/features/garage/evData.ts#L354) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"수신 ECU"` |
| [src/features/garage/evData.ts:356](../src/features/garage/evData.ts#L356) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"롤링 카운터 확인"` |
| [src/features/garage/evData.ts:356](../src/features/garage/evData.ts#L356) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CRC 확인"` |
| [src/features/garage/evData.ts:356](../src/features/garage/evData.ts#L356) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"타임아웃"` |
| [src/features/garage/evData.ts:356](../src/features/garage/evData.ts#L356) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"오류 디바운스"` |
| [src/features/garage/evData.ts:356](../src/features/garage/evData.ts#L356) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[1].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"폴백 값 적용"` |
| [src/features/garage/evData.ts:358](../src/features/garage/evData.ts#L358) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].name` | 이름/신호 라벨 | `"진단 요청·응답"` |
| [src/features/garage/evData.ts:358](../src/features/garage/evData.ts#L358) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:358](../src/features/garage/evData.ts#L358) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].summary` | 요약/기능 설명 | `"진단 장비의 요청을 해석해 대상 제어기의 DTC와 상태를 응답합니다."` |
| [src/features/garage/evData.ts:360](../src/features/garage/evData.ts#L360) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"진단 요청"` |
| [src/features/garage/evData.ts:360](../src/features/garage/evData.ts#L360) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"서비스 해석"` |
| [src/features/garage/evData.ts:360](../src/features/garage/evData.ts#L360) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어기 응답"` |
| [src/features/garage/evData.ts:360](../src/features/garage/evData.ts#L360) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"결과 표시"` |
| [src/features/garage/evData.ts:361](../src/features/garage/evData.ts#L361) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"진단 장비"` |
| [src/features/garage/evData.ts:361](../src/features/garage/evData.ts#L361) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"진단 포트"` |
| [src/features/garage/evData.ts:361](../src/features/garage/evData.ts#L361) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"게이트웨이"` |
| [src/features/garage/evData.ts:361](../src/features/garage/evData.ts#L361) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"대상 ECU"` |
| [src/features/garage/evData.ts:363](../src/features/garage/evData.ts#L363) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"세션 확인"` |
| [src/features/garage/evData.ts:363](../src/features/garage/evData.ts#L363) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"서비스 ID 해석"` |
| [src/features/garage/evData.ts:363](../src/features/garage/evData.ts#L363) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"DTC 조회"` |
| [src/features/garage/evData.ts:363](../src/features/garage/evData.ts#L363) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"응답 구성"` |
| [src/features/garage/evData.ts:363](../src/features/garage/evData.ts#L363) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[2].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"오류 응답 처리"` |
| [src/features/garage/evData.ts:365](../src/features/garage/evData.ts#L365) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].name` | 이름/신호 라벨 | `"원격 진단·OTA"` |
| [src/features/garage/evData.ts:365](../src/features/garage/evData.ts#L365) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:365](../src/features/garage/evData.ts#L365) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].summary` | 요약/기능 설명 | `"텔레매틱스 제어기로 서버와 통신하며 조건이 맞을 때 소프트웨어를 갱신합니다."` |
| [src/features/garage/evData.ts:367](../src/features/garage/evData.ts#L367) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"서버 요청"` |
| [src/features/garage/evData.ts:367](../src/features/garage/evData.ts#L367) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"조건 확인"` |
| [src/features/garage/evData.ts:367](../src/features/garage/evData.ts#L367) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"원격 전송"` |
| [src/features/garage/evData.ts:367](../src/features/garage/evData.ts#L367) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"업데이트·보고"` |
| [src/features/garage/evData.ts:368](../src/features/garage/evData.ts#L368) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"서버"` |
| [src/features/garage/evData.ts:368](../src/features/garage/evData.ts#L368) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"텔레매틱스 제어기"` |
| [src/features/garage/evData.ts:368](../src/features/garage/evData.ts#L368) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"게이트웨이"` |
| [src/features/garage/evData.ts:368](../src/features/garage/evData.ts#L368) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"대상 ECU"` |
| [src/features/garage/evData.ts:370](../src/features/garage/evData.ts#L370) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 상태 조건"` |
| [src/features/garage/evData.ts:370](../src/features/garage/evData.ts#L370) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"배터리 전압 조건"` |
| [src/features/garage/evData.ts:370](../src/features/garage/evData.ts#L370) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"이미지 서명 확인"` |
| [src/features/garage/evData.ts:370](../src/features/garage/evData.ts#L370) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전송 재시도"` |
| [src/features/garage/evData.ts:370](../src/features/garage/evData.ts#L370) | `EV_DOMAINS` | `EV_DOMAINS.comm.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"업데이트 롤백"` |
| [src/features/garage/evData.ts:375](../src/features/garage/evData.ts#L375) | `EV_DOMAINS` | `EV_DOMAINS.adas.label` | 표시 라벨/선택지 | `"운전자 지원·HMI"` |
| [src/features/garage/evData.ts:375](../src/features/garage/evData.ts#L375) | `EV_DOMAINS` | `EV_DOMAINS.adas.group` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 제어"` |
| [src/features/garage/evData.ts:376](../src/features/garage/evData.ts#L376) | `EV_DOMAINS` | `EV_DOMAINS.adas.purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전방을 인지해 감속과 경고를 요청하고 상태를 운전자에게 알립니다."` |
| [src/features/garage/evData.ts:378](../src/features/garage/evData.ts#L378) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].name` | 이름/신호 라벨 | `"전방 인지"` |
| [src/features/garage/evData.ts:378](../src/features/garage/evData.ts#L378) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요구 해석"` |
| [src/features/garage/evData.ts:378](../src/features/garage/evData.ts#L378) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].summary` | 요약/기능 설명 | `"카메라와 레이더 정보를 융합해 앞 물체와 위험 거리를 판단합니다."` |
| [src/features/garage/evData.ts:380](../src/features/garage/evData.ts#L380) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전방 물체"` |
| [src/features/garage/evData.ts:380](../src/features/garage/evData.ts#L380) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"센서 측정"` |
| [src/features/garage/evData.ts:380](../src/features/garage/evData.ts#L380) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"물체 융합"` |
| [src/features/garage/evData.ts:380](../src/features/garage/evData.ts#L380) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"위험 판단"` |
| [src/features/garage/evData.ts:381](../src/features/garage/evData.ts#L381) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전방 카메라"` |
| [src/features/garage/evData.ts:381](../src/features/garage/evData.ts#L381) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전방 레이더"` |
| [src/features/garage/evData.ts:381](../src/features/garage/evData.ts#L381) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[1].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 물체 정보"` |
| [src/features/garage/evData.ts:383](../src/features/garage/evData.ts#L383) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"신호 타당성 검사"` |
| [src/features/garage/evData.ts:383](../src/features/garage/evData.ts#L383) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"시간 동기"` |
| [src/features/garage/evData.ts:383](../src/features/garage/evData.ts#L383) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"객체 연결"` |
| [src/features/garage/evData.ts:383](../src/features/garage/evData.ts#L383) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"신뢰도 선택"` |
| [src/features/garage/evData.ts:383](../src/features/garage/evData.ts#L383) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[0].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"위험 거리 계산"` |
| [src/features/garage/evData.ts:385](../src/features/garage/evData.ts#L385) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].name` | 이름/신호 라벨 | `"목표 감속·거리 제어"` |
| [src/features/garage/evData.ts:385](../src/features/garage/evData.ts#L385) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어·배분"` |
| [src/features/garage/evData.ts:385](../src/features/garage/evData.ts#L385) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].summary` | 요약/기능 설명 | `"충돌 시간을 계산해 필요한 목표 감속도를 제동·구동 쪽에 요청합니다."` |
| [src/features/garage/evData.ts:387](../src/features/garage/evData.ts#L387) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전방 거리"` |
| [src/features/garage/evData.ts:387](../src/features/garage/evData.ts#L387) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충돌 위험"` |
| [src/features/garage/evData.ts:387](../src/features/garage/evData.ts#L387) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 감속도"` |
| [src/features/garage/evData.ts:387](../src/features/garage/evData.ts#L387) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"감속 요청"` |
| [src/features/garage/evData.ts:388](../src/features/garage/evData.ts#L388) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[1].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 감속 요청"` |
| [src/features/garage/evData.ts:390](../src/features/garage/evData.ts#L390) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충돌 시간 계산"` |
| [src/features/garage/evData.ts:390](../src/features/garage/evData.ts#L390) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"개입 임계"` |
| [src/features/garage/evData.ts:390](../src/features/garage/evData.ts#L390) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표 감속 맵"` |
| [src/features/garage/evData.ts:390](../src/features/garage/evData.ts#L390) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"저크 제한"` |
| [src/features/garage/evData.ts:390](../src/features/garage/evData.ts#L390) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[1].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"요청 출력"` |
| [src/features/garage/evData.ts:392](../src/features/garage/evData.ts#L392) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].name` | 이름/신호 라벨 | `"경고·개입 협조"` |
| [src/features/garage/evData.ts:392](../src/features/garage/evData.ts#L392) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:392](../src/features/garage/evData.ts#L392) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].summary` | 요약/기능 설명 | `"경고 단계를 올리고 운전자 조작을 확인하며 제동·조향 개입을 중재합니다."` |
| [src/features/garage/evData.ts:394](../src/features/garage/evData.ts#L394) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"위험 등급"` |
| [src/features/garage/evData.ts:394](../src/features/garage/evData.ts#L394) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"경고 단계"` |
| [src/features/garage/evData.ts:394](../src/features/garage/evData.ts#L394) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제동·조향 중재"` |
| [src/features/garage/evData.ts:394](../src/features/garage/evData.ts#L394) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전자 개입"` |
| [src/features/garage/evData.ts:397](../src/features/garage/evData.ts#L397) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"경고 단계 상태기"` |
| [src/features/garage/evData.ts:397](../src/features/garage/evData.ts#L397) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전자 조작 확인"` |
| [src/features/garage/evData.ts:397](../src/features/garage/evData.ts#L397) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"개입 우선순위"` |
| [src/features/garage/evData.ts:397](../src/features/garage/evData.ts#L397) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[2].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"개입 종료 조건"` |
| [src/features/garage/evData.ts:399](../src/features/garage/evData.ts#L399) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].name` | 이름/신호 라벨 | `"클러스터 표시·경고등"` |
| [src/features/garage/evData.ts:399](../src/features/garage/evData.ts#L399) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].category` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실행·보호"` |
| [src/features/garage/evData.ts:399](../src/features/garage/evData.ts#L399) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].summary` | 요약/기능 설명 | `"수신한 상태를 점등 조건에 따라 계기판과 경고등에 표시합니다."` |
| [src/features/garage/evData.ts:401](../src/features/garage/evData.ts#L401) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[0].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"상태 수신"` |
| [src/features/garage/evData.ts:401](../src/features/garage/evData.ts#L401) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[0].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"표시 조건"` |
| [src/features/garage/evData.ts:401](../src/features/garage/evData.ts#L401) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[0].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"경고등 점등"` |
| [src/features/garage/evData.ts:401](../src/features/garage/evData.ts#L401) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[0].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전자 인지"` |
| [src/features/garage/evData.ts:402](../src/features/garage/evData.ts#L402) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[1].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 상태"` |
| [src/features/garage/evData.ts:402](../src/features/garage/evData.ts#L402) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[1].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"경고등 표시"` |
| [src/features/garage/evData.ts:404](../src/features/garage/evData.ts#L404) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[3].[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"상태 수신 확인"` |
| [src/features/garage/evData.ts:404](../src/features/garage/evData.ts#L404) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[3].[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"타임아웃"` |
| [src/features/garage/evData.ts:404](../src/features/garage/evData.ts#L404) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[3].[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"점등 조건"` |
| [src/features/garage/evData.ts:404](../src/features/garage/evData.ts#L404) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[3].[3]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"깜빡임 주기"` |
| [src/features/garage/evData.ts:404](../src/features/garage/evData.ts#L404) | `EV_DOMAINS` | `EV_DOMAINS.adas.features.[3].layers.[3].[4]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"기본값 처리"` |
| [src/features/garage/evData.ts:412](../src/features/garage/evData.ts#L412) | `OVERVIEW_IO` | `OVERVIEW_IO.파워트레인` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"파워트레인"` |
| [src/features/garage/evData.ts:412](../src/features/garage/evData.ts#L412) | `OVERVIEW_IO` | `OVERVIEW_IO.파워트레인.inputs.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가속 페달·시동"` |
| [src/features/garage/evData.ts:412](../src/features/garage/evData.ts#L412) | `OVERVIEW_IO` | `OVERVIEW_IO.파워트레인.inputs.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전 커넥터"` |
| [src/features/garage/evData.ts:412](../src/features/garage/evData.ts#L412) | `OVERVIEW_IO` | `OVERVIEW_IO.파워트레인.inputs.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전압·온도 센서"` |
| [src/features/garage/evData.ts:412](../src/features/garage/evData.ts#L412) | `OVERVIEW_IO` | `OVERVIEW_IO.파워트레인.outputs.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터 토크"` |
| [src/features/garage/evData.ts:412](../src/features/garage/evData.ts#L412) | `OVERVIEW_IO` | `OVERVIEW_IO.파워트레인.outputs.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"팩 충전"` |
| [src/features/garage/evData.ts:412](../src/features/garage/evData.ts#L412) | `OVERVIEW_IO` | `OVERVIEW_IO.파워트레인.outputs.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"냉각·난방 열"` |
| [src/features/garage/evData.ts:413](../src/features/garage/evData.ts#L413) | `OVERVIEW_IO` | `OVERVIEW_IO.섀시` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"섀시"` |
| [src/features/garage/evData.ts:413](../src/features/garage/evData.ts#L413) | `OVERVIEW_IO` | `OVERVIEW_IO.섀시.inputs.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"브레이크·핸들"` |
| [src/features/garage/evData.ts:413](../src/features/garage/evData.ts#L413) | `OVERVIEW_IO` | `OVERVIEW_IO.섀시.inputs.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"휠·IMU·차고 센서"` |
| [src/features/garage/evData.ts:413](../src/features/garage/evData.ts#L413) | `OVERVIEW_IO` | `OVERVIEW_IO.섀시.inputs.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"변속 레버"` |
| [src/features/garage/evData.ts:413](../src/features/garage/evData.ts#L413) | `OVERVIEW_IO` | `OVERVIEW_IO.섀시.outputs.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제동력"` |
| [src/features/garage/evData.ts:413](../src/features/garage/evData.ts#L413) | `OVERVIEW_IO` | `OVERVIEW_IO.섀시.outputs.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"조향각"` |
| [src/features/garage/evData.ts:413](../src/features/garage/evData.ts#L413) | `OVERVIEW_IO` | `OVERVIEW_IO.섀시.outputs.[2]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"감쇠·차고·파킹 잠금"` |
| [src/features/garage/evData.ts:414](../src/features/garage/evData.ts#L414) | `OVERVIEW_IO` | `OVERVIEW_IO.차량 제어` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 제어"` |
| [src/features/garage/evData.ts:414](../src/features/garage/evData.ts#L414) | `OVERVIEW_IO` | `OVERVIEW_IO.차량 제어.inputs.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"진단 장비"` |
| [src/features/garage/evData.ts:414](../src/features/garage/evData.ts#L414) | `OVERVIEW_IO` | `OVERVIEW_IO.차량 제어.inputs.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"전방 카메라·레이더"` |
| [src/features/garage/evData.ts:414](../src/features/garage/evData.ts#L414) | `OVERVIEW_IO` | `OVERVIEW_IO.차량 제어.outputs.[0]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"계기판·경고"` |
| [src/features/garage/evData.ts:414](../src/features/garage/evData.ts#L414) | `OVERVIEW_IO` | `OVERVIEW_IO.차량 제어.outputs.[1]` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"고장 기록"` |
| [src/features/garage/evData.ts:419](../src/features/garage/evData.ts#L419) | `GROUP_ROLE` | `GROUP_ROLE.파워트레인` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"파워트레인"` |
| [src/features/garage/evData.ts:419](../src/features/garage/evData.ts#L419) | `GROUP_ROLE` | `GROUP_ROLE.파워트레인` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"에너지를 토크로 바꾸고 열을 관리해 차를 움직입니다."` |
| [src/features/garage/evData.ts:420](../src/features/garage/evData.ts#L420) | `GROUP_ROLE` | `GROUP_ROLE.섀시` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"섀시"` |
| [src/features/garage/evData.ts:420](../src/features/garage/evData.ts#L420) | `GROUP_ROLE` | `GROUP_ROLE.섀시` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"타이어의 힘과 차체 자세를 조절해 멈추고 방향을 바꿉니다."` |
| [src/features/garage/evData.ts:421](../src/features/garage/evData.ts#L421) | `GROUP_ROLE` | `GROUP_ROLE.차량 제어` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량 제어"` |
| [src/features/garage/evData.ts:421](../src/features/garage/evData.ts#L421) | `GROUP_ROLE` | `GROUP_ROLE.차량 제어` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"각 도메인을 조정하고 운전자에게 상태와 경고를 알립니다."` |
| [src/features/garage/evData.ts:426](../src/features/garage/evData.ts#L426) | `COORD_SIGNALS` | `COORD_SIGNALS.[0].name` | 이름/신호 라벨 | `"방전·회생 한계"` |
| [src/features/garage/evData.ts:426](../src/features/garage/evData.ts#L426) | `COORD_SIGNALS` | `COORD_SIGNALS.[0].purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"배터리가 낼 수 있는 출력과 받을 수 있는 회생 전력의 상한"` |
| [src/features/garage/evData.ts:427](../src/features/garage/evData.ts#L427) | `COORD_SIGNALS` | `COORD_SIGNALS.[1].name` | 이름/신호 라벨 | `"열 디레이팅"` |
| [src/features/garage/evData.ts:427](../src/features/garage/evData.ts#L427) | `COORD_SIGNALS` | `COORD_SIGNALS.[1].purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"과열 보호를 위해 구동 출력을 단계적으로 제한"` |
| [src/features/garage/evData.ts:428](../src/features/garage/evData.ts#L428) | `COORD_SIGNALS` | `COORD_SIGNALS.[2].name` | 이름/신호 라벨 | `"회생 요청"` |
| [src/features/garage/evData.ts:428](../src/features/garage/evData.ts#L428) | `COORD_SIGNALS` | `COORD_SIGNALS.[2].purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제동 요구 중 회생으로 처리할 몫을 구동 제어기에 전달"` |
| [src/features/garage/evData.ts:429](../src/features/garage/evData.ts#L429) | `COORD_SIGNALS` | `COORD_SIGNALS.[3].name` | 이름/신호 라벨 | `"구동 허용"` |
| [src/features/garage/evData.ts:429](../src/features/garage/evData.ts#L429) | `COORD_SIGNALS` | `COORD_SIGNALS.[3].purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"변속 상태와 인터록을 통과해야 토크를 낼 수 있음"` |
| [src/features/garage/evData.ts:430](../src/features/garage/evData.ts#L430) | `COORD_SIGNALS` | `COORD_SIGNALS.[4].name` | 이름/신호 라벨 | `"충전 중 구동 금지"` |
| [src/features/garage/evData.ts:430](../src/features/garage/evData.ts#L430) | `COORD_SIGNALS` | `COORD_SIGNALS.[4].purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충전기가 연결된 동안 차량이 움직이지 않도록 구동을 막음"` |
| [src/features/garage/evData.ts:431](../src/features/garage/evData.ts#L431) | `COORD_SIGNALS` | `COORD_SIGNALS.[5].name` | 이름/신호 라벨 | `"ESC 개입"` |
| [src/features/garage/evData.ts:431](../src/features/garage/evData.ts#L431) | `COORD_SIGNALS` | `COORD_SIGNALS.[5].purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차체 불안정 시 휠 제동과 함께 토크·조향 보조를 조정"` |
| [src/features/garage/evData.ts:432](../src/features/garage/evData.ts#L432) | `COORD_SIGNALS` | `COORD_SIGNALS.[6].name` | 이름/신호 라벨 | `"기어 상태"` |
| [src/features/garage/evData.ts:432](../src/features/garage/evData.ts#L432) | `COORD_SIGNALS` | `COORD_SIGNALS.[6].purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"확정된 PRND 상태를 네트워크로 배포해 계기판과 제어기가 같은 값을 사용"` |
| [src/features/garage/evData.ts:433](../src/features/garage/evData.ts#L433) | `COORD_SIGNALS` | `COORD_SIGNALS.[7].name` | 이름/신호 라벨 | `"안전 상태"` |
| [src/features/garage/evData.ts:433](../src/features/garage/evData.ts#L433) | `COORD_SIGNALS` | `COORD_SIGNALS.[7].purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어기 고장 등급에 따라 출력 제한이나 림프홈으로 전환하도록 알림"` |
| [src/features/garage/evData.ts:434](../src/features/garage/evData.ts#L434) | `COORD_SIGNALS` | `COORD_SIGNALS.[8].name` | 이름/신호 라벨 | `"ADAS 감속 요청"` |
| [src/features/garage/evData.ts:434](../src/features/garage/evData.ts#L434) | `COORD_SIGNALS` | `COORD_SIGNALS.[8].purpose` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충돌 위험 때 목표 감속도를 제동과 구동에 요청"` |
| [src/features/garage/PedalLab.tsx:18](../src/features/garage/PedalLab.tsx#L18) | `ROWS` | `ROWS.[0].label` | 표시 라벨/선택지 | `"페달 위치"` |
| [src/features/garage/PedalLab.tsx:18](../src/features/garage/PedalLab.tsx#L18) | `ROWS` | `ROWS.[0].where` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"센서"` |
| [src/features/garage/PedalLab.tsx:18](../src/features/garage/PedalLab.tsx#L18) | `ROWS` | `ROWS.[0].unit` | 단위 | `"%"` |
| [src/features/garage/PedalLab.tsx:19](../src/features/garage/PedalLab.tsx#L19) | `ROWS` | `ROWS.[1].label` | 표시 라벨/선택지 | `"토크 요청"` |
| [src/features/garage/PedalLab.tsx:19](../src/features/garage/PedalLab.tsx#L19) | `ROWS` | `ROWS.[1].unit` | 단위 | `"Nm"` |
| [src/features/garage/PedalLab.tsx:20](../src/features/garage/PedalLab.tsx#L20) | `ROWS` | `ROWS.[2].label` | 표시 라벨/선택지 | `"모터 토크"` |
| [src/features/garage/PedalLab.tsx:20](../src/features/garage/PedalLab.tsx#L20) | `ROWS` | `ROWS.[2].where` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터"` |
| [src/features/garage/PedalLab.tsx:20](../src/features/garage/PedalLab.tsx#L20) | `ROWS` | `ROWS.[2].unit` | 단위 | `"Nm"` |
| [src/features/garage/PedalLab.tsx:21](../src/features/garage/PedalLab.tsx#L21) | `ROWS` | `ROWS.[3].label` | 표시 라벨/선택지 | `"바퀴 토크"` |
| [src/features/garage/PedalLab.tsx:21](../src/features/garage/PedalLab.tsx#L21) | `ROWS` | `ROWS.[3].where` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"구동축"` |
| [src/features/garage/PedalLab.tsx:21](../src/features/garage/PedalLab.tsx#L21) | `ROWS` | `ROWS.[3].unit` | 단위 | `"Nm"` |
| [src/features/garage/PedalLab.tsx:22](../src/features/garage/PedalLab.tsx#L22) | `ROWS` | `ROWS.[4].label` | 표시 라벨/선택지 | `"가속도"` |
| [src/features/garage/PedalLab.tsx:22](../src/features/garage/PedalLab.tsx#L22) | `ROWS` | `ROWS.[4].where` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"차량"` |
| [src/features/garage/PedalLab.tsx:22](../src/features/garage/PedalLab.tsx#L22) | `ROWS` | `ROWS.[4].unit` | 단위 | `"m/s²"` |
| [src/features/garage/PedalLab.tsx:29](../src/features/garage/PedalLab.tsx#L29) | `PedalLab` | `<section>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가속 페달 값 체험"` |
| [src/features/garage/PedalLab.tsx:30](../src/features/garage/PedalLab.tsx#L30) | `PedalLab` | `<section>.<header>.<b>` | 화면에 직접 렌더되는 JSX 문구 | `"페달 값 바꿔 보기"` |
| [src/features/garage/PedalLab.tsx:32](../src/features/garage/PedalLab.tsx#L32) | `PedalLab` | `<section>.<label>.<input>.@min` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/features/garage/PedalLab.tsx:32](../src/features/garage/PedalLab.tsx#L32) | `PedalLab` | `<section>.<label>.<input>.@max` | 화면·시나리오 수치/모델 기준값 | `"100"` |
| [src/features/garage/PedalLab.tsx:32](../src/features/garage/PedalLab.tsx#L32) | `PedalLab` | `<section>.<label>.<input>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"가속 페달 위치 퍼센트"` |
| [src/features/garage/PedalLab.tsx:33](../src/features/garage/PedalLab.tsx#L33) | `PedalLab` | `<section>.<label>.<output>` | 화면에 직접 렌더되는 JSX 문구 | `"%"` |
| [src/features/garage/SimulinkDiagram.tsx:24](../src/features/garage/SimulinkDiagram.tsx#L24) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"잡음을 걸러 값을 매끄럽게"` |
| [src/features/garage/SimulinkDiagram.tsx:25](../src/features/garage/SimulinkDiagram.tsx#L25) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"잠깐 튀는 신호는 무시"` |
| [src/features/garage/SimulinkDiagram.tsx:26](../src/features/garage/SimulinkDiagram.tsx#L26) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"너무 오래 안 오면 고장으로 판단"` |
| [src/features/garage/SimulinkDiagram.tsx:27](../src/features/garage/SimulinkDiagram.tsx#L27) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"켜고 끄는 기준을 달리해 깜빡임 방지"` |
| [src/features/garage/SimulinkDiagram.tsx:28](../src/features/garage/SimulinkDiagram.tsx#L28) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"한 번 위험하면 풀릴 때까지 잠금"` |
| [src/features/garage/SimulinkDiagram.tsx:29](../src/features/garage/SimulinkDiagram.tsx#L29) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"명령을 켜짐·꺼짐 펄스로 바꿔 구동"` |
| [src/features/garage/SimulinkDiagram.tsx:30](../src/features/garage/SimulinkDiagram.tsx#L30) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"값을 천천히 올리고 내리기"` |
| [src/features/garage/SimulinkDiagram.tsx:31](../src/features/garage/SimulinkDiagram.tsx#L31) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"모터 전류를 다루기 쉬운 형태로"` |
| [src/features/garage/SimulinkDiagram.tsx:32](../src/features/garage/SimulinkDiagram.tsx#L32) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"실제로 낸 값을 짐작해 보기"` |
| [src/features/garage/SimulinkDiagram.tsx:33](../src/features/garage/SimulinkDiagram.tsx#L33) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"이상하면 고장 기록을 남기기"` |
| [src/features/garage/SimulinkDiagram.tsx:34](../src/features/garage/SimulinkDiagram.tsx#L34) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"두 센서 값이 서로 같은지 확인"` |
| [src/features/garage/SimulinkDiagram.tsx:35](../src/features/garage/SimulinkDiagram.tsx#L35) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"충돌 신호가 오면 바로 차단"` |
| [src/features/garage/SimulinkDiagram.tsx:36](../src/features/garage/SimulinkDiagram.tsx#L36) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전자·다른 제어기의 요청 받기"` |
| [src/features/garage/SimulinkDiagram.tsx:37](../src/features/garage/SimulinkDiagram.tsx#L37) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"안전한 범위 안인지 확인"` |
| [src/features/garage/SimulinkDiagram.tsx:38](../src/features/garage/SimulinkDiagram.tsx#L38) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"뜨겁거나 무리하면 힘을 줄이기"` |
| [src/features/garage/SimulinkDiagram.tsx:39](../src/features/garage/SimulinkDiagram.tsx#L39) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"결과를 다음 부품에 보내기"` |
| [src/features/garage/SimulinkDiagram.tsx:40](../src/features/garage/SimulinkDiagram.tsx#L40) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"다음 단계가 쓸 값으로 바꾸기"` |
| [src/features/garage/SimulinkDiagram.tsx:41](../src/features/garage/SimulinkDiagram.tsx#L41) | `plainText` | `` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"운전자가 원하는 힘을 정하기"` |
| [src/features/garage/SimulinkDiagram.tsx:43](../src/features/garage/SimulinkDiagram.tsx#L43) | `plainText` | `check` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"값이 정상 범위인지 확인"` |
| [src/features/garage/SimulinkDiagram.tsx:44](../src/features/garage/SimulinkDiagram.tsx#L44) | `plainText` | `lut` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"표를 보고 알맞은 값으로 바꾸기"` |
| [src/features/garage/SimulinkDiagram.tsx:45](../src/features/garage/SimulinkDiagram.tsx#L45) | `plainText` | `min` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"여러 한계 중 가장 안전한 값 고르기"` |
| [src/features/garage/SimulinkDiagram.tsx:46](../src/features/garage/SimulinkDiagram.tsx#L46) | `plainText` | `pi` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"목표와 실제의 차이를 계속 줄이기"` |
| [src/features/garage/SimulinkDiagram.tsx:47](../src/features/garage/SimulinkDiagram.tsx#L47) | `plainText` | `delay` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"값이 갑자기 변하지 않게 부드럽게"` |
| [src/features/garage/SimulinkDiagram.tsx:48](../src/features/garage/SimulinkDiagram.tsx#L48) | `plainText` | `state` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"지금 상태를 기억했다가 바꾸기"` |
| [src/features/garage/SimulinkDiagram.tsx:49](../src/features/garage/SimulinkDiagram.tsx#L49) | `plainText` | `switch` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"조건이 맞을 때만 다음으로 통과"` |
| [src/features/garage/SimulinkDiagram.tsx:50](../src/features/garage/SimulinkDiagram.tsx#L50) | `plainText` | `calc` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"필요한 값을 계산하기"` |
| [src/features/garage/SimulinkDiagram.tsx:69](../src/features/garage/SimulinkDiagram.tsx#L69) | `KIND_TAG` | `KIND_TAG.check` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"확인"` |
| [src/features/garage/SimulinkDiagram.tsx:69](../src/features/garage/SimulinkDiagram.tsx#L69) | `KIND_TAG` | `KIND_TAG.lut` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"표 보기"` |
| [src/features/garage/SimulinkDiagram.tsx:69](../src/features/garage/SimulinkDiagram.tsx#L69) | `KIND_TAG` | `KIND_TAG.min` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"안전값 고르기"` |
| [src/features/garage/SimulinkDiagram.tsx:69](../src/features/garage/SimulinkDiagram.tsx#L69) | `KIND_TAG` | `KIND_TAG.pi` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"계속 맞추기"` |
| [src/features/garage/SimulinkDiagram.tsx:69](../src/features/garage/SimulinkDiagram.tsx#L69) | `KIND_TAG` | `KIND_TAG.delay` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"부드럽게"` |
| [src/features/garage/SimulinkDiagram.tsx:69](../src/features/garage/SimulinkDiagram.tsx#L69) | `KIND_TAG` | `KIND_TAG.state` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"상태 기억"` |
| [src/features/garage/SimulinkDiagram.tsx:69](../src/features/garage/SimulinkDiagram.tsx#L69) | `KIND_TAG` | `KIND_TAG.switch` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"통과 조건"` |
| [src/features/garage/SimulinkDiagram.tsx:69](../src/features/garage/SimulinkDiagram.tsx#L69) | `KIND_TAG` | `KIND_TAG.calc` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"계산"` |
| [src/features/garage/SimulinkDiagram.tsx:120](../src/features/garage/SimulinkDiagram.tsx#L120) | `SimulinkDiagram` | `<div>.<svg>.@aria-label` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"제어 로직 흐름도"` |
| [src/features/garage/SimulinkDiagram.tsx:127](../src/features/garage/SimulinkDiagram.tsx#L127) | `SimulinkDiagram` | `<div>.<svg>.<g>.<foreignObject>.<div>.<i>` | 화면에 직접 렌더되는 JSX 문구 | `"/"` |
| [src/features/garage/SimulinkDiagram.tsx:132](../src/features/garage/SimulinkDiagram.tsx#L132) | `SimulinkDiagram` | `<div>.<svg>.<g>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"parallel ? <>\n        <foreignObject x={4} y={first.y - 46} width={62} height={30}><div className=\"portChip in\">센서 A</div></foreignObject>\n        <foreignObject x={4} y={first.y + 16} width={62} height={30}><div className=\"portChip in\">센서 B</div></foreignObject>\n      </> : <foreignObject x={4} y={first.y - 15} width={62} height={30}><div className=\"portChip in\">입력</div></foreignObject>"` |
| [src/features/garage/SimulinkDiagram.tsx:133](../src/features/garage/SimulinkDiagram.tsx#L133) | `SimulinkDiagram` | `<div>.<svg>.<g>.<foreignObject>.<div>` | 화면에 직접 렌더되는 JSX 문구 | `"센서 A"` |
| [src/features/garage/SimulinkDiagram.tsx:134](../src/features/garage/SimulinkDiagram.tsx#L134) | `SimulinkDiagram` | `<div>.<svg>.<g>.<foreignObject>.<div>` | 화면에 직접 렌더되는 JSX 문구 | `"센서 B"` |
| [src/features/garage/SimulinkDiagram.tsx:135](../src/features/garage/SimulinkDiagram.tsx#L135) | `SimulinkDiagram` | `<div>.<svg>.<g>.<foreignObject>.<div>` | 화면에 직접 렌더되는 JSX 문구 | `"입력"` |
| [src/features/garage/SimulinkDiagram.tsx:136](../src/features/garage/SimulinkDiagram.tsx#L136) | `SimulinkDiagram` | `<div>.<svg>.<g>.<foreignObject>.<div>` | 화면에 직접 렌더되는 JSX 문구 | `"출력"` |
| [src/features/garage/SimulinkDiagram.tsx:139](../src/features/garage/SimulinkDiagram.tsx#L139) | `SimulinkDiagram` | `<div>.<svg>.<g>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"logic.map((label, i) => {\n        const kind = kinds[i], p = pos[i];\n        return <g key={label} className={`block kind-${kind} ${activeStep === i ? \"active\" : \"\"}`}>\n          {(kind === \"min\" \|\| kind === \"pi\") && <>\n            <foreignObject x={p.x - 40} y={p.y - bh / 2 - 30} width={80} height={20}><div className={`fromTag ${kind}`}>{kind === \"min\" ? \"CAN 한계\" : \"↩ 실제 값\"}</div></foreignObject>\n            <path d={`M${p.x} ${p.y - bh / 2 - 10} V${p.y - bh / 2}`} className={`wire ${kind === \"pi\" ? \"feedback\" : \"side\"}`} markerEnd={`url(#${kind === \"pi\" ? \"arrowFb\" : \"arrow\"})`} />\n          </>}\n          {(kind === \"delay\" \|\| kind === \"state\") && <path d={`M${p.x + 24} ${p.y - bh / 2} C${p.x + 32} ${p.y - bh / 2 - 26}, ${p.x - 32} ${p.y - bh / 2 - 26}, ${p.x - 24} ${p.y - bh / 2}`} className=\"wire loop\" markerEnd=\"url(#arrowFb)\" />}\n          <foreignObject x={p.x - bw / 2} y={p.y - bh / 2} width={bw} height={bh}>\n            <div className=\"flowBlock\"><Picto kind={kind} /><small>{KIND_TAG[kind]}</small></div>\n          </foreignObject>\n          <foreignObject x={p.x - colW / 2 + 12} y={p.y + bh / 2 + 8} width={colW - 24} height={82}>\n            <div className=\"flowCaption\"><b>{label}</b><span>{plainText(label, kind)}</span></div>\n          </foreignObject>\n        </g>;\n      })"` |
| [src/features/garage/SimulinkDiagram.tsx:142](../src/features/garage/SimulinkDiagram.tsx#L142) | `SimulinkDiagram` | `<div>.<svg>.<g>.<g>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"(kind === \"min\" \|\| kind === \"pi\") && <>\n            <foreignObject x={p.x - 40} y={p.y - bh / 2 - 30} width={80} height={20}><div className={`fromTag ${kind}`}>{kind === \"min\" ? \"CAN 한계\" : \"↩ 실제 값\"}</div></foreignObject>\n            <path d={`M${p.x} ${p.y - bh / 2 - 10} V${p.y - bh / 2}`} className={`wire ${kind === \"pi\" ? \"feedback\" : \"side\"}`} markerEnd={`url(#${kind === \"pi\" ? \"arrowFb\" : \"arrow\"})`} />\n          </>"` |
| [src/features/garage/SimulinkDiagram.tsx:143](../src/features/garage/SimulinkDiagram.tsx#L143) | `SimulinkDiagram` | `<div>.<svg>.<g>.<g>.<foreignObject>.<div>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"kind === \"min\" ? \"CAN 한계\" : \"↩ 실제 값\""` |
| [src/features/garage/SimulinkDiagram.tsx:143](../src/features/garage/SimulinkDiagram.tsx#L143) | `SimulinkDiagram` | `<div>.<svg>.<g>.<g>.<foreignObject>.<div>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"CAN 한계"` |
| [src/features/garage/SimulinkDiagram.tsx:143](../src/features/garage/SimulinkDiagram.tsx#L143) | `SimulinkDiagram` | `<div>.<svg>.<g>.<g>.<foreignObject>.<div>` | 한국어 콘텐츠 문자열(필드 자동 분류 불가) | `"↩ 실제 값"` |
| [src/features/garage/SimulinkDiagram.tsx:157](../src/features/garage/SimulinkDiagram.tsx#L157) | `SimulinkDiagram` | `<div>.<div>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"▶ "` |
| [src/features/garage/SimulinkDiagram.tsx:157](../src/features/garage/SimulinkDiagram.tsx#L157) | `SimulinkDiagram` | `<div>.<div>.<span>` | 화면에 직접 렌더되는 JSX 문구 | `"▶"` |
| [src/features/garage/VehicleLayout.tsx:30](../src/features/garage/VehicleLayout.tsx#L30) | `PLACE` | `PLACE.accel_pedal.target` | 화면·시나리오 수치/모델 기준값 | `"0.18"` |
| [src/features/garage/VehicleLayout.tsx:31](../src/features/garage/VehicleLayout.tsx#L31) | `PLACE` | `PLACE.brake_pedal.target` | 화면·시나리오 수치/모델 기준값 | `"0.2"` |
| [src/features/garage/VehicleLayout.tsx:36](../src/features/garage/VehicleLayout.tsx#L36) | `PLACE` | `PLACE.steering_wheel.target` | 화면·시나리오 수치/모델 기준값 | `"0.38"` |
| [src/features/garage/VehicleLayout.tsx:37](../src/features/garage/VehicleLayout.tsx#L37) | `PLACE` | `PLACE.steering_torque_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.14"` |
| [src/features/garage/VehicleLayout.tsx:38](../src/features/garage/VehicleLayout.tsx#L38) | `PLACE` | `PLACE.steering_angle_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.14"` |
| [src/features/garage/VehicleLayout.tsx:39](../src/features/garage/VehicleLayout.tsx#L39) | `PLACE` | `PLACE.steering_column.target` | 화면·시나리오 수치/모델 기준값 | `"0.32"` |
| [src/features/garage/VehicleLayout.tsx:43](../src/features/garage/VehicleLayout.tsx#L43) | `PLACE` | `PLACE.start_button.target` | 화면·시나리오 수치/모델 기준값 | `"0.16"` |
| [src/features/garage/VehicleLayout.tsx:44](../src/features/garage/VehicleLayout.tsx#L44) | `PLACE` | `PLACE.gear_selector.target` | 화면·시나리오 수치/모델 기준값 | `"0.3"` |
| [src/features/garage/VehicleLayout.tsx:45](../src/features/garage/VehicleLayout.tsx#L45) | `PLACE` | `PLACE.instrument_cluster.target` | 화면·시나리오 수치/모델 기준값 | `"0.5"` |
| [src/features/garage/VehicleLayout.tsx:46](../src/features/garage/VehicleLayout.tsx#L46) | `PLACE` | `PLACE.vcu.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:47](../src/features/garage/VehicleLayout.tsx#L47) | `PLACE` | `PLACE.imu_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.1"` |
| [src/features/garage/VehicleLayout.tsx:49](../src/features/garage/VehicleLayout.tsx#L49) | `PLACE` | `PLACE.traction_motor.target` | 화면·시나리오 수치/모델 기준값 | `"0.62"` |
| [src/features/garage/VehicleLayout.tsx:50](../src/features/garage/VehicleLayout.tsx#L50) | `PLACE` | `PLACE.reduction_gear.target` | 화면·시나리오 수치/모델 기준값 | `"0.38"` |
| [src/features/garage/VehicleLayout.tsx:51](../src/features/garage/VehicleLayout.tsx#L51) | `PLACE` | `PLACE.differential.target` | 화면·시나리오 수치/모델 기준값 | `"0.3"` |
| [src/features/garage/VehicleLayout.tsx:52](../src/features/garage/VehicleLayout.tsx#L52) | `PLACE` | `PLACE.drive_shaft.target` | 화면·시나리오 수치/모델 기준값 | `"0.55"` |
| [src/features/garage/VehicleLayout.tsx:53](../src/features/garage/VehicleLayout.tsx#L53) | `PLACE` | `PLACE.steering_knuckle.target` | 화면·시나리오 수치/모델 기준값 | `"0.3"` |
| [src/features/garage/VehicleLayout.tsx:54](../src/features/garage/VehicleLayout.tsx#L54) | `PLACE` | `PLACE.wheel.target` | 화면·시나리오 수치/모델 기준값 | `"0.22"` |
| [src/features/garage/VehicleLayout.tsx:55](../src/features/garage/VehicleLayout.tsx#L55) | `PLACE` | `PLACE.inverter.target` | 화면·시나리오 수치/모델 기준값 | `"0.42"` |
| [src/features/garage/VehicleLayout.tsx:56](../src/features/garage/VehicleLayout.tsx#L56) | `PLACE` | `PLACE.mcu.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:57](../src/features/garage/VehicleLayout.tsx#L57) | `PLACE` | `PLACE.rotor_position_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.1"` |
| [src/features/garage/VehicleLayout.tsx:58](../src/features/garage/VehicleLayout.tsx#L58) | `PLACE` | `PLACE.motor_temp_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.1"` |
| [src/features/garage/VehicleLayout.tsx:59](../src/features/garage/VehicleLayout.tsx#L59) | `PLACE` | `PLACE.coolant_temperature_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.14"` |
| [src/features/garage/VehicleLayout.tsx:60](../src/features/garage/VehicleLayout.tsx#L60) | `PLACE` | `PLACE.park_lock_actuator.target` | 화면·시나리오 수치/모델 기준값 | `"0.18"` |
| [src/features/garage/VehicleLayout.tsx:61](../src/features/garage/VehicleLayout.tsx#L61) | `PLACE` | `PLACE.park_position_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.1"` |
| [src/features/garage/VehicleLayout.tsx:62](../src/features/garage/VehicleLayout.tsx#L62) | `PLACE` | `PLACE.park_pawl.target` | 화면·시나리오 수치/모델 기준값 | `"0.22"` |
| [src/features/garage/VehicleLayout.tsx:63](../src/features/garage/VehicleLayout.tsx#L63) | `PLACE` | `PLACE.park_ecu.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:65](../src/features/garage/VehicleLayout.tsx#L65) | `PLACE` | `PLACE.brake_ecu.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:66](../src/features/garage/VehicleLayout.tsx#L66) | `PLACE` | `PLACE.hydraulic_modulator.target` | 화면·시나리오 수치/모델 기준값 | `"0.26"` |
| [src/features/garage/VehicleLayout.tsx:67](../src/features/garage/VehicleLayout.tsx#L67) | `PLACE` | `PLACE.brake_line.target` | 화면·시나리오 수치/모델 기준값 | `"0.62"` |
| [src/features/garage/VehicleLayout.tsx:68](../src/features/garage/VehicleLayout.tsx#L68) | `PLACE` | `PLACE.brake_caliper.target` | 화면·시나리오 수치/모델 기준값 | `"0.34"` |
| [src/features/garage/VehicleLayout.tsx:69](../src/features/garage/VehicleLayout.tsx#L69) | `PLACE` | `PLACE.wheel_speed_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.1"` |
| [src/features/garage/VehicleLayout.tsx:71](../src/features/garage/VehicleLayout.tsx#L71) | `PLACE` | `PLACE.steering_rack.target` | 화면·시나리오 수치/모델 기준값 | `"0.72"` |
| [src/features/garage/VehicleLayout.tsx:72](../src/features/garage/VehicleLayout.tsx#L72) | `PLACE` | `PLACE.eps_motor.target` | 화면·시나리오 수치/모델 기준값 | `"0.3"` |
| [src/features/garage/VehicleLayout.tsx:73](../src/features/garage/VehicleLayout.tsx#L73) | `PLACE` | `PLACE.eps_power_pack.target` | 화면·시나리오 수치/모델 기준값 | `"0.3"` |
| [src/features/garage/VehicleLayout.tsx:74](../src/features/garage/VehicleLayout.tsx#L74) | `PLACE` | `PLACE.eps_ecu.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:80](../src/features/garage/VehicleLayout.tsx#L80) | `PLACE` | `PLACE.bms.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:81](../src/features/garage/VehicleLayout.tsx#L81) | `PLACE` | `PLACE.main_contactor.target` | 화면·시나리오 수치/모델 기준값 | `"0.28"` |
| [src/features/garage/VehicleLayout.tsx:82](../src/features/garage/VehicleLayout.tsx#L82) | `PLACE` | `PLACE.isolation_monitor.target` | 화면·시나리오 수치/모델 기준값 | `"0.12"` |
| [src/features/garage/VehicleLayout.tsx:83](../src/features/garage/VehicleLayout.tsx#L83) | `PLACE` | `PLACE.cell_monitor_board.target` | 화면·시나리오 수치/모델 기준값 | `"0.18"` |
| [src/features/garage/VehicleLayout.tsx:84](../src/features/garage/VehicleLayout.tsx#L84) | `PLACE` | `PLACE.hv_junction_box.target` | 화면·시나리오 수치/모델 기준값 | `"0.28"` |
| [src/features/garage/VehicleLayout.tsx:87](../src/features/garage/VehicleLayout.tsx#L87) | `PLACE` | `PLACE.charging_port.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:88](../src/features/garage/VehicleLayout.tsx#L88) | `PLACE` | `PLACE.obc.target` | 화면·시나리오 수치/모델 기준값 | `"0.48"` |
| [src/features/garage/VehicleLayout.tsx:89](../src/features/garage/VehicleLayout.tsx#L89) | `PLACE` | `PLACE.dcdc_converter.target` | 화면·시나리오 수치/모델 기준값 | `"0.3"` |
| [src/features/garage/VehicleLayout.tsx:90](../src/features/garage/VehicleLayout.tsx#L90) | `PLACE` | `PLACE.lv_battery.target` | 화면·시나리오 수치/모델 기준값 | `"0.32"` |
| [src/features/garage/VehicleLayout.tsx:94](../src/features/garage/VehicleLayout.tsx#L94) | `PLACE` | `PLACE.evcc.target` | 화면·시나리오 수치/모델 기준값 | `"0.26"` |
| [src/features/garage/VehicleLayout.tsx:95](../src/features/garage/VehicleLayout.tsx#L95) | `PLACE` | `PLACE.charge_lock_actuator.target` | 화면·시나리오 수치/모델 기준값 | `"0.14"` |
| [src/features/garage/VehicleLayout.tsx:97](../src/features/garage/VehicleLayout.tsx#L97) | `PLACE` | `PLACE.thermal_ecu.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:98](../src/features/garage/VehicleLayout.tsx#L98) | `PLACE` | `PLACE.cooling_pump.target` | 화면·시나리오 수치/모델 기준값 | `"0.28"` |
| [src/features/garage/VehicleLayout.tsx:99](../src/features/garage/VehicleLayout.tsx#L99) | `PLACE` | `PLACE.coolant_valve.target` | 화면·시나리오 수치/모델 기준값 | `"0.18"` |
| [src/features/garage/VehicleLayout.tsx:100](../src/features/garage/VehicleLayout.tsx#L100) | `PLACE` | `PLACE.cooling_fan.target` | 화면·시나리오 수치/모델 기준값 | `"0.58"` |
| [src/features/garage/VehicleLayout.tsx:101](../src/features/garage/VehicleLayout.tsx#L101) | `PLACE` | `PLACE.radiator.target` | 화면·시나리오 수치/모델 기준값 | `"1.45"` |
| [src/features/garage/VehicleLayout.tsx:102](../src/features/garage/VehicleLayout.tsx#L102) | `PLACE` | `PLACE.ac_compressor.target` | 화면·시나리오 수치/모델 기준값 | `"0.48"` |
| [src/features/garage/VehicleLayout.tsx:103](../src/features/garage/VehicleLayout.tsx#L103) | `PLACE` | `PLACE.ptc_heater.target` | 화면·시나리오 수치/모델 기준값 | `"0.32"` |
| [src/features/garage/VehicleLayout.tsx:104](../src/features/garage/VehicleLayout.tsx#L104) | `PLACE` | `PLACE.eev.target` | 화면·시나리오 수치/모델 기준값 | `"0.2"` |
| [src/features/garage/VehicleLayout.tsx:106](../src/features/garage/VehicleLayout.tsx#L106) | `PLACE` | `PLACE.coil_spring.target` | 화면·시나리오 수치/모델 기준값 | `"0.42"` |
| [src/features/garage/VehicleLayout.tsx:107](../src/features/garage/VehicleLayout.tsx#L107) | `PLACE` | `PLACE.damper.target` | 화면·시나리오 수치/모델 기준값 | `"0.5"` |
| [src/features/garage/VehicleLayout.tsx:108](../src/features/garage/VehicleLayout.tsx#L108) | `PLACE` | `PLACE.cdc_damper.target` | 화면·시나리오 수치/모델 기준값 | `"0.28"` |
| [src/features/garage/VehicleLayout.tsx:109](../src/features/garage/VehicleLayout.tsx#L109) | `PLACE` | `PLACE.body_shell.target` | 화면·시나리오 수치/모델 기준값 | `"0.5"` |
| [src/features/garage/VehicleLayout.tsx:110](../src/features/garage/VehicleLayout.tsx#L110) | `PLACE` | `PLACE.chassis_ecu.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:111](../src/features/garage/VehicleLayout.tsx#L111) | `PLACE` | `PLACE.ride_height_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.1"` |
| [src/features/garage/VehicleLayout.tsx:112](../src/features/garage/VehicleLayout.tsx#L112) | `PLACE` | `PLACE.air_spring.target` | 화면·시나리오 수치/모델 기준값 | `"0.42"` |
| [src/features/garage/VehicleLayout.tsx:113](../src/features/garage/VehicleLayout.tsx#L113) | `PLACE` | `PLACE.air_compressor.target` | 화면·시나리오 수치/모델 기준값 | `"0.4"` |
| [src/features/garage/VehicleLayout.tsx:114](../src/features/garage/VehicleLayout.tsx#L114) | `PLACE` | `PLACE.generic_ecu.target` | 화면·시나리오 수치/모델 기준값 | `"0.24"` |
| [src/features/garage/VehicleLayout.tsx:115](../src/features/garage/VehicleLayout.tsx#L115) | `PLACE` | `PLACE.position_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.1"` |
| [src/features/garage/VehicleLayout.tsx:116](../src/features/garage/VehicleLayout.tsx#L116) | `PLACE` | `PLACE.height_sensor.target` | 화면·시나리오 수치/모델 기준값 | `"0.1"` |
| [src/features/garage/VehicleLayout.tsx:121](../src/features/garage/VehicleLayout.tsx#L121) | `PLACE` | `PLACE.adas_camera.target` | 화면·시나리오 수치/모델 기준값 | `"0.2"` |
| [src/features/garage/VehicleLayout.tsx:125](../src/features/garage/VehicleLayout.tsx#L125) | `PLACE` | `PLACE.adas_radar.target` | 화면·시나리오 수치/모델 기준값 | `"0.25"` |
| [src/features/garage/VehicleLayout.tsx:126](../src/features/garage/VehicleLayout.tsx#L126) | `PLACE` | `PLACE.adas_ecu.target` | 화면·시나리오 수치/모델 기준값 | `"0.28"` |
| [src/features/garage/VehicleLayout.tsx:127](../src/features/garage/VehicleLayout.tsx#L127) | `PLACE` | `PLACE.tcu.target` | 화면·시나리오 수치/모델 기준값 | `"0.22"` |
| [src/features/garage/VehicleLayout.tsx:135](../src/features/garage/VehicleLayout.tsx#L135) | `FLOW_INFO` | `FLOW_INFO.analog.label` | 표시 라벨/선택지 | `"전기 신호 · 센서 값"` |
| [src/features/garage/VehicleLayout.tsx:136](../src/features/garage/VehicleLayout.tsx#L136) | `FLOW_INFO` | `FLOW_INFO.digital.label` | 표시 라벨/선택지 | `"전기 신호 · 명령(PWM)"` |
| [src/features/garage/VehicleLayout.tsx:137](../src/features/garage/VehicleLayout.tsx#L137) | `FLOW_INFO` | `FLOW_INFO.can_message.label` | 표시 라벨/선택지 | `"CAN 메시지"` |
| [src/features/garage/VehicleLayout.tsx:138](../src/features/garage/VehicleLayout.tsx#L138) | `FLOW_INFO` | `FLOW_INFO.electrical_power.label` | 표시 라벨/선택지 | `"고전압 전력"` |
| [src/features/garage/VehicleLayout.tsx:139](../src/features/garage/VehicleLayout.tsx#L139) | `FLOW_INFO` | `FLOW_INFO.lv_power.label` | 표시 라벨/선택지 | `"12V 전력"` |
| [src/features/garage/VehicleLayout.tsx:140](../src/features/garage/VehicleLayout.tsx#L140) | `FLOW_INFO` | `FLOW_INFO.mechanical_torque.label` | 표시 라벨/선택지 | `"기계 힘·토크"` |
| [src/features/garage/VehicleLayout.tsx:141](../src/features/garage/VehicleLayout.tsx#L141) | `FLOW_INFO` | `FLOW_INFO.rotational_speed.label` | 표시 라벨/선택지 | `"회전 (센서가 읽음)"` |
| [src/features/garage/VehicleLayout.tsx:142](../src/features/garage/VehicleLayout.tsx#L142) | `FLOW_INFO` | `FLOW_INFO.hydraulic_pressure.label` | 표시 라벨/선택지 | `"유압 (브레이크액)"` |
| [src/features/garage/VehicleLayout.tsx:143](../src/features/garage/VehicleLayout.tsx#L143) | `FLOW_INFO` | `FLOW_INFO.thermal.label` | 표시 라벨/선택지 | `"냉각수 · 열"` |
| [src/features/garage/VehicleLayout.tsx:144](../src/features/garage/VehicleLayout.tsx#L144) | `FLOW_INFO` | `FLOW_INFO.air.label` | 표시 라벨/선택지 | `"압축 공기"` |
| [src/features/garage/VehicleLayout.tsx:388](../src/features/garage/VehicleLayout.tsx#L388) | `ContextWheel` | `<group>.<PartModel>.@input` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/features/garage/VehicleLayout.tsx:433](../src/features/garage/VehicleLayout.tsx#L433) | `leftShaft` | `leftShaft.place.target` | 화면·시나리오 수치/모델 기준값 | `"0.55"` |
| [src/features/garage/VehicleLayout.tsx:434](../src/features/garage/VehicleLayout.tsx#L434) | `rightShaft` | `rightShaft.place.target` | 화면·시나리오 수치/모델 기준값 | `"0.55"` |
| [src/features/garage/VehicleLayout.tsx:508](../src/features/garage/VehicleLayout.tsx#L508) | `VehicleLayoutRig` | `<group>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"drivePower && <>\n      <SupportPart node={drivePower.battery} active={inputOn} />\n      <SupportPart node={drivePower.contactor} active={inputOn} />\n      {showCables && <><FlowCable a={anchorWorld(drivePower.battery, \"out\", \"dc_out\")} b={anchorWorld(drivePower.contactor, \"in\", \"hv_in\")} flow=\"electrical_power\" on={inputOn} staticColor />\n        <FlowCable a={anchorWorld(drivePower.contactor, \"out\", \"hv_out\")} b={anchorWorld(drivePower.inverter, \"in\", \"dc_in\")} flow=\"electrical_power\" on={inputOn} staticColor tag={inputOn ? \"고전압 전력 · 구동 에너지\" : undefined} /></>}\n    </>"` |
| [src/features/garage/VehicleLayout.tsx:511](../src/features/garage/VehicleLayout.tsx#L511) | `VehicleLayoutRig` | `<group>` | 동적 JSX 표현식(런타임 값/분기 포함) | `"showCables && <><FlowCable a={anchorWorld(drivePower.battery, \"out\", \"dc_out\")} b={anchorWorld(drivePower.contactor, \"in\", \"hv_in\")} flow=\"electrical_power\" on={inputOn} staticColor />\n        <FlowCable a={anchorWorld(drivePower.contactor, \"out\", \"hv_out\")} b={anchorWorld(drivePower.inverter, \"in\", \"dc_in\")} flow=\"electrical_power\" on={inputOn} staticColor tag={inputOn ? \"고전압 전력 · 구동 에너지\" : undefined} /></>"` |
| [src/features/garage/VehicleLayout.tsx:512](../src/features/garage/VehicleLayout.tsx#L512) | `VehicleLayoutRig` | `<group>.<FlowCable>.@tag` | 동적 JSX 표현식(런타임 값/분기 포함) | `"inputOn ? \"고전압 전력 · 구동 에너지\" : undefined"` |
| [src/features/garage/VehicleLayout.tsx:512](../src/features/garage/VehicleLayout.tsx#L512) | `VehicleLayoutRig` | `<group>.<FlowCable>.@tag` | 유형 태그 | `"고전압 전력 · 구동 에너지"` |
| [src/features/garage/VehicleLayout.tsx:519](../src/features/garage/VehicleLayout.tsx#L519) | `VehicleLayoutRig` | `<group>.<FlowCable>.@tag` | 유형 태그 | `"`${(FLOW_INFO[seg.flow] ?? FLOW_INFO.digital).label} · ${signalAt(seg.to.index)}`"` |
| [src/features/garage/VehicleLayout.tsx:579](../src/features/garage/VehicleLayout.tsx#L579) | `VehiclePlatformOverview` | `<group>.<PlacedPart>.@domain` | 영역 라벨 | `"drive"` |
| [src/features/garage/vehicleSpec.ts:152](../src/features/garage/vehicleSpec.ts#L152) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[0].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:152](../src/features/garage/vehicleSpec.ts#L152) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[0].note` | 보조 안내 | `"single current template"` |
| [src/features/garage/vehicleSpec.ts:153](../src/features/garage/vehicleSpec.ts#L153) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[1].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:153](../src/features/garage/vehicleSpec.ts#L153) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[1].note` | 보조 안내 | `"single current template"` |
| [src/features/garage/vehicleSpec.ts:154](../src/features/garage/vehicleSpec.ts#L154) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[2].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:154](../src/features/garage/vehicleSpec.ts#L154) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[2].note` | 보조 안내 | `"single current template"` |
| [src/features/garage/vehicleSpec.ts:155](../src/features/garage/vehicleSpec.ts#L155) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[3].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:155](../src/features/garage/vehicleSpec.ts#L155) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[3].note` | 보조 안내 | `"single current template"` |
| [src/features/garage/vehicleSpec.ts:156](../src/features/garage/vehicleSpec.ts#L156) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[4].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:156](../src/features/garage/vehicleSpec.ts#L156) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[4].note` | 보조 안내 | `"four-corner expansion is authored from the vehicle wheel frame"` |
| [src/features/garage/vehicleSpec.ts:157](../src/features/garage/vehicleSpec.ts#L157) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[5].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:157](../src/features/garage/vehicleSpec.ts#L157) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[5].note` | 보조 안내 | `"four-corner expansion follows the wheel hub axis"` |
| [src/features/garage/vehicleSpec.ts:158](../src/features/garage/vehicleSpec.ts#L158) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[6].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:158](../src/features/garage/vehicleSpec.ts#L158) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[6].note` | 보조 안내 | `"front-left and front-right knuckles use mirrored steering axes"` |
| [src/features/garage/vehicleSpec.ts:159](../src/features/garage/vehicleSpec.ts#L159) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[7].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:159](../src/features/garage/vehicleSpec.ts#L159) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[7].note` | 보조 안내 | `"column-mounted encoder ring with authored angle input/output anchors"` |
| [src/features/garage/vehicleSpec.ts:160](../src/features/garage/vehicleSpec.ts#L160) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[8].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:160](../src/features/garage/vehicleSpec.ts#L160) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[8].note` | 보조 안내 | `"threaded coolant probe with authored thermal input/output anchors"` |
| [src/features/garage/vehicleSpec.ts:161](../src/features/garage/vehicleSpec.ts#L161) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[9].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:161](../src/features/garage/vehicleSpec.ts#L161) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[9].note` | 보조 안내 | `"front e-axle lock member is shown in the gear cutaway"` |
| [src/features/garage/vehicleSpec.ts:162](../src/features/garage/vehicleSpec.ts#L162) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[10].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:162](../src/features/garage/vehicleSpec.ts#L162) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[10].note` | 보조 안내 | `"four-corner authored expansion checked against the wheel frame"` |
| [src/features/garage/vehicleSpec.ts:163](../src/features/garage/vehicleSpec.ts#L163) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[11].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:163](../src/features/garage/vehicleSpec.ts#L163) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[11].note` | 보조 안내 | `"four-corner authored expansion checked against the wheel frame"` |
| [src/features/garage/vehicleSpec.ts:164](../src/features/garage/vehicleSpec.ts#L164) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[12].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:164](../src/features/garage/vehicleSpec.ts#L164) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[12].note` | 보조 안내 | `"rear-corner authored expansion checked against the wheel frame"` |
| [src/features/garage/vehicleSpec.ts:165](../src/features/garage/vehicleSpec.ts#L165) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[13].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:165](../src/features/garage/vehicleSpec.ts#L165) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[13].note` | 보조 안내 | `"corner sensor offset is authored and mirrored"` |
| [src/features/garage/vehicleSpec.ts:166](../src/features/garage/vehicleSpec.ts#L166) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[14].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:166](../src/features/garage/vehicleSpec.ts#L166) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[14].note` | 보조 안내 | `"charge controller packaging coordinate and in/out anchors checked"` |
| [src/features/garage/vehicleSpec.ts:167](../src/features/garage/vehicleSpec.ts#L167) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[15].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:167](../src/features/garage/vehicleSpec.ts#L167) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[15].note` | 보조 안내 | `"charge-port latch coordinate and in/out anchors checked"` |
| [src/features/garage/vehicleSpec.ts:168](../src/features/garage/vehicleSpec.ts#L168) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[16].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:168](../src/features/garage/vehicleSpec.ts#L168) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[16].note` | 보조 안내 | `"thermal compressor packaging coordinate and ports checked"` |
| [src/features/garage/vehicleSpec.ts:169](../src/features/garage/vehicleSpec.ts#L169) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[17].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:169](../src/features/garage/vehicleSpec.ts#L169) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[17].note` | 보조 안내 | `"cabin thermal heater packaging coordinate and ports checked"` |
| [src/features/garage/vehicleSpec.ts:170](../src/features/garage/vehicleSpec.ts#L170) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[18].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:170](../src/features/garage/vehicleSpec.ts#L170) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[18].note` | 보조 안내 | `"thermal expansion-valve packaging coordinate and ports checked"` |
| [src/features/garage/vehicleSpec.ts:171](../src/features/garage/vehicleSpec.ts#L171) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[19].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:171](../src/features/garage/vehicleSpec.ts#L171) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[19].note` | 보조 안내 | `"forward-facing camera is mounted behind the windscreen on the authored local axis"` |
| [src/features/garage/vehicleSpec.ts:172](../src/features/garage/vehicleSpec.ts#L172) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[20].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:172](../src/features/garage/vehicleSpec.ts#L172) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[20].note` | 보조 안내 | `"forward-facing radar is mounted on the front envelope"` |
| [src/features/garage/vehicleSpec.ts:173](../src/features/garage/vehicleSpec.ts#L173) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[21].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:173](../src/features/garage/vehicleSpec.ts#L173) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[21].note` | 보조 안내 | `"body-mounted ADAS controller has an authored placement"` |
| [src/features/garage/vehicleSpec.ts:174](../src/features/garage/vehicleSpec.ts#L174) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[22].status` | 상태 라벨 | `"observed"` |
| [src/features/garage/vehicleSpec.ts:174](../src/features/garage/vehicleSpec.ts#L174) | `CURRENT_LAYOUT_PLACEMENT_AUDIT` | `CURRENT_LAYOUT_PLACEMENT_AUDIT.[22].note` | 보조 안내 | `"body-mounted telematics controller coordinate and model anchor checked"` |
| [src/features/garage/vehicleSpec.ts:198](../src/features/garage/vehicleSpec.ts#L198) | `steeringKnuckleInstances` | `steeringKnuckleInstances.note` | 보조 안내 | `"Dedicated knuckle model is connected at both front corners with tie-rod, strut, and hub anchors."` |
| [src/features/garage/vehicleSpec.ts:227](../src/features/garage/vehicleSpec.ts#L227) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.physicalInstances.[19].note` | 보조 안내 | `"Encoder ring is concentric with the authored steering column axis."` |
| [src/features/garage/vehicleSpec.ts:238](../src/features/garage/vehicleSpec.ts#L238) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.physicalInstances.[30].note` | 보조 안내 | `"Threaded probe is mounted on the coolant path and its two-pin output feeds the thermal ECU."` |
| [src/features/garage/vehicleSpec.ts:248](../src/features/garage/vehicleSpec.ts#L248) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.physicalInstances.[40].note` | 보조 안내 | `"ECU is body-mounted; assembly relationship is logical, not co-located geometry."` |
| [src/features/garage/vehicleSpec.ts:251](../src/features/garage/vehicleSpec.ts#L251) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.physicalInstances.[43].note` | 보조 안내 | `"The front e-axle cutaway places the pawl at the reduction-gear lock ring; actuator and position feedback remain separate."` |
| [src/features/garage/vehicleSpec.ts:253](../src/features/garage/vehicleSpec.ts#L253) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.physicalInstances.[45].note` | 보조 안내 | `"External equipment is represented as a signal/external view in Phase 0."` |
| [src/features/garage/vehicleSpec.ts:254](../src/features/garage/vehicleSpec.ts#L254) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.physicalInstances.[46].note` | 보조 안내 | `"Optional full-corner CDC measurement."` |
| [src/features/garage/vehicleSpec.ts:255](../src/features/garage/vehicleSpec.ts#L255) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.physicalInstances.[47].note` | 보조 안내 | `"Optional full-corner CDC measurement."` |
| [src/features/garage/vehicleSpec.ts:256](../src/features/garage/vehicleSpec.ts#L256) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.physicalInstances.[48].note` | 보조 안내 | `"Optional full-corner CDC measurement."` |
| [src/features/garage/vehicleSpec.ts:257](../src/features/garage/vehicleSpec.ts#L257) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.physicalInstances.[49].note` | 보조 안내 | `"Optional full-corner CDC measurement."` |
| [src/features/garage/vehicleSpec.ts:260](../src/features/garage/vehicleSpec.ts#L260) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.assemblies.[0].note` | 보조 안내 | `"Park ECU remains body-mounted; relationship is through signal/mechanical lock path."` |
| [src/features/garage/vehicleSpec.ts:267](../src/features/garage/vehicleSpec.ts#L267) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[0].kind` | 증거·항목 분류 | `"can"` |
| [src/features/garage/vehicleSpec.ts:268](../src/features/garage/vehicleSpec.ts#L268) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[1].kind` | 증거·항목 분류 | `"can"` |
| [src/features/garage/vehicleSpec.ts:269](../src/features/garage/vehicleSpec.ts#L269) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[2].kind` | 증거·항목 분류 | `"can"` |
| [src/features/garage/vehicleSpec.ts:269](../src/features/garage/vehicleSpec.ts#L269) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[2].unit` | 단위 | `"percent"` |
| [src/features/garage/vehicleSpec.ts:269](../src/features/garage/vehicleSpec.ts#L269) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[2].range.[0]` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/features/garage/vehicleSpec.ts:269](../src/features/garage/vehicleSpec.ts#L269) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[2].range.[1]` | 화면·시나리오 수치/모델 기준값 | `"100"` |
| [src/features/garage/vehicleSpec.ts:270](../src/features/garage/vehicleSpec.ts#L270) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[3].kind` | 증거·항목 분류 | `"cp"` |
| [src/features/garage/vehicleSpec.ts:270](../src/features/garage/vehicleSpec.ts#L270) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[3].unit` | 단위 | `"duty"` |
| [src/features/garage/vehicleSpec.ts:270](../src/features/garage/vehicleSpec.ts#L270) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[3].range.[0]` | 화면·시나리오 수치/모델 기준값 | `"0"` |
| [src/features/garage/vehicleSpec.ts:270](../src/features/garage/vehicleSpec.ts#L270) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[3].range.[1]` | 화면·시나리오 수치/모델 기준값 | `"1"` |
| [src/features/garage/vehicleSpec.ts:270](../src/features/garage/vehicleSpec.ts#L270) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[3].note` | 보조 안내 | `"Phase 0 records AC path only; no DC fast-charge object is defined."` |
| [src/features/garage/vehicleSpec.ts:271](../src/features/garage/vehicleSpec.ts#L271) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[4].kind` | 증거·항목 분류 | `"pp"` |
| [src/features/garage/vehicleSpec.ts:272](../src/features/garage/vehicleSpec.ts#L272) | `PHASE0_VEHICLE_SPEC` | `PHASE0_VEHICLE_SPEC.signalObjects.[5].kind` | 증거·항목 분류 | `"hvil"` |
| [src/features/garage/vehicleSpec.ts:384](../src/features/garage/vehicleSpec.ts#L384) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`Duplicate physical instance ID: ${instance.instanceId}`"` |
| [src/features/garage/vehicleSpec.ts:388](../src/features/garage/vehicleSpec.ts#L388) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`Owner assembly is not defined: ${instance.ownerAssemblyId}`"` |
| [src/features/garage/vehicleSpec.ts:392](../src/features/garage/vehicleSpec.ts#L392) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`${instance.instanceId} uses an explicit layoutOf() fallback placement.`"` |
| [src/features/garage/vehicleSpec.ts:394](../src/features/garage/vehicleSpec.ts#L394) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`${instance.instanceId} has a placement template but no verified corner transform.`"` |
| [src/features/garage/vehicleSpec.ts:399](../src/features/garage/vehicleSpec.ts#L399) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`${instance.instanceId} remains an unresolved required asset/placement; any connected model is provisional until the mount and engagement audit is complete.`"` |
| [src/features/garage/vehicleSpec.ts:403](../src/features/garage/vehicleSpec.ts#L403) | `issue` | `issue.message` | 상태/안내 문구 | `"`No model is resolved for ${instance.instanceId} (required profile: ${target}).`"` |
| [src/features/garage/vehicleSpec.ts:408](../src/features/garage/vehicleSpec.ts#L408) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`Model ID is not present in PART_MODEL_IDS: ${instance.modelId}`"` |
| [src/features/garage/vehicleSpec.ts:414](../src/features/garage/vehicleSpec.ts#L414) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`${instance.modelId} has no mount anchor '${instance.mountAnchor}'.`"` |
| [src/features/garage/vehicleSpec.ts:422](../src/features/garage/vehicleSpec.ts#L422) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`Assembly repeats child instance: ${childId}`"` |
| [src/features/garage/vehicleSpec.ts:424](../src/features/garage/vehicleSpec.ts#L424) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`Assembly child is not defined: ${childId}`"` |
| [src/features/garage/vehicleSpec.ts:426](../src/features/garage/vehicleSpec.ts#L426) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`Rotating instance is not an assembly child: ${rotatingId}`"` |
| [src/features/garage/vehicleSpec.ts:427](../src/features/garage/vehicleSpec.ts#L427) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`Fixed instance is not an assembly child: ${fixedId}`"` |
| [src/features/garage/vehicleSpec.ts:432](../src/features/garage/vehicleSpec.ts#L432) | `validateVehicleSpec` | `message` | 상태/안내 문구 | `"`Signal endpoint is not defined: ${endpoint}`"` |

## 이 목록만으로 결론내리지 않는 범위

- 이 문서는 원문·상호작용의 주소록입니다. 기술적으로 맞고 틀림을 자동 판정하지 않습니다.
- 기본 진입 상태, URL 직접 진입, 영역/도메인 선택 후의 패널 차이가 실제 화면과 일치하는지 브라우저 검수가 필요합니다.
- 계기·차량 모델의 물리 배치, 각 아이콘/모델의 의미, 배선 색·애니메이션은 3D 실행 화면으로 확인해야 합니다. 코드에 배치가 선언되어도 실제 모델의 방향·비율·가시성은 정적 근거만으로 확인되지 않습니다.
- 코드에 남았지만 플래그로 막힌 `SHOW_EE_TABS`, `SHOW_PULL_TABS` 분기는 현재 플레이어에게 보이는 UI와 분리해 기록했습니다.
