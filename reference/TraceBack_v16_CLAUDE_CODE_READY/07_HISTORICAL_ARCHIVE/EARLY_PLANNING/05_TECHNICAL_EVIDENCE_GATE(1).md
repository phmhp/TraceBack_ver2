# MATLAB 기술 근거 추출 및 전달 계약

## 실제 분석 상태
R2026b 제품 설치 목록은 사용자가 제공했으나, 구체 `slx` 모델과 export trace는 이번 첨부에 없음. 정확한 블록 경로/신호명/실행 결과는 확인되지 않았음. 공식 예제의 모델이 그대로 게임 내 특정 fault를 재현한다고 주장하지 않는다.

## Claude에 넘길 최소 파일 (MATLAB 실행 이후)
- `model_manifest.json`: 공식 문서/모델명·버전·solver·license reference
- `component_graph.json`: 원본 블록 path와 교육용 표시명 분리
- `signal_dictionary.json`: 신호명·블록경로·단위·샘플시간·의미
- `trace_normal.csv`, `trace_fault.csv`, `trace_regression.csv`: 정상/이상/수정 후 기록된 결과
- `experiment_cards.json`: id, title, whatChanges, whatStays, predictedPatternId, traceId, hypothesesDiscriminated
- `license_audit.md`: 해당 예제와 generated-code 배포 권리 확인 결과

원본 자동 생성 C/C++ 코드를 그대로 Claude 컨텍스트에 던지지 않는다. 자동 코드 생성은 실행 가능 controller subset 및 codegen 호환성 검토 뒤에만 수행하고, 생성 코드가 실시간 게임 실행 엔진과 일치한다고 주장하지 않는다.

## 시나리오와 공식 모델의 정확성 게이트
1. 동일 관측으로 H1/H2가 구분되지 않으면 첫 사건의 경쟁 가설을 수정한다.
2. fault injection은 원본 예제 사본에서만 하고 파일/solver/inputs를 추적한다.
3. 코드 생성 결과 및 공식 예제 재배포는 파일별 라이선스 확인 전 제출용 번들에 포함하지 않는다.
4. recorded sim 결과와 게임 내 가속 피드백은 별개의 시스템이다. 게임 플레이 입력을 실시간 MATLAB에 연동했다고 주장하지 않는다.
5. 실제 안전 검증 인증/ISO 26262 준수 성과라고 표현하지 않는다.
