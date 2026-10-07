import { z } from 'zod';
import { GarminActivitySummary, GarminFitness } from './types';
import { today } from './dates';
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
  return [...unique.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 50);
}
export async function pullActivitySummaries(limit = 50) {
  const response = await request(`/activitylist-service/activities/search/activities?start=0&limit=${Math.min(50, Math.max(1, Math.floor(limit)))}`);
  try { return mapActivities(await response.json()); }
  catch (error) { if (error instanceof GarminError) throw error; throw new GarminError('Garmin returned unreadable activity data. Cached data was retained.'); }
}

const positive = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
const object = (value: unknown): Record<string, any> => {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid metric object');
  return value;
};
export function mapVo2(value: unknown): { running: number | null; cycling: number | null } {
  const data = object(value);
  const recent = object(data.mostRecentVO2Max);
  const read = (sport: string) => { const entry = object(recent[sport]); return positive(entry.vo2MaxPreciseValue) ?? positive(entry.vo2MaxValue); };
  return { running: read('generic') ?? read('running'), cycling: read('cycling') };
}
export function mapPower(value: unknown): { ftpW: number | null; wattsPerKg: number | null; date: string | null } {
  if (value == null) return { ftpW: null, wattsPerKg: null, date: null };
  const records = Array.isArray(value) ? value.map(object) : [object(value)];
  const cycling = records.filter(entry => /^cycling$/i.test(entry.sport ?? '')).sort((a, b) => String(b.calendarDate ?? '').localeCompare(String(a.calendarDate ?? '')))[0];
  const ftpW = positive(cycling?.functionalThresholdPower);
  const weightKg = positive(cycling?.weight);
  return { ftpW, wattsPerKg: positive(cycling?.powerToWeight) ?? (ftpW && weightKg ? ftpW / weightKg : null), date: typeof cycling?.calendarDate === 'string' ? cycling.calendarDate : null };
}
export function mapZones(value: unknown): NonNullable<GarminFitness['zones']>['profiles'] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error('Invalid zone profiles');
  return value.map(item => {
    const data = object(item);
    const floors = [1, 2, 3, 4, 5].map(n => positive(data[`zone${n}Floor`]));
    if (typeof data.sport !== 'string' || floors.some(v => v == null) || floors.some((v, i) => i > 0 && v! <= floors[i - 1]!)) throw new Error('Invalid zone boundaries');
    const maxHeartRate = positive(data.maxHeartRateUsed);
    if (maxHeartRate != null && maxHeartRate < floors[4]!) throw new Error('Invalid maximum heart rate');
    return { sport: data.sport, floors: floors as number[], maxHeartRate };
  });
}
export async function pullFitness(previous: GarminFitness): Promise<GarminFitness> {
  const result: GarminFitness = { ...previous, warnings: [] };
  const fetchedAt = new Date().toISOString();
  const date = today();
  // Sequential requests avoid racing refresh-token rotation. Optional endpoints
  // can fail independently without discarding a successful activity import.
  try {
    let vo2: ReturnType<typeof mapVo2> = { running: null, cycling: null };
    let statusAvailable = false;
    try {
      vo2 = mapVo2(await (await request(`/metrics-service/metrics/trainingstatus/aggregated/${date}`)).json());
      statusAvailable = true;
    } catch { /* Some devices/accounts only expose VO2 in their user profile. */ }
    if (vo2.running == null || vo2.cycling == null) {
      try {
        const profile = object(await (await request('/userprofile-service/userprofile/user-settings')).json());
        const data = object(profile.userData);
        vo2 = { running: vo2.running ?? positive(data.vo2MaxRunning), cycling: vo2.cycling ?? positive(data.vo2MaxCycling) };
      } catch {
        if (!statusAvailable) throw new Error('No VO2 endpoint available');
        result.warnings.push('VO₂ max profile fallback unavailable.');
      }
    }
    result.vo2 = { ...vo2, fetchedAt };
  } catch { result.warnings.push('VO₂ max refresh failed; any cached value is retained.'); }
  try { result.power = { ...mapPower(await (await request(`/biometric-service/biometric/powerToWeight/latest/${date}`)).json()), fetchedAt }; }
  catch { result.warnings.push('Cycling FTP/kg refresh failed; any cached value is retained.'); }
  try { result.zones = { profiles: mapZones(await (await request('/biometric-service/heartRateZones')).json()), fetchedAt }; }
  catch { result.warnings.push('Heart-rate zone refresh failed; any cached value is retained.'); }
  return result;
}
