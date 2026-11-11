// Hand-made line icons (no emoji). One stroke style, inherits the text colour and size (1em).
import React from "react";

export type IconName =
  | "map" | "search" | "target" | "clock" | "pin" | "clipboard" | "detective" | "camera" | "book" | "bulb" | "wrench"
  | "probe" | "flag" | "monitor" | "tag" | "repeat" | "sensor" | "chip" | "signal" | "gear" | "car" | "clue"
  | "bolt" | "disc" | "wheel" | "battery" | "shift" | "thermo" | "spring" | "grid" | "layers" | "eye" | "mail" | "arm"
  | "shield" | "compass" | "finish" | "road" | "warning" | "sound" | "mute" | "music" | "ban" | "cloud" | "beaker" | "puzzle" | "lock";

const P: Record<IconName, React.ReactNode> = {
  lock: <><rect x="5.5" y="10.5" width="13" height="9.5" rx="1.5" /><path d="M8.5 10.5 V7.5 a3.5 3.5 0 0 1 7 0 V10.5" /></>,
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
  bolt: <path d="M13 3 L5 13 H11 L10 21 L19 10 H13Z" />,
  disc: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.5" /><path d="M17 5.5 Q21 9 19.5 15" /></>,
  wheel: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2" /><path d="M12 10 V3.5 M10.3 13 L5 17 M13.7 13 L19 17" /></>,
  battery: <><rect x="3" y="7" width="16" height="10" rx="2" /><path d="M21 10.5 V13.5" /><path d="M10 9.5 L8 12.5 H11 L9.5 15" /></>,
  shift: <><circle cx="7" cy="6" r="1.6" /><circle cx="17" cy="6" r="1.6" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /><path d="M7 7.5 V16.5 M17 7.5 V16.5 M7 12 H17" /></>,
  thermo: <><path d="M10 14 V5 A2 2 0 0 1 14 5 V14 A4 4 0 1 1 10 14Z" /><path d="M12 9 V16" /></>,
  spring: <path d="M6 3 H18 M6 21 H18 M8 6 L16 8 L8 10 L16 12 L8 14 L16 16 L8 18" />,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  layers: <><path d="M12 4 L21 9 L12 14 L3 9Z" /><path d="M3 13 L12 18 L21 13" /></>,
  eye: <><path d="M2.5 12 Q12 4 21.5 12 Q12 20 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  mail: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3.5 7 L12 13.5 L20.5 7" /></>,
  arm: <><path d="M4 20 V15 L10 11 L14 14 L19 8" /><path d="M17 5 L21 7 L19.5 10.5" /><circle cx="10" cy="11" r="1.4" /></>,
  shield: <><path d="M12 3 L19.5 6 V11.5 Q19.5 17.5 12 21 Q4.5 17.5 4.5 11.5 V6Z" /><path d="M8.5 12 L11 14.5 L15.5 9.5" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5Z" /></>,
  finish: <><path d="M5 21 V3" /><path d="M5 4 H19 V12 H5" /><path d="M5 8 H19 M9.7 4 V12 M14.3 4 V12" /></>,
  road: <><path d="M8 3 L4 21 M16 3 L20 21" /><path d="M12 4 V7 M12 10.5 V13.5 M12 17 V20" /></>,
  warning: <><path d="M12 3.5 L21 19.5 H3Z" /><path d="M12 9.5 V14" /><circle cx="12" cy="16.8" r=".6" fill="currentColor" /></>,
  sound: <><path d="M4 9.5 H8 L13 5 V19 L8 14.5 H4Z" /><path d="M16.5 9 Q18.5 12 16.5 15 M19 6.5 Q22.5 12 19 17.5" /></>,
  mute: <><path d="M4 9.5 H8 L13 5 V19 L8 14.5 H4Z" /><path d="M16.5 9.5 L21 14 M21 9.5 L16.5 14" /></>,
  music: <><path d="M9 18 V6 L19 4 V16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  ban: <><circle cx="12" cy="12" r="8.5" /><path d="M6 6 L18 18" /></>,
  cloud: <path d="M7 18 H17 A4 4 0 0 0 17 10 A5.5 5.5 0 0 0 6.5 10.5 A3.8 3.8 0 0 0 7 18Z" />,
  beaker: <><path d="M9 3 H15 M10 3 V9 L4.5 19 Q4 21 6 21 H18 Q20 21 19.5 19 L14 9 V3" /><path d="M7 15 H17" /></>,
  puzzle: <path d="M4 8 H8 A2 2 0 1 1 12 8 H16 V12 A2 2 0 1 1 16 16 V20 H4Z" />,
  car: <><path d="M4 15 L5.5 10 Q6 8.5 7.5 8.5 H16.5 Q18 8.5 18.5 10 L20 15 V18 H4Z" /><circle cx="8" cy="18" r="1.8" /><circle cx="16" cy="18" r="1.8" /></>,
};

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg className={`tbIcon ${className}`.trim()} viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[name]}</svg>;
}
