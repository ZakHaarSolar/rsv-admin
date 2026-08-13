-- 20260704_i18n_content_en_columns.sql
-- FASE 3 i18n — columnas gemelas _en para el CONTENIDO user-facing editable del Motor.
--
-- PRINCIPIO: cada campo de texto que ve el Tripulante gana una columna espejo _en.
-- NULL o vacío en la columna _en  ==>  la lectura respalda al español (la columna base).
-- Así la app NUNCA muestra un hueco: en inglés se ve la traducción si existe, y el
-- español si todavía no. Poblar las _en (traducción) es un paso aparte (round-trip).
--
-- Idempotente: ADD COLUMN IF NOT EXISTS. Pegar en Supabase Dashboard → SQL Editor → Run.
--
-- NOTA sobre nombres de tabla: sondas_config y libreria_protocolos se crearon en el
-- Dashboard (no viven en migraciones del repo). Los nombres se toman de las RPCs vivas
-- get_sondas_by_pilar / get_libreria_protocolos. Si alguna diera "relation does not
-- exist", confirmar el nombre real y reejecutar solo ese bloque.

BEGIN;

-- 1) CALIBRACIONES ─ libreria_protocolos
ALTER TABLE public.libreria_protocolos
    ADD COLUMN IF NOT EXISTS titulo_en            text,
    ADD COLUMN IF NOT EXISTS descripcion_corta_en text,
    ADD COLUMN IF NOT EXISTS alerta_text_en       text,
    ADD COLUMN IF NOT EXISTS sugerencia_text_en   text,
    -- tareas_json_en espeja tareas_json: mismo array de tareas, cada texto traducido,
    -- los `id` de cada tarea SE PRESERVAN idénticos (llaves de estado del Tripulante).
    ADD COLUMN IF NOT EXISTS tareas_json_en       jsonb;

-- 2) SONDAS DEL RADAR ─ sondas_config
ALTER TABLE public.sondas_config
    ADD COLUMN IF NOT EXISTS question_text_en text,
    -- options_json_en: mismo array de opciones; se traduce `label`, se PRESERVA `value`
    -- (el peso numérico de la respuesta es llave de puntaje, nunca cambia).
    ADD COLUMN IF NOT EXISTS options_json_en  jsonb;

-- 3) AFIRMACIONES ─ ritual_afirmaciones + ritual_afirmacion_categorias
ALTER TABLE public.ritual_afirmaciones
    ADD COLUMN IF NOT EXISTS texto_en text;

ALTER TABLE public.ritual_afirmacion_categorias
    ADD COLUMN IF NOT EXISTS nombre_en text;

-- 4) RITUALES DIARIOS ─ daily_ritual_catalog (activity_key es llave, NO se traduce)
ALTER TABLE public.daily_ritual_catalog
    ADD COLUMN IF NOT EXISTS label_en text;

-- 5) WALLPAPERS ─ wallpapers + wallpaper_categories
ALTER TABLE public.wallpapers
    ADD COLUMN IF NOT EXISTS title_en text;

ALTER TABLE public.wallpaper_categories
    ADD COLUMN IF NOT EXISTS name_en text;

-- 6) MEDALLAS / CONSTELACIONES DE MAESTRÍA ─ medal_constelaciones + medal_tiers
--    (glyph_key / metric / accent son llaves de sistema, NO se traducen)
ALTER TABLE public.medal_constelaciones
    ADD COLUMN IF NOT EXISTS label_en    text,
    ADD COLUMN IF NOT EXISTS subtitle_en text;

ALTER TABLE public.medal_tiers
    ADD COLUMN IF NOT EXISTS label_en text;

COMMIT;

-- Patrón de lectura por idioma (referencia — se implementa en las RPCs get_*):
--   texto:  COALESCE(NULLIF(titulo_en, ''), titulo)              -- '' cuenta como vacío
--   jsonb:  COALESCE(tareas_json_en, tareas_json)                -- NULL = sin traducir
-- Con p_lang = 'es' se devuelve siempre la columna base (español) sin tocar las _en.
