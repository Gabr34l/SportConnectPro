import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '../../constants/theme';
import { useAuthContext } from '../../contexts/AuthContext';

export default function OrganizadorLayout() {
  const { usuario, loading } = useAuthContext();
  
  if (!loading && (!usuario || usuario.tipo_perfil !== 'ORGANIZADOR')) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: theme.colors.primary,
      headerShown: false,
      tabBarStyle: { paddingBottom: 5, paddingTop: 5, height: 60, backgroundColor: theme.colors.surface }
    }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: () => <Text style={{fontSize: 20}}>📋</Text> }} />
      <Tabs.Screen name="quadras" options={{ title: 'Quadras', tabBarIcon: () => <Text style={{fontSize: 20}}>🏟️</Text> }} />
      <Tabs.Screen name="cadastrar-quadra" options={{ href: null }} />
      <Tabs.Screen name="criar-evento" options={{ title: 'Criar', tabBarIcon: () => <Text style={{fontSize: 20}}>➕</Text> }} />
      <Tabs.Screen name="evento/[id]" options={{ href: null }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: () => <Text style={{fontSize: 20}}>👤</Text> }} />
    </Tabs>
  );
}
