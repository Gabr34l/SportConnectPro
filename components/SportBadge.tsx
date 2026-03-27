import React from 'react';
import { View, Text } from 'react-native';
import { SPORTS } from '../constants/sports';
import * as LucideIcons from 'lucide-react-native';

export function SportBadge({ esporteId }: { esporteId: string }) {
  const sport = SPORTS.find(s => s.id === esporteId) || SPORTS[SPORTS.length - 1];
  const IconComponent = (LucideIcons as any)[sport.iconName] || LucideIcons.Activity;
  
  return (
    <View 
      className="flex-row items-center px-2 py-1 rounded-full mr-2" 
      style={{ backgroundColor: sport.color + '20' }}
    >
      <IconComponent size={14} color={sport.color} strokeWidth={2.5} />
      <Text className="ml-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: sport.color }}>
        {sport.label}
      </Text>
    </View>
  );
}

