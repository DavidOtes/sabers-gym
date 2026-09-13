import type { Program, ProgramExercise, Category } from "./types";

let n = 0;
const ex = (
  name: string,
  category: Category,
  sets: number,
  reps: [number, number],
  weight: number,
  opts: Partial<ProgramExercise> = {},
): ProgramExercise => ({
  id: `ex${++n}`,
  name,
  category,
  sets,
  repMin: reps[0],
  repMax: reps[1],
  weight,
  kind: "weight",
  compound: false,
  increment: 2.5,
  ...opts,
});

export const DEFAULT_PROGRAM: Program = {
  days: [
    {
      id: "push",
      name: "Chest, Shoulders & Triceps",
      warmup: ["5–10 min easy treadmill walk", "1–2 light sets of bench press"],
      exercises: [
        ex("Barbell Bench Press", "Chest", 3, [6, 10], 30, { compound: true, notes: "2–3 min rest" }),
        ex("Incline Dumbbell Press", "Chest", 3, [8, 12], 15, { perSide: true, compound: true }),
        ex("Cable Chest Fly", "Chest", 3, [10, 15], 20, { perSide: true }),
        ex("Multi-Press Shoulder Press", "Shoulders", 3, [8, 12], 36.3, { compound: true }),
        ex("Dumbbell Lateral Raise", "Shoulders", 3, [10, 15], 7.5, { perSide: true, increment: 1.25 }),
        ex("Cable Triceps Pushdown", "Triceps", 3, [10, 15], 30),
        ex("Overhead Cable Triceps Extension", "Triceps", 2, [10, 15], 15),
      ],
    },
    {
      id: "pull",
      name: "Back & Biceps",
      warmup: ["5–10 min easy treadmill", "Light lat pulldowns"],
      exercises: [
        ex("Lat Pulldown", "Back", 3, [8, 12], 45, { compound: true, notes: "2–3 min rest" }),
        ex("Low Cable Row", "Back", 3, [8, 12], 0, { compound: true, notes: "Set a starting weight" }),
        ex("Single-Arm Cable Row", "Back", 3, [10, 12], 20, { perSide: true }),
        ex("Cable Face Pull", "Back", 3, [12, 15], 0, { notes: "Set a starting weight" }),
        ex("Dumbbell Curl", "Biceps", 3, [8, 12], 0, { perSide: true, increment: 1.25, notes: "Set a starting weight" }),
        ex("Cable Curl", "Biceps", 3, [10, 15], 0, { notes: "Set a starting weight" }),
        ex("Pull-ups", "Back", 2, [5, 10], 0, { kind: "bodyweight", optional: true, compound: true, notes: "Only if comfortable" }),
      ],
    },
    {
      id: "legs",
      name: "Legs",
      warmup: ["5–10 min treadmill or easy StairMaster", "Several light reps on the leg press"],
      cardioNote: "Optional: 5–10 min StairMaster at a comfortable pace after lifting.",
      exercises: [
        ex("Leg Press", "Quads", 3, [8, 12], 100, { compound: true, increment: 10, notes: "Felt easy at 100 — push it" }),
        ex("Smith Machine Squat", "Quads", 3, [8, 12], 40, { compound: true, increment: 5 }),
        ex("Leg Extension", "Quads", 3, [10, 15], 0, { increment: 5, notes: "Set a starting weight" }),
        ex("Leg Curl", "Hamstrings", 3, [10, 15], 0, { increment: 5, notes: "Set a starting weight" }),
        ex("Calf Raise", "Calves", 3, [12, 20], 0, { increment: 5, notes: "Standing or on the leg press" }),
      ],
    },
    {
      id: "upper",
      name: "Full Upper Body",
      warmup: ["5–10 min easy cardio", "Light pressing warm-up"],
      exercises: [
        ex("Dumbbell Bench Press", "Chest", 3, [8, 12], 15, { perSide: true, compound: true }),
        ex("Lat Pulldown", "Back", 3, [8, 12], 45, { compound: true }),
        ex("Cable Row", "Back", 3, [8, 12], 0, { compound: true, notes: "Set a starting weight" }),
        ex("Dumbbell Shoulder Press", "Shoulders", 3, [8, 12], 0, { perSide: true, compound: true, notes: "Set a starting weight" }),
        ex("Cable Lateral Raise", "Shoulders", 2, [12, 15], 0, { increment: 1.25, notes: "Set a starting weight" }),
        ex("Cable Triceps Pushdown", "Triceps", 2, [10, 15], 30),
        ex("Dumbbell or Cable Curl", "Biceps", 2, [10, 15], 0, { increment: 1.25, notes: "Set a starting weight" }),
        ex("Cable Face Pull", "Back", 2, [12, 15], 0, { optional: true, notes: "Set a starting weight" }),
        ex("Cable Crunch", "Core", 3, [12, 15], 0, { increment: 5, notes: "Set a starting weight" }),
        ex("Hanging Leg Raise", "Core", 3, [10, 15], 0, { kind: "bodyweight", notes: "Or lying leg raises" }),
        ex("Plank", "Core", 2, [30, 60], 0, { kind: "time" }),
      ],
    },
  ],
  schedule: { 0: null, 1: "push", 2: "pull", 3: null, 4: "legs", 5: "upper", 6: null },
};

export const EQUIPMENT: { name: string; uses: string }[] = [
  { name: "Dual adjustable pulley / functional trainer", uses: "Rows, flyes, face pulls, curls, triceps, lateral raises" },
  { name: "Lat pulldown", uses: "Lats and upper back" },
  { name: "Low pulley", uses: "Seated rows and cable work" },
  { name: "Smith / multi-press", uses: "Squats, presses" },
  { name: "Leg extension", uses: "Quadriceps" },
  { name: "Leg curl", uses: "Hamstrings" },
  { name: "Leg press", uses: "Quads, glutes, hamstrings" },
  { name: "Barbells", uses: "Bench press, squats, compound lifts" },
  { name: "Dumbbells", uses: "Presses, rows, curls, raises" },
  { name: "Treadmill", uses: "Walking / running" },
  { name: "StairMaster", uses: "Stair climbing / conditioning" },
];
