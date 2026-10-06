jest.mock("@react-native-cookies/cookies", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../src/storage", () => ({ clearGarminSession: jest.fn(), getGarminSession: jest.fn(), saveGarminSession: jest.fn() }));

import CookieManager from "@react-native-cookies/cookies";
import * as Storage from "../src/storage";
import { GarminError, isConnected, pullActivitySummaries, pushWeekToCalendar, signIn } from "../src/garmin";

const mockCookieManager = CookieManager as jest.Mocked<typeof CookieManager>;
const mockStorage = Storage as jest.Mocked<typeof Storage>;

const response = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body, text: async () => typeof body === "string" ? body : JSON.stringify(body) });
const workouts = [
  { id: "mon", date: "MON · AUG 17", title: "Rest", detail: "Rest", duration: "20 min", type: "rest" as const },
  { id: "tue", date: "TUE · AUG 18", title: "Hills", detail: "Climb", duration: "2h 5min", type: "run" as const },
];

describe("Garmin adapter", () => {
  beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn(); });

  it("validates credentials before making a request", async () => {
    await expect(signIn("", "")).rejects.toThrow(GarminError);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("signs in, captures a session, and reports rejected credentials", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(response('<input name="_csrf" value="token">')).mockResolvedValueOnce(response("ok"));
    mockCookieManager.get.mockResolvedValue({ session: {} as any });
    await signIn("runner@example.com", "secret");
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockStorage.saveGarminSession).toHaveBeenCalledWith(expect.stringContaining("signedInAt"));
    (global.fetch as jest.Mock).mockResolvedValueOnce(response("bad", false, 401));
    await expect(signIn("runner@example.com", "secret")).rejects.toThrow("Could not open Garmin sign-in");
  });

  it("reports whether a Garmin session is stored", async () => {
    mockStorage.getGarminSession.mockResolvedValueOnce(null).mockResolvedValueOnce("session");
    await expect(isConnected()).resolves.toBe(false);
    await expect(isConnected()).resolves.toBe(true);
  });

  it("maps activity summaries and clears expired sessions", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(response([{ activityId: 4, activityType: { typeKey: "running" }, startTimeLocal: "2026-08-18", distance: 1234.5, duration: 125, averageHR: 145.6, averageSpeed: 3.5 }]));
    await expect(pullActivitySummaries(1)).resolves.toEqual([{ id: 4, name: "running", startedAt: "2026-08-18", distanceKm: 1.23, durationMinutes: 2, averageHeartRate: 146, averagePace: "4:46 / km" }]);
    (global.fetch as jest.Mock).mockResolvedValueOnce(response({}, false, 401));
    await expect(pullActivitySummaries()).rejects.toThrow("session expired");
    expect(mockStorage.clearGarminSession).toHaveBeenCalled();
  });

  it("creates calendar workouts only for non-rest days", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({ workoutId: 22 }))
      .mockResolvedValueOnce(response({}));
    await expect(pushWeekToCalendar(workouts)).resolves.toBe(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const createRequest = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(createRequest.body).workoutSegments[0].workoutSteps[0].endConditionValue).toBe(7500);
    const calendarRequest = (global.fetch as jest.Mock).mock.calls[1][1];
    expect(JSON.parse(calendarRequest.body)).toMatchObject({ date: "2026-08-18", workoutId: 22 });
  });

  it("rejects a created workout without an ID", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({}));
    await expect(pushWeekToCalendar([workouts[1]])).rejects.toThrow("did not return a workout ID");
  });
});
