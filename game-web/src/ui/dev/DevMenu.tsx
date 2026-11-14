import { useState, useSyncExternalStore } from "react";
import { getDevActions, subscribeDevActions } from "./devActions";
import "./dev-menu.css";

const SCENES: [string, string][] = [
  ["PROLOGUE", "프롤로그"], ["GARAGE_L1", "STEP01 정비소"], ["DRIVE_BRIEFING", "주행 브리핑"], ["CHASE_NORMAL", "레이싱"],
  ["BOARD", "STEP02 도미노"], ["WIRING", "STEP03 퍼즐"], ["TWIN_BENCH", "STEP04 검증"], ["REPAIR", "수리"],
  ["CHASE_RESUME", "주행 복귀"], ["SHIP_ESCAPE", "해적선"], ["ENDING", "엔딩"],
];
const CASES: [string, string][] = [["propulsion", "구동"], ["thermal", "열관리"], ["brake", "제동"]];

function clickFirst(selector: string) {
  const el = [...document.querySelectorAll<HTMLButtonElement>(selector)].find(b => !b.disabled && b.offsetParent !== null);
  el?.click();
  return Boolean(el);
}

export function DevMenu({ scene }: { scene: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const actions = useSyncExternalStore(subscribeDevActions, getDevActions, getDevActions);
  const params = new URLSearchParams(location.search);
  const [caseId, setCaseId] = useState(params.get("case") ?? "propulsion");
  const say = (text: string) => { setNote(text); window.setTimeout(() => setNote(""), 1600); };

  const jump = (qa: string) => { location.href = `${location.pathname}?qa=${qa}&case=${caseId}`; };
  const reset = () => {
    try { [sessionStorage, localStorage].forEach(store => Object.keys(store).filter(key => key.startsWith("tb")).forEach(key => store.removeItem(key))); } catch { /* ignore */ }
    location.href = `${location.pathname}?new`;
  };
  const solve = () => actions?.solve ? (actions.solve(), say("정답 적용")) : say("이 화면은 정답 적용 없음");
  const next = () => say(clickFirst(".stageProgressAction, .garageProceed") ? "다음 이동" : "활성 다음 버튼 없음");

  return <div className="devMenu" data-open={open}>
    {open && <div className="devPanel" role="dialog" aria-label="개발자 메뉴">
      <header><b>DEV</b><span>{scene}</span><small>{note}</small></header>
      <div className="devRow">
        <button onClick={solve} disabled={!actions?.solve}>정답 적용</button>
        <button onClick={next}>다음 단계</button>
        <button onClick={reset}>전체 초기화</button>
      </div>
      <label>사건
        <select value={caseId} onChange={event => setCaseId(event.target.value)}>{CASES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
      </label>
      <div className="devJump">{SCENES.map(([id, label]) => <button key={id} className={id === scene ? "now" : ""} onClick={() => jump(id)}>{label}</button>)}</div>
      <p>일반 플레이 검증과 구분: 이 메뉴는 개발 서버에서만 나타납니다.</p>
    </div>}
    <button className="devToggle" onClick={() => setOpen(value => !value)} aria-label="개발자 메뉴">DEV</button>
  </div>;
}
