import { useState } from 'react';
import { databases, config, Query, ID } from '../lib/appwrite';
import { Quadra } from '../types';

export function useQuadras() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapQuadra = (doc: any): Quadra => ({
    ...doc,
    id_quadra: doc.$id,
    created_at: doc.$createdAt
  });

  const fetchQuadrasOrganizador = async (idOrganizador: string) => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collections.quadras,
        [Query.equal('id_organizador', idOrganizador)]
      );
      return response.documents.map(mapQuadra);
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchQuadraPorId = async (id: string) => {
    setLoading(true);
    try {
      const doc = await databases.getDocument(
        config.databaseId,
        config.collections.quadras,
        id
      );
      return mapQuadra(doc);
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cadastrarQuadra = async (dados: Omit<Quadra, 'id_quadra' | 'created_at' | 'status_aprovacao'>) => {
    setLoading(true);
    try {
      await databases.createDocument(
        config.databaseId,
        config.collections.quadras,
        ID.unique(),
        {
          ...dados,
          status_aprovacao: 'PENDENTE'
        }
      );
      return true;
    } catch (e: any) {
      setError(e.message);
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
      return response.documents.map(mapQuadra);
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { fetchQuadrasOrganizador, fetchQuadraPorId, fetchQuadrasAprovadas, cadastrarQuadra, loading, error };
}
