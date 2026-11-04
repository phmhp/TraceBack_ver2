/** Educational VCU operational-mode controller; independent from the game UI and HV contactor state.
 * Inputs are observed domain statuses, not inferred from player screen transitions.
 * Exactly one explicit tick advances time; no production ECU or safety certification is implied.
 */
import type {HvMode} from './hvModel.ts'
import type {BmsMode} from './bmsModel.ts'

export type VehicleMode = 'OFF'|'INIT'|'HV_PREPARING'|'READY'|'DRIVE'|'DEGRADED'|'FAULT'
export type VehicleModeFault = 'MODE_SIGNAL_INVALID'|'MODE_HV_FAULT'|'MODE_BMS_SHUTDOWN'|'MODE_CRITICAL_FAULT'|'MODE_HV_LOST'|'MODE_INIT_TIMEOUT'|'MODE_HV_TIMEOUT'
export type VehicleModeInput = {
  startEdge:boolean; stopEdge:boolean; resetRequested:boolean;
  gear:'P'|'N'|'D'|'R'; brakePct:number; speedKmh:number;
  plugged:boolean; signalAgeMs:number;
  initChecksOk:boolean; hvMode:HvMode; hvReady:boolean;
  bmsMode:BmsMode; packAvailable:boolean;
  recoverableFault:boolean; criticalFault:boolean;
}
export type VehicleModeState = {
  mode:VehicleMode; elapsedSec:number; recoverySec:number;
  fault:VehicleModeFault|null; degradedReturnTo:'READY'|'DRIVE'|null;
}
export type VehicleModeResult = {
  state:VehicleModeState; mode:VehicleMode;
  /** VCU intent; NOT proof of HV contactor status. */
  requests:{hvStartPermit:boolean;hvStopRequested:boolean;driveEnable:boolean;torqueLimitScale:number};
  /** True only if controller and independently observed HV/BMS agree. */
  permissions:{vehicleReady:boolean;driveAllowed:boolean;restrictedOperation:boolean};
  feedback:{hvMode:HvMode;hvReady:boolean;packAvailable:boolean;gear:VehicleModeInput['gear']};
  diagnostics:{signalValid:boolean;fault:VehicleModeFault|null;transition:{from:VehicleMode;to:VehicleMode}|null;blockedReason:string|null;recoverySec:number};
}
export const INITIAL_VEHICLE_MODE_STATE:VehicleModeState={mode:'OFF',elapsedSec:0,recoverySec:0,fault:null,degradedReturnTo:null}
export const VEHICLE_MODE_CALIBRATION={maxSignalAgeMs:100,minStartBrakePct:5,maxStopSpeedKmh:.5,initTimeoutSec:1,hvTimeoutSec:3,recoveryStableSec:.2,degradedTorqueScale:.25} as const
const validBool=(v:unknown):v is boolean=>typeof v==='boolean'
function validInput(i:VehicleModeInput):boolean{
 return [i.startEdge,i.stopEdge,i.resetRequested,i.plugged,i.initChecksOk,i.hvReady,i.packAvailable,i.recoverableFault,i.criticalFault].every(validBool)
  && ['P','N','D','R'].includes(i.gear)
  && ['OFF','PRECHARGE','CONTACTOR_CLOSE','HV_READY','FAULT'].includes(i.hvMode)
  && ['NORMAL','LIMITED','FAULT','SHUTDOWN_REQUEST'].includes(i.bmsMode)
  && [i.brakePct,i.speedKmh,i.signalAgeMs].every(Number.isFinite)
  && i.brakePct>=0&&i.brakePct<=100&&i.speedKmh>=0&&i.signalAgeMs>=0&&i.signalAgeMs<=VEHICLE_MODE_CALIBRATION.maxSignalAgeMs
  && (!i.hvReady||i.hvMode==='HV_READY');
}
/** State owner: VCU. The HV controller alone owns precharge/contactors; BMS owns pack limits. */
export function stepVehicleMode(previous:VehicleModeState,input:VehicleModeInput,dtSec=.02):VehicleModeResult{
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_VEHICLE_MODE_DT')
 const c=VEHICLE_MODE_CALIBRATION, signalValid=validInput(input)
 let mode=previous.mode, elapsed=previous.elapsedSec+dtSec, recoverySec=0
 let fault=previous.fault, degradedReturnTo=previous.degradedReturnTo
 let blockedReason:string|null=null
 const severe:VehicleModeFault|null=!signalValid?'MODE_SIGNAL_INVALID':input.criticalFault?'MODE_CRITICAL_FAULT':input.bmsMode==='SHUTDOWN_REQUEST'?'MODE_BMS_SHUTDOWN':input.hvMode==='FAULT'?'MODE_HV_FAULT':null
 if(severe&&mode!=='FAULT'){
  mode='FAULT';fault=severe;elapsed=0;degradedReturnTo=null
 }
 // A previously latched FAULT may be cleared only when stopped, P, clean inputs, HV OFF and explicit reset.
 if(mode==='FAULT'){
  const resetSafe=signalValid&&!severe&&!input.criticalFault&&!input.recoverableFault
    &&input.gear==='P'&&input.speedKmh<=c.maxStopSpeedKmh
    &&input.hvMode==='OFF'&&!input.hvReady&&input.stopEdge&&input.resetRequested
  recoverySec=resetSafe?previous.recoverySec+dtSec:0
  if(resetSafe&&recoverySec>=c.recoveryStableSec){mode='OFF';fault=null;elapsed=0;recoverySec=0}
 }else if(mode==='OFF'){
  if(input.startEdge){
   const startOk=input.gear==='P'&&input.brakePct>=c.minStartBrakePct&&!input.plugged
     &&input.packAvailable&&input.bmsMode!=='FAULT'&&input.hvMode==='OFF'&&!input.recoverableFault
   if(startOk){mode='INIT';elapsed=0}
   else blockedReason='START_INTERLOCK'
  }
 }else if(input.stopEdge&&input.speedKmh<=c.maxStopSpeedKmh){
  // A stopped vehicle may request shutdown; HV still acts independently on its own command and feedback.
  mode='OFF';elapsed=0;fault=null;degradedReturnTo=null
 }else if(mode==='INIT'){
  if(!input.packAvailable||input.bmsMode==='FAULT'||input.plugged){mode='FAULT';fault='MODE_CRITICAL_FAULT';elapsed=0}
  else if(input.initChecksOk){mode='HV_PREPARING';elapsed=0}
  else if(elapsed>c.initTimeoutSec){mode='FAULT';fault='MODE_INIT_TIMEOUT';elapsed=0}
 }else if(mode==='HV_PREPARING'){
  if(input.hvReady&&input.packAvailable){mode='READY';elapsed=0}
  else if(elapsed>c.hvTimeoutSec){mode='FAULT';fault='MODE_HV_TIMEOUT';elapsed=0}
 }else if(mode==='READY'){
  if(!input.hvReady||!input.packAvailable){mode='FAULT';fault='MODE_HV_LOST';elapsed=0}
  else if(input.recoverableFault){mode='DEGRADED';degradedReturnTo='READY';elapsed=0}
  else if(input.gear==='D'||input.gear==='R'){mode='DRIVE';elapsed=0}
 }else if(mode==='DRIVE'){
  if(!input.hvReady||!input.packAvailable){mode='FAULT';fault='MODE_HV_LOST';elapsed=0}
  else if(input.recoverableFault){mode='DEGRADED';degradedReturnTo='DRIVE';elapsed=0}
  else if((input.gear==='P'||input.gear==='N')&&input.speedKmh<=c.maxStopSpeedKmh){mode='READY';elapsed=0}
 }else if(mode==='DEGRADED'){
  if(!input.hvReady||!input.packAvailable){mode='FAULT';fault='MODE_HV_LOST';elapsed=0;degradedReturnTo=null}
  else {
   // No automatic full-torque jump while moving: explicit reset, stopped/P, healthy stable period.
   const recoverableCleared=!input.recoverableFault&&input.gear==='P'&&input.speedKmh<=c.maxStopSpeedKmh&&input.resetRequested
   recoverySec=recoverableCleared?previous.recoverySec+dtSec:0
   if(recoverableCleared&&recoverySec>=c.recoveryStableSec){mode='READY';elapsed=0;recoverySec=0;degradedReturnTo=null}
  }
 }
 const hvStartPermit=mode==='HV_PREPARING'
 const hvStopRequested=mode==='OFF'||mode==='FAULT'
 const readyPermission=(mode==='READY'||mode==='DRIVE'||mode==='DEGRADED')&&signalValid&&input.hvReady&&input.packAvailable&&!severe
 const driveAllowed=readyPermission&&(mode==='DRIVE'||mode==='DEGRADED')&&(input.gear==='D'||input.gear==='R')
 const state:VehicleModeState={mode,elapsedSec:elapsed,recoverySec,fault,degradedReturnTo}
 return {state,mode,requests:{hvStartPermit,hvStopRequested,driveEnable:driveAllowed,torqueLimitScale:mode==='DEGRADED'?c.degradedTorqueScale:driveAllowed?1:0},permissions:{vehicleReady:readyPermission,driveAllowed,restrictedOperation:mode==='DEGRADED'},feedback:{hvMode:input.hvMode,hvReady:input.hvReady,packAvailable:input.packAvailable,gear:input.gear},diagnostics:{signalValid,fault,transition:mode===previous.mode?null:{from:previous.mode,to:mode},blockedReason,recoverySec}}
}
