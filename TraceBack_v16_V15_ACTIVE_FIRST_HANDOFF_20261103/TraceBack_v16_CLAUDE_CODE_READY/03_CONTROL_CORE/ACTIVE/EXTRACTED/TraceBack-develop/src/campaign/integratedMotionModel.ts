/** v15 additive adapter: v14 supervisor -> virtual actuators -> toy wheel/tire/chassis -> next-tick sensors.
 * NO changes to the v14 ECU core. Reference input remains the complete v14 input fixture.
 * Motion state is owned HERE, never by React/Three.js or scene animation.
 */
import {createIntegratedVehicleState,stepIntegratedVehicle,INTEGRATED_DT_SEC,INTEGRATED_LONGITUDINAL,
 type IntegratedVehicleInput,type IntegratedVehicleResult,type IntegratedVehicleState} from './integratedVehicleModel.ts';
import {CHASSIS,createMotionState,createStabilityState,stepStability,stepChassis,
 type MotionInput,type ChassisState,type StabilityState,type StabilityOutput,type ChassisOutput} from './motionControlModel.ts';
export type IntegratedMotionState={vehicle:IntegratedVehicleState;chassis:ChassisState;stability:StabilityState};
export type IntegratedMotionInput={vehicle:IntegratedVehicleInput;steerRoadWheelRad:number;roadMu:number;gradeRad?:number;windSpeedMs?:number;
 wheelSensorAgeMs?:number;speedSensorAgeMs?:number;yawSensorAgeMs?:number;stabilityFaults?:MotionInput['faults'];
 enableAbs?:boolean;enableTcs?:boolean;enableEsc?:boolean};
export type IntegratedMotionResult={state:IntegratedMotionState;vehicle:IntegratedVehicleResult;stability:StabilityOutput;chassis:ChassisOutput;
 telemetry:{speedKmh:number;xM:number;yM:number;headingRad:number;yawRateRadSec:number;wheelRadSec:ChassisState['wheelRadSec'];motorTorqueNm:number;actualRegenForceN:number;actualFrictionForceN:number;absActive:boolean;tcsActive:boolean;escActive:boolean;tractionSaturated:boolean}};
export function createIntegratedMotionState():IntegratedMotionState{return{vehicle:createIntegratedVehicleState(),chassis:createMotionState(),stability:createStabilityState()}}
export function stepIntegratedMotion(previous:IntegratedMotionState,input:IntegratedMotionInput,dtSec=INTEGRATED_DT_SEC):IntegratedMotionResult{
 if(!Number.isFinite(dtSec)||dtSec<=0||dtSec>.1)throw Error('INVALID_MOTION_DT');
 // The virtual sensor reads PREVIOUS chassis state; commands change the plant only afterwards.
 const speedKmh=Math.min(300,previous.chassis.speedMs*3.6);
 const motorSpeedRpm= Math.min(30000,previous.chassis.speedMs/CHASSIS.wheelRadiusM*INTEGRATED_LONGITUDINAL.gearRatio*60/(2*Math.PI));
 const vIn:IntegratedVehicleInput={...input.vehicle,speedKmh,motorSpeedRpm,steeringAngleRad:input.vehicle.steeringAngleRad};
 const previousMotorForce=Math.max(0,previous.vehicle.motorPlant.actualTorqueNm*INTEGRATED_LONGITUDINAL.gearRatio*INTEGRATED_LONGITUDINAL.drivelineEfficiency/CHASSIS.wheelRadiusM);
 const previousBrake=previous.vehicle.brakePlant;
 const supervisorInput:MotionInput={steerRoadWheelRad:input.steerRoadWheelRad,driveForceRequestN:previousMotorForce,
  regenBrakeRequestN:previousBrake.actualRegenForceN,frictionBrakeRequestN:previousBrake.actualFrictionForceN,
  roadMu:input.roadMu,gradeRad:input.gradeRad,windSpeedMs:input.windSpeedMs,wheelSensorAgeMs:input.wheelSensorAgeMs,
  speedSensorAgeMs:input.speedSensorAgeMs,yawSensorAgeMs:input.yawSensorAgeMs,enableAbs:input.enableAbs,enableTcs:input.enableTcs,enableEsc:input.enableEsc,faults:input.stabilityFaults};
 const stability=stepStability(previous.stability,previous.chassis,supervisorInput,dtSec);
 // TCS limits available *positive* drive torque before v14 computes its new command.
 // A safe brake intervention overrides regen via the pre-existing v14 ABS input.
 vIn.motorMaxTorqueNm=Math.max(0,input.vehicle.motorMaxTorqueNm*stability.tcsTorqueScale);
 vIn.absIntervention=stability.absActive || !!input.vehicle.absIntervention;
 const vehicle=stepIntegratedVehicle(previous.vehicle,vIn,dtSec);
 const drive=Math.max(0,vehicle.actual.motorTorqueNm*INTEGRATED_LONGITUDINAL.gearRatio*INTEGRATED_LONGITUDINAL.drivelineEfficiency/CHASSIS.wheelRadiusM);
 const plantInput:MotionInput={...supervisorInput,driveForceRequestN:drive,
  regenBrakeRequestN:Math.max(0,vehicle.actual.regenForceN),frictionBrakeRequestN:Math.max(0,vehicle.actual.frictionForceN)};
 // TCS has already reduced the ECU available motor torque above; do not derate twice.
 const plantStability={...stability,tcsTorqueScale:1};
 const chassis=stepChassis(previous.chassis,plantInput,plantStability,dtSec);
 const state:IntegratedMotionState={vehicle:vehicle.state,chassis:chassis.state,stability:stability.state};
 return{state,vehicle,stability,chassis,telemetry:{speedKmh:chassis.state.speedMs*3.6,xM:chassis.state.xM,yM:chassis.state.yM,
  headingRad:chassis.state.headingRad,yawRateRadSec:chassis.state.yawRateRadSec,wheelRadSec:chassis.state.wheelRadSec,
  motorTorqueNm:vehicle.actual.motorTorqueNm,actualRegenForceN:vehicle.actual.regenForceN,actualFrictionForceN:vehicle.actual.frictionForceN,
  absActive:stability.absActive,tcsActive:stability.tcsActive,escActive:stability.escActive,tractionSaturated:chassis.tractionSaturated}};
}
