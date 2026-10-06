import { EventDetails, MacroWeek, Workout } from "./types";

export const defaultEvent: EventDetails = {
  name: "Alpine Ridge 50K",
  date: "Sep 21, 2026",
  distance: "50 km",
  targetTime: "5:30",
  elevation: "2,100 m",
  pace: "6:36 / km",
};

export const week: Workout[] = [
  { id: "mon", date: "MON · AUG 17", title: "Rest & mobility", detail: "20 min easy mobility. Keep the day genuinely easy.", duration: "20 min", type: "rest" },
  { id: "tue", date: "TUE · AUG 18", title: "Hill repeats", detail: "15 min warm-up · 6 × 3 min uphill at strong, controlled effort · jog down · 10 min cool-down.", duration: "70 min", type: "run" },
  { id: "wed", date: "WED · AUG 19", title: "Easy aerobic run", detail: "Conversational effort on soft terrain. Keep HR below 145 bpm.", duration: "50 min", type: "run" },
  { id: "thu", date: "THU · AUG 20", title: "Strength + strides", detail: "35 min single-leg strength, then 6 × 20 sec relaxed strides.", duration: "50 min", type: "strength" },
  { id: "fri", date: "FRI · AUG 21", title: "Recovery run", detail: "Easy shakeout. Stop early if your legs still feel heavy.", duration: "35 min", type: "run" },
  { id: "sat", date: "SAT · AUG 22", title: "Long trail run", detail: "Rolling trail. Fuel 60–75 g carbs/hour and practice race hydration.", duration: "2h 30m", type: "run" },
  { id: "sun", date: "SUN · AUG 23", title: "Easy hike / cross-train", detail: "Low-intensity hike or bike. Keep it restorative.", duration: "60 min", type: "cross" },
];

const phases = [
  ["Foundation", "38 km", "Aerobic consistency"], ["Foundation", "42 km", "Strength endurance"],
  ["Foundation", "46 km", "Hill economy"], ["Recovery", "34 km", "Absorb training"],
  ["Build", "50 km", "Threshold development"], ["Build", "54 km", "Long-run durability"],
  ["Build", "58 km", "Climbing strength"], ["Recovery", "43 km", "Absorb training"],
  ["Specific", "62 km", "Race-pace climbing"], ["Specific", "66 km", "Back-to-back long runs"],
  ["Specific", "70 km", "Peak specificity"], ["Recovery", "52 km", "Freshen up"],
  ["Peak", "74 km", "Race simulation"], ["Peak", "58 km", "Sharpen"],
  ["Taper", "42 km", "Maintain intensity"], ["Race", "22 km + race", "Arrive fresh"],
];
export const macro: MacroWeek[] = phases.map(([phase, volume, focus], index) => ({ week: index + 1, phase, volume, focus }));
