import React from 'react';
import { View, Text, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { VagasBar } from './VagasBar';
import { SportBadge } from './SportBadge';
import { EventoComVagas } from '../types';
import { format } from 'date-fns';
import { MapPin, Clock, CalendarDays, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function EventCard({ evento }: { evento: EventoComVagas }) {
  const router = useRouter();

  const dataFormatada = format(new Date(evento.data_evento), 'dd/MM/yyyy');
  const horaInicio = evento.horario_inicio.substring(0, 5);

  return (
    <TouchableOpacity 
      className="bg-white rounded-[32px] overflow-hidden mb-6 shadow-xl shadow-black/5 border border-gray-50"
      activeOpacity={0.9}
      onPress={() => router.push(`/(jogador)/evento/${evento.id_evento}` as any)}
    >
      <ImageBackground 
        source={{ uri: evento.foto_quadra || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800' }} 
        className="w-full h-48"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          className="flex-1 justify-end p-5"
        >
          <View className="flex-row justify-between items-end">
             <View>
               <SportBadge esporteId={evento.esporte} />
               <Text className="text-white text-xl font-black mt-1 uppercase tracking-tighter" numberOfLines={1}>
                 {evento.titulo}
               </Text>
             </View>
             <View className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/30">
               <Text className="text-white text-[10px] font-black uppercase">{evento.formato_jogo}</Text>
             </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View className="p-5">
        <View className="flex-row items-center mb-4">
          <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-xl mr-3">
            <Clock size={14} color="#00C853" strokeWidth={2.5} />
            <Text className="ml-1.5 text-xs font-bold text-gray-700">{horaInicio}</Text>
          </View>
          <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-xl flex-1">
            <MapPin size={14} color="#6B7280" />
            <Text className="ml-1.5 text-xs font-bold text-gray-500" numberOfLines={1}>{evento.nome_local}</Text>
          </View>
        </View>
        
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Investimento</Text>
            <Text className="text-2xl font-black text-[#00C853]">R$ {evento.preco_por_vaga.toFixed(0)}</Text>
          </View>
          
          <View className="items-end">
            <VagasBar vagas={evento.vagas_restantes} limite={evento.limite_participantes} />
            <Text className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-tighter">
              {evento.vagas_restantes} VAGAS DISPONÍVEIS
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          className="mt-5 bg-gray-900 py-4 rounded-2xl flex-row justify-center items-center"
          onPress={() => router.push(`/(jogador)/evento/${evento.id_evento}` as any)}
        >
          <Text className="text-white font-black text-sm uppercase tracking-widest">Garantir Minha Vaga</Text>
          <ChevronRight size={16} color="white" className="ml-2" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

