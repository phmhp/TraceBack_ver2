# 작업 인계

- HEAD: 이 문서가 포함된 최신 커밋
- 공식 추적표(SSOT): `docs/REQUIREMENT_TRACEABILITY_FINAL_2026-11-10.md`
- 완료: N-01/N-02, P0-A/P0-B, P1-A/P1-B (UI 검증 대기 별도)
- 완료: K-4.1/K-4.3/K-4.4/K-4.5의 공통 수동 신호 단계 보존(부분 구현, UI 검증 대기).
- 남은 요구사항: K-4.2 도메인별 3D 직접 조작·연동 확장 → K-5/L-4.2 → K-6/K-7/L-5.2/L-6.3/L-7~L-9 → P2 L-2.x. N/P0/P1/K-4 연결 브라우저 UI 검증 대기.
- 마지막 수정: `src/experiences.tsx`, `tests/v4-step01-layout.test.mjs`
- 검증: `node --test tests/v4-step01-layout.test.mjs` 13/13, `npm run build` 통과. 브라우저 연결 없음.
- 다음 작업: K-4.2의 기존 데이터·컴포넌트 기반 도메인별 3D 직접 조작·관점 연동 수락 기준.
