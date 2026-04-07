import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { databases, config, storage, ID } from '../../lib/appwrite';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { MapPin, Camera, Building2, FileText, Phone, Hash, X, CheckCircle2 } from 'lucide-react-native';

export default function CadastrarQuadra() {
  const router = useRouter();
  const { usuario } = useAuthContext();
  const toast = useToast();
  
  const [nomeLocal, setNomeLocal] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (Platform.OS === 'web') {
      toast.show({ type, title, message });
    } else {
      const { Alert } = require('react-native');
      Alert.alert(title, message);
    }
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

  const buscarCNPJ = async (cnpjBuscado: string) => {
    const limpo = cnpjBuscado.replace(/\D/g, '');
    if (limpo.length !== 14) return;
    
    setLoading(true);
    try {
      const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`);
      const data = await resp.json();
      
      if (resp.ok) {
        setRazaoSocial(data.razao_social || '');
        if (data.cep) {
           const c = maskCEP(data.cep);
           setCep(c);
        }
        if (data.logradouro) {
           setEndereco(`${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.municipio} - ${data.uf}`);
        }
        if (data.ddd_telefone_1) {
           setTelefone(maskPhone(data.ddd_telefone_1));
        }
        showFeedback('success', 'CNPJ Validado!', `Encontrado: ${data.razao_social}`);
      } else {
        showFeedback('error', 'CNPJ Inválido', 'Não encontramos dados para este CNPJ.');
      }
    } catch (e) {
      console.error(e);
      showFeedback('error', 'Erro de consulta', 'Não foi possível validar o CNPJ agora.');
    } finally {
      setLoading(false);
    }
  };

  const buscarCEP = async (cepBuscado: string) => {
    const limpo = cepBuscado.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await resp.json();
      if (!data.erro) {
        setEndereco(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
      }
    } catch (e) {
      console.error(e);
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
    for (const uri of fotos) {
      try {
        const fileId = ID.unique();
        const extension = uri.split('.').pop() || 'jpg';
        const name = `quadra_${userId}_${Date.now()}.${extension}`;
        
        let urlResult = '';

        if (Platform.OS === 'web') {
          // O react-native-appwrite falha na web (expo-file-system error).
          // Contornamos com um Fetch puro com Token JWT do próprio usuário!
          const { account } = require('../../lib/appwrite'); // import lazy
          const jwtResponse = await account.createJWT();
          
          const res = await fetch(uri);
          const blob = await res.blob();
          const fileToUpload = new File([blob], name, { type: blob.type || `image/${extension}` });
          
          const formData = new FormData();
          formData.append('fileId', fileId);
          formData.append('file', fileToUpload);

          const uploadRes = await fetch(`${config.endpoint}/storage/buckets/${config.storageId}/files`, {
            method: 'POST',
            headers: {
              'X-Appwrite-Project': config.projectId,
              'X-Appwrite-JWT': jwtResponse.jwt,
            },
            body: formData,
          });

          if (!uploadRes.ok) {
             const errorData = await uploadRes.json();
             throw new Error(errorData.message || 'Falha no Rest Upload');
          }

          urlResult = storage.getFileView(config.storageId, fileId).toString();
        } else {
          // Native Mobile
          const fileToUpload = {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: name,
            type: `image/${extension}`,
            size: 0,
          };
          await storage.createFile(config.storageId, fileId, fileToUpload as any);
          urlResult = storage.getFileView(config.storageId, fileId).toString();
        }

        urls.push(urlResult);
      } catch (e) {
        console.error('Erro no upload da foto', e);
      }
    }
    return urls;
  };

  const handleCadastrar = async () => {
    if (!usuario) return;
    if (!nomeLocal) return showFeedback('info', 'Aviso', 'Informe o Nome do Local / Arena');
    if (!cnpj || cnpj.length < 14) return showFeedback('info', 'Aviso', 'Informe um CNPJ válido');
    if (!cep || cep.length < 8) return showFeedback('info', 'Aviso', 'Informe um CEP válido');
    if (!endereco) return showFeedback('info', 'Aviso', 'Informe o Endereço Completo');
    if (fotos.length < 1) return showFeedback('info', 'Aviso', 'Adicione pelo menos 1 foto da sua quadra');

    setLoading(true);
    
    try {
      const urlsFotos = await uploadImages(usuario.id_usuario);
      
      await databases.createDocument(
        config.databaseId,
        config.collections.quadras,
        ID.unique(),
        {
          id_organizador: usuario.id_usuario,
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

      showFeedback('success', 'Sucesso!', 'Sua quadra foi cadastrada e está em análise.');
      setTimeout(() => router.replace('/quadras'), 2000);
    } catch (e: any) {
      showFeedback('error', 'Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="bg-white px-6 pt-16 pb-6 border-b border-gray-100 shadow-sm shadow-black/5">
        <Text className="text-2xl font-bold text-gray-800">Nova Quadra</Text>
        <Text className="text-base text-gray-400 mt-1">Preencha os dados do seu estabelecimento</Text>
      </View>

      <View className="p-6">
        {/* Basic Info Section */}
        <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-4 shadow-sm shadow-black/5">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Informações Básicas</Text>
          
          <View className="flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 mb-3 bg-gray-50">
            <Building2 size={20} color="#9CA3AF" />
            <TextInput 
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Nome do Local (Ex: Arena Soccer)" 
              value={nomeLocal} 
              onChangeText={setNomeLocal} 
            />
          </View>

          <View className="flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 mb-3 bg-gray-50">
            <Hash size={20} color="#9CA3AF" />
            <TextInput 
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="CNPJ" 
              value={cnpj} 
              onChangeText={(v) => {
                const masked = maskCNPJ(v);
                setCnpj(masked);
                if (masked.replace(/\D/g, '').length === 14) {
                   buscarCNPJ(masked);
                }
              }} 
              keyboardType="numeric" 
            />
          </View>

          <View className="flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 bg-gray-50">
            <FileText size={20} color="#9CA3AF" />
            <TextInput 
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Razão Social" 
              value={razaoSocial} 
              onChangeText={setRazaoSocial} 
            />
          </View>
        </View>

        {/* Location Section */}
        <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-4 shadow-sm shadow-black/5">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Localização & Contato</Text>
          
          <View className="flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 mb-3 bg-gray-50">
            <MapPin size={20} color="#9CA3AF" />
            <TextInput 
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="CEP" 
              value={cep} 
              onChangeText={(v) => {
                const m = maskCEP(v);
                setCep(m);
                if (m.length === 9) buscarCEP(m);
              }} 
              keyboardType="numeric" 
            />
          </View>

          <View className="flex-row items-start border border-gray-100 rounded-2xl px-4 py-3.5 mb-3 bg-gray-50 min-h-[80px]">
            <MapPin size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
            <TextInput 
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Endereço Completo" 
              value={endereco} 
              onChangeText={setEndereco}
              multiline
            />
          </View>

          <View className="flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 bg-gray-50">
            <Phone size={20} color="#9CA3AF" />
            <TextInput 
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Telefone Comercial" 
              value={telefone} 
              onChangeText={(v) => setTelefone(maskPhone(v))} 
              keyboardType="phone-pad" 
            />
          </View>
        </View>

        {/* Photos Section */}
        <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-6 shadow-sm shadow-black/5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider">Fotos do Local</Text>
            <Text className="text-xs text-gray-400 font-bold">{fotos.length}/8</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {fotos.map((f, i) => (
              <View key={i} className="mr-3 relative">
                <Image source={{ uri: f }} className="w-24 h-24 rounded-2xl" />
                <TouchableOpacity 
                  onPress={() => removeFoto(i)}
                  className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full justify-center items-center border-2 border-white"
                >
                  <X size={14} color="white" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ))}
            
            {fotos.length < 8 && (
              <TouchableOpacity 
                onPress={pickImages}
                className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 justify-center items-center"
              >
                <Camera size={24} color="#9CA3AF" />
                <Text className="text-[10px] text-gray-400 font-bold mt-1">ADICIONAR</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text className="text-xs text-gray-400 mt-3 italic">* Adicione fotos da fachada, vestiário e da própria quadra.</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity 
          className={`flex-row justify-center items-center rounded-3xl py-4 mb-4 ${loading ? 'bg-gray-300' : 'bg-[#00C853]'}`}
          onPress={handleCadastrar} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CheckCircle2 size={20} color="white" className="mr-2" strokeWidth={2.5} />
              <Text className="text-white font-bold text-lg ml-2">Salvar Quadra</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="py-4 items-center"
          onPress={() => router.back()} 
          disabled={loading}
        >
          <Text className="text-gray-400 font-bold text-base">Cancelar e voltar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
