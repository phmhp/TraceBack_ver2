// Code-built 3D models for EV parts, shared by the garage and the bench.
// Pure geometry (no React) so it can be unit-tested without a renderer.
//
// Rules (docs/TIER_C_ASSET_PLAN.md §4):
// - Units are metres. Origin = mounting point. +Y is up, +Z faces the viewer/driver.
// - Colours come only from PART_PALETTE. Static pieces are baked per material.
// - A part may have moving groups (pedal arm, dial, tone ring, lid). Each declares
//   its pivot, axis and how it moves; everything else is static.
// - Anchors use the same names as the port IDs in src/sim/components.ts.
// - Reference images: public/assets/intake/images/<group>/<id>__REF|TURN|CUT.png
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { bakeByKey, within, type PartSpec, type V3 } from "../vehicle/bake.ts";

export const PART_PALETTE = {
  castAl: { color: "#a9adb0", metalness: .75, roughness: .38 },
  gunmetal: { color: "#4a4f55", metalness: .7, roughness: .35 },
  steel: { color: "#8e9396", metalness: .9, roughness: .22 },
  rubber: { color: "#1c1e20", metalness: 0, roughness: .9 },
  plastic: { color: "#2a2d31", metalness: .1, roughness: .55 },
  hvOrange: { color: "#e8742a", metalness: .1, roughness: .5 },
  copper: { color: "#b8733d", metalness: .85, roughness: .3 },
  coolant: { color: "#3f8fb0", metalness: .2, roughness: .4 },
  // Small accents seen in the reference images (wire colours, PCB, nylon plugs, LEDs).
  nylon: { color: "#e9e4d6", metalness: 0, roughness: .6 },
  greyPlastic: { color: "#8a8f94", metalness: .05, roughness: .55 },
  wireRed: { color: "#c8312b", metalness: 0, roughness: .5 },
  pcb: { color: "#1f6b3a", metalness: .1, roughness: .5 },
  led: { color: "#9fe8ff", metalness: 0, roughness: .3, emissive: "#5fd4ff" },
} as const;
export type MatKey = keyof typeof PART_PALETTE;

export type MoveMode =
  | "press"   // rotate about axis by input × range (pedals)
  | "push"    // translate along axis by input × range (buttons)
  | "rotate"  // rotate about axis by input radians (steering, dial)
  | "spin"    // continuous rotation, input = rad/s (tone ring, resolver rotor)
  | "explode"; // translate along axis by input × range (input 0..1, lids)

export type MovingGroup = {
  name: string;
  pivot: V3;
  axis: "x" | "y" | "z";
  mode: MoveMode;
  range: number;
  geometries: Partial<Record<MatKey, THREE.BufferGeometry>>;
};

export type PartModel = {
  id: string;
  ref: string; // reference image the model follows
  size: V3; // approximate bounding size in metres
  center: V3; // bounding-box centre (origin is the mounting point, not the centre)
  geometries: Partial<Record<MatKey, THREE.BufferGeometry>>;
  moving: MovingGroup[];
  anchors: Record<string, V3>;
};

type Spec = PartSpec<MatKey>;
type Def = {
  ref: string;
  build: () => { statics: Spec[]; moving?: (Omit<MovingGroup, "geometries"> & { specs: Spec[] })[]; anchors: Record<string, V3> };
};

// ───────────────────────── geometry helpers ─────────────────────────
const S = (key: MatKey, geometry: THREE.BufferGeometry, position?: V3, rotation?: V3, scale?: number | V3): Spec => ({ key, geometry, position, rotation, scale });
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const rbox = (w: number, h: number, d: number, r = Math.min(w, h, d) * .2) => new RoundedBoxGeometry(w, h, d, 2, r);
/** Cylinder along Y. */
const cyl = (r: number, h: number, seg = 24, r2 = r) => new THREE.CylinderGeometry(r, r2, h, seg);
/** Cylinder along X. */
const cylX = (r: number, h: number, seg = 24, r2 = r) => cyl(r, h, seg, r2).rotateZ(Math.PI / 2);
/** Cylinder along Z. */
const cylZ = (r: number, h: number, seg = 24, r2 = r) => cyl(r, h, seg, r2).rotateX(Math.PI / 2);
const torusZ = (R: number, r: number, seg = 40, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, 10, seg, arc);
const torusX = (R: number, r: number, seg = 40) => torusZ(R, r, seg).rotateY(Math.PI / 2);
const tube = (points: V3[], r: number, seg = 32, radial = 8) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), seg, r, radial, false);
const sphere = (r: number, seg = 16) => new THREE.SphereGeometry(r, seg, Math.max(6, seg / 2));

/** Rounded rectangle path centred on 0. */
function roundRect(shape: THREE.Shape | THREE.Path, w: number, h: number, r: number) {
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}
const circlePath = (r: number, cx = 0, cy = 0) => new THREE.Path().absarc(cx, cy, r, 0, Math.PI * 2, true);
/** Extrudes a shape along +Z, centred on z = 0. */
function extrude(shape: THREE.Shape, depth: number, bevel = 0) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 16 });
  g.translate(0, 0, -depth / 2);
  return g;
}
/** Flat mounting ear: rounded tab with a bolt hole, lying in the XZ plane (thickness along Y). */
function ear(len: number, width: number, thick: number, hole: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(-width / 2, len - width / 2);
  shape.absarc(0, len - width / 2, width / 2, Math.PI, 0, true);
  shape.lineTo(width / 2, 0);
  shape.lineTo(-width / 2, 0);
  shape.holes.push(circlePath(hole, 0, len - width / 2));
  return extrude(shape, thick).rotateX(-Math.PI / 2); // tab points toward -Z
}

/** Sealed multi-pin automotive connector facing +Z, origin at its back face. */
function connector(w: number, h: number, d: number, pinsX: number, pinsY: number, color: MatKey = "plastic"): Spec[] {
  const specs: Spec[] = [
    S(color, rbox(w, h, d, Math.min(w, h) * .12), [0, 0, d / 2]),
    S("rubber", box(w * .82, h * .66, .002), [0, 0, d + .0005]), // dark socket face
    S(color, rbox(w * .34, h * .22, d * .7, .002), [0, h * .58, d * .45]), // latch
  ];
  for (let ix = 0; ix < pinsX; ix++) for (let iy = 0; iy < pinsY; iy++) {
    const x = (ix - (pinsX - 1) / 2) * (w * .7 / Math.max(1, pinsX));
    const y = (iy - (pinsY - 1) / 2) * (h * .45 / Math.max(1, pinsY));
    specs.push(S("copper", cylZ(.0007, .004, 6), [x, y, d + .002]));
  }
  return specs;
}

/** Revolved profile on X: points are [radius, x]. */
const latheX = (pts: [number, number][], segments = 32) =>
  new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments).rotateZ(-Math.PI / 2);
/** Folded rubber boot on X, tapering from rStart to rEnd, centred on 0. */
function bellowsX(len: number, rStart: number, rEnd: number, folds: number) {
  const pts: [number, number][] = [[0, -len / 2]];
  const n = folds * 2;
  for (let i = 0; i <= n; i++) {
    const t = i / n, r = rStart + (rEnd - rStart) * t;
    pts.push([i % 2 ? r : r * .82, -len / 2 + len * t]);
  }
  pts.push([0, len / 2]);
  return latheX(pts, 28);
}
/** Spur gear outline in the XY plane with a centre hole. */
function gearShape(rTip: number, rRoot: number, teeth: number, hole: number) {
  const shape = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a = i / teeth * Math.PI * 2, step = Math.PI * 2 / teeth;
    const pts: [number, number][] = [[rRoot, a], [rTip, a + step * .2], [rTip, a + step * .45], [rRoot, a + step * .65]];
    pts.forEach(([r, t], k) => (i === 0 && k === 0 ? shape.moveTo(Math.cos(t) * r, Math.sin(t) * r) : shape.lineTo(Math.cos(t) * r, Math.sin(t) * r)));
  }
  shape.closePath();
  shape.holes.push(circlePath(hole));
  return shape;
}

const screwHead = (r = .0035): THREE.BufferGeometry => cyl(r, r * .7, 12);

/** Cast ECU housing used by VCU/MCU/EPS: finned lid, base, four ears, front connectors. */
function finnedHousing(w: number, h: number, d: number, fins: number): Spec[] {
  const specs: Spec[] = [
    S("castAl", rbox(w, h * .55, d, .004), [0, h * .275, 0]), // base
    S("castAl", rbox(w * .97, h * .3, d * .97, .004), [0, h * .65, 0]), // lid
  ];
  for (let i = 0; i < fins; i++) {
    const x = (i - (fins - 1) / 2) * (w * .82 / fins);
    specs.push(S("castAl", box(w * .028, h * .25, d * .72), [x, h * .9, -d * .05]));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    specs.push(S("steel", screwHead(), [sx * w * .45, h * .81, sz * d * .44]));
  }
  // Ears on the left and right sides, at base level.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    specs.push(S("castAl", ear(.022, .018, .005, .0045), [sx * (w / 2 + .002), .0025, sz * d * .36], [0, sx * Math.PI / 2, 0]));
  }
  return specs;
}

// ───────────────────────── HMI ─────────────────────────
function pedalArm(points: V3[], r: number, widthScale: number): THREE.BufferGeometry {
  const g = tube(points, r, 40, 8);
  g.scale(widthScale, 1, 1); // flatten into a blade
  return g;
}

const DEFS: Record<string, Def> = {
  // Hanging organ-style accelerator: black plastic module at the pivot, blade arm, ribbed pad.
  accel_pedal: {
    ref: "HMI/accel_pedal__TURN.png",
    build: () => {
      const pivot: V3 = [0, -.012, .03];
      const statics: Spec[] = [
        S("plastic", rbox(.07, .09, .012, .004), [0, 0, .006]), // mounting plate (firewall at z = 0)
        S("plastic", cylX(.03, .034, 28), pivot), // sensor housing
        S("plastic", cylX(.024, .004, 28), [-.019, pivot[1], pivot[2]]), // sensor cover
        ...[0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3 + .4; return S("steel", screwHead(.0025).rotateZ(Math.PI / 2), [-.021, pivot[1] + Math.sin(a) * .017, pivot[2] + Math.cos(a) * .017]); }),
        ...[[-.024, .034], [.024, -.034]].map(([x, y]) => S("steel", cylZ(.006, .004, 16), [x, y, .013])), // bolt bushings
        S("rubber", tube([[.012, .018, .04], [.016, .045, .045], [.012, .07, .035], [.006, .085, .03]], .0028, 24), ),
        ...within(connector(.018, .014, .018, 3, 1), [.006, .088, .03], [-Math.PI / 2, 0, 0]),
      ];
      const pad = [
        S("rubber", rbox(.078, .15, .012, .005)),
        ...Array.from({ length: 11 }, (_, i) => S("rubber", box(.068, .004, .004), [0, .06 - i * .012, .007])),
      ];
      const arm: Spec[] = [
        S("plastic", pedalArm([[0, 0, 0], [0, -.04, .035], [0, -.09, .058], [0, -.13, .07]], .0075, 1.8)),
        S("plastic", rbox(.012, .03, .018, .003), [0, -.012, .012]), // web near the pivot
        ...within(pad, [0, -.19, .078], [-.22, 0, 0]),
      ];
      return {
        statics,
        moving: [{ name: "arm", pivot, axis: "x", mode: "press", range: .28, specs: within(arm, pivot) }],
        anchors: { app_out: [.006, .108, .03] },
      };
    },
  },

  // Pendant brake pedal: pressed-steel bracket, steel arm, wide rubber pad, return spring, position sensor.
  brake_pedal: {
    ref: "HMI/brake_pedal__TURN.png",
    build: () => {
      const pivot: V3 = [0, -.03, .045];
      const helix: V3[] = Array.from({ length: 49 }, (_, i) => {
        const t = i / 48, a = t * Math.PI * 2 * 8;
        return [Math.cos(a) * .006, .02 - t * .045, .05 + Math.sin(a) * .006];
      });
      const statics: Spec[] = [
        S("castAl", box(.1, .1, .004), [0, 0, .002]), // firewall plate
        S("castAl", box(.004, .085, .06), [-.03, -.01, .032]), // side cheeks
        S("castAl", box(.004, .085, .06), [.03, -.01, .032]),
        S("castAl", box(.064, .004, .06), [0, .032, .032]),
        S("steel", cylX(.006, .075, 16), pivot), // pivot pin
        S("steel", tube(helix, .0012, 120, 5), [-.02, 0, 0]), // return spring
        S("plastic", rbox(.024, .03, .022, .003), [.044, -.02, .04]), // pedal position sensor
        S("hvOrange", box(.006, .006, .006), [.044, -.001, .045]),
        S("rubber", tube([[.044, -.004, .04], [.05, .02, .03], [.04, .04, .02]], .0025, 16)),
        ...[[-.04, .04], [.04, .04], [-.04, -.04], [.04, -.04]].map(([x, y]) => S("steel", cylZ(.005, .004, 12), [x, y, .006])),
      ];
      const pad = [
        S("rubber", rbox(.11, .075, .014, .006)),
        ...Array.from({ length: 6 }, (_, i) => S("rubber", box(.1, .0045, .004), [0, .028 - i * .0112, .008])),
      ];
      const arm: Spec[] = [
        S("gunmetal", pedalArm([[0, 0, 0], [0, -.06, .02], [0, -.13, .05], [0, -.18, .08]], .006, 1.9)),
        ...within(pad, [0, -.205, .095], [-.4, 0, 0]),
      ];
      return {
        statics,
        moving: [{ name: "arm", pivot, axis: "x", mode: "press", range: .3, specs: within(arm, pivot) }],
        anchors: { bpp_out: [.04, .04, .02] },
      };
    },
  },

  // Three-spoke wheel with airbag hub, column stub and the steering-angle sensor ring.
  // Rotation axis is local X; the driver sits on +X.
  steering_wheel: {
    ref: "HMI/steering_wheel__TURN.png",
    build: () => {
      const statics: Spec[] = [
        S("steel", cylX(.011, .14, 16), [-.09, 0, 0]), // column stub
        S("plastic", cylX(.034, .022, 28), [-.035, 0, 0]), // angle sensor ring
        S("plastic", rbox(.016, .012, .014, .002), [-.035, -.04, 0]),
      ];
      const wheel: Spec[] = [
        S("rubber", torusX(.185, .016, 56)),
        S("plastic", sphere(.07, 24), [.03, -.01, 0], [0, 0, 0], [.42, .82, 1]), // airbag hub
        S("plastic", cylX(.04, .04, 20), [.004, 0, 0]),
      ];
      // Silver spokes at 9, 3 and 6 o'clock with button pads on the side spokes.
      for (const [y, z, len, rot] of [[0, .12, .11, 0], [0, -.12, .11, 0], [-.11, 0, .1, Math.PI / 2]] as const) {
        wheel.push(S("steel", rbox(.012, .022, len, .004), [.012, y, z], [rot, 0, 0]));
        if (rot === 0) wheel.push(S("plastic", rbox(.006, .026, .04, .003), [.02, .008, z * .7]));
      }
      return {
        statics,
        moving: [{ name: "wheel", pivot: [.02, 0, 0], axis: "x", mode: "rotate", range: Math.PI * 1.5, specs: wheel }],
        anchors: { angle_out: [-.035, -.048, 0], column_out: [-.16, 0, 0] },
      };
    },
  },

  // Rotary PRND dial in a console module with four indicator LEDs and a front tray.
  gear_selector: {
    ref: "HMI/gear_selector__REF.png",
    build: () => {
      const statics: Spec[] = [
        S("plastic", rbox(.1, .03, .108, .008), [0, .015, -.026]), // dial half
        S("plastic", rbox(.1, .014, .056, .006), [0, .007, .052]), // tray floor
        ...[-.047, .047].map(x => S("plastic", box(.006, .03, .05), [x, .015, .052])), // tray side walls
        S("plastic", rbox(.1, .03, .008, .003), [0, .015, .076]), // tray front wall
        S("steel", rbox(.093, .002, .1, .001), [0, .0302, -.026]), // bright trim
        S("rubber", rbox(.088, .002, .094, .004), [0, .0315, -.024]), // gloss panel
        S("led", torusZ(.03, .0014, 40).rotateX(Math.PI / 2), [0, .0325, -.02]),
        ...[-.027, -.009, .009, .027].map(x => S("led", sphere(.0018, 8), [x, .033, -.062])),
        ...[[-1, -.05], [-1, .05], [1, -.05], [1, .05]].map(([sx, z]) => S("plastic", box(.006, .01, .012), [sx * .052, .004, z])),
      ];
      const dial: Spec[] = [
        S("steel", cyl(.027, .016, 40), [0, .008, 0]),
        S("rubber", cyl(.025, .004, 40), [0, .018, 0]),
        ...Array.from({ length: 30 }, (_, i) => { const a = i / 30 * Math.PI * 2; return S("gunmetal", box(.0016, .012, .0016), [Math.cos(a) * .0272, .008, Math.sin(a) * .0272], [0, -a, 0]); }),
      ];
      return {
        statics,
        moving: [{ name: "dial", pivot: [0, .032, -.02], axis: "y", mode: "rotate", range: Math.PI / 2, specs: within(dial, [0, .032, -.02]) }],
        anchors: { gear_out: [0, 0, .08] },
      };
    },
  },

  // Push-to-start button: leather-grain bezel, chrome ring, LED ring + power icon, rear connector.
  start_button: {
    ref: "HMI/start_button__REF.png",
    build: () => {
      const bezel = roundRect(new THREE.Shape(), .07, .066, .012) as THREE.Shape;
      const statics: Spec[] = [
        S("plastic", extrude(bezel, .01, .002), [0, 0, 0]),
        S("steel", torusZ(.0215, .0028, 40), [0, 0, .007]),
        S("plastic", box(.034, .034, .03), [0, 0, -.02]), // switch body behind the dash
        ...within(connector(.02, .016, .012, 3, 1), [0, 0, -.035], [0, Math.PI, 0]),
      ];
      const cap: Spec[] = [
        S("rubber", cylZ(.018, .008, 36), [0, 0, .008]),
        S("led", torusZ(.0158, .0007, 40), [0, 0, .0122]),
        S("led", torusZ(.0055, .0008, 24, Math.PI * 1.55).rotateZ(-Math.PI / 2 + Math.PI * .225), [0, 0, .0122]),
        S("led", box(.0016, .0065, .0012), [0, .0035, .0122]),
      ];
      return {
        statics,
        moving: [{ name: "cap", pivot: [0, 0, 0], axis: "z", mode: "push", range: -.004, specs: cap }],
        anchors: { start_out: [0, 0, -.047] },
      };
    },
  },

  // ───────────────────────── ECUs ─────────────────────────
  vcu: {
    ref: "ecu/vcu__REF.png",
    build: () => {
      const w = .2, h = .036, d = .16;
      const statics = [
        ...finnedHousing(w, h, d, 14),
        ...within(connector(.07, .036, .016, 8, 3), [-.045, .02, d / 2 - .004]),
        ...within(connector(.06, .036, .016, 6, 3), [.045, .02, d / 2 - .004]),
      ];
      return {
        statics,
        anchors: {
          app_in: [-.07, .02, d / 2 + .014], bpp_in: [-.055, .02, d / 2 + .014], gear_in: [-.04, .02, d / 2 + .014],
          start_in: [-.025, .02, d / 2 + .014], power_limit_in: [.03, .03, d / 2 + .014], derate_in: [.045, .03, d / 2 + .014],
          vehicle_speed_in: [.06, .03, d / 2 + .014], torque_req_out: [.035, .01, d / 2 + .014], ready_out: [.055, .01, d / 2 + .014],
        },
      };
    },
  },

  // Same family as the VCU but taller, with an explode view: lid lifts to show the
  // control PCB and copper power busbars (ecu/mcu__CUT.png).
  mcu: {
    ref: "ecu/mcu__CUT.png",
    build: () => {
      const w = .22, h = .05, d = .17;
      const housing = finnedHousing(w, h, d, 14);
      const base = housing.filter(s => s.position?.[1] !== undefined && s.position[1] < h * .5 && s.key !== "steel");
      const lid = housing.filter(s => !base.includes(s));
      const inner: Spec[] = [
        S("pcb", box(w * .84, .002, d * .72), [0, h * .58, -.006]),
        S("plastic", box(.03, .003, .03), [-.05, h * .6, -.01]), // controller chip
        ...[-.0, .025, .05, .075].map(x => S("plastic", box(.016, .006, .014), [x, h * .62, -.045])), // power stage drivers
        ...[-.08, -.065].map(x => S("castAl", cyl(.006, .014, 12), [x, h * .65, .02])), // capacitors
        ...[-.03, .03].map(x => S("copper", box(.05, .004, .012), [x, h * .45, .03])), // busbars
      ];
      return {
        statics: [
          ...base, ...inner,
          ...within(connector(.075, .036, .016, 8, 3), [-.05, .022, d / 2 - .004]),
          ...within(connector(.075, .036, .016, 8, 3), [.05, .022, d / 2 - .004]),
        ],
        moving: [{ name: "lid", pivot: [0, 0, 0], axis: "y", mode: "explode", range: .08, specs: lid }],
        anchors: { torque_req_in: [-.07, .03, d / 2 + .014], rotor_pos_in: [-.03, .03, d / 2 + .014], gate_cmd_out: [.05, .022, d / 2 + .014] },
      };
    },
  },

  // Black plastic cover on an aluminium bracket plate with two ears (ecu/thermal_ecu__CUT.png).
  thermal_ecu: {
    ref: "ecu/thermal_ecu__CUT.png",
    build: () => {
      const statics: Spec[] = [
        S("castAl", box(.15, .004, .12), [0, .002, 0]),
        S("castAl", ear(.03, .026, .004, .006), [.06, .002, -.06]),
        S("castAl", ear(.03, .026, .004, .006), [-.06, .002, .06], [0, Math.PI, 0]),
        S("plastic", rbox(.13, .03, .105, .006), [0, .019, 0]),
        S("plastic", rbox(.08, .006, .06, .003), [.012, .036, -.01]),
        ...[[-.06, -.048], [.06, -.048], [-.06, .048], [.06, .048]].map(([x, z]) => S("steel", screwHead(.003), [x, .035, z])),
        ...within(connector(.06, .032, .02, 8, 2), [-.02, .019, .05]),
      ];
      return { statics, anchors: { temp_in: [-.04, .02, .072], fan_speed_in: [-.03, .02, .072], fan_pwm_out: [-.01, .02, .072], pump_cmd_out: [0, .02, .072], derate_out: [.01, .02, .072] } };
    },
  },

  // BMS: ribbed black cover on a cast plate with four ears, two grey sealed connectors (ecu/bms__REF.png).
  // Modelled in code instead of TRELLIS: a box part needs anchors and a low poly count more than scan detail.
  bms: {
    ref: "ecu/bms__REF.png",
    build: () => {
      const w = .2, d = .16;
      const statics: Spec[] = [
        S("castAl", rbox(w + .02, .006, d + .01, .002), [0, .003, 0]),
        ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => S("castAl", ear(.02, .02, .006, .004), [sx * (w / 2 + .006), .003, sz * d * .38], [0, sx * Math.PI / 2, 0])),
        S("plastic", rbox(w, .032, d, .006), [0, .022, 0]),
        S("plastic", rbox(w * .92, .01, d * .62, .004), [0, .041, -.02]),
        ...[-.06, -.02, .02, .06].map(x => S("plastic", box(.006, .006, d * .7), [x, .047, -.02])), // ribs
        S("plastic", rbox(.06, .004, .03, .002), [-.03, .048, .03]),
        ...[[-.09, -.07], [.09, -.07], [-.09, .07], [.09, .07]].map(([x, z]) => S("steel", screwHead(.003), [x, .008, z])),
        ...within(connector(.07, .034, .02, 9, 2, "greyPlastic"), [-.045, .022, d / 2 - .004]),
        ...within(connector(.07, .034, .02, 9, 2, "greyPlastic"), [.045, .022, d / 2 - .004]),
      ];
      return { statics, anchors: { ready_in: [-.06, .03, d / 2 + .02], voltage_in: [-.03, .03, d / 2 + .02], contactor_cmd_out: [.03, .03, d / 2 + .02], limit_out: [.06, .03, d / 2 + .02] } };
    },
  },

  // Brake ECU sits on the hydraulic valve block with the pump motor on the side (ecu/brake_ecu__CUT.png).
  brake_ecu: {
    ref: "ecu/brake_ecu__CUT.png",
    build: () => {
      const statics: Spec[] = [
        S("castAl", rbox(.12, .07, .1, .004), [0, .035, 0]), // valve block
        ...[[-.035, .045], [0, .02], [.035, .045], [-.035, .015], [.035, .015]].map(([x, y]) => S("gunmetal", cylZ(.008, .004, 18), [x, y, .05])),
        ...[[-.035, .045], [0, .02], [.035, .045], [-.035, .015], [.035, .015]].map(([x, y]) => S("rubber", cylZ(.0055, .002, 14), [x, y, .0525])),
        S("plastic", cylX(.035, .045, 28), [.082, .045, -.01]), // pump motor
        S("plastic", rbox(.125, .045, .105, .006), [0, .095, 0]), // ECU cover
        S("plastic", rbox(.09, .006, .07, .003), [0, .12, -.008]),
        ...[[-.057, -.047], [.057, -.047], [-.057, .047], [.057, .047]].map(([x, z]) => S("steel", screwHead(.003), [x, .118, z])),
        ...within(connector(.075, .028, .02, 12, 2), [-.01, .095, .048]),
      ];
      return { statics, anchors: { bpp_in: [-.04, .1, .072], wheel_speed_in: [-.02, .1, .072], pressure_cmd_out: [.01, .1, .072], vehicle_speed_out: [.025, .1, .072] } };
    },
  },

  // EPS ECU: finned cast housing bolted to the assist motor (ecu/eps_ecu__CUT.png).
  eps_ecu: {
    ref: "ecu/eps_ecu__CUT.png",
    build: () => {
      const statics: Spec[] = [
        ...finnedHousing(.12, .05, .1, 10),
        S("castAl", cylZ(.042, .03, 28), [0, .03, -.065]), // adapter flange
        S("plastic", cylZ(.04, .09, 32), [0, .03, -.125]), // assist motor
        S("castAl", cylZ(.041, .006, 32), [0, .03, -.172]),
        ...within(connector(.05, .026, .016, 8, 2), [-.022, .024, .046]),
        ...within(connector(.026, .02, .016, 3, 1), [.035, .024, .046]),
      ];
      return { statics, anchors: { angle_in: [-.03, .024, .07], assist_cmd_out: [.035, .024, .07] } };
    },
  },

  // ───────────────────────── Sensors ─────────────────────────
  // Hall-type sensor above a toothed tone ring; the ring spins on local X (wheel axis).
  wheel_speed_sensor: {
    ref: "sensors/wheel_speed_sensor__REF.png",
    build: () => {
      const flange = new THREE.Shape();
      roundRect(flange, .036, .016, .008);
      flange.holes.push(circlePath(.0035, .01, 0));
      const statics: Spec[] = [
        S("plastic", cyl(.0085, .04, 20), [0, .065, 0]), // sensor body, tip points down to the ring
        S("plastic", cyl(.011, .008, 20), [0, .083, 0]),
        S("steel", cyl(.0025, .001, 10), [0, .0448, 0]), // sensing tip
        S("plastic", extrude(flange, .006).rotateX(Math.PI / 2), [.008, .09, 0]),
        S("steel", cyl(.0048, .0065, 14), [.018, .09, 0]),
        S("rubber", tube([[-.004, .094, 0], [-.01, .12, 0], [.02, .14, 0], [.07, .13, 0], [.09, .1, 0]], .0028, 40)),
        S("plastic", rbox(.012, .008, .01, .002), [.035, .141, 0]), // harness clip
        ...within(connector(.022, .02, .026, 2, 1), [.09, .085, 0], [Math.PI / 2, 0, 0]),
      ];
      const teeth = 40, R = .045;
      const ring: Spec[] = [S("steel", torusX(R - .004, .0045, 48), [0, 0, 0], [0, 0, 0], [1.6, 1, 1])];
      for (let i = 0; i < teeth; i++) {
        const a = i / teeth * Math.PI * 2;
        ring.push(S("steel", box(.01, .006, .0045), [0, Math.cos(a) * (R + .001), Math.sin(a) * (R + .001)], [a, 0, 0]));
      }
      return {
        statics,
        moving: [{ name: "toneRing", pivot: [0, 0, 0], axis: "x", mode: "spin", range: 1, specs: ring }],
        anchors: { rotation_in: [0, 0, 0], signal_out: [.09, .057, 0] },
      };
    },
  },

  // Resolver: stator ring with copper coils on nylon bobbins, lobed steel rotor spinning on X.
  rotor_position_sensor: {
    ref: "sensors/rotor_position_sensor__REF.png",
    build: () => {
      const Ro = .06, Ri = .049, depth = .024;
      const ring = new THREE.Shape().absarc(0, 0, Ro, 0, Math.PI * 2, false);
      ring.holes.push(circlePath(Ri));
      const statics: Spec[] = [S("castAl", extrude(ring, depth, .001).rotateY(Math.PI / 2))];
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI * 2 + Math.PI / 2;
        statics.push(S("castAl", ear(.016, .016, .006, .0028), [0, Math.sin(a) * (Ro - .004), Math.cos(a) * (Ro - .004)], [Math.PI - a, 0, Math.PI / 2]));
      }
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2, r = Ri - .009;
        statics.push(S("nylon", box(depth * .95, .019, .006), [0, Math.cos(a) * (r + .004), Math.sin(a) * (r + .004)], [a, 0, 0]));
        statics.push(S("copper", rbox(depth * .8, .016, .013, .004), [0, Math.cos(a) * r, Math.sin(a) * r], [a, 0, 0]));
      }
      statics.push(
        S("rubber", tube([[0, .055, .02], [.01, .07, .035], [.02, .08, .06]], .003, 16)),
        S("wireRed", tube([[0, .056, .021], [.011, .072, .036], [.021, .082, .061]], .0012, 16), [.002, .002, 0]),
        S("nylon", rbox(.012, .01, .018, .002), [.022, .084, .07]),
      );
      const lobes = new THREE.Shape();
      for (let i = 0; i <= 120; i++) {
        const t = i / 120 * Math.PI * 2, r = .03 + .005 * Math.cos(t * 6);
        if (i === 0) lobes.moveTo(r, 0); else lobes.lineTo(Math.cos(t) * r, Math.sin(t) * r);
      }
      lobes.holes.push(circlePath(.017));
      const rotor: Spec[] = [S("steel", extrude(lobes, depth * .9).rotateY(Math.PI / 2))];
      return {
        statics,
        moving: [{ name: "rotor", pivot: [0, 0, 0], axis: "x", mode: "spin", range: 1, specs: rotor }],
        anchors: { rotation_in: [0, 0, 0], angle_out: [.022, .084, .08] },
      };
    },
  },

  // NTC probe: stainless tip, heat-shrink, red/black lead to a white two-pin plug.
  motor_temp_sensor: {
    ref: "sensors/motor_temp_sensor__REF.png",
    build: () => {
      const lead: V3[] = [[0, 0, .075], [0, .01, .11], [.03, .05, .13], [.07, .06, .1], [.08, .04, .06], [.07, .02, .03]];
      const statics: Spec[] = [
        S("steel", cylZ(.0028, .03, 16), [0, 0, .015]),
        S("steel", sphere(.0028, 12), [0, 0, 0]),
        S("rubber", cylZ(.0036, .04, 16, .0034), [0, 0, .05]),
        S("rubber", tube(lead, .0011, 48), [-.0013, 0, 0]),
        S("wireRed", tube(lead, .0011, 48), [.0013, 0, 0]),
        S("nylon", rbox(.012, .008, .01, .0015), [.07, .02, .024]),
        S("rubber", box(.003, .003, .002), [.0675, .02, .0185]),
        S("rubber", box(.003, .003, .002), [.0725, .02, .0185]),
      ];
      return { statics, anchors: { heat_in: [0, 0, 0], temp_out: [.07, .02, .018] } };
    },
  },
  // ───────────────────────── Power ─────────────────────────
  // Flat cast pack: ribbed lid, bolted flange, 2 orange HV + 1 black LV connector, coolant stubs (+Z face).
  hv_battery: {
    ref: "power-battery/hv_battery__REF.png",
    build: () => {
      const w = .9, h = .1, d = .62;
      const statics: Spec[] = [
        S("castAl", rbox(w, h * .8, d, .01), [0, h * .4, 0]),
        S("castAl", box(w + .03, .008, d + .03), [0, .012, 0]), // perimeter flange
        S("castAl", rbox(w - .02, .01, d - .02, .004), [0, h * .82, 0]), // lid
        ...[-.27, 0, .27].map(x => S("castAl", box(.045, .012, d - .06), [x, h * .9, 0])), // longitudinal ribs
        ...[-.15, .15].map(z => S("castAl", box(w - .06, .012, .04), [0, h * .9, z])), // cross ribs
      ];
      for (let i = 0; i < 9; i++) for (const sz of [-1, 1]) statics.push(S("steel", screwHead(.006), [-w / 2 + .02 + i * (w - .04) / 8, h * .87, sz * (d / 2 - .012)]));
      for (let i = 1; i < 6; i++) for (const sx of [-1, 1]) statics.push(S("steel", screwHead(.006), [sx * (w / 2 - .012), h * .87, -d / 2 + i * d / 6]));
      for (const sx of [-1, 1]) for (const sz of [-.3, .3]) statics.push(S("castAl", ear(.03, .03, .008, .007), [sx * (w / 2 + .01), .008, sz], [0, sx * Math.PI / 2, 0]));
      statics.push(
        ...within(connector(.075, .06, .03, 2, 1, "hvOrange"), [-.18, .045, d / 2]),
        ...within(connector(.075, .06, .03, 2, 1, "hvOrange"), [.12, .045, d / 2]),
        ...within(connector(.05, .045, .025, 4, 2), [-.03, .045, d / 2]),
        ...[-.36, .32].flatMap(x => [S("steel", cylZ(.012, .05, 16), [x, .035, d / 2 + .025]), S("coolant", cylZ(.0135, .008, 16), [x, .035, d / 2 + .01])]),
      );
      return { statics, anchors: { dc_out: [-.18, .045, d / 2 + .04], voltage_sense_out: [-.03, .045, d / 2 + .035] } };
    },
  },

  // HV DC contactor: black coil body, two copper studs with nuts, side coil connector, flanged base.
  main_contactor: {
    ref: "power-battery/main_contactor__REF.png",
    build: () => {
      const base = new THREE.Shape();
      roundRect(base, .12, .07, .02);
      base.holes.push(circlePath(.006, -.045, 0), circlePath(.006, .045, 0));
      const statics: Spec[] = [
        S("plastic", extrude(base, .008).rotateX(-Math.PI / 2), [0, .004, 0]),
        S("plastic", cyl(.036, .06, 32), [0, .038, 0]),
        S("plastic", rbox(.08, .028, .066, .012), [0, .078, 0]), // top cap
        S("plastic", box(.008, .026, .05), [0, .1, 0]), // divider fin
        ...[-.045, .045].map(x => S("steel", cyl(.0065, .004, 16), [x, .009, 0])),
      ];
      for (const x of [-.022, .022]) statics.push(
        S("copper", box(.026, .003, .03), [x, .0935, 0]),
        S("steel", cyl(.0085, .007, 6), [x, .099, 0]),
        S("copper", cyl(.005, .03, 16), [x, .11, 0]),
        ...Array.from({ length: 5 }, (_, i) => S("copper", torusZ(.005, .0008, 12).rotateX(Math.PI / 2), [x, .1 + i * .004, 0])),
      );
      statics.push(
        ...within(connector(.016, .014, .014, 2, 1, "greyPlastic"), [.038, .07, .018], [0, Math.PI / 2, 0]),
        S("wireRed", tube([[.046, .062, .016], [.05, .045, .02], [.044, .03, .034]], .0013, 12)),
        S("rubber", tube([[.046, .062, .02], [.05, .045, .024], [.044, .03, .038]], .0013, 12)),
      );
      return { statics, anchors: { cmd_in: [.056, .07, .018], hv_in: [-.022, .125, 0], hv_out: [.022, .125, 0] } };
    },
  },

  // ───────────────────────── Drivetrain ─────────────────────────
  // Finned cast inverter: 2 square orange DC inputs, 3 round orange AC outputs, black signal connector.
  inverter: {
    ref: "drivetrain/inverter__REF.png",
    build: () => {
      const w = .3, d = .22;
      const statics: Spec[] = [
        ...finnedHousing(w, .12, d, 16),
        ...within(connector(.05, .05, .026, 2, 1, "hvOrange"), [-.11, .055, d / 2 - .004]),
        ...within(connector(.05, .05, .026, 2, 1, "hvOrange"), [-.05, .055, d / 2 - .004]),
        ...[.01, .045, .08].flatMap(x => [S("hvOrange", cylZ(.014, .028, 20), [x, .055, d / 2 + .01]), S("copper", cylZ(.006, .004, 12), [x, .055, d / 2 + .025])]),
        ...within(connector(.04, .036, .02, 5, 3), [.125, .06, d / 2 - .004]),
        ...[-.12, .1].map(x => S("steel", cylZ(.009, .04, 14), [x, .016, d / 2 + .015])),
      ];
      return { statics, anchors: { gate_in: [.125, .06, d / 2 + .02], dc_in: [-.08, .055, d / 2 + .025], ac_out: [.045, .055, d / 2 + .03] } };
    },
  },

  // Finned motor housing on X, terminal box with three orange phase cables, spinning splined shaft at +X.
  traction_motor: {
    ref: "drivetrain/traction_motor__TURN.png",
    build: () => {
      const R = .11, L = .26;
      const statics: Spec[] = [
        S("castAl", cylX(R, L, 40)),
        ...[-1, 1].map(s => S("castAl", cylX(R * 1.06, .03, 40), [s * (L / 2 - .01), 0, 0])), // end bells
        S("castAl", cylX(R * .55, .02, 32), [L / 2 + .012, 0, 0]),
        S("castAl", cylX(R * .5, .02, 32), [-L / 2 - .012, 0, 0]),
      ];
      for (let i = 0; i < 20; i++) {
        const a = i / 20 * Math.PI * 2;
        if (Math.abs(Math.sin(a) - 1) < .08) continue;
        statics.push(S("castAl", box(L * .82, .012, .006), [0, Math.cos(a) * (R + .005), Math.sin(a) * (R + .005)], [a, 0, 0]));
      }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; statics.push(S("steel", screwHead(.005).rotateZ(Math.PI / 2), [L / 2 + .002, Math.cos(a) * R * .9, Math.sin(a) * R * .9])); }
      statics.push(
        S("castAl", rbox(.1, .04, .07, .008), [0, R + .02, 0]), // terminal box
        ...[-.025, 0, .025].flatMap(x => [
          S("castAl", cyl(.007, .014, 12), [x, R + .046, 0]),
          S("hvOrange", tube([[x, R + .05, 0], [x, R + .1, .0], [x - .04, R + .12, -.05]], .0065, 16)),
        ]),
      );
      const shaft: Spec[] = [
        S("steel", cylX(.02, .06, 20), [L / 2 + .05, 0, 0]),
        ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return S("steel", box(.04, .004, .004), [L / 2 + .06, Math.cos(a) * .02, Math.sin(a) * .02], [a, 0, 0]); }),
        S("gunmetal", cylX(.035, .01, 24), [L / 2 + .026, 0, 0]),
      ];
      return {
        statics,
        moving: [{ name: "shaft", pivot: [0, 0, 0], axis: "x", mode: "spin", range: 1, specs: shaft }],
        anchors: { ac_in: [-.04, R + .12, -.05], shaft_out: [L / 2 + .08, 0, 0], rotor_speed_out: [-L / 2 - .022, 0, 0], heat_out: [0, 0, R + .01] },
      };
    },
  },

  // Single-speed reduction gearbox: ribbed cast case, motor input bell on -X, output flange on +Z.
  reduction_gear: {
    ref: "drivetrain/reduction_gear__REF.png",
    build: () => {
      const statics: Spec[] = [
        S("castAl", rbox(.24, .2, .16, .03)),
        S("castAl", rbox(.2, .16, .2, .03), [.02, -.01, 0]),
        S("castAl", cylX(.085, .03, 40), [-.13, .01, 0]), // input bell
        S("rubber", cylX(.055, .002, 32), [-.146, .01, 0]),
        S("steel", cylX(.018, .03, 18), [-.14, .01, 0]), // input spline
        S("castAl", box(.03, .04, .05), [0, .12, -.02]), // top mount boss
        S("castAl", box(.02, .1, .02), [.12, 0, .085]), // ribs
        S("castAl", box(.02, .1, .02), [-.02, 0, .105]),
        ...within([S("gunmetal", cylZ(.045, .012, 32)), S("steel", cylZ(.034, .02, 32), [0, 0, .015]), ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * Math.PI * 2; return S("steel", cylZ(.004, .006, 8), [Math.cos(a) * .024, Math.sin(a) * .024, .026]); })], [.05, -.03, .1]),
      ];
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; statics.push(S("steel", screwHead(.004).rotateZ(Math.PI / 2), [-.146, .01 + Math.cos(a) * .072, Math.sin(a) * .072])); }
      for (const [x, y] of [[-.1, .09], [.1, .09], [-.1, -.09], [.1, -.09], [0, .1]]) statics.push(S("steel", screwHead(.005).rotateX(Math.PI / 2), [x, y, .1]));
      return { statics, anchors: { in: [-.155, .01, 0], out: [.05, -.03, .135] } };
    },
  },

  // Open differential: big spur ring gear, case with a window onto the spider gears, bearings each side. Spins on X.
  differential: {
    ref: "drivetrain/differential__REF.png",
    build: () => {
      const spin: Spec[] = [
        S("steel", extrude(gearShape(.13, .118, 46, .07), .03).rotateY(Math.PI / 2), [-.03, 0, 0]),
        S("castAl", cylX(.075, .14, 32), [.035, 0, 0]),
        S("rubber", box(.07, .09, .002), [.04, 0, .075]), // window into the case
        S("steel", cylZ(.008, .14, 12), [.04, 0, 0]), // cross pin
        ...[[0, .03], [0, -.03]].map(([, y]) => S("steel", cyl(.022, .02, 16, .012), [.04, y, .03], [y > 0 ? 0 : Math.PI, 0, 0])), // spider gears
        ...[-1, 1].map(s => S("steel", cylX(.024, .02, 16, .014).rotateZ(s < 0 ? Math.PI : 0), [.04 + s * .03, 0, .03])), // side gears
        ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * Math.PI * 2; return S("steel", screwHead(.006).rotateZ(Math.PI / 2), [-.047, Math.cos(a) * .095, Math.sin(a) * .095]); }),
        ...[-1, 1].flatMap(s => [S("steel", cylX(.045, .03, 32), [.035 + s * .09, 0, 0]), S("rubber", cylX(.035, .032, 24), [.035 + s * .09, 0, 0]), S("gunmetal", cylX(.022, .034, 20), [.035 + s * .09, 0, 0])]),
      ];
      return {
        statics: [],
        moving: [{ name: "case", pivot: [0, 0, 0], axis: "x", mode: "spin", range: 1, specs: spin }],
        anchors: { in: [-.03, .13, 0], left_out: [-.07, 0, 0] },
      };
    },
  },

  // CV drive shaft on X: splined stubs, CV housings, folded rubber boots, bar. Spins on X.
  drive_shaft: {
    ref: "drivetrain/drive_shaft__REF.png",
    build: () => {
      const cv: [number, number][] = [[0, 0], [.03, 0], [.036, .02], [.034, .05], [.02, .06], [0, .06]];
      const end = (s: number): Spec[] => [
        S("steel", latheX(s > 0 ? cv : cv.map(([r, x]) => [r, -x] as [number, number]).reverse()), [s * .24, 0, 0]),
        S("rubber", s > 0 ? bellowsX(.1, .016, .034, 6) : bellowsX(.1, .034, .016, 6), [s * .17, 0, 0]),
        S("steel", cylX(.012, .05, 16), [s * .325, 0, 0]),
        S("gunmetal", torusX(.026, .003, 24), [s * .245, 0, 0]),
      ];
      const spin: Spec[] = [S("steel", cylX(.012, .3, 16)), ...end(-1), ...end(1)];
      return {
        statics: [],
        moving: [{ name: "shaft", pivot: [0, 0, 0], axis: "x", mode: "spin", range: 1, specs: spin }],
        anchors: { in: [-.35, 0, 0], out: [.35, 0, 0] },
      };
    },
  },

  // Wheel hub & bearing: flanged bearing housing with ears (static), hub flange with five studs and splined bore spinning on X.
  wheel: {
    ref: "drivetrain/wheel__REF.png",
    build: () => {
      const statics: Spec[] = [
        S("castAl", cylX(.05, .05, 32), [-.03, 0, 0]),
        S("rubber", torusX(.05, .002, 32), [-.005, 0, 0]),
        ...[0, 1, 2, 3].map(i => { const a = i / 4 * Math.PI * 2 + Math.PI / 4; return S("castAl", ear(.025, .024, .012, .005), [-.045, Math.sin(a) * .045, Math.cos(a) * .045], [Math.PI - a, 0, Math.PI / 2]); }),
      ];
      const hub: Spec[] = [
        S("steel", cylX(.075, .012, 40), [.006, 0, 0]),
        S("steel", cylX(.032, .03, 24), [.025, 0, 0]),
        S("gunmetal", cylX(.017, .032, 18), [.026, 0, 0]),
        ...Array.from({ length: 5 }, (_, i) => { const a = i / 5 * Math.PI * 2; return S("steel", cylX(.006, .045, 12), [.032, Math.cos(a) * .055, Math.sin(a) * .055]); }),
      ];
      return {
        statics,
        moving: [{ name: "hub", pivot: [0, 0, 0], axis: "x", mode: "spin", range: 1, specs: hub }],
        anchors: { drive_torque_in: [-.06, 0, 0], brake_torque_in: [.012, .075, 0], steer_force_in: [-.045, .07, 0], rotation_out: [.06, 0, 0] },
      };
    },
  },

  // ───────────────────────── Brake ─────────────────────────
  // ABS/ESC unit: machined valve block with ports, pump motor can in front, black ECU behind, bracket with rubber feet.
  // Code-built instead of TRELLIS (box-shaped part that needs anchors).
  hydraulic_modulator: {
    ref: "brake/hydraulic_modulator__REF.png",
    build: () => {
      const statics: Spec[] = [
        S("castAl", box(.18, .006, .13), [0, .003, -.01]), // bracket
        ...[[-.075, .04], [.075, .04], [0, -.06]].map(([x, z]) => S("rubber", cyl(.012, .02, 16), [x, .016, z])),
        S("castAl", rbox(.12, .1, .1, .004), [0, .08, 0]), // valve block
        S("castAl", cylZ(.045, .06, 32), [-.02, .065, .08]), // pump motor can
        S("castAl", cylZ(.046, .006, 32), [-.02, .065, .112]),
        S("plastic", rbox(.13, .08, .07, .008), [.01, .16, -.04]), // ECU
        ...within(connector(.05, .03, .03, 7, 2), [-.02, .17, -.005]),
      ];
      for (const [x, y] of [[-.035, .115], [.0, .115], [.035, .115], [.04, .075], [.04, .045]]) statics.push(S("gunmetal", cylZ(.008, .004, 16), [x, y, .05]), S("rubber", cylZ(.0055, .002, 14), [x, y, .0525]));
      return { statics, anchors: { cmd_in: [-.02, .17, .03], pressure_out: [.035, .115, .055] } };
    },
  },

  // Disc + pads + sliding caliper. Disc and hub spin on X; caliper, pads and hose are static.
  brake_caliper: {
    ref: "brake/brake_caliper__REF.png",
    build: () => {
      const discShape = new THREE.Shape().absarc(0, 0, .15, 0, Math.PI * 2, false);
      discShape.holes.push(circlePath(.075));
      const disc: Spec[] = [
        S("steel", extrude(discShape, .026).rotateY(Math.PI / 2)),
        S("gunmetal", cylX(.078, .04, 40), [.02, 0, 0]), // hat
        S("gunmetal", cylX(.035, .012, 24), [.045, 0, 0]),
        ...Array.from({ length: 5 }, (_, i) => { const a = i / 5 * Math.PI * 2; return S("steel", cylX(.006, .04, 12), [.055, Math.cos(a) * .055, Math.sin(a) * .055]); }),
      ];
      // Caliper sits at about 2 o'clock on the disc rim.
      const caliper: Spec[] = [
        S("gunmetal", rbox(.07, .11, .045, .01), [0, 0, 0]), // bridge over the rim
        S("gunmetal", rbox(.03, .13, .06, .008), [.03, 0, -.03]), // outer body
        S("gunmetal", rbox(.04, .13, .06, .008), [-.035, 0, -.03]), // piston body
        S("plastic", box(.012, .1, .04), [.0195, 0, -.035]), // pads
        S("plastic", box(.012, .1, .04), [-.0195, 0, -.035]),
        ...[-1, 1].map(s => S("rubber", cylZ(.008, .02, 12), [-.035, s * .07, -.03])), // slide pin boots
        S("steel", cyl(.004, .016, 10), [-.045, .072, -.01]), // bleeder
      ];
      const a = Math.PI * .28;
      return {
        statics: [
          ...within(caliper, [0, Math.cos(a) * .135, Math.sin(a) * .135], [-a, 0, 0]),
          S("rubber", tube([[-.05, .14, .07], [-.08, .17, .05], [-.12, .18, .0]], .005, 16)),
        ],
        moving: [{ name: "disc", pivot: [0, 0, 0], axis: "x", mode: "spin", range: 1, specs: disc }],
        anchors: { pressure_in: [-.12, .18, 0], brake_torque_out: [.06, 0, 0] },
      };
    },
  },

  // ───────────────────────── Steering ─────────────────────────
  // Column-type EPS: motor can on X, worm gearbox with output shaft on +Z, black controller on top.
  eps_motor: {
    ref: "steering-suspension/eps_motor__REF.png",
    build: () => {
      const statics: Spec[] = [
        S("castAl", rbox(.09, .1, .09, .015), [0, 0, 0]), // gearbox
        S("castAl", cylZ(.045, .02, 32), [0, -.005, .05]),
        S("rubber", cylZ(.022, .004, 24), [0, -.005, .061]),
        S("steel", cylZ(.012, .04, 18), [0, -.005, .075]), // output spline
        ...[[-.05, .04], [.05, -.04], [-.04, -.05]].map(([x, y]) => S("castAl", cylZ(.012, .02, 16), [x, y, .03])), // bosses
        S("castAl", cylX(.05, .02, 32), [.055, -.005, -.005]),
        S("steel", cylX(.045, .1, 32), [.115, -.005, -.005]), // motor can
        S("steel", cylX(.04, .006, 32), [.168, -.005, -.005]),
        S("castAl", box(.09, .012, .08), [0, .056, -.005]),
        S("plastic", rbox(.09, .045, .08, .006), [0, .085, -.005]), // controller
        ...within(connector(.03, .022, .014, 5, 2), [-.015, .085, .03]),
        ...within(connector(.018, .018, .014, 2, 1), [.025, .085, .03]),
        S("rubber", tube([[.045, .09, -.02], [.08, .08, -.03], [.1, .045, -.03]], .004, 16)),
      ];
      return { statics, anchors: { cmd_in: [-.015, .085, .05], assist_out: [0, -.005, .095] } };
    },
  },

  // Rack & pinion on X: cast housing, pinion tower with splined input, rubber boots, tie rods.
  // The rack (tie rods + inner joints) slides along X.
  steering_rack: {
    ref: "steering-suspension/steering_rack__REF.png",
    build: () => {
      const statics: Spec[] = [
        S("castAl", cylX(.028, .42, 24), [.02, 0, 0]),
        S("castAl", cylX(.034, .03, 24), [-.19, 0, 0]),
        S("castAl", cylX(.034, .03, 24), [.23, 0, 0]),
        S("castAl", cyl(.03, .08, 24), [.18, .04, 0], [0, 0, -.25]), // pinion tower
        S("steel", cyl(.01, .05, 16), [.195, .1, 0], [0, 0, -.25]), // input spline
        ...[-.08, .1].map(x => S("castAl", ear(.035, .028, .012, .006), [x, -.02, 0], [Math.PI / 2, 0, 0])), // mounting brackets
        S("rubber", bellowsX(.13, .015, .03, 7), [-.27, 0, 0]),
        S("rubber", bellowsX(.13, .03, .015, 7), [.31, 0, 0]),
      ];
      const rack: Spec[] = [];
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? -.335 : .375;
        rack.push(
          S("steel", cylX(.008, .12, 12), [x0 + s * .05, 0, 0]),
          S("steel", sphere(.012, 12), [x0 + s * .11, 0, 0]),
          S("steel", cylX(.006, .03, 10), [x0 + s * .13, 0, 0]),
        );
      }
      return {
        statics,
        moving: [{ name: "rack", pivot: [0, 0, 0], axis: "x", mode: "push", range: .025, specs: rack }],
        anchors: { pinion_in: [.2, .125, 0], assist_in: [.02, 0, .03], tie_rod_out: [-.48, 0, 0] },
      };
    },
  },

  // ── Thermal ──
  // Radiator fan module (thermal/cooling_fan__REF.png): square black shroud with a round opening,
  // four corner ears, motor hub on struts, seven swept blades that spin, pigtail connector bottom-right.
  cooling_fan: {
    ref: "thermal/cooling_fan__REF.png",
    build: () => {
      const W = .42, H = .38, R = .172;
      const plate = roundRect(new THREE.Shape(), W, H, .02) as THREE.Shape;
      plate.holes.push(circlePath(R));
      const statics: Spec[] = [
        S("plastic", extrude(plate, .01), [0, 0, -.02]),
        S("plastic", torusZ(R + .002, .007, 56), [0, 0, -.012]), // rolled rim of the opening
        // side walls of the shroud
        S("plastic", box(W, .01, .05), [0, H / 2 - .005, -.04]),
        S("plastic", box(W, .01, .05), [0, -H / 2 + .005, -.04]),
        S("plastic", box(.01, H, .05), [W / 2 - .005, 0, -.04]),
        S("plastic", box(.01, H, .05), [-W / 2 + .005, 0, -.04]),
        // motor on the front (+Z), held by three struts
        S("plastic", cylZ(.05, .045, 32), [0, 0, .015]),
        S("plastic", cylZ(.044, .006, 32), [0, 0, .04]),
        S("steel", cylZ(.008, .008, 12), [0, 0, .045]),
        ...[0, 1, 2, 3].map(i => { const a = i / 4 * Math.PI * 2 + .4; return S("steel", screwHead(.004).rotateX(Math.PI / 2), [Math.cos(a) * .03, Math.sin(a) * .03, .044]); }),
        ...[0, 1, 2].map(i => { const a = i / 3 * Math.PI * 2 - Math.PI / 2; return S("plastic", box(R - .045, .012, .008), [Math.cos(a) * (R + .045) / 2, Math.sin(a) * (R + .045) / 2, -.016], [0, 0, a]); }),
        // pigtail: wire from the motor down to a sealed connector at the bottom-right corner
        S("rubber", tube([[.03, -.035, .02], [.09, -.1, .01], [.13, -.15, 0], [.15, -.17, 0]], .004, 24)),
        ...within(connector(.03, .022, .02, 2, 1), [.165, -.17, -.006]),
        S("hvOrange", box(.012, .006, .004), [.165, -.17, .016]), // locking clip
      ];
      // corner ears with bolt holes
      for (const sx of [-1, 1]) for (const sy of [-1, 1])
        statics.push(S("plastic", ear(.03, .024, .006, .005), [sx * (W / 2 - .02), sy * (H / 2 + .012), -.04], [Math.PI / 2, 0, sy > 0 ? Math.PI : 0]));
      // swept blades (spin about Z)
      const blades: Spec[] = [S("plastic", cylZ(.036, .012, 24), [0, 0, .044])];
      for (let i = 0; i < 7; i++) {
        const blade = new THREE.Shape();
        blade.moveTo(.045, -.012);
        blade.quadraticCurveTo(.1, -.04, .162, -.01);
        blade.quadraticCurveTo(.16, .03, .12, .05);
        blade.quadraticCurveTo(.08, .03, .045, .016);
        blade.lineTo(.045, -.012);
        const g = extrude(blade, .003);
        g.rotateX(.32); // blade pitch
        g.rotateZ(i / 7 * Math.PI * 2);
        blades.push(S("plastic", g, [0, 0, .004]));
      }
      return {
        statics,
        moving: [{ name: "blades", pivot: [0, 0, 0], axis: "z", mode: "spin", range: 1, specs: blades }],
        anchors: { pwm_in: [.165, -.17, .016], speed_out: [.175, -.17, .016] },
      };
    },
  },

  // Electric coolant pump (thermal/cooling_pump__REF.png): stainless motor can on +X, black volute
  // with an axial inlet on -X and a radial outlet pointing up, sealed connector on top, bolt-down foot.
  cooling_pump: {
    ref: "thermal/cooling_pump__REF.png",
    build: () => {
      const hose = (len: number, r: number): Spec[] => [
        S("plastic", cyl(r, len, 24)),
        S("plastic", cyl(r * 1.18, .006, 24), [0, len / 2 - .008, 0]), // bead that holds the hose
      ];
      const statics: Spec[] = [
        S("steel", cylX(.038, .08, 36), [.05, 0, 0]),                  // motor can
        S("plastic", cylX(.04, .01, 36), [.094, 0, 0]),                 // end cap
        S("plastic", cylX(.05, .012, 36), [.006, 0, 0]),                // flange
        S("plastic", cylX(.048, .035, 36, .04), [-.02, 0, 0]),          // volute
        S("plastic", rbox(.03, .05, .05, .008), [-.015, .03, .025]),    // volute bulge toward the outlet
        ...within(hose(.07, .014), [-.07, 0, 0], [0, 0, Math.PI / 2]), // axial inlet (-X)
        ...within(hose(.06, .012), [-.02, .075, .02]),                  // radial outlet (up)
        // connector on top of the motor can
        S("plastic", rbox(.03, .016, .022, .003), [.06, .045, 0]),
        ...within(connector(.022, .014, .014, 3, 1), [.06, .054, -.006]),
        // foot with two bolt holes
        S("plastic", box(.03, .04, .02), [.05, -.05, 0]),
        S("plastic", ear(.03, .022, .006, .005), [.05, -.07, .01], [0, 0, 0]),
        S("plastic", ear(.03, .022, .006, .005), [.05, -.07, -.01], [0, Math.PI, 0]),
      ];
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; statics.push(S("steel", screwHead(.004).rotateZ(Math.PI / 2), [.013, Math.cos(a) * .045, Math.sin(a) * .045])); }
      return { statics, anchors: { cmd_in: [.06, .054, .014] } };
    },
  },

  // ───────── Visual-only parts (shown in the garage, not simulation components; anchors "in"/"out") ─────────
  // CAN bus harness: twisted pair between two sealed connectors.
  can_harness: {
    ref: "network-diagnostics/can_harness__CUT.png",
    build: () => {
      const L = .36, statics: Spec[] = [];
      for (const phase of [0, Math.PI]) {
        const pts: V3[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, a = t * Math.PI * 10 + phase; return [-L / 2 + .03 + t * (L - .06), Math.cos(a) * .006, Math.sin(a) * .006]; });
        statics.push(S(phase ? "greyPlastic" : "hvOrange", tube(pts, .0035, 80, 6)));
      }
      statics.push(...within(connector(.03, .022, .025, 2, 1), [-L / 2 + .03, 0, 0], [0, -Math.PI / 2, 0]), ...within(connector(.03, .022, .025, 2, 1), [L / 2 - .03, 0, 0], [0, Math.PI / 2, 0]));
      return { statics, anchors: { in: [-L / 2 - .002, 0, 0], out: [L / 2 + .002, 0, 0] } };
    },
  },
  // Three-phase HV cable set: three orange cables with ring lugs.
  hv_cable: {
    ref: "power-battery/hv_cable__REF.png",
    build: () => {
      const statics: Spec[] = [];
      [-.025, 0, .025].forEach((z, i) => {
        statics.push(S("hvOrange", tube([[-.18, 0, z], [-.06, .03 + i * .004, z], [.06, -.02, z], [.18, 0, z]], .009, 32, 10)));
        for (const x of [-.19, .19]) statics.push(S("copper", cylX(.008, .02, 12), [x, 0, z]), S("copper", cyl(.012, .004, 16), [x + Math.sign(x) * .018, 0, z]));
      });
      return { statics, anchors: { in: [-.21, 0, 0], out: [.21, 0, 0] } };
    },
  },
  // Steering torque sensor: ring housing around the input shaft with a side connector.
  steering_torque_sensor: {
    ref: "sensors/steering_torque_sensor__REF.png",
    build: () => ({
      statics: [
        S("steel", cylX(.012, .16, 20)),
        S("plastic", cylX(.04, .04, 32)),
        S("castAl", cylX(.044, .008, 32), [-.022, 0, 0]),
        S("castAl", cylX(.044, .008, 32), [.022, 0, 0]),
        ...within(connector(.022, .016, .016, 3, 1), [0, .04, 0], [-Math.PI / 2, 0, 0]),
      ],
      anchors: { in: [-.08, 0, 0], out: [0, .058, 0] },
    }),
  },
  // Steering column: tilted tube with a universal joint at the bottom.
  steering_column: {
    ref: "HMI/steering_column__REF.png",
    build: () => ({
      statics: [
        S("gunmetal", cylX(.022, .3, 20), [0, 0, 0], [0, 0, -.35]),
        S("castAl", rbox(.07, .06, .06, .01), [.06, -.02, 0], [0, 0, -.35]),
        S("steel", cylX(.012, .1, 16), [-.19, .07, 0], [0, 0, -.35]),
        S("steel", sphere(.018, 12), [.16, -.06, 0]),
        S("steel", cylX(.012, .1, 16), [.22, -.06, 0]),
      ],
      anchors: { in: [-.24, .09, 0], out: [.27, -.06, 0] },
    }),
  },
  // IMU (yaw rate + acceleration) module: small housing with ear and connector.
  imu_sensor: {
    ref: "sensors/imu_sensor__CUT.png",
    build: () => ({
      statics: [
        S("plastic", rbox(.07, .025, .06, .006), [0, .0125, 0]),
        S("castAl", ear(.025, .02, .004, .004), [.035, .002, 0], [0, Math.PI / 2, 0]),
        ...within(connector(.026, .016, .016, 4, 1), [-.02, .014, .03]),
      ],
      anchors: { in: [0, .03, 0], out: [-.02, .014, .048] },
    }),
  },
  // Cell monitoring board: PCB with chips, cell-tap connectors and stand-offs.
  cell_monitor_board: {
    ref: "ecu/cell_monitor_board__CUT.png",
    build: () => {
      const statics: Spec[] = [S("pcb", box(.16, .003, .1), [0, .012, 0])];
      for (const [x, z] of [[-.07, -.04], [.07, -.04], [-.07, .04], [.07, .04]] as [number, number][]) statics.push(S("steel", cyl(.004, .012, 8), [x, .006, z]));
      for (let i = 0; i < 4; i++) statics.push(S("plastic", box(.02, .003, .02), [-.045 + i * .03, .015, -.01]));
      statics.push(...within(connector(.05, .012, .014, 8, 1, "nylon"), [-.02, .02, .045]), ...within(connector(.026, .012, .014, 2, 1), [.05, .02, .045]));
      return { statics, anchors: { in: [-.02, .02, .062], out: [.05, .02, .062] } };
    },
  },
  // HV junction box: cast box with orange HV connectors on the front.
  hv_junction_box: {
    ref: "power-battery/hv_junction_box__REF.png",
    build: () => ({
      statics: [
        S("castAl", rbox(.24, .09, .16, .01), [0, .045, 0]),
        ...[-.07, 0, .07].flatMap(x => within(connector(.05, .04, .03, 2, 1, "hvOrange"), [x, .045, .08])),
        ...[-1, 1].flatMap(sx => [-1, 1].map(sz => S("steel", screwHead(.005), [sx * .1, .092, sz * .065]))),
      ],
      anchors: { in: [-.07, .045, .112], out: [.07, .045, .112] },
    }),
  },
  // Combined charging inlet (CCS-style): AC pin face over two DC pins, hinged flap.
  charging_port: {
    ref: "charging/charging_port__REF.png",
    build: () => {
      const statics: Spec[] = [
        S("plastic", rbox(.11, .13, .03, .008), [0, 0, 0]),
        S("rubber", cylZ(.034, .012, 32), [0, .025, .018]),
        S("rubber", rbox(.07, .03, .012, .012), [0, -.035, .018]),
      ];
      for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI * 2, r = i === 6 ? 0 : .018; statics.push(S("plastic", cylZ(.005, .008, 10), [Math.cos(a) * r, .025 + Math.sin(a) * r, .024])); }
      for (const x of [-.018, .018]) statics.push(S("steel", cylZ(.007, .01, 12), [x, -.035, .024]));
      for (const [x, y] of [[-.045, .055], [.045, .055], [-.045, -.055], [.045, -.055]] as [number, number][]) statics.push(S("steel", screwHead(.004).rotateX(Math.PI / 2), [x, y, .016]));
      statics.push(S("hvOrange", tube([[.04, -.06, -.015], [.06, -.08, -.04], [.08, -.08, -.08]], .008, 16)));
      const flap: Spec[] = [S("plastic", rbox(.1, .12, .008, .006), [-.05, 0, 0]), S("rubber", rbox(.08, .1, .002, .004), [-.05, 0, .005])];
      return { statics, moving: [{ name: "flap", pivot: [-.056, 0, .02], axis: "y", mode: "rotate", range: 1.6, specs: within(flap, [0, 0, 0]) }], anchors: { in: [0, .025, .03], out: [.08, -.08, -.08] } };
    },
  },
  // On-board charger: finned cast housing, AC (black) and HV DC (orange) connectors, coolant pipes.
  obc: {
    ref: "charging/obc__REF.png",
    build: () => {
      const w = .26, h = .07, d = .2;
      return {
        statics: [
          ...finnedHousing(w, h, d, 16),
          ...within(connector(.05, .04, .02, 3, 1), [-.07, .035, d / 2]),
          ...within(connector(.05, .04, .02, 2, 1, "hvOrange"), [.03, .035, d / 2]),
          ...[-.02, .0].map(x => S("steel", cylZ(.006, .05, 12), [x - .09, .015, d / 2 + .02])),
        ],
        anchors: { in: [-.07, .035, d / 2 + .022], out: [.03, .035, d / 2 + .022] },
      };
    },
  },
  // DC/DC converter: smaller finned housing with HV input and 12 V output stud.
  dcdc_converter: {
    ref: "power-battery/dcdc_converter__REF.png",
    build: () => {
      const w = .2, h = .06, d = .15;
      return {
        statics: [
          ...finnedHousing(w, h, d, 12),
          ...within(connector(.04, .032, .02, 2, 1, "hvOrange"), [-.05, .03, d / 2]),
          S("copper", cylZ(.008, .025, 12), [.05, .03, d / 2 + .012]),
          S("rubber", cylZ(.014, .01, 16), [.05, .03, d / 2 + .004]),
        ],
        anchors: { in: [-.05, .03, d / 2 + .022], out: [.05, .03, d / 2 + .026] },
      };
    },
  },
  // 12 V auxiliary battery: box with lid and two terminals.
  lv_battery: {
    ref: "power-battery/lv_battery__REF.png",
    build: () => ({
      statics: [
        S("plastic", rbox(.24, .17, .17, .008), [0, .085, 0]),
        S("greyPlastic", rbox(.245, .02, .175, .006), [0, .175, 0]),
        S("steel", cyl(.009, .02, 14), [-.08, .19, .04]),
        S("steel", cyl(.009, .02, 14), [.08, .19, .04]),
        S("wireRed", cyl(.014, .006, 14), [-.08, .186, .04]),
      ],
      anchors: { in: [-.08, .2, .04], out: [.08, .2, .04] },
    }),
  },
  // Instrument cluster: curved housing with a lit display.
  instrument_cluster: {
    ref: "HMI/instrument_cluster__CUT.png",
    build: () => ({
      statics: [
        S("plastic", rbox(.3, .12, .05, .015), [0, .06, 0]),
        S("led", box(.27, .095, .002), [0, .06, .026]),
        S("plastic", rbox(.32, .025, .07, .01), [0, .125, .01]),
        ...within(connector(.03, .02, .016, 4, 1), [0, .06, -.04], [0, Math.PI, 0]),
      ],
      anchors: { in: [0, .06, -.058], out: [0, .06, .03] },
    }),
  },
  // Generic small ECU (Park ECU, Chassis ECU): plastic housing, metal base, one connector.
  generic_ecu: {
    ref: "ecu/gateway__CUT.png",
    build: () => ({
      statics: [
        S("castAl", rbox(.14, .012, .11, .003), [0, .006, 0]),
        S("plastic", rbox(.13, .03, .1, .006), [0, .027, 0]),
        ...within(connector(.06, .024, .016, 6, 2), [0, .022, .05]),
        ...[-1, 1].flatMap(sx => [-1, 1].map(sz => S("castAl", ear(.016, .014, .004, .003), [sx * .072, .002, sz * .035], [0, sx * Math.PI / 2, 0]))),
      ],
      anchors: { in: [-.02, .022, .068], out: [.02, .022, .068] },
    }),
  },
  // Hall-type position sensor with pigtail (park position).
  position_sensor: {
    ref: "sensors/rotor_position_sensor__REF.png",
    build: () => ({
      statics: [
        S("plastic", cyl(.014, .04, 16), [0, .02, 0]),
        S("castAl", ear(.02, .018, .004, .003), [0, .03, .01], [0, 0, 0]),
        S("rubber", tube([[0, .04, 0], [0, .07, .02], [.04, .08, .04]], .0035, 16)),
        ...within(connector(.02, .014, .014, 3, 1), [.04, .08, .04], [0, Math.PI / 2, 0]),
      ],
      anchors: { in: [0, 0, 0], out: [.056, .08, .04] },
    }),
  },
  // Ride-height sensor: body with a lever arm and link rod.
  height_sensor: {
    ref: "sensors/steering_angle_sensor__REF.png",
    build: () => ({
      statics: [
        S("plastic", rbox(.05, .04, .03, .006), [0, .02, 0]),
        S("steel", box(.08, .006, .01), [.04, .03, .018]),
        S("steel", cyl(.003, .07, 8), [.08, -.005, .018]),
        S("rubber", sphere(.006, 8), [.08, -.04, .018]),
        ...within(connector(.02, .014, .014, 3, 1), [-.025, .02, 0], [0, -Math.PI / 2, 0]),
      ],
      anchors: { in: [.08, -.04, .018], out: [-.043, .02, 0] },
    }),
  },
  // Electric coolant valve: body with three hose necks and an actuator head with connector.
  coolant_valve: {
    ref: "thermal/coolant_valve__REF.png",
    build: () => ({
      statics: [
        S("plastic", cyl(.035, .06, 24), [0, .03, 0]),
        S("plastic", rbox(.075, .045, .07, .01), [0, .085, 0]),
        S("plastic", cylX(.012, .05, 16), [-.05, .03, 0]),
        S("plastic", cylX(.012, .05, 16), [.05, .03, 0]),
        S("plastic", cyl(.012, .04, 16), [0, -.02, .02], [.6, 0, 0]),
        ...within(connector(.024, .016, .016, 3, 1), [.03, .095, .02], [0, Math.PI / 2, 0]),
      ],
      anchors: { in: [-.075, .03, 0], out: [.075, .03, 0] },
    }),
  },
  // Radiator: finned aluminium core between two plastic tanks, hose necks top-left / bottom-right.
  radiator: {
    ref: "thermal/radiator__REF.png",
    build: () => {
      const W = .5, H = .34, statics: Spec[] = [S("castAl", box(W, H, .025))];
      for (let i = 0; i < 18; i++) statics.push(S("steel", box(W, .003, .027), [0, -H / 2 + .01 + i * (H - .02) / 17, 0]));
      for (const x of [-1, 1]) statics.push(S("plastic", rbox(.04, H + .02, .04, .01), [x * (W / 2 + .02), 0, 0]));
      statics.push(S("plastic", cylX(.016, .05, 16), [-W / 2 - .06, H / 2 - .04, 0]), S("plastic", cylX(.016, .05, 16), [W / 2 + .06, -H / 2 + .04, 0]));
      return { statics, anchors: { in: [-W / 2 - .085, H / 2 - .04, 0], out: [W / 2 + .085, -H / 2 + .04, 0] } };
    },
  },
  // Coil spring: steel helix.
  coil_spring: {
    ref: "steering-suspension/coil_spring__REF.png",
    build: () => {
      const pts: V3[] = Array.from({ length: 121 }, (_, i) => { const t = i / 120, a = t * Math.PI * 2 * 6; return [Math.cos(a) * .055, t * .26, Math.sin(a) * .055]; });
      return { statics: [S("steel", tube(pts, .008, 240, 8))], anchors: { in: [0, 0, 0], out: [0, .26, 0] } };
    },
  },
  // Damper: body tube, piston rod, eyes at both ends and an electronic valve connector.
  damper: {
    ref: "steering-suspension/damper__REF.png",
    build: () => ({
      statics: [
        S("gunmetal", cyl(.024, .2, 20), [0, .12, 0]),
        S("steel", cyl(.009, .12, 14), [0, .28, 0]),
        S("steel", torusZ(.014, .005, 16), [0, .35, 0]),
        S("steel", torusZ(.016, .006, 16), [0, .006, 0]),
        S("castAl", rbox(.03, .03, .03, .005), [.03, .08, 0]),
        ...within(connector(.02, .014, .014, 2, 1), [.045, .08, 0], [0, Math.PI / 2, 0]),
      ],
      anchors: { in: [.06, .08, 0], out: [0, .36, 0] },
    }),
  },
  // ── Garage additions (images in intake/images/garage-additions) ──
  // Insulation monitor: black sealed box on an aluminium base with four ears,
  // orange two-pole HV sense connector and a black six-pin signal connector on the front.
  isolation_monitor: {
    ref: "garage-additions/isolation_monitor__REF.png",
    build: () => ({
      statics: [
        S("castAl", rbox(.13, .008, .105, .003), [0, .004, 0]),
        ...[-1, 1].flatMap(sx => [-1, 1].map(sz => S("castAl", ear(.016, .016, .006, .0035), [sx * .065, .003, sz * .03], [0, sx * Math.PI / 2, 0]))),
        S("plastic", rbox(.11, .045, .09, .008), [0, .0305, 0]),
        S("plastic", rbox(.09, .006, .07, .004), [0, .055, -.005]),
        ...[-1, 1].flatMap(sx => [-1, 1].map(sz => S("steel", screwHead(.0035), [sx * .049, .054, sz * .039]))),
        ...within(connector(.036, .034, .022, 2, 1, "hvOrange"), [-.028, .03, .045]),
        ...within(connector(.026, .022, .016, 3, 2), [.024, .026, .045]),
      ],
      anchors: { in: [-.028, .03, .069], out: [.024, .026, .063] },
    }),
  },
  // Park ECU: black lidded housing on an aluminium plate with two diagonal ears, one 2×10 connector.
  park_ecu: {
    ref: "garage-additions/park_ecu__REF.png",
    build: () => ({
      statics: [
        S("castAl", rbox(.13, .01, .11, .004), [0, .005, 0]),
        S("castAl", ear(.022, .02, .01, .004), [-.07, .005, .03], [0, -Math.PI / 2, 0]),
        S("castAl", ear(.022, .02, .01, .004), [.07, .005, -.03], [0, Math.PI / 2, 0]),
        S("plastic", rbox(.115, .04, .095, .008), [0, .03, 0]),
        S("plastic", rbox(.08, .005, .065, .004), [0, .052, -.008]),
        ...[-1, 1].flatMap(sx => [-1, 1].map(sz => S("steel", screwHead(.0035), [sx * .05, .051, sz * .041]))),
        ...within(connector(.06, .028, .02, 10, 2), [0, .026, .047]),
      ],
      anchors: { in: [-.02, .026, .069], out: [.02, .026, .069] },
    }),
  },
  // Chassis ECU: finned cast aluminium housing with a large and a small connector.
  chassis_ecu: {
    ref: "garage-additions/chassis_ecu__REF.png",
    build: () => {
      const w = .16, h = .045, d = .13;
      return {
        statics: [
          ...finnedHousing(w, h, d, 10),
          ...within(connector(.062, .03, .02, 9, 2), [-.03, .022, d / 2]),
          ...within(connector(.038, .026, .018, 5, 2), [.04, .022, d / 2]),
        ],
        anchors: { in: [-.03, .022, d / 2 + .022], out: [.04, .022, d / 2 + .02] },
      };
    },
  },
  // Parking lock actuator: motor can on a cast gearbox, sealed connector on top,
  // output shaft with a lever that swings when the lock engages.
  park_lock_actuator: {
    ref: "garage-additions/park_lock_actuator__REF.png",
    build: () => {
      const pivot: V3 = [.01, -.005, .052];
      const lever: Spec[] = [
        S("castAl", rbox(.016, .07, .006, .003), [.01 + .016, -.005 - .03, .058], [0, 0, .5]),
        S("steel", cylZ(.006, .01, 14), [pivot[0], pivot[1], .06]),
        S("steel", cylZ(.004, .008, 10), [.044, -.063, .06]),
      ];
      return {
        statics: [
          S("steel", cylX(.03, .075, 28), [-.07, 0, 0]),
          S("plastic", cylX(.024, .012, 24), [-.112, 0, 0]),
          S("castAl", cylX(.033, .008, 28), [-.03, 0, 0]),
          S("castAl", rbox(.07, .08, .06, .012), [.01, 0, 0]),
          S("castAl", cylZ(.03, .02, 28), [.01, -.005, .036]),
          S("rubber", cylZ(.013, .006, 20), pivot),
          ...[[-.02, .03], [.035, .03], [-.02, -.035]].map(([x, y]) => S("steel", screwHead(.004).rotateX(Math.PI / 2), [x, y, .031])),
          S("castAl", ear(.022, .02, .008, .004), [.045, -.025, 0], [Math.PI / 2, 0, -Math.PI / 2]),
          S("castAl", ear(.022, .02, .008, .004), [-.025, -.04, 0], [Math.PI / 2, 0, Math.PI]),
          ...within(connector(.022, .018, .018, 3, 1), [-.005, .04, 0], [-Math.PI / 2, 0, 0]),
        ],
        moving: [{ name: "lever", pivot, axis: "z", mode: "press", range: .6, specs: lever }],
        anchors: { in: [-.005, .06, 0], out: [.044, -.063, .066] },
      };
    },
  },
  // Park position sensor: round Hall sensor with one bushed ear, pigtail and a three-pin plug.
  park_position_sensor: {
    ref: "garage-additions/park_position_sensor__REF.png",
    build: () => ({
      statics: [
        S("plastic", cyl(.017, .03, 24), [0, .015, 0]),
        S("plastic", cyl(.019, .006, 24), [0, .028, 0]),
        S("plastic", cyl(.013, .008, 24), [0, .035, 0]),
        S("plastic", ear(.03, .018, .006, .005), [0, .022, 0], [0, Math.PI * .75, 0]),
        S("steel", cyl(.005, .007, 12), [-.017, .022, .017]),
        S("plastic", rbox(.014, .012, .016, .003), [.014, .028, -.012]),
        S("rubber", tube([[.018, .03, -.018], [.05, .045, -.03], [.075, .035, 0], [.07, .02, .03]], .004, 24)),
        S("wireRed", cylZ(.0012, .012, 6), [.067, .02, .036]),
        S("hvOrange", cylZ(.0012, .012, 6), [.072, .02, .036]),
        ...within(connector(.022, .016, .018, 3, 1), [.07, .02, .042]),
      ],
      anchors: { in: [0, 0, 0], out: [.07, .02, .062] },
    }),
  },
  // Ride-height sensor: body bolted to the body (shaft toward the viewer), lever arm and
  // a vertical link rod with ball joints down to the control arm. The arm turns with ride height.
  ride_height_sensor: {
    ref: "garage-additions/ride_height_sensor__REF.png",
    build: () => {
      const pivot: V3 = [0, .012, .03];
      const arm: Spec[] = [
        S("plastic", rbox(.12, .014, .008, .003), [.06, .012, .034]),
        S("plastic", cylZ(.009, .012, 18), [.12, .012, .036]),
        S("steel", cylZ(.004, .004, 12), [.12, .012, .043]),
        S("steel", cyl(.0035, .07, 10), [.12, -.026, .042]),
        S("steel", cyl(.005, .006, 6), [.12, -.002, .042]),
        S("steel", cyl(.005, .006, 6), [.12, -.052, .042]),
        S("plastic", cylZ(.009, .012, 18), [.12, -.066, .042]),
        S("steel", cylZ(.004, .004, 12), [.12, -.066, .049]),
      ];
      return {
        statics: [
          S("plastic", rbox(.06, .05, .012, .004), [0, 0, .006]),
          ...[-1, 1].map(sx => S("plastic", cylZ(.011, .012, 18), [sx * .036, -.012, .006])),
          ...[-1, 1].map(sx => S("steel", cylZ(.005, .013, 12), [sx * .036, -.012, .006])),
          S("plastic", cylZ(.019, .016, 24), [0, pivot[1], .02]),
          S("plastic", cylZ(.016, .01, 24), pivot),
          S("steel", cylZ(.006, .004, 14), [0, pivot[1], .036]),
          ...within(connector(.022, .016, .016, 3, 1), [-.026, -.012, .012], [0, -Math.PI / 2, 0]),
        ],
        moving: [{ name: "arm", pivot, axis: "z", mode: "press", range: .35, specs: arm }],
        anchors: { in: [.12, -.066, .05], out: [-.044, -.012, .012] },
      };
    },
  },
  // Air spring: steel top plate with studs and an air fitting, rolling rubber bellows, piston and lower eye.
  air_spring: {
    ref: "garage-additions/air_spring__REF.png",
    build: () => {
      const prof: [number, number][] = [[0, .04], [.048, .04], [.058, .055]];
      for (let i = 0; i < 14; i++) prof.push([i % 2 ? .06 : .057, .062 + i * .009]);
      prof.push([.064, .19], [.066, .215], [.063, .238], [.058, .25], [0, .25]);
      return {
        statics: [
          S("rubber", new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 32)),
          S("rubber", torusZ(.06, .004, 32).rotateX(Math.PI / 2), [0, .25, 0]),
          S("steel", cyl(.06, .008, 32), [0, .256, 0]),
          ...[[-.03, -.02], [.0, .035], [.02, -.01]].map(([x, z]) => S("steel", cyl(.0035, .03, 8), [x, .275, z])),
          S("castAl", cyl(.008, .008, 12), [.035, .264, .015]),
          S("copper", cyl(.005, .01, 6), [.035, .272, .015]),
          S("plastic", cylX(.005, .018, 10), [.044, .282, .015]),
          S("coolant", cylX(.006, .005, 12), [.055, .282, .015]),
          S("plastic", cyl(.045, .035, 28), [0, .02, 0]),
          S("castAl", box(.022, .02, .02), [0, -.008, 0]),
          S("rubber", cylZ(.014, .018, 20), [0, -.024, 0]),
          S("steel", cylZ(.006, .02, 12), [0, -.024, 0]),
        ],
        anchors: { in: [.058, .282, .015], out: [0, -.038, 0] },
      };
    },
  },
  // Air suspension compressor: finned compressor head, motor can, dryer on top, solenoid valve block,
  // all on a black plate with rubber mounts.
  air_compressor: {
    ref: "garage-additions/air_compressor__REF.png",
    build: () => {
      const statics: Spec[] = [
        S("plastic", box(.2, .008, .1), [0, .03, 0]),
        ...[-1, 1].flatMap(sx => [-1, 1].map(sz => S("rubber", cyl(.012, .022, 16), [sx * .085, .013, sz * .04]))),
        ...[-1, 1].flatMap(sx => [-1, 1].map(sz => S("steel", cyl(.005, .008, 6), [sx * .085, .036, sz * .04]))),
        S("steel", cylX(.04, .09, 28), [.015, .08, 0]),
        S("plastic", cylX(.042, .01, 28), [-.03, .08, 0]),
        S("plastic", cylX(.036, .012, 28), [.064, .08, 0]),
        S("castAl", rbox(.055, .09, .08, .008), [-.06, .08, 0]),
        S("castAl", cylX(.026, .006, 24), [-.09, .07, 0]),
        S("castAl", rbox(.05, .02, .07, .005), [-.06, .135, 0]),
        S("plastic", rbox(.08, .04, .05, .006), [-.005, .14, 0]),
        S("castAl", box(.06, .024, .03), [.08, .155, -.015]),
        S("plastic", box(.012, .06, .03), [.08, .11, -.025]),
        S("rubber", tube([[-.04, .16, .0], [-.03, .2, .0], [.03, .2, .0], [.05, .16, -.01]], .004, 24)),
        S("rubber", tube([[.11, .155, -.015], [.13, .14, .0], [.12, .1, .01], [.09, .08, .01]], .003, 20)),
        ...within(connector(.022, .018, .016, 2, 2), [.07, .08, 0], [0, Math.PI / 2, 0]),
      ];
      for (let i = 0; i < 4; i++) statics.push(S("castAl", box(.05, .004, .082), [-.06, .05 + i * .016, 0]));
      for (let i = 0; i < 3; i++) {
        statics.push(S("plastic", rbox(.016, .022, .018, .003), [.062 + i * .018, .178, -.015]));
        statics.push(S("copper", cyl(.005, .006, 10), [.062 + i * .018, .166, -.015]));
      }
      return { statics, anchors: { in: [.088, .08, 0], out: [.11, .155, -.015] } };
    },
  },
  // Electronically controlled damper (CDC): black body with steel bands, side solenoid valve and
  // connector, piston rod and eyes. The rod moves in and out with the input.
  cdc_damper: {
    ref: "garage-additions/cdc_damper__REF.png",
    build: () => {
      const eye = (y: number): Spec[] => [
        S("plastic", cylZ(.017, .02, 22), [0, y, 0]),
        S("steel", cylZ(.008, .022, 14), [0, y, 0]),
      ];
      return {
        statics: [
          S("plastic", cyl(.026, .17, 28), [0, .12, 0]),
          S("steel", cyl(.0265, .008, 28), [0, .19, 0]),
          S("steel", cyl(.0265, .008, 28), [0, .055, 0]),
          S("plastic", cyl(.024, .008, 28), [0, .208, 0]),
          S("plastic", cyl(.012, .012, 16), [0, .03, 0]),
          ...eye(.012),
          S("plastic", box(.012, .05, .02), [.03, .11, 0]),
          S("castAl", cyl(.012, .018, 20), [.042, .125, 0]),
          S("steel", cyl(.005, .008, 6), [.042, .138, 0]),
          S("plastic", rbox(.02, .03, .02, .004), [.042, .105, 0]),
          ...within(connector(.018, .014, .014, 2, 1), [.052, .1, 0], [0, Math.PI / 2, 0]),
        ],
        moving: [{ name: "rod", pivot: [0, .212, 0], axis: "y", mode: "push", range: .03, specs: [
          S("steel", cyl(.009, .09, 16), [0, .255, 0]),
          S("plastic", cyl(.012, .008, 16), [0, .298, 0]),
          ...eye(.315),
        ] }],
        anchors: { in: [.066, .1, 0], out: [0, .33, 0] },
      };
    },
  },
  // EPS power pack: steering motor can with its controller/inverter housing built onto the end.
  eps_power_pack: {
    ref: "garage-additions/eps_power_pack__REF.png",
    build: () => {
      const statics: Spec[] = [
        S("castAl", cylX(.05, .1, 32), [-.07, 0, 0]),
        S("castAl", cylX(.046, .01, 32), [-.125, 0, 0]),
        S("steel", cylX(.01, .02, 14), [-.14, 0, 0]),
        S("rubber", cylX(.051, .006, 32), [-.02, 0, 0]),
        S("castAl", rbox(.08, .1, .1, .01), [.025, 0, 0]),
        S("castAl", ear(.02, .02, .01, .005), [-.005, .05, 0], [Math.PI / 2, 0, 0]),
        S("castAl", ear(.02, .02, .01, .005), [-.04, -.05, .02], [-Math.PI / 2, 0, 0]),
        ...[-1, 1].flatMap(sy => [-1, 1].map(sz => S("steel", screwHead(.0035).rotateZ(Math.PI / 2), [.066, sy * .042, sz * .042]))),
        ...within(connector(.03, .028, .02, 2, 1), [.065, .022, .0], [0, Math.PI / 2, 0]),
        S("hvOrange", box(.002, .012, .02), [.0865, .022, 0]),
        ...within(connector(.028, .022, .018, 4, 2), [.065, -.024, .0], [0, Math.PI / 2, 0]),
      ];
      for (let i = 0; i < 5; i++) statics.push(S("castAl", box(.07, .004, .07), [.025, .052, -.03 + i * .015]));
      return { statics, anchors: { in: [.085, -.024, 0], out: [-.15, 0, 0] } };
    },
  },

  // Brake line: bent steel tube from the modulator to the caliper hose, flare nuts and a clip bracket.
  brake_line: {
    ref: "brake/brake_line__CUT.png",
    build: () => {
      const path: V3[] = [[0, 0, 0], [.06, 0, 0], [.12, -.02, .03], [.2, -.06, .03], [.28, -.06, -.02], [.36, -.1, -.02], [.42, -.16, .02]];
      return {
        statics: [
          S("steel", tube(path, .0035, 64, 8)),
          S("gunmetal", cylX(.007, .014, 6), [.004, 0, 0]),
          S("gunmetal", cyl(.007, .014, 6).rotateZ(.6), [.418, -.152, .02]),
          S("plastic", rbox(.022, .012, .02, .003), [.2, -.065, .03]),
          S("steel", cyl(.0075, .02, 12).rotateZ(.6), [.43, -.17, .02]),
          S("rubber", tube([[.44, -.18, .02], [.52, -.24, .03], [.54, -.34, .04], [.5, -.43, .04], [.43, -.46, .04]], .007, 40)),
          S("steel", cylX(.0075, .03, 12), [.415, -.46, .04]),
          S("steel", torusZ(.012, .005, 20), [.388, -.46, .04]),
        ],
        anchors: { in: [0, 0, 0], out: [.388, -.46, .04] },
      };
    },
  },

  // Body corner: a piece of floor pan and sill where the suspension pushes on the body.
  body_shell: {
    ref: "steering-suspension/strut_assembly__REF.png",
    build: () => ({
      statics: [
        S("greyPlastic", rbox(.4, .04, .26, .01), [0, .02, 0]),
        S("greyPlastic", rbox(.4, .1, .04, .01), [0, .07, -.11]),
        S("castAl", cyl(.05, .03, 24), [.12, .055, .04]),
      ],
      anchors: { in: [.12, .07, .04], out: [-.2, .05, 0] },
    }),
  },

};

/** Parts modelled so far, in build order. */
export const PART_MODEL_IDS = Object.keys(DEFS);
/** Garage-only parts (not simulation components). Their anchors are "in" / "out". */
export const VISUAL_ONLY_IDS = ["can_harness", "hv_cable", "steering_torque_sensor", "steering_column", "imu_sensor", "cell_monitor_board", "hv_junction_box", "charging_port", "obc", "dcdc_converter", "lv_battery", "instrument_cluster", "generic_ecu", "park_lock_actuator", "position_sensor", "height_sensor", "coolant_valve", "radiator", "coil_spring", "damper", "air_spring", "air_compressor", "body_shell", "isolation_monitor", "park_ecu", "chassis_ecu", "park_position_sensor", "ride_height_sensor", "cdc_damper", "eps_power_pack", "brake_line"];

const cache = new Map<string, PartModel>();

export function hasPartModel(id: string) { return id in DEFS; }

export function getPartModel(id: string): PartModel {
  const hit = cache.get(id);
  if (hit) return hit;
  const def = DEFS[id];
  if (!def) throw new Error(`No 3D part model for "${id}"`);
  const built = def.build();
  const geometries = bakeByKey(built.statics);
  const moving: MovingGroup[] = (built.moving ?? []).map(({ specs, ...rest }) => ({
    ...rest,
    // Specs are written in part space; shift them so the group rotates about its pivot.
    geometries: bakeByKey(within(specs, [-rest.pivot[0], -rest.pivot[1], -rest.pivot[2]])),
  }));
  const bounds = new THREE.Box3();
  for (const g of [...Object.values(geometries), ...moving.flatMap(m => Object.values(m.geometries).map(x => x!.clone().translate(...m.pivot)))]) {
    g!.computeBoundingBox();
    bounds.union(g!.boundingBox!);
  }
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const model: PartModel = { id, ref: def.ref, size: [size.x, size.y, size.z], center: [center.x, center.y, center.z], geometries, moving, anchors: built.anchors };
  cache.set(id, model);
  return model;
}

/** Triangle count of a model (static + moving), for the poly budget. */
export function partTriangles(model: PartModel) {
  const count = (g?: THREE.BufferGeometry) => (g ? g.attributes.position.count / 3 : 0);
  return Object.values(model.geometries).reduce((sum, g) => sum + count(g), 0)
    + model.moving.reduce((sum, m) => sum + Object.values(m.geometries).reduce((s, g) => s + count(g), 0), 0);
}
