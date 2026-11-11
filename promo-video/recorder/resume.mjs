// Restore a saved campaign + session (from bench-start.json etc.) and continue it via the title screen "이어하기".
import { sleep } from "./cdp.mjs";
import { readFileSync } from "node:fs";
export async function resume(b, file) {
  const st = JSON.parse(readFileSync(file, "utf8"));
  await b.goto("http://127.0.0.1:5180/");
  await b.eval(`(() => { const d = ${JSON.stringify(st)}; localStorage.setItem("traceback-v16-save", d.save); Object.entries(d.session).forEach(([k, v]) => sessionStorage.setItem(k, v)); })()`);
  await b.goto("http://127.0.0.1:5180/"); await sleep(1500);
  const btn = await b.rectByText("button", "이어하기");
  if (!btn) throw new Error("no 이어하기");
  await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x: btn.x, y: btn.y, button: "left", buttons: 1, clickCount: 1 });
  await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: btn.x, y: btn.y, button: "left", buttons: 0, clickCount: 1 });
  await sleep(2500);
}
