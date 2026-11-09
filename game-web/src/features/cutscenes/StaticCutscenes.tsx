import React, { useEffect, useState } from "react";
import type { Campaign } from "../../game/runtime";
import { GameHeader, SceneBackdrop } from "../../ui/game-shell";
import { DUO } from "../../game/cast";

type Send = React.Dispatch<any>;
const A = "/assets/";

const heistFrames = [
  {
    image: `${A}cutscene-heist-escape-v1.png`,
    eyebrow: "장면 1/2",
    title: "폭스의 금고에서 상금을 되찾아 저택을 빠져나왔다",
    body: `${DUO}는 해안 도로에 세워 둔 붉은 EV로 달려간다.`,
  },
  {
    image: `${A}cutscene-heist-board-v1.png`,
    eyebrow: "장면 2/2",
    title: "탑승 완료 · 이제 직접 운전할 차례",
    body: "출발 3초 뒤 경찰차가 뒤에 따라붙는다. 해적선까지 붙잡히지 않고 달려야 한다.",
  },
] as const;

export function DriveBriefing({ state, send }: { state: Campaign; send: Send }) {
  const requestedFrame = Number(new URLSearchParams(location.search).get("cut"));
  const [frame, setFrame] = useState(requestedFrame === 1 ? 1 : 0);
  const current = heistFrames[frame];
  const ready = frame === heistFrames.length - 1;
  const beginRace = () => ready && send({ type: "BEGIN_RACE" });
  useEffect(() => { heistFrames.forEach(item => { const image = new Image(); image.src = item.image; }); }, []);
  useEffect(() => {
    if (ready || requestedFrame === 1) return;
    const timer = window.setTimeout(() => setFrame(1), 3600);
    return () => window.clearTimeout(timer);
  }, [ready, requestedFrame]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.code !== "Space" && event.key !== "Enter") || !ready) return;
      event.preventDefault();
      beginRace();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [ready]);
  return <div className="staticCutscene heistStillScene">
    <SceneBackdrop image={current.image} position="center" shade="none" />
    <GameHeader chapter="도주 준비" title="부잣집 탈출 작전" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <main className="stillCutLayout">
      <section className="stillStoryCard">
        <small>{current.eyebrow}</small>
        <h1>{current.title}</h1>
        <p>{current.body}</p>
        <div className="stillFrameDots">{heistFrames.map((_, index) => <i key={index} className={index <= frame ? "active" : ""} />)}</div>
      </section>
      <aside className="getawayBriefingCard">
        <small>도주 미션</small>
        <h2>{ready ? "붉은 EV 탑승 완료" : "도주 장면 재생 중"}</h2>
        <dl>
          <div><dt>경찰</dt><dd>출발 3초 뒤 후방 합류</dd></div>
          <div><dt>고장</dt><dd>주행 중 이상이 생기면 원인을 찾아 수리</dd></div>
          <div><dt>목표</dt><dd>해적선 갑판까지 도주</dd></div>
        </dl>
        <button className="primary" disabled={!ready} onClick={beginRace}>{ready ? "도주 시작" : "잠시 후 탑승 장면"}<i>→</i></button>
        {ready && <em>Enter 또는 클릭</em>}
      </aside>
    </main>
  </div>;
}

export function RepairSequence({ state, send }: { state: Campaign; send: Send }) {
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(3);
  useEffect(() => { const timer = window.setTimeout(() => setReady(true), 1000); return () => clearTimeout(timer); }, []);
  useEffect(() => {
    if (!ready) return;
    if (countdown <= 0) { send({ type: "APPLY_REPAIR" }); return; }
    const timer = window.setTimeout(() => setCountdown(value => value - 1), 850);
    return () => clearTimeout(timer);
  }, [countdown, ready, send]);
  const repairLabel = state.caseId === "propulsion" ? "페달 신호 변환 로직" : state.caseId === "thermal" ? "팬 PWM 출력 어댑터 SW" : "압력 명령 I/O 어댑터 SW";
  return <div className="staticCutscene repairStillScene">
    <SceneBackdrop image={`${A}cutscene-repair-v1.png`} position="center" shade="none" />
    <GameHeader chapter="수리" title="검증된 수리 적용" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <main className="repairStillLayout">
      <section className="repairResultCard">
        <small>ENGINEER MING · VERIFIED FIX</small>
        <h1>{ready ? "수리 완료!" : "검증 결과를 차량에 적용 중"}</h1>
        <p>{ready ? `${repairLabel}을 정상화했어. 같은 입력에서 기대 출력이 나오는 것도 확인했어.` : "실험에서 확인한 최초 불일치 경계만 수정하고 있어."}</p>
        <div className="repairSignalRail">
          <span className="done"><i />입력 정상</span><em />
          <span className="done"><i />ECU 로직</span><em />
          <span className={ready ? "done" : "active"}><i />출력 응답</span>
        </div>
        <dl><div><dt>복귀 지점</dt><dd>{Math.round(state.raceDistance)}m</dd></div><div><dt>추격 격차</dt><dd>{Math.round(state.policeGapMeters)}m</dd></div></dl>
        {ready && <div className="resumeCountdown"><b>{Math.max(0, countdown)}</b><span>초 후 달리던 지점으로 자동 복귀</span></div>}
      </section>
    </main>
  </div>;
}

const finaleFrames = [
  { image: `${A}cutscene-ship-jump-v1.png`, title: "오르막 램프를 타고 갑판으로 도약!", body: "경찰차는 부두 끝에 멈추고, 붉은 EV만 해적선으로 날아간다." },
  { image: `${A}cutscene-ship-land-v1.png`, title: "갑판 안착 · 탈출 성공", body: "차량과 두 고양이가 모두 해적선 갑판에 안전하게 착지했다." },
] as const;

export function ShipBoardingSequence({ send }: { send: Send }) {
  const requestedFrame = Number(new URLSearchParams(location.search).get("cut"));
  const [frame, setFrame] = useState(requestedFrame === 1 ? 1 : 0);
  useEffect(() => { finaleFrames.forEach(item => { const image = new Image(); image.src = item.image; }); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (frame === 0) setFrame(1);
      else send({ type: "COMPLETE_ENDING" });
    }, 4500);
    return () => clearTimeout(timer);
  }, [frame, send]);
  const current = finaleFrames[frame];
  return <div className={`staticCutscene finaleStillScene frame-${frame}`} onClick={() => frame === 0 ? setFrame(1) : send({ type: "COMPLETE_ENDING" })}>
    <SceneBackdrop image={current.image} position="center" shade="none" />
    <section className="finaleCaptionCard">
      <small>FINAL · PIRATE SHIP ESCAPE</small>
      <h1>{current.title}</h1>
      <p>{current.body}</p>
      <div className="stillFrameDots">{finaleFrames.map((_, index) => <i key={index} className={index <= frame ? "active" : ""} />)}</div>
      <em>클릭하면 다음 장면</em>
    </section>
  </div>;
}

