CREATE TABLE vendedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pedidos ADD COLUMN vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL;

ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso_total_vendedores" ON vendedores FOR ALL USING (true);
