// The one-time setup quiz: experience, schedule, goal, equipment, injuries,
// bodyweight, and current working weights.
import {
  buildProgram,
  EQUIPMENT,
  EXPERIENCE_LEVELS,
  GOALS,
  INJURY_AREAS,
  MAX_DAYS,
  MIN_DAYS,
  QUIZ_LIFTS,
  SESSION_LENGTHS,
} from "./program.js";
import { todayString } from "./storage.js";

const MAX_QUIZ_WEIGHT = 1500;
const MAX_QUIZ_REPS = 30;
const MAX_BODYWEIGHT = 700;
const STEP_COUNT = 9;

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

function choiceButton(label, detail, isSelected, onChoose) {
  const button = element("button", "choice");
  button.type = "button";
  button.classList.toggle("selected", isSelected);
  button.append(element("span", "choice-label", label));
  if (detail) {
    button.append(element("span", "choice-detail", detail));
  }
  button.addEventListener("click", onChoose);
  return button;
}

function textButton(label, onClick) {
  const button = element("button", "btn-link", label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function textInput(id, placeholder, value, inputMode) {
  const input = element("input", "text-input");
  input.id = id;
  input.type = "text";
  input.inputMode = inputMode;
  input.autocomplete = "off";
  input.placeholder = placeholder;
  input.value = value ?? "";
  return input;
}

// Reads an optional number from a field. Returns null when blank, NaN when invalid.
function optionalNumber(input, { max, wholeNumber }) {
  const text = input.value.trim();
  if (text === "") {
    return null;
  }
  const value = Number(text);
  const valid = Number.isFinite(value) && value > 0 && value <= max && (!wholeNumber || Number.isInteger(value));
  return valid ? value : NaN;
}

// Calls onDone(profile) when finished, or onSkip() if the student skips the quiz.
export function startQuiz(container, { onDone, onSkip }) {
  const answers = {
    experience: null,
    daysPerWeek: null,
    sessionMinutes: null,
    goal: null,
    equipment: null,
    injuries: [],
    bodyweight: null,
    weights: {},
  };
  let step = 0;
  const steps = [];

  function show(...children) {
    container.replaceChildren(...children);
    container.hidden = false;
  }

  function header(title, question) {
    return [
      element("p", "quiz-step", `Setup · ${step + 1} of ${STEP_COUNT}`),
      element("h2", "", title),
      element("p", "quiz-question", question),
    ];
  }

  function footer(...extra) {
    const row = element("div", "quiz-footer");
    if (step > 0) {
      row.append(textButton("Back", () => go(step - 1)));
    }
    row.append(...extra);
    return row;
  }

  function go(nextStep) {
    step = nextStep;
    steps[step]();
  }

  // A question with one answer: tapping an option saves it and moves on.
  function singleChoiceStep({ title, question, options, field, extra }) {
    return () => {
      const list = element("div", "choices");
      for (const option of options) {
        list.append(
          choiceButton(option.label, option.detail, answers[field] === option.key, () => {
            if (field === "equipment" && answers.equipment !== option.key) {
              answers.weights = {};
            }
            answers[field] = option.key;
            go(step + 1);
          }),
        );
      }
      show(...header(title, question), list, footer(...(extra ? [extra()] : [])));
    };
  }

  function weightsStep() {
    const lifts = QUIZ_LIFTS[answers.equipment];
    const unit = answers.equipment === "dumbbells" ? "lb each hand" : "lb";
    const form = element("form", "quiz-weights");
    form.noValidate = true;
    const fields = lifts.map((lift, index) => {
      const saved = answers.weights[lift];
      const weight = textInput(`quiz-weight-${index}`, "Weight", saved?.weight, "decimal");
      const reps = textInput(`quiz-reps-${index}`, "Reps", saved?.reps, "numeric");
      weight.setAttribute("aria-label", `${lift} weight in ${unit}`);
      reps.setAttribute("aria-label", `${lift} reps`);
      const row = element("div", "weight-row");
      row.append(weight, reps);
      form.append(element("p", "field-label", `${lift} (${unit} × reps)`), row);
      return { lift, weight, reps };
    });
    const message = element("p", "form-message error");
    message.setAttribute("aria-live", "polite");
    const next = element("button", "btn-primary", "Next");
    next.type = "submit";
    form.append(message, next);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const weights = {};
      for (const { lift, weight, reps } of fields) {
        const weightValue = optionalNumber(weight, { max: MAX_QUIZ_WEIGHT, wholeNumber: false });
        const repsValue = optionalNumber(reps, { max: MAX_QUIZ_REPS, wholeNumber: true });
        if (Number.isNaN(weightValue)) {
          message.textContent = `${lift}: enter a weight between 1 and ${MAX_QUIZ_WEIGHT}, or leave it blank.`;
          weight.focus();
          return;
        }
        if (Number.isNaN(repsValue)) {
          message.textContent = `${lift}: enter reps as a whole number from 1 to ${MAX_QUIZ_REPS}, or leave it blank.`;
          reps.focus();
          return;
        }
        if (weightValue !== null) {
          weights[lift] = { weight: weightValue, reps: repsValue ?? 8 };
        }
      }
      answers.weights = weights;
      go(step + 1);
    });

    show(
      ...header(
        "Your working weights",
        "For each lift, enter a recent hard set: the weight and how many reps you got. Leave a lift blank if you're not sure. If you leave reps blank, I'll assume 8.",
      ),
      form,
      footer(),
    );
  }

  function injuriesStep() {
    const list = element("div", "choices");
    for (const area of INJURY_AREAS) {
      const button = choiceButton(area.label, "", answers.injuries.includes(area.key), () => {
        const selected = !answers.injuries.includes(area.key);
        answers.injuries = selected ? [...answers.injuries, area.key] : answers.injuries.filter((key) => key !== area.key);
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      button.setAttribute("aria-pressed", String(answers.injuries.includes(area.key)));
      list.append(button);
    }
    const next = element("button", "btn-primary", "Next");
    next.type = "button";
    next.addEventListener("click", () => go(step + 1));
    show(
      ...header("Injuries or limits", "Anything sore or injured? I'll swap out exercises that load it. Pick none if you're good."),
      list,
      next,
      footer(),
    );
  }

  function bodyweightStep() {
    const form = element("form", "quiz-weights");
    form.noValidate = true;
    const label = element("label", "field-label", "Bodyweight (lb), optional");
    label.htmlFor = "quiz-bodyweight";
    const input = textInput("quiz-bodyweight", "e.g. 170", answers.bodyweight, "decimal");
    const message = element("p", "form-message error");
    message.setAttribute("aria-live", "polite");
    const next = element("button", "btn-primary", "Next");
    next.type = "submit";
    form.append(label, input, message, next);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = optionalNumber(input, { max: MAX_BODYWEIGHT, wholeNumber: false });
      if (Number.isNaN(value)) {
        message.textContent = `Enter a weight between 1 and ${MAX_BODYWEIGHT} lb, or leave it blank.`;
        input.focus();
        return;
      }
      answers.bodyweight = value;
      go(step + 1);
    });
    show(
      ...header("Your bodyweight", "I use it to guess starting weights for any lift you leave blank. Skip it if you'd rather not say."),
      form,
      footer(),
    );
  }

  function reviewStep() {
    const list = element("ol", "program-list");
    for (const day of buildProgram(answers)) {
      const item = element("li", "program-day");
      item.append(element("strong", "", day.name), element("span", "", day.exercises.map((exercise) => exercise.name).join(", ")));
      list.append(item);
    }
    const finish = element("button", "btn-primary", "Start training");
    finish.type = "button";
    finish.addEventListener("click", () => onDone({ ...answers, setupDate: todayString() }));
    show(...header("Your week", `Here is a ${answers.daysPerWeek}-day program built from your answers.`), list, finish, footer());
  }

  const dayOptions = [];
  for (let days = MIN_DAYS; days <= MAX_DAYS; days += 1) {
    dayOptions.push({ key: days, label: `${days} days` });
  }

  steps.push(
    singleChoiceStep({
      title: "Let's set you up",
      question: "How long have you been lifting?",
      options: EXPERIENCE_LEVELS,
      field: "experience",
      extra: () => textButton("Skip setup, I'll just log sets", onSkip),
    }),
    singleChoiceStep({ title: "Your schedule", question: "How many days a week can you train?", options: dayOptions, field: "daysPerWeek" }),
    singleChoiceStep({ title: "Session length", question: "How long can a workout be?", options: SESSION_LENGTHS, field: "sessionMinutes" }),
    singleChoiceStep({ title: "Your goal", question: "What matters most right now?", options: GOALS, field: "goal" }),
    singleChoiceStep({ title: "Equipment", question: "What do you have to train with?", options: EQUIPMENT, field: "equipment" }),
    injuriesStep,
    bodyweightStep,
    weightsStep,
    reviewStep,
  );

  go(0);
}
