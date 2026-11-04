/** TraceBack educational electric power steering assist ECU.
 * NOT production EPS or a model of steering rack/tire dynamics.
 * EPS motor assist torque is separate from mechanical front-wheel angle.
 */
export type EpsFault = 'INPUT_INVALID'|'FEEDBACK_INVALID'|'ASSIST_TRACKING'|'OVERTEMPERATURE'
export type EpsMode = 'AVAILABLE'|'LIMITED'|'INHIBITED'|'FAULT'
export type EpsInput = {
 driverTorqueNm:number; steeringAngleRad:number; vehicleSpeedKmh:number;
 torqueSignalAgeMs:number; angleSignalAgeMs:number; speedSignalAgeMs:number;
 epsMotorTempC:number; motorCurrentLimitA:number; epsPowerAvailable:boolean;
 /** Independent plant telemetry, not aliases for ECU command. */
 observedAssistTorqueNm:number; observedMotorCurrentA:number; feedbackAgeMs:number;
 resetRequested:boolean;
}
export type EpsState = {
 lastAssistCommandNm:number; trackingSec:number; fault:EpsFault|null; recoverySec:number;
}
export type EpsResult = {
 state:EpsState;mode:EpsMode;
 signals:{inputValid:boolean;feedbackValid:boolean;driverTorqueNm:number;steeringAngleRad:number;vehicleSpeedKmh:number};
 limits:{speedGain:number;thermalScale:number;currentTorqueLimitNm:number;availableAssistNm:number};
 command:{assistTorqueNm:number;motorCurrentRequestA:number;assistEnabled:boolean};
 feedback:{observedAssistTorqueNm:number;observedMotorCurrentA:number;trackingErrorNm:number;withinTolerance:boolean};
 diagnostics:{fault:EpsFault|null;activeFaults:EpsFault[];limitReasons:string[];trackingSec:number};
}
export const EPS_CALIBRATION = {
 dtDefaultSec:.02, maxInputAgeMs:100,maxFeedbackAgeMs:100,
 speedGainMap:[{speedKmh:0,gain:2.2},{speedKmh:30,gain:1.8},{speedKmh:80,gain:1.0},{speedKmh:130,gain:.6}] as const,
 driverTorqueDeadbandNm:.15, maximumDriverTorqueNm:15, maxSteeringAngleRad:9,
 maximumAssistTorqueNm:22, torquePerMotorAmpNm:.35, assistRiseNmPerSec:100, assistFallNmPerSec:125,
 thermalLimitStartC:75,thermalInhibitC:110,thermalFaultC:125,
 feedbackAbsoluteToleranceNm:1.5,feedbackRelativeTolerance:.15,
 trackingConfirmSec:.3,recoveryStableSec:.4, resetSpeedKmh:.5,
} as const
export const INITIAL_EPS_STATE:EpsState={lastAssistCommandNm:0,trackingSec:0,fault:null,recoverySec:0}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
const finite=(...values:number[])=>values.every(Number.isFinite)
export function epsSpeedGain(speedKmh:number):number {
 if(!Number.isFinite(speedKmh))throw Error('INVALID_EPS_SPEED')
 const map=EPS_CALIBRATION.speedGainMap
 if(speedKmh<=map[0].speedKmh)return map[0].gain
 for(let i=1;i<map.length;i++){
  if(speedKmh<=map[i].speedKmh){const p=map[i-1],q=map[i];const f=(speedKmh-p.speedKmh)/(q.speedKmh-p.speedKmh);return p.gain+f*(q.gain-p.gain)}
 }
 return map[map.length-1].gain
}
/** Explicit dt in seconds, signals in Nm/rad/kmh/A/C, fixed-step state. */
export function stepEps(previous:EpsState,input:EpsInput,dtSec=.02):EpsResult {
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_EPS_DT')
 const c=EPS_CALIBRATION
 const inputValid=finite(input.driverTorqueNm,input.steeringAngleRad,input.vehicleSpeedKmh,input.torqueSignalAgeMs,input.angleSignalAgeMs,
  input.speedSignalAgeMs,input.epsMotorTempC,input.motorCurrentLimitA)&&typeof input.epsPowerAvailable==='boolean'&&typeof input.resetRequested==='boolean'&&
  Math.abs(input.driverTorqueNm)<=c.maximumDriverTorqueNm&&Math.abs(input.steeringAngleRad)<=c.maxSteeringAngleRad&&
  input.vehicleSpeedKmh>=0&&input.vehicleSpeedKmh<=300&&input.epsMotorTempC>=-40&&input.epsMotorTempC<=180&&
  input.motorCurrentLimitA>=0&&input.motorCurrentLimitA<=200&&
  [input.torqueSignalAgeMs,input.angleSignalAgeMs,input.speedSignalAgeMs].every(age=>age>=0&&age<=c.maxInputAgeMs)
 const feedbackValid=finite(input.observedAssistTorqueNm,input.observedMotorCurrentA,input.feedbackAgeMs)&&
  input.feedbackAgeMs>=0&&input.feedbackAgeMs<=c.maxFeedbackAgeMs&&
  Math.abs(input.observedAssistTorqueNm)<=c.maximumAssistTorqueNm*2&&Math.abs(input.observedMotorCurrentA)<=200&&
  Math.abs(input.observedAssistTorqueNm-input.observedMotorCurrentA*c.torquePerMotorAmpNm)<=
   Math.max(c.feedbackAbsoluteToleranceNm,Math.abs(input.observedAssistTorqueNm)*c.feedbackRelativeTolerance)
 const activeFaults:EpsFault[]=[]
 const reasons:string[]=[]
 if(!inputValid)activeFaults.push('INPUT_INVALID')
 if(!feedbackValid)activeFaults.push('FEEDBACK_INVALID')
 if(inputValid&&input.epsMotorTempC>=c.thermalFaultC)activeFaults.push('OVERTEMPERATURE')
 const thermalScale=inputValid?clamp((c.thermalInhibitC-input.epsMotorTempC)/(c.thermalInhibitC-c.thermalLimitStartC),0,1):0
 const speedGain=inputValid?epsSpeedGain(input.vehicleSpeedKmh):0
 const currentTorqueLimitNm=inputValid?input.motorCurrentLimitA*c.torquePerMotorAmpNm:0
 const availableAssistNm=Math.min(c.maximumAssistTorqueNm*thermalScale,currentTorqueLimitNm)
 if(thermalScale<1)reasons.push('THERMAL_ASSIST_LIMIT')
 if(currentTorqueLimitNm<c.maximumAssistTorqueNm*thermalScale)reasons.push('MOTOR_CURRENT_LIMIT')
 if(!input.epsPowerAvailable)reasons.push('EPS_POWER_INHIBIT')
 const suppress=!inputValid||!input.epsPowerAvailable||activeFaults.includes('OVERTEMPERATURE')||previous.fault!==null
 let targetNm=0
 if(!suppress){
  const effectiveTorque=Math.max(0,Math.abs(input.driverTorqueNm)-c.driverTorqueDeadbandNm)
  targetNm=Math.sign(input.driverTorqueNm)*Math.min(effectiveTorque*speedGain,availableAssistNm)
 }
 // Safety/integrity inhibition bypasses comfort slew. Normal and thermal-limit transitions are rate-limited.
 const commandNm=suppress?0:clamp(targetNm,
  previous.lastAssistCommandNm-c.assistFallNmPerSec*dtSec,
  previous.lastAssistCommandNm+c.assistRiseNmPerSec*dtSec)
 const commandStable=Math.abs(commandNm-previous.lastAssistCommandNm)<.001
 const trackingErrorNm=feedbackValid?Math.abs(commandNm-input.observedAssistTorqueNm):0
 const tolerance=Math.max(c.feedbackAbsoluteToleranceNm,Math.abs(commandNm)*c.feedbackRelativeTolerance)
 const withinTolerance=feedbackValid&&trackingErrorNm<=tolerance
 const trackable=inputValid&&feedbackValid&&input.epsPowerAvailable&&previous.fault===null&&
  commandStable&&Math.abs(commandNm)>c.feedbackAbsoluteToleranceNm
 const trackingSec=trackable&&!withinTolerance?previous.trackingSec+dtSec:0
 if(trackingSec>=c.trackingConfirmSec)activeFaults.push('ASSIST_TRACKING')
 let fault=previous.fault
 if(fault===null){
  if(activeFaults.includes('INPUT_INVALID'))fault='INPUT_INVALID'
  else if(activeFaults.includes('FEEDBACK_INVALID'))fault='FEEDBACK_INVALID'
  else if(activeFaults.includes('OVERTEMPERATURE'))fault='OVERTEMPERATURE'
  else if(activeFaults.includes('ASSIST_TRACKING'))fault='ASSIST_TRACKING'
 }
 const recoveryAllowed=fault!==null&&activeFaults.length===0&&inputValid&&feedbackValid&&
  input.resetRequested&&input.vehicleSpeedKmh<=c.resetSpeedKmh&&Math.abs(input.driverTorqueNm)<=c.driverTorqueDeadbandNm&&
  Math.abs(input.observedAssistTorqueNm)<=c.feedbackAbsoluteToleranceNm&&input.epsPowerAvailable
 const recoverySec=recoveryAllowed?previous.recoverySec+dtSec:0
 if(recoveryAllowed&&recoverySec>=c.recoveryStableSec)fault=null
 // Newly detected faults suppress current-cycle ECU output (diagnostics are not an actuator).
 const finalCommandNm=fault!==null?0:commandNm
 const state:EpsState={lastAssistCommandNm:finalCommandNm,trackingSec,fault,recoverySec:fault===null?0:recoverySec}
 const mode:EpsMode=fault!==null?'FAULT':!input.epsPowerAvailable?'INHIBITED':thermalScale<1||currentTorqueLimitNm<c.maximumAssistTorqueNm?'LIMITED':'AVAILABLE'
 return {state,mode,signals:{inputValid,feedbackValid,driverTorqueNm:inputValid?input.driverTorqueNm:0,
  steeringAngleRad:inputValid?input.steeringAngleRad:0,vehicleSpeedKmh:inputValid?input.vehicleSpeedKmh:0},
  limits:{speedGain,thermalScale,currentTorqueLimitNm,availableAssistNm},
  command:{assistTorqueNm:finalCommandNm,motorCurrentRequestA:finalCommandNm/c.torquePerMotorAmpNm,assistEnabled:fault===null&&inputValid&&input.epsPowerAvailable},
  feedback:{observedAssistTorqueNm:feedbackValid?input.observedAssistTorqueNm:0,
   observedMotorCurrentA:feedbackValid?input.observedMotorCurrentA:0,trackingErrorNm,withinTolerance},
  diagnostics:{fault,activeFaults,limitReasons:reasons,trackingSec}}
}
export type EpsPlant={actualAssistTorqueNm:number;actualMotorCurrentA:number}
export const INITIAL_EPS_PLANT:EpsPlant={actualAssistTorqueNm:0,actualMotorCurrentA:0}
/** Illustrative motor response; does not rotate the front wheels or model steering feel. */
export function stepEpsPlant(previous:EpsPlant,command:{assistTorqueNm:number},dtSec=.02,
 fault:{stuck?:boolean;effectiveness?:number}={}):EpsPlant {
 if(!finite(dtSec,previous.actualAssistTorqueNm,command.assistTorqueNm)||dtSec<=0||dtSec>.1||
  Math.abs(command.assistTorqueNm)>EPS_CALIBRATION.maximumAssistTorqueNm||
  (fault.effectiveness!==undefined&&(!Number.isFinite(fault.effectiveness)||fault.effectiveness<0||fault.effectiveness>1)))throw Error('INVALID_EPS_PLANT_INPUT')
 if(fault.stuck)return {...previous}
 const target=command.assistTorqueNm*(fault.effectiveness??1)
 const actual=previous.actualAssistTorqueNm+(target-previous.actualAssistTorqueNm)*clamp(dtSec/.08,0,1)
 return {actualAssistTorqueNm:actual,actualMotorCurrentA:actual/EPS_CALIBRATION.torquePerMotorAmpNm}
}
