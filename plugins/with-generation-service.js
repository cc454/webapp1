const { withAndroidManifest } = require('expo/config-plugins');
module.exports = config => withAndroidManifest(config, mod => {
  const manifest = mod.modResults.manifest;
  manifest['uses-permission'] ??= [];
  for (const name of ['FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_DATA_SYNC', 'WAKE_LOCK', 'POST_NOTIFICATIONS']) {
    const permission = `android.permission.${name}`;
    if (!manifest['uses-permission'].some(item => item.$['android:name'] === permission)) manifest['uses-permission'].push({ $: { 'android:name': permission } });
  }
  const app = manifest.application[0]; app.service ??= [];
  const name = 'com.asterinet.react.bgactions.RNBackgroundActionsTask';
  let service = app.service.find(item => item.$['android:name'] === name);
  if (!service) { service = { $: { 'android:name': name } }; app.service.push(service); }
  service.$['android:exported'] = 'false'; service.$['android:foregroundServiceType'] = 'dataSync';
  return mod;
});
