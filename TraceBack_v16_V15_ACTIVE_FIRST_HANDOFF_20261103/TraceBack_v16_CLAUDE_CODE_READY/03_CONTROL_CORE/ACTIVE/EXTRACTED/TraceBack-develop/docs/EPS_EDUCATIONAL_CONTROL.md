# TraceBack Steering / EPS — Educational Control Contract v10

## 0. Scope / ownership
- Applicable vehicle: mechanically linked front-wheel steering with electric power steering **assist**. Steering wheel input and mechanically linked front wheel angle remain handled by the existing vehicle model.
- `stepEps()` computes EPS motor **assist torque** and diagnostics. It does **not** compute wheel angle, self-aligning tire torque, rack force, driver steering feel, or production safety handling.
- `stepEpsPlant()` separately approximates an assist motor's dynamic output. Commands are *never* treated as measured feedback.
- `stepVehicleSystemsWithEps()` is an **opt-in** adapter; original `stepVehicleSystems` and all prior BMS/HV/VCU/Gear/Propulsion/Braking adapters remain unchanged.
- Game flow (investigation → logic workbench → twin bench → road) is not modified or connected in this update.

## 1. Signal contract
| Input | Unit | Meaning |
|---|---|---|
| driverTorqueNm | Nm, signed | independent steering wheel torque sensor, left/right sign |
| steeringAngleRad | rad | steering wheel angle used for validity only in EPS model, NOT front wheel angle |
| vehicleSpeedKmh | km/h | EPS speed scheduling |
| torqueSignalAgeMs / angleSignalAgeMs / speedSignalAgeMs | ms | individual input freshness |
| epsMotorTempC | °C | motor overtemperature and assist derating |
| motorCurrentLimitA | A | allowable motor-current magnitude |
| epsPowerAvailable | bool | separate LV / EPS power availability signal |
| observedAssistTorqueNm | Nm, signed | **plant-observed** motor assist torque |
| observedMotorCurrentA | A, signed | **plant-observed** motor current |
| feedbackAgeMs | ms | plant feedback freshness |
| resetRequested | bool | explicit latched-fault recovery request |
| dtSec | s | fixed-step controller sample duration, default 0.02 s |

| Output | Unit / type | Meaning |
|---|---|---|
| command.assistTorqueNm | Nm | requested EPS motor assist torque (signed) |
| command.motorCurrentRequestA | A | corresponding ECU motor-current request |
| command.assistEnabled | bool | controller active flag |
| feedback.observedAssistTorqueNm | Nm | reported plant observation, separate from command |
| feedback.trackingErrorNm | Nm | magnitude of command minus observed motor torque |
| limits.speedGain | Nm/Nm | interpolated representative assist schedule |
| limits.thermalScale | ratio | 0–1 derating factor |
| limits.currentTorqueLimitNm | Nm | permissible assist torque from current ceiling |
| mode | enum | AVAILABLE, LIMITED, INHIBITED, FAULT |
| diagnostics | enum / strings | input/feedback errors, sustained command tracking, overtemperature |

## 2. Algorithm / states
```text
Driver torque, steering angle, speed, temperature, current ceiling, power availability
  → physical range and signal age validation
  → power/thermal availability and fault latch
  → speed-scheduled assist map (low speed > high speed)
  → torque deadband and direction
  → minimum of assist maximum / motor current ceiling / thermal derating
  → non-fault rate limiter (Nm/s)
  → ECU assist torque / motor current request
  → independent simplified EPS motor plant
  → separate measured torque and current feedback
  → plausibility, freshness, tracking error debounce
  → fault latch / inhibited assist / standstill manual reset
```
- Educational calibration: speed gain map 0km/h→2.2, 30→1.8, 80→1.0, 130→0.6. Piecewise linear interpolation; hold end values.
- Signed assist request: `sign(driverTorque) × min(max(0, abs(driverTorque) − 0.15) × speedGain, availableAssistTorque)`, with further rate limits.
- 22 Nm educational maximum assist torque; 0.35 Nm/A current conversion; thermal derate from 75°C to 110°C; thermal fault at 125°C; all are *illustrative*.
- For invalid/stale control signals, unusable power, active latched fault, or overtemperature fault, ECU commands zero assist **immediately** instead of gradual comfort slew. Mechanical steering is not automatically disabled.
- Feedback current/torque plausibility uses the educational constant Nm/A relation; invalid feedback latches fault.
- Stable nonzero command with mismatched motor torque for 0.30 s latches tracking fault. Ordinary transient commands do not start the tracking timer.
- An active fault may clear only after valid inputs and feedback, near standstill (≤0.5km/h), near-zero driver torque, near-zero observed assist torque, explicit reset, and 0.4s of stable conditions.
- EPS state and the video game's RACING / INVESTIGATING / SIMULATING UI state must remain separate.

## 3. Representative acceptance tests
- Low vs high speed assist, interpolation boundaries; negative vs positive steering torque and neutral input.
- Temperature warm derating vs hard overtemperature inhibition; motor-current limiting.
- Stale / out-of-range sensors and feedback, exact input freshness boundary.
- Deterministic time step and comfort slew; error-triggered fast command inhibition.
- Motor plant lag, stuck motor, reduced effectiveness; command vs actual telemetry separation.
- Sustained mismatch fault and working-plant false-positive avoidance.
- Fault latch, stationary reset, moving reset denial.
- Opt-in adapter preserves legacy front wheel angle (`frontAngleRad`) and original `stepVehicleSystems` API.

## 4. Suggested game-visible sentence blocks
**Expose to player (sample, not connected yet):**
1. `조향 토크 센서 값이 유효한가?`
2. `차속이 높을수록 EPS 보조량을 줄인다`
3. `운전자 조향 방향과 보조 토크 방향을 일치시킨다`
4. `모터 전류와 온도 한도를 넘지 않는다`
5. `명령 보조 토크와 실제 토크가 일치하는가?`
6. `고장 시 보조 토크를 제한하거나 차단한다`

**Keep hidden/internally executed:** sample accumulation, interpolation numeric constants, current-to-torque approximate conversion, observation lag, debounce time, latched state recovery, independent actuator model. Game designers must choose a scenario where a block actually changes an executed result.

## 5. Scope limits / known integration gaps
- Physical steering wheel to front wheel angle remains the old simplified request-to-angle transformation, not steering torque-to-rack angle physical dynamics. The new EPS assist Nm is currently displayed at `vehicle.steering.assistNm` but is **not** fed into vehicle physics or steering effort/handling.
- Simulated motor current is calculated from torque with a constant coefficient; no PWM, FOC, friction, current-control loop, saturation dynamics, power supply droop, or motor thermal plant.
- Front wheel angle and steering assist torque cannot be treated as interchangeable units; no direct sum of Nm and rad.
- No true dual-channel angle/torque correlation sensor system, CAN bus model, AUTOSAR component breakdown, or certified ISO26262 safety analysis.
- Error/derating/recovery rules are simplified educational policies, not permitted in production vehicles without hazard analysis and specified safe-state semantics.
- `stepEpsPlant` is used explicitly in independent tests, not automatically stepped inside `stepVehicleSystemsWithEps`; caller owns plant timing and observation transport.
- This module has not been connected to the Stitch twin-test UI, logic-block editing interface, or the racing chase distance dynamics.
