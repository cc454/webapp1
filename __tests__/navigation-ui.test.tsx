jest.mock('../src/appContext', () => ({ useApp: jest.fn() }));
jest.mock('../src/llm', () => ({ isTruncated: () => false }));
import React from 'react';
import { ScrollView } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useApp } from '../src/appContext';
import { ChatScreen, PlanScreen, SettingsScreen } from '../src/screens';
import { emptyState } from '../src/defaults';
import { displayDate } from '../src/dates';
import { fixturePlan } from './fixtures';

function setup() {
  const app = { state: emptyState(), ready: true, available: true, threadId: null as string | null, setThreadId: jest.fn(), configure: jest.fn(), exportWeek: jest.fn(), backup: jest.fn(), restore: jest.fn() };
  (useApp as jest.Mock).mockReturnValue(app);
  return app;
}
describe('AT-64–67: plan summary, chat position and model choices', () => {
  afterEach(() => jest.restoreAllMocks());
  it('shows English calendar weekdays and collapses the entire saved plan summary', () => {
    const app = setup(); app.state.plan = fixturePlan(); app.state.plan.strategy = 'Build endurance, then taper.';
    expect(displayDate('2026-10-08')).toBe('Thursday 2026-10-08');
    render(<PlanScreen />);
    expect(screen.queryByText('Build endurance, then taper.')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Expand plan summary' }));
    expect(screen.getByText('Build endurance, then taper.')).toBeTruthy();
    expect(screen.getByText('Arrive fresh')).toBeTruthy();
    expect(screen.getByText('20.0 km running · 5.0 km cycling')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Collapse plan summary' }));
    expect(screen.queryByTestId('plan-summary')).toBeNull();
  });
  it('provides a phase summary for older plans without strategy metadata', () => {
    const app = setup(); app.state.plan = fixturePlan(); render(<PlanScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Expand plan summary' }));
    expect(screen.getByText('Taper')).toBeTruthy(); expect(screen.getByText('Arrive fresh')).toBeTruthy();
  });
  it('aligns the latest coach message top, including a short reply and a switched thread', () => {
    const app = setup(); app.threadId = 'first';
    app.state.threads = [{ id: 'first', title: 'First', updatedAt: 'now', messages: [
      { role: 'assistant', content: 'Earlier reply', at: 'now' }, { role: 'user', content: 'Question', at: 'now' }, { role: 'assistant', content: 'Latest reply', at: 'now' },
    ] }, { id: 'second', title: 'Second', updatedAt: 'now', messages: [{ role: 'assistant', content: 'Other reply', at: 'now' }] }];
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo');
    const view = render(<ChatScreen />);
    fireEvent(screen.getByTestId('page-scroll'), 'layout', { nativeEvent: { layout: { height: 500 } } });
    expect(screen.getByTestId('chat-scroll-space')).toHaveStyle({ height: 500 });
    fireEvent(screen.getByTestId('chat-message-0'), 'layout', { nativeEvent: { layout: { y: 200 } } });
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent(screen.getByTestId('chat-message-2'), 'layout', { nativeEvent: { layout: { y: 800 } } });
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 800, animated: true });
    // Keyboard resizing still permits top alignment of a short final reply.
    fireEvent(screen.getByTestId('page-scroll'), 'layout', { nativeEvent: { layout: { height: 250 } } });
    expect(screen.getByTestId('chat-scroll-space')).toHaveStyle({ height: 250 });
    app.threadId = 'second'; view.rerender(<ChatScreen />); scrollTo.mockClear();
    fireEvent(screen.getByTestId('page-scroll'), 'contentSizeChange', 300, 1000);
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent(screen.getByTestId('chat-message-0'), 'layout', { nativeEvent: { layout: { y: 400 } } });
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 400, animated: true });
    app.state.threads[1]!.messages.push({ role: 'user', content: 'Another question', at: 'now' }, { role: 'assistant', content: 'New reply', at: 'now' });
    view.rerender(<ChatScreen />); scrollTo.mockClear();
    fireEvent(screen.getByTestId('chat-message-0'), 'layout', { nativeEvent: { layout: { y: 400 } } });
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent(screen.getByTestId('chat-message-2'), 'layout', { nativeEvent: { layout: { y: 900 } } });
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 900, animated: true });
  });
  it('selects all presets without saving automatically and saves a typed custom model', () => {
    const app = setup(); render(<SettingsScreen />);
    for (const [name, id] of [['Claude Haiku 4.5', 'anthropic/claude-haiku-4.5'], ['Gemini 2.5 Flash', 'google/gemini-2.5-flash'], ['Claude Sonnet 4.6', 'anthropic/claude-sonnet-4.6']]) {
      fireEvent.press(screen.getByRole('button', { name: 'Choose OpenRouter model' }));
      fireEvent.press(screen.getByRole('button', { name }));
      expect(screen.getByLabelText('Model identifier').props.value).toBe(id);
    }
    expect(app.configure).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByLabelText('Model identifier'), ' custom/provider-model ');
    expect(screen.getByText('Custom model ▾')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Save settings' }));
    expect(app.configure).toHaveBeenCalledWith(expect.objectContaining({ model: 'custom/provider-model' }), '', '');
  });
});
