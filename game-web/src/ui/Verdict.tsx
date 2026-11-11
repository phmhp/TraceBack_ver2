// Big rubber-stamp verdict ("정답" / "오답") slammed over the screen, plus a one-time stage tutorial.
import React, { useEffect, useState } from "react";
import { play } from "./sfx";
import { Icon, type IconName } from "./Icon";

/** Call from any stage: shows the stamp and plays the matching sound. */
export function showVerdict(ok: boolean, label?: string) {
  play(ok ? "correct" : "wrong");
  dispatchEvent(new CustomEvent("tb-verdict", { detail: { ok, label: label ?? (ok ? "정답" : "오답"), id: Date.now() } }));
}

export function VerdictLayer() {
  const [v, setV] = useState<{ ok: boolean; label: string; id: number } | null>(null);
  useEffect(() => {
    let timer = 0;
    const on = (event: Event) => { const d = (event as CustomEvent).detail; setV(d); clearTimeout(timer); timer = window.setTimeout(() => setV(null), 1100); };
    addEventListener("tb-verdict", on);
    return () => { removeEventListener("tb-verdict", on); clearTimeout(timer); };
  }, []);
  if (!v) return null;
  return <div className="verdictLayer" key={v.id} aria-live="assertive"><span className={`verdictStamp ${v.ok ? "ok" : "no"}`}>{v.label}</span></div>;
}

/** First-visit tutorial for a stage: dim + blur the screen, three short steps, Enter to start. */
/**
 * Stage entry overlay (2026-11-12): shown every time a stage is entered, over a softly blurred stage.
 * Big stage name, one-sentence goal, a few short actions and a "풀기" button. It never touches saved
 * progress, so returning to a stage in progress just shows the same reminder and keeps the state.
 */
export function StageIntro({ id, title, goal, steps, stage, onClose }: { id: string; title: string; goal: string; steps: { icon: IconName; text: string }[]; stage?: string; onClose?: () => void }) {
  const [open, setOpen] = useState(true);
  const close = () => { setOpen(false); onClose?.(); };
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } };
    addEventListener("keydown", key, true); return () => removeEventListener("keydown", key, true);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  return <div className="stageIntro stageGate" role="dialog" aria-modal="true" aria-labelledby={`stage-gate-${id}`} data-stage-intro={id}>
    <article>
      {stage && <small>{stage}</small>}
      <h2 id={`stage-gate-${id}`}>{title}</h2>
      <p className="stageIntroGoal">{goal}</p>
      <ol>{steps.map((step, i) => <li key={step.text}><i><Icon name={step.icon} /></i><b>{i + 1}</b><span>{step.text}</span></li>)}</ol>
      <button className="primary" onClick={close}>풀기 (Enter)</button>
    </article>
  </div>;
}
