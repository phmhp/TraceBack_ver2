# 운전자 입력장치 (HMI) — 이미지 생성 프롬프트

> 자동 생성 파일입니다. 수정은 `scripts/image-prompt-data.mjs`에서 하고 `npm run prompts`를 실행하세요.
> 사용 규칙은 [../PART_IMAGE_PROMPTS.md](../PART_IMAGE_PROMPTS.md)를 보세요. **코드 블록 하나 = 요청 1번 = 이미지 1장**입니다.

<a id="accel_pedal"></a>
## accel_pedal — 가속 페달

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `accel_pedal__REF.png` | 없음 |
| 2 | TURN (4면도 시트) | `accel_pedal__TURN.png` | `accel_pedal__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `accel_pedal__CUT.png` | `accel_pedal__REF.png` |
| 4 | EVID-ok (메모판 사진 · 정상) | `accel_pedal__EVID-ok.png` | `accel_pedal__REF.png` |
| 5 | EVID-fault (메모판 사진 · 고장) | `accel_pedal__EVID-fault.png` | `accel_pedal__EVID-ok.png` |

### 1. REF — `accel_pedal__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Floor-hinged accelerator pedal assembly with a black textured rubber pedal pad, plastic arm, compact dual-track position sensor housing at the pivot and a short wire harness with connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): accel_pedal__REF.png
```

### 2. TURN — `accel_pedal__TURN.png`

먼저 `accel_pedal__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image: one turnaround sheet of one object. No extra images, no alternatives, no other styles, no photos, no exploded views.
Design reference: the attached accel_pedal__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Floor-hinged accelerator pedal assembly with a black textured rubber pedal pad, plastic arm, compact dual-track position sensor housing at the pivot and a short wire harness with connector.
Style: technical turnaround reference sheet on a landscape 3:2 canvas.
Layout: a clean 2x2 grid of the SAME object only: front view, side view, top view and one three-quarter view. Orthographic projection for the three flat views, identical scale and alignment.
Background: neutral light grey, flat even lighting, realistic materials.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): accel_pedal__TURN.png
```

### 3. CUT — `accel_pedal__CUT.png`

먼저 `accel_pedal__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached accel_pedal__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Floor-hinged accelerator pedal assembly with a black textured rubber pedal pad, plastic arm, compact dual-track position sensor housing at the pivot and a short wire harness with connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): accel_pedal__CUT.png
```

### 4. EVID-ok — `accel_pedal__EVID-ok.png`

먼저 `accel_pedal__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached accel_pedal__REF.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The accelerator pedal mounted in a car footwell, seen from the driver's side, sensor housing and connector visible at the pivot.
Condition: normal and healthy — clean pedal pad, connector firmly latched, harness neatly clipped. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): accel_pedal__EVID-ok.png
```

### 5. EVID-fault — `accel_pedal__EVID-fault.png`

먼저 `accel_pedal__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached accel_pedal__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The accelerator pedal mounted in a car footwell, seen from the driver's side, sensor housing and connector visible at the pivot.
Condition: faulty — connector half pulled out of the sensor housing with a slightly bent locking tab, harness hanging loose. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): accel_pedal__EVID-fault.png
```

<a id="brake_pedal"></a>
## brake_pedal — 브레이크 페달

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `brake_pedal__REF.png` | 없음 |
| 2 | TURN (4면도 시트) | `brake_pedal__TURN.png` | `brake_pedal__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `brake_pedal__CUT.png` | `brake_pedal__REF.png` |
| 4 | EVID-ok (메모판 사진 · 정상) | `brake_pedal__EVID-ok.png` | `brake_pedal__REF.png` |
| 5 | EVID-fault (메모판 사진 · 고장) | `brake_pedal__EVID-fault.png` | `brake_pedal__EVID-ok.png` |

### 1. REF — `brake_pedal__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Suspended brake pedal assembly with a steel arm, wide rubber pedal pad with horizontal ribs, pivot bracket, return spring and a small pedal stroke sensor clipped to the bracket.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pedal__REF.png
```

### 2. TURN — `brake_pedal__TURN.png`

먼저 `brake_pedal__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image: one turnaround sheet of one object. No extra images, no alternatives, no other styles, no photos, no exploded views.
Design reference: the attached brake_pedal__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Suspended brake pedal assembly with a steel arm, wide rubber pedal pad with horizontal ribs, pivot bracket, return spring and a small pedal stroke sensor clipped to the bracket.
Style: technical turnaround reference sheet on a landscape 3:2 canvas.
Layout: a clean 2x2 grid of the SAME object only: front view, side view, top view and one three-quarter view. Orthographic projection for the three flat views, identical scale and alignment.
Background: neutral light grey, flat even lighting, realistic materials.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pedal__TURN.png
```

### 3. CUT — `brake_pedal__CUT.png`

먼저 `brake_pedal__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_pedal__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Suspended brake pedal assembly with a steel arm, wide rubber pedal pad with horizontal ribs, pivot bracket, return spring and a small pedal stroke sensor clipped to the bracket.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pedal__CUT.png
```

### 4. EVID-ok — `brake_pedal__EVID-ok.png`

먼저 `brake_pedal__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_pedal__REF.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The brake pedal assembly in a car footwell, pivot bracket and stroke sensor visible.
Condition: normal and healthy — pedal at rest height, return spring in place, sensor clipped firmly. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pedal__EVID-ok.png
```

### 5. EVID-fault — `brake_pedal__EVID-fault.png`

먼저 `brake_pedal__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached brake_pedal__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The brake pedal assembly in a car footwell, pivot bracket and stroke sensor visible.
Condition: faulty — pedal sitting noticeably lower than normal, return spring unhooked, sensor clip cracked. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pedal__EVID-fault.png
```

<a id="steering_wheel"></a>
## steering_wheel — 스티어링 휠

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `steering_wheel__REF.png` | 없음 |
| 2 | TURN (4면도 시트) | `steering_wheel__TURN.png` | `steering_wheel__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `steering_wheel__CUT.png` | `steering_wheel__REF.png` |

### 1. REF — `steering_wheel__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Three-spoke passenger car steering wheel with dark leather rim, brushed metal spoke trim and a central airbag cover without any emblem.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_wheel__REF.png
```

### 2. TURN — `steering_wheel__TURN.png`

먼저 `steering_wheel__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image: one turnaround sheet of one object. No extra images, no alternatives, no other styles, no photos, no exploded views.
Design reference: the attached steering_wheel__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Three-spoke passenger car steering wheel with dark leather rim, brushed metal spoke trim and a central airbag cover without any emblem.
Style: technical turnaround reference sheet on a landscape 3:2 canvas.
Layout: a clean 2x2 grid of the SAME object only: front view, side view, top view and one three-quarter view. Orthographic projection for the three flat views, identical scale and alignment.
Background: neutral light grey, flat even lighting, realistic materials.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_wheel__TURN.png
```

### 3. CUT — `steering_wheel__CUT.png`

먼저 `steering_wheel__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached steering_wheel__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Three-spoke passenger car steering wheel with dark leather rim, brushed metal spoke trim and a central airbag cover without any emblem.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_wheel__CUT.png
```

<a id="gear_selector"></a>
## gear_selector — 기어 셀렉터

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `gear_selector__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `gear_selector__CUT.png` | `gear_selector__REF.png` |

### 1. REF — `gear_selector__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric vehicle rotary gear selector dial with a knurled aluminum ring and four small glowing indicator dots without letters, set in a dark center console panel.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): gear_selector__REF.png
```

### 2. CUT — `gear_selector__CUT.png`

먼저 `gear_selector__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached gear_selector__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric vehicle rotary gear selector dial with a knurled aluminum ring and four small glowing indicator dots without letters, set in a dark center console panel.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): gear_selector__CUT.png
```

<a id="start_button"></a>
## start_button — 시동 버튼

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `start_button__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `start_button__CUT.png` | `start_button__REF.png` |
| 3 | EVID-ok (메모판 사진 · 정상) | `start_button__EVID-ok.png` | `start_button__REF.png` |
| 4 | EVID-fault (메모판 사진 · 고장) | `start_button__EVID-fault.png` | `start_button__EVID-ok.png` |

### 1. REF — `start_button__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Round push-button start stop switch with a chrome bezel, matte black button face, a thin light ring and a simple power symbol icon only, mounted in a dashboard trim piece.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): start_button__REF.png
```

### 2. CUT — `start_button__CUT.png`

먼저 `start_button__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached start_button__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Round push-button start stop switch with a chrome bezel, matte black button face, a thin light ring and a simple power symbol icon only, mounted in a dashboard trim piece.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): start_button__CUT.png
```

### 3. EVID-ok — `start_button__EVID-ok.png`

먼저 `start_button__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached start_button__REF.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The start stop button on a dashboard seen close up from the driver's seat.
Condition: normal and healthy — light ring glowing evenly, button face clean. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): start_button__EVID-ok.png
```

### 4. EVID-fault — `start_button__EVID-fault.png`

먼저 `start_button__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached start_button__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The start stop button on a dashboard seen close up from the driver's seat.
Condition: faulty — light ring dark, button face slightly sunken and scuffed. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): start_button__EVID-fault.png
```

<a id="instrument_cluster"></a>
## instrument_cluster — 계기판

3D 방식: 2D — 이미지만 게임에 사용

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `instrument_cluster__CUT.png` | 없음 |
| 2 | EVID-ok (메모판 사진 · 정상) | `instrument_cluster__EVID-ok.png` | `instrument_cluster__CUT.png` |
| 3 | EVID-fault (메모판 사진 · 고장) | `instrument_cluster__EVID-fault.png` | `instrument_cluster__EVID-ok.png` |

### 1. CUT — `instrument_cluster__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Digital instrument cluster with a curved anti-glare glass panel, two circular gauge areas showing only abstract arcs and needles, slim dark housing.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): instrument_cluster__CUT.png
```

### 2. EVID-ok — `instrument_cluster__EVID-ok.png`

먼저 `instrument_cluster__CUT.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached instrument_cluster__CUT.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The digital instrument cluster behind the steering wheel, seen from the driver's seat.
Condition: normal and healthy — gauge arcs glowing softly in cool colors. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): instrument_cluster__EVID-ok.png
```

### 3. EVID-fault — `instrument_cluster__EVID-fault.png`

먼저 `instrument_cluster__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached instrument_cluster__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The digital instrument cluster behind the steering wheel, seen from the driver's seat.
Condition: faulty — one gauge area flickering dim with a single amber warning lamp shape lit, no symbols readable. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): instrument_cluster__EVID-fault.png
```

<a id="steering_column"></a>
## steering_column — 스티어링 칼럼

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `steering_column__REF.png` | 없음 |
| 2 | TURN (4면도 시트) | `steering_column__TURN.png` | `steering_column__REF.png` |

### 1. REF — `steering_column__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Steering column assembly with a tilt and telescopic adjustment bracket, upper shaft, universal joint at the lower end and a clock spring housing behind the wheel hub.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_column__REF.png
```

### 2. TURN — `steering_column__TURN.png`

먼저 `steering_column__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image: one turnaround sheet of one object. No extra images, no alternatives, no other styles, no photos, no exploded views.
Design reference: the attached steering_column__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Steering column assembly with a tilt and telescopic adjustment bracket, upper shaft, universal joint at the lower end and a clock spring housing behind the wheel hub.
Style: technical turnaround reference sheet on a landscape 3:2 canvas.
Layout: a clean 2x2 grid of the SAME object only: front view, side view, top view and one three-quarter view. Orthographic projection for the three flat views, identical scale and alignment.
Background: neutral light grey, flat even lighting, realistic materials.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_column__TURN.png
```

<a id="epb_switch"></a>
## epb_switch — 전자식 주차 브레이크 스위치

3D 방식: 2D — 이미지만 게임에 사용

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `epb_switch__CUT.png` | 없음 |

### 1. CUT — `epb_switch__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Small electronic parking brake pull-up switch with a simple parking icon only, black plastic housing in a console panel.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): epb_switch__CUT.png
```
