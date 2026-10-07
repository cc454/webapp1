import { z } from 'zod';
export const parameterNames = ['warmupSeconds', 'workSeconds', 'repetitions', 'recoverySeconds', 'sets', 'setRecoverySeconds', 'cooldownSeconds', 'finishSeconds', 'intensityRpe'] as const;
const range = z.tuple([z.number().nonnegative(), z.number().nonnegative(), z.number().nonnegative()]).refine(([a,b,c]) => a <= b && b <= c, 'Range must be minimum, default, maximum');
const ranges = z.object(Object.fromEntries(parameterNames.map(k => [k, range])) as Record<typeof parameterNames[number], typeof range>).strict();
const pair = z.tuple([z.number().nonnegative(), z.number().nonnegative()]).refine(([a,b]) => a <= b, 'Minimum exceeds maximum');
const sport = z.object({ parameters: ranges, totalWorkSeconds: pair.nullable(), recoveryRatio: pair.nullable(), ftpPercent: range.nullable(), targetCue: z.string().min(1).max(1000) }).strict();
export const librarySchema = z.object({ version: z.literal(1), templates: z.array(z.object({
  id: z.string().regex(/^[A-Z][A-Z0-9_]{0,39}$/), name: z.string().min(1).max(100), goal: z.string().min(1).max(500),
  structure: z.enum(['continuous', 'interval', 'progressive']), intensity: z.enum(['easy', 'hard']), long: z.boolean(),
  progression: z.string().min(1).max(1000), sports: z.object({ run: sport, ride: sport }).strict(),
}).strict()).min(1).max(30) }).strict();
export const parametersSchema = z.object({
  warmupSeconds: z.number().int().nonnegative(), workSeconds: z.number().int().positive(), repetitions: z.number().int().min(1).max(30),
  recoverySeconds: z.number().int().nonnegative(), sets: z.number().int().min(1).max(3), setRecoverySeconds: z.number().int().nonnegative(),
  cooldownSeconds: z.number().int().nonnegative(), finishSeconds: z.number().int().nonnegative(), intensityRpe: z.number().min(1).max(10),
  ftpPercent: z.number().positive().nullable(),
}).strict();
export const progressionSchema = z.object({ id: z.string().min(1).max(50), templateId: z.string(), sport: z.enum(['run','ride']), approach: z.string().min(1).max(1000) });
export const outlineSchema = z.object({
  strategy: z.string().min(1).max(3000), constraintDecisions: z.array(z.string().min(1).max(500)).max(30), progressions: z.array(progressionSchema).max(60),
  variants: z.array(z.object({ id: z.string().min(1).max(50), templateId: z.string(), sport: z.enum(['run','ride']), progressionId: z.string(), prescription: z.string().min(1).max(500) })).max(100),
  patterns: z.array(z.object({ id: z.string().min(1).max(50), days: z.array(z.string().min(1)).min(1).max(7) })).min(1).max(100),
  weeks: z.array(z.object({ patternId: z.string(), phase: z.string().min(1).max(100), focus: z.string().min(1).max(300) })).min(1).max(1000),
});
export const blockSchema = z.object({ variantId: z.string(), parameters: parametersSchema, distanceKm: z.number().nonnegative() });
export const blocksSchema = z.object({ blocks: z.array(blockSchema).max(100) });
// Short wire format avoids billing repeated parameter names for every variant.
export const parameterResponseSchema = z.object({ blocks: z.array(z.object({
  variantId: z.string(), values: z.array(z.number().nonnegative().nullable()).length(10), distanceKm: z.number().nonnegative(),
})).max(100) });
export type WorkoutLibrary = z.infer<typeof librarySchema>;
export type WorkoutParameters = z.infer<typeof parametersSchema>;
export type TrainingOutline = z.infer<typeof outlineSchema>;
export type WorkoutBlock = z.infer<typeof blockSchema>;
