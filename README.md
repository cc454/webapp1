# Stride AI

Stride AI is a local-first Expo mobile personal trainer for a 16-week target-event plan. It keeps the plan, training notes, API key, and Garmin session on the device. The only information sent away is the coaching context supplied to the LLM provider you choose.

## What is included

- Persistent target-event summary, a seven-day plan, completed-workout tracking, and a 16-week macro-plan view.
- Direct Claude or Gemini chat with a bounded context: event, current week, research, constraints, and recent Garmin activity summaries.
- Garmin Connect sign-in, summary sync, and structured workout/calendar push through an isolated native adapter.
- Markdown, PDF, and upcoming-week iCalendar exports.
- A user-managed `goal.md` file plus `research.md` and `constraints.md`: import from the phone, or bundle files with this project.

## Prerequisites

1. Install Node.js 20 LTS or later and npm on your development machine.
2. Install Expo Go on an iPhone or Android phone for development, or install Android Studio/Xcode for a simulator.
3. Create an Anthropic or Google AI API key. The app makes requests directly from the device using that key.
4. Optional: have Garmin Connect credentials ready if you want activity sync and calendar pushes.

## Start the app

From the project root:

```bash
npm install
npm start
```

Then scan the QR code with Expo Go, or press `a` for Android and `i` for iOS. A physical device is recommended because secure storage, document picking, native cookies, and sharing are most useful there.

## First-time setup in the app

1. Open **Settings** from the bottom navigation.
2. Select **Claude** or **Gemini**, then paste the corresponding API key. It is saved in encrypted device storage.
3. Enter your Garmin email and password if required. The password field remains blank after entry by design; entering it again replaces the saved value.
4. Tap **Connect Garmin**. On success, the app creates a local Garmin web session and syncs recent activity summaries.
5. Optionally tap **Sync Activities** later to refresh the pace, distance, duration, and heart-rate summaries provided to the coach.

## Setting the event goal with `goal.md`

The active event is stored locally on the device after importing a goal file. It controls the persistent header, plan exports, and the event context sent to the coach.

Use this exact key/value format; preserve the labels and change the values after each colon:

```md
# Event goal

name: Alpine Ridge 50K
date: Sep 21, 2026
distance: 50 km
target time: 5:30
elevation: 2,100 m
pace: 6:36 / km
```

All six fields are required. In Settings, under **Event Goal**, tap **Import Goal.md** to select a file from the phone. The app validates the file, updates the event header immediately, and saves the active goal locally.

To maintain a default in the repository, edit [assets/training/goal.md](assets/training/goal.md), rebuild/reload Expo, and tap **Load Project Goal** in Settings. This copies the bundled goal into local app storage; later edits inside the app do not modify the repository.

## Providing research and scheduling constraints

Both fields are editable in Settings, and the app stores the current version locally. The content is inserted into the coach context, so keep each document concise (roughly under 5,000 words).

### Import files from your phone

1. Save `research.md` or `constraints.md` in Files, Drive, iCloud, or another document provider available on your phone.
2. In Settings, find the matching section.
3. Tap **Import .md** and choose the file.
4. Review or edit the loaded text. It is used immediately and persisted locally.

Plain-text files are also accepted. Importing a file replaces the existing text for that section.

### Ship Markdown files with this project

Yes. The project already includes these bundle-ready files:

- [assets/training/research.md](assets/training/research.md)
- [assets/training/constraints.md](assets/training/constraints.md)
- [assets/training/goal.md](assets/training/goal.md)

Replace their example content before building the app. After rebuilding/reloading Expo, open Settings and tap **Load Project File** in the relevant section. This copies the bundled file into the locally editable app setting. Changes to project files require a new bundle/reload; later edits in the app stay local and do not modify the repository.

## Daily use

1. Open **Plan** to see the upcoming seven days. Tap a workout to mark it complete or incomplete.
2. Tap **16-Week Plan** for the macro structure.
3. Tap **Push Week to Garmin Calendar** to create the non-rest workouts and schedule them in Garmin. The app reports failures rather than claiming success when Garmin rejects a request.
4. Open **Chat** to report fatigue, missed sessions, pain concerns, sleep, or a request to alter the week. The coach gets the current plan, configured Markdown guidance, and recent Garmin summaries.
5. At the bottom of Plan, export only the upcoming week as **Markdown**, **PDF**, or **Calendar** (`.ics`). Use the device share sheet to save or send it.

## Privacy and data handling

- Plan, settings, imported Markdown, and workout status are stored in local app storage.
- LLM API keys, Garmin passwords, and Garmin session metadata use encrypted device storage.
- Coaching requests leave the phone only for your selected LLM provider; they include the training context described above.
- Garmin passwords and session tokens are never included in the coaching prompt.

## Garmin notes

The implementation is in [src/garmin.ts](src/garmin.ts). Garmin does not publish this consumer calendar workflow as a stable public API, so its browser sign-in and calendar endpoints can change. The adapter is intentionally isolated: if Garmin changes the flow, update this module without changing the UI or coaching code. Use only an account you are authorized to access.

## Project structure

```text
App.tsx                    Application UI and local orchestration
src/garmin.ts              Garmin session, summary sync, calendar push
src/llm.ts                 Claude/Gemini client and bounded coach context
src/goal.ts                Validation and parsing for goal.md
src/markdown.ts            File import and bundled Markdown loading
src/storage.ts             AsyncStorage and encrypted SecureStore helpers
assets/training/*.md       Project-provided coaching guidance
```

## Validation

Run the following before shipping changes:

```bash
npm run typecheck
npx expo start --clear
```

On a physical device, verify provider chat, Markdown import, project Markdown load, Garmin authentication, activity sync, calendar push, and each export format with your own accounts.

## Build an Android APK in Ona

Ona is configured to build a native release APK. The Dev Container installs Java 17, Node 20, Android command-line tools, Android API 35, and build tools. The `.ona/config.yaml` file provides these repeatable tasks:

1. **Install dependencies** — runs automatically after the Dev Container starts and can also be started manually.
2. **Type-check application** — validates TypeScript after dependencies are available.
3. **Build Android release APK** — generates the Android project, builds a release APK, and copies it to `artifacts/stride-ai-release.apk`.

From the Ona Tasks panel, run **Build Android release APK**. When it succeeds, download `artifacts/stride-ai-release.apk` from the environment's file explorer.

On your Android phone, allow installs from the app you used to download the file (for example Chrome or Files), open the APK, and confirm installation. The current release variant is signed with the Android debug certificate, so it is suitable for testing but not Google Play distribution.
