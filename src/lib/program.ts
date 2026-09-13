import type { Program, ProgramDay, ProgramExercise, Category } from "./types";

// Exercise ids are sequential in declaration order (ex1…ex28) and must stay stable:
// logged sessions reference them. Add new exercises with an explicit id instead of
// inserting into this list.
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

// Day 1
const benchPress = ex("Barbell Bench Press", "Chest", 3, [6, 10], 30, { compound: true, notes: "2–3 min rest" });
const inclineDb = ex("Incline Dumbbell Press", "Chest", 3, [8, 12], 15, { perSide: true, compound: true });
const cableFly = ex("Cable Chest Fly", "Chest", 3, [10, 15], 20, { perSide: true });
const multiPress = ex("Multi-Press Shoulder Press", "Shoulders", 3, [8, 12], 36.3, { compound: true });
const dbLateral = ex("Dumbbell Lateral Raise", "Shoulders", 3, [10, 15], 7.5, { perSide: true, increment: 1.25 });
const pushdown = ex("Cable Triceps Pushdown", "Triceps", 3, [10, 15], 30);
const overhead = ex("Overhead Cable Triceps Extension", "Triceps", 2, [10, 15], 15);
// Day 2
const latPulldown = ex("Lat Pulldown", "Back", 3, [8, 12], 45, { compound: true, notes: "2–3 min rest" });
const lowRow = ex("Low Cable Row", "Back", 3, [8, 12], 0, { compound: true, notes: "Set a starting weight" });
const singleArmRow = ex("Single-Arm Cable Row", "Back", 3, [10, 12], 20, { perSide: true });
const facePull = ex("Cable Face Pull", "Back", 3, [12, 15], 0, { notes: "Set a starting weight" });
const dbCurl = ex("Dumbbell Curl", "Biceps", 3, [8, 12], 0, { perSide: true, increment: 1.25, notes: "Set a starting weight" });
const cableCurl = ex("Cable Curl", "Biceps", 3, [10, 15], 0, { notes: "Set a starting weight" });
const pullUps = ex("Pull-ups", "Back", 2, [5, 10], 0, { kind: "bodyweight", optional: true, compound: true, notes: "Only if comfortable" });
// Day 3
const legPress = ex("Leg Press", "Quads", 3, [8, 12], 100, { compound: true, increment: 10, notes: "Felt easy at 100 — push it" });
const smithSquat = ex("Smith Machine Squat", "Quads", 3, [8, 12], 40, { compound: true, increment: 5 });
const legExt = ex("Leg Extension", "Quads", 3, [10, 15], 0, { increment: 5, notes: "Set a starting weight" });
const legCurl = ex("Leg Curl", "Hamstrings", 3, [10, 15], 0, { increment: 5, notes: "Set a starting weight" });
const calfRaise = ex("Calf Raise", "Calves", 3, [12, 20], 0, { increment: 5, notes: "Standing or on the leg press" });
// Day 4
const dbBench = ex("Dumbbell Bench Press", "Chest", 3, [8, 12], 15, { perSide: true, compound: true });
const latPulldown2 = ex("Lat Pulldown", "Back", 3, [8, 12], 45, { compound: true });
const cableRow = ex("Cable Row", "Back", 3, [8, 12], 0, { compound: true, notes: "Set a starting weight" });
const dbShoulder = ex("Dumbbell Shoulder Press", "Shoulders", 3, [8, 12], 0, { perSide: true, compound: true, notes: "Set a starting weight" });
const cableLateral = ex("Cable Lateral Raise", "Shoulders", 2, [12, 15], 0, { increment: 1.25, notes: "Set a starting weight" });
const pushdown2 = ex("Cable Triceps Pushdown", "Triceps", 2, [10, 15], 30);
const anyCurl = ex("Dumbbell or Cable Curl", "Biceps", 2, [10, 15], 0, { increment: 1.25, notes: "Set a starting weight" });
const facePull2 = ex("Cable Face Pull", "Back", 2, [12, 15], 0, { optional: true, notes: "Set a starting weight" });
// Core (originally on Day 4, now its own section)
const cableCrunch = ex("Cable Crunch", "Core", 3, [12, 15], 0, { increment: 5, notes: "Set a starting weight" });
const legRaise = ex("Hanging Leg Raise", "Core", 3, [10, 15], 0, { kind: "bodyweight", notes: "Or lying leg raises" });
const plank = ex("Plank", "Core", 2, [30, 60], 0, { kind: "time" });

// Added later, with fixed ids.
export const CHEST_SUPPORTED_ROW: ProgramExercise = ex("Chest-Supported Row", "Back", 3, [8, 12], 0, {
  id: "csrow",
  compound: true,
  increment: 5,
  notes: "Set a starting weight · chest on the pad, no lower-back load",
});
export const BACK_EXTENSION: ProgramExercise = ex("Back Extension", "Lower Back", 3, [10, 15], 0, {
  id: "backext",
  kind: "bodyweight",
  increment: 2.5,
  notes: "Hold a plate to your chest once 15 is easy",
});

export const CORE_DAY: ProgramDay = {
  id: "core",
  name: "Core",
  addon: true,
  warmup: [],
  cardioNote: "Two or three times a week. Tack it onto the end of any session or do it on a rest day.",
  exercises: [cableCrunch, legRaise, plank, BACK_EXTENSION],
};

export const DEFAULT_PROGRAM: Program = {
  days: [
    {
      id: "push",
      name: "Chest, Shoulders & Triceps",
      warmup: ["5–10 min easy treadmill walk", "1–2 light sets of bench press"],
      exercises: [benchPress, inclineDb, cableFly, multiPress, dbLateral, pushdown, overhead],
    },
    {
      id: "pull",
      name: "Back & Biceps",
      warmup: ["5–10 min easy treadmill", "Light lat pulldowns"],
      exercises: [latPulldown, CHEST_SUPPORTED_ROW, singleArmRow, facePull, dbCurl, cableCurl, pullUps],
    },
    {
      id: "legs",
      name: "Legs",
      warmup: ["5–10 min treadmill or easy StairMaster", "Several light reps on the leg press"],
      cardioNote: "Optional: 5–10 min StairMaster at a comfortable pace after lifting.",
      exercises: [legPress, smithSquat, legExt, legCurl, calfRaise],
    },
    {
      id: "upper",
      name: "Full Upper Body",
      warmup: ["5–10 min easy cardio", "Light pressing warm-up"],
      exercises: [dbBench, latPulldown2, cableRow, dbShoulder, cableLateral, pushdown2, anyCurl, facePull2],
    },
    CORE_DAY,
  ],
  schedule: { 0: null, 1: "push", 2: "pull", 3: null, 4: "legs", 5: "upper", 6: null },
};

/** Kept for migrations: the original low cable row slot on Day 2. */
export const LOW_CABLE_ROW = lowRow;

export const EQUIPMENT: { name: string; uses: string }[] = [
  { name: "Dual adjustable pulley / functional trainer", uses: "Rows, flyes, face pulls, curls, triceps, lateral raises" },
  { name: "Lat pulldown", uses: "Lats and upper back" },
  { name: "Low pulley", uses: "Seated rows and cable work" },
  { name: "Chest-supported row machine", uses: "Heavy rows with the lower back taken out of it" },
  { name: "Back extension bench", uses: "Lower back, glutes, hamstrings" },
  { name: "Smith / multi-press", uses: "Squats, presses" },
  { name: "Leg extension", uses: "Quadriceps" },
  { name: "Leg curl", uses: "Hamstrings" },
  { name: "Leg press", uses: "Quads, glutes, hamstrings" },
  { name: "Barbells", uses: "Bench press, squats, compound lifts" },
  { name: "Dumbbells", uses: "Presses, rows, curls, raises" },
  { name: "Treadmill", uses: "Walking / running" },
  { name: "StairMaster", uses: "Stair climbing / conditioning" },
];

/**
 * Bring an older stored program up to date without touching the user's weights:
 * - Core exercises move out of the day they were on and into their own add-on section.
 * - The chest-supported row takes the Low Cable Row slot on Day 2 if that slot was never given a weight.
 */
export function migrateProgram(p: Program): Program {
  let days = p.days.map((d) => ({ ...d, exercises: [...d.exercises] }));

  if (!days.some((d) => d.id === "core")) {
    const pulled: ProgramExercise[] = [];
    days = days.map((d) => {
      const keep = d.exercises.filter((e) => {
        const core = e.category === "Core";
        if (core) pulled.push(e);
        return !core;
      });
      return { ...d, exercises: keep };
    });
    const extra = CORE_DAY.exercises.filter((e) => !pulled.some((x) => x.id === e.id || x.name === e.name));
    days.push({ ...CORE_DAY, exercises: [...pulled, ...extra] });
  } else {
    const core = days.find((d) => d.id === "core")!;
    if (!core.exercises.some((e) => e.id === BACK_EXTENSION.id || e.name === BACK_EXTENSION.name)) core.exercises.push(BACK_EXTENSION);
  }

  const pull = days.find((d) => d.id === "pull");
  if (pull && !pull.exercises.some((e) => e.id === CHEST_SUPPORTED_ROW.id || /chest.supported/i.test(e.name))) {
    const slot = pull.exercises.findIndex((e) => e.id === LOW_CABLE_ROW.id && !e.weight);
    if (slot >= 0) pull.exercises.splice(slot, 1, CHEST_SUPPORTED_ROW);
    else pull.exercises.splice(Math.min(1, pull.exercises.length), 0, CHEST_SUPPORTED_ROW);
  }

  return { ...p, days };
}
