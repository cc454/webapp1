import { Plan, Rules, Workout, planSchema } from './types';
import { addDays, datesBetween, dayOfWeek, today } from './dates';

export function validatePlan(plan: Plan): string[] {
  const errors: string[] = [];
  if (plan.start > plan.end || plan.end !== plan.event.date) errors.push('Plan dates must end on the event date.');
  const dates = datesBetween(plan.start, plan.end);
  const ids = new Set<string>();
  for (const w of plan.workouts) {
    if (ids.has(w.id)) errors.push(`Duplicate workout ID: ${w.id}`);
    ids.add(w.id);
    if (w.date < plan.start || w.date > plan.end) errors.push(`Workout outside plan: ${w.date}`);
    if (w.sport === 'rest' && (w.durationSeconds !== 0 || w.distanceKm !== 0 || w.intensity !== 'rest' || w.steps.length)) errors.push(`Invalid rest day: ${w.date}`);
    if (w.sport !== 'rest' && (w.durationSeconds <= 0 || w.intensity === 'rest')) errors.push(`Invalid active session: ${w.date}`);
    if (w.steps.length && w.steps.reduce((n, s) => n + s.seconds * s.repeats, 0) !== w.durationSeconds) errors.push(`Step durations do not match session: ${w.date}`);
    if (w.long && plan.rules.weekendLong && ![0, 6].includes(dayOfWeek(w.date))) errors.push(`Long session must be on a weekend: ${w.date}`);
  }
  for (const date of dates) {
    const sessions = plan.workouts.filter(w => w.date === date);
    if (!sessions.length) errors.push(`Missing day: ${date}`);
    if (sessions.some(w => w.sport === 'rest') && sessions.length > 1) errors.push(`Rest and training overlap: ${date}`);
    if (dayOfWeek(date) === 1 && sessions.reduce((n, w) => n + w.durationSeconds, 0) > plan.rules.mondayMaxMinutes * 60) errors.push(`Monday exceeds ${plan.rules.mondayMaxMinutes} minutes: ${date}`);
    if (plan.rules.noConsecutiveHard && sessions.some(w => w.intensity === 'hard') && plan.workouts.some(w => w.date === addDays(date, -1) && w.intensity === 'hard')) errors.push(`Consecutive hard days: ${date}`);
  }
  // Rest quota applies to complete seven-day blocks anchored at plan creation.
  // Partial final blocks retain the daily/intensity rules without a prorated quota.
  for (let i = 0; i + 7 <= dates.length; i += 7) {
    const block = dates.slice(i, i + 7);
    if (block.filter(d => plan.workouts.some(w => w.date === d && w.sport === 'rest')).length < plan.rules.restDays) errors.push(`Not enough rest days in block starting ${block[0]}`);
  }
  const covered = plan.overview.flatMap(w => datesBetween(w.start, w.end));
  if (covered.join(',') !== dates.join(',')) errors.push('Overview must cover the plan exactly in order, without gaps or overlaps.');
  for (const week of plan.overview) {
    const sessions = plan.workouts.filter(w => w.date >= week.start && w.date <= week.end);
    for (const [sport, volume] of [['run', week.runningKm], ['ride', week.cyclingKm]] as const) {
      if (Math.abs(sessions.filter(w => w.sport === sport).reduce((n, w) => n + w.distanceKm, 0) - volume) > 0.1) errors.push(`Overview ${sport} volume does not match workouts: ${week.start}`);
    }
  }
  return [...new Set(errors)];
}
export function checkedPlan(value: unknown): Plan {
  const plan = planSchema.parse(value);
  const errors = validatePlan(plan);
  if (errors.length) throw new Error(errors.slice(0, 12).join('\n'));
  return plan;
}
export function acceptProposal(active: Plan | null, proposal: Plan, expectedEvent: Plan['event'], rules: Rules): Plan {
  if (JSON.stringify(proposal.event) !== JSON.stringify(expectedEvent)) throw new Error('Proposal changed the event.');
  if (JSON.stringify(proposal.rules) !== JSON.stringify(rules)) throw new Error('Proposal changed the enforced rules.');
  if (active && (active.start !== proposal.start || active.end !== proposal.end)) throw new Error('A revision must preserve the plan interval.');
  const workouts = proposal.workouts.map(w => ({ ...w, completed: active?.workouts.find(old => old.id === w.id)?.completed ?? false }));
  for (const old of active?.workouts.filter(w => w.completed) ?? []) {
    const match = workouts.findIndex(w => w.id === old.id);
    if (match < 0) throw new Error(`Completed workout removed: ${old.title}`);
    workouts[match] = old;
  }
  return checkedPlan({ ...proposal, workouts, revision: (active?.revision ?? 0) + 1 });
}
export const upcoming = (workouts: Workout[], date = today()) => workouts.filter(w => w.date >= date && w.date <= addDays(date, 6));
export function planDiff(active: Plan | null, next: Plan) {
  if (!active) return [`New plan: ${next.start} → ${next.end}`, `${next.workouts.length} sessions / rest days`];
  const changes: string[] = [];
  for (const w of next.workouts) {
    const old = active.workouts.find(o => o.id === w.id);
    if (!old) changes.push(`Add ${w.date}: ${w.title}`);
    else if (JSON.stringify({ ...old, completed: false }) !== JSON.stringify({ ...w, completed: false })) changes.push(`Change ${w.date}: ${old.title} → ${w.title}`);
  }
  for (const w of active.workouts) if (!next.workouts.some(n => n.id === w.id)) changes.push(`Remove ${w.date}: ${w.title}`);
  return changes.length ? changes : ['No workout changes.'];
}
