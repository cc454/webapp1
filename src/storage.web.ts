import { AppState, stateSchema } from './types';
import { emptyState } from './defaults';
import { checkedPlan } from './plan';
// Browser secrets are memory-only. This preview does not offer native secure storage.
const secrets = new Map<string, string>();
export async function loadState(): Promise<AppState> {
  const value = localStorage.getItem('stride-ai-v1');
  if (!value) return emptyState();
  try { const state = stateSchema.parse(JSON.parse(value)); if (state.plan) checkedPlan(state.plan); return state; }
  catch { throw new Error('Browser data is invalid. Restore a backup or explicitly reset local data.'); }
}
export async function saveState(state: AppState) { localStorage.setItem('stride-ai-v1', JSON.stringify(stateSchema.parse(state))); }
export async function saveApiKey(key: string) { key.trim() ? secrets.set('key', key.trim()) : secrets.delete('key'); }
export async function getApiKey() { return secrets.get('key') ?? null; }
export async function saveGarminPassword(_password: string) { throw new Error('Garmin sign-in requires the Android app.'); }
export async function getGarminPassword() { return null; }
export async function saveGarminSession(_value: string) { throw new Error('Garmin requires Android.'); }
export async function getGarminSession() { return null; }
export async function clearGarminSession() { }
