import type { DGData, DGEdge, DGNode } from "./types";

export interface GraphIndex {
  byId: Map<string, DGNode>;
  out: Map<string, DGEdge[]>;
  in: Map<string, DGEdge[]>;
}

export function buildIndex(d: DGData): GraphIndex {
  const byId = new Map<string, DGNode>();
  const out = new Map<string, DGEdge[]>();
  const inn = new Map<string, DGEdge[]>();
  for (const n of d.nodes) byId.set(n.id, n);
  for (const e of d.edges) {
    if (!out.has(e.src)) out.set(e.src, []);
    out.get(e.src)!.push(e);
    if (!inn.has(e.dst)) inn.set(e.dst, []);
    inn.get(e.dst)!.push(e);
  }
  return { byId, out, in: inn };
}

export function containsParent(idx: GraphIndex, id: string): string | undefined {
  return (idx.in.get(id) ?? []).find((e) => e.kind === "CONTAINS")?.src;
}

/** Top-level CONTAINER lane a node lives under (climbing CONTAINS to the system). */
export function laneOf(idx: GraphIndex, id: string): { key: string; label: string } {
  const n = idx.byId.get(id);
  if (!n) return { key: "__other", label: "Other" };
  if (n.kind === "SYSTEM") return { key: "__system", label: "System" };
  let cur: string | undefined = id;
  const guard = new Set<string>();
  while (cur && !guard.has(cur)) {
    guard.add(cur);
    const p = containsParent(idx, cur);
    if (p === undefined) break;
    if (idx.byId.get(p)?.kind === "SYSTEM") {
      const c = idx.byId.get(cur);
      return { key: cur, label: c?.name ?? cur };
    }
    cur = p;
  }
  if (n.kind === "EXTERNAL_SYSTEM") return { key: "__external", label: "External systems" };
  if (n.kind === "REQUIREMENT") return { key: "__requirements", label: "Requirements" };
  if (n.kind === "CONTRACT" || n.kind === "ENDPOINT") return { key: "__contracts", label: "Contracts" };
  return { key: "__other", label: "Other" };
}

/** Canonical role for free-text stereotypes so facets collapse across spellings. */
export function canonicalRole(stereotype?: string): string {
  const n = (stereotype ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!n) return "";
  if (/test|spec|fixture|mock|pact/.test(n)) return "test";
  if (/react|tsx|jsx|store/.test(n) || n === "component" || n.endsWith("component")) return "ui-component";
  if (/controller|restcontroller|resource/.test(n)) return "controller";
  if (/repository|dao/.test(n)) return "repository";
  if (/mapper/.test(n)) return "mapper";
  if (/gateway|client/.test(n)) return "gateway";
  if (/dto|datatransferobject|request|response|payload/.test(n)) return "dto";
  if (/config|springbootapplication|bootstrap/.test(n)) return "config";
  if (/service|usecase|interactor/.test(n)) return "service";
  if (/aggregate|entity|valueobject|^domain$|model|record|enum/.test(n)) return "domain";
  if (/interface|port/.test(n)) return "interface";
  if (/filter|interceptor|advice/.test(n)) return "filter";
  if (/security|principal|^auth|jwt/.test(n)) return "security";
  if (/util|helper|support/.test(n)) return "utility";
  return n;
}

/** Filter facet — COMPONENT/TYPE split by canonical role, other kinds are themselves. */
export function facetOf(n: { kind: string; stereotype?: string }): string {
  if (n.kind === "COMPONENT") {
    const r = canonicalRole(n.stereotype);
    return r ? `COMPONENT:${r}` : "COMPONENT";
  }
  if (n.kind === "TYPE") {
    const r = canonicalRole(n.stereotype);
    return r ? `TYPE:${r}` : "TYPE";
  }
  return n.kind;
}

/** C4-style vertical tier for the layered layout. */
const KIND_TIER: Record<string, number> = {
  SYSTEM: 0,
  CONTAINER: 1,
  EXTERNAL_SYSTEM: 1,
  REQUIREMENT: 1,
  ENVIRONMENT: 1,
  CONTRACT: 2,
  COMPONENT: 2,
  DEPLOYABLE_ARTIFACT: 2,
  ENDPOINT: 3,
  TYPE: 3,
  TABLE: 3,
  CONFIG: 3,
  MIGRATION: 3,
  DEPENDENCY: 3,
  DOCKER_IMAGE: 3,
  TOPIC: 3,
  CACHE: 3,
  METHOD: 4,
  FIELD: 4,
  COLUMN: 4,
};

export function tierOf(kind: string): number {
  return KIND_TIER[kind] ?? 3;
}

/** All aspects a node is about — backend-authoritative when present, else derived. */
export function nodeAspects(idx: GraphIndex, n: DGNode): string[] {
  const meta = (n.metadata?.aspects as string[] | undefined) ?? undefined;
  if (meta && meta.length) return meta;
  const out = new Set<string>();
  const name = `${n.name} ${n.stereotype ?? ""}`.toLowerCase();
  const lane = laneOf(idx, n.id).label.toLowerCase();
  switch (n.kind) {
    case "SYSTEM": out.add("system"); break;
    case "REQUIREMENT": out.add("requirement"); break;
    case "CONTRACT": out.add("contract"); out.add("api"); break;
    case "ENDPOINT": out.add("api"); out.add("backend"); break;
    case "TABLE": case "COLUMN": out.add("database"); out.add("data"); out.add("persistence"); break;
    case "MIGRATION": out.add("database"); out.add("persistence"); break;
    case "CONFIG": out.add("config"); break;
    case "DEPENDENCY": out.add("build"); break;
    case "DOCKER_IMAGE": case "DEPLOYABLE_ARTIFACT": case "ENVIRONMENT": out.add("deployment"); out.add("infrastructure"); break;
    case "EXTERNAL_SYSTEM": out.add("external"); out.add("integration"); break;
  }
  if (/front|ui|react|tsx|web/.test(lane) || /react|tsx|component|store|form|list|page/.test(name)) {
    if (n.kind !== "SYSTEM" && n.kind !== "TABLE" && n.kind !== "COLUMN") { out.add("frontend"); out.add("ui"); }
  }
  if (/backend|api|server/.test(lane) && !out.has("frontend") && (n.kind === "COMPONENT" || n.kind === "TYPE" || n.kind === "METHOD")) {
    out.add("backend");
  }
  if (/db|database|postgres/.test(lane)) { out.add("database"); out.add("data"); }
  if (/deploy|docker|compose|image|infra/.test(lane + " " + name)) { out.add("deployment"); }
  if (/security|jwt|auth|token|filterchain/.test(name)) { out.add("security"); out.add("auth"); }
  if (/test|spec|it$|fixture/.test(name)) out.add("testing");
  const role = canonicalRole(n.stereotype);
  if (role === "test") out.add("testing");
  if (role === "controller" || role === "service") { out.add("backend"); out.add("application"); }
  if (role === "domain") { out.add("domain"); out.add("backend"); }
  if (role === "repository") { out.add("persistence"); out.add("backend"); }
  if (role === "dto") out.add("api");
  if (role === "security") { out.add("security"); out.add("auth"); }
  if (out.size === 0) out.add("backend");
  return [...out];
}

export interface FilterState {
  hiddenFacets: Set<string>;
  aspects: Set<string>;       // empty = all
  modules: Set<string>;       // empty = all (lane keys)
  testMode: "both" | "only" | "hide";
  presetKinds?: Set<string>;  // preset kind allow-list (High-level view)
}

export function visibleNodes(d: DGData, idx: GraphIndex, f: FilterState): DGNode[] {
  return d.nodes.filter((n) => {
    if (f.presetKinds && !f.presetKinds.has(n.kind)) return false;
    if (f.hiddenFacets.has(facetOf(n))) return false;
    const aspects = nodeAspects(idx, n);
    const isTest = aspects.includes("testing");
    if (f.testMode === "hide" && isTest) return false;
    if (f.testMode === "only" && !isTest && n.kind !== "SYSTEM" && n.kind !== "CONTAINER") return false;
    if (f.aspects.size > 0 && !aspects.some((a) => f.aspects.has(a)) && n.kind !== "SYSTEM") return false;
    if (f.modules.size > 0) {
      const lane = laneOf(idx, n.id).key;
      if (!f.modules.has(lane) && n.kind !== "SYSTEM") return false;
    }
    return true;
  });
}

export function visibleEdges(d: DGData, visible: Set<string>): DGEdge[] {
  return d.edges.filter((e) => visible.has(e.src) && visible.has(e.dst));
}
