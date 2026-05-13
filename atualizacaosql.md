# Plano de Atualização SQL — floriEntregas

Migração incremental do schema atual (God Table) para arquitetura normalizada.

**Princípio:** zero downtime. Tabelas novas em paralelo. Backfill. Swap. Limpeza.

---

## Visão geral das fases

| Fase | Objetivo | Quebra produção? |
|---|---|---|
| 0 | Backup + branch | Não |
| 1 | Criar tabelas novas vazias | Não |
| 2 | Renomear `produtos_catalogo` → `pedidos_legacy` e criar catálogo limpo | Sim (1 deploy) |
| 3 | Backfill dados antigos para novas tabelas | Não |
| 4 | Atualizar código da aplicação para ler/escrever no novo schema | Sim (gradual) |
| 5 | Dual-write período de validação | Não |
| 6 | Cutover total + drop legacy | Sim (1 deploy) |

---

## Fase 0 — Preparação

**Backup obrigatório**

```sql
-- Supabase Dashboard → Database → Backups → Create manual backup
-- Ou via pg_dump local
```

**Branch isolada**

```bash
git checkout -b refactor/schema-normalizacao
```

**Checklist antes de começar**

- [ ] Backup completo do Supabase
- [ ] Snapshot do schema atual exportado (`pg_dump --schema-only`)
- [ ] Lista de queries no código que tocam `produtos_catalogo` (grep)
- [ ] Ambiente de staging idêntico a produção

---

## Fase 1 — Criar tabelas novas (não-destrutivo)

Executar tudo em uma transação. Nenhuma tabela existente é alterada.

### 1.1 Tabela `enderecos`

```sql
CREATE TABLE enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  apelido TEXT, -- "casa", "trabalho", "mãe"
  cep TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  numero TEXT,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  referencia TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enderecos_cliente ON enderecos(cliente_id);
CREATE INDEX idx_enderecos_cep ON enderecos(cep);
CREATE INDEX idx_enderecos_bairro ON enderecos(bairro);
```

### 1.2 Tabela `destinatarios`

```sql
CREATE TABLE destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  relacao TEXT, -- "esposa", "mãe", "filho"
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_destinatarios_cliente ON destinatarios(cliente_id);
```

### 1.3 Tabela `pedidos` (nova, limpa)

```sql
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL, -- código curto de busca
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  destinatario_id UUID REFERENCES destinatarios(id) ON DELETE SET NULL,
  endereco_id UUID REFERENCES enderecos(id) ON DELETE SET NULL,
  zona_frete_id UUID REFERENCES zonas_frete(id),

  -- snapshot do endereço (proteção contra edição futura)
  endereco_snapshot JSONB,

  status TEXT NOT NULL DEFAULT 'pendente',
  -- pendente, em_preparo, saiu_entrega, entregue, cancelado

  data_entrega DATE,
  horario_entrega TEXT,

  valor_produtos NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_frete NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,

  tem_cartao BOOLEAN DEFAULT FALSE,
  mensagem_cartao TEXT,

  observacoes TEXT,
  motivo_cancelamento TEXT,

  impresso BOOLEAN DEFAULT FALSE,
  impresso_em TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pedidos_codigo ON pedidos(codigo);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_data_entrega ON pedidos(data_entrega);
CREATE INDEX idx_pedidos_created ON pedidos(created_at DESC);
```

### 1.4 Tabela `pagamentos`

```sql
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- pix, dinheiro, cartao_credito, cartao_debito, fiado
  valor NUMERIC(10,2) NOT NULL,
  pago BOOLEAN DEFAULT FALSE,
  pago_em TIMESTAMPTZ,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pagamentos_pedido ON pagamentos(pedido_id);
CREATE INDEX idx_pagamentos_pago ON pagamentos(pago);
```

### 1.5 Tabela `notificacoes_whatsapp`

```sql
CREATE TABLE notificacoes_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  -- confirmacao, saiu_entrega, entregue, lembrete
  destinatario_telefone TEXT NOT NULL,
  enviado BOOLEAN DEFAULT FALSE,
  enviado_em TIMESTAMPTZ,
  erro TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_pedido ON notificacoes_whatsapp(pedido_id);
CREATE INDEX idx_notificacoes_tipo ON notificacoes_whatsapp(tipo);
```

### 1.6 Tabela `pedido_status_log` (auditoria opcional)

```sql
CREATE TABLE pedido_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  alterado_por TEXT, -- user_id ou nome
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_log_pedido ON pedido_status_log(pedido_id);
```

### 1.7 Trigger `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_pedidos
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_enderecos
  BEFORE UPDATE ON enderecos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Fase 2 — Isolar God Table e limpar catálogo

**Renomear tabela atual** (preserva dados, libera nome):

```sql
ALTER TABLE produtos_catalogo RENAME TO pedidos_legacy;
```

**Criar catálogo limpo:**

```sql
CREATE TABLE produtos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  preco_padrao NUMERIC(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  tamanho TEXT,
  categoria TEXT,
  tipo TEXT,
  dica_cuidado TEXT,
  imagem_url TEXT,
  estoque_minimo INT,
  sazonal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_catalogo_ativo ON produtos_catalogo(ativo);
CREATE INDEX idx_catalogo_categoria ON produtos_catalogo(categoria);
```

**Ajustar FK em `pedido_itens`:**

A FK atual aponta para `produtos_catalogo.id`. Como renomeamos para `pedidos_legacy`, a FK quebra. Solução temporária:

```sql
-- remover constraint antiga
ALTER TABLE pedido_itens DROP CONSTRAINT IF EXISTS pedido_itens_produto_catalogo_id_fkey;

-- adicionar nova coluna pedido_id apontando para nova tabela pedidos
ALTER TABLE pedido_itens ADD COLUMN pedido_novo_id UUID REFERENCES pedidos(id);

-- manter produto_catalogo_id apontando para novo catálogo (nullable enquanto migra)
ALTER TABLE pedido_itens
  ADD CONSTRAINT pedido_itens_catalogo_fk
  FOREIGN KEY (produto_catalogo_id) REFERENCES produtos_catalogo(id);
```

⚠️ **Esta fase derruba produção temporariamente.** Deploy junto com Fase 4 (código atualizado).

---

## Fase 3 — Backfill dos dados

Migrar dados de `pedidos_legacy` para tabelas novas.

### 3.1 Extrair catálogo único de `pedidos_legacy`

```sql
INSERT INTO produtos_catalogo (id, nome, preco_padrao, ativo, tamanho, categoria, tipo, dica_cuidado, imagem_url, created_at)
SELECT DISTINCT ON (nome, tamanho)
  id,
  nome,
  preco_padrao,
  COALESCE(ativo, TRUE),
  tamanho,
  categoria,
  tipo,
  dica_cuidado,
  imagem_url,
  created_at
FROM pedidos_legacy
WHERE nome IS NOT NULL
ORDER BY nome, tamanho, created_at DESC;
```

### 3.2 Extrair endereços

```sql
INSERT INTO enderecos (cliente_id, cep, logradouro, numero, bairro, cidade, estado, referencia, latitude, longitude, created_at)
SELECT DISTINCT ON (cliente_id, cep, numero)
  cliente_id,
  cep,
  logradouro,
  numero,
  bairro,
  cidade,
  estado,
  referencia,
  latitude,
  longitude,
  created_at
FROM pedidos_legacy
WHERE cep IS NOT NULL AND cliente_id IS NOT NULL;
```

### 3.3 Extrair destinatários

```sql
INSERT INTO destinatarios (cliente_id, nome, telefone, created_at)
SELECT DISTINCT ON (cliente_id, destinatario_nome, destinatario_telefone)
  cliente_id,
  destinatario_nome,
  destinatario_telefone,
  created_at
FROM pedidos_legacy
WHERE destinatario_nome IS NOT NULL
  AND destinatario_nome != COALESCE(cliente_nome, '');
```

### 3.4 Migrar pedidos

```sql
INSERT INTO pedidos (
  id, codigo, cliente_id, zona_frete_id, status,
  data_entrega, horario_entrega,
  valor_produtos, valor_frete, valor_total,
  tem_cartao, mensagem_cartao,
  observacoes, motivo_cancelamento,
  impresso, impresso_em,
  endereco_snapshot,
  created_at, updated_at
)
SELECT
  pl.id,
  COALESCE(SUBSTRING(pl.id::text, 1, 8), gen_random_uuid()::text),
  pl.cliente_id,
  pl.zona_frete_id,
  COALESCE(pl.status, 'pendente'),
  pl.data_entrega,
  pl.horario_entrega,
  COALESCE(pl.valor_produtos, 0),
  COALESCE(pl.valor_frete, 0),
  COALESCE(pl.valor_total, 0),
  COALESCE(pl.tem_cartao, FALSE),
  pl.mensagem_cartao,
  pl.observacoes,
  pl.motivo_cancelamento,
  COALESCE(pl.impresso, FALSE),
  pl.impresso_em,
  jsonb_build_object(
    'cep', pl.cep,
    'logradouro', pl.logradouro,
    'numero', pl.numero,
    'bairro', pl.bairro,
    'cidade', pl.cidade,
    'estado', pl.estado,
    'referencia', pl.referencia,
    'latitude', pl.latitude,
    'longitude', pl.longitude,
    'destinatario_nome', pl.destinatario_nome,
    'destinatario_telefone', pl.destinatario_telefone
  ),
  pl.created_at,
  pl.updated_at
FROM pedidos_legacy pl
WHERE pl.cliente_id IS NOT NULL;
```

### 3.5 Vincular endereco_id e destinatario_id

```sql
UPDATE pedidos p
SET endereco_id = e.id
FROM enderecos e, pedidos_legacy pl
WHERE p.id = pl.id
  AND e.cliente_id = pl.cliente_id
  AND e.cep = pl.cep
  AND e.numero = pl.numero;

UPDATE pedidos p
SET destinatario_id = d.id
FROM destinatarios d, pedidos_legacy pl
WHERE p.id = pl.id
  AND d.cliente_id = pl.cliente_id
  AND d.nome = pl.destinatario_nome;
```

### 3.6 Migrar pagamentos

```sql
INSERT INTO pagamentos (pedido_id, tipo, valor, pago, pago_em, created_at)
SELECT
  id,
  COALESCE(pagamento_tipo, 'pix'),
  COALESCE(valor_pago, valor_total),
  COALESCE(pago, FALSE),
  CASE WHEN pago THEN updated_at ELSE NULL END,
  created_at
FROM pedidos_legacy
WHERE valor_total > 0;
```

### 3.7 Migrar log de WhatsApp

```sql
-- confirmação
INSERT INTO notificacoes_whatsapp (pedido_id, tipo, destinatario_telefone, enviado, enviado_em)
SELECT
  id,
  'confirmacao',
  COALESCE(destinatario_telefone, cliente_telefone),
  COALESCE(whatsapp_confirmacao_enviado, FALSE),
  whatsapp_confirmacao_em
FROM pedidos_legacy
WHERE whatsapp_confirmacao_enviado IS TRUE;

-- saiu para entrega
INSERT INTO notificacoes_whatsapp (pedido_id, tipo, destinatario_telefone, enviado, enviado_em)
SELECT
  id,
  'saiu_entrega',
  COALESCE(destinatario_telefone, cliente_telefone),
  COALESCE(whatsapp_saiu_enviado, FALSE),
  whatsapp_saiu_em
FROM pedidos_legacy
WHERE whatsapp_saiu_enviado IS TRUE;
```

### 3.8 Vincular pedido_itens

```sql
UPDATE pedido_itens
SET pedido_novo_id = pedido_id
WHERE pedido_novo_id IS NULL;

-- validar
SELECT COUNT(*) FROM pedido_itens WHERE pedido_novo_id IS NULL;
-- esperado: 0
```

### 3.9 Validação pós-backfill

```sql
-- contagem deve bater
SELECT
  (SELECT COUNT(*) FROM pedidos_legacy) AS legacy,
  (SELECT COUNT(*) FROM pedidos) AS novo;

-- valores totais
SELECT
  (SELECT SUM(valor_total) FROM pedidos_legacy) AS legacy,
  (SELECT SUM(valor_total) FROM pedidos) AS novo;

-- pedidos órfãos
SELECT COUNT(*) FROM pedidos WHERE endereco_id IS NULL;
SELECT COUNT(*) FROM pedido_itens WHERE pedido_novo_id IS NULL;
```

---

## Fase 4 — Atualizar código da aplicação

Arquivos a alterar (grep `produtos_catalogo` no repo):

**Mapeamento de queries**

| Antes | Depois |
|---|---|
| `supabase.from('produtos_catalogo').select('*')` (catálogo) | `supabase.from('produtos_catalogo').select('id, nome, preco_padrao, ...')` |
| `supabase.from('produtos_catalogo').insert({cliente_id, ...})` | `supabase.from('pedidos').insert({...})` |
| `produtos_catalogo.destinatario_nome` | `pedidos → destinatarios.nome` |
| `produtos_catalogo.cep` | `pedidos → enderecos.cep` |
| `produtos_catalogo.pago` | `pagamentos.pago` |
| `produtos_catalogo.whatsapp_*` | `notificacoes_whatsapp` |

**Padrão de SELECT com JOIN (Supabase)**

```javascript
const { data } = await supabase
  .from('pedidos')
  .select(`
    *,
    cliente:clientes(id, nome, telefone, whatsapp),
    destinatario:destinatarios(id, nome, telefone),
    endereco:enderecos(*),
    zona_frete:zonas_frete(nome, valor),
    itens:pedido_itens(*, produto:produtos_catalogo(nome, imagem_url)),
    pagamentos(*),
    notificacoes:notificacoes_whatsapp(*)
  `)
  .eq('id', pedidoId)
  .single();
```

**Criar pedido (transação no client)**

```javascript
// 1. upsert endereço
const { data: endereco } = await supabase
  .from('enderecos')
  .upsert({ cliente_id, cep, logradouro, numero, bairro, cidade, estado })
  .select()
  .single();

// 2. upsert destinatário se diferente do cliente
let destinatario_id = null;
if (destinatarioNome) {
  const { data: dest } = await supabase
    .from('destinatarios')
    .upsert({ cliente_id, nome: destinatarioNome, telefone: destinatarioTel })
    .select()
    .single();
  destinatario_id = dest.id;
}

// 3. criar pedido
const { data: pedido } = await supabase
  .from('pedidos')
  .insert({
    codigo: gerarCodigo(),
    cliente_id,
    destinatario_id,
    endereco_id: endereco.id,
    zona_frete_id,
    valor_produtos,
    valor_frete,
    valor_total,
    status: 'pendente',
  })
  .select()
  .single();

// 4. itens
await supabase.from('pedido_itens').insert(
  itens.map((i) => ({ ...i, pedido_novo_id: pedido.id }))
);

// 5. pagamento
await supabase.from('pagamentos').insert({
  pedido_id: pedido.id,
  tipo: pagamentoTipo,
  valor: valor_total,
  pago: false,
});
```

---

## Fase 5 — Dual-write (período de validação)

Por **7 dias** após deploy da Fase 4:

- App escreve no schema novo (principal)
- Trigger replica para `pedidos_legacy` (rollback rápido se necessário)

```sql
CREATE OR REPLACE FUNCTION replicar_para_legacy()
RETURNS TRIGGER AS $$
BEGIN
  -- lógica de replicação reversa
  -- (escrever de pedidos → pedidos_legacy)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Monitorar:

- Erros 5xx no Railway logs
- Pedidos com `endereco_id IS NULL`
- Divergência de totais entre tabelas

---

## Fase 6 — Cutover final

Após validação OK:

```sql
-- remover coluna antiga em pedido_itens
ALTER TABLE pedido_itens DROP COLUMN pedido_id; -- ou renomear pedido_novo_id
ALTER TABLE pedido_itens RENAME COLUMN pedido_novo_id TO pedido_id;
ALTER TABLE pedido_itens
  ADD CONSTRAINT pedido_itens_pedido_fk
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE;

-- arquivar legacy
ALTER TABLE pedidos_legacy RENAME TO _archived_pedidos_legacy_2026_05;

-- ou drop após 30 dias
-- DROP TABLE pedidos_legacy;
```

---

## Rollback plan

| Fase | Como reverter |
|---|---|
| 1 | `DROP TABLE` nas novas (sem efeito em produção) |
| 2 | `ALTER TABLE pedidos_legacy RENAME TO produtos_catalogo` |
| 3 | `TRUNCATE` nas tabelas novas + re-backfill |
| 4 | Git revert do deploy |
| 5 | Trigger garante legacy atualizada |
| 6 | Restaurar backup Fase 0 |

---

## Cronograma sugerido

| Semana | Atividade |
|---|---|
| 1 | Fase 0–1 em staging |
| 2 | Fase 2–3 em staging + validação |
| 3 | Fase 4 (refactor código) em branch |
| 4 | Deploy staging completo + testes manuais |
| 5 | Deploy produção (Fase 2–4) |
| 6 | Dual-write monitorado (Fase 5) |
| 7 | Cutover (Fase 6) |

---

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Perda de dados no backfill | Backup + validação por contagem/soma |
| FK quebrada em `pedido_itens` | Migração com coluna nova nullable |
| App quebra em produção | Dual-write + rollback git |
| Endereço editado afeta pedidos antigos | `endereco_snapshot` JSONB no pedido |
| Cliente sem endereço cadastrado | Endereço criado on-the-fly no pedido |

---

## Próximo passo

Executar Fase 0–1 em ambiente staging Supabase. Validar antes de tocar produção.