import { useEffect, useMemo, useRef, useState } from "react";
import { QuestionCard, type QuestionDot } from "../../ui/QuestionCard";
import { useDevAnswerCurrent } from "../../ui/dev/devAnswerStore";
import { CatSay } from "../../ui/CatSay";
import { play } from "../../ui/sfx";
import { fillFacts } from "./garageFacts";
import { canExplain, isCoreComplete, wrongCount, type GarageProgress } from "./garageProgress";
import { IntegrationPanel } from "./IntegrationPanel";
import { MISSIONS, missionFor, type DomainKey, type Lens, type Mission, type MissionQuestion } from "./missions";
import "./step01-v3.css";

export type PickEvent = { lens: Lens; label: string; n: number };
export type StageFeedback = { ok: boolean; text: string } | null;

const LENS_NAME = ["Vehicle / System", "E/E", "Control SW"] as const;
const LENS_SHORT = ["Vehicle", "E/E", "Control SW"] as const;

/** A function chip shows: its name, whether it is selected, and its learning state — all visible at once (no hidden menu). */
export type FunctionState = "done" | "part" | "open" | "info";
export function functionState(progress: GarageProgress, domain: DomainKey, feature: number): { state: FunctionState; solved: number; total: number } {
  const mission = missionFor(domain, feature);
  if (!mission) return { state: "info", solved: 0, total: 0 };
  const solved = mission.questions.filter(item => progress.solved.includes(item.id)).length;
  return { state: solved === mission.questions.length ? "done" : solved ? "part" : "open", solved, total: mission.questions.length };
}

/** Solved / total questions over every mission of a domain (0/0 when the domain has no verified mission yet). */
export function domainProgress(progress: GarageProgress, domain: DomainKey): { solved: number; total: number } {
  return MISSIONS.filter(item => item.domain === domain).reduce((sum, item) => ({
    solved: sum.solved + item.questions.filter(q => progress.solved.includes(q.id)).length,
    total: sum.total + item.questions.length,
  }), { solved: 0, total: 0 });
}

const stateLabel = (info: ReturnType<typeof functionState>, mission?: Mission) =>
  info.state === "done" ? "✓ 완료" : info.state === "part" ? `${info.solved}/${info.total}` : info.state === "open" ? (mission?.core ? "필수 미션" : "미션") : "탐색";

/** Row above the stage: the four functions of the selected domain (left) and the three analysis lenses (right). */
export function StageBar({ domain, domainLabel, functions, feature, onFeature, lens, onLens, progress, chosen }: {
  domain: DomainKey; domainLabel: string; functions: string[]; feature: number; onFeature: (index: number) => void;
  lens: Lens; onLens: (lens: Lens) => void; progress: GarageProgress; chosen: boolean;
}) {
  const mission = chosen ? missionFor(domain, feature) : undefined;
  const lensDone = (index: Lens) => Boolean(mission) && mission!.questions.filter(item => item.lens === index).every(item => progress.solved.includes(item.id)) && mission!.questions.some(item => item.lens === index);
  return (
    <div className="g3Bar">
      <div className="g3Funcs" role="group" aria-label={`${chosen ? domainLabel : "도메인"} 기능`}>
        <span className="g3BarLabel">기능</span>
        {chosen ? functions.map((name, index) => {
          const m = missionFor(domain, index);
          const info = functionState(progress, domain, index);
          return (
            <button key={name} type="button" className="g3Func" data-state={info.state} aria-pressed={feature === index} onClick={() => onFeature(index)}>
              <i>{info.state === "done" ? "✓" : index + 1}</i><b>{name}</b><small>{stateLabel(info, m)}</small>
            </button>
          );
        }) : <em className="g3BarHint">도메인을 고르면 기능 4개가 여기에 나와요</em>}
      </div>
      <div className="g3Lens" role="group" aria-label="분석 관점">
        <span className="g3BarLabel">관점</span>
        {LENS_NAME.map((name, index) => (
          <button key={name} type="button" className="g3LensBtn" aria-pressed={lens === index} data-done={lensDone(index as Lens)} data-locked={!chosen && index > 0} onClick={() => onLens(index as Lens)} title="같은 기능을 보는 분석 관점(공식 표준의 고정 계층이 아닌 교육용 관점)">
            {lensDone(index as Lens) ? "✓ " : ""}{LENS_SHORT[index]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Right column: the question card, or an explanation panel when a function has no verified mission yet. */
export function MissionPanel({ chosen, domain, domainLabel, functionName, functionSummary, feature, lens, inputSelected, progress, pick, onSolve, onWrong, onLens, onFeedback, onStart, onFeature, onHub }: {
  chosen: boolean; domain: DomainKey; domainLabel: string; functionName: string; functionSummary: string; feature: number;
  lens: Lens; inputSelected: boolean; progress: GarageProgress; pick: PickEvent | null;
  onSolve: (id: string) => void; onWrong: (id: string) => void; onLens: (lens: Lens) => void;
  onFeedback: (feedback: StageFeedback) => void; onStart: (domain: DomainKey) => void; onFeature: (index: number) => void; onHub: () => void;
}) {
  const mission = chosen ? missionFor(domain, feature) : undefined;
  const firstOpen = (m: Mission) => { const i = m.questions.findIndex(item => !progress.solved.includes(item.id)); return i < 0 ? m.questions.length - 1 : i; };
  const [qi, setQi] = useState(0);
  const [summary, setSummary] = useState(false);
  const [answer, setAnswer] = useState<Record<string, { choice?: number; ok: boolean; text: string }>>({});
  const missionId = mission ? `${mission.domain}:${mission.feature}` : "";
  useEffect(() => { setQi(mission ? firstOpen(mission) : 0); setSummary(false); onFeedback(null); }, [missionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const question: MissionQuestion | undefined = mission?.questions[Math.min(qi, mission.questions.length - 1)];
  const solved = question ? progress.solved.includes(question.id) : false;
  const wrongs = question ? wrongCount(progress, question.id) : 0;
  const status: "idle" | "wrong" | "solved" = solved ? "solved" : answer[question?.id ?? ""] && !answer[question!.id].ok ? "wrong" : "idle";
  const allSolved = mission ? mission.questions.every(item => progress.solved.includes(item.id)) : false;
  // DEV-only: tell the shared answer viewer which question is on screen (read-only; dropped from production builds)
  import.meta.env.DEV && useDevAnswerCurrent(question && mission ? { stage: `STEP01 · ${mission.title}`, question: fillFacts(question.q), rows: question.kind === "pick" ? [{ k: "정답", v: (question.answer ?? []).join(" / "), tone: "ok" }, { k: "해설", v: fillFacts(question.recap) }] : (question.choices ?? []).map(c => ({ k: c.ok ? "○ 정답" : "× 오답", v: `${c.label} — ${fillFacts(c.why)}`, tone: c.ok ? "ok" as const : "no" as const })) } : null);

  // ---- answering ----
  const solve = (q: MissionQuestion, text: string, choice?: number) => {
    setAnswer(previous => ({ ...previous, [q.id]: { choice, ok: true, text } }));
    onSolve(q.id); onFeedback({ ok: true, text }); play("success");
  };
  const miss = (q: MissionQuestion, text: string, choice?: number) => {
    setAnswer(previous => ({ ...previous, [q.id]: { choice, ok: false, text } }));
    onWrong(q.id); onFeedback({ ok: false, text }); play("error");
  };
  const handled = useRef(0);
  useEffect(() => {
    if (!pick || pick.n === handled.current || !question || question.kind !== "pick" || solved) return;
    handled.current = pick.n;
    if (pick.lens !== question.lens) return; // answering needs the lens the question asks for
    if (question.needsInput && !inputSelected) { const text = "먼저 READY·D단을 켜고 입력을 꾹 눌러 신호를 보내 보세요."; setAnswer(previous => ({ ...previous, [question.id]: { ok: false, text } })); onFeedback({ ok: false, text }); play("error"); return; }
    if (question.answer?.includes(pick.label)) solve(question, `${pick.label} — ${fillFacts(question.recap)}`);
    else miss(question, `‘${pick.label}’은(는) 아직 아니에요. 질문을 다시 읽고 다른 부품을 눌러 보세요.`);
  }, [pick]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => {
    if (!mission) return;
    const next = Math.min(qi + 1, mission.questions.length - 1);
    setQi(next); onFeedback(null);
    window.dispatchEvent(new Event("tb-garage-close-inspector")); // the node popup must not cover the next answer
    onLens(mission.questions[next].lens);
  };

  // ---- hub (nothing selected yet) ----
  if (!chosen && progress.cleared) return <IntegrationPanel progress={progress} onSolve={onSolve} onWrong={onWrong} onBack={() => onStart("drive")} />;
  if (!chosen) {
    return (
      <aside className="g3Mission">
        <div className="tbq g3Plain">
          <header className="tbqHead"><span className="tbqTag">MISSION 00</span><span className="tbqStep">차량 전체 살펴보기</span></header>
          <h2 className="tbqQ"><i>Q.</i> 이 차에는 어떤 기능 묶음(도메인)이 있을까요?</h2>
          <p className="tbqHow">위에서 도메인을 골라 보세요. 처음에는 구동부터 시작하는 것을 추천해요.</p>
          <div className="tbqFoot"><button type="button" onClick={() => onStart("drive")}>구동으로 시작 →</button></div>
        </div>
        <div className="g3CatSlot"><CatSay lines={["차를 한 바퀴 둘러보자. 구동부터 눌러 볼까?"]} resetKey="hub" /></div>
      </aside>
    );
  }

  // ---- function without a verified mission: information exploration only ----
  if (!mission || !question) {
    const recommended = [0, 1, 2, 3].find(index => index !== feature && missionFor(domain, index));
    return (
      <aside className="g3Mission">
        <div className="tbq g3Plain">
          <header className="tbqHead"><span className="tbqTag">기본 정보 탐색</span><span className="tbqStep">{domainLabel}</span></header>
          <h2 className="tbqQ">{functionName}</h2>
          <p className="tbqHow">{functionSummary}</p>
          <p className="g3Note">이 기능의 학습 미션은 아직 준비 중이에요. 관점을 바꿔 부품과 신호 흐름을 살펴볼 수 있어요. 신호 흐름의 값은 계산된 값이 아니라 구조 설명이에요.</p>
          {recommended !== undefined && <div className="tbqFoot"><button type="button" onClick={() => onFeature(recommended)}>미션이 있는 기능으로 →</button></div>}
        </div>
        <div className="g3CatSlot"><CatSay lines={["여기는 둘러보기만 가능해요. ✓·미션 표시가 있는 기능에서 직접 풀어 볼 수 있어요."]} resetKey={`info-${domain}-${feature}`} /></div>
      </aside>
    );
  }

  if (summary && mission.core && allSolved) {
    return (
      <aside className="g3Mission">
        <div className="tbq g3Plain">
          <header className="tbqHead"><span className="tbqTag">STEP01 완료</span><span className="tbqStep">{mission.title}</span></header>
          <h2 className="tbqQ">무엇을 이해했나요?</h2>
          <div className="g3Clear">
            <h3>이해한 것</h3>
            <ul>
              <li>페달 입력은 센서 → VCU → CAN → 인버터·모터 → 바퀴를 거쳐 차량 가속이 돼요.</li>
              <li>제어 SW는 입력·설정값·상태·판단을 거쳐 출력을 정해요. 페달 100%는 {fillFacts("{drive.req100}")} Nm를 요청하지만 한계 {fillFacts("{drive.arb100}")} Nm로 제한돼요.</li>
              <li>정상일 때의 값(페달 60% → 모터 {fillFacts("{drive.mot60}")} Nm)을 알아야 이상을 알아볼 수 있어요.</li>
            </ul>
            <h3>STEP02에서 쓰는 지식</h3>
            <ul>
              <li>정상 신호 경로 — 어디서 값이 처음 어긋났는지 거꾸로 따라가요.</li>
              <li>정상 기준값 — 고장 때의 값과 비교해 ‘최초 편차’를 찾아요.</li>
              <li>센서·제어기·통신·액추에이터 구분 — 원인 후보를 좁혀요.</li>
            </ul>
          </div>
          <div className="tbqFoot"><button type="button" onClick={() => setSummary(false)}>← 질문 보기</button><button type="button" onClick={onHub}>전체보기·통합 미션 →</button></div>
        </div>
        <div className="g3CatSlot"><CatSay lines={["고장을 찾으려면 정상부터! 이제 STEP02에서 어긋난 신호를 찾아볼 거야.", "원하면 전체보기에서 통합 미션도 풀어 봐요."]} resetKey="clear" /></div>
      </aside>
    );
  }

  // ---- mission card ----
  const dots: QuestionDot[] = mission.questions.map((item, index) => ({ id: item.id, label: `${index + 1}. ${item.tag}`, state: progress.solved.includes(item.id) ? "done" : index === qi ? "now" : "todo" }));
  const current = answer[question.id];
  const wrongLens = question.kind === "pick" && lens !== question.lens;
  const feedback = current ? { ok: current.ok, text: current.text } : null;
  const catLines = solved ? [question.cat.solved, fillFacts(question.recap)] : status === "wrong" ? [question.cat.wrong] : [wrongLens ? `${LENS_SHORT[question.lens]} 관점으로 바꿔서 답해 볼까?` : question.cat.start];
  const coreDone = isCoreComplete(progress);
  const isLast = qi >= mission.questions.length - 1;

  return (
    <aside className="g3Mission">
      <QuestionCard
        flipKey={question.id}
        mission={`MISSION ${String(feature + 1).padStart(2, "0")}`}
        order={qi + 1}
        total={mission.questions.length}
        dots={dots}
        onDot={index => { const target = mission.questions[index]; if (progress.solved.includes(target.id) || index === qi) { setQi(index); onFeedback(null); onLens(target.lens); } }}
        step={`${question.tag} · ${LENS_NAME[question.lens]}`}
        question={question.q}
        how={question.kind === "pick" ? (wrongLens ? `${LENS_NAME[question.lens]} 관점에서 답해요` : question.how) : question.how}
        status={status}
        feedback={question.kind === "choose" ? null : feedback}
        canExplain={canExplain(progress, question.id)}
        explanation={<span>{question.kind === "choose" ? fillFacts(question.choices!.find(item => item.ok)!.why) : fillFacts(question.recap)}</span>}
        footer={solved ? (
          allSolved && isLast
            ? (mission.core ? <button type="button" onClick={() => setSummary(true)}>STEP01 정리 보기 →</button> : <button type="button" disabled>이 기능 완료 ✓</button>)
            : <button type="button" onClick={goNext}>다음 질문 →</button>
        ) : null}
      >
        {question.kind === "choose" && question.choices!.map((choice, index) => {
          const picked = current?.choice === index;
          const state = solved ? (choice.ok ? "ok" : "dim") : picked ? "no" : "idle";
          return (
            <button key={choice.label} type="button" className="tbqChoice" data-state={state} disabled={solved} onClick={() => choice.ok ? solve(question, fillFacts(choice.why), index) : miss(question, fillFacts(choice.why), index)}>
              <b>{fillFacts(choice.label)}</b>
              {(solved && choice.ok) || picked ? <small>{fillFacts(choice.why)}</small> : null}
            </button>
          );
        })}
        {question.kind === "pick" && !solved && (
          <p className="g3PickHint" data-ready={!question.needsInput || inputSelected}>
            {question.needsInput && !inputSelected ? "① READY·D단 켜기 → ② 입력 꾹 누르기 → ③ 부품 눌러 답하기" : "신호가 흐르고 있어요. 도면의 부품을 눌러 답하세요."}
          </p>
        )}
        {question.kind === "pick" && solved && <p className="g3PickHint" data-ready="true">{fillFacts(question.recap)}</p>}
      </QuestionCard>
      <div className="g3CatSlot"><CatSay lines={catLines} resetKey={`${question.id}:${status}:${wrongs}:${solved}`} /></div>
    </aside>
  );
}
