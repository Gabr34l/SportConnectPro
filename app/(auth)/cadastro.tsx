import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { account, databases, config, storage, ID } from '../../lib/appwrite';
import { useToast } from '../../components/Toast';
import { useAuthContext } from '../../contexts/AuthContext';
import { TipoPerfil } from '../../types';
import { 
  User, 
  Mail, 
  Lock, 
  ChevronRight, 
  ChevronLeft, 
  Trophy, 
  Gamepad2, 
  Building2, 
  MapPin, 
  Phone, 
  Camera, 
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';

export default function Cadastro() {
  const router = useRouter();
  const toast = useToast();
  const { session, usuario, refreshUsuario } = useAuthContext();
  const [step, setStep] = useState(0);
  const [perfil, setPerfil] = useState<TipoPerfil | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (signupSuccess && session && usuario) {
      router.replace('/');
    }
  }, [signupSuccess, session, usuario]);
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  
  const [loading, setLoading] = useState(false);

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    toast.show({ type, title, message });
  };


  const handleCadastrar = async () => {
    const limpoEmail = email.trim();
    if (!nome || !limpoEmail || !senha) {
      showFeedback('info', 'Aviso', 'PREENCHA COM SEUS DADOS');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Limpar sessão se estiver "presa" do erro anterior
      try {
        await account.deleteSession('current');
      } catch (_) {}

      // 2. Criar a conta no Appwrite
      const newUser = await account.create(
        ID.unique(),
        limpoEmail,
        senha,
        nome
      );

      const userId = newUser.$id;

      // 3. Criar uma sessão para poder escrever dados nas coleções
      await account.createEmailPasswordSession(limpoEmail, senha);

      // 3. Criar o perfil extra na coleção 'usuarios'
      await databases.createDocument(
        config.databaseId,
        config.collections.usuarios,
        userId, // usamos o mesmo ID da conta para facilitar
        {
          nome_completo: nome,
          email: email,
          tipo_perfil: perfil,
          interesses: [],
          nivel_habilidade: 'INICIANTE', // default
        }
      );

      showFeedback('success', 'Conta criada!', 'Bem-vindo ao SportConnect Pro!');

      // Atualizar o contexto global após login automático
      await refreshUsuario(userId);
      setSignupSuccess(true);
      
    } catch (e: any) {
      console.error('Erro no cadastro:', e);
      
      let errorMessage = 'Ocorreu um erro inesperado';
      
      // Tratamento específico para e-mail já cadastrado
      if (e.code === 409 || e.type === 'user_already_exists' || (e.message && e.message.includes('already exists'))) {
        errorMessage = 'Já existe um usuário vinculado a este e-mail. Tente fazer login.';
      } else if (e.message) {
        errorMessage = e.message;
      }

      showFeedback('error', 'Ops!', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-white" 
      contentContainerStyle={{ padding: 24, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' }}
      showsVerticalScrollIndicator={false}
    >
      {step === 0 && (
        <View className="flex-1 justify-center">
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-[#00C853] rounded-[30px] justify-center items-center shadow-lg shadow-green-500/40">
              <Trophy color="white" size={40} strokeWidth={2.5} />
            </View>
            <Text className="text-3xl font-black text-gray-800 mt-6 text-center">
              Como você quer usar o app?
            </Text>
            <Text className="text-base text-gray-400 mt-2 text-center">Escolha seu perfil para continuar</Text>
          </View>

          <TouchableOpacity 
            className={`border-2 rounded-[32px] p-6 mb-4 flex-row items-center ${perfil === 'JOGADOR' ? 'border-[#00C853] bg-green-50' : 'border-gray-100 bg-white'}`}
            onPress={() => setPerfil('JOGADOR')}
          >
            <View className={`w-14 h-14 rounded-2xl justify-center items-center ${perfil === 'JOGADOR' ? 'bg-[#00C853]' : 'bg-gray-100'}`}>
              <Gamepad2 color={perfil === 'JOGADOR' ? 'white' : '#9CA3AF'} size={28} />
            </View>
            <View className="ml-5 flex-1">
              <Text className={`text-lg font-bold ${perfil === 'JOGADOR' ? 'text-gray-800' : 'text-gray-500'}`}>Quero Jogar</Text>
              <Text className="text-xs text-gray-400 leading-4">Encontrar partidas e garantir minha vaga</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`border-2 rounded-[32px] p-6 mb-8 flex-row items-center ${perfil === 'ORGANIZADOR' ? 'border-[#00952A] bg-green-50' : 'border-gray-100 bg-white'}`}
            onPress={() => setPerfil('ORGANIZADOR')}
          >
            <View className={`w-14 h-14 rounded-2xl justify-center items-center ${perfil === 'ORGANIZADOR' ? 'bg-[#00952A]' : 'bg-gray-100'}`}>
              <Building2 color={perfil === 'ORGANIZADOR' ? 'white' : '#9CA3AF'} size={28} />
            </View>
            <View className="ml-5 flex-1">
              <Text className={`text-lg font-bold ${perfil === 'ORGANIZADOR' ? 'text-gray-800' : 'text-gray-500'}`}>Quero Organizar</Text>
              <Text className="text-xs text-gray-400 leading-4">Cadastrar minha quadra e criar eventos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`rounded-[24px] py-4 items-center shadow-lg ${!perfil ? 'bg-gray-100' : 'bg-[#00C853] shadow-green-500/30'}`}
            onPress={() => setStep(1)}
            disabled={!perfil}
          >
            <Text className={`font-bold text-lg ${!perfil ? 'text-gray-400' : 'text-white'}`}>Continuar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="mt-6 self-center">
            <Text className="text-gray-400 font-bold">Já tenho uma conta</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 1 && (
        <View className="flex-1 justify-center">
          <TouchableOpacity onPress={() => setStep(0)} className="flex-row items-center mb-6">
            <ChevronLeft size={20} color="#9CA3AF" />
            <Text className="text-gray-400 font-bold ml-1 uppercase text-xs tracking-widest">Perfil: {perfil}</Text>
          </TouchableOpacity>
          
          <Text className="text-3xl font-black text-gray-800 mb-2">Seus Dados</Text>
          <Text className="text-gray-400 mb-8">Partiu começar sua jornada no esporte!</Text>
          
          <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 mb-4">
            <User size={20} color="#9CA3AF" />
            <TextInput 
              className="flex-1 ml-3 text-base text-gray-800" 
              placeholder="Nome Completo" 
              value={nome} 
              onChangeText={setNome} 
            />
          </View>

          <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 mb-4">
            <Mail size={20} color="#9CA3AF" />
            <TextInput 
              className="flex-1 ml-3 text-base text-gray-800" 
              placeholder="E-mail" 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address" 
            />
          </View>

          <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 mb-8">
            <Lock size={20} color="#9CA3AF" />
            <TextInput 
              className="flex-1 ml-3 text-base text-gray-800" 
              placeholder="Senha" 
              value={senha} 
              onChangeText={setSenha} 
              secureTextEntry 
            />
          </View>
          
          <TouchableOpacity 
            className={`rounded-[24px] py-4 items-center shadow-lg ${loading ? 'bg-gray-100' : 'bg-[#00C853] shadow-green-500/30'}`}
            onPress={handleCadastrar} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#00C853" /> : (
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-lg mr-2">Criar Conta</Text>
                <CheckCircle2 color="white" size={20} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
