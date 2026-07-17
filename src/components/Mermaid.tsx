"use client";

import { useEffect, useRef, useState } from "react";

// mermaid.render mounts a temp element with the given id — a repeated id (React
// strict-mode double effects, re-renders) collides and breaks the layout pass.
let renderSeq = 0;

/** Client-side Mermaid renderer shared by the diagram tabs.
 * `layout: "elk"` opts a flowchart into the ELK layered engine (orthogonal-ish,
 * cluster-aware) — the same engine the real product's Mermaid-ELK mode uses. */
export function Mermaid({ code, id, layout }: { code: string; id: string; layout?: "elk" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        const elkLayouts = (await import("@mermaid-js/layout-elk")).default;
        mermaid.registerLayoutLoaders(elkLayouts);
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "neutral",
          themeVariables: { fontSize: "13px", edgeLabelBackground: "#eef0f7" },
          layout,
          htmlLabels: false,
          elk: { mergeEdges: true, nodePlacementStrategy: "NETWORK_SIMPLEX" },
          // htmlLabels OFF keeps labels as plain SVG text — crisper at small
          // sizes and required if the ELK layout is ever re-enabled (its loader
          // JSON-serialises labels and chokes on DOM refs under Next.js).
          flowchart: { curve: "basis", nodeSpacing: 46, rankSpacing: 80, padding: 14, htmlLabels: false },
          sequence: { actorMargin: 36, messageMargin: 28, mirrorActors: false },
          maxEdges: 3000,
        } as Parameters<typeof mermaid.initialize>[0]);
        const { svg } = await mermaid.render(
          `mm-${id.replace(/[^a-zA-Z0-9]/g, "_")}-${++renderSeq}`,
          code,
        );
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          const el = ref.current.querySelector("svg");
          if (el) {
            // SVG has no z-index — paint order decides. Move every node group
            // after its sibling edge paths so connectors run UNDER the cards.
            for (const root of el.querySelectorAll("g.root")) {
              const nodes = root.querySelector(":scope > g.nodes");
              if (nodes) root.appendChild(nodes);
            }
            // Pin the svg to its natural (viewBox) size — mermaid emits
            // width:100%/max-width, which collapses inside a fit-content
            // pan-zoom surface.
            const vb = el.viewBox?.baseVal;
            el.style.maxWidth = "none";
            if (vb && vb.width > 0) {
              el.style.width = `${vb.width}px`;
              el.style.height = `${vb.height}px`;
            } else {
              el.style.height = "auto";
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? `${e.message}\n${e.stack}` : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) return <pre className="text-[10px] text-red-500 whitespace-pre-wrap">{error}</pre>;
  return <div ref={ref} className="min-w-fit mermaid-host" />;
}
