// Usage: node --experimental-websocket contact.mjs out.jpg img1 img2 ... (3 columns grid with captions)
import { launch, sleep } from "./cdp.mjs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
const [out, ...imgs] = process.argv.slice(2);
const html = `<html><body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(3,640px);gap:6px;padding:6px;color:#fff;font:14px sans-serif">${imgs.map(p => `<div><img src="file://${resolve(p)}" style="width:640px;display:block"><div>${p.split("/").slice(-2).join("/")}</div></div>`).join("")}</body></html>`;
const tmp = resolve(process.env.S, "contact.html"); writeFileSync(tmp, html);
const b = await launch({ profile: process.env.S + "/chrome-prof2", port: 9334, headless: true });
await b.send("Emulation.setDeviceMetricsOverride", { width: 1938, height: Math.ceil(imgs.length / 3) * 432 + 12, deviceScaleFactor: 1, mobile: false });
await b.goto("file://" + tmp); await sleep(800);
await b.shot(out); b.close(); process.exit(0);
