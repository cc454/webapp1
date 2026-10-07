import { z } from 'zod';
import { clearGarminSession, getGarminSession, saveGarminSession } from './storage';

export class GarminError extends Error { }
const TOKEN_URL = 'https://diauth.garmin.com/di-oauth2-service/oauth/token';
const SERVICE = 'https://mobile.integration.garmin.com/gcm/ios';
const sessionSchema = z.object({
  version: z.literal(1), accessToken: z.string().min(1), refreshToken: z.string().optional(),
  clientId: z.string().min(1), expiresAt: z.number().optional(),
});
type Session = z.infer<typeof sessionSchema>;
const tokenSchema = z.object({ access_token: z.string().min(1), refresh_token: z.string().optional(), expires_in: z.number().positive().optional() });

async function timedFetch(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  catch (error) {
    if (controller.signal.aborted) throw new GarminError('Garmin timed out. Cached activities were retained.');
    if (error instanceof TypeError) throw new GarminError('Unable to reach Garmin. Check your connection.');
    throw error;
  } finally { clearTimeout(timer); }
}
async function session(): Promise<Session | null> {
  const saved = await getGarminSession();
  if (!saved) return null;
  try { return sessionSchema.parse(JSON.parse(saved)); } catch { return null; }
}
export async function isConnected() { return Boolean(await session()); }
export async function disconnect() { await clearGarminSession(); }
function fromToken(data: unknown, clientId: string, previousRefresh?: string): Session {
  const token = tokenSchema.safeParse(data);
  if (!token.success) throw new GarminError('Garmin returned an invalid token response. Sign in again.');
  return { version: 1, clientId, accessToken: token.data.access_token,
    refreshToken: token.data.refresh_token ?? previousRefresh,
    ...(token.data.expires_in ? { expiresAt: Date.now() + token.data.expires_in * 1000 } : {}) };
}
async function exchange(form: URLSearchParams, clientId: string) {
  return timedFetch(TOKEN_URL, { method: 'POST', credentials: 'omit',
    headers: { Authorization: `Basic ${btoa(`${clientId}:`)}`, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form.toString() });
}
async function refresh(current: Session): Promise<Session> {
  if (!current.refreshToken) { await disconnect(); throw new GarminError('Garmin session expired. Connect again in Settings.'); }
  const response = await exchange(new URLSearchParams({ grant_type: 'refresh_token', client_id: current.clientId, refresh_token: current.refreshToken }), current.clientId);
  if (!response.ok) {
    if (response.status === 400 || response.status === 401) await disconnect();
    throw new GarminError(`Garmin token refresh failed (HTTP ${response.status}). Connect again if the session expired. Cached activities were retained.`);
  }
  const updated = fromToken(await response.json(), current.clientId, current.refreshToken);
  await saveGarminSession(JSON.stringify(updated)); return updated;
}
async function api(path: string, current: Session) {
  return timedFetch(`https://connectapi.garmin.com${path}`, { credentials: 'omit', headers: { Accept: 'application/json', Authorization: `Bearer ${current.accessToken}`, NK: 'NT' } });
}
export async function authenticatedRequest(path: string) {
  let current = await session();
  if (!current) throw new GarminError('Connect Garmin in Settings first.');
  if (current.expiresAt && current.expiresAt <= Date.now() + 30000) current = await refresh(current);
  let response = await api(path, current);
  if (response.status === 401) { current = await refresh(current); response = await api(path, current); }
  if (response.status === 401) { await disconnect(); throw new GarminError('Garmin session expired. Connect again in Settings.'); }
  if (!response.ok) throw new GarminError(`Garmin activity request failed (HTTP ${response.status}). Cached activities were retained.`);
  return response;
}
// Current mobile service-ticket flow, isolated because Garmin's consumer API
// is private. Account compatibility must be confirmed on the owner's phone.
export async function signIn(email: string, password: string) {
  if (!email.trim() || !password) throw new GarminError('Enter your Garmin email and password first.');
  await disconnect();
  const params = new URLSearchParams({ clientId: 'GCM_IOS_DARK', locale: 'en-US', service: SERVICE });
  const response = await timedFetch(`https://sso.garmin.com/mobile/api/login?${params}`, {
    method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email.trim(), password, rememberMe: true, captchaToken: '' }),
  });
  if (!response.ok) throw new GarminError(response.status === 403 ? 'Garmin blocked the sign-in request (HTTP 403). This is not proof of a wrong password.' : `Garmin sign-in failed (HTTP ${response.status}).`);
  let login: any;
  try { login = await response.json(); } catch { throw new GarminError('Garmin sign-in returned a browser challenge instead of JSON.'); }
  const status = login.responseStatus?.type;
  if (status === 'INVALID_USERNAME_PASSWORD') throw new GarminError('Garmin rejected those credentials.');
  if (status === 'MFA_REQUIRED') throw new GarminError('Garmin requires additional verification for this login.');
  if (status === 'CAPTCHA_REQUIRED') throw new GarminError('Garmin requires a browser challenge for this login.');
  if (status !== 'SUCCESSFUL' || typeof login.serviceTicketId !== 'string' || !/^ST-[\w.-]+$/.test(login.serviceTicketId)) throw new GarminError('Garmin did not return a valid sign-in ticket.');
  const clients = ['GARMIN_CONNECT_MOBILE_ANDROID_DI_2025Q2', 'GARMIN_CONNECT_MOBILE_ANDROID_DI_2024Q4', 'GARMIN_CONNECT_MOBILE_ANDROID_DI', 'GARMIN_CONNECT_MOBILE_IOS_DI'];
  let lastStatus = 0;
  for (const clientId of clients) {
    const tokenResponse = await exchange(new URLSearchParams({ client_id: clientId, service_ticket: login.serviceTicketId,
      grant_type: 'https://connectapi.garmin.com/di-oauth2-service/oauth/grant/service_ticket', service_url: SERVICE }), clientId);
    lastStatus = tokenResponse.status;
    if (!tokenResponse.ok) { if (lastStatus === 429 || lastStatus >= 500) break; continue; }
    const current = fromToken(await tokenResponse.json(), clientId);
    // Verify account access before marking the session connected.
    const profile = await api('/userprofile-service/socialProfile', current);
    if (!profile.ok) throw new GarminError(`Garmin account verification failed (HTTP ${profile.status}).`);
    const profileData = await profile.json().catch(() => null);
    if (!profileData || typeof profileData !== 'object' || !('displayName' in profileData || 'id' in profileData)) throw new GarminError('Garmin returned an invalid account profile.');
    await saveGarminSession(JSON.stringify(current)); return;
  }
  throw new GarminError(`Garmin token exchange failed (HTTP ${lastStatus}). No session was saved.`);
}
