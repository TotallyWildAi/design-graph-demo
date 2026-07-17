import type { DGData, DGNode } from "./types";
import type { GraphIndex } from "./graph";
import { canonicalRole, laneOf } from "./graph";

/**
 * Work-unit derivation — DEMO MOCK. The real product plans work units on the
 * backend (/api/design-graphs/{id}/work-units); here we derive a plausible
 * wave-ordered build plan from the graph itself so any project works.
 */

export type UnitStatus = "done" | "in-progress" | "todo";

export interface WorkUnit {
  id: string;
  title: string;
  summary: string;
  wave: number;
  status: UnitStatus;
  module: string;
  nodeIds: string[];
}

export interface WorkUnitPlan {
  units: WorkUnit[];
  uncoveredRequirements: DGNode[];
  notes: string;
}

/** Deterministic tiny hash for stable mock statuses. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Earlier waves are further along — reads like a project mid-flight. */
function statusFor(wave: number, id: string): UnitStatus {
  if (wave <= 2) return "done";
  if (wave === 3) return hash(id) % 3 === 0 ? "in-progress" : "done";
  if (wave === 4) return hash(id) % 2 === 0 ? "in-progress" : "todo";
  return "todo";
}

function isTest(n: DGNode): boolean {
  const aspects = (n.metadata?.aspects as string[] | undefined) ?? [];
  return aspects.includes("testing") || /test/i.test(n.stereotype ?? "");
}

/** CALLS/PERSISTS_TO closure downward from a node (the unit's slice). */
function slice(idx: GraphIndex, rootId: string): string[] {
  const out = [rootId];
  const seen = new Set(out);
  const walk = (id: string) => {
    for (const e of idx.out.get(id) ?? []) {
      if (!["CALLS", "PERSISTS_TO"].includes(e.kind) || seen.has(e.dst)) continue;
      seen.add(e.dst);
      out.push(e.dst);
      walk(e.dst);
    }
  };
  walk(rootId);
  return out;
}

export function deriveWorkUnits(d: DGData, idx: GraphIndex): WorkUnitPlan {
  const units: WorkUnit[] = [];
  let seq = 0;
  const add = (wave: number, title: string, summary: string, module: string, nodeIds: string[]) => {
    const id = `WU-${++seq}`;
    units.push({ id, title, summary, wave, status: statusFor(wave, title), module, nodeIds });
  };

  const prod = d.nodes.filter((n) => !isTest(n));
  const byRole = (kind: string, role: string) =>
    prod.filter((n) => n.kind === kind && canonicalRole(n.stereotype) === role);
  const lane = (n: DGNode) => laneOf(idx, n.id).label;

  // Wave 1 — contracts + schema
  for (const c of prod.filter((n) => n.kind === "CONTRACT")) {
    const eps = (idx.out.get(c.id) ?? []).filter((e) => e.kind === "EXPOSES").map((e) => e.dst);
    add(1, `Contract: ${c.name}`, `Author the wire contract and generate server/client stubs (${eps.length} operations).`, "Contracts", [c.id, ...eps]);
  }
  for (const t of prod.filter((n) => n.kind === "TABLE")) {
    const migs = (idx.in.get(t.id) ?? []).filter((e) => e.kind === "EVOLVES").map((e) => e.src);
    add(1, `Schema: ${t.name}`, `Create the \`${t.name}\` table${migs.length ? " via migration" : ""}, columns + constraints.`, lane(t), [t.id, ...migs]);
  }

  // Wave 2 — domain + persistence
  const domains = prod.filter((n) => (n.kind === "TYPE" || n.kind === "COMPONENT") && canonicalRole(n.stereotype) === "domain");
  if (domains.length) {
    add(2, "Domain model", `Model the core domain objects: ${domains.map((n) => n.name).slice(0, 6).join(", ")}.`, lane(domains[0]), domains.map((n) => n.id));
  }
  for (const r of [...byRole("COMPONENT", "repository"), ...byRole("TYPE", "repository")]) {
    add(2, `Persistence: ${r.name}`, `Implement ${r.name} against the schema.`, lane(r), slice(idx, r.id));
  }

  // Wave 3 — services + HTTP + security
  for (const s of [...byRole("COMPONENT", "service"), ...byRole("TYPE", "service")]) {
    add(3, `Service: ${s.name}`, `Business rules and orchestration in ${s.name}.`, lane(s), slice(idx, s.id));
  }
  for (const c of [...byRole("COMPONENT", "controller"), ...byRole("TYPE", "controller")]) {
    const eps = (idx.out.get(c.id) ?? []).filter((e) => e.kind === "EXPOSES").map((e) => e.dst);
    add(3, `HTTP: ${c.name}`, `Wire ${c.name} to the contract (${eps.length || "its"} endpoints), request validation + error mapping.`, lane(c), [...slice(idx, c.id), ...eps]);
  }
  const security = prod.filter((n) => ["security", "filter"].includes(canonicalRole(n.stereotype)) || (n.metadata?.aspects as string[] | undefined)?.includes("security"));
  if (security.length) {
    add(3, "Security & auth", `JWT issuing/validation and route protection: ${security.map((n) => n.name).slice(0, 5).join(", ")}.`, lane(security[0]), security.map((n) => n.id));
  }

  // Wave 4 — frontend
  const gateways = prod.filter((n) => n.kind === "COMPONENT" && canonicalRole(n.stereotype) === "gateway");
  for (const g of gateways) {
    add(4, `API client: ${g.name}`, `Typed client generated from the contract; error + auth handling.`, lane(g), slice(idx, g.id));
  }
  const ui = prod.filter((n) => n.kind === "COMPONENT" && canonicalRole(n.stereotype) === "ui-component" && laneOf(idx, n.id).label.toLowerCase().includes("front"));
  if (ui.length) {
    add(4, "Frontend UI", `Screens, forms and stores: ${ui.map((n) => n.name).slice(0, 6).join(", ")}${ui.length > 6 ? "…" : ""}.`, lane(ui[0]), ui.map((n) => n.id));
  }

  // Wave 5 — deployment
  const deploy = prod.filter((n) => ["DOCKER_IMAGE", "DEPLOYABLE_ARTIFACT", "ENVIRONMENT"].includes(n.kind) || n.name.includes("compose"));
  if (deploy.length) {
    add(5, "Deployment", "Images, compose wiring, one-command local run.", "deployment", deploy.map((n) => n.id));
  }

  const uncoveredRequirements = d.nodes.filter(
    (n) => n.kind === "REQUIREMENT" && !(idx.in.get(n.id) ?? []).some((e) => e.kind === "IMPLEMENTS"),
  );

  return {
    units,
    uncoveredRequirements,
    notes:
      "Demo plan derived from the design graph — the full product plans work units on the backend and joins live board status.",
  };
}
