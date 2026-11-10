// Turns the setup-quiz answers into a weekly program and starting weights.
import { isAccessory, MUSCLES, musclesFor } from "./exercises.js";

export const EXPERIENCE_LEVELS = [
  { key: "beginner", label: "Under 6 months", detail: "New, or getting back into it" },
  { key: "intermediate", label: "6 months to 2 years", detail: "You train fairly regularly" },
  { key: "advanced", label: "2+ years", detail: "Consistent, serious training" },
];

export const SESSION_LENGTHS = [
  { key: 30, label: "30 minutes", detail: "Up to 3 exercises a day" },
  { key: 45, label: "45 minutes", detail: "Up to 4 exercises a day" },
  { key: 60, label: "60 minutes or more", detail: "The full workout" },
];

export const GOALS = [
  { key: "strength", label: "Get stronger", detail: "4 sets on the main lifts, 3 on the rest" },
  { key: "muscle", label: "Build muscle", detail: "3 sets per exercise" },
  { key: "both", label: "A bit of both", detail: "Balanced, 3 sets per exercise" },
];

export const EQUIPMENT = [
  { key: "gym", label: "Full gym", detail: "Barbells, machines and dumbbells" },
  { key: "dumbbells", label: "Dumbbells and a bench", detail: "Home setup. Weights are per hand." },
];

export const INJURY_AREAS = [
  { key: "shoulders", label: "Shoulders" },
  { key: "knees", label: "Knees" },
  { key: "lowerBack", label: "Lower back" },
];

export const MIN_DAYS = 2;
export const MAX_DAYS = 6;

// The lifts the quiz asks about, per equipment. Other exercises are estimated from these.
export const QUIZ_LIFTS = {
  gym: ["Bench press", "Back squat", "Deadlift", "Overhead press", "Barbell row", "Leg press", "Lat pulldown", "Dumbbell curl"],
  dumbbells: [
    "Dumbbell bench press",
    "Goblet squat",
    "Dumbbell Romanian deadlift",
    "Dumbbell shoulder press",
    "Dumbbell row",
    "Dumbbell lunge",
    "Dumbbell curl",
  ],
};

// Main lifts come first and accessories last, so a shorter session drops accessories first.
const FULL_BODY_DAYS = [
  { name: "Full body A", exercises: ["Back squat", "Bench press", "Barbell row", "Dumbbell curl", "Weighted crunch"] },
  { name: "Full body B", exercises: ["Deadlift", "Overhead press", "Lat pulldown", "Overhead triceps extension", "Calf raise"] },
  { name: "Full body C", exercises: ["Leg press", "Incline dumbbell press", "Barbell row", "Rear delt fly", "Dumbbell curl"] },
];

const UPPER_LOWER_DAYS = [
  { name: "Upper A", exercises: ["Bench press", "Barbell row", "Overhead press", "Dumbbell curl", "Overhead triceps extension", "Rear delt fly"] },
  { name: "Lower A", exercises: ["Back squat", "Romanian deadlift", "Leg press", "Calf raise", "Weighted crunch"] },
  { name: "Upper B", exercises: ["Overhead press", "Lat pulldown", "Incline dumbbell press", "Dumbbell curl", "Overhead triceps extension", "Lateral raise"] },
  { name: "Lower B", exercises: ["Deadlift", "Hip thrust", "Leg press", "Calf raise", "Weighted crunch"] },
];

// The B days use different lifts from the A days, so a 5 or 6 day week is not the same three workouts twice.
const PUSH_PULL_LEGS_DAYS = [
  { name: "Push A", exercises: ["Bench press", "Overhead press", "Incline dumbbell press", "Lateral raise", "Overhead triceps extension"] },
  { name: "Pull A", exercises: ["Barbell row", "Lat pulldown", "Rear delt fly", "Dumbbell curl", "Weighted crunch"] },
  { name: "Legs A", exercises: ["Back squat", "Deadlift", "Leg press", "Calf raise", "Weighted crunch"] },
  { name: "Push B", exercises: ["Incline barbell press", "Machine chest press", "Cable fly", "Triceps pushdown", "Seated calf raise"] },
  { name: "Pull B", exercises: ["Cable row", "Lat pulldown", "Face pull", "Hammer curl", "Cable crunch"] },
  { name: "Legs B", exercises: ["Romanian deadlift", "Bulgarian split squat", "Hip thrust", "Leg curl", "Leg extension", "Seated calf raise"] },
];

// The templates above use full-gym names. These swap in what a home setup has.
const EQUIPMENT_SWAPS = {
  gym: {},
  dumbbells: {
    "Bench press": "Dumbbell bench press",
    "Back squat": "Goblet squat",
    "Deadlift": "Dumbbell Romanian deadlift",
    "Romanian deadlift": "Dumbbell Romanian deadlift",
    "Overhead press": "Dumbbell shoulder press",
    "Barbell row": "Dumbbell row",
    "Lat pulldown": "Dumbbell pullover",
    "Leg press": "Dumbbell lunge",
    "Incline barbell press": "Incline dumbbell press",
    "Machine chest press": "Dumbbell bench press",
    "Cable fly": "Dumbbell bench press",
    "Leg extension": "Dumbbell lunge",
    "Triceps pushdown": "Overhead triceps extension",
    "Seated calf raise": "Calf raise",
    "Cable row": "Dumbbell row",
    "Face pull": "Dumbbell pullover",
    "Cable crunch": "Weighted crunch",
    "Bulgarian split squat": "Dumbbell lunge",
    "Leg curl": "Hip thrust",
  },
};

// Applied after the equipment swaps: replaces exercises that load a sore area, or drops them (null).
const INJURY_SWAPS = {
  shoulders: {
    "Overhead press": "Lateral raise",
    "Dumbbell shoulder press": "Lateral raise",
    "Incline dumbbell press": null,
    "Overhead triceps extension": null,
  },
  knees: {
    "Back squat": "Hip thrust",
    "Leg press": "Hip thrust",
    "Goblet squat": "Hip thrust",
    "Dumbbell lunge": "Hip thrust",
  },
  lowerBack: {
    "Deadlift": "Hip thrust",
    "Romanian deadlift": "Hip thrust",
    "Dumbbell Romanian deadlift": "Hip thrust",
    "Barbell row": "Lat pulldown",
    "Weighted crunch": null,
  },
};

const MAX_EXERCISES_BY_MINUTES = { 30: 3, 45: 4 };

// Starting weights for exercises the quiz does not ask about, as a fraction of a lift it does.
const ESTIMATES = {
  gym: [
    { exercise: "Romanian deadlift", basedOn: "Deadlift", ratio: 0.7 },
    { exercise: "Hip thrust", basedOn: "Back squat", ratio: 0.9 },
    { exercise: "Lateral raise", basedOn: "Overhead press", ratio: 0.15 },
    { exercise: "Incline dumbbell press", basedOn: "Bench press", ratio: 0.35 },
    { exercise: "Overhead triceps extension", basedOn: "Bench press", ratio: 0.3 },
    { exercise: "Rear delt fly", basedOn: "Bench press", ratio: 0.1 },
    { exercise: "Calf raise", basedOn: "Back squat", ratio: 0.25 },
    { exercise: "Weighted crunch", basedOn: "Bench press", ratio: 0.15 },
    { exercise: "Incline barbell press", basedOn: "Bench press", ratio: 0.8 },
    { exercise: "Machine chest press", basedOn: "Bench press", ratio: 0.8 },
    { exercise: "Cable fly", basedOn: "Bench press", ratio: 0.2 },
    { exercise: "Leg extension", basedOn: "Back squat", ratio: 0.3 },
    { exercise: "Triceps pushdown", basedOn: "Bench press", ratio: 0.35 },
    { exercise: "Seated calf raise", basedOn: "Back squat", ratio: 0.2 },
    { exercise: "Cable row", basedOn: "Barbell row", ratio: 0.8 },
    { exercise: "Face pull", basedOn: "Bench press", ratio: 0.15 },
    { exercise: "Hammer curl", basedOn: "Dumbbell curl", ratio: 1 },
    { exercise: "Cable crunch", basedOn: "Bench press", ratio: 0.25 },
    { exercise: "Bulgarian split squat", basedOn: "Back squat", ratio: 0.3 },
    { exercise: "Leg curl", basedOn: "Back squat", ratio: 0.3 },
  ],
  dumbbells: [
    { exercise: "Dumbbell pullover", basedOn: "Dumbbell row", ratio: 0.7 },
    { exercise: "Hip thrust", basedOn: "Goblet squat", ratio: 1 },
    { exercise: "Lateral raise", basedOn: "Dumbbell shoulder press", ratio: 0.15 },
    { exercise: "Incline dumbbell press", basedOn: "Dumbbell bench press", ratio: 0.9 },
    { exercise: "Overhead triceps extension", basedOn: "Dumbbell bench press", ratio: 0.8 },
    { exercise: "Rear delt fly", basedOn: "Dumbbell bench press", ratio: 0.3 },
    { exercise: "Calf raise", basedOn: "Goblet squat", ratio: 1 },
    { exercise: "Weighted crunch", basedOn: "Dumbbell bench press", ratio: 0.4 },
    { exercise: "Hammer curl", basedOn: "Dumbbell curl", ratio: 1 },
  ],
};

// A rough 8-rep weight as a fraction of bodyweight for a beginner, used for lifts left blank.
const BODYWEIGHT_RATIOS = {
  "Bench press": 0.5,
  "Back squat": 0.6,
  "Deadlift": 0.8,
  "Overhead press": 0.35,
  "Barbell row": 0.45,
  "Leg press": 1.2,
  "Lat pulldown": 0.5,
  "Dumbbell curl": 0.1,
  "Dumbbell bench press": 0.2,
  "Goblet squat": 0.3,
  "Dumbbell Romanian deadlift": 0.25,
  "Dumbbell shoulder press": 0.13,
  "Dumbbell row": 0.2,
  "Dumbbell lunge": 0.15,
};

const EXPERIENCE_MULTIPLIERS = { beginner: 1, intermediate: 1.3, advanced: 1.6 };

const DEFAULT_PROFILE = {
  experience: "beginner",
  daysPerWeek: 3,
  sessionMinutes: 60,
  goal: "both",
  equipment: "gym",
  injuries: [],
  bodyweight: null,
  weights: {},
};

// Fills in anything an older saved profile (or a partial one) is missing.
export function withDefaults(profile) {
  const weights = {};
  for (const [lift, entry] of Object.entries(profile.weights ?? {})) {
    weights[lift] = typeof entry === "number" ? { weight: entry, reps: 8 } : entry;
  }
  return { ...DEFAULT_PROFILE, ...profile, weights };
}

function roundToFive(weight) {
  return Math.max(5, Math.round(weight / 5) * 5);
}

// Epley estimate: the weight you could lift for 8 reps, given a weight and the reps you got with it.
export function eightRepWeight(weight, reps) {
  return roundToFive((weight * (1 + reps / 30)) / (1 + 8 / 30));
}

function daysForSplit(daysPerWeek) {
  if (daysPerWeek <= 3) {
    return FULL_BODY_DAYS.slice(0, daysPerWeek);
  }
  if (daysPerWeek === 4) {
    return UPPER_LOWER_DAYS;
  }
  if (daysPerWeek === 5) {
    // Skips Pull B so the week still has two leg days.
    return PUSH_PULL_LEGS_DAYS.filter((day) => day.name !== "Pull B");
  }
  return PUSH_PULL_LEGS_DAYS;
}

function exercisesForDay(templateNames, { equipment, injuries, sessionMinutes }) {
  const swapped = templateNames.map((name) => {
    let result = EQUIPMENT_SWAPS[equipment][name] ?? name;
    for (const area of injuries) {
      if (result !== null && INJURY_SWAPS[area][result] !== undefined) {
        result = INJURY_SWAPS[area][result];
      }
    }
    return result;
  });
  const unique = [...new Set(swapped.filter((name) => name !== null))];
  return unique.slice(0, MAX_EXERCISES_BY_MINUTES[sessionMinutes] ?? unique.length);
}

// Returns [{ name, exercises: [{ name, sets }] }], one entry per training day in the week.
export function buildProgram(answers) {
  const profile = withDefaults(answers);
  const mainLiftSets = profile.goal === "strength" ? 4 : 3;
  return daysForSplit(profile.daysPerWeek).map((day) => ({
    name: day.name,
    exercises: exercisesForDay(day.exercises, profile).map((name) => ({ name, sets: isAccessory(name) ? 3 : mainLiftSets })),
  }));
}

// Returns { "Bench press": { weight: 135, basedOn: null }, "Hip thrust": { weight: 155, basedOn: "Back squat" } }.
// basedOn says where an estimate came from: a lift, or "bodyweight".
export function startingWeights(answers) {
  const profile = withDefaults(answers);
  const result = {};
  for (const [lift, { weight, reps }] of Object.entries(profile.weights)) {
    result[lift] = { weight: eightRepWeight(weight, reps), basedOn: null };
  }
  if (profile.bodyweight !== null) {
    const multiplier = EXPERIENCE_MULTIPLIERS[profile.experience];
    for (const lift of QUIZ_LIFTS[profile.equipment]) {
      if (result[lift] === undefined) {
        result[lift] = { weight: roundToFive(profile.bodyweight * BODYWEIGHT_RATIOS[lift] * multiplier), basedOn: "bodyweight" };
      }
    }
  }
  for (const { exercise, basedOn, ratio } of ESTIMATES[profile.equipment]) {
    if (result[exercise] === undefined && result[basedOn] !== undefined) {
      result[exercise] = { weight: roundToFive(result[basedOn].weight * ratio), basedOn };
    }
  }
  return result;
}

// The day to show first today. A skip made today names the day it moved to ({ date, from, next }),
// so skipping always lands on the day after the one you skipped; otherwise it is the rotation's day.
export function startDayIndex(skips, today, rotationIndex) {
  const skipsToday = skips.filter((skip) => skip.date === today && Number.isInteger(skip.next));
  return skipsToday.length === 0 ? rotationIndex : skipsToday[skipsToday.length - 1].next;
}

// Counts weekly sets for each muscle an exercise mainly trains. Returns { Chest: 10, ... } for muscles with sets.
export function weeklyMuscleSets(program) {
  const totals = {};
  for (const day of program) {
    for (const { name, sets } of day.exercises) {
      for (const muscle of musclesFor(name)) {
        totals[muscle] = (totals[muscle] ?? 0) + sets;
      }
    }
  }
  return Object.fromEntries(MUSCLES.filter((muscle) => totals[muscle] !== undefined).map((muscle) => [muscle, totals[muscle]]));
}
