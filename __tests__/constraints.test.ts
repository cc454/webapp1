import { constraintIssues } from '../src/constraints';
import { defaultRules } from '../src/defaults';
describe('AT-13: explicit constraints and unresolved guidance', () => {
  it('recognizes the bundled rules', () => {
    const text = '# Training constraints\n- 2 days a week must be rest days.\n- Long runs or rides happen on Saturday or Sunday.\n- Avoid two hard sessions on consecutive days.\n- Workouts on Mondays should be 40min or less.';
    expect(constraintIssues(text, defaultRules)).toEqual([]);
  });
  it('flags conflicting and unsupported rules, while allowing labeled guidance', () => {
    expect(constraintIssues('3 days a week must be rest days.', defaultRules).join()).toContain('conflicts');
    expect(constraintIssues('Never train on Tuesday.', defaultRules).join()).toContain('Unresolved');
    expect(constraintIssues('guidance: Prefer shaded routes.', defaultRules)).toEqual([]);
  });
});
