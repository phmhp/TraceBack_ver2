// Usage: probe-ui.mjs URL shot.jpg [enter]  -> lists visible buttons with centers
import { launch, sleep } from "./cdp.mjs";
const [url, shot, enter] = process.argv.slice(2);
const b = await launch({ profile: process.env.S + "/chrome-prof" });
await b.goto(url); await sleep(2500);
if (enter) { await b.press("Enter", "Enter", 13); await sleep(1200); }
if (process.env.PRE) await b.eval(process.env.PRE), await sleep(1500);
await b.shot(shot);
console.log(JSON.stringify(await b.eval(`[...document.querySelectorAll("button,[role=tab],[draggable=true]")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.y < 900; }).map(e => { const r = e.getBoundingClientRect(); return [e.className.toString().slice(0,40), e.textContent.trim().slice(0,30), Math.round(r.x + r.width/2), Math.round(r.y + r.height/2)]; })`)));
b.close(); process.exit(0);
