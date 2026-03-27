import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPORTS } from '../constants/sports';

export function MapQuadraPin({ esporteId }: { esporteId: string }) {
  const sport = SPORTS.find(s => s.id === esporteId) || SPORTS[SPORTS.length - 1];
  return (
    <View style={[styles.pin, { backgroundColor: sport.color }]}>
      <Text style={styles.emoji}>{sport.emoji}</Text>
      <View style={[styles.triangle, { borderTopColor: sport.color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: { padding: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 16 },
  triangle: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopWidth: 8, position: 'absolute', bottom: -8 }
});
