jest.mock('@preeternal/react-native-cookie-manager', () => ({ __esModule: true, default: { clearAll: jest.fn(), flush: jest.fn() } }));
jest.mock('../src/storage', () => ({ clearGarminSession: jest.fn(), getGarminSession: jest.fn(), saveGarminSession: jest.fn() }));
import { mapActivities, pullActivitySummaries, signIn } from '../src/garmin';
import { clearGarminSession, saveGarminSession } from '../src/storage';
const run = { activityId: 1, activityType: { typeKey: 'running' }, startTimeLocal: '2027-04-01', distance: 10000, duration: 3600, averageHR: 140, averageSpeed: 3, elevationGain: 10 };
const response = (body: unknown) => ({ ok: true, json: async () => body, text: async () => typeof body === 'string' ? body : JSON.stringify(body) });
describe('AT-26–31: Garmin adapter (mocked; device verification separate)', () => {
  beforeEach(() => { global.fetch = jest.fn(); });
  it('maps run/ride metrics, skips other sports, and deduplicates', () => {
    const result = mapActivities([run, run, { ...run, activityId: 2, activityType: { typeKey: 'cycling' }, avgPower: 180 }, { ...run, activityId: 3, activityType: { typeKey: 'swimming' } }]);
    expect(result).toHaveLength(2); expect(result.find(a => a.id === 1)).toMatchObject({ sport: 'run', distanceKm: 10, durationSeconds: 3600, speedKmh: 10.8 });
    expect(result.find(a => a.id === 2)).toMatchObject({ sport: 'ride', powerW: 180 });
  });
  it('rejects malformed data instead of replacing cached data', () => { expect(() => mapActivities([{ activityId: 1 }])).toThrow('invalid'); });
  it('disconnects on expired session', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 }); await expect(pullActivitySummaries()).rejects.toThrow('expired'); expect(clearGarminSession).toHaveBeenCalled();
  });
  it('does not make calls without credentials', async () => { await expect(signIn('', '')).rejects.toThrow('email'); expect(fetch).not.toHaveBeenCalled(); });
  it('proves authenticated endpoint access before saving a session', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response('<input value="csrf" name="_csrf">')).mockResolvedValueOnce(response('ok')).mockResolvedValueOnce(response([run]));
    await signIn('athlete@example.com', 'password'); expect(fetch).toHaveBeenCalledTimes(3); expect(saveGarminSession).toHaveBeenCalled();
  });
  it('consumes the SSO ticket at Garmin before checking activity access', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response('<input value="csrf" name="_csrf">'))
      .mockResolvedValueOnce(response('https://untrusted.invalid/?ticket=ST-fixture'))
      .mockResolvedValueOnce(response('Connect')).mockResolvedValueOnce(response([run]));
    await signIn('athlete@example.com', 'password');
    expect((fetch as jest.Mock).mock.calls[2][0]).toBe('https://connect.garmin.com/modern/?ticket=ST-fixture');
    expect((fetch as jest.Mock).mock.calls[3][0]).toContain('activitylist-service');
  });
});
