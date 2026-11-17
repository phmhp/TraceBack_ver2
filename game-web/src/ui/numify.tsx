// Concrete numbers (value + unit) are shown like inline code so they stand out from the prose.
import React from "react";

// Keep numeric values visually distinct from prose.  The letter boundaries
// avoid turning identifiers such as STEP04 or CAN2 into inline code while
// still covering standalone values such as `3.3` and `60 %`.
// A unit may be followed by a Korean particle ("12V를"); a bare number may not be glued to letters or digits.
const NUM = /((?<![A-Za-z가-힣\d.])(?:×\s*)?\d+(?:\.\d+)?(?:\s?(?:Nm|%|°C|bar|rpm|m\/s²|km\/h|kW|V|A|ms|L\/min)(?![A-Za-z])|(?![A-Za-z가-힣\d])))/g;

/** Wraps every "number + unit" in the text in <code class="num">. */
export function numify(text: React.ReactNode): React.ReactNode {
  if (typeof text !== "string") return text;
  const parts = text.split(NUM);
  if (parts.length === 1) return text;
  return parts.map((part, index) => index % 2 ? <code key={index} className="num">{part}</code> : part);
}
