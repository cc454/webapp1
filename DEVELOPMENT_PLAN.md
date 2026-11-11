# Adaptai development plan

1. Update [requirements](REQUIREMENTS.md) and [user stories](USER_STORIES.md) for one externally authored active plan, direct schedule editing and bounded Chat proposals.
2. Audit requirements and stories against one another and the repository. Resolve material scope conflicts with the owner before advancing.
3. Map every active requirement and story to an acceptance case. Add executable coverage where practical and record any device checks in [TESTING.md](TESTING.md).
4. Implement through Plan, Chat and Settings, then run strict type checking, automated tests and delivery builds. Record results, outstanding device checks and the tracked changes.

The repository baseline and earlier verification remain documented in README and TESTING. Their existing behavior is evidence for the scope audit.

## Scope audit

The active plan supplies its goals. Use Markdown for full-plan import and export. Version 0.2.1 removes legacy JSON restore and places history below the plan summary. Keep seven-day Markdown, PDF and calendar exports as schedule views. Existing plan generation and the Workout Library are replaced by external authoring and scoped Chat changes. Legacy plans need conversion to the new model on upgrade, retaining workout dates, prescriptions and completion. Garmin exports use all cached activities. These decisions resolve the scope conflicts found in the existing workflows.
