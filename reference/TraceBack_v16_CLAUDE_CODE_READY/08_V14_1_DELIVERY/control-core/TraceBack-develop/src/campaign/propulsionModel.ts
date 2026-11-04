/** TraceBack educational BEV propulsion supervision, not a production torque controller.
 * Command, motor response and battery power ceilings have distinct ownership.
 * Pure fixed-step deterministic model; units are explicit and calibrations fictional.
 */
import type {BmsResult} from './bmsModel.ts'
import type {VehicleModeResult} from './vehicleModeModel.ts'
import type {GearOutput} from './gearInterlockModel.ts'

export type PropulsionFault='PEDAL_INVALID'|'DRIVE_AUTHORITY_LOST'|'MOTOR_FEEDBACK_MISMATCH'|'MOTOR_FEEDBACK_INVALID'
export type PropulsionInput={
 pedalA_pct:number;pedalB_pct:number;pedalAgeMs:number;
 brakePct:number;vehicleSpeedKmh:number;motorSpeedRpm:number;
 /** Independently evaluated system permissions; these MUST be derived from real BMS/VCU/Gear results. */
 vehicleReady:boolean;gearForwardConfirmed:boolean;driveAuthorized:boolean;
 motorMaxTorqueNm:number;motorTemperatureC:number;
 /** Battery discharge permission, not directly a torque or current command. */
 bmsDischargeLimitKw:number;bmsAvailable:boolean;
 /** VCU fallback fraction [0,1], e.g. DEGRADED: 0.25. */
 vcuTorqueLimitScale:number;
 /** Measured physical motor torque; NOT a copy of commanded torque. */
 observedMotorTorqueNm:number;motorFeedbackAgeMs:number;
 /** Explicit operator reset, only available at rest after fault clearance. */
 resetRequested:boolean;
}
export type PropulsionState={lastCommandNm:number;commandStableSec:number;mismatchSec:number;fault:PropulsionFault|null;recoverySec:number}
export type PropulsionResult={
 state:PropulsionState;mode:'ACTIVE'|'LIMITED'|'INHIBITED'|'FAULT';
 signals:{pedalValid:boolean;feedbackValid:boolean;pedalDemandNm:number;targetNm:number;motorSpeedRadS:number};
 limits:{motorNm:number;bmsPowerNm:number;temperatureNm:number;vcuNm:number;availableNm:number};
 command:{motorTorqueNm:number;driveAllowed:boolean};
 feedback:{observedMotorTorqueNm:number;trackingErrorNm:number;withinTolerance:boolean};
 diagnostics:{fault:PropulsionFault|null;faults:PropulsionFault[];limitReasons:string[];feedbackMismatchSec:number};
}
export const INITIAL_PROPULSION_STATE:PropulsionState={lastCommandNm:0,commandStableSec:0,mismatchSec:0,fault:null,recoverySec:0}
export const PROPULSION_CALIBRATION={
 pedalMaxDifferencePct:10,maxPedalAgeMs:100,maxFeedbackAgeMs:100,
 brakeOverridePct:5,nominalMotorTorqueNm:180,efficiency:0.90,
 /** Avoid division by zero at standstill: conservative fixed-speed power envelope. */
 motorSpeedFloorRpm:300,temperatureStartDerateC:75,temperatureZeroTorqueC:100,
 riseNmPerSec:100,normalFallNmPerSec:180,
 feedbackToleranceNm:15,feedbackToleranceFraction:0.15,feedbackGraceSec:0.25,
 mismatchConfirmSec:0.30,recoveryStableSec:0.30,maxResetSpeedKmh:0.5,
} as const
const clamp=(x:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,x))
function table(x:number,points:ReadonlyArray<readonly [number,number]>):number{
 if(x<=points[0][0])return points[0][1]
 for(let n=1;n<points.length;n++){const [x0,y0]=points[n-1],[x1,y1]=points[n];if(x<=x1)return y0+(y1-y0)*(x-x0)/(x1-x0)}
 return points[points.length-1][1]
}
/** Tiny educational driver-demand map: normalized torque per pedal (%) and speed (km/h). */
export const DRIVER_DEMAND_SPEED_MAP:ReadonlyArray<readonly [number,number]>=[[0,1],[30,1],[70,0.9],[110,0.75],[160,0.55]]
export function stepPropulsion(previous:PropulsionState,i:PropulsionInput,dtSec=.02):PropulsionResult{
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_PROPULSION_DT')
 const nums=[i.pedalA_pct,i.pedalB_pct,i.pedalAgeMs,i.brakePct,i.vehicleSpeedKmh,i.motorSpeedRpm,i.motorMaxTorqueNm,i.motorTemperatureC,i.bmsDischargeLimitKw,i.vcuTorqueLimitScale,i.observedMotorTorqueNm,i.motorFeedbackAgeMs]
 const numericValid=nums.every(Number.isFinite)
 const c=PROPULSION_CALIBRATION
 const pedalValid=numericValid&&i.pedalA_pct>=0&&i.pedalA_pct<=100&&i.pedalB_pct>=0&&i.pedalB_pct<=100&&i.pedalAgeMs>=0&&i.pedalAgeMs<=c.maxPedalAgeMs&&Math.abs(i.pedalA_pct-i.pedalB_pct)<=c.pedalMaxDifferencePct
 const feedbackValid=numericValid&&i.motorFeedbackAgeMs>=0&&i.motorFeedbackAgeMs<=c.maxFeedbackAgeMs
 const numericRangesValid=numericValid&&i.brakePct>=0&&i.brakePct<=100&&i.motorMaxTorqueNm>=0&&i.motorMaxTorqueNm<=1000&&i.bmsDischargeLimitKw>=0&&i.bmsDischargeLimitKw<=1000&&i.vcuTorqueLimitScale>=0&&i.vcuTorqueLimitScale<=1&&i.motorSpeedRpm>=0&&i.motorSpeedRpm<=30000&&i.vehicleSpeedKmh>=0&&i.vehicleSpeedKmh<=300&&i.motorTemperatureC>=-50&&i.motorTemperatureC<=180&&typeof i.vehicleReady==='boolean'&&typeof i.gearForwardConfirmed==='boolean'&&typeof i.driveAuthorized==='boolean'&&typeof i.bmsAvailable==='boolean'&&typeof i.resetRequested==='boolean'
 const faults:PropulsionFault[]=[]
 if(!pedalValid||!numericRangesValid)faults.push('PEDAL_INVALID')
 if(!feedbackValid)faults.push('MOTOR_FEEDBACK_INVALID')
 const motorNm=numericRangesValid?i.motorMaxTorqueNm:0
 const omega=numericRangesValid?i.motorSpeedRpm*2*Math.PI/60:0
 const powerNm=numericRangesValid?i.bmsDischargeLimitKw*1000*c.efficiency/Math.max(omega,c.motorSpeedFloorRpm*2*Math.PI/60):0
 const tempFraction=numericRangesValid?clamp((c.temperatureZeroTorqueC-i.motorTemperatureC)/(c.temperatureZeroTorqueC-c.temperatureStartDerateC),0,1):0
 const temperatureNm=i.motorTemperatureC<=c.temperatureStartDerateC?motorNm:motorNm*tempFraction
 const vcuNm=numericRangesValid?motorNm*i.vcuTorqueLimitScale:0
 const availableNm=Math.max(0,Math.min(motorNm,powerNm,temperatureNm,vcuNm))
 const demandNm=pedalValid?i.pedalA_pct/100*c.nominalMotorTorqueNm*table(i.vehicleSpeedKmh,DRIVER_DEMAND_SPEED_MAP):0
 const targetNm=Math.min(demandNm,availableNm)
 const limiting:string[]=[]
 if(powerNm<motorNm-1e-9)limiting.push('BMS_DISCHARGE_POWER')
 if(temperatureNm<motorNm-1e-9)limiting.push('MOTOR_TEMPERATURE')
 if(vcuNm<motorNm-1e-9)limiting.push('VCU_MODE')
 if(!i.bmsAvailable||!i.vehicleReady||!i.gearForwardConfirmed||!i.driveAuthorized)limiting.push('DRIVE_INTERLOCK')
 if(i.brakePct>=c.brakeOverridePct)limiting.push('BRAKE_OVERRIDE')
 const authority=numericRangesValid&&pedalValid&&feedbackValid&&i.bmsAvailable&&i.vehicleReady&&i.gearForwardConfirmed&&i.driveAuthorized&&i.brakePct<c.brakeOverridePct
 // Immediate cutoff bypasses the normal downward slew when drive is not permitted.
 const eligible=authority&&previous.fault===null&&faults.length===0
 const delta=targetNm-previous.lastCommandNm
 const slewRate=delta>=0?c.riseNmPerSec:c.normalFallNmPerSec
 let commandNm=eligible?clamp(previous.lastCommandNm+clamp(delta,-slewRate*dtSec,slewRate*dtSec),0,availableNm):0
 if(!Number.isFinite(commandNm))commandNm=0
 const commandStableSec=Math.abs(commandNm-previous.lastCommandNm)<=0.5?previous.commandStableSec+dtSec:0
 const errorNm=commandNm-i.observedMotorTorqueNm
 const toleranceNm=Math.max(c.feedbackToleranceNm,Math.abs(commandNm)*c.feedbackToleranceFraction)
 const withinTolerance=feedbackValid&&Number.isFinite(errorNm)&&Math.abs(errorNm)<=toleranceNm
 // Supervise sustained command/feedback deviation, not normal motor acceleration transients.
 const trackable=eligible&&commandStableSec>=c.feedbackGraceSec&&commandNm>c.feedbackToleranceNm
 const mismatchSec=trackable&&!withinTolerance?previous.mismatchSec+dtSec:0
 if(mismatchSec>=c.mismatchConfirmSec)faults.push('MOTOR_FEEDBACK_MISMATCH')
 let fault=previous.fault
 if(faults.includes('MOTOR_FEEDBACK_MISMATCH'))fault='MOTOR_FEEDBACK_MISMATCH'
 if(faults.includes('MOTOR_FEEDBACK_INVALID'))fault='MOTOR_FEEDBACK_INVALID'
 // Command is cut as soon as a diagnostic latches; no further torque is authorized by the state.
 if(fault!==null)commandNm=0
 const recoveryOk=fault!==null&&faults.length===0&&pedalValid&&feedbackValid&&i.resetRequested&&i.vehicleSpeedKmh<=c.maxResetSpeedKmh&&i.brakePct>=c.brakeOverridePct
 const recoverySec=recoveryOk?previous.recoverySec+dtSec:0
 if(recoveryOk&&recoverySec>=c.recoveryStableSec)fault=null
 const state:PropulsionState={lastCommandNm:commandNm,commandStableSec:fault===null?commandStableSec:0,mismatchSec:fault===null?mismatchSec:0,fault,recoverySec:fault===null?0:recoverySec}
 const driveAllowed=eligible&&fault===null
 const mode=fault!==null?'FAULT':!authority?'INHIBITED':limiting.some(reason=>reason!=='DRIVE_INTERLOCK')&&targetNm<demandNm-1e-6?'LIMITED':'ACTIVE'
 return{state,mode,signals:{pedalValid,feedbackValid,pedalDemandNm:demandNm,targetNm,motorSpeedRadS:omega},limits:{motorNm,bmsPowerNm:powerNm,temperatureNm,vcuNm,availableNm},command:{motorTorqueNm:driveAllowed?commandNm:0,driveAllowed},feedback:{observedMotorTorqueNm:i.observedMotorTorqueNm,trackingErrorNm:errorNm,withinTolerance},diagnostics:{fault,faults,limitReasons:limiting,feedbackMismatchSec:mismatchSec}}
}
/** Independent illustrative motor response; command must never be treated as measured torque. */
export type PropulsionPlant={actualTorqueNm:number}
export const INITIAL_PROPULSION_PLANT:PropulsionPlant={actualTorqueNm:0}
export function stepPropulsionPlant(previous:PropulsionPlant,commandNm:number,dtSec=.02,stuck=false):PropulsionPlant{
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1||!Number.isFinite(commandNm)||commandNm<0)throw Error('INVALID_PROPULSION_PLANT_INPUT')
 const alpha=clamp(dtSec/.12,0,1)
 return {actualTorqueNm:stuck?previous.actualTorqueNm:Math.max(0,previous.actualTorqueNm+(commandNm-previous.actualTorqueNm)*alpha)}
}
/** Public inputs from existing domain results, never guess readiness from the current game scene. */
export function propulsionInputFromDomains(base:Omit<PropulsionInput,'bmsDischargeLimitKw'|'bmsAvailable'|'vehicleReady'|'gearForwardConfirmed'|'driveAuthorized'|'vcuTorqueLimitScale'>,
 bms:BmsResult,mode:VehicleModeResult,gear:GearOutput):PropulsionInput{
 return {...base,bmsDischargeLimitKw:bms.limits.dischargeKw,bmsAvailable:bms.packAvailable,
  vehicleReady:mode.permissions.vehicleReady,driveAuthorized:mode.permissions.driveAllowed,
  gearForwardConfirmed:gear.permissions.forwardAllowed,vcuTorqueLimitScale:mode.requests.torqueLimitScale}
}
