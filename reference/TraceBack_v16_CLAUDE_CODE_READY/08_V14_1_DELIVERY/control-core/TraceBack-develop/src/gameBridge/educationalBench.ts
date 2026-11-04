/** Requirement-driven teaching oracles; reference trace is for visualization, never the oracle. */
import {runPairedTrace,type BridgeFrame} from './educationalGameBridge.ts';
export type Verdict='PASS'|'FAIL'|'INCONCLUSIVE'|'MODEL_ERROR';
export type RequirementResult={id:string;verdict:Verdict;actual:number|boolean|null;expected:string;tolerance?:number;reason:string};
export function evaluatePedalGateway(frame:BridgeFrame):RequirementResult{
 const {rawPedalPct,processedPedalPct}=frame.gateway;
 if(!Number.isFinite(rawPedalPct)||!Number.isFinite(processedPedalPct))return{id:'REQ-PROP-GW-01',verdict:'MODEL_ERROR',actual:null,expected:'valid finite inputs',reason:'invalid sensor values'};
 const deviation=Math.abs(rawPedalPct-processedPedalPct);
 return{id:'REQ-PROP-GW-01',verdict:deviation<=1e-9?'PASS':'FAIL',actual:deviation,expected:'raw pedal and processed pedal must agree within ±1e-9 percentage points',tolerance:1e-9,reason:'Fictional input gateway shall preserve validated pedal demand in nominal mode'};
}
export function evaluateFanTracking(frames:BridgeFrame[]):RequirementResult{
 if(frames.length<35)return{id:'REQ-THERM-FAN-01',verdict:'INCONCLUSIVE',actual:null,expected:'>= 35 ticks fan-on command window',reason:'not enough observations'};
 const recent=frames.slice(-35);
 if(!recent.every(f=>f.controller.ecu.thermal.command.fanOn))return{id:'REQ-THERM-FAN-01',verdict:'INCONCLUSIVE',actual:null,expected:'fan commanded on throughout observation window',reason:'fan command not continuously active'};
 const observed=recent.every(f=>f.controller.actual.fanOn);
 return{id:'REQ-THERM-FAN-01',verdict:observed?'PASS':'FAIL',actual:observed,expected:'actual fan ON when commanded continuously for 35 ticks',reason:'independent actuator feedback shall track fan command'};
}
export function evaluateBrakeResponse(frames:BridgeFrame[]):RequirementResult{
 if(!frames.length)return{id:'REQ-BRAKE-ACT-01',verdict:'INCONCLUSIVE',actual:null,expected:'braking trace',reason:'empty trace'};
 const f=frames.at(-1)!;
 const requested=f.controller.ecu.braking.command.frictionRequestN;
 const actual=f.controller.actual.frictionForceN;
 if(requested<=0)return{id:'REQ-BRAKE-ACT-01',verdict:'INCONCLUSIVE',actual:null,expected:'friction request positive',reason:'no friction braking requested'};
 const error=Math.abs(requested-actual);
 return{id:'REQ-BRAKE-ACT-01',verdict:error<=Math.max(50,requested*.1)?'PASS':'FAIL',actual:error,expected:'actual friction force tracks requested within max(50N, 10%) after settling',reason:'educational brake plant response check'};
}
export function runEducationalBench(caseId:'PROPULSION_GATEWAY'|'THERMAL_FAN'|'BRAKE_ACTUATOR'){
 const input=caseId==='PROPULSION_GATEWAY'?{fault:'pedal_gateway_underreport' as const,steps:70,pedalPct:60}:
 caseId==='THERMAL_FAN'?{fault:'cooling_fan_stuck_off' as const,steps:50,pedalPct:30,hotStartC:60}:
 {fault:'friction_actuator_stuck' as const,steps:75,pedalPct:0,brakePct:45};
 const paired=runPairedTrace(input);
 const oracle=caseId==='PROPULSION_GATEWAY'?(f:BridgeFrame[])=>evaluatePedalGateway(f.at(-1)!):
 caseId==='THERMAL_FAN'?evaluateFanTracking:evaluateBrakeResponse;
 return{caseId,dtSec:paired.dtSec,source:paired.source,results:Object.fromEntries(Object.entries(paired.results).map(([variant,trace])=>[variant,oracle(trace)])),trace:paired.records};
}
