// A front and back body outline with the muscles an exercise trains shaded in.

import { musclesFor } from "./exercises.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// Each shape is [muscle or null, element name, attributes]. null shapes are the neutral outline.
// The outline is one continuous body, with muscles shaped to follow its curves.
const OUTLINE = [
  [null, "ellipse", { cx: 50, cy: 11, rx: 8, ry: 10 }],
  [
    null,
    "path",
    {
      d: "M45 20 C40 22 31 25 26 32 C20 40 18 60 15 80 C13 90 13 95 18 95 C22 94 22 86 24 76 C26 62 28 52 31 48 C34 60 36 70 36 78 C35 86 33 92 34 100 C33 118 34 134 36 150 C37 162 36 170 36 178 L46 178 C46 170 45 160 46 148 C47 130 49 116 50 104 C51 116 53 130 54 148 C55 160 54 170 54 178 L64 178 C64 170 63 162 64 150 C66 134 67 118 66 100 C67 92 65 86 64 78 C64 70 66 60 69 48 C72 52 74 62 76 76 C78 86 78 94 82 95 C87 95 87 90 85 80 C82 60 80 40 74 32 C69 25 60 22 55 20 Z",
    },
  ],
];

const SHOULDERS = [
  ["Shoulders", "path", { d: "M27 33 C31 29 36 29 39 33 C38 40 35 44 31 46 C27 43 25 38 27 33 Z" }],
  ["Shoulders", "path", { d: "M73 33 C69 29 64 29 61 33 C62 40 65 44 69 46 C73 43 75 38 73 33 Z" }],
];

const arms = (muscle) => [
  [muscle, "path", { d: "M26 46 C28 50 27 58 25 64 C22 66 20 64 20 60 C20 54 22 48 26 46 Z" }],
  [muscle, "path", { d: "M74 46 C72 50 73 58 75 64 C78 66 80 64 80 60 C80 54 78 48 74 46 Z" }],
];

const CALVES = [
  ["Calves", "path", { d: "M37 150 C40 148 44 150 45 154 C45 162 44 168 42 171 C39 171 37 168 37 162 C36 158 36 154 37 150 Z" }],
  ["Calves", "path", { d: "M63 150 C60 148 56 150 55 154 C55 162 56 168 58 171 C61 171 63 168 63 162 C64 158 64 154 63 150 Z" }],
];

const FRONT = [
  ...OUTLINE,
  ...SHOULDERS,
  ["Chest", "path", { d: "M40 33 C44 32 48 33 49.5 35 L49.5 48 C45 50 40 48 37 44 C36 40 37 36 40 33 Z" }],
  ["Chest", "path", { d: "M60 33 C56 32 52 33 50.5 35 L50.5 48 C55 50 60 48 63 44 C64 40 63 36 60 33 Z" }],
  ...arms("Biceps"),
  ["Core", "path", { d: "M40 51 C46 53 54 53 60 51 C61 62 60 72 58 80 C54 82 46 82 42 80 C40 72 39 62 40 51 Z" }],
  ["Quads", "path", { d: "M36 100 C41 98 47 100 49 106 C49 120 47 134 44 144 C40 146 37 144 36 138 C34 124 34 110 36 100 Z" }],
  ["Quads", "path", { d: "M64 100 C59 98 53 100 51 106 C51 120 53 134 56 144 C60 146 63 144 64 138 C66 124 66 110 64 100 Z" }],
  ...CALVES,
];

const BACK = [
  ...OUTLINE,
  ["Back", "path", { d: "M41 30 C46 28 54 28 59 30 C64 34 67 42 66 50 C64 62 62 72 58 78 C54 80 46 80 42 78 C38 72 36 62 34 50 C33 42 36 34 41 30 Z" }],
  ...SHOULDERS,
  ...arms("Triceps"),
  ["Glutes", "path", { d: "M37 82 C42 80 49 82 50 88 C50 96 46 102 41 102 C36 100 35 90 37 82 Z" }],
  ["Glutes", "path", { d: "M63 82 C58 80 51 82 50 88 C50 96 54 102 59 102 C64 100 65 90 63 82 Z" }],
  ["Hamstrings", "path", { d: "M35 104 C40 103 46 105 48 110 C48 122 46 134 43 144 C39 146 36 143 35 136 C33 124 33 112 35 104 Z" }],
  ["Hamstrings", "path", { d: "M65 104 C60 103 54 105 52 110 C52 122 54 134 57 144 C61 146 64 143 65 136 C67 124 67 112 65 104 Z" }],
  ...CALVES,
];

// The first muscle listed for an exercise is the main one; the rest help. Custom exercises give { main: null, helpers: [] }.
export function muscleRoles(exercise) {
  const [main = null, ...helpers] = musclesFor(exercise);
  return { main, helpers };
}

function drawView(label, shapes, roles) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 180");
  svg.setAttribute("class", "body-view");
  svg.setAttribute("aria-hidden", "true");
  for (const [muscle, tag, attributes] of shapes) {
    const shape = document.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(attributes)) {
      shape.setAttribute(name, value);
    }
    let role = "none";
    if (muscle === roles.main) {
      role = "main";
    } else if (roles.helpers.includes(muscle)) {
      role = "helper";
    }
    shape.setAttribute("class", `body-part body-${role}`);
    svg.append(shape);
  }

  const figure = document.createElement("figure");
  const caption = document.createElement("figcaption");
  caption.textContent = label;
  figure.append(svg, caption);
  return figure;
}

// Front and back side by side, so helper muscles on the other side are visible without a tap.
function drawBothSides(roles) {
  const views = document.createElement("div");
  views.className = "body-views";
  views.append(drawView("Front", FRONT, roles), drawView("Back", BACK, roles));
  return views;
}

// Returns null when the app does not know the muscles for this exercise.
export function renderBodyMap(exercise) {
  const roles = muscleRoles(exercise);
  if (roles.main === null) {
    return null;
  }

  const legend = document.createElement("p");
  legend.className = "body-legend";
  const mainName = document.createElement("strong");
  mainName.textContent = roles.main;
  legend.append("Main: ", mainName);
  if (roles.helpers.length > 0) {
    legend.append(`. Also works: ${roles.helpers.join(", ")}.`);
  }

  const wrapper = document.createElement("div");
  wrapper.className = "body-map";
  wrapper.append(drawBothSides(roles), legend);
  return wrapper;
}
