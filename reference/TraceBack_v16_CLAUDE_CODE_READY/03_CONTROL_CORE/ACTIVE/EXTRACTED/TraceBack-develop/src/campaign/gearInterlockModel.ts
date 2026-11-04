/** Gear selection, measured feedback and propulsion interlock for an educational BEV.
 * This is a supervisory model, not a mechanical transmission controller.
 * Request, ECU command and actual observed gear must remain separate.
 */
export type GearPosition = 'P'|'R'|'N'|'D'
export type GearFault = 'GEAR_INPUT_INVALID'|'GEAR_FEEDBACK_INVALID'|'GEAR_FEEDBACK_TIMEOUT'|'GEAR_UNCOMMANDED_CHANGE'
export type GearStage = 'STABLE'|'SHIFTING'|'FAULT'
export type GearInput = {
  requestedGear:GearPosition; observedGear:GearPosition;
  requestAgeMs:number; feedbackAgeMs:number;
  speedKmh:number; brakePct:number;
  vehicleReady:boolean; powerAvailable:boolean; interlockOk:boolean; blockingFault:boolean;
  resetRequested:boolean;
}
export type GearState = {
  /** Last requested command; never interpreted as confirmed physical engagement. */
  command:GearPosition;
  stage:GearStage;
  pendingSec:number;
  fault:GearFault|null;
  rejectedRequest:GearPosition|null;
}
export type GearOutput = {
  state:GearState;
  command:{targetGear:GearPosition;shiftRequested:boolean};
  feedback:{actualGear:GearPosition;confirmed:boolean};
  permissions:{driveAllowed:boolean;forwardAllowed:boolean;reverseAllowed:boolean;direction:0|1|-1};
  diagnostics:{requestValid:boolean;feedbackValid:boolean;fault:GearFault|null;blockedReason:string|null;stage:GearStage;commandFeedbackMatch:boolean};
}
export const GEAR_CALIBRATION = {
  maxSignalAgeMs:100, maxShiftSpeedKmh:1, minShiftBrakePct:5,
  maxFeedbackDelaySec:.4, maxResetSpeedKmh:.5,
} as const
export const INITIAL_GEAR_STATE:GearState = {command:'P',stage:'STABLE',pendingSec:0,fault:null,rejectedRequest:null}
const isGear=(v:unknown):v is GearPosition=>['P','R','N','D'].includes(v as string)
const validAge=(v:number)=>Number.isFinite(v)&&v>=0&&v<=GEAR_CALIBRATION.maxSignalAgeMs
function requestValid(i:GearInput){return isGear(i.requestedGear)&&validAge(i.requestAgeMs)}
function feedbackValid(i:GearInput){return isGear(i.observedGear)&&validAge(i.feedbackAgeMs)}
function otherValid(i:GearInput){return Number.isFinite(i.speedKmh)&&Number.isFinite(i.brakePct)&&i.brakePct>=0&&i.brakePct<=100&&Number.isFinite(i.requestAgeMs)&&Number.isFinite(i.feedbackAgeMs)
 && [i.vehicleReady,i.powerAvailable,i.interlockOk,i.blockingFault,i.resetRequested].every(x=>typeof x==='boolean')}
/**
 * Controller tick: no plant movement is inferred from commanded gear.
 * D/R/P engagement requires near-zero speed + brake; N is allowed at speed.
 * A refused shift preserves last observed gear and cannot bypass drive interlock.
 * A timeout or unsolicited feedback change latches a diagnostic fault.
 */
export function stepGearInterlock(previous:GearState,input:GearInput,dtSec=.02):GearOutput{
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_GEAR_DT')
 const reqOk=requestValid(input)&&otherValid(input), fbOk=feedbackValid(input)&&otherValid(input)
 let command=previous.command, stage=previous.stage, pendingSec=previous.pendingSec, fault=previous.fault
 let blockedReason:string|null=null, rejectedRequest:GearPosition|null=null
 const c=GEAR_CALIBRATION
 if(!reqOk||!fbOk){stage='FAULT';fault=!reqOk?'GEAR_INPUT_INVALID':'GEAR_FEEDBACK_INVALID';pendingSec=0}
 else if(stage==='FAULT'){
  const resetOk=input.resetRequested&&input.speedKmh<=c.maxResetSpeedKmh&&input.observedGear==='P'
   &&input.requestedGear==='P'&&!input.blockingFault&&input.interlockOk
  if(resetOk){stage='STABLE';command='P';pendingSec=0;fault=null}
  else blockedReason='FAULT_LATCHED'
 }else if(stage==='SHIFTING'){
  // If the plant reports a gear other than old/target, the signal is unexpected.
  if(input.observedGear===command){stage='STABLE';pendingSec=0}
  else {
   pendingSec+=dtSec
   if(pendingSec>c.maxFeedbackDelaySec){stage='FAULT';fault='GEAR_FEEDBACK_TIMEOUT';pendingSec=0}
   else if(input.requestedGear!==command)blockedReason='SHIFT_IN_PROGRESS'
  }
 }else {
  if(input.observedGear!==command){stage='FAULT';fault='GEAR_UNCOMMANDED_CHANGE';pendingSec=0}
  else if(input.requestedGear!==input.observedGear){
   const newGear=input.requestedGear
   const nearStopped=Math.abs(input.speedKmh)<=c.maxShiftSpeedKmh
   const brakePressed=input.brakePct>=c.minShiftBrakePct
   const engage=newGear!=='N'
   const allowed=(!engage||(nearStopped&&brakePressed))
    &&(newGear==='P'||newGear==='N'||(input.vehicleReady&&input.powerAvailable&&input.interlockOk&&!input.blockingFault))
   if(allowed){command=newGear;stage='SHIFTING';pendingSec=0}
   else {blockedReason=engage&&(!nearStopped||!brakePressed)?'SHIFT_SPEED_BRAKE_INTERLOCK':'SHIFT_POWER_OR_MODE_INTERLOCK';rejectedRequest=newGear}
  }
 }
 const confirmed=stage==='STABLE'&&fbOk&&input.observedGear===command&&!fault
 const propulsion=confirmed&&(command==='D'||command==='R')&&input.vehicleReady&&input.powerAvailable&&input.interlockOk&&!input.blockingFault
 const forwardAllowed=propulsion&&input.observedGear==='D',reverseAllowed=propulsion&&input.observedGear==='R'
 const state:GearState={command,stage,pendingSec,fault,rejectedRequest}
 return {state,command:{targetGear:command,shiftRequested:stage==='SHIFTING'},feedback:{actualGear:input.observedGear,confirmed},permissions:{driveAllowed:propulsion,forwardAllowed,reverseAllowed,direction:forwardAllowed?1:reverseAllowed?-1:0},diagnostics:{requestValid:reqOk,feedbackValid:fbOk,fault,blockedReason,stage,commandFeedbackMatch:command===input.observedGear}}
}
/** Educational gear-selector actuator: observed state moves after a delay unless stuck.
 * No physical gearbox model, parking pawl torque, or gear-clutch dynamics.
 */
export type GearPlant={actualGear:GearPosition;targetGear:GearPosition;elapsedSec:number}
export const INITIAL_GEAR_PLANT:GearPlant={actualGear:'P',targetGear:'P',elapsedSec:0}
export function stepGearPlant(previous:GearPlant,targetGear:GearPosition,dtSec=.02,stuck=false,delaySec=.08):GearPlant{
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1||!Number.isFinite(delaySec)||delaySec<0||!isGear(targetGear))throw Error('INVALID_GEAR_PLANT_INPUT')
 if(targetGear===previous.actualGear)return {...previous,targetGear,elapsedSec:0}
 const elapsedSec=(previous.targetGear===targetGear?previous.elapsedSec:0)+dtSec
 if(stuck)return {...previous,targetGear,elapsedSec}
 return elapsedSec>=delaySec?{actualGear:targetGear,targetGear,elapsedSec:0}:{...previous,targetGear,elapsedSec}
}
