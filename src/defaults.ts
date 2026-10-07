import { AppState } from './types';
export const defaultRules = { restDays: 2, mondayMaxMinutes: 40, weekendLong: true, noConsecutiveHard: true };
export function emptyState(): AppState {
  return { version: 1, event: null, plan: null, activities: [], lastSync: null, threads: [],
    settings: { model: 'anthropic/claude-sonnet-4.6', research: '', constraints: '', garminEmail: '', rules: { ...defaultRules } } };
}
