// Bodyweight check-ins are saved as a list of { date, weight }, one per day, where date is local "YYYY-MM-DD".

import { parseNumber } from "./numbers.js";

export const MIN_BODYWEIGHT = 50;
export const MAX_BODYWEIGHT = 700;

// Reads what was typed into the bodyweight field: a number from 50 to 700 kept to one decimal (a scale does
// not read finer than that), or NaN if it is not one.
export function parseBodyweight(text) {
  const weight = parseNumber(text);
  return weight >= MIN_BODYWEIGHT && weight <= MAX_BODYWEIGHT ? Math.round(weight * 10) / 10 : NaN;
}

// A goal weight is a single number in the same range as a weigh-in.
export function isSavedGoalWeight(value) {
  return Number.isFinite(value) && value >= MIN_BODYWEIGHT && value <= MAX_BODYWEIGHT;
}

export function isSavedBodyweight(entry) {
  return (
    typeof entry === "object" &&
    entry !== null &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
    Number.isFinite(entry.weight) &&
    entry.weight >= MIN_BODYWEIGHT &&
    entry.weight <= MAX_BODYWEIGHT
  );
}

// Adds a check-in. A second check-in on the same day replaces the first, so the list has one weight per day,
// oldest first.
export function withBodyweight(entries, date, weight) {
  return [...entries.filter((entry) => entry.date !== date), { date, weight }].sort((a, b) => a.date.localeCompare(b.date));
}

// The newest check-in, or null if there are none.
export function latestBodyweight(entries) {
  return entries.length === 0 ? null : entries[entries.length - 1];
}

// What the bodyweight card shows: your newest weigh-in if you have one, otherwise the weight you gave in the
// setup quiz (marked with date null so the card can say where it came from), otherwise null.
export function shownBodyweight(entries, quizWeight) {
  const latest = latestBodyweight(entries);
  if (latest !== null) {
    return latest;
  }
  return Number.isFinite(quizWeight) ? { date: null, weight: quizWeight } : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// The weights the chart spans: your own range (and the goal, if there is one) with a little room above and
// below, so small changes still show.
function chartRange(entries, goal) {
  const weights = entries.map((entry) => entry.weight);
  if (goal !== null) {
    weights.push(goal);
  }
  const lowest = Math.min(...weights);
  const highest = Math.max(...weights);
  const margin = Math.max(1, (highest - lowest) * 0.15);
  return { top: highest + margin, range: highest - lowest + 2 * margin };
}

// Where to draw each check-in, as fractions of the chart from 0 to 1: x runs left to right by date (a lone
// point sits in the middle), y runs top to bottom, so a heavier weight is higher up.
export function bodyweightChartPoints(entries, goal = null) {
  if (entries.length === 0) {
    return [];
  }
  const { top, range } = chartRange(entries, goal);
  const firstDay = Date.parse(entries[0].date);
  const days = (Date.parse(entries[entries.length - 1].date) - firstDay) / DAY_MS;
  return entries.map(({ date, weight }) => ({
    date,
    weight,
    x: days === 0 ? 0.5 : (Date.parse(date) - firstDay) / DAY_MS / days,
    y: (top - weight) / range,
  }));
}

const SCALE_STEPS = [0.5, 1, 2, 5, 10, 20, 50, 100];
const MAX_SCALE_MARKS = 4;

// The weight marks down the side of the chart: round numbers (like 180 and 182) that fall inside the chart,
// with y placed the same way as in bodyweightChartPoints. At most four, so they never crowd.
export function bodyweightScale(entries, goal = null) {
  if (entries.length === 0) {
    return [];
  }
  const { top, range } = chartRange(entries, goal);
  const bottom = top - range;
  const step = SCALE_STEPS.find((candidate) => Math.floor(top / candidate) - Math.ceil(bottom / candidate) + 1 <= MAX_SCALE_MARKS) ?? 100;
  const marks = [];
  for (let n = Math.ceil(bottom / step); n <= Math.floor(top / step); n++) {
    marks.push({ weight: n * step, y: (top - n * step) / range });
  }
  return marks;
}

// Where the goal line sits, placed the same way as the points (0 is the top of the chart), or null when there
// is no goal or no weigh-in yet. The chart stretches to include the goal, so the line is always on it.
export function bodyweightGoalY(entries, goal) {
  if (entries.length === 0 || goal === null) {
    return null;
  }
  const { top, range } = chartRange(entries, goal);
  return (top - goal) / range;
}

// The dates along the bottom of the chart: the first day and the last, and the day halfway between when
// there are at least two days between them. A lone day sits in the middle, where its dot is.
export function bodyweightDateMarks(entries) {
  if (entries.length === 0) {
    return [];
  }
  const firstDate = entries[0].date;
  const lastDate = entries[entries.length - 1].date;
  const days = (Date.parse(lastDate) - Date.parse(firstDate)) / DAY_MS;
  if (days === 0) {
    return [{ date: firstDate, x: 0.5 }];
  }
  const marks = [{ date: firstDate, x: 0 }, { date: lastDate, x: 1 }];
  if (days >= 2) {
    const halfway = Math.round(days / 2);
    const date = new Date(Date.parse(firstDate) + halfway * DAY_MS).toISOString().slice(0, 10);
    marks.splice(1, 0, { date, x: halfway / days });
  }
  return marks;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11-16" as "Nov 16", or "Nov 16, 2026" when the chart spans more than one year.
export function shortDateLabel(date, withYear) {
  const [year, month, day] = date.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}${withYear ? `, ${year}` : ""}`;
}
