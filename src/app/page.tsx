"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Progression } from "@/lib/types";
import { Plates, SectionTitle, Stat } from "@/components/ui";
import {
  addDays,
  avg,
  completedSets,
  fmtDate,
  fmtDuration,
  fmtWeight,
  isoDate,
  judgeExercise,
  sameDay,
  startOfWeek,
  totalSets,
  WEEKDAYS_SHORT,
  workoutVolume,
} from "@/lib/utils";

export default function Dashboard() {
  const router = useRouter();
  const { program, logs, daily, weekly, settings, active, startWorkout, applyProgressions } = useStore();
  const now = new Date();
  const todayId = program.schedule[now.getDay()];
  const todayDay = program.days.find((d) => d.id === todayId);
  const todayLog = logs.find((l) => sameDay(new Date(l.finishedAt), now));
  const weekStart = startOfWeek(now);
  const plannedPerWeek = Object.values(program.schedule).filter(Boolean).length;
  const weekLogs = logs.filter((l) => new Date(l.finishedAt) >= weekStart);
  const dailyToday = daily.find((d) => d.date === isoDate(now));
  const weeklyThisWeek = weekly.find((w) => new Date(w.date + "T12:00") >= weekStart);
  const lastWeigh = weekly[weekly.length - 1];
  const sleep7 = avg(daily.filter((d) => new Date(d.date + "T12:00") >= addDays(now, -7)).map((d) => d.sleep));

  const ready = useMemo(() => {
    const out: (Progression & { dayId: string; dayName: string })[] = [];
    for (const day of program.days) {
      for (const ex of day.exercises) {
        for (let i = logs.length - 1; i >= 0; i--) {
          const le = logs[i].exercises.find((e) => e.exerciseId === ex.id);
          if (!le || !le.sets.some((s) => s.done)) continue;
          const p = judgeExercise(le);
          if (p && p.to !== p.from && p.from === ex.weight && ex.kind === "weight") {
            out.push({ ...p, dayId: day.id, dayName: day.name });
          }
          break;
        }
      }
    }
    return out;
  }, [program, logs]);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  return (
    <div className="space-y-6 fade-in">
      {/* Hero */}
      <section className="card p-5 md:p-7 relative overflow-hidden">
        <div className="eyebrow">
          {greeting}, {settings.name} · {fmtDate(now, { weekday: "long", day: "numeric", month: "long" })}
        </div>
        {active ? (
          <>
            <h1 className="display text-5xl md:text-7xl mt-2 text-ink">
              In progress
              <br />
              <span className="text-green">{active.name}</span>
            </h1>
            <p className="text-ink-2 mt-3 text-sm">
              {completedSets(active)} of {totalSets(active)} sets done. Started {fmtDate(active.startedAt, { hour: "2-digit", minute: "2-digit" })}.
            </p>
            <Link href="/workout" className="btn btn-primary mt-5">
              Resume workout
            </Link>
          </>
        ) : todayLog ? (
          <>
            <h1 className="display text-5xl md:text-7xl mt-2">
              Done for
              <br />
              <span className="text-green">today</span>
            </h1>
            <p className="text-ink-2 mt-3 text-sm">
              {todayLog.name} · {completedSets(todayLog)} sets · {fmtWeight(workoutVolume(todayLog))} {settings.unit} moved ·{" "}
              {fmtDuration(new Date(todayLog.finishedAt).getTime() - new Date(todayLog.startedAt).getTime())}
            </p>
            <div className="flex gap-2 mt-5">
              <Link href="/history" className="btn btn-secondary">
                See the session
              </Link>
              <Link href="/workout" className="btn btn-ghost">
                Train again
              </Link>
            </div>
          </>
        ) : todayDay ? (
          <>
            <h1 className="display text-5xl md:text-7xl mt-2">
              Today
              <br />
              <span className="text-accent">{todayDay.name}</span>
            </h1>
            <p className="text-ink-2 mt-3 text-sm">
              {todayDay.exercises.filter((e) => !e.optional).length} exercises · {todayDay.exercises.reduce((a, e) => a + (e.optional ? 0 : e.sets), 0)} working sets
            </p>
            <button
              className="btn btn-primary mt-5"
              onClick={() => {
                startWorkout(todayDay.id);
                router.push("/workout");
              }}
            >
              Start workout
            </button>
          </>
        ) : (
          <>
            <h1 className="display text-5xl md:text-7xl mt-2">
              Rest
              <br />
              <span className="text-ink-3">day</span>
            </h1>
            <p className="text-ink-2 mt-3 text-sm">Recovery is where the growth happens. Walk, stretch, eat, sleep. Log a check-in if you have a minute.</p>
            <div className="flex gap-2 mt-5">
              <Link href="/checkin" className="btn btn-secondary">
                Daily check-in
              </Link>
              <Link href="/workout" className="btn btn-ghost">
                Train anyway
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Week strip */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="eyebrow">This week</div>
          <div className="mono text-xs text-ink-2">
            {weekLogs.length}/{plannedPerWeek} sessions
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(weekStart, i);
            const planned = program.schedule[d.getDay()];
            const day = program.days.find((x) => x.id === planned);
            const log = logs.find((l) => sameDay(new Date(l.finishedAt), d));
            const isToday = sameDay(d, now);
            const past = d < now && !isToday;
            return (
              <div
                key={i}
                className={`rounded-lg border px-1 py-2 text-center ${isToday ? "border-ink-2" : "border-line"}`}
                style={{ background: log ? "color-mix(in srgb, var(--green) 18%, var(--panel))" : planned ? "var(--panel-2)" : "transparent" }}
                title={day?.name ?? "Rest"}
              >
                <div className={`mono text-[10px] ${isToday ? "text-ink" : "text-ink-3"}`}>{WEEKDAYS_SHORT[d.getDay()]}</div>
                <div className="mt-1.5 flex justify-center">
                  <span
                    className={`plate ${log ? "on" : ""}`}
                    style={{
                      ["--plate" as string]: "var(--green)",
                      borderColor: log ? undefined : planned ? (past ? "var(--red)" : "var(--ink-3)") : "var(--line)",
                      opacity: planned || log ? 1 : 0.5,
                    }}
                  />
                </div>
                <div className="text-[10px] text-ink-3 mt-1.5 truncate">{day ? shortName(day.name) : "Rest"}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Prompts */}
      {(!dailyToday || !weeklyThisWeek) && (
        <section className="grid gap-3 md:grid-cols-2">
          {!dailyToday && (
            <Link href="/checkin" className="card p-4 flex items-center gap-3 hover:border-line-2 transition">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow shrink-0" />
              <div>
                <div className="font-semibold text-sm">Daily check-in</div>
                <div className="text-xs text-ink-3">Sleep, energy, soreness, mood. Takes 20 seconds.</div>
              </div>
              <span className="ml-auto text-ink-3">→</span>
            </Link>
          )}
          {!weeklyThisWeek && (
            <Link href="/checkin?tab=weekly" className="card p-4 flex items-center gap-3 hover:border-line-2 transition">
              <span className="h-2.5 w-2.5 rounded-full bg-blue shrink-0" />
              <div>
                <div className="font-semibold text-sm">Weekly weigh-in</div>
                <div className="text-xs text-ink-3">Bodyweight and measurements, once a week.</div>
              </div>
              <span className="ml-auto text-ink-3">→</span>
            </Link>
          )}
        </section>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Sessions" value={logs.length} sub="logged all-time" />
        <Stat label="This week" value={`${weekLogs.length}/${plannedPerWeek}`} sub="of planned sessions" color={weekLogs.length >= plannedPerWeek && plannedPerWeek > 0 ? "var(--green)" : undefined} />
        <Stat label="Bodyweight" value={lastWeigh ? `${fmtWeight(lastWeigh.weight)}` : "—"} sub={lastWeigh ? `${settings.unit} · ${fmtDate(lastWeigh.date)}` : "no weigh-in yet"} />
        <Stat label="Sleep" value={sleep7 ? sleep7.toFixed(1) : "—"} sub="avg hours, last 7 days" />
      </section>

      {/* Ready to progress */}
      {ready.length > 0 && (
        <section>
          <SectionTitle>Update your weights</SectionTitle>
          <div className="card divide-y divide-line">
            {ready.map((p) => (
              <div key={p.exerciseId} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-ink-3">
                    {p.dayName} · {p.reason}
                  </div>
                </div>
                <div className="ml-auto mono text-sm whitespace-nowrap">
                  <span className="text-ink-3">{fmtWeight(p.from)}</span> → <span className="font-semibold" style={{ color: p.verdict === "increase" ? "var(--green)" : "var(--ink)" }}>{fmtWeight(p.to)}</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => applyProgressions(p.dayId, [p])}>
                  Apply
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      {logs.length > 0 && (
        <section>
          <SectionTitle
            right={
              <Link href="/history" className="text-xs text-ink-2 hover:text-ink">
                All history →
              </Link>
            }
          >
            Recent sessions
          </SectionTitle>
          <div className="card divide-y divide-line">
            {[...logs]
              .reverse()
              .slice(0, 4)
              .map((l) => (
                <Link key={l.id} href="/history" className="flex items-center gap-3 p-3.5 hover:bg-panel-2/50 transition">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{l.name}</div>
                    <div className="text-xs text-ink-3">
                      {fmtDate(l.finishedAt)} · {fmtDuration(new Date(l.finishedAt).getTime() - new Date(l.startedAt).getTime())} · {fmtWeight(workoutVolume(l))} {settings.unit}
                    </div>
                  </div>
                  <div className="ml-auto shrink-0 hidden sm:block">
                    <Plates total={Math.min(totalSets(l), 10)} done={Math.min(completedSets(l), 10)} color="var(--green)" />
                  </div>
                  <div className="ml-auto shrink-0 mono text-xs text-ink-2 sm:hidden">
                    {completedSets(l)}/{totalSets(l)}
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function shortName(name: string) {
  const map: Record<string, string> = {
    "Chest, Shoulders & Triceps": "Push",
    "Back & Biceps": "Pull",
    Legs: "Legs",
    "Full Upper Body": "Upper",
  };
  return map[name] ?? name.split(" ")[0];
}
