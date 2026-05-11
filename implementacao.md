# Plano de Implementação — Sistema de Pedidos Natureza Em Flores

> **Versão:** 1.0  
> **Data:** 11/05/2026  
> **Projeto:** Reformulação do formulário de Entrega/Retirada  
> **Stack:** Next.js 15 · Supabase · Tailwind CSS · ViaCEP · Leaflet · react-to-print

---

## Contexto

O sistema atual funciona como formulário estático — registra pedidos e imprime cupons, mas não persiste dados, não rastreia status e não evita reimpressão. Clientes frequentemente solicitam produtos personalizados fora do catálogo, gerando necessidade de entrada livre com precificação dinâmica. Pedidos impressos em duplicata causam falhas de comunicação na equipe.

### Problemas identificados

- Nenhuma persistência de dados entre sessões
- Sem código único por pedido — impossível rastrear ou buscar
- Impressão duplicada sem controle gera confusão operacional
- Produtos personalizados não possuem fluxo de cadastro rápido
- Endereço preenchido manualmente — lento e propenso a erros
- Sem visão geográfica das entregas do dia
- Sem cálculo automático de frete por região
- Zero analytics sobre vendas, produtos e receita

### Objetivos

- Persistir todos os pedidos com código rastreável
- Permitir produtos livres com precificação inline
- Autocompletar endereço via CEP e sugestões
- Calcular frete automaticamente por zona
- Visualizar entregas no mapa ordenadas por distância
- Controlar status do pedido (pendente → entregue)
- Imprimir comanda com controle anti-duplicata
- Gerar análises de vendas e desempenho

---

## Stack técnico

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js 15 (App Router) | SSR, rotas API, deploy fácil |
| Estilização | Tailwind CSS | Consistência com projetos existentes |
| Banco de dados | Supabase (PostgreSQL) | Auth, realtime, RLS, storage gratuito |
| CEP | ViaCEP API | Gratuito, sem chave, cobre todo Brasil |
| Geocodificação | Nominatim (OpenStreetMap) | Gratuito, sem chave de API |
| Mapa | Leaflet + react-leaflet | Open source, leve, customizável |
| Impressão | react-to-print | Print nativo do browser, layout customizável |
| Charts | Recharts | Já utilizado no Painel Riffel |
| QR Code | qrcode.react | Gera QR do código do pedido na comanda |

---

## Histórias de usuário mapeadas

| # | História | Fase |
|---|---|---|
| US-01 | Como usuário, gostaria de poder finalizar um pedido | 1 |
| US-02 | Como usuário, gostaria de ter um código de localização de pedido | 1 |
| US-03 | Como usuário, gostaria de pesquisar por código de pedido | 1 |
| US-04 | Como usuário, gostaria de escrever qualquer coisa como produto e identificar com um valor | 2 |
| US-05 | Como usuário, gostaria de alterar quantidade de unidades e ter preço automaticamente | 2 |
| US-06 | Como usuário, gostaria de digitar CEP e autocompletar campos do endereço | 3 |
| US-07 | Como usuário, gostaria de digitar endereço e autocompletar campos | 3 |
| US-08 | Como usuário, gostaria de saber o valor da entrega por valores pré-definidos | 3 |
| US-09 | Como usuário, gostaria de ter um mapa com pontos de entrega por distância | 4 |
| US-10 | Como usuário, gostaria de imprimir uma comanda | 5 |

---

## Modelo de dados (Supabase)

### Tabela `clientes`

```sql
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_clientes_telefone ON clientes(telefone);
```

### Tabela `produtos_catalogo`

```sql
CREATE TABLE produtos_catalogo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco_padrao NUMERIC(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela `zonas_frete`

```sql
CREATE TABLE zonas_frete (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,            -- "Centro", "Bairros próximos", "Distritos"
  bairros TEXT[] NOT NULL,       -- Array de bairros incluídos
  valor NUMERIC(10,2) NOT NULL,  -- Valor fixo da entrega
  ativo BOOLEAN DEFAULT true
);

-- Dados iniciais
INSERT INTO zonas_frete (nome, bairros, valor) VALUES
  ('Centro', ARRAY['Centro', 'Santa Terezinha'], 10.00),
  ('Bairros próximos', ARRAY['Coqueiro', 'Engenho da Serra', 'Petrina'], 15.00),
  ('Distritos', ARRAY['Realeza', 'São Pedro do Avaí'], 25.00);
```

### Tabela `pedidos`

```sql
CREATE TABLE pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,           -- "NEF-20260511-001"
  tipo TEXT NOT NULL CHECK (tipo IN ('entrega', 'retirada')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'em_preparo', 'saiu_entrega', 'entregue', 'retirado', 'cancelado'
  )),

  -- Cliente
  cliente_id UUID REFERENCES clientes(id),
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,

  -- Destinatário (entrega)
  destinatario_nome TEXT,
  destinatario_telefone TEXT,

  -- Endereço (entrega)
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT DEFAULT 'Manhuaçu',
  estado TEXT DEFAULT 'MG',
  referencia TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),

  -- Entrega
  data_entrega DATE,
  horario_entrega TIME,
  zona_frete_id UUID REFERENCES zonas_frete(id),
  valor_frete NUMERIC(10,2) DEFAULT 0,

  -- Cartão
  tem_cartao BOOLEAN DEFAULT false,
  mensagem_cartao TEXT,

  -- Pagamento
  pago BOOLEAN DEFAULT false,
  pagamento_tipo TEXT CHECK (pagamento_tipo IN ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito')),
  pagamento_parcial BOOLEAN DEFAULT false,
  valor_pago NUMERIC(10,2) DEFAULT 0,

  -- Totais
  valor_produtos NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Controle
  impresso BOOLEAN DEFAULT false,
  impresso_em TIMESTAMPTZ,
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Geração automática do código sequencial
CREATE OR REPLACE FUNCTION gerar_codigo_pedido()
RETURNS TRIGGER AS $$
DECLARE
  seq INT;
  data_str TEXT;
BEGIN
  data_str := TO_CHAR(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(codigo, '-', 3) AS INT)
  ), 0) + 1 INTO seq
  FROM pedidos
  WHERE codigo LIKE 'NEF-' || data_str || '-%';

  NEW.codigo := 'NEF-' || data_str || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_codigo_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL)
  EXECUTE FUNCTION gerar_codigo_pedido();

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
```

### Tabela `pedido_itens`

```sql
CREATE TABLE pedido_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_catalogo_id UUID REFERENCES produtos_catalogo(id),  -- NULL se produto livre
  nome_produto TEXT NOT NULL,           -- Texto livre OU nome do catálogo
  valor_unitario NUMERIC(10,2) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (valor_unitario * quantidade) STORED,
  observacao TEXT,
  ordem INT NOT NULL DEFAULT 0
);
```

### Indexes e RLS

```sql
-- Performance
CREATE INDEX idx_pedidos_codigo ON pedidos(codigo);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_data ON pedidos(data_entrega);
CREATE INDEX idx_pedidos_created ON pedidos(created_at DESC);
CREATE INDEX idx_pedido_itens_pedido ON pedido_itens(pedido_id);

-- RLS (habilitar por tabela)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_frete ENABLE ROW LEVEL SECURITY;

-- Policy permissiva (ajustar conforme auth implementado)
CREATE POLICY "acesso_total" ON pedidos FOR ALL USING (true);
CREATE POLICY "acesso_total" ON pedido_itens FOR ALL USING (true);
CREATE POLICY "acesso_total" ON clientes FOR ALL USING (true);
CREATE POLICY "acesso_total" ON produtos_catalogo FOR ALL USING (true);
CREATE POLICY "acesso_total" ON zonas_frete FOR ALL USING (true);
```

---

## Fase 1 — Base: formulário + persistência + código de pedido

**Duração estimada:** 1 semana  
**Histórias:** US-01, US-02, US-03

### Entregas

1. **Estrutura do projeto Next.js**
   - `/app/(dashboard)/entrega/page.tsx` — formulário de entrega
   - `/app/(dashboard)/retirada/page.tsx` — formulário de retirada
   - `/app/(dashboard)/pedidos/page.tsx` — lista de pedidos
   - `/app/(dashboard)/pedidos/[codigo]/page.tsx` — detalhe do pedido
   - `/app/layout.tsx` — navbar com tabs Entrega | Retirada | Pedidos
   - `/lib/supabase.ts` — client Supabase
   - `/lib/types.ts` — tipos TypeScript
   - `/components/FormularioEntrega.tsx`
   - `/components/FormularioRetirada.tsx`
   - `/components/BuscaPedido.tsx`
   - `/components/StatusBadge.tsx`

2. **Formulário de entrega** (reproduz layout atual)
   - Seção cliente: nome, telefone
   - Seção produtos: campo texto + valor (simplificado — fase 2 expande)
   - Seção entrega: data, horário
   - Seção destinatário: nome, telefone, endereço, referência
   - Seção cartão: checkbox + textarea (max 200 chars)
   - Seção pagamento: pago sim/não, total/parcial, tipo
   - Botão "Finalizar Pedido" → insere no Supabase → retorna código
   - Modal de confirmação exibe código `NEF-YYYYMMDD-XXX` em destaque

3. **Formulário de retirada** (subset do entrega)
   - Remove seções de destinatário e endereço
   - Adiciona campo "Data/horário de retirada"
   - Mesmo fluxo de finalização

4. **Tela de pedidos**
   - Campo de busca por código (US-03)
   - Lista paginada com filtros: status, data, tipo
   - Cada card mostra: código, cliente, valor, status, horário
   - Click abre detalhe completo

5. **Supabase setup**
   - Executar migrations SQL acima
   - Configurar variáveis de ambiente
   - Testar trigger de geração de código

### Critérios de aceite — Fase 1

- [ ] Pedido salvo no Supabase com todos os campos
- [ ] Código único gerado automaticamente (formato NEF-YYYYMMDD-XXX)
- [ ] Busca por código retorna pedido correto
- [ ] Formulário limpa após finalização
- [ ] Lista de pedidos carrega com paginação
- [ ] Filtros por status e data funcionam

---

## Fase 2 — Produtos dinâmicos + cálculo automático

**Duração estimada:** 3-4 dias  
**Histórias:** US-04, US-05

### Entregas

1. **Componente `ProdutoLinhaItem`**
   - Input texto livre para nome do produto
   - Autocomplete com sugestões do `produtos_catalogo` (debounced, 300ms)
   - Se seleciona do catálogo → preenche valor unitário automaticamente
   - Se digita texto livre → campo valor unitário editável manualmente
   - Selector de quantidade (- / número / +)
   - Subtotal calculado: `valor_unitario × quantidade`
   - Botão remover linha (ícone lixeira)

2. **Componente `ListaProdutos`**
   - Renderiza N linhas de `ProdutoLinhaItem`
   - Botão "+ Adicionar produto" insere nova linha vazia
   - Cálculo automático do valor total (soma dos subtotais)
   - Exibe total em destaque na parte inferior

3. **Fluxo de cálculo**
   ```
   Usuário digita "Buquê rosas" →
     → Autocomplete sugere "Buquê 12 Rosas Vermelhas - R$89,90"
     → Seleciona → valor_unitario = 89.90, quantidade = 1
     → Altera quantidade para 2 → subtotal = 179.80
     → Adiciona linha → digita "Arranjo personalizado" (sem match)
     → Define valor manualmente: R$150.00
     → Total do pedido: R$329.80
   ```

4. **Atualização do formulário**
   - Substituir campo "Produtos" (texto) + "Valor total" (texto) pelo novo componente
   - `valor_produtos` calculado automaticamente
   - `valor_total = valor_produtos + valor_frete`

### Critérios de aceite — Fase 2

- [ ] Produto do catálogo autocompleta nome e valor
- [ ] Produto livre aceita qualquer texto com valor manual
- [ ] Quantidade alterada recalcula subtotal em tempo real
- [ ] Adicionar/remover linhas recalcula total
- [ ] Mínimo 1 produto para finalizar pedido
- [ ] Itens salvos na tabela `pedido_itens` com referência correta

---

## Fase 3 — Endereço inteligente + frete

**Duração estimada:** 3-4 dias  
**Histórias:** US-06, US-07, US-08

### Entregas

1. **Componente `CampoEndereco`**
   - Campo CEP com máscara (XXXXX-XXX)
   - Ao completar 8 dígitos → fetch `viacep.com.br/ws/{cep}/json/`
   - Preenche automaticamente: logradouro, bairro, cidade, estado
   - Campos preenchidos ficam editáveis (correção manual)
   - Campo número permanece manual
   - Loading spinner durante fetch

2. **Autocomplete de endereço**
   - Ao digitar no campo logradouro (mínimo 3 chars)
   - Busca Nominatim: `https://nominatim.openstreetmap.org/search?q={input},Manhuaçu,MG&format=json`
   - Dropdown com sugestões formatadas
   - Ao selecionar → preenche logradouro, bairro, lat/lng
   - Debounce de 500ms para evitar rate limit

3. **Cálculo de frete automático**
   - Ao preencher bairro (via CEP ou seleção) → match contra `zonas_frete.bairros`
   - Match encontrado → exibe valor e nome da zona
   - Sem match → exibe "Zona não cadastrada" + campo manual para valor
   - Valor do frete soma ao total do pedido
   - Componente visual: badge com nome da zona + valor

4. **Tela admin de zonas de frete** (opcional, pode ser via Supabase Studio)
   - CRUD simples: nome da zona, lista de bairros, valor
   - Permite adicionar novos bairros conforme demanda

### Critérios de aceite — Fase 3

- [ ] CEP válido autocompleta logradouro, bairro, cidade, estado
- [ ] CEP inválido exibe mensagem de erro
- [ ] Digitação no endereço sugere opções do Nominatim
- [ ] Bairro reconhecido exibe zona + valor do frete
- [ ] Bairro não reconhecido permite valor manual
- [ ] Valor frete incluso no cálculo do total
- [ ] Coordenadas lat/lng salvas no pedido

---

## Fase 4 — Mapa de entregas + status tracking

**Duração estimada:** 4-5 dias  
**Histórias:** US-09

### Entregas

1. **Componente `MapaEntregas`**
   - Leaflet com tile OpenStreetMap
   - Centro padrão: Natureza Em Flores, Manhuaçu (-20.2578, -42.0339)
   - Pins de todos os pedidos do dia com status ≠ cancelado
   - Cor do pin por status:
     - Vermelho: pendente
     - Amarelo: em preparo
     - Azul: saiu para entrega
     - Verde: entregue
   - Popup no pin: código, cliente, horário, endereço resumido
   - Click no popup → abre detalhe do pedido

2. **Ordenação por distância**
   - Cálculo haversine entre loja e cada endereço
   - Lista lateral ordenada por distância (mais próximo primeiro)
   - Distância exibida em km (ex: "1.2 km")
   - Toggle: ordenar por distância / ordenar por horário

3. **Painel de status**
   - Cards ou lista com todos pedidos do dia
   - Filtros por status (chips clicáveis)
   - Botão de ação rápida para avançar status:
     - Pendente → Em preparo
     - Em preparo → Saiu para entrega
     - Saiu para entrega → Entregue
   - Timestamp registrado a cada mudança
   - Supabase Realtime: atualização automática quando outro dispositivo muda status

4. **Controle anti-duplicata**
   - Flag `impresso` no pedido
   - Ao clicar "Imprimir": se já impresso → modal de alerta
   - "Este pedido já foi impresso em DD/MM/YYYY HH:MM. Deseja reimprimir?"
   - Registra `impresso_em` no banco

### Critérios de aceite — Fase 4

- [ ] Mapa carrega com pins coloridos por status
- [ ] Popup exibe dados resumidos do pedido
- [ ] Lista ordena por distância da loja
- [ ] Status avança com um clique
- [ ] Realtime: mudança reflete em outros dispositivos
- [ ] Alerta exibido ao tentar reimprimir pedido

---

## Fase 5 — Comanda impressa + analytics

**Duração estimada:** 3-4 dias  
**Histórias:** US-10

### Entregas

1. **Componente `ComandaImpressao`**
   - Layout otimizado para impressora térmica 80mm
   - Layout alternativo para A4 (folha completa)
   - Conteúdo da comanda:
     - Logo Natureza Em Flores (pequeno, topo)
     - Código do pedido em fonte grande e negrito
     - QR Code do código (escaneável para busca rápida)
     - Tipo: ENTREGA ou RETIRADA
     - Data e horário
     - Dados do cliente
     - Lista de itens: nome, qtd, valor unitário, subtotal
     - Valor dos produtos
     - Valor do frete (se entrega)
     - Valor total (destaque)
     - Status de pagamento
     - Endereço completo (se entrega)
     - Mensagem do cartão (se houver, em box separado)
     - Observações (se houver)
     - Rodapé: "Natureza Em Flores — Flores para todas as ocasiões"

2. **Fluxo de impressão**
   ```
   Finalizar pedido → Modal com código
     → Botão "Imprimir Comanda"
       → Se primeira vez: imprime + marca impresso
       → Se já impresso: alerta + opção reimprimir
   
   Tela de pedidos → Botão impressora no card
     → Mesmo fluxo acima
   ```

3. **Dashboard analytics** (página `/analytics`)
   - Filtro por período (hoje, 7 dias, 30 dias, customizado)
   - KPIs em cards:
     - Total de pedidos
     - Receita total
     - Ticket médio
     - Pedidos entrega vs retirada (%)
   - Gráficos:
     - Pedidos por dia (bar chart)
     - Receita por dia (line chart)
     - Top 10 produtos mais vendidos (horizontal bar)
     - Distribuição por forma de pagamento (pie chart)
     - Pedidos por zona de frete (bar chart)

### Critérios de aceite — Fase 5

- [ ] Comanda renderiza corretamente em 80mm e A4
- [ ] QR Code legível e aponta para página do pedido
- [ ] Flag impresso funciona com alerta
- [ ] Dashboard carrega KPIs corretos para o período
- [ ] Gráficos renderizam com dados reais
- [ ] Filtro de período atualiza todos os componentes

---

## Estrutura de pastas

```
natureza-pedidos/
├── app/
│   ├── layout.tsx                    # Navbar + providers
│   ├── (dashboard)/
│   │   ├── entrega/page.tsx          # Formulário entrega
│   │   ├── retirada/page.tsx         # Formulário retirada
│   │   ├── pedidos/
│   │   │   ├── page.tsx              # Lista + busca + mapa
│   │   │   └── [codigo]/page.tsx     # Detalhe do pedido
│   │   └── analytics/page.tsx        # Dashboard
│   └── api/
│       ├── pedidos/route.ts          # CRUD pedidos
│       ├── clientes/route.ts         # Busca/cria clientes
│       └── cep/[cep]/route.ts        # Proxy ViaCEP
├── components/
│   ├── formulario/
│   │   ├── FormularioEntrega.tsx
│   │   ├── FormularioRetirada.tsx
│   │   ├── CampoCliente.tsx
│   │   ├── CampoEndereco.tsx
│   │   ├── CampoCartao.tsx
│   │   └── CampoPagamento.tsx
│   ├── produtos/
│   │   ├── ListaProdutos.tsx
│   │   └── ProdutoLinhaItem.tsx
│   ├── pedidos/
│   │   ├── ListaPedidos.tsx
│   │   ├── CardPedido.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── BuscaPedido.tsx
│   │   └── FiltrosStatus.tsx
│   ├── mapa/
│   │   ├── MapaEntregas.tsx
│   │   └── PinPedido.tsx
│   ├── impressao/
│   │   ├── ComandaImpressao.tsx
│   │   └── ComandaTermica.tsx
│   ├── analytics/
│   │   ├── KpiCards.tsx
│   │   ├── GraficoPedidosDia.tsx
│   │   ├── GraficoReceitaDia.tsx
│   │   ├── GraficoTopProdutos.tsx
│   │   └── GraficoPagamentos.tsx
│   └── ui/
│       ├── Navbar.tsx
│       ├── Modal.tsx
│       ├── Input.tsx
│       └── Button.tsx
├── lib/
│   ├── supabase.ts                   # Client config
│   ├── types.ts                      # TypeScript types
│   ├── utils.ts                      # Helpers
│   ├── haversine.ts                  # Cálculo distância
│   └── formatters.ts                 # Moeda, data, telefone
├── hooks/
│   ├── usePedido.ts                  # CRUD + realtime
│   ├── useProdutos.ts                # Autocomplete catálogo
│   ├── useCep.ts                     # Fetch ViaCEP
│   └── useGeocoding.ts              # Nominatim
└── supabase/
    └── migrations/
        ├── 001_clientes.sql
        ├── 002_produtos_catalogo.sql
        ├── 003_zonas_frete.sql
        ├── 004_pedidos.sql
        └── 005_pedido_itens.sql
```

---

## Cronograma resumido

| Fase | Escopo | Duração | Acumulado |
|---|---|---|---|
| 1 | Base + formulário + código + busca | 5-7 dias | ~1 semana |
| 2 | Produtos dinâmicos + cálculo auto | 3-4 dias | ~2 semanas |
| 3 | CEP + endereço + frete | 3-4 dias | ~2.5 semanas |
| 4 | Mapa + status + realtime | 4-5 dias | ~3.5 semanas |
| 5 | Comanda + analytics | 3-4 dias | ~4.5 semanas |

**Total estimado: 4-5 semanas**

---

## Identidade visual

| Elemento | Valor |
|---|---|
| Cor primária | `#1B5E20` (verde escuro) |
| Cor secundária | `#D4651A` (laranja marca) |
| Cor de fundo | `#F5F5F0` (off-white) |
| Background decorativo | Padrão de rosas (manter referência atual) |
| Fonte títulos | Mantém consistência com identidade existente |
| Slogan rodapé | "Flores para todas as ocasiões, Emoções para toda vida" |

---

## Considerações de deploy

- **Hosting:** Vercel (frontend) — integração nativa com Next.js
- **Banco:** Supabase free tier (500MB, suficiente para operação inicial)
- **Domínio:** Subdomínio do negócio ou domínio dedicado
- **Acesso:** Responsivo — equipe usa celular na loja + desktop no balcão
- **Offline:** Considerar service worker para formulário básico (fase futura)
- **Backup:** Supabase possui backup automático no plano Pro (avaliar necessidade)

---

## Próximos passos

Iniciar pela **Fase 1** — criar projeto Next.js, executar migrations no Supabase e implementar formulário de entrega com persistência e geração de código.