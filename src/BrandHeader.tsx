import React from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from './ui';

/** Shared native/web brand lockup. Page titles remain separate headings. */
export function BrandHeader() {
  const { width } = useWindowDimensions();
  return <View style={styles.header}>
    <View accessible accessibilityRole="image" accessibilityLabel="Adaptai" style={styles.lockup}>
      <Image source={require('../assets/brand/adaptai-mark.png')} accessible={false} accessibilityElementsHidden importantForAccessibility="no" resizeMode="contain" style={styles.mark} />
      <Text accessible={false} numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.wordmark}>Adaptai</Text>
    </View>
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} maxFontSizeMultiplier={1.2} style={[styles.descriptor, width < 360 && { fontSize: 8 }]}>PERSONAL ENDURANCE TRAINING</Text>
  </View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  mark: { width: 28, height: 26 },
  wordmark: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.6 },
  descriptor: { flex: 1, color: colors.muted, fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});
