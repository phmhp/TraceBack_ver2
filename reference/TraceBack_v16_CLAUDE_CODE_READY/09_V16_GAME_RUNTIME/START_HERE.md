# v16 change set

## Correction: render strategy
* **Outside racing**: cats are still 3D-looking illustrations only, no skeletal rigs, movement states, blinking/idle loops. Prologue/dialogue/story panels can use static character art or swap static expression images when explicitly needed. Garage and educational rooms can show 2D/2.5D fixed-angle scenes with active R3F *objects* (vehicle components, connectors, signal wires, switches, lab equipment), hotspots and overlays. Cat art itself need not interact.
* **During racing**: rendered 3D road/districts, moving vehicle, obstacles, police agents, collisions and camera. Cats can be optional seated still 3D models or static cockpit portraits; not pedestrians.
* **UI**: clickable, keyboard accessible; meaningful visual feedback; no mandatory walking/navigation or character animations elsewhere.

## Included functional Game Runtime
- `src/gameRuntime.mjs`: pure deterministic event reducer, campaign transitions, evidence and hypotheses, scoped constrained repair, explicit checkpoint/save schema and story gatekeeping. No browser APIs.
- `src/raceRuntime.mjs`: pure chase clock/risk, collision/capture/finish/checkpoint rules independent of rendering; accepts actual `stepBridge` frame via adapter when a game-web app is built.
- `src/benchRuntime.mjs`: actual paired bench trace wrapper around v14.1 bridge, independent educational oracles and safe vs invalid outcomes.
- `src/schemas.mjs`: events/screens/scenario constants.
- `tests/*.test.mjs`: in-memory full-loop + guard and bench tests.

## Boundary
A runtime library and executable tests **are not** a deployed 3D game. React views, R3F scenes, sound, finished art assets, save UI, and full police pathfinding are deliverables for Claude Code.

## Commands
Run `node --experimental-strip-types --test tests/*.test.mjs` from this directory. Use Node >=22 with TS strip support for bench adapter. Tests are deterministic and do not depend on 3D libraries.
