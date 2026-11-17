# TraceBack EV 3D 모델링·렌더링 독립 기술 재검증 보고서

작성일: 2026-11-16  
범위: 현재 live 코드·현재 브라우저 렌더링·자동화된 모델 정의의 독립 재검증  
상태: **수정 제안 보고서 / 사용자 승인 전 / 코드·에셋 변경 없음**

## 0. 결론 요약

현재 확인된 것은 “전부 잘못됐다”가 아니라 다음 세 층이 서로 다른 상태라는 점이다.

1. **Hero 주행 차량**은 자체 좌표계와 자체 부품 구현을 가진다.
2. **정비소 차량**은 `U=1.53` 배율, `PLACE`, `PartModel`, 도메인 체인을 조합해 별도로 렌더링한다.
3. 두 화면은 같은 차량 좌표를 의도하지만, 정비소는 모델 authored origin·부모 그룹 회전·비등방 스케일을 추가로 적용한다.

따라서 기존 감사에서처럼 `Hero`의 한 점과 `PLACE.p`를 그대로 비교해 “몇 m 위/뒤”라고 확정하는 것은 기술적으로 충분하지 않다. 최종 월드 위치는 다음을 모두 반영해야 한다.

```text
최종 위치 = 부모 그룹 변환 × PLACE 위치 × 모델 authored geometry
최종 방향 = 부모 그룹 회전 × PLACE 회전 × 모델 로컬축
최종 envelope = 모델 bounding box × PLACE scale × 부모 scale
```

반면 다음 사실은 코드로 직접 확인된다.

- Hero 차량은 `front=-Z`, `seatX=.31`, 운전석 쪽 조작계가 `X=-.31`에 있다.
- 정비소 `PLACE`의 핸들·페달·클러스터는 양의 X 쪽에 있다.
- 정비소 `PlacedPart`는 `model.center`를 원점 보정하지 않고 `PartModel`을 `PLACE` 그룹에 넣는다.
- 정비소 전체보기는 도메인별 **feature 0만** 수집하고, 별도 보강 목록도 단일 인스턴스만 추가한다.
- `layoutOf()`는 `partModelFor()`가 `undefined`를 반환하면 조용히 해당 체인 항목을 제외한다.
- differential 모델에는 `left_out` 하나만 있고 좌우 출력 구조가 모델 데이터상 완성되어 있지 않다.
- 정비소 문맥 휠의 장식 토러스/스포크와 기능 휠 `PartModel`이 서로 다른 부모 변환을 받는다.

이 보고서는 위 사실과 자동차 공학적 추론을 분리한다. “필수 수량”도 차량 아키텍처가 확정되지 않은 경우에는 확정값이 아니라 **조건부 검증 항목**으로 기록한다.

## 1. 검증 방법과 증거 등급

| 등급 | 의미 |
| --- | --- |
| C | 현재 소스코드에서 직접 확인한 사실 |
| R | 실제 브라우저 화면에서 확인한 렌더링 사실 |
| K | 모델 로컬축·변환 계산으로 확인한 사실 |
| E | 자동차 공학 자료를 근거로 한 일반적 추론 |
| U | 차량 사양 또는 화면 증거 부족으로 판정 보류 |

빌드 성공, 테스트 통과, 브라우저 오류 없음은 물리적 모델링 정확성의 증거가 아니다. 이번 보고서에서는 이 세 항목을 물리 구조 판정과 분리한다.

## 2. 외부 기술 기준

다음 자료는 특정 차량의 설계 도면이 아니라, 현재 코드의 일반 구조 판단에 사용한 1차 자료/제조사 기술 자료다.

- [U.S. DOE AFDC — How Do All-Electric Cars Work?](https://afdc.energy.gov/vehicles/how-do-all-electric-cars-work): traction battery, charge port, DC/DC, motor, onboard charger, power electronics, thermal system, transmission의 역할을 설명한다.
- [U.S. DOE — Power Electronics R&D](https://www.energy.gov/cmei/vehicles/power-electronics-research-and-development): inverter가 배터리 DC를 모터 구동 AC로 변환하고, DC/DC·charger가 차량 전력 계통을 담당한다고 설명한다.
- [NHTSA-hosted Ford EPAS technical document](https://static.nhtsa.gov/odi/inv/2014/INRD-PE14030-61127P.pdf): EPAS의 rack-and-pinion, motor-to-rack, steering-shaft torque sensor, 양쪽 inner/outer tie rod의 역할을 설명한다.
- [Bosch — Wheel-speed sensor](https://www.bosch-mobility.com/en/solutions/sensors/wheel-speed-sensor/): wheel-speed sensor가 회전하는 encoder를 비접촉 검출하는 구조임을 설명한다.
- [Bosch — ESP system](https://www.bosch-mobility.com/en/solutions/braking-systems/electronic-stability-program/): steering-angle, wheel-speed, yaw-rate/lateral-acceleration 신호의 관계를 설명한다.
- [Bosch — Brake-by-wire](https://www.bosch-mobility.com/en/solutions/braking-systems/brake-by-wire/): 시스템에 따라 네 바퀴 브레이크에 압력을 형성할 수 있으나, brake-by-wire와 기존 유압 구조가 서로 다른 아키텍처임을 보여준다.
- [ZF — Continuous Damping Control](https://www.zf.com/products/en/cars/products_64273.html?pageLink=details_divider658792): CDC는 스프링 종류가 아니라 휠별 감쇠력을 조절하는 damping control 방식임을 설명한다.
- [Dana — Differentials](https://www.dana.com/product/light-vehicle/differentials/): differential이 구동 토크를 wheel side로 분배하는 다양한 아키텍처를 설명한다.

이 자료들로 프로젝트의 구체적 차축 위치, 현가 방식, 좌우 운전석, 센서 수량을 확정할 수는 없다. 그 항목은 프로젝트 사양 또는 사용자 승인 대상이다.

## 3. 좌표계와 변환 재검증

### 3.1 Hero 차량 기준 — 코드 확인

`src/features/vehicle/carBody.ts`의 `CAR_DIMENSIONS`와 `HeroConvertible.tsx`에서 다음을 직접 확인했다.

| 항목 | 코드 사실 | 증거 |
| --- | --- | --- |
| 전방 | `-Z` | `HeroConvertible.tsx` 주석 |
| 전륜 차축 | `z=-1.18` | `CAR_DIMENSIONS.frontAxleZ` |
| 후륜 차축 | `z=+1.16` | `CAR_DIMENSIONS.rearAxleZ` |
| 휠 좌우 | `x=±.745` | `CAR_DIMENSIONS.wheelX` |
| 휠 중심 높이 | `y=.34` | `CAR_DIMENSIONS.wheelRadius` |
| 좌우 좌석 | `x=±.31` | `CAR_DIMENSIONS.seatX` |
| 운전석 관련 wheel/cluster | `x=-.31`, cluster `x=-.4` 부근 | `HeroConvertible.tsx` 정적 부품과 steering group |
| 전륜 조향 | front corner group의 `rotation.y=-steer` | `HeroConvertible.tsx` `steerGroups` |
| 휠 회전 | wheel spin group의 `rotation.x` | `HeroConvertible.tsx` `spinGroups` |

이것은 Hero 화면의 구현 사실이다. Hero의 실제 좌표계가 정비소의 최종 월드 좌표와 동일하게 배율만 다른지는 별도 검증이 필요하다.

### 3.2 정비소 변환 — 코드 확인

`src/features/garage/VehicleLayout.tsx`의 변환은 다음과 같다.

| 변환 단계 | 코드 사실 | 영향 |
| --- | --- | --- |
| 길이 배율 | `U=1.53` | `PLACE.p`와 모델 크기가 scene unit으로 확대됨 |
| 위치 | `offsetOf(node)=PLACE.p × U` | `PLACE.p`는 authored local origin 기준 |
| 부품 그룹 회전 | `<group position rotation={node.place.r}>` | 모델 전체가 회전 |
| 모델 중심 보정 | 없음 | `model.center`가 0이 아니면 geometry envelope가 `PLACE.p`에서 벗어남 |
| target scale | `U × target / max(model.size)` | 가장 긴 축만 target에 맞춤 |
| 배터리 등 s scale | `U × s` | target scale과 다른 절대/비등방 스케일 경로 |
| VehicleLayoutRig 부모 | `position=[0,-.25,0]`, `rotationY=-.18` | 화면 최종 위치는 raw PLACE와 다름 |
| Overview 부모 | `rotationY=-.18` | 전체보기와 개별보기의 카메라 기준 차이 |

**판정:** `PLACE.p`를 곧바로 부품 중심점이라고 부를 수 없다. 현재는 “부품 authored origin을 어디에 놓을지”에 가깝다. 따라서 향후 검수는 `model.center`, anchors, transformed bounding box를 계산한 뒤 해야 한다.

### 3.3 로컬축과 현재 회전 — 코드/모델 정의 확인

| 부품 | 모델 로컬축/거동 | 현재 `PLACE.r` | 독립 판정 |
| --- | --- | --- | --- |
| `steering_wheel` | `torusX`, moving axis `x`; 로컬 X를 중심으로 회전 | `[0,0,0]` | K: 로컬 X가 실제 차량의 어떤 조향축인지 먼저 정해야 하므로 0이 맞다/틀리다를 즉시 확정할 수 없음 |
| `steering_column` | `cylX`, geometry 내부 tilt `z=-.35` | `[0,0,0]` | C/K: 부모 회전보다 authored geometry의 기울기와 핸들·랙 연결점을 확인해야 함 |
| `steering_rack` | rack 이동 axis `x`, housing도 `cylX` | `[0,π/2,0]` | K: 부모 Y 90°가 적용되면 X 이동축이 차량 Z 방향으로 바뀌므로 현재 차량 랙 방향과 일치하는지 재검증 필요 |
| `drive_shaft` | `cylX`, moving axis `x` | `[0,π/2,0]` | K: 모델 길이/회전축이 부모 회전으로 바뀜. 차동기어 출력축과 허브 방향을 계산해야 함 |
| `wheel` | `cylX`, moving axis `x` | `[0,-π/2,0]` | K: 기능 휠의 로컬 회전축이 부모 회전으로 변경됨. 기능 휠과 문맥 휠을 같은 조립체로 볼 수 없음 |
| `brake_caliper` | disc/rotating group axis `x` | `[0,-π/2,0]` | K: 디스크·허브·캘리퍼의 축과 고정/회전 부품을 분리 계산해야 함 |
| `coil_spring` | 길이축 Y | 회전 없음 | C: 수직 모델. 실제 장착점과 현가 구조가 정해져야 판정 가능 |
| `damper` | 본체/로드 길이축 Y | 회전 없음 | C: 수직 모델. 차체/너클 장착점이 없음 |
| `cdc_damper` | 길이축 Y, moving axis Y | 회전 없음 | C: 모델 자체는 감쇠 거동을 가질 수 있으나 4코너 인스턴스는 없음 |
| `air_spring` | 길이축 Y | 회전 없음 | C: 에어 사양의 4코너 여부는 차량 사양 미확정 |
| `instrument_cluster` | housing x/y/z 크기와 화면 면은 local geometry에 의해 결정 | `[0,π/2,0]` | K: screen normal, connector anchor, 운전자 시선과 부모 회전을 함께 확인해야 함 |

### 3.4 문맥 휠과 기능 휠의 분리

`ContextWheel`은 장식 토러스/스포크 그룹에만 `rotationY=π/2`를 적용하고, 그 밖에서 별도의 `PartModel id="wheel"`을 렌더링한다. 따라서 한 화면 안에서 다음 두 구성의 변환이 다르다.

- 장식 타이어/스포크: `rotationY=π/2`를 받은 그룹
- 기능 휠 모델: 별도 부모 아래의 `PartModel`, 자체 moving axis X

또한 `ContextWheel`의 주석은 좌우 차축을 Z라고 설명하지만, 코드의 휠 중심 배열은 X가 좌우이고 Z가 전후다. 이 주석은 구현 사실과 일치하지 않는다. 이것은 실제 차량 설계를 확정하는 문제가 아니라, 코드 기준이 서로 충돌한다는 확정 사실이다.

## 4. 조향계 독립 검토

### 4.1 기존 감사의 과도한 전제

“핸들·컬럼·랙을 하나의 직선에 맞춘다”는 표현은 일반 랙 앤 피니언 조향의 충분한 기준이 아니다. 핸들과 랙은 같은 운동축이 아니라, 컬럼/중간축/유니버설 조인트/피니언을 통해 회전 토크가 전달되고 랙은 좌우 직선으로 이동한다. NHTSA-hosted EPAS 자료도 rack-and-pinion, motor-to-rack, torque sensor, 양쪽 tie rod를 별도 요소로 설명한다.

따라서 올바른 검증 순서는 다음이다.

```text
steering wheel 회전
  → steering column / intermediate shaft 회전
  → pinion 회전
  → rack X방향 직선 이동
  → 좌·우 inner/outer tie rod
  → 좌·우 steering knuckle / front wheel steer
```

현재 모델에는 다음이 확인된다.

| 항목 | 현재 코드 사실 | 판정 |
| --- | --- | --- |
| 핸들 | 모델은 존재하고 local X 회전 거동이 있음 | 역할은 존재. 차량 축 적합성은 미확정 |
| 컬럼 | 모델은 존재하나 중간축/유니버설 조인트가 별도 모델로 분리되지 않음 | 교육용 단순화인지 누락인지 승인 필요 |
| 피니언 | `steering_rack` 모델 내부 pinion tower/anchor로 포함 | 독립 모델은 아님. 구조 표현은 일부 존재 |
| 랙 | local X 이동 거동 있음 | 현재 부모 Y 90° 변환과 차량 축 관계 재계산 필요 |
| tie rod | rack model 내부 좌우 rod geometry는 존재 | 외부 연결 anchor는 `tie_rod_out` 단일 anchor만 제공 |
| knuckle | 전용 모델 없음. label 매핑에서 `wheel`로 대체될 수 있음 | wheel과 knuckle을 동일시한 오매핑 가능 |
| EPS motor | `eps_motor`와 `eps_power_pack` 모델 존재 | rack assist 연결 관계를 별도 검증해야 함 |
| torque sensor | `steering_torque_sensor` 존재 | 핸들/컬럼과 함께 위치·축 검증 필요 |
| angle sensor | 전용 `steering_angle_sensor` 모델 없음 | 현재 label mapping이 `steering_wheel`로 대체할 가능성 |
| 실제 조향 거동 | Hero 전륜은 `rotation.y`로 조향 | 정비소 `PlacedPart`의 wheel/rack/knuckle 연동은 확인되지 않음 |

**결론:** 핸들 위치가 잘못되어 보인다는 화면 지적은 별도 확인 대상이지만, “핸들·컬럼·랙을 한 직선으로 만들면 해결”이라고 결론 내릴 수 없다. 먼저 프로젝트가 기계식 rack-and-pinion EPS를 교육하는지, steer-by-wire 개념을 교육하는지 확정해야 한다.

## 5. 구동계 독립 검토

### 5.1 현재 코드 사실

`PLACE`에는 다음 단일 인스턴스가 있다.

```text
traction_motor   X=-.20, Z=-.98
reduction_gear  X=+.18, Z=-.98
differential    X=+.42, Z=-.98
drive_shaft     X=+.62, Z=-1.18
wheel           X=+.745, Z=-1.18
```

모델 데이터는 다음과 같다.

- `differential` anchors: `in`, `left_out`만 존재
- `drive_shaft` anchors: `in`, `out`
- `wheel` anchors: `drive_torque_in`, `brake_torque_in`, `steer_force_in`, `rotation_out`
- `drive_shaft`와 `wheel`의 moving axis는 local X

### 5.2 기술적 판정

“반드시 drive shaft 모델을 두 개 복제해야 한다”는 말은 차량 사양 확정 전에는 절대 명령이 아니다. 통합 e-axle가 하나의 housing/half-shaft assembly로 표현될 수 있기 때문이다. 다만 현재 코드에는 좌우 출력 연결을 식별할 수 있는 differential의 두 번째 출력 anchor가 없고, 실제 좌우 허브 연결도 정의되어 있지 않다.

따라서 확정 가능한 결론은 다음이다.

- C: 현재 데이터 모델만으로는 differential의 좌우 출력 관계가 완성되어 있지 않다.
- C: 현재 `VehicleLayout`의 기능 체인에는 `drive_shaft`와 `wheel`이 단일 노드로 들어간다.
- U: 프로젝트가 하나의 assembly mesh 안에 좌우 반축을 포함시키려는지, 별도 인스턴스로 교육하려는지는 미확정이다.
- P0 제안: 복제부터 하지 말고 먼저 e-axle의 좌우 출력 구조와 교육 목표를 결정한다.

## 6. 현가계 독립 검토

### 6.1 기존 감사의 오류 보정

CDC는 스프링의 종류가 아니다. CDC는 댐퍼의 감쇠력을 전자적으로 조절하는 방식이다. 따라서 다음 분류가 맞다.

```text
현가 기구: MacPherson / double wishbone / multi-link / 기타
스프링: coil / air / 기타
댐퍼: passive / CDC / active
```

현재 코드에는 이 기구를 구성하는 `knuckle`, control arm, top mount, ball joint, stabilizer link 등 전용 구조가 없다. 따라서 스프링과 댐퍼를 같은 좌표에 4개씩 놓는 것만으로 현가계가 완성되지는 않는다.

### 6.2 현재 코드 사실

| 항목 | 확인 결과 | 등급 |
| --- | --- | --- |
| `coil_spring` | 모델·좌표 있음. `[+.745,.52,-1.18]` 단일 | C |
| `damper` | 모델·좌표 있음. `[+.745,.46,-1.18]` 단일 | C |
| `cdc_damper` | 모델·좌표 있음. 같은 전륜 우측 계열 위치 | C |
| `air_spring` | 모델·좌표 있음. `[+.745,.42,+1.16]` 단일 | C |
| `air_compressor` | 모델·좌표 있음 | C |
| wheel acceleration sensor | `PART_MODEL_IDS`에 없음 | C |
| ride/height sensor | 모델은 있으나 한 위치·역할 중복 | C |
| knuckle/link/top mount | 별도 완성 인스턴스/배치 불명 | C/U |
| 4코너 현가 거동 | Hero에 해당 정비소 거동 연결 없음 | C |

### 6.3 수량 판정

다음은 조건부로만 기록한다.

- CDC가 네 바퀴에 적용되는 사양이라면 CDC damper는 4개가 필요하다.
- 코일 스프링 기반 차량이라면 coil spring은 일반적으로 코너별 인스턴스를 검토해야 한다.
- 에어 스프링 기반 차량이라면 air spring은 코너별 인스턴스를 검토해야 한다.
- 모든 차량에 차고 센서 4개가 필수라고 할 수 없다. 액슬별·대각선·코너별 센서 구성은 차량/제어 목적에 따라 달라진다.
- 모든 차량에 wheel acceleration sensor 4개가 필수라고 할 수 없다. Bosch 자료처럼 현가 가속도 센서는 특정 semi-active damping sensor architecture에서 사용되며, 프로젝트의 CDC 학습 목표가 확정되어야 한다.

**현재 승인 필요 항목:** 현가 기구 형태, 스프링 사양, CDC 적용 축, ride-height sensor 수량, 현가 가속도 센서의 교육 범위.

## 7. 제동계 독립 검토

기존 감사의 “캘리퍼 4개”는 일반적인 4륜 차량 제동을 시각화한다면 강한 후보지만, 현재 프로젝트가 어떤 brake-by-wire/유압 아키텍처를 의도하는지 먼저 확인해야 한다.

현재 코드 사실:

- `brake_ecu`, `hydraulic_modulator`, `brake_line`, `brake_caliper`, `wheel_speed_sensor` 모델이 존재한다.
- `PLACE`에는 `brake_caliper`, `wheel_speed_sensor`, `brake_line`이 단일 좌표만 있다.
- `brake_caliper` model은 disc/hub/caliper가 함께 있고 moving axis X를 가진다.
- `brake_line`은 단일 모델이며 4코너 분기 구조가 데이터에 없다.
- `brake_pedal`은 하나의 페달 모델이며, A/B redundant sensor가 별도 geometry로 구분되지는 않는다.

조건부 판정:

- 일반적인 4륜 유압/브레이크바이와이어 시각화라면 네 바퀴 제동 결과를 보여주는 것이 교육적으로 자연스럽다.
- 그러나 네 개의 독립 캘리퍼 모델을 반드시 생성해야 하는지는 “부품을 실제로 모두 보여주는 화면”인지 “중앙 제어 흐름을 보여주는 화면”인지에 따라 다르다.
- wheel-speed sensor는 ABS/ESP 거동을 설명하려면 각 휠 데이터와 매칭되어야 하지만, 모델 수량과 신호 표현 수량은 별도로 설계할 수 있다.

## 8. `partModelFor()`와 체인 누락 재검증

### 8.1 모델은 있으나 `PLACE`가 없는 ID

현재 `PART_MODEL_IDS`와 `PLACE`를 비교하면 다음 모델은 존재하지만 `PLACE`가 없다.

```text
ac_compressor
adas_camera
adas_ecu
adas_radar
can_harness
charge_lock_actuator
eev
evcc
hv_cable
ptc_heater
tcu
```

이 부품들이 체인에서 매핑될 경우 `layoutOf()`는 fallback 좌표를 사용한다.

```text
[-0.9 + index * 0.25, 0.5, -0.5]
```

이는 차량 패키징 좌표가 아니라 체인 index 기반 임시 좌표다. C: 실제 코드로 확인된다.

### 8.2 모델 매핑이 없어서 체인에서 사라질 수 있는 라벨

`partModelFor()`에는 다음과 같은 명시적 매핑이 확인되지 않는다.

| 라벨/개념 | 현재 처리 위험 |
| --- | --- |
| `휠 가속도센서` | 전용 ID/정규식 없음 → `layoutOf`에서 제외 가능 |
| `냉각수 온도센서` | `NTC` 정규식과 정확히 일치하지 않으면 제외 가능. motor temp sensor와 동일시하면 오매핑 |
| `핸들각 센서`, `조향각 센서` | 전용 sensor ID가 없어 `steering_wheel`로 매핑될 수 있음 |
| `HVIL 루프` | 별도 모델/신호 매핑 없음 |
| `충돌 신호` | 별도 모델/신호 매핑 없음 |
| `CP·PP 신호` | 충전 인렛과 별도 신호 객체 없음 |
| `외부 충전기`, `충전기` | 차량 내부 모델과 외부 장비 모델 구분 없음 |
| `송신 ECU`, `수신 ECU`, `대상 ECU` | 일반 라벨 전용 매핑 없음 |
| `게이트웨이` | dedicated gateway ID 없음 |
| `진단 장비`, `진단 포트` | dedicated model/PLACE 없음 |
| `칠러` | 전용 model ID/PLACE 없음 |
| `경고등 표시` | cluster 내부 표시와 별도 객체 구분 없음 |

이 목록은 “반드시 신규 3D 에셋을 만들어야 한다”는 뜻이 아니다. 신호·아이콘·기존 모델 재사용·외부 장비 모델 중 어떤 표현이 맞는지 먼저 결정해야 한다.

### 8.3 현재 오매핑 가능성이 높은 규칙

| 정규식/규칙 | 문제 가능성 |
| --- | --- |
| `/핸들각/ → steering_wheel` | 센서와 핸들 본체를 동일 모델로 취급 |
| `/조향각|^각도 센서/ → steering_wheel` | 조향각 센서가 핸들 본체로 표현될 수 있음 |
| `/NTC/ → motor_temp_sensor` | 모터 NTC와 냉각수 NTC를 구분하지 않음 |
| `/너클/ → wheel` | 너클과 휠/허브를 동일시 |
| `/랙 위치센서|랙 센서/ → steering_rack` | rack sensor와 rack assembly 구분 부족 |
| `/속도센서/ → wheel_speed_sensor` | 어떤 회전/차속 센서인지 label context 검증 필요 |

## 9. 도메인별 독립 판정

| 도메인 | 코드상 존재 | 독립 검증 결과 |
| --- | --- | --- |
| 구동 | motor/reducer/differential/shaft/wheel/inverter | 단일 output anchor와 단일 shaft/wheel 때문에 좌우 출력 구조 미확정 |
| 고전압 전원 | battery/BMS/contactor/HV junction/isolation | 전력 부품은 있으나 HVIL·crash path는 신호 표현 미정 |
| 충전 | inlet/OBC/EVCC/lock/DC path 일부 | EVCC/lock은 모델은 있으나 PLACE 없음. 외부 EVSE 미표현 |
| 열관리 | pump/valve/fan/radiator/compressor/PTC/EEV 일부 | 신규 부품 좌표 없음. coolant sensor/chiller 매핑 미확정 |
| 제동 | pedal/ECU/modulator/line/caliper/wheel sensor | 단일 코너 렌더링. 실제 brake architecture 미확정 |
| 조향 | wheel/column/torque sensor/EPS/rack | rack-and-pinion 관계 일부 있으나 tie rod/knuckle/angle sensor 분리 부족 |
| 현가 | spring/damper/CDC/air/compressor/height | 기구 형태·사양·센서 수량이 미확정. 4코너 거동 없음 |
| 기어·주차 | selector/VCU/park ECU/actuator/position sensor | 모델은 있으나 cluster와 상태 표시 관계 확인 필요 |
| VCU/HMI | VCU/DC-DC/LV battery/cluster | cluster는 존재하지만 driver-side mounting 검증 필요 |
| 통신·진단 | CAN cable/generic ECU/TCU | gateway/diagnostic port/source-target ECU 표현 부족 |
| ADAS | camera/radar/ADAS ECU | 모델은 있으나 PLACE 없음. 전방 장착 기준 미정 |

## 10. 신규 에셋 우선순위 재평가

### 10.1 우선 신규 모델이 필요할 가능성이 있는 항목

아래는 “반드시 생성”이 아니라, 기존 모델 재사용으로 교육 목적을 충족하지 못할 때 신규 제작하는 후보이다.

| 우선순위 | 후보 | 신규 제작 전 확인할 것 |
| --- | --- | --- |
| P0 | steering-angle sensor | steering wheel motor/column 내부 통합 센서로 표현 가능한지 |
| P0 | wheel acceleration sensor | 프로젝트가 CDC/현가 센서 학습을 실제 목표로 삼는지 |
| P0 | coolant temperature sensor | motor NTC와 같은 패키지로 재사용 가능한지 |
| P0 | dedicated gateway ECU | generic ECU + gateway label로 충분한지 |
| P1 | diagnostic port | 외부 장비와 함께 보여줄 필요가 있는지 |
| P1 | external charger/EVSE | 충전 기능 학습에서 외부 장비가 핵심인지 |
| P1 | coolant chiller | 실제 열회로를 어느 수준까지 모델링할지 |
| P1 | instrument cluster detail | 현재 code model을 보강하는 것이 새 에셋보다 적절한지 |
| P2 | knuckle/tie-rod joint detail | 조향·현가 기계 거동을 실제로 보여줄지 |
| P2 | ADAS mounting brackets | 카메라·레이더만으로 위치 인식이 충분한지 |

### 10.2 신규 에셋보다 인스턴스/연결 정의가 먼저인 항목

- `coil_spring`, `damper`, `cdc_damper`, `air_spring`
- `brake_caliper`, `wheel_speed_sensor`, `brake_line`
- `wheel`, `drive_shaft`
- `evcc`, `charge_lock_actuator`, `ac_compressor`, `ptc_heater`, `eev`
- `adas_camera`, `adas_radar`, `adas_ecu`, `tcu`

이 항목들은 모델 파일이 이미 존재한다. 먼저 차량 사양과 실제 장착 위치를 확정한 뒤 복수 인스턴스가 필요한지 결정한다.

### 10.3 3D 에셋이 아닌 명시적 신호 표현 후보

- CP/PP
- HVIL
- 충돌 차단
- CAN message / gateway boundary
- brake hydraulic branch
- coolant flow
- READY / gear / warning state

## 11. 기존 감사 문서의 기술적 오류 또는 과도한 주장

| 기존 주장 유형 | 독립 재판정 |
| --- | --- |
| “핸들축과 배치를 보정했다” | C: 현재 코드의 `PLACE`와 Hero 운전석은 여전히 다르다. 완료 주장으로 기록하면 안 됨 |
| “전체보기에서 필수 현가 부품을 보강했다” | C: overview 보강 목록에는 coil/damper가 단일 ID로만 추가된다. 수량 보강 완료라는 표현은 부정확 |
| “drive shaft 2개가 무조건 필요” | U: 일반적인 좌우 출력 구조에서는 검토 필요하지만, e-axle assembly 표현 방식과 프로젝트 사양 확인 전 확정 불가 |
| “캘리퍼·휠 속도 센서 4개가 무조건 필요” | E/U: 4륜 제동/ABS를 시각화한다면 강한 기준이나, 교육용 단순화와 brake architecture를 먼저 확정해야 함 |
| “wheel acceleration sensor 4개가 필수” | 오류 가능성 높음. 센서 아키텍처와 제어 대상에 따른 조건부 항목 |
| “ride-height sensor 4개가 필수” | 오류 가능성 높음. 차종/제어 전략에 따라 2개·4개·다른 구성이 가능 |
| “CDC + coil/air 선택만 하면 현가가 정의됨” | 불충분. 현가 기구 구조와 spring/damper/control을 별도 정의해야 함 |
| “좌표만 수정하면 기계 구조가 해결됨” | 부적절. anchors, pinion/tie rod/knuckle, differential outputs, motion constraints가 함께 필요 |
| “모델이 존재하므로 렌더링 완료” | 부적절. model ID, PLACE, chain mapping, instance count, behavior는 별도 검증 대상 |

## 12. 사용자 결정이 필요한 설계 전제

다음 항목은 코드에서 임의로 결정하지 않는다.

1. 운전석/조작계 기준을 Hero의 `X=-.31`로 확정할지.
2. 정비소 차량도 Hero와 같은 2인승 좌우 배치로 볼지.
3. 전륜 단일 e-axle인지, 전륜 양쪽 반축을 개별 표시할지.
4. 조향이 기계식 rack-and-pinion EPS인지, steer-by-wire 교육 모델인지.
5. 현가 기구가 MacPherson, double wishbone, multi-link 중 무엇인지.
6. spring이 coil인지 air인지.
7. damper가 passive인지 CDC인지, 적용 축이 어디인지.
8. ride-height sensor와 wheel acceleration sensor를 실제 학습 대상에 포함할지.
9. brake-by-wire/유압 구조와 4륜 제동을 어느 수준으로 표시할지.
10. 외부 충전기·진단 장비·서버를 3D 장비로 보여줄지, 그래픽/신호로 보여줄지.
11. ADAS와 통신·진단을 차량 실장 위치까지 3D로 보여줄지.

## 13. 승인 후 수정 제안 — 아직 실행하지 않음

### P0 구조 검증

1. Hero와 정비소의 좌표·배율·운전석 기준을 문서로 확정한다.
2. 각 `PartModel`의 authored origin, center, anchors, local moving axis를 export 가능한 검수 데이터로 만든다.
3. `PLACE`를 origin 기준으로 유지할지 center/anchor 기준으로 재설계할지 결정한다.
4. 조향·구동의 기계 연결 topology를 먼저 정의한다.
5. 현가 기구와 사양을 승인받는다.

### P1 배치/연결 검증

1. approved topology에 따라 인스턴스 수를 생성한다.
2. transformed bounding box와 연결 anchor를 계산한다.
3. 차체·부품·배선 간 관통/간섭을 검출한다.
4. feature 0만 쓰는 overview가 학습 목적과 맞는지 확인한다.
5. 임시 fallback 좌표 사용을 오류로 표시하거나 별도 상태로 노출한다.

### P2 시각 품질

1. 계기판·센서·gateway·외부 장비의 신규 모델 필요성을 재판정한다.
2. 단품 showroom과 차량 overview를 같은 카메라 기준으로 비교한다.
3. 조명/투명 차체/라벨이 부품 위치를 왜곡하지 않는지 확인한다.

각 수정은 반드시 다음 순서로 검증한다.

```text
part showroom → transformed anchor/bounds → whole vehicle → domain/function view
→ input behavior → 16:9 browser render → regression tests
```

## 14. 현재 상태

- 모델링·렌더링 코드: 수정하지 않음
- 신규 에셋: 생성하지 않음
- 기존 감사 문서: 수정하지 않음
- 진행 로그: 수정하지 않음
- 신규 독립 보고서: 작성 완료
- 다음 단계: 사용자 승인 전 대기

