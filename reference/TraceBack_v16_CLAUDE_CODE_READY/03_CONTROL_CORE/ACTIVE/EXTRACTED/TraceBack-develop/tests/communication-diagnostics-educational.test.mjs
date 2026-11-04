import test from 'node:test'
import assert from 'node:assert/strict'
import {INITIAL_DIAGNOSTIC_STATE,stepCommunicationDiagnostics,diagnosticPolicyForFunction,EDUCATIONAL_DIAGNOSTIC_BLOCKS} from '../src/campaign/communicationDiagnosticsModel.ts'
const configs=[
{id:'pedalA',source:'SENSOR',units:'%',min:0,max:100,maxAgeMs:100,debounceSec:.06,recoverySec:.1,severity:'BLOCK',plausibility:{peerId:'pedalB',maxDifference:5},latch:true},
{id:'motorFeedback',source:'ACTUATOR',units:'Nm',min:-100,max:300,maxAgeMs:100,debounceSec:.08,recoverySec:.1,severity:'LIMIT',tracking:{commandId:'motorCommand',maxDifference:20,settlingSec:.04}},
{id:'batterySOC',source:'CAN',units:'%',min:0,max:100,maxAgeMs:100,debounceSec:.02,recoverySec:.06,severity:'WARNING'}]
const normal=[{id:'pedalA',value:50,ageMs:20,messageValid:true},{id:'pedalB',value:52,ageMs:20,messageValid:true},{id:'motorFeedback',value:60,ageMs:20,messageValid:true},{id:'motorCommand',value:60,ageMs:20,messageValid:true},{id:'batterySOC',value:60,ageMs:20,messageValid:true}]
const tick=(state=INITIAL_DIAGNOSTIC_STATE,changes={},flags={},dt=.02)=>{const obs=normal.map(v=>({...v,...(changes[v.id]??{})}));return stepCommunicationDiagnostics(state,{observations:obs,...flags},configs,dt)}
const many=(n,changes={},initial=INITIAL_DIAGNOSTIC_STATE,flags={})=>{let r,s=initial;for(let k=0;k<n;k++){r=tick(s,changes,flags);s=r.state}return r}
test('normal signals pass and no protective requests',()=>{const r=tick();assert.equal(r.policy,'NONE');assert.equal(r.signals.pedalA.value,50);assert.equal(r.events.length,0)})
test('boundary 0 and 100 acceptable',()=>{const r=tick(INITIAL_DIAGNOSTIC_STATE,{pedalA:{value:100},pedalB:{value:100},batterySOC:{value:0}});assert.equal(r.signals.pedalA.valid,true);assert.equal(r.signals.batterySOC.valid,true)})
test('exact time age 100 is accepted',()=>assert.equal(tick(INITIAL_DIAGNOSTIC_STATE,{batterySOC:{ageMs:100}}).signals.batterySOC.valid,true))
test('stale > threshold invalid immediately, fault debounced',()=>{const a=tick(INITIAL_DIAGNOSTIC_STATE,{pedalA:{ageMs:101}});assert.equal(a.signals.pedalA.valid,false);assert.equal(a.policy,'NONE');const b=many(2,{pedalA:{ageMs:101}},a.state);assert.equal(b.policy,'INHIBIT_FUNCTION');assert.equal(b.events[0].fault,'TIMEOUT')})
test('out of range',()=>{const r=tick(INITIAL_DIAGNOSTIC_STATE,{batterySOC:{value:-1}});assert.equal(r.events[0].fault,'RANGE');assert.equal(r.policy,'NONE')})
test('message invalid',()=>{const r=tick(INITIAL_DIAGNOSTIC_STATE,{batterySOC:{messageValid:false}});assert.equal(r.events[0].fault,'MESSAGE_INVALID')})
test('NaN invalid not silently clamped',()=>{const r=tick(INITIAL_DIAGNOSTIC_STATE,{batterySOC:{value:NaN}});assert.equal(r.signals.batterySOC.valid,false)})
test('plausibility mismatch debounced',()=>{const r=many(3,{pedalA:{value:80}});assert.equal(r.events[0].fault,'PLAUSIBILITY')})
test('momentary plausibility mismatch does not latch',()=>{const a=tick(INITIAL_DIAGNOSTIC_STATE,{pedalA:{value:80}});const b=tick(a.state);assert.equal(b.policy,'NONE');assert.equal(b.state.channels.pedalA.pendingSec,0)})
test('feedback mismatch needs settling then debounce',()=>{const r=many(5,{motorFeedback:{value:10}});assert.equal(r.events[0].fault,'TRACKING')})
test('temporary mismatch during actuator settling not fault',()=>{let r=many(1,{motorFeedback:{value:10}});r=tick(r.state);assert.equal(r.events.length,0)})
test('tracking recovers after healthy duration',()=>{const a=many(5,{motorFeedback:{value:10}});const b=many(5,{},a.state);assert.equal(b.events.length,0)})
test('latched block requires reset and permission',()=>{const a=many(3,{pedalA:{value:80}});assert.equal(many(10,{},a.state).policy,'INHIBIT_FUNCTION');assert.equal(many(10,{},a.state,{resetRequested:true,resetPermitted:false}).policy,'INHIBIT_FUNCTION');assert.equal(many(10,{},a.state,{resetRequested:true,resetPermitted:true}).policy,'NONE')})
test('fault count persists after recovery',()=>{const a=many(3,{pedalA:{value:80}});const b=many(10,{},a.state,{resetRequested:true,resetPermitted:true});assert.equal(b.state.channels.pedalA.occurrences,1)})
test('function-specific fallback does not affect unrelated function',()=>{const a=many(3,{pedalA:{value:80}});assert.equal(diagnosticPolicyForFunction(a,['pedalA']),'INHIBIT_FUNCTION');assert.equal(diagnosticPolicyForFunction(a,['batterySOC']),'NONE')})
test('invalid dt and config rejected',()=>{assert.throws(()=>tick(INITIAL_DIAGNOSTIC_STATE,{}, {},0),/INVALID_DIAGNOSTIC_DT/);assert.throws(()=>stepCommunicationDiagnostics(INITIAL_DIAGNOSTIC_STATE,{observations:normal},[{...configs[0],debounceSec:-1}]),/INVALID_DIAGNOSTIC_CONFIG/)})
test('duplicate observations rejected',()=>{assert.throws(()=>stepCommunicationDiagnostics(INITIAL_DIAGNOSTIC_STATE,{observations:[...normal,normal[0]]},configs),/INVALID_DIAGNOSTIC_OBSERVATIONS/)})
test('deterministic results for identical input and state',()=>assert.deepEqual(tick(),tick()))
test('missing sensor does not create a value',()=>{const r=stepCommunicationDiagnostics(INITIAL_DIAGNOSTIC_STATE,{observations:normal.filter(x=>x.id!=='batterySOC')},configs);assert.equal(r.signals.batterySOC.value,null)})
test('block list is concise and user-displayable',()=>assert.ok(EDUCATIONAL_DIAGNOSTIC_BLOCKS.length>=5))
import {NEW_SYSTEM_STATE,NORMAL_SYSTEM_INPUT,stepVehicleSystems,stepVehicleSystemsWithDiagnostics} from '../src/campaign/vehicleSystems.ts'
test('opt-in vehicle diagnostics projects faults without hijacking existing drive command',()=>{
 const original=stepVehicleSystems(NEW_SYSTEM_STATE,NORMAL_SYSTEM_INPUT)
 const r=stepVehicleSystemsWithDiagnostics(NEW_SYSTEM_STATE,NORMAL_SYSTEM_INPUT,INITIAL_DIAGNOSTIC_STATE,{observations:normal.map(o=>o.id==='batterySOC'?{...o,messageValid:false}:o)},configs)
 assert.deepEqual(r.vehicle.drive,original.drive)
 assert.ok(r.vehicle.diagnostics.some(v=>v==='COMM_batterySOC:MESSAGE_INVALID'))
 assert.equal(r.communicationDiagnostics.policy,'NONE')
})
