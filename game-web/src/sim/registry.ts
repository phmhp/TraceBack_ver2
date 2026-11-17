// Lookup, validation and inclusion/impact helpers over the component registry.
// Pure functions; the data itself lives in components.ts.
import { COMPONENTS, CONNECTIONS, ECUS } from "./components.ts";
import type { ComponentDef, ComponentRuntimeState, Connection, DomainId, Endpoint, Port, ValidationIssue } from "./types.ts";

const byId = new Map(COMPONENTS.map(component => [component.id, component]));

export const getComponent = (id: string): ComponentDef | undefined => byId.get(id);

export const componentsInDomain = (domainId: DomainId) => COMPONENTS.filter(component => component.domainId === domainId);

export function resolveEndpoint(endpoint: Endpoint): { component: ComponentDef; port: Port } | undefined {
  const [componentId, portId] = endpoint.split(".");
  const component = byId.get(componentId);
  const port = component?.ports.find(item => item.id === portId);
  return component && port ? { component, port } : undefined;
}

/** Connections touching a component, split by direction. */
export function connectionsOf(componentId: string, connections: Connection[] = CONNECTIONS) {
  const owner = (endpoint: Endpoint) => endpoint.split(".")[0];
  return {
    incoming: connections.filter(item => owner(item.to) === componentId),
    outgoing: connections.filter(item => owner(item.from) === componentId),
  };
}

/** Directly connected parts — used for "go to connected component" in the viewer. */
export function neighbors(componentId: string, connections: Connection[] = CONNECTIONS): string[] {
  const { incoming, outgoing } = connectionsOf(componentId, connections);
  const ids = [...incoming.map(item => item.from), ...outgoing.map(item => item.to)].map(endpoint => endpoint.split(".")[0]);
  return [...new Set(ids)];
}

/** Checks IDs, endpoints, port direction, flow type and units. */
export function validateRegistry(components: ComponentDef[] = COMPONENTS, connections: Connection[] = CONNECTIONS): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const component of components) {
    if (seen.has(component.id)) issues.push({ level: "error", message: `중복 부품 ID: ${component.id}` });
    seen.add(component.id);
    const portIds = new Set<string>();
    for (const port of component.ports) {
      if (portIds.has(port.id)) issues.push({ level: "error", message: `중복 포트 ID: ${component.id}.${port.id}` });
      portIds.add(port.id);
    }
    if (component.relatedEcu && !ECUS.some(ecu => ecu.id === component.relatedEcu))
      issues.push({ level: "error", message: `${component.id}의 relatedEcu ${component.relatedEcu} 없음` });
  }
  const local = new Map(components.map(component => [component.id, component]));
  const resolve = (endpoint: Endpoint) => {
    const [componentId, portId] = endpoint.split(".");
    return local.get(componentId)?.ports.find(port => port.id === portId);
  };
  const connectionIds = new Set<string>();
  for (const connection of connections) {
    if (connectionIds.has(connection.id)) issues.push({ level: "error", message: `중복 연결 ID: ${connection.id}` });
    connectionIds.add(connection.id);
    const from = resolve(connection.from), to = resolve(connection.to);
    if (!from) { issues.push({ level: "error", message: `${connection.id}: 출발 포트 ${connection.from} 없음` }); continue; }
    if (!to) { issues.push({ level: "error", message: `${connection.id}: 도착 포트 ${connection.to} 없음` }); continue; }
    if (from.direction !== "out") issues.push({ level: "error", message: `${connection.id}: ${connection.from}는 출력 포트가 아님` });
    if (to.direction !== "in") issues.push({ level: "error", message: `${connection.id}: ${connection.to}는 입력 포트가 아님` });
    if (from.flow !== connection.flow || to.flow !== connection.flow)
      issues.push({ level: "error", message: `${connection.id}: 흐름 종류 불일치 (${from.flow} → ${to.flow}, 선언 ${connection.flow})` });
    if (from.unit !== to.unit) issues.push({ level: "error", message: `${connection.id}: 단위 불일치 (${from.unit} → ${to.unit})` });
  }
  for (const component of components)
    for (const port of component.ports.filter(item => item.direction === "in"))
      if (!connections.some(connection => connection.to === `${component.id}.${port.id}`))
        issues.push({ level: "warning", message: `연결되지 않은 입력 포트: ${component.id}.${port.id}` });
  return issues;
}

export function createRuntimeState(components: ComponentDef[] = COMPONENTS): Record<string, ComponentRuntimeState> {
  return Object.fromEntries(components.map(component => [component.id, { visible: true, selected: false, included: true, connected: true, degraded: false }]));
}

/**
 * Parts that lose an input path when `excluded` parts are removed from the simulation.
 * Simple forward traversal (no redundancy or alternative paths yet — doc PART 9 future work).
 * Feedback connections are followed too, since a lost sensor degrades its controller.
 */
export function affectedByExclusion(excluded: string[], connections: Connection[] = CONNECTIONS): string[] {
  const removed = new Set(excluded);
  const affected = new Set<string>();
  const queue = [...excluded];
  while (queue.length) {
    const current = queue.shift()!;
    for (const connection of connectionsOf(current, connections).outgoing) {
      const target = connection.to.split(".")[0];
      if (removed.has(target) || affected.has(target)) continue;
      affected.add(target);
      queue.push(target);
    }
  }
  return [...affected];
}

/** Applies inclusion changes and marks downstream parts as degraded. Visibility is untouched. */
export function applyInclusion(state: Record<string, ComponentRuntimeState>, excluded: string[]): Record<string, ComponentRuntimeState> {
  const affected = new Set(affectedByExclusion(excluded));
  return Object.fromEntries(Object.entries(state).map(([id, item]) => [id, {
    ...item,
    included: !excluded.includes(id),
    connected: !excluded.includes(id),
    degraded: affected.has(id),
  }]));
}
