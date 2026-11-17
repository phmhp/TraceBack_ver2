import test from "node:test";
import assert from "node:assert/strict";
import { endingMoods, MOOD_LABEL, EXPRESSION_DIR } from "../src/game/endingMoods.ts";

test("ending moods follow the stars earned and never depict injury", () => {
  const full = endingMoods({ completedCases: ["propulsion", "thermal"], levelStars: { propulsion: 3, thermal: 3 } }, true);
  assert.deepEqual([full.lou, full.ming, full.tier], ["joy", "joy", "high"]);
  const mid = endingMoods({ completedCases: ["propulsion", "thermal"], levelStars: { propulsion: 2, thermal: 2 } }, true);
  assert.equal(mid.tier, "mid");
  const low = endingMoods({ completedCases: ["propulsion", "thermal"], levelStars: { propulsion: 1, thermal: 1 } }, true);
  assert.equal(low.tier, "low");
  const caught = endingMoods({ completedCases: [], levelStars: {} }, false);
  assert.deepEqual([caught.lou, caught.ming], ["letdown", "shock"]);
  assert.match(caught.epilogue, /다친 곳은 없어요/);
  for (const m of [full, mid, low, caught]) { assert.ok(MOOD_LABEL[m.lou] && MOOD_LABEL[m.ming]); assert.ok(m.epilogue.length > 10); }
  assert.equal(EXPRESSION_DIR, "/assets/cat-expr/");
});
