"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;

interface Transform { x: number; y: number; s: number }

/** Wheel-zoom / drag-pan surface for the static Mermaid diagrams — hand-rolled
 * so zoom is fully granular: scroll zooms at the cursor, drag pans, +/− step
 * 25%, the slider is continuous, ⤢ fits, and the badge shows the exact level. */
export function DiagramPanZoom({ children, fitKey }: { children: ReactNode; fitKey?: unknown }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>({ x: 0, y: 0, s: 1 });
  const [animate, setAnimate] = useState(false);
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const clamp = (s: number) => Math.min(Math.max(s, MIN_SCALE), MAX_SCALE);

  /** Zoom to absolute scale `next`, keeping the wrapper point (cx, cy) fixed. */
  const zoomAt = useCallback((cx: number, cy: number, next: number, smooth = false) => {
    setAnimate(smooth);
    setT((prev) => {
      const s = clamp(next);
      return { s, x: cx - ((cx - prev.x) / prev.s) * s, y: cy - ((cy - prev.y) / prev.s) * s };
    });
  }, []);

  const zoomCenter = useCallback((factorOrAbs: { factor?: number; abs?: number }) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    setT((prev) => {
      const s = clamp(factorOrAbs.abs ?? prev.s * (factorOrAbs.factor ?? 1));
      const cx = wrap.clientWidth / 2;
      const cy = wrap.clientHeight / 2;
      return { s, x: cx - ((cx - prev.x) / prev.s) * s, y: cy - ((cy - prev.y) / prev.s) * s };
    });
    setAnimate(true);
  }, []);

  const fit = useCallback((): boolean => {
    const wrap = wrapRef.current;
    const content = contentRef.current;
    if (!wrap || !content) return false;
    const cw = content.offsetWidth;
    const ch = content.offsetHeight;
    if (cw < 100 || ch < 60) return false; // mermaid hasn't drawn yet
    const s = clamp(Math.min(wrap.clientWidth / cw, wrap.clientHeight / ch, 1.5) * 0.96);
    setAnimate(true);
    setT({ x: (wrap.clientWidth - cw * s) / 2, y: (wrap.clientHeight - ch * s) / 2, s });
    return true;
  }, []);

  // The diagram arrives asynchronously (mermaid render) — poll briefly until
  // it has a real size, then fit. Re-runs when fitKey changes (new diagram).
  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      if (fit() || ++tries > 16) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [fitKey, fit]);

  // Re-fit when the surface itself resizes (window resize, panel changes) —
  // otherwise the view keeps a scale computed for the old viewport.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let last = { w: wrap.clientWidth, h: wrap.clientHeight };
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (Math.abs(w - last.w) < 24 && Math.abs(h - last.h) < 24) return;
      last = { w, h };
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => fit(), 200);
    });
    ro.observe(wrap);
    return () => {
      ro.disconnect();
      if (debounce) clearTimeout(debounce);
    };
  }, [fit]);

  // Native wheel listener — React's onWheel is passive, so preventDefault
  // (needed to stop page scroll) requires an explicit non-passive binding.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const cur = tRef.current;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setAnimate(false);
      const s = clamp(cur.s * factor);
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setT({ s, x: cx - ((cx - cur.x) / cur.s) * s, y: cy - ((cy - cur.y) / cur.s) * s });
    };
    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, []);
  const tRef = useRef(t);
  tRef.current = t;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { startX: e.clientX, startY: e.clientY, baseX: t.x, baseY: t.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setAnimate(false);
    setT((prev) => ({
      ...prev,
      x: drag.current!.baseX + (e.clientX - drag.current!.startX),
      y: drag.current!.baseY + (e.clientY - drag.current!.startY),
    }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const btn =
    "w-7 h-7 grid place-items-center rounded-md border border-[var(--border)] bg-[var(--panel-bg)] " +
    "text-[13px] text-[var(--text-soft)] shadow-sm hover:border-[var(--iris)] hover:text-[var(--iris)]";

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 min-h-0 overflow-hidden select-none"
      style={{ cursor: drag.current ? "grabbing" : "grab", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onDoubleClick={(e) => {
        const rect = wrapRef.current!.getBoundingClientRect();
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, t.s * 1.4, true);
      }}
    >
      <div
        className="absolute bottom-3 left-3 z-10 flex flex-col items-center gap-1"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <button className={btn} title="Zoom in" onClick={() => zoomCenter({ factor: 1.25 })}>+</button>
        <input
          type="range"
          min={Math.log(MIN_SCALE)}
          max={Math.log(MAX_SCALE)}
          step={0.01}
          value={Math.log(t.s)}
          onChange={(e) => zoomCenter({ abs: Math.exp(Number(e.target.value)) })}
          title="Zoom level"
          className="diagram-zoom-slider"
        />
        <button className={btn} title="Zoom out" onClick={() => zoomCenter({ factor: 0.8 })}>−</button>
        <button className={btn} title="Fit to view" onClick={fit}>⤢</button>
        <span className="text-[9px] font-semibold text-[var(--muted)] bg-[var(--panel-bg)] border border-[var(--border)] rounded px-1 py-0.5 tabular-nums">
          {Math.round(t.s * 100)}%
        </span>
      </div>
      <div
        ref={contentRef}
        style={{
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`,
          transformOrigin: "0 0",
          width: "fit-content",
          transition: animate ? "transform 160ms ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
