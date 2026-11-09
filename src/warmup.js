// Warmups: ramp-up sets before a lift, and a short general routine for the day.
import { isLowerBodyLift } from "./coach.js";
import { isAccessory } from "./exercises.js";

// Lighter sets that build toward the working weight: [fraction of working weight, reps].
const RAMP = [
  [0.5, 8],
  [0.7, 5],
  [0.85, 3],
];

// Small accessory lifts only need one easy set.
const ACCESSORY_RAMP = [[0.6, 10]];

const CARDIO_WARMUP = "5 minutes of easy cardio (bike, rower, or a brisk walk)";

const LOWER_BODY_WARMUP = ["10 bodyweight squats", "10 glute bridges", "10 leg swings on each leg"];

const UPPER_BODY_WARMUP = ["20 arm circles, 10 in each direction", "10 band pull-aparts or wall slides", "10 easy push-ups (on your knees is fine)"];

function roundToFive(weight) {
  return Math.max(5, Math.round(weight / 5) * 5);
}

// Returns [{ weight, reps }] of lighter sets to do before the working sets, or [] if there is no weight to build to.
export function warmupSets(exercise, workingWeight) {
  if (!Number.isFinite(workingWeight) || workingWeight <= 0) {
    return [];
  }
  const ramp = isAccessory(exercise) ? ACCESSORY_RAMP : RAMP;
  const sets = [];
  for (const [fraction, reps] of ramp) {
    const weight = roundToFive(workingWeight * fraction);
    const isNewWeight = sets.every((set) => set.weight !== weight);
    if (weight < workingWeight && isNewWeight) {
      sets.push({ weight, reps });
    }
  }
  return sets;
}

// Returns a list of warmup steps for a day, given the names of its exercises.
export function generalWarmup(exerciseNames) {
  const steps = [CARDIO_WARMUP];
  if (exerciseNames.some(isLowerBodyLift)) {
    steps.push(...LOWER_BODY_WARMUP);
  }
  if (exerciseNames.some((name) => !isLowerBodyLift(name))) {
    steps.push(...UPPER_BODY_WARMUP);
  }
  return steps;
}
