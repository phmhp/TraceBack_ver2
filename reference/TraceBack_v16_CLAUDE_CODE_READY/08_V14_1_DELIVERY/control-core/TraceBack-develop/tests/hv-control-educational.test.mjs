import test from 'node:test'
import assert from 'node:assert/strict'
import {stepHv,stepHvPlant,INITIAL_HV_STATE,INITIAL_HV_PLANT} from '../src/campaign/hvModel.ts'
import {stepVehicleSystemsWithHv,NORMAL_SYSTEM_INPUT,NEW_SYSTEM_STATE} from '../src/campaign/vehicleSystems.ts'
const base={startPermit:false,stopRequested:false,resetRequested:false,packSafe:true,hvilOk:true,insulationOk:true,bmsShutdownRequested:false,packVoltageV:380,dcLinkVoltageV:0,prechargeFeedbackClosed:false,mainFeedbackClosed:false,signalAgeMs:20,vehicleSpeedKmh:0}
const tick=(s=INITIAL_HV_STATE,p=INITIAL_HV_PLANT,fields={},faults={})=>{
 const r=stepHv(s,{...base,startPermit:true,dcLinkVoltageV:p.dcLinkVoltageV,prechargeFeedbackClosed:p.prechargeClosed,mainFeedbackClosed:p.mainClosed,...fields})
 const plant=stepHvPlant(p,r.commands,380,.02,faults)
 return {r,plant}
}
function run(faults={},fields={},count=160){let s=INITIAL_HV_STATE,p=INITIAL_HV_PLANT,r;for(let k=0;k<count;k++){const t=tick(s,p,fields,faults);s=t.r.state;p=t.plant;r=t.r}return {s,p,r}}
test('normal startup requires real precharge then main feedback before READY',()=>{
 let s=INITIAL_HV_STATE,p=INITIAL_HV_PLANT,prior=[],r
 for(let k=0;k<100;k++){const t=tick(s,p);s=t.r.state;p=t.plant;r=t.r;prior.push(r.mode);if(r.hvReady)break}
 assert.ok(prior.includes('PRECHARGE'));assert.ok(prior.includes('CONTACTOR_CLOSE'));assert.equal(r.mode,'HV_READY');assert.equal(r.feedback.mainClosed,true);assert.equal(r.commands.prechargeClose,false);assert.equal(r.commands.mainClose,true)
})
test('precharge voltage cannot authorize READY before main contactor feedback',()=>{const a=stepHv({...INITIAL_HV_STATE,mode:'PRECHARGE',elapsedSec:.4},{...base,startPermit:true,dcLinkVoltageV:370,prechargeFeedbackClosed:true});assert.equal(a.mode,'CONTACTOR_CLOSE');assert.equal(a.hvReady,false)})
test('slow voltage rise stays PRECHARGE then becomes fault on timeout',()=>{const x=run({noVoltageRise:true});assert.equal(x.r.mode,'FAULT');assert.equal(x.r.state.fault,'HV_PRECHARGE_TIMEOUT');assert.equal(x.r.commands.mainClose,false)})
test('precharge feedback missing faults before voltage timeout',()=>{const x=run({prechargeStuckOpen:true});assert.equal(x.r.state.fault,'HV_PRECHARGE_FEEDBACK_TIMEOUT')})
test('main feedback timeout inhibits ready and opens both commands',()=>{const x=run({mainStuckOpen:true});assert.equal(x.r.state.fault,'HV_MAIN_FEEDBACK_TIMEOUT');assert.equal(x.r.hvReady,false);assert.equal(x.r.commands.prechargeClose,false)})
test('welded main contactor detected when OFF',()=>{const r=stepHv(INITIAL_HV_STATE,{...base,mainFeedbackClosed:true});assert.equal(r.state.fault,'HV_CONTACTOR_STUCK_CLOSED')})
test('HVIL or insulation faults during READY clear power permission',()=>{const ready={...INITIAL_HV_STATE,mode:'HV_READY'};for(const [field,code] of [['hvilOk','HV_INTERLOCK_OPEN'],['insulationOk','HV_INSULATION_FAULT'],['bmsShutdownRequested','HV_BMS_SHUTDOWN']]){const r=stepHv(ready,{...base,mainFeedbackClosed:true,[field]:field==='bmsShutdownRequested'?true:false});assert.equal(r.mode,'FAULT');assert.equal(r.state.fault,code);assert.equal(r.hvReady,false);assert.equal(r.commands.mainClose,false)}})
test('signal age exact limit accepted, over limit and NaN rejected',()=>{const x=stepHv(INITIAL_HV_STATE,{...base,signalAgeMs:100});assert.equal(x.diagnostics.signalValid,true);for(const value of [100.01,NaN]){const r=stepHv(INITIAL_HV_STATE,{...base,signalAgeMs:value});assert.equal(r.state.fault,'HV_SIGNAL_INVALID')}})
test('precharge completion 90 percent boundary and just below',()=>{const prev={...INITIAL_HV_STATE,mode:'PRECHARGE'};assert.equal(stepHv(prev,{...base,prechargeFeedbackClosed:true,dcLinkVoltageV:342}).mode,'CONTACTOR_CLOSE');assert.equal(stepHv(prev,{...base,prechargeFeedbackClosed:true,dcLinkVoltageV:341.9}).mode,'PRECHARGE')})
test('fault latch requires stopped, open feedback, stop and explicit reset for stable time',()=>{let s={...INITIAL_HV_STATE,mode:'FAULT',fault:'HV_PRECHARGE_TIMEOUT'};let r;for(let k=0;k<6;k++){r=stepHv(s,{...base,stopRequested:true,resetRequested:true});s=r.state}assert.equal(r.mode,'OFF');assert.equal(r.state.fault,null);assert.equal(stepHv({...INITIAL_HV_STATE,mode:'FAULT',fault:'HV_PRECHARGE_TIMEOUT'},{...base,stopRequested:true,resetRequested:true,vehicleSpeedKmh:5}).mode,'FAULT')})
test('lost main feedback during READY triggers fault',()=>{const r=stepHv({...INITIAL_HV_STATE,mode:'HV_READY'},{...base,mainFeedbackClosed:false});assert.equal(r.state.fault,'HV_MAIN_FEEDBACK_LOST')})
test('stop request opens contactor commands without pretending observed feedback is open',()=>{const r=stepHv({...INITIAL_HV_STATE,mode:'HV_READY'},{...base,stopRequested:true,mainFeedbackClosed:true});assert.equal(r.mode,'OFF');assert.equal(r.commands.mainClose,false);assert.equal(r.feedback.mainClosed,true)})
test('vehicle integration blocks drive until HV feedback confirmed and leaves legacy API intact',()=>{
 const partial=stepVehicleSystemsWithHv(NEW_SYSTEM_STATE,{...NORMAL_SYSTEM_INPUT,gear:'D',pedalPct:80},INITIAL_HV_STATE,{...base,startPermit:true});assert.equal(partial.hv.mode,'PRECHARGE');assert.equal(partial.vehicle.drive.commandNm,0);assert.equal(partial.vehicle.contactors.precharge,true)
 const ready=stepVehicleSystemsWithHv(NEW_SYSTEM_STATE,{...NORMAL_SYSTEM_INPUT,gear:'D',pedalPct:50},{...INITIAL_HV_STATE,mode:'HV_READY'},{...base,startPermit:true,mainFeedbackClosed:true,dcLinkVoltageV:380});assert.equal(ready.hv.hvReady,true);assert.equal(ready.vehicle.drive.commandNm,90)
})
test('invalid integration time rejected',()=>assert.throws(()=>stepHv(INITIAL_HV_STATE,base,0),/INVALID_HV_DT/))

test('combined BMS shutdown request interrupts HV and drive, without fake contactor feedback', async()=>{
 const {stepVehicleSystemsWithBmsAndHv}=await import('../src/campaign/vehicleSystems.ts')
 const {INITIAL_BMS_STATE}=await import('../src/campaign/bmsModel.ts')
 const result=stepVehicleSystemsWithBmsAndHv(
  NEW_SYSTEM_STATE,{...NORMAL_SYSTEM_INPUT,gear:'D',pedalPct:90},INITIAL_BMS_STATE,
  {...INITIAL_HV_STATE,mode:'HV_READY'},
  {...base,startPermit:true,mainFeedbackClosed:true,dcLinkVoltageV:380},.02,
  {socPct:65,cellMinV:3.7,cellMaxV:3.9,batteryTempC:25,packCurrentA:0,packVoltageV:380,isolationOk:false,signalAgeMs:20}
 )
 assert.equal(result.bms.commands.shutdownRequested,true)
 assert.equal(result.hv.mode,'FAULT');assert.equal(result.hv.commands.mainClose,false)
 assert.equal(result.hv.feedback.mainClosed,true)
 assert.equal(result.vehicle.drive.commandNm,0)
})
