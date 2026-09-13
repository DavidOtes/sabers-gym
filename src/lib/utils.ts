import type {
  Category,
  LoggedExercise,
  ProgramExercise,
  Progression,
  WorkoutLog,
} from "./types";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Local YYYY-MM-DD */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-based start of the week containing d. */
export function startOfWeek(d: Date = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - dow);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b);
}

export function fmtDate(s: string | Date, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) {
  const d = typeof s === "string" ? (s.length === 10 ? parseIso(s) : new Date(s)) : s;
  return d.toLocaleDateString("en-GB", opts);
}

export function fmtDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtWeight(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(w * 10 % 1 === 0 ? 1 : 2);
}

/** Epley estimated one-rep max. */
export function e1rm(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function exerciseVolume(e: LoggedExercise): number {
  if (e.kind === "time") return 0;
  const mult = e.perSide ? 2 : 1;
  return e.sets
    .filter((s) => s.done)
    .reduce((acc, s) => acc + s.weight * mult * s.reps, 0);
}

export function workoutVolume(w: WorkoutLog): number {
  return w.exercises.reduce((a, e) => a + exerciseVolume(e), 0);
}

export function completedSets(w: WorkoutLog | { exercises: LoggedExercise[] }): number {
  return w.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
}

export function totalSets(w: { exercises: LoggedExercise[] }): number {
  return w.exercises.reduce((a, e) => a + e.sets.length, 0);
}

/** Progression rule: top of range on every set → increase; below bottom on any → reduce/hold. */
export function judgeExercise(e: LoggedExercise): Progression | null {
  const done = e.sets.filter((s) => s.done);
  if (done.length === 0) return null;
  const from = e.targetWeight;
  if (e.kind === "time") {
    const allTop = done.every((s) => s.reps >= e.repMax);
    return allTop
      ? { exerciseId: e.exerciseId, name: e.name, verdict: "increase", from, to: from, reason: `Held ${e.repMax}s on every set — try a longer hold or add load.` }
      : { exerciseId: e.exerciseId, name: e.name, verdict: "hold", from, to: from, reason: "Keep building toward the top of the range." };
  }
  const allTop = done.every((s) => s.reps >= e.repMax);
  const anyBelow = done.some((s) => s.reps < e.repMin);
  // Base the call on what was actually lifted, not just the programmed number.
  const lifted = Math.max(...done.map((s) => s.weight));
  const base = lifted > 0 ? lifted : from;
  if (e.kind === "weight" && base === 0) {
    return { exerciseId: e.exerciseId, name: e.name, verdict: "hold", from, to: from, reason: "No weight logged yet — type what you lifted next time." };
  }
  if (e.kind === "bodyweight" && base === 0) {
    return allTop
      ? { exerciseId: e.exerciseId, name: e.name, verdict: "increase", from, to: from, reason: `Hit ${e.repMax}+ on every set — add reps or a little load.` }
      : { exerciseId: e.exerciseId, name: e.name, verdict: "hold", from, to: from, reason: "Keep building reps." };
  }
  if (allTop) {
    const to = Math.round((base + e.increment) * 100) / 100;
    return { exerciseId: e.exerciseId, name: e.name, verdict: "increase", from, to, reason: `Hit ${e.repMax}+ on all ${done.length} sets at ${fmtWeight(base)}.` };
  }
  if (anyBelow) {
    return { exerciseId: e.exerciseId, name: e.name, verdict: "reduce", from, to: base, reason: `Fell under ${e.repMin} reps — stay at ${fmtWeight(base)} and chase the range.` };
  }
  return { exerciseId: e.exerciseId, name: e.name, verdict: "hold", from, to: base, reason: `In range. Keep ${fmtWeight(base)} and add reps.` };
}

export const CATEGORY_COLOR: Record<Category, string> = {
  Chest: "var(--c-chest)",
  Back: "var(--c-back)",
  Shoulders: "var(--c-shoulders)",
  Biceps: "var(--c-biceps)",
  Triceps: "var(--c-triceps)",
  Quads: "var(--c-quads)",
  Hamstrings: "var(--c-hamstrings)",
  Glutes: "var(--c-glutes)",
  Calves: "var(--c-calves)",
  Core: "var(--c-core)",
};

export function describeTarget(e: ProgramExercise, unit: string): string {
  const reps = e.kind === "time" ? `${e.repMin}–${e.repMax}s` : `${e.repMin}–${e.repMax}`;
  if (e.kind === "time") return `${e.sets} × ${reps}`;
  if (e.kind === "bodyweight") return `${e.sets} × ${reps} · bodyweight${e.weight ? ` +${fmtWeight(e.weight)} ${unit}` : ""}`;
  const w = e.weight > 0 ? `${fmtWeight(e.weight)} ${unit}${e.perSide ? " each" : ""}` : "set weight";
  return `${e.sets} × ${reps} @ ${w}`;
}

export function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function loadingLabel(e: LoggedExercise, unit: string): string {
  if (e.kind === "time") return "seconds";
  if (e.kind === "bodyweight") return `+${unit}`;
  return e.perSide ? `${unit} each` : unit;
}
