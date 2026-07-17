"use client";

import { useEffect, useState, type CSSProperties } from "react";

/** Pipeline infographic — a one-line strip in the page flow; clicking opens a
 * lightbox: the full infographic zooms in centred while the page behind dims
 * and blurs. The stage light-up sequence plays as the reveal. Escape / ✕ /
 * backdrop click closes. prefers-reduced-motion gets the finished state. */

const STAGES: Array<{ icon: string; name: string; sub: string; color: string; note: string }> = [
  { icon: "👤", name: "Human brief", sub: "goals · decisions", color: "#64748b", note: "captured by" },
  { icon: "🤖", name: "BA agent", sub: "the intent", color: "#a855f7", note: "feeds" },
  { icon: "🏛️", name: "Architect", sub: "proposes the graph", color: "#8b5cf6", note: "through the" },
  { icon: "🛡️", name: "Verification gate", sub: "hard assertions — rejects contradictions", color: "#dc2626", note: "locks" },
];

const MINI = ["👤", "🤖", "🏛️", "🛡️", "🕸️", "⚙️", "✅"];

const step = (i: number): CSSProperties => ({ "--ig-i": i } as CSSProperties);

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
              className="absolute top-3 right-4 w-7 h-7 grid place-items-center rounded-full border border-[var(--border)] text-[13px] text-[var(--muted)] hover:border-[var(--iris)] hover:text-[var(--iris)]"
            >
              ✕
            </button>

            {/* stage row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {STAGES.map((s, i) => (
                <div key={s.name} className="flex flex-col sm:flex-row items-center gap-2.5 sm:flex-1">
                  <div
                    className="ig-step w-full rounded-lg border px-3 py-2.5 text-center"
                    style={{
                      ...step(i),
                      borderColor: s.color,
                      background: `color-mix(in srgb, ${s.color} 10%, var(--panel-bg))`,
                    }}
                  >
                    <div className="text-[18px] leading-none">{s.icon}</div>
                    <div className="mt-1 text-[13px] font-bold leading-tight">{s.name}</div>
                    <div className="text-[10.5px] text-[var(--muted)] leading-tight">{s.sub}</div>
                  </div>
                  <div
                    className="ig-step shrink-0 text-[var(--muted)] text-[10.5px] flex sm:flex-col items-center gap-0.5"
                    style={step(i + 0.4)}
                  >
                    <span className="hidden sm:block text-[15px] leading-none">→</span>
                    <span className="sm:hidden text-[15px] leading-none">↓</span>
                    <span className="whitespace-nowrap">{s.note}</span>
                  </div>
                </div>
              ))}
              {/* the graph — centrepiece */}
              <div
                className="ig-step ig-graph rounded-xl border-2 px-5 py-4 text-center sm:min-w-[210px]"
                style={{
                  ...step(4),
                  borderColor: "var(--iris)",
                  background: "color-mix(in srgb, #6e5ccc 14%, var(--panel-bg))",
                  boxShadow: "0 4px 18px rgba(110,92,204,.25)",
                }}
              >
                <div className="text-[20px] leading-none">🕸️</div>
                <div className="mt-1 text-[14.5px] font-black leading-tight text-[var(--iris)]">
                  THE VERIFIED GRAPH
                </div>
                <div className="mt-0.5 text-[10.5px] text-[var(--text-soft)] leading-snug">
                  typed · mechanically proven · the source of truth
                </div>
                <div className="mt-1.5 inline-block rounded-full border border-[var(--iris)] px-2 py-0.5 text-[9px] font-bold text-[var(--iris)] tracking-wide">
                  typed graphAPI
                </div>
              </div>
            </div>

            {/* fan-out row */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 sm:pl-[55%]">
              <div className="ig-step shrink-0 text-[var(--muted)] text-[10.5px] flex sm:flex-col items-center gap-0.5" style={step(5.2)}>
                <span className="text-[15px] leading-none">↓</span>
                <span className="whitespace-nowrap">slices into pre-tested work units</span>
              </div>
            </div>
            <div className="mt-2.5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="ig-step rounded-lg border px-3 py-2 text-center"
                    style={{
                      ...step(5.8 + i * 0.3),
                      borderColor: "#10b981",
                      background: "color-mix(in srgb, #10b981 10%, var(--panel-bg))",
                    }}
                  >
                    <div className="text-[14px] leading-none">⚙️</div>
                    <div className="text-[11px] font-bold leading-tight">Engineer {i}</div>
                  </div>
                ))}
                <div className="ig-step self-center text-[12px] text-[var(--muted)] pl-1" style={step(7)}>
                  ×N, in parallel
                </div>
              </div>
              <span className="ig-step text-[var(--muted)] text-[15px] leading-none rotate-90 sm:rotate-0" style={step(7.4)}>
                →
              </span>
              <div
                className="ig-step rounded-lg border px-4 py-2.5 text-center"
                style={{
                  ...step(7.8),
                  borderColor: "#0d9488",
                  background: "color-mix(in srgb, #0d9488 10%, var(--panel-bg))",
                }}
              >
                <div className="text-[15px] leading-none">✅</div>
                <div className="text-[12.5px] font-bold leading-tight">Working system</div>
                <div className="text-[10.5px] text-[var(--muted)]">every unit arrives with its tests</div>
              </div>
            </div>

            <p
              className="ig-step mt-6 pt-4 border-t border-[var(--border)] text-center text-[12px] text-[var(--muted)]"
              style={step(8.6)}
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
