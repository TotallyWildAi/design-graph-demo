"use client";

import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MarkerType, type Edge as RFEdge, type Node as RFNode } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DGData } from "@/lib/types";
import type { GraphIndex } from "@/lib/graph";
import { deriveWorkUnits } from "@/lib/workunits";
import { deriveFiles } from "@/lib/files";
import { edgeColor, edgePhrase, styleForNode } from "@/lib/style";
import { DigNode } from "./DigNode";

const nodeTypes = { dig: DigNode };
const RING1 = 270;
const RING2 = 500;
const MAX_RING2 = 28;

/** Traverse tab — ego-graph walk: the centre node with its 1–2-hop
 * neighbourhood laid out radially; click any node to re-centre on it.
 * The right panel is the engineer briefing for the centre node. */
export function TraverseView({ data, idx, initialId }: {
  data: DGData;
  idx: GraphIndex;
  initialId?: string | null;
}) {
  const defaultCenter =
    initialId ??
    data.nodes.find((n) => n.kind === "CONTRACT")?.id ??
    data.nodes.find((n) => n.kind === "SYSTEM")?.id ??
    data.nodes[0]?.id;
  const [centerId, setCenterId] = useState<string | undefined>(undefined);
  const center = centerId ?? defaultCenter;

  const plan = useMemo(() => deriveWorkUnits(data, idx), [data, idx]);
  const files = useMemo(() => deriveFiles(data, idx), [data, idx]);

  const { rfNodes, rfEdges } = useMemo(() => {
    const incident = (id: string) => [...(idx.out.get(id) ?? []), ...(idx.in.get(id) ?? [])];
    const ring1 = new Set<string>();
    for (const e of incident(center)) ring1.add(e.src === center ? e.dst : e.src);
    ring1.delete(center);
    const ring2 = new Set<string>();
    for (const r1 of ring1) {
      for (const e of incident(r1)) {
        const other = e.src === r1 ? e.dst : e.src;
        if (other !== center && !ring1.has(other)) ring2.add(other);
        if (ring2.size >= MAX_RING2) break;
      }
      if (ring2.size >= MAX_RING2) break;
    }
    const included = new Set([center, ...ring1, ...ring2]);

    const place = (ids: string[], minRadius: number): Map<string, { x: number; y: number }> => {
      const m = new Map<string, { x: number; y: number }>();
      // Enough circumference that 190px-wide cards don't overlap.
      const radius = Math.max(minRadius, (ids.length * 225) / (2 * Math.PI));
      ids.forEach((id, i) => {
        const a = (2 * Math.PI * i) / Math.max(ids.length, 1) - Math.PI / 2;
        m.set(id, { x: radius * Math.cos(a), y: radius * Math.sin(a) * 0.72 });
      });
      return m;
    };
    const pos = new Map([
      [center, { x: 0, y: 0 }],
      ...place([...ring1], RING1),
      ...place([...ring2], RING2),
    ]);

    const rfNodes: RFNode[] = [...included].map((id) => {
      const n = idx.byId.get(id)!;
      return {
        id,
        type: "dig",
        position: pos.get(id) ?? { x: 0, y: 0 },
        data: { node: n, selected: id === center, dimmed: ring2.has(id) },
      };
    });
    const rfEdges: RFEdge[] = data.edges
      .filter((e) => included.has(e.src) && included.has(e.dst))
      .map((e) => {
        const onCenter = e.src === center || e.dst === center;
        return {
          id: e.id,
          source: e.src,
          target: e.dst,
          label: onCenter ? edgePhrase(e.kind) : undefined,
          labelStyle: { fontSize: 9, fill: edgeColor(e.kind), fontWeight: 600 },
          labelBgStyle: { fill: "var(--panel-bg)", fillOpacity: 0.9 },
          style: {
            stroke: edgeColor(e.kind),
            strokeWidth: onCenter ? 1.6 : 0.8,
            opacity: onCenter ? 0.95 : 0.3,
          },
          markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13, color: edgeColor(e.kind) },
        };
      });
    return { rfNodes, rfEdges };
  }, [data, idx, center]);

  const node = idx.byId.get(center);
  const s = node ? styleForNode(node.kind, node.stereotype) : null;
  const unit = plan.units.find((u) => u.nodeIds.includes(center));
  const relatedFiles = files.filter((f) => f.nodeId === center);
  const outgoing = idx.out.get(center) ?? [];
  const incoming = idx.in.get(center) ?? [];

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 min-w-0 bg-[var(--canvas-bg)]">
        <ReactFlow
          key={center}
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => setCenterId(n.id)}
          fitView
          minZoom={0.15}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
        >
          <Background gap={22} size={1} color="var(--canvas-dot)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <aside className="w-80 shrink-0 border-l border-[var(--border)] bg-[var(--panel-bg)] overflow-y-auto text-[11px]">
        {node && s && (
          <>
            <div className="p-3 border-b border-[var(--border)]">
              <div className="panel-heading">Engineer briefing</div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <div className="min-w-0">
                  <div className="font-bold text-[13px] truncate">{node.name}</div>
                  <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: s.color }}>
                    {node.kind}
                    {node.stereotype ? ` · ${node.stereotype}` : ""}
                  </div>
                </div>
              </div>
              {node.description && (
                <p className="mt-2 leading-relaxed text-[var(--text-soft)]">{node.description}</p>
              )}
            </div>

            <div className="p-3 border-b border-[var(--border)]">
              <div className="panel-heading">Board status</div>
              {unit ? (
                <div className="mt-1.5 rounded-md border border-[var(--border)] px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[var(--muted)]">{unit.id} · wave {unit.wave}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      unit.status === "done"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : unit.status === "in-progress"
                          ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {unit.status}
                    </span>
                  </div>
                  <div className="mt-0.5 font-semibold">{unit.title}</div>
                </div>
              ) : (
                <p className="mt-1 text-[var(--muted)]">Not on the board — structural node.</p>
              )}
            </div>

            {relatedFiles.length > 0 && (
              <div className="p-3 border-b border-[var(--border)]">
                <div className="panel-heading">Related files</div>
                {relatedFiles.map((f) => (
                  <div key={f.path} className="mt-1 font-mono text-[10px] flex items-center gap-1.5">
                    <span>{f.delivered ? "✓" : "·"}</span>
                    <span className="truncate">{f.path}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3">
              <div className="panel-heading">Walk</div>
              <p className="mt-1 text-[10px] text-[var(--muted)]">
                Click any card in the graph to re-centre the walk on it.
              </p>
              {outgoing.length > 0 && (
                <div className="mt-2">
                  {outgoing.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setCenterId(e.dst)}
                      className="flex w-full items-baseline gap-1.5 py-[3px] text-left hover:bg-[var(--hover)] rounded px-1 -mx-1"
                    >
                      <span className="text-[10px] font-semibold shrink-0 text-[var(--iris)]">
                        → {edgePhrase(e.kind)}
                      </span>
                      <span className="truncate">{idx.byId.get(e.dst)?.name ?? e.dst}</span>
                    </button>
                  ))}
                </div>
              )}
              {incoming.length > 0 && (
                <div className="mt-1">
                  {incoming.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setCenterId(e.src)}
                      className="flex w-full items-baseline gap-1.5 py-[3px] text-left hover:bg-[var(--hover)] rounded px-1 -mx-1"
                    >
                      <span className="text-[10px] font-semibold shrink-0 text-[var(--amber,#d97706)]">
                        ← {edgePhrase(e.kind)}
                      </span>
                      <span className="truncate">{idx.byId.get(e.src)?.name ?? e.src}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
