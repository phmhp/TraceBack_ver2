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
    title: "밟아도 차가 제대로 나가지 않는다",
    chapter: "CASE 01 · ACCELERATION RESPONSE",
    symptom: "가속 페달을 절반 이상 밟았지만 차가 힘없이 천천히 가속합니다.",
    root: "gateway",
    repair: "페달 신호 변환 비율을 정상 값으로 복원",
    evidence: [
      { id: "pedal_raw", label: "운전자가 페달을 깊게 밟음", value: "페달 입력 60%", kind: "OBSERVATION" },
      { id: "pedal_processed", label: "차량은 약한 가속으로 해석함", value: "해석된 입력 27%", kind: "SW SIGNAL" },
      { id: "torque_cmd", label: "모터에 작은 힘만 요청됨", value: "요청 토크 92 Nm", kind: "SW COMMAND" },
      { id: "motor_actual", label: "모터는 받은 명령대로 동작함", value: "실제 토크 91 Nm", kind: "HW RESPONSE" },
    ],
    hypotheses: [
      { id: "gateway", label: "페달 신호를 잘못 줄여서 전달했다", desc: "입력 변환 비율 설정 오류" },
      { id: "bms", label: "배터리가 출력을 제한했다", desc: "배터리 보호 개입 가능성" },
      { id: "motor", label: "구동 모터가 힘을 내지 못했다", desc: "모터 출력 저하 가능성" },
    ],
  },
  thermal: {
    title: "온도는 오르는데 냉각 팬이 돌지 않는다",
    chapter: "CASE 02 · COOLING RESPONSE",
    symptom: "모터 온도 경고가 켜지고 출력이 제한됐지만 냉각 팬 소리가 들리지 않습니다.",
    root: "fan_actuator",
    repair: "냉각 팬 액추에이터 응답 복원",
    evidence: [
      { id: "motor_temp", label: "모터 온도가 빠르게 상승함", value: "78.4°C", kind: "OBSERVATION" },
      { id: "thermal_protection", label: "차량이 스스로 출력을 줄임", value: "보호 모드 작동", kind: "OBSERVATION" },
      { id: "fan_command", label: "제어기는 팬을 최대로 돌리라고 지시함", value: "팬 명령 100%", kind: "SW COMMAND" },
      { id: "fan_actual", label: "실제 팬은 전혀 회전하지 않음", value: "실제 속도 0 RPM", kind: "HW RESPONSE" },
    ],
    hypotheses: [
      { id: "sensor", label: "온도 센서가 틀린 값을 보냈다", desc: "센서 측정 오류 가능성" },
      { id: "software_command", label: "팬을 켜는 제어 명령이 없었다", desc: "제어 로직 오류 가능성" },
      { id: "fan_actuator", label: "명령은 왔지만 냉각 팬이 고착됐다", desc: "출력 액추에이터 응답 불량" },
    ],
  },
  brake: {
    title: "브레이크를 밟아도 감속이 부족하다",
    chapter: "OPTIONAL · BRAKE RESPONSE",
    symptom: "브레이크 페달을 밟았지만 회생제동만 작동하고 마찰제동 반응이 약합니다.",
    root: "brake_actuator",
    repair: "마찰제동 액추에이터 응답 복원",
    evidence: [
      { id: "brake_request", label: "운전자가 강하게 제동을 요청함", value: "페달 입력 55%", kind: "OBSERVATION" },
      { id: "regen_request", label: "모터 회생제동은 정상 작동함", value: "회생 제동 22%", kind: "SW COMMAND" },
      { id: "brake_actual", label: "캘리퍼의 실제 제동력이 부족함", value: "마찰 제동 8%", kind: "HW RESPONSE" },
    ],
    hypotheses: [
      { id: "brake_actuator", label: "브레이크 캘리퍼가 제대로 움직이지 않았다", desc: "마찰제동 기구 고착" },
      { id: "regen_limit", label: "회생제동 한계 때문에 감속이 부족했다", desc: "배터리 수용 한계" },
      { id: "pedal", label: "브레이크 페달 센서가 틀렸다", desc: "입력 신호 오류" },
    ],
  },
};
