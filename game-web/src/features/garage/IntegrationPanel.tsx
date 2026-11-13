import { useMemo, useState } from "react";
import { QuestionCard } from "../../ui/QuestionCard";
import { CatSay } from "../../ui/CatSay";
import { play } from "../../ui/sfx";
import { CONNECTIONS } from "../../sim/components.ts";
import { resolveEndpoint } from "../../sim/registry.ts";
import { EE_LINKS } from "./eeLinks.ts";
import { garageFacts } from "./garageFacts.ts";
import { canExplain, type GarageProgress } from "./garageProgress.ts";

const DOMAIN_KO: Record<string, string> = { drive: "구동", thermal: "열관리", power: "전원", brake: "제동", steer: "조향", driver: "운전자 입력" };
export const HUB_QUESTIONS = ["hub:cross", "hub:onoff", "hub:path"] as const;

/** Signals that cross a domain border, read from the real registry (CAN messages between controllers). */
export function crossDomainLinks() {
  return CONNECTIONS.filter(c => c.flow === "can_message").map(c => {
    const from = resolveEndpoint(c.from), to = resolveEndpoint(c.to);
    return from && to && from.component.domainId !== to.component.domainId
      ? { id: c.id, signal: from.port.signal ?? "", unit: from.port.unit, from: from.component.nameKo, to: to.component.nameKo, fromDomain: DOMAIN_KO[from.component.domainId] ?? from.component.domainId, toDomain: DOMAIN_KO[to.component.domainId] ?? to.component.domainId }
      : null;
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));
}

type Compare = { id: string; name: string; onLabel: string; offLabel: string; on: string; off: string; effect: string };
function compares(): Compare[] {
  const f = garageFacts();
  return [
    { id: "min", name: "토크 한계(MIN)", onLabel: "한계 적용", offLabel: "한계 없음", on: `요청 ${f.drive.req100} Nm → ${f.drive.arb100} Nm로 제한`, off: `요청 ${f.drive.req100} Nm가 그대로 전달`, effect: "한계를 넘는 요청이 하위 시스템으로 전달돼요" },
    { id: "fan", name: "냉각 팬 제어", onLabel: "팬 동작", offLabel: "팬 정지", on: `냉각수 ${f.thermal.tcWith} °C · 모터 ${f.thermal.tmWith} °C · 출력 허용 ${f.thermal.derWith} %`, off: `냉각수 ${f.thermal.tcWithout} °C · 모터 ${f.thermal.tmWithout} °C · 출력 허용 ${f.thermal.derWithout} %`, effect: "온도가 오르고 출력이 제한돼요" },
    { id: "regen", name: "회생·마찰 협조", onLabel: "회생 가능", offLabel: "회생 0", on: `마찰 압력 ${f.brake.cmdWithRegen} bar`, off: `마찰 압력 ${f.brake.cmdNoRegen} bar`, effect: "마찰 제동이 더 많은 몫을 맡아요" },
  ];
}

/** Hub (전체보기) integration missions: cross-domain signals, ON/OFF necessity, and building the signal path. Not a 4th view. */
export function IntegrationPanel({ progress, onSolve, onWrong, onBack }: { progress: GarageProgress; onSolve: (id: string) => void; onWrong: (id: string) => void; onBack: () => void }) {
  const done = (id: string) => progress.solved.includes(id);
  const firstOpen = HUB_QUESTIONS.findIndex(id => !done(id));
  const [qi, setQi] = useState(firstOpen < 0 ? 0 : firstOpen);
  const id = HUB_QUESTIONS[qi];
  const solved = done(id);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cmp, setCmp] = useState(0);
  const [on, setOn] = useState(true);
  const [seq, setSeq] = useState<number[]>([]);
  const links = useMemo(crossDomainLinks, []);
  const cmps = useMemo(compares, []);
  const path = useMemo(() => {
    const hops = EE_LINKS["drive:0"]; const names: { label: string; unit: string }[] = [];
    for (const i of [0, 1, 3, 4, 5]) { const h = hops[i]!; names.push({ label: h.signal, unit: h.unit }); }
    return names;
  }, []);
  const order = useMemo(() => [2, 0, 4, 1, 3], []); // fixed shuffle (deterministic for tests and replays)
  const answer = (q: string, index: number, ok: boolean, why: string) => {
    setPicked(p => ({ ...p, [q]: index })); setMsg({ ok, text: why });
    if (ok) { onSolve(q); play("success"); } else { onWrong(q); play("error"); }
  };
  const tap = (i: number) => {
    if (solved || seq.includes(i)) return;
    if (i === seq.length) { const next = [...seq, i]; setSeq(next); play("pop"); if (next.length === path.length) { setMsg({ ok: true, text: "신호가 페달에서 구동 토크까지 순서대로 이어졌어요." }); onSolve(id); play("success"); } else setMsg({ ok: true, text: `${path[i].label} — 맞아요. 다음 신호는?` }); }
    else { setMsg({ ok: false, text: `아직 ${seq.length + 1}번째가 아니에요. 페달에서 시작해 다음으로 전달되는 신호를 찾아보세요.` }); onWrong(id); play("error"); }
  };
  const goNext = () => { setQi(Math.min(qi + 1, HUB_QUESTIONS.length - 1)); setMsg(null); setSeq([]); };
  const dots = HUB_QUESTIONS.map((q, index) => ({ id: q, state: (done(q) ? "done" : index === qi ? "now" : "todo") as "done" | "now" | "todo", label: `${index + 1}번 질문` }));
  const catLines = solved ? ["연결해서 생각하면 전체가 보여요."] : msg && !msg.ok ? ["천천히 다시 생각해 봐요."] : ["이번엔 도메인 사이를 연결해 보자!"];
  const allDone = HUB_QUESTIONS.every(done);

  const body = (() => {
    if (id === "hub:cross") {
      const choices = [
        { label: "VCU — 열관리 ECU의 Thermal_Derate(%)를 받아요", ok: true, why: "맞아요. 열관리 ECU가 CAN으로 출력 제한 비율을 보내면 VCU가 토크 요청을 줄여요." },
        { label: "제동 ECU — 휠 속도를 받아요", ok: false, why: "제동 ECU는 유압 제어를 맡아요. 출력 제한 요청을 받는 쪽은 토크를 정하는 제어기예요." },
        { label: "EPS ECU — 조향각을 받아요", ok: false, why: "EPS ECU는 조향 보조를 맡아요. 구동 토크와는 다른 도메인이에요." },
      ];
      return <>
        <ul className="g3Cross" aria-label="도메인 사이 CAN 신호(신호 레지스트리)">{links.slice(0, 5).map(l => <li key={l.id}><b>{l.fromDomain}</b> {l.from} → <b>{l.toDomain}</b> {l.to}<em>{l.signal} ({l.unit})</em></li>)}</ul>
        {choices.map((c, index) => { const p = picked[id] === index; return <button key={c.label} type="button" className="tbqChoice" disabled={solved} data-state={solved ? (c.ok ? "ok" : "dim") : p ? "no" : "idle"} onClick={() => answer(id, index, c.ok, c.why)}><b>{c.label}</b>{(solved && c.ok) || p ? <small>{c.why}</small> : null}</button>; })}
      </>;
    }
    if (id === "hub:onoff") {
      const c = cmps[cmp];
      const choices = [
        { label: "냉각 팬 제어", ok: true, why: "맞아요. 팬이 멈추면 냉각수·모터 온도가 오르고 출력 허용이 낮아져요." },
        { label: "토크 한계(MIN)", ok: false, why: "한계가 없으면 한계를 넘는 요청이 전달돼요. 온도가 오르는 문제와는 달라요." },
        { label: "회생·마찰 협조", ok: false, why: "회생이 0이면 마찰 압력이 커져요. 온도 상승이 이어지는 연쇄는 아니에요." },
      ];
      return <>
        <div className="g3Cmp">
          <div className="g3CmpTabs" role="tablist">{cmps.map((x, i) => <button key={x.id} type="button" role="tab" aria-selected={cmp === i} onClick={() => setCmp(i)}>{x.name}</button>)}</div>
          <div className="g3CmpSwitch"><button type="button" aria-pressed={on} onClick={() => setOn(true)}>{c.onLabel}</button><button type="button" aria-pressed={!on} onClick={() => setOn(false)}>{c.offLabel}</button></div>
          <p className="g3CmpVal" data-on={on}>{on ? c.on : c.off}<small>모델 계산값 · {on ? "정상" : c.effect}</small></p>
        </div>
        {choices.map((x, index) => { const p = picked[id] === index; return <button key={x.label} type="button" className="tbqChoice" disabled={solved} data-state={solved ? (x.ok ? "ok" : "dim") : p ? "no" : "idle"} onClick={() => answer(id, index, x.ok, x.why)}><b>{x.label}</b>{(solved && x.ok) || p ? <small>{x.why}</small> : null}</button>; })}
      </>;
    }
    return <div className="g3Path" aria-label="신호 경로 만들기">
      <ol className="g3PathDone">{seq.map(i => <li key={i}><b>{path[i].label}</b><small>{path[i].unit}</small></li>)}</ol>
      <div className="g3PathChips">{order.map(i => <button key={i} type="button" className="tbqChoice" disabled={solved || seq.includes(i)} data-state={seq.includes(i) ? "ok" : "idle"} onClick={() => tap(i)}><b>{path[i].label}</b><small>{path[i].unit}</small></button>)}</div>
    </div>;
  })();

  const titles = ["도메인 사이 신호", "기능이 꺼지면?", "신호 경로 완성"];
  const qs = [
    "열관리 ECU가 과열을 알릴 때, 그 신호(Thermal_Derate)를 받아 구동 토크를 줄이는 제어기는?",
    "세 기능을 각각 꺼 보세요. 꺼졌을 때 ‘온도 상승’으로 이어지는 것은?",
    "페달 입력이 구동 토크가 되기까지 전달되는 신호를 순서대로 눌러 경로를 완성하세요.",
  ];
  const hows = ["신호 레지스트리의 도메인 사이 연결을 보고 고르세요", "ON/OFF 값은 STEP04와 같은 모델 계산이에요", "① 페달 → ② … → ⑤ 구동 토크 순서로 누르세요"];
  return (
    <aside className="g3Mission g3HubMission">
      <QuestionCard flipKey={id} mission="통합 미션" order={qi + 1} total={HUB_QUESTIONS.length} dots={dots} onDot={index => { if (done(HUB_QUESTIONS[index]) || index === qi) { setQi(index); setMsg(null); setSeq([]); } }} step={titles[qi]} question={qs[qi]} how={hows[qi]} status={solved ? "solved" : msg && !msg.ok ? "wrong" : "idle"} feedback={id === "hub:path" ? msg : null} canExplain={canExplain(progress, id)} explanation="정답은 신호가 전달되는 순서(센서 → 제어기 → 통신 → 인버터 → 모터)를 따라가면 찾을 수 있어요."
        footer={solved ? (qi < HUB_QUESTIONS.length - 1 ? <button type="button" onClick={goNext}>다음 질문 →</button> : <button type="button" onClick={onBack}>{allDone ? "통합 미션 완료 ✓" : "마무리"}</button>) : null}>
        {body}
      </QuestionCard>
      <div className="g3CatSlot"><CatSay lines={catLines} resetKey={`${id}:${solved}:${msg?.ok}`} /></div>
    </aside>
  );
}
