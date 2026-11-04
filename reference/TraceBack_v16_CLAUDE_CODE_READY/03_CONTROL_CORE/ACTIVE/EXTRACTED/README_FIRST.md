# TraceBack v15 교육용 제어 코어 — 누적 통합 ZIP

**v14의 기존 모든 코드와 테스트를 보존하고**, 차량 운동·타이어/휠·ABS/TCS/ESC·통합 어댑터를 추가한 버전.

- 구현 파일: `TraceBack-develop/src/campaign/motionControlModel.ts`, `integratedMotionModel.ts`
- 추가 테스트: `TraceBack-develop/tests/motion-control-educational.test.mjs`
- 기술 내용, 한계, Claude 사용 계약: `TraceBack-develop/docs/V15_MOTION_CORE_HANDOFF.md`
- 전체 자동 테스트 출력: `ALL_TEST_RESULTS.txt`

**중요:** 이 파일은 자동차 제어 **교육용 근사 코드**이며 '모든 생산차의 전체 제어 로직'이나 HIL 인증된 차량 시뮬레이터가 아님. v14의 기존 범위와 누락된 역량은 위 문서에 분명히 구분함.
