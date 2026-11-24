// Reads a number a person typed into a field. Only plain numbers like 135, 2.5 or .5 count, so the result is
// NaN for blank text, words, negatives, and forms JavaScript's Number() would quietly accept: 0x10 (16),
// 1e2 (100), and Infinity.
export function parseNumber(text) {
  const trimmed = text.trim();
  return /^(\d+(\.\d*)?|\.\d+)$/.test(trimmed) ? Number(trimmed) : NaN;
}

// Reads a typed weight the same way, kept to two decimals so a long decimal is not saved and shown in full.
// Two decimals is finer than any plate, so nothing real is lost.
export function parseWeight(text) {
  return Math.round(parseNumber(text) * 100) / 100;
}
