import { launch, sleep, key } from "./cdp.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const S = process.argv[2], sc = Number(process.argv[3] || 2);
const page = await launch({ profile: S + "/chrome-profile", scale: sc });
await page.goto("http://127.0.0.1:5180/?qa=CHASE_NORMAL&distance=150"); await sleep(2500);
await key(page, "Enter"); await sleep(1000);
mkdirSync(S + "/cap-shot", { recursive: true });
const t0 = Date.now(); let n = 0;
while (Date.now() - t0 < 4000) { const r = await page.send("Page.captureScreenshot", { format: "jpeg", quality: 90, optimizeForSpeed: true }); writeFileSync(`${S}/cap-shot/s${n++}.jpg`, Buffer.from(r.data, "base64")); }
console.log("fps", n / 4);
await page.close();
