"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { CardioType, LoggedExercise, Progression } from "@/lib/types";
import { CategoryChip, Modal, NumberInput, Plates, PageTitle } from "@/components/ui";
import { CATEGORY_COLOR, completedSets, fmtClock, fmtWeight, judgeExercise, loadingLabel, sameDay, totalSets, workoutVolume } from "@/lib/utils";

export default function WorkoutPage() {
  const active = useStore((s) => s.active);
  return active ? <ActiveWorkout /> : <DayPicker />;
}

function DayPicker() {
  const router = useRouter();
  const { program, logs, startWorkout, settings } = useStore();
  const now = new Date();
  const todayId = program.schedule[now.getDay()];
  const trainedToday = logs.some((l) => sameDay(new Date(l.finishedAt), now));

  return (
    <div className="fade-in">
      <PageTitle eyebrow="Pick a session" title="Train" />
      {trainedToday && <p className="text-sm text-ink-2 mb-4">You already logged a session today. Starting another is fine, it just goes in the log as a second one.</p>}
      <div className="grid gap-3">
        {program.days.map((d) => {
          const last = [...logs].reverse().find((l) => l.dayId === d.id);
          const isToday = d.id === todayId;
          return (
            <button
              key={d.id}
              onClick={() => {
                startWorkout(d.id);
                router.push("/workout");
              }}
              className="card p-4 text-left flex items-center gap-4 hover:border-line-2 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="display text-2xl">{d.name}</div>
                  {isToday && <span className="chip" style={{ ["--chip" as string]: "var(--accent)" }}>Today</span>}
                </div>
                <div className="text-xs text-ink-3 mt-1">
                  {d.exercises.length} exercises · {d.exercises.reduce((a, e) => a + e.sets, 0)} sets
                  {last ? ` · last done ${new Date(last.finishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : " · not done yet"}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(new Set(d.exercises.map((e) => e.category))).map((c) => (
                    <CategoryChip key={c} category={c} />
                  ))}
                </div>
              </div>
              <span className="btn btn-primary btn-sm pointer-events-none">Start</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-3 mt-4">Weights are in {settings.unit}. Change units or the schedule in Settings and Program.</p>
    </div>
  );
}

function ActiveWorkout() {
  const router = useRouter();
  const { active, settings, logs, program, updateSet, addSet, removeSet, toggleWarmup, setActiveNotes, setActiveCardio, finishWorkout, applyProgressions, discardWorkout, startRest } =
    useStore();
  const [elapsed, setElapsed] = useState("0:00");
  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const day = program.days.find((d) => d.id === active?.dayId);

  useEffect(() => {
    if (!active) return;
    const tick = () => setElapsed(fmtClock(Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  const preview = useMemo(() => (active ? active.exercises.map(judgeExercise).filter((p): p is Progression => !!p) : []), [active]);
  const increases = preview.filter((p) => p.to !== p.from);

  useEffect(() => {
    if (finishOpen) setChosen(Object.fromEntries(increases.map((p) => [p.exerciseId, true])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishOpen]);

  if (!active) return null;
  const done = completedSets(active);
  const total = totalSets(active);

  const prevFor = (exerciseId: string) => {
    for (let i = logs.length - 1; i >= 0; i--) {
      const e = logs[i].exercises.find((x) => x.exerciseId === exerciseId);
      if (e && e.sets.some((s) => s.done)) return e;
    }
    return null;
  };

  const onDone = (exIdx: number, setIdx: number, ex: LoggedExercise, wasDone: boolean) => {
    updateSet(exIdx, setIdx, { done: !wasDone });
    if (!wasDone && settings.autoRestTimer) startRest(ex.compound ? settings.restCompound : settings.restIsolation);
  };

  const confirmFinish = () => {
    const { log, progressions } = finishWorkout();
    const apply = progressions.filter((p) => chosen[p.exerciseId]);
    if (apply.length) applyProgressions(log.dayId, apply);
    setFinishOpen(false);
    router.push("/");
  };

  return (
    <div className="fade-in">
      <div className="flex items-start justify-between gap-3 pt-2 pb-4">
        <div>
          <div className="eyebrow">In progress · {elapsed}</div>
          <h1 className="display text-4xl md:text-5xl">{active.name}</h1>
        </div>
        <button className="btn btn-ghost btn-sm text-ink-3" onClick={() => setDiscardOpen(true)}>
          Discard
        </button>
      </div>

      {/* Progress */}
      <div className="card p-3 mb-4 flex items-center gap-3">
        <div className="mono text-sm">
          <span className="text-ink font-semibold">{done}</span>
          <span className="text-ink-3">/{total} sets</span>
        </div>
        <div className="flex-1 h-1.5 rounded-full bg-panel-2 overflow-hidden">
          <div className="h-full bg-green transition-[width] duration-300" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
        <div className="mono text-xs text-ink-3">
          {fmtWeight(workoutVolume({ ...active, finishedAt: "" }))} {settings.unit}
        </div>
      </div>

      {/* Warm-up */}
      {day && day.warmup.length > 0 && (
        <div className="card p-4 mb-4 border-yellow/30" style={{ background: "color-mix(in srgb, var(--yellow) 6%, var(--panel))" }}>
          <div className="eyebrow mb-2" style={{ color: "var(--yellow)" }}>
            Warm-up
          </div>
          <ul className="space-y-1.5">
            {day.warmup.map((w, i) => (
              <li key={i}>
                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <input type="checkbox" className="accent-[var(--yellow)] h-4 w-4" checked={!!active.warmupDone[i]} onChange={() => toggleWarmup(i)} />
                  <span className={active.warmupDone[i] ? "line-through text-ink-3" : ""}>{w}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {active.exercises.map((ex, exIdx) => {
          const prev = prevFor(ex.exerciseId);
          const doneCount = ex.sets.filter((s) => s.done).length;
          const label = loadingLabel(ex, settings.unit);
          const isTime = ex.kind === "time";
          const showWeight = ex.kind !== "time";
          return (
            <section key={ex.exerciseId} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <CategoryChip category={ex.category} />
                  <h2 className="font-semibold text-base mt-1.5 leading-tight">{ex.name}</h2>
                  <div className="text-xs text-ink-3 mt-1 mono">
                    Target {ex.sets.length} × {ex.repMin}–{ex.repMax}
                    {isTime ? "s" : ""}
                    {ex.kind === "weight" && ex.targetWeight > 0 ? ` @ ${fmtWeight(ex.targetWeight)} ${label}` : ""}
                    {prev && (
                      <>
                        {" · "}
                        <span className="text-ink-2">
                          Last: {ex.kind !== "time" && prev.sets[0].weight ? `${fmtWeight(prev.sets[0].weight)} × ` : ""}
                          {prev.sets.filter((s) => s.done).map((s) => s.reps).join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Plates total={ex.sets.length} done={doneCount} color={CATEGORY_COLOR[ex.category]} />
              </div>

              <div className="mt-3 grid gap-1.5">
                <div className="grid grid-cols-[36px_1fr_1fr_44px_28px] gap-2 px-1 eyebrow">
                  <span>Set</span>
                  <span>{showWeight ? label : ""}</span>
                  <span>{isTime ? "sec" : "reps"}</span>
                  <span className="text-center">✓</span>
                  <span />
                </div>
                {ex.sets.map((s, setIdx) => (
                  <div key={setIdx} className={`grid grid-cols-[36px_1fr_1fr_44px_28px] gap-2 items-center rounded-lg px-1 py-0.5 ${s.done ? "opacity-70" : ""}`}>
                    <span className="mono text-sm text-ink-3 pl-1">{setIdx + 1}</span>
                    {showWeight ? (
                      <NumberInput value={s.weight} step={0.5} onChange={(v) => updateSet(exIdx, setIdx, { weight: v === "" ? 0 : v })} aria-label={`Set ${setIdx + 1} weight`} />
                    ) : (
                      <span className="text-xs text-ink-3 pl-2">—</span>
                    )}
                    <NumberInput value={s.reps} step={1} onChange={(v) => updateSet(exIdx, setIdx, { reps: v === "" ? 0 : v })} aria-label={`Set ${setIdx + 1} ${isTime ? "seconds" : "reps"}`} />
                    <button
                      type="button"
                      aria-pressed={s.done}
                      aria-label={s.done ? "Mark set not done" : "Mark set done"}
                      onClick={() => onDone(exIdx, setIdx, ex, s.done)}
                      className="h-10 rounded-lg border flex items-center justify-center transition"
                      style={{
                        background: s.done ? "var(--green)" : "var(--panel-2)",
                        borderColor: s.done ? "var(--green)" : "var(--line)",
                        color: s.done ? "#fff" : "var(--ink-3)",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </button>
                    <button type="button" className="text-ink-3 hover:text-red text-lg leading-none" aria-label="Remove set" onClick={() => removeSet(exIdx, setIdx)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <button className="btn btn-ghost btn-sm" onClick={() => addSet(exIdx)}>
                  + Add set
                </button>
                {!settings.autoRestTimer ? null : (
                  <button className="btn btn-ghost btn-sm text-ink-3" onClick={() => startRest(ex.compound ? settings.restCompound : settings.restIsolation)}>
                    Rest {fmtClock(ex.compound ? settings.restCompound : settings.restIsolation)}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Cardio */}
      <section className="card p-4 mt-4">
        <div className="eyebrow mb-2">Cardio (optional)</div>
        {day?.cardioNote && <p className="text-xs text-ink-3 mb-3">{day.cardioNote}</p>}
        <div className="grid grid-cols-[1fr_110px] gap-2">
          <select
            className="field"
            value={active.cardio?.type ?? ""}
            onChange={(e) => {
              const t = e.target.value as CardioType | "";
              setActiveCardio(t ? { type: t, minutes: active.cardio?.minutes ?? 10 } : undefined);
            }}
          >
            <option value="">None today</option>
            <option value="treadmill">Treadmill</option>
            <option value="stairmaster">StairMaster</option>
          </select>
          <NumberInput
            value={active.cardio?.minutes ?? ""}
            onChange={(v) => active.cardio && setActiveCardio({ ...active.cardio, minutes: v === "" ? 0 : v })}
            placeholder="min"
            disabled={!active.cardio}
            aria-label="Cardio minutes"
          />
        </div>
      </section>

      {/* Notes */}
      <section className="card p-4 mt-4">
        <label className="eyebrow mb-2 block" htmlFor="notes">
          Session notes
        </label>
        <textarea id="notes" className="field resize-none" rows={3} placeholder="How did it feel? Anything to change next time?" value={active.notes} onChange={(e) => setActiveNotes(e.target.value)} />
      </section>

      <button className="btn btn-primary w-full mt-4 text-base" onClick={() => setFinishOpen(true)} disabled={done === 0}>
        Finish workout
      </button>
      {done === 0 && <p className="text-center text-xs text-ink-3 mt-2">Tick at least one set to finish.</p>}

      {/* Finish modal */}
      <Modal open={finishOpen} onClose={() => setFinishOpen(false)} title="Finish workout">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="card p-3">
            <div className="eyebrow">Sets</div>
            <div className="display text-3xl">
              {done}
              <span className="text-ink-3 text-xl">/{total}</span>
            </div>
          </div>
          <div className="card p-3">
            <div className="eyebrow">Time</div>
            <div className="display text-3xl">{elapsed}</div>
          </div>
          <div className="card p-3">
            <div className="eyebrow">Moved</div>
            <div className="display text-3xl">{fmtWeight(Math.round(workoutVolume({ ...active, finishedAt: "" })))}</div>
          </div>
        </div>

        {increases.length > 0 ? (
          <>
            <div className="eyebrow mb-2">Progression</div>
            <p className="text-sm text-ink-2 mb-3">Tick the weights to write into the program for next time. Green means you earned a jump.</p>
            <div className="card divide-y divide-line mb-4">
              {increases.map((p) => (
                <label key={p.exerciseId} className="flex items-center gap-3 p-3 cursor-pointer">
                  <input type="checkbox" className="accent-[var(--green)] h-4 w-4" checked={!!chosen[p.exerciseId]} onChange={(e) => setChosen({ ...chosen, [p.exerciseId]: e.target.checked })} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-ink-3">{p.reason}</div>
                  </div>
                  <div className="mono text-sm whitespace-nowrap">
                    {fmtWeight(p.from)} → <span className="font-semibold" style={{ color: p.verdict === "increase" ? "var(--green)" : "var(--ink)" }}>{fmtWeight(p.to)}</span>
                  </div>
                </label>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-2 mb-4">
            {preview.some((p) => p.verdict === "reduce")
              ? "Some sets came in under the rep range. Keep those weights and chase the range next session."
              : "Solid session. Keep the same weights and add reps next time."}
          </p>
        )}

        <div className="flex gap-2">
          <button className="btn btn-secondary flex-1" onClick={() => setFinishOpen(false)}>
            Keep going
          </button>
          <button className="btn btn-primary flex-1" onClick={confirmFinish}>
            Save workout
          </button>
        </div>
      </Modal>

      <Modal open={discardOpen} onClose={() => setDiscardOpen(false)} title="Discard workout?">
        <p className="text-sm text-ink-2 mb-4">Everything ticked in this session is thrown away. This cannot be undone.</p>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex-1" onClick={() => setDiscardOpen(false)}>
            Keep it
          </button>
          <button
            className="btn btn-danger flex-1"
            onClick={() => {
              discardWorkout();
              setDiscardOpen(false);
            }}
          >
            Discard
          </button>
        </div>
      </Modal>
    </div>
  );
}
