# TraceBack 05. Propulsion — educational torque supervision (v8)

## Scope and source audit

Pre-existing, preserved modules:
- `src/engineering/torqueModel.ts`: player-editable graph (pedal A/B correlation, freshness, gain, available torque `min`, permission, slew, output). Existing API unchanged. **Not yet unified** with this v8 runtime. Graph is the educational UI/model composition layer; do not claim that editing it automatically changes this new controller.
- `src/campaign/vehicleSystems.ts`: old simplified single-motor RWD drivetrain and brake/steering output, plus optional BMS/HV/VCU/Gear adapters. Existing signatures unchanged.
- `src/campaign/bmsModel.ts`: authoritative battery discharge ceiling in **kW**.
- `src/campaign/vehicleModeModel.ts`: VCU vehicle readiness, drive permit, DEGRADED torque fraction.
- `src/campaign/gearInterlockModel.ts`: independently confirmed actual D gear, not requested gear.
- `tests/vehicle-systems.test.mjs`, `tests/gear-interlock-educational.test.mjs`: previous tests preserved.

## New interfaces
`src/campaign/propulsionModel.ts` exports:
- `stepPropulsion(previous, input, dtSec=.02)` pure deterministic controller.
- `stepPropulsionPlant(previous, commandNm, dtSec=.02, stuck=false)` independent first-order motor-response toy plant.
- `propulsionInputFromDomains(base, bms, mode, gear)` authority adapter, no invented feedback.
- `INITIAL_PROPULSION_STATE`, `INITIAL_PROPULSION_PLANT`, `PROPULSION_CALIBRATION`, `DRIVER_DEMAND_SPEED_MAP`.
- `stepVehicleSystemsWithPropulsion(...)` is an **optional** vehicle adapter from `vehicleSystems.ts` and leaves existing functions intact.

### Input signals, units and source
| input | unit | role |
|--|--|--|
| `pedalA_pct`, `pedalB_pct` | % | independent driver input sensors, checked for agreement |
| `pedalAgeMs`, `motorFeedbackAgeMs` | ms | age/freshness, not timestamp |
| `brakePct` | % | brake override inhibits positive torque at >= 5% (fictional calibration) |
| `vehicleSpeedKmh` | km/h | driver torque-demand curve and reset safety |
| `motorSpeedRpm` | RPM | calculate `omega = rpm*2pi/60` in rad/s |
| `vehicleReady`, `driveAuthorized` | bool | VCU authoritative permission |
| `gearForwardConfirmed` | bool | confirmed actual D gear from Gear ECU |
| `bmsDischargeLimitKw` | kW | battery electrical power ceiling; not torque command |
| `bmsAvailable` | bool | authoritative permission from BMS |
| `vcuTorqueLimitScale` | 0–1 | VCU mode-based torque ceiling |
| `motorMaxTorqueNm` | Nm | motor torque envelope ceiling |
| `motorTemperatureC` | °C | motor derate limit |
| `observedMotorTorqueNm` | Nm | independent motor physical response; no commanded-value substitution |
| `resetRequested` | bool | fault reset request, requires stop+brake+valid sensors |

Outputs: `signals.pedalDemandNm`, `signals.targetNm`, `limits.motorNm/bmsPowerNm/temperatureNm/vcuNm/availableNm`, `command.motorTorqueNm`, `feedback.observedMotorTorqueNm/trackingErrorNm`, `diagnostics.limitReasons/faults`, `mode`, `state`.

## Controller flow (one tick = 20ms by default)

```
[Pedal A/B, age] -> Range / Freshness / Correlation -----+
                                                       | valid
[Vehicle speed] -----> Demand map (pedal*speed factor) --+---> Torque demand (Nm)
[Motor RPM] ----> rad/s ------+                           |
[BMS discharge kW] ------> POWER-to-TORQUE ceiling -------+---> MIN arbitration
[Motor max torque Nm] -----------------------------------+          |
[Motor temperature C] --> Derating ceiling --------------+          |
[VCU DEGRADED scale] --> Mode ceiling --------------------+          v
[VCU Ready, Gear confirmed D, Brake] --> Authority gate --> Rate limit / immediate inhibit
                                                                   |
                                                        ECU motor command (Nm)
                                                                   |
                                                  Independent motor plant (Nm)
                                                                   |
                                                      Measured feedback
                                                                   |
                                      Grace + tolerance + debounce -> fault latch
```

### Physics and deliberately simplified calibration
- `T_power_limit = P_discharge_kW * 1000 * efficiency / max(|omega|, omega_floor)`; sample 0.90 efficiency and 300 rpm numerical floor. A **fixed conservative envelope** is used at low speed, not real motor electromagnetic control.
- `T_target = min(T_driver, T_motor_limit, T_power_limit, T_temperature_limit, T_VCU_limit)`.
- Normal slew: rise 100 Nm/s; fall 180 Nm/s, 20 ms tick. Loss of authorization bypasses slew and commands zero immediately. **Actual motor torque can lag the command**, including after a shutdown request.
- Pedal difference <= 10 percentage-points and age <= 100 ms, motor feedback <=100 ms; entirely sample training calibrations, not OEM limits.
- The feedback monitor only evaluates sustained stable commands after 0.25 s of stability and then 0.30 s of continuing mismatch. This is *not* a complete FTTI / functional-safety strategy.
- `resetRequested` requires stopped <=0.5 km/h, brake >=5%, valid observations for 0.30 s. This latching policy is separate from the story's fictional rolling OTA recovery. **Do not silently bypass it.**
- `DRIVE` permission is only confirmed for D; no R drive torque model is fabricated.
- Speed-dependent driver map is tiny, normalized and fictional; inverter current, DC-link voltage under load, traction, battery transient response, gear ratio, motor efficiency map, time-varying friction, aerodynamic drag are not modeled by `stepPropulsion`.

## Game-specific split

**Player-visible short sentence fragments (only in the chosen propulsion fault):**
- `두 페달 센서가 일치하고 신호가 최신인가?`
- `READY이고 실제 기어가 D인가?`
- `브레이크 우선 조건이 없는가?`
- `요청 토크는 가용 상한을 넘지 않는다`
- `토크가 급격히 증가하지 않도록 제한한다`
- `모터 명령과 실제 응답이 일치하는가?`

**Internal calculations (not drag-and-drop by default):** sensor age sampling, speed map interpolation, kW-to-Nm translation, protective derating, time accumulation, debouncing, motor first-order response.

Use `case requirement -> observed clue -> suspect causal edge -> graph reconstruction -> same-input expected vs actual tests -> response verification` in the existing Memo Board / Logic Workbench / Twin Test Benches. All case evidence and exact expected outputs must come from one case specification, never separate hard-coded animations.

### Important missing link
The existing editable `TorqueModel` graph does **not** yet control `stepPropulsion` automatically. This v8 controller is a separately callable authoritative candidate, with an opt-in vehicle adapter. For the final game, explicitly design **one shared executable control graph or an approved graph-to-controller adapter**, then verify changing a player block changes the actual motor output. Do not create two independent competing sources of torque authority.

## API compatibility and known constraints
- Existing `stepVehicleSystems(...)`, `stepVehicleSystemsWithGear(...)`, and `TorqueModel.step(...)` signatures are unmodified.
- New `stepVehicleSystemsWithPropulsion(...)` uses caller-provided BMS, VCU and Gear results; it never derives permission from a game screen.
- This opt-in adapter replaces only the `drive` output with the propulsion calculation. The older simplified vehicle call still computes other outputs; do not use it as a fully synchronized plant or claim final BMS→HV→VCU→Gear→Propulsion integration is complete.
- Full game browser build and all UI tests are outside the scope of this patch; continue integration only after installing dependencies and running a full build.
