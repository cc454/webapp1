import { defaultEvent, macro, week } from "../src/defaults";

describe("default training data", () => {
  it("provides a complete default event", () => {
    expect(defaultEvent).toEqual({
      name: "Alpine Ridge 50K",
      date: "Sep 21, 2026",
      distance: "50 km",
      targetTime: "5:30",
      elevation: "2,100 m",
      pace: "6:36 / km",
    });
  });

  it("provides a seven-day plan with unique workout IDs", () => {
    expect(week).toHaveLength(7);
    expect(new Set(week.map((workout) => workout.id)).size).toBe(7);
    expect(week.find((workout) => workout.type === "rest")?.id).toBe("mon");
  });

  it("provides each week of the 16-week macro plan in order", () => {
    expect(macro).toHaveLength(16);
    expect(macro.map((entry) => entry.week)).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
    expect(macro.at(-1)).toMatchObject({ phase: "Race", volume: "22 km + race" });
  });
});
