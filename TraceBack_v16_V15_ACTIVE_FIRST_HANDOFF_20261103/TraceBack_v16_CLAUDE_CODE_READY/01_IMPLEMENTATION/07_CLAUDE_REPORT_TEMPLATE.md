# Claude 보고 템플릿 (반드시 생성)

`REPORTS/OPEN_QUESTIONS.md`: 질문 ID / 우선도 / 현재 모호한 요구 / 확인한 근거 파일 / 선택 가능한 안 / 임시 채택안(있으면) / 사용자 확인 필요 여부.
`REPORTS/NOT_IMPLEMENTED.md`: 요구 ID / 구현 상태[WORKING|PARTIAL|STUB|MISSING|BLOCKED] / 실제로 확인한 증거 / 미구현 이유 / 다음 단계.
`REPORTS/TEST_RESULTS.md`: command / 환경 / pass/fail/skip / 실패 로그 / 원인과 재현 방법 / 미실행 사유.
`REPORTS/FILE_CHANGES.md`: 새/수정 파일 및 목적, 기존 코어 변경 여부, 인터페이스 변경 목록.
`REPORTS/SCREENSHOTS.md`: 각 씬 캡처 경로, Stitch 시안 차이, UI 이동 확인.
`REPORTS/NEXT_PASS.md`: P0 우선 미해결 5개, 필요 데이터, 작업 순서.
`REPORTS/PROVISIONAL_DECISIONS.md`: 미승인 기술·게임 결정, 위험, 쉽게 교체하는 방법.

보고에는 **잘 만들어진 부분뿐 아니라 못 만든 부분·추론으로 때운 부분·테스트 실패·사용자에게 되물어야 할 부분을 반드시 포함**. 비어있으면 '없음' 표기. 나중에 따로 요구받기 전에 첫 실행 마지막에 일괄 보고.
