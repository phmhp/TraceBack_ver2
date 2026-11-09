// Stage 1 · 원인 역추적 (docs/PLAY_FLOW_V2_2026-11-08.md)
// Layout: top-left evidence polaroids | top-right whole-vehicle E/E board, bottom: mugshot suspects row.
// 1) find the odd one in the evidence (this drive vs reference) → 2) pick that output on the E/E board
// 3) every part that feeds that output lights up as a mugshot → 4) measure one, then stamp it yourself:
//    normal → 반박, changed LATER than the output → 반박 (it is an effect), changed EARLIER → 유력 (new output)
// 5) when every suspect of the current output is cleared, that output is where things first went wrong
// 6) pick the section inside it; hypotheses that this stage cannot split are carried as 판단 보류.
// Measured values come from the same case data as before (DominoTrace CASES). The old DominoTrace stays unused.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Campaign } from "../../game/runtime";
import { SCENARIOS, SCENARIO_META } from "../../game/scenarios";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";
import { play } from "../../ui/sfx";
import { PursuitRouteBar } from "../../experiences";
import { DRIVER, ENGINEER } from "../../game/cast";
import { Icon } from "../../ui/Icon";
import { StageIntro, showVerdict } from "../../ui/Verdict";
import { CASES, DominoFall, Gauge, Photo, ZONES, ZONE_ICON, fmt, josa, refText, type Dom } from "./DominoTrace";
import { EeBlueprint } from "../garage/EeBlueprint";

type Send = React.Dispatch<any>;
type Stamp = "refuted" | "likely";
const STAMP_KO: Record<Stamp | "untested" | "measured" | "hold", string> = { untested: "미조사", measured: "증거 확보", likely: "유력", refuted: "반박됨", hold: "판단 보류" };
// other controllers on the vehicle network, shown dimmed so the board reads as the whole vehicle
const OTHER_ECUS = ["VCU", "MCU·인버터", "BMS", "Thermal ECU", "Brake ECU", "EPS ECU", "Gateway"];
const LAMP: Record<string, { label: string; note: string }> = {
  propulsion: { label: "가속 출력 저하", note: "경고등 없음 · 페달 대비 가속이 둔함" },
  thermal: { label: "파워다운 표시등", note: "출력 제한 동작 중" },
  brake: { label: "제동 경고 없음", note: "페달 대비 감속이 부족함" },
};
const QUOTE: Record<string, string> = {
  propulsion: "페달을 반 넘게 밟았는데 차가 힘없이 천천히 나가.",
  thermal: "오래 밟고 달렸더니 경고등이 켜지고 힘이 빠졌어.",
  brake: "브레이크를 밟았는데 생각보다 덜 서.",
};

/** v2 (evidence | board / mugshot row). Kept unused; v3 below is live. */
export function EeTraceV2({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const scenario = SCENARIOS[caseId];
  const data = CASES[caseId];
  const meta = SCENARIO_META[caseId];
  const dom = (id: string) => data.doms.find(item => item.id === id)!;
  const causesOf = (id: string) => dom(id).causes ?? [];
  const unit = data.timeUnit;
  const start = dom(data.start);

  const [phase, setPhase] = useState<"evidence" | "output" | "trace" | "section" | "done">("evidence");
  const [chain, setChain] = useState<string[]>([]);          // outputs followed so far (symptom → … backward)
  const [measured, setMeasured] = useState<string[]>([]);
  const [stamps, setStamps] = useState<Record<string, Stamp>>({});
  const [mistakes, setMistakes] = useState(0);
  const [sectionPick, setSectionPick] = useState<string | null>(null);
  const [shake, setShake] = useState("");
  const [bubble, setBubble] = useState(`${DRIVER}의 말과 주행 기록을 보세요. 기준과 다른 곳을 돋보기로 누르세요.`);
  const focus = chain[chain.length - 1];
  const suspects = focus ? causesOf(focus) : [];
  const cleared = suspects.length > 0 && suspects.every(id => stamps[id] === "refuted");
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const nope = (id: string, text: string) => { setBubble(text); setShake(id); setMistakes(n => n + 1); showVerdict(false); window.setTimeout(() => setShake(""), 420); };

  // 1) evidence: the drive record differs from the reference
  const findEvidence = (which: "quote" | "lamp" | "record") => {
    if (phase !== "evidence") return;
    if (which !== "record") { play("pop"); setBubble(which === "quote" ? "진술은 느낌이에요. 기준과 비교할 수 있는 기록에서 다른 곳을 찾아보세요." : "경고등은 결과로 켜진 것일 수 있어요. 기준과 비교할 수 있는 기록을 보세요."); return; }
    play("stamp"); showVerdict(true, "증거 확보");
    setPhase("output");
    setBubble(`${start.label}${josa(start.label, "이", "가")} 기준보다 ${start.ref > start.run ? "낮아요" : "달라요"}. 오른쪽 E/E 판에서 이 증상이 나오는 출력을 고르세요.`);
  };
  // 2) pick the output on the board
  const pickNode = (id: string) => {
    if (phase === "output") {
      if (id !== data.start) { nope(id, `${dom(id).label}${josa(dom(id).label, "은", "는")} 증거에 나온 증상이 아니에요. 증거는 '${start.label}'이에요.`); return; }
      play("zip"); setChain([id]); setPhase("trace");
      setBubble(`${start.label}${josa(start.label, "을", "를")} 만드는 데 영향을 주는 부품이 아래에 용의자로 올라왔어요. 하나씩 재 보세요.`);
      return;
    }
    if (phase === "trace" && suspects.includes(id)) measure(id);
  };
  // 4) measure one suspect, then the player stamps it
  const measure = (id: string) => {
    if (measured.includes(id)) return;
    setMeasured(previous => [...previous, id]);
    const d = dom(id);
    play("zip"); window.setTimeout(() => play(d.status === "bad" ? "stamp" : "pop"), 160);
    setBubble(d.status === "bad"
      ? `${d.label}도 기준과 달라요(${fmt(d.t!)}${unit}에 달라짐). ${dom(focus).label}보다 먼저인가요, 나중인가요? 도장을 고르세요.`
      : `${d.label}${josa(d.label, "은", "는")} ${d.status === "tol" ? "조금 다르지만 허용 범위예요" : "기준과 같아요"}. 도장을 고르세요.`);
  };
  const stamp = (id: string, pick: Stamp) => {
    const d = dom(id), f = dom(focus);
    const earlier = d.status === "bad" && (d.t ?? 0) < (f.t ?? 0);
    const answer: Stamp = earlier ? "likely" : "refuted";
    if (pick !== answer) {
      nope(id, answer === "refuted"
        ? d.status === "bad" ? `${d.label}${josa(d.label, "은", "는")} ${fmt(d.t!)}${unit}에 달라졌어요. ${f.label}(${fmt(f.t!)}${unit})보다 늦어요. 원인은 결과보다 먼저 일어나요. 이건 결과예요.` : `${d.label}${josa(d.label, "은", "는")} 기준과 같아요. 이 값으로는 ${f.label}${josa(f.label, "을", "를")} 바꿀 수 없어요.`
        : `${d.label}${josa(d.label, "은", "는")} ${f.label}보다 먼저 달라졌어요. 원인 쪽일 수 있어요.`);
      return;
    }
    setStamps(previous => ({ ...previous, [id]: pick }));
    showVerdict(true, STAMP_KO[pick]);
    if (pick === "likely") {
      setBubble(`${d.label}${josa(d.label, "이", "가")} 먼저 달라졌어요. 이제 ${d.label}${josa(d.label, "이", "가")} 새 출력이에요. 용의자가 바뀌어요.`);
      window.setTimeout(() => setChain(previous => [...previous, id]), 700);
    } else setBubble(`${d.label} 반박. 남은 용의자를 재 보세요.`);
  };
  // 5) every suspect cleared → the current output is where it first went wrong
  useEffect(() => {
    if (phase !== "trace" || !cleared) return;
    if (focus !== data.first) return;
    play("success");
    setBubble(`들어오는 값은 모두 정상인데 ${dom(focus).label}만 달라요. 여기가 처음 어긋난 곳이에요. 어느 구간 안쪽인지 고르세요.`);
    const timer = window.setTimeout(() => setPhase("section"), 900);
    return () => clearTimeout(timer);
  }, [cleared, focus, phase]); // eslint-disable-line react-hooks/exhaustive-deps
  // 6) section inside the first deviation
  const pickSection = (label: string) => {
    const choice = data.section.choices.find(c => c.label === label)!;
    setSectionPick(label); setBubble(choice.why);
    if (choice.ok) { showVerdict(true, "의심 구간"); window.setTimeout(() => setPhase("done"), 900); }
    else { setMistakes(n => n + 1); showVerdict(false); }
  };
  const traps = measured.filter(id => stamps[id] === "refuted" && dom(id).status === "bad");
  const effects = [...chain.filter(id => id !== data.first), ...traps].map(dom);
  const finish = () => {
    try { sessionStorage.setItem(`tb-impact-${caseId}`, JSON.stringify(effects.map(d => `${d.label} 정상 복귀 (기준 ${refText(d)})`))); } catch { /* ignore */ }
    const evidence = data.doms.filter(d => d.ev && (chain.includes(d.id) || measured.includes(d.id))).map(d => d.ev!);
    evidence.filter(id => !state.evidence[caseId].includes(id)).forEach(id => send({ type: "RECORD_EVIDENCE", id }));
    if (state.hypothesis[caseId] !== scenario.root) send({ type: "SELECT_HYPOTHESIS", id: scenario.root });
    try { sessionStorage.setItem(`tb-section-${caseId}`, data.section.name); } catch { /* ignore */ }
    send({ type: "OPEN_WIRING" });
  };
  const reveal = () => { // dev
    const route: string[] = []; for (let id: string | undefined = data.start; id; id = causesOf(id).find(c => dom(c).status === "bad" && (dom(c).t ?? 0) < (dom(id!).t ?? 0))) route.push(id);
    setChain(route); setMeasured(route.flatMap(causesOf)); setStamps(Object.fromEntries(route.flatMap(causesOf).map(id => [id, route.includes(id) ? "likely" : "refuted"]))); setSectionPick(data.section.choices.find(c => c.ok)!.label); setPhase("done");
  };

  // board: every node of the case, placed by zone; lines from the current suspects to the current output
  const boardRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ d: string; hot: boolean }[]>([]);
  useLayoutEffect(() => {
    const root = boardRef.current; if (!root) return;
    const draw = () => {
      const base = root.getBoundingClientRect();
      const center = (id: string) => { const r = root.querySelector<HTMLElement>(`[data-node="${id}"]`)?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top } : null; };
      const pairs: [string, string, boolean][] = [];
      chain.forEach((id, i) => { if (i > 0) pairs.push([id, chain[i - 1], false]); });
      if (phase === "trace" && focus) suspects.forEach(id => pairs.push([id, focus, true]));
      setLines(pairs.map(([a, b, hot]) => { const p = center(a), q = center(b); if (!p || !q) return null; const mx = (p.x + q.x) / 2; return { d: `M${p.x} ${p.y} C${mx} ${p.y} ${mx} ${q.y} ${q.x} ${q.y}`, hot }; }).filter(Boolean) as { d: string; hot: boolean }[]);
    };
    draw();
    const observer = new ResizeObserver(draw); observer.observe(root);
    return () => observer.disconnect();
  }, [chain.join("|"), focus, phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const nodeState = (id: string) => chain.includes(id) ? (id === focus && phase === "trace" ? "focus" : "likely") : stamps[id] === "refuted" ? "refuted" : phase === "trace" && suspects.includes(id) ? "suspect" : phase === "output" && dom(id).zone === "차량" ? "pickable" : "idle";

  const mugStatus = (id: string): keyof typeof STAMP_KO => stamps[id] ?? (measured.includes(id) ? "measured" : "untested");
  const evidenceCards = [start, ...measured.map(dom)].filter((d, i, all) => all.findIndex(x => x.id === d.id) === i);

  return <div className="dtBoard eeTrace">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="원인 추적" title="도미노 역추적" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <main className="dtLayout etLayout">
      {/* top-left: case & evidence */}
      <section className="etEvidence">
        <header><b><Icon name="camera" /> 사건·증거</b><small>{scenario.title}</small></header>
        {phase === "evidence" ? <div className="etFind">
          <button className="etPol quote" onClick={() => findEvidence("quote")}><i><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /></i><b>{DRIVER} 진술</b><em>"{QUOTE[caseId]}"</em></button>
          <button className="etPol lamp" onClick={() => findEvidence("lamp")}><i><Icon name="warning" /></i><b>{LAMP[caseId].label}</b><em>{LAMP[caseId].note}</em></button>
          <button className="etPol record" onClick={() => findEvidence("record")}><span className="etPair"><span><Photo src={start.img} /><small>기준 주행</small></span><span className="odd"><Photo src={start.img} /><small>이번 주행</small></span></span><b>주행 기록 · {start.label}</b><Gauge dom={start} /><em className="etLoupe"><Icon name="search" /> 다른 곳 찾기</em></button>
        </div> : <ul className="etCards">{evidenceCards.map(d => <li key={d.id} className={`s-${d.status}`}><Photo src={d.img} /><span><b>{d.label}</b><Gauge dom={d} /></span></li>)}</ul>}
      </section>

      {/* top-right: whole-vehicle E/E board */}
      <section className={`etBoard phase-${phase}`} ref={boardRef}>
        <header><b><Icon name="layers" /> 차량 E/E 아키텍처</b><small>{phase === "output" ? "증거에 나온 증상을 만드는 출력을 고르세요" : phase === "trace" ? `지금 출력: ${dom(focus).label}` : "센서 → 제어기 → CAN → 부품 → 차량"}</small></header>
        <svg className="etLines">{lines.map((l, i) => <path key={i} d={l.d} className={l.hot ? "hot" : "path"} />)}</svg>
        <div className="etZones">{ZONES.map(zone => <div key={zone} className="etZone">
          <small><Icon name={ZONE_ICON[zone]} /> {zone}</small>
          {zone === "제어기" && <div className="etEcus">{OTHER_ECUS.map(name => <i key={name}>{name}</i>)}</div>}
          {data.doms.filter(d => d.zone === zone).map(d => { const st = nodeState(d.id); return <button key={d.id} data-node={d.id} className={`etNode n-${st} ${shake === d.id ? "shake" : ""}`} onClick={() => pickNode(d.id)} disabled={st === "idle" || st === "refuted"}>{d.label}{st === "likely" && <em>유력</em>}{st === "refuted" && <em>반박</em>}</button>; })}
        </div>)}</div>
        {phase === "done" && <div className="etFall"><DominoFall chain={[...chain].reverse()} traps={traps} parentOf={id => chain.find(c => causesOf(c).includes(id)) ?? data.start} labelOf={id => dom(id).label} /></div>}
      </section>

      {/* bottom: mugshot row */}
      <section className="etMugs">
        {phase === "evidence" || phase === "output" ? <p className="etEmpty"><Icon name="detective" /> 출력을 고르면, 그 출력에 영향을 준 부품이 여기에 용의자로 올라와요.</p>
          : phase === "trace" ? suspects.map((id, k) => { const d = dom(id), st = mugStatus(id); return <article key={id} className={`etMug m-${st} ${shake === id ? "shake" : ""}`}>
            <header><span>용의자 {String(k + 1).padStart(2, "0")}</span><em className={`stamp st-${st}`}>{STAMP_KO[st]}</em></header>
            <div className="etMugPhoto"><Photo src={d.img} /><i className="etHeights" /></div>
            <b>{d.label}</b><small>{d.zone}</small>
            {st === "untested" ? <button className="etMeasure" onClick={() => measure(id)}><Icon name="search" /> 재기</button>
              : st === "measured" ? <><Gauge dom={d} /><span className="etStampBtns"><button onClick={() => stamp(id, "refuted")}>반박</button><button onClick={() => stamp(id, "likely")}>유력</button></span></>
                : <Gauge dom={d} />}
          </article>; })
            : <div className="etCarry">
              {phase === "section" ? <><h3><Icon name="target" /> 처음 어긋난 곳: {dom(data.first).label} · 어느 구간 안쪽일까요?</h3>
                <div className="etSecs">{data.section.choices.map(c => <button key={c.label} className={sectionPick === c.label ? c.ok ? "right" : "wrong" : ""} onClick={() => pickSection(c.label)}>{c.label}</button>)}</div></>
                : <><h3><Icon name="clipboard" /> 원인은 아직 확정하지 않아요 · 검증 단계로 넘기는 용의자</h3>
                  <div className="etCarryRow">{meta.hypotheses.map(h => <span key={h.id} className={h.stage1 ? "out" : "hold"}><b>{h.label}</b><em>{h.stage1 ? STAMP_KO.refuted : STAMP_KO.hold}</em></span>)}</div>
                  <div className="etNext"><span>회귀 시험 {effects.length}곳 · {"★".repeat(stars)}{"☆".repeat(3 - stars)}</span><button className="dtNext" onClick={finish}>다음: 요구사항 기반 로직 퍼즐 →</button></div></>}
            </div>}
      </section>

      <div className="etBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{bubble}</p></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={reveal}>정답 보기</button>
  </div>;
}



// ===== v3: the garage E/E viewer on the left, evidence polaroids on the right (output side) =====
// Memo-board simple: click parts on the E/E viewer to measure them (each adds a polaroid on the right),
// then point at the part where things first went wrong (input normal, output abnormal), then pick the section.
type Role = "input" | "control" | "network" | "actuator" | "result";
type TNode = { label: string; role: Role; dom: string };
const TRACE: Record<string, { chain: TNode[]; signals: string[]; first: number }> = {
  propulsion: { first: 1, signals: ["페달 %", "토크 요청", "CAN 토크 명령", "모터 토크"], chain: [
    { label: "APS 이중 센서", role: "input", dom: "aps" }, { label: "VCU", role: "control", dom: "vcu_in" }, { label: "CAN 토크 명령", role: "network", dom: "can_cmd" },
    { label: "인버터·모터", role: "actuator", dom: "motor_tq" }, { label: "차량 가속", role: "result", dom: "accel" }] },
  thermal: { first: 1, signals: ["팬 PWM 명령", "냉각 바람", "냉각수 °C", "출력 허용"], chain: [
    { label: "Thermal ECU", role: "control", dom: "fan_cmd" }, { label: "냉각 팬", role: "actuator", dom: "fan_rpm" }, { label: "냉각수 온도 센서", role: "input", dom: "coolant" },
    { label: "VCU", role: "control", dom: "derate" }, { label: "차량 가속", role: "result", dom: "accel" }] },
  brake: { first: 2, signals: ["페달 %", "압력 명령", "제동력"], chain: [
    { label: "페달 센서", role: "input", dom: "bpp" }, { label: "Brake ECU", role: "control", dom: "p_cmd" }, { label: "유압 모듈레이터·캘리퍼", role: "actuator", dom: "caliper" },
    { label: "차량 감속", role: "result", dom: "decel" }] },
};

export function EeTrace({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const scenario = SCENARIOS[caseId];
  const data = CASES[caseId];
  const meta = SCENARIO_META[caseId];
  const trace = TRACE[caseId];
  const chain = trace.chain;
  const last = chain.length - 1;
  const dom = (id: string) => data.doms.find(item => item.id === id)!;
  const [measured, setMeasured] = useState<number[]>([last]);
  const [picking, setPicking] = useState(false);
  const [found, setFound] = useState(false);
  const [sectionPick, setSectionPick] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [bubble, setBubble] = useState(`오른쪽 증거는 '${dom(chain[last].dom).label}'이에요. 왼쪽 E/E 그림에서 출력 쪽부터 부품을 눌러 재 보세요.`);
  const isBad = (i: number) => dom(chain[i].dom).status === "bad";
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const pick = (i: number) => {
    if (done || found) return;
    if (picking) {
      if (i === trace.first) {
        if (!measured.includes(i) || (i > 0 && !measured.includes(i - 1))) { setBubble("그 부품과 바로 앞 부품을 모두 재 봐야 확신할 수 있어요."); play("error"); return; }
        setFound(true); setPicking(false); showVerdict(true, "처음 어긋남"); play("success");
        setBubble(`들어오는 값은 정상인데 ${chain[i].label}에서 나가는 값부터 이상해요. 의심 구간을 고르세요.`);
        return;
      }
      setMistakes(n => n + 1); showVerdict(false);
      setBubble(!isBad(i) ? `${chain[i].label}${josa(chain[i].label, "은", "는")} 정상이에요. 이상이 시작된 곳이 아니에요.` : `${chain[i].label}보다 앞쪽에서도 이미 이상해요. 더 앞을 보세요.`);
      return;
    }
    if (measured.includes(i)) return;
    setMeasured(previous => [...previous, i]);
    const d = dom(chain[i].dom);
    play("zip"); window.setTimeout(() => play(d.status === "bad" ? "stamp" : "pop"), 160);
    setBubble(d.status === "bad" ? `${chain[i].label}: 기준과 달라요. 더 앞쪽도 재 보세요.` : `${chain[i].label}: 기준과 같아요(정상). 이 다음부터 이상하다면 그곳이 처음 어긋난 곳이에요.`);
  };
  const pickSection = (label: string) => {
    const choice = data.section.choices.find(c => c.label === label)!;
    setSectionPick(label); setBubble(choice.why);
    if (choice.ok) { showVerdict(true, "의심 구간"); window.setTimeout(() => setDone(true), 800); }
    else { setMistakes(n => n + 1); showVerdict(false); }
  };
  const effects = chain.filter((_, i) => i > trace.first && isBad(i)).map(node => dom(node.dom));
  const finish = () => {
    try { sessionStorage.setItem(`tb-impact-${caseId}`, JSON.stringify(effects.map(d => `${d.label} 정상 복귀 (기준 ${refText(d)})`))); } catch { /* ignore */ }
    const evidence = measured.map(i => dom(chain[i].dom)).filter(d => d.ev).map(d => d.ev!);
    evidence.filter(id => !state.evidence[caseId].includes(id)).forEach(id => send({ type: "RECORD_EVIDENCE", id }));
    if (state.hypothesis[caseId] !== scenario.root) send({ type: "SELECT_HYPOTHESIS", id: scenario.root });
    try { sessionStorage.setItem(`tb-section-${caseId}`, data.section.name); } catch { /* ignore */ }
    send({ type: "OPEN_WIRING" });
  };
  const reveal = () => { setMeasured(chain.map((_, i) => i)); setFound(true); setSectionPick(data.section.choices.find(c => c.ok)!.label); setDone(true); };
  const marks: Record<number, "ok" | "bad" | "first" | "next"> = {};
  chain.forEach((_, i) => { marks[i] = found && i === trace.first ? "first" : measured.includes(i) ? (isBad(i) ? "bad" : "ok") : "next"; });
  const order = [...measured].sort((a, b) => b - a); // output first

  return <div className="dtBoard tbTrace">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="원인 추적" title="도미노 역추적" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <StageIntro id="trace-v3" title="도미노 역추적" goal="증상에서 거꾸로 따라가 처음 쓰러진 도미노, 즉 처음 어긋난 곳을 찾아요. 원인은 검증 단계에서 시험으로 확인해요." steps={[
      { icon: "layers", text: "왼쪽 E/E 그림에서 부품을 눌러 재요. 오른쪽에 증거 사진이 쌓여요." },
      { icon: "search", text: "출력 쪽부터 거꾸로. 정상인 부품 바로 다음에서 이상이 시작되면 그곳이 처음 어긋난 곳이에요." },
      { icon: "target", text: "'처음 어긋난 곳 지목'을 누르고 그 부품을 고른 뒤, 안쪽 의심 구간을 골라요." },
    ]} />
    <main className="dtLayout tbLayout">
      <section className={`tbBoard ${picking ? "picking" : ""}`}>
        <header><b><Icon name="layers" /> 차량 E/E 아키텍처</b><small>{picking ? "처음 어긋난 부품을 누르세요" : "부품을 눌러 재기 · 신호는 → 방향으로 흘러요"}</small></header>
        <EeBlueprint chain={chain.map(node => node.label)} roles={chain.map(node => node.role)} active={chain.length} removed={null} onPick={pick} signals={trace.signals} marks={marks} />
      </section>
      <aside className="tbEvidence">
        <header><b><Icon name="camera" /> 증거</b><small>{scenario.title}</small></header>
        <ul>{order.map(i => { const d = dom(chain[i].dom); return <li key={i} className={`s-${d.status} ${found && i === trace.first ? "first" : ""}`}>
          <Photo src={d.img} /><span><b>{i === last ? "증상 · " : ""}{d.label}</b><Gauge dom={d} /></span><em className={`tbStamp ${d.status === "bad" ? "bad" : "ok"}`}>{d.status === "bad" ? "이상" : "정상"}</em>
        </li>; })}</ul>
        <div className="tbAct">
          {!found ? <button className={`tbPick ${picking ? "on" : ""}`} onClick={() => { setPicking(v => !v); play("pop"); setBubble(picking ? "측정을 계속하세요." : "처음 어긋난 부품을 왼쪽 그림에서 누르세요."); }}><Icon name="target" /> {picking ? "지목 취소" : "처음 어긋난 곳 지목"}</button>
            : !done ? <div className="tbSecs"><small>처음 어긋난 곳: {chain[trace.first].label} · 의심 구간을 고르세요</small>{data.section.choices.map(c => <button key={c.label} className={sectionPick === c.label ? c.ok ? "right" : "wrong" : ""} onClick={() => pickSection(c.label)}>{c.label}</button>)}</div>
              : <div className="tbCarry"><small>검증 단계로 넘기는 용의자</small><div>{meta.hypotheses.map(h => <span key={h.id} className={h.stage1 ? "out" : "hold"}><b>{h.label}</b><em>{h.stage1 ? "반박됨" : "판단 보류"}</em></span>)}</div>
                <button className="dtNext" onClick={finish}>다음: 요구사항 기반 로직 퍼즐 → <span>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span></button></div>}
        </div>
      </aside>
      <div className="etBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{bubble}</p></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={reveal}>정답 보기</button>
  </div>;
}
