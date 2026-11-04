/** Educational E/E integration contract: scenario -> observe -> repair -> verify.
 * No vehicle plant, real diagnostic access, OTA flashing or safety certification.
 */
import { runScenario, validateNetwork, REGISTRY } from './engine.mjs';
import { examples } from './examples.mjs';
import { domainScenarios } from './domain-examples.mjs';
const canonical={...examples,...domainScenarios};
export const clone = value=>structuredClone(value);
export const CATALOG=Object.freeze(Object.entries(canonical).map(([key,s])=>({
 key,id:s.id,system:REGISTRY.systems.find(sys=>sys.domains.includes(s.domain))?.id||'SYS-UNCLASSIFIED',
 domain:s.domain,functionId:s.functionId,ecu:s.network.components.find(n=>n.kind==='ecu')?.id,
 sensors:s.network.components.filter(n=>n.kind==='sensor').map(n=>n.id),
 actuators:s.network.components.filter(n=>n.kind==='actuator').map(n=>n.id),logicKind:s.logic.kind,
 supported:true,simulationLevel:'SIGNAL_LOGIC_ONLY'
})));
// Each case is a controlled *software-logic* fault. Hardware fault injection is independently supported.
const badConfig={
 propulsionScenario:{gain:0.35},brakeScenario:{gain:0.4},
 bmsScenario:{minSoc:0.9},hvReadyScenario:{},
 gearScenario:{minBrake:1.1},steeringScenario:{gain:0.25},
 thermalScenario:{threshold:90},lvSupplyScenario:{}
};
const injectionFor={
 hvReadyScenario:{type:'ecu_command_stuck',componentId:'ecu',value:0},
 lvSupplyScenario:{type:'ecu_command_stuck',componentId:'ecu',value:0}
};
export const CASES=Object.freeze(Object.fromEntries(Object.entries(canonical).map(([key,s])=>{
 const faultyLogic={...s.logic,...badConfig[key]};
 const fault=injectionFor[key]||null;
 const symptom={propulsionScenario:'가속 요구에 비해 구동 명령이 작음',brakeScenario:'제동 요구에 비해 액추에이터 명령이 작음',bmsScenario:'정상 조건에서도 배터리 출력이 제한됨',hvReadyScenario:'시동·인터록 조건을 충족해도 접촉기 명령이 나오지 않음',gearScenario:'정지 상태에서 기어 전환 허용 조건이 비정상적임',steeringScenario:'조향 요구에 비해 EPS 보조 명령이 작음',thermalScenario:'높은 온도에서 냉각팬 작동이 지연됨',lvSupplyScenario:'정상 조건에서도 저전압 공급 명령이 차단됨'}[key];
 return [key,{id:`CASE-${s.id}`,scenarioKey:key,domain:s.domain,symptom,faultLocation:fault?'ecu_command':'ecu_logic',
 source:'TraceBack 교육용 독립 고장 사례 (실차 사양 아님)',
 faultyLogic,faults:fault?[fault]:[],candidateRepairs: fault
  ?[{id:'restore-output',label:'비정상 명령 고착 제거',action:'clear_fault'},{id:'keep-output',label:'기존 명령 고착 유지',action:'keep_fault'}]
  :[{id:'restore-logic',label:'설계 기준 로직 복원',action:'restore_logic'},{id:'keep-logic',label:'현재 로직 유지',action:'keep_logic'}],
 expected:s.steps.map((st,i)=>({step:i,actuators:clone(st.expectedActuators)}))}];
})));
export function getScenario(key){const s=canonical[key];if(!s)throw new Error('UNKNOWN_SCENARIO');return clone(s)}
export function getCase(key){const x=CASES[key];if(!x)throw new Error('UNKNOWN_CASE');return clone(x)}
export function observeCase(key){const s=getScenario(key),c=getCase(key);
 const initial=runScenario(s,{logic:c.faultyLogic,faults:c.faults});
 return {case:c,scenario:s,baseline:runScenario(s),faulty:initial,clues:initial.trace.map(t=>({step:t.step,inputs:t.inputs,expected:s.steps[t.step].expectedActuators,observed:t.actuators,mismatches:t.mismatches,values:t.values}))};
}
export function runRepair(key,{repairId,network,extraFaults=[]}={}){
 const s=getScenario(key),c=getCase(key);const repair=c.candidateRepairs.find(r=>r.id===repairId);
 if(!repair)return {status:'DATA_ERROR',verdict:'NOT_RUN',issues:['INVALID_REPAIR'],trace:[],actuators:{}};
 const logic=repair.action==='restore_logic'?s.logic:c.faultyLogic;
 const faults=repair.action==='clear_fault'?[]:[...c.faults];
 return runScenario(s,{network:network||s.network,logic,faults:[...faults,...extraFaults]});
}
/** Game-facing interface: all user operations go through the same deterministic runner. */
export function createInvestigation(key){
 const data=observeCase(key);let network=clone(data.scenario.network);let selected=null;let inspected=new Set();
 return {
  get state(){return {key,case:data.case,scenario:data.scenario,inspected:[...inspected],network:clone(network),repairId:selected,diagnosis:data.faulty};},
  inspect(id){if(!data.scenario.network.components.some(c=>c.id===id))return {ok:false,reason:'UNKNOWN_COMPONENT'};inspected.add(id);return {ok:true,id};},
  connect(from,out,to,input){if(network.wires.some(w=>w.to===to&&w.in===input))return {ok:false,reason:'INPUT_ALREADY_CONNECTED'};
    const next=clone(network);next.wires.push({from,out,to,in:input});const errors=validateNetwork(next).filter(e=>!e.startsWith('MISSING_INPUT:'));
    if(errors.length)return {ok:false,reason:errors[0]};network=next;return {ok:true};},
  disconnect(from,out,to,input){network.wires=network.wires.filter(w=>!(w.from===from&&w.out===out&&w.to===to&&w.in===input));return {ok:true};},
  restoreNetwork(){network=clone(data.scenario.network);return {ok:true}},
  selectRepair(id){if(!data.case.candidateRepairs.some(r=>r.id===id))return {ok:false,reason:'UNKNOWN_REPAIR'};selected=id;return {ok:true}},
  test(){if(!selected)return {status:'INCOMPLETE',verdict:'NOT_RUN',issues:['REPAIR_NOT_SELECTED'],trace:[]};return runRepair(key,{repairId:selected,network})}
 };
}
export const ALL_SCENARIO_KEYS=Object.freeze(Object.keys(canonical));
