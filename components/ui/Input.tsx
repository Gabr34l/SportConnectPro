import React from 'react';
import { View, TextInput, TextInputProps, Text, Platform } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

export interface InputProps extends TextInputProps {
  icon?: LucideIcon;
  error?: string;
  label?: string;
  containerClassName?: string;
  inputClassName?: string;
  inputContainerClassName?: string;
  type?: string; // used for web input type when applicable
}

export function Input({
  icon: Icon,
  error,
  label,
  containerClassName = '',
  inputClassName = '',
  inputContainerClassName = '',
  type,
  ...props
}: InputProps) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</Text>}
      
      <View className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${inputContainerClassName || 'bg-gray-50 dark:bg-gray-950'} ${
        error ? 'border-red-500' : 'border-gray-100 dark:border-gray-800'
      }`}>
        {Icon && <Icon size={20} color={error ? "#EF4444" : "#9CA3AF"} />}
        
        {Platform.OS === 'web' && type ? (
          React.createElement('input', {
            type,
            ...props,
            style: { flex: 1, marginLeft: Icon ? 12 : 0, border: 'none', background: 'transparent', outline: 'none', fontSize: 16, color: '#1F2937', fontFamily: 'inherit' }
          })
        ) : (
          <TextInput
            className={`flex-1 text-base text-gray-800 dark:text-white ${Icon ? 'ml-3' : ''} ${inputClassName}`}
            placeholderTextColor="#9CA3AF"
            {...props}
          />
        )}
      </View>
      
      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
}
