import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState as NativeAppState, KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { useApp } from './appContext';
import { Button, Card, colors, Field, s } from './ui';
import { addDays, displayDate, duration, pace, today } from './dates';
import { planDiff, upcoming } from './plan';
import { isTruncated } from './llm';
import { rulesSchema } from './types';
import { ChatMarkdown } from './ChatMarkdown';
import { FitnessSettings } from './FitnessSettings';
import { ModelSelector } from './ModelSelector';
import { BrandHeader } from './BrandHeader';

export function Page({ title, children, footer, scrollRef, onViewport, onContentChange }: { title: string; children: React.ReactNode; footer?: React.ReactNode; scrollRef?: React.RefObject<ScrollView | null>; onViewport?: (height: number) => void; onContentChange?: () => void }) {
  const app = useApp();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => { if (app.error || (!scrollRef && (app.busy || app.notice))) (scrollRef ?? scroll).current?.scrollTo({ y: 0, animated: true }); }, [app.busy, app.error, app.notice, scrollRef]);
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView ref={scrollRef ?? scroll} testID="page-scroll" onLayout={event => onViewport?.(event.nativeEvent.layout.height)} onContentSizeChange={onContentChange} style={s.page} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <View style={{ gap: 12 }}><BrandHeader /><Text accessibilityRole="header" style={s.title}>{title}</Text></View>
    {!app.ready && <ActivityIndicator color={colors.accent} />}
    {!!app.busy && <Card><View style={s.row}><ActivityIndicator color={colors.accent} /><Text style={s.body}>{app.busy}</Text></View></Card>}
    {!!app.error && <Card><Text accessibilityRole="alert" style={s.error}>{app.error}</Text></Card>}
    {!!app.notice && <Text accessibilityRole="alert" style={{ ...s.body, color: colors.accent }}>{app.notice}</Text>}
    {app.recovery && <Card><Text style={s.body}>Saved data needs recovery. Import a valid Markdown plan or explicitly reset local plan and chat data.</Text></Card>}
    {Platform.OS === 'web' && <Text style={s.muted}>Browser preview · Garmin requires Android. Your API key stays in memory for this session; local data belongs to this browser and does not sync between devices.</Text>}
    {isTruncated(app.state) && <Text style={s.error}>Guidance exceeds the request limit. Only the first 20,000 characters of each document will be sent; originals remain saved.</Text>}
    {children}
  </ScrollView>{footer && <View style={s.composer}>{footer}</View>}</KeyboardAvoidingView>;
}
function Review() {
  const app = useApp(); const [expanded, setExpanded] = useState(false); const [phases, setPhases] = useState(false);
  if (!app.review) return null;
  const plan = app.review.plan;
  return <Card><Text style={s.eyebrow}>PROPOSAL / NOT SAVED</Text>
    <Text style={s.heading}>{plan.event.name}</Text><Text style={s.body}>{plan.start} → {plan.end} · {plan.workouts.length} entries</Text>
    {!!plan.strategy && <><Text style={s.eyebrow}>TRAINING STRATEGY / REVIEW</Text><Text style={s.body}>{plan.strategy}</Text>{plan.progressions?.map(p=><Text key={p.id} style={s.muted}>{p.sport} · {p.templateId}: {p.approach}</Text>)}{plan.constraintDecisions?.map((decision,i)=><Text key={i} style={s.body}>Constraint decision: {decision}</Text>)}<Text style={s.muted}>Progression, recovery, tapering and guidance interpretation are the coach's proposal. Check these choices before accepting.</Text></>}
    {planDiff(app.state.plan, plan).map((text, i) => <Text key={i} style={s.muted}>{text}</Text>)}
    <Text style={s.muted}>Rest quota: {plan.rules.restDays} per complete creation-anchored seven-day block. Final partial blocks have no rest quota. Daily rules still apply.</Text>
    {!!plan.strategy && <><Button title={phases ? 'Hide proposed phase progression' : 'Review proposed phase progression'} secondary onPress={()=>setPhases(!phases)} />{phases&&plan.overview.map(w=><View key={w.start} style={{gap:4}}><Text style={s.body}>{w.start} → {w.end} · {w.phase}</Text><Text style={s.muted}>{w.focus} · {w.runningKm} km running · {w.cyclingKm} km cycling</Text></View>)}</>}
    <Button title={expanded ? 'Hide proposed sessions' : 'Review every proposed session'} secondary onPress={() => setExpanded(!expanded)} />
    {expanded && plan.workouts.map(w => <View key={w.id} style={{ borderTopWidth: 1, borderColor: colors.edge, paddingTop: 12, gap: 5 }}><Text style={s.body}>{w.date} · {w.title}</Text><Text style={s.muted}>{w.sport} · {duration(w.durationSeconds)} · {w.distanceKm} km · {w.intensity}</Text><Text style={s.muted}>{w.detail}</Text>{w.steps.map((step, i) => <Text key={i} style={s.muted}>{step.repeats} × {duration(step.seconds)} {step.kind} · {step.target}</Text>)}</View>)}
    <Text style={s.muted}>Acceptance saves this validated proposal. Completed workouts remain preserved.</Text>
    <View style={s.row}><Button title="Accept and save" onPress={app.accept} disabled={!!app.busy || (app.review.base !== app.state.plan)} /><Button title="Reject" secondary onPress={app.rejectReview} disabled={!!app.busy} /></View>
  </Card>;
}
function WorkoutCard({ workout, date, swap, selectSwap }: {
  workout: import('./types').Workout;
  date: string;
  swap: string | null;
  selectSwap: (id: string | null) => void;
}) {
  const app = useApp();
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [detail, setDetail] = useState('');
  const [target, setTarget] = useState('');
  const [seconds, setSeconds] = useState('');
  const [km, setKm] = useState('');
  const [note, setNote] = useState('');
  const [effort, setEffort] = useState('');
  const past = workout.date < date;
  const canEdit = !workout.completed && workout.sport !== 'rest';
  function openEditor() {
    setTitle(workout.title); setType(workout.workoutType ?? (workout.intensity === 'hard' ? 'Hard' : 'Easy'));
    setDetail(workout.detail); setTarget(workout.date);
    setSeconds(String(workout.durationSeconds || '')); setKm(String(workout.distanceKm || '')); setEdit(true);
  }
  return <Card>
    <Text style={past ? s.muted : s.eyebrow}>{workout.sport === 'ride' ? 'Ride' : 'Run'} · {workout.workoutType ?? (workout.intensity === 'hard' ? 'Hard' : 'Easy')}</Text>
    <Text style={past ? s.muted : s.heading}>{workout.title}</Text>
    {workout.steps.map((step, index) => <Text key={index} style={s.muted}>{step.repeats} × {step.seconds} s {step.kind} · {step.target}</Text>)}
    {!!workout.detail && <Text style={past ? s.muted : s.body}>{workout.detail}</Text>}
    <Text style={s.muted}>{[workout.durationSeconds ? `${workout.durationSeconds} s` : '', workout.distanceKm ? `${workout.distanceKm} km` : ''].filter(Boolean).join(' · ')}</Text>
    <Text style={s.body}>{workout.completed ? 'Complete' : 'Incomplete'}</Text>
    {!!workout.completionNote && <Text style={s.body}>{workout.completionNote}</Text>}
    {!!workout.exertion && <Text style={s.body}>Perceived exertion {workout.exertion}/10</Text>}
    {workout.date === date && <>
      {!workout.completed && <>
        <Field label="Completion note (optional)" value={note} onChangeText={setNote} />
        <Field label="Perceived exertion (optional, 1–10)" value={effort} onChangeText={setEffort} keyboardType="number-pad" />
      </>}
      <Button title={workout.completed ? 'Mark incomplete' : 'Mark complete'} onPress={async () => { if (await app.toggle(workout.id, note, effort)) { setNote(""); setEffort(""); } }} disabled={!app.available} />
    </>}
    {canEdit && !edit && !swap && <Button title={past ? 'Reschedule' : 'Edit workout'} onPress={openEditor} disabled={!app.available} />}
    {canEdit && !past && swap === workout.id && <Button title="Cancel swap" onPress={() => selectSwap(null)} />}
    {canEdit && !past && swap !== null && swap !== workout.id && <Button title="Swap with selected workout" disabled={!app.available} onPress={async () => {
      if (await app.editWorkout(swap, { date: workout.date }, workout.id)) selectSwap(null);
    }} />}
    {canEdit && edit && <>
      {!past && <>
        <Field label="Workout title" value={title} onChangeText={setTitle} />
        <Field label="Workout type" value={type} onChangeText={setType} />
        <Field label="Prescription" multiline value={detail} onChangeText={setDetail} />
        <Field label="Duration in seconds" value={seconds} onChangeText={setSeconds} keyboardType="number-pad" />
        <Field label="Distance in km" value={km} onChangeText={setKm} keyboardType="decimal-pad" />
      </>}
      <Field label="Date (YYYY-MM-DD)" value={target} onChangeText={setTarget} />
      <Button title="Save workout" disabled={!app.available} onPress={async () => {
        if (await app.editWorkout(workout.id, { date: target, title, workoutType: type, detail, durationSeconds: Number(seconds), distanceKm: Number(km) })) setEdit(false);
      }} />
      {!past && <Button title="Select workout to swap" onPress={() => { setEdit(false); selectSwap(workout.id); }} />}
      <Button title="Cancel edit" secondary onPress={() => setEdit(false)} />
    </>}
  </Card>;
}
export function PlanScreen() {
  const app = useApp(); const { state } = app;
  const [overview, setOverview] = useState(false);
  const [history, setHistory] = useState(false);
  const [date, setDate] = useState(today);
  const [swap, setSwap] = useState<string | null>(null);
  useEffect(() => {
    const interval = setInterval(() => setDate(today()), 60000);
    const subscription = NativeAppState.addEventListener('change', status => { if (status === 'active') setDate(today()); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
  const pastWorkouts = history ? (state.plan?.workouts ?? [])
    .filter(w => w.sport !== 'rest' && w.date < date)
    .sort((a, b) => b.date.localeCompare(a.date)) : [];
  const pastActivities = history && state.plan ? state.activities
    .map(activity => ({ activity, started: new Date(activity.startedAt) }))
    .filter(({ started }) => Number.isFinite(started.valueOf()))
    .map(item => ({ ...item, day: today(item.started) }))
    .filter(({ day }) => day < date && day >= state.plan!.start && day <= state.plan!.end)
    .sort((a, b) => b.started.valueOf() - a.started.valueOf()) : [];
  const event = state.plan?.title ? null : state.plan?.event ?? state.event;
  const sessions = state.plan ? upcoming(state.plan.workouts, date).filter(w => w.sport !== 'rest') : [];
  return <Page title="Your next seven days">
    <Card>
      {state.plan && <><Text style={s.heading}>{state.plan.title ?? state.plan.event.name}</Text>
        {!!state.plan.trainingGoal && <Text style={s.body}>{state.plan.trainingGoal}</Text>}
        {!!state.plan.eventGoal && <Text style={s.body}>{state.plan.eventGoal}</Text>}</>}
      <Button title="Download Markdown template" onPress={app.downloadTemplate} disabled={!app.ready || !!app.busy} />
      <Button title="Import Markdown plan" onPress={app.importMarkdownPlan} disabled={!app.ready || !!app.busy} />
      <Button title="Sync activities" onPress={app.sync} disabled={!app.available} />
    </Card>
    {app.review && app.review.base !== state.plan &&
      <Text accessibilityRole="alert" style={s.error}>This proposal is stale. Reject it and request a fresh proposal.</Text>}
    <Review />
    {state.plan && <>
      <View style={s.row}><Text style={s.eyebrow}>{date} → {addDays(date, 6)}</Text><Text style={s.muted}>Revision {state.plan.revision}</Text></View>
      {Array.from({ length: 7 }, (_, i) => addDays(date, i)).map(day => <View key={day} style={{ gap: 10 }}><Text style={s.label}>{displayDate(day)}{day === event?.date ? ' · EVENT DAY' : ''}</Text>
        {sessions.filter(w => w.date === day).map(w => <WorkoutCard key={w.id} workout={w} date={date} swap={swap} selectSwap={setSwap} />)}
        {!sessions.some(w => w.date === day) && <Text style={s.muted}>{'No session scheduled'}</Text>}
      </View>)}
      <Card><Text style={s.heading}>Take your plan with you</Text><View style={s.row}>{(['md', 'pdf', 'ics'] as const).map(kind => <Button key={kind} title={{ md: 'Markdown', pdf: 'PDF', ics: 'Calendar' }[kind]} secondary onPress={() => app.exportWeek(kind)} disabled={!app.available} />)}</View><Button title="Export full plan Markdown" onPress={app.backup} disabled={!app.available} /></Card>
    </>}
    {state.plan && <Card><Text style={s.heading}>Entire plan summary</Text><Text style={s.muted}>{displayDate(state.plan.start)} → {displayDate(state.plan.end)} · {state.plan.overview.length} weeks</Text>
      <Button title={overview ? 'Collapse plan summary' : 'Expand plan summary'} secondary onPress={() => setOverview(!overview)} />
      {overview && <View testID="plan-summary" style={{ gap: 16 }}>
        {!!state.plan.strategy && <Text style={s.body}>{state.plan.strategy}</Text>}
        <Text style={s.body}>{state.plan.workouts.filter(w => w.sport === 'run').reduce((sum, w) => sum + w.distanceKm, 0).toFixed(1)} km running · {state.plan.workouts.filter(w => w.sport === 'ride').reduce((sum, w) => sum + w.distanceKm, 0).toFixed(1)} km cycling</Text>
        {state.plan.progressions?.map(p => <Text key={p.id} style={s.muted}>{p.sport === 'ride' ? 'Cycling' : 'Running'} · {p.templateId}: {p.approach}</Text>)}
        {state.plan.constraintDecisions?.map((decision, i) => <Text key={i} style={s.muted}>Constraint decision: {decision}</Text>)}
        {state.plan.overview.map((week, i) => <View key={week.start} style={{ gap: 4 }}><Text style={s.eyebrow}>WEEK {i + 1} · {displayDate(week.start)} → {displayDate(week.end)}</Text><Text style={s.heading}>{week.phase}</Text><Text style={s.body}>{week.focus}</Text><Text style={s.muted}>{week.runningKm} km running · {week.cyclingKm} km cycling</Text></View>)}
      </View>}
    </Card>}
    {state.plan && <>
      <Button title={history ? 'Hide past workouts and activities' : 'Show past workouts and activities'}
        secondary onPress={() => setHistory(!history)} />
      {history && <>
        <Text style={s.heading}>Past planned workouts</Text>
        {pastWorkouts.length === 0 && <Text style={s.muted}>No past workouts in this plan.</Text>}
        {pastWorkouts.map(workout => <View key={workout.id}>
          <Text style={s.muted}>{displayDate(workout.date)}</Text>
          <WorkoutCard workout={workout} date={date} swap={swap} selectSwap={setSwap} />
        </View>)}
        <Text style={s.heading}>Past Garmin activities</Text>
        {pastActivities.length === 0 && <Text style={s.muted}>No synced activities from past dates in this plan.</Text>}
        {pastActivities.map(({ activity, day }) => <Card key={activity.id}>
          <Text style={s.muted}>{displayDate(day)} · {activity.sport === 'ride' ? 'Ride' : 'Run'}</Text>
          <Text style={s.body}>{activity.name}</Text>
          <Text style={s.muted}>{duration(activity.durationSeconds)} · {activity.distanceKm} km{activity.averageHeartRate === undefined ? '' : ` · ${activity.averageHeartRate} bpm`}</Text>
        </Card>)}
      </>}
    </>}
  </Page>;
}
export function ChatScreen({ visit = 0 }: { visit?: number } = {}) {
  const app = useApp(); const [question, setQuestion] = useState('');
  const thread = app.state.threads.find(t => t.id === app.threadId);
  const scroll = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState(0);
  const lastCoach = thread?.messages.map(m => m.role).lastIndexOf('assistant') ?? -1;
  const targetKey = lastCoach >= 0 ? `${thread!.id}-${lastCoach}` : null;
  const target = useRef<{ key: string; y: number } | null>(null);
  function revealCoach() {
    if (!app.error && target.current?.key === targetKey) scroll.current?.scrollTo({ y: target.current!.y, animated: true });
  }
  useEffect(() => { revealCoach(); }, [visit]);
  async function send() {
    const sent = question;
    if (await app.chat(sent)) setQuestion(value => value === sent ? '' : value);
  }
  const composer = <Card><Field label="What would you like to discuss?" multiline style={{ height: 80 }} value={question} onChangeText={setQuestion} placeholder="How should I adjust after a missed session?" /><View style={s.row}><Button title="Send message" onPress={send} disabled={!app.available || !question.trim()} /><Button title="Propose plan changes" secondary onPress={() => app.proposeTraining(question)} disabled={!app.available || !app.state.plan || !question.trim() || !!app.review} /></View><Text style={s.muted}>A plan-change proposal appears for review on Plan. Only accepted changes are saved.</Text></Card>;
  return <Page title="Talk to your coach" footer={composer} scrollRef={scroll} onViewport={height => { setViewport(height); revealCoach(); }} onContentChange={revealCoach}>
    <Card><Text style={s.muted}>Coaching sends event, plan, guidance, relevant messages, and Garmin summaries through OpenRouter to your selected model provider. Credentials are excluded. Advice does not change your saved plan.</Text><Text style={s.label}>{app.state.settings.model}</Text></Card>
    <View style={s.row}><Button title="New conversation" secondary onPress={() => app.setThreadId(null)} disabled={!app.available} /></View>
    {app.state.threads.length > 0 && <Card><Text style={s.eyebrow}>RECENT CONVERSATIONS / {app.state.threads.length} OF 10</Text>{app.state.threads.map(t => <Button key={t.id} title={t.title} secondary onPress={() => app.setThreadId(t.id)} disabled={!app.available} />)}</Card>}
    {thread?.messages.map((m, i) => <View key={`${thread.id}-${i}`} testID={`chat-message-${i}`} onLayout={event => {
      if (i === lastCoach) { target.current = { key: `${thread.id}-${i}`, y: event.nativeEvent.layout.y }; revealCoach(); }
    }}><Card><Text style={s.eyebrow}>{m.role === 'user' ? 'YOU' : 'COACH'}</Text><ChatMarkdown content={m.content} /></Card></View>)}
    {targetKey && <View testID="chat-scroll-space" style={{ height: viewport }} />}
  </Page>;
}
export function SettingsScreen() {
  const app = useApp(); const [draft, setDraft] = useState(app.state.settings);
  const [key, setKey] = useState(''); const [password, setPassword] = useState('');
  const [restDays, setRestDays] = useState(String(draft.rules.restDays));
  const [monday, setMonday] = useState(String(draft.rules.mondayMaxMinutes));
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [localError, setLocalError] = useState('');
  useEffect(() => { setDraft(app.state.settings); setRestDays(String(app.state.settings.rules.restDays)); setMonday(String(app.state.settings.rules.mondayMaxMinutes)); }, [app.state.settings]);
  async function save() {
    const result = rulesSchema.safeParse({ ...draft.rules, restDays: Number(restDays), mondayMaxMinutes: Number(monday) });
    if (!result.success || !restDays.trim() || !monday.trim() || !draft.model.trim()) { setLocalError('Enter a model, 0–7 rest days, and a nonnegative Monday duration.'); return; }
    setLocalError(''); await app.configure({ ...draft, model: draft.model.trim(), rules: result.data }, key, password); setKey(''); setPassword('');
  }
  return <Page title="Your training setup">
    {!!localError && <Text style={s.error}>{localError}</Text>}
    <Card><Text style={s.heading}>OpenRouter</Text><ModelSelector value={draft.model} onChange={model => setDraft({ ...draft, model })} /><Field label="Model identifier" value={draft.model} onChangeText={model => setDraft({ ...draft, model })} autoCapitalize="none" /><Field label="OpenRouter API key (blank retains saved key)" value={key} onChangeText={setKey} secureTextEntry autoCapitalize="none" autoCorrect={false} /><Text style={s.muted}>Plan generation validates JSON responses; models without structured output use a JSON prompt fallback. {Platform.OS === 'web' ? 'Browser key is memory-only.' : 'The key is encrypted on this device.'}</Text><Button title="Remove saved API key" secondary onPress={app.removeKey} disabled={!app.available} /></Card>
    <Card><Text style={s.heading}>Garmin Connect</Text><Text style={s.muted}>{app.connected ? 'Connected' : 'Disconnected'} · Last sync: {app.state.lastSync ? new Date(app.state.lastSync).toLocaleString('en-GB') : 'Never'}</Text><Field label="Garmin email" value={draft.garminEmail} onChangeText={garminEmail => setDraft({ ...draft, garminEmail })} autoCapitalize="none" keyboardType="email-address" /><Field label="Garmin password (blank retains saved password)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} /><Text style={s.muted}>Save settings before connecting. Sync fetches the last 50 activities and refreshes your Garmin fitness metrics.</Text><View style={s.row}><Button title="Connect Garmin" secondary onPress={app.connect} disabled={!app.available || Platform.OS === 'web'} /><Button title="Sync activities" onPress={app.sync} disabled={!app.available || Platform.OS === 'web'} /><Button title="Disconnect" secondary onPress={app.disconnect} disabled={!app.available || Platform.OS === 'web'} /></View><Text style={s.muted}>{app.state.activities.length} cached running/cycling activities</Text></Card>
    <FitnessSettings fitness={app.state.fitness} />
    <Card><Text style={s.heading}>Enforced schedule</Text><Field label="Minimum rest days per complete seven-day block" value={restDays} onChangeText={setRestDays} keyboardType="number-pad" /><Field label="Monday maximum minutes" value={monday} onChangeText={setMonday} keyboardType="number-pad" /><View style={s.row}><Switch value={draft.rules.weekendLong} onValueChange={weekendLong => setDraft({ ...draft, rules: { ...draft.rules, weekendLong } })} /><Text style={s.body}>Long sessions on weekends</Text></View><View style={s.row}><Switch value={draft.rules.noConsecutiveHard} onValueChange={noConsecutiveHard => setDraft({ ...draft, rules: { ...draft.rules, noConsecutiveHard } })} /><Text style={s.body}>No consecutive hard days</Text></View><Text style={s.muted}>Rest quotas use seven-day blocks from plan creation. The final partial block has no quota. Additional guidance below is sent to the coach; only these explicit rules are enforced automatically.</Text></Card>
    {(['research', 'constraints'] as const).map(kind => <Card key={kind}><Text style={s.heading}>{kind === 'research' ? 'Research' : 'Additional constraints'}</Text><Field label={`${kind} text`} multiline value={draft[kind]} onChangeText={text => setDraft({ ...draft, [kind]: text })} /><View style={s.row}><Button title="Import .md / .txt" secondary onPress={() => app.loadContent(kind, false)} disabled={!app.available} /><Button title="Load project file" secondary onPress={() => app.loadContent(kind, true)} disabled={!app.available} /></View><Text style={s.muted}>Loading replaces saved text. Save your edits with Save settings.</Text></Card>)}
    <Text style={s.muted}>Unrecognized scheduling rules block generation. Prefix advisory text with “guidance:” if it is intended as coach guidance rather than an enforced rule.</Text>
    <Button title="Save settings" onPress={save} disabled={!app.available || !!app.review} />
    <Card><Text style={s.heading}>Activity exports</Text>
      <Button title="Export activities as CSV" onPress={() => app.exportActivities('csv')} disabled={!app.available} />
      <Button title="Export activities as Markdown" onPress={() => app.exportActivities('md')} disabled={!app.available} />
    </Card>
    <Card><Text style={s.heading}>Plan and data controls</Text><Button title="Export full plan Markdown" secondary onPress={app.backup} disabled={!app.available || !app.state.plan} />
      <Button title="Start a new plan" secondary onPress={() => setConfirmNew(true)} disabled={!app.available || !!app.review} />{confirmNew && <><Text style={s.error}>This clears your active plan. Back it up first if you want to keep it. Chats and settings remain.</Text><View style={s.row}><Button title="Confirm clear active plan" onPress={() => { app.newPlan(); setConfirmNew(false); }} disabled={!!app.busy} /><Button title="Cancel" secondary onPress={() => setConfirmNew(false)} /></View></>}
      <Button title="Reset local plan and chat data" secondary onPress={() => setConfirmReset(true)} disabled={!app.ready || !!app.busy} />{confirmReset && <><Text style={s.error}>This replaces local plan, chats, guidance, and cached activities with empty data. Credentials remain saved.</Text><View style={s.row}><Button title="Confirm reset" onPress={() => { app.reset(); setConfirmReset(false); }} disabled={!!app.busy} /><Button title="Cancel" secondary onPress={() => setConfirmReset(false)} /></View></>}
    </Card>
  </Page>;
}
