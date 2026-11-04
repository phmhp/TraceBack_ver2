import {CASES,SCREENS,assertPlainData} from './schemas.mjs';
import {newRace,retryRace} from './raceRuntime.mjs';
export const SAVE_VERSION=16;
const clone=v=>structuredClone(v);
function assert(c,msg){if(!c)throw Error(msg);}
function reject(s,reason){return {...s,lastError:reason};}
function enter(s,scene){assert(SCREENS.includes(scene),'INVALID_SCREEN');return {...s,scene,lastError:null};}
function initialInvestigation(id){return {caseId:id,evidence:[],hypothesis:null,attemptedHypotheses:[],contradictions:[],compiledProgram:null,bench:null,repairApplied:false,solved:false};}
export function createCampaign(){return {version:SAVE_VERSION,scene:'TITLE',previousScene:null,garageLevel:0,garageDomain:'propulsion',caseId:null,investigations:{},completedCases:[],completedDomains:[],optionalBrake:'undecided',race:newRace(),raceCheckpoint:'start',raceResult:null,viewedCues:[],driverSetup:'not_ready',pausedFrom:null,lastError:null,events:[],revision:0};}
const at=(s,...names)=>names.includes(s.scene);
function inv(s){const x=s.investigations[s.caseId];assert(x,'NO_ACTIVE_CASE');return x;}
function existing(s,id){return s.investigations[id]??initialInvestigation(id);}
function pushHistory(s,event){s.revision++;s.events.push({id:s.revision,scene:s.scene,event});if(s.events.length>100)s.events.shift();return s;}
export function dispatch(previous,event){
 assertPlainData(event);assert(typeof event?.type==='string','INVALID_EVENT');
 const s=clone(previous);s.lastError=null;
 try{
 switch(event.type){
 case 'NEW_GAME': assert(at(s,'TITLE'),'TITLE_REQUIRED');return pushHistory(enter(createCampaign(),'PROLOGUE'),'NEW_GAME');
 case 'CONTINUE_PROLOGUE': assert(at(s,'PROLOGUE'),'PROLOGUE_REQUIRED');return pushHistory(enter(s,'GARAGE'),'CONTINUE_PROLOGUE');
 case 'SELECT_DOMAIN':assert(at(s,'GARAGE','GARAGE_L1','GARAGE_L2','GARAGE_L3','GARAGE_L4'),'GARAGE_REQUIRED');assert(['propulsion','bms','hv','lv','gear','drive','braking','steering','thermal','communication','safety'].includes(event.domain),'UNKNOWN_DOMAIN');s.garageDomain=event.domain;return pushHistory(enter(s,'GARAGE_L1'),'SELECT_DOMAIN');
 case 'GARAGE_ADVANCE':{
  const seq=['GARAGE_L1','GARAGE_L2','GARAGE_L3','GARAGE_L4'];assert(seq.includes(s.scene),'TUTORIAL_REQUIRED');const ix=seq.indexOf(s.scene);s.garageLevel=Math.max(s.garageLevel,ix+1);return pushHistory(enter(s,seq[Math.min(ix+1,3)]),'GARAGE_ADVANCE');}
 case 'TUTORIAL_DONE':assert(at(s,'GARAGE_L4'),'GARAGE_L4_REQUIRED');assert(s.garageDomain==='propulsion','PROPULSION_L4_REQUIRED');s.completedDomains=[...new Set([...s.completedDomains,'propulsion'])];s.driverSetup='ready';return pushHistory(enter(s,'GARAGE'),'TUTORIAL_DONE');
 case 'START_RACE':assert(at(s,'GARAGE'),'GARAGE_REQUIRED');assert(s.completedDomains.includes('propulsion')&&s.driverSetup==='ready','GARAGE_TUTORIAL_MISSING');s.caseId='propulsion';s.investigations.propulsion=existing(s,'propulsion');s.race=newRace({checkpointId:'drive_start',caseId:'propulsion'});s.raceCheckpoint='drive_start';return pushHistory(enter(s,'CHASE_NORMAL'),'START_RACE');
 case 'RACE_CHECKPOINT':assert(at(s,'CHASE_NORMAL','ASSIST_CHASE','CHASE_RESUME','SHIP_ESCAPE'),'RACE_REQUIRED');assert(typeof event.id==='string'&&event.id.length<=60&&event.id.length>0,'INVALID_CHECKPOINT');s.raceCheckpoint=event.id;s.race.checkpointId=event.id;return pushHistory(s,'RACE_CHECKPOINT');
 case 'RACE_CAUGHT':assert(at(s,'CHASE_NORMAL','ASSIST_CHASE','CHASE_RESUME','SHIP_ESCAPE'),'RACE_REQUIRED');s.raceResult='arrested';s.race.capture=true;s.race.stopReason='ARRESTED';return pushHistory(s,'RACE_CAUGHT');
 case 'RETRY_CHECKPOINT':assert(s.raceResult==='arrested','NOT_CAPTURED');s.race=retryRace(s.race,{checkpointId:s.raceCheckpoint,caseId:s.caseId??'propulsion'});s.raceResult=null;return pushHistory(s,'RETRY_CHECKPOINT');
 case 'FAULT_CUE':{
  assert(at(s,'CHASE_NORMAL','CHASE_RESUME'),'CHASE_REQUIRED');const id=s.scene==='CHASE_NORMAL'?'propulsion':'thermal';assert(id==='propulsion'||s.completedCases.includes('propulsion'),'PROPULSION_NOT_SOLVED');s.caseId=id;s.investigations[id]=existing(s,id);s.viewedCues=[...new Set([...s.viewedCues,id])];s.raceCheckpoint=id+'_fault';return pushHistory(enter(s,id==='propulsion'?'FAULT_1_CUE':'FAULT_2_CUE'),'FAULT_CUE');}
 case 'CONTINUE_FAULT':assert(at(s,'FAULT_1_CUE','FAULT_2_CUE'),'FAULT_CUE_REQUIRED');return pushHistory(enter(s,s.caseId==='propulsion'?'ASSIST_CHASE':'BOARD'),'CONTINUE_FAULT');
 case 'ESCAPE_TO_GARAGE':assert(at(s,'ASSIST_CHASE'),'ASSIST_CHASE_REQUIRED');return pushHistory(enter(s,'BOARD'),'ESCAPE_TO_GARAGE');
 case 'OPEN_BOARD':assert(at(s,'WIRING','TWIN_BENCH','VERIFY_FAIL','REPAIR_OR_SAFE_LIMIT'),'NO_BOARD_ROUTE');return pushHistory(enter(s,'BOARD'),'OPEN_BOARD');
 case 'RECORD_EVIDENCE':{
  assert(at(s,'BOARD'),'BOARD_REQUIRED');const item=event.evidenceId;assert(CASES[s.caseId].evidence.includes(item),'INVALID_EVIDENCE');const i=inv(s);i.evidence=[...new Set([...i.evidence,item])];return pushHistory(s,'RECORD_EVIDENCE');}
 case 'SELECT_HYPOTHESIS':{
  assert(at(s,'BOARD'),'BOARD_REQUIRED');const i=inv(s), spec=CASES[s.caseId];assert(spec.hypotheses.includes(event.hypothesis),'INVALID_HYPOTHESIS');i.hypothesis=event.hypothesis;i.attemptedHypotheses=[...new Set([...i.attemptedHypotheses,event.hypothesis])];
  if(event.hypothesis!==spec.root){i.contradictions=[...new Set([...i.contradictions,event.hypothesis])];}return pushHistory(s,'SELECT_HYPOTHESIS');}
 case 'OPEN_WIRING':{
  assert(at(s,'BOARD'),'BOARD_REQUIRED');const i=inv(s),spec=CASES[s.caseId];assert(i.evidence.length>=2,'INSUFFICIENT_EVIDENCE');assert(i.hypothesis!==null,'HYPOTHESIS_REQUIRED');return pushHistory(enter(s,'WIRING'),'OPEN_WIRING');}
 case 'COMPILE_WIRING':{
  assert(at(s,'WIRING'),'WIRING_REQUIRED');const i=inv(s);assert(['nominal','underreport_45pct','inspect_only'].includes(event.program),'INVALID_PROGRAM');
  if(s.caseId==='propulsion')assert(event.program!=='inspect_only','PROGRAM_REQUIRED');else assert(event.program==='inspect_only','HARDWARE_REPAIR_NOT_SW');
  assert(event.graphValid===true,'TYPED_GRAPH_INVALID');i.compiledProgram=event.program;return pushHistory(s,'COMPILE_WIRING');}
 case 'OPEN_BENCH':assert(at(s,'WIRING'),'WIRING_REQUIRED');assert(inv(s).compiledProgram!==null,'COMPILE_REQUIRED');return pushHistory(enter(s,'TWIN_BENCH'),'OPEN_BENCH');
 case 'BENCH_RESULT':{
  assert(at(s,'TWIN_BENCH'),'BENCH_REQUIRED');const i=inv(s);assert(i.compiledProgram!==null,'COMPILE_REQUIRED');assert(['pass','fail','inconclusive','model_error'].includes(event.verdict),'INVALID_VERDICT');
  assert(event.verifiedBy==='v16-bench-adapter','UNVERIFIED_BENCH_RESULT');assert(event.oracle==='provisional-educational-independent-requirement','INVALID_ORACLE');
  if(event.verdict==='pass'){assert(Object.values(event.checks??{}).length>=4&&Object.values(event.checks).every(x=>x===true),'FAILED_OR_MISSING_BENCH_CHECKS');assert(s.caseId!=='propulsion'||i.compiledProgram==='nominal','UNREPAIRED_GATEWAY');}
  if(event.verdict==='pass'){assert(Object.values(event.checks??{}).length>=4&&Object.values(event.checks).every(x=>x===true),'FAILED_OR_MISSING_BENCH_CHECKS');assert(s.caseId!=='propulsion'||i.compiledProgram==='nominal','UNREPAIRED_GATEWAY');}
  if(event.verdict==='pass'){assert(Object.values(event.checks??{}).length>=4&&Object.values(event.checks).every(x=>x===true),'FAILED_OR_MISSING_BENCH_CHECKS');assert(s.caseId!=='propulsion'||i.compiledProgram==='nominal','UNREPAIRED_GATEWAY');}
  i.bench={verdict:event.verdict,checks:clone(event.checks??{}),source:event.verifiedBy};return pushHistory(enter(s,event.verdict==='pass'?'REPAIR_OR_SAFE_LIMIT':'VERIFY_FAIL'),'BENCH_RESULT');}
 case 'OPEN_REPAIR':assert(at(s,'VERIFY_FAIL'),'VERIFY_FAIL_REQUIRED');return pushHistory(enter(s,'WIRING'),'OPEN_REPAIR');
 case 'APPLY_REPAIR':{
  assert(at(s,'REPAIR_OR_SAFE_LIMIT'),'BENCH_PASS_REQUIRED');const i=inv(s),spec=CASES[s.caseId];assert(i.bench?.verdict==='pass','BENCH_NOT_PASS');assert(i.hypothesis===spec.root,'ROOT_CAUSE_UNPROVEN');assert(event.kind===spec.repair,'WRONG_REPAIR_KIND');
  if(spec.repair==='sw_gateway')assert(i.compiledProgram==='nominal','GATEWAY_NOT_REPAIRED');else assert(event.parked===true,'HARDWARE_SERVICE_REQUIRES_PARK');
  i.repairApplied=true;i.solved=true;s.completedCases=[...new Set([...s.completedCases,s.caseId])];
  if(s.caseId==='propulsion')return pushHistory(enter(s,'CHASE_RESUME'),'APPLY_REPAIR');
  if(s.caseId==='thermal')return pushHistory(enter(s,'OPTIONAL_FAULT_3'),'APPLY_REPAIR');
  return pushHistory(enter(s,'SHIP_ESCAPE'),'APPLY_REPAIR');}
 case 'OPTIONAL_BRAKE':{
  assert(at(s,'OPTIONAL_FAULT_3'),'OPTIONAL_SCREEN_REQUIRED');assert(typeof event.accept==='boolean','INVALID_OPTION');s.optionalBrake=event.accept?'accepted':'skipped';if(!event.accept)return pushHistory(enter(s,'SHIP_ESCAPE'),'OPTIONAL_BRAKE_SKIP');s.caseId='brake';s.investigations.brake=existing(s,'brake');return pushHistory(enter(s,'BOARD'),'OPTIONAL_BRAKE_ACCEPT');}
 case 'FINISH_ESCAPE':assert(at(s,'SHIP_ESCAPE'),'ESCAPE_REQUIRED');assert(s.completedCases.includes('propulsion')&&s.completedCases.includes('thermal'),'REQUIRED_CASES_MISSING');assert(s.optionalBrake!=='undecided','BRAKE_DECISION_MISSING');return pushHistory(enter(s,'ENDING'),'FINISH_ESCAPE');
 case 'PAUSE':assert(at(s,'CHASE_NORMAL','ASSIST_CHASE','CHASE_RESUME','SHIP_ESCAPE'),'ONLY_RACE_PAUSE');s.pausedFrom=s.scene;return pushHistory(enter(s,'PAUSE'),'PAUSE');
 case 'RESUME':assert(at(s,'PAUSE'),'NOT_PAUSED');assert(s.pausedFrom&&SCREENS.includes(s.pausedFrom),'PAUSE_STATE_MISSING');return pushHistory(enter(s,s.pausedFrom),'RESUME');
 case 'MODEL_ERROR':s.previousScene=s.scene;s.modelErrorCode=String(event.code??'UNKNOWN').slice(0,100);return pushHistory(enter(s,'MODEL_ERROR'),'MODEL_ERROR');
 case 'MODEL_ERROR_RETURN':assert(at(s,'MODEL_ERROR'),'NOT_MODEL_ERROR');return pushHistory(enter(s,s.previousScene??'GARAGE'),'MODEL_ERROR_RETURN');
 default:throw Error('UNKNOWN_EVENT');
 }
 }catch(e){return reject(previous,e.message);}
}
export function serializeCampaign(state){assert(state.version===SAVE_VERSION,'INVALID_VERSION');assertPlainData(state);const serialized=JSON.stringify({version:SAVE_VERSION,campaign:state});assert(serialized.length<500000,'SAVE_TOO_LARGE');return serialized;}
export function restoreCampaign(raw){assert(typeof raw==='string'&&raw.length<500000,'INVALID_SAVE');const data=JSON.parse(raw);assert(data?.version===SAVE_VERSION,'MIGRATION_REQUIRED');assertPlainData(data);const state=data.campaign;assert(state?.version===SAVE_VERSION&&SCREENS.includes(state.scene)&&Array.isArray(state.completedCases)&&Array.isArray(state.events),'CORRUPT_SAVE');return clone(state);}
export function sceneVisualMode(scene){return ['CHASE_NORMAL','FAULT_1_CUE','ASSIST_CHASE','CHASE_RESUME','FAULT_2_CUE','SHIP_ESCAPE'].includes(scene)?'ACTIVE_3D_RACE':'STATIC_3D_LOOK_WITH_INTERACTIVE_OBJECTS';}
