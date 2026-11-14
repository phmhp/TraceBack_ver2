import { useEffect, useRef, useSyncExternalStore } from "react";

/** Single source for STEP01~04 sub-step milestones shown in the common folder subtitle. */
export type RoadmapStepId = "garage" | "board" | "puzzle" | "bench";

export const STEP_ROADMAP: Record<RoadmapStepId, { no: string; alias: string; meaning: string; subs: string[] }> = {
  garage: { no: "STEP 01", alias: "정비소", meaning: "차량 동작 원리", subs: ["차량 전체", "기계 동작", "E/E 신호", "제어 SW"] },
  board: { no: "STEP 02", alias: "도미노 추적", meaning: "원인 역추적", subs: ["증상 확인", "출력 선택", "역방향 추적", "의심 구간", "가설 정리"] },
  puzzle: { no: "STEP 03", alias: "퍼즐", meaning: "정상 기준·시험 준비", subs: ["요구사항", "로직 조립", "연결 확인", "시험 조건", "기준 확정"] },
  bench: { no: "STEP 04", alias: "실험대", meaning: "가설 실험·수리", subs: ["가설 시험", "최종 원인", "A/B 비교", "수리", "재시험"] },
};

/** `max` = furthest sub-step the player has unlocked; `goTo` jumps to a reached sub-step (back is free, forward is locked). */
export type RoadmapNav = { max: number; goTo: (index: number) => void };
type Snapshot = { step: RoadmapStepId; index: number; nav?: RoadmapNav } | null;

let current: Snapshot = null;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const snapshot = () => current;

function publish(next: Snapshot) {
  if (current?.step === next?.step && current?.index === next?.index && current?.nav?.max === next?.nav?.max) {
    if (current && next) current.nav = next.nav; // keep the latest goTo without re-rendering subscribers
    return;
  }
  current = next;
  listeners.forEach(fn => fn());
}

/** A stage reports its current sub-step index (and optionally how to navigate); cleared when the stage unmounts. */
export function useReportSubStep(step: RoadmapStepId, index: number, nav?: RoadmapNav) {
  const navRef = useRef(nav);
  navRef.current = nav;
  const max = nav?.max;
  useEffect(() => {
    publish({ step, index, nav: max === undefined ? undefined : { max, goTo: i => navRef.current?.goTo(i) } });
  }, [step, index, max]);
  useEffect(() => () => publish(null), []);
}

export function useSubStep(step: RoadmapStepId): { index: number; nav?: RoadmapNav } {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  return value && value.step === step ? { index: value.index, nav: value.nav } : { index: 0 };
}
