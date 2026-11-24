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

// Where to draw each check-in, as fractions of the chart from 0 to 1: x runs left to right by date (a lone
// point sits in the middle), y runs top to bottom, so a heavier weight is higher up. The chart is scaled to
// your own weights, with a little room above and below, so small changes still show.
export function bodyweightChartPoints(entries) {
  if (entries.length === 0) {
    return [];
  }
  const weights = entries.map((entry) => entry.weight);
  const lowest = Math.min(...weights);
  const highest = Math.max(...weights);
  const margin = Math.max(1, (highest - lowest) * 0.15);
  const top = highest + margin;
  const range = highest - lowest + 2 * margin;
  const firstDay = Date.parse(entries[0].date);
  const days = (Date.parse(entries[entries.length - 1].date) - firstDay) / DAY_MS;
  return entries.map(({ date, weight }) => ({
    date,
    weight,
    x: days === 0 ? 0.5 : (Date.parse(date) - firstDay) / DAY_MS / days,
    y: (top - weight) / range,
  }));
}
