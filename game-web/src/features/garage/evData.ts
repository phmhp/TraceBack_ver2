/**
 * STEP01 domain/function data (EV general architecture; AUTOSAR Classic SWC naming).
 * Spec and review table: docs/EV_DOMAIN_SPEC_DRAFT.md. Numbers shown elsewhere are example parameters.
 *
 * Every function has four layers that show the same flow at four resolutions:
 *   0 vehicle function flow · 1 parts / E/E chain · 2 SW components (SWC) · 3 SW logic blocks.
 * Index order inside a domain is fixed: other screens (open book, puzzle notes, vehicle layout) address
 * functions by index.
 */
export type DomainId = "drive" | "power" | "charge" | "thermal" | "brake" | "steer" | "suspension" | "gear" | "vcu" | "comm" | "adas";
export type DomainGroup = "파워트레인" | "섀시" | "차량 제어";
export type FeatureCategory = "요구 해석" | "제어·배분" | "실행·보호";

export type Feature = {
  name: string;
  category: FeatureCategory;
  summary: string;
  /** [vehicle function flow, parts / E/E chain, SW components, SW logic] */
  layers: [string[], string[], string[], string[]];
};

export type DomainMeta = {
  label: string;
  group: DomainGroup;
  accent: string;
  purpose: string;
  features: [Feature, Feature, Feature, Feature];
};

export const DOMAIN_ORDER: DomainId[] = ["drive", "power", "charge", "thermal", "brake", "steer", "suspension", "gear", "vcu", "comm", "adas"];
export const DOMAIN_GROUPS: DomainGroup[] = ["파워트레인", "섀시", "차량 제어"];

export const EV_DOMAINS: Record<DomainId, DomainMeta> = {
  drive: {
    label: "구동", group: "파워트레인", accent: "#ef6b54",
    purpose: "가속 의도를 모터 토크와 바퀴 구동력으로 바꿉니다.",
    features: [
      { name: "운전자 토크 요청 해석", category: "요구 해석", summary: "가속 페달 입력을 검증해 운전자가 원하는 토크로 바꿉니다.",
        layers: [
          ["가속 페달 조작", "가속 의도", "가용 토크 판단", "전륜 추진력", "차량 가속"],
          ["APS A/B 가속 페달", "VCU", "CAN 토크", "MCU·인버터 ECU", "인버터", "전륜 PMSM 모터", "전륜 감속기", "차동기어", "드라이브 샤프트", "전륜"],
          ["PedalInput", "DriverRequest", "TorqueArbiter", "TorqueCmdTx"],
          ["A/B 상관성", "입력 필터", "페달 맵", "구동 허용", "가용 토크 MIN", "램프율", "토크 출력"],
        ] },
      { name: "구동 허용·인터록", category: "제어·배분", summary: "D단과 READY 조건이 모두 맞을 때만 구동 토크를 허용합니다.",
        layers: [
          ["D단 선택", "READY 확인", "구동 허용", "안전 출발"],
          ["PRND 센서", "VCU Interlock", "CAN Permit", "인버터 Enable"],
          ["GearInput", "DrivePermit", "FaultManager", "PermitTx"],
          ["Gear==D", "HV READY", "브레이크 인터록", "고장 래치", "Permit Gate"],
        ] },
      { name: "토크 배분·제한", category: "제어·배분", summary: "배터리·모터·열 한계를 모아 낼 수 있는 최대 토크로 제한합니다.",
        layers: [
          ["토크 요청", "한계 수집", "가용 토크 판단", "최종 토크 명령"],
          ["VCU", "BMS", "모터 NTC 센서", "Thermal ECU", "CAN 토크", "MCU·인버터 ECU"],
          ["LimitCollector", "TorqueArbiter", "RampLimiter", "TorqueCmdTx"],
          ["배터리 한계 수신", "열 한계 수신", "가용 토크 MIN", "램프율", "토크 명령 확정"],
        ] },
      { name: "인버터 전류·토크 제어", category: "실행·보호", summary: "토크 명령을 3상 전류로 만들어 전륜 PMSM·감속기 어셈블리의 축 토크를 냅니다.",
        layers: [
          ["토크 요구", "전류 목표", "dq 제어", "PWM", "모터 회전", "축 토크"],
          ["VCU", "CAN", "인버터 MCU", "3상 브리지", "PMSM", "리졸버"],
          ["TorqueCmdRx", "CurrentCtrl", "PwmDriver", "ResolverIf", "MotorProtect"],
          ["명령 수신", "dq 변환", "전류 PI", "전압 제한", "PWM 생성", "리졸버 피드백", "토크 추정"],
        ] },
    ],
  },
  power: {
    label: "고전압 전원", group: "파워트레인", accent: "#4a9a82",
    purpose: "고전압 팩을 안전하게 연결하고 각 도메인에 쓸 수 있는 전력을 알립니다.",
    features: [
      { name: "팩 안전 판단", category: "요구 해석", summary: "전압·절연·온도를 확인해 고전압 팩을 쓸 수 있는지 판단합니다.",
        layers: [
          ["시동 버튼", "START 요청", "팩 안전 확인", "전원 허용", "READY"],
          ["START 버튼", "전압·절연·온도 센서", "BMS", "VCU", "HV 부하"],
          ["PackMonitor", "IsolationCheck", "SafetyState", "PackSafeTx"],
          ["START 입력", "전압 범위", "절연 임계", "온도 제한", "Crash 신호", "PackSafe 래치"],
        ] },
      { name: "프리차지·접촉기", category: "제어·배분", summary: "인버터 커패시터를 먼저 충전한 뒤 주 접촉기를 닫습니다.",
        layers: [
          ["전원 요청", "부하측 전압 확인", "프리차지", "전압 동기화", "주 접촉기", "HV 연결"],
          ["팩 전압센서", "BMS", "프리차지 저항", "릴레이", "주 접촉기", "HV 버스"],
          ["VoltageRx", "PrechargeSeq", "ContactorDrv", "WeldDiag"],
          ["전압비 계산", "Precharge 상태기", "타임아웃", "주 접촉기 명령", "용착 진단", "HV 피드백"],
        ] },
      { name: "출력 가용량 계산", category: "제어·배분", summary: "SOC·온도·셀 편차로 방전·회생 출력 상한을 계산합니다.",
        layers: [
          ["팩 상태", "열·SOC 한계", "출력 예산", "도메인 배분", "가용 성능"],
          ["BMS", "VCU", "Power Coordinator", "CAN Limit", "인버터·부하"],
          ["CellLimitCalc", "SopEstimator", "LimitTx"],
          ["SOC 보정", "온도 디레이팅", "충방전 한계", "합계 제한", "도메인 우선순위", "램프율"],
        ] },
      { name: "고장 차단·HVIL", category: "실행·보호", summary: "인터록 단선·충돌 신호 등 위험 때 고전압을 차단합니다.",
        layers: [
          ["고장 감지", "위험 등급 판단", "고전압 차단", "안전 상태"],
          ["HVIL 루프", "충돌 신호", "BMS", "주 접촉기", "인버터 방전"],
          ["HvilMonitor", "CrashHandler", "ShutdownCtrl", "FaultLatch"],
          ["루프 단선 검사", "충돌 신호 확인", "위험 등급 판단", "접촉기 개방 명령", "고장 래치"],
        ] },
    ],
  },
  charge: {
    label: "충전", group: "파워트레인", accent: "#c9a23c",
    purpose: "외부 전력을 안전한 전류로 협상해 고전압 배터리를 충전합니다.",
    features: [
      { name: "충전 연결·잠금 확인", category: "요구 해석", summary: "커넥터 연결을 확인하고 충전구를 잠근 뒤 충전을 준비합니다.",
        layers: [
          ["충전 커넥터 삽입", "연결 확인", "커넥터 잠금", "충전 준비"],
          ["충전 인렛", "CP·PP 신호", "충전구 잠금 액추에이터", "EVCC", "VCU"],
          ["PlugDetect", "LockControl", "ChargeStateMgr"],
          ["PP 저항 판독", "CP 전압 상태 확인", "잠금 조건", "잠금 확인 타임아웃", "충전 상태 전이"],
        ] },
      { name: "충전 전류 협상", category: "제어·배분", summary: "충전기 능력과 배터리 수용 한계를 비교해 충전 전류를 정합니다.",
        layers: [
          ["충전기 능력", "허용 전류 비교", "충전 전류 결정", "충전 시작"],
          ["충전기", "EVCC", "BMS", "CAN 충전 요구", "OBC"],
          ["ChargerCapRx", "CurrentNegotiator", "ChargeReqTx"],
          ["충전기 한계 수신", "배터리 수용 한계", "전류 MIN", "PWM 듀티 해석", "램프율"],
        ] },
      { name: "OBC 변환 제어", category: "실행·보호", summary: "교류를 직류로 바꾸며 요청된 전류로 팩을 충전합니다.",
        layers: [
          ["교류 입력", "역률 보정", "직류 변환", "팩 충전"],
          ["충전 인렛", "OBC", "충전 접촉기", "HV 버스", "고전압 배터리"],
          ["ObcCtrl", "PfcRegulator", "CurrentLoop", "OvpGuard"],
          ["입력 전압 검사", "PFC 전압 PI", "전류 추종 PI", "출력 제한", "과전압 진단"],
        ] },
      { name: "충전 중 보호·종료", category: "실행·보호", summary: "온도·절연 이상이나 목표 도달 때 충전을 멈추고 잠금을 풉니다.",
        layers: [
          ["이상 감지", "충전 중단", "접촉기 개방", "종료 기록"],
          ["모터 NTC 센서", "전압·절연 센서", "BMS", "OBC", "충전구 잠금 액추에이터"],
          ["ChargeMonitor", "StopHandler", "UnlockCtrl"],
          ["온도 임계", "절연 임계", "SOC 종료 조건", "충전 중단 명령", "잠금 해제 조건", "종료 상태 래치"],
        ] },
    ],
  },
  thermal: {
    label: "열관리", group: "파워트레인", accent: "#d77857",
    purpose: "배터리·모터·인버터·실내 온도를 목표 범위로 유지해 성능과 수명을 지킵니다.",
    features: [
      { name: "온도 상태 추정", category: "요구 해석", summary: "여러 온도 센서를 검증·필터링해 보호에 쓸 열 상태를 만듭니다.",
        layers: [
          ["부품 발열", "온도 측정", "열 상태 판단", "열 요구"],
          ["모터 NTC 센서", "냉각수 온도센서", "Thermal ECU", "VCU"],
          ["TempAdapter", "PlausibilityCheck", "ThermalState"],
          ["범위 검사", "필터", "최대값 선택"],
        ] },
      { name: "펌프·팬·컴프레서 제어", category: "제어·배분", summary: "목표 온도에 맞춰 펌프 유량과 팬 회전수를 폐루프로 제어합니다.",
        layers: [
          ["열 요구", "목표 유량·풍량", "구동 명령", "온도 저감"],
          ["Thermal ECU", "냉각 펌프", "냉각 팬", "RPM Feedback"],
          ["TargetManager", "PumpFanCtrl", "FeedbackMonitor"],
          ["히스테리시스", "PI 제어", "무응답 진단"],
        ] },
      { name: "냉각·난방 회로 배분", category: "제어·배분", summary: "히트펌프로 배터리·구동계·실내 회로에 열을 나누어 보냅니다.",
        layers: [
          ["열원 우선순위", "운전 모드", "회로 전환", "열 이동"],
          ["VCU", "Thermal ECU", "전동 컴프레서", "칠러", "전자식 팽창밸브", "Valve Manifold", "PTC 히터"],
          ["ThermalModeMgr", "ValveCtrl", "CompressorCtrl", "PositionMonitor"],
          ["모드 상태기", "전환 지연", "밸브 위치 확인", "컴프레서 회전수 맵", "피드백 진단"],
        ] },
      { name: "열 한계 출력 제한", category: "실행·보호", summary: "냉각이 부족하면 구동 출력을 단계적으로 낮춰 부품을 보호합니다.",
        layers: [
          ["온도 초과", "디레이팅 단계", "출력 제한 요청", "부품 보호"],
          ["Thermal ECU", "VCU", "Inverter", "Cluster"],
          ["DerateRequest", "TorqueLimiter", "RecoveryMgr", "WarningLamp"],
          ["단계 임계", "램프 제한", "복귀 히스테리시스"],
        ] },
    ],
  },
  brake: {
    label: "제동", group: "섀시", accent: "#5a86b8",
    purpose: "감속 요구를 회생과 마찰로 나눠 안전하게 멈춥니다.",
    features: [
      { name: "제동력 요구 계산", category: "요구 해석", summary: "페달 입력을 목표 감속도와 총 제동력으로 바꿉니다.",
        layers: [
          ["페달 조작", "감속 의도", "목표 감속도", "총 제동력", "차량 감속"],
          ["페달 A/B 센서", "Brake ECU", "압력 제어기", "유압 라인", "4륜 캘리퍼"],
          ["PedalInput", "BrakeRequest", "ForceTarget", "PressureCmdTx"],
          ["입력 상관성", "페달 필터", "감속 맵", "힘 제한", "압력 변환", "출력 램프"],
        ] },
      { name: "회생·마찰 협조", category: "제어·배분", summary: "가능한 회생제동을 먼저 쓰고 부족분을 마찰제동으로 채웁니다.",
        layers: [
          ["총 제동 요구", "배터리 수용량", "회생 한계", "마찰 보상", "전·후륜 배분", "일관된 감속"],
          ["Brake ECU", "VCU", "BMS", "인버터", "Hydraulic ECU", "모터·캘리퍼"],
          ["RegenLimitRx", "BlendManager", "FrictionComp", "HydraulicCmd"],
          ["요구 수신", "회생 가용량", "회생 MIN", "잔여력 계산", "마찰 압력", "블렌딩 피드백"],
        ] },
      { name: "ABS·EBD 휠 슬립 제어", category: "실행·보호", summary: "휠 슬립을 감시해 잠김 직전 바퀴의 압력을 조절합니다.",
        layers: [
          ["휠 잠김 징후", "차속 추정", "슬립 계산", "밸브 조절", "조향 가능 제동"],
          ["4륜 속도센서", "ABS ECU", "유압 모듈레이터", "솔레노이드 밸브", "캘리퍼"],
          ["WheelSpeedRx", "SlipEstimator", "AbsStateMgr", "ValveDriver"],
          ["휠속 필터", "기준 차속", "슬립 임계", "감압·유지·증압", "밸브 PWM", "재평가"],
        ] },
      { name: "ESC 차체 안정 제어", category: "실행·보호", summary: "요 움직임을 감지해 바퀴별 제동력으로 자세를 안정시킵니다.",
        layers: [
          ["회전 불안정", "목표 요율", "요 오차", "개별 휠 제동", "차체 안정"],
          ["요·횡가속 센서", "ESC ECU", "Brake ECU", "유압 모듈", "4륜 캘리퍼"],
          ["MotionObserver", "YawController", "WheelAllocator", "PressurePorts"],
          ["센서 융합", "목표 요율", "오차 PI", "휠 선택", "압력 제한", "개입 종료"],
        ] },
    ],
  },
  steer: {
    label: "조향", group: "섀시", accent: "#8a72b5",
    purpose: "핸들 입력과 EPS 보조를 전륜 각도로 바꿉니다.",
    features: [
      { name: "조향 입력 해석", category: "요구 해석", summary: "핸들 각도를 검증해 목표 전륜각으로 바꿉니다.",
        layers: [
          ["핸들 회전", "운전자 조향 의도", "목표 전륜각", "랙 이동", "진로 변경"],
          ["핸들각 센서", "EPS ECU", "EPS 모터", "랙·타이로드", "전륜"],
          ["AngleAdapter", "SteerTarget", "RackPosCtrl", "AngleFeedback"],
          ["각도 보정", "조향비 맵", "목표 랙 위치", "추종 PI", "각도 제한", "피드백 진단"],
        ] },
      { name: "EPS 보조 토크 계산", category: "제어·배분", summary: "차속과 운전자 토크로 자연스러운 보조 토크를 만듭니다.",
        layers: [
          ["운전자 토크", "차속 보정", "보조 토크", "EPS 모터", "가벼운 조향"],
          ["토크 센서", "차속 CAN", "EPS ECU", "모터 인버터", "조향축"],
          ["TorqueAdapter", "AssistMap", "CurrentCtrl", "MotorPort"],
          ["센터 보정", "토크 필터", "속도별 맵", "복원 토크", "전류 PI", "보호 제한"],
        ] },
      { name: "모터 전류 제어·랙 구동", category: "실행·보호", summary: "EPS 모터 회전을 랙과 타이로드로 양쪽 전륜에 전달합니다.",
        layers: [
          ["EPS 모터", "웜 감속", "피니언", "랙 직선 이동", "타이로드", "좌·우 전륜각"],
          ["EPS 모터", "감속기", "피니언", "랙", "타이로드", "전륜 너클"],
          ["RackObserver", "TravelLimit", "AngleConvert", "FeedbackPort"],
          ["모터각", "기어비", "랙 변환", "스트로크 제한", "아커만 보정", "각도 피드백"],
        ] },
      { name: "폴백·안정 협조", category: "실행·보호", summary: "센서 고장 때 보조를 줄이고 ESC와 협조해 진로를 유지합니다.",
        layers: [
          ["조향 요구", "차체 요 반응", "안정도 판단", "오버레이 토크", "진로 유지"],
          ["조향각 센서", "IMU", "ESC ECU", "EPS ECU", "전륜"],
          ["MotionInput", "StabilityCoord", "OverlayTorque", "EpsPort"],
          ["요율 오차", "횡가속 검증", "안정 협조", "보정 게인", "개입 제한", "폴백"],
        ] },
    ],
  },
  suspension: {
    label: "현가", group: "섀시", accent: "#6f8d7c",
    purpose: "노면 충격을 흡수하고 타이어 접지와 차체 자세를 안정적으로 유지합니다.",
    features: [
      { name: "노면 입력 해석", category: "요구 해석", summary: "가속도·차고 센서 값으로 노면과 차체 움직임을 파악합니다.",
        layers: [
          ["노면 요철", "휠 상하 운동", "센서 측정", "노면 상태 판단"],
          ["IMU", "휠 가속도센서", "차고 높이 센서", "Chassis ECU"],
          ["MotionAdapter", "RoadEstimator", "SensorPlausibility"],
          ["가속도 필터", "변위 보정", "범위 검사", "노면 등급 판단"],
        ] },
      { name: "댐핑력 제어", category: "제어·배분", summary: "전자제어 댐퍼가 차속과 차체 운동에 맞춰 감쇠력을 조절합니다.",
        layers: [
          ["차체 운동", "목표 감쇠력", "밸브 전류", "감쇠력"],
          ["IMU", "Chassis ECU", "댐퍼 밸브", "댐퍼"],
          ["DampingMap", "CurrentCommand", "DriveModeMgr"],
          ["신호 필터", "차속별 맵", "맵 보간", "전류 제한", "폴백 댐핑"],
        ] },
      { name: "차고·자세 유지", category: "제어·배분", summary: "에어 스프링 사양에서 차고 오차를 압력 조절로 바로잡습니다.",
        layers: [
          ["차고 오차", "목표 압력", "밸브·컴프레서 구동", "차고 복원"],
          ["차고 높이 센서", "Chassis ECU", "Air Compressor", "Air Spring"],
          ["HeightControl", "PressureCmd", "LeakMonitor"],
          ["목표 차고 설정", "밸브 상태기", "압력 제한", "누설 진단"],
        ] },
      { name: "센서 고장 폴백", category: "실행·보호", summary: "센서 이상을 판별해 고정 댐핑으로 바꾸고 경고합니다.",
        layers: [
          ["이상 징후", "센서 판정", "보호 모드", "경고"],
          ["휠 가속도센서", "차고 높이 센서", "Chassis ECU", "Cluster"],
          ["FaultMonitor", "FallbackSelector", "WarningReq"],
          ["신호 타당성 진단", "임계 판단", "고정 댐핑 전환", "복귀 조건", "경고 요청"],
        ] },
    ],
  },
  gear: {
    label: "변속·주차", group: "섀시", accent: "#b17752",
    purpose: "운전자의 변속 의도를 검증해 주행 방향과 주차 잠금을 결정합니다.",
    features: [
      { name: "PRND 입력 판독", category: "요구 해석", summary: "접점과 통신 신호를 서로 검증해 변속 의도를 확정합니다.",
        layers: [
          ["PRND 조작", "접점·통신 확인", "변속 의도", "유효 상태"],
          ["PRND 센서", "VCU", "Cluster"],
          ["GearAdapter", "GearPlausibility", "GearStateMgr"],
          ["디바운스", "접점·통신 상관성", "상태 래치", "타임아웃 확인"],
        ] },
      { name: "방향 전환 인터록", category: "제어·배분", summary: "주행 중 반대 방향 선택을 막고 브레이크 조건을 확인합니다.",
        layers: [
          ["방향 요청", "차속·브레이크 확인", "방향 허용", "거부 시 현재 유지"],
          ["PRND", "VCU", "Brake ECU", "Inverter"],
          ["ShiftRequest", "SafetyInterlock", "DirectionPermit"],
          ["차속 임계", "브레이크 조건", "방향 허용 Gate", "거부 진단"],
        ] },
      { name: "P단 잠금 제어", category: "실행·보호", summary: "정지를 확인한 뒤 전동 파킹 액추에이터를 체결합니다.",
        layers: [
          ["P 요청", "정지 확인", "잠금 체결", "차량 고정"],
          ["VCU", "Park ECU", "Lock Actuator", "Position Sensor"],
          ["ParkRequest", "ActuatorControl", "LockFeedback"],
          ["차속 0 확인", "전류 제한", "체결 위치 확인", "체결 실패 진단"],
        ] },
      { name: "기어 상태 배포·표시", category: "실행·보호", summary: "확정된 기어 상태를 계기판과 관련 제어기에 일관되게 전달합니다.",
        layers: [
          ["기어 상태", "네트워크 송신", "수신 확인", "표시·제어"],
          ["VCU", "CAN", "Cluster", "Park ECU"],
          ["StatePublisher", "E2EProtect", "TimeoutMonitor"],
          ["상태 인코딩", "E2E 확인", "롤링 카운터", "타임아웃", "기본값 처리"],
        ] },
    ],
  },
  vcu: {
    label: "차량 통합", group: "차량 제어", accent: "#c06a5a",
    purpose: "차량 상태를 관리하고 도메인 요구를 중재해 안전한 동작을 결정합니다.",
    features: [
      { name: "차량 상태 관리", category: "제어·배분", summary: "시동 요청과 조건을 보고 SLEEP·READY·DRIVE·FAULT 상태를 전환합니다.",
        layers: [
          ["시동 요청", "상태 판단", "상태 전이", "주행 가능"],
          ["START 버튼", "VCU", "CAN 상태", "BMS"],
          ["WakeupMgr", "VehicleStateMgr", "StateTx"],
          ["시동 조건 확인", "상태 전이 표", "브레이크 조건", "READY 래치", "SLEEP 타임아웃"],
        ] },
      { name: "도메인 요구 중재", category: "제어·배분", summary: "구동·제동·열 요구가 겹칠 때 우선순위를 정해 최종 요구를 확정합니다.",
        layers: [
          ["토크 요구", "제동 요구", "우선순위 판단", "최종 요구"],
          ["APS 가속 페달", "Brake ECU", "VCU", "MCU·인버터 ECU"],
          ["RequestCollector", "PriorityArbiter", "RequestTx"],
          ["요구 수신", "우선순위 선택", "충돌 요구 MIN", "램프율", "최종 요구 확정"],
        ] },
      { name: "12V 전원 관리", category: "실행·보호", summary: "DC/DC 출력을 조절해 12V 전장품에 안정적으로 전원을 공급합니다.",
        layers: [
          ["저전압 감시", "DC/DC 목표", "12V 공급", "전장품 동작"],
          ["12V 배터리", "DC/DC", "VCU", "LV 부하"],
          ["LvMonitor", "DcdcController", "LoadShedding"],
          ["전압 범위 검사", "DCDC 목표 전압 맵", "전류 제한", "저전압 보호 판단", "부하 차단 상태"],
        ] },
      { name: "고장 등급·안전 상태", category: "실행·보호", summary: "제어기 고장을 등급으로 나누고 림프홈 같은 안전 상태로 전이합니다.",
        layers: [
          ["고장 감지", "등급 판단", "안전 상태 전이", "경고 요청"],
          ["각 제어기", "CAN 고장 코드", "VCU", "Cluster"],
          ["FaultCollector", "SeverityClassifier", "SafeStateMgr", "WarningReq"],
          ["고장 코드 수신", "디바운스", "등급 분류", "림프홈 조건", "안전 상태 래치"],
        ] },
    ],
  },
  comm: {
    label: "통신·진단", group: "차량 제어", accent: "#5f7fa0",
    purpose: "제어기 사이 신호를 전달하고 건전성을 감시하며 진단·원격 업데이트를 처리합니다.",
    features: [
      { name: "도메인 간 신호 전달", category: "요구 해석", summary: "송신 제어기의 신호를 CAN과 게이트웨이를 거쳐 수신 제어기에 전달합니다.",
        layers: [
          ["송신 제어기", "메시지 전송", "수신 제어기", "신호 반영"],
          ["송신 ECU", "CAN 버스", "게이트웨이", "수신 ECU"],
          ["ComTx", "PduRouter", "ComRx"],
          ["신호 패킹", "주기 송신", "ID 필터", "신호 언패킹", "값 범위 확인"],
        ] },
      { name: "통신 건전성 감시", category: "제어·배분", summary: "카운터·CRC·수신 주기를 확인하고 이상이면 안전한 값으로 바꿉니다.",
        layers: [
          ["메시지 수신", "주기 확인", "오류 판정", "폴백 값"],
          ["CAN 버스", "게이트웨이", "VCU", "수신 ECU"],
          ["E2EProtect", "TimeoutMonitor", "FallbackProvider"],
          ["롤링 카운터 확인", "CRC 확인", "타임아웃", "오류 디바운스", "폴백 값 적용"],
        ] },
      { name: "진단 요청·응답", category: "실행·보호", summary: "진단 장비의 요청을 해석해 대상 제어기의 DTC와 상태를 응답합니다.",
        layers: [
          ["진단 요청", "서비스 해석", "제어기 응답", "결과 표시"],
          ["진단 장비", "진단 포트", "게이트웨이", "대상 ECU"],
          ["DcmSession", "DiagService", "DtcManager"],
          ["세션 확인", "서비스 ID 해석", "DTC 조회", "응답 구성", "오류 응답 처리"],
        ] },
      { name: "원격 진단·OTA", category: "실행·보호", summary: "텔레매틱스 제어기로 서버와 통신하며 조건이 맞을 때 소프트웨어를 갱신합니다.",
        layers: [
          ["서버 요청", "조건 확인", "원격 전송", "업데이트·보고"],
          ["서버", "텔레매틱스 제어기", "게이트웨이", "대상 ECU"],
          ["RemoteDiag", "UpdateGuard", "ImageTransfer"],
          ["차량 상태 조건", "배터리 전압 조건", "이미지 서명 확인", "전송 재시도", "업데이트 롤백"],
        ] },
    ],
  },
  adas: {
    label: "운전자 지원·HMI", group: "차량 제어", accent: "#7a6aa0",
    purpose: "전방을 인지해 감속과 경고를 요청하고 상태를 운전자에게 알립니다.",
    features: [
      { name: "전방 인지", category: "요구 해석", summary: "카메라와 레이더 정보를 융합해 앞 물체와 위험 거리를 판단합니다.",
        layers: [
          ["전방 물체", "센서 측정", "물체 융합", "위험 판단"],
          ["전방 카메라", "전방 레이더", "ADAS ECU", "CAN 물체 정보"],
          ["CameraIf", "RadarIf", "ObjectFusion"],
          ["신호 타당성 검사", "시간 동기", "객체 연결", "신뢰도 선택", "위험 거리 계산"],
        ] },
      { name: "목표 감속·거리 제어", category: "제어·배분", summary: "충돌 시간을 계산해 필요한 목표 감속도를 제동·구동 쪽에 요청합니다.",
        layers: [
          ["전방 거리", "충돌 위험", "목표 감속도", "감속 요청"],
          ["ADAS ECU", "CAN 감속 요청", "Brake ECU", "VCU"],
          ["TtcCalculator", "DecelPlanner", "RequestTx"],
          ["충돌 시간 계산", "개입 임계", "목표 감속 맵", "저크 제한", "요청 출력"],
        ] },
      { name: "경고·개입 협조", category: "실행·보호", summary: "경고 단계를 올리고 운전자 조작을 확인하며 제동·조향 개입을 중재합니다.",
        layers: [
          ["위험 등급", "경고 단계", "제동·조향 중재", "운전자 개입"],
          ["ADAS ECU", "Brake ECU", "EPS ECU", "Cluster"],
          ["WarningStage", "InterventionArbiter", "DriverOverride"],
          ["경고 단계 상태기", "운전자 조작 확인", "개입 우선순위", "개입 종료 조건"],
        ] },
      { name: "클러스터 표시·경고등", category: "실행·보호", summary: "수신한 상태를 점등 조건에 따라 계기판과 경고등에 표시합니다.",
        layers: [
          ["상태 수신", "표시 조건", "경고등 점등", "운전자 인지"],
          ["CAN 상태", "Cluster", "경고등 표시"],
          ["StateRx", "LampLogic", "DisplayDriver"],
          ["상태 수신 확인", "타임아웃", "점등 조건", "깜빡임 주기", "기본값 처리"],
        ] },
    ],
  },
};

/** Vehicle-level inputs and outputs shown beside each domain group in the overview architecture. */
export const OVERVIEW_IO: Record<DomainGroup, { inputs: string[]; outputs: string[] }> = {
  "파워트레인": { inputs: ["가속 페달·시동", "충전 커넥터", "전압·온도 센서"], outputs: ["모터 토크", "팩 충전", "냉각·난방 열"] },
  "섀시": { inputs: ["브레이크·핸들", "휠·IMU·차고 센서", "변속 레버"], outputs: ["제동력", "조향각", "감쇠·차고·파킹 잠금"] },
  "차량 제어": { inputs: ["진단 장비", "전방 카메라·레이더"], outputs: ["계기판·경고", "고장 기록"] },
};

/** Signals one domain sends to another so the whole vehicle behaves consistently. */
export const COORD_SIGNALS: { name: string; from: DomainId; to: DomainId[]; purpose: string }[] = [
  { name: "방전·회생 한계", from: "power", to: ["drive", "brake"], purpose: "배터리가 낼 수 있는 출력과 받을 수 있는 회생 전력의 상한" },
  { name: "열 디레이팅", from: "thermal", to: ["drive"], purpose: "과열 보호를 위해 구동 출력을 단계적으로 제한" },
  { name: "회생 요청", from: "brake", to: ["drive"], purpose: "제동 요구 중 회생으로 처리할 몫을 구동 제어기에 전달" },
  { name: "구동 허용", from: "gear", to: ["drive"], purpose: "변속 상태와 인터록을 통과해야 토크를 낼 수 있음" },
  { name: "충전 중 구동 금지", from: "charge", to: ["drive"], purpose: "충전기가 연결된 동안 차량이 움직이지 않도록 구동을 막음" },
  { name: "ESC 개입", from: "brake", to: ["steer", "drive"], purpose: "차체 불안정 시 휠 제동과 함께 토크·조향 보조를 조정" },
  { name: "기어 상태", from: "gear", to: ["comm"], purpose: "확정된 PRND 상태를 네트워크로 배포해 계기판과 제어기가 같은 값을 사용" },
  { name: "안전 상태", from: "vcu", to: ["drive", "brake", "steer"], purpose: "제어기 고장 등급에 따라 출력 제한이나 림프홈으로 전환하도록 알림" },
  { name: "ADAS 감속 요청", from: "adas", to: ["brake", "drive"], purpose: "충돌 위험 때 목표 감속도를 제동과 구동에 요청" },
];
