import { importPlan, trainingPlanTemplate } from '../src/trainingPlan';
import { applyTrainingProposal } from '../src/trainingProposal';

const rules = { restDays: 0, mondayMaxMinutes: 120, noConsecutiveHard: false, weekendLong: false };
const original = importPlan(trainingPlanTemplate.replace('Elevation: 25 m', 'Elevation: 25 m\n- Completed: yes\n- Exertion: 7'), rules, '2027-03-01');

test('copies a completed past example with blank completion history', () => {
  const copy = { action: 'copy', id: original.workouts[0]!.id, date: '2027-03-08' };
  const revised = applyTrainingProposal(original, JSON.stringify([copy]), '2027-03-02');
  expect(revised.workouts[1]).toMatchObject({ date: copy.date, completed: false, title: 'Aerobic run' });
  expect(revised.workouts[1]?.exertion).toBeUndefined();
  expect(original.workouts[0]?.exertion).toBe(7);
});

test('counts both dates of a move against the seven-day limit', () => {
  const plan = importPlan(trainingPlanTemplate, rules, '2027-03-01');
  const move = { action: 'move', id: plan.workouts[0]!.id, date: '2027-03-07' };
  expect(applyTrainingProposal(plan, JSON.stringify([move]), '2027-03-01').workouts[0]?.date).toBe(move.date);
  expect(() => applyTrainingProposal(plan, JSON.stringify([{ ...move, date: '2027-03-08' }]), '2027-03-01')).toThrow(/seven calendar days/);
  expect(() => applyTrainingProposal(original, JSON.stringify([move]), '2027-03-01')).toThrow(/incomplete workout/);
});
