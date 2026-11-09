# Screen inventory

## Runtime surface

`src/main.tsx` mounts the scene state machine in `src/game/runtime.ts`; scene selection and rendering are in `src/experiences.tsx`. Screens are scene states reached by UI events, not URL routes. The capture runner's `?qa=` values initialize those states only for QA.

| Capture | QA entry / scene | Renderer and visible structure |
|---|---|---|
| 00–01 | `new=1`, `PROLOGUE` | Title/prologue in `experiences.tsx`; illustrated background, title/menu, dialogue/action. |
| 02–22 | `GARAGE_L1`, domain + view 0/1/2 | `GarageExperience`, `VehicleLayout`, `EeBlueprint`, `SimulinkDiagram`; domain rail, function rail, 3D vehicle/System, 2D E/E, Control SW flow. Domains: drive, brake, steer, gear, power, thermal, suspension. First-entry instructional popup is intentionally captured. |
| 23–24 | `DRIVE_BRIEFING` cuts 0/1 | Heist/boarding sequence; `StaticCutscenes` / scene backgrounds. |
| 25–26 | `CHASE_NORMAL`, `FAULT_CUE` | `RaceExperience`, driver input and live HUD; fault dialogue/cutscene. |
| 27 | `BOARD` | **Current mounted board is `EeTrace.tsx`**, an E/E cause trace; initial “도미노 역추적” guide popup, evidence polaroids, E/E path and candidates appear after guide dismissal. |
| 28 | `WIRING` | `RefPuzzle.tsx`; requirements, selectable/placed pieces, wiring state and compile action. |
| 29–32 | `TWIN_BENCH` tabs `sw`/`embedded`/`system`/`vehicle` | `TwinBenchExperience` and `VerificationLab.tsx`; normal/fault/recovery comparisons across the four test abstractions. |
| 33–35 | `VERIFY_FAIL`, `REPAIR`, `CHASE_RESUME` | `FailureAnalysis`, `RepairSequence`, and resumed `RaceExperience`. |
| 36–38 | `SHIP_ESCAPE`, `SHIP_BOARDING` cuts 0/1 | Final dock drive then ship jump/landing cutscenes. |
| 39–41 | `CAUGHT`, `PAUSE`, `ENDING` | `BustedEnding`, pause overlay, `WantedEnding` / `CaseFileEnding.tsx`. |

## Layout and reuse

- Shared frame: `src/ui/game-shell.tsx`, `src/p2-notepaper.css`, `src/p3-notepaper-world.css`, `src/p4-fix-1109.css`; top progress rail, left scene/back control, fixed sound controls and contextual bottom action region.
- Vehicle/garage: `src/features/garage/VehicleLayout.tsx`, `EeBlueprint.tsx`, `SimulinkDiagram.tsx`; share `src/features/vehicle/` 3D model and `src/features/parts/PartModel.tsx` parts.
- Investigation: `src/features/board/EeTrace.tsx` (mounted); `DominoTrace.tsx`, `DominoBoard.tsx`, and `SuspectBoard.tsx` remain as unmounted legacy/reusable alternatives.
- Verification: `src/features/verification/VerificationLab.tsx` and local simulation data in `src/sim/`.

## State/data/assets

- State/persistence: `Campaign`, `initialCampaign`, and `dispatch` in `src/game/runtime.ts`; browser storage is used by the app, while capture uses explicit QA scene state.
- Scenario truth and faults: `src/game/scenarios.ts`, `src/sim/vehicleSim.ts`, `src/sim/components.ts`, `src/sim/registry.ts`.
- 3D components: `src/features/vehicle/`, `src/features/parts/partModels.ts`; simulation response passes through `src/features/verification/simModel.ts`.
- Key local art: `public/assets/vehicle-cutaway-v4.png`, `system-atlas-v7.png`, `diagnostic-evidence-sheet-v1.png`, `board-photos/`, `ending-thumbs/`, `stitch23/`, and part imagery under `public/assets/intake/images/`.
