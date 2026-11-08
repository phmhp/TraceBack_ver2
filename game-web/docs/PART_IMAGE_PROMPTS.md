# EV 부품 이미지 생성 프롬프트 (v3)

> 자동 생성 파일입니다. 수정은 `scripts/image-prompt-data.mjs`에서 하고 `npm run prompts`를 실행하세요.
> 생성 도구: ChatGPT(GPT 이미지) · 3D 변환: [TRELLIS.2 데모](https://huggingface.co/spaces/microsoft/TRELLIS.2)(MIT) · 부품 ID 기준: `src/sim/components.ts`

부품 94종 + 사건 증거 11종 = **이미지 총 238장**

## 1. 규칙 — 코드 블록 하나 = 요청 1번 = 이미지 1장

v2에서는 한 번에 여러 스타일을 요청해 비슷한 이미지가 여러 장 나오거나, 필요한 스타일이 빠지는 문제가 있었습니다. v3는 **스타일마다 완성된 프롬프트를 따로** 드립니다.

1. 부품 문서를 열고, 부품의 **순서표**를 위에서부터 차례로 진행합니다.
2. **이미지 1장마다 ChatGPT 새 대화**를 여는 것을 권장합니다. 대화가 길어지면 이전 요청을 섞어 여러 장을 만드는 경향이 있습니다.
3. 순서표의 **"대화에 첨부할 이미지"** 칸에 파일이 있으면, 그 이미지를 먼저 첨부하고 프롬프트를 붙여 넣습니다. 이렇게 해야 같은 부품이 모든 이미지에서 같은 모양으로 나옵니다.
4. ChatGPT가 이미지 아래에 **파일명을 답해 줍니다.** 그 이름 그대로 저장합니다.
   - 저장 위치: `game-web/asset-intake/images/`
5. 그래도 여러 장이 나오면 **첫 장만** 저장하고, 다음 요청 전에 새 대화를 엽니다.
6. `CUT` 결과에 회색·흰색 **체크무늬가 그려져 있으면** 가짜 투명 배경입니다. 프롬프트의 `Background:` 줄을 `Background: plain pure white.`로 바꿔 다시 요청하세요. 배경 제거는 제가 하겠습니다.

## 2. 파일명 형식

| 생성물 | 파일명 | 용도 |
|---|---|---|
| REF | `<부품ID>__REF.png` | 3D 모델링 기준, TRELLIS 입력 |
| TURN | `<부품ID>__TURN.png` | 직접 모델링용 정면·측면·윗면·3/4 시트 |
| EXPL | `<부품ID>__EXPL.png` | 분해도·내부 구조 학습 |
| CUT | `<부품ID>__CUT.png` | 실험대·배선 작업대 부품 카드 |
| EVID 정상 | `<부품ID>__EVID-ok.png` | 메모판 사진, 정상 상태 비교 |
| EVID 고장 | `<부품ID>__EVID-fault.png` | 메모판 사진, 고장 상태 비교 (정상 사진과 같은 구도) |
| 사건 증거 | `<증거ID>__EVID.png` | 메모판 증거 카드 |

`EVID` 사진은 **틀 없는 정사각형**입니다. 폴라로이드 틀(`polaroid-frame-real-v1.png`)과 캡션 글자는 게임이 씌웁니다.

예시 — `accel_pedal`

| 순서 | 생성물 | 파일명 |
|---|---|---|
| 1 | REF | `accel_pedal__REF.png` |
| 2 | TURN | `accel_pedal__TURN.png` |
| 3 | CUT | `accel_pedal__CUT.png` |
| 4 | EVID 정상 | `accel_pedal__EVID-ok.png` |
| 5 | EVID 고장 | `accel_pedal__EVID-fault.png` |

## 3. 우선순위

사건 순서대로 진행하면 게임 반영 효과가 가장 큽니다.
1. 구동: `accel_pedal`, `vcu`, `inverter`, `traction_motor`, `motor_stator`, `motor_rotor`, `reduction_gear`, `drive_shaft`
2. 열관리: `motor_temp_sensor`, `thermal_ecu`, `cooling_pump`, `radiator`, `cooling_fan`
3. 제동: `brake_pedal`, `brake_booster`, `hydraulic_modulator`, `brake_caliper`, `brake_disc`, `brake_pad`, `wheel_speed_sensor`
4. 운전자 입력장치: `steering_wheel`, `gear_selector`, `start_button`
5. 전원: `battery_cell`, `battery_module`, `hv_battery`, `main_contactor`, `precharge_circuit`
6. [사건 증거 사진 11장](image-prompts/12-case-evidence.md)
7. 그 외 부품

## 4. 부품 목록

| ID | 부품 | 3D 방식 | 이미지 수 | 프롬프트 |
|---|---|---|---|---|
| `accel_pedal` | 가속 페달 | 직접 | 5 | [운전자 입력장치 (HMI)](image-prompts/01-driver-input.md#accel_pedal) |
| `brake_pedal` | 브레이크 페달 | 직접 | 5 | [운전자 입력장치 (HMI)](image-prompts/01-driver-input.md#brake_pedal) |
| `steering_wheel` | 스티어링 휠 | 직접 | 3 | [운전자 입력장치 (HMI)](image-prompts/01-driver-input.md#steering_wheel) |
| `gear_selector` | 기어 셀렉터 | 직접 | 2 | [운전자 입력장치 (HMI)](image-prompts/01-driver-input.md#gear_selector) |
| `start_button` | 시동 버튼 | 직접 | 4 | [운전자 입력장치 (HMI)](image-prompts/01-driver-input.md#start_button) |
| `instrument_cluster` | 계기판 | 2D | 3 | [운전자 입력장치 (HMI)](image-prompts/01-driver-input.md#instrument_cluster) |
| `steering_column` | 스티어링 칼럼 | 직접 | 2 | [운전자 입력장치 (HMI)](image-prompts/01-driver-input.md#steering_column) |
| `epb_switch` | 전자식 주차 브레이크 스위치 | 2D | 1 | [운전자 입력장치 (HMI)](image-prompts/01-driver-input.md#epb_switch) |
| `wheel_speed_sensor` | 휠 속도 센서 | 직접 | 4 | [센서](image-prompts/02-sensors.md#wheel_speed_sensor) |
| `rotor_position_sensor` | 모터 위치 센서(리졸버) | 직접 | 3 | [센서](image-prompts/02-sensors.md#rotor_position_sensor) |
| `motor_temp_sensor` | 모터 온도 센서(NTC) | 직접 | 4 | [센서](image-prompts/02-sensors.md#motor_temp_sensor) |
| `coolant_temp_sensor` | 냉각수 온도 센서 | 직접 | 2 | [센서](image-prompts/02-sensors.md#coolant_temp_sensor) |
| `steering_angle_sensor` | 조향각 센서 | 직접 | 2 | [센서](image-prompts/02-sensors.md#steering_angle_sensor) |
| `steering_torque_sensor` | 조향 토크 센서 | 직접 | 2 | [센서](image-prompts/02-sensors.md#steering_torque_sensor) |
| `pack_current_sensor` | 배터리 전류 센서 | AI | 2 | [센서](image-prompts/02-sensors.md#pack_current_sensor) |
| `brake_pressure_sensor` | 브레이크 압력 센서 | 직접 | 2 | [센서](image-prompts/02-sensors.md#brake_pressure_sensor) |
| `imu_sensor` | 요레이트·가속도 센서 | AI | 1 | [센서](image-prompts/02-sensors.md#imu_sensor) |
| `vcu` | VCU 차량 제어기 | 직접 | 4 | [제어기 (ECU)](image-prompts/03-ecu.md#vcu) |
| `mcu` | MCU 모터 제어기 | 직접 | 2 | [제어기 (ECU)](image-prompts/03-ecu.md#mcu) |
| `bms` | BMS | AI | 2 | [제어기 (ECU)](image-prompts/03-ecu.md#bms) |
| `cell_monitor_board` | 셀 모니터링 보드 | 직접 | 3 | [제어기 (ECU)](image-prompts/03-ecu.md#cell_monitor_board) |
| `thermal_ecu` | 열관리 ECU | 직접 | 1 | [제어기 (ECU)](image-prompts/03-ecu.md#thermal_ecu) |
| `brake_ecu` | 제동 ECU | 직접 | 1 | [제어기 (ECU)](image-prompts/03-ecu.md#brake_ecu) |
| `eps_ecu` | EPS ECU | 직접 | 1 | [제어기 (ECU)](image-prompts/03-ecu.md#eps_ecu) |
| `gateway` | 중앙 게이트웨이 | AI | 1 | [제어기 (ECU)](image-prompts/03-ecu.md#gateway) |
| `battery_cell` | 배터리 셀 | 직접 | 2 | [전원·배터리](image-prompts/04-power-battery.md#battery_cell) |
| `battery_module` | 배터리 모듈 | 직접 | 3 | [전원·배터리](image-prompts/04-power-battery.md#battery_module) |
| `hv_battery` | 고전압 배터리 팩 | 직접 | 3 | [전원·배터리](image-prompts/04-power-battery.md#hv_battery) |
| `battery_cooling_plate` | 배터리 냉각판 | 직접 | 2 | [전원·배터리](image-prompts/04-power-battery.md#battery_cooling_plate) |
| `hv_junction_box` | HV 정션박스 | AI | 2 | [전원·배터리](image-prompts/04-power-battery.md#hv_junction_box) |
| `main_contactor` | 메인 컨택터 | 직접 | 4 | [전원·배터리](image-prompts/04-power-battery.md#main_contactor) |
| `precharge_circuit` | 프리차지 회로 | 직접 | 2 | [전원·배터리](image-prompts/04-power-battery.md#precharge_circuit) |
| `dcdc_converter` | DC/DC 컨버터 | AI | 2 | [전원·배터리](image-prompts/04-power-battery.md#dcdc_converter) |
| `lv_battery` | 12V 보조 배터리 | 직접 | 2 | [전원·배터리](image-prompts/04-power-battery.md#lv_battery) |
| `service_disconnect` | 서비스 차단 플러그 | 직접 | 2 | [전원·배터리](image-prompts/04-power-battery.md#service_disconnect) |
| `hv_cable` | 고전압 케이블·커넥터 | 직접 | 4 | [전원·배터리](image-prompts/04-power-battery.md#hv_cable) |
| `lv_harness` | 저전압 하니스 | 직접 | 3 | [전원·배터리](image-prompts/04-power-battery.md#lv_harness) |
| `inverter` | 구동 인버터 | 직접 | 5 | [구동계](image-prompts/05-drivetrain.md#inverter) |
| `traction_motor` | 구동 모터 | 직접 | 5 | [구동계](image-prompts/05-drivetrain.md#traction_motor) |
| `motor_stator` | 스테이터 | 직접 | 2 | [구동계](image-prompts/05-drivetrain.md#motor_stator) |
| `motor_rotor` | 로터 | 직접 | 2 | [구동계](image-prompts/05-drivetrain.md#motor_rotor) |
| `reduction_gear` | 감속기 | 직접 | 3 | [구동계](image-prompts/05-drivetrain.md#reduction_gear) |
| `differential` | 차동기어 | 직접 | 2 | [구동계](image-prompts/05-drivetrain.md#differential) |
| `drive_shaft` | 드라이브 샤프트 | 직접 | 2 | [구동계](image-prompts/05-drivetrain.md#drive_shaft) |
| `wheel` | 휠·허브 | 직접 | 2 | [구동계](image-prompts/05-drivetrain.md#wheel) |
| `brake_booster` | 전자식 브레이크 부스터 | 직접 | 2 | [제동계](image-prompts/06-brake.md#brake_booster) |
| `master_cylinder` | 마스터 실린더 | 직접 | 3 | [제동계](image-prompts/06-brake.md#master_cylinder) |
| `hydraulic_modulator` | 유압 모듈레이터 | AI | 4 | [제동계](image-prompts/06-brake.md#hydraulic_modulator) |
| `brake_caliper` | 브레이크 캘리퍼 | 직접 | 5 | [제동계](image-prompts/06-brake.md#brake_caliper) |
| `brake_disc` | 브레이크 디스크 | 직접 | 2 | [제동계](image-prompts/06-brake.md#brake_disc) |
| `brake_pad` | 브레이크 패드 | 직접 | 3 | [제동계](image-prompts/06-brake.md#brake_pad) |
| `brake_line` | 브레이크 배관·호스 | 직접 | 3 | [제동계](image-prompts/06-brake.md#brake_line) |
| `eps_motor` | EPS 보조 모터 | 직접 | 3 | [조향·현가계](image-prompts/07-steering-suspension.md#eps_motor) |
| `steering_rack` | 스티어링 랙 | 직접 | 3 | [조향·현가계](image-prompts/07-steering-suspension.md#steering_rack) |
| `tie_rod` | 타이로드 | 직접 | 2 | [조향·현가계](image-prompts/07-steering-suspension.md#tie_rod) |
| `knuckle` | 너클 | 직접 | 2 | [조향·현가계](image-prompts/07-steering-suspension.md#knuckle) |
| `control_arm` | 컨트롤 암 | 직접 | 2 | [조향·현가계](image-prompts/07-steering-suspension.md#control_arm) |
| `coil_spring` | 코일 스프링 | 직접 | 2 | [조향·현가계](image-prompts/07-steering-suspension.md#coil_spring) |
| `damper` | 댐퍼(쇼크업소버) | 직접 | 3 | [조향·현가계](image-prompts/07-steering-suspension.md#damper) |
| `strut_assembly` | 스트럿 어셈블리 | 직접 | 2 | [조향·현가계](image-prompts/07-steering-suspension.md#strut_assembly) |
| `anti_roll_bar` | 스태빌라이저 바 | 직접 | 2 | [조향·현가계](image-prompts/07-steering-suspension.md#anti_roll_bar) |
| `cooling_pump` | 전동 냉각수 펌프 | 직접 | 5 | [열관리](image-prompts/08-thermal.md#cooling_pump) |
| `radiator` | 라디에이터 | 직접 | 2 | [열관리](image-prompts/08-thermal.md#radiator) |
| `cooling_fan` | 냉각 팬 | 직접 | 4 | [열관리](image-prompts/08-thermal.md#cooling_fan) |
| `coolant_reservoir` | 냉각수 리저버 | 직접 | 2 | [열관리](image-prompts/08-thermal.md#coolant_reservoir) |
| `cooling_pipe` | 냉각 배관 | 직접 | 3 | [열관리](image-prompts/08-thermal.md#cooling_pipe) |
| `chiller` | 칠러(열교환기) | AI | 2 | [열관리](image-prompts/08-thermal.md#chiller) |
| `coolant_valve` | 냉각수 다방향 밸브 | AI | 2 | [열관리](image-prompts/08-thermal.md#coolant_valve) |
| `charging_port` | 충전 포트 | AI | 4 | [충전](image-prompts/09-charging.md#charging_port) |
| `obc` | 차량 탑재 충전기(OBC) | AI | 2 | [충전](image-prompts/09-charging.md#obc) |
| `dc_charge_connector` | DC 급속 충전 커넥터 | AI | 2 | [충전](image-prompts/09-charging.md#dc_charge_connector) |
| `ac_charge_cable` | AC 충전 케이블 | 2D | 1 | [충전](image-prompts/09-charging.md#ac_charge_cable) |
| `can_harness` | CAN 통신선 | 직접 | 3 | [통신·진단](image-prompts/10-network-diagnostics.md#can_harness) |
| `diagnostic_port` | 진단 포트 | 2D | 3 | [통신·진단](image-prompts/10-network-diagnostics.md#diagnostic_port) |
| `diagnostic_tool` | 진단 장비 | 2D | 2 | [통신·진단](image-prompts/10-network-diagnostics.md#diagnostic_tool) |
| `ac_compressor` | 전동 에어컨 컴프레서 | AI | 2 | [향후 확장 도메인](image-prompts/11-future-domains.md#ac_compressor) |
| `ptc_heater` | PTC 히터 | AI | 2 | [향후 확장 도메인](image-prompts/11-future-domains.md#ptc_heater) |
| `headlamp_module` | 헤드램프 | 2D | 1 | [향후 확장 도메인](image-prompts/11-future-domains.md#headlamp_module) |
| `wiper_motor` | 와이퍼 모터 | 2D | 1 | [향후 확장 도메인](image-prompts/11-future-domains.md#wiper_motor) |
| `door_latch` | 도어 래치 액추에이터 | 2D | 1 | [향후 확장 도메인](image-prompts/11-future-domains.md#door_latch) |
| `seat_motor` | 시트 모터 | 2D | 1 | [향후 확장 도메인](image-prompts/11-future-domains.md#seat_motor) |
| `adas_camera` | 전방 카메라 | 2D | 1 | [향후 확장 도메인](image-prompts/11-future-domains.md#adas_camera) |
| `adas_radar` | 전방 레이더 | 2D | 1 | [향후 확장 도메인](image-prompts/11-future-domains.md#adas_radar) |
| `airbag_ecu` | 에어백 제어기 | 2D | 1 | [향후 확장 도메인](image-prompts/11-future-domains.md#airbag_ecu) |
| `isolation_monitor` | 절연 저항 감시 장치(IMD)·팩 전압 감지 | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#isolation_monitor) |
| `park_ecu` | 파킹 제어기(Park ECU) | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#park_ecu) |
| `park_lock_actuator` | 파킹 락 액추에이터 | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#park_lock_actuator) |
| `park_position_sensor` | 파킹 위치 센서 | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#park_position_sensor) |
| `chassis_ecu` | 전자제어 현가 제어기(Chassis ECU) | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#chassis_ecu) |
| `ride_height_sensor` | 차고(높이) 센서 | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#ride_height_sensor) |
| `air_spring` | 에어 스프링 | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#air_spring) |
| `air_compressor` | 에어 서스펜션 컴프레서·밸브 블록 | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#air_compressor) |
| `cdc_damper` | 전자 감쇠 밸브 댐퍼(CDC) | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#cdc_damper) |
| `eps_power_pack` | EPS 파워팩(모터+인버터 일체) | 직접 | 2 | [차고 화면 보강 부품 (2026-11-08)](image-prompts/13-garage-additions.md#eps_power_pack) |
