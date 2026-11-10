// Garage Vehicle/System view: the selected function's parts where they really sit in the car,
// at real size (one scale for everything), wired port to port, like the car opened up.
// - Nothing moves and nothing flows until the player applies the input (activeStep / inputOn).
// - Each cable is coloured and named by what it carries (sim CONNECTIONS flow type, else inferred).
import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { PartModel } from "../parts/PartModel";
import { getPartModel } from "../parts/partModels";
import { CONNECTIONS } from "../../sim/components";
import { getComponent } from "../../sim/registry";
import { getFeatureLayer, partModelFor, type DomainId } from "../../experiences";

/** Scene units per metre: the garage car shell is 4.7 m ≈ 7.2 units long. */
export const U = 1.53;
type V3 = [number, number, number];
type Place = { p: V3; r?: V3; s?: number };
const H = Math.PI / 2;

// Vehicle frame in metres: front = -X, driver side (left-hand drive) = +Z, y = height above the ground.
// Front axle x = -1.67, rear axle x = +1.67, wheel centres z = ±0.78, wheel radius 0.33.
const PLACE: Record<string, Place> = {
  // cabin · driver controls
  accel_pedal: { p: [-0.98, 0.28, 0.27], r: [0, H, 0] },
  brake_pedal: { p: [-0.98, 0.28, 0.43], r: [0, H, 0] },
  steering_wheel: { p: [-0.42, 0.98, 0.37], r: [0, 0, -0.38] },
  steering_torque_sensor: { p: [-0.62, 0.86, 0.37], r: [0, 0, -0.38] },
  steering_column: { p: [-0.78, 0.78, 0.37], r: [0, 0, -0.38] },
  start_button: { p: [-0.72, 0.88, 0.08], r: [0, H, 0] },
  gear_selector: { p: [-0.38, 0.62, 0.0] },
  instrument_cluster: { p: [-0.78, 1.02, 0.37], r: [0, H, 0] },
  vcu: { p: [-1.02, 0.78, -0.22] },
  imu_sensor: { p: [-0.05, 0.3, 0.0] },
  // front motor room
  traction_motor: { p: [-1.67, 0.34, -0.2], r: [0, H, 0] },
  reduction_gear: { p: [-1.67, 0.34, 0.1], r: [0, H, 0] },
  differential: { p: [-1.67, 0.32, 0.26], r: [0, H, 0] },
  drive_shaft: { p: [-1.67, 0.33, 0.62], r: [0, H, 0] },
  wheel: { p: [-1.67, 0.33, 0.78], r: [0, -H, 0] },
  inverter: { p: [-1.6, 0.6, -0.18] },
  mcu: { p: [-1.6, 0.68, 0.12] },
  rotor_position_sensor: { p: [-1.67, 0.34, -0.36], r: [0, H, 0] },
  motor_temp_sensor: { p: [-1.62, 0.52, -0.24] },
  park_lock_actuator: { p: [-1.52, 0.48, 0.14] },
  park_position_sensor: { p: [-1.52, 0.44, 0.3] },
  park_ecu: { p: [-1.38, 0.58, 0.42] },
  // brakes
  brake_ecu: { p: [-1.92, 0.78, 0.46] },
  hydraulic_modulator: { p: [-1.92, 0.64, 0.46] },
  brake_line: { p: [-1.86, 0.62, 0.52], r: [0, -0.4, 0] },
  brake_caliper: { p: [-1.67, 0.33, 0.7], r: [0, -H, 0] },
  wheel_speed_sensor: { p: [-1.6, 0.26, 0.66], r: [0, -H, 0] },
  // steering
  steering_rack: { p: [-1.42, 0.38, 0.0], r: [0, H, 0] },
  eps_motor: { p: [-0.9, 0.72, 0.37], r: [0, 0, -0.38] },
  eps_power_pack: { p: [-1.42, 0.42, -0.32], r: [0, H, 0] },
  eps_ecu: { p: [-0.86, 0.66, 0.2] },
  // high voltage
  hv_battery: { p: [0.05, 0.16, 0.0], s: 2 },
  bms: { p: [0.75, 0.26, -0.45] },
  main_contactor: { p: [-0.78, 0.24, -0.3] },
  isolation_monitor: { p: [-0.78, 0.24, 0.0] },
  cell_monitor_board: { p: [0.4, 0.27, 0.3] },
  hv_junction_box: { p: [-1.32, 0.62, -0.42] },
  charging_port: { p: [1.95, 0.8, -0.86], r: [0, Math.PI, 0] },
  obc: { p: [1.72, 0.45, 0.0] },
  dcdc_converter: { p: [-1.32, 0.58, 0.42] },
  lv_battery: { p: [-2.0, 0.55, -0.48] },
  // thermal
  thermal_ecu: { p: [-2.02, 0.66, -0.36] },
  cooling_pump: { p: [-1.92, 0.34, -0.42] },
  coolant_valve: { p: [-1.86, 0.44, -0.18] },
  cooling_fan: { p: [-2.12, 0.5, 0.02], r: [0, H, 0] },
  radiator: { p: [-2.22, 0.5, 0.0], r: [0, H, 0] },
  // suspension (front-left corner unless noted)
  coil_spring: { p: [-1.67, 0.52, 0.66] },
  damper: { p: [-1.67, 0.46, 0.62] },
  cdc_damper: { p: [-1.67, 0.46, 0.62] },
  body_shell: { p: [-1.67, 0.86, 0.6] },
  chassis_ecu: { p: [0.95, 0.3, -0.42] },
  ride_height_sensor: { p: [1.62, 0.3, 0.6], r: [0, -H, 0] },
  air_spring: { p: [1.67, 0.42, 0.66] },
  air_compressor: { p: [1.95, 0.26, 0.38] },
  generic_ecu: { p: [-0.9, 0.7, -0.4] },
  position_sensor: { p: [-1.52, 0.44, 0.3] },
  height_sensor: { p: [1.62, 0.3, 0.6] },
};
const NETWORK = new Set(["can_harness", "hv_cable"]);
const ECU = /^(vcu|mcu|bms|.*_ecu)$/;
const MECH = new Set(["traction_motor", "reduction_gear", "differential", "drive_shaft", "wheel", "steering_rack", "eps_motor", "eps_power_pack", "steering_column", "steering_wheel", "brake_caliper", "coil_spring", "damper", "cdc_damper", "body_shell", "air_spring"]);
const HV = new Set(["hv_battery", "main_contactor", "inverter", "hv_junction_box", "obc", "dcdc_converter", "charging_port", "isolation_monitor"]);

export const FLOW_INFO: Record<string, { label: string; color: string; r: number }> = {
  analog: { label: "전기 신호 · 센서 값", color: "#3f8fd0", r: .007 },
  digital: { label: "전기 신호 · 명령(PWM)", color: "#8d6ac0", r: .007 },
  can_message: { label: "CAN 메시지", color: "#d9a520", r: .009 },
  electrical_power: { label: "고전압 전력", color: "#f07a32", r: .014 },
  lv_power: { label: "12V 전력", color: "#d0463a", r: .009 },
  mechanical_torque: { label: "기계 힘·토크", color: "#7b8794", r: .016 },
  rotational_speed: { label: "회전 (센서가 읽음)", color: "#5fb0b8", r: .006 },
  hydraulic_pressure: { label: "유압 (브레이크액)", color: "#c0392b", r: .009 },
  thermal: { label: "냉각수 · 열", color: "#2f9fc4", r: .013 },
  air: { label: "압축 공기", color: "#a9c7d6", r: .009 },
};

type Node = { index: number; id: string; place: Place; copy: number };
export type Segment = { from: Node; to: Node; flow: string; fromPort?: string; toPort?: string };

function inferFlow(a: string, b: string): string {
  if (a === "hydraulic_modulator" || a === "brake_line") return "hydraulic_pressure";
  if (a === "air_compressor") return "air";
  if (a === "cooling_pump" || a === "coolant_valve" || b === "radiator") return "thermal";
  if (a === "lv_battery" || b === "lv_battery" || b === "instrument_cluster" && a === "dcdc_converter") return "lv_power";
  if (HV.has(a) && HV.has(b) || a === "hv_battery" || a === "dcdc_converter" && b !== "lv_battery") return "electrical_power";
  if (MECH.has(a) && MECH.has(b)) return "mechanical_torque";
  if (ECU.test(a) && ECU.test(b)) return "can_message";
  if (ECU.test(b)) return "analog";
  return "digital";
}

/** Physical nodes of a feature's E/E chain and the cables between them (network nodes become the cable). */
export function layoutOf(domain: DomainId, feature: number) {
  const chain = getFeatureLayer(domain, feature, 1);
  const seen: Record<string, number> = {};
  const nodes: Node[] = [];
  const between: string[][] = [];
  let pending: string[] = [];
  chain.forEach((label, index) => {
    const id = partModelFor(domain, label);
    if (!id) return;
    if (NETWORK.has(id)) { pending.push(id); return; }
    const copy = seen[id] = (seen[id] ?? -1) + 1;
    const place = PLACE[id] ?? { p: [-0.9 + index * .25, .5, -.5] };
    nodes.push({ index, id, place, copy });
    if (nodes.length > 1) between.push(pending);
    pending = [];
  });
  const segments: Segment[] = nodes.slice(1).map((to, k) => {
    const from = nodes[k];
    const via = between[k] ?? [];
    if (via.includes("can_harness")) return { from, to, flow: "can_message" };
    if (via.includes("hv_cable")) return { from, to, flow: "electrical_power" };
    const c = CONNECTIONS.find(item => item.from.split(".")[0] === from.id && item.to.split(".")[0] === to.id);
    if (c) return { from, to, flow: c.flow, fromPort: c.from.split(".")[1], toPort: c.to.split(".")[1] };
    return { from, to, flow: inferFlow(from.id, to.id) };
  });
  return { chain, nodes, segments };
}

const euler = new THREE.Euler();
/** World position (scene units) of one anchor of a placed part. */
function anchorWorld(node: Node, side: "in" | "out", port?: string): THREE.Vector3 {
  const model = getPartModel(node.id);
  const names = Object.keys(model.anchors);
  const ports = getComponent(node.id)?.ports;
  const pick = port && model.anchors[port] ? port
    : ports?.find(item => item.direction === side && names.includes(item.id))?.id
      ?? (model.anchors[side] ? side : names[side === "in" ? 0 : names.length - 1]);
  const a = model.anchors[pick];
  const s = U * (node.place.s ?? 1);
  euler.set(...(node.place.r ?? [0, 0, 0]));
  return new THREE.Vector3(a[0] * s, a[1] * s, a[2] * s).applyEuler(euler).add(new THREE.Vector3(...offsetOf(node)));
}
const offsetOf = (node: Node): V3 => [node.place.p[0] * U, (node.place.p[1] + node.copy * .14) * U, node.place.p[2] * U];

function FlowCable({ a, b, flow, on, tag }: { a: THREE.Vector3; b: THREE.Vector3; flow: string; on: boolean; tag?: string }) {
  const info = FLOW_INFO[flow] ?? FLOW_INFO.digital;
  const curve = useMemo(() => {
    const d = a.distanceTo(b);
    if (flow === "mechanical_torque" && d < .9) return new THREE.CatmullRomCurve3([a, b]);
    const lift = Math.min(.35, .06 + d * .06);
    const top = Math.max(a.y, b.y) + lift;
    return new THREE.CatmullRomCurve3([a, new THREE.Vector3(a.x, a.y + lift * .6, a.z), new THREE.Vector3((a.x + b.x) / 2, top, (a.z + b.z) / 2), new THREE.Vector3(b.x, b.y + lift * .6, b.z), b]);
  }, [a.x, a.y, a.z, b.x, b.y, b.z, flow]);
  const pulses = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    pulses.current.forEach((pulse, k) => {
      if (!pulse) return;
      pulse.visible = on;
      if (on) pulse.position.copy(curve.getPointAt((clock.elapsedTime * .45 + k / 3) % 1));
    });
  });
  const radius = info.r * U * 1.5;
  const mid = curve.getPointAt(.5);
  return <group>
    <mesh><tubeGeometry args={[curve, 48, radius, 8, false]} /><meshStandardMaterial color={on ? info.color : "#7f8a86"} emissive={on ? info.color : "#000"} emissiveIntensity={on ? .45 : 0} transparent opacity={on ? .95 : .55} /></mesh>
    {[0, 1, 2].map(k => <mesh key={k} visible={false} ref={el => { if (el) pulses.current[k] = el; }}><sphereGeometry args={[radius * 2.1, 12, 8]} /><meshStandardMaterial color="#fffbe0" emissive={info.color} emissiveIntensity={2.2} /></mesh>)}
    {tag && <Html center position={[mid.x, mid.y + .12, mid.z]} distanceFactor={3.6} zIndexRange={[20, 0]}><span className="cableTag" style={{ borderColor: info.color }}><i style={{ background: info.color }} />{tag}</span></Html>}
  </group>;
}

function PlacedPart({ node, arrived, isInput, domain, feature, selected, onSelect }: { node: Node; arrived: boolean; isInput: boolean; domain: DomainId; feature: number; selected: boolean; onSelect?: (index: number) => void }) {
  const model = useMemo(() => getPartModel(node.id), [node.id]);
  const mode = model.moving[0]?.mode;
  const input = arrived ? (mode === "spin" ? 9 : mode === "rotate" ? .45 : 1) : 0;
  const [hovered, setHovered] = useState(false);
  const label = getFeatureLayer(domain, feature, 1)[node.index] ?? node.id;
  const press = (action: "start" | "end") => dispatchEvent(new CustomEvent("tb-garage-input", { detail: { action } }));
  return <group position={offsetOf(node)} rotation={node.place.r ?? [0, 0, 0]}
    onPointerDown={isInput ? event => { event.stopPropagation(); press("start"); } : undefined}
    onPointerUp={isInput ? () => press("end") : undefined}
    onPointerOut={() => { setHovered(false); if (isInput) press("end"); document.body.style.cursor = ""; }}
    onPointerOver={event => { event.stopPropagation(); setHovered(true); document.body.style.cursor = isInput ? "pointer" : "help"; }}
    onClick={!isInput ? event => { if ((event as any).delta > 6) return; event.stopPropagation(); onSelect?.(node.index); dispatchEvent(new CustomEvent("tb-garage-step", { detail: { index: node.index } })); } : undefined}
    onDoubleClick={event => { event.stopPropagation(); dispatchEvent(new CustomEvent("tb-part-inspect", { detail: { domain, feature, index: node.index } })); }}>
    <PartModel id={node.id} scale={U * (node.place.s ?? 1)} input={input} castShadow={false} />
    {selected && <mesh scale={.34 * U}><sphereGeometry args={[1, 18, 14]} /><meshBasicMaterial color="#e09b35" transparent opacity={.18} depthWrite={false} /></mesh>}
    {(hovered || selected) && <Html center position={[0, .32 * U, 0]} distanceFactor={3.35} zIndexRange={[21, 0]}><span className={`garageVehiclePartLabel ${selected ? "selected" : ""}`}>{label}</span></Html>}
  </group>;
}

function SupportPart({ node, active }: { node: Node; active: boolean }) {
  const model = useMemo(() => getPartModel(node.id), [node.id]);
  const mode = model.moving[0]?.mode;
  const input = active ? (mode === "spin" ? 9 : mode === "rotate" ? .45 : 1) : 0;
  return <group position={offsetOf(node)} rotation={node.place.r ?? [0, 0, 0]}>
    <PartModel id={node.id} scale={U * (node.place.s ?? 1)} input={input} castShadow={false} />
  </group>;
}

/** The final drive response: hub, tyre and spokes rotate together only after
 * the shared signal has reached the vehicle-output stage. */
function ContextWheel({ position, active }: { position: V3; active: boolean }) {
  const wheel = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (wheel.current && active) wheel.current.rotation.x -= delta * 7; });
  return <group position={position} ref={wheel}>
    <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.27 * U, .07 * U, 12, 40]} /><meshStandardMaterial color="#2a302f" transparent opacity={.72} roughness={.8} /></mesh>
    <PartModel id="wheel" scale={U * 2.8} input={0} castShadow={false} />
    {[0, 1, 2, 3].map(index => <mesh key={index} rotation={[index * Math.PI / 2, 0, 0]}><boxGeometry args={[.035 * U, .34 * U, .025 * U]} /><meshStandardMaterial color="#aeb7b2" metalness={.55} roughness={.35} /></mesh>)}
  </group>;
}

/** Faint car around the parts: body outline, floor and four tyres at the real wheel positions. */
function CarContext({ strong, wheelActive = false }: { strong: boolean; wheelActive?: boolean }) {
  const body = useMemo(() => {
    const s = new THREE.Shape();
    // side profile in metres (front = -x): bumper, hood, windshield, roof, rear glass, trunk
    const pts: [number, number][] = [[-2.35, .2], [-2.35, .55], [-2.15, .72], [-1.2, .8], [-0.55, 1.32], [0.55, 1.4], [1.35, 1.28], [1.95, .9], [2.35, .82], [2.35, .2]];
    pts.forEach(([x, y], k) => (k ? s.lineTo(x * U, y * U) : s.moveTo(x * U, y * U)));
    s.closePath();
    return s;
  }, []);
  return <group>
    <mesh position={[0, 0, -.9 * U]}><extrudeGeometry args={[body, { depth: 1.8 * U, bevelEnabled: false }]} /><meshStandardMaterial color="#d94e45" transparent opacity={strong ? .16 : .05} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, .05, 0]}><boxGeometry args={[4.4 * U, .02, 1.6 * U]} /><meshStandardMaterial color="#8d9a95" transparent opacity={.25} depthWrite={false} /></mesh>
    {[-1.67, 1.67].flatMap(x => [-.78, .78].map(z => <ContextWheel key={`${x}${z}`} position={[x * U, .33 * U, z * U]} active={wheelActive} />))}
  </group>;
}

export function VehicleLayoutRig({ domain, feature, activeStep, inputOn, shell, selectedIndex = null, onSelect }: { domain: DomainId; feature: number; activeStep: number; inputOn: boolean; shell: boolean; selectedIndex?: number | null; onSelect?: (index: number) => void }) {
  const { nodes, segments } = useMemo(() => layoutOf(domain, feature), [domain, feature]);
  const drivePower = useMemo(() => {
    if (domain !== "drive" || feature !== 0) return null;
    const inverter = nodes.find(node => node.id === "inverter");
    if (!inverter) return null;
    const battery: Node = { index: -2, id: "hv_battery", place: PLACE.hv_battery, copy: 0 };
    const contactor: Node = { index: -1, id: "main_contactor", place: PLACE.main_contactor, copy: 0 };
    return { battery, contactor, inverter };
  }, [domain, feature, nodes]);
  const signals = getFeatureLayer(domain, feature, 0);
  // centre the used parts in the view (the car moves with them)
  const centre = useMemo(() => {
    const xs = nodes.map(n => n.place.p[0]), zs = nodes.map(n => n.place.p[2]);
    return [-(Math.min(...xs) + Math.max(...xs)) / 2 * U, -.25, -(Math.min(...zs) + Math.max(...zs)) / 2 * U] as V3;
  }, [nodes]);
  const energizedStep = inputOn ? activeStep : -1;
  const arrived = (index: number) => inputOn && energizedStep >= index;
  const signalAt = (index: number) => signals[Math.min(signals.length - 1, Math.round(index * (signals.length - 1) / Math.max(1, getFeatureLayer(domain, feature, 1).length - 1)))];
  const wheelActive = domain === "drive" && [0, 2, 3].includes(feature) && inputOn && energizedStep >= getFeatureLayer(domain, feature, 1).length - 1;
  return <group position={centre} rotation={[0, -.18, 0]}>
    {/* drei Html drops the first label after a canvas remount: a hidden one goes first */}
    <Html position={[0, -40, 0]}><span /></Html>
    <CarContext strong={shell} wheelActive={wheelActive} />
    {drivePower && <>
      <SupportPart node={drivePower.battery} active={inputOn} />
      <SupportPart node={drivePower.contactor} active={inputOn} />
      <FlowCable a={anchorWorld(drivePower.battery, "out", "dc_out")} b={anchorWorld(drivePower.contactor, "in", "hv_in")} flow="electrical_power" on={inputOn} />
      <FlowCable a={anchorWorld(drivePower.contactor, "out", "hv_out")} b={anchorWorld(drivePower.inverter, "in", "dc_in")} flow="electrical_power" on={inputOn} tag={inputOn ? "고전압 전력 · 구동 에너지" : undefined} />
    </>}
    {nodes.map(node => <PlacedPart key={`${node.id}-${node.copy}`} node={node} arrived={arrived(node.index)} isInput={node.index === 0} domain={domain} feature={feature} selected={selectedIndex === node.index} onSelect={onSelect} />)}
    {segments.map((seg, k) => {
      const on = inputOn && energizedStep > seg.from.index;
      const newest = on && energizedStep <= seg.to.index && energizedStep > seg.from.index;
      return <FlowCable key={k} a={anchorWorld(seg.from, "out", seg.fromPort)} b={anchorWorld(seg.to, "in", seg.toPort)} flow={seg.flow} on={on}
        tag={newest ? `${(FLOW_INFO[seg.flow] ?? FLOW_INFO.digital).label} · ${signalAt(seg.to.index)}` : undefined} />;
    })}
    {nodes.map(node => <Html key={`b-${node.id}-${node.copy}`} center position={[offsetOf(node)[0], offsetOf(node)[1] + .26, offsetOf(node)[2]]} distanceFactor={3.2} zIndexRange={[19, 0]}>
      <span className={`stepBadge ${arrived(node.index) ? "on" : ""}`}>{node.index + 1}</span>
    </Html>)}
  </group>;
}

/** Cable kinds used by a feature, for the on-screen legend. */
export function flowLegend(domain: DomainId, feature: number) {
  const flows = [...new Set([...layoutOf(domain, feature).segments.map(seg => seg.flow), ...(domain === "drive" && feature === 0 ? ["electrical_power"] : [])])];
  return flows.map(flow => ({ flow, ...(FLOW_INFO[flow] ?? FLOW_INFO.digital) }));
}
