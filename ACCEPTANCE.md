# Acceptance matrix for the current imported-plan version

Run these cases against the new version. Earlier results in TESTING.md describe the previous app.

| Requirement | Acceptance case | Planned execution |
| --- | --- | --- |
| R-01 | AT-01: Install on Android, launch without an app account, and use a saved plan offline; inspect architecture for backend dependencies. | Android/device verification, with fixtures where applicable |
| R-16 | AT-16: Restart populated state and compare values; load corrupt/unsupported fixtures and verify useful recovery without crash or silent overwrite. | Automated fixture or UI test |
| R-18 | AT-18: Import both formats, edit, restart, then cancel import; verify content and persistence. | Automated fixture or UI test |
| R-19 | AT-19: Configure a key/model, switch models and restart; capture requests to verify the selected model and key, with no key in ordinary state. | Automated fixture or UI test |
| R-21 | AT-21: Submit above/below-limit documents; inspect payload lengths, notice, and stored originals. | Automated fixture or UI test |
| R-22 | AT-22: Exercise OpenRouter for success, unavailable model, and each failure; verify feedback, cleared busy state, and unchanged active plan on failure. | Automated fixture or UI test |
| R-23 | AT-23: Attempt chat/generation with absent/blank keys; assert zero provider calls and Settings guidance. | Automated fixture or UI test |
| R-24 | AT-24: Inspect OpenRouter request system instructions; display a pain-concern fixture without saving an unreviewed change. | Automated fixture or UI test |
| R-25 | AT-25: Create eleven threads, restart, and verify newest ten; resume one and verify earlier messages and new reply persist. | Automated fixture or UI test |
| R-26 | AT-26: Verify real Android login plus bad-credential/no-session fixtures; show connected only on validated success. | Android/device verification, with fixtures where applicable |
| R-27 | AT-27: Save/reopen/save blank/replace; verify display and secure values without plaintext state/log leakage. | Android/device verification, with fixtures where applicable |
| R-28 | AT-28: Sync then restart offline; verify cache/time and no scheduled background-sync dependency. | Automated fixture or UI test |
| R-29 | AT-29: Map full/partial run/ride fixtures; verify conversions, deduplication, sport display, and no fabricated optional values. | Automated fixture or UI test |
| R-30 | AT-30: Test full/partial fixtures and inspect planning context; compare supported-field inventory to real-account sync, verifying unknown fields stay unknown. | Automated fixture or UI test |
| R-31 | AT-31: Simulate 401/403, network failure, and malformed data; verify status/errors, unchanged success timestamp, and retained cache. | Automated fixture or UI test |
| R-33 | AT-33: Export December/January fixtures; compare text/PDF to view and import .ics into a calendar to check dates. | Automated fixture or UI test |
| R-34 | AT-34: Export path characters, HTML, commas, semicolons, and newlines; verify safe paths, literal text, valid calendar, and stable distinct IDs. | Automated fixture or UI test |
| R-35 | AT-35: Share each format on Android; simulate unavailable sharing and verify fallback. | Android/device verification, with fixtures where applicable |
| R-39 | AT-39: Review screens/proposals on small/large Android displays; verify English, km/metres, pace per km, cycling km/h, dark styling, and legible feedback. | Android/device verification, with fixtures where applicable |
| R-40 | AT-40: Capture sync/coaching/offline/backup traffic; verify destinations and no Garmin secret sentinels in provider requests. | Automated fixture or UI test |
| R-41 | AT-41: Review disclosure; inspect state/logs/outputs with secret sentinels; verify Android secure storage for each secret. | Android/device verification, with fixtures where applicable |
| R-42 | AT-42: Run documented typecheck command on a clean checkout; require strict configuration and zero exit code. | Strict TypeScript check |
| R-44 | AT-44: Follow README in a clean non-Ona environment; build and verify APK at the stated path. | Android/device verification, with fixtures where applicable |
| R-45 | AT-45: Compare APK signing to documentation; install, populate data, and upgrade with same signing identity; verify preserved plan/chats/settings. | Android/device verification, with fixtures where applicable |
| R-46 | AT-46: Exercise core flows at representative browser sizes; verify native-feature fallback and documented browser credential policy. | Android/device verification, with fixtures where applicable |
| R-47 | AT-47: Push run/ride interval/rest fixtures; inspect payloads and real-account entries, including a 2h 30m session. | Android/device verification, with fixtures where applicable |
| R-48 | AT-48: Fail mid-push and retry; verify recorded remote IDs prevent duplicate successes, errors remain visible, and acceptance makes no push request. | Automated fixture or UI test |
| R-49 | AT-49: Sync 60 out-of-order fixtures; verify a request limit of 50, the latest 50 retained, and preservation of chats/settings during legacy-state loading. | Automated fixture or UI test |
| R-50 | AT-50: Map full, partial, empty, malformed, and failed endpoint fixtures; verify precise VO₂, cycling identity, valid W/kg conversion, zone ranges in bpm, timestamps, cache retention, Settings rendering, and coaching context; compare with the owner's Garmin data on Android. | Android/device verification, with fixtures where applicable |
| R-51 | AT-51: Render representative Markdown and inspect formatting; activate an HTTPS link; verify script/unsafe URI fixtures cannot execute and images remain descriptive text. Recheck on Android. | Automated fixture or UI test |
| R-66 | AT-66: Verify latest, rather than earlier, assistant layout coordinates drive scrolling; switch threads and receive a new reply. Check a short and long reply on Android with keyboard open/closed, then manually read earlier messages without forced jumps. | Automated fixture or UI test |
| R-67 | AT-67: Select each preset, verify its exact provider ID and no automatic save, then save/restart. Type/save a custom ID and verify it is retained; inspect chat/plan requests for the chosen model. | Automated fixture or UI test |
| R-68 | AT-68: Prebuild and inspect all five launcher densities, adaptive foreground/background/monochrome references and safe artwork bounds. Inspect the built APK's icon resources and label, compare packaged images to generated assets, and verify version/signature for an in-place upgrade. Install over the existing phone app and check home/all-apps screens with normal and themed icons. | Android/device verification, with fixtures where applicable |
| R-70 | AT-70: Download and import the template. Test training-only, event-only and dual goals, two same-day sessions, notes, an omitted rest date, missing goals, missing title and invalid dates. Verify Settings has no standalone goal import. | Automated fixture or UI test |
| R-71 | AT-71: Round-trip duplicate titles and mixed completion, then reimport changed and omitted history. Verify the resulting persisted state equals the file. | Automated fixture or UI test |
| R-72 | AT-72: Try invalid date, missing workout measure, invalid effort and cancelled picker against a populated plan. Verify feedback and unchanged storage. | Automated fixture or UI test |
| R-73 | AT-73: Freeze local today across a month boundary. Verify seven date groups, hidden history by default, and past planned workouts and cached Garmin activities visible after expanding history. Verify Run · Easy, ride, duration-only, distance-only and both-measure layouts. | Automated fixture or UI test |
| R-74 | AT-74: Mark a partly performed session complete with note and effort, restart and verify. Reject 0, 11, fractions and a save after midnight. | Automated fixture or UI test |
| R-75 | AT-75: Edit, move and swap eligible workouts. Reject completed moves and past prescription edits. Move an unstarted past workout forward and compare every prescription field. | Automated fixture or UI test |
| R-76 | AT-76: Exercise all operations, day-seven and day-eight boundaries, both move dates, past/completed targets, copy a completed past example and exercise a rule violation. | Automated fixture or UI test |
| R-77 | AT-77: Reject and approve proposals, inspect invalid diffs, edit and reimport during separate reviews, and verify stale proposals cannot apply. Seed out-of-order Garmin activities and verify newest context for lookup and proposals. | Automated fixture or UI test |
| R-78 | AT-78: Check all three tabs and both sync controls, save Settings, and inspect narrow and desktop layouts and Android large text. | Automated fixture or UI test |
| R-79 | AT-79: Export mixed run and ride fixtures in both formats. Check dates, units, escaped fields and missing HR. | Automated fixture or UI test |
| R-80 | AT-80: If implemented, sync multiple activities on a shared date and verify visibility and unchanged completion. | Automated fixture or UI test |
| R-81 | AT-81: Repeat each delayed action and verify one operation and recovery after success or failure. | Automated fixture or UI test |
| R-82 | AT-82: Load packaged guidance on Android, test missing assets, and exercise truncated and complete provider responses. | Automated fixture or UI test |
| R-83 | AT-83: Execute the traceability matrix, recording automated and device results by acceptance ID. | Acceptance matrix and suite review |

| Story | Acceptance cases |
| --- | --- |
| US-01 | AT-70, AT-73 |
| US-02 | AT-71 |
| US-03 | AT-72 |
| US-04 | AT-73 |
| US-05 | AT-75 |
| US-06 | AT-74 |
| US-07 | AT-76, AT-77 |
| US-08 | AT-28, AT-78, AT-79 |

## Evidence for changed workflows

- AT-70–72: training-plan.test.ts and app.test.tsx.
- AT-73–75: app.test.tsx covers schedule rendering, completion with note and exertion, past rescheduling and swaps. Verify the local date boundary and exercise swap and past rescheduling on Android.
- AT-76–77: training-proposal.test.ts, app.test.tsx and llm.test.ts. Verify a live OpenRouter proposal with cached Garmin activity on Android.
- AT-78: app.test.tsx and navigation-ui.test.tsx. Verify both sync entry points against a connected account on Android.
- AT-79: training-plan.test.ts. Verify both share files from Settings on Android.
- AT-80: Optional same-day Garmin display is deferred.
- Earlier cases retain the evidence listed by acceptance ID in TESTING.md. Repeat the device checks on the 0.2.0 APK.
