import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as Location from 'expo-location';
import { theme } from '../constants/theme';
import { EventoComVagas } from '../types';
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
          setLocation({ coords: { latitude: -18.9186, longitude: -48.2772, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as Location.LocationObject);
        } else {
          let loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch (err) {
        setLocation({ coords: { latitude: -18.9186, longitude: -48.2772, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() } as Location.LocationObject);
      }

      try {
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

  const centerLat = location?.coords.latitude || -18.9186;
  const centerLng = location?.coords.longitude || -48.2772;

  return (
    <View style={styles.container}>
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={13} 
        style={{ width: '100%', height: 'calc(100vh - 80px)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {eventos.map((ev) => {
          const lat = Number(ev.latitude);
          const lng = Number(ev.longitude);
          
          if (!lat || !lng || lat === 0) return null;

          return (
            <Marker 
              key={ev.id_evento}
              position={[lat, lng]}
            >
              <Popup>
                <div style={{ fontFamily: 'sans-serif', padding: '5px', minWidth: '200px' }}>
                  <span style={{ fontSize: '10px', color: '#00C853', fontWeight: 'bold', textTransform: 'uppercase' }}>{ev.esporte}</span>
                  <h3 style={{ margin: '5px 0', fontSize: '16px', color: '#333' }}>{ev.titulo}</h3>
                  <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{ev.nome_local}</p>
                  <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#00C853' }}>R$ {Number(ev.preco_por_vaga || 0).toFixed(2)} / vaga</p>
                  <button 
                    onClick={() => router.push(`/(jogador)/evento/${ev.id_evento}` as any)}
                    style={{
                      width: '100%',
                      backgroundColor: '#00C853',
                      color: 'white',
                      border: 'none',
                      padding: '10px',
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
          );
        })}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
