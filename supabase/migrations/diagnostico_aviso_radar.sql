-- ═══════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO · ¿por qué no llegó el aviso de "tu Radar está listo"?
-- (Zak, 2026-08-04: "mi ciclo terminó y no vi ninguna notificación").
--
-- NO cambia nada. Solo mira. Pégalo en Supabase Dashboard → SQL Editor →
-- New Query → Run, con TU correo en la primera línea.
--
-- El aviso lo manda un barrido diario (pg_cron, 16:00 UTC ≈ 11:00 en Cancún)
-- que exige CUATRO cosas a la vez:
--   1. Tener un ciclo COMPLETO (los 6 pilares en el mismo escaneo).
--   2. Que ese ciclo tenga entre 7 y 90 días.
--   3. Tener un token de notificaciones registrado para ESA cuenta.
--   4. No haber avisado ya de ese mismo ciclo.
-- La consulta responde las cuatro por separado, así se ve cuál falló.
-- ═══════════════════════════════════════════════════════════════════════

WITH yo AS (
    SELECT clerk_user_id
    FROM profiles
    WHERE lower(email) = lower('PON_AQUI_TU_CORREO@ejemplo.com')
    LIMIT 1
),
ultimo_ciclo AS (
    SELECT MAX(sv.created_at) AS cycle_ts
    FROM scan_vibracional sv, yo
    WHERE sv.clerk_user_id = yo.clerk_user_id
      AND sv.cycle_scanned_json LIKE '%"fisico"%'
      AND sv.cycle_scanned_json LIKE '%"mental"%'
      AND sv.cycle_scanned_json LIKE '%"emocional"%'
      AND sv.cycle_scanned_json LIKE '%"financiero"%'
      AND sv.cycle_scanned_json LIKE '%"vector"%'
      AND sv.cycle_scanned_json LIKE '%"orbita"%'
)
SELECT
    (SELECT clerk_user_id FROM yo)                        AS mi_cuenta,
    (SELECT cycle_ts FROM ultimo_ciclo)                   AS ultimo_ciclo_completo,
    round(EXTRACT(EPOCH FROM (now() - (SELECT cycle_ts FROM ultimo_ciclo))) / 86400)::int
                                                          AS dias_desde_ese_ciclo,
    (SELECT count(*) FROM push_tokens pt, yo
      WHERE pt.clerk_user_id = yo.clerk_user_id)          AS tokens_de_aviso,
    (SELECT string_agg(pt.platform || ' · ' || to_char(pt.updated_at,'DD Mon YYYY'), ' | ')
       FROM push_tokens pt, yo
      WHERE pt.clerk_user_id = yo.clerk_user_id)          AS detalle_tokens,
    (SELECT count(*) FROM radar_ready_notified rn, yo
      WHERE rn.clerk_user_id = yo.clerk_user_id
        AND rn.cycle_ts = (SELECT cycle_ts FROM ultimo_ciclo))
                                                          AS ya_avisado_de_ese_ciclo,
    (SELECT np.prefs->>'scan_weekly' FROM notif_prefs np, yo
      WHERE np.clerk_user_id = yo.clerk_user_id)          AS preferencia_aviso_semanal,
    (SELECT count(*) FROM cron.job WHERE jobname = 'radar-ready-notify')
                                                          AS barrido_agendado;

-- ── Cómo leer el resultado ──────────────────────────────────────────────
--   tokens_de_aviso = 0        → el teléfono nunca registró su token con
--                                ESTA cuenta: sin eso el aviso no tiene a
--                                dónde llegar. Suele ser permiso de
--                                notificaciones denegado, o que el escaneo
--                                se hizo con otra cuenta.
--   dias_desde_ese_ciclo < 7   → todavía no toca; el aviso sale al día 7.
--   dias_desde_ese_ciclo > 90  → fuera de ventana, ya no avisa.
--   ya_avisado_de_ese_ciclo=1  → sí se mandó; entonces el problema está del
--                                lado del teléfono (permiso, silenciado o
--                                la notificación se descartó).
--   preferencia_aviso_semanal = 'false' → está apagado en Ajustes →
--                                Notificaciones.
--   barrido_agendado = 0       → el barrido diario no está agendado.
--
-- 🜂 SOSPECHA PRINCIPAL, YA CORREGIDA EN LA APP (2026-08-04, PushSync v1.4):
--   el registro del token del teléfono se sellaba ANTES de saber si había
--   ocurrido, y sin mirar la respuesta. Si el pase de sesión de Clerk aún no
--   existía (el token del teléfono llega en el primer segundo y gana esa
--   carrera seguido), el aparato quedaba SIN registrar para esa cuenta y nadie
--   lo reintentaba en toda la sesión. Desde el próximo build el registro se
--   sella solo con el sí del servidor y reintenta con esperas crecientes.
--   Si abajo sale tokens_de_aviso = 0, ESA era la causa.
--
-- Correr el barrido AHORA a mano (manda los que estén pendientes de verdad):
--   SELECT public.notify_radar_ready();
-- ═══════════════════════════════════════════════════════════════════════

-- ── ¿El barrido corre de verdad? Últimos avisos a CUALQUIERA ────────────
-- (Si esta tabla está vacía y el cron aparece agendado, el barrido corre
--  pero nunca encuentra a nadie que cumpla las cuatro condiciones.)
SELECT
    rn.clerk_user_id,
    p.email,
    rn.cycle_ts,
    rn.notified_at
FROM radar_ready_notified rn
LEFT JOIN profiles p ON p.clerk_user_id = rn.clerk_user_id
ORDER BY rn.notified_at DESC
LIMIT 20;

-- ── ¿Cuántos nodos tienen token registrado, en total? ───────────────────
SELECT platform, count(*) AS tokens, max(updated_at) AS ultimo_registro
FROM push_tokens
GROUP BY platform;
