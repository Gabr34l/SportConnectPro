import React from 'react';
import { View, Text } from 'react-native';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Timer,
  Ban
} from 'lucide-react-native';

export type BadgeType = 
  | 'ABERTO' 
  | 'LOTADO' 
  | 'CONCLUIDO' 
  | 'CANCELADO' 
  | 'PENDENTE' 
  | 'APROVADO' 
  | 'REJEITADO'
  | 'CONFIRMADO'
  | 'AGUARDANDO_PAGAMENTO';

export function StatusBadge({ status }: { status: BadgeType | string }) {
  let config = {
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-500',
    iconColor: '#6B7280',
    icon: Clock,
    label: status
  };

  switch (status) {
    case 'ABERTO':
      config = { bgColor: 'bg-green-100', textColor: 'text-green-700', iconColor: '#15803D', icon: CheckCircle2, label: 'Aberto' };
      break;
    case 'LOTADO':
      config = { bgColor: 'bg-orange-100', textColor: 'text-orange-700', iconColor: '#C2410C', icon: Clock, label: 'Lotado' };
      break;
    case 'CONCLUIDO':
      config = { bgColor: 'bg-blue-100', textColor: 'text-blue-700', iconColor: '#1D4ED8', icon: CheckCircle2, label: 'Concluído' };
      break;
    case 'CANCELADO':
      config = { bgColor: 'bg-red-100', textColor: 'text-red-700', iconColor: '#B91C1C', icon: XCircle, label: 'Cancelado' };
      break;
    case 'PENDENTE':
    case 'AGUARDANDO_PAGAMENTO':
      config = { bgColor: 'bg-amber-100', textColor: 'text-amber-700', iconColor: '#B45309', icon: Timer, label: status === 'PENDENTE' ? 'Pendente' : 'Pagamento' };
      break;
    case 'APROVADO':
    case 'CONFIRMADO':
      config = { bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', iconColor: '#047857', icon: CheckCircle2, label: status === 'APROVADO' ? 'Aprovado' : 'Confirmado' };
      break;
    case 'REJEITADO':
      config = { bgColor: 'bg-rose-100', textColor: 'text-rose-700', iconColor: '#BE123C', icon: Ban, label: 'Rejeitado' };
      break;
  }

  const { bgColor, textColor, iconColor, icon: Icon, label } = config;

  return (
    <View className={`flex-row items-center px-2.5 py-1 rounded-full ${bgColor}`}>
      <Icon size={12} color={iconColor} strokeWidth={2.5} />
      <Text className={`ml-1 text-[10px] font-black uppercase tracking-wider ${textColor}`}>{label}</Text>
    </View>
  );
}
