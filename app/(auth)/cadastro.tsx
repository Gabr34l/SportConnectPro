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
  
  const [nomeLocal, setNomeLocal] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    toast.show({ type, title, message });
  };

  const maskCNPJ = (val: string) => {
    return val.replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const maskCEP = (val: string) => {
    return val.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
  };

  const maskPhone = (val: string) => {
    return val.replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const buscarCEP = async (cepBuscado: string) => {
    const limpo = cepBuscado.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    
    setEndereco('Buscando endereço...');
    
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await resp.json();
      if (!data.erro) {
        setEndereco(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
      } else {
        setEndereco('');
        showFeedback('info', 'CEP não encontrado', 'Verifique o número ou preencha o endereço manualmente.');
      }
    } catch (e) {
      console.error(e);
      setEndereco('');
      showFeedback('error', 'Erro na Busca', 'Não foi possível buscar o CEP agora.');
    }
  };

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.7,
    });

    if (!result.canceled) {
      const novosUris = result.assets.map(a => a.uri);
      const total = fotos.length + novosUris.length;
      if (total > 8) {
        showFeedback('info', 'Aviso', 'Máximo de 8 fotos permitidas');
        return;
      }
      setFotos([...fotos, ...novosUris]);
    }
  };

  const removeFoto = (index: number) => {
    const novas = [...fotos];
    novas.splice(index, 1);
    setFotos(novas);
  };

  const uploadImages = async (userId: string) => {
    const urls: string[] = [];
    if (!config.storageId) {
      console.error('Bucket de storage não configurado.');
      return urls;
    }

    for (const uri of fotos) {
      try {
        const fileId = ID.unique();
        const extension = uri.split('.').pop() || 'jpg';
        const name = `quadra_${userId}_${Date.now()}.${extension}`;
        
        await storage.createFile(config.storageId, fileId, {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: name,
          type: `image/${extension}`,
        } as any);

        const url = storage.getFileView(config.storageId, fileId);
        urls.push(url.toString());
      } catch (e) {
        console.error('Erro no upload', e);
      }
    }
    return urls;
  };

  const handleCadastrar = async () => {
    const limpoEmail = email.trim();
    if (!nome || !limpoEmail || !senha) {
      showFeedback('info', 'Aviso', 'PREENCHA COM SEUS DADOS');
      return;
    }
    
    if (perfil === 'ORGANIZADOR') {
      if (!nomeLocal) return showFeedback('info', 'Aviso', 'Informe o Nome do Local');
      if (!cnpj || cnpj.length < 14) return showFeedback('info', 'Aviso', 'Informe um CNPJ válido');
      if (!cep || cep.length < 8) return showFeedback('info', 'Aviso', 'Informe um CEP válido');
      if (!endereco) return showFeedback('info', 'Aviso', 'Informe o Endereço Completo');
      if (fotos.length < 2) return showFeedback('info', 'Aviso', 'Adicione pelo menos 2 fotos da sua quadra');
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

      if (perfil === 'ORGANIZADOR') {
        const urlsFotos = await uploadImages(userId);
        
        await databases.createDocument(
          config.databaseId,
          config.collections.quadras,
          ID.unique(),
          {
            id_organizador: userId,
            nome_local: nomeLocal,
            cnpj: cnpj.replace(/\D/g, ''),
            razao_social: razaoSocial,
            cep: cep.replace(/\D/g, ''),
            endereco_completo: endereco,
            telefone_comercial: telefone.replace(/\D/g, ''),
            fotos: urlsFotos,
            status_aprovacao: 'PENDENTE'
          }
        );

        showFeedback('success', 'Cadastro enviado!', 'Sua conta foi criada e a quadra está em análise.');
      } else {
        showFeedback('success', 'Conta criada!', 'Bem-vindo ao SportConnect Pro!');
      }

      // Atualizar o contexto global após login automático
      await refreshUsuario(userId);
      setSignupSuccess(true);
      
    } catch (e: any) {
      console.error('Erro no cadastro:', e);
      showFeedback('error', 'Ops!', e.message || 'Ocorreu um erro inesperado');
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
          
          {perfil === 'JOGADOR' ? (
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
          ) : (
            <TouchableOpacity 
              className="bg-[#00C853] rounded-[24px] py-4 items-center shadow-lg shadow-green-500/30" 
              onPress={() => {
                if (!nome || !email || !senha) {
                  showFeedback('info', 'Aviso', 'PREENCHA COM SEUS DADOS');
                  return;
                }
                setStep(2);
              }}
            >
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-lg mr-2">Dados da Quadra</Text>
                <ChevronRight color="white" size={20} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {step === 2 && perfil === 'ORGANIZADOR' && (
        <View className="flex-1 justify-center">
          <TouchableOpacity onPress={() => setStep(1)} className="flex-row items-center mb-6">
            <ChevronLeft size={20} color="#9CA3AF" />
            <Text className="text-gray-400 font-bold ml-1 uppercase text-xs tracking-widest">Meus Dados</Text>
          </TouchableOpacity>

          <Text className="text-3xl font-black text-gray-800 mb-2">Sua Quadra</Text>
          <Text className="text-gray-400 mb-8">Quase lá! Agora os dados do local.</Text>

          <View className="gap-3">
             <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 mb-1">
                <Building2 size={20} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-base" placeholder="Nome do Local" value={nomeLocal} onChangeText={setNomeLocal} />
             </View>
             <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 mb-1">
                <AlertCircle size={20} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-base" placeholder="CNPJ" value={cnpj} onChangeText={(v) => setCnpj(maskCNPJ(v))} keyboardType="numeric" />
             </View>
             <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 mb-1">
                <MapPin size={20} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-base" placeholder="CEP" value={cep} onChangeText={(v) => {
                  const m = maskCEP(v);
                  setCep(m);
                  if (m.length === 9) buscarCEP(m);
                }} keyboardType="numeric" />
             </View>
             <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 mb-1">
                <Phone size={20} color="#9CA3AF" />
                <TextInput className="flex-1 ml-3 text-base" placeholder="Telefone Comercial" value={telefone} onChangeText={(v) => setTelefone(maskPhone(v))} keyboardType="phone-pad" />
             </View>
          </View>
          
          <Text className="text-sm font-bold text-gray-400 mt-6 mb-4 uppercase tracking-widest">Fotos (Mínimo 2): {fotos.length}/8</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
            {fotos.map((f, i) => (
              <View key={i} className="mr-3 relative">
                <Image source={{ uri: f }} className="w-20 h-20 rounded-2xl" />
                <TouchableOpacity onPress={() => removeFoto(i)} className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full justify-center items-center border-2 border-white">
                  <X size={12} color="white" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ))}
            {fotos.length < 8 && (
              <TouchableOpacity className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-100 justify-center items-center" onPress={pickImages}>
                <Camera size={24} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity 
            className={`rounded-[24px] py-4 items-center shadow-lg ${loading ? 'bg-gray-100' : 'bg-[#00C853] shadow-green-500/30'}`}
            onPress={handleCadastrar} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#00C853" /> : (
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-lg mr-2">Enviar para Análise</Text>
                <CheckCircle2 color="white" size={20} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
