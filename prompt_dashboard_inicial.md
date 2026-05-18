# Prompt — Rota inicial `/dashboard` do floriEntregas

> Cole este prompt no Claude Code dentro da pasta do projeto `floriEntregas`. O Claude já lê os arquivos do repo, então não precisa colar código existente.

---

## Contexto

Estou trabalhando no projeto **floriEntregas** — sistema de gestão de pedidos da floricultura **Natureza Em Flores** (Manhuaçu/MG).

**Stack atual:**
- Next.js 16.2.6 (App Router) + TypeScript + React 19
- Tailwind CSS v4 (sem `tailwind.config.ts` — configuração via CSS)
- Supabase (PostgreSQL + `@supabase/supabase-js` v2 + `@supabase/ssr`)
- Deploy: Railway via Dockerfile

**Tabelas relevantes já existentes:**

| Tabela | Colunas-chave |
|---|---|
| `pedidos` | `id`, `codigo` (ex: `NEF-20260517-001`), `tipo` (`entrega`\|`retirada`), `status` (ver enum abaixo), `cliente_id`, `cliente_nome`, `data_entrega DATE`, `horario_entrega TEXT` (ex: `"Manhã (8h–12h)"`), `valor_total`, `pago`, `valor_pago`, `pagamento_tipo`, `vendedor_id`, `presente_anonimo`, `impresso`, `motivo_cancelamento`, `created_at`, `updated_at` |
| `pedido_itens` | `pedido_id`, `nome_produto`, `valor_unitario`, `quantidade`, `subtotal` (computed), `ordem` |
| `clientes` | `id`, `nome`, `telefone` |
| `pagamentos` | `pedido_id`, `tipo`, `valor`, `pago`, `valor_pago` |
| `vendedores` | `id`, `nome`, `ativo` |
| `pedido_status_log` | `pedido_id`, `status_anterior`, `status_novo`, `created_at` |
| `enderecos` | `cliente_id`, `logradouro`, `bairro`, `cidade` |
| `destinatarios` | `cliente_id`, `nome`, `telefone` |

**Enum de status (campo TEXT com CHECK):**
```
pendente → em_preparo → saiu_entrega → entregue
                                    ↘ retirado   (tipo = 'retirada')
cancelado  (qualquer estado)
```

**Dependências já instaladas:** `lucide-react`, `recharts`, `@supabase/supabase-js`, `@supabase/ssr`, `qrcode.react`, `leaflet`. **`date-fns` NÃO está instalada** — usar `Intl.DateTimeFormat` e `Intl.NumberFormat` para formatação.

**Atenção:** `horario_entrega` é `TEXT`, não `TIME`. Suporta valores como `"Manhã (8h–12h)"`, `"Tarde (12h–18h)"`, `"Noite (18h–21h)"` ou horários específicos como `"14:30"`. Não há campos `janela_entrega_inicio` nem `janela_entrega_fim`.

## Tarefa

Criar uma **nova rota `/dashboard`** que será a página inicial operacional do sistema — substitui a tela atual (que redireciona para `/entrega`) sem perder funcionalidades antigas, melhorando a experiência de entrada. Foco: visão operacional do dia para gerente e equipe no balcão.

## Componentes da página (ordem vertical exata)

### 1. Cabeçalho

- Linha superior: label pequeno `Natureza Em Flores · Painel do dia` em uppercase, cor `text-green-900`
- Linha principal: saudação por horário em peso 500 + data formatada por extenso
  - Exemplo: `Bom dia — sábado, 17 de maio`
- Saudação muda por horário: `Bom dia` (até 12h), `Boa tarde` (12–18h), `Boa noite` (após 18h)
- Data dinâmica com `Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })`
- **Sem usuário nominal** — sistema não tem autenticação

### 2. Badge de pedidos atrasados (condicional)

- Renderiza **apenas se** existir ao menos 1 pedido com `data_entrega < CURRENT_DATE` e `status NOT IN ('entregue', 'retirado', 'cancelado')`
- Background `bg-red-50`, border-left vermelho de 3px
- Ícone `AlertTriangle` (lucide-react)
- Texto: `{N} pedido(s) com data de entrega vencida`
- Botão `Ver agora` → navega para `/pedidos?filtro=atrasados`

### 3. Pulso operacional (6 cards de status)

- Título de seção em uppercase + total: `Pulso operacional · {N} pedidos`
- Grid de 3 colunas em mobile, 6 em desktop (ou 2×3 em telas médias)
- Cada card: label do status em uppercase, número grande (22px, peso 700), sublabel descritivo

**Status e cores — usando os valores reais do banco:**

| Status | Label exibido | Cor de fundo | Sublabel |
|---|---|---|---|
| `pendente` | Pendente | neutra (slate-50) | `aguardando preparo` |
| `em_preparo` | Em Preparo | neutra (slate-50) | `florista trabalhando` |
| `saiu_entrega` | Saiu p/ Entrega | warning (amber-50) | `a caminho do cliente` |
| `entregue` | Entregues | success (green-50) | `concluídos hoje` |
| `retirado` | Retirados | success (green-50) | `retirados na loja hoje` |
| `cancelado` | Cancelados | danger (red-50) | `cancelados hoje` |

> Contagem de "hoje" usa `data_entrega = CURRENT_DATE` para `entregue`/`retirado`/`cancelado`. Os demais status (`pendente`, `em_preparo`, `saiu_entrega`) mostram todos os pedidos abertos independente da data.

### 4. Pedidos de hoje

- Título: `Pedidos de hoje` em uppercase + contador
- Lista de pedidos com `data_entrega = CURRENT_DATE`, ordenados por `horario_entrega`
- Cada linha contém:
  - Horário/turno em peso 500 à esquerda (largura fixa ~80px) — exibir `horario_entrega` como texto (ex: `"Tarde"`)
  - Centro: código do pedido + nome do cliente + resumo de itens (primeiros 2 nomes via JOIN em `pedido_itens`) + bairro (`bairro` da tabela `pedidos`)
  - Direita: badge do status com cor correspondente (mesmas do Pulso Operacional)
  - Badge secundário: `Entrega` (azul) ou `Retirada` (roxo) baseado no campo `tipo`
- Linha clicável → navega para `/pedidos/{codigo}`
- Se não houver pedidos hoje → mensagem `Nenhum pedido agendado para hoje`

### 5. Sinais de gestão (4 KPIs com comparação dupla)

- Título: `Sinais de gestão` em uppercase
- Grid de 2 colunas em mobile, 4 em desktop
- Cada card:
  - Label em uppercase pequeno
  - Valor grande (22px, peso 700)
  - Divisor horizontal
  - **Duas linhas de comparação:**
    - Variação vs. **mesmo dia da semana passada** (7 dias atrás)
    - Variação vs. **mesmo dia do mês passado** (~28 dias atrás)
  - Ícone de tendência `TrendingUp` (verde) / `TrendingDown` (vermelho) / `Minus` (cinza) + percentual
  - Regra: positivo→verde, negativo→vermelho, |var|<3%→cinza (estável)

**Os 4 KPIs — baseados nos campos reais:**

| KPI | Cálculo | Unidade |
|---|---|---|
| Receita hoje | `SUM(valor_total)` dos pedidos com `data_entrega = hoje` e status `NOT IN ('cancelado')` | R$ |
| Pedidos hoje | `COUNT(*)` com `data_entrega = hoje` e status `NOT IN ('cancelado')` | número |
| Ticket médio | `AVG(valor_total)` dos pedidos do dia (exceto cancelados) | R$ |
| A receber | `SUM(valor_total - valor_pago)` dos pedidos com `pago = false` e status `NOT IN ('cancelado')` — total geral, não só hoje | R$ |

> "A receber" substitui "SLA entrega" pois não existem campos de janela de tempo no schema.

## Implementação técnica

### Padrão de código do projeto

**IMPORTANTE:** As páginas deste projeto são **Client Components** (`'use client'`) que buscam dados via `fetch('/api/...')`. Seguir o mesmo padrão do `/analytics`.

```
app/
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx              # 'use client' — busca /api/dashboard com useEffect
│   └── layout.tsx                # Já existe — Navbar + max-w-3xl
├── api/
│   └── dashboard/
│       ├── pulso/route.ts        # GET: contagens por status
│       ├── pedidos-hoje/route.ts # GET: pedidos do dia com itens e bairro
│       └── kpis/route.ts        # GET: 4 KPIs com comparativos
└── components/
    └── dashboard/
        ├── HeaderSaudacao.tsx
        ├── BadgeAtrasados.tsx
        ├── PulsoOperacional.tsx
        ├── PedidosHoje.tsx
        └── SinaisDeGestao.tsx
```

### API Routes

**`/api/dashboard/pulso`** — retorna `{ contagens: Record<status, number>, total: number, atrasados: number }`

Conta pedidos por status. Para `entregue`/`retirado`/`cancelado` filtrar por `data_entrega = CURRENT_DATE`. Para os demais, contar todos os abertos. Atrasados = `data_entrega < CURRENT_DATE` AND status NOT IN ('entregue', 'retirado', 'cancelado').

**`/api/dashboard/pedidos-hoje`** — retorna array de pedidos de hoje

Query: pedidos com `data_entrega = CURRENT_DATE`, incluindo `pedido_itens` (JOIN para pegar os 2 primeiros nomes de produto por ordem), ordenados por `horario_entrega`.

**`/api/dashboard/kpis`** — retorna objeto com os 4 KPIs e comparativos

Calcular para hoje, 7 dias atrás e 28 dias atrás. Retornar variação percentual já calculada.

### Supabase client nas API routes

Usar `@supabase/ssr` com `createClient` do servidor (mesma forma que as outras API routes do projeto). Consultar como está sendo feito em `app/api/analytics/route.ts` antes de implementar.

### Tailwind v4

O projeto usa **Tailwind v4** — não há `tailwind.config.ts`. As cores são definidas via classes utilitárias padrão do Tailwind. Para cores de marca, usar as classes `bg-[#1B5E20]` ou `text-[#1B5E20]` quando necessário, ou herdar os padrões do `Navbar` (`bg-[#1B5E20]`).

Cores já em uso no projeto:
- Verde marca: `#1B5E20` (navbar) / `#166534` (analytics primary)
- Laranja: `#ea580c` (accent)
- Fundo neutro: slate-50 / white

### Formatação

- Moeda: importar `formatarMoeda` de `@/lib/formatters` (já existe no projeto)
- Datas: `Intl.DateTimeFormat('pt-BR', ...)` — **não instalar date-fns**
- Número: `Intl.NumberFormat('pt-BR')`

### Ícones disponíveis (lucide-react)

`AlertTriangle`, `TrendingUp`, `TrendingDown`, `Minus`, `Clock`, `Package`, `Truck`, `CheckCircle`, `XCircle`, `Store`

### Tratamento de bordas

- Sem pedidos no dia → cards mostram `0` e sublabels com `—`
- Sem comparativo (sem dados na data passada) → exibir `sem comparativo` em cinza
- API falhar → skeleton de erro com botão de retry (seguir padrão do `/analytics`)
- Loading → `loading.tsx` na rota com skeleton, ou estado `loading` inline (ver analytics)

## Ajuste de layout

O `DashboardLayout` usa `max-w-3xl mx-auto px-4 py-6`. Se a página de dashboard precisar de mais largura (como analytics), sobrescrever com `max-w-7xl mx-auto` dentro do próprio `page.tsx`, assim como está feito em `/analytics`.

## Identidade visual

Paleta já configurada no projeto:
- Verde escuro (primária): `#1B5E20`
- Laranja (accent): `#ea580c`
- Cards: `bg-white rounded-2xl shadow-sm border border-slate-100` (padrão do projeto)

## Critérios de aceite

- [ ] Rota `/dashboard` carrega com dados reais
- [ ] Badge de atrasados aparece apenas quando houver pedidos com `data_entrega` vencida
- [ ] 6 cards de status usam os valores corretos do banco: `pendente`, `em_preparo`, `saiu_entrega`, `entregue`, `retirado`, `cancelado`
- [ ] Pedidos de hoje listam apenas `data_entrega = CURRENT_DATE`
- [ ] Coluna `horario_entrega` exibida como texto (não parsear como TIME)
- [ ] 4 KPIs calculam corretamente — "A receber" usa `valor_total - valor_pago`
- [ ] Comparativos funcionam (testar com data conhecida)
- [ ] Responsivo: funciona em celular (equipe usa no balcão)
- [ ] Sem erros de TypeScript
- [ ] `date-fns` **não** adicionada como dependência

## Entregáveis

1. `app/(dashboard)/dashboard/page.tsx` (Client Component)
2. 3 API routes em `app/api/dashboard/`
3. 5 componentes em `components/dashboard/`
4. Atualizar `app/page.tsx` para redirecionar para `/dashboard` (atualmente redireciona para `/entrega`)
5. Adicionar `{ href: '/dashboard', label: 'Dashboard' }` como **primeiro item** no array `tabs` de `components/ui/Navbar.tsx`

## Comece por

1. Ler `app/api/analytics/route.ts` para entender o padrão de API route + Supabase do projeto
2. Confirmar os valores exatos do campo `status` consultando a migration `supabase/migrations/004_pedidos.sql`
3. Confirmar a estrutura de `pedido_itens` consultando `supabase/migrations/005_pedido_itens.sql`
4. Só depois criar os arquivos

Se houver ambiguidade no schema, **pare e pergunte** antes de codar.