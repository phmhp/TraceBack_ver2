import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { PART_MODEL_IDS, PART_PALETTE, VISUAL_ONLY_IDS, getPartModel, partTriangles } from "../src/features/parts/partModels.ts";
import { COMPONENTS, CONNECTIONS } from "../src/sim/components.ts";

test("every code-built part is a sim component and anchors every one of its ports", () => {
  for (const id of PART_MODEL_IDS.filter(id => !VISUAL_ONLY_IDS.includes(id))) {
    const component = COMPONENTS.find(c => c.id === id);
    assert.ok(component, `${id} exists in src/sim/components.ts`);
    const model = getPartModel(id);
    assert.deepEqual(Object.keys(model.anchors).sort(), component.ports.map(p => p.id).sort(), `${id} anchors = port IDs`);
  }
});

test("part models: finite geometry, palette materials, real-world size, low poly", () => {
  for (const id of PART_MODEL_IDS) {
    const model = getPartModel(id);
    const groups = [model.geometries, ...model.moving.map(m => m.geometries)];
    for (const geometries of groups) for (const [key, g] of Object.entries(geometries)) {
      assert.ok(key in PART_PALETTE, `${id}: ${key} is a palette key`);
      const pos = g.attributes.position.array;
      for (let i = 0; i < pos.length; i++) assert.ok(Number.isFinite(pos[i]), `${id}/${key} position ${i}`);
    }
    const largest = Math.max(...model.size);
    assert.ok(largest > .03 && largest < 1.2, `${id} is between 3 cm and 1.2 m (${largest.toFixed(3)} m)`);
    assert.ok(partTriangles(model) < 8000, `${id} stays under 8k triangles (${partTriangles(model)})`);
    assert.ok(existsSync(new URL(`../public/assets/intake/images/${model.ref}`, import.meta.url)), `${id} reference image exists`);
  }
});

test("garage-only parts expose in/out anchors for wiring", () => {
  for (const id of VISUAL_ONLY_IDS) {
    const anchors = Object.keys(getPartModel(id).anchors).sort();
    if (id === "steering_knuckle") {
      assert.deepEqual(anchors, ["hub_out", "strut_in", "tie_rod_in"], id);
    } else if (id === "steering_angle_sensor") {
      assert.deepEqual(anchors, ["angle_in", "angle_out"], id);
    } else if (id === "coolant_temperature_sensor") {
      assert.deepEqual(anchors, ["coolant_in", "temp_out"], id);
    } else {
      assert.deepEqual(anchors, ["in", "out"], id);
    }
  }
});

test("every physical connection terminates at an authored model port", () => {
  for (const connection of CONNECTIONS) {
    for (const side of ["from", "to"]) {
      const [componentId, portId] = connection[side].split(".");
      const component = COMPONENTS.find(item => item.id === componentId);
      assert.ok(component, `${connection.id}/${side}: component ${componentId}`);
      assert.ok(component?.ports.some(port => port.id === portId), `${connection.id}/${side}: registry port ${portId}`);
      const model = getPartModel(componentId);
      assert.ok(model.anchors[portId], `${connection.id}/${side}: model anchor ${componentId}.${portId}`);
    }
  }
});
