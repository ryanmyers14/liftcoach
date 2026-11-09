// Progressive overload coach: double progression.
// Each exercise has a rep range (heavy lifts 6-10, most lifts 8-12, accessories 10-15).
// Once every set at your top weight reaches the top of the range, add weight and start
// again at the bottom. Until then, keep the weight and chase one more rep.
import { repRangeFor } from "./exercises.js";

const LOWER_BODY_LIFT = /squat|deadlift|leg|lunge|rdl|hip thrust|calf/i;

export function isLowerBodyLift(exercise) {
  return LOWER_BODY_LIFT.test(exercise);
}

// Experienced lifters progress more slowly, so they add half as much.
export function incrementFor(exercise, experience) {
  const increment = isLowerBodyLift(exercise) ? 10 : 5;
  return experience === "advanced" ? increment / 2 : increment;
}

// sets: the sets from one session of one exercise, as { weight, reps }.
// Returns { weight, reps, reason } or null when there are no sets to learn from.
export function suggestNext(exercise, sets, experience) {
  if (sets.length === 0) {
    return null;
  }

  const [minReps, maxReps] = repRangeFor(exercise);
  const topWeight = Math.max(...sets.map((set) => set.weight));
  const topSets = sets.filter((set) => set.weight === topWeight);
  const fewestReps = Math.min(...topSets.map((set) => set.reps));

  if (fewestReps >= maxReps) {
    const increment = incrementFor(exercise, experience);
    return {
      weight: topWeight + increment,
      reps: minReps,
      reason: `Every set at ${topWeight} lb hit ${maxReps} reps, so add ${increment} lb and aim for ${minReps}.`,
    };
  }

  return {
    weight: topWeight,
    reps: Math.max(fewestReps + 1, minReps),
    reason: `Your weakest set at ${topWeight} lb was ${fewestReps} reps. Keep the weight and aim for one more rep on every set until you reach ${maxReps}.`,
  };
}

// The most recent session for an exercise before today, as { date, sets }, or null if there is none.
// sets: every saved set as { exercise, weight, reps, date }; dates are "YYYY-MM-DD".
export function lastSession(sets, exercise, today) {
  const wanted = exercise.trim().toLowerCase();
  const earlier = sets.filter((set) => set.exercise.toLowerCase() === wanted && set.date < today);
  if (earlier.length === 0) {
    return null;
  }
  const date = earlier.reduce((latest, set) => (set.date > latest ? set.date : latest), "");
  return { date, sets: earlier.filter((set) => set.date === date) };
}

// For example "Last time (Oct 12): 185 × 8, 185 × 7".
export function lastTimeText(session) {
  const [year, month, day] = session.date.split("-").map(Number);
  const shortDate = new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const summary = session.sets.map((set) => `${set.weight} × ${set.reps}`).join(", ");
  return `Last time (${shortDate}): ${summary}`;
}
