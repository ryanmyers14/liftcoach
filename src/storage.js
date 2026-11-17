// Sets are saved in the browser as a list of
// { id, exercise, weight, reps, date } where date is local "YYYY-MM-DD".

import { isSavedSet } from "./backup.js";

export const SETS_KEY = "liftcoach_sets_v1";
const PROFILE_KEY = "liftcoach_profile_v1";
const SWAPS_KEY = "liftcoach_swaps_v1";
const SAVED_SWAPS_KEY = "liftcoach_saved_swaps_v1";
const GOALS_KEY = "liftcoach_goals_v1";
const MAXES_KEY = "liftcoach_maxes_v1";
const SKIPS_KEY = "liftcoach_skips_v1";
const RECOVERY_DATES_KEY = "liftcoach_recovery_dates_v1";
const RECOVERY_CHECKS_KEY = "liftcoach_recovery_checks_v1";
const SHORT_TODAY_KEY = "liftcoach_short_today_v1";
const SHORT_DAYS_KEY = "liftcoach_short_days_v1";

export class StorageError extends Error {}

export function loadSets() {
  try {
    const saved = localStorage.getItem(SETS_KEY);
    const sets = saved ? JSON.parse(saved) : [];
    // A saved value of the wrong shape (not a list, or entries missing a lift, weight, reps or date) would
    // crash the app on load, so only the well-formed sets are kept.
    return Array.isArray(sets) ? sets.filter(isSavedSet) : [];
  } catch {
    throw new StorageError("Could not read your saved sets.");
  }
}

export function saveSets(sets) {
  try {
    localStorage.setItem(SETS_KEY, JSON.stringify(sets));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

// The profile is the setup-quiz result: { daysPerWeek, goal, weights, setupDate },
// or { skipped: true } if the quiz was skipped. null means the quiz has not been seen.
export function loadProfile() {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    throw new StorageError("Could not read your saved setup.");
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

// Exercise swaps last for one workout: { date, swaps: { "<dayIndex>:<original>": "<replacement>" } }.
// Swaps saved on an earlier day are ignored, so the program is back to normal the next session.
export function loadSwaps(today) {
  try {
    const saved = JSON.parse(localStorage.getItem(SWAPS_KEY) ?? "null");
    return saved !== null && saved.date === today ? saved.swaps : {};
  } catch {
    return {};
  }
}

export function saveSwaps(today, swaps) {
  try {
    localStorage.setItem(SWAPS_KEY, JSON.stringify({ date: today, swaps }));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

// Permanent switches: { "<original exercise>": "<replacement>" }. They apply to every workout day.
export function loadSavedSwaps() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_SWAPS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveSavedSwaps(savedSwaps) {
  try {
    localStorage.setItem(SAVED_SWAPS_KEY, JSON.stringify(savedSwaps));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

// Goals you set yourself: { "<exercise name lower case>": target weight in lb }.
export function loadGoals() {
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveGoals(goals) {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

// Workout days you chose to skip: one { date, from, next } entry per skip, where from and next
// are the day indexes skipped and moved to. Entries saved as a bare "YYYY-MM-DD" date still load.
export function loadSkips() {
  try {
    const saved = JSON.parse(localStorage.getItem(SKIPS_KEY) ?? "[]");
    const skips = Array.isArray(saved) ? saved.map((skip) => (typeof skip === "string" ? { date: skip } : skip)) : [];
    return skips.filter((skip) => typeof skip === "object" && skip !== null && typeof skip.date === "string");
  } catch {
    return [];
  }
}

export function saveSkips(skips) {
  try {
    localStorage.setItem(SKIPS_KEY, JSON.stringify(skips));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

// Dates you opened the app on a recovery day. Each one counts as a step in the rotation.
export function loadRecoveryDates() {
  try {
    return JSON.parse(localStorage.getItem(RECOVERY_DATES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRecoveryDates(dates) {
  try {
    localStorage.setItem(RECOVERY_DATES_KEY, JSON.stringify(dates));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

// The recovery checklist items ticked today, as ids: { date, done: ["stretch", "walk"] }.
// Ticks saved on an earlier day are ignored, so the list starts fresh each day.
export function loadRecoveryChecks(today) {
  try {
    const saved = JSON.parse(localStorage.getItem(RECOVERY_CHECKS_KEY) ?? "null");
    return saved !== null && saved.date === today ? saved.done : [];
  } catch {
    return [];
  }
}

export function saveRecoveryChecks(today, done) {
  try {
    localStorage.setItem(RECOVERY_CHECKS_KEY, JSON.stringify({ date: today, done }));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

// One-rep maxes you have tested: [{ exercise, weight, date }].
export function loadMaxes() {
  try {
    return JSON.parse(localStorage.getItem(MAXES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveMaxes(maxes) {
  try {
    localStorage.setItem(MAXES_KEY, JSON.stringify(maxes));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function newSetId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// A short day chosen for today only: { date, minutes }. A choice saved on an earlier day is ignored, so the
// next day is back to the full workout.
export function loadShortToday(today) {
  try {
    const saved = JSON.parse(localStorage.getItem(SHORT_TODAY_KEY) ?? "null");
    return typeof saved === "object" && saved !== null && saved.date === today && Number.isInteger(saved.minutes) ? { date: today, minutes: saved.minutes } : null;
  } catch {
    return null;
  }
}

export function saveShortToday(shortToday) {
  try {
    if (shortToday === null) {
      localStorage.removeItem(SHORT_TODAY_KEY);
    } else {
      localStorage.setItem(SHORT_TODAY_KEY, JSON.stringify(shortToday));
    }
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}

// Short days that repeat every week: { "<weekday number>": minutes }. Entries that are not a weekday 0 to 6
// with a whole number of minutes are dropped.
export function loadShortDays() {
  try {
    const saved = JSON.parse(localStorage.getItem(SHORT_DAYS_KEY) ?? "{}");
    const entries = typeof saved === "object" && saved !== null && !Array.isArray(saved) ? Object.entries(saved) : [];
    return Object.fromEntries(entries.filter(([weekday, minutes]) => /^[0-6]$/.test(weekday) && Number.isInteger(minutes)));
  } catch {
    return {};
  }
}

export function saveShortDays(shortDays) {
  try {
    localStorage.setItem(SHORT_DAYS_KEY, JSON.stringify(shortDays));
  } catch {
    throw new StorageError("Could not save. Your browser may be blocking storage (private mode?).");
  }
}
