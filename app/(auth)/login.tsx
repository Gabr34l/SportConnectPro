import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal, Platform, ImageBackground } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { account, config } from '../../lib/appwrite';
import { useToast } from '../../components/Toast';
import { useAuthContext } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ChevronLeft, AlertCircle } from 'lucide-react-native';

export default function Login() {
  const router = useRouter();
  const toast = useToast();
  const { session, usuario, refreshUsuario } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Watch auth context — navigate only when both session AND usuario are loaded
  useEffect(() => {
    if ((loginSuccess || session) && usuario) {
      router.replace('/');
    }
  }, [loginSuccess, session, usuario]);

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    toast.show({ type, title, message });
  };

  const handleLogin = async () => {
    const limpoEmail = email.trim();
    if (!limpoEmail || !password) {
      showFeedback('info', 'Aviso', 'Preencha e-mail e senha');
      return;
    }
    setLoading(true);
    try {
      try {
        await account.deleteSession('current');
      } catch (_) {}

      const sessionData = await account.createEmailPasswordSession(limpoEmail, password);
      
      if (sessionData) {
        showFeedback('success', 'Sucesso', 'Bem-vindo de volta!');
        await refreshUsuario(sessionData.userId);
        setLoginSuccess(true);
      }
    } catch (e: any) {
      console.error('Erro no login:', e);
      let msg = 'E-mail ou senha incorretos';
      if (e.type === 'user_invalid_credentials') msg = 'Dados incorretos. Verifique e tente novamente.';
      showFeedback('error', 'Ops!', msg);
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      showFeedback('info', 'Aviso', 'Preencha o e-mail para recuperar a senha');
      return;
    }
    try {
      await account.createRecovery(resetEmail, 'sportconnectpro://');
      showFeedback('success', 'Sucesso', 'E-mail enviado! Verifique sua caixa de entrada.');
      setResetModalVisible(false);
    } catch (e: any) {
      showFeedback('error', 'Erro', e.message || 'Erro inesperado');
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ImageBackground 
        source={require('../../assets/images/hero_background.png')}
        className="flex-1"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)', '#000000']}
          className="flex-1 px-8 pt-20"
        >
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-12 h-12 bg-white/10 rounded-2xl justify-center items-center border border-white/10 mb-8"
          >
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>

          <View className="mb-10">
            <Text className="text-4xl font-black text-white">Bem-vindo{"\n"}de volta.</Text>
            <Text className="text-gray-400 text-base mt-2 font-medium">Sentimos sua falta no campo.</Text>
          </View>

          <View className="gap-4">
            <View className="bg-white/5 border border-white/10 rounded-[24px] flex-row items-center px-5 py-4 backdrop-blur-md">
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-4 text-white text-base font-medium"
                placeholder="Seu e-mail"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="bg-white/5 border border-white/10 rounded-[24px] flex-row items-center px-5 py-4 backdrop-blur-md">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-4 text-white text-base font-medium"
                placeholder="Sua senha"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity onPress={() => setResetModalVisible(true)} className="items-end mt-1 px-2">
              <Text className="text-gray-500 text-sm font-bold">Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`rounded-[24px] py-5 items-center mt-6 transition-all ${loading ? 'bg-gray-800' : 'bg-[#00C853] shadow-lg shadow-green-500/40'}`}
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-black text-lg uppercase tracking-widest">Entrar</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-gray-500 text-base">Novo por aqui? </Text>
              <Link href="/(auth)/cadastro" asChild>
                <TouchableOpacity>
                  <Text className="text-[#00C853] text-base font-bold">Crie sua conta</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <Modal visible={resetModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center px-8">
          <View className="bg-gray-900 border border-white/10 p-8 rounded-[40px] shadow-2xl">
            <View className="w-16 h-16 bg-blue-500/10 rounded-full justify-center items-center mb-6 self-center">
              <AlertCircle size={32} color="#3B82F6" />
            </View>
            <Text className="text-2xl font-black text-white text-center mb-2">Recuperar Senha</Text>
            <Text className="text-gray-400 text-center mb-8">Insira seu e-mail cadastrado para receber o link.</Text>
            
            <View className="bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-5 py-4 mb-6">
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-4 text-white text-base"
                placeholder="E-mail"
                placeholderTextColor="#6B7280"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              className="bg-[#00C853] rounded-2xl py-4 items-center mb-3 shadow-lg shadow-green-500/20"
              onPress={handleResetPassword}
            >
              <Text className="text-white font-bold text-base">Enviar Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="py-4 items-center"
              onPress={() => setResetModalVisible(false)}
            >
              <Text className="text-gray-500 font-bold text-base">Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
