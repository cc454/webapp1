import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { AppState, stateSchema } from './types';
import { emptyState } from './defaults';
import { checkedPlan } from './plan';
let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  database ??= SQLite.openDatabaseAsync('stride-ai.db').then(async d => {
    await d.execAsync('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);');
    return d;
  });
  return database;
}
export async function loadState(): Promise<AppState> {
  const row = await (await db()).getFirstAsync<{ value: string }>('SELECT value FROM state WHERE id=1');
  if (!row) return emptyState();
  try { const value = stateSchema.parse(JSON.parse(row.value)); if (value.plan) checkedPlan(value.plan); return value; }
  catch { throw new Error('Saved data is damaged or from an unsupported version. It has not been overwritten. Restore a backup or explicitly reset local data.'); }
}
export async function saveState(state: AppState) {
  const value = JSON.stringify(stateSchema.parse(state));
  await (await db()).runAsync('INSERT INTO state(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value', value);
}
export const saveApiKey = (key: string) => key.trim() ? SecureStore.setItemAsync('openrouter-api-key', key.trim()) : SecureStore.deleteItemAsync('openrouter-api-key');
export const getApiKey = () => SecureStore.getItemAsync('openrouter-api-key');
export const saveGarminPassword = (password: string) => password ? SecureStore.setItemAsync('garmin-password', password) : Promise.resolve();
export const getGarminPassword = () => SecureStore.getItemAsync('garmin-password');
export const saveGarminSession = (session: string) => SecureStore.setItemAsync('garmin-session', session);
export const getGarminSession = () => SecureStore.getItemAsync('garmin-session');
export const clearGarminSession = () => SecureStore.deleteItemAsync('garmin-session');
