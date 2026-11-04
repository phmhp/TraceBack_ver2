import {executeBench} from './benchRuntime.mjs';
import {dispatch} from './gameRuntime.mjs';
/** Single supported application entry point to bench: generate verdict from real model. */
export function runVerifiedBench(campaign){
 if(campaign.scene!=='TWIN_BENCH')return {...campaign,lastError:'BENCH_REQUIRED'};
 try{
  const result=executeBench(campaign.caseId);
  const selected=campaign.investigations[campaign.caseId]?.compiledProgram;
  const configValid=campaign.caseId==='propulsion'?selected==='nominal':selected==='inspect_only';
  const verdict=result.pass&&configValid?'pass':'fail';
  return dispatch(campaign,{type:'BENCH_RESULT',verdict,verifiedBy:'v16-bench-adapter',oracle:result.oracle,checks:{...result.checks,configValid}});
 }catch(e){return dispatch(campaign,{type:'BENCH_RESULT',verdict:'model_error',verifiedBy:'v16-bench-adapter',oracle:'provisional-educational-independent-requirement',checks:{error:String(e.message).slice(0,100)}});}
}
