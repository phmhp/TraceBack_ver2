# TraceBack v14.1 — handoff supplement (2026-11-03)

This archive is the **entire v14 original package preserved** plus `08_V14_1_DELIVERY/` supplement. This is NOT a finished React/Three.js game. The supplement contains actual playable-physics *library* code and executable educational model test/oracles, but **no React game and no 3D animated assets**. Do not confuse project design contracts with implemented UI.

## Use this order
1. Read root `CLAUDE.md`, `contracts/DECISION_REGISTRY.md`, `contracts/CONTROL_MUTATION_API.md`.
2. Run control tests in `control-core/TraceBack-develop` with Node 22 and `--experimental-strip-types`.
3. Run bench tests and inspect the **generated** trace outputs. Do not rely on image text as requirement oracle.
4. Use `contracts/SCREEN_NAVIGATION_MATRIX.csv` to implement game scene route, `STITCH_REFERENCE_CANDIDATES.csv` for visual guidance only.
5. Build the web game in separate `game-web/` and import core via clean TypeScript module alias/relative path.
6. Implement `prompts/01_AUDIT.md` through `04_POLISH_AND_HANDOFF.md` in order.
7. Cross-check `reports/VALIDATION_REPORT.md`. In particular existing v14 model vs game app status.

## What is actually added
- Executable `educationalGameBridge.ts`: real 20ms v14 model + game speed/heading/position + collision + drive initialization + educational gateway software fault/hardware fault + identical paired traces.
- Executable `educationalBench.ts`: requirement oracles for propulsion gateway, fan tracking and optional brake actuator. Test data and tolerances are provisional educational demonstrator settings.
- Technical and navigation contracts, 3D art direction, gameplay tuning, 11 domain reference mapping, sample scenario packs, Claude Code prompts, QA report.
- Source manifest and checksum validation in `reports/`.

## Explicitly missing
R3F app, completed 3D rigs/model files, browser-level scene navigation/UI, actual configurable cop AI, downloadable game build, final author-approved Stitch IDs, general graph executor, in-drive repairs. These are CLAUDE CODE IMPLEMENTATION TASKS, not falsely completed here.
