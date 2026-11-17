// Minimal Chrome DevTools Protocol driver used to film the real game (no extra dependencies).
// Node 20: run with --experimental-websocket.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch({ profile, port = 9333, headless = true, width = 1440, height = 900, scale = 1.5 }) {
  const args = [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
    "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--force-color-profile=srgb", `--window-size=${width},${height + 120}`];
  if (headless) args.push("--headless=new", "--use-angle=metal", "--enable-gpu-rasterization", "--ignore-gpu-blocklist");
  args.push("about:blank");
  const proc = spawn(CHROME, args, { stdio: "ignore" });
  let target;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(250);
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target = list.find(t => t.type === "page"); } catch {}
  }
  if (!target) throw new Error("chrome did not start");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
    else if (msg.method) listeners.forEach(fn => fn(msg));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const k = ++id; pending.set(k, { res, rej }); ws.send(JSON.stringify({ id: k, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });
  const page = {
    proc, send, width, height, scale,
    on: fn => listeners.push(fn),
    async eval(expr) {
      const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error("eval: " + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
      return r.result.value;
    },
    async goto(url) { await send("Page.navigate", { url }); await sleep(1500); },
    async close() { try { await send("Browser.close"); } catch {} proc.kill(); },
  };
  return page;
}

/** Records Page.startScreencast frames (JPEG) with timestamps; also logs interactions for the edit. */
export function recorder(page, dir) {
  mkdirSync(dir, { recursive: true });
  const frames = [], events = []; let on = false, t0 = 0, n = 0;
  page.on(async msg => {
    if (msg.method !== "Page.screencastFrame" || !on) return;
    const { data, sessionId, metadata } = msg.params;
    page.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    const file = `f${String(n++).padStart(5, "0")}.jpg`;
    writeFileSync(`${dir}/${file}`, Buffer.from(data, "base64"));
    frames.push({ t: +(metadata.timestamp - t0).toFixed(4), file });
  });
  return {
    async start() {
      t0 = Date.now() / 1000; on = true;
      await page.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: Math.round(page.width * page.scale), maxHeight: Math.round(page.height * page.scale), everyNthFrame: 1 });
    },
    now: () => Date.now() / 1000 - t0,
    mark(type, data = {}) { events.push({ t: +(Date.now() / 1000 - t0).toFixed(3), type, ...data }); },
    async stop() { on = false; await page.send("Page.stopScreencast"); await sleep(300); writeFileSync(`${dir}/timeline.json`, JSON.stringify({ width: page.width, height: page.height, frames, events }, null, 1)); return { frames: frames.length, events: events.length }; },
  };
}

// ---- input helpers (real mouse / keyboard events) ----
export async function move(page, x, y) { await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); }
export async function glide(page, from, to, ms = 450, button = "none", buttons = 0) {
  const steps = Math.max(6, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const k = i / steps, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, button, buttons });
    await sleep(ms / steps);
  }
}
export async function click(page, x, y) {
  await page.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 });
  await sleep(70);
  await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 });
}
export async function key(page, k, type = "both", code) {
  const map = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Enter: 13, " ": 32, Space: 32 };
  const vk = map[k] ?? k.toUpperCase().charCodeAt(0);
  const base = { key: k === "Space" ? " " : k, code: code ?? (k.startsWith("Arrow") ? k : k === "Enter" ? "Enter" : k === "Space" ? "Space" : "Key" + k.toUpperCase()), windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
  if (type !== "up") await page.send("Input.dispatchKeyEvent", { type: "keyDown", ...base, text: k === "Enter" ? "\r" : undefined });
  if (type !== "down") await page.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
}
/** center of the first element matching selector (optionally whose text includes `text`), in CSS px */
export async function rect(page, selector, text) {
  return page.eval(`(() => { const els=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(e => ${text ? `e.textContent.includes(${JSON.stringify(text)})` : "true"}).filter(e => { const b=e.getBoundingClientRect(); return b.width>0 && b.height>0; }); const e=els[0]; if(!e) return null; e.scrollIntoView({block:"nearest"}); const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2,w:b.width,h:b.height,l:b.x,t:b.y}; })()`);
}
