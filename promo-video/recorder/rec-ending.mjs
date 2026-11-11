// Ending: the real WANTED case file, opened with the records of the case solved in this recording session.
// Shortcut (disclosed): the saved scene is set to ENDING instead of playing the second case and the ship escape.
import { launch, sleep } from "./cdp.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { resume } from "./resume.mjs";
const C = new URL("../captures", import.meta.url).pathname; // promo-video/captures
const st = JSON.parse(readFileSync(C + "/after-case1.json", "utf8")); const save = JSON.parse(st.save);
save.scene = "ENDING"; st.save = JSON.stringify(save);
writeFileSync(process.env.S + "/ending-seed.json", JSON.stringify(st));
const b = await launch({ profile: process.env.S + "/chrome-prof" });
// the title screen does not offer "이어하기" for the ending scene, so open the ending through its dev entry and keep this session's records
await b.goto("http://127.0.0.1:5180/?qa=ENDING&case=propulsion");
await b.eval(`(() => { const d = ${JSON.stringify(st.session)}; Object.entries(d).forEach(([k, v]) => sessionStorage.setItem(k, v)); })()`);
await b.goto("http://127.0.0.1:5180/?qa=ENDING&case=propulsion"); await sleep(2000);
await b.startRec(C + "/ending"); await sleep(5000);
console.log(await b.stopRec()); await b.shot(process.env.S + "/ending.jpg");
b.close(); process.exit(0);
