import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { account, config } from '../../lib/appwrite';
import { useToast } from '../../components/Toast';
import { useAuthContext } from '../../contexts/AuthContext';

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
      // Limpa possível sessão presa antes de criar uma nova
      try {
        await account.deleteSession('current');
      } catch (_) {}

      // 1. Criar a sessão no Appwrite
      const sessionData = await account.createEmailPasswordSession(limpoEmail, password);
      
      if (sessionData) {
        showFeedback('success', 'Sucesso', 'Login realizado com sucesso!');
        // 2. Atualizar o perfil do usuário globalmente
        await refreshUsuario(sessionData.userId);
        setLoginSuccess(true);
      }
    } catch (e: any) {
      console.error('Erro no login:', e);
      let msg = 'E-mail ou senha incorretos';
      if (e.message?.includes('Invalid credentials')) msg = 'E-mail ou senha incorretos';
      else if (e.message?.includes('Network request failed')) msg = 'Sem conexão com o servidor';
      else if (e.message) msg = e.message;
      
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
      // 1. Criar recuperação de senha no Appwrite
      await account.createRecovery(
        resetEmail,
        'sportconnectpro://' // redirecionamento conforme configurado no projeto
      );
      
      showFeedback('success', 'Sucesso', 'E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setResetModalVisible(false);
    } catch (e: any) {
      showFeedback('error', 'Erro', e.message || 'Erro inesperado');
    }
  };

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold text-[#00952A] mb-2 text-center">
        Entrar
      </Text>
      <Text className="text-base text-gray-400 mb-8 text-center">
        Acesse sua conta SportConnect Pro
      </Text>
      
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4 text-base"
        placeholder="E-mail"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-3 text-base"
        placeholder="Senha"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity onPress={() => setResetModalVisible(true)} className="mb-8">
        <Text className="text-gray-400 text-right text-sm">Esqueci minha senha</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        className={`rounded-2xl py-4 items-center mb-4 ${loading ? 'bg-gray-300' : 'bg-[#00C853]'}`}
        onPress={handleLogin} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-lg">Entrar</Text>
        )}
      </TouchableOpacity>

      <View className="flex-row justify-center mt-4">
        <Text className="text-gray-400 text-base">Não tem conta? </Text>
        <Link href="/(auth)/cadastro" asChild>
          <TouchableOpacity>
            <Text className="text-[#00C853] text-base font-bold">Cadastre-se</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Modal visible={resetModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white p-6 rounded-2xl">
            <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
              Recuperar Senha
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4 text-base"
              placeholder="E-mail"
              placeholderTextColor="#9CA3AF"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity 
              className="bg-[#00C853] rounded-2xl py-4 items-center mb-3"
              onPress={handleResetPassword}
            >
              <Text className="text-white font-bold text-base">Enviar link de recuperação</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="border border-gray-200 rounded-2xl py-4 items-center"
              onPress={() => setResetModalVisible(false)}
            >
              <Text className="text-gray-500 font-bold text-base">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
