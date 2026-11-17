// The "Edit length" card: change how long your workouts are without redoing the whole setup quiz.
import { SESSION_LENGTHS } from "./program.js";

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

// Calls onSave(minutes) with the chosen session length, or onCancel() if the student backs out.
export function startSessionEditor(container, { sessionMinutes, onSave, onCancel }) {
  let chosen = sessionMinutes;

  const list = element("div", "choices");
  const buttons = SESSION_LENGTHS.map((length) => {
    const button = element("button", "choice");
    button.type = "button";
    button.append(element("span", "choice-label", length.label));
    button.append(element("span", "choice-detail", length.detail));
    button.addEventListener("click", () => {
      chosen = length.key;
      showSelected();
    });
    list.append(button);
    return { button, key: length.key };
  });
  function showSelected() {
    for (const { button, key } of buttons) {
      button.classList.toggle("selected", key === chosen);
      button.setAttribute("aria-pressed", String(key === chosen));
    }
  }
  showSelected();

  const save = element("button", "btn-primary", "Save length");
  save.type = "button";
  save.addEventListener("click", () => onSave(chosen));

  const cancel = element("button", "btn-link", "Cancel");
  cancel.type = "button";
  cancel.addEventListener("click", onCancel);

  container.replaceChildren(
    element("h2", "", "Your session length"),
    element(
      "p",
      "quiz-question",
      "How long can a workout be? A shorter session keeps fewer exercises each day. Your logged sets, goals, training days and injuries stay as they are.",
    ),
    list,
    save,
    cancel,
  );
  container.hidden = false;
}
