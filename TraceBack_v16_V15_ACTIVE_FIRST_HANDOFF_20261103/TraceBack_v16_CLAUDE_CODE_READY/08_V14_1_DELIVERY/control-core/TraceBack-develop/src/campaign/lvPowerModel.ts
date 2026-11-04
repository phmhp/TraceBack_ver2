/** TraceBack educational 12 V distribution + DC/DC supervisor.
 * Not OEM calibration, service advice, or a safety-certified power supply controller.
 * Measurements, ECU commands and plant responses remain independent.
 * Simulation uses a fixed step in seconds; power W, voltage V, SOC percent.
 */
export type LvMode='OFF'|'SUPPLY'|'LIMITED'|'FAULT'
export type LvFault='INPUT_INVALID'|'FEEDBACK_INVALID'|'LV_UNDERVOLTAGE'|'DCDC_NO_RESPONSE'|'DCDC_OUTPUT_OUT_OF_RANGE'|'LV_CRITICAL'
export type LvInput={hvReady:boolean;lvVoltageV:number;lvBatterySocPct:number;lvLoadRequestW:number;
 dcdcHealthy:boolean;dcdcObservedActive:boolean;dcdcObservedVoltageV:number;
 signalAgeMs:number;feedbackAgeMs:number;vehicleSpeedKmh:number;resetRequested:boolean;
 /** These values are not measured by the controller; they are policy configuration, never automatic proof of supply. */
 criticalLoadRequestW:number}
export type LvState={fault:LvFault|null;underVoltageSec:number;noResponseSec:number;outputMismatchSec:number;recoverySec:number}
export type LvResult={state:LvState;mode:LvMode;
 signals:{inputValid:boolean;feedbackValid:boolean;lvVoltageV:number;lvBatterySocPct:number;lvLoadRequestW:number;criticalLoadRequestW:number;hvReady:boolean};
 commands:{dcdcEnable:boolean;targetVoltageV:number;suppliedLoadRequestW:number;loadShedRequest:boolean;noncriticalLoadAllowedW:number};
 feedback:{dcdcObservedActive:boolean;dcdcObservedVoltageV:number;lvVoltageObservedV:number;lvPowerAvailable:boolean};
 diagnostics:{fault:LvFault|null;activeFaults:LvFault[];limitReasons:string[];underVoltageSec:number;noResponseSec:number;outputMismatchSec:number}}
export const LV_CALIBRATION=Object.freeze({nominalV:13.8,minValidV:8,maxValidV:16.5,
 minimumOperationalV:11.4,criticalV:10.2,recoveryV:12.0,lowSocPct:25,criticalSocPct:8,
 maxLoadW:1800,dcdcCapacityW:1250,batterySupplementW:200,lowSocReserveW:80,
 maxSignalAgeMs:100,undervoltageConfirmSec:.4,noResponseConfirmSec:.5,outputConfirmSec:.5,
 outputToleranceV:1.2,recoveryStableSec:.5,resetMaxSpeedKmh:.5})
export const INITIAL_LV_STATE:LvState=Object.freeze({fault:null,underVoltageSec:0,noResponseSec:0,outputMismatchSec:0,recoverySec:0})
const finite=(v:number)=>typeof v==='number'&&Number.isFinite(v)
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v))
const safeNumber=(v:number)=>finite(v)?v:0
/** Deterministic independent supervisor: plant telemetry must come from a previous plant tick. */
export function stepLv(previous:LvState,input:LvInput,dtSec=.02):LvResult{
 if(!finite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_LV_DT')
 const c=LV_CALIBRATION
 const inputValid=typeof input.hvReady==='boolean'&&typeof input.dcdcHealthy==='boolean'&&typeof input.resetRequested==='boolean'&&
  finite(input.lvVoltageV)&&input.lvVoltageV>=c.minValidV&&input.lvVoltageV<=c.maxValidV&&
  finite(input.lvBatterySocPct)&&input.lvBatterySocPct>=0&&input.lvBatterySocPct<=100&&
  finite(input.lvLoadRequestW)&&input.lvLoadRequestW>=0&&input.lvLoadRequestW<=c.maxLoadW&&
  finite(input.criticalLoadRequestW)&&input.criticalLoadRequestW>=0&&input.criticalLoadRequestW<=input.lvLoadRequestW&&
  finite(input.signalAgeMs)&&input.signalAgeMs>=0&&input.signalAgeMs<=c.maxSignalAgeMs&&
  finite(input.vehicleSpeedKmh)&&input.vehicleSpeedKmh>=0&&input.vehicleSpeedKmh<=300
 const feedbackValid=typeof input.dcdcObservedActive==='boolean'&&finite(input.dcdcObservedVoltageV)&&
  input.dcdcObservedVoltageV>=0&&input.dcdcObservedVoltageV<=c.maxValidV&&
  finite(input.feedbackAgeMs)&&input.feedbackAgeMs>=0&&input.feedbackAgeMs<=c.maxSignalAgeMs
 const voltage=inputValid?input.lvVoltageV:0
 const requested=inputValid?input.lvLoadRequestW:0
 const critical=inputValid?input.criticalLoadRequestW:0
 // When HV is absent the 12 V battery still powers critical loads. A dead DC/DC is not proof of loss of LV bus.
 const dcdcEnable=inputValid&&input.hvReady&&input.dcdcHealthy
 const lowSoc=inputValid&&input.lvBatterySocPct<=c.lowSocPct
 const lowVoltage=inputValid&&voltage<c.minimumOperationalV
 const supplyCapacity=dcdcEnable?c.dcdcCapacityW+(lowSoc?c.lowSocReserveW:c.batterySupplementW):
  inputValid?(input.lvBatterySocPct<=c.criticalSocPct?c.lowSocReserveW:c.batterySupplementW):0
 const admitted=Math.min(requested,supplyCapacity)
 const priorityLoad=Math.min(critical,admitted)
 const noncriticalAllowed=Math.max(0,admitted-priorityLoad)
 const loadShedRequest=inputValid&&(admitted<requested||lowSoc||lowVoltage)
 // Demanded critical load exceeding capacity is a capacity shortfall, not silently "supplied".
 const suppliedLoadRequestW=inputValid?(loadShedRequest?priorityLoad+(lowVoltage||lowSoc?0:noncriticalAllowed):admitted):0
 const mismatch=inputValid&&feedbackValid&&dcdcEnable&&(!input.dcdcObservedActive)
 const outputMismatch=inputValid&&feedbackValid&&dcdcEnable&&input.dcdcObservedActive&&
  Math.abs(input.dcdcObservedVoltageV-c.nominalV)>c.outputToleranceV
 const underVoltageSec=lowVoltage?previous.underVoltageSec+dtSec:0
 const noResponseSec=mismatch?previous.noResponseSec+dtSec:0
 const outputMismatchSec=outputMismatch?previous.outputMismatchSec+dtSec:0
 const activeFaults:LvFault[]=[]
 if(!inputValid)activeFaults.push('INPUT_INVALID')
 if(!feedbackValid)activeFaults.push('FEEDBACK_INVALID')
 if(inputValid&&voltage<=c.criticalV)activeFaults.push('LV_CRITICAL')
 else if(underVoltageSec>=c.undervoltageConfirmSec)activeFaults.push('LV_UNDERVOLTAGE')
 if(noResponseSec>=c.noResponseConfirmSec)activeFaults.push('DCDC_NO_RESPONSE')
 if(outputMismatchSec>=c.outputConfirmSec)activeFaults.push('DCDC_OUTPUT_OUT_OF_RANGE')
 let fault=previous.fault
 if(!fault&&activeFaults.length)fault=activeFaults[0]
 const safeToReset=inputValid&&feedbackValid&&voltage>=c.recoveryV&&input.vehicleSpeedKmh<=c.resetMaxSpeedKmh&&
  !activeFaults.length
 const recoverySec=fault&&safeToReset&&input.resetRequested?previous.recoverySec+dtSec:0
 if(fault&&recoverySec>=c.recoveryStableSec)fault=null
 const commandEnabled=dcdcEnable&&fault===null
 const mode:LvMode=fault?'FAULT':!inputValid?'FAULT':!input.hvReady?'OFF':loadShedRequest?'LIMITED':'SUPPLY'
 const reasons:string[]=[]
 if(loadShedRequest)reasons.push('LV_LOAD_SHED')
 if(lowSoc)reasons.push('LV_LOW_SOC')
 if(lowVoltage)reasons.push('LV_LOW_VOLTAGE')
 if(inputValid&&input.hvReady&&!input.dcdcHealthy)reasons.push('DCDC_UNAVAILABLE')
 if(fault)reasons.push(`LV_${fault}`)
 // lvPowerAvailable reflects observed LV bus, not commanded DC/DC activation.
 return{state:{fault,underVoltageSec,noResponseSec,outputMismatchSec,recoverySec:fault?recoverySec:0},mode,
  signals:{inputValid,feedbackValid,lvVoltageV:voltage,lvBatterySocPct:inputValid?input.lvBatterySocPct:0,
   lvLoadRequestW:requested,criticalLoadRequestW:critical,hvReady:inputValid&&input.hvReady},
  commands:{dcdcEnable:commandEnabled,targetVoltageV:commandEnabled?c.nominalV:0,
   suppliedLoadRequestW:inputValid?suppliedLoadRequestW:0,loadShedRequest:loadShedRequest||fault!==null,
   noncriticalLoadAllowedW:inputValid&&!fault&&!lowVoltage&&!lowSoc?noncriticalAllowed:0},
  feedback:{dcdcObservedActive:feedbackValid?input.dcdcObservedActive:false,
   dcdcObservedVoltageV:feedbackValid?input.dcdcObservedVoltageV:0,lvVoltageObservedV:voltage,
   lvPowerAvailable:inputValid&&feedbackValid&&voltage>=c.minimumOperationalV&&fault===null},
  diagnostics:{fault,activeFaults,limitReasons:reasons,underVoltageSec,noResponseSec,outputMismatchSec}}
}
export type LvPlantState={lvVoltageV:number;lvBatterySocPct:number;dcdcActive:boolean;dcdcOutputVoltageV:number}
export const INITIAL_LV_PLANT:LvPlantState=Object.freeze({lvVoltageV:12.4,lvBatterySocPct:75,dcdcActive:false,dcdcOutputVoltageV:0})
export type LvPlantFault={dcdcStuckOff?:boolean;dcdcOverVoltage?:boolean;dcdcUnderVoltage?:boolean;openBattery?:boolean}
/** Educational low-order LV response; actual DCDC hardware is not instant/ideal. */
export function stepLvPlant(previous:LvPlantState,command:Pick<LvResult['commands'],'dcdcEnable'|'targetVoltageV'|'suppliedLoadRequestW'>,
 dtSec=.02,settings:{fault?:LvPlantFault;dcdcCapacityW?:number;externalLoadW?:number}={}):LvPlantState{
 if(!finite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_LV_PLANT_DT')
 const c=LV_CALIBRATION,fx=settings.fault??{}
 const demand=settings.externalLoadW??command.suppliedLoadRequestW
 const capacity=settings.dcdcCapacityW??c.dcdcCapacityW
 if(!finite(demand)||demand<0||demand>c.maxLoadW||!finite(capacity)||capacity<0||capacity>c.maxLoadW||
  !finite(command.targetVoltageV)||command.targetVoltageV<0||command.targetVoltageV>c.maxValidV||
  !finite(command.suppliedLoadRequestW)||command.suppliedLoadRequestW<0||command.suppliedLoadRequestW>c.maxLoadW||typeof command.dcdcEnable!=='boolean')throw Error('INVALID_LV_PLANT_INPUT')
 const dcdcActive=command.dcdcEnable&&!fx.dcdcStuckOff
 const target=dcdcActive?(fx.dcdcOverVoltage?15.8:fx.dcdcUnderVoltage?10.6:command.targetVoltageV):0
 const dcdcOutputVoltageV=previous.dcdcOutputVoltageV+clamp(target-previous.dcdcOutputVoltageV,-35*dtSec,35*dtSec)
 const batteryTarget=fx.openBattery?0:11.5+previous.lvBatterySocPct*.013
 // Battery sustains LV bus during DC/DC voltage ramp; output enable is not immediate regulated output.
 const sourceVoltage=dcdcActive?Math.max(dcdcOutputVoltageV,batteryTarget):batteryTarget
 const overload=dcdcActive?Math.max(0,demand-capacity):demand
 const busTarget=clamp(sourceVoltage-overload*.004,0,16.5)
 const lvVoltageV=previous.lvVoltageV+clamp(busTarget-previous.lvVoltageV,-8*dtSec,8*dtSec)
 const batteryPowerW=dcdcActive?Math.max(0,demand-capacity):demand
 const lvBatterySocPct=clamp(previous.lvBatterySocPct-batteryPowerW*dtSec/36000,0,100)
 return{lvVoltageV,lvBatterySocPct,dcdcActive,dcdcOutputVoltageV}
}
export function lvInputFromVehicle(vehicle:{speedKmh:number;signalAgeMs:number},sensors:{hvReady:boolean;lvVoltageV:number;lvBatterySocPct:number;
 lvLoadRequestW:number;criticalLoadRequestW:number;dcdcHealthy:boolean;dcdcObservedActive:boolean;dcdcObservedVoltageV:number;
 feedbackAgeMs:number;resetRequested?:boolean}):LvInput{
 return{...sensors,signalAgeMs:vehicle.signalAgeMs,vehicleSpeedKmh:Math.abs(vehicle.speedKmh),resetRequested:sensors.resetRequested??false}
}
