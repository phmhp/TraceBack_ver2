// STEP01 progress that is saved with the campaign (Campaign.garage). Pure functions: no React, no models.
import { coreMissions, questionIds } from "./missions.ts";

export type GarageProgress = {
  solved: string[]; // question ids, e.g. "drive:0:bus"
  wrong: Record<string, number>; // wrong answers per question (drives the auto-explanation after 2)
  cleared: boolean; // the required (core) missions were completed at least once; stays true on replays
};

export const EXPLAIN_AFTER_WRONG = 2;

export const initialGarageProgress = (): GarageProgress => ({ solved: [], wrong: {}, cleared: false });

export const coreQuestionIds = () => coreMissions().flatMap(questionIds);
export const isCoreComplete = (progress: GarageProgress) => coreQuestionIds().every(id => progress.solved.includes(id));

export function solveQuestion(progress: GarageProgress, id: string): GarageProgress {
  if (progress.solved.includes(id)) return progress;
  const next = { ...progress, solved: [...progress.solved, id] };
  return { ...next, cleared: next.cleared || isCoreComplete(next) };
}

export function wrongAnswer(progress: GarageProgress, id: string): GarageProgress {
  return { ...progress, wrong: { ...progress.wrong, [id]: (progress.wrong[id] ?? 0) + 1 } };
}

export const wrongCount = (progress: GarageProgress, id: string) => progress.wrong[id] ?? 0;
export const canExplain = (progress: GarageProgress, id: string) => wrongCount(progress, id) >= EXPLAIN_AFTER_WRONG;

/** Re-reads a saved value defensively: older or hand-edited saves must never crash the garage. */
export function hydrateGarageProgress(saved: Partial<GarageProgress> | undefined): GarageProgress {
  const base = initialGarageProgress();
  if (!saved || typeof saved !== "object") return base;
  const known = new Set(coreQuestionIds());
  return {
    solved: Array.isArray(saved.solved) ? saved.solved.filter((id): id is string => typeof id === "string") : base.solved,
    wrong: saved.wrong && typeof saved.wrong === "object" ? Object.fromEntries(Object.entries(saved.wrong).filter(([, value]) => Number.isFinite(value))) as Record<string, number> : base.wrong,
    cleared: Boolean(saved.cleared) || (Array.isArray(saved.solved) && [...known].every(id => saved.solved!.includes(id))),
  };
}
