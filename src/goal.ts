import { EventDetails, eventSchema, isoDate } from './types';
import { today } from './dates';

function parseDate(value: string) {
  if (isoDate.safeParse(value).success) return value;
  const m = value.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  if (!m) throw new Error('Use YYYY-MM-DD or Month DD, YYYY for the event date.');
  const month = months.indexOf(m[1]!.slice(0, 3).toLowerCase()) + 1;
  return isoDate.parse(`${m[3]}-${String(month).padStart(2, '0')}-${m[2]!.padStart(2, '0')}`);
}
export function parseGoalMarkdown(text: string, currentDate = today()): EventDetails {
  const values: Record<string, string> = {};
  const aliases: Record<string, string> = { 'event name': 'name', event: 'name', 'event date': 'date', 'target date': 'date', time: 'target time', target_time: 'target time', gain: 'elevation', 'elevation gain': 'elevation' };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([^:#][^:]*):\s*(.+?)\s*$/);
    if (match) { const k = match[1]!.trim().toLowerCase(); values[aliases[k] ?? k] = match[2]!.trim(); }
  }
  const missing = ['name', 'date', 'distance', 'target time', 'elevation'].filter(k => !values[k]);
  if (missing.length) throw new Error(`goal.md is missing: ${missing.join(', ')}.`);
  const distance = values.distance!.replace(/,/g, '').match(/^(\d+(?:\.\d+)?)\s*km$/i);
  const elevation = values.elevation!.replace(/,/g, '').match(/^(\d+(?:\.\d+)?)\s*m$/i);
  const time = values['target time']!.match(/^(\d+):([0-5]\d)(?::([0-5]\d))?$/);
  if (!distance || !elevation || !time) throw new Error('Use distance in km, elevation in m, and target time as H:MM or H:MM:SS.');
  const event = eventSchema.parse({ name: values.name, date: parseDate(values.date!), distanceKm: Number(distance[1]), elevationM: Number(elevation[1]), targetSeconds: Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3] ?? 0) });
  if (event.date < currentDate) throw new Error('The event date is in the past. Update goal.md before generating a plan.');
  return event;
}
