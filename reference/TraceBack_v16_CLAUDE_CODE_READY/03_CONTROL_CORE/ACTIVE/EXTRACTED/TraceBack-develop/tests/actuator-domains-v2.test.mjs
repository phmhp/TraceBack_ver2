import test from 'node:test';
import assert from 'node:assert/strict';
import {REGISTRY,runScenario,validateNetwork} from '../src/engineering/actuator-lab/engine.mjs';
import {domainScenarios} from '../src/engineering/actuator-lab/domain-examples.mjs';
const clone=x=>structuredClone(x);
for(const [name,s] of Object.entries(domainScenarios)){
  test(name+' nominal steps match oracle',()=>{const r=runScenario(s);assert.equal(r.status,'COMPLETED',JSON.stringify(r.issues));assert.equal(r.verdict,'PASS',JSON.stringify(r.trace));});
  test(name+' ECU output fault is visible',()=>{const r=runScenario(s,{faults:[{type:'ecu_command_stuck',componentId:'ecu',value:0.1234}]});assert.equal(r.status,'COMPLETED');assert.equal(r.verdict,'FAIL');});
  test(name+' actuator stuck fault is visible',()=>{const r=runScenario(s,{faults:[{type:'actuator_stuck',componentId:s.network.components.at(-1).id,value:0.1234}]});assert.equal(r.verdict,'FAIL');});
  test(name+' broken wire yields safe zero and is detectable',()=>{const r=runScenario(s,{faults:[{type:'wire_open',componentId:s.network.components[0].id,port:'value'}]});assert.equal(r.status,'COMPLETED');assert.equal(r.verdict,'FAIL');});
  test(name+' bad port mapping is structurally rejected',()=>{const s2=clone(s);s2.network.wires[0].in='invalid';assert.equal(runScenario(s2).status,'STRUCTURE_ERROR');});
}
test('registry includes added domains',()=>{for(const d of ['DOM-BMS','DOM-HV','DOM-LV','DOM-GEAR','DOM-STEER','DOM-THERMAL'])assert.ok(REGISTRY.domains.some(x=>x.id===d));});
test('test oracle detects altered steering gain',()=>assert.equal(runScenario(domainScenarios.steeringScenario,{logic:{kind:'steer',gain:0.25}}).verdict,'FAIL'));
test('test oracle detects altered thermal threshold',()=>assert.equal(runScenario(domainScenarios.thermalScenario,{logic:{kind:'thermal',threshold:90}}).verdict,'FAIL'));
