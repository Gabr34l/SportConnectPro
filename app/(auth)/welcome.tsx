import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../../contexts/AuthContext';

const esportes = [
  { emoji: "⚽", nome: "Futebol", color: "#00952A" },
  { emoji: "🎾", nome: "Tênis", color: "#0F6E56" },
  { emoji: "🏐", nome: "Vôlei", color: "#185FA5" },
  { emoji: "🏀", nome: "Basquete", color: "#6B21A8" },
  { emoji: "🏓", nome: "Tênis de Mesa", color: "#0369A1" },
  { emoji: "🏊", nome: "Natação", color: "#10B981" },
];

export default function Welcome() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { session, usuario } = useAuthContext();
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Auto-redirect if already logged in
  useEffect(() => {
    if (session && usuario) {
      router.replace('/');
    }
  }, [session, usuario]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.7, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex((prev) => (prev + 1) % esportes.length);
        
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [fadeAnim, scaleAnim]);

  return (
    <LinearGradient
      colors={['#00C853', '#00952A']}
      style={{ flex: 1 }}
      className="flex-1 justify-between pt-16"
    >
      <View className="items-center gap-4 px-6 pt-8">
        <Text className="text-3xl font-bold text-white text-center">
          SportConnect Pro
        </Text>
        <Text className="text-base text-white/70 text-center">
          Sua próxima partida está aqui
        </Text>
      </View>

      <View className="items-center justify-center my-6">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <View className="items-center mb-6">
            <Text className="text-7xl mb-6">{esportes[currentIndex].emoji}</Text>
            <View 
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }} 
              className="rounded-3xl border border-white/20 px-10 py-5 backdrop-blur-md"
            >
              <Text className="text-white text-3xl font-black tracking-[4px] uppercase">
                {esportes[currentIndex].nome}
              </Text>
            </View>
          </View>
        </Animated.View>
        
        <View className="flex-row mt-6">
          {esportes.map((_, idx) => (
            <View 
              key={idx} 
              className={`h-1.5 rounded-full mx-1 ${idx === currentIndex ? 'bg-white w-3' : 'bg-white/40 w-1.5'}`} 
            />
          ))}
        </View>
      </View>

      <View className="gap-3 px-6 pb-12">
        <TouchableOpacity
          className="bg-white rounded-2xl py-4 w-full"
          onPress={() => router.push('/(auth)/cadastro')}
        >
          <Text className="text-[#00C853] font-bold text-lg text-center">
            Criar Conta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-white rounded-2xl py-4 w-full"
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-white font-bold text-lg text-center">
            Já tenho conta
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
