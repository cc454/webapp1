jest.mock('../src/storage', () => ({ clearGarminSession: jest.fn(), getGarminSession: jest.fn(), saveGarminSession: jest.fn() }));
import { mapActivities, mapVo2, mapPower, mapZones, pullActivitySummaries, pullFitness, signIn, isConnected } from '../src/garmin';
import { emptyState } from '../src/defaults';
import { stateSchema } from '../src/types';
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
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain('limit=50');
  });
  it('keeps only the latest 50 and migrates the previous saved state without losing chats', () => {
    const records = Array.from({length:60}, (_,i)=>({...run,activityId:i,startTimeLocal:new Date(Date.UTC(2026,0,i+1)).toISOString()}));
    const mapped = mapActivities(records); expect(mapped).toHaveLength(50); expect(mapped[0]!.id).toBe(59); expect(mapped[49]!.id).toBe(10);
    const legacy: any = emptyState(); delete legacy.fitness;
    legacy.activities = records.map(a=>({...mapped[0],id:a.activityId,startedAt:a.startTimeLocal}));
    legacy.threads = [{id:'saved',title:'Saved chat',updatedAt:'now',messages:[]}];
    const loaded = stateSchema.parse(legacy); expect(loaded.fitness.vo2).toBeNull(); expect(loaded.activities).toHaveLength(50); expect(loaded.threads[0]!.id).toBe('saved');
  });
  it('maps precise VO2, cycling FTP/kg, and Garmin zone floors without guessing missing values', () => {
    expect(mapVo2({mostRecentVO2Max:{generic:{vo2MaxPreciseValue:48.2,vo2MaxValue:48},cycling:{vo2MaxValue:51}}})).toEqual({running:48.2,cycling:51});
    expect(mapPower([{sport:'RUNNING',powerToWeight:5},{sport:'CYCLING',functionalThresholdPower:240,weight:80,calendarDate:'2026-10-06'}])).toEqual({ftpW:240,wattsPerKg:3,date:'2026-10-06'});
    expect(mapPower([{sport:'CYCLING',functionalThresholdPower:240,powerToWeight:3.1}]).wattsPerKg).toBe(3.1);
    expect(mapPower([{sport:'CYCLING',functionalThresholdPower:240}]).wattsPerKg).toBeNull();
    expect(mapZones([{sport:'RUNNING',zone1Floor:100,zone2Floor:120,zone3Floor:140,zone4Floor:160,zone5Floor:180,maxHeartRateUsed:195}])[0]).toMatchObject({floors:[100,120,140,160,180],maxHeartRate:195});
    expect(()=>mapZones([{sport:'RUNNING',zone1Floor:140,zone2Floor:120}])).toThrow('boundaries');
  });
  it('refreshes fitness metrics through authenticated endpoints', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({mostRecentVO2Max:{generic:{vo2MaxValue:48},cycling:{vo2MaxValue:51}}}))
      .mockResolvedValueOnce(response([{sport:'CYCLING',functionalThresholdPower:240,powerToWeight:3}]))
      .mockResolvedValueOnce(response([{sport:'DEFAULT',zone1Floor:100,zone2Floor:120,zone3Floor:140,zone4Floor:160,zone5Floor:180}]));
    const result=await pullFitness(emptyState().fitness);
    expect(result.vo2?.running).toBe(48); expect(result.power?.wattsPerKg).toBe(3); expect(result.zones?.profiles).toHaveLength(1); expect(result.warnings).toEqual([]);
    expect((fetch as jest.Mock).mock.calls[1][0]).toContain('/powerToWeight/latest/'); expect((fetch as jest.Mock).mock.calls[2][0]).toContain('/heartRateZones');
  });
  it('retains cached metrics with their original timestamps when optional endpoints fail', async () => {
    const previous=emptyState().fitness; previous.vo2={running:48,cycling:null,fetchedAt:'old'};
    (fetch as jest.Mock).mockResolvedValue(response({},503));
    const result=await pullFitness(previous); expect(result.vo2).toEqual(previous.vo2); expect(result.power).toBeNull(); expect(result.warnings).toHaveLength(3); expect(await isConnected()).toBe(true);
  });
  it('falls back to profile VO2 and leaves empty power/zones unavailable', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(response({})).mockResolvedValueOnce(response({userData:{vo2MaxRunning:47}})).mockResolvedValueOnce(response([])).mockResolvedValueOnce(response([]));
    const result=await pullFitness(emptyState().fitness); expect(result.vo2?.running).toBe(47); expect(result.vo2?.cycling).toBeNull(); expect(result.power?.wattsPerKg).toBeNull(); expect(result.zones?.profiles).toEqual([]);
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
