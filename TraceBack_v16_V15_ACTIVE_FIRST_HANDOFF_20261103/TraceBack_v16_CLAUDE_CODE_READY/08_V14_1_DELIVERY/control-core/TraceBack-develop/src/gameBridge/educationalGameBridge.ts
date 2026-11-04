/** Educational game adapter (not an OEM ECU, not certified safety software).
 * Inputs are a fictional game sensor gateway. Faults in this gateway are not changes
 * to protected safety supervisor logic. Do not use this for physical vehicle control.
 */
import {createIntegratedVehicleState,createNormalIntegratedInput,stepIntegratedVehicle,INTEGRATED_DT_SEC,INTEGRATED_LONGITUDINAL,type IntegratedVehicleInput,type IntegratedVehicleState,type IntegratedVehicleResult} from '../campaign/integratedVehicleModel.ts';
export type PedalGatewayProgram='nominal'|'underreport_45pct';
export type EducationalFault='none'|'pedal_gateway_underreport'|'cooling_fan_stuck_off'|'friction_actuator_stuck';
export type Driver={acceleratorPct:number;brakePct:number;steerNormalized:number};
export type GameState={xM:number;zM:number;speedMs:number;headingRad:number;collisionCount:number};
export type BridgeState={control:IntegratedVehicleState;game:GameState;};
export type BridgeFrame={state:BridgeState;controller:IntegratedVehicleResult;timeSec:number; gateway:{rawPedalPct:number;processedPedalPct:number;program:PedalGatewayProgram};};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const finite=(v:number)=>Number.isFinite(v);
export const GAME_DT_SEC=INTEGRATED_DT_SEC;
export function initialBridgeState():BridgeState{return{control:createIntegratedVehicleState(),game:{xM:0,zM:0,speedMs:0,headingRad:0,collisionCount:0}};}
/** Only editable gateway gain; never override brake, HV, diagnostics or thermal protection. */
export function gatewayProcess(pedalPct:number,program:PedalGatewayProgram){
 if(!finite(pedalPct)||pedalPct<0||pedalPct>100)throw Error('INVALID_RAW_PEDAL');
 if(program!=='nominal'&&program!=='underreport_45pct')throw Error('UNSUPPORTED_GATEWAY_PROGRAM');
 return program==='nominal'?pedalPct:pedalPct*.45;
}
export function stepBridge(previous:BridgeState,driver:Driver,options:{program?:PedalGatewayProgram;fault?:EducationalFault;collision?:boolean;roadDragN?:number;dtSec?:number;startEdge?:boolean;requestedGear?:'P'|'R'|'N'|'D';baseInput?:IntegratedVehicleInput}={}):BridgeFrame{
 const dt=options.dtSec??GAME_DT_SEC;
 if(!finite(dt)||dt<=0||dt>.1||!finite(driver.steerNormalized)||Math.abs(driver.steerNormalized)>1||!finite(driver.brakePct)||driver.brakePct<0||driver.brakePct>100)throw Error('INVALID_GAME_INPUT');
 const program=options.program??'nominal', processed=gatewayProcess(driver.acceleratorPct,program);
 const speed=previous.game.speedMs;
 const i:IntegratedVehicleInput=structuredClone(options.baseInput??createNormalIntegratedInput());
 i.pedalA_pct=processed;i.pedalB_pct=processed;i.brakePedalPct=driver.brakePct;
 i.speedKmh=speed*3.6;i.motorSpeedRpm=speed/INTEGRATED_LONGITUDINAL.wheelRadiusM*INTEGRATED_LONGITUDINAL.gearRatio*60/(2*Math.PI);
 i.driverSteerTorqueNm=driver.steerNormalized*3;i.steeringAngleRad=driver.steerNormalized*.4;
 i.requestedGear=options.requestedGear??'D';i.startEdge=options.startEdge??false;
 if(options.fault==='cooling_fan_stuck_off')i.plantFaults={...i.plantFaults,thermal:{...i.plantFaults?.thermal,fanStuckOff:true}};
 if(options.fault==='friction_actuator_stuck')i.plantFaults={...i.plantFaults,brake:{...i.plantFaults?.brake,stuckFriction:true}};
 if(options.fault==='pedal_gateway_underreport'&&program==='nominal')throw Error('FAULT_PROGRAM_CONFLICT');
 const controller=stepIntegratedVehicle(previous.control,i,dt);
 const drag=options.roadDragN??(120+0.38*speed*speed);
 if(!finite(drag)||drag<0||drag>20000)throw Error('INVALID_ROAD_DRAG');
 const mass=INTEGRATED_LONGITUDINAL.vehicleMassKg;
 const acceleration=(controller.actual.longitudinalNetForceN-(speed>0?drag:0))/mass;
 const collision=options.collision??false;
 const nextSpeed=collision?Math.max(0,speed*.45):clamp(speed+acceleration*dt,0,45);
 // Simplified arcade yaw: EPS torque controls *assist*, not wheel steering angle;
 // geometry is driven by player steering input and current speed, not EPS assist torque.
 const yawRate=(nextSpeed/2.7)*Math.tan(driver.steerNormalized*.38);
 const heading=previous.game.headingRad+yawRate*dt;
 const x=previous.game.xM+Math.sin(heading)*nextSpeed*dt;
 const z=previous.game.zM+Math.cos(heading)*nextSpeed*dt;
 return{state:{control:controller.state,game:{xM:x,zM:z,speedMs:nextSpeed,headingRad:heading,collisionCount:previous.game.collisionCount+(collision?1:0)}},controller,timeSec:controller.state.timeSec,gateway:{rawPedalPct:driver.acceleratorPct,processedPedalPct:processed,program}};
}
/** Deterministic boot sequence uses brake and START to enter READY before selecting D. */
export function bootToDrive():BridgeState{
 let s=initialBridgeState();const brake={acceleratorPct:0,brakePct:10,steerNormalized:0};
 for(let n=0;n<65;n++)s=stepBridge(s,brake,{requestedGear:'P',startEdge:n===0}).state;
 if(s.control.vehicle.mode!=='READY'||!s.control.hvPlant.mainClosed)throw Error('BOOT_HV_NOT_READY');
 for(let n=0;n<12;n++)s=stepBridge(s,brake,{requestedGear:'D'}).state;
 if(s.control.vehicle.mode!=='DRIVE'||s.control.gearPlant.actualGear!=='D')throw Error('BOOT_DRIVE_NOT_READY');
 return s;
}
export function runPairedTrace(options:{fault:'pedal_gateway_underreport'|'cooling_fan_stuck_off'|'friction_actuator_stuck';steps:number;pedalPct?:number;brakePct?:number;hotStartC?:number;}){
 if(!Number.isSafeInteger(options.steps)||options.steps<1||options.steps>1000)throw Error('INVALID_STEPS');
 const base=bootToDrive();
 if(options.hotStartC!==undefined){
  if(!finite(options.hotStartC)||options.hotStartC<0||options.hotStartC>140)throw Error('INVALID_INITIAL_TEMPERATURE');
  base.control.thermalPlant={...base.control.thermalPlant,motorTempC:options.hotStartC};
 }
 const records:Record<string,unknown>[]=[];
 const scenarios:[string,EducationalFault,PedalGatewayProgram][]=[['reference','none','nominal'],['faulty',options.fault,options.fault==='pedal_gateway_underreport'?'underreport_45pct':'nominal'],['repaired','none','nominal']];
 const results:Record<string,BridgeFrame[]>={};
 for(const [label,fault,program] of scenarios){
  let state=structuredClone(base);results[label]=[];
  for(let k=0;k<options.steps;k++){
   const f=stepBridge(state,{acceleratorPct:options.pedalPct??60,brakePct:options.brakePct??0,steerNormalized:0},{program,fault});
   state=f.state;results[label].push(f);
   records.push({scenario:label,tick:k,timeSec:f.timeSec,rawPedalPct:f.gateway.rawPedalPct,processedPedalPct:f.gateway.processedPedalPct,torqueCommandNm:f.controller.ecu.propulsion.command.motorTorqueNm,actualMotorTorqueNm:f.controller.actual.motorTorqueNm,fanCommand:f.controller.ecu.thermal.command.fanOn,actualFan:f.controller.actual.fanOn,thermalFault:f.controller.ecu.thermal.diagnostics.fault,brakeRequestN:f.controller.ecu.braking.command.totalRequestN,frictionActualN:f.controller.actual.frictionForceN,speedMs:f.state.game.speedMs,motorTempC:f.controller.actual.motorTempC,vehicleMode:f.controller.ecu.vehicle.mode});
  }
 }
 return {results,records,source:'actual v14 educational model execution',dtSec:GAME_DT_SEC,initialStateIdentical:true};
}
