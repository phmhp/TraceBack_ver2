# TraceBack 액추에이터 경량 로직 엔진 v1

## 목적
HW 입력(센서) → ECU 소프트웨어 판단 → 제어 명령 → 액추에이터의 **명령 추종/응답** 검증. 실제 차량 운동·배터리 전기화학·안전인증·HILS/실차 검증을 수행하지 않는다.

## 기존 ZIP에서 확인한 재사용 자산
- `src/engine/graph.ts`: boolean 로직 그래프 연결, 유효성 검사, 순환 검출.
- `src/engine/simulation.ts`: Boolean 상태 전이·시간 스텝.
- `src/engine/verification.ts`: 요구 출력과 실제 출력을 비교.
- `simulation/src/runtime/SimulationRuntime.ts`: 차량 게임 물리 및 개별 제어 모델을 별도로 보유.

## 이번 추가 코드
- `src/engineering/actuator-lab/engine.mjs`: 독립적인 신호·포트 연결 검사, 계층 레지스트리의 예시, 결정론적 액추에이터 출력 계산, 고장 주입, 기대값 비교.
- `examples.mjs`: 가속 제어와 제동의 두 가지 예시. 수치는 교육용 정규화 값이며 자동차 제어기 사양이 아니다.
- `tests/actuator-lab.test.mjs`: 기본·고장·오연결·누락 검증.

## 기능적 구분
- Powertrain은 상위 시스템, Propulsion은 기능 도메인. 기존 Propulsion 이름을 모두 Powertrain으로 치환하지 않는다.
- registry는 **예시 스켈레톤**으로, 기존 74개 기능의 완전한 마이그레이션이 아니다.
- 포트 유형: boolean, normalized, celsius, command. 단위의 상세 의미와 실제 ECU 포트 배정은 후속 결정.

## Claude Code 활용 설계
1. 사용자가 부품/배선을 조작하면 `validateNetwork()`로 검사.
2. 기억 복원 퍼즐에서 고른 SW 로직 규칙을 `runScenario(scenario,{logic})`에 전달.
3. 각 테스트 스텝의 `trace[].values`에 기록된 센서/ECU/액추에이터 값을 따라 3D 신호 애니메이션 재생.
4. `verdict`가 PASS면 **교육용 미니테스트 통과** 표시; 실제 차량 안전 검증 성공으로 해석 금지.
5. 고장 탐정 게임에서는 결함 원인을 즉시 공개하지 말고 단서를 단계적으로 해금.

## 아직 구현되지 않은 사항
- 각 ECU의 실제 물리·진단 모델, DTC 확정, CAN 프레임, CRC, 주기 스케줄링, 타임 기반 동특성.
- BMS/전원/열관리/조향/기어/충전 등의 완성된 동작 시나리오 및 전체 74 LF 레지스트리.
- 시나리오별 복수 ECU, 시뮬레이션 상태 영속화, UI/3D 씬 연결.
- 실제 차량 동작과의 검증 및 공식 레퍼런스 모델 비교.
- 정규화값과 포트 타입을 시나리오별 물리 단위로 변환하는 계약.

## 실행 방법 (Windows PowerShell)
`node --test tests/actuator-lab.test.mjs`

기존 ZIP의 전체 테스트·빌드는 실행하지 않았으며, 이 신규 모듈의 독립 테스트만 수행함.
