import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../contexts/AuthContext';
import { useJogosDoDia } from '../../hooks/useJogosDoDia';
import { EventCard } from '../../components/EventCard';
import { FilterChips, FilterOption } from '../../components/FilterChips';
import { SPORTS, AMBIENTES, NIVEIS } from '../../constants/sports';
import { format } from 'date-fns';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import { Bell, Frown, LayoutGrid, Leaf, Scaling } from 'lucide-react-native';

export default function HomeJogador() {
  const { usuario } = useAuthContext();
  const router = useRouter();
  const { unreadCount } = useNotificacoes(usuario?.id_usuario);
  
  const hoje = format(new Date(), 'yyyy-MM-dd');
  
  const [esporte, setEsporte] = useState('todos');
  const [ambiente, setAmbiente] = useState('todos');
  const [nivel, setNivel] = useState('todos');

  const { jogos, loading } = useJogosDoDia(hoje, esporte, ambiente, nivel);

  const esporteOptions: FilterOption[] = [
    {label: 'Todos', value: 'todos', iconName: 'LayoutGrid'}, 
    ...SPORTS.map(s => ({label: s.label, value: s.id, iconName: s.iconName}))
  ];
  const ambienteOptions: FilterOption[] = [
    {label: 'Ambiente', value: 'todos', iconName: 'Leaf'}, 
    ...AMBIENTES.map(a => ({label: a, value: a, iconName: a === 'Indoor' ? 'Home' : 'Sun'}))
  ];
  const nivelOptions: FilterOption[] = [
    {label: 'Nível', value: 'todos', iconName: 'Scaling'}, 
    ...NIVEIS.map(n => ({label: n, value: n}))
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-16 pb-6 flex-row justify-between items-center shadow-sm shadow-black/5">
        <View>
          <Text className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Dashboard</Text>
          <Text className="text-2xl font-bold text-gray-800">Olá, {usuario?.nome_completo?.split(' ')[0]}!</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/(jogador)/notificacoes')}
          className="w-12 h-12 bg-gray-50 rounded-2xl justify-center items-center"
        >
          <Bell color="#111827" size={24} strokeWidth={2} />
          {unreadCount > 0 && (
            <View className="absolute top-2 right-2 bg-[#E24B4A] border-2 border-white rounded-full min-w-[18px] h-[18px] px-1 justify-center items-center">
              <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View className="bg-white border-b border-gray-100 py-4">
        <FilterChips options={esporteOptions} selectedValue={esporte} onSelect={setEsporte} />
        <FilterChips options={ambienteOptions} selectedValue={ambiente} onSelect={setAmbiente} />
        <FilterChips options={nivelOptions} selectedValue={nivel} onSelect={setNivel} />
      </View>

      <View className="flex-1 px-6">
        <View className="flex-row justify-between items-center my-6">
          <Text className="text-xl font-bold text-gray-800">Jogos de Hoje</Text>
          <Text className="text-xs text-[#00C853] font-bold uppercase tracking-wider">Ver tudo</Text>
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
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center mt-12 bg-white p-8 rounded-3xl border border-gray-100">
                <Frown size={48} color="#9CA3AF" strokeWidth={1.5} />
                <Text className="text-gray-500 mt-4 text-center text-base leading-6">
                  Nenhum jogo disponível hoje com esses filtros.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

