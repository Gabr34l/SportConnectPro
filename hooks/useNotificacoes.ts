import { useState, useEffect } from 'react';
import { databases, config, Query, client } from '../lib/appwrite';
import { Notificacao } from '../types';

export function useNotificacoes(idUsuario?: string) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const mapNotificacao = (doc: any): Notificacao => ({
    ...doc,
    id_notificacao: doc.$id,
    created_at: doc.$createdAt
  });

  const fetchNotificacoes = async () => {
    if (!idUsuario) return;
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.notificacoes,
        [
          Query.equal('id_usuario', idUsuario),
          Query.orderDesc('$createdAt')
        ]
      );
      setNotificacoes(response.documents.map(mapNotificacao));
    } catch (e) {
      console.error('Erro ao buscar notificações:', e);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      await databases.updateDocument(
        config.databaseId,
        config.collections.notificacoes,
        id,
        { lida: true }
      );
      setNotificacoes(prev => prev.map(n => n.id_notificacao === id ? { ...n, lida: true } : n));
    } catch (e) {
      console.error('Erro ao marcar como lida:', e);
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!idUsuario) return;
    try {
      // O Appwrite não tem update em massa nativo para coleções. 
      // Fazemos o update de cada uma não lida.
      const unread = notificacoes.filter(n => !n.lida);
      
      await Promise.all(unread.map(n => 
        databases.updateDocument(
          config.databaseId,
          config.collections.notificacoes,
          n.id_notificacao,
          { lida: true }
        )
      ));
      
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (e) {
      console.error('Erro ao marcar todas como lidas:', e);
    }
  };

  useEffect(() => {
    fetchNotificacoes();

    if (idUsuario) {
      // Realtime do Appwrite para novas notificações
      const unsub = client.subscribe(
        `databases.${config.databaseId}.collections.${config.collections.notificacoes}.documents`,
        (response: any) => {
          // Filtrando para garantir que a notificação é para este usuário e é nova
          if (response.events.some((e: string) => e.endsWith('.create')) && 
              response.payload.id_usuario === idUsuario) {
            setNotificacoes(prev => [mapNotificacao(response.payload), ...prev]);
          }
        }
      );
      return () => { unsub(); };
    }
  }, [idUsuario]);

  return { notificacoes, unreadCount: notificacoes.filter(n => !n.lida).length, marcarComoLida, marcarTodasComoLidas, loading, refetch: fetchNotificacoes };
}
