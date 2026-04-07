import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases, config } from '../../../lib/appwrite';
import { Quadra } from '../../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, ChevronLeft, Plus, Trash2, Edit3, Settings, Share2, Info } from 'lucide-react-native';
import { StatusBadge } from '../../../components/StatusBadge';

export default function DetalhesQuadra() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [quadra, setQuadra] = useState<Quadra | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchQuadra();
    }
  }, [id]);

  const fetchQuadra = async () => {
    try {
      const doc = await databases.getDocument(
        config.databaseId,
        config.collections.quadras,
        id as string
      );
      setQuadra({ ...doc, id_quadra: doc.$id } as unknown as Quadra);
    } catch (e) {
      console.error('Erro ao buscar quadra:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      if (!confirm('Deseja realmente excluir esta quadra? Esta ação não pode ser desfeita.')) return;
    } else {
        // Alert.alert logic for native
    }
    
    try {
      setLoading(true);
      await databases.deleteDocument(
        config.databaseId,
        config.collections.quadras,
        id as string
      );
      router.back();
    } catch (e) {
      console.error('Erro ao excluir:', e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  if (!quadra) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-8">
        <Text className="text-gray-400 text-center text-lg mb-6">Quadra não encontrada.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-[#00C853] px-6 py-3 rounded-2xl">
          <Text className="text-white font-bold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fotoPrincipal = Array.isArray(quadra.fotos) && quadra.fotos.length > 0 
    ? quadra.fotos[0] 
    : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200';

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Banner Image */}
        <View className="relative h-[400px]">
          <Image source={{ uri: fotoPrincipal }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
            className="absolute inset-0"
          />
          
          {/* Header Actions */}
          <View className="flex-row justify-between items-center px-6 pt-16">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl justify-center items-center"
            >
              <ChevronLeft color="white" size={24} />
            </TouchableOpacity>
            
            <View className="flex-row gap-3">
              <TouchableOpacity className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl justify-center items-center">
                <Share2 color="white" size={20} />
              </TouchableOpacity>
              <TouchableOpacity className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl justify-center items-center">
                <Settings color="white" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title Overlay */}
          <View className="absolute bottom-10 px-8 w-full">
            <StatusBadge status={quadra.status_aprovacao} />
            <Text className="text-4xl font-black text-white mt-4">{quadra.nome_local}</Text>
            <View className="flex-row items-center mt-2 opacity-80">
              <MapPin size={18} color="white" />
              <Text className="text-white text-sm ml-2 font-medium" numberOfLines={1}>{quadra.endereco_completo}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="-mt-6 bg-gray-50 rounded-t-[40px] px-8 pt-10 pb-32">
          
          {/* Quick Actions Card */}
          <View className="bg-white p-2 rounded-[32px] flex-row mb-10 shadow-xl shadow-black/5 border border-gray-100">
            <TouchableOpacity 
              className="flex-1 bg-green-50 rounded-[28px] py-4 items-center justify-center"
              onPress={() => router.push({ pathname: '/(organizador)/criar-evento', params: { quadraId: quadra.id_quadra } })}
            >
              <Plus color="#00C853" size={24} strokeWidth={3} />
              <Text className="text-[#00C853] font-bold text-xs uppercase tracking-wider mt-2">Criar Evento</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1 rounded-[28px] py-4 items-center justify-center">
              <Edit3 color="#4B5563" size={24} />
              <Text className="text-gray-600 font-bold text-xs uppercase tracking-wider mt-2">Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 rounded-[28px] py-4 items-center justify-center"
              onPress={handleDelete}
            >
              <Trash2 color="#EF4444" size={24} />
              <Text className="text-red-500 font-bold text-xs uppercase tracking-wider mt-2">Excluir</Text>
            </TouchableOpacity>
          </View>

          {/* Information Sections */}
          <View className="mb-10">
            <View className="flex-row items-center mb-6">
              <View className="w-1.5 h-6 bg-[#00C853] rounded-full mr-3" />
              <Text className="text-xl font-black text-gray-800">Sobre o Local</Text>
            </View>
            
            <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm shadow-black/5">
              <Text className="text-gray-500 text-base leading-7 font-medium">
                {quadra.descricao || 'Nenhuma descrição detalhada fornecida para este local.'}
              </Text>
              
              <View className="h-[1px] bg-gray-100 w-full my-6" />
              
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-4">
                   <Info size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cadastro</Text>
                  <Text className="text-gray-800 font-bold">Arena Registrada</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Features / Amenities */}
          <View>
             <Text className="text-xl font-black text-gray-800 mb-6 px-2">Comodidades</Text>
             <View className="flex-row flex-wrap gap-3">
               {['Vestiário', 'Estacionamento', 'Bar/Cantina', 'Wi-Fi'].map((item) => (
                 <View key={item} className="bg-white border border-gray-100 px-5 py-3 rounded-2xl shadow-sm shadow-black/5">
                   <Text className="text-gray-600 font-bold text-sm tracking-tight">{item}</Text>
                 </View>
               ))}
             </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
