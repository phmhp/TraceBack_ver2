// The heroes' red EV roadster with Lou driving and Ming riding along.
// Original asset built in code: a lofted body (one smooth mesh with wheel arches
// and an open cockpit), PBR clearcoat paint, chrome, glass, spinning wheels with
// steering front axle, a steering wheel the driver's paws actually hold, and a
// live instrument cluster. Mid-poly (~25k triangles in total) for real-time racing.
// Front of the car is -Z. Footprint matches the previous placeholder car so
// cameras, collisions and cutscenes keep working.
import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SeatedCat, type CatLiveInput } from "./CatCharacter";
import { bakeByKey, within, type PartSpec, type V3 } from "./bake";
import { CAR_DIMENSIONS, bodySideX, getBodyGeometry } from "./carBody";
export { CAR_DIMENSIONS } from "./carBody";
const D = CAR_DIMENSIONS;

// ───────────────────────── Shared part geometry ─────────────────────────
let partCache: ReturnType<typeof buildParts> | undefined;
function buildParts() {
  const lathe = (pts: [number, number][], segments = 44) => {
    const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments);
    g.rotateZ(-Math.PI / 2); // lathe axis Y → wheel axle X (outer face toward +X)
    return g;
  };
  const tire = lathe([[.215, -.112], [.262, -.126], [.305, -.122], [.329, -.1], [.339, -.055], [.342, 0], [.339, .055], [.329, .1], [.305, .122], [.262, .126], [.215, .112]], 48);
  const rim = lathe([[.205, -.1], [.214, -.09], [.214, .085], [.222, .1], [.21, .112], [.19, .1], [.16, .094], [.07, .104], [.04, .12], [.0, .128]], 40);
  const spokes = mergeGeometries(Array.from({ length: 5 }, (_, index) => {
    const g = new THREE.BoxGeometry(.03, .16, .036);
    g.translate(.108, .1, 0);
    g.rotateX(index / 5 * Math.PI * 2);
    return g;
  }));
  const hubCap = new THREE.SphereGeometry(.055, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  hubCap.rotateZ(-Math.PI / 2);
  const disc = new THREE.CylinderGeometry(.18, .18, .022, 36);
  disc.rotateZ(Math.PI / 2);
  const caliper = new THREE.BoxGeometry(.07, .12, .1);
  const tube = (points: [number, number, number][], radius: number, closed = false) =>
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed), 64, radius, 10, closed);
  // Windshield: gently wrapped glass with a chrome frame.
  const glassW = 1.34, glassH = .4;
  const wrap = (x: number) => .1 * (x / (glassW / 2)) ** 2;
  const glass = new THREE.PlaneGeometry(glassW, glassH, 24, 1);
  const gp = glass.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < gp.count; i++) gp.setZ(i, wrap(gp.getX(i)));
  glass.translate(0, glassH / 2, 0);
  glass.computeVertexNormals();
  const frameOutline: [number, number, number][] = [];
  for (let i = 0; i <= 12; i++) { const x = -glassW / 2 + glassW * i / 12; frameOutline.push([x, glassH, wrap(x)]); }
  frameOutline.push([glassW / 2, 0, wrap(glassW / 2)]);
  for (let i = 12; i >= 0; i--) { const x = -glassW / 2 + glassW * i / 12; frameOutline.push([x, .0, wrap(x)]); }
  frameOutline.push([-glassW / 2, glassH, wrap(-glassW / 2)]);
  const frame = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(frameOutline.map(p => new THREE.Vector3(...p)), true, "catmullrom", .05), 120, .016, 8, true);
  const bumper = (z: number, sign: number) => tube([[-.7, .37, z - sign * .13], [-.5, .36, z], [0, .355, z + sign * .05], [.5, .36, z], [.7, .37, z - sign * .13]], .026);
  const sideTrim = (side: number) => {
    const points: [number, number, number][] = [];
    for (let i = 0; i <= 16; i++) { const z = -.62 + 1.24 * i / 16; points.push([side * (bodySideX(z, .6) + .004), .6, z]); }
    return tube(points, .009);
  };
  const steeringRim = new THREE.TorusGeometry(.155, .021, 12, 40);
  const steeringSpokes = mergeGeometries([0, 1, 2].map(index => {
    const g = new THREE.BoxGeometry(.022, .13, .014);
    g.translate(0, -.075, 0);
    g.rotateZ(index * Math.PI * 2 / 3);
    return g;
  }));
  const gaugeRing = new THREE.TorusGeometry(.052, .009, 8, 32);
  const roundedBox = (w: number, h: number, depth: number, r: number) => {
    const shape = new THREE.Shape();
    const x = -w / 2 + r, y = -h / 2 + r;
    shape.moveTo(x, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, y);
    shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(x, h / 2); shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, y); shape.quadraticCurveTo(-w / 2, -h / 2, x, -h / 2);
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: r * .6, bevelThickness: r * .6, bevelSegments: 4, curveSegments: 6 });
    g.translate(0, 0, -depth / 2);
    return g;
  };
  return {
    tire, rim, spokes, hubCap, disc, caliper, glass, frame,
    frontBumper: bumper(-1.95, 1), rearBumper: bumper(1.95, -1),
    leftTrim: sideTrim(-1), rightTrim: sideTrim(1),
    steeringRim, steeringSpokes, gaugeRing,
    seatBase: roundedBox(.46, .1, .44, .04), seatBack: roundedBox(.46, .52, .11, .045),
    dash: roundedBox(1.2, .14, .16, .05), grille: roundedBox(.66, .15, .06, .04), taillight: roundedBox(.24, .085, .04, .03),
    plate: new THREE.PlaneGeometry(.34, .11),
    sphere: new THREE.SphereGeometry(1, 20, 14),
    column: new THREE.CylinderGeometry(.018, .022, .3, 10),
    needle: new THREE.BoxGeometry(.004, .042, .003),
    disc2d: new THREE.CircleGeometry(1, 28),
    underbody: new THREE.BoxGeometry(1.5, .04, 3.4),
  };
}
const parts = () => (partCache ??= buildParts());

// ───────────────────────── Materials (per renderer) ─────────────────────────
type CarMaterials = Record<"paint" | "interior" | "under" | "chrome" | "rubber" | "glass" | "trim" | "leather" | "headlamp" | "taillamp" | "gaugeFace" | "needle" | "disc" | "caliper" | "plate" | "startButton", THREE.Material>;
const carMaterialCache = new WeakMap<object, CarMaterials>();
function useCarMaterials(): CarMaterials {
  const gl = useThree(state => state.gl);
  return useMemo(() => {
    const cached = carMaterialCache.get(gl);
    if (cached) return cached;
    // Local studio reflection map: no network fetch, generated once per renderer.
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    pmrem.dispose();
    const made: CarMaterials = {
      paint: new THREE.MeshPhysicalMaterial({ color: "#c4221d", metalness: .22, roughness: .34, clearcoat: 1, clearcoatRoughness: .08, envMap: env, envMapIntensity: .5 }),
      interior: new THREE.MeshStandardMaterial({ color: "#5a3424", roughness: .72, envMap: env, envMapIntensity: .3 }),
      under: new THREE.MeshStandardMaterial({ color: "#1b1e21", roughness: .9 }),
      chrome: new THREE.MeshStandardMaterial({ color: "#f2f4f5", metalness: 1, roughness: .14, envMap: env, envMapIntensity: 1.3 }),
      rubber: new THREE.MeshStandardMaterial({ color: "#1c1e20", roughness: .9, envMap: env, envMapIntensity: .25 }),
      glass: new THREE.MeshPhysicalMaterial({ color: "#d6eef2", metalness: 0, roughness: .04, transparent: true, opacity: .26, envMap: env, envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide }),
      trim: new THREE.MeshStandardMaterial({ color: "#202326", roughness: .45, metalness: .2, envMap: env, envMapIntensity: .5 }),
      leather: new THREE.MeshPhysicalMaterial({ color: "#c08a5c", roughness: .6, sheen: .5, sheenColor: new THREE.Color("#f3d2ae"), envMap: env, envMapIntensity: .35 }),
      headlamp: new THREE.MeshPhysicalMaterial({ color: "#fff7df", emissive: "#ffe9b0", emissiveIntensity: 1.1, roughness: .05, clearcoat: 1, envMap: env }),
      taillamp: new THREE.MeshPhysicalMaterial({ color: "#b5121e", emissive: "#ff1f33", emissiveIntensity: 1.5, roughness: .2, clearcoat: 1, envMap: env, envMapIntensity: .25 }),
      gaugeFace: new THREE.MeshStandardMaterial({ color: "#13262a", emissive: "#1e5c63", emissiveIntensity: .55, roughness: .4 }),
      needle: new THREE.MeshBasicMaterial({ color: "#ff8a3d" }),
      disc: new THREE.MeshStandardMaterial({ color: "#8e9396", metalness: .9, roughness: .38, envMap: env, envMapIntensity: .6 }),
      caliper: new THREE.MeshStandardMaterial({ color: "#3b4045", metalness: .5, roughness: .4, envMap: env, envMapIntensity: .5 }),
      plate: new THREE.MeshStandardMaterial({ color: "#f1ead7", roughness: .5 }),
      startButton: new THREE.MeshStandardMaterial({ color: "#e0453b", emissive: "#ff3b2e", emissiveIntensity: .8, roughness: .3 }),
    };
    carMaterialCache.set(gl, made);
    return made;
  }, [gl]);
}


// ───────────────────────── Baked static parts ─────────────────────────
type CarKey = keyof CarMaterials;
let staticCache: ReturnType<typeof buildStatic> | undefined;
function buildStatic() {
  const p = parts();
  const S = (key: CarKey, geometry: THREE.BufferGeometry, position?: V3, rotation?: V3, scale?: number | V3): PartSpec<CarKey> => ({ key, geometry, position, rotation, scale });
  const specs: PartSpec<CarKey>[] = [
    S("under", p.underbody, [0, .25, 0]),
    // Lamps, grille, plate, chrome trim
    S("taillamp", p.sphere, [-.7, .48, -1.86], undefined, [.04, .022, .02]), S("taillamp", p.sphere, [.7, .48, -1.86], undefined, [.04, .022, .02]),
    S("taillamp", p.taillight, [-.57, .66, 1.925], [0, -.14, 0]), S("taillamp", p.taillight, [.57, .66, 1.925], [0, .14, 0]),
    S("trim", p.grille, [0, .47, -1.925]),
    S("chrome", p.sphere, [0, .435, -1.965], undefined, [.3, .006, .006]), S("chrome", p.sphere, [0, .495, -1.965], undefined, [.3, .006, .006]),
    S("plate", p.plate, [0, .5, 1.985]),
    S("chrome", p.frontBumper), S("chrome", p.rearBumper), S("chrome", p.leftTrim), S("chrome", p.rightTrim),
    // Dashboard, start button, centre console with gear selector
    S("trim", p.dash, [0, .79, -.39]),
    S("taillamp", p.sphere, [-.12, .8, -.31], undefined, [.022, .022, .01]),
    S("trim", p.seatBase, [0, .55, -.12], undefined, [.24, .9, .9]),
    S("chrome", p.sphere, [0, .63, -.08], undefined, .032),
    ...within([S("trim", p.column, [0, 0, -.14], [Math.PI / 2, 0, 0])], [-D.seatX, .86, -.17], [-.38, 0, 0]),
    ...within([S("chrome", p.frame)], [0, .86, -.5], [-.62, 0, 0]),
  ];
  for (const side of [-1, 1]) {
    specs.push(...within([S("chrome", p.sphere, undefined, undefined, [.098, .098, .05]), S("headlamp", p.sphere, [0, 0, -.018], undefined, [.084, .084, .045])], [side * .56, .63, -1.875], [0, side * -.18, 0]));
    specs.push(...within([S("paint", p.sphere, [side * .035, .045, 0], undefined, [.062, .04, .05]), S("chrome", p.sphere, [side * .012, .01, 0], [0, 0, -side * .5], [.009, .035, .009])], [side * .8, .9, -.5]));
    specs.push(S("leather", p.seatBase, [side * D.seatX, .5, .2]), S("leather", p.seatBack, [side * D.seatX, .78, .44], [.2, 0, 0]));
    specs.push(S("paint", p.sphere, [side * D.seatX, .86, 1.12], undefined, [.19, .13, .42]));
  }
  for (const x of [-.4, -.26]) specs.push(...within([S("chrome", p.gaugeRing), S("gaugeFace", p.disc2d, [0, 0, -.002], undefined, .05)], [x, .82, -.3], [-.25, 0, 0]));
  const wheelChrome = (side: 1 | -1) => bakeByKey<CarKey>(within([S("chrome", p.rim), S("chrome", p.spokes), S("chrome", p.hubCap, [.118, 0, 0])], [0, 0, 0], [0, side < 0 ? Math.PI : 0, 0])).chrome!;
  return {
    body: bakeByKey(specs),
    steering: bakeByKey<CarKey>([S("trim", p.steeringRim), S("trim", p.sphere, undefined, undefined, [.035, .035, .02]), S("chrome", p.steeringSpokes)]),
    wheelChrome: { [-1]: wheelChrome(-1), [1]: wheelChrome(1) } as Record<number, THREE.BufferGeometry>,
  };
}
const staticParts = () => (staticCache ??= buildStatic());

// ───────────────────────── Components ─────────────────────────
function WheelCorner({ materials, position, side, front, spinRef, steerRef }: { materials: CarMaterials; position: V3; side: 1 | -1; front: boolean; spinRef: (g: THREE.Group | null) => void; steerRef?: (g: THREE.Group | null) => void }) {
  const p = parts();
  return <group position={position}>
    <group ref={steerRef}>
      {/* Tyre, rim and brake disc spin together; the caliper stays fixed to the knuckle. */}
      <group ref={spinRef}>
        <mesh geometry={p.tire} material={materials.rubber} castShadow />
        <mesh geometry={staticParts().wheelChrome[side]} material={materials.chrome} />
        <mesh geometry={p.disc} material={materials.disc} position={[side * .02, 0, 0]} />
      </group>
      <mesh geometry={p.caliper} material={materials.caliper} position={[side * .045, .1, front ? .1 : -.1]} />
    </group>
  </group>;
}

export type HeroConvertibleProps = {
  /** Front road-wheel angle in radians (+ = right), as used by the race sim. */
  steer?: number;
  /** Accumulated wheel rotation in radians. */
  spin?: number;
  /** Vehicle speed in km/h for the gauge needle and wind effects. */
  speed?: number;
  /** Show the two cats (true in the story; off for an empty showroom view). */
  crew?: boolean;
  /** Ship arrival: the cats cheer (smiling eyes, both arms up). */
  cheer?: boolean;
  /** Lets a cutscene toggle the seated crew per frame (e.g. hidden until the cats board). */
  crewRef?: React.Ref<THREE.Group>;
};

const CORNERS: { z: number; side: 1 | -1; front: boolean }[] = [
  { z: D.frontAxleZ, side: -1, front: true }, { z: D.frontAxleZ, side: 1, front: true },
  { z: D.rearAxleZ, side: -1, front: false }, { z: D.rearAxleZ, side: 1, front: false },
];

export function HeroConvertible({ steer = 0, spin = 0, speed = 0, crew = true, crewRef, cheer = false }: HeroConvertibleProps) {
  const materials = useCarMaterials();
  // Per-frame values go through refs; the React tree below is built once.
  const live = useRef({ steer, spin, speed });
  live.current = { steer, spin, speed };
  const catLive = useRef<CatLiveInput>({ steer, speed });
  catLive.current = { steer, speed, cheer };
  const spinGroups = useRef<(THREE.Group | null)[]>([]);
  const steerGroups = useRef<(THREE.Group | null)[]>([]);
  const steering = useRef<THREE.Group>(null);
  const needle = useRef<THREE.Group>(null);
  const pawLeft = useRef<THREE.Object3D>(null);
  const pawRight = useRef<THREE.Object3D>(null);

  useFrame((_, delta) => {
    const { steer: s, spin: w, speed: v } = live.current;
    // Spin groups sit in car axes, so all four wheels share one sign (top rolls toward -Z when driving forward).
    for (const group of spinGroups.current) if (group) group.rotation.x = THREE.MathUtils.damp(group.rotation.x, -w, 24, delta);
    for (const group of steerGroups.current) if (group) group.rotation.y = -s;
    // Steering wheel turns ~14.5× the road-wheel angle (clockwise from the driver's seat when steering right).
    if (steering.current) steering.current.rotation.z = THREE.MathUtils.clamp(-s * 14.5, -2.4, 2.4);
    if (needle.current) needle.current.rotation.z = Math.PI * .75 - THREE.MathUtils.clamp(v / 180, 0, 1) * Math.PI * 1.5;
  });

  return useMemo(() => {
    const p = parts();
    const baked = staticParts();
    return <group>
      <mesh geometry={getBodyGeometry()} material={[materials.paint, materials.interior, materials.under]} castShadow receiveShadow />
      {(Object.keys(baked.body) as CarKey[]).map(key => <mesh key={key} geometry={baked.body[key]} material={materials[key]} castShadow={key === "paint"} />)}
      <group position={[0, .86, -.5]} rotation={[-.62, 0, 0]}><mesh geometry={p.glass} material={materials.glass} renderOrder={2} /></group>
      <group position={[-.4, .82, -.3]} rotation={[-.25, 0, 0]}>
        <group ref={needle} position={[0, 0, .004]}><mesh geometry={p.needle} material={materials.needle} position={[0, .018, 0]} /></group>
      </group>
      {/* Steering wheel: rotates about its column; paw anchors ride on the rim */}
      <group position={[-D.seatX, .86, -.17]} rotation={[-.38, 0, 0]}>
        <group ref={steering}>
          {(Object.keys(baked.steering) as CarKey[]).map(key => <mesh key={key} geometry={baked.steering[key]} material={materials[key]} />)}
          <object3D ref={pawLeft} position={[-.135, .07, .02]} />
          <object3D ref={pawRight} position={[.135, .07, .02]} />
        </group>
      </group>
      {CORNERS.map((corner, index) => <WheelCorner key={index} materials={materials} side={corner.side} front={corner.front}
        position={[corner.side * D.wheelX, D.wheelRadius, corner.z]}
        spinRef={group => { spinGroups.current[index] = group; }}
        steerRef={corner.front ? group => { steerGroups.current[index] = group; } : undefined} />)}
      {crew && <group ref={crewRef}>
        <group position={[-D.seatX, .555, .16]}><SeatedCat variant="lou" pawTargets={[pawLeft, pawRight]} live={catLive} /></group>
        <group position={[D.seatX, .555, .16]}><SeatedCat variant="ming" live={catLive} armsFree /></group>
      </group>}
    </group>;
  }, [materials, crew, crewRef]);
}
