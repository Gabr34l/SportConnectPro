import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  textClassName = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'flex-row justify-center items-center rounded-2xl transition-all';

  const variantClasses = {
    primary: 'bg-[#00C853] shadow-lg shadow-green-500/40',
    secondary: 'bg-white/10 border border-white/10',
    outline: 'border border-[#00C853] bg-transparent',
    ghost: 'bg-transparent',
    danger: 'bg-red-500 shadow-lg shadow-red-500/40',
  };

  const sizeClasses = {
    sm: 'py-2 px-4',
    md: 'py-3.5 px-6',
    lg: 'py-5 px-8',
  };

  const textBaseClasses = 'font-bold text-center';

  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-[#00C853]',
    ghost: 'text-gray-400',
    danger: 'text-white',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#00C853' : '#fff'} />
      ) : (
        <Text className={`${textBaseClasses} ${textVariantClasses[variant]} ${textSizeClasses[size]} ${textClassName}`}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
