# Decision registry — precedence v14.1 over older conflicts only in listed areas

| ID | Decision | State | Rationale / change rule |
|---|---|---|---|
| D-01 | PC browser, desktop 16:9 | APPROVED | User 2026-11-03 |
| D-02 | React + Three.js + React Three Fiber + TS | APPROVED | Game framework target, not yet scaffolded |
| D-03 | Required propulsion gateway + thermal fan; optional brake | APPROVED | Executable sample incidents, other 11 domains stay explorable |
| D-04 | Police chase failure -> checkpoint retry | APPROVED | No soft lock on education |
| D-05 | 3D interaction first, visual polish iteratively | APPROVED | All UI and characters eventually consistent 3D look |
| D-06 | v14 existing integrated model fixed 20ms | VERIFIED | Model/test source |
| D-07 | Pedal gateway -55% fault | PROVISIONAL | Fictional controlled software input-calibration fault. Thresholds teaching-only |
| D-08 | Fan stuck off is HW, restored parked, not software | VERIFIED IN MODEL | v14 fan plant fault and diagnostic test |
| D-09 | Brake actuator stuck optional | PROVISIONAL | Similar runtime hardware response |
| D-10 | Mass 1500kg, 45m/s game speed cap, 2.7m wheelbase | PROVISIONAL | Toy model, not OEM values; configuration should be centralised later |
| D-11 | 2 cat role/color assignments | REQUIRES_REVIEW | No final approved identity mapping in uploaded evidence |
| D-12 | Stitch final selections | REQUIRES_REVIEW | No authoritative approvals per variant; list candidate IDs |
| D-13 | asset conversion to rigged glTF | REQUIRES_REVIEW | references are 2D; do not mislabel as finished 3D |
| D-14 | chase AI, arrest distance, route, checkpoint positions | PROVISIONAL | implement as inspectable config after scene exists |
| D-15 | Score / escape cinematic / VO | REQUIRES_REVIEW | cannot claim delivered |
| D-16 | Case verification tolerance is independent of reference trace | VERIFIED IN MODEL | current oracle tests; tolerance is PROVISIONAL educational metric |

`APPROVED` = user-selected scope. `VERIFIED IN MODEL` means unit-tested educational model only, not HIL or OEM validated. `PROVISIONAL` = adjustable gameplay/fiction choice, not sourced technical fact. Do not silently turn `REQUIRES_REVIEW` into approval.
