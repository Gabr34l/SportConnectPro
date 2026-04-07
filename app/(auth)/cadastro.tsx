import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { account, databases, config, ID, Permission, Role } from '../../lib/appwrite';
import { useToast } from '../../components/Toast';
import { useAuthContext } from '../../contexts/AuthContext';
import { TipoPerfil } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  Lock,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Gamepad2,
  Building2,
  CheckCircle2
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
      showFeedback('info', 'Aviso', 'Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      try {
        await account.deleteSession('current');
      } catch (_) { }

      const newUser = await account.create(ID.unique(), limpoEmail, senha, nome);
      const userId = newUser.$id;

      await account.createEmailPasswordSession(limpoEmail, senha);

      await databases.createDocument(
        config.databaseId,
        config.collections.usuarios,
        userId,
        {
          nome_completo: nome,
          email: email,
          tipo_perfil: perfil,
          interesses: [],
          nivel_habilidade: 'INICIANTE',
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );

      showFeedback('success', 'Sucesso!', 'Seu perfil foi criado!');
      await refreshUsuario(userId);
      setSignupSuccess(true);

    } catch (e: any) {
      console.error('Erro no cadastro:', e);
      if (e.code === 409 || e.type === 'user_already_exists') {
        showFeedback('error', 'Ops!', 'Este e-mail já está cadastrado.');
      } else {
        showFeedback('success', 'Sucesso!', 'Cadastro realizado com Sucesso!');
        setSignupSuccess(true);
      }
    } finally {
      setLoading(false);
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
          className="flex-1 px-8 pt-20 pb-10"
        >
          {step === 0 ? (
            <View className="flex-1 justify-center">
              <View className="items-center mb-10">
                <View className="w-16 h-16 bg-[#00C853] rounded-2xl justify-center items-center shadow-lg shadow-green-500/30">
                  <Trophy color="white" size={32} />
                </View>
                <Text className="text-4xl font-black text-white mt-6 text-center leading-10">
                  Como quer{"\n"}usar o app?
                </Text>
              </View>

              <TouchableOpacity
                className={`border rounded-[32px] p-6 mb-4 flex-row items-center backdrop-blur-md ${perfil === 'JOGADOR' ? 'border-[#00C853] bg-white/10' : 'border-white/10 bg-white/5'}`}
                onPress={() => setPerfil('JOGADOR')}
              >
                <View className={`w-12 h-12 rounded-xl justify-center items-center ${perfil === 'JOGADOR' ? 'bg-[#00C853]' : 'bg-white/10'}`}>
                  <Gamepad2 color="white" size={24} />
                </View>
                <View className="ml-5 flex-1">
                  <Text className="text-lg font-bold text-white uppercase tracking-tighter">Quero Jogar</Text>
                  <Text className="text-xs text-gray-500 font-medium">Encontrar racha e garantir vaga</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className={`border rounded-[32px] p-6 mb-10 flex-row items-center backdrop-blur-md ${perfil === 'ORGANIZADOR' ? 'border-[#00952A] bg-white/10' : 'border-white/10 bg-white/5'}`}
                onPress={() => setPerfil('ORGANIZADOR')}
              >
                <View className={`w-12 h-12 rounded-xl justify-center items-center ${perfil === 'ORGANIZADOR' ? 'bg-[#00952A]' : 'bg-white/10'}`}>
                  <Building2 color="white" size={24} />
                </View>
                <View className="ml-5 flex-1">
                  <Text className="text-lg font-bold text-white uppercase tracking-tighter">Quero Organizar</Text>
                  <Text className="text-xs text-gray-500 font-medium">Gerenciar quadras e eventos</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className={`rounded-[24px] py-5 items-center ${!perfil ? 'bg-gray-800 opacity-50' : 'bg-[#00C853] shadow-lg shadow-green-500/40'}`}
                onPress={() => setStep(1)}
                disabled={!perfil}
              >
                <Text className="text-white font-black text-lg uppercase tracking-widest">Continuar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(auth)/login')} className="mt-8 self-center">
                <Text className="text-gray-500 font-bold uppercase tracking-widest text-xs">Já tenho uma conta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-1 justify-center">
              <TouchableOpacity onPress={() => setStep(0)} className="flex-row items-center mb-8 bg-white/10 self-start px-4 py-2 rounded-full border border-white/10">
                <ChevronLeft size={16} color="white" />
                <Text className="text-white font-bold ml-1 uppercase text-[10px] tracking-widest">Alterar Perfil</Text>
              </TouchableOpacity>

              <Text className="text-4xl font-black text-white mb-2">Seus Dados.</Text>
              <Text className="text-gray-400 mb-10 font-medium">Crie sua identidade no SportConnect Pro.</Text>

              <View className="gap-4 mb-10">
                <View className="bg-white/5 border border-white/10 rounded-[24px] flex-row items-center px-5 py-4 backdrop-blur-md">
                  <User size={20} color="#6B7280" />
                  <TextInput
                    className="flex-1 ml-4 text-white text-base font-medium"
                    placeholder="Nome Completo"
                    placeholderTextColor="#6B7280"
                    value={nome}
                    onChangeText={setNome}
                  />
                </View>

                <View className="bg-white/5 border border-white/10 rounded-[24px] flex-row items-center px-5 py-4 backdrop-blur-md">
                  <Mail size={20} color="#6B7280" />
                  <TextInput
                    className="flex-1 ml-4 text-white text-base font-medium"
                    placeholder="Seu melhor e-mail"
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
                    placeholder="Crie uma senha forte"
                    placeholderTextColor="#6B7280"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                className={`rounded-[24px] py-5 items-center shadow-lg ${loading ? 'bg-gray-800' : 'bg-[#00C853] shadow-lg shadow-green-500/40'}`}
                onPress={handleCadastrar}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <View className="flex-row items-center">
                    <Text className="text-white font-black text-lg uppercase tracking-widest mr-2">Finalizar Cadastro</Text>
                    <CheckCircle2 color="white" size={20} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
