import { getPartModel, hasPartModel, PART_MODEL_IDS } from "../parts/partModels.ts";
import { DOMAIN_ORDER, EV_DOMAINS, type DomainId } from "./evData.ts";

export type VehicleProfileId = "coil_cdc_base" | "air_cdc_option" | "cdc_full_corner_option";
export type CornerId = "fl" | "fr" | "rl" | "rr";
export type GeometryMode = "standalone" | "integrated" | "signal-only" | "external";
export type PlacementStatus = "observed" | "template" | "unverified" | "fallback" | "missing";
export type AssetStatus = "present" | "integrated" | "missing-required" | "missing-optional" | "signal-only";
export type AssemblyMode = "collapsed" | "expanded" | "exploded";
export type PartMotion = { axis: "x" | "y" | "z"; mode: string; pivot?: readonly [number, number, number] };

export type PhysicalInstance = {
  instanceId: string;
  componentId: string;
  modelId?: string;
  corner?: CornerId;
  assemblyId?: string;
  ownerAssemblyId?: string;
  geometryMode: GeometryMode;
  assetStatus: AssetStatus;
  placementKey?: string;
  placementStatus: PlacementStatus;
  mountAnchor?: string;
  portAnchors?: readonly string[];
  localMotion?: PartMotion;
  requiredProfiles?: readonly VehicleProfileId[];
  note?: string;
};

export type AssemblySpec = {
  assemblyId: string;
  componentId: string;
  childInstanceIds: readonly string[];
  geometryOwner: "assembly" | "children";
  defaultMode: AssemblyMode;
  rotatingInstanceIds?: readonly string[];
  fixedInstanceIds?: readonly string[];
  note?: string;
};

export type SignalObject = {
  signalId: string;
  kind: "can" | "hvil" | "cp" | "pp" | "hydraulic" | "mechanical" | "diagnostic" | "external";
  sourceIds: readonly string[];
  targetIds: readonly string[];
  unit?: string;
  range?: readonly [number, number];
  note?: string;
};

export type BehaviorExecution = "B1-calculated" | "B2-signal" | "B3-command" | "V1-preview" | "D1-decoration";

export type BehaviorBinding = {
  id: string;
  signalId: string;
  source: "vehicleSim" | "verificationSim" | "campaignState" | "userInput" | "static";
  unit: string;
  range: readonly [number, number];
  update: { mode: "frame" | "sample" | "event" | "static"; periodMs?: number };
  missing: "idle" | "hold-last" | "hidden" | "not-exercised";
  execution: BehaviorExecution;
  output: { property: "rotation" | "translation" | "visibility" | "color" | "overlay"; axis?: "x" | "y" | "z"; scale?: number };
  scenario?: string;
};

export type VehicleSpec = {
  id: string;
  version: string;
  profiles: readonly VehicleProfileId[];
  physicalInstances: readonly PhysicalInstance[];
  assemblies: readonly AssemblySpec[];
  signalObjects: readonly SignalObject[];
  behaviorBindings: readonly BehaviorBinding[];
};

export type PartModelMetadata = {
  modelId: string;
  size: readonly [number, number, number];
  center: readonly [number, number, number];
  anchorIds: readonly string[];
  movingGroups: readonly PartMotion[];
};

export type PlacementAudit = {
  componentId: string;
  sourceFile: string;
  sourceKey: string;
  status: PlacementStatus;
  note: string;
};

export type ValidationIssue = {
  severity: "error" | "warning";
  code: "DUPLICATE_INSTANCE_ID" | "MISSING_MODEL" | "MISSING_ANCHOR" | "FALLBACK_PLACEMENT" | "MISSING_ASSEMBLY_CHILD" | "MISSING_ENDPOINT" | "UNVERIFIED_PLACEMENT";
  subject: string;
  message: string;
};

export type ValidationResult = {
  errors: readonly ValidationIssue[];
  warnings: readonly ValidationIssue[];
  ok: boolean;
};

export type DomainReferenceAuditEntry = {
  domain: DomainId;
  featureIndex: number;
  featureName: string;
  label: string;
  referenceIds: readonly string[];
  unresolved: boolean;
  missingReferenceIds: readonly string[];
};

export type DomainReferenceAudit = {
  entries: readonly DomainReferenceAuditEntry[];
  unresolvedLabels: readonly DomainReferenceAuditEntry[];
  missingReferences: readonly DomainReferenceAuditEntry[];
};

const CORNERS: readonly CornerId[] = ["fl", "fr", "rl", "rr"];

const cornerInstances = (componentId: string, modelId: string, placementKey: string, placementStatus: PlacementStatus, assetStatus: AssetStatus = "present"): PhysicalInstance[] => CORNERS.map(corner => ({
  instanceId: `${componentId}.${corner}`,
  componentId,
  modelId,
  corner,
  geometryMode: "standalone",
  assetStatus,
  placementKey,
  placementStatus,
  ownerAssemblyId: `wheel_brake_assembly.${corner}`,
}));

const known = (instanceId: string, componentId: string, modelId: string, placementKey: string, extra: Partial<PhysicalInstance> = {}): PhysicalInstance => ({
  instanceId,
  componentId,
  modelId,
  geometryMode: "standalone",
  assetStatus: "present",
  placementKey,
  placementStatus: "observed",
  ...extra,
});

/**
 * Read-only audit of the current VehicleLayout placement table. The source
 * table is intentionally not imported or rewritten in Phase 0 because PLACE
 * is private to VehicleLayout.tsx. Entries marked `unverified` now have an
 * explicit educational packaging coordinate, but authored origins and
 * engineering anchors still require the browser/model QA pass.
 */
export const CURRENT_LAYOUT_PLACEMENT_AUDIT: readonly PlacementAudit[] = [
  { componentId: "steering_wheel", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.steering_wheel", status: "observed", note: "single current template" },
  { componentId: "instrument_cluster", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.instrument_cluster", status: "observed", note: "single current template" },
  { componentId: "traction_motor", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.traction_motor", status: "observed", note: "single current template" },
  { componentId: "differential", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.differential", status: "observed", note: "single current template" },
  { componentId: "wheel", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.wheel", status: "template", note: "one placement reused by current chain" },
  { componentId: "brake_caliper", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.brake_caliper", status: "template", note: "one placement reused by current chain" },
  { componentId: "cdc_damper", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.cdc_damper", status: "template", note: "front-left template only" },
  { componentId: "coil_spring", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.coil_spring", status: "template", note: "front-left template only" },
  { componentId: "air_spring", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.air_spring", status: "template", note: "rear-side template only" },
  { componentId: "ride_height_sensor", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.ride_height_sensor", status: "template", note: "single current template" },
  { componentId: "evcc", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.evcc", status: "unverified", note: "explicit educational packaging coordinate; authored anchor not verified" },
  { componentId: "charge_lock_actuator", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.charge_lock_actuator", status: "unverified", note: "explicit educational packaging coordinate; authored anchor not verified" },
  { componentId: "ac_compressor", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.ac_compressor", status: "unverified", note: "explicit educational packaging coordinate; authored anchor not verified" },
  { componentId: "ptc_heater", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.ptc_heater", status: "unverified", note: "explicit educational packaging coordinate; authored anchor not verified" },
  { componentId: "eev", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.eev", status: "unverified", note: "explicit educational packaging coordinate; authored anchor not verified" },
  { componentId: "adas_camera", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.adas_camera", status: "unverified", note: "explicit forward packaging coordinate; authored anchor not verified" },
  { componentId: "adas_radar", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.adas_radar", status: "unverified", note: "explicit forward packaging coordinate; authored anchor not verified" },
  { componentId: "adas_ecu", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.adas_ecu", status: "unverified", note: "explicit educational packaging coordinate; authored anchor not verified" },
  { componentId: "tcu", sourceFile: "src/features/garage/VehicleLayout.tsx", sourceKey: "PLACE.tcu", status: "unverified", note: "explicit educational packaging coordinate; authored anchor not verified" },
];

const frontSuspension = (corner: "fl" | "fr"): PhysicalInstance[] => [
  { ...known(`coil_spring.${corner}`, "coil_spring", "coil_spring", "PLACE.coil_spring", { corner, ownerAssemblyId: `front_strut_assembly.${corner}`, placementStatus: "unverified", localMotion: { axis: "y", mode: "compress", pivot: [0, 0, 0] } }), requiredProfiles: ["coil_cdc_base", "cdc_full_corner_option"] },
  { ...known(`cdc_damper.${corner}`, "cdc_damper", "cdc_damper", "PLACE.cdc_damper", { corner, ownerAssemblyId: `front_strut_assembly.${corner}`, placementStatus: "unverified", localMotion: { axis: "y", mode: "damping", pivot: [0, 0, 0] } }), requiredProfiles: ["coil_cdc_base", "air_cdc_option", "cdc_full_corner_option"] },
];

const rearSuspension = (corner: "rl" | "rr"): PhysicalInstance[] => [
  { ...known(`coil_spring.${corner}`, "coil_spring", "coil_spring", "PLACE.coil_spring", { corner, ownerAssemblyId: "rear_torsion_beam_assembly", placementStatus: "unverified", localMotion: { axis: "y", mode: "compress", pivot: [0, 0, 0] } }), requiredProfiles: ["coil_cdc_base", "cdc_full_corner_option"] },
  { ...known(`cdc_damper.${corner}`, "cdc_damper", "cdc_damper", "PLACE.cdc_damper", { corner, ownerAssemblyId: "rear_torsion_beam_assembly", placementStatus: "unverified", localMotion: { axis: "y", mode: "damping", pivot: [0, 0, 0] } }), requiredProfiles: ["coil_cdc_base", "air_cdc_option", "cdc_full_corner_option"] },
];

const wheelInstances = cornerInstances("wheel", "wheel", "PLACE.wheel", "unverified");
const brakeInstances = cornerInstances("brake_caliper", "brake_caliper", "PLACE.brake_caliper", "unverified");
const wheelSpeedInstances = cornerInstances("wheel_speed_sensor", "wheel_speed_sensor", "PLACE.wheel_speed_sensor", "unverified");

export const PHASE0_VEHICLE_SPEC: VehicleSpec = {
  id: "traceback-educational-ev",
  version: "phase0-contract-2026-11-16",
  profiles: ["coil_cdc_base", "air_cdc_option", "cdc_full_corner_option"],
  physicalInstances: [
    ...wheelInstances,
    ...brakeInstances,
    ...wheelSpeedInstances,
    ...frontSuspension("fl"),
    ...frontSuspension("fr"),
    ...rearSuspension("rl"),
    ...rearSuspension("rr"),
    known("traction_motor", "traction_motor", "traction_motor", "PLACE.traction_motor", { assemblyId: "front_eaxle_assembly", ownerAssemblyId: "front_eaxle_assembly" }),
    known("reduction_gear", "reduction_gear", "reduction_gear", "PLACE.reduction_gear", { assemblyId: "front_eaxle_assembly", ownerAssemblyId: "front_eaxle_assembly" }),
    known("differential", "differential", "differential", "PLACE.differential", { assemblyId: "front_eaxle_assembly", ownerAssemblyId: "front_eaxle_assembly", mountAnchor: "in" }),
    known("halfshaft.fl", "drive_shaft", "drive_shaft", "PLACE.drive_shaft", { corner: "fl", assemblyId: "front_eaxle_assembly", ownerAssemblyId: "front_eaxle_assembly", placementStatus: "unverified", mountAnchor: "in" }),
    known("halfshaft.fr", "drive_shaft", "drive_shaft", "PLACE.drive_shaft", { corner: "fr", assemblyId: "front_eaxle_assembly", ownerAssemblyId: "front_eaxle_assembly", placementStatus: "unverified", mountAnchor: "in" }),
    known("steering_wheel", "steering_wheel", "steering_wheel", "PLACE.steering_wheel", { mountAnchor: "column_out" }),
    known("steering_column", "steering_column", "steering_column", "PLACE.steering_column"),
    known("steering_torque_sensor", "steering_torque_sensor", "steering_torque_sensor", "PLACE.steering_torque_sensor"),
    known("eps_motor", "eps_motor", "eps_motor", "PLACE.eps_motor", { mountAnchor: "assist_out" }),
    known("eps_ecu", "eps_ecu", "eps_ecu", "PLACE.eps_ecu"),
    known("steering_rack", "steering_rack", "steering_rack", "PLACE.steering_rack", { mountAnchor: "pinion_in" }),
    { instanceId: "steering_angle_sensor", componentId: "steering_angle_sensor", geometryMode: "integrated", assetStatus: "missing-required", placementKey: "VehicleSpec pending anchor audit", placementStatus: "missing", note: "Current label mapping can reuse steering_wheel; separate sensor model/anchor is not confirmed." },
    known("brake_ecu", "brake_ecu", "brake_ecu", "PLACE.brake_ecu"),
    known("hydraulic_modulator", "hydraulic_modulator", "hydraulic_modulator", "PLACE.hydraulic_modulator"),
    known("hv_battery", "hv_battery", "hv_battery", "PLACE.hv_battery"),
    known("bms", "bms", "bms", "PLACE.bms"),
    known("main_contactor", "main_contactor", "main_contactor", "PLACE.main_contactor"),
    known("inverter", "inverter", "inverter", "PLACE.inverter"),
    known("vcu", "vcu", "vcu", "PLACE.vcu"),
    known("chassis_ecu", "chassis_ecu", "chassis_ecu", "PLACE.chassis_ecu"),
    known("hv_junction_box", "hv_junction_box", "hv_junction_box", "PLACE.hv_junction_box"),
    known("motor_temp_sensor", "motor_temp_sensor", "motor_temp_sensor", "PLACE.motor_temp_sensor"),
    { instanceId: "coolant_temperature_sensor", componentId: "coolant_temperature_sensor", geometryMode: "standalone", assetStatus: "missing-required", placementStatus: "missing", note: "evData.ts names this sensor; current part model mapping is not confirmed." },
    known("cooling_pump", "cooling_pump", "cooling_pump", "PLACE.cooling_pump"),
    known("cooling_fan", "cooling_fan", "cooling_fan", "PLACE.cooling_fan"),
    known("thermal_ecu", "thermal_ecu", "thermal_ecu", "PLACE.thermal_ecu"),
    known("coolant_valve", "coolant_valve", "coolant_valve", "PLACE.coolant_valve"),
    known("radiator", "radiator", "radiator", "PLACE.radiator"),
    known("charging_port", "charging_port", "charging_port", "PLACE.charging_port"),
    known("obc", "obc", "obc", "PLACE.obc"),
    known("evcc", "evcc", "evcc", "PLACE.evcc", { placementStatus: "unverified" }),
    known("charge_lock_actuator", "charge_lock_actuator", "charge_lock_actuator", "PLACE.charge_lock_actuator", { placementStatus: "unverified" }),
    known("park_ecu", "park_ecu", "park_ecu", "PLACE.park_ecu", { assemblyId: "front_eaxle_assembly", note: "ECU is body-mounted; assembly relationship is logical, not co-located geometry." }),
    known("park_lock_actuator", "park_lock_actuator", "park_lock_actuator", "PLACE.park_lock_actuator", { assemblyId: "front_eaxle_assembly", placementStatus: "unverified" }),
    known("park_position_sensor", "park_position_sensor", "park_position_sensor", "PLACE.park_position_sensor", { assemblyId: "front_eaxle_assembly", placementStatus: "unverified" }),
    { instanceId: "park_pawl", componentId: "park_pawl", geometryMode: "integrated", assetStatus: "missing-required", assemblyId: "front_eaxle_assembly", placementStatus: "missing", note: "Mechanical locking target is not represented by a confirmed current model." },
    known("instrument_cluster", "instrument_cluster", "instrument_cluster", "PLACE.instrument_cluster"),
    { instanceId: "external_evse", componentId: "external_evse", geometryMode: "external", assetStatus: "signal-only", placementStatus: "missing", note: "External equipment is represented as a signal/external view in Phase 0." },
    { instanceId: "wheel_acceleration_sensor.fl", componentId: "wheel_acceleration_sensor", corner: "fl", geometryMode: "standalone", assetStatus: "missing-optional", placementStatus: "missing", requiredProfiles: ["cdc_full_corner_option"], note: "Optional full-corner CDC measurement." },
    { instanceId: "wheel_acceleration_sensor.fr", componentId: "wheel_acceleration_sensor", corner: "fr", geometryMode: "standalone", assetStatus: "missing-optional", placementStatus: "missing", requiredProfiles: ["cdc_full_corner_option"], note: "Optional full-corner CDC measurement." },
    { instanceId: "wheel_acceleration_sensor.rl", componentId: "wheel_acceleration_sensor", corner: "rl", geometryMode: "standalone", assetStatus: "missing-optional", placementStatus: "missing", requiredProfiles: ["cdc_full_corner_option"], note: "Optional full-corner CDC measurement." },
    { instanceId: "wheel_acceleration_sensor.rr", componentId: "wheel_acceleration_sensor", corner: "rr", geometryMode: "standalone", assetStatus: "missing-optional", placementStatus: "missing", requiredProfiles: ["cdc_full_corner_option"], note: "Optional full-corner CDC measurement." },
  ],
  assemblies: [
    { assemblyId: "front_eaxle_assembly", componentId: "front_eaxle", childInstanceIds: ["traction_motor", "reduction_gear", "differential", "halfshaft.fl", "halfshaft.fr", "park_lock_actuator", "park_pawl", "park_position_sensor"], geometryOwner: "children", defaultMode: "collapsed", rotatingInstanceIds: ["halfshaft.fl", "halfshaft.fr"], fixedInstanceIds: ["traction_motor", "reduction_gear", "differential", "park_lock_actuator", "park_pawl", "park_position_sensor"], note: "Park ECU remains body-mounted; relationship is through signal/mechanical lock path." },
    { assemblyId: "front_strut_assembly.fl", componentId: "front_strut", childInstanceIds: ["coil_spring.fl", "cdc_damper.fl"], geometryOwner: "children", defaultMode: "collapsed", fixedInstanceIds: ["coil_spring.fl", "cdc_damper.fl"] },
    { assemblyId: "front_strut_assembly.fr", componentId: "front_strut", childInstanceIds: ["coil_spring.fr", "cdc_damper.fr"], geometryOwner: "children", defaultMode: "collapsed", fixedInstanceIds: ["coil_spring.fr", "cdc_damper.fr"] },
    { assemblyId: "rear_torsion_beam_assembly", componentId: "rear_torsion_beam", childInstanceIds: ["coil_spring.rl", "coil_spring.rr", "cdc_damper.rl", "cdc_damper.rr"], geometryOwner: "children", defaultMode: "collapsed", fixedInstanceIds: ["coil_spring.rl", "coil_spring.rr", "cdc_damper.rl", "cdc_damper.rr"] },
    ...CORNERS.map(corner => ({ assemblyId: `wheel_brake_assembly.${corner}`, componentId: "wheel_brake", childInstanceIds: [`wheel.${corner}`, `brake_caliper.${corner}`, `wheel_speed_sensor.${corner}`], geometryOwner: "children" as const, defaultMode: "collapsed" as const, rotatingInstanceIds: [`wheel.${corner}`], fixedInstanceIds: [`brake_caliper.${corner}`, `wheel_speed_sensor.${corner}`] })),
  ],
  signalObjects: [
    { signalId: "CAN.ParkRequest", kind: "can", sourceIds: ["vcu", "park_ecu"], targetIds: ["park_ecu", "park_lock_actuator"] },
    { signalId: "CAN.LockFeedback", kind: "can", sourceIds: ["park_position_sensor"], targetIds: ["park_ecu", "vcu", "instrument_cluster"] },
    { signalId: "CAN.CDCCommand", kind: "can", sourceIds: ["chassis_ecu"], targetIds: ["cdc_damper.fl", "cdc_damper.fr", "cdc_damper.rl", "cdc_damper.rr"], unit: "percent", range: [0, 100] },
    { signalId: "CP.ACCharge", kind: "cp", sourceIds: ["external_evse"], targetIds: ["evcc", "obc"], unit: "duty", range: [0, 1], note: "Phase 0 records AC path only; no DC fast-charge object is defined." },
    { signalId: "PP.Connector", kind: "pp", sourceIds: ["external_evse", "charging_port"], targetIds: ["evcc", "vcu"] },
    { signalId: "HVIL.SafetyLoop", kind: "hvil", sourceIds: ["hv_battery", "hv_junction_box"], targetIds: ["bms", "main_contactor", "inverter"] },
  ],
  behaviorBindings: [],
};

export function extractPartModelMetadata(ids: readonly string[] = PART_MODEL_IDS): readonly PartModelMetadata[] {
  return ids.map(modelId => {
    const model = getPartModel(modelId);
    return {
      modelId,
      size: [...model.size] as [number, number, number],
      center: [...model.center] as [number, number, number],
      anchorIds: Object.keys(model.anchors).sort(),
      movingGroups: model.moving.map(group => ({ axis: group.axis, mode: group.mode, pivot: [...group.pivot] as [number, number, number] })),
    };
  });
}

const physicalReferenceRules: readonly [RegExp, readonly string[]][] = [
  [/APS|가속 페달/, ["accel_pedal"]],
  [/브레이크 페달|페달 A\/B/, ["brake_pedal", "brake_ecu"]],
  [/모터 NTC/, ["motor_temp_sensor"]],
  [/냉각수 온도/, ["coolant_temperature_sensor"]],
  [/냉각 펌프/, ["cooling_pump"]],
  [/냉각 팬|팬/, ["cooling_fan"]],
  [/전동 컴프레서/, ["ac_compressor"]],
  [/컴프레서|Air Compressor/, ["air_compressor"]],
  [/Air Spring/, ["air_spring"]],
  [/칠러/, ["chiller"]],
  [/팽창밸브|EEV/, ["eev"]],
  [/PTC/, ["ptc_heater"]],
  [/충전 인렛/, ["charging_port"]],
  [/충전구 잠금/, ["charge_lock_actuator"]],
  [/EVCC/, ["evcc"]],
  [/OBC/, ["obc"]],
  [/전압·절연|팩 전압|HV 부하|HV 버스|고전압 배터리/, ["hv_battery"]],
  [/주 접촉기|릴레이/, ["main_contactor"]],
  [/BMS/, ["bms"]],
  [/Thermal ECU/, ["thermal_ecu"]],
  [/인버터 MCU|MCU·인버터|인버터/, ["inverter"]],
  [/PMSM|전륜.*모터|모터·캘리퍼/, ["traction_motor"]],
  [/감속기/, ["reduction_gear"]],
  [/차동기어/, ["differential"]],
  [/드라이브 샤프트/, ["halfshaft.fl", "halfshaft.fr"]],
  [/4륜 캘리퍼|4륜 캘리퍼|캘리퍼/, ["brake_caliper.fl", "brake_caliper.fr", "brake_caliper.rl", "brake_caliper.rr"]],
  [/4륜 속도센서|속도센서/, ["wheel_speed_sensor.fl", "wheel_speed_sensor.fr", "wheel_speed_sensor.rl", "wheel_speed_sensor.rr"]],
  [/유압 모듈|압력 제어기|Hydraulic ECU/, ["hydraulic_modulator"]],
  [/요·횡가속|^IMU$/, ["imu_sensor"]],
  [/차고 높이|차고 센서/, ["ride_height_sensor"]],
  [/Chassis ECU/, ["chassis_ecu"]],
  [/댐퍼 밸브|댐퍼/, ["cdc_damper.fl", "cdc_damper.fr", "cdc_damper.rl", "cdc_damper.rr"]],
  [/EPS ECU/, ["eps_ecu"]],
  [/EPS 모터|모터 인버터/, ["eps_motor"]],
  [/핸들각|조향각 센서/, ["steering_angle_sensor"]],
  [/토크 센서/, ["steering_torque_sensor"]],
  [/랙|피니언|타이로드/, ["steering_rack"]],
  [/전륜 너클/, ["steering_knuckle.fl", "steering_knuckle.fr"]],
  [/핸들|조향축/, ["steering_wheel", "steering_column"]],
  [/Park ECU/, ["park_ecu"]],
  [/Lock Actuator/, ["park_lock_actuator"]],
  [/Position Sensor/, ["park_position_sensor"]],
  [/Cluster|경고등/, ["instrument_cluster"]],
  [/전방 카메라|카메라/, ["adas_camera"]],
  [/전방 레이더|레이더/, ["adas_radar"]],
  [/ADAS ECU/, ["adas_ecu"]],
  [/게이트웨이/, ["gateway_ecu"]],
  [/진단 포트/, ["diagnostic_port"]],
  [/텔레매틱스/, ["tcu"]],
];

function resolveDomainLabel(label: string): readonly string[] {
  for (const [pattern, references] of physicalReferenceRules) if (pattern.test(label)) return references;
  if (/CP·PP|CAN|신호|메시지|요구|Permit|상태|서버|진단 장비|충전기|HVIL|충돌|전원|부하|Feedback|Valve Manifold|솔레노이드|PFC|3상 브리지|리졸버|Power Coordinator|ESC ECU/.test(label)) return [`signal:${label}`];
  if (/VCU/.test(label)) return ["vcu"];
  return [];
}

export function auditDomainReferences(spec: VehicleSpec = PHASE0_VEHICLE_SPEC): DomainReferenceAudit {
  const available = new Set([
    ...spec.physicalInstances.map(instance => instance.instanceId),
    ...spec.signalObjects.map(signal => signal.signalId),
  ]);
  const entries: DomainReferenceAuditEntry[] = [];
  for (const domain of DOMAIN_ORDER) {
    EV_DOMAINS[domain].features.forEach((feature, featureIndex) => feature.layers[1].forEach(label => {
      const referenceIds = resolveDomainLabel(label);
      const missingReferenceIds = referenceIds.filter(id => !id.startsWith("signal:") && !available.has(id));
      entries.push({ domain, featureIndex, featureName: feature.name, label, referenceIds, unresolved: referenceIds.length === 0, missingReferenceIds });
    }));
  }
  return {
    entries,
    unresolvedLabels: entries.filter(entry => entry.unresolved),
    missingReferences: entries.filter(entry => entry.missingReferenceIds.length > 0),
  };
}

const endpointIds = (spec: VehicleSpec): Set<string> => new Set([
  ...spec.physicalInstances.map(instance => instance.instanceId),
  ...spec.assemblies.map(assembly => assembly.assemblyId),
  ...spec.signalObjects.map(signal => signal.signalId),
]);

export function validateVehicleSpec(spec: VehicleSpec): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const instances = new Map<string, PhysicalInstance>();
  const assemblyIds = new Set(spec.assemblies.map(assembly => assembly.assemblyId));
  const allEndpoints = endpointIds(spec);

  for (const instance of spec.physicalInstances) {
    if (instances.has(instance.instanceId)) {
      errors.push({ severity: "error", code: "DUPLICATE_INSTANCE_ID", subject: instance.instanceId, message: `Duplicate physical instance ID: ${instance.instanceId}` });
    } else instances.set(instance.instanceId, instance);

    if (instance.ownerAssemblyId && !assemblyIds.has(instance.ownerAssemblyId)) {
      errors.push({ severity: "error", code: "MISSING_ASSEMBLY_CHILD", subject: instance.instanceId, message: `Owner assembly is not defined: ${instance.ownerAssemblyId}` });
    }

    if (instance.placementStatus === "fallback") {
      errors.push({ severity: "error", code: "FALLBACK_PLACEMENT", subject: instance.instanceId, message: `${instance.instanceId} uses an explicit layoutOf() fallback placement.` });
    } else if (instance.placementStatus === "unverified" || instance.placementStatus === "template") {
      warnings.push({ severity: "warning", code: "UNVERIFIED_PLACEMENT", subject: instance.instanceId, message: `${instance.instanceId} has a placement template but no verified corner transform.` });
    }

    const requiresModel = instance.assetStatus === "missing-required" || (instance.geometryMode === "standalone" && instance.assetStatus !== "signal-only");
    if (requiresModel && !instance.modelId) {
      const code = instance.assetStatus === "missing-optional" ? "MISSING_MODEL" : "MISSING_MODEL";
      const target = instance.requiredProfiles?.join(", ") ?? "base";
      const issue = { severity: instance.assetStatus === "missing-optional" ? "warning" : "error", code, subject: instance.instanceId, message: `No model is resolved for ${instance.instanceId} (required profile: ${target}).` } as ValidationIssue;
      (issue.severity === "error" ? errors : warnings).push(issue);
    }

    if (instance.modelId && !hasPartModel(instance.modelId)) {
      errors.push({ severity: "error", code: "MISSING_MODEL", subject: instance.instanceId, message: `Model ID is not present in PART_MODEL_IDS: ${instance.modelId}` });
    }

    if (instance.modelId && hasPartModel(instance.modelId) && instance.mountAnchor) {
      const anchors = getPartModel(instance.modelId).anchors;
      if (!(instance.mountAnchor in anchors)) {
        errors.push({ severity: "error", code: "MISSING_ANCHOR", subject: instance.instanceId, message: `${instance.modelId} has no mount anchor '${instance.mountAnchor}'.` });
      }
    }
  }

  for (const assembly of spec.assemblies) {
    const childIds = new Set<string>();
    for (const childId of assembly.childInstanceIds) {
      if (childIds.has(childId)) errors.push({ severity: "error", code: "DUPLICATE_INSTANCE_ID", subject: assembly.assemblyId, message: `Assembly repeats child instance: ${childId}` });
      childIds.add(childId);
      if (!instances.has(childId)) errors.push({ severity: "error", code: "MISSING_ASSEMBLY_CHILD", subject: assembly.assemblyId, message: `Assembly child is not defined: ${childId}` });
    }
    for (const rotatingId of assembly.rotatingInstanceIds ?? []) if (!childIds.has(rotatingId)) errors.push({ severity: "error", code: "MISSING_ASSEMBLY_CHILD", subject: assembly.assemblyId, message: `Rotating instance is not an assembly child: ${rotatingId}` });
    for (const fixedId of assembly.fixedInstanceIds ?? []) if (!childIds.has(fixedId)) errors.push({ severity: "error", code: "MISSING_ASSEMBLY_CHILD", subject: assembly.assemblyId, message: `Fixed instance is not an assembly child: ${fixedId}` });
  }

  for (const signal of spec.signalObjects) {
    for (const endpoint of [...signal.sourceIds, ...signal.targetIds]) if (!allEndpoints.has(endpoint)) {
      errors.push({ severity: "error", code: "MISSING_ENDPOINT", subject: signal.signalId, message: `Signal endpoint is not defined: ${endpoint}` });
    }
  }

  return { errors, warnings, ok: errors.length === 0 };
}

