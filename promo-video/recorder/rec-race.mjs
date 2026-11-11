// Scene: chase driving into the propulsion fault (real keyboard input).
import { launch, sleep } from "./cdp.mjs";
const OUT = process.argv[2];
const b = await launch({ profile: process.env.S + "/chrome-prof" });
await b.goto("http://127.0.0.1:5180/?qa=CHASE_NORMAL&case=propulsion&distance=95");
await sleep(1500);
await b.startRec(OUT);
await b.press("Enter", "Enter", 13); await sleep(600);
const brake = b.hold("ArrowDown", "ArrowDown", 40); await sleep(300);
await b.press("4", "Digit4", 52); await sleep(300); await brake();
b.log("mark", { name: "gearD" });
const speed = () => b.eval(`document.body.innerText.match(/속도\\s*(\\d+)/)?.[1]`);
const release = b.hold("ArrowUp", "ArrowUp", 38);
await sleep(900); const steer = b.hold("ArrowRight", "ArrowRight", 39); await sleep(350); await steer();
const t = Date.now(); let last = 0;
while (Date.now() - t < 60000) {
  if (await b.eval(`!!document.querySelector(".faultBeacon")`)) { b.log("mark", { name: "fault" }); break; }
  if (Date.now() - last > 2000) { last = Date.now(); console.error("speed", await speed(), b.rec.n); }
  await sleep(150);
}
await sleep(3000); await release();
await b.waitFor(`document.querySelector(".faultDialogueScene")`, 15000).catch(() => {});
b.log("mark", { name: "dialogue" });
await sleep(3000);
console.log(await b.stopRec());
b.close(); process.exit(0);
