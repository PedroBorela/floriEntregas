-- Motivo de cancelamento para auditoria
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

-- Rastreamento de envio de WhatsApp
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS whatsapp_confirmacao_enviado BOOLEAN DEFAULT false;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS whatsapp_confirmacao_em TIMESTAMPTZ;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS whatsapp_saiu_enviado BOOLEAN DEFAULT false;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS whatsapp_saiu_em TIMESTAMPTZ;
