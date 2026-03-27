import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export function PlayerSlots({ total, ocupadas }: { total: number, ocupadas: number }) {
  const slots = Array.from({ length: total }, (_, i) => i < ocupadas);
  
  return (
    <View style={styles.container}>
      {slots.map((ocupada, i) => (
        <View key={i} style={[styles.slot, ocupada ? styles.slotOcupado : styles.slotLivre]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  slot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, marginRight: 4, marginBottom: 4 },
  slotOcupado: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  slotLivre: { backgroundColor: 'transparent', borderColor: theme.colors.border },
});
