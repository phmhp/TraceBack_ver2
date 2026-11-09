export type CaseId = "propulsion" | "thermal" | "brake";

export type InvestigationStep = "locked" | "board" | "wiring" | "bench" | "repair" | "done";
export type JourneyStageId = "garage" | "heist" | "race" | "board" | "wiring" | "bench" | "repair" | "escape";

export type Scene =
  | "TITLE"
  | "PROLOGUE"
  | "GARAGE_L1"
  | "GARAGE_L2"
  | "GARAGE_L3"
  | "GARAGE_L4"
  | "DRIVE_BRIEFING"
  | "CHASE_NORMAL"
  | "FAULT_CUE"
  | "ASSIST_CHASE"
  | "BOARD"
  | "WIRING"
  | "TWIN_BENCH"
  | "VERIFY_FAIL"
  | "REPAIR"
  | "CHASE_RESUME"
  | "OPTIONAL_FAULT"
  | "SHIP_ESCAPE"
  | "SHIP_BOARDING"
  | "CAUGHT"
  | "ENDING"
  | "PAUSE";

export type Campaign = {
  scene: Scene;
  previousScene?: Scene;
  forwardScene?: Scene;
  caseId: CaseId;
  completedCases: CaseId[];
  investigationProgress: Record<CaseId, InvestigationStep>;
  optionalBrake: "undecided" | "accepted" | "skipped";
  evidence: Record<CaseId, string[]>;
  hypothesis: Record<CaseId, string>;
  program: Record<CaseId, string>;
  checkpoint: string;
  collisions: number;
  hints: number;
  benchRuns: number;
  raceDistance: number;
  raceElapsedSeconds: number;
  lastRepairElapsedSeconds: number;
  lastRepairDistance: number;
  policeGapMeters: number;
  gapJudgements: Partial<Record<CaseId, "correct" | "wrong">>;
  hintClaims: Record<string, boolean>;
  lastError?: string;
};

export type GameEvent = { type: string; [key: string]: unknown };

export const initialCampaign = (): Campaign => ({
  scene: "TITLE",
  caseId: "propulsion",
  completedCases: [],
  investigationProgress: { propulsion: "locked", thermal: "locked", brake: "locked" },
  optionalBrake: "undecided",
  checkpoint: "start",
  evidence: { propulsion: [], thermal: [], brake: [] },
  hypothesis: { propulsion: "", thermal: "", brake: "" },
  program: {
    propulsion: "underreport_45pct",
    thermal: "open_loop_fan",
    brake: "friction_only",
  },
  collisions: 0,
  hints: 0,
  benchRuns: 0,
  raceDistance: 0,
  raceElapsedSeconds: 0,
  lastRepairElapsedSeconds: 0,
  lastRepairDistance: 0,
  policeGapMeters: 185,
  gapJudgements: {},
  hintClaims: {},
});

export function hydrateCampaign(saved: Partial<Campaign>): Campaign {
  const base = initialCampaign();
  const hydrated: Campaign = {
    ...base,
    ...saved,
    evidence: { ...base.evidence, ...(saved.evidence ?? {}) },
    hypothesis: { ...base.hypothesis, ...(saved.hypothesis ?? {}) },
    program: { ...base.program, ...(saved.program ?? {}) },
    investigationProgress: { ...base.investigationProgress, ...(saved.investigationProgress ?? {}) },
    gapJudgements: { ...(saved.gapJudgements ?? {}) },
    hintClaims: { ...(saved.hintClaims ?? {}) },
  };
  hydrated.completedCases.forEach(caseId => { hydrated.investigationProgress[caseId] = "done"; });
  const inferred = investigationStepForScene(hydrated.scene);
  if (stepRank(inferred) > stepRank(hydrated.investigationProgress[hydrated.caseId])) {
    hydrated.investigationProgress[hydrated.caseId] = inferred;
  }
  return hydrated;
}

const investigationSteps: InvestigationStep[] = ["locked", "board", "wiring", "bench", "repair", "done"];
const stepRank = (step: InvestigationStep) => investigationSteps.indexOf(step);
const investigationStepForScene = (scene: Scene): InvestigationStep => {
  if (scene === "BOARD" || scene === "OPTIONAL_FAULT") return "board";
  if (scene === "WIRING") return "wiring";
  if (scene === "TWIN_BENCH" || scene === "VERIFY_FAIL") return "bench";
  if (scene === "REPAIR") return "repair";
  return "locked";
};
const unlockInvestigation = (s: Campaign, step: InvestigationStep) => {
  s.investigationProgress ??= { propulsion: "locked", thermal: "locked", brake: "locked" };
  if (stepRank(step) > stepRank(s.investigationProgress[s.caseId])) {
    s.investigationProgress[s.caseId] = step;
  }
  return s;
};

const journeyStageForScene = (scene: Scene): JourneyStageId => {
  if (scene.startsWith("GARAGE")) return "garage";
  if (scene === "DRIVE_BRIEFING") return "heist";
  if (["CHASE_NORMAL", "CHASE_RESUME", "FAULT_CUE", "ASSIST_CHASE"].includes(scene)) return "race";
  if (scene === "BOARD" || scene === "OPTIONAL_FAULT") return "board";
  if (scene === "WIRING") return "wiring";
  if (scene === "TWIN_BENCH" || scene === "VERIFY_FAIL") return "bench";
  if (scene === "REPAIR") return "repair";
  return "escape";
};

export type JourneyStageAccess = {
  status: "active" | "done" | "available" | "locked";
  reason?: string;
  target?: Scene;
};

export function journeyStageAccess(state: Campaign, stage: JourneyStageId): JourneyStageAccess {
  const current = journeyStageForScene(state.scene);
  if (stage === current) return { status: "active", target: state.scene };

  const progress = state.investigationProgress?.[state.caseId] ?? investigationStepForScene(state.scene);
  const deductionStarted = stepRank(progress) >= stepRank("board");
  if (stage === "garage") {
    return deductionStarted
      ? { status: "locked", reason: "추리 진입 이후에는 차량 도메인 학습으로 돌아갈 수 없습니다." }
      : { status: "available", target: "GARAGE_L1" };
  }
  if (stage === "heist" || stage === "race") {
    return { status: "locked", reason: "이 구간은 주행 서사에 따라 자동으로 진행됩니다." };
  }

  const requirements: Partial<Record<JourneyStageId, InvestigationStep>> = {
    board: "board",
    wiring: "wiring",
    bench: "bench",
    repair: "repair",
  };
  const targets: Partial<Record<JourneyStageId, Scene>> = {
    board: "BOARD",
    wiring: "WIRING",
    bench: "TWIN_BENCH",
    repair: "REPAIR",
  };
  const required = requirements[stage];
  if (required) {
    if (stepRank(progress) < stepRank(required)) {
      const reasons: Record<InvestigationStep, string> = {
        locked: "주행 이상을 관찰하고 도미노 추리를 시작해야 열립니다.",
        board: "도미노에서 근거와 우선 가설을 확정해야 열립니다.",
        wiring: "가설을 검증할 로직 퍼즐을 구성해야 열립니다.",
        bench: "시뮬레이션 결과로 가설을 검증해야 열립니다.",
        repair: "검증된 수리 적용을 완료해야 열립니다.",
        done: "",
      };
      return { status: "locked", reason: reasons[progress] };
    }
    return {
      status: stepRank(progress) > stepRank(required) ? "done" : "available",
      target: targets[stage],
    };
  }

  const escapeUnlocked = ["propulsion", "thermal"].every(caseId => state.completedCases.includes(caseId as CaseId)) || state.scene.startsWith("SHIP") || state.scene === "ENDING";
  return escapeUnlocked
    ? { status: "available", target: "SHIP_ESCAPE" }
    : { status: "locked", reason: "필수 추리와 수리를 마친 뒤 최종 탈출이 열립니다." };
}

const enter = (s: Campaign, scene: Scene): Campaign => ({
  ...s,
  scene,
  forwardScene: undefined,
  lastError: undefined,
});
const reject = (s: Campaign, msg: string): Campaign => ({ ...s, lastError: msg });
// The first two faults are the learning spine of the chapter.  Keep a small
// dramatic buffer until the second incident has started, then 0 m is a real
// capture everywhere (race, board, wiring and lab).
const pursuitFloor = (s: Campaign) =>
  s.completedCases.length < 2 ? 10 : 0;
const clampGap = (s: Campaign, gap: number) =>
  Math.max(pursuitFloor(s), Math.min(220, gap));

export function dispatch(state: Campaign, event: GameEvent): Campaign {
  const s = structuredClone(state);
  switch (event.type) {
    case "NEW_GAME":
      return enter(initialCampaign(), "PROLOGUE");
    case "LOAD_SAVE":
      return hydrateCampaign(event.save as Partial<Campaign>);
    case "CONTINUE_PROLOGUE":
      return s.scene === "PROLOGUE"
        ? enter(s, "GARAGE_L1")
        : reject(s, "PROLOGUE_REQUIRED");
    case "GARAGE_GOTO": {
      const level = Math.max(1, Math.min(4, Number(event.level) || 1));
      return enter(s, `GARAGE_L${level}` as Scene);
    }
    case "GARAGE_ADVANCE": {
      const queue: Scene[] = ["GARAGE_L1", "GARAGE_L2", "GARAGE_L3"];
      const index = queue.indexOf(s.scene);
      return index < 0
        ? reject(s, "GARAGE_REQUIRED")
        : enter(s, queue[Math.min(2, index + 1)]);
    }
    case "START_RACE":
      return s.scene.startsWith("GARAGE")
        ? enter({ ...s, checkpoint: "city_start", raceDistance: 0, raceElapsedSeconds: 0, lastRepairElapsedSeconds: 0, lastRepairDistance: 0, policeGapMeters: 185 }, "DRIVE_BRIEFING")
        : reject(s, "GARAGE_TUTORIAL_REQUIRED");
    case "BEGIN_RACE":
      return s.scene === "DRIVE_BRIEFING"
        ? enter(s, "CHASE_NORMAL")
        : reject(s, "DRIVE_BRIEFING_REQUIRED");
    case "SYNC_RACE":
      s.raceDistance = Math.max(s.raceDistance, Number(event.distance) || 0);
      s.raceElapsedSeconds = Math.max(s.raceElapsedSeconds, Number(event.elapsed) || 0);
      s.policeGapMeters = clampGap(s, Number(event.gap));
      return s;
    case "TICK_PURSUIT":
      // During investigation the damaged car keeps coasting under limp-home
      // control.  Both vehicles move; the police only closes the gap slowly.
      // Investigation keeps both cars moving, but a narrative route gate keeps
      // background simulation from crossing the next fault or pirate-ship
      // finish while the player is solving a learning task.
      const routeGate = s.caseId === "propulsion" ? 540 : s.caseId === "thermal" ? 1020 : 1160;
      s.raceDistance = Math.min(routeGate, s.raceDistance + Math.max(0, Number(event.travel) || 0));
      s.raceElapsedSeconds += Math.max(0, Number(event.seconds) || 0);
      s.policeGapMeters = clampGap(
        s,
        s.policeGapMeters - Math.max(0, Number(event.meters) || 0),
      );
      return s.policeGapMeters <= 0 ? enter(s, "CAUGHT") : s;
    case "FAULT_CUE":
      s.raceDistance = Math.max(s.raceDistance, Number(event.distance) || s.raceDistance);
      s.raceElapsedSeconds = Math.max(s.raceElapsedSeconds, Number(event.elapsed) || s.raceElapsedSeconds);
      s.policeGapMeters = clampGap(s, Number.isFinite(Number(event.gap)) ? Number(event.gap) : s.policeGapMeters);
      return enter(
        {
          ...s,
          caseId: event.caseId as CaseId,
          checkpoint: `${event.caseId}_fault`,
        },
        "FAULT_CUE",
      );
    case "CONTINUE_FAULT":
      // flow (docs/VERIFICATION_FLOW_STANDARD.md): fault → root-cause trace narrows to a suspect section (board)
      // → requirement-based normal behaviour of that section (puzzle) → simulation verification (bench)
      return enter(unlockInvestigation(s, "board"), "BOARD");
    case "OPEN_BOARD":
      return enter(unlockInvestigation(s, "board"), "BOARD");
    case "RECORD_EVIDENCE": {
      const id = String(event.id);
      s.evidence[s.caseId] = s.evidence[s.caseId].includes(id)
        ? s.evidence[s.caseId].filter((value) => value !== id)
        : [...s.evidence[s.caseId], id];
      return s;
    }
    case "SELECT_HYPOTHESIS": {
      const id = String(event.id);
      s.hypothesis[s.caseId] = s.hypothesis[s.caseId] === id ? "" : id;
      return s;
    }
    case "OPEN_WIRING":
      return s.hypothesis[s.caseId] && (s.scene === "BOARD" || s.evidence[s.caseId].length >= 2)
        ? enter(unlockInvestigation(s, "wiring"), "WIRING")
        : reject(s, "증거 2개와 가설을 먼저 선택하세요.");
    case "SOLVE_BOARD": {
      const answers: Record<CaseId, { evidence: string[]; root: string }> = {
        propulsion: { evidence: ["pedal_raw", "pedal_processed", "torque_cmd"], root: "gateway" },
        thermal: { evidence: ["motor_temp", "fan_command", "fan_actual"], root: "fan_actuator" },
        brake: { evidence: ["brake_request", "regen_request", "brake_actual"], root: "brake_actuator" },
      };
      s.evidence[s.caseId] = answers[s.caseId].evidence;
      s.hypothesis[s.caseId] = answers[s.caseId].root;
      return s;
    }
    case "DEV_SOLVE": {
      const roots: Record<CaseId, string> = { propulsion: "gateway", thermal: "fan_actuator", brake: "brake_actuator" };
      const programs: Record<CaseId, string> = { propulsion: "nominal", thermal: "thermal_closed_loop", brake: "blended_brake" };
      s.hypothesis[s.caseId] = roots[s.caseId];
      s.program[s.caseId] = programs[s.caseId];
      return s;
    }
    case "COMPILE":
      s.program[s.caseId] = String(event.program);
      return s;
    case "OPEN_BENCH":
      return enter(unlockInvestigation(s, "bench"), "TWIN_BENCH");
    case "BENCH_RESULT": {
      s.benchRuns++;
      const correct = Boolean(event.causeCorrect);
      const previous = s.gapJudgements[s.caseId];
      const previousScore = previous === "correct" ? 20 : previous === "wrong" ? -20 : 0;
      const nextScore = correct ? 20 : -20;
      s.policeGapMeters = clampGap(s, s.policeGapMeters + nextScore - previousScore);
      s.gapJudgements[s.caseId] = correct ? "correct" : "wrong";
      if (s.policeGapMeters <= 0) return enter(s, "CAUGHT");
      return enter(event.pass ? unlockInvestigation(s, "repair") : s, event.pass ? "REPAIR" : "VERIFY_FAIL");
    }
    case "RETRY_WIRING":
      return enter(s, "WIRING");
    case "APPLY_REPAIR":
      s.completedCases = Array.from(new Set([...s.completedCases, s.caseId]));
      unlockInvestigation(s, "done");
      s.lastRepairElapsedSeconds = s.raceElapsedSeconds;
      s.lastRepairDistance = s.raceDistance;
      if (s.caseId === "propulsion") {
        s.policeGapMeters = Math.max(105, s.policeGapMeters);
        return enter({ ...s, checkpoint: "harbor_entry" }, "CHASE_RESUME");
      }
      if (s.caseId === "thermal") {
        s.policeGapMeters = Math.max(115, s.policeGapMeters);
        return enter({ ...s, checkpoint: "dock_approach" }, "CHASE_RESUME");
      }
      s.policeGapMeters = Math.max(65, s.policeGapMeters);
      return enter(s, "SHIP_ESCAPE");
    case "OPTIONAL_PROMPT":
      return enter({ ...s, optionalBrake: "skipped" }, "SHIP_ESCAPE");
    case "START_FINAL_ESCAPE":
      return enter({ ...s, optionalBrake: "skipped" }, "SHIP_ESCAPE");
    case "OPTIONAL_BRAKE":
      return event.accept
        ? enter(unlockInvestigation({ ...s, optionalBrake: "accepted", caseId: "brake" }, "wiring"), "WIRING")
        : enter({ ...s, optionalBrake: "skipped" }, "SHIP_ESCAPE");
    case "FINISH_ESCAPE": {
      // Make the hand-off atomic.  The old implementation dispatched SYNC_RACE
      // and FINISH_ESCAPE separately, so the finish check could observe the
      // previous render's distance and reject a car already on the dock.
      const finishDistance = Math.max(s.raceDistance, Number(event.distance) || 0);
      const finishGap = Math.max(10, Number.isFinite(Number(event.gap)) ? Number(event.gap) : s.policeGapMeters);
      return s.scene === "SHIP_ESCAPE" && finishDistance >= 1080
        ? enter({ ...s, raceDistance: finishDistance, policeGapMeters: finishGap, checkpoint: "pirate_ramp" }, "ENDING")
        : reject(s, "PIRATE_SHIP_NOT_REACHED");
    }
    case "COMPLETE_ENDING":
      return s.scene === "SHIP_BOARDING" ? enter(s, "ENDING") : reject(s, "BOARDING_REQUIRED");
    case "CAUGHT":
      return enter(s, "CAUGHT");
    case "RETRY_CHECKPOINT":
      return enter(
        {
          ...s,
          // Continuing at 0 m used to re-enter CAUGHT on the very next tick.
          // Preserve tension while always granting a playable recovery window.
          policeGapMeters: Math.max(s.completedCases.length < 2 ? 35 : 18, s.policeGapMeters),
        },
        s.checkpoint === "propulsion_fault"
          ? "WIRING"
          : s.checkpoint === "thermal_fault"
            ? "WIRING"
            : s.checkpoint === "dock_approach"
              ? "CHASE_RESUME"
              : "CHASE_NORMAL",
      );
    case "PAUSE":
      return enter({ ...s, previousScene: s.scene }, "PAUSE");
    case "RESUME":
      return enter(s, s.previousScene ?? "CHASE_NORMAL");
    case "NAV_BACK": {
      const previous: Partial<Record<Scene, Scene>> = {
        GARAGE_L1: "PROLOGUE",
        GARAGE_L2: "PROLOGUE",
        GARAGE_L3: "PROLOGUE",
        GARAGE_L4: "PROLOGUE",
        DRIVE_BRIEFING: "GARAGE_L1",
        CHASE_NORMAL: "DRIVE_BRIEFING",
        WIRING: "BOARD",
        TWIN_BENCH: "WIRING",
        VERIFY_FAIL: "TWIN_BENCH",
        REPAIR: "TWIN_BENCH",
      };
      return previous[s.scene]
        ? { ...enter(s, previous[s.scene]!), forwardScene: s.scene }
        : reject(s, "이 단계에서는 이전 서사나 미래 단계 이동이 잠겨 있습니다.");
    }
    case "NAV_FORWARD":
      return s.forwardScene
        ? enter(s, s.forwardScene)
        : reject(s, "되돌아온 단계가 있을 때만 다음 단계 이동을 사용할 수 있습니다.");
    case "NAV_STAGE": {
      const access = journeyStageAccess(s, String(event.stage) as JourneyStageId);
      if (!access.target || access.status === "locked") {
        return reject(s, access.reason ?? "아직 이동할 수 없는 단계입니다.");
      }
      if (access.target === s.scene) return s;
      const returnScene = s.forwardScene ?? s.scene;
      return { ...enter(s, access.target), forwardScene: returnScene };
    }
    case "TITLE":
      return enter(s, "TITLE");
    case "COLLISION":
      s.collisions++;
      return s;
    case "HINT":
      if (!s.hintClaims[String(event.key)]) {
        s.hints++;
        s.hintClaims[String(event.key)] = true;
        s.policeGapMeters = clampGap(s, s.policeGapMeters - 5);
      }
      return s.policeGapMeters <= 0 ? enter(s, "CAUGHT") : s;
    case "GUIDED_REPAIR": {
      const roots: Record<CaseId, string> = { propulsion: "gateway", thermal: "fan_actuator", brake: "brake_actuator" };
      const programs: Record<CaseId, string> = { propulsion: "nominal", thermal: "thermal_closed_loop", brake: "blended_brake" };
      s.hypothesis[s.caseId] = roots[s.caseId];
      s.program[s.caseId] = programs[s.caseId];
      return enter(unlockInvestigation(s, "repair"), "REPAIR");
    }
    default:
      return reject(s, "UNKNOWN_EVENT");
  }
}
