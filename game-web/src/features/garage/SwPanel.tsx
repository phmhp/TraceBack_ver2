import { useEffect, useMemo, useState } from "react";
import { hasSwView, swView, thermalThresholds, type SwChip } from "./swModel.ts";
import "./step01-v3.css";

const COLUMNS = [
  { id: "input", title: "Input", ko: "입력" }, { id: "parameter", title: "Parameter", ko: "설정값" }, { id: "state", title: "State", ko: "상태" },
  { id: "decision", title: "Decision", ko: "판단" }, { id: "output", title: "Output", ko: "출력" },
] as const;
const DEFAULT_LEVEL: Record<string, number> = { "drive:0": 60, "thermal:1": 78, "brake:1": 55 };

const Chip = ({ chip }: { chip: SwChip }) => (
  <li className="g3SwChip" data-kind={chip.kind}>
    <span>{chip.label}</span><b>{chip.value}</b>{chip.note && <small>{chip.note}</small>}
    {chip.kind === "rule" && <i title="시험 모델이 계산하는 값이 아니라 STEP01 설명 규칙이에요">규칙</i>}
  </li>
);

/** Control SW view: the five parts of a control function, wired to the same models STEP04 runs. */
export function SwPanel({ domain, feature, ready, gearD }: { domain: string; feature: number; ready: boolean; gearD: boolean }) {
  const key = `${domain}:${feature}`;
  const [level, setLevel] = useState(DEFAULT_LEVEL[key] ?? 0);
  const [regen, setRegen] = useState(true);
  const [fanOn, setFanOn] = useState(false);
  useEffect(() => { setLevel(DEFAULT_LEVEL[key] ?? 0); setRegen(true); setFanOn(false); }, [key]);
  const view = useMemo(() => swView(domain, feature, { ready, gearD, level, regen, fanOn }), [domain, feature, ready, gearD, level, regen, fanOn]);
  if (!view || !hasSwView(domain, feature)) return null;
  const onSlide = (value: number) => {
    setLevel(value);
    if (key === "thermal:1") { const t = thermalThresholds(); if (value >= t.on) setFanOn(true); else if (value <= t.off) setFanOn(false); }
  };
  return (
    <section className="g3SwPanel" aria-label="Control SW 입력·설정값·상태·판단·출력">
      <div className="g3SwCols">
        {COLUMNS.map(col => (
          <div key={col.id} className="g3SwCol" data-col={col.id}>
            <h3><b>{col.title}</b> {col.ko}</h3>
            <ul>
              {col.id === "input" && view.sliders.map(slider => (
                <li key={slider.id} className="g3SwSlider">
                  <label>{slider.label} <b>{level}{slider.unit}</b></label>
                  <input type="range" min={slider.min} max={slider.max} step={slider.step} value={level} onChange={event => onSlide(Number(event.target.value))} aria-label={slider.label} />
                </li>
              ))}
              {col.id === "input" && key === "brake:1" && <li><button type="button" className="g3SwToggle" aria-pressed={regen} onClick={() => setRegen(!regen)}>회생 가용량 {regen ? "있음" : "0 (배터리 가득)"}</button></li>}
              {view[col.id].map(chip => <Chip key={chip.label} chip={chip} />)}
            </ul>
          </div>
        ))}
      </div>
      <p className="g3SwNote">{view.note}</p>
    </section>
  );
}
