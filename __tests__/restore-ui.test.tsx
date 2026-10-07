jest.mock('../src/generationBackground', () => ({ withGenerationBackground: (task: () => Promise<unknown>) => task(), generationProgress: jest.fn(), subscribeGeneration: () => () => {}, cancelBackgroundGeneration: jest.fn() }));
jest.mock('../src/storage', () => ({ loadState: jest.fn(), loadGenerationDraft: jest.fn(async () => null), saveGenerationDraft: jest.fn(), clearGenerationDraft: jest.fn(), saveState: jest.fn(), getApiKey: jest.fn(), getGarminPassword: jest.fn(), saveApiKey: jest.fn(), saveGarminPassword: jest.fn() }));
jest.mock('../src/garmin', () => ({ isConnected: jest.fn(async () => false), disconnect: jest.fn(), pullActivitySummaries: jest.fn(), signIn: jest.fn() }));
jest.mock('../src/exports', () => ({ shareBackup: jest.fn(), shareExport: jest.fn() }));
jest.mock('../src/markdown', () => ({ loadBundledMarkdown: jest.fn(), pickMarkdownFile: jest.fn(), pickTextFile: jest.fn() }));
jest.mock('../src/llm', () => ({ generatePlan: jest.fn(), askCoach: jest.fn(), isTruncated: () => false }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';
import { loadState, saveState } from '../src/storage';
import { pickTextFile } from '../src/markdown';
import { emptyState } from '../src/defaults';
import { fixturePlan } from './fixtures';
import { encodeBackup } from '../src/backup';
describe('AT-11,37: completion and reviewed restore', () => {
  it('restores only on acceptance and retains chats/settings', async () => {
    const state = emptyState(); state.settings.model = 'my/model'; state.threads = [{ id: 'retained', title: 'My chat', updatedAt: 'now', messages: [] }];
    (loadState as jest.Mock).mockResolvedValue(state); (saveState as jest.Mock).mockResolvedValue(undefined);
    (pickTextFile as jest.Mock).mockResolvedValue(encodeBackup(fixturePlan())); render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Restore a plan backup' })).toBeEnabled());
    fireEvent.press(screen.getByRole('button', { name: 'Restore a plan backup' })); await screen.findByText('RESTORE PREVIEW'); expect(saveState).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Reject' })); expect(saveState).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Restore a plan backup' })).toBeEnabled());
    fireEvent.press(screen.getByRole('button', { name: 'Restore a plan backup' })); await screen.findByText('RESTORE PREVIEW');
    fireEvent.press(screen.getByRole('button', { name: 'Accept and save' }));
    await waitFor(() => expect(saveState).toHaveBeenCalledTimes(1)); const saved = (saveState as jest.Mock).mock.calls[0][0];
    expect(saved.settings.model).toBe('my/model'); expect(saved.threads).toEqual(state.threads); expect(saved.plan).toEqual(fixturePlan());
  });
  it('persists completion from the displayed next-seven-day view', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2027-04-05T12:00:00Z'));
    const state = emptyState(); state.plan = fixturePlan(); state.event = state.plan.event;
    (loadState as jest.Mock).mockResolvedValue(state); (saveState as jest.Mock).mockResolvedValue(undefined); render(<App />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Mark complete' })[0]).toBeEnabled());
    fireEvent.press(screen.getAllByRole('button', { name: 'Mark complete' })[0]!);
    await waitFor(() => expect(saveState).toHaveBeenCalledTimes(1)); expect((saveState as jest.Mock).mock.calls[0][0].plan.workouts[0].completed).toBe(true);
    jest.useRealTimers();
  });
});
