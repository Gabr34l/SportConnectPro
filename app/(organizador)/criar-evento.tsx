import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { databases, config, Query, ID } from '../../lib/appwrite';
import { SPORTS, FORMATOS, AMBIENTES, NIVEIS } from '../../constants/sports';
import { useAuthContext } from '../../contexts/AuthContext';
import { useQuadras } from '../../hooks/useQuadras';
import { useToast } from '../../components/Toast';
import { Quadra } from '../../types';
import * as LucideIcons from 'lucide-react-native';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  LayoutGrid,
  Leaf,
  BicepsFlexed,
  LayoutDashboard
} from 'lucide-react-native';

export default function CriarEvento() {
  const router = useRouter();
  const { usuario } = useAuthContext();
  const { fetchQuadrasOrganizador } = useQuadras();
  const toast = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [quadrasAprovadas, setQuadrasAprovadas] = useState<Quadra[]>([]);
  
  // Form State
  const [idQuadra, setIdQuadra] = useState('');
  const [titulo, setTitulo] = useState('');
  const [esporte, setEsporte] = useState(SPORTS[0].id);
  const [formato, setFormato] = useState(FORMATOS[0]);
  const [ambiente, setAmbiente] = useState(AMBIENTES[0]);
  const [nivel, setNivel] = useState(NIVEIS[0]);
  
  const [dataEvento, setDataEvento] = useState(''); // YYYY-MM-DD
  const [horaInicio, setHoraInicio] = useState(''); // HH:MM
  const [horaFim, setHoraFim] = useState(''); // HH:MM
  
  const [vagas, setVagas] = useState('12');
  const [preco, setPreco] = useState('0.00');

  useEffect(() => {
    if (usuario) {
      fetchQuadrasOrganizador(usuario.id_usuario).then(qs => {
        const aps = qs.filter(q => q.status_aprovacao === 'APROVADO');
        setQuadrasAprovadas(aps);
        if (aps.length > 0) setIdQuadra(aps[0].id_quadra);
      });
    }
  }, [usuario]);

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (Platform.OS === 'web') {
      toast.show({ type, title, message });
    } else {
      const { Alert } = require('react-native');
      Alert.alert(title, message);
    }
  };

  const handleMaskData = (v: string) => {
    return v.replace(/\D/g, '')
      .replace(/^(\d{4})(\d)/, '$1-$2')
      .replace(/^(\d{4})(\d{2})(\d)/, '$1-$2-$3')
      .substring(0, 10);
  };

  const handleMaskHora = (v: string) => {
    return v.replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1:$2')
      .substring(0, 5);
  };

  const parsePreco = () => parseFloat(preco.replace(',', '.')) || 0;
  const parseVagas = () => parseInt(vagas) || 12;

  const handlePublicar = async () => {
    if (!usuario) return;
    setLoading(true);
    
    try {
      await databases.createDocument(
        config.databaseId,
        config.collections.eventos,
        ID.unique(),
        {
          id_organizador: usuario.id_usuario,
          id_quadra: idQuadra,
          titulo: titulo || 'Jogo Amistoso',
          esporte,
          formato_jogo: formato,
          tipo_ambiente: ambiente,
          preco_por_vaga: parsePreco(),
          data_evento: dataEvento,
          horario_inicio: horaInicio + ':00',
          horario_fim: horaFim + ':00',
          limite_participantes: parseVagas(),
          nivel_requerido: nivel,
          status: 'ABERTO'
        }
      );

      showFeedback('success', 'Evento Criado!', 'Seu evento já está disponível para os jogadores.');
      setTimeout(() => router.replace('/(organizador)'), 2000);
    } catch (e: any) {
      showFeedback('error', 'Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  const QuadraNome = quadrasAprovadas.find(q => q.id_quadra === idQuadra)?.nome_local;

  const StepIndicator = () => (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100 mb-6">
      {[1, 2, 3, 4].map((s) => (
        <View key={s} className="flex-row items-center">
          <View 
            className={`w-8 h-8 rounded-full justify-center items-center ${
              step >= s ? 'bg-[#00C853]' : 'bg-gray-100'
            }`}
          >
            {step > s ? (
              <CheckCircle2 color="white" size={16} strokeWidth={2.5} />
            ) : (
              <Text className={`font-bold ${step >= s ? 'text-white' : 'text-gray-400'}`}>{s}</Text>
            )}
          </View>
          {s < 4 && (
            <View 
              className={`w-12 h-0.5 mx-2 rounded-full ${
                step > s ? 'bg-[#00C853]' : 'bg-gray-100'
              }`}
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-16 pb-6 shadow-sm shadow-black/5">
        <Text className="text-2xl font-bold text-gray-800">Criar Evento</Text>
        <Text className="text-base text-gray-400 mt-1">Siga as etapas para publicar</Text>
      </View>

      <StepIndicator />

      <ScrollView className="flex-1 px-6 pb-20" showsVerticalScrollIndicator={false}>
        
        {step === 1 && (
          <View>
            <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-4 shadow-sm shadow-black/5">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Escolha a Quadra</Text>
              <View className="gap-2">
                {quadrasAprovadas.map(q => (
                  <TouchableOpacity 
                    key={q.id_quadra} 
                    className={`flex-row items-center px-4 py-3.5 rounded-2xl border ${
                      idQuadra === q.id_quadra ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 border-gray-100'
                    }`}
                    onPress={() => setIdQuadra(q.id_quadra)}
                  >
                    <Building2 size={20} color={idQuadra === q.id_quadra ? "#00C853" : "#9CA3AF"} />
                    <Text className={`ml-3 text-base font-semibold ${idQuadra === q.id_quadra ? 'text-[#00C853]' : 'text-gray-500'}`}>
                      {q.nome_local}
                    </Text>
                  </TouchableOpacity>
                ))}
                {quadrasAprovadas.length === 0 && (
                  <Text className="text-gray-400 italic text-center p-4">Nenhuma quadra disponível</Text>
                )}
              </View>

              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider my-4">Título & Esporte</Text>
              <View className="flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 mb-3 bg-gray-50">
                <LayoutDashboard size={20} color="#9CA3AF" />
                <TextInput 
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="Ex: Racha de Sexta" 
                  value={titulo} 
                  onChangeText={setTitulo} 
                />
              </View>

              <View className="flex-row flex-wrap gap-2">
                {SPORTS.map(s => {
                  const Icon = (LucideIcons as any)[s.iconName] || LucideIcons.Activity;
                  const isSelected = esporte === s.id;
                  return (
                    <TouchableOpacity 
                      key={s.id} 
                      className={`flex-row items-center px-3.5 py-2.5 rounded-2xl border ${
                        isSelected ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 border-gray-100'
                      }`}
                      onPress={() => setEsporte(s.id)}
                    >
                      <Icon size={16} color={isSelected ? "#00C853" : "#9CA3AF"} />
                      <Text className={`ml-2 text-sm font-bold ${isSelected ? 'text-[#00C853]' : 'text-gray-500'}`}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-8 shadow-sm shadow-black/5">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Mais Detalhes</Text>
              
              <Text className="text-xs font-bold text-gray-300 mb-2">FORMATO</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {FORMATOS.map(f => (
                  <TouchableOpacity 
                    key={f} 
                    className={`px-4 py-2.5 rounded-2xl border ${
                      formato === f ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 border-gray-100'
                    }`}
                    onPress={() => setFormato(f)}
                  >
                    <Text className={`text-sm font-bold ${formato === f ? 'text-[#00C853]' : 'text-gray-500'}`}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs font-bold text-gray-300 mb-2">AMBIENTE</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {AMBIENTES.map(a => (
                  <TouchableOpacity 
                    key={a} 
                    className={`px-4 py-2.5 rounded-2xl border ${
                      ambiente === a ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 border-gray-100'
                    }`}
                    onPress={() => setAmbiente(a)}
                  >
                    <Text className={`text-sm font-bold ${ambiente === a ? 'text-[#00C853]' : 'text-gray-500'}`}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs font-bold text-gray-300 mb-2">NÍVEL REQUERIDO</Text>
              <View className="flex-row flex-wrap gap-2">
                {NIVEIS.map(n => (
                  <TouchableOpacity 
                    key={n} 
                    className={`px-4 py-2.5 rounded-2xl border ${
                      nivel === n ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 border-gray-100'
                    }`}
                    onPress={() => setNivel(n)}
                  >
                    <Text className={`text-sm font-bold ${nivel === n ? 'text-[#00C853]' : 'text-gray-500'}`}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              className="bg-[#00C853] py-4 rounded-3xl flex-row justify-center items-center"
              onPress={() => setStep(2)}
            >
              <Text className="text-white font-bold text-lg">Próxima Etapa</Text>
              <ChevronRight color="white" size={20} className="ml-2" />
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-8 shadow-sm shadow-black/5">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Data & Horário</Text>
              
              <View className="flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 mb-3 bg-gray-50">
                <Calendar size={20} color="#9CA3AF" />
                <TextInput 
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="YYYY-MM-DD (2024-12-25)" 
                  value={dataEvento} 
                  onChangeText={v => setDataEvento(handleMaskData(v))} 
                  keyboardType="numeric" 
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1 flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 bg-gray-50">
                  <Clock size={20} color="#9CA3AF" />
                  <TextInput 
                    className="flex-1 ml-3 text-base text-gray-800"
                    placeholder="Início HH:MM" 
                    value={horaInicio} 
                    onChangeText={v => setHoraInicio(handleMaskHora(v))} 
                    keyboardType="numeric" 
                  />
                </View>
                <View className="flex-1 flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 bg-gray-50">
                  <Clock size={20} color="#9CA3AF" />
                  <TextInput 
                    className="flex-1 ml-3 text-base text-gray-800"
                    placeholder="Fim HH:MM" 
                    value={horaFim} 
                    onChangeText={v => setHoraFim(handleMaskHora(v))} 
                    keyboardType="numeric" 
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              className="bg-[#00C853] py-4 rounded-3xl flex-row justify-center items-center mb-3"
              onPress={() => setStep(3)}
            >
              <Text className="text-white font-bold text-lg">Próxima Etapa</Text>
              <ChevronRight color="white" size={20} className="ml-2" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="py-4 items-center"
              onPress={() => setStep(1)}
            >
              <Text className="text-gray-400 font-bold text-base">Voltar</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View>
            <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-8 shadow-sm shadow-black/5">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Vagas & Preço</Text>
              
              <Text className="text-xs font-bold text-gray-300 mb-2">NÚMERO DE JOGADORES</Text>
              <View className="flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 mb-4 bg-gray-50">
                <Users size={20} color="#9CA3AF" />
                <TextInput 
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="Ex: 12" 
                  value={vagas} 
                  onChangeText={setVagas} 
                  keyboardType="numeric" 
                />
              </View>

              <Text className="text-xs font-bold text-gray-300 mb-2">VALOR POR VAGA</Text>
              <View className="flex-row items-center border border-gray-100 rounded-2xl px-4 py-3.5 mb-6 bg-gray-50">
                <DollarSign size={20} color="#9CA3AF" />
                <TextInput 
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="Ex: 25.00" 
                  value={preco} 
                  onChangeText={setPreco} 
                  keyboardType="numeric" 
                />
              </View>

              <View className="bg-green-50 p-6 rounded-3xl border border-green-100">
                <Text className="text-center text-green-700 font-bold text-lg mb-1">
                  Receita Potencial: R$ {(parsePreco() * parseVagas()).toFixed(2)}
                </Text>
                <Text className="text-center text-green-500 text-xs">Considerando todas as vagas preenchidas</Text>
                {parsePreco() === 0 && (
                  <Text className="text-orange-500 text-center font-bold text-xs mt-3 italic uppercase">⚠️ Evento Gratuito</Text>
                )}
              </View>
            </View>

            <TouchableOpacity 
              className="bg-[#00C853] py-4 rounded-3xl flex-row justify-center items-center mb-3"
              onPress={() => setStep(4)}
            >
              <Text className="text-white font-bold text-lg">Revisar Evento</Text>
              <ChevronRight color="white" size={20} className="ml-2" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="py-4 items-center"
              onPress={() => setStep(2)}
            >
              <Text className="text-gray-400 font-bold text-base">Voltar</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && (
          <View>
            <View className="bg-white p-6 rounded-3xl border border-gray-100 mb-8 shadow-lg shadow-black/5">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Revisão Final</Text>
              
              <View className="gap-5">
                <View className="flex-row items-center border-b border-gray-50 pb-4">
                  <Building2 size={24} color="#00C853" />
                  <View className="ml-4">
                    <Text className="text-xs text-gray-400 mb-1">LOCAL</Text>
                    <Text className="text-base font-bold text-gray-800">{QuadraNome}</Text>
                  </View>
                </View>

                <View className="flex-row items-center border-b border-gray-50 pb-4">
                  <LayoutGrid size={24} color="#00C853" />
                  <View className="ml-4">
                    <Text className="text-xs text-gray-400 mb-1">ESPORTE & TÍTULO</Text>
                    <Text className="text-base font-bold text-gray-800">{esporte.toUpperCase()} - {titulo || 'Sem título'}</Text>
                  </View>
                </View>

                <View className="flex-row items-center border-b border-gray-50 pb-4">
                  <Calendar size={24} color="#00C853" />
                  <View className="ml-4">
                    <Text className="text-xs text-gray-400 mb-1">DATA & HORÁRIO</Text>
                    <Text className="text-base font-bold text-gray-800">{dataEvento} • {horaInicio} às {horaFim}</Text>
                  </View>
                </View>

                <View className="flex-row items-center border-b border-gray-50 pb-4">
                  <Users size={24} color="#00C853" />
                  <View className="ml-4">
                    <Text className="text-xs text-gray-400 mb-1">VAGAS & NÍVEL</Text>
                    <Text className="text-base font-bold text-gray-800">{vagas} vagas • {nivel}</Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <DollarSign size={24} color="#00C853" />
                  <View className="ml-4">
                    <Text className="text-xs text-gray-400 mb-1">PREÇO POR VAGA</Text>
                    <Text className="text-xl font-black text-[#00C853]">R$ {preco}</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              className={`py-4 rounded-3xl flex-row justify-center items-center mb-3 ${loading ? 'bg-gray-300' : 'bg-[#00C853]'}`}
              onPress={handlePublicar} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <CheckCircle2 color="white" size={24} strokeWidth={2.5} />
                  <Text className="text-white font-bold text-lg ml-2">Publicar Evento Agora</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              className="py-4 items-center"
              onPress={() => setStep(3)}
              disabled={loading}
            >
              <Text className="text-gray-400 font-bold text-base">Ajustar Detalhes</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
