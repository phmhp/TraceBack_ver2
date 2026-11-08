// Hand-made line icons (no emoji). One stroke style, inherits the text colour and size (1em).
import React from "react";

export type IconName =
  | "map" | "search" | "target" | "clock" | "pin" | "clipboard" | "detective" | "camera" | "book" | "bulb" | "wrench"
  | "probe" | "flag" | "monitor" | "tag" | "repeat" | "sensor" | "chip" | "signal" | "gear" | "car" | "clue";

const P: Record<IconName, React.ReactNode> = {
  map: <><path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20Z" /><path d="M9 4 V18 M15 6 V20" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15 L20 20" /></>,
  clue: <><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15 L20 20" /><path d="M10.5 7.5 V10.5 L12.5 12" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7 V12 L15.5 14" /></>,
  pin: <><path d="M12 21 V14" /><path d="M8 4 H16 L14.5 9 L17 12 H7 L9.5 9Z" /></>,
  clipboard: <><rect x="5" y="5" width="14" height="16" rx="2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M8.5 12 H15.5 M8.5 16 H13" /></>,
  detective: <><path d="M4 11 H20" /><path d="M7 11 L8.5 5 H15.5 L17 11" /><circle cx="9" cy="16" r="2.5" /><circle cx="15" cy="16" r="2.5" /><path d="M11.5 16 H12.5" /></>,
  camera: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7 L9.5 4.5 H14.5 L16 7" /><circle cx="12" cy="13.5" r="3.5" /></>,
  book: <><path d="M3 5.5 Q7.5 3.5 12 5.5 V20 Q7.5 18 3 20Z" /><path d="M21 5.5 Q16.5 3.5 12 5.5 V20 Q16.5 18 21 20Z" /></>,
  bulb: <><path d="M9 17 H15 M10 20 H14" /><path d="M8 13 Q5.5 10.5 6.5 7 Q8 3.5 12 3.5 Q16 3.5 17.5 7 Q18.5 10.5 16 13 Q15 14 15 15 H9 Q9 14 8 13Z" /></>,
  wrench: <path d="M14.5 4 A4.5 4.5 0 0 0 10 9.5 L4 15.5 A2 2 0 0 0 7 18.5 L13 12.5 A4.5 4.5 0 0 0 19 8 L16 9 L14.5 7.5 L15.5 4.5Z" />,
  probe: <><path d="M4 20 L9 15" /><path d="M8 13 L13 8 L16 11 L11 16Z" /><path d="M14 7 L17 4 M17 10 L20 7" /></>,
  flag: <><path d="M5 21 V3" /><path d="M5 4 H17 L14.5 8 L17 12 H5" /></>,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20 H16 M12 16 V20" /><path d="M6 12 L9 9 L12 11 L15 7 L18 9" /></>,
  tag: <><path d="M3 12 V4 H11 L20 13 L13 20Z" /><circle cx="7.5" cy="8.5" r="1.3" /></>,
  repeat: <><path d="M4 11 A7 7 0 0 1 17 7.5" /><path d="M17 3.5 V7.5 H13" /><path d="M20 13 A7 7 0 0 1 7 16.5" /><path d="M7 20.5 V16.5 H11" /></>,
  sensor: <><circle cx="12" cy="12" r="3" /><path d="M7.5 7.5 A6.5 6.5 0 0 0 7.5 16.5 M16.5 7.5 A6.5 6.5 0 0 1 16.5 16.5" /></>,
  chip: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 3 V6 M15 3 V6 M9 18 V21 M15 18 V21 M3 9 H6 M3 15 H6 M18 9 H21 M18 15 H21" /></>,
  signal: <><path d="M4 12 H8 L10 7 L14 17 L16 12 H20" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.6 5.6 L7.8 7.8 M16.2 16.2 L18.4 18.4 M5.6 18.4 L7.8 16.2 M16.2 7.8 L18.4 5.6" /></>,
  car: <><path d="M4 15 L5.5 10 Q6 8.5 7.5 8.5 H16.5 Q18 8.5 18.5 10 L20 15 V18 H4Z" /><circle cx="8" cy="18" r="1.8" /><circle cx="16" cy="18" r="1.8" /></>,
};

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg className={`tbIcon ${className}`.trim()} viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[name]}</svg>;
}
