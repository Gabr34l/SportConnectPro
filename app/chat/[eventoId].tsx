import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases, config, client, Query, ID } from '../../lib/appwrite';
import { useAuthContext } from '../../contexts/AuthContext';
import { ChatMessage } from '../../components/ChatMessage';
import { MensagemChat } from '../../types';
import { ChevronLeft, Send, Lock, MessageCircle } from 'lucide-react-native';

export default function ChatScreen() {
  const { eventoId } = useLocalSearchParams<{ eventoId: string }>();
  const { usuario } = useAuthContext();
  const router = useRouter();
  
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [acessoLiberado, setAcessoLiberado] = useState(false);

  useEffect(() => {
    if (!usuario || !eventoId) return;
    
    let unsubscribe: () => void;

    const verificarAcessoEBuscar = async () => {
      setLoading(true);
      try {
        const evento = await databases.getDocument(
          config.databaseId,
          config.collections.eventos,
          eventoId
        );
        
        let temAcesso = false;
        
        if (evento?.id_organizador === usuario.id_usuario) {
          temAcesso = true;
        } else {
          const participacoes = await databases.listDocuments(
            config.databaseId,
            config.collections.participacoes,
            [
              Query.equal('id_evento', eventoId),
              Query.equal('id_jogador', usuario.id_usuario),
              Query.equal('status_presenca', 'CONFIRMADO')
            ]
          );
          
          if (participacoes.total > 0) {
            temAcesso = true;
          }
        }

        setAcessoLiberado(temAcesso);

        if (temAcesso) {
          const msgsResponse = await databases.listDocuments(
            config.databaseId,
            config.collections.mensagens,
            [
              Query.equal('id_evento', eventoId),
              Query.orderDesc('$createdAt')
            ]
          );
          
          const msgsMapeadas = msgsResponse.documents.map(m => ({
            ...m,
            id_mensagem: m.$id,
            data_envio: m.$createdAt,
            usuario: m.id_remetente ? {
              nome_completo: m.id_remetente.nome_completo,
              foto_perfil: m.id_remetente.foto_perfil
            } : null
          })) as unknown as MensagemChat[];

          setMensagens(msgsMapeadas);

          unsubscribe = client.subscribe(
            `databases.${config.databaseId}.collections.${config.collections.mensagens}.documents`,
            async (response) => {
              const payload = response.payload as any;
              
              if (response.events.some(e => e.includes('.create')) && payload.id_evento === eventoId) {
                try {
                  const u = await databases.getDocument(
                    config.databaseId,
                    config.collections.usuarios,
                    payload.id_remetente
                  );
                  
                  const novaMsg = { 
                    ...payload, 
                    id_mensagem: payload.$id,
                    data_envio: payload.$createdAt,
                    usuario: {
                      nome_completo: u.nome_completo,
                      foto_perfil: u.foto_perfil
                    }
                  } as unknown as MensagemChat;
                  
                  setMensagens(prev => [novaMsg, ...prev]);
                } catch (e) {
                  console.error('Erro ao hidratar usuário na mensagem realtime:', e);
                }
              }
            }
          );
        }
      } catch (e) {
        console.error('Erro no chat:', e);
      } finally {
        setLoading(false);
      }
    };

    verificarAcessoEBuscar();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [eventoId, usuario]);

  const handleEnviar = async () => {
    if (!texto.trim() || !usuario || !eventoId) return;
    const txt = texto.trim();
    setTexto('');
    
    try {
      await databases.createDocument(
        config.databaseId,
        config.collections.mensagens,
        ID.unique(),
        {
          id_evento: eventoId,
          id_remetente: usuario.id_usuario,
          texto_mensagem: txt
        }
      );
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-12 pb-6 border-b border-gray-100 bg-white shadow-sm shadow-black/5">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ChevronLeft size={24} color="#111827" strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-800">Chat do Evento</Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
              <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tempo Real</Text>
            </View>
          </View>
        </View>

        {!acessoLiberado ? (
          <View className="flex-1 justify-center items-center p-8 bg-gray-50">
            <View className="w-24 h-24 bg-white rounded-3xl justify-center items-center shadow-lg shadow-black/5 mb-6">
              <Lock size={48} color="#9CA3AF" strokeWidth={1.5} />
            </View>
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">Acesso Restrito</Text>
            <Text className="text-base text-gray-400 text-center leading-6">
              O chat está disponível apenas para participantes com pagamento confirmado e o organizador.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={mensagens}
              keyExtractor={m => m.id_mensagem}
              renderItem={({item}) => <ChatMessage mensagem={item} />}
              inverted
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center mt-12 bg-gray-50 p-8 rounded-3xl border border-dashed border-gray-200">
                  <MessageCircle size={40} color="#D1D5DB" strokeWidth={1.5} />
                  <Text className="text-gray-400 mt-4 text-center italic text-sm">
                    Inicie a conversa! Envie uma mensagem para os outros jogadores.
                  </Text>
                </View>
              }
            />
            {/* Input Bar */}
            <View className="p-4 bg-white border-t border-gray-100 flex-row items-end">
              <View className="flex-1 bg-gray-50 border border-gray-200 rounded-3xl px-5 py-3 max-h-32">
                <TextInput
                  placeholder="Mensagem..."
                  value={texto}
                  onChangeText={setTexto}
                  multiline
                  className="text-base text-gray-800"
                />
              </View>
              <TouchableOpacity 
                className={`ml-3 w-12 h-12 rounded-full justify-center items-center shadow-lg ${
                  !texto.trim() ? "bg-gray-100" : "bg-[#00C853] shadow-green-500/30"
                }`}
                onPress={handleEnviar} 
                disabled={!texto.trim()}
              >
                <Send size={20} color={!texto.trim() ? "#D1D5DB" : "white"} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
