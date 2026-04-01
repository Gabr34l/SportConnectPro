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
    <View className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-6 pt-16 pb-6 bg-white border-b border-gray-100 shadow-sm shadow-black/5">
        <Text className="text-2xl font-bold text-gray-800">Notificações</Text>
        <TouchableOpacity 
          className="bg-green-50 px-4 py-2 rounded-2xl"
          onPress={marcarTodasComoLidas}
        >
          <Text className="text-[#00C853] font-bold text-sm">Limpar todas</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        {loading ? (
          <View className="mt-12">
            <ActivityIndicator size="large" color="#00C853" />
          </View>
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
            contentContainerStyle={{ padding: 20 }}
            ListEmptyComponent={
              <View className="items-center mt-12 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm shadow-black/5">
                <Text style={{fontSize: 48}} className="mb-4">📭</Text>
                <Text className="text-gray-400 font-bold text-center text-lg">
                  Nada por aqui...
                </Text>
                <Text className="text-gray-400 text-center mt-2 leading-6">
                  Você ainda não recebeu notificações. Avisaremos assim que algo acontecer!
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}
