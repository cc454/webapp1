import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { AppState, Plan, GenerationDraft } from './types';
import { emptyState } from './defaults';
import { loadState, saveState, getApiKey, getGarminPassword, saveApiKey, saveGarminPassword, loadGenerationDraft, saveGenerationDraft, clearGenerationDraft } from './storage';
import { loadBundledMarkdown, pickMarkdownFile, pickTextFile } from './markdown';
import { parseGoalMarkdown } from './goal';
import { acceptProposal, upcoming } from './plan';
import { generatePlan, askCoach, generationSignature } from './llm';
import { generateLibraryPlan } from './libraryPlanner';
import { parseWorkoutLibrary } from './workoutLibrary';
import { defaultWorkoutLibrary } from './workoutLibraryDefaults';
import { matchesGenerationInputs } from './generationInputs';
import { withGenerationBackground, generationProgress, subscribeGeneration, cancelBackgroundGeneration } from './generationBackground';
import { appendExchange } from './chat';
import { disconnect, isConnected, pullActivitySummaries, pullFitness, signIn } from './garmin';
import { shareBackup, shareExport, shareWorkoutLibrary } from './exports';
import { decodeBackup } from './backup';
import { constraintIssues } from './constraints';

type Review = { kind: 'proposal' | 'restore'; plan: Plan };
function useController() {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [connected, setConnected] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [draft, setDraft] = useState<GenerationDraft | null>(null);
  const [draftError, setDraftError] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const locked = useRef(false);
  const current = useRef(state);
  const generator = useRef<AbortController | null>(null);
  const draftEpoch = useRef(0);
  useEffect(() => {
    let mounted = true;
    let generationSeen = false;
    const unsubscribe = subscribeGeneration(text => {
      if (!mounted) return;
      setBusy(text);
      if (text) generationSeen = true;
      else if (generationSeen) {
        generationSeen = false;
        const epoch = draftEpoch.current;
        void loadGenerationDraft().then(saved => {
          if (!mounted || epoch !== draftEpoch.current) return;
          setDraft(saved);
          const value = current.current;
          if (saved && saved.overview.at(-1)?.end === saved.end && matchesGenerationInputs(saved.signature, generationSignature(value, saved.request, saved.pipeline === 'library'))) {
            const plan = acceptProposal(value.plan, { version: 1, revision: (value.plan?.revision ?? 0) + 1, event: value.event!, start: saved.start, end: saved.end, rules: value.settings.rules, workouts: saved.workouts, overview: saved.overview, strategy: saved.outline?.strategy, progressions: saved.outline?.progressions, constraintDecisions: saved.outline?.constraintDecisions }, value.event!, value.settings.rules);
            setReview({ kind: 'proposal', plan });
          }
        }).catch(e => { if (mounted && epoch === draftEpoch.current) { setDraftError(true); setError(e instanceof Error ? e.message : 'Saved generation could not load.'); } });
      }
    });
    loadState().then(async value => {
      let savedDraft: GenerationDraft | null = null;
      try { savedDraft = await loadGenerationDraft(); }
      catch (e) { if (mounted) { setDraftError(true); setError(e instanceof Error ? e.message : 'Generation draft could not load.'); } }
      if (mounted) {
        current.current = value; setState(value); setDraft(savedDraft); setReady(true);
        if (savedDraft?.overview.at(-1)?.end === savedDraft?.end && savedDraft && matchesGenerationInputs(savedDraft.signature, generationSignature(value, savedDraft.request, savedDraft.pipeline === 'library'))) {
          try {
            const plan = acceptProposal(value.plan, { version: 1, revision: (value.plan?.revision ?? 0) + 1, event: value.event!, start: savedDraft.start, end: savedDraft.end, rules: value.settings.rules, workouts: savedDraft.workouts, overview: savedDraft.overview, strategy: savedDraft.outline?.strategy, progressions: savedDraft.outline?.progressions, constraintDecisions: savedDraft.outline?.constraintDecisions }, value.event!, value.settings.rules);
            setReview({ kind: 'proposal', plan });
          } catch { setDraftError(true); setError('Saved proposal failed validation. Discard the draft before restarting.'); }
        }
      }
    })
      .catch(e => { if (mounted) { setError(e.message); setRecovery(true); setReady(true); } });
    isConnected().then(value => { if (mounted) setConnected(value); }).catch(() => {});
    return () => { mounted = false; unsubscribe(); if (Platform.OS !== 'android') generator.current?.abort(); };
  }, []);
  async function commit(value: AppState) {
    await saveState(value);
    current.current = value; setState(value);
  }
  async function clearDraft() {
    // A read started when generation ended must not resurrect a deleted draft.
    draftEpoch.current++;
    await clearGenerationDraft(); setDraft(null); setDraftError(false);
  }
  async function run(label: string, action: () => Promise<void>) {
    if (locked.current || !ready) return false;
    locked.current = true; setBusy(label); setError(''); setNotice('');
    try { await action(); return true; } catch (e) { setError(e instanceof Error ? e.message : 'The operation failed.'); return false; }
    finally { locked.current = false; setBusy(''); }
  }
  const available = ready && !busy && !recovery;
  const draftMismatch = useMemo(() => !!draft && !matchesGenerationInputs(draft.signature, generationSignature(state, draft.request, draft.pipeline === 'library')), [draft, state]);
  return { state, ready, recovery, busy, error, notice, connected, review, draft, draftError, draftMismatch, threadId, available,
    setReview, setThreadId,
    saveLibrary: (workoutLibrary: string) => run('Saving workout library…', async () => { parseWorkoutLibrary(workoutLibrary); await commit({ ...current.current, settings: { ...current.current.settings, workoutLibrary } }); setNotice('Workout library saved. Your active plan is unchanged.'); }),
    importLibrary: () => run('Importing workout library…', async () => { const text=await pickMarkdownFile(); if(text===null)return; parseWorkoutLibrary(text); await commit({...current.current,settings:{...current.current.settings,workoutLibrary:text}});setNotice('Workout library imported. Your active plan is unchanged.'); }),
    exportLibrary: () => run('Exporting workout library…', async () => { await shareWorkoutLibrary(current.current.settings.workoutLibrary); }),
    resetLibrary: () => run('Restoring starter library…', async () => { await commit({...current.current,settings:{...current.current.settings,workoutLibrary:defaultWorkoutLibrary}});setNotice('Starter workout library restored. Your active plan is unchanged.'); }),
    cancelGeneration: () => { generator.current?.abort(); cancelBackgroundGeneration(); },
    discardDraft: () => run('Discarding generation draft…', async () => { await clearDraft(); setReview(value => value?.kind === 'proposal' ? null : value); setNotice('Generation draft discarded. You can start a fresh proposal.'); }),
    rejectReview: () => run('Rejecting proposal…', async () => { if (review?.kind === 'proposal') await clearDraft(); setReview(null); }),
    reset: () => run('Resetting local data…', async () => { await clearDraft(); await commit(emptyState()); setRecovery(false); setReview(null); setThreadId(null); setNotice('Local plan and chat data reset. Credentials are unchanged.'); }),
    configure: (settings: AppState['settings'], key: string, password: string) => run('Saving settings…', async () => {
      if (key.trim()) await saveApiKey(key); if (Platform.OS !== 'web' && password) await saveGarminPassword(password);
      await commit({ ...current.current, settings }); setNotice('Settings saved. Secret fields have been cleared.');
    }),
    removeKey: () => run('Removing API key…', async () => { await saveApiKey(''); setNotice('OpenRouter key removed.'); }),
    loadContent: (kind: 'goal' | 'research' | 'constraints', bundled: boolean) => run('Loading file…', async () => {
      const text = bundled ? await loadBundledMarkdown(kind) : await pickMarkdownFile();
      if (text === null) return;
      const value = current.current;
      if (kind === 'goal') {
        const event = parseGoalMarkdown(text);
        if (value.plan && JSON.stringify(value.plan.event) !== JSON.stringify(event)) throw new Error('This goal differs from the active plan. Back up your current plan and use Start a new plan before loading a different goal.');
        await commit({ ...value, event });
      } else await commit({ ...value, settings: { ...value.settings, [kind]: text } });
      setNotice(`${kind} loaded.`);
    }),
    generate: (request = '') => run('Preparing proposal…', async () => {
      if (review) throw new Error('Accept or reject the current review first.');
      if (draftError) throw new Error('Discard the damaged generation draft before restarting.');
      if (draft && !matchesGenerationInputs(draft.signature, generationSignature(current.current, request, draft.pipeline === 'library'))) throw new Error('The saved draft uses different generation inputs. Discard it before starting a different plan.');
      draftEpoch.current++;
      const controller = new AbortController(); generator.current = controller;
      try {
        const key = await getApiKey() ?? '';
        if (!key.trim()) throw new Error('Add your OpenRouter API key in Settings before generating a plan.');
        const generate = draft && draft.pipeline !== 'library' ? generatePlan : generateLibraryPlan;
        const plan = await withGenerationBackground(() => generate(current.current, key, request, text => { setBusy(text); generationProgress(text); }, controller.signal, {
          draft, save: async value => { await saveGenerationDraft(value); setDraft(value); },
        }), () => controller.abort());
        // Also checks completed history against the proposal before showing accept.
        const checked = acceptProposal(current.current.plan, plan, current.current.event!, current.current.settings.rules);
        setReview({ kind: 'proposal', plan: checked });
      } finally { generator.current = null; }
    }),
    accept: () => run('Saving reviewed plan…', async () => {
      if (!review) return;
      const value = current.current;
      if (review.kind === 'proposal') {
        const issues = constraintIssues(value.settings.constraints, value.settings.rules);
        if (issues.length && !review.plan.constraintDecisions?.length) throw new Error(issues.join('\n'));
      }
      const plan = review.kind === 'restore' ? review.plan : acceptProposal(value.plan, review.plan, value.event!, value.settings.rules);
      await commit({ ...value, event: plan.event, plan }); await clearDraft(); setReview(null); setNotice('Reviewed plan saved.'); setRecovery(false);
    }),
    toggle: (id: string) => run('Saving completion…', async () => {
      const value = current.current; if (!value.plan || review) return;
      await commit({ ...value, plan: { ...value.plan, workouts: value.plan.workouts.map(w => w.id === id ? { ...w, completed: !w.completed } : w) } });
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
      await shareExport(kind, current.current.plan.event, upcoming(current.current.plan.workouts));
    }),
    backup: () => run('Creating backup…', async () => { if (!current.current.plan) throw new Error('Accept a plan first.'); await shareBackup(current.current.plan); }),
    restore: () => run('Reading backup…', async () => {
      if (review) throw new Error('Accept or reject the current review first.');
      const text = await pickTextFile('backup'); if (text !== null) setReview({ kind: 'restore', plan: decodeBackup(text) });
    }),
    newPlan: () => run('Starting a new plan…', async () => { await commit({ ...current.current, plan: null }); setReview(null); setNotice('Active plan cleared. Load your next goal and generate a proposal.'); }),
  };
}
const Context = createContext<ReturnType<typeof useController> | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) { const value = useController(); return <Context.Provider value={value}>{children}</Context.Provider>; }
export function useApp() { const value = useContext(Context); if (!value) throw new Error('AppProvider is missing.'); return value; }
