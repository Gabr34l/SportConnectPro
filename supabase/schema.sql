-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMs
CREATE TYPE tipo_perfil        AS ENUM ('JOGADOR', 'ORGANIZADOR');
CREATE TYPE nivel_habilidade   AS ENUM ('INICIANTE', 'INTERMEDIARIO', 'AVANCADO');
CREATE TYPE status_evento      AS ENUM ('ABERTO', 'LOTADO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE status_presenca    AS ENUM ('AGUARDANDO_PAGAMENTO', 'CONFIRMADO', 'CANCELADO');
CREATE TYPE status_verificacao AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');
CREATE TYPE status_pagamento   AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'ESTORNADO');

-- Tabela usuarios
CREATE TABLE usuarios (
  id_usuario       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo    TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  tipo_perfil      tipo_perfil NOT NULL DEFAULT 'JOGADOR',
  foto_perfil      TEXT,
  interesses       TEXT[] DEFAULT '{}',
  nivel_habilidade nivel_habilidade DEFAULT 'INICIANTE',
  expo_push_token  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela quadras
CREATE TABLE quadras (
  id_quadra          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_organizador     UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  nome_local         TEXT NOT NULL,
  cnpj               TEXT UNIQUE NOT NULL,
  razao_social       TEXT NOT NULL,
  cep                TEXT NOT NULL,
  endereco_completo  TEXT NOT NULL,
  latitude           FLOAT,
  longitude          FLOAT,
  telefone_comercial TEXT,
  fotos              TEXT[],
  status_aprovacao   status_verificacao DEFAULT 'PENDENTE',
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela eventos
CREATE TABLE eventos (
  id_evento            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_organizador       UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_quadra            UUID NOT NULL REFERENCES quadras(id_quadra) ON DELETE CASCADE,
  titulo               TEXT NOT NULL,
  esporte              TEXT NOT NULL,
  formato_jogo         TEXT NOT NULL,
  tipo_ambiente        TEXT NOT NULL,
  preco_por_vaga       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  data_evento          DATE NOT NULL,
  horario_inicio       TIME NOT NULL,
  horario_fim          TIME NOT NULL,
  limite_participantes INTEGER NOT NULL DEFAULT 12,
  nivel_requerido      nivel_habilidade DEFAULT 'INICIANTE',
  status               status_evento DEFAULT 'ABERTO',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela pagamentos
CREATE TABLE pagamentos (
  id_pagamento           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_evento              UUID NOT NULL REFERENCES eventos(id_evento) ON DELETE CASCADE,
  id_jogador             UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  valor_pago             DECIMAL(10,2) NOT NULL,
  status                 status_pagamento DEFAULT 'PENDENTE',
  metodo_pagamento       TEXT,
  gateway_transaction_id TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela participacoes
CREATE TABLE participacoes (
  id_participacao  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_evento        UUID NOT NULL REFERENCES eventos(id_evento) ON DELETE CASCADE,
  id_jogador       UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_pagamento     UUID REFERENCES pagamentos(id_pagamento) ON DELETE SET NULL,
  status_presenca  status_presenca DEFAULT 'AGUARDANDO_PAGAMENTO',
  data_confirmacao TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_evento, id_jogador)
);

-- Tabela avaliacoes
CREATE TABLE avaliacoes (
  id_avaliacao   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_evento      UUID NOT NULL REFERENCES eventos(id_evento) ON DELETE CASCADE,
  id_avaliador   UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  nota           INTEGER CHECK (nota BETWEEN 1 AND 5),
  comentario     TEXT,
  data_avaliacao TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_evento, id_avaliador)
);

-- Tabela favoritos (favoritar quadra)
CREATE TABLE favoritos (
  id_favorito UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario  UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_quadra   UUID NOT NULL REFERENCES quadras(id_quadra) ON DELETE CASCADE,
  UNIQUE(id_usuario, id_quadra)
);

-- Tabela mensagens_chat
CREATE TABLE mensagens_chat (
  id_mensagem    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_evento      UUID NOT NULL REFERENCES eventos(id_evento) ON DELETE CASCADE,
  id_remetente   UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  texto_mensagem TEXT NOT NULL,
  data_envio     TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela notificacoes
CREATE TABLE notificacoes (
  id_notificacao UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario     UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  titulo         TEXT NOT NULL,
  corpo          TEXT NOT NULL,
  lida           BOOLEAN DEFAULT FALSE,
  tipo           TEXT,
  id_referencia  UUID,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX idx_eventos_data        ON eventos(data_evento);
CREATE INDEX idx_eventos_esporte     ON eventos(esporte);
CREATE INDEX idx_eventos_status      ON eventos(status);
CREATE INDEX idx_participacoes_ev    ON participacoes(id_evento);
CREATE INDEX idx_participacoes_jog   ON participacoes(id_jogador);
CREATE INDEX idx_pagamentos_gateway  ON pagamentos(gateway_transaction_id);
CREATE INDEX idx_quadras_localizacao ON quadras(latitude, longitude);
CREATE INDEX idx_mensagens_evento    ON mensagens_chat(id_evento, data_envio);

-- RLS
ALTER TABLE usuarios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quadras        ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE participacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes   ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios
CREATE POLICY "Qualquer um lê perfis"         ON usuarios FOR SELECT USING (true);
CREATE POLICY "Usuário edita próprio perfil"  ON usuarios FOR UPDATE USING (auth.uid() = id_usuario);
CREATE POLICY "Usuário insere próprio perfil" ON usuarios FOR INSERT WITH CHECK (auth.uid() = id_usuario);

-- Políticas: quadras
CREATE POLICY "Todos veem quadras aprovadas"  ON quadras FOR SELECT USING (status_aprovacao = 'APROVADO');
CREATE POLICY "Org vê sua quadra pendente"    ON quadras FOR SELECT USING (auth.uid() = id_organizador);
CREATE POLICY "Organizador cria quadra"       ON quadras FOR INSERT WITH CHECK (auth.uid() = id_organizador);
CREATE POLICY "Organizador edita sua quadra"  ON quadras FOR UPDATE USING (auth.uid() = id_organizador);

-- Políticas: eventos
CREATE POLICY "Todos veem eventos"            ON eventos FOR SELECT USING (true);
CREATE POLICY "Organizador cria evento"       ON eventos FOR INSERT WITH CHECK (auth.uid() = id_organizador);
CREATE POLICY "Organizador edita seu evento"  ON eventos FOR UPDATE USING (auth.uid() = id_organizador);

-- Políticas: pagamentos
CREATE POLICY "Jogador vê seus pagamentos"    ON pagamentos FOR SELECT USING (auth.uid() = id_jogador);
CREATE POLICY "Org vê pagamentos do evento"   ON pagamentos FOR SELECT USING (
  EXISTS (SELECT 1 FROM eventos WHERE id_evento = pagamentos.id_evento AND id_organizador = auth.uid())
);

-- Políticas: participacoes
CREATE POLICY "Todos veem participações"      ON participacoes FOR SELECT USING (true);
CREATE POLICY "Jogador gerencia participação" ON participacoes FOR ALL USING (auth.uid() = id_jogador);

-- Políticas: mensagens_chat (apenas participantes CONFIRMADOS)
CREATE POLICY "Todos veem mensagens"          ON mensagens_chat FOR SELECT USING (true);
CREATE POLICY "Só confirmado envia mensagem"  ON mensagens_chat FOR INSERT WITH CHECK (
  auth.uid() = id_remetente AND
  EXISTS (
    SELECT 1 FROM participacoes
    WHERE id_evento = mensagens_chat.id_evento
      AND id_jogador = auth.uid()
      AND status_presenca = 'CONFIRMADO'
  )
);

-- Políticas: avaliacoes, favoritos, notificacoes
CREATE POLICY "Todos veem avaliações"         ON avaliacoes FOR SELECT USING (true);
CREATE POLICY "Avaliador insere avaliação"    ON avaliacoes FOR INSERT WITH CHECK (auth.uid() = id_avaliador);
CREATE POLICY "Favoritos do usuário"          ON favoritos FOR ALL USING (auth.uid() = id_usuario);
CREATE POLICY "Usuário vê suas notificações"  ON notificacoes FOR ALL USING (auth.uid() = id_usuario);

-- Trigger: criar usuario após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id_usuario, nome_completo, email, tipo_perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Novo Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'tipo_perfil')::tipo_perfil, 'JOGADOR')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- View: eventos com vagas (apenas quadras aprovadas)
CREATE OR REPLACE VIEW eventos_com_vagas AS
SELECT
  e.*,
  q.nome_local,
  q.endereco_completo,
  q.latitude,
  q.longitude,
  q.fotos[1]    AS foto_quadra,
  COUNT(p.id_participacao) FILTER (WHERE p.status_presenca = 'CONFIRMADO') AS total_confirmados,
  e.limite_participantes - COUNT(p.id_participacao) FILTER (WHERE p.status_presenca = 'CONFIRMADO') AS vagas_restantes,
  ROUND(
    COUNT(p.id_participacao) FILTER (WHERE p.status_presenca = 'CONFIRMADO')::DECIMAL
    / NULLIF(e.limite_participantes, 0) * 100
  ) AS percentual_ocupacao
FROM eventos e
JOIN quadras q ON e.id_quadra = q.id_quadra
LEFT JOIN participacoes p ON e.id_evento = p.id_evento
WHERE q.status_aprovacao = 'APROVADO'
GROUP BY e.id_evento, q.id_quadra;
