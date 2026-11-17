# TraceBack EV 에셋 제작·후속 작업 인수인계

작성일: 2026-11-16

이 문서는 `CONTINUATION_HANDOFF_2026-11-16.md`와 `IN_PROGRESS_LOG.md`의 남은 사용자 확인 항목을 바탕으로, 신규 에셋이 정말 필요한지와 다음 작업 순서를 분리한 문서다.

## 1. 먼저 결론

현재 확인된 3개 모델 오류가 모두 즉시 독립 3D 에셋을 뜻하는 것은 아니다.

| 항목 | 현재 권장 표현 | 독립 에셋 필요성 |
|---|---|---|
| 조향각 센서 | steering column/torque sensor 내부 통합 + 센서 링 오버레이 | 선택. 독립 센서 교육이면 제작 |
| 냉각수 온도센서 | 냉각수 호스/매니폴드에 장착되는 소형 probe | 선택. 온도센서 고장 교육이면 제작 권장 |
| park pawl | 전륜 e-axle 내부 parking gear와 함께 단면·exploded view | 외부 모델은 불필요. 내부 구조 교육이면 제작 |
| 휠 가속도센서 4개 | 각 wheel carrier/knuckle 부근의 동일 센서 인스턴스 | `cdc_full_corner_option` 선택 시에만 필요 |
| chiller | 냉각 회로의 plate heat exchanger 모듈 | air/열관리 사양 확정 후 필요 |

따라서 현재 단계에서 임의로 사진형 에셋을 만들지 않은 것은 의도된 보류다. 먼저 실제로 독립 부품을 학습시킬지, 기존 조립체 내부/오버레이로 충분한지를 확정해야 한다.

## 2. 제작을 의뢰할 때 사용할 프롬프트

아래 프롬프트는 실제 차량을 특정 양산차로 복제하지 않는 교육용 소형 전륜구동 EV 기준이다. 모든 결과물은 동일한 low-poly 스타일과 차량 좌표계에 맞춰야 한다.

### 공통 지시문

```text
Create a clean low-poly 3D game asset for an educational compact two-seat front-wheel-drive EV.
Use physically plausible automotive proportions, simple hard-surface topology, readable functional details,
matte dark graphite and muted metallic materials, no brand logos, no labels, no text, no decorative fantasy parts.
The asset must be suitable for a Three.js/WebGL scene, with a clearly defined authored origin and local axes.
Provide front/side/top reference views and a short note describing the intended mount anchor and moving axis.
Keep the object compact enough to fit at real vehicle scale and provide a transparent-background isolated render.
Negative prompt: photorealistic showroom scene, logo, text, watermark, extra wires, duplicate parts,
unrealistic glowing parts, floating geometry, ambiguous origin, broken topology, excessive bevels.
```

### A. 조향각 센서 — 필수 검토 1순위

```text
Using the common instruction, create a compact steering angle sensor assembly for a column-assist EPS.
Show a slim encoder ring mounted concentrically around the steering column, with a small fixed sensor housing
and one electrical connector. The ring rotates about the steering-column local X axis; the housing remains fixed.
Make the rotating ring and fixed housing separate named mesh groups: rotating_ring and fixed_housing.
Include a clear column_in and sensor_signal_out anchor. Do not create a second steering wheel or torque sensor.
```

### B. 냉각수 온도센서 — 필수 검토 2순위

```text
Using the common instruction, create a compact automotive coolant temperature sensor probe.
Show a threaded or push-fit probe body inserted into a coolant hose/manifold boss, a small hex mounting section,
and a two-pin connector. The probe should be visually understandable at small scale without becoming oversized.
Include coolant_in, coolant_out, and electrical_signal_out anchors. No glowing temperature effects and no text.
```

### C. Park pawl — 필수 검토 3순위

```text
Using the common instruction, create an internal integrated e-axle park-lock mechanism for an educational exploded view.
Show a toothed parking gear on the reduction/differential rotating shaft, a pivoting steel pawl, a return spring,
and a compact actuator contact point. Separate mesh groups into parking_gear, park_pawl, return_spring, and actuator_contact.
The parking gear rotates with the e-axle; the pawl pivots around its own fixed hinge axis and must not be shown as an
external rear-wheel component. Include lock_target, pawl_hinge, and actuator_contact anchors.
```

### D. 휠 가속도센서 — 선택 사양

```text
Using the common instruction, create one compact wheel-carrier accelerometer module for a four-corner CDC option.
Show a small rugged sensor body with a mounting tab and connector, sized for installation near the wheel carrier/knuckle.
Define one reusable asset that can be instantiated as wheel_acceleration_sensor.fl, .fr, .rl, and .rr.
Document the local measurement axis and mount anchor. Do not create four different meshes.
```

### E. Chiller — 열관리 사양 확정 후

```text
Using the common instruction, create a compact EV coolant chiller / plate heat-exchanger module.
Show two coolant ports, one refrigerant-side connection pair, a compact rectangular heat-exchanger body,
and clear in/out anchors. Keep the part separate from the AC compressor and EEV; do not merge their geometry.
The asset is for an optional air/thermal-management profile, not the default coil-plus-CDC vehicle.
```

## 3. 기존 에셋으로 처리할 항목

- EVCC, charge-lock actuator, AC compressor, PTC heater, EEV, ADAS camera/radar/ECU, TCU: 기존 code-built 모델을 사용하고 명시적 `PLACE` 좌표를 적용한다.
- Gateway ECU: `generic_ecu` 재사용. 별도 mesh보다 역할·신호 라벨이 중요하다.
- Diagnostic port: 외부 장비/포트 아이콘 또는 간단한 포트 모델로 표현한다.
- Steering knuckle/tie rod: 독립 mesh가 없으면 연결 topology overlay로 먼저 표시하고, 실제 조향 거동 검증 단계에서 독립 에셋 여부를 결정한다.

## 4. 사용자 확인이 필요한 작업

사용자가 직접 확인하거나 결정할 항목은 다음으로 한정한다.

1. 조향각 센서·냉각수 온도센서를 독립 부품으로 학습시킬지, 기존 조립체 내부 오버레이로 충분한지.
2. park pawl을 외부 전체보기에서 보여줄지, e-axle 단면/분해 보기에서만 보여줄지.
3. `cdc_full_corner_option`과 chiller를 실제 플레이 가능한 선택 사양으로 열지.
4. `IN_PROGRESS_LOG.md`에 남은 사용자 제공 이미지(고양이 사건 이미지, C04/C06 증거 이미지)를 교체할지.
5. 브라우저에서 정비소 전체보기/겹쳐보기와 일반 플레이 전체 경로를 직접 확인하고, 핸들·계기판·전륜·현가의 authored axis/anchor가 자연스러운지 승인할지.

## 5. 에이전트가 이어서 진행할 작업

1. 정비소 전체보기에서 아키텍처 캔버스와 도메인 탭·관점 레일·기능 패널·`다음 →` 진행 영역을 함께 유지한다.
2. 모델별 authored origin/local axis/mount anchor/bounding box를 브라우저에서 확인 가능한 QA 경로로 노출한다.
3. 조향·구동의 연결 topology와 4코너 현가/제동 인스턴스를 실제 렌더 결과와 대조한다.
4. 사용자 승인 후에만 독립 센서·park pawl·선택형 chiller 에셋을 추가한다.
5. 에셋 추가 후 `partModels.ts` 모델 존재, `VehicleLayout.tsx` 배치, `vehicleSpec.ts` instance/assembly, signal endpoint, 화면 거동을 순서대로 검증한다.

## 6. 현재 검증 기준

- 서버: `http://localhost:5183/`
- 화면 기준: 1600×900
- 좌표계: X 좌우, Y 높이, Z 전후, 전방 -Z, 운전석 -X
- 현재 Phase 0 수치: physical instances 62, assemblies 8, signal objects 6
- 현재 validator: errors 3, warnings 30
- 전체 수동 hover QA는 공통 안내 오버레이를 닫은 뒤 별도 수행해야 하며, 코드/자동 브라우저 검증을 실차 적합 판정으로 바꾸지 않는다.
