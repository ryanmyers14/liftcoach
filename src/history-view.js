// The History screen: a pop-up list of every day you logged sets, newest first, opened from the History button.
// The data lives in app.js, so it is read through getSets() each time the panel opens.

import { hasValidDate, readableDate, workoutHistory } from "./calendar.js";
import { loggedExercises } from "./goals.js";

const ALL_LIFTS = "";

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
};

// getSets: () => every saved set as { exercise, weight, reps, date }.
export function setupHistory({ openButton, getSets }) {
  const dialog = document.getElementById("history");
  const list = document.getElementById("history-list");
  const filter = document.getElementById("history-filter");

  // One option per lift that can appear in the list, A to Z, after "All lifts". Rebuilt on every open so new lifts appear.
  function fillFilter(sets) {
    const lifts = loggedExercises(sets.filter(hasValidDate)).sort((a, b) => a.localeCompare(b));
    const options = [new Option("All lifts", ALL_LIFTS), ...lifts.map((lift) => new Option(lift, lift))];
    filter.replaceChildren(...options);
    filter.value = ALL_LIFTS;
  }

  function draw() {
    const sets = getSets();
    const lift = filter.value === ALL_LIFTS ? null : filter.value;
    const days = workoutHistory(sets, lift);
    if (days.length === 0) {
      const message = lift === null ? "No workouts yet. Log a set and it will show up here." : `No workouts for ${lift} yet.`;
      list.replaceChildren(el("p", "history-empty", message));
      return;
    }
    list.replaceChildren(
      ...days.map(({ date, exercises }) => {
        const entry = el("section", "history-day");
        entry.append(el("h3", "history-date", readableDate(date)));
        for (const { exercise, sets } of exercises) {
          entry.append(el("p", "calendar-exercise", exercise));
          entry.append(el("p", "calendar-sets", sets.map((set) => `${set.weight} lb \u00d7 ${set.reps}`).join(", ")));
        }
        return entry;
      }),
    );
  }

  filter.addEventListener("change", () => {
    draw();
    list.scrollTop = 0;
  });

  openButton.addEventListener("click", () => {
    fillFilter(getSets());
    draw();
    list.scrollTop = 0;
    dialog.showModal();
  });
  document.getElementById("history-close").addEventListener("click", () => dialog.close());
  // Tapping the dim area outside the panel closes it, like the Close button.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}
