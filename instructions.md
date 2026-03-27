# 🏟️ SportConnect Pro — Instruções Completas do Agente

## Visão Geral do Produto
Construa um aplicativo mobile chamado **SportConnect Pro** — plataforma para atletas amadores agendarem quadras e participarem de partidas esportivas pagas. Referência de mercado: **GoodRec**.

Dois perfis distintos:
- **JOGADOR** — encontra, paga e participa de eventos
- **ORGANIZADOR** — cadastra sua quadra (com aprovação admin), cria e gerencia eventos pagos

---

## Stack Tecnológica Obrigatória

| Camada | Tecnologia |
|---|---|
| Mobile | React Native + Expo SDK 51+ |
| Roteamento | Expo Router v3 (file-based) |
| Estilização | NativeWind v4 (Tailwind CSS) |
| Backend/DB | Supabase (Auth, PostgreSQL, Realtime, Storage, Edge Functions) |
| Pagamentos | Stripe (checkout + webhooks via Edge Function) |
| Mapas | react-native-maps + Google Maps API |
| Notificações | Expo Notifications |

---

## Fase 1 — Setup Inicial

### 1.1 Criar projeto
```bash
npx create-expo-app SportConnectPro --template blank-typescript
cd SportConnectPro
```

### 1.2 Instalar todas as dependências
```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npx expo install @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage expo-secure-store
npx expo install react-native-maps expo-location
npx expo install expo-notifications expo-image-picker expo-web-browser
npm install nativewind tailwindcss date-fns
npm install @stripe/stripe-react-native
```

### 1.3 Configurar NativeWind
Criar `tailwind.config.js`:
```js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#00C853', dark: '#00952A', light: '#69F0AE', muted: '#E8F5E9' },
        accent: '#FF6D00',
      },
    },
  },
  plugins: [],
};
```

### 1.4 Criar `.env` na raiz
```env
EXPO_PUBLIC_SUPABASE_URL=COLE_AQUI
EXPO_PUBLIC_SUPABASE_ANON_KEY=COLE_AQUI
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=COLE_AQUI
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=COLE_AQUI
```
> Deixar os placeholders. O utilizador preencherá com suas chaves reais.

---

## Fase 2 — Banco de Dados Supabase

Criar `supabase/schema.sql` e instruir o utilizador a executar no SQL Editor do Supabase:

```sql
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
```

---

## Fase 3 — Edge Functions Supabase

### 3.1 `supabase/functions/criar-checkout/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

serve(async (req) => {
  try {
    const { id_evento, id_jogador } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: evento } = await supabase
      .from("eventos_com_vagas").select("*").eq("id_evento", id_evento).single();

    if (!evento || evento.vagas_restantes <= 0)
      return new Response(JSON.stringify({ error: "Evento lotado" }), { status: 400 });

    const { data: pagamento } = await supabase.from("pagamentos")
      .insert({ id_evento, id_jogador, valor_pago: evento.preco_por_vaga, status: "PENDENTE", metodo_pagamento: "stripe" })
      .select().single();

    await supabase.from("participacoes").insert({
      id_evento, id_jogador,
      id_pagamento: pagamento.id_pagamento,
      status_presenca: "AGUARDANDO_PAGAMENTO",
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "brl",
          product_data: { name: `Vaga: ${evento.titulo}` },
          unit_amount: Math.round(evento.preco_por_vaga * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      metadata: { id_pagamento: pagamento.id_pagamento, id_evento, id_jogador },
      success_url: `${Deno.env.get("APP_URL")}/pagamento/sucesso`,
      cancel_url: `${Deno.env.get("APP_URL")}/pagamento/cancelado`,
    });

    await supabase.from("pagamentos")
      .update({ gateway_transaction_id: session.id })
      .eq("id_pagamento", pagamento.id_pagamento);

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
```

### 3.2 `supabase/functions/webhook-pagamento/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")!;
  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch (err) {
    return new Response(`Webhook inválido: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { id_pagamento, id_evento, id_jogador } = session.metadata!;

    await supabase.from("pagamentos").update({ status: "APROVADO" }).eq("id_pagamento", id_pagamento);
    await supabase.from("participacoes")
      .update({ status_presenca: "CONFIRMADO", data_confirmacao: new Date().toISOString() })
      .eq("id_pagamento", id_pagamento);

    const { data: ev } = await supabase
      .from("eventos_com_vagas").select("vagas_restantes").eq("id_evento", id_evento).single();
    if (ev?.vagas_restantes === 0)
      await supabase.from("eventos").update({ status: "LOTADO" }).eq("id_evento", id_evento);

    const { data: usuario } = await supabase
      .from("usuarios").select("expo_push_token").eq("id_usuario", id_jogador).single();

    if (usuario?.expo_push_token) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: usuario.expo_push_token,
          title: "✅ Vaga Confirmada!",
          body: "Pagamento aprovado. Boa partida! 🏆",
          data: { id_evento },
        }),
      });
    }

    await supabase.from("notificacoes").insert({
      id_usuario: id_jogador,
      titulo: "✅ Vaga Confirmada!",
      corpo: "Seu pagamento foi aprovado. Você está no jogo!",
      tipo: "PAGAMENTO",
      id_referencia: id_evento,
    });
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const { data: pag } = await supabase
      .from("pagamentos").select("id_pagamento")
      .eq("gateway_transaction_id", charge.payment_intent as string).single();

    if (pag) {
      await supabase.from("pagamentos").update({ status: "ESTORNADO" }).eq("id_pagamento", pag.id_pagamento);
      await supabase.from("participacoes").update({ status_presenca: "CANCELADO" }).eq("id_pagamento", pag.id_pagamento);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

---

## Fase 4 — Estrutura de Ficheiros

```
SportConnectPro/
├── app/
│   ├── _layout.tsx                     # Root: AuthProvider + StripeProvider
│   ├── index.tsx                       # Redirect por sessão e tipo_perfil
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx                 # Landing com gradiente verde
│   │   ├── login.tsx                   # Login + "Esqueci senha"
│   │   └── cadastro.tsx                # Cadastro com seleção de perfil
│   ├── (jogador)/
│   │   ├── _layout.tsx                 # Bottom tabs: Início / Mapa / Favoritos / Perfil
│   │   ├── index.tsx                   # Feed de jogos + filtros
│   │   ├── mapa.tsx                    # Mapa com pins das quadras
│   │   ├── favoritos.tsx               # Quadras favoritadas
│   │   ├── perfil.tsx                  # Perfil e histórico
│   │   ├── notificacoes.tsx            # Central de notificações
│   │   └── evento/
│   │       └── [id].tsx                # Detalhe + botão Pagar Vaga
│   ├── (organizador)/
│   │   ├── _layout.tsx                 # Bottom tabs: Dashboard / Quadras / Criar / Perfil
│   │   ├── index.tsx                   # Dashboard: eventos + receita
│   │   ├── quadras.tsx                 # Lista de quadras cadastradas
│   │   ├── cadastrar-quadra.tsx        # Formulário CNPJ + fotos
│   │   ├── criar-evento.tsx            # Formulário multi-step
│   │   ├── perfil.tsx
│   │   └── evento/
│   │       └── [id].tsx                # Gestão: jogadores + receita
│   ├── chat/
│   │   └── [eventoId].tsx              # Chat em tempo real
│   └── pagamento/
│       ├── sucesso.tsx                 # Deep link pós-Stripe
│       └── cancelado.tsx
├── components/
│   ├── EventCard.tsx
│   ├── QuadraCard.tsx
│   ├── PlayerSlots.tsx
│   ├── VagasBar.tsx
│   ├── SportBadge.tsx
│   ├── AmbienteBadge.tsx
│   ├── RatingStars.tsx
│   ├── FilterChips.tsx
│   ├── MapQuadraPin.tsx
│   ├── ChatMessage.tsx
│   ├── StatusBadge.tsx
│   └── NotificacaoItem.tsx
├── lib/
│   ├── supabase.ts
│   └── notifications.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useJogosDoDia.ts
│   ├── useEventoDetalhe.ts
│   ├── useParticipacao.ts
│   ├── useQuadras.ts
│   └── useNotificacoes.ts
├── contexts/
│   └── AuthContext.tsx
├── constants/
│   ├── theme.ts
│   └── sports.ts
├── types/
│   └── index.ts
└── supabase/
    ├── schema.sql
    └── functions/
        ├── criar-checkout/index.ts
        └── webhook-pagamento/index.ts
```

---

## Fase 5 — Constantes

### `constants/theme.ts`
```typescript
export const theme = {
  colors: {
    primary:       '#00C853',
    primaryDark:   '#00952A',
    primaryLight:  '#69F0AE',
    primaryMuted:  '#E8F5E9',
    accent:        '#FF6D00',
    danger:        '#D32F2F',
    background:    '#F9FAFB',
    surface:       '#FFFFFF',
    border:        '#E0E0E0',
    textPrimary:   '#1A1A1A',
    textSecondary: '#616161',
    textMuted:     '#9E9E9E',
    textInverse:   '#FFFFFF',
  },
  shadow: {
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    button: { shadowColor: '#00C853', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  },
} as const;

export function corVagas(vagas: number, limite: number): string {
  const pct = vagas / limite;
  if (pct <= 0)   return '#D32F2F';
  if (pct <= 0.3) return '#FF6D00';
  return '#00C853';
}
```

### `constants/sports.ts`
```typescript
export const SPORTS = [
  { id: 'futebol',  label: 'Futebol',  emoji: '⚽', color: '#00C853' },
  { id: 'futsal',   label: 'Futsal',   emoji: '⚽', color: '#2196F3' },
  { id: 'volei',    label: 'Vôlei',    emoji: '🏐', color: '#FF9800' },
  { id: 'basquete', label: 'Basquete', emoji: '🏀', color: '#F44336' },
  { id: 'tenis',    label: 'Tênis',    emoji: '🎾', color: '#9C27B0' },
  { id: 'natacao',  label: 'Natação',  emoji: '🏊', color: '#00BCD4' },
  { id: 'outros',   label: 'Outros',   emoji: '🏅', color: '#607D8B' },
];
export const FORMATOS  = ['5v5', '6v6', '7v7', '8v8', '11v11'];
export const AMBIENTES = ['Indoor', 'Outdoor'];
export const NIVEIS    = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'];
```

### `types/index.ts`
```typescript
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
```

---

## Fase 6 — Lib e Contexto

### `lib/supabase.ts`
```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } }
);
```

### `contexts/AuthContext.tsx`
Implementar com:
- Estado: `session`, `usuario: Usuario | null`, `loading`
- `supabase.auth.onAuthStateChange` → ao mudar, buscar `usuarios` pelo `id`
- Expor: `signOut()`, `refreshUsuario()`
- Exportar `useAuthContext()` hook

### `app/_layout.tsx`
- Envolver em `<AuthProvider>` e `<StripeProvider publishableKey={...}>`
- Usar `<Slot />` do Expo Router

### `app/index.tsx`
- Se loading → `<ActivityIndicator />`
- Se session → verificar `tipo_perfil` → redirecionar para `/(jogador)` ou `/(organizador)`
- Se sem session → redirecionar para `/(auth)/welcome`

---

## Fase 7 — Telas de Autenticação

### `(auth)/welcome.tsx`
- Background com gradiente verde escuro → verde neon (#00952A → #00C853)
- Logo + nome "SportConnect Pro" em branco
- Tagline: "Sua próxima partida está aqui"
- Botão branco: "Criar Conta" → `cadastro.tsx`
- Botão outline branco: "Já tenho conta" → `login.tsx`

### `(auth)/login.tsx`
- Campo email + campo senha (secureTextEntry)
- Botão verde "Entrar"
- **Link "Esqueci minha senha":**
  - Abre Modal com campo de email
  - Chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: '...' })`
  - Mostra feedback: "E-mail de recuperação enviado! Verifique sua caixa de entrada."
- Link: "Não tem conta? Cadastre-se"

### `(auth)/cadastro.tsx`
**Passo 0 — Seleção de perfil (obrigatório antes de tudo):**
Dois cards grandes:
- "🏃 Quero Jogar" → seleciona JOGADOR
- "🏆 Quero Organizar" → seleciona ORGANIZADOR
- Card selecionado: borda verde 2px + fundo `primaryMuted`

**Se JOGADOR — formulário simples (1 etapa):**
- Nome completo, email, senha
- Botão "Criar Conta" → `supabase.auth.signUp` com `{ nome_completo, tipo_perfil: 'JOGADOR' }`

**Se ORGANIZADOR — formulário em 2 etapas:**

Etapa 1 — Dados pessoais:
- Nome completo, email, senha

Etapa 2 — Dados da Quadra (onboarding rigoroso):
- Nome do local/complexo
- CNPJ (máscara: XX.XXX.XXX/XXXX-XX)
- Razão Social
- CEP (máscara: XXXXX-XXX) → ao preencher, chamar `https://viacep.com.br/ws/{cep}/json/` e auto-preencher endereço
- Endereço completo (auto-preenchido, editável)
- Telefone comercial (máscara: (XX) XXXXX-XXXX)
- Upload de fotos (mínimo 2, máximo 8) via `expo-image-picker` → upload para Supabase Storage bucket `quadras`

Ao submeter:
1. `supabase.auth.signUp` com metadata `{ nome_completo, tipo_perfil: 'ORGANIZADOR' }`
2. INSERT em `quadras` com `status_aprovacao = 'PENDENTE'`
3. Exibir tela de confirmação: "Cadastro enviado! Sua quadra está em análise. Você será notificado quando for aprovada."

---

## Fase 8 — Fluxo do Jogador

### `(jogador)/_layout.tsx`
Bottom tabs: 🏠 Início | 🗺️ Mapa | ❤️ Favoritos | 👤 Perfil

### `(jogador)/index.tsx` — Feed de Jogos
1. Header: "Olá, [nome]! 👋" + ícone sino (badge com não lidas) → `notificacoes.tsx`
2. Barra de busca
3. Chips horizontais de esporte (Todos, ⚽ Futebol, 🏐 Vôlei...)
4. Filtros: Distância (1km/5km/10km) | Ambiente (Indoor/Outdoor) | Nível
5. FlatList de `EventCard`

Hook `useJogosDoDia`:
- SELECT * FROM `eventos_com_vagas` WHERE `data_evento = hoje` AND `status = 'ABERTO'`
- Filtros opcionais: esporte, tipo_ambiente, nivel_requerido
- Ordenar por `horario_inicio ASC`
- Realtime: subscrever `participacoes` para atualizar vagas ao vivo

### `components/EventCard.tsx`
- Foto da quadra (carrossel ou placeholder)
- Badge esporte (cor dinâmica) + Badge Indoor/Outdoor
- Título + formato do jogo ("5v5")
- 📅 Data + 🕐 Horário início-fim
- 📍 Nome da quadra
- **Preço destacado em verde:** "R$ 25,00 / vaga"
- `VagasBar` — barra de progresso verde/laranja/vermelho
- "X vagas restantes"

### `(jogador)/evento/[id].tsx` — Detalhe
1. Carrossel de fotos da quadra
2. Título + badges (esporte, formato, ambiente)
3. Organizador: avatar + nome
4. Data, horário, endereço completo com mapa estático
5. Descrição do evento
6. Nível requerido
7. Seção "Jogadores (X/Y)": `PlayerSlots` + lista de confirmados
8. Avaliações anteriores da quadra: média estrelas + últimos comentários
9. **Botão fixo no bottom:**
   - ABERTO + não inscrito → verde "💳 Garantir Vaga — R$ XX,00"
   - AGUARDANDO_PAGAMENTO → amarelo "⏳ Aguardando Pagamento"
   - CONFIRMADO → verde outline "✅ Confirmado" + botão "💬 Chat" separado
   - LOTADO + não inscrito → cinza desabilitado "🔒 Evento Lotado"
   - CONCLUIDO + confirmado + sem avaliação → amarelo "⭐ Avaliar Evento"

**Fluxo do botão "Garantir Vaga":**
```typescript
// 1. Chamar Edge Function 'criar-checkout' via supabase.functions.invoke()
// 2. Receber { checkout_url }
// 3. Abrir com WebBrowser.openBrowserAsync(checkout_url)
// 4. Stripe redireciona para /pagamento/sucesso
// 5. Webhook confirma a vaga automaticamente
```

**Fluxo de avaliação:**
- Mostrar APENAS quando: `status = 'CONCLUIDO'` AND `data_evento < hoje` AND participação CONFIRMADA existe AND avaliação ainda não existe
- Modal: `RatingStars` (1-5) + TextInput comentário + botão "Enviar Avaliação"
- INSERT em `avaliacoes`

### `(jogador)/mapa.tsx`
- MapView fullscreen centrado no dispositivo
- Pin verde por quadra (cor do esporte principal)
- Toque no pin → BottomSheet com QuadraCard + lista de eventos do dia + botão "Ver Jogos"

### `(jogador)/favoritos.tsx`
- SELECT favoritos JOIN quadras WHERE id_usuario = usuário atual
- QuadraCard: nome, endereço, esportes, rating médio
- Estado vazio: "Nenhuma quadra favoritada ainda ❤️"

### `(jogador)/perfil.tsx`
- Avatar com botão câmera → upload Supabase Storage bucket `avatares`
- Nome editável
- Chips de interesses (selecionáveis)
- Nível de habilidade (segmented control)
- Seção "Histórico": eventos CONFIRMADOS passados
- Botão "Sair" → `supabase.auth.signOut()`

### `(jogador)/notificacoes.tsx`
- FlatList de `notificacoes` ORDER BY `created_at DESC`
- Tocar → marcar como lida + navegar para `id_referencia`
- Não lidas: fundo levemente verde + ponto verde
- Botão "Marcar todas como lidas"

---

## Fase 9 — Fluxo do Organizador

### `(organizador)/_layout.tsx`
Bottom tabs: 📋 Dashboard | 🏟️ Quadras | ➕ Criar | 👤 Perfil

### `(organizador)/index.tsx` — Dashboard
1. Header: "Dashboard" + nome do organizador
2. Cards de stats:
   - Total de eventos criados
   - Receita total (soma pagamentos APROVADOS)
   - Próximos eventos
3. Lista de eventos com: título, data, "X/Y confirmados", receita, status badge
4. **FAB verde "+"** → `criar-evento.tsx`

> ⚠️ Se nenhuma quadra com status `APROVADO` existir: mostrar banner "Sua quadra está em análise." e desabilitar o FAB.

### `(organizador)/quadras.tsx`
- Lista das quadras do organizador
- Badge de status: PENDENTE (amarelo) / APROVADO (verde) / REJEITADO (vermelho)
- Botão "Cadastrar Nova Quadra" → `cadastrar-quadra.tsx`

### `(organizador)/cadastrar-quadra.tsx`
Mesmo formulário da Etapa 2 do cadastro de organizador (reutilizar componentes):
- CNPJ, Razão Social, CEP → ViaCEP auto-fill, Endereço, Telefone, Fotos
- Submit → INSERT em `quadras` com `status_aprovacao = 'PENDENTE'`

### `(organizador)/criar-evento.tsx` — 4 etapas
Barra de progresso no topo (Etapa X de 4)

**Etapa 1 — Informações:**
- Dropdown para selecionar quadra aprovada
- Título, esporte (grid de cards), formato (chips), ambiente (toggle), nível

**Etapa 2 — Data e Horário:**
- Date picker, hora início, hora fim

**Etapa 3 — Vagas e Preço:**
- Slider de vagas (2–50, default 12)
- Input de preço por vaga
- Preview: "Receita potencial: R$ X" (vagas × preço)
- Se preço = 0 → aviso "Evento gratuito"

**Etapa 4 — Revisão:**
- Resumo completo de todos os dados
- Botão "Publicar Evento" → INSERT em `eventos` → voltar ao dashboard

### `(organizador)/evento/[id].tsx` — Gestão
1. Título + status badge
2. Receita: soma pagamentos APROVADOS deste evento
3. Botões: "✅ Marcar Concluído" | "❌ Cancelar Evento" (com Alert de confirmação)
4. Lista de CONFIRMADOS: avatar + nome + hora confirmação + valor pago + botão "Remover"
5. Lista de AGUARDANDO_PAGAMENTO (cinza, sem botão de remover)

---

## Fase 10 — Chat em Tempo Real

### `app/chat/[eventoId].tsx`
- Verificar acesso: usuário é organizador do evento OU tem `status_presenca = 'CONFIRMADO'`
- Se sem acesso: card "💬 Chat disponível após confirmação do pagamento"
- Subscrever canal Supabase Realtime:
```typescript
supabase.channel(`chat:${eventoId}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'mensagens_chat',
    filter: `id_evento=eq.${eventoId}`
  }, (payload) => setMensagens(prev => [...prev, payload.new]))
  .subscribe();
```
- FlatList invertida
- `ChatMessage`: balão direita verde (próprias) / esquerda cinza (outros) + nome + hora
- Input bar fixo + botão enviar verde
- INSERT em `mensagens_chat` ao enviar

---

## Fase 11 — Notificações Push

### `lib/notifications.ts`
```typescript
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
});

export async function registrarPushToken(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await supabase.from('usuarios').update({ expo_push_token: token }).eq('id_usuario', userId);
}
```
Chamar `registrarPushToken(userId)` no `AuthContext` após login.

---

## Fase 12 — Hooks Principais

### `hooks/useJogosDoDia.ts`
- Query na view `eventos_com_vagas` filtrada por data = hoje e status = ABERTO
- Filtros opcionais por esporte, ambiente e nível
- Realtime em `participacoes` para atualizar vagas ao vivo
- Retornar: `{ jogos, loading, error }`

### `hooks/useEventoDetalhe.ts`
- Buscar evento + participações (com JOIN em usuarios) + avaliações
- Verificar participação do usuário atual e seu status
- Calcular média de avaliações da quadra
- Retornar: `{ evento, participantes, minhaParticipacao, mediaAvaliacoes, loading }`

### `hooks/useParticipacao.ts`
- `iniciarCheckout(id_evento)`: chamar Edge Function `criar-checkout` via `supabase.functions.invoke`
- `verificarParticipacao(id_evento)`: retornar status atual do usuário
- Retornar: `{ iniciarCheckout, loading, error }`

### `hooks/useQuadras.ts`
- `fetchQuadrasOrganizador()`: quadras do organizador logado
- `fetchQuadraPorId(id)`: detalhes e fotos
- `cadastrarQuadra(dados)`: INSERT + upload de fotos
- `fetchQuadrasProximas(lat, lng, raio)`: para o mapa

---

## Fase 13 — Estados de UI Obrigatórios

Em **todas** as telas implementar:
- **Loading:** `ActivityIndicator` centralizado com `color='#00C853'`
- **Erro:** mensagem descritiva + botão "Tentar novamente"
- **Vazio:** ícone + texto (ex: "Nenhum jogo disponível hoje na sua região 😔")
- **Feedback de ações:** `Alert.alert` para ações destrutivas (cancelar, remover)
- **Toast de sucesso:** após confirmar presença, enviar mensagem, etc.

---

## Regras de Negócio Críticas

> ⚠️ Implementar sem exceção — são o coração do sistema:

1. **Vaga JAMAIS confirmada pelo frontend:** Apenas o webhook do Stripe (Edge Function com `service_role_key`) pode fazer UPDATE de `status_presenca` para `CONFIRMADO`. O frontend só abre o checkout.

2. **Organizador só cria evento com quadra aprovada:** Verificar `status_aprovacao = 'APROVADO'` na query de quadras disponíveis. A RLS no banco bloqueia na segunda camada.

3. **Chat restrito a pagantes:** A política RLS em `mensagens_chat` exige `status_presenca = 'CONFIRMADO'`. A UI verifica antes de renderizar o input.

4. **Avaliação apenas pós-evento:** Mostrar UI de avaliação somente quando: `evento.status = 'CONCLUIDO'` AND `data_evento < new Date()` AND participação CONFIRMADA existe AND registro em `avaliacoes` ainda não existe para esse par (evento, avaliador).

5. **Auto-lotação:** Webhook verifica `vagas_restantes` após cada confirmação. Se = 0, faz UPDATE `eventos.status = 'LOTADO'` automaticamente.

6. **Controle de corrida (race condition):** A constraint `UNIQUE(id_evento, id_jogador)` em `participacoes` impede dupla inscrição. A Edge Function verifica `vagas_restantes > 0` antes de criar o checkout.
