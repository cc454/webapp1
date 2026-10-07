import { Rules } from './types';
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
