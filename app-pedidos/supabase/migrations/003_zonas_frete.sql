CREATE TABLE zonas_frete (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  bairros TEXT[] NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT true
);

INSERT INTO zonas_frete (nome, bairros, valor) VALUES
  ('Centro', ARRAY['Centro', 'Santa Terezinha'], 10.00),
  ('Bairros próximos', ARRAY['Coqueiro', 'Engenho da Serra', 'Petrina'], 15.00),
  ('Distritos', ARRAY['Realeza', 'São Pedro do Avaí'], 25.00);
