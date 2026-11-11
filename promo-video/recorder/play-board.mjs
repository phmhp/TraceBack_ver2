// STEP 02 도미노 역추적 play (decisions use only on-screen information: change time on each card vs. the current output).
import { sleep } from "./cdp.mjs";
export async function playBoard(b) {
  const byText = async (sel, text) => { const r = await b.rectByText(sel, text); if (!r) throw new Error(`not found ${sel} ${text}`); return r; };
  b.log("mark", { name: "evidence" });
  await b.click(await byText(".pol", "볼트 진술")); await sleep(1400);
  if (await b.eval(`!!document.querySelector(".polZoom")`)) {
    const btn = await b.eval(`(() => { const e = [...document.querySelectorAll(".polBig button")].find(x => !x.classList.contains("polClose")); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2, t: e.textContent }; })()`);
    console.error("zoom btn", btn);
    if (btn) { await b.click(btn); await sleep(1000); }
    if (await b.eval(`!!document.querySelector(".polZoom")`)) { await b.click(".polClose"); await sleep(600); }
  }
  b.log("mark", { name: "output" });
  await b.click(await byText(".etNode", "차량 가속")); await sleep(1300);
  b.log("mark", { name: "replay" });
  await b.click(".etReplay"); await sleep(3500);
  if (await b.eval(`!![...document.querySelectorAll("button")].find(x => /닫기|확인/.test(x.textContent) && x.closest("[class*=eplay]"))`)) {
    const c = await b.eval(`(() => { const e = [...document.querySelectorAll("button")].find(x => /닫기|확인/.test(x.textContent) && x.closest("[class*=eplay]")); const r = e.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })()`); await b.click(c); await sleep(800);
  }
  b.log("mark", { name: "trace" });
  for (let guard = 0; guard < 30; guard++) {
    if (!(await b.eval(`!!document.querySelector(".etDockTrace")`))) break;
    const st = await b.eval(`(() => { const q = document.querySelector(".etDockQ b")?.textContent ?? ""; const ft = parseFloat((q.match(/·\\s*([\\d.]+)/) || [])[1]);
      return { q, ft, cards: [...document.querySelectorAll(".etSusp")].map((c, i) => ({ i, measure: !!c.querySelector(".etMeasure"), stampBtns: !!c.querySelector(".etStampBtns"), when: c.querySelector(".etWhen")?.textContent ?? "" })) }; })()`);
    const m = st.cards.find(c => c.measure);
    if (m) { await b.click(`.etSusp:nth-child(${m.i + 1}) .etMeasure`); await sleep(900); continue; }
    const s = st.cards.find(c => c.stampBtns);
    if (!s) { await sleep(800); continue; }
    const t = parseFloat((s.when.match(/([\d.]+)/) || [])[1]);
    const likely = /달라짐/.test(s.when) && t < st.ft;
    console.error(st.q, "|", s.when, "->", likely ? "유력" : "반박");
    await b.click(`.etSusp:nth-child(${s.i + 1}) .etStampBtns button:nth-child(${likely ? 2 : 1})`); await sleep(1100);
  }
  b.log("mark", { name: "section" });
  await b.waitFor(`document.querySelector(".etSecs")`, 8000); await sleep(1200);
  await b.click(await byText(".etSecs button", "VCU 내부")); await sleep(1600);
  b.log("mark", { name: "sort" });
  for (let k = 0; k < 6; k++) {
    const line = await b.eval(`document.querySelector(".tbSort") ? document.querySelector(".etDockLine")?.textContent : null`);
    if (!line) break;
    const out = /가속 페달 센서|인버터|구동 모터/.test(line);   // already contradicted by STEP02 measurements (sensor same, CAN already low)
    console.error(line, "->", out ? "반박" : "보류");
    await b.click(`.tbSort button:nth-child(${out ? 1 : 2})`); await sleep(1100);
  }
  b.log("mark", { name: "carry" });
  if (await b.eval(`!!document.querySelector(".etCarryPick")`)) { await b.click(await byText(".etCarryPick", "SW")); await sleep(1500); }
  b.log("mark", { name: "done" });
  await sleep(1500);

}
