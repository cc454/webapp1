import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useApp } from './appContext';
import { Page } from './screens';
import { Button, Card, Field, s } from './ui';
import { parseWorkoutLibrary } from './workoutLibrary';
import { parameterNames, WorkoutLibrary } from './libraryTypes';

export function WorkoutLibraryScreen() {
  const app=useApp();const [text,setText]=useState(app.state.settings.workoutLibrary),[expanded,setExpanded]=useState<string|null>(null),[confirm,setConfirm]=useState(false);
  useEffect(()=>setText(app.state.settings.workoutLibrary),[app.state.settings.workoutLibrary]);
  let library:WorkoutLibrary|null=null,error='';try{library=parseWorkoutLibrary(text);}catch(e){error=e instanceof Error?e.message:'Invalid library';}
  const available=app.available&&!app.review;
  return <Page title="Workout library">
    <Card><Text style={s.body}>The coach chooses progression, recovery, tapering and how to resolve conflicts. The app builds dated workouts from these bounds and checks the completed proposal. Editing the library affects future proposals; your active plan stays unchanged.</Text><Text style={s.muted}>Export the .md file, edit its single JSON block, then import it. Ranges are minimum / default / maximum. Times are seconds; RPE is 1–10. Recovery occurs between repetitions, and set recovery between sets.</Text><View style={s.row}><Button title="Import library .md" secondary onPress={app.importLibrary} disabled={!available} /><Button title="Export library .md" secondary onPress={app.exportLibrary} disabled={!app.available} /></View></Card>
    {library?.templates.map(t=><Card key={t.id}><Text style={s.eyebrow}>{t.id} · {t.intensity.toUpperCase()}{t.long?' · LONG':''}</Text><Text style={s.heading}>{t.name}</Text><Text style={s.body}>{t.goal}</Text><Text style={s.muted}>{t.progression}</Text><Button title={expanded===t.id?'Hide sport parameters':'View running and cycling parameters'} secondary onPress={()=>setExpanded(expanded===t.id?null:t.id)} />{expanded===t.id&&(['run','ride'] as const).map(sport=><View key={sport} style={{gap:5}}><Text style={s.label}>{sport==='run'?'RUNNING':'CYCLING'}</Text><Text style={s.muted}>{t.sports[sport].targetCue}</Text>{parameterNames.map(name=><Text key={name} style={s.muted}>{name}: {t.sports[sport].parameters[name].join(' / ')}</Text>)}<Text style={s.muted}>Total interval work: {t.sports[sport].totalWorkSeconds?.join('–')??'Within parameter bounds'} · Recovery/work: {t.sports[sport].recoveryRatio?.join('–')??'Protocol-specific'} · FTP %: {t.sports[sport].ftpPercent?.join(' / ')??'Not prescribed'}</Text></View>)}</Card>)}
    <Card><Text style={s.heading}>Edit library Markdown</Text><Field label="Workout library Markdown" multiline value={text} onChangeText={setText} editable={available} /><Text style={s.muted}>Only valid libraries can replace the saved one. Import cancellation or validation errors preserve it. Export uses the saved version; save your edits first.</Text>{!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Button title="Save workout library" onPress={()=>app.saveLibrary(text)} disabled={!available||!!error} /><Button title="Restore starter library" secondary onPress={()=>setConfirm(true)} disabled={!available} />{confirm&&<><Text style={s.error}>This replaces your saved library. Export it first to keep your changes.</Text><Button title="Confirm restore starter library" onPress={()=>{app.resetLibrary();setConfirm(false);}} disabled={!available}/><Button title="Cancel library restore" secondary onPress={()=>setConfirm(false)}/></>}</Card>
  </Page>;
}
