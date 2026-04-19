import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as Location from 'expo-location';
import { theme } from '../constants/theme';
import { EventoComVagas, Quadra } from '../types';
import { db } from '../lib/database';
import { useRouter } from 'expo-router';

// Fix for Leaflet default markers in bundlers like Expo Web
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });
}

export default function PlayerMapWeb() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [eventos, setEventos] = useState<EventoComVagas[]>([]);
  const router = useRouter();

  useEffect(() => {
    const initMap = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permissão de localização negada.');
          setLocation({ coords: { latitude: -23.5505, longitude: -46.6333, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as Location.LocationObject);
        } else {
          let loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch (err) {
        console.warn('Location error:', err);
        setLocation({ coords: { latitude: -23.5505, longitude: -46.6333, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as Location.LocationObject);
      }

      try {
        // Buscamos os eventos hidratados (que já vem com lat/long da quadra)
        const upcoming = await db.events.listUpcomingHydrated();
        setEventos(upcoming);
      } catch (e) {
        console.error('Erro ao buscar eventos para o mapa:', e);
      }
    };
    initMap();
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
        center={[location?.coords.latitude || -18.9186, location?.coords.longitude || -48.2772]} // Centralizado em Uberlândia por padrão
        zoom={13} 
        style={{ width: '100%', height: 'calc(100vh - 80px)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {eventos.map(ev => {
          const lat = Number(ev.latitude);
          const lng = Number(ev.longitude);
          
          return lat && lng && lat !== 0 ? (
            <Marker 
              key={ev.id_evento}
              position={[lat, lng]}
            >
              <Popup>
                <div style={{ fontFamily: 'sans-serif', padding: '5px' }}>
                  <span style={{ fontSize: '10px', color: '#00C853', fontWeight: 'bold', textTransform: 'uppercase' }}>{ev.esporte}</span>
                  <h3 style={{ margin: '5px 0', fontSize: '16px' }}>{ev.titulo}</h3>
                  <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{ev.nome_local}</p>
                  <p style={{ margin: '5px 0', fontWeight: 'bold' }}>R$ {Number(ev.preco_por_vaga || 0).toFixed(2)} / vaga</p>
                  <button 
                    onClick={() => {
                      router.push(`/(jogador)/evento/${ev.id_evento}` as any);
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#00C853',
                      color: 'white',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      marginTop: '10px'
                    }}
                  >
                    Ver Detalhes
                  </button>
                </div>
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
