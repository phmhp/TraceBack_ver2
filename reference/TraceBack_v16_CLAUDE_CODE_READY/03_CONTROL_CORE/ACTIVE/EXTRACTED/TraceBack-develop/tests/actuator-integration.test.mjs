import test from 'node:test';import assert from 'node:assert/strict';
import {ALL_SCENARIO_KEYS,CATALOG,CASES,createInvestigation,observeCase,runRepair,getScenario} from '../src/engineering/actuator-lab/integration.mjs';
for(const key of ALL_SCENARIO_KEYS){
 test(`${key}: fault visible then repair passes`,()=>{
  const o=observeCase(key);assert.equal(o.baseline.verdict,'PASS');assert.equal(o.faulty.verdict,'FAIL');
  const repaired=o.case.candidateRepairs[0].id;assert.equal(runRepair(key,{repairId:repaired}).verdict,'PASS');
  assert.equal(runRepair(key,{repairId:o.case.candidateRepairs[1].id}).verdict,'FAIL');
 });
 test(`${key}: investigation state and wiring gating`,()=>{
  const game=createInvestigation(key);assert.equal(game.test().verdict,'NOT_RUN');
  const first=getScenario(key).network.components[0].id;assert.equal(game.inspect(first).ok,true);
  const c=getScenario(key).network.wires[0];game.disconnect(c.from,c.out,c.to,c.in);
  game.selectRepair(CASES[key].candidateRepairs[0].id);
  assert.equal(game.test().status,'STRUCTURE_ERROR');
  assert.equal(game.connect(c.from,c.out,c.to,c.in).ok,true);
  assert.equal(game.test().verdict,'PASS');
 });
}
test('catalog has stable unique system/domain/function identities',()=>{
 assert.equal(new Set(CATALOG.map(c=>c.id)).size,CATALOG.length);
 assert.ok(CATALOG.every(c=>c.system!=='SYS-UNCLASSIFIED'));
 assert.equal(CATALOG.length,8);
});
test('injected hardware fault remains failing after software repair',()=>{
 const s=getScenario('propulsionScenario');const id=s.network.components.find(c=>c.kind==='actuator').id;
 assert.equal(runRepair('propulsionScenario',{repairId:'restore-logic',extraFaults:[{type:'actuator_stuck',componentId:id,value:0}]}).verdict,'FAIL');
});
test('unknown case and invalid repair rejected',()=>{assert.throws(()=>observeCase('x'));assert.equal(runRepair('brakeScenario',{repairId:'x'}).verdict,'NOT_RUN')});
