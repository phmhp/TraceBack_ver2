# TraceBack v16 — primary entry point

This is an **implementation handoff**, not a built/runnable 3D web game. The v14.1 package is preserved byte-for-byte as source evidence except for this new top-level v16 layer. Read `CLAUDE.md` and `09_V16_GAME_RUNTIME/START_HERE.md` first.

## Explicit correction, 2026-11-03
**Cats are STATIC artwork outside racing scenes**. Non-race garage/board/wiring/twin bench use fixed-frame 3D-look renders or layered 2.5D assets; cats do NOT require walking, idle loops, rigs, blink or path navigation. Only cars, world, and relevant optional in-race cat models/poses require 3D. Interactive 3D learning objects and testing interfaces remain interactive; static cats are not the same as static educational apparatus.

## Version authority
1. `CLAUDE.md` and `09_V16_GAME_RUNTIME/contracts/*` override conflicting old v14/v14.1 assumptions (including all idle/blink/repair character animation requirements outside races).
2. Executable v16 runtime in `09_V16_GAME_RUNTIME/src` and tests.
3. v14.1 educational bridge/test code in `08_V14_1_DELIVERY/control-core/TraceBack-develop`.
4. Original v14 historical content, for reference only. Earlier prompts are superseded by v16 prompts.

## Environment and scope
PC web 16:9, React/TypeScript + React Three Fiber/Three.js; propulsion and thermal required; brake optional; checkpoint retry; real 3D driving first, incremental polish. No 3D web application is bundled in this ZIP. Follow v16 handoff prompts for creating it.

## Quick tests
`cd 09_V16_GAME_RUNTIME && node --experimental-strip-types --test tests/*.test.mjs`
`cd 08_V14_1_DELIVERY/control-core/TraceBack-develop && node --experimental-strip-types --test tests/educational-game-bridge.test.mjs tests/educational-bench.test.mjs`
