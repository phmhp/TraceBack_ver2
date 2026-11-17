// Hero car body: a lofted single mesh (open cockpit, wheel arches) plus shared dimensions.
// Pure geometry code so it can be unit-tested without a renderer.
import * as THREE from "three";

export const CAR_DIMENSIONS = {
  frontAxleZ: -1.18, rearAxleZ: 1.16, wheelX: .745, wheelRadius: .34, tireWidth: .25,
  cockpitHalfWidth: .62, seatX: .31, length: 3.95, width: 1.8,
};
const D = CAR_DIMENSIONS;

// ───────────────────────── Body loft ─────────────────────────
type BodyKey = { z: number; w: number; h: number; y0: number };
// Half-width, beltline height and sill height along the car (front → rear).
const BODY_KEYS: BodyKey[] = [
  { z: -1.98, w: .5, h: .56, y0: .4 },
  { z: -1.9, w: .74, h: .66, y0: .33 },
  { z: -1.72, w: .85, h: .74, y0: .29 },
  { z: -1.4, w: .885, h: .8, y0: .27 },
  { z: -.6, w: .9, h: .85, y0: .25 },
  { z: .6, w: .9, h: .86, y0: .25 },
  { z: 1.45, w: .885, h: .84, y0: .27 },
  { z: 1.74, w: .85, h: .8, y0: .3 },
  { z: 1.9, w: .76, h: .74, y0: .35 },
  { z: 1.97, w: .56, h: .66, y0: .42 },
];
const smoothstep = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  .5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

function section(z: number) {
  const keys = BODY_KEYS;
  let i = keys.findIndex((key, index) => index < keys.length - 1 && z <= keys[index + 1].z);
  if (i < 0) i = keys.length - 2;
  const k = (n: number) => keys[THREE.MathUtils.clamp(n, 0, keys.length - 1)];
  const t = THREE.MathUtils.clamp((z - k(i).z) / (k(i + 1).z - k(i).z), 0, 1);
  const pick = (field: keyof BodyKey) => catmull(k(i - 1)[field], k(i)[field], k(i + 1)[field], k(i + 2)[field], t);
  let w = pick("w"), h = pick("h"), y0 = pick("y0");
  for (const axle of [D.frontAxleZ, D.rearAxleZ]) {
    const dz = z - axle;
    const fender = Math.max(0, 1 - (dz / .62) ** 2);
    h += .035 * fender; w += .012 * fender;
    const archHalf = .47;
    if (Math.abs(dz) < archHalf) y0 = Math.max(y0, .25 + .52 * Math.sqrt(1 - (dz / archHalf) ** 2));
  }
  const d = .4 * smoothstep(-.53, -.41, z) * (1 - smoothstep(.7, .82, z)); // open cockpit depth
  return { w, h, y0, d };
}

type ProfilePoint = { x: number; y: number; tag: 0 | 1 | 2 }; // 0 paint, 1 cockpit interior, 2 underbody
function halfProfile(w: number, h: number, y0: number, d: number): ProfilePoint[] {
  const rs = .09, rb = Math.min(.09, (h - y0) * .3), crown = .028, tumble = .03;
  const cw = Math.min(D.cockpitHalfWidth, (w - rs) * .72);
  const deck = (x: number) => h + crown * (1 - (x / w) ** 2);
  const sx = w - tumble - rs;
  const sideTop = deck(sx) - rs;
  const pts: ProfilePoint[] = [];
  const P = (x: number, y: number, tag: 0 | 1 | 2) => pts.push({ x, y, tag });
  P(0, y0, 2); P((w - rb) * .5, y0, 2); P(w - rb, y0, 2);
  for (let i = 1; i <= 3; i++) { const a = -Math.PI / 2 + i / 3 * Math.PI / 2; P(w - rb + rb * Math.cos(a), y0 + rb + rb * Math.sin(a), 0); }
  for (let i = 1; i <= 4; i++) { const t = i / 4; P(w - tumble * t * t, y0 + rb + (sideTop - y0 - rb) * t, 0); }
  for (let i = 1; i <= 4; i++) { const a = i / 4 * Math.PI / 2; P(sx + rs * Math.cos(a), sideTop + rs * Math.sin(a), 0); }
  for (let i = 1; i <= 4; i++) { const x = sx + (cw + .03 - sx) * i / 4; P(x, deck(x), 0); }
  const dip = Math.min(.03, d);
  P(cw + .008, deck(cw) - dip * .5, 0);
  P(cw, deck(cw) - dip, 1);
  P(cw - .01, deck(cw) - d * .55, 1);
  P(cw - .025, deck(cw) - d, 1);
  for (let i = 1; i <= 3; i++) { const x = (cw - .025) * (1 - i / 3); P(x, deck(x) - d, 1); }
  return pts;
}

let bodyGeometry: THREE.BufferGeometry | undefined;
function buildBodyGeometry() {
  const sections = 120, zStart = -1.98, zEnd = 1.97;
  const positions: number[] = [];
  const tags: number[] = [];
  const depths: number[] = [];
  let ringSize = 0;
  for (let j = 0; j < sections; j++) {
    const z = zStart + (zEnd - zStart) * j / (sections - 1);
    const s = section(z);
    const half = halfProfile(s.w, s.h, s.y0, s.d);
    const ring = [...half, ...half.slice(1, -1).reverse().map(p => ({ ...p, x: -p.x }))];
    ringSize = ring.length;
    if (j === 0) ring.forEach(p => tags.push(p.tag));
    ring.forEach(p => positions.push(p.x, p.y, z));
    depths.push(s.d);
  }
  const paint: number[] = [], interior: number[] = [], under: number[] = [];
  for (let j = 0; j < sections - 1; j++) for (let i = 0; i < ringSize; i++) {
    const i1 = (i + 1) % ringSize;
    const a = j * ringSize + i, b = j * ringSize + i1, c = (j + 1) * ringSize + i, d = (j + 1) * ringSize + i1;
    const tag = Math.max(tags[i], tags[i1]);
    const target = tag === 2 ? under : tag === 1 && Math.max(depths[j], depths[j + 1]) > .012 ? interior : paint;
    target.push(a, b, c, b, d, c);
  }
  // End caps (fan from the ring centroid)
  for (const [j, front] of [[0, true], [sections - 1, false]] as const) {
    let cx = 0, cy = 0;
    for (let i = 0; i < ringSize; i++) { cx += positions[(j * ringSize + i) * 3]; cy += positions[(j * ringSize + i) * 3 + 1]; }
    const center = positions.length / 3;
    positions.push(cx / ringSize, cy / ringSize, positions[j * ringSize * 3 + 2]);
    for (let i = 0; i < ringSize; i++) {
      const a = j * ringSize + i, b = j * ringSize + (i + 1) % ringSize;
      if (front) paint.push(center, b, a); else paint.push(center, a, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex([...paint, ...interior, ...under]);
  geometry.addGroup(0, paint.length, 0);
  geometry.addGroup(paint.length, interior.length, 1);
  geometry.addGroup(paint.length + interior.length, under.length, 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
export const getBodyGeometry = () => (bodyGeometry ??= buildBodyGeometry());

/** Outer side surface x at height y for a given z (used to place trim on the body). */
export function bodySideX(z: number, y: number) {
  const { w, h, y0 } = section(z);
  const rb = Math.min(.09, (h - y0) * .3);
  const top = h + .028 * (1 - ((w - .12) / w) ** 2) - .09;
  const t = THREE.MathUtils.clamp((y - y0 - rb) / (top - y0 - rb), 0, 1);
  return w - .03 * t * t;
}

