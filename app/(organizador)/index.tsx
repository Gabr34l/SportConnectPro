import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { databases, config, Query } from '../../lib/appwrite';
import { useAuthContext } from '../../contexts/AuthContext';
import { useQuadras } from '../../hooks/useQuadras';
import { StatusBadge } from '../../components/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus, TrendingUp, Users } from 'lucide-react-native';

export default function Dashboard() {
  const { usuario } = useAuthContext();
  const router = useRouter();
  const { fetchQuadrasOrganizador } = useQuadras();
  
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
    <View className="flex-1 bg-gray-50">
      {/* Premium Header */}
      <View className="bg-white px-6 pt-16 pb-8 rounded-b-[40px] shadow-xl shadow-black/5">
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-[3px] mb-1">Painel de Controle</Text>
        <Text className="text-3xl font-black text-gray-800">Olá, {usuario?.nome_completo?.split(' ')[0]}!</Text>
        <Text className="text-sm text-gray-400 mt-1 font-medium">Gerencie suas quadras e eventos</Text>
      </View>

      {!loading && !temQualquerQuadra && (
        <TouchableOpacity 
          className="bg-white p-8 m-6 rounded-[40px] border-2 border-dashed border-[#00C853]/20 items-center shadow-sm shadow-black/5"
          onPress={() => router.push('/(organizador)/cadastrar-quadra')}
        >
          <View className="w-20 h-20 bg-[#00C853] rounded-[30px] justify-center items-center mb-6 shadow-xl shadow-green-500/30">
            <Plus color="white" size={40} strokeWidth={2.5} />
          </View>
          <Text className="text-2xl font-black text-gray-800 text-center">Cadastre sua Quadra</Text>
          <Text className="text-base text-gray-400 text-center mt-3 px-4 leading-6">
            Sua jornada começa aqui. Adicione os detalhes do seu local para começar a lucrar com eventos.
          </Text>
        </TouchableOpacity>
      )}

      {!loading && temQualquerQuadra && !temQuadraAprovada && (
        <View className="bg-orange-50 p-6 m-6 rounded-[32px] border border-orange-100 flex-row items-center">
          <View className="w-12 h-12 bg-white rounded-2xl justify-center items-center mr-4">
            <ActivityIndicator size="small" color="#F59E0B" />
          </View>
          <View className="flex-1">
            <Text className="text-orange-800 font-bold text-base">Quadra em Análise</Text>
            <Text className="text-orange-600 text-xs mt-0.5">Estamos validando seus dados. Aguarde a aprovação.</Text>
          </View>
        </View>
      )}

      <View className="flex-row p-6 gap-4">
        <View className="flex-1 bg-gray-900 p-6 rounded-[32px] shadow-xl shadow-black/20">
          <View className="w-10 h-10 bg-white/10 rounded-2xl justify-center items-center mb-4">
            <Users size={20} color="white" />
          </View>
          <Text className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">Eventos</Text>
          <Text className="text-3xl font-black text-white">{stats.total_eventos}</Text>
        </View>
        <View className="flex-1 bg-white p-6 rounded-[32px] shadow-lg shadow-black/5 border border-gray-100">
          <View className="w-10 h-10 bg-[#00C853]/10 rounded-2xl justify-center items-center mb-4">
            <TrendingUp size={20} color="#00C853" />
          </View>
          <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Receita</Text>
          <Text className="text-3xl font-black text-gray-800">
            <Text className="text-[14px] text-gray-400">R$</Text>{stats.receita.toFixed(0)}
          </Text>
        </View>
      </View>

      <View className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-black text-gray-800">Próximos Eventos</Text>
          <TouchableOpacity onPress={() => router.push('/(organizador)/criar-evento')}>
             <Text className="text-xs text-[#00C853] font-bold uppercase tracking-wider">Ver todos</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View className="mt-12">
            <ActivityIndicator size="large" color="#00C853" />
          </View>
        ) : (
          <FlatList
            data={eventos}
            keyExtractor={e => e.id_evento}
            renderItem={({item}) => (
              <TouchableOpacity 
                className="bg-white p-5 rounded-[28px] mb-4 border border-gray-100 shadow-sm shadow-black/5 flex-row items-center"
                onPress={() => router.push(`/(organizador)/evento/${item.id_evento}` as any)}
              >
                <View className="w-12 h-12 bg-gray-50 rounded-2xl justify-center items-center mr-4">
                   <Calendar size={20} color="#9CA3AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-black text-gray-800 mb-0.5" numberOfLines={1}>{item.titulo}</Text>
                  <Text className="text-sm text-gray-400 font-medium">
                    {format(new Date(item.data_evento), 'dd MMM', { locale: ptBR })} • {item.horario_inicio.substring(0,5)}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center mt-4">
                <Text className="text-gray-300 text-center font-bold italic">Nenhum evento ativo.</Text>
              </View>
            }
          />
        )}
      </View>

      <TouchableOpacity 
        className={`absolute bottom-8 right-8 w-16 h-16 rounded-[24px] justify-center items-center shadow-2xl ${
          (!temQuadraAprovada || loading) ? 'bg-gray-300' : 'bg-[#00C853] shadow-green-500/40'
        }`}
        disabled={!temQuadraAprovada || loading}
        onPress={() => router.push('/(organizador)/criar-evento')}
      >
        <Plus color="white" size={32} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}
