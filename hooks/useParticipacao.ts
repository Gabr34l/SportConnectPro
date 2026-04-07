import { useState } from 'react';
import { databases, config, ID, client } from '../lib/appwrite';
import { Functions } from 'react-native-appwrite';

export function useParticipacao() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const functions = new Functions(client);

  const iniciarCheckout = async (idEvento: string, idJogador: string) => {
    setLoading(true);
    setError(null);
    try {
      // Nota: Você precisará criar uma Appwrite Function para substituir a Edge Function do Supabase
      const execution = await functions.createExecution(
        'criar-checkout', // ID da função no Appwrite
        JSON.stringify({ id_evento: idEvento, id_jogador: idJogador })
      );
      
      const response = JSON.parse(execution.responseBody);
      if (response.error) throw new Error(response.error);
      
      return response.checkout_url;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const avaliarEvento = async (idEvento: string, idAvaliador: string, nota: number, comentario: string) => {
    setLoading(true);
    try {
      await databases.createDocument(
        config.databaseId,
        config.collections.avaliacoes,
        ID.unique(),
        {
          id_evento: idEvento,
          id_avaliador: idAvaliador,
          nota,
          comentario,
          data_avaliacao: new Date().toISOString()
        }
      );
      return true;
    } catch (e: any) {
      console.error('Erro ao avaliar evento:', e);
      // Retornamos true conforme pedido para sempre parecer sucesso
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { iniciarCheckout, avaliarEvento, loading, error };
}
