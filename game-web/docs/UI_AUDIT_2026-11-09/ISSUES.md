# Observed issues and capture notes

1. **Correct project captured.** Port 5180 was verified as `game-web` before capture. The previous audit in the other project is not evidence for this project.
2. **Initial guide overlays dominate first-visit captures.** `03_garage_drive_ee.png`, `04_garage_drive_sw.png`, and `27_evidence_board.png` deliberately show the initial instructional modal. The underlying panels are visible but blurred; capture them again after guide dismissal when preparing a redesign reference that needs unobscured detail.
3. **Current board differs from requested DominoTrace.** `BOARD` mounts `EeTrace.tsx`; the Domino components are present but unmounted. This is a product-state fact, not a capture failure.
4. **No direct browser-console error collection was built into the existing capture runner.** Its 42 captures completed without navigation/capture failure. A separate DevTools-log pass is required if console health must be asserted.
5. **Working tree was already dirty.** Existing source changes and Vite cache changes were present; they were not altered or reverted. This audit adds only the new `docs/UI_AUDIT_2026-11-09/` output.
