# TraceBack UI audit — 2026-11-09

Target project: `C:\Users\user\OneDrive\Desktop\261103codex\game-web`.

## Capture conditions

- URL: `http://127.0.0.1:5180` (verified to be this project's Vite process).
- Browser viewport: **1920 × 1080**, device scale factor 1, original PNG, no crop.
- Capture count: **42** current implemented states.
- Runner: the project's existing `scripts/capture-ui.mjs`, using its documented QA scene parameters. It opens an isolated headless Chrome profile and does not edit source/UI/data/assets.

## Contents

- `screenshots/` — 42 PNG captures: title/prologue, seven domains × System/E/E/Control SW, driving/fault, domino trace, puzzle, all validation tabs, repair/re-drive, ship and endings.
- `SCREEN_INVENTORY.md` — screens, entry parameters, rendered components, layout/data/assets.
- `INTERACTION_AUDIT.md` — player controls and state transitions.
- `DOMINO_HISTORY.md` — actual Git history and current/legacy domino implementations.
- `ISSUES.md` — observed capture issues and current gaps.

## Key capture groups

| Files | Coverage |
|---|---|
| `00`–`01` | Title and prologue |
| `02`–`22` | Drive, brake, steer, gear, power, thermal, suspension: System / E/E / Control SW |
| `23`–`26` | Heist / boarding and normal driving / fault dialogue |
| `27`–`28` | Current E/E trace (“domino reverse trace” tutorial) and wiring puzzle |
| `29`–`32` | Twin bench: SW, embedded/ECU integration, system, vehicle tabs |
| `33`–`35` | Failure analysis, repair, re-drive |
| `36`–`41` | Final dock race, ship sequences, caught/continue, pause, ending |

## Reproduction

```powershell
$env:TRACEBACK_CAPTURE_URL='http://127.0.0.1:5180'
$env:TRACEBACK_CAPTURE_WIDTH='1920'
$env:TRACEBACK_CAPTURE_HEIGHT='1080'
node scripts/capture-ui.mjs 'docs\UI_AUDIT_2026-11-09\screenshots'
```
