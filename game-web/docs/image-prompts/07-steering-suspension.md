# 조향·현가계 — 이미지 생성 프롬프트

> 자동 생성 파일입니다. 수정은 `scripts/image-prompt-data.mjs`에서 하고 `npm run prompts`를 실행하세요.
> 사용 규칙은 [../PART_IMAGE_PROMPTS.md](../PART_IMAGE_PROMPTS.md)를 보세요. **코드 블록 하나 = 요청 1번 = 이미지 1장**입니다.

<a id="eps_motor"></a>
## eps_motor — EPS 보조 모터

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `eps_motor__REF.png` | 없음 |
| 2 | EXPL (분해도) | `eps_motor__EXPL.png` | `eps_motor__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `eps_motor__CUT.png` | `eps_motor__REF.png` |

### 1. REF — `eps_motor__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric power steering assist motor with a short cylindrical housing, worm gear reduction housing and attached control unit.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): eps_motor__REF.png
```

### 2. EXPL — `eps_motor__EXPL.png`

먼저 `eps_motor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached eps_motor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric power steering assist motor with a short cylindrical housing, worm gear reduction housing and attached control unit.
Style: clean exploded-view illustration on a landscape 3:2 canvas, the components separated along one axis with even spacing, realistic materials.
Background: neutral light grey, soft studio lighting.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): eps_motor__EXPL.png
```

### 3. CUT — `eps_motor__CUT.png`

먼저 `eps_motor__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached eps_motor__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Electric power steering assist motor with a short cylindrical housing, worm gear reduction housing and attached control unit.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): eps_motor__CUT.png
```

<a id="steering_rack"></a>
## steering_rack — 스티어링 랙

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `steering_rack__REF.png` | 없음 |
| 2 | EXPL (분해도) | `steering_rack__EXPL.png` | `steering_rack__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `steering_rack__CUT.png` | `steering_rack__REF.png` |

### 1. REF — `steering_rack__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Rack-and-pinion steering gear with a long aluminum rack housing, black rubber bellows boots at both ends and a pinion input on one side.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_rack__REF.png
```

### 2. EXPL — `steering_rack__EXPL.png`

먼저 `steering_rack__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached steering_rack__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Rack-and-pinion steering gear with a long aluminum rack housing, black rubber bellows boots at both ends and a pinion input on one side.
Style: clean exploded-view illustration on a landscape 3:2 canvas, the components separated along one axis with even spacing, realistic materials.
Background: neutral light grey, soft studio lighting.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_rack__EXPL.png
```

### 3. CUT — `steering_rack__CUT.png`

먼저 `steering_rack__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached steering_rack__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Rack-and-pinion steering gear with a long aluminum rack housing, black rubber bellows boots at both ends and a pinion input on one side.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): steering_rack__CUT.png
```

<a id="tie_rod"></a>
## tie_rod — 타이로드

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `tie_rod__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `tie_rod__CUT.png` | `tie_rod__REF.png` |

### 1. REF — `tie_rod__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Inner and outer tie rod assembly with a threaded adjuster, lock nut and a ball joint with rubber dust boot.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): tie_rod__REF.png
```

### 2. CUT — `tie_rod__CUT.png`

먼저 `tie_rod__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached tie_rod__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Inner and outer tie rod assembly with a threaded adjuster, lock nut and a ball joint with rubber dust boot.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): tie_rod__CUT.png
```

<a id="knuckle"></a>
## knuckle — 너클

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `knuckle__REF.png` | 없음 |
| 2 | TURN (4면도 시트) | `knuckle__TURN.png` | `knuckle__REF.png` |

### 1. REF — `knuckle__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Front steering knuckle in cast iron with strut mounting ears, steering arm, lower ball joint boss and a central hub bearing bore.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): knuckle__REF.png
```

### 2. TURN — `knuckle__TURN.png`

먼저 `knuckle__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image: one turnaround sheet of one object. No extra images, no alternatives, no other styles, no photos, no exploded views.
Design reference: the attached knuckle__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Front steering knuckle in cast iron with strut mounting ears, steering arm, lower ball joint boss and a central hub bearing bore.
Style: technical turnaround reference sheet on a landscape 3:2 canvas.
Layout: a clean 2x2 grid of the SAME object only: front view, side view, top view and one three-quarter view. Orthographic projection for the three flat views, identical scale and alignment.
Background: neutral light grey, flat even lighting, realistic materials.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): knuckle__TURN.png
```

<a id="control_arm"></a>
## control_arm — 컨트롤 암

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `control_arm__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `control_arm__CUT.png` | `control_arm__REF.png` |

### 1. REF — `control_arm__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Lower control arm, stamped steel L-shape, two rubber bushings at the body mounts and a ball joint at the outer end.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): control_arm__REF.png
```

### 2. CUT — `control_arm__CUT.png`

먼저 `control_arm__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached control_arm__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Lower control arm, stamped steel L-shape, two rubber bushings at the body mounts and a ball joint at the outer end.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): control_arm__CUT.png
```

<a id="coil_spring"></a>
## coil_spring — 코일 스프링

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `coil_spring__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `coil_spring__CUT.png` | `coil_spring__REF.png` |

### 1. REF — `coil_spring__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Painted steel coil spring with evenly pitched coils and flat ground ends.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): coil_spring__REF.png
```

### 2. CUT — `coil_spring__CUT.png`

먼저 `coil_spring__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached coil_spring__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Painted steel coil spring with evenly pitched coils and flat ground ends.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): coil_spring__CUT.png
```

<a id="damper"></a>
## damper — 댐퍼(쇼크업소버)

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `damper__REF.png` | 없음 |
| 2 | EXPL (분해도) | `damper__EXPL.png` | `damper__REF.png` |
| 3 | CUT (게임 카드 컷아웃) | `damper__CUT.png` | `damper__REF.png` |

### 1. REF — `damper__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Twin-tube shock absorber with a chrome piston rod, dust boot, bump stop and lower mounting eye.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): damper__REF.png
```

### 2. EXPL — `damper__EXPL.png`

먼저 `damper__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached damper__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Twin-tube shock absorber with a chrome piston rod, dust boot, bump stop and lower mounting eye.
Style: clean exploded-view illustration on a landscape 3:2 canvas, the components separated along one axis with even spacing, realistic materials.
Background: neutral light grey, soft studio lighting.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): damper__EXPL.png
```

### 3. CUT — `damper__CUT.png`

먼저 `damper__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached damper__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Twin-tube shock absorber with a chrome piston rod, dust boot, bump stop and lower mounting eye.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): damper__CUT.png
```

<a id="strut_assembly"></a>
## strut_assembly — 스트럿 어셈블리

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `strut_assembly__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `strut_assembly__CUT.png` | `strut_assembly__REF.png` |

### 1. REF — `strut_assembly__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Complete front strut assembly: a damper inside a coil spring with upper mount and bearing.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): strut_assembly__REF.png
```

### 2. CUT — `strut_assembly__CUT.png`

먼저 `strut_assembly__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached strut_assembly__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Complete front strut assembly: a damper inside a coil spring with upper mount and bearing.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): strut_assembly__CUT.png
```

<a id="anti_roll_bar"></a>
## anti_roll_bar — 스태빌라이저 바

3D 방식: 직접 — 이 이미지를 기준으로 코드로 모델링

| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |
|---|---|---|---|
| 1 | REF (3D 참고 이미지) | `anti_roll_bar__REF.png` | 없음 |
| 2 | CUT (게임 카드 컷아웃) | `anti_roll_bar__CUT.png` | `anti_roll_bar__REF.png` |

### 1. REF — `anti_roll_bar__REF.png`

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Bent solid steel anti-roll bar with two rubber bushings and short end links with ball joints.
Style: realistic industrial product render.
Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.
Background: plain pure white, soft even studio lighting, no cast shadow on the background.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): anti_roll_bar__REF.png
```

### 2. CUT — `anti_roll_bar__CUT.png`

먼저 `anti_roll_bar__REF.png` 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.

```text
Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.
The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.
Design reference: the attached anti_roll_bar__REF.png. Keep exactly the same object design, shape, proportions, materials and colors.
Subject: Generic passenger electric vehicle part, not resembling any specific manufacturer. Bent solid steel anti-roll bar with two rubber bushings and short end links with ball joints.
Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.
Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.
Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.
Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.
After the image, reply with only this file name (never draw it in the image): anti_roll_bar__CUT.png
```
