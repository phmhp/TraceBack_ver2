// Minimal Chrome DevTools Protocol driver for recording TraceBack gameplay (run with: node --experimental-websocket).
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = ms => new Promise(r => setTimeout(r, ms));
export { sleep };

export async function launch({ port = 9333, profile, headless = false } = {}) {
  rmSync(profile, { recursive: true, force: true });
  const args = [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--window-size=1440,900", "--hide-scrollbars",
    "--no-first-run", "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required", "--mute-audio",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
    "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "about:blank"];
  if (headless) args.unshift("--headless=new");
  const proc = spawn(CHROME, args, { stdio: "ignore" });
  let info;
  for (let i = 0; i < 60; i++) { try { info = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (info.length) break; } catch {} await sleep(250); }
  const page = info.find(t => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map(); const listeners = new Set();
  ws.addEventListener("message", ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else listeners.forEach(f => f(m)); });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const b = new Browser(send, listeners, proc);
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false });
  return b;
}

class Browser {
  constructor(send, listeners, proc) { this.send = send; this.listeners = listeners; this.proc = proc; this.mouse = { x: 720, y: 450 }; this.rec = null; }
  async eval(expr) { const r = await this.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; }
  async goto(url) { await this.send("Page.navigate", { url }); await sleep(2500); }
  async waitFor(expr, timeout = 15000) { const t = Date.now(); while (Date.now() - t < timeout) { if (await this.eval(`!!(${expr})`).catch(() => false)) return true; await sleep(150); } throw new Error("timeout: " + expr); }
  async rect(selector, index = 0) { return this.eval(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(selector)})][${index}]; if (!e) return null; e.scrollIntoView({block:"nearest"}); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; })()`); }
  async rectByText(selector, text) { return this.eval(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(selector)})].find(x => x.textContent.includes(${JSON.stringify(text)}) && x.getBoundingClientRect().width > 0); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; })()`); }
  log(type, data = {}) { if (this.rec) this.rec.events.push({ t: Date.now() - this.rec.t0, type, ...data }); }
  async move(x, y, ms = 450, buttons = 0) {
    const sx = this.mouse.x, sy = this.mouse.y, steps = Math.max(2, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) { const k = i / steps, e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; const px = sx + (x - sx) * e, py = sy + (y - sy) * e;
      await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: px, y: py, buttons, button: buttons ? "left" : "none" }); this.mouse = { x: px, y: py }; this.log("move", { x: px, y: py, down: !!buttons }); await sleep(ms / steps); }
  }
  async click(target, { ms = 500, pause = 120 } = {}) {
    const p = typeof target === "string" ? await this.rect(target) : target; if (!p) throw new Error("no target " + target);
    await this.move(p.x, p.y, ms); await sleep(pause);
    this.log("click", { x: p.x, y: p.y });
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", buttons: 1, clickCount: 1 });
    await sleep(70);
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", buttons: 0, clickCount: 1 });
    return p;
  }
  async longPress(p, ms = 1500) {
    await this.move(p.x, p.y, 450); await sleep(100); this.log("down", p);
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", buttons: 1, clickCount: 1 });
    await sleep(ms); this.log("up", p);
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", buttons: 0, clickCount: 1 });
  }
  async drag(from, to, ms = 900) {
    await this.move(from.x, from.y, 450); await sleep(120); this.log("down", from);
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: from.x, y: from.y, button: "left", buttons: 1, clickCount: 1 });
    await sleep(120); await this.move(to.x, to.y, ms, 1); await sleep(120);
    this.log("up", to);
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: to.x, y: to.y, button: "left", buttons: 0, clickCount: 1 });
  }
  async key(type, key, code, keyCode) { await this.send("Input.dispatchKeyEvent", { type, key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode }); }
  hold(key, code, keyCode) { // auto-repeat like a held physical key
    let on = true; const loop = async () => { await this.key("keyDown", key, code, keyCode); while (on) { await sleep(40); if (on) await this.send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, autoRepeat: true }); } await this.key("keyUp", key, code, keyCode); };
    const done = loop(); return async () => { on = false; await done; };
  }
  async press(key, code, keyCode) { this.log("key", { key }); await this.key("keyDown", key, code, keyCode); await sleep(60); await this.key("keyUp", key, code, keyCode); }
  async startRec(dir) {
    rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const rec = this.rec = { dir, t0: Date.now(), frames: [], events: [], n: 0 };
    rec.handler = m => { if (m.method !== "Page.screencastFrame") return; const f = `f${String(rec.n++).padStart(5, "0")}.jpg`;
      writeFileSync(join(dir, f), Buffer.from(m.params.data, "base64")); rec.frames.push({ f, t: Date.now() - rec.t0 }); this.send("Page.screencastFrameAck", { sessionId: m.params.sessionId }); };
    this.listeners.add(rec.handler);
    this.log("move", { ...this.mouse, down: false });
    await this.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 2160, maxHeight: 1350, everyNthFrame: 1 });
  }
  async stopRec(meta = {}) {
    const rec = this.rec; await this.send("Page.stopScreencast"); this.listeners.delete(rec.handler); this.rec = null;
    writeFileSync(join(rec.dir, "clip.json"), JSON.stringify({ duration: Date.now() - rec.t0, viewport: [1440, 900], frames: rec.frames, events: rec.events, ...meta }));
    return { frames: rec.frames.length, duration: Date.now() - rec.t0 };
  }
  async dumpSession(file) { writeFileSync(file, await this.eval(`JSON.stringify(Object.fromEntries(Object.keys(sessionStorage).filter(k => k.startsWith("tb-")).map(k => [k, sessionStorage.getItem(k)])))`)); }
  async loadSession(file) { const data = (await import("node:fs")).readFileSync(file, "utf8"); await this.eval(`(() => { const d = ${data}; Object.entries(d).forEach(([k, v]) => sessionStorage.setItem(k, v)); })()`); }
  async shot(file) { const r = await this.send("Page.captureScreenshot", { format: "jpeg", quality: 85 }); writeFileSync(file, Buffer.from(r.data, "base64")); }
  close() { this.proc.kill(); }
}
