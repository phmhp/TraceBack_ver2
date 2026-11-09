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
    chapter: "CASE 01 · ACCELERATION RESPONSE",
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
    chapter: "CASE 02 · POWER DOWN",
    symptom: "고속으로 오래 달리자 파워다운 표시등이 켜지고 가속이 약해졌습니다.",
    root: "fan_actuator",
    repair: "냉각 팬 액추에이터 응답 복원",
    evidence: [
      { id: "motor_temp", label: "온도 경고와 가속력 저하가 함께 발생함", value: "구동계 냉각수 온도 78.4°C", kind: "주행 현상" },
      { id: "thermal_protection", label: "구동 토크 제한 상태가 기록됨", value: "Derate flag ON", kind: "상태 계측" },
      { id: "fan_command", label: "Fan PWM 명령이 100%로 기록됨", value: "ECU 출력 명령 100%", kind: "제어 명령" },
      { id: "fan_actual", label: "팬 회전 피드백이 0 RPM으로 측정됨", value: "명령 100% · 실제 0 RPM", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "sensor", label: "온도 센서가 틀린 값을 보냈다", desc: "센서 측정 오류 가능성" },
      { id: "software_command", label: "팬을 켜는 제어 명령이 없었다", desc: "제어 로직 오류 가능성" },
      { id: "fan_actuator", label: "명령은 왔지만 냉각 팬이 고착됐다", desc: "출력 액추에이터 응답 불량" },
    ],
  },
  brake: {
    title: "제동 페달 입력 대비 감속 부족",
    chapter: "OPTIONAL · BRAKE RESPONSE",
    symptom: "브레이크 페달을 밟았지만 회생제동만 작동하고 마찰제동 반응이 약합니다.",
    root: "brake_actuator", // id kept for saves; the fault is pressure delivery in the hydraulic path (vehicleSim brakePressureGain 0.19)
    repair: "유압 경로 압력 전달 복원",
    evidence: [
      { id: "brake_request", label: "페달 55% 입력에도 감속이 부족함", value: "정지거리 증가를 주행 중 관찰", kind: "주행 현상" },
      { id: "regen_request", label: "회생제동 명령이 22%로 기록됨", value: "인버터 회생 명령 정상", kind: "제어 명령" },
      { id: "brake_actual", label: "캘리퍼 압력이 기대값보다 낮게 측정됨", value: "명령 42 bar · 실제 8 bar (약 19%)", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "brake_actuator", label: "명령 압력이 유압 경로에서 캘리퍼까지 전달되지 않았다", desc: "유압 경로 압력 전달 불량" },
      { id: "regen_limit", label: "회생제동 한계 때문에 감속이 부족했다", desc: "배터리 수용 한계" },
      { id: "pedal", label: "브레이크 페달 센서가 틀렸다", desc: "입력 신호 오류" },
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
export type Hypothesis = { id: string; label: string; truth: boolean; stage1?: string; rules: HypRule[] };
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
      ] },
      { id: "vcu_hw", label: "VCU 입력 회로·신호 변환(HW)", truth: false, rules: [
        { levels: SW, need: { proc: ["lower"] }, verdict: "refuted", why: "입력 회로가 없는 SW 시험에서도 같은 차이가 나요. 입력 회로 탓이 아니에요." },
      ] },
      { id: "drive", label: "인버터·구동 모터", truth: false, stage1: "도미노 역추적: VCU가 보낸 CAN 토크 명령부터 이미 낮았어요.", rules: [] },
    ],
  },
  thermal: {
    domain: "열관리",
    goal: "SW 명령은 정상인데 부품이 반응하지 않을 때, 실부품을 연결한 시험에서 명령·전원 도착 여부와 실제 반응을 비교해 원인을 분리한다.",
    trigger: "장거리 고속(연속 고부하) 구간에서 냉각수 온도 상승(레이스 CLIMB_ZONE)",
    injection: "냉각 팬 모터가 PWM·전원을 받아도 회전하지 않음 (vehicleSim fanStuck · simModel rpm=0)",
    faultModel: "팬 명령 100% · 커넥터 전원 12 V · 회전 0 rpm → 냉각수·모터 온도 상승 → 출력 제한",
    normalSpec: "냉각수 65°C 이상에서 팬 켜짐, 60°C 이하에서 꺼짐(히스테리시스), 켜지면 목표 1850 rpm으로 PI 제어",
    fix: "냉각 팬 모터 교체",
    regression: "같은 시스템 통합 시험 PASS + 영향 범위 신호(온도·출력 허용)",
    status: "implemented", review: "SW 레벨 PASS·시스템 레벨 FAIL 일치 확인",
    hypotheses: [
      { id: "fan_sw", label: "Thermal ECU 팬 제어 SW", truth: false, stage1: "도미노 역추적: 팬 명령이 100%로 기준과 같았어요.", rules: [
        { levels: SW, need: { duty: ["same"] }, verdict: "refuted", why: "SW 시험에서 PWM 비율이 요구사항과 같아요." },
      ] },
      { id: "fan_path", label: "ECU 출력단·배선·전원", truth: false, rules: [
        { levels: ["vehicle"], need: { fpwm: ["same", "higher"], fv: ["same"] }, verdict: "refuted", why: "팬 커넥터까지 PWM 명령과 12 V 전원이 도착해요. PWM이 기준보다 높은 건 팬이 돌지 않아 제어기가 명령을 끝까지 올린 결과예요." },
        { levels: ["vehicle"], need: { fpwm: ["lower"] }, verdict: "supported", why: "팬 커넥터에 도착한 PWM이 낮아요." },
        { levels: ["vehicle"], need: { fv: ["lower"] }, verdict: "supported", why: "팬 커넥터 전원 전압이 낮아요." },
      ] },
      { id: "fan_motor", label: "냉각 팬 모터(고착)", truth: true, rules: [
        { levels: ["vehicle"], need: { rpm: ["lower"], fpwm: ["same", "higher"], fv: ["same"] }, verdict: "supported", why: "명령과 전원이 커넥터까지 왔는데 팬이 돌지 않아요." },
        { levels: ["vehicle"], need: { rpm: ["same"] }, verdict: "refuted", why: "팬 회전이 기준과 같아요." },
      ] },
    ],
  },
  brake: {
    domain: "제동",
    goal: "제어기 압력 명령은 정상인데 감속이 부족할 때, 실제 유압 경로의 압력을 측정해 유압 전달과 캘리퍼 기구를 구분한다.",
    trigger: "선택 사건: 정차 구간 제동(페달 55%)",
    injection: "유압 경로가 명령 압력의 19%만 전달 (vehicleSim brakePressureGain 0.19 · simModel line)",
    faultModel: "압력 명령 42 bar → 캘리퍼 입구 약 8 bar → 감속 부족",
    normalSpec: "페달 55% → 감속 요구 3.2 m/s², 회생 가용량을 뺀 나머지를 마찰 압력으로(1 m/s² 당 20 bar)",
    fix: "유압 경로(모듈·라인) 수리",
    regression: "같은 시스템 통합 시험 PASS + 영향 범위 신호",
    status: "optional", review: "선택 사건 · 레이스 고장 트리거 미구현(퍼즐·검증만 진행)",
    hypotheses: [
      { id: "blend_sw", label: "Brake ECU 회생·마찰 배분 SW", truth: false, stage1: "도미노 역추적: 압력 명령이 42 bar로 기준과 같았어요.", rules: [
        { levels: SW, need: { cmd: ["same"] }, verdict: "refuted", why: "SW 시험에서 압력 명령이 요구사항과 같아요." },
      ] },
      { id: "hyd_path", label: "유압 모듈·라인 압력 전달", truth: true, rules: [
        { levels: ["vehicle"], need: { cmd: ["same"], line: ["lower"] }, verdict: "supported", why: "명령은 같은데 캘리퍼 입구 압력이 낮아요. 유압 경로에서 압력이 빠져요." },
      ] },
      { id: "caliper", label: "캘리퍼 기구 고착", truth: false, rules: [
        { levels: ["vehicle"], need: { line: ["lower"] }, verdict: "refuted", why: "캘리퍼 고착이면 캘리퍼 입구 압력은 정상이어야 하는데, 입구 압력부터 낮아요." },
        { levels: ["vehicle"], need: { line: ["same"], dec: ["lower"] }, verdict: "supported", why: "압력은 도착했는데 감속이 부족해요." },
      ] },
    ],
  },
};

export type BenchRun = { level: Lv; fixed: boolean; obs: Record<string, Obs> };
/** Status of every hypothesis after the given bench runs (later runs override earlier ones). */
export function hypothesisStatus(caseId: CaseId, runs: BenchRun[]) {
  return SCENARIO_META[caseId].hypotheses.map(h => {
    let status: HypStatus = h.stage1 ? "refuted" : "untested", why = h.stage1 ?? "";
    for (const run of runs) {
      if (run.fixed) continue;
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
    const hit = run.fixed ? undefined : h.rules.find(rule => (!rule.levels || rule.levels.includes(run.level)) && Object.entries(rule.need).every(([sig, ok]) => run.obs[sig] !== undefined && ok.includes(run.obs[sig])));
    return { id: h.id, verdict: (hit?.verdict ?? "open") as "supported" | "refuted" | "open", why: hit?.why ?? "", need: hit ? Object.keys(hit.need) : [] };
  });
}
