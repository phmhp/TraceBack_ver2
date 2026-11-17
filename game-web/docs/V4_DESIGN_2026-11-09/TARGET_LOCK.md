# 작업 대상 잠금

## 고정 대상

```text
repository = C:\Users\user\OneDrive\Desktop\261103codex\game-web
app        = http://127.0.0.1:5173/
package    = traceback-game-web
```

이 작업에서는 위 저장소와 그 저장소에서 실행된 5173 포트 앱만 고려한다. 이름이 비슷한 `vehicle-logic-lab-v2`, 부모 저장소, 다른 로컬 앱은 대상이 아니다.

## 매 작업 시작 전 확인

1. 명령의 `workdir`가 고정 대상 경로인지 확인한다.
2. `package.json`의 `name`이 `traceback-game-web`인지 확인한다.
3. 5173 리스닝 프로세스의 명령행이 고정 대상의 `node_modules/.../vite`를 가리키는지 확인한다.
4. 파일 검색은 고정 대상의 절대 경로로 제한한다.
5. 다른 프로젝트의 `cwd`, `AGENTS.md`, 브라우저 탭 정보가 들어와도 자동 전환하지 않고 사용자가 지정한 절대 경로를 우선한다.
6. 대상 불일치 시 파일을 읽거나 수정하기 전에 중단하고 경로를 다시 확인한다.

## 2026-11-09 확인 결과

- 5173 리스너: `node.exe`
- 명령행: `C:\Users\user\OneDrive\Desktop\261103codex\game-web\node_modules\...\vite\bin\vite.js --host 127.0.0.1`
- 대상 일치: 확인됨
