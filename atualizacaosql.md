# Plano de Atualização SQL — floriEntregas

Normalização incremental do schema atual. A tabela `pedidos` concentra endereço,
destinatário, pagamento e rastreio de WhatsApp como colunas soltas. O objetivo é
extrair cada responsabilidade para sua própria tabela.

**Princípio:** zero downtime. Tabelas novas em paralelo. Backfill. Swap. Limpeza.

---

## Estado atual do schema

| Tabela | Papel |
|---|---|
| `clientes` | Clientes cadastrados |
| `pedidos` | Pedidos — contém endereço, destinatário, pagamento e flags de WhatsApp acoplados |
| `pedido_itens` | Itens de cada pedido (FK → `pedidos`) |
| `produtos_catalogo` | Catálogo de produtos (nome, preço) — **não mexer** |
| `zonas_frete` | Zonas e valores de frete |
| `cliente_datas` | Datas especiais por cliente |

### Colunas de `pedidos` que serão normalizadas

| Colunas atuais | Destino |
|---|---|
| `cep`, `logradouro`, `numero`, `bairro`, `cidade`, `estado`, `referencia`, `latitude`, `longitude` | `enderecos` |
| `destinatario_nome`, `destinatario_telefone` | `destinatarios` |
| `pago`, `pagamento_tipo`, `pagamento_parcial`, `valor_pago` | `pagamentos` |
| `whatsapp_confirmacao_enviado/em`, `whatsapp_saiu_enviado/em` | `notificacoes_whatsapp` |

> `cliente_nome` e `cliente_telefone` ficam em `pedidos` como **snapshot histórico**
> (garante que pedidos antigos mostrem o nome correto mesmo se o cliente editar os dados).

---

## Visão geral das fases

| Fase | Objetivo | Quebra produção? |
|---|---|---|
| 0 | Backup + branch | Não |
| 1 | Criar tabelas novas vazias | Não |
| 2 | Backfill — extrair dados de `pedidos` para as novas tabelas | Não |
| 3 | Atualizar código da aplicação para ler/escrever no novo schema | Sim (1 deploy) |
| 4 | Período de validação dual-read | Não |
| 5 | Cutover — remover colunas desnormalizadas de `pedidos` | Sim (1 deploy) |

---

## Fase 0 — Preparação

```sql
-- Supabase Dashboard → Database → Backups → Create manual backup
```

```bash
git checkout -b refactor/schema-normalizacao
```

**Checklist antes de começar**

- [ ] Backup manual criado no Supabase Dashboard
- [ ] Branch `refactor/schema-normalizacao` criada
- [ ] Schema atual exportado (`pg_dump --schema-only`)

---

## Fase 1 — Criar tabelas novas (não-destrutivo)

Nenhuma tabela existente é alterada. Executar tudo de uma vez no SQL Editor.

### 1.1 Tabela `enderecos`

```sql
CREATE TABLE IF NOT EXISTS enderecos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE SET NULL,
  apelido     TEXT,               -- "casa", "trabalho", "mãe"
  cep         TEXT,
  logradouro  TEXT NOT NULL,
  numero      TEXT,
  complemento TEXT,
  bairro      TEXT NOT NULL,
  cidade      TEXT NOT NULL DEFAULT 'Manhuaçu',
  estado      TEXT NOT NULL DEFAULT 'MG',
  referencia  TEXT,
  latitude    NUMERIC(10,7),
  longitude   NUMERIC(10,7),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enderecos_cliente ON enderecos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_bairro  ON enderecos(bairro);

ALTER TABLE enderecos ENABLE ROW LEVEL SECURITY;
CREATE POLICY acesso_total ON enderecos FOR ALL USING (true) WITH CHECK (true);
```

### 1.2 Tabela `destinatarios`

```sql
CREATE TABLE IF NOT EXISTS destinatarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  telefone    TEXT,
  relacao     TEXT,   -- "esposa", "mãe", "filho"
  observacoes TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_destinatarios_cliente ON destinatarios(cliente_id);

ALTER TABLE destinatarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY acesso_total ON destinatarios FOR ALL USING (true) WITH CHECK (true);
```

### 1.3 Tabela `pagamentos`

```sql
CREATE TABLE IF NOT EXISTS pagamentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id   UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,   -- pix, dinheiro, cartao_credito, cartao_debito
  valor       NUMERIC(10,2) NOT NULL,
  pago        BOOLEAN DEFAULT false,
  parcial     BOOLEAN DEFAULT false,
  valor_pago  NUMERIC(10,2) DEFAULT 0,
  pago_em     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON pagamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pago   ON pagamentos(pago);

ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY acesso_total ON pagamentos FOR ALL USING (true) WITH CHECK (true);
```

### 1.4 Tabela `notificacoes_whatsapp`

```sql
CREATE TABLE IF NOT EXISTS notificacoes_whatsapp (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id            UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo                 TEXT NOT NULL,   -- confirmacao, saiu_entrega, entregue, lembrete
  destinatario_telefone TEXT NOT NULL,
  enviado              BOOLEAN DEFAULT false,
  enviado_em           TIMESTAMPTZ,
  erro                 TEXT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_pedido ON notificacoes_whatsapp(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notif_tipo   ON notificacoes_whatsapp(tipo);

ALTER TABLE notificacoes_whatsapp ENABLE ROW LEVEL SECURITY;
CREATE POLICY acesso_total ON notificacoes_whatsapp FOR ALL USING (true) WITH CHECK (true);
```

### 1.5 Tabela `pedido_status_log` (auditoria)

```sql
CREATE TABLE IF NOT EXISTS pedido_status_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id      UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo    TEXT NOT NULL,
  observacao     TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_log_pedido ON pedido_status_log(pedido_id);

ALTER TABLE pedido_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY acesso_total ON pedido_status_log FOR ALL USING (true) WITH CHECK (true);
```

### 1.6 FKs em `pedidos` para as novas tabelas

```sql
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS endereco_id    UUID REFERENCES enderecos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destinatario_id UUID REFERENCES destinatarios(id) ON DELETE SET NULL;
```

### 1.7 Trigger `updated_at` para `enderecos`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_enderecos') THEN
    CREATE TRIGGER set_updated_at_enderecos
      BEFORE UPDATE ON enderecos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
```

---

## Fase 2 — Backfill dos dados existentes

Extrair os dados já em `pedidos` para as novas tabelas. Não-destrutivo.

### 2.1 Backfill `enderecos`

```sql
INSERT INTO enderecos (cliente_id, cep, logradouro, numero, bairro, cidade, estado, referencia, latitude, longitude, created_at)
SELECT DISTINCT ON (cliente_id, COALESCE(cep,''), COALESCE(numero,''))
  cliente_id,
  cep,
  COALESCE(logradouro, ''),
  numero,
  COALESCE(bairro, ''),
  COALESCE(cidade, 'Manhuaçu'),
  COALESCE(estado, 'MG'),
  referencia,
  latitude,
  longitude,
  created_at
FROM pedidos
WHERE logradouro IS NOT NULL AND cliente_id IS NOT NULL
ORDER BY cliente_id, COALESCE(cep,''), COALESCE(numero,''), created_at DESC;
```

### 2.2 Vincular `pedidos.endereco_id`

```sql
UPDATE pedidos p
SET endereco_id = e.id
FROM enderecos e
WHERE e.cliente_id = p.cliente_id
  AND COALESCE(e.cep, '')    = COALESCE(p.cep, '')
  AND COALESCE(e.numero, '') = COALESCE(p.numero, '')
  AND p.endereco_id IS NULL;
```

### 2.3 Backfill `destinatarios`

```sql
INSERT INTO destinatarios (cliente_id, nome, telefone, created_at)
SELECT DISTINCT ON (cliente_id, destinatario_nome)
  cliente_id,
  destinatario_nome,
  destinatario_telefone,
  created_at
FROM pedidos
WHERE destinatario_nome IS NOT NULL
  AND destinatario_nome != COALESCE(cliente_nome, '')
  AND cliente_id IS NOT NULL
ORDER BY cliente_id, destinatario_nome, created_at DESC;
```

### 2.4 Vincular `pedidos.destinatario_id`

```sql
UPDATE pedidos p
SET destinatario_id = d.id
FROM destinatarios d
WHERE d.cliente_id = p.cliente_id
  AND d.nome = p.destinatario_nome
  AND p.destinatario_id IS NULL;
```

### 2.5 Backfill `pagamentos`

```sql
INSERT INTO pagamentos (pedido_id, tipo, valor, pago, parcial, valor_pago, pago_em, created_at)
SELECT
  id,
  COALESCE(pagamento_tipo, 'pix'),
  valor_total,
  COALESCE(pago, false),
  COALESCE(pagamento_parcial, false),
  COALESCE(valor_pago, 0),
  CASE WHEN pago THEN updated_at ELSE NULL END,
  created_at
FROM pedidos;
```

### 2.6 Backfill `notificacoes_whatsapp`

```sql
-- confirmação enviada
INSERT INTO notificacoes_whatsapp (pedido_id, tipo, destinatario_telefone, enviado, enviado_em)
SELECT id, 'confirmacao', COALESCE(cliente_telefone, ''), true, whatsapp_confirmacao_em
FROM pedidos
WHERE whatsapp_confirmacao_enviado = true;

-- saiu para entrega enviado
INSERT INTO notificacoes_whatsapp (pedido_id, tipo, destinatario_telefone, enviado, enviado_em)
SELECT id, 'saiu_entrega', COALESCE(cliente_telefone, ''), true, whatsapp_saiu_em
FROM pedidos
WHERE whatsapp_saiu_enviado = true;
```

### 2.7 Validação pós-backfill

```sql
-- pedidos com endereço mas sem endereco_id
SELECT COUNT(*) FROM pedidos WHERE logradouro IS NOT NULL AND endereco_id IS NULL;
-- esperado: 0

-- pedidos com destinatário mas sem destinatario_id
SELECT COUNT(*) FROM pedidos
WHERE destinatario_nome IS NOT NULL
  AND destinatario_nome != COALESCE(cliente_nome,'')
  AND destinatario_id IS NULL;
-- esperado: 0

-- pagamentos deve ter 1 linha por pedido
SELECT COUNT(*) FROM pagamentos;  -- deve == COUNT(*) FROM pedidos

-- totais devem bater
SELECT SUM(valor_total) FROM pedidos;
SELECT SUM(valor)       FROM pagamentos;
```

---

## Fase 3 — Atualizar código da aplicação

Arquivos principais a alterar:

| Arquivo | O que muda |
|---|---|
| `app/api/pedidos/route.ts` | POST: upsert em `enderecos`, `destinatarios`, insert em `pagamentos` |
| `app/api/pedidos/[id]/route.ts` | GET: select com JOIN nas novas tabelas; PATCH: atualizar `pagamentos` e `enderecos` |
| `app/(dashboard)/pedidos/[codigo]/page.tsx` | Ler pagamento e endereço das novas tabelas |
| `components/pedidos/BotaoWhatsApp.tsx` | Registrar envio em `notificacoes_whatsapp` em vez de flags |
| `components/pedidos/ModalEdicaoPedido.tsx` | PATCH deve atualizar `enderecos` e `pagamentos` |

### Padrão de SELECT com JOIN (Supabase)

```typescript
const { data } = await supabase
  .from('pedidos')
  .select(`
    *,
    cliente:clientes(id, nome, telefone, whatsapp),
    destinatario:destinatarios(id, nome, telefone),
    endereco:enderecos(*),
    zona_frete:zonas_frete(nome, valor),
    itens:pedido_itens(*, produto:produtos_catalogo(nome, imagem_url)),
    pagamento:pagamentos(*),
    notificacoes:notificacoes_whatsapp(*)
  `)
  .eq('id', pedidoId)
  .single()
```

### Criar pedido (novo fluxo em `POST /api/pedidos`)

```typescript
// 1. upsert cliente
const { data: cliente } = await supabase
  .from('clientes')
  .upsert({ nome, telefone }, { onConflict: 'telefone' })
  .select('id').single()

// 2. upsert endereço
let endereco_id = null
if (logradouro) {
  const { data: end } = await supabase
    .from('enderecos')
    .upsert({ cliente_id: cliente.id, cep, logradouro, numero, bairro, cidade, estado, referencia, latitude, longitude },
            { onConflict: 'cliente_id,cep,numero' })
    .select('id').single()
  endereco_id = end.id
}

// 3. upsert destinatário
let destinatario_id = null
if (destinatario_nome && destinatario_nome !== nome) {
  const { data: dest } = await supabase
    .from('destinatarios')
    .upsert({ cliente_id: cliente.id, nome: destinatario_nome, telefone: destinatario_telefone },
            { onConflict: 'cliente_id,nome' })
    .select('id').single()
  destinatario_id = dest.id
}

// 4. insert pedido
const { data: pedido } = await supabase
  .from('pedidos')
  .insert({ ...campos, cliente_id: cliente.id, endereco_id, destinatario_id })
  .select().single()

// 5. itens
await supabase.from('pedido_itens').insert(itens.map(i => ({ ...i, pedido_id: pedido.id })))

// 6. pagamento
await supabase.from('pagamentos').insert({
  pedido_id: pedido.id,
  tipo: pagamento_tipo,
  valor: valor_total,
  pago,
  parcial: pagamento_parcial,
  valor_pago: pago ? valor_pago : 0,
})
```

---

## Fase 4 — Período de validação

Por **7 dias** após o deploy da Fase 3:

- Manter colunas antigas em `pedidos` (não remover ainda)
- App lê e escreve nas tabelas novas
- Monitorar erros no Railway logs
- Conferir se `pagamentos` e `enderecos` batem com os dados exibidos na UI

```sql
-- Checar pedidos criados após o deploy sem pagamento associado
SELECT p.codigo, p.created_at
FROM pedidos p
LEFT JOIN pagamentos pg ON pg.pedido_id = p.id
WHERE pg.id IS NULL
  AND p.created_at > '<data_do_deploy>'
ORDER BY p.created_at DESC;
```

---

## Fase 5 — Cutover: remover colunas desnormalizadas de `pedidos`

Só executar após validação OK.

```sql
ALTER TABLE pedidos
  DROP COLUMN IF EXISTS cep,
  DROP COLUMN IF EXISTS logradouro,
  DROP COLUMN IF EXISTS numero,
  DROP COLUMN IF EXISTS bairro,
  DROP COLUMN IF EXISTS cidade,
  DROP COLUMN IF EXISTS estado,
  DROP COLUMN IF EXISTS referencia,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS destinatario_nome,
  DROP COLUMN IF EXISTS destinatario_telefone,
  DROP COLUMN IF EXISTS pago,
  DROP COLUMN IF EXISTS pagamento_tipo,
  DROP COLUMN IF EXISTS pagamento_parcial,
  DROP COLUMN IF EXISTS valor_pago,
  DROP COLUMN IF EXISTS whatsapp_confirmacao_enviado,
  DROP COLUMN IF EXISTS whatsapp_confirmacao_em,
  DROP COLUMN IF EXISTS whatsapp_saiu_enviado,
  DROP COLUMN IF EXISTS whatsapp_saiu_em;
```

---

## Rollback plan

| Fase | Como reverter |
|---|---|
| 1 | `DROP TABLE` nas novas (sem efeito em produção) |
| 2 | `TRUNCATE` nas novas + re-backfill |
| 3 | Git revert do deploy — colunas antigas ainda existem |
| 4 | — |
| 5 | Restaurar backup da Fase 0 (colunas removidas não voltam com git revert) |

---

## Cronograma sugerido

| Semana | Atividade |
|---|---|
| 1 | Fase 0–1: criar tabelas em produção (não-destrutivo) |
| 2 | Fase 2: backfill + validação |
| 3 | Fase 3: refactor do código em branch |
| 4 | Deploy da Fase 3 + monitoramento |
| 5 | Fase 5: cutover (drop colunas legadas) |

---

## Estado atual — 2026-05-13

| Fase | Status |
|---|---|
| 0 — Preparação | ✅ Branch `thirdedit` criada |
| 1 — Criar tabelas novas | ✅ SQL pronto em `supabase/migrations/012_normalizacao_fase1.sql` — **aguarda execução no Supabase** |
| 2 — Backfill | ✅ SQL pronto em `supabase/migrations/013_normalizacao_fase2_backfill.sql` — **aguarda execução no Supabase** |
| 3 — Código da aplicação | ✅ Completo — dual-write em `enderecos`, `destinatarios`, `pagamentos`, `notificacoes_whatsapp`, `pedido_status_log` |
| 4 — Período de validação | ⏳ Inicia após deploy das Fases 1+2+3 |
| 5 — Cutover (drop colunas) | ⏳ Após 7 dias de validação |

## Próximo passo

1. Abrir o **SQL Editor** no Supabase Dashboard
2. Executar `supabase/migrations/012_normalizacao_fase1.sql` (cria as tabelas — não-destrutivo)
3. Executar `supabase/migrations/013_normalizacao_fase2_backfill.sql` (popula as novas tabelas com dados existentes)
4. Deploy da branch `thirdedit` → Railway redeploies automaticamente
5. Monitorar por 7 dias (Fase 4) antes do cutover

Alternativamente, rodar o script Node local (exige `DB_PASSWORD`):
```bash
DB_PASSWORD=sua_senha node scripts/migrate.mjs
```
