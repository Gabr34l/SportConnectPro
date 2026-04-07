export type TipoPerfil       = 'JOGADOR' | 'ORGANIZADOR';
export type NivelHabilidade  = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';
export type StatusEvento     = 'ABERTO' | 'LOTADO' | 'CONCLUIDO' | 'CANCELADO';
export type StatusPresenca   = 'AGUARDANDO_PAGAMENTO' | 'CONFIRMADO' | 'CANCELADO';
export type StatusVerificacao = 'PENDENTE' | 'APROVADO' | 'REJEITADO';
export type StatusPagamento  = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'ESTORNADO';

export type Usuario = {
  id_usuario: string; nome_completo: string; email: string;
  tipo_perfil: TipoPerfil; foto_perfil?: string; interesses: string[];
  nivel_habilidade: NivelHabilidade; expo_push_token?: string; created_at: string;
};
export type Quadra = {
  id_quadra: string; id_organizador: string; nome_local: string;
  cnpj: string; razao_social: string; cep: string; endereco_completo: string;
  latitude?: number; longitude?: number; telefone_comercial?: string;
  fotos?: string[]; status_aprovacao: StatusVerificacao; created_at: string;
  descricao?: string;
};
export type Evento = {
  id_evento: string; id_organizador: string; id_quadra: string;
  titulo: string; esporte: string; formato_jogo: string; tipo_ambiente: string;
  preco_por_vaga: number; data_evento: string; horario_inicio: string;
  horario_fim: string; limite_participantes: number;
  nivel_requerido: NivelHabilidade; status: StatusEvento; created_at: string;
};
export type EventoComVagas = Evento & {
  nome_local: string; endereco_completo: string;
  latitude: number; longitude: number; foto_quadra?: string;
  total_confirmados: number; vagas_restantes: number; percentual_ocupacao: number;
};
export type Participacao = {
  id_participacao: string; id_evento: string; id_jogador: string;
  id_pagamento?: string; status_presenca: StatusPresenca; data_confirmacao: string;
};
export type Pagamento = {
  id_pagamento: string; id_evento: string; id_jogador: string;
  valor_pago: number; status: StatusPagamento; metodo_pagamento?: string;
  gateway_transaction_id?: string; created_at: string;
};
export type Avaliacao = {
  id_avaliacao: string; id_evento: string; id_avaliador: string;
  nota: number; comentario?: string; data_avaliacao: string;
};
export type MensagemChat = {
  id_mensagem: string; id_evento: string; id_remetente: string;
  texto_mensagem: string; data_envio: string;
  usuario?: Pick<Usuario, 'nome_completo' | 'foto_perfil'>;
};
export type Notificacao = {
  id_notificacao: string; id_usuario: string; titulo: string;
  corpo: string; lida: boolean; tipo?: string; id_referencia?: string; created_at: string;
};
