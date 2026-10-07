import { EventDetails, Plan, Workout } from './types';
import { ics, markdown, pdfHtml, safeFilename } from './exportContent';
import { encodeBackup } from './backup';
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function shareExport(kind: 'md' | 'ics' | 'pdf', event: EventDetails, workouts: Workout[]) {
  if (kind === 'pdf') {
    const tab = window.open('', '_blank');
    if (!tab) throw new Error('Allow popups to print or save the plan as PDF.');
    tab.document.write(pdfHtml(event, workouts)); tab.document.close(); tab.focus(); tab.print(); return;
  }
  download(`${safeFilename(event.name)}-training-plan.${kind}`, kind === 'ics' ? ics(event, workouts) : markdown(event, workouts), kind === 'ics' ? 'text/calendar' : 'text/markdown');
}
export async function shareBackup(plan: Plan) { download(`${safeFilename(plan.event.name)}-backup.json`, encodeBackup(plan), 'application/json'); }
export async function shareWorkoutLibrary(text: string) { download('workout-library.md',text,'text/markdown'); }
