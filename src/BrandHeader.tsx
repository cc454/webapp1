import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from './ui';

/** Shared native/web brand lockup. Page titles remain separate headings. */
export function BrandHeader() {
  return <View style={styles.header}>
    <View accessible accessibilityRole="image" accessibilityLabel="Adaptai" style={styles.lockup}>
      <Image source={require('../assets/brand/adaptai-mark.png')} accessible={false} accessibilityElementsHidden importantForAccessibility="no" resizeMode="contain" style={styles.mark} />
      <Text accessible={false} style={styles.wordmark}>Adaptai</Text>
    </View>
    <Text style={styles.descriptor}>PERSONAL ENDURANCE TRAINING</Text>
  </View>;
}

const styles = StyleSheet.create({
  header: { gap: 8, paddingVertical: 6 },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  mark: { width: 39, height: 36 },
  wordmark: { color: colors.text, fontSize: 30, fontWeight: '700', letterSpacing: -1 },
  descriptor: { color: colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.3 },
});
