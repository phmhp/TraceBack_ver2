/** Educational signal and actuator diagnostics. Deterministic, dt-driven, not an ISO 14229 DTC manager. */
export type DiagnosticFault = 'RANGE'|'TIMEOUT'|'MESSAGE_INVALID'|'PLAUSIBILITY'|'TRACKING';
export type DiagnosticSeverity = 'WARNING'|'LIMIT'|'BLOCK';
export type DiagnosticPolicy = 'NONE'|'LIMIT_FUNCTION'|'INHIBIT_FUNCTION';
export type DiagnosticChannelConfig = {
 id:string; source:'SENSOR'|'CAN'|'ACTUATOR'; units:string;
 min:number; max:number; maxAgeMs:number;
 debounceSec:number; recoverySec:number; severity:DiagnosticSeverity;
 plausibility?:{peerId:string; maxDifference:number};
 tracking?:{commandId:string; maxDifference:number; settlingSec:number};
 latch?:boolean;
};
export type DiagnosticObservation = {id:string; value:number; ageMs:number; messageValid:boolean};
export type DiagnosticInput = {observations:DiagnosticObservation[]; resetRequested?:boolean; resetPermitted?:boolean};
export type ChannelDiagnosticState = {fault:DiagnosticFault|null; pendingSec:number; healthySec:number; settledSec:number; occurrences:number;};
export type DiagnosticState = {channels:Record<string,ChannelDiagnosticState>};
export type DiagnosticEvent = {channelId:string; fault:DiagnosticFault; severity:DiagnosticSeverity; active:boolean; occurrences:number; source:string};
export type DiagnosticResult = {state:DiagnosticState; signals:Record<string,{valid:boolean;value:number|null;reason:DiagnosticFault|null}>; events:DiagnosticEvent[]; policy:DiagnosticPolicy; request:{limitFunction:boolean; inhibitFunction:boolean}; diagnosticIds:string[]};
export const INITIAL_DIAGNOSTIC_STATE:DiagnosticState={channels:{}};
const healthyState=():ChannelDiagnosticState=>({fault:null,pendingSec:0,healthySec:0,settledSec:0,occurrences:0});
const failure=(channel:DiagnosticChannelConfig,obs:DiagnosticObservation|undefined,byId:Map<string,DiagnosticObservation>,elapsed:number):DiagnosticFault|null=>{
 if(!obs||!obs.messageValid)return 'MESSAGE_INVALID';
 if(!Number.isFinite(obs.ageMs)||obs.ageMs<0||obs.ageMs>channel.maxAgeMs)return 'TIMEOUT';
 if(!Number.isFinite(obs.value)||obs.value<channel.min||obs.value>channel.max)return 'RANGE';
 if(channel.plausibility){const peer=byId.get(channel.plausibility.peerId);
  if(!peer||!peer.messageValid||!Number.isFinite(peer.value)||!Number.isFinite(peer.ageMs)||peer.ageMs<0||peer.ageMs>channel.maxAgeMs)return 'PLAUSIBILITY';
  if(Math.abs(obs.value-peer.value)>channel.plausibility.maxDifference)return 'PLAUSIBILITY';
 }
 if(channel.tracking&&elapsed>=channel.tracking.settlingSec){const command=byId.get(channel.tracking.commandId);
  if(!command||!command.messageValid||!Number.isFinite(command.value)||!Number.isFinite(command.ageMs)||command.ageMs<0||command.ageMs>channel.maxAgeMs)return 'TRACKING';
  if(Math.abs(obs.value-command.value)>channel.tracking.maxDifference)return 'TRACKING';
 }
 return null;
};
export function validateDiagnosticConfig(configs:DiagnosticChannelConfig[]):void{
 const ids=new Set<string>();
 for(const c of configs){
  if(!c.id||ids.has(c.id)||!c.units||!['SENSOR','CAN','ACTUATOR'].includes(c.source)||!['WARNING','LIMIT','BLOCK'].includes(c.severity)||![c.min,c.max,c.maxAgeMs,c.debounceSec,c.recoverySec].every(Number.isFinite)||c.min>c.max||c.maxAgeMs<0||c.debounceSec<0||c.recoverySec<0)throw Error(`INVALID_DIAGNOSTIC_CONFIG:${c.id}`);
  if(c.plausibility&&(!c.plausibility.peerId||!Number.isFinite(c.plausibility.maxDifference)||c.plausibility.maxDifference<0))throw Error(`INVALID_DIAGNOSTIC_CONFIG:${c.id}`);
  if(c.tracking&&(!c.tracking.commandId||!Number.isFinite(c.tracking.maxDifference)||c.tracking.maxDifference<0||!Number.isFinite(c.tracking.settlingSec)||c.tracking.settlingSec<0))throw Error(`INVALID_DIAGNOSTIC_CONFIG:${c.id}`);
  ids.add(c.id);
 }
}
/** No sensor or CAN value is generated here. Invalid observations are marked unusable. */
export function stepCommunicationDiagnostics(previous:DiagnosticState,input:DiagnosticInput,configs:DiagnosticChannelConfig[],dt=.02):DiagnosticResult{
 if(!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('INVALID_DIAGNOSTIC_DT');
 validateDiagnosticConfig(configs);
 const byId=new Map<string,DiagnosticObservation>();
 for(const o of input.observations){if(!o.id||byId.has(o.id))throw Error('INVALID_DIAGNOSTIC_OBSERVATIONS');byId.set(o.id,o)}
 const next:DiagnosticState={channels:{}};
 const signals:DiagnosticResult['signals']={};const events:DiagnosticEvent[]=[];
 for(const c of configs){
  const obs=byId.get(c.id),prev=previous.channels[c.id]??healthyState();
  const command= c.tracking?byId.get(c.tracking.commandId):undefined;
  const commanded=!!command&&command.messageValid&&Number.isFinite(command.value)&&Number.isFinite(command.ageMs)&&command.ageMs>=0&&command.ageMs<=c.maxAgeMs;
  const trackingDemand=!!c.tracking&&commanded&&(!obs||!Number.isFinite(obs.value)||Math.abs(obs.value-command!.value)>c.tracking.maxDifference);
  const settledSec=c.tracking?(trackingDemand?prev.settledSec+dt:0):0;
  const reason=failure(c,obs,byId,settledSec);
  const pendingSec=reason?prev.pendingSec+dt:0;
  let fault=prev.fault,healthySec=reason?0:prev.healthySec+dt,occurrences=prev.occurrences;
  if(!fault&&reason&&pendingSec+1e-10>=c.debounceSec){fault=reason;occurrences++}
  if(fault&&!reason&&healthySec+1e-10>=c.recoverySec&&(!c.latch||(!!input.resetRequested&&!!input.resetPermitted))){fault=null;healthySec=0}
  const state={fault,pendingSec,healthySec,settledSec,occurrences};next.channels[c.id]=state;
  const valid=!reason&&!fault;
  signals[c.id]={valid,value:valid?obs!.value:null,reason:reason??fault};
  if(fault)events.push({channelId:c.id,fault,severity:c.severity,active:true,occurrences,source:c.source});
 }
 const inhibitFunction=events.some(e=>e.severity==='BLOCK');
 const limitFunction=inhibitFunction||events.some(e=>e.severity==='LIMIT');
 return{state:next,signals,events,policy:inhibitFunction?'INHIBIT_FUNCTION':limitFunction?'LIMIT_FUNCTION':'NONE',request:{limitFunction,inhibitFunction},diagnosticIds:events.map(e=>`${e.channelId}:${e.fault}`)};
}
/** Optional, opt-in projection. The owner ECU must decide the actual safe response. */
export function diagnosticPolicyForFunction(result:DiagnosticResult,channelIds:string[]):DiagnosticPolicy{
 const related=result.events.filter(e=>channelIds.includes(e.channelId));
 return related.some(e=>e.severity==='BLOCK')?'INHIBIT_FUNCTION':related.some(e=>e.severity==='LIMIT')?'LIMIT_FUNCTION':'NONE';
}
/** The game can render these small blocks without exposing diagnostic counters or arbitrary code editing. */
export const EDUCATIONAL_DIAGNOSTIC_BLOCKS=[
 {id:'range',label:'신호가 허용 범위에 있는가?'},
 {id:'timeout',label:'신호가 제때 갱신되었는가?'},
 {id:'plausibility',label:'두 센서값이 일치하는가?'},
 {id:'tracking',label:'명령과 실제 응답이 일치하는가?'},
 {id:'debounce',label:'이상 상태가 일정 시간 지속되었는가?'},
 {id:'fallback',label:'확정된 고장에 맞춰 기능을 제한한다'},
 {id:'recovery',label:'정상 복귀 조건을 다시 확인한다'},
] as const;
