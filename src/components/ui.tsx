"use client";

import { useEffect } from "react";
import type { Category } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/utils";

export function PageTitle({ eyebrow, title, right }: { eyebrow?: string; title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 pt-2 pb-5">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="display text-4xl md:text-5xl">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="display text-xl text-ink-2">{children}</h2>
      {right}
    </div>
  );
}

export function Stat({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div className="card p-4">
      <div className="eyebrow">{label}</div>
      <div className="display text-4xl mt-1" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-xs text-ink-3 mt-1">{sub}</div>}
    </div>
  );
}

export function CategoryChip({ category }: { category: Category }) {
  return (
    <span className="chip" style={{ ["--chip" as string]: CATEGORY_COLOR[category] }}>
      {category}
    </span>
  );
}

/** Row of plates: one per set, filled when done. */
export function Plates({ total, done, color }: { total: number; done: number; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${done} of ${total} sets done`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`plate ${i < done ? "on" : ""}`} style={{ ["--plate" as string]: color }} />
      ))}
    </span>
  );
}

export function Rating({
  label,
  value,
  onChange,
  labels,
  color = "var(--accent)",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  labels: string[];
  color?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-ink-2">{label}</span>
        <span className="mono text-xs" style={{ color }}>
          {labels[value - 1]}
        </span>
      </div>
      <div className="flex gap-1.5" role="radiogroup" aria-label={label}>
        {labels.map((l, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i + 1}
            aria-label={l}
            onClick={() => onChange(i + 1)}
            className="flex-1 h-9 rounded-md border transition"
            style={{
              background: i < value ? color : "var(--panel-2)",
              borderColor: i < value ? color : "var(--line)",
              opacity: i < value ? 0.55 + (0.45 * (i + 1)) / labels.length : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="card w-full md:max-w-lg max-h-[90dvh] overflow-y-auto rounded-b-none md:rounded-b-[14px] p-5 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="display text-2xl">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card p-6 text-center">
      <div className="display text-2xl text-ink-2">{title}</div>
      <p className="text-sm text-ink-3 mt-1 max-w-sm mx-auto">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-ink-2 mb-1 block">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-ink-3 mt-1 block">{hint}</span>}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  step = 1,
  min = 0,
  className = "",
  ...rest
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  step?: number;
  min?: number;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "step" | "min">) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      value={value}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? "" : Number(v));
      }}
      className={`field mono ${className}`}
      {...rest}
    />
  );
}
