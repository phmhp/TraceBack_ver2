# 시나리오/데이터 원칙

`05_SCENARIOS/` 11개 Scenario JSON은 기획 초안(PROPOSED), 사실로 확정된 결함 아님. 3개 게임 사건 우선: torque limit / thermal hysteresis / regen-friction split (optional). 모든 도메인 11개 고장 사건을 즉시 구현해야 한다는 의미 아님.

한 사건의 필수 구성:
1. scenarioId/priority, learningObjectives, requirements IDs, architectures level
2. faultType(SW/HW/SENSOR/INTERFACE), exact injection hook and trigger, reset, expected symptom
3. hypotheses(min 2) + discriminating signals; 근거 없는 '정답' 금지
4. evidence(signalId, source, units, timestamp/reveal, supports/refutes)
5. testCases(initial state, timed input, fault timing, measured outputs, **independent oracle + tolerance**, normal/boundary/fault/recovery, required/optional)
6. repair (allowed block edits, recovery preconditions, safety restrictions)
7. play steps(hints, retry, UI title, animations)
8. provenance(version, source code, confidence: proposed/reviewed/trace-verified/game-verified)

데이터 작성 자동화: signal dictionary는 소스 타입에서 추출 후 의미/단위 검수; requirements는 모델/테스트 추출 후 내용 검수; test vectors는 승인된 사건과 검증 기준 기반 생성; trace_reference/faulty/repaired는 동일 초기상태의 실제 실행에서 기록. coverage matrix는 requirement↔test 매핑. source_provenance는 모델 해시/버전/dt/seed/adapter 버전. 누구도 임의로 `trace_reference.csv`를 손으로 꾸며 넣지 않는다.

손으로 할 일: 교육 목표, 가설 간 차이, 고장 사건의 재미와 구분 가능성 및 안전 조치 승인. 기술 신호·기대값·시험 trace는 코드 실행으로 생성하고 별도 리뷰.

처리 정책: missing_data → NOT_AVAILABLE. model-invalid → MODEL_ERROR. insufficient_evidence → INCONCLUSIVE. test-valid but unmet oracle → FAIL. test-valid meets oracle → PASS. PASS of 1 TC != scenario solved or vehicle safe.
