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
import { CAR_DIMENSIONS, getBodyGeometry } from "../vehicle/carBody";

/** Scene units per metre: the garage car shell is 4.7 m ≈ 7.2 units long. */
export const U = 1.53;
type V3 = [number, number, number];
type Place = { p: V3; r?: V3; s?: number; target?: number };
const H = Math.PI / 2;

// Vehicle platform frame in metres: front/rear = Z, left/right = X, y = height above ground.
// This is the same frame as HeroConvertible/carBody: front axle z=-1.18, rear axle z=1.16,
// wheel centres x=±.745, wheel radius=.34. Every feature uses these fixed coordinates.
const PLACE: Record<string, Place> = {
  // cabin · driver controls
  accel_pedal: { p: [.27, .28, -.98], r: [0, H, 0], target: .18 },
  brake_pedal: { p: [.43, .28, -.98], r: [0, H, 0], target: .2 },
  steering_wheel: { p: [.37, .98, -.42], r: [0, 0, -.38], target: .38 },
  steering_torque_sensor: { p: [.37, .86, -.62], r: [0, 0, -.38], target: .14 },
  steering_column: { p: [.37, .78, -.78], r: [0, 0, -.38], target: .32 },
  start_button: { p: [.08, .88, -.72], r: [0, H, 0], target: .16 },
  gear_selector: { p: [0, .62, -.38], target: .3 },
  instrument_cluster: { p: [.37, 1.02, -.78], r: [0, H, 0], target: .5 },
  vcu: { p: [-.22, .78, -.72], target: .24 },
  imu_sensor: { p: [0, .3, -.05], target: .1 },
  // front motor room
  traction_motor: { p: [-.2, .42, -.98], r: [0, H, 0], target: .62 },
  reduction_gear: { p: [.18, .4, -.98], r: [0, H, 0], target: .38 },
  differential: { p: [.42, .36, -.98], r: [0, H, 0], target: .3 },
  drive_shaft: { p: [.62, .34, -1.18], r: [0, H, 0], target: .55 },
  wheel: { p: [.745, .34, -1.18], r: [0, -H, 0], target: .22 },
  inverter: { p: [-.58, .62, -.72], target: .42 },
  mcu: { p: [-.58, .78, -.62], target: .24 },
  rotor_position_sensor: { p: [-.2, .52, -.98], r: [0, H, 0], target: .1 },
  motor_temp_sensor: { p: [-.42, .58, -.98], target: .1 },
  park_lock_actuator: { p: [.15, .42, .82], target: .18 },
  park_position_sensor: { p: [.15, .38, .9], target: .1 },
  park_ecu: { p: [-.32, .62, .72], target: .24 },
  // brakes
  brake_ecu: { p: [-.46, .82, -.58], r: [0, H, 0], target: .24 },
  hydraulic_modulator: { p: [-.3, .58, -.98], r: [0, H, 0], target: .26 },
  brake_line: { p: [-.3, .52, -1.05], r: [0, -.4, 0], target: .62 },
  brake_caliper: { p: [.745, .34, -1.18], r: [0, -H, 0], target: .34 },
  wheel_speed_sensor: { p: [.78, .43, -1.18], r: [0, -H, 0], target: .1 },
  // steering
  steering_rack: { p: [0, .38, -1.18], r: [0, H, 0], target: .72 },
  eps_motor: { p: [.24, .72, -.68], r: [0, 0, -.38], target: .3 },
  eps_power_pack: { p: [-.22, .42, -.72], r: [0, H, 0], target: .3 },
  eps_ecu: { p: [.22, .66, -.62], target: .24 },
  // high voltage
  // A skateboard pack occupies most of the wheelbase under the seats, not a
  // small floating electronics box. Keep it low and nearly cabin-width.
  hv_battery: { p: [0, .18, .05], target: 3.15 },
  bms: { p: [0, .4, .35], target: .24 },
  main_contactor: { p: [-.48, .62, -.82], target: .28 },
  isolation_monitor: { p: [-.48, .62, -.62], target: .12 },
  cell_monitor_board: { p: [0, .35, .2], target: .18 },
  hv_junction_box: { p: [-.42, .72, -.72], target: .28 },
  // The inlet is on the rear-side quarter panel; its face is rotated across
  // the vehicle body (90° from the longitudinal component orientation).
  charging_port: { p: [.87, .78, .86], r: [0, H, 0], target: .24 },
  obc: { p: [.42, .72, -.65], target: .48 },
  dcdc_converter: { p: [-.46, .74, -.5], target: .3 },
  lv_battery: { p: [-.55, .48, -.3], target: .32 },
  // thermal
  thermal_ecu: { p: [-.58, .82, -.45], r: [0, H, 0], target: .24 },
  cooling_pump: { p: [-.45, .5, -.9], target: .28 },
  coolant_valve: { p: [-.2, .58, -.9], r: [0, H, 0], target: .18 },
  cooling_fan: { p: [-.72, .5, -1.72], r: [0, H, 0], target: .58 },
  radiator: { p: [0, .5, -1.8], r: [0, H, 0], target: 1.45 },
  // suspension (front-left corner unless noted)
  coil_spring: { p: [.745, .52, -1.18], target: .42 },
  damper: { p: [.745, .46, -1.18], target: .5 },
  cdc_damper: { p: [.745, .46, -1.18], target: .28 },
  body_shell: { p: [.745, .86, -1.18], target: .5 },
  chassis_ecu: { p: [-.42, .3, .58], target: .24 },
  ride_height_sensor: { p: [.8, .3, 1.16], r: [0, -H, 0], target: .1 },
  air_spring: { p: [.745, .42, 1.16], target: .42 },
  air_compressor: { p: [-.58, .26, .66], target: .4 },
  generic_ecu: { p: [-.42, .7, .52], target: .24 },
  position_sensor: { p: [.8, .44, -1.0], target: .1 },
  height_sensor: { p: [.8, .3, 1.16], target: .1 },
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

/** Convert a model's authored metre geometry to the target physical envelope. */
function modelScale(node: Node) {
  if (node.place.s) return U * node.place.s;
  const target = node.place.target;
  return U * (target ? target / Math.max(...getPartModel(node.id).size) : 1);
}

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
  const s = modelScale(node);
  euler.set(...(node.place.r ?? [0, 0, 0]));
  return new THREE.Vector3(a[0] * s, a[1] * s, a[2] * s).applyEuler(euler).add(new THREE.Vector3(...offsetOf(node)));
}
const offsetOf = (node: Node): V3 => [node.place.p[0] * U, node.place.p[1] * U, node.place.p[2] * U];

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
  const press = (action: "start" | "end") => dispatchEvent(new CustomEvent("tb-garage-input", { detail: { action, index: node.index } }));
  return <group position={offsetOf(node)} rotation={node.place.r ?? [0, 0, 0]}
    onPointerDown={isInput ? event => { event.stopPropagation(); press("start"); } : undefined}
    onPointerUp={isInput ? () => press("end") : undefined}
    onPointerOut={() => { setHovered(false); if (isInput) press("end"); document.body.style.cursor = ""; }}
    onPointerOver={event => { event.stopPropagation(); setHovered(true); document.body.style.cursor = isInput ? "pointer" : "help"; }}
    onClick={!isInput ? event => { if ((event as any).delta > 6) return; event.stopPropagation(); onSelect?.(node.index); dispatchEvent(new CustomEvent("tb-garage-step", { detail: { index: node.index } })); } : undefined}
    onDoubleClick={event => { event.stopPropagation(); dispatchEvent(new CustomEvent("tb-part-inspect", { detail: { domain, feature, index: node.index } })); }}>
    <PartModel id={node.id} scale={modelScale(node)} input={input} castShadow={false} />
    {selected && <mesh scale={.34 * U}><sphereGeometry args={[1, 18, 14]} /><meshBasicMaterial color="#e09b35" transparent opacity={.18} depthWrite={false} /></mesh>}
    {(hovered || selected) && <Html center position={[0, .32 * U, 0]} distanceFactor={3.35} zIndexRange={[21, 0]}><span className={`garageVehiclePartLabel ${selected ? "selected" : ""}`}>{label}</span></Html>}
  </group>;
}

function SupportPart({ node, active }: { node: Node; active: boolean }) {
  const model = useMemo(() => getPartModel(node.id), [node.id]);
  const mode = model.moving[0]?.mode;
  const input = active ? (mode === "spin" ? 9 : mode === "rotate" ? .45 : 1) : 0;
  return <group position={offsetOf(node)} rotation={node.place.r ?? [0, 0, 0]}>
    <PartModel id={node.id} scale={modelScale(node)} input={input} castShadow={false} />
  </group>;
}

/** The final drive response: hub, tyre and spokes rotate together only after
 * the shared signal has reached the vehicle-output stage. */
function ContextWheel({ position, active }: { position: V3; active: boolean }) {
  const wheel = useRef<THREE.Group>(null);
  // The garage vehicle uses -X as its front, so the left/right axle is Z.
  // Keep the tyre face in the X/Y plane and rotate every moving wheel part
  // around Z; rotating around X makes the rim face the vehicle's front.
  useFrame((_, delta) => { if (wheel.current && active) wheel.current.rotation.x -= delta * 7; });
  return <group position={position} ref={wheel}>
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh><torusGeometry args={[.27 * U, .07 * U, 12, 40]} /><meshStandardMaterial color="#2a302f" transparent opacity={.72} roughness={.8} /></mesh>
      {[0, 1, 2, 3].map(index => <mesh key={index} rotation={[0, 0, index * Math.PI / 2]}><boxGeometry args={[.035 * U, .34 * U, .025 * U]} /><meshStandardMaterial color="#aeb7b2" metalness={.55} roughness={.35} /></mesh>)}
    </group>
    <PartModel id="wheel" scale={U * 1.7} input={0} castShadow={false} />
  </group>;
}

/** Faint car around the parts: body outline, floor and four tyres at the real wheel positions. */
function CarContext({ strong, wheelActive = false, showBody = true, showWheels = true }: { strong: boolean; wheelActive?: boolean; showBody?: boolean; showWheels?: boolean }) {
  const body = useMemo(() => getBodyGeometry().clone(), []);
  return <group>
    {showBody && <mesh geometry={body} scale={U}><meshStandardMaterial color="#d94e45" transparent opacity={strong ? .16 : .05} depthWrite={false} side={THREE.DoubleSide} /></mesh>}
    <mesh position={[0, .05 * U, 0]}><boxGeometry args={[CAR_DIMENSIONS.width * U, .02 * U, CAR_DIMENSIONS.length * U]} /><meshStandardMaterial color="#8d9a95" transparent opacity={.25} depthWrite={false} /></mesh>
    {showWheels && [-1, 1].flatMap(side => [CAR_DIMENSIONS.frontAxleZ, CAR_DIMENSIONS.rearAxleZ].map(z => <ContextWheel key={`${side}${z}`} position={[side * CAR_DIMENSIONS.wheelX * U, CAR_DIMENSIONS.wheelRadius * U, z * U]} active={wheelActive} />))}
  </group>;
}

export function VehicleLayoutRig({ domain, feature, activeStep, inputOn, shell, selectedIndex = null, onSelect, context = true, showCables = true, showBadges = true }: { domain: DomainId; feature: number; activeStep: number; inputOn: boolean; shell: boolean; selectedIndex?: number | null; onSelect?: (index: number) => void; context?: boolean; showCables?: boolean; showBadges?: boolean }) {
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
  // Keep the model on the shared vehicle platform. Feature changes must not move the car.
  const centre: V3 = [0, -.25, 0];
  const energizedStep = inputOn ? activeStep : -1;
  const arrived = (index: number) => inputOn && energizedStep >= index;
  const signalAt = (index: number) => signals[Math.min(signals.length - 1, Math.round(index * (signals.length - 1) / Math.max(1, getFeatureLayer(domain, feature, 1).length - 1)))];
  const wheelActive = domain === "drive" && [0, 2, 3].includes(feature) && inputOn && energizedStep >= getFeatureLayer(domain, feature, 1).length - 1;
  const hasWheel = nodes.some(node => node.id === "wheel");
  const hasBody = nodes.some(node => node.id === "body_shell");
  return <group position={centre} rotation={[0, -.18, 0]}>
    {/* drei Html drops the first label after a canvas remount: a hidden one goes first */}
    <Html position={[0, -40, 0]}><span /></Html>
    {context && <CarContext strong={shell} wheelActive={wheelActive} showBody={!hasBody} showWheels={!hasWheel} />}
    {drivePower && <>
      <SupportPart node={drivePower.battery} active={inputOn} />
      <SupportPart node={drivePower.contactor} active={inputOn} />
      {showCables && <><FlowCable a={anchorWorld(drivePower.battery, "out", "dc_out")} b={anchorWorld(drivePower.contactor, "in", "hv_in")} flow="electrical_power" on={inputOn} />
        <FlowCable a={anchorWorld(drivePower.contactor, "out", "hv_out")} b={anchorWorld(drivePower.inverter, "in", "dc_in")} flow="electrical_power" on={inputOn} tag={inputOn ? "고전압 전력 · 구동 에너지" : undefined} /></>}
    </>}
    {nodes.map(node => <PlacedPart key={`${node.id}-${node.copy}`} node={node} arrived={arrived(node.index)} isInput={node.index === 0} domain={domain} feature={feature} selected={selectedIndex === node.index} onSelect={onSelect} />)}
    {showCables && segments.map((seg, k) => {
      const on = inputOn && energizedStep > seg.from.index;
      const newest = on && energizedStep <= seg.to.index && energizedStep > seg.from.index;
      return <FlowCable key={k} a={anchorWorld(seg.from, "out", seg.fromPort)} b={anchorWorld(seg.to, "in", seg.toPort)} flow={seg.flow} on={on}
        tag={newest ? `${(FLOW_INFO[seg.flow] ?? FLOW_INFO.digital).label} · ${signalAt(seg.to.index)}` : undefined} />;
    })}
    {showBadges && nodes.map(node => <Html key={`b-${node.id}-${node.copy}`} center position={[offsetOf(node)[0], offsetOf(node)[1] + .26, offsetOf(node)[2]]} distanceFactor={3.2} zIndexRange={[19, 0]}>
      <span className={`stepBadge ${arrived(node.index) ? "on" : ""}`}>{node.index + 1}</span>
    </Html>)}
  </group>;
}

/**
 * Whole-vehicle overview: merge every domain's physical chain into one platform.
 * The same ECU, wheel hub, or battery must be rendered once even if several
 * domain chains refer to it; overlaying eleven complete chains made the old
 * overview look like a pile of duplicate parts.
 */
export function VehiclePlatformOverview() {
  const domainOrder: DomainId[] = ["drive", "power", "charge", "thermal", "brake", "steer", "suspension", "gear", "vcu", "comm", "adas"];
  const nodes = useMemo(() => {
    const unique = new Map<string, Node>();
    let index = 0;
    for (const domain of domainOrder) {
      const chain = layoutOf(domain, 0).nodes;
      for (const node of chain) {
        // Body and tyres are supplied by the shared vehicle context in overview mode.
        if (node.id === "body_shell" || node.id === "wheel") continue;
        const key = `${node.id}:${node.place.p.map(value => value.toFixed(3)).join(",")}`;
        if (!unique.has(key)) unique.set(key, { ...node, index: index++, copy: 0 });
      }
    }
    // The overview is a vehicle architecture view, so retain the physical
    // parts that can disappear when a domain's first feature is signal-only.
    for (const id of ["hv_battery", "bms", "inverter", "traction_motor", "steering_rack", "coil_spring", "damper", "charging_port", "obc", "dcdc_converter"]) {
      const place = PLACE[id];
      if (!place) continue;
      const key = `${id}:${place.p.map(value => value.toFixed(3)).join(",")}`;
      if (!unique.has(key)) unique.set(key, { index: index++, id, place, copy: 0 });
    }
    return [...unique.values()];
  }, []);
  return <group rotation={[0, -.18, 0]}>
    <CarContext strong={false} showBody showWheels />
    {nodes.map(node => <PlacedPart key={`${node.id}-${node.index}`} node={node} arrived={false} isInput={false} domain="drive" feature={0} selected={false} />)}
  </group>;
}

/** Cable kinds used by a feature, for the on-screen legend. */
export function flowLegend(domain: DomainId, feature: number) {
  const flows = [...new Set([...layoutOf(domain, feature).segments.map(seg => seg.flow), ...(domain === "drive" && feature === 0 ? ["electrical_power"] : [])])];
  return flows.map(flow => ({ flow, ...(FLOW_INFO[flow] ?? FLOW_INFO.digital) }));
}
