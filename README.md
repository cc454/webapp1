# Stride AI

A local-first personal trainer for running and cycling, built with Expo, React Native, and TypeScript. Plans run from creation through your event date. Initial plans and revisions remain proposals until you review and accept them.

## Implementation status

The app now includes Plan, Chat, and Settings; goal/guidance imports; rolling seven-day views; plan validation and review; OpenRouter coaching; ten conversation threads; SQLite persistence on Android; exports; and versioned plan backup/restore. A browser preview uses local browser storage and memory-only API keys.

Strict type checking and 61 automated tests passed after the reboot on 7 October 2026. Web and Android JavaScript exports have compiled. Native APK packaging is being verified separately; see [verification status](TESTING.md).

Garmin sign-in and sync are implemented behind an isolated native adapter but have **not been verified with a real account/device**. The current adapter fetches up to 100 recent running/cycling summaries, including optional HR, speed, elevation, power, and cadence. Lap detail, zones, fitness/load, and recovery endpoints are not implemented yet. Missing metrics remain unknown. Garmin workout push is deferred. Native iOS and Ona are out of scope.

## Development

Use Node 24 and pnpm 11.19.0. Dependency versions and the Windows native-tooling patch are recorded in the lockfile.

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm web
```

For Android development, use a development build rather than Expo Go because the Garmin cookie adapter requires native code:

```powershell
pnpm android
pnpm start
```

The Android run command needs a configured SDK/JDK and an emulator or USB-debugging-enabled phone. The build script below discovers the workspace-local tools automatically.

## Build the Android APK on Windows

Install JDK 17 and Android SDK and set JAVA_HOME / ANDROID_HOME, or use the workspace-local setup:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/bootstrap-android.ps1
pnpm build:android
```

The bootstrap script downloads the JDK and Google command-line tools into ignored `.tools/` and prompts for SDK license review. Use `-AcceptLicenses` only after explicitly authorizing acceptance. The build runs in the workspace and outputs `artifacts/stride-ai-release.apk`.

The pnpm 11 dependency layout is configured in `pnpm-workspace.yaml` ([pnpm migration guide](https://pnpm.io/docs/migration)). On Windows, the build script temporarily maps an unused drive letter to an SDK path containing spaces, avoiding CMake's incorrect short-name treatment of `clang++.exe`. It places native caches under that short SDK path and removes only its own mapping afterward. To retry Gradle without regenerating the native project, pass `-SkipPrebuild` to `scripts/build-android.ps1`.

The generated release variant uses the template debug certificate for personal testing only. Keep the same signing identity when upgrading; do not uninstall first if you want to preserve data. Production distribution needs a private release keystore. APK installation/upgrade on the owner's phone remains a separate acceptance check.

## First use

1. In Settings, load the project goal, research, and constraints, or import your own .md/.txt files.
2. Configure an OpenRouter model and API key, then save settings. Native keys are stored in SecureStore. The default model is anthropic/claude-sonnet-4.6; generation requires structured-output support.
3. Save Garmin email/password, connect, and sync activities on Android. An error leaves the cache intact; a session error requires reauthentication.
4. Generate your plan from Plan. Longer plans are generated in seven-day batches; progress and cancellation are available. No partial plan is activated. Review the proposed sessions before accepting.
5. Use Chat for advice. To change the plan, enter a request and select Propose plan changes, then review it on Plan.
6. Back up the current plan before clearing it or changing events. Restore previews a JSON backup before replacing the active plan.

Ten chats means ten conversation threads ordered by recent use. The oldest is removed when a new thread would exceed ten. Workout completion is manual.

The native Garmin adapter consumes the SSO service ticket before verifying activity access, following the [maintained client session flow](https://github.com/cyberjunky/python-garminconnect/blob/master/garminconnect/client.py). This consumer interface still requires testing with the owner's account.

## Goal and scheduling rules

The bundled [goal.md](training/goal.md) specifies Halbmarathon on 11 April 2027. Required fields are name, date, distance in km, target time as H:MM (optional seconds), and elevation in m. Pace is calculated: 21.1 km in 2:00 is approximately 5:41/km; legacy pace text is ignored.

The enforced scheduling controls are minimum rest days, Monday maximum duration, weekend long sessions, and no consecutive hard days. Rest quotas apply to full seven-day blocks anchored at plan creation; the final partial block has no prorated quota. Daily rules still apply.

The four bundled constraints are recognized and checked against those controls. Unrecognized scheduling prose blocks generation until resolved. Prefix advisory text with `guidance:` if it is meant for the coach rather than deterministic enforcement. Changing rules does not silently revise the active plan.

## Privacy and portability

Plan, guidance, activities, and chats stay on the device. Coaching sends selected context through OpenRouter to the selected downstream provider. Garmin credentials are excluded from coaching, logs, and backups. Plan backups include event, dates, overview, sessions, and completion; they exclude credentials and chat history. Restore preserves current device settings and chats.

Browser storage is local to that browser; there is no cross-device sync. Browser API keys are held in memory and must be re-entered after reload. Garmin is Android-only. The browser PDF export opens the print/save-as-PDF dialog.

## References

- [Requirements and acceptance cases](REQUIREMENTS.md)
- [Development plan](DEVELOPMENT_PLAN.md)
- [Verification evidence and remaining device checks](TESTING.md)
