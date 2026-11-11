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
export const HYP_LABEL: Record<HypStatus, string> = { untested: "미시험", open: "추가 증거 필요", supported: "지지됨", refuted: "반박됨" };

/** What ONE bench run allows the player to conclude about each hypothesis (the answer key for the judgment note). */
export function judgeRun(caseId: CaseId, run: BenchRun) {
  return SCENARIO_META[caseId].hypotheses.map(h => {
    const hit = run.fixed || run.exercised === false ? undefined : h.rules.find(rule => (!rule.levels || rule.levels.includes(run.level)) && Object.entries(rule.need).every(([sig, ok]) => run.obs[sig] !== undefined && ok.includes(run.obs[sig])));
    return { id: h.id, verdict: (hit?.verdict ?? "open") as "supported" | "refuted" | "open", why: hit?.why ?? (run.exercised === false ? NOT_EXERCISED_WHY : ""), need: hit ? Object.keys(hit.need) : [] };
  });
}
