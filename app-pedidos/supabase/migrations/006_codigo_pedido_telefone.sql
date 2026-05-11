CREATE OR REPLACE FUNCTION gerar_codigo_pedido()
RETURNS TRIGGER AS $$
DECLARE
  v_suffix TEXT;
  v_codigo TEXT;
  v_phone_digits TEXT;
  v_attempt INT := 0;
BEGIN
  v_phone_digits := regexp_replace(COALESCE(NEW.cliente_telefone, ''), '[^0-9]', '', 'g');

  IF length(v_phone_digits) >= 4 THEN
    v_suffix := right(v_phone_digits, 4);
  ELSE
    v_suffix := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  END IF;

  LOOP
    IF v_attempt = 0 THEN
      v_codigo := 'NEF-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || v_suffix;
    ELSE
      -- Append letter A, B, C... on collision (same phone, same day)
      v_codigo := 'NEF-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || v_suffix || chr(64 + v_attempt);
    END IF;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM pedidos WHERE codigo = v_codigo);
    v_attempt := v_attempt + 1;

    IF v_attempt > 26 THEN
      v_suffix := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
      v_attempt := 0;
    END IF;
  END LOOP;

  NEW.codigo := v_codigo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
