import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { databases, config, Query } from '../../lib/appwrite';
import { useAuthContext } from '../../contexts/AuthContext';
import { useQuadras } from '../../hooks/useQuadras';
import { StatusBadge } from '../../components/StatusBadge';
import { format } from 'date-fns';
import { Calendar, Plus, TrendingUp, Users } from 'lucide-react-native';

export default function Dashboard() {
  const { usuario } = useAuthContext();
  const router = useRouter();
  const { fetchQuadrasOrganizador } = useQuadras();
  
  const [stats, setStats] = useState({ total_eventos: 0, receita: 0 });
  const [eventos, setEventos] = useState<any[]>([]);
  const [temQuadraAprovada, setTemQuadraAprovada] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const quadras = await fetchQuadrasOrganizador(usuario.id_usuario);
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

        // Buscar Participações para calcular receita
        // No Appwrite, para pegar a receita, buscamos os pagamentos aprovados vinculados aos eventos deste organizador
        const partDocs = await databases.listDocuments(
          config.databaseId,
          config.collections.participacoes,
          [
            Query.equal('status_presenca', 'CONFIRMADO'),
            // Como no Appwrite não temos Joins complexos via SDK facilmente,
            // podemos filtrar participações que pertençam aos IDs dos eventos buscados
            Query.equal('id_evento', eventosMapeados.map(e => e.$id))
          ]
        );

        let rec = 0;
        // Se houver pagamentos vinculados (usando o Relationship do Appwrite), eles vêm no doc
        partDocs.documents.forEach((p: any) => {
          if (p.pagamentos && p.pagamentos.length > 0) {
             const pg = p.pagamentos[0]; // assume o primeiro se for 1-1
             if (pg.status === 'APROVADO') {
               rec += pg.valor_pago || 0;
             }
          }
        });
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
      <View className="bg-white px-6 pt-16 pb-6 border-b border-gray-100 shadow-sm shadow-black/5">
        <Text className="text-2xl font-bold text-gray-800">Dashboard</Text>
        <Text className="text-base text-gray-400 mt-1">{usuario?.nome_completo}</Text>
      </View>

      {!temQuadraAprovada && !loading && (
        <View className="bg-orange-50 p-4 m-6 rounded-2xl border border-orange-100">
          <Text className="text-orange-700 font-bold text-center">
            Nenhuma quadra aprovada. Você não pode criar eventos ainda.
          </Text>
        </View>
      )}

      <View className="flex-row p-6 gap-4">
        <View className="flex-1 bg-white p-6 rounded-3xl shadow-lg shadow-black/5 border border-gray-50">
          <View className="w-10 h-10 bg-blue-50 rounded-full justify-center items-center mb-4">
            <Users size={20} color="#3B82F6" />
          </View>
          <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Eventos</Text>
          <Text className="text-2xl font-bold text-gray-800">{stats.total_eventos}</Text>
        </View>
        <View className="flex-1 bg-white p-6 rounded-3xl shadow-lg shadow-black/5 border border-gray-50">
          <View className="w-10 h-10 bg-green-50 rounded-full justify-center items-center mb-4">
            <TrendingUp size={20} color="#10B981" />
          </View>
          <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Receita</Text>
          <Text className="text-2xl font-bold text-green-600">
            R$ {stats.receita.toFixed(0)}
          </Text>
        </View>
      </View>

      <View className="flex-1 px-6">
        <Text className="text-xl font-bold text-gray-800 mb-4">Próximos Eventos</Text>
        
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
                className="bg-white p-5 rounded-3xl mb-4 border border-gray-100 shadow-sm shadow-black/5"
                onPress={() => router.push(`/(organizador)/evento/${item.id_evento}` as any)}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-lg font-bold text-gray-800 flex-1 mr-2" numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>
                <View className="flex-row items-center">
                  <Calendar size={14} color="#9CA3AF" />
                  <Text className="ml-1.5 text-sm text-gray-400 font-medium">
                    {format(new Date(item.data_evento), 'dd/MM/yyyy')} • {item.horario_inicio.substring(0,5)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center mt-8">
                <Text className="text-gray-400 text-center italic">Você ainda não criou eventos.</Text>
              </View>
            }
          />
        )}
      </View>

      <TouchableOpacity 
        className={`absolute bottom-8 right-8 w-16 h-16 rounded-full justify-center items-center shadow-xl ${
          (!temQuadraAprovada || loading) ? 'bg-gray-300' : 'bg-[#00C853] shadow-green-500/40'
        }`}
        disabled={!temQuadraAprovada || loading}
        onPress={() => router.push('/(organizador)/criar-evento')}
      >
        <Plus color="white" size={32} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}
