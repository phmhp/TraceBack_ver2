import React from "react";

export function ReplayConfirm({ impact, onCancel, onConfirm }: { impact?: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="replayConfirm" role="dialog" aria-modal="true" aria-label="다시 풀기 확인" onClick={onCancel}>
    <article onClick={event => event.stopPropagation()}>
      <button className="replayClose" aria-label="닫기" onClick={onCancel}>×</button>
      <small>풀이 초기화</small><h2>다시 푸시겠습니까?</h2>
      <p>이 단계의 풀이 내용이 초기화됩니다.</p>
      {impact && <p className="replayImpact">{impact}</p>}
      <footer><button onClick={onCancel}>취소</button><button className="primary" onClick={onConfirm}>다시 풀기</button></footer>
    </article>
  </div>;
}
