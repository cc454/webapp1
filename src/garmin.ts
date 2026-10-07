import CookieManager from '@preeternal/react-native-cookie-manager';
import { z } from 'zod';
import { GarminActivitySummary } from './types';
import { clearGarminSession, getGarminSession, saveGarminSession } from './storage';
const CONNECT = 'https://connect.garmin.com';
const SSO = 'https://sso.garmin.com/sso';
export class GarminError extends Error { }
async function request(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${CONNECT}${path}`, { ...init, credentials: 'include', signal: controller.signal, headers: { accept: 'application/json', ...init.headers } });
    if (response.status === 401 || response.status === 403) {
      await disconnect(); throw new GarminError('Garmin session expired. Sign in again in Settings.');
    }
    if (!response.ok) throw new GarminError(`Garmin request failed (${response.status}). Cached data was retained.`);
    return response;
  } catch (error) {
    if (controller.signal.aborted) throw new GarminError('Garmin timed out. Cached data was retained.');
    if (error instanceof TypeError) throw new GarminError('Unable to reach Garmin. Check your connection.');
    throw error;
  } finally { clearTimeout(timer); }
}
export async function disconnect() {
  await CookieManager.clearAll();
  await clearGarminSession();
}
function input(html: string, name: string) {
  for (const tag of html.match(/<input\b[^>]*>/gi) ?? []) {
    if (new RegExp(`name=["']${name}["']`, 'i').test(tag)) return tag.match(/value=["']([^"']*)/i)?.[1];
  }
  return undefined;
}
// Consumer web-session adapter: endpoints require physical-device feasibility testing.
export async function signIn(email: string, password: string) {
  if (!email.trim() || !password) throw new GarminError('Enter your Garmin email and password first.');
  await disconnect();
  const url = `${SSO}/signin?service=${encodeURIComponent(`${CONNECT}/modern/`)}&webhost=${encodeURIComponent(`${CONNECT}/modern/`)}&source=${encodeURIComponent(`${CONNECT}/signin/`)}&redirectAfterAccountLoginUrl=${encodeURIComponent(`${CONNECT}/modern/`)}&locale=en`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const page = await fetch(url, { credentials: 'include', signal: controller.signal });
    if (!page.ok) throw new GarminError('Could not open Garmin sign-in.');
    const csrf = input(await page.text(), '_csrf');
    if (!csrf) throw new GarminError('Garmin sign-in has changed. The native adapter needs updating.');
    const form = new URLSearchParams({ username: email.trim(), password, _csrf: csrf, embed: 'true' });
    const response = await fetch(url, { method: 'POST', credentials: 'include', signal: controller.signal, headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form.toString(), redirect: 'follow' });
    const html = await response.text();
    if (!response.ok || /invalid.*(username|password)|incorrect.*password/i.test(html)) throw new GarminError('Garmin rejected those credentials.');
    if (/multi.factor|verification code|one.time code/i.test(html)) throw new GarminError('This Garmin sign-in requires additional verification, which this adapter does not support yet.');
    // SSO returns a service ticket in HTML rather than an HTTP redirect.
    // Consume it only at our fixed Garmin service URL, never a supplied URL.
    const ticket = html.match(/\bticket=(ST-[a-zA-Z0-9._%-]+)/)?.[1];
    if (ticket) {
      const session = await fetch(`${CONNECT}/modern/?ticket=${encodeURIComponent(decodeURIComponent(ticket))}`, {
        credentials: 'include', signal: controller.signal, redirect: 'follow',
      });
      if (!session.ok) throw new GarminError('Garmin could not establish a Connect session.');
    }
    await CookieManager.flush();
    // A cookie alone is insufficient: prove access to the authenticated activity endpoint.
    await pullActivitySummaries(1);
    await saveGarminSession(JSON.stringify({ signedInAt: new Date().toISOString() }));
  } catch (error) {
    await disconnect();
    if (controller.signal.aborted) throw new GarminError('Garmin sign-in timed out.');
    throw error;
  } finally { clearTimeout(timer); }
}
export async function isConnected() { return Boolean(await getGarminSession()); }
const rawActivity = z.object({
  activityId: z.number().int(), activityName: z.string().optional(), activityType: z.object({ typeKey: z.string() }),
  startTimeLocal: z.string(), distance: z.number().nonnegative(), duration: z.number().nonnegative(),
  averageHR: z.number().nullish(), averageSpeed: z.number().nullish(), elevationGain: z.number().nullish(),
  avgPower: z.number().nullish(), averageBikingCadenceInRevPerMinute: z.number().nullish(), averageRunningCadenceInStepsPerMinute: z.number().nullish(),
});
export function mapActivities(value: unknown): GarminActivitySummary[] {
  const parsed = z.array(rawActivity).safeParse(value);
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
  const response = await request(`/modern/proxy/activitylist-service/activities/search/activities?start=0&limit=${Math.min(200, Math.max(1, limit))}`);
  try { return mapActivities(await response.json()); }
  catch (error) { if (error instanceof GarminError) throw error; throw new GarminError('Garmin returned unreadable activity data. Cached data was retained.'); }
}
