// STEP 03 퍼즐: drag the missing logic blocks into the gaps by reading the requirement list, check the connection,
// move the example input to the requirement value, confirm the reference and issue the test design sheet.
import { sleep } from "./cdp.mjs";
export async function playPuzzle(b) {
  const at = expr => b.eval(`(() => { const e = ${expr}; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }; })()`);
  const piece = text => at(`[...document.querySelectorAll(".rpPiece:not(.locked)")].find(x => x.textContent.includes(${JSON.stringify(text)}))`);
  const gap = n => at(`[...document.querySelectorAll(".rpGap")].find(x => x.textContent.includes(${JSON.stringify(n + "번 칸")}))`);
  b.log("mark", { name: "read" });
  await sleep(1200);
  // requirement 4: pedal map 60% → 204 Nm (table A); 6: limit by available torque (MIN); 7: ramp rate
  for (const [text, slot] of [["204 Nm", 4], ["가용 토크", 6], ["램프율", 7]]) {
    const from = await piece(text), to = await gap(slot);
    if (!from || !to) throw new Error("puzzle target " + text);
    b.log("mark", { name: "drag" + slot });
    await b.drag(from, to, 1000); await sleep(700);
  }
  b.log("mark", { name: "check" });
  await b.click(await at(`document.querySelector(".rpRun")`)); await sleep(4200);
  b.log("mark", { name: "slider" });
  const s = await at(`document.querySelector(".rpSlider input")`);
  if (s) { const left = { x: s.x - s.w / 2 + 6, y: s.y }; await b.drag(left, { x: s.x - s.w / 2 + 6 + (s.w - 12) * .6, y: s.y }, 1500); await sleep(900); }
  b.log("mark", { name: "confirm" });
  await b.click(await at(`[...document.querySelectorAll(".rpRun")].find(x => x.textContent.includes("기준 확정"))`)); await sleep(3200);
  b.log("mark", { name: "sheet" });
  await sleep(1200);
  await b.click(await at(`document.querySelector(".contractCommit")`)); await sleep(2000);
}
