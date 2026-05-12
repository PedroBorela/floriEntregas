ALTER TABLE produtos_catalogo
  ADD COLUMN IF NOT EXISTS tamanho      TEXT,
  ADD COLUMN IF NOT EXISTS categoria    TEXT,
  ADD COLUMN IF NOT EXISTS dica_cuidado TEXT,
  ADD COLUMN IF NOT EXISTS imagem_url   TEXT;

CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos_catalogo(categoria);
