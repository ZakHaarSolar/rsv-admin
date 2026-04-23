-- ════════════════════════════════════════════════════════════════════
-- Red Solar Viva — Backfill: copiar reservas confirmadas grupales
-- que no estén mirroreadas a exploration_passes
-- Fecha: 2026-04-22
--
-- Contexto: el Stripe webhook v1 hacía upsert a exploration_passes con
-- onConflict: "email,event_date" — constraint que no existe → falla
-- silencioso → los pagos grupales no se mirroreaban → Telemetría no los
-- contaba. Webhook v2 usa INSERT plano (ya fixeado).
--
-- Este script toma CUALQUIER reserva confirmada grupal cuyo email+fecha
-- todavía no tenga row en exploration_passes y la inserta. Idempotente.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

INSERT INTO public.exploration_passes
    (email, name, event_date, event_start_time, group_name, calendly_event_uri)
SELECT
    r.email,
    r.name,
    (a.start_time AT TIME ZONE 'America/Cancun')::date AS event_date,
    a.start_time AS event_start_time,
    CASE a.slot_type
        WHEN 'grupal_pulsar' THEN 'pulsar'
        WHEN 'grupal_cuasar' THEN 'cuasar'
    END AS group_name,
    NULL AS calendly_event_uri
FROM public.reservas r
JOIN public.asientos_reservados a ON a.id = r.asiento_id
WHERE r.status = 'confirmada'
  AND a.slot_type IN ('grupal_pulsar', 'grupal_cuasar')
  AND NOT EXISTS (
      SELECT 1 FROM public.exploration_passes e
      WHERE e.email = r.email
        AND e.event_date = (a.start_time AT TIME ZONE 'America/Cancun')::date
  );

-- Devolvé cuántos filas se insertaron (correr con `;` al final y ver el notice)
-- o ejecutar por separado:
--    SELECT count(*) FROM exploration_passes;

COMMIT;
