# EV 모델링 배치·렌더링 교차검수 — 2026-11-16

## 1. 이번 수정의 판단 기준

차량 좌표계는 `X=좌우 폭`, `Y=지면에서 높이`, `Z=전후 방향`으로 고정한다. 차체 외곽은 약 1.8 m 폭, 3.95 m 길이, 휠 중심은 `x=±0.745`, 전·후 차축은 `z=-1.18 / 1.16`을 기준으로 한다. 부품의 `target`은 실제 장착 envelope의 가장 긴 변을 뜻하며, 차량 폭을 넘는 부품은 허용하지 않는다.

EV 스케이트보드 구조에서는 배터리 팩이 두 차축 사이, 승객 시트 아래의 낮은 위치에 놓이고, 구동 모터·감속기·차동기어는 전방 또는 후방 차축의 e-axle에 묶인다. 충전 인렛은 차체 측면의 외판에 있고, 조향 휠은 운전자 앞에서 조향축을 따라 수직으로 향한다. 랙·피니언과 코일 스프링/스트럿은 각 휠의 서스펜션/휠하우스 위치를 벗어나지 않는다.

참고 자료: [U.S. DOE EV architecture review](https://www.energy.gov/eere/vehicles/articles/current-trends-electric-vehicle-ev-architectures-and-applications), [DOE all-electric vehicle components](https://afdc.energy.gov/vehicles/how-do-all-electric-cars-work), [NHTSA steering/rack and suspension technical material](https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/recalls_technical_instructions.pdf), [Tesla Model Y owner manual — charge port location](https://www.tesla.com/ownersmanual/modely/en_us/GUID-BEE08D47-0CE0-4AAB-83A7-EC1E7A6AA730.html).

## 2. 렌더링 요소 목록과 설치 기준

| 분류 | 렌더링 요소 | 기준 위치/방향 |
| --- | --- | --- |
| 차체·휠 | `body_shell`, `wheel` | 차체 외곽과 네 휠 중심, 휠 회전축은 좌우 차축 방향 |
| 운전자 입력 | `steering_wheel`, `steering_column`, `steering_torque_sensor`, `accel_pedal`, `brake_pedal`, `gear_selector`, `start_button` | 운전석 전방, 핸들 면은 운전자 쪽, 페달은 발 공간, 시작 버튼은 계기판/센터 영역 |
| 표시·제어 | `instrument_cluster`, `vcu`, `mcu`, `generic_ecu`, `chassis_ecu`, `park_ecu` | 실내 또는 보호된 전장 영역, 주행 부품과 겹치지 않는 높이 |
| HV 에너지 | `hv_battery`, `bms`, `main_contactor`, `hv_junction_box`, `cell_monitor_board`, `isolation_monitor` | 배터리는 저상·차축 사이·시트 아래, BMS/접촉기는 팩 상부 또는 HV 정션 인접 |
| 충전·저전압 | `charging_port`, `obc`, `dcdc_converter`, `lv_battery` | 충전 포트는 측면 외판에 수직, OBC/DC-DC는 충전/HV 정션 경로에 인접 |
| 구동 | `traction_motor`, `reduction_gear`, `differential`, `drive_shaft`, `inverter`, `rotor_position_sensor`, `motor_temp_sensor` | 전방 e-axle와 차축 중심, 모터·감속기·차동기어는 하나의 구동 패키지로 정렬 |
| 제동 | `brake_ecu`, `hydraulic_modulator`, `brake_line`, `brake_caliper`, `wheel_speed_sensor` | 브레이크 ECU/모듈레이터는 전장·유압 보호 위치, 캘리퍼/휠속도 센서는 휠 근처 |
| 조향 | `steering_rack`, `eps_motor`, `eps_power_pack`, `position_sensor` | 랙·피니언은 앞 차축 중앙, EPS는 랙/컬럼 인접, 센서는 조향 링크 근처 |
| 열관리 | `thermal_ecu`, `cooling_pump`, `coolant_valve`, `cooling_fan`, `radiator` | 라디에이터는 전방, 펌프/밸브는 구동·배터리 냉각 루프 경로, 팬은 라디에이터 면 |
| 현가 | `coil_spring`, `damper`, `cdc_damper`, `air_spring`, `air_compressor`, `ride_height_sensor`, `height_sensor` | 각 휠 코너의 스프링·댐퍼 축, 높이 센서는 서스펜션 링크, 컴프레서는 보호 공간 |
| 주차·기타 | `park_lock_actuator`, `park_position_sensor`, `can_harness`, `hv_cable`, `brake_line` | 해당 액추에이터/센서에 붙고, 배선은 포트-포트 최단 경로로 하부에 정리 |

## 3. 코드 교차검수 결과

- 배터리 모델의 폭/길이 축을 `X=0.62`, `Z=0.92` 기본 형상으로 두고 차량 배치에서 `Z`만 1.9배 확대했다. 이방향 스케일로 저상·세로형 팩을 만들며 차량 폭보다 넓어지는 scalar fit을 제거했다.
- 스티어링 휠·토크 센서·컬럼의 잘못된 Z-roll을 제거했다. 자산의 로컬 X 조향축을 차량의 좌우 축으로 사용해 운전자 앞 수직면에 놓인다.
- 충전 포트는 차체 측면 후방에 두고 `Y`축 기준 90도 회전을 유지했다. 후속 배선 작업은 포트 anchor에서 OBC/HV 정션 anchor로 연결한다.
- `VehicleLayout.tsx`의 overview 보강 목록으로 배터리/BMS/인버터/모터/랙/스프링/댐퍼/충전 포트/OBC/DC-DC가 누락되지 않도록 했다.

## 4. 남은 교차검수 항목

실제 화면에서 전체보기·겹쳐보기·도메인별 보기·개별 모델 보기 각각을 열어 다음을 확인한다.

1. 네 휠이 같은 지면 높이이고 차량 전방을 향하는지.
2. 배터리 외곽이 차체 폭을 넘지 않고 시트 아래 높이에 있는지.
3. 핸들/컬럼/랙/피니언의 조향축이 한 선상인지.
4. 코일 스프링·댐퍼·랙·브레이크 캘리퍼·휠속도 센서가 휠하우스에 겹치지 않는지.
5. 충전 포트가 외판을 향하고, 모든 배선이 부품 중심을 관통하지 않는지.
6. 전체보기는 기본적으로 배선 숨김이며, 겹쳐보기에서만 배선을 낮은 위치의 직교 경로로 표시하는지.

## 5. 페이지별 제3자 UX 검수 계획

| 화면 | 확인할 조합 | 통과 기준 |
| --- | --- | --- |
| 레벨 선택 | 레벨 카드 hover/선택/시작/잠금 | 선택 링이 카드 밖으로 움직이지 않고, 우측 문제 설명에 이미지와 텍스트가 함께 보임 |
| 정비소 | 전체보기/겹쳐보기/4개 레이어/도메인 11개 | 레이싱 전 추격 거리 숨김, 기본 배선 숨김, 모델 겹침·차체 외부 돌출 없음 |
| 주행 | 최초 출발/추격 시작/정상 주행/고장 주행 | 출발 직후 접근 거리 없음, 추격 시작 후에만 거리 표시, 직선·곡선 코스 모두 읽힘 |
| 도미노 | 증상/신호/의심 구간/가설, 증거·경로·구조·가설 탭 | 단계 브리지가 겹치지 않음, 위/아래 키와 버튼 방향 일치, 폴라로이드 캡션이 사진 아래에 표시 |
| 퍼즐 | 조각 hover/drag/drop/확대/설계서/오답·정답 | 본문은 퍼즐만, 조각은 본문과 같은 정사각형 비율, 클릭만으로 배치되지 않음 |
| 실험대 | 가설 선택/3 검증 수준/실행/재생/문서 팝업 | 기존 시각화 유지, 모니터링은 큰 좌우 패널, 정상·고장·요인 제거 모델 안내가 읽힘 |
| 수리·해석 | 수리 적용/주행 복귀/엔딩/다음 레벨 | 중복 버튼 없음, 공통 버튼 높이·패딩 통일, 다음 단계 상태가 명확함 |

모든 화면에서 긴 문장·오답 해설·버튼 상태·빈 상태·모달을 각각 열고 `overflow`, 겹침, 포커스, 키보드 조작, 이미지 `object-fit`, 16:9 Chrome 전체 화면을 확인한다.
