import { databases, config, ID, Query, Permission, Role } from './appwrite';
import { Quadra, Evento, Participacao, Usuario, EventoComVagas, MensagemChat } from '../types';

/**
 * Database service to handle all CRUD operations with Appwrite
 * Updated to reflect recent environment variable changes.
 */
export const db = {
  // --- USERS ---
  users: {
    get: async (userId: string): Promise<Usuario> => {
      const doc = await databases.getDocument(config.databaseId, config.collections.usuarios, userId);
      return {
        ...doc,
        id_usuario: doc.$id,
        created_at: doc.$createdAt
      } as any as Usuario;
    },
    create: async (userId: string, data: any) => {
      return await databases.createDocument(
        config.databaseId,
        config.collections.usuarios,
        userId,
        data,
        [
          // Using imported Role and Permission from appwrite
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
    },
    update: async (userId: string, data: Partial<Usuario>) => {
      return await databases.updateDocument(config.databaseId, config.collections.usuarios, userId, data);
    }
  },

  courts: {
    create: async (data: Omit<Quadra, 'id_quadra' | 'created_at'>) => {
      return await databases.createDocument(
        config.databaseId,
        config.collections.quadras,
        ID.unique(),
        data,
        [
          Permission.read(Role.users()), // Allow all authenticated users to see courts
          Permission.update(Role.user(data.id_organizador)),
          Permission.delete(Role.user(data.id_organizador)),
        ]
      );
    },
    listByOrganizer: async (organizerId: string): Promise<Quadra[]> => {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.quadras,
        [
          Query.equal('id_organizador', organizerId), 
          Query.orderDesc('$createdAt')
        ]
      );
      return response.documents.map(d => ({
        ...d,
        id_quadra: d.$id,
        created_at: d.$createdAt
      })) as any as Quadra[];
    },
    get: async (courtId: string): Promise<Quadra> => {
      const doc = await databases.getDocument(config.databaseId, config.collections.quadras, courtId);
      return {
        ...doc,
        id_quadra: doc.$id,
        created_at: doc.$createdAt
      } as any as Quadra;
    },
    listApproved: async (): Promise<Quadra[]> => {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.quadras,
        [Query.equal('status_aprovacao', 'APROVADO')]
      );
      return response.documents.map(d => ({
        ...d,
        id_quadra: d.$id,
        created_at: d.$createdAt,
        latitude: d.latitude ? Number(d.latitude) : 0,
        longitude: d.longitude ? Number(d.longitude) : 0,
      })) as any as Quadra[];
    }
  },

  events: {
    _syncExpired: async (event: any) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0];

      const isPast = event.data_evento < today || (event.data_evento === today && event.horario_fim < currentTime);
      const isActive = ['ABERTO', 'LOTADO', 'CONFIRMADO'].includes(event.status);

      if (isPast && isActive) {
        try {
          await databases.updateDocument(config.databaseId, config.collections.eventos, event.$id, {
            status: 'CONCLUIDO'
          });
          return { ...event, status: 'CONCLUIDO' };
        } catch (e) {
          // Silently fail to not break the UI flow
        }
      }
      return event;
    },
    create: async (data: Omit<Evento, 'id_evento' | 'created_at'>) => {
      return await databases.createDocument(
        config.databaseId,
        config.collections.eventos,
        ID.unique(),
        data,
        [
          Permission.read(Role.users()), // Permitir que todos os jogadores vejam o evento
          Permission.update(Role.user(data.id_organizador)),
          Permission.delete(Role.user(data.id_organizador)),
        ]
      );
    },
    listUpcoming: async (filters: any[] = []): Promise<Evento[]> => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.eventos,
        [
          Query.greaterThanEqual('data_evento', today),
          Query.notEqual('status', 'CONCLUIDO'),
          Query.notEqual('status', 'CANCELADO'),
          ...filters
        ]
      );
      return response.documents as any as Evento[];
    },
    listByOrganizer: async (organizerId: string): Promise<Evento[]> => {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.eventos,
        [Query.equal('id_organizador', organizerId), Query.orderDesc('data_evento')]
      );
      
      // Lazy sync for the organizer view
      const syncedDocs = await Promise.all(response.documents.map(d => db.events._syncExpired(d)));
      return syncedDocs as any as Evento[];
    },
    listUpcomingHydrated: async (): Promise<EventoComVagas[]> => {
      const today = new Date().toISOString().split('T')[0];
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.eventos,
        [
          Query.greaterThanEqual('data_evento', today),
          Query.equal('status', 'ABERTO'),
          Query.limit(50)
        ]
      );
      
      const hydrated = await Promise.all(response.documents.map(async (doc) => {
        // Sync check for events that might have ended today
        const syncedDoc = await db.events._syncExpired(doc);
        if (syncedDoc.status === 'CONCLUIDO') return null;

        let quadra = syncedDoc.quadra || syncedDoc.quadras || syncedDoc.id_quadra || {};
        if (typeof quadra === 'string' && quadra.length > 5) {
          try {
            quadra = await databases.getDocument(config.databaseId, config.collections.quadras, quadra);
          } catch (e) { 
            console.warn('Erro ao hidratar quadra no list:', e);
            quadra = {}; 
          }
        }
        
        return {
          ...syncedDoc,
          id_evento: syncedDoc.$id,
          nome_local: quadra.nome_local || quadra.razao_social || 'Local não informado',
          endereco_completo: quadra.endereco_completo || '',
          latitude: quadra.latitude ? Number(quadra.latitude) : 0,
          longitude: quadra.longitude ? Number(quadra.longitude) : 0,
          foto_quadra: (quadra.fotos && quadra.fotos.length > 0) ? quadra.fotos[0] : null,
        } as any as EventoComVagas;
      }));
      
      return hydrated.filter(h => h !== null) as EventoComVagas[];
    },
    getHydrated: async (eventId: string): Promise<EventoComVagas> => {
      let doc = await databases.getDocument(config.databaseId, config.collections.eventos, eventId);
      
      // Force sync if viewing a past event
      doc = await db.events._syncExpired(doc);

      // Tenta encontrar a quadra nos campos de relacionamento
      let quadra = doc.quadra || doc.quadras || doc.id_quadra || {};
      
      // Fallback: Busca manual se vier apenas o ID
      if (typeof quadra === 'string' && quadra.length > 5) {
        try {
          const courtDoc = await databases.getDocument(config.databaseId, config.collections.quadras, quadra);
          quadra = { ...courtDoc, id_quadra: courtDoc.$id };
        } catch (e: any) {
          // Se der erro de autorização, logamos mas não travamos o app
          if (e.code !== 401) console.error('Erro no fallback da quadra:', e);
        }
      }
      
      const participacoes = doc.participacoes || [];
      const totalConfirmados = participacoes.filter((p: any) => p.status_presenca === 'CONFIRMADO').length;
      const limite = doc.limite_participantes || 0;
      
      return {
        ...doc,
        id_evento: doc.$id,
        created_at: doc.$createdAt,
        // Usamos razao_social como fallback caso nome_local não exista
        nome_local: quadra.nome_local || quadra.razao_social || 'Local não informado',
        endereco_completo: quadra.endereco_completo || 'Endereço não informado',
        latitude: quadra.latitude ? Number(quadra.latitude) : 0,
        longitude: quadra.longitude ? Number(quadra.longitude) : 0,
        foto_quadra: (quadra.fotos && quadra.fotos.length > 0) ? quadra.fotos[0] : null,
        total_confirmados: totalConfirmados,
        vagas_restantes: limite - totalConfirmados,
        percentual_ocupacao: limite > 0 ? (totalConfirmados / limite) * 100 : 0,
        descricao_quadra: quadra.descricao || '',
        comodidades_quadra: quadra.comodidades || [],
        cnpj: quadra.cnpj || ''
      } as any as EventoComVagas;
    },
    get: async (eventId: string): Promise<Evento> => {
      let doc = await databases.getDocument(config.databaseId, config.collections.eventos, eventId);
      doc = await db.events._syncExpired(doc);
      return {
        ...doc,
        id_evento: doc.$id,
        created_at: doc.$createdAt
      } as any as Evento;
    }
  },

  // --- MESSAGES (MENSAGENS) ---
  messages: {
    create: async (data: { id_evento: string, id_remetente: string, texto_mensagem: string }) => {
      return await databases.createDocument(
        config.databaseId,
        config.collections.mensagens,
        ID.unique(),
        data
      );
    },
    listByEvent: async (eventId: string) => {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.mensagens,
        [
          Query.equal('id_evento', eventId),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );
      
      return response.documents.map(m => ({
        ...m,
        id_mensagem: m.$id,
        data_envio: m.$createdAt,
        usuario: m.id_remetente ? {
          nome_completo: (m.id_remetente as any).nome_completo,
          foto_perfil: (m.id_remetente as any).foto_perfil
        } : undefined
      }));
    }
  },

  // --- PARTICIPATIONS ---
  participations: {
    create: async (data: Omit<Participacao, 'id_participacao' | 'data_confirmacao'>) => {
      return await databases.createDocument(
        config.databaseId,
        config.collections.participacoes,
        ID.unique(),
        {
          ...data,
          data_confirmacao: new Date().toISOString()
        }
      );
    },
    listByEvent: async (eventId: string): Promise<Participacao[]> => {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.participacoes,
        [Query.equal('id_evento', eventId)]
      );
      return response.documents as any as Participacao[];
    },
    listByUser: async (userId: string): Promise<Participacao[]> => {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.participacoes,
        [Query.equal('id_jogador', userId)]
      );
      return response.documents as any as Participacao[];
    },
    checkPresence: async (eventId: string, userId: string): Promise<boolean> => {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.participacoes,
        [
          Query.equal('id_evento', eventId),
          Query.equal('id_jogador', userId),
          Query.equal('status_presenca', 'CONFIRMADO')
        ]
      );
      return response.total > 0;
    }
  },

  // --- NOTIFICATIONS ---
  notifications: {
    create: async (userId: string, titulo: string, corpo: string, tipo?: string, idReferencia?: string) => {
      return await databases.createDocument(
        config.databaseId,
        config.collections.notificacoes,
        ID.unique(),
        {
          id_usuario: userId,
          titulo,
          corpo,
          lida: false,
          tipo,
          id_referencia: idReferencia,
          created_at: new Date().toISOString()
        }
      );
    },
    listByUser: async (userId: string) => {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.notificacoes,
        [
          Query.equal('id_usuario', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      );
      return response.documents;
    },
    markAsRead: async (notificationId: string) => {
      return await databases.updateDocument(
        config.databaseId,
        config.collections.notificacoes,
        notificationId,
        { lida: true }
      );
    }
  }
};
