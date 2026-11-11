import { today as localToday, uid } from './dates';
import { planSchema, isoDate } from './types';

export type TrainingWorkout = {
  date: string;
  sport: 'Run' | 'Ride';
  type: string;
  title: string;
  description: string;
  durationSeconds?: number;
  distanceKm?: number;
  completed: boolean;
  completionNote?: string;
  exertion?: number;
};

export type TrainingPlan = {
  title: string;
  trainingGoal?: string;
  eventGoal?: string;
  workouts: TrainingWorkout[];
};

export const trainingPlanTemplate = `# Spring endurance

## Training goal
Build aerobic endurance.

## Schedule
### 2027-03-01
#### Run · Easy
- Title: Aerobic run
- Duration: 30 min
- Distance: 5 km

Keep the effort conversational.
`;

export function parseTrainingPlan(input: string): TrainingPlan {
  const lines = input.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const title = /^# (.+)$/.exec(lines.shift() ?? '')?.[1]?.trim();
  if (!title) throw new Error('Start the plan with a title on a line beginning with #.');
  const plan: TrainingPlan = { title, workouts: [] };
  let index = 0;
  while (index < lines.length && lines[index]?.trim() !== '## Schedule') {
    const heading = lines[index++]!.trim();
    if (!heading) continue;
    const key = heading === '## Training goal' ? 'trainingGoal' : heading === '## Event goal' ? 'eventGoal' : null;
    if (!key || plan[key]) throw new Error('Place one Training goal or Event goal section, or both, above ## Schedule.');
    const body: string[] = [];
    while (index < lines.length && !/^##\s/.test(lines[index]!)) body.push(lines[index++]!);
    const goal = body.join('\n').trim();
    if (!goal) throw new Error(`Write a goal under ${heading}.`);
    plan[key] = goal;
  }
  if ((!plan.trainingGoal && !plan.eventGoal) || index === lines.length) {
    throw new Error('Add a Training goal or Event goal followed by ## Schedule.');
  }

  let date = '';
  const dates = new Set<string>();
  index++;
  while (index < lines.length) {
    const line = lines[index++]!.trim();
    if (!line) continue;
    if (line.startsWith('### ')) {
      date = line.slice(4);
      if (!isoDate.safeParse(date).success || dates.has(date)) {
        throw new Error(`Use a unique YYYY-MM-DD date heading. Check ${date}.`);
      }
      dates.add(date);
      continue;
    }

    const heading = /^#### (Run|Ride) · (.+)$/.exec(line);
    if (!date || !heading) throw new Error('Place each workout under a date with a heading such as #### Run · Easy.');
    const fields = new Map<string, string>();
    while (index < lines.length) {
      const field = /^- (Title|Duration|Distance|Completed|Completion note|Exertion):\s*(.*)$/.exec(lines[index]!);
      if (!field) break;
      if (fields.has(field[1]!)) throw new Error(`Use one ${field[1]!} field per workout on ${date}.`);
      fields.set(field[1]!, field[2]!.trim());
      index++;
    }
    const name = fields.get('Title');
    if (!name) throw new Error(`Add a Title to the workout on ${date}.`);
    const duration = fields.get('Duration');
    const durationMatch = /^(\d+(?:\.\d+)?) (s|min|h)$/.exec(duration ?? '');
    const durationSeconds = durationMatch ? Number(durationMatch[1]) * { s: 1, min: 60, h: 3600 }[durationMatch[2] as 's' | 'min' | 'h'] : undefined;
    const distance = fields.get('Distance');
    const distanceMatch = /^(\d+(?:\.\d+)?) km$/.exec(distance ?? '');
    const distanceKm = distanceMatch ? Number(distanceMatch[1]) : undefined;
    if ((duration !== undefined && (!durationSeconds || !Number.isSafeInteger(durationSeconds))) ||
        (distance !== undefined && (!distanceKm || !Number.isFinite(distanceKm))) ||
        (!durationSeconds && !distanceKm)) {
      throw new Error(`Add a positive Duration in s, min or h, or Distance in km, to ${name} on ${date}.`);
    }
    const completed = fields.get('Completed');
    if (completed !== undefined && completed !== 'yes' && completed !== 'no') {
      throw new Error(`Use yes or no for Completed on ${date}.`);
    }
    const effort = fields.get('Exertion');
    if (effort !== undefined && !/^(?:[1-9]|10)$/.test(effort)) {
      throw new Error(`Use a whole number from 1 to 10 for Exertion on ${date}.`);
    }
    const notes: string[] = [];
    while (index < lines.length && !/^#{3,4}\s/.test(lines[index]!)) {
      notes.push(lines[index++]!.replace(/^\\(?=\\|#{3,4}\s)/, ''));
    }
    plan.workouts.push({
      date,
      sport: heading[1] as TrainingWorkout['sport'],
      type: heading[2]!.trim(),
      title: name,
      description: notes.join('\n').trim(),
      durationSeconds,
      distanceKm,
      completed: completed === 'yes',
      completionNote: fields.get('Completion note') || undefined,
      exertion: effort === undefined ? undefined : Number(effort),
    });
  }
  plan.workouts.sort((a, b) => a.date.localeCompare(b.date));
  return plan;
}

export function formatTrainingPlan(plan: TrainingPlan): string {
  const lines = [`# ${plan.title}`];
  if (plan.trainingGoal) lines.push('', '## Training goal', plan.trainingGoal);
  if (plan.eventGoal) lines.push('', '## Event goal', plan.eventGoal);
  lines.push('', '## Schedule');
  let date = '';
  for (const workout of [...plan.workouts].sort((a, b) => a.date.localeCompare(b.date))) {
    if (workout.date !== date) {
      date = workout.date;
      lines.push('', `### ${date}`);
    }
    lines.push('', `#### ${workout.sport} · ${workout.type}`, `- Title: ${workout.title}`);
    if (workout.durationSeconds !== undefined) lines.push(`- Duration: ${workout.durationSeconds} s`);
    if (workout.distanceKm !== undefined) lines.push(`- Distance: ${workout.distanceKm} km`);
    lines.push(`- Completed: ${workout.completed ? 'yes' : 'no'}`);
    if (workout.completionNote) lines.push(`- Completion note: ${workout.completionNote}`);
    if (workout.exertion !== undefined) lines.push(`- Exertion: ${workout.exertion}`);
    if (workout.description) lines.push('', workout.description.replace(/^(?=\\|#{3,4}\s)/gm, '\\'));
  }
  return lines.join('\n') + '\n';
}

export function toMarkdownPlan(plan: import('./types').Plan): TrainingPlan {
  return {
    title: plan.title ?? plan.event.name,
    trainingGoal: plan.trainingGoal,
    eventGoal: plan.eventGoal ?? (plan.trainingGoal ? undefined :
      `${plan.event.name} on ${plan.event.date} · ${plan.event.distanceKm} km · ${plan.event.elevationM} m gain · Target ${plan.event.targetSeconds} s`),
    workouts: plan.workouts.filter(workout => workout.sport !== 'rest').map(workout => ({
      date: workout.date,
      sport: workout.sport === 'run' ? 'Run' : 'Ride',
      type: workout.workoutType ?? (workout.intensity === 'hard' ? 'Hard' : 'Easy'),
      title: workout.title,
      description: [workout.detail, ...workout.steps.map(step => `- ${step.repeats} × ${step.seconds} s ${step.kind} · ${step.target}`)].filter(Boolean).join('\n'),
      durationSeconds: workout.durationSeconds || undefined,
      distanceKm: workout.distanceKm || undefined,
      completed: workout.completed,
      completionNote: workout.completionNote,
      exertion: workout.exertion,
    })),
  };
}

export function importPlan(input: string, rules: import('./types').Rules, fallbackDate: string): import('./types').Plan {
  const source = parseTrainingPlan(input);
  const start = source.workouts[0]?.date ?? fallbackDate;
  const end = source.workouts.at(-1)?.date ?? start;
  const workouts = source.workouts.map((workout): import('./types').Workout => ({
    id: uid(), date: workout.date, title: workout.title, detail: workout.description,
    sport: workout.sport === 'Run' ? 'run' : 'ride', workoutType: workout.type,
    durationSeconds: workout.durationSeconds ?? 0, distanceKm: workout.distanceKm ?? 0,
    intensity: /hard|threshold|interval|tempo|sprint/i.test(workout.type) ? 'hard' : 'easy',
    long: /long/i.test(workout.type), steps: [],
    completed: workout.completed, completionNote: workout.completionNote, exertion: workout.exertion,
  }));
  return planSchema.parse({
    version: 1, revision: 1, title: source.title, trainingGoal: source.trainingGoal, eventGoal: source.eventGoal,
    start, end, rules, workouts,
    event: { name: source.title, date: end, distanceKm: 1, elevationM: 0, targetSeconds: 1 },
    overview: [{ start, end, phase: 'Imported schedule', focus: source.trainingGoal ?? source.eventGoal!,
      runningKm: workouts.filter(w => w.sport === 'run').reduce((total, w) => total + w.distanceKm, 0),
      cyclingKm: workouts.filter(w => w.sport === 'ride').reduce((total, w) => total + w.distanceKm, 0) }],
  });
}

export function updateSchedule(plan: import('./types').Plan, workouts: import('./types').Workout[]) {
  const ordered = workouts.filter(w => w.sport !== 'rest').sort((a, b) => a.date.localeCompare(b.date));
  const start = ordered[0]?.date ?? plan.start;
  const end = ordered.at(-1)?.date ?? start;
  const title = plan.title ?? plan.event.name;
  const eventGoal = plan.title ? plan.eventGoal : toMarkdownPlan(plan).eventGoal;
  const overview = [{
    start, end, phase: 'Active schedule', focus: plan.trainingGoal ?? eventGoal ?? title,
    runningKm: ordered.filter(w => w.sport === 'run').reduce((sum, w) => sum + w.distanceKm, 0),
    cyclingKm: ordered.filter(w => w.sport === 'ride').reduce((sum, w) => sum + w.distanceKm, 0),
  }];
  return planSchema.parse({ ...plan, title, eventGoal, start, end, overview, revision: plan.revision + 1, workouts: ordered });
}

export function activitySummary(activities: import('./types').GarminActivitySummary[], kind: 'csv' | 'md') {
  const headers = ['Date', 'Sport', 'Duration (s)', 'Distance (km)', 'Average HR (bpm)'];
  const rows = activities.map(activity => {
    const date = new Date(activity.startedAt);
    const localDate = Number.isFinite(date.valueOf()) ? localToday(date) : '';
    return [localDate, activity.sport === 'run' ? 'Run' : 'Ride', activity.durationSeconds, activity.distanceKm, activity.averageHeartRate ?? ''];
  });
  return kind === 'csv' ? [headers, ...rows].map(row => row.join(',')).join('\r\n') + '\r\n' :
    [headers, headers.map(() => '---'), ...rows].map(row => '| ' + row.join(' | ') + ' |').join('\n') + '\n';
}
