import { constraintIssues, generationConstraints } from '../src/constraints';
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
  it('constructs date-specific limits before generation, including the reported Monday', () => {
    const brief=generationConstraints('guidance: Prefer an easy ride after the long run.',defaultRules,'2026-10-07','2026-10-13',false);
    const days=JSON.parse(brief.split('DATE-SPECIFIC LIMITS: ')[1]!.split('\n')[0]!);
    expect(days.find((d:any)=>d.date==='2026-10-12')).toMatchObject({weekday:'Monday',maximumTotalDurationSeconds:2400,longSessionAllowed:false});
    expect(days.filter((d:any)=>d.longSessionAllowed).map((d:any)=>d.date)).toEqual(['2026-10-10','2026-10-11']);
    expect(brief).toContain('Choose at least 2 distinct rest dates'); expect(brief).toContain('Prefer an easy ride');
  });
  it('carries hard-day restrictions over batch boundaries and respects partial weeks', () => {
    const brief=generationConstraints('',defaultRules,'2026-10-14','2026-10-16',true);
    expect(brief).toContain('Choose at least 0 distinct rest dates'); expect(brief).toContain('"hardSessionAllowed":false');
  });
});
