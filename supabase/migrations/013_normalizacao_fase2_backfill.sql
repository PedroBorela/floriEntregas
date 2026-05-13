-- Fase 2: backfill — extrair dados existentes de pedidos para as novas tabelas
-- Não-destrutivo. As colunas originais de pedidos NÃO são removidas aqui.

-- 2.1 enderecos
INSERT INTO enderecos (
  cliente_id, cep, logradouro, numero, bairro,
  cidade, estado, referencia, latitude, longitude, created_at
)
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
WHERE logradouro IS NOT NULL
  AND cliente_id IS NOT NULL
ORDER BY cliente_id, COALESCE(cep,''), COALESCE(numero,''), created_at DESC;

-- 2.2 vincular pedidos.endereco_id
UPDATE pedidos p
SET endereco_id = e.id
FROM enderecos e
WHERE e.cliente_id = p.cliente_id
  AND COALESCE(e.cep, '')    = COALESCE(p.cep, '')
  AND COALESCE(e.numero, '') = COALESCE(p.numero, '')
  AND p.endereco_id IS NULL
  AND p.logradouro IS NOT NULL;

-- 2.3 destinatarios
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

-- 2.4 vincular pedidos.destinatario_id
UPDATE pedidos p
SET destinatario_id = d.id
FROM destinatarios d
WHERE d.cliente_id = p.cliente_id
  AND d.nome = p.destinatario_nome
  AND p.destinatario_id IS NULL;

-- 2.5 pagamentos
INSERT INTO pagamentos (pedido_id, tipo, valor, pago, parcial, valor_pago, pago_em, created_at)
SELECT
  id,
  COALESCE(pagamento_tipo, 'pix'),
  valor_total,
  COALESCE(pago, false),
  COALESCE(pagamento_parcial, false),
  COALESCE(valor_pago, 0),
  CASE WHEN COALESCE(pago, false) THEN updated_at ELSE NULL END,
  created_at
FROM pedidos;

-- 2.6 notificacoes_whatsapp — confirmação
INSERT INTO notificacoes_whatsapp (pedido_id, tipo, destinatario_telefone, enviado, enviado_em)
SELECT
  id,
  'confirmacao',
  COALESCE(cliente_telefone, ''),
  true,
  whatsapp_confirmacao_em
FROM pedidos
WHERE whatsapp_confirmacao_enviado = true;

-- 2.6b notificacoes_whatsapp — saiu para entrega
INSERT INTO notificacoes_whatsapp (pedido_id, tipo, destinatario_telefone, enviado, enviado_em)
SELECT
  id,
  'saiu_entrega',
  COALESCE(cliente_telefone, ''),
  true,
  whatsapp_saiu_em
FROM pedidos
WHERE whatsapp_saiu_enviado = true;

-- 2.7 validação
SELECT
  'pedidos com endereço sem endereco_id' AS check,
  COUNT(*) AS resultado
FROM pedidos
WHERE logradouro IS NOT NULL AND endereco_id IS NULL

UNION ALL

SELECT
  'pedidos com destinatário sem destinatario_id',
  COUNT(*)
FROM pedidos
WHERE destinatario_nome IS NOT NULL
  AND destinatario_nome != COALESCE(cliente_nome, '')
  AND destinatario_id IS NULL

UNION ALL

SELECT 'total pedidos', COUNT(*) FROM pedidos

UNION ALL

SELECT 'total pagamentos', COUNT(*) FROM pagamentos;
-- pagamentos deve == total pedidos
