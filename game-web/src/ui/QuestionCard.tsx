import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import "./common-v3.css";

export type QuestionDot = { id: string; state: "done" | "now" | "todo"; label?: string };

/**
 * Shared question card (MISSION / Q. tag, one question at a time, flip-in on every new question).
 * It only draws the card; each stage decides what the action area (children) contains and when the
 * question is solved, so the same card can be used by STEP01~04.
 */
export function QuestionCard({
  mission, order, total, dots, onDot, step, question, how, status, feedback, canExplain, explanation, onExplain, variant, children, footer, flipKey,
}: {
  mission: string; // "MISSION 02"
  order: number; // 1-based question number inside this mission
  total: number;
  dots: QuestionDot[];
  onDot?: (index: number) => void;
  step: string; // what is being learned ("신호 경로")
  question: string;
  how: string; // one-line instruction for the action
  status: "idle" | "wrong" | "solved";
  feedback?: { ok: boolean; text: string } | null;
  canExplain?: boolean; // 2+ wrong answers on this question
  explanation?: ReactNode;
  onExplain?: () => void; // called when the player opens the explanation (e.g. to run the cursor demo)
  variant?: "bar"; // horizontal layout for stages whose action area needs the full height
  children?: ReactNode;
  footer?: ReactNode;
  flipKey: string;
}) {
  const [explainOpen, setExplainOpen] = useState<string | null>(null);
  const open = explainOpen === flipKey;
  // Fit: when the content (long explanations after an answer) is taller than the card, tighten the card step by step
  // so the footer button is never covered. Level 0 = normal, 1 = compact, 2 = dense.
  const flip = useRef<HTMLDivElement>(null);
  const [dense, setDense] = useState(0);
  const contentKey = `${flipKey}|${status}|${feedback?.text ?? ""}|${open}|${canExplain}`;
  useLayoutEffect(() => { setDense(0); }, [contentKey]);
  useLayoutEffect(() => { const el = flip.current; if (el && dense < 2 && el.scrollHeight > el.clientHeight + 1) setDense(level => level + 1); });
  return (
    <article className="tbq" data-status={status} data-variant={variant} data-dense={variant === "bar" ? undefined : dense} key={flipKey}>
      <div className="tbqFlip" ref={flip} key={`flip-${flipKey}`}>
        <header className="tbqHead">
          <span className="tbqTag">{mission}</span>
          <span className="tbqStep">{step}</span>
          <ol className="tbqDots" aria-label={`질문 ${order}/${total}`}>
            {dots.map((dot, index) => (
              <li key={dot.id} data-state={dot.state}>
                <button type="button" aria-label={dot.label ?? `질문 ${index + 1}`} aria-current={dot.state === "now" ? "step" : undefined} disabled={!onDot || dot.state === "todo"} onClick={() => onDot?.(index)}>
                  {dot.state === "done" ? "✓" : index + 1}
                </button>
              </li>
            ))}
          </ol>
        </header>
        <h2 className="tbqQ"><i>Q.</i> {question}</h2>
        <p className="tbqHow">{how}</p>
        {children && <div className="tbqBody">{children}</div>}
        {feedback && <p className={`tbqFeedback ${feedback.ok ? "ok" : "no"}`} role="status">{feedback.ok ? "✓ " : "✗ "}{feedback.text}</p>}
        {canExplain && status !== "solved" && !open && <button type="button" className="tbqExplainBtn" onClick={() => { setExplainOpen(flipKey); onExplain?.(); }}>해설 보기</button>}
        {open && status !== "solved" && <div className="tbqExplain"><b>해설</b>{explanation}</div>}
        {footer && <footer className="tbqFoot">{footer}</footer>}
      </div>
    </article>
  );
}
