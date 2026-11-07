// Memo board as a deduction game ("suspect board").
// 1) The output (symptom) is already measured ✗. The player chooses where to measure next (limited tries).
// 2) Each measurement becomes an evidence photo. The player drags (or taps) evidence onto a suspect.
//    The game judges whether that evidence really rules the suspect out — evidence that cannot tell
//    suspects apart bounces back with an explanation (teaches "discriminating" tests).
// 3) When only one suspect is left and evidence supports it, the culprit is confirmed.
import React, { useEffect, useMemo, useState } from "react";
import type { Campaign, CaseId } from "../../game/runtime";
import { SCENARIOS } from "../../game/scenarios";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";
import { play } from "../../ui/sfx";
import { CardGraphic, MEASURE_RAIL, PursuitRouteBar, ReplayRaceView } from "../../experiences";

type Send = React.Dispatch<any>;
type Verdict = "rebut" | "support" | "neutral";
const BUDGET = 3;

/** Does evidence measured at stop `e` rule out / support the suspect located at stop `h`? */
function judge(caseId: CaseId, e: number, h: number, measured: number[]): { verdict: Verdict; why: string } {
  const stops = MEASURE_RAIL[caseId].stops;
  const ev = stops[e];
  if (e === h) {
    if (ev.ok) return { verdict: "rebut", why: "이 부품을 직접 재 보니 정상이야. 무죄!" };
    const upstreamOk = h === 0 || (measured.includes(h - 1) && stops[h - 1].ok);
    return upstreamOk
      ? { verdict: "support", why: "바로 앞은 정상인데 여기서부터 이상해. 강력한 용의자!" }
      : { verdict: "neutral", why: "여기가 이상하긴 한데, 더 앞쪽에서 이미 이상했을 수도 있어. 앞쪽도 재 봐야 확실해." };
  }
  if (e < h) {
    return ev.ok
      ? { verdict: "neutral", why: "앞쪽이 정상이라는 건 이 용의자 혐의와는 상관없어." }
      : { verdict: "rebut", why: "고장이 이 부품보다 앞에서 이미 시작됐어. 이 부품 탓이 아니야!" };
  }
  return ev.ok
    ? { verdict: "rebut", why: "이 부품이 고장이었다면 뒤쪽도 이상해야 하는데, 뒤쪽은 정상이야!" }
    : { verdict: "neutral", why: "뒤쪽이 이상한 건 어느 용의자가 범인이어도 똑같이 나와. 구별이 안 돼." };
}

export function SuspectBoard({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const scenario = SCENARIOS[caseId];
  const rail = MEASURE_RAIL[caseId];
  const last = rail.stops.length - 1;
  const suspects = scenario.hypotheses.filter(item => rail.hypothesisAt[item.id] !== undefined);
  const [measured, setMeasured] = useState<number[]>([last]);
  const [extra, setExtra] = useState(0);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [bubble, setBubble] = useState("출력이 이상해! 어디를 재 볼지 골라 봐. 기회는 3번이야.");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [replay, setReplay] = useState(false);
  const [shake, setShake] = useState("");
  const used = measured.length - 1;
  const left = BUDGET + extra - used;

  // keep the campaign's evidence list in sync with what was measured
  useEffect(() => {
    const want = measured.map(index => rail.stops[index].ev);
    want.filter(id => !state.evidence[caseId].includes(id)).forEach(id => send({ type: "RECORD_EVIDENCE", id }));
  }, [measured]); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = suspects.filter(item => verdicts[item.id] !== "rebut");
  const culprit = remaining.length === 1 && verdicts[remaining[0].id] === "support" ? remaining[0] : null;
  const stars = used <= 1 ? 3 : used === 2 ? 2 : 1;

  const measure = (index: number) => {
    if (measured.includes(index) || left <= 0 || culprit) return;
    const stop = rail.stops[index];
    setMeasured(previous => [...previous, index]);
    play("zip"); window.setTimeout(() => play(stop.ok ? "pop" : "error"), 140);
    setBubble(`${stop.at}: ${stop.value} — 정상은 ${stop.expect}. ${stop.ok ? "여긴 정상 ✓" : "여기도 이상해 ✗"} 이 증거를 용의자에게 끌어다 놓아 봐!`);
  };
  const accuse = (suspectId: string, evidenceIndex: number) => {
    if (verdicts[suspectId] === "rebut") return;
    const result = judge(caseId, evidenceIndex, rail.hypothesisAt[suspectId], measured);
    setPicked(null);
    setBubble(result.why);
    if (result.verdict === "neutral") { play("error"); setShake(suspectId); window.setTimeout(() => setShake(""), 400); return; }
    setVerdicts(previous => ({ ...previous, [suspectId]: result.verdict }));
    play("stamp"); if (result.verdict === "support") window.setTimeout(() => play("success"), 120);
  };
  const reset = () => { setMeasured([last]); setExtra(0); setVerdicts({}); setPicked(null); setBubble("처음부터 다시! 어디를 재 볼까?"); play("squish"); };
  const confirm = () => {
    if (!culprit) return;
    if (state.hypothesis[caseId] !== culprit.id) send({ type: "SELECT_HYPOTHESIS", id: culprit.id });
    send({ type: "OPEN_WIRING" });
  };
  const evidenceCards = useMemo(() => measured.map(index => ({ index, stop: rail.stops[index], card: scenario.evidence.find(item => item.id === rail.stops[index].ev)! })), [measured, rail, scenario]);
  const step = culprit ? 3 : Object.keys(verdicts).length ? 2 : used > 0 ? 1 : 0;

  return <div className="suspectBoard">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="INCIDENT INVESTIGATION" title="용의자 메모판" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <main className="sbLayout">
      <header className="sbHead">
        <div><small>실차 반례(고장) 분석 · 시스템 수준</small><h1>{scenario.title}</h1></div>
        <div className="sbButtons">
          <button onClick={() => setRulesOpen(true)}>규칙</button>
          <button onClick={() => setReplay(true)}>▶ 리플레이</button>
          <button onClick={reset}>↺ 초기화</button>
        </div>
      </header>

      <section className="sbRail">
        <span className="sbRailTitle"><b>🔍 어디를 재 볼까?</b><em>기회 {"●".repeat(Math.max(0, left))}{"○".repeat(Math.max(0, BUDGET + extra - Math.max(0, left)))}</em></span>
        {rail.stops.map((stop, index) => { const done = measured.includes(index); return <React.Fragment key={stop.at}>
          {index > 0 && <i className="sbWire" />}
          <button className={`sbStop ${done ? stop.ok ? "ok" : "bad" : ""}`} disabled={done || left <= 0 || Boolean(culprit)} onClick={() => measure(index)}>
            <small>{stop.at}</small>{done ? <b>{stop.ok ? "✓" : "✗"} {stop.value}</b> : <b className="tap">재 보기</b>}
          </button>
        </React.Fragment>; })}
        {left <= 0 && !culprit && <button className="sbBuy" onClick={() => { send({ type: "HINT", key: `${caseId}:measure${extra + 1}` }); setExtra(value => value + 1); play("squish"); }}>+1 기회<small>추격 −5m</small></button>}
      </section>

      <aside className="sbEvidence">
        <h2>증거 사진</h2>
        <p>끌어서 용의자에게 놓기 · 또는 눌러서 고른 뒤 용의자 누르기</p>
        <div>{evidenceCards.map(({ index, stop, card }) => <div key={card.id} className={`sbCard ${picked === index ? "picked" : ""}`} draggable onDragStart={event => { event.dataTransfer.setData("text/plain", String(index)); setPicked(index); }} onClick={() => { setPicked(picked === index ? null : index); play("pop"); }}>
          <div className="polaroidCard"><CardGraphic id={card.id} kind={card.kind} reading={{ value: stop.value, ok: stop.ok }} /><div className="polaroidCaption"><b>{card.label}</b><span>{stop.at}</span></div></div>
        </div>)}</div>
      </aside>

      <section className="sbCork">
        <div className="sbSuspects">{suspects.map(item => { const verdict = verdicts[item.id]; return <div key={item.id}
          className={`sbSuspect ${verdict ? `is-${verdict}` : ""} ${shake === item.id ? "shake" : ""} ${picked !== null && verdict !== "rebut" ? "droppable" : ""}`}
          onDragOver={event => { if (verdict !== "rebut") event.preventDefault(); }}
          onDrop={event => { event.preventDefault(); accuse(item.id, Number(event.dataTransfer.getData("text/plain"))); }}
          onClick={() => picked !== null && accuse(item.id, picked)}>
          <i className="pushPin" />
          <div className="polaroidCard"><CardGraphic id={item.id} kind="용의자" /><div className="polaroidCaption"><b>{item.label}</b><span>{item.desc}</span></div></div>
          {verdict === "rebut" && <span className="sbStamp rebut">무죄</span>}
          {verdict === "support" && <span className="sbStamp support">유력</span>}
        </div>; })}</div>
        <div className="sbBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>밍</b>{bubble}</p></div>
      </section>

      <footer className="sbFoot">
        <div className="boardStepper">
          {["어디를 잴지 고르기", "증거로 용의자 반박", "범인 확정"].map((label, index) => <span key={label} className={index < step ? "done" : index === step ? "now" : ""}><i>{index < step ? "✓" : index + 1}</i>{label}</span>)}
        </div>
        {culprit && <span className="sbStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span>}
        <button className="sbNext" disabled={!culprit} onClick={confirm}>{culprit ? `범인: ${culprit.label} → 경로 복원` : `남은 용의자 ${remaining.length}명`}</button>
      </footer>
    </main>

    {rulesOpen && <div className="sbModal" onClick={() => setRulesOpen(false)}><article onClick={event => event.stopPropagation()}>
      <h2>🕵️ 용의자 메모판 규칙</h2>
      <ol>
        <li>실차에서 나온 <b>고장(반례)</b>의 원인을 좁히는 단계예요. 맨 오른쪽 <b>출력은 이미 ✗</b>예요.</li>
        <li>레일에서 <b>어디를 잴지</b> 골라요. 기회는 3번! 적게 잴수록 ★이 많아요.</li>
        <li>측정 결과는 <b>증거 사진</b>이 돼요. 증거를 <b>용의자에게 끌어다 놓으면</b> 그 증거로 용의자가 무죄인지 판정해요.</li>
        <li>구별할 수 없는 증거는 되돌아와요. <b>어떤 증거가 용의자를 가려낼 수 있는지</b> 생각해 봐요.</li>
        <li>용의자가 한 명만 남고 <b>유력</b> 도장이 찍히면 범인 확정! 다음은 고친 설계를 만드는 <b>경로 복원</b>, 그다음 <b>단위·HIL 검증</b>이에요.</li>
      </ol>
      <button onClick={() => setRulesOpen(false)}>알겠어!</button>
    </article></div>}
    {replay && <div className="replayModal" onClick={() => setReplay(false)}><div onClick={event => event.stopPropagation()}><button onClick={() => setReplay(false)}>×</button><small>QUICK REPLAY</small><h2>고장 직전 주행 다시 보기</h2><ReplayRaceView caseId={caseId} /></div></div>}
  </div>;
}
