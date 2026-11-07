// Garage "E/E Architecture" view: one 2D blueprint of the whole vehicle network.
// Every domain controller sits on a shared CAN backbone through the gateway; sensors on the left,
// actuators and vehicle behaviour on the right. The selected function's parts are highlighted,
// everything else stays visible but dimmed (whole-vehicle view, domain as a highlight filter).
import React from "react";

type Role = "input" | "control" | "network" | "actuator" | "result";
const ECU_BOXES = [
  { id: "vcu", label: "VCU", row: 0, col: 0, match: /VCU|Interlock|Coordinator/ },
  { id: "mcu", label: "MCU·인버터 ECU", row: 0, col: 1, match: /MCU|인버터 ECU/ },
  { id: "eps", label: "EPS ECU", row: 0, col: 2, match: /EPS ECU/ },
  { id: "bms", label: "BMS", row: 1, col: 0, match: /BMS/ },
  { id: "tms", label: "Thermal ECU", row: 1, col: 1, match: /Thermal ECU/ },
  { id: "brk", label: "Brake ECU", row: 1, col: 2, match: /Brake ECU|ABS ECU|ESC ECU|Hydraulic ECU|압력 제어기/ },
  { id: "chs", label: "Chassis·Park ECU", row: 1, col: 3, match: /Chassis ECU|Park ECU/ },
  { id: "dcu", label: "변속·클러스터", row: 0, col: 3, match: /Cluster|PRND/ },
];

export function EeBlueprint({ chain, roles, active, removed, onPick }: {
  chain: string[]; roles: Role[]; active: number; removed: number | null; onPick?: (index: number) => void;
}) {
  // place each part of the selected chain on the blueprint
  const sensors = chain.map((label, i) => ({ label, i })).filter(item => roles[item.i] === "input");
  const actuators = chain.map((label, i) => ({ label, i })).filter(item => roles[item.i] === "actuator" || roles[item.i] === "result");
  const network = chain.map((label, i) => ({ label, i })).filter(item => roles[item.i] === "network");
  const ecuParts = (box: (typeof ECU_BOXES)[number]) => chain.map((label, i) => ({ label, i })).filter(item => roles[item.i] === "control" && box.match.test(item.label));
  const chip = (item: { label: string; i: number }) => <button key={`${item.label}-${item.i}`} className={`eeChip ${item.i === active ? "active" : ""} ${item.i === removed ? "out" : ""}`} onClick={() => onPick?.(item.i)}>{item.i === removed ? "🚫 " : ""}{item.label}</button>;
  return <div className="eeBlueprint">
    <div className="eeCol eeSensors"><small>센서 · 운전자 입력</small>{sensors.map(chip)}</div>
    <div className="eeCore">
      {[0, 1].map(row => <div key={row} className="eeRow">{ECU_BOXES.filter(box => box.row === row).map(box => { const parts = ecuParts(box); return <div key={box.id} className={`eeEcu ${parts.length ? "lit" : ""}`}><b>{box.label}</b>{parts.map(chip)}</div>; })}</div>)}
      <div className="eeBus"><span>CAN 버스</span><i>게이트웨이</i>{network.map(chip)}</div>
      <div className="eePower">⚡ 12V·고전압 전원선 (모든 제어기에 공급)</div>
    </div>
    <div className="eeCol eeActuators"><small>부품 · 차량 반응</small>{actuators.map(chip)}</div>
  </div>;
}
