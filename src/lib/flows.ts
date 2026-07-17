import type { DGData, DGNode } from "./types";
import type { GraphIndex } from "./graph";
import { laneOf } from "./graph";

/**
 * Sequence + requirement-trace derivation, ported from the product's model.ts
 * (deriveSequences / traceRequirement) and generalised to work at either
 * granularity: METHOD-level CALLS chains (notes-app fixture) or
 * COMPONENT-level chains (Timeline Manager fixture).
 */

export function mermaidId(s: string): string {
  return s.replace(/[^A-Za-z0-9_]/g, "_");
}

/** The owning participant name — the TYPE/COMPONENT that CONTAINS the node, else itself. */
export function ownerName(id: string, idx: GraphIndex): string {
  for (const e of idx.in.get(id) ?? []) {
    if (e.kind !== "CONTAINS") continue;
    const parent = idx.byId.get(e.src);
    if (parent && (parent.kind === "TYPE" || parent.kind === "COMPONENT")) return parent.name;
  }
  return idx.byId.get(id)?.name ?? id;
}

function isTestNode(n?: DGNode | null): boolean {
  if (!n) return false;
  const aspects = (n.metadata?.aspects as string[] | undefined) ?? [];
  if (aspects.includes("testing")) return true;
  return /test/i.test(n.stereotype ?? "");
}

export function httpLabel(idx: GraphIndex, epId: string): string {
  const ep = idx.byId.get(epId);
  const md = ep?.metadata ?? {};
  const verb = typeof md.httpMethod === "string" ? md.httpMethod : "";
  const path = typeof md.path === "string" ? md.path : (ep?.name ?? epId);
  return `${verb} ${path}`.trim();
}

const callsOut = (idx: GraphIndex, id: string) =>
  (idx.out.get(id) ?? []).filter((e) => e.kind === "CALLS" && !isTestNode(idx.byId.get(e.dst)));
const callsIn = (idx: GraphIndex, id: string) =>
  (idx.in.get(id) ?? []).filter((e) => e.kind === "CALLS" && !isTestNode(idx.byId.get(e.src)));

/** Tables a node (or its CONTAINS owner) persists to. */
function persistsTo(idx: GraphIndex, id: string): string[] {
  const owner = (idx.in.get(id) ?? []).find(
    (e) => e.kind === "CONTAINS" && ["TYPE", "COMPONENT"].includes(idx.byId.get(e.src)?.kind ?? ""),
  )?.src;
  const srcs = [id, ...(owner ? [owner] : [])];
  const out: string[] = [];
  for (const s of srcs)
    for (const e of idx.out.get(s) ?? [])
      if (e.kind === "PERSISTS_TO") out.push(e.dst);
  return out;
}

// ── Sequences ────────────────────────────────────────────────────────────────

export interface Sequence {
  key: string;
  title: string;
  subtitle?: string;
  mermaid: string;
}

/** One Mermaid sequenceDiagram per flow root — an ENDPOINT (walked across the
 * HTTP boundary: UI client → endpoint → handler → … → table) or a bare
 * CALLS-chain root that doesn't serve an endpoint. */
export function deriveSequences(d: DGData, idx: GraphIndex): Sequence[] {
  const sequences: Sequence[] = [];

  function makeSeq(key: string, title: string, subtitle: string | undefined, build: (api: SeqApi) => void): void {
    const msgs: string[] = [];
    const order: string[] = [];
    const pid = new Map<string, string>();
    const participant = (name: string): string => {
      let id = pid.get(name);
      if (!id) {
        id = `p${pid.size}_${mermaidId(name)}`;
        pid.set(name, id);
        order.push(name);
      }
      return id;
    };
    const visited = new Set<string>();
    const walk = (callerId: string, callerName?: string) => {
      if (visited.has(callerId)) return;
      visited.add(callerId);
      const caller = participant(callerName ?? ownerName(callerId, idx));
      // DB hop for the caller itself (component-level chains end at repos)
      for (const t of persistsTo(idx, callerId)) {
        const tableP = participant(idx.byId.get(t)?.name ?? t);
        msgs.push(`  ${caller}->>${tableP}: persist / read`);
        msgs.push(`  ${tableP}-->>${caller}: rows`);
      }
      for (const e of callsOut(idx, callerId)) {
        const callee = idx.byId.get(e.dst);
        if (!callee) continue;
        const calleeName = ownerName(callee.id, idx);
        const calleeP = participant(calleeName);
        const label = callee.kind === "METHOD" ? `${callee.name}()` : `call ${callee.name}`;
        msgs.push(`  ${caller}->>${calleeP}: ${label}`);
        walk(callee.id);
        const ret = String(callee.metadata?.returnType ?? "");
        if (ret && ret !== "void") msgs.push(`  ${calleeP}-->>${caller}: ${ret}`);
      }
    };
    build({ participant, msgs, walk });
    if (msgs.length === 0) return;
    const safeLabel = (n: string) => n.replace(/[:#]/g, " ").trim() || "unit";
    const header = ["sequenceDiagram", "  autonumber",
      ...order.map((n) => `  participant ${pid.get(n)} as ${safeLabel(n)}`)];
    sequences.push({ key, title, subtitle, mermaid: [...header, ...msgs].join("\n") });
  }
  interface SeqApi {
    participant: (name: string) => string;
    msgs: string[];
    walk: (id: string, name?: string) => void;
  }

  // 1) Endpoint flows: UI consumer → HTTP endpoint → exposing handler → … → table.
  const endpoints = d.nodes.filter((n) => n.kind === "ENDPOINT");
  for (const ep of endpoints) {
    const consumer = (idx.in.get(ep.id) ?? []).find((e) => e.kind === "CONSUMES")?.src;
    const handlers = (idx.in.get(ep.id) ?? [])
      .filter((e) => e.kind === "EXPOSES" && ["COMPONENT", "METHOD"].includes(idx.byId.get(e.src)?.kind ?? ""))
      .map((e) => e.src);
    if (!consumer && handlers.length === 0) continue;
    const http = httpLabel(idx, ep.id);
    makeSeq(ep.id, http, ep.name, ({ participant, msgs, walk }) => {
      const cP = consumer ? participant(ownerName(consumer, idx)) : null;
      const epP = participant(http);
      if (cP) msgs.push(`  ${cP}->>${epP}: ${http}`);
      for (const h of handlers) {
        const hP = participant(ownerName(h, idx));
        msgs.push(`  ${epP}->>${hP}: handle ${http}`);
        walk(h);
      }
    });
  }

  // 2) Bare flow roots that don't serve an endpoint (UI entry chains, filters…).
  const servesEndpoint = (id: string) =>
    (idx.out.get(id) ?? []).some((e) => e.kind === "EXPOSES" && idx.byId.get(e.dst)?.kind === "ENDPOINT");
  const roots = d.nodes.filter(
    (n) =>
      ["METHOD", "COMPONENT"].includes(n.kind) &&
      !isTestNode(n) &&
      callsOut(idx, n.id).length > 0 &&
      callsIn(idx, n.id).length === 0 &&
      !servesEndpoint(n.id),
  );
  for (const root of roots) {
    const owner = ownerName(root.id, idx);
    const title = root.kind === "METHOD" ? `${owner}.${root.name}()` : root.name;
    makeSeq(root.id, title, laneOf(idx, root.id).label, ({ walk }) => walk(root.id));
  }
  return sequences;
}

// ── Requirement tracing ──────────────────────────────────────────────────────

export interface RequirementCoverage {
  node: DGNode;
  implementerCount: number;
}

export function requirementCoverage(d: DGData, idx: GraphIndex): RequirementCoverage[] {
  return d.nodes
    .filter((n) => n.kind === "REQUIREMENT")
    .map((node) => ({
      node,
      implementerCount: (idx.in.get(node.id) ?? []).filter((e) => e.kind === "IMPLEMENTS").length,
    }))
    .sort((a, b) => a.node.id.localeCompare(b.node.id, undefined, { numeric: true }));
}

export interface TraceStep {
  order: number;
  text: string;
}

export interface RequirementTrace {
  reqId: string;
  reqName: string;
  steps: TraceStep[];
  /** Ordered chain of node ids for the flowchart. */
  chain: Array<{ from: string; to: string; kind: string }>;
  implementers: Array<{ node: DGNode; module: string }>;
  untraced: boolean;
}

/** The production call-chain that satisfies a requirement: for each non-test
 * implementer, cross the HTTP boundary (consumer → endpoint → handler) when the
 * implementer is an ENDPOINT, then follow CALLS down to PERSISTS_TO leaves. */
export function traceRequirement(idx: GraphIndex, reqId: string): RequirementTrace {
  const req = idx.byId.get(reqId);
  const implementers = (idx.in.get(reqId) ?? [])
    .filter((e) => e.kind === "IMPLEMENTS")
    .map((e) => idx.byId.get(e.src))
    .filter((n): n is DGNode => !!n)
    .map((node) => ({ node, module: laneOf(idx, node.id).label }));

  const steps: TraceStep[] = [];
  const chain: RequirementTrace["chain"] = [];
  const seenEdge = new Set<string>();
  let n = 0;
  const name = (id: string) => idx.byId.get(id)?.name ?? id;

  const step = (from: string, to: string, kind: string, text: string) => {
    const key = `${from}>${to}:${kind}`;
    if (seenEdge.has(key)) return false;
    seenEdge.add(key);
    steps.push({ order: ++n, text });
    chain.push({ from, to, kind });
    return true;
  };

  const walk = (fromId: string) => {
    for (const t of persistsTo(idx, fromId)) {
      step(fromId, t, "PERSISTS_TO", `${name(fromId)} persists to \`${name(t)}\``);
    }
    for (const e of callsOut(idx, fromId)) {
      if (step(fromId, e.dst, "CALLS", `${name(fromId)} → ${name(e.dst)}`)) walk(e.dst);
    }
  };

  for (const { node } of implementers.filter((i) => !isTestNode(i.node))) {
    if (node.kind === "ENDPOINT") {
      const http = httpLabel(idx, node.id);
      const consumer = (idx.in.get(node.id) ?? []).find((e) => e.kind === "CONSUMES")?.src;
      if (consumer) step(consumer, node.id, "CONSUMES", `${name(consumer)} calls \`${http}\``);
      const handlers = (idx.in.get(node.id) ?? [])
        .filter((e) => e.kind === "EXPOSES" && ["COMPONENT", "METHOD"].includes(idx.byId.get(e.src)?.kind ?? ""))
        .map((e) => e.src);
      for (const h of handlers) {
        step(node.id, h, "EXPOSES", `\`${http}\` is handled by ${name(h)}`);
        walk(h);
      }
      if (handlers.length === 0) walk(node.id);
    } else {
      for (const e of idx.out.get(node.id) ?? []) {
        if (e.kind === "SECURES") step(node.id, e.dst, "SECURES", `${name(node.id)} secures ${name(e.dst)}`);
      }
      walk(node.id);
    }
  }

  return {
    reqId,
    reqName: req?.name ?? reqId,
    steps,
    chain,
    implementers,
    untraced: steps.length === 0,
  };
}

/** Mermaid flowchart for a requirement trace chain. */
export function traceChart(idx: GraphIndex, trace: RequirementTrace): string {
  if (trace.chain.length === 0) return "";
  const lines = ["flowchart LR"];
  const declared = new Set<string>();
  const declare = (id: string) => {
    if (declared.has(id)) return;
    declared.add(id);
    const node = idx.byId.get(id);
    const label = node?.kind === "ENDPOINT" ? httpLabel(idx, id) : (node?.name ?? id);
    lines.push(`  ${mermaidId(id)}["${label.replace(/"/g, "#quot;")}"]`);
  };
  const arrow: Record<string, string> = {
    CONSUMES: "calls", EXPOSES: "handled by", CALLS: "calls", PERSISTS_TO: "persists to", SECURES: "secures",
  };
  for (const c of trace.chain) {
    declare(c.from);
    declare(c.to);
    lines.push(`  ${mermaidId(c.from)} -- "${arrow[c.kind] ?? c.kind.toLowerCase()}" --> ${mermaidId(c.to)}`);
  }
  return lines.join("\n");
}
