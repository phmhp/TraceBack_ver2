// Bakes many small placed parts into one geometry per material, so a detailed
// model costs a handful of draw calls instead of one per part.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type V3 = [number, number, number];
export type PartSpec<K extends string> = {
  key: K;
  geometry: THREE.BufferGeometry;
  position?: V3;
  rotation?: V3;
  scale?: number | V3;
};

const matrixFor = (position: V3 = [0, 0, 0], rotation: V3 = [0, 0, 0], scale: number | V3 = 1) => new THREE.Matrix4().compose(
  new THREE.Vector3(...position),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
  typeof scale === "number" ? new THREE.Vector3(scale, scale, scale) : new THREE.Vector3(...scale),
);

/** Places specs inside a parent transform (e.g. a tilted windshield group). */
export function within<K extends string>(specs: PartSpec<K>[], position: V3 = [0, 0, 0], rotation: V3 = [0, 0, 0]): PartSpec<K>[] {
  const parent = matrixFor(position, rotation);
  return specs.map(spec => ({ key: spec.key, geometry: spec.geometry.clone().applyMatrix4(matrixFor(spec.position, spec.rotation, spec.scale)).applyMatrix4(parent) }));
}

/** Returns one merged, non-indexed geometry per key. */
export function bakeByKey<K extends string>(specs: PartSpec<K>[]): Partial<Record<K, THREE.BufferGeometry>> {
  const buckets = new Map<K, THREE.BufferGeometry[]>();
  for (const spec of specs) {
    let g = spec.geometry.clone().applyMatrix4(matrixFor(spec.position, spec.rotation, spec.scale));
    if (g.index) g = g.toNonIndexed();
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    const list = buckets.get(spec.key) ?? [];
    list.push(g);
    buckets.set(spec.key, list);
  }
  const out: Partial<Record<K, THREE.BufferGeometry>> = {};
  for (const [key, list] of buckets) {
    const merged = mergeGeometries(list, false);
    if (!merged) throw new Error(`bakeByKey: could not merge "${key}"`);
    merged.computeBoundingSphere();
    out[key] = merged;
  }
  return out;
}
