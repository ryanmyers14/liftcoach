import { chartPoints, goalRows, weightHistory } from "./goals.js";
import { lastSession, lastTimeText, suggestNext } from "./coach.js";
import { MAX_LIFTS, estimatedMax, isMaxLift, latestMax, maxIsDue, maxRampSets, withNewMax } from "./maxes.js";
import { MUSCLES, alternatesFor, repRangeFor, restFor, swapState, tempoFor } from "./exercises.js";
import { buildProgram, startDayIndex, startingWeights, suggestedDayIndex, weeklyMuscleSets, withDefaults } from "./program.js";
import { RECOVERY_CHECKLIST, alternateStretchesFor, muscleRecovery, nextWorkout, previousWorkout, recoveryStepDates, stretchNamed, stretchesFor, withRecoveryDays } from "./recovery.js";
import { extendedEnd, formatClock, restEnd, secondsLeft } from "./rest.js";
import { startQuiz } from "./quiz.js";
import { renderBodyMap } from "./bodymap.js";
import { applyBackup, backupFileName, buildBackup, parseBackup } from "./backup.js";
import { setupThemeToggle } from "./theme.js";
import { tutorialFor } from "./tutorials.js";
import { generalWarmup, warmupSets } from "./warmup.js";
import { loadGoals, loadMaxes, loadProfile, loadRecoveryChecks, loadRecoveryDates, loadSets, loadSavedSwaps, loadSkips, loadSwaps, newSetId, saveGoals, saveMaxes, saveProfile, saveRecoveryChecks, saveRecoveryDates, saveSavedSwaps, saveSets, saveSkips, saveSwaps, todayString } from "./storage.js";

// The service worker keeps browsers from running old copies of the app after an update.
if ("serviceWorker" in navigator) {
  // Registration can fail (for example in a private window). The app works fine without it.
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

setupThemeToggle(document.getElementById("theme-toggle"));

const BACKUP_LOADED_KEY = "liftcoach_backup_loaded";
const MAX_WEIGHT = 1500;
const MAX_REPS_PER_SET = 100;

const exerciseInput = document.getElementById("exercise");
const weightInput = document.getElementById("weight");
const repsInput = document.getElementById("reps");
const setForm = document.getElementById("set-form");
const formMessage = document.getElementById("form-message");
const coachCard = document.getElementById("coach");
const todaySetsList = document.getElementById("today-sets");
const storageError = document.getElementById("storage-error");
const warmupCard = document.getElementById("warmup");
const tutorialCard = document.getElementById("tutorial");
const weekCard = document.getElementById("week");
const goalsCard = document.getElementById("goals");
const maxDayCard = document.getElementById("max-day");
const quizCard = document.getElementById("quiz");
const trackerSection = document.getElementById("tracker");
const restTimerCard = document.getElementById("rest-timer");
const workoutCard = document.getElementById("workout");
const setupButton = document.getElementById("open-setup");
const exportButton = document.getElementById("export-data");
const importButton = document.getElementById("import-data");
const importFile = document.getElementById("import-file");
const backupMessage = document.getElementById("backup-message");
const importConfirm = document.getElementById("import-confirm");
const importConfirmText = document.getElementById("import-confirm-text");
let pendingImport = null;

let allSets = [];
let profile = null;
let program = [];
let startWeightsByExercise = {};
let selectedDayIndex = 0;
let shownTutorialName = null;
let swaps = {};
let savedSwaps = {};
let goals = {};
let editingGoal = null;
// The exercise whose goal is on show; the card shows one at a time.
let shownGoalExercise = null;
let maxes = [];
let maxDrafts = {};
let maxResults = {};
let skips = [];
let skipNotice = null;
let recoveryDates = [];
let recoveryChecks = [];
let openAlternateKey = null;

function showStorageError(error) {
  storageError.textContent = error.message;
  storageError.hidden = false;
}

function showBackupMessage(text, isError) {
  backupMessage.textContent = text;
  backupMessage.classList.toggle("error", isError);
}

// Saves everything the app has stored in this browser as a file in the downloads folder.
function exportData() {
  try {
    const backup = buildBackup(localStorage, new Date().toISOString());
    if (Object.keys(backup.data).length === 0) {
      showBackupMessage("There is nothing to export yet. Log a set first.", true);
      return;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName(todayString());
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showBackupMessage("Backup saved to your downloads. Keep the file somewhere safe.", false);
  } catch {
    showBackupMessage("Could not make a backup. Your browser may be blocking storage.", true);
  }
}

// Reads a chosen backup file and, if it is a good one, asks on the page before replacing anything.
// (A pop-up question would be silently refused by some browsers, which looked like "No".)
async function importData(file) {
  try {
    const result = parseBackup(await file.text());
    if (!result.ok) {
      showBackupMessage(result.message, true);
      return;
    }
    const madeOn = result.exportedAt === null ? "" : ` made on ${result.exportedAt.slice(0, 10)}`;
    pendingImport = result.data;
    importConfirmText.textContent = `Replace everything saved on this device with the backup${madeOn}? Your current sets, goals, and setup will be overwritten.`;
    importConfirm.hidden = false;
    showBackupMessage("", false);
  } catch {
    showBackupMessage("Could not load that file. Check that it is a LiftCoach backup.", true);
  }
}

function cancelImport() {
  pendingImport = null;
  importConfirm.hidden = true;
  showBackupMessage("Import cancelled. Nothing was changed.", false);
}

function confirmImport() {
  const data = pendingImport;
  pendingImport = null;
  importConfirm.hidden = true;
  try {
    applyBackup(localStorage, data);
    sessionStorage.setItem(BACKUP_LOADED_KEY, "1");
    location.reload();
  } catch {
    showBackupMessage("Could not save the backup on this device. Your browser may be blocking storage.", true);
  }
}

// The page reloads after an import, so the confirmation is passed along through the session.
function showBackupLoadedNotice() {
  try {
    if (sessionStorage.getItem(BACKUP_LOADED_KEY) === "1") {
      sessionStorage.removeItem(BACKUP_LOADED_KEY);
      showBackupMessage("Backup loaded. Your sets, goals, and setup are back.", false);
    }
  } catch {
    // Without session storage the page just does not show the notice.
  }
}

function currentExercise() {
  return exerciseInput.value.trim();
}

function setsFor(exercise) {
  const wanted = exercise.toLowerCase();
  return allSets.filter((set) => set.exercise.toLowerCase() === wanted);
}

function showMessage(text, isError) {
  formMessage.textContent = text;
  formMessage.classList.toggle("error", isError);
}

function coachLine(className, text) {
  const line = document.createElement("p");
  line.className = className;
  line.textContent = text;
  return line;
}

function startingAdvice(exercise) {
  const start = startWeightsByExercise[exercise.toLowerCase()];
  if (start === undefined) {
    return null;
  }
  const [minReps] = repRangeFor(exercise);
  const reason = start.basedOn === null
    ? `From your setup: your estimated 8-rep weight is ${start.weight} lb.`
    : `Estimated from your ${start.basedOn}. Adjust it if it feels off.`;
  return { suggestion: { weight: start.weight, reps: minReps, reason }, label: "Starting target" };
}

// The coach learns from the most recent session. If that session is today, the
// suggestion is for next time; otherwise it is today's target. With no history,
// it falls back to the starting weight from the setup quiz.
function coachAdvice(exercise) {
  const sets = setsFor(exercise);
  if (sets.length === 0) {
    return startingAdvice(exercise);
  }
  const latestDate = sets.reduce((latest, set) => (set.date > latest ? set.date : latest), "");
  const latestSets = sets.filter((set) => set.date === latestDate);
  const suggestion = suggestNext(exercise, latestSets, profile?.experience);
  return { suggestion, label: latestDate === todayString() ? "Next time" : "Today's target" };
}

function lastTimeFor(exercise) {
  const session = lastSession(allSets, exercise, todayString());
  return session === null ? null : lastTimeText(session);
}

function renderCoach() {
  const exercise = currentExercise();
  coachCard.replaceChildren();

  if (exercise === "") {
    coachCard.append(
      coachLine("coach-label", "Coach"),
      coachLine("coach-reason", "Pick an exercise and I'll tell you what to lift."),
    );
    return;
  }

  const advice = coachAdvice(exercise);
  if (advice === null) {
    coachCard.append(
      coachLine("coach-label", "Coach"),
      coachLine("coach-reason", `No history for ${exercise} yet. Log a set or two and I'll suggest your next weight.`),
    );
    return;
  }

  const { suggestion, label } = advice;
  coachCard.append(
    coachLine("coach-label", `Coach · ${label}`),
    coachLine("coach-target", `${suggestion.weight} lb × ${suggestion.reps}+ reps`),
    coachLine("coach-reason", suggestion.reason),
    coachLine("coach-reason coach-extra", `Rep range ${repRangeFor(exercise).join(" to ")} · Rest ${restFor(exercise)}`),
    coachLine("coach-reason coach-extra", tempoFor(exercise)),
  );
  const lastTime = lastTimeFor(exercise);
  if (lastTime !== null) {
    coachCard.append(coachLine("coach-reason coach-extra", lastTime));
  }
}

function renderTodaySets() {
  const exercise = currentExercise();
  todaySetsList.replaceChildren();

  const today = todayString();
  const todays = exercise === "" ? [] : setsFor(exercise).filter((set) => set.date === today);

  if (todays.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = exercise === "" ? "Pick an exercise to see today's sets." : "No sets logged yet today.";
    todaySetsList.append(empty);
    return;
  }

  todays.forEach((set, index) => {
    const item = document.createElement("li");
    item.className = "set-item";

    const summary = document.createElement("span");
    summary.textContent = `${set.weight} lb × ${set.reps}`;
    const number = document.createElement("small");
    number.textContent = `Set ${index + 1}`;
    summary.append(number);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn-delete";
    deleteButton.textContent = "Undo";
    deleteButton.setAttribute("aria-label", `Delete set ${index + 1}: ${set.weight} lb × ${set.reps}`);
    deleteButton.addEventListener("click", () => deleteSet(set.id));

    item.append(summary, deleteButton);
    todaySetsList.append(item);
  });
}

function targetText(exercise, setCount) {
  const advice = coachAdvice(exercise);
  if (advice === null) {
    return `${setCount} sets · pick a light weight`;
  }
  return `${setCount} sets · ${advice.suggestion.weight} lb × ${advice.suggestion.reps}+`;
}

function chooseExercise(exercise) {
  exerciseInput.value = exercise;
  showMessage("", false);
  prefillFromCoach();
  render();
  weightInput.focus();
}

function swapKey(originalName) {
  return `${selectedDayIndex}:${originalName}`;
}

function stateFor(originalName) {
  return swapState(originalName, swaps[swapKey(originalName)], savedSwaps[originalName]);
}

function persistSwaps(nextSwaps, nextSavedSwaps) {
  try {
    saveSwaps(todayString(), nextSwaps);
    saveSavedSwaps(nextSavedSwaps);
    storageError.hidden = true;
  } catch (error) {
    showStorageError(error);
  }
  swaps = nextSwaps;
  savedSwaps = nextSavedSwaps;
}

// A swap is saved under a key (the day and exercise, or a stretch) and applies to this day only.
function setTodaySwap(key, originalName, choice) {
  const nextSwaps = { ...swaps };
  if (choice === (savedSwaps[originalName] ?? originalName)) {
    delete nextSwaps[key];
  } else {
    nextSwaps[key] = choice;
  }
  persistSwaps(nextSwaps, savedSwaps);
  openAlternateKey = null;
}

// "Always use this" makes the shown choice the original's replacement from now on.
function setSavedSwap(key, originalName, choice) {
  const nextSavedSwaps = { ...savedSwaps };
  if (choice === originalName) {
    delete nextSavedSwaps[originalName];
  } else {
    nextSavedSwaps[originalName] = choice;
  }
  const nextSwaps = { ...swaps };
  delete nextSwaps[key];
  persistSwaps(nextSwaps, nextSavedSwaps);
  openAlternateKey = null;
}

// Picking from the dropdown swaps for this workout only.
function swapExercise(originalName, choice) {
  setTodaySwap(swapKey(originalName), originalName, choice);
  chooseExercise(choice);
}

function saveSwap(originalName, choice) {
  setSavedSwap(swapKey(originalName), originalName, choice);
  showMessage(`${choice} is now your exercise in this spot.`, false);
  renderWorkout();
  renderGoals();
}

function stretchKey(originalName) {
  return `stretch:${originalName}`;
}

function stretchStateFor(originalName) {
  return swapState(originalName, swaps[stretchKey(originalName)], savedSwaps[originalName]);
}

// One "Alternate ..." button with its note, "Always use" button, and dropdown. The same row serves
// exercises and stretches; config says what to call it and what happens when a choice is made.
function renderAlternatePicker({ key, originalName, state, buttonLabel, alternates, onPick, onKeep }) {
  const row = document.createElement("div");
  row.className = "alternate-row";

  if (state.note !== null) {
    row.append(coachLine("alternate-note", state.note));
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "btn-alternate";
  toggle.textContent = buttonLabel;
  toggle.setAttribute("aria-expanded", String(openAlternateKey === key));
  toggle.addEventListener("click", () => {
    openAlternateKey = openAlternateKey === key ? null : key;
    renderWorkout();
  });
  row.append(toggle);

  if (state.canSave) {
    const keep = document.createElement("button");
    keep.type = "button";
    keep.className = "btn-alternate";
    keep.textContent = `Always use ${state.shown}`;
    keep.addEventListener("click", () => onKeep(state.shown));
    row.append(keep);
  }

  if (openAlternateKey === key) {
    const picker = document.createElement("select");
    picker.className = "alternate-select";
    picker.setAttribute("aria-label", `Alternate for ${originalName}`);
    picker.append(new Option(`${originalName} (original)`, originalName, false, state.shown === originalName));
    for (const alternate of alternates) {
      picker.append(new Option(alternate, alternate, false, alternate === state.shown));
    }
    picker.addEventListener("change", () => onPick(picker.value));
    row.append(picker);
  }
  return row;
}

function renderGeneralWarmup(exerciseNames, wasOpen) {
  const details = document.createElement("details");
  details.className = "day-warmup";
  details.open = wasOpen;
  const summary = document.createElement("summary");
  summary.textContent = "Warm up first (about 5 minutes)";
  details.append(summary, listItems(generalWarmup(exerciseNames)));
  return details;
}

function renderWorkout() {
  const warmupWasOpen = workoutCard.querySelector(".day-warmup")?.open ?? false;
  workoutCard.replaceChildren();
  workoutCard.hidden = program.length === 0;
  if (program.length === 0) {
    return;
  }

  const select = document.createElement("select");
  select.className = "day-select";
  select.setAttribute("aria-label", "Workout day");
  program.forEach((day, index) => {
    select.append(new Option(`Day ${index + 1}: ${day.name}`, String(index), false, index === selectedDayIndex));
  });
  select.addEventListener("change", () => {
    selectedDayIndex = Number(select.value);
    renderWorkout();
    renderMaxDay();
    renderGoals();
  });

  const heading = document.createElement("h2");
  heading.textContent = "Today's workout";
  const head = document.createElement("div");
  head.className = "workout-head";
  head.append(heading, select);

  if (program[selectedDayIndex].recovery) {
    workoutCard.append(head, renderSkipRow(), renderRecovery());
    return;
  }

  const list = document.createElement("ul");
  list.className = "workout-list";
  const active = currentExercise().toLowerCase();
  const shownNames = [];
  for (const { name: originalName, sets } of program[selectedDayIndex].exercises) {
    const state = stateFor(originalName);
    const name = state.shown;
    shownNames.push(name);
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "workout-item";
    button.classList.toggle("active", name.toLowerCase() === active);
    const label = document.createElement("span");
    label.className = "workout-name";
    label.textContent = name;
    const target = document.createElement("span");
    target.className = "workout-target";
    target.textContent = targetText(name, sets);
    button.append(label, target);
    button.addEventListener("click", () => chooseExercise(name));
    item.append(button);
    const lastTime = lastTimeFor(name);
    if (lastTime !== null) {
      item.append(coachLine("last-time", lastTime));
    }
    if (alternatesFor(originalName).length > 0) {
      item.append(renderAlternatePicker({
        key: swapKey(originalName),
        originalName,
        state,
        buttonLabel: "Alternate exercise",
        alternates: alternatesFor(originalName),
        onPick: (choice) => swapExercise(originalName, choice),
        onKeep: (choice) => saveSwap(originalName, choice),
      }));
    }
    list.append(item);
  }
  workoutCard.append(head, renderSkipRow(), renderGeneralWarmup(shownNames, warmupWasOpen), list);
}

function toggleRecoveryCheck(id) {
  const next = recoveryChecks.includes(id) ? recoveryChecks.filter((done) => done !== id) : [...recoveryChecks, id];
  try {
    saveRecoveryChecks(todayString(), next);
    storageError.hidden = true;
  } catch (error) {
    showStorageError(error);
  }
  recoveryChecks = next;
  renderWorkout();
}

// The off-day card: what your last workout hit, a checklist for the day, and a stretch for each sore muscle.
function renderRecovery() {
  const last = previousWorkout(program, selectedDayIndex);
  const next = nextWorkout(program, selectedDayIndex);
  const { worked, fresh } = muscleRecovery(last);

  const card = document.createElement("div");
  card.className = "recovery";
  const intro = coachLine("recovery-intro", "No lifting today. Your muscles rebuild on days like this, so this is where the progress happens.");
  const order = coachLine("last-time", `Last workout: ${last?.name ?? "none yet"}. Next workout: ${next?.name ?? "none"}.`);

  const chips = document.createElement("ul");
  chips.className = "recovery-chips";
  for (const [muscles, className, label] of [[worked, "chip-rest", "Rest"], [fresh, "chip-fresh", "Fresh"]]) {
    for (const muscle of muscles) {
      const chip = document.createElement("li");
      chip.className = className;
      chip.textContent = `${muscle}: ${label.toLowerCase()}`;
      chips.append(chip);
    }
  }

  const checklist = document.createElement("ul");
  checklist.className = "recovery-checklist";
  for (const { id, text } of RECOVERY_CHECKLIST) {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = recoveryChecks.includes(id);
    box.addEventListener("change", () => toggleRecoveryCheck(id));
    label.append(box, ` ${text}`);
    item.append(label);
    checklist.append(item);
  }

  const stretches = document.createElement("ul");
  stretches.className = "tutorial-list";
  for (const { muscle, name: originalName } of stretchesFor(worked)) {
    const state = stretchStateFor(originalName);
    const { name, how } = stretchNamed(state.shown);
    const item = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = `${name} (${muscle})`;
    item.append(title, ` ${how}`);
    item.append(renderAlternatePicker({
      key: stretchKey(originalName),
      originalName,
      state,
      buttonLabel: "Alternate stretch",
      alternates: alternateStretchesFor(originalName),
      onPick: (choice) => {
        setTodaySwap(stretchKey(originalName), originalName, choice);
        renderWorkout();
      },
      onKeep: (choice) => {
        setSavedSwap(stretchKey(originalName), originalName, choice);
        renderWorkout();
      },
    }));
    stretches.append(item);
  }

  card.append(intro, order, tutorialHeading("Muscles"), chips, tutorialHeading("Today's checklist"), checklist);
  if (worked.length > 0) {
    card.append(tutorialHeading("Stretches for the muscles you worked"), stretches);
  }
  return card;
}

function listItems(items) {
  const list = document.createElement("ul");
  list.className = "tutorial-list";
  for (const text of items) {
    const item = document.createElement("li");
    item.textContent = text;
    list.append(item);
  }
  return list;
}

function tutorialHeading(text) {
  const heading = document.createElement("h3");
  heading.textContent = text;
  return heading;
}

// Only rebuilt when the exercise changes, so an open walkthrough stays open while you log sets.
function renderTutorial() {
  const tutorial = currentExercise() === "" ? null : tutorialFor(currentExercise());
  const name = tutorial === null ? null : tutorial.name;
  if (name === shownTutorialName) {
    return;
  }
  shownTutorialName = name;
  tutorialCard.open = false;
  tutorialCard.replaceChildren();
  tutorialCard.hidden = tutorial === null;
  if (tutorial === null) {
    return;
  }

  const summary = document.createElement("summary");
  summary.textContent = `How to do ${tutorial.name}`;

  const video = document.createElement("a");
  video.href = tutorial.videoUrl;
  video.target = "_blank";
  video.rel = "noopener noreferrer";
  video.className = "tutorial-video";
  video.textContent = "Watch videos (opens YouTube)";

  const bodyMap = renderBodyMap(tutorial.name);

  tutorialCard.append(
    summary,
    ...(bodyMap === null ? [] : [tutorialHeading("Muscles worked"), bodyMap]),
    tutorialHeading("Step by step"),
    listItems(tutorial.steps),
    tutorialHeading("Common mistakes"),
    listItems(tutorial.mistakes),
    video,
  );
}

function renderWarmup() {
  const advice = currentExercise() === "" ? null : coachAdvice(currentExercise());
  const sets = advice === null ? [] : warmupSets(currentExercise(), advice.suggestion.weight);
  warmupCard.replaceChildren();
  warmupCard.hidden = sets.length === 0;
  if (sets.length === 0) {
    return;
  }

  const heading = document.createElement("h2");
  heading.textContent = "Warm up first";
  const list = document.createElement("ol");
  list.className = "set-list";
  for (const { weight, reps } of sets) {
    const item = document.createElement("li");
    item.className = "set-item";
    item.textContent = `${weight} lb × ${reps}`;
    list.append(item);
  }
  const note = document.createElement("p");
  note.className = "empty";
  note.textContent = `Easy sets, then your working sets at ${advice.suggestion.weight} lb. Don't log these.`;
  warmupCard.append(heading, list, note);
}

const MIN_WEEKLY_SETS = 10;
const MAX_WEEKLY_SETS = 20;

function renderWeek() {
  weekCard.replaceChildren();
  weekCard.hidden = program.length === 0;
  if (program.length === 0) {
    return;
  }

  const summary = document.createElement("summary");
  summary.textContent = "Your week at a glance";

  const days = document.createElement("ul");
  days.className = "tutorial-list";
  program.forEach((day, index) => {
    const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    const item = document.createElement("li");
    item.textContent = day.recovery ? `Day ${index + 1}, Recovery: stretching, walking, food, and sleep` : `Day ${index + 1}, ${day.name}: ${day.exercises.length} exercises, ${totalSets} sets`;
    days.append(item);
  });

  const totals = weeklyMuscleSets(program);
  const bars = document.createElement("ul");
  bars.className = "muscle-bars";
  for (const muscle of MUSCLES.filter((name) => totals[name] !== undefined)) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = muscle;
    const track = document.createElement("span");
    track.className = "muscle-track";
    const fill = document.createElement("span");
    fill.className = "muscle-fill";
    fill.style.width = `${Math.min(100, (totals[muscle] / MAX_WEEKLY_SETS) * 100)}%`;
    track.append(fill);
    const count = document.createElement("span");
    count.textContent = `${totals[muscle]} sets`;
    item.append(label, track, count);
    bars.append(item);
  }

  const note = document.createElement("p");
  note.className = "empty";
  note.textContent = `A common guideline is ${MIN_WEEKLY_SETS} to ${MAX_WEEKLY_SETS} sets per muscle per week. Each exercise counts toward the main muscles it trains. Fewer days or a shorter session means fewer sets.`;

  weekCard.append(summary, tutorialHeading("Days"), days, tutorialHeading("Weekly sets per muscle"), bars, note);
}

function setGoal(exercise, weight) {
  const nextGoals = { ...goals };
  if (weight === null) {
    delete nextGoals[exercise.toLowerCase()];
  } else {
    nextGoals[exercise.toLowerCase()] = weight;
  }
  try {
    saveGoals(nextGoals);
    storageError.hidden = true;
  } catch (error) {
    showStorageError(error);
  }
  goals = nextGoals;
  editingGoal = null;
  renderGoals();
}

function renderGoalEditor(row) {
  const form = document.createElement("form");
  form.className = "goal-editor";
  form.noValidate = true;
  const label = document.createElement("label");
  label.className = "field-label";
  label.textContent = `Goal weight for ${row.exercise} (lb)`;
  const input = document.createElement("input");
  input.className = "text-input";
  input.type = "text";
  input.inputMode = "decimal";
  input.autocomplete = "off";
  input.value = row.goal;
  label.htmlFor = "goal-input";
  input.id = "goal-input";
  const message = document.createElement("p");
  message.className = "form-message error";
  message.setAttribute("aria-live", "polite");

  const save = document.createElement("button");
  save.type = "submit";
  save.className = "btn-primary";
  save.textContent = "Save goal";
  const actions = document.createElement("div");
  actions.className = "goal-actions";
  actions.append(save);
  if (row.isCustom) {
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "btn-link";
    reset.textContent = "Use the suggested goal";
    reset.addEventListener("click", () => setGoal(row.exercise, null));
    actions.append(reset);
  }
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn-link";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => {
    editingGoal = null;
    renderGoals();
  });
  actions.append(cancel);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const weight = parseNumber(input.value);
    if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_WEIGHT) {
      message.textContent = `Enter a weight between 1 and ${MAX_WEIGHT} lb.`;
      input.focus();
      return;
    }
    setGoal(row.exercise, weight);
  });

  form.append(label, input, message, actions);
  return form;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const CHART = { width: 300, height: 120, left: 12, right: 12, top: 22, bottom: 22 };

function svgElement(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

// A line of the top weight from each session, with a dashed line at the goal. Returns the elements to show.
function renderGoalChart(row) {
  const history = weightHistory(row.exercise, allSets);
  if (history.length === 0) {
    return [coachLine("goal-status", `Your line starts when you log ${row.exercise}. Starting point: ${row.baseline} lb.`)];
  }

  const { points, goalY, goalFar } = chartPoints(history, row.goal);
  const plotWidth = CHART.width - CHART.left - CHART.right;
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  const at = ({ x, y }) => [CHART.left + x * plotWidth, CHART.top + y * plotHeight];
  const last = points[points.length - 1];
  const [lastX, lastY] = at(last);
  const goalLineY = CHART.top + goalY * plotHeight;

  const svg = svgElement("svg", { viewBox: `0 0 ${CHART.width} ${CHART.height}`, class: "goal-chart", role: "img" });
  const first = history[0];
  svg.setAttribute("aria-label", `${row.exercise}: ${first.weight} lb on ${first.date}, ${last.weight} lb on ${last.date}, goal ${row.goal} lb`);
  svg.append(svgElement("line", { x1: CHART.left, x2: CHART.width - CHART.right, y1: goalLineY, y2: goalLineY, class: "chart-goal-line" }));
  const goalLabel = svgElement("text", { x: CHART.left, y: Math.max(11, goalLineY - 5), class: "chart-label chart-goal-label" });
  goalLabel.textContent = `Goal ${row.goal} lb${goalFar ? " ↑" : ""}`;
  svg.append(goalLabel);
  if (points.length > 1) {
    svg.append(svgElement("polyline", { points: points.map((point) => at(point).join(",")).join(" "), class: "chart-line" }));
  }
  for (const point of points) {
    svg.append(svgElement("circle", { cx: at(point)[0], cy: at(point)[1], r: 3.5, class: "chart-dot" }));
  }
  const nowLabel = svgElement("text", { x: lastX, y: lastY + 16, class: "chart-label", "text-anchor": points.length > 1 ? "end" : "middle" });
  nowLabel.textContent = `${last.weight} lb`;
  svg.append(nowLabel);
  const startDate = svgElement("text", { x: CHART.left, y: CHART.height - 4, class: "chart-label" });
  startDate.textContent = first.date;
  svg.append(startDate);
  if (points.length > 1) {
    const endDate = svgElement("text", { x: CHART.width - CHART.right, y: CHART.height - 4, class: "chart-label", "text-anchor": "end" });
    endDate.textContent = last.date;
    svg.append(endDate);
  }
  if (points.length === 1) {
    return [svg, coachLine("goal-status", `One session so far. Log ${row.exercise} on another day to draw your line.`)];
  }
  return [svg];
}

// The previous / name and position / next buttons that move between exercises.
function renderGoalNav(rows, index) {
  const nav = document.createElement("div");
  nav.className = "goal-nav";
  const step = (offset) => {
    shownGoalExercise = rows[(index + offset + rows.length) % rows.length].exercise;
    editingGoal = null;
    renderGoals();
  };
  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "btn-secondary goal-step";
  previous.textContent = "\u2039";
  previous.setAttribute("aria-label", "Previous exercise");
  previous.addEventListener("click", () => step(-1));
  const next = document.createElement("button");
  next.type = "button";
  next.className = "btn-secondary goal-step";
  next.textContent = "\u203a";
  next.setAttribute("aria-label", "Next exercise");
  next.addEventListener("click", () => step(1));
  const title = document.createElement("div");
  title.className = "goal-title";
  const name = document.createElement("strong");
  name.textContent = rows[index].exercise;
  const position = document.createElement("span");
  position.textContent = `${index + 1} of ${rows.length}`;
  title.append(name, position);
  nav.append(previous, title, next);
  return nav;
}

// The chart, status line and Change goal button for the one exercise on show.
function renderGoalRow(row) {
  const status = row.reached
    ? `Goal reached: ${row.current} lb. Set a new one!`
    : `Now ${row.current} lb \u00b7 Goal ${row.goal} lb${row.isCustom ? "" : " (suggested)"} \u00b7 ${row.percent}%`;
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "btn-link";
  edit.textContent = row.reached ? "Set a new goal" : "Change goal";
  edit.addEventListener("click", () => {
    editingGoal = row.exercise;
    renderGoals();
    document.getElementById("goal-input")?.focus();
  });

  const body = document.createElement("div");
  body.append(...renderGoalChart(row), coachLine(row.reached ? "goal-status goal-reached" : "goal-status", status), edit);
  if (editingGoal === row.exercise) {
    body.append(renderGoalEditor(row));
  }
  return body;
}

function renderGoals() {
  goalsCard.replaceChildren();
  goalsCard.hidden = program.length === 0;
  if (program.length === 0) {
    return;
  }

  const heading = document.createElement("h2");
  heading.textContent = "Your goals";
  const intro = document.createElement("p");
  intro.className = "empty";
  intro.textContent = "Suggested goals are four weight jumps above where you started. Tap Change goal to set your own.";

  const startEstimates = Object.fromEntries(
    Object.entries(startWeightsByExercise).map(([exercise, start]) => [exercise, start.weight]),
  );
  const rows = goalRows([...new Set(shownDayExercises())], allSets, goals, startEstimates, profile?.experience);
  goalsCard.append(heading, intro);

  const withGoals = rows.filter((row) => row.goal !== null);
  if (withGoals.length === 0) {
    const message = program[selectedDayIndex].recovery
      ? "No lifting on a recovery day, so there are no goals to show. Pick a workout day above to see its goals."
      : "Log a set of one of today's lifts to get its goal.";
    goalsCard.append(coachLine("empty", message));
    return;
  }
  const index = Math.max(0, withGoals.findIndex((row) => row.exercise === shownGoalExercise));
  goalsCard.append(renderGoalNav(withGoals, index), renderGoalRow(withGoals[index]));

  const waiting = rows.length - withGoals.length;
  if (waiting > 0) {
    goalsCard.append(coachLine("empty goal-waiting", `${waiting} more of today's lifts will show up here once you log a set of them.`));
  }
}

// The exercises shown for the selected workout day, with swaps applied (none on a recovery day).
function shownDayExercises() {
  return program[selectedDayIndex].exercises.map(({ name }) => stateFor(name).shown);
}

function saveMax(exercise, weight) {
  const last = latestMax(exercise, maxes);
  const nextMaxes = withNewMax(maxes, exercise, weight, todayString());
  try {
    saveMaxes(nextMaxes);
    storageError.hidden = true;
  } catch (error) {
    showStorageError(error);
    return;
  }
  maxes = nextMaxes;
  const change = last === null ? "" : weight === last.weight ? " (same as last time)" : ` (${weight > last.weight ? "+" : ""}${weight - last.weight} lb from ${last.weight})`;
  maxResults[exercise.toLowerCase()] = `Saved: your ${exercise} max is ${weight} lb${change}.`;
  delete maxDrafts[exercise.toLowerCase()];
  renderMaxDay();
}

function renderMaxRow(exercise) {
  const key = exercise.toLowerCase();
  const item = document.createElement("li");
  item.className = "goal-row";
  item.append(Object.assign(document.createElement("strong"), { textContent: exercise }));

  const last = latestMax(exercise, maxes);
  const reference = last?.weight ?? estimatedMax(exercise, allSets);
  const lastText = last === null
    ? "No max recorded yet. Today sets your starting point."
    : last.date === todayString()
      ? `Today's max: ${last.weight} lb. Enter a new weight to correct it.`
      : `Last max: ${last.weight} lb on ${last.date}. Try to beat it.`;
  item.append(coachLine("goal-status", lastText));

  const ramp = maxRampSets(reference);
  if (ramp.length > 0) {
    const basis = last === null ? "your best logged set" : "your last max";
    item.append(coachLine("goal-status", `Work up from ${basis}: ${ramp.map(({ weight, reps }) => `${weight} × ${reps}`).join(", ")}. Then go for a new single.`));
  } else {
    item.append(coachLine("goal-status", "Work up in small jumps with a few easy sets, then go for one heavy rep."));
  }

  const form = document.createElement("form");
  form.className = "goal-editor";
  form.noValidate = true;
  const label = document.createElement("label");
  label.className = "field-label";
  label.textContent = `Your ${exercise} max today (lb, 1 rep)`;
  const input = document.createElement("input");
  input.className = "text-input";
  input.type = "text";
  input.inputMode = "decimal";
  input.autocomplete = "off";
  input.id = `max-input-${key.replace(/\s+/g, "-")}`;
  label.htmlFor = input.id;
  input.value = maxDrafts[key] ?? "";
  input.addEventListener("input", () => {
    maxDrafts[key] = input.value;
  });
  const message = document.createElement("p");
  message.className = "form-message";
  message.setAttribute("aria-live", "polite");
  message.textContent = maxResults[key] ?? "";
  const save = document.createElement("button");
  save.type = "submit";
  save.className = "btn-primary";
  save.textContent = "Save max";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const weight = parseNumber(input.value);
    if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_WEIGHT) {
      message.textContent = `Enter a weight between 1 and ${MAX_WEIGHT} lb.`;
      message.classList.add("error");
      input.focus();
      return;
    }
    saveMax(exercise, weight);
  });

  form.append(label, input, message, save);
  item.append(form);
  return item;
}

// Shows a max card for each core lift on the selected day that is due (or was just maxed today).
function renderMaxDay() {
  maxDayCard.replaceChildren();
  const today = todayString();
  const lifts = program.length === 0
    ? []
    : shownDayExercises().filter((name) => isMaxLift(name) && (maxIsDue(name, maxes, today) || maxResults[name.toLowerCase()] !== undefined));
  maxDayCard.hidden = lifts.length === 0;
  if (lifts.length === 0) {
    return;
  }

  const heading = document.createElement("h2");
  heading.textContent = "Max day";
  const intro = document.createElement("p");
  intro.className = "empty";
  intro.textContent = `Once a month, test a heavy single on ${MAX_LIFTS.join(", ")} to see your real progress. Warm up well, use a spotter or safety pins, and stop if your form breaks down.`;
  const list = document.createElement("ul");
  list.className = "goal-list";
  list.append(...lifts.map(renderMaxRow));
  maxDayCard.append(heading, intro, list);
}

function render() {
  renderWorkout();
  renderMaxDay();
  renderGoals();
  renderWarmup();
  renderTutorial();
  renderCoach();
  renderTodaySets();
}

// Prefill the fields with the coach's target so the common case is one tap.
function prefillFromCoach() {
  const advice = coachAdvice(currentExercise());
  if (advice === null) {
    return;
  }
  weightInput.value = advice.suggestion.weight;
  repsInput.value = advice.suggestion.reps;
}

function parseNumber(text) {
  const trimmed = text.trim();
  return trimmed === "" ? NaN : Number(trimmed);
}

function persist(nextSets) {
  try {
    saveSets(nextSets);
    storageError.hidden = true;
    allSets = nextSets;
    return true;
  } catch (error) {
    showStorageError(error);
    return false;
  }
}

function deleteSet(id) {
  if (persist(allSets.filter((set) => set.id !== id))) {
    showMessage("Set removed.", false);
    render();
  }
}

function handleSubmit(event) {
  event.preventDefault();
  const exercise = currentExercise();
  const weight = parseNumber(weightInput.value);
  const reps = parseNumber(repsInput.value);

  if (exercise === "") {
    showMessage("Pick an exercise first.", true);
    exerciseInput.focus();
    return;
  }
  if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_WEIGHT) {
    showMessage(`Enter a weight between 1 and ${MAX_WEIGHT} lb.`, true);
    weightInput.focus();
    return;
  }
  if (!Number.isInteger(reps) || reps < 1 || reps > MAX_REPS_PER_SET) {
    showMessage(`Enter reps as a whole number from 1 to ${MAX_REPS_PER_SET}.`, true);
    repsInput.focus();
    return;
  }

  const newSet = { id: newSetId(), exercise, weight, reps, date: todayString() };
  if (persist([...allSets, newSet])) {
    skipNotice = null;
    showMessage(`Logged ${weight} lb × ${reps}.`, false);
    render();
    startRestTimer(exercise);
  }
}

// The rest countdown that starts after each logged set. It is not saved: a reload clears it.
// The card is built once and only its text changes each tick, so taps on its buttons are not lost.
const REST_TICK_MS = 250;
let restTimer = null;
const restLabel = document.createElement("p");
const restClock = document.createElement("p");
restLabel.className = "rest-label";
restClock.className = "rest-clock";

function startRestTimer(exercise) {
  clearInterval(restTimer?.interval);
  restTimer = { exercise, end: restEnd(exercise, Date.now()), buzzed: false, interval: setInterval(drawRestTimer, REST_TICK_MS) };
  restLabel.textContent = `Rest · ${exercise}`;
  restTimerCard.hidden = false;
  drawRestTimer();
}

function stopRestTimer() {
  clearInterval(restTimer?.interval);
  restTimer = null;
  restTimerCard.hidden = true;
}

function drawRestTimer() {
  const left = secondsLeft(restTimer.end, Date.now());
  const done = left === 0;
  if (done && !restTimer.buzzed) {
    restTimer.buzzed = true;
    navigator.vibrate?.(300);
  }
  restClock.textContent = done ? "Rest over, ready for your next set" : formatClock(left);
  restTimerCard.classList.toggle("rest-done", done);
}

function buildRestTimerCard() {
  const more = document.createElement("button");
  more.type = "button";
  more.className = "btn-secondary";
  more.textContent = "+30 sec";
  more.addEventListener("click", () => {
    restTimer.end = extendedEnd(restTimer.end, Date.now());
    restTimer.buzzed = false;
    drawRestTimer();
  });

  const skip = document.createElement("button");
  skip.type = "button";
  skip.className = "btn-secondary";
  skip.textContent = "Skip";
  skip.addEventListener("click", stopRestTimer);

  const buttons = document.createElement("div");
  buttons.className = "rest-buttons";
  buttons.append(more, skip);
  restTimerCard.append(restLabel, restClock, buttons);
}

// The day the program is on: one step per day trained, skipped, or spent on recovery since setup.
function rotationIndex() {
  const skippedDates = skips.map((skip) => skip.date);
  const trainingDates = [...allSets.map((set) => set.date), ...recoveryStepDates(recoveryDates, skippedDates)];
  return suggestedDayIndex(program.length, trainingDates, profile.setupDate, todayString(), skippedDates);
}

// The day to open on: the one a skip moved to today, or else the rotation's day.
function openingDayIndex() {
  return startDayIndex(skips, todayString(), rotationIndex());
}

function persistSkips(nextSkips) {
  try {
    saveSkips(nextSkips);
    storageError.hidden = true;
  } catch (error) {
    showStorageError(error);
  }
  skips = nextSkips;
}

// Dropping a day moves the rotation on to the next one; the skipped workout does not come back.
function skipToday() {
  const from = selectedDayIndex;
  const skippedName = program[from].name;
  const next = (from + 1) % program.length;
  persistSkips([...skips, { date: todayString(), from, next }]);
  selectedDayIndex = next;
  skipNotice = `Skipped ${skippedName}. Next up: ${program[selectedDayIndex].name}.`;
  render();
}

function undoSkip() {
  const lastIndex = skips.map((skip) => skip.date).lastIndexOf(todayString());
  const undone = skips[lastIndex];
  persistSkips(skips.filter((_, index) => index !== lastIndex));
  selectedDayIndex = Number.isInteger(undone.from) ? undone.from : openingDayIndex();
  skipNotice = null;
  render();
}

function renderSkipRow() {
  const row = document.createElement("div");
  row.className = "alternate-row";
  const trainedToday = allSets.some((set) => set.date === todayString());

  if (skipNotice !== null) {
    row.append(coachLine("alternate-note", skipNotice));
    const undo = document.createElement("button");
    undo.type = "button";
    undo.className = "btn-alternate";
    undo.textContent = "Undo skip";
    undo.addEventListener("click", undoSkip);
    row.append(undo);
  }
  if (!trainedToday) {
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "btn-alternate";
    skip.textContent = "Skip this day";
    skip.addEventListener("click", skipToday);
    row.append(skip);
  }
  return row;
}

// Opening the app on a recovery day uses that day up, so tomorrow the rotation moves on.
function rememberRecoveryDay() {
  const today = todayString();
  if (!program[rotationIndex()].recovery || recoveryDates.includes(today)) {
    return;
  }
  const next = [...recoveryDates, today];
  try {
    saveRecoveryDates(next);
  } catch (error) {
    showStorageError(error);
  }
  recoveryDates = next;
}

function applyProfile() {
  if (profile !== null && !profile.skipped) {
    profile = withDefaults(profile);
  }
  const hasProgram = profile !== null && !profile.skipped;
  program = hasProgram ? withRecoveryDays(buildProgram(profile)) : [];
  startWeightsByExercise = {};
  if (hasProgram) {
    for (const [exercise, start] of Object.entries(startingWeights(profile))) {
      startWeightsByExercise[exercise.toLowerCase()] = start;
    }
    selectedDayIndex = openingDayIndex();
    rememberRecoveryDay();
  }
  setupButton.textContent = hasProgram ? "Retake setup quiz" : "Set up a program";
}

function showTracker() {
  quizCard.hidden = true;
  trackerSection.hidden = false;
  renderWeek();
  render();
}

function saveProfileAndContinue(nextProfile) {
  try {
    saveProfile(nextProfile);
    storageError.hidden = true;
  } catch (error) {
    showStorageError(error);
  }
  profile = nextProfile;
  applyProfile();
  showTracker();
}

function openQuiz() {
  trackerSection.hidden = true;
  startQuiz(quizCard, {
    onDone: saveProfileAndContinue,
    onSkip: () => saveProfileAndContinue({ skipped: true }),
  });
}

function start() {
  try {
    allSets = loadSets();
    profile = loadProfile();
    swaps = loadSwaps(todayString());
    savedSwaps = loadSavedSwaps();
    goals = loadGoals();
    maxes = loadMaxes();
    skips = loadSkips();
    recoveryDates = loadRecoveryDates();
    recoveryChecks = loadRecoveryChecks(todayString());
  } catch (error) {
    showStorageError(error);
  }
  applyProfile();

  const lastSet = allSets[allSets.length - 1];
  if (lastSet) {
    exerciseInput.value = lastSet.exercise;
    prefillFromCoach();
  }

  exerciseInput.addEventListener("input", () => {
    showMessage("", false);
    render();
  });
  exerciseInput.addEventListener("change", () => {
    prefillFromCoach();
  });
  buildRestTimerCard();
  setForm.addEventListener("submit", handleSubmit);
  setupButton.addEventListener("click", openQuiz);
  exportButton.addEventListener("click", exportData);
  importButton.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", () => {
    const [file] = importFile.files;
    importFile.value = "";
    if (file !== undefined) {
      importData(file);
    }
  });
  document.getElementById("import-confirm-yes").addEventListener("click", confirmImport);
  document.getElementById("import-confirm-no").addEventListener("click", cancelImport);
  showBackupLoadedNotice();

  if (profile === null) {
    openQuiz();
  } else {
    showTracker();
  }
}

start();
