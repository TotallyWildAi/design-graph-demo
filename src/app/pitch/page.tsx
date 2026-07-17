import Link from "next/link";

export const metadata = {
  title: "Totally Wild AI — Own the architecture, not the output",
  description:
    "Stop reviewing AI-generated code. Manage a verified model of the system instead — and see it live in the Design Graph demo.",
};

const ARTICLE_URL =
  "https://www.linkedin.com/pulse/i-stopped-managing-ai-generated-code-manage-verified-model-kislov-lhiac/";

const PROBLEMS = [
  {
    title: "Drift",
    body: "As a model keeps coding, it quietly forgets what was true at the start. Systems grow, prompts drop details, and everyone loses the thread.",
  },
  {
    title: "Code stops being the source of truth",
    body: "Once a model has written thousands of lines no human can hold in their head, code is the output — not the intent. Ask “why is this here?” and it shrugs.",
  },
  {
    title: "Every edit is a silent bet",
    body: "Did it break a contract three files away? You find out later.",
  },
  {
    title: "A losing race",
    body: "Reviewing generated code at LLM speed with human eyes doesn’t scale — and never will.",
  },
];

const UNLOCKS = [
  {
    title: "A source of truth that isn’t the code",
    body: "The graph knows what every piece is for, what it depends on, and what it’s forbidden from doing.",
  },
  {
    title: "Blast radius is a query, not a prayer",
    body: "“What breaks if I touch this?” has an answer before you touch it.",
  },
  {
    title: "Nothing dangles",
    body: "Every requirement traces to the code that satisfies it; every data flow is followed end to end — request → endpoint → method → query → column — across every service boundary.",
  },
  {
    title: "Correctness is mechanical, not vibes",
    body: "Tasks derive from the verified graph and arrive carrying their own tests. Golden snapshots catch regressions in the shape of the whole system.",
  },
  {
    title: "Work decomposes deterministically",
    body: "The verified graph slices into precise, independent, pre-tested units of work. Engineer agents run them in parallel; humans steer the decisions that matter.",
  },
  {
    title: "The human scales",
    body: "Stop absorbing 10,000 lines a day. Drive a model you can hold in your head — approve the decisions that matter, let the machine enforce the thousand that don’t.",
  },
];

/** Pipeline infographic — stages styled like the demo's graph cards. */
const STAGES: Array<{ icon: string; name: string; sub: string; color: string; note: string }> = [
  { icon: "👤", name: "Human brief", sub: "goals · decisions", color: "#64748b", note: "captured by" },
  { icon: "🤖", name: "BA agent", sub: "the intent", color: "#a855f7", note: "feeds" },
  { icon: "🏛️", name: "Architect", sub: "proposes the graph", color: "#8b5cf6", note: "through the" },
  { icon: "🛡️", name: "Verification gate", sub: "hard assertions — rejects contradictions", color: "#dc2626", note: "locks" },
];

function Infographic() {
  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel-bg)] p-5 sm:p-7">
      {/* stage row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {STAGES.map((s) => (
          <div key={s.name} className="flex flex-col sm:flex-row items-center gap-2 sm:flex-1">
            <div
              className="w-full rounded-lg border px-3 py-2 text-center"
              style={{
                borderColor: s.color,
                background: `color-mix(in srgb, ${s.color} 10%, var(--panel-bg))`,
              }}
            >
              <div className="text-[16px] leading-none">{s.icon}</div>
              <div className="mt-1 text-[12px] font-bold leading-tight">{s.name}</div>
              <div className="text-[9.5px] text-[var(--muted)] leading-tight">{s.sub}</div>
            </div>
            <div className="shrink-0 text-[var(--muted)] text-[10px] flex sm:flex-col items-center gap-0.5">
              <span className="hidden sm:block text-[14px] leading-none">→</span>
              <span className="sm:hidden text-[14px] leading-none">↓</span>
              <span className="whitespace-nowrap">{s.note}</span>
            </div>
          </div>
        ))}
        {/* the graph — centrepiece */}
        <div
          className="rounded-xl border-2 px-4 py-3 text-center sm:min-w-[190px]"
          style={{
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
        <div className="shrink-0 text-[var(--muted)] text-[10px] flex sm:flex-col items-center gap-0.5">
          <span className="text-[14px] leading-none">↓</span>
          <span className="whitespace-nowrap">slices into pre-tested work units</span>
        </div>
      </div>
      <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border px-2.5 py-1.5 text-center"
              style={{ borderColor: "#10b981", background: "color-mix(in srgb, #10b981 10%, var(--panel-bg))" }}
            >
              <div className="text-[13px] leading-none">⚙️</div>
              <div className="text-[10px] font-bold leading-tight">Engineer {i}</div>
            </div>
          ))}
          <div className="self-center text-[11px] text-[var(--muted)] pl-1">×N, in parallel</div>
        </div>
        <span className="text-[var(--muted)] text-[14px] leading-none rotate-90 sm:rotate-0">→</span>
        <div
          className="rounded-lg border px-3 py-2 text-center"
          style={{ borderColor: "#0d9488", background: "color-mix(in srgb, #0d9488 10%, var(--panel-bg))" }}
        >
          <div className="text-[14px] leading-none">✅</div>
          <div className="text-[11.5px] font-bold leading-tight">Working system</div>
          <div className="text-[9.5px] text-[var(--muted)]">every unit arrives with its tests</div>
        </div>
      </div>

      <p className="mt-5 pt-4 border-t border-[var(--border)] text-center text-[11px] text-[var(--muted)]">
        Humans steer at the level of <strong className="text-[var(--text-soft)]">intent and structure</strong> — approving
        the decisions that matter while the gate enforces the thousand that don&apos;t.
      </p>
    </div>
  );
}

const TABS = [
  ["Explore", "the whole system as a C4 overview — double-click any container to dive to its internals, hover to trace wiring"],
  ["Architecture", "the solution as container lanes with plain-English relationships"],
  ["Sequences", "call chains derived from the graph, UI → endpoint → service → table"],
  ["Requirements", "every requirement traced to the production code that satisfies it"],
  ["Work Units", "the build plan, wave by wave, derived from the graph"],
  ["Files", "the planned file tree with delivery status"],
  ["Traverse", "walk the graph node by node with an engineer briefing"],
];

export default function PitchPage() {
  return (
    <div className="min-h-screen bg-[var(--canvas-bg)] text-[var(--text)]">
      {/* ------------------------------------------------------------ nav */}
      <nav className="flex items-center gap-3 px-6 h-14 border-b border-[var(--border)] bg-[var(--panel-bg)] sticky top-0 z-10">
        <span className="w-7 h-7 rounded-md grid place-items-center text-white text-[12px] font-black bg-[var(--iris)]">
          TW
        </span>
        <span className="font-bold text-[15px]">Totally Wild AI</span>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={ARTICLE_URL}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-soft)] hover:border-[var(--iris)] hover:text-[var(--iris)]"
          >
            Read the article
          </a>
          <Link
            href="/"
            className="text-[12px] font-semibold px-3 py-1.5 rounded-md text-white bg-[var(--iris)] hover:opacity-90"
          >
            Open the live demo →
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pb-24">
        {/* ----------------------------------------------------------- hero */}
        <header className="pt-16 pb-12">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--iris)]">
            The bet we made
          </p>
          <h1 className="mt-3 text-[34px] leading-[1.15] font-bold tracking-tight text-balance">
            Stop reviewing the output. Own the architecture the output is
            generated from.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--text-soft)] max-w-xl">
            An LLM can generate thousands of lines before your coffee is cold.
            That was never the hard part. The constraint has moved: it&apos;s
            comprehension and control of a large, interconnected body of logic.
            So we stopped managing AI-generated code — and built a platform
            that manages a <strong className="text-[var(--text)]">verified model</strong> of it instead.
          </p>
          <div className="mt-7 flex gap-3 flex-wrap">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg text-[14px] font-bold text-white bg-[var(--iris)] hover:opacity-90"
            >
              See a real verified graph →
            </Link>
            <a
              href={ARTICLE_URL}
              className="px-5 py-2.5 rounded-lg text-[14px] font-semibold border border-[var(--border)] bg-[var(--panel-bg)] text-[var(--text-soft)] hover:border-[var(--iris)] hover:text-[var(--iris)]"
            >
              The full thesis on LinkedIn
            </a>
          </div>
        </header>

        {/* -------------------------------------------------- the problem */}
        <section className="py-10 border-t border-[var(--border)]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] uppercase text-[var(--muted)]">
            Why reviewing generated code fails
          </h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-4">
                <h3 className="text-[14px] font-bold">{p.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-soft)]">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- the graph */}
        <section className="py-10 border-t border-[var(--border)]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] uppercase text-[var(--muted)]">
            The Graph — and the graphAPI
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-soft)] max-w-2xl">
            Before a single file is written, an <strong className="text-[var(--text)]">Architect agent</strong> builds
            a complete architecture graph — a typed, mechanically verified model of the whole
            solution, resolved down to the smallest units of logic. Not a diagram you draw once
            and forget: a living graph that is the source of truth, continuously proven against
            hard invariants. A <strong className="text-[var(--text)]">BA agent</strong> captures the brief; a
            verification gate locks the proposed graph with hard assertions; a pool of
            <strong className="text-[var(--text)]"> Engineer agents</strong> builds against it in parallel —
            every interaction through a typed graphAPI, so humans, agents and tools all ask the
            same source of truth instead of parsing code.
          </p>
          <Infographic />
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {UNLOCKS.map((u) => (
              <div key={u.title} className="rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-4">
                <h3 className="text-[14px] font-bold text-[var(--iris)]">{u.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-soft)]">{u.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- live demo */}
        <section className="py-10 border-t border-[var(--border)]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] uppercase text-[var(--muted)]">
            See it live — a real graph the platform produced
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-soft)] max-w-2xl">
            The demo on this domain is the platform&apos;s Design Graph explorer loaded with a
            complete verified design — every node typed, every edge earned. Seven views over
            one graph:
          </p>
          <ul className="mt-5 space-y-2">
            {TABS.map(([name, desc]) => (
              <li key={name} className="flex gap-3 items-baseline text-[14px]">
                <span className="shrink-0 w-28 font-bold">{name}</span>
                <span className="text-[var(--text-soft)]">{desc}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="mt-7 inline-block px-5 py-2.5 rounded-lg text-[14px] font-bold text-white bg-[var(--iris)] hover:opacity-90"
          >
            Open the Design Graph →
          </Link>
        </section>

        {/* -------------------------------------------------- the room */}
        <section className="py-10 border-t border-[var(--border)]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] uppercase text-[var(--muted)]">
            From the discussion
          </h2>
          <figure className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-5">
            <blockquote className="text-[14.5px] leading-relaxed text-[var(--text-soft)]">
              &ldquo;Code is just the output; the architecture and intent are what actually
              matter. Trying to review AI code at LLM speed is impossible. It&apos;s no different
              than a compiled language — we don&apos;t read the raw assembly output, we verify the
              source and run the tests. Treating AI-generated code as an ephemeral compilation
              target while managing a mechanically verified model of the system instead is{" "}
              <strong className="text-[var(--text)]">the future of engineering</strong>.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-[12.5px] text-[var(--muted)]">
              — Christopher Langton, Founder @ Vulnetix, commenting on{" "}
              <a href={ARTICLE_URL} className="text-[var(--iris)] hover:underline">
                the launch article
              </a>
            </figcaption>
          </figure>
          <figure className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-5">
            <blockquote className="text-[14.5px] leading-relaxed text-[var(--text-soft)]">
              &ldquo;We acknowledged that driving coding agents manually day-to-day is
              inefficient — it leads to errors, constant drift and forgetfulness on bigger
              pieces of work. We don&apos;t want to put every aspect of engineering into markdown
              files and drag massive context through the solution, burning tokens and diluting
              the signal. Good solid architecture and precise, dynamic context generation is
              the way to go.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-[12.5px] text-[var(--muted)]">
              — Dmitry Kislov, Co-Founder &amp; CEO, Totally Wild AI
            </figcaption>
          </figure>
        </section>

        {/* ------------------------------------------------------ closing */}
        <section className="py-12 border-t border-[var(--border)] text-center">
          <p className="text-[18px] font-bold text-balance max-w-xl mx-auto">
            The teams that win the next few years won&apos;t be the ones who generate the most
            code — they&apos;ll be the ones who keep generated logic under control.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block px-6 py-3 rounded-lg text-[15px] font-bold text-white bg-[var(--iris)] hover:opacity-90"
          >
            Explore the verified graph →
          </Link>
        </section>

        <footer className="pt-8 border-t border-[var(--border)] flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[var(--muted)]">
          <span>© 2026 Totally Wild AI</span>
          <a href={ARTICLE_URL} className="hover:text-[var(--iris)]">LinkedIn: the full article &amp; discussion</a>
          <Link href="/" className="hover:text-[var(--iris)]">design-graph.totallywild.ai</Link>
        </footer>
      </main>
    </div>
  );
}
