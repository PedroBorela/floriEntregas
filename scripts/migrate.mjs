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
