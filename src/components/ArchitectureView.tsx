"use client";

import { useMemo } from "react";
import type { DGData, DGNode } from "@/lib/types";
import { canonicalRole, laneOf, tierOf, type GraphIndex } from "@/lib/graph";
import { edgePhrase, styleForNode } from "@/lib/style";
import { Mermaid } from "./Mermaid";
import { DiagramPanZoom } from "./DiagramPanZoom";

/** C4-style whole-solution diagram — container lanes rendered with Mermaid+ELK. */

function mmId(id: string): string {
  return "n" + id.replace(/[^a-zA-Z0-9]/g, "_");
}

function esc(s: string): string {
  return s.replace(/"/g, "#quot;");
}

/** Solid pastel: accent blended over the lane background — an alpha fill
 * (`#xxxxxx1a`) would let edges routed behind the card show through it. */
function pastel(hex: string, pct: number, base = "#ffffff"): string {
  const c = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const m = hex.replace("#", "");
  const b = base.replace("#", "");
  const mix = (i: number) => Math.round(c(m, i) * pct + c(b, i) * (1 - pct));
  return `#${[0, 2, 4].map((i) => mix(i).toString(16).padStart(2, "0")).join("")}`;
}

function isTest(n: DGNode): boolean {
  const aspects = (n.metadata?.aspects as string[] | undefined) ?? [];
  return aspects.includes("testing") || /test/i.test(n.stereotype ?? "");
}

function buildMermaid(data: DGData, idx: GraphIndex): string {
  // Architecture altitude: structural story only — no methods/fields/columns,
  // no test scaffolding, dependencies rolled up to one summary per module, and
  // individual endpoints rolled up into their owning contract.
  const endpointHome = new Map<string, string>(); // endpoint id -> contract id
  const opCount = new Map<string, number>(); // contract id -> rolled-up op count
  for (const n of data.nodes) {
    if (n.kind !== "ENDPOINT") continue;
    const contract = (idx.in.get(n.id) ?? []).find(
      (e) => e.kind === "EXPOSES" && idx.byId.get(e.src)?.kind === "CONTRACT",
    )?.src;
    if (contract) {
      endpointHome.set(n.id, contract);
      opCount.set(contract, (opCount.get(contract) ?? 0) + 1);
    }
  }
  // Wire DTOs also roll up — one summary box per lane instead of a row of boxes.
  const isDto = (n: DGNode) => n.kind === "TYPE" && canonicalRole(n.stereotype) === "dto";
  const shown = data.nodes.filter(
    (n) =>
      tierOf(n.kind) <= 3 &&
      n.kind !== "COLUMN" &&
      n.kind !== "DEPENDENCY" &&
      n.kind !== "REQUIREMENT" &&
      !endpointHome.has(n.id) &&
      !isDto(n) &&
      !isTest(n),
  );
  const shownIds = new Set(shown.map((n) => n.id));

  // Only CONTAINERs form lanes — laneOf makes any direct child of the SYSTEM
  // (contracts, requirements) its own lane, which would swallow the node into
  // an empty cluster here.
  const laneFor = (n: DGNode): { key: string; label: string } => {
    if (n.kind === "SYSTEM") return { key: "__system", label: "System" };
    const lane = laneOf(idx, n.id);
    if (lane.key === n.id && n.kind !== "CONTAINER") {
      if (n.kind === "CONTRACT") return { key: "__contracts", label: "Contracts" };
      return { key: "__other", label: "Other" };
    }
    return lane;
  };
  const lanes = new Map<string, { label: string; ids: string[] }>();
  for (const n of shown) {
    const lane = laneFor(n);
    if (!lanes.has(lane.key)) lanes.set(lane.key, { label: lane.label, ids: [] });
    lanes.get(lane.key)!.ids.push(n.id);
  }

  // Roll DEPENDENCY and DTO nodes up into one summary box per lane each.
  const summaries = new Map<string, { icon: string; noun: string; count: number; names: string[] }>();
  const rolledUp = new Map<string, string>(); // node id -> summary node id
  const rollUp = (n: DGNode, prefix: string, icon: string, noun: string) => {
    const lane = laneFor(n);
    const sumId = `${prefix}_${lane.key}`;
    rolledUp.set(n.id, sumId);
    if (!summaries.has(sumId)) {
      summaries.set(sumId, { icon, noun, count: 0, names: [] });
      if (!lanes.has(lane.key)) lanes.set(lane.key, { label: lane.label, ids: [] });
      lanes.get(lane.key)!.ids.push(sumId);
    }
    const s = summaries.get(sumId)!;
    s.count++;
    if (s.names.length < 4) s.names.push(n.name);
  };
  for (const n of data.nodes) {
    if (isTest(n)) continue;
    if (n.kind === "DEPENDENCY") rollUp(n, "deps", "🔗", "frameworks & dependencies");
    else if (isDto(n)) rollUp(n, "dtos", "🔀", "wire DTOs");
  }

  const lines: string[] = ["flowchart TB"];
  const classLines: string[] = [];
  const seenClass = new Set<string>();

  for (const [key, lane] of lanes) {
    lines.push(`  subgraph ${mmId("lane_" + key)}["${esc(lane.label)}"]`);
    for (const id of lane.ids) {
      if (id === key) continue; // the lane container itself is the subgraph
      const sum = summaries.get(id);
      if (sum) {
        lines.push(`    ${mmId(id)}["${sum.icon} ${sum.count} ${sum.noun}<br/>${esc(sum.names.join(", "))}${sum.count > sum.names.length ? "…" : ""}"]`);
        classLines.push(`  class ${mmId(id)} cdeps;`);
        continue;
      }
      const n = idx.byId.get(id)!;
      const ops = opCount.get(id);
      const tag = ops
        ? `contract · ${ops} operations`
        : n.kind === "COMPONENT" || n.kind === "TYPE" ? (n.stereotype ?? n.kind) : n.kind.toLowerCase().replace(/_/g, " ");
      const s = styleForNode(n.kind, n.stereotype);
      lines.push(`    ${mmId(id)}["${s.icon} ${esc(n.name)}<br/>«${esc(tag)}»"]`);
      const cls = "c" + s.color.slice(1);
      if (!seenClass.has(cls)) {
        seenClass.add(cls);
        classLines.push(`  classDef ${cls} fill:${pastel(s.color, 0.12)},stroke:${s.color},color:#1e293b,stroke-width:1.3px,rx:6,ry:6;`);
      }
      classLines.push(`  class ${mmId(id)} ${cls};`);
    }
    lines.push("  end");
    classLines.push(`  style ${mmId("lane_" + key)} fill:#f8f9fd,stroke:#dfe3ee,rx:10,ry:10;`);
  }
  classLines.push("  classDef cdeps fill:#f1f5f9,stroke:#94a3b8,color:#475569,stroke-dasharray:4 3,rx:6,ry:6;");

  // Collapse parallel edges (same endpoints + phrase) into one labeled edge with a count.
  const mapEnd = (id: string): string | null => {
    if (rolledUp.has(id)) return mmId(rolledUp.get(id)!);
    if (endpointHome.has(id)) return mmId(endpointHome.get(id)!);
    if (lanes.has(id)) return mmId("lane_" + id);
    if (shownIds.has(id)) return mmId(id);
    return null;
  };
  const collapsed = new Map<string, { src: string; dst: string; phrase: string; count: number }>();
  for (const e of data.edges) {
    if (e.kind === "CONTAINS") continue;
    const src = mapEnd(e.src);
    const dst = mapEnd(e.dst);
    if (!src || !dst || src === dst) continue;
    const phrase = e.kind === "DEPENDS_ON" ? "depends on" : edgePhrase(e.kind);
    const key = `${src}>${dst}:${phrase}`;
    const cur = collapsed.get(key);
    if (cur) cur.count++;
    else collapsed.set(key, { src, dst, phrase, count: 1 });
  }
  for (const e of collapsed.values()) {
    const label = e.count > 1 ? `${e.phrase} ×${e.count}` : e.phrase;
    lines.push(`  ${e.src} -- "${esc(label)}" --> ${e.dst}`);
  }

  return [...lines, ...classLines].join("\n");
}

export function ArchitectureView({ data, idx }: { data: DGData; idx: GraphIndex }) {
  const code = useMemo(() => buildMermaid(data, idx), [data, idx]);
  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[var(--canvas-bg)]">
      <div className="px-6 pt-4 pb-2 text-[11px] text-[var(--muted)]">
        <span className="font-semibold text-[var(--text)]">Whole solution</span> — the C4-style
        architecture story: containers as lanes, components/contracts/endpoints/tables inside,
        plain-English relationships. Parallel edges are collapsed (&times;N), dependencies rolled up,
        tests hidden at this altitude. <span className="opacity-75">Scroll to zoom · drag to pan · double-click to zoom in.</span>
      </div>
      <DiagramPanZoom fitKey={code}>
        <Mermaid code={code} id={`arch-${data.projectId}`} />
      </DiagramPanZoom>
    </div>
  );
}
