# Verification report — 2026-11-03

## Executed, not inferred
- Node runtime v22.16.0, `--experimental-strip-types`.
- v14.1 new tests: **9/9 PASS** (bridge boot, gateway impacts ECU and speed, thermal HW fault, braking/steering, collision, invalid input, three requirement oracles).
- All tests provided in extracted core: **330 PASS, 2 FAIL** when running `node --experimental-strip-types --test tests/*.test.mjs`. Both failures are startup failures in inherited `tests/engineering.test.mjs` and `tests/logic.test.mjs`, importing `src/content/ready.ts`, which was not included in the original v14 selected-core archive. These are **original incomplete source packaging issues**, not failed assertions in the new modules. No fabricated fix applied.
- Running all tests except those two incomplete inherited suites: **330/330 PASS**. See `reports/TEST_COMMANDS.md` for reproducible command.
- `reports/GENERATED_TRACE/` contains actual execution samples with independent oracle results (reference/faulty/repaired), not invented trace. All 3 cases yielded PASS/FAIL/PASS. Numerical thresholds remain provisional teaching specs.
- No web app built or browser screenshot QA performed. No app runtime/PWA performance/3D model QA claimed.

## Remaining Claude Code work (must not be called finished)
1. React + Vite + React Three Fiber game UI, 3D characters/rigs, environmental props, actual rendered playable road.
2. Input loop with fixed timestep, chase AI distance and checkpoints, 3D collision and camera, route geometry and ship ramp.
3. Campaign route state + 22 logical screens, UI puzzle, evidence reveal and controls; browser integration of the provided APIs.
4. Generic block editor/executor beyond two gateway program presets, if desired. Current demonstrated mutation is the fictional input gateway, not wholesale ECU source editing.
5. Thermal repair requires parked hardware action + restart; player may inspect SW logic but cannot repair hardware by changing fan condition.
6. 11 domains have underlying control source documents; no 11-domain interactive garage UI is delivered yet.
7. Stitch final screen choices, cat identity/roles, legal sourcing of font and images, 3D assets, final story tone need human approval.
8. Accessibility, browser E2E tests, acceptance on actual hardware and deployment.

## Safety / epistemic scope
The v14 model is an educational simplified toy and game-world kinematics are arcade assumptions. Test PASS is **not** OEM real-world conformance, safe operation or MIL/SIL/HIL validation. Comparison oracles are separate from reference trace, but thresholds are educational and provisional. Verified code ≠ feature-complete game.
