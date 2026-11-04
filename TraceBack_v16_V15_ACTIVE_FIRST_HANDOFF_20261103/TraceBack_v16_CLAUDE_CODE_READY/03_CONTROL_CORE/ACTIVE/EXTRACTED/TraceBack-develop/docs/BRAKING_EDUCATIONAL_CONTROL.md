# TraceBack v9 — Braking / regenerative–friction coordination (educational)

## Scope and architectural boundary
Source: `src/campaign/brakingModel.ts`. New fixed-step deterministic controller `stepBraking` and independent physical response mock `stepBrakePlant`. Legacy `stepVehicleSystems` and existing ABS/ESC implementations are left unchanged. `stepVehicleSystemsWithBraking` is an **opt-in adapter**, not proof that every game-loop caller uses the new controller. No UI or scenario data changed.

**Safety disclaimer:** This is not production brake-by-wire, ESC, ABS, EBD, emergency braking or a functional-safety-compliant controller. It must not control a real vehicle. Pedal-invalid handling in this model (zero demand and diagnostic) is not a defensible real-world fail-safe braking policy; a real system requires an independently designed, hazard-based mechanical/hydraulic fallback.

## Control flow

```text
pedal pct + freshness ──> validity ──> total force demand N ───┐
BMS charge ceiling kW ───┐                                      │
motor regen limit Nm ────┼─> speed-based regen availability N ──┤
HV / BMS / D confirmed ──┤                                      ├─> regen demand N
ABS intervention ────────┘                                      │   + friction remainder N
                                                               ↓
                                                    ECU force requests
                                                               ↓
                                   independent simulated motor + friction plants
                                                               ↓
                                 observed force and sustained deficit supervision
```

## Signals, dimensions, ownership
| Input | Unit | Meaning |
|---|---|---|
| `brakePedalPct` | % [0..100] | driver brake request measurement |
| `brakeSignalAgeMs`, `feedbackAgeMs` | ms | input/feedback freshness |
| `vehicleSpeedKmh` | km/h | for low-speed regen taper and wheel mechanical power |
| `motorSpeedRpm` | rpm | sanity-check input; simplified model uses vehicle speed for wheel power; no wheel/motor consistency check |
| `bmsChargeLimitKw` | kW | BMS battery charging power ceiling, not an actuator request |
| `motorRegenLimitNm` | Nm | motor shaft regenerative torque magnitude ceiling |
| `forwardGearConfirmed`,`hvReady`,`bmsAvailable` | boolean | available electrical regeneration permission |
| `absIntervention` | boolean | simplistic regeneration inhibit, not an ABS implementation |
| `observedRegenForceN`, `observedFrictionForceN` | N | independently observed wheel-longitudinal brake force magnitudes |
| `resetRequested` | boolean | explicit diagnostic reset request; requires speed <= 0.5 km/h and pedal at zero |

### Outputs
`signals.totalDemandN`, `command.regenRequestN`, `command.frictionRequestN`, `command.totalRequestN`, `command.regenMotorTorqueNm`, `limits.regenAvailableN`, `feedback.totalObservedN`, `feedback.deficitN`, `diagnostics.fault` and `diagnostics.limitReasons`. All requests are positive magnitudes. `regeneration` means deceleration, not a signed propulsion torque.

## Simplified calculations
`DemandN = 6000N * pedalPct / 100`.

`batteryRegenForceN = 1000 * BMS_ChargePowerLimit_kW / (vehicleSpeed_m_s * regenChargeEfficiency)` at speed >0. Divide-by-zero at standstill is prohibited.

`motorRegenForceN = regenTorqueLimitNm * gearRatio * drivetrainEfficiency / wheelRadius`.

`speedFactor = clamp((speedKmh-3)/(12-3),0,1)`.

`regenAvailableN = min(batteryRegenForceN,motorRegenForceN) * speedFactor` only when confirmed D, HV Ready, BMS available, no ABS intervention and inputs valid; otherwise 0.

`regenRequestN = min(DemandN,regenAvailableN)`; `frictionRequestN = DemandN - regenRequestN`.

By construction ECU request sum matches demand in valid cases. **This is NOT a guarantee that physical actuators provide the requested force.** `stepBrakePlant` uses independent first-order regen (0.08s) and friction (0.12s) illustrative response with injectable sticking. Control feedback is supplied from the prior independent plant tick, not synthesized from current command.

Diagnostics: sustained measured-force shortfall after command-stability grace and 0.30s debounce sets a latched diagnostic. Feedback freshness invalidity also latches. Reset requires cleared causes, <=0.5 km/h, no pedal request, explicit reset for >=0.40s. An error does not silently modify the friction fallback command. It reports a fault instead.

## Test matrix
Run `node --experimental-strip-types --test tests/braking-educational.test.mjs` with Node 22.16 (project declares >=22.18) or a supported Node setup. Cases cover normal blend, BMS charge limit/zero limit, low-speed taper/endpoints, ABS regen inhibit, HV and gear inhibitions, stale input/feedback, independent plant lag/stuck, deficit debounce and latch, safe reset, numeric robustness, BMS adapter, legacy system adapter.

## Game puzzle blocks (subset only)
- `브레이크 요구가 유효한가?`
- `BMS의 충전 허용 전력은 얼마인가?`
- `회생제동 가능량 = 모터·배터리·차속 제한 중 작은 값`
- `ABS 개입 중이면 회생제동을 제한한다`
- `요구 제동력에서 회생제동 담당분을 뺀 값을 마찰제동으로 보완한다`
- `명령과 실제 제동 응답을 비교한다`

Do NOT present all low-level plant calculations as player-editable software; use 5–7 focused blocks for optional third fault. The actual player-programmable graph runner and twin-bench UI are **not yet connected to this controller**.

## Known simplifications / integration blockers
1. Total wheel-longitudinal brake force only; no front/rear stability constraint, axle torque limitations, brake pressure model, ABS modulation, ESC, tire friction circle, slope, vehicle deceleration or stopping distance physics.
2. Motor speed input is checked but not used to infer wheel speed: fixed gear ratio and wheel radius are educational examples. Vehicle speed is used for power-to-force conversion.
3. Battery charge power to wheel braking force assumes constant efficiency 0.85; real motor/inverter/gearbox efficiency varies with speed, temperature and loading.
4. The `stepVehicleSystemsWithBraking` adapter replaces the legacy vehicle's brake force fields with requested (not measured) force, because the existing output type only holds command-side values. The independent `braking.feedback` object retains measured values. Do not infer observed force from `vehicle.brake.frictionN`.
5. Adapter leaves existing engine and vehicle torque logic untouched. For a full game loop, VCU and propulsion need consistent brake-override arbitration and ABS/ESC wheel allocation; this is NOT done yet.
6. The brake controller latches serious feedback-related faults, but the simple output does not implement a production fallback; game scripting must not depict incorrect braking behavior as safe.
7. Fault injection/repair is possible through plant `stuckRegen` and `stuckFriction`, but no new game events, evidence board content, OTA, or story screens were introduced.
8. Original game renderer/React app and full build cannot be verified without dependencies; legacy function and opt-in adapter regression tests were run.
