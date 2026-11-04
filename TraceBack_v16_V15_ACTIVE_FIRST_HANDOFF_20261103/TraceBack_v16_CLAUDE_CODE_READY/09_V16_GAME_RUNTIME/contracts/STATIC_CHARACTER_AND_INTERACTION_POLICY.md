# Definitive V16 representation policy (APPROVED)

**The user did not request continuously moving 3D cat characters.** This supersedes every v14/v14.1 direction implying idle/blink/look/walk/repair character animation across the game. The intended appearance is a friendly consistent **3D-looking game**; 3D-looking images are sufficient where movement is not essential.

| Scene family | Cats | Environment | Must actually interact | Minimum implementation |
| --- | --- | --- | --- | --- |
| Title, prologue, dialogue, ending | Fixed 3D-rendered still / transparent PNG; optional manually triggered expression swap, not mandatory | static illustrated/still 3D background | start/skip/replay/advance | HTML images + interactive UI |
| Garage hub | Fixed seated/static cat images if visible; no cat rig | 3D-looking room/background, optionally 3D inspectable vehicle | 11 domains, hotspots, rotate/zoom of vehicle components where beneficial | mixed 2.5D panels and selective R3F interactive objects |
| Vehicle structure L1–L4 | None required | static room and selectively interactive cutaway models | hotspot sensors/ECUs/actuators, signal flow, domain page actions | real event handlers and information mapping |
| Evidence memo board | Static cat portrait optional | fixed perspective illustrated panel | evidence cards, linking proof, hypotheses and contradictions | DOM pointer/keyboard drag or click-to-connect, no moving cats |
| SW logic workstation | Static cat portrait optional | fixed 3D-look workbench | typed node ports, wires, block state, compile, undo | interactive graph, no animal animation |
| Twin testing bench | Static cat portrait optional | fixed 3D-look lab | select scenario, run independent oracle, charts, accept or retry | trace visualizations, distinct reference/fault/repaired states |
| Racing/chase/fault driving/ship ramp | Optional seated 3D model or static cockpit portrait; no walking characters | genuine moving 3D road, props, traffic and police | steering, brake, throttle, collision, checkpoint, chase feedback | car/world physics/gameplay + third-person camera |

**Do not** require walking navigation of garage, open world roaming cats, autonomous NPC cat AI, full-body cat rig, character idle loops outside racing, or skeletal animation of cats outside races. Avoid wasting time on these. 3D objects in educational views ARE interactive as needed (rotate, expose circuits, click outputs, drag wires, toggle switches) and are not merely nonfunctional 2D pictures. Static perspective is a visual choice, not lack of interaction.

Suggested 3D workload priority: (1) driving car/steering/braking/wheels, (2) traversable road/map, (3) obstacles/police and collision, (4) inspectable vehicle assemblies, (5) lab device reaction and readable signals, (6) optional race cat depiction. No generated 3D models delivered; PNGs do not become meshes automatically. Use original, licensed art, no exact replication of existing games.
