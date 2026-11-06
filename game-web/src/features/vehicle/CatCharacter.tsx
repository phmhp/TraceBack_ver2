// Seated TraceBack cats, modelled after public/assets/cutscene-character-master-v1.png:
// cream plush cats with large rounded heads and small glossy oval eyes.
// "lou"  = racer: white suit with red side stripes, red neck scarf (driver seat).
// "ming" = engineer: brass goggles, cream shirt, denim overalls, tool belt.
// Original game asset built in code (no external model, no license obligations).
// Static parts are baked into one geometry per material (≈10 draw calls per cat);
// only the head, scarf tails and steering arms move.
import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { bakeByKey, type PartSpec, type V3 } from "./bake";

export type CatVariant = "lou" | "ming";
type MatKey = "fur" | "earInner" | "eye" | "eyeGlint" | "suit" | "stripe" | "scarf" | "shirt" | "denim" | "leather" | "brass" | "lens" | "beltCream";

// ── Source primitives ──
let primitiveCache: ReturnType<typeof buildPrimitives> | undefined;
function buildPrimitives() {
  return {
    sphere: new THREE.SphereGeometry(1, 22, 16),
    smallSphere: new THREE.SphereGeometry(1, 8, 6),
    band: new THREE.TorusGeometry(1, .06, 8, 44),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 14, 1),
    torus: new THREE.TorusGeometry(1, .16, 10, 36),
    ring: new THREE.TorusGeometry(1, .3, 10, 28),
    disc: new THREE.CircleGeometry(1, 24),
    box: new THREE.BoxGeometry(1, 1, 1),
  };
}
const prim = () => (primitiveCache ??= buildPrimitives());

const SHOULDERS: [V3, V3] = [[-.128, .27, -.03], [.128, .27, -.03]];

/** Cylinder + joint sphere between two points, as bakeable specs. */
function limbSpecs(key: MatKey, from: V3, to: V3, r: number): PartSpec<MatKey>[] {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
  const mid = a.clone().add(b).multiplyScalar(.5);
  return [
    { key, geometry: prim().cylinder, position: [mid.x, mid.y, mid.z], rotation: [euler.x, euler.y, euler.z], scale: [r, dir.length(), r] },
    { key, geometry: prim().sphere, position: from, scale: r },
  ];
}

function bodySpecs(variant: CatVariant, drivingArms: boolean): PartSpec<MatKey>[] {
  const p = prim();
  const E = (key: MatKey, position: V3, scale: V3, rotation?: V3): PartSpec<MatKey> => ({ key, geometry: p.sphere, position, scale, rotation });
  const body: MatKey = variant === "lou" ? "suit" : "shirt";
  const specs: PartSpec<MatKey>[] = [E(body, [0, .175, .01], [.15, .17, .128])];
  if (variant === "lou") {
    specs.push(E("stripe", [-.118, .17, .045], [.022, .15, .07], [0, 0, -.1]), E("stripe", [.118, .17, .045], [.022, .15, .07], [0, 0, .1]));
    specs.push({ key: "beltCream", geometry: p.torus, position: [0, .1, .01], rotation: [Math.PI / 2, 0, 0], scale: [.142, .122, .4] });
    specs.push({ key: "brass", geometry: p.box, position: [0, .1, -.118], scale: [.05, .034, .012] });
    specs.push({ key: "scarf", geometry: p.torus, position: [0, .315, 0], rotation: [Math.PI / 2, 0, 0], scale: [.112, .1, .9] });
    specs.push(E("scarf", [.045, .3, -.1], [.042, .034, .03]));
  } else {
    specs.push(E("denim", [0, .1, .01], [.158, .105, .136]));
    specs.push({ key: "denim", geometry: p.box, position: [0, .2, -.112], rotation: [-.12, 0, 0], scale: [.15, .12, .02] });
    for (const side of [-1, 1]) {
      specs.push({ key: "denim", geometry: p.box, position: [side * .07, .27, -.01], rotation: [.5, 0, side * .1], scale: [.032, .025, .24] });
      specs.push(E("brass", [side * .07, .245, -.113], [.012, .012, .006]));
    }
    specs.push({ key: "leather", geometry: p.torus, position: [0, .085, .01], rotation: [Math.PI / 2, 0, 0], scale: [.162, .14, .45] });
    specs.push({ key: "leather", geometry: p.box, position: [.11, .07, -.1], rotation: [0, -.5, 0], scale: [.06, .06, .03] });
  }
  for (const side of [-1, 1]) {
    specs.push(...limbSpecs(variant === "lou" ? "suit" : "denim", [side * .072, .07, -.04], [side * .075, .075, -.21], .058));
    specs.push(E("fur", [side * .075, .07, -.27], [.052, .046, .066]));
  }
  SHOULDERS.forEach((shoulder, index) => {
    if (drivingArms) { specs.push({ key: body, geometry: p.sphere, position: shoulder, scale: .05 }); return; }
    const rest: V3 = [(index ? 1 : -1) * .1, .12, -.15];
    specs.push(...limbSpecs(body, shoulder, rest, .046));
    specs.push({ key: "fur", geometry: p.sphere, position: rest, scale: .05 });
  });
  return specs;
}

function headSpecs(variant: CatVariant): PartSpec<MatKey>[] {
  const p = prim();
  const specs: PartSpec<MatKey>[] = [{ key: "fur", geometry: p.sphere, position: [0, .5, 0], scale: [.238, .19, .206] }];
  for (const side of [-1, 1]) {
    const earRot: V3 = [0, 0, -side * .42];
    const ear = new THREE.Matrix4().compose(new THREE.Vector3(side * .136, .645, .025), new THREE.Quaternion().setFromEuler(new THREE.Euler(...earRot)), new THREE.Vector3(1, 1, 1));
    const inner = new THREE.Vector3(0, -.006, -.034).applyMatrix4(ear);
    specs.push({ key: "fur", geometry: p.sphere, position: [side * .136, .645, .025], rotation: earRot, scale: [.078, .118, .052] });
    specs.push({ key: "earInner", geometry: p.sphere, position: [inner.x, inner.y, inner.z], rotation: earRot, scale: [.048, .078, .02] });
    const x = side * .074;
    specs.push({ key: "eye", geometry: p.sphere, position: [x, .49, -.196], rotation: [0, x * 1.6, 0], scale: [.024, .036, .013] });
    specs.push({ key: "eyeGlint", geometry: p.smallSphere, position: [x + .007, .503, -.207], scale: .0075 });
  }
  if (variant === "ming") {
    specs.push({ key: "leather", geometry: p.band, position: [0, .575, .005], rotation: [Math.PI / 2 - .12, 0, 0], scale: [.24, .21, .6] });
    for (const side of [-1, 1]) {
      const rotation: V3 = [-.62, side * .22, 0];
      specs.push({ key: "brass", geometry: p.ring, position: [side * .072, .618, -.168], rotation, scale: [.046, .046, .06] });
      const lens = new THREE.Vector3(0, 0, -.006).applyEuler(new THREE.Euler(...rotation));
      specs.push({ key: "lens", geometry: p.disc, position: [side * .072 + lens.x, .618 + lens.y, -.168 + lens.z], rotation: [rotation[0] + Math.PI, -rotation[1], 0], scale: .04 });
    }
  }
  return specs;
}

function scarfTailSpecs(): PartSpec<MatKey>[] {
  return [
    { key: "scarf", geometry: prim().sphere, position: [-.025, 0, .1], scale: [.032, .012, .1] },
    { key: "scarf", geometry: prim().sphere, position: [.03, -.015, .085], rotation: [0, .35, 0], scale: [.028, .011, .085] },
  ];
}

type BakedCat = { body: Partial<Record<MatKey, THREE.BufferGeometry>>; head: Partial<Record<MatKey, THREE.BufferGeometry>>; scarf?: Partial<Record<MatKey, THREE.BufferGeometry>> };
const bakedCache = new Map<string, BakedCat>();
function bakedCat(variant: CatVariant, drivingArms: boolean): BakedCat {
  const id = `${variant}-${drivingArms}`;
  let cat = bakedCache.get(id);
  if (!cat) {
    cat = { body: bakeByKey(bodySpecs(variant, drivingArms)), head: bakeByKey(headSpecs(variant)), scarf: variant === "lou" ? bakeByKey(scarfTailSpecs()) : undefined };
    bakedCache.set(id, cat);
  }
  return cat;
}

// ── Materials, cached per renderer ──
const matCache = new WeakMap<object, Record<MatKey, THREE.Material>>();
function useCatMaterials() {
  const gl = useThree(state => state.gl);
  return useMemo(() => {
    const cached = matCache.get(gl);
    if (cached) return cached;
    const felt = (color: string, sheen = "#ffffff") => new THREE.MeshPhysicalMaterial({ color, roughness: .82, sheen: 1, sheenRoughness: .55, sheenColor: new THREE.Color(sheen) });
    const made: Record<MatKey, THREE.Material> = {
      fur: felt("#f1e4d0", "#fff6ea"),
      earInner: felt("#eeb1a4", "#ffd9d0"),
      eye: new THREE.MeshPhysicalMaterial({ color: "#1d1a1a", roughness: .18, clearcoat: 1, clearcoatRoughness: .05 }),
      eyeGlint: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      suit: felt("#f5f1ea"),
      stripe: felt("#d65a4a", "#ffb2a6"),
      scarf: felt("#d4513f", "#ff9f8f"),
      shirt: felt("#eee2cd"),
      denim: new THREE.MeshPhysicalMaterial({ color: "#3a4866", roughness: .9, sheen: .6, sheenColor: new THREE.Color("#8796b8") }),
      leather: new THREE.MeshStandardMaterial({ color: "#7a4a2b", roughness: .62 }),
      brass: new THREE.MeshStandardMaterial({ color: "#c69a4c", metalness: .85, roughness: .28 }),
      lens: new THREE.MeshPhysicalMaterial({ color: "#9fb4bd", metalness: .1, roughness: .05, clearcoat: 1, transparent: true, opacity: .75 }),
      beltCream: felt("#e9dcc5"),
    };
    matCache.set(gl, made);
    return made;
  }, [gl]);
}

function BakedMeshes({ geometries, materials, castShadow = false }: { geometries: Partial<Record<MatKey, THREE.BufferGeometry>>; materials: Record<MatKey, THREE.Material>; castShadow?: boolean }) {
  return <>{(Object.keys(geometries) as MatKey[]).map(key => <mesh key={key} geometry={geometries[key]} material={materials[key]} castShadow={castShadow && (key === "fur" || key === "suit" || key === "shirt")} />)}</>;
}

/** Values read every frame without re-rendering React. */
export type CatLiveInput = { steer: number; speed: number };

export type SeatedCatProps = {
  variant: CatVariant;
  /** Objects on the steering-wheel rim that the front paws hold. */
  pawTargets?: [React.RefObject<THREE.Object3D | null>, React.RefObject<THREE.Object3D | null>];
  live: React.RefObject<CatLiveInput>;
};

/** Cat sitting on a seat. Local origin = seat surface under the hips, facing -Z. */
export const SeatedCat = React.memo(function SeatedCat({ variant, pawTargets, live }: SeatedCatProps) {
  const materials = useCatMaterials();
  const baked = bakedCat(variant, Boolean(pawTargets));
  const root = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const scarfTails = useRef<THREE.Group>(null);
  const arms = useRef<(THREE.Mesh | null)[]>([]);
  const paws = useRef<(THREE.Mesh | null)[]>([]);
  const tmp = useMemo(() => ({ target: new THREE.Vector3(), dir: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), []);
  const armMaterial = materials[variant === "lou" ? "suit" : "shirt"];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { steer: s, speed: v } = live.current ?? { steer: 0, speed: 0 };
    head.current.rotation.z = variant === "lou" ? THREE.MathUtils.lerp(head.current.rotation.z, s * .35, .12) : Math.sin(t * .9) * .05;
    head.current.rotation.y = variant === "ming" ? Math.sin(t * .55) * .38 : THREE.MathUtils.lerp(head.current.rotation.y, -s * .4, .1);
    head.current.position.y = Math.sin(t * 7.5) * .004 * Math.min(1, v / 40);
    if (scarfTails.current) {
      const flutter = Math.min(1, v / 60);
      scarfTails.current.rotation.x = -.4 - flutter * .9 + Math.sin(t * 17) * .18 * flutter;
      scarfTails.current.rotation.z = Math.sin(t * 11) * .12 * flutter;
    }
    if (!pawTargets) return;
    pawTargets.forEach((ref, index) => {
      const arm = arms.current[index], paw = paws.current[index];
      if (!ref.current || !arm || !paw) return;
      ref.current.getWorldPosition(tmp.target);
      root.current.worldToLocal(tmp.target);
      const [sx, sy, sz] = SHOULDERS[index];
      tmp.dir.set(tmp.target.x - sx, tmp.target.y - sy, tmp.target.z - sz);
      const length = tmp.dir.length();
      arm.position.set(sx + tmp.dir.x / 2, sy + tmp.dir.y / 2, sz + tmp.dir.z / 2);
      arm.quaternion.setFromUnitVectors(tmp.up, tmp.dir.normalize());
      arm.scale.set(.046, Math.max(.001, length), .046);
      paw.position.copy(tmp.target);
    });
  });

  return <group ref={root}>
    <BakedMeshes geometries={baked.body} materials={materials} castShadow />
    {baked.scarf && <group ref={scarfTails} position={[.03, .315, .085]}><BakedMeshes geometries={baked.scarf} materials={materials} /></group>}
    {pawTargets && [0, 1].map(index => <React.Fragment key={index}>
      <mesh ref={element => { arms.current[index] = element; }} geometry={prim().cylinder} material={armMaterial} />
      <mesh ref={element => { paws.current[index] = element; }} geometry={prim().sphere} material={materials.fur} scale={.05} />
    </React.Fragment>)}
    <group ref={head}><BakedMeshes geometries={baked.head} materials={materials} castShadow /></group>
  </group>;
});
