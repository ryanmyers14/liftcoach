// The History screen: a pop-up list of every day you logged sets, newest first, opened from the History button.
// The data lives in app.js, so it is read through getSets() each time the panel opens.

import { readableDate, workoutHistory } from "./calendar.js";

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

  function draw() {
    const days = workoutHistory(getSets());
    if (days.length === 0) {
      list.replaceChildren(el("p", "history-empty", "No workouts yet. Log a set and it will show up here."));
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

  openButton.addEventListener("click", () => {
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
