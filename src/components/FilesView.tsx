"use client";

import { useMemo, useState } from "react";
import type { DGData } from "@/lib/types";
import type { GraphIndex } from "@/lib/graph";
import { deriveFiles, ROLE_ICON, type FileRole } from "@/lib/files";

const ROLES: FileRole[] = ["SOURCE", "TEST", "CONFIG", "MIGRATION", "CONTRACT", "DEPLOY", "BUILD_MANIFEST"];

/** Files tab — the planned file tree grouped by module, with role + delivered flags. */
export function FilesView({ data, idx, onSelectNode }: {
  data: DGData;
  idx: GraphIndex;
  onSelectNode: (id: string) => void;
}) {
  const files = useMemo(() => deriveFiles(data, idx), [data, idx]);
  const [roleFilter, setRoleFilter] = useState<FileRole | null>(null);

  const shown = roleFilter ? files.filter((f) => f.role === roleFilter) : files;
  const byModule = useMemo(() => {
    const m = new Map<string, typeof shown>();
    for (const f of shown) {
      if (!m.has(f.module)) m.set(f.module, []);
      m.get(f.module)!.push(f);
    }
    return [...m.entries()];
  }, [shown]);

  const deliveredCount = files.filter((f) => f.delivered).length;
  const roleCounts = useMemo(() => {
    const c = new Map<FileRole, number>();
    for (const f of files) c.set(f.role, (c.get(f.role) ?? 0) + 1);
    return c;
  }, [files]);

  return (
    <div className="flex-1 overflow-auto bg-[var(--canvas-bg)]">
      <div className="px-5 pt-4 pb-2 sticky top-0 bg-[var(--canvas-bg)] z-10 border-b border-[var(--border)]">
        <div className="flex items-baseline gap-3">
          <span className="text-[13px] font-bold">Planned files</span>
          <span className="text-[11px] text-[var(--muted)]">
            {files.length} files · {deliveredCount} delivered
          </span>
          <span className="text-[10px] text-[var(--muted)]">
            (demo derivation — the full product returns the real planned tree and checks the workspace)
          </span>
        </div>
        <div className="mt-2 mb-2 flex gap-1 flex-wrap">
          <button
            onClick={() => setRoleFilter(null)}
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              roleFilter === null
                ? "border-[var(--iris)] bg-[var(--iris-soft)] text-[var(--iris)] font-semibold"
                : "border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            All {files.length}
          </button>
          {ROLES.filter((r) => roleCounts.has(r)).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(roleFilter === r ? null : r)}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                roleFilter === r
                  ? "border-[var(--iris)] bg-[var(--iris-soft)] text-[var(--iris)] font-semibold"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              {ROLE_ICON[r]} {r.toLowerCase().replace("_", " ")} {roleCounts.get(r)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
        {byModule.map(([module, fs]) => (
          <div key={module} className="rounded-lg border border-[var(--border)] bg-[var(--panel-bg)]">
            <div className="px-3 py-2 border-b border-[var(--border)] flex items-baseline justify-between">
              <span className="text-[11px] font-bold">{module}</span>
              <span className="text-[9.5px] text-[var(--muted)]">
                {fs.filter((f) => f.delivered).length}/{fs.length} delivered
              </span>
            </div>
            <ul className="p-2">
              {fs.map((f) => (
                <li key={f.path}>
                  <button
                    onClick={() => f.nodeId && onSelectNode(f.nodeId)}
                    disabled={!f.nodeId}
                    title={f.nodeId ? "Open in Explore" : undefined}
                    className={`w-full flex items-center gap-1.5 rounded px-1.5 py-[3px] text-left ${
                      f.nodeId ? "hover:bg-[var(--hover)]" : "cursor-default"
                    }`}
                  >
                    <span className="text-[10px] shrink-0">{ROLE_ICON[f.role]}</span>
                    <span className={`font-mono text-[10px] truncate ${f.delivered ? "" : "text-[var(--muted)]"}`}>
                      {f.path}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px]">
                      {f.delivered ? (
                        <span className="text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="text-[var(--muted)]">·</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
