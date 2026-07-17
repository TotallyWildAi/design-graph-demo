"use client";

import { useMemo } from "react";
import type { DGData } from "@/lib/types";
import { styleFor } from "@/lib/style";

const KIND_ORDER = [
  "SYSTEM", "CONTAINER", "COMPONENT", "TYPE", "METHOD", "FIELD", "ENDPOINT", "TABLE",
  "COLUMN", "CONTRACT", "CONFIG", "MIGRATION", "DEPLOYABLE_ARTIFACT", "ENVIRONMENT",
  "EXTERNAL_SYSTEM", "REQUIREMENT", "DEPENDENCY", "DOCKER_IMAGE", "TOPIC", "CACHE",
];

export function Legend({ data }: { data: DGData }) {
  const present = useMemo(() => {
    const kinds = new Set(data.nodes.map((n) => n.kind));
    return KIND_ORDER.filter((k) => kinds.has(k));
  }, [data]);
  return (
    <footer className="flex items-center gap-3 flex-wrap px-3 py-1.5 border-t border-[var(--border)] bg-[var(--panel-bg)] text-[9.5px]">
      {present.map((k) => {
        const s = styleFor(k);
        return (
          <span key={k} className="inline-flex items-center gap-1 text-[var(--muted)]">
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ background: s.color }}
            />
            {s.icon} {k.replace(/_/g, " ")}
          </span>
        );
      })}
    </footer>
  );
}
