import { acceptProposal, checkedPlan, planDiff, upcoming, validatePlan } from '../src/plan';
import { addDays, datesBetween, duration, today } from '../src/dates';
import { fixturePlan, session } from './fixtures';
describe('AT-08–15: dates and validated review', () => {
  it('handles leap days, year boundaries, long ranges, and reversed ranges', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01'); expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(datesBetween('2026-10-07', '2027-04-11')).toHaveLength(187);
    expect(datesBetween('2027-04-11', '2027-04-11')).toHaveLength(1);
    expect(datesBetween('2027-04-12', '2027-04-11')).toEqual([]);
    expect(duration(9000)).toBe('2h 30m'); expect(today(new Date(2026, 9, 7))).toBe('2026-10-07');
  });
  it('selects today through six following days', () => {
    const w = [-1, 0, 6, 7].map(i => session(addDays('2026-12-29', i)));
    expect(upcoming(w, '2026-12-29').map(x => x.date)).toEqual(['2026-12-29', '2027-01-04']);
  });
  it('accepts a complete consistent plan', () => { expect(validatePlan(fixturePlan())).toEqual([]); });
  it('rejects date gaps, duplicate IDs, and inconsistent overview volumes', () => {
    const plan = fixturePlan(); plan.workouts.pop(); plan.workouts[1]!.id = plan.workouts[0]!.id;
    expect(validatePlan(plan).join('\n')).toMatch(/Missing day/); expect(validatePlan(plan).join('\n')).toMatch(/Duplicate/); expect(validatePlan(plan).join('\n')).toMatch(/volume/);
  });
  it('enforces Monday cap, weekend long sessions, and consecutive hard days', () => {
    const plan = fixturePlan(); plan.workouts[0]!.durationSeconds = 3000; plan.workouts[0]!.long = true;
    plan.workouts[2]!.intensity = 'hard'; plan.workouts[3]!.intensity = 'hard';
    expect(validatePlan(plan).join('\n')).toMatch(/Monday/); expect(validatePlan(plan).join('\n')).toMatch(/weekend/); expect(validatePlan(plan).join('\n')).toMatch(/Consecutive/);
  });
  it('enforces rest quota and step totals', () => {
    const plan = fixturePlan(); plan.rules.restDays = 3; plan.workouts[0]!.steps = [{ kind: 'work', seconds: 20, repeats: 2, target: 'easy' }];
    expect(validatePlan(plan).join('\n')).toMatch(/rest days/); expect(validatePlan(plan).join('\n')).toMatch(/Step durations/);
  });
  it('does not prorate final partial-block quotas', () => {
    const plan = fixturePlan(); plan.start = plan.end; plan.workouts = [session(plan.end)]; plan.overview = [{ start: plan.end, end: plan.end, phase: 'Race', focus: 'Event', runningKm: 5, cyclingKm: 0 }];
    expect(validatePlan(plan)).toEqual([]);
  });
  it('rejects out-of-range and malformed dates', () => {
    const plan = fixturePlan(); plan.workouts[0]!.date = '2027-04-04'; expect(() => checkedPlan(plan)).toThrow('outside');
    plan.workouts[0]!.date = '2027-02-30'; expect(() => checkedPlan(plan)).toThrow();
  });
  it('accepts revisions without mutating source and preserves completed history', () => {
    const active = fixturePlan(); active.workouts[0]!.completed = true;
    const next = fixturePlan(); next.workouts[0]!.title = 'Changed'; next.workouts[2]!.title = 'Updated easy';
    const accepted = acceptProposal(active, next, active.event, active.rules);
    expect(active.workouts[2]!.title).toBe('Easy session'); expect(accepted.workouts[0]).toEqual(active.workouts[0]);
    expect(accepted.workouts[2]!.title).toBe('Updated easy'); expect(accepted.revision).toBe(2); expect(planDiff(active, next).join()).toContain('Updated easy');
  });
  it('rejects removing completed work or changing event/rules', () => {
    const active = fixturePlan(); active.workouts[0]!.completed = true; const next = fixturePlan(); next.workouts[0]!.id = 'replacement';
    expect(() => acceptProposal(active, next, active.event, active.rules)).toThrow('Completed');
    next.event.name = 'Other event'; expect(() => acceptProposal(active, next, active.event, active.rules)).toThrow('event');
  });
});
