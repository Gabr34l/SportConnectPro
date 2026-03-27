import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

export default function Index() {
  const { session, usuario, loading } = useAuthContext();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
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
