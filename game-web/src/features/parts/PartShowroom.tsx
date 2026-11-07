// Dev-only QA view: `?showroom=parts` (only mounted when import.meta.env.DEV).
// Pick a part, drive its moving group, compare with the reference image.
import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PART_MODEL_IDS, getPartModel, partTriangles } from "./partModels.ts";
import { PartModel } from "./PartModel.tsx";
import { DevRenderProbe } from "../vehicle/DevRenderProbe.tsx";

/** `?showroom=parts&grid=1`: every model side by side, each scaled to the same size. */
function PartGrid() {
  const cols = 7;
  return <Canvas camera={{ position: [0, 1.2, 4.6], fov: 40 }} dpr={[1, 1.5]}>
    <color attach="background" args={["#c9dfe0"]} />
    <hemisphereLight intensity={1.6} color="#fff5dc" groundColor="#4c735d" />
    <directionalLight position={[-2, 4, 3]} intensity={2.6} />
    {PART_MODEL_IDS.map((partId, index) => {
      const model = getPartModel(partId);
      const fit = .38 / Math.max(...model.size);
      const x = (index % cols - (cols - 1) / 2) * .66, y = (1.5 - Math.floor(index / cols)) * .62;
      return <group key={partId} position={[x, y, 0]} rotation={[.25, -.6, 0]}>
        <group scale={fit} position={[-model.center[0] * fit, -model.center[1] * fit, -model.center[2] * fit]}><PartModel id={partId} castShadow={false} /></group>
      </group>;
    })}
    <OrbitControls target={[0, 0, 0]} />
    <DevRenderProbe name="parts" />
  </Canvas>;
}

export function PartShowroom() {
  return new URLSearchParams(location.search).get("grid")
    ? <div style={{ position: "fixed", inset: 0 }}><PartGrid /></div>
    : <SinglePart />;
}

function SinglePart() {
  const initial = new URLSearchParams(location.search).get("part");
  const [id, setId] = useState(initial && PART_MODEL_IDS.includes(initial) ? initial : PART_MODEL_IDS[0]);
  const [input, setInput] = useState(0);
  const [anchors, setAnchors] = useState(false);
  const model = useMemo(() => getPartModel(id), [id]);
  const fit = .4 / Math.max(...model.size); // show every part at about the same screen size
  const mode = model.moving[0]?.mode;
  const range = mode === "spin" ? [0, 20] : mode === "rotate" ? [-model.moving[0].range, model.moving[0].range] : [0, 1];
  return <div style={{ position: "fixed", inset: 0, background: "#c9dfe0" }}>
    <Canvas shadows camera={{ position: [.55, .4, .7], fov: 35 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#c9dfe0"]} />
      <hemisphereLight intensity={1.6} color="#fff5dc" groundColor="#4c735d" />
      <directionalLight castShadow position={[-2, 4, 3]} intensity={2.6} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -.3, 0]}><circleGeometry args={[1.5, 48]} /><meshStandardMaterial color="#56636a" roughness={.95} /></mesh>
      <group scale={fit} position={[-model.center[0] * fit, -model.center[1] * fit, -model.center[2] * fit]}>
        <PartModel key={id} id={id} input={input} />
        {anchors && Object.entries(model.anchors).map(([name, p]) => <mesh key={name} position={p}><sphereGeometry args={[.004 / fit * .5, 10, 8]} /><meshBasicMaterial color="#ff2fa0" /></mesh>)}
      </group>
      <OrbitControls target={[0, 0, 0]} minDistance={.3} maxDistance={3} />
      <DevRenderProbe name="parts" />
    </Canvas>
    <div style={{ position: "absolute", left: 16, top: 16, background: "#fffd", padding: 12, borderRadius: 10, font: "13px system-ui", display: "grid", gap: 6, maxWidth: 300 }}>
      <b>Part model QA</b>
      <select value={id} onChange={event => { setId(event.target.value); setInput(0); }}>
        {PART_MODEL_IDS.map(partId => <option key={partId} value={partId}>{partId}</option>)}
      </select>
      {mode && <label>{model.moving[0].name} ({mode}) {input.toFixed(2)} <input type="range" min={range[0]} max={range[1]} step={.01} value={input} onChange={event => setInput(Number(event.target.value))} /></label>}
      <label><input type="checkbox" checked={anchors} onChange={event => setAnchors(event.target.checked)} /> port anchors</label>
      <span data-part-stats>{(model.size.map(v => (v * 100).toFixed(1)).join(" × "))} cm · {Math.round(partTriangles(model))} tris</span>
      <img src={`/assets/intake/images/${model.ref}`} alt="reference" style={{ width: 260, borderRadius: 6, background: "#fff" }} />
    </div>
  </div>;
}
