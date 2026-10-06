import { askCoach, buildCoachContext } from "../src/llm";
import { AppSettings, EventDetails, Workout } from "../src/types";

const event: EventDetails = { name: "Race", date: "Oct 10", distance: "50 km", targetTime: "6:00", elevation: "2,000 m", pace: "7:12 / km" };
const settings: AppSettings = { provider: "anthropic", research: "r".repeat(20001), constraints: "c".repeat(20001), garminEmail: "runner@example.com" };
const workouts: Workout[] = [{ id: "mon", date: "MON · AUG 17", title: "Easy run", detail: "Easy", duration: "30 min", type: "run" }];

describe("coach context and provider requests", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("builds bounded context with all athlete inputs", () => {
    const context = buildCoachContext(event, settings, workouts, [{ id: 1, name: "Run", startedAt: "today", distanceKm: 8, durationMinutes: 45 }]);
    expect(context).toContain("You are a cautious endurance coach");
    expect(context).toContain(JSON.stringify(event));
    expect(context).toContain(JSON.stringify(workouts));
    expect(context).toContain(JSON.stringify([{ id: 1, name: "Run", startedAt: "today", distanceKm: 8, durationMinutes: 45 }]));
    expect(context).toContain("r".repeat(20000));
    expect(context).not.toContain("r".repeat(20001));
  });

  it("does not call a provider without an API key", async () => {
    await expect(askCoach("Help", "context", "anthropic", "")).resolves.toContain("Add your API key");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls Anthropic and returns its text", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ content: [{ text: "Recover today." }] }) });
    await expect(askCoach("How?", "context", "anthropic", "key")).resolves.toBe("Recover today.");
    expect(global.fetch).toHaveBeenCalledWith("https://api.anthropic.com/v1/messages", expect.objectContaining({ method: "POST" }));
  });

  it("calls Gemini and surfaces provider failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "Run easy." }] } }] }) });
    await expect(askCoach("How?", "context", "gemini", "key")).resolves.toBe("Run easy.");
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("generativelanguage.googleapis.com"), expect.any(Object));
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    await expect(askCoach("How?", "context", "gemini", "key")).rejects.toThrow("Gemini request failed");
  });
});
