jest.mock('../src/storage', () => ({ clearGarminSession: jest.fn(), getGarminSession: jest.fn(), saveGarminSession: jest.fn() }));
import { mapActivities, pullActivitySummaries, signIn, isConnected } from '../src/garmin';
import { clearGarminSession, getGarminSession, saveGarminSession } from '../src/storage';
const run = { activityId: 1, activityType: { typeKey: 'running' }, startTimeLocal: '2027-04-01', distance: 10000, duration: 3600, averageHR: 140, averageSpeed: 3, elevationGain: 10 };
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
const credentials = { version: 1, accessToken: 'fixture-access', refreshToken: 'fixture-refresh', clientId: 'fixture-client' };
describe('Garmin mobile token adapter (mocked; device verification separate)', () => {
  let saved: string | null;
  beforeEach(() => {
    jest.clearAllMocks(); saved = JSON.stringify(credentials); global.fetch = jest.fn();
    (getGarminSession as jest.Mock).mockImplementation(async () => saved);
    (saveGarminSession as jest.Mock).mockImplementation(async value => { saved = value; });
    (clearGarminSession as jest.Mock).mockImplementation(async () => { saved = null; });
  });
  it('maps run/ride metrics and deduplicates', () => {
    const result = mapActivities([run, run, { ...run, activityId: 2, activityType: { typeKey: 'cycling' }, avgPower: 180 }]);
    expect(result).toHaveLength(2); expect(result.find(a => a.id === 1)).toMatchObject({ sport: 'run', distanceKm: 10, durationSeconds: 3600, speedKmh: 10.8 });
    expect(result.find(a => a.id === 2)).toMatchObject({ sport: 'ride', powerW: 180 });
  });
  it('skips unsupported sport records without requiring their distance fields', () => {
    expect(mapActivities([run, { activityId: 3, activityType: { typeKey: 'yoga' }, distance: null }])).toHaveLength(1);
  });
  it('rejects malformed supported activities', () => { expect(() => mapActivities([{ activityId: 1 }])).toThrow('invalid'); });
  it('uses the mobile API bearer token instead of the old web proxy', async () => {
    (fetch as jest.Mock).mockResolvedValue(response([run])); await expect(pullActivitySummaries()).resolves.toHaveLength(1);
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain('https://connectapi.garmin.com/activitylist-service');
    expect((fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer fixture-access');
  });
  it('refreshes once on 401 and retries with the rotated token', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({ access_token: 'rotated', refresh_token: 'rotated-refresh' })).mockResolvedValueOnce(response([run]));
    await expect(pullActivitySummaries()).resolves.toHaveLength(1);
    expect((fetch as jest.Mock).mock.calls[2][1].headers.Authorization).toBe('Bearer rotated'); expect(saved).toContain('rotated-refresh');
  });
  it('disconnects on rejected refresh without overwriting activity data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({}, 400));
    await expect(pullActivitySummaries()).rejects.toThrow('refresh'); expect(await isConnected()).toBe(false);
  });
  it('keeps the session on transient forbidden or server errors', async () => {
    (fetch as jest.Mock).mockResolvedValue(response({}, 403)); await expect(pullActivitySummaries()).rejects.toThrow('403'); expect(await isConnected()).toBe(true);
  });
  it('does not make calls without credentials', async () => { await expect(signIn('', '')).rejects.toThrow('email'); expect(fetch).not.toHaveBeenCalled(); });
  it('exchanges the service ticket and verifies the profile before saving tokens', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({ responseStatus: { type: 'SUCCESSFUL' }, serviceTicketId: 'ST-fixture' }))
      .mockResolvedValueOnce(response({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600 }))
      .mockResolvedValueOnce(response({ displayName: 'fixture-profile' }));
    await signIn('athlete@example.com', 'fixture-password'); expect(fetch).toHaveBeenCalledTimes(3);
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain('/mobile/api/login');
    expect((fetch as jest.Mock).mock.calls[1][0]).toContain('diauth.garmin.com');
    expect((fetch as jest.Mock).mock.calls[2][0]).toContain('/userprofile-service/socialProfile'); expect(saved).toContain('new-access');
  });
  it('does not accept legacy cookie metadata as a current session', async () => { saved = JSON.stringify({ signedInAt: 'yesterday' }); expect(await isConnected()).toBe(false); });
  it('reports credential rejection without saving a session', async () => {
    (fetch as jest.Mock).mockResolvedValue(response({ responseStatus: { type: 'INVALID_USERNAME_PASSWORD' } }));
    await expect(signIn('athlete@example.com', 'fixture-password')).rejects.toThrow('credentials'); expect(saved).toBeNull();
  });
});