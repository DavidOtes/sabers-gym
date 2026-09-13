"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { BarChart, Heatmap, LineChart } from "@/components/charts";
import { Empty, PageTitle, SectionTitle, Stat } from "@/components/ui";
import { addDays, avg, e1rm, fmtDate, fmtWeight, isoDate, startOfWeek, workoutVolume } from "@/lib/utils";
import Link from "next/link";

export default function ProgressPage() {
  const { logs, daily, weekly, settings, program } = useStore();
  const unit = settings.unit;

  // Exercise list: everything in the program, plus anything logged that has since been removed.
  const exercises = useMemo(() => {
    const map = new Map<string, string>();
    program.days.forEach((d) => d.exercises.forEach((e) => e.kind !== "time" && map.set(e.id, e.name)));
    logs.forEach((l) => l.exercises.forEach((e) => e.kind !== "time" && !map.has(e.exerciseId) && map.set(e.exerciseId, e.name)));
    return [...map.entries()].map(([id, name]) => ({ id, name, count: logs.filter((l) => l.exercises.some((e) => e.exerciseId === id && e.sets.some((s) => s.done))).length }));
  }, [program, logs]);

  const [exId, setExId] = useState<string>(() => exercises.sort((a, b) => b.count - a.count)[0]?.id ?? "");
  const [mode, setMode] = useState<"top" | "e1rm" | "volume">("top");

  const series = useMemo(() => {
    const out: { x: string; y: number; date: string; reps: string }[] = [];
    for (const l of logs) {
      const e = l.exercises.find((x) => x.exerciseId === exId);
      if (!e) continue;
      const done = e.sets.filter((s) => s.done);
      if (!done.length) continue;
      const top = Math.max(...done.map((s) => s.weight));
      const best = Math.max(...done.map((s) => e1rm(s.weight, s.reps)));
      const vol = done.reduce((a, s) => a + s.weight * (e.perSide ? 2 : 1) * s.reps, 0);
      out.push({
        x: fmtDate(l.finishedAt, { day: "numeric", month: "short" }),
        y: mode === "top" ? top : mode === "e1rm" ? Math.round(best * 10) / 10 : vol,
        date: l.finishedAt,
        reps: done.map((s) => s.reps).join("/"),
      });
    }
    return out;
  }, [logs, exId, mode]);

  const pr = useMemo(() => {
    let best = { w: 0, r: 0, e: 0, date: "" };
    for (const l of logs) {
      const e = l.exercises.find((x) => x.exerciseId === exId);
      e?.sets.filter((s) => s.done).forEach((s) => {
        const est = e1rm(s.weight, s.reps);
        if (est > best.e) best = { w: s.weight, r: s.reps, e: est, date: l.finishedAt };
      });
    }
    return best.e > 0 ? best : null;
  }, [logs, exId]);

  // Weekly volume, last 8 weeks
  const weeklyVolume = useMemo(() => {
    const start = startOfWeek(addDays(new Date(), -7 * 7));
    return Array.from({ length: 8 }, (_, i) => {
      const a = addDays(start, i * 7);
      const b = addDays(a, 7);
      const v = logs.filter((l) => new Date(l.finishedAt) >= a && new Date(l.finishedAt) < b).reduce((s, l) => s + workoutVolume(l), 0);
      return { x: fmtDate(a, { day: "numeric", month: "short" }), y: Math.round(v) };
    });
  }, [logs]);

  const weeklySessions = useMemo(() => {
    const start = startOfWeek(addDays(new Date(), -7 * 7));
    return Array.from({ length: 8 }, (_, i) => {
      const a = addDays(start, i * 7);
      const b = addDays(a, 7);
      return { x: fmtDate(a, { day: "numeric", month: "short" }), y: logs.filter((l) => new Date(l.finishedAt) >= a && new Date(l.finishedAt) < b).length };
    });
  }, [logs]);

  // Heatmap: 12 weeks ending this week
  const heat = useMemo(() => {
    const start = startOfWeek(addDays(new Date(), -7 * 11));
    const today = isoDate();
    return Array.from({ length: 84 }, (_, i) => {
      const d = addDays(start, i);
      const key = isoDate(d);
      const n = logs.filter((l) => isoDate(new Date(l.finishedAt)) === key).length;
      const checked = daily.some((x) => x.date === key);
      return { date: key, level: key > today ? -1 : n > 0 ? 2 : checked ? 1 : 0, label: `${fmtDate(key)}: ${n ? `${n} session${n > 1 ? "s" : ""}` : checked ? "check-in" : "—"}` };
    });
  }, [logs, daily]);

  const bw = weekly.map((w) => ({ x: fmtDate(w.date, { day: "numeric", month: "short" }), y: w.weight }));
  const last30 = daily.filter((d) => new Date(d.date + "T12:00") >= addDays(new Date(), -30));
  const sleep = last30.map((d) => ({ x: fmtDate(d.date, { day: "numeric", month: "short" }), y: d.sleep }));
  const last7 = daily.filter((d) => new Date(d.date + "T12:00") >= addDays(new Date(), -7));

  const planned = Object.values(program.schedule).filter(Boolean).length;
  const hitWeeks = weeklySessions.filter((w) => w.y >= planned).length;

  if (logs.length === 0 && daily.length === 0 && weekly.length === 0) {
    return (
      <div className="fade-in">
        <PageTitle eyebrow="Trends" title="Progress" />
        <Empty
          title="Nothing to chart yet"
          body="Log a session, a check-in, or a weigh-in and the trends show up here."
          action={
            <Link href="/workout" className="btn btn-primary">
              Start a workout
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <PageTitle eyebrow="Trends" title="Progress" />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Sessions" value={logs.length} sub="all-time" />
        <Stat label="Full weeks" value={`${hitWeeks}/8`} sub={`weeks hitting ${planned} sessions`} color={hitWeeks >= 6 ? "var(--green)" : undefined} />
        <Stat label="Moved" value={fmtWeight(Math.round(logs.reduce((a, l) => a + workoutVolume(l), 0) / 1000))} sub={`tonnes total`} />
        <Stat label="Bodyweight" value={bw.length ? fmtWeight(bw[bw.length - 1].y) : "—"} sub={bw.length > 1 ? `${(bw[bw.length - 1].y - bw[0].y > 0 ? "+" : "")}${(bw[bw.length - 1].y - bw[0].y).toFixed(1)} ${unit} since first` : unit} />
      </section>

      {/* Training calendar */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="eyebrow">Last 12 weeks</div>
          <div className="flex items-center gap-3 text-[10px] text-ink-3 mono">
            <span className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: "var(--green)" }} /> trained
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: "var(--line-2)" }} /> check-in
            </span>
          </div>
        </div>
        <Heatmap days={heat} colorFor={(l) => (l === 2 ? "var(--green)" : l === 1 ? "var(--line-2)" : l === 0 ? "var(--panel-2)" : "transparent")} />
      </section>

      {/* Exercise */}
      {exercises.length > 0 && (
        <section className="card p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            <select className="field md:max-w-xs" value={exId} onChange={(e) => setExId(e.target.value)} aria-label="Exercise">
              {exercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} {e.count ? `(${e.count})` : ""}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-1 p-1 card md:ml-auto">
              {(
                [
                  ["top", "Top set"],
                  ["e1rm", "Est. 1RM"],
                  ["volume", "Volume"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} onClick={() => setMode(k)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${mode === k ? "bg-panel-2 text-ink" : "text-ink-3"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <LineChart data={series} unit={unit} color="var(--accent)" height={180} />
          {pr ? (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
              <span>
                <span className="eyebrow">Best set</span> <span className="mono text-ink">{fmtWeight(pr.w)} × {pr.r}</span>
              </span>
              <span>
                <span className="eyebrow">Est. 1RM</span> <span className="mono text-ink">{fmtWeight(Math.round(pr.e * 10) / 10)} {unit}</span>
              </span>
              <span>
                <span className="eyebrow">On</span> <span className="mono text-ink">{fmtDate(pr.date)}</span>
              </span>
              {series.length > 0 && (
                <span>
                  <span className="eyebrow">Last reps</span> <span className="mono text-ink">{series[series.length - 1].reps}</span>
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-ink-3 mt-2">No logged sets for this exercise yet.</p>
          )}
        </section>
      )}

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle>Weekly volume</SectionTitle>
          <BarChart data={weeklyVolume} unit={unit} color="var(--blue)" />
        </div>
        <div className="card p-4">
          <SectionTitle>Sessions per week</SectionTitle>
          <BarChart data={weeklySessions} unit="" color="var(--green)" />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle>Bodyweight</SectionTitle>
          <LineChart data={bw} unit={unit} color="var(--yellow)" />
        </div>
        <div className="card p-4">
          <SectionTitle>Sleep, last 30 days</SectionTitle>
          <LineChart data={sleep} unit="h" color="var(--blue)" yMin={0} />
        </div>
      </section>

      {last7.length > 0 && (
        <section>
          <SectionTitle>Readiness, last 7 days</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Energy" value={avg(last7.map((d) => d.energy)).toFixed(1)} sub="of 5" color="var(--yellow)" />
            <Stat label="Soreness" value={avg(last7.map((d) => d.soreness)).toFixed(1)} sub="of 5" color="var(--red)" />
            <Stat label="Mood" value={avg(last7.map((d) => d.mood)).toFixed(1)} sub="of 5" color="var(--blue)" />
          </div>
        </section>
      )}
    </div>
  );
}
