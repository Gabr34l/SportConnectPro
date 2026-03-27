import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { theme } from '../constants/theme';
import { Quadra } from '../types';
import { MapQuadraPin } from './MapQuadraPin';
import { databases, config, Query } from '../lib/appwrite';

export default function PlayerMap() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão de acesso à localização negada');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      try {
        const response = await databases.listDocuments(
          config.databaseId,
          config.collections.quadras,
          [Query.equal('status_aprovacao', 'APROVADO')]
        );
        
        const quadrasMapeadas = response.documents.map(d => ({
          ...d,
          id_quadra: d.$id,
          created_at: d.$createdAt
        })) as unknown as Quadra[];
        
        setQuadras(quadrasMapeadas);
      } catch (e) {
        console.error('Erro ao buscar quadras para o mapa:', e);
      }
    })();
  }, []);

  if (!location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {errorMsg && <Text style={{marginTop: 16}}>{errorMsg}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
      >
        {quadras.map(q => (
          q.latitude && q.longitude ? (
            <Marker 
              key={q.id_quadra}
              coordinate={{ latitude: q.latitude, longitude: q.longitude }}
              title={q.nome_local}
            >
              <MapQuadraPin esporteId="futebol" />
            </Marker>
          ) : null
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
