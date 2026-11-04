# Acceptance checklist / 실제 테스트가 없는 완료 선언 금지

P0: (1) 새 프로젝트 단독 설치/빌드/실행 (2) 16:9 데스크톱 주행, 키 입력 가속·감속·조향/선회·충돌 (3) 시내/항구 시각 밀도, 카메라·맵 회전·추격 차 위치 계산 (4) 첫 고장 발생, observable 기록, 재생 (5) BOARD 선택에 따른 단서 공개/오답 피드백 (6) WIRING에서 잘못된 형식 연결 차단, 논리 오류는 시험 허용 (7) 변경된 블록이 executor 결과에 영향을 줌 (8) 변경이 실제 v14 ECU 명령/plant trace 또는 명시적으로 고립된 demo engine에 반영, 격리 상태를 보고 (9) BENCH reference/faulty/repaired 같은 초기조건·시간축, 다중 시험, 독립 oracle, 서로 다른 결과 (10) 고장 시험 FAIL과 정상 회귀 FAIL을 구분 (11) 실패 시 필요 위치로 재진입 (12) 정상 보호 동작을 위험한 출력 해제로 잘못 보상하지 않음 (13) 이후 차고와 레이싱 복귀 (14) 빈칸/무의미한 버튼/화면 링크 없음 (15) open questions/non implemented 리포트.

P1: 열관리 히스테리시스 시간 실행·회복, 제동 통합 시험, ABS/TCS/ESC 등 확장 분류, 실제 적절한 3D 캐릭터 애니메이션, 최종 해적선 엔딩.

테스트 종류: unit (math/type/state), adapter (units/loop), scenario (init/fault/repair), regression (normal/protection), UI navigation, playable smoke test, screenshot QA. 테스트 환경의 실패와 결함 검증 FAIL을 별도 코드로 보고.

필수 리포트: 실행 명령, 자동 테스트 목록 통과/실패, 동작 영상 또는 스크린샷 경로, 누락된 확정 콘텐츠/3D 자산, 임시값과 출처, 기능별 실동작/placeholder 분류.
