import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as Location from 'expo-location';
import { theme } from '@/constants/theme';
import { Quadra } from '../types';
import { db } from '@/lib/database';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, Navigation } from 'lucide-react-native';

// Fix for Leaflet default markers in bundlers like Expo Web
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });
}

const UBERLANDIA_CENTER: [number, number] = [-18.9186, -48.2772];

// Validação geográfica para evitar coordenadas absurdas
const isValidCoord = (lat: number, lng: number) => {
  if (lat < -45 || lat > 15) return false;
  if (lng < -85 || lng > -30) return false;
  return true;
};

// Ícone Vermelho Premium
const redMarkerIcon = typeof window !== 'undefined' ? L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : null;

function MapUpdater({ center, openPopupRef }: { center: [number, number], openPopupRef: React.MutableRefObject<any> }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    if (center && map && isValidCoord(center[0], center[1])) {
      map.flyTo(center, 17);
      setTimeout(() => {
        if (openPopupRef.current) openPopupRef.current.openPopup();
      }, 700);
    }
  }, [center, map]);
  return null;
}

export default function PlayerMapWeb() {
  const params = useLocalSearchParams();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [selectedResult, setSelectedResult] = useState<{ lat: number, lng: number, name: string } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(UBERLANDIA_CENTER);
  const router = useRouter();
  
  const searchMarkerRef = useRef<any>(null);
  const courtRefs = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    const initMap = async () => {
      if (params.lat && params.lng) {
        const pLat = parseFloat(params.lat as string);
        const pLng = parseFloat(params.lng as string);
        if (isValidCoord(pLat, pLng)) setMapCenter([pLat, pLng]);
      }

      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
          if (!params.lat) setMapCenter([loc.coords.latitude, loc.coords.longitude]);
        }
      } catch (err) {}

      try {
        const approved = await db.courts.listApproved();
        setQuadras(approved);
      } catch (e) {
        console.error('Erro ao buscar quadras:', e);
      }
    };
    initMap();
  }, [params.lat, params.lng]);

  const openInGoogleMaps = (lat: number, lng: number, address?: string) => {
    const query = address ? encodeURIComponent(address) : `${lat},${lng}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const geocode = async (q: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      return await response.json();
    } catch {
      return [];
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoadingSearch(true);
    setShowSuggestions(false);
    
    try {
      // 1. Busca interna no projeto
      const matchingCourt = quadras.find(q => 
        q.nome_local.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.endereco_completo?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matchingCourt && matchingCourt.latitude && isValidCoord(matchingCourt.latitude, matchingCourt.longitude)) {
        setMapCenter([matchingCourt.latitude, matchingCourt.longitude]);
        setSearchQuery(matchingCourt.nome_local);
        setSelectedResult(null);
        setIsLoadingSearch(false);
        return;
      }

      // 2. Estratégia Multinível de Busca Externa (Nominatim)
      const strategies = [
        `${searchQuery}, Uberlândia, MG, Brasil`,
        `${searchQuery.replace(/Av\.|R\.|Avenida|Rua| - /gi, ' ')}, Uberlândia, MG`,
        searchQuery,
        `${searchQuery.split(',')[0]}, Uberlândia` // Apenas a rua
      ];

      let foundData = null;
      for (const query of strategies) {
        const data = await geocode(query);
        if (data && data.length > 0) {
          foundData = data[0];
          break;
        }
      }
      
      if (foundData) {
        const lat = parseFloat(foundData.lat);
        const lon = parseFloat(foundData.lon);
        if (isValidCoord(lat, lon)) {
          setSelectedResult({ lat, lng: lon, name: foundData.display_name.split(',')[0] });
          setMapCenter([lat, lon]);
        }
      } else {
        // Se tudo falhar, sugere abrir direto no Google Maps que é mais potente
        const confirmGo = confirm('Endereço exato não encontrado no mapa simplificado. Deseja tentar localizar diretamente no Google Maps?');
        if (confirmGo) {
          openInGoogleMaps(0, 0, searchQuery + ", Uberlândia, MG");
        }
      }
    } catch (e) {
      console.error('Erro:', e);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  if (!location && !params.lat) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchOverlay}>
        <div style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
          <div style={{ 
            display: 'flex', backgroundColor: 'white', borderRadius: '20px', padding: '6px 14px', 
            boxShadow: '0 12px 45px rgba(0,0,0,0.18)', alignItems: 'center', border: '1px solid #eee'
          }}>
            <Search size={20} color={theme.colors.primary} />
            <input 
              type="text" placeholder="Nome da quadra ou endereço completo..."
              value={searchQuery} onFocus={() => setShowSuggestions(true)}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 15px', fontSize: '16px' }}
            />
            <button 
              onClick={handleSearch}
              disabled={isLoadingSearch}
              style={{ 
                backgroundColor: theme.colors.primary, color: 'white', border: 'none', padding: '12px 25px', 
                borderRadius: '14px', fontWeight: '900', cursor: 'pointer'
              }}
            >
              {isLoadingSearch ? '...' : 'BUSCAR'}
            </button>
          </div>

          {showSuggestions && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, 
              backgroundColor: 'white', borderRadius: '20px', marginTop: '12px',
              boxShadow: '0 15px 50px rgba(0,0,0,0.2)', zIndex: 2000,
              maxHeight: '350px', overflowY: 'auto'
            }}>
              <div style={{ padding: '15px 20px', fontSize: '11px', color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Quadras do Projeto
              </div>
              {quadras
                .filter(q => q.nome_local.toLowerCase().includes(searchQuery.toLowerCase()) || q.endereco_completo?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((q) => (
                  <div 
                    key={q.id_quadra}
                    onClick={() => {
                      setSearchQuery(q.nome_local);
                      setShowSuggestions(false);
                      if (q.latitude && isValidCoord(q.latitude, q.longitude)) {
                        setMapCenter([q.latitude, q.longitude]);
                      }
                    }}
                    style={{ padding: '15px 20px', borderTop: '1px solid #f8f9fa', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F0FFF4'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <span style={{ fontWeight: '700', color: '#1A202C', display: 'block' }}>{q.nome_local}</span>
                    <span style={{ fontSize: '12px', color: '#718096' }}>📍 {q.endereco_completo}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </View>

      <MapContainer 
        center={mapCenter} zoom={17} 
        style={{ width: '100%', height: 'calc(100vh - 80px)' }}
      >
        <MapUpdater center={mapCenter} openPopupRef={selectedResult ? searchMarkerRef : { current: courtRefs.current[quadras.find(q => q.nome_local === searchQuery)?.id_quadra || ''] }} />
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution="&copy; Google Maps"
        />
        
        {selectedResult && (
          <Marker position={[selectedResult.lat, selectedResult.lng]} icon={redMarkerIcon || undefined} ref={searchMarkerRef}>
            <Popup>
              <div style={{ fontFamily: 'Outfit, sans-serif', padding: '12px', minWidth: '200px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '900', color: '#d32f2f' }}>📍 {selectedResult.name}</h4>
                <button 
                  onClick={() => openInGoogleMaps(selectedResult.lat, selectedResult.lng, selectedResult.name)} 
                  style={{ 
                    width: '100%', backgroundColor: '#4285F4', color: 'white', border: 'none', 
                    padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' 
                  }}
                >
                  <Navigation size={18} /> VER NO GOOGLE MAPS
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {quadras.map((q) => (
          (q.latitude && isValidCoord(q.latitude, q.longitude)) && (
            <Marker key={q.id_quadra} position={[q.latitude, q.longitude]} icon={redMarkerIcon || undefined} ref={el => courtRefs.current[q.id_quadra] = el}>
              <Popup>
                <div style={{ fontFamily: 'Outfit, sans-serif', padding: '12px', minWidth: '240px' }}>
                  <div style={{ backgroundColor: '#EBF8FF', color: '#3182CE', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'inline-block', marginBottom: '8px' }}>QUADRA SPORTCONNECT</div>
                  <h3 style={{ margin: '0 0 5px', fontSize: '19px', fontWeight: '900', color: '#1A202C' }}>{q.nome_local}</h3>
                  <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#718096' }}>📍 {q.endereco_completo}</p>
                  <button onClick={() => openInGoogleMaps(q.latitude!, q.longitude!, q.endereco_completo)} style={{ width: '100%', backgroundColor: '#4285F4', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Navigation size={16} /> VER NO GOOGLE MAPS
                  </button>
                  <button onClick={() => router.push(`/(jogador)/index` as any)} style={{ width: '100%', backgroundColor: theme.colors.primary, color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>VER PARTIDAS DISPONÍVEIS</button>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchOverlay: {
    position: 'absolute', top: 30, left: 0, right: 0, zIndex: 1000,
    alignItems: 'center', paddingHorizontal: 20
  }
});
