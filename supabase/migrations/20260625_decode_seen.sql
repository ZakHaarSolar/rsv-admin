-- Red Solar Viva · Decodificadores — gate del push "ya está listo" por "visto"
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Problema (Zak, 2026-06-25): el push "tu decodificación está lista" llegaba
-- AUNQUE el Tripulante ya hubiera visto el dictamen en vivo (a veces minutos
-- después). Causa: la edge dispara el push al completar el job, sin saber si el
-- cliente ya lo reveló.
--
-- Fix: una marca `seen_at`. El cliente la setea (mark_decode_seen, vía gateway
-- user-action) al revelar el dictamen en primer plano. La edge espera unos
-- segundos tras completar y SOLO dispara el push si `seen_at` sigue NULL (el
-- Tripulante NO lo vio en vivo → salió de la app → tiene sentido notificar).
--
--   • mark_decode_seen → gateway user-action (clerk id inyectado del token).
--   • Sirve para AMBOS decodificadores: p_kind = 'dream' (dream_records) o
--     'matter' (matter_jobs). Ambas tablas son gateway-only (RLS + REVOKE anon);
--     las RPC SECURITY DEFINER (owner) bypassan RLS.

-- ── 1) Columna "visto" en cada tabla de jobs/registros ─────────────────
ALTER TABLE dream_records ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;
ALTER TABLE matter_jobs   ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

-- ── 2) mark_decode_seen — el cliente marca "lo vi en vivo" (un solo set; el
--     COALESCE conserva el primer timestamp). target_clerk_id lo inyecta el
--     gateway desde el token → solo marca filas propias.
CREATE OR REPLACE FUNCTION mark_decode_seen(
    target_clerk_id TEXT,
    p_record_id UUID,
    p_kind TEXT DEFAULT 'matter'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    hit INT := 0;
BEGIN
    IF target_clerk_id IS NULL OR LENGTH(target_clerk_id) < 3
       OR p_record_id IS NULL THEN
        RETURN json_build_object('ok', false, 'reason', 'bad_args');
    END IF;
    IF p_kind = 'dream' THEN
        UPDATE dream_records
           SET seen_at = COALESCE(seen_at, now())
         WHERE id = p_record_id AND clerk_user_id = target_clerk_id;
    ELSE
        UPDATE matter_jobs
           SET seen_at = COALESCE(seen_at, now())
         WHERE id = p_record_id AND clerk_user_id = target_clerk_id;
    END IF;
    GET DIAGNOSTICS hit = ROW_COUNT;
    RETURN json_build_object('ok', hit > 0);
END;
$$;
REVOKE EXECUTE ON FUNCTION mark_decode_seen(TEXT, UUID, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION mark_decode_seen(TEXT, UUID, TEXT) TO service_role;

-- Recargar el esquema de PostgREST tras los cambios de firma/permisos.
NOTIFY pgrst, 'reload schema';

-- Verificar (opcional):
--   SELECT public.mark_decode_seen('<clerk_id>', '<record_uuid>', 'matter');
--   SELECT id, seen_at FROM matter_jobs   ORDER BY created_at DESC LIMIT 5;
--   SELECT id, seen_at FROM dream_records ORDER BY created_at DESC LIMIT 5;
