# TraceBack v14 — 재사용 코드 선별 및 교육·검증 평가 (2026-11-03)

## 출처와 범위
- 원본: `TraceBack_IntegratedControl_v14_FULL_SOURCE.zip` (실제 ZIP 항목과 소스 내용 확인).
- 원본 전체에서 **핵심 엔진**과 **기존 시뮬레이션 참고 자료**를 의도적으로 분리했다. 둘 다 신규 구현/수정이 아니라 기존 파일을 그대로 복사한 선별본이다.
- 이 ZIP은 **실행 가능한 완성 게임이 아님**. UI, 에셋, 빌드 구성, npm 의존성을 제외했다. 기존 import 경로를 가능한 한 그대로 유지했다.
- 전용 코드를 수정하지 않았으며, 코드 검증 결과는 기존 v14 보고서와 별도로 아래 명령으로 확인한다.

## 핵심 코드
- `src/campaign/*Model.ts`: BMS, HV, VCU/VehicleMode, Gear, Propulsion, Braking, EPS, Thermal, LV, 통신 진단, 통합 시간축 실행기
- `src/campaign/vehicleSystems.ts`: 기존 API/선택형 어댑터. **통합 후 legacy 여부 결정해야 하므로 삭제 금지**.
- `src/campaign/signalBlocks.ts`, `domainTraining.ts`, `traceComparison.ts`: 블록 평가/교육 조건/기존 비교 로직. **통합 직접 연결은 확인되지 않음**.
- `src/engine/*.ts`: 그래프·시뮬레이션·검증·시간/레지스트리 모듈.
- `src/engineering/torqueModel.ts`, `torqueSpec.ts`, `actuator-lab/*.mjs`: 기존 토크 블록/액추에이터 학습 엔진. **v14 엔진과 통일이 필요함**.
- `tests/*`: 선택한 도메인·엔진 회귀 테스트. 원래 파일을 복사했으며 모두 단독 실행 가능하다는 보장은 없다.

## 추가 선별 참고 ZIP
- `simulation/src/runtime`: 과거 별도 시뮬레이션 실행기, 고장 주입, 조사/검증 기능, 물리·차량제어 어댑터
- `simulation/c/vehicle_sw`: C 차량 SW 예제
- `simulation/tests`: 관련 테스트 소스
- `simulation/docs/reference_vehicle`: 74 LF 등 기능/검증 요구사항 기반 문서. **REVIEWED_DRAFT, DESIGN_ONLY 같은 상태 표시는 실제 구현 완료가 아니다**.
- 이 참고 ZIP 역시 게임 전체의 의존성이나 import 경로까지 완결시키지 않는다.

## 기술·교육적 검토
1. **개별 도메인 범위는 넓음**: BMS→HV→VCU→Gear→Propulsion, Braking, EPS, Thermal, LV, 공통 진단이 존재한다.
2. **차량거동 모델과 ECU 명령 사이 공백**: v14 종방향 가속도는 참고 추정이고 게임 속도/위치·타이어 힘·요율·하중 이동을 직접 업데이트하지 않는다. 동일한 구동/제동 결과가 레이싱 차량의 동특성으로 반영되는 E2E 증거 부족.
3. **소스가 여러 세대의 실행기를 병렬 보유**: campaign integrated, legacy vehicleSystems, engineering torqueModel, actuator-lab, simulation runtime. 한 개가 canonical 실행기라는 연결 계약이 필요.
4. **검증은 자동 테스트 이상이어야 함**: 요구사항 ID↔결함↔관측 가능한 증거↔고장 주입↔시퀀스 TC↔기대값 oracle↔PASS/FAIL↔수정 전/후 비교↔회귀로 이어지는 경로를 구현해야 함. 기존 simulation 문서는 이미 상세하게 설계돼 있으나 실제 실행기 연결 상태 확인 필요.
5. **안전한 결론 범위**: 교육용 모델이며 특정 OEM 로직/기능안전 인증/HIL/실차 데이터가 없다. 수치 보정값은 예시이고 검증 oracle의 출처가 될 수 없다.

## 게임에서 꼭 보여줄 검증적 경험
- 사건 1 가속 불량: 단순히 '가속이 안 됨'이 아니라 **잘못된 토크 제한 계산**과 **정상 BMS 출력 제한**을 별도 가설로 제시. 페달 A/B, BMS limit, Gear, VCU, Torque request/command/actual trace로 구별.
- 사건 2 냉각 이상: **팬 ON/OFF 히스테리시스 오설정** vs **팬 모터 고착**. 온도·ECU 명령·실제 팬 응답·토크 derate를 시간 그래프로 대조.
- 선택 사건 3 제동: **높은 SOC로 정당한 회생 감소** vs **마찰 보완 로직 누락**. 총 제동 요구 vs 실제 제동력과 부족분 측정.
- 플레이어는 원인 추정 → 논리 블록 복원 → 정상/경계/고장 test vector 선택 → 기준과 수정안 동시 실행 → 관측 증거로 승인 여부 판단. 정답 텍스트만 바뀌어서는 안 됨.

## 미완료 우선순위
P0: 하나의 수치·단위·시간축/신호 소유권 표 정의 → 블록 편집을 실제 ECU 계산에 반영 → 쌍둥이 시험대 oracle의 독립성 확보 → 수정 전후 자동 비교 → 게임 실제 주행값 반영.
P1: req-ID/TC-ID/coverage, 경계·고장·복귀 케이스, Fault Injection 지점과 인과관계 로그.
P2: 기능 안전 일반론, 센서 전원/네트워크 타임아웃 사례, ABS/TCS/ESC 및 차체 운동의 교육용 범위 결정.

## 범위 판단
**전기차 기초 제어는 핵심 10개 계열에 걸쳐 있으나 '차량 거동에 필수적인 모든 도메인'을 구현한 것은 아니다.** 차체 운동/타이어·노면, ABS/TCS/ESC, 동력 전달 기계계, 가상 모터 인버터/회전 동특성, 실제 네트워크, 센서/시간 스케줄링 등의 완성도는 별도 검토가 필요하다. 기존 `simulation`에 관련 예제는 있지만, 그것들이 v14와 하나로 실행되었다는 증거는 없다.
