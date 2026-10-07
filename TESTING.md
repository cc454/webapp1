# Verification record

Updated 7 October 2026 after recovery from a reboot. Passing automated cases are evidence for the named logic, not proof of native device behavior or real-service compatibility.

## Phone feedback and 0.1.2 update

The owner now confirms Garmin connection/activity import and the chat keyboard/draft behavior work. Live chat remains functional; plan generation reports “JSON Parse error: Unexpected end of input.” This originates outside the weekly plan JSON-validation handler in the transport envelope parser. Empty/truncated envelopes are now translated into useful errors; plan requests use SSE keep-alives and a bounded transport retry, rejecting unfinished streams and HTTP-200 provider errors. This fixes the unhandled parse-error path; the exact cause of the owner's truncated response and live generation recovery still need a phone recheck.

The update limits fetched/cached activities to 50, migrates old state without losing chats/settings, fetches VO₂ max/cycling FTP/kg/heart-rate zones, and adds Settings units/timestamps/warnings. Optional endpoint failures retain cached fitness values and do not discard successful activities. Chat renders Markdown, including code and tables, with raw HTML treated as text, safe link protocols, and descriptive image text.

Strict TypeScript and 93 tests across 14 suites pass. Tests cover a 27-week creation-to-event horizon, complete/incomplete SSE, empty/malformed envelopes, HTTP-200 provider errors, bounded retry recovery/exhaustion, acceptance-before-save, supported Garmin mappings, legacy migration, partial sync, Markdown rendering, and fitness Settings display. The first 0.1.2 source update also passed [clean-install CI](https://github.com/cc454/webapp1/actions/runs/37607642075). Browser inspection confirmed the new fitness section and missing-data labels. The first native 0.1.2 build succeeded; the constraint follow-up is being rebuilt for delivery.

The owner supplied the exact remaining validation error: a long session on Monday 2026-10-12 exceeded 40 minutes. Every initial and repair request now starts with a schedule-construction brief: explicit rest quota, permitted long-session weekdays/dates, Monday's total 2,400-second cap, previous-day hard-session restrictions, and the saved additional constraints/guidance. Provider schemas pin batch dates and enforced rule values. A regression reproduces both Monday violations and verifies constraint instructions exist before generation and during repair; final validation and review remain mandatory. Real-model recovery still needs a phone check.

## Phone feedback and 0.1.1 fixes

The owner confirmed 0.1.0 installs/launches, OpenRouter and chat work with `anthropic/claude-sonnet-4.6`, and Markdown loading works. Garmin failed with “Garmin returned unreadable activity data”; full plan generation produced no visible feedback. Keyboard avoidance, draft clearing, and large settings fields were also reported.

The 0.1.1 update replaces the web-cookie Garmin transport with mobile token authentication and refresh, skips unsupported sports before checking metric fields, pins the chat composer, clears only successful submitted drafts, bounds multiline fields with scrolling, and reveals progress/errors automatically. Plan generation uses a portable schema, a bounded JSON fallback, and two bounded repair attempts per week. Strict TypeScript, all 72 tests across 13 suites, and web export pass locally and in [clean-install CI](https://github.com/cc454/webapp1/actions/runs/37603042207). The Android build completed successfully; signature verification confirms the same certificate as 0.1.0, version name 0.1.1, version code 2, and ARM64/ARMv7 support. The manifest enables `adjustResize`. A browser check confirmed 100 research lines scroll within a 138-pixel input. Android upgrade, keyboard behavior, Garmin account access/sync, and a full event-length plan need owner retesting.

## Executed checks

- Strict TypeScript: passed (`pnpm typecheck`).
- Jest: 62 tests across 12 suites passed in [GitHub CI for commit 10e961b](https://github.com/cc454/webapp1/actions/runs/37596204501); strict TypeScript and web export also passed in that clean Linux installation.
- Expo compatibility check: passed before reboot.
- Web export: rebuilt after reboot with the corrected hoisted dependency layout; preview restarted on localhost:8082. Reload retains the event and calculated 5:41/km pace.
- Android JavaScript/Hermes export: compiled before reboot.
- Android prebuild and native APK packaging: passed for 0.1.0 and 0.1.1. `apksigner verify --print-certs` passed; package `com.cc454.strideai`, version 0.1.1, target API 36, ARM64/ARMv7. The owner confirmed 0.1.0 installation; the 0.1.1 upgrade needs retesting.
- Browser UI: goal loading, calculated 5:41/km pace, navigation, no-key generation error, and reload persistence were verified before reboot.
- The owner verified live OpenRouter chat, Markdown loading, Garmin login/activity sync, and keyboard/draft behavior on their phone. The 0.1.2 fitness values and full plan generation still need a phone recheck. No Android device is connected to this build host.

## Acceptance-case traceability

APK 0.1.1: `artifacts/stride-ai-release.apk`, 59,524,612 bytes. SHA-256: `567d153ae88b9ed8cd510f5d01781511f31e541eb923e836b0254179fc3788e6`. Testing-only debug certificate SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.

Each AT ID below corresponds to the same-numbered requirement in REQUIREMENTS.md. “Pending” and “partial” are intentional: the Android release is not yet fully accepted.

| Case | Evidence / remaining work |
| --- | --- |
| AT-01 | Owner confirmed installation and launch on Android; offline acceptance remains pending. |
| AT-02 | Plan schemas and plan/export fixtures distinguish run/ride/rest; device rendering pending. |
| AT-03 | goal.test.ts and browser project-goal load passed. |
| AT-04 | goal.test.ts covers missing/invalid fields; owner confirmed Markdown loading on Android. |
| AT-05 | goal.test.ts covers calculated pace, seconds, aliases, and invalid times. |
| AT-06 | goal.test.ts covers past/today events without substitution. |
| AT-07 | llm.test.ts verifies fixture-based generation and no active mutation; real service pending. |
| AT-08 | plan.test.ts covers date boundaries and long intervals; full long-plan AI generation pending. |
| AT-09 | plan.test.ts covers the rolling interval; rendered plan fixtures cover the view. |
| AT-10 | Plan screen fields implemented; representative device review pending. |
| AT-11 | restore-ui.test.tsx verifies completion persistence from rendered controls. |
| AT-12 | Overview validation implemented; long/partial plan rendering review pending. |
| AT-13 | constraints.test.ts and plan.test.ts verify supported rules, conflict detection, partial-block policy, and date-specific construction limits. llm.test.ts reproduces the reported Monday long-session/40-minute failure and verifies explicit initial/repair instructions and schema-pinned dates/rules. |
| AT-14 | app.test.tsx verifies no save before acceptance and duplicate generation prevention. |
| AT-15 | plan.test.ts verifies diffs, invalid plans, and preserved completed history. |
| AT-16 | storage.test.ts covers SQL-bound state and corruption; actual SQLite restart check pending. |
| AT-17 | markdown.test.ts covers all bundled kinds; exports include the real assets; goal verified in browser. |
| AT-18 | markdown.test.ts covers import/cancel/size/type errors; edit/restart device checks pending. |
| AT-19 | Owner confirmed OpenRouter and chat with Claude Sonnet 4.6; llm.test.ts and storage.test.ts verify model/authentication/secure-key calls. |
| AT-20 | llm.test.ts checks context and unknown metrics; Garmin inventory still partial. |
| AT-21 | llm.test.ts verifies 20,000-character limits; UI notice implemented. |
| AT-22 | llm.test.ts covers HTTP, provider errors inside HTTP 200, incomplete JSON/SSE, and bounded retry recovery; live plan recovery/timeout checks pending. |
| AT-23 | llm.test.ts verifies zero network calls without a key; browser error verified. |
| AT-24 | llm.test.ts inspects safety instructions; real symptom conversation check pending. |
| AT-25 | chat.test.ts verifies ten threads and resumed messages; device restart pending. |
| AT-26 | Owner confirms mobile-adapter Garmin connection works; mobile token exchange/profile validation regression tests pass. |
| AT-27 | storage.test.ts verifies secret storage and blank-password retention; device input/session check pending. |
| AT-28 | Owner confirms activity import works; sync/cache/time fixtures pass; offline restart pending. |
| AT-29 | garmin.test.ts verifies run/ride mapping, deduplication, optional metrics, and malformed input; lap retrieval not implemented. |
| AT-30 | Partial-history baseline and fetched VO₂/cycling power/zones included in coaching context; new metric mappings tested, real-account comparison pending. Load/recovery unknown. |
| AT-31 | garmin.test.ts covers unauthorized disconnect; real expiry/cache/network checks pending. |
| AT-32 | app.test.tsx verifies generation lock; global action lock implemented; other concurrent controls need device checks. |
| AT-33 | exports.test.ts covers actual dates; PDF/calendar import acceptance pending. |
| AT-34 | exports.test.ts covers filename safety, HTML/calendar escaping, stable IDs, and UTF-8 folding. |
| AT-35 | Native share/fallback implemented; share-sheet device checks pending. |
| AT-36 | backup.test.ts verifies portable round-trip and undeclared secret/chat exclusion. |
| AT-37 | backup.test.ts and restore-ui.test.tsx cover invalid backups, preview/rejection, accepted replacement, and retained settings/chats. |
| AT-38 | Plan/Chat/Settings browser navigation verified; Android flow review pending. |
| AT-39 | Dark English/metric browser UI reviewed; small/large Android checks pending. |
| AT-40 | llm.test.ts checks endpoint/auth and exclusion of Garmin email; full device traffic inspection pending. |
| AT-41 | Native SecureStore calls tested and disclosure implemented; native state/log/network inspection pending. |
| AT-42 | Strict type checking passed. |
| AT-43 | Suite passed; several manual acceptance checks remain. CI configuration added but not yet run on GitHub. |
| AT-44 | Workspace-local SDK/JDK installed; native release packaging completed successfully with the Windows path fixes. |
| AT-45 | Testing-only debug-signed APK produced and signature verified; phone installation and data-preserving upgrade checks pending. |
| AT-46 | Browser preview compiles and basic flows verified; broader responsive/backup checks pending. Optional. |
| AT-47 | Deferred Garmin workout push. Optional. |
| AT-48 | Deferred Garmin push retry tracking. Optional. |
| AT-49 | garmin.test.ts verifies latest-50 retention, request limit, and legacy-state migration with chats preserved. |
| AT-50 | garmin.test.ts and markdown-chat.test.tsx cover precise VO₂, cycling FTP/kg, missing values, profile fallback, zone ranges, timestamps, cache warnings, and Settings display. app.test.tsx verifies activity persistence with optional metric failures. Live metric comparison pending. |
| AT-51 | markdown-chat.test.tsx covers headings/emphasis/lists/quotes/code/tables/links, literal HTML, blocked unsafe protocols, and image descriptions. Native visual recheck pending. |
| AT-52 | llm.test.ts covers complete/truncated SSE, keep-alives, malformed JSON, HTTP-200 provider errors, bounded retry, and full 27-week horizon; app.test.tsx verifies explicit acceptance before save. Live plan recheck pending. |

## Device acceptance sequence

1. Install the testing APK on the owner's Android phone and verify launch/navigation.
2. Load all project files and configure the OpenRouter key/model inside the app.
3. Save Garmin credentials, connect, and sync. Record actual supported fields and authentication behavior; update the adapter if Garmin has changed.
4. Generate and reject one plan, then generate/review/accept a valid plan. Verify no plan mutation before acceptance.
5. Mark a workout complete, restart, resume a chat, request/review a revision, and verify completion history survives.
6. Export all three formats and import the calendar into a real calendar app. Back up, reject a restore, then accept the restore.
7. Test offline use, failed requests, session expiry, and an upgrade with the same signing identity.

Do not record keys, passwords, session cookies, or private raw account data in test evidence committed to Git.
