-- Muda horario_entrega de TIME para TEXT para suportar janelas como "Manhã (8h–12h)"
ALTER TABLE pedidos ALTER COLUMN horario_entrega TYPE TEXT;
