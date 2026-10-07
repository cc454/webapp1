import { z } from 'zod';

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');
export const eventSchema = z.object({
  name: z.string().trim().min(1), date: isoDate, distanceKm: z.number().positive(),
  targetSeconds: z.number().int().positive(), elevationM: z.number().nonnegative(),
});
export const stepSchema = z.object({
  kind: z.enum(['warmup', 'work', 'recovery', 'cooldown']),
  seconds: z.number().int().positive(), repeats: z.number().int().min(1).max(100),
  target: z.string().max(300),
});
export const workoutSchema = z.object({
  id: z.string().min(1), date: isoDate, title: z.string().min(1).max(200),
  detail: z.string().max(3000), sport: z.enum(['run', 'ride', 'rest']),
  durationSeconds: z.number().int().nonnegative(), distanceKm: z.number().nonnegative(),
  intensity: z.enum(['easy', 'hard', 'rest']), long: z.boolean(),
  completed: z.boolean(), steps: z.array(stepSchema).max(100),
});
export const overviewSchema = z.object({
  start: isoDate, end: isoDate, phase: z.string().min(1), focus: z.string().min(1),
  runningKm: z.number().nonnegative(), cyclingKm: z.number().nonnegative(),
});
export const rulesSchema = z.object({
  restDays: z.number().int().min(0).max(7), mondayMaxMinutes: z.number().int().nonnegative(),
  weekendLong: z.boolean(), noConsecutiveHard: z.boolean(),
});
export const planSchema = z.object({
  version: z.literal(1), revision: z.number().int().min(1), event: eventSchema,
  start: isoDate, end: isoDate, rules: rulesSchema,
  workouts: z.array(workoutSchema).max(10000), overview: z.array(overviewSchema).min(1).max(1000),
});
export const activitySchema = z.object({
  id: z.number().int(), sport: z.enum(['run', 'ride']), name: z.string(), startedAt: z.string(),
  distanceKm: z.number().nonnegative(), durationSeconds: z.number().nonnegative(),
  averageHeartRate: z.number().optional(), speedKmh: z.number().optional(),
  elevationM: z.number().optional(), powerW: z.number().optional(), cadence: z.number().optional(),
});
export const messageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string(), at: z.string() });
export const threadSchema = z.object({ id: z.string(), title: z.string(), updatedAt: z.string(), messages: z.array(messageSchema) });
export const fitnessSchema = z.object({
  vo2: z.object({ running: z.number().positive().nullable(), cycling: z.number().positive().nullable(), fetchedAt: z.string() }).nullable(),
  power: z.object({ ftpW: z.number().positive().nullable(), wattsPerKg: z.number().positive().nullable(), date: z.string().nullable(), fetchedAt: z.string() }).nullable(),
  zones: z.object({ profiles: z.array(z.object({ sport: z.string(), maxHeartRate: z.number().positive().nullable(), floors: z.array(z.number().positive()).length(5) })), fetchedAt: z.string() }).nullable(),
  warnings: z.array(z.string()),
});
export type GarminFitness = z.infer<typeof fitnessSchema>;
export const stateSchema = z.object({
  version: z.literal(1), event: eventSchema.nullable(), plan: planSchema.nullable(),
  settings: z.object({ model: z.string().min(1), research: z.string(), constraints: z.string(), garminEmail: z.string(), rules: rulesSchema }),
  activities: z.array(activitySchema).transform(items => [...items].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 50)),
  fitness: fitnessSchema.default({ vo2: null, power: null, zones: null, warnings: [] }),
  lastSync: z.string().nullable(), threads: z.array(threadSchema).max(10),
});
export type EventDetails = z.infer<typeof eventSchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Rules = z.infer<typeof rulesSchema>;
export type GarminActivitySummary = z.infer<typeof activitySchema>;
export type ChatThread = z.infer<typeof threadSchema>;
export type Message = z.infer<typeof messageSchema>;
export type AppState = z.infer<typeof stateSchema>;
export type AppSettings = AppState['settings'];
export const generationDraftSchema = z.object({
  version: z.literal(1), signature: z.string(), request: z.string().default(''), start: isoDate, end: isoDate,
  workouts: z.array(workoutSchema), overview: z.array(overviewSchema),
});
export type GenerationDraft = z.infer<typeof generationDraftSchema>;
