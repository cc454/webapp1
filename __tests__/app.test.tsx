jest.mock('../src/storage', () => ({ loadState: jest.fn(), saveState: jest.fn(), getApiKey: jest.fn(), getGarminPassword: jest.fn(), saveApiKey: jest.fn(), saveGarminPassword: jest.fn() }));
jest.mock('../src/garmin', () => ({ isConnected: jest.fn(async () => false), disconnect: jest.fn(), pullActivitySummaries: jest.fn(), signIn: jest.fn() }));
jest.mock('../src/exports', () => ({ shareBackup: jest.fn(), shareExport: jest.fn() }));
jest.mock('../src/markdown', () => ({ loadBundledMarkdown: jest.fn(), pickMarkdownFile: jest.fn(), pickTextFile: jest.fn() }));
jest.mock('../src/llm', () => ({ generatePlan: jest.fn(), askCoach: jest.fn(), isTruncated: () => false }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';
import { loadState, saveState } from '../src/storage';
import { generatePlan } from '../src/llm';
import { emptyState } from '../src/defaults';
import { fixturePlan } from './fixtures';
describe('AT-14,32,38: rendered app flows', () => {
  beforeEach(() => { (saveState as jest.Mock).mockResolvedValue(undefined); });
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
});
