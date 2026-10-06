import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { EventDetails, Workout } from "./types";

const safe = (v: string) => v.replace(/[\\/:*?"<>|]/g, "-");
const markdown = (event: EventDetails, workouts: Workout[]) => `# ${event.name} Training Plan\n\n**Race:** ${event.date} · ${event.distance} · ${event.targetTime}\n\n${workouts.map(w => `## ${w.date}: ${w.title}\n${w.detail}\n\nDuration: ${w.duration}`).join("\n\n")}`;
const ics = (workouts: Workout[]) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Stride AI//EN", ...workouts.map(w => `BEGIN:VEVENT\nUID:${w.id}@stride-ai\nDTSTART;VALUE=DATE:${w.id === "mon" ? "20260817" : "202608" + (17 + workouts.indexOf(w) + 1)}\nSUMMARY:${w.title}\nDESCRIPTION:${w.detail.replace(/\n/g, "\\n")}\nEND:VEVENT`), "END:VCALENDAR"].join("\r\n");

export async function shareExport(kind: "md" | "ics" | "pdf", event: EventDetails, workouts: Workout[]) {
  const base = FileSystem.cacheDirectory + safe(`${event.name}-training-plan`);
  let uri: string;
  if (kind === "pdf") {
    uri = (await Print.printToFileAsync({ html: `<html><body style="font-family: Arial; padding:24px"><pre style="white-space:pre-wrap">${markdown(event, workouts)}</pre></body></html>` })).uri;
  } else {
    uri = `${base}.${kind}`;
    await FileSystem.writeAsStringAsync(uri, kind === "md" ? markdown(event, workouts) : ics(workouts));
  }
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: kind === "ics" ? "text/calendar" : undefined });
}
