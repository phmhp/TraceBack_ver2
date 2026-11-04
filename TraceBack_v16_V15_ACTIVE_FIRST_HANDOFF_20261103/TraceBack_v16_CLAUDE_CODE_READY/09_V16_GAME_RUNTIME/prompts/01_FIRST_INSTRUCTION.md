# Copy/paste as first Claude Code instruction after extracting v16 ZIP

You are implementing **TraceBack v16**, an educational PC 16:9 web game. Read root `CLAUDE.md`, `README_FIRST.md`, `09_V16_GAME_RUNTIME/START_HERE.md`, and all files in `09_V16_GAME_RUNTIME/contracts/`. The latest v16 rules OVERRIDE v14.1 character animation assumptions and earlier prompts.

**Corrected visual requirement**: Except during racing, cats are simply static 3D-looking illustrations (PNG still images, transparent art, or fixed perspective renders). They do not need walking, idle/blink loops, rigs or roaming NPC behavior. Garage, E/E explorer, evidence board, SW wiring bench and twin experiment bench must remain **interactive**, using clickable/rotatable 3D vehicle/electrical objects where educationally necessary, typed graph connections, test controls and responsive UI. Do not replace interactive learning equipment with flat inert images. Racing specifically requires a real 3D vehicle, road environments, obstacles, moving police vehicles and physical 20ms control-based speed/steering/braking. Racing cats may be seated/static; no full-body pedestrian movement needed.

**Start with read-only audit and tests before code edits**:
1. Inventory the contents, compare actual files with README and contracts; identify each library import and missing 3D asset. Do not mistake reference PNGs for rigged GLB.
2. Run `node --experimental-strip-types --test tests/*.test.mjs` from `09_V16_GAME_RUNTIME`; run v14.1 bridge/bench tests separately. Report exact outcomes, unresolved assumptions, no invented PASS.
3. Read v16 reducer and bench adapter. Use v16 `gameRuntime.dispatch` and `runVerifiedBench` as functional rules, not the obsolete routing contract alone; do not let UI supply arbitrary bench verdicts.
4. Create an implementation plan and git milestone sequence for `game-web/` React+TypeScript+Vite+Three.js/R3F, incorporating user-approved 16:9 web platform and check-point retry.
5. Before broad art, implement and test the **first playable propulsion vertical slice**: tutorial -> 3D driving -> observed pedal underreport -> investigation -> SW repair preset -> actual twin test -> changed ECU/vehicle output -> re-drive.
6. Continue with thermal physical fan scenario, optional brake, police chase+checkpoint, map/port/ending; static cats elsewhere. Use R3F for only relevant 3D scenes/objects.

**Implementation constraints**: Never replace real ECU results with visual fake values; never make physical fan repair into a SW patch; never change protected safety supervisor; maintain fixed dt 0.02s; distinguish provisional educational oracles from certification. Keep existing code and archived ZIPs, add new app files only. For every milestone run unit/integration tests, show user what is *implemented* vs *only specified* and make git commits if a working repo is initialized; do not invent git history.

First response: a concise inventory/audit report, exact test outcomes, a milestone checklist, and any blocker that truly prevents initial vertical slice. Then proceed to implementation without waiting for repeated approval unless absolutely necessary.
