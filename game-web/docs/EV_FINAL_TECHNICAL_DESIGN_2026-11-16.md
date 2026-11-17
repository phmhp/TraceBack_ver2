# TraceBack EV 3D 모델링·렌더링 최종 기술 설계안

작성일: 2026-11-16  
상태: **사용자 승인 대기 / 코드·에셋·기능 로직 미수정**  
기준 문서: `EV_ENGINEERING_INDEPENDENT_REVIEW_2026-11-16.md`

이 문서는 독립 감사 결과를 실제 수정 가능한 설계 계약으로 전환하기 위한 문서다. 현재 단계에서는 구현하지 않고, 승인 후 변경할 구조·수량·연결·검증 기준을 확정한다.

## 0. 최종 설계 원칙

1. TraceBack은 양산차 특정 모델의 복제가 아니라 교육용 가상 EV다.
2. 그러나 선택한 기준 차량 안에서는 좌표·기계 연결·신호·거동이 서로 모순되지 않아야 한다.
3. 실제 물리 부품, 시각화 인스턴스, 신호 객체, 장식 애니메이션을 별도 데이터로 관리한다.
4. 모델의 authored origin을 임의로 bounding-box 중심으로 이동하지 않는다.
5. 모든 모델은 origin·center·mount anchor·port anchor·moving axis를 별도 메타데이터로 가진다.
6. `layoutOf()`의 교육용 체인과 전체 차량 물리 인스턴스 목록을 같은 데이터로 억지로 표현하지 않는다.
7. 도메인·기능 체인과 시뮬레이션 로직은 유지한다. 이번 설계는 물리 표현과 렌더링 연결을 정리하는 작업이다.
8. 물리적으로 정의되지 않은 부품·센서·배선은 화면에서 조용히 사라지지 않고 검증 오류 또는 명시적 신호 객체로 표시한다.

## 1. 기준 차량 사양서

### 1.1 추천 기준안

| 항목 | 확정 설계안 | 선택 근거 |
| --- | --- | --- |
| 차량 형태 | Hero와 동일한 2인승 소형 EV | 기존 Hero·스토리·차체 치수 유지 |
| 운전석 | Hero 기준 `X=-0.31` | 기존 운전자·핸들·클러스터와 일관성 확보 |
| 전방/후방 | 전방 `-Z`, 후방 `+Z` | Hero와 `CAR_DIMENSIONS` 유지 |
| 차체 | 약 `3.95m × 1.8m`, 전륜 `Z=-1.18`, 후륜 `Z=+1.16`, 휠 `X=±0.745` | 기존 차체 기준 유지 |
| 구동 | 전륜 단일 모터 e-axle, single-speed reduction, open differential | 현재 drive 도메인 체인과 가장 직접적으로 호환 |
| 조향 | 기계식 rack-and-pinion EPS | 현재 steering column/rack/EPS 모델과 호환 |
| 전륜 현가 | MacPherson strut | 소형 전륜구동 EV에 현실적이며 strut·spring·damper·knuckle 교육에 적합 |
| 후륜 현가 | torsion-beam semi-independent rear axle + trailing arm | 배터리 후방 패키징을 단순화하고 코일·CDC·휠 위치를 명확히 표현 |
| 기본 스프링 | 4코너 coil spring | 현재 coil 모델과 소형 EV 기준을 유지. **컴프레서로 차고를 조절하지 않는다.** |
| 기본 감쇠 | 4코너 CDC damper | CDC를 스프링 종류가 아닌 반능동 감쇠 제어로 표현 |
| 선택 현가 사양 | 4코너 air spring + compressor/valve block/pressure sensing + CDC | 기존 `차고·자세 유지` 기능을 실제 차고 제어로 실행할 때만 활성화하는 별도 프로파일 |
| 제동 | 4륜 디스크, 전자제어 유압 brake actuator/ESP, 회생제동 협조 | brake·regen 도메인과 호환 |
| 휠 속도 | 4개 wheel-speed sensor | ABS/ESP/구동 피드백을 명확히 표현 |
| 조향 센서 | 1개 steering-angle sensor + 1개 torque sensor | 핸들 본체와 센서 역할 분리 |
| 기본 CDC 센서 | 1개 IMU + 전/후 차축 ride-height sensor 2개 + 차량 CAN 입력 | 차체 자세·차축 수준 preview용. **4개 댐퍼의 독립적인 실제 상태를 측정한다고 주장하지 않는다.** |
| CDC 독립 4코너 확장 | 코너별 wheel/suspension acceleration 또는 동등한 wheel-travel/velocity 센서 | 네 댐퍼를 코너별 폐루프로 제어하려면 선택. 수량은 제어 목표에서 도출하며 모든 차량의 필수품으로 일반화하지 않음 |
| 차고 제어 센서 | Air 프로파일에서 전/후 차축 2개는 차축 평균 제어용, 4개는 코너별 차고 제어용 | `ride-height` 수량과 CDC 센서 수량을 같은 것으로 취급하지 않음 |
| 열관리 | motor NTC 1, coolant temperature sensor 1, pump, valve, radiator, fan, **heat-pump 프로파일의 optional compressor/EEV/PTC** | 기존 thermal 체인을 유지하되 현가 컴프레서와 혼동하지 않음 |
| 충전 | charge inlet, CP/PP, lock actuator, EVCC, OBC, HV contactor, external EVSE | charge 도메인과 외부 장비 경계 명확화 |
| 통신 | CAN network, gateway ECU, diagnostic port, TCU | comm 도메인의 송신/게이트웨이/수신/진단/OTA 표현 가능 |
| ADAS | front camera 1, front radar 1, ADAS ECU 1 | 전방 센서 기반 현재 체인과 호환 |
| HMI | instrument cluster 1, gear/READY/warning state | Hero의 클러스터 위치와 표시 기능 유지 |

### 1.2 기존 기능·시나리오 호환성

이 기준안은 기존 고장 시나리오를 삭제하거나 바꾸지 않는다.

| 기존 영역 | 유지되는 내용 | 물리 표현만 보강하는 내용 |
| --- | --- | --- |
| 구동 | APS→VCU→torque request→inverter→motor 고장 흐름 | e-axle 좌우 출력·반축·전륜 hub 연결 |
| 고전압 | BMS·접촉기·precharge·HV safety | HVIL/crash signal을 신호 객체로 추가 |
| 충전 | inlet·EVCC·OBC·battery 흐름 | 외부 EVSE와 CP/PP 경계 표시 |
| 열관리 | motor temperature·thermal ECU·fan/pump fault | motor NTC와 coolant sensor 분리 |
| 제동/회생 | brake input·regen blend·friction brake | 4륜 caliper·4 wheel-speed 표시 |
| 조향 | EPS·rack·steering failure 교육 | steering wheel/torque/angle sensor 분리 |
| 현가 | chassis ECU·damper·ride height 기능 | 기본은 coil+CDC의 감쇠/자세 preview, `차고·자세 유지`의 compressor/air 경로는 Air 옵션으로 유지 |
| 기어/주차 | PRND·VCU·Park ECU·position feedback | 전륜 e-axle의 transmission/parking gear 잠금과 차체 장착 Park ECU를 분리 |
| 통신/진단 | CAN·gateway·diagnostic·OTA 교육 목적 | gateway/diagnostic port/TCU 위치 추가 |
| ADAS | camera/radar→ADAS ECU→brake/VCU | 전방 장착 위치 및 cluster warning 표시 |

시뮬레이션의 `CaseId`, fault schedule, verification contract, STEP02~04의 학습 순서와 판정 규칙은 변경 대상이 아니다.

### 1.3 보완 감사: 현가·EPS·주차 잠금

#### 현가: 기본 사양과 Air 선택 사양을 분리한다

실제 `src/features/garage/evData.ts:238-268`의 현가 4기능은 다음을 포함한다.

1. 노면 입력 해석: IMU, 휠 가속도센서, 차고 센서
2. 댐핑력 제어: IMU, Chassis ECU, 전자식 댐퍼
3. 차고·자세 유지: 차고 센서, Chassis ECU, Air Compressor, Air Spring
4. 센서 고장 폴백: 휠 가속도센서, 차고 센서, Chassis ECU, Cluster

따라서 기존 기능을 삭제하거나 코일 스프링의 차고를 컴프레서로 조절하는 식으로 의미를 바꾸지 않는다. 구현 계약은 다음 두 프로파일로 분리한다.

| 프로파일 | 물리 구조 | 센서·제어 | 화면상 의미 |
| --- | --- | --- | --- |
| `coil_cdc_base` | 코일 스프링 4개 + CDC 댐퍼 4개 | IMU 1개, 전·후 차축 차고 센서 2개, 휠속·조향각·제동·차속 CAN | 감쇠와 차축 수준 자세 변화를 교육용으로 보여준다. 컴프레서·에어 스프링은 활성 경로가 아니다. |
| `air_cdc_option` | 에어 스프링 4개 + CDC 댐퍼 4개 + 컴프레서 + 밸브 블록 + 압력 계측 | 차축 평균 차고 제어는 센서 2개, 코너별 차고 제어는 센서 4개로 별도 선택 | `차고·자세 유지` 기능을 실제 압력 제어 경로로 보여준다. |
| `cdc_full_corner_option` | 코일 또는 에어 + CDC 댐퍼 4개 | 코너별 wheel/suspension acceleration 또는 동등한 변위·속도 계측을 추가 | 네 댐퍼에 서로 다른 명령을 주는 폐루프 교육을 허용한다. |

기본 프로파일에서는 기능 3과 기능 4의 학습 콘텐츠를 유지하되, 기능 3의 `Air Compressor → Air Spring` 경로는 **선택 사양 미활성**으로 표시한다. 즉 기능 카드가 존재한다는 이유만으로 기본 차량에 컴프레서가 코일 스프링을 제어한다고 설명하지 않는다. 현재 `VehicleLayout.tsx:86-96`에는 coil, CDC, air spring, air compressor, ride-height가 동시에 존재하고, `inferFlow()`는 `air_compressor`를 별도 `air` 흐름으로 분류한다. 이것은 현재 화면에 두 사양이 섞여 있다는 코드 사실이며, 정상적인 단일 차량 사양으로 판정할 근거가 아니다.

CDC는 스프링이나 차고 제어가 아니라 전자식 감쇠 밸브를 조절하는 반능동 시스템이다. 중앙 제어기가 차량 센서와 CAN 입력으로 코너별 목표 감쇠력을 계산할 수 있지만, IMU 1개와 차축 차고 센서 2개만으로 코너별 휠 상태를 측정했다고 선언하지 않는다. 따라서 기본 프로파일의 4개 CDC 출력은 `B2 신호 연동` 또는 `V1 preview`로 제한하고, 코너별 폐루프 측정·추정이 추가된 경우에만 `B1 계산 연동`으로 승격한다. CDC 구조의 일반적 근거는 센서·제어기·CDC 댐퍼 조합과 코너별 감쇠 조절을 설명하는 ZF 자료를 따른다: [ZF CDC](https://www.zf.com/products/en/cars/products_64273.html?pageLink=details_divider658792), [ZF CDC system information](https://aftermarket.zf.com/app/controller/ti/download/Binary/d94e3ef9-d750-11ec-a2ea-00505690da53.pdf).

#### EPS: 현재 에셋과 호환되는 방식은 column-assist EPS다

`src/features/garage/evData.ts:204-235`의 교육 체인은 토크 센서·차속 CAN·EPS ECU·모터·조향축을 별도로 요구하며, `src/features/parts/partModels.ts:793-818`의 주석은 `eps_motor`를 **Column-type EPS**로 정의한다. 따라서 기준안은 다음처럼 확정한다.

```text
운전자 입력
  → steering torque sensor / steering angle sensor
  → EPS ECU
  → 차량 속도·IMU·진단 상태 보정
  → assist torque command
  → column-mounted EPS motor + worm gear
  → steering column / intermediate shaft / pinion
  → rack의 X축 직선 이동
  → 좌·우 tie rod
  → 좌·우 steering knuckle
  → 전륜 조향각
```

여기서 steering angle은 운전자 입력·각도 피드백의 신호이고, torque sensor는 운전자가 가한 토크를 측정한다. EPS 모터는 조향각을 직접 만들어내는 독립 구동원으로 표현하지 않고, 조향축에 보조 토크를 더한다. 현재 코드에는 rack 모델과 tie-rod 형상이 있으나 `steering_rack`의 anchor가 단일 `tie_rod_out`으로 정의되어 있어 좌·우 연결이 충분히 명시됐다고 볼 수 없다. 중간축·피니언·좌우 너클도 현재 `VehicleSpec`에서 연결 검증 대상으로 승격해야 한다.

column-assist를 추천하는 이유는 현재 에셋이 column motor, torque sensor, steering column, rack을 이미 갖고 있고, 소형·중형 차량에 적합한 column servo가 기계식 rack-and-pinion과 intermediate shaft로 연결되는 구조이기 때문이다. 이는 [Bosch column-assist EPS 설명](https://www.bosch-mobility.com/en/solutions/steering/electric-power-steering-with-servo-unit-on-the-steering-column/)과도 일치한다. 다만 현재 에셋만으로는 완전한 기계 연결이 검증된 것이 아니며, 승인 후 anchor·축·좌우 tie-rod를 별도로 검증한다.

#### 전륜 e-axle의 파킹 잠금

`src/features/garage/VehicleLayout.tsx:49-51`의 현재 배치는 `park_lock_actuator`를 `z=+0.82`, `park_position_sensor`를 `z=+0.90`, `park_ecu`를 `z=+0.72`에 두고 있다. 전륜 e-axle가 `z≈-0.98`에 있다는 기준안과 비교하면 actuator·position sensor가 후방에 놓인 것은 코드로 확인된다. 그러나 이 좌표만으로 실제 잠금 구조가 후륜이라는 설계 의도를 확정할 수는 없다.

권장 구조는 다음과 같다.

| 요소 | 권장 위치·역할 | 별도 표시 |
| --- | --- | --- |
| Park ECU | 차체의 보호된 전장 공간에 별도 장착. e-axle와 같은 위치일 필요 없음 | `park_ecu` 1개 |
| Park actuator | 전륜 e-axle transmission housing에 장착 | `park_lock_actuator` 1개 |
| Park pawl/parking gear | 감속기 출력 계통의 회전체를 기계적으로 잠금 | e-axle assembly 내부 child 또는 명시적 lock mechanism |
| Park position sensor | pawl/actuator의 실제 체결 위치를 감지 | `park_position_sensor` 1개 |
| 연결 | VCU → Park ECU → actuator → pawl/parking gear, sensor → Park ECU/VCU | `ParkRequest`, `LockFeedback` signal object |

전륜 단일 모터 e-axle는 통합 transmission에 optional park-lock과 actuator/ECU가 포함될 수 있으므로, Park ECU가 별도 차체 부품이어도 잠금 대상은 e-axle 내부 회전체로 정의하는 것이 일관된다. [BorgWarner integrated drive module](https://www.borgwarner.com/technologies/electric-drive-modules)은 e-axle의 transmission·driveshaft output·optional park-lock·actuator/ECU 구성을 설명한다. 현재 `park_lock_actuator` 모델에는 레버 운동은 있으나 pawl·parking gear 형상은 확인되지 않으므로, 해당 기계 관계를 단품 화면에서 주장하려면 향후 assembly child 또는 신규 세부 에셋이 필요하다.

#### 현재 코드와 사양의 충돌 판정

| 항목 | 코드에서 확인된 사실 | 현재 판정 |
| --- | --- | --- |
| 현가 사양 | `evData.ts`는 Air Compressor/Air Spring을 기능 3에 명시하고, `VehicleLayout.tsx`는 coil·CDC·air·compressor를 동시에 배치 | 단일 기본 차량으로는 혼재. 두 프로파일 분리 필요 |
| CDC 센서 | `evData.ts`는 IMU·휠 가속도·차고 센서를 사용하지만 base 설계는 IMU 1 + 차고 2만 제안 | CDC full-corner 폐루프는 미확인. base는 preview로 제한 |
| EPS 방식 | `partModels.ts` 주석은 column-type EPS, `evData.ts`는 rack/tie-rod/knuckle 흐름을 요구 | column-assist를 기준으로 채택하되 중간축·좌우 연결은 미구현/미검증 |
| Park lock | actuator·position sensor 좌표는 후방, Park ECU는 별도 위치 | 전륜 e-axle 사양과 좌표 불일치. pawl/parking gear 연결도 미표현 |
| 시나리오 | `scenarios.ts`와 `simModel.ts`는 propulsion·thermal·brake·regen·ready·gear·cold의 수치 시험을 별도로 정의 | 현가/CDC 물리 계산이 기존 사건의 판정 로직에 직접 존재한다고 볼 수 없음 |

### 1.4 11개 도메인 호환성 재판정

`src/features/garage/evData.ts:10,30`에서 도메인 순서가 `drive`, `power`, `charge`, `thermal`, `brake`, `steer`, `suspension`, `gear`, `vcu`, `comm`, `adas`로 정의되고 각 도메인은 4개 기능을 가진다. 이 구조와 `src/game/scenarios.ts:142-160`의 시나리오 registry는 유지한다. 다만 “호환”은 기능 이름이 존재한다는 뜻이 아니라, 아래의 물리·신호·거동 범위를 뜻한다.

| 도메인 | 현재 코드와의 대조 | 최종 설계의 조건 |
| --- | --- | --- |
| 구동 | APS→VCU→토크→인버터→모터 흐름과 수치 시험이 존재 | e-axle 내부 topology와 좌·우 halfshaft를 추가하되 기존 torque 값·fault rule은 변경하지 않음 |
| 고전압 전원 | BMS·precharge·contactor·HVIL/crash 기능이 `evData.ts`에 존재 | HVIL/crash는 physical part가 없으면 signal object로 명시하고 조용히 누락하지 않음 |
| 충전 | `evData.ts:102-133`은 CP·PP·EVCC 협상과 **OBC의 교류→직류 변환**을 정의 | 현재 기준은 AC charging path로 기록. DC fast-charge는 별도 `DC charger→HV bus` 경로가 없으므로 지원한다고 표시하지 않음 |
| 열관리 | `evData.ts:136-167`은 모터 NTC·냉각수 센서·펌프·팬·heat-pump 부품과 derating을 정의 | 열관리 `ac_compressor`와 현가 `air_compressor`를 서로 다른 component namespace로 분리 |
| 제동 | `evData.ts:170-202`은 pedal A/B·유압·4륜 캘리퍼·4륜 속도·회생 협조를 명시 | 4개 corner brake와 회생/마찰 신호를 유지. 캘리퍼와 disc/hub 회전 규칙을 분리 |
| 조향 | `evData.ts:204-235`는 angle·torque·EPS·rack·tie rod·knuckle 흐름을 명시 | column-assist EPS와 좌·우 tie-rod topology를 실제 anchor로 검증 |
| 현가 | `evData.ts:238-268`는 coil/CDC와 Air Compressor/Air Spring 의미를 동시에 포함 | base/option profile을 나누고 CDC B1 여부를 센서 계약으로 제한 |
| 변속·주차 | `evData.ts:272-304`는 Park ECU·Lock Actuator·Position Sensor를 명시 | 잠금 대상을 전륜 e-axle parking gear로 명시하고 현재 후방 임시 좌표는 오류 후보로 기록 |
| VCU | 차량 상태·도메인 중재·LV·고장 등급 기능이 존재 | physical instance는 VCU 역할을 보이고 기존 상태 전이/시나리오 로직은 수정하지 않음 |
| 통신·진단 | 송신 ECU·CAN·gateway·수신 ECU·진단·OTA 기능이 존재 | signal object와 gateway/diagnostic anchor를 구분. 서버/테스터는 외부 장비 view로 분리 |
| ADAS/HMI | camera/radar→ADAS ECU→brake/VCU→cluster 흐름이 존재 | 전방 camera/radar를 실제 장착 위치에 두고 perception은 signal/overlay로만 표시 |

특히 `src/features/verification/simModel.ts`의 실제 계산 시리즈는 현재 propulsion·thermal·brake·regen·ready·gear·cold 사건을 중심으로 한다. 따라서 현가 CDC·EPS 전륜각·Park pawl 체결은 설계상 연결 대상이지만, 기존 시뮬레이션이 계산한다고 주장하지 않고 별도 preview 또는 향후 확장 계약으로 표시한다.

## 2. 필수 기능과 렌더링 수량 계약

### 2.1 물리 인스턴스와 표시 인스턴스

| 조립체 | 실제 기능 기준 | 권장 표시 수 | 표시 방식 |
| --- | --- | ---: | --- |
| 차체 | 차체 shell 1 | 1 | 반투명/일반 shell 전환 |
| 휠/허브 | 4 wheel corners | 4 | `wheel.fl/fr/rl/rr` |
| 전륜 e-axle | motor 1, reducer 1, differential 1 | 1+1+1 | 통합 하우징과 내부 분해 보기 |
| 전륜 반축 | differential→좌/우 hub 토크 경로 | 2 | `halfshaft.fl`, `halfshaft.fr` |
| 전륜 knuckle | 조향·현가·허브 지지 | 2 | 실제 모델이 없으면 단순 joint/knuckle proxy를 명시적으로 표시 |
| 전륜 MacPherson | strut/spring/damper/top mount | 좌·우 2 | corner instance |
| 후륜 torsion beam | beam 1, trailing arm 좌·우 2 | 1+2 | 후륜 통합 조립체 |
| 후륜 spring | torsion-beam 양쪽 spring | 2 | `spring.rl/rr` |
| CDC damper | 네 휠 감쇠 제어 | 4 | `cdcDamper.fl/fr/rl/rr` |
| 브레이크 디스크/캘리퍼 | 4 wheel brakes | 4 | caliper/disc별 코너 ID |
| 유압 분기 | actuator→4 wheel circuits | 4 branch signals | 실제 호스 모델 또는 신호 케이블 |
| wheel-speed sensor | 4 wheel encoder feedback | 4 | 각 hub/knuckle 인접 |
| steering wheel | 운전자 입력 1 | 1 | Hero 위치/기울기 기준 |
| steering column | torque path 1 | 1 | column + intermediate shaft |
| pinion/rack | rack-and-pinion 1 | 1 | rack 중앙 + 좌우 tie rod |
| tie rod | 좌·우 전륜 조향 링크 | 2 inner/outer pair | rack model 내부 또는 별도 인스턴스 |
| torque sensor | steering shaft torque 1 | 1 | 컬럼/EPAS 입력부 |
| angle sensor | steering angle 1 | 1 | 핸들 본체와 분리 |
| battery pack | HV energy store 1 | 1 | underfloor skateboard |
| BMS/contactor/HVJB | HV control/protection | 각 1 | pack 상부/전륜 service bay |
| LV battery/DC-DC | LV power 1+1 | 각 1 | 전장 service area |
| cluster | HMI 1 | 1 | 운전석 대시보드 |
| motor temperature | motor 1 | 1 | motor housing |
| coolant temperature | coolant loop 1 | 1 | loop inlet/outlet 중 한 지점 |
| pump/valve/radiator/fan | thermal loop | 각 1 이상 | 회로 topology로 표시 |
| charge inlet/lock/EVCC/OBC | charge path | 각 1 | 외판·충전 service area |
| external EVSE | 차량 외부 charging equipment | 1 external prop | 차량 내부 부품과 분리 |
| camera/radar/ADAS ECU | ADAS sensing | 각 1 | front fascia/windshield + protected ECU |
| gateway/diagnostic port/TCU | communication/diagnostic | 각 1 | CAN network object + physical anchor |

### 2.2 통합 표현으로 허용하는 항목

다음은 물리 기능을 보존한다면 하나의 조립체로 표시할 수 있다.

- motor + reduction gear + differential: `front_eaxle_assembly`
- front MacPherson spring + damper + top mount: `front_strut_assembly.fl/fr`
- rear beam + trailing arms: `rear_torsion_beam_assembly`
- disc + hub + caliper: `wheel_brake_assembly.fl/fr/rl/rr`
- pedal housing + A/B sensor: `brake_pedal_sensor_pack`
- CAN cable + gateway logical boundary: `can_network_segment` + `gateway_ecu`

단, 통합 표시를 선택하면 내부 구성과 연결 관계를 설명할 수 있는 단품/확대 모드를 제공한다.

### 2.3 조립체·개별 부품 중복 방지 및 회전 계약

조립체는 geometry를 가진 부모일 수도 있고, 단순한 관계 컨테이너일 수도 있다. 두 경우를 같은 방식으로 동시에 렌더링하지 않는다.

| 조립체/부품 | 기본 표시 소유자 | 자식 표시 규칙 | 운동축·거동 |
| --- | --- | --- | --- |
| `front_strut_assembly.fl/fr` | strut assembly 또는 명시된 child set 중 하나 | spring, CDC damper, top mount, knuckle을 child로 관리. 부모와 child geometry를 동시에 중복 표시하지 않음 | strut axis는 해당 코너의 장착축; CDC rod/valve만 preview 또는 신호 연동 |
| `cdcDamper.fl/fr/rl/rr` | 코너별 CDC child instance | assembly expanded mode에서만 child geometry 활성화 | damper rod는 상대 운동축을 가지며, 입력 없는 idle 반복 금지 |
| `rear_torsion_beam_assembly` | beam assembly 1개 | beam 1 + trailing arm `rl/rr` + rear spring/damper child | beam은 고정, trailing arm은 wheel travel preview에서만 회전 |
| `wheel_brake_assembly.fl/fr/rl/rr` | corner assembly | wheel/hub/disc/caliper를 하나의 corner graph로 관리 | wheel·hub·disc는 X축 회전; caliper와 knuckle은 차체/현가에 고정 |
| `front_eaxle_assembly` | e-axle housing 1개 | motor/reducer/differential/halfshaft/park lock을 child로 연결 | housing은 고정; rotor·gear·differential 내부는 cutaway/신호가 있을 때만 회전 |
| `motor/reducer/differential` | e-axle의 child component | assembly collapsed mode에서는 child geometry를 숨기고 label/anchor만 유지 | 실제 simulation 값이 없으면 회전 장식 금지 |

현재 `brake_caliper` 모델은 코드 주석상 disc와 hub를 포함하고 disc/hub는 회전하며 caliper/pad/hose는 고정되는 복합 모델이다(`src/features/parts/partModels.ts:758-790`). 따라서 `wheel` 모델과 `brake_caliper`를 그대로 동시에 전부 표시하면 디스크·허브가 중복될 수 있다. 구현 시 `brake_disc_hub`와 `brake_caliper`를 metadata상 분리하거나, `wheel_brake_assembly`가 한 번만 렌더링하도록 소유권을 정한다.

동일한 원칙을 `spring.rl/rr`, `cdcDamper.fl/fr`, `front_strut_assembly`, `wheel_brake_assembly`, `front_eaxle_assembly`에 적용한다. `assemblyMode = collapsed | expanded | exploded`를 명시하고, 한 instance가 두 mode의 geometry에 동시에 들어가면 validation error로 처리한다.

## 3. 좌표·장착 기준점 구현 계약

### 3.1 새로운 메타데이터 계약

향후 `PartModel` 또는 별도 vehicle spec에서 다음 정보를 제공한다.

```ts
type VehiclePartInstance = {
  instanceId: string;          // e.g. wheel.fl, cdcDamper.rr
  componentId: string;         // e.g. wheel, cdc_damper
  assembly: string;
  corner?: "fl" | "fr" | "rl" | "rr";
  mount: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale?: number | [number, number, number];
    reference: "origin" | "mount" | "anchor";
  };
  mountAnchor?: string;
  ports: Record<string, { anchor: string; direction: "in" | "out" | "bidirectional" }>;
  localMotion?: { axis: "x" | "y" | "z"; mode: string; pivot: [number, number, number] };
  behaviorBindingId?: string;
  visibility: "physical" | "assembly" | "signal-only" | "external";
};
```

이 계약은 지금 바로 코드에 추가하지 않는다. 승인 후 `vehicleSpec.ts`를 신규 source of truth로 만드는 것을 제안한다.

### 3.2 월드 변환 검증 산출물

각 인스턴스에 대해 개발 검증 시 다음을 출력한다.

```text
instanceId
componentId
local origin
geometry center
mount anchor
port anchors
local motion axis
world motion axis
world bounding box
collision candidates
```

`model.center`는 origin을 덮어쓰는 값이 아니라 보조 검증값이다. 모델의 회전 중심이나 커넥터 위치가 origin에 의존하면 authored origin을 유지한다.

### 3.3 behavior binding 계약

문자열 하나만 저장하는 `behaviorBinding`은 어떤 값이 어디서 오고 어떤 단위로 갱신되는지 보장하지 못한다. 승인 후에는 binding ID와 구조화된 계약을 사용한다.

```ts
type BehaviorBinding = {
  id: string;
  signalId: string;
  source: "vehicleSim" | "verificationSim" | "campaignState" | "userInput" | "static";
  unit: string;
  range: { min: number; max: number };
  update: { mode: "frame" | "sample" | "event" | "static"; periodMs?: number };
  missing: "idle" | "hold-last" | "hidden" | "not-exercised";
  execution: "B1-calculated" | "B2-signal" | "B3-command" | "V1-preview" | "D1-decoration";
  output: { property: "rotation" | "translation" | "visibility" | "color" | "overlay"; axis?: "x" | "y" | "z"; scale?: number };
  scenario?: string;
};
```

현재 코드의 근거는 다음처럼 분리해서 기록한다.

| 현재 소스 | 확인된 사실 | binding 분류 |
| --- | --- | --- |
| `src/features/verification/simModel.ts:13-15` | `Series`가 `id`, `unit`, `min/max`, reference/run 배열을 보유 | `verificationSim` + `B1-calculated` 후보 |
| `src/features/verification/simModel.ts:42-55` | propulsion 시험에서 pedal·processed·request·motor 계열 수치를 계산 | 계산된 값이 있는 경우에만 `B1` |
| `src/features/verification/simModel.ts:366-386` | case/level별 시뮬레이션과 contract signal 존재 여부를 평가 | 검증 화면의 sample/event binding |
| `src/game/scenarios.ts:183-217, 249-252` | propulsion·thermal·brake 사건의 입력·출력·고장 수치와 단위가 정의됨 | 해당 사건의 signal binding |
| `src/features/garage/VehicleLayout.tsx` 현재 preview | 단품/정비소 모델의 입력값으로 보이는 움직임과 실제 simulation series의 연결이 별도 계약으로 정의되지 않음 | 기본값은 `V1-preview` 또는 `B3-command`, B1로 표기 금지 |

따라서 simulation state가 없는 `steering`, `suspension`, `park lock`, 4코너 CDC 등의 움직임은 기본적으로 `not-exercised` 또는 `V1-preview`로 표시한다. 입력이 없는데도 `useFrame` 등으로 계속 반복되는 움직임은 기능 거동이 아니라 `D1-decoration`이며, 기능 검증 화면에서는 금지한다.

### 3.4 기준 장착 위치

| 대상 | 기준 |
| --- | --- |
| steering wheel | Hero의 `[-.31,.86,-.17]`, Hero tilt `[-.38,0,0]`를 reference로 사용. PartModel local axis 변환 후 확정 |
| instrument cluster | Hero의 `[-.4,.82,-.3]`, Hero tilt `[-.25,0,0]`를 reference로 사용 |
| front wheels | `x=±.745`, `y=.34`, `z=-1.18` |
| rear wheels | `x=±.745`, `y=.34`, `z=+1.16` |
| front strut | 각 front wheel center 상부와 body top mount를 잇는 Y 중심선 |
| rear spring/damper | torsion beam/trailing arm과 body mount 사이, 좌우 각 1 |
| rack | front axle 중앙, rack travel은 차량 좌우 X |
| half-shafts | differential 좌우 output → front hub center |
| calipers | 각 wheel disc의 고정 knuckle 측, disc와 함께 회전하지 않음 |
| wheel-speed sensor | 각 hub encoder/tone ring 인접, 고정 knuckle 측 |
| battery | wheelbase 사이, underfloor, 차체 폭·지상고 envelope 안 |
| charge inlet | 차체 외판 후방 측면, external EVSE와 마주보는 면 |
| camera/radar | 전방 시야와 차체 보호 구조를 동시에 만족하는 위치 |

이 기준은 target reference다. 실제 `rotation` 값은 로컬축·anchor 검증 후 계산하며 임의로 `0`, `±π/2`를 일괄 적용하지 않는다.

## 4. 전체보기 렌더링 구조 설계

### 4.1 권장 데이터 분리

```text
VehicleSpec
├─ physicalInstances[]     // 실제 차량 부품 인스턴스
├─ assemblies[]            // e-axle, strut, brake, rear beam
├─ signalObjects[]          // CAN, HVIL, CP/PP, hydraulic branch
├─ domainViews{}            // 각 도메인이 참조할 instanceId/signalId
└─ behaviorBindings{}       // 입력·상태·거동 연결
```

### 4.2 현재 구조에서의 권장 변경 파일

| 파일 | 변경 제안 | 기존 기능 위험 |
| --- | --- | --- |
| `src/features/garage/VehicleLayout.tsx` | `VehiclePlatformOverview`가 feature 0 수집 대신 `VehicleSpec.physicalInstances`를 렌더링 | 전체보기 초기 화면·카메라 배치 회귀 |
| 신규 `src/features/garage/vehicleSpec.ts` | 인스턴스·assembly·signal source of truth | 새 데이터와 기존 `EV_DOMAINS` 불일치 위험 |
| `src/features/parts/partModels.ts` | local axis, anchors, asset metadata 보강 | 기존 단품 showroom/anchor 회귀 |
| `src/experiences.tsx` | `partModelFor`를 물리 인스턴스 선택용으로 사용하지 않고 domain view mapping으로 축소 | 퍼즐/벤치 label 회귀 |
| `src/features/garage/evData.ts` | 기존 11개 도메인·4개 기능은 유지, `physicalRefs`만 연결 | 학습 텍스트·기능 index 회귀 |
| 신규 layout validation test | duplicate ID, missing anchor, fallback coord, bounds/connection 검사 | 테스트 fixture 유지 필요 |
| `src/features/garage/garage-v3.css` | 4코너 label/overlay/selection 스타일만 보강 | 16:9 overflow 위험 |

### 4.3 기존 API 호환 원칙

- `layoutOf(domain, feature)`는 STEP01 기능 체인과 기존 화면을 위해 유지한다.
- `VehicleSpec`는 전체보기와 물리 배치 검증의 source of truth로 분리한다.
- `partModelFor()`는 label→model 후보 매핑으로 유지하되, 매핑 실패를 `undefined`로 조용히 버리지 않는다.
- 임시 fallback 좌표는 개발 환경에서 오류 badge/검증 목록에 기록한다.
- 기존 `CaseId`, fault schedule, verification contract, simulation output은 변경하지 않는다.

## 5. 실제 거동과 시각 효과 정책

### 5.1 거동 등급

| 등급 | 의미 | 예 |
| --- | --- | --- |
| B1 계산 연동 | 시뮬레이션 값이 실제 출력 변화를 결정 | wheel torque, motor speed, vehicle acceleration |
| B2 신호 연동 | 신호 상태가 표시/애니메이션을 결정 | CAN pulse, brake pressure, fan command |
| B3 명령 연동 | 사용자 입력이 해당 부품 움직임을 직접 결정 | steering wheel, pedal, rack preview |
| V1 시각 보조 | 계산 없이 상태를 설명하는 정적/단계 표시 | exploded callout, label, transparent shell |
| D1 장식 | 기능 의미를 갖지 않는 반복 애니메이션 | idle pulse, showroom spin |

D1 애니메이션은 기능 화면에서 금지하거나 명확히 장식 상태로 표시한다.

### 5.2 기능별 거동 계약

| 기능 | 입력 | 계산/신호 | 출력 시각화 | 허용 단순화 |
| --- | --- | --- | --- | --- |
| 조향 | driver torque, torque/angle sensor, vehicle speed, IMU | EPS ECU→assist torque→column motor→pinion→rack→tie rods | steering wheel/column/rack/tie rods/front knuckles | angle signal과 assist torque를 같은 값으로 취급하지 않음. 현재 simulation 값이 없으면 B3/V1 |
| 구동 | pedal/drive permit | torque request→inverter→motor→differential | motor spin, halfshaft/wheel spin, vehicle torque | motor 내부 dq/PWM은 overlay로 표시 |
| 제동 | brake pedal | brake request→hydraulic pressure + regen blend | 4 caliper pressure state, wheel response | 실제 유압 유체 시뮬레이션은 신호 애니메이션으로 대체 |
| 현가 | road/body input, IMU, ride-height, CAN | base: Chassis ECU→CDC command preview; Air option: height error→compressor/valve/air spring | 4 damper state, coil compression preview 또는 Air pressure/height state | base의 4코너 명령은 B2/V1. 독립 센서·계산이 추가된 경우에만 B1 |
| 열관리 | temperature/load | thermal ECU→pump/valve/fan | pump/fan state, coolant flow | 유체 CFD는 표현하지 않음 |
| 충전 | plug/CP/PP | EVCC/OBC/HV contactor | charge path + external EVSE state | 전력 전자 파형은 graph/overlay |
| ADAS | camera/radar detection | ADAS ECU→brake/VCU request | front sensor field, request signal | perception scene는 icon/overlay |
| 통신 | ECU signal | CAN/gateway/diagnostic | signal path and gateway state | 실제 packet timing은 simulation graph |

## 6. 도메인·기능별 검증 매트릭스

현재 도메인·기능 이름은 유지하고, physical reference와 검증 포인트를 다음처럼 연결한다.

| 도메인 | 기능 1 | 기능 2 | 기능 3 | 기능 4 |
| --- | --- | --- | --- | --- |
| 구동 | APS→VCU→전륜 토크: motor/reducer/diff/halfshaft FL·FR | PRND/READY interlock: selector/VCU/inverter enable | BMS·thermal limits: BMS/VCU/inverter/CAN | inverter current control: inverter/PMSM/resolver |
| 고전압 전원 | START/pack safety: button/BMS/VCU/HVJB | precharge/contactor: BMS/precharge/main contactor/HV bus | output availability: BMS/VCU/inverter limits | HVIL/crash shutdown: HVIL signal/BMS/contactor/inverter discharge |
| 충전 | inlet/CP/PP/lock: inlet/lock/EVCC | current negotiation: EVSE/EVCC/BMS/OBC | OBC conversion: inlet/OBC/contactor/HV pack | charge protection/end: temp/isolation/BMS/OBC/lock |
| 열관리 | temperature estimation: motor NTC/coolant sensor/thermal ECU | pump/fan control: ECU/pump/fan/feedback | loop distribution: VCU/ECU/compressor/chiller/EEV/PTC | derating: thermal ECU/VCU/inverter/cluster |
| 제동 | brake request: pedal A/B/brake ECU/modulator/4 calipers | regen/friction blend: Brake ECU/VCU/BMS/inverter/modulator | ABS/EBD: 4 wheel speed/ABS/modulator/4 calipers | ESC: IMU/ESC/Brake ECU/4-wheel pressure |
| 조향 | steering input: wheel/angle sensor/EPS/rack | assist torque: torque sensor/CAN/EPS motor | rack drive: pinion/rack/tie rods/knuckles | fallback: angle/IMU/ESC/EPS/front wheels |
| 현가 | road input: IMU/ride-height/Chassis ECU | damping: Chassis ECU/4 CDC dampers | base: posture preview / option: height sensor→compressor/valve→air spring | fallback: sensor validation/CDC safe state/cluster |
| 기어·주차 | PRND: selector/VCU/cluster | direction interlock: VCU/Brake ECU/inverter | park lock: VCU/Park ECU→e-axle actuator→pawl/parking gear→position sensor | state display: VCU/CAN/cluster/Park ECU |
| VCU | vehicle state: start/VCU/BMS | domain arbitration: APS/Brake/VCU/inverter | LV management: LV battery/DC-DC/VCU/LV loads | fault safety: ECU/CAN/VCU/cluster |
| 통신·진단 | domain signal: source ECU/CAN/gateway/target ECU | health monitoring: CAN/gateway/VCU/fallback | diagnostic: tester/port/gateway/target ECU | OTA: server/TCU/gateway/target ECU |
| ADAS/HMI | perception: camera/radar/ADAS ECU | decel request: ADAS/CAN/Brake/VCU | intervention coordination: ADAS/Brake/EPS/cluster | warning display: CAN/cluster/lamp state |

각 셀은 다음 상태를 별도로 기록한다.

```text
physical model present
instance count correct
mount transform verified
mechanical connection verified
signal connection verified
behavior binding verified
rendered in whole view
rendered in domain/function view
```

## 7. 수정 실행 계획

### Phase 0 — 사양·데이터 계약

1. `vehicleSpec.ts` 설계 및 instance ID 목록 확정
2. 현재 part model의 origin/center/anchor/motion metadata 추출
3. 각 도메인 체인에 `physicalRefs`를 연결
4. `coil_cdc_base`와 `air_cdc_option`을 별도 vehicle profile로 정의
5. 구조화된 `BehaviorBinding`의 signal/source/unit/range/update/missing/execution 계약 추가
6. fallback 좌표와 profile 혼합을 오류로 탐지하는 검증기 추가

회귀 위험: 기존 STEP01 화면이 `layoutOf()`의 index에 의존하므로 `layoutOf()` API는 유지한다.

### Phase 1 — 조향·구동 topology

1. Hero 운전석·cluster reference를 정비소 transform 기준으로 연결
2. column-assist EPS chain을 torque/angle sensor→EPS ECU→assist motor→column→intermediate shaft→pinion→rack→좌·우 tie rod→knuckle로 명시
3. differential 좌우 output과 `halfshaft.fl/fr`를 명시
4. wheel/hub/brake/steer connection을 corner instance로 분리
5. Park actuator/pawl/parking gear/position sensor를 전륜 e-axle assembly에 연결하고 Park ECU는 별도 body mount로 유지

회귀 위험: 기존 `partModelFor()` label mapping과 garage click/step index.

### Phase 2 — 현가·제동·열관리

1. front MacPherson과 rear torsion beam assembly 추가
2. `coil_cdc_base`에서는 coil/CDC 4코너만 활성화하고, `air_cdc_option`에서만 air spring/compressor/valve/pressure path를 활성화
3. 기본 CDC는 preview/B2로 표시하고, 독립 4코너 센서가 승인된 경우에만 full-corner B1 경로를 추가
4. 4 wheel brake + 4 wheel-speed feedback 표현
5. motor NTC/coolant sensor를 분리
6. pump/valve/radiator/fan loop와 heat-pump용 optional compressor/EEV/PTC를 현가 compressor와 별도 namespace로 확정

회귀 위험: 기존 `suspension` feature label, thermal model label, brake path.

### Phase 3 — 충전·ADAS·통신

1. EVSE/CP/PP/EVCC/lock/OBC boundary 표현
2. front camera/radar/ADAS ECU 실제 장착 위치 추가
3. gateway/diagnostic port/TCU instance 및 CAN signal object 추가

회귀 위험: 외부 장비가 차량 내부 부품처럼 보이는 UI 혼동.

### Phase 4 — 렌더링 및 거동 검증

1. transformed bounds/collision report
2. 4코너 조향·구동·제동·현가 거동
3. 전체보기와 도메인 보기의 동일 instance 재사용
4. 단품 showroom·전체보기·기능보기·입력 거동 순서 검수

## 8. 테스트 기준

### 8.1 정적 데이터 테스트

- 모든 `instanceId`는 unique
- 모든 `componentId`는 실제 model 또는 명시적 signal object로 해석
- 모든 mount anchor/port anchor는 존재
- fallback 좌표 사용 0건
- differential 출력 topology가 양쪽 wheel path를 설명
- front/rear corner ID가 4개로 완성
- 기본 profile에 air compressor/air spring이 섞이지 않음
- air profile의 compressor→valve→air spring 경로가 존재할 때만 차고 제어를 활성화
- `BehaviorBinding`마다 signal/source/unit/range/update/missing/execution이 존재
- assembly collapsed/expanded/exploded mode에서 geometry 소유권 중복 0건
- 각 domain/function에 physicalRefs가 없으면 오류로 기록

### 8.2 거동 테스트

- steering input이 rack travel과 전륜 2개 steering에 연결
- steering torque와 steering angle이 서로 다른 signal로 처리
- torque command가 differential을 거쳐 FL/FR 양쪽 wheel path에 도달
- brake command가 4개 wheel brake 상태에 반영
- wheel-speed feedback이 각 wheel instance와 1:1 대응
- base CDC command가 4개 damper에 연결되더라도 `B1`로 잘못 표시되지 않음
- full-corner profile에서만 코너 센서 입력과 4개 독립 CDC 출력의 1:1 대응을 검사
- coil profile에서 compressor가 damper/spring 상태를 바꾸지 않음
- air profile에서만 height error가 compressor/valve/air spring으로 전달
- ParkRequest가 e-axle lock mechanism과 LockFeedback으로 왕복
- wheel/hub/disc는 함께 회전하고 caliper/knuckle은 고정
- 입력 전 장식 pulse가 독립적으로 반복되지 않음
- simulation state가 없는 부품은 “시험 전/표현 전”으로 표시

### 8.3 브라우저 테스트

검증 해상도: 기존 기준 `1600×900` Chrome.

1. 단품 showroom: local axis/anchor/reference image
2. 전체보기: 차체·배터리·e-axle·4코너 현가/제동
3. 도메인 11개 × 기능 4개
4. steering input / drive input / brake input / suspension preview
5. signal overlay on/off
6. hover/click/double-click/zoom/transparent shell
7. label overflow, model overlap, wire penetration
8. 기존 STEP02~04 및 시뮬레이션 회귀

## 9. 사용자 승인 필요 항목

| 항목 | 선택지 | 추천안 | 기술적 근거 | 영향·선택하지 않을 때의 제한 |
| --- | --- | --- | --- | --- |
| 후륜 현가 | torsion beam / multi-link | torsion beam | 2인승 소형 EV와 교육용 4코너 구조에 단순하고 기존 rear spring/damper 모델과 연결하기 쉽다 | multi-link 선택 시 링크·부시·너클 에셋과 kinematics 범위가 크게 늘어난다 |
| 스프링·차고 | coil+CDC / air+CDC | `coil_cdc_base` + `air_cdc_option` 병행 정의 | 코일은 컴프레서 차고 제어와 호환되지 않으며, 기존 기능 3은 Air 경로를 명시한다 | coil만 선택하면 차고 제어는 활성화하지 못한다. air를 선택하면 compressor·valve·pressure path가 추가된다 |
| CDC 목표 | axle-level preview / full-corner closed loop | 기본 axle-level preview, full-corner는 확장 | IMU 1+차축 차고 2개만으로 개별 휠 상태를 측정했다고 할 수 없다 | preview를 full B1로 부르면 기술적으로 과장된다. full은 코너 센서·추정 계약이 추가로 필요하다 |
| 현가 센서 | IMU+차축 차고 2개 / 코너 센서 추가 | base는 IMU 1+차축 차고 2개, CDC full 승인 시 코너 센서 추가 | 센서 수량을 차량 보편 필수품이 아니라 제어 목표에서 도출 | 코너 센서가 없으면 4개 댐퍼의 독립 피드백 검증은 제한된다 |
| EPS 방식 | column-assist / pinion-assist / rack-assist | column-assist | 현재 `eps_motor`가 column-type으로 정의되고 torque sensor·column·rack 에셋이 이미 있다 | 다른 방식을 택하면 모터 위치·감속기·배선·anchor와 기존 에셋을 재설계해야 한다 |
| 파킹 잠금 | e-axle integrated lock / wheel-end lock | e-axle integrated lock | 전륜 single-motor e-axle에서 transmission/output 회전체를 잠그는 구조가 설명 가능하다 | wheel-end lock을 선택하면 후륜/전륜 잠금 경로와 별도 기계 구조를 새로 정의해야 한다 |
| 구동 반축 | 2개 별도 / 통합 e-axle assembly | 2개 별도 + assembly view | 좌우 differential output과 전륜 hub까지 토크 경로를 검증할 수 있다 | 통합만 사용하면 좌우 출력 경로와 조향/현가 운동 중 연결을 교육적으로 확인하기 어렵다 |
| knuckle/tie rod | 단품 모델 / assembly 내부 | assembly 내부 + 확대 view | 현재 모델 부족을 숨기지 않으면서 신규 에셋을 최소화한다 | 단품을 요구하면 knuckle, joint, tie-rod anchor 에셋 보강이 필요하다 |
| 제동 | 4 caliper 직접 표시 / brake assembly 통합 | 4 corner instance + collapsed/expanded mode | 캘리퍼는 고정, disc/hub는 wheel과 함께 회전해야 한다 | 복합 모델을 그대로 중복 렌더링하면 disc/hub가 겹친다 |
| 외부 충전기 | 3D prop / 아이콘·신호 | 3D prop은 외부 장비 view에서만 | EVSE는 차량 내부 부품이 아니라 외부 전원 장비다 | 아이콘만 쓰면 외부 연결의 공간 관계가 약해지고, 차량 view에 넣으면 구조 혼동이 생긴다 |
| gateway/diagnostic | 전용 3D / generic ECU+label | generic ECU 재사용 + 명시적 label | 기능 교육에는 역할·신호 경계가 중요하고 전용 형상은 필수 아님 | 전용 3D를 택하면 에셋 제작·검수 범위가 늘어난다 |
| wheel acceleration sensor | 기본 모델 포함 / 확장 모델 | 기본 제외, CDC full 확장 시 추가 | 현재 코드의 기능 체인에는 있지만 기본 차량 사양의 필수 물리 부품으로 확정되지 않음 | 제외 시 CDC는 preview 수준으로 한정한다 |
| cluster | 현 모델 보강 / reference 기반 재제작 | 기존 모델 장착축·시선부터 검증 후 디테일 평가 | 위치·회전 오류와 에셋 품질 문제를 분리해야 한다 | 즉시 재제작하면 기존 HMI reference와 회귀 검증 범위가 커진다 |

## 10. 승인 전 현재 상태

- 모델링·렌더링 코드: 수정하지 않음
- 신규 에셋: 생성하지 않음
- 기존 기능·학습 콘텐츠·시뮬레이션: 변경하지 않음
- 기준 차량 설계안: coil+CDC base와 air+CDC option을 분리한 추천안으로 보완
- 구현 계약: `vehicleSpec`/instance/signal 분리안으로 제시
- 구현 계약 보완: 구조화된 `BehaviorBinding`, assembly 소유권, Park lock topology를 추가
- 사용자 승인 필요: 9절 선택지. 특히 base/option 프로파일, CDC 센서 수준, column-assist EPS, e-axle integrated park lock
- 승인 후 첫 작업: Phase 0 데이터 계약 및 검증기 설계

