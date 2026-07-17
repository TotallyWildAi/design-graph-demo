"use client";

import { useMemo, useState } from "react";
import type { DGData } from "@/lib/types";
import type { GraphIndex } from "@/lib/graph";
import { requirementCoverage, traceRequirement, traceChart } from "@/lib/flows";
import { styleFor } from "@/lib/style";
import { Mermaid } from "./Mermaid";
import { DiagramPanZoom } from "./DiagramPanZoom";

/** Requirements tab — traceability: pick a requirement, see the ordered
 * production call-chain that satisfies it, as prose + a flowchart. */
export function RequirementsView({ data, idx }: { data: DGData; idx: GraphIndex }) {
  const reqs = useMemo(() => requirementCoverage(data, idx), [data, idx]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeReq = reqs.find((r) => r.node.id === activeId) ?? reqs[0];
  const trace = useMemo(
    () => (activeReq ? traceRequirement(idx, activeReq.node.id) : null),
    [idx, activeReq],
  );
  const chart = trace ? traceChart(idx, trace) : "";
  const reqStyle = styleFor("REQUIREMENT");

  if (reqs.length === 0) {
    return (
      <div className="flex-1 grid place-items-center text-[12px] text-[var(--muted)]">
        This graph has no REQUIREMENT nodes.
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-80 shrink-0 border-r border-[var(--border)] bg-[var(--panel-bg)] overflow-y-auto">
        <div className="p-3 pb-1">
          <div className="panel-heading">Requirements ({reqs.length})</div>
          <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
            Traceability: each requirement and the production call-chain that
            satisfies it, from user-facing entry point to persistence.
          </p>
        </div>
        <div className="p-2">
          {reqs.map((r) => (
            <button
              key={r.node.id}
              onClick={() => setActiveId(r.node.id)}
              className={`block w-full text-left rounded-md px-2 py-1.5 mb-0.5 ${
                r.node.id === activeReq?.node.id
                  ? "bg-[var(--iris-soft)]"
                  : "hover:bg-[var(--hover)]"
              }`}
            >
              <div className="flex items-start gap-1.5">
                <span className="text-[11px] shrink-0">{reqStyle.icon}</span>
                <span className="text-[11px] font-semibold leading-snug">{r.node.name}</span>
              </div>
              <div className="mt-0.5 ml-5 text-[9.5px]">
                {r.implementerCount > 0 ? (
                  <span className="text-emerald-600 font-semibold">
                    ✓ {r.implementerCount} implementer{r.implementerCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">⚠ not covered</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 overflow-auto bg-[var(--canvas-bg)] p-6">
        {activeReq && trace && (
          <>
            <div className="flex items-start gap-2">
              <span className="text-lg">{reqStyle.icon}</span>
              <div>
                <div className="text-[14px] font-bold">{trace.reqName}</div>
                {activeReq.node.description && (
                  <p className="mt-0.5 text-[11px] text-[var(--text-soft)] max-w-xl leading-relaxed">
                    {activeReq.node.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {trace.implementers.map(({ node, module }) => (
                <span
                  key={node.id}
                  className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--panel-bg)] text-[10px]"
                >
                  <span className="font-semibold">{node.name}</span>
                  <span className="text-[var(--muted)]"> · {module}</span>
                </span>
              ))}
              {trace.implementers.length === 0 && (
                <span className="text-[11px] text-amber-600 font-semibold">
                  ⚠ Nothing implements this requirement yet.
                </span>
              )}
            </div>

            {trace.untraced ? (
              trace.implementers.length > 0 && (
                <p className="mt-4 text-[11px] text-[var(--muted)] max-w-xl leading-relaxed">
                  The implementers above satisfy this requirement directly — no
                  production call-chain runs through them (configuration or
                  deployment concerns rather than request flows).
                </p>
              )
            ) : (
              <div className="mt-4 flex flex-col xl:flex-row gap-6">
                <ol className="shrink-0 w-96 space-y-1">
                  {trace.steps.map((s) => (
                    <li key={s.order} className="flex gap-2 text-[11px] leading-relaxed">
                      <span className="shrink-0 w-5 h-5 grid place-items-center rounded-full bg-[var(--iris-soft)] text-[var(--iris)] text-[9px] font-bold">
                        {s.order}
                      </span>
                      <span className="font-mono text-[10.5px] pt-0.5">{s.text}</span>
                    </li>
                  ))}
                </ol>
                {chart && (
                  <div className="min-w-0 flex-1 flex flex-col h-[420px] rounded-lg border border-[var(--border)] bg-[var(--panel-bg)]">
                    <DiagramPanZoom fitKey={chart}>
                      <Mermaid code={chart} id={`req-${trace.reqId}`} />
                    </DiagramPanZoom>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
