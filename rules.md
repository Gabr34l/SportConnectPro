# 📋 Regras do Agente — SportConnect Pro

> Define como o agente deve e NÃO deve se comportar em todo o desenvolvimento.

---

## ✅ Regras Obrigatórias

### Planeamento
- **SEMPRE** gerar um Artifact com o plano de ficheiros e ordem de criação ANTES de escrever qualquer código
- **SEMPRE** pedir aprovação do utilizador antes de executar comandos no terminal
- Ordem de trabalho: tipos → lib/supabase → contextos → hooks → componentes → telas

### Código
- **SEMPRE** usar TypeScript estrito — sem `any` implícito
- **SEMPRE** usar `async/await` com `try/catch` para chamadas ao Supabase
- **SEMPRE** criar estados de loading, erro e vazio em todas as telas
- **SEMPRE** usar os tipos de `types/index.ts`
- **SEMPRE** usar as cores de `constants/theme.ts` — nunca hardcodar hex
- **SEMPRE** usar os esportes de `constants/sports.ts`
- Componentes funcionais com hooks apenas
- Ficheiros de componentes em PascalCase
- Hooks com prefixo `use`

### Supabase
- **SEMPRE** usar o cliente de `lib/supabase.ts`
- **SEMPRE** verificar o erro antes de usar dados:
  ```typescript
  const { data, error } = await supabase.from('tabela').select('*');
  if (error) throw error;
  ```
- Uploads de imagem: bucket `avatares` para fotos de perfil, `quadras` para fotos de quadras
- Edge Functions chamadas via `supabase.functions.invoke()`

### Pagamentos
- **NUNCA** confirmar vaga no frontend — apenas o webhook pode fazer isso
- **NUNCA** processar pagamento diretamente no app — sempre via Edge Function
- Stripe Checkout abre via `expo-web-browser` (`WebBrowser.openBrowserAsync`)

### Navegação
- Usar Expo Router com file-based routing — nunca React Navigation direto
- Usar `router` do Expo Router — nunca `useNavigation`
- Proteger rotas verificando sessão nos `_layout.tsx` de cada grupo

### Estilização
- **SEMPRE** NativeWind (classes Tailwind) para estilização
- `className` em todos os componentes
- Estilos dinâmicos com template literals
- Não misturar `StyleSheet.create` com NativeWind no mesmo componente

---

## ❌ Regras Proibidas

- **NÃO** inventar APIs, métodos ou componentes inexistentes
- **NÃO** usar `localStorage` ou `sessionStorage` — usar `AsyncStorage`
- **NÃO** fazer chamadas diretas ao banco — sempre via cliente Supabase
- **NÃO** hardcodar credenciais — sempre variáveis de ambiente `EXPO_PUBLIC_*`
- **NÃO** criar componentes de classe
- **NÃO** usar `console.log` em produção
- **NÃO** implementar pagamentos fora do fluxo Stripe + webhook descrito
- **NÃO** permitir que o frontend atualize `status_presenca` para CONFIRMADO
- **NÃO** criar versão web agora — apenas mobile iOS e Android via Expo
- **NÃO** continuar com erros de compilação — parar e reportar

---

## 🎨 Padrões de Design

### Paleta Verde Obrigatória
- Primária: `#00C853` (botões de ação, CTAs, preços, vagas disponíveis)
- Escura: `#00952A` (estados pressed, gradientes)
- Clara: `#69F0AE` (highlights, selecionados)
- Suave: `#E8F5E9` (fundos de badge, cards selecionados)
- Accent laranja `#FF6D00` apenas para urgência (vagas quase esgotadas, alertas)

### Botões
- Primário: `bg-primary rounded-xl py-4 font-bold text-white`
- Secundário: `border-2 border-primary rounded-xl py-4 font-bold text-primary`
- Perigo: `bg-red-600 rounded-xl py-4 font-bold text-white`
- Desabilitado: adicionar `opacity-40` e `disabled={true}`

### Cards
- `bg-white rounded-2xl shadow-md p-4 mb-3 border border-gray-100`

### Espaçamento de tela
- Padding horizontal: `px-4`
- Padding vertical: `py-6`
- Entre seções: `mb-6`
- Entre itens de lista: `mb-3`

---

## 🔄 Fluxo de Revisão por Fase

Ao completar cada Fase das instructions:
1. Gerar Artifact de **relatório** com o que foi feito e erros resolvidos
2. Listar ficheiros criados/modificados
3. Aguardar aprovação antes de continuar

---

## 🚨 Critérios de Parada Obrigatória

Parar imediatamente e reportar se:
- Dependência não instalar (erro npm/expo)
- Supabase retornar erros de schema
- Conflito de tipos que impeça compilação
- Variáveis de ambiente não definidas
- Qualquer regra de negócio crítica não puder ser implementada como descrito

---

## 📦 Versões Aprovadas

```json
{
  "expo": "~51.0.0",
  "expo-router": "~3.5.0",
  "react-native": "0.74.x",
  "@supabase/supabase-js": "^2.43.0",
  "@stripe/stripe-react-native": "^0.37.0",
  "react-native-maps": "1.14.0",
  "nativewind": "^4.0.0",
  "tailwindcss": "^3.4.0",
  "expo-location": "~17.0.0",
  "expo-notifications": "~0.28.0",
  "expo-image-picker": "~15.0.0",
  "expo-web-browser": "~13.0.0",
  "expo-secure-store": "~13.0.0",
  "@react-native-async-storage/async-storage": "1.23.1",
  "react-native-url-polyfill": "^2.0.0",
  "date-fns": "^3.6.0"
}
```
Não instalar versões mais recentes sem verificar compatibilidade com Expo SDK 51.
