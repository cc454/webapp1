const mockGet = jest.fn(); const mockRun = jest.fn();
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn(async () => ({ execAsync: jest.fn(), getFirstAsync: mockGet, runAsync: mockRun })) }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
import { loadState, saveState, saveApiKey, saveGarminPassword, saveGarminSession, loadGenerationDraft, saveGenerationDraft, clearGenerationDraft } from '../src/storage';
import * as SecureStore from 'expo-secure-store';
import { emptyState } from '../src/defaults';
describe('AT-16,19,27,41: local persistence', () => {
  it('loads empty state and persists validated state with bound parameters', async () => {
    mockGet.mockResolvedValue(null); await expect(loadState()).resolves.toEqual(emptyState());
    const state = emptyState(); await saveState(state); expect(mockRun.mock.calls[0]![0]).toContain('ON CONFLICT'); expect(JSON.parse(mockRun.mock.calls[0]![1])).toEqual(state);
    mockGet.mockResolvedValue({ value: JSON.stringify(state) }); await expect(loadState()).resolves.toEqual(state);
  });
  it('refuses corrupt state without overwriting it', async () => {
    mockGet.mockResolvedValue({ value: '{broken' }); await expect(loadState()).rejects.toThrow('not been overwritten'); expect(mockRun).not.toHaveBeenCalled();
  });
  it('stores secrets separately and does not replace password with blank input', async () => {
    await saveApiKey('key'); await saveGarminPassword('password'); await saveGarminPassword(''); await saveGarminSession('session');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('openrouter-api-key', 'key');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('garmin-password', 'password'); expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(3);
    await saveApiKey(''); expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('openrouter-api-key');
  });
  it('persists draft checkpoints separately from the active plan and clears only the draft',async()=>{
    const draft={version:1 as const,signature:'inputs',request:'',start:'2027-04-05',end:'2027-04-11',workouts:[],overview:[]};
    await saveGenerationDraft(draft);expect(mockRun.mock.calls[0]![0]).toContain('INSERT INTO generation');
    mockGet.mockResolvedValue({value:JSON.stringify(draft)});await expect(loadGenerationDraft()).resolves.toEqual(draft);
    await clearGenerationDraft();expect(mockRun.mock.calls.at(-1)[0]).toBe('DELETE FROM generation WHERE id=1');
  });
});
