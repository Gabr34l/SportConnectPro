import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Quadra } from '../types';
import { StatusBadge } from './StatusBadge';
import { MapPin } from 'lucide-react-native';

export function QuadraCard({ quadra }: { quadra: Quadra }) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      className="bg-white rounded-3xl overflow-hidden mb-5 shadow-lg shadow-black/5"
      onPress={() => router.push(`/(organizador)/quadras/${quadra.id_quadra}` as any)}
    >
      <Image 
        source={{ uri: quadra.fotos?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800' }} 
        className="w-full h-32" 
      />
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-bold text-gray-800 flex-1 mr-2" numberOfLines={1}>
            {quadra.nome_local}
          </Text>
          <StatusBadge status={quadra.status_aprovacao} />
        </View>
        <View className="flex-row items-center">
          <MapPin size={14} color="#6B7280" />
          <Text className="ml-1.5 text-sm text-gray-500 flex-1" numberOfLines={1}>
            {quadra.endereco_completo}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

