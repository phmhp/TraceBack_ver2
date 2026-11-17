import { useEffect, useRef, useState } from "react";
import { numify } from "./numify";
import "./nutguide.css";

/**
 * Shared step guide (2026-11-15): the engineer's spoken directions open as a popup (like a dialogue box) the first time a phase starts,
 * the dock keeps only the one short question, and "푸는 방법 다시 보기" reopens the popup. Feedback for the last action sits under the question.
 *  - `id`: unique per step phase (popup opens again when it changes and has not been seen)
 *  - `lines`: the 3 spoken sentences (what you did / what happens now / how to do it)
 *  - `ask`: the one short question or instruction kept in the dock
 */
export function NutGuide({ id, who, avatar, lines, ask, note, bad }: { id: string; who: string; avatar: string; lines: string[]; ask: string; note?: string; bad?: boolean }) {
  const seenKey = `tb-nut-${id}`;
  const readSeen = () => { try { return sessionStorage.getItem(seenKey) === "1"; } catch { return false; } };
  const [open, setOpen] = useState(() => !readSeen());
  const last = useRef(id);
  useEffect(() => { if (last.current !== id) { last.current = id; setOpen(!readSeen()); } }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => { setOpen(false); try { sessionStorage.setItem(seenKey, "1"); } catch { /* ignore */ } };
  useEffect(() => {
    if (!open) return;
    // while the popup is open it owns the keyboard: Enter / Space / Esc close it, nothing reaches the step
    const onKey = (event: KeyboardEvent) => {
      event.stopImmediatePropagation();
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") { event.preventDefault(); close(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="nutGuide">
    <div className="nutAsk">
      <img src={avatar} alt="" />
      <div>
        <small>{who}</small>
        <p>{numify(ask)}</p>
      </div>
    </div>
    {note && <p className={`nutNote ${bad ? "bad" : ""}`} role="status">{numify(note)}</p>}
    <button className="nutAgain" onClick={() => setOpen(true)}>푸는 방법 다시 보기</button>
    {open && <>
      <div className="nutFocusBackdrop" aria-hidden="true" />
      <div className="nutPopup" role="dialog" aria-label={`${who}의 설명`}>
      <img src={avatar} alt="" />
      <div className="nutPopupBody">
        <b>{who}</b>
        <ol>{lines.map((line, index) => <li key={index}>{numify(line)}</li>)}</ol>
        <button className="nutOk" onClick={close} autoFocus>알겠어요 <kbd>Enter</kbd></button>
      </div>
      </div>
    </>}
  </div>;
}
