// Renders a code-built part from partModels.ts. One draw call per material,
// plus one per material for each moving group.
import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as THREE from "three";
import { PART_PALETTE, getPartModel, type MatKey, type MovingGroup } from "./partModels.ts";

const materialCache = new WeakMap<object, Record<MatKey, THREE.MeshStandardMaterial>>();
/** One material per palette key and renderer, with a local studio reflection map (no network fetch). */
function useMaterials() {
  const gl = useThree(state => state.gl);
  return useMemo(() => {
    const cached = materialCache.get(gl);
    if (cached) return cached;
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    pmrem.dispose();
    const made = Object.fromEntries(Object.entries(PART_PALETTE).map(([key, spec]) => [key, new THREE.MeshStandardMaterial({
      color: spec.color, metalness: spec.metalness, roughness: spec.roughness, envMap: env, envMapIntensity: spec.metalness > .5 ? 1 : .4,
      ...("emissive" in spec ? { emissive: spec.emissive, emissiveIntensity: 1.4 } : {}),
    })])) as Record<MatKey, THREE.MeshStandardMaterial>;
    materialCache.set(gl, made);
    return made;
  }, [gl]);
}

function Baked({ geometries, castShadow }: { geometries: MovingGroup["geometries"]; castShadow: boolean }) {
  const mats = useMaterials();
  return <>{(Object.keys(geometries) as MatKey[]).map(key =>
    <mesh key={key} geometry={geometries[key]} material={mats[key]} castShadow={castShadow} receiveShadow />)}</>;
}

/** Looping showcase motion for scenes that just want the part to look alive. */
const demoInput = (mode: MovingGroup["mode"], t: number) =>
  mode === "spin" ? 6 : mode === "rotate" ? Math.sin(t * 1.2) * .45 : mode === "explode" ? 0 : (Math.sin(t * 3) + 1) * .4;

function Moving({ group, input: fixedInput, demo }: { group: MovingGroup; input: number; demo: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }, delta) => {
    const g = ref.current;
    if (!g) return;
    const input = demo ? demoInput(group.mode, clock.elapsedTime) : fixedInput;
    const axis = group.axis;
    if (group.mode === "spin") g.rotation[axis] += delta * input * group.range;
    else if (group.mode === "rotate") g.rotation[axis] = THREE.MathUtils.clamp(input, -group.range, group.range);
    else if (group.mode === "press") g.rotation[axis] = THREE.MathUtils.clamp(input, 0, 1) * group.range;
    else g.position[axis] = group.pivot[{ x: 0, y: 1, z: 2 }[axis]] + THREE.MathUtils.clamp(input, 0, 1) * group.range;
  });
  return <group ref={ref} position={group.pivot}><Baked geometries={group.geometries} castShadow /></group>;
}

/**
 * `input` drives every moving group: pedal travel 0..1, steering/dial angle in rad,
 * spin speed in rad/s, explode/push 0..1. `scale` 1 = real size in metres.
 */
export function PartModel({ id, input = 0, demo = false, scale = 1, castShadow = true, ...props }: { id: string; input?: number; demo?: boolean; scale?: number; castShadow?: boolean } & Omit<React.ComponentProps<"group">, "id" | "scale">) {
  const model = useMemo(() => getPartModel(id), [id]);
  return <group scale={scale} {...props}>
    <Baked geometries={model.geometries} castShadow={castShadow} />
    {model.moving.map(group => <Moving key={group.name} group={group} input={input} demo={demo} />)}
  </group>;
}

/** Part scaled to `size` (largest side, scene units) and centred on the origin, for garage/bench slots. */
export function FittedPart({ id, size, ...props }: { id: string; size: number } & Omit<React.ComponentProps<typeof PartModel>, "id" | "scale">) {
  const model = useMemo(() => getPartModel(id), [id]);
  const fit = size / Math.max(...model.size);
  return <group position={[-model.center[0] * fit, -model.center[1] * fit, -model.center[2] * fit]}><PartModel id={id} scale={fit} {...props} /></group>;
}
