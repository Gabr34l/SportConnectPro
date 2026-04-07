import { useState, useEffect } from 'react';
import { databases, config, Query, client } from '../lib/appwrite';
import { EventoComVagas } from '../types';

export function useJogosDoDia(filtroData: string, filtroEsporte?: string, filtroAmbiente?: string, filtroNivel?: string) {
  const [jogos, setJogos] = useState<EventoComVagas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapEvento = (doc: any): EventoComVagas => {
    // No Appwrite, as relações vêm dentro do objeto se foram consultadas ou povoadas.
    // Mapeamos os dados da quadra e calculamos as vagas para compatibilidade.
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

  const fetchJogos = async () => {
    try {
      setLoading(true);
      const queries = [
        Query.equal('data_evento', filtroData),
        Query.equal('status', 'ABERTO'),
        Query.orderAsc('horario_inicio')
      ];

      if (filtroEsporte && filtroEsporte !== 'todos') queries.push(Query.equal('esporte', filtroEsporte));
      if (filtroAmbiente && filtroAmbiente !== 'todos') queries.push(Query.equal('tipo_ambiente', filtroAmbiente));
      if (filtroNivel && filtroNivel !== 'todos') queries.push(Query.equal('nivel_requerido', filtroNivel));

      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.eventos,
        queries
      );

      setJogos(response.documents.map(mapEvento));
    } catch (e: any) {
      console.error('Erro ao buscar jogos:', e);
      // Silenciamos o erro para o usuário conforme pedido
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJogos();

    // Appwrite Realtime! Ouvindo mudanças em participações
    const unsub = client.subscribe(
      `databases.${config.databaseId}.collections.${config.collections.participacoes}.documents`,
      () => {
        fetchJogos();
      }
    );

    return () => {
      unsub();
    };
  }, [filtroData, filtroEsporte, filtroAmbiente, filtroNivel]);

  return { jogos, loading, error, refetch: fetchJogos };
}
