/** Simplified educational HV connection controller and independently stepped electrical plant.
 * NOT a production contactor sequence or live-vehicle service procedure.
 * All measurements and feedbacks arrive from the caller: controller never invents a sensor response.
 */
export type HvMode = 'OFF'|'PRECHARGE'|'CONTACTOR_CLOSE'|'HV_READY'|'FAULT'
export type HvFaultCode='HV_SIGNAL_INVALID'|'HV_INTERLOCK_OPEN'|'HV_INSULATION_FAULT'|'HV_BMS_SHUTDOWN'|'HV_PACK_UNAVAILABLE'|'HV_PRECHARGE_FEEDBACK_TIMEOUT'|'HV_PRECHARGE_TIMEOUT'|'HV_MAIN_FEEDBACK_TIMEOUT'|'HV_MAIN_FEEDBACK_LOST'|'HV_CONTACTOR_STUCK_CLOSED'
export type HvInput={
 startPermit:boolean;stopRequested:boolean;resetRequested:boolean;packSafe:boolean;hvilOk:boolean;insulationOk:boolean;bmsShutdownRequested:boolean;
 packVoltageV:number;dcLinkVoltageV:number;prechargeFeedbackClosed:boolean;mainFeedbackClosed:boolean;signalAgeMs:number;vehicleSpeedKmh:number;
}
export type HvState={mode:HvMode;elapsedSec:number;fault:HvFaultCode|null;recoverySec:number}
export type HvResult={state:HvState;mode:HvMode;hvReady:boolean;commands:{prechargeClose:boolean;mainClose:boolean;shutdownRequested:boolean};feedback:{prechargeClosed:boolean;mainClosed:boolean;dcLinkVoltageV:number};prechargeRatio:number;faults:HvFaultCode[];diagnostics:{signalValid:boolean;preconditionsMet:boolean;prechargeComplete:boolean;mainFeedbackMatches:boolean;fault:HvFaultCode|null}}
export const INITIAL_HV_STATE:HvState={mode:'OFF',elapsedSec:0,fault:null,recoverySec:0}
export const HV_CALIBRATION={minPackVoltageV:200,maxPackVoltageV:500,maxSignalAgeMs:100,prechargeRatioRequired:.9,prechargeTimeoutSec:2,prechargeFeedbackTimeoutSec:.2,mainFeedbackTimeoutSec:.3,resetStableSec:.1,maxResetSpeedKmh:.5} as const
const isBool=(v:unknown):v is boolean=>typeof v==='boolean'
function validInput(i:HvInput){return [i.startPermit,i.stopRequested,i.resetRequested,i.packSafe,i.hvilOk,i.insulationOk,i.bmsShutdownRequested,i.prechargeFeedbackClosed,i.mainFeedbackClosed].every(isBool) &&
 [i.packVoltageV,i.dcLinkVoltageV,i.signalAgeMs,i.vehicleSpeedKmh].every(Number.isFinite)&&i.packVoltageV>=HV_CALIBRATION.minPackVoltageV&&i.packVoltageV<=HV_CALIBRATION.maxPackVoltageV&&i.dcLinkVoltageV>=0&&i.dcLinkVoltageV<=i.packVoltageV*1.1&&i.signalAgeMs>=0&&i.signalAgeMs<=HV_CALIBRATION.maxSignalAgeMs&&i.vehicleSpeedKmh>=0}
export function stepHv(previous:HvState,i:HvInput,dtSec=.02):HvResult{
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_HV_DT')
 const signalValid=validInput(i),c=HV_CALIBRATION
 const preconditionsMet=signalValid&&i.packSafe&&i.hvilOk&&i.insulationOk&&!i.bmsShutdownRequested
 const ratio=signalValid?i.dcLinkVoltageV/i.packVoltageV:0
 const complete=signalValid&&ratio>=c.prechargeRatioRequired
 let mode=previous.mode,elapsed=previous.elapsedSec+dtSec,fault=previous.fault,recoverySec=0
 const faults:HvFaultCode[]=[]
 // Fault priority is stable and independent of telemetry presentation.
 if(!signalValid)faults.push('HV_SIGNAL_INVALID')
 else {
  if(!i.hvilOk)faults.push('HV_INTERLOCK_OPEN')
  if(!i.insulationOk)faults.push('HV_INSULATION_FAULT')
  if(i.bmsShutdownRequested)faults.push('HV_BMS_SHUTDOWN')
  else if(!i.packSafe)faults.push('HV_PACK_UNAVAILABLE')
 }
 if(faults.length&&mode!=='FAULT'){mode='FAULT';fault=faults[0];elapsed=0}
 if(mode==='FAULT'){
  // Fault latch is released only on explicit stationary reset after healthy inputs and open contactors.
  const resetSafe=preconditionsMet&&!i.startPermit&&i.stopRequested&&i.resetRequested&&i.vehicleSpeedKmh<=c.maxResetSpeedKmh&&!i.mainFeedbackClosed&&!i.prechargeFeedbackClosed
  recoverySec=resetSafe?previous.recoverySec+dtSec:0
  if(resetSafe&&recoverySec>=c.resetStableSec){mode='OFF';fault=null;elapsed=0;recoverySec=0}
 }else if(mode==='OFF'){
  if(i.mainFeedbackClosed||i.prechargeFeedbackClosed){mode='FAULT';fault='HV_CONTACTOR_STUCK_CLOSED';elapsed=0}
  else if(preconditionsMet&&i.startPermit&&!i.stopRequested){mode='PRECHARGE';elapsed=0}
 }else if(i.stopRequested){mode='OFF';elapsed=0}
 else if(mode==='PRECHARGE'){
  if(i.mainFeedbackClosed){mode='FAULT';fault='HV_CONTACTOR_STUCK_CLOSED';elapsed=0}
  else if(!i.prechargeFeedbackClosed&&elapsed>c.prechargeFeedbackTimeoutSec){mode='FAULT';fault='HV_PRECHARGE_FEEDBACK_TIMEOUT';elapsed=0}
  else if(i.prechargeFeedbackClosed&&complete){mode='CONTACTOR_CLOSE';elapsed=0}
  else if(elapsed>c.prechargeTimeoutSec){mode='FAULT';fault='HV_PRECHARGE_TIMEOUT';elapsed=0}
 }else if(mode==='CONTACTOR_CLOSE'){
  if(i.mainFeedbackClosed){mode='HV_READY';elapsed=0}
  else if(elapsed>c.mainFeedbackTimeoutSec){mode='FAULT';fault='HV_MAIN_FEEDBACK_TIMEOUT';elapsed=0}
 }else if(mode==='HV_READY'){
  if(!i.mainFeedbackClosed){mode='FAULT';fault='HV_MAIN_FEEDBACK_LOST';elapsed=0}
 }
 const prechargeClose=mode==='PRECHARGE'||mode==='CONTACTOR_CLOSE'
 const mainClose=mode==='CONTACTOR_CLOSE'||mode==='HV_READY'
 const next:HvState={mode,elapsedSec:elapsed,fault,recoverySec}
 return {state:next,mode,hvReady:mode==='HV_READY'&&preconditionsMet&&i.mainFeedbackClosed,commands:{prechargeClose,mainClose,shutdownRequested:mode==='FAULT'},feedback:{prechargeClosed:!!i.prechargeFeedbackClosed,mainClosed:!!i.mainFeedbackClosed,dcLinkVoltageV:i.dcLinkVoltageV},prechargeRatio:ratio,faults:fault?[fault]:faults,diagnostics:{signalValid,preconditionsMet,prechargeComplete:complete,mainFeedbackMatches:mainClose===i.mainFeedbackClosed,fault}}
}
/** Toy plant: independently evolves actual contactor feedback and DC-link voltage from commands.
 * Its delay and RC-like response are illustrative. Never interpret as real HV specifications.
 */
export type HvPlantState={prechargeClosed:boolean;mainClosed:boolean;prechargeSwitchSec:number;mainSwitchSec:number;dcLinkVoltageV:number}
export type HvPlantFaults={prechargeStuckOpen?:boolean;mainStuckOpen?:boolean;mainWelded?:boolean;prechargeWelded?:boolean;noVoltageRise?:boolean}
export const INITIAL_HV_PLANT:HvPlantState={prechargeClosed:false,mainClosed:false,prechargeSwitchSec:0,mainSwitchSec:0,dcLinkVoltageV:0}
export function stepHvPlant(prev:HvPlantState,cmd:HvResult['commands'],packVoltageV:number,dt=.02,fail:HvPlantFaults={}):HvPlantState{
 if(!Number.isFinite(dt)||dt<=0||dt>.1||!Number.isFinite(packVoltageV)||packVoltageV<0)throw Error('INVALID_HV_PLANT_INPUT')
 const ps=cmd.prechargeClose?prev.prechargeSwitchSec+dt:0,ms=cmd.mainClose?prev.mainSwitchSec+dt:0
 const prechargeClosed=!!fail.prechargeWelded||(!fail.prechargeStuckOpen&&cmd.prechargeClose&&ps>=.04)
 const mainClosed=!!fail.mainWelded||(!fail.mainStuckOpen&&cmd.mainClose&&ms>=.04)
 const goal=mainClosed?packVoltageV:prechargeClosed&&!fail.noVoltageRise?packVoltageV:0
 const tau=mainClosed?.04:prechargeClosed&&!fail.noVoltageRise?.3:1.0
 const voltage=prev.dcLinkVoltageV+(goal-prev.dcLinkVoltageV)*(1-Math.exp(-dt/tau))
 return {prechargeClosed,mainClosed,prechargeSwitchSec:ps,mainSwitchSec:ms,dcLinkVoltageV:Math.max(0,voltage)}
}
