jest.mock('../src/generationBackground', () => ({ withGenerationBackground: (task: () => Promise<unknown>) => task(), generationProgress: jest.fn(), subscribeGeneration: () => () => {}, cancelBackgroundGeneration: jest.fn() }));
jest.mock('../src/storage', () => ({ loadState: jest.fn(), loadGenerationDraft: jest.fn(async () => null), saveGenerationDraft: jest.fn(), clearGenerationDraft: jest.fn(), saveState: jest.fn(), getApiKey: jest.fn() }));
jest.mock('../src/garmin', () => ({ isConnected: jest.fn(async () => false) }));
jest.mock('../src/llm', () => ({ askCoach: jest.fn(), isTruncated: () => false }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AppProvider } from '../src/appContext';
import { ChatScreen } from '../src/screens';
import { Field } from '../src/ui';
import { loadState, saveState, getApiKey } from '../src/storage';
import { askCoach } from '../src/llm';
import { emptyState } from '../src/defaults';
describe('Phone feedback: chat and bounded fields', () => {
  beforeEach(() => { jest.clearAllMocks(); (loadState as jest.Mock).mockResolvedValue(emptyState()); (saveState as jest.Mock).mockResolvedValue(undefined); (getApiKey as jest.Mock).mockResolvedValue('fixture'); });
  it('clears the composer after a successful saved exchange', async () => {
    (askCoach as jest.Mock).mockResolvedValue('Easy running today.');
    render(<AppProvider><ChatScreen /></AppProvider>);
    const input = await screen.findByLabelText('What would you like to discuss?');
    fireEvent.changeText(input, 'How should I train?');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled());
    fireEvent.press(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Easy running today.'); await waitFor(() => expect(input.props.value).toBe(''));
  });
  it('retains the draft when sending fails', async () => {
    (askCoach as jest.Mock).mockRejectedValue(new Error('Offline'));
    render(<AppProvider><ChatScreen /></AppProvider>);
    const input = await screen.findByLabelText('What would you like to discuss?'); fireEvent.changeText(input, 'Keep this draft');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled()); fireEvent.press(screen.getByRole('button', { name: 'Send message' }));
    await screen.findByText('Offline'); expect(input.props.value).toBe('Keep this draft');
  });
  it('keeps long research bounded and displays a native scroll indicator', () => {
    render(<Field label="research text" multiline value={'long text\n'.repeat(100)} />);
    const input = screen.getByLabelText('research text'); expect(input.props.scrollEnabled).toBe(true); expect(input).toHaveStyle({ height: 140, maxHeight: 180 });
    fireEvent(input, 'contentSizeChange', { nativeEvent: { contentSize: { height: 2000, width: 300 } } });
    expect(screen.getByTestId('research text-scrollbar')).toBeTruthy();
  });
});
