# Screen QA

The revised build follows the supplied Stitch screen language instead of the discarded generic card prototype.

| Runtime screen | Stitch reference family | Actual interaction |
|---|---|---|
| TITLE | `00_traceback` | new game, save-aware continue state |
| PROLOGUE | `01_1_f1` through `01_4` | three-step dialogue, skip |
| GARAGE L1-L4 | `02`, `03_1`, `03_2_*` | four architecture layers and signal path |
| CHASE / RESUME / SHIP | `04_*`, `05` | fixed-tick keyboard driving, obstacles, police gap |
| BOARD | `06`, `06_1`, `06_2` | evidence selection and competing hypotheses |
| WIRING | `03_2_1`, `06_2` | constrained slot assembly, wrong program preserved |
| TWIN_BENCH | `07`, `07_1` | reference/user rigs, computed pass/fail |
| REPAIR / OPTIONAL | `07_2` | software vs parked hardware recovery |
| ENDING / CAUGHT | `08_*` | report built from play record, checkpoint retry |

Static story and mystery scenes use provided selected reference PNGs. Race scenes use active Three.js rendering.
