import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon, type IconName } from "../../ui/Icon";
import { getPartModel } from "../parts/partModels";
import { COORD_SIGNALS, DOMAIN_GROUPS, DOMAIN_ORDER, EV_DOMAINS, GROUP_ROLE, OVERVIEW_IO, type DomainGroup, type DomainId } from "./evData";

type Line = { key: string; d: string };

type ArchitectureTreePanelProps = {
  icons: Record<DomainId, IconName>;
  activeGroup?: DomainGroup | null;
  onGroup: (group: DomainGroup) => void;
  onDomain: (id: DomainId) => void;
  onShow3d: () => void;
};

/**
 * One shared tree for every STEP01 view.
 *
 * The 3D overview used to have a second, slightly different tree markup. That
 * made its position, width, hover behavior, and hierarchy drift from the
 * architecture screen. Keep one component and one visual contract instead:
 * vehicle → area → domain, with every area visibly grouped at the same time.
 */
export function ArchitectureTreePanel({ icons, activeGroup = null, onGroup, onDomain, onShow3d }: ArchitectureTreePanelProps) {
  return <aside className="garageArchitectureTree" aria-label="차량 아키텍처 탐색">
    <header><Icon name="layers" /><div><b>아키텍처 탐색</b><small>차량 전체 › 영역 › 도메인</small></div></header>
    <button className={`garageTreeVehicle ${activeGroup === null ? "on" : ""}`} onClick={onShow3d}>
      <Icon name="car" /><span>차량 전체</span><small>3D 보기</small>
    </button>
    <div className="garageTreeGroups">
      {DOMAIN_GROUPS.map((group, groupIndex) => {
        const ids = DOMAIN_ORDER.filter(id => EV_DOMAINS[id].group === group);
        return <section key={group} className={`garageTreeSection g-${groupIndex} ${activeGroup === group ? "on" : ""}`}>
          <button className="garageTreeGroup" onClick={() => onGroup(group)}>
            <b>{group}</b><small>{ids.length}개 도메인</small>
          </button>
          <div className="garageTreeDomains">
            {ids.map(id => <button key={id} onClick={() => onDomain(id)} title={`${group} · ${EV_DOMAINS[id].label}`}>
              <Icon name={icons[id]} /><span>{EV_DOMAINS[id].label}</span><small>기능 {EV_DOMAINS[id].features.length}개</small>
            </button>)}
          </div>
        </section>;
      })}
    </div>
    <button className="garageTree3d" onClick={onShow3d}><Icon name="car" /> 차량 3D 보기</button>
  </aside>;
}

/** Whole-vehicle system view: inputs on the left, outputs on the right, domains grouped in the middle on one network. */
export function ArchitectureOverview({ icons, onPick, onShow3d, onGroupChange, focusGroup = null }: { icons: Record<DomainId, IconName>; onPick: (id: DomainId) => void; onShow3d: () => void; onGroupChange?: (group: DomainGroup | null) => void; focusGroup?: DomainGroup | null }) {
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<Partial<Record<DomainId, HTMLButtonElement | null>>>({});
  const [signal, setSignal] = useState<number | null>(null);
  const [open, setOpen] = useState<DomainGroup | null>(focusGroup);
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => setOpen(focusGroup), [focusGroup]);

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
  }, [signal, open]);
  const pickGroup = (group: DomainGroup | null) => { setSignal(null); setOpen(group); onGroupChange?.(group); };
  // A coordination signal is an overlay on the current architecture view.
  // Do not navigate away from the overview when it is selected: the player
  // must be able to compare the signal with all three domain cards.
  const openSignal = (index: number) => { setOpen(null); setSignal(index); };

  const active = signal === null ? null : COORD_SIGNALS[signal];
  const involved = new Set<DomainId>(active ? [active.from, ...active.to] : []);

  const ioModels: Record<DomainGroup, { inputs: string[]; outputs: string[] }> = {
    "파워트레인": { inputs: ["accel_pedal", "charging_port", "motor_temp_sensor"], outputs: ["traction_motor", "hv_battery", "cooling_pump"] },
    "섀시": { inputs: ["brake_pedal", "steering_wheel", "imu_sensor"], outputs: ["brake_caliper", "steering_rack", "damper"] },
    "차량 제어": { inputs: ["generic_ecu", "imu_sensor"], outputs: ["instrument_cluster", "vcu"] },
  };
  const hardwareThumb = (id: string) => `/assets/intake/images/${getPartModel(id).ref}`;
  const groupCards = <div className="archGroupPick">
    <p className="archAsk"><span><b>영역을 선택하세요</b><small>영역 안의 도메인 버튼을 눌러 기능 흐름을 살펴볼 수 있어요.</small></span></p>
    <div className="archGroupCards">{DOMAIN_GROUPS.map((group, gi) => {
      const ids = DOMAIN_ORDER.filter(id => EV_DOMAINS[id].group === group);
      const io = OVERVIEW_IO[group];
      return <section key={group} className={`archGroupCard g-${gi}`}>
        <button className="archGroupHeading" onClick={() => pickGroup(group)}><span className="archAreaMark"><Icon name={gi === 0 ? "gear" : gi === 1 ? "wheel" : "chip"} /></span><span><b>{group}</b><small>{GROUP_ROLE[group]}</small></span><i>영역 보기 →</i></button>
        <div className="archGroupVisual" aria-hidden="true"><span><Icon name="signal" /></span><i>→</i><div>{ids.map(id => <em key={id} style={{ "--domain": EV_DOMAINS[id].accent } as React.CSSProperties}><Icon name={icons[id]} /></em>)}</div><i>→</i><span><Icon name="car" /></span></div>
        <div className="archGroupIo">
          <div className="archIoItems"><b>입력 요소</b>{io.inputs.map((item, index) => <span key={item}><img src={hardwareThumb(ioModels[group].inputs[index])} alt="" /><i>{item}</i></span>)}</div>
          <div className="archIoItems"><b>출력 요소</b>{io.outputs.map((item, index) => <span key={item}><img src={hardwareThumb(ioModels[group].outputs[index])} alt="" /><i>{item}</i></span>)}</div>
        </div>
        <div className="archDomainButtons" aria-label={`${group} 도메인`}>
          {ids.map(id => <button key={id} onClick={() => onPick(id)} style={{ "--domain": EV_DOMAINS[id].accent } as React.CSSProperties}><Icon name={icons[id]} /><span>{EV_DOMAINS[id].label}</span><small>열기</small></button>)}
        </div>
      </section>;
    })}</div>
    <section className="archCoordPreview" aria-label="도메인 협조 신호 미리보기">
      <header><b><Icon name="signal" /> 도메인 협조 신호</b><small>각 영역은 네트워크로 한계를 주고받으며 함께 차량을 제어합니다.</small></header>
      <div>{COORD_SIGNALS.slice(0, 6).map((item, index) => <button key={item.name} onClick={() => openSignal(index)}><strong>{EV_DOMAINS[item.from].label}</strong><i>→</i><strong>{item.to.map(id => EV_DOMAINS[id].label).join(" · ")}</strong><span>{item.name}</span></button>)}</div>
      {active && <article className="archSignalDetail" aria-live="polite">
        <header><span className="archSignalKicker">협조 신호 선택됨</span><b>{active.name}</b><button type="button" aria-label="협조 신호 닫기" onClick={() => setSignal(null)}>×</button></header>
        <div className="archSignalRoute"><strong>{EV_DOMAINS[active.from].label}</strong><i>→</i>{active.to.map(id => <React.Fragment key={id}><strong>{EV_DOMAINS[id].label}</strong>{id !== active.to.at(-1) && <i>→</i>}</React.Fragment>)}</div>
        <p>{active.purpose}</p>
        <small>입력·한계 신호가 네트워크를 통해 다음 도메인의 제어 판단으로 전달됩니다.</small>
      </article>}
    </section>
  </div>;

  return <div className="mechanismViewer archView" ref={root}>
    {open === null ? groupCards : <>
    <nav className="archCrumb" aria-label="현재 위치"><button onClick={() => pickGroup(null)}>전체 영역</button><span>›</span>{DOMAIN_GROUPS.map(group => <button key={group} className={group === open ? "on" : ""} onClick={() => pickGroup(group)}>{group}</button>)}<small>도메인 버튼을 선택하면 기능 흐름이 열립니다</small></nav>
    <div className="archCols one">
      {DOMAIN_GROUPS.filter(group => group === open).map(group => {
        const ids = DOMAIN_ORDER.filter(id => EV_DOMAINS[id].group === group);
        const io = OVERVIEW_IO[group];
        return <div className="archRow" key={group}>
          <ul className="archIo in">{io.inputs.map(item => <li key={item}>{item}</li>)}</ul>
          <i className="archArrow" aria-hidden="true" />
          <section className={`archGroup g-${DOMAIN_GROUPS.indexOf(group)}`} aria-label={group}>
            <h3>{group}</h3>
            <p className="archGroupRole">{GROUP_ROLE[group]}</p>
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
    </>}
    <svg className="archLines" aria-hidden="true"><defs><marker id="archHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#c4553a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></marker></defs>{lines.map(line => <path key={line.key} d={line.d} markerEnd="url(#archHead)" />)}</svg>
    {open !== null && <div className="archSignals">
      <b>협조 신호</b>
      {COORD_SIGNALS.map((item, index) => <button key={item.name} className={signal === index ? "on" : ""} onClick={() => setSignal(signal === index ? null : index)}>{item.name}</button>)}
      <button className="arch3d" onClick={onShow3d}><Icon name="car" /> 3D 차량</button>
    </div>}
    <p className="archNote">{active ? `${EV_DOMAINS[active.from].label} → ${active.to.map(id => EV_DOMAINS[id].label).join("·")} · ${active.purpose}` : open === null ? "" : "아래 협조 신호를 누르면 도메인 사이 신호가 보여요."}</p>
  </div>;
}
