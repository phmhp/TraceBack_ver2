import * as THREE from "three";

export type V3 = readonly [number, number, number];
export type Euler3 = readonly [number, number, number];

/** The existing garage scene transform; Phase 1-A records it instead of changing it. */
export const GARAGE_FRAME = {
  unitsPerMetre: 1.53,
  parentPosition: [0, -.25, 0] as V3,
  parentRotationY: -.18,
  vehicleFront: "-Z" as const,
  lateralAxis: "X" as const,
  verticalAxis: "Y" as const,
};

export function heroToGarageLocal(point: V3): [number, number, number] {
  return point.map(value => value * GARAGE_FRAME.unitsPerMetre) as [number, number, number];
}

export function garageLocalToWorld(point: V3): THREE.Vector3 {
  return new THREE.Vector3(...point)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), GARAGE_FRAME.parentRotationY)
    .add(new THREE.Vector3(...GARAGE_FRAME.parentPosition));
}

export function heroToGarageWorld(point: V3): THREE.Vector3 {
  return garageLocalToWorld(heroToGarageLocal(point));
}

export function localAxisToWorld(axis: V3, localRotation: Euler3 = [0, 0, 0]): THREE.Vector3 {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...localRotation));
  return new THREE.Vector3(...axis).applyQuaternion(q).applyAxisAngle(new THREE.Vector3(0, 1, 0), GARAGE_FRAME.parentRotationY).normalize();
}

export function rotationFromLocalX(direction: V3): [number, number, number] {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(...direction).normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  return [e.x, e.y, e.z];
}

export function transformedBounds(center: V3, size: V3, localRotation: Euler3 = [0, 0, 0]) {
  const half = new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2);
  const local = new THREE.Box3(new THREE.Vector3(...center).sub(half), new THREE.Vector3(...center).add(half));
  const corners: THREE.Vector3[] = [];
  for (const x of [local.min.x, local.max.x]) for (const y of [local.min.y, local.max.y]) for (const z of [local.min.z, local.max.z]) {
    corners.push(new THREE.Vector3(x, y, z).applyEuler(new THREE.Euler(...localRotation)).multiplyScalar(GARAGE_FRAME.unitsPerMetre).applyAxisAngle(new THREE.Vector3(0, 1, 0), GARAGE_FRAME.parentRotationY).add(new THREE.Vector3(...GARAGE_FRAME.parentPosition)));
  }
  return new THREE.Box3().setFromPoints(corners);
}

export const HERO_REFERENCE_POINTS = {
  steeringWheel: [-.31, .86, -.17] as V3,
  instrumentCluster: [-.4, .82, -.3] as V3,
  frontLeftWheel: [-.745, .34, -1.18] as V3,
  frontRightWheel: [.745, .34, -1.18] as V3,
  rearLeftWheel: [-.745, .34, 1.16] as V3,
  rearRightWheel: [.745, .34, 1.16] as V3,
};
