import { parseGoalMarkdown } from "../src/goal";

describe("parseGoalMarkdown", () => {
  const goal = `# Event goal\n\nEvent name: Ridge 50K\nTarget date: Oct 10, 2026\nDistance: 50 km\nTime: 6:00\nGain: 2,000 m\nTarget pace: 7:12 / km`;

  it("parses supported field aliases without treating headings as fields", () => {
    expect(parseGoalMarkdown(goal)).toEqual({
      name: "Ridge 50K",
      date: "Oct 10, 2026",
      distance: "50 km",
      targetTime: "6:00",
      elevation: "2,000 m",
      pace: "7:12 / km",
    });
  });

  it("reports every missing required field", () => {
    expect(() => parseGoalMarkdown("name: A race\ndistance: 10 km")).toThrow("goal.md is missing: date, targetTime, elevation, pace.");
  });
});
