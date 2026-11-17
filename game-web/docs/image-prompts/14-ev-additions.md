# EV 도메인 확장 부품 (2026-11-14) — 이미지 생성 프롬프트

> 자동 생성 파일입니다. 수정은 `scripts/image-prompt-data.mjs`에서 하고 `npm run prompts`를 실행하세요.
> 사용 규칙은 [../PART_IMAGE_PROMPTS.md](../PART_IMAGE_PROMPTS.md)를 보세요. **코드 블록 하나 = 요청 1번 = 이미지 1장**입니다.

<a id="evcc"></a>
## evcc — 충전 제어기(EVCC·충전 통신)

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

저장 폴더: `public/assets/intake/images/charging/` (파일명은 아래 표 그대로)

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `evcc__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `evcc__CUT.png` | `evcc__REF.png` |

### 1. REF — `evcc__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Compact electric vehicle charging communication controller in a dark plastic housing with a metal base plate, one blue multi-pin signal connector on a short side, a second small black connector and two mounting tabs.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): evcc__REF.png
```

### 2. CUT — `evcc__CUT.png`

먼저 `evcc__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached evcc__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Compact electric vehicle charging communication controller in a dark plastic housing with a metal base plate, one blue multi-pin signal connector on a short side, a second small black connector and two mounting tabs.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): evcc__CUT.png
```

<a id="charge_lock_actuator"></a>
## charge_lock_actuator — 충전구 잠금 액추에이터

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

저장 폴더: `public/assets/intake/images/charging/` (파일명은 아래 표 그대로)

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `charge_lock_actuator__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `charge_lock_actuator__CUT.png` | `charge_lock_actuator__REF.png` |

### 1. REF — `charge_lock_actuator__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Charge inlet lock actuator with a small cylindrical electric motor housing, a retractable polished steel locking pin extending from the front, a mounting flange with two bolt holes and a two-wire connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): charge_lock_actuator__REF.png
```

### 2. CUT — `charge_lock_actuator__CUT.png`

먼저 `charge_lock_actuator__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached charge_lock_actuator__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Charge inlet lock actuator with a small cylindrical electric motor housing, a retractable polished steel locking pin extending from the front, a mounting flange with two bolt holes and a two-wire connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): charge_lock_actuator__CUT.png
```

<a id="ac_compressor"></a>
## ac_compressor — 전동 에어컨 컴프레서

3D 방식: AI — REF 이미지를 TRELLIS로 3D 변환 시도

저장 폴더: `public/assets/intake/images/thermal/` (파일명은 아래 표 그대로)

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `ac_compressor__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `ac_compressor__CUT.png` | `ac_compressor__REF.png` |

### 1. REF — `ac_compressor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric scroll air-conditioning compressor with an integrated inverter housing, an orange high-voltage connector and refrigerant ports.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): ac_compressor__REF.png
```

### 2. CUT — `ac_compressor__CUT.png`

먼저 `ac_compressor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached ac_compressor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric scroll air-conditioning compressor with an integrated inverter housing, an orange high-voltage connector and refrigerant ports.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): ac_compressor__CUT.png
```

<a id="ptc_heater"></a>
## ptc_heater — PTC 히터

3D 방식: AI — REF 이미지를 TRELLIS로 3D 변환 시도

저장 폴더: `public/assets/intake/images/thermal/` (파일명은 아래 표 그대로)

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `ptc_heater__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `ptc_heater__CUT.png` | `ptc_heater__REF.png` |

### 1. REF — `ptc_heater__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. High-voltage PTC heater core with ceramic heating elements and aluminum fins in a plastic frame, an orange high-voltage connector at one end.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): ptc_heater__REF.png
```

### 2. CUT — `ptc_heater__CUT.png`

먼저 `ptc_heater__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached ptc_heater__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. High-voltage PTC heater core with ceramic heating elements and aluminum fins in a plastic frame, an orange high-voltage connector at one end.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): ptc_heater__CUT.png
```

<a id="eev"></a>
## eev — 전자식 팽창 밸브(히트펌프)

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

저장 폴더: `public/assets/intake/images/thermal/` (파일명은 아래 표 그대로)

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `eev__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `eev__CUT.png` | `eev__REF.png` |

### 1. REF — `eev__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electronic expansion valve for a heat pump with a small brass valve body, two refrigerant pipe ports, a cylindrical stepper motor coil on top and a four-pin connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): eev__REF.png
```

### 2. CUT — `eev__CUT.png`

먼저 `eev__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached eev__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electronic expansion valve for a heat pump with a small brass valve body, two refrigerant pipe ports, a cylindrical stepper motor coil on top and a four-pin connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): eev__CUT.png
```

<a id="adas_camera"></a>
## adas_camera — 전방 카메라

3D 방식: 2D — 이미지만 게임에 사용

저장 폴더: `public/assets/intake/images/adas/` (파일명은 아래 표 그대로)

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `adas_camera__CUT.png` | 없음 |

### 1. CUT — `adas_camera__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Forward-facing driver-assistance camera module with a lens, a compact dark housing and a windshield mounting bracket.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): adas_camera__CUT.png
```

<a id="adas_radar"></a>
## adas_radar — 전방 레이더

3D 방식: 2D — 이미지만 게임에 사용

저장 폴더: `public/assets/intake/images/adas/` (파일명은 아래 표 그대로)

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `adas_radar__CUT.png` | 없음 |

### 1. CUT — `adas_radar__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Front radar sensor module with a flat radome face, a dark plastic housing and a mounting bracket.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): adas_radar__CUT.png
```

<a id="adas_ecu"></a>
## adas_ecu — ADAS 도메인 제어기

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

저장 폴더: `public/assets/intake/images/adas/` (파일명은 아래 표 그대로)

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `adas_ecu__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `adas_ecu__CUT.png` | `adas_ecu__REF.png` |

### 1. REF — `adas_ecu__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Driver-assistance domain controller with a flat die-cast aluminum housing, cooling fins on top and two large multi-pin connectors on one side.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): adas_ecu__REF.png
```

### 2. CUT — `adas_ecu__CUT.png`

먼저 `adas_ecu__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached adas_ecu__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Driver-assistance domain controller with a flat die-cast aluminum housing, cooling fins on top and two large multi-pin connectors on one side.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): adas_ecu__CUT.png
```

<a id="tcu"></a>
## tcu — 텔레매틱스 제어기(OTA·원격 진단)

3D 방식: 2D — 이미지만 게임에 사용

저장 폴더: `public/assets/intake/images/network-diagnostics/` (파일명은 아래 표 그대로)

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `tcu__CUT.png` | 없음 |

### 1. CUT — `tcu__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Telematics control unit with a flat black plastic housing, a short antenna cable stub and a multi-pin connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): tcu__CUT.png
```
