jest.mock('../src/storage',()=>({loadState:jest.fn(),saveState:jest.fn(),loadGenerationDraft:jest.fn(async()=>null),getApiKey:jest.fn(),clearGenerationDraft:jest.fn()}));
jest.mock('../src/generationBackground',()=>({subscribeGeneration:()=>()=>{},withGenerationBackground:(task:()=>Promise<unknown>)=>task(),generationProgress:jest.fn(),cancelBackgroundGeneration:jest.fn()}));
jest.mock('../src/garmin',()=>({isConnected:jest.fn(async()=>false)}));
jest.mock('../src/markdown',()=>({pickMarkdownFile:jest.fn()}));
jest.mock('../src/exports',()=>({shareWorkoutLibrary:jest.fn()}));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AppProvider } from '../src/appContext';
import { WorkoutLibraryScreen } from '../src/WorkoutLibraryScreen';
import { emptyState } from '../src/defaults';
import { defaultWorkoutLibrary } from '../src/workoutLibraryDefaults';
import { loadState,saveState } from '../src/storage';
import { pickMarkdownFile } from '../src/markdown';
import { shareWorkoutLibrary } from '../src/exports';
import { fixturePlan } from './fixtures';
const open=async()=>{render(<AppProvider><WorkoutLibraryScreen/></AppProvider>);await waitFor(()=>expect(screen.getByRole('button',{name:'Import library .md'})).toBeEnabled());};
describe('Workout Library tab',()=>{
  beforeEach(()=>{const state=emptyState();state.plan=fixturePlan();state.event=state.plan.event;(loadState as jest.Mock).mockResolvedValue(state);(saveState as jest.Mock).mockResolvedValue(undefined);});
  it('shows the ten templates and bounded editable Markdown, saves edits without changing the active plan',async()=>{
    await open();expect(screen.getByText('Long VO₂ intervals')).toBeTruthy();expect(screen.getByText('Recovery')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Workout library Markdown'),defaultWorkoutLibrary.replace('Easy endurance','My easy endurance'));
    fireEvent.press(screen.getByRole('button',{name:'Save workout library'}));await screen.findByText('Workout library saved. Your active plan is unchanged.');
    const saved=(saveState as jest.Mock).mock.calls[0][0];expect(saved.plan).toEqual(fixturePlan());expect(saved.settings.workoutLibrary).toContain('My easy endurance');
  });
  it('retains the saved library on cancelled or malformed imports and blocks invalid edits',async()=>{
    await open();(pickMarkdownFile as jest.Mock).mockResolvedValueOnce(null);fireEvent.press(screen.getByRole('button',{name:'Import library .md'}));await waitFor(()=>expect(pickMarkdownFile).toHaveBeenCalled());
    await waitFor(()=>expect(screen.getByRole('button',{name:'Import library .md'})).toBeEnabled());expect(saveState).not.toHaveBeenCalled();
    (pickMarkdownFile as jest.Mock).mockResolvedValueOnce('# invalid');fireEvent.press(screen.getByRole('button',{name:'Import library .md'}));await screen.findByText('Workout library requires exactly one fenced ```json block.');expect(saveState).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByLabelText('Workout library Markdown'),'bad');expect(screen.getByRole('button',{name:'Save workout library'})).toBeDisabled();
  });
  it('imports a valid file, exports the saved version and confirms starter restoration',async()=>{
    await open();const imported=defaultWorkoutLibrary.replace('Easy endurance','Imported easy endurance');(pickMarkdownFile as jest.Mock).mockResolvedValueOnce(imported);
    fireEvent.press(screen.getByRole('button',{name:'Import library .md'}));await screen.findByText('Workout library imported. Your active plan is unchanged.');
    fireEvent.press(screen.getByRole('button',{name:'Export library .md'}));await waitFor(()=>expect(shareWorkoutLibrary).toHaveBeenCalledWith(imported));
    await waitFor(()=>expect(screen.getByRole('button',{name:'Restore starter library'})).toBeEnabled());fireEvent.press(screen.getByRole('button',{name:'Restore starter library'}));expect(saveState).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByRole('button',{name:'Confirm restore starter library'}));await screen.findByText('Starter workout library restored. Your active plan is unchanged.');expect((saveState as jest.Mock).mock.calls.at(-1)[0].settings.workoutLibrary).toBe(defaultWorkoutLibrary);
  });
});
