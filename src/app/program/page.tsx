"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { EQUIPMENT } from "@/lib/program";
import { CATEGORIES, type Category, type ExerciseKind, type ProgramDay, type ProgramExercise } from "@/lib/types";
import { CategoryChip, Field, Modal, NumberInput, PageTitle, SectionTitle } from "@/components/ui";
import { describeTarget, WEEKDAYS } from "@/lib/utils";

type Draft = Omit<ProgramExercise, "id">;
const BLANK: Draft = { name: "", category: "Chest", sets: 3, repMin: 8, repMax: 12, weight: 0, kind: "weight", compound: false, increment: 2.5, perSide: false, optional: false, notes: "" };

export default function ProgramPage() {
  const { program, settings, updateExercise, addExercise, removeExercise, moveExercise, updateDay, setSchedule, resetProgram } = useStore();
  const [editing, setEditing] = useState<{ dayId: string; exId?: string; draft: Draft } | null>(null);
  const [dayEdit, setDayEdit] = useState<ProgramDay | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const save = () => {
    if (!editing || !editing.draft.name.trim()) return;
    const d = { ...editing.draft, name: editing.draft.name.trim(), repMax: Math.max(editing.draft.repMin, editing.draft.repMax) };
    if (editing.exId) updateExercise(editing.dayId, editing.exId, d);
    else addExercise(editing.dayId, d);
    setEditing(null);
  };

  return (
    <div className="space-y-6 fade-in">
      <PageTitle eyebrow="Four days a week" title="Program" />

      {/* Schedule */}
      <section className="card p-4">
        <SectionTitle>Schedule</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
            <label key={dow} className="block">
              <span className="eyebrow block mb-1">{WEEKDAYS[dow].slice(0, 3)}</span>
              <select className="field text-sm" value={program.schedule[dow] ?? ""} onChange={(e) => setSchedule({ ...program.schedule, [dow]: e.target.value || null })}>
                <option value="">Rest</option>
                {program.days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      {/* Days */}
      {program.days.map((day, di) => (
        <section key={day.id} className="card">
          <div className="flex items-start justify-between gap-3 p-4 border-b border-line">
            <div>
              <div className="eyebrow">
                Day {di + 1} · {Object.entries(program.schedule).filter(([, v]) => v === day.id).map(([k]) => WEEKDAYS[Number(k)]).join(", ") || "unscheduled"}
              </div>
              <h2 className="display text-2xl mt-0.5">{day.name}</h2>
              {day.warmup.length > 0 && <p className="text-xs text-ink-3 mt-1">Warm-up: {day.warmup.join(" · ")}</p>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setDayEdit(day)}>
              Edit day
            </button>
          </div>
          <div className="divide-y divide-line">
            {day.exercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col gap-0.5 text-ink-3">
                  <button aria-label="Move up" disabled={i === 0} className="hover:text-ink disabled:opacity-20 leading-none" onClick={() => moveExercise(day.id, ex.id, -1)}>
                    ▲
                  </button>
                  <button aria-label="Move down" disabled={i === day.exercises.length - 1} className="hover:text-ink disabled:opacity-20 leading-none" onClick={() => moveExercise(day.id, ex.id, 1)}>
                    ▼
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{ex.name}</span>
                    <CategoryChip category={ex.category} />
                    {ex.compound && <span className="chip" style={{ ["--chip" as string]: "var(--ink-2)" }}>Compound</span>}
                    {ex.optional && <span className="chip">Optional</span>}
                  </div>
                  <div className="text-xs text-ink-3 mono mt-0.5">
                    {describeTarget(ex, settings.unit)}
                    {ex.notes ? ` · ${ex.notes}` : ""}
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm mono" onClick={() => setEditing({ dayId: day.id, exId: ex.id, draft: { ...BLANK, ...ex } })}>
                  {ex.kind === "time" ? "Edit" : ex.weight > 0 ? `${ex.weight} ${settings.unit}` : "Set"}
                </button>
              </div>
            ))}
          </div>
          <div className="p-3">
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ dayId: day.id, draft: { ...BLANK } })}>
              + Add exercise
            </button>
          </div>
        </section>
      ))}

      {/* Rules */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <SectionTitle>Progression</SectionTitle>
          <p className="text-sm text-ink-2">When you reach the top of the rep range on every set with good form, go up a little next session. The app suggests this automatically when you finish a workout.</p>
          <div className="mono text-xs mt-3 space-y-1 text-ink-3">
            <div>
              Bench 3 × 6–10 → <span className="text-ink-2">8, 8, 7</span> keep the weight
            </div>
            <div>
              Bench 3 × 6–10 → <span className="text-green">10, 10, 10</span> go up
            </div>
          </div>
        </div>
        <div className="card p-4">
          <SectionTitle>Rest &amp; cardio</SectionTitle>
          <ul className="text-sm text-ink-2 space-y-1.5">
            <li>Heavy compounds: 2–3 min between sets.</li>
            <li>Machines and isolation: 60–90 s.</li>
            <li>Cardio 2–3× a week: treadmill 10–20 min or StairMaster 5–15 min, kept away from heavy leg days.</li>
            <li>Stop a set if form starts to break down.</li>
          </ul>
        </div>
      </section>

      <section className="card p-4">
        <SectionTitle>Equipment</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-line">
          {EQUIPMENT.map((e) => (
            <div key={e.name} className="py-2 text-sm">
              <div className="font-medium">{e.name}</div>
              <div className="text-ink-2 text-xs">{e.uses}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button className="btn btn-danger btn-sm" onClick={() => setResetOpen(true)}>
          Reset program to default
        </button>
      </div>

      {/* Exercise editor */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.exId ? "Edit exercise" : "Add exercise"}>
        {editing && (
          <div className="space-y-3">
            <Field label="Name">
              <input className="field" value={editing.draft.name} autoFocus onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, name: e.target.value } })} placeholder="e.g. Cable Row" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Muscle group">
                <select className="field" value={editing.draft.category} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, category: e.target.value as Category } })}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Type">
                <select className="field" value={editing.draft.kind} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, kind: e.target.value as ExerciseKind } })}>
                  <option value="weight">Weighted</option>
                  <option value="bodyweight">Bodyweight</option>
                  <option value="time">Timed hold</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Sets">
                <NumberInput value={editing.draft.sets} min={1} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, sets: v === "" ? 1 : Math.max(1, v) } })} />
              </Field>
              <Field label={editing.draft.kind === "time" ? "Min sec" : "Min reps"}>
                <NumberInput value={editing.draft.repMin} min={1} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, repMin: v === "" ? 1 : v } })} />
              </Field>
              <Field label={editing.draft.kind === "time" ? "Max sec" : "Max reps"}>
                <NumberInput value={editing.draft.repMax} min={1} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, repMax: v === "" ? 1 : v } })} />
              </Field>
            </div>
            {editing.draft.kind !== "time" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={`${editing.draft.kind === "bodyweight" ? "Added load" : "Weight"} (${settings.unit})`}>
                  <NumberInput value={editing.draft.weight} step={0.5} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, weight: v === "" ? 0 : v } })} />
                </Field>
                <Field label="Jump when progressing" hint="Dumbbells 1.25–2.5, bars 2.5, machines 5">
                  <NumberInput value={editing.draft.increment} step={0.25} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, increment: v === "" ? 2.5 : v } })} />
                </Field>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <label className="flex items-center gap-2 card p-2.5 cursor-pointer">
                <input type="checkbox" className="accent-[var(--accent)]" checked={!!editing.draft.perSide} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, perSide: e.target.checked } })} />
                Per side
              </label>
              <label className="flex items-center gap-2 card p-2.5 cursor-pointer">
                <input type="checkbox" className="accent-[var(--accent)]" checked={editing.draft.compound} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, compound: e.target.checked } })} />
                Compound
              </label>
              <label className="flex items-center gap-2 card p-2.5 cursor-pointer">
                <input type="checkbox" className="accent-[var(--accent)]" checked={!!editing.draft.optional} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, optional: e.target.checked } })} />
                Optional
              </label>
            </div>
            <Field label="Notes">
              <input className="field" value={editing.draft.notes ?? ""} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, notes: e.target.value } })} placeholder="Cues, rest, alternatives" />
            </Field>
            <div className="flex gap-2 pt-1">
              {editing.exId && (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    removeExercise(editing.dayId, editing.exId!);
                    setEditing(null);
                  }}
                >
                  Remove
                </button>
              )}
              <button className="btn btn-primary flex-1" onClick={save} disabled={!editing.draft.name.trim()}>
                {editing.exId ? "Save changes" : "Add exercise"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Day editor */}
      <Modal open={!!dayEdit} onClose={() => setDayEdit(null)} title="Edit day">
        {dayEdit && (
          <div className="space-y-3">
            <Field label="Name">
              <input className="field" value={dayEdit.name} onChange={(e) => setDayEdit({ ...dayEdit, name: e.target.value })} />
            </Field>
            <Field label="Warm-up" hint="One item per line">
              <textarea className="field resize-none" rows={3} value={dayEdit.warmup.join("\n")} onChange={(e) => setDayEdit({ ...dayEdit, warmup: e.target.value.split("\n") })} />
            </Field>
            <Field label="Cardio note">
              <input className="field" value={dayEdit.cardioNote ?? ""} onChange={(e) => setDayEdit({ ...dayEdit, cardioNote: e.target.value })} placeholder="e.g. 10 min StairMaster after" />
            </Field>
            <button
              className="btn btn-primary w-full"
              onClick={() => {
                updateDay(dayEdit.id, { name: dayEdit.name.trim() || dayEdit.name, warmup: dayEdit.warmup.map((w) => w.trim()).filter(Boolean), cardioNote: dayEdit.cardioNote?.trim() || undefined });
                setDayEdit(null);
              }}
            >
              Save day
            </button>
          </div>
        )}
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset program?">
        <p className="text-sm text-ink-2 mb-4">This restores the original four-day split and starting weights. Your logged workouts and check-ins are kept.</p>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex-1" onClick={() => setResetOpen(false)}>
            Cancel
          </button>
          <button
            className="btn btn-danger flex-1"
            onClick={() => {
              resetProgram();
              setResetOpen(false);
            }}
          >
            Reset
          </button>
        </div>
      </Modal>
    </div>
  );
}
