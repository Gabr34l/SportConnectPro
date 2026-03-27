import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Notificacao } from '../types';
import { theme } from '../constants/theme';
import { format } from 'date-fns';

export function NotificacaoItem({ item, onPress }: { item: Notificacao, onPress: () => void }) {
  const lida = item.lida;
  return (
    <TouchableOpacity style={[styles.container, !lida && styles.naoLida]} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.titulo}</Text>
          <Text style={styles.time}>{format(new Date(item.created_at), 'HH:mm')}</Text>
        </View>
        <Text style={styles.body}>{item.corpo}</Text>
      </View>
      {!lida && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderBottomWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface },
  naoLida: { backgroundColor: theme.colors.primaryMuted },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  time: { fontSize: 12, color: theme.colors.textSecondary },
  body: { fontSize: 14, color: theme.colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginLeft: 8 }
});
