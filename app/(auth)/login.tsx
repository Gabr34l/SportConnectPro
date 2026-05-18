import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal, Platform, ImageBackground, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { account, config } from '@/lib/appwrite';
import { useToast } from '@/components/Toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ChevronLeft, AlertCircle } from 'lucide-react-native';
import { Button, Input } from '@/components/ui';

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
        await refreshUsuario(sessionData.userId);
        setLoginSuccess(true);
        // We do not set loading to false here immediately if successful,
        // because the useEffect will handle the redirect.
        // However, if the user profile wasn't found, we should stop loading.
      }
    } catch (e: any) {
      console.error('Erro no login:', e);
      let msg = 'E-mail ou senha incorretos';
      if (e.type === 'user_invalid_credentials') msg = 'Dados incorretos. Verifique e tente novamente.';
      showFeedback('error', 'Ops!', msg);
      setLoading(false);
    }
  };

  // Check if login was successful but user profile is null after refresh
  useEffect(() => {
    if (loginSuccess && !usuario) {
      setLoading(false);
      showFeedback('error', 'Perfil não encontrado', 'Houve um erro com seu perfil. Entre em contato com o suporte ou crie uma nova conta.');
      setLoginSuccess(false);
    }
  }, [loginSuccess, usuario]);

  const handleResetPassword = async () => {
    if (!resetEmail) {
      showFeedback('info', 'Aviso', 'Preencha o e-mail para recuperar a senha');
      return;
    }
    try {
      // URL dinâmica: se for web usa a URL do site atual + a rota de reset, se for mobile usa o deep link
      const redirectUrl = Platform.OS === 'web' 
        ? `${window.location.origin}/reset-password` 
        : 'sportconnectpro://reset-password';

      await account.createRecovery(resetEmail, redirectUrl);
      showFeedback('success', 'Sucesso', 'E-mail enviado! Verifique sua caixa de entrada.');
      setResetModalVisible(false);
    } catch (e: any) {
      console.error('Erro recovery:', e);
      showFeedback('error', 'Erro', 'Verifique se este e-mail está cadastrado ou tente novamente mais tarde.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground 
          source={require('@/assets/images/hero_background.png')}
          style={{ flex: 1, width: '100%' }}
          resizeMode="cover"
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
              <Input
                icon={Mail}
                placeholder="Seu e-mail"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                containerClassName="mb-0"
                inputClassName="text-white font-medium"
              />

              <Input
                icon={Lock}
                placeholder="Sua senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                containerClassName="mb-0"
                inputClassName="text-white font-medium"
              />

              <TouchableOpacity onPress={() => setResetModalVisible(true)} className="items-end mt-1 px-2">
                <Text className="text-gray-500 text-sm font-bold">Esqueceu a senha?</Text>
              </TouchableOpacity>

              <Button 
                variant="primary" 
                size="lg" 
                className="mt-6 uppercase tracking-widest font-black"
                onPress={handleLogin} 
                loading={loading}
              >
                Entrar
              </Button>

              <View className="flex-row justify-center mt-6 pb-10">
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
      </ScrollView>

      <Modal visible={resetModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center px-8">
          <View className="bg-gray-900 border border-white/10 p-8 rounded-[40px] shadow-2xl">
            <View className="w-16 h-16 bg-blue-500/10 rounded-full justify-center items-center mb-6 self-center">
              <AlertCircle size={32} color="#3B82F6" />
            </View>
            <Text className="text-2xl font-black text-white text-center mb-2">Recuperar Senha</Text>
            <Text className="text-gray-400 text-center mb-8">Insira seu e-mail cadastrado para receber o link.</Text>
            
            <Input
                icon={Mail}
                placeholder="E-mail"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                containerClassName="mb-6"
                inputClassName="text-white"
              />

            <Button 
              variant="primary" 
              className="mb-3"
              onPress={handleResetPassword}
            >
              Enviar Link
            </Button>
            
            <Button 
              variant="ghost" 
              onPress={() => setResetModalVisible(false)}
            >
              Voltar
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}
