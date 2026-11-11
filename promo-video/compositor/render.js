// TraceBack promo compositor — draws one 1920×1080 frame for a given time (seconds).
import { SHOTS, STEPS, CAPTIONS, AI_FLOW, STEP_THUMBS, DURATION } from "./timeline.js";

export const W = 1920, H = 1080;
const C = {
  bg0: "#140e0c", bg1: "#241814", line: "rgba(246,236,223,.07)", cream: "#f6ecdf", soft: "#cdbcae", dim: "#8f7a6d",
  rose: "#e07a6c", roseDeep: "#c2574b", mauve: "#c9a2b2", gold: "#e8b85c", ok: "#6fc39a", bad: "#ef5b4c", cyan: "#86d2dc",
};
const PANEL = { step: { x: 520, y: 152, w: 1312, h: 820 }, full: { x: 96, y: 0, w: 1728, h: 1080 } };
const FONT = (w, s) => `${w} ${s}px Pretendard, "Apple SD Gothic Neo", sans-serif`;
const TITLE_FONT = s => `${s}px TraceRounded, Pretendard, sans-serif`;

// ── clip data and frame cache ─────────────────────────────────────────────
const clips = {};
const cache = new Map();
export async function loadClips() {
  for (const name of [...new Set(SHOTS.filter(s => s.clip).map(s => s.clip).concat(STEP_THUMBS.map(s => s.clip)))]) {
    const c = await (await fetch(`../captures/${name}/clip.json`)).json();
    c.moves = c.events.filter(e => e.type === "move" || e.type === "down" || e.type === "up");
    clips[name] = c;
  }
}
function frameAt(clip, ms) {
  const fr = clips[clip].frames; let lo = 0, hi = fr.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (fr[mid].t <= ms) lo = mid; else hi = mid - 1; }
  return fr[lo].f;
}
async function bitmap(clip, f) {
  const key = clip + "/" + f;
  if (cache.has(key)) { const v = cache.get(key); cache.delete(key); cache.set(key, v); return v; }
  const bmp = await createImageBitmap(await (await fetch(`../captures/${key}`)).blob());
  cache.set(key, bmp);
  if (cache.size > 90) { const [k, v] = cache.entries().next().value; v.close?.(); cache.delete(k); }
  return bmp;
}
export const getClips = () => clips;
export function cursorAt(clip, ms) {
  const mv = clips[clip].moves; let p = null;
  for (const e of mv) { if (e.t > ms) break; p = e; }
  return p ? { x: p.x, y: p.y, down: p.type === "down" || (p.type === "move" && p.down) } : null;
}

// ── easing / helpers ─────────────────────────────────────────────────────
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const easeOut = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const fade = (t, a, b, f = .3) => clamp(Math.min((t - a) / f, (b - t) / f), 0, 1);
function camAt(shot, u) {
  const k = shot.cam; let i = 0; while (i < k.length - 1 && k[i + 1][0] < u) i++;
  if (i === k.length - 1) return k[i].slice(1);
  const [u0, ...a] = k[i], [u1, ...b] = k[i + 1], e = ease(clamp((u - u0) / (u1 - u0), 0, 1));
  const r = a.map((v, j) => v + (b[j] - v) * e);
  const w = clamp(r[2], 300, 1440), h = w / 1.6;
  return [clamp(r[0], w / 2, 1440 - w / 2), clamp(r[1], h / 2, 900 - h / 2), w];
}
const srcMs = (shot, t) => shot.still ? shot.from : shot.from + (t - shot.t) * 1000 * shot.speed;
const shotAt = t => SHOTS.find(s => t >= s.t && t < s.t + s.d) ?? SHOTS[SHOTS.length - 1];
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function text(ctx, s, x, y, font, color, align = "left", spacing = 0) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = spacing ? spacing + "px" : "0px"; ctx.fillText(s, x, y); ctx.letterSpacing = "0px";
}
function lines(ctx, s, x, y, lh, font, color, align = "left") { s.split("\n").forEach((l, i) => text(ctx, l, x, y + i * lh, font, color, align)); }

// ── background: warm dark field + moving signal lines ────────────────────
function background(ctx, t, intensity = 1) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg0);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.line; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
  // three signal traces with travelling pulses (sensor → ECU → CAN → part → vehicle)
  ctx.save(); ctx.globalAlpha = .55 * intensity;
  [[1010, C.rose], [1040, C.mauve], [1066, C.cyan]].forEach(([y, col], i) => {
    ctx.strokeStyle = col; ctx.globalAlpha = .18 * intensity; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= W; x += 8) { const v = y + Math.sin(x / 60 + t * (1.4 + i * .3)) * 4 * (i === 0 ? 1 : .6); x ? ctx.lineTo(x, v) : ctx.moveTo(x, v); }
    ctx.stroke();
    const px = ((t * 380 + i * 520) % (W + 200)) - 100; const pg = ctx.createRadialGradient(px, y, 0, px, y, 60);
    pg.addColorStop(0, col); pg.addColorStop(1, "transparent"); ctx.globalAlpha = .45 * intensity; ctx.fillStyle = pg; ctx.fillRect(px - 60, y - 60, 120, 120);
  });
  ctx.restore();
}

// ── game panel (real gameplay) ───────────────────────────────────────────
async function drawShotInto(ctx, shot, t, box, alpha = 1) {
  const ms = srcMs(shot, t), f = frameAt(shot.clip, ms), bmp = await bitmap(shot.clip, f);
  const u = (t - shot.t) / shot.d, [cx, cy, w] = camAt(shot, u), h = w / 1.6;
  const sx = (cx - w / 2) * 1.5, sy = (cy - h / 2) * 1.5;
  ctx.save(); ctx.globalAlpha = alpha; rr(ctx, box.x, box.y, box.w, box.h, box === PANEL.full ? 0 : 14); ctx.clip();
  ctx.imageSmoothingQuality = "high"; ctx.drawImage(bmp, sx, sy, w * 1.5, h * 1.5, box.x, box.y, box.w, box.h);
  ctx.restore();
  return { map: (x, y) => ({ x: box.x + (x - (cx - w / 2)) / w * box.w, y: box.y + (y - (cy - h / 2)) / h * box.h }), scale: box.w / w, ms };
}
function cursor(ctx, p, down, s = 1) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s * (down ? .9 : 1), s * (down ? .9 : 1));
  ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(13.5, 35); ctx.lineTo(18.5, 32.5); ctx.lineTo(13, 21); ctx.lineTo(23, 21); ctx.closePath();
  ctx.fillStyle = "#fff"; ctx.fill(); ctx.shadowColor = "transparent"; ctx.lineWidth = 2.2; ctx.strokeStyle = "#1c1210"; ctx.stroke(); ctx.restore();
}
function ripple(ctx, p, k, col = C.rose) {
  if (k < 0 || k > 1) return;
  ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = col; ctx.lineWidth = 4 * (1 - k) + 1.5;
  ctx.beginPath(); ctx.arc(p.x, p.y, 10 + 46 * easeOut(k), 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = (1 - k) * .25; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, 10 + 30 * easeOut(k), 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function interactions(ctx, shot, t, view) {
  const c = clips[shot.clip], ms = view.ms, win = 600 * shot.speed;
  // drag trail (STEP03 blocks)
  if (shot.trail) {
    const pts = c.moves.filter(e => e.type === "move" && e.down && e.t <= ms && e.t > ms - Math.max(900, win * 1.5));
    if (pts.length > 1) {
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (let i = 1; i < pts.length; i++) { const a = view.map(pts[i - 1].x, pts[i - 1].y), b = view.map(pts[i].x, pts[i].y), k = i / pts.length;
        ctx.strokeStyle = C.gold; ctx.globalAlpha = .15 + .7 * k; ctx.lineWidth = 3 + 7 * k; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      ctx.restore();
    }
  }
  c.events.filter(e => (e.type === "click" || e.type === "down") && ms >= e.t && ms - e.t < win).forEach(e => ripple(ctx, view.map(e.x, e.y), (ms - e.t) / win));
  const p = cursorAt(shot.clip, ms);
  if (p && !shot.still && !["race", "resume"].includes(shot.clip)) cursor(ctx, view.map(p.x, p.y), p.down, clamp(view.scale * 1.05, .9, 1.6));
}
function focusRing(ctx, view, f, k) {
  if (k <= 0) return;
  const p = view.map(f.x, f.y), r = f.r * view.scale * (1.6 - .6 * easeOut(k));
  ctx.save(); ctx.globalAlpha = clamp(k * 2, 0, 1);
  ctx.fillStyle = "rgba(10,6,5,.45)"; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(p.x, p.y, r, 0, Math.PI * 2, true); ctx.fill("evenodd");
  ctx.strokeStyle = C.bad; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -k * 60; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  if (f.label) { tag(ctx, p.x + r * .7, p.y - r - 18, f.label, C.bad); }
  ctx.restore();
}
function tag(ctx, x, y, s, col, sub) {
  ctx.save(); ctx.font = FONT(800, 24); const w = Math.max(ctx.measureText(s).width, sub ? (ctx.font = FONT(600, 18), ctx.measureText(sub).width) : 0) + 40, h = sub ? 78 : 50;
  x = clamp(x, 40, W - w - 40); y = clamp(y, 40, H - h - 20);
  ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 18; rr(ctx, x, y, w, h, 10); ctx.fillStyle = "rgba(24,15,12,.94)"; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = col; ctx.fillRect(x, y + 10, 5, h - 20);
  text(ctx, s, x + 22, y + 34, FONT(800, 24), C.cream);
  if (sub) text(ctx, sub, x + 22, y + 62, FONT(600, 18), C.soft);
  ctx.restore();
}

// ── left column: step captions ───────────────────────────────────────────
function stepColumn(ctx, step, t, since) {
  const s = STEPS[step], k = easeOut((t - since) / .45), x = 84 - (1 - k) * 30;
  ctx.save(); ctx.globalAlpha = k;
  text(ctx, s.no, x, 228, TITLE_FONT(30), C.rose, "left", 2);
  text(ctx, s.en, x, 264, FONT(800, 17), C.mauve, "left", 3);
  text(ctx, s.name, x, 326, FONT(900, 50), C.cream);
  ctx.fillStyle = C.rose; ctx.fillRect(x, 350, 56, 4);
  lines(ctx, "“" + s.q.replace("\n", "\n ") + "”", x - 6, 412, 48, FONT(800, 36), C.cream);
  let y = 532;
  [["PLAYER ACTION", s.act, C.gold], ["WHY", s.why, C.cyan], ["LEARNING GOAL", s.goal, C.ok]].forEach(([lab, body, col]) => {
    text(ctx, lab, x, y, FONT(800, 15), col, "left", 2.5);
    const bl = body.split("\n"); lines(ctx, body, x, y + 34, 32, FONT(600, 23), C.soft); y += 34 + bl.length * 32 + 40;
  });
  ctx.restore();
}
function topBar(ctx, t, activeStep) {
  text(ctx, "TraceBack", 84, 92, TITLE_FONT(34), C.cream);
  text(ctx, "고장원인 추리 레이싱게임", 290, 90, FONT(600, 17), C.dim);
  const names = ["정비소", "도미노", "퍼즐", "실험 검증"]; let x = 1832;
  for (let i = 3; i >= 0; i--) {
    const on = activeStep === i + 1 || (activeStep === 5 && i === 3), done = activeStep > i + 1;
    ctx.font = FONT(800, 18); const label = `0${i + 1}  ${names[i]}`, w = ctx.measureText(label).width + 36; x -= w;
    rr(ctx, x, 58, w, 44, 22); ctx.fillStyle = on ? C.rose : done ? "rgba(246,236,223,.12)" : "rgba(246,236,223,.05)"; ctx.fill();
    text(ctx, label, x + 18, 87, FONT(800, 18), on ? "#1a100d" : done ? C.cream : C.dim);
    x -= 12;
  }
  text(ctx, "LIVE GAMEPLAY · 실제 게임 플레이 화면", 520, 140, FONT(700, 15), C.dim, "left", 1.5);
}

// ── intro: 4-step structure + AI-assisted process ───────────────────────
async function intro(ctx, t) {
  const u = t - 5.0;
  background(ctx, t, .7);
  text(ctx, "TraceBack", 96, 120, TITLE_FONT(40), C.cream);
  text(ctx, "고장원인 추리 레이싱게임", 330, 117, FONT(600, 19), C.dim);
  if (u < 2.05) {
    const a = fade(u, 0, 2.05, .25);
    ctx.save(); ctx.globalAlpha = a;
    text(ctx, "자동차 시스템과 SW 검증 사고를", 960, 250, FONT(900, 54), C.cream, "center");
    text(ctx, "게임으로 경험하다.", 960, 322, FONT(900, 54), C.rose, "center");
    const cw = 384, gap = 40, x0 = (W - (cw * 4 + gap * 3)) / 2, y0 = 400;
    for (let i = 0; i < 4; i++) {
      const s = STEP_THUMBS[i], k = easeOut((u - .15 - i * .18) / .4); if (k <= 0) continue;
      const x = x0 + i * (cw + gap), y = y0 + (1 - k) * 40; ctx.save(); ctx.globalAlpha = a * k;
      const bmp = await bitmap(s.clip, frameAt(s.clip, s.at)); rr(ctx, x, y, cw, cw / 1.6, 12); ctx.save(); ctx.clip(); ctx.drawImage(bmp, x, y, cw, cw / 1.6); ctx.restore();
      ctx.strokeStyle = "rgba(246,236,223,.25)"; ctx.lineWidth = 2; rr(ctx, x, y, cw, cw / 1.6, 12); ctx.stroke();
      text(ctx, s.label, x, y + cw / 1.6 + 46, TITLE_FONT(24), C.rose, "left", 1);
      text(ctx, s.name, x + 120, y + cw / 1.6 + 46, FONT(900, 28), C.cream);
      text(ctx, s.en, x, y + cw / 1.6 + 82, FONT(600, 20), C.soft);
      if (i < 3) { ctx.strokeStyle = C.rose; ctx.lineWidth = 3; const ax = x + cw + 6, ay = y + cw / 3.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 26, ay); ctx.lineTo(ax + 18, ay - 8); ctx.moveTo(ax + 26, ay); ctx.lineTo(ax + 18, ay + 8); ctx.stroke(); }
      ctx.restore();
    }
    const info = "프로젝트  TraceBack     분야  자동차 시스템 · SW 검증 교육     목적  실무형 검증 사고력 학습";
    text(ctx, info, 960, 900, FONT(700, 22), C.soft, "center", 1);
    ctx.restore();
  } else {
    const v = u - 2.05, a = fade(v, 0, 2.35, .25);
    ctx.save(); ctx.globalAlpha = a;
    text(ctx, "AI-ASSISTED DEVELOPMENT", 960, 236, FONT(800, 20), C.mauve, "center", 4);
    text(ctx, "기획부터 검수까지, AI와 협업하며 완성하다.", 960, 306, FONT(900, 50), C.cream, "center");
    const n = AI_FLOW.length, x0 = 170, x1 = 1750, y = 560, step = (x1 - x0) / (n - 1);
    const prog = clamp(v / 1.5, 0, 1);
    ctx.strokeStyle = "rgba(246,236,223,.18)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.strokeStyle = C.rose; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * prog, y); ctx.stroke();
    // iteration loop back to the start
    const loopK = clamp((v - 1.55) / .5, 0, 1);
    if (loopK > 0) { ctx.save(); ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(x1, y + 40); ctx.bezierCurveTo(x1, y + 40 + 150 * loopK, x0, y + 40 + 150 * loopK, x0, y + 40); ctx.globalAlpha = loopK; ctx.stroke(); ctx.restore();
      text(ctx, "반복 검수 · 수정", 960, y + 168, FONT(700, 20), C.gold, "center"); }
    AI_FLOW.forEach(([en, ko], i) => {
      const k = easeOut((v - i * .24) / .3); if (k <= 0) return; const x = x0 + i * step;
      ctx.save(); ctx.globalAlpha = a * k;
      ctx.beginPath(); ctx.arc(x, y, 22 + 6 * (1 - k), 0, Math.PI * 2); ctx.fillStyle = "#1c1210"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = i === n - 1 ? C.gold : C.rose; ctx.stroke();
      text(ctx, String(i + 1), x, y + 8, FONT(900, 22), C.cream, "center");
      text(ctx, en, x, y - 56, FONT(900, 21), C.cream, "center", 1);
      const kl = ko.length > 14 ? [ko.slice(0, ko.lastIndexOf(" ", 14) > 0 ? ko.lastIndexOf(" ", 14) : 14), ko.slice((ko.lastIndexOf(" ", 14) > 0 ? ko.lastIndexOf(" ", 14) : 14)).trim()] : [ko];
      kl.forEach((l, j) => text(ctx, l, x, y + 64 + j * 28, FONT(600, 19), C.soft, "center"));
      ctx.restore();
    });
    text(ctx, "사람이 목표와 방향을 정하고, AI를 역할별 협업 파트너로 활용", 960, 860, FONT(700, 24), C.soft, "center");
    text(ctx, "데이터 준비 · 설계 · UI/UX · 바이브코딩 · 반복 검증", 960, 902, FONT(600, 20), C.dim, "center", 1);
    ctx.restore();
  }
}

// ── title cards ─────────────────────────────────────────────────────────
function titleCard(ctx, t, a, copy) {
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(960, 520, 100, 960, 520, 1100); g.addColorStop(0, "rgba(20,14,12,.55)"); g.addColorStop(1, "rgba(20,14,12,.92)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const k = easeOut(a);
  text(ctx, "고장원인 추리 레이싱게임", 960, 380, FONT(700, 30), C.soft, "center", 6);
  ctx.save(); ctx.shadowColor = "rgba(224,122,108,.55)"; ctx.shadowBlur = 40 * k;
  text(ctx, "TraceBack", 960, 540, TITLE_FONT(168), C.cream, "center"); ctx.restore();
  ctx.fillStyle = C.rose; ctx.fillRect(960 - 160 * k, 584, 320 * k, 4);
  text(ctx, "FIND THE ROOT CAUSE", 960, 646, FONT(800, 30), C.rose, "center", 12);
  if (copy) text(ctx, copy.text, 960, 760, FONT(800, 38), C.cream, "center");
  ctx.restore();
}
function banner(ctx, s, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.font = FONT(900, 40); const w = ctx.measureText(s).width + 90, x = 520 + (1312 - w) / 2, y = 900;
  ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 24; rr(ctx, x, y, w, 76, 38); ctx.fillStyle = "rgba(24,15,12,.93)"; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.strokeStyle = C.rose; ctx.lineWidth = 2.5; ctx.stroke();
  text(ctx, s, x + w / 2, y + 52, FONT(900, 40), C.cream, "center"); ctx.restore();
}

// ── main ────────────────────────────────────────────────────────────────
export async function renderFrame(ctx, t) {
  const shot = shotAt(t);
  ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (shot.layout === "intro") { await intro(ctx, t); return transitionsOver(ctx, t, shot); }
  background(ctx, t, shot.layout === "full" ? .6 : 1);
  const box = PANEL[shot.layout === "full" ? "full" : "step"];
  if (shot.layout === "step") {
    let since = shot.t; for (const s of SHOTS) { if (s.layout === "step" && s.step === shot.step && s.t < since) since = s.t; }
    stepColumn(ctx, shot.step, t, since); topBar(ctx, t, shot.step);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 40; ctx.fillStyle = "#000"; rr(ctx, box.x, box.y, box.w, box.h, 14); ctx.fill(); ctx.restore();
  }
  const view = await drawShotInto(ctx, shot, t, box);
  // short crossfade from the previous shot inside the same layout
  const prev = SHOTS[SHOTS.indexOf(shot) - 1];
  if (prev && prev.clip && prev.layout === shot.layout && t - shot.t < .16) { const pv = await drawShotInto(ctx, prev, prev.t + prev.d - .001, box, 1 - (t - shot.t) / .16); }
  if (shot.layout === "step") { ctx.save(); ctx.strokeStyle = "rgba(246,236,223,.22)"; ctx.lineWidth = 2; rr(ctx, box.x, box.y, box.w, box.h, 14); ctx.stroke(); ctx.restore(); }
  if (!shot.still) interactions(ctx, shot, t, view);
  const u = (t - shot.t) / shot.d;
  (shot.focus ?? []).forEach(f => focusRing(ctx, view, f, clamp((u - f.at) / .25, 0, 1)));
  if (shot.callout && u > shot.callout.at) { const p = view.map(shot.callout.x, shot.callout.y); ctx.save(); ctx.globalAlpha = easeOut((u - shot.callout.at) / .15); tag(ctx, p.x - 200, p.y - 150, shot.callout.text, C.gold, shot.callout.sub); ctx.restore(); }
  if (shot.judge !== undefined && u > shot.judge) { const k = (u - shot.judge) / (1 - shot.judge); ctx.save(); ctx.globalAlpha = (1 - k) * .5; ctx.strokeStyle = C.gold; ctx.lineWidth = 10; rr(ctx, box.x + 6, box.y + 6, box.w - 12, box.h - 12, 12); ctx.stroke(); ctx.restore(); }
  if (shot.ab) abGraphics(ctx, t, shot, view);
  if (shot.clip === "race") raceGraphics(ctx, t, view);
  if (shot.clip === "ending") endTitle(ctx, t, shot);
  return transitionsOver(ctx, t, shot);
}
function raceGraphics(ctx, t, view) {
  const fault = 1.58;
  if (t > fault && t < fault + .5) { ctx.save(); ctx.globalAlpha = (1 - (t - fault) / .5) * .35; ctx.fillStyle = C.bad; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (t > fault && t < 2.9) {
    const k = clamp((t - fault) / .3, 0, 1), a = fade(t, fault, 2.9, .2);
    const p = view.map(720, 125); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.bad; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, 120 - 40 * k, 0, Math.PI * 2); ctx.stroke();
    // glitching sensor waveform (editorial graphic)
    ctx.lineWidth = 3; ctx.strokeStyle = C.bad; ctx.beginPath();
    ctx.fillStyle = "rgba(24,15,12,.85)"; rr(ctx, 1240, 330, 520, 170, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); for (let x = 0; x <= 460; x += 4) { const amp = x > 230 ? 30 * Math.abs(Math.sin(x * 1.7 + t * 40)) * k : 12; const y = 440 + Math.sin(x / 16 + t * 12) * amp; x ? ctx.lineTo(1270 + x, y) : ctx.moveTo(1270, y); }
    ctx.stroke(); text(ctx, "WARNING · 가속 입력 대비 출력 저하", 1270, 376, FONT(800, 24), C.cream);
    ctx.restore();
  }
  if (t >= 2.3) {
    const cap = CAPTIONS.find(c => c.kind === "copy");
    const a = Math.min(easeOut((t - 2.3) / .5), 1) * (t > 4.75 ? clamp((5.0 - t) / .25, 0, 1) : 1);
    titleCard(ctx, t, a, t > cap.t ? { text: cap.text } : null);
    if (t > cap.t) { /* copy fades in */ }
  }
}
function abGraphics(ctx, t, shot, view) {
  const u = (t - shot.t) / shot.d;
  const a = fade(t, shot.t + .2, shot.t + shot.d, .3);
  ctx.save(); ctx.globalAlpha = a;
  tag(ctx, 540, 176, "최종 회귀검증 · A/B 이중 시뮬레이션", C.cyan, "최종 원인 확정 후 · 같은 입력으로 정상 모델 vs 원인 제거 모델");
  if (u > .25 && u < .8) {
    const k = easeOut((u - .25) / .12);
    const L = view.map(508, 476), R = view.map(821, 476), s = view.scale;
    ctx.globalAlpha = a * k; ctx.lineWidth = 4;
    ctx.strokeStyle = C.ok; rr(ctx, L.x - 150 * s, L.y - 140 * s, 300 * s, 280 * s, 10); ctx.stroke();
    ctx.strokeStyle = C.cyan; rr(ctx, R.x - 150 * s, R.y - 140 * s, 300 * s, 280 * s, 10); ctx.stroke();
    text(ctx, "A · 정상 모델", L.x, L.y + 140 * s + 36, FONT(800, 24), C.ok, "center");
    text(ctx, "B · 원인 제거 모델", R.x, R.y + 140 * s + 36, FONT(800, 24), C.cyan, "center");
  }
  ctx.restore();
}
function endTitle(ctx, t, shot) {
  // keep the eye on the WANTED poster (the report column is not part of this shot)
  const g = ctx.createLinearGradient(1180, 0, 1540, 0); g.addColorStop(0, "rgba(20,14,12,0)"); g.addColorStop(1, "rgba(20,14,12,.96)");
  ctx.fillStyle = g; ctx.fillRect(1180, 0, W - 1180, H);
  const k = clamp((t - (shot.t + .7)) / .6, 0, 1);
  if (k > 0) titleCard(ctx, t, easeOut(k), null);
}
function transitionsOver(ctx, t, shot) {
  // scan-line wipe at each section boundary (opening→intro, intro→STEP01, STEP→STEP, →ending)
  const bounds = [5.0, 9.4, 15.0, 23.0, 30.0, 48.0, 50.4, 52.8];
  for (const b of bounds) { const d = t - b; if (d > -.12 && d < .32) { const k = (d + .12) / .44, x = -200 + k * (W + 400);
    ctx.save(); const g = ctx.createLinearGradient(x - 160, 0, x + 40, 0); g.addColorStop(0, "transparent"); g.addColorStop(.85, "rgba(224,122,108,.35)"); g.addColorStop(1, "rgba(255,240,230,.9)");
    ctx.fillStyle = g; ctx.fillRect(x - 160, 0, 200, H); ctx.restore(); } }
  // fade in from black / out at the end
  if (t < .35) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .35})`; ctx.fillRect(0, 0, W, H); }
  if (t > DURATION - .45) { ctx.fillStyle = `rgba(0,0,0,${(t - (DURATION - .45)) / .45})`; ctx.fillRect(0, 0, W, H); }
  // on-panel banners
  for (const c of CAPTIONS) if (c.kind === "banner" && t > c.t && t < c.t + c.d) banner(ctx, c.text, fade(t, c.t, c.t + c.d, .25));
}
