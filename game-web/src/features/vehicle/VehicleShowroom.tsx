// Dev-only QA view: `?showroom=car` (only mounted when import.meta.env.DEV).
// Orbit around the hero car, toggle steering/speed and read the renderer stats.
import React, { useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { HeroConvertible } from "./HeroConvertible";

function Stats({ onStats }: { onStats: (text: string) => void }) {
  const gl = useThree(state => state.gl);
  let frames = 0, last = performance.now();
  useFrame(() => {
    frames++;
    const now = performance.now();
    if (now - last > 1000) {
      onStats(`${Math.round(frames * 1000 / (now - last))} fps · ${gl.info.render.calls} draw calls · ${Math.round(gl.info.render.triangles / 1000)}k tris`);
      frames = 0; last = now;
    }
  });
  return null;
}

function Driving({ steer, speed }: { steer: number; speed: number }) {
  const [spin, setSpin] = useState(0);
  useFrame((_, delta) => setSpin(value => value + delta * speed / 3.6 / .34 * .12));
  return <HeroConvertible steer={steer} spin={spin} speed={speed} />;
}

export function VehicleShowroom() {
  const [steer, setSteer] = useState(0);
  const [speed, setSpeed] = useState(40);
  const [stats, setStats] = useState("");
  return <div style={{ position: "fixed", inset: 0, background: "#c9dfe0" }}>
    <Canvas shadows camera={{ position: [4.2, 2.1, -4.6], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
      <color attach="background" args={["#c9dfe0"]} />
      <hemisphereLight intensity={1.8} color="#fff5dc" groundColor="#4c735d" />
      <directionalLight castShadow position={[-6, 10, 6]} intensity={2.8} shadow-mapSize={[2048, 2048]} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[7, 64]} /><meshStandardMaterial color="#56636a" roughness={.95} /></mesh>
      <Driving steer={steer} speed={speed} />
      <OrbitControls target={[0, .6, 0]} minDistance={1.5} maxDistance={12} />
      <Stats onStats={setStats} />
    </Canvas>
    <div style={{ position: "absolute", left: 16, top: 16, background: "#fffd", padding: 12, borderRadius: 10, font: "13px system-ui", display: "grid", gap: 6 }}>
      <b>HeroConvertible QA</b>
      <label>steer {steer.toFixed(2)} rad <input type="range" min={-.43} max={.43} step={.01} value={steer} onChange={event => setSteer(Number(event.target.value))} /></label>
      <label>speed {speed} km/h <input type="range" min={0} max={160} value={speed} onChange={event => setSpeed(Number(event.target.value))} /></label>
      <span data-showroom-stats>{stats}</span>
    </div>
  </div>;
}
