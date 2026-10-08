import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, s } from './ui';

const models = [
  { name: 'Claude Sonnet 4.6', id: 'anthropic/claude-sonnet-4.6' },
  { name: 'Claude Haiku 4.5', id: 'anthropic/claude-haiku-4.5' },
  { name: 'Gemini 2.5 Flash', id: 'google/gemini-2.5-flash' },
];

export function ModelSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 8 }}>
    <Text style={s.label}>Choose a model</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Choose OpenRouter model" accessibilityState={{ expanded: open }} style={s.input} onPress={() => setOpen(!open)}>
      <Text style={s.body}>{models.find(model => model.id === value)?.name ?? 'Custom model'} {open ? '▴' : '▾'}</Text>
    </Pressable>
    {open && <>{models.map(model => <Button key={model.id} title={model.name} secondary onPress={() => { onChange(model.id); setOpen(false); }} />)}
      <Button title="Custom model — enter identifier below" secondary onPress={() => setOpen(false)} />
    </>}
    <Text style={s.muted}>Choose a preset or type any OpenRouter identifier below. Save settings to apply it.</Text>
  </View>;
}
