import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { PART_MODEL_IDS, PART_PALETTE, getPartModel, partTriangles } from "../src/features/parts/partModels.ts";
import { COMPONENTS } from "../src/sim/components.ts";

test("every code-built part is a sim component and anchors every one of its ports", () => {
  for (const id of PART_MODEL_IDS) {
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
