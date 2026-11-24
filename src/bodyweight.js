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

// A goal target date is a real calendar day written "YYYY-MM-DD".
export function isSavedGoalDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value))) {
    return false;
  }
  return new Date(Date.parse(value)).toISOString().slice(0, 10) === value;
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

// Whole days from today to a date: positive in the future, 0 today, negative once it has passed.
export function daysUntil(date, today) {
  return Math.round((Date.parse(date) - Date.parse(today)) / DAY_MS);
}

// The last day on the chart's date line: your newest weigh-in, or the goal's target date if that is later.
function lastChartDay(entries, goalDate) {
  const lastDay = Date.parse(entries[entries.length - 1].date);
  return goalDate === null ? lastDay : Math.max(lastDay, Date.parse(goalDate));
}

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
// point with no target date sits in the middle), y runs top to bottom, so a heavier weight is higher up. A
// target date later than your newest weigh-in stretches the dates out to it.
export function bodyweightChartPoints(entries, goal = null, goalDate = null) {
  if (entries.length === 0) {
    return [];
  }
  const { top, range } = chartRange(entries, goal);
  const firstDay = Date.parse(entries[0].date);
  const days = (lastChartDay(entries, goalDate) - firstDay) / DAY_MS;
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

// Where the target is on the chart: the goal weight at the target date, at the far right of the dates. Null
// when there is no goal, no target date, or no weigh-in, or when the target date is not after your newest
// weigh-in (then there is nothing to draw ahead of you).
export function bodyweightGoalPoint(entries, goal, goalDate) {
  if (entries.length === 0 || goal === null || goalDate === null) {
    return null;
  }
  if (Date.parse(goalDate) <= Date.parse(entries[entries.length - 1].date)) {
    return null;
  }
  return { date: goalDate, weight: goal, x: 1, y: bodyweightGoalY(entries, goal) };
}

// The dates along the bottom of the chart: the first day and the last, and the day halfway between when
// there are at least two days between them. The last day is the target date when that is later than your
// newest weigh-in. A lone day with no target date sits in the middle, where its dot is.
export function bodyweightDateMarks(entries, goalDate = null) {
  if (entries.length === 0) {
    return [];
  }
  const firstDate = entries[0].date;
  const newestDate = entries[entries.length - 1].date;
  const lastDate = goalDate !== null && goalDate > newestDate ? goalDate : newestDate;
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

const RECENT_DAYS = 28;
const MIN_PACE_SPAN_DAYS = 3;

// How much your weight has changed per week over the last 28 days (negative is losing), from your first and
// last weigh-in in that stretch. Null with fewer than two weigh-ins, or ones less than three days apart,
// because a single day's swing would look like a trend.
export function recentWeeklyChange(entries, today) {
  const todayDay = Date.parse(today);
  const recent = entries.filter((entry) => {
    const age = todayDay - Date.parse(entry.date);
    return age >= 0 && age <= RECENT_DAYS * DAY_MS;
  });
  if (recent.length < 2) {
    return null;
  }
  const first = recent[0];
  const last = recent[recent.length - 1];
  const span = (Date.parse(last.date) - Date.parse(first.date)) / DAY_MS;
  return span < MIN_PACE_SPAN_DAYS ? null : ((last.weight - first.weight) / span) * 7;
}

const poundsPerWeek = (change) => Math.abs(change).toFixed(1);

// What the card says about your goal, as lines of text: the goal and its date, then (with a date still ahead
// and a weigh-in) how much you need to change each week and how your recent pace compares. Nothing with no goal.
export function goalSummaryLines({ goal, goalDate, entries, today }) {
  if (goal === null) {
    return [];
  }
  if (goalDate === null) {
    return [`Goal: ${goal} lb.`];
  }
  const label = shortDateLabel(goalDate, goalDate.slice(0, 4) !== today.slice(0, 4));
  const days = daysUntil(goalDate, today);
  if (days < 0) {
    return [`Goal: ${goal} lb. Your target date, ${label}, has passed.`];
  }
  if (days === 0) {
    return [`Goal: ${goal} lb by today.`];
  }
  const lines = [`Goal: ${goal} lb by ${label} (${days} ${days === 1 ? "day" : "days"} left).`];
  const latest = latestBodyweight(entries);
  if (latest === null) {
    return lines;
  }
  const needed = goal - latest.weight;
  if (Math.abs(needed) < 0.05) {
    return [...lines, "You're already at your goal weight."];
  }
  const neededPerWeek = (needed / days) * 7;
  lines.push(`To get there you need to ${needed < 0 ? "lose" : "gain"} about ${poundsPerWeek(neededPerWeek)} lb a week.`);
  const recent = recentWeeklyChange(entries, today);
  if (recent === null) {
    lines.push("Add weigh-ins on a few more days to see your recent pace.");
  } else if (Math.abs(recent) < 0.05) {
    lines.push("Your weight has been flat lately, which is behind pace.");
  } else {
    const recentText = `Lately you've ${recent < 0 ? "lost" : "gained"} about ${poundsPerWeek(recent)} lb a week`;
    const rightWay = Math.sign(recent) === Math.sign(needed);
    lines.push(!rightWay ? `${recentText}, the other way from your goal.` : `${recentText}, which is ${Math.abs(recent) >= Math.abs(neededPerWeek) ? "on" : "behind"} pace.`);
  }
  return lines;
}
