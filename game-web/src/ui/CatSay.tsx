import { useEffect, useState } from "react";
import "./common-v3.css";

const CAT = "/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png";

/**
 * Shared cat speech bubble: short lines, tap to go to the next line, and "다시 듣기" at any time —
 * also after the last line. `resetKey` restarts the conversation (new question / new result).
 */
export function CatSay({ lines, resetKey, onAdvance }: { lines: string[]; resetKey: string; onAdvance?: () => void }) {
  const [index, setIndex] = useState(0);
  const [replays, setReplays] = useState(0);
  useEffect(() => { setIndex(0); }, [resetKey]);
  const safe = lines.length ? lines : [""];
  const last = index >= safe.length - 1;
  return (
    <div className="tbCat" role="status" aria-live="polite">
      <img src={CAT} alt="" draggable={false} />
      <div className="tbCatBubble" key={`${resetKey}-${index}-${replays}`}>
        <p>{safe[Math.min(index, safe.length - 1)]}</p>
        <div className="tbCatTools">
          {!last && <button type="button" onClick={() => { setIndex(index + 1); onAdvance?.(); }}>▶ 다음 말</button>}
          <button type="button" onClick={() => { setIndex(0); setReplays(replays + 1); }}>↺ 다시 듣기</button>
        </div>
      </div>
    </div>
  );
}
