import test from 'node:test';
import assert from 'node:assert/strict';
import {bootToDrive,stepBridge,runPairedTrace,initialBridgeState,gatewayProcess} from '../src/gameBridge/educationalGameBridge.ts';
test('boot follows real brake-start-HV-READY-D sequence',()=>{const s=bootToDrive();assert.equal(s.control.vehicle.mode,'DRIVE');assert.equal(s.control.gearPlant.actualGear,'D');});
test('pedal gateway modifies real ECU command and plant response, not just UI',()=>{
 const p=runPairedTrace({fault:'pedal_gateway_underreport',steps:70});
 const last=a=>p.results[a].at(-1);
 assert.ok(last('faulty').controller.ecu.propulsion.command.motorTorqueNm<last('reference').controller.ecu.propulsion.command.motorTorqueNm);
 assert.ok(last('faulty').controller.actual.motorTorqueNm<last('reference').controller.actual.motorTorqueNm);
 assert.ok(last('faulty').state.game.speedMs<last('reference').state.game.speedMs);
 assert.deepEqual(p.results.reference.map(x=>x.state.game.speedMs),p.results.repaired.map(x=>x.state.game.speedMs));
});
test('thermal fan hardware failure cannot be repaired by a fictional SW gain edit',()=>{
 const p=runPairedTrace({fault:'cooling_fan_stuck_off',hotStartC:60,steps:50,pedalPct:30});
 assert.equal(p.results.faulty.at(-1).controller.actual.fanOn,false);
 assert.equal(p.results.reference.at(-1).controller.actual.fanOn,true);
 assert.equal(p.results.repaired.at(-1).controller.actual.fanOn,true);
 assert.ok(p.results.faulty.some(x=>x.controller.ecu.thermal.diagnostics.fault==='FAN_TRACKING'));
});
test('braking and steering actually change game kinematics',()=>{
 let s=bootToDrive();for(let n=0;n<140;n++)s=stepBridge(s,{acceleratorPct:80,brakePct:0,steerNormalized:0}).state;
 assert.ok(s.game.speedMs>0);const speed=s.game.speedMs;
 for(let n=0;n<60;n++)s=stepBridge(s,{acceleratorPct:0,brakePct:65,steerNormalized:.35}).state;
 assert.ok(s.game.speedMs<speed);assert.ok(s.game.headingRad>0);assert.ok(s.game.xM>0);
});
test('collision changes speed and increments counter',()=>{let s=bootToDrive();for(let n=0;n<60;n++)s=stepBridge(s,{acceleratorPct:70,brakePct:0,steerNormalized:0}).state;const before=s.game.speedMs;const f=stepBridge(s,{acceleratorPct:70,brakePct:0,steerNormalized:0},{collision:true});assert.ok(f.state.game.speedMs<before);assert.equal(f.state.game.collisionCount,1);});
test('invalid pedal and unsafe fault-program mismatch fail closed',()=>{assert.throws(()=>gatewayProcess(110,'nominal'),/INVALID_RAW_PEDAL/);assert.throws(()=>stepBridge(initialBridgeState(),{acceleratorPct:40,brakePct:0,steerNormalized:0},{fault:'pedal_gateway_underreport',program:'nominal'}),/FAULT_PROGRAM_CONFLICT/);});
