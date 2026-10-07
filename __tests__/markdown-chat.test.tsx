import React from 'react';
import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ChatMarkdown, safeChatLink } from '../src/ChatMarkdown';
import { FitnessSettings } from '../src/FitnessSettings';
import { emptyState } from '../src/defaults';

describe('Chat Markdown and Garmin settings', () => {
  it('renders headings, emphasis, lists, quotes, code, and table text', () => {
    render(<ChatMarkdown content={'## Easy week\n\n**Keep it easy** and *relaxed*.\n\n- Run 30 min\n- Rest\n\n> Recover well\n\n```text\n3 × 5 min\n```\n\n| Day | Session |\n| --- | --- |\n| Monday | Easy ride |'} />);
    expect(screen.getByRole('header', {name:'Easy week'})).toBeTruthy();
    expect(screen.getByText('Keep it easy')).toHaveStyle({fontWeight:'700'});
    expect(screen.getByText('relaxed')).toHaveStyle({fontStyle:'italic'});
    for (const text of ['Run 30 min','Rest','Recover well','3 × 5 min','Easy ride']) expect(screen.getByText(text)).toBeTruthy();
  });
  it('opens safe links and renders raw HTML as text without fetching images', () => {
    const open=jest.spyOn(Linking,'openURL').mockResolvedValue(undefined);
    render(<ChatMarkdown content={'[Garmin](https://www.garmin.com)\n\n<script>alert(1)</script>\n\n![workout](https://example.com/image.png)'} />);
    fireEvent.press(screen.getByRole('link',{name:'Garmin'})); expect(open).toHaveBeenCalledWith('https://www.garmin.com');
    expect(screen.getByText('<script>alert(1)</script>')).toBeTruthy(); expect(screen.getByText('[Image: workout]')).toBeTruthy();
    expect(safeChatLink('javascript:alert(1)')).toBe(false); expect(safeChatLink('file:///secret')).toBe(false); open.mockRestore();
  });
  it('shows metric units, zone ranges, fetch dates, and refresh warnings', () => {
    const fitness=emptyState().fitness;
    fitness.vo2={running:48.2,cycling:null,fetchedAt:'2026-10-07T12:00:00Z'};
    fitness.power={ftpW:240,wattsPerKg:3,date:'2026-10-06',fetchedAt:'2026-10-07T12:00:00Z'};
    fitness.zones={profiles:[{sport:'RUNNING',floors:[100,120,140,160,180],maxHeartRate:195}],fetchedAt:'2026-10-07T12:00:00Z'};
    fitness.warnings=['Cached value retained.']; render(<FitnessSettings fitness={fitness} />);
    expect(screen.getByText('Running VO₂ max: 48.2 ml/kg/min')).toBeTruthy(); expect(screen.getByText('Cycling VO₂ max: Unavailable in Garmin')).toBeTruthy();
    expect(screen.getByText('Cycling FTP/kg: 3.00 W/kg')).toBeTruthy(); expect(screen.getByText('Zone 1: 100–119 bpm')).toBeTruthy(); expect(screen.getByText('Zone 5: 180–195 bpm')).toBeTruthy();
    expect(screen.getByText('Cached value retained.')).toBeTruthy();
  });
});
