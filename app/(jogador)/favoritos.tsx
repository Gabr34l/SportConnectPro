import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { databases, config, Query } from '../../lib/appwrite';
import { useAuthContext } from '../../contexts/AuthContext';
import { QuadraCard } from '../../components/QuadraCard';
import { Quadra } from '../../types';
import { Heart } from 'lucide-react-native';

export default function Favoritos() {
  const { usuario } = useAuthContext();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    const fetchFavoritos = async () => {
      setLoading(true);
      try {
        const response = await databases.listDocuments(
          config.databaseId,
          config.collections.favoritos,
          [Query.equal('id_usuario', usuario.id_usuario)]
        );
        
        // Se usar Two-way mapping, os dados da quadra estarão no atributo 'id_quadra' do documento
        const quadrasMapeadas = response.documents
          .map(d => d.id_quadra ? ({
            ...d.id_quadra,
            id_quadra: d.id_quadra.$id,
            created_at: d.id_quadra.$createdAt
          }) : null)
          .filter(q => q !== null) as Quadra[];

        setQuadras(quadrasMapeadas);
      } catch (e) {
        console.error('Erro ao buscar favoritos:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchFavoritos();
  }, [usuario]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-16 pb-6 border-b border-gray-100 shadow-sm shadow-black/5">
        <Text className="text-2xl font-bold text-gray-800">Favoritos</Text>
      </View>
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00C853" />
        </View>
      ) : (
        <FlatList
          data={quadras}
          keyExtractor={q => q?.id_quadra}
          renderItem={({item}) => item ? <QuadraCard quadra={item} /> : null}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center mt-12 bg-white p-8 rounded-3xl border border-gray-100 mx-6">
              <View className="w-20 h-20 bg-red-50 rounded-full justify-center items-center mb-4">
                <Heart size={40} color="#E24B4A" fill="#E24B4A" strokeWidth={1.5} />
              </View>
              <Text className="text-gray-500 text-center text-base leading-6">
                Nenhuma quadra favoritada ainda.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
