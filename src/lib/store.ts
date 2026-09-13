"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_PROGRAM } from "./program";
import type {
  ActiveWorkout,
  DailyCheckin,
  LoggedExercise,
  LoggedSet,
  Program,
  ProgramDay,
  ProgramExercise,
  Progression,
  Schedule,
  Settings,
  WeeklyCheckin,
  WorkoutLog,
} from "./types";
import { judgeExercise, uid } from "./utils";

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  program: Program;
  logs: WorkoutLog[];
  daily: DailyCheckin[];
  weekly: WeeklyCheckin[];
  settings: Settings;
}

interface State {
  hydrated: boolean;
  program: Program;
  logs: WorkoutLog[];
  daily: DailyCheckin[];
  weekly: WeeklyCheckin[];
  settings: Settings;
  active: ActiveWorkout | null;
  /** Rest timer end timestamp (ms) or null. */
  restUntil: number | null;
  restTotal: number;

  // workout
  startWorkout: (dayId: string) => void;
  discardWorkout: () => void;
  updateSet: (exIdx: number, setIdx: number, patch: Partial<LoggedSet>) => void;
  addSet: (exIdx: number) => void;
  removeSet: (exIdx: number, setIdx: number) => void;
  toggleWarmup: (i: number) => void;
  setActiveNotes: (notes: string) => void;
  setActiveCardio: (cardio: ActiveWorkout["cardio"]) => void;
  finishWorkout: () => { log: WorkoutLog; progressions: Progression[] };
  applyProgressions: (dayId: string, progs: Progression[]) => void;
  startRest: (seconds: number) => void;
  extendRest: (seconds: number) => void;
  stopRest: () => void;

  // program
  updateExercise: (dayId: string, exId: string, patch: Partial<ProgramExercise>) => void;
  addExercise: (dayId: string, e: Omit<ProgramExercise, "id">) => void;
  removeExercise: (dayId: string, exId: string) => void;
  moveExercise: (dayId: string, exId: string, dir: -1 | 1) => void;
  updateDay: (dayId: string, patch: Partial<Omit<ProgramDay, "id" | "exercises">>) => void;
  setSchedule: (schedule: Schedule) => void;
  resetProgram: () => void;

  // logs & checkins
  deleteLog: (id: string) => void;
  addDaily: (c: Omit<DailyCheckin, "id">) => void;
  deleteDaily: (id: string) => void;
  addWeekly: (c: Omit<WeeklyCheckin, "id">) => void;
  deleteWeekly: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  exportAll: () => ExportBundle;
  importAll: (b: ExportBundle) => void;
  resetAll: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  name: "Saber",
  unit: "kg",
  autoRestTimer: true,
  restCompound: 150,
  restIsolation: 75,
  theme: "dark",
};

function lastSetsFor(logs: WorkoutLog[], exerciseId: string): LoggedSet[] | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    const e = logs[i].exercises.find((x) => x.exerciseId === exerciseId);
    if (e && e.sets.some((s) => s.done)) return e.sets.filter((s) => s.done);
  }
  return null;
}

function buildLogged(e: ProgramExercise, logs: WorkoutLog[]): LoggedExercise {
  const prev = lastSetsFor(logs, e.id);
  const sets: LoggedSet[] = Array.from({ length: e.sets }, (_, i) => ({
    weight: e.kind === "time" ? 0 : e.weight,
    reps: prev?.[i]?.reps ?? (e.kind === "time" ? e.repMin : e.repMin),
    done: false,
  }));
  return {
    exerciseId: e.id,
    name: e.name,
    category: e.category,
    kind: e.kind,
    perSide: !!e.perSide,
    compound: e.compound,
    repMin: e.repMin,
    repMax: e.repMax,
    targetWeight: e.weight,
    increment: e.increment,
    sets,
  };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      program: DEFAULT_PROGRAM,
      logs: [],
      daily: [],
      weekly: [],
      settings: DEFAULT_SETTINGS,
      active: null,
      restUntil: null,
      restTotal: 0,

      startWorkout: (dayId) => {
        const { program, logs } = get();
        const day = program.days.find((d) => d.id === dayId);
        if (!day) return;
        set({
          active: {
            id: uid(),
            dayId,
            name: day.name,
            startedAt: new Date().toISOString(),
            exercises: day.exercises.map((e) => buildLogged(e, logs)),
            warmupDone: day.warmup.map(() => false),
            notes: "",
          },
          restUntil: null,
        });
      },
      discardWorkout: () => set({ active: null, restUntil: null }),
      updateSet: (exIdx, setIdx, patch) =>
        set((s) => {
          if (!s.active) return s;
          const exercises = s.active.exercises.map((e, i) =>
            i !== exIdx ? e : { ...e, sets: e.sets.map((st, j) => (j === setIdx ? { ...st, ...patch } : st)) },
          );
          return { active: { ...s.active, exercises } };
        }),
      addSet: (exIdx) =>
        set((s) => {
          if (!s.active) return s;
          const exercises = s.active.exercises.map((e, i) => {
            if (i !== exIdx) return e;
            const last = e.sets[e.sets.length - 1];
            return { ...e, sets: [...e.sets, { weight: last?.weight ?? e.targetWeight, reps: last?.reps ?? e.repMin, done: false }] };
          });
          return { active: { ...s.active, exercises } };
        }),
      removeSet: (exIdx, setIdx) =>
        set((s) => {
          if (!s.active) return s;
          const exercises = s.active.exercises.map((e, i) =>
            i !== exIdx ? e : { ...e, sets: e.sets.filter((_, j) => j !== setIdx) },
          );
          return { active: { ...s.active, exercises } };
        }),
      toggleWarmup: (i) =>
        set((s) => (s.active ? { active: { ...s.active, warmupDone: s.active.warmupDone.map((v, j) => (j === i ? !v : v)) } } : s)),
      setActiveNotes: (notes) => set((s) => (s.active ? { active: { ...s.active, notes } } : s)),
      setActiveCardio: (cardio) => set((s) => (s.active ? { active: { ...s.active, cardio } } : s)),
      finishWorkout: () => {
        const { active } = get();
        if (!active) throw new Error("No active workout");
        const log: WorkoutLog = { ...active, finishedAt: new Date().toISOString() };
        const progressions = log.exercises.map(judgeExercise).filter((p): p is Progression => !!p);
        set((s) => ({ logs: [...s.logs, log], active: null, restUntil: null }));
        return { log, progressions };
      },
      applyProgressions: (dayId, progs) =>
        set((s) => ({
          program: {
            ...s.program,
            days: s.program.days.map((d) => ({
              ...d,
              // Same exercise id only lives on one day, but shared names (e.g. Lat Pulldown on two days) stay independent.
              exercises: d.exercises.map((e) => {
                const p = progs.find((x) => x.exerciseId === e.id && x.to !== x.from);
                return p && d.id === dayId ? { ...e, weight: p.to } : e;
              }),
            })),
          },
        })),
      startRest: (seconds) => set({ restUntil: Date.now() + seconds * 1000, restTotal: seconds }),
      extendRest: (seconds) =>
        set((s) => ({ restUntil: (s.restUntil ?? Date.now()) + seconds * 1000, restTotal: s.restTotal + seconds })),
      stopRest: () => set({ restUntil: null }),

      updateExercise: (dayId, exId, patch) =>
        set((s) => ({
          program: {
            ...s.program,
            days: s.program.days.map((d) =>
              d.id !== dayId ? d : { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) },
            ),
          },
        })),
      addExercise: (dayId, e) =>
        set((s) => ({
          program: {
            ...s.program,
            days: s.program.days.map((d) => (d.id !== dayId ? d : { ...d, exercises: [...d.exercises, { ...e, id: uid() }] })),
          },
        })),
      removeExercise: (dayId, exId) =>
        set((s) => ({
          program: {
            ...s.program,
            days: s.program.days.map((d) => (d.id !== dayId ? d : { ...d, exercises: d.exercises.filter((e) => e.id !== exId) })),
          },
        })),
      moveExercise: (dayId, exId, dir) =>
        set((s) => ({
          program: {
            ...s.program,
            days: s.program.days.map((d) => {
              if (d.id !== dayId) return d;
              const i = d.exercises.findIndex((e) => e.id === exId);
              const j = i + dir;
              if (i < 0 || j < 0 || j >= d.exercises.length) return d;
              const arr = [...d.exercises];
              [arr[i], arr[j]] = [arr[j], arr[i]];
              return { ...d, exercises: arr };
            }),
          },
        })),
      updateDay: (dayId, patch) =>
        set((s) => ({
          program: { ...s.program, days: s.program.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)) },
        })),
      setSchedule: (schedule) => set((s) => ({ program: { ...s.program, schedule } })),
      resetProgram: () => set({ program: DEFAULT_PROGRAM }),

      deleteLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
      addDaily: (c) =>
        set((s) => ({ daily: [...s.daily.filter((d) => d.date !== c.date), { ...c, id: uid() }].sort((a, b) => a.date.localeCompare(b.date)) })),
      deleteDaily: (id) => set((s) => ({ daily: s.daily.filter((d) => d.id !== id) })),
      addWeekly: (c) =>
        set((s) => ({ weekly: [...s.weekly, { ...c, id: uid() }].sort((a, b) => a.date.localeCompare(b.date)) })),
      deleteWeekly: (id) => set((s) => ({ weekly: s.weekly.filter((d) => d.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      exportAll: () => {
        const { program, logs, daily, weekly, settings } = get();
        return { version: 1, exportedAt: new Date().toISOString(), program, logs, daily, weekly, settings };
      },
      importAll: (b) =>
        set({
          program: b.program ?? DEFAULT_PROGRAM,
          logs: b.logs ?? [],
          daily: b.daily ?? [],
          weekly: b.weekly ?? [],
          settings: { ...DEFAULT_SETTINGS, ...(b.settings ?? {}) },
          active: null,
          restUntil: null,
        }),
      resetAll: () =>
        set({ program: DEFAULT_PROGRAM, logs: [], daily: [], weekly: [], settings: DEFAULT_SETTINGS, active: null, restUntil: null }),
    }),
    {
      name: "sabers-gym-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        program: s.program,
        logs: s.logs,
        daily: s.daily,
        weekly: s.weekly,
        settings: s.settings,
        active: s.active,
        restUntil: s.restUntil,
        restTotal: s.restTotal,
      }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);
