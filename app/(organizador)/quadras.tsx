import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../contexts/AuthContext';
import { useQuadras } from '../../hooks/useQuadras';
import { QuadraCard } from '../../components/QuadraCard';
import { Quadra } from '../../types';
import { Plus, Building2 } from 'lucide-react-native';

export default function QuadrasList() {
  const { usuario } = useAuthContext();
  const router = useRouter();
  const { fetchQuadrasOrganizador, loading } = useQuadras();
  const [quadras, setQuadras] = useState<Quadra[]>([]);

  useEffect(() => {
    if (usuario) {
      fetchQuadrasOrganizador(usuario.id_usuario).then(setQuadras);
    }
  }, [usuario]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-16 pb-6 flex-row justify-between items-center border-b border-gray-100 shadow-sm shadow-black/5">
        <Text className="text-2xl font-bold text-gray-800">Minhas Quadras</Text>
        <TouchableOpacity 
          className="bg-green-50 px-4 py-2 rounded-2xl flex-row items-center" 
          onPress={() => router.push('/(organizador)/cadastrar-quadra')}
        >
          <Plus size={16} color="#00C853" strokeWidth={3} />
          <Text className="text-[#00C853] font-bold ml-1">Nova</Text>
        </TouchableOpacity>
      </View>

      {loading && quadras.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00C853" />
        </View>
      ) : (
        <FlatList
          data={quadras}
          keyExtractor={q => q.id_quadra}
          renderItem={({item}) => (
            <QuadraCard quadra={item} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center mt-12 bg-white p-8 rounded-3xl border border-gray-100 mx-6 shadow-sm shadow-black/5">
              <View className="w-20 h-20 bg-gray-50 rounded-full justify-center items-center mb-4">
                <Building2 size={40} color="#9CA3AF" strokeWidth={1.5} />
              </View>
              <Text className="text-gray-500 text-center text-base leading-6">
                Você ainda não possui quadras cadastradas.
              </Text>
              <TouchableOpacity 
                className="mt-6 bg-[#00C853] px-6 py-3 rounded-2xl"
                onPress={() => router.push('/(organizador)/cadastrar-quadra')}
              >
                <Text className="text-white font-bold">Cadastrar Agora</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
