/** TraceBack education-only thermal supervisor. Not OEM thermal calibration or certified safety logic.
 * Time is seconds. All temperatures are Celsius. Commands and observed actuator response are separate.
 */
export type ThermalMode='NORMAL'|'COOLING'|'DERATED'|'FAULT'
export type ThermalFault='INPUT_INVALID'|'FEEDBACK_INVALID'|'FAN_TRACKING'|'PUMP_TRACKING'|'CRITICAL_OVERTEMP'
export type ThermalInput={motorTempC:number;inverterTempC:number;batteryTempC:number;coolantTempC:number;ambientTempC:number;
 temperatureSignalAgeMs:number;fanObservedOn:boolean;pumpObservedPct:number;feedbackAgeMs:number;
 systemEnabled:boolean;vehicleSpeedKmh:number;resetRequested:boolean}
export type ThermalState={fanLatched:boolean;pumpLatched:boolean;fanMismatchSec:number;pumpMismatchSec:number;
 fault:ThermalFault|null;recoverySec:number}
export type ThermalResult={state:ThermalState;mode:ThermalMode;
 signals:{inputValid:boolean;feedbackValid:boolean;controlTempC:number;motorTempC:number;inverterTempC:number;batteryTempC:number;coolantTempC:number};
 command:{fanOn:boolean;pumpRequestPct:number;torqueLimitScale:number;shutdownRequested:boolean};
 feedback:{fanObservedOn:boolean;pumpObservedPct:number;fanMismatch:boolean;pumpMismatch:boolean};
 diagnostics:{fault:ThermalFault|null;activeFaults:ThermalFault[];limitReasons:string[];fanMismatchSec:number;pumpMismatchSec:number}}
export const THERMAL_CALIBRATION=Object.freeze({fanOnC:50,fanOffC:45,pumpOnC:40,pumpOffC:35,
 derateStartC:85,derateFullC:105,criticalC:110,minimumTorqueScale:.2,
 maxAgeMs:100,fanConfirmSec:.6,pumpConfirmSec:.6,pumpTolerancePct:15,pumpMinimumPct:30,
 recoveryStableSec:.5,resetMaxSpeedKmh:.5})
export const INITIAL_THERMAL_STATE:ThermalState=Object.freeze({fanLatched:false,pumpLatched:false,fanMismatchSec:0,pumpMismatchSec:0,fault:null,recoverySec:0})
const finite=(n:number)=>typeof n==='number'&&Number.isFinite(n)
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const TEMP_VALID=(v:number)=>finite(v)&&v>=-40&&v<=160
export function stepThermal(previous:ThermalState,input:ThermalInput,dtSec=.02):ThermalResult{
 if(!finite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_THERMAL_DT')
 const c=THERMAL_CALIBRATION
 const inputValid=[input.motorTempC,input.inverterTempC,input.batteryTempC,input.coolantTempC,input.ambientTempC].every(TEMP_VALID)&&
  finite(input.temperatureSignalAgeMs)&&input.temperatureSignalAgeMs>=0&&input.temperatureSignalAgeMs<=c.maxAgeMs&&
  finite(input.vehicleSpeedKmh)&&input.vehicleSpeedKmh>=0&&input.vehicleSpeedKmh<=300&&typeof input.systemEnabled==='boolean'&&typeof input.resetRequested==='boolean'
 const feedbackValid=typeof input.fanObservedOn==='boolean'&&finite(input.pumpObservedPct)&&input.pumpObservedPct>=0&&input.pumpObservedPct<=100&&
  finite(input.feedbackAgeMs)&&input.feedbackAgeMs>=0&&input.feedbackAgeMs<=c.maxAgeMs
 const controlTempC=inputValid?Math.max(input.motorTempC,input.inverterTempC,input.batteryTempC):0
 let fanLatched=previous.fanLatched,pumpLatched=previous.pumpLatched
 if(!inputValid||!input.systemEnabled){fanLatched=false;pumpLatched=false}
 else{
  // Inclusive thresholds, preserving the previous state in the deadband.
  if(controlTempC>=c.fanOnC)fanLatched=true
  else if(controlTempC<=c.fanOffC)fanLatched=false
  if(controlTempC>=c.pumpOnC)pumpLatched=true
  else if(controlTempC<=c.pumpOffC)pumpLatched=false
 }
 const pumpRequestPct=pumpLatched?(controlTempC>=75?100:controlTempC>=55?70:c.pumpMinimumPct):0
 const fanMismatch=feedbackValid&&input.systemEnabled&&fanLatched!==input.fanObservedOn
 const pumpMismatch=feedbackValid&&input.systemEnabled&&pumpRequestPct>0&&Math.abs(pumpRequestPct-input.pumpObservedPct)>c.pumpTolerancePct
 // Check the absence of response only after a settling window. Do not compare inactive outputs for tracking.
 const fanMismatchSec=fanMismatch?previous.fanMismatchSec+dtSec:0
 const pumpMismatchSec=pumpMismatch?previous.pumpMismatchSec+dtSec:0
 const activeFaults:ThermalFault[]=[]
 if(!inputValid)activeFaults.push('INPUT_INVALID')
 if(!feedbackValid)activeFaults.push('FEEDBACK_INVALID')
 if(inputValid&&controlTempC>=c.criticalC)activeFaults.push('CRITICAL_OVERTEMP')
 if(fanMismatchSec>=c.fanConfirmSec)activeFaults.push('FAN_TRACKING')
 if(pumpMismatchSec>=c.pumpConfirmSec)activeFaults.push('PUMP_TRACKING')
 let fault=previous.fault
 if(!fault&&activeFaults.length)fault=activeFaults[0]
 const healthy=inputValid&&feedbackValid&&activeFaults.length===0
 const safeForReset=inputValid&&controlTempC<=c.fanOffC&&input.vehicleSpeedKmh<=c.resetMaxSpeedKmh
 const recoverySec=fault&&healthy&&safeForReset&&input.resetRequested?previous.recoverySec+dtSec:0
 if(fault&&recoverySec>=c.recoveryStableSec)fault=null
 // Restrict output during a diagnostic failure; never treat a requested torque reduction as actual vehicle response.
 const rawScale=controlTempC<=c.derateStartC?1:clamp(1-(controlTempC-c.derateStartC)/(c.derateFullC-c.derateStartC)*(1-c.minimumTorqueScale),c.minimumTorqueScale,1)
 const torqueLimitScale=(!inputValid||fault)?0:rawScale
 const shutdownRequested=fault!==null
 const reasons:string[]=[]
 if(inputValid&&rawScale<1)reasons.push('THERMAL_TORQUE_DERATE')
 if(fault)reasons.push(`THERMAL_${fault}`)
 const mode:ThermalMode=fault?'FAULT':rawScale<1?'DERATED':fanLatched||pumpLatched?'COOLING':'NORMAL'
 return {state:{fanLatched,pumpLatched,fanMismatchSec,pumpMismatchSec,fault,recoverySec:fault?recoverySec:0},mode,
  signals:{inputValid,feedbackValid,controlTempC,motorTempC:input.motorTempC,inverterTempC:input.inverterTempC,batteryTempC:input.batteryTempC,coolantTempC:input.coolantTempC},
  command:{fanOn:inputValid&&input.systemEnabled&&fanLatched,pumpRequestPct:inputValid&&input.systemEnabled?pumpRequestPct:0,torqueLimitScale,shutdownRequested},
  feedback:{fanObservedOn:feedbackValid?input.fanObservedOn:false,pumpObservedPct:feedbackValid?input.pumpObservedPct:0,fanMismatch,pumpMismatch},
  diagnostics:{fault,activeFaults,limitReasons:reasons,fanMismatchSec,pumpMismatchSec}}
}
export type ThermalPlantState={actualFanOn:boolean;actualPumpPct:number;motorTempC:number;inverterTempC:number;batteryTempC:number;coolantTempC:number}
export const INITIAL_THERMAL_PLANT:ThermalPlantState=Object.freeze({actualFanOn:false,actualPumpPct:0,motorTempC:35,inverterTempC:35,batteryTempC:30,coolantTempC:30})
export type ThermalPlantFault={fanStuckOff?:boolean;pumpStuckOff?:boolean;fanStuckOn?:boolean;pumpEffectiveness?:number}
/** Independent educational response plant. Heating/cooling are °C/s, not a resolved coolant circuit. */
export function stepThermalPlant(previous:ThermalPlantState,command:Pick<ThermalResult['command'],'fanOn'|'pumpRequestPct'>,
 dtSec=.02,conditions:{ambientTempC?:number;heatLoadCPerSec?:number;fault?:ThermalPlantFault}={}):ThermalPlantState{
 if(!finite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_THERMAL_PLANT_DT')
 if(typeof command.fanOn!=='boolean'||!finite(command.pumpRequestPct)||command.pumpRequestPct<0||command.pumpRequestPct>100)throw Error('INVALID_THERMAL_PLANT_INPUT')
 const ambient=conditions.ambientTempC??25,heat=conditions.heatLoadCPerSec??.4,fx=conditions.fault??{}
 if(!TEMP_VALID(ambient)||!finite(heat)||heat<0||heat>8||!finite(fx.pumpEffectiveness??1)|| (fx.pumpEffectiveness??1)<0||(fx.pumpEffectiveness??1)>1)throw Error('INVALID_THERMAL_PLANT_INPUT')
 const actualFanOn=fx.fanStuckOn?true:fx.fanStuckOff?false:command.fanOn
 const targetPump=fx.pumpStuckOff?0:command.pumpRequestPct*(fx.pumpEffectiveness??1)
 const actualPumpPct=previous.actualPumpPct+clamp(targetPump-previous.actualPumpPct,-140*dtSec,140*dtSec)
 const effectiveness=(actualFanOn?.65:0)+(actualPumpPct/100)*1.2
 const update=(temp:number,load:number)=>{
  const excess=Math.max(0,temp-ambient)
  return clamp(temp+dtSec*(heat*load-effectiveness*excess*.07),-40,160)
 }
 return{actualFanOn,actualPumpPct,
  motorTempC:update(previous.motorTempC,1),inverterTempC:update(previous.inverterTempC,.8),
  batteryTempC:update(previous.batteryTempC,.45),coolantTempC:update(previous.coolantTempC,.4)}
}
/** Makes a valid initial observation from externally supplied vehicle and measured plant values. */
export function thermalInputFromVehicle(input:{motorTempC:number;inverterTempC:number;packTempC:number;speedKmh:number;signalAgeMs:number},
 observations:{ambientTempC:number;coolantTempC:number;fanObservedOn:boolean;pumpObservedPct:number;feedbackAgeMs:number;systemEnabled:boolean;resetRequested?:boolean}):ThermalInput{
 return{motorTempC:input.motorTempC,inverterTempC:input.inverterTempC,batteryTempC:input.packTempC,coolantTempC:observations.coolantTempC,
  ambientTempC:observations.ambientTempC,temperatureSignalAgeMs:input.signalAgeMs,fanObservedOn:observations.fanObservedOn,
  pumpObservedPct:observations.pumpObservedPct,feedbackAgeMs:observations.feedbackAgeMs,systemEnabled:observations.systemEnabled,
  vehicleSpeedKmh:input.speedKmh,resetRequested:observations.resetRequested??false}
}
