export type Unit = "kg" | "lb";
export type ExerciseKind = "weight" | "bodyweight" | "time";
export type Category =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Quads"
  | "Hamstrings"
  | "Glutes"
  | "Calves"
  | "Core"
  | "Lower Back";

export const CATEGORIES: Category[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Lower Back",
];

export interface ProgramExercise {
  id: string;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  /** Working weight. For bodyweight moves this is added load (0 = none). For time moves it is ignored. */
  weight: number;
  /** Weight is per hand / per side (dumbbells, single-arm cable). */
  perSide?: boolean;
  kind: ExerciseKind;
  category: Category;
  compound: boolean;
  optional?: boolean;
  /** Suggested jump when progressing. */
  increment: number;
  notes?: string;
}

export interface ProgramDay {
  id: string;
  name: string;
  warmup: string[];
  exercises: ProgramExercise[];
  cardioNote?: string;
  /** An add-on block (e.g. Core) that can be run alone or appended to any session. */
  addon?: boolean;
}

/** 0 = Sunday … 6 = Saturday, value = day id or null for rest. */
export type Schedule = Record<number, string | null>;

export interface Program {
  days: ProgramDay[];
  schedule: Schedule;
}

export interface LoggedSet {
  weight: number;
  reps: number;
  done: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  name: string;
  category: Category;
  kind: ExerciseKind;
  perSide: boolean;
  compound: boolean;
  repMin: number;
  repMax: number;
  targetWeight: number;
  increment: number;
  sets: LoggedSet[];
}

export type CardioType = "treadmill" | "stairmaster";

export interface WorkoutLog {
  id: string;
  dayId: string;
  name: string;
  startedAt: string;
  finishedAt: string;
  exercises: LoggedExercise[];
  warmupDone: boolean[];
  cardio?: { type: CardioType; minutes: number };
  notes: string;
}

export type ActiveWorkout = Omit<WorkoutLog, "finishedAt">;

export interface DailyCheckin {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  sleep: number;
  energy: number;
  soreness: number;
  mood: number;
  notes: string;
}

export interface WeeklyCheckin {
  id: string;
  date: string;
  weight: number;
  chest?: number;
  waist?: number;
  arms?: number;
  notes: string;
}

export interface Settings {
  name: string;
  unit: Unit;
  autoRestTimer: boolean;
  restCompound: number;
  restIsolation: number;
  theme: "dark" | "light" | "system";
}

export interface Progression {
  exerciseId: string;
  name: string;
  verdict: "increase" | "hold" | "reduce";
  from: number;
  to: number;
  reason: string;
}
