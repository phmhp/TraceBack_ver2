import type { CaseId } from "./runtime";

type Scenario = {
  title: string;
  chapter: string;
  symptom: string;
  root: string;
  repair: string;
  evidence: { id: string; label: string; value: string; kind: string }[];
  hypotheses: { id: string; label: string; desc: string }[];
};

export const SCENARIOS: Record<CaseId, Scenario> = {
  propulsion: {
    title: "가속 페달 입력 대비 가속 성능 저하",
    chapter: "사건 1 · 가속 응답",
    symptom: "가속 페달을 절반 이상 밟았지만 차가 힘없이 천천히 가속합니다.",
    root: "gateway",
    repair: "페달 신호 변환 비율을 정상 값으로 복원",
    evidence: [
      { id: "pedal_raw", label: "페달 60% 입력에도 차량 가속이 둔함", value: "주행 중 체감한 출력 부족", kind: "주행 현상" },
      { id: "pedal_processed", label: "VCU 입력값이 27%로 기록됨", value: "APS 원신호 60% → 처리값 27%", kind: "입력 계측" },
      { id: "torque_cmd", label: "CAN 토크 명령이 92 Nm로 기록됨", value: "정상 기준 204 Nm", kind: "제어 명령" },
      { id: "motor_actual", label: "모터 실제 토크가 91 Nm로 측정됨", value: "명령값과의 차이 1 Nm", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "aps_sensor", label: "가속 페달 센서가 틀린 값을 보냈다", desc: "입력 센서 오류 가능성" },
      { id: "gateway", label: "페달 신호를 잘못 줄여서 전달했다", desc: "입력 변환 비율 설정 오류" },
      { id: "bms", label: "배터리가 출력을 제한했다", desc: "배터리 보호 개입 가능성" },
      { id: "motor", label: "구동 모터가 힘을 내지 못했다", desc: "모터 출력 저하 가능성" },
    ],
  },
  thermal: {
    title: "장시간 고속 주행 후 출력 제한·경고등 점등",
    chapter: "사건 2 · 출력 제한",
    symptom: "고속으로 오래 달리자 파워다운 표시등이 켜지고 가속이 약해졌습니다.",
    root: "fan_actuator",
    repair: "팬 PWM 출력 어댑터 SW의 실행 순서 복원",
    evidence: [
      { id: "motor_temp", label: "온도 경고와 가속력 저하가 함께 발생함", value: "구동계 냉각수 온도 78.4°C", kind: "주행 현상" },
      { id: "thermal_protection", label: "구동 토크 제한 상태가 기록됨", value: "Derate flag ON", kind: "상태 계측" },
      { id: "fan_command", label: "Fan PWM 명령이 100%로 기록됨", value: "ECU 출력 명령 100%", kind: "제어 명령" },
      { id: "fan_actual", label: "팬 회전 피드백이 0 RPM으로 측정됨", value: "명령 100% · 실제 0 RPM", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "sensor", label: "온도 센서가 틀린 값을 보냈다", desc: "센서 측정 오류 가능성" },
      { id: "software_command", label: "팬 켜기 판단 로직이 잘못됐다", desc: "상태 전이 오류 가능성" },
      { id: "fan_actuator", label: "팬 요청을 PWM 출력으로 쓰는 SW가 실행되지 않았다", desc: "SW I/O 실행 순서 오류" },
    ],
  },
  brake: {
    title: "제동 페달 입력 대비 감속 부족",
    chapter: "선택 사건 · 제동 응답",
    symptom: "브레이크 페달을 밟았지만 회생제동만 작동하고 마찰제동 반응이 약합니다.",
    root: "brake_actuator", // id kept for save compatibility; the root cause is SW command scaling
    repair: "압력 명령 I/O 어댑터의 이중 스케일링 제거",
    evidence: [
      { id: "brake_request", label: "페달 55% 입력에도 감속이 부족함", value: "정지거리 증가를 주행 중 관찰", kind: "주행 현상" },
      { id: "regen_request", label: "회생제동 명령이 22%로 기록됨", value: "인버터 회생 명령 정상", kind: "제어 명령" },
      { id: "brake_actual", label: "캘리퍼 압력이 기대값보다 낮게 측정됨", value: "명령 42 bar · 실제 8 bar (약 19%)", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "brake_actuator", label: "압력 명령을 내보내는 SW가 값을 다시 축소했다", desc: "SW 인터페이스 스케일링 오류" },
      { id: "regen_limit", label: "회생 한계 처리 SW가 마찰 몫을 잘못 계산했다", desc: "제어 계산 오류 가능성" },
      { id: "pedal", label: "페달 입력 처리 SW의 보정값이 틀렸다", desc: "입력 데이터 처리 오류 가능성" },
    ],
  },
  regen: {
    title: "가속 페달을 떼도 차가 계속 빨라짐",
    chapter: "선택 사건 · 코스팅 회생",
    symptom: "가속 페달에서 발을 떼면 감속해야 하는데 오히려 속도가 올라갑니다. 경고등은 없습니다.",
    root: "vcu_sign",
    repair: "회생 요청의 부호 규약을 인터페이스 정의대로 반영하고 부호 단위 시험 추가",
    evidence: [
      { id: "accel_trend", label: "페달 0%인데 차량 가감속이 +0.5 m/s²로 기록됨", value: "기준 −0.5 m/s² · 경고등 없음", kind: "주행 현상" },
      { id: "regen_request", label: "Brake ECU 회생 요청이 −40 Nm로 기록됨", value: "회생 요청 정상 · 기준과 같음", kind: "제어 명령" },
      { id: "torque_cmd", label: "VCU 토크 지령이 +40 Nm로 기록됨", value: "기준 −40 Nm", kind: "제어 명령" },
    ],
    hypotheses: [
      { id: "brake_sw", label: "Brake ECU가 틀린 회생 요청을 보냈다", desc: "회생 요청 계산 오류 가능성" },
      { id: "pedal", label: "가속 페달 값이 틀렸다", desc: "입력 센서 오류 가능성" },
      { id: "vcu_sign", label: "VCU가 회생 요청의 부호를 반영하지 않았다", desc: "인터페이스 부호 규약 오류" },
      { id: "inv_wire", label: "인버터·모터 상 배선이 반대로 연결됐다", desc: "하드웨어 배선 오류 가능성" },
    ],
  },
  ready: {
    title: "시동 버튼을 눌러도 READY가 켜지지 않음",
    chapter: "선택 사건 · 시동 시퀀스",
    symptom: "브레이크를 밟고 시동 버튼을 눌러도 READY가 켜지지 않고 HV 시스템 점검 표시등이 켜집니다. 몇 번을 눌러도 같습니다.",
    root: "seq_timeout",
    repair: "프리차지 대기 시간을 설계값 1500 ms로 복원하고 시퀀스 타이밍 시험 추가",
    evidence: [
      { id: "ready_off", label: "시동 시도 3회가 모두 READY 없이 끝남", value: "계기판 READY 없음 · HV 시스템 점검 표시등", kind: "주행 현상" },
      { id: "dtc_precharge", label: "프리차지 실패 진단 코드가 저장됨", value: "실패 시각 500 ms · 팩 400 V · 버스 345.9 V", kind: "진단 기록" },
      { id: "hv_bus_scope", label: "HV 버스 전압이 500 ms 시점에 345.9 V로 측정됨", value: "정상 충전 곡선 · 95 %(380 V)는 약 750 ms", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "bms_link", label: "BMS가 시동 허용 신호를 보내지 않았다", desc: "통신 신호 오류 가능성" },
      { id: "start_cond", label: "VCU 시동 조건 판정이 틀렸다", desc: "입력 조건 판정 오류 가능성" },
      { id: "seq_timeout", label: "프리차지 대기 시간 설정이 틀렸다", desc: "시퀀스 타이밍 설정 오류" },
      { id: "precharge_hw", label: "프리차지 저항·접촉기가 불량이다", desc: "하드웨어 고장 가능성" },
    ],
  },
};

// ── Scenario registry (one source for race → board → puzzle → bench → repair) ──────────────
// Every value here must match the numeric models: src/sim/vehicleSim.ts (race) and
// src/features/verification/simModel.ts (bench). Fixed, reviewed scenarios only — nothing is generated at runtime.
export type Obs = "same" | "higher" | "lower";
export type HypStatus = "untested" | "open" | "supported" | "refuted";
export type Lv = "unit" | "swint" | "embedded" | "vehicle";
/** Fires on one bench run when every listed signal was probed in that run with one of the given observations. */
export type HypRule = { levels?: Lv[]; need: Record<string, Obs[]>; verdict: "supported" | "refuted"; why: string };
/** Why a test level cannot decide a hypothesis (data item 10): what is seen, what is not, why, and which level decides it. */
export type HoldReason = { seen: string; unseen: string; why: string; next: Lv[] };
/**
 * decideAt: levels where this hypothesis is decided under the scenario's fault (data item 11).
 * hold: one entry for every STEP04 level that ends in 판단 보류. Both are checked against the rules
 * and the bench model by tests/feedback-1112.test.mjs, so the guidance and the judging logic stay the same.
 */
export type Hypothesis = { id: string; label: string; truth: boolean; stage1?: string; rules: HypRule[]; decideAt?: Lv[]; decide?: string; hold?: Partial<Record<Lv, HoldReason>> };
export type ScenarioMeta = {
  domain: string; goal: string; trigger: string; injection: string; faultModel: string; normalSpec: string;
  fix: string; regression: string; status: "implemented" | "optional"; review: string;
  hypotheses: Hypothesis[];
};
const SW: Lv[] = ["unit", "swint"];

/** Cause-kind tag shown on every hypothesis card (player-facing grouping of the fault categories A-L; HW is only ever a refutable candidate). */
export type HypTag = "SW 로직" | "SW 설정" | "통신" | "센서" | "HW";
export const HYP_TAG: Record<string, HypTag> = {
  aps: "센서", vcu_sw: "SW 로직", vcu_hw: "HW", drive: "HW",
  fan_sw: "SW 로직", fan_path: "SW 로직", fan_motor: "SW 로직",
  blend_sw: "SW 로직", hyd_path: "SW 설정", caliper: "SW 로직",
  brake_sw: "SW 로직", pedal: "센서", vcu_sign: "SW 로직", inv_wire: "HW",
  bms_link: "통신", start_cond: "SW 로직", seq_timeout: "SW 설정", precharge_hw: "HW",
  req_calc: "SW 로직", fade_mismatch: "SW 설정", fric_io: "SW 설정", wheel_hw: "HW",
  lever_hw: "HW", gw_map: "통신", gear_fallback: "SW 설정", interlock: "SW 로직",
};

export const SCENARIO_META: Record<CaseId, ScenarioMeta> = {
  propulsion: {
    domain: "구동",
    goal: "입력 계측은 정상인데 제어기 출력이 다를 때, 하드웨어 없이 SW만 실행하는 시험으로 SW 계산 결함을 분리한다.",
    trigger: "추월 구간에서 가속 페달 전개(레이스 OVERTAKE_ZONE)",
    injection: "VCU 입력 처리 단계에 설계에 없는 보정 계수 ×0.45 (vehicleSim pedalScale 0.45 · simModel proc)",
    faultModel: "페달 60% → 처리값 27% → 토크 요청 92 Nm",
    normalSpec: "페달 0~100% → 토크 요청 0~340 Nm 선형, 60% → 204 Nm, 가용 토크 한계 260 Nm 이하",
    fix: "보정 계수 블록 제거 후 SW 배포",
    regression: "같은 SW 단위 시험(페달 60% 계단 입력) PASS + 영향 범위 신호",
    status: "implemented", review: "수치 일치 확인(60×0.45=27, 204×0.45≈92)",
    hypotheses: [
      { id: "aps", label: "가속 페달 센서·배선", truth: false, stage1: "도미노 역추적: 페달 센서 값 60%가 기준과 같았어요.", rules: [
        { levels: ["vehicle"], need: { aps: ["same"], can: ["lower"] }, verdict: "refuted", why: "페달 값은 같고 CAN 토크만 낮아요." },
      ] },
      { id: "vcu_sw", label: "VCU 페달 처리 SW(계산·보정값)", truth: true, rules: [
        { levels: SW, need: { proc: ["lower"] }, verdict: "supported", why: "입력 회로 없이 SW만 실행해도 처리값이 낮아요. SW 계산에서 생긴 차이예요." },
        { levels: SW, need: { proc: ["same"] }, verdict: "refuted", why: "SW만 실행하면 처리값이 기준과 같아요." },
      ], decideAt: ["unit"], decide: "SW 단위 시험: 페달 60% 입력에서 페달 처리값이 27%(기준 60%)로 낮으면 지지",
      hold: {
        embedded: { seen: "APS 핀 전압 정상 · CAN 토크 명령 낮음", unseen: "VCU 내부 페달 처리값", why: "입력 회로와 SW가 함께 실행돼 둘 중 어디서 값이 줄었는지 나눌 수 없어요.", next: ["unit"] },
        vehicle: { seen: "페달(로거) 정상 · CAN 토크 낮음", unseen: "VCU 내부 페달 처리값", why: "입력 회로와 SW가 함께 실행돼 둘 중 어디서 값이 줄었는지 나눌 수 없어요.", next: ["unit"] },
      } },
      { id: "vcu_hw", label: "VCU 입력 회로·신호 변환(HW)", truth: false, rules: [
        { levels: SW, need: { proc: ["lower"] }, verdict: "refuted", why: "입력 회로가 없는 SW 시험에서도 같은 차이가 나요. 입력 회로 탓이 아니에요." },
      ], decideAt: ["unit"], decide: "SW 단위 시험: 입력 회로 없이도 페달 처리값이 낮으면 반박",
      hold: {
        embedded: { seen: "APS 핀 전압 정상 · CAN 토크 명령 낮음", unseen: "VCU 내부 페달 처리값", why: "입력 회로와 SW가 함께 실행돼 둘 중 어디서 값이 줄었는지 나눌 수 없어요.", next: ["unit"] },
        vehicle: { seen: "페달(로거) 정상 · CAN 토크 낮음", unseen: "VCU 내부 페달 처리값", why: "입력 회로와 SW가 함께 실행돼 둘 중 어디서 값이 줄었는지 나눌 수 없어요.", next: ["unit"] },
      } },
      { id: "drive", label: "인버터·구동 모터", truth: false, stage1: "도미노 역추적: VCU가 보낸 CAN 토크 명령부터 이미 낮았어요.", rules: [] },
    ],
  },
  thermal: {
    domain: "열관리",
    goal: "팬 요청은 정상인데 PWM 출력이 없을 때, SW 계산값과 I/O 어댑터 출력값을 비교해 실행 순서 오류를 분리한다.",
    trigger: "장거리 고속(연속 고부하) 구간에서 냉각수 온도 상승(레이스 CLIMB_ZONE)",
    injection: "Thermal ECU 출력 어댑터 SW가 주기 작업에서 누락되어 팬 요청을 PWM 레지스터에 쓰지 않음 (fanPwmOutputScale 0 · simModel pwmOut=0)",
    faultModel: "팬 요청 100% · PWM 출력 0% · 회전 0 rpm → 냉각수·모터 온도 상승 → 출력 제한",
    normalSpec: "냉각수 65°C 이상에서 팬 켜짐, 60°C 이하에서 꺼짐(히스테리시스), 켜지면 목표 1850 rpm으로 PI 제어",
    fix: "출력 어댑터 SW의 실행 순서 복원 후 배포",
    regression: "같은 임베디드 SW·I/O 시험 PASS + 영향 범위 신호(온도·출력 허용)",
    status: "implemented", review: "팬 요청은 정상·PWM 출력부터 FAIL인 SW I/O 경계 확인",
    hypotheses: [
      { id: "fan_sw", label: "Thermal ECU 출력 어댑터 SW 실행 순서", truth: true, rules: [
        { levels: ["embedded", "vehicle"], need: { pwm: ["lower"] }, verdict: "supported", why: "팬 요청 계산 뒤 I/O 어댑터 출력부터 0%예요. SW 실행 순서에서 처음 갈라져요." },
        { levels: ["vehicle"], need: { fpwm: ["lower"] }, verdict: "supported", why: "팬 요청은 정상인데 커넥터 PWM부터 출력되지 않아요." },
      ], decideAt: ["embedded", "vehicle"], decide: "통합 SW·제어기 I/O 시험: 팬 요청 100%인데 PWM 출력 어댑터 값이 0%면 지지",
      hold: {
        unit: { seen: "냉각수 온도 입력 · 팬 요청 · PI 출력 PWM 비율 모두 정상", unseen: "PWM 출력 어댑터 값(I/O 단계)", why: "SW 단위 시험은 출력 어댑터가 실행되기 전 계산값까지만 보여 줘서 실행 순서 누락을 확인할 수 없어요.", next: ["embedded", "vehicle"] },
      } },
      { id: "fan_path", label: "팬 켜기 상태 전이 SW", truth: false, rules: [
        { levels: SW, need: { duty: ["same"] }, verdict: "refuted", why: "히스테리시스와 PWM 요청 계산은 기준과 같아요." },
      ], decideAt: ["unit"], decide: "SW 단위 시험: 65°C 이상에서 팬 요청·PWM 비율 계산이 기준과 같으면 반박",
      hold: {
        embedded: { seen: "온도 센서 핀 전압 정상 · PWM 출력 어댑터 값 0%", unseen: "히스테리시스 팬 요청 · PI 출력 계산값", why: "출력 0%는 상태 전이 오류와 출력 단계 오류 모두로 설명돼, 계산 단계가 정상인지 알 수 없어요.", next: ["unit"] },
        vehicle: { seen: "팬 커넥터 PWM 0% · 팬 회전 0", unseen: "히스테리시스 팬 요청 · PI 출력 계산값", why: "출력 0%는 상태 전이 오류와 출력 단계 오류 모두로 설명돼, 계산 단계가 정상인지 알 수 없어요.", next: ["unit"] },
      } },
      { id: "fan_motor", label: "팬 회전 피드백 처리 SW", truth: false, rules: [
        { levels: ["embedded", "vehicle"], need: { pwm: ["lower"] }, verdict: "refuted", why: "회전 피드백을 읽기 전 PWM 출력부터 없어요." },
        { levels: ["vehicle"], need: { fpwm: ["lower"] }, verdict: "refuted", why: "피드백 처리 문제가 아니라 팬으로 나가는 PWM부터 낮아요." },
      ], decideAt: ["embedded", "vehicle"], decide: "통합 SW·제어기 I/O 시험: 회전 피드백을 읽기 전 PWM 출력부터 0%면 반박",
      hold: {
        unit: { seen: "냉각수 온도 입력 · 팬 요청 · PI 출력 PWM 비율 모두 정상", unseen: "PWM 출력값 · 읽어 온 팬 회전값", why: "피드백 처리는 실제 출력과 회전값이 있어야 동작하는데 SW 단위 시험에는 그 경로가 없어요.", next: ["embedded", "vehicle"] },
      } },
    ],
  },
  brake: {
    domain: "제동",
    goal: "내부 압력 계산값은 정상인데 출력값이 낮을 때, SW I/O 경계의 스케일링 오류를 다른 SW 가설과 구분한다.",
    trigger: "선택 사건: 정차 구간 제동(페달 55%)",
    injection: "Brake ECU I/O 어댑터 SW가 압력 계산값에 변환 계수 0.19를 중복 적용 (brakeCommandScale 0.19 · simModel cmdOut)",
    faultModel: "내부 압력 계산 42 bar → 전송 명령 약 8 bar → 캘리퍼 압력 약 8 bar → 감속 부족",
    normalSpec: "페달 55% → 감속 요구 3.2 m/s², 회생 가용량을 뺀 나머지를 마찰 압력으로(1 m/s² 당 20 bar)",
    fix: "I/O 어댑터의 중복 스케일링 제거 후 SW 배포",
    regression: "같은 임베디드 SW·I/O 시험 PASS + 영향 범위 신호",
    status: "optional", review: "선택 사건 · 레이스 고장 트리거 미구현(퍼즐·검증만 진행)",
    hypotheses: [
      { id: "blend_sw", label: "Brake ECU 회생·마찰 배분 SW", truth: false, stage1: "도미노 역추적: 내부 압력 계산값은 42 bar로 기준과 같았어요.", rules: [
        { levels: SW, need: { cmd: ["same"] }, verdict: "refuted", why: "SW 시험에서 압력 명령이 요구사항과 같아요." },
      ], decideAt: ["unit"], decide: "SW 단위 시험: 페달 55% 입력에서 마찰 압력 명령이 42 bar로 기준과 같으면 반박",
      hold: {
        embedded: { seen: "압력 계산값 42 bar 정상 · I/O 어댑터 출력값 낮음", unseen: "회생 가용량 · 마찰 몫(배분 계산 과정)", why: "배분 계산의 입력과 중간값을 관찰하지 않아요. 배분 계산 자체는 SW 단위 시험에서 직접 확인해요.", next: ["unit"] },
        vehicle: { seen: "제동 페달(로거) 정상 · 전송된 압력 명령 낮음", unseen: "압력 계산값 · 회생 가용량 · 마찰 몫", why: "차량에서는 전송값만 보여 배분 계산이 틀렸는지, 계산 뒤 출력 단계에서 줄었는지 나눌 수 없어요.", next: ["unit"] },
      } },
      { id: "hyd_path", label: "압력 명령 I/O 어댑터 SW 스케일링", truth: true, rules: [
        { levels: ["embedded", "vehicle"], need: { cmd: ["same"], cmdOut: ["lower"] }, verdict: "supported", why: "내부 계산값은 정상인데 I/O 어댑터가 내보낸 값부터 낮아요." },
      ], decideAt: ["embedded"], decide: "통합 SW·제어기 I/O 시험: 압력 계산값 42 bar · I/O 어댑터 출력값 약 8 bar면 지지",
      hold: {
        unit: { seen: "제동 요구 · 마찰 압력 명령 42 bar 정상", unseen: "I/O 어댑터 출력값", why: "SW 단위 시험에는 I/O 어댑터가 포함되지 않아 출력 단계 스케일링을 볼 수 없어요.", next: ["embedded"] },
        vehicle: { seen: "전송된 압력 명령 · 캘리퍼 압력 낮음", unseen: "압력 계산값(I/O 어댑터 입력)", why: "어댑터에 들어간 값을 함께 볼 수 없어 계산 단계와 출력 단계 중 어디서 줄었는지 나눌 수 없어요.", next: ["embedded"] },
      } },
      { id: "caliper", label: "압력 피드백 데이터 처리 SW", truth: false, rules: [
        { levels: ["embedded", "vehicle"], need: { cmdOut: ["lower"] }, verdict: "refuted", why: "피드백을 읽기 전에 전송 명령부터 낮아요." },
      ], decideAt: ["embedded", "vehicle"], decide: "통합 SW·제어기 I/O 시험: 피드백을 읽기 전 I/O 어댑터 출력값부터 낮으면 반박",
      hold: {
        unit: { seen: "제동 요구 · 마찰 압력 명령 42 bar 정상", unseen: "I/O 어댑터 출력값 · 읽어 온 라인 압력", why: "SW 단위 시험에는 압력 피드백 경로가 없어 피드백 처리를 확인할 수 없어요.", next: ["embedded", "vehicle"] },
      } },
    ],
  },
  regen: {
    domain: "구동·회생",
    goal: "크기는 맞는데 부호(방향)가 틀린 값을, 입력과 변환 출력을 나란히 보는 SW 단위 시험으로 찾는다. 진단 모니터가 있어도 작동 범위 밖이면 못 잡는다는 점도 함께 본다.",
    trigger: "가속 페달을 놓는 순간(코스팅 회생 조건: 속도 40 km/h 이상, 페달 0%)",
    injection: "VCU 토크 지령 변환 SWC에서 회생 요청의 부호 반영 블록 누락(크기만 사용) (faultSchedule release · simModel sign)",
    faultModel: "회생 요청 −40 Nm → 토크 지령 +40 Nm → 모터 토크 +40 Nm → 가감속 +0.5 m/s²(기준 −0.5)",
    normalSpec: "페달 0%·40 km/h 이상에서 토크 지령은 회생 요청과 같은 방향(−40 Nm), 80 Nm당 1 m/s²(평지 −0.5 m/s²)",
    fix: "회생 요청의 부호 규약을 인터페이스 정의대로 반영하고 부호 단위 시험 추가",
    regression: "같은 SW 단위 시험(회생 요청 −40 Nm 유지) PASS + 영향 범위 신호",
    status: "optional", review: "수치 일치 확인(40 Nm ÷ 80 = 0.5 m/s²). 진단 미탐: 토크 방향 모니터는 100 Nm 이상에서만 판정",
    hypotheses: [
      { id: "brake_sw", label: "Brake ECU 회생 요청 계산 SW", truth: false, stage1: "도미노 역추적: 회생 요청이 −40 Nm로 기준과 같았어요.", rules: [
        { levels: SW, need: { req: ["same"] }, verdict: "refuted", why: "회생 요청이 기준과 같아요." },
      ] },
      { id: "pedal", label: "가속 페달 입력", truth: false, stage1: "도미노 역추적: 가속 페달 값이 0%로 기준과 같았어요.", rules: [
        { levels: ["vehicle"], need: { ped: ["same"] }, verdict: "refuted", why: "페달 값이 기준과 같아요." },
      ] },
      { id: "vcu_sign", label: "VCU 토크 지령 변환 SW(회생 부호 반영)", truth: true, rules: [
        { levels: SW, need: { req: ["same"], vcuOut: ["higher"] }, verdict: "supported", why: "입력 회생 요청은 같은데 변환 출력의 부호부터 달라요(−40 → +40)." },
      ], decideAt: ["unit"], decide: "SW 단위 시험: 회생 요청 −40 Nm를 넣었을 때 변환 출력이 +40 Nm면 지지",
      hold: {
        embedded: { seen: "변환 출력·CAN 토크 지령·모터 토크 모두 +40 Nm", unseen: "변환 SW에 들어간 회생 요청", why: "입력을 함께 볼 수 없어 변환 SW가 부호를 바꾼 것인지 앞에서 이미 양수로 왔는지 나눌 수 없어요.", next: ["unit"] },
        vehicle: { seen: "회생 요청 정상 · CAN 토크 지령·모터 토크·가감속 반대 방향", unseen: "VCU 변환 출력", why: "가속이 보이지만 변환 SW 내부 값을 볼 수 없어 위치는 판단할 수 없어요.", next: ["unit"] },
      } },
      { id: "inv_wire", label: "인버터·모터 상 배선 (HW)", truth: false, rules: [
        { levels: ["embedded"], need: { vcuOut: ["higher"] }, verdict: "refuted", why: "배선에 닿기 전, 지령 변환 출력부터 이미 반대 방향이에요." },
        { levels: ["vehicle"], need: { can: ["higher"] }, verdict: "refuted", why: "CAN 토크 지령부터 이미 반대 방향이라 인버터 이후 배선 문제가 아니에요." },
      ], decideAt: ["embedded", "vehicle"], decide: "통합 SW·제어기 I/O 시험: 인버터에 닿기 전 지령부터 +40 Nm면 반박",
      hold: {
        unit: { seen: "회생 요청 · 변환 출력(부호 반대)", unseen: "인버터 이후 토크와 배선", why: "SW 단위 시험에는 인버터와 모터 배선이 없어요.", next: ["embedded", "vehicle"] },
      } },
    ],
  },
  ready: {
    domain: "고전압 전원",
    goal: "시퀀스의 대기 시간이 실제 물리 응답(프리차지 충전 시간)보다 짧을 때, 같은 입력에서 SW 시퀀스와 프리차지 회로를 구분한다. 진단 코드가 있어도 원인은 시험으로 가른다.",
    trigger: "시동 전: 브레이크를 밟고 시동 버튼(R 키)을 누를 때(레이스 출발 직후 3회 실패 → 고장 컷신)",
    injection: "VCU 시동 시퀀스 SWC(PrechargeSeq)의 프리차지 대기 시간 설정값이 1500 ms 대신 500 ms (simModel ready · faultSchedule READY_FAULT)",
    faultModel: "프리차지 500 ms에 시퀀스 타임아웃 → 버스 345.9 V(95 % 미달 정상 진행 중) → 주 접촉기 명령 없음 → READY 없음 · 점검 표시등",
    normalSpec: "시동 요청 시 프리차지 접촉기를 닫고 버스 전압이 팩 전압(400 V)의 95 %(380 V) 이상이면 주 접촉기를 닫아 READY. 충전 τ=250 ms로 95 %는 약 750 ms, 대기 시간 1500 ms",
    fix: "프리차지 대기 시간을 1500 ms로 복원하고 시퀀스 타이밍 시험 추가",
    regression: "같은 임베디드 SW·I/O 시험(시동 요청, 프리차지 곡선 τ=250 ms) PASS + 영향 범위 신호",
    status: "optional", review: "수치 일치 확인(400×(1−e^(−t/250ms)): 500 ms 345.9 V, 750 ms 380.1 V, 1500 ms 399.0 V). 진단은 정탐이나 원인 미지정",
    hypotheses: [
      { id: "bms_link", label: "BMS 시동 허용 신호", truth: false, stage1: "도미노 역추적: BMS 시동 허용이 1로 기준과 같았어요.", rules: [
        { levels: ["swint"], need: { req: ["same"] }, verdict: "refuted", why: "시동 요청 입력이 기준과 같아요." },
      ] },
      { id: "start_cond", label: "VCU 시동 조건 판정(브레이크·기어·시동 버튼)", truth: false, stage1: "도미노 역추적: 시동 요청과 브레이크 입력이 기준대로 인식됐어요.", rules: [
        { levels: ["vehicle"], need: { req: ["same"] }, verdict: "refuted", why: "시동 요청 입력이 기준과 같아요." },
      ] },
      { id: "seq_timeout", label: "VCU 프리차지 시퀀스의 대기 시간 설정", truth: true, rules: [
        { levels: ["embedded"], need: { vbus: ["same"], tmo: ["lower"], seq: ["higher"] }, verdict: "supported", why: "버스 전압 곡선은 정상인데 시퀀스가 설정 500 ms에 먼저 실패해요(필요한 시간은 약 750 ms)." },
      ], decideAt: ["embedded"], decide: "통합 SW·제어기 I/O 시험: 버스 전압 곡선 정상 · 대기 시간 설정 500 ms · 시퀀스 실패를 함께 보면 지지",
      hold: {
        unit: { seen: "시동 요청 · 대기 시간 설정 500 ms · 시퀀스 실패", unseen: "HV 버스 전압 곡선", why: "SW 단위 시험은 전압 입력이 스텁이라 버스가 언제 95 %에 닿는지 알 수 없어서, 500 ms가 너무 짧은지 판단할 수 없어요.", next: ["embedded"] },
        swint: { seen: "시동 요청 · 시퀀스 실패 · 대기 시간 설정", unseen: "실제 충전 곡선", why: "PC에서 SW만 연결해서는 프리차지 회로 응답 시간을 볼 수 없어 설정이 짧은지 나눌 수 없어요.", next: ["embedded"] },
        vehicle: { seen: "버스 전압 곡선 정상 · 주 접촉기 명령 없음 · READY 없음", unseen: "시퀀스 상태 · 대기 시간 설정", why: "차량에서는 시퀀스 내부를 볼 수 없어 대기 시간 설정이 원인인지 다른 조건인지 나눌 수 없어요.", next: ["embedded"] },
      } },
      { id: "precharge_hw", label: "프리차지 저항·접촉기 (HW)", truth: false, rules: [
        { levels: ["embedded", "vehicle"], need: { vbus: ["same"] }, verdict: "refuted", why: "버스 전압이 정상 충전 곡선을 그려요. 저항·접촉기 응답은 정상이에요." },
      ], decideAt: ["embedded", "vehicle"], decide: "통합 SW·제어기 I/O 시험: 버스 전압이 정상 충전 곡선이면 반박",
      hold: {
        unit: { seen: "시동 요청 · 시퀀스 상태", unseen: "HV 버스 전압", why: "SW 단위 시험에는 프리차지 회로가 없어요.", next: ["embedded", "vehicle"] },
        swint: { seen: "시동 요청 · 시퀀스 상태 · 주 접촉기 명령", unseen: "HV 버스 전압", why: "PC 통합 시험에는 프리차지 회로가 없어요.", next: ["embedded", "vehicle"] },
      } },
    ],
  },
};

/** exercised = false: the input never used the faulty function (the normal model also leaves it idle), so no rule may fire. */
export type BenchRun = { level: Lv; fixed: boolean; obs: Record<string, Obs>; exercised?: boolean };
export const NOT_EXERCISED_WHY = "이 입력은 고장이 생기는 조건을 지나지 않아 정상 모델과 시험 대상이 같게 나와요. 이 시험으로는 가를 수 없어요.";
/** Status of every hypothesis after the given bench runs (later runs override earlier ones). */
export function hypothesisStatus(caseId: CaseId, runs: BenchRun[]) {
  return SCENARIO_META[caseId].hypotheses.map(h => {
    let status: HypStatus = h.stage1 ? "refuted" : "untested", why = h.stage1 ?? "";
    for (const run of runs) {
      if (run.fixed) continue;
      if (run.exercised === false) { if (status === "untested") { status = "open"; why = NOT_EXERCISED_WHY; } continue; }
      const hit = h.rules.find(rule => (!rule.levels || rule.levels.includes(run.level)) && Object.entries(rule.need).every(([sig, ok]) => run.obs[sig] !== undefined && ok.includes(run.obs[sig])));
      if (hit) { status = hit.verdict; why = hit.why; }
      else if (status === "untested") { status = "open"; why = "이 시험으로는 판단할 수 없어요. 다른 레벨이나 관측점이 필요해요."; }
    }
    return { ...h, status, why };
  });
}
export const HYP_LABEL: Record<HypStatus, string> = { untested: "아직 안 봄", open: "아직 몰라요", supported: "원인으로 보여요", refuted: "원인이 아니에요" };

/** What ONE bench run allows the player to conclude about each hypothesis (the answer key for the judgment note). */
export function judgeRun(caseId: CaseId, run: BenchRun) {
  return SCENARIO_META[caseId].hypotheses.map(h => {
    const hit = run.fixed || run.exercised === false ? undefined : h.rules.find(rule => (!rule.levels || rule.levels.includes(run.level)) && Object.entries(rule.need).every(([sig, ok]) => run.obs[sig] !== undefined && ok.includes(run.obs[sig])));
    return { id: h.id, verdict: (hit?.verdict ?? "open") as "supported" | "refuted" | "open", why: hit?.why ?? (run.exercised === false ? NOT_EXERCISED_WHY : ""), need: hit ? Object.keys(hit.need) : [] };
  });
}
