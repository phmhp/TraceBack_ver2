# Chrome UI QA capture report

Viewport: Chrome, 1054 x 723 px.  
Scope: vehicle-domain learning (Vehicle/System, E/E Architecture, Control Software), domino backtrace, and simulation verification (all four visible simulation tabs).

## Captured states

- `00-title.jpg` through `06-garage-control-software.jpg`, plus `18-garage-post-interaction.jpg`: title/prologue, garage intro, pre-task, the three abstraction layers, and the READY/D-enabled interaction state.
- `07-domino-intro-popup.jpg` through `09-domino-post-solve.jpg`: domino-stage intro, pre-solve, and solved state.
- `10-verification-intro-popup.jpg` through `17-verification-post-answer.jpg`: verification intro, pre-solve, all tabs, active simulation result, and decision state.

## Findings

1. **P2 — Domino evidence-card labels are truncated at the tested desktop viewport.**
   In the evidence rail, labels such as `계기판 가속 출력 저하` and `주행 기록 · 차량 가속` are rendered as clipped ellipses. The small fixed-width cards do not provide their full context before selection. Evidence: `issue-01-domino-evidence-label-truncation.jpg`.

2. **P2 — The solved domino view preserves unreadable truncated labels.**
   Once the evidence set expands, the left rail has even more cards with clipped labels, which makes it difficult to distinguish the record being reviewed. Evidence: `issue-02-domino-post-solve-label-truncation.jpg`.

3. **P1 — Verification input-condition chips overlap after a run.**
   In the result/decision state, the third input-condition chip collides with the prior chip and its text, so the conditions cannot be read reliably. Evidence: `issue-03-verification-condition-overlap.jpg`.

## Follow-up prompts

- Make evidence cards wide enough for two-line labels, or expose the complete label through a consistently visible detail/tooltip treatment.
- Make the verification input-condition row wrap with stable gaps (or stack it) before the table at widths at or below 1054 px.
- Re-run this capture set at the same Chrome viewport after the layout changes.
