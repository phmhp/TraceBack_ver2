# 제동계 — 이미지 생성 프롬프트

> 자동 생성 파일입니다. 수정은 `scripts/image-prompt-data.mjs`에서 하고 `npm run prompts`를 실행하세요.
> 사용 규칙은 [../PART_IMAGE_PROMPTS.md](../PART_IMAGE_PROMPTS.md)를 보세요. **코드 블록 하나 = 요청 1번 = 이미지 1장**입니다.

<a id="brake_booster"></a>
## brake_booster — 전자식 브레이크 부스터

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `brake_booster__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `brake_booster__CUT.png` | `brake_booster__REF.png` |

### 1. REF — `brake_booster__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electromechanical brake booster unit with a cylindrical body, integrated electric motor housing on the side, brake fluid reservoir on top and a pedal pushrod at the back.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_booster__REF.png
```

### 2. CUT — `brake_booster__CUT.png`

먼저 `brake_booster__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_booster__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electromechanical brake booster unit with a cylindrical body, integrated electric motor housing on the side, brake fluid reservoir on top and a pedal pushrod at the back.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_booster__CUT.png
```

<a id="master_cylinder"></a>
## master_cylinder — 마스터 실린더

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `master_cylinder__REF.png` | 없음 |
| 2 | EXPL (분해도) | `master_cylinder__EXPL.png` | `master_cylinder__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `master_cylinder__CUT.png` | `master_cylinder__REF.png` |

### 1. REF — `master_cylinder__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Tandem brake master cylinder with a translucent fluid reservoir and cap, two brake line ports and a mounting flange.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): master_cylinder__REF.png
```

### 2. EXPL — `master_cylinder__EXPL.png`

먼저 `master_cylinder__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached master_cylinder__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Tandem brake master cylinder with a translucent fluid reservoir and cap, two brake line ports and a mounting flange.
Style: clean exploded-view illustration on a landscape 3:2 canvas, the components separated along one axis with even spacing, realistic materials.
Background: neutral light grey, soft studio lighting.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): master_cylinder__EXPL.png
```

### 3. CUT — `master_cylinder__CUT.png`

먼저 `master_cylinder__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached master_cylinder__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Tandem brake master cylinder with a translucent fluid reservoir and cap, two brake line ports and a mounting flange.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): master_cylinder__CUT.png
```

<a id="hydraulic_modulator"></a>
## hydraulic_modulator — 유압 모듈레이터

3D 방식: AI — REF 이미지를 TRELLIS로 3D 변환 시도

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `hydraulic_modulator__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `hydraulic_modulator__CUT.png` | `hydraulic_modulator__REF.png` |
| 3 | EVID-ok (메모판 사진 · 정상) | `hydraulic_modulator__EVID-ok.png` | `hydraulic_modulator__REF.png` |
| 4 | EVID-fault (메모판 사진 · 고장) | `hydraulic_modulator__EVID-fault.png` | `hydraulic_modulator__EVID-ok.png` |

### 1. REF — `hydraulic_modulator__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Brake hydraulic modulator: machined aluminum valve block with brake line ports, attached black electronic control module with connector and a small pump motor cylinder.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): hydraulic_modulator__REF.png
```

### 2. CUT — `hydraulic_modulator__CUT.png`

먼저 `hydraulic_modulator__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached hydraulic_modulator__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Brake hydraulic modulator: machined aluminum valve block with brake line ports, attached black electronic control module with connector and a small pump motor cylinder.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): hydraulic_modulator__CUT.png
```

### 3. EVID-ok — `hydraulic_modulator__EVID-ok.png`

먼저 `hydraulic_modulator__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached hydraulic_modulator__REF.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A brake hydraulic modulator mounted in a vehicle with brake lines attached.
Condition: normal and healthy — valve block dry and clean, lines tight. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): hydraulic_modulator__EVID-ok.png
```

### 4. EVID-fault — `hydraulic_modulator__EVID-fault.png`

먼저 `hydraulic_modulator__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached hydraulic_modulator__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A brake hydraulic modulator mounted in a vehicle with brake lines attached.
Condition: faulty — brake fluid wet patch and drip under one line port. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): hydraulic_modulator__EVID-fault.png
```

<a id="brake_caliper"></a>
## brake_caliper — 브레이크 캘리퍼

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `brake_caliper__REF.png` | 없음 |
| 2 | EXPL (분해도) | `brake_caliper__EXPL.png` | `brake_caliper__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `brake_caliper__CUT.png` | `brake_caliper__REF.png` |
| 4 | EVID-ok (메모판 사진 · 정상) | `brake_caliper__EVID-ok.png` | `brake_caliper__REF.png` |
| 5 | EVID-fault (메모판 사진 · 고장) | `brake_caliper__EVID-fault.png` | `brake_caliper__EVID-ok.png` |

### 1. REF — `brake_caliper__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Floating single-piston brake caliper in dark grey cast iron with slide pins and a bleed nipple visible, mounted over a brake disc.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_caliper__REF.png
```

### 2. EXPL — `brake_caliper__EXPL.png`

먼저 `brake_caliper__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_caliper__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Floating single-piston brake caliper in dark grey cast iron with slide pins and a bleed nipple visible, mounted over a brake disc.
Style: clean exploded-view illustration on a landscape 3:2 canvas, the components separated along one axis with even spacing, realistic materials.
Background: neutral light grey, soft studio lighting.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_caliper__EXPL.png
```

### 3. CUT — `brake_caliper__CUT.png`

먼저 `brake_caliper__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_caliper__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Floating single-piston brake caliper in dark grey cast iron with slide pins and a bleed nipple visible, mounted over a brake disc.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_caliper__CUT.png
```

### 4. EVID-ok — `brake_caliper__EVID-ok.png`

먼저 `brake_caliper__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_caliper__REF.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A brake caliper and disc on a wheel hub with the wheel removed.
Condition: normal and healthy — caliper clean, disc surface evenly polished. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_caliper__EVID-ok.png
```

### 5. EVID-fault — `brake_caliper__EVID-fault.png`

먼저 `brake_caliper__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached brake_caliper__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A brake caliper and disc on a wheel hub with the wheel removed.
Condition: faulty — piston dust boot torn, rust on the slide pin and an uneven glazed band on the disc. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_caliper__EVID-fault.png
```

<a id="brake_disc"></a>
## brake_disc — 브레이크 디스크

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `brake_disc__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `brake_disc__CUT.png` | `brake_disc__REF.png` |

### 1. REF — `brake_disc__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Ventilated brake disc with internal cooling vanes visible at the edge and a central hat section with five bolt holes.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_disc__REF.png
```

### 2. CUT — `brake_disc__CUT.png`

먼저 `brake_disc__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_disc__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Ventilated brake disc with internal cooling vanes visible at the edge and a central hat section with five bolt holes.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_disc__CUT.png
```

<a id="brake_pad"></a>
## brake_pad — 브레이크 패드

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `brake_pad__CUT.png` | 없음 |
| 2 | EVID-ok (메모판 사진 · 정상) | `brake_pad__EVID-ok.png` | `brake_pad__CUT.png` |
| 3 | EVID-fault (메모판 사진 · 고장) | `brake_pad__EVID-fault.png` | `brake_pad__EVID-ok.png` |

### 1. CUT — `brake_pad__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A pair of brake pads with steel backing plates and friction material blocks with a center groove.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pad__CUT.png
```

### 2. EVID-ok — `brake_pad__EVID-ok.png`

먼저 `brake_pad__CUT.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_pad__CUT.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A pair of brake pads lying on a workbench next to a caliper.
Condition: normal and healthy — thick friction material with the center groove clearly visible. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pad__EVID-ok.png
```

### 3. EVID-fault — `brake_pad__EVID-fault.png`

먼저 `brake_pad__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached brake_pad__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A pair of brake pads lying on a workbench next to a caliper.
Condition: faulty — friction material worn almost down to the steel backing plate, groove gone. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pad__EVID-fault.png
```

<a id="brake_line"></a>
## brake_line — 브레이크 배관·호스

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `brake_line__CUT.png` | 없음 |
| 2 | EVID-ok (메모판 사진 · 정상) | `brake_line__EVID-ok.png` | `brake_line__CUT.png` |
| 3 | EVID-fault (메모판 사진 · 고장) | `brake_line__EVID-fault.png` | `brake_line__EVID-ok.png` |

### 1. CUT — `brake_line__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Rigid steel brake line with flare nuts connected to a black reinforced flexible brake hose with a banjo fitting.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_line__CUT.png
```

### 2. EVID-ok — `brake_line__EVID-ok.png`

먼저 `brake_line__CUT.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_line__CUT.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A flexible brake hose connected to a caliper behind the wheel hub.
Condition: normal and healthy — hose smooth and dry. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_line__EVID-ok.png
```

### 3. EVID-fault — `brake_line__EVID-fault.png`

먼저 `brake_line__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached brake_line__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A flexible brake hose connected to a caliper behind the wheel hub.
Condition: faulty — hose bulging with surface cracks and a fluid-wet fitting. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_line__EVID-fault.png
```
