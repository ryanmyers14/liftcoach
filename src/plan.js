// The words shown on the "Your plan" card: the current training days, session length, and injuries.
import { INJURY_AREAS, SESSION_LENGTHS } from "./program.js";
import { weekdayNames } from "./schedule.js";

// Returns { days: "Mon, Tue, Thu, and Fri", length: "45 minutes", injuries: "Knees, Hips" } ("None" when no area is
// ticked). A session length that is not one of the quiz's choices reads as the full 60-minute workout.
export function planSummary({ trainingDays, sessionMinutes, injuries }) {
  const labels = INJURY_AREAS.filter((area) => injuries.includes(area.key)).map((area) => area.label);
  const length = SESSION_LENGTHS.find((option) => option.key === sessionMinutes) ?? SESSION_LENGTHS[SESSION_LENGTHS.length - 1];
  return {
    days: weekdayNames(trainingDays),
    length: length.label,
    injuries: labels.length === 0 ? "None" : labels.join(", "),
  };
}
