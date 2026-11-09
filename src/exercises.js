// What the app knows about each exercise: which muscles it trains, whether it is a
// main lift or an accessory, its rep range, and how long to rest between sets.

export const MUSCLES = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings", "Glutes", "Calves", "Core"];

const HEAVY_REST = "2 to 3 minutes";
const MEDIUM_REST = "90 seconds to 2 minutes";
const ACCESSORY_REST = "60 to 90 seconds";

const TEMPO = {
  compound: "Lower for about 2 seconds, then drive up hard but under control.",
  accessory: "Lower slowly for 2 to 3 seconds and squeeze at the top.",
};

const HEAVY_REPS = [6, 10];
const STANDARD_REPS = [8, 12];
const ACCESSORY_REPS = [10, 15];

const heavy = (muscles) => ({ muscles, kind: "compound", reps: HEAVY_REPS, rest: HEAVY_REST });
const standard = (muscles, rest = MEDIUM_REST) => ({ muscles, kind: "compound", reps: STANDARD_REPS, rest });
const accessory = (muscles) => ({ muscles, kind: "accessory", reps: ACCESSORY_REPS, rest: ACCESSORY_REST });

const EXERCISES = {
  "Bench press": heavy(["Chest", "Triceps"]),
  "Back squat": heavy(["Quads", "Glutes"]),
  "Deadlift": heavy(["Hamstrings", "Glutes", "Back"]),
  "Overhead press": heavy(["Shoulders", "Triceps"]),
  "Barbell row": heavy(["Back", "Biceps"]),
  "Leg press": standard(["Quads", "Glutes"], HEAVY_REST),
  "Lat pulldown": standard(["Back", "Biceps"]),
  "Romanian deadlift": standard(["Hamstrings", "Glutes"], HEAVY_REST),
  "Hip thrust": standard(["Glutes"]),
  "Incline dumbbell press": standard(["Chest", "Shoulders"]),
  "Dumbbell bench press": standard(["Chest", "Triceps"]),
  "Goblet squat": standard(["Quads", "Glutes"]),
  "Dumbbell Romanian deadlift": standard(["Hamstrings", "Glutes"]),
  "Dumbbell shoulder press": standard(["Shoulders", "Triceps"]),
  "Dumbbell row": standard(["Back", "Biceps"]),
  "Dumbbell lunge": standard(["Quads", "Glutes"]),
  "Dumbbell pullover": accessory(["Back"]),
  "Dumbbell curl": accessory(["Biceps"]),
  "Lateral raise": accessory(["Shoulders"]),
  "Rear delt fly": accessory(["Shoulders"]),
  "Overhead triceps extension": accessory(["Triceps"]),
  "Calf raise": accessory(["Calves"]),
  "Weighted crunch": accessory(["Core"]),
  "Push-up": standard(["Chest", "Triceps"]),
  "Machine chest press": standard(["Chest", "Triceps"]),
  "Cable fly": accessory(["Chest"]),
  "Incline barbell press": heavy(["Chest", "Shoulders"]),
  "Front squat": heavy(["Quads", "Glutes"]),
  "Hack squat": standard(["Quads", "Glutes"], HEAVY_REST),
  "Bulgarian split squat": standard(["Quads", "Glutes"]),
  "Leg extension": accessory(["Quads"]),
  "Trap bar deadlift": heavy(["Hamstrings", "Glutes", "Back"]),
  "Sumo deadlift": heavy(["Hamstrings", "Glutes", "Back"]),
  "Leg curl": accessory(["Hamstrings"]),
  "Glute bridge": standard(["Glutes"]),
  "Arnold press": standard(["Shoulders", "Triceps"]),
  "Cable lateral raise": accessory(["Shoulders"]),
  "Face pull": accessory(["Shoulders", "Back"]),
  "Cable row": standard(["Back", "Biceps"]),
  "Chest-supported row": standard(["Back", "Biceps"]),
  "Pull-up": standard(["Back", "Biceps"]),
  "Barbell curl": accessory(["Biceps"]),
  "Hammer curl": accessory(["Biceps"]),
  "Triceps pushdown": accessory(["Triceps"]),
  "Skull crusher": accessory(["Triceps"]),
  "Seated calf raise": accessory(["Calves"]),
  "Cable crunch": accessory(["Core"]),
  "Hanging leg raise": accessory(["Core"]),
  "Smith machine bench press": standard(["Chest", "Triceps"], HEAVY_REST),
  "Smith machine incline press": standard(["Chest", "Shoulders"]),
  "Smith machine squat": heavy(["Quads", "Glutes"]),
  "Smith machine split squat": standard(["Quads", "Glutes"]),
  "Smith machine shoulder press": standard(["Shoulders", "Triceps"]),
  "Smith machine row": standard(["Back", "Biceps"]),
  "Smith machine Romanian deadlift": standard(["Hamstrings", "Glutes"], HEAVY_REST),
  "Smith machine hip thrust": standard(["Glutes"]),
  "Smith machine calf raise": accessory(["Calves"]),
};

// Swap-ins for the "Alternate exercise" button: same muscles, different equipment or angle.
const ALTERNATES = {
  "Bench press": ["Smith machine bench press", "Dumbbell bench press", "Machine chest press", "Push-up", "Cable fly"],
  "Incline dumbbell press": ["Smith machine incline press", "Incline barbell press", "Dumbbell bench press", "Machine chest press"],
  "Back squat": ["Smith machine squat", "Front squat", "Goblet squat", "Hack squat", "Bulgarian split squat"],
  "Leg press": ["Smith machine split squat", "Hack squat", "Dumbbell lunge", "Leg extension"],
  "Deadlift": ["Trap bar deadlift", "Sumo deadlift", "Romanian deadlift"],
  "Romanian deadlift": ["Smith machine Romanian deadlift", "Dumbbell Romanian deadlift", "Leg curl", "Glute bridge"],
  "Hip thrust": ["Smith machine hip thrust", "Glute bridge", "Dumbbell Romanian deadlift"],
  "Overhead press": ["Smith machine shoulder press", "Dumbbell shoulder press", "Arnold press"],
  "Lateral raise": ["Cable lateral raise", "Face pull"],
  "Rear delt fly": ["Face pull", "Cable lateral raise"],
  "Barbell row": ["Smith machine row", "Dumbbell row", "Cable row", "Chest-supported row"],
  "Lat pulldown": ["Pull-up", "Cable row", "Dumbbell pullover"],
  "Dumbbell curl": ["Barbell curl", "Hammer curl"],
  "Overhead triceps extension": ["Triceps pushdown", "Skull crusher"],
  "Calf raise": ["Smith machine calf raise", "Seated calf raise"],
  "Weighted crunch": ["Cable crunch", "Hanging leg raise"],
  "Incline barbell press": ["Incline dumbbell press", "Smith machine incline press", "Machine chest press"],
  "Machine chest press": ["Dumbbell bench press", "Smith machine bench press", "Push-up", "Cable fly"],
  "Cable fly": ["Machine chest press", "Push-up", "Dumbbell bench press"],
  "Cable lateral raise": ["Lateral raise", "Face pull"],
  "Triceps pushdown": ["Overhead triceps extension", "Skull crusher"],
  "Skull crusher": ["Triceps pushdown", "Overhead triceps extension"],
  "Seated calf raise": ["Calf raise", "Smith machine calf raise"],
  "Cable row": ["Barbell row", "Dumbbell row", "Chest-supported row", "Smith machine row"],
  "Face pull": ["Rear delt fly", "Cable lateral raise"],
  "Hammer curl": ["Dumbbell curl", "Barbell curl"],
  "Barbell curl": ["Dumbbell curl", "Hammer curl"],
  "Cable crunch": ["Weighted crunch", "Hanging leg raise"],
  "Bulgarian split squat": ["Dumbbell lunge", "Smith machine split squat", "Goblet squat"],
  "Leg curl": ["Romanian deadlift", "Dumbbell Romanian deadlift", "Glute bridge"],
  "Leg extension": ["Bulgarian split squat", "Dumbbell lunge", "Hack squat"],
  "Goblet squat": ["Dumbbell lunge", "Bulgarian split squat", "Front squat", "Smith machine squat"],
  "Dumbbell bench press": ["Push-up", "Machine chest press", "Smith machine bench press", "Bench press"],
  "Dumbbell row": ["Cable row", "Chest-supported row", "Smith machine row", "Barbell row"],
  "Dumbbell Romanian deadlift": ["Romanian deadlift", "Smith machine Romanian deadlift", "Leg curl", "Glute bridge"],
  "Dumbbell shoulder press": ["Arnold press", "Smith machine shoulder press", "Overhead press"],
  "Dumbbell pullover": ["Lat pulldown", "Pull-up", "Cable row"],
  "Dumbbell lunge": ["Bulgarian split squat", "Goblet squat", "Smith machine split squat"],
};

const LOOKUP = new Map(Object.entries(EXERCISES).map(([name, info]) => [name.toLowerCase(), info]));

const DEFAULT_INFO = { muscles: [], kind: "compound", reps: STANDARD_REPS, rest: MEDIUM_REST };

// Exercises the student typed in themselves get sensible defaults.
function infoFor(exercise) {
  return LOOKUP.get(exercise.trim().toLowerCase()) ?? DEFAULT_INFO;
}

export function musclesFor(exercise) {
  return infoFor(exercise).muscles;
}

export function isAccessory(exercise) {
  return infoFor(exercise).kind === "accessory";
}

// Returns [lowest, highest] reps for double progression.
export function repRangeFor(exercise) {
  return infoFor(exercise).reps;
}

export function restFor(exercise) {
  return infoFor(exercise).rest;
}

export function tempoFor(exercise) {
  return TEMPO[infoFor(exercise).kind];
}

// Exercises that can stand in for this one today, in a sensible order. Empty for custom exercises.
export function alternatesFor(exercise) {
  const key = Object.keys(ALTERNATES).find((name) => name.toLowerCase() === exercise.trim().toLowerCase());
  return key === undefined ? [] : ALTERNATES[key];
}

// What a workout row shows for an exercise. todayChoice is a swap for this workout only (or undefined),
// savedChoice is a permanent switch (or undefined). Returns { shown, saved, note, canSave } where
// canSave is true when the exercise being shown differs from the permanent one.
export function swapState(original, todayChoice, savedChoice) {
  const saved = savedChoice ?? original;
  const shown = todayChoice ?? saved;
  let note = null;
  if (shown !== saved) {
    note = shown === original ? `Using ${original} for today only.` : `Swapped from ${original} for today.`;
  } else if (shown !== original) {
    note = `Switched from ${original} for good.`;
  }
  return { shown, saved, note, canSave: shown !== saved };
}
