# Claude — 첫 실행 지시 (사용자 검수 전 / 토큰 최소화)

**지금은 IMPLEMENTATION 금지.** 내가 승인한 `02_GAME_DESIGN_REVIEW.md`와 `03_SCREEN_CONTRACTS.md` 및 `01_REQUIREMENT_AUDIT.csv`만 읽고, 기존 파일/기획과 충돌 여부를 조용히 점검한다. 오래된 v0.x/v1.x 기획 문서는 새로 읽지 마라.

Repo: https://github.com/phmhp/TraceBack, branch develop. 우선 `git status`, `git rev-parse HEAD` 확인. 기존 게임 구조는 전체 읽기 대신 README/build manifest → entry/scene registry → race/vehicle physics/camera/input → assets의 고양이 얼굴/차량/맵 → `vehicle-logic-lab` entry/graph/block components 순서로 필요한 파일만 연다. vendor/node_modules/dist/build/assets binary dump 금지. 파일 경로 모르면 임의로 추측하지 말고 `UNKNOWN`으로 남겨라.

원본 사용자 고양이 얼굴은 교체 금지. 실제 엔진을 확인하지 않고 React/Three.js 등 새 프레임워크로 갈아타지 마라. MathWorks 모델/신호 실제 추출 전 새로운 공식 신호명과 수치를 만들어내지 마라. AUTOSAR 교육은 제외. 구체적인 수치값 입력형 실험 UI 금지. 동승자 포함 F1 드라이버/엔지니어 고양이 2명, 개조 예습, 도주, 주행 이상, 머릿속 증거 연결/실험/회귀, 마지막 해적선 도주가 필수.

출력은 최대 1200~1800자:
A. 확인된 실제 파일 경로별 `KEEP/ADAPT/REPLACE/UNKNOWN` 1행씩
B. 기존 엔진/맵/에셋 재사용에 관해 진짜로 막히는 점 최대 5개
C. 학습/추리/레이싱/그래픽 품질에 관한 수용테스트 10개
D. 구현 전에 승인이 필요한 결정 최대 3개

read-only audit 종료 후 구현하지 말고 사용자 피드백을 기다려라. 구현 승인 뒤에는 `REPO_MAP.md`, `STATUS.md`를 유지해 매번 repo를 다시 읽지 않는다.
