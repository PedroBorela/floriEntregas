-- Campos opcionais extras na tabela de clientes
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS preferencias TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Datas especiais por cliente (aniversário, casamento, etc.)
CREATE TABLE IF NOT EXISTS cliente_datas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,   -- ex: 'Aniversário', 'Data de casamento'
  data        DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cliente_datas_cliente ON cliente_datas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_datas_data ON cliente_datas(data);

ALTER TABLE cliente_datas ENABLE ROW LEVEL SECURITY;
CREATE POLICY acesso_total ON cliente_datas FOR ALL USING (true) WITH CHECK (true);
