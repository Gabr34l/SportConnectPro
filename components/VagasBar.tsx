import React from 'react';
import { View, StyleSheet } from 'react-native';
import { corVagas } from '../constants/theme';

export function VagasBar({ vagas, limite }: { vagas: number, limite: number }) {
  const pct = Math.max(0, Math.min(1, vagas / limite));
  const color = corVagas(vagas, limite);

  return (
    <View style={styles.container}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginVertical: 8 },
  fill: { height: '100%', borderRadius: 4 },
});
