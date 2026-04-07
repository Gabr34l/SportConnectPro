import { View, ActivityIndicator } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

export default function Index() {
  const { session, usuario, loading } = useAuthContext();
  const searchParams = useLocalSearchParams();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Captura automática de link de recuperação vindo do e-mail
  if (searchParams.userId && searchParams.secret) {
    return (
      <Redirect 
        href={{ 
          pathname: "/(auth)/reset-password", 
          params: { userId: searchParams.userId, secret: searchParams.secret } 
        }} 
      />
    );
  }

  if (!session || !usuario) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (usuario.tipo_perfil === 'ORGANIZADOR') {
    return <Redirect href="/(organizador)" />;
  }

  return <Redirect href="/(jogador)" />;
}
