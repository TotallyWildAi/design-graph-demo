"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow, Background, Controls,
  type Edge as RFEdge, type Node as RFNode, MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DGData, DGEdge, DGNode } from "@/lib/types";
import { type FilterState, type GraphIndex, visibleNodes } from "@/lib/graph";
import { layout } from "@/lib/layout";
import { edgeColor, edgePhrase } from "@/lib/style";
import { DigNode } from "./DigNode";

// memo: only re-render a card when its own data/position actually changed —
// without this every hover tick re-renders all ~100 cards (visible flicker).
const nodeTypes = { dig: memo(DigNode) };

interface Props {
  data: DGData;
  idx: GraphIndex;
  filters: FilterState;
  selectedId: string | null;
  /** Node whose neighbourhood is spotlit (others dimmed) — only set on user click. */
  spotlightId: string | null;
  onSelect: (id: string | null) => void;
}

export function GraphCanvas({ data, idx, filters, selectedId, spotlightId, onSelect }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Debounced hover: crossing the gap between two cards fires leave→enter;
  // clearing immediately would un-dim and re-dim the whole canvas (flicker).
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverEnter = useCallback((id: string) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setHoverId(id);
  }, []);
  const hoverLeave = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setHoverId(null), 140);
  }, []);
  useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }, []);

  // Double-click expand/collapse of CONTAINS subtrees, as in the product.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  useEffect(() => setCollapsed(new Set()), [data]);

  const containsChildren = useCallback(
    (id: string) => (idx.out.get(id) ?? []).filter((e) => e.kind === "CONTAINS").map((e) => e.dst),
    [idx],
  );
  const toggleCollapse = useCallback((id: string) => {
    if (containsChildren(id).length === 0) return;
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [containsChildren]);

  // Layout is independent of selection/hover — computed per filter/collapse change.
  const { vis, edges, pos, hiddenCounts } = useMemo(() => {
    const filtered = visibleNodes(data, idx, filters);
    const filteredIds = new Set(filtered.map((n) => n.id));

    // Hide every CONTAINS-descendant of a collapsed (and itself visible) node.
    const hidden = new Set<string>();
    const hiddenCounts = new Map<string, number>();
    for (const rootId of collapsed) {
      if (!filteredIds.has(rootId) || hidden.has(rootId)) continue;
      let count = 0;
      const stack = [...containsChildren(rootId)];
      const seen = new Set<string>();
      while (stack.length) {
        const cur = stack.pop()!;
        if (seen.has(cur)) continue;
        seen.add(cur);
        hidden.add(cur);
        if (filteredIds.has(cur)) count++;
        stack.push(...containsChildren(cur));
      }
      hiddenCounts.set(rootId, count);
    }
    const vis = filtered.filter((n) => !hidden.has(n.id));
    const visSet = new Set(vis.map((n) => n.id));

    // Re-route edges whose endpoint is hidden to its nearest visible
    // CONTAINS-ancestor (the collapsed card), so the graph stays connected.
    const repFor = (id: string): string | null => {
      let cur: string | undefined = id;
      const guard = new Set<string>();
      while (cur && !guard.has(cur)) {
        if (visSet.has(cur)) return cur;
        guard.add(cur);
        cur = (idx.in.get(cur) ?? []).find((e) => e.kind === "CONTAINS")?.src;
      }
      return null;
    };
    const seenEdge = new Set<string>();
    const edges: DGEdge[] = [];
    for (const e of data.edges) {
      const src = repFor(e.src);
      const dst = repFor(e.dst);
      if (!src || !dst || src === dst) continue;
      const key = `${src}>${dst}:${e.kind}`;
      if (seenEdge.has(key)) continue;
      seenEdge.add(key);
      edges.push(src === e.src && dst === e.dst ? e : { ...e, src, dst });
    }
    const pos = layout(vis, edges);
    return { vis, edges, pos, hiddenCounts };
  }, [data, idx, filters, collapsed, containsChildren]);

  // Decoration (spotlight on click, highlight on hover). Node/edge objects are
  // reused from the previous pass when their decoration didn't change, so React
  // Flow only re-renders the few elements whose state actually flipped.
  const prevNodes = useRef(new Map<string, RFNode>());
  const prevEdges = useRef(new Map<string, RFEdge>());
  const { rfNodes, rfEdges } = useMemo(() => {
    const focus = spotlightId ?? hoverId;
    const incident = new Set<string>();
    if (focus) {
      incident.add(focus);
      for (const e of edges) {
        if (e.src === focus) incident.add(e.dst);
        if (e.dst === focus) incident.add(e.src);
      }
    }
    const dimLevel = spotlightId ? 0.22 : 0.45;

    const nextNodes = new Map<string, RFNode>();
    const rfNodes: RFNode[] = vis.map((n: DGNode) => {
      const p = pos.get(n.id);
      const x = p?.x ?? 0;
      const y = p?.y ?? 0;
      const selected = n.id === selectedId;
      const dimmed = focus !== null && !incident.has(n.id);
      const hiddenChildren = hiddenCounts.get(n.id) ?? 0;
      const prev = prevNodes.current.get(n.id);
      const pd = prev?.data as { node: DGNode; selected: boolean; dimmed: boolean; dimLevel: number; hiddenChildren: number } | undefined;
      if (
        prev && pd && pd.node === n && pd.selected === selected && pd.dimmed === dimmed &&
        pd.dimLevel === dimLevel && pd.hiddenChildren === hiddenChildren &&
        prev.position.x === x && prev.position.y === y
      ) {
        nextNodes.set(n.id, prev);
        return prev;
      }
      const created: RFNode = {
        id: n.id,
        type: "dig",
        position: { x, y },
        data: { node: n, selected, dimmed, dimLevel, hiddenChildren },
      };
      nextNodes.set(n.id, created);
      return created;
    });
    prevNodes.current = nextNodes;

    const nextEdges = new Map<string, RFEdge>();
    const rfEdges: RFEdge[] = edges.map((e) => {
      const lit = focus !== null && (e.src === focus || e.dst === focus);
      const faded = focus !== null && !lit;
      const prev = prevEdges.current.get(e.id);
      const prevState = prev ? `${prev.style?.opacity}|${prev.label ?? ""}` : null;
      const contains = e.kind === "CONTAINS";
      const opacity = faded ? 0.05 : lit ? 1 : contains ? 0.45 : 0.6;
      const label = lit && !contains ? edgePhrase(e.kind) : undefined;
      if (prev && prevState === `${opacity}|${label ?? ""}`) {
        nextEdges.set(e.id, prev);
        return prev;
      }
      const created: RFEdge = {
        id: e.id,
        source: e.src,
        target: e.dst,
        type: "default",
        label,
        labelStyle: { fontSize: 9, fill: edgeColor(e.kind), fontWeight: 600 },
        labelBgStyle: { fill: "var(--panel-bg)", fillOpacity: 0.9 },
        style: {
          stroke: contains && !lit ? "var(--canvas-dot)" : edgeColor(e.kind),
          strokeWidth: lit ? 1.8 : contains ? 0.6 : 0.9,
          opacity,
          strokeDasharray: e.kind === "DEPENDS_ON" || e.kind === "CONSUMES" ? "4 3" : undefined,
        },
        markerEnd: contains ? undefined : {
          type: MarkerType.ArrowClosed, width: 14, height: 14, color: edgeColor(e.kind),
        },
      };
      nextEdges.set(e.id, created);
      return created;
    });
    prevEdges.current = nextEdges;

    return { rfNodes, rfEdges };
  }, [vis, edges, pos, hiddenCounts, selectedId, spotlightId, hoverId]);

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, n) => onSelect(n.id)}
      onNodeDoubleClick={(_, n) => toggleCollapse(n.id)}
      onPaneClick={() => onSelect(null)}
      onNodeMouseEnter={(_, n) => hoverEnter(n.id)}
      onNodeMouseLeave={hoverLeave}
      zoomOnDoubleClick={false}
      fitView
      minZoom={0.08}
      proOptions={{ hideAttribution: true }}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
    >
      <Background gap={22} size={1} color="var(--canvas-dot)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
