import React from 'react';
import { View, ViewProps, Text } from 'react-native';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View 
      className={`bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm shadow-black/5 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <View className={`p-5 border-b border-gray-100 dark:border-gray-800 ${className}`}>
      {children}
    </View>
  );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <View className={`p-5 ${className}`}>
      {children}
    </View>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <Text className={`text-lg font-bold text-gray-800 dark:text-white ${className}`}>
      {children}
    </Text>
  );
}
