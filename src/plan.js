// The words shown on the "Your plan" card: the current training days and injuries.
import { INJURY_AREAS } from "./program.js";
import { weekdayNames } from "./schedule.js";

// Returns { days: "Mon, Tue, Thu, and Fri", injuries: "Knees, Hips" } ("None" when no area is ticked).
export function planSummary({ trainingDays, injuries }) {
  const labels = INJURY_AREAS.filter((area) => injuries.includes(area.key)).map((area) => area.label);
  return {
    days: weekdayNames(trainingDays),
    injuries: labels.length === 0 ? "None" : labels.join(", "),
  };
}
