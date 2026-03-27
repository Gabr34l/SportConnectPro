import { useState, useEffect } from 'react';
import { databases, config, Query } from '../lib/appwrite';
import { EventoComVagas, Participacao, Usuario } from '../types';

export type ParticipanteInfo = Participacao & { usuarios?: Pick<Usuario, 'nome_completo' | 'foto_perfil' | 'nivel_habilidade'> };

export function useEventoDetalhe(idEvento: string, idUsuario?: string) {
  const [evento, setEvento] = useState<EventoComVagas | null>(null);
  const [participantes, setParticipantes] = useState<ParticipanteInfo[]>([]);
  const [minhaParticipacao, setMinhaParticipacao] = useState<Participacao | null>(null);
  const [mediaAvaliacoes, setMediaAvaliacoes] = useState(0);
  const [loading, setLoading] = useState(true);

  const mapEvento = (doc: any): EventoComVagas => {
    const quadra = doc.quadras || {};
    const participacoes = doc.participacoes || [];
    const totalConfirmados = participacoes.filter((p: any) => p.status_presenca === 'CONFIRMADO').length;
    const limite = doc.limite_participantes || 0;
    
    return {
      ...doc,
      id_evento: doc.$id,
      created_at: doc.$createdAt,
      nome_local: quadra.nome_local || 'Local não informado',
      endereco_completo: quadra.endereco_completo || '',
      latitude: quadra.latitude || 0,
      longitude: quadra.longitude || 0,
      foto_quadra: quadra.fotos?.[0] || null,
      total_confirmados: totalConfirmados,
      vagas_restantes: limite - totalConfirmados,
      percentual_ocupacao: limite > 0 ? (totalConfirmados / limite) * 100 : 0
    } as EventoComVagas;
  };

  const mapParticipante = (doc: any): ParticipanteInfo => ({
    ...doc,
    id_participacao: doc.$id,
    id_evento: doc.id_evento?.$id || doc.id_evento,
    id_jogador: doc.id_jogador?.$id || doc.id_jogador,
    usuarios: doc.id_jogador ? {
      nome_completo: doc.id_jogador.nome_completo,
      foto_perfil: doc.id_jogador.foto_perfil,
      nivel_habilidade: doc.id_jogador.nivel_habilidade
    } : undefined
  });

  const fetchDetalhes = async () => {
    if (!idEvento) return;
    setLoading(true);
    try {
      // 1. Buscar Evento (Com dados da Quadra e Participações via Two-way mapping)
      const evDoc = await databases.getDocument(
        config.databaseId,
        config.collections.eventos,
        idEvento
      );

      const eventoMapeado = mapEvento(evDoc);
      setEvento(eventoMapeado);

      // 2. Buscar Participantes detalhadamente
      const partDocs = await databases.listDocuments(
        config.databaseId,
        config.collections.participacoes,
        [Query.equal('id_evento', idEvento)]
      );

      const participantesMapeados = partDocs.documents.map(mapParticipante);
      setParticipantes(participantesMapeados);

      if (idUsuario) {
        const my = participantesMapeados.find(p => p.id_jogador === idUsuario);
        setMinhaParticipacao(my || null);
      }

      // 3. Buscar avaliações da quadra (Pode ser aproximado pegando avaliações de todos os eventos desta quadra)
      const courtReviews = await databases.listDocuments(
        config.databaseId,
        config.collections.avaliacoes,
        [
          Query.equal('id_evento', idEvento), // Simplificação para este evento específico
          // Em um sistema real, você buscaria todos os IDs de eventos dessa quadra
        ]
      );
      
      if (courtReviews.documents.length > 0) {
        const sum = courtReviews.documents.reduce((acc, curr) => acc + curr.nota, 0);
        setMediaAvaliacoes(sum / courtReviews.documents.length);
      }
      
    } catch (e) {
      console.error('Erro ao buscar detalhes do evento:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalhes();
  }, [idEvento, idUsuario]);

  return { evento, participantes, minhaParticipacao, mediaAvaliacoes, loading, refetch: fetchDetalhes };
}
