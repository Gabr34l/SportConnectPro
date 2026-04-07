import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Quadra } from '../types';
import { StatusBadge } from './StatusBadge';
import { MapPin } from 'lucide-react-native';

export function QuadraCard({ quadra }: { quadra: Quadra }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Garantir que a foto venha corretamente mesmo se for string plana em vez de array
  let fotoUrl = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800';
  if (Array.isArray(quadra.fotos) && quadra.fotos.length > 0 && quadra.fotos[0]) {
    fotoUrl = quadra.fotos[0];
  } else if (typeof (quadra.fotos as any) === 'string' && (quadra.fotos as any).length > 10) {
    fotoUrl = (quadra.fotos as any);
  }

  return (
    <Pressable 
      className="bg-white rounded-3xl overflow-hidden mb-5 shadow-sm shadow-black/5 flex-row"
      style={{ minHeight: 150, ...(Platform.OS === 'web' ? { width: '100%', maxWidth: 700, alignSelf: 'center' } : {}) }}
      onPress={() => router.push(`/(organizador)/quadra/${quadra.id_quadra}` as any)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      {/* Bloco da Imagem - Estilo Business Card Esculpido */}
      <View className="w-2/5 relative overflow-hidden bg-gray-100">
        <Image 
          source={{ uri: fotoUrl }} 
          className="absolute inset-0 w-full h-full"
          style={{ transition: 'transform 0.4s ease', transform: [{ scale: isHovered ? 1.1 : 1 }] } as any}
          resizeMode="cover"
        />
        {/* Camada para o corte diagonal imitando o cartão */}
        {Platform.OS === 'web' && (
           <View style={{ position: 'absolute', right: -12, top: 0, bottom: 0, width: 48, backgroundColor: '#ffffff', transform: [{ skewX: '-12deg' }], transformOrigin: 'bottom right' }} />
        )}
      </View>

      {/* Conteúdo do Cartão Branco */}
      <View className="p-5 flex-1 justify-center relative bg-white">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-xl font-black text-[#1A202C] flex-1 pr-3" numberOfLines={1}>
            {quadra.nome_local}
          </Text>
          <StatusBadge status={quadra.status_aprovacao} />
        </View>

        <View className="flex-row items-center opacity-80 mt-1">
          <MapPin size={16} color="#6B7280" />
          <Text className="ml-2 text-sm font-medium text-[#4A5568] flex-1" numberOfLines={2}>
            {quadra.endereco_completo}
          </Text>
        </View>
        
      </View>
    </Pressable>
  );
}

