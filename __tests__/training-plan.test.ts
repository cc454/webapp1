import { activitySummary, importPlan, parseTrainingPlan, formatTrainingPlan, trainingPlanTemplate } from '../src/trainingPlan';
import { checkedPlan } from '../src/plan';
import { emptyState } from '../src/defaults';

const file = `# Spring

## Training goal
Build endurance.

## Schedule
### 2027-01-03
#### Run · Easy
- Title: Aerobic
- Duration: 30 min
- Completed: yes
- Completion note: Stopped early
- Exertion: 6

Felt comfortable.

#### Ride · Easy
- Title: Aerobic
- Distance: 25 km
`;

test('round-trips multiple workouts, duplicate titles and completion history', () => {
  const plan = parseTrainingPlan(file);
  expect(plan.workouts).toHaveLength(2);
  expect(plan.workouts[0]).toMatchObject({ completed: true, exertion: 6, description: 'Felt comfortable.' });
  expect(plan.workouts[1]).toMatchObject({ completed: false, distanceKm: 25 });
  expect(parseTrainingPlan(formatTrainingPlan(plan))).toEqual(plan);
});

test.each([
  ['missing title', file.replace('# Spring', '')],
  ['missing goal', file.replace('## Training goal\nBuild endurance.', '')],
  ['invalid date', file.replace('2027-01-03', '2027-02-30')],
  ['missing measurement', file.replace('- Distance: 25 km', '')],
  ['invalid exertion', file.replace('Exertion: 6', 'Exertion: 11')],
])('rejects %s', (_, input) => {
  expect(() => parseTrainingPlan(input)).toThrow();
});

test('accepts a saved imported plan with omitted rest dates and distance-only sessions', () => {
  const sparse = file.replace('#### Ride · Easy', '### 2027-01-06\n#### Ride · Easy');
  const plan = importPlan(sparse, emptyState().settings.rules, '2027-01-03');
  expect(checkedPlan(JSON.parse(JSON.stringify(plan)))).toMatchObject({
    title: 'Spring', start: '2027-01-03', end: '2027-01-06',
    workouts: [{ completed: true, exertion: 6 }, { distanceKm: 25, durationSeconds: 0 }],
  });
});

test('exports matching activity dates and units with missing heart rate left blank', () => {
  const activities = [{ id: 1, sport: 'ride' as const, name: 'Ride', startedAt: '2027-01-03T12:00:00',
    durationSeconds: 1800, distanceKm: 12, elevationM: 80 }];
  expect(activitySummary(activities, 'csv')).toContain('2027-01-03,Ride,0:30,12,02:30 / km,80,\r\n');
  expect(activitySummary(activities, 'md')).toContain('| 2027-01-03 | Ride | 0:30 | 12 | 02:30 / km | 80 |  |');
});

test('imports the downloadable template with clock duration, pace and elevation', () => {
  const plan = importPlan(trainingPlanTemplate, emptyState().settings.rules, '2027-03-01');
  expect(plan.workouts[0]).toMatchObject({ durationSeconds: 1800, distanceKm: 5, paceSecondsPerKm: 360, elevationM: 25 });
});

test.each(['124.48 min', '7469 s', '2:04:29'])('imports and preserves Garmin ride duration %s', value => {
  const source = file.replace('2027-01-03', '2026-10-07').replace('Run · Easy', 'Ride · Completed')
    .replace('Title: Aerobic', 'Title: Completed ride (Garmin)').replace('Duration: 30 min', `Duration: ${value}\n- Distance: 56.37 km`);
  const plan = parseTrainingPlan(source);
  expect(plan.workouts[0]).toMatchObject({ durationSeconds: 7469, distanceKm: 56.37, completed: true });
  expect(formatTrainingPlan(plan)).toContain('Duration: 2:04:29');
  expect(parseTrainingPlan(formatTrainingPlan(plan))).toEqual(plan);
});
