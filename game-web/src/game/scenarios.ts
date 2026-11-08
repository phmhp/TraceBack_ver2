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
    title: "오래 달리자 힘이 빠지고 경고등이 켜졌다",
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
    title: "브레이크를 밟아도 감속이 부족하다",
    chapter: "OPTIONAL · BRAKE RESPONSE",
    symptom: "브레이크 페달을 밟았지만 회생제동만 작동하고 마찰제동 반응이 약합니다.",
    root: "brake_actuator",
    repair: "마찰제동 액추에이터 응답 복원",
    evidence: [
      { id: "brake_request", label: "페달 55% 입력에도 감속이 부족함", value: "정지거리 증가를 주행 중 관찰", kind: "주행 현상" },
      { id: "regen_request", label: "회생제동 명령이 22%로 기록됨", value: "인버터 회생 명령 정상", kind: "제어 명령" },
      { id: "brake_actual", label: "캘리퍼 압력이 기대값보다 낮게 측정됨", value: "마찰 제동 응답 8%", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "brake_actuator", label: "브레이크 캘리퍼가 제대로 움직이지 않았다", desc: "마찰제동 기구 고착" },
      { id: "regen_limit", label: "회생제동 한계 때문에 감속이 부족했다", desc: "배터리 수용 한계" },
      { id: "pedal", label: "브레이크 페달 센서가 틀렸다", desc: "입력 신호 오류" },
    ],
  },
};
