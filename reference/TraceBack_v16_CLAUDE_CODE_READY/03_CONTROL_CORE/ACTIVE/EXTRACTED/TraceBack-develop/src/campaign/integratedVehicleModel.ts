/** TraceBack educational multi-domain BEV integration. NOT safety-certified vehicle software.
 * One deterministic synchronous sample (default 20ms): read independent PREVIOUS plant feedback,
 * evaluate ECU supervisors in declared order, then advance toy actuators once.
 * Game scene state is deliberately absent. No automatic OTA, physical repair or UI bindings.
 */
import {INITIAL_BMS_STATE, stepBms, type BmsInputs, type BmsResult, type BmsState} from './bmsModel.ts';
import {INITIAL_HV_STATE,INITIAL_HV_PLANT,stepHv,stepHvPlant,type HvState,type HvPlantState,type HvPlantFaults,type HvResult} from './hvModel.ts';
import {INITIAL_VEHICLE_MODE_STATE,stepVehicleMode,type VehicleModeState,type VehicleModeResult} from './vehicleModeModel.ts';
import {INITIAL_GEAR_STATE,INITIAL_GEAR_PLANT,stepGearInterlock,stepGearPlant,type GearState,type GearPlant,type GearOutput,type GearPosition} from './gearInterlockModel.ts';
import {INITIAL_PROPULSION_STATE,INITIAL_PROPULSION_PLANT,stepPropulsion,stepPropulsionPlant,type PropulsionState,type PropulsionPlant,type PropulsionResult} from './propulsionModel.ts';
import {INITIAL_BRAKE_STATE,INITIAL_BRAKE_PLANT,stepBraking,stepBrakePlant,type BrakeState,type BrakePlant,type BrakeResult} from './brakingModel.ts';
import {INITIAL_EPS_STATE,INITIAL_EPS_PLANT,stepEps,stepEpsPlant,type EpsState,type EpsPlant,type EpsResult} from './epsModel.ts';
import {INITIAL_THERMAL_STATE,INITIAL_THERMAL_PLANT,stepThermal,stepThermalPlant,type ThermalState,type ThermalPlantState,type ThermalResult,type ThermalPlantFault} from './thermalModel.ts';
import {INITIAL_LV_STATE,INITIAL_LV_PLANT,stepLv,stepLvPlant,type LvState,type LvPlantState,type LvResult,type LvPlantFault} from './lvPowerModel.ts';
import {INITIAL_DIAGNOSTIC_STATE,stepCommunicationDiagnostics,diagnosticPolicyForFunction,type DiagnosticState,type DiagnosticResult,type DiagnosticChannelConfig,type DiagnosticObservation,type DiagnosticPolicy} from './communicationDiagnosticsModel.ts';

export const INTEGRATED_DT_SEC = .02;
export const INTEGRATED_BRAKE_OVERRIDE_PCT = 5;
/** Toy longitudinal observation only; game chassis physics retains ownership of actual vehicle speed. */
export const INTEGRATED_LONGITUDINAL={vehicleMassKg:1500,gearRatio:7,drivelineEfficiency:.9,wheelRadiusM:.425} as const;
/** Signal ages are from CAN/sensor measurements; plant feedback from last tick is not an ECU command. */
export type IntegratedVehicleInput = {
 bms:BmsInputs;
 startEdge:boolean;stopEdge:boolean;resetRequested:boolean;
 requestedGear:GearPosition;gearRequestAgeMs:number;
 brakePedalPct:number;brakeAgeMs:number;pedalA_pct:number;pedalB_pct:number;pedalAgeMs:number;
 speedKmh:number;motorSpeedRpm:number;motorMaxTorqueNm:number;
 driverSteerTorqueNm:number;steeringAngleRad:number;epsMotorTempC:number;epsMotorCurrentLimitA:number;
 ambientTempC:number;absIntervention:boolean;
 plugged:boolean;hvilOk:boolean;initChecksOk:boolean;recoverableFault:boolean;criticalFault:boolean;
 signalAgeMs:number;feedbackAgeMs:number;
 lvLoadRequestW:number;lvCriticalLoadW:number;dcdcHealthy:boolean;
 /** SW-specific diagnosed channels; policy mapping must be explicitly supplied, not assumed. */
 diagnosticObservations?:DiagnosticObservation[];
 diagnosticConfigs?:DiagnosticChannelConfig[];
 diagnosticDomainChannels?:{propulsion?:string[];vehicle?:string[]};
 /** Toy hardware faults: these change actual plant response, never ECU calculated commands. */
 plantFaults?:{hv?:HvPlantFaults;gearStuck?:boolean;motorStuck?:boolean;brake?:{stuckRegen?:boolean;stuckFriction?:boolean};
  thermal?:ThermalPlantFault;eps?:{stuck?:boolean;effectiveness?:number};lv?:LvPlantFault};
 /** Heat from drive load in deg C/sec for illustrative plant only. */
 heatLoadCPerSec?:number;
};
export type IntegratedVehicleState={
 tick:number; timeSec:number;
 bms:BmsState;hv:HvState;hvPlant:HvPlantState;vehicle:VehicleModeState;gear:GearState;gearPlant:GearPlant;
 propulsion:PropulsionState;motorPlant:PropulsionPlant;brake:BrakeState;brakePlant:BrakePlant;
 thermal:ThermalState;thermalPlant:ThermalPlantState;eps:EpsState;epsPlant:EpsPlant;
 lv:LvState;lvPlant:LvPlantState;diagnostics:DiagnosticState;
};
export type IntegratedVehicleResult={
 state:IntegratedVehicleState;
 /** Readouts from BEFORE current commands affected the plant: one-tick causal sampling. */
 measured:{gear:GearPosition;hvMainClosed:boolean;dcLinkVoltageV:number;motorTorqueNm:number;
  regenForceN:number;frictionForceN:number;fanOn:boolean;pumpPct:number;lvVoltageV:number};
 ecu:{bms:BmsResult;hv:HvResult;vehicle:VehicleModeResult;gear:GearOutput;
  propulsion:PropulsionResult;braking:BrakeResult;thermal:ThermalResult;eps:EpsResult;lv:LvResult;diagnostics:DiagnosticResult};
 /** Newly advanced physical response, not an ECU command nor feedback available in the same tick. */
 actual:{gear:GearPosition;hvMainClosed:boolean;motorTorqueNm:number;regenForceN:number;frictionForceN:number;
  fanOn:boolean;pumpPct:number;lvVoltageV:number;motorTempC:number;longitudinalNetForceN:number;accelerationEstimateMs2:number};
 arbitration:{propulsionEnabled:boolean;propulsionTorqueNm:number;thermalTorqueScale:number;
  chargeLimitKw:number;dischargeLimitKw:number;regenRequestN:number;frictionRequestN:number;
  brakeOverrideActive:boolean;diagnosticPropulsionPolicy:DiagnosticPolicy;
  appliedRestrictions:string[]};
};
export function createIntegratedVehicleState():IntegratedVehicleState{
 return {tick:0,timeSec:0,bms:{...INITIAL_BMS_STATE},hv:{...INITIAL_HV_STATE},hvPlant:{...INITIAL_HV_PLANT},
 vehicle:{...INITIAL_VEHICLE_MODE_STATE},gear:{...INITIAL_GEAR_STATE},gearPlant:{...INITIAL_GEAR_PLANT},
 propulsion:{...INITIAL_PROPULSION_STATE},motorPlant:{...INITIAL_PROPULSION_PLANT},brake:{...INITIAL_BRAKE_STATE},brakePlant:{...INITIAL_BRAKE_PLANT},
 thermal:{...INITIAL_THERMAL_STATE},thermalPlant:{...INITIAL_THERMAL_PLANT},eps:{...INITIAL_EPS_STATE},epsPlant:{...INITIAL_EPS_PLANT},
 lv:{...INITIAL_LV_STATE},lvPlant:{...INITIAL_LV_PLANT},diagnostics:{channels:{}}};
}
const validNumber=(x:number)=>Number.isFinite(x);
/** Fixed update ordering prevents circular instant-feedback and double-stepping. */
export function stepIntegratedVehicle(previous:IntegratedVehicleState,i:IntegratedVehicleInput,dtSec=INTEGRATED_DT_SEC):IntegratedVehicleResult{
 if(!validNumber(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_INTEGRATION_DT');
 if(!validNumber(i.speedKmh)||i.speedKmh<0||i.speedKmh>300||!validNumber(i.motorSpeedRpm)||i.motorSpeedRpm<0||i.motorSpeedRpm>30000||!validNumber(i.signalAgeMs)||i.signalAgeMs<0||!validNumber(i.feedbackAgeMs)||i.feedbackAgeMs<0)throw Error('INVALID_INTEGRATION_OBSERVATION');
 const age=i.signalAgeMs,feedbackAge=i.feedbackAgeMs,p=previous;
 const observed={gear:p.gearPlant.actualGear,hvMainClosed:p.hvPlant.mainClosed,dcLinkVoltageV:p.hvPlant.dcLinkVoltageV,
 motorTorqueNm:p.motorPlant.actualTorqueNm,regenForceN:p.brakePlant.actualRegenForceN,frictionForceN:p.brakePlant.actualFrictionForceN,
 fanOn:p.thermalPlant.actualFanOn,pumpPct:p.thermalPlant.actualPumpPct,lvVoltageV:p.lvPlant.lvVoltageV};
 const diagnostics=stepCommunicationDiagnostics(p.diagnostics,{observations:i.diagnosticObservations??[],resetRequested:i.resetRequested,resetPermitted:i.speedKmh<=.5},i.diagnosticConfigs??[],dtSec);
 const vehiclePolicy=diagnosticPolicyForFunction(diagnostics,i.diagnosticDomainChannels?.vehicle??[]);
 const propulsionPolicy=diagnosticPolicyForFunction(diagnostics,i.diagnosticDomainChannels?.propulsion??[]);
 const bms=stepBms(p.bms,i.bms,dtSec);
 const thermal=stepThermal(p.thermal,{motorTempC:p.thermalPlant.motorTempC,inverterTempC:p.thermalPlant.inverterTempC,
 batteryTempC:p.thermalPlant.batteryTempC,coolantTempC:p.thermalPlant.coolantTempC,ambientTempC:i.ambientTempC,
 temperatureSignalAgeMs:age,fanObservedOn:observed.fanOn,pumpObservedPct:observed.pumpPct,feedbackAgeMs:feedbackAge,
 systemEnabled:true,vehicleSpeedKmh:i.speedKmh,resetRequested:i.resetRequested},dtSec);
 // HV takes PREVIOUS VCU mode request; BMS SHUTDOWN / thermal critical override immediately.
 const hvStartPermit=p.vehicle.mode==='HV_PREPARING';
 const hvStopRequested=(i.stopEdge&&i.speedKmh<=.5)||p.vehicle.mode==='FAULT'||thermal.command.shutdownRequested||vehiclePolicy==='INHIBIT_FUNCTION';
 const hv=stepHv(p.hv,{startPermit:hvStartPermit,stopRequested:hvStopRequested,resetRequested:i.resetRequested,
 packSafe:bms.packAvailable,hvilOk:i.hvilOk,insulationOk:i.bms.isolationOk,
 bmsShutdownRequested:bms.commands.shutdownRequested||thermal.command.shutdownRequested,
 packVoltageV:i.bms.packVoltageV,dcLinkVoltageV:observed.dcLinkVoltageV,
 prechargeFeedbackClosed:p.hvPlant.prechargeClosed,mainFeedbackClosed:observed.hvMainClosed,
 signalAgeMs:age,vehicleSpeedKmh:i.speedKmh},dtSec);
 const brakeValid=validNumber(i.brakePedalPct)&&i.brakePedalPct>=0&&i.brakePedalPct<=100&&
  validNumber(i.brakeAgeMs)&&i.brakeAgeMs>=0&&i.brakeAgeMs<=100;
 const vehicle=stepVehicleMode(p.vehicle,{startEdge:i.startEdge,stopEdge:i.stopEdge,resetRequested:i.resetRequested,
 gear:observed.gear,brakePct:brakeValid?i.brakePedalPct:NaN,speedKmh:i.speedKmh,
 plugged:i.plugged,signalAgeMs:age,initChecksOk:i.initChecksOk,
 hvMode:hv.mode,hvReady:hv.hvReady,bmsMode:bms.mode,packAvailable:bms.packAvailable,
 recoverableFault:i.recoverableFault||thermal.mode==='DERATED'||vehiclePolicy==='LIMIT_FUNCTION',
 criticalFault:i.criticalFault||thermal.command.shutdownRequested||vehiclePolicy==='INHIBIT_FUNCTION'},dtSec);
 const gear=stepGearInterlock(p.gear,{requestedGear:i.requestedGear,observedGear:observed.gear,requestAgeMs:i.gearRequestAgeMs,feedbackAgeMs:feedbackAge,
 speedKmh:i.speedKmh,brakePct:brakeValid?i.brakePedalPct:NaN,vehicleReady:vehicle.permissions.vehicleReady,powerAvailable:bms.packAvailable&&hv.hvReady,
 interlockOk:i.hvilOk,blockingFault:vehicle.mode==='FAULT'||vehiclePolicy==='INHIBIT_FUNCTION',resetRequested:i.resetRequested},dtSec);
 const lv=stepLv(p.lv,{hvReady:hv.hvReady,lvVoltageV:p.lvPlant.lvVoltageV,lvBatterySocPct:p.lvPlant.lvBatterySocPct,
 lvLoadRequestW:i.lvLoadRequestW,criticalLoadRequestW:i.lvCriticalLoadW,dcdcHealthy:i.dcdcHealthy,
 dcdcObservedActive:p.lvPlant.dcdcActive,dcdcObservedVoltageV:p.lvPlant.dcdcOutputVoltageV,
 signalAgeMs:age,feedbackAgeMs:feedbackAge,vehicleSpeedKmh:i.speedKmh,resetRequested:i.resetRequested},dtSec);
 const lvValid=lv.feedback.lvPowerAvailable;
 const restriction:string[]=[];
 if(!brakeValid)restriction.push('BRAKE_INPUT_INVALID');
 if(!bms.packAvailable)restriction.push('BMS_NOT_AVAILABLE');
 if(!hv.hvReady)restriction.push('HV_NOT_READY');
 if(!vehicle.permissions.driveAllowed)restriction.push('VCU_DRIVE_NOT_ALLOWED');
 if(!gear.permissions.forwardAllowed)restriction.push('GEAR_NOT_CONFIRMED_D');
 if(!lvValid)restriction.push('LV_POWER_NOT_AVAILABLE');
 if(thermal.command.shutdownRequested)restriction.push('THERMAL_SHUTDOWN');
 if(propulsionPolicy==='INHIBIT_FUNCTION')restriction.push('DIAGNOSTIC_BLOCK');
 if(propulsionPolicy==='LIMIT_FUNCTION')restriction.push('DIAGNOSTIC_LIMIT');
 const brakeOverride=brakeValid&&i.brakePedalPct>=INTEGRATED_BRAKE_OVERRIDE_PCT;
 if(brakeOverride)restriction.push('BRAKE_OVERRIDE');
 const thermalScale=thermal.command.torqueLimitScale;
 const diagnosticScale=propulsionPolicy==='LIMIT_FUNCTION'?0.25:1;
 const propulsion=stepPropulsion(p.propulsion,{pedalA_pct:i.pedalA_pct,pedalB_pct:i.pedalB_pct,pedalAgeMs:i.pedalAgeMs,
 brakePct:brakeValid?i.brakePedalPct:NaN,vehicleSpeedKmh:i.speedKmh,motorSpeedRpm:i.motorSpeedRpm,
 vehicleReady:vehicle.permissions.vehicleReady,gearForwardConfirmed:gear.permissions.forwardAllowed,
 driveAuthorized:vehicle.permissions.driveAllowed&&lvValid&&hv.hvReady&&brakeValid&&!thermal.command.shutdownRequested&&propulsionPolicy!=='INHIBIT_FUNCTION',
 motorMaxTorqueNm:i.motorMaxTorqueNm,motorTemperatureC:p.thermalPlant.motorTempC,
 bmsDischargeLimitKw:bms.limits.dischargeKw,bmsAvailable:bms.packAvailable,
 vcuTorqueLimitScale:Math.min(vehicle.requests.torqueLimitScale,thermalScale,diagnosticScale),
 observedMotorTorqueNm:observed.motorTorqueNm,motorFeedbackAgeMs:feedbackAge,resetRequested:i.resetRequested},dtSec);
 const braking=stepBraking(p.brake,{brakePedalPct:i.brakePedalPct,brakeSignalAgeMs:i.brakeAgeMs,
 vehicleSpeedKmh:i.speedKmh,motorSpeedRpm:i.motorSpeedRpm,
 forwardGearConfirmed:gear.permissions.forwardAllowed,hvReady:hv.hvReady,bmsAvailable:bms.packAvailable,
 bmsChargeLimitKw:bms.limits.chargeKw,motorRegenLimitNm:100,absIntervention:i.absIntervention,
 observedRegenForceN:observed.regenForceN,observedFrictionForceN:observed.frictionForceN,
 feedbackAgeMs:feedbackAge,resetRequested:i.resetRequested},dtSec);
 const eps=stepEps(p.eps,{driverTorqueNm:i.driverSteerTorqueNm,steeringAngleRad:i.steeringAngleRad,vehicleSpeedKmh:i.speedKmh,
 torqueSignalAgeMs:age,angleSignalAgeMs:age,speedSignalAgeMs:age,epsMotorTempC:i.epsMotorTempC,
 motorCurrentLimitA:i.epsMotorCurrentLimitA,epsPowerAvailable:lvValid,
 observedAssistTorqueNm:p.epsPlant.actualAssistTorqueNm,observedMotorCurrentA:p.epsPlant.actualMotorCurrentA,
 feedbackAgeMs:feedbackAge,resetRequested:i.resetRequested},dtSec);
 const faults=i.plantFaults??{};
 const hvPlant=stepHvPlant(p.hvPlant,hv.commands,i.bms.packVoltageV,dtSec,faults.hv);
 const gearPlant=stepGearPlant(p.gearPlant,gear.command.targetGear,dtSec,faults.gearStuck);
 const motorPlant=stepPropulsionPlant(p.motorPlant,propulsion.command.motorTorqueNm,dtSec,faults.motorStuck);
 const brakePlant=stepBrakePlant(p.brakePlant,braking.command,dtSec,faults.brake);
 const thermalPlant=stepThermalPlant(p.thermalPlant,thermal.command,dtSec,{ambientTempC:i.ambientTempC,heatLoadCPerSec:i.heatLoadCPerSec??.4,fault:faults.thermal});
 const epsPlant=stepEpsPlant(p.epsPlant,eps.command,dtSec,faults.eps);
 const lvPlant=stepLvPlant(p.lvPlant,lv.commands,dtSec,{fault:faults.lv,externalLoadW:lv.commands.suppliedLoadRequestW});
 const driveForceN=motorPlant.actualTorqueNm*INTEGRATED_LONGITUDINAL.gearRatio*INTEGRATED_LONGITUDINAL.drivelineEfficiency/INTEGRATED_LONGITUDINAL.wheelRadiusM;
 const longitudinalNetForceN=driveForceN-brakePlant.actualRegenForceN-brakePlant.actualFrictionForceN;
 const accelerationEstimateMs2=longitudinalNetForceN/INTEGRATED_LONGITUDINAL.vehicleMassKg;
 const state:IntegratedVehicleState={tick:p.tick+1,timeSec:p.timeSec+dtSec,bms:bms.state,hv:hv.state,hvPlant,vehicle:vehicle.state,
 gear:gear.state,gearPlant,propulsion:propulsion.state,motorPlant,brake:braking.state,brakePlant,thermal:thermal.state,thermalPlant,
 eps:eps.state,epsPlant,lv:lv.state,lvPlant,diagnostics:diagnostics.state};
 return {state,measured:observed,ecu:{bms,hv,vehicle,gear,propulsion,braking,thermal,eps,lv,diagnostics},
 actual:{gear:gearPlant.actualGear,hvMainClosed:hvPlant.mainClosed,motorTorqueNm:motorPlant.actualTorqueNm,
 regenForceN:brakePlant.actualRegenForceN,frictionForceN:brakePlant.actualFrictionForceN,fanOn:thermalPlant.actualFanOn,
 pumpPct:thermalPlant.actualPumpPct,lvVoltageV:lvPlant.lvVoltageV,motorTempC:thermalPlant.motorTempC,
 longitudinalNetForceN,accelerationEstimateMs2},
 arbitration:{propulsionEnabled:propulsion.command.driveAllowed,propulsionTorqueNm:propulsion.command.motorTorqueNm,
 thermalTorqueScale:thermalScale,chargeLimitKw:bms.limits.chargeKw,dischargeLimitKw:bms.limits.dischargeKw,
 regenRequestN:braking.command.regenRequestN,frictionRequestN:braking.command.frictionRequestN,
 brakeOverrideActive:brakeOverride,diagnosticPropulsionPolicy:propulsionPolicy,appliedRestrictions:restriction}};
}
/** Initial request builder is a convenient fixture, NOT a live vehicle sensor interface. */
export function createNormalIntegratedInput():IntegratedVehicleInput{
 return {bms:{socPct:65,cellMinV:3.7,cellMaxV:3.9,batteryTempC:30,packCurrentA:0,packVoltageV:380,isolationOk:true,signalAgeMs:20},
 startEdge:false,stopEdge:false,resetRequested:false,requestedGear:'P',gearRequestAgeMs:20,
 brakePedalPct:0,brakeAgeMs:20,pedalA_pct:0,pedalB_pct:0,pedalAgeMs:20,
 speedKmh:0,motorSpeedRpm:0,motorMaxTorqueNm:180,driverSteerTorqueNm:0,steeringAngleRad:0,epsMotorTempC:35,epsMotorCurrentLimitA:60,
 ambientTempC:25,absIntervention:false,plugged:false,hvilOk:true,initChecksOk:true,recoverableFault:false,criticalFault:false,
 signalAgeMs:20,feedbackAgeMs:20,lvLoadRequestW:80,lvCriticalLoadW:60,dcdcHealthy:true};
}
/** Short educational puzzle block inventory; editing these is NOT wired to the game's graph executor. */
export const INTEGRATED_EDUCATIONAL_BLOCKS=[
 {id:'signal-valid',label:'센서와 통신 신호가 유효한가?',owner:'DIAGNOSTICS'},
 {id:'hv-ready',label:'BMS가 허용하고 HV 접촉기가 준비되었는가?',owner:'HV_VCU'},
 {id:'gear-feedback',label:'실제 기어가 D로 확인되었는가?',owner:'GEAR'},
 {id:'torque-min',label:'BMS·열관리·VCU 상한 중 최소값을 적용한다',owner:'PROPULSION'},
 {id:'brake-override',label:'브레이크 우선 조건이면 구동 토크를 차단한다',owner:'PROPULSION'},
 {id:'regen-fill',label:'회생 부족분을 마찰제동으로 보완한다',owner:'BRAKING'},
 {id:'fan-hysteresis',label:'팬의 이전 상태와 ON/OFF 임계값을 비교한다',owner:'THERMAL'},
 {id:'feedback',label:'ECU 명령과 실제 응답이 일치하는가?',owner:'DIAGNOSTICS'},
] as const;
