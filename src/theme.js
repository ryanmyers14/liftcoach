// Light/dark mode. With no saved choice the app follows the device setting; once the toggle
// button is tapped, that choice is saved and wins.

// The same key and values are read by the small script in index.html's <head>, which applies a
// saved choice before the page paints so it never flashes the wrong colors.
const THEME_KEY = "liftcoach_theme_v1";
const THEME_COLORS = { light: "#f2f0ea", dark: "#1b1b19" };

export function effectiveTheme(savedTheme, systemPrefersDark) {
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return systemPrefersDark ? "dark" : "light";
}

export function otherTheme(theme) {
  return theme === "dark" ? "light" : "dark";
}

function loadSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    // The theme still changes for this visit; it just will not be remembered.
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').setAttribute("content", THEME_COLORS[theme]);
}

export function setupThemeToggle(button) {
  const systemQuery = window.matchMedia("(prefers-color-scheme: dark)");
  let current = effectiveTheme(loadSavedTheme(), systemQuery.matches);

  function show() {
    applyTheme(current);
    const target = otherTheme(current);
    button.textContent = target === "light" ? "Light mode" : "Dark mode";
    button.setAttribute("aria-label", `Switch to ${target} mode`);
  }

  button.addEventListener("click", () => {
    current = otherTheme(current);
    saveTheme(current);
    show();
  });
  show();
}
