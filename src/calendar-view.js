// The Calendar screen: a month grid in a pop-up panel that opens from the Calendar button.
// Days you trained, skipped, or rested are marked; tapping a day shows the sets logged on it.
// The data lives in app.js, so it is read through getData() each time the panel opens or changes.

import { dayStatus, monthGrid, monthLabel, setsOnDate, shiftMonth } from "./calendar.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_WORDS = { trained: "trained", skipped: "skipped", recovery: "recovery day", none: "nothing logged" };

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

// "2026-11-02" -> "Monday, November 2". Built from numbers so the device's time zone cannot shift it.
function readableDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

// getData: () => ({ sets, skips, recoveryDates }); getToday: () => "YYYY-MM-DD".
export function setupCalendar({ openButton, getData, getToday }) {
  const dialog = document.getElementById("calendar");
  const title = document.getElementById("calendar-title");
  const grid = document.getElementById("calendar-grid");
  const detail = document.getElementById("calendar-detail");
  let shown = { year: 0, month: 0 };
  let selected = "";

  function showDetail(data) {
    const dayName = el("h3", "calendar-detail-title", readableDate(selected));
    const status = dayStatus(selected, data.sets, data.skips, data.recoveryDates);
    const groups = setsOnDate(data.sets, selected);
    const body = el("div", "calendar-detail-body");
    if (groups.length === 0) {
      body.append(el("p", "calendar-empty", status === "none" ? "Nothing logged this day." : `You ${status === "recovery" ? "had a recovery day" : "skipped this day"}.`));
    } else {
      for (const group of groups) {
        body.append(el("p", "calendar-exercise", group.exercise));
        body.append(el("p", "calendar-sets", group.sets.map((set) => `${set.weight} lb × ${set.reps}`).join(", ")));
      }
    }
    detail.replaceChildren(dayName, body);
  }

  function draw() {
    const data = getData();
    const today = getToday();
    title.textContent = monthLabel(shown.year, shown.month);
    const cells = WEEKDAYS.map((name) => el("div", "calendar-weekday", name));
    for (const date of monthGrid(shown.year, shown.month)) {
      if (date === null) {
        cells.push(el("div", "calendar-blank"));
        continue;
      }
      const status = dayStatus(date, data.sets, data.skips, data.recoveryDates);
      const cell = el("button", `calendar-day calendar-${status}`, String(Number(date.slice(8))));
      cell.type = "button";
      cell.setAttribute("aria-label", `${readableDate(date)}: ${STATUS_WORDS[status]}${date === today ? " (today)" : ""}`);
      cell.classList.toggle("calendar-today", date === today);
      cell.classList.toggle("calendar-selected", date === selected);
      cell.setAttribute("aria-pressed", String(date === selected));
      cell.addEventListener("click", () => {
        selected = date;
        draw();
      });
      cells.push(cell);
    }
    grid.replaceChildren(...cells);
    showDetail(data);
  }

  function goToToday() {
    const today = getToday();
    shown = { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
    selected = today;
    draw();
  }

  function step(delta) {
    shown = shiftMonth(shown.year, shown.month, delta);
    draw();
  }

  openButton.addEventListener("click", () => {
    goToToday();
    dialog.showModal();
  });
  document.getElementById("calendar-today").addEventListener("click", goToToday);
  document.getElementById("calendar-prev").addEventListener("click", () => step(-1));
  document.getElementById("calendar-next").addEventListener("click", () => step(1));
  document.getElementById("calendar-close").addEventListener("click", () => dialog.close());
  // Tapping the dim area outside the panel closes it, like the Close button.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}
