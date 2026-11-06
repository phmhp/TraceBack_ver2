# 열관리 — 이미지 생성 프롬프트

> 자동 생성 파일입니다. 수정은 `scripts/image-prompt-data.mjs`에서 하고 `npm run prompts`를 실행하세요.
> 사용 규칙은 [../PART_IMAGE_PROMPTS.md](../PART_IMAGE_PROMPTS.md)를 보세요. **코드 블록 하나 = 요청 1번 = 이미지 1장**입니다.

<a id="cooling_pump"></a>
## cooling_pump — 전동 냉각수 펌프

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `cooling_pump__REF.png` | 없음 |
| 2 | EXPL (분해도) | `cooling_pump__EXPL.png` | `cooling_pump__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `cooling_pump__CUT.png` | `cooling_pump__REF.png` |
| 4 | EVID-ok (메모판 사진 · 정상) | `cooling_pump__EVID-ok.png` | `cooling_pump__REF.png` |
| 5 | EVID-fault (메모판 사진 · 고장) | `cooling_pump__EVID-fault.png` | `cooling_pump__EVID-ok.png` |

### 1. REF — `cooling_pump__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric coolant pump with a compact cylindrical motor body, volute housing with one inlet and one outlet pipe and a small connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_pump__REF.png
```

### 2. EXPL — `cooling_pump__EXPL.png`

먼저 `cooling_pump__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached cooling_pump__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric coolant pump with a compact cylindrical motor body, volute housing with one inlet and one outlet pipe and a small connector.
Style: clean exploded-view illustration on a landscape 3:2 canvas, the components separated along one axis with even spacing, realistic materials.
Background: neutral light grey, soft studio lighting.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_pump__EXPL.png
```

### 3. CUT — `cooling_pump__CUT.png`

먼저 `cooling_pump__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached cooling_pump__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric coolant pump with a compact cylindrical motor body, volute housing with one inlet and one outlet pipe and a small connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_pump__CUT.png
```

### 4. EVID-ok — `cooling_pump__EVID-ok.png`

먼저 `cooling_pump__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached cooling_pump__REF.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. An electric coolant pump installed with coolant hoses attached.
Condition: normal and healthy — hoses clamped tight, housing dry. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_pump__EVID-ok.png
```

### 5. EVID-fault — `cooling_pump__EVID-fault.png`

먼저 `cooling_pump__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached cooling_pump__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. An electric coolant pump installed with coolant hoses attached.
Condition: faulty — dried white coolant crust around the shaft seal and a damp hose clamp. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_pump__EVID-fault.png
```

<a id="radiator"></a>
## radiator — 라디에이터

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `radiator__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `radiator__CUT.png` | `radiator__REF.png` |

### 1. REF — `radiator__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Aluminum cross-flow radiator core with thin fins and plastic end tanks with inlet and outlet necks.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): radiator__REF.png
```

### 2. CUT — `radiator__CUT.png`

먼저 `radiator__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached radiator__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Aluminum cross-flow radiator core with thin fins and plastic end tanks with inlet and outlet necks.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): radiator__CUT.png
```

<a id="cooling_fan"></a>
## cooling_fan — 냉각 팬

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `cooling_fan__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `cooling_fan__CUT.png` | `cooling_fan__REF.png` |
| 3 | EVID-ok (메모판 사진 · 정상) | `cooling_fan__EVID-ok.png` | `cooling_fan__REF.png` |
| 4 | EVID-fault (메모판 사진 · 고장) | `cooling_fan__EVID-fault.png` | `cooling_fan__EVID-ok.png` |

### 1. REF — `cooling_fan__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric radiator cooling fan in a black plastic shroud with seven curved blades, a central motor hub and a short pigtail connector.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_fan__REF.png
```

### 2. CUT — `cooling_fan__CUT.png`

먼저 `cooling_fan__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached cooling_fan__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric radiator cooling fan in a black plastic shroud with seven curved blades, a central motor hub and a short pigtail connector.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_fan__CUT.png
```

### 3. EVID-ok — `cooling_fan__EVID-ok.png`

먼저 `cooling_fan__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached cooling_fan__REF.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The radiator cooling fan behind its shroud seen from the engine bay side.
Condition: normal and healthy — blades spinning with soft motion blur, hub clean. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_fan__EVID-ok.png
```

### 4. EVID-fault — `cooling_fan__EVID-fault.png`

먼저 `cooling_fan__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached cooling_fan__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The radiator cooling fan behind its shroud seen from the engine bay side.
Condition: faulty — blades completely still, dust and a leaf jammed at the hub, connector pigtail hanging. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_fan__EVID-fault.png
```

<a id="coolant_reservoir"></a>
## coolant_reservoir — 냉각수 리저버

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `coolant_reservoir__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `coolant_reservoir__CUT.png` | `coolant_reservoir__REF.png` |

### 1. REF — `coolant_reservoir__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Translucent white plastic coolant expansion reservoir with a pressure cap, hose spigots and mounting tabs, fluid level visible.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): coolant_reservoir__REF.png
```

### 2. CUT — `coolant_reservoir__CUT.png`

먼저 `coolant_reservoir__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached coolant_reservoir__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Translucent white plastic coolant expansion reservoir with a pressure cap, hose spigots and mounting tabs, fluid level visible.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): coolant_reservoir__CUT.png
```

<a id="cooling_pipe"></a>
## cooling_pipe — 냉각 배관

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `cooling_pipe__CUT.png` | 없음 |
| 2 | EVID-ok (메모판 사진 · 정상) | `cooling_pipe__EVID-ok.png` | `cooling_pipe__CUT.png` |
| 3 | EVID-fault (메모판 사진 · 고장) | `cooling_pipe__EVID-fault.png` | `cooling_pipe__EVID-ok.png` |

### 1. CUT — `cooling_pipe__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A set of molded black rubber coolant hoses and aluminum pipes with spring clamps and quick-connect fittings.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_pipe__CUT.png
```

### 2. EVID-ok — `cooling_pipe__EVID-ok.png`

먼저 `cooling_pipe__CUT.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached cooling_pipe__CUT.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Coolant hoses and pipes running between a pump and a radiator.
Condition: normal and healthy — hoses firm and dry. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_pipe__EVID-ok.png
```

### 3. EVID-fault — `cooling_pipe__EVID-fault.png`

먼저 `cooling_pipe__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached cooling_pipe__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Coolant hoses and pipes running between a pump and a radiator.
Condition: faulty — one hose collapsed and kinked with a wet joint. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): cooling_pipe__EVID-fault.png
```

<a id="chiller"></a>
## chiller — 칠러(열교환기)

3D 방식: AI — REF 이미지를 TRELLIS로 3D 변환 시도

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `chiller__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `chiller__CUT.png` | `chiller__REF.png` |

### 1. REF — `chiller__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Compact plate heat exchanger (chiller) with stacked aluminum plates and four pipe connections.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): chiller__REF.png
```

### 2. CUT — `chiller__CUT.png`

먼저 `chiller__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached chiller__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Compact plate heat exchanger (chiller) with stacked aluminum plates and four pipe connections.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): chiller__CUT.png
```

<a id="coolant_valve"></a>
## coolant_valve — 냉각수 다방향 밸브

3D 방식: AI — REF 이미지를 TRELLIS로 3D 변환 시도

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `coolant_valve__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `coolant_valve__CUT.png` | `coolant_valve__REF.png` |

### 1. REF — `coolant_valve__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric multi-way coolant valve with a round plastic body, several pipe ports around it and an actuator motor on top.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): coolant_valve__REF.png
```

### 2. CUT — `coolant_valve__CUT.png`

먼저 `coolant_valve__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached coolant_valve__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric multi-way coolant valve with a round plastic body, several pipe ports around it and an actuator motor on top.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): coolant_valve__CUT.png
```
