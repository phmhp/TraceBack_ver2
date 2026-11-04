# TraceBack v15 — v14 누적 + 교육용 차량 운동/안정화 제어

## 목적 및 한계
- **교육용**: 기초 BEV 제어 골격을 실행하고 테스트하기 위한 결정론적 모델. 특정 OEM 양산 로직, 실차 검증, HIL, 기능안전 인증을 재현하지 않음.
- v14의 BMS/HV/VCU/Gear/Propulsion/Braking/EPS/Thermal/LV/Diagnostics는 **원본 그대로 보존**.
- v15 추가 파일은 `src/campaign/motionControlModel.ts`, `src/campaign/integratedMotionModel.ts`, `tests/motion-control-educational.test.mjs`.
- 기본 실행 주기 20ms, 순수 계산, 상태 명시, 이전 샘플 피드백 사용. 위치 단위 m, 속도 m/s, 각도 rad, 힘 N, 토크 Nm.

## 구현 범위
1. 종방향 차량 운동: 실사용 가능한 가속/제동력 → 속도·위치; 공기·구름·경사 저항을 모델링.
2. 횡방향 차량 운동: 앞바퀴 조향각 → 타이어 횡력 → 요율·방향·위치; 저속·노면 마찰력 제한.
3. 네 바퀴의 회전속도 및 간략 슬립, 차륜별 종방향 힘, 마찰원 근사.
4. 교육용 ABS: 각 바퀴 제동 슬립 판정, 해제·복귀 이력, 제동력 조정.
5. 교육용 TCS: 후륜 구동 휠 슬립 판정, ECU 구동 상한 제한, 복귀.
6. 교육용 ESC: 목표 요율과 실제 요율 비교, 비대칭 후륜 제동 요구와 실제 요율 반영.
7. 기존 v14 ECU 실제 모터 토크/회생·마찰 제동 응답과 샤시 모델 연결, 샤시 차속 피드백으로 v14 ECU 갱신.
8. 센서 측정 나이 기반 감독 제어 비활성·진단 표기, 일부 가상 고장 입력.

## 중요 구분
- `IntegratedVehicleResult.ecu`: SW 판단 및 **명령**.
- `IntegratedVehicleResult.actual`: v14 교육용 액추에이터의 **실제 응답 추정**.
- `IntegratedMotionResult.chassis`: 해당 응답과 노면 상태를 넣어 계산한 **가상 차체 반응**.
- `IntegratedMotionResult.telemetry`: 게임 HUD와 단서 수집용 결과. 물리센서 실측값이나 검증된 실제 차량의 trace가 아님.
- EPS 모터 보조 토크는 조향각이 아님. `steerRoadWheelRad`는 **기계적 앞바퀴 조향각**을 게임 입력(운전자의 핸들 입력에서 기구적으로 변환)으로 별도로 공급해야 함.
- v14 구동 로직은 전진 D만 제공. 현재 v15의 운동은 **전진 전용**이며 실제 후진 동역학은 아직 미구현.
- v14 Brake Model은 총 제동력을 회생/마찰로 나누며, v15는 이를 **차륜별로 단순 균등 배분**; 실제 전후 제동력 배분/EBD/브레이크 유압 회로는 아님.
- 타이어는 평형 슬립 기반 toy approximation이고 실제 Pacejka tire, 횡하중 이동, 댐퍼/서스펜션, 노면 공간 분포, 복잡한 6-DOF를 구현하지 않음.
- ABS/TCS/ESC 개입은 입문용 임계값+히스테리시스 수준이며 실제 폐루프 제어기 검증 수준 아님. 보호 설계는 생산 적용 불가.
- ESC 차동제동은 비대칭 후륜 제동력을 간략 모델에서 작용시키며, 휠별 유압 ECU 인터페이스는 없음.
- `absIntervention`은 기존 v14 브레이크 로직으로 전달되므로 ABS 시 회생제동이 제한됨.
- 로직 편집 블록이 기존 v14 ECU 코드를 실제로 재구성하는 **SW mutation/patch 실행 기능은 여전히 미구현**. UI가 계산을 바꾸려면 별도 안전한 삽입 지점과 테스트 오라클 필요.

## 실행 예제
```ts
import {createIntegratedMotionState,stepIntegratedMotion} from './src/campaign/integratedMotionModel.ts';
import {createNormalIntegratedInput} from './src/campaign/integratedVehicleModel.ts';
let state=createIntegratedMotionState();
const vehicle=createNormalIntegratedInput();
vehicle.brakePedalPct=10;
for(let tick=0;tick<70;tick++){
  vehicle.startEdge=tick===0;
  const r=stepIntegratedMotion(state,{vehicle,steerRoadWheelRad:0,roadMu:.85});
  state=r.state;
}
// 이후 vehicle.requestedGear='D', D 전환 확인 후 brake=0, pedalA/B=... 를 단계별로 실행.
// 반드시 실제 상태·기어 피드백과 차량 제한을 확인.
```

## Claude Code 연동 규칙
1. `TraceBack_v15_COMPLETE_EDU_CONTROL_CORE.zip`을 **v14 누적 대체본**으로 사용하되, 프로젝트 기존 게임 UI/레이싱 엔진을 자동으로 덮어쓰지 말 것.
2. 주행 물리의 **소유자는 정확히 하나**여야 함. 새 샤시 모델과 다른 Three.js/R3F 물리 엔진을 동시에 적분하면 이중 적용됨. Three.js는 `telemetry`의 위치·방향을 **렌더링만** 하도록 할 것.
3. 게임 입력 → 실제 앞바퀴 조향각, 가속·제동 페달, v14 차량 상태 요청 → `stepIntegratedMotion` → 샤시 위치/방향/속도 → 다음 주기 피드백.
4. 그래픽 프레임 주기와 ECU 고정주기 20ms를 분리하고 고정 스텝 accumulator 사용. 일시정지 시 ECU/샤시 시뮬레이션도 함께 정지.
5. 신호/수치는 생성 모델 버전을 포함해 기록. `TEST_PASS`는 요구사항과 독립적으로 정의된 오라클을 충족한 경우에만.
6. 현재 미지원 항목(후진, 정확한 휠별 제동압, 실차 파라미터, 실험적 조향 rack ratio/force feedback, SW decision mutation, 차량 충돌 물리)은 `NOT_IMPLEMENTED` 또는 `PARTIAL`로 보고.
7. 이 엔진의 간이 시뮬레이션 결과를 실제 OEM 측정 데이터로 표기하지 말 것.

## 검증
`node --experimental-strip-types --test tests/motion-control-educational.test.mjs`
- 15/15 PASS (결정론, 유효 범위, ABS/TCS/ESC 개입, 타이어 접지력 제한, 통합 START→READY→D→주행/선회).
`node --experimental-strip-types --test tests/*.test.mjs`
- 338 tests, 336 pass, 2 test-file loader failures due to selective archive missing `src/content/ready.ts` (existing v14 limitation; actual logic assertion failures from new module: 0).
- Node.js v22.16.0에서 검증. 전체 게임 TypeScript bundler build / 브라우저 3D / 실차 모델 검증은 수행하지 않음.

## 후속 엔지니어링 우선순위
P0: 실제 게임 물리 소유권·입력 단위 계약 확정 → 로직 mutation → 사건별 독립 오라클 / trace.
P1: 후진과 운전자 조향각/전륜 조향각 기구 관계, 타이어·제동 분배 및 고장 시 보수적 동작 검증.
P2: 고급 ESC·EBD/EPB·hill hold·실제 ECU 통신·진단 프로토콜, 실시간 HIL 등은 학습 목표에 따라 추가.
