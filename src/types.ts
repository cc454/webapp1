export type Workout = {
  id: string;
  date: string;
  title: string;
  detail: string;
  duration: string;
  type: "run" | "strength" | "rest" | "cross";
  completed?: boolean;
};

export type EventDetails = {
  name: string;
  date: string;
  distance: string;
  targetTime: string;
  elevation: string;
  pace: string;
};

export type AppSettings = {
  provider: "anthropic" | "gemini";
  research: string;
  constraints: string;
  garminEmail: string;
};

export type MacroWeek = { week: number; phase: string; volume: string; focus: string };

export type GarminActivitySummary = {
  id: number;
  name: string;
  startedAt: string;
  distanceKm: number;
  durationMinutes: number;
  averageHeartRate?: number;
  averagePace?: string;
};
