import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases, config } from '../../../lib/appwrite';
import { Quadra } from '../../../types';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, ChevronLeft, Plus, Trash2, Edit3, Settings, Share2, Info, X, CheckCircle2 } from 'lucide-react-native';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/Toast';

const COMODIDADES_LIST = ['Vestiário', 'Estacionamento', 'Bar/Cantina', 'Wi-Fi', 'Iluminação', 'Bolas/Coletes', 'Churrasqueira'];

export default function DetalhesQuadra() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  
  const [quadra, setQuadra] = useState<Quadra | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal Stats
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempDescricao, setTempDescricao] = useState('');
  const [tempComodidades, setTempComodidades] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchQuadra();
  }, [id]);

  const fetchQuadra = async () => {
    try {
      const doc = await databases.getDocument(config.databaseId, config.collections.quadras, id as string);
      const data = { ...doc, id_quadra: doc.$id } as unknown as Quadra;
      setQuadra(data);
      setTempDescricao(data.descricao || '');
      setTempComodidades(data.comodidades || []);
    } catch (e) {
      console.error('Erro ao buscar quadra:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = Platform.OS === 'web' ? window.location.href : `sportconnectpro://quadra/${id}`;
      await Share.share({
        message: `Confira esta quadra no SportConnect Pro: ${quadra?.nome_local}\nLocal: ${quadra?.endereco_completo}\nLink: ${url}`,
        url: url
      });
    } catch (error: any) {
      toast.show({ type: 'error', title: 'Erro', message: 'Não foi possível compartilhar' });
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      // Usamos try-catch interno para ignorar erros se os campos (descricao/comodidades) não existirem no banco
      const updateData: any = {};
      if (tempDescricao !== undefined) updateData.descricao = tempDescricao;
      if (tempComodidades !== undefined) updateData.comodidades = tempComodidades;

      await databases.updateDocument(
        config.databaseId, 
        config.collections.quadras, 
        id as string, 
        updateData
      );
      
      toast.show({ type: 'success', title: 'Sucesso', message: 'Quadra atualizada!' });
      setEditModalVisible(false);
      fetchQuadra();
    } catch (e: any) {
      console.error('Erro ao atualizar:', e);
      // Se der erro de atributo inexistente, avisamos de forma sutil
      if (e.message?.includes('attribute')) {
         toast.show({ 
           type: 'info', 
           title: 'Aviso do Banco', 
           message: 'Alguns campos (descrição/comodidades) precisam ser criados no Appwrite Console.' 
         });
      } else {
         toast.show({ type: 'error', title: 'Erro', message: 'Falha ao salvar alterações.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleComodidade = (item: string) => {
    setTempComodidades(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleDelete = async () => {
    const confirmDelete = Platform.OS === 'web' 
      ? confirm('Deseja realmente excluir esta quadra?') 
      : await new Promise(resolve => Alert.alert('Excluir', 'Confirmar exclusão?', [{text: 'Não'}, {text: 'Sim', onPress: () => resolve(true)}]));
    
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      await databases.deleteDocument(config.databaseId, config.collections.quadras, id as string);
      router.back();
    } catch (e) {
      toast.show({ type: 'error', title: 'Erro', message: 'Não foi possível excluir.' });
      setLoading(false);
    }
  };

  if (loading) return (
    <View className="flex-1 bg-white justify-center items-center">
      <ActivityIndicator size="large" color="#00C853" />
    </View>
  );

  if (!quadra) return (
    <View className="flex-1 bg-white justify-center items-center p-8">
      <Text className="text-gray-400 mb-6">Quadra não encontrada.</Text>
      <TouchableOpacity onPress={() => router.back()} className="bg-[#00C853] px-6 py-3 rounded-2xl">
        <Text className="text-white font-bold">Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  const fotoPrincipal = Array.isArray(quadra.fotos) && quadra.fotos.length > 0 ? quadra.fotos[0] : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200';

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header Visual */}
        <View className="relative h-[400px]">
          <Image source={{ uri: fotoPrincipal }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']} className="absolute inset-0" />
          
          <View className="flex-row justify-between items-center px-6 pt-16">
            <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl justify-center items-center">
              <ChevronLeft color="white" size={24} />
            </TouchableOpacity>
            
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={handleShare} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl justify-center items-center">
                <Share2 color="white" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <View className="absolute bottom-10 px-8 w-full">
            <StatusBadge status={quadra.status_aprovacao} />
            <Text className="text-4xl font-black text-white mt-4">{quadra.nome_local}</Text>
            <View className="flex-row items-center mt-2 opacity-80">
              <MapPin size={18} color="white" />
              <Text className="text-white text-sm ml-2 font-medium" numberOfLines={1}>{quadra.endereco_completo}</Text>
            </View>
          </View>
        </View>

        {/* Dash Content */}
        <View className="-mt-6 bg-gray-50 rounded-t-[40px] px-8 pt-10 pb-32">
          
          {/* Action Bar */}
          <View className="bg-white p-2 rounded-[32px] flex-row mb-10 shadow-xl shadow-black/5 border border-gray-100">
            <TouchableOpacity 
              className="flex-1 bg-green-50 rounded-[28px] py-4 items-center justify-center"
              onPress={() => router.push({ pathname: '/(organizador)/criar-evento', params: { quadraId: quadra.id_quadra } })}
            >
              <Plus color="#00C853" size={24} strokeWidth={3} />
              <Text className="text-[#00C853] font-bold text-xs uppercase tracking-wider mt-2">Criar Evento</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 rounded-[28px] py-4 items-center justify-center"
              onPress={() => setEditModalVisible(true)}
            >
              <Edit3 color="#4B5563" size={24} />
              <Text className="text-gray-600 font-bold text-xs uppercase tracking-wider mt-2">Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 rounded-[28px] py-4 items-center justify-center" onPress={handleDelete}>
              <Trash2 color="#EF4444" size={24} />
              <Text className="text-red-500 font-bold text-xs uppercase tracking-wider mt-2">Excluir</Text>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View className="mb-10">
            <View className="flex-row items-center mb-6">
              <View className="w-1.5 h-6 bg-[#00C853] rounded-full mr-3" />
              <Text className="text-xl font-black text-gray-800">Sobre o Local</Text>
            </View>
            <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm shadow-black/5">
              <Text className="text-gray-500 text-base leading-7 font-medium">
                {quadra.descricao || 'Nenhuma descrição detalhada fornecida para este local. Clique em Editar para adicionar detalhes que atraiam mais jogadores!'}
              </Text>
            </View>
          </View>

          {/* Dynamic Amenities */}
          <View>
             <Text className="text-xl font-black text-gray-800 mb-6 px-2">Comodidades</Text>
             <View className="flex-row flex-wrap gap-3">
               {quadra.comodidades && quadra.comodidades.length > 0 ? (
                 quadra.comodidades.map((item) => (
                   <View key={item} className="bg-white border border-[#00C853]/20 px-5 py-3 rounded-2xl shadow-sm shadow-black/5">
                     <Text className="text-gray-800 font-bold text-sm tracking-tight">{item}</Text>
                   </View>
                 ))
               ) : (
                 <Text className="text-gray-400 italic px-2">Nenhuma comodidade selecionada.</Text>
               )}
             </View>
          </View>
        </View>
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white w-full h-[85%] rounded-t-[50px] overflow-hidden">
            <View className="flex-row justify-between items-center p-8 border-b border-gray-100">
               <Text className="text-2xl font-black text-gray-800">Editar Detalhes</Text>
               <TouchableOpacity onPress={() => setEditModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                 <X size={24} color="#9CA3AF" />
               </TouchableOpacity>
            </View>

            <ScrollView className="p-8">
              <Text className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-4">Descrição Principal</Text>
              <TextInput 
                className="bg-gray-50 p-6 rounded-[32px] text-gray-800 min-h-[150px] text-base border border-gray-100"
                multiline
                placeholder="Descreva seu espaço, diferenciais, etc..."
                placeholderTextColor="#9CA3AF"
                value={tempDescricao}
                onChangeText={setTempDescricao}
              />

              <Text className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-8 mb-4">Comodidades (Selecione)</Text>
              <View className="flex-row flex-wrap gap-3 mb-20">
                {COMODIDADES_LIST.map((item) => {
                  const active = tempComodidades.includes(item);
                  return (
                    <TouchableOpacity 
                      key={item} 
                      onPress={() => toggleComodidade(item)}
                      className={`px-5 py-3 rounded-2xl border ${active ? 'bg-[#00C853] border-transparent' : 'bg-white border-gray-200'}`}
                    >
                      <Text className={`font-bold text-sm ${active ? 'text-white' : 'text-gray-500'}`}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View className="p-8 border-t border-gray-100 bg-white shadow-2xl">
              <TouchableOpacity 
                className={`w-full py-5 rounded-[28px] items-center flex-row justify-center ${saving ? 'bg-gray-300' : 'bg-[#00C853]'}`}
                onPress={handleUpdate}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text className="text-white font-black text-lg uppercase tracking-widest mr-2">Salvar Alterações</Text>
                    <CheckCircle2 color="white" size={24} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
