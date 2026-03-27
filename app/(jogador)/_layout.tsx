import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { Home, Map, Heart, User } from 'lucide-react-native';

export default function JogadorLayout() {
  const { usuario, loading } = useAuthContext();
  
  if (!loading && (!usuario || usuario.tipo_perfil !== 'JOGADOR')) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarStyle: { height: 60, backgroundColor: '#FFFFFF', paddingBottom: 5, paddingTop: 5 },
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Início', 
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-center">
              <Home size={22} strokeWidth={1.8} color={focused ? "#00C853" : "#9CA3AF"} />
              <Text className={`text-[10px] font-medium mt-1 ${focused ? 'text-[#00C853]' : 'text-gray-400'}`}>
                Início
              </Text>
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="mapa" 
        options={{ 
          title: 'Mapa', 
          tabBarIcon: ({ focused }) => (
             <View className="items-center justify-center">
              <Map size={22} strokeWidth={1.8} color={focused ? "#00C853" : "#9CA3AF"} />
              <Text className={`text-[10px] font-medium mt-1 ${focused ? 'text-[#00C853]' : 'text-gray-400'}`}>
                Mapa
              </Text>
            </View>
          ) 
        }} 
      />
      <Tabs.Screen 
        name="favoritos" 
        options={{ 
          title: 'Favoritos', 
          tabBarIcon: ({ focused }) => (
             <View className="items-center justify-center">
              <Heart size={22} strokeWidth={1.8} color={focused ? "#00C853" : "#9CA3AF"} />
              <Text className={`text-[10px] font-medium mt-1 ${focused ? 'text-[#00C853]' : 'text-gray-400'}`}>
                Favoritos
              </Text>
            </View>
          ) 
        }} 
      />
      <Tabs.Screen name="notificacoes" options={{ href: null }} />
      <Tabs.Screen name="evento/[id]" options={{ href: null }} />
      <Tabs.Screen 
        name="perfil" 
        options={{ 
          title: 'Perfil', 
          tabBarIcon: ({ focused }) => (
             <View className="items-center justify-center">
              <User size={22} strokeWidth={1.8} color={focused ? "#00C853" : "#9CA3AF"} />
              <Text className={`text-[10px] font-medium mt-1 ${focused ? 'text-[#00C853]' : 'text-gray-400'}`}>
                Perfil
              </Text>
            </View>
          ) 
        }} 
      />
    </Tabs>
  );
}
