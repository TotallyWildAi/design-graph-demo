"use client";

import { useEffect, useState, type CSSProperties } from "react";

/** Pipeline infographic — collapsed to a one-line strip by default; expands
 * in place on click, and the stages light up in sequence as the reveal.
 * prefers-reduced-motion users get the finished state instantly. */

const STAGES: Array<{ icon: string; name: string; sub: string; color: string; note: string }> = [
  { icon: "👤", name: "Human brief", sub: "goals · decisions", color: "#64748b", note: "captured by" },
  { icon: "🤖", name: "BA agent", sub: "the intent", color: "#a855f7", note: "feeds" },
  { icon: "🏛️", name: "Architect", sub: "proposes the graph", color: "#8b5cf6", note: "through the" },
  { icon: "🛡️", name: "Verification gate", sub: "hard assertions — rejects contradictions", color: "#dc2626", note: "locks" },
];

const MINI = ["👤", "🤖", "🏛️", "🛡️", "🕸️", "⚙️", "✅"];

const step = (i: number): CSSProperties => ({ "--ig-i": i } as CSSProperties);

export function PitchInfographic() {
  const [expanded, setExpanded] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        aria-expanded={false}
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
          ⊞ See how it works
        </span>
      </button>
    );
  }

  return (
    <div
      data-ig={reduced ? "idle" : "play"}
      className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel-bg)] p-5 sm:p-7 relative"
    >
      <button
        onClick={() => setExpanded(false)}
        aria-expanded={true}
        title="Minimise"
        className="absolute top-2.5 right-3 text-[11px] font-bold text-[var(--muted)] hover:text-[var(--iris)]"
      >
        ⊟ minimise
      </button>

      {/* stage row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {STAGES.map((s, i) => (
          <div key={s.name} className="flex flex-col sm:flex-row items-center gap-2 sm:flex-1">
            <div
              className="ig-step w-full rounded-lg border px-3 py-2 text-center"
              style={{
                ...step(i),
                borderColor: s.color,
                background: `color-mix(in srgb, ${s.color} 10%, var(--panel-bg))`,
              }}
            >
              <div className="text-[16px] leading-none">{s.icon}</div>
              <div className="mt-1 text-[12px] font-bold leading-tight">{s.name}</div>
              <div className="text-[9.5px] text-[var(--muted)] leading-tight">{s.sub}</div>
            </div>
            <div
              className="ig-step shrink-0 text-[var(--muted)] text-[10px] flex sm:flex-col items-center gap-0.5"
              style={step(i + 0.4)}
            >
              <span className="hidden sm:block text-[14px] leading-none">→</span>
              <span className="sm:hidden text-[14px] leading-none">↓</span>
              <span className="whitespace-nowrap">{s.note}</span>
            </div>
          </div>
        ))}
        {/* the graph — centrepiece */}
        <div
          className="ig-step ig-graph rounded-xl border-2 px-4 py-3 text-center sm:min-w-[190px]"
          style={{
            ...step(4),
            borderColor: "var(--iris)",
            background: "color-mix(in srgb, #6e5ccc 14%, var(--panel-bg))",
            boxShadow: "0 4px 18px rgba(110,92,204,.25)",
          }}
        >
          <div className="text-[18px] leading-none">🕸️</div>
          <div className="mt-1 text-[13.5px] font-black leading-tight text-[var(--iris)]">
            THE VERIFIED GRAPH
          </div>
          <div className="mt-0.5 text-[9.5px] text-[var(--text-soft)] leading-snug">
            typed · mechanically proven · the source of truth
          </div>
          <div className="mt-1.5 inline-block rounded-full border border-[var(--iris)] px-2 py-0.5 text-[8.5px] font-bold text-[var(--iris)] tracking-wide">
            typed graphAPI
          </div>
        </div>
      </div>

      {/* fan-out row */}
      <div className="mt-3 flex flex-col sm:flex-row items-center gap-2 sm:pl-[55%]">
        <div className="ig-step shrink-0 text-[var(--muted)] text-[10px] flex sm:flex-col items-center gap-0.5" style={step(5.2)}>
          <span className="text-[14px] leading-none">↓</span>
          <span className="whitespace-nowrap">slices into pre-tested work units</span>
        </div>
      </div>
      <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="ig-step rounded-lg border px-2.5 py-1.5 text-center"
              style={{
                ...step(5.8 + i * 0.3),
                borderColor: "#10b981",
                background: "color-mix(in srgb, #10b981 10%, var(--panel-bg))",
              }}
            >
              <div className="text-[13px] leading-none">⚙️</div>
              <div className="text-[10px] font-bold leading-tight">Engineer {i}</div>
            </div>
          ))}
          <div className="ig-step self-center text-[11px] text-[var(--muted)] pl-1" style={step(7)}>
            ×N, in parallel
          </div>
        </div>
        <span className="ig-step text-[var(--muted)] text-[14px] leading-none rotate-90 sm:rotate-0" style={step(7.4)}>
          →
        </span>
        <div
          className="ig-step rounded-lg border px-3 py-2 text-center"
          style={{
            ...step(7.8),
            borderColor: "#0d9488",
            background: "color-mix(in srgb, #0d9488 10%, var(--panel-bg))",
          }}
        >
          <div className="text-[14px] leading-none">✅</div>
          <div className="text-[11.5px] font-bold leading-tight">Working system</div>
          <div className="text-[9.5px] text-[var(--muted)]">every unit arrives with its tests</div>
        </div>
      </div>

      <p
        className="ig-step mt-5 pt-4 border-t border-[var(--border)] text-center text-[11px] text-[var(--muted)]"
        style={step(8.6)}
      >
        Humans steer at the level of <strong className="text-[var(--text-soft)]">intent and structure</strong> — approving
        the decisions that matter while the gate enforces the thousand that don&apos;t.
      </p>
    </div>
  );
}
