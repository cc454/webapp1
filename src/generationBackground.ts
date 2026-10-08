import { PermissionsAndroid, Platform } from 'react-native';
import BackgroundService from 'react-native-background-actions';
let active = false;
let progress = '';
let cancel: (() => void) | undefined;
const listeners = new Set<(progress: string) => void>();
const publish = (text: string) => { progress = text; for (const listener of listeners) listener(text); };
export function subscribeGeneration(listener: (progress: string) => void) {
  listeners.add(listener); if (active) listener(progress);
  return () => { listeners.delete(listener); };
}
export function cancelBackgroundGeneration() { cancel?.(); }

export async function withGenerationBackground<T>(task: () => Promise<T>, onCancel?: () => void): Promise<T> {
  if (Platform.OS !== 'android') return task();
  if (active) throw new Error('Plan generation is already running. Open its notification to see progress.');
  active = true;
  cancel = onCancel;
  publish('Generating training plan…');
  try {
    if (Number(Platform.Version) >= 33) await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return await new Promise<T>((resolve, reject) => {
      BackgroundService.start(async () => {
      // Resolve native Headless JS even on failure so the foreground service and
      // wake lock stop. Generation errors are delivered to the app's action handler.
        try {
          const result = await task(); await BackgroundService.stop(); resolve(result);
        } catch (error) {
          try { await BackgroundService.stop(); } catch { /* Keep the original error. */ }
          reject(error);
        }
      }, { taskName: 'StridePlanGeneration', taskTitle: 'Creating your training plan', taskDesc: 'Preparing your proposal…', taskIcon: { name: 'ic_launcher', type: 'mipmap' }, color: '#24CEB1', linkingURI: 'stride-ai:///' }).catch(reject);
    });
  } finally { active = false; cancel = undefined; publish(''); }
}
export function generationProgress(text: string) {
  if (active) publish(text);
  if (BackgroundService.isRunning()) void BackgroundService.updateNotification({ taskDesc: text }).catch(() => {});
}
