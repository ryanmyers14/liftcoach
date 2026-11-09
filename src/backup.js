// Export and import of everything the app saves in the browser, so a lost phone or a cleared
// browser does not lose your training history. A backup is a JSON file:
// { app: "liftcoach", version: 1, exportedAt, data: { "<storage key>": <saved value> } }.
// The Light/Dark choice is a per-device setting and is not part of a backup.

const BACKUP_APP = "liftcoach";
const BACKUP_VERSION = 1;

const isList = (value) => Array.isArray(value);
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

const isSavedSet = (set) =>
  isObject(set) && typeof set.exercise === "string" && set.exercise.trim() !== "" && isNumber(set.weight) && isNumber(set.reps) && typeof set.date === "string";

// The storage keys the app uses, each with a check that a backup's value has the right shape.
// A value that fails its check would crash the app after an import, so the whole file is refused.
const SHAPES = {
  liftcoach_sets_v1: (value) => isList(value) && value.every(isSavedSet),
  liftcoach_profile_v1: isObject,
  liftcoach_swaps_v1: isObject,
  liftcoach_saved_swaps_v1: isObject,
  liftcoach_goals_v1: (value) => isObject(value) && Object.values(value).every(isNumber),
  liftcoach_maxes_v1: isList,
  liftcoach_skips_v1: isList,
  liftcoach_recovery_dates_v1: isList,
  liftcoach_recovery_checks_v1: isObject,
};

const BACKUP_KEYS = Object.keys(SHAPES);

// storage: anything with getItem (the browser's localStorage). Returns the object to save as a file.
export function buildBackup(storage, exportedAt) {
  const data = {};
  for (const key of BACKUP_KEYS) {
    const saved = storage.getItem(key);
    if (saved === null) {
      continue;
    }
    try {
      data[key] = JSON.parse(saved);
    } catch {
      // A value that is not valid JSON would not load in the app either, so it is left out.
    }
  }
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt, data };
}

export function backupFileName(today) {
  return `liftcoach-backup-${today}.json`;
}

// text: the contents of a chosen file. Returns { ok: true, data, exportedAt } with only the keys
// the app knows, or { ok: false, message } saying in plain words why the file was refused.
export function parseBackup(text) {
  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    return { ok: false, message: "That file is not a LiftCoach backup. Pick a file you exported from LiftCoach." };
  }
  if (!isObject(backup) || backup.app !== BACKUP_APP || !isObject(backup.data)) {
    return { ok: false, message: "That file is not a LiftCoach backup. Pick a file you exported from LiftCoach." };
  }
  if (backup.version !== BACKUP_VERSION) {
    return { ok: false, message: "That backup comes from a different version of LiftCoach, so it cannot be loaded here." };
  }

  const data = {};
  for (const key of BACKUP_KEYS) {
    if (backup.data[key] === undefined) {
      continue;
    }
    if (!SHAPES[key](backup.data[key])) {
      return { ok: false, message: "That backup has damaged data in it, so nothing was changed." };
    }
    data[key] = backup.data[key];
  }
  if (Object.keys(data).length === 0) {
    return { ok: false, message: "That backup has no LiftCoach data in it, so nothing was changed." };
  }
  return { ok: true, data, exportedAt: typeof backup.exportedAt === "string" ? backup.exportedAt : null };
}

// Replaces everything the app has saved with the backup's data. Keys the backup does not have are
// cleared, so the device ends up exactly as it was when the backup was made.
export function applyBackup(storage, data) {
  for (const key of BACKUP_KEYS) {
    storage.removeItem(key);
  }
  for (const key of BACKUP_KEYS) {
    if (data[key] !== undefined) {
      storage.setItem(key, JSON.stringify(data[key]));
    }
  }
}
