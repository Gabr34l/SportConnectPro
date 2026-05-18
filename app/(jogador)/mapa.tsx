import React from 'react';
import { Platform, View, Text } from 'react-native';
import { Map } from 'lucide-react-native';

export default function Mapa() {
  if (Platform.OS === 'web') {
    const PlayerMapWeb = require('@/components/PlayerMapWeb').default;
    return <PlayerMapWeb />;
  }

  const PlayerMapNative = require('@/components/PlayerMapNative').default;
  return <PlayerMapNative />;
}
