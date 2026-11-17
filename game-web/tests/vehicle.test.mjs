import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { CAR_DIMENSIONS, getBodyGeometry } from "../src/features/vehicle/carBody.ts";
import { bakeByKey } from "../src/features/vehicle/bake.ts";

const body = getBodyGeometry();
const pos = body.attributes.position;
const nrm = body.attributes.normal;
const index = body.index.array;

test("hero car body: finite positions and normals, three material groups", () => {
  for (let i = 0; i < pos.array.length; i++) assert.ok(Number.isFinite(pos.array[i]), `position ${i}`);
  for (let i = 0; i < nrm.array.length; i++) assert.ok(Number.isFinite(nrm.array[i]), `normal ${i}`);
  assert.equal(body.groups.length, 3);
  assert.ok(body.groups.every(group => group.count > 0), "paint, interior and underbody all present");
  assert.ok(index.length / 3 < 20000, `body stays mid-poly (${index.length / 3} tris)`);
});

test("hero car body: closed surface with outward-facing triangles", () => {
  const edges = new Map();
  for (let t = 0; t < index.length; t += 3) for (let k = 0; k < 3; k++) {
    const a = index[t + k], b = index[t + (k + 1) % 3];
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    edges.set(key, (edges.get(key) ?? 0) + 1);
  }
  const open = [...edges.values()].filter(count => count !== 2).length;
  assert.equal(open, 0, "every edge is shared by exactly two triangles");
  let volume = 0;
  const v = i => new THREE.Vector3().fromBufferAttribute(pos, i);
  for (let t = 0; t < index.length; t += 3) volume += v(index[t]).dot(v(index[t + 1]).cross(v(index[t + 2]))) / 6;
  assert.ok(volume > 0.5, `positive enclosed volume (${volume.toFixed(2)} m³)`);
});

test("hero car body: realistic roadster footprint and wheel-arch clearance", () => {
  body.computeBoundingBox();
  const size = body.boundingBox.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.z - CAR_DIMENSIONS.length) < .05, `length ${size.z.toFixed(2)}`);
  assert.ok(Math.abs(size.x - CAR_DIMENSIONS.width) < .06, `width ${size.x.toFixed(2)}`);
  assert.ok(size.y < 1, "beltline below 1 m (open roadster)");
  const wheelTop = CAR_DIMENSIONS.wheelRadius * 2;
  for (const axle of [CAR_DIMENSIONS.frontAxleZ, CAR_DIMENSIONS.rearAxleZ]) {
    let lowest = Infinity;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getZ(i) - axle) < .2 && Math.abs(Math.abs(pos.getX(i)) - CAR_DIMENSIONS.wheelX) < .15) lowest = Math.min(lowest, pos.getY(i));
    }
    assert.ok(lowest > wheelTop + .03, `arch at ${axle} clears the tyre (${lowest.toFixed(2)} > ${wheelTop})`);
  }
});

test("bakeByKey merges placed parts into one geometry per material", () => {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const baked = bakeByKey([
    { key: "chrome", geometry: box, position: [0, 0, 0] },
    { key: "chrome", geometry: box, position: [2, 0, 0], scale: .5 },
    { key: "paint", geometry: new THREE.SphereGeometry(1, 8, 6) },
  ]);
  assert.deepEqual(Object.keys(baked).sort(), ["chrome", "paint"]);
  assert.equal(baked.chrome.attributes.position.count / 3, 24);
  baked.chrome.computeBoundingBox();
  assert.ok(Math.abs(baked.chrome.boundingBox.max.x - 2.25) < 1e-6, "transform applied before merging");
});

test("race, heist and ship scenes use the hero car with both cats; the old car is kept", () => {
  const experiences = readFileSync(new URL("../src/experiences.tsx", import.meta.url), "utf8");
  const hero = readFileSync(new URL("../src/features/vehicle/HeroConvertible.tsx", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
  assert.equal((experiences.match(/<HeroConvertible /g) || []).length, 3);
  assert.match(experiences, /function Convertible\(/, "legacy car stays available");
  assert.match(experiences, /crewRef=\{carCrew\}/, "heist crew appears only after boarding");
  assert.match(hero, /variant="lou" pawTargets/);
  assert.match(hero, /variant="ming"/);
  assert.match(main, /import\.meta\.env\.DEV && new URLSearchParams\(location\.search\)\.get\("showroom"\)/, "showroom is dev-only");
});
