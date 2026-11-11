import { launch, sleep } from "./cdp.mjs";
import { resume } from "./resume.mjs";
const b = await launch({ profile: process.env.S + "/chrome-prof" });
await resume(b, "captures/bench-start.json");
console.error(await b.eval(`document.body.innerText.slice(0, 200)`));
await b.press("Enter", "Enter", 13); await sleep(1500);
await b.shot(process.env.S + "/bench0.jpg");
console.log(JSON.stringify(await b.eval(`[...document.querySelectorAll("button")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.y < 900 && r.y > 80; }).map(e => { const r = e.getBoundingClientRect(); return [e.className.toString().slice(0,40), e.textContent.trim().slice(0,30), Math.round(r.x + r.width/2), Math.round(r.y + r.height/2)]; })`)));
b.close(); process.exit(0);
