import { z } from 'zod';
import { GarminActivitySummary } from './types';
import { authenticatedRequest as request, GarminError } from './garminAuth';
export { GarminError, signIn, isConnected, disconnect } from './garminAuth';
const rawActivity = z.object({
  activityId: z.number().int(), activityName: z.string().optional(), activityType: z.object({ typeKey: z.string() }),
  startTimeLocal: z.string(), distance: z.number().nonnegative(), duration: z.number().nonnegative(),
  averageHR: z.number().nullish(), averageSpeed: z.number().nullish(), elevationGain: z.number().nullish(),
  avgPower: z.number().nullish(), averageBikingCadenceInRevPerMinute: z.number().nullish(), averageRunningCadenceInStepsPerMinute: z.number().nullish(),
});
export function mapActivities(value: unknown): GarminActivitySummary[] {
  const envelope = z.array(z.object({ activityType: z.object({ typeKey: z.string() }) }).passthrough()).safeParse(value);
  if (!envelope.success) throw new GarminError('Garmin returned invalid activity data. Cached data was retained.');
  const parsed = z.array(rawActivity).safeParse(envelope.data.filter(a => /running|cycling|biking/.test(a.activityType.typeKey)));
  if (!parsed.success) throw new GarminError('Garmin returned invalid activity data. Cached data was retained.');
  const unique = new Map<number, GarminActivitySummary>();
  for (const a of parsed.data) {
    const type = a.activityType.typeKey;
    const sport = /running/.test(type) ? 'run' : /cycling|biking/.test(type) ? 'ride' : null;
    if (!sport) continue;
    unique.set(a.activityId, { id: a.activityId, sport, name: a.activityName ?? type, startedAt: a.startTimeLocal,
      distanceKm: a.distance / 1000, durationSeconds: a.duration,
      ...(a.averageHR ? { averageHeartRate: a.averageHR } : {}),
      ...(a.averageSpeed ? { speedKmh: a.averageSpeed * 3.6 } : {}),
      ...(a.elevationGain != null ? { elevationM: a.elevationGain } : {}),
      ...(a.avgPower != null ? { powerW: a.avgPower } : {}),
      ...((a.averageBikingCadenceInRevPerMinute ?? a.averageRunningCadenceInStepsPerMinute) != null ? { cadence: (a.averageBikingCadenceInRevPerMinute ?? a.averageRunningCadenceInStepsPerMinute)! } : {}),
    });
  }
  return [...unique.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
export async function pullActivitySummaries(limit = 100) {
  const response = await request(`/activitylist-service/activities/search/activities?start=0&limit=${Math.min(200, Math.max(1, limit))}`);
  try { return mapActivities(await response.json()); }
  catch (error) { if (error instanceof GarminError) throw error; throw new GarminError('Garmin returned unreadable activity data. Cached data was retained.'); }
}
