"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Field, NumberInput, PageTitle, Rating } from "@/components/ui";
import { fmtDate, fmtWeight, isoDate } from "@/lib/utils";

export default function CheckinPage() {
  return (
    <Suspense fallback={null}>
      <Checkin />
    </Suspense>
  );
}

function Checkin() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") === "weekly" ? "weekly" : "daily";
  const setTab = (t: "daily" | "weekly") => router.replace(t === "weekly" ? "/checkin?tab=weekly" : "/checkin");

  return (
    <div className="fade-in">
      <PageTitle eyebrow="How are you doing" title="Check-in" />
      <div className="grid grid-cols-2 gap-1 p-1 card mb-5">
        {(["daily", "weekly"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 text-sm font-medium transition ${tab === t ? "bg-panel-2 text-ink" : "text-ink-3 hover:text-ink"}`}
            aria-pressed={tab === t}
          >
            {t === "daily" ? "Daily" : "Weekly weigh-in"}
          </button>
        ))}
      </div>
      {tab === "daily" ? <Daily /> : <Weekly />}
    </div>
  );
}

const ENERGY = ["Very low", "Low", "Moderate", "High", "Very high"];
const SORE = ["None", "Mild", "Moderate", "High", "Severe"];
const MOOD = ["Poor", "Below avg", "Average", "Good", "Great"];

function Daily() {
  const { daily, addDaily, deleteDaily } = useStore();
  const [date, setDate] = useState(isoDate());
  const existing = daily.find((d) => d.date === date);
  const [form, setForm] = useState({ sleep: 7 as number | "", energy: 3, soreness: 2, mood: 3, notes: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) setForm({ sleep: existing.sleep, energy: existing.energy, soreness: existing.soreness, mood: existing.mood, notes: existing.notes });
    else setForm({ sleep: 7, energy: 3, soreness: 2, mood: 3, notes: "" });
  }, [date, existing]);

  const submit = () => {
    addDaily({ date, sleep: form.sleep === "" ? 0 : form.sleep, energy: form.energy, soreness: form.soreness, mood: form.mood, notes: form.notes });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="space-y-5">
      <div className="card p-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" className="field mono" value={date} max={isoDate()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Hours of sleep">
            <NumberInput value={form.sleep} step={0.5} min={0} max={14} onChange={(v) => setForm({ ...form, sleep: v })} />
          </Field>
        </div>
        <Rating label="Energy" value={form.energy} labels={ENERGY} onChange={(v) => setForm({ ...form, energy: v })} color="var(--yellow)" />
        <Rating label="Muscle soreness" value={form.soreness} labels={SORE} onChange={(v) => setForm({ ...form, soreness: v })} color="var(--red)" />
        <Rating label="Mood" value={form.mood} labels={MOOD} onChange={(v) => setForm({ ...form, mood: v })} color="var(--blue)" />
        <Field label="Notes">
          <textarea className="field resize-none" rows={2} placeholder="Anything worth remembering about today?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <button className="btn btn-primary w-full" onClick={submit}>
          {saved ? "Saved ✓" : existing ? "Update check-in" : "Save check-in"}
        </button>
      </div>

      <RecentList
        title="Recent check-ins"
        empty="No check-ins yet. The first one takes 20 seconds."
        items={[...daily].reverse().slice(0, 14).map((d) => ({
          id: d.id,
          left: fmtDate(d.date),
          right: (
            <span className="mono text-xs flex gap-3">
              <span className="text-ink-2">{d.sleep}h</span>
              <span style={{ color: "var(--yellow)" }}>E{d.energy}</span>
              <span style={{ color: "var(--red)" }}>S{d.soreness}</span>
              <span style={{ color: "var(--blue)" }}>M{d.mood}</span>
            </span>
          ),
          note: d.notes,
        }))}
        onDelete={deleteDaily}
      />
    </div>
  );
}

function Weekly() {
  const { weekly, addWeekly, deleteWeekly, settings } = useStore();
  const last = weekly[weekly.length - 1];
  const [form, setForm] = useState({ date: isoDate(), weight: "" as number | "", chest: "" as number | "", waist: "" as number | "", arms: "" as number | "", notes: "" });
  const [saved, setSaved] = useState(false);

  const submit = () => {
    if (form.weight === "" || form.weight <= 0) return;
    addWeekly({
      date: form.date,
      weight: form.weight,
      chest: form.chest === "" ? undefined : form.chest,
      waist: form.waist === "" ? undefined : form.waist,
      arms: form.arms === "" ? undefined : form.arms,
      notes: form.notes,
    });
    setForm({ ...form, weight: "", chest: "", waist: "", arms: "", notes: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const delta = last && form.weight !== "" ? form.weight - last.weight : null;

  return (
    <div className="space-y-5">
      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" className="field mono" value={form.date} max={isoDate()} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label={`Bodyweight (${settings.unit})`} hint={last ? `Last: ${fmtWeight(last.weight)} on ${fmtDate(last.date)}` : undefined}>
            <NumberInput value={form.weight} step={0.1} placeholder={last ? String(last.weight) : "e.g. 75"} onChange={(v) => setForm({ ...form, weight: v })} className="text-lg" />
          </Field>
        </div>
        {delta !== null && form.weight !== "" && (
          <div className="mono text-xs text-ink-2">
            {delta === 0 ? "No change from last week." : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} ${settings.unit} since last weigh-in.`}
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Chest (cm)">
            <NumberInput value={form.chest} step={0.5} onChange={(v) => setForm({ ...form, chest: v })} placeholder={last?.chest ? String(last.chest) : "—"} />
          </Field>
          <Field label="Waist (cm)">
            <NumberInput value={form.waist} step={0.5} onChange={(v) => setForm({ ...form, waist: v })} placeholder={last?.waist ? String(last.waist) : "—"} />
          </Field>
          <Field label="Arms (cm)">
            <NumberInput value={form.arms} step={0.5} onChange={(v) => setForm({ ...form, arms: v })} placeholder={last?.arms ? String(last.arms) : "—"} />
          </Field>
        </div>
        <Field label="Weekly reflection">
          <textarea className="field resize-none" rows={3} placeholder="How was the week? Sleep, food, sessions hit or missed." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <button className="btn btn-primary w-full" onClick={submit} disabled={form.weight === "" || form.weight <= 0}>
          {saved ? "Saved ✓" : "Save weigh-in"}
        </button>
      </div>

      <RecentList
        title="Weigh-ins"
        empty="No weigh-ins yet. Same day, same time each week gives the cleanest trend."
        items={[...weekly].reverse().slice(0, 12).map((w, i, arr) => {
          const prev = arr[i + 1];
          const d = prev ? w.weight - prev.weight : null;
          return {
            id: w.id,
            left: fmtDate(w.date),
            right: (
              <span className="mono text-sm">
                {fmtWeight(w.weight)} {settings.unit}
                {d !== null && (
                  <span className="text-xs ml-2" style={{ color: d > 0 ? "var(--yellow)" : d < 0 ? "var(--blue)" : "var(--ink-3)" }}>
                    {d > 0 ? "+" : ""}
                    {d.toFixed(1)}
                  </span>
                )}
              </span>
            ),
            note: [w.chest && `Chest ${w.chest}`, w.waist && `Waist ${w.waist}`, w.arms && `Arms ${w.arms}`].filter(Boolean).join(" · ") + (w.notes ? (w.chest || w.waist || w.arms ? " · " : "") + w.notes : ""),
          };
        })}
        onDelete={deleteWeekly}
      />
    </div>
  );
}

function RecentList({ title, empty, items, onDelete }: { title: string; empty: string; items: { id: string; left: string; right: React.ReactNode; note?: string }[]; onDelete: (id: string) => void }) {
  return (
    <section>
      <h2 className="display text-xl text-ink-2 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-3">{empty}</p>
      ) : (
        <div className="card divide-y divide-line">
          {items.map((it) => (
            <div key={it.id} className="p-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">{it.left}</span>
                  {it.right}
                </div>
                {it.note && <div className="text-xs text-ink-3 mt-0.5 truncate">{it.note}</div>}
              </div>
              <button className="text-ink-3 hover:text-red text-lg leading-none" aria-label="Delete" onClick={() => onDelete(it.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
