CREATE TABLE pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrega', 'retirada')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'em_preparo', 'saiu_entrega', 'entregue', 'retirado', 'cancelado'
  )),

  cliente_id UUID REFERENCES clientes(id),
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,

  destinatario_nome TEXT,
  destinatario_telefone TEXT,

  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT DEFAULT 'Manhuaçu',
  estado TEXT DEFAULT 'MG',
  referencia TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),

  data_entrega DATE,
  horario_entrega TIME,
  zona_frete_id UUID REFERENCES zonas_frete(id),
  valor_frete NUMERIC(10,2) DEFAULT 0,

  tem_cartao BOOLEAN DEFAULT false,
  mensagem_cartao TEXT,

  pago BOOLEAN DEFAULT false,
  pagamento_tipo TEXT CHECK (pagamento_tipo IN ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito')),
  pagamento_parcial BOOLEAN DEFAULT false,
  valor_pago NUMERIC(10,2) DEFAULT 0,

  valor_produtos NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,

  impresso BOOLEAN DEFAULT false,
  impresso_em TIMESTAMPTZ,
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION gerar_codigo_pedido()
RETURNS TRIGGER AS $$
DECLARE
  seq INT;
  data_str TEXT;
BEGIN
  data_str := TO_CHAR(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(codigo, '-', 3) AS INT)
  ), 0) + 1 INTO seq
  FROM pedidos
  WHERE codigo LIKE 'NEF-' || data_str || '-%';

  NEW.codigo := 'NEF-' || data_str || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_codigo_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL OR NEW.codigo = '')
  EXECUTE FUNCTION gerar_codigo_pedido();

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_pedidos_codigo ON pedidos(codigo);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_data ON pedidos(data_entrega);
CREATE INDEX idx_pedidos_created ON pedidos(created_at DESC);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_frete ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_total" ON pedidos FOR ALL USING (true);
CREATE POLICY "acesso_total" ON clientes FOR ALL USING (true);
CREATE POLICY "acesso_total" ON produtos_catalogo FOR ALL USING (true);
CREATE POLICY "acesso_total" ON zonas_frete FOR ALL USING (true);
