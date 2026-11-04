---
name: Cozy Detective Clay
colors:
  surface: '#fff8f0'
  surface-dim: '#e0d9d0'
  surface-bright: '#fff8f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf3e9'
  surface-container: '#f4ede3'
  surface-container-high: '#eee7dd'
  surface-container-highest: '#e8e2d8'
  on-surface: '#1e1b16'
  on-surface-variant: '#3d4946'
  inverse-surface: '#33302a'
  inverse-on-surface: '#f7f0e6'
  outline: '#6d7a76'
  outline-variant: '#bcc9c4'
  surface-tint: '#006b5b'
  primary: '#006b5b'
  on-primary: '#ffffff'
  primary-container: '#36b39c'
  on-primary-container: '#003f35'
  inverse-primary: '#64dac1'
  secondary: '#b52234'
  on-secondary: '#ffffff'
  secondary-container: '#ff5964'
  on-secondary-container: '#600012'
  tertiary: '#5952af'
  on-tertiary: '#ffffff'
  tertiary-container: '#9c95f8'
  on-tertiary-container: '#312885'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#82f7dd'
  primary-fixed-dim: '#64dac1'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005144'
  secondary-fixed: '#ffdad9'
  secondary-fixed-dim: '#ffb3b3'
  on-secondary-fixed: '#410009'
  on-secondary-fixed-variant: '#920020'
  tertiary-fixed: '#e3dfff'
  tertiary-fixed-dim: '#c5c0ff'
  on-tertiary-fixed: '#140067'
  on-tertiary-fixed-variant: '#413996'
  background: '#fff8f0'
  on-background: '#1e1b16'
  surface-variant: '#e8e2d8'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.06em
  metric-speed:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2.5rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 2rem
  space-xl: 3rem
---

## Brand & Style

This design system drives a tactile 3D cozy mystery-racing adventure. The emotional register blends the playful warmth of miniature clay dioramas and vinyl collectibles with the analytical clarity of mechanical investigation and telemetry readout tools. 

The aesthetic is fundamentally **Claymorphic & Tactile Skeuomorphic**:
- Physical, touchable surfaces rendered with soft bevels, ambient studio lighting, and smooth rounded pill contours.
- Materials evoke real tabletop miniatures: carved pine, molded soft-touch vinyl, matte resin buttons, textured corkboard, aged paper stationery, pushpins, and metallic clipboard clips.
- UI elements carry tangible weight: cards feel like thick plastic tiles, dialog boxes behave like stacked sheets of notebook paper, and buttons exhibit physical push displacement (depressing downward when activated).
- High visual friendliness avoids sterile, flat modernism in favor of organic squircle curves, welcoming feline motifs, and readable retro-arcade mechanical gauges.

## Colors

The palette balances vibrant, candy-tinged gameplay accents against organic, warm natural backgrounds to preserve long-session legibility and a cozy garage ambiance.

- **Primary (`#36B39C` / Accent Mint `#73E2CD`)**: Active vehicle telemetry, confirmed clues, affirmative interactions, mechanical verification, and speed boosts.
- **Secondary (`#FF5964` / Intense Coral `#FA3C4C`)**: Urgent detective threads, alerts, speed thresholds, critical notifications, and high-visibility racing indicators.
- **Tertiary (`#A29BFE` / Deep Lavender `#8C7AE6`)**: Analytical logic pathways, deduction connections, detective clipboard backplates, and special inventory items.
- **Neutral Backgrounds (`#FFF8EE` Warm Cream / `#FBF4E6` Parchment)**: Main canvas cards, dialog speech bubbles, schematic papers, and base window containers.
- **Board Wood & Cork (`#D4A373` Cork / `#B07D4C` Wood Frame / `#8C5828` Shadow Rim)**: Physical frame surrounds, evidence board backing, and tactile shelf dividers.
- **Deep Slate Ink (`#2D3436` Primary Ink / `#1E272E` Pure Ink)**: High-contrast typography, icon glyphs, dial tick marks, and dark mechanical housings.

## Typography

Typography prioritizes plump, friendly geometry with exceptional stroke legibility at a distance across PC displays. 

- **Display & Headlines**: Built with extra-bold cuts (`800`) to match the rounded physical weight of clay toys. Text titles inside Godot `Label` nodes frequently receive subtle 2px dark drop-shadow offsets (`#1E272E` at 30% opacity) or 1.5px soft cream outlines to pop cleanly against textured wood and 3D viewports.
- **Telemetry & Gauge Readouts**: Uses tight tracking and tabular numerals (`metric-speed`) for instant reading during dynamic vehicle sequences without shifting layout width.
- **Narrative & Dialog**: Medium weights (`500` - `600`) deliver warm, conversational story progression without cluttering dialog balloon interiors.

## Layout & Spacing

Designed for fixed 16:9 PC displays (native reference: 1920x1080), mapping directly to Godot 4 `Control` anchor containers and UI canvas layers:

- **HUD Outer Margins**: Anchored 40px (`margin`) inward from viewport edges to preserve a clean border buffer and guarantee camera clearance during motion.
- **Evidence Board Grid**: A 12-column flex area overlaid across the investigation desktop. Cards and sticky memos occupy 2 to 4 columns with minimum `gutter` gaps of 24px (`1.5rem`).
- **Nesting Rules**:
  - `space-xs` (6px): Inset margins between dial ticks, button badges, and pin icons.
  - `space-sm` (12px): Standard spacing between grouped telemetry icons, sub-labels, and input chips.
  - `space-md` (20px): Inner padding for claymorphic cards, dialog bubbles, and inspect panels.
  - `space-lg` (32px): Separation between modular UI panels (e.g., Clipboard body to side tabs).
  - `space-xl` (48px): Distance between primary modal frames and dismiss action groups.

## Elevation & Depth

Visual hierarchy uses physical tactile elevation reminiscent of tabletop stop-motion props:

1. **Layer 0 (Desk / Viewport Surface)**: The game camera scene or the primary cork texture. Soft dark vignettes at canvas borders.
2. **Layer 1 (Investigation Board & Clipboard Backplates)**: Large chunky panels constructed using 9-slice wooden borders or cast resin rims. Employs large, soft ambient contact shadows: `offset-y: 12px`, `blur: 24px`, `#1E272E` at 25% opacity.
3. **Layer 2 (Cards, Paper Slips, Diagnostic Tiles)**: Pinned documents and modular modules. Features crisp top highlights (1px solid `#FFFFFF` at 60% opacity) and an inner bottom shadow (bevel simulation: 3px inset `#D4A373` at 40% opacity) accompanied by a 6px directional drop shadow.
4. **Layer 3 (Chunky Tactile Buttons, Pushpins, Dials)**: Plump toy-like interactables. Features extruded bottom bevel rims (3px to 5px darker tonal borders simulating clay thickness). On `:pressed`, the element translates down `+4px` on the Y-axis, collapsing the bottom bevel to produce an authentic push button mechanical click.
5. **Layer 4 (Modals & Focus Inspection Overlays)**: Floats with deep omnidirectional blur (`blur: 36px`, opacity 40%) paired with a softened cream rim light.

## Shapes

The design system is defined by soft squircle geometry and pill contours:

- **Frames & Board Panels**: Heavy 24px to 32px rounded corners on exterior rims, adorned with organic molded corner ornaments (such as rounded pastel flower rosettes and magnifying badge crests).
- **Cards & Paper Tiles**: 16px to 20px radii (`rounded-lg`). Top edges of sticky notes feature organic curled corner variants.
- **Buttons & Control Pills**: Full capsule pills (`rounded-full` or 999px) for primary action triggers; 14px to 18px rounded squircles for square tool chips and utility switches.
- **NinePatchRect Guidelines (Godot)**: UI asset slices feature generous 24px margin patches to protect corner roundness and highlight bevels from stretching or pixel degradation.

## Components

### 1. Chunky Clay Buttons
- **Structure**: Rounded pill or squircle container with a dual-tone clay gradient, a soft white top-rim highlight, and a thick 4px darker bottom baseline shadow.
- **States**:
  - *Default*: Base elevation with subtle idle floating animation.
  - *Hover*: Scales up 1.04x with an intensified bright rim sheen.
  - *Pressed*: Y-offset shift of `+4px`, bottom border thickness collapses from 4px to 1px, inner drop shadow appears.
- **Variants**: Mint Green (Affirmative/Start), Coral Red (Emergency/Stop/Brake), Golden Honey (Hint/Clue).

### 2. Detective Evidence Cards
- **Structure**: Thick plastic-clay or layered cardstock tiles featuring rounded 16px corners. Divided into an upper preview viewport (3D part cutaway or crime photo) and a lower status drawer with labeled progress capsules.
- **Details**: Upper clips, pushpins (cherry red or mustard yellow with directional pin shadow), and taped edges (`#FFF8EE` semi-opaque strips).

### 3. Investigation Clipboard
- **Structure**: Molded lavender or mint chassis capped with a rounded metallic bronze/gold spring clamp at the top center.
- **Contents**: Slanted stacked parchment sheets displaying circuit schematics, suspect cat profiles, or ECU diagnosis trees. Includes colored index tabs extending from the right rail.

### 4. Cork Notice Board & Pinned Notes
- **Structure**: Outer carved-wood frame with molded corner rosettes and a warm, textured cork fill.
- **Elements**: Red deductive yarn connectors drawn dynamically between pushpins, sticky notes with hand-drawn marker icons, and instant photo frames with thick white margins.

### 5. Racing Telemetry & HUD Gauges
- **Structure**: Compact, minimal curved dashboard HUD nestled into screen corners to maintain racing road visibility.
- **Elements**: 
  - Chunky semi-circular tachometer with rounded pip-dials that illuminate in vibrant Mint Teal.
  - Big bold digital speedometer (`metric-speed`) centered inside a rounded cockpit dial pill.
  - Gear indicator pill (P-R-N-D) with physical toggle indicator styling.

### 6. Modal Frames & Inspection Windows
- **Structure**: Full-screen backdrop dimmed with a warm sepia-tinted blur. Main dialog container uses wood or thick porcelain-clay framing, crowned by a character icon badge (e.g., cat ears or magnifying lens).
- **Actions**: Two chunky pill buttons pinned to the lower footer (Mint confirmation on right, warm neutral cancel on left).