# TraceBack EV 제3자 관점 모델·렌더링 전수검수

작성일: 2026-11-16  
범위: 현재 `game-web` 소스, Phase 0 `VehicleSpec`, 정비소 3D 렌더 경로, 1600×900 캡처  
원칙: 코드 확인·화면 확인·거동 확인·공학적 추론을 구분한다.

## 1. 판정 요약

현재 정비소 화면은 “차량 전체의 문맥용 차체·휠”과 “기능 체인의 물리 부품”이 서로 다른 렌더 경로를 사용한다. 따라서 화면에서 휠이 4개 보인다는 사실만으로 각 기능의 반축·캘리퍼·휠속도센서·현가 부품이 4코너에 모두 배치됐다고 판정할 수 없다. 이번 보강으로 기존 인덱스 fallback을 타던 code-built 모델에는 명시적 교육용 패키징 좌표를 추가했지만, authored origin·anchor·bounding box의 공학적 검증 완료를 의미하지는 않는다.

현재 판정은 다음과 같다.

| 항목 | 판정 | 근거 |
|---|---|---|
| 차량 기준축 | 코드 확인 | `VehicleLayout.tsx`, `vehicleTransforms.ts` |
| 문맥 휠 4개 | 코드 확인 | `CarContext`가 전후 차축·좌우 위치를 순회 |
| 기능 체인의 휠 | 단일 템플릿 | `PLACE.wheel` 1개; drive에서는 중복 방지를 위해 숨김 |
| 전륜 반축 | 시각 링크 2개, 에셋 인스턴스는 별도 검증 필요 | `DrivelineTopology`의 좌우 링크와 `SupportPart` 2개 |
| 스프링·CDC | 데이터 계약과 렌더러 코너 확장 연결 | `expandCornerNodes()`가 현재 템플릿을 4코너로 확장하나 authored mount/pivot 검증은 남음 |
| 핸들 방향 | 미확정 | 회전값은 축 가정에 따라 계산됐지만 authored local axis의 화면 검증이 남음 |
| 계기판 위치 | Hero 기준점과 코드상 일치, 화면 판정 보류 | authored origin·bounding box·시선축 검증 필요 |
| 필수 부품 누락 | 있음 | 조향각 센서·냉각수 온도센서·park pawl 및 다수 optional/신호 항목 |

## 2. 기준 좌표와 변환

코드에서 사용하는 기준은 다음과 같다.

- X: 차량 좌우
- Y: 지면 기준 높이
- Z: 차량 전후
- 차량 전방: -Z
- 전륜 차축: Z=-1.18 m
- 후륜 차축: Z=+1.16 m
- 좌우 휠 중심: X=±0.745 m
- 휠 중심 높이: Y=0.34 m
- 정비소 리그 부모: 위치 `[0,-0.25,0]`, Y축 회전 `-0.18`
- 정비소 단위 배율: 1.53 units/m

`heroToGarageWorld()`는 Hero 기준점을 정비소 단위로 변환하고 부모 회전·위치를 적용한다. 이 함수는 부모 변환을 계산하지만, 현재 `PlacedPart`는 authored origin을 별도 mount anchor로 보정하지 않고 `group position=PLACE.p`, `group rotation=PLACE.r`로 배치한다. 따라서 `model.center`와 authored origin이 다르거나 모델 내부 pivot이 회전축이 아니면 최종 형상은 추가 검증이 필요하다.

## 3. 휠·구동계 전수검수

### 3.1 코드상 확인된 사실

`CarContext`는 다음 네 위치를 순회한다.

| 인스턴스 | X | Y | Z | 운동 |
|---|---:|---:|---:|---|
| front-left | -0.745 | 0.34 | -1.18 | 휠 회전, 전륜 조향 |
| front-right | +0.745 | 0.34 | -1.18 | 휠 회전, 전륜 조향 |
| rear-left | -0.745 | 0.34 | +1.16 | 휠 회전 |
| rear-right | +0.745 | 0.34 | +1.16 | 휠 회전 |

따라서 문맥용 전륜이 차량 중앙에 배치된 것으로 코드상 확인되지는 않는다. 다만 기능 체인의 단일 `PLACE.wheel`은 `[+0.745,0.34,-1.18]`이고, 기능 체인 노드를 그대로 함께 렌더링하면 한쪽 전륜만 나타나거나 문맥 휠과 중복될 수 있다. 현재 drive 화면은 이 단일 휠을 숨기고 문맥 휠을 사용한다.

`DrivelineTopology`는 다음을 시각 링크로 만든다.

`motor → reduction gear → differential → 좌우 shaft centre → 좌우 front hub`

좌우 `drive_shaft` 모델도 `SupportPart`로 두 개 생성한다. 그러나 CV joint, hub carrier, knuckle, 출력 플랜지의 독립 형상은 현재 topology에서 확인되지 않는다. 따라서 “토크 경로를 교육용 선으로 보여준다”는 판정과 “실제 e-axle 조립체가 완성됐다”는 판정은 분리해야 한다.

### 3.2 구동계 판정

- 전륜 단일 모터·감속기·차동기어: 코드상 하나의 교육용 경로가 있음.
- 좌우 반축: 코드상 두 방향이 있으나 mount anchor와 현가·조향 운동 중 연결 유지 여부는 미검증.
- 휠 회전: `ContextWheel`의 X축 회전이 입력 후에만 동작.
- 기능 체인 휠 수량: 1개 템플릿. 4코너 물리 인스턴스 계약과 실제 `VehicleLayout` 소비가 연결되지 않음.
- 전륜 위치가 화면에서 중앙처럼 보이면 카메라·차체 문맥과 단일 기능 노드의 혼용 여부를 먼저 확인해야 하며, 좌표를 임의 이동해서는 안 됨.

## 4. 조향계·계기판

현재 의도된 topology는 다음과 같다.

`steering wheel → column → EPS → pinion → rack → 좌우 tie-rod 표현 → front hub`

`SteeringTopology`는 wheel, column, EPS, pinion, 좌우 rack endpoint, 좌우 hub 사이를 `MechanicalLink`로 표시한다. 실제 `steering_knuckle`와 tie-rod의 독립 모델 인스턴스는 현재 정비소 렌더 경로에서 확인되지 않는다.

### 4.1 핸들

현재 `PLACE.steering_wheel`은 Hero 운전석 기준 `[-0.31,0.86,-0.17]`에 있고, authored local X축을 `STEERING_COLUMN_AXIS=[0,-0.42,-0.91]`에 맞추는 회전을 계산한다. 이 회전은 “모델 local X축이 column 축이다”라는 전제에 의존한다. `partModels.ts`의 바퀴 모델은 local X축으로 만든 형상이지만, 실제 화면에서 핸들 면의 법선·손잡이 방향이 Hero와 같은지 아직 직접 판정하지 않았다.

따라서 현재 핸들 방향은 **수정 완료가 아니라 축 전제 검증 대기**다. local axis, geometry center, authored origin, column anchor를 확인한 뒤 회전을 확정해야 한다.

### 4.2 계기판

현재 정비소 `PLACE.instrument_cluster`는 `[-0.40,0.82,-0.30]`, 회전 `[-0.25,0,0]`이며 Hero의 cluster 그룹도 같은 기준점을 사용한다. 이는 코드 기준점 일치의 근거다. 그러나 cluster 모델의 authored origin과 bounding box, 운전자 시선 방향, 핸들과의 간섭은 별도 화면 확인이 필요하다. 코드 기준점이 일치한다고 해서 화면상 높이·틸팅이 정상이라고 판정하지 않는다.

## 5. 현가·제동 수량 검수

### 5.1 데이터 계약과 실제 렌더링의 차이

Phase 0 `VehicleSpec`에는 다음 코너별 물리 인스턴스가 정의돼 있다.

| 부품 | 계약 수량 | 현재 렌더링 판정 |
|---|---:|---|
| wheel | 4 | 문맥 휠 4; 기능 체인 템플릿은 1 |
| brake_caliper | 4 | 코너 인스턴스 계약, `PLACE`는 1개 템플릿 |
| wheel_speed_sensor | 4 | 코너 인스턴스 계약, `PLACE`는 1개 템플릿 |
| coil_spring | 4 | 계약은 4, 렌더 배치표는 단일 템플릿 |
| cdc_damper | 4 | 계약은 4, 렌더 배치표는 단일 템플릿 |
| halfshaft | 2 | `DrivelineTopology`에서 좌우 2개 시각 링크/모델 |
| wheel acceleration sensor | 4 optional | 현재 모델·배치 없음 |
| ride-height sensor | 사양에 따라 결정 | 현재 독립 코너 인스턴스와 렌더 배치 연결 없음 |

현재 렌더러는 `expandCornerNodes()`에서 brake caliper, wheel-speed sensor, coil spring, damper, CDC damper, air spring, ride-height/height/position sensor 템플릿을 FL/FR/RL/RR 네 위치로 확장한다. 이로써 화면 인스턴스 수량은 보강됐지만, 각 모델 authored origin·mount anchor·회전 pivot이 실제 장착점인지 확인된 것은 아니다.

`VehiclePlatformOverview`는 전체보기에서 중복을 줄이기 위해 `wheel`, `drive_shaft`를 체인에서 제외하고, 구동 topology와 문맥 휠을 별도로 렌더링한다. 4코너 부품은 이제 코너 확장 경로를 거치지만, assembly 단위 collapse/expand와 개별 부품의 geometry owner를 완전히 통합한 것은 아니다.

### 5.2 현가 사양 충돌

현재 기준 프로파일에는 `coil_cdc_base`, `air_cdc_option`, `cdc_full_corner_option`이 함께 존재한다. 그러나 `air_cdc_option`이 실제 `VehicleLayout` 렌더링 프로파일 선택으로 연결되지는 않는다. 또한 코일 스프링 기본 차량에서 compressor/air spring을 함께 렌더링하면 능동 차고 제어와 수동 코일 현가가 혼용될 수 있다. 기본 코일+CDC와 선택형 air+CDC를 화면·신호·부품 수량에서 분리해야 한다.

## 6. Phase 0 검증기 실제 결과

현재 실행 결과:

- physical instances: 62
- assemblies: 8
- signal objects: 6
- errors: 3
- warnings: 30

### 오류 3건

1. `steering_angle_sensor`: 독립 모델 없음
2. `coolant_temperature_sensor`: 독립 모델 없음
3. `park_pawl`: 독립 모델 없음

### 경고 28건의 핵심 묶음

- wheel, brake_caliper, wheel_speed_sensor: 각 4개 코너 placement 미검증
- coil_spring, cdc_damper: 각 4개 코너 placement 미검증
- halfshaft 2개: 좌우 placement 미검증
- park lock actuator/position sensor: placement 미검증
- EVCC, 충전구 잠금 액추에이터, AC 컴프레서, PTC, EEV, ADAS, TCU: 명시 좌표는 있으나 authored anchor/bounding box 미검증
- wheel acceleration sensor 4개: 선택 프로파일용 모델 없음

### 도메인 역방향 대조에서 확인된 미등록·오매핑

- `accel_pedal`, `chiller`
- brake pedal A/B 표현은 현재 단일 `brake_pedal`/`brake_ecu`로 축약
- steering knuckle, gateway ECU, diagnostic port, TCU
- ADAS camera/radar/ECU
- coolant temperature sensor
- `전륜`, `PRND 센서`, `START 버튼`, `프리차지 저항`, `Brake ECU`, `ABS ECU`, `유압 라인` 등은 현재 규칙으로 물리 인스턴스가 직접 해석되지 않음

이는 모두 신규 에셋이 즉시 필요하다는 뜻은 아니다. 통합 부품 내부 표현·신호 객체·아이콘 오버레이로 충분한 항목과 독립 모델이 필요한 항목을 다음 구현 승인 전에 분리해야 한다.

## 7. 이번 UI 반영

이번 단계에서 반영한 내용은 차량 물리 좌표를 임의 변경하지 않고 다음으로 제한했다.

- 전체보기 진입 시 중복 도메인 레일·기능 선반·하단 진행영역을 숨기고 E/E식 아키텍처 캔버스를 주 화면으로 확장.
- 아키텍처 전체보기에서 그룹·입력·출력·협조 신호를 한 계층으로 정리.
- 도메인·3D 부품 hover 글꼴을 Pretendard로 고정하고 흰색 glyph keyline을 추가.
- 긴 기능 라벨을 ellipsis로 자르지 않고 두 줄로 표시.
- `영향을 줬어요/영향을 주지 않았어요`, `후보에 올려요/후보에서 빼요`를 왼쪽 화살표 + 오른쪽 텍스트로 통일.
- “첫 편차 발생 의심 구간 보기” 토글 버튼의 폭을 고정.
- 추리 시간 문구를 `추리 중 (추리 중에는 시간이 천천히 흘러요!)`로 변경.
- 레벨 지도 SVG가 레벨 버튼의 포인터 hit-test를 가리지 않도록 pointer-events를 차단하고, 레벨 버튼을 명시적 상위 hit layer로 고정.
- 정비소 선택 기능에서 코너 부품 템플릿을 네 바퀴 위치로 확장.
- 기존 code-built EVCC·충전 잠금·열관리·ADAS 모델에 인덱스 fallback 대신 명시적 교육용 패키징 좌표를 부여.

## 8. 신규 에셋 필요성

현재 `partModels.ts`에 이미 존재해 재배치만 가능한 모델:

- EVCC, 충전구 잠금 액추에이터
- 전동 컴프레서, PTC 히터, EEV
- 전방 카메라·레이더, ADAS ECU, TCU
- 차고 센서 계열(`height_sensor`/`position_sensor`)

현재 독립 모델이 확인되지 않아 신규 제작 또는 통합 표현이 필요한 항목:

| 항목 | 추천 표현 | 신규 3D 에셋 |
|---|---|---|
| steering-angle sensor | column/torque sensor 내부 통합 + 센서 링 오버레이 | 선택 |
| coolant temperature sensor | 냉각수 라인에 소형 센서 아이콘/프로브 | 선택, 정확한 교육용 장착을 원하면 필요 |
| park pawl | 전륜 e-axle exploded view 내부 기어·pawl | 독립 외부 모델 불필요, 내부 단면 표현은 필요 |
| wheel acceleration sensor | `cdc_full_corner_option`에서만 코너별 센서 표시 | 선택 프로파일에서 필요 |
| gateway ECU | 기존 `generic_ecu` 재사용 가능 | 신규 불필요 |
| diagnostic port | 외부 진단 장비·포트 아이콘/간단 모델 | 교육용이면 신규 불필요 |
| chiller | 열관리 회로의 통합 모듈로 표시 | 정확한 냉각 회로 교육이면 신규 필요 |

즉 지금 당장 사진형 신규 에셋을 만들 필요가 있는 것은 아니다. 기존 code-built 모델은 중앙 fallback 문제를 제거했지만, 실제 에셋의 authored origin·mount anchor·bounding box QA가 남아 있다. 그 다음 steering-angle/coolant/park-pawl/chiller를 독립 3D로 보여줄지 통합·오버레이로 보여줄지 결정해야 한다.

## 9. 다음 수정 전 반드시 해결할 항목

P0:

- authored local axis와 mount anchor를 실제 모델별로 확인한 뒤 steering wheel·cluster·rack의 회전·높이 확정.
- context wheel과 기능 체인 wheel의 책임을 하나의 instance registry로 통합.
- front/rear, left/right 코너 placement를 렌더러가 실제로 소비하도록 연결.

P1:

- brake caliper, wheel speed sensor, spring, CDC damper의 4코너 시각화 정책 확정.
- coil base와 air option의 프로파일별 부품·신호 노출 분리.
- steering knuckle/tie-rod를 독립 모델로 만들지, topology overlay로 표시할지 결정.
- fallback 좌표를 화면에서 숨기지 않고 검증 경고로 표시.

P2:

- park pawl, coolant temperature sensor, steering-angle sensor와 선택형 CDC 센서의 에셋/통합 표현 결정.
- 전체보기에서 실제 장착 위치와 교육용 exploded view를 명시적으로 구분.

이 문서는 현재 코드와 데이터의 상태를 기록한 것이며, 차량 구조가 실차 기준으로 확정됐거나 렌더링 문제가 해결됐다는 의미가 아니다.

## 10. 후속 반영·검증 결과

이번 후속 작업에서 실제 코드에 반영한 범위:

- `layoutOf()`의 인덱스 기반 임시 위치를 EVCC, 충전구 잠금 액추에이터, AC 컴프레서, PTC 히터, EEV, ADAS 카메라·레이더·ECU, TCU의 명시적 교육용 `PLACE` 좌표로 대체했다.
- 위 좌표들은 중앙에 몰리는 fallback을 제거하기 위한 배치 계약이며, 모델 authored origin·mount anchor·변환 bounding box를 실차 기준으로 승인했다는 뜻은 아니다.
- 레벨 지도 SVG의 pointer hit-test를 비활성화하고 레벨 버튼을 상위 hit layer로 고정했다. 열린 레벨 선택 후 `시작 →` 전환은 CDP 입력 검증으로 확인했다. 잠긴 레벨은 선택은 가능하지만 의도적으로 시작되지 않는다.
- `VehicleLayout`의 코너 템플릿 확장은 유지하며, 현가·제동·휠속도 센서 등의 authored pivot 검증은 아직 별도 QA 항목으로 남긴다.

후속 검증 수치:

- physical instances 62 / assemblies 8 / signal objects 6
- validator errors 3 / warnings 30
- `npm run build`: 통과
- `npm test -- --runInBand`: 154/154 통과
- `npm run assets:check`: 15/15 present, 0 missing
- `npm run crosscheck`: 11 domains
- `http://localhost:5183/`: HTTP 200

### 에셋 제작 결론

즉시 사진형·외부 신규 에셋을 만들 필요는 없다. 현재 존재하는 code-built 모델은 재배치로 해결할 수 있다. 다만 아래 항목은 교육 표현 수준에 따라 신규 geometry가 필요하다.

1. 필수 검토: steering-angle sensor, coolant-temperature sensor, park pawl. 추천은 각각 기존 column/torque-sensor 내부 오버레이, 냉각수 라인 프로브, 전륜 e-axle 내부 exploded view다.
2. 선택 프로파일: wheel-acceleration sensor 4개. `cdc_full_corner_option`을 실제로 제공할 때만 신규 코너 모델 또는 센서 오버레이가 필요하다.
3. 재사용 가능: gateway ECU는 `generic_ecu`, diagnostic port는 외부 포트/아이콘, 기존 ADAS·열관리·충전 모델은 현재 명시 좌표를 재사용할 수 있다.
4. 설계 확정 후 제작: chiller. 코일+CDC 기본 프로파일에 억지로 넣지 말고 `air_cdc_option` 또는 열관리 회로 교육을 확정한 뒤 제작한다.

이번 단계에서는 위 미확정 부품을 임의의 generic 3D 박스로 만들지 않았다. 신규 제작 전에 통합 표현·오버레이와 독립 모델 중 하나를 승인해야 하며, 브라우저에서 실제 authored axis/anchor를 확인하기 전까지는 모두 `unverified`로 유지한다.
