import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { account, databases, config, ID } from '../lib/appwrite';
import { Usuario } from '../types';
import { Models } from 'react-native-appwrite';

type AuthContextType = {
  session: Models.User<Models.Preferences> | null;
  usuario: Usuario | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUsuario: (userId?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Models.User<Models.Preferences> | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUsuario = async (userId: string) => {
    try {
      // Garantir que a sessão está atualizada também
      const user = await account.get();
      setSession(user);

      const doc = await databases.getDocument(
        config.databaseId,
        config.collections.usuarios,
        userId
      );
      
      if (doc) {
        setUsuario({
          ...doc,
          id_usuario: doc.$id,
          created_at: doc.$createdAt
        } as unknown as Usuario);
      }
    } catch (e) {
      console.error('Erro ao buscar perfil do usuário:', e);
      setUsuario(null);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get();
        setSession(user);
        if (user?.$id) {
          await refreshUsuario(user.$id);
        }
      } catch (e) {
        setSession(null);
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signOut = async () => {
    try {
      await account.deleteSession('current');
      setSession(null);
      setUsuario(null);
      
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        router.replace('/(auth)/welcome');
      }
    } catch (e) {
      console.error('Erro ao sair:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      usuario, 
      loading, 
      signOut, 
      refreshUsuario: async (id?: string) => { 
        const uid = id || session?.$id;
        if (uid) await refreshUsuario(uid); 
      } 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
