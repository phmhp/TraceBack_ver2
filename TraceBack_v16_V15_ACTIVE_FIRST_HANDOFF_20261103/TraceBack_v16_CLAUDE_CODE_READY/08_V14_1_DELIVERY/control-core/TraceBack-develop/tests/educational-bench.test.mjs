import test from 'node:test';import assert from 'node:assert/strict';
import {runEducationalBench} from '../src/gameBridge/educationalBench.ts';
for(const id of ['PROPULSION_GATEWAY','THERMAL_FAN','BRAKE_ACTUATOR'])test(`requirement oracle ${id} normal/fault/repaired`,()=>{
 const b=runEducationalBench(id);
 assert.equal(b.results.reference.verdict,'PASS');
 assert.equal(b.results.faulty.verdict,'FAIL');
 assert.equal(b.results.repaired.verdict,'PASS');
 assert.ok(b.trace.length>0);
});
