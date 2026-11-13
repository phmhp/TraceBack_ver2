import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const trace = read("../src/features/board/EeTrace.tsx");
const live = trace.slice(trace.indexOf("export function EeTraceV2"), trace.indexOf("// ===== v3"));

test("STEP02 uses the common question bar, cat bubble and per-question wrong counts (saved with the stage progress)", () => {
  assert.match(live, /<QuestionCard variant="bar"/);
  assert.match(live, /<CatSay lines=\{\[bubble\]\}/);
  assert.match(live, /const \[wrongBy, setWrongBy\] = useState<Record<string, number>>\(saved\.wrongBy \?\? \{\}\)/);
  assert.match(live, /carry, wrongBy \}\)\)/, "wrongBy is written to sessionStorage with the other STEP02 progress");
  assert.match(live, /trace:\$\{focus\}/, "wrong answers are counted per question, not per stage");
  assert.match(live, /canExplain\(\{ solved: \[\], wrong: \{ \[qKey\]: qWrong \}/);
});

test("STEP02 keeps the answer hidden: first-deviation badge appears only at the section question, explanation only after 2 wrong", () => {
  assert.match(live, /phase === "section" \|\| phase === "done"\) && <em className="first">/);
  assert.match(live, /EXPLAIN_AFTER_WRONG|canExplain/);
});

test("the developer-only answer button is not shipped in production builds", () => {
  assert.match(live, /import\.meta\.env\.DEV && <button className="secretSolve"/);
});

test("the explanation demo is an overlay that never changes play state", () => {
  const coach = read("../src/ui/CoachCursor.tsx");
  assert.match(coach, /pointerEvents|pointer-events/.test(coach) ? /./ : /tbCoach/);
  assert.doesNotMatch(coach, /\.click\(|dispatchEvent|setState/);
  assert.match(read("../src/ui/common-v3.css"), /\.tbCoach \{ position: fixed; z-index: 400; pointer-events: none; \}/);
});

test("STEP03 and STEP04 reuse the common question card, cat bubble and per-question wrong counts", () => {
  const puzzle = read("../src/features/wiring/RefPuzzle.tsx");
  const live3 = puzzle.slice(puzzle.indexOf("export function RefPuzzle({ state, send }"), puzzle.indexOf("export function RefPuzzleTrack"));
  assert.match(live3, /<QuestionCard variant="bar" flipKey=\{`\$\{caseId\}:\$\{qKey\}`\} mission="MISSION 03"/);
  assert.match(live3, /bump\("assemble"\)/);
  assert.match(live3, /bump\("confirm"\)/);
  assert.match(live3, /wrongBy \}\)\); \} catch/, "STEP03 wrong counts are saved with the stage progress");
  assert.match(live3, /import\.meta\.env\.DEV && <button className="secretSolve"/);
  const lab = read("../src/features/verification/VerificationLab.tsx");
  const live4 = lab.slice(lab.indexOf("export function TwinBenchExperience"));
  assert.match(live4, /MISSION 04/);
  assert.match(live4, /bump\(`judge:\$\{q\.hyp\}:\$\{lastRun\.level\}`\)/);
  assert.match(live4, /<CatSay lines=/);
  assert.match(live4, /import\.meta\.env\.DEV && <button className="secretSolve"/);
});
