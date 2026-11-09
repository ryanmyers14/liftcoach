// Weight goals for each exercise. A goal is a target weight. Unless you set your own,
// the suggested goal is a few of the coach's weight jumps above where you started, so it
// stays put while you progress toward it.
import { incrementFor } from "./coach.js";
import { isAccessory } from "./exercises.js";

const JUMPS_TO_SUGGESTED_GOAL = 4;
// How far above your start the goal sits, as a share of a beginner's: experienced lifters
// progress more slowly, so their goals are closer. Anything unrecognised counts as a beginner.
const GOAL_DISTANCE_BY_EXPERIENCE = { beginner: 1, intermediate: 0.75, advanced: 0.5 };
// Small isolation lifts (lateral raise, curls, pushdowns) cannot add four full jumps and stay
// believable: 20 lb would become 40. They aim for a share above where they started instead.
const ACCESSORY_GROWTH_BY_EXPERIENCE = { beginner: 0.25, intermediate: 0.2, advanced: 0.15 };
const ACCESSORY_STEP = 5;

// The weight you started at: your first logged session's top weight, or else the quiz estimate.
// sets: every saved set as { exercise, weight, date }. Returns null when there is nothing to go on.
export function baselineWeight(exercise, sets, startEstimate) {
  const wanted = exercise.toLowerCase();
  const own = sets.filter((set) => set.exercise.toLowerCase() === wanted);
  if (own.length === 0) {
    return startEstimate ?? null;
  }
  const firstDate = own.reduce((first, set) => (set.date < first ? set.date : first), own[0].date);
  return Math.max(...own.filter((set) => set.date === firstDate).map((set) => set.weight));
}

// The heaviest weight you have logged for the exercise, or the baseline if you have not logged it yet.
export function currentWeight(exercise, sets, baseline) {
  const wanted = exercise.toLowerCase();
  const weights = sets.filter((set) => set.exercise.toLowerCase() === wanted).map((set) => set.weight);
  return weights.length === 0 ? baseline : Math.max(...weights);
}

export function suggestedGoal(exercise, baseline, experience) {
  if (isAccessory(exercise)) {
    const growth = ACCESSORY_GROWTH_BY_EXPERIENCE[experience] ?? ACCESSORY_GROWTH_BY_EXPERIENCE.beginner;
    const rise = Math.round((baseline * growth) / ACCESSORY_STEP) * ACCESSORY_STEP;
    return baseline + Math.max(ACCESSORY_STEP, rise);
  }
  const share = GOAL_DISTANCE_BY_EXPERIENCE[experience] ?? GOAL_DISTANCE_BY_EXPERIENCE.beginner;
  return baseline + JUMPS_TO_SUGGESTED_GOAL * incrementFor(exercise, "beginner") * share;
}

// One row per exercise: { exercise, baseline, current, goal, isCustom, percent, reached }.
// baseline, current and goal are null when there is no weight to build a goal from yet.
// customGoals: { "<exercise name lower case>": weight }; startEstimates: the same keys, weights.
export function goalRows(exercises, sets, customGoals, startEstimates, experience) {
  return exercises.map((exercise) => {
    const key = exercise.toLowerCase();
    const baseline = baselineWeight(exercise, sets, startEstimates[key]);
    if (baseline === null) {
      return { exercise, baseline: null, current: null, goal: null, isCustom: false, percent: 0, reached: false };
    }
    const current = currentWeight(exercise, sets, baseline);
    const isCustom = customGoals[key] !== undefined;
    const goal = isCustom ? customGoals[key] : suggestedGoal(exercise, baseline, experience);
    const reached = current >= goal;
    const span = goal - baseline;
    const percent = reached || span <= 0 ? 100 : Math.max(0, Math.round(((current - baseline) / span) * 100));
    return { exercise, baseline, current, goal, isCustom, percent, reached };
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;
const FAR_GOAL_SPREADS = 2;

// The heaviest weight you logged on each day you did the exercise, oldest first: [{ date, weight }].
export function weightHistory(exercise, sets) {
  const wanted = exercise.toLowerCase();
  const topByDate = new Map();
  for (const set of sets) {
    if (set.exercise.toLowerCase() === wanted && set.weight > (topByDate.get(set.date) ?? -Infinity)) {
      topByDate.set(set.date, set.weight);
    }
  }
  return [...topByDate].map(([date, weight]) => ({ date, weight })).sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Where to draw a weight history and its goal line, as fractions of the chart from 0 to 1.
// x runs left to right by date (a lone point sits in the middle); y runs top to bottom, so a
// heavier weight has a smaller y. When the goal is far above your weights (more than twice
// the range you have covered), the chart is scaled to your own weights so the climb stays
// visible, and the goal line sits at the top with goalFar set. Returns { points, goalY, goalFar }.
export function chartPoints(history, goal) {
  const weights = history.map((entry) => entry.weight);
  const lowest = Math.min(...weights, goal);
  const highest = Math.max(...weights);
  const spread = highest - Math.min(...weights);
  const goalFar = spread > 0 && goal - highest > spread * FAR_GOAL_SPREADS;

  const high = goalFar ? highest + spread * 0.4 : Math.max(goal, highest);
  const low = goalFar ? Math.min(...weights) - spread * 0.1 : lowest - Math.max(1, (high - lowest) * 0.1);
  const yFor = (weight) => (high - weight) / (high - low);

  const firstDay = history.length === 0 ? 0 : Date.parse(history[0].date);
  const days = history.length === 0 ? 0 : (Date.parse(history[history.length - 1].date) - firstDay) / DAY_MS;
  const points = history.map(({ date, weight }) => ({
    date,
    weight,
    x: days === 0 ? 0.5 : (Date.parse(date) - firstDay) / DAY_MS / days,
    y: yFor(weight),
  }));
  return { points, goalY: goalFar ? 0 : yFor(goal), goalFar };
}
