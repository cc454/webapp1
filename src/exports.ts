import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { EventDetails, Plan, Workout } from './types';
import { ics, markdown, pdfHtml, safeFilename } from './exportContent';
import { encodeBackup } from './backup';
async function share(uri: string, mimeType: string) {
  if (!await Sharing.isAvailableAsync()) throw new Error(`Sharing is unavailable. Your file was created at ${uri}. Open it using a file manager or try sharing on another device.`);
  await Sharing.shareAsync(uri, { mimeType });
}
export async function shareExport(kind: 'md' | 'ics' | 'pdf', event: EventDetails, workouts: Workout[]) {
  if (kind === 'pdf') { const { uri } = await Print.printToFileAsync({ html: pdfHtml(event, workouts) }); await share(uri, 'application/pdf'); return; }
  const uri = `${FileSystem.cacheDirectory}${safeFilename(event.name)}-training-plan.${kind}`;
  await FileSystem.writeAsStringAsync(uri, kind === 'ics' ? ics(event, workouts) : markdown(event, workouts));
  await share(uri, kind === 'ics' ? 'text/calendar' : 'text/markdown');
}
export async function shareBackup(plan: Plan) {
  const uri = `${FileSystem.cacheDirectory}${safeFilename(plan.event.name)}-backup.json`;
  await FileSystem.writeAsStringAsync(uri, encodeBackup(plan));
  await share(uri, 'application/json');
}
export async function shareWorkoutLibrary(text: string) {
  const uri = `${FileSystem.cacheDirectory}workout-library.md`;
  await FileSystem.writeAsStringAsync(uri, text); await share(uri, 'text/markdown');
}
