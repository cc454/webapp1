import { z } from 'zod';
import { addDays, datesBetween, dayOfWeek, uid } from './dates';
import { isoDate, Plan, Workout } from './types';
import { updateSchedule } from './trainingPlan';

const prescription = z.object({
  title: z.string().trim().min(1).max(200),
  detail: z.string().max(3000),
  sport: z.enum(['run', 'ride']),
  workoutType: z.string().trim().min(1),
  durationSeconds: z.number().int().nonnegative(),
  distanceKm: z.number().nonnegative(),
  intensity: z.enum(['easy', 'hard']),
  long: z.boolean(),
}).refine(w => w.durationSeconds > 0 || w.distanceKm > 0, 'Supply duration or distance.');
const change = z.discriminatedUnion('action', [
  z.object({ action: z.literal('add'), date: isoDate, prescription }),
  z.object({ action: z.literal('copy'), date: isoDate, id: z.string() }),
  z.object({ action: z.literal('delete'), id: z.string() }),
  z.object({ action: z.literal('move'), id: z.string(), date: isoDate }),
  z.object({ action: z.literal('modify'), id: z.string(), prescription }),
]);
const proposalSchema = z.array(change).min(1).max(100);

export function applyTrainingProposal(plan: Plan, response: string, now: string): Plan {
  const text = response.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/, '$1');
  let json: unknown;
  try { json = JSON.parse(text); } catch { throw new Error('The coach did not return valid workout changes. Try generating a new proposal.'); }
  const result = proposalSchema.safeParse(json);
  if (!result.success) throw new Error('The coach returned invalid workout fields. Try generating a new proposal.');
  const workouts = new Map(plan.workouts.map(w => [w.id, w]));
  const touched = new Set<string>();
  const targets = new Set<string>();
  for (const operation of result.data) {
    if ('date' in operation) touched.add(operation.date);
    const source = 'id' in operation ? plan.workouts.find(w => w.id === operation.id) : undefined;
    if (operation.action === 'add' || operation.action === 'copy') {
      if (operation.action === 'copy' && (!source || source.sport === 'rest')) throw new Error('The coach tried to copy an unknown workout.');
      const id = uid();
      const fields = operation.action === 'add' ? { ...operation.prescription, steps: [] } : source!;
      workouts.set(id, { ...fields, id, date: operation.date, completed: false, completionNote: undefined, exertion: undefined });
      continue;
    }
    if (!source || source.completed || source.sport === 'rest' || targets.has(source.id)) throw new Error('A change must target a distinct incomplete workout.');
    targets.add(source.id);
    touched.add(source.date);
    if (operation.action === 'delete') workouts.delete(source.id);
    if (operation.action === 'move') workouts.set(source.id, { ...source, date: operation.date });
    if (operation.action === 'modify') workouts.set(source.id, { ...source, ...operation.prescription, steps: [] });
  }
  const days = [...touched].sort();
  const first = days[0]!;
  if (first < now || days.at(-1)! > addDays(first, 6)) throw new Error('All affected dates must be today or later and fit within seven calendar days.');
  const proposed = [...workouts.values()];
  const rules = plan.rules;
  const anchor = first < plan.start ? first : plan.start;
  const horizon = days.at(-1)! > plan.end ? days.at(-1)! : plan.end;
  const calendar = datesBetween(anchor, horizon);
  for (let index = 0; index + 7 <= calendar.length; index += 7) {
    const block = calendar.slice(index, index + 7);
    if (!block.some(day => touched.has(day))) continue;
    const rest = (sessions: Workout[]) => block.filter(day => !sessions.some(w => w.sport !== 'rest' && w.date === day)).length;
    if (rest(proposed) < Math.min(rules.restDays, rest(plan.workouts))) {
      throw new Error(`The proposal reduces rest below the weekly target starting ${block[0]}.`);
    }
  }
  for (const day of days) {
    const sessions = proposed.filter(w => w.date === day);
    if (rules.weekendLong && sessions.some(w => w.long) && ![0, 6].includes(dayOfWeek(day))) throw new Error(`Long workouts must be on weekends. Check ${day}.`);
    if (dayOfWeek(day) === 1 && sessions.reduce((total, w) => total + w.durationSeconds, 0) > rules.mondayMaxMinutes * 60) throw new Error(`Monday duration exceeds the limit on ${day}.`);
    if (rules.noConsecutiveHard && sessions.some(w => w.intensity === 'hard') &&
        proposed.some(w => w.intensity === 'hard' && (w.date === addDays(day, -1) || w.date === addDays(day, 1)))) throw new Error(`Hard workouts would be on consecutive days near ${day}.`);
  }
  return updateSchedule(plan, proposed);
}

export function trainingProposalPrompt(request: string, plan: Plan, today: string) {
  const workouts: Workout[] = plan.workouts.filter(w => w.sport !== 'rest');
  return `Return only a JSON array of workout changes. Today is ${today}. All affected dates (including move origin and destination) must fit one seven-day window, starting today or later. Modify, move and delete only incomplete workouts. Use existing workouts including past examples as sources. Use the most recent Garmin activity when available. Actions: {"action":"copy","id":"source id","date":"YYYY-MM-DD"}, {"action":"move","id":"target id","date":"YYYY-MM-DD"}, {"action":"delete","id":"target id"}, {"action":"add","date":"YYYY-MM-DD","prescription":{...}}, {"action":"modify","id":"target id","prescription":{...}}. Prescription fields: title, detail, sport ("run" or "ride"), workoutType, durationSeconds, distanceKm (use 0 if omitted), intensity ("easy" or "hard"), long (boolean). Rules: ${JSON.stringify(plan.rules)}. Existing workouts: ${JSON.stringify(workouts)}. Athlete request: ${request}`;
}
