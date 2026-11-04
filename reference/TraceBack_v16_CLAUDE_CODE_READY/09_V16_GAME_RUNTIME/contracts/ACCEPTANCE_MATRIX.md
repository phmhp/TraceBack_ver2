# v16 validation / acceptance matrix

| Requirement | Executable now? | Evidence / further Claude work |
| --- | --- | --- |
| Garage training required before chase | YES | game-runtime tests |
| Evidence/hypothesis gates | YES, minimal | tests; UI evidence connection and actual observation extraction remain TODO |
| Constrained gateway fix changes live v14 ECU/vehicle | YES bridge | v14.1 tests; add interactive R3F wiring UI |
| Same initial conditions normal/fault/repaired paired bench | YES | runPairedTrace wrapper tests |
| Thermal fan HW not repairable by software | YES gate | hardware service parked enforced; actual service UI TODO |
| Optional brake can be skipped | YES | full-loop test |
| Race capture/checkpoint and pause policy | YES pure runtime | raceRuntime tests; route/police AI/geometry and event glue TODO |
| Story from title to ending in headless reducer | YES | full-flow test |
| Save schema and migration guard | YES in-memory JSON | browser persistence UI/validation TODO |
| 11 domains fully inspectable E/E with 3D interaction | NO | original v14 domain map; create interactive scene views |
| Typed generic block graph compiler | NO | constrained program modes only; implement validator/compiler if needed |
| 22 polished designed pages, complete navigation bindings | NO | contract and reducer exist; UI TODO |
| 3D racing, roads, city/coast/port, collision + police movement | NO | 3D view and event adapter TODO |
| Stationary cat images outside chase | SPECIFIED | do not create animated cat NPCs |
| Fully modeled 3D cats in race | OPTIONAL | seated static portrait or original mesh only as needed |
| End-to-end actual playable browser game | NO | Claude Code builds React/R3F frontend |
| Comprehensive OEM-grade safety validation | NOT INTENDED | educational demo only |

Test labels: `pass` = executed and met conditions, `fail` = executed and mismatch, `inconclusive` = insufficient evidence, `model_error` = test execution problem, `not_implemented` = no testable implementation. Do not mark specs/tests as a completed UI.
