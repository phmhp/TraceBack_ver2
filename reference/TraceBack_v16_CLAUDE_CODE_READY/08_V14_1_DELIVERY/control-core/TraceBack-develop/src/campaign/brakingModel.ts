/** TraceBack educational BEV brake blending, NOT production brake-by-wire or ABS software.
 * Fixed-step deterministic model; positive magnitudes in N and kW.
 * Distinguishes demand, ECU requests, independent plant feedback, and diagnostics.
 */
import type {BmsResult} from './bmsModel.ts'
export type BrakeFault = 'BRAKE_INPUT_INVALID'|'BRAKE_FEEDBACK_INVALID'|'BRAKE_FORCE_DEFICIT'
export type BrakeInput = {
 brakePedalPct:number; brakeSignalAgeMs:number; vehicleSpeedKmh:number; motorSpeedRpm:number;
 /** Confirmed forward drive gear; regenerative braking is unavailable otherwise. */
 forwardGearConfirmed:boolean; hvReady:boolean; bmsAvailable:boolean;
 /** BMS permissible battery CHARGING power (regeneration), kW. */
 bmsChargeLimitKw:number; motorRegenLimitNm:number;
 /** Educational ABS request: forces regeneration off; real ABS wheel control is not simulated. */
 absIntervention:boolean;
 /** Independent measured total longitudinal brake forces, never copied from requests. */
 observedRegenForceN:number; observedFrictionForceN:number; feedbackAgeMs:number;
 resetRequested:boolean;
}
export type BrakeState={lastRegenRequestN:number;lastFrictionRequestN:number;trackingSec:number;fault:BrakeFault|null;recoverySec:number}
export type BrakeResult={
 state:BrakeState;mode:'READY'|'LIMITED'|'INHIBITED'|'FAULT';
 signals:{pedalValid:boolean;feedbackValid:boolean;totalDemandN:number;speedMs:number};
 limits:{bmsRegenForceN:number;motorRegenForceN:number;speedRegenFactor:number;regenAvailableN:number};
 command:{regenRequestN:number;frictionRequestN:number;totalRequestN:number;regenMotorTorqueNm:number};
 feedback:{observedRegenForceN:number;observedFrictionForceN:number;totalObservedN:number;deficitN:number;withinTolerance:boolean};
 diagnostics:{fault:BrakeFault|null;faults:BrakeFault[];limitReasons:string[];trackingSec:number};
}
export const INITIAL_BRAKE_STATE:BrakeState={lastRegenRequestN:0,lastFrictionRequestN:0,trackingSec:0,fault:null,recoverySec:0}
/** Fictional educational calibration; not an OEM setting or a safety-relevant vehicle design. */
export const BRAKE_CALIBRATION={maxSignalAgeMs:100,maxFeedbackAgeMs:100,
 maxDemandN:6000,regenGearRatio:7,drivetrainEfficiency:.90,wheelRadiusM:.425,
 lowSpeedRegenZeroKmh:3,lowSpeedRegenFullKmh:12,
 /** Motor generation mechanical power -> battery charging power, deliberately approximate. */
 regenChargeEfficiency:.85,motorSpeedFloorRpm:100,
 feedbackToleranceN:200,feedbackToleranceFraction:.12,
 feedbackGraceSec:.16,deficitConfirmSec:.30,recoveryStableSec:.40,resetSpeedKmh:.5,
 } as const
const clamp=(v:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,v))
export function stepBraking(previous:BrakeState,input:BrakeInput,dtSec=.02):BrakeResult {
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_BRAKE_DT')
 const c=BRAKE_CALIBRATION
 const numerical=[input.brakePedalPct,input.brakeSignalAgeMs,input.vehicleSpeedKmh,input.motorSpeedRpm,
  input.bmsChargeLimitKw,input.motorRegenLimitNm,input.observedRegenForceN,input.observedFrictionForceN,input.feedbackAgeMs]
 const finite=numerical.every(Number.isFinite)
 const inputValid=finite&&input.brakePedalPct>=0&&input.brakePedalPct<=100&&
  input.brakeSignalAgeMs>=0&&input.brakeSignalAgeMs<=c.maxSignalAgeMs&&
  input.vehicleSpeedKmh>=0&&input.vehicleSpeedKmh<=300&&input.motorSpeedRpm>=0&&input.motorSpeedRpm<=30000&&
  input.bmsChargeLimitKw>=0&&input.bmsChargeLimitKw<=1000&&
  input.motorRegenLimitNm>=0&&input.motorRegenLimitNm<=1000&&
  [input.forwardGearConfirmed,input.hvReady,input.bmsAvailable,input.absIntervention,input.resetRequested].every(v=>typeof v==='boolean')
 const feedbackValid=finite&&input.feedbackAgeMs>=0&&input.feedbackAgeMs<=c.maxFeedbackAgeMs&&
  input.observedRegenForceN>=0&&input.observedFrictionForceN>=0
 const faults:BrakeFault[]=[]
 if(!inputValid)faults.push('BRAKE_INPUT_INVALID')
 if(!feedbackValid)faults.push('BRAKE_FEEDBACK_INVALID')
 const totalDemandN=inputValid?input.brakePedalPct/100*c.maxDemandN:0
 const speedMs=inputValid?input.vehicleSpeedKmh/3.6:0
 const speedRegenFactor=inputValid?clamp((input.vehicleSpeedKmh-c.lowSpeedRegenZeroKmh)/(c.lowSpeedRegenFullKmh-c.lowSpeedRegenZeroKmh),0,1):0
 const reason:string[]=[]
 // Battery charge power is an input LIMIT, not a command. Use wheel mechanical force power
 // mapped to battery charging power with a deliberately constant charging efficiency.
 const bmsRegenForceN=inputValid&&speedMs>0?input.bmsChargeLimitKw*1000/(speedMs*c.regenChargeEfficiency):0
 const motorRegenForceN=inputValid?input.motorRegenLimitNm*c.regenGearRatio*c.drivetrainEfficiency/c.wheelRadiusM:0
 const powertrainCanRegen=inputValid&&input.forwardGearConfirmed&&input.hvReady&&input.bmsAvailable&&!input.absIntervention
 const regenAvailableN=powertrainCanRegen?Math.max(0,Math.min(bmsRegenForceN,motorRegenForceN)*speedRegenFactor):0
 if(inputValid){
  if(input.bmsChargeLimitKw===0)reason.push('BMS_CHARGE_LIMIT')
  else if(bmsRegenForceN<motorRegenForceN&&speedRegenFactor>0)reason.push('BMS_CHARGE_LIMIT')
  if(speedRegenFactor<1)reason.push('LOW_SPEED_REGEN_LIMIT')
  if(input.absIntervention)reason.push('ABS_REGEN_INHIBIT')
  if(!input.forwardGearConfirmed||!input.hvReady||!input.bmsAvailable)reason.push('REGEN_INTERLOCK')
 }
 // Fail conservative in this educational model: no regeneration on invalid inputs.
 // A real safety brake system needs independent mechanical/hydraulic fallback design.
 const regenRequestN=inputValid?Math.min(totalDemandN,regenAvailableN):0
 // Friction must complement the remaining requested force even when regeneration is inhibited.
 const frictionRequestN=inputValid?Math.max(0,totalDemandN-regenRequestN):0
 const totalRequestN=regenRequestN+frictionRequestN
 const regenMotorTorqueNm=regenRequestN*c.wheelRadiusM/(c.regenGearRatio*c.drivetrainEfficiency)
 const observedRegenForceN=feedbackValid?input.observedRegenForceN:0
 const observedFrictionForceN=feedbackValid?input.observedFrictionForceN:0
 const totalObservedN=observedRegenForceN+observedFrictionForceN
 const deficitN=Math.max(0,totalDemandN-totalObservedN)
 const toleranceN=Math.max(c.feedbackToleranceN,totalDemandN*c.feedbackToleranceFraction)
 const withinTolerance=feedbackValid&&deficitN<=toleranceN
 // Do not diagnose normal actuator transients as a sustained brake deficit.
 const commandStable=Math.abs(regenRequestN-previous.lastRegenRequestN)<=1&&
  Math.abs(frictionRequestN-previous.lastFrictionRequestN)<=1
 const trackable=inputValid&&feedbackValid&&totalDemandN>c.feedbackToleranceN&&commandStable
 const trackingSec=trackable&&!withinTolerance?previous.trackingSec+dtSec:0
 if(trackingSec>=c.deficitConfirmSec)faults.push('BRAKE_FORCE_DEFICIT')
 let fault=previous.fault
 if(fault===null){
  if(faults.includes('BRAKE_INPUT_INVALID'))fault='BRAKE_INPUT_INVALID'
  else if(faults.includes('BRAKE_FEEDBACK_INVALID'))fault='BRAKE_FEEDBACK_INVALID'
  else if(faults.includes('BRAKE_FORCE_DEFICIT'))fault='BRAKE_FORCE_DEFICIT'
 }
 const recoveryAllowed=fault!==null&&faults.length===0&&input.resetRequested&&input.vehicleSpeedKmh<=c.resetSpeedKmh&&
  input.brakePedalPct===0&&feedbackValid
 const recoverySec=recoveryAllowed?previous.recoverySec+dtSec:0
 if(recoveryAllowed&&recoverySec>=c.recoveryStableSec)fault=null
 const state:BrakeState={lastRegenRequestN:regenRequestN,lastFrictionRequestN:frictionRequestN,trackingSec,fault,recoverySec:fault===null?0:recoverySec}
 const mode=fault!==null?'FAULT':!inputValid?'INHIBITED':regenRequestN<totalDemandN&&powertrainCanRegen?'LIMITED':'READY'
 return {state,mode,signals:{pedalValid:inputValid,feedbackValid,totalDemandN,speedMs},
  limits:{bmsRegenForceN,motorRegenForceN,speedRegenFactor,regenAvailableN},
  command:{regenRequestN,frictionRequestN,totalRequestN,regenMotorTorqueNm},
  feedback:{observedRegenForceN,observedFrictionForceN,totalObservedN,deficitN,withinTolerance},
  diagnostics:{fault,faults,limitReasons:reason,trackingSec}}
}
/** Illustrative actuators: separate regenerative motor and friction brake response.
 * `stuckRegen` and `stuckFriction` enable independent hardware fault injection.
 */
export type BrakePlant={actualRegenForceN:number;actualFrictionForceN:number}
export const INITIAL_BRAKE_PLANT:BrakePlant={actualRegenForceN:0,actualFrictionForceN:0}
export function stepBrakePlant(previous:BrakePlant,command:{regenRequestN:number;frictionRequestN:number},dtSec=.02,
 faults:{stuckRegen?:boolean;stuckFriction?:boolean}={}):BrakePlant {
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1||
  !Number.isFinite(command.regenRequestN)||!Number.isFinite(command.frictionRequestN)||
  command.regenRequestN<0||command.frictionRequestN<0)throw Error('INVALID_BRAKE_PLANT_INPUT')
 const regenAlpha=clamp(dtSec/.08,0,1),frictionAlpha=clamp(dtSec/.12,0,1)
 return {actualRegenForceN:faults.stuckRegen?previous.actualRegenForceN:previous.actualRegenForceN+(command.regenRequestN-previous.actualRegenForceN)*regenAlpha,
  actualFrictionForceN:faults.stuckFriction?previous.actualFrictionForceN:previous.actualFrictionForceN+(command.frictionRequestN-previous.actualFrictionForceN)*frictionAlpha}
}
export function brakeInputFromBms(base:Omit<BrakeInput,'bmsChargeLimitKw'|'bmsAvailable'>,bms:BmsResult):BrakeInput {
 return {...base,bmsChargeLimitKw:bms.limits.chargeKw,bmsAvailable:bms.packAvailable}
}
