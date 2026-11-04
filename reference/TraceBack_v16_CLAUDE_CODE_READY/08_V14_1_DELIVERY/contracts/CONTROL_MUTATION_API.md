# Control mutation and scenario execution contract — v14.1

## Scope and implemented path
`08_V14_1_DELIVERY/control-core/TraceBack-develop/src/gameBridge/educationalGameBridge.ts` is an **executable teaching adapter**. The changeable `PedalGatewayProgram` lives upstream of existing v14 controller input, and affects both redundant pedal channels simultaneously for the *fictional input gateway calibration exercise*. It does **not** edit production ECU internals or bypass BMS/HV/brake override/diagnostic protections. This is a carefully labeled educational abstraction, not an exact demonstration of internal OEM software implementation.

`Driver -> gatewayProcess(raw pedal, activeProgram) -> existing stepIntegratedVehicle(previousControl, input) -> ECU command -> v14 motor/brake/thermal plant -> net force -> game velocity/heading/position -> next step speed measurement`. `measured` is last-tick plant output and `actual` is post-command, never substitute actual for earlier measured in a test.

Editable choices in demonstrated case 1: `nominal`, `underreport_45pct`. A wiring UI must compile validated block choices into this limited union, not `eval`, arbitrary JS, or caller-supplied coefficients. Blocks are executable only if they resolve to the nominated gateway option; other graph blocks are informational until an executor is implemented. UI must not assert general arbitrary node graph execution.

For thermal case 2: `cooling_fan_stuck_off` is **hardware actuator failure** applied at v14 `plantFaults.thermal.fanStuckOff`. Repair is `replace/restore fan` at parked checkpoint; a software condition change cannot clear a physically stuck fan. After a persistent diagnostic fault, recovery may require stop/reset and a new drive boot; reference/faulty/repaired paired traces intentionally compare fresh identical initial states, NOT in-drive magical repair. Diagnostics may stay latched.

For braking case 3: `friction_actuator_stuck` is a demonstration of a physical response failure; exploratory only. Do not compensate by illegally extending regen beyond charge limit. Preserve safe deceleration logic.

## Units and timing
- Main controller fixed dt = 0.02 s. Control speed input km/h = game m/s * 3.6. Motor RPM = (m/s / 0.425m) * 7 * 60/(2π).
- Net force N comes from *actual v14 plant response*. Game speed m/s integrates `(force - drag)/1500kg` each tick and clamps [0,45]; steering uses simplified player-angle yaw model, **EPS assistance torque is never wheel angle**.
- Collision is an arcade speed impulse; never feeds physical ECU impact sensors. Render interpolation and camera belong to Claude game's R3F host; never call control `step` per render frame.
- Host accumulator: accumulate elapsed time, cap to 0.1 s/frame; while >=0.02 and max 5 iterations, step 0.02 and subtract; pause must stop advancing. Clamp/interpolate snapshots. On lost focus, auto pause; do not simulate a giant skipped time.

## Trace contract
`runPairedTrace` deep-clones identical ready+drive control and game state, uses identical inputs and dt; outputs real executable `records`, not fabricated CSV. Reference and repaired intentionally share the same state where restored. `MODEL_ERROR` on invalid config, not player failure.

## Unimplemented
Generic graphical block executor and graph validation; runtime browser app, animation, route constraints/AI, final benchmark UI, persistence and owner-approved scoring. These must be built/validated by Claude Code. Current demonstrated bridge is runnable in Node and can be imported from TypeScript with supported toolchain.
