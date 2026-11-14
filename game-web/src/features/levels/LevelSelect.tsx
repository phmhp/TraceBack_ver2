import React, { useState } from "react";
import type { Campaign } from "../../game/runtime";
import { LEVELS, levelStatus, lockedReason, type LevelDef } from "../../game/levels";
import { EV_DOMAINS } from "../garage/evData";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";
import { MissionBar } from "../../ui/MissionBar";
import { Icon } from "../../ui/Icon";
import { ENGINEER } from "../../game/cast";
import { play } from "../../ui/sfx";
import "./level-select.css";

type Send = React.Dispatch<any>;
// node positions on the 1100x440 road drawing
const POS = [{ x: 150, y: 310 }, { x: 430, y: 170 }, { x: 720, y: 310 }, { x: 980, y: 150 }];
const ROAD = `M 40 380 C 120 380 120 310 150 310 S 330 170 430 170 S 600 310 720 310 S 900 150 980 150 L 1070 150`;

const Stars = ({ n }: { n: number }) => <span className="lvStars" aria-label={`별 ${n}개`}>{[1, 2, 3].map(i => <i key={i} className={i <= n ? "on" : ""}>★</i>)}</span>;

export function LevelSelect({ state, send }: { state: Campaign; send: Send }) {
  const firstOpen = LEVELS.find(def => levelStatus(state, def) === "open") ?? LEVELS[LEVELS.length - 1];
  const [sel, setSel] = useState<number>(firstOpen.level);
  const def = LEVELS.find(item => item.level === sel)!;
  const status = levelStatus(state, def);
  const cleared = LEVELS.filter(item => levelStatus(state, item) === "cleared").length;
  const stars = def.caseId ? state.levelStars?.[def.caseId] ?? 0 : 0;
  const start = () => { if (status !== "open") { play("error"); return; } play("pop"); send({ type: "START_LEVEL", level: def.level }); };
  const say = status === "locked" ? lockedReason(def) : status === "cleared" ? "이미 클리어한 레벨이에요. 다음 레벨을 골라 보세요." : def.level === 4 ? "두 필수 레벨을 마쳤어요. 이제 부두로 달려요." : def.kind === "bonus" ? "선택 레벨이에요. 건너뛰고 탈출해도 돼요." : "준비가 되면 시작을 눌러요. 정비소에서 본 내용이 도움이 돼요.";
  return <div className="levelSelect">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="레벨 선택" title="추격 코스" distanceMeters={state.policeGapMeters} raceDistanceMeters={state.raceDistance} progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <main className="lvWork">
      <MissionBar action="도전할 레벨을 고르세요" question="이번에는 어떤 고장이 기다릴까요?" progress={{ now: cleared, total: LEVELS.filter(item => item.kind === "required").length + 0 || 1 }} />
      <section className="lvMap" aria-label="레벨 지도">
        <svg viewBox="0 0 1100 440" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d={ROAD} className="lvRoadEdge" /><path d={ROAD} className="lvRoad" /><path d={ROAD} className="lvRoadLine" /></svg>
        {LEVELS.map((item, i) => { const st = levelStatus(state, item); const s = item.caseId ? state.levelStars?.[item.caseId] ?? 0 : 0; return <button key={item.level} className={`lvNode ${st} ${item.kind} ${sel === item.level ? "sel" : ""}`} style={{ left: `${POS[i].x / 11}%`, top: `${POS[i].y / 4.4}%` }} onClick={() => { setSel(item.level); play("pop"); }} aria-pressed={sel === item.level}>
          <span className="lvBadge">{st === "locked" ? <Icon name="lock" /> : <Icon name={item.icon} />}</span>
          <b>{item.level === 4 ? "탈출" : `${item.level}레벨`}</b>
          <small>{item.kind === "bonus" ? "선택 · " : ""}{item.domainLabel}</small>
          {st === "cleared" && <Stars n={s} />}
        </button>; })}
      </section>
      <aside className="lvPanel" aria-label="레벨 정보">
        <LevelCard def={def} status={status} stars={stars} />
      </aside>
      <footer className="lvDock"><p className="lvSay"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><b>{ENGINEER}</b><span>{say}</span></p>
        <p className="lvProgress">클리어 {cleared} / {LEVELS.length} · 별 {Object.values(state.levelStars ?? {}).reduce((a, b) => a + (b ?? 0), 0)}개</p></footer>
      <div className="lvStart"><button className="stageProgressAction" disabled={status !== "open"} onClick={start}>{status === "cleared" ? "클리어" : status === "locked" ? "잠김" : "시작 →"}</button></div>
    </main>
  </div>;
}

function LevelCard({ def, status, stars }: { def: LevelDef; status: "cleared" | "open" | "locked"; stars: number }) {
  return <div className="lvCard">
    <small>{def.kind === "bonus" ? "선택 레벨" : def.kind === "finale" ? "마지막 레벨" : `${def.level}레벨`} · {def.domainLabel}</small>
    <h2>{def.title}</h2>
    <p className="lvTeaser">{status === "locked" ? "아직 잠겨 있어요." : def.teaser}</p>
    <dl>
      <div><dt>시점</dt><dd>{status === "locked" ? "?" : def.phase}</dd></div>
      <div><dt>배우는 것</dt><dd>{status === "locked" ? "?" : def.learn}</dd></div>
      <div><dt>난이도</dt><dd className="lvDots">{[1, 2, 3].map(i => <i key={i} className={i <= def.difficulty ? "on" : ""} />)}</dd></div>
      {status === "cleared" && <div><dt>결과</dt><dd><Stars n={stars} /></dd></div>}
    </dl>
    {def.garage.length > 0 && <div className="lvGarage"><small><Icon name="book" /> 정비소에서 본 내용</small><ul>{def.garage.map(item => <li key={`${item.domain}-${item.feature}`}><b>{EV_DOMAINS[item.domain].label}</b><span>{EV_DOMAINS[item.domain].features[item.feature].name}</span></li>)}</ul></div>}
  </div>;
}
