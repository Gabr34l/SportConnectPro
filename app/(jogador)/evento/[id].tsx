import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput, Modal, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useEventoDetalhe } from '../../../hooks/useEventoDetalhe';
import { useParticipacao } from '../../../hooks/useParticipacao';
import { SportBadge } from '../../../components/SportBadge';
import { AmbienteBadge } from '../../../components/AmbienteBadge';
import { PlayerSlots } from '../../../components/PlayerSlots';
import { RatingStars } from '../../../components/RatingStars';
import { useToast } from '../../../components/Toast';
import { format } from 'date-fns';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Timer, 
  Star, 
  CheckCircle2, 
  MessageCircle, 
  CreditCard, 
  Lock,
  ChevronLeft,
  Users,
  Info,
  ChevronRight
} from 'lucide-react-native';

export default function EventoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuthContext();
  const router = useRouter();
  const toast = useToast();
  
  const { evento, participantes, minhaParticipacao, mediaAvaliacoes, loading, refetch } = useEventoDetalhe(id, usuario?.id_usuario);
  const { iniciarCheckout, avaliarEvento, loading: partLoading } = useParticipacao();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');

  const confirmados = participantes.filter(p => p.status_presenca === 'CONFIRMADO');

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (Platform.OS === 'web') {
      toast.show({ type, title, message });
    } else {
      const { Alert } = require('react-native');
      Alert.alert(title, message);
    }
  };

  const handlePagar = async () => {
    if (!usuario || !evento) return;
    const url = await iniciarCheckout(evento.id_evento, usuario.id_usuario);
    if (url) {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
        showFeedback('info', 'Pagamento', 'Finalize o pagamento na nova aba para confirmar sua vaga.');
      } else {
        const result = await WebBrowser.openBrowserAsync(url);
        if (result.type === 'cancel' || result.type === 'dismiss') {
          refetch();
        }
      }
    }
  };

  const handleAvaliar = async () => {
    if (!usuario || !evento) return;
    const sucesso = await avaliarEvento(evento.id_evento, usuario.id_usuario, nota, comentario);
    if (sucesso) {
      showFeedback('success', 'Sucesso', 'Avaliação enviada!');
      setModalVisible(false);
      refetch();
    }
  };

  if (loading || !evento) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  const dataFormatada = format(new Date(evento.data_evento), 'dd/MM/yyyy');
  const horaInicio = evento.horario_inicio.substring(0, 5);
  const horaFim = evento.horario_fim.substring(0, 5);
  
  const isPassado = new Date(evento.data_evento) < new Date();
  
  let BottomButton = null;
  
  if (minhaParticipacao) {
    if (minhaParticipacao.status_presenca === 'AGUARDANDO_PAGAMENTO') {
      BottomButton = (
        <View className="bg-orange-400 py-4 rounded-3xl flex-row justify-center items-center">
          <Timer color="white" size={20} />
          <Text className="text-white font-bold text-lg ml-2">Aguardando Pagamento</Text>
        </View>
      );
    } else if (minhaParticipacao.status_presenca === 'CONFIRMADO') {
      if (evento.status === 'CONCLUIDO' && isPassado) {
        BottomButton = (
          <TouchableOpacity className="bg-orange-500 py-4 rounded-3xl flex-row justify-center items-center" onPress={() => setModalVisible(true)}>
            <Star color="white" size={20} fill="white" />
            <Text className="text-white font-bold text-lg ml-2">Avaliar Evento</Text>
          </TouchableOpacity>
        );
      } else {
        BottomButton = (
          <View className="flex-row gap-4">
            <View className="flex-1 bg-white border-2 border-[#00C853] py-4 rounded-3xl flex-row justify-center items-center">
              <CheckCircle2 color="#00C853" size={20} strokeWidth={2.5} />
              <Text className="text-[#00C853] font-bold text-lg ml-2">Confirmado</Text>
            </View>
            <TouchableOpacity className="flex-1 bg-[#111827] py-4 rounded-3xl flex-row justify-center items-center shadow-lg shadow-black/20" onPress={() => router.push(`/(jogador)/chat/${evento.id_evento}` as any)}>
              <MessageCircle color="white" size={20} />
              <Text className="text-white font-bold text-lg ml-2">Chat</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }
  } else {
    if (evento.status === 'ABERTO') {
      BottomButton = (
        <TouchableOpacity 
          className="bg-[#00C853] py-4 rounded-3xl flex-row justify-center items-center shadow-lg shadow-green-500/30" 
          onPress={handlePagar} 
          disabled={partLoading}
        >
          {partLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CreditCard color="white" size={20} />
              <Text className="text-white font-bold text-lg ml-2">Garantir Vaga — R$ {evento.preco_por_vaga.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      );
    } else if (evento.status === 'LOTADO') {
      BottomButton = (
        <View className="bg-gray-400 py-4 rounded-3xl flex-row justify-center items-center">
          <Lock color="white" size={20} />
          <Text className="text-white font-bold text-lg ml-2">Evento Lotado</Text>
        </View>
      );
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="relative">
          <Image 
            source={{ uri: evento.foto_quadra || 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=800' }} 
            className="w-full h-[280px]" 
          />
          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute top-12 left-6 w-10 h-10 bg-white/20 rounded-full justify-center items-center backdrop-blur-md"
          >
            <ChevronLeft color="white" size={24} strokeWidth={3} />
          </TouchableOpacity>
          <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50" />
        </View>
        
        <View className="px-6 -mt-16">
          <View className="bg-white p-6 rounded-3xl shadow-xl shadow-black/5 border border-gray-50">
            <View className="flex-row mb-4">
              <SportBadge esporteId={evento.esporte} />
              <AmbienteBadge tipo={evento.tipo_ambiente} />
            </View>
            
            <Text className="text-2xl font-black text-gray-800 leading-tight mb-6">{evento.titulo}</Text>
            
            <View className="gap-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-50 rounded-full justify-center items-center">
                  <CalendarDays size={20} color="#00C853" />
                </View>
                <Text className="ml-4 text-base font-bold text-gray-700">{dataFormatada}</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-50 rounded-full justify-center items-center">
                  <Clock size={20} color="#3B82F6" />
                </View>
                <Text className="ml-4 text-base font-bold text-gray-700">{horaInicio} - {horaFim}</Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-red-50 rounded-full justify-center items-center">
                  <MapPin size={20} color="#EF4444" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-base font-bold text-gray-700 leading-tight">{evento.nome_local}</Text>
                  <Text className="text-xs text-gray-400 font-medium">{evento.endereco_completo}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View className="bg-white p-6 rounded-3xl border border-gray-100 mt-4 shadow-sm shadow-black/5">
            <View className="flex-row items-center mb-4">
              <Info size={18} color="#9CA3AF" />
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-2">Nível Requerido</Text>
            </View>
            <View className="bg-gray-50 px-4 py-2 rounded-xl self-start">
              <Text className="text-base font-black text-gray-700">{evento.nivel_requerido}</Text>
            </View>
          </View>
          
          <View className="bg-white p-6 rounded-3xl border border-gray-100 mt-4 shadow-sm shadow-black/5">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <Users size={18} color="#9CA3AF" />
                <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-2">Jogadores</Text>
              </View>
              <Text className="text-sm font-black text-[#00C853]">{confirmados.length}/{evento.limite_participantes}</Text>
            </View>
            
            <PlayerSlots total={evento.limite_participantes} ocupadas={confirmados.length} />
            
            {confirmados.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-6">
                {confirmados.map((p, i) => (
                  <View key={i} className="items-center mr-4 w-16">
                    <Image source={{ uri: p.usuarios?.foto_perfil || 'https://placehold.co/100x100?text=' + p.usuarios?.nome_completo?.charAt(0) }} className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white shadow-sm shadow-black/5" />
                    <Text className="text-[10px] text-gray-500 font-bold mt-1 text-center" numberOfLines={1}>
                      {p.usuarios?.nome_completo?.split(' ')[0]}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
          
          <View className="bg-white p-6 rounded-3xl border border-gray-100 mt-4 shadow-sm shadow-black/5 mb-24">
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Avaliação da Quadra</Text>
            <View className="flex-row items-center bg-gray-50 p-4 rounded-2xl">
              <RatingStars rating={Math.round(mediaAvaliacoes)} />
              <Text className="ml-3 text-2xl font-black text-gray-800">{mediaAvaliacoes.toFixed(1)}</Text>
              <ChevronRight size={16} color="#D1D5DB" className="ml-auto" />
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 border-t border-gray-100 backdrop-blur-md">
        {BottomButton}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 pb-12">
            <View className="w-12 h-1.5 bg-gray-100 rounded-full self-center mb-8" />
            <Text className="text-2xl font-black text-gray-800 text-center mb-2">Avaliar Evento</Text>
            <Text className="text-gray-400 text-center mb-8">Como foi sua experiência nesta partida?</Text>
            
            <View className="items-center mb-8">
              <RatingStars rating={nota} onRatingChange={setNota} size={40} />
            </View>

            <View className="bg-gray-50 border border-gray-100 rounded-3xl p-4 mb-8">
              <TextInput
                className="text-base text-gray-800 min-h-[120px]"
                placeholder="Deixe um comentário (opcional)"
                value={comentario}
                onChangeText={setComentario}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity className="flex-1 py-4 border border-gray-200 rounded-[20px] items-center" onPress={() => setModalVisible(false)}>
                <Text className="text-gray-400 font-bold text-base">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#00C853] py-4 rounded-[20px] items-center shadow-lg shadow-green-500/30" onPress={handleAvaliar} disabled={partLoading}>
                {partLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
