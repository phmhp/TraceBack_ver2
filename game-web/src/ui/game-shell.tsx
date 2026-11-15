import "./pursuit-hud.css";
import "./buttons-unified.css";
import "./race-impact.css";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { Icon } from "./Icon";
import { TRACK_LENGTH } from "../game/traffic";
import { STEP_ROADMAP, useSubStep, type RoadmapStepId } from "./stepRoadmap";
import { journeyStageAccess, type Campaign, type JourneyStageId } from "../game/runtime";

const JourneyNavigationContext = createContext<{
  campaign: Campaign;
  navigate: (stage: JourneyStageId) => void;
} | null>(null);

export function JourneyNavigationProvider({
  campaign,
  navigate,
  children,
}: {
  campaign: Campaign;
  navigate: (stage: JourneyStageId) => void;
  children: ReactNode;
}) {
  return <JourneyNavigationContext.Provider value={{ campaign, navigate }}>{children}</JourneyNavigationContext.Provider>;
}

type ActionTone = "primary" | "neutral" | "danger" | "honey";

export function GameStage({ children }: { children: ReactNode }) {
  return (
    <div className="gameViewport">
      <div className="gameStage">{children}</div>
    </div>
  );
}

export function SceneBackdrop({
  image,
  position = "center",
  fit = "cover",
  shade = "soft",
}: {
  image: string;
  position?: string;
  fit?: "cover" | "contain";
  shade?: "none" | "soft" | "deep";
}) {
  const style = {
    "--scene-image": `url("${image}")`,
    "--scene-position": position,
    "--scene-fit": fit,
  } as CSSProperties;
  return <div className={`sceneBackdrop shade-${shade}`} style={style} aria-hidden="true" />;
}

/** Scenes where the chase clock runs at 1/30 speed (TICK_PURSUIT meters .2 per second) while the player investigates. */
const SLOW_TIME_SCENES = ["BOARD", "WIRING", "TWIN_BENCH", "VERIFY_FAIL", "REPAIR"];

export function GameHeader({
  chapter,
  title,
  distanceMeters,
  raceDistanceMeters,
  onPause,
  progressScene,
}: {
  chapter: string;
  title: string;
  distanceMeters?: number;
  raceDistanceMeters?: number;
  onPause: () => void;
  progressScene?: string;
}) {
  return (
    <>
    <header className="gameHeader">
      <button className="brandLockup" aria-label="일시정지 메뉴 열기" onClick={onPause}>
        <img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" />
        <span>TraceBack</span>
      </button>
      <div className="stageHeaderInfo">
        {progressScene && <JourneyProgress scene={progressScene} />}
      </div>
      <span className="gameHeaderSpacer" aria-hidden="true" />
    </header>
    {distanceMeters !== undefined && <PursuitHud gap={distanceMeters} distance={raceDistanceMeters ?? 0} />}
    {progressScene && SLOW_TIME_SCENES.includes(progressScene) && <span className="timeDilation" role="status" title="추리하는 동안 추격 시간은 천천히 흐릅니다"><i aria-hidden="true" />추리 중 · 시간 1/30</span>}
    </>
  );
}

/** One pursuit gap display for every scene (steps, levels, repair and the race): same component, same slot in the top bar. */
export function PursuitHud({ gap, distance }: { gap: number; distance: number }) {
  const pct = (TRACK_LENGTH - 170) / 100; // 100 % = the boarding ramp
  const routeProgress = Math.min(100, distance / pct);
  const playerMarker = Math.max(5, routeProgress);
  const policeMarker = Math.max(1, Math.min(96, playerMarker - Math.max(4, gap / pct)));
  return <div className="pursuitHud" role="img" aria-label={`출발에서 도착까지 진행 ${Math.round(playerMarker)}%, 경찰차와 자차의 추격차 ${Math.round(gap)}미터`}>
    <span className="hudFlag"><img src="/assets/ui/icons/flag.svg" alt="" /><small>START</small></span>
    <div className="hudTrack" aria-hidden="true"><i className="hudCar hudPolice" style={{ left: `${Math.min(92, policeMarker)}%` }}><img src="/assets/ui/icons/police-car.svg" alt="" /></i><i className="hudCar hudPlayer" style={{ left: `${Math.min(96, playerMarker)}%` }}><img src="/assets/ui/icons/getaway-car.svg" alt="" /></i></div>
    <span className="hudFlag"><img src="/assets/ui/icons/flag.svg" alt="" /><small>FINISH</small></span>
    <b className="hudGap"><small>추격차</small><code>{Math.round(gap)}m</code></b>
  </div>;
}

/** Shared two-line stage context.  Callers supply only live campaign/scenario data. */
export function StageFolderSubtitle({ action, detail, className = "", step }: { action: string; detail: ReactNode; className?: string; step?: RoadmapStepId }) {
  const { index: sub, nav } = useSubStep(step ?? "garage");
  const roadmap = step ? STEP_ROADMAP[step] : null;
  return <section className={`stageFolderSubtitle ${className}`.trim()} aria-label="현재 단계 안내">
    <p>{action}</p>
    {roadmap
      ? <small className="stepRoadmap" aria-label={`${roadmap.no} ${roadmap.alias}, 세부 단계 ${sub + 1}/${roadmap.subs.length}`}>
        <b>{roadmap.no} · {roadmap.alias}</b>
        <ol>{roadmap.subs.map((label, index) => {
          const locked = !nav || index > nav.max;
          const state = index < sub ? "done" : index === sub ? "now" : "";
          return <li key={label} className={`${state} ${locked ? "locked" : ""}`.trim()}>
            <button type="button" disabled={locked || index === sub} aria-current={index === sub ? "step" : undefined}
              title={locked ? "앞 단계를 먼저 끝내세요" : index === sub ? "현재 단계" : `${label}(으)로 이동`}
              onClick={() => nav?.goTo(index)}><i>{index < sub ? "✓" : locked && index > sub ? "•" : index + 1}</i>{label}</button>
          </li>;
        })}</ol>
      </small>
      : <small>{detail}</small>}
  </section>;
}

const journeyStages = [
  { id: "garage", label: "정비소", detail: "차량 도메인 학습" },
  { id: "heist", label: "범행·도주", detail: "고양이 탑승과 출발" },
  { id: "race", label: "주행", detail: "코스 지점까지 도주" },
  { id: "board", label: "도미노 추적", detail: "의심 구간 좁히기·영향도 분석" },
  { id: "wiring", label: "퍼즐", detail: "요구사항 기반 퍼즐" },
  { id: "bench", label: "실험대", detail: "가설 시험·결과 비교" },
  { id: "repair", label: "수리", detail: "검증 설계 적용" },
  { id: "escape", label: "해적선", detail: "최종 승선" },
] as const;

const stageForScene = (scene: string) => {
  if (scene.startsWith("GARAGE")) return 0;
  if (scene === "DRIVE_BRIEFING" || scene === "LEVEL_SELECT") return 1;
  if (["CHASE_NORMAL", "CHASE_RESUME", "FAULT_CUE", "ASSIST_CHASE"].includes(scene)) return 2;
  if (scene === "BOARD" || scene === "OPTIONAL_FAULT") return 3;
  if (scene === "WIRING") return 4;
  if (["TWIN_BENCH", "VERIFY_FAIL"].includes(scene)) return 5;
  if (scene === "REPAIR") return 6;
  return 7;
};

export function JourneyProgress({ scene }: { scene: string }) {
  const navigation = useContext(JourneyNavigationContext);
  const active = stageForScene(scene);
  return <nav className="journeyProgress journeyRail" aria-label={`전체 진행 ${active + 1}/${journeyStages.length}`}>
    <div className="journeyRailTrack">{journeyStages.map((stage, index) => {
      const access = navigation
        ? journeyStageAccess(navigation.campaign, stage.id)
        : { status: index < active ? "done" : index === active ? "active" : "locked" } as const;
      const locked = access.status === "locked";
      const activeStage = access.status === "active";
      const title = locked && "reason" in access && access.reason
        ? `${stage.label} 잠김 · ${access.reason}`
        : `${stage.label} · ${stage.detail}${activeStage ? " · 현재 단계" : " · 클릭하여 이동"}`;
      return <article key={stage.id} className={`${access.status} ${locked ? "isLocked" : "isNavigable"}`} title={title}>
        <button
          type="button"
          className="journeyStageHit"
          aria-label={title}
          aria-disabled={locked || activeStage}
          onClick={() => !locked && !activeStage && navigation?.navigate(stage.id)}
        />
        <i>{locked ? <Icon name="lock" /> : access.status === "done" ? "✓" : index + 1}</i>
        <span>{stage.label}</span>
        {index < journeyStages.length - 1 && <em />}
      </article>;
    })}</div>
    <strong><small>NOW · {active + 1}/{journeyStages.length}</small>{journeyStages[active].label}</strong>
  </nav>;
}

export function Keycap({ children }: { children: ReactNode }) {
  return <kbd className="keycap">{children}</kbd>;
}

export function ActionButton({
  children,
  tone = "neutral",
  keyHint,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ActionTone;
  keyHint?: string;
}) {
  return (
    <button className={`clayAction tone-${tone} ${className}`} {...props}>
      <span>{children}</span>
      {keyHint && <Keycap>{keyHint}</Keycap>}
    </button>
  );
}

export function CommandBar({
  label,
  children,
}: {
  label?: ReactNode;
  children: ReactNode;
}) {
  return (
    <footer className="commandBar">
      <div className="commandHint">{label}</div>
      <div className="commandActions">{children}</div>
    </footer>
  );
}

export function DialoguePanel({
  portrait,
  speaker,
  children,
  action,
}: {
  portrait: string;
  speaker: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="sharedDialogue">
      <div className="portraitRing"><img src={portrait} alt="" /></div>
      <div className="dialogueCopy">
        <b>{speaker}</b>
        <p>{children}</p>
      </div>
      {action && <div className="dialogueAction">{action}</div>}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "mint",
}: {
  children: ReactNode;
  tone?: "mint" | "coral" | "honey" | "lavender";
}) {
  return <span className={`statusPill pill-${tone}`}>{children}</span>;
}
