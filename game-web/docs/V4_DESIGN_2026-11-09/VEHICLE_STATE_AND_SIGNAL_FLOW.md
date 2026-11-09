# 차량 상태와 흐름

## 상태 전이

```text
OFF
 → LV_WAKE
 → READY_REQUESTED
 → INTERLOCK_CHECKED
 → HV_AVAILABLE (지원 모델에서만)
 → DRIVE_ENABLED
 → DRIVER_INPUT
 → TORQUE_REQUESTED
 → INVERTER_COMMAND
 → MOTOR_TORQUE
 → WHEEL_RESPONSE
```

대표 교육 흐름이며 실제 사건/도메인 데이터가 허용하는 상태만 사용한다. 임의 수치를 OEM 사실처럼 표현하지 않는다.

## 흐름 종류

| 종류 | 예 | 표시 규칙 |
|---|---|---|
| LV/센서 | 스위치 전원, 센서 값 | 얇은 실선, 중립 청록 계열 |
| CAN/제어 | 요구·명령·상태 | 점선 또는 펄스, 파랑 계열 |
| HV 에너지 | 배터리→인버터→모터 | 굵은 실선, 주황/황색 계열 |
| 기계 토크 | 모터→감속기→바퀴 | 이중선/회전 마커, 갈색 계열 |
| 피드백 | 속도·온도·압력 반환 | 역방향 점선, 녹색 계열 |

## 실행 규칙

- 첫 진입은 모든 활성 흐름과 액추에이터가 정지한 OFF 상태다.
- 선행 조건이 충족된 구간만 활성화한다.
- 흐름이 노드에 도달한 뒤에만 다음 노드/액추에이터가 반응한다.
- Vehicle/System, E/E, Control Software는 같은 `GarageInteractionState`를 읽는다.
- 입력을 놓으면 순간 입력은 0으로 돌아가되 토글 조건(READY, 기어)은 명시된 상태로 남는다.

## 기존 코드 연결

- `INPUT_MISSION`: 도메인별 조건과 조작.
- `activeStep`: 현재 도달 단계.
- `VehicleLayoutRig`, `EeBlueprint`, `SimulinkDiagram`: 동일 상태의 다른 표현.
- `vehicleSim.ts`: 실제 주행 상태와 추적 로그. 차고 상태와 공유할 수 있는 최소 인터페이스를 추출한다.

