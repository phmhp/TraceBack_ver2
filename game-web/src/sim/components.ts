// Component, port and connection registry.
// Educational model built on common EV terminology (no OEM-specific names or logic).
// Every part is "educational_simplified" until a licensed 3D asset is recorded
// in docs/ASSET_LICENSES.md; switch modelFidelity to "sourced" at that point.
import type { ComponentDef, Connection, EcuDef, FlowType, Port, PortDirection } from "./types.ts";

const p = (id: string, direction: PortDirection, flow: FlowType, unit: string, signal?: string): Port =>
  ({ id, direction, flow, unit, ...(signal ? { signal } : {}) });

const part = (def: Omit<ComponentDef, "modelAssetId" | "modelFidelity"> & Partial<Pick<ComponentDef, "modelAssetId" | "modelFidelity">>): ComponentDef => ({
  modelAssetId: `asset.${def.id}`,
  modelFidelity: "educational_simplified",
  ...def,
});

export const COMPONENTS: ComponentDef[] = [
  // ── Driver input devices (HMI, not actuators — doc Q2) ──
  part({ id: "accel_pedal", name: "Accelerator Pedal", nameKo: "가속 페달", domainId: "driver", categories: ["driver_input", "sensor"],
    ports: [p("app_out", "out", "analog", "%", "APP_Position")], relatedEcu: "vcu", animation: { type: "press", driver: "APP_Position" } }),
  part({ id: "brake_pedal", name: "Brake Pedal", nameKo: "브레이크 페달", domainId: "driver", categories: ["driver_input", "sensor"],
    ports: [p("bpp_out", "out", "analog", "%", "BPP_Position")], relatedEcu: "brake_ecu", animation: { type: "press", driver: "BPP_Position" } }),
  part({ id: "steering_wheel", name: "Steering Wheel & Angle Sensor", nameKo: "스티어링 휠·조향각 센서", domainId: "driver", categories: ["driver_input", "sensor"],
    ports: [p("angle_out", "out", "analog", "deg", "Steering_Angle"), p("column_out", "out", "mechanical_torque", "Nm", "Driver_Torque")],
    relatedEcu: "eps_ecu", animation: { type: "rotate", driver: "Steering_Angle" } }),
  part({ id: "gear_selector", name: "Gear Selector", nameKo: "기어 셀렉터", domainId: "driver", categories: ["driver_input"],
    ports: [p("gear_out", "out", "digital", "enum", "Gear_Request")], relatedEcu: "vcu" }),
  part({ id: "start_button", name: "Start/Stop Button", nameKo: "시동 버튼", domainId: "driver", categories: ["driver_input"],
    ports: [p("start_out", "out", "digital", "bool", "StartRequest")], relatedEcu: "vcu", animation: { type: "press", driver: "StartRequest" } }),

  // ── Controllers (ECUs are abstract nodes — doc 10-2) ──
  part({ id: "vcu", name: "Vehicle Control Unit", nameKo: "VCU 차량 제어기", domainId: "drive", categories: ["controller"],
    ports: [
      p("app_in", "in", "analog", "%", "APP_Position"), p("bpp_in", "in", "analog", "%", "BPP_Position"),
      p("gear_in", "in", "digital", "enum", "Gear_Request"), p("start_in", "in", "digital", "bool", "StartRequest"),
      p("power_limit_in", "in", "can_message", "kW", "Discharge_Power_Limit"), p("derate_in", "in", "can_message", "%", "Thermal_Derate"),
      p("vehicle_speed_in", "in", "can_message", "km/h", "Vehicle_Speed"),
      p("torque_req_out", "out", "can_message", "Nm", "Torque_Request"), p("ready_out", "out", "can_message", "bool", "Vehicle_Ready"),
    ] }),
  part({ id: "mcu", name: "Motor Control Unit", nameKo: "MCU 모터 제어기", domainId: "drive", categories: ["controller"],
    ports: [p("torque_req_in", "in", "can_message", "Nm", "Torque_Request"), p("rotor_pos_in", "in", "analog", "deg", "Rotor_Position"),
      p("gate_cmd_out", "out", "digital", "%", "PWM_Duty")] }),
  part({ id: "bms", name: "Battery Management System", nameKo: "BMS 배터리 관리", domainId: "power", categories: ["controller"],
    ports: [p("ready_in", "in", "can_message", "bool", "Vehicle_Ready"), p("voltage_in", "in", "analog", "V", "Pack_Voltage"),
      p("contactor_cmd_out", "out", "digital", "bool", "Contactor_Close"), p("limit_out", "out", "can_message", "kW", "Discharge_Power_Limit")] }),
  part({ id: "thermal_ecu", name: "Thermal Management ECU", nameKo: "열관리 ECU", domainId: "thermal", categories: ["controller"],
    ports: [p("temp_in", "in", "analog", "°C", "Motor_Temperature"), p("fan_speed_in", "in", "digital", "rpm", "Fan_Speed"),
      p("fan_pwm_out", "out", "digital", "%", "Fan_PWM"), p("pump_cmd_out", "out", "digital", "%", "Pump_PWM"),
      p("derate_out", "out", "can_message", "%", "Thermal_Derate")] }),
  part({ id: "brake_ecu", name: "Brake Control ECU", nameKo: "제동 ECU", domainId: "brake", categories: ["controller"],
    ports: [p("bpp_in", "in", "analog", "%", "BPP_Position"), p("wheel_speed_in", "in", "digital", "rpm", "Wheel_Speed"),
      p("pressure_cmd_out", "out", "digital", "bar", "Pressure_Command"), p("vehicle_speed_out", "out", "can_message", "km/h", "Vehicle_Speed")] }),
  part({ id: "eps_ecu", name: "EPS ECU", nameKo: "EPS ECU", domainId: "steer", categories: ["controller"],
    ports: [p("angle_in", "in", "analog", "deg", "Steering_Angle"), p("assist_cmd_out", "out", "digital", "A", "Assist_Current")] }),

  // ── Sensors ──
  part({ id: "wheel_speed_sensor", name: "Wheel Speed Sensor", nameKo: "휠 속도 센서", domainId: "brake", categories: ["sensor"],
    ports: [p("rotation_in", "in", "rotational_speed", "rpm"), p("signal_out", "out", "digital", "rpm", "Wheel_Speed")], relatedEcu: "brake_ecu" }),
  part({ id: "rotor_position_sensor", name: "Motor Position Sensor (Resolver)", nameKo: "모터 위치 센서(리졸버)", domainId: "drive", categories: ["sensor"],
    ports: [p("rotation_in", "in", "rotational_speed", "rpm"), p("angle_out", "out", "analog", "deg", "Rotor_Position")], relatedEcu: "mcu" }),
  part({ id: "motor_temp_sensor", name: "Motor Temperature Sensor (NTC)", nameKo: "모터 온도 센서(NTC)", domainId: "thermal", categories: ["sensor"],
    ports: [p("heat_in", "in", "thermal", "°C"), p("temp_out", "out", "analog", "°C", "Motor_Temperature")], relatedEcu: "thermal_ecu" }),

  // ── Energy & power conversion ──
  part({ id: "hv_battery", name: "HV Battery Pack", nameKo: "고전압 배터리 팩", domainId: "power", categories: ["energy"],
    ports: [p("dc_out", "out", "electrical_power", "V"), p("voltage_sense_out", "out", "analog", "V", "Pack_Voltage")], relatedEcu: "bms" }),
  part({ id: "main_contactor", name: "Main Contactor & Pre-charge", nameKo: "메인 접촉기·프리차지", domainId: "power", categories: ["actuator"],
    ports: [p("cmd_in", "in", "digital", "bool", "Contactor_Close"), p("hv_in", "in", "electrical_power", "V"), p("hv_out", "out", "electrical_power", "V")], relatedEcu: "bms" }),
  part({ id: "inverter", name: "Traction Inverter", nameKo: "구동 인버터", domainId: "drive", categories: ["power_conversion"],
    ports: [p("gate_in", "in", "digital", "%", "PWM_Duty"), p("dc_in", "in", "electrical_power", "V"), p("ac_out", "out", "electrical_power", "A")], relatedEcu: "mcu" }),

  // ── Drivetrain ──
  part({ id: "traction_motor", name: "Traction Motor (PMSM)", nameKo: "구동 모터(PMSM)", domainId: "drive", categories: ["actuator", "power_conversion"],
    ports: [p("ac_in", "in", "electrical_power", "A"), p("shaft_out", "out", "mechanical_torque", "Nm"),
      p("rotor_speed_out", "out", "rotational_speed", "rpm"), p("heat_out", "out", "thermal", "°C")],
    relatedEcu: "mcu", animation: { type: "spin", driver: "traction_motor.rotor_speed_out" } }),
  part({ id: "reduction_gear", name: "Reduction Gear", nameKo: "감속기", domainId: "drive", categories: ["passive_mechanical"],
    ports: [p("in", "in", "mechanical_torque", "Nm"), p("out", "out", "mechanical_torque", "Nm")] }),
  part({ id: "differential", name: "Differential", nameKo: "차동기어", domainId: "drive", categories: ["passive_mechanical"],
    ports: [p("in", "in", "mechanical_torque", "Nm"), p("left_out", "out", "mechanical_torque", "Nm")] }),
  part({ id: "drive_shaft", name: "Drive Shaft", nameKo: "드라이브 샤프트", domainId: "drive", categories: ["passive_mechanical"],
    ports: [p("in", "in", "mechanical_torque", "Nm"), p("out", "out", "mechanical_torque", "Nm")] }),
  part({ id: "wheel", name: "Wheel & Hub (front left)", nameKo: "휠·허브(전륜 좌)", domainId: "drive", categories: ["passive_mechanical"],
    ports: [p("drive_torque_in", "in", "mechanical_torque", "Nm"), p("brake_torque_in", "in", "mechanical_torque", "Nm"),
      p("steer_force_in", "in", "mechanical_torque", "N"), p("rotation_out", "out", "rotational_speed", "rpm")],
    animation: { type: "spin", driver: "wheel.rotation_out" } }),

  // ── Brake ──
  part({ id: "hydraulic_modulator", name: "Hydraulic Modulator", nameKo: "유압 모듈레이터", domainId: "brake", categories: ["actuator"],
    ports: [p("cmd_in", "in", "digital", "bar", "Pressure_Command"), p("pressure_out", "out", "hydraulic_pressure", "bar")], relatedEcu: "brake_ecu" }),
  part({ id: "brake_caliper", name: "Brake Caliper, Pad & Disc", nameKo: "캘리퍼·패드·디스크", domainId: "brake", categories: ["actuator", "passive_mechanical"],
    ports: [p("pressure_in", "in", "hydraulic_pressure", "bar"), p("brake_torque_out", "out", "mechanical_torque", "Nm")] }),

  // ── Thermal ──
  part({ id: "cooling_fan", name: "Radiator Cooling Fan", nameKo: "라디에이터 냉각 팬", domainId: "thermal", categories: ["actuator"],
    ports: [p("pwm_in", "in", "digital", "%", "Fan_PWM"), p("speed_out", "out", "digital", "rpm", "Fan_Speed")],
    relatedEcu: "thermal_ecu", animation: { type: "spin", driver: "Fan_Speed" } }),
  part({ id: "cooling_pump", name: "Electric Coolant Pump", nameKo: "전동 냉각수 펌프", domainId: "thermal", categories: ["actuator"],
    ports: [p("cmd_in", "in", "digital", "%", "Pump_PWM")], relatedEcu: "thermal_ecu" }),

  // ── Steering ──
  part({ id: "eps_motor", name: "EPS Assist Motor", nameKo: "EPS 보조 모터", domainId: "steer", categories: ["actuator"],
    ports: [p("cmd_in", "in", "digital", "A", "Assist_Current"), p("assist_out", "out", "mechanical_torque", "Nm")], relatedEcu: "eps_ecu" }),
  part({ id: "steering_rack", name: "Steering Rack & Tie Rod", nameKo: "스티어링 랙·타이로드", domainId: "steer", categories: ["passive_mechanical"],
    ports: [p("pinion_in", "in", "mechanical_torque", "Nm"), p("assist_in", "in", "mechanical_torque", "Nm"), p("tie_rod_out", "out", "mechanical_torque", "N")] }),
];

const c = (id: string, from: Connection["from"], to: Connection["to"], flow: FlowType, feedback = false): Connection =>
  ({ id, from, to, flow, ...(feedback ? { feedback } : {}) });

export const CONNECTIONS: Connection[] = [
  // Driver inputs → controllers
  c("drv.app", "accel_pedal.app_out", "vcu.app_in", "analog"),
  c("drv.bpp_vcu", "brake_pedal.bpp_out", "vcu.bpp_in", "analog"),
  c("drv.bpp_brake", "brake_pedal.bpp_out", "brake_ecu.bpp_in", "analog"),
  c("drv.gear", "gear_selector.gear_out", "vcu.gear_in", "digital"),
  c("drv.start", "start_button.start_out", "vcu.start_in", "digital"),
  c("drv.steer_angle", "steering_wheel.angle_out", "eps_ecu.angle_in", "analog"),
  // Power-up
  c("pwr.ready", "vcu.ready_out", "bms.ready_in", "can_message"),
  c("pwr.contactor_cmd", "bms.contactor_cmd_out", "main_contactor.cmd_in", "digital"),
  c("pwr.hv_pack", "hv_battery.dc_out", "main_contactor.hv_in", "electrical_power"),
  c("pwr.hv_bus", "main_contactor.hv_out", "inverter.dc_in", "electrical_power"),
  c("pwr.limit", "bms.limit_out", "vcu.power_limit_in", "can_message"),
  // Propulsion: VCU → MCU → Inverter → Motor → Gear → Shaft → Wheel (doc 8-3)
  c("prop.torque_req", "vcu.torque_req_out", "mcu.torque_req_in", "can_message"),
  c("prop.gate", "mcu.gate_cmd_out", "inverter.gate_in", "digital"),
  c("prop.phase", "inverter.ac_out", "traction_motor.ac_in", "electrical_power"),
  c("prop.motor_shaft", "traction_motor.shaft_out", "reduction_gear.in", "mechanical_torque"),
  c("prop.gear_out", "reduction_gear.out", "differential.in", "mechanical_torque"),
  c("prop.diff_out", "differential.left_out", "drive_shaft.in", "mechanical_torque"),
  c("prop.shaft_wheel", "drive_shaft.out", "wheel.drive_torque_in", "mechanical_torque"),
  // Feedback (doc 8-3)
  c("fb.wheel_rotation", "wheel.rotation_out", "wheel_speed_sensor.rotation_in", "rotational_speed", true),
  c("fb.wheel_speed", "wheel_speed_sensor.signal_out", "brake_ecu.wheel_speed_in", "digital", true),
  c("fb.vehicle_speed", "brake_ecu.vehicle_speed_out", "vcu.vehicle_speed_in", "can_message", true),
  c("fb.rotor_rotation", "traction_motor.rotor_speed_out", "rotor_position_sensor.rotation_in", "rotational_speed", true),
  c("fb.rotor_position", "rotor_position_sensor.angle_out", "mcu.rotor_pos_in", "analog", true),
  c("fb.pack_voltage", "hv_battery.voltage_sense_out", "bms.voltage_in", "analog", true),
  c("fb.motor_heat", "traction_motor.heat_out", "motor_temp_sensor.heat_in", "thermal", true),
  c("fb.motor_temp", "motor_temp_sensor.temp_out", "thermal_ecu.temp_in", "analog", true),
  c("fb.fan_speed", "cooling_fan.speed_out", "thermal_ecu.fan_speed_in", "digital", true),
  // Thermal
  c("thm.fan_pwm", "thermal_ecu.fan_pwm_out", "cooling_fan.pwm_in", "digital"),
  c("thm.pump", "thermal_ecu.pump_cmd_out", "cooling_pump.cmd_in", "digital"),
  c("thm.derate", "thermal_ecu.derate_out", "vcu.derate_in", "can_message"),
  // Brake
  c("brk.pressure_cmd", "brake_ecu.pressure_cmd_out", "hydraulic_modulator.cmd_in", "digital"),
  c("brk.pressure", "hydraulic_modulator.pressure_out", "brake_caliper.pressure_in", "hydraulic_pressure"),
  c("brk.torque", "brake_caliper.brake_torque_out", "wheel.brake_torque_in", "mechanical_torque"),
  // Steering
  c("str.assist_cmd", "eps_ecu.assist_cmd_out", "eps_motor.cmd_in", "digital"),
  c("str.column", "steering_wheel.column_out", "steering_rack.pinion_in", "mechanical_torque"),
  c("str.assist", "eps_motor.assist_out", "steering_rack.assist_in", "mechanical_torque"),
  c("str.tie_rod", "steering_rack.tie_rod_out", "wheel.steer_force_in", "mechanical_torque"),
];

export const ECUS: EcuDef[] = [
  { id: "vcu", name: "VCU", functions: ["운전자 토크 요구 해석", "주행 허용(READY·기어) 인터록", "출력 제한 중재"],
    interfaces: ["CAN", "Analog I/O", "Digital I/O"], sensors: ["accel_pedal", "brake_pedal", "gear_selector", "start_button"], actuators: [] },
  { id: "mcu", name: "MCU", functions: ["토크 명령 → 인버터 스위칭", "회전자 위치 기반 전류 제어"],
    interfaces: ["CAN", "PWM", "Analog I/O"], sensors: ["rotor_position_sensor"], actuators: ["inverter", "traction_motor"] },
  { id: "bms", name: "BMS", functions: ["팩 전압·상태 감시", "접촉기·프리차지 제어", "방전 출력 한계 산출"],
    interfaces: ["CAN", "Digital I/O", "Analog I/O"], sensors: ["hv_battery"], actuators: ["main_contactor"] },
  { id: "thermal_ecu", name: "Thermal ECU", functions: ["온도 기반 팬·펌프 제어", "과열 시 출력 저감 요청"],
    interfaces: ["CAN", "PWM", "Analog I/O"], sensors: ["motor_temp_sensor"], actuators: ["cooling_fan", "cooling_pump"] },
  { id: "brake_ecu", name: "Brake ECU", functions: ["제동 요구 해석", "유압 압력 제어", "휠 속도 감시"],
    interfaces: ["CAN", "Digital I/O"], sensors: ["brake_pedal", "wheel_speed_sensor"], actuators: ["hydraulic_modulator", "brake_caliper"] },
  { id: "eps_ecu", name: "EPS ECU", functions: ["조향각 기반 보조 토크 계산"],
    interfaces: ["CAN", "Analog I/O", "PWM"], sensors: ["steering_wheel"], actuators: ["eps_motor"] },
];
