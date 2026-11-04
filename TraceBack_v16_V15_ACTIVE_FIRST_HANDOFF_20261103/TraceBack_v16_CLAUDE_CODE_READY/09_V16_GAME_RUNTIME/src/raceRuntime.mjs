/** Race bookkeeping consumes actual vehicle bridge frames; never fabricates speed/ECU signals. */
export const RACE_DT=.02;
export function newRace({checkpointId='start',caseId='propulsion'}={}) {return {checkpointId,caseId,elapsedSec:0,tick:0,policeThreat:0,collisions:0,capture:false,finished:false,stopReason:null,lastDistanceM:0,events:[]};}
export function stepRace(previous,{bridgeFrame,collision=false,routeProgressM,paused=false,blurred=false,checkpoint=null,finish=false}={}){
 if(previous.capture||previous.finished)return structuredClone(previous);
 if(paused||blurred)return structuredClone(previous);
 if(!bridgeFrame||!bridgeFrame.state?.game||!Number.isFinite(bridgeFrame.state.game.speedMs))throw Error('MISSING_REAL_BRIDGE_FRAME');
 const next=structuredClone(previous);const speed=bridgeFrame.state.game.speedMs;
 if(!Number.isFinite(routeProgressM)||routeProgressM<next.lastDistanceM)throw Error('INVALID_ROUTE_PROGRESS');
 next.tick++;next.elapsedSec=Math.round((next.elapsedSec+RACE_DT)*1000)/1000;next.lastDistanceM=routeProgressM;
 if(collision){next.collisions++;next.events.push({tick:next.tick,type:'COLLISION'});}
 // Provisional arcade difficulty; no false claim of calibrated chase physics.
 const danger=(speed<4?.008:speed<10?.003:-.003)+(collision?.17:0);
 next.policeThreat=Math.max(0,Math.min(1,next.policeThreat+danger));
 if(checkpoint){if(typeof checkpoint!=='string'||checkpoint.length>60)throw Error('INVALID_CHECKPOINT');next.checkpointId=checkpoint;next.events.push({tick:next.tick,type:'CHECKPOINT',id:checkpoint});}
 if(next.policeThreat>=1){next.capture=true;next.stopReason='ARRESTED';next.events.push({tick:next.tick,type:'ARRESTED'});}
 else if(finish){next.finished=true;next.stopReason='FINISHED';next.events.push({tick:next.tick,type:'FINISH'});}
 if(next.events.length>200)next.events=next.events.slice(-200);
 return next;
}
export function retryRace(old,{checkpointId=old.checkpointId,caseId=old.caseId}={}) {return newRace({checkpointId,caseId});}
