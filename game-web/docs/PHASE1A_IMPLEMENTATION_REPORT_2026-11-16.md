# TraceBack EV Phase 1-A 구현 보고서

작성일: 2026-11-16  
범위: 승인된 Phase 1-A만 수행  
상태: **조향·전륜 e-axle 구조 구현 완료 / Phase 1-B 승인 대기**

## 1. 수행 범위와 금지 범위

이번 단계에서 실제로 변경한 것은 차량 정비소 3D 표현의 조향·전륜 구동 topology와 그 검증 계약뿐이다.

- 수행: Hero↔정비소 기존 프레임 변환 기록·계산, 조향 wheel/column/EPS/rack/tie-rod/전륜 연결 표현, 전륜 e-axle의 motor/reducer/differential/좌우 halfshaft/hub 연결 표현
- 수행: 단일 기능 체인 휠·반축이 4륜 문맥과 중복되거나 한쪽에만 보이는 문제의 렌더링 경로 차단
- 수행: 기존 model anchor contract를 임의로 확장하지 않고, 좌우 출력은 topology overlay와 VehicleSpec instance 관계로 분리 기록
- 수행: 변환 수학 및 기존 11개 도메인 × 4개 기능 역방향 감사 테스트
- 금지 준수: STEP02~04, 고장 시나리오, 정답 판정, 시뮬레이션, 현가·제동·열관리·충전·ADAS·통신 물리 모델, 공통 UI 레이아웃은 변경하지 않음
- 신규 외부 에셋 생성 없음. 조향각 센서는 기존 steering wheel 내부 ring과 별도의 B3 preview overlay로 표현했으며, 독립 모델이 생겼다고 판정하지 않음.

## 2. 실제 변경 파일

| 파일 | 변경 내용 | 이유 |
| --- | --- | --- |
| `src/features/garage/VehicleLayout.tsx` | 운전석 기준 PLACE, EPS/column 보조 위치, 4륜 context, 조향·e-axle topology, chain의 단일 wheel/shaft 중복 차단 | 화면에 한쪽 wheel/shaft만 나타나거나 steering geometry가 직선으로 오해되는 문제를 구조적으로 분리 |
| `src/features/garage/vehicleTransforms.ts` | 기존 U=1.53, 부모 위치 `[0,-.25,0]`, 부모 Y 회전 `-.18`을 계산 함수로 기록 | 좌표를 임의로 바꾸지 않고 local/world 변환과 bounds를 재현하기 위해 |
| `src/features/parts/partModels.ts` | Hero 운전석 주석 정정; 기존 differential/rack port-anchor contract는 유지 | 기존 simulation port를 Phase 1-A에서 임의 확장하지 않기 위해 |
| `tests/vehicle-spec.test.mjs` | 11×4 역방향 감사 및 Hero↔garage 변환 회귀 테스트 보강 | 데이터·변환 계약이 다시 한쪽 배치로 후퇴하지 않도록 |
| `docs/PHASE1A_IMPLEMENTATION_REPORT_2026-11-16.md` | 본 결과 보고서 | Phase 1-A 범위와 미완료 항목 고정 |

`vehicleSpec.ts`의 Phase 0 계약은 이번 단계의 topology를 임의의 정상값으로 덮어쓰지 않으며, 현재 미확인 상태를 그대로 유지한다.

## 3. 좌표계와 부모 변환

기존 Hero와 정비소가 공유하는 기준은 다음과 같이 유지했다.

- 차량 X: 좌우, 운전석 `-X`
- 차량 Y: 지면 기준 높이
- 차량 Z: 전후, 전방 `-Z`
- 전륜 차축 `Z=-1.18`, 후륜 차축 `Z=+1.16`
- 휠 중심 `X=±0.745`, `Y=.34`, 반지름 `.34`
- 정비소 scene scale `U=1.53`
- 정비소 부모 위치 `[0,-.25,0]`, 부모 Y 회전 `-.18`

Phase 1-A는 이 부모 변환을 변경하지 않았다. `vehicleTransforms.ts`는 raw Hero metre 좌표를 정비소 local/world 좌표로 바꾸고, 회전된 bounding box를 계산한다.

예시 계산 결과:

- steering wheel raw `[-.31,.86,-.17]` → garage world 약 `[-.4201,1.0658,-.3408]`
- front-left wheel raw `[-.745,.34,-1.18]` → garage world 약 `[-.7982,.2702,-1.9803]`
- front-right wheel raw `[+.745,.34,-1.18]` → garage world 약 `[1.4447,.2702,-1.5722]`

이는 화면에서 좌우가 대칭인 world X라는 뜻이 아니라, 기존 부모 Y 회전이 적용된 world 좌표라는 뜻이다. 차량 기준 좌우 대칭은 회전 전 Hero/local 좌표에서 판정해야 한다.

## 4. 조향 최종 명세

| 인스턴스 | 차량 기준 위치(m) | 회전 | 역할/anchor |
| --- | --- | --- | --- |
| steering wheel | `[-.31,.86,-.17]` | `[-.38,0,0]` | local X 회전축; `column_out`으로 column 전달, `angle_out`은 기존 ring |
| steering torque sensor | `[-.31,.78,-.34]` | local X를 `[0,-.42,-.91]`로 정렬 | torque input/output 계측 위치 |
| steering column | `[-.31,.72,-.52]` | local X를 `[0,-.42,-.91]`로 정렬 | wheel에서 intermediate shaft/EPS 방향으로 토크 전달 |
| EPS motor | `[-.31,.68,-.50]` | `[0,0,-.38]` | column-assist 위치; `assist_out` |
| EPS power pack | `[-.31,.58,-.64]` | column 축 정렬 | EPS 보조 전원/제어 표현 |
| pinion/rack | rack center `[0,.38,-1.18]`, pinion target `[0,.505,-1.18]` | rack local X | rack travel은 차량 X 방향 |
| tie rod / front knuckle | rack `X=±.46`, hub `X=±.745`, `Y=.34`, `Z=-1.18` | 각 전륜 yaw | 좌우 독립 연결 overlay; 별도 knuckle asset은 아직 미확정 |
| steering-angle sensor | wheel 주변 ring + B3 overlay | wheel local X | 독립 3D asset/anchor는 아직 missing-required로 유지 |

화면상 조향 topology는 `wheel → column → EPS → pinion → rack → left/right tie rod → front hub/knuckle` 순서를 끊어진 단일 직선이 아니라 링크들로 보여준다. 입력이 없을 때 회색 static link, 사용자 입력이 들어온 조향 화면에서는 보라색 B3 preview link와 앞바퀴 yaw가 표시된다. 실제 EPS simulation 값이 생겼다고 주장하지 않는다. 기존 `steering_rack.tie_rod_out`이 단일 port인 것은 기존 simulation 계약의 미해결 사항으로 남겼다.

## 5. 전륜 e-axle 최종 명세

기준 연결은 다음과 같다.

```text
traction motor → reduction gear → differential
                                  ├─ halfshaft.fl → front hub.fl
                                  └─ halfshaft.fr → front hub.fr
```

| 인스턴스 | 차량 기준 위치(m) | 회전/anchor |
| --- | --- | --- |
| traction motor | `[-.20,.42,-1.18]` | authored local X, 정비소 `r=[0,0,0]` |
| reduction gear | `[+.18,.40,-1.18]` | authored local X, motor 입력에서 differential 방향 |
| differential | `[0,.36,-1.18]` | local X 회전; 기존 model anchor는 `in`, `left_out`; 우측 출력은 topology overlay로 명시 |
| halfshaft.fl | `[-.38,.34,-1.18]` | local X를 `Y=π`로 반전해 좌측 출력 방향 |
| halfshaft.fr | `[+.38,.34,-1.18]` | local X 정방향 |
| front hub.fl/fr | `X=±.745,.34,-1.18` | wheel local X 회전축 |

기존 chain이 하나의 `drive_shaft` 또는 하나의 `wheel`만 공급하더라도, 정비소 context는 4개 wheel을 보유한다. drive domain에서는 chain의 단일 wheel/drive_shaft 노드를 숨기고, topology가 좌우 반축 2개를 렌더링한다. overview에서도 같은 정책을 적용해 one-sided duplicate를 차단했다. 기존 `differential.left_out → drive_shaft.in` 하나의 simulation connection은 변경하지 않았고, 우측 출력의 교육용 시각 topology만 추가했다.

조립체 내부 부품은 별도 표시되고, `front_eaxle_assembly` 자체를 추가로 그리는 방식은 사용하지 않았다. 따라서 현재 단계에서는 assembly/component geometry 이중 렌더링을 만들지 않는다. park lock은 전륜 e-axle 관계와 anchor만 유지하며, 실제 pawl 잠금 거동은 구현하지 않았다.

## 6. Phase 0 검증기와 역방향 감사 현재값

현재 `PHASE0_VEHICLE_SPEC`의 실제 검증 결과:

| 항목 | 현재값 |
| --- | ---: |
| physical instance | 62 |
| assembly | 8 |
| signal object | 6 |
| read-only part metadata | 68 |
| validation errors | 5 |
| validation warnings | 28 |
| 역방향 audit entries | 206 |
| unresolved labels | 29 |
| missing references | 28 |

오류 5건은 여전히 다음과 같다.

- `steering_angle_sensor` 독립 모델/anchor 없음
- `coolant_temperature_sensor` 독립 모델/배치 없음
- `evcc` fallback placement
- `charge_lock_actuator` fallback placement
- `park_pawl` confirmed geometry 없음

이 수치를 0으로 만들기 위해 임의 모델·좌표를 만들지 않았다. 28개 warning도 코너별 transform 미검증 및 optional wheel acceleration sensor missing 상태를 유지한다.

역방향 감사는 11개 도메인의 44개 feature를 기준으로 총 206개 physical/signal label을 점검한다. `steering_angle_sensor`, `differential`, `halfshaft.fl/fr`, 4륜 brake/speed sensor 등의 참조가 단일 ID로 조용히 축약되지 않는지 확인한다. 다만 `PRND 센서`, `프리차지 저항`, `유압 라인`, `ABS ECU`처럼 현재 물리 instance로 확정되지 않은 29개 label은 unresolved로 보고된다.

## 7. 테스트·빌드·서버

- `npm test`: **154 passed / 0 failed**
- `npm run build`: **통과**
- Vite chunk-size warning: 기존 대형 bundle warning만 존재
- `GET http://localhost:5183/`: **HTTP 200**
- 자동 브라우저 캡처: Edge가 현재 URL을 신뢰성 있게 식별하지 못해 computer-use가 중단됨

따라서 1600×900 화면은 코드/빌드 기준으로 완료했다고 판정하지 않고, 사용자가 직접 보는 Chrome 수동 QA를 남은 검수로 명시한다. 브라우저에서 반드시 확인할 항목은 다음이다.

1. 정비소 전체보기에서 4개 wheel이 차체의 네 코너에 있고, one-sided drive shaft가 추가로 보이지 않는지
2. 조향 도메인에서 steering wheel/cluster가 운전석 `-X` 앞에 있고 rack/tie rod가 양쪽 front hub로 연결되는지
3. drive 도메인에서 motor/reducer/differential 뒤에 좌우 halfshaft가 모두 보이는지
4. 입력 전 링크가 움직이지 않고, 조향 입력 시에만 front wheel yaw/B3 preview가 나타나는지
5. 1600×900에서 Html label/link가 차체 밖으로 튀거나 서로 겹치지 않는지

## 8. 미해결 및 Phase 1-B로 넘긴 항목

- steering-angle sensor 독립 asset 또는 integrated ring의 최종 교육 표현 승인
- knuckle/tie-rod의 실제 3D asset 및 front suspension 운동 관계
- 4코너 spring/damper/CDC/ride-height/wheel-acceleration의 authored anchor·bounds·운동 검증
- brake disc/hub와 fixed caliper의 중복/회전 관계 전수 검증
- EVCC, charge-lock, thermal 신규 부품의 실제 package 좌표
- park pawl geometry와 실제 parking lock 거동
- 실제 simulation signal을 갖춘 B1 binding; 현재 조향 preview는 B3
- 기존 simulation graph의 단일 `differential.left_out`/`steering_rack.tie_rod_out`을 좌우 endpoint로 확장할지 여부
- 1600×900 Chrome 수동 전수 QA 및 화면 캡처

**Phase 1-A 이후 Phase 1-B 구현은 진행하지 않는다.**
