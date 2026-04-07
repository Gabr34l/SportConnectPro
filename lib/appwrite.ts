import { Client, Account, Databases, Storage, Avatars } from 'react-native-appwrite';
import { Platform } from 'react-native';

const client = new Client();

client
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

if (Platform.OS !== 'web') {
    client.setPlatform('com.sportconnectpro.app'); 
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

// IDs para facilitar o acesso em outras telas
export const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
  storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID!,
  collections: {
    usuarios: process.env.EXPO_PUBLIC_APPWRITE_USUARIOS_COLLECTION!,
    quadras: process.env.EXPO_PUBLIC_APPWRITE_QUADRAS_COLLECTION!,
    eventos: process.env.EXPO_PUBLIC_APPWRITE_EVENTOS_COLLECTION!,
    participacoes: process.env.EXPO_PUBLIC_APPWRITE_PARTICIPACOES_COLLECTION!,
    mensagens: process.env.EXPO_PUBLIC_APPWRITE_MENSAGENS_COLLECTION!,
    notificacoes: process.env.EXPO_PUBLIC_APPWRITE_NOTIFICACOES_COLLECTION!,
    avaliacoes: process.env.EXPO_PUBLIC_APPWRITE_AVALIACOES_COLLECTION!,
    pagamentos: process.env.EXPO_PUBLIC_APPWRITE_PAGAMENTOS_COLLECTION!,
    favoritos: process.env.EXPO_PUBLIC_APPWRITE_FAVORITOS_COLLECTION!,
  },
};

export { client };
export { ID, Query } from 'react-native-appwrite';
