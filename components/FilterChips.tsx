import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import * as LucideIcons from 'lucide-react-native';

export type FilterOption = { label: string; value: string; iconName?: string };

type Props = {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (val: string) => void;
};

export function FilterChips({ options, selectedValue, onSelect }: Props) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      className="mb-4" 
      contentContainerStyle={{ paddingHorizontal: 24 }}
    >
      {options.map((opt) => {
        const isSelected = selectedValue === opt.value;
        const IconComponent = opt.iconName ? (LucideIcons as any)[opt.iconName] : null;

        return (
          <TouchableOpacity 
            key={opt.value} 
            className={`flex-row items-center px-4 py-2.5 rounded-2xl mr-2 border ${
              isSelected ? 'bg-[#00C853] border-[#00C853]' : 'bg-white border-gray-100'
            }`}
            onPress={() => onSelect(opt.value)}
          >
            {IconComponent && (
              <IconComponent 
                size={16} 
                color={isSelected ? '#FFFFFF' : '#6B7280'} 
                className="mr-2"
                strokeWidth={2}
              />
            )}
            <Text 
              className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-500'}`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

