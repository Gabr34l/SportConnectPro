import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases, config, Query } from '../../../lib/appwrite';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/Toast';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, TrendingUp, CheckCircle, XCircle, UserMinus, ChevronLeft, LayoutDashboard, Clock } from 'lucide-react-native';

export default function GestaoEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  
  const [evento, setEvento] = useState<any>(null);
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState<{ visible: boolean, nextStatus: string }>({ visible: false, nextStatus: '' });

  const fetchDados = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Buscar Evento (Com dados da Quadra via Two-way mapping)
      const evDoc = await databases.getDocument(
        config.databaseId,
        config.collections.eventos,
        id
      );
      
      setEvento({
        ...evDoc,
        id_evento: evDoc.$id,
        data_evento: evDoc.data_evento || new Date().toISOString()
      });

      // 2. Buscar Participantes detalhadamente
      const partDocs = await databases.listDocuments(
        config.databaseId,
        config.collections.participacoes,
        [Query.equal('id_evento', id)]
      );

      const participantesMapeados = partDocs.documents.map(p => ({
        ...p,
        id_participacao: p.$id,
        usuarios: p.id_jogador ? {
          nome_completo: p.id_jogador.nome_completo,
          foto_perfil: p.id_jogador.foto_perfil
        } : null,
        pagamentos: p.pagamentos && p.pagamentos.length > 0 ? p.pagamentos[0] : null
      }));
      
      setParticipantes(participantesMapeados);
    } catch (e) {
      console.error('Erro ao buscar gestão do evento:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [id]);

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (Platform.OS === 'web') {
      toast.show({ type, title, message });
    } else {
      const { Alert } = require('react-native');
      Alert.alert(title, message);
    }
  };

  const handleMudarStatus = async (novoStatus: string) => {
    if (Platform.OS === 'web') {
      setShowStatusModal({ visible: true, nextStatus: novoStatus });
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Confirmação', `Tem certeza que deseja mudar o status para ${novoStatus}?`, [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', onPress: async () => {
          setLoading(true);
          try {
            await databases.updateDocument(
              config.databaseId,
              config.collections.eventos,
              id,
              { status: novoStatus }
            );
            fetchDados();
          } catch (e) {
            showFeedback('error', 'Erro', 'Não foi possível atualizar o status.');
          } finally {
            setLoading(false);
          }
        }}
      ]);
    }
  };

  const confirmStatusChange = async () => {
    const status = showStatusModal.nextStatus;
    setShowStatusModal({ visible: false, nextStatus: '' });
    setLoading(true);
    try {
      await databases.updateDocument(
        config.databaseId,
        config.collections.eventos,
        id,
        { status }
      );
      showFeedback('success', 'Sucesso', `Evento atualizado para ${status}.`);
      fetchDados();
    } catch (e) {
      showFeedback('error', 'Erro', 'Não foi possível atualizar o status.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverParticipante = async (idParticipacao: string) => {
    const startRemoval = async () => {
      setLoading(true);
      try {
        await databases.updateDocument(
          config.databaseId,
          config.collections.participacoes,
          idParticipacao,
          { status_presenca: 'CANCELADO' }
        );
        showFeedback('success', 'Sucesso', 'Participante removido.');
        fetchDados();
      } catch (e) {
        showFeedback('error', 'Erro', 'Não foi possível remover o participante.');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Deseja remover este jogador e cancelar sua vaga?')) {
        startRemoval();
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Remover Jogador', 'Deseja remover este jogador e cancelar sua vaga?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: startRemoval }
      ]);
    }
  };

  if (loading && !evento) return <View className="flex-1 justify-center items-center bg-gray-50"><ActivityIndicator size="large" color="#00C853" /></View>;
  if (!evento) return <View className="flex-1 justify-center items-center bg-gray-50"><Text className="text-gray-500 font-bold">Evento não encontrado.</Text></View>;

  const confirmados = participantes.filter(p => p.status_presenca === 'CONFIRMADO');
  const aguardando = participantes.filter(p => p.status_presenca === 'AGUARDANDO_PAGAMENTO');
  
  const receita = confirmados.reduce((acc, curr) => acc + (curr.pagamentos?.valor_pago || 0), 0);

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View className="bg-white px-6 pt-16 pb-6 flex-row justify-between items-center border-b border-gray-100 shadow-sm shadow-black/5">
        <View className="flex-1 mr-4">
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-2">
            <ChevronLeft size={16} color="#9CA3AF" />
            <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest ml-1">Voltar</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800" numberOfLines={1}>{evento.titulo}</Text>
        </View>
        <StatusBadge status={evento.status} />
      </View>

      {/* Summary Card */}
      <View className="m-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-black/5">
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-green-50 rounded-full justify-center items-center">
            <Calendar size={20} color="#00C853" />
          </View>
          <View className="ml-4">
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">DATA & HORÁRIO</Text>
            <Text className="text-base font-bold text-gray-800">
              {format(new Date(evento.data_evento), 'dd/MM/yyyy')} • {evento.horario_inicio.substring(0,5)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-blue-50 rounded-full justify-center items-center">
            <MapPin size={20} color="#3B82F6" />
          </View>
          <View className="ml-4">
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">LOCAL</Text>
            <Text className="text-base font-bold text-gray-800">{evento.id_quadra?.nome_local || 'Local não informado'}</Text>
          </View>
        </View>

        <View className="flex-row gap-4 mt-2">
          <View className="flex-1 bg-gray-50 p-4 rounded-2xl">
            <View className="flex-row items-center mb-1">
              <TrendingUp size={14} color="#10B981" />
              <Text className="text-[10px] text-gray-400 font-bold ml-1">RECEITA</Text>
            </View>
            <Text className="text-lg font-black text-green-600">R$ {receita.toFixed(2)}</Text>
          </View>
          <View className="flex-1 bg-gray-50 p-4 rounded-2xl">
            <View className="flex-row items-center mb-1">
              <Users size={14} color="#6366F1" />
              <Text className="text-[10px] text-gray-400 font-bold ml-1">VAGAS</Text>
            </View>
            <Text className="text-lg font-black text-indigo-600">
              {confirmados.length}/{evento.limite_participantes}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      {evento.status !== 'CONCLUIDO' && evento.status !== 'CANCELADO' && (
        <View className="flex-row px-6 gap-3 mb-8">
          <TouchableOpacity 
            className="flex-1 bg-green-500 py-4 rounded-2xl flex-row justify-center items-center shadow-md shadow-green-500/30"
            onPress={() => handleMudarStatus('CONCLUIDO')}
          >
            <CheckCircle size={18} color="white" strokeWidth={2.5} />
            <Text className="text-white font-bold ml-2">Concluir</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-white border border-red-100 py-4 rounded-2xl flex-row justify-center items-center"
            onPress={() => handleMudarStatus('CANCELADO')}
          >
            <XCircle size={18} color="#EF4444" />
            <Text className="text-red-500 font-bold ml-2">Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Players List */}
      <View className="px-6">
        <Text className="text-lg font-bold text-gray-800 mb-4">Jogadores Confirmados</Text>
        
        {confirmados.length === 0 ? (
          <View className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 items-center">
            <Users size={32} color="#D1D5DB" strokeWidth={1.5} />
            <Text className="text-gray-400 mt-2 italic text-sm text-center">Nenhum jogador confirmado ainda.</Text>
          </View>
        ) : (
          confirmados.map(p => (
            <View key={p.id_participacao} className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm shadow-black/5">
              <Image source={{ uri: p.usuarios?.foto_perfil || 'https://placehold.co/100x100?text=' + p.usuarios?.nome_completo?.charAt(0) }} className="w-12 h-12 rounded-full bg-gray-100" />
              <View className="flex-1 ml-3">
                <Text className="text-base font-bold text-gray-800 font-bold">{p.usuarios?.nome_completo}</Text>
                <Text className="text-xs text-green-600 font-bold">Pago: R$ {(p.pagamentos?.valor_pago || 0).toFixed(2)}</Text>
              </View>
              <TouchableOpacity 
                className="w-10 h-10 bg-red-50 rounded-full justify-center items-center"
                onPress={() => handleRemoverParticipante(p.id_participacao)}
              >
                <UserMinus size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {aguardando.length > 0 && (
          <>
            <Text className="text-lg font-bold text-gray-800 mt-8 mb-4">Aguardando Pagamento</Text>
            {aguardando.map(p => (
              <View key={p.id_participacao} className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-gray-100 opacity-60">
                <Image source={{ uri: p.usuarios?.foto_perfil || 'https://placehold.co/100x100?text=' + p.usuarios?.nome_completo?.charAt(0) }} className="w-12 h-12 rounded-full bg-gray-100" />
                <View className="flex-1 ml-3">
                  <Text className="text-base font-bold text-gray-800">{p.usuarios?.nome_completo}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <Clock size={10} color="#9CA3AF" />
                    <Text className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Processando...</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Confirmation Modal for Web */}
      <Modal visible={showStatusModal.visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">Confirmar Alteração</Text>
            <Text className="text-base text-gray-400 text-center mb-6">
              Deseja realmente mudar o status para <Text className="text-gray-800 font-bold italic">{showStatusModal.nextStatus}</Text>?
            </Text>
            <TouchableOpacity 
              className="bg-[#00C853] rounded-2xl py-4 items-center mb-3 shadow-lg shadow-green-500/30"
              onPress={confirmStatusChange}
            >
              <Text className="text-white font-bold text-base">Sim, confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="border border-gray-200 rounded-2xl py-4 items-center"
              onPress={() => setShowStatusModal({ visible: false, nextStatus: '' })}
            >
              <Text className="text-gray-500 font-bold text-base">Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
