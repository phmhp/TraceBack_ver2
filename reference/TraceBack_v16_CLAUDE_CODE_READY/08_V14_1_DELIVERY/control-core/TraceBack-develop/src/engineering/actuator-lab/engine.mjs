/** TraceBack educational actuator logic laboratory.
 * Standalone deterministic E/E signal simulation. Not a vehicle physics, HIL, or safety-certified model.
 * No eval, no network, no software installation, and no dynamic arbitrary code execution.
 */
export const REGISTRY = Object.freeze({
  systems: [
    {id:'SYS-ENERGY',name:'Energy & Power Supply',domains:['DOM-BMS','DOM-HV','DOM-LV']},
    {id:'SYS-POWERTRAIN',name:'Powertrain',domains:['DOM-PROPULSION','DOM-GEAR']},
    {id:'SYS-CHASSIS',name:'Chassis',domains:['DOM-BRAKE','DOM-STEER']},
    {id:'SYS-THERMAL',name:'Thermal',domains:['DOM-THERMAL']},
    {id:'SYS-EE',name:'E/E Architecture',domains:['DOM-COMM','DOM-DIAG']}
  ],
  domains: [
    {id:'DOM-BMS',functions:['F-BMS-LIMIT']},{id:'DOM-HV',functions:['F-HV-READY']},{id:'DOM-LV',functions:['F-LV-SUPPLY']},{id:'DOM-GEAR',functions:['F-GEAR-INTERLOCK']},
    {id:'DOM-PROPULSION',functions:['F-TORQUE-REQUEST']},{id:'DOM-BRAKE',functions:['F-BRAKE-COMMAND']},
    {id:'DOM-STEER',functions:['F-STEER-COMMAND']},{id:'DOM-THERMAL',functions:['F-THERMAL-DEMAND']},
    {id:'DOM-COMM',functions:['F-SIGNAL-VALIDITY']},{id:'DOM-DIAG',functions:['F-DIAG-MONITOR']}
  ]
});

const PORT_TYPES = new Set(['boolean','normalized','celsius','command','gear']);
const clamp = x => Math.min(1,Math.max(0,x));
const compatible = (from,to) => from.type===to.type && (!from.unit || !to.unit || from.unit===to.unit);
export function validateNetwork(network) {
  const issues=[];
  if(!network || !Array.isArray(network.components)||!Array.isArray(network.wires))return ['INVALID_NETWORK'];
  const byId=new Map();const incoming=new Set();
  for(const c of network.components){
    if(!c.id || byId.has(c.id))issues.push('DUPLICATE_COMPONENT:'+c.id);
    byId.set(c.id,c);
    if(!['sensor','ecu','actuator'].includes(c.kind))issues.push('INVALID_COMPONENT_KIND:'+c.id);
    for(const p of [...(c.inputs||[]),...(c.outputs||[])])if(!PORT_TYPES.has(p.type))issues.push('INVALID_PORT_TYPE:'+c.id+':'+p.id);
  }
  for(const w of network.wires){
    const a=byId.get(w.from),b=byId.get(w.to);
    const output=a?.outputs?.find(p=>p.id===w.out),input=b?.inputs?.find(p=>p.id===w.in);
    if(!a||!b||!output||!input){issues.push('INVALID_ENDPOINT:'+w.from+'->'+w.to);continue;}
    if(!compatible(output,input))issues.push('PORT_TYPE_OR_UNIT_MISMATCH:'+w.from+'->'+w.to);
    const key=w.to+':'+w.in;
    if(incoming.has(key))issues.push('DUPLICATE_INPUT:'+key);
    incoming.add(key);
  }
  for(const c of network.components)for(const p of c.inputs||[])if(p.required!==false && !incoming.has(c.id+':'+p.id))issues.push('MISSING_INPUT:'+c.id+':'+p.id);
  const edges=new Map(network.components.map(c=>[c.id,[]]));
  for(const w of network.wires)if(edges.has(w.from)&&edges.has(w.to))edges.get(w.from).push(w.to);
  const visited=new Set(),active=new Set();
  function dfs(id){if(active.has(id)){issues.push('CYCLE:'+id);return;}if(visited.has(id))return;active.add(id);for(const v of edges.get(id)||[])dfs(v);active.delete(id);visited.add(id);}
  for(const id of edges.keys())dfs(id);
  return [...new Set(issues)];
}

export function runScenario(scenario, {network=scenario.network, logic=scenario.logic, faults=[]}={}) {
  const issues=validateNetwork(network);
  if(issues.length)return {status:'STRUCTURE_ERROR',issues,trace:[],actuators:{},verdict:'NOT_RUN'};
  if(!Array.isArray(scenario.steps) || !scenario.steps.length)return {status:'DATA_ERROR',issues:['NO_TEST_STEPS'],trace:[],actuators:{},verdict:'NOT_RUN'};
  const nodes=new Map(network.components.map(n=>[n.id,n]));
  const values=new Map(),trace=[],actuators={};
  const activeFaults=[...(scenario.faults||[]),...faults];
  const allowedFaults=new Set(['sensor_stuck','sensor_bias','wire_open','ecu_command_stuck','actuator_stuck']);
  if(activeFaults.some(f=>!allowedFaults.has(f.type)||!nodes.has(f.componentId)))return {status:'DATA_ERROR',issues:['INVALID_FAULT'],trace:[],actuators:{},verdict:'NOT_RUN'};
  const logicAllowed=new Set(['propulsion','brake','steer','thermal','hv_ready','bms_limit','gear','power_supply']);
  if(!logicAllowed.has(logic.kind))return {status:'DATA_ERROR',issues:['UNSUPPORTED_LOGIC'],trace:[],actuators:{},verdict:'NOT_RUN'};
  const order=[];const done=new Set();
  function visit(id){if(done.has(id))return;for(const w of network.wires.filter(w=>w.to===id))visit(w.from);done.add(id);order.push(nodes.get(id));}
  for(const c of network.components)visit(c.id);
  for(const [index,step] of scenario.steps.entries()) {
    values.clear();
    const stepOutput={};
    try {
      for(const c of order){
        const args={};
        for(const w of network.wires.filter(w=>w.to===c.id)){
          const f=activeFaults.find(f=>f.type==='wire_open'&&f.componentId===w.from&&f.port===w.out);
          args[w.in]=f?undefined:values.get(w.from+':'+w.out);
        }
        let out={};
        if(c.kind==='sensor'){
          let v=step.inputs?.[c.id];
          const stuck=activeFaults.find(f=>f.componentId===c.id&&f.type==='sensor_stuck');
          const bias=activeFaults.find(f=>f.componentId===c.id&&f.type==='sensor_bias');
          if(stuck)v=stuck.value;
          if(bias)v=Number(v)+Number(bias.value);
          out={value:v};
        }else if(c.kind==='ecu'){
          if(Object.values(args).some(v=>v===undefined))out={command:0,diagnostic:'SIGNAL_MISSING'};
          else {
            let command=0;
            if(logic.kind==='propulsion')command=args.ready===true?clamp(Number(args.demand))*clamp(Number(logic.gain??1))*clamp(Number(args.limit)):0;
            else if(logic.kind==='brake')command=clamp(Number(args.demand))*clamp(Number(logic.gain??1));
            else if(logic.kind==='steer')command=Math.max(-1,Math.min(1,Number(args.demand)*Number(logic.gain??1)));
            else if(logic.kind==='thermal')command=Number(args.temperature)>=Number(logic.threshold)?1:0;
            else if(logic.kind==='hv_ready')command=args.enable===true&&args.interlock===true?1:0;
            else if(logic.kind==='bms_limit') {
              const soc=Number(args.soc),temp=Number(args.temperature);
              if(!Number.isFinite(soc)||!Number.isFinite(temp)||soc<0||soc>1)throw Error('INVALID_BMS_SENSOR');
              command= soc<Number(logic.minSoc??0.1)||temp>Number(logic.maxTemp??55)||temp<Number(logic.minTemp??-20)?Number(logic.limitedOutput??0.25):1;
            }
            else if(logic.kind==='gear') {
              const requested=Number(args.request),speed=Number(args.speed),brake=Number(args.brake);
              if(![0,1,2,3].includes(requested)||!Number.isFinite(speed)||!Number.isFinite(brake))throw Error('INVALID_GEAR_INPUT');
              // P=0,N=1,D=2,R=3. Output is an encoded state, not torque.
              command=(args.ready===true && speed<=Number(logic.maxShiftSpeed??0.03) && brake>=Number(logic.minBrake??0.2))?requested:1;
            }
            else if(logic.kind==='power_supply') {
              // simplified 12V load enable: not a circuit model
              command=(args.hvReady===true && args.dcdcHealthy===true)?1:0;
            }
            const stuck=activeFaults.find(f=>f.componentId===c.id&&f.type==='ecu_command_stuck');
            if(stuck)command=stuck.value;
            out={command,diagnostic: 'OK'};
          }
        }else{
          const stuck=activeFaults.find(f=>f.componentId===c.id&&f.type==='actuator_stuck');
          const received=Number(args.command??0);
          const response=stuck?Number(stuck.value):received;
          out={response};actuators[c.id]=response;stepOutput[c.id]=response;
        }
        for(const [k,v] of Object.entries(out))values.set(c.id+':'+k,v);
      }
    }catch(e){return {status:'DATA_ERROR',issues:['INVALID_STEP:'+index],trace,actuators:{},verdict:'NOT_RUN'};}
    if([...values.values()].some(v=>typeof v==='number'&&!Number.isFinite(v)))return {status:'DATA_ERROR',issues:['NON_FINITE_VALUE:'+index],trace,actuators:{},verdict:'NOT_RUN'};
    const expected=step.expectedActuators||{};
    const mismatches=Object.entries(expected).filter(([id,v])=>!Object.hasOwn(stepOutput,id)||Math.abs(stepOutput[id]-v)>1e-6).map(([id,v])=>({componentId:id,expected:v,actual:stepOutput[id]}));
    trace.push({step:index,inputs:step.inputs,values:Object.fromEntries(values),actuators:stepOutput,mismatches,pass:mismatches.length===0});
  }
  return {status:'COMPLETED',issues:[],trace,actuators,verdict:trace.every(t=>t.pass)?'PASS':'FAIL'};
}
