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
export const pace = (seconds: number, distanceKm: number) => {
  const s = Math.round(seconds / distanceKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} / km`;
};
export function duration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
