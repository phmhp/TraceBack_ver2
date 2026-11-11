// STEP 04 (recorded) → repair cut-scene → chase resume (recorded separately).
import { launch, sleep } from "./cdp.mjs";
import { resume } from "./resume.mjs";
import { playBench } from "./play-bench.mjs";
const C = new URL("../captures", import.meta.url).pathname; // promo-video/captures
const b = await launch({ profile: process.env.S + "/chrome-prof" });
await resume(b, C + "/bench-start.json");
await b.press("Enter", "Enter", 13); await sleep(1500);
await b.startRec(C + "/bench");
const r = await playBench(b, { shotDir: process.env.S });
console.log("bench", r, await b.stopRec());
await b.startRec(C + "/resume");
b.log("mark", { name: "repair" });
for (let i = 0; i < 40; i++) {
  const scene = await b.eval(`JSON.parse(localStorage.getItem("traceback-v16-save")).scene`);
  if (scene === "CHASE_RESUME") break;
  const next = await b.eval(`(() => { const e = [...document.querySelectorAll("button")].find(x => /다음|계속|주행|복귀|출발/.test(x.textContent) && !x.disabled && x.getBoundingClientRect().width && !x.className.includes("stageForward") && !x.className.includes("journey")); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2, t: e.textContent.trim().slice(0,20) }; })()`);
  console.error("repair", scene, next?.t);
  if (next && i > 2) { await b.click(next); }
  await sleep(1200);
}
b.log("mark", { name: "resume" });
await sleep(1500);
await b.press("Enter", "Enter", 13); await sleep(3800);
b.log("mark", { name: "drive" });
const up = b.hold("ArrowUp", "ArrowUp", 38); await sleep(6000); await up();
console.log("resume", await b.stopRec(), await b.eval(`(() => { const s = JSON.parse(localStorage.getItem("traceback-v16-save")); return [s.scene, s.raceDistance, s.policeGapMeters, s.completedCases]; })()`));
await b.shot(process.env.S + "/resume-end.jpg");
(await import("node:fs")).writeFileSync(C + "/after-case1.json", JSON.stringify({ session: JSON.parse(await b.eval(`JSON.stringify(Object.fromEntries(Object.keys(sessionStorage).filter(k => k.startsWith("tb-")).map(k => [k, sessionStorage.getItem(k)])))`)), save: await b.eval(`localStorage.getItem("traceback-v16-save")`) }));
b.close(); process.exit(0);
