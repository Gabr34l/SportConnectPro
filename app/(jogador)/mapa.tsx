import React from 'react';
import { Platform, View, Text } from 'react-native';
import { Map } from 'lucide-react-native';

export default function Mapa() {
  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-gray-50">
        <View className="w-24 h-24 bg-white rounded-3xl justify-center items-center shadow-lg shadow-black/5 mb-6">
          <Map size={48} color="#00C853" strokeWidth={1.5} />
        </View>
        <Text className="text-xl font-bold text-gray-800 text-center mb-2">
          Mapa indisponível na Web
        </Text>
        <Text className="text-base text-gray-400 text-center leading-6">
          Por favor, acesse o app pelo celular para ver as quadras próximas a você.
        </Text>
      </View>
    );
  }


  const PlayerMapNative = require('../../components/PlayerMapNative').default;
  return <PlayerMapNative />;
}
