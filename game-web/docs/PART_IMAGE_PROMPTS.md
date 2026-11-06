# EV 부품 이미지 생성 프롬프트 (전체 부품)

작성일: 2026-11-06 · 생성 도구: ChatGPT(GPT 이미지) · 3D 변환: TRELLIS(MIT) 또는 Meshy 무료(CC BY 4.0, 표기 의무)
관련 문서: [TIER_C_ASSET_PLAN.md](TIER_C_ASSET_PLAN.md) · 부품 ID 기준: `src/sim/components.ts`

생성한 이미지는 세 곳에 씁니다.
1. **3D 제작 참고** — 제가 코드로 직접 모델링할 때 비율·형상 기준, 또는 TRELLIS 입력
2. **게임 내 2D 그래픽** — 메모판 증거 폴라로이드, 배선 작업대 부품 트레이, 쌍둥이 실험대 부품 카드, 차고 학습 카드
3. **정상/고장 비교 연출** — 실험대·검증 단계의 상태 변화 그림

---

## 1. 사용 방법

1. 아래 **부품 문장**(표의 `Subject`) 뒤에 원하는 **스타일 접미사** 하나를 붙여 ChatGPT에 입력합니다.
2. 한 번에 이미지 1장만 생성합니다. 같은 용도의 이미지는 같은 접미사를 그대로 써야 화풍이 통일됩니다.
3. 저장 경로·파일명: `game-web/asset-intake/images/<부품ID>__<스타일코드>.png`
   예) `traction_motor__REF.png`, `cooling_fan__EVID-fault.png`
4. 같은 폴더의 `PROMPT_LOG.md`에 날짜·사용 프롬프트·도구를 한 줄씩 기록합니다. 그다음 게임 반영은 제가 맡습니다.

> 이미지에는 **글자·숫자·로고·브랜드를 넣지 않습니다.** 라벨, 단위, 값은 게임 UI가 위에 덧붙입니다. 실제 제조사 제품을 그대로 그린 이미지는 쓰지 않습니다.

---

## 2. 스타일 접미사 (5종)

### `REF` — 3D 제작 참고 / TRELLIS 입력 (정사각 1024)
```
Single isolated object, three-quarter front view from slightly above, plain pure white background,
soft even studio lighting, no shadows on background, no text, no logos, no brand names,
realistic industrial product render, clean geometry, entire object visible with margin.
```

### `TURN` — 직접 모델링용 3면도 시트 (가로 3:2)
```
Technical turnaround reference sheet of the same single object: front view, side view, top view
and one three-quarter view arranged in a clean grid, orthographic projection for the three flat views,
identical scale in every view, neutral light grey background, flat even lighting,
no text, no labels, no dimensions, no logos, realistic materials.
```

### `CUT` — 게임 부품 카드용 컷아웃 (정사각, 기존 `vehicle-component-cutouts-v1.png`와 같은 화풍)
```
Photorealistic automotive component product shot, three-quarter view, isolated on a transparent background,
soft key light from upper left with gentle rim light, crisp machined and cast-metal surface detail,
consistent scale and camera height, no text, no logos, no brand names, no background objects.
```

### `EVID` — 메모판 증거 폴라로이드 (정사각, 기존 `diagnostic-evidence-sheet-v1.png`와 같은 화풍)
```
Close-up investigative photograph inside a dim warm-lit EV repair workshop, shallow depth of field,
cinematic amber and teal lighting, slightly worn vintage instant-photo look with a cream border,
subtle glowing signal trace effects allowed, no readable text, no numbers, no logos, no people's faces.
```
- 정상 상태: 문장 끝에 `, healthy state, calm teal signal glow` 추가 → 파일명 `__EVID-ok`
- 이상 상태: 문장 끝에 `, abnormal state, red warning glow at the point of failure` 추가 → 파일명 `__EVID-fault`
- 원인 후보(가설) 카드는 정답이 그림으로 드러나지 않도록 **정상·이상 표현 없이** 중립 버전만 만듭니다.

### `EXPL` — 분해도·단면 (가로 3:2, 내부 구조 학습용)
```
Clean exploded-view illustration of the same object, components separated along one axis with even spacing,
realistic materials, neutral light grey background, soft studio lighting, no text, no labels, no arrows, no logos.
```

---

## 3. 부품별 Subject 문장

표기: **ID**는 시뮬레이션 레지스트리 ID(`*` = 아직 레지스트리에 없는 예정 ID) · **추천 스타일** · **3D 방식**(직접 = 제가 코드로 모델링, AI = 이미지→3D 시도, 2D = 이미지로만 사용)

공통 머리말 — 모든 Subject는 `Generic passenger electric vehicle part, not resembling any specific manufacturer:` 로 시작하면 브랜드 유사성을 줄일 수 있습니다.

### 3-1. 운전자 입력장치 (HMI)
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `accel_pedal` | 가속 페달 | Floor-hinged accelerator pedal assembly with a black textured rubber pedal pad, plastic arm, compact dual-track position sensor housing at the pivot and a short wire harness with connector | REF, CUT, EVID | 직접 |
| `brake_pedal` | 브레이크 페달 | Suspended brake pedal assembly with a steel arm, wide rubber pedal pad with horizontal ribs, pivot bracket, return spring and a small pedal stroke sensor clipped to the bracket | REF, CUT, EVID | 직접 |
| `steering_wheel` | 스티어링 휠 | Three-spoke passenger car steering wheel with dark leather rim, brushed metal spoke trim, central airbag cover without emblem, viewed from the driver seat | REF, TURN, CUT | 직접 |
| `gear_selector` | 기어 셀렉터 | Electric vehicle rotary gear selector dial with knurled aluminum ring and soft glowing P R N D indicator dots without letters, set in a dark center console panel | REF, CUT | 직접 |
| `start_button` | 시동 버튼 | Round push-button start stop switch with a chrome bezel, matte black button face, a thin glowing ring and a power symbol icon only, mounted in a dashboard trim piece | REF, CUT, EVID | 직접 |
| `instrument_cluster`* | 계기판 | Digital instrument cluster with a curved anti-glare glass panel, two circular gauge areas showing only abstract arcs and needles, slim dark housing | CUT, EVID | 2D (게임은 HUD로 표시) |
| `steering_column`* | 스티어링 칼럼 | Steering column assembly with tilt and telescopic adjustment bracket, upper shaft, universal joint at the lower end and a clock spring housing behind the wheel hub | REF, TURN | 직접 |
| `epb_switch`* | 전자식 주차 브레이크 스위치 | Small electronic parking brake pull-up switch with a parking icon only, black plastic housing in a console panel | CUT | 2D |

### 3-2. 센서
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `wheel_speed_sensor` | 휠 속도 센서 | Active wheel speed sensor with a cylindrical sensing tip, single mounting ear with bolt hole, molded plastic body and a short cable with clip, next to a toothed tone ring | REF, CUT, EVID | 직접 |
| `rotor_position_sensor` | 모터 위치 센서(리졸버) | Electric motor resolver made of a thin laminated stator ring with copper windings and a lobed steel rotor ring, small connector lead | REF, EXPL, CUT | 직접 |
| `motor_temp_sensor` | 모터 온도 센서(NTC) | Small thermistor temperature sensor with a thin probe tip, heat-shrink sleeve and a fine two-wire lead ending in a mini connector | REF, CUT, EVID | 직접 |
| `coolant_temp_sensor`* | 냉각수 온도 센서 | Coolant temperature sensor with brass threaded body, hex nut, metal probe tip and black two-pin connector | REF, CUT | 직접 |
| `steering_angle_sensor`* | 조향각 센서 | Ring-shaped steering angle sensor module with a central opening for the column shaft, black plastic housing and multi-pin connector | REF, CUT | 직접 |
| `steering_torque_sensor`* | 조향 토크 센서 | Steering torque sensor section of a column shaft with a torsion bar housing, magnetic sensing ring and small connector | REF, EXPL | 직접 |
| `pack_current_sensor`* | 배터리 전류 센서 | Hall-effect high-current sensor clamped around a copper busbar, compact black housing with mounting tabs and small connector | REF, CUT | AI |
| `brake_pressure_sensor`* | 브레이크 압력 센서 | Hydraulic brake pressure sensor with a threaded steel port, cylindrical stainless body and three-pin connector | REF, CUT | 직접 |
| `imu_sensor`* | 요레이트·가속도 센서 | Small automotive inertial sensor module in a sealed black housing with mounting bracket and connector | CUT | AI |

### 3-3. 제어기 (ECU) — 게임에서는 추상 노드로도 표시
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `vcu` | VCU | Vehicle control unit in a cast aluminum housing with cooling fins on the lid, four mounting ears and two large sealed multi-pin connectors | REF, CUT, EVID | 직접 |
| `mcu` | MCU 모터 제어기 | Motor control circuit board with gate driver section, microcontroller and current sensing area, mounted on a cast aluminum inverter lid, cut-away view | CUT, EXPL | 직접 (인버터 내부) |
| `bms` | BMS | Battery management system master control unit, black plastic housing on an aluminum base plate, two grey multi-pin connectors and four mounting tabs | REF, CUT | AI |
| `cell_monitor_board`* | 셀 모니터링 보드 | Battery cell monitoring circuit board with a row of voltage sense pins and a ribbon harness, mounted on top of a battery module | CUT, EVID | 직접 |
| `thermal_ecu` | 열관리 ECU | Compact thermal management controller in a black plastic housing with one multi-pin connector and a bracket | CUT | 직접 |
| `brake_ecu` | 제동 ECU | Electronic brake control unit attached to a hydraulic valve block, black housing with a large multi-pin connector | CUT | 직접 (모듈레이터와 일체) |
| `eps_ecu` | EPS ECU | Power steering control unit mounted directly on the end of an electric assist motor, finned aluminum cover and two connectors | CUT | 직접 |
| `gateway`* | 중앙 게이트웨이 | Central gateway module with several network connectors in a row, flat black housing with mounting ears | CUT | AI |

### 3-4. 전원·배터리
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `battery_cell`* | 배터리 셀 | Set of three lithium-ion cell formats side by side: cylindrical cell, prismatic aluminum can cell and soft pouch cell, terminals visible | REF, CUT | 직접 |
| `battery_module`* | 배터리 모듈 | Lithium-ion battery module made of many cells in a holder, nickel busbar strips across the top, aluminum end plates, small grey sensing harness connector | REF, EXPL, CUT | 직접 |
| `hv_battery` | 배터리 팩 | Flat rectangular traction battery pack enclosure, cast aluminum lid with stiffening ribs, bolted perimeter flange, two orange high-voltage connectors and one black low-voltage connector on the front edge, coolant pipe stubs | REF, EXPL, CUT | 직접 |
| `battery_cooling_plate`* | 배터리 냉각판 | Thin aluminum battery cooling plate with internal serpentine coolant channels visible in a cut-away, two pipe connections at one end | REF, EXPL | 직접 |
| `hv_junction_box`* | HV 정션박스 | High-voltage junction box, grey die-cast housing, several orange high-voltage cable glands, blank warning label area, bolted cover | REF, CUT | AI |
| `main_contactor` | 메인 컨택터 | High-voltage DC contactor, cylindrical black body, two large threaded copper terminals on top, small two-pin coil connector, mounting flange | REF, CUT, EVID | 직접 |
| `precharge_circuit`* | 프리차지 회로 | Pre-charge circuit assembly: small contactor next to a finned ceramic power resistor on a shared bracket with short orange links | REF, CUT | 직접 |
| `dcdc_converter`* | DC/DC 컨버터 | DC-DC converter module, finned cast aluminum housing, one orange high-voltage connector, one thick low-voltage output stud, coolant pipe stubs | REF, CUT | AI |
| `lv_battery`* | 12V 보조 배터리 | Compact 12 volt automotive auxiliary battery with grey case and red and black terminal covers, no label text | REF, CUT | 직접 |
| `service_disconnect`* | 서비스 차단 플러그 | High-voltage manual service disconnect plug with an orange handle and lock lever, seated in its socket | REF, CUT | 직접 |
| `hv_cable`* | 고전압 케이블·커넥터 | Bundle of thick orange high-voltage cables with corrugated sleeve and two sealed orange right-angle connectors | REF, CUT, EVID | 직접 |
| `lv_harness`* | 저전압 하니스 | Low-voltage wiring harness with black corrugated conduit, branch takeouts and several small sealed connectors | CUT, EVID | 직접 |

### 3-5. 구동계
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `inverter` | 구동 인버터 | Traction inverter in a cast aluminum box with a ribbed lid, two orange DC input connectors, three short orange phase output terminals, one low-voltage signal connector and coolant pipe stubs | REF, EXPL, CUT, EVID | 직접 |
| `traction_motor` | 구동 모터 | Permanent-magnet traction motor with a cylindrical cast aluminum housing, cooling jacket ribs, splined output shaft on one end and three orange phase cables entering a terminal box | REF, TURN, CUT, EVID | 직접 |
| `motor_stator`* | 스테이터 | Motor stator: laminated steel core ring with dense copper hairpin windings protruding from both faces | REF, EXPL | 직접 |
| `motor_rotor`* | 로터 | Motor rotor: laminated steel rotor stack with embedded magnet slots visible on the end face, mounted on a splined steel shaft with two bearings | REF, EXPL | 직접 |
| `reduction_gear` | 감속기 | Single-speed reduction gearbox with cast aluminum housing, motor input opening, two output shaft flanges and mounting bosses; exploded version shows helical gears and shafts | REF, EXPL, CUT | 직접 |
| `differential` | 차동기어 | Open differential assembly with ring gear, carrier housing, and visible bevel side gears and spider gears in a cut-away | REF, EXPL | 직접 |
| `drive_shaft` | 드라이브 샤프트 | Front drive shaft with a steel bar, constant-velocity joints on both ends covered by black ribbed rubber boots, splined stub ends | REF, CUT | 직접 |
| `wheel` | 휠·허브 | Wheel hub bearing unit with five wheel studs, flange and splined center bore, shown next to an alloy wheel and tyre | REF, CUT | 직접 (레이싱 바퀴 재사용) |

### 3-6. 제동계
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `brake_booster`* | 전자식 브레이크 부스터 | Electromechanical brake booster unit with a cylindrical body, integrated electric motor housing on the side, brake fluid reservoir on top and pedal pushrod at the back | REF, CUT | 직접 |
| `master_cylinder`* | 마스터 실린더 | Tandem brake master cylinder with translucent fluid reservoir and cap, two brake line ports and a mounting flange | REF, EXPL, CUT | 직접 |
| `hydraulic_modulator` | 유압 모듈레이터 | Brake hydraulic modulator: machined aluminum valve block with brake line ports, attached black electronic control module with connector, small pump motor cylinder | REF, CUT, EVID | AI → 직접 보정 |
| `brake_caliper` | 브레이크 캘리퍼 | Floating single-piston brake caliper in dark grey cast iron, slide pins and bleed nipple visible, mounted over a brake disc | REF, EXPL, CUT, EVID | 직접 |
| `brake_disc`* | 브레이크 디스크 | Ventilated brake disc with internal cooling vanes visible at the edge and a central hat section with five bolt holes | REF, CUT | 직접 |
| `brake_pad`* | 브레이크 패드 | Pair of brake pads with steel backing plates and friction material blocks with a center groove; one new and one worn for comparison | CUT, EVID | 직접 |
| `brake_line`* | 브레이크 배관·호스 | Rigid steel brake line with flare nuts connected to a black reinforced flexible brake hose with banjo fitting | CUT, EVID | 직접 |

### 3-7. 조향·현가계
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `eps_motor` | EPS 보조 모터 | Electric power steering assist motor with a short cylindrical housing, worm gear reduction housing and attached control unit | REF, EXPL, CUT | 직접 |
| `steering_rack` | 스티어링 랙 | Rack-and-pinion steering gear: long aluminum rack housing with black rubber bellows boots at both ends, pinion input on one side; cut-away shows rack teeth meshing with the pinion | REF, EXPL, CUT | 직접 |
| `tie_rod`* | 타이로드 | Inner and outer tie rod assembly with threaded adjuster, lock nut and ball joint with rubber dust boot | REF, CUT | 직접 |
| `knuckle`* | 너클 | Front steering knuckle in cast iron with strut mounting ears, steering arm, lower ball joint boss and central hub bearing bore | REF, TURN | 직접 |
| `control_arm`* | 컨트롤 암 | Lower control arm, stamped steel L-shape, two rubber bushings at the body mounts and a ball joint at the outer end | REF, CUT | 직접 |
| `coil_spring`* | 코일 스프링 | Painted steel coil spring with evenly pitched coils and flat ground ends | REF, CUT | 직접 |
| `damper`* | 댐퍼(쇼크업소버) | Twin-tube shock absorber with chrome piston rod, dust boot, bump stop and lower mounting eye; cut-away shows piston and valves | REF, EXPL, CUT | 직접 |
| `strut_assembly`* | 스트럿 어셈블리 | Complete front strut assembly: damper inside a coil spring with upper mount and bearing | REF, CUT | 직접 |
| `anti_roll_bar`* | 스태빌라이저 바 | Bent solid steel anti-roll bar with two rubber bushings and short end links with ball joints | REF, CUT | 직접 |

### 3-8. 열관리
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `cooling_pump` | 전동 냉각수 펌프 | Electric coolant pump with a compact cylindrical motor body, volute housing with one inlet and one outlet pipe, small connector | REF, EXPL, CUT, EVID | 직접 |
| `radiator`* | 라디에이터 | Aluminum cross-flow radiator core with thin fins, plastic end tanks with inlet and outlet necks | REF, CUT | 직접 |
| `cooling_fan` | 냉각 팬 | Electric radiator cooling fan in a black plastic shroud with seven curved blades, central motor hub and a short pigtail connector | REF, CUT, EVID | 직접 |
| `coolant_reservoir`* | 냉각수 리저버 | Translucent white plastic coolant expansion reservoir with a pressure cap, hose spigots and mounting tabs, fluid level visible | REF, CUT | 직접 |
| `cooling_pipe`* | 냉각 배관 | Set of molded black rubber coolant hoses and aluminum pipes with spring clamps and quick-connect fittings | CUT, EVID | 직접 |
| `chiller`* | 칠러(열교환기) | Compact plate heat exchanger (chiller) with stacked aluminum plates and four pipe connections | REF, CUT | AI |
| `coolant_valve`* | 냉각수 다방향 밸브 | Electric multi-way coolant valve with a round plastic body, several pipe ports around it and an actuator motor on top | REF, CUT | AI |

### 3-9. 충전
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `charging_port`* | 충전 포트 | Electric vehicle combined charging inlet socket in a black plastic housing with hinged flap open, AC pins on top and two large DC pins below | REF, CUT, EVID | AI |
| `obc`* | 차량 탑재 충전기(OBC) | On-board charger unit, rectangular aluminum housing with cooling fins, AC input connector and orange DC output connector, coolant ports | REF, CUT | AI |
| `dc_charge_connector`* | DC 급속 충전 커넥터 | DC fast charging connector gun with a thick black cable, ergonomic handle and large DC pins, no brand marks | REF, CUT | AI |
| `ac_charge_cable`* | AC 충전 케이블 | Portable AC charging cable with an in-cable control box and vehicle connector, neatly coiled | CUT | 2D |

### 3-10. 통신·진단
| ID | 부품 | Subject | 추천 스타일 | 3D 방식 |
|---|---|---|---|---|
| `can_harness`* | CAN 통신선 | Twisted-pair network cable inside a harness branch with two sealed multi-pin connectors | CUT, EVID | 직접 |
| `diagnostic_port`* | 진단 포트 | Sixteen-pin vehicle diagnostic connector socket mounted under a dashboard panel | CUT, EVID | 2D |
| `diagnostic_tool`* | 진단 장비 | Rugged handheld diagnostic tablet connected by cable to a vehicle interface adapter, screen showing abstract waveforms only | EVID | 2D |

### 3-11. 향후 확장 도메인 (우선순위 낮음)
| ID | 부품 | Subject | 추천 스타일 |
|---|---|---|---|
| `ac_compressor`* | 전동 에어컨 컴프레서 | Electric scroll air-conditioning compressor with integrated inverter housing and refrigerant ports | REF, CUT |
| `ptc_heater`* | PTC 히터 | High-voltage PTC heater core with ceramic heating elements and aluminum fins in a plastic frame | REF, CUT |
| `headlamp_module`* | 헤드램프 | LED headlamp module with projector lens and reflector housing, clear outer lens removed | CUT |
| `wiper_motor`* | 와이퍼 모터 | Windshield wiper motor with gearbox and linkage arms | CUT |
| `door_latch`* | 도어 래치 액추에이터 | Door latch actuator with metal latch plate and small electric motor housing | CUT |
| `seat_motor`* | 시트 모터 | Power seat adjustment motor with worm drive and track rail section | CUT |
| `adas_camera`* | 전방 카메라 | Forward-facing driver-assistance camera module with lens and windshield bracket | CUT |
| `adas_radar`* | 전방 레이더 | Front radar sensor module with flat radome face and mounting bracket | CUT |
| `airbag_ecu`* | 에어백 제어기 | Airbag control unit in a sealed metal housing with a yellow multi-pin connector | CUT |

---

## 4. 메모판·검증 단계용 사건 증거 프롬프트 (`EVID`)

현재 시나리오(`src/game/scenarios.ts`)의 증거 ID와 1:1로 맞췄습니다. 값(60%, 92 Nm 등)은 그림에 넣지 않고 카드 UI가 표시합니다.

| 사건 | 증거 ID | Subject (+ `EVID` 접미사) |
|---|---|---|
| 구동 | `pedal_raw` | A driver's shoe pressing the accelerator pedal about halfway down in a car footwell, pedal sensor housing visible at the pivot |
| 구동 | `pedal_processed` | Close-up of the accelerator pedal sensor connector and harness leading toward a control unit, signal glow travelling along the wire and fading halfway |
| 구동 | `torque_cmd` | Vehicle control unit on a test bench sending a glowing pulse along a network cable to a traction inverter |
| 구동 | `motor_actual` | Traction motor coupled to a dynamometer shaft on a test bench, abstract waveform on a monitor behind it |
| 열관리 | `motor_temp` | Traction motor housing with a temperature sensor probe attached, faint heat shimmer around the housing |
| 열관리 | `thermal_protection` | Inverter and motor on a bench with a soft protective glow over the power cables, as if output is being limited |
| 열관리 | `fan_command` | Thermal controller sending a glowing square-wave pulse along a wire to a radiator cooling fan connector |
| 열관리 | `fan_actual` | Radiator cooling fan blades standing completely still behind the shroud, dust on the hub |
| 제동 | `brake_request` | A driver's shoe pressing the brake pedal firmly in a car footwell, pedal stroke sensor visible |
| 제동 | `regen_request` | Traction motor and inverter with a glowing energy flow returning toward a battery pack |
| 제동 | `brake_actual` | Brake caliper and disc on a wheel hub with a brake line, the hydraulic line glowing only faintly |

정상/고장 비교가 필요하면 같은 Subject로 `EVID-ok`와 `EVID-fault` 두 장을 만듭니다. 이때 카메라 구도는 바꾸지 말고 상태 문구만 바꿉니다.

---

## 5. 직접 모델링 우선순위 (시각화 연계)

이미지가 있으면 제가 모델링할 때 비율을 맞추기 쉬워집니다. 아래 순서로 `REF` + `TURN` 이미지를 먼저 받으면 효율이 가장 좋습니다.

1. **사건 1(구동):** `accel_pedal`, `vcu`, `inverter`, `traction_motor`(+ `motor_stator`, `motor_rotor` EXPL), `reduction_gear`, `drive_shaft`
2. **사건 2(열관리):** `motor_temp_sensor`, `thermal_ecu`, `cooling_pump`, `radiator`, `cooling_fan`
3. **사건 3(제동):** `brake_pedal`, `brake_booster`, `hydraulic_modulator`, `brake_caliper`, `brake_disc`, `brake_pad`, `wheel_speed_sensor`
4. **운전자 입력장치(레이싱 연동):** `steering_wheel`, `gear_selector`, `start_button`
5. **전원:** `battery_cell` → `battery_module` → `hv_battery`, `main_contactor`, `precharge_circuit`
6. 그 외 조향·현가·충전·확장 도메인

> 2D 이미지와 3D 모델을 함께 쓰더라도, 같은 부품은 같은 형상·색으로 보이도록 3D 제작 시 이 이미지를 기준으로 맞춥니다(학습·검증 동일 에셋 원칙).
