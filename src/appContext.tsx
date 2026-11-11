import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { AppState, Plan, Workout, isoDate } from './types';
import { emptyState } from './defaults';
import { loadState, saveState, getApiKey, getGarminPassword, saveApiKey, saveGarminPassword, clearGenerationDraft } from './storage';
import { loadBundledMarkdown, pickMarkdownFile } from './markdown';
import { upcoming } from './plan';
import { askCoach } from './llm';
import { parseWorkoutLibrary } from './workoutLibrary';
import { defaultWorkoutLibrary } from './workoutLibraryDefaults';
import { appendExchange } from './chat';
import { disconnect, isConnected, pullActivitySummaries, pullFitness, signIn } from './garmin';
import { shareBackup, shareExport, shareTextFile, shareWorkoutLibrary } from './exports';
import { activitySummary, importPlan, trainingPlanTemplate, updateSchedule } from './trainingPlan';
import { applyTrainingProposal, trainingProposalPrompt } from './trainingProposal';

import { constraintIssues } from './constraints';
import { today } from './dates';

type Review = { plan: Plan; base: Plan; asOf: string };
function useController() {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [connected, setConnected] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const locked = useRef(false);
  const current = useRef(state);
  useEffect(() => {
    let mounted = true;
    loadState().then(value => {
      if (mounted) { current.current = value; setState(value); setReady(true); }
    }).catch(e => {
      if (mounted) { setError(e.message); setRecovery(true); setReady(true); }
    });
    isConnected().then(value => { if (mounted) setConnected(value); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  async function commit(value: AppState) {
    await saveState(value);
    current.current = value; setState(value);
  }
  async function run(label: string, action: () => Promise<void>) {
    if (locked.current || !ready) return false;
    locked.current = true; setBusy(label); setError(''); setNotice('');
    try { await action(); return true; } catch (e) { setError(e instanceof Error ? e.message : 'The operation failed.'); return false; }
    finally { locked.current = false; setBusy(''); }
  }
  const available = ready && !busy && !recovery;
  return { state, ready, recovery, busy, error, notice, connected, review, threadId, available,
    setReview, setThreadId,
    saveLibrary: (workoutLibrary: string) => run('Saving workout library…', async () => { parseWorkoutLibrary(workoutLibrary); await commit({ ...current.current, settings: { ...current.current.settings, workoutLibrary } }); setNotice('Workout library saved. Your active plan is unchanged.'); }),
    importLibrary: () => run('Importing workout library…', async () => { const text=await pickMarkdownFile(); if(text===null)return; parseWorkoutLibrary(text); await commit({...current.current,settings:{...current.current.settings,workoutLibrary:text}});setNotice('Workout library imported. Your active plan is unchanged.'); }),
    exportLibrary: () => run('Exporting workout library…', async () => { await shareWorkoutLibrary(current.current.settings.workoutLibrary); }),
    resetLibrary: () => run('Restoring starter library…', async () => { await commit({...current.current,settings:{...current.current.settings,workoutLibrary:defaultWorkoutLibrary}});setNotice('Starter workout library restored. Your active plan is unchanged.'); }),
    rejectReview: () => { setReview(null); },
    reset: () => run('Resetting local data…', async () => { await clearGenerationDraft(); await commit(emptyState()); setRecovery(false); setReview(null); setThreadId(null); setNotice('Local plan and chat data reset. Credentials are unchanged.'); }),
    configure: (settings: AppState['settings'], key: string, password: string) => run('Saving settings…', async () => {
      if (key.trim()) await saveApiKey(key); if (Platform.OS !== 'web' && password) await saveGarminPassword(password);
      await commit({ ...current.current, settings }); setNotice('Settings saved. Secret fields have been cleared.');
    }),
    removeKey: () => run('Removing API key…', async () => { await saveApiKey(''); setNotice('OpenRouter key removed.'); }),
    loadContent: (kind: 'research' | 'constraints', bundled: boolean) => run('Loading file…', async () => {
      const text = bundled ? await loadBundledMarkdown(kind) : await pickMarkdownFile();
      if (text === null) return;
      const value = current.current;
      await commit({ ...value, settings: { ...value.settings, [kind]: text } });
      setNotice(`${kind} loaded.`);
    }),
    accept: () => run('Saving reviewed plan…', async () => {
      if (!review) return;
      const value = current.current;
      if (value.plan !== review.base || today() !== review.asOf) throw new Error('This proposal is stale. Reject it and request a fresh proposal.');
      await commit({ ...value, plan: review.plan });
      setReview(null); setNotice('Workout changes saved.');
    }),
    exportActivities: (kind: 'csv' | 'md') => run('Exporting activities…', async () => {
      await shareTextFile(`garmin-activities.${kind}`, activitySummary(current.current.activities, kind), kind === 'csv' ? 'text/csv' : 'text/markdown');
    }),
    editWorkout: (id: string, fields: Partial<Pick<Workout, 'title' | 'detail' | 'workoutType' | 'durationSeconds' | 'distanceKm'>> & { date: string }, swapId?: string) => run('Saving workout…', async () => {
      const value = current.current;
      const plan = value.plan;
      const original = plan?.workouts.find(w => w.id === id);
      const now = today();
      if (!plan || !original || original.completed || original.sport === 'rest' || (original.date < now && (original.completionNote || original.exertion))) throw new Error('Choose an incomplete workout.');
      const past = original.date < now;
      if (!isoDate.safeParse(fields.date).success || fields.date < now || (past && fields.date === now)) throw new Error('Choose an eligible date in YYYY-MM-DD format.');
      const second = swapId ? plan.workouts.find(w => w.id === swapId) : undefined;
      if (swapId && (!second || second.id === id || second.completed || second.sport === 'rest' || second.date < now || past)) throw new Error('Select a second incomplete upcoming workout.');
      const updated = past || second
        ? { ...original, date: second?.date ?? fields.date }
        : { ...original, ...fields, steps: fields.durationSeconds === original.durationSeconds ? original.steps : [] };
      if (!updated.title.trim() || !updated.workoutType?.trim() && !past && !second ||
          !Number.isSafeInteger(updated.durationSeconds) || updated.durationSeconds < 0 ||
          !Number.isFinite(updated.distanceKm) || updated.distanceKm < 0 ||
          (!updated.durationSeconds && !updated.distanceKm)) throw new Error('Enter a title, type, and positive duration or distance.');
      const workouts = plan.workouts.map(w => w.id === id ? updated : second && w.id === second.id ? { ...w, date: original.date } : w);
      await commit({ ...value, plan: updateSchedule(plan, workouts) });
    }),
    toggle: (id: string, completionNote = '', effort = '') => run('Saving completion…', async () => {
      const value = current.current; if (!value.plan) return;
      const workout = value.plan.workouts.find(w => w.id === id);
      if (!workout || workout.date !== today() || workout.sport === 'rest') throw new Error('Only today’s training can be marked complete or incomplete.');
      if (!workout.completed && effort && !/^(?:[1-9]|10)$/.test(effort)) throw new Error('Use a whole number from 1 to 10 for perceived exertion.');
      const completed = !workout.completed;
      const workouts = value.plan.workouts.map(w => w.id === id ? { ...w, completed, completionNote: completed ? completionNote.trim() || undefined : undefined, exertion: completed && effort ? Number(effort) : undefined } : w);
      await commit({ ...value, plan: updateSchedule(value.plan, workouts) });
    }),
    proposeTraining: (question: string) => run('Preparing workout changes…', async () => {
      const value = current.current;
      if (!value.plan) throw new Error('Import a training plan first.');
      const asOf = today();
      const reply = await askCoach(trainingProposalPrompt(question, value.plan, asOf), value, await getApiKey() ?? '', value.threads.find(t => t.id === threadId)?.messages);
      const issues = constraintIssues(value.settings.constraints, value.settings.rules);
      if (issues.length) throw new Error(issues.join('\n'));
      setReview({ base: value.plan, asOf, plan: applyTrainingProposal({ ...value.plan, rules: value.settings.rules }, reply, asOf) });
    }),
    chat: (question: string) => run('Asking coach…', async () => {
      if (!question.trim()) return;
      const value = current.current;
      const history = value.threads.find(t => t.id === threadId)?.messages ?? [];
      const reply = await askCoach(question.trim(), value, await getApiKey() ?? '', history);
      const result = appendExchange(value.threads, threadId, question.trim(), reply);
      await commit({ ...value, threads: result.threads }); setThreadId(result.thread.id);
    }),
    connect: () => run('Connecting Garmin…', async () => {
      setConnected(false);
      await signIn(current.current.settings.garminEmail, await getGarminPassword() ?? '');
      setConnected(true); setNotice('Garmin connected. Use Sync activities to fetch your history.');
    }),
    sync: () => run('Syncing Garmin activities…', async () => {
      try {
        if (!await isConnected()) throw new Error('Connect Garmin in Settings first.');
        const activities = await pullActivitySummaries();
        setBusy('Syncing Garmin fitness metrics…');
        const fitness = await pullFitness(current.current.fitness);
        await commit({ ...current.current, activities, fitness, lastSync: new Date().toISOString() }); setConnected(await isConnected());
        setNotice(`Synced ${activities.length} running/cycling activities. ${fitness.warnings.length ? 'Some fitness metrics could not refresh; see Settings.' : 'Fitness metrics refreshed.'}`);
      } catch (e) { setConnected(await isConnected()); throw e; }
    }),
    disconnect: () => run('Disconnecting Garmin…', async () => { await disconnect(); setConnected(false); setNotice('Garmin disconnected. Cached activities retained.'); }),
    exportWeek: (kind: 'md' | 'ics' | 'pdf') => run('Exporting week…', async () => {
      if (!current.current.plan) throw new Error('Accept a plan first.');
      await shareExport(kind, current.current.plan.event, upcoming(current.current.plan.workouts), current.current.plan.title);
    }),
    downloadTemplate: () => run('Downloading plan template…', async () => {
      await shareTextFile('training-plan-template.md', trainingPlanTemplate, 'text/markdown');
    }),
    importMarkdownPlan: () => run('Importing Markdown plan…', async () => {
      const text = await pickMarkdownFile();
      if (text === null) return;
      const value = current.current;
      const plan = importPlan(text, value.settings.rules, today());
      await commit({ ...value, event: null, plan });
      setRecovery(false);
      setNotice('Training plan imported.');
    }),
    backup: () => run('Creating backup…', async () => { if (!current.current.plan) throw new Error('Accept a plan first.'); await shareBackup(current.current.plan); }),
    newPlan: () => run('Starting a new plan…', async () => { await commit({ ...current.current, plan: null }); setReview(null); setNotice('Active plan cleared. Import your next training plan.'); }),
  };
}
const Context = createContext<ReturnType<typeof useController> | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) { const value = useController(); return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useApp() { const value = useContext(Context); if (!value) throw new Error('AppProvider is missing.'); return value; }
