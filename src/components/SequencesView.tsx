"use client";

import { useMemo, useState } from "react";
import type { DGData } from "@/lib/types";
import type { GraphIndex } from "@/lib/graph";
import { deriveSequences } from "@/lib/flows";
import { Mermaid } from "./Mermaid";
import { DiagramPanZoom } from "./DiagramPanZoom";

/** Sequences tab — one Mermaid sequence diagram per entry flow, derived from CALLS chains. */
export function SequencesView({ data, idx }: { data: DGData; idx: GraphIndex }) {
  const seqs = useMemo(() => deriveSequences(data, idx), [data, idx]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = seqs.find((s) => s.key === activeKey) ?? seqs[0];

  if (seqs.length === 0) {
    return (
      <div className="flex-1 grid place-items-center text-[12px] text-[var(--muted)]">
        No call chains in this graph — sequences are derived from CALLS edges.
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-72 shrink-0 border-r border-[var(--border)] bg-[var(--panel-bg)] overflow-y-auto">
        <div className="p-3 pb-1">
          <div className="panel-heading">Flows ({seqs.length})</div>
          <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
            One sequence per entry point, derived from the graph&apos;s CALLS chains —
            HTTP endpoint flows first, then internal chains.
          </p>
        </div>
        <div className="p-2">
          {seqs.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveKey(s.key)}
              className={`block w-full text-left rounded-md px-2 py-1.5 mb-0.5 ${
                s.key === active?.key
                  ? "bg-[var(--iris-soft)] text-[var(--iris)]"
                  : "hover:bg-[var(--hover)]"
              }`}
            >
              <div className="text-[11px] font-semibold font-mono truncate">{s.title}</div>
              {s.subtitle && (
                <div className="text-[9.5px] text-[var(--muted)] truncate">{s.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col bg-[var(--canvas-bg)]">
        {active && (
          <>
            <div className="px-6 pt-4 pb-2 text-[11px] text-[var(--muted)]">
              <span className="font-mono font-semibold text-[var(--text)]">{active.title}</span>
              {active.subtitle ? ` — ${active.subtitle}` : ""}
              <span className="opacity-75"> · scroll to zoom, drag to pan</span>
            </div>
            <DiagramPanZoom fitKey={active.mermaid}>
              <Mermaid code={active.mermaid} id={`seq-${active.key}`} />
            </DiagramPanZoom>
          </>
        )}
      </div>
    </div>
  );
}
