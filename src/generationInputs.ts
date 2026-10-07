// JSON object order can change when SQLite state is parsed by Zod. Compare values,
// including legacy signatures, without treating that ordering as an input change.
export function stableInputJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
}
export function matchesGenerationInputs(saved: string, expected: string): boolean {
  if (saved === expected) return true;
  try { return stableInputJson(JSON.parse(saved)) === stableInputJson(JSON.parse(expected)); }
  catch { return false; }
}
