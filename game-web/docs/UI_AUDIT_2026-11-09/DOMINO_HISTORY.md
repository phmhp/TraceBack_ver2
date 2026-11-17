# Domino history and recoverable layouts

## Current mounting state

`src/main.tsx` currently renders `EeTrace` for `BOARD`:

```ts
if (state.scene === "BOARD") return frame(<EeTrace state={state} send={send} />)
```

`DominoTrace.tsx`, `DominoBoard.tsx`, and `SuspectBoard.tsx` exist but are explicitly unmounted. Capture `27_evidence_board.png` is therefore the current E/E trace tutorial, not a rendered DominoTrace board.

## Git evidence (read-only review)

The Git root is `C:\Users\user\OneDrive\Desktop\261103codex`. No restore operation was run. Relevant history, newest first:

| Commit | Subject / recoverable direction |
|---|---|
| `6fe5531` | Domino reverse trace: replay/measure then reveal arrows; player-led refute/hold hypotheses. |
| `297b856` | Verification overlay and first-divergence boundary inspection. |
| `3ee794c` | E/E viewer + right-side evidence polaroids; selecting components creates measurement evidence. |
| `2b4b6e9` | Evidence above E/E board, candidate row below; older DominoTrace kept unused. |
| `9545632` | Pin-and-string domino cards / card flipping. |
| `9f79209` | Domino v6: polaroid photo, time clue and decoy reasoning. |
| `12a1d84` | One-screen domino board, three candidates and whole map. |
| `1d09ca0` | Reverse-following fallen-domino design. |
| `557ac5e` | Earlier E/E impact-map domino board. |

## Reusable assets/components

- `src/features/board/DominoTrace.tsx`: reverse domino path; likely the closest prior full-screen layout.
- `src/features/board/DominoBoard.tsx`: E/E-impact-map variant.
- `src/features/board/SuspectBoard.tsx`: evidence-to-suspect board variant.
- `src/features/board/EeTrace.tsx`: current mounted E/E trace; retains current state/transition contract.
- Polaroids/evidence: `public/assets/polaroid-frame-real-v1.png`, `public/assets/board-photos/`, `public/assets/diagnostic-evidence-sheet-v1.png`, `public/assets/traceback-engineering-evidence-atlas-v1.png`.

Recovery should be a deliberate approved UI selection: Git shows several competing layouts, not one unambiguous “original domino” state.
