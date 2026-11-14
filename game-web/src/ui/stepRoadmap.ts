import { useEffect, useSyncExternalStore } from "react";

/** Single source for STEP01~04 sub-step milestones shown in the common folder subtitle. */
export type RoadmapStepId = "garage" | "board" | "puzzle" | "bench";

export const STEP_ROADMAP: Record<RoadmapStepId, { no: string; alias: string; meaning: string; subs: string[] }> = {
  garage: { no: "STEP 01", alias: "정비소", meaning: "차량 동작 원리", subs: ["차량 전체", "기계 동작", "E/E 신호", "제어 SW"] },
  board: { no: "STEP 02", alias: "도미노 추적", meaning: "원인 역추적", subs: ["증상 확인", "출력 선택", "역방향 추적", "의심 구간", "가설 정리"] },
  puzzle: { no: "STEP 03", alias: "퍼즐", meaning: "정상 기준·시험 준비", subs: ["요구사항", "로직 조립", "연결 확인", "시험 조건", "기준 확정"] },
  bench: { no: "STEP 04", alias: "검증", meaning: "실험 검증·수리", subs: ["가설 시험", "최종 원인", "A/B 비교", "수리", "재시험"] },
};

let current: { step: RoadmapStepId; index: number } | null = null;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const snapshot = () => current;

function publish(next: { step: RoadmapStepId; index: number } | null) {
  if (current?.step === next?.step && current?.index === next?.index) return;
  current = next;
  listeners.forEach(fn => fn());
}

/** A stage reports its current sub-step index; cleared when the stage unmounts. */
export function useReportSubStep(step: RoadmapStepId, index: number) {
  useEffect(() => { publish({ step, index }); }, [step, index]);
  useEffect(() => () => publish(null), []);
}

export function useSubStep(step: RoadmapStepId): number {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  return value && value.step === step ? value.index : 0;
}
