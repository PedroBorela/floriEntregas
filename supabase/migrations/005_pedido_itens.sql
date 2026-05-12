CREATE TABLE pedido_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_catalogo_id UUID REFERENCES produtos_catalogo(id),
  nome_produto TEXT NOT NULL,
  valor_unitario NUMERIC(10,2) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (valor_unitario * quantidade) STORED,
  observacao TEXT,
  ordem INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_pedido_itens_pedido ON pedido_itens(pedido_id);

ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso_total" ON pedido_itens FOR ALL USING (true);
