# Stride AI

A local-first personal trainer for running and cycling, built with Expo, React Native, and TypeScript. Plans run from creation through your event date. Initial plans and revisions remain proposals until you review and accept them.

## Implementation status

The app now includes Plan, Chat, and Settings; goal/guidance imports; rolling seven-day views; plan validation and review; OpenRouter coaching; ten conversation threads; SQLite persistence on Android; exports; and versioned plan backup/restore. A browser preview uses local browser storage and memory-only API keys.

The owner verified Android installation, OpenRouter chat with Claude Sonnet 4.6, Markdown imports, Garmin connection/activity import, and keyboard/draft behavior. The 0.1.3 changes pass strict checking, 105 automated tests, web export, and native APK packaging. This update calculates interval duration totals locally, saves validated generation weeks separately from the active plan, supports resume, and runs Android generation in a foreground service. Full-plan generation, screen-off behavior, and fitness metrics still need a phone recheck. See [verification status](TESTING.md).

Garmin sign-in and activity sync are confirmed working on the owner's phone. The native adapter fetches the last 50 activities and retains supported running/cycling summaries, including optional HR, speed, elevation, power, and cadence. Sync also fetches running/cycling VO₂ max, cycling FTP/kg and FTP, and configured heart-rate zones, displaying units and fetch timestamps in Settings and including them in coach context. Failed optional metric endpoints retain cached values with warnings; missing values remain unavailable. Lap detail, load, and recovery endpoints are pending. Garmin workout push is deferred. Native iOS and Ona are out of scope.

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

The bootstrap script downloads the JDK and Google command-line tools into ignored `.tools/` and prompts for SDK license review. Use `-AcceptLicenses` only after explicitly authorizing acceptance. The build runs in the workspace and outputs `artifacts/stride-ai-release.apk`.

The pnpm 11 dependency layout is configured in `pnpm-workspace.yaml` ([pnpm migration guide](https://pnpm.io/docs/migration)). On Windows, the build script temporarily maps an unused drive letter to an SDK path containing spaces, avoiding CMake's incorrect short-name treatment of `clang++.exe`. It also maps the Gradle cache to an unused drive letter and places native caches under the short SDK path and removes only its own mapping afterward. Phone builds include ARM64 and ARMv7. Pass `-Architectures "arm64-v8a,armeabi-v7a,x86,x86_64"` for emulator binaries. To retry Gradle without regenerating the native project, pass `-SkipPrebuild` to `scripts/build-android.ps1`.

The generated release variant uses the template debug certificate for personal testing only. Keep the same signing identity when upgrading; do not uninstall first if you want to preserve data. Production distribution needs a private release keystore. APK installation/upgrade on the owner's phone remains a separate acceptance check.

## First use

1. In Settings, load the project goal, research, and constraints, or import your own .md/.txt files.
2. Configure an OpenRouter model and API key, then save settings. Native keys are stored in SecureStore. The default model is anthropic/claude-sonnet-4.6; generation uses structured output when supported and otherwise requests JSON with the same local validation.
3. Save Garmin email/password, connect, and sync activities on Android. An error leaves the cache intact; a session error requires reauthentication.
4. Generate your plan from Plan. Longer plans are generated in seven-day batches; progress and cancellation are available. Each request tells the model to select rest days and permitted long/hard-session dates before filling in details, with explicit weekday/date-specific Monday duration limits and the saved additional guidance. Dates and rule values are also constrained in the provider schema. OpenRouter plan requests use SSE keep-alives, validate complete responses, and retry an incomplete response once before reporting a useful error. Each valid week is saved as a draft; Resume generation continues from the next week with the original creation date. No partial plan is activated. Review the proposed sessions before accepting.
5. Use Chat for advice. To change the plan, enter a request and select Propose plan changes, then review it on Plan.
6. Back up the current plan before clearing it or changing events. Restore previews a JSON backup before replacing the active plan.

Ten chats means ten conversation threads ordered by recent use. The oldest is removed when a new thread would exceed ten. Workout completion is manual.

The native Garmin adapter uses the [maintained client's mobile service-ticket/token flow](https://github.com/cyberjunky/python-garminconnect/blob/master/garminconnect/client.py) and `connectapi.garmin.com` bearer authentication. It verifies profile access before saving tokens in SecureStore and refreshes an expired access token once. Fitness endpoint mappings follow the [Garmin client implementation](https://github.com/cyberjunky/ha-garmin/blob/main/src/ha_garmin/client.py). Plan response handling follows [OpenRouter streaming](https://openrouter.ai/docs/api_reference/streaming) and [response error handling](https://openrouter.ai/docs/api_reference/errors-and-debugging).

Chat keeps its composer below the scrolling messages and resizes around the Android keyboard. A successful, saved response clears the submitted draft; failures retain it. Multiline fields have a bounded height and an internal scroll indicator. Operations automatically reveal progress/errors at the top of the page. Plan generation retries a weekly response up to twice for validation repairs and supports a locally validated JSON prompt fallback when a provider cannot accept structured output.

Android generation uses a foreground data-transfer service and wake lock, with a progress notification. Allow notifications when prompted. Switching apps or turning the screen off should keep generation running; force-stop, reboot, Android service time limits, or manufacturer restrictions can interrupt it. Reopen Plan and resume the saved draft afterward. Completed proposals survive restart and still require review. Cancel retains valid weeks; rejecting a proposal or confirming Discard draft removes them. Changed event/model/rules/guidance/baseline inputs require discarding the previous draft before restarting. Browser generation does not have Android background guarantees. Drafts from older app versions cannot be recovered retrospectively.

## Generation cost

The selected model remains unchanged. Generation now sends compact activity summaries and only the previous fourteen sessions, requests concise descriptions, calculates step totals (including repeats) and overview volumes locally, and retains completed weeks to avoid regenerating them after a late failure. Monday and other scheduling rules still apply to the derived totals. Actual cost savings require a live billing comparison.

Current standard prices per million input/output tokens, checked 7 October 2026:

| Model | Input | Output |
| --- | ---: | ---: |
| [Claude Sonnet 4.6](https://openrouter.ai/anthropic/claude-sonnet-4.6) | $3 | $15 |
| [Claude Haiku 4.5](https://openrouter.ai/anthropic/claude-haiku-4.5) | $1 | $5 |
| [Gemini 2.5 Flash](https://openrouter.ai/google/gemini-2.5-flash) | $0.30 | $2.50 |

Choose a cheaper model in Settings and check its plan quality before relying on it. Haiku is one-third of Sonnet's standard token prices; total cost also depends on output length and retries. Shorter research text reduces repeatedly billed input. Future options include a smaller output protocol, fewer batches, and explicit [prompt caching](https://openrouter.ai/docs/guides/best-practices/prompt-caching). Caching is not enabled: it requires a stable supported prefix, charges for cache writes, and does not reduce output charges; the per-week structured schema currently changes.

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
