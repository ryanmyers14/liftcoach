// Weight goals for each exercise. A goal is a target weight. Unless you set your own,
// the suggested goal is a few of the coach's weight jumps above where you started, so it
// stays put while you progress toward it.
import { shortDateLabel } from "./bodyweight.js";
import { incrementFor } from "./coach.js";
import { isAccessory, repRangeFor } from "./exercises.js";

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

// The next goal to offer once a goal is reached: the same distance above the weight you reached as a suggested goal
// is above where you started. Null when the goal is not reached yet, or when the next goal would be past maxWeight.
export function nextGoalOffer(row, experience, maxWeight) {
  if (!row.reached) {
    return null;
  }
  const next = suggestedGoal(row.exercise, row.current, experience);
  return next > maxWeight ? null : next;
}

// Each exercise you have logged at least once, in the order you first logged it. Without a program
// there is no list of lifts to set goals for, so the goals card uses the lifts you have actually done.
// Names that differ only in capital letters count as one lift, shown the way it was first typed.
export function loggedExercises(sets) {
  const byKey = new Map();
  for (const set of sets) {
    const key = set.exercise.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, set.exercise);
    }
  }
  return [...byKey.values()];
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
// visible, and the goal line sits at the top with goalFar set. When reachDate (the estimated day
// you reach the goal) is later than your last session, the dates stretch out to it and reachPoint
// is where the goal sits on that day, at the right edge; otherwise reachPoint is null.
// Returns { points, goalY, goalFar, reachPoint }.
export function chartPoints(history, goal, reachDate = null) {
  const weights = history.map((entry) => entry.weight);
  const lowest = Math.min(...weights, goal);
  const highest = Math.max(...weights);
  const spread = highest - Math.min(...weights);
  const goalFar = spread > 0 && goal - highest > spread * FAR_GOAL_SPREADS;

  const high = goalFar ? highest + spread * 0.4 : Math.max(goal, highest);
  const low = goalFar ? Math.min(...weights) - spread * 0.1 : lowest - Math.max(1, (high - lowest) * 0.1);
  const yFor = (weight) => (high - weight) / (high - low);

  const firstDay = history.length === 0 ? 0 : Date.parse(history[0].date);
  const lastSessionDay = history.length === 0 ? 0 : Date.parse(history[history.length - 1].date);
  const reaching = history.length > 0 && reachDate !== null && Date.parse(reachDate) > lastSessionDay;
  const days = ((reaching ? Date.parse(reachDate) : lastSessionDay) - firstDay) / DAY_MS;
  const points = history.map(({ date, weight }) => ({
    date,
    weight,
    x: days === 0 ? 0.5 : (Date.parse(date) - firstDay) / DAY_MS / days,
    y: yFor(weight),
  }));
  const goalLineY = goalFar ? 0 : yFor(goal);
  return { points, goalY: goalLineY, goalFar, reachPoint: reaching ? { x: 1, y: goalLineY } : null };
}

const RECENT_DAYS = 28;
const MIN_SESSIONS_FOR_FREQUENCY = 3;
const MAX_SESSIONS_PER_WEEK = 7;
const MAX_ESTIMATE_DAYS = 365;

// How many times a week you do the lift: the days you logged it in the last 28 days, divided by four weeks.
// With fewer than three such days there is too little to go on, so it counts as once a week (assumed: true).
function sessionsPerWeek(exercise, sets, today) {
  const wanted = exercise.toLowerCase();
  const todayDay = Date.parse(today);
  const days = new Set(
    sets
      .filter((set) => {
        const age = todayDay - Date.parse(set.date);
        return set.exercise.toLowerCase() === wanted && age >= 0 && age < RECENT_DAYS * DAY_MS;
      })
      .map((set) => set.date),
  );
  return days.size < MIN_SESSIONS_FOR_FREQUENCY
    ? { perWeek: 1, assumed: true }
    : { perWeek: Math.min(days.size / (RECENT_DAYS / 7), MAX_SESSIONS_PER_WEEK), assumed: false };
}

// When you would reach a lift goal if you follow the coach: it adds one weight jump (incrementFor) after every
// set reaches the top of the rep range, and you restart at the bottom, so each weight takes about
// (top - bottom + 1) sessions. Sessions are turned into days using how often you do the lift. Returns
// { jumps, increment, sessions, perWeek, assumed, days, date }, where date is null when it is more than a
// year away, or null when you have already reached the goal.
export function reachEstimate({ exercise, current, goal, sets, experience, today }) {
  if (!Number.isFinite(current) || !Number.isFinite(goal) || current >= goal) {
    return null;
  }
  const increment = incrementFor(exercise, experience);
  const [minReps, maxReps] = repRangeFor(exercise);
  const jumps = Math.ceil((goal - current) / increment - 1e-9);
  const sessions = jumps * (maxReps - minReps + 1);
  const { perWeek, assumed } = sessionsPerWeek(exercise, sets, today);
  const days = Math.ceil((sessions / perWeek) * 7);
  const date = days > MAX_ESTIMATE_DAYS ? null : new Date(Date.parse(today) + days * DAY_MS).toISOString().slice(0, 10);
  return { jumps, increment, sessions, perWeek, assumed, days, date };
}

function frequencyText(perWeek) {
  if (perWeek === 1) {
    return "once a week";
  }
  if (perWeek === 2) {
    return "twice a week";
  }
  return perWeek > 1 ? `${Number(perWeek.toFixed(1))} times a week` : `once every ${Number((1 / perWeek).toFixed(1))} weeks`;
}

// What the goal card says about the estimate, as lines of text. Nothing when there is no estimate.
export function reachLines(estimate, today) {
  if (estimate === null) {
    return [];
  }
  const { jumps, increment, sessions, perWeek, assumed, days, date } = estimate;
  const first = `Coach's pace: ${jumps} ${jumps === 1 ? "jump" : "jumps"} of ${increment} lb, about ${sessions} ${sessions === 1 ? "session" : "sessions"}.`;
  const frequency = assumed ? "Log it a few more times so I can see how often you train it. Until then I'm assuming once a week" : `You train it about ${frequencyText(perWeek)}`;
  if (date === null) {
    return [first, `${frequency}, so that is more than a year away at this pace.`];
  }
  const label = shortDateLabel(date, date.slice(0, 4) !== today.slice(0, 4));
  const span = days < 14 ? `${days} days` : `${Math.round(days / 7)} weeks`;
  return [first, `${frequency}, so you'd reach it around ${label} (${span}).`];
}
