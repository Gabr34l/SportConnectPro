import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ImageBackground, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { account } from '../../lib/appwrite';
import { useToast } from '../../components/Toast';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, ChevronLeft, CheckCircle2 } from 'lucide-react-native';

export default function ResetPassword() {
  const router = useRouter();
  const toast = useToast();
  const { userId, secret } = useLocalSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    toast.show({ type, title, message });
  };

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      showFeedback('info', 'Aviso', 'Preencha a nova senha');
      return;
    }

    if (password !== confirmPassword) {
      showFeedback('error', 'Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 8) {
      showFeedback('error', 'Erro', 'A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      if (!userId || !secret) {
        throw new Error('Link expirado ou inválido. Solicite um novo e-mail.');
      }

      await account.updateRecovery(
        userId as string,
        secret as string,
        password
      );

      showFeedback('success', 'Sucesso!', 'Sua senha foi alterada com sucesso!');
      
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);

    } catch (e: any) {
      console.error('Erro reset password:', e);
      showFeedback('error', 'Erro', e.message || 'Não foi possível alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <ImageBackground 
          source={require('../../assets/images/hero_background.png')}
          style={{ flex: 1, width: '100%' }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)', '#000000']}
            className="flex-1 px-8 pt-20"
          >
            <TouchableOpacity 
              onPress={() => router.replace('/(auth)/login')}
              className="w-12 h-12 bg-white/10 rounded-2xl justify-center items-center border border-white/10 mb-8"
            >
              <ChevronLeft color="white" size={24} />
            </TouchableOpacity>

            <View className="mb-10">
              <Text className="text-4xl font-black text-white">Nova Senha.</Text>
              <Text className="text-gray-400 text-base mt-2 font-medium">Crie uma nova credencial de acesso.</Text>
            </View>

            <View className="gap-4">
              <View className="bg-white/5 border border-white/10 rounded-[24px] flex-row items-center px-5 py-4 backdrop-blur-md">
                <Lock size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-4 text-white text-base font-medium"
                  placeholder="Nova Senha"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View className="bg-white/5 border border-white/10 rounded-[24px] flex-row items-center px-5 py-4 backdrop-blur-md">
                <Lock size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-4 text-white text-base font-medium"
                  placeholder="Confirme a Nova Senha"
                  placeholderTextColor="#6B7280"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                className={`rounded-[24px] py-5 items-center mt-6 ${loading ? 'bg-gray-800' : 'bg-[#00C853] shadow-lg shadow-green-500/40'}`}
                onPress={handleUpdatePassword} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View className="flex-row items-center">
                    <Text className="text-white font-black text-lg uppercase tracking-widest mr-2">Alterar Senha</Text>
                    <CheckCircle2 color="white" size={20} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </ScrollView>
    </View>
  );
}
