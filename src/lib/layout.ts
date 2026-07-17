import dagre from "@dagrejs/dagre";
import type { DGEdge, DGNode } from "./types";
import { tierOf } from "./graph";

export interface Positioned {
  id: string;
  x: number;
  y: number;
}

const NODE_W = 190;
const NODE_H = 56;
const COL_GAP = 24;
const ROW_GAP = 34;
const TIER_GAP = 110;
const MAX_PER_ROW = 12;

/**
 * Layered layout: dagre orders nodes horizontally along the structural edges,
 * then nodes are banded vertically by C4 tier (System → Containers →
 * Components/Contracts → Types/Endpoints/Tables → leaves). Wide tiers wrap
 * into multiple rows, preserving dagre's left-to-right affinity so related
 * nodes stay near each other.
 */
export function layout(nodes: DGNode[], edges: DGEdge[]): Map<string, Positioned> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 26, ranksep: 70, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));
  const present = new Set(nodes.map((n) => n.id));
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  const structural = edges.filter(
    (e) => present.has(e.src) && present.has(e.dst) &&
      ["CONTAINS", "EXPOSES", "PERSISTS_TO", "PACKAGES", "DEPLOYS_TO", "CALLS"].includes(e.kind),
  );
  for (const e of structural) g.setEdge(e.src, e.dst);
  dagre.layout(g);

  // Band by tier, wrapping wide tiers into rows ordered by dagre x.
  const byTier = new Map<number, DGNode[]>();
  for (const n of nodes) {
    const t = tierOf(n.kind);
    if (!byTier.has(t)) byTier.set(t, []);
    byTier.get(t)!.push(n);
  }
  const tiers = [...byTier.keys()].sort((a, b) => a - b);

  const out = new Map<string, Positioned>();
  let yCursor = 0;
  for (const t of tiers) {
    const arr = byTier.get(t)!;
    arr.sort((a, b) => (g.node(a.id)?.x ?? 0) - (g.node(b.id)?.x ?? 0));
    const perRow = Math.min(MAX_PER_ROW, Math.max(1, Math.ceil(Math.sqrt(arr.length * 3))));
    const rows = Math.ceil(arr.length / perRow);
    for (let i = 0; i < arr.length; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const rowCount = Math.min(perRow, arr.length - row * perRow);
      // centre each row around x = 0
      const x = (col - (rowCount - 1) / 2) * (NODE_W + COL_GAP);
      const y = yCursor + row * (NODE_H + ROW_GAP);
      out.set(arr[i].id, { id: arr[i].id, x, y });
    }
    yCursor += rows * (NODE_H + ROW_GAP) + TIER_GAP;
  }
  return out;
}
