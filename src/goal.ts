import { EventDetails } from "./types";

const fields: Record<keyof EventDetails, string[]> = {
  name: ["name", "event", "event name"],
  date: ["date", "event date", "target date"],
  distance: ["distance"],
  targetTime: ["target time", "target_time", "time"],
  elevation: ["elevation", "gain", "elevation gain"],
  pace: ["pace", "target pace"],
};

/** Reads a small, human-editable key/value goal.md file. */
export function parseGoalMarkdown(markdown: string): EventDetails {
  const values: Partial<EventDetails> = {};
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s*([^:#][^:]*):\s*(.+?)\s*$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    for (const [field, labels] of Object.entries(fields) as [keyof EventDetails, string[]][]) {
      if (labels.includes(key)) values[field] = value;
    }
  }
  const missing = (Object.keys(fields) as (keyof EventDetails)[]).filter(key => !values[key]);
  if (missing.length) throw new Error(`goal.md is missing: ${missing.join(", ")}.`);
  return values as EventDetails;
}
