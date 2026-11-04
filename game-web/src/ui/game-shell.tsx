import { type CSSProperties, type ReactNode } from "react";

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

export function GameHeader({
  chapter,
  title,
  distanceMeters,
  onPause,
  progressScene,
}: {
  chapter: string;
  title: string;
  distanceMeters?: number;
  onPause: () => void;
  progressScene?: string;
}) {
  return (
    <header className="gameHeader">
      <button className="brandLockup" aria-label="일시정지 메뉴 열기" onClick={onPause}>
        <img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" />
        <span>TraceBack</span>
      </button>
      <div className="chapterChip">
        <small>{chapter}</small>
        <b>{title}</b>
      </div>
      {progressScene && <JourneyProgress scene={progressScene} />}
      {distanceMeters !== undefined && (
        <div className="pressureMeter gapOnly" aria-label={`추격 차량과 거리 ${Math.round(distanceMeters)}미터`}>
          <span>추격차 격차</span>
          <b>{Math.round(distanceMeters)}m</b>
        </div>
      )}
    </header>
  );
}

const journeyStages = [
  { id: "garage", label: "차고지", detail: "차량 도메인 학습" },
  { id: "heist", label: "범행·도주", detail: "고양이 탑승과 출발" },
  { id: "race", label: "주행", detail: "코스 지점까지 도주" },
  { id: "board", label: "메모판", detail: "증거와 원인 연결" },
  { id: "wiring", label: "경로 복원", detail: "제어 신호 연결" },
  { id: "bench", label: "V-모델 검증", detail: "SW·ECU·시스템·차량" },
  { id: "repair", label: "수리", detail: "검증 설계 적용" },
  { id: "escape", label: "해적선", detail: "최종 승선" },
] as const;

const stageForScene = (scene: string) => {
  if (scene.startsWith("GARAGE")) return 0;
  if (scene === "DRIVE_BRIEFING") return 1;
  if (["CHASE_NORMAL", "CHASE_RESUME", "FAULT_CUE", "ASSIST_CHASE"].includes(scene)) return 2;
  if (scene === "BOARD" || scene === "OPTIONAL_FAULT") return 3;
  if (scene === "WIRING") return 4;
  if (["TWIN_BENCH", "VERIFY_FAIL"].includes(scene)) return 5;
  if (scene === "REPAIR") return 6;
  return 7;
};

export function JourneyProgress({ scene }: { scene: string }) {
  const active = stageForScene(scene);
  return <nav className="journeyProgress journeyRail" aria-label={`전체 진행 ${active + 1}/${journeyStages.length}`}>
    <div className="journeyRailTrack">{journeyStages.map((stage, index) => <article key={stage.id} className={index < active ? "done" : index === active ? "active" : "future"} title={`${stage.label} · ${stage.detail}`}><i>{index < active ? "✓" : index + 1}</i><span>{stage.label}</span>{index < journeyStages.length - 1 && <em />}</article>)}</div>
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
