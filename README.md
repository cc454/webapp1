# Adaptai

A local-first personal trainer for running and cycling, built with Expo, React Native and TypeScript. Version 0.2.1 uses one externally authored training plan and offers Plan, Chat and Settings.

## First use

1. In Plan, select **Download Markdown template**. Author your plan using the headings shown in the file, then select **Import Markdown plan**. Use a plan title and a training goal, an event goal, or both. Place each workout under its YYYY-MM-DD date, using a sport and type heading, a title, and a duration in seconds, minutes or hours, a distance in kilometres, or both.
2. Use Plan to see today and the next six days. Use **Show past workouts and activities** below the entire plan summary to see past planned workouts and synced Garmin activities from the plan period. Edit or swap incomplete upcoming workouts in the schedule. An unstarted past workout can be moved to a future date. Mark today's workout complete even if you only did part of it. Completion notes and exertion from 1 to 10 are optional.
3. In Settings, configure your OpenRouter key and model. Ask for advice in Chat or use **Propose plan changes**, then review the changes in Plan. Each proposal covers up to seven consecutive calendar days. A changed active plan requires a fresh proposal.
4. Save Garmin credentials in Settings and connect on Android. Use **Sync activities** in either Plan or Settings. Settings exports cached running and cycling activity summaries in CSV and Markdown.
5. Export full plan Markdown to carry your schedule and completion history to a new installation. Import replaces the active plan with the schedule and history in the file. The seven-day exports are schedule views.

Plan, guidance, activities and chats are stored on the device. Coaching sends selected context through OpenRouter to the selected model provider. Plan and activity exports exclude credentials and chats. Android secrets use SecureStore. The browser keeps its API key in memory and has no Garmin connection or cross-device sync.

## Development

Use Node 24 and pnpm 11.19.0. Dependency versions and the Windows native-tooling patch are recorded in the lockfile.

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm web
```

For Android development, use a development build rather than Expo Go because SQLite and secure storage require native code:

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

The bootstrap script downloads the JDK and Google command-line tools into ignored `.tools/` and prompts for SDK license review. Use `-AcceptLicenses` only after explicitly authorizing acceptance. The build runs in the workspace and outputs `artifacts/adaptai-release.apk`.

The pnpm 11 dependency layout is configured in `pnpm-workspace.yaml` ([pnpm migration guide](https://pnpm.io/docs/migration)). On Windows, the build script temporarily maps an unused drive letter to an SDK path containing spaces, avoiding CMake's incorrect short-name treatment of `clang++.exe`. It also maps the Gradle cache to an unused drive letter and places native caches under the short SDK path and removes only its own mapping afterward. Phone builds include ARM64 and ARMv7. Pass `-Architectures "arm64-v8a,armeabi-v7a,x86,x86_64"` for emulator binaries. To retry Gradle without regenerating the native project, pass `-SkipPrebuild` to `scripts/build-android.ps1`.

The generated release variant uses the template debug certificate for personal testing only. Keep the same signing identity when upgrading; do not uninstall first if you want to preserve data. Production distribution needs a private release keystore. APK installation/upgrade on the owner's phone remains a separate acceptance check.
See [requirements](REQUIREMENTS.md), [user stories](USER_STORIES.md), [acceptance matrix](ACCEPTANCE.md), and [verification notes](TESTING.md).
