import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput, Modal, Platform, Clipboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEventoDetalhe } from '@/hooks/useEventoDetalhe';
import { useParticipacao } from '@/hooks/useParticipacao';
import { db } from '@/lib/database';
import { databases, config } from '@/lib/appwrite';
import { SportBadge } from '@/components/SportBadge';
import { AmbienteBadge } from '@/components/AmbienteBadge';
import { PlayerSlots } from '@/components/PlayerSlots';
import { RatingStars } from '@/components/RatingStars';
import { useToast } from '@/components/Toast';
import { format } from 'date-fns';
import {
  CalendarDays,
  Clock,
  MapPin,
  Timer,
  Star,
  CheckCircle2,
  MessageCircle,
  Lock,
  ChevronLeft,
  Users,
  Info,
  ChevronRight,
  Copy,
  QrCode,
  Smartphone
} from 'lucide-react-native';

function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    crc ^= (charCode << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  crc = crc & 0xFFFF;
  let crcHex = crc.toString(16).toUpperCase();
  return crcHex.padStart(4, '0');
}

function generatePixPayload(key: string, amount: number, name = "SportConnectPro", city = "SAO PAULO"): string {
  let cleanedKey = key.trim();
  if (!cleanedKey.includes('@') && cleanedKey.length !== 36) {
    if (cleanedKey.startsWith('+')) {
      cleanedKey = '+' + cleanedKey.replace(/\D/g, '');
    } else {
      cleanedKey = cleanedKey.replace(/\D/g, '');
    }
  }

  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const part00 = formatField('00', '01');
  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', cleanedKey);
  const part26 = formatField('26', gui + keyField);
  const part52 = formatField('52', '0000');
  const part53 = formatField('53', '986');

  let part54 = '';
  if (amount && amount > 0) {
    part54 = formatField('54', amount.toFixed(2));
  }

  const part58 = formatField('58', 'BR');
  const part59 = formatField('59', name.substring(0, 25));
  const part60 = formatField('60', city.substring(0, 15));
  const txid = formatField('05', '***');
  const part62 = formatField('62', txid);

  const rawPix = part00 + part26 + part52 + part53 + part54 + part58 + part59 + part60 + part62 + '6304';
  const crc = calculateCRC16(rawPix);
  
  return rawPix + crc;
}

export default function EventoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuthContext();
  const router = useRouter();
  const toast = useToast();

  const { evento, participantes, minhaParticipacao, mediaAvaliacoes, loading, refetch } = useEventoDetalhe(id, usuario?.id_usuario);
  const { iniciarCheckout, avaliarEvento, participarGratis, loading: partLoading, error: partError } = useParticipacao();

  const [modalVisible, setModalVisible] = useState(false);
  const [pixModalVisible, setPixModalVisible] = useState(false);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');

  const confirmados = participantes.filter(p => p.status_presenca === 'CONFIRMADO');
  const precoVaga = evento?.preco_por_vaga || 0;
  const pixPayload = (evento?.cnpj && precoVaga > 0) ? generatePixPayload(evento.cnpj, precoVaga) : '';

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
    setPixModalVisible(true);
  };

  const handleCopyPix = () => {
    if (!evento?.cnpj) return;
    Clipboard.setString(pixPayload);
    showFeedback('success', 'Copiado!', 'Código Pix Copia e Cola copiado para a área de transferência.');
  };

  const handleParticiparGratis = async () => {
    if (!usuario || !evento) return;
    try {
      const sucesso = await participarGratis(evento.id_evento, usuario.id_usuario);
      if (sucesso) {
        showFeedback('success', 'Sucesso!', 'Você entrou no evento gratuito com sucesso!');
        refetch();
      } else {
        showFeedback('error', 'Erro', partError || 'Não foi possível confirmar sua participação.');
      }
    } catch (e: any) {
      console.error('Erro ao participar de evento gratuito:', e);
      showFeedback('error', 'Erro', e.message || 'Não foi possível confirmar sua participação.');
    }
  };

  const handleConfirmarPagamento = async () => {
    if (!usuario || !evento) return;
    try {
      // 1. Criar Notificação para o Organizador
      await db.notifications.create(
        evento.id_organizador,
        'Pagamento Realizado (Pix)',
        `${usuario.nome_completo} informou que pagou R$ ${precoVaga.toFixed(2)} via Pix para o evento: ${evento.titulo}`,
        'PAGAMENTO_PIX',
        evento.id_evento
      );

      // 2. Registrar participação (simulado via iniciarCheckout)
      const url = await iniciarCheckout(evento.id_evento, usuario.id_usuario);
      
      showFeedback('success', 'Notificado!', 'O organizador foi notificado. Sua vaga será confirmada após a validação.');
      setPixModalVisible(false);
      refetch();
    } catch (e) {
      console.error('Erro ao notificar pagamento:', e);
      showFeedback('error', 'Erro', 'Não foi possível notificar o organizador.');
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
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-950">
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
            <View className="flex-1 bg-white dark:bg-gray-900 border-2 border-[#00C853] py-4 rounded-3xl flex-row justify-center items-center">
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
      const isGratis = precoVaga === 0;
      BottomButton = (
        <TouchableOpacity
          className="bg-[#00C853] py-4 rounded-3xl flex-row justify-center items-center shadow-lg shadow-green-500/30"
          onPress={isGratis ? handleParticiparGratis : handlePagar}
          disabled={partLoading}
        >
          {partLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {isGratis ? (
                <CheckCircle2 color="white" size={20} strokeWidth={2.5} />
              ) : (
                <Smartphone color="white" size={20} />
              )}
              <Text className="text-white font-black text-lg ml-2">
                {isGratis ? 'QUERO PARTICIPAR — Grátis' : `FAZER PAGAMENTO — R$ ${precoVaga.toFixed(2)}`}
              </Text>
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
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
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
          <View className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl shadow-black/5 border border-gray-50 dark:border-gray-900">
            <View className="flex-row mb-4">
              <SportBadge esporteId={evento.esporte} />
              <AmbienteBadge tipo={evento.tipo_ambiente} />
            </View>

            <Text className="text-2xl font-black text-gray-800 dark:text-white leading-tight mb-6">{evento.titulo}</Text>

            <View className="gap-4">
              {evento.status === 'CONFIRMADO' && (
                <View className="bg-green-50 dark:bg-green-950/30 p-4 rounded-2xl border border-green-100 dark:border-green-900/50 flex-row items-center mb-2">
                  <View className="w-10 h-10 bg-[#00C853] rounded-full justify-center items-center shadow-lg shadow-green-500/20">
                    <CheckCircle2 size={24} color="white" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-[#00C853] font-black text-base">Quadra Liberada!</Text>
                    <Text className="text-[#00C853]/70 text-[10px] font-bold uppercase">A partida está garantida 🏟️</Text>
                  </View>
                </View>
              )}

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

          <View className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mt-4 shadow-sm shadow-black/5">
            <View className="flex-row items-center mb-4">
              <Info size={18} color="#9CA3AF" />
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-2">Nível Requerido</Text>
            </View>
            <View className="bg-gray-50 dark:bg-gray-950 px-4 py-2 rounded-xl self-start">
              <Text className="text-base font-black text-gray-700">{evento.nivel_requerido}</Text>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mt-4 shadow-sm shadow-black/5">
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

          <View className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mt-4 shadow-sm shadow-black/5">
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Sobre o Local</Text>
            <Text className="text-base text-gray-700 leading-6 mb-6">
              {evento.descricao_quadra || 'Nenhuma descrição disponível para este local.'}
            </Text>

            {evento.comodidades_quadra && evento.comodidades_quadra.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {evento.comodidades_quadra.map(c => (
                  <View key={c} className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 px-3 py-1.5 rounded-lg">
                    <Text className="text-xs font-bold text-gray-500">{c}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mt-4 shadow-sm shadow-black/5 mb-24">
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Avaliação da Quadra</Text>
            <View className="flex-row items-center bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl">
              <RatingStars rating={Math.round(mediaAvaliacoes)} />
              <Text className="ml-3 text-2xl font-black text-gray-800 dark:text-white">{mediaAvaliacoes.toFixed(1)}</Text>
              <ChevronRight size={16} color="#D1D5DB" className="ml-auto" />
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 border-t border-gray-100 dark:border-gray-800 backdrop-blur-md">
        {BottomButton}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-gray-900 rounded-t-[40px] p-8 pb-12">
            <View className="w-12 h-1.5 bg-gray-100 rounded-full self-center mb-8" />
            <Text className="text-2xl font-black text-gray-800 dark:text-white text-center mb-2">Avaliar Evento</Text>
            <Text className="text-gray-400 text-center mb-8">Como foi sua experiência nesta partida?</Text>

            <View className="items-center mb-8">
              <RatingStars rating={nota} onRatingChange={setNota} size={40} />
            </View>

            <View className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 mb-8">
              <TextInput
                className="text-base text-gray-800 dark:text-white min-h-[120px]"
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

      {/* Pix Payment Modal */}
      <Modal visible={pixModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white dark:bg-gray-900 rounded-[40px] p-8 w-full max-w-sm items-center">
            <View className="w-16 h-16 bg-green-50 rounded-full justify-center items-center mb-6">
              <QrCode size={32} color="#00C853" />
            </View>
            <Text className="text-2xl font-black text-gray-800 dark:text-white text-center mb-2">Pagamento via Pix</Text>
            <Text className="text-gray-400 text-center mb-8">Pague sua parte para garantir sua vaga na partida.</Text>
            
            <View className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl items-center w-full mb-6 border border-gray-100 dark:border-gray-700">
              <Image 
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}` }} 
                className="w-[180px] h-[180px] rounded-xl mb-4"
              />
              <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Pix Copia e Cola</Text>
              <TouchableOpacity 
                onPress={handleCopyPix}
                className="flex-row items-center bg-white dark:bg-gray-900 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700 mb-3 w-full justify-center"
              >
                <Text className="text-gray-800 dark:text-white font-bold mr-2 text-xs" numberOfLines={1}>
                  {pixPayload ? `${pixPayload.substring(0, 25)}...` : 'Gerando código...'}
                </Text>
                <Copy size={14} color="#9CA3AF" />
              </TouchableOpacity>
              
              <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Chave CNPJ Recebedora</Text>
              <Text className="text-gray-700 dark:text-gray-300 font-bold text-xs">{evento.cnpj || 'Não informada'}</Text>
            </View>

            <View className="w-full bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl flex-row items-center mb-8">
              <Info size={16} color="#3B82F6" />
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold ml-2 flex-1">
                Valor a pagar: R$ {precoVaga.toFixed(2)}
              </Text>
            </View>
            
            <TouchableOpacity 
              className="bg-[#00C853] w-full rounded-[20px] py-4 items-center mb-3 shadow-lg shadow-green-500/30"
              onPress={handleConfirmarPagamento}
              disabled={partLoading}
            >
              {partLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black text-lg">Já realizei o pagamento</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="w-full border border-gray-100 dark:border-gray-800 rounded-[20px] py-4 items-center"
              onPress={() => setPixModalVisible(false)}
            >
              <Text className="text-gray-400 font-bold text-base">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
