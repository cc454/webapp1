import { Plan, Workout } from '../src/types';
import { defaultRules } from '../src/defaults';
import { addDays } from '../src/dates';
export const event = { name: 'Half marathon', date: '2027-04-11', distanceKm: 21.1, targetSeconds: 7200, elevationM: 10 };
export function session(date: string, sport: Workout['sport'] = 'run'): Workout {
  return { id: `${date}-${sport}`, date, sport, title: sport === 'rest' ? 'Rest' : 'Easy session', detail: 'Conversational effort.', durationSeconds: sport === 'rest' ? 0 : 1800, distanceKm: sport === 'rest' ? 0 : 5, intensity: sport === 'rest' ? 'rest' : 'easy', long: false, completed: false, steps: [] };
}
export function fixturePlan(): Plan {
  const start = '2027-04-05';
  const workouts = Array.from({ length: 7 }, (_, i) => session(addDays(start, i), i === 1 || i === 4 ? 'rest' : i === 3 ? 'ride' : 'run'));
  return { version: 1, revision: 1, event: { ...event }, start, end: event.date, rules: { ...defaultRules }, workouts,
    overview: [{ start, end: event.date, phase: 'Taper', focus: 'Arrive fresh', runningKm: 20, cyclingKm: 5 }] };
}
