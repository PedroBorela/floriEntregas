# Plano de Implementação 3 — Responsividade, Clientes e Gestão de Pedidos

**Data:** 2026-05-12
**Projeto:** floriEntregas
**Branch sugerida:** thirdedit (continuar) ou feat/implementacao3

---

## Visão Geral

Este plano agrupa 13 melhorias em 4 fases, do mais urgente ao mais complexo. As fases 1 e 2 podem ser feitas sem migrações de banco; as fases 3 e 4 exigem novas tabelas/colunas no Supabase.

---

## Fase 1 — Correções de Bug (sem migração)

### 1.1 Responsividade mobile em `ProdutoLinhaItem`

**Problema:** O componente usa `flex gap-2 items-start` numa única linha com `w-24` (preço), controles de quantidade e subtotal `w-20`. Em telas < 400px o campo de nome fica com ~80px, inutilizável.

**Arquivo:** `components/produtos/ProdutoLinhaItem.tsx`

**Solução:** Reorganizar em 2 linhas no mobile:
- Linha 1: campo nome (largura total)
- Linha 2: preço + qty + subtotal + botão remover

```tsx
// Layout atual (flat flex):
<div className="flex gap-2 items-start">
  [nome] [preço w-24] [qty] [subtotal w-20] [×]

// Novo layout (mobile-first grid):
<div className="flex flex-col gap-2">
  {/* Linha 1: nome */}
  <div className="relative" ref={wrapRef}>
    <input ... className="form-input w-full pr-16" />
    {/* autocomplete dropdown */}
  </div>
  {/* Linha 2: preço + qty + subtotal + remover */}
  <div className="flex items-center gap-2">
    <input type="number" className="form-input w-24" ... />   {/* preço */}
    <button ...>−</button>
    <span ...>{item.quantidade}</span>
    <button ...>+</button>
    <span className="ml-auto text-sm text-gray-600 shrink-0">{formatarMoeda(subtotal)}</span>
    <button ... aria-label="Remover">×</button>
  </div>
</div>
```

**Esforço:** ~30 min. Sem dependências.

---

### 1.2 Fix autocomplete de endereço — bairro errado selecionado

**Problema:** A Nominatim retorna para "Avenida Getúlio Vargas, Manhuaçu" um resultado cujo `display_name` lista múltiplos bairros (Coqueiro, Baixada, Bela Vista), mas o campo `address.suburb` contém "Bela Vista" em vez do bairro correto "Coqueiro". O usuário não sabe qual bairro será aplicado antes de clicar.

**Arquivo:** `components/endereco/CampoEndereco.tsx`, `hooks/useGeocoding.ts`

**Solução em 2 partes:**

**Parte A — Mostrar o bairro extraído no item da lista:**
```tsx
// Em CampoEndereco.tsx, dentro do <li> da sugestão, exibir o bairro que será extraído:
const bairroExtraido = s.address?.suburb ?? s.address?.neighbourhood ?? s.address?.city_district ?? '—'
<li ...>
  <div className="flex flex-col">
    <span className="text-sm text-gray-800">{s.address?.road ?? s.display_name.split(',')[0]}</span>
    <span className="text-xs text-gray-500">Bairro: {bairroExtraido}</span>
  </div>
</li>
```

Com isso o usuário vê "Bairro: Bela Vista" e pode escolher não clicar, ou corrigir o campo bairro manualmente depois.

**Parte B — Limitar a 3 resultados e desduplicar por bairro:**
```ts
// Em api/geocoding/route.ts, mudar limit=5 para limit=3
const url = `...&limit=3`
```

Em `useGeocoding` ou em `CampoEndereco`, filtrar para exibir no máximo 1 sugestão por bairro distinto (evitar 3 linhas do mesmo endereço em bairros diferentes que confundem o usuário).

**Parte C — Campo bairro sempre editável (já é, mas clarificar visualmente):**
Adicionar `hint` abaixo do campo bairro: `"Confirme o bairro antes de salvar"` quando o endereço foi preenchido via geocoding.

**Esforço:** ~45 min. Sem migração.

---

## Fase 2 — Gestão de Pedidos (sem migração de tabelas, só colunas)

### 2.1 Editar pedido após finalização

**Motivação:** Corrigir erros sem refazer o pedido do zero.

**Fluxo:**
1. Página `/pedidos/[codigo]` ganha botão "Editar pedido" (visível para status ≠ `entregue` e ≠ `retirado`)
2. Abre modal com os mesmos campos do formulário de entrega/retirada pré-preenchidos
3. `PATCH /api/pedidos/[id]` — rota já existe, só precisa aceitar mais campos além de `status`
4. Ao salvar, registra em `observacoes` uma linha: `[EDITADO 12/05 22:05] Alterado por usuário`

**Arquivos a criar/alterar:**
- `components/pedidos/ModalEdicaoPedido.tsx` — novo modal com form completo (reutiliza `CampoProdutos`, `CampoEndereco`)
- `app/(dashboard)/pedidos/[codigo]/page.tsx` — adiciona botão + estado de abertura do modal
- `app/api/pedidos/[id]/route.ts` — expandir o PATCH para aceitar todos os campos editáveis

**Regra de negócio:**
- Pedidos `cancelado` não podem ser editados
- Produtos e valor são recalculados automaticamente
- O `codigo` nunca muda

**Esforço:** ~3h

---

### 2.2 Cancelar pedido com motivo

**Migração necessária:** Adicionar coluna `motivo_cancelamento TEXT` à tabela `pedidos`.

```sql
-- supabase/migrations/YYYYMMDD_cancelamento.sql
ALTER TABLE pedidos ADD COLUMN motivo_cancelamento TEXT;
```

**Fluxo:**
1. Botão "Cancelar pedido" em `/pedidos/[codigo]` (vermelho, visível em qualquer status ativo)
2. Modal de confirmação com campo de texto obrigatório: "Motivo do cancelamento"
3. `PATCH /api/pedidos/[id]` com `{ status: 'cancelado', motivo_cancelamento: '...' }`
4. O motivo aparece na página de detalhe com destaque visual (caixa vermelha)

**Arquivos:**
- `components/pedidos/ModalCancelamento.tsx` — novo
- `app/(dashboard)/pedidos/[codigo]/page.tsx` — botão + modal
- `app/api/pedidos/[id]/route.ts` — aceitar `motivo_cancelamento` no PATCH
- `lib/types.ts` — adicionar `motivo_cancelamento: string | null` em `Pedido`

**Esforço:** ~1.5h

---

### 2.3 Filtros de pedidos por data, status e cliente

**Arquivo:** `components/pedidos/ListaPedidos.tsx`, `app/api/pedidos/route.ts`

**Filtros a adicionar:**
- **Data:** seletor "de / até" com atalhos (Hoje, Esta semana, Este mês)
- **Status:** multi-select chips (reutilizar visual já existente nos badges)
- **Cliente:** campo de texto com busca por nome ou telefone

**Implementação:**
```tsx
// Estado local em ListaPedidos ou na page /pedidos:
const [filtros, setFiltros] = useState({
  dataInicio: hoje,
  dataFim: hoje,
  status: [] as PedidoStatus[],
  busca: '',       // nome ou telefone do cliente
})
```

A API `/api/pedidos?status=pendente,em_preparo&dataInicio=2026-05-01&busca=maria` já recebe query params no GET — só precisar expandir o handler para aceitar os novos params e montar as queries Supabase correspondentes.

**Esforço:** ~2h

---

### 2.4 Alertas visuais para pedidos urgentes ou atrasados

**Arquivo:** `components/pedidos/CardPedido.tsx`

**Regras:**
| Condição | Visual |
|---|---|
| `data_entrega` = hoje + status ≠ entregue/cancelado | Badge amarelo "Hoje" |
| `data_entrega` < hoje + status ≠ entregue/cancelado | Badge vermelho "Atrasado" + borda vermelha no card |
| `horario_entrega` dentro de 2h e status = `em_preparo` | Ícone de relógio laranja |

**Lógica a adicionar em `CardPedido.tsx`:**
```ts
const hoje = new Date()
const dataEntrega = pedido.data_entrega ? new Date(pedido.data_entrega) : null
const atrasado = dataEntrega && dataEntrega < hoje && !['entregue','retirado','cancelado'].includes(pedido.status)
const urgente = dataEntrega && isSameDay(dataEntrega, hoje) && pedido.status === 'em_preparo'
```

Na listagem de pedidos, ordenar atrasados antes dos demais.

**Esforço:** ~1h

---

## Fase 3 — Gestão de Clientes (migração necessária)

### Migrações de banco

```sql
-- supabase/migrations/YYYYMMDD_clientes_v2.sql

-- Expandir tabela clientes
ALTER TABLE clientes
  ADD COLUMN whatsapp TEXT,
  ADD COLUMN preferencias TEXT,
  ADD COLUMN observacoes TEXT;

-- Datas comemorativas
CREATE TABLE cliente_datas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,        -- 'aniversario' | 'casamento' | 'outro'
  descricao TEXT,            -- ex: "Aniversário de casamento"
  data DATE NOT NULL,        -- sem ano fixo (usar MM-DD) ou data completa
  lembrar_dias_antes INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de endereços por cliente
CREATE TABLE cliente_enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  logradouro TEXT NOT NULL,
  numero TEXT,
  bairro TEXT,
  cidade TEXT DEFAULT 'Manhuaçu',
  estado TEXT DEFAULT 'MG',
  cep TEXT,
  referencia TEXT,
  apelido TEXT,              -- ex: "Casa", "Trabalho"
  vezes_usado INT DEFAULT 1,
  ultimo_uso TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS permissivo (igual ao restante do projeto)
ALTER TABLE cliente_datas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_enderecos ENABLE ROW LEVEL SECURITY;
CREATE POLICY acesso_total ON cliente_datas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY acesso_total ON cliente_enderecos FOR ALL USING (true) WITH CHECK (true);
```

---

### 3.1 Busca de cliente ao iniciar pedido

**Motivação:** Evitar redigitar dados de clientes conhecidos.

**Fluxo:**
1. Campo "Telefone do comprador" ganha autocomplete: ao digitar 3+ dígitos, busca na tabela `clientes` por telefone (mais comum) ou nome
2. Ao selecionar um cliente, preenche automaticamente: nome, telefone, e mostra lista de endereços anteriores
3. Se cliente não encontrado, flui normalmente (novo cliente salvo ao confirmar o pedido)

**Componente novo:** `components/formulario/CampoCliente.tsx`
- Aceita `value: { id, nome, telefone }` e `onChange`
- Usa debounce 300ms
- Mostra sugestões do Supabase: `SELECT * FROM clientes WHERE telefone ILIKE '%termo%' OR nome ILIKE '%termo%' LIMIT 5`
- Ao selecionar: preenche nome + telefone, emite evento `onClienteSelecionado(cliente)`

**Onde integrar:**
- `components/formulario/FormularioEntrega.tsx` — substituir inputs de nome/telefone por `<CampoCliente>`
- `components/formulario/FormularioRetirada.tsx` — idem

**Esforço:** ~2h

---

### 3.2 Cadastro de clientes recorrentes com histórico de endereços

**Nova página:** `app/(dashboard)/clientes/page.tsx`
- Lista paginada de clientes com nome, telefone, nº de pedidos, último pedido
- Botão "Novo cliente"
- Busca por nome ou telefone

**Nova página:** `app/(dashboard)/clientes/[id]/page.tsx`
- Dados do cliente (editáveis inline)
- Histórico de endereços (tabela `cliente_enderecos`) com opção de usar em novo pedido
- Histórico de pedidos do cliente
- Datas comemorativas

**API:** `app/api/clientes/route.ts` (GET lista, POST criar)
**API:** `app/api/clientes/[id]/route.ts` (GET detalhe, PATCH editar, DELETE)

**Integração com pedidos:**
- Ao criar pedido com cliente reconhecido (`cliente_id` preenchido), salvar/atualizar o endereço em `cliente_enderecos` (incrementar `vezes_usado`)
- `cliente_id` já existe na tabela `pedidos` — apenas garantir que está sendo preenchido ao selecionar cliente

**Esforço:** ~4h

---

### 3.3 Destinatário separado do comprador

**Status:** Parcialmente implementado — `destinatario_nome` e `destinatario_telefone` já existem na tabela `pedidos` e nos formulários.

**O que falta:**
- Tornar o bloco de destinatário condicional e visível só quando marcado "Entrega para terceiro / presente"
- Adicionar campo `destinatario_endereco_diferente BOOLEAN` (ou usar address existente como destinatário por padrão)
- Exibir na comanda impressa: "De: [comprador] → Para: [destinatário]"

**Arquivo:** `components/formulario/FormularioEntrega.tsx` — reorganizar seção destinatário com toggle "Este pedido é um presente?"

**Esforço:** ~1h

---

### 3.4 Datas comemorativas do cliente

**Tabela:** `cliente_datas` (criada na migração acima)

**Funcionalidade:**
- Na página `/clientes/[id]` — CRUD de datas (aniversário, casamento, outro)
- Widget "Próximas datas" no dashboard `/pedidos` — lista clientes com data comemorativa nos próximos 7 dias, com ação rápida "Iniciar pedido"
- Alerta visual no card do cliente na listagem quando há data comemorativa próxima

**Esforço:** ~2h

---

## Fase 4 — Entregas e Notificações

### 4.1 Janela de horário de entrega

**Status:** Campo `horario_entrega TEXT` já existe na tabela `pedidos`.

**O que mudar:**
- Substituir input de texto livre por seletor de janela padronizado:

```tsx
const JANELAS = [
  { value: 'manha',  label: 'Manhã (8h–12h)' },
  { value: 'tarde',  label: 'Tarde (12h–18h)' },
  { value: 'noite',  label: 'Noite (18h–21h)' },
  { value: 'livre',  label: 'Horário específico...' },
]
```

- Quando `value === 'livre'`, mostrar input de texto para hora exata
- Exibir a janela na comanda impressa e no card do pedido

**Arquivo:** `components/formulario/FormularioEntrega.tsx` — alterar campo horário

**Esforço:** ~30 min

---

### 4.2 Confirmação automática via WhatsApp

**Abordagem:** Link `wa.me` (sem API paga) — abre WhatsApp com mensagem pré-preenchida para o atendente enviar em 1 clique.

**Fluxo:**
1. Pedido criado → tela de confirmação mostra botão "Enviar confirmação WhatsApp"
2. Clique abre `https://wa.me/55[telefone]?text=[mensagem_codificada]`
3. Mensagem template:
```
Olá [nome]! 🌸 Seu pedido *[codigo]* na Natureza em Flores foi confirmado!
📦 Produtos: [lista]
📅 Entrega: [data] — [janela]
📍 [endereço]
💰 Total: [valor]
Qualquer dúvida, estamos à disposição!
```

**Componente:** `components/pedidos/BotaoWhatsApp.tsx`
- Recebe `pedido: Pedido` e gera o link wa.me
- Variante "confirmação" (para comprador) e "saiu para entrega" (para destinatário)

**Migração:** Adicionar coluna `whatsapp_enviado BOOLEAN DEFAULT false` e `whatsapp_enviado_em TIMESTAMPTZ` em `pedidos` para rastrear se a mensagem foi disparada.

**Esforço:** ~1.5h

---

### 4.3 Notificação ao comprador quando sai para entrega

**Fluxo:**
1. Ao mudar status de `em_preparo` → `saiu_entrega` (via `StatusDropdown` ou `PainelStatus`), verificar se `cliente_telefone` está preenchido
2. Se sim, exibir toast com botão "Avisar comprador no WhatsApp"
3. Clique abre `wa.me/55[cliente_telefone]?text=[mensagem]`

```
Olá [cliente_nome]! Seu pedido da Natureza em Flores saiu para entrega. 🚚🌸
Pedido [codigo] — previsão: [janela_entrega]
```

**Arquivo:** `components/pedidos/StatusDropdown.tsx` ou `hooks/usePedidosDia.ts` — interceptar mudança de status `saiu_entrega`

**Esforço:** ~1h

---

## Resumo e Ordem de Execução

| # | Tarefa | Fase | Migração | Esforço |
|---|--------|------|----------|---------|
| 1 | Responsividade mobile (ProdutoLinhaItem) | 1 | ❌ | ~30 min |
| 2 | Fix bairro no geocoding | 1 | ❌ | ~45 min |
| 3 | Janela de horário de entrega | 4 | ❌ | ~30 min |
| 4 | Alertas visuais atrasados/urgentes | 2 | ❌ | ~1h |
| 5 | Cancelar pedido com motivo | 2 | ✅ coluna | ~1.5h |
| 6 | Editar pedido após finalização | 2 | ❌ | ~3h |
| 7 | Filtros de pedidos | 2 | ❌ | ~2h |
| 8 | Destinatário separado (completar) | 3 | ❌ | ~1h |
| 9 | Botão WhatsApp (confirmação + saiu) | 4 | ✅ colunas | ~2.5h |
| 10 | Busca de cliente ao iniciar pedido | 3 | ❌ | ~2h |
| 11 | Datas comemorativas | 3 | ✅ tabela | ~2h |
| 12 | Histórico de endereços e clientes recorrentes | 3 | ✅ tabela | ~4h |
| 13 | Notificação destinatário (saiu p/ entrega) | 4 | ❌ | ~1h |

**Total estimado:** ~22h de desenvolvimento

---

## Arquivos a Criar

```
app/(dashboard)/clientes/
  page.tsx                          # lista de clientes
  [id]/page.tsx                     # perfil do cliente

app/api/clientes/
  route.ts                          # GET lista, POST criar
  [id]/route.ts                     # GET, PATCH, DELETE

components/formulario/
  CampoCliente.tsx                  # autocomplete de cliente

components/pedidos/
  ModalEdicaoPedido.tsx             # edição de pedido
  ModalCancelamento.tsx             # cancelamento com motivo
  BotaoWhatsApp.tsx                 # link wa.me gerador

supabase/migrations/
  YYYYMMDD_cancelamento.sql         # coluna motivo_cancelamento
  YYYYMMDD_clientes_v2.sql          # expand clientes + novas tabelas
  YYYYMMDD_whatsapp_tracking.sql    # colunas whatsapp_enviado
```

## Arquivos a Alterar

```
components/produtos/ProdutoLinhaItem.tsx   # mobile layout
components/endereco/CampoEndereco.tsx      # fix geocoding display
app/api/geocoding/route.ts                 # limit=3
hooks/useGeocoding.ts                      # deduplicate por bairro
components/pedidos/CardPedido.tsx          # alertas visuais
components/pedidos/ListaPedidos.tsx        # filtros avançados
components/pedidos/StatusDropdown.tsx      # trigger WhatsApp saiu_entrega
components/formulario/FormularioEntrega.tsx  # CampoCliente + janela horário
app/api/pedidos/route.ts                   # filtros no GET
app/api/pedidos/[id]/route.ts              # PATCH expandido
lib/types.ts                               # novos campos
```
