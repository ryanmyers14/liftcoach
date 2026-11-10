// Which weekdays you train, and which workout lands on a future date.
// The program is a list of workouts, one per training weekday: the first weekday you picked gets the
// first workout, and so on. A missed day is simply missed; the workouts do not shift.
// Weekdays are numbered like JavaScript's: 0 is Sunday, 1 is Monday, up to 6 for Saturday.

const DEFAULT_TRAINING_DAYS = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

// The seven weekdays as the quiz shows them, Monday first.
export const WEEKDAYS = [
  { key: 1, label: "Monday" },
  { key: 2, label: "Tuesday" },
  { key: 3, label: "Wednesday" },
  { key: 4, label: "Thursday" },
  { key: 5, label: "Friday" },
  { key: 6, label: "Saturday" },
  { key: 0, label: "Sunday" },
];

// Where a weekday falls in the week when it starts on Monday: Monday is 0 and Sunday is 6.
const weekRank = (weekday) => (weekday + 6) % 7;

const weekdayOf = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
};

// The chosen weekdays in week order, Monday first and Sunday last. A profile from before weekdays were asked (or with a damaged list)
// gets an even spread for its number of days a week.
export function trainingDaysFor(profile) {
  const chosen = profile.trainingDays;
  const valid =
    Array.isArray(chosen) &&
    chosen.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
    new Set(chosen).size === chosen.length &&
    chosen.length >= 2 &&
    chosen.length <= 6;
  if (valid) {
    return [...chosen].sort((a, b) => weekRank(a) - weekRank(b));
  }
  return DEFAULT_TRAINING_DAYS[profile.daysPerWeek] ?? DEFAULT_TRAINING_DAYS[3];
}

export function isTrainingDate(date, trainingDays) {
  return trainingDays.includes(weekdayOf(date));
}

// Which workout a date gets, as a position in the list of workouts: the first training weekday gets the
// first workout, the second gets the second, and so on, every week. Null on a rest weekday.
export function plannedWorkoutIndex({ workoutCount, trainingDays, date }) {
  const position = trainingDays.indexOf(weekdayOf(date));
  return position === -1 ? null : position % workoutCount;
}

// The workout a date is "on": its own on a training day, or on a rest day the next training day's
// (wrapping past the end of the week), so a rest day can say which workout comes next.
export function workoutSlotFor(date, trainingDays) {
  const weekday = weekdayOf(date);
  const upcoming = trainingDays.findIndex((trainingDay) => weekRank(trainingDay) >= weekRank(weekday));
  return upcoming === -1 ? 0 : upcoming;
}

// The date before a "YYYY-MM-DD" date.
export function dayBefore(date) {
  const [year, month, day] = date.split("-").map(Number);
  const before = new Date(year, month - 1, day - 1);
  return `${before.getFullYear()}-${String(before.getMonth() + 1).padStart(2, "0")}-${String(before.getDate()).padStart(2, "0")}`;
}

// After skipping a workout, the next day can offer to do it then. Returns the skipped workout's position
// in the program (a skip is saved as { date, from, next }), or null when there is nothing to offer:
// no skip yesterday, you trained anyway yesterday, or you have already trained today.
// Skips from before the program position was saved are bare dates and are not offered.
export function skippedWorkoutToOffer({ skips, setDates, today }) {
  const yesterday = dayBefore(today);
  if (setDates.includes(yesterday) || setDates.includes(today)) {
    return null;
  }
  const skippedYesterday = skips.filter((skip) => skip.date === yesterday && Number.isInteger(skip.from));
  return skippedYesterday.length === 0 ? null : skippedYesterday[skippedYesterday.length - 1].from;
}

// "Mon, Tue, and Thu": short names in week order (Monday first), for sentences.
export function weekdayNames(trainingDays) {
  const names = WEEKDAYS.filter((weekday) => trainingDays.includes(weekday.key)).map((weekday) => weekday.label.slice(0, 3));
  return names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
