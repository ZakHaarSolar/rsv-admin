-- Red Solar Viva · AUDITORÍA 2026-07-24 · PARTE 2 · CIFRADO EN REPOSO (2/2)
-- BITÁCORA · RACHAS · SUEÑOS — los helpers compartidos
-- =============================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- ⚠️ ESTE ARCHIVO NO CIFRA NINGUNA FILA TODAVÍA. Crea la llave en Vault y los
-- tres helpers, nada más. Es seguro pegarlo hoy y no cambia el comportamiento
-- de la app en absoluto.
--
-- ── POR QUÉ NO VIENE EL CIFRADO COMPLETO AQUÍ ────────────────────────────────
-- Cifrar estas tablas obliga a re-crear las RPC que las leen y escriben, y esas
-- RPC VIVEN EN EL DASHBOARD: pueden haber divergido de lo que dice el repo. Si
-- las reescribo desde los archivos y alguna cambió, se pierde esa edición.
-- Es la regla del round-trip que ya está documentada en CLAUDE.md, y por eso
-- este archivo llega hasta donde llega sin riesgo.
--
-- Para completarlo, Zak exporta el cuerpo VIGENTE de las RPC de estas tres
-- superficies y yo las devuelvo re-escritas con el cifrado envuelto:
--
--   SELECT p.proname,
--          pg_get_functiondef(p.oid) AS cuerpo
--   FROM pg_proc p
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public'
--     AND (p.proname LIKE '%bitacora%'
--       OR p.proname LIKE '%racha%'
--       OR p.proname LIKE '%dream_record%')
--   ORDER BY p.proname;
--
-- ── QUÉ SE VA A CIFRAR (decisión de Zak: lo más íntimo primero) ──────────────
--   · bitacora_notas.title / .body   — el diario personal (hasta 20.000 chars)
--   · rachas.title                   — los títulos son confesionales por diseño
--   · dream_records                  — el texto del sueño + su dictamen
-- El Espejo (la cuarta) ya va en su propio archivo: 20260724i_cifrado_espejo.sql.
--
-- Queda EN CLARO a propósito, por ser instrumental y no confesional:
-- Plan de Vuelo, Decodificador de Alimentos y Agradecimientos.
--
-- ── NO ROMPE NINGUNA BÚSQUEDA (verificado) ──────────────────────────────────
-- Los dos buscadores que existen filtran EN EL CLIENTE, sobre el texto que la
-- RPC ya devolvió descifrado:
--   · Bitácora  → EV_Bitacora.tsx:2818-2835 (notas.filter sobre title/body)
--   · Alimentos → EV_Decoder.tsx:2697-2705
-- No hay ningún ILIKE ni to_tsvector contra estas columnas en el servidor, así
-- que cifrarlas no deja ciego a ningún buscador.
--
-- Precedente que replica: 20260620q_dm_encrypt_at_rest.sql (mensajes privados)
-- y 20260712b_realidad_elegida.sql (la visión). Llave propia, separada de ambas.
-- Helpers defensivos: si el Vault no responde devuelven el texto tal cual, así
-- el cifrado nunca puede dejar a nadie sin acceso a su propio contenido.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'priv_content_key') THEN
        PERFORM vault.create_secret(
            encode(gen_random_bytes(32), 'hex'),
            'priv_content_key',
            'Llave de cifrado en reposo del contenido intimo (bitacora, rachas, suenos, plan de vuelo, alimentos, agradecimientos)'
        );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public._priv_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE k text;
BEGIN
    SELECT decrypted_secret INTO k
    FROM vault.decrypted_secrets WHERE name = 'priv_content_key' LIMIT 1;
    RETURN k;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public._priv_encrypt(
    p_text text,
    OUT o_text text,
    OUT o_enc  boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE k text;
BEGIN
    o_text := p_text;
    o_enc  := false;
    IF p_text IS NULL OR p_text = '' THEN RETURN; END IF;
    k := public._priv_key();
    IF k IS NULL THEN RETURN; END IF;
    BEGIN
        o_text := armor(pgp_sym_encrypt(p_text, k));
        o_enc  := true;
    EXCEPTION WHEN OTHERS THEN
        o_text := p_text;
        o_enc  := false;
    END;
END $$;

CREATE OR REPLACE FUNCTION public._priv_decrypt(p_text text, p_enc boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE k text;
BEGIN
    IF p_text IS NULL OR NOT COALESCE(p_enc, false) THEN RETURN p_text; END IF;
    k := public._priv_key();
    IF k IS NULL THEN RETURN p_text; END IF;
    RETURN pgp_sym_decrypt(dearmor(p_text), k);
EXCEPTION WHEN OTHERS THEN
    RETURN p_text;
END $$;

REVOKE ALL ON FUNCTION public._priv_key()                  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._priv_encrypt(text)          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._priv_decrypt(text, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public._priv_key()                  TO service_role;
GRANT EXECUTE ON FUNCTION public._priv_encrypt(text)          TO service_role;
GRANT EXECUTE ON FUNCTION public._priv_decrypt(text, boolean) TO service_role;

NOTIFY pgrst, 'reload schema';