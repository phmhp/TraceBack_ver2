# EV 렌더링·필수 거동·에셋 교차검증표

작성일: 2026-11-16  
상태: **수정 전 조사 문서 / 사용자 승인 대기**

이 문서는 모델링 코드를 수정하기 전에 현재 live 구현을 기준으로 다음을 한 번에 대조하기 위한 문서다.

- 실제 차량 기준 좌표계와 Hero 차량 좌표계
- 정비소에서 이미 렌더링되는 부품과 상대 위치
- 필수 차량 거동에 필요한 부품 수량과 방향
- 모델은 있지만 배치표가 없는 부품
- 모델·에셋·신호 표현이 새로 필요한 항목
- 도메인별 누락·축약·오매핑

현재 단계에서는 코드·모델·배치표를 수정하지 않는다.

## 1. 교차검증 기준 좌표계

현재 차량 기준은 다음과 같이 통일해서 확인한다.

| 축 | 의미 | 기준 |
| --- | --- | --- |
| X | 차량 좌우 | Hero 차량 운전석은 `X=-0.31`, 반대편은 `X=+0.31` |
| Y | 지면에서 높이 | 지면 `Y=0` |
| Z | 차량 전후 | 전방 `Z` 음수, 후방 `Z` 양수 |
| 전륜 차축 | 앞 차축 | `Z=-1.18` |
| 후륜 차축 | 뒤 차축 | `Z=+1.16` |
| 휠 중심 | 좌우 | `X=±0.745` |
| 휠 반지름 | 수직 | `0.34` |
| 차체 외곽 | 폭·길이 | 약 `1.8m × 3.95m` |

검수 시 `PLACE`의 좌표만 보지 않고 다음을 함께 확인한다.

1. 모델의 로컬 축과 차량 축이 같은가.
2. 모델의 중심 좌표가 실제 장착 중심인가.
3. 모델 envelope가 차체·다른 부품과 겹치지 않는가.
4. 커넥터 anchor가 실제 배선의 시작/끝에 있는가.
5. 동일 부품이 좌우·전후 필요한 수만큼 복제됐는가.

## 2. 기존 렌더링 내용과 현재 상대 위치

### 2.1 현재 정비소 공통 문맥

`VehicleLayout.tsx`의 `CarContext`는 차체 반투명 외곽, 바닥, 문맥용 휠 4개를 렌더링한다.

| 요소 | 현재 구현 | 현재 판정 |
| --- | --- | --- |
| 차체 | `getBodyGeometry()` 기반 반투명 차체 | 차체 기준은 유지. 부품 관통·돌출 재검수 필요 |
| 문맥 휠 | 앞/뒤 차축 × 좌/우로 4개 | 수량은 4개. 다만 휠 면과 회전축 기준이 실제 기능 휠과 불일치할 가능성 있음 |
| 바닥 | 차체 폭·길이 기준 평면 | 위치 기준 확인용으로 적절 |
| 실제 기능 휠 | `PLACE.wheel` 단일 노드 | 기능 체인에서는 1개뿐. 문맥 휠 4개와 분리되어 있음 |
| 전체보기 배선 | 기본적으로 별도 `FlowCable`을 표시하지 않음 | 정책은 맞음. 연결 위치는 별도 검수 필요 |

### 2.2 운전자·HMI

| 부품 | 현재 `PLACE` | 상대 위치 의도 | 현재 문제 |
| --- | --- | --- | --- |
| `accel_pedal` | `[+.27,.28,-.98]` | 운전석 발 공간 | Hero 운전석 `X=-.31`과 반대쪽 |
| `brake_pedal` | `[+.43,.28,-.98]` | 가속 페달 옆 | 운전석 기준 반대쪽이며 가속 페달과 좌우 기준 재검토 필요 |
| `steering_wheel` | `[+.37,.98,-.42]`, 무회전 | 운전자 앞 | 운전석 반대쪽, Hero 위치와 불일치. 로컬 조향축도 재검토 필요 |
| `steering_torque_sensor` | `[+.37,.86,-.62]` | 컬럼 중간 | 핸들·컬럼 기준이 바뀌면 함께 이동 필요 |
| `steering_column` | `[+.37,.78,-.78]` | 핸들에서 랙으로 연결 | 현재 핸들 중심과 랙 중심을 잇는 축이 아님 |
| `instrument_cluster` | `[+.37,1.02,-.78]`, Y 90° | 핸들 앞/뒤의 대시보드 | 운전석 반대쪽, 높음, 깊이·면 방향 불일치 |
| `gear_selector` | `[0,.62,-.38]` | 센터 콘솔 | 좌우 기준 문제는 적으나 운전석·콘솔과의 상대 깊이 재확인 필요 |
| `start_button` | `[+.08,.88,-.72]` | 대시보드/센터 | 운전석 기준과 클러스터 기준 확정 후 재배치 필요 |
| `vcu` | `[-.22,.78,-.72]` | 대시보드/전장 영역 | 위치 자체는 실내 전장 영역이나 다른 HMI와 간섭 검수 필요 |

### 2.3 구동·전원

| 부품 | 현재 `PLACE` | 상대 위치 의도 | 현재 문제 |
| --- | --- | --- | --- |
| `hv_battery` | `[0,.18,.05]`, 비등방 스케일 `[1.05,1,1.9]` | 두 차축 사이 바닥/시트 아래 | 의도는 적절. 차체 바닥과 충돌·폭 검증 필요 |
| `bms` | `[0,.4,.35]` | 팩 상부 | 배터리와 실제 envelope 간격 검증 필요 |
| `main_contactor` | `[-.48,.62,-.82]` | 전방 HV 서비스 영역 | 위치는 가능하나 HV 정션과 배선 경로 확인 필요 |
| `inverter` | `[-.58,.62,-.72]` | 전륜 모터룸 | 모터·MCU·열관리 부품과 겹침 여부 확인 필요 |
| `mcu` | `[-.58,.78,-.62]` | 인버터 제어부 | 실제 인버터와 같은 패키지인지 별도 박스인지 결정 필요 |
| `traction_motor` | `[-.2,.42,-.98]` | 전륜 e-axle | 단일 모터는 가능하나 좌우 반축 연결은 부족 |
| `reduction_gear` | `[+.18,.4,-.98]` | 모터 인접 감속기 | 모터·차동기어와 envelope 확인 필요 |
| `differential` | `[+.42,.36,-.98]` | 전륜 중앙 차동 | 현재 좌우 반축 2개가 아니라 단일 샤프트만 연결 |
| `drive_shaft` | `[+.62,.34,-1.18]`, Y 90° | 차동기어→휠 허브 | 모델 길이축과 차량 좌우축 불일치, 좌/우 2개 필요 |
| `wheel` | `[+.745,.34,-1.18]`, Y -90° | 전륜 허브 | 기능 체인 1개뿐, 4코너 기능 부품과 분리됨 |
| `hv_junction_box` | `[-.42,.72,-.72]` | 전방 HV 분배 | 좌표는 있으나 다른 HV 부품과 관통 검수 필요 |
| `isolation_monitor` | `[-.48,.62,-.62]` | HV 서비스 영역 | `main_contactor`와 밀집. 서비스 간격 필요 |
| `cell_monitor_board` | `[0,.35,.2]` | 배터리 팩 내부/상부 | 배터리 내부 표시인지 외부 분리 표시인지 결정 필요 |

### 2.4 충전·저전압

| 부품 | 현재 `PLACE` | 현재 판정 |
| --- | --- | --- |
| `charging_port` | `[+.87,.78,+.86]`, Y 90° | 후방 측면 의도는 적절. 운전석/충전구 측면 선택과 외판 법선 확인 필요 |
| `obc` | `[+.42,.72,-.65]` | 모델·좌표 있음. 충전 포트/HV 정션 연결 경로 확인 필요 |
| `dcdc_converter` | `[-.46,.74,-.5]` | 모델·좌표 있음. LV battery/VCU와 전장 패키지 간섭 확인 필요 |
| `lv_battery` | `[-.55,.48,-.3]` | 모델·좌표 있음. 전륜 모터룸에 과밀할 수 있음 |
| `evcc` | `PLACE` 없음 | 모델은 있으나 현재 임시 좌표 사용 가능성 |
| `charge_lock_actuator` | `PLACE` 없음 | 모델은 있으나 충전구에 고정되지 않음 |
| 외부 충전기 | 차량 부품으로 없음 | 외부 장비 그래픽 또는 명시적 신호 객체 필요 |
| CP/PP | 별도 모델 없음 | 신호 케이블/포트 라벨로 명시해야 함 |

### 2.5 제동·조향

| 부품 | 현재 `PLACE` | 기대 수량 | 현재 판정 |
| --- | --- | ---: | --- |
| `brake_ecu` | `[-.46,.82,-.58]` | 1 | 중앙 ECU로 가능 |
| `hydraulic_modulator` | `[-.3,.58,-.98]` | 1 | 차량 중앙/전방 모듈로 가능 |
| `brake_line` | `[-.3,.52,-1.05]` | 4코너 분기 | 단일 모델만 있음. 네 코너 분기 표현 필요 |
| `brake_caliper` | `[+.745,.34,-1.18]`, Y -90° | 4 | 한쪽 전륜 1개뿐, 방향도 재검토 |
| `wheel_speed_sensor` | `[+.78,.43,-1.18]`, Y -90° | 4 | 한쪽 전륜 1개뿐 |
| `steering_rack` | `[0,.38,-1.18]`, Y 90° | 1 중앙 | 모델 이동축 X와 배치 회전이 충돌 |
| `eps_motor` | `[+.24,.72,-.68]`, Z roll | 1 | 랙/컬럼과 실제 연결축 확인 필요 |
| `eps_power_pack` | `[-.22,.42,-.72]` | 1 | 모델·좌표 있음. EPS motor/ECU와 패키지 구분 필요 |
| `position_sensor` | `[+.8,.44,-1.0]` | 조향/랙 위치 피드백 | 현재 전용 steering angle sensor가 없어 오매핑 가능성 |

### 2.6 현가

| 부품 | 현재 `PLACE` | 기대 수량 | 현재 판정 |
| --- | --- | ---: | --- |
| `coil_spring` | `[+.745,.52,-1.18]` | 코너당 1 | 전륜 우측 1개만 있음 |
| `damper` | `[+.745,.46,-1.18]` | 코너당 1 | 전륜 우측 1개만 있음 |
| `cdc_damper` | `[+.745,.46,-1.18]` | CDC 사양이면 4 | 좌표는 있지만 overview 보강 목록에서 빠짐 |
| `air_spring` | `[+.745,.42,+1.16]` | 에어 사양이면 4 | 후륜 우측 1개만 있음 |
| `air_compressor` | `[-.58,.26,+.66]` | 1 | 모델·좌표 있음 |
| `ride_height_sensor` | `[+.8,.3,+1.16]` | 구성에 따라 2 또는 4 | 한쪽 후륜 기준 1개 |
| `height_sensor` | `[+.8,.3,+1.16]` | 구성에 따라 2 또는 4 | `ride_height_sensor`와 역할 중복 여부 정리 필요 |
| 휠 가속도 센서 | 없음 | 4 | 전용 모델·좌표 모두 없음 |

**현가 사양 결정 필요:** 일반 코일 스프링+댐퍼와 에어 스프링은 동일 차량에 동시에 주 현가로 렌더링할지 결정해야 한다. CDC 댐퍼는 일반 댐퍼의 대체/상세 사양으로 볼 수 있다. 승인 시 “코일+CDC 4코너” 또는 “에어+CDC 4코너”처럼 한 차량 사양을 확정한다.

### 2.7 열관리·주차·통신·ADAS

| 영역 | 현재 모델/좌표 | 현재 판정 |
| --- | --- | --- |
| 열관리 ECU | `thermal_ecu` `[-.58,.82,-.45]` | 모델·좌표 있음 |
| 냉각 펌프 | `cooling_pump` `[-.45,.5,-.9]` | 모델·좌표 있음 |
| 냉각 밸브 | `coolant_valve` `[-.2,.58,-.9]` | 모델·좌표 있음 |
| 냉각 팬 | `cooling_fan` `[-.72,.5,-1.72]` | 전방 위치. 라디에이터 면과 정렬 필요 |
| 라디에이터 | `radiator` `[0,.5,-1.8]` | 전방 위치. 팬/냉각수 포트 방향 확인 필요 |
| 전동 컴프레서 | `PLACE` 없음 | 모델은 있으나 임시 위치 가능 |
| PTC 히터 | `PLACE` 없음 | 모델은 있으나 임시 위치 가능 |
| EEV | `PLACE` 없음 | 모델은 있으나 임시 위치 가능 |
| 칠러 | 전용 모델/좌표 없음 | 열관리 회로 설명에 있으나 렌더링 누락 |
| Park ECU | `[-.32,.62,+.72]` | 모델·좌표 있음 |
| Park lock actuator | `[+.15,.42,+.82]` | 모델·좌표 있음 |
| Park position sensor | `[+.15,.38,+.9]` | 모델·좌표 있음 |
| CAN harness/HV cable | 별도 신호/케이블 모델 | 물리 부품이 아니라 신호 경로로 분리 표시 필요 |
| Gateway/diagnostic port | 전용 좌표 없음 | 통신 체인에 있으나 실제 장착 위치 불명 |
| ADAS camera/radar/ECU | 모델은 있음, `PLACE` 없음 | 전방 외부/윈드실드 기준 좌표 필요 |
| TCU | 모델은 있음, `PLACE` 없음 | 통신/텔레매틱스 장착 위치 필요 |
| 경고등 표시 | 별도 모델 없음 | cluster 내부 표시 또는 HMI overlay로 명시 필요 |

## 3. 필수 거동별 필요한 부품·개수

| 필수 거동 | 최소 렌더링 구성 | 현재 상태 | 판정 |
| --- | --- | --- | --- |
| 조향 | 핸들 1, 컬럼 1, 토크/각도 센서, EPS 1, 랙 1, 타이로드 좌/우, 전륜 너클 2, 전륜 조향 | 핸들/클러스터 좌우 오류, 센서 오매핑, 랙 축 오류, 좌우 연결 미확정 | 수정 필요 |
| 구동 | HV pack 1, contactor 1, inverter 1, motor 1, reducer 1, differential 1, half-shaft 2, 전륜 허브 2 | 반축·기능 휠이 단일 | 수정 필요 |
| 제동 | pedal dual sensor, brake ECU 1, modulator 1, hydraulic branches 4, caliper 4, wheel-speed sensor 4 | 캘리퍼/센서/라인 단일 | 수정 필요 |
| 현가 | 4코너 wheel carrier, spring 4, damper/CDC 4, height sensor 2~4, wheel acceleration sensor 4 | 스프링·댐퍼·에어 스프링 단일, 가속도 센서 없음 | 수정 필요 |
| 열관리 | temp sensors, pump, valve, radiator, fan, compressor/EEV/PTC 선택 사양, coolant loop | 일부 신규 부품 임시 좌표, 칠러 없음 | 수정 필요 |
| 충전 | inlet 1, CP/PP, lock actuator 1, EVCC 1, OBC 1, contactor/HV bus, external charger | 차량 내부 일부만 있고 외부 장비·신호 표시 부족 | 보완 필요 |
| 주차 | VCU, Park ECU, lock actuator, position sensor | 모델·좌표 있음 | 연결·거동 검수 필요 |
| 계기판/HMI | cluster 1, warning lamp, gear/READY/thermal display | cluster 위치·방향 오류, 경고등 별도 표현 부족 | 수정 필요 |
| 통신·진단 | CAN bus, gateway, source/target ECU, diagnostic port, TCU | CAN harness는 있으나 gateway/port 위치 부족 | 보완 필요 |
| ADAS | front camera, front radar, ADAS ECU, brake/VCU request, cluster warning | 모델은 있으나 차량 좌표 없음 | 수정 필요 |

## 4. 에셋 제작·추가 작업 목록

### 4.1 새 모델/레퍼런스 에셋이 필요한 항목

| 우선순위 | 에셋 ID 제안 | 용도 | 현재 상태 | 제작 방식 |
| --- | --- | --- | --- | --- |
| P0 | `steering_angle_sensor` | 핸들과 분리된 조향각 피드백 | 현재 핸들 모델로 오매핑 가능 | 포트가 있는 low-poly 코드 모델 + reference image |
| P0 | `wheel_accel_sensor` | 4코너 현가 거동/가속도 피드백 | 모델 없음 | 소형 센서·브래킷 코드 모델 |
| P0 | `coolant_temp_sensor` | 냉각수 온도 측정 | 모터 NTC와 혼용 | 센서·침지 포트 코드 모델 또는 명시적 센서 객체 |
| P0 | `gateway_ecu` | CAN 게이트웨이/통신 경계 | generic ECU로 대체 가능하지만 전용 표현 없음 | 커넥터가 보이는 ECU 모델 |
| P1 | `diagnostic_port` | 진단 장비 연결점 | 도메인 설명에는 있으나 전용 배치 없음 | 실내/하부 포트 모델 |
| P1 | `external_charger` | 충전 도입부 외부 장비 | 차량 모델 목록에 없음 | 차량 밖 충전기/케이블 3D 또는 그래픽 카드 |
| P1 | `coolant_chiller` | 배터리·구동계 냉각 회로 | 데이터에만 존재 | 열교환기 코드 모델 + 포트 |
| P1 | `brake_pedal_sensor_pack` | 브레이크 A/B 이중 센서 시각화 | 페달 하나로 축약 | 기존 brake pedal에 통합하거나 별도 센서 모델 |
| P2 | `instrument_cluster_v2` | reference와 동일한 곡면·다이얼·경고등 | 현재 모델은 단순 패널 | 기존 모델 개선 또는 신규 reference/코드 모델 |
| P2 | `adas_mounts` | 카메라/레이더 브래킷 | 센서 모델만 있음 | 차체 장착 브래킷 포함 모델 |

### 4.2 새 에셋 없이 인스턴스·배치만 추가할 항목

다음은 `partModels.ts`에 모델이 이미 있으므로, 우선 에셋을 새로 만들기보다 4코너 인스턴스와 실제 좌표를 추가하는 대상이다.

- 휠/허브
- 드라이브 샤프트
- 브레이크 캘리퍼
- 휠 속도 센서
- 코일 스프링
- 일반 댐퍼
- CDC 댐퍼
- 에어 스프링
- 차고 센서
- EVCC
- 충전구 잠금 액추에이터
- 전동 컴프레서
- PTC 히터
- EEV
- ADAS 카메라·레이더·ECU
- TCU
- 진단/주차 관련 ECU

### 4.3 3D 모델보다 명시적 신호/배선 표현이 필요한 항목

새 부품 사진을 만들 필요는 없지만, 화면에서 사라지면 안 되는 항목이다.

- CP/PP 충전 신호
- HVIL 루프
- 충돌 차단 신호
- CAN 메시지/게이트웨이 경계
- 브레이크 유압 4분기
- 냉각수 흐름과 열교환 루프
- 경고등·READY·기어 상태 표시

이 항목들은 포트 라벨, 색상 케이블, 신호 배지, 외부 장비 아이콘 중 하나로 명시한다.

## 5. 도메인별 렌더링 누락·오매핑 교차표

| 도메인 | 현재 렌더링되는 주요 항목 | 누락/축약/오매핑 | 수정 전 확인 |
| --- | --- | --- | --- |
| 구동 | APS, VCU, MCU/inverter, motor, reducer, differential, shaft, wheel | 기능 휠·반축 좌우 부족, shaft 회전축 오류 | 전륜 좌/우 토크 전달과 wheel spin |
| 고전압 전원 | START, BMS, contactor, battery, HV junction, isolation | HVIL·충돌 신호가 사라짐 | battery→contactor→inverter 연결 |
| 충전 | inlet, OBC, lock, EVCC 일부 | CP/PP, external charger, EVCC/lock 실제 좌표 부족 | 측면 포트 법선과 충전 경로 |
| 열관리 | NTC/thermal ECU/pump/valve/fan/radiator | coolant sensor 혼용, chiller·compressor·PTC·EEV 좌표 부족 | 실제 루프와 fan activation |
| 제동 | pedal, Brake ECU, modulator, line, caliper | A/B 센서 축약, caliper/sensor 1개, 4분기 부족 | 4륜 제동과 wheel-speed feedback |
| 조향 | steering wheel, torque sensor, EPS ECU/motor, rack | 운전석 반대, angle sensor 오매핑, rack 축 오류 | steering wheel→rack→좌우 전륜각 |
| 현가 | IMU, height sensor, chassis ECU, spring/damper/air | 4코너 부족, wheel accel sensor 없음, coil/air 사양 혼재 | 4코너 수직 거동과 센서 위치 |
| 변속·주차 | gear selector, VCU, park ECU/actuator/sensor, cluster | cluster 기준 오류 | P lock/position feedback |
| 차량 통합 | START, VCU, BMS, DC/DC, LV load | LV load가 cluster로만 축약 | 12V 배전과 HMI |
| 통신·진단 | CAN harness, generic ECU 계열 | gateway, diagnostic port, source/target ECU 위치 부족 | 메시지 경로와 진단 연결 |
| ADAS/HMI | camera/radar/ADAS ECU 모델 정의 | `PLACE` 없음, front mounting 없음, warning lamp 별도 없음 | 전방 시야·브레이크/VCU 요청·cluster 표시 |

## 6. 교차검증 실행 순서

수정 승인 후 다음 순서로 검수한다.

1. 단품 showroom: 모델 방향·anchor·reference image 비교
2. Hero 차량: 운전석/계기판 기준점과 차체 좌표 비교
3. 전체보기: 배터리·모터룸·4휠·현가·HMI의 상대 위치 확인
4. 도메인 11개 × 기능 4개: 체인별 누락/임시 좌표/오매핑 기록
5. 현가: 4코너 수량, 스프링·댐퍼 사양, height/acceleration sensor 위치 확인
6. 조향: 핸들 입력→컬럼→랙→좌우 전륜각의 축과 거동 확인
7. 구동: 배터리→인버터→모터→차동→좌우 반축→전륜 토크/회전 확인
8. 제동: 페달→모듈레이터→4캘리퍼 및 4 wheel-speed feedback 확인
9. 충전/열관리/ADAS/통신: 내부 부품과 외부 장비·신호가 화면에 명시되는지 확인
10. 16:9 브라우저에서 부품 돌출, 관통, 겹침, 라벨 충돌, 배선 관통 여부 확인

## 7. 현재 보류 상태

- 모델링 코드 수정: 보류
- 신규 에셋 생성: 보류
- 좌표·회전축 변경: 보류
- 도메인 렌더링 인스턴스 복제: 보류
- 이 문서와 `EV_MODELING_AUDIT_2026-11-16.md`를 기준으로 현가 사양과 필수 개수를 사용자 검수 후 확정

