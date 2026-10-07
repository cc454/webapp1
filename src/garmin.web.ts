import { GarminActivitySummary } from './types';
export class GarminError extends Error { }
const unsupported = () => new GarminError('Garmin sign-in and sync require the Android app. Browser preview can use its local plan and backups.');
export async function signIn(_email: string, _password: string) { throw unsupported(); }
export async function pullActivitySummaries(_limit = 100): Promise<GarminActivitySummary[]> { throw unsupported(); }
export async function isConnected() { return false; }
export async function disconnect() { }
