// Short days: a way to cut one workout down when you are short on time. A short day keeps fewer exercises, taken
// from the start of the day, the same way the setup quiz's 30 and 45 minute lengths do. It lasts for today only, or
// repeats every week on the same weekday. Lengths are minutes (30 or 45); weekdays are numbered like JavaScript's,
// 0 for Sunday to 6 for Saturday.
import { MAX_EXERCISES_BY_MINUTES, SESSION_LENGTHS } from "./program.js";
import { WEEKDAYS, weekdayOf } from "./schedule.js";

// The lengths a short day can use: shorter than the plan's own length. A 60-minute plan offers 30 and 45, a 45-minute
// plan offers 30, and a 30-minute plan offers nothing.
export function shorterLengths(planMinutes) {
  return SESSION_LENGTHS.filter((length) => MAX_EXERCISES_BY_MINUTES[length.key] !== undefined && length.key < planMinutes);
}

const isOffered = (minutes, planMinutes) => shorterLengths(planMinutes).some((length) => length.key === minutes);

// What is cutting today's workout short, or null for the full workout: { minutes, scope: "today" | "repeating" }.
// shortToday is { date, minutes } for a choice made today (a minutes value that is not a shorter length means "full
// workout today"), and shortDays maps weekdays to minutes. A choice made today wins over the weekly one.
export function activeShortDay({ planMinutes, today, shortToday, shortDays }) {
  if (shortToday && shortToday.date === today) {
    return isOffered(shortToday.minutes, planMinutes) ? { minutes: shortToday.minutes, scope: "today" } : null;
  }
  const weekly = shortDays[weekdayOf(today)];
  return isOffered(weekly, planMinutes) ? { minutes: weekly, scope: "repeating" } : null;
}

// The weekly short days that still apply to the plan, as [{ weekday, minutes }] in week order, Monday first.
export function repeatingShortDays(planMinutes, shortDays) {
  return WEEKDAYS.filter((day) => isOffered(shortDays[day.key], planMinutes)).map((day) => ({ weekday: day.key, minutes: shortDays[day.key] }));
}

// Keeps the first exercises of a day that fit in the given length.
export function trimToLength(exercises, minutes) {
  return exercises.slice(0, MAX_EXERCISES_BY_MINUTES[minutes] ?? exercises.length);
}

// "Wed 30 min, Fri 45 min" for the Your plan card.
export function shortDaysText(planMinutes, shortDays) {
  return repeatingShortDays(planMinutes, shortDays)
    .map(({ weekday, minutes }) => `${WEEKDAYS.find((day) => day.key === weekday).label.slice(0, 3)} ${minutes} min`)
    .join(", ");
}

// "Wednesday" for a "YYYY-MM-DD" date.
export function weekdayName(date) {
  return WEEKDAYS.find((day) => day.key === weekdayOf(date)).label;
}
