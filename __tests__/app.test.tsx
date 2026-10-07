jest.mock('../src/generationBackground', () => ({ withGenerationBackground: (task: () => Promise<unknown>) => task(), generationProgress: jest.fn(), subscribeGeneration: () => () => {}, cancelBackgroundGeneration: jest.fn() }));
jest.mock('../src/storage', () => ({ loadState: jest.fn(), loadGenerationDraft: jest.fn(async () => null), saveGenerationDraft: jest.fn(), clearGenerationDraft: jest.fn(), saveState: jest.fn(), getApiKey: jest.fn(), getGarminPassword: jest.fn(), saveApiKey: jest.fn(), saveGarminPassword: jest.fn() }));
jest.mock('../src/garmin', () => ({ isConnected: jest.fn(async () => false), disconnect: jest.fn(), pullActivitySummaries: jest.fn(), pullFitness: jest.fn(), signIn: jest.fn() }));
jest.mock('../src/exports', () => ({ shareBackup: jest.fn(), shareExport: jest.fn() }));
jest.mock('../src/markdown', () => ({ loadBundledMarkdown: jest.fn(), pickMarkdownFile: jest.fn(), pickTextFile: jest.fn() }));
jest.mock('../src/llm', () => ({ generatePlan: jest.fn(), askCoach: jest.fn(), isTruncated: () => false, generationSignature: () => 'saved-inputs' }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';
import { loadState, saveState, getApiKey, loadGenerationDraft, clearGenerationDraft } from '../src/storage';
import { generatePlan } from '../src/llm';
import { emptyState } from '../src/defaults';
import { fixturePlan } from './fixtures';
import { isConnected, pullActivitySummaries, pullFitness } from '../src/garmin';
import { AppProvider } from '../src/appContext';
import { SettingsScreen, PlanScreen } from '../src/screens';
describe('AT-14,32,38: rendered app flows', () => {
  beforeEach(() => { (saveState as jest.Mock).mockResolvedValue(undefined); (getApiKey as jest.Mock).mockResolvedValue('fixture-key'); });
  it('renders empty onboarding without saving on startup', async () => {
    (loadState as jest.Mock).mockResolvedValue(emptyState()); render(<App />);
    await screen.findByText('Start with your event'); expect(saveState).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Generate initial plan' })).toBeDisabled();
  });
  it('requires explicit acceptance and prevents duplicate generation', async () => {
    const state = emptyState(); state.event = fixturePlan().event; (loadState as jest.Mock).mockResolvedValue(state);
    let resolve!: (value: ReturnType<typeof fixturePlan>) => void;
    (generatePlan as jest.Mock).mockImplementation(() => new Promise(r => { resolve = r; })); render(<App />);
    const button = await screen.findByRole('button', { name: 'Generate initial plan' });
    await waitFor(() => expect(button).toBeEnabled()); fireEvent.press(button); fireEvent.press(button);
    await waitFor(() => expect(generatePlan).toHaveBeenCalledTimes(1)); resolve(fixturePlan());
    await screen.findByText('PROPOSAL / NOT SAVED'); expect(saveState).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Accept and save' }));
    await waitFor(() => expect(saveState).toHaveBeenCalledTimes(1)); expect((saveState as jest.Mock).mock.calls[0][0].plan).not.toBeNull();
  });
  it('shows recovery without overwriting corrupt state', async () => {
    (loadState as jest.Mock).mockRejectedValue(new Error('Damaged data')); render(<App />);
    await screen.findByText('Damaged data'); expect(saveState).not.toHaveBeenCalled();
  });
  it('recovers a complete draft as a review without activating it or calling the model', async () => {
    const state=emptyState(); const plan=fixturePlan(); state.event=plan.event;
    (loadState as jest.Mock).mockResolvedValue(state); (loadGenerationDraft as jest.Mock).mockResolvedValueOnce({version:1,request:'',signature:'saved-inputs',start:plan.start,end:plan.end,workouts:plan.workouts,overview:plan.overview});
    render(<AppProvider><PlanScreen /></AppProvider>); await screen.findByText('PROPOSAL / NOT SAVED');
    expect(saveState).not.toHaveBeenCalled(); expect(generatePlan).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button',{name:'Reject'})); await waitFor(()=>expect(clearGenerationDraft).toHaveBeenCalled()); expect(saveState).not.toHaveBeenCalled();
  });
  it('allows a damaged draft to be discarded without resetting the valid active plan',async()=>{
    const state=emptyState(); state.plan=fixturePlan();state.event=state.plan.event;
    (loadState as jest.Mock).mockResolvedValue(state);(loadGenerationDraft as jest.Mock).mockRejectedValueOnce(new Error('Draft damaged'));
    render(<AppProvider><PlanScreen /></AppProvider>);await screen.findByText('Draft damaged');expect(saveState).not.toHaveBeenCalled();
    expect(screen.getByRole('button',{name:'Resume generation'})).toBeDisabled();
    fireEvent.press(screen.getByRole('button',{name:'Discard saved draft'}));fireEvent.press(screen.getByRole('button',{name:'Confirm discard draft'}));
    await waitFor(()=>expect(clearGenerationDraft).toHaveBeenCalled());expect(saveState).not.toHaveBeenCalled();
  });
  it('saves successful activities even if optional fitness refresh has a warning', async () => {
    const state=emptyState(); (loadState as jest.Mock).mockResolvedValue(state);
    (isConnected as jest.Mock).mockResolvedValue(true);
    (pullActivitySummaries as jest.Mock).mockResolvedValue([{id:1,sport:'run',name:'Easy run',startedAt:'2026-10-06',distanceKm:5,durationSeconds:1800}]);
    (pullFitness as jest.Mock).mockResolvedValue({...state.fitness,warnings:['Heart-rate zone refresh failed; any cached value is retained.']});
    render(<AppProvider><SettingsScreen /></AppProvider>);
    const button=await screen.findByRole('button',{name:'Sync activities'}); await waitFor(()=>expect(button).toBeEnabled()); fireEvent.press(button);
    await screen.findByText('1 cached running/cycling activities');
    expect(screen.getByText('Heart-rate zone refresh failed; any cached value is retained.')).toBeTruthy();
    const saved=(saveState as jest.Mock).mock.calls.at(-1)[0]; expect(saved.activities).toHaveLength(1); expect(saved.lastSync).toBeTruthy();
  });
});
