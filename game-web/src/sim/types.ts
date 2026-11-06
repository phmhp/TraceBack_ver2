// Shared vehicle-system data model.
// 3D models and simulation logic stay independent and meet only through IDs
// (componentId, portId, modelAssetId). See docs/REFACTOR_GAP_ANALYSIS.md §5.

export type DomainId = "drive" | "brake" | "steer" | "gear" | "power" | "thermal" | "suspension" | "driver";

/** Physical flows and data flows are drawn and validated differently. */
export type FlowType =
  | "electrical_power"
  | "mechanical_torque"
  | "rotational_speed"
  | "hydraulic_pressure"
  | "thermal"
  | "digital"
  | "analog"
  | "can_message";

/** Role in the system. One part may have several roles (e.g. motor = actuator + energy conversion). */
export type ComponentCategory =
  | "driver_input"
  | "sensor"
  | "controller"
  | "actuator"
  | "passive_mechanical"
  | "energy"
  | "power_conversion"
  | "network";

export type PortDirection = "in" | "out";

export type Port = {
  id: string;
  direction: PortDirection;
  flow: FlowType;
  unit: string;
  /** Signal name carried on the port, e.g. APP_Position. */
  signal?: string;
  description?: string;
};

/**
 * "sourced": a public 3D asset with a recorded license is used.
 * "educational_simplified": no licensed asset yet; must be labelled on screen.
 */
export type ModelFidelity = "sourced" | "educational_simplified";

export type AnimationDef = {
  type: "spin" | "travel" | "press" | "rotate";
  /** Runtime value that drives the animation, as `componentId.portId` or a physical state key. */
  driver: string;
  /** Mesh node name inside the asset, filled in once an asset is sourced. */
  node?: string;
};

export type ComponentDef = {
  id: string;
  name: string;
  nameKo: string;
  domainId: DomainId;
  categories: ComponentCategory[];
  modelAssetId: string;
  modelFidelity: ModelFidelity;
  ports: Port[];
  relatedEcu?: string;
  animation?: AnimationDef;
};

/** Endpoint written as `componentId.portId`. */
export type Endpoint = `${string}.${string}`;

export type Connection = {
  id: string;
  from: Endpoint;
  to: Endpoint;
  flow: FlowType;
  /** Feedback paths go from plant/sensor back to a controller. */
  feedback?: boolean;
};

export type EcuDef = {
  id: string;
  name: string;
  functions: string[];
  /** Interfaces in common, non-OEM terms. */
  interfaces: ("CAN" | "LIN" | "Ethernet" | "Analog I/O" | "Digital I/O" | "PWM")[];
  sensors: string[];
  actuators: string[];
};

/** Visibility / selection / inclusion are tracked separately (doc PART 9). */
export type ComponentRuntimeState = {
  visible: boolean;
  selected: boolean;
  included: boolean;
  connected: boolean;
  /** Set when an upstream dependency is excluded. */
  degraded: boolean;
};

export type ValidationIssue = { level: "error" | "warning"; message: string };
