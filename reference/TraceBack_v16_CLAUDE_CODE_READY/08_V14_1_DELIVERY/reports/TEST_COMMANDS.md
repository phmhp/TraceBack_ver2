# Reproduce

```sh
cd 08_V14_1_DELIVERY/control-core/TraceBack-develop
node --version
node --experimental-strip-types --test tests/educational-game-bridge.test.mjs tests/educational-bench.test.mjs
node --experimental-strip-types --test $(find tests -name '*.test.mjs' ! -name engineering.test.mjs ! -name logic.test.mjs | sort)
node --experimental-strip-types scripts/export-bench.mjs ../../reports/GENERATED_TRACE
```

Do not claim full test-suite PASS: full `tests/*.test.mjs` cannot complete because selected v14 bundle omitted `src/content/ready.ts` required by inherited `engineering.test.mjs` and `logic.test.mjs`. Do not fabricate original module contents to force passing.
