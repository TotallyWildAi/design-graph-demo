"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { styleForNode, tint } from "@/lib/style";
import type { DGNode } from "@/lib/types";

export type DigNodeType = Node<
  { node: DGNode; dimmed: boolean; selected: boolean; dimLevel?: number; hiddenChildren?: number },
  "dig"
>;

export function DigNode({ data }: NodeProps<DigNodeType>) {
  const n = data.node;
  const s = styleForNode(n.kind, n.stereotype);
  const tag = (n.stereotype && n.stereotype !== n.kind ? `${n.kind} · ${n.stereotype}` : n.kind)
    .toUpperCase();
  return (
    <div
      className="rounded-lg border px-2.5 py-1.5 w-[190px] transition-opacity"
      style={{
        borderColor: data.selected ? s.color : tint(s.color, 0.6),
        // Mix two OPAQUE colors — an rgba tint here would leave the card
        // translucent and let edge lines ghost through from underneath.
        background: `color-mix(in srgb, ${s.color} ${data.selected ? 20 : 10}%, var(--panel-bg))`,
        boxShadow: data.selected
          ? `0 0 0 2px ${tint(s.color, 0.45)}, 0 3px 10px rgba(15,23,42,.14)`
          : "0 2px 6px rgba(15,23,42,.09)",
        opacity: data.dimmed ? (data.dimLevel ?? 0.25) : 1,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-1 !h-1" />
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[13px] leading-none shrink-0">{s.icon}</span>
        <span className="text-[11px] font-semibold truncate" title={n.name}>{n.name}</span>
        {(data.hiddenChildren ?? 0) > 0 && (
          <span
            className="ml-auto shrink-0 text-[9px] font-bold px-1 rounded"
            style={{ color: s.color, background: tint(s.color, 0.18) }}
            title="Collapsed — double-click to expand"
          >
            +{data.hiddenChildren}
          </span>
        )}
      </div>
      <div className="text-[8px] tracking-wide mt-0.5 font-medium" style={{ color: s.color }}>
        {tag}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-1 !h-1" />
    </div>
  );
}
