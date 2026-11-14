import type { ReactNode } from "react";
import "./mission-bar.css";

/** Common "what to do now" bar for STEP01~04.  One sentence of action, one question, optional progress.
 *  Same slot, size and type scale on every screen so the player always finds the task in the same place. */
export function MissionBar({ action, question, progress, children }: {
  action: string;
  question?: string;
  progress?: { now: number; total: number };
  children?: ReactNode;
}) {
  return <section className="missionBar" aria-live="polite" aria-label="지금 할 일">
    <span className="missionTag">MISSION</span>
    <b className="missionAction">{action}</b>
    {question && <span className="missionQuestion"><em>Q.</em>{question}</span>}
    {progress && <span className="missionProgress" aria-label={`진행 ${progress.now}/${progress.total}`}>
      {Array.from({ length: progress.total }, (_, i) => <i key={i} className={i < progress.now ? "on" : ""} />)}
      <small>{progress.now}/{progress.total}</small>
    </span>}
    {children}
  </section>;
}
