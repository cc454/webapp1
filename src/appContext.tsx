import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { AppState, Plan } from './types';
import { emptyState } from './defaults';
import { loadState, saveState, getApiKey, getGarminPassword, saveApiKey, saveGarminPassword } from './storage';
import { loadBundledMarkdown, pickMarkdownFile, pickTextFile } from './markdown';
import { parseGoalMarkdown } from './goal';
import { acceptProposal, upcoming } from './plan';
import { generatePlan, askCoach } from './llm';
import { appendExchange } from './chat';
import { disconnect, isConnected, pullActivitySummaries, signIn } from './garmin';
import { shareBackup, shareExport } from './exports';
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
  const [threadId, setThreadId] = useState<string | null>(null);
  const locked = useRef(false);
  const current = useRef(state);
  const generator = useRef<AbortController | null>(null);
  useEffect(() => {
    let mounted = true;
    loadState().then(value => { if (mounted) { current.current = value; setState(value); setReady(true); } })
      .catch(e => { if (mounted) { setError(e.message); setRecovery(true); setReady(true); } });
    isConnected().then(value => { if (mounted) setConnected(value); }).catch(() => {});
    return () => { mounted = false; generator.current?.abort(); };
  }, []);
  async function commit(value: AppState) {
    await saveState(value);
    current.current = value; setState(value);
  }
  async function run(label: string, action: () => Promise<void>) {
    if (locked.current || !ready) return;
    locked.current = true; setBusy(label); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'The operation failed.'); }
    finally { locked.current = false; setBusy(''); }
  }
  const available = ready && !busy && !recovery;
  return { state, ready, recovery, busy, error, notice, connected, review, threadId, available,
    setReview, setThreadId,
    cancelGeneration: () => generator.current?.abort(),
    reset: () => run('Resetting local data…', async () => { await commit(emptyState()); setRecovery(false); setReview(null); setThreadId(null); setNotice('Local plan and chat data reset. Credentials are unchanged.'); }),
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
      const controller = new AbortController(); generator.current = controller;
      try {
        const plan = await generatePlan(current.current, await getApiKey() ?? '', request, setBusy, controller.signal);
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
        if (issues.length) throw new Error(issues.join('\n'));
      }
      const plan = review.kind === 'restore' ? review.plan : acceptProposal(value.plan, review.plan, value.event!, value.settings.rules);
      await commit({ ...value, event: plan.event, plan }); setReview(null); setNotice('Reviewed plan saved.'); setRecovery(false);
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
        await commit({ ...current.current, activities, lastSync: new Date().toISOString() }); setConnected(true);
        setNotice(`Synced ${activities.length} running/cycling activities.`);
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
