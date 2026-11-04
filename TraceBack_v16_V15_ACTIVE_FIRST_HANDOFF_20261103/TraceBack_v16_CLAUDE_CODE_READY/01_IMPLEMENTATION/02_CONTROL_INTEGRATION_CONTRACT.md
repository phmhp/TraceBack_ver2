# Control / Plant / Game integration contract

## v14 사실
`stepIntegratedVehicle`는 BMS→Thermal→HV→VCU→Gear→LV→Propulsion→Brake→EPS와 플랜트 응답을 20ms 기본 dt로 계산. `measured`=전 샘플 측정, `ecu`=이번 계산 명령, `actual`=명령 반영 후 응답. `actual.accelerationEstimateMs2`는 고정 가정의 교육용 가속도 추정이며 게임 속도·위치 업데이트 아님. 자동차 실제 차속·회전수는 외부 입력. 이중 엔진 `TorqueModel` 및 game graph와 통합되지 않음.

## 필수 통합
`DriverInput`(pedal A/B, brake, steering, gear, START) -> `VehicleControlAdapter.step(dt, sensors, priorControlState, activeProgram)` -> `ControllerCommand`(motor torque Nm, regen/friction N, steering assist status, limits) -> `GameVehiclePlant.step(dt, commands, collision/road)` -> `GameVehicleState`(speed m/s, position m, heading rad, lateral response, wheel indicators if supported) -> 다음 control sensors. **단위 변환 명시**.

차량 운동은 경량 Bicycle/aracde yaw model 가능; 적어도 (1) 가속 증가, (2) 브레이크 감속, (3) 조향 선회, (4) 충돌 반응이 실제 입력/제어 제한을 반영해야 함. 정교한 타이어 접지/ABS/TCS/ESC는 별도 교육용 추가 범위로 표시. `EPS assistTorque`는 steering angle 아님. 게임 모델이 현실 차량 안전 물리 모델인 듯 주장 금지.

## 실행/상태
- 고정 시간축(예 20ms 모델)과 render fps를 분리. 동기화·누적 스텝·일시정지 규약 정의.
- 운전 입력 미수신, 미검증 센서, gear P, READY 미진입 시에도 게임 시작 불가에 빠지지 않도록 튜토리얼 시동 시퀀스/명시적 데모 조작 처리. 보호 로직을 우회하는 임의 패치 금지.
- reference, faulty, repaired는 같은 initial state/deep clone, same input vector, same clock/seed. trace에는 input/measured/ecu/actual/vehicle timestamp를 분리 저장.
- comparator는 테스트별 요구값, 허용 오차, 진입 지연, 지속 시간, 종료 조건에 따라 독립 판정. 기대값이 아직 미검증이면 UNKNOWN, PASS 금지.
- v14 현재 `plantFaults`는 물리 응답용. SW 로직 편집→v14 통합 제어 계산 변화는 `controlMutationHook` 또는 명시적 Strategy Adapter로 안전한 제한된 포인트에만 적용. 보호 차단 우선순위 유지. 실제 출력 변화를 자동 시험으로 확인.
- 새 v15+ 등 코어 교체 시 타입/의미·단위·상태전이·시나리오 회귀 자동 확인. 불일치시 어댑터 호환 실패 보고.

## 종료/정상 검증 경계
실제 ECU/HIL/MIL/SIL/PIL/양산 안전 인증 성과라 주장 금지. game runtime은 교육용 모델로 명시.
