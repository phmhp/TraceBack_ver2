# TraceBack EV 추가 누락 에셋 생성 프롬프트

> 작성 목적: 기존 에셋 대조에서 확인된 신규 제작 후보 중 실제로 누락된 `park_pawl` 에셋을 생성하기 위한 별도 프롬프트입니다.
>
> 생성 파일 저장 위치:
> `public/assets/intake/images/adas/`
>
> 공통 규칙: 코드 블록 하나를 이미지 생성 요청 하나로 사용합니다. 이미지 안에 부품명, 화살표, 치수, 로고, 설명문, 워터마크, UI 카드, 콜라주를 넣지 않습니다. 생성 후 파일명은 직접 지정합니다.

## 현재 에셋 대조 결과

| 후보 | `adas` 폴더 | 프로젝트 내 다른 위치 | 기존 프롬프트 | 조치 |
|---|---:|---:|---:|---|
| 조향각 센서 | 없음 | `images/sensors/steering_angle_sensor__REF.png`, `__CUT.png` 있음 | `02-sensors.md`에 있음 | 재생성하지 않음. 필요하면 `adas` 폴더에 복사 |
| 냉각수 온도센서 | 없음 | `images/sensors/coolant_temp_sensor__REF.png`, `__CUT.png` 있음 | `02-sensors.md`에 있음 | 재생성하지 않음. 필요하면 `adas` 폴더에 복사 |
| 전륜 e-axle 내부 park pawl | 없음 | 확인되지 않음 | 전용 프롬프트 없음 | 아래 프롬프트로 생성 |

조향각 센서와 냉각수 온도센서는 프로젝트 전체 기준으로는 이미지가 이미 존재합니다. 다만 사용자가 생성한 에셋을 `adas` 폴더에 모으는 작업 규칙을 그대로 적용하려면 기존 파일을 재생성하지 말고 다음 파일을 복사할 수 있습니다.

```text
public/assets/intake/images/sensors/steering_angle_sensor__REF.png
public/assets/intake/images/sensors/steering_angle_sensor__CUT.png
public/assets/intake/images/sensors/coolant_temp_sensor__REF.png
public/assets/intake/images/sensors/coolant_temp_sensor__CUT.png
```

## 생성 대상

### 1. Park pawl 단품 참조 이미지 — 필수

저장 파일명: `park_pawl__REF.png`

```text
Create a high-quality realistic 3D product reference image of a generic electric vehicle front e-axle park pawl. Show one forged steel parking pawl as a complete isolated mechanical component, with a clearly visible pivot hole, pivot boss, locking tooth, and reinforced body. The part must look like a real automotive drivetrain component with machined and forged metal surfaces, subtle manufacturing chamfers, believable thickness, and no exaggerated fantasy geometry. Use a clean neutral light-gray studio background, soft directional lighting, a three-quarter view, and a square 1:1 composition. Keep the entire part inside the frame with generous margins. No vehicle, no complete e-axle assembly, no text, no labels, no arrows, no dimensions, no logo, no watermark, no UI, no collage.
```

생성 의도:

- 실제 양산차의 특정 제조사 형상을 복제하지 않는 교육용 일반 형상
- `parking gear`와 맞물리는 톱니와 회전 중심을 식별할 수 있는 형태
- 단품 카드와 부품 선택 화면에서 사용할 수 있는 정면·사선 참조 이미지

### 2. 전륜 e-axle 내부 파킹 잠금 구조 — 필수

저장 파일명: `park_pawl__EXPL.png`

```text
Create a high-quality realistic 3D cutaway and lightly exploded educational view of a generic front electric vehicle e-axle integrated park-lock mechanism. Show a compact section of the e-axle housing containing the differential-side parking gear on the rotating output shaft, a forged steel park pawl positioned to engage the parking gear tooth profile, the pawl pivot pin, a return spring, and a simple electromechanical park-lock actuator contact or push rod. Include enough housing, bearing, and shaft context to explain the mechanical connection, but do not show a whole car or a complete drivetrain. Separate only the necessary internal parts by small clear spatial gaps so each component remains identifiable; keep the assembly mechanically plausible and aligned. Use realistic automotive metal materials, neutral studio lighting, a clean light-gray background, and a square 1:1 composition. No text, labels, arrows, dimensions, logo, watermark, UI, schematic symbols, or collage.
```

생성 의도:

- `Park ECU`가 아니라 실제 회전체를 잠그는 기계 부품을 보여줌
- `parking gear → park pawl → pivot/return spring → actuator contact` 관계를 한 화면에서 확인
- 전륜 e-axle 내부 구조라는 맥락은 보이되, 차량 전체나 임의의 후륜 배치로 오해되지 않게 함

### 3. 투명 배경 단품 컷아웃 — 선택

저장 파일명: `park_pawl__CUT.png`

```text
Create a realistic isolated 3D cutout render of one generic forged steel electric vehicle park pawl for an automotive educational UI. Show the full park pawl at a three-quarter angle with the pivot hole, pivot boss, locking tooth, reinforced body, and subtle machined chamfers clearly visible. Use physically plausible dark forged-steel and machined-metal materials. The background must be fully transparent with a clean alpha channel; do not include a floor, shadow, reflection, housing, parking gear, actuator, text, labels, arrows, dimensions, logo, watermark, UI, or other parts. Keep the entire component inside the square 1:1 canvas with generous transparent margins.
```

이 파일은 가설 카드·단품 강조·부품 목록에서 투명 배경이 필요할 때만 사용합니다. 먼저 `REF`와 `EXPL`을 생성하고, 생성 도구가 투명 배경을 안정적으로 지원할 때 `CUT`을 추가하는 순서가 좋습니다.

## 생성 시 주의사항

- `park_pawl`은 차량별로 형상과 작동 방식이 달라질 수 있으므로, 위 프롬프트는 특정 양산차의 정확한 치수나 특허 형상을 요구하지 않습니다.
- `park_pawl`은 `park_lock_actuator`, `park_position_sensor`, `parking gear`, `front_eaxle_assembly`와 별개의 부품이지만, `EXPL` 이미지에서는 이들의 기계적 관계가 식별되어야 합니다.
- 단품 이미지에 전체 e-axle를 다시 그리거나, 후륜 브레이크·후륜 주차 케이블로 표현하지 않습니다.
- 생성 이미지가 단순한 알록달록한 기본 도형, 아이콘, 회로도, 텍스트가 되면 사용하지 않습니다.
- 실제 코드에 연결하기 전에는 이미지의 형상만으로 차량 사양을 확정하지 말고, 전륜 e-axle의 park-lock 구조와 anchor를 별도 검증해야 합니다.

## 생성 후 전달할 파일

필수:

```text
public/assets/intake/images/adas/park_pawl__REF.png
public/assets/intake/images/adas/park_pawl__EXPL.png
```

선택:

```text
public/assets/intake/images/adas/park_pawl__CUT.png
```

생성 후 위 파일을 같은 `adas` 폴더에 넣고 알려주면, 다음 단계에서 파일 해상도·투명도·실제 에셋 매핑·더블클릭 단품 화면 연결 여부를 확인합니다. 이번 문서 작성에서는 코드, 기존 에셋, 렌더링 배치를 변경하지 않습니다.
