// The "Edit injuries" card: change which areas are sore without redoing the whole setup quiz.
import { INJURY_AREAS } from "./program.js";

// Returns a new list with `key` added if it was missing, or removed if it was there. The Edit days card uses it too.
export function toggleChoice(choices, key) {
  return choices.includes(key) ? choices.filter((choice) => choice !== key) : [...choices, key];
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

// Calls onSave(injuries) with the chosen area keys, or onCancel() if the student backs out.
export function startInjuryEditor(container, { injuries, onSave, onCancel }) {
  let chosen = [...injuries];

  const list = element("div", "choices");
  for (const area of INJURY_AREAS) {
    const button = element("button", "choice");
    button.type = "button";
    button.append(element("span", "choice-label", area.label));
    const showSelected = () => {
      const selected = chosen.includes(area.key);
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    };
    showSelected();
    button.addEventListener("click", () => {
      chosen = toggleChoice(chosen, area.key);
      showSelected();
    });
    list.append(button);
  }

  const save = element("button", "btn-primary", "Save injuries");
  save.type = "button";
  save.addEventListener("click", () => onSave(chosen));

  const cancel = element("button", "btn-link", "Cancel");
  cancel.type = "button";
  cancel.addEventListener("click", onCancel);

  container.replaceChildren(
    element("h2", "", "Injuries or limits"),
    element("p", "quiz-question", "Anything sore or injured? I'll swap out exercises that load it. Your logged sets and goals stay as they are."),
    list,
    save,
    cancel,
  );
  container.hidden = false;
}
