# 센서 — 이미지 생성 프롬프트

> 자동 생성 파일입니다. 수정은 `scripts/image-prompt-data.mjs`에서 하고 `npm run prompts`를 실행하세요.
> 사용 규칙은 [../PART_IMAGE_PROMPTS.md](../PART_IMAGE_PROMPTS.md)를 보세요. **코드 블록 하나 = 요청 1번 = 이미지 1장**입니다.

<a id="wheel_speed_sensor"></a>
## wheel_speed_sensor — 휠 속도 센서

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `wheel_speed_sensor__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `wheel_speed_sensor__CUT.png` | `wheel_speed_sensor__REF.png` |
| 3 | EVID-ok (메모판 사진 · 정상) | `wheel_speed_sensor__EVID-ok.png` | `wheel_speed_sensor__REF.png` |
| 4 | EVID-fault (메모판 사진 · 고장) | `wheel_speed_sensor__EVID-fault.png` | `wheel_speed_sensor__EVID-ok.png` |

### 1. REF — `wheel_speed_sensor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Active wheel speed sensor with a cylindrical sensing tip, single mounting ear with bolt hole, molded plastic body and a short cable with clip, next to a toothed tone ring.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): wheel_speed_sensor__REF.png
```

### 2. CUT — `wheel_speed_sensor__CUT.png`

먼저 `wheel_speed_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached wheel_speed_sensor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Active wheel speed sensor with a cylindrical sensing tip, single mounting ear with bolt hole, molded plastic body and a short cable with clip, next to a toothed tone ring.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): wheel_speed_sensor__CUT.png
```

### 3. EVID-ok — `wheel_speed_sensor__EVID-ok.png`

먼저 `wheel_speed_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached wheel_speed_sensor__REF.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The wheel speed sensor mounted on a wheel knuckle close to the toothed tone ring.
Condition: normal and healthy — sensor tip clean with a small even gap to the tone ring. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): wheel_speed_sensor__EVID-ok.png
```

### 4. EVID-fault — `wheel_speed_sensor__EVID-fault.png`

먼저 `wheel_speed_sensor__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached wheel_speed_sensor__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The wheel speed sensor mounted on a wheel knuckle close to the toothed tone ring.
Condition: faulty — sensor tip caked with brake dust and metal shavings, cable insulation chafed. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): wheel_speed_sensor__EVID-fault.png
```

<a id="rotor_position_sensor"></a>
## rotor_position_sensor — 모터 위치 센서(리졸버)

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `rotor_position_sensor__REF.png` | 없음 |
| 2 | EXPL (분해도) | `rotor_position_sensor__EXPL.png` | `rotor_position_sensor__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `rotor_position_sensor__CUT.png` | `rotor_position_sensor__REF.png` |

### 1. REF — `rotor_position_sensor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric motor resolver made of a thin laminated stator ring with copper windings and a lobed steel rotor ring, with a small connector lead.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): rotor_position_sensor__REF.png
```

### 2. EXPL — `rotor_position_sensor__EXPL.png`

먼저 `rotor_position_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached rotor_position_sensor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric motor resolver made of a thin laminated stator ring with copper windings and a lobed steel rotor ring, with a small connector lead.
Style: clean exploded-view illustration on a landscape 3:2 canvas, the components separated along one axis with even spacing, realistic materials.
Background: neutral light grey, soft studio lighting.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): rotor_position_sensor__EXPL.png
```

### 3. CUT — `rotor_position_sensor__CUT.png`

먼저 `rotor_position_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached rotor_position_sensor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric motor resolver made of a thin laminated stator ring with copper windings and a lobed steel rotor ring, with a small connector lead.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): rotor_position_sensor__CUT.png
```

<a id="motor_temp_sensor"></a>
## motor_temp_sensor — 모터 온도 센서(NTC)

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `motor_temp_sensor__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `motor_temp_sensor__CUT.png` | `motor_temp_sensor__REF.png` |
| 3 | EVID-ok (메모판 사진 · 정상) | `motor_temp_sensor__EVID-ok.png` | `motor_temp_sensor__REF.png` |
| 4 | EVID-fault (메모판 사진 · 고장) | `motor_temp_sensor__EVID-fault.png` | `motor_temp_sensor__EVID-ok.png` |

### 1. REF — `motor_temp_sensor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Small thermistor temperature sensor with a thin probe tip, heat-shrink sleeve and a fine two-wire lead ending in a mini connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): motor_temp_sensor__REF.png
```

### 2. CUT — `motor_temp_sensor__CUT.png`

먼저 `motor_temp_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached motor_temp_sensor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Small thermistor temperature sensor with a thin probe tip, heat-shrink sleeve and a fine two-wire lead ending in a mini connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): motor_temp_sensor__CUT.png
```

### 3. EVID-ok — `motor_temp_sensor__EVID-ok.png`

먼저 `motor_temp_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached motor_temp_sensor__REF.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A thermistor probe inserted into the end winding area of an electric motor on a workbench.
Condition: normal and healthy — probe seated firmly, sleeve intact. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): motor_temp_sensor__EVID-ok.png
```

### 4. EVID-fault — `motor_temp_sensor__EVID-fault.png`

먼저 `motor_temp_sensor__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached motor_temp_sensor__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A thermistor probe inserted into the end winding area of an electric motor on a workbench.
Condition: faulty — probe pulled halfway out, heat-shrink sleeve discolored and cracked. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): motor_temp_sensor__EVID-fault.png
```

<a id="coolant_temp_sensor"></a>
## coolant_temp_sensor — 냉각수 온도 센서

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `coolant_temp_sensor__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `coolant_temp_sensor__CUT.png` | `coolant_temp_sensor__REF.png` |

### 1. REF — `coolant_temp_sensor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Coolant temperature sensor with a brass threaded body, hex nut, metal probe tip and a black two-pin connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): coolant_temp_sensor__REF.png
```

### 2. CUT — `coolant_temp_sensor__CUT.png`

먼저 `coolant_temp_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached coolant_temp_sensor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Coolant temperature sensor with a brass threaded body, hex nut, metal probe tip and a black two-pin connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): coolant_temp_sensor__CUT.png
```

<a id="steering_angle_sensor"></a>
## steering_angle_sensor — 조향각 센서

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `steering_angle_sensor__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `steering_angle_sensor__CUT.png` | `steering_angle_sensor__REF.png` |

### 1. REF — `steering_angle_sensor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Ring-shaped steering angle sensor module with a central opening for the column shaft, black plastic housing and a multi-pin connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_angle_sensor__REF.png
```

### 2. CUT — `steering_angle_sensor__CUT.png`

먼저 `steering_angle_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached steering_angle_sensor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Ring-shaped steering angle sensor module with a central opening for the column shaft, black plastic housing and a multi-pin connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_angle_sensor__CUT.png
```

<a id="steering_torque_sensor"></a>
## steering_torque_sensor — 조향 토크 센서

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `steering_torque_sensor__REF.png` | 없음 |
| 2 | EXPL (분해도) | `steering_torque_sensor__EXPL.png` | `steering_torque_sensor__REF.png` |

### 1. REF — `steering_torque_sensor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Steering torque sensor section of a column shaft with a torsion bar housing, magnetic sensing ring and small connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_torque_sensor__REF.png
```

### 2. EXPL — `steering_torque_sensor__EXPL.png`

먼저 `steering_torque_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached steering_torque_sensor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Steering torque sensor section of a column shaft with a torsion bar housing, magnetic sensing ring and small connector.
Style: clean exploded-view illustration on a landscape 3:2 canvas, the components separated along one axis with even spacing, realistic materials.
Background: neutral light grey, soft studio lighting.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_torque_sensor__EXPL.png
```

<a id="pack_current_sensor"></a>
## pack_current_sensor — 배터리 전류 센서

3D 방식: AI — REF 이미지를 TRELLIS로 3D 변환 시도

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `pack_current_sensor__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `pack_current_sensor__CUT.png` | `pack_current_sensor__REF.png` |

### 1. REF — `pack_current_sensor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Hall-effect high-current sensor clamped around a copper busbar, compact black housing with mounting tabs and a small connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): pack_current_sensor__REF.png
```

### 2. CUT — `pack_current_sensor__CUT.png`

먼저 `pack_current_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached pack_current_sensor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Hall-effect high-current sensor clamped around a copper busbar, compact black housing with mounting tabs and a small connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): pack_current_sensor__CUT.png
```

<a id="brake_pressure_sensor"></a>
## brake_pressure_sensor — 브레이크 압력 센서

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `brake_pressure_sensor__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `brake_pressure_sensor__CUT.png` | `brake_pressure_sensor__REF.png` |

### 1. REF — `brake_pressure_sensor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Hydraulic brake pressure sensor with a threaded steel port, cylindrical stainless body and a three-pin connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pressure_sensor__REF.png
```

### 2. CUT — `brake_pressure_sensor__CUT.png`

먼저 `brake_pressure_sensor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached brake_pressure_sensor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Hydraulic brake pressure sensor with a threaded steel port, cylindrical stainless body and a three-pin connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): brake_pressure_sensor__CUT.png
```

<a id="imu_sensor"></a>
## imu_sensor — 요레이트·가속도 센서

3D 방식: AI — REF 이미지를 TRELLIS로 3D 변환 시도

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `imu_sensor__CUT.png` | 없음 |

### 1. CUT — `imu_sensor__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Small automotive inertial sensor module in a sealed black housing with a mounting bracket and connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): imu_sensor__CUT.png
```
