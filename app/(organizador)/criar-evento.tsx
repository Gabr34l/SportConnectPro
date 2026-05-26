import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { config } from '@/lib/appwrite';
import { db } from '@/lib/database';
import { SPORTS, AMBIENTES, NIVEIS } from '@/constants/sports';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuadras } from '@/hooks/useQuadras';
import { useToast } from '@/components/Toast';
import { Quadra } from '@/types';
import { Button, Input, Card, CardContent } from '@/components/ui';
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
  LayoutDashboard,
  Trophy,
  Activity,
  Footprints,
  Target,
  Dribbble,
  CircleDot,
  Waves,
  Dumbbell
} from 'lucide-react-native';

const LUCIDE_ICONS: Record<string, any> = {
  Trophy,
  Footprints,
  Target,
  Dribbble,
  CircleDot,
  Waves,
  Dumbbell,
  Activity
};

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
  const [formato, setFormato] = useState(SPORTS[0].formatos[0]);
  const [ambiente, setAmbiente] = useState(AMBIENTES[0]);
  const [nivel, setNivel] = useState(NIVEIS[0]);

  useEffect(() => {
    const currentSport = SPORTS.find(s => s.id === esporte);
    if (currentSport && currentSport.formatos.length > 0) {
      if (!currentSport.formatos.includes(formato)) {
        setFormato(currentSport.formatos[0]);
      }
    }
  }, [esporte]);
  
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
      Alert.alert(title, message);
    }
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!idQuadra) {
        showFeedback('info', 'Aviso', 'Selecione uma quadra');
        return false;
      }
      if (!titulo) {
        showFeedback('info', 'Aviso', 'Informe um título para o evento');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!dataEvento || dataEvento.length < 10) {
        showFeedback('info', 'Aviso', 'Informe uma data válida (AAAA-MM-DD)');
        return false;
      }
      if (!horaInicio || !horaFim) {
        showFeedback('info', 'Aviso', 'Informe os horários de início e fim');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!vagas || parseInt(vagas) <= 0) {
        showFeedback('info', 'Aviso', 'Informe o número de vagas');
        return false;
      }
    }
    return true;
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
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setLoading(true);
    
    try {
      await db.events.create({
        id_organizador: usuario.id_usuario,
        id_quadra: idQuadra,
        titulo: titulo || 'Jogo Amistoso',
        esporte,
        formato_jogo: formato,
        tipo_ambiente: ambiente,
        preco_por_vaga: parsePreco(),
        data_evento: dataEvento,
        horario_inicio: horaInicio.includes(':') ? (horaInicio.length === 5 ? horaInicio + ':00' : horaInicio) : '19:00:00',
        horario_fim: horaFim.includes(':') ? (horaFim.length === 5 ? horaFim + ':00' : horaFim) : '20:00:00',
        limite_participantes: parseVagas(),
        nivel_requerido: nivel as any,
        status: 'ABERTO'
      });

      showFeedback('success', 'Sucesso!', 'Evento criado com sucesso!');
      router.replace('/(organizador)');
    } catch (e: any) {
      console.error('Erro ao criar evento:', e);
      if (e.message?.includes('Permissions') || e.message?.includes('authorized')) {
        showFeedback('error', 'Erro de Permissão', 'Você não tem permissão para criar eventos nesta quadra.');
      } else {
        showFeedback('error', 'Falha ao Criar', 'Não foi possível salvar o evento no banco de dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  const QuadraNome = quadrasAprovadas.find(q => q.id_quadra === idQuadra)?.nome_local;

  const StepIndicator = () => (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 mb-6">
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
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View className="bg-white dark:bg-gray-900 px-6 pt-16 pb-6 shadow-sm shadow-black/5">
        <Text className="text-2xl font-bold text-gray-800 dark:text-white">Criar Evento</Text>
        <Text className="text-base text-gray-400 mt-1">Siga as etapas para publicar</Text>
      </View>

      <StepIndicator />

      <ScrollView className="flex-1 px-6 pb-20" showsVerticalScrollIndicator={false}>
        
        {step === 1 && (
          <View>
            <Card className="mb-4">
              <CardContent>
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Escolha a Quadra</Text>
              <View className="gap-2">
                {quadrasAprovadas.map(q => (
                  <TouchableOpacity 
                    key={q.id_quadra} 
                    className={`flex-row items-center px-4 py-3.5 rounded-2xl border ${
                      idQuadra === q.id_quadra ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800'
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
              <Input
                icon={LayoutDashboard}
                placeholder="Ex: Racha de Sexta"
                value={titulo}
                onChangeText={setTitulo}
                containerClassName="mb-3"
              />

              <View className="flex-row flex-wrap gap-2">
                {SPORTS.map(s => {
                  const Icon = LUCIDE_ICONS[s.iconName] || Activity;
                  const isSelected = esporte === s.id;
                  return (
                    <TouchableOpacity 
                      key={s.id} 
                      className={`flex-row items-center px-3.5 py-2.5 rounded-2xl border ${
                        isSelected ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800'
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
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent>
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Mais Detalhes</Text>
              
              <Text className="text-xs font-bold text-gray-300 mb-2">FORMATO</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {SPORTS.find(s => s.id === esporte)?.formatos.map(f => (
                  <TouchableOpacity 
                    key={f} 
                    className={`px-4 py-2.5 rounded-2xl border ${
                      formato === f ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800'
                    }`}
                    onPress={() => {
                      setFormato(f);
                      // Auto-calcula vagas: extrai o primeiro número e multiplica por 2
                      const numPorTime = parseInt(f.split('v')[0]);
                      if (!isNaN(numPorTime)) {
                        setVagas((numPorTime * 2).toString());
                      } else if (f.includes('3x3')) {
                        setVagas('6');
                      } else if (f.includes('Simples')) {
                        setVagas('2');
                      } else if (f.includes('Duplas')) {
                        setVagas('4');
                      }
                    }}
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
                      ambiente === a ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800'
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
                      nivel === n ? 'bg-green-50 border-[#00C853]' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800'
                    }`}
                    onPress={() => setNivel(n)}
                  >
                    <Text className={`text-sm font-bold ${nivel === n ? 'text-[#00C853]' : 'text-gray-500'}`}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              </CardContent>
            </Card>

            <Button 
              size="lg"
              onPress={() => {
                if (validateStep(1)) setStep(2);
              }}
            >
              Próxima Etapa
              <ChevronRight color="white" size={20} className="ml-2" />
            </Button>
          </View>
        )}

        {step === 2 && (
          <View>
            <View className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 mb-8 shadow-sm shadow-black/5">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Data & Horário</Text>
              
              <View className="flex-row items-center border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5 mb-3 bg-gray-50 dark:bg-gray-950">
                <Calendar size={20} color="#9CA3AF" />
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: dataEvento,
                    onChange: (e: any) => setDataEvento(e.target.value),
                    style: { flex: 1, marginLeft: 12, border: 'none', background: 'transparent', outline: 'none', fontSize: 16, color: '#1F2937', fontFamily: 'inherit' }
                  })
                ) : (
                  <TextInput 
                    className="flex-1 ml-3 text-base text-gray-800 dark:text-white"
                    placeholder="YYYY-MM-DD (2024-12-25)" 
                    value={dataEvento} 
                    onChangeText={v => setDataEvento(handleMaskData(v))} 
                    keyboardType="numeric" 
                  />
                )}
              </View>

              <View className="flex-row gap-2 mb-3">
                <View className="flex-1 flex-row items-center border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5 bg-gray-50 dark:bg-gray-950">
                  <Clock size={20} color="#9CA3AF" />
                  {Platform.OS === 'web' ? (
                    React.createElement('input', {
                      type: 'time',
                      value: horaInicio,
                      onChange: (e: any) => setHoraInicio(e.target.value),
                      style: { flex: 1, marginLeft: 12, border: 'none', background: 'transparent', outline: 'none', fontSize: 16, color: '#1F2937', fontFamily: 'inherit' }
                    })
                  ) : (
                    <TextInput 
                      className="flex-1 ml-3 text-base text-gray-800 dark:text-white"
                      placeholder="Início HH:MM" 
                      value={horaInicio} 
                      onChangeText={v => setHoraInicio(handleMaskHora(v))} 
                      keyboardType="numeric" 
                    />
                  )}
                </View>
                <View className="flex-1 flex-row items-center border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5 bg-gray-50 dark:bg-gray-950">
                  <Clock size={20} color="#9CA3AF" />
                  {Platform.OS === 'web' ? (
                    React.createElement('input', {
                      type: 'time',
                      value: horaFim,
                      onChange: (e: any) => setHoraFim(e.target.value),
                      style: { flex: 1, marginLeft: 12, border: 'none', background: 'transparent', outline: 'none', fontSize: 16, color: '#1F2937', fontFamily: 'inherit' }
                    })
                  ) : (
                    <TextInput 
                      className="flex-1 ml-3 text-base text-gray-800 dark:text-white"
                      placeholder="Fim HH:MM" 
                      value={horaFim} 
                      onChangeText={v => setHoraFim(handleMaskHora(v))} 
                      keyboardType="numeric" 
                    />
                  )}
                </View>
              </View>

            </View>

            <Button 
              size="lg"
              className="mb-3"
              onPress={() => {
                if (validateStep(2)) setStep(3);
              }}
            >
              Próxima Etapa
              <ChevronRight color="white" size={20} className="ml-2" />
            </Button>
            <Button 
              variant="ghost"
              onPress={() => setStep(1)}
            >
              Voltar
            </Button>
          </View>
        )}

        {step === 3 && (
          <View>
            <View className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 mb-8 shadow-sm shadow-black/5">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Vagas & Preço</Text>
              
              <Text className="text-xs font-bold text-gray-300 mb-2">NÚMERO DE JOGADORES</Text>
              <View className="flex-row items-center border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5 mb-4 bg-gray-50 dark:bg-gray-950">
                <Users size={20} color="#9CA3AF" />
                <TextInput 
                  className="flex-1 ml-3 text-base text-gray-800 dark:text-white"
                  placeholder="Ex: 12" 
                  value={vagas} 
                  onChangeText={setVagas} 
                  keyboardType="numeric" 
                />
              </View>

              <Text className="text-xs font-bold text-gray-300 mb-2">VALOR POR VAGA</Text>
              <View className="flex-row items-center border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5 mb-6 bg-gray-50 dark:bg-gray-950">
                <DollarSign size={20} color="#9CA3AF" />
                <TextInput 
                  className="flex-1 ml-3 text-base text-gray-800 dark:text-white"
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

            <Button 
              size="lg"
              className="mb-3"
              onPress={() => {
                if (validateStep(3)) setStep(4);
              }}
            >
              Revisar Evento
              <ChevronRight color="white" size={20} className="ml-2" />
            </Button>
            <Button 
              variant="ghost"
              onPress={() => setStep(2)}
            >
              Voltar
            </Button>
          </View>
        )}

        {step === 4 && (
          <View>
            <View className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mb-8 shadow-lg shadow-black/5">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Revisão Final</Text>
              
              <View className="gap-5">
                <View className="flex-row items-center border-b border-gray-50 dark:border-gray-900 pb-4">
                  <Building2 size={24} color="#00C853" />
                  <View className="ml-4">
                    <Text className="text-xs text-gray-400 mb-1">LOCAL</Text>
                    <Text className="text-base font-bold text-gray-800 dark:text-white">{QuadraNome}</Text>
                  </View>
                </View>

                <View className="flex-row items-center border-b border-gray-50 dark:border-gray-900 pb-4">
                  <LayoutGrid size={24} color="#00C853" />
                  <View className="ml-4">
                    <Text className="text-xs text-gray-400 mb-1">ESPORTE & TÍTULO</Text>
                    <Text className="text-base font-bold text-gray-800 dark:text-white">{esporte.toUpperCase()} - {titulo || 'Sem título'}</Text>
                  </View>
                </View>

                <View className="flex-row items-center border-b border-gray-50 dark:border-gray-900 pb-4">
                  <Calendar size={24} color="#00C853" />
                  <View className="ml-4">
                    <Text className="text-xs text-gray-400 mb-1">DATA & HORÁRIO</Text>
                    <Text className="text-base font-bold text-gray-800 dark:text-white">
                      {dataEvento ? dataEvento.split('-').reverse().join('/') : ''} • {horaInicio} às {horaFim}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center border-b border-gray-50 dark:border-gray-900 pb-4">
                  <Users size={24} color="#00C853" />
                  <View className="ml-4">
                    <Text className="text-xs text-gray-400 mb-1">VAGAS & NÍVEL</Text>
                    <Text className="text-base font-bold text-gray-800 dark:text-white">{vagas} vagas • {nivel}</Text>
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
            <Button 
              variant="ghost"
              onPress={() => setStep(3)}
              disabled={loading}
            >
              Ajustar Detalhes
            </Button>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
