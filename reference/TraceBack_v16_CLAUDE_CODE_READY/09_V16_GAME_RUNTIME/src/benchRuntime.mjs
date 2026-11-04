import {runPairedTrace} from '../../08_V14_1_DELIVERY/control-core/TraceBack-develop/src/gameBridge/educationalGameBridge.ts';
import {CASES} from './schemas.mjs';
/** This wrapper deliberately evaluates real ECU/plant traces. Its thresholds are educational, provisional. */
export function executeBench(caseId){
 const spec=CASES[caseId];if(!spec)throw Error('UNKNOWN_CASE');
 const trace=runPairedTrace({fault:spec.fault,...spec.bench});
 const a=trace.results.reference.at(-1),b=trace.results.faulty.at(-1),c=trace.results.repaired.at(-1);
 let reference=false,faultDetected=false,repaired=false,evidence={};
 if(caseId==='propulsion'){
  const torque=x=>x.controller.actual.motorTorqueNm;
  reference=torque(a)>0;faultDetected=torque(b)<torque(a)*.85&&b.gateway.processedPedalPct<b.gateway.rawPedalPct;
  repaired=Math.abs(torque(c)-torque(a))<1e-8&&Math.abs(c.state.game.speedMs-a.state.game.speedMs)<1e-8;
  evidence={rawPct:b.gateway.rawPedalPct,processedPct:b.gateway.processedPedalPct,referenceTorqueNm:torque(a),faultyTorqueNm:torque(b)};
 }else if(caseId==='thermal'){
  reference=typeof a.controller.actual.fanOn==='boolean';
  faultDetected=trace.results.faulty.some(f=>f.controller.ecu.thermal.command.fanOn&&!f.controller.actual.fanOn);
  repaired=trace.results.repaired.every(f=>f.controller.ecu.thermal.command.fanOn===f.controller.actual.fanOn);
  evidence={commandOn:b.controller.ecu.thermal.command.fanOn,actualOn:b.controller.actual.fanOn};
 }else{
  reference=a.controller.actual.frictionForceN>=0;
  faultDetected=trace.results.faulty.some(f=>f.controller.ecu.braking.command.frictionForceN>1&&f.controller.actual.frictionForceN<1);
  repaired=trace.results.repaired.some(f=>f.controller.ecu.braking.command.frictionForceN>1&&f.controller.actual.frictionForceN>1);
  evidence={requestN:b.controller.ecu.braking.command.totalRequestN,actualN:b.controller.actual.frictionForceN};
 }
 const checks={reference,faultDetected,repaired};return {caseId,checks,evidence,pass:Object.values(checks).every(Boolean),oracle:'provisional-educational-independent-requirement',simulation:'actual-v14.1-integrated-model',realVehicleCertified:false,trace};
}
