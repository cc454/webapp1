import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
export const colors = { bg: '#101213', panel: '#191D1F', edge: '#303739', muted: '#A3AEAE', text: '#F2F5F0', accent: '#C6E887', error: '#FFAD9D' };
export function Button({ title, onPress, disabled, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, (disabled || pressed) && { opacity: 0.5 }]}><Text style={{ color: secondary ? colors.text : colors.bg, fontWeight: '700', fontSize: 14 }}>{title}</Text></Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const [contentHeight, setContentHeight] = useState(140);
  const [offset, setOffset] = useState(0);
  const configuredHeight = StyleSheet.flatten(props.style)?.height;
  const height = typeof configuredHeight === 'number' ? configuredHeight : 140;
  const track = height - 20;
  const thumb = Math.max(20, track * height / Math.max(height, contentHeight));
  const position = Math.min(1, Math.max(0, offset / Math.max(1, contentHeight - height))) * (track - thumb);
  return <View style={{ gap: 7, marginBottom: 12 }}><Text style={s.label}>{label}</Text><View><TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} {...props}
    onContentSizeChange={event => { setContentHeight(event.nativeEvent.contentSize.height); props.onContentSizeChange?.(event); }}
    onScroll={event => { setOffset(event.nativeEvent.contentOffset.y); props.onScroll?.(event); }}
    scrollEnabled={props.multiline ? true : props.scrollEnabled} style={[s.input, props.multiline && { height: 140, maxHeight: 180, paddingRight: 20, textAlignVertical: 'top', ...(Platform.OS === 'web' ? { overflowY: 'auto' } as object : {}) }, props.style]} />
    {props.multiline && Platform.OS !== 'web' && contentHeight > height && <View pointerEvents="none" testID={`${label}-scrollbar`} style={{ position: 'absolute', right: 5, top: 10, height: track, width: 4, backgroundColor: colors.edge, borderRadius: 2 }}><View style={{ width: 4, height: thumb, top: position, backgroundColor: colors.muted, borderRadius: 2 }} /></View>}
  </View></View>;
}
export function Card({ children }: { children: React.ReactNode }) { return <View style={s.card}>{children}</View>; }
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg }, content: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 22, paddingBottom: 60, gap: 18 },
  composer: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 12, backgroundColor: colors.bg },
  card: { backgroundColor: colors.panel, borderColor: colors.edge, borderWidth: 1, borderRadius: 18, padding: 20, gap: 12 },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2.2, fontWeight: '700' },
  title: { color: colors.text, fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  heading: { color: colors.text, fontSize: 20, fontWeight: '600' },
  body: { color: colors.text, fontSize: 15, lineHeight: 23 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.edge, borderRadius: 10, padding: 12, color: colors.text, backgroundColor: colors.bg, fontSize: 15 },
  button: { paddingHorizontal: 17, paddingVertical: 14, backgroundColor: colors.accent, borderRadius: 10, alignItems: 'center' },
  secondary: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.edge },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  error: { color: colors.error, fontSize: 14, lineHeight: 21 },
});
