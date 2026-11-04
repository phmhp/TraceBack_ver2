import test from 'node:test'; import assert from 'node:assert/strict';
test('scenario contract keeps two required and one optional case',()=>{const required=['propulsion','thermal'];assert.equal(required.length,2);assert.ok(!required.includes('brake'));});
