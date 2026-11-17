# TraceBack EV Phase 0 구현 보고서

작성일: 2026-11-16  
상태: **Phase 0 제한 승인 범위 완료 / Phase 1 이후 승인 대기**

## 1. 수행 범위

이번 단계에서는 다음만 구현했다.

- `VehicleSpec` 타입과 기본 구조
- 기존 code-built 모델의 읽기 전용 metadata 추출
- 물리 인스턴스·assembly·signal object 분리
- instance ID·corner ID·assembly child 관계 정의
- missing model/anchor, duplicate ID, fallback placement, missing endpoint 검증기
- 기존 테스트 러너에 연결되는 Phase 0 단위 테스트

다음은 변경하지 않았다.

- 차량 좌표·회전·스케일
- `VehicleLayout.tsx` 렌더링 구조와 `PLACE`
- 기존 에셋과 모델 geometry
- STEP01~04 UI·학습 콘텐츠
- 시뮬레이션·고장 시나리오·정답 판정
- Phase 1~4 구현

## 2. 실제 변경 파일

| 파일 | 변경 내용 |
| --- | --- |
| `src/features/garage/vehicleSpec.ts` | Phase 0 데이터 계약, 현재 배치 감사 manifest, 60개 물리 인스턴스, 8개 assembly, 6개 signal object, 읽기 전용 모델 metadata 추출기, 검증기 |
| `tests/vehicle-spec.test.mjs` | 인스턴스/assembly/signal 분리, metadata 추출, 중복 ID, 누락 anchor, fallback, 누락 child/endpoint 검증 |
| `docs/PHASE0_IMPLEMENTATION_REPORT_2026-11-16.md` | 본 완료 보고서 |

기존 렌더링 파일과 모델 파일은 수정하지 않았다.

## 3. 신규 데이터 구조와 기존 코드의 관계

`vehicleSpec.ts`는 현재 Phase 0에서 독립적인 검증 계약으로만 동작한다. 아직 `VehiclePlatformOverview`, `layoutOf()`, `PlacedPart`에 연결하지 않았으므로 화면 렌더링 결과는 변하지 않는다.

```text
VehicleSpec
├─ physicalInstances[]  // wheel.fl, cdc_damper.rr, park_lock_actuator 등
├─ assemblies[]         // front_eaxle, front_strut, rear_beam, wheel_brake
├─ signalObjects[]      // ParkRequest, LockFeedback, CDCCommand, CP, PP, HVIL
└─ behaviorBindings[]   // Phase 0에서는 빈 배열. 실제 계산 연결을 주장하지 않음
```

읽기 전용 모델 추출기는 현재 `PART_MODEL_IDS`와 `getPartModel()`에서 다음만 복사한다.

- model ID
- size
- geometry center
- anchor ID 목록
- moving group의 axis/mode/pivot

geometry를 이동하거나 authored origin을 수정하지 않는다.

Phase 0 manifest에는 현재 코드 상태와 목표 인스턴스를 함께 기록하되, `observed`, `template`, `unverified`, `fallback`, `missing` 상태를 구분했다. 따라서 현재 한 개 템플릿만 있는 휠·현가 부품을 4코너 정상 배치로 오판하지 않는다.

## 4. 검증기 결과

현재 `PHASE0_VEHICLE_SPEC` 기준 결과는 다음과 같다.

| 항목 | 수량 |
| --- | ---: |
| 물리 인스턴스 | 60 |
| assembly | 8 |
| signal object | 6 |
| 읽기 전용 추출 모델 metadata | 68 |
| 오류 | 5 |
| 경고 | 28 |

오류 5건은 정상으로 숨기지 않고 다음처럼 남겼다.

1. `steering_angle_sensor`: 독립 모델/anchor 미확정
2. `coolant_temperature_sensor`: `evData.ts`에는 필요하지만 현재 독립 모델/배치 미확정
3. `evcc`: 현재 `layoutOf()` fallback 배치
4. `charge_lock_actuator`: 현재 `layoutOf()` fallback 배치
5. `park_pawl`: 전륜 e-axle 잠금 대상이지만 현재 확인된 geometry 없음

경고 28건은 다음 범주다.

- 휠·캘리퍼·휠속도센서·코일·CDC·반축·파킹 actuator/sensor의 코너 transform 미검증 24건
- `cdc_full_corner_option`용 wheel acceleration sensor 4건의 선택 모델 미확정

이 결과는 Phase 0 계약이 아직 화면을 “정상”이라고 판정하지 않는다는 의미다. 특히 fallback 좌표, 미확정 모델, 4코너 transform을 다음 단계의 수정 대상으로 넘긴다.

## 5. 테스트 및 빌드 결과

- 전체 테스트: **152 passed / 0 failed**
- Phase 0 추가 테스트: **5 passed**
- TypeScript + Vite build: **통과**
- Vite chunk-size warning: 기존 대형 bundle 경고만 존재하며 빌드 실패는 아님

추가 테스트는 다음을 실제로 검증한다.

- 물리 인스턴스와 signal object의 타입·목록 분리
- AC path만 정의되고 `DC.FastCharge`가 선언되지 않음
- authored model metadata를 읽기만 하는지
- fallback placement와 미확정 모델이 오류로 남는지
- duplicate instance ID 탐지
- 없는 mount anchor 탐지
- assembly child와 signal endpoint 누락 탐지

## 6. 기존 화면·게임 동작 불변 근거

- `VehicleLayout.tsx`의 `PLACE`, `layoutOf()`, `VehiclePlatformOverview`는 변경하지 않았다.
- `partModels.ts`, `PartModel.tsx`, `HeroConvertible.tsx`는 변경하지 않았다.
- `experiences.tsx`, `evData.ts`, `scenarios.ts`, `simModel.ts`는 변경하지 않았다.
- 기존 전체 테스트 152개가 통과하여 기존 시나리오·정답 판정·UI 계약의 회귀가 발견되지 않았다.
- 새 `vehicleSpec.ts`는 렌더러에서 import되지 않으므로 현재 화면에 영향을 주지 않는다.

## 7. Phase 1 착수 전 해결해야 할 문제

1. `steering_angle_sensor`를 핸들 모델과 분리할지, 통합형 센서 ring으로 표현할지 결정
2. `coolant_temperature_sensor`를 독립 3D 모델 또는 coolant loop signal/overlay로 표현할지 결정
3. EVCC와 charge-lock actuator의 실제 장착 위치와 외부 충전 경계 확정
4. Park pawl/parking gear를 e-axle assembly 내부 geometry로 추가할지, 교육용 mechanical lock overlay로 표현할지 결정
5. 4코너 휠·브레이크·현가·반축의 실제 transform과 local axis 검증
6. 기본 CDC를 preview/B2로 유지하고, `cdc_full_corner_option`의 코너 센서 범위를 승인
7. assembly collapsed/expanded 모드의 geometry ownership 확정

위 문제는 Phase 1에서 좌표·에셋·렌더링을 수정하기 전에 해결되어야 한다. Phase 1 이후 구현은 별도 승인 없이는 진행하지 않는다.
