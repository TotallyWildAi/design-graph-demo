"use client";

import { useEffect, useState, type CSSProperties } from "react";

/** ERP use-case section — collapsed strip in the page flow; clicking opens a
 * lightbox with a three-tier infographic: ERP-as-a-graph, queryable security
 * invariants, and the three go-to-market wedges. Same mechanics as
 * PitchInfographic: blurred scrim (inline backdrop-filter — the CSS pipeline
 * strips it from stylesheets), staggered light-up, Escape/backdrop/✕ close,
 * scroll lock, reduced-motion gets the finished state. */

const step = (i: number): CSSProperties => ({ "--ig-i": i } as CSSProperties);

/** Opaque pastel — alpha fills would let the blurred page ghost through. */
const pastel = (hex: string, pct = 10) => `color-mix(in srgb, ${hex} ${pct}%, var(--panel-bg))`;

const MODULES: Array<{ icon: string; label: string; color: string }> = [
  { icon: "💰", label: "General Ledger", color: "#3b82f6" },
  { icon: "🧾", label: "AP / AR", color: "#fb923c" },
  { icon: "📦", label: "Inventory", color: "#10b981" },
  { icon: "🛒", label: "Procurement", color: "#06b6d4" },
  { icon: "👥", label: "HR & Payroll", color: "#a855f7" },
  { icon: "🏭", label: "MRP", color: "#6366f1" },
];

const INVARIANTS: Array<{ icon: string; title: string; mono?: string; body: string; caption: string; color: string }> = [
  {
    icon: "🔐",
    title: "Segregation of duties",
    mono: "reach(role, create-vendor) ∩ reach(role, approve-payment) = ∅",
    body: "",
    caption: "the classic ERP audit rule, enforced by the verification gate before code exists",
    color: "#dc2626",
  },
  {
    icon: "🔍",
    title: "Data lineage",
    mono: "salary ➡ every path: endpoint ➡ method ➡ query ➡ column",
    body: "",
    caption: "GDPR / SOX answers are graph traversals, not archaeology",
    color: "#06b6d4",
  },
  {
    icon: "🚪",
    title: "Authorization coverage",
    mono: "",
    body: "every endpoint provably behind a SECURES edge — or the graph refuses to lock",
    caption: "coverage is an invariant, not a hope",
    color: "#f59e0b",
  },
];

const WEDGES: Array<{ icon: string; title: string; body: string; color: string }> = [
  {
    icon: "🏗️",
    title: "Vertical ERP in months",
    body: "Greenfield for niches the incumbents overserve — derived from the reusable knowledge layer.",
    color: "#10b981",
  },
  {
    icon: "🧩",
    title: "Governed extensions",
    body: "Customizations on an existing ERP, proposed and proven against the core graph.",
    color: "#8b5cf6",
  },
  {
    icon: "♻️",
    title: "Legacy modernization",
    body: "Ingest the existing system ➡ reconcile intent vs reality ➡ every future change becomes analyzable.",
    color: "#0d9488",
  },
];

function TierLabel({ i, children }: { i: number; children: React.ReactNode }) {
  return (
    <div
      className="ig-step text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--muted)] text-center"
      style={step(i)}
    >
      {children}
    </div>
  );
}

export function ErpUseCase() {
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Scroll lock + Escape while the lightbox is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section className="py-10 border-t border-[var(--border)]">
      <h2 className="text-[12px] font-bold tracking-[0.12em] uppercase text-[var(--muted)]">
        What could you build with this? — flagship use case: ERP
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-soft)] max-w-2xl">
        An ERP is the coordination problem at its extreme — hundreds of interconnected modules
        maintained for decades by people who weren&apos;t there when it was built: exactly the
        system that quietly rots. And ERP logic is decades of well-understood know-how —
        double-entry, three-way match, approval chains — composed at scale. That is precisely
        what the <strong className="text-[var(--text)]">knowledge layer → instance layer</strong>{" "}
        derivation is for.
      </p>

      <button
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="mt-6 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-bg)] px-5 py-4 flex items-center gap-3 hover:border-[var(--iris)] group text-left"
      >
        <span className="flex items-center gap-1.5 text-[15px] shrink-0">
          {MODULES.map((m, i) => (
            <span key={m.label} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[var(--muted)] text-[11px]">→</span>}
              <span>{m.icon}</span>
            </span>
          ))}
          <span className="text-[var(--muted)] text-[10px] px-0.5">on</span>
          <span className="rounded-md border border-[var(--iris)] bg-[var(--iris-soft)] px-1">🕸️</span>
        </span>
        <span className="min-w-0 text-[13px] text-[var(--text-soft)] truncate">
          An <strong className="text-[var(--iris)]">AI-native, secure-by-design ERP</strong> on the verified graph
        </span>
        <span className="ml-auto shrink-0 text-[12px] font-bold text-[var(--iris)] group-hover:underline whitespace-nowrap">
          ⤢ Explore the use case
        </span>
      </button>

      <p className="mt-4 text-[14px] text-[var(--muted)] italic">
        Compliance stops being a cost. It becomes a mechanical property of the graph.
      </p>

      {open && (
        <div
          className="ig-overlay"
          // Inline because the CSS build pipeline strips backdrop-filter.
          style={{
            backdropFilter: "blur(10px) saturate(0.85)",
            WebkitBackdropFilter: "blur(10px) saturate(0.85)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="ERP on the verified graph"
        >
          <div
            data-ig={reduced ? "idle" : "play"}
            className="ig-panel rounded-2xl border border-[var(--border)] bg-[var(--panel-bg)] p-6 sm:p-9 relative shadow-2xl"
          >
            <button
              onClick={() => setOpen(false)}
              title="Close (Esc)"
              autoFocus
              className="absolute top-3 right-4 w-7 h-7 grid place-items-center rounded-full border border-[var(--border)] text-[13px] text-[var(--muted)] hover:border-[var(--iris)] hover:text-[var(--iris)] z-10"
            >
              ✕
            </button>

            {/* ============ Tier A — an ERP is a graph ============ */}
            <TierLabel i={0}>An ERP is a graph — whether you admit it or not</TierLabel>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {MODULES.map((m, i) => (
                <div
                  key={m.label}
                  className="ig-step rounded-xl border px-3.5 py-2.5 text-center"
                  style={{ ...step(0.3 + i * 0.25), borderColor: m.color, background: pastel(m.color) }}
                >
                  <div className="text-[20px] leading-none">{m.icon}</div>
                  <div className="mt-1 text-[12px] font-bold leading-tight">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="ig-step mt-2 text-center text-[10.5px] font-medium text-[var(--muted)]" style={step(2)}>
              typed contracts between every module
            </div>
            <div className="ig-step mt-1 flex justify-center" style={step(2.2)}>
              <span className="text-[24px] leading-none">⬇️</span>
            </div>
            <div
              className="ig-step ig-graph mt-1 rounded-2xl border-2 px-5 py-4 text-center"
              style={{
                ...step(2.5),
                borderColor: "var(--iris)",
                background: pastel("#6e5ccc", 14),
                boxShadow: "0 4px 18px rgba(110,92,204,.25)",
              }}
            >
              <span className="text-[20px] leading-none align-middle">🕸️</span>
              <span className="ml-2 text-[15px] font-black text-[var(--iris)] tracking-wide align-middle">
                THE VERIFIED GRAPH
              </span>
              <div className="mt-1 text-[10.5px] text-[var(--text-soft)]">
                every module, endpoint, table, column and permission — one mechanically proven model
              </div>
            </div>

            {/* ============ Tier B — queryable invariants ============ */}
            <div className="mt-6">
              <TierLabel i={3}>Secure by design means invariants you can query</TierLabel>
            </div>
            <div className="mt-3 grid sm:grid-cols-3 gap-2.5">
              {INVARIANTS.map((c, i) => (
                <div
                  key={c.title}
                  className="ig-step rounded-xl border px-3.5 py-3"
                  style={{ ...step(3.3 + i * 0.3), borderColor: c.color, background: pastel(c.color, 8) }}
                >
                  <div className="text-[18px] leading-none">{c.icon}</div>
                  <div className="mt-1.5 text-[12.5px] font-bold leading-tight">{c.title}</div>
                  {c.mono ? (
                    <div className="mt-1.5 font-mono text-[9.5px] leading-snug text-[var(--text-soft)] break-words">
                      {c.mono}
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[10.5px] leading-snug text-[var(--text-soft)]">{c.body}</div>
                  )}
                  <div className="mt-1.5 text-[9.5px] text-[var(--muted)] leading-snug">{c.caption}</div>
                </div>
              ))}
            </div>

            {/* ============ Tier C — three ways in ============ */}
            <div className="mt-6">
              <TierLabel i={4.4}>Three ways in</TierLabel>
            </div>
            <div className="mt-3 grid sm:grid-cols-3 gap-2.5">
              {WEDGES.map((w, i) => (
                <div
                  key={w.title}
                  className="ig-step rounded-xl border px-3.5 py-3 text-center"
                  style={{ ...step(4.7 + i * 0.3), borderColor: w.color, background: pastel(w.color) }}
                >
                  <div className="text-[20px] leading-none">{w.icon}</div>
                  <div className="mt-1.5 text-[12.5px] font-bold leading-tight">{w.title}</div>
                  <div className="mt-1 text-[10.5px] leading-snug text-[var(--text-soft)]">{w.body}</div>
                </div>
              ))}
            </div>

            <div
              className="ig-step mt-4 rounded-xl border border-dashed px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 text-center"
              style={{ ...step(5.8), borderColor: "var(--iris)", background: pastel("#6e5ccc", 6) }}
            >
              <span className="text-[18px] leading-none">🤖</span>
              <span className="text-[11.5px] text-[var(--text-soft)]">
                <strong className="text-[var(--text)]">Operational agents</strong> — invoice matching ·
                reconciliation · exception handling — act through the same typed graphAPI at runtime.
              </span>
              <span className="text-[10.5px] font-semibold text-[var(--iris)] whitespace-nowrap">
                AI-native = agents work from the verified model, not screen-scraping
              </span>
            </div>

            <p
              className="ig-step mt-5 pt-4 border-t border-[var(--border)] text-center text-[12px] text-[var(--muted)]"
              style={step(6.3)}
            >
              ERP-class systems buildable in months and auditable forever —{" "}
              <strong className="text-[var(--text-soft)]">compliance as a mechanical property of the graph</strong>.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
