// 오픈북: the garage's NORMAL material for the case's domain/function (E/E path + Control SW blocks + requirement).
// Never shows case evidence, the cause or the answer test. Free to open in the trace and verification stages.
import { numify } from "./numify";
import React, { useState } from "react";
import type { CaseId } from "../game/runtime";
import { getFeatureLayer, type DomainId } from "../experiences";
import { KIND_TAG, Picto, blockKind, plainText } from "../features/garage/SimulinkDiagram";
import { Icon } from "./Icon";
import { play } from "./sfx";

const BOOK: Record<CaseId, { domain: DomainId; feature: number; name: string; req: string }[]> = {
  propulsion: [{ domain: "drive", feature: 0, name: "구동 · 운전자 토크 요청", req: "가속 페달 0~100% → 토크 요청 0~340 Nm, 60%면 204 Nm. 배터리·온도 한계 260 Nm 이하. D단·READY일 때만." }],
  thermal: [
    { domain: "thermal", feature: 1, name: "열관리 · 펌프·팬 제어", req: "냉각수 65°C 이상이면 팬 켜짐, 60°C 이하면 꺼짐. 켜지면 목표 1850 rpm으로 PWM 조절." },
    { domain: "thermal", feature: 3, name: "열관리 · 열 한계 출력 제한", req: "구동계가 너무 뜨거우면 보호를 위해 구동 출력을 줄여요(파워다운 표시등)." },
  ],
  brake: [{ domain: "brake", feature: 1, name: "제동 · 회생·마찰 협조", req: "페달 55% → 목표 감속 3.2 m/s². 회생은 배터리가 받을 수 있는 만큼, 나머지는 마찰(1 m/s²당 20 bar)." }],
};

export function OpenBookButton({ caseId }: { caseId: CaseId }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className="openBookBtn" onClick={() => { setOpen(true); play("pop"); }}><Icon name="book" /> 오픈북</button>
    {open && <div className="pieceZoom" onClick={() => setOpen(false)}><article className="rpNote openBook" onClick={event => event.stopPropagation()}>
      <button className="pieceZoomClose" onClick={() => setOpen(false)}>×</button>
      <small><Icon name="book" /> 오픈북 · 정비소에서 본 정상 동작</small><h2>정상이면 이렇게 동작해요</h2>
      <p className="pzTip">사건 기록이 아니라 정상 자료예요. 원인은 직접 재고 시험해서 찾아요.</p>
      {BOOK[caseId].map(note => <section key={note.name}>
        <b>{note.name}</b>
        <p className="obReq"><Icon name="clipboard" /> {numify(note.req)}</p>
        <div className="obPath">{getFeatureLayer(note.domain, note.feature, 1).map((label, index, all) => <React.Fragment key={`${label}-${index}`}><span>{label}</span>{index < all.length - 1 && <i>→</i>}</React.Fragment>)}</div>
        <div className="rpNoteCards">
          {getFeatureLayer(note.domain, note.feature, 3).map(label => { const kind = blockKind(label); return <div key={label} className={`rpNoteCard kind-${kind}`}><div className="flowBlock"><Picto kind={kind} /><small>{KIND_TAG[kind]}</small></div><b>{label}</b><span>{plainText(label, kind)}</span></div>; })}
        </div>
      </section>)}
    </article></div>}
  </>;
}
