import test from "node:test";
import assert from "node:assert/strict";
import { PART_MODEL_IDS } from "../src/features/parts/partModels.ts";
import {
  CURRENT_LAYOUT_PLACEMENT_AUDIT,
  PHASE0_VEHICLE_SPEC,
  auditDomainReferences,
  extractPartModelMetadata,
  validateVehicleSpec,
} from "../src/features/garage/vehicleSpec.ts";
import { HERO_REFERENCE_POINTS, heroToGarageWorld, transformedBounds } from "../src/features/garage/vehicleTransforms.ts";

test("Phase 0 vehicle spec separates physical instances, assemblies, and signals", () => {
  assert.deepEqual(PHASE0_VEHICLE_SPEC.profiles, ["coil_cdc_base", "air_cdc_option", "cdc_full_corner_option"]);
  assert.ok(PHASE0_VEHICLE_SPEC.physicalInstances.some(instance => instance.instanceId === "wheel.fl"));
  assert.ok(PHASE0_VEHICLE_SPEC.physicalInstances.some(instance => instance.instanceId === "wheel.rr"));
  assert.ok(PHASE0_VEHICLE_SPEC.assemblies.some(assembly => assembly.assemblyId === "front_eaxle_assembly"));
  assert.ok(PHASE0_VEHICLE_SPEC.signalObjects.some(signal => signal.signalId === "CAN.ParkRequest"));
  assert.deepEqual(PHASE0_VEHICLE_SPEC.behaviorBindings, [], "Phase 0 does not claim unimplemented runtime behavior bindings");
  assert.equal(PHASE0_VEHICLE_SPEC.signalObjects.some(signal => signal.signalId === "DC.FastCharge"), false, "Phase 0 declares AC path only");
});

test("Phase 1-A records the existing Hero-to-garage transform without changing it", () => {
  const wheel = heroToGarageWorld(HERO_REFERENCE_POINTS.frontLeftWheel);
  const bounds = transformedBounds(HERO_REFERENCE_POINTS.frontLeftWheel, [.68, .68, .18]);
  assert.ok([wheel.x, wheel.y, wheel.z, bounds.min.x, bounds.max.x, bounds.min.y, bounds.max.y, bounds.min.z, bounds.max.z].every(Number.isFinite));
  assert.equal(wheel.y, .2702);
  assert.ok(bounds.max.x > bounds.min.x && bounds.max.z > bounds.min.z);
});

test("read-only model extraction reports the authored metadata without changing geometry", () => {
  const metadata = extractPartModelMetadata();
  assert.equal(metadata.length, PART_MODEL_IDS.length);
  assert.ok(metadata.every(item => item.anchorIds.length >= 0));
  assert.ok(metadata.every(item => item.size.every(value => Number.isFinite(value))));
  assert.ok(metadata.some(item => item.modelId === "cdc_damper"));
});

test("reverse audit covers all 11 domains and four functions without hiding unresolved references", () => {
  const audit = auditDomainReferences(PHASE0_VEHICLE_SPEC);
  const features = new Set(audit.entries.map(entry => `${entry.domain}:${entry.featureIndex}`));
  assert.equal(features.size, 44);
  assert.ok(audit.entries.some(entry => entry.domain === "drive" && entry.label === "차동기어" && entry.referenceIds.includes("differential")));
  assert.ok(audit.entries.some(entry => entry.domain === "steer" && entry.label === "EPS 모터" && entry.referenceIds.includes("eps_motor")));
  assert.ok(audit.entries.some(entry => entry.referenceIds.includes("steering_angle_sensor")));
  assert.ok(audit.unresolvedLabels.length > 0 || audit.missingReferences.length > 0);
});

test("Phase 0 audit preserves unresolved findings while removing index fallback", () => {
  const result = validateVehicleSpec(PHASE0_VEHICLE_SPEC);
  assert.equal(result.ok, false, "unresolved Phase 0 findings must not be reported as clean");
  assert.ok(result.errors.some(issue => issue.code === "MISSING_MODEL"));
  assert.ok(result.warnings.some(issue => issue.code === "UNVERIFIED_PLACEMENT"));
  assert.equal(result.errors.some(issue => issue.code === "FALLBACK_PLACEMENT"), false);
  assert.ok(CURRENT_LAYOUT_PLACEMENT_AUDIT.some(item => item.componentId === "evcc" && item.status === "unverified"));
});

test("validator detects duplicate IDs and missing mount anchors", () => {
  const wheel = PHASE0_VEHICLE_SPEC.physicalInstances.find(instance => instance.instanceId === "wheel.fl");
  assert.ok(wheel);
  const invalid = {
    ...PHASE0_VEHICLE_SPEC,
    physicalInstances: [
      ...PHASE0_VEHICLE_SPEC.physicalInstances,
      { ...wheel, instanceId: "wheel.fl.duplicate" , mountAnchor: "does_not_exist" },
      { ...wheel, instanceId: "wheel.fl" },
    ],
  };
  const result = validateVehicleSpec(invalid);
  assert.ok(result.errors.some(issue => issue.code === "DUPLICATE_INSTANCE_ID"));
  assert.ok(result.errors.some(issue => issue.code === "MISSING_ANCHOR"));
});

test("assembly validator detects missing child references and signal endpoints", () => {
  const invalid = {
    ...PHASE0_VEHICLE_SPEC,
    assemblies: [...PHASE0_VEHICLE_SPEC.assemblies, {
      assemblyId: "invalid_assembly",
      componentId: "invalid",
      childInstanceIds: ["not_declared"],
      geometryOwner: "children",
      defaultMode: "collapsed",
    }],
    signalObjects: [...PHASE0_VEHICLE_SPEC.signalObjects, {
      signalId: "CAN.Invalid",
      kind: "can",
      sourceIds: ["missing_source"],
      targetIds: ["missing_target"],
    }],
  };
  const result = validateVehicleSpec(invalid);
  assert.ok(result.errors.some(issue => issue.code === "MISSING_ASSEMBLY_CHILD"));
  assert.ok(result.errors.filter(issue => issue.code === "MISSING_ENDPOINT").length >= 2);
});
