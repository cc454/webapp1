export function today(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function datesBetween(start: string, end: string) {
  if (start > end) return [];
  const dates: string[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    if (dates.length >= 3660) throw new Error('Plans may span at most ten years.');
    dates.push(date);
  }
  return dates;
}
export const dayOfWeek = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();
export const displayDate = (date: string) => `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek(date)]} ${date}`;
export const pace = (seconds: number, distanceKm: number) => {
  const s = Math.round(seconds / distanceKm);
  return `${minutesSeconds(s)} / km`;
};
const twoDigits = (value: number) => String(value).padStart(2, '0');
export const minutesSeconds = (seconds: number) => `${twoDigits(Math.floor(seconds / 60))}:${twoDigits(seconds % 60)}`;
export function duration(seconds: number, exact = false) {
  const minutes = exact ? Math.floor(seconds / 60) : Math.round(seconds / 60);
  const clock = `${Math.floor(minutes / 60)}:${twoDigits(minutes % 60)}`;
  return exact && seconds % 60 ? `${clock}:${twoDigits(seconds % 60)}` : clock;
}
export function parseDuration(value: string) {
  const clock = /^(\d+):([0-5]\d)(?::([0-5]\d))?$/.exec(value.trim());
  const units = /^(\d+(?:[.,]\d+)?)\s*(s|min|h)$/i.exec(value.trim());
  const seconds = clock ? Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3] ?? 0) :
    units ? Math.round(Number(units[1]!.replace(',', '.')) * ({ s: 1, min: 60, h: 3600 }[units[2]!.toLowerCase()]!)) : NaN;
  return Number.isSafeInteger(seconds) ? seconds : NaN;
}
export function workoutMetrics({ durationSeconds, distanceKm, elevationM, paceSecondsPerKm }: {
  durationSeconds: number; distanceKm: number; elevationM?: number; paceSecondsPerKm?: number;
}) {
  return [
    durationSeconds > 0 && duration(durationSeconds),
    distanceKm > 0 && `${distanceKm} km`,
    paceSecondsPerKm !== undefined ? pace(paceSecondsPerKm, 1) : durationSeconds > 0 && distanceKm > 0 && pace(durationSeconds, distanceKm),
    elevationM !== undefined && `${elevationM} m`,
  ].filter(Boolean).join(' · ');
}
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
