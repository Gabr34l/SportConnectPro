import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { databases, config, Query } from '@/lib/appwrite';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  ChevronLeft, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Faturamento() {
  const { usuario } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pendente: 0,
    confirmado: 0,
    cancelado: 0
  });
  const [transacoes, setTransacoes] = useState<any[]>([]);

  const fetchData = async () => {
    if (!usuario) return;
    
    try {
      // 1. Buscar todos os eventos do organizador
      const eventosDocs = await databases.listDocuments(
        config.databaseId,
        config.collections.eventos,
        [Query.equal('id_organizador', usuario.id_usuario)]
      );

      const idsEventos = eventosDocs.documents.map(d => d.$id);

      if (idsEventos.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 2. Buscar pagamentos vinculados a esses eventos
      // Nota: Dependendo de como o relacionamento está mapeado, 
      // podemos buscar na coleção de pagamentos diretamente se tiver id_evento
      const pagamentosDocs = await databases.listDocuments(
        config.databaseId,
        config.collections.pagamentos,
        [
          Query.equal('id_evento', idsEventos),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );

      const pgs = pagamentosDocs.documents;
      
      let total = 0;
      let pendente = 0;
      let confirmado = 0;
      let cancelado = 0;

      pgs.forEach((p: any) => {
        const valor = p.valor_pago || 0;
        if (p.status === 'APROVADO') {
          confirmado += valor;
          total += valor;
        } else if (p.status === 'PENDENTE') {
          pendente += valor;
        } else if (p.status === 'CANCELADO' || p.status === 'FALHOU') {
          cancelado += valor;
        }
      });

      setStats({ total, pendente, confirmado, cancelado });
      setTransacoes(pgs);

    } catch (error) {
      console.error('Erro ao buscar faturamento:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [usuario]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'APROVADO': return <CheckCircle2 size={16} color="#00C853" />;
      case 'PENDENTE': return <Clock size={16} color="#F59E0B" />;
      default: return <XCircle size={16} color="#EF4444" />;
    }
  };

  const renderTransacao = ({ item }: { item: any }) => (
    <View className="bg-white dark:bg-gray-900 p-4 rounded-[24px] mb-3 border border-gray-100 dark:border-gray-800 flex-row items-center">
      <View className={`w-12 h-12 rounded-2xl justify-center items-center mr-4 ${
        item.status === 'APROVADO' ? 'bg-green-50 dark:bg-green-950/30' : 
        item.status === 'PENDENTE' ? 'bg-amber-50 dark:bg-amber-950/30' : 
        'bg-red-50 dark:bg-red-950/30'
      }`}>
        {item.status === 'APROVADO' ? (
          <ArrowUpRight size={20} color="#00C853" />
        ) : (
          <Clock size={20} color="#F59E0B" />
        )}
      </View>
      
      <View className="flex-1">
        <Text className="text-gray-800 dark:text-white font-bold text-base" numberOfLines={1}>
          {item.metodo_pagamento?.toUpperCase() || 'PAGAMENTO'}
        </Text>
        <Text className="text-gray-400 text-xs font-medium">
          {format(new Date(item.$createdAt), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
        </Text>
      </View>

      <View className="items-end">
        <Text className={`text-lg font-black ${
          item.status === 'APROVADO' ? 'text-[#00C853]' : 'text-gray-400'
        }`}>
          R$ {item.valor_pago?.toFixed(2)}
        </Text>
        <View className="flex-row items-center mt-1">
          <StatusIcon status={item.status} />
          <Text className={`text-[10px] font-bold uppercase ml-1 ${
            item.status === 'APROVADO' ? 'text-[#00C853]' : 
            item.status === 'PENDENTE' ? 'text-[#F59E0B]' : 'text-[#EF4444]'
          }`}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-6 pt-16 pb-8 rounded-b-[40px] shadow-xl shadow-black/5">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full justify-center items-center"
          >
            <ChevronLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-lg font-black text-gray-800 dark:text-white">Financeiro</Text>
          <TouchableOpacity className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full justify-center items-center">
            <Filter size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-[2px] mb-1">Saldo Total Aprovado</Text>
          <Text className="text-4xl font-black text-gray-800 dark:text-white">
            <Text className="text-xl text-gray-400">R$</Text> {stats.total.toFixed(2)}
          </Text>
          
          <View className="flex-row mt-6 gap-4 w-full">
            <View className="flex-1 bg-[#00C853]/10 p-4 rounded-[24px] items-center border border-[#00C853]/20">
              <TrendingUp size={18} color="#00C853" />
              <Text className="text-[10px] font-bold text-[#00C853] uppercase mt-2">Confirmado</Text>
              <Text className="text-base font-black text-[#00C853]">R$ {stats.confirmado.toFixed(2)}</Text>
            </View>
            <View className="flex-1 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-[24px] items-center border border-amber-100 dark:border-amber-900/30">
              <Clock size={18} color="#F59E0B" />
              <Text className="text-[10px] font-bold text-[#F59E0B] uppercase mt-2">Pendente</Text>
              <Text className="text-base font-black text-[#F59E0B]">R$ {stats.pendente.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={transacoes}
        keyExtractor={(item) => item.$id}
        renderItem={renderTransacao}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00C853']} />
        }
        ListHeaderComponent={() => (
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-black text-gray-800 dark:text-white">Transações Recentes</Text>
            <Text className="text-xs text-gray-400 font-bold uppercase">{transacoes.length} total</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          loading ? (
            <ActivityIndicator size="large" color="#00C853" className="mt-10" />
          ) : (
            <View className="items-center mt-10">
              <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full justify-center items-center mb-4">
                <Wallet size={40} color="#D1D5DB" />
              </View>
              <Text className="text-gray-400 text-center font-bold">Nenhuma transação encontrada.</Text>
              <Text className="text-gray-400 text-center text-xs mt-1">Seus ganhos aparecerão aqui assim que os jogadores pagarem.</Text>
            </View>
          )
        )}
      />
    </View>
  );
}
