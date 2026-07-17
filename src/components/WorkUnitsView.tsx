"use client";

import { useMemo } from "react";
import type { DGData } from "@/lib/types";
import type { GraphIndex } from "@/lib/graph";
import { deriveWorkUnits, type UnitStatus } from "@/lib/workunits";
import { styleForNode } from "@/lib/style";

const STATUS_STYLE: Record<UnitStatus, { label: string; cls: string }> = {
  done: { label: "Done", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  "in-progress": { label: "In progress", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400" },
  todo: { label: "To do", cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
};

/** Work Units tab — wave-ordered build plan (kanban-as-a-view), demo-derived. */
export function WorkUnitsView({ data, idx, onSelectNode }: {
  data: DGData;
  idx: GraphIndex;
  onSelectNode: (id: string) => void;
}) {
  const plan = useMemo(() => deriveWorkUnits(data, idx), [data, idx]);
  const waves = useMemo(() => {
    const m = new Map<number, typeof plan.units>();
    for (const u of plan.units) {
      if (!m.has(u.wave)) m.set(u.wave, []);
      m.get(u.wave)!.push(u);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [plan]);

  const total = plan.units.length;
  const doneCount = plan.units.filter((u) => u.status === "done").length;

  return (
    <div className="flex-1 overflow-auto bg-[var(--canvas-bg)]">
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-baseline gap-3">
          <span className="text-[13px] font-bold">Build order</span>
          <span className="text-[11px] text-[var(--muted)]">
            {total} work units in {waves.length} waves · {doneCount} done
          </span>
        </div>
        <p className="mt-0.5 text-[10.5px] text-[var(--muted)] max-w-2xl">{plan.notes}</p>
        {plan.uncoveredRequirements.length > 0 && (
          <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 text-[11px] text-amber-700 dark:text-amber-400">
            ⚠ {plan.uncoveredRequirements.length} requirement
            {plan.uncoveredRequirements.length > 1 ? "s are" : " is"} not covered by any unit:{" "}
            {plan.uncoveredRequirements.map((r) => r.name).join(", ")}
          </div>
        )}
      </div>

      <div className="flex gap-4 px-5 pb-5 items-start">
        {waves.map(([wave, units]) => (
          <div key={wave} className="w-72 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 grid place-items-center rounded-full bg-[var(--iris)] text-white text-[10px] font-bold">
                {wave}
              </span>
              <span className="panel-heading">Wave {wave}</span>
              <span className="text-[10px] text-[var(--muted)]">{units.length}</span>
            </div>
            <div className="space-y-2">
              {units.map((u) => {
                const st = STATUS_STYLE[u.status];
                return (
                  <div key={u.id} className="rounded-lg border border-[var(--border)] bg-[var(--panel-bg)] p-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold text-[var(--muted)]">{u.id}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="mt-1 text-[11.5px] font-semibold leading-snug">{u.title}</div>
                    <p className="mt-0.5 text-[10px] text-[var(--text-soft)] leading-relaxed">{u.summary}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {u.nodeIds.slice(0, 5).map((id) => {
                        const n = idx.byId.get(id);
                        if (!n) return null;
                        const s = styleForNode(n.kind, n.stereotype);
                        return (
                          <button
                            key={id}
                            onClick={() => onSelectNode(id)}
                            title={`${n.kind} — open in Explore`}
                            className="text-[9px] px-1 py-0.5 rounded border border-[var(--border)] hover:border-[var(--iris)] font-mono"
                            style={{ color: s.color }}
                          >
                            {s.icon} {n.name}
                          </button>
                        );
                      })}
                      {u.nodeIds.length > 5 && (
                        <span className="text-[9px] text-[var(--muted)]">+{u.nodeIds.length - 5}</span>
                      )}
                    </div>
                    <div className="mt-1 text-[9px] text-[var(--muted)]">{u.module}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
