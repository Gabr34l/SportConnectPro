import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { theme } from '../../constants/theme';
import { useAuthContext } from '../../contexts/AuthContext';
import { LayoutDashboard, Map, PlusCircle, User } from 'lucide-react-native';

export default function OrganizadorLayout() {
  const { usuario, loading } = useAuthContext();
  
  if (!loading && (!usuario || usuario.tipo_perfil !== 'ORGANIZADOR')) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: '#9CA3AF',
      headerShown: false,
      tabBarStyle: { paddingBottom: 5, paddingTop: 5, height: 60, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '500' }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard', 
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} /> 
        }} 
      />
      
      <Tabs.Screen 
        name="quadras" 
        options={{ 
          title: 'Quadras', 
          tabBarIcon: ({ color }) => <Map color={color} size={24} /> 
        }} 
      />
      
      <Tabs.Screen name="cadastrar-quadra" options={{ href: null }} />
      
      <Tabs.Screen 
        name="criar-evento" 
        options={{ 
          title: 'Criar', 
          tabBarIcon: ({ color }) => <PlusCircle color={color} size={24} /> 
        }} 
      />
      
      <Tabs.Screen name="evento/[id]" options={{ href: null }} />
      
      <Tabs.Screen 
        name="perfil" 
        options={{ 
          title: 'Perfil', 
          tabBarIcon: ({ color }) => <User color={color} size={24} /> 
        }} 
      />
    </Tabs>
  );
}
