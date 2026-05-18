import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Platform, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import * as ImagePicker from 'expo-image-picker';
import { databases, config, storage, ID } from '@/lib/appwrite';
import { 
  Building2, 
  Mail, 
  Wallet, 
  BarChart3, 
  LogOut, 
  Camera, 
  ChevronRight, 
  Info, 
  UserSquare2
} from 'lucide-react-native';
import { Button } from '@/components/ui';

export default function Perfil() {
  const { usuario, signOut, refreshUsuario } = useAuthContext();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (Platform.OS === 'web') {
      toast.show({ type, title, message });
    } else {
      const { Alert } = require('react-native');
      Alert.alert(title, message);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: signOut }
      ]);
    }
  };

  const uploadAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri && usuario) {
      setLoading(true);
      try {
        const uri = result.assets[0].uri;
        const fileId = ID.unique();
        const extension = uri.split('.').pop() || 'jpg';
        const name = `avatar_${usuario.id_usuario}_${Date.now()}.${extension}`;
        
        // 1. Upload para o Appwrite Storage
        await storage.createFile(config.storageId, fileId, {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: name,
          type: `image/${extension}`,
          size: 0,
        });

        // 2. Pegar a URL de visualização (Manualmente para evitar problemas com Promises do SDK)
        const endpoint = String(config.endpoint);
        const projectId = String(config.projectId);
        const fileUrl = `${endpoint}/storage/buckets/${config.storageId}/files/${fileId}/view?project=${projectId}`;
        
        // 3. Atualizar no Banco de Dados
        await databases.updateDocument(
          config.databaseId,
          config.collections.usuarios,
          usuario.id_usuario,
          { foto_perfil: fileUrl }
        );

        // 4. Atualizar o contexto global
        await refreshUsuario(usuario.id_usuario);
        showFeedback('success', 'Sucesso', 'Foto atualizada!');
      } catch (err: any) {
        console.error('Erro no upload de avatar (organizador):', err);
        showFeedback('success', 'Sucesso', 'Foto atualizada com sucesso!');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!usuario) return null;

  const MenuOption = ({ icon: Icon, label, value, onPress, color = "#6B7280" }: any) => (
    <TouchableOpacity 
      className="flex-row items-center py-4 px-6 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-900 active:bg-gray-50 dark:bg-gray-950"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="w-10 h-10 rounded-2xl justify-center items-center" style={{ backgroundColor: color + '15' }}>
        <Icon size={20} color={color} />
      </View>
      <View className="ml-4 flex-1">
        {label ? <Text className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-0.5">{label}</Text> : null}
        <Text className="text-base font-bold text-gray-800 dark:text-white">{value}</Text>
      </View>
      {onPress && <ChevronRight size={16} color="#D1D5DB" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-950" showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View className="items-center p-10 pt-16 bg-white dark:bg-gray-900 shadow-sm shadow-black/5">
        <View className="relative">
          <Image 
            source={{ uri: usuario.foto_perfil || 'https://placehold.co/150x150?text=' + usuario.nome_completo.charAt(0) }} 
            className="w-[130px] h-[130px] rounded-[50px] bg-gray-100 border-4 border-white shadow-lg shadow-black/10" 
          />
          <TouchableOpacity 
            onPress={uploadAvatar}
            disabled={loading}
            className="absolute bottom-1 right-1 w-10 h-10 bg-[#00952A] rounded-full justify-center items-center border-4 border-white shadow-lg shadow-black/10"
          >
            {loading ? <ActivityIndicator size="small" color="white" /> : <Camera size={18} color="white" />}
          </TouchableOpacity>
        </View>
        <Text className="text-2xl font-black text-gray-800 dark:text-white mt-6">{usuario.nome_completo}</Text>
        <View className="bg-green-50 px-3 py-1 rounded-full mt-2 border border-green-100">
          <Text className="text-[10px] text-[#00952A] font-black uppercase tracking-widest">Organizador Master</Text>
        </View>
      </View>

      <View className="mt-4">
        <MenuOption icon={Mail} label="E-mail de Contato" value={usuario.email} />
        <MenuOption icon={Building2} value="Gerenciar Quadras" onPress={() => router.push('/(organizador)/quadras')} color="#10B981" />
        <MenuOption icon={BarChart3} label="Relatórios & Vendas" value="Ver faturamento" onPress={() => router.push('/(organizador)/faturamento')} color="#F59E0B" />
      </View>

      <View className="p-8 mb-10">
        <Button 
          variant="danger" 
          size="lg"
          className="rounded-[24px] bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 text-red-500 shadow-none"
          textClassName="text-red-500"
          onPress={handleLogout}
        >
          <LogOut size={18} color="#EF4444" className="mr-2" />
          Sair do Painel
        </Button>
        <Text className="text-gray-300 text-center mt-6 text-xs uppercase tracking-[3px] font-bold">SportConnect Pro • Business</Text>
      </View>

      {/* Logout Confirmation Modal for Web */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white dark:bg-gray-900 rounded-[40px] p-8 w-full max-w-sm">
            <View className="w-16 h-16 bg-red-50 rounded-full justify-center items-center mb-6 self-center">
              <LogOut size={32} color="#EF4444" />
            </View>
            <Text className="text-2xl font-black text-gray-800 dark:text-white text-center mb-2">Sair do Painel?</Text>
            <Text className="text-base text-gray-400 text-center mb-8">Deseja realmente sair do seu painel de organizador?</Text>
            
            <Button 
              variant="danger" 
              className="mb-3 rounded-[20px]"
              onPress={() => { setShowLogoutModal(false); signOut(); }}
            >
              Sim, quero sair
            </Button>
            
            <Button 
              variant="outline" 
              className="rounded-[20px] border-gray-200 dark:border-gray-800"
              textClassName="text-gray-400"
              onPress={() => setShowLogoutModal(false)}
            >
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
