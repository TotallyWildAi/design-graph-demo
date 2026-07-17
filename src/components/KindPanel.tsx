"use client";

import { useMemo } from "react";
import type { DGData } from "@/lib/types";
import { facetOf, laneOf, nodeAspects, type FilterState, type GraphIndex } from "@/lib/graph";
import { styleForNode } from "@/lib/style";

/** Left facet panel: node-type toggles grouped by section, aspect + module chips. */

const SECTIONS: Array<{ title: string; match: (facet: string) => boolean }> = [
  { title: "Systems & containers", match: (f) => ["SYSTEM", "CONTAINER", "EXTERNAL_SYSTEM"].includes(f) },
  { title: "Domain", match: (f) => f === "TYPE:domain" || f === "TYPE" },
  { title: "Contracts & requirements", match: (f) => ["CONTRACT", "REQUIREMENT", "TYPE:dto"].includes(f) },
  { title: "Services & components", match: (f) => f.startsWith("COMPONENT") || ["TYPE:service", "TYPE:controller"].includes(f) },
  { title: "API & messaging", match: (f) => ["ENDPOINT", "TOPIC", "CACHE"].includes(f) },
  { title: "Methods & fields", match: (f) => ["METHOD", "FIELD"].includes(f) },
  { title: "Tests", match: (f) => f.endsWith(":test") },
  { title: "Database", match: (f) => ["TABLE", "COLUMN", "MIGRATION"].includes(f) },
  { title: "Deployment", match: (f) => ["DEPLOYABLE_ARTIFACT", "ENVIRONMENT", "DOCKER_IMAGE"].includes(f) },
  { title: "Integrations & infra", match: (f) => ["CONFIG", "DEPENDENCY"].includes(f) },
];

const FACET_LABEL: Record<string, string> = {
  "COMPONENT:controller": "Controllers",
  "COMPONENT:service": "Services",
  "COMPONENT:repository": "Repositories",
  "COMPONENT:gateway": "Gateways / clients",
  "COMPONENT:ui-component": "UI components",
  "COMPONENT:test": "Tests",
  "COMPONENT:filter": "Filters",
  "COMPONENT:security": "Security",
  "COMPONENT:config": "Config",
  "COMPONENT:store": "Stores",
  "TYPE:domain": "Domain objects",
  "TYPE:dto": "DTOs",
  "TYPE:test": "Tests",
  DEPLOYABLE_ARTIFACT: "Deployable artifacts",
  DOCKER_IMAGE: "Docker images",
  EXTERNAL_SYSTEM: "External systems",
};

function labelFor(facet: string): string {
  if (FACET_LABEL[facet]) return FACET_LABEL[facet];
  const base = facet.includes(":") ? facet.split(":")[1] : facet;
  const words = base.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1) + (words.endsWith("s") ? "" : "s");
}

interface Props {
  data: DGData;
  idx: GraphIndex;
  filters: FilterState;
  onChange: (f: FilterState) => void;
  aspectChoices: string[];
}

export function KindPanel({ data, idx, filters, onChange, aspectChoices }: Props) {
  const { facetCounts, modules } = useMemo(() => {
    const facetCounts = new Map<string, { count: number; kind: string; stereotype?: string }>();
    for (const n of data.nodes) {
      const f = facetOf(n);
      const cur = facetCounts.get(f);
      if (cur) cur.count++;
      else facetCounts.set(f, { count: 1, kind: n.kind, stereotype: n.stereotype });
    }
    const modules = new Map<string, string>();
    for (const n of data.nodes) {
      if (n.kind === "CONTAINER") {
        const lane = laneOf(idx, n.id);
        if (lane.key === n.id) modules.set(lane.key, lane.label);
      }
    }
    return { facetCounts, modules };
  }, [data, idx]);

  const grouped = useMemo(() => {
    const used = new Set<string>();
    const rows = SECTIONS.map((s) => {
      const facets = [...facetCounts.keys()].filter((f) => !used.has(f) && s.match(f));
      facets.forEach((f) => used.add(f));
      return { title: s.title, facets: facets.sort() };
    }).filter((s) => s.facets.length > 0);
    const rest = [...facetCounts.keys()].filter((f) => !used.has(f)).sort();
    if (rest.length) rows.push({ title: "Other", facets: rest });
    return rows;
  }, [facetCounts]);

  const toggleFacet = (f: string) => {
    const hidden = new Set(filters.hiddenFacets);
    if (hidden.has(f)) hidden.delete(f);
    else hidden.add(f);
    onChange({ ...filters, hiddenFacets: hidden });
  };
  const toggleAspect = (a: string) => {
    const aspects = new Set(filters.aspects);
    if (aspects.has(a)) aspects.delete(a);
    else aspects.add(a);
    onChange({ ...filters, aspects });
  };
  const toggleModule = (m: string) => {
    const modules = new Set(filters.modules);
    if (modules.has(m)) modules.delete(m);
    else modules.add(m);
    onChange({ ...filters, modules });
  };

  const aspectCount = useMemo(() => {
    const c = new Map<string, number>();
    for (const n of data.nodes) for (const a of nodeAspects(idx, n)) c.set(a, (c.get(a) ?? 0) + 1);
    return c;
  }, [data, idx]);

  return (
    <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--panel-bg)] overflow-y-auto text-[11px]">
      <div className="p-3 border-b border-[var(--border)]">
        <div className="panel-heading">Aspect — what it&apos;s about</div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {aspectChoices.filter((a) => aspectCount.has(a)).map((a) => (
            <button
              key={a}
              onClick={() => toggleAspect(a)}
              className={`px-1.5 py-0.5 rounded border text-[10px] transition-colors ${
                filters.aspects.has(a)
                  ? "border-[var(--iris)] bg-[var(--iris-soft)] text-[var(--iris)] font-semibold"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--iris)]"
              }`}
            >
              {a} <span className="opacity-60">{aspectCount.get(a)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 border-b border-[var(--border)]">
        <div className="panel-heading">Modules — deployable units</div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <button
            onClick={() => onChange({ ...filters, modules: new Set() })}
            className={`px-1.5 py-0.5 rounded border text-[10px] ${
              filters.modules.size === 0
                ? "border-[var(--iris)] bg-[var(--iris-soft)] text-[var(--iris)] font-semibold"
                : "border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            All
          </button>
          {[...modules.entries()].map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleModule(key)}
              className={`px-1.5 py-0.5 rounded border text-[10px] ${
                filters.modules.has(key)
                  ? "border-[var(--iris)] bg-[var(--iris-soft)] text-[var(--iris)] font-semibold"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--iris)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="panel-heading">Node types</div>
          <div className="flex gap-1">
            <button className="chip-btn" onClick={() => onChange({ ...filters, hiddenFacets: new Set() })}>
              Show all
            </button>
            <button
              className="chip-btn"
              onClick={() => onChange({ ...filters, hiddenFacets: new Set(facetCounts.keys()) })}
            >
              Hide all
            </button>
          </div>
        </div>
        {grouped.map((section) => (
          <div key={section.title} className="mt-2.5">
            <div className="text-[9px] font-bold tracking-widest text-[var(--muted)] uppercase">
              {section.title}
            </div>
            {section.facets.map((f) => {
              const info = facetCounts.get(f)!;
              const s = styleForNode(info.kind, f.includes(":") ? f.split(":")[1] : info.stereotype);
              const visible = !filters.hiddenFacets.has(f);
              return (
                <label
                  key={f}
                  className="flex items-center gap-1.5 py-[3px] cursor-pointer select-none hover:bg-[var(--hover)] rounded px-1 -mx-1"
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleFacet(f)}
                    className="accent-[var(--iris)] w-3 h-3"
                  />
                  <span className="text-[11px]">{s.icon}</span>
                  <span className={visible ? "" : "text-[var(--muted)] line-through"}>{labelFor(f)}</span>
                  <span className="ml-auto text-[var(--muted)]">{info.count}</span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
