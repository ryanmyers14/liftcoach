// The "Edit days" card: change which weekdays you train without redoing the whole setup quiz.
import { toggleChoice } from "./injuries.js";
import { MAX_DAYS, MIN_DAYS } from "./program.js";
import { WEEKDAYS } from "./schedule.js";

// Returns an error message if the chosen weekdays are not a valid number of days, otherwise null.
export function daysProblem(trainingDays) {
  if (trainingDays.length < MIN_DAYS || trainingDays.length > MAX_DAYS) {
    return `Pick between ${MIN_DAYS} and ${MAX_DAYS} days.`;
  }
  return null;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

// Calls onSave(trainingDays) with the chosen weekday numbers, or onCancel() if the student backs out.
export function startDaysEditor(container, { trainingDays, onSave, onCancel }) {
  let chosen = [...trainingDays];
  const message = element("p", "form-message error");
  message.setAttribute("aria-live", "polite");

  const list = element("div", "choices");
  for (const weekday of WEEKDAYS) {
    const button = element("button", "choice");
    button.type = "button";
    button.append(element("span", "choice-label", weekday.label));
    const showSelected = () => {
      const selected = chosen.includes(weekday.key);
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    };
    showSelected();
    button.addEventListener("click", () => {
      chosen = toggleChoice(chosen, weekday.key);
      showSelected();
      message.textContent = "";
    });
    list.append(button);
  }

  const save = element("button", "btn-primary", "Save days");
  save.type = "button";
  save.addEventListener("click", () => {
    const problem = daysProblem(chosen);
    if (problem !== null) {
      message.textContent = problem;
      return;
    }
    onSave(chosen);
  });

  const cancel = element("button", "btn-link", "Cancel");
  cancel.type = "button";
  cancel.addEventListener("click", onCancel);

  container.replaceChildren(
    element("h2", "", "Your training days"),
    element(
      "p",
      "quiz-question",
      "Which days of the week do you train? The number you pick sets the length of your program. Your logged sets, goals and injuries stay as they are.",
    ),
    list,
    message,
    save,
    cancel,
  );
  container.hidden = false;
}
