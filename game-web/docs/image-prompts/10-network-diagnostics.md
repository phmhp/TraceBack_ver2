# 통신·진단 — 이미지 생성 프롬프트

> 자동 생성 파일입니다. 수정은 `scripts/image-prompt-data.mjs`에서 하고 `npm run prompts`를 실행하세요.
> 사용 규칙은 [../PART_IMAGE_PROMPTS.md](../PART_IMAGE_PROMPTS.md)를 보세요. **코드 블록 하나 = 요청 1번 = 이미지 1장**입니다.

<a id="can_harness"></a>
## can_harness — CAN 통신선

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `can_harness__CUT.png` | 없음 |
| 2 | EVID-ok (메모판 사진 · 정상) | `can_harness__EVID-ok.png` | `can_harness__CUT.png` |
| 3 | EVID-fault (메모판 사진 · 고장) | `can_harness__EVID-fault.png` | `can_harness__EVID-ok.png` |

### 1. CUT — `can_harness__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Twisted-pair network cable inside a harness branch with two sealed multi-pin connectors.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): can_harness__CUT.png
```

### 2. EVID-ok — `can_harness__EVID-ok.png`

먼저 `can_harness__CUT.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached can_harness__CUT.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A twisted-pair network cable branch plugged into a control unit connector.
Condition: normal and healthy — twisted pair intact, connector locked. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): can_harness__EVID-ok.png
```

### 3. EVID-fault — `can_harness__EVID-fault.png`

먼저 `can_harness__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached can_harness__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A twisted-pair network cable branch plugged into a control unit connector.
Condition: faulty — twisted pair untwisted and one wire nicked near the connector. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): can_harness__EVID-fault.png
```

<a id="diagnostic_port"></a>
## diagnostic_port — 진단 포트

3D 방식: 2D — 이미지만 게임에 사용

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | CUT (게임 카드 컷아웃) | `diagnostic_port__CUT.png` | 없음 |
| 2 | EVID-ok (메모판 사진 · 정상) | `diagnostic_port__EVID-ok.png` | `diagnostic_port__CUT.png` |
| 3 | EVID-fault (메모판 사진 · 고장) | `diagnostic_port__EVID-fault.png` | `diagnostic_port__EVID-ok.png` |

### 1. CUT — `diagnostic_port__CUT.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Sixteen-pin vehicle diagnostic connector socket mounted under a dashboard panel.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): diagnostic_port__CUT.png
```

### 2. EVID-ok — `diagnostic_port__EVID-ok.png`

먼저 `diagnostic_port__CUT.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached diagnostic_port__CUT.png. The part must look exactly the same (shape, proportions, materials, colors).
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The diagnostic connector under the dashboard with a diagnostic adapter nearby.
Condition: normal and healthy — socket clean with the adapter plugged in. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): diagnostic_port__EVID-ok.png
```

### 3. EVID-fault — `diagnostic_port__EVID-fault.png`

먼저 `diagnostic_port__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached diagnostic_port__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. The diagnostic connector under the dashboard with a diagnostic adapter nearby.
Condition: faulty — socket with a bent pin and the adapter lying unplugged. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): diagnostic_port__EVID-fault.png
```

<a id="diagnostic_tool"></a>
## diagnostic_tool — 진단 장비

3D 방식: 2D — 이미지만 게임에 사용

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | EVID-ok (메모판 사진 · 정상) | `diagnostic_tool__EVID-ok.png` | 없음 |
| 2 | EVID-fault (메모판 사진 · 고장) | `diagnostic_tool__EVID-fault.png` | `diagnostic_tool__EVID-ok.png` |

### 1. EVID-ok — `diagnostic_tool__EVID-ok.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A rugged diagnostic tablet on a workbench connected to a vehicle interface adapter, its screen showing abstract waveforms only.
Condition: normal and healthy — smooth steady waveform on screen. Calm, cool teal ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): diagnostic_tool__EVID-ok.png
```

### 2. EVID-fault — `diagnostic_tool__EVID-fault.png`

먼저 `diagnostic_tool__EVID-ok.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Reference: the attached diagnostic_tool__EVID-ok.png. Keep exactly the same part, camera position, framing and composition; change only the condition below.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. A rugged diagnostic tablet on a workbench connected to a vehicle interface adapter, its screen showing abstract waveforms only.
Condition: faulty — jagged broken waveform with gaps on screen. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.
Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.
Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.
Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): diagnostic_tool__EVID-fault.png
```
