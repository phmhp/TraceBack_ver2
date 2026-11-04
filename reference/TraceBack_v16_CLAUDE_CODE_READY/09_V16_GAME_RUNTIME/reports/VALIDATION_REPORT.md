# v16 validation record — 2026-11-03

- **v16 new game runtime**: 17/17 tests PASS using `node --experimental-strip-types --test tests/*.test.mjs` (current Node 22.16.0).
- **v14.1 preserved control core**: 330/332 PASS when running all `tests/*.test.mjs`; two pre-existing modules `engineering.test.mjs` and `logic.test.mjs` cannot be run because their imported `src/content/ready.ts` is outside the selected reusable core. Do not misstate as 332/332.
- **v14.1 selected supported tests**: 330/330 PASS when excluding exactly `engineering.test.mjs` and `logic.test.mjs`.
- Actual full-stack 3D browser game: **NOT BUILT**. No frontend E2E, animation quality, collision AI, accessibility or framerate verification can honestly be claimed.
- Bench results are educational demonstration oracles, NOT OEM-grade design verification; direct `BENCH_RESULT` dispatch is an internal trusted action and cannot be exposed as user UI.
- All original v14.1 payload files are unmodified; v16 adds top-level override and new `09_V16_GAME_RUNTIME` only.

### Commands
```
cd 09_V16_GAME_RUNTIME
node --experimental-strip-types --test tests/*.test.mjs
cd ../08_V14_1_DELIVERY/control-core/TraceBack-develop
node --experimental-strip-types --test tests/educational-game-bridge.test.mjs tests/educational-bench.test.mjs
```
