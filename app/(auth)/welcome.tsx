import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../../contexts/AuthContext';

const esportes = [
  { emoji: "⚽", nome: "Futebol", color: "#00C853" },
  { emoji: "🎾", nome: "Tênis", color: "#00C853" },
  { emoji: "🏀", nome: "Basquete", color: "#00C853" },
  { emoji: "🏐", nome: "Vôlei", color: "#00C853" },
];

export default function Welcome() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { session, usuario } = useAuthContext();
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Auto-redirect if already logged in
  useEffect(() => {
    if (session && usuario) {
      router.replace('/');
    }
  }, [session, usuario]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % esportes.length);
      }, 400);
      
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground 
        source={require('../../assets/images/hero_background.png')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#000000']}
          className="flex-1 justify-between pt-20 px-8 pb-16"
          style={{ width: '100%' }}
        >
          <View className="items-center w-full self-center" style={{ maxWidth: 500 }}>
            <View className="bg-white/10 px-4 py-2 rounded-full border border-white/20 mb-4">
              <Text className="text-white text-[10px] font-black uppercase tracking-[3px]">SportConnect Pro</Text>
            </View>
            <Text className="text-5xl font-black text-white text-center leading-[50px]">
              Onde o esporte{"\n"}
              <Text className="text-[#00C853]">ganha vida.</Text>
            </Text>
          </View>

          <View className="items-center w-full self-center" style={{ maxWidth: 500 }}>
            <Animated.View style={{ opacity: fadeAnim }} className="items-center justify-center">
              <Text className="text-7xl text-center mb-6" style={{ textAlign: 'center' }}>
                {esportes[currentIndex].emoji}
              </Text>
              <Text className="text-white text-3xl font-black uppercase tracking-[8px] text-center">
                {esportes[currentIndex].nome}
              </Text>
            </Animated.View>
            
            <View className="flex-row mt-12 items-center justify-center">
              {esportes.map((_, idx) => (
                <View 
                  key={idx} 
                  className={`h-1.5 rounded-full mx-1.5 ${idx === currentIndex ? 'bg-[#00C853] w-10' : 'bg-white/20 w-3'}`} 
                />
              ))}
            </View>
          </View>

          <View className="gap-4 w-full self-center" style={{ maxWidth: 450 }}>
            <Text className="text-gray-400 text-center text-sm mb-4 px-4 font-medium">
              Conecte-se com jogadores, reserve quadras e organize suas partidas em segundos.
            </Text>

            <TouchableOpacity
              className="bg-[#00C853] rounded-3xl py-5 shadow-xl shadow-green-500/40"
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/cadastro')}
            >
              <Text className="text-white font-black text-lg text-center uppercase tracking-widest">
                Começar Agora
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white/5 border border-white/10 rounded-3xl py-5"
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text className="text-white font-bold text-lg text-center">
                Entrar na minha conta
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
