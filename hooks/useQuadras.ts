import { useState } from 'react';
import { databases, config, Query } from '@/lib/appwrite';
import { db } from '@/lib/database';
import { Quadra } from '../types';

export function useQuadras() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuadrasOrganizador = async (idOrganizador: string) => {
    setLoading(true);
    try {
      return await db.courts.listByOrganizer(idOrganizador);
    } catch (e: any) {
      console.error('Erro ao buscar quadras:', e);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchQuadraPorId = async (id: string) => {
    setLoading(true);
    try {
      return await db.courts.get(id);
    } catch (e: any) {
      console.error('Erro ao buscar quadra por ID:', e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cadastrarQuadra = async (dados: Omit<Quadra, 'id_quadra' | 'created_at' | 'status_aprovacao'>) => {
    setLoading(true);
    try {
      await db.courts.create({
        ...dados,
        status_aprovacao: 'PENDENTE'
      });
      return true;
    } catch (e: any) {
      console.error('Erro ao cadastrar quadra:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchQuadrasAprovadas = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.quadras,
        [Query.equal('status_aprovacao', 'APROVADO')]
      );
      return response.documents as any as Quadra[];
    } catch (e: any) {
      console.error('Erro ao buscar quadras aprovadas:', e);
      return [];
    } finally {
      setLoading(false);
    }
  };


  return { fetchQuadrasOrganizador, fetchQuadraPorId, fetchQuadrasAprovadas, cadastrarQuadra, loading, error };
}
