import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthContext } from '../../contexts/AuthContext';
import { ChatMessage } from '../../components/ChatMessage';
import { MensagemChat } from '../../types';
import { theme } from '../../constants/theme';

export default function ChatScreen() {
  const { eventoId } = useLocalSearchParams<{ eventoId: string }>();
  const { usuario } = useAuthContext();
  const router = useRouter();
  
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [acessoLiberado, setAcessoLiberado] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    
    const verificarAcessoEBuscar = async () => {
      setLoading(true);
      const { data: evento } = await supabase.from('eventos').select('id_organizador, titulo').eq('id_evento', eventoId).single();
      let temAcesso = false;
      
      if (evento?.id_organizador === usuario.id_usuario) {
        temAcesso = true;
      } else {
        const { data: part } = await supabase.from('participacoes')
          .select('status_presenca')
          .eq('id_evento', eventoId)
          .eq('id_jogador', usuario.id_usuario)
          .single();
        
        if (part && part.status_presenca === 'CONFIRMADO') {
          temAcesso = true;
        }
      }

      setAcessoLiberado(temAcesso);

      if (temAcesso) {
        const { data: msgs } = await supabase.from('mensagens_chat')
          .select('*, usuario:usuarios(nome_completo, foto_perfil)')
          .eq('id_evento', eventoId)
          .order('data_envio', { ascending: false });
          
        if (msgs) setMensagens(msgs as any);

        const channel = supabase.channel(`chat:${eventoId}`)
          .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'mensagens_chat', filter: `id_evento=eq.${eventoId}`
          }, async (payload) => {
            const { data: u } = await supabase.from('usuarios').select('nome_completo, foto_perfil').eq('id_usuario', payload.new.id_remetente).single();
            const novaMsg = { ...payload.new, usuario: u } as unknown as MensagemChat;
            setMensagens(prev => [novaMsg, ...prev]);
          })
          .subscribe();

        setLoading(false);
        return () => { channel.unsubscribe(); };
      } else {
        setLoading(false);
      }
    };

    verificarAcessoEBuscar();
  }, [eventoId, usuario]);

  const handleEnviar = async () => {
    if (!texto.trim() || !usuario) return;
    const txt = texto.trim();
    setTexto('');
    
    await supabase.from('mensagens_chat').insert({
      id_evento: eventoId,
      id_remetente: usuario.id_usuario,
      texto_mensagem: txt
    });
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.surface}}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.btnBack} onPress={() => router.back()}>
            <Text style={styles.btnBackText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat do Evento</Text>
        </View>

        {!acessoLiberado ? (
          <View style={styles.centered}>
            <Text style={{fontSize: 48, marginBottom: 16}}>💬 🔒</Text>
            <Text style={styles.blockedText}>Chat disponível apenas para participantes confirmados e o organizador.</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={mensagens}
              keyExtractor={m => m.id_mensagem}
              renderItem={({item}) => <ChatMessage mensagem={item} />}
              inverted
              contentContainerStyle={styles.list}
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Digite sua mensagem..."
                value={texto}
                onChangeText={setTexto}
                multiline
              />
              <TouchableOpacity style={[styles.btnSend, !texto.trim() && styles.btnSendDisabled]} onPress={handleEnviar} disabled={!texto.trim()}>
                <Text style={styles.btnSendText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderColor: theme.colors.border },
  btnBack: { padding: 8, marginRight: 16 },
  btnBackText: { fontSize: 16, color: theme.colors.primary, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  blockedText: { fontSize: 18, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  list: { paddingVertical: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderColor: theme.colors.border },
  input: { flex: 1, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 16, maxHeight: 100 },
  btnSend: { marginLeft: 12, backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, justifyContent: 'center', marginBottom: 2 },
  btnSendDisabled: { backgroundColor: theme.colors.textMuted },
  btnSendText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
