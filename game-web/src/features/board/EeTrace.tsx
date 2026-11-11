// Stage 1 · 원인 역추적 (docs/PLAY_FLOW_V2_2026-11-08.md)
// Layout: top-left evidence polaroids | top-right whole-vehicle E/E board, bottom: mugshot suspects row.
// 1) find the odd one in the evidence (this drive vs reference) → 2) pick that output on the E/E board
// 3) every part that feeds that output lights up as a mugshot → 4) measure one, then stamp it yourself:
//    normal → 반박, changed LATER than the output → 반박 (it is an effect), changed EARLIER → 유력 (new output)
// 5) when every suspect of the current output is cleared, that output is where things first went wrong
// 6) pick the section inside it; hypotheses that this stage cannot split are carried as 판단 보류.
// Measured values come from the same case data as before (DominoTrace CASES). The old DominoTrace stays unused.
import { numify } from "../../ui/numify";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Campaign } from "../../game/runtime";
import { SCENARIOS, SCENARIO_META } from "../../game/scenarios";
import { GameHeader, SceneBackdrop, StageFolderSubtitle } from "../../ui/game-shell";
import { play } from "../../ui/sfx";
import { PursuitRouteBar } from "../../experiences";
import { DRIVER, ENGINEER } from "../../game/cast";
import { Icon } from "../../ui/Icon";
import { StageIntro, showVerdict } from "../../ui/Verdict";
import { OpenBookButton } from "../../ui/OpenBook";
import { CASES, Gauge, Photo, ZONES, ZONE_ICON, fmt, josa, refText, type Dom } from "./DominoTrace";
import { EeBlueprint } from "../garage/EeBlueprint";
import { ReplayConfirm } from "../../ui/ReplayConfirm";

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
  const progressKey = `tb-step02-progress-${caseId}`;
  const saved = (() => { try { return JSON.parse(sessionStorage.getItem(progressKey) ?? "null") ?? {}; } catch { return {}; } })();

  const [phase, setPhase] = useState<"evidence" | "output" | "trace" | "section" | "done">(saved.phase ?? "evidence");
  const [chain, setChain] = useState<string[]>(saved.chain ?? []);          // outputs followed so far (symptom → … backward)
  const [measured, setMeasured] = useState<string[]>(saved.measured ?? []);
  const [stamps, setStamps] = useState<Record<string, Stamp>>(saved.stamps ?? {});
  const [mistakes, setMistakes] = useState<number>(saved.mistakes ?? 0);
  const [sectionPick, setSectionPick] = useState<string | null>(saved.sectionPick ?? null);
  const [shake, setShake] = useState("");
  const [replayed, setReplayed] = useState(Boolean(saved.replayed));
  const [zoomPol, setZoomPol] = useState<string | null>(null);
  const [evidencePage, setEvidencePage] = useState<number>(saved.evidencePage ?? 0);
  const [attached, setAttached] = useState<string[]>(saved.attached ?? []);
  const [sorted, setSorted] = useState<Record<string, "out" | "hold">>(saved.sorted ?? {});
  // T-25: the hypothesis carried to STEP03 is the player's own choice among the hypotheses they kept (보류), never the answer key.
  const [carry, setCarry] = useState<string>(saved.carry ?? "");
  const [memoTab, setMemoTab] = useState<"evidence" | "stack">(saved.memoTab ?? "evidence");
  const [bubble, setBubble] = useState(saved.bubble ?? `왼쪽 폴라로이드를 눌러 크게 보세요. 기준과 비교할 수 있는 기록에서 다른 곳을 찾으세요.`);
  const [replayOpen, setReplayOpen] = useState(false);
  const focus = chain[chain.length - 1];
  const suspects = focus ? causesOf(focus) : [];
  const cleared = suspects.length > 0 && suspects.every(id => stamps[id] === "refuted");
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  useEffect(() => { try { sessionStorage.setItem(progressKey, JSON.stringify({ phase, chain, measured, stamps, mistakes, sectionPick, replayed, evidencePage, attached, sorted, memoTab, bubble, carry })); } catch { /* ignore */ } }, [phase, chain, measured, stamps, mistakes, sectionPick, replayed, evidencePage, attached, sorted, memoTab, bubble, carry, progressKey]);
  const resetStage = () => { setPhase("evidence"); setChain([]); setMeasured([]); setStamps({}); setMistakes(0); setSectionPick(null); setReplayed(false); setZoomPol(null); setEvidencePage(0); setAttached([]); setSorted({}); setCarry(""); setMemoTab("evidence"); setBubble("운전자 진술과 계기판 정보를 확인해 보세요."); try { sessionStorage.removeItem(progressKey); sessionStorage.removeItem(`tb-impact-${caseId}`); sessionStorage.removeItem(`tb-section-${caseId}`); sessionStorage.removeItem(`tb-step03-progress-${caseId}`); sessionStorage.removeItem(`tb-step04-progress-${caseId}`); sessionStorage.removeItem(`tb-expect-${caseId}`); sessionStorage.removeItem(`tb-verification-contract-${caseId}`); } catch { /* ignore */ } };
  const nope = (id: string, text: string) => { setBubble(text); setShake(id); setMistakes(n => n + 1); showVerdict(false); window.setTimeout(() => setShake(""), 420); };

  // 1) initial observations orient the learner; the output polaroid is earned
  // only after the E/E output has been investigated and is attached by choice.
  const findEvidence = (which: "quote" | "lamp" | "record") => {
    if (phase !== "evidence") return;
    if (which === "lamp") { play("pop"); setBubble("계기판 정보는 결과일 수 있어요. 운전자 진술로 증상을 먼저 확인하세요."); return; }
    play("stamp"); showVerdict(true, "증상 확인"); setZoomPol(null);
    setPhase("output");
    setBubble(`${QUOTE[caseId]} E/E 판에서 이 증상을 만드는 출력 '${start.label}'을 고르세요.`);
  };
  // 2) pick the output on the board
  const pickNode = (id: string) => {
    if (phase === "output") {
      if (id !== data.start) { nope(id, `${dom(id).label}${josa(dom(id).label, "은", "는")} 증거에 나온 증상이 아니에요. 증거는 '${start.label}'이에요.`); return; }
      play("zip"); setChain([id]); setPhase("trace");
      setBubble(`${start.label}${josa(start.label, "을", "를")} 확인한 폴라로이드가 아래에 나왔어요. 증거판에 붙인 뒤, 입력을 재생하고 용의자를 하나씩 재 보세요.`);
      return;
    }
    if (phase === "trace" && suspects.includes(id)) measure(id);
  };
  // 4) measure one suspect, then the player stamps it
  const measure = (id: string) => {
    if (!replayed) { setBubble("먼저 '고장 당시 입력 재생'을 눌러 같은 입력을 다시 넣어야 잴 수 있어요."); play("error"); return; }
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
  const replay = () => { if (replayed) return; setReplayed(true); play("zip"); setBubble("고장 당시와 같은 입력을 다시 넣었어요. 용의자를 하나씩 재 보세요."); };
  const sortHyp = (id: string, pick: "out" | "hold") => {
    const h = meta.hypotheses.find(item => item.id === id)!;
    const right = h.stage1 ? "out" : "hold";
    if (pick !== right) { setMistakes(n => n + 1); showVerdict(false); setBubble(pick === "out" ? `'${h.label}'을(를) 배제할 측정값은 아직 없어요. 검증에서 시험해요.` : `${h.stage1} 그래서 이 가설은 반박돼요.`); return; }
    setSorted(previous => ({ ...previous, [id]: pick })); play(pick === "out" ? "stamp" : "pop");
    setBubble(pick === "out" ? `${h.stage1 ?? ""} 반박했어요.` : `'${h.label}'은(는) 측정만으로 가를 수 없어요. 검증으로 넘겨요.`);
  };
  const allSorted = meta.hypotheses.every(h => sorted[h.id]);
  const heldIds = meta.hypotheses.filter(h => sorted[h.id] === "hold").map(h => h.id);
  // SW-only policy: a hardware hypothesis can stay 보류 as an educational counter-example but is never carried into STEP03/04.
  const isHw = (id: string) => /\(HW\)/.test(meta.hypotheses.find(h => h.id === id)?.label ?? "");
  const carryPool = heldIds.filter(id => !isHw(id)).length ? heldIds.filter(id => !isHw(id)) : heldIds;
  const carryId = carryPool.length === 1 ? carryPool[0] : carryPool.includes(carry) ? carry : "";
  const traps = measured.filter(id => stamps[id] === "refuted" && dom(id).status === "bad");
  const effects = [...chain.filter(id => id !== data.first), ...traps].map(dom);
  const finish = () => {
    try { sessionStorage.setItem(`tb-impact-${caseId}`, JSON.stringify(effects.map(d => `${d.label} 정상 복귀 (기준 ${refText(d)})`))); } catch { /* ignore */ }
    const evidence = data.doms.filter(d => d.ev && (chain.includes(d.id) || measured.includes(d.id))).map(d => d.ev!);
    evidence.filter(id => !state.evidence[caseId].includes(id)).forEach(id => send({ type: "RECORD_EVIDENCE", id }));
    if (carryId && state.hypothesis[caseId] !== carryId) send({ type: "SELECT_HYPOTHESIS", id: carryId });
    try { sessionStorage.setItem(`tb-section-${caseId}`, data.section.name); } catch { /* ignore */ }
    send({ type: "OPEN_WIRING" });
  };
  const reveal = () => { // dev
    const route: string[] = []; for (let id: string | undefined = data.start; id; id = causesOf(id).find(c => dom(c).status === "bad" && (dom(c).t ?? 0) < (dom(id!).t ?? 0))) route.push(id);
    setChain(route); setMeasured(route.flatMap(causesOf)); setStamps(Object.fromEntries(route.flatMap(causesOf).map(id => [id, route.includes(id) ? "likely" : "refuted"]))); setSectionPick(data.section.choices.find(c => c.ok)!.label); setReplayed(true); setCarry(meta.hypotheses.find(h => h.truth)?.id ?? ""); setSorted(Object.fromEntries(meta.hypotheses.map(h => [h.id, h.stage1 ? "out" : "hold"])) as Record<string, "out" | "hold">); setPhase("done");
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

  // Initial evidence is intentionally limited to the driver statement and cluster.
  // E/E output and measurement polaroids are earned below, then attached by the learner.
  const obs = OBSERVED[caseId];
  type Pol = { id: string; kind: string; title: string; sub: string; photo: React.ReactNode; dom?: Dom };
  const evidenceCards = [...(chain.length ? [start] : []), ...measured.map(dom)].filter((d, i, all) => all.findIndex(x => x.id === d.id) === i);
  const pols: Pol[] = [
    { id: "quote", kind: "quote", title: `${DRIVER} 진술`, sub: "운전자 체감", photo: <img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /> },
    { id: "lamp", kind: "lamp", title: "계기판", sub: LAMP[caseId].label, photo: <span className="polIcon"><Icon name="warning" /></span> },
    ...evidenceCards.map(d => ({ id: d.id, kind: `m s-${d.status}`, title: d.label, sub: attached.includes(d.id) ? "증거판에 부착됨" : "증거판에 붙이기", photo: <Photo src={d.img} />, dom: d })),
  ];
  const zoomed = pols.find(item => item.id === zoomPol);
  const evidencePages = Math.max(1, Math.ceil(pols.length / 6));
  const visiblePols = pols.slice(evidencePage * 6, evidencePage * 6 + 6);
  const coach = state.completedCases.length ? "" : phase === "evidence" ? "evidence" : phase === "output" ? "output" : phase === "trace" ? (replayed ? "measure" : "replay") : phase === "section" ? "section" : !allSorted ? "sort" : "next";
  const mugStatus = (id: string): keyof typeof STAMP_KO => stamps[id] ?? (measured.includes(id) ? "measured" : "untested");
  const stackCandidates = [...new Set([...chain, ...measured, ...Object.keys(stamps)])].map(dom);
  const attachEvidence = (id: string) => { setAttached(previous => previous.includes(id) ? previous : [...previous, id]); play("stamp"); setBubble(`${dom(id).label} 폴라로이드를 증거판에 붙였어요.`); };

  return <div className="dtBoard eeTrace" data-coach={coach}>
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="원인 추적" title="도미노 역추적" distanceMeters={state.policeGapMeters} raceDistanceMeters={state.raceDistance} progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <StageFolderSubtitle className="etStageFolder" action="관찰한 이상 증상에서 출발해 고장 원인 후보를 좁히세요." detail={<>출발 증거: {scenario.symptom} <i>|</i> 추적 대상: 신호·제어 경로</>} />
    <StageIntro id="trace-v2" title="도미노 역추적" goal="증상에서 거꾸로 따라가 처음 쓰러진 도미노를 찾아요. 원인은 검증 단계에서 시험으로 확인해요." steps={[
      { icon: "camera", text: "폴라로이드를 눌러 크게 보고, 기준과 다른 기록을 찾아요." },
      { icon: "layers", text: "E/E 판에서 그 증상을 만든 출력을 고르면 용의자가 아래에 올라와요." },
      { icon: "search", text: "입력을 재생하고 용의자를 하나씩 재서 반박·유력 도장을 찍어요." },
    ]} />
    <main className="dtLayout etLayout">
      {/* right: independent evidence rail */}
      <section className="etEvidence">
        <header><b><Icon name="camera" /> {memoTab === "evidence" ? "관찰·계측 증거" : "추리 보드"}</b><small>{memoTab === "evidence" ? `실제 획득 기록 · ${scenario.title}` : "역추적 스택"}</small><nav className="etEvidenceTabs" role="tablist" aria-label="증거와 추리 기록 보기"><button role="tab" aria-selected={memoTab === "evidence"} className={memoTab === "evidence" ? "on" : ""} onClick={() => setMemoTab("evidence")}>관찰·계측 증거</button><button role="tab" aria-selected={memoTab === "stack"} className={memoTab === "stack" ? "on" : ""} onClick={() => setMemoTab("stack")}>추리 보드</button></nav><OpenBookButton caseId={caseId} /></header>
        <div className="etEvidenceContent">{memoTab === "evidence" ? <><div className="polBoard" role="tabpanel" aria-label="관찰·계측 증거">{visiblePols.map(item => <button key={item.id} className={`pol ${item.kind} ${item.id === "quote" && phase === "evidence" ? "find" : ""}`} onClick={() => { if (item.id === "quote" && phase === "evidence") findEvidence("quote"); else if (item.dom && !attached.includes(item.id)) attachEvidence(item.id); else { setZoomPol(item.id); play("pop"); } }}>
          <i className="pin" /><span className="polPhoto">{item.photo}</span><b>{item.title}</b><small>{item.sub}</small>
        </button>)}</div>{evidencePages > 1 && <div className="polPager"><button disabled={evidencePage === 0} onClick={() => setEvidencePage(page => Math.max(0, page - 1))}>이전 묶음</button><span>{evidencePage + 1}/{evidencePages}</span><button disabled={evidencePage >= evidencePages - 1} onClick={() => setEvidencePage(page => Math.min(evidencePages - 1, page + 1))}>다음 증거 묶음</button></div>}</> : <div className="etEvidenceStack" role="tabpanel" aria-label="추리 보드"><section className="etReasonPath"><small>역추적 스택 · 위가 최근에 찾은 단계</small><div className="etStack">{chain.length ? [...chain].map((id, index) => ({ id, index })).reverse().map(({ id, index }, row) => <React.Fragment key={id}><span className={row === 0 ? "top" : ""}><i>{index + 1}</i>{dom(id).label}</span>{row < chain.length - 1 && <em aria-hidden="true">↓</em>}</React.Fragment>) : <p>출력 조사 전</p>}</div></section></div>}</div>
      </section>

      {/* center: whole-vehicle reverse trace */}
      <section className={`etBoard phase-${phase}`} ref={boardRef}>
        <header><b><Icon name="layers" /> 중앙 도미노 역추적</b><small>{phase === "output" ? "증거에 나온 증상을 만드는 출력을 고르세요" : phase === "trace" ? `지금 출력: ${dom(focus).label}` : "센서 → 제어기 → CAN → 부품 → 차량"}</small>{phase === "done" && <button className="stageReplayBtn etStageReplay" onClick={() => setReplayOpen(true)}>다시 풀기</button>}</header>
        <svg className="etLines">{lines.map((l, i) => <path key={i} d={l.d} className={l.hot ? "hot" : "path"} />)}</svg>
        <div className="etZones">{ZONES.map(zone => <div key={zone} className="etZone">
          <small><Icon name={ZONE_ICON[zone]} /> {zone}</small>
          {zone === "제어기" && <div className="etEcus">{OTHER_ECUS.map(name => <i key={name}>{name}</i>)}</div>}
          {data.doms.filter(d => d.zone === zone).map(d => { const st = nodeState(d.id); return <button key={d.id} data-node={d.id} className={`etNode n-${st} ${shake === d.id ? "shake" : ""}`} onClick={() => pickNode(d.id)} disabled={st === "idle" || st === "refuted"}>{d.label}{st === "likely" && <em>유력</em>}{st === "refuted" && <em>반박</em>}</button>; })}
        </div>)}</div>
        {phase === "done" && <div className="etTraceSummary"><small>출력에서 상류로 거슬러 올라간 경로 · 위가 최초 편차 쪽</small><div className="etStack">{[...chain].reverse().map((id, row) => <React.Fragment key={id}><span className={row === 0 ? "top" : ""}>{dom(id).label}</span>{row < chain.length - 1 && <i aria-hidden="true">↓</i>}</React.Fragment>)}</div><em>최초 편차는 의심 구간입니다. 최종 원인은 다음 시험으로 구분합니다.</em></div>}
      </section>

      {/* bottom: tactile memo board */}
      <section className="etMugs">
        {phase === "evidence" || phase === "output" ? <div className="etMemoSeed"><p className="etEmpty"><Icon name="detective" /> 출력을 고르면, 그 출력에 영향을 준 부품이 압정 카드로 올라와요.</p><div><span><small>관찰 사실</small><b>{start.label} 기준 이탈</b></span><span><small>최초 편차</small><b>아직 추적 전</b></span><span><small>원인 후보</small><b>검증 전에는 확정하지 않음</b></span></div></div>
          : phase === "trace" ? <><div className="etMugHead"><button className={`etReplay ${replayed ? "on" : ""}`} onClick={replay}>{replayed ? "✓ 입력 재생 중" : "▶ 고장 당시 입력 재생"}</button><small>지금 출력: {dom(focus).label} · 영향을 준 부품 {suspects.length}개</small></div><div className="etCandidateRow">{suspects.map((id, k) => { const d = dom(id), st = mugStatus(id); return <article key={id} className={`etMug m-${st} ${shake === id ? "shake" : ""}`}>
            <header><span>용의자 {String(k + 1).padStart(2, "0")}</span><em className={`stamp st-${st}`}>{STAMP_KO[st]}</em></header>
            <div className="etMugPhoto"><Photo src={d.img} /><i className="etHeights" /></div>
            <b>{d.label}</b><small>{d.zone}</small>
            {st === "untested" ? <button className="etMeasure" onClick={() => measure(id)}><Icon name="search" /> 재기</button>
              : st === "measured" ? <><Gauge dom={d} /><span className="etStampBtns"><button onClick={() => stamp(id, "refuted")}>반박</button><button onClick={() => stamp(id, "likely")}>유력</button></span></>
                : <Gauge dom={d} />}
          </article>; })}</div></>
            : <div className="etCarry">
              {phase === "section" ? <>{SUBSYS[caseId] && <div className="etZoom inline"><b><Icon name="search" /> {SUBSYS[caseId].where} 안 들여다보기</b>
                <div className="etZoomRow"><span className="io ok">들어오는 값<em>{SUBSYS[caseId].inLabel}</em></span>{SUBSYS[caseId].stages.map(st => <React.Fragment key={st}><i>→</i><span className="stage">{st}<em>?</em></span></React.Fragment>)}<i>→</i><span className="io bad">나가는 값<em>{SUBSYS[caseId].outLabel}</em></span></div></div>}
                <h3><Icon name="target" /> 처음 어긋난 곳: {dom(data.first).label} · 의심 구간은 어디일까요?</h3>
                <div className="etSecs">{data.section.choices.map(c => <button key={c.label} className={sectionPick === c.label ? c.ok ? "right" : "wrong" : ""} onClick={() => pickSection(c.label)}>{c.label}</button>)}</div></>
                : <><h3><Icon name="clipboard" /> 가설 정리 · 반박 또는 보류</h3>
                  <div className="etCarryRow tbSort">{meta.hypotheses.map(h => <span key={h.id} className={sorted[h.id] ?? "todo"}><b>{h.label}</b>{sorted[h.id] ? <><em>{sorted[h.id] === "out" ? STAMP_KO.refuted : STAMP_KO.hold}</em>{sorted[h.id] === "hold" && carryPool.length > 1 && carryPool.includes(h.id) && <button className={`etCarryPick ${carryId === h.id ? "on" : ""}`} aria-pressed={carryId === h.id} onClick={() => { setCarry(h.id); play("pop"); }}>{carryId === h.id ? "✓ 먼저 확인" : "먼저 확인할 가설로"}</button>}</> : <><button onClick={() => sortHyp(h.id, "out")}>반박</button><button onClick={() => sortHyp(h.id, "hold")}>보류</button></>}</span>)}</div>
                  <div className="etNext"><span>{allSorted && carryPool.length > 1 && !carryId ? "보류한 가설 중 먼저 확인할 가설을 하나 고르세요 · " : ""}회귀 시험 {effects.length}곳 · {"★".repeat(stars)}{"☆".repeat(3 - stars)}</span></div></>}
            </div>}
      </section>

      <div className="etBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{numify(bubble)}</p><span className="etProgressSlot"><button className="dtNext stageProgressAction" disabled={phase !== "done" || !allSorted || !carryId} onClick={finish}>다음: 요구사항 기반 로직 퍼즐 →</button></span></div>
    </main>
    {zoomed && <div className="polZoom" onClick={() => setZoomPol(null)}><article className="polBig" onClick={event => event.stopPropagation()}>
      <button className="polClose" aria-label="닫기" onClick={() => setZoomPol(null)}>×</button>
      <i className="pin" />
      <span className="polPhoto big">{zoomed.photo}</span>
      <b>{zoomed.title}</b>
      {zoomed.id === "quote" && <p>"{QUOTE[caseId]}"<small>이 증상을 만드는 차량 출력을 E/E 판에서 조사하세요.</small></p>}
      {zoomed.id === "lamp" && <p>{LAMP[caseId].label} · {LAMP[caseId].note}<small>경고등은 결과로 켜진 것일 수 있어요.</small></p>}
      {zoomed.dom && <p><span className="polRow"><em>원본 기록</em>기준 <code>{refText(zoomed.dom)}</code> · 이번 <code>{fmt(zoomed.dom.run)}{zoomed.dom.unit ? ` ${zoomed.dom.unit}` : ""}</code></span>{zoomed.dom.t !== undefined && <span className="polRow"><em>달라진 시각</em><code>{fmt(zoomed.dom.t)} {unit}</code></span>}<span className="polRow"><em>위치</em>{zoomed.dom.zone}</span><Gauge dom={zoomed.dom} /></p>}
    </article></div>}
    <button className="secretSolve" title="개발용 정답 적용" onClick={reveal}>정답 보기</button>
    {replayOpen && <ReplayConfirm impact="STEP03 퍼즐과 STEP04 시험 계약·실행 기록도 함께 초기화됩니다." onCancel={() => setReplayOpen(false)} onConfirm={() => { setReplayOpen(false); resetStage(); }} />}
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
    { label: "팬 요청 계산", role: "control", dom: "fan_cmd" }, { label: "PWM 출력 어댑터 SW", role: "control", dom: "fan_rpm" }, { label: "냉각수 온도 센서", role: "input", dom: "coolant" },
    { label: "VCU", role: "control", dom: "derate" }, { label: "차량 가속", role: "result", dom: "accel" }] },
  brake: { first: 2, signals: ["페달 %", "압력 명령", "제동력"], chain: [
    { label: "페달 입력 처리", role: "input", dom: "bpp" }, { label: "압력 계산 SW", role: "control", dom: "p_cmd" }, { label: "I/O 어댑터 SW", role: "control", dom: "caliper" },
    { label: "차량 감속", role: "result", dom: "decel" }] },
};

// Zoom into the first deviation like a subsystem: only the boundary values are known; the inside stays "?"
// until verification (the trace narrows the suspect section, it does not convict a block).
// What the team can observe without measuring (driver, cluster, input log, road): different angles, no cause.
const OBSERVED: Record<string, { icon: "detective" | "warning" | "clipboard" | "road"; label: string; value: string }[]> = {
  propulsion: [{ icon: "detective", label: "운전자 체감", value: "끝까지 밟아도 가속 약함" }, { icon: "warning", label: "계기판", value: "경고등 없음" }, { icon: "clipboard", label: "페달 입력 기록", value: "60% 유지" }, { icon: "road", label: "도로", value: "마른 평지 직선" }],
  thermal: [{ icon: "detective", label: "운전자 체감", value: "고속 유지 중 힘 빠짐" }, { icon: "warning", label: "계기판", value: "파워다운 표시등" }, { icon: "clipboard", label: "주행 기록", value: "고속 연속 주행" }, { icon: "road", label: "바깥 기온", value: "25°C" }],
  brake: [{ icon: "detective", label: "운전자 체감", value: "밟아도 덜 섬" }, { icon: "warning", label: "계기판", value: "브레이크 경고등" }, { icon: "clipboard", label: "페달 입력 기록", value: "55% 유지" }, { icon: "road", label: "노면", value: "마른 노면" }],
};
const REPLAY: Record<string, string> = { propulsion: "페달 60% 기록", thermal: "고속 연속 주행 기록", brake: "페달 55% 기록" };

const SUBSYS: Record<string, { where: string; inLabel: string; outLabel: string; stages: string[] }> = {
  propulsion: { where: "VCU", inLabel: "페달 신호 60%", outLabel: "토크 명령 92 Nm (기준 204)", stages: ["입력 회로", "페달 처리", "토크 계산"] },
  thermal: { where: "팬 출력 SW 경계", inLabel: "팬 요청 100%", outLabel: "PWM 출력 0% (기준 100)", stages: ["팬 요청 계산", "실행 순서", "PWM 쓰기"] },
  brake: { where: "압력 출력 SW 경계", inLabel: "압력 계산 42 bar", outLabel: "전송 명령 8 bar (기준 42)", stages: ["배분 계산", "단위 변환", "I/O 전송"] },
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
  const [replayed, setReplayed] = useState(false);
  const [sorted, setSorted] = useState<Record<string, "out" | "hold">>({});
  const [picking, setPicking] = useState(false);
  const [found, setFound] = useState(false);
  const [sectionPick, setSectionPick] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [bubble, setBubble] = useState(`오른쪽 증거는 '${dom(chain[last].dom).label}'이에요. 먼저 '고장 당시 입력 재생'을 누른 뒤, 출력 쪽부터 부품을 눌러 재 보세요.`);
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
    if (!replayed) { setBubble("먼저 위의 '고장 당시 입력 재생'을 눌러 같은 입력을 다시 넣어야 잴 수 있어요."); play("error"); return; }
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
  const replay = () => { if (replayed) return; setReplayed(true); play("zip"); window.setTimeout(() => play("pop", 1.2), 300); setBubble(`${REPLAY[caseId]}을 다시 넣었어요. 이제 출력 쪽부터 부품을 눌러 재 보세요.`); };
  const sortHyp = (id: string, pick: "out" | "hold") => {
    const h = meta.hypotheses.find(item => item.id === id)!;
    const right = h.stage1 ? "out" : "hold";
    if (pick !== right) { setMistakes(n => n + 1); showVerdict(false); setBubble(pick === "out" ? `'${h.label}'을(를) 배제할 측정값은 아직 없어요. 검증에서 시험해요.` : `${h.stage1} 그래서 이 가설은 반박돼요.`); return; }
    setSorted(previous => ({ ...previous, [id]: pick })); play(pick === "out" ? "stamp" : "pop");
    setBubble(pick === "out" ? `${h.stage1 ?? ""} 반박했어요.` : `'${h.label}'은(는) 측정만으로 가를 수 없어요. 검증으로 넘겨요.`);
  };
  const allSorted = meta.hypotheses.every(h => sorted[h.id]);
  const effects = chain.filter((_, i) => i > trace.first && isBad(i)).map(node => dom(node.dom));
  const finish = () => {
    try { sessionStorage.setItem(`tb-impact-${caseId}`, JSON.stringify(effects.map(d => `${d.label} 정상 복귀 (기준 ${refText(d)})`))); } catch { /* ignore */ }
    const evidence = measured.map(i => dom(chain[i].dom)).filter(d => d.ev).map(d => d.ev!);
    evidence.filter(id => !state.evidence[caseId].includes(id)).forEach(id => send({ type: "RECORD_EVIDENCE", id }));
    if (state.hypothesis[caseId] !== scenario.root) send({ type: "SELECT_HYPOTHESIS", id: scenario.root });
    try { sessionStorage.setItem(`tb-section-${caseId}`, data.section.name); } catch { /* ignore */ }
    send({ type: "OPEN_WIRING" });
  };
  const reveal = () => { setReplayed(true); setMeasured(chain.map((_, i) => i)); setFound(true); setSectionPick(data.section.choices.find(c => c.ok)!.label); setDone(true); setSorted(Object.fromEntries(meta.hypotheses.map(h => [h.id, h.stage1 ? "out" : "hold"])) as Record<string, "out" | "hold">); };
  const marks: Record<number, "ok" | "bad" | "first" | "next"> = {};
  chain.forEach((_, i) => { marks[i] = found && i === trace.first ? "first" : measured.includes(i) ? (isBad(i) ? "bad" : "ok") : "next"; });
  const order = [...measured].sort((a, b) => b - a); // output first

  const coach = state.completedCases.length ? "" : !replayed ? "replay" : measured.length < 3 ? "measure" : !found ? "pick" : !done ? "section" : !allSorted ? "sort" : "next";
  return <div className="dtBoard tbTrace" data-coach={coach}>
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
        <header><b><Icon name="layers" /> 차량 E/E 아키텍처</b><small>{picking ? "처음 어긋난 부품을 누르세요" : replayed ? "부품을 눌러 재기 · 두 부품을 모두 재면 그 사이 신호가 보여요" : "먼저 고장 당시 입력을 재생하세요"}</small><button className={`etReplay ${replayed ? "on" : ""}`} onClick={replay}>{replayed ? "✓ 입력 재생 중" : `▶ 고장 당시 입력 재생 · ${REPLAY[caseId]}`}</button></header>
        <EeBlueprint chain={chain.map(node => node.label)} roles={chain.map(node => node.role)} active={chain.length} removed={null} onPick={pick} signals={trace.signals} marks={marks} showPath={i => measured.includes(i) && measured.includes(i + 1)} />
        {found && SUBSYS[caseId] && <div className="etZoom" aria-label="처음 어긋난 곳 들여다보기"><b><Icon name="search" /> {SUBSYS[caseId].where} 안 들여다보기</b>
          <div className="etZoomRow"><span className="io ok">들어오는 값<em>{SUBSYS[caseId].inLabel}</em></span>{SUBSYS[caseId].stages.map(st => <React.Fragment key={st}><i>→</i><span className="stage">{st}<em>?</em></span></React.Fragment>)}<i>→</i><span className="io bad">나가는 값<em>{SUBSYS[caseId].outLabel}</em></span></div>
          <small>안쪽 중 어디가 원인인지는 아직 몰라요. 검증 단계에서 시험으로 가려요.</small></div>}
      </section>
      <aside className="tbEvidence">
        <header><b><Icon name="camera" /> 증거</b><small>{scenario.title}</small><OpenBookButton caseId={caseId} /></header>
        <div className="etObserved">{OBSERVED[caseId].map(o => <span key={o.label}><Icon name={o.icon} /><small>{o.label}</small><b>{o.value}</b></span>)}</div>
        <ul>{order.map(i => { const d = dom(chain[i].dom); return <li key={i} className={`s-${d.status} ${found && i === trace.first ? "first" : ""}`}>
          <Photo src={d.img} /><span><b>{i === last ? "증상 · " : ""}{d.label}</b><Gauge dom={d} /></span><em className={`tbStamp ${d.status === "bad" ? "bad" : "ok"}`}>{d.status === "bad" ? "이상" : "정상"}</em>
        </li>; })}</ul>
        <div className="tbAct">
          {!found ? <button className={`tbPick ${picking ? "on" : ""}`} onClick={() => { setPicking(v => !v); play("pop"); setBubble(picking ? "측정을 계속하세요." : "처음 어긋난 부품을 왼쪽 그림에서 누르세요."); }}><Icon name="target" /> {picking ? "지목 취소" : "처음 어긋난 곳 지목"}</button>
            : !done ? <div className="tbSecs"><small>처음 어긋난 곳: {chain[trace.first].label} · 의심 구간을 고르세요</small>{data.section.choices.map(c => <button key={c.label} className={sectionPick === c.label ? c.ok ? "right" : "wrong" : ""} onClick={() => pickSection(c.label)}>{c.label}</button>)}</div>
              : <div className="tbCarry"><small>가설 정리 · 측정으로 반박되면 '반박', 아직 모르면 '보류'</small><div className="tbSort">{meta.hypotheses.map(h => <span key={h.id} className={sorted[h.id] ?? "todo"}><b>{h.label}</b>{sorted[h.id] ? <em>{sorted[h.id] === "out" ? "반박됨" : "판단 보류"}</em> : <><button onClick={() => sortHyp(h.id, "out")}>반박</button><button onClick={() => sortHyp(h.id, "hold")}>보류</button></>}</span>)}</div>
                <button className="dtNext" disabled={!allSorted} onClick={finish}>다음: 요구사항 기반 로직 퍼즐 → <span>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span></button></div>}
        </div>
      </aside>
      <div className="etBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{numify(bubble)}</p></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={reveal}>정답 보기</button>
  </div>;
}
