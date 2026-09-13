"use client";

import { useId, useState } from "react";

export interface Point {
  x: string; // label
  y: number;
}

/** Simple responsive SVG line chart. */
export function LineChart({
  data,
  color = "var(--accent)",
  height = 160,
  unit = "",
  yMin,
}: {
  data: Point[];
  color?: string;
  height?: number;
  unit?: string;
  yMin?: number;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return <ChartEmpty height={height} />;
  const W = 600;
  const H = height;
  const pad = { l: 40, r: 12, t: 14, b: 26 };
  const ys = data.map((d) => d.y);
  const lo = yMin ?? Math.min(...ys);
  const hi = Math.max(...ys);
  const span = hi - lo || 1;
  const yLo = lo - span * 0.15;
  const yHi = hi + span * 0.15;
  const sx = (i: number) => pad.l + (data.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (data.length - 1)) * (W - pad.l - pad.r));
  const sy = (v: number) => pad.t + (1 - (v - yLo) / (yHi - yLo)) * (H - pad.t - pad.b);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(d.y).toFixed(1)}`).join(" ");
  const area = `${path} L${sx(data.length - 1).toFixed(1)},${(H - pad.b).toFixed(1)} L${sx(0).toFixed(1)},${(H - pad.b).toFixed(1)} Z`;
  const ticks = [yLo + (yHi - yLo) * 0.15, (yLo + yHi) / 2, yHi - (yHi - yLo) * 0.15];
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const h = hover ?? data.length - 1;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ height }} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.28" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke="var(--line)" strokeDasharray="2 4" />
            <text x={pad.l - 6} y={sy(t) + 4} textAnchor="end" fontSize="10" fill="var(--ink-3)" className="mono">
              {fmtTick(t)}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={i}>
            {i % labelEvery === 0 && (
              <text x={sx(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">
                {d.x}
              </text>
            )}
            <circle cx={sx(i)} cy={sy(d.y)} r={i === h ? 5 : 3} fill={i === h ? color : "var(--panel)"} stroke={color} strokeWidth="2" />
            <rect
              x={sx(i) - (W - pad.l - pad.r) / data.length / 2}
              y={0}
              width={(W - pad.l - pad.r) / data.length}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onTouchStart={() => setHover(i)}
            />
          </g>
        ))}
      </svg>
      <div className="absolute top-1 right-2 mono text-xs text-ink-2 bg-panel/80 px-2 py-0.5 rounded">
        {data[h].x} · <span className="text-ink font-semibold">{fmtTick(data[h].y)}</span> {unit}
      </div>
    </div>
  );
}

export function BarChart({ data, color = "var(--blue)", height = 140, unit = "" }: { data: Point[]; color?: string; height?: number; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return <ChartEmpty height={height} />;
  const W = 600;
  const H = height;
  const pad = { l: 40, r: 12, t: 14, b: 26 };
  const hi = Math.max(...data.map((d) => d.y), 1);
  const bw = (W - pad.l - pad.r) / data.length;
  const sy = (v: number) => pad.t + (1 - v / (hi * 1.1)) * (H - pad.t - pad.b);
  const h = hover ?? data.length - 1;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ height }} onMouseLeave={() => setHover(null)}>
        {[0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(hi * f)} y2={sy(hi * f)} stroke="var(--line)" strokeDasharray="2 4" />
            <text x={pad.l - 6} y={sy(hi * f) + 4} textAnchor="end" fontSize="10" fill="var(--ink-3)" className="mono">
              {fmtTick(hi * f)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
            <rect x={pad.l + i * bw} y={0} width={bw} height={H} fill="transparent" />
            <rect
              x={pad.l + i * bw + bw * 0.2}
              y={sy(d.y)}
              width={bw * 0.6}
              height={Math.max(0, H - pad.b - sy(d.y))}
              rx="3"
              fill={color}
              opacity={i === h ? 1 : 0.55}
            />
            {(data.length <= 8 || i % Math.ceil(data.length / 8) === 0) && (
              <text x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--ink-3)" className="mono">
                {d.x}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="absolute top-1 right-2 mono text-xs text-ink-2 bg-panel/80 px-2 py-0.5 rounded">
        {data[h].x} · <span className="text-ink font-semibold">{fmtTick(data[h].y)}</span> {unit}
      </div>
    </div>
  );
}

/** 12-week training heatmap, Monday rows. */
export function Heatmap({ days, colorFor }: { days: { date: string; level: number; label: string }[]; colorFor: (level: number) => string }) {
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none">
      {weeks.map((w, i) => (
        <div key={i} className="flex flex-col gap-1">
          {w.map((d) => (
            <div key={d.date} title={d.label} className="h-3.5 w-3.5 rounded-[3px]" style={{ background: colorFor(d.level) }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ChartEmpty({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-ink-3" style={{ height }}>
      Nothing to chart yet.
    </div>
  );
}

function fmtTick(v: number): string {
  if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(1)}k`;
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}
