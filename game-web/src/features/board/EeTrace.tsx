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
import { useReportSubStep } from "../../ui/stepRoadmap";
import { MissionBar } from "../../ui/MissionBar";
import "./step02-v3.css";
import { useDevActions } from "../../ui/dev/devActions";
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
  regen: { label: "경고등 없음", note: "발을 뗀 뒤에도 속도가 오름" },
  ready: { label: "HV 시스템 점검", note: "READY 없음 · 점검 표시등" },
};
const QUOTE: Record<string, string> = {
  propulsion: "페달을 반 넘게 밟았는데 차가 힘없이 천천히 나가.",
  thermal: "오래 밟고 달렸더니 경고등이 켜지고 힘이 빠졌어.",
  brake: "브레이크를 밟았는데 생각보다 덜 서.",
  regen: "발을 뗐는데 차가 오히려 더 빨라져요.",
  ready: "시동 버튼을 눌러도 READY가 안 켜져요.",
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

  // 3 sub-steps: symptom (which output left its reference) → trace (measure + judge) → hyp (section, then hypotheses)
  const PHASES = ["symptom", "trace", "hyp"] as const;
  const [phase, setPhase] = useState<(typeof PHASES)[number]>(saved.phase === "trace" ? "trace" : ["section", "done", "hyp"].includes(saved.phase) ? "hyp" : "symptom");
  const phaseIdx = PHASES.indexOf(phase);
  const [reached, setReached] = useState<number>(Math.min(2, saved.reached ?? 0));
  useEffect(() => { if (phaseIdx > reached) setReached(phaseIdx); }, [phaseIdx, reached]);
  // going back must not bounce forward again: the trace→section auto-advance is paused until the player judges something
  const holdTrace = useRef(false);
  useReportSubStep("board", phaseIdx, { max: Math.max(reached, phaseIdx), goTo: index => { holdTrace.current = index === 2; setPhase(PHASES[index]); } });
  const [chain, setChain] = useState<string[]>(saved.chain ?? []);          // outputs followed so far (symptom → … backward)
  const [measured, setMeasured] = useState<string[]>(saved.measured ?? []);
  const [stamps, setStamps] = useState<Record<string, Stamp>>(saved.stamps ?? {});
  const [mistakes, setMistakes] = useState<number>(saved.mistakes ?? 0);
  const [sectionPick, setSectionPick] = useState<string | null>(saved.sectionPick ?? null);
  const [shake, setShake] = useState("");
  const replayed = true; // the fault-time log is always available: measuring is one tap, no separate replay step
  const [selected, setSelected] = useState<string | null>(null);
  const [zoomPol, setZoomPol] = useState<string | null>(null);
  const [evidencePage, setEvidencePage] = useState<number>(saved.evidencePage ?? 0);
  const [attached, setAttached] = useState<string[]>(saved.attached ?? []);
  const [sorted, setSorted] = useState<Record<string, "out" | "hold">>(saved.sorted ?? {});
  // T-25: the hypothesis carried to STEP03 is the player's own choice among the hypotheses they kept (보류), never the answer key.
  const [carry, setCarry] = useState<string>(saved.carry ?? "");
  type MemoTab = "evidence" | "measure" | "zone" | "hyp";
  const [memoTab, setMemoTab] = useState<MemoTab>(["evidence", "measure", "zone", "hyp"].includes(saved.memoTab) ? saved.memoTab : "evidence");
  const [bubble, setBubble] = useState(saved.bubble ?? `기준 값과 이번 값이 다른 출력을 고르세요.`);
  const [replayOpen, setReplayOpen] = useState(false);
  // guards the short delay between "every suspect judged" and moving to the next output (no double-advance on fast clicks)
  const advancing = useRef(false);
  const focus = chain[chain.length - 1];
  const suspects = focus ? causesOf(focus) : [];
  const cleared = suspects.length > 0 && suspects.every(id => stamps[id] === "refuted");
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  useEffect(() => { try { sessionStorage.setItem(progressKey, JSON.stringify({ reached, phase, chain, measured, stamps, mistakes, sectionPick, replayed: true, evidencePage, attached, sorted, memoTab, bubble, carry })); } catch { /* ignore */ } }, [phase, chain, measured, stamps, mistakes, sectionPick, evidencePage, attached, sorted, memoTab, bubble, carry, progressKey]);
  const resetStage = () => { setReached(0); holdTrace.current = false; setPhase("symptom"); setSelected(null); setChain([]); setMeasured([]); setStamps({}); setMistakes(0); setSectionPick(null); setZoomPol(null); setEvidencePage(0); setAttached([]); setSorted({}); setCarry(""); setMemoTab("evidence"); setBubble("기준 값과 이번 값이 다른 출력을 고르세요."); try { sessionStorage.removeItem(progressKey); sessionStorage.removeItem(`tb-impact-${caseId}`); sessionStorage.removeItem(`tb-section-${caseId}`); sessionStorage.removeItem(`tb-step03-progress-${caseId}`); sessionStorage.removeItem(`tb-step04-progress-${caseId}`); sessionStorage.removeItem(`tb-expect-${caseId}`); sessionStorage.removeItem(`tb-verification-contract-${caseId}`); } catch { /* ignore */ } };
  const nope = (id: string, text: string) => { setBubble(text); setShake(id); setMistakes(n => n + 1); showVerdict(false); window.setTimeout(() => setShake(""), 420); };

  // 1) symptom: the output that left its reference (driver statement + log values), picked from cards or the board
  const pickOutput = (id: string) => {
    if (phase !== "symptom") return;
    if (id !== data.start) { nope(id, `${dom(id).label}${josa(dom(id).label, "은", "는")} 운전자가 느낀 증상이 아니에요. 증거의 증상은 '${start.label}'이에요.`); return; }
    play("zip"); showVerdict(true, "증상 확인"); if (!chain.length) setChain([id]); setPhase("trace"); setZoomPol(null);
    setBubble(`${start.label}${josa(start.label, "을", "를")} 만드는 앞 후보를 눌러 측정하고, 먼저 달라졌는지 판단하세요.`);
  };
  const pickNode = (id: string) => {
    if (phase === "symptom") { if (dom(id).zone === "차량") pickOutput(id); return; }
    if (phase === "trace" && suspects.includes(id)) measure(id);
  };
  // 4) measure one suspect, then the player stamps it
  const measure = (id: string) => {
    holdTrace.current = false;
    setSelected(id); setMemoTab("measure");
    if (measured.includes(id)) return;
    setMeasured(previous => [...previous, id]);
    const d = dom(id);
    play("zip"); window.setTimeout(() => play(d.status === "bad" ? "stamp" : "pop"), 160);
    setBubble(d.status === "bad"
      ? `${d.label}도 기준과 달라요. 카드에 적힌 달라진 시점(${fmt(d.t!)}${unit})을 지금 출력(${fmt(dom(focus).t!)}${unit})과 비교해 판단하세요.`
      : `${d.label}${josa(d.label, "은", "는")} ${d.status === "tol" ? "조금 다르지만 허용 범위예요" : "기준과 같아요"}. 판단을 고르세요.`);
  };
  const stamp = (id: string, pick: Stamp) => {
    holdTrace.current = false;
    if (advancing.current || stamps[id]) return;
    const d = dom(id), f = dom(focus);
    const earlier = d.status === "bad" && (d.t ?? 0) < (f.t ?? 0);
    const answer: Stamp = earlier ? "likely" : "refuted";
    if (pick !== answer) {
      nope(id, answer === "refuted"
        ? d.status === "bad" ? `${d.label}${josa(d.label, "은", "는")} ${fmt(d.t!)}${unit}에 달라졌어요. ${f.label}(${fmt(f.t!)}${unit})보다 늦어요. 원인은 결과보다 먼저 일어나요. 이건 결과예요.` : `${d.label}${josa(d.label, "은", "는")} 기준과 같아요. 이 값으로는 ${f.label}${josa(f.label, "을", "를")} 바꿀 수 없어요.`
        : `${d.label}${josa(d.label, "은", "는")} ${f.label}보다 먼저 달라졌어요. 원인 쪽일 수 있어요.`);
      return;
    }
    const next = { ...stamps, [id]: pick };
    setStamps(next); setSelected(null);
    showVerdict(true, STAMP_KO[pick]);
    const pending = suspects.filter(item => !next[item]);
    if (pending.length) {
      setBubble(pick === "likely"
        ? `${d.label}: 유력. 아직 판단하지 않은 후보가 ${pending.length}개 남았어요. 모든 후보를 측정하고 판단해야 다음 출력으로 넘어가요.`
        : `${d.label}: 반박. 남은 후보 ${pending.length}개를 측정하고 판단하세요.`);
      return;
    }
    // every suspect of this output is judged: follow the earliest likely one, or stop here (handled by the effect below)
    const likely = suspects.filter(item => next[item] === "likely").sort((a, b) => (dom(a).t ?? 0) - (dom(b).t ?? 0));
    if (likely.length) {
      const nextOut = dom(likely[0]);
      advancing.current = true;
      setBubble(`모든 후보를 판단했어요. ${nextOut.label}${josa(nextOut.label, "이", "가")} ${f.label}보다 먼저 달라졌으니 이제 새 출력이에요. 그 앞의 후보를 다시 측정해요.`);
      // a judgement is relative to the output it was compared with: the new output's suspects are judged again (measurements stay)
      window.setTimeout(() => {
        setStamps(previous => { const kept = { ...previous }; causesOf(likely[0]).forEach(item => { delete kept[item]; }); return kept; });
        setChain(previous => previous.includes(likely[0]) ? previous : [...previous, likely[0]]);
        advancing.current = false;
      }, 700);
    }
  };
  // a judged suspect can be reopened until every suspect of the current output is judged
  const unstamp = (id: string) => {
    holdTrace.current = false;
    if (advancing.current || !suspects.includes(id)) return;
    setStamps(previous => { const next = { ...previous }; delete next[id]; return next; });
    play("pop"); setBubble(`${dom(id).label}의 판단을 다시 고를 수 있어요.`);
  };
  // 5) every suspect cleared → the current output is where it first went wrong
  useEffect(() => {
    if (phase !== "trace" || !cleared || holdTrace.current) return;
    if (focus !== data.first) return;
    play("success");
    setBubble(`들어오는 값은 모두 정상인데 ${dom(focus).label}만 달라요. 여기가 처음 어긋난 곳이에요. 어느 구간 안쪽인지 고르세요.`);
    const timer = window.setTimeout(() => { setPhase("hyp"); setMemoTab("zone"); }, 900);
    return () => clearTimeout(timer);
  }, [cleared, focus, phase]); // eslint-disable-line react-hooks/exhaustive-deps
  // 6) section inside the first deviation
  const pickSection = (label: string) => {
    const choice = data.section.choices.find(c => c.label === label)!;
    setSectionPick(label); setBubble(choice.why);
    if (choice.ok) { showVerdict(true, "의심 구간"); window.setTimeout(() => setMemoTab("hyp"), 900); }
    else { setMistakes(n => n + 1); showVerdict(false); }
  };
  const sectionDone = Boolean(sectionPick && data.section.choices.find(c => c.label === sectionPick)?.ok);
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
    setChain(route); setMeasured(route.flatMap(causesOf)); setStamps(Object.fromEntries(route.flatMap(causesOf).map(id => [id, route.includes(id) ? "likely" : "refuted"]))); setSectionPick(data.section.choices.find(c => c.ok)!.label); setCarry(meta.hypotheses.find(h => h.truth)?.id ?? ""); setSorted(Object.fromEntries(meta.hypotheses.map(h => [h.id, h.stage1 ? "out" : "hold"])) as Record<string, "out" | "hold">); setPhase("hyp"); setMemoTab("hyp");
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
  const nodeState = (id: string) => chain.includes(id) ? (id === focus && phase === "trace" ? "focus" : "likely") : stamps[id] === "refuted" ? "refuted" : phase === "trace" && stamps[id] === "likely" && suspects.includes(id) ? "mark" : phase === "trace" && suspects.includes(id) ? "suspect" : phase === "symptom" && dom(id).zone === "차량" ? "pickable" : "idle";

  // Initial evidence is intentionally limited to the driver statement and cluster.
  // E/E output and measurement polaroids are added to the right rail as they are earned.
  const obs = OBSERVED[caseId];
  type Pol = { id: string; kind: string; title: string; sub: string; photo: React.ReactNode; dom?: Dom };
  const evidenceCards = [...(chain.length ? [start] : []), ...measured.map(dom)].filter((d, i, all) => all.findIndex(x => x.id === d.id) === i);
  const pols: Pol[] = [
    { id: "quote", kind: "quote", title: `${DRIVER} 진술`, sub: "운전자 체감", photo: <img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /> },
    { id: "lamp", kind: "lamp", title: "계기판", sub: LAMP[caseId].label, photo: <img src="/assets/intake/images/HMI/instrument_cluster__EVID-fault.png" alt="" /> },
    ...evidenceCards.map(d => ({ id: d.id, kind: `m s-${d.status}`, title: d.label, sub: d.status === "bad" ? "기준과 다름" : d.status === "tol" ? "허용 범위 안" : "기준과 같음", photo: <Photo src={d.img} />, dom: d })),
  ];
  const zoomed = pols.find(item => item.id === zoomPol);
  const evidencePages = Math.max(1, Math.ceil(pols.length / 6));
  const visiblePols = pols.slice(evidencePage * 6, evidencePage * 6 + 6);
  const coach = state.completedCases.length ? "" : phase === "symptom" ? "output" : phase === "trace" ? "measure" : !sectionDone ? "section" : !allSorted ? "sort" : "next";
  const mugStatus = (id: string): keyof typeof STAMP_KO => stamps[id] ?? (measured.includes(id) ? "measured" : "untested");
  // symptom cards: the felt symptom plus unaffected outputs only (a wrong card must be clearly wrong: reference = this drive).
  // Which card is right moves from case to case so the position carries no hint.
  const symptomChoices = (() => {
    const pool = [start, ...data.doms.filter(d => d.zone === "차량" && d.id !== data.start && d.status !== "bad").slice(0, 2)];
    const turn = ({ propulsion: 1, thermal: 2, brake: 0 } as Record<string, number>)[caseId] ?? 0;
    return pool.map((_, i) => pool[(i + turn) % pool.length]);
  })();

  const et3Mission = (phase === "symptom" ? { action: "기준과 다른 출력을 고르기", question: "운전자가 느낀 증상은 어느 출력일까?" }
    : phase === "trace" ? { action: `${dom(focus ?? data.start).label}의 앞 후보를 눌러 측정하고 판단`, question: "이 출력의 이상은 어디에서 시작됐을까?" }
    : !sectionDone ? { action: "처음 어긋난 곳의 의심 구간 고르기", question: "최초 편차를 근거로 어느 구간을 의심할까?" }
    : { action: allSorted ? "먼저 시험할 가설 확인 후 다음으로" : "가설마다 반박 또는 보류 고르기", question: "어떤 가설이 현재 증거를 가장 잘 설명할까?" });
  useDevActions({ solve: reveal, label: "STEP02" });
  return <div className="dtBoard eeTrace" data-coach={coach}>
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="원인 추적" title="도미노 역추적" distanceMeters={state.policeGapMeters} raceDistanceMeters={state.raceDistance} progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <StageFolderSubtitle step="board" className="etStageFolder" action="관찰한 이상 증상에서 출발해 고장 원인 후보를 좁히세요." detail={<>출발 증거: {scenario.symptom} <i>|</i> 추적 대상: 신호·제어 경로</>} />
    <StageIntro id="trace-v2" stage="STEP 02" title="도미노 역추적" goal="첫 편차를 찾고 고장 원인 가설 세우기" steps={[
      { icon: "camera", text: "운전자 증상과 기준 값을 보고, 기준에서 벗어난 출력을 고르기" },
      { icon: "search", text: "앞 후보를 눌러 측정하고, 출력보다 먼저 달라졌는지 판단하기" },
      { icon: "clipboard", text: "처음 어긋난 곳의 의심 구간과 가설을 정리하기" },
    ]} />
    <main className="dtLayout etLayout">
      <MissionBar action={et3Mission.action} question={et3Mission.question} progress={{ now: phaseIdx + 1, total: 3 }} />

      {/* center: whole-vehicle reverse trace */}
      <section className={`etBoard phase-${phase}`} ref={boardRef}>
        <header><b><Icon name="layers" /> 도미노 역추적 판</b><small>{phase === "symptom" ? "기준과 다른 출력을 고르세요" : phase === "trace" ? `지금 출력: ${dom(focus).label}` : "센서 → 제어기 → CAN → 부품 → 차량"}</small>{phase === "hyp" && sectionDone && <button className="stageReplayBtn etStageReplay" onClick={() => setReplayOpen(true)}>다시 풀기</button>}</header>
        <svg className="etLines">{lines.map((l, i) => <path key={i} d={l.d} className={l.hot ? "hot" : "path"} />)}</svg>
        <div className="etZones">{ZONES.map(zone => <div key={zone} className="etZone">
          <small><Icon name={ZONE_ICON[zone]} /> {zone}</small>
          {zone === "제어기" && <div className="etEcus">{OTHER_ECUS.map(name => <i key={name}>{name}</i>)}</div>}
          {data.doms.filter(d => d.zone === zone).map(d => { const st = nodeState(d.id); return <button key={d.id} data-node={d.id} className={`etNode n-${st} ${selected === d.id ? "picked" : ""} ${shake === d.id ? "shake" : ""}`} onClick={() => pickNode(d.id)} disabled={st === "idle" || st === "refuted"}>{d.label}{st === "likely" && <em>유력</em>}{st === "refuted" && <em>반박</em>}</button>; })}
        </div>)}</div>
      </section>

      {/* right 360px: evidence / measurement card / section zoom / hypotheses */}
      <section className="etEvidence">
        <header><nav className="etEvidenceTabs" role="tablist" aria-label="증거 패널">
          <button role="tab" aria-selected={memoTab === "evidence"} className={memoTab === "evidence" ? "on" : ""} onClick={() => setMemoTab("evidence")}>증거</button>
          <button role="tab" aria-selected={memoTab === "measure"} className={memoTab === "measure" ? "on" : ""} onClick={() => setMemoTab("measure")}>측정</button>
          {phase === "hyp" && <button role="tab" aria-selected={memoTab === "zone"} className={memoTab === "zone" ? "on" : ""} onClick={() => setMemoTab("zone")}>구간</button>}
          {phase === "hyp" && sectionDone && <button role="tab" aria-selected={memoTab === "hyp"} className={memoTab === "hyp" ? "on" : ""} onClick={() => setMemoTab("hyp")}>가설</button>}
        </nav><OpenBookButton caseId={caseId} /></header>
        <div className="etEvidenceContent">
          {memoTab === "evidence" && <><div className="polBoard" role="tabpanel" aria-label="관찰·계측 증거">{visiblePols.map(item => <button key={item.id} className={`pol ${item.kind}`} onClick={() => { setZoomPol(item.id); play("pop"); }}>
            <i className="pin" /><span className="polPhoto">{item.photo}</span><b>{item.title}</b><small>{item.sub}</small>
          </button>)}</div>{evidencePages > 1 && <div className="polPager"><button disabled={evidencePage === 0} onClick={() => setEvidencePage(page => Math.max(0, page - 1))}>이전</button><span>{evidencePage + 1}/{evidencePages}</span><button disabled={evidencePage >= evidencePages - 1} onClick={() => setEvidencePage(page => Math.min(evidencePages - 1, page + 1))}>다음</button></div>}</>}
          {memoTab === "measure" && <div className="etMeasureTab" role="tabpanel" aria-label="측정 비교">{(() => { const id = selected ?? measured[measured.length - 1]; if (!id) return <p className="etEmpty"><Icon name="search" /> {phase === "symptom" ? "출력을 고르면 측정을 시작할 수 있어요." : "후보 노드를 누르면 기준과 비교한 결과가 여기에 나와요."}</p>; const d = dom(id), f = dom(focus ?? data.start);
            return <article className={`etCmp s-${d.status}`}><div className="pol etPol"><span className="polPhoto"><Photo src={d.img} /></span></div><div><b>{d.label}</b><small>{d.zone}</small></div><Gauge dom={d} /><p><span>달라진 시점</span><code>{d.status === "bad" ? `${fmt(d.t!)}${unit}` : d.status === "tol" ? "허용 범위 안" : "달라지지 않음"}</code></p>{d.status === "bad" && f.t !== undefined && <p><span>{f.label}</span><code>{fmt(f.t)}{unit}</code></p>}</article>; })()}
            {chain.length > 0 && <div className="etReasonPath"><small>역추적 경로</small><div className="etStack flow">{[...chain].reverse().map((id, row) => <React.Fragment key={id}><span className={row === 0 ? "top" : ""}>{dom(id).label}</span>{row < chain.length - 1 && <i aria-hidden="true">→</i>}</React.Fragment>)}</div></div>}
          </div>}
          {memoTab === "zone" && <div className="etZoneTab" role="tabpanel" aria-label="의심 구간">{SUBSYS[caseId] ? <div className="etZoom inline"><b><Icon name="search" /> {SUBSYS[caseId].where} 안쪽</b><div className="etZoomCol"><span className="io ok">들어오는 값<em>{SUBSYS[caseId].inLabel}</em></span>{SUBSYS[caseId].stages.map(st => <React.Fragment key={st}><i aria-hidden="true">↓</i><span className="stage">{st}<em>?</em></span></React.Fragment>)}<i aria-hidden="true">↓</i><span className="io bad">나가는 값<em>{SUBSYS[caseId].outLabel}</em></span></div></div> : null}</div>}
          {memoTab === "hyp" && <div className="etHypTab" role="tabpanel" aria-label="가설 정리">{meta.hypotheses.map(h => <article key={h.id} className={`etHyp ${sorted[h.id] ?? "todo"}`}><b>{h.label}</b>{sorted[h.id] ? <em>{sorted[h.id] === "out" ? "반박됨" : "판단 보류"}</em> : <span><button onClick={() => sortHyp(h.id, "out")}>반박</button><button onClick={() => sortHyp(h.id, "hold")}>보류</button></span>}</article>)}</div>}
        </div>
      </section>

      {/* bottom 150px: cat line + the one question of this step */}
      <section className="etMugs">
        <p className="etSay"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><b>{ENGINEER}</b><span>{numify(bubble)}</span></p>
        {phase === "symptom" ? <div className="etDock etDockSymptom"><b>기준과 이번 값이 다른 출력은?</b><div className="etChoices">{symptomChoices.map(d => <button key={d.id} className={shake === d.id ? "shake" : ""} onClick={() => pickOutput(d.id)}><b>{d.label}</b><small>기준 {refText(d)} · 이번 {fmt(d.run)}{d.unit ? ` ${d.unit}` : ""}</small></button>)}</div></div>
          : phase === "trace" ? <div className="etDock etDockTrace"><b>{dom(focus).label}{dom(focus).t !== undefined ? ` · ${fmt(dom(focus).t!)}${unit}부터 달라짐` : ""}</b>
            {selected && measured.includes(selected) && !stamps[selected]
              ? <><span className="etAsk">{dom(selected).label}{josa(dom(selected).label, "은", "는")} {dom(focus).label}보다 먼저 달라졌나요?</span><div className="etChoices"><button onClick={() => stamp(selected, "likely")}>먼저 달라짐</button><button onClick={() => stamp(selected, "refuted")}>같거나 늦음</button></div></>
              : <span className="etAsk">후보 노드를 눌러 측정하세요 · 남은 후보 {suspects.filter(id => !stamps[id]).length}개</span>}</div>
            : !sectionDone ? <div className="etDock etDockSection"><b>처음 어긋난 곳: {dom(data.first).label} · 의심 구간은?</b><div className="etChoices">{data.section.choices.map(c => <button key={c.label} className={sectionPick === c.label ? c.ok ? "right" : "wrong" : ""} onClick={() => pickSection(c.label)}>{c.label}</button>)}</div></div>
              : !allSorted ? <div className="etDock"><b>가설 정리</b><span className="etAsk">가설마다 반박 또는 보류를 고르세요 · 남은 가설 {meta.hypotheses.filter(h => !sorted[h.id]).length}개</span></div>
                : carryPool.length > 1 && !carryId ? <div className="etDock"><b>먼저 시험할 가설</b><div className="etChoices">{carryPool.map(id => <button key={id} onClick={() => { setCarry(id); play("pop"); }}>{meta.hypotheses.find(h => h.id === id)?.label}</button>)}</div></div>
                  : <div className="etDock"><b>가설 정리 완료</b><span className="etAsk">먼저 시험할 가설: {meta.hypotheses.find(h => h.id === carryId)?.label ?? "없음"}{carryPool.length > 1 && <button className="etDockLink" onClick={() => { setCarry(""); play("pop"); }}>다시 고르기</button>} · 반박 {meta.hypotheses.filter(h => sorted[h.id] === "out").length} · 보류 {heldIds.length} · {"★".repeat(stars)}{"☆".repeat(3 - stars)}</span></div>}
      </section>
      <div className="etNextCell"><button className="dtNext stageProgressAction" disabled={!(phase === "hyp" && sectionDone && allSorted && carryId)} onClick={finish}>다음 →</button></div>
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
  regen: { first: 1, signals: ["회생 요청", "토크 지령", "CAN 토크 지령", "모터 토크"], chain: [
    { label: "Brake ECU", role: "input", dom: "regen_req" }, { label: "VCU", role: "control", dom: "vcu_out" }, { label: "CAN 토크 지령", role: "network", dom: "can_cmd" },
    { label: "인버터·모터", role: "actuator", dom: "motor_tq" }, { label: "차량 가감속", role: "result", dom: "accel" }] },
  ready: { first: 1, signals: ["시동 요청", "시퀀스 상태", "주 접촉기 명령"], chain: [
    { label: "시동 요청·브레이크", role: "input", dom: "start_req" }, { label: "VCU", role: "control", dom: "seq_state" }, { label: "주 접촉기", role: "actuator", dom: "main_cmd" },
    { label: "READY 상태", role: "result", dom: "ready" }] },
};

// Zoom into the first deviation like a subsystem: only the boundary values are known; the inside stays "?"
// until verification (the trace narrows the suspect section, it does not convict a block).
// What the team can observe without measuring (driver, cluster, input log, road): different angles, no cause.
const OBSERVED: Record<string, { icon: "detective" | "warning" | "clipboard" | "road"; label: string; value: string }[]> = {
  propulsion: [{ icon: "detective", label: "운전자 체감", value: "끝까지 밟아도 가속 약함" }, { icon: "warning", label: "계기판", value: "경고등 없음" }, { icon: "clipboard", label: "페달 입력 기록", value: "60% 유지" }, { icon: "road", label: "도로", value: "마른 평지 직선" }],
  thermal: [{ icon: "detective", label: "운전자 체감", value: "고속 유지 중 힘 빠짐" }, { icon: "warning", label: "계기판", value: "파워다운 표시등" }, { icon: "clipboard", label: "주행 기록", value: "고속 연속 주행" }, { icon: "road", label: "바깥 기온", value: "25°C" }],
  brake: [{ icon: "detective", label: "운전자 체감", value: "밟아도 덜 섬" }, { icon: "warning", label: "계기판", value: "브레이크 경고등" }, { icon: "clipboard", label: "페달 입력 기록", value: "55% 유지" }, { icon: "road", label: "노면", value: "마른 노면" }],
  regen: [{ icon: "detective", label: "운전자 체감", value: "발을 떼도 계속 빨라짐" }, { icon: "warning", label: "계기판", value: "경고등 없음 · 회생 표시 없음" }, { icon: "clipboard", label: "주행 기록", value: "페달 0% · 속도 상승" }, { icon: "road", label: "도로", value: "마른 평지 직선" }],
  ready: [{ icon: "detective", label: "운전자 체감", value: "시동 후 READY 없음" }, { icon: "warning", label: "계기판", value: "HV 시스템 점검 표시등" }, { icon: "clipboard", label: "시동 기록", value: "3회 시도 · 모두 실패" }, { icon: "road", label: "주행 상태", value: "정차 · 출발 전" }],
};
const REPLAY: Record<string, string> = { propulsion: "페달 60% 기록", thermal: "고속 연속 주행 기록", brake: "페달 55% 기록", regen: "페달 0% 코스팅 기록", ready: "시동 3회 시도 기록" };

const SUBSYS: Record<string, { where: string; inLabel: string; outLabel: string; stages: string[] }> = {
  propulsion: { where: "VCU", inLabel: "페달 신호 60%", outLabel: "토크 명령 92 Nm (기준 204)", stages: ["입력 회로", "페달 처리", "토크 계산"] },
  thermal: { where: "팬 출력 SW 경계", inLabel: "팬 요청 100%", outLabel: "PWM 출력 0% (기준 100)", stages: ["팬 요청 계산", "실행 순서", "PWM 쓰기"] },
  brake: { where: "압력 출력 SW 경계", inLabel: "압력 계산 42 bar", outLabel: "전송 명령 8 bar (기준 42)", stages: ["배분 계산", "단위 변환", "I/O 전송"] },
  regen: { where: "VCU 지령 변환", inLabel: "요청 −40 Nm", outLabel: "지령 +40 Nm (기준 −40)", stages: ["수신", "부호", "한계·램프"] },
  ready: { where: "VCU 시퀀스", inLabel: "시동 요청 1", outLabel: "접촉기 명령 없음 (기준 닫기)", stages: ["조건", "대기", "전이"] },
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
                <button className="dtNext" disabled={!allSorted} onClick={finish}>다음: 요구사항 기반 퍼즐 → <span>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span></button></div>}
        </div>
      </aside>
      <div className="etBubble"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{numify(bubble)}</p></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={reveal}>정답 보기</button>
  </div>;
}
