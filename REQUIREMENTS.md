# Stride AI requirements

## Product purpose

Stride AI is a privacy-conscious, local-first mobile personal trainer for an athlete preparing for a target endurance event over a 16-week plan. The app must run as an Expo application on Android and iOS, with Android release APK builds available from Ona.

## Functional requirements

### Training plan

1. Display an active target event with name, date, distance, target time, elevation, and target pace.
2. Show a seven-day training plan containing date, title, details, duration, workout type, and completion state for every workout.
3. Let the athlete toggle a workout's completion state.
4. Provide a 16-week macro plan with week number, phase, volume, and focus.
5. Persist the active plan, event, and non-secret settings on the device.

### Event, research, and constraints content

6. Import a `goal.md` or plain-text file and parse all six required event fields: name, date, distance, target time, elevation, and pace.
7. Reject an invalid goal document and identify missing fields.
8. Load bundled `goal.md`, `research.md`, and `constraints.md` files from the application assets.
9. Import research and constraints Markdown or plain-text files from the device.
10. Allow research and constraints text to be edited in the app and persisted locally.

### Coaching

11. Support Claude (Anthropic) and Gemini as selectable coaching providers.
12. Store the chosen provider's API key in device secure storage.
13. Build coaching context from the active event, research, constraints, current week, and recent Garmin activity summaries.
14. Limit research and constraints content included in a coaching request to 20,000 characters each.
15. Send a coaching prompt directly to the selected provider and show the returned text or a useful error.
16. Do not make a network request when no API key is configured; explain how to configure one.
17. Instruct the coach not to diagnose injury and to recommend medical evaluation for concerning symptoms.

### Garmin integration

18. Store Garmin passwords and Garmin session metadata in device secure storage.
19. Authenticate with Garmin Connect using the native cookie store and report invalid credentials or unavailable sessions.
20. Sync recent Garmin activities, mapping name, start time, distance, duration, average heart rate, and average pace.
21. Treat expired or unauthorized Garmin sessions as disconnected and require reauthentication.
22. Push every non-rest workout as a structured Garmin running workout and create its matching calendar entry.
23. Report Garmin failures rather than claiming that a sync or calendar push succeeded.

### Exports

24. Export the current week as Markdown, PDF, or iCalendar (`.ics`).
25. Use a safe event-derived filename for Markdown and calendar exports.
26. Use the device share sheet when sharing is available.

### User interface

27. Provide Plan, Chat, and Settings navigation.
28. Provide controls to connect Garmin, sync activities, push the week to Garmin, import/load content, choose a provider, and export the plan.
29. Show a busy state while Garmin actions are in progress and prevent duplicate actions.
30. Keep the Garmin password field blank after entry; entering a value replaces the securely stored password.

## Privacy and security requirements

31. Keep plan state, event data, imported Markdown, and workout completion state on the device.
32. Keep API keys, Garmin passwords, and Garmin session metadata in encrypted device storage.
33. Only send the selected coaching context to the user-selected LLM provider.
34. Never include Garmin passwords or session tokens in coaching context or provider requests.

## Quality and delivery requirements

35. TypeScript must pass strict type checking.
36. Unit tests must cover application modules, provider request handling, storage, file import/load behavior, export behavior, Garmin adapter behavior, default plans, and app rendering.
37. Android builds must run through the Ona task named **Build Android release APK**.
38. The task must create `artifacts/stride-ai-release.apk` from the Android release variant.
39. The current release variant is signed with the Android debug certificate and is for testing only; production/Google Play distribution requires a separately managed release keystore.
