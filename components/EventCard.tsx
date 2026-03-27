import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { VagasBar } from './VagasBar';
import { SportBadge } from './SportBadge';
import { AmbienteBadge } from './AmbienteBadge';
import { EventoComVagas } from '../types';
import { format } from 'date-fns';
import { MapPin, Clock, CalendarDays } from 'lucide-react-native';

export function EventCard({ evento }: { evento: EventoComVagas }) {
  const router = useRouter();

  const dataFormatada = format(new Date(evento.data_evento), 'dd/MM/yyyy');
  const horaInicio = evento.horario_inicio.substring(0, 5);
  const horaFim = evento.horario_fim.substring(0, 5);

  return (
    <TouchableOpacity 
      className="bg-white rounded-3xl overflow-hidden mb-5 shadow-lg shadow-black/5"
      onPress={() => router.push(`/(jogador)/evento/${evento.id_evento}` as any)}
    >
      <Image 
        source={{ uri: evento.foto_quadra || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800' }} 
        className="w-full h-32" 
      />
      <View className="p-4">
        <View className="flex-row mb-3">
          <SportBadge esporteId={evento.esporte} />
          <AmbienteBadge tipo={evento.tipo_ambiente} />
        </View>
        
        <Text className="text-xl font-bold text-gray-800 mb-3" numberOfLines={1}>
          {evento.titulo} ({evento.formato_jogo})
        </Text>

        <View className="flex-row items-center mb-1">
          <CalendarDays size={14} color="#6B7280" />
          <Text className="ml-1.5 text-sm text-gray-500">{dataFormatada}</Text>
          <View className="mx-2 w-1 h-1 rounded-full bg-gray-300" />
          <Clock size={14} color="#6B7280" />
          <Text className="ml-1.5 text-sm text-gray-500">{horaInicio} - {horaFim}</Text>
        </View>

        <View className="flex-row items-center mb-4">
          <MapPin size={14} color="#6B7280" />
          <Text className="ml-1.5 text-sm text-gray-500" numberOfLines={1}>{evento.nome_local}</Text>
        </View>
        
        <View className="border-t border-gray-100 pt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-gray-400">Preço / vaga</Text>
            <Text className="text-lg font-bold text-[#00C853]">R$ {evento.preco_por_vaga.toFixed(2)}</Text>
          </View>
          <View className="items-end">
            <VagasBar vagas={evento.vagas_restantes} limite={evento.limite_participantes} />
            <Text className="text-[10px] text-gray-400 mt-1">{evento.vagas_restantes} vagas restantes</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

