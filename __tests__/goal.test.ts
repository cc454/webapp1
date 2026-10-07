import { parseGoalMarkdown } from '../src/goal';
import { pace } from '../src/dates';
const goal = 'name: Halbmarathon\ndate: April 11, 2027\ndistance: 21.1 km\ntarget time: 2:00\nelevation: 10 m\npace: 5:30 / km';
describe('AT-03–06: event inputs', () => {
  it('uses the actual goal and calculates pace instead of trusting legacy text', () => {
    const event = parseGoalMarkdown(goal, '2026-10-07');
    expect(event.date).toBe('2027-04-11'); expect(pace(event.targetSeconds, event.distanceKm)).toBe('5:41 / km');
  });
  it('supports aliases, ISO dates, seconds, and comma-separated metric elevation', () => {
    const result = parseGoalMarkdown('event name: Race\ntarget date: 2027-04-11\ndistance: 10 km\ntime: 1:00:30\ngain: 1,000 m', '2026-10-07');
    expect(result.targetSeconds).toBe(3630); expect(result.elevationM).toBe(1000);
  });
  it.each(['name', 'date', 'distance', 'target time', 'elevation'])('rejects missing %s without requiring legacy pace', field => {
    expect(() => parseGoalMarkdown(goal.split('\n').filter(l => !l.startsWith(`${field}:`)).join('\n'), '2026-10-07')).toThrow('missing');
  });
  it.each([['date: April 11, 2027', 'date: 2027-02-30'], ['distance: 21.1 km', 'distance: 0 km'], ['target time: 2:00', 'target time: 0:00'], ['target time: 2:00', 'target time: 2:60'], ['elevation: 10 m', 'elevation: -10 m']])('rejects invalid quantities', (before, after) => {
    expect(() => parseGoalMarkdown(goal.replace(before, after), '2026-10-07')).toThrow();
  });
  it('rejects past dates and accepts an event today', () => {
    expect(() => parseGoalMarkdown(goal, '2027-04-12')).toThrow('past');
    expect(parseGoalMarkdown(goal, '2027-04-11').date).toBe('2027-04-11');
  });
});
