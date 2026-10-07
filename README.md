# Stride AI

Stride AI is a planned local-first personal Android trainer for running and cycling. AI generates a flexible plan from creation through the event date. All initial plans and proposed changes require review and acceptance before becoming active.

## Status

The repository contains TypeScript modules, training content, and test scaffolds. It is not yet runnable: App.tsx, dependency manifest, Expo/test configuration, and Android build setup must be restored or created. There are currently no verified install/start/build commands. Documentation describes target behavior rather than completed features.

- [Requirements and matching acceptance cases](REQUIREMENTS.md)
- [Development milestones](DEVELOPMENT_PLAN.md)

## Intended experience

- Personal Android use, English, metric units, and minimalist dark styling.
- Today plus six days of workouts and a full overview through the event date.
- OpenRouter with a securely stored user-supplied API key and selectable model and reviewable plan proposals.
- On-demand Garmin activity/athlete sync using available metrics.
- Ten retained chat threads, manual completion, Markdown/PDF/calendar exports, and current-plan backup/restore.
- Optional browser access and Garmin workout/calendar push.

App state stays local. Coaching sends selected context through OpenRouter to the selected downstream model provider. Garmin communication is separate; Garmin secrets never belong in coaching or backups. Cross-device synchronization is not specified.

## Training content

The authoritative files are [goal.md](training/goal.md), [research.md](training/research.md), and [constraints.md](training/constraints.md). Planned behavior includes bundled loading, device import, and local research/constraints editing.

Goal fields are name, date, distance, target time, and elevation. Time is hours:minutes, optionally hours:minutes:seconds. Calculate pace from time/distance; a legacy pace field cannot override it.

The current goal is Halbmarathon on 11 April 2027, updated by the owner. Its 21.1 km / 2:00 target calculates to approximately 5:41/km, superseding the supplied 5:30/km.

## Development and delivery

Restore the Android foundation, then verify native Garmin authentication and retrievable metrics using the owner's account. Implement or execute each acceptance case in REQUIREMENTS.md, using automated tests for logic and Android checks for native behavior. Existing mocked tests do not establish Garmin compatibility.

The eventual reproducible build must be independent of Ona and output artifacts/stride-ai-release.apk. Document prerequisites, commands, and signing after verification. Ona and native iOS delivery are out of scope. Verify native-cookie compatibility with the chosen Expo workflow before publishing setup instructions.

## Source layout

```text
src/                       Data, storage, coaching, Garmin, imports, exports
__tests__/                 Existing test scaffolds
training/                  Goal and coaching guidance
REQUIREMENTS.md            Required/optional behavior and acceptance cases
DEVELOPMENT_PLAN.md         Milestones and acceptance gates
```
