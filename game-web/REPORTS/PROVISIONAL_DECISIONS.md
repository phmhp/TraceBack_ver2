# Provisional decisions

- 차량 수치, 맵 거리, 충돌 반응은 `DEMO` MockVehicleControlAdapter 수준이다.
- v15 제어 코어는 이 PASS에서 실행 통합하지 않았다. 브라우저 게임의 유일한 차량 운동 계산 소유자는 `src/main.tsx`의 `Vehicle` update loop이다.
- 사건 원인/정답은 v16 `schemas.mjs`의 세 사례를 따른다.
- `traceback-title-garage-v2.png` and `traceback-red-ev-v2.png` are generated project-bound art assets for the V2 visual pass; they replace stretched low-resolution reference usage in the title and garage hero.
