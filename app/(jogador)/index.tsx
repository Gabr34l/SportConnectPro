import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../contexts/AuthContext';
import { useJogosDoDia } from '../../hooks/useJogosDoDia';
import { EventCard } from '../../components/EventCard';
import { FilterChips, FilterOption } from '../../components/FilterChips';
import { SPORTS, AMBIENTES, NIVEIS } from '../../constants/sports';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import { Bell, Frown, LayoutGrid, Leaf, Scaling, MapPin } from 'lucide-react-native';

export default function HomeJogador() {
  const { usuario } = useAuthContext();
  const router = useRouter();
  const { unreadCount } = useNotificacoes(usuario?.id_usuario);
  
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [esporte, setEsporte] = useState('todos');
  const [ambiente, setAmbiente] = useState('todos');
  const [nivel, setNivel] = useState('todos');

  const { jogos, loading } = useJogosDoDia(dataSelecionada, esporte, ambiente, nivel);

  const esporteOptions: FilterOption[] = [
    {label: 'Todos', value: 'todos', iconName: 'LayoutGrid'}, 
    ...SPORTS.map(s => ({label: s.label, value: s.id, iconName: s.iconName}))
  ];

  // Gerar dias para o seletor de data
  const dias = Array.from({length: 7}, (_, i) => addDays(new Date(), i));

  return (
    <View className="flex-1 bg-gray-50">
      {/* Premium Header */}
      <View className="bg-white px-6 pt-16 pb-8 rounded-b-[40px] shadow-xl shadow-black/5">
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.push('/(jogador)/perfil')}>
              <Image 
                source={{ uri: usuario?.foto_perfil || 'https://placehold.co/100x100?text=' + usuario?.nome_completo?.charAt(0) }} 
                className="w-12 h-12 rounded-2xl bg-gray-100 border-2 border-white"
              />
            </TouchableOpacity>
            <View className="ml-3">
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Bom dia,</Text>
              <Text className="text-xl font-black text-gray-800">{usuario?.nome_completo?.split(' ')[0]}!</Text>
            </View>
          </View>
          
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={() => router.push('/(jogador)/mapa')}
              className="w-12 h-12 bg-gray-50 rounded-2xl justify-center items-center"
            >
              <MapPin color="#111827" size={22} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/(jogador)/notificacoes')}
              className="w-12 h-12 bg-gray-50 rounded-2xl justify-center items-center"
            >
              <Bell color="#111827" size={22} strokeWidth={2} />
              {unreadCount > 0 && (
                <View className="absolute top-2 right-2 bg-[#E24B4A] border-2 border-white rounded-full w-4 h-4 justify-center items-center">
                  <Text className="text-white text-[8px] font-bold">{unreadCount > 9 ? '+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selector Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-2">
          {dias.map((dia) => {
            const iso = format(dia, 'yyyy-MM-dd');
            const isSelected = iso === dataSelecionada;
            return (
              <TouchableOpacity 
                key={iso}
                onPress={() => setDataSelecionada(iso)}
                className={`items-center justify-center p-3 rounded-[20px] mx-1 min-w-[60px] ${isSelected ? 'bg-[#00C853] shadow-lg shadow-green-500/30' : 'bg-gray-50'}`}
              >
                <Text className={`text-[10px] uppercase font-black tracking-tighter ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                  {format(dia, 'EEE', { locale: ptBR })}
                </Text>
                <Text className={`text-lg font-black mt-0.5 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                  {format(dia, 'dd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View className="mt-4">
        <FilterChips options={esporteOptions} selectedValue={esporte} onSelect={setEsporte} />
      </View>

      <View className="flex-1 px-6">
        <View className="flex-row justify-between items-end my-6">
          <View>
            <Text className="text-2xl font-black text-gray-800">Partidas Disponíveis</Text>
            <Text className="text-sm text-gray-400 font-medium">Encontre o racha perfeito próximo a você</Text>
          </View>
        </View>

        {loading ? (
          <View className="mt-12">
            <ActivityIndicator size="large" color="#00C853" />
          </View>
        ) : (
          <FlatList
            data={jogos}
            keyExtractor={j => j.id_evento}
            renderItem={({item}) => <EventCard evento={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View className="items-center mt-8 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm shadow-black/5">
                <View className="w-20 h-20 bg-gray-50 rounded-full justify-center items-center mb-6">
                  <Frown size={40} color="#D1D5DB" strokeWidth={1.5} />
                </View>
                <Text className="text-xl font-bold text-gray-800 text-center">Tudo calmo por aqui...</Text>
                <Text className="text-gray-400 mt-2 text-center text-base leading-6">
                  Nenhuma partida encontrada para esta data ou filtros. Que tal mudar o esporte?
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

