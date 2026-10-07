import React from 'react';
import { Text, View } from 'react-native';
import { GarminFitness } from './types';
import { Card, s } from './ui';
const fetched = (date: string | undefined) => date ? `Fetched ${new Date(date).toLocaleString('en-GB')}` : 'Sync Garmin to fetch these values.';
const metric = (value: number | null | undefined, unit: string, decimals = 1) => value != null ? `${value.toFixed(decimals)} ${unit}` : 'Unavailable in Garmin';
export function FitnessSettings({ fitness }: { fitness: GarminFitness }) {
  return <Card><Text style={s.heading}>Garmin fitness</Text>
    <Text style={s.body}>Running VO₂ max: {metric(fitness.vo2?.running, 'ml/kg/min')}</Text>
    <Text style={s.body}>Cycling VO₂ max: {metric(fitness.vo2?.cycling, 'ml/kg/min')}</Text>
    <Text style={s.muted}>{fetched(fitness.vo2?.fetchedAt)}</Text>
    <Text style={s.body}>Cycling FTP/kg: {metric(fitness.power?.wattsPerKg, 'W/kg', 2)}</Text>
    <Text style={s.body}>Cycling FTP: {metric(fitness.power?.ftpW, 'W', 0)}</Text>
    <Text style={s.muted}>{fetched(fitness.power?.fetchedAt)}{fitness.power?.date ? ` · Garmin date ${fitness.power.date}` : ''}</Text>
    <Text style={s.heading}>Heart-rate zones</Text>
    {fitness.zones?.profiles.length ? fitness.zones.profiles.map((profile, i) => <View key={i} style={{ gap: 5 }}>
      <Text style={s.label}>{profile.sport.replace(/_/g, ' ')}</Text>
      {profile.floors.map((floor, n) => <Text key={n} style={s.body}>Zone {n + 1}: {n < 4 ? `${floor}–${profile.floors[n + 1]! - 1}` : profile.maxHeartRate ? `${floor}–${profile.maxHeartRate}` : `${floor}+`} bpm</Text>)}
    </View>) : <Text style={s.body}>Unavailable in Garmin</Text>}
    <Text style={s.muted}>{fetched(fitness.zones?.fetchedAt)}</Text>
    {fitness.warnings.map((warning, i) => <Text key={i} style={s.error}>{warning}</Text>)}
  </Card>;
}
