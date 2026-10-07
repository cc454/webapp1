import { GarminActivitySummary, GarminFitness } from './types';
export class GarminError extends Error { }
const unsupported = () => new GarminError('Garmin sign-in and sync require the Android app. Browser preview can use its local plan and backups.');
export async function signIn(_email: string, _password: string) { throw unsupported(); }
export async function pullActivitySummaries(_limit = 50): Promise<GarminActivitySummary[]> { throw unsupported(); }
export async function pullFitness(_previous: GarminFitness): Promise<GarminFitness> { throw unsupported(); }
export async function isConnected() { return false; }
export async function disconnect() { }
