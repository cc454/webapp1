# Verification record

Updated 8 October 2026. Passing automated cases are evidence for the named logic, not proof of native device behavior or real-service compatibility.

## Launcher branding in 0.1.8

The owner confirms the recent app changes work, but reported the Android robot launcher icon under the correct Adaptai name. The app had no Expo launcher icon configuration. Version 0.1.8 now uses PNGs rendered from the existing vector brand mark for legacy, adaptive and monochrome launcher layers. The adaptive artwork fits within its central safe circle; the background matches the app's near-black palette. No new design or provider requests are needed.

Expo prebuild generates legacy/round icons and foreground/monochrome layers in all five Android density directories. Both adaptive XML resources reference the custom layers and dark background, and the app label remains Adaptai. Native packaging and final APK verification are recorded below. Home/all-apps appearance after upgrading and Android themed-icon presentation require a phone check.

## Plan, chat and model usability in 0.1.6

The owner reports all recent changes work. The new update limits completion/uncompletion to today's running/cycling sessions, checks the device's local date again when saving, refreshes the calendar on foreground return, and displays English weekday labels. A collapsible entire-plan summary appears after the export/restore controls and includes saved strategy, progression, constraint decisions, sport totals and all phase weeks. Older plans still show their calendar, totals and phases.

Chat scrolls to the layout position of the latest coach message when it arrives, a conversation opens, or the owner returns to the retained Chat tab; earlier message layouts cannot replace the target. A viewport-sized space below the conversation permits even a short reply to align at its top. Keyboard resizing updates that space. Manual scrolling does not trigger automatic jumps. Error feedback still scrolls into view. The model dropdown provides Sonnet 4.6, Haiku 4.5 and Gemini 2.5 Flash, retaining the editable identifier and explicit Save settings behavior.

Regression cases cover today's completion/uncompletion persistence, future/rest exclusion and a stale button pressed after midnight; exact Thursday date formatting; expanded/collapsed modern and legacy summaries; latest-reply layout, thread switching, new replies and keyboard viewport changes; all three preset IDs, custom editing, persistence and reload. Android visual acceptance of these new controls remains to be checked on the phone. No live provider requests were needed for these changes.

Strict TypeScript, all 135 tests across 21 suites and web export pass in [clean-install GitHub CI for final source fb0c63c](https://github.com/cc454/webapp1/actions/runs/37738844795). Browser inspection confirms all model dropdown choices and the editable identifier; no settings were saved during that inspection.

Native release packaging and the final incremental bundle refresh pass. APK verification confirms 0.1.6/code 7, target API 36, ARM64/ARMv7 and the installed app's signing certificate. Bundle timestamps are later than the final route/screen edits, including the retained-tab focus fix.

## Draft discard/restart and 0.1.5 update

The owner reported an input-mismatch error after pressing discard, with Generate initial plan still disabled. The old first discard tap only revealed an inline confirmation. It now opens a visible modal; confirm removes the draft, while cancel retains it. Failed deletion keeps the dialog open with feedback and allows retry. Draft-incompatible resume is disabled with an explanation, and generation prerequisites are shown. Successful discard clears error/draft state and re-enables fresh generation without resetting settings or the active plan.

A background completion callback also loaded the draft asynchronously without checking whether it had since been discarded/replaced. A read-version guard now prevents a delayed result/error from restoring deleted draft state. The regression deliberately resolves that read after deletion and verifies the fresh-generation button stays enabled. If a complete proposal arrives while the dialog is open, confirmation clears that in-memory proposal too. Signatures now compare canonical nested JSON values, supporting older unsorted signatures and avoiding false mismatches when Zod/storage reorders keys. Both weekly and library engines resume reordered complete-draft signatures without provider calls; changed values remain incompatible.

Strict TypeScript, 128 tests across 20 suites and web export pass in [clean-install CI for final source 3a58acd](https://github.com/cc454/webapp1/actions/runs/37628752235). New UI tests cover confirmation/cancellation, failed deletion/retry, clear-then-generate with a null draft, and the stale-read/proposal races. Native packaging passes; final incremental bundling includes the late-proposal fix. APK verification confirms 0.1.5/code 6, target API 36, ARM64/ARMv7 and the same signing certificate. The owner's exact phone flow still needs a recheck; these reproductions identify supported failure paths, not a captured trace from the phone.

## Workout Library and 0.1.4 update

The owner requested an editable Markdown library and LLM-owned progression/recovery/tapering/conflict resolution with local plan assembly. Workout Library is now a fourth route/tab, containing the ten requested categories and separate sport parameter ranges. Its saved Markdown is imported/exported, edited in a bounded field, and validated before replacement. Starter restoration requires confirmation. Legacy state receives the starter; active plans remain unchanged by library edits. `training/workouts.md` is checked against the bundled starter string.

Fresh generation uses two stages: an LLM strategy/progression/variant/pattern/week outline, then one compact parameter block per distinct variant. A 27-week fixture creates 187 dated entries including its partial final week with two provider calls. Repeats share the prescription but own separate step objects, dates, IDs and completion. Local assembly calculates recoveries between repetitions/sets, durations and sport volumes; library bounds and calendar rules remain enforced. Parameter conflicts are returned to the LLM, followed by at most one outline rebuild if needed. The tests reproduce Monday repair and explicit handling of conflicting prose. Progression, recovery, tapering and training distribution are model decisions; these tests do not prove their physiological suitability.

Both planning stages and assembled weekly drafts are persisted. Tests interrupt after the outline and resume the next day with only the remaining stage; complete drafts cause zero requests. Existing 0.1.3 weekly drafts retain their original resume engine. Tests verify preserved completed history, metadata backup/restore, and review of strategy, constraint decisions and phase volumes before activation. Editing a library invalidates incompatible new drafts before any provider request.

Strict TypeScript and 122 tests across 19 suites pass locally and in [clean-install GitHub CI for source e5c1f28](https://github.com/cc454/webapp1/actions/runs/37623773564). Web export and native packaging pass. Browser inspection confirmed the fourth selected tab, ten templates and a 140-pixel editor with internal scrolling. APK verification confirms version 0.1.4, code 5, target API 36, ARM64/ARMv7, the foreground dataSync service and the same signing certificate. Bundle timestamps confirm the final application source is included. Real-model output quality/cost, native sharing/upgrade and screen-off/resume acceptance remain pending on the owner's phone. No live provider calls were made during development tests, and no measured monetary savings are claimed.

## Phone feedback and 0.1.3 update

The owner reached week 27, then encountered “Step durations do not match session: 2027-04-08,” losing the unsaved proposal after a $3.60 run. Generated interval totals and overview volumes are now derived locally before scheduling validation. A regression reproduces the April 8 mismatch and resolves it in one provider request; a derived Monday total above the cap remains rejected. Imported backups retain strict validation.

Each validated weekly batch is persisted separately from the active plan. A failed-second-week fixture resumes on the next day with one request and the original creation date; complete drafts reopen without provider calls. Changed inputs are rejected before requests. UI tests cover restored proposals, review/rejection, and damaged-draft discard without losing a valid active plan. Earlier app versions did not persist these drafts, so this update cannot recover their lost generation.

Android uses a foreground dataSync service and wake lock, with progress notifications and cancellation. Automated tests cover native task registration, progress, duplicate prevention, cancellation after provider remount, and cleanup on success/failure. The library patch avoids sticky restart of an unregistered task and stops on Android service timeout. APK inspection confirms FOREGROUND_SERVICE, FOREGROUND_SERVICE_DATA_SYNC, WAKE_LOCK, POST_NOTIFICATIONS, a non-exported service, and service type dataSync. Screen-off and app-switch behavior still need physical-device acceptance; force-stop/reboot/OS termination require manual resume from retained weeks.

Strict TypeScript, 105 tests across 16 suites, web export, and native packaging pass. [Clean-install GitHub CI](https://github.com/cc454/webapp1/actions/runs/37616642042) also passed for source commit 7fcba4c. The final incremental Android build includes the latest application source. Signature matches the owner's installed build: version 0.1.3, code 4, target API 36, ARM64/ARMv7. Reduced context and concise-output instructions are tested; no live cost reduction or cheaper-model plan quality has been measured. Model remains user-selected. Prompt caching is documented as a future option, not enabled.

## Phone feedback and 0.1.2 update

The owner now confirms Garmin connection/activity import and the chat keyboard/draft behavior work. Live chat remains functional; plan generation reports “JSON Parse error: Unexpected end of input.” This originates outside the weekly plan JSON-validation handler in the transport envelope parser. Empty/truncated envelopes are now translated into useful errors; plan requests use SSE keep-alives and a bounded transport retry, rejecting unfinished streams and HTTP-200 provider errors. This fixes the unhandled parse-error path; the exact cause of the owner's truncated response and live generation recovery still need a phone recheck.

The update limits fetched/cached activities to 50, migrates old state without losing chats/settings, fetches VO₂ max/cycling FTP/kg/heart-rate zones, and adds Settings units/timestamps/warnings. Optional endpoint failures retain cached fitness values and do not discard successful activities. Chat renders Markdown, including code and tables, with raw HTML treated as text, safe link protocols, and descriptive image text.

Strict TypeScript, 93 tests across 14 suites, and web export pass locally and in [clean-install CI for the final source change](https://github.com/cc454/webapp1/actions/runs/37609385969). Tests cover a 27-week creation-to-event horizon, complete/incomplete SSE, empty/malformed envelopes, HTTP-200 provider errors, bounded retry recovery/exhaustion, acceptance-before-save, supported Garmin mappings, legacy migration, partial sync, Markdown rendering, and fitness Settings display. Browser inspection confirmed the new fitness section and missing-data labels. The final native 0.1.2 build passed; signature and package metadata confirm the same certificate as the installed app, version code 3, target API 36, and ARM64/ARMv7 support.

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

Current APK 0.1.6 (version code 7): `artifacts/stride-ai-release.apk`, 59,822,368 bytes. SHA-256: `93e4c3f09178a2b2e0b6ec48612dcb66804d384035586e51ee52aa07ebb053a6`. Testing-only debug certificate SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`. Install over the existing app to preserve local data.

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
| AT-11 | restore-ui.test.tsx verifies today's completion/uncompletion persistence, future/rest exclusion and a stale press across midnight without saving. Native date rollover/restart checks remain. |
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
| AT-43 | All 135 tests, strict checking, and web export passed in clean-install GitHub CI for 0.1.6; new native visual checks remain. |
| AT-44 | Workspace-local SDK/JDK installed; native release packaging completed successfully with the Windows path fixes. |
| AT-45 | Testing-only 0.1.6 APK built; signature matches the installed version, package and ARM architectures verified. Owner confirms recent updates work; new controls and upgrade visual check pending. |
| AT-46 | Browser preview compiles and basic flows verified; broader responsive/backup checks pending. Optional. |
| AT-47 | Deferred Garmin workout push. Optional. |
| AT-48 | Deferred Garmin push retry tracking. Optional. |
| AT-49 | garmin.test.ts verifies latest-50 retention, request limit, and legacy-state migration with chats preserved. |
| AT-50 | garmin.test.ts and markdown-chat.test.tsx cover precise VO₂, cycling FTP/kg, missing values, profile fallback, zone ranges, timestamps, cache warnings, and Settings display. app.test.tsx verifies activity persistence with optional metric failures. Live metric comparison pending. |
| AT-51 | markdown-chat.test.tsx covers headings/emphasis/lists/quotes/code/tables/links, literal HTML, blocked unsafe protocols, and image descriptions. Native visual recheck pending. |
| AT-52 | llm.test.ts covers complete/truncated SSE, keep-alives, malformed JSON, HTTP-200 provider errors, bounded retry, and full 27-week horizon; app.test.tsx verifies explicit acceptance before save. Live plan recheck pending. |
| AT-53 | generation-resume.test.ts reproduces April 8 step mismatch and verifies repeat arithmetic without a paid repair; derived Monday limit is still enforced. backup.test.ts retains strict imported-plan validation. |
| AT-54 | generation-resume.test.ts covers late failure/resume, next-day original dates, complete drafts without requests, and changed inputs. app.test.tsx covers completed-proposal restoration/rejection and corrupt-draft recovery. storage.test.ts verifies a separate SQLite draft table. Physical SQLite restart/resume check pending. |
| AT-55 | generation-background.test.ts covers registration/progress/cleanup/duplicates/cancellation after remount. Native APK permissions and service type verified. Screen-off, app switch, and force-stop/resume checks remain pending on the owner's phone. |
| AT-56 | generation-resume.test.ts inspects compact activities, preserved HR, concise output instructions, selected model, local correction and resume request counts. Previous sessions are bounded to fourteen in source. README documents current prices and caching limitations. Actual billing and cheaper-model quality comparison pending. |
| AT-57 | workout-library.test.ts checks ten IDs and valid sport defaults; workout-library-ui.test.tsx renders the categories. Browser route/tab and editor inspected. Native display pending. |
| AT-58 | workout-library.test.ts checks syntax, duplicate IDs, ranges, coupled defaults and sport bounds. UI tests cover valid import/export, invalid/cancelled imports, edited save and confirmed restoration. Native file/share/restart check pending. |
| AT-59 | Legacy settings migration and active-plan-preserving edits are tested; library-planner.test.ts rejects mismatched signatures before requests. Phone upgrade pending. |
| AT-60 | library-planner.test.ts checks two-stage instructions, selected model, Monday repair, bounded outline rebuild and explicit conflict decisions. Live model phase/progression quality pending. |
| AT-61 | library-planner.test.ts builds a 27-week/two-request fixture, unique independent repeat instances, complete/partial dates, strict bounds and preserved history. workout-library.test.ts verifies chronological between-repetition/set recovery and FTP mapping. |
| AT-62 | Tests cover saved outline resume, next-day creation dates, complete-draft zero-request reuse, metadata backup round-trip and rendered strategy/constraint/phase review before acceptance. Native background/restart checks pending. |
| AT-63 | generation-inputs.test.ts verifies nested/legacy JSON ordering and state round-trip compatibility; both generation engines test complete-draft reuse with reordered signatures. app.test.tsx verifies modal cancellation/confirmation, deletion failure/retry, fresh generation without the discarded draft and stale background-read rejection. Phone recheck pending. |

| AT-64 | navigation-ui.test.tsx checks Thursday 2026-10-08; restore-ui.test.tsx verifies rendered local calendar weekday. Native timezone/date rollover check pending. |
| AT-65 | navigation-ui.test.tsx expands/collapses saved strategy, full phase focus and totals, and verifies legacy plans without metadata. Native multiweek visual check pending. |
| AT-66 | navigation-ui.test.tsx verifies latest coach coordinates, short-reply spacer, keyboard viewport resizing, thread switching, a new reply and returning to a retained tab. Native keyboard/manual scrolling check pending. |
| AT-67 | navigation-ui.test.tsx checks exact preset IDs and custom editing without automatic save. chat-ui.test.tsx verifies preset/custom persistence and reload. Existing provider tests verify selected-model payloads. Native dropdown/live preset requests pending. |

| AT-68 | Source assets and generated native launcher resources inspected: 1024px originals, transparent adaptive layers, central safe bounds, five densities and both round/adaptive XML files. Final APK and phone checks are recorded in the launcher section. |

## Device acceptance sequence

1. Install the testing APK on the owner's Android phone and verify launch/navigation.
2. Load all project files and configure the OpenRouter key/model inside the app.
3. Save Garmin credentials, connect, and sync. Record actual supported fields and authentication behavior; update the adapter if Garmin has changed.
4. Generate and reject one plan, then generate/review/accept a valid plan. Verify no plan mutation before acceptance.
5. Mark a workout complete, restart, resume a chat, request/review a revision, and verify completion history survives.
6. Export all three formats and import the calendar into a real calendar app. Back up, reject a restore, then accept the restore.
7. Test offline use, failed requests, session expiry, and an upgrade with the same signing identity.
8. Start generation, permit notifications, turn the screen off and switch apps; verify continuing progress and review. Cancel/reopen/resume and verify completed weeks are retained. Force-stop after a saved week, reopen, and resume; record billing and confirm already validated weeks are not requested again.
9. In Workout Library export the starter .md, edit a template, import it and restart. Verify saved changes, valid rejection/cancellation and that the active plan is untouched. Generate with the new pipeline, inspect strategy/phase progression and all sessions before acceptance, and record actual token costs and model quality.

Do not record keys, passwords, session cookies, or private raw account data in test evidence committed to Git.
