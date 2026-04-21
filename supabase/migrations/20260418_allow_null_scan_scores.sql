-- Red Solar Viva — scan_vibracional: permitir NULL en pilares no escaneados
-- ────────────────────────────────────────────────────────────────────────
-- Hasta ahora las 6 columnas de pilares tenían NOT NULL, lo cual asumía
-- que cada fila representaba un ciclo COMPLETO de 6/6. Con v12.21 del
-- frontend guardamos incrementalmente después de cada pilar (para que
-- tripulantes nuevos no pierdan progreso si refrescan antes de completar
-- el ciclo). Eso manda NULLs a los pilares no escaneados aún.
--
-- El insert falla con PostgreSQL code 23502:
--   "null value in column \"hardware_fisico\" of relation
--   \"scan_vibracional\" violates not-null constraint"
--
-- Fix: relajar NOT NULL en las 6 columnas de scores + indice_silicio.
-- El cycle_scanned_json sigue siendo la fuente de verdad sobre qué
-- pilares fueron realmente escaneados en este ciclo.
-- ────────────────────────────────────────────────────────────────────────

ALTER TABLE public.scan_vibracional
  ALTER COLUMN hardware_fisico DROP NOT NULL,
  ALTER COLUMN procesador_mental DROP NOT NULL,
  ALTER COLUMN motor_emocional DROP NOT NULL,
  ALTER COLUMN gravedad_financiera DROP NOT NULL,
  ALTER COLUMN vector_expansion DROP NOT NULL,
  ALTER COLUMN orbita_relacional DROP NOT NULL,
  ALTER COLUMN indice_silicio DROP NOT NULL;

-- Sanity check
DO $$
DECLARE
  v_remaining int;
BEGIN
  SELECT count(*) INTO v_remaining
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'scan_vibracional'
    AND column_name IN (
      'hardware_fisico', 'procesador_mental', 'motor_emocional',
      'gravedad_financiera', 'vector_expansion', 'orbita_relacional',
      'indice_silicio'
    )
    AND is_nullable = 'NO';

  IF v_remaining > 0 THEN
    RAISE WARNING 'Quedan % columnas de pilares con NOT NULL. Revisá.', v_remaining;
  ELSE
    RAISE NOTICE '✅ Las 7 columnas permiten NULL. Insertas parciales ahora funcionan.';
  END IF;
END $$;
