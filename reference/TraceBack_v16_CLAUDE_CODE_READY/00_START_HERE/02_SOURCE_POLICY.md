# 파일 처리 기준
- 새 프로젝트는 별도로 생성. `03_CONTROL_CORE` 외에 이전 Git 저장소 전체를 열지 않음.
- `02_UI_DESIGN/`의 2개 HTML+PNG Stitch ZIP 및 7개 이미지 참조 ZIP는 화면별 검색용. 코드 자체는 오래된 단일 정적 HTML이므로 링크가 잘못되어도 재사용하지 않음.
- `04_ASSETS` 전체 ZIP은 원본 보관. asset-map 및 이미지 파일의 내용을 확인하여 실제 3D glTF/FBX 등과 2D 참고 그림을 구분. 2D 파일을 3D 모델로 주장 금지.
- `03_CONTROL_CORE`의 `docs/INTEGRATED_VEHICLE_CONTROL_EDUCATIONAL.md`와 `src/campaign/integratedVehicleModel.ts`를 먼저 본 다음 요청된 하위 모듈만 읽음. `vehicleSystems.ts`, `TorqueModel` 등 유사 경로를 동일 엔진으로 가정하지 않음.
- 07_HISTORICAL_ARCHIVE는 조회 요청이 있을 때만 읽고 게임 규칙 결정을 소급하지 않는다.
- `SOURCE_MANIFEST.csv`는 외부 ZIP과 신규 문서 해시·크기를 확인하는 색인. 빠진 파일은 즉시 보고한다.
