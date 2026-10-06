import CookieManager from "@react-native-cookies/cookies";
import { GarminActivitySummary, Workout } from "./types";
import { clearGarminSession, getGarminSession, saveGarminSession } from "./storage";

const CONNECT = "https://connect.garmin.com";
const SSO = "https://sso.garmin.com/sso";
const USER_AGENT = "Mozilla/5.0 (Mobile; Stride AI)";

export class GarminError extends Error {}

/**
 * Garmin Connect does not publish this consumer workflow as a stable API.
 * Keep every endpoint in this adapter so it can be updated without touching
 * coaching or UI code when Garmin changes its web client.
 */
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${CONNECT}${path}`, {
    ...init,
    credentials: "include",
    headers: { accept: "application/json", "user-agent": USER_AGENT, ...init.headers },
  });
  if (response.status === 401 || response.status === 403) {
    await clearGarminSession();
    throw new GarminError("Garmin session expired. Sign in again in Settings.");
  }
  if (!response.ok) throw new GarminError(`Garmin request failed (${response.status}).`);
  return response;
}

function hiddenInput(html: string, name: string) {
  const pattern = new RegExp(`<input[^>]+name=["']${name}["'][^>]+value=["']([^"']*)`, "i");
  return html.match(pattern)?.[1] ?? "";
}

/** Establishes the web session used by Garmin Connect in the native cookie jar. */
export async function signIn(email: string, password: string) {
  if (!email || !password) throw new GarminError("Enter your Garmin email and password first.");
  const signInUrl = `${SSO}/signin?service=${encodeURIComponent(`${CONNECT}/modern/`)}&webhost=${encodeURIComponent(`${CONNECT}/modern/`)}&source=${encodeURIComponent(`${CONNECT}/signin/`)}&redirectAfterAccountLoginUrl=${encodeURIComponent(`${CONNECT}/modern/`)}&locale=en`;
  const page = await fetch(signInUrl, { headers: { "user-agent": USER_AGENT } });
  if (!page.ok) throw new GarminError("Could not open Garmin sign-in.");
  const html = await page.text();
  const form = new URLSearchParams({
    username: email,
    password,
    _csrf: hiddenInput(html, "_csrf"),
    embed: "true",
  });
  const response = await fetch(signInUrl, { method: "POST", credentials: "include", headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": USER_AGENT }, body: form.toString(), redirect: "follow" });
  const body = await response.text();
  if (!response.ok || /invalid.*(username|password)|incorrect.*password/i.test(body)) throw new GarminError("Garmin rejected those credentials.");
  const cookies = await CookieManager.get(CONNECT);
  if (!Object.keys(cookies).length) throw new GarminError("Garmin sign-in did not create a device session. Garmin may have changed its sign-in flow.");
  await saveGarminSession(JSON.stringify({ signedInAt: new Date().toISOString() }));
}

export async function isConnected() { return Boolean(await getGarminSession()); }

export async function pullActivitySummaries(limit = 8): Promise<GarminActivitySummary[]> {
  const response = await request(`/modern/proxy/activitylist-service/activities/search/activities?start=0&limit=${limit}`);
  const activities = await response.json();
  return activities.map((activity: any) => ({
    id: activity.activityId,
    name: activity.activityName ?? activity.activityType?.typeKey ?? "Activity",
    startedAt: activity.startTimeLocal,
    distanceKm: Math.round(((activity.distance ?? 0) / 1000) * 100) / 100,
    durationMinutes: Math.round((activity.duration ?? 0) / 60),
    averageHeartRate: activity.averageHR ? Math.round(activity.averageHR) : undefined,
    averagePace: activity.averageSpeed ? `${Math.floor(1000 / activity.averageSpeed / 60)}:${String(Math.round(1000 / activity.averageSpeed) % 60).padStart(2, "0")} / km` : undefined,
  }));
}

function dateFromWorkout(workout: Workout) {
  const match = workout.date.match(/AUG (\d{1,2})/);
  return `2026-08-${String(match ? Number(match[1]) : 17).padStart(2, "0")}`;
}

function workoutPayload(workout: Workout) {
  return {
    workoutName: `Stride AI · ${workout.title}`,
    description: workout.detail,
    sportType: { sportTypeId: 1, sportTypeKey: "running" },
    workoutSegments: [{ segmentOrder: 1, sportType: { sportTypeId: 1, sportTypeKey: "running" }, workoutSteps: [{ type: "ExecutableStepDTO", stepOrder: 1, stepType: { stepTypeId: 3, stepTypeKey: "interval" }, endCondition: { conditionTypeId: 2, conditionTypeKey: "time" }, endConditionValue: Math.max(60, parseDuration(workout.duration)), description: workout.detail }] }],
  };
}

function parseDuration(value: string) {
  const h = value.match(/(\d+)h/)?.[1]; const m = value.match(/(\d+)\s*min/)?.[1];
  return (Number(h ?? 0) * 3600) + (Number(m ?? 0) * 60) || 1800;
}

/** Creates Garmin workouts then schedules each workout on the Garmin calendar. */
export async function pushWeekToCalendar(workouts: Workout[]) {
  const active = workouts.filter(w => w.type !== "rest");
  let pushed = 0;
  for (const workout of active) {
    const created = await request("/modern/proxy/workout-service/workout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(workoutPayload(workout)) });
    const saved = await created.json();
    const workoutId = saved.workoutId ?? saved.workout?.workoutId;
    if (!workoutId) throw new GarminError("Garmin did not return a workout ID.");
    await request("/modern/proxy/calendar-service/calendar/entries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date: dateFromWorkout(workout), workoutId, calendarEventType: "workout" }) });
    pushed += 1;
  }
  return pushed;
}
