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
import { heroToGarageLocal, rotationFromLocalX } from "./vehicleTransforms";

/** Scene units per metre: the garage car shell is 4.7 m ≈ 7.2 units long. */
export const U = 1.53;
type V3 = [number, number, number];
type Place = { p: V3; r?: V3; s?: number | V3; target?: number };
const H = Math.PI / 2;
const STEERING_COLUMN_AXIS: V3 = [0, -.42, -.91];
const STEERING_COLUMN_ROT = rotationFromLocalX(STEERING_COLUMN_AXIS);

// Vehicle platform frame in metres: front/rear = Z, left/right = X, y = height above ground.
// This is the same frame as HeroConvertible/carBody: front axle z=-1.18, rear axle z=1.16,
// wheel centres x=±.745, wheel radius=.34. Every feature uses these fixed coordinates.
const PLACE: Record<string, Place> = {
  // cabin · driver controls
  accel_pedal: { p: [.27, .28, -.98], r: [0, H, 0], target: .18 },
  brake_pedal: { p: [.43, .28, -.98], r: [0, H, 0], target: .2 },
  // The authored wheel's local X axis is the steering axis.  The steering
  // wheel must share the actual column axis; rolling it around world X leaves
  // the wheel visually detached from the column and makes the face look
  // sideways in the garage view.
  steering_wheel: { p: [-.31, .86, -.17], r: STEERING_COLUMN_ROT, target: .38 },
  steering_torque_sensor: { p: [-.31, .78, -.34], r: STEERING_COLUMN_ROT, target: .14 },
  steering_angle_sensor: { p: [-.31, .80, -.24], r: STEERING_COLUMN_ROT, target: .14 },
  steering_column: { p: [-.31, .72, -.52], r: STEERING_COLUMN_ROT, target: .32 },
  // The authored start-button face is local +Z.  The driver is on the -X
  // side but looks toward the dashboard from +Z, so the face stays unrotated;
  // the old Y=90° turn made the switch point into the passenger-side wall.
  start_button: { p: [-.06, .86, -.58], r: [0, 0, 0], target: .16 },
  gear_selector: { p: [0, .62, -.38], target: .3 },
  instrument_cluster: { p: [-.4, .82, -.3], r: [-.25, 0, 0], target: .5 },
  vcu: { p: [-.22, .78, -.72], target: .24 },
  imu_sensor: { p: [0, .3, -.05], target: .1 },
  // front motor room
  traction_motor: { p: [-.2, .42, -1.18], r: [0, 0, 0], target: .62 },
  reduction_gear: { p: [.18, .4, -1.18], r: [0, 0, 0], target: .38 },
  differential: { p: [0, .36, -1.18], r: [0, 0, 0], target: .3 },
  drive_shaft: { p: [.38, .34, -1.18], r: [0, 0, 0], target: .55 },
  steering_knuckle: { p: [.745, .34, -1.18], r: [0, -H, 0], target: .3 },
  wheel: { p: [.745, .34, -1.18], r: [0, 0, 0], target: .22 },
  inverter: { p: [-.58, .62, -.72], target: .42 },
  mcu: { p: [-.58, .78, -.62], target: .24 },
  rotor_position_sensor: { p: [-.2, .52, -.98], r: [0, H, 0], target: .1 },
  motor_temp_sensor: { p: [-.42, .58, -.98], target: .1 },
  coolant_temperature_sensor: { p: [-.28, .58, -.88], r: [0, H, 0], target: .14 },
  park_lock_actuator: { p: [.18, .42, -1.18], target: .18 },
  park_position_sensor: { p: [.18, .38, -1.18], target: .1 },
  park_pawl: { p: [0, .36, -1.18], target: .22 },
  park_ecu: { p: [-.32, .62, .72], target: .24 },
  // brakes
  brake_ecu: { p: [-.46, .82, -.58], r: [0, H, 0], target: .24 },
  hydraulic_modulator: { p: [-.3, .58, -.98], r: [0, H, 0], target: .26 },
  brake_line: { p: [-.3, .52, -1.05], r: [0, -.4, 0], target: .62 },
  brake_caliper: { p: [.745, .34, -1.18], r: [0, -H, 0], target: .34 },
  wheel_speed_sensor: { p: [.78, .43, -1.18], r: [0, 0, 0], target: .1 },
  // steering
  steering_rack: { p: [0, .38, -1.18], r: [0, 0, 0], target: .72 },
  eps_motor: { p: [-.31, .68, -.5], r: [0, 0, -.38], target: .3 },
  eps_power_pack: { p: [-.31, .58, -.64], r: STEERING_COLUMN_ROT, target: .3 },
  eps_ecu: { p: [.22, .66, -.62], target: .24 },
  // high voltage
  // A skateboard pack occupies most of the wheelbase under the seats, not a
  // small floating electronics box. Keep it low and nearly cabin-width.
  // The pack is long in vehicle Z and stays well inside the 1.8 m body width.
  hv_battery: { p: [0, .18, .05], s: [1.05, 1, 1.9] },
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
  // Existing code-built models must not fall through to layoutOf()'s
  // index-based fallback. These are educational packaging placeholders;
  // authored origins and engineering anchors still need browser QA.
  evcc: { p: [.62, .68, .68], target: .26 },
  charge_lock_actuator: { p: [.87, .76, .82], target: .14 },
  // thermal
  thermal_ecu: { p: [-.58, .82, -.45], r: [0, H, 0], target: .24 },
  cooling_pump: { p: [-.45, .5, -.9], target: .28 },
  coolant_valve: { p: [-.2, .58, -.9], r: [0, H, 0], target: .18 },
  cooling_fan: { p: [-.72, .5, -1.72], r: [0, H, 0], target: .58 },
  radiator: { p: [0, .5, -1.8], r: [0, H, 0], target: 1.45 },
  ac_compressor: { p: [.52, .35, .64], target: .48 },
  ptc_heater: { p: [.38, .58, .26], target: .32 },
  eev: { p: [.52, .55, .70], target: .2 },
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
  // Forward-facing sensors remain on the vehicle envelope; the ADAS ECU and
  // TCU are body-mounted placeholders pending authored-anchor QA.
  // Forward camera: behind the windscreen, centred high in the cabin.  The
  // authored lens points local +Z, therefore Y=PI turns it toward vehicle -Z.
  adas_camera: { p: [0, 1.08, -.72], r: [0, Math.PI, 0], target: .2 },
  // The radar sits at the front envelope and uses the same forward-facing
  // convention; keeping its face direction explicit prevents a rear-facing
  // sensor from looking plausible in a three-quarter view.
  adas_radar: { p: [0, .5, -1.93], r: [0, Math.PI, 0], target: .25 },
  adas_ecu: { p: [.32, .72, -.35], target: .28 },
  tcu: { p: [-.35, .68, .70], target: .22 },
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

type Node = { index: number; id: string; place: Place; copy: number; inspectDomain?: DomainId; inspectFeature?: number; label?: string };
export type Segment = { from: Node; to: Node; flow: string; fromPort?: string; toPort?: string };

/** The layout table stores one authored template for corner parts.  Rendering
 * expands that template only at the final scene boundary so the chain data
 * keeps its educational order while the vehicle shows all four installations. */
const CORNERS: readonly { id: "fl" | "fr" | "rl" | "rr"; x: number; z: number }[] = [
  { id: "fl", x: -.745, z: -1.18 }, { id: "fr", x: .745, z: -1.18 },
  { id: "rl", x: -.745, z: 1.16 }, { id: "rr", x: .745, z: 1.16 },
];
const FOUR_CORNER_MODELS = new Set(["brake_caliper", "wheel_speed_sensor", "coil_spring", "damper", "cdc_damper", "air_spring", "ride_height_sensor", "height_sensor", "position_sensor"]);

function cornerPlace(id: string, base: Place, corner: (typeof CORNERS)[number]): Place {
  const sensorOffset = id === "ride_height_sensor" || id === "height_sensor" || id === "position_sensor" ? (corner.x > 0 ? .055 : -.055) : 0;
  const x = id === "steering_knuckle"
    ? corner.x + (corner.x > 0 ? -.06 : .06)
    : id === "wheel_speed_sensor" ? corner.x + (corner.x > 0 ? .035 : -.035) : corner.x + sensorOffset;
  const r = id === "brake_caliper" || id === "steering_knuckle" ? [0, corner.x > 0 ? -H : H, 0] as V3 : base.r;
  return { ...base, p: [x, base.p[1], corner.z], r };
}

function expandCornerNodes(nodes: readonly Node[]): Node[] {
  return nodes.flatMap(node => {
    // Knuckles are front-corner components. Do not copy them to the rear axle.
    if (node.id === "steering_knuckle" && node.copy === 0) {
      return CORNERS.slice(0, 2).map((corner, index) => ({ ...node, copy: index, place: cornerPlace(node.id, node.place, corner) }));
    }
    if (!FOUR_CORNER_MODELS.has(node.id) || node.copy > 0) return [node];
    return CORNERS.map((corner, index) => ({ ...node, copy: index, place: cornerPlace(node.id, node.place, corner) }));
  });
}

/** Convert a model's authored metre geometry to the target physical envelope. */
function modelScale(node: Node) {
  if (node.place.s) return Array.isArray(node.place.s) ? node.place.s.map(value => U * value) as V3 : U * node.place.s;
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
    // An unresolved authored placement is not a valid physical position. Keep
    // it out of the rendered topology until the mount anchor is confirmed;
    // silently placing it by chain index makes a component look installed in
    // a technically arbitrary location.
    const place = PLACE[id];
    if (!place) return;
    nodes.push({ index, id, place, copy, inspectDomain: domain, inspectFeature: feature, label });
    if (nodes.length > 1) between.push(pending);
    pending = [];
  });
  const segments: Segment[] = nodes.slice(1).map((to, k) => {
    const from = nodes[k];
    const via = between[k] ?? [];
    const fromPort = portFor(from, "out");
    const toPort = portFor(to, "in");
    if (via.includes("can_harness")) return { from, to, flow: "can_message", fromPort, toPort };
    if (via.includes("hv_cable")) return { from, to, flow: "electrical_power", fromPort, toPort };
    const c = CONNECTIONS.find(item => item.from.split(".")[0] === from.id && item.to.split(".")[0] === to.id);
    if (c) return { from, to, flow: c.flow, fromPort: c.from.split(".")[1], toPort: c.to.split(".")[1] };
    return { from, to, flow: inferFlow(from.id, to.id), fromPort, toPort };
  });
  return { chain, nodes, segments };
}

const euler = new THREE.Euler();
/** Resolve the exact model anchor used by both segment metadata and geometry. */
function portFor(node: Node, side: "in" | "out", preferred?: string): string | undefined {
  const model = getPartModel(node.id);
  const names = Object.keys(model.anchors);
  const ports = getComponent(node.id)?.ports;
  return preferred && model.anchors[preferred]
    ? preferred
    : ports?.find(item => item.direction === side && names.includes(item.id))?.id
      ?? (model.anchors[side] ? side : names[side === "in" ? 0 : names.length - 1]);
}

/** World position (scene units) of one anchor of a placed part. */
function anchorWorld(node: Node, side: "in" | "out", port?: string): THREE.Vector3 {
  const model = getPartModel(node.id);
  const pick = portFor(node, side, port);
  if (!pick) return new THREE.Vector3(...offsetOf(node));
  const a = model.anchors[pick];
  const s = modelScale(node);
  euler.set(...(node.place.r ?? [0, 0, 0]));
  const sx = Array.isArray(s) ? s[0] : s, sy = Array.isArray(s) ? s[1] : s, sz = Array.isArray(s) ? s[2] : s;
  return new THREE.Vector3(a[0] * sx, a[1] * sy, a[2] * sz).applyEuler(euler).add(new THREE.Vector3(...offsetOf(node)));
}
const offsetOf = (node: Node): V3 => [node.place.p[0] * U, node.place.p[1] * U, node.place.p[2] * U];

function FlowCable({ a, b, flow, on, tag, staticColor = false }: { a: THREE.Vector3; b: THREE.Vector3; flow: string; on: boolean; tag?: string; staticColor?: boolean }) {
  const info = FLOW_INFO[flow] ?? FLOW_INFO.digital;
  const curve = useMemo(() => {
    const d = a.distanceTo(b);
    if (flow === "mechanical_torque" && d < .9) return new THREE.CatmullRomCurve3([a, b]);
    // Overview wiring is a physical harness, not a floating signal animation.
    // Route it below the mounted parts with explicit drops and longitudinal /
    // lateral runs so the cowl can close over it and the components remain
    // readable from the three-quarter camera.
    if (staticColor) {
      // Keep the harness above the floor plane and inside the sill corridor.
      // A former route used the wheel-side x coordinates as its trunk path;
      // in the overview that made the cable appear to run underneath the
      // tyres. The end segment still terminates at the authored port, while
      // the shared run stays between the wheels and below the mounted parts.
      const corridorX = (value: number) => THREE.MathUtils.clamp(value, -.52 * U, .52 * U);
      const routeY = Math.max(.27 * U, Math.min(a.y, b.y) - .12 * U);
      return new THREE.CatmullRomCurve3([
        a,
        new THREE.Vector3(corridorX(a.x), routeY, a.z),
        new THREE.Vector3(corridorX(a.x), routeY, b.z),
        new THREE.Vector3(corridorX(b.x), routeY, b.z),
        b,
      ], false, "centripetal", .18);
    }
    const lift = Math.min(.35, .06 + d * .06);
    const top = Math.max(a.y, b.y) + lift;
    return new THREE.CatmullRomCurve3([a, new THREE.Vector3(a.x, a.y + lift * .6, a.z), new THREE.Vector3((a.x + b.x) / 2, top, (a.z + b.z) / 2), new THREE.Vector3(b.x, b.y + lift * .6, b.z), b]);
  }, [a.x, a.y, a.z, b.x, b.y, b.z, flow, staticColor]);
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
    <mesh><tubeGeometry args={[curve, 48, radius, 8, false]} /><meshStandardMaterial color={on || staticColor ? info.color : "#7f8a86"} emissive={on ? info.color : "#000"} emissiveIntensity={on ? .45 : 0} transparent opacity={on || staticColor ? .78 : .55} /></mesh>
    {[0, 1, 2].map(k => <mesh key={k} visible={false} ref={el => { if (el) pulses.current[k] = el; }}><sphereGeometry args={[radius * 2.1, 12, 8]} /><meshStandardMaterial color="#fffbe0" emissive={info.color} emissiveIntensity={2.2} /></mesh>)}
    {tag && <Html center position={[mid.x, mid.y + .12, mid.z]} distanceFactor={3.6} zIndexRange={[20, 0]}><span className="cableTag" style={{ borderColor: info.color }}><i style={{ background: info.color }} />{tag}</span></Html>}
  </group>;
}

/** A continuous hood/cowl surface for the opened EV body.
 *
 * The body shell intentionally remains transparent so the player can inspect
 * the architecture. This surface supplies the missing upper cowl with a
 * tapered front, a shallow centre crown, and a higher windscreen edge. It is
 * a curved surface rather than stacked spheres or a rectangular proxy, so
 * the ADAS camera has a believable mounting envelope.
 */
let cowlGeometry: THREE.BufferGeometry | undefined;
function getCowlGeometry() {
  if (cowlGeometry) return cowlGeometry;
  const cols = 24, rows = 18;
  const positions: number[] = [], indices: number[] = [];
  for (let row = 0; row < rows; row++) {
    const t = row / (rows - 1);
    const z = -1.92 + t * 1.18;
    const half = .63 + .15 * t;
    const rise = .58 + .3 * Math.pow(t, .82);
    for (let col = 0; col < cols; col++) {
      const u = col / (cols - 1) * 2 - 1;
      const edge = 1 - .08 * Math.abs(u) ** 3;
      const x = u * half * edge;
      const shoulder = .045 * (1 - u * u);
      const y = rise + shoulder + .025 * Math.sin(Math.PI * t);
      positions.push(x, y, z);
    }
  }
  for (let row = 0; row < rows - 1; row++) for (let col = 0; col < cols - 1; col++) {
    const a = row * cols + col, b = a + 1, c = a + cols, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  cowlGeometry = geometry;
  return geometry;
}

function PlacedPart({ node, arrived, isInput, domain, feature, selected, onSelect, inspectId }: { node: Node; arrived: boolean; isInput: boolean; domain: DomainId; feature: number; selected: boolean; onSelect?: (index: number) => void; inspectId?: string }) {
  const model = useMemo(() => getPartModel(node.id), [node.id]);
  const mode = model.moving[0]?.mode;
  const input = arrived ? (mode === "spin" ? 9 : mode === "rotate" ? .45 : 1) : 0;
  const [hovered, setHovered] = useState(false);
  const label = node.label ?? getFeatureLayer(domain, feature, 1)[node.index] ?? node.id;
  const inspectDomain = node.inspectDomain ?? domain;
  const inspectFeature = node.inspectFeature ?? feature;
  const press = (action: "start" | "end") => dispatchEvent(new CustomEvent("tb-garage-input", { detail: { action, index: node.index } }));
  return <group position={offsetOf(node)} rotation={node.place.r ?? [0, 0, 0]}
    onPointerDown={isInput ? event => { event.stopPropagation(); press("start"); } : undefined}
    onPointerUp={isInput ? () => press("end") : undefined}
    onPointerOut={() => { setHovered(false); if (isInput) press("end"); document.body.style.cursor = ""; }}
    onPointerOver={event => { event.stopPropagation(); setHovered(true); document.body.style.cursor = isInput ? "pointer" : "help"; }}
    onClick={!isInput ? event => { if ((event as any).delta > 6) return; event.stopPropagation(); onSelect?.(node.index); dispatchEvent(new CustomEvent("tb-garage-step", { detail: { index: node.index } })); } : undefined}
    onDoubleClick={event => { event.stopPropagation(); dispatchEvent(new CustomEvent("tb-part-inspect", { detail: { domain: inspectDomain, feature: inspectFeature, index: node.index, partId: node.id, label } })); }}>
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
function ContextWheel({ position, active, front = false, steer = 0 }: { position: V3; active: boolean; front?: boolean; steer?: number }) {
  const wheel = useRef<THREE.Group>(null);
  // X is lateral, Y is up, Z is longitudinal. Wheel hubs rotate about X;
  // only the two front wheel groups receive the steering yaw about Y.
  useFrame((_, delta) => { if (wheel.current && active) wheel.current.rotation.x -= delta * 7; });
  return <group position={position} rotation={[0, front ? -steer : 0, 0]} ref={wheel}>
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh><torusGeometry args={[.27 * U, .07 * U, 12, 40]} /><meshStandardMaterial color="#2a302f" transparent opacity={.72} roughness={.8} /></mesh>
      {[0, 1, 2, 3].map(index => <mesh key={index} rotation={[0, 0, index * Math.PI / 2]}><boxGeometry args={[.035 * U, .34 * U, .025 * U]} /><meshStandardMaterial color="#aeb7b2" metalness={.55} roughness={.35} /></mesh>)}
    </group>
    <PartModel id="wheel" scale={U * 1.7} input={0} castShadow={false} />
  </group>;
}

function MechanicalLink({ from, to, active = false, color = "#7b8794", radius = .014 }: { from: THREE.Vector3; to: THREE.Vector3; active?: boolean; color?: string; radius?: number }) {
  const direction = useMemo(() => to.clone().sub(from), [from.x, from.y, from.z, to.x, to.y, to.z]);
  const length = direction.length();
  const midpoint = useMemo(() => from.clone().add(to).multiplyScalar(.5), [from.x, from.y, from.z, to.x, to.y, to.z]);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()), [direction.x, direction.y, direction.z]);
  return <mesh position={midpoint} quaternion={quaternion}>
    <cylinderGeometry args={[radius * U, radius * U, length, 10]} />
    <meshStandardMaterial color={active ? color : "#818b88"} emissive={active ? color : "#000"} emissiveIntensity={active ? .35 : 0} transparent opacity={active ? .95 : .56} />
  </mesh>;
}

function vehiclePoint(point: V3): THREE.Vector3 {
  return new THREE.Vector3(...heroToGarageLocal(point));
}

function SteeringTopology({ active }: { active: boolean }) {
  const wheel = vehiclePoint([-.31, .86, -.17]);
  const column = vehiclePoint([-.31, .72, -.52]);
  const eps = vehiclePoint([-.31, .68, -.5]);
  const pinion = vehiclePoint([0, .505, -1.18]);
  const rackLeft = vehiclePoint([-.46, .38, -1.18]);
  const rackRight = vehiclePoint([.46, .38, -1.18]);
  const frontLeftKnuckle = vehiclePoint([-.685, .34, -1.18]);
  const frontRightKnuckle = vehiclePoint([.685, .34, -1.18]);
  const frontLeftHub = vehiclePoint([-.745, .34, -1.18]);
  const frontRightHub = vehiclePoint([.745, .34, -1.18]);
  return <group>
    <MechanicalLink from={wheel} to={column} active={active} color="#8d75b6" radius={.018} />
    <MechanicalLink from={column} to={eps} active={active} color="#8d75b6" radius={.014} />
    <MechanicalLink from={eps} to={pinion} active={active} color="#8d75b6" radius={.014} />
    <MechanicalLink from={rackLeft} to={frontLeftKnuckle} active={active} color="#8d75b6" radius={.012} />
    <MechanicalLink from={rackRight} to={frontRightKnuckle} active={active} color="#8d75b6" radius={.012} />
    <MechanicalLink from={frontLeftKnuckle} to={frontLeftHub} active={active} color="#818b88" radius={.011} />
    <MechanicalLink from={frontRightKnuckle} to={frontRightHub} active={active} color="#818b88" radius={.011} />
  </group>;
}

function DrivelineTopology({ active }: { active: boolean }) {
  const motor = vehiclePoint([-.2, .42, -1.18]);
  const reducer = vehiclePoint([.18, .4, -1.18]);
  const differential = vehiclePoint([0, .36, -1.18]);
  const leftShaft: Node = { index: -11, id: "drive_shaft", place: { p: [-.38, .34, -1.18], r: [0, Math.PI, 0], target: .55 }, copy: 1 };
  const rightShaft: Node = { index: -12, id: "drive_shaft", place: { p: [.38, .34, -1.18], r: [0, 0, 0], target: .55 }, copy: 2 };
  const leftShaftCentre = vehiclePoint([-.38, .34, -1.18]);
  const rightShaftCentre = vehiclePoint([.38, .34, -1.18]);
  const leftHub = vehiclePoint([-.745, .34, -1.18]);
  const rightHub = vehiclePoint([.745, .34, -1.18]);
  return <group>
    <MechanicalLink from={motor} to={reducer} active={active} color="#7b8794" radius={.018} />
    <MechanicalLink from={reducer} to={differential} active={active} color="#7b8794" radius={.018} />
    <MechanicalLink from={differential} to={leftShaftCentre} active={active} color="#7b8794" radius={.016} />
    <MechanicalLink from={leftShaftCentre} to={leftHub} active={active} color="#7b8794" radius={.014} />
    <MechanicalLink from={differential} to={rightShaftCentre} active={active} color="#7b8794" radius={.016} />
    <MechanicalLink from={rightShaftCentre} to={rightHub} active={active} color="#7b8794" radius={.014} />
    <SupportPart node={leftShaft} active={active} />
    <SupportPart node={rightShaft} active={active} />
  </group>;
}

/** Faint car around the parts: body outline, floor and four tyres at the real wheel positions. */
function CarContext({ strong, wheelActive = false, wheelSteer = 0, showBody = true, showWheels = true }: { strong: boolean; wheelActive?: boolean; wheelSteer?: number; showBody?: boolean; showWheels?: boolean }) {
  const body = useMemo(() => getBodyGeometry().clone(), []);
  const cowl = useMemo(() => getCowlGeometry(), []);
  // The authored body mesh is an open-cockpit shell so the architecture stays
  // inspectable. Add the missing curved hood/cowl as a separate body panel;
  // it is deliberately a rounded surface, not the old rectangular placeholder.
  return <group>
    {showBody && <>
      <mesh geometry={body} scale={U}><meshStandardMaterial color="#d94e45" transparent opacity={strong ? .18 : .06} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      {/* Front hood/cowl: a low, continuous curved panel bridges the fenders
       * and gives the forward ADAS camera a real mounting surface.  It is a
       * rounded surface, never a floating rectangular proxy. */}
      <mesh geometry={cowl} scale={U}>
        <meshPhysicalMaterial color="#d94e45" transparent opacity={strong ? .32 : .1} roughness={.3} clearcoat={.55} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* A restrained glass strip marks the windscreen edge without making a
       * second floating red cap around the camera. */}
      <mesh position={[0, 1.01 * U, -.68 * U]} scale={[.65 * U, .035 * U, .08 * U]}>
        <meshStandardMaterial color="#4e646b" transparent opacity={strong ? .34 : .12} roughness={.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </>}
    <mesh position={[0, .05 * U, 0]}><boxGeometry args={[CAR_DIMENSIONS.width * U, .02 * U, CAR_DIMENSIONS.length * U]} /><meshStandardMaterial color="#8d9a95" transparent opacity={.25} depthWrite={false} /></mesh>
    {showWheels && [-1, 1].flatMap(side => [CAR_DIMENSIONS.frontAxleZ, CAR_DIMENSIONS.rearAxleZ].map(z => <ContextWheel key={`${side}${z}`} position={[side * CAR_DIMENSIONS.wheelX * U, CAR_DIMENSIONS.wheelRadius * U, z * U]} front={z === CAR_DIMENSIONS.frontAxleZ} steer={wheelSteer} active={wheelActive} />))}
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
  const hasBody = nodes.some(node => node.id === "body_shell");
  // The context vehicle owns the four wheel instances.  A drive-chain label
  // may still refer to a wheel/shaft, but rendering that single chain node
  // would reintroduce the old one-sided duplicate.
  const visibleNodes = domain === "drive" ? nodes.filter(node => node.id !== "wheel" && node.id !== "drive_shaft") : nodes;
  const steeringPreview = domain === "steer" && inputOn ? .16 : 0;
  return <group position={centre} rotation={[0, -.18, 0]}>
    {/* drei Html drops the first label after a canvas remount: a hidden one goes first */}
    <Html position={[0, -40, 0]}><span /></Html>
    {context && <CarContext strong={shell} wheelActive={wheelActive} wheelSteer={steeringPreview} showBody={!hasBody} showWheels />}
    {domain === "steer" && <SteeringTopology active={inputOn} />}
    {domain === "drive" && <DrivelineTopology active={inputOn} />}
    {domain === "gear" && feature === 2 && <SupportPart node={{ index: -20, id: "park_pawl", place: PLACE.park_pawl, copy: 0 }} active={inputOn} />}
    {drivePower && <>
      <SupportPart node={drivePower.battery} active={inputOn} />
      <SupportPart node={drivePower.contactor} active={inputOn} />
      {showCables && <><FlowCable a={anchorWorld(drivePower.battery, "out", "dc_out")} b={anchorWorld(drivePower.contactor, "in", "hv_in")} flow="electrical_power" on={inputOn} staticColor />
        <FlowCable a={anchorWorld(drivePower.contactor, "out", "hv_out")} b={anchorWorld(drivePower.inverter, "in", "dc_in")} flow="electrical_power" on={inputOn} staticColor tag={inputOn ? "고전압 전력 · 구동 에너지" : undefined} /></>}
    </>}
    {expandCornerNodes(visibleNodes).map(node => <PlacedPart key={`${node.id}-${node.copy}`} node={node} arrived={arrived(node.index)} isInput={node.index === 0} domain={domain} feature={feature} selected={selectedIndex === node.index} onSelect={onSelect} />)}
    {showCables && segments.map((seg, k) => {
      const on = inputOn && energizedStep > seg.from.index;
      const newest = on && energizedStep <= seg.to.index && energizedStep > seg.from.index;
      return <FlowCable key={k} a={anchorWorld(seg.from, "out", seg.fromPort)} b={anchorWorld(seg.to, "in", seg.toPort)} flow={seg.flow} on={on} staticColor
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
export function VehiclePlatformOverview({ showWiring = false, showBody = true }: { showWiring?: boolean; showBody?: boolean }) {
  const domainOrder: DomainId[] = ["drive", "power", "charge", "thermal", "brake", "steer", "suspension", "gear", "vcu", "comm", "adas"];
  const nodes = useMemo(() => {
    const unique = new Map<string, Node>();
    let index = 0;
    for (const domain of domainOrder) {
      const chain = layoutOf(domain, 0).nodes;
      for (const node of chain) {
        // Body and tyres are supplied by the shared vehicle context in overview mode.
        if (node.id === "body_shell" || node.id === "wheel" || node.id === "drive_shaft") continue;
        const key = `${node.id}:${node.place.p.map(value => value.toFixed(3)).join(",")}`;
        if (!unique.has(key)) unique.set(key, { ...node, index: index++, copy: 0 });
      }
    }
    // The overview is a vehicle architecture view, so retain the physical
    // parts that can disappear when a domain's first feature is signal-only.
    for (const id of [
      "hv_battery", "bms", "inverter", "traction_motor", "steering_rack", "coil_spring", "damper", "charging_port", "obc", "dcdc_converter",
      "steering_angle_sensor", "coolant_temperature_sensor", "park_lock_actuator", "park_position_sensor", "park_pawl", "steering_knuckle", "wheel_speed_sensor", "brake_caliper",
    ]) {
      const place = PLACE[id];
      if (!place) continue;
      const key = `${id}:${place.p.map(value => value.toFixed(3)).join(",")}`;
      if (!unique.has(key)) unique.set(key, { index: index++, id, place, copy: 0 });
    }
    return [...unique.values()];
  }, []);
  // Reuse the authored domain layouts and their model anchors.  The overview
  // wiring is therefore a real port-to-port representation, not a decorative
  // line drawn from screen coordinates.
  const wiringSegments = useMemo(() => {
    const unique = new Map<string, Segment>();
    for (const domain of domainOrder) {
      for (const segment of layoutOf(domain, 0).segments) {
        const key = [segment.from.id, segment.to.id, segment.flow,
          segment.from.place.p.map(value => value.toFixed(2)).join(","),
          segment.to.place.p.map(value => value.toFixed(2)).join(",")].join("|");
        if (!unique.has(key)) unique.set(key, segment);
      }
    }
    return [...unique.values()];
  }, []);
  return <group rotation={[0, -.18, 0]}>
    <CarContext strong showBody={showBody} showWheels />
    <SteeringTopology active={false} />
    <DrivelineTopology active={false} />
    {expandCornerNodes(nodes).map(node => <PlacedPart key={`${node.id}-${node.index}-${node.copy}`} node={node} arrived={false} isInput={false} domain="drive" feature={0} selected={false} inspectId={node.id} />)}
    {showWiring && wiringSegments.map((segment, index) => <FlowCable key={`overview-wire-${index}`} a={anchorWorld(segment.from, "out", segment.fromPort)} b={anchorWorld(segment.to, "in", segment.toPort)} flow={segment.flow} on={false} staticColor />)}
  </group>;
}

/** Cable kinds used by a feature, for the on-screen legend. */
export function flowLegend(domain: DomainId, feature: number) {
  const flows = [...new Set([...layoutOf(domain, feature).segments.map(seg => seg.flow), ...(domain === "drive" && feature === 0 ? ["electrical_power"] : [])])];
  return flows.map(flow => ({ flow, ...(FLOW_INFO[flow] ?? FLOW_INFO.digital) }));
}
