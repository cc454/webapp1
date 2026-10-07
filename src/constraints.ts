import { Rules } from './types';
import { datesBetween, dayOfWeek } from './dates';

// Put a date-specific construction brief in every generation request, including
// repair requests, so the model schedules around the rules before adding detail.
export function generationConstraints(text: string, rules: Rules, start: string, end: string, previousDayHard: boolean): string {
  const dates = datesBetween(start, end);
  const days = dates.map((date, i) => ({
    date, weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek(date)],
    maximumTotalDurationSeconds: dayOfWeek(date) === 1 ? rules.mondayMaxMinutes * 60 : null,
    longSessionAllowed: !rules.weekendLong || [0, 6].includes(dayOfWeek(date)),
    hardSessionAllowed: !(i === 0 && rules.noConsecutiveHard && previousDayHard),
  }));
  return `SCHEDULE CONSTRUCTION CONSTRAINTS (apply before choosing sessions):
1. Choose at least ${dates.length === 7 ? rules.restDays : 0} distinct rest dates in this batch${dates.length < 7 ? ' (final partial block has no rest quota)' : ' (a complete seven-day block anchored at plan creation)'}. A rest day has exactly one entry: sport/intensity rest, durationSeconds 0, distanceKm 0, long false, steps [].
2. ${rules.weekendLong ? 'Choose long runs/rides only on the Saturday/Sunday dates marked below.' : 'Long sessions may occur on any date.'}
3. On each Monday, the SUM of all session durations must be at most ${rules.mondayMaxMinutes * 60} seconds (${rules.mondayMaxMinutes} minutes). This applies even if multiple sports share that date.
4. ${rules.noConsecutiveHard ? 'Choose hard sessions on nonconsecutive dates, including the previous batch boundary. A date marked hardSessionAllowed false must be easy or rest.' : 'Consecutive hard days are permitted by the current setting.'}
5. Cover every listed date with training or explicit rest, then fill in workout details. Follow the additional constraints/guidance below when choosing sessions, volume, and progression. If guidance conflicts with enforced rules, the enforced rules take priority. Do not output planning notes; return only the final JSON batch.
EXACT ENFORCED RULES: ${JSON.stringify(rules)}
DATE-SPECIFIC LIMITS: ${JSON.stringify(days)}
ADDITIONAL CONSTRAINTS / GUIDANCE:
${text.slice(0, 20000) || '(none)'}`;
}
// Additional prose cannot be deterministically enforced. Require the athlete to
// classify it as guidance rather than implying arbitrary text has been validated.
export function constraintIssues(text: string, rules: Rules): string[] {
  const issues: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const value = line.replace(/^\s*[-*]\s*/, '').trim();
    if (!value || value.startsWith('#') || /^guidance:/i.test(value)) continue;
    const rest = value.match(/^(\d+) days? (?:a|per) week must be rest days?\.?$/i);
    const monday = value.match(/^Workouts on Mondays should be (\d+)\s*min(?:utes)? or less\.?$/i);
    if (rest) { if (Number(rest[1]) !== rules.restDays) issues.push('Rest-day text conflicts with the enforced rest-day setting.'); }
    else if (monday) { if (Number(monday[1]) !== rules.mondayMaxMinutes) issues.push('Monday text conflicts with the enforced duration setting.'); }
    else if (/^Long runs or rides happen on Saturday or Sunday\.?$/i.test(value)) { if (!rules.weekendLong) issues.push('Weekend long-session text conflicts with the enforced setting.'); }
    else if (/^Avoid two hard sessions on consecutive days\.?$/i.test(value)) { if (!rules.noConsecutiveHard) issues.push('Consecutive-hard-day text conflicts with the enforced setting.'); }
    else issues.push(`Unresolved scheduling rule: ${value}. Use the supported controls, or prefix advisory text with "guidance:".`);
  }
  return issues;
}
