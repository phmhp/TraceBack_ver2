// Ending cat moods (no React): which expression each cat shows and the epilogue line.
/** Expression of each cat at the ending. Image files go to public/assets/cat-expr/<lou|ming>-<mood>.png (square, one face per file);
 *  until a file exists the usual portrait crop is shown, so the ending works without the expression set. Cats are never hurt. */
export type CatMood = "joy" | "relief" | "calm" | "focus" | "shock" | "letdown";
export const MOOD_LABEL: Record<CatMood, string> = { joy: "기쁨", relief: "안도", calm: "평온", focus: "집중", shock: "놀람", letdown: "실망" };
export const EXPRESSION_DIR = "/assets/cat-expr/";

/** Mood and epilogue from the stars earned (levelStars: 1-3 per solved level) and whether the escape worked. */
export function endingMoods(state: { levelStars?: Partial<Record<string, number>>; completedCases: readonly string[] }, escaped: boolean): { lou: CatMood; ming: CatMood; epilogue: string; tier: "high" | "mid" | "low" | "caught" } {
  if (!escaped) return { lou: "letdown", ming: "shock", tier: "caught", epilogue: "둘 다 다친 곳은 없어요. 이번에는 잡혔지만 원인을 좁히는 감각은 남았어요." };
  const solved = state.completedCases.length || 1;
  const stars = Object.values(state.levelStars ?? {}).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const ratio = Math.min(1, stars / (3 * solved));
  if (ratio >= .8) return { lou: "joy", ming: "joy", tier: "high", epilogue: "원인을 빠르고 정확하게 짚은 덕분에 추격차를 지켜 낸 완벽한 탈출이었어요." };
  if (ratio >= .5) return { lou: "relief", ming: "focus", tier: "mid", epilogue: "몇 번 돌아갔지만 원인을 끝까지 밝혀 무사히 탈출했어요." };
  return { lou: "calm", ming: "relief", tier: "low", epilogue: "아슬아슬했지만 해냈어요. 증거를 더 빨리 좁히면 다음에는 여유가 생겨요." };
}

