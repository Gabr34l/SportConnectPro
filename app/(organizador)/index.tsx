import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { databases, config, Query } from '../../lib/appwrite';
import { useAuthContext } from '../../contexts/AuthContext';
import { useQuadras } from '../../hooks/useQuadras';
import { StatusBadge } from '../../components/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus, TrendingUp, Users, Sun, Moon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function Dashboard() {
  const { usuario } = useAuthContext();
  const router = useRouter();
  const { fetchQuadrasOrganizador } = useQuadras();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  
  const [stats, setStats] = useState({ total_eventos: 0, receita: 0 });
  const [eventos, setEventos] = useState<any[]>([]);
  const [temQuadraAprovada, setTemQuadraAprovada] = useState(false);
  const [temQualquerQuadra, setTemQualquerQuadra] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const quadras = await fetchQuadrasOrganizador(usuario.id_usuario);
        setTemQualquerQuadra(quadras.length > 0);
        setTemQuadraAprovada(quadras.some(q => q.status_aprovacao === 'APROVADO'));

        // Buscar Eventos
        const evDocs = await databases.listDocuments(
          config.databaseId,
          config.collections.eventos,
          [Query.equal('id_organizador', usuario.id_usuario)]
        );

        const eventosMapeados = evDocs.documents.map(d => ({
          ...d,
          id_evento: d.$id,
          data_evento: d.data_evento || new Date().toISOString()
        }));

        setEventos(eventosMapeados);
        setStats(prev => ({ ...prev, total_eventos: eventosMapeados.length }));

        let rec = 0;
        if (eventosMapeados.length > 0) {
          // Buscar Participações para calcular receita
          const partDocs = await databases.listDocuments(
            config.databaseId,
            config.collections.participacoes,
            [
              Query.equal('status_presenca', 'CONFIRMADO'),
              Query.equal('id_evento', eventosMapeados.map(e => e.$id))
            ]
          );

          // Se houver pagamentos vinculados (usando o Relationship do Appwrite), eles vêm no doc
          partDocs.documents.forEach((p: any) => {
            if (p.pagamentos && p.pagamentos.length > 0) {
               const pg = p.pagamentos[0]; // assume o primeiro se for 1-1
               if (pg.status === 'APROVADO') {
                 rec += pg.valor_pago || 0;
               }
            }
          });
        }
        setStats(prev => ({ ...prev, receita: rec }));

      } catch (e) {
        console.error('Erro no Dashboard:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [usuario]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Premium Header */}
        <View className="bg-white dark:bg-gray-900 px-6 pt-16 pb-8 rounded-b-[40px] shadow-xl shadow-black/5 relative">
          
          <TouchableOpacity 
            onPress={toggleColorScheme}
            className="absolute top-12 right-2 w-20 h-20 justify-center items-center z-[100]"
          >
            <View className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-full justify-center items-center shadow-sm">
              {colorScheme === 'dark' ? <Sun color="#FBBF24" size={26} /> : <Moon color="#4B5563" size={26} />}
            </View>
          </TouchableOpacity>

          <Text className="text-gray-400 text-xs font-bold uppercase tracking-[3px] mb-1">Painel de Controle</Text>
          <Text className="text-3xl font-black text-gray-800 dark:text-white mt-1 pr-16">
            {new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, {usuario?.nome_completo?.split(' ')[0]}!
          </Text>
          <Text className="text-sm text-gray-400 mt-2 font-medium pr-16">Gerencie suas quadras e eventos</Text>
        </View>

        {!loading && !temQualquerQuadra && (
          <TouchableOpacity 
            className="bg-white dark:bg-gray-900 p-8 m-6 rounded-[40px] border-2 border-dashed border-[#00C853]/20 dark:border-gray-800 items-center shadow-sm shadow-black/5"
            onPress={() => router.push('/(organizador)/cadastrar-quadra')}
          >
            <View className="w-20 h-20 bg-[#00C853] rounded-[30px] justify-center items-center mb-6 shadow-xl shadow-green-500/30">
              <Plus color="white" size={40} strokeWidth={2.5} />
            </View>
            <Text className="text-2xl font-black text-gray-800 dark:text-white text-center">Cadastre sua Quadra</Text>
            <Text className="text-base text-gray-400 dark:text-gray-500 text-center mt-3 px-4 leading-6">
              Sua jornada começa aqui. Adicione os detalhes do seu local para começar a lucrar com eventos.
            </Text>
          </TouchableOpacity>
        )}

        {!loading && temQualquerQuadra && !temQuadraAprovada && (
          <View className="bg-orange-50 dark:bg-orange-950/30 p-6 m-6 rounded-[32px] border border-orange-100 dark:border-orange-900/50 flex-row items-center">
            <View className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl justify-center items-center mr-4">
              <ActivityIndicator size="small" color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-orange-800 dark:text-orange-400 font-bold text-base">Quadra em Análise</Text>
              <Text className="text-orange-600 dark:text-orange-500 text-xs mt-0.5">Estamos validando seus dados. Aguarde a aprovação.</Text>
            </View>
          </View>
        )}

        <View className="flex-row p-6 gap-4">
          <View className="flex-1 bg-gray-900 dark:bg-gray-800 p-6 rounded-[32px] shadow-xl shadow-black/20">
            <View className="w-10 h-10 bg-white dark:bg-gray-900/10 rounded-2xl justify-center items-center mb-4">
              <Users size={20} color="white" />
            </View>
            <Text className="text-xs text-white/50 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Eventos</Text>
            <Text className="text-3xl font-black text-white">{stats.total_eventos}</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-gray-900 p-6 rounded-[32px] shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-800">
            <View className="w-10 h-10 bg-[#00C853]/10 rounded-2xl justify-center items-center mb-4">
              <TrendingUp size={20} color="#00C853" />
            </View>
            <Text className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">Receita</Text>
            <Text className="text-3xl font-black text-gray-800 dark:text-white">
              <Text className="text-[14px] text-gray-400 dark:text-gray-500">R$</Text>{stats.receita.toFixed(0)}
            </Text>
          </View>
        </View>

        <View className="px-6 pb-20">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-black text-gray-800 dark:text-white">Próximos Eventos</Text>
            <TouchableOpacity onPress={() => router.push('/(organizador)/criar-evento')}>
               <Text className="text-xs text-[#00C853] font-bold uppercase tracking-wider">Criar</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View className="mt-12">
              <ActivityIndicator size="large" color="#00C853" />
            </View>
          ) : (
            <View>
              {eventos.length === 0 ? (
                <View className="items-center mt-4">
                  <Text className="text-gray-400 dark:text-gray-600 text-center font-bold italic">Nenhum evento ativo.</Text>
                </View>
              ) : (
                eventos.map((item) => (
                  <TouchableOpacity 
                    key={item.id_evento}
                    className="bg-white dark:bg-gray-900 p-5 rounded-[28px] mb-4 border border-gray-100 dark:border-gray-800 shadow-sm shadow-black/5 flex-row items-center"
                    onPress={() => router.push(`/(organizador)/evento/${item.id_evento}` as any)}
                  >
                    <View className="w-12 h-12 bg-gray-50 dark:bg-gray-950 dark:bg-gray-800 rounded-2xl justify-center items-center mr-4">
                       <Calendar size={20} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-black text-gray-800 dark:text-white mb-0.5" numberOfLines={1}>{item.titulo}</Text>
                      <Text className="text-sm text-gray-400 font-medium">
                        {format(new Date(item.data_evento), 'dd MMM', { locale: ptBR })} • {item.horario_inicio.substring(0,5)}
                      </Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
