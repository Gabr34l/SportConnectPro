import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as Location from 'expo-location';
import { theme } from '../constants/theme';
import { Quadra } from '../types';
import { databases, config, Query } from '../lib/appwrite';

// Fix form Leaflet default markers in bundlers like Expo Web
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function PlayerMapWeb() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão de acesso à localização negada na Web.');
          // Fallback to a default location (e.g. São Paulo) if denied
          setLocation({ coords: { latitude: -23.5505, longitude: -46.6333, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as Location.LocationObject);
        } else {
          let loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch (err) {
        console.warn(err);
        setErrorMsg('Erro ao obter localização. Exibindo local padrão.');
        setLocation({ coords: { latitude: -23.5505, longitude: -46.6333, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as Location.LocationObject);
      }

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
        console.error('Erro ao buscar quadras para o mapa Web:', e);
      }
    })();
  }, []);

  if (!location && !errorMsg) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapContainer 
        center={[location?.coords.latitude || -23.5505, location?.coords.longitude || -46.6333]} 
        zoom={13} 
        style={{ width: '100%', height: 'calc(100vh - 80px)' }} // Adjusted height to prevent web overflow
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {quadras.map(q => (
          q.latitude && q.longitude ? (
            <Marker 
              key={q.id_quadra}
              position={[q.latitude, q.longitude]}
            >
              <Popup>
                <strong>{q.nome_local}</strong><br/>
                {q.endereco_completo}
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
