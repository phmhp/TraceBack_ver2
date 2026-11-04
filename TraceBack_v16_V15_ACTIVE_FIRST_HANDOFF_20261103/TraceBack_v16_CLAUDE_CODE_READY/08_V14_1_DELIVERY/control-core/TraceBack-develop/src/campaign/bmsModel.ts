/** Educational BMS power-limit and diagnostic model (not a production BMS).
 * Time advances only by explicit dt steps. All power values are positive magnitudes in kW.
 * ChargePowerLimit represents permitted battery charging power, including regeneration.
 * It is not an instruction to close contactors or to command actual battery current.
 */
export type BmsMode = 'NORMAL'|'LIMITED'|'FAULT'|'SHUTDOWN_REQUEST'
export type BmsInputs = {
  socPct:number; cellMinV:number; cellMaxV:number; batteryTempC:number;
  packCurrentA:number; packVoltageV:number; isolationOk:boolean;
  /** Input freshness since last received observation; stale beyond 100ms is invalid. */
  signalAgeMs:number;
  /** Diagnostic from independent hardware/monitor, if present. */
  externalCriticalFault?:boolean;
}
export type BmsState = {mode:BmsMode; recoverySeconds:number; previousFaults:string[]}
export type BmsPowerLimits = {dischargeKw:number;chargeKw:number}
export type BmsResult = {
  state:BmsState; mode:BmsMode; packAvailable:boolean; signalValid:boolean;
  limits:BmsPowerLimits;
  /** Requested power ceilings communicated from BMS to VCU/charging controller. */
  commands:{dischargeLimitKw:number;chargeLimitKw:number;shutdownRequested:boolean};
  /** Illustrative sensed power: positive discharge, negative charge. NOT inferred actuator response. */
  observedPackPowerKw:number;
  /** Whether observed electrical power violates the applicable permitted ceiling. */
  observedPowerWithinLimit:boolean;
  faults:string[]; limitingFactors:string[];
}
export const INITIAL_BMS_STATE:BmsState = {mode:'NORMAL',recoverySeconds:0,previousFaults:[]}
// Educational example calibration; not an OEM/battery-chemistry specification.
export const BMS_CALIBRATION = {
  nominalDischargeKw:80, nominalChargeKw:40,
  lowSocCutoffPct:3,lowSocLimitPct:15,highSocChargeLimitPct:90,highSocChargeCutoffPct:98,
  minCellV:2.8,maxCellV:4.25,criticalCellMinV:2.6,criticalCellMaxV:4.35,
  minTempC:-20,maxTempC:55,criticalMinTempC:-30,criticalMaxTempC:65,
  maxCurrentA:300,maxSignalAgeMs:100,recoverySec:0.5,
} as const;
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
/** Piecewise-linear calibration (tables are intentionally tiny and inspectable). */
export function interpolateTable(x:number,table:ReadonlyArray<readonly [number,number]>):number{
 if(x<=table[0][0])return table[0][1];
 for(let i=1;i<table.length;i++){const [x1,y1]=table[i], [x0,y0]=table[i-1];if(x<=x1)return y0+(y1-y0)*(x-x0)/(x1-x0)}
 return table[table.length-1][1];
}
export const BMS_TABLES={
 dischargeSoc:[[0,0],[3,0],[5,.2],[15,1],[100,1]],
 dischargeTemp:[[-40,0],[-20,.2],[0,.5],[15,1],[45,1],[55,.3],[65,0]],
 chargeSoc:[[0,1],[80,1],[90,.5],[98,0],[100,0]],
 chargeTemp:[[-40,0],[-20,0],[-10,.1],[0,.3],[10,.7],[15,1],[40,1],[50,.3],[55,0],[70,0]],
} as const;
const validNumbers=(v:BmsInputs)=>[v.socPct,v.cellMinV,v.cellMaxV,v.batteryTempC,v.packCurrentA,v.packVoltageV,v.signalAgeMs].every(Number.isFinite);
export function stepBms(previous:BmsState,input:BmsInputs,dtSeconds=.02):BmsResult{
 if(!Number.isFinite(dtSeconds)||dtSeconds<=0||dtSeconds>.1)throw Error('INVALID_BMS_DT');
 const c=BMS_CALIBRATION;const faults:string[]=[];const limitingFactors:string[]=[];
 const valid=validNumbers(input)&&input.socPct>=0&&input.socPct<=100&&input.signalAgeMs>=0&&input.signalAgeMs<=c.maxSignalAgeMs&&input.cellMinV>0&&input.cellMinV<=input.cellMaxV&&input.cellMaxV<=6&&input.packVoltageV>0&&input.packCurrentA>=-c.maxCurrentA*2&&input.packCurrentA<=c.maxCurrentA*2;
 if(!valid)faults.push('BMS_SIGNAL_INVALID');
 if(!input.isolationOk)faults.push('BMS_INSULATION_FAULT');
 if(input.externalCriticalFault)faults.push('BMS_EXTERNAL_CRITICAL');
 if(valid){
  if(input.socPct<=c.lowSocCutoffPct)faults.push('BMS_SOC_CUTOFF');
  if(input.cellMinV<=c.criticalCellMinV||input.cellMaxV>=c.criticalCellMaxV)faults.push('BMS_CELL_CRITICAL');
  else if(input.cellMinV<c.minCellV||input.cellMaxV>c.maxCellV)faults.push('BMS_CELL_LIMIT');
  if(input.batteryTempC<=c.criticalMinTempC||input.batteryTempC>=c.criticalMaxTempC)faults.push('BMS_TEMPERATURE_CRITICAL');
  else if(input.batteryTempC<c.minTempC||input.batteryTempC>c.maxTempC)faults.push('BMS_TEMPERATURE_LIMIT');
  if(Math.abs(input.packCurrentA)>c.maxCurrentA)faults.push('BMS_CURRENT_LIMIT');
 }
 const shutdown=faults.some(f=>['BMS_INSULATION_FAULT','BMS_EXTERNAL_CRITICAL','BMS_SOC_CUTOFF','BMS_CELL_CRITICAL','BMS_TEMPERATURE_CRITICAL'].includes(f));
 // A previous shutdown remains latched in this educational model; restart policy is an external vehicle-mode responsibility.
 const latched=previous.mode==='SHUTDOWN_REQUEST';
 let dischargeKw=0,chargeKw=0;
 if(valid&&!shutdown&&!latched){
  const ds=interpolateTable(input.socPct,BMS_TABLES.dischargeSoc),dt=interpolateTable(input.batteryTempC,BMS_TABLES.dischargeTemp);
  const cs=interpolateTable(input.socPct,BMS_TABLES.chargeSoc),ct=interpolateTable(input.batteryTempC,BMS_TABLES.chargeTemp);
  // Approximate protective ceilings; min voltage/current limit is intentionally conservative.
  const currentKw=input.packVoltageV*c.maxCurrentA/1000;
  const cellFactor=clamp(Math.min((input.cellMinV-c.criticalCellMinV)/(c.minCellV-c.criticalCellMinV),
                                   (c.criticalCellMaxV-input.cellMaxV)/(c.criticalCellMaxV-c.maxCellV)),0,1);
  dischargeKw=Math.min(c.nominalDischargeKw*ds,c.nominalDischargeKw*dt,c.nominalDischargeKw*cellFactor,currentKw);
  chargeKw=Math.min(c.nominalChargeKw*cs,c.nominalChargeKw*ct,c.nominalChargeKw*cellFactor,currentKw);
  if(ds<1)limitingFactors.push('SOC_DISCHARGE');if(dt<1)limitingFactors.push('TEMP_DISCHARGE');
  if(cs<1)limitingFactors.push('SOC_CHARGE');if(ct<1)limitingFactors.push('TEMP_CHARGE');
  if(cellFactor<1)limitingFactors.push('CELL_VOLTAGE');if(currentKw<c.nominalDischargeKw)limitingFactors.push('CURRENT_CEILING');
 }
 // Measured current is diagnostic only, never silently treated as a commanded actuator response.
 const observedPackPowerKw=valid?input.packVoltageV*input.packCurrentA/1000:0;
 const observedPowerWithinLimit=valid && (observedPackPowerKw>=0?observedPackPowerKw<=dischargeKw+1e-9:-observedPackPowerKw<=chargeKw+1e-9);
 if(valid&&!observedPowerWithinLimit)faults.push('BMS_OBSERVED_POWER_EXCEEDS_LIMIT');
 let mode:BmsMode;
 const recoverySeconds=faults.length===0?previous.recoverySeconds+dtSeconds:0;
 if(shutdown||latched)mode='SHUTDOWN_REQUEST';
 else if(!valid||faults.some(f=>f==='BMS_CURRENT_LIMIT'||f==='BMS_OBSERVED_POWER_EXCEEDS_LIMIT'))mode='FAULT';
 else if(faults.length>0||dischargeKw<c.nominalDischargeKw-1e-6||chargeKw<c.nominalChargeKw-1e-6)mode='LIMITED';
 else mode='NORMAL';
 // Non-latched FAULT requires a short stable recovery; no forced full power on transient restoration.
 if(previous.mode==='FAULT'&&mode==='NORMAL'&&recoverySeconds<c.recoverySec)mode='LIMITED';
 if(mode==='FAULT'||mode==='SHUTDOWN_REQUEST'){dischargeKw=0;chargeKw=0}
 // When a channel is diagnosed invalid, no power permission can be issued.
 const packAvailable=valid&&mode!=='FAULT'&&mode!=='SHUTDOWN_REQUEST'&&dischargeKw>0;
 const state:BmsState={mode,recoverySeconds,previousFaults:[...new Set(faults)]};
 return {state,mode,packAvailable,signalValid:valid,limits:{dischargeKw,chargeKw},commands:{dischargeLimitKw:dischargeKw,chargeLimitKw:chargeKw,shutdownRequested:mode==='SHUTDOWN_REQUEST'},observedPackPowerKw,observedPowerWithinLimit,faults,limitingFactors};
}
/** Sample integration data; a real source must supply cell min/max and sensor freshness explicitly. */
export function makeBmsInputFromVehicle(input:{packSoc:number;packTempC:number;packVoltage:number;isolationOk:boolean;signalAgeMs:number}):BmsInputs{
 return {socPct:input.packSoc,batteryTempC:input.packTempC,packVoltageV:input.packVoltage,cellMinV:3.7,cellMaxV:3.9,packCurrentA:0,isolationOk:input.isolationOk,signalAgeMs:input.signalAgeMs};
}
