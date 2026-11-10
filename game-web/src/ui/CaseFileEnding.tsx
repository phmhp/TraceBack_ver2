// Final screens, one printed page each:
// - escaped: a WANTED poster (Lou & Ming portraits + bounty) next to the case brief
// - caught:  a police booking sheet (mugshots in prison stripes) next to the same brief
// The case brief summarises every fault case: symptom → evidence → cause → verified repair.
import { DRIVER, ENGINEER } from "../game/cast";
import React from "react";
import type { Campaign, CaseId } from "../game/runtime";
import { SCENARIOS, SCENARIO_META } from "../game/scenarios";
import { contractStorageKey, type VerificationContract } from "../game/verificationContract";
import { SceneBackdrop } from "./game-shell";
import { Icon, type IconName } from "./Icon";

const A = "/assets/";
const SHEET = `${A}cutscene-character-master-v1.png`; // 1536 × 1024 turnaround sheet
const SHEET_W = 1536, SHEET_H = 1024;
// Front-view head-and-shoulders crops on the sheet (x, y, w, h).
const CATS = [
  { id: "lou", name: DRIVER, role: "드라이버", crop: [40, 20, 250, 300] },
  { id: "ming", name: ENGINEER, role: "엔지니어", crop: [40, 510, 250, 300] },
] as const;

const cropStyle = ([x, y, w, h]: readonly number[]): React.CSSProperties => ({
  backgroundImage: `url(${SHEET})`,
  backgroundSize: `${SHEET_W / w * 100}% ${SHEET_H / h * 100}%`,
  backgroundPosition: `${x / (SHEET_W - w) * 100}% ${y / (SHEET_H - h) * 100}%`,
  aspectRatio: `${w} / ${h}`,
});

type CaseStatus = "solved" | "open" | "skipped" | "none";
const STATUS_LABEL: Record<CaseStatus, string> = { solved: "해결", open: "미해결", skipped: "건너뜀", none: "미발생" };

function caseStatus(state: Campaign, id: CaseId): CaseStatus {
  if (state.completedCases.includes(id)) return "solved";
  if (id === "brake" && state.optionalBrake === "skipped") return "skipped";
  if (state.caseId === id && state.checkpoint !== "start") return "open";
  if (id === "brake" && state.optionalBrake === "undecided") return "none";
  return id === "brake" ? "open" : "none";
}

const score = (state: Campaign) => Math.max(0, 100 - state.collisions * 8 - state.hints * 4);
const rank = (value: number) => (value >= 85 ? "S" : value >= 70 ? "A" : "B");
const clock = (seconds: number) => `${Math.floor(seconds / 60)}분 ${String(Math.round(seconds % 60)).padStart(2, "0")}초`;

// Picture data for each case: the signal chain with the fault position, the
// "normal vs at the time" measurement and the one-line lesson.
const T = `${A}ending-thumbs/`;
type Fault = { at: "node" | "link"; index: number; label: string };
const CASE_VISUAL: Record<CaseId, {
  chain: { img: string; label: string; role: string }[];
  fault: Fault;
  meter: { label: string; unit: string; normal: number; actual: number; max: number };
  lesson: string;
}> = {
  propulsion: {
    chain: [
      { img: "accel_pedal", label: "가속 페달", role: "입력" },
      { img: "vcu", label: "VCU", role: "제어" },
      { img: "traction_motor", label: "구동 모터", role: "출력" },
    ],
    fault: { at: "link", index: 0, label: "신호 60%→27%" },
    meter: { label: "모터 토크", unit: "Nm", normal: 204, actual: 91, max: 220 },
    lesson: "입력 신호가 줄어든 채 전달되면, 출력도 그만큼 약해진다",
  },
  thermal: {
    chain: [
      { img: "motor_temp_sensor", label: "온도 센서", role: "입력" },
      { img: "thermal_ecu", label: "Thermal ECU", role: "제어" },
      { img: "cooling_fan", label: "냉각 팬", role: "출력" },
    ],
    fault: { at: "node", index: 1, label: "PWM 출력 SW 0%" },
    meter: { label: "팬 응답 (명령 대비)", unit: "%", normal: 100, actual: 0, max: 100 },
    lesson: "팬 요청은 정상인데 PWM 출력 SW부터 0% → 출력 어댑터 실행 순서를 확인",
  },
  brake: {
    chain: [
      { img: "brake_pedal", label: "브레이크 페달", role: "입력" },
      { img: "brake_ecu", label: "Brake ECU", role: "제어" },
      { img: "brake_caliper", label: "캘리퍼", role: "출력" },
    ],
    fault: { at: "link", index: 1, label: "I/O 명령 42→8 bar" },
    meter: { label: "마찰 제동 응답", unit: "%", normal: 55, actual: 8, max: 60 },
    lesson: "내부 압력 명령은 정상, I/O 어댑터 SW가 전송값을 다시 축소",
  },
};

// Functional-safety view of each case (ISO 26262 vocabulary only; no ASIL is
// assigned because that depends on each vehicle's own hazard analysis).
const CASE_SAFETY: Record<CaseId, { hazard: string; detect: string; safeState: string; insight: string }> = {
  propulsion: {
    hazard: "의도보다 약한 구동력 → 합류·추월 중 가속 부족",
    detect: "APS 두 센서 비교(타당성 검사), 요청 토크 vs 실제 토크 감시",
    safeState: "토크 제한(비상 운전) + 경고등",
    insight: "두 센서가 같은 값을 주는 SW 보정 오류는 타당성 검사로 못 잡음 → 요구사항 기반 테스트가 필요한 '체계적 고장'",
  },
  thermal: {
    hazard: "과열로 부품 손상, 주행 중 급격한 출력 상실",
    detect: "냉각수 온도 감시, 팬 명령 vs 회전 피드백 비교",
    safeState: "단계적 출력 제한(파워다운) + 경고등",
    insight: "갑자기 끄지 않고 단계적으로 줄이는 것 자체가 운전자를 위한 안전 설계",
  },
  brake: {
    hazard: "제동력 부족 → 정지 거리 증가",
    detect: "제동 압력 명령 vs 측정 압력 비교, 회생 실패 감시",
    safeState: "마찰 제동으로 보상 + 브레이크 경고등",
    insight: "한 제동 수단이 실패해도 다른 수단으로 보완하는 '중복' 구조",
  },
};

function SafetyView({ id }: { id: CaseId }) {
  const item = CASE_SAFETY[id];
  return <div className="cfSafety">
    <div className="cfSafetyFlow">
      <span className="is-hazard"><i><Icon name="warning" /></i><em>위험(Hazard)</em><b>{item.hazard}</b></span>
      <span className="is-detect"><i><Icon name="clue" /></i><em>감지(안전 메커니즘)</em><b>{item.detect}</b></span>
      <span className="is-safe"><i><Icon name="shield" /></i><em>안전 상태(Safe state)</em><b>{item.safeState}</b></span>
    </div>
    <p className="cfLesson"><Icon name="puzzle" /> {item.insight}</p>
  </div>;
}

function FaultMark({ fault, status, found }: { fault: Fault; status: CaseStatus; found: boolean }) {
  const fixed = status === "solved";
  return <span className={`cfFault ${fixed ? "is-fixed" : found ? "is-found" : "is-unknown"}`}>
    <i>{fixed ? "✔" : found ? "!" : "?"}</i>{fixed ? `${fault.label} → 수리` : found ? fault.label : "원인 미확인"}
  </span>;
}

function SignalChain({ id, status, found }: { id: CaseId; status: CaseStatus; found: boolean }) {
  const { chain, fault } = CASE_VISUAL[id];
  return <div className="cfChain">
    {chain.map((node, index) => <React.Fragment key={node.img}>
      {index > 0 && <div className={`cfLink ${fault.at === "link" && fault.index === index - 1 ? "is-fault" : ""}`}>
        <span className="cfLine" />
        {fault.at === "link" && fault.index === index - 1 && <FaultMark fault={fault} status={status} found={found} />}
      </div>}
      <figure className={`cfNode ${fault.at === "node" && fault.index === index ? "is-fault" : ""}`}>
        <small>{node.role}</small>
        <img src={`${T}${node.img}.png`} alt="" />
        <figcaption>{node.label}</figcaption>
        {fault.at === "node" && fault.index === index && <FaultMark fault={fault} status={status} found={found} />}
      </figure>
    </React.Fragment>)}
  </div>;
}

function Meter({ id }: { id: CaseId }) {
  const { meter } = CASE_VISUAL[id];
  const pct = (value: number) => `${Math.max(2, value / meter.max * 100)}%`;
  return <div className="cfMeter">
    <small>{meter.label}</small>
    <div className="cfBar is-normal"><em>정상</em><span><i style={{ width: pct(meter.normal) }} /></span><b>{meter.normal}{meter.unit}</b></div>
    <div className="cfBar is-actual"><em>고장 당시</em><span><i style={{ width: pct(meter.actual) }} /></span><b>{meter.actual}{meter.unit}</b></div>
  </div>;
}

function Steps({ state, id, status }: { state: Campaign; id: CaseId; status: CaseStatus }) {
  const scenario = SCENARIOS[id];
  const found = state.evidence[id].length, total = scenario.evidence.length;
  const picked = state.hypothesis[id];
  const correct = picked === scenario.root;
  const solved = status === "solved";
  const steps: { icon: IconName; label: string; state: "done" | "warn" | "fail" | "todo"; extra?: React.ReactNode }[] = [
    { icon: "eye" as IconName, label: "증상", state: "done" },
    { icon: "search" as IconName, label: "증거", state: found > 0 || solved ? "done" : "todo", extra: <span className="cfDots">{Array.from({ length: total }, (_, i) => <i key={i} className={i < found ? "on" : ""} />)}</span> },
    { icon: "target" as IconName, label: "원인", state: correct ? "done" : solved ? "warn" : picked ? "fail" : "todo" },
    { icon: "beaker" as IconName, label: "검증·수리", state: solved ? "done" : "fail" },
  ];
  return <ol className="cfSteps">{steps.map(step => <li key={step.label} className={`is-${step.state}`}>
    <i><Icon name={step.icon} /></i><span>{step.label}</span>{step.extra}
  </li>)}</ol>;
}

function CaseRow({ state, id, safety }: { state: Campaign; id: CaseId; safety: boolean }) {
  const scenario = SCENARIOS[id];
  const status = caseStatus(state, id);
  const active = status === "solved" || status === "open";
  const found = state.hypothesis[id] === scenario.root;
  return <article className={`cfCase is-${status}`} title={scenario.symptom}>
    <header>
      <small>{scenario.chapter}</small>
      <b>{scenario.title}</b>
      <span className="cfBadge">{STATUS_LABEL[status]}</span>
    </header>
    {active && safety && <SafetyView id={id} />}
    {active && !safety && <>
      <div className="cfVisual"><SignalChain id={id} status={status} found={found || status === "solved"} /><Meter id={id} /></div>
      <div className="cfLessonRow"><Steps state={state} id={id} status={status} /><p className="cfLesson"><Icon name="bulb" /> {CASE_VISUAL[id].lesson}</p></div>
    </>}
  </article>;
}

type Step04Record = { lastRun?: { verdict?: string; vals?: Record<string, string> }; answers?: Record<string, { answer?: string; why?: string }> };
const fromSession = <T,>(key: string): T | null => { try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; } };
const SIGNAL_PATH: Record<CaseId, string> = {
  propulsion: "APS 원신호 → VCU 페달 처리 → CAN 토크 명령 → 모터 토크",
  thermal: "냉각수 온도 → Thermal ECU 팬 요청 → PWM 출력 어댑터 → 팬 회전 → 온도·출력 제한",
  brake: "브레이크 입력 → Brake ECU 압력 계산 → I/O 전송 압력 명령 → 캘리퍼 압력 → 감속",
};
const CATEGORY: Record<CaseId, string> = {
  propulsion: "SW 계산·보정/스케일링",
  thermal: "SW 주기·타이밍 / 제어기 I/O 처리",
  brake: "제어기 I/O 처리 / SW 통신·인터페이스",
};

function AnalysisReport({ state, id }: { state: Campaign; id: CaseId }) {
  const scenario = SCENARIOS[id], meta = SCENARIO_META[id];
  const contract = fromSession<VerificationContract>(contractStorageKey(id));
  const trace = fromSession<{ chain?: string[] }>(`tb-step02-progress-${id}`);
  const bench = fromSession<Step04Record>(`tb-step04-progress-${id}`);
  const root = meta.hypotheses.find(item => item.truth);
  const testResult = bench?.lastRun?.verdict ? `${bench.lastRun.verdict} · ${Object.values(bench.lastRun.vals ?? {}).join(" · ")}` : "이 세션에 STEP04 실행 기록이 남아 있지 않음";
  const judgement = root && bench?.answers?.[root.id] ? `${bench.answers[root.id].answer ?? "판단"} · ${bench.answers[root.id].why ?? ""}` : "이 세션에 가설 판단 기록이 남아 있지 않음";
  return <details className="cfAnalysis">
    <summary><Icon name="clipboard" /> 고장 분석 보고서 · 실제 기록 보기</summary>
    <dl>
      <div><dt>사건·증상</dt><dd>{scenario.chapter} · {scenario.symptom}</dd></div>
      <div><dt>고장 유형·근본 원인</dt><dd>{CATEGORY[id]} · {root?.label ?? "시나리오 원인 미확인"}</dd></div>
      <div><dt>차량 도메인·E/E 경로</dt><dd>{meta.domain} · {SIGNAL_PATH[id]}</dd></div>
      <div><dt>정상 제어 로직</dt><dd>{meta.normalSpec}</dd></div>
      <div><dt>STEP02 역추적</dt><dd>{trace?.chain?.length ? trace.chain.join(" ← ") : "이 세션에 역추적 경로 기록이 남아 있지 않음"}</dd></div>
      <div><dt>STEP03 시험 계약</dt><dd>{contract ? `${contract.objective} · ${contract.stimulus.sequence} · 기대 ${contract.expected.value}` : "이 세션에 시험 계약 기록이 남아 있지 않음"}</dd></div>
      <div><dt>STEP04 비교·가설 판단</dt><dd>{testResult}<br />{judgement}</dd></div>
      <div><dt>수리·재시험·주행 복귀</dt><dd>{scenario.repair} · 완료 상태에서 동일 조건 재시험·회귀 후 주행 복귀</dd></div>
      <div><dt>유사 고장 접근</dt><dd>증상에서 출력 방향으로 측정값을 거슬러 최초 편차를 찾고, 같은 입력의 정상/사건 SW 시험으로 경쟁 가설을 구분한 뒤 수리 후 같은 조건으로 다시 확인</dd></div>
    </dl>
  </details>;
}

const REQUIRED_CASES = ["propulsion", "thermal"] as const;

type ReportItem = { label: string; value: string };

function reportItems(state: Campaign, id: CaseId): { title: string; lead: string; items: ReportItem[] } {
  const scenario = SCENARIOS[id], meta = SCENARIO_META[id];
  const contract = fromSession<VerificationContract>(contractStorageKey(id));
  const trace = fromSession<{ chain?: string[] }>(`tb-step02-progress-${id}`);
  const bench = fromSession<Step04Record>(`tb-step04-progress-${id}`);
  const root = meta.hypotheses.find(item => item.truth);
  const verdict = bench?.lastRun?.verdict
    ? `${bench.lastRun.verdict} · ${Object.values(bench.lastRun.vals ?? {}).join(" · ")}`
    : "이 세션에 STEP04 실행 기록이 남아 있지 않음";
  const judgement = root && bench?.answers?.[root.id]
    ? `${bench.answers[root.id].answer ?? "판단"} · ${bench.answers[root.id].why ?? ""}`
    : "이 세션에 가설 판단 기록이 남아 있지 않음";
  const solved = state.completedCases.includes(id);
  return {
    title: scenario.chapter.replace("사건", "CASE"),
    lead: `${scenario.symptom} ${CATEGORY[id]} 관점에서 실제 기록을 복습합니다.`,
    items: [
      { label: "원인·관찰 현상", value: `${root?.label ?? "시나리오 원인 미확인"} · ${scenario.symptom}` },
      { label: "도메인·신호 경로", value: `${meta.domain} · ${SIGNAL_PATH[id]}` },
      { label: "정상 제어 로직", value: meta.normalSpec },
      { label: "STEP02 역추적", value: trace?.chain?.length ? trace.chain.join(" ← ") : "이 세션에 역추적 경로 기록이 남아 있지 않음" },
      { label: "STEP03 테스트 설계서", value: contract ? `${contract.objective} · ${contract.stimulus.sequence} · 기대 ${contract.expected.value}` : "이 세션에 테스트 설계서 기록이 남아 있지 않음" },
      { label: "STEP04 검증·가설", value: `${verdict} / ${judgement}` },
      { label: "SW 수정·재시험", value: solved ? `${scenario.repair} · 완료 상태 기록됨` : "수리·동일 조건 재시험 완료 기록이 남아 있지 않음" },
    ],
  };
}

function WantedReport({ state, escaped }: { state: Campaign; escaped: boolean }) {
  const [page, setPage] = React.useState(0);
  const id = REQUIRED_CASES[page] as CaseId | undefined;
  const report = id ? reportItems(state, id) : null;
  const finalLead = escaped ? "필수 두 사건의 실제 기록을 연결해 주행 복귀와 항만 탈출 결과를 정리합니다." : "필수 두 사건의 실제 기록을 연결해 현재 추격 결과를 정리합니다.";
  const lead = report?.lead ?? finalLead;
  const [typed, setTyped] = React.useState(0);
  React.useEffect(() => {
    setTyped(0);
    const timer = window.setInterval(() => setTyped(value => {
      if (value >= lead.length) { window.clearInterval(timer); return lead.length; }
      return value + 2;
    }), 18);
    return () => window.clearInterval(timer);
  }, [lead]);
  const complete = typed >= lead.length;
  const pageLabel = page < 2 ? `CASE ${page + 1}` : "최종 결과";
  const finalItems: ReportItem[] = [
    { label: "필수 사건", value: `${REQUIRED_CASES.filter(caseId => state.completedCases.includes(caseId)).length} / 2 완료` },
    { label: "주행 복귀", value: escaped ? "수리·검증 완료 뒤 기존 주행 위치에서 항만 탈출" : "탈출 실패 기록 · 다시 시도 시 저장된 사건 상태를 사용" },
    { label: "검증 실행", value: `${state.benchRuns}회` },
    { label: "진단 접근", value: "증상에서 출력 방향으로 거슬러 최초 편차를 찾고, 같은 입력의 SW 시험으로 가설을 구분한 뒤 수리 후 동일 조건으로 확인" },
  ];
  const items = report?.items ?? finalItems;
  return <section className="cfBrief cfWantedReport" aria-label="최종 고장 분석 보고서">
    <header className="cfBriefHead">
      <small>{escaped ? "사건 파일 TB-16 · 종결" : "사건 파일 TB-16 · 체포 보고"}</small>
      <h2>{pageLabel}</h2>
      <span className="cfPageCount">{page + 1} / 3</span>
    </header>
    <p className="cfTypedLead" aria-live="polite">{lead.slice(0, typed)}{!complete && <i aria-hidden="true">▌</i>}</p>
    <dl className={`cfReportGrid ${complete ? "is-complete" : ""}`}>
      {items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
    </dl>
    <footer className="cfPageNav">
      <button className="cfBtn" onClick={() => setPage(value => Math.max(0, value - 1))} disabled={page === 0}>← 이전</button>
      {!complete && <button className="cfBtn" onClick={() => setTyped(lead.length)}>전체 표시</button>}
      <button className="cfBtn cfPrimary" onClick={() => setPage(value => Math.min(2, value + 1))} disabled={page === 2}>다음 →</button>
    </footer>
  </section>;
}

function CaseBrief({ state, escaped }: { state: Campaign; escaped: boolean }) {
  if (escaped) return <WantedReport state={state} escaped={escaped} />;
  const value = score(state);
  const [safety, setSafety] = React.useState(false);
  return <section className="cfBrief">
    <header className="cfBriefHead">
      <small>{escaped ? "사건 파일 TB-16 · 종결" : "사건 파일 TB-16 · 체포 보고"}</small>
      <h2>사건 발생 개요</h2>
      <div className="cfLens" role="group" aria-label="보기 관점">
        <button className={safety ? "" : "on"} onClick={() => setSafety(false)}><Icon name="wrench" /> 고장 추적</button>
        <button className={safety ? "on" : ""} onClick={() => setSafety(true)}><Icon name="shield" /> 안전 관점</button>
      </div>
      <p>네오 베이 항만 레이스 추격 · 부두 탈출 작전</p>
    </header>
    <dl className="cfMeta">
      <div><dt>주행 거리</dt><dd>{Math.round(state.raceDistance).toLocaleString()} m</dd></div>
      <div><dt>경과 시간</dt><dd>{clock(state.raceElapsedSeconds)}</dd></div>
      <div><dt>추격차 격차</dt><dd>{escaped ? `${Math.round(state.policeGapMeters)} m` : "0 m"}</dd></div>
      <div><dt>검증 실행</dt><dd>{state.benchRuns}회</dd></div>
    </dl>
    <div className="cfCases">{(["propulsion", "thermal", "brake"] as CaseId[]).map(id => <React.Fragment key={id}><CaseRow state={state} id={id} safety={safety} />{state.completedCases.includes(id) && !safety && <AnalysisReport state={state} id={id} />}</React.Fragment>)}</div>
    <footer className="cfFoot">
      <span>충돌 <b>{state.collisions}</b></span>
      <span>힌트 <b>{state.hints}</b></span>
      <span>운전 점수 <b>{value}</b></span>
      <span className="cfRank">등급 <b>{rank(value)}</b></span>
    </footer>
  </section>;
}

export function WantedEnding({ state, send }: { state: Campaign; send: React.Dispatch<any> }) {
  const bounty = 2_000_000 + score(state) * 50_000;
  return <div className="caseFileScreen is-escaped">
    <SceneBackdrop image={`${A}stitch23/ship-escape.png`} position="center" shade="deep" />
    <div className="cfSheet">
      <section className="cfPoster cfWanted">
        <h1>WANTED</h1>
        <p className="cfSub">전기차 도주 2인조 · 생포 시 포상</p>
        <div className="cfPhotos">{CATS.map(cat => <figure key={cat.id}>
          <div className="cfPhoto" style={cropStyle(cat.crop)} />
          <figcaption><b>{cat.name}</b><span>{cat.role}</span></figcaption>
        </figure>)}</div>
        <div className="cfBounty"><small>현상금</small><b>₩ {bounty.toLocaleString()}</b></div>
        <p className="cfNote">고장 난 차를 달리면서 고쳐 부두에서 배로 탈출함. 최종 목격 지점: 네오 베이 항만 램프.</p>
        <span className="cfStamp">탈출 성공</span>
      </section>
      <CaseBrief state={state} escaped />
      <div className="cfActions">
        <button className="cfBtn" onClick={() => send({ type: "TITLE" })}>메인 메뉴</button>
        <button className="cfBtn cfPrimary" onClick={() => send({ type: "NEW_GAME" })}>새 사건 시작 →</button>
      </div>
    </div>
  </div>;
}

export function BustedEnding({ state, send }: { state: Campaign; send: React.Dispatch<any> }) {
  const scenario = SCENARIOS[state.caseId];
  return <div className="caseFileScreen is-caught">
    <SceneBackdrop image={`${A}stitch23/fail-rain.png`} position="center" shade="deep" />
    <div className="cfSheet">
      <section className="cfPoster cfBooking">
        <header><small>네오베이 경찰서</small><h1>체포 기록</h1></header>
        <div className="cfPhotos">{CATS.map((cat, index) => <figure key={cat.id}>
          <div className="cfMug">
            <div className="cfPhoto" style={cropStyle(cat.crop)} />
            <span className="cfStripes" />
            <span className="cfPlacard">TB-16-00{index + 1}<br />{cat.name}</span>
          </div>
          <figcaption><b>{cat.name}</b><span>{cat.role}</span></figcaption>
        </figure>)}</div>
        <p className="cfNote">체포 지점: {Math.round(state.raceDistance).toLocaleString()} m · 진행 중이던 사건: {scenario.chapter}</p>
        <p className="cfTip">고장 원인을 더 빨리 좁힐수록 추격차와의 격차가 덜 줄어요. 증거를 다시 확인해 보세요.</p>
        <span className="cfStamp">체포</span>
      </section>
      <CaseBrief state={state} escaped={false} />
      <div className="cfActions">
        <button className="cfBtn" onClick={() => send({ type: "TITLE" })}>처음으로</button>
        <button className="cfBtn cfPrimary" onClick={() => send({ type: "RETRY_CHECKPOINT" })}>잡힌 지점부터 다시 →</button>
      </div>
    </div>
  </div>;
}
