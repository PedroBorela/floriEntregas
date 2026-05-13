import pg from 'pg'
const { Client } = pg

// Conexão direta ao banco Supabase (session mode)
// A senha é a database password do projeto — Settings → Database no dashboard
const DB_PASSWORD = process.env.DB_PASSWORD

if (!DB_PASSWORD) {
  console.error('❌  Defina a variável DB_PASSWORD antes de rodar:')
  console.error('   DB_PASSWORD=sua_senha node scripts/migrate.mjs')
  process.exit(1)
}

const client = new Client({
  host: 'db.dxwrofwvnhzipsaxysip.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

const SQLS = [
  // 009
  `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT`,
  `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS whatsapp_confirmacao_enviado BOOLEAN DEFAULT false`,
  `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS whatsapp_confirmacao_em TIMESTAMPTZ`,
  `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS whatsapp_saiu_enviado BOOLEAN DEFAULT false`,
  `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS whatsapp_saiu_em TIMESTAMPTZ`,
  // 010
  `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS whatsapp TEXT`,
  `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS preferencias TEXT`,
  `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS observacoes TEXT`,
  `CREATE TABLE IF NOT EXISTS cliente_datas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    data DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cliente_datas_cliente ON cliente_datas(cliente_id)`,
  `ALTER TABLE cliente_datas ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cliente_datas' AND policyname='acesso_total') THEN
      CREATE POLICY acesso_total ON cliente_datas FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,
  // 011
  `ALTER TABLE pedidos ALTER COLUMN horario_entrega TYPE TEXT USING horario_entrega::TEXT`,
  // 012 — normalização fase 1: novas tabelas
  `CREATE TABLE IF NOT EXISTS enderecos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    apelido TEXT,
    cep TEXT,
    logradouro TEXT NOT NULL,
    numero TEXT,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL DEFAULT 'Manhuaçu',
    estado TEXT NOT NULL DEFAULT 'MG',
    referencia TEXT,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_enderecos_cliente ON enderecos(cliente_id)`,
  `CREATE INDEX IF NOT EXISTS idx_enderecos_bairro ON enderecos(bairro)`,
  `ALTER TABLE enderecos ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='enderecos' AND policyname='acesso_total') THEN
      CREATE POLICY acesso_total ON enderecos FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS destinatarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    relacao TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_destinatarios_cliente ON destinatarios(cliente_id)`,
  `ALTER TABLE destinatarios ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='destinatarios' AND policyname='acesso_total') THEN
      CREATE POLICY acesso_total ON destinatarios FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    pago BOOLEAN DEFAULT false,
    parcial BOOLEAN DEFAULT false,
    valor_pago NUMERIC(10,2) DEFAULT 0,
    pago_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON pagamentos(pedido_id)`,
  `CREATE INDEX IF NOT EXISTS idx_pagamentos_pago ON pagamentos(pago)`,
  `ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pagamentos' AND policyname='acesso_total') THEN
      CREATE POLICY acesso_total ON pagamentos FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS notificacoes_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    destinatario_telefone TEXT NOT NULL,
    enviado BOOLEAN DEFAULT false,
    enviado_em TIMESTAMPTZ,
    erro TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notif_pedido ON notificacoes_whatsapp(pedido_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notif_tipo ON notificacoes_whatsapp(tipo)`,
  `ALTER TABLE notificacoes_whatsapp ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notificacoes_whatsapp' AND policyname='acesso_total') THEN
      CREATE POLICY acesso_total ON notificacoes_whatsapp FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS pedido_status_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_status_log_pedido ON pedido_status_log(pedido_id)`,
  `ALTER TABLE pedido_status_log ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pedido_status_log' AND policyname='acesso_total') THEN
      CREATE POLICY acesso_total ON pedido_status_log FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,
  `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_id UUID REFERENCES enderecos(id) ON DELETE SET NULL`,
  `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS destinatario_id UUID REFERENCES destinatarios(id) ON DELETE SET NULL`,
  `CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`,
]

await client.connect()
console.log('✔  Conectado ao banco\n')

let ok = 0, fail = 0

for (const sql of SQLS) {
  const preview = sql.trim().slice(0, 70).replace(/\s+/g, ' ')
  try {
    await client.query(sql)
    console.log(`✓  ${preview}`)
    ok++
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('does not exist')) {
      console.log(`~  ${preview} (já aplicado)`)
      ok++
    } else {
      console.error(`✗  ${preview}`)
      console.error(`   ${e.message}`)
      fail++
    }
  }
}

await client.end()
console.log(`\n${ok} ok — ${fail} falha(s)`)
