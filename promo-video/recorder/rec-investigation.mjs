// STEP 02 → STEP 03 in one browser session (the campaign state carries the chosen hypothesis to the test design sheet).
import { launch, sleep } from "./cdp.mjs";
import { writeFileSync } from "node:fs";
import { playBoard } from "./play-board.mjs";
import { playPuzzle } from "./play-puzzle.mjs";
const C = new URL("../captures", import.meta.url).pathname; // promo-video/captures
const b = await launch({ profile: process.env.S + "/chrome-prof" });
await b.goto("http://127.0.0.1:5180/?qa=BOARD&case=propulsion");
await b.eval(`Object.keys(sessionStorage).forEach(k => k.startsWith("tb-") && sessionStorage.removeItem(k))`);
await b.goto("http://127.0.0.1:5180/?qa=BOARD&case=propulsion");
await sleep(1200); await b.press("Enter", "Enter", 13); await sleep(1200);
if (process.env.SKIP_BOARD_REC) await playBoard(b); else { await b.startRec(C + "/board"); await sleep(600); await playBoard(b); await sleep(1500); console.log("board", await b.stopRec()); }
await b.click(await b.rect(".dtNext")); await sleep(2500);
await b.waitFor(`document.querySelector(".refPuzzle")`);
await b.press("Enter", "Enter", 13); await sleep(1500);
await b.startRec(C + "/puzzle"); await sleep(500);
await playPuzzle(b);
await b.waitFor(`document.querySelector(".vbBench, .qaLab, [class*=qa]")`, 10000).catch(() => console.error("bench not detected"));
await sleep(1500);
console.log("puzzle", await b.stopRec());
writeFileSync(C + "/bench-start.json", JSON.stringify({ session: JSON.parse(await b.eval(`JSON.stringify(Object.fromEntries(Object.keys(sessionStorage).filter(k => k.startsWith("tb-")).map(k => [k, sessionStorage.getItem(k)])))`)), save: await b.eval(`localStorage.getItem("traceback-v16-save")`) }));
console.log(await b.eval(`JSON.parse(localStorage.getItem("traceback-v16-save")).scene + " " + JSON.parse(localStorage.getItem("traceback-v16-save")).hypothesis.propulsion`));
b.close(); process.exit(0);
