// Concrete numbers (value + unit) are shown like inline code so they stand out from the prose.
import React from "react";

const NUM = /(×\s?\d+(?:\.\d+)?|\d+(?:\.\d+)?\s?(?:Nm|%|°C|bar|rpm|m\/s²|km\/h|kW|V|A|ms|L\/min))/g;

/** Wraps every "number + unit" in the text in <code class="num">. */
export function numify(text: React.ReactNode): React.ReactNode {
  if (typeof text !== "string") return text;
  const parts = text.split(NUM);
  if (parts.length === 1) return text;
  return parts.map((part, index) => index % 2 ? <code key={index} className="num">{part}</code> : part);
}
