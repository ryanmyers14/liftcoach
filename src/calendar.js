// The logic behind the Calendar: which dates fill a month, and what happened on each day.
// Dates are "YYYY-MM-DD" strings, the same form the rest of the app saves. Months are 1 to 12.

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (number) => String(number).padStart(2, "0");

// One entry per grid cell, week by week starting on Sunday: a date string, or null for the empty
// cells before the 1st and after the last day, so every row has exactly seven cells.
export function monthGrid(year, month) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${pad(month)}-${pad(day)}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

export function shiftMonth(year, month, delta) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function monthLabel(year, month) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

// "trained" if any set was logged that day, then "skipped", then "recovery", otherwise "none".
// A skip is saved as { date, from, next }; very old saves are bare date strings, so both count.
export function dayStatus(date, sets, skips, recoveryDates) {
  if (sets.some((set) => set.date === date)) {
    return "trained";
  }
  if (skips.some((skip) => (typeof skip === "string" ? skip : skip.date) === date)) {
    return "skipped";
  }
  return recoveryDates.includes(date) ? "recovery" : "none";
}

// The sets logged on a date, grouped by exercise in the order the exercises were first logged:
// [{ exercise, sets: [{ weight, reps }] }].
export function setsOnDate(sets, date) {
  const groups = [];
  for (const set of sets) {
    if (set.date !== date) {
      continue;
    }
    let group = groups.find((existing) => existing.exercise === set.exercise);
    if (!group) {
      group = { exercise: set.exercise, sets: [] };
      groups.push(group);
    }
    group.sets.push({ weight: set.weight, reps: set.reps });
  }
  return groups;
}
