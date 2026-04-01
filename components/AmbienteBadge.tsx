import React from 'react';
import { View, Text } from 'react-native';
import { Leaf, Home } from 'lucide-react-native';

export function AmbienteBadge({ tipo }: { tipo: string }) {
  const isCoberta = tipo.toLowerCase() === 'coberta' || tipo.toLowerCase() === 'indoor';
  const Icon = isCoberta ? Home : Leaf;
  const color = isCoberta ? '#1976D2' : '#F57C00';
  const bgColor = isCoberta ? '#E3F2FD' : '#FFF3E0';

  return (
    <View 
      className="flex-row items-center px-2 py-1 rounded-full" 
      style={{ backgroundColor: bgColor }}
    >
      <Icon size={12} color={color} strokeWidth={2.5} />
      <Text className="ml-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: color }}>
        {tipo}
      </Text>
    </View>
  );
}

