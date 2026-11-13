import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("answer viewer is mounted only behind import.meta.env.DEV (lazy, dropped from production)", () => {
  const main = read("src/main.tsx");
  assert.match(main, /const DevAnswerViewer = import\.meta\.env\.DEV \? lazy\(/);
  assert.match(main, /import\.meta\.env\.DEV && DevAnswerViewer &&/);
  assert.doesNotMatch(main, /^import .*DevAnswerViewer/m);
});

test("every stage publishes its current question only inside a DEV guard", () => {
  for (const file of ["src/features/garage/MissionPanel.tsx", "src/features/board/EeTrace.tsx", "src/features/wiring/RefPuzzle.tsx", "src/features/verification/VerificationLab.tsx"]) {
    const text = read(file);
    const calls = text.match(/useDevAnswerCurrent\(/g) ?? [];
    const guarded = text.match(/import\.meta\.env\.DEV && useDevAnswerCurrent\(/g) ?? [];
    assert.equal(calls.length, 1, file);
    assert.equal(guarded.length, 1, `${file} must guard the call`);
  }
});

test("answer viewer and sheet are read-only: no dispatch, no storage writes, no send", () => {
  for (const file of ["src/ui/dev/DevAnswerViewer.tsx", "src/ui/dev/devAnswerSheet.ts", "src/ui/dev/devAnswerStore.ts"]) {
    const text = read(file);
    assert.doesNotMatch(text, /localStorage|sessionStorage|dispatch\(|send\(|setItem|useReducer/, file);
  }
});

test("viewer sits bottom-left, low opacity until hover", () => {
  const css = read("src/ui/dev/dev-answer.css");
  assert.match(css, /\.devAnswer \{[^}]*left: 0; bottom: 0/);
  assert.match(css, /\.devAnswerBtn \{[^}]*opacity: \.22/);
  assert.match(css, /\.devAnswer:hover \.devAnswerBtn/);
});
