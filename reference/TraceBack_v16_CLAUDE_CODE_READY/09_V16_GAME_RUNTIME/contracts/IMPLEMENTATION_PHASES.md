# Claude execution order

1. AUDIT: inventory all files; do not assume nested zip available as extracted. Run v16 runtime tests with `node --experimental-strip-types --test tests/*.test.mjs` and selected v14.1 control tests. Record pass/fail; reconcile mismatches.
2. APP SCAFFOLD: create `game-web/` React+TypeScript+Vite+R3F and basic styling. Import v16 pure runtime and v14.1 bridge using bundled library workspace/copy with exact provenance; avoid brittle relative imports in production.
3. VERTICAL SLICE: title, still-image story, garage L1–L4 learning with 3D interactive mechanical objects but no moving cats; 3D street, movable car, accelerometer/torque linked to real v14 ECU; propulsion fault trigger; board -> constrained wiring -> actual bench -> repaired chase.
4. FULL CAMPAIGN: thermal, optional brake, coast/port checkpoints, police capture and retry, ship end, save/resume, catch-up accumulator, model errors.
5. POLISH: art direction consistent pastel, 3D rendering budget, accessible puzzles, audio and useful animations of *vehicles, lamps, switches, connectors and apparatus*, not cats outside racing; regression QA and screenshots.
6. REVIEW: map each row of acceptance matrix to test and actual screenshot/video. Report unresolved assets and external library dependencies; no fake UI completion.
