// STEP 04 실험 검증 player: level → materials → input → run → read result → judge each hypothesis →
// final cause → A/B regression run → repair → same-condition retest. Logs every decision.
import { sleep } from "./cdp.mjs";
const at = (b, expr) => b.eval(`(() => { const e = ${expr}; if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width) return null; return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
const btn = (b, scope, text) => at(b, `[...document.querySelectorAll(${JSON.stringify(scope + " button")})].find(x => x.textContent.includes(${JSON.stringify(text)}) && !x.disabled && x.getBoundingClientRect().width)`);
export async function playBench(b, { shotDir, onPhase = () => {} } = {}) {
  let lastPhase = "", systemFirst = true, switchToUnit = false;
  for (let step = 0; step < 80; step++) {
    const s = await b.eval(`(() => {
      const dock = document.querySelector(".qaActionDock");
      return { phase: (dock?.className.match(/phase-(\\w+)/) || [])[1] ?? (document.querySelector(".causeCards") ? "report" : document.querySelector(".qaTests") ? "pick" : "?"),
        scrim: !!document.querySelector(".qaScrim"), q: document.querySelector(".qaActionDock .qaQuestion b")?.textContent ?? "",
        hyp: document.querySelector(".qaHypo b, .qaInfo b")?.textContent ?? "",
        buttons: [...document.querySelectorAll(".qaActionDock button, .qaTests button, .qaInputCard, .causeCards button, .v7Fix button, .qaChoices button")].filter(x => x.getBoundingClientRect().width && !x.disabled).map(x => x.textContent.trim().slice(0, 24)),
        scene: JSON.parse(localStorage.getItem("traceback-v16-save") || "{}").scene };
    })()`);
    if (s.scene !== "TWIN_BENCH" && s.scene !== "REPAIR") { console.error("left bench:", s.scene); return s.scene; }
    if (s.phase !== lastPhase) { onPhase(s.phase); b.log("mark", { name: "ph-" + s.phase }); lastPhase = s.phase; }
    console.error(step, s.phase, "|", s.hyp.slice(0, 20), "|", s.q.slice(0, 40), "|", s.buttons.join(" / "));
    if (s.scrim) { await sleep(1800); const c = await at(b, `document.querySelector(".qaChipClose")`); await b.click(c); await sleep(700); continue; }
    let target = null, why = "";
    const has = t => s.buttons.some(x => x.includes(t));
    if (switchToUnit) { switchToUnit = false; target = await at(b, `[...document.querySelectorAll("button,[role=tab]")].find(x => x.textContent.trim().startsWith("SW 단위 시험") && x.getBoundingClientRect().width)`); why = "가를 수 있는 SW 단위 시험으로 전환"; b.log("mark", { name: "toUnit" }); }
    else if (systemFirst && has("시스템 통합 시험") && s.phase !== "lab") { systemFirst = false; target = await btn(b, ".qaTests", "시스템 통합 시험"); why = "먼저 차량 수준에서 요구사항 확인"; b.log("mark", { name: "system" }); }
    else if (has("SW 단위 시험") && s.phase !== "lab") { target = await btn(b, ".qaTests", "SW 단위 시험") ?? await at(b, `[...document.querySelectorAll(".qaTests button")][0]`); why = "가설을 가르는 신호(페달 처리값)를 직접 보는 수준"; }
    else if (s.buttons.some(x => x.startsWith("STEP02"))) { target = await btn(b, ".qaActionDock", "STEP02"); why = "고장 당시 기록 확인"; }
    else if (s.buttons.some(x => x.startsWith("STEP03"))) { target = await btn(b, ".qaActionDock", "STEP03") ?? await btn(b, ".qaActionDock", "설계서"); why = "정상 기준 확인"; }
    else if (s.buttons.some(x => x.includes("대표 요구사항"))) { target = await at(b, `[...document.querySelectorAll(".qaInputCard")].find(x => x.textContent.includes("대표 요구사항"))`); why = "요구사항 대표값으로 재현"; }
    else if (has("가설 지지")) {
      const row = await b.eval(`[...document.querySelectorAll(".qaTable tr")].map(r => r.textContent).find(t => t.includes("처리값")) ?? ""`);
      const lower = /낮|−|-\d|27/.test(row);
      const pick = !row ? "판단 보류" : s.hyp.includes("HW") || s.hyp.includes("입력 회로") ? (lower ? "가설 반박" : "가설 지지") : (lower ? "가설 지지" : "가설 반박");
      if (pick === "판단 보류") { switchToUnit = true; b.log("mark", { name: "hold" }); } else b.log("mark", { name: "judge" });
      target = await btn(b, ".qaChoices", pick) ?? await btn(b, ".qaActionDock", pick); why = `처리값 행: ${row.slice(0, 40)} → ${pick}`;
    }
    else if (has("실행") && !has("두 모델")) { target = await at(b, `[...document.querySelectorAll(".qaActionDock button")].find(x => /실행/.test(x.textContent) && !x.disabled)`); why = "시험 실행"; }
    else if (s.buttons.some(x => x.startsWith("신호 변환·스케일링"))) { target = await at(b, `[...document.querySelectorAll(".causeCard")].find(x => x.textContent.includes("보정 계수"))`); why = "판정 근거와 맞는 원인(SW 스케일링)"; }
    else if (s.buttons.some(x => x.includes("블록 제거"))) { target = await at(b, `[...document.querySelectorAll(".v7Fix button, .qaChoices button")].find(x => x.textContent.includes("블록 제거"))`); why = "원인을 없애는 수리(증상 보상이 아님)"; }
    else if (has("두 모델")) { target = await btn(b, ".qaActionDock", "두 모델"); why = "A/B 회귀검증"; }
    else if (has("수리")) { target = await at(b, `[...document.querySelectorAll(".qaActionDock button, .qaChoices button")].find(x => x.textContent.includes("수리") && !x.disabled)`); why = "수리로"; }
    else if (has("다음")) { target = await at(b, `[...document.querySelectorAll(".qaActionDock button, .qaChoices button")].find(x => x.textContent.includes("다음") && !x.disabled)`); why = "다음"; }
    if (!target) { target = await at(b, `[...document.querySelectorAll("button")].find(x => x.textContent.includes("주행 복귀") && !x.disabled && x.getBoundingClientRect().width)`); if (target) { why = "수리 적용 · 주행 복귀"; b.log("mark", { name: "toRepair" }); } }
    if (!target) { console.error("NO ACTION; buttons:", s.buttons); if (shotDir) await b.shot(shotDir + "/stuck.jpg"); return "stuck"; }
    console.error("  ->", why);
    await b.click(target); await sleep(s.buttons.some(x => /실행/.test(x)) ? 3200 : 1400);
  }
  return "loop";
}
