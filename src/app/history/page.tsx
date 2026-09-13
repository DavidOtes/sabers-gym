"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { CategoryChip, Empty, Modal, PageTitle, Plates } from "@/components/ui";
import { CATEGORY_COLOR, completedSets, fmtDate, fmtDuration, fmtWeight, totalSets, workoutVolume, loadingLabel } from "@/lib/utils";

export default function HistoryPage() {
  const { logs, settings, deleteLog } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const sorted = [...logs].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));

  const groups = sorted.reduce<Record<string, typeof sorted>>((acc, l) => {
    const k = fmtDate(l.finishedAt, { month: "long", year: "numeric" });
    (acc[k] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div className="space-y-6 fade-in">
      <PageTitle eyebrow={`${logs.length} session${logs.length === 1 ? "" : "s"}`} title="History" />
      {sorted.length === 0 ? (
        <Empty
          title="No sessions yet"
          body="Finished workouts land here with every set you ticked."
          action={
            <Link href="/workout" className="btn btn-primary">
              Start a workout
            </Link>
          }
        />
      ) : (
        Object.entries(groups).map(([month, items]) => (
          <section key={month}>
            <h2 className="display text-xl text-ink-2 mb-3">{month}</h2>
            <div className="space-y-2">
              {items.map((l) => {
                const isOpen = open === l.id;
                const dur = new Date(l.finishedAt).getTime() - new Date(l.startedAt).getTime();
                return (
                  <article key={l.id} className="card overflow-hidden">
                    <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-panel-2/40 transition" onClick={() => setOpen(isOpen ? null : l.id)} aria-expanded={isOpen}>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{l.name}</div>
                        <div className="text-xs text-ink-3 mono mt-0.5">
                          {fmtDate(l.finishedAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtDuration(dur)} · {completedSets(l)}/{totalSets(l)} sets · {fmtWeight(Math.round(workoutVolume(l)))} {settings.unit}
                          {l.cardio ? ` · ${l.cardio.type === "treadmill" ? "Treadmill" : "StairMaster"} ${l.cardio.minutes} min` : ""}
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex shrink-0">
                        <Plates total={Math.min(totalSets(l), 10)} done={Math.min(completedSets(l), 10)} color="var(--green)" />
                      </span>
                      <span className={`text-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-line fade-in">
                        <div className="divide-y divide-line">
                          {l.exercises.map((e) => {
                            const done = e.sets.filter((s) => s.done);
                            return (
                              <div key={e.exerciseId} className="px-4 py-3 flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{e.name}</span>
                                    <CategoryChip category={e.category} />
                                  </div>
                                  <div className="mono text-xs text-ink-2 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                    {done.length === 0 ? (
                                      <span className="text-ink-3">skipped</span>
                                    ) : (
                                      done.map((s, i) => (
                                        <span key={i}>
                                          {e.kind === "time" ? `${s.reps}s` : e.kind === "bodyweight" && !s.weight ? `BW × ${s.reps}` : `${fmtWeight(s.weight)} × ${s.reps}`}
                                        </span>
                                      ))
                                    )}
                                    {done.length > 0 && e.kind === "weight" && <span className="text-ink-3">({loadingLabel(e, settings.unit)})</span>}
                                  </div>
                                </div>
                                <Plates total={e.sets.length} done={done.length} color={CATEGORY_COLOR[e.category]} />
                              </div>
                            );
                          })}
                        </div>
                        {l.notes && (
                          <div className="px-4 py-3 border-t border-line text-sm text-ink-2">
                            <span className="eyebrow block mb-1">Notes</span>
                            {l.notes}
                          </div>
                        )}
                        <div className="px-4 py-2 border-t border-line flex justify-end">
                          <button className="btn btn-danger btn-sm" onClick={() => setDel(l.id)}>
                            Delete session
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}

      <Modal open={!!del} onClose={() => setDel(null)} title="Delete session?">
        <p className="text-sm text-ink-2 mb-4">This removes the session and its sets from your history and progress charts.</p>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex-1" onClick={() => setDel(null)}>
            Keep it
          </button>
          <button
            className="btn btn-danger flex-1"
            onClick={() => {
              if (del) deleteLog(del);
              setDel(null);
            }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
