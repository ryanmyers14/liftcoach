// Short written walkthroughs for the lifts the program uses, plus a video search link.

const TUTORIALS = {
  "Bench press": {
    steps: [
      "Lie back with your eyes under the bar, feet flat on the floor, and shoulder blades pinched together.",
      "Grip the bar a little wider than your shoulders and unrack it over your chest.",
      "Lower it with control to your mid-chest, elbows about 45 degrees from your body.",
      "Press it back up in a slight arc until your arms are straight.",
    ],
    mistakes: ["Bouncing the bar off your chest.", "Flaring your elbows straight out to the sides."],
  },
  "Back squat": {
    steps: [
      "Set the bar on your upper back (not your neck), and step back with feet about shoulder-width apart.",
      "Take a big breath, brace your core, and sit down and back between your hips.",
      "Go down until your thighs are about parallel, keeping your knees in line with your toes.",
      "Drive through your whole foot to stand up, keeping your chest up.",
    ],
    mistakes: ["Knees caving inward.", "Heels lifting off the floor or your back rounding at the bottom."],
  },
  "Deadlift": {
    steps: [
      "Stand with the bar over the middle of your feet and grip it just outside your legs.",
      "Drop your hips until your shins touch the bar, chest up, and pull the slack out of the bar.",
      "Push the floor away and stand tall, keeping the bar close to your legs.",
      "Lower it by pushing your hips back first, then bending your knees once the bar passes them.",
    ],
    mistakes: ["Rounding your lower back.", "Jerking the bar off the floor instead of pulling the slack out first."],
  },
  "Overhead press": {
    steps: [
      "Hold the bar at your collarbones with your grip just outside your shoulders and elbows slightly forward.",
      "Squeeze your glutes and brace your core so you do not lean back.",
      "Press the bar straight up, moving your head back slightly so the bar passes your face.",
      "Finish with the bar over the middle of your feet and your arms locked out.",
    ],
    mistakes: ["Leaning back and turning it into an incline press.", "Pressing the bar forward instead of straight up."],
  },
  "Barbell row": {
    steps: [
      "Hinge at your hips until your torso is near 45 degrees, with a flat back and the bar hanging at your knees.",
      "Pull the bar to your lower ribs, driving your elbows back.",
      "Squeeze your shoulder blades together at the top for a moment.",
      "Lower the bar with control until your arms are straight.",
    ],
    mistakes: ["Standing up with each rep to heave the weight.", "Rounding your back."],
  },
  "Leg press": {
    steps: [
      "Sit with your back flat against the pad and your feet about shoulder-width apart on the platform.",
      "Unlock the safety handles and lower the platform until your knees are around 90 degrees.",
      "Press through your whole foot until your legs are almost straight.",
    ],
    mistakes: ["Locking your knees hard at the top.", "Letting your hips curl off the seat at the bottom."],
  },
  "Lat pulldown": {
    steps: [
      "Sit with your thighs tucked under the pads and grab the bar a little wider than your shoulders.",
      "Lean back slightly and pull the bar to your upper chest, driving your elbows down.",
      "Pause, then let the bar rise with control until your arms are straight.",
    ],
    mistakes: ["Swinging your body to yank the bar down.", "Pulling the bar behind your neck."],
  },
  "Dumbbell curl": {
    steps: [
      "Stand tall holding a dumbbell in each hand with your palms facing forward.",
      "Curl the weights up, keeping your elbows pinned near your sides.",
      "Squeeze at the top, then lower slowly until your arms are straight.",
    ],
    mistakes: ["Swinging your back to lift the weights.", "Dropping the weights quickly on the way down."],
  },
  "Romanian deadlift": {
    steps: [
      "Stand holding the bar at your thighs with a slight bend in your knees.",
      "Push your hips straight back, sliding the bar down your legs, with a flat back.",
      "Lower until you feel a strong stretch in the back of your legs, around mid-shin.",
      "Squeeze your glutes to bring your hips forward and stand tall.",
    ],
    mistakes: ["Bending your knees more and squatting the weight down.", "Letting the bar drift away from your legs."],
  },
  "Hip thrust": {
    steps: [
      "Sit with your upper back against a bench and the weight resting across your hips.",
      "Plant your feet about hip-width apart, with your shins vertical at the top.",
      "Drive through your heels and squeeze your glutes until your hips are in line with your torso.",
      "Lower with control and repeat.",
    ],
    mistakes: ["Arching your lower back at the top instead of squeezing your glutes.", "Pushing through your toes."],
  },
  "Lateral raise": {
    steps: [
      "Stand holding light dumbbells at your sides with a small bend in your elbows.",
      "Raise your arms out to the sides until they reach shoulder height.",
      "Lower slowly. Use a weight light enough that you do not need to swing.",
    ],
    mistakes: ["Using a weight so heavy you shrug and swing.", "Raising your arms above shoulder height."],
  },
  "Dumbbell bench press": {
    steps: [
      "Sit on the bench with the dumbbells on your thighs, then lie back and kick them up to chest height.",
      "Press them up until your arms are straight over your chest.",
      "Lower with control until your elbows are just below the bench, about 45 degrees from your body.",
    ],
    mistakes: ["Letting the dumbbells drift out of line over your chest.", "Dropping your elbows far below the bench."],
  },
  "Goblet squat": {
    steps: [
      "Hold one dumbbell upright against your chest with both hands, elbows pointing down.",
      "Stand with your feet a little wider than your shoulders and your toes slightly out.",
      "Sit straight down between your knees until your thighs are about parallel.",
      "Stand back up through your whole foot.",
    ],
    mistakes: ["Letting the dumbbell pull you forward.", "Knees caving inward."],
  },
  "Dumbbell Romanian deadlift": {
    steps: [
      "Hold a dumbbell in each hand in front of your thighs with a slight bend in your knees.",
      "Push your hips back and slide the weights down your legs, keeping your back flat.",
      "Lower until you feel a stretch in the back of your legs, then stand tall by driving your hips forward.",
    ],
    mistakes: ["Rounding your back.", "Letting the dumbbells swing away from your legs."],
  },
  "Dumbbell shoulder press": {
    steps: [
      "Sit or stand holding the dumbbells at shoulder height with your palms facing forward.",
      "Press them straight up until your arms are almost straight.",
      "Lower back to shoulder height with control.",
    ],
    mistakes: ["Arching your lower back.", "Letting your elbows flare far behind your body."],
  },
  "Dumbbell row": {
    steps: [
      "Put one hand and knee on a bench, with your back flat and a dumbbell in your other hand.",
      "Pull the dumbbell toward your hip, driving your elbow back.",
      "Pause at the top, then lower until your arm is straight. Do all your reps, then switch sides.",
    ],
    mistakes: ["Twisting your torso to swing the weight up.", "Pulling toward your shoulder instead of your hip."],
  },
  "Dumbbell lunge": {
    steps: [
      "Stand holding a dumbbell in each hand at your sides.",
      "Step forward and lower until both knees are around 90 degrees.",
      "Push through your front foot to return to standing, then repeat on the other leg.",
    ],
    mistakes: ["Letting your front knee collapse inward.", "Taking too short a step so your knee shoves far past your toes."],
  },
  "Dumbbell pullover": {
    steps: [
      "Lie on a bench with your upper back on it and hold one dumbbell over your chest with both hands.",
      "With a slight bend in your elbows, lower the weight back behind your head until you feel a stretch.",
      "Pull it back over your chest, keeping your core tight.",
    ],
    mistakes: ["Using too much weight, which strains your shoulders.", "Arching your lower back off the bench."],
  },
  "Incline dumbbell press": {
    steps: [
      "Set a bench to a low incline (about 30 degrees) and sit back with the dumbbells on your thighs.",
      "Kick the weights up to shoulder height with your palms facing forward.",
      "Press them up until your arms are almost straight over your upper chest.",
      "Lower with control until you feel a stretch across your chest.",
    ],
    mistakes: ["Setting the bench too steep, which turns it into a shoulder press.", "Letting the dumbbells drift out wide."],
  },
  "Overhead triceps extension": {
    steps: [
      "Stand or sit holding one dumbbell with both hands, arms straight overhead.",
      "Bend your elbows to lower the weight behind your head, keeping your elbows pointing forward.",
      "Straighten your arms to press it back up.",
    ],
    mistakes: ["Letting your elbows flare out wide.", "Arching your lower back as you press."],
  },
  "Rear delt fly": {
    steps: [
      "Hinge forward at your hips with a flat back, holding light dumbbells hanging below your chest.",
      "With a small bend in your elbows, raise your arms out to the sides until they are level with your back.",
      "Squeeze your shoulder blades together, then lower slowly.",
    ],
    mistakes: ["Using too much weight and swinging your torso.", "Shrugging your shoulders up toward your ears."],
  },
  "Calf raise": {
    steps: [
      "Stand holding a dumbbell in each hand, with the balls of your feet on a step or plate and your heels hanging off.",
      "Lower your heels until you feel a stretch in your calves.",
      "Rise up as high as you can on your toes, pause, then lower slowly.",
    ],
    mistakes: ["Bouncing at the bottom instead of using the full range.", "Bending your knees to cheat the lift."],
  },
  "Weighted crunch": {
    steps: [
      "Lie on your back with your knees bent and hold a dumbbell or plate against your chest.",
      "Curl your shoulders off the floor by squeezing your abs.",
      "Pause at the top, then lower slowly.",
    ],
    mistakes: ["Pulling on your neck.", "Using momentum instead of your abs."],
  },
  "Push-up": {
    steps: [
      "Start in a high plank with hands just wider than your shoulders and your body in a straight line.",
      "Lower your chest toward the floor, elbows about 45 degrees from your body.",
      "Press the floor away until your arms are straight, keeping your core tight.",
    ],
    mistakes: ["Sagging hips or piking your butt up.", "Flaring your elbows straight out to the sides."],
  },
  "Machine chest press": {
    steps: [
      "Adjust the seat so the handles line up with your mid-chest, and sit with your back flat against the pad.",
      "Grip the handles and press forward until your arms are almost straight.",
      "Return slowly until you feel a stretch in your chest, without letting the weights touch down.",
    ],
    mistakes: ["Seat set too high or low, which strains your shoulders.", "Letting your shoulders roll forward at the top."],
  },
  "Cable fly": {
    steps: [
      "Set the pulleys at chest height, grab a handle in each hand, and step forward with one foot ahead for balance.",
      "With a slight bend in your elbows, bring your hands together in front of your chest in a wide hugging arc.",
      "Pause, then open your arms slowly until you feel a stretch across your chest.",
    ],
    mistakes: ["Turning it into a press by bending your elbows a lot.", "Going so heavy that your shoulders roll forward."],
  },
  "Incline barbell press": {
    steps: [
      "Set a bench to a low incline (about 30 degrees), lie back with your eyes under the bar, and pinch your shoulder blades together.",
      "Unrack the bar with a grip a little wider than your shoulders.",
      "Lower it to your upper chest, then press it back up until your arms are straight.",
    ],
    mistakes: ["Setting the bench too steep, which turns it into a shoulder press.", "Bouncing the bar off your chest."],
  },
  "Front squat": {
    steps: [
      "Rest the bar on the front of your shoulders with your elbows high, either with fingertips under the bar or arms crossed.",
      "Brace your core and sit straight down between your hips, keeping your chest tall.",
      "Go until your thighs are about parallel, then drive up through your whole foot.",
    ],
    mistakes: ["Letting your elbows drop so the bar rolls forward.", "Leaning forward and rounding your upper back."],
  },
  "Hack squat": {
    steps: [
      "Set your shoulders and back against the pads and place your feet shoulder-width apart on the platform.",
      "Release the safeties and lower under control until your thighs are about parallel.",
      "Press through your whole foot to stand, without locking your knees hard.",
    ],
    mistakes: ["Lowering only a few inches.", "Letting your lower back peel off the pad at the bottom."],
  },
  "Bulgarian split squat": {
    steps: [
      "Stand a long step in front of a bench and rest the top of your back foot on it, holding dumbbells at your sides.",
      "Lower straight down until your front thigh is about parallel, keeping your front knee in line with your toes.",
      "Drive through your front heel to stand back up.",
    ],
    mistakes: ["Standing too close to the bench so your knee shoots far past your toes.", "Pushing off your back foot instead of your front leg."],
  },
  "Leg extension": {
    steps: [
      "Adjust the seat so your knees line up with the machine's pivot and the pad rests on your lower shins.",
      "Straighten your legs until your knees are almost locked, and squeeze your quads.",
      "Lower slowly back down, stopping before the weights touch.",
    ],
    mistakes: ["Swinging the weight up with momentum.", "Locking your knees hard at the top."],
  },
  "Trap bar deadlift": {
    steps: [
      "Stand inside the trap bar with your feet hip-width apart and grab the handles.",
      "Drop your hips, lift your chest, and brace your core.",
      "Push the floor away and stand tall, keeping the bar close to your body.",
      "Lower by pushing your hips back first, then bending your knees.",
    ],
    mistakes: ["Rounding your lower back.", "Jerking the bar instead of pulling out the slack first."],
  },
  "Sumo deadlift": {
    steps: [
      "Stand with a wide stance and toes pointed out, with the bar over the middle of your feet.",
      "Grip the bar with your hands inside your knees, drop your hips, and lift your chest.",
      "Push your knees out over your toes and stand tall, keeping the bar against your legs.",
      "Lower the bar along your legs under control.",
    ],
    mistakes: ["Knees caving in as you pull.", "Hips shooting up before the bar leaves the floor."],
  },
  "Leg curl": {
    steps: [
      "Adjust the machine so the pad rests just above your heels and your knees line up with the pivot.",
      "Curl your heels toward your butt, squeezing your hamstrings.",
      "Lower slowly until your legs are almost straight.",
    ],
    mistakes: ["Lifting your hips off the pad to cheat the weight up.", "Dropping the weight quickly on the way down."],
  },
  "Glute bridge": {
    steps: [
      "Lie on your back with your knees bent and feet flat, about hip-width apart.",
      "Brace your core and press through your heels to lift your hips until your body is in a straight line from shoulders to knees.",
      "Squeeze your glutes for a second, then lower slowly.",
    ],
    mistakes: ["Arching your lower back at the top instead of squeezing your glutes.", "Pushing through your toes so your heels lift."],
  },
  "Arnold press": {
    steps: [
      "Sit with dumbbells at chest height and palms facing you.",
      "Press up while rotating your palms to face forward as your arms straighten overhead.",
      "Reverse the motion on the way down, rotating your palms back toward you.",
    ],
    mistakes: ["Leaning back and turning it into an incline press.", "Using momentum from your legs or back."],
  },
  "Cable lateral raise": {
    steps: [
      "Set the pulley low, stand side-on to it, and hold the handle in your far hand.",
      "With a soft bend in your elbow, raise your arm out to the side to about shoulder height.",
      "Lower slowly, keeping tension on the cable.",
    ],
    mistakes: ["Shrugging your shoulder up toward your ear.", "Swinging your body to get the weight up."],
  },
  "Face pull": {
    steps: [
      "Set a rope on a cable at about face height and hold an end in each hand, then step back.",
      "Pull the rope toward your face, spreading your hands apart and pointing your elbows out and back.",
      "Squeeze your upper back for a second, then return slowly.",
    ],
    mistakes: ["Going too heavy so you lean back to pull.", "Pulling to your chest instead of your face."],
  },
  "Cable row": {
    steps: [
      "Sit tall with your feet braced and your knees slightly bent, holding the handle with arms straight.",
      "Pull the handle to your lower ribs, squeezing your shoulder blades together.",
      "Return slowly until your arms are straight, keeping your back flat.",
    ],
    mistakes: ["Rocking your torso back and forth to move the weight.", "Shrugging your shoulders up as you pull."],
  },
  "Chest-supported row": {
    steps: [
      "Set the pad to chest height and lie against it, gripping the handles with arms straight.",
      "Pull your elbows back and squeeze your shoulder blades together.",
      "Lower slowly until your arms are straight.",
    ],
    mistakes: ["Lifting your chest off the pad.", "Pulling mostly with your arms instead of your back."],
  },
  "Pull-up": {
    steps: [
      "Grab the bar with an overhand grip just outside your shoulders and hang with your shoulders pulled down.",
      "Pull your chest toward the bar, driving your elbows down.",
      "Lower yourself slowly until your arms are straight.",
    ],
    mistakes: ["Kipping or swinging to get over the bar.", "Only going halfway down between reps."],
  },
  "Barbell curl": {
    steps: [
      "Stand tall holding the bar with an underhand grip, hands shoulder-width apart.",
      "Curl the bar up, keeping your elbows pinned to your sides.",
      "Squeeze at the top, then lower slowly until your arms are straight.",
    ],
    mistakes: ["Swinging your hips and back to lift the bar.", "Letting your elbows drift forward."],
  },
  "Hammer curl": {
    steps: [
      "Stand holding dumbbells at your sides with your palms facing each other.",
      "Curl the weights up without twisting your wrists, keeping your elbows at your sides.",
      "Lower slowly until your arms are straight.",
    ],
    mistakes: ["Swinging your torso to lift the weights.", "Rushing the lowering part."],
  },
  "Triceps pushdown": {
    steps: [
      "Set a bar or rope on a high pulley and grip it with your elbows tucked at your sides.",
      "Press the handle down until your arms are straight, squeezing your triceps.",
      "Let it rise slowly until your forearms are about parallel to the floor.",
    ],
    mistakes: ["Letting your elbows flare out or move forward.", "Leaning over the bar to push with your body weight."],
  },
  "Skull crusher": {
    steps: [
      "Lie on a bench holding a bar or dumbbells over your chest with arms straight.",
      "Bend only at the elbows to lower the weight toward your forehead, keeping your upper arms still.",
      "Extend your arms back up, squeezing your triceps.",
    ],
    mistakes: ["Letting your elbows flare wide.", "Using a weight so heavy that your upper arms move."],
  },
  "Seated calf raise": {
    steps: [
      "Sit with the pads resting on your lower thighs and the balls of your feet on the platform.",
      "Lower your heels as far as comfortable to stretch your calves.",
      "Press up onto your toes as high as you can and pause.",
    ],
    mistakes: ["Bouncing at the bottom.", "Cutting the range of motion short."],
  },
  "Cable crunch": {
    steps: [
      "Kneel facing a high pulley and hold the rope beside your head.",
      "Round your spine and curl your elbows toward your knees, using your abs.",
      "Return slowly to the start without sitting back on your heels.",
    ],
    mistakes: ["Pulling with your arms or hips instead of curling your abs.", "Using so much weight you lose control."],
  },
  "Hanging leg raise": {
    steps: [
      "Hang from a bar with your shoulders pulled down and your body still.",
      "Raise your legs, bending your knees if needed, until your thighs are at least parallel to the floor.",
      "Lower slowly without swinging.",
    ],
    mistakes: ["Swinging your body to get momentum.", "Letting your shoulders shrug up to your ears."],
  },
  "Smith machine bench press": {
    steps: [
      "Place a bench under the bar so it lines up with your mid-chest, and lie back with your shoulder blades pinched together.",
      "Unrack by rotating the bar's hooks, and lower it to your mid-chest.",
      "Press it back up until your arms are straight, then re-hook the bar when you finish.",
    ],
    mistakes: ["Setting the bench so far forward or back that the bar path feels off.", "Forgetting to rotate the hooks to re-rack."],
  },
  "Smith machine incline press": {
    steps: [
      "Set a bench at a low incline (about 30 degrees) so the bar comes down to your upper chest.",
      "Unrack and lower the bar under control to your upper chest.",
      "Press up until your arms are straight, then re-hook the bar.",
    ],
    mistakes: ["Setting the bench too steep.", "Bouncing the bar off your chest."],
  },
  "Smith machine squat": {
    steps: [
      "Set the bar at upper-back height, step under it, and place your feet slightly in front of the bar.",
      "Unrack, brace your core, and sit down until your thighs are about parallel.",
      "Drive through your whole foot to stand, then re-hook the bar.",
    ],
    mistakes: ["Feet directly under the bar, which puts strain on your knees.", "Heels lifting off the floor."],
  },
  "Smith machine split squat": {
    steps: [
      "Stand facing away with the bar across your upper back, one foot forward and the other foot back.",
      "Lower straight down until your front thigh is about parallel.",
      "Drive through your front heel to stand, finishing all reps before switching legs.",
    ],
    mistakes: ["Standing too close so your front knee goes far past your toes.", "Pushing off your back foot instead of your front leg."],
  },
  "Smith machine shoulder press": {
    steps: [
      "Set a bench upright so the bar lines up with the front of your face, and sit with your back against the pad.",
      "Unrack and lower the bar to your chin level.",
      "Press straight up until your arms are almost straight, then re-hook the bar.",
    ],
    mistakes: ["Arching your lower back to push the bar up.", "Setting the bench so far back that the bar hits your face."],
  },
  "Smith machine row": {
    steps: [
      "Stand with the bar over your feet, hinge at the hips with a flat back, and grip the bar just outside your legs.",
      "Pull the bar to your lower ribs, squeezing your shoulder blades together.",
      "Lower it slowly until your arms are straight.",
    ],
    mistakes: ["Standing up as you pull to cheat the weight.", "Rounding your back."],
  },
  "Smith machine Romanian deadlift": {
    steps: [
      "Stand with the bar at hip height, feet hip-width apart, and unrack it.",
      "Push your hips back with a soft bend in your knees, sliding the bar down your thighs.",
      "Lower until you feel a stretch in your hamstrings, then squeeze your glutes to stand tall.",
    ],
    mistakes: ["Rounding your back.", "Bending your knees so much that it becomes a squat."],
  },
  "Smith machine hip thrust": {
    steps: [
      "Sit on the floor with your upper back against a bench and the bar over your hips (use a pad).",
      "Plant your feet flat, brace your core, and drive your hips up until your body is in a straight line.",
      "Squeeze your glutes at the top, then lower slowly.",
    ],
    mistakes: ["Arching your lower back at the top.", "Setting your feet so far out that your hamstrings take over."],
  },
  "Smith machine calf raise": {
    steps: [
      "Stand on a low step or plate under the bar with the balls of your feet on it and the bar across your upper back.",
      "Lower your heels to stretch your calves.",
      "Rise as high as you can on your toes and pause.",
    ],
    mistakes: ["Bouncing at the bottom.", "Bending your knees to cheat the weight up."],
  },
};

const LOOKUP = new Map(Object.entries(TUTORIALS).map(([name, tutorial]) => [name.toLowerCase(), { name, ...tutorial }]));

// Returns { name, steps, mistakes, videoUrl } or null for an exercise we have no walkthrough for.
export function tutorialFor(exercise) {
  const tutorial = LOOKUP.get(exercise.trim().toLowerCase());
  if (tutorial === undefined) {
    return null;
  }
  const query = encodeURIComponent(`how to ${tutorial.name} proper form`);
  return { ...tutorial, videoUrl: `https://www.youtube.com/results?search_query=${query}` };
}
