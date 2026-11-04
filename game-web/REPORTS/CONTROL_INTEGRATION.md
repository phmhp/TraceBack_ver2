# Control integration

Current execution uses a deterministic in-browser mock: keyboard input updates speed, heading, heat and injected fault state. The React/Three renderer only renders that state. No v14.1 feature is directly connected and no v15 module is bundled.

Future adapter boundary: replace the `Vehicle` update loop in `src/main.tsx` with an adapter exposing `step(input, dt)`, `injectFault`, `clearFault`, `snapshot`, `restore`, and `runTest`. Confirm units (m/s vs km/h), fixed tick, reset/fault semantics and trace shape before replacement. Re-run `npm test` and a browser campaign regression.
