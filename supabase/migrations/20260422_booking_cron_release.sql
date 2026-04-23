-- ════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Cron de liberación de holds expirados
-- Fecha: 2026-04-22
--
-- Programa release_expired_holds cada 5 min vía pg_cron. Esto libera
-- los slots cuyos tripulantes iniciaron checkout pero no completaron
-- el pago en la ventana de 15 min.
--
-- pg_cron está habilitado en Supabase Free + Pro. Si el proyecto no lo
-- tiene, correr primero:
--     CREATE EXTENSION IF NOT EXISTS pg_cron;
-- (solo superuser — desde el SQL editor de Supabase anda).
-- ════════════════════════════════════════════════════════════════════

-- Habilitar pg_cron si aún no está.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotente: si el job ya existe, lo dropeamos antes de recrearlo.
DO $$
BEGIN
    PERFORM cron.unschedule('release-expired-booking-holds');
EXCEPTION WHEN OTHERS THEN
    -- Si no existe, ignorar error
    NULL;
END$$;

-- Programar cada 5 minutos.
SELECT cron.schedule(
    'release-expired-booking-holds',
    '*/5 * * * *',
    $$ SELECT public.release_expired_holds(); $$
);

-- Verificar (opcional):
--   SELECT * FROM cron.job WHERE jobname = 'release-expired-booking-holds';
--   SELECT * FROM cron.job_run_details
--     WHERE jobname = 'release-expired-booking-holds'
--     ORDER BY start_time DESC LIMIT 10;
