# Game logic contract — executable subset and implementation tasks

## Architecture / ownership
`input (WASD) -> fixed 20ms simulation -> stepBridge(actual v14 ECU & plant) -> raceRuntime.stepRace(bridgeFrame) -> event detector -> gameRuntime.dispatch -> campaign UI + R3F render`. The renderer MUST NOT create its own speed, torque or thermal status values. Display interpolation may be used between 20ms snapshots but does not change controller tick. Limit catch-up steps (e.g. <=5 ticks/frame), freeze on visibility/blur or pause; discard excess accumulator with explicit instrumentation to avoid huge time jumps. `requestAnimationFrame` frequency is not ECU tick. World collision is geometric in R3F and passed to `stepBridge(...,{collision:true})` and race engine once per actual contact (debounce), not per rendered frame.

Campaign state and ECU/physics state are separate; avoid serializing the entire v14 ECU closure into localStorage. Save JSON campaign snapshot at explicit checkpoint, including solved cases, evidence, selected hypotheses, and selected compiled preset, but not fabricated physical traces. On checkpoint load, invoke `bootToDrive()` then replay permitted deterministic scenario initial conditions; do NOT assign persisted UI speed directly into ECU.

## Scene transitions & campaign
Use `gameRuntime.dispatch` events only; button handlers cannot assign scene directly. See the reducer for recognized events, guards and errors. Main happy-path: TITLE -> PROLOGUE -> GARAGE -> GARAGE_L1..L4 -> GARAGE -> CHASE_NORMAL -> FAULT_1_CUE -> ASSIST_CHASE -> BOARD -> WIRING -> TWIN_BENCH -> REPAIR_OR_SAFE_LIMIT -> CHASE_RESUME -> FAULT_2_CUE -> BOARD -> WIRING -> TWIN_BENCH -> REPAIR_OR_SAFE_LIMIT -> OPTIONAL_FAULT_3 (accepted enters BOARD; skipped goes to SHIP_ESCAPE) -> SHIP_ESCAPE -> ENDING. On VERIFY_FAIL, return to evidence or wiring and rerun. No case automatically solves by collecting a single clue.

The optional brake case is hardware stuck friction brake; UI does not present software blocks as a repair. `CASES` is authority for roots, domains and physical/SW repair kind. Evidence is collected from signed-off fixed simulation event types; never unlock root cause merely because the card opens. Player can choose wrong hypothesis; contradiction and comparison keep progress recoverable.

## Trigger policy (to implement in game-web runtime glue)
- Propulsion fault cue at authored route trigger, only after initial garage tutorial + first chase. Store raw pedal/processed pedal/torque command/actual torque snapshots from *real bridge frames*.
- Thermal cue only after propulsion resolved and chase resumed; set motor thermal initial conditions from traceable scenario fixture. For fan stuck OFF, compare ECU commanded fan and plant response while parked tests. Do not treat thermal safety torque limit as the primary root cause if it is a downstream protective symptom.
- Brake optional choice may be skipped without locking ending. If accepted, follow board/wiring/bench/parked service before escape.
- Police capture: route failure to retry UI, keep discovered evidence and previously solved cases, reset chase risk/position/ECU plant by checkpoint boot; no infinite capture loops. Avoid injecting capture while paused.
- Ship finish only after both required cases solved and brake choice resolved. End shows independent driving performance and diagnostic method score. Never claim ASIL, HIL, OEM verification.

## Puzzle constraints
`COMPILE_WIRING` currently supports *constrained program presets* only. The future visual editor must validate port `signal kind`, unit, direction, and cycle policy, then compile into a supported preset; a generic block-graph interpreter is NOT implemented. For case propulsion the repaired selection `nominal` maps to `gatewayProcess` and actually changes the v14 bridge controller's torque. For hardware cases program is `inspect_only` and physical repair needs parked service, after trace oracle PASS. Wrong graphs produce actionable errors, not silent repair.

## Bench and safety
`runVerifiedBench(campaign)` is the supported application adapter. It re-runs identical initial-state variants using actual `runPairedTrace`, evaluates independent educational checks, and only then dispatches a verdict. Treat `BENCH_RESULT` payload as an internal trusted event — *not* public app/UI input: callers should never directly dispatch user-provided verdicts. For production app add runtime-private service boundary or signed result token to prevent UI spoofing. All bench threshold assumptions provisional educational examples, not vehicle compliance evidence. Distinguish FAIL, INCONCLUSIVE and MODEL_ERROR in UI; an internal exception is never player failure.

## Checkpoints + save + errors
Use explicit `RACE_CHECKPOINT` IDs from approved authored map, not arbitrary text from UI. LocalStorage operations are to be written by game-web; validate save via `restoreCampaign`; display migration/error message, no silent reset. `MODEL_ERROR` screen allows report and retry; resuming does not imply physical fault erased. On scene exit cleanup listeners, preserve evidence and program. Disable buttons while pending bench; run once idempotently per click.

## Performance and UI
Use React DOM overlays for legible card/puzzle text and R3F only where 3D inspection adds value. Target 16:9 PC, Pretendard with fallback and redistribution rights. Add keyboard/accessible alternatives to drag. Avoid long text blocking races and avoid pretend interactive objects. Map world lighting pastel, districts can be continuous or streamed while same chase state runs. No forced full cat skeleton animations.
