import type { ReactNode } from "react";
import { numify } from "./numify";
import "./directive.css";

/**
 * Step direction in plain spoken sentences, one sentence per line:
 *  1) what the player just did  2) what happens now  3) how to do it.
 * `note` is the short feedback line for the last action (green by default, red when `bad`).
 */
export function Directive({ who, avatar, lines, note, bad, children }: { who: string; avatar: string; lines: string[]; note?: string; bad?: boolean; children?: ReactNode }) {
  return <div className="directive" aria-live="polite">
    <img src={avatar} alt="" />
    <div className="directiveBody">
      <b>{who}</b>
      <ol>{lines.map((line, index) => <li key={index}>{numify(line)}</li>)}</ol>
      {note && <p className={`directiveNote ${bad ? "bad" : ""}`}>{numify(note)}</p>}
      {children}
    </div>
  </div>;
}
