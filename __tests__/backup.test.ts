import { decodeBackup, encodeBackup } from '../src/backup';
import { fixturePlan } from './fixtures';
describe('AT-36–37: portable backups', () => {
  it('round-trips plan fields and strips undeclared fields', () => {
    const plan = { ...fixturePlan(), apiKey: 'secret-sentinel', threads: ['private-chat'] };
    const text = encodeBackup(plan); expect(decodeBackup(text)).toEqual(fixturePlan());
    expect(text).not.toContain('secret-sentinel'); expect(text).not.toContain('private-chat');
  });
  it.each(['not json', '{"version":2}', '{"format":"stride-ai-plan","version":1,"plan":{}}'])('rejects invalid backups', text => {
    expect(() => decodeBackup(text)).toThrow();
  });
});
