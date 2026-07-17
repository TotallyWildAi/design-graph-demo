"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import type { DGData } from "@/lib/types";
import { buildIndex, type FilterState } from "@/lib/graph";
import { timelineManager } from "@/data/timelineManager";
import { GraphCanvas } from "./GraphCanvas";
import { KindPanel } from "./KindPanel";
import { InspectorPanel } from "./InspectorPanel";
import { ArchitectureView } from "./ArchitectureView";
import { SequencesView } from "./SequencesView";
import { RequirementsView } from "./RequirementsView";
import { WorkUnitsView } from "./WorkUnitsView";
import { FilesView } from "./FilesView";
import { TraverseView } from "./TraverseView";
import { Legend } from "./Legend";

const TABS = [
  { key: "explore", label: "Explore" },
  { key: "architecture", label: "Architecture" },
  { key: "sequences", label: "Sequences" },
  { key: "requirements", label: "Requirements" },
  { key: "workunits", label: "Work Units" },
  { key: "files", label: "Files" },
  { key: "traverse", label: "Traverse" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const LIVE_TABS: TabKey[] = [
  "explore", "architecture", "sequences", "requirements", "workunits", "files", "traverse",
];

/** Preset views — semantic aspect filters or a kind allow-list, as in the product. */
const PRESETS: Array<{ key: string; label: string; aspects?: string[]; kinds?: string[] }> = [
  { key: "all", label: "All" },
  { key: "high", label: "High-level", kinds: ["SYSTEM", "CONTAINER", "EXTERNAL_SYSTEM", "CONTRACT", "REQUIREMENT"] },
  { key: "deployment", label: "Deployment", aspects: ["deployment"] },
  { key: "infra", label: "Infrastructure", aspects: ["infrastructure", "config", "observability"] },
  { key: "backend", label: "Backend", aspects: ["backend", "application", "domain", "api"] },
  { key: "frontend", label: "Frontend", aspects: ["frontend", "ui"] },
  { key: "database", label: "Database", aspects: ["database", "data", "persistence"] },
  { key: "security", label: "Security & auth", aspects: ["security", "auth"] },
  { key: "calls", label: "Call chains", aspects: ["backend", "api"] },
];

const ASPECT_CHOICES = [
  "system", "frontend", "ui", "backend", "api", "contract", "domain", "application",
  "persistence", "data", "database", "messaging", "security", "auth", "deployment",
  "infrastructure", "config", "observability", "testing", "build", "integration",
  "external", "requirement",
];

const PROJECTS = [
  { id: "timeline-manager", label: "Timeline Manager · PRJ-13aa3921" },
  { id: "notes-app", label: "Personal Time-Notes & Insight System" },
];

const EMPTY_FILTERS: FilterState = {
  hiddenFacets: new Set(),
  aspects: new Set(),
  modules: new Set(),
  testMode: "both",
};

export function DesignGraphApp() {
  const [projectId, setProjectId] = useState("timeline-manager");
  const [remote, setRemote] = useState<Record<string, DGData>>({});
  const [tab, setTab] = useState<TabKey>("explore");
  const [preset, setPreset] = useState("all");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);

  const select = (id: string | null) => {
    setSelectedId(id);
    setSpotlightId(id);
  };

  /** Jump from another tab to a node in Explore (spotlit + inspected). */
  const jumpToNode = (id: string) => {
    select(id);
    setTab("explore");
  };

  useEffect(() => {
    if (projectId === "timeline-manager" || remote[projectId]) return;
    fetch(`/design-graphs/${projectId}.json`)
      .then((r) => r.json())
      .then((d: DGData) => setRemote((prev) => ({ ...prev, [projectId]: d })))
      .catch(() => {});
  }, [projectId, remote]);

  const data: DGData | null =
    projectId === "timeline-manager" ? timelineManager : (remote[projectId] ?? null);
  const idx = useMemo(() => (data ? buildIndex(data) : null), [data]);

  // Default-select the SYSTEM node so the inspector mirrors the screenshots.
  useEffect(() => {
    if (data) {
      const sys = data.nodes.find((n) => n.kind === "SYSTEM");
      setSelectedId(sys?.id ?? null);
      setSpotlightId(null);
      setFilters(EMPTY_FILTERS);
      setPreset("all");
    }
  }, [data]);

  const applyPreset = (key: string) => {
    setPreset(key);
    const p = PRESETS.find((x) => x.key === key)!;
    setFilters({
      ...EMPTY_FILTERS,
      hiddenFacets: new Set(filters.hiddenFacets),
      testMode: filters.testMode,
      aspects: new Set(p.aspects ?? []),
      presetKinds: p.kinds ? new Set(p.kinds) : undefined,
    });
  };

  const selected = selectedId && idx ? (idx.byId.get(selectedId) ?? null) : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ---------------------------------------------------------- header */}
      <header className="flex items-center gap-3 px-3 h-12 border-b border-[var(--border)] bg-[var(--panel-bg)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md grid place-items-center text-white text-[11px] font-black bg-[var(--iris)]">
            TW
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[var(--iris)] text-[var(--iris)]">
            Architect
          </span>
          <span className="font-bold text-[14px]">Design Graph</span>
        </div>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="text-[11px] border border-[var(--border)] rounded-md px-2 py-1 bg-[var(--panel-bg)] max-w-64"
        >
          {PROJECTS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        {data && (
          <span className="text-[10px] text-[var(--muted)]">
            {data.nodes.length} nodes · {data.edges.length} edges
            {data.generatedAt ? ` · ${new Date(data.generatedAt).toLocaleDateString()}` : ""}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {(["both", "only", "hide"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilters({ ...filters, testMode: m })}
              className={`text-[10px] px-2 py-1 rounded-full border ${
                filters.testMode === m
                  ? "border-[var(--iris)] bg-[var(--iris-soft)] text-[var(--iris)] font-bold"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              {m === "both" ? "Both" : m === "only" ? "Tests only" : "Hide tests"}
            </button>
          ))}
          <button
            className="text-[10px] px-2.5 py-1 rounded-md font-semibold text-white bg-[var(--iris)] hover:opacity-90"
            title="Demo build — regeneration runs in the full product"
          >
            ⟳ Regenerate design graph
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- tabs */}
      <div className="flex items-center gap-1 px-3 h-9 border-b border-[var(--border)] bg-[var(--panel-bg)] shrink-0">
        {TABS.map((t) => {
          const live = LIVE_TABS.includes(t.key);
          return (
            <button
              key={t.key}
              onClick={() => {
                if (!live) return;
                setTab(t.key);
                track("tab-opened", { tab: t.key, project: projectId });
              }}
              disabled={!live}
              title={live ? undefined : "Available in the full product"}
              className={`text-[11px] px-2.5 py-1 rounded-md font-medium ${
                tab === t.key
                  ? "bg-[var(--iris)] text-white"
                  : live
                    ? "text-[var(--text-soft)] hover:bg-[var(--hover)]"
                    : "text-[var(--muted)] opacity-45 cursor-not-allowed"
              }`}
            >
              {t.label}
            </button>
          );
        })}
        <span className="mx-2 h-4 w-px bg-[var(--border)]" />
        <span className="text-[9px] font-bold tracking-widest text-[var(--muted)] uppercase">Views</span>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key)}
            className={`text-[10.5px] px-2 py-0.5 rounded-full border ${
              preset === p.key
                ? "border-[var(--iris)] bg-[var(--iris-soft)] text-[var(--iris)] font-semibold"
                : "border-transparent text-[var(--muted)] hover:border-[var(--border)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- body */}
      {!data || !idx ? (
        <div className="flex-1 grid place-items-center text-[12px] text-[var(--muted)]">
          Loading design graph…
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {tab === "explore" && (
            <>
              <KindPanel
                data={data}
                idx={idx}
                filters={filters}
                onChange={setFilters}
                aspectChoices={ASPECT_CHOICES}
              />
              <div className="flex-1 min-w-0 bg-[var(--canvas-bg)]">
                <GraphCanvas
                  data={data}
                  idx={idx}
                  filters={filters}
                  selectedId={selectedId}
                  spotlightId={spotlightId}
                  onSelect={select}
                />
              </div>
              <InspectorPanel idx={idx} node={selected} onSelect={select} />
            </>
          )}
          {tab === "architecture" && <ArchitectureView data={data} idx={idx} />}
          {tab === "sequences" && <SequencesView data={data} idx={idx} />}
          {tab === "requirements" && <RequirementsView data={data} idx={idx} />}
          {tab === "workunits" && <WorkUnitsView data={data} idx={idx} onSelectNode={jumpToNode} />}
          {tab === "files" && <FilesView data={data} idx={idx} onSelectNode={jumpToNode} />}
          {tab === "traverse" && <TraverseView data={data} idx={idx} initialId={selectedId} />}
        </div>
      )}
      {data && <Legend data={data} />}
    </div>
  );
}
