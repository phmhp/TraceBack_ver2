/** TraceBack v15: educational wheel/tire/chassis plant and ABS/TCS/ESC supervisory control.
 * NOT a homologated physics model, tire model, ESC strategy or safety-rated controller.
 * SI units, deterministic fixed step. Positive yaw/steer is left; forward-only vehicle.
 */
export type Wheels = {fl:number;fr:number;rl:number;rr:number};
export type StabilityState = {absActive:Wheels;absHoldSec:Wheels;tcsActive:boolean;tcsHoldSec:number;escActive:boolean;escHoldSec:number;lastDriveScale:number};
export type ChassisState = {xM:number;yM:number;headingRad:number;speedMs:number;sideSpeedMs:number;yawRateRadSec:number;wheelRadSec:Wheels};
export type MotionInput = {steerRoadWheelRad:number;driveForceRequestN:number;regenBrakeRequestN:number;frictionBrakeRequestN:number;roadMu:number;gradeRad?:number;windSpeedMs?:number;wheelSensorAgeMs?:number;speedSensorAgeMs?:number;yawSensorAgeMs?:number;enableAbs?:boolean;enableTcs?:boolean;enableEsc?:boolean;faults?:{wheelSpeedStuck?:Partial<Wheels>;yawSensorBiasRadSec?:number;absUnavailable?:boolean;tcsUnavailable?:boolean;escUnavailable?:boolean}};
export type StabilityOutput = {state:StabilityState;absActive:boolean;absBrakeScale:Wheels;tcsActive:boolean;tcsTorqueScale:number;escActive:boolean;escDifferentialBrakeN:Wheels;referenceYawRateRadSec:number;observedYawRateRadSec:number;wheelSlip:Wheels;diagnostics:string[]};
export type ChassisOutput = {state:ChassisState;longitudinalAccelerationMs2:number;lateralAccelerationMs2:number;yawAccelerationRadSec2:number;appliedDriveN:number;appliedBrakingN:number;wheelLongitudinalForcesN:Wheels;tractionSaturated:boolean};
export const MOTION_DT_SEC=.02;
export const CHASSIS={massKg:1500,wheelbaseM:2.65,frontAxleToComM:1.22,rearAxleToComM:1.43,trackM:1.55,wheelRadiusM:.425,wheelInertiaKgM2:1.65,yawInertiaKgM2:2450,gravityMs2:9.81,rollingCrr:.012,airCdA:0.69,airDensityKgM3:1.225,frontCorneringStiffnessNPerRad:62000,rearCorneringStiffnessNPerRad:63000,slipStiffnessN:32000,maxSteerRad:.52,maxSpeedMs:70} as const;
const wheelNames=(['fl','fr','rl','rr'] as const);
const zeroW=():Wheels=>({fl:0,fr:0,rl:0,rr:0});
const allW=(v:number):Wheels=>({fl:v,fr:v,rl:v,rr:v});
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const finite=(...x:number[])=>x.every(Number.isFinite);
export function createMotionState():ChassisState{return{xM:0,yM:0,headingRad:0,speedMs:0,sideSpeedMs:0,yawRateRadSec:0,wheelRadSec:zeroW()}}
export function createStabilityState():StabilityState{return{absActive:zeroW(),absHoldSec:zeroW(),tcsActive:false,tcsHoldSec:0,escActive:false,escHoldSec:0,lastDriveScale:1}}
/** Plain wheel slip: positive means driven wheel spinning faster, negative means braking wheel slower. */
export function motionSlip(chassis:ChassisState):Wheels{
 const result=zeroW();const v=Math.max(1,Math.abs(chassis.speedMs));
 for(const w of wheelNames)result[w]=clamp((chassis.wheelRadSec[w]*CHASSIS.wheelRadiusM-chassis.speedMs)/v,-1.5,1.5);
 return result;
}
/** Supervisory control uses observations from BEFORE current commands affect the chassis. */
export function stepStability(previous:StabilityState,chassis:ChassisState,input:MotionInput,dt=MOTION_DT_SEC):StabilityOutput{
 if(!finite(dt,input.roadMu,input.steerRoadWheelRad,input.driveForceRequestN,input.regenBrakeRequestN,input.frictionBrakeRequestN)||dt<=0||dt>.1||input.roadMu<.05||input.roadMu>1.5||Math.abs(input.steerRoadWheelRad)>CHASSIS.maxSteerRad||input.driveForceRequestN<0||input.regenBrakeRequestN<0||input.frictionBrakeRequestN<0)throw Error('INVALID_MOTION_CONTROL_INPUT');
 const diagnostics:string[]=[];
 const wheelAge=input.wheelSensorAgeMs??0,speedAge=input.speedSensorAgeMs??0,yawAge=input.yawSensorAgeMs??0;
 const ageOk=finite(wheelAge,speedAge,yawAge)&&wheelAge>=0&&speedAge>=0&&yawAge>=0&&wheelAge<=100&&speedAge<=100&&yawAge<=100;
 if(!ageOk)diagnostics.push('MOTION_SENSOR_STALE');
 const badWheels=wheelNames.some(w=>!finite(chassis.wheelRadSec[w])||chassis.wheelRadSec[w]<0||chassis.wheelRadSec[w]>600);
 if(badWheels||!finite(chassis.speedMs,chassis.yawRateRadSec)||chassis.speedMs<0)diagnostics.push('MOTION_SENSOR_INVALID');
 const sensorValid=ageOk&&!badWheels&&diagnostics.length===0;
 const observedWheels:Wheels={...chassis.wheelRadSec,...input.faults?.wheelSpeedStuck};
 const slips=motionSlip({...chassis,wheelRadSec:observedWheels});
 const speed=chassis.speedMs;
 const canAbs=sensorValid&&speed>2;
 const canTcs=sensorValid&&speed>.5;
 const canEsc=sensorValid&&speed>4;
 const absScale=allW(1),absActive=zeroW(),absHold=zeroW();
 for(const w of wheelNames){
  const was=!!previous.absActive[w],engage=canAbs&&(input.enableAbs??true)&&!input.faults?.absUnavailable&&
   input.frictionBrakeRequestN+input.regenBrakeRequestN>100 && slips[w]<-.19;
  const continueHold=was&&slips[w]<-.07&&canAbs&&(input.enableAbs??true)&&!input.faults?.absUnavailable;
  const active=engage||continueHold;
  absActive[w]=active?1:0;
  absHold[w]=active?previous.absHoldSec[w]+dt:0;
  absScale[w]=active?.23:1;
 }
 const tcsEngage=canTcs&&(input.enableTcs??true)&&!input.faults?.tcsUnavailable&&input.driveForceRequestN>100&&Math.max(slips.rl,slips.rr)>.16;
 const tcsActive=tcsEngage||(previous.tcsActive&&canTcs&&(input.enableTcs??true)&&!input.faults?.tcsUnavailable&&Math.max(slips.rl,slips.rr)>.07);
 const tcsScale=tcsActive?.42:1;
 const requestedYaw=clamp(speed/CHASSIS.wheelbaseM*Math.tan(input.steerRoadWheelRad),-input.roadMu*CHASSIS.gravityMs2/Math.max(speed,1),input.roadMu*CHASSIS.gravityMs2/Math.max(speed,1));
 const observedYaw=chassis.yawRateRadSec+(input.faults?.yawSensorBiasRadSec??0);
 const yawError=requestedYaw-observedYaw;
 const escEngage=canEsc&&(input.enableEsc??true)&&!input.faults?.escUnavailable&&Math.abs(yawError)>.21&&Math.abs(input.steerRoadWheelRad)>.035;
 const escActive=escEngage||(previous.escActive&&canEsc&&(input.enableEsc??true)&&!input.faults?.escUnavailable&&Math.abs(yawError)>.08);
 // Differential brake at rear LEFT for positive yaw, RIGHT for negative yaw.
 const escBrakes=zeroW();
 if(escActive){const force=clamp(Math.abs(yawError)*1200,0,1350);if(yawError>0)escBrakes.rl=force;else escBrakes.rr=force;}
 if(input.faults?.absUnavailable)diagnostics.push('ABS_ACTUATION_UNAVAILABLE');
 if(input.faults?.tcsUnavailable)diagnostics.push('TCS_ACTUATION_UNAVAILABLE');
 if(input.faults?.escUnavailable)diagnostics.push('ESC_ACTUATION_UNAVAILABLE');
 const state:StabilityState={absActive,absHoldSec:absHold,tcsActive,tcsHoldSec:tcsActive?previous.tcsHoldSec+dt:0,escActive,escHoldSec:escActive?previous.escHoldSec+dt:0,lastDriveScale:tcsScale};
 return{state,absActive:wheelNames.some(w=>!!absActive[w]),absBrakeScale:absScale,tcsActive,tcsTorqueScale:tcsScale,escActive,escDifferentialBrakeN:escBrakes,referenceYawRateRadSec:requestedYaw,observedYawRateRadSec:observedYaw,wheelSlip:slips,diagnostics};
}
/** Toy two-DOF bicycle chassis plus four-wheel longitudinal slip and friction-limited tire forces.
 * Force requests are not measurements. The resulting tire forces are independently bounded by mu*Fz.
 */
export function stepChassis(previous:ChassisState,input:MotionInput,command:StabilityOutput,dt=MOTION_DT_SEC):ChassisOutput{
 if(!finite(dt,input.roadMu,input.steerRoadWheelRad,input.driveForceRequestN,input.regenBrakeRequestN,input.frictionBrakeRequestN,previous.speedMs,previous.sideSpeedMs,previous.yawRateRadSec)||dt<=0||dt>.1||input.roadMu<.05||input.roadMu>1.5||Math.abs(input.steerRoadWheelRad)>CHASSIS.maxSteerRad||input.driveForceRequestN<0||input.regenBrakeRequestN<0||input.frictionBrakeRequestN<0)throw Error('INVALID_CHASSIS_INPUT');
 const c=CHASSIS,v=previous.speedMs,mu=input.roadMu;
 const frontLoad=c.massKg*c.gravityMs2*c.rearAxleToComM/c.wheelbaseM;
 const rearLoad=c.massKg*c.gravityMs2*c.frontAxleToComM/c.wheelbaseM;
 // Slip-angle forces; at near standstill fade their response to avoid divide-by-zero.
 const speedForSlip=Math.max(3,v);
 const frontSlipAngle=input.steerRoadWheelRad-Math.atan2(previous.sideSpeedMs+c.frontAxleToComM*previous.yawRateRadSec,speedForSlip);
 const rearSlipAngle=-Math.atan2(previous.sideSpeedMs-c.rearAxleToComM*previous.yawRateRadSec,speedForSlip);
 const frontLat=clamp(c.frontCorneringStiffnessNPerRad*frontSlipAngle,-mu*frontLoad,mu*frontLoad)*clamp(v/3,0,1);
 const rearLat=clamp(c.rearCorneringStiffnessNPerRad*rearSlipAngle,-mu*rearLoad,mu*rearLoad)*clamp(v/3,0,1);
 const lateralPerWheel:Wheels={fl:frontLat/2,fr:frontLat/2,rl:rearLat/2,rr:rearLat/2};
 const normalPerWheel:Wheels={fl:frontLoad/2,fr:frontLoad/2,rl:rearLoad/2,rr:rearLoad/2};
 const xForces=zeroW(),nextWheel=zeroW();let saturated=false;
 const drive= input.driveForceRequestN*command.tcsTorqueScale/2;
 const regularBrake=(input.regenBrakeRequestN+input.frictionBrakeRequestN)/4;
 let totalDrive=0,totalBraking=0;
 for(const w of wheelNames){
  const commandedDrive=(w==='rl'||w==='rr')?drive:0;
  const commandedBrake=(regularBrake+command.escDifferentialBrakeN[w])*command.absBrakeScale[w];
  const maxLong=Math.sqrt(Math.max(0,(mu*normalPerWheel[w])**2-lateralPerWheel[w]**2));
  // Educational tire equilibrium + wheel-inertia excess-force response.
  // Pure explicit stiff-slip Euler at 20ms is numerically unstable near standstill.
  // Inside friction capability, force follows demand and wheel speed relaxes to a
  // small equilibrium slip; beyond capability, excess torque accelerates/slows wheel.
  const desiredForce=commandedDrive-commandedBrake;
  const contactForce=clamp(desiredForce,-maxLong,maxLong);
  const excessForce=desiredForce-contactForce;
  if(Math.abs(excessForce)>1e-6)saturated=true;
  xForces[w]=contactForce;
  const equilibriumSlip=contactForce/c.slipStiffnessN;
  const targetOmega=Math.max(0,(v+equilibriumSlip*Math.max(v,1))/c.wheelRadiusM);
  const wheelSpeed=previous.wheelRadSec[w];
  const wheelAccelFromExcess=excessForce*c.wheelRadiusM/c.wheelInertiaKgM2;
  nextWheel[w]=clamp(wheelSpeed+(targetOmega-wheelSpeed)*clamp(dt/.05,0,1)+wheelAccelFromExcess*dt,0,600);
  if(v<.5&&Math.abs(desiredForce)<1)nextWheel[w]=0;
  totalDrive+=Math.max(0,contactForce);totalBraking+=Math.max(0,-contactForce);
 }
 const fwdForce=wheelNames.reduce((a,w)=>a+xForces[w],0);
 const aero=.5*c.airDensityKgM3*c.airCdA*(v-(input.windSpeedMs??0))*Math.abs(v-(input.windSpeedMs??0));
 const rolling=v>.05?c.massKg*c.gravityMs2*c.rollingCrr:0;
 const grade=c.massKg*c.gravityMs2*Math.sin(input.gradeRad??0);
 const accel=(fwdForce-aero-rolling-grade)/c.massKg+previous.sideSpeedMs*previous.yawRateRadSec;
 const lateralAccel=(frontLat+rearLat)/c.massKg-v*previous.yawRateRadSec;
 let yawMoment=c.frontAxleToComM*frontLat-c.rearAxleToComM*rearLat;
 for(const w of wheelNames){const y=w.endsWith('l')?c.trackM/2:-c.trackM/2;yawMoment-=y*xForces[w];}
 const yawAccel=yawMoment/c.yawInertiaKgM2;
 const speed=clamp(v+accel*dt,0,c.maxSpeedMs);
 const side=clamp((previous.sideSpeedMs+lateralAccel*dt)*.995,-Math.max(1,speed*.6),Math.max(1,speed*.6));
 const yaw=clamp(previous.yawRateRadSec+yawAccel*dt,-2.5,2.5);
 const heading=previous.headingRad+yaw*dt;
 const x=previous.xM+(speed*Math.cos(heading)-side*Math.sin(heading))*dt;
 const y=previous.yM+(speed*Math.sin(heading)+side*Math.cos(heading))*dt;
 return{state:{xM:x,yM:y,headingRad:heading,speedMs:speed,sideSpeedMs:side,yawRateRadSec:yaw,wheelRadSec:nextWheel},longitudinalAccelerationMs2:accel,lateralAccelerationMs2:lateralAccel,yawAccelerationRadSec2:yawAccel,appliedDriveN:totalDrive,appliedBrakingN:totalBraking,wheelLongitudinalForcesN:xForces,tractionSaturated:saturated};
}
