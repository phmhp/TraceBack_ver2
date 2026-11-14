import React, { useLayoutEffect, useRef, useState } from "react";
import { Icon, type IconName } from "../../ui/Icon";
import { COORD_SIGNALS, DOMAIN_GROUPS, DOMAIN_ORDER, EV_DOMAINS, OVERVIEW_IO, type DomainId } from "./evData";

type Line = { key: string; d: string };

/** Whole-vehicle system view: inputs on the left, outputs on the right, domains grouped in the middle on one network. */
export function ArchitectureOverview({ icons, onPick, onShow3d }: { icons: Record<DomainId, IconName>; onPick: (id: DomainId) => void; onShow3d: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<Partial<Record<DomainId, HTMLButtonElement | null>>>({});
  const [signal, setSignal] = useState<number | null>(null);
  const [lines, setLines] = useState<Line[]>([]);

  useLayoutEffect(() => {
    if (signal === null || !root.current) { setLines([]); return; }
    const base = root.current.getBoundingClientRect();
    const scale = base.width / root.current.offsetWidth || 1;
    const centre = (id: DomainId) => {
      const r = buttons.current[id]?.getBoundingClientRect();
      return r ? { x: (r.left - base.left + r.width / 2) / scale, y: (r.top - base.top + r.height / 2) / scale, w: r.width / scale, h: r.height / scale } : null;
    };
    const from = centre(COORD_SIGNALS[signal].from);
    if (!from) return;
    setLines(COORD_SIGNALS[signal].to.flatMap(target => {
      const to = centre(target);
      if (!to) return [];
      const vertical = Math.abs(to.y - from.y) > 20;
      if (!vertical) {
        // same row: arch over the buttons so the arrow never crosses another domain's label
        const top1 = from.y - from.h / 2, top2 = to.y - to.h / 2;
        return [{ key: `${COORD_SIGNALS[signal].name}-${target}`, d: `M${from.x} ${top1} V${top1 - 12} H${to.x} V${top2 - 2}` }];
      }
      const y1 = from.y + Math.sign(to.y - from.y) * from.h / 2;
      const y2 = to.y - Math.sign(to.y - from.y) * to.h / 2;
      const bend = Math.abs(to.x - from.x) > 6 ? ` V${(y1 + y2) / 2} H${to.x}` : "";
      return [{ key: `${COORD_SIGNALS[signal].name}-${target}`, d: `M${from.x} ${y1}${bend} L${to.x} ${y2}` }];
    }));
  }, [signal]);

  const active = signal === null ? null : COORD_SIGNALS[signal];
  const involved = new Set<DomainId>(active ? [active.from, ...active.to] : []);

  return <div className="mechanismViewer archView" ref={root}>
    <div className="archCols">
      {DOMAIN_GROUPS.map(group => {
        const ids = DOMAIN_ORDER.filter(id => EV_DOMAINS[id].group === group);
        const io = OVERVIEW_IO[group];
        return <div className="archRow" key={group}>
          <ul className="archIo in">{io.inputs.map(item => <li key={item}>{item}</li>)}</ul>
          <i className="archArrow" aria-hidden="true" />
          <section className={`archGroup g-${DOMAIN_GROUPS.indexOf(group)}`} aria-label={group}>
            <h3>{group}</h3>
            <div className="archDomains">{ids.map(id => <button key={id} ref={element => { buttons.current[id] = element; }} className={involved.has(id) ? (active?.from === id ? "from" : "to") : ""} style={{ "--domain": EV_DOMAINS[id].accent } as React.CSSProperties} onClick={() => onPick(id)}>
              <span><Icon name={icons[id]} /></span><b>{EV_DOMAINS[id].label}</b><small>기능 {EV_DOMAINS[id].features.length}개</small>
            </button>)}</div>
          </section>
          <i className="archArrow" aria-hidden="true" />
          <ul className="archIo out">{io.outputs.map(item => <li key={item}>{item}</li>)}</ul>
        </div>;
      })}
      <div className="archNet"><Icon name="signal" /><b>차량 네트워크</b><span>CAN · 이더넷 · 게이트웨이로 모든 도메인이 연결돼요</span></div>
    </div>
    <svg className="archLines" aria-hidden="true"><defs><marker id="archHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#c4553a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></marker></defs>{lines.map(line => <path key={line.key} d={line.d} markerEnd="url(#archHead)" />)}</svg>
    <div className="archSignals">
      <b>협조 신호</b>
      {COORD_SIGNALS.map((item, index) => <button key={item.name} className={signal === index ? "on" : ""} onClick={() => setSignal(signal === index ? null : index)}>{item.name}</button>)}
      <button className="arch3d" onClick={onShow3d}><Icon name="car" /> 3D 차량</button>
    </div>
    <p className="archNote">{active ? `${EV_DOMAINS[active.from].label} → ${active.to.map(id => EV_DOMAINS[id].label).join("·")} · ${active.purpose}` : "도메인을 누르면 기능을 볼 수 있어요. 아래 협조 신호를 누르면 도메인 사이 신호가 보여요."}</p>
  </div>;
}
