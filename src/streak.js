// The training streak: how many days in a row you trained without missing a planned workout.
// Walking back from today, a day you trained adds one. A skip, or a training weekday with nothing
// logged, ends the streak. Recovery days and ordinary rest weekdays never end it. Today is
// forgiven until the day is over, so a streak does not read zero before you have lifted.

import { dayBefore, isTrainingDate } from "./schedule.js";

export function currentStreak({ sets, skips, recoveryDates, trainingDays, trainingDaysSince, today }) {
  const setDates = new Set(sets.map((set) => set.date));
  const skipDates = new Set(skips.map((skip) => (typeof skip === "string" ? skip : skip.date)));
  const earliest = [...setDates].sort()[0];
  let streak = 0;
  for (let date = today; earliest !== undefined && date >= earliest; date = dayBefore(date)) {
    if (setDates.has(date)) {
      streak += 1;
    } else if (skipDates.has(date)) {
      break;
    } else if (date !== today && !recoveryDates.includes(date) && isTrainingDate(date, trainingDays) && (trainingDaysSince === undefined || date >= trainingDaysSince)) {
      break;
    }
  }
  return streak;
}

// The line shown on the main screen, or null when there is nothing to say yet.
export function streakText(streak, trainedToday) {
  if (streak === 0) {
    return "No streak yet. Log a set today to start one.";
  }
  const label = `${streak}-day streak`;
  return trainedToday
    ? `${label}. Nice work today.`
    : `${label}. Train today to keep it going.`;
}
