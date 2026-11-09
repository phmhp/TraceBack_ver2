# Interaction audit

## Navigation and introduction

- Title: new game, settings, control guide. Prologue advances via dialogue/action.
- Garage: select a vehicle domain and its main function; switch **Vehicle/System**, **E/E**, **Control SW**. Initial guide popup is dismissible by button/Enter.
- Global keyboard handling is in `src/experiences.tsx` and `src/sim/driverInput.ts`: Enter advances contextual actions; driving supports physical arrow/WASD positions, gear 1–4, and regenerative Q/E where applicable.

## Vehicle and race

- Vehicle/System: selectable 3D domain parts and view toggles; E/E: controller/connection focus; Control SW: flow-block explanation.
- Race: Start/gear/accelerator/brake/steer interactions feed the local vehicle simulation. HUD reports speed, distance, pursuit gap, READY/gear and fault condition. Fault cue opens dialogue; re-drive preserves the story state after repair.

## Cause tracing, puzzle, verification

- `EeTrace`: select/view evidence polaroids and trace output backward through the E/E relationship. Guide says to choose an output in the E/E panel, replay inputs, and refute candidates; the state then unlocks the next boundary/section.
- `RefPuzzle`: choose parts/pieces and fill compatible wiring slots; remove mutable slots; reset the board; compile when required slots are filled.
- Twin bench: switch SW/embedded/system/vehicle layers, select normal/fault/recovery test cards, run the timed test, inspect PASS/FAIL, and proceed only when required results exist.
- Failure: return to trace or retry wiring; repair applies the validated state; ending allows menu/new case.

## Capture note

The 42 deterministic captures cover initial modal states and terminal screen states. A player-controlled normal/fault/recovery run is represented by the four bench tabs; the runner does not click through each modal because that would alter its designed QA start state. No nonresponsive click was recorded by the capture runner.
