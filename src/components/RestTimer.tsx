"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { fmtClock } from "@/lib/utils";

export function RestTimer() {
  const restUntil = useStore((s) => s.restUntil);
  const restTotal = useStore((s) => s.restTotal);
  const extend = useStore((s) => s.extendRest);
  const stop = useStore((s) => s.stopRest);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!restUntil) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [restUntil]);

  useEffect(() => {
    if (!restUntil) return;
    if (now >= restUntil) {
      try {
        navigator.vibrate?.([120, 60, 120]);
      } catch {}
      const t = setTimeout(stop, 1500);
      return () => clearTimeout(t);
    }
  }, [now, restUntil, stop]);

  if (!restUntil) return null;
  const left = Math.max(0, Math.ceil((restUntil - now) / 1000));
  const pct = restTotal > 0 ? Math.min(100, 100 - (left / restTotal) * 100) : 100;
  const done = left === 0;

  return (
    <div className="fixed z-40 left-0 right-0 bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-4 md:left-[236px] md:right-4 px-3 md:px-0 fade-in">
      <div className="mx-auto max-w-3xl card overflow-hidden shadow-2xl shadow-black/40" role="timer" aria-live="polite">
        <div className="h-1 bg-panel-2">
          <div className="h-full transition-[width] duration-200" style={{ width: `${pct}%`, background: done ? "var(--green)" : "var(--yellow)" }} />
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div>
            <div className="eyebrow">{done ? "Go" : "Rest"}</div>
            <div className="mono text-2xl font-semibold leading-none tabular-nums" style={{ color: done ? "var(--green)" : "var(--ink)" }}>
              {fmtClock(left)}
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => extend(30)}>
              +30s
            </button>
            <button className="btn btn-primary btn-sm" onClick={stop}>
              {done ? "Next set" : "Skip"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
