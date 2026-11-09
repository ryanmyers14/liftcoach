// Max days: once a month, each core lift gets a chance to test a true one-rep max,
// so you can measure real progress instead of only chasing reps.

export const MAX_LIFTS = ["Bench press", "Back squat", "Deadlift"];

const DAYS_BETWEEN_MAXES = 28;

// Work up to a max in rising jumps: [fraction of your reference weight, reps].
const MAX_RAMP = [
  [0.5, 5],
  [0.7, 3],
  [0.85, 2],
  [0.92, 1],
];

export function isMaxLift(exercise) {
  return MAX_LIFTS.some((lift) => lift.toLowerCase() === exercise.toLowerCase());
}

function daysBetween(earlierDate, laterDate) {
  // "YYYY-MM-DD" parses as UTC midnight, so the difference is a whole number of days.
  return (Date.parse(laterDate) - Date.parse(earlierDate)) / 86400000;
}

function roundToFive(weight) {
  return Math.max(5, Math.round(weight / 5) * 5);
}

// maxes: every saved max as { exercise, weight, date }. Returns the most recent one for the lift, or null.
export function latestMax(exercise, maxes) {
  const own = maxes.filter((max) => max.exercise.toLowerCase() === exercise.toLowerCase());
  if (own.length === 0) {
    return null;
  }
  return own.reduce((latest, max) => (max.date >= latest.date ? max : latest));
}

// A lift is due when it has never been maxed, or its last max was at least four weeks ago.
export function maxIsDue(exercise, maxes, today) {
  if (!isMaxLift(exercise)) {
    return false;
  }
  const last = latestMax(exercise, maxes);
  return last === null || daysBetween(last.date, today) >= DAYS_BETWEEN_MAXES;
}

// Your best set so far turned into an estimated one-rep max (Epley formula), or null with no sets.
// sets: every saved set as { exercise, weight, reps }.
export function estimatedMax(exercise, sets) {
  const estimates = sets
    .filter((set) => set.exercise.toLowerCase() === exercise.toLowerCase())
    .map((set) => set.weight * (1 + set.reps / 30));
  return estimates.length === 0 ? null : roundToFive(Math.max(...estimates));
}

// Build-up sets before a max attempt, or [] when there is no weight to build from.
export function maxRampSets(referenceWeight) {
  if (!Number.isFinite(referenceWeight) || referenceWeight <= 0) {
    return [];
  }
  return MAX_RAMP.map(([fraction, reps]) => ({ weight: roundToFive(referenceWeight * fraction), reps }));
}

// Replaces any max already saved for the lift today (so a typo can be fixed) and adds the new one.
export function withNewMax(maxes, exercise, weight, today) {
  const others = maxes.filter((max) => !(max.exercise.toLowerCase() === exercise.toLowerCase() && max.date === today));
  return [...others, { exercise, weight, date: today }];
}
