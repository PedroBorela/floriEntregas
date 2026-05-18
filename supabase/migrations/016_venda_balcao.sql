-- Adiciona suporte a venda de balcão (tipo) e status vendido

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_tipo_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_tipo_check
  CHECK (tipo IN ('entrega', 'retirada', 'balcao'));

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check
  CHECK (status IN ('pendente', 'em_preparo', 'pronto', 'saiu_entrega', 'entregue', 'retirado', 'cancelado', 'vendido'));
