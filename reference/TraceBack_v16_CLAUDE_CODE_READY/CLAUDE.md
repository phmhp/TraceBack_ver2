# TraceBack v16 — definitive Claude Code instructions

Read `README_FIRST.md`, `09_V16_GAME_RUNTIME/START_HERE.md`, then `09_V16_GAME_RUNTIME/contracts/STATIC_CHARACTER_AND_INTERACTION_POLICY.md`, `GAME_RUNTIME_SPEC.md`, `ACCEPTANCE_MATRIX.md`, and v16 `prompts/01_FIRST_INSTRUCTION.md`. **v16 overrides prior character-animation directions** in `08_V14_1_DELIVERY/contracts/3D_ART_DIRECTION.md`, previous `CLAUDE.md`, and previous prompts.

Deliver PC 16:9 React + R3F game. Character appearances in garage/prologue/board/wiring/bench/end are STATIC 3D-look artwork (PNG/transparent layered images or still renders) — no required cat rigging or animation there. In race scenes, make the world and vehicle genuine 3D with motion; optional in-car cat model/pose only, no free-roaming character AI.

Use v16 deterministic state machine, evidence, constrained puzzle, test gating, checkpoint policy as source of truth. `09_V16_GAME_RUNTIME/src` provides pure JavaScript runtime services; integrate using thin React state/view bindings rather than re-inventing rules. The educational vehicle bridge stays under `08_V14_1_DELIVERY/control-core/TraceBack-develop/src/gameBridge` and MUST remain connected to the driving view and bench adapter. Do not invent ECU safety bypass or independent test results; mark provisional assumptions.

Cases: propulsion pedal signal gateway (SW repair), thermal fan stuck OFF (physical actuator fault -> parked service only), optional friction brake actuator (physical service only). Never imply fixing real hardware by moving SW blocks. Regression tests and game-flow tests required for every transition. Finish an end-to-end propulsion vertical slice before broader art. Commit each verified milestone; retain all original files; do not edit archives.

No full 3D app or glTF character rig is pre-delivered: code and contracts must not be misrepresented as implemented graphics. Check file presence, run tests, report actual results and missing dependencies.
