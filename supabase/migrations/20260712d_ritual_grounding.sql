-- Red Solar Viva · SENDERO DE LUZ — nuevo ritual base "Grounding"
-- =====================================================================
-- 20260712d_ritual_grounding.sql
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Suma un ritual base GRATIS "Grounding" al catálogo del Sendero de Luz.
-- Aparece para todos (como Sol/Ejercicio/Meditación), rinde 10 Fotones al
-- cumplirlo, no pide texto. El cliente (RitualDiario.tsx v2.24) ya trae el
-- glifo y el fallback en DEFAULT_CATALOG; esta fila es la fuente de verdad
-- (get_ritual_diario lee de daily_ritual_catalog). Idempotente.

-- Defensa: garantiza la columna de traducción (existe desde el i18n fase 3).
ALTER TABLE public.daily_ritual_catalog
    ADD COLUMN IF NOT EXISTS label_en text;

INSERT INTO public.daily_ritual_catalog
    (activity_key, label, label_en, points, requires_text, active, sort_order)
VALUES
    ('grounding', 'Grounding', 'Grounding', 10, false, true, 6)
ON CONFLICT (activity_key) DO UPDATE SET
    label         = EXCLUDED.label,
    label_en      = EXCLUDED.label_en,
    points        = EXCLUDED.points,
    requires_text = EXCLUDED.requires_text,
    active        = true,
    sort_order    = EXCLUDED.sort_order;
