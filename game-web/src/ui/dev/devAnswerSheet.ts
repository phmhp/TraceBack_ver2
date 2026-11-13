// DEV-ONLY. Builds the per-scene answer sheet from the real scenario data. Nothing here is invented:
// every row is read from the same tables the game itself uses (missions, CASES, SCENARIO_META, REF, contract).
import type { Campaign, CaseId } from "../../game/runtime";
import { SCENARIOS, SCENARIO_META } from "../../game/scenarios";
import { fallbackVerificationContract } from "../../game/verificationContract";
import { MISSIONS } from "../../features/garage/missions";
import { fillFacts } from "../../features/garage/garageFacts";
import { CASES } from "../../features/board/DominoTrace";
import { REF } from "../../features/wiring/RefPuzzle";
import type { DevRow } from "./devAnswerStore";

export type DevSection = { title: string; rows: DevRow[] };
const CASE_NAME: Record<CaseId, string> = { propulsion: "구동(가속)", thermal: "열관리(과열)", brake: "제동(선택)" };
const row = (k: string, v: string, tone?: DevRow["tone"]): DevRow => ({ k, v, tone });

function garage(): DevSection[] {
  return MISSIONS.map(m => ({
    title: `STEP01 · ${m.domain}:${m.feature} ${m.title}${m.core ? " (필수)" : " (선택)"}`,
    rows: m.questions.flatMap(q => [
      row(`Q ${q.id}`, fillFacts(q.q)),
      ...(q.kind === "pick"
        ? [row("정답(노드)", (q.answer ?? []).join(" / "), "ok"), row("해설", fillFacts(q.recap))]
        : (q.choices ?? []).map(c => row(c.ok ? "○ 정답" : "× 오답", `${fillFacts(c.label)} — ${fillFacts(c.why)}`, c.ok ? "ok" : "no"))),
    ]),
  }));
}

function board(id: CaseId): DevSection[] {
  const c = CASES[id], s = SCENARIOS[id], meta = SCENARIO_META[id];
  const dom = (d: string) => c.doms.find(x => x.id === d);
  const first = dom(c.first), start = dom(c.start);
  return [
    { title: `STEP02 · ${CASE_NAME[id]} 사건`, rows: [
      row("증상", s.symptom), row("요구사항", c.req),
      row("증상 출력(시작)", `${start?.label ?? c.start}`, "ok"),
      row("최초 편차", `${first?.label ?? c.first} · 정상 ${first?.ref}${first?.unit} → 고장 ${first?.run}${first?.unit} (t=${first?.t}${c.timeUnit})`, "ok"),
      row("실제 원인(가설 id)", `${s.root} — ${s.hypotheses.find(h => h.id === s.root)?.label ?? ""}`, "ok"),
      row("의심 구간 이름", c.section.name),
      ...c.section.choices.map(ch => row(ch.ok ? "○ 구간 정답" : "× 구간 오답", `${ch.label} — ${ch.why}`, ch.ok ? "ok" : "no")),
    ] },
    { title: "STEP02 · 후보 측정값(정상 → 고장)", rows: c.doms.filter(d => d.status === "bad").map(d => row(d.label, `${d.ref}${d.unit} → ${d.run}${d.unit} · t=${d.t ?? "-"}${c.timeUnit}${d.id === c.first ? " ← 최초" : ""}`)) },
    { title: "STEP02 · 가설 정답 (유력/반박)", rows: meta.hypotheses.map(h => row(h.label, `${h.truth ? "참(원인)" : "거짓"}${h.stage1 ? ` — ${h.stage1}` : ""}`, h.truth ? "ok" : undefined)) },
  ];
}

function wiring(id: CaseId): DevSection[] {
  const r = REF[id];
  return [
    { title: `STEP03 · ${CASE_NAME[id]} 정상 기준`, rows: [
      row("대상", `${r.domain} · ${r.feature} (${r.ecu})`),
      ...r.req.map((q, i) => row(`요구사항 ${i + 1}`, `${q.text} → 칸 ${q.slot + 1}`)),
      ...r.gaps.map(g => row(`빈칸 ${g + 1} 정답`, r.blocks[r.board[g]]?.label ?? r.board[g], "ok")),
      row("정상 블록 순서", r.board.map(b => r.blocks[b]?.label ?? b).join(" → ")),
      ...r.spares.filter(sp => r.blocks[sp]?.bad || r.blocks[sp]?.why).map(sp => row(`오답 조각 ${r.blocks[sp].label}`, r.blocks[sp].why ?? r.blocks[sp].bad ?? "", "no")),
      row("STEP04로 이어지는 기대값", fallbackVerificationContract(id).expected.value),
    ] },
  ];
}

function bench(id: CaseId): DevSection[] {
  const meta = SCENARIO_META[id], s = SCENARIOS[id], contract = fallbackVerificationContract(id);
  return [
    { title: `STEP04 · ${CASE_NAME[id]} 시험 정답`, rows: [
      row("원인 가설(참)", meta.hypotheses.find(h => h.truth)?.label ?? "", "ok"),
      row("결함 주입", meta.injection), row("정상 기준", meta.normalSpec), row("고장 모델", meta.faultModel),
      row("수리", `${s.repair} / ${meta.fix}`), row("재시험", meta.regression),
    ] },
    { title: "STEP04 · 가설별 판정", rows: meta.hypotheses.map(h => row(h.label, `${h.truth ? "참" : "거짓"}${h.decide ? ` — ${h.decide}` : ""}${h.decideAt ? ` [판정 수준: ${h.decideAt.join(",")}]` : ""}`, h.truth ? "ok" : undefined)) },
    { title: "STEP04 · 기대 출력(계약)", rows: contract.execution.expectedOutputs.map(o => row(o.signalId, `${o.value}${o.unit} ±${o.tolerance}`)) },
  ];
}

function race(id: CaseId): DevSection[] {
  const meta = SCENARIO_META[id], s = SCENARIOS[id];
  return [{ title: `레이스 · ${CASE_NAME[id]}`, rows: [row("고장 발생 조건", meta.trigger), row("증상", s.symptom), row("고장 모델", meta.faultModel), row("정상 기준", meta.normalSpec)] }];
}

/** Everything that exists for the current scene, plus a short "progress / next step" section. */
export function buildSheet(state: Campaign): DevSection[] {
  const id = state.caseId, scene = state.scene;
  const out: DevSection[] = [];
  if (scene.startsWith("GARAGE")) out.push(...garage());
  else if (scene === "BOARD") out.push(...board(id));
  else if (scene === "WIRING") out.push(...wiring(id));
  else if (scene === "TWIN_BENCH" || scene === "VERIFY_FAIL" || scene === "REPAIR") out.push(...bench(id));
  else if (["DRIVE_BRIEFING", "CHASE_NORMAL", "ASSIST_CHASE", "CHASE_RESUME", "SHIP_ESCAPE", "OPTIONAL_FAULT", "FAULT_CUE"].includes(scene)) out.push(...race(id));
  out.push({ title: "진행 정보(읽기 전용)", rows: [
    row("장면", scene), row("사건", `${id} (${CASE_NAME[id]})`), row("조사 단계", state.investigationProgress[id]),
    row("완료한 사건", state.completedCases.join(", ") || "없음"), row("선택한 가설", state.hypothesis[id] || "없음"),
    row("다음 단계로 넘어가는 값", `증거 ${state.evidence[id]?.length ?? 0}개 · 계약 기대값 ${fallbackVerificationContract(id).expected.value}`),
  ] });
  return out;
}
