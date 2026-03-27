import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import { MensagemChat } from '../types';
import { theme } from '../constants/theme';
import { format } from 'date-fns';

export function ChatMessage({ mensagem }: { mensagem: MensagemChat }) {
  const { usuario } = useAuthContext();
  const isMine = usuario?.id_usuario === mensagem.id_remetente;

  return (
    <View style={[styles.container, isMine ? styles.myContainer : styles.otherContainer]}>
      {!isMine && (
        <Image source={{ uri: mensagem.usuario?.foto_perfil || 'https://via.placeholder.com/40' }} style={styles.avatar} />
      )}
      <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
        {!isMine && <Text style={styles.name}>{mensagem.usuario?.nome_completo?.split(' ')[0]}</Text>}
        <Text style={[styles.text, isMine ? styles.myText : styles.otherText]}>{mensagem.texto_mensagem}</Text>
        <Text style={[styles.time, isMine ? styles.myTime : styles.otherTime]}>
          {format(new Date(mensagem.data_envio), 'HH:mm')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 16, alignItems: 'flex-end', width: '100%' },
  myContainer: { justifyContent: 'flex-end' },
  otherContainer: { justifyContent: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#E0E0E0' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: theme.colors.primaryDark, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderBottomLeftRadius: 4 },
  name: { fontSize: 12, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 4 },
  text: { fontSize: 16, lineHeight: 22 },
  myText: { color: theme.colors.surface },
  otherText: { color: theme.colors.textPrimary },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myTime: { color: theme.colors.primaryMuted },
  otherTime: { color: theme.colors.textSecondary }
});
