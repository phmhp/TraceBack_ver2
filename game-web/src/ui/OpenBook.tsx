// 오픈북: the garage's NORMAL material for the case's domain/function (E/E path + Control SW blocks + requirement).
// Never shows case evidence, the cause or the answer test. Free to open in the trace and verification stages.
import { numify } from "./numify";
import React, { useState } from "react";
import type { CaseId } from "../game/runtime";
import { getFeatureLayer, ownerController, type DomainId } from "../experiences";
import { EV_DOMAINS } from "../features/garage/evData";
import { KIND_TAG, Picto, blockKind, plainText } from "../features/garage/SimulinkDiagram";
import { Icon } from "./Icon";
import { play } from "./sfx";

const BOOK: Record<CaseId, { domain: DomainId; feature: number; name: string; req: string }[]> = {
  propulsion: [{ domain: "drive", feature: 0, name: "구동 · 운전자 토크 요청", req: "가속 페달 0~100% → 토크 요청 0~340 Nm, 60%면 204 Nm. 배터리·온도 한계 260 Nm 이하. D단·READY일 때만." }],
  thermal: [
    { domain: "thermal", feature: 1, name: "열관리 · 펌프·팬 제어", req: "냉각수 65°C 이상이면 팬 켜짐, 60°C 이하면 꺼짐. 켜지면 목표 1850 rpm으로 PWM 조절." },
    { domain: "thermal", feature: 3, name: "열관리 · 열 한계 출력 제한", req: "구동계가 너무 뜨거우면 보호를 위해 구동 출력을 줄여요(파워다운 표시등)." },
  ],
  regen: [
    { domain: "drive", feature: 2, name: "구동 · 토크 배분·제한", req: "회생 요청은 부호까지 정해진 값이에요. 가속 페달 0%·40 km/h 이상에서 토크 지령은 회생 요청과 같은 방향(−40 Nm)이고, 평지에서 −0.5 m/s²로 감속해요." },
    { domain: "brake", feature: 1, name: "제동 · 회생·마찰 협조", req: "회생 요청은 감속 방향(음수)으로 VCU에 전달돼요. 회생 크기는 배터리가 받을 수 있는 한계 이내예요." },
  ],
  brake: [{ domain: "brake", feature: 1, name: "제동 · 회생·마찰 협조", req: "페달 55% → 목표 감속 3.2 m/s². 회생은 배터리가 받을 수 있는 만큼, 나머지는 마찰(1 m/s²당 20 bar)." }],
};

const LAYER_TABS = ["기능 흐름", "부품·E/E", "SW 구성", "SW 로직"] as const;

/** 정비소 노트: the normal-behaviour material of the case's functions in the garage's four layers. Never shows case evidence or the answer. */
export function OpenBookModal({ caseId, onClose, layer = 1, focus }: { caseId: CaseId; onClose: () => void; layer?: number; focus?: string }) {
  const [tab, setTab] = useState<number>(layer);
  return <div className="pieceZoom" onClick={onClose}><article className="rpNote openBook" onClick={event => event.stopPropagation()}>
    <button className="pieceZoomClose" aria-label="닫기" onClick={onClose}>×</button>
    <small><Icon name="book" /> 오픈북 · 정비소에서 본 정상 동작</small><h2>정상이면 이렇게 동작해요</h2>
    <p className="pzTip">사건 기록이 아니라 정상 자료예요. 원인은 직접 재고 시험해서 찾아요.</p>
    <nav className="obTabs" role="tablist" aria-label="정비소 층">{LAYER_TABS.map((name, index) => <button key={name} role="tab" aria-selected={tab === index} className={tab === index ? "on" : ""} onClick={() => { setTab(index); play("pop"); }}><i>{index + 1}</i>{name}</button>)}</nav>
    {BOOK[caseId].map(note => { const feature = EV_DOMAINS[note.domain].features[note.feature]; const owner = ownerController(note.domain, note.feature); return <section key={note.name}>
      <b>{note.name} <em className="obCat">{feature.category}</em></b>
      <p className="obReq"><Icon name="clipboard" /> {numify(note.req)}</p>
      {tab < 3 ? <div className="obPath">{getFeatureLayer(note.domain, note.feature, tab).map((label, index, all) => <React.Fragment key={`${label}-${index}`}><span className={focus === label ? "focus" : ""}>{label}</span>{index < all.length - 1 && <i>→</i>}</React.Fragment>)}</div>
        : <div className="rpNoteCards">{getFeatureLayer(note.domain, note.feature, 3).map(label => { const kind = blockKind(label); return <div key={label} className={`rpNoteCard kind-${kind} ${focus === label ? "focus" : ""}`}><div className="flowBlock"><Picto kind={kind} /><small>{KIND_TAG[kind]}</small></div><b>{label}</b><span>{plainText(label, kind)}</span></div>; })}</div>}
      {tab === 2 && <p className="obNote">{owner ? `이 SW 컴포넌트들은 ${owner.name}에서 실행돼요.` : "여러 제어기가 나눠 실행해요."}</p>}
      {tab === 0 && <p className="obNote">{feature.summary}</p>}
    </section>; })}
  </article></div>;
}

export function OpenBookButton({ caseId }: { caseId: CaseId }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className="openBookBtn" onClick={() => { setOpen(true); play("pop"); }}><Icon name="book" /> 오픈북</button>
    {open && <OpenBookModal caseId={caseId} onClose={() => setOpen(false)} />}
  </>;
}
