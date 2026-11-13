// E/E view: every hop between two nodes of a feature's chain, taken from the real signal registry
// (src/sim/components.ts). A hop that the registry does not contain is marked "structure" (explanatory only) —
// it is never shown as if it were a registry signal.
import { CONNECTIONS } from "../../sim/components.ts";
import { resolveEndpoint } from "../../sim/registry.ts";
import type { FlowType } from "../../sim/types.ts";

export type EeHop = {
  signal: string; // e.g. APP_Position
  unit: string; // e.g. %
  logical: string; // what the value is (logical signal)
  physical: string; // how it is carried (physical connection)
  sender: string;
  receiver: string;
  source: "registry" | "structure";
  ref?: string; // registry connection id
  feedback?: boolean;
};

const LOGICAL: Record<FlowType, string> = {
  analog: "아날로그 신호", digital: "디지털 신호", can_message: "CAN 메시지 신호", electrical_power: "전력", mechanical_torque: "기계 토크",
  rotational_speed: "회전 속도", hydraulic_pressure: "유압", thermal: "열",
};
const PHYSICAL: Record<FlowType, string> = {
  analog: "아날로그 배선", digital: "디지털 배선(PWM·논리)", can_message: "CAN 버스", electrical_power: "고전압 전력선", mechanical_torque: "기계 연결(축·기어)",
  rotational_speed: "회전축", hydraulic_pressure: "유압 라인", thermal: "열 전달",
};
const MECH_NAME: Partial<Record<FlowType, string>> = { mechanical_torque: "구동 토크", electrical_power: "3상 전력", rotational_speed: "회전 속도", hydraulic_pressure: "유압" };

function fromRegistry(id: string, over: { sender?: string; receiver?: string } = {}): EeHop {
  const connection = CONNECTIONS.find(item => item.id === id);
  if (!connection) throw new Error(`unknown registry connection ${id}`);
  const from = resolveEndpoint(connection.from), to = resolveEndpoint(connection.to);
  if (!from || !to) throw new Error(`unresolved endpoint in ${id}`);
  const signal = from.port.signal ?? to.port.signal ?? MECH_NAME[connection.flow] ?? connection.flow;
  return {
    signal, unit: from.port.unit, logical: LOGICAL[connection.flow], physical: PHYSICAL[connection.flow],
    sender: over.sender ?? from.component.nameKo, receiver: over.receiver ?? to.component.nameKo, source: "registry", ref: id, feedback: connection.feedback,
  };
}
const structure = (signal: string, unit: string, flow: FlowType, sender: string, receiver: string): EeHop =>
  ({ signal, unit, logical: LOGICAL[flow], physical: PHYSICAL[flow], sender, receiver, source: "structure" });

/** hop[i] = the link between chain node i and node i+1 of getFeatureLayer(domain, feature, 1); undefined = not documented. */
export const EE_LINKS: Record<string, (EeHop | undefined)[]> = {
  "drive:0": [
    fromRegistry("drv.app"),
    fromRegistry("prop.torque_req", { receiver: "CAN 버스" }),
    fromRegistry("prop.torque_req", { sender: "CAN 버스" }),
    fromRegistry("prop.gate"),
    fromRegistry("prop.phase"),
    fromRegistry("prop.motor_shaft"),
    fromRegistry("prop.gear_out"),
    fromRegistry("prop.diff_out"),
    fromRegistry("prop.shaft_wheel"),
  ],
  "drive:1": [
    fromRegistry("drv.gear"),
    structure("Drive_Permit", "bool", "can_message", "VCU 인터록", "CAN 버스"),
    undefined,
  ],
  "thermal:1": [fromRegistry("thm.fan_pwm"), fromRegistry("fb.fan_speed")],
};

export const eeHops = (domain: string, feature: number) => EE_LINKS[`${domain}:${feature}`];
