import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../contexts/AuthContext';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import { NotificacaoItem } from '../../components/NotificacaoItem';
import { theme } from '../../constants/theme';

export default function Notificacoes() {
  const { usuario } = useAuthContext();
  const router = useRouter();
  const { notificacoes, loading, marcarComoLida, marcarTodasComoLidas } = useNotificacoes(usuario?.id_usuario);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
        <TouchableOpacity onPress={marcarTodasComoLidas}>
          <Text style={styles.markAll}>Marcar todas lidas</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={n => n.id_notificacao}
          renderItem={({item}) => (
            <NotificacaoItem 
              item={item} 
              onPress={() => {
                marcarComoLida(item.id_notificacao);
                if (item.id_referencia) {
                  router.push(`/(jogador)/evento/${item.id_referencia}` as any);
                }
              }} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{fontSize: 48}}>📭</Text>
              <Text style={styles.emptyText}>Nenhuma notificação por enquanto</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 48, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderColor: theme.colors.border },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textPrimary },
  markAll: { fontSize: 14, color: theme.colors.primary, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: theme.colors.textSecondary, marginTop: 16, textAlign: 'center' }
});
