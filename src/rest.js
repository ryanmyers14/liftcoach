// Rest timer math, kept apart from the screen so it can be tested.

import { restFor } from "./exercises.js";

const EXTRA_SECONDS = 30;

// The short end of the exercise's rest text, like "2 to 3 minutes" (120) or "60 to 90 seconds" (60).
export function restSeconds(exercise) {
  const [, amount, unit] = restFor(exercise).match(/(\d+)(?:\s+to\s+\d+)?\s*(minute|second)/);
  return Number(amount) * (unit === "minute" ? 60 : 1);
}

// Times are milliseconds, like Date.now().
export function restEnd(exercise, now) {
  return now + restSeconds(exercise) * 1000;
}

export function secondsLeft(end, now) {
  return Math.max(0, Math.ceil((end - now) / 1000));
}

// Adds time to a running timer, or starts a finished one again.
export function extendedEnd(end, now) {
  return Math.max(end, now) + EXTRA_SECONDS * 1000;
}

export function formatClock(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
