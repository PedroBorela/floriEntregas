-- Fase 1: criar tabelas de normalização (não-destrutivo)
-- Nenhuma tabela existente é alterada além de adicionar colunas FK em pedidos.

-- 1.1 enderecos
CREATE TABLE IF NOT EXISTS enderecos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE SET NULL,
  apelido     TEXT,
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='enderecos' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON enderecos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 1.2 destinatarios
CREATE TABLE IF NOT EXISTS destinatarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  telefone    TEXT,
  relacao     TEXT,
  observacoes TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_destinatarios_cliente ON destinatarios(cliente_id);

ALTER TABLE destinatarios ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='destinatarios' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON destinatarios FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 1.3 pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id  UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  valor      NUMERIC(10,2) NOT NULL,
  pago       BOOLEAN DEFAULT false,
  parcial    BOOLEAN DEFAULT false,
  valor_pago NUMERIC(10,2) DEFAULT 0,
  pago_em    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON pagamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pago   ON pagamentos(pago);

ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pagamentos' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON pagamentos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 1.4 notificacoes_whatsapp
CREATE TABLE IF NOT EXISTS notificacoes_whatsapp (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id             UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo                  TEXT NOT NULL,
  destinatario_telefone TEXT NOT NULL,
  enviado               BOOLEAN DEFAULT false,
  enviado_em            TIMESTAMPTZ,
  erro                  TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_pedido ON notificacoes_whatsapp(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notif_tipo   ON notificacoes_whatsapp(tipo);

ALTER TABLE notificacoes_whatsapp ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notificacoes_whatsapp' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON notificacoes_whatsapp FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 1.5 pedido_status_log
CREATE TABLE IF NOT EXISTS pedido_status_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo     TEXT NOT NULL,
  observacao      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_log_pedido ON pedido_status_log(pedido_id);

ALTER TABLE pedido_status_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pedido_status_log' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON pedido_status_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 1.6 FKs em pedidos para as novas tabelas
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS endereco_id     UUID REFERENCES enderecos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destinatario_id UUID REFERENCES destinatarios(id) ON DELETE SET NULL;

-- 1.7 trigger updated_at para enderecos
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
