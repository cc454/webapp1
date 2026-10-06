import { AppSettings, EventDetails, GarminActivitySummary, Workout } from "./types";

const SYSTEM = `You are a cautious endurance coach. Return concise, executable training guidance. Never diagnose injury; advise medical evaluation for pain, dizziness, or concerning symptoms.`;
export function buildCoachContext(event: EventDetails, settings: AppSettings, currentWeek: Workout[], recentActivities: GarminActivitySummary[] = []) {
  return `${SYSTEM}\n\nEVENT: ${JSON.stringify(event)}\n\nRESEARCH:\n${settings.research.slice(0, 20000)}\n\nCONSTRAINTS:\n${settings.constraints.slice(0, 20000)}\n\nRECENT GARMIN SUMMARY METRICS:\n${JSON.stringify(recentActivities)}\n\nCURRENT WEEK:\n${JSON.stringify(currentWeek)}`;
}

export async function askCoach(prompt: string, context: string, provider: AppSettings["provider"], key: string) {
  if (!key) return "Add your API key in Settings to use the coach. Your key stays in the device secure store.";
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 700, system: context, messages: [{ role: "user", content: prompt }] }) });
    if (!res.ok) throw new Error("Anthropic request failed. Check your key and connection.");
    const data = await res.json(); return data.content?.[0]?.text ?? "No response received.";
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: context }] }, contents: [{ parts: [{ text: prompt }] }] }) });
  if (!res.ok) throw new Error("Gemini request failed. Check your key and connection.");
  const data = await res.json(); return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response received.";
}
