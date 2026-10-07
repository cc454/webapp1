import { AppState } from './types';
import { defaultWorkoutLibrary } from './workoutLibraryDefaults';
export const defaultRules = { restDays: 2, mondayMaxMinutes: 40, weekendLong: true, noConsecutiveHard: true };
export function emptyState(): AppState {
  return { version: 1, event: null, plan: null, activities: [], fitness: { vo2: null, power: null, zones: null, warnings: [] }, lastSync: null, threads: [],
    settings: { model: 'anthropic/claude-sonnet-4.6', research: '', constraints: '', garminEmail: '', rules: { ...defaultRules }, workoutLibrary: defaultWorkoutLibrary } };
}
