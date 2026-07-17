import Link from "next/link";
import { PitchInfographic } from "@/components/PitchInfographic";
import { ErpUseCase } from "@/components/ErpUseCase";

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
    body: "As a model keeps coding, it quietly forgets what was true at the start. Humans do it too — nobody holds a thousand interconnected pieces in their head at once.",
  },
  {
    title: "Code stops being the source of truth",
    body: "Once a model has written thousands of lines no human can read, review and hold in their head, code is the output — not the intent. Ask “why is this here?” and it shrugs: a human prompted it, or the model hallucinated it and moved on.",
  },
  {
    title: "Every edit is a silent bet",
    body: "Did it break a contract three files away? You find out later.",
  },
  {
    title: "A losing race",
    body: "Reviewing generated code at LLM speed with human eyes is a race you can’t win — so we babysit coding agents, re-explaining the same context on every task, because they have no source of truth to work from.",
  },
];

const UNLOCKS = [
  {
    title: "A source of truth that isn’t the code",
    body: "The graph knows what every piece is for, what it depends on, and what it’s forbidden from doing.",
  },
  {
    title: "The strongest signal, not the widest guess",
    body: "Each agent works from narrow, precise context funneled through the graph — and answers questions by traversing the edges, not grepping code.",
  },
  {
    title: "Nothing dangles",
    body: "Every requirement traces to the code that satisfies it; every data flow is followed end to end — request → endpoint → method → query → column — across every service boundary through typed contracts. Coverage isn’t a hope; it’s an invariant.",
  },
  {
    title: "Change becomes analyzable, not hopeful",
    body: "The blast radius of a change is a query, not a prayer. “What breaks if I touch this?” has an answer before you touch it.",
  },
  {
    title: "Correctness is mechanical, not vibes",
    body: "Tasks derive from the verified graph and arrive carrying their own tests. Golden snapshots of the intended architecture catch regressions — like snapshot-testing a function, but for the shape of an entire system, across hundreds of reference designs.",
  },
  {
    title: "The timeline collapses — without losing control",
    body: "What makes a multi-service platform take years isn’t the typing — it’s coordination: aligning teams, holding contracts stable, keeping mental models in sync. Move that into a verified graph, slice it into precise pre-tested work units, and run Engineer agents in parallel: years into months, months into weeks, weeks into days.",
  },
  {
    title: "The human scales",
    body: "Stop absorbing 10,000 lines a day. Drive a model you can hold in your head — approving the decisions that matter (which stack, which plan) and letting the machine enforce the thousand that don’t.",
  },
];

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
            That was never the hard part. Speed of typing was never the ceiling —
            comprehension and control of a large, interconnected body of logic is.
            That&apos;s what decides whether an LLM-built system stays correct as it
            grows, or quietly rots into something no one can reason about. So we
            made a different bet: don&apos;t manage the code — manage a{" "}
            <strong className="text-[var(--text)]">verified model</strong> of it.
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
          <p className="mt-4 text-[14px] text-[var(--muted)] italic">
            TDD helps. It always has. But what else?
          </p>
        </section>

        {/* ----------------------------------------------------- the graph */}
        <section className="py-10 border-t border-[var(--border)]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] uppercase text-[var(--muted)]">
            The Graph — and the graphAPI
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-soft)] max-w-2xl">
            Before a single file is written, the platform builds a complete architecture graph —
            a typed, mechanically verified model of the whole solution, resolved all the way down
            to the smallest units of logic. Not a diagram you draw once and forget: a living
            graph that is the source of truth, continuously proven against hard invariants.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-soft)] max-w-2xl">
            It&apos;s one graph with multiple layers: a reusable{" "}
            <strong className="text-[var(--text)]">knowledge layer</strong> that captures engineering
            know-how, and an <strong className="text-[var(--text)]">instance layer</strong> — the concrete
            system — derived by traversing and scoring that knowledge, then mechanically verified.{" "}
            <em>Proposed and proven, not left to a guess.</em> Every interaction goes through a typed{" "}
            <strong className="text-[var(--text)]">graphAPI</strong> — strongly-typed queries and
            traversals over the live graph — so humans, agents and tools all ask the same source
            of truth instead of parsing code.
          </p>
          <PitchInfographic />
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {UNLOCKS.map((u, i) => (
              <div
                key={u.title}
                className={`rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-4 ${
                  i === UNLOCKS.length - 1 ? "sm:col-span-2" : ""
                }`}
              >
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

        {/* ---------------------------------------------- ERP use case */}
        <ErpUseCase />

        {/* -------------------------------------------------- the room */}
        <section className="py-10 border-t border-[var(--border)]">
          <h2 className="text-[12px] font-bold tracking-[0.12em] uppercase text-[var(--muted)]">
            From the discussion
          </h2>
          <p className="mt-3 text-[13px] text-[var(--muted)]">
            Engineering leaders responding to{" "}
            <a href={ARTICLE_URL} className="text-[var(--iris)] hover:underline">
              the launch article
            </a>{" "}
            — converging, and pushing back, on the same bet.
          </p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3 items-start">
            <figure className="rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-5">
              <blockquote className="text-[14px] leading-relaxed text-[var(--text-soft)]">
                &ldquo;Code is just the output; the architecture and intent are what actually
                matter. Trying to review AI code at LLM speed is impossible. It&apos;s no different
                than a compiled language — we don&apos;t read the raw assembly output, we verify the
                source and run the tests. Treating AI-generated code as an ephemeral compilation
                target while managing a mechanically verified model of the system instead is{" "}
                <strong className="text-[var(--text)]">the future of engineering</strong>.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[12.5px] text-[var(--muted)]">
                — Christopher Langton, Founder @ Vulnetix
              </figcaption>
            </figure>
            <figure className="rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-5">
              <blockquote className="text-[14px] leading-relaxed text-[var(--text-soft)]">
                &ldquo;I think this is where AI changes software engineering the most. The
                bottleneck isn&apos;t generating code anymore — it&apos;s{" "}
                <strong className="text-[var(--text)]">
                  preserving architecture and intent as thousands of changes accumulate
                </strong>
                . Teams that can keep those aligned will move much faster over time.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[12.5px] text-[var(--muted)]">
                —{" "}
                <a href="https://www.linkedin.com/in/tarand" className="text-[var(--iris)] hover:underline">
                  Andrea Tarzariol
                </a>
                , Senior Engineering Manager · creator of TL;DW
              </figcaption>
            </figure>
            <figure className="rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-5">
              <blockquote className="text-[14px] leading-relaxed text-[var(--text-soft)]">
                &ldquo;Approaches like this are the future of software development. Moving the
                software definition to a higher level that is more human-understandable than raw
                code exploits AI agents&apos; ability to make changes with a big piece of
                human-readable context that anchors the production and test code… While still
                early days, it&apos;s been nothing short of revolutionary — it&apos;s allowed us to{" "}
                <strong className="text-[var(--text)]">maintain dev speed <em>and</em> quality</strong>.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[12.5px] text-[var(--muted)]">
                —{" "}
                <a href="https://www.linkedin.com/in/mark-abrahams-4b58b410" className="text-[var(--iris)] hover:underline">
                  Mark Abrahams
                </a>
                , Principal Software Architect at FeeniX Communications — independently building
                in the same space
              </figcaption>
            </figure>
            <figure className="rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-5">
              <blockquote className="text-[14px] leading-relaxed text-[var(--text-soft)]">
                &ldquo;Been making the same thing since March, but the implementation is
                different… decouple the intent graph from the code graph and from the knowledge
                graph. Then the problem still remains: how to understand changes quickly enough?
                How to render only the slice of the graph that has useful context?{" "}
                <strong className="text-[var(--text)]">What is minimal viable context?</strong>&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[12.5px] text-[var(--muted)]">
                —{" "}
                <a href="https://www.linkedin.com/in/konovalovnk" className="text-[var(--iris)] hover:underline">
                  Nikolay Konovalov
                </a>
                , Senior Software Developer — independently building in the same space
              </figcaption>
            </figure>
            <figure className="rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-5">
              <blockquote className="text-[14px] leading-relaxed text-[var(--text-soft)]">
                &ldquo;A verified graph can be a useful review surface, but{" "}
                <strong className="text-[var(--text)]">
                  I would hesitate to make it the universal source of truth
                </strong>
                . Architecture is one artifact in the project context — it has to stay consistent
                with requirements, tests, operational constraints, and runtime evidence… My answer
                to drift is a set of mutually checked artifacts available to the agent.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[12.5px] text-[var(--muted)]">
                —{" "}
                <a href="https://www.linkedin.com/in/sergeyblekher" className="text-[var(--iris)] hover:underline">
                  Sergey Blekher
                </a>
                , Independent Principal / Lead Software Engineer — the counterpoint
              </figcaption>
            </figure>
            <figure className="rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] p-5">
              <blockquote className="text-[14px] leading-relaxed text-[var(--text-soft)]">
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
          </div>
        </section>

        {/* ------------------------------------------------------ closing */}
        <section className="py-12 border-t border-[var(--border)] text-center">
          <p className="text-[14px] italic text-[var(--muted)] max-w-xl mx-auto">
            When an LLM writes most of your code, what&apos;s your source of truth:
            the code, the docs, or someone&apos;s memory?
          </p>
          <p className="mt-4 text-[18px] font-bold text-balance max-w-xl mx-auto">
            The teams that win the next few years won&apos;t be the ones who generate the most
            code — they&apos;ll be the ones who keep generated logic under control:
            comprehensible, verifiable, safe to change, long after the human who prompted
            it has moved on.
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
