// Recovery days: off days built into the program, with advice on how to get your body right.

import { MUSCLES, musclesFor } from "./exercises.js";

// How many recovery days to add for each number of training days. A full week of rest days would
// make a 2 day plan mostly empty cards, so the count is capped at 3.
const RECOVERY_DAYS_BY_TRAINING_DAYS = { 2: 2, 3: 3, 4: 2, 5: 2, 6: 1 };

export const RECOVERY_CHECKLIST = [
  { id: "stretch", text: "10 minutes of stretching, focused on the muscles you trained" },
  { id: "walk", text: "20 to 30 minutes of easy walking" },
  { id: "protein", text: "Protein at every meal" },
  { id: "water", text: "About 8 cups of water" },
  { id: "sleep", text: "Sleep 7 to 9 hours tonight" },
];

// The first stretch listed for each muscle is the one the recovery day shows; the others are its alternates.
const STRETCHES = {
  Chest: [
    { name: "Doorway chest stretch", how: "Forearm on a door frame, elbow at shoulder height. Step through until you feel it across your chest. Hold 30 seconds each side." },
    { name: "Floor chest opener", how: "Lie on your back with your arms out to the sides, palms up. Let your chest relax open for 45 seconds." },
    { name: "Behind-the-back clasp", how: "Clasp your hands behind your back, straighten your arms, and lift them gently. Keep your chest tall. Hold 30 seconds." },
  ],
  Back: [
    { name: "Child's pose", how: "Kneel, sit back on your heels, and reach your arms far forward on the floor. Breathe slowly for 45 seconds." },
    { name: "Cat-cow", how: "On hands and knees, slowly arch your back, then round it. Move with your breath for 10 slow rounds." },
    { name: "Hanging lat stretch", how: "Hold a door frame or sturdy pole at chest height, sit your hips back with a flat back, and let your arms stretch. Hold 30 seconds." },
  ],
  Shoulders: [
    { name: "Cross-body shoulder stretch", how: "Pull one arm across your chest with the other hand. Keep the shoulder down. Hold 30 seconds each side." },
    { name: "Thread the needle", how: "On hands and knees, slide one arm under your chest and rest that shoulder on the floor. Hold 30 seconds each side." },
    { name: "Wall shoulder opener", how: "Hand on a wall behind shoulder height, thumb up. Slowly turn your body away. Hold 30 seconds each side." },
  ],
  Biceps: [
    { name: "Wall biceps stretch", how: "Palm flat on a wall at shoulder height, fingers pointing back. Slowly turn your body away. Hold 30 seconds each side." },
    { name: "Kneeling forearm stretch", how: "On hands and knees with palms down and fingers pointing back toward your knees, sit back gently. Hold 30 seconds." },
    { name: "Straight-arm doorway stretch", how: "Put one straight arm on a door frame behind you, thumb down, and turn away. Hold 30 seconds each side." },
  ],
  Triceps: [
    { name: "Overhead triceps stretch", how: "Reach one hand down your upper back and press the elbow back with the other hand. Hold 30 seconds each side." },
    { name: "Towel triceps stretch", how: "Hold a towel overhead in one hand, grab the bottom end with the other, and pull down gently. Hold 30 seconds each side." },
    { name: "Wall triceps lean", how: "Put both forearms on a wall above your head and lean your chest toward it. Hold 30 seconds." },
  ],
  Quads: [
    { name: "Standing quad stretch", how: "Hold your ankle behind you with knees together and hips tucked. Hold 30 seconds each side, holding a wall for balance." },
    { name: "Kneeling hip flexor stretch", how: "Kneel on one knee with the other foot forward, squeeze your glute, and tuck your hips forward. Hold 30 seconds each side." },
    { name: "Lying quad stretch", how: "Lie on your side and pull your top ankle toward your glute, keeping your knees together. Hold 30 seconds each side." },
  ],
  Hamstrings: [
    { name: "Seated hamstring reach", how: "Sit with one leg straight and reach toward your toes with a flat back. Stop when you feel a pull. Hold 30 seconds each side." },
    { name: "Standing toe touch", how: "With soft knees, hinge forward from the hips and let your arms hang. Hold 30 seconds." },
    { name: "Lying towel hamstring stretch", how: "Lie on your back, loop a towel around one foot, and raise that straight leg. Hold 30 seconds each side." },
  ],
  Glutes: [
    { name: "Figure-four stretch", how: "Lie on your back, ankle on the opposite knee, and pull that thigh toward your chest. Hold 30 seconds each side." },
    { name: "Seated figure-four", how: "Sit in a chair, rest one ankle on the opposite knee, and lean forward with a flat back. Hold 30 seconds each side." },
    { name: "Knee-to-chest hug", how: "Lie on your back and hug one knee to your chest while the other leg rests flat. Hold 30 seconds each side." },
  ],
  Calves: [
    { name: "Wall calf stretch", how: "Hands on a wall, one leg back with the heel down and the knee straight. Lean in. Hold 30 seconds each side." },
    { name: "Downward dog", how: "From hands and knees, lift your hips high and press your heels toward the floor, pedaling your feet slowly. Hold 30 seconds." },
    { name: "Step calf drop", how: "Stand with the balls of your feet on a step, holding a rail, and lower your heels slowly. Hold 30 seconds." },
  ],
  Core: [
    { name: "Cobra stretch", how: "Lie face down, hands under shoulders, and press your chest up while your hips stay on the floor. Hold 20 seconds." },
    { name: "Standing side bend", how: "Reach one arm overhead and lean to the other side. Keep your hips still. Hold 20 seconds each side." },
    { name: "Lying spinal twist", how: "Lie on your back with your knees bent and let them fall to one side while your shoulders stay flat. Hold 30 seconds each side." },
  ],
};

function isRecoveryDay(day) {
  return day.recovery === true;
}

// Returns the program with recovery days spread evenly through it, e.g. [A, B, Recovery, C, D, Recovery].
// Each recovery day is { name: "Recovery", recovery: true, exercises: [] }.
export function withRecoveryDays(program) {
  const recoveryCount = RECOVERY_DAYS_BY_TRAINING_DAYS[program.length] ?? 0;
  const restAfter = new Set();
  for (let rest = 1; rest <= recoveryCount; rest += 1) {
    restAfter.add(Math.floor((rest * program.length) / recoveryCount) - 1);
  }
  return program.flatMap((day, index) => (restAfter.has(index) ? [day, { name: "Recovery", recovery: true, exercises: [] }] : [day]));
}

// The nearest training day before (direction -1) or after (direction 1) a day, wrapping around the program.
function neighborWorkout(program, index, direction) {
  for (let step = 1; step < program.length; step += 1) {
    const day = program[(((index + direction * step) % program.length) + program.length) % program.length];
    if (!isRecoveryDay(day)) {
      return day;
    }
  }
  return null;
}

export function previousWorkout(program, index) {
  return neighborWorkout(program, index, -1);
}

export function nextWorkout(program, index) {
  return neighborWorkout(program, index, 1);
}

// Splits the muscles into those a workout hit (so they need rest) and the ones it left fresh.
export function muscleRecovery(workout) {
  const names = workout === null ? [] : workout.exercises.flatMap(({ name }) => musclesFor(name));
  const worked = MUSCLES.filter((muscle) => names.includes(muscle));
  return { worked, fresh: MUSCLES.filter((muscle) => !worked.includes(muscle)) };
}

// The stretch shown for each muscle that was worked.
export function stretchesFor(muscles) {
  return muscles.map((muscle) => ({ muscle, ...STRETCHES[muscle][0] }));
}

// Other stretches for the same muscle that can stand in for this one. Empty if the name is not a shown stretch.
export function alternateStretchesFor(stretchName) {
  const options = Object.values(STRETCHES).find((stretches) => stretches[0].name === stretchName);
  return options === undefined ? [] : options.slice(1).map((stretch) => stretch.name);
}

// The stretch with this name, or null if there is none.
export function stretchNamed(name) {
  return Object.values(STRETCHES).flat().find((stretch) => stretch.name === name) ?? null;
}

// Recovery days you opened count as a step in the rotation, like a day you trained. A day you
// skipped already counts through the skip, so it is left out here to avoid counting it twice.
export function recoveryStepDates(recoveryDates, skippedDates) {
  return recoveryDates.filter((date) => !skippedDates.includes(date));
}
