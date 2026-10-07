# Stride AI development plan

Updated 7 October 2026. REQUIREMENTS.md defines the agreed scope and acceptance cases.

## Agreed scope

Personal Android app for running/cycling; AI generates a plan from creation through event date; every initial/revised plan requires review and acceptance. Show today plus six days. Use available Garmin metrics with on-demand sync. English, metric units, minimalist dark style, ten retained chat threads, and current-plan backup/restore. Web access and Garmin workout push are optional. Ona and native iOS delivery are out of scope.

## Baseline

Modules and tests exist, but App.tsx, dependency manifest, Expo/TypeScript/test configuration, and build setup are missing. Asset imports target assets/training while files live in training. Plans/calendar dates are hardcoded. Coaching cannot apply reviewed revisions. Garmin sport/interval mapping, durations, and retries need work.

The authoritative goal is the half marathon in training/goal.md, updated by the owner to 11 April 2027. Calculate pace from distance/time rather than the legacy pace field.

## Milestones

1. **Runnable Android foundation:** restore entry point, dependencies/configuration, asset loading, and dark navigation. Select/document a reproducible non-Ona build workflow. Exit: Android launches, typecheck/tests run (R-01, R-17, R-38–39, R-42–45).
2. **Early Garmin feasibility:** verify real non-MFA sign-in and on-demand sync on Android; inventory retrievable metrics, secure sessions, cache, and expiry behavior. Exit: run/ride baseline is available with unavailable fields marked unknown (R-26–31, R-40–41). Mocks alone are insufficient.
3. **Canonical data:** implement ISO dates, numeric metric values/durations, structured sport-specific sessions, variable plan span, calculated pace, revisions, ten chat threads, and versioned persistence. Exit: date boundaries, invalid goals, and state recovery pass (R-02–06, R-08–12, R-16, R-25).
4. **AI generation and review:** use Garmin baseline and guidance, enforce constraints, validate responses, and show initial/revision differences with accept/reject. Preserve completed history. Use OpenRouter with secure key storage, model selection, bounded context, and useful errors. Exit: no active change occurs before acceptance (R-07, R-13–15, R-18–24, R-32, R-40–41).
5. **Daily use and portability:** complete rolling view, full overview, manual completion, resumed chats, Markdown/PDF/calendar exports, versioned backup, and reviewed atomic restore. Exit: offline behavior and backup round-trip pass; exports match visible dates (R-09–12, R-16, R-25, R-33–39).
6. **Android delivery:** execute required acceptance cases, record automated/device evidence by AT ID, verify clean install and data-preserving upgrades, and document verified commands. Exit: R-01–45 pass and artifacts/stride-ai-release.apk is produced.
7. **Optional enhancements:** responsive browser support after defining browser secret storage/native fallbacks (R-46); Garmin push after correct run/ride structured mapping and safe retries (R-47–48).

## Working interpretations and open inputs

The owner confirmed ten chats means ten conversation threads; manual completion is sufficient initially. Dates are inclusive and the rolling view follows local calendar days. Build environment, Garmin field availability, and explicit partial-week constraint semantics must be resolved during their milestones.

Acceptance cases are specifications, not evidence of current implementation. Estimate delivery after the foundation and Garmin feasibility spike.
