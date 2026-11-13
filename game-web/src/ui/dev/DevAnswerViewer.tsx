// DEV-ONLY shared "정답 보기" viewer for every stage. Mounted only when import.meta.env.DEV (see main.tsx).
// Read-only: it never dispatches, never writes storage and never changes a judgment.
import { useMemo, useState } from "react";
import type { Campaign } from "../../game/runtime";
import { buildSheet } from "./devAnswerSheet";
import { useDevCurrent } from "./devAnswerStore";
import "./dev-answer.css";

export default function DevAnswerViewer({ state }: { state: Campaign }) {
  const [open, setOpen] = useState(false);
  const current = useDevCurrent();
  const sheet = useMemo(() => buildSheet(state), [state.scene, state.caseId, state.completedCases.length, state.investigationProgress[state.caseId], state.hypothesis[state.caseId]]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="devAnswer" data-open={open} aria-label="개발자 정답 보기(읽기 전용)">
      {open && (
        <div className="devAnswerPanel" role="dialog">
          <header><b>정답 보기 · DEV</b><small>읽기 전용 — 진행·저장·판정에 영향 없음</small><button type="button" onClick={() => setOpen(false)} aria-label="닫기">×</button></header>
          <div className="devAnswerBody">
            {current && <section className="devNow"><h4>현재 질문 · {current.stage}</h4><p className="devQ">{current.question}</p>{current.rows.map((r, i) => <p key={i} data-tone={r.tone}><i>{r.k}</i>{r.v}</p>)}</section>}
            {sheet.map(sec => <section key={sec.title}><h4>{sec.title}</h4>{sec.rows.map((r, i) => <p key={i} data-tone={r.tone}><i>{r.k}</i>{r.v}</p>)}</section>)}
          </div>
        </div>
      )}
      <button type="button" className="devAnswerBtn" onClick={() => setOpen(v => !v)} aria-expanded={open}>정답 보기</button>
    </div>
  );
}
