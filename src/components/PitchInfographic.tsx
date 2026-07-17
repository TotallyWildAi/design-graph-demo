"use client";

import { useEffect, useState, type CSSProperties } from "react";

/** Pipeline infographic — a one-line strip in the page flow; clicking opens a
 * lightbox: the full three-tier infographic zooms in centred while the page
 * behind dims and blurs. The stage light-up sequence plays as the reveal.
 * Escape / ✕ / backdrop click closes. prefers-reduced-motion gets the
 * finished state instantly. */

const step = (i: number): CSSProperties => ({ "--ig-i": i } as CSSProperties);

/** Opaque pastel — alpha fills would let the blurred page ghost through. */
const pastel = (hex: string, pct = 10) => `color-mix(in srgb, ${hex} ${pct}%, var(--panel-bg))`;

const MINI = ["👤", "🤖", "🏛️", "🛡️", "🕸️", "👩‍💻", "✅"];

const TIER1: Array<{ icon: string; name: string; sub: string; color: string; note?: string }> = [
  { icon: "👤", name: "Human brief", sub: "goals · decisions", color: "#64748b", note: "captured by" },
  { icon: "🤖", name: "BA agent", sub: "captures the intent", color: "#a855f7", note: "feeds" },
  { icon: "🏛️", name: "Architect", sub: "proposes the graph", color: "#8b5cf6", note: "through the" },
  { icon: "🛡️", name: "Verification gate", sub: "hard assertions — rejects anything that contradicts them", color: "#dc2626" },
];

/** What the graph contains — the demo's node-kind vocabulary. */
const NODE_CHIPS: Array<{ icon: string; label: string; color: string }> = [
  { icon: "📦", label: "services", color: "#3b82f6" },
  { icon: "🧩", label: "components", color: "#10b981" },
  { icon: "🔷", label: "classes", color: "#f59e0b" },
  { icon: "⚙️", label: "methods", color: "#6366f1" },
  { icon: "🗄️", label: "tables", color: "#e11d48" },
  { icon: "📋", label: "contracts", color: "#fb923c" },
  { icon: "🌐", label: "endpoints", color: "#06b6d4" },
  { icon: "📌", label: "requirements", color: "#a855f7" },
];

const ENGINEERS: Array<{ icon: string; line: string }> = [
  { icon: "👩‍💻", line: "queries the graphAPI for exact context" },
  { icon: "🧑‍💻", line: "writes code until the spec’s tests pass" },
  { icon: "👨‍💻", line: "never greps — walks the edges and asks" },
];

/** Large emoji arrow between stages — horizontal on desktop, down when stacked. */
function Arrow({ i, label, down = false }: { i: number; label?: string; down?: boolean }) {
  return (
    <div
      className="ig-step shrink-0 flex sm:flex-col items-center justify-center gap-1 text-[var(--muted)]"
      style={step(i)}
    >
      {down ? (
        <span className="text-[24px] leading-none">⬇️</span>
      ) : (
        <>
          <span className="hidden sm:block text-[24px] leading-none">➡️</span>
          <span className="sm:hidden text-[24px] leading-none">⬇️</span>
        </>
      )}
      {label && <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>}
    </div>
  );
}

export function PitchInfographic() {
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
    <>
      <button
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="mt-6 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-bg)] px-5 py-4 flex items-center gap-3 hover:border-[var(--iris)] group text-left"
      >
        <span className="flex items-center gap-1.5 text-[15px] shrink-0">
          {MINI.map((m, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[var(--muted)] text-[11px]">→</span>}
              <span className={m === "🕸️" ? "rounded-md border border-[var(--iris)] bg-[var(--iris-soft)] px-1" : ""}>{m}</span>
            </span>
          ))}
        </span>
        <span className="min-w-0 text-[13px] text-[var(--text-soft)] truncate">
          Brief → agents → <strong className="text-[var(--iris)]">verified graph</strong> → parallel build
        </span>
        <span className="ml-auto shrink-0 text-[12px] font-bold text-[var(--iris)] group-hover:underline whitespace-nowrap">
          ⤢ See how it works
        </span>
      </button>

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
          aria-label="How the platform works"
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

            {/* ================= Tier 1 — intent to locked graph ================= */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {TIER1.map((s, i) => (
                <div key={s.name} className="flex flex-col sm:flex-row items-center gap-2.5 sm:flex-1">
                  <div
                    className="ig-step w-full rounded-xl border px-3 py-3 text-center"
                    style={{ ...step(i), borderColor: s.color, background: pastel(s.color) }}
                  >
                    <div className="text-[22px] leading-none">{s.icon}</div>
                    <div className="mt-1.5 text-[13.5px] font-bold leading-tight">{s.name}</div>
                    <div className="mt-0.5 text-[10.5px] text-[var(--muted)] leading-snug">{s.sub}</div>
                  </div>
                  {s.note !== undefined ? <Arrow i={i + 0.5} label={s.note} /> : null}
                </div>
              ))}
            </div>

            <div className="mt-2 flex justify-center">
              <Arrow i={3.6} label="locks" down />
            </div>

            {/* ================= Tier 2 — THE VERIFIED GRAPH ================= */}
            <div
              className="ig-step ig-graph mt-2 rounded-2xl border-2 px-5 py-5 text-center"
              style={{
                ...step(4.2),
                borderColor: "var(--iris)",
                background: pastel("#6e5ccc", 14),
                boxShadow: "0 4px 18px rgba(110,92,204,.25)",
              }}
            >
              <div className="text-[24px] leading-none">🕸️</div>
              <div className="mt-1 text-[17px] font-black leading-tight text-[var(--iris)] tracking-wide">
                THE VERIFIED GRAPH
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                typed · mechanically proven · the source of truth
              </div>

              <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
                {NODE_CHIPS.map((c, i) => (
                  <span
                    key={c.label}
                    className="ig-step inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-bold"
                    style={{ ...step(4.7 + i * 0.12), borderColor: c.color, background: pastel(c.color), color: "var(--text)" }}
                  >
                    <span className="text-[12px] leading-none">{c.icon}</span>
                    {c.label}
                  </span>
                ))}
              </div>

              <div
                className="ig-step mx-auto mt-3.5 inline-block rounded-lg border border-[var(--border)] px-3 py-1.5 font-mono text-[11px] text-[var(--text-soft)]"
                style={{ ...step(6), background: pastel("#6e5ccc", 5) }}
              >
                <span className="text-[var(--muted)]">walk the edges:&nbsp;</span>
                request <span aria-hidden>➡️</span> endpoint <span aria-hidden>➡️</span> method{" "}
                <span aria-hidden>➡️</span> query <span aria-hidden>➡️</span> column
              </div>

              <div className="ig-step mt-3 flex flex-wrap justify-center gap-1.5" style={step(6.3)}>
                <span className="rounded-full border border-[var(--iris)] px-2.5 py-0.5 text-[9.5px] font-bold text-[var(--iris)] tracking-wide">
                  typed graphAPI
                </span>
                <span className="rounded-full border border-[var(--iris)] px-2.5 py-0.5 text-[9.5px] font-bold text-[var(--iris)] tracking-wide">
                  golden snapshots · hard invariants
                </span>
              </div>
            </div>

            <div className="mt-2 flex justify-center">
              <Arrow i={6.7} label="the graph slices into work units" down />
            </div>

            {/* ============ Tier 3 — spec-driven development to shipped ============ */}
            <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <div
                className="ig-step rounded-xl border border-dashed px-4 py-3 text-left sm:max-w-[240px]"
                style={{ ...step(7.1), borderColor: "#fb923c", background: pastel("#fb923c", 8) }}
              >
                <div className="text-[10px] font-black tracking-widest text-[#fb923c] uppercase">Work unit</div>
                <ul className="mt-1.5 space-y-1 text-[11.5px] text-[var(--text-soft)]">
                  <li>📋 the spec</li>
                  <li>✅ failing tests included</li>
                  <li>🎯 narrow, precise context</li>
                </ul>
                <div className="mt-2 pt-2 border-t border-dashed border-[#fb923c] text-[9.5px] text-[var(--muted)] leading-snug">
                  TDD by construction: every unit arrives with its spec and its tests
                </div>
              </div>

              <Arrow i={7.5} label="picked up by" />

              <div className="flex flex-col gap-1.5">
                {ENGINEERS.map((e, i) => (
                  <div
                    key={e.icon}
                    className="ig-step flex items-center gap-2.5 rounded-xl border px-3 py-2"
                    style={{ ...step(7.8 + i * 0.25), borderColor: "#10b981", background: pastel("#10b981") }}
                  >
                    <span className="text-[20px] leading-none">{e.icon}</span>
                    <div className="text-left">
                      <div className="text-[11.5px] font-bold leading-tight">Engineer agent</div>
                      <div className="text-[10px] text-[var(--muted)] leading-snug">{e.line}</div>
                    </div>
                  </div>
                ))}
                <div className="ig-step text-center text-[10.5px] font-medium text-[var(--muted)]" style={step(8.6)}>
                  ×N, in parallel
                </div>
              </div>

              <Arrow i={8.8} />

              <div
                className="ig-step rounded-xl border px-3.5 py-2.5 sm:max-w-[190px] text-left"
                style={{ ...step(9), borderColor: "#d97706", background: pastel("#d97706", 8) }}
              >
                <div className="text-[16px] leading-none">↩️</div>
                <div className="mt-1 text-[10.5px] text-[var(--text-soft)] leading-snug">
                  results proven back against the graph — snapshots catch drift
                </div>
              </div>

              <Arrow i={9.3} label="ships" />

              <div
                className="ig-step rounded-xl border px-4 py-3 text-center sm:max-w-[200px]"
                style={{ ...step(9.6), borderColor: "#0d9488", background: pastel("#0d9488") }}
              >
                <div className="text-[20px] leading-none">✅</div>
                <div className="mt-1 text-[13.5px] font-bold leading-tight">Working system</div>
                <div className="mt-0.5 text-[10px] text-[var(--muted)] leading-snug">
                  every requirement traced · every flow followed end to end
                </div>
              </div>
            </div>

            <p
              className="ig-step mt-6 pt-4 border-t border-[var(--border)] text-center text-[12px] text-[var(--muted)]"
              style={step(10.2)}
            >
              Humans steer at the level of <strong className="text-[var(--text-soft)]">intent and structure</strong> — approving
              the decisions that matter while the gate enforces the thousand that don&apos;t.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
