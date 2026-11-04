import {stepHv,INITIAL_HV_STATE} from './hvModel.ts'
import type {HvInput,HvState as HvControllerState,HvResult} from './hvModel.ts'
import {stepBms,INITIAL_BMS_STATE,makeBmsInputFromVehicle} from './bmsModel.ts'
import type {BmsState,BmsResult,BmsInputs} from './bmsModel.ts'
/** The fixed single-motor RWD / front-steer BEV used by the campaign. */
export type HvState='OFF'|'PRECHARGE'|'READY'|'FAULT'
export type SystemInput={startEdge:boolean;stopEdge:boolean;gear:'P'|'R'|'N'|'D';brakePct:number;pedalPct:number;steer:number;speedKmh:number;packSoc:number;packTempC:number;motorTempC:number;inverterTempC:number;packVoltage:number;dcLinkVoltage:number;isolationOk:boolean;plugged:boolean;chargerLimitA:number;wheelSlip:[number,number,number,number];yawError:number;signalAgeMs:number}
export type SystemState={hv:HvState;prechargeSec:number;motorTorqueNm:number;soc:number;fault?:string}
export const NEW_SYSTEM_STATE:SystemState={hv:'OFF',prechargeSec:0,motorTorqueNm:0,soc:65}
export const NORMAL_SYSTEM_INPUT:SystemInput={startEdge:false,stopEdge:false,gear:'P',brakePct:0,pedalPct:0,steer:0,speedKmh:0,packSoc:65,packTempC:25,motorTempC:35,inverterTempC:35,packVoltage:380,dcLinkVoltage:360,isolationOk:true,plugged:false,chargerLimitA:32,wheelSlip:[0,0,0,0],yawError:0,signalAgeMs:20}
const clamp=(n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,Number.isFinite(n)?n:lo))
export type SystemOutput={state:SystemState;contactors:{precharge:boolean;main:boolean};packAvailable:boolean;availableTorqueNm:number;dcDc:{active:boolean;voltageV:number};charging:{active:boolean;currentA:number;soc:number};thermal:{pump:boolean;fan:boolean;derate:number};drive:{requestNm:number;allowed:boolean;commandNm:number;actualNm:number;rearWheelNm:[number,number]};brake:{regenNm:number;frictionN:number;frontN:[number,number];rearN:[number,number];absActive:boolean;escActive:boolean};steering:{frontAngleRad:number;assistNm:number};diagnostics:string[];bms?:BmsResult}
export function stepVehicleSystems(previous:SystemState,input:SystemInput,dt=.02,bms?:BmsResult):SystemOutput{
 if(!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('실행 간격은 0초 초과, 0.1초 이하여야 합니다.')
 const diagnostic:string[]=[],soc=clamp(input.packSoc,0,100),brake=clamp(input.brakePct,0,100),pedal=clamp(input.pedalPct,0,100),speed=Math.abs(input.speedKmh)
 if(!input.isolationOk)diagnostic.push('절연 이상')
 if(input.signalAgeMs>100)diagnostic.push('제어 신호 지연')
 if(input.packTempC>=60)diagnostic.push('배터리 과열')
 if(soc<=3)diagnostic.push('배터리 잔량 부족')
 const critical=diagnostic.length>0
 let hv:HvState=critical?'FAULT':previous.hv,prechargeSec=previous.prechargeSec,fault=critical?diagnostic[0]:previous.fault
 if(!critical){
  if(input.plugged&&hv!=='OFF'){hv='OFF';prechargeSec=0}
  else if(hv==='FAULT'&&input.stopEdge&&speed<.5){hv='OFF';prechargeSec=0;fault=undefined}
  else if(hv==='OFF'&&input.startEdge&&input.gear==='P'&&brake>=5&&soc>5&&!input.plugged){hv='PRECHARGE';prechargeSec=0}
  else if(hv==='PRECHARGE'){
   prechargeSec+=dt
   if(prechargeSec>=.3&&input.dcLinkVoltage>=input.packVoltage*.9)hv='READY'
   else if(prechargeSec>2){hv='FAULT';fault='프리차지 시간 초과';diagnostic.push(fault)}
  }else if(hv==='READY'&&input.stopEdge&&speed<.5){hv='OFF';prechargeSec=0}
 }
 const packAvailable=hv==='READY'&&!critical&&(!bms||bms.packAvailable)
 const highTemp=Math.max(input.packTempC,input.motorTempC,input.inverterTempC)
 const thermalDerate=clamp((85-highTemp)/20,.15,1)*clamp((soc-3)/12,.15,1)
 // 80 kW ↔ 180 Nm is an explicitly normalized educational interface, NOT P=T·omega.
 const bmsDischargeScale=bms?clamp(bms.limits.dischargeKw/80,0,1):1
 const availableTorqueNm=packAvailable?180*thermalDerate*bmsDischargeScale:0
 const pump=highTemp>38||input.plugged,fan=highTemp>55
 const chargeActive=input.plugged&&input.gear==='P'&&hv==='OFF'&&diagnostic.length===0&&soc<95&&input.packTempC>0&&input.packTempC<45
 const chargeCurrentA=chargeActive?clamp(input.chargerLimitA,0,32):0
 const nextSoc=clamp(soc+chargeCurrentA*input.packVoltage*dt/3600/50000*100,0,100)
 const dcDcActive=packAvailable||chargeActive
 const requestNm=Math.min(availableTorqueNm,pedal*1.8)
 const allowed=packAvailable&&input.gear==='D'&&brake<5&&input.signalAgeMs<=100
 const commandNm=allowed?requestNm:0
 const actualNm=previous.motorTorqueNm+(commandNm-previous.motorTorqueNm)*clamp(dt/.12,0,1)
 const motorTorqueNm=allowed?actualNm:0
 const slip=input.wheelSlip.map(value=>clamp(Math.abs(value),0,1))
 const absActive=brake>0&&slip.some(value=>value>.2)
 const regenScale=bms?clamp(bms.limits.chargeKw/40,0,1):1
 const regenNm=packAvailable&&input.gear==='D'&&speed>5&&!absActive?Math.min(brake*1.2,60*regenScale,availableTorqueNm*.45):0
 const requestedFrictionN=Math.max(0,brake*42-regenNm*7*.9/.425)
 const frontBase=requestedFrictionN*.6/2,rearBase=requestedFrictionN*.4/2
 const frontN:[number,number]=[frontBase*(slip[0]>.2?.35:1),frontBase*(slip[1]>.2?.35:1)]
 const rearN:[number,number]=[rearBase*(slip[2]>.2?.35:1),rearBase*(slip[3]>.2?.35:1)]
 const escActive=speed>20&&Math.abs(input.yawError)>.15
 if(escActive){const side=input.yawError>0?0:1;rearN[side]+=Math.min(350,Math.abs(input.yawError)*900)}
 const steer=clamp(input.steer,-1,1),frontAngleRad=steer*.48,assistNm=Math.abs(steer)*Math.max(1,7-speed*.075)
 const state={hv,prechargeSec,motorTorqueNm,soc:nextSoc,fault}
 return{state,contactors:{precharge:hv==='PRECHARGE',main:hv==='READY'},packAvailable,availableTorqueNm,dcDc:{active:dcDcActive,voltageV:dcDcActive?13.8:Math.max(10.5,12.6-(1-soc/100)*1.2)},charging:{active:chargeActive,currentA:chargeCurrentA,soc:nextSoc},thermal:{pump,fan,derate:thermalDerate},drive:{requestNm,allowed,commandNm,actualNm:motorTorqueNm,rearWheelNm:[motorTorqueNm*7*.9/2,motorTorqueNm*7*.9/2]},brake:{regenNm,frictionN:frontN[0]+frontN[1]+rearN[0]+rearN[1],frontN,rearN,absActive,escActive},steering:{frontAngleRad,assistNm},diagnostics:[...(diagnostic.length?diagnostic:hv==='FAULT'&&fault?[fault]:[]),...(bms?.faults??[])],...(bms?{bms}:{})}
}

/** Opt-in BMS integration for the educational vehicle. Existing stepVehicleSystems callers are unchanged.
 * No fake measured cell values are generated unless caller explicitly opts into the illustrative adapter.
 * Return the BMS state separately: it is not the HV contactor state machine.
 */
export function stepVehicleSystemsWithBms(
 previous:SystemState,input:SystemInput,bmsPrevious:BmsState=INITIAL_BMS_STATE,
 dt=.02,observations?:BmsInputs
):{vehicle:SystemOutput;bms:BmsResult}{
 const bms=stepBms(bmsPrevious,observations??makeBmsInputFromVehicle(input),dt)
 const vehicle=stepVehicleSystems(previous,input,dt,bms)
 return {vehicle,bms}
}

/** Opt-in HV controller adapter. Original stepVehicleSystems and BMS caller APIs remain unchanged.
 * HV controller is authoritative for contactor commands; vehicle physics cannot self-authorize READY.
 * Callers supply independent measured contactor feedback and DC-link voltage.
 */
export function stepVehicleSystemsWithHv(
 previous:SystemState,input:SystemInput,hvPrevious:HvControllerState=INITIAL_HV_STATE,
 hvObservations:HvInput,dt=.02,bms?:BmsResult
):{vehicle:SystemOutput;hv:HvResult}{
 const hv=stepHv(hvPrevious,hvObservations,dt)
 const staged:SystemState={...previous,hv:hv.hvReady?'READY':'OFF',prechargeSec:hv.state.elapsedSec}
 const vehicle=stepVehicleSystems(staged,{...input,startEdge:false,stopEdge:false},dt,bms)
 const mappedHv:HvState=hv.mode==='HV_READY'?'READY':hv.mode==='CONTACTOR_CLOSE'||hv.mode==='PRECHARGE'?'PRECHARGE':hv.mode==='FAULT'?'FAULT':'OFF'
 const safetyBlocked=vehicle.state.hv==='FAULT'
 vehicle.state={...vehicle.state,hv:safetyBlocked?'FAULT':mappedHv,prechargeSec:hv.state.elapsedSec,fault:hv.state.fault??vehicle.state.fault}
 vehicle.contactors={precharge:hv.commands.prechargeClose,main:hv.commands.mainClose}
 if(!hv.hvReady||safetyBlocked){
  vehicle.packAvailable=false;vehicle.availableTorqueNm=0;
  vehicle.drive={...vehicle.drive,requestNm:0,allowed:false,commandNm:0,actualNm:0,rearWheelNm:[0,0]};
  vehicle.brake={...vehicle.brake,regenNm:0};
  vehicle.dcDc={...vehicle.dcDc,active:false};
 }
 vehicle.diagnostics=[...vehicle.diagnostics,...hv.faults]
 return {vehicle,hv}
}

/** Combined opt-in adapter: BMS limits/requests are authoritative for the HV controller.
 * Keeps the states independent: BMS SHUTDOWN_REQUEST is not physical contactor feedback.
 */
export function stepVehicleSystemsWithBmsAndHv(
 previous:SystemState,input:SystemInput,bmsPrevious:BmsState,hvPrevious:HvControllerState,
 hvObservations:HvInput,dt=.02,bmsObservations?:BmsInputs
):{vehicle:SystemOutput;bms:BmsResult;hv:HvResult}{
 const bms=stepBms(bmsPrevious,bmsObservations??makeBmsInputFromVehicle(input),dt)
 const coupledInputs:HvInput={...hvObservations,packSafe:hvObservations.packSafe&&bms.packAvailable,bmsShutdownRequested:hvObservations.bmsShutdownRequested||bms.commands.shutdownRequested}
 const {vehicle,hv}=stepVehicleSystemsWithHv(previous,input,hvPrevious,coupledInputs,dt,bms)
 return {vehicle,bms,hv}
}

/** Opt-in VCU Vehicle Mode adapter. Preserves the legacy and BMS/HV-only APIs.
 * Controller states must be supplied by the caller; no UI scene or invented HV feedback may authorize DRIVE.
 * This is a one-cycle snapshot: the HV unit must be stepped separately using its own command/feedback loop.
 */
export function stepVehicleSystemsWithMode(
 previous:SystemState,input:SystemInput,modePrevious:import('./vehicleModeModel.ts').VehicleModeState,
 observations:import('./vehicleModeModel.ts').VehicleModeInput,dt=.02,
 bms?:BmsResult
):{vehicle:SystemOutput;mode:import('./vehicleModeModel.ts').VehicleModeResult}{
 const mode=stepVehicleMode(modePrevious,observations,dt)
 // Prevent the old inline HV controller from taking ownership of READY when VCU mode is authoritative.
 const staged:SystemState={...previous,hv:mode.permissions.vehicleReady?'READY':'OFF'}
 const vehicle=stepVehicleSystems(staged,{...input,startEdge:false,stopEdge:false},dt,bms)
 const legacySafetyBlocked=vehicle.state.hv==='FAULT'||!vehicle.packAvailable
 const effectiveReady=mode.permissions.vehicleReady&&!legacySafetyBlocked
 const driveEnabled=effectiveReady&&mode.permissions.driveAllowed&&input.gear==='D'&&vehicle.drive.allowed
 // A VCU mode may permit reverse direction, but the legacy RWD test plant has no reverse torque model.
 const commandNm=driveEnabled?vehicle.drive.commandNm*mode.requests.torqueLimitScale:0
 const actualNm=driveEnabled?vehicle.drive.actualNm*mode.requests.torqueLimitScale:0
 vehicle.drive={...vehicle.drive,allowed:driveEnabled,requestNm:driveEnabled?vehicle.drive.requestNm:0,commandNm,actualNm,rearWheelNm:[actualNm*7*.9/2,actualNm*7*.9/2]}
 vehicle.state={...vehicle.state,motorTorqueNm:actualNm,hv:legacySafetyBlocked||observations.hvMode==='FAULT'?'FAULT':observations.hvReady?'READY':'OFF'}
 vehicle.packAvailable=effectiveReady
 vehicle.availableTorqueNm=effectiveReady?vehicle.availableTorqueNm*mode.requests.torqueLimitScale:0
 if(!effectiveReady){vehicle.brake={...vehicle.brake,regenNm:0};vehicle.dcDc={...vehicle.dcDc,active:false}}
 if(mode.diagnostics.fault)vehicle.diagnostics.push(mode.diagnostics.fault)
 return {vehicle,mode}
}

import {stepVehicleMode} from './vehicleModeModel.ts'

/** Combined opt-in authority gate (BMS -> HV -> VCU). No legacy APIs are changed.
 * Input describes independent measured HV feedback, not fabricated contactor response.
 */
export function stepVehicleSystemsWithBmsHvAndMode(
 previous:SystemState,input:SystemInput,bmsPrevious:BmsState,hvPrevious:HvControllerState,
 modePrevious:import('./vehicleModeModel.ts').VehicleModeState,
 hvObservations:HvInput,modeObservations:Omit<import('./vehicleModeModel.ts').VehicleModeInput,'hvMode'|'hvReady'|'bmsMode'|'packAvailable'>,
 dt=.02,bmsObservations?:BmsInputs
):{vehicle:SystemOutput;bms:BmsResult;hv:HvResult;mode:import('./vehicleModeModel.ts').VehicleModeResult}{
 const bms=stepBms(bmsPrevious,bmsObservations??makeBmsInputFromVehicle(input),dt)
 // VCU acts on latest observed HV/BMS state and then requests a subsequent HV tick.
 const mode=stepVehicleMode(modePrevious,{
  ...modeObservations,hvMode:hvPrevious.mode,hvReady:hvPrevious.mode==='HV_READY',
  bmsMode:bms.mode,packAvailable:bms.packAvailable
 },dt)
 const coupledHv:HvInput={...hvObservations,
  startPermit:mode.requests.hvStartPermit,
  stopRequested:mode.requests.hvStopRequested||hvObservations.stopRequested,
  packSafe:hvObservations.packSafe&&bms.packAvailable,
  bmsShutdownRequested:hvObservations.bmsShutdownRequested||bms.commands.shutdownRequested}
 const hv=stepHv(hvPrevious,coupledHv,dt)
 const evaluated=stepVehicleSystemsWithMode(previous,input,modePrevious,{
  ...modeObservations,hvMode:hv.mode,hvReady:hv.hvReady,bmsMode:bms.mode,packAvailable:bms.packAvailable
 },dt,bms)
 // Protect against a fault seen by the new HV step in this same cycle.
 const liveReady=hv.hvReady&&!bms.commands.shutdownRequested&&evaluated.mode.permissions.vehicleReady
 const vehicle=evaluated.vehicle
 if(!liveReady){vehicle.packAvailable=false;vehicle.availableTorqueNm=0;vehicle.drive={...vehicle.drive,allowed:false,requestNm:0,commandNm:0,actualNm:0,rearWheelNm:[0,0]};vehicle.brake={...vehicle.brake,regenNm:0}}
 vehicle.contactors={precharge:hv.commands.prechargeClose,main:hv.commands.mainClose}
 vehicle.state={...vehicle.state,hv:hv.mode==='FAULT'?'FAULT':hv.mode==='HV_READY'?'READY':hv.mode==='OFF'?'OFF':'PRECHARGE',fault:hv.state.fault??vehicle.state.fault}
 vehicle.diagnostics.push(...hv.faults)
 return {vehicle,bms,hv,mode}
}


import {stepGearInterlock} from './gearInterlockModel.ts'
import type {GearInput,GearState,GearOutput} from './gearInterlockModel.ts'
/** Opt-in gear authority adapter. Legacy consumers are unchanged.
 * Actual feedback, not request/command, selects the effective transmission direction.
 * The legacy motor plant supports D only: R is explicitly inhibited until a reverse plant exists.
 */
export function stepVehicleSystemsWithGear(
 previous:SystemState,input:SystemInput,gearPrevious:GearState,
 gearObservations:GearInput,dt=.02,bms?:BmsResult
):{vehicle:SystemOutput;gear:GearOutput}{
 const gear=stepGearInterlock(gearPrevious,gearObservations,dt)
 const effectiveGear=gear.feedback.confirmed?gear.feedback.actualGear:'N'
 const vehicle=stepVehicleSystems(previous,{...input,gear:effectiveGear},dt,bms)
 const forward=gear.permissions.forwardAllowed&&vehicle.drive.allowed
 // An unconfirmed gear, rejected gear shift or R does not imply physical motor drive.
 if(!forward){
  vehicle.drive={...vehicle.drive,requestNm:0,allowed:false,commandNm:0,actualNm:0,rearWheelNm:[0,0]}
  vehicle.state={...vehicle.state,motorTorqueNm:0}
 }
 if(!gear.permissions.driveAllowed)vehicle.brake={...vehicle.brake,regenNm:0}
 if(gear.diagnostics.fault)vehicle.diagnostics.push(gear.diagnostics.fault)
 if(gear.diagnostics.blockedReason)vehicle.diagnostics.push(gear.diagnostics.blockedReason)
 return {vehicle,gear}
}

/** Opt-in VCU + gear authorization gate. The observed gear is authoritative for VCU.
 * No changes to existing stepVehicleSystemsWithMode behavior or signatures.
 */
export function stepVehicleSystemsWithModeAndGear(
 previous:SystemState,input:SystemInput,modePrevious:import('./vehicleModeModel.ts').VehicleModeState,
 modeObservations:import('./vehicleModeModel.ts').VehicleModeInput,
 gearPrevious:GearState,gearObservations:GearInput,dt=.02,bms?:BmsResult
):{vehicle:SystemOutput;mode:import('./vehicleModeModel.ts').VehicleModeResult;gear:GearOutput}{
 const gear=stepGearInterlock(gearPrevious,gearObservations,dt)
 const effectiveGear=gear.feedback.confirmed?gear.feedback.actualGear:'N'
 const {vehicle,mode}=stepVehicleSystemsWithMode(previous,{...input,gear:effectiveGear},modePrevious,{...modeObservations,gear:effectiveGear},dt,bms)
 const allowed=gear.permissions.forwardAllowed&&mode.permissions.driveAllowed&&vehicle.drive.allowed
 if(!allowed){vehicle.drive={...vehicle.drive,requestNm:0,allowed:false,commandNm:0,actualNm:0,rearWheelNm:[0,0]};vehicle.state={...vehicle.state,motorTorqueNm:0}}
 if(!gear.permissions.driveAllowed)vehicle.brake={...vehicle.brake,regenNm:0}
 if(gear.diagnostics.fault)vehicle.diagnostics.push(gear.diagnostics.fault)
 if(gear.diagnostics.blockedReason)vehicle.diagnostics.push(gear.diagnostics.blockedReason)
 return {vehicle,mode,gear}
}

import {stepPropulsion,propulsionInputFromDomains} from './propulsionModel.ts'
import type {PropulsionInput,PropulsionState,PropulsionResult} from './propulsionModel.ts'
/** Opt-in propulsion integration. Domain results must be computed independently, and observed
 * motor torque must come from a separate plant/measurement, never the current ECU command.
 * Does NOT alter existing legacy, BMS, HV, VCU, or Gear call signatures.
 * The baseline vehicle calculation is retained for charging/thermal/steering/brake outputs;
 * only the drive-output branch is replaced by the educational propulsion controller.
 */
export function stepVehicleSystemsWithPropulsion(
 previous:SystemState,input:SystemInput,propulsionPrevious:PropulsionState,
 motorObservations:Omit<PropulsionInput,'bmsDischargeLimitKw'|'bmsAvailable'|'vehicleReady'|'gearForwardConfirmed'|'driveAuthorized'|'vcuTorqueLimitScale'>,
 bms:BmsResult,mode:import('./vehicleModeModel.ts').VehicleModeResult,
 gear:GearOutput,dt=.02
):{vehicle:SystemOutput;propulsion:PropulsionResult}{
 const propulsion=stepPropulsion(propulsionPrevious,propulsionInputFromDomains(motorObservations,bms,mode,gear),dt)
 const confirmedGear=gear.feedback.confirmed?gear.feedback.actualGear:'N'
 const staged:SystemState={...previous,hv:mode.feedback.hvReady?'READY':'OFF'}
 const vehicle=stepVehicleSystems(staged,{...input,gear:confirmedGear,startEdge:false,stopEdge:false},dt,bms)
 const systemGate=vehicle.packAvailable&&mode.permissions.driveAllowed&&gear.permissions.forwardAllowed
 const authorized=propulsion.command.driveAllowed&&systemGate
 const commandNm=authorized?propulsion.command.motorTorqueNm:0
 // Plant observation is intentionally NOT replaced with command: transient torque may remain.
 const actualNm=propulsion.signals.feedbackValid&&Number.isFinite(motorObservations.observedMotorTorqueNm)?Math.max(0,motorObservations.observedMotorTorqueNm):0
 vehicle.drive={...vehicle.drive,allowed:authorized,requestNm:propulsion.signals.pedalDemandNm,
  commandNm,actualNm,rearWheelNm:[actualNm*7*.9/2,actualNm*7*.9/2]}
 vehicle.availableTorqueNm=systemGate?propulsion.limits.availableNm:0
 vehicle.state={...vehicle.state,motorTorqueNm:actualNm,hv:mode.feedback.hvReady?'READY':'OFF'}
 vehicle.packAvailable=systemGate
 if(!systemGate)vehicle.brake={...vehicle.brake,regenNm:0}
 if(propulsion.diagnostics.fault)vehicle.diagnostics.push(propulsion.diagnostics.fault)
 vehicle.diagnostics.push(...propulsion.diagnostics.limitReasons)
 return {vehicle,propulsion}
}

import {stepBraking,brakeInputFromBms} from './brakingModel.ts'
import type {BrakeState,BrakeInput,BrakeResult} from './brakingModel.ts'
/** Opt-in independent brake blending. Keeps stepVehicleSystems and all existing adapters unchanged.
 * An ABS flag inhibits regen in the educational controller; do not interpret this
 * simplified force total as a production ABS/ESC wheel-force allocation.
 */
export function stepVehicleSystemsWithBraking(
 previous:SystemState,input:SystemInput,brakePrevious:BrakeState,
 observations:Omit<BrakeInput,'bmsChargeLimitKw'|'bmsAvailable'>,
 bms:BmsResult,dt=.02
):{vehicle:SystemOutput;braking:BrakeResult}{
 const braking=stepBraking(brakePrevious,brakeInputFromBms(observations,bms),dt)
 const vehicle=stepVehicleSystems(previous,input,dt,bms)
 const c=braking.command
 // Existing brake.regenNm denotes motor-side regenerative torque, not a wheel force.
 // Legacy ABS/ESC wheel-force values are illustrative only; never used as safety approval.
 const frontTotalN=c.frictionRequestN*.6,rearTotalN=c.frictionRequestN*.4
 vehicle.brake={...vehicle.brake,regenNm:c.regenMotorTorqueNm,
   frictionN:c.frictionRequestN,
   frontN:[frontTotalN/2,frontTotalN/2],rearN:[rearTotalN/2,rearTotalN/2],
   absActive:observations.absIntervention}
 if(braking.diagnostics.fault)vehicle.diagnostics.push(braking.diagnostics.fault)
 vehicle.diagnostics.push(...braking.diagnostics.limitReasons)
 return {vehicle,braking}
}

import {stepEps} from './epsModel.ts'
import type {EpsState,EpsInput,EpsResult} from './epsModel.ts'
/** Opt-in EPS assist authority; preserves legacy steering geometry/physics path.
 * Actual EPS motor telemetry is supplied by the caller and is not synthesized from command.
 */
export function stepVehicleSystemsWithEps(
 previous:SystemState,input:SystemInput,epsPrevious:EpsState,
 observations:EpsInput,dt=.02,bms?:BmsResult
):{vehicle:SystemOutput;eps:EpsResult}{
 const eps=stepEps(epsPrevious,observations,dt)
 const vehicle=stepVehicleSystems(previous,input,dt,bms)
 // frontAngleRad is the mechanically linked driver input, NOT EPS motor assist torque.
 vehicle.steering={...vehicle.steering,assistNm:eps.command.assistTorqueNm}
 if(eps.diagnostics.fault)vehicle.diagnostics.push(`EPS_${eps.diagnostics.fault}`)
 vehicle.diagnostics.push(...eps.diagnostics.limitReasons.map(reason=>`EPS_${reason}`))
 return {vehicle,eps}
}

import {stepThermal} from './thermalModel.ts'
import type {ThermalInput,ThermalState,ThermalResult} from './thermalModel.ts'
/** Opt-in thermal supervisor. Command is not plant response: observations are caller-supplied.
 * Preserve legacy thermal and drivetrain APIs; the thermal output is the authority only in this adapter.
 */
export function stepVehicleSystemsWithThermal(previous:SystemState,input:SystemInput,
 thermalPrevious:ThermalState,observations:ThermalInput,dt=.02,bms?:BmsResult
):{vehicle:SystemOutput;thermal:ThermalResult}{
 const thermal=stepThermal(thermalPrevious,observations,dt)
 const vehicle=stepVehicleSystems(previous,input,dt,bms)
 vehicle.thermal={pump:thermal.command.pumpRequestPct>0,fan:thermal.command.fanOn,derate:thermal.command.torqueLimitScale}
 // This adapter intentionally changes the legacy drive request/command ceiling, not a separate propulsion model.
 // Remove only the legacy temperature derate before applying the new thermal supervisor.
 // Preserve the preexisting SOC and BMS constraints; avoid applying temperature derate twice.
 const legacyTempScale=clamp((85-Math.max(input.packTempC,input.motorTempC,input.inverterTempC))/20,.15,1)
 const thermalCeiling=vehicle.availableTorqueNm/legacyTempScale*thermal.command.torqueLimitScale
 vehicle.availableTorqueNm=thermalCeiling
 vehicle.drive.requestNm=Math.min(vehicle.drive.requestNm,thermalCeiling)
 vehicle.drive.commandNm=thermal.command.shutdownRequested?0:Math.min(vehicle.drive.commandNm,thermalCeiling)
 if(thermal.command.shutdownRequested){vehicle.drive.allowed=false;vehicle.drive.requestNm=0;vehicle.drive.commandNm=0}
 // A motor's actual torque remains observed/dynamic and is never fabricated from this cycle's command.
 if(thermal.diagnostics.fault)vehicle.diagnostics.push(`THERMAL_${thermal.diagnostics.fault}`)
 vehicle.diagnostics.push(...thermal.diagnostics.limitReasons.filter(reason=>reason!==`THERMAL_${thermal.diagnostics.fault}`))
 return{vehicle,thermal}
}

import {stepLv} from './lvPowerModel.ts'
import type {LvInput,LvState,LvResult} from './lvPowerModel.ts'
/** Opt-in LV / DC-DC authority, preserving the original system and all previous domain API signatures.
 * Independent LV measurements are supplied by caller, never synthesized from DC/DC commands.
 * The existing dcDc output is an illustrative UI projection, not the LV plant feedback.
 */
export function stepVehicleSystemsWithLv(
 previous:SystemState,input:SystemInput,lvPrevious:LvState,
 lvObservations:LvInput,dt=.02,bms?:BmsResult
):{vehicle:SystemOutput;lv:LvResult}{
 const lv=stepLv(lvPrevious,lvObservations,dt)
 const vehicle=stepVehicleSystems(previous,input,dt,bms)
 vehicle.dcDc={active:lv.commands.dcdcEnable,voltageV:lv.feedback.lvVoltageObservedV}
 if(lv.diagnostics.fault)vehicle.diagnostics.push(`LV_${lv.diagnostics.fault}`)
 vehicle.diagnostics.push(...lv.diagnostics.limitReasons.filter(reason=>reason!==`LV_${lv.diagnostics.fault}`))
 // LV manager does not directly seize HV/motor/brake authority. Integration of voltage-dependent
 // ECU resets is a separate model, requiring an explicit ECU brownout/communication contract.
 return{vehicle,lv}
}

import {stepCommunicationDiagnostics} from './communicationDiagnosticsModel.ts'
import type {DiagnosticState,DiagnosticInput,DiagnosticChannelConfig,DiagnosticResult} from './communicationDiagnosticsModel.ts'
/** Opt-in diagnostic overlay. Does NOT invent CAN samples or automatically override safety-critical ECU commands.
 * The owner ECU must interpret diagnostic.requests against its specific safety policy.
 */
export function stepVehicleSystemsWithDiagnostics(
 previous:SystemState,input:SystemInput,diagnosticPrevious:DiagnosticState,
 observations:DiagnosticInput,channels:DiagnosticChannelConfig[],dt=.02,bms?:BmsResult
):{vehicle:SystemOutput;communicationDiagnostics:DiagnosticResult}{
 const communicationDiagnostics=stepCommunicationDiagnostics(diagnosticPrevious,observations,channels,dt)
 const vehicle=stepVehicleSystems(previous,input,dt,bms)
 vehicle.diagnostics.push(...communicationDiagnostics.diagnosticIds.map(id=>`COMM_${id}`))
 return {vehicle,communicationDiagnostics}
}
