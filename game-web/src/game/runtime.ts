export type CaseId = "propulsion" | "thermal" | "brake";

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
  return {
    ...base,
    ...saved,
    evidence: { ...base.evidence, ...(saved.evidence ?? {}) },
    hypothesis: { ...base.hypothesis, ...(saved.hypothesis ?? {}) },
    program: { ...base.program, ...(saved.program ?? {}) },
    gapJudgements: { ...(saved.gapJudgements ?? {}) },
    hintClaims: { ...(saved.hintClaims ?? {}) },
  };
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
  s.caseId === "propulsion" && !s.completedCases.includes("thermal") ? 12 : 0;
const clampGap = (s: Campaign, gap: number) =>
  Math.max(pursuitFloor(s), Math.min(220, gap));

export function dispatch(state: Campaign, event: GameEvent): Campaign {
  const s = structuredClone(state);
  switch (event.type) {
    case "NEW_GAME":
      return enter(initialCampaign(), "PROLOGUE");
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
      return enter(s, "BOARD");
    case "OPEN_BOARD":
      return enter(s, "BOARD");
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
      return s.evidence[s.caseId].length >= 2 && s.hypothesis[s.caseId]
        ? enter(s, "WIRING")
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
      return enter(s, "TWIN_BENCH");
    case "BENCH_RESULT": {
      s.benchRuns++;
      const correct = Boolean(event.causeCorrect);
      const previous = s.gapJudgements[s.caseId];
      const previousScore = previous === "correct" ? 20 : previous === "wrong" ? -20 : 0;
      const nextScore = correct ? 20 : -20;
      s.policeGapMeters = clampGap(s, s.policeGapMeters + nextScore - previousScore);
      s.gapJudgements[s.caseId] = correct ? "correct" : "wrong";
      if (s.policeGapMeters <= 0) return enter(s, "CAUGHT");
      return enter(s, event.pass ? "REPAIR" : "VERIFY_FAIL");
    }
    case "RETRY_WIRING":
      return enter(s, "WIRING");
    case "APPLY_REPAIR":
      s.completedCases = Array.from(new Set([...s.completedCases, s.caseId]));
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
        ? enter({ ...s, optionalBrake: "accepted", caseId: "brake" }, "BOARD")
        : enter({ ...s, optionalBrake: "skipped" }, "SHIP_ESCAPE");
    case "FINISH_ESCAPE":
      return s.raceDistance >= 1165 ? enter(s, "SHIP_BOARDING") : reject(s, "PIRATE_SHIP_NOT_REACHED");
    case "COMPLETE_ENDING":
      return s.scene === "SHIP_BOARDING" ? enter(s, "ENDING") : reject(s, "BOARDING_REQUIRED");
    case "CAUGHT":
      return enter(s, "CAUGHT");
    case "RETRY_CHECKPOINT":
      return enter(
        s,
        s.checkpoint === "propulsion_fault"
          ? "BOARD"
          : s.checkpoint === "thermal_fault"
            ? "BOARD"
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
      return enter(s, "REPAIR");
    }
    default:
      return reject(s, "UNKNOWN_EVENT");
  }
}
