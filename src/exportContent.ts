import { EventDetails, Workout } from './types';
import { duration, pace } from './dates';
export const safeFilename = (value: string) => value.replace(/[^\p{L}\p{N}._ -]/gu, '-').replace(/^\.+/, '').trim().slice(0, 100) || 'stride-plan';
const htmlEscape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const calendarEscape = (v: string) => v.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
export function markdown(event: EventDetails, workouts: Workout[]) {
  return `# ${event.name} Training Plan\n\nEvent: ${event.date} · ${event.distanceKm} km · ${duration(event.targetSeconds)} · ${pace(event.targetSeconds, event.distanceKm)}\n\n${workouts.map(w => `## ${w.date}: ${w.title}\n${w.sport} · ${duration(w.durationSeconds)} · ${w.distanceKm} km · ${w.completed ? 'Complete' : 'Incomplete'}\n\n${w.detail}`).join('\n\n')}`;
}
export function pdfHtml(event: EventDetails, workouts: Workout[]) {
  return `<html><head><meta charset="utf-8"></head><body style="font-family:Arial;padding:24px"><pre style="white-space:pre-wrap;line-height:1.5">${htmlEscape(markdown(event, workouts))}</pre></body></html>`;
}
function fold(line: string) {
  const chunks: string[] = []; let current = ''; let bytes = 0;
  for (const char of line) {
    const size = char.codePointAt(0)! > 0xffff ? 4 : char.charCodeAt(0) > 0x7ff ? 3 : char.charCodeAt(0) > 0x7f ? 2 : 1;
    if (bytes + size > 75) { chunks.push(current); current = ' '; bytes = 1; }
    current += char; bytes += size;
  }
  chunks.push(current); return chunks.join('\r\n');
}
export function ics(event: EventDetails, workouts: Workout[], now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Stride AI//Training//EN', 'CALSCALE:GREGORIAN',
    ...workouts.flatMap(w => ['BEGIN:VEVENT', `UID:${calendarEscape(`${event.date}-${encodeURIComponent(event.name)}-${w.id}@stride-ai`)}`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${w.date.replace(/-/g, '')}`, `SUMMARY:${calendarEscape(w.title)}`, `DESCRIPTION:${calendarEscape(`${w.sport} · ${duration(w.durationSeconds)}\n${w.detail}`)}`, 'END:VEVENT']), 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
}
