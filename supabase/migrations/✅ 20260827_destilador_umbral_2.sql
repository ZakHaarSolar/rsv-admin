-- Red Solar Viva · Espejo Vibracional — el destilador alcanza las charlas cortas
-- =============================================================================
-- 🜂 POR QUÉ (Zak 2026-08-27, mirando al nodo bae9b6). El barrido de memoria
-- exigía >=4 mensajes nuevos para destilar una charla, y un mensaje del
-- Tripulante es una fila mientras la respuesta del Espejo es otra: 4 mensajes
-- son DOS intercambios. Quien pregunta una vez y cierra (1 pregunta + 1
-- respuesta = 2 filas) nunca llegaba al umbral y JAMÁS construía memoria, por
-- más veces que volviera. Ese es justo el perfil que más la necesita: no
-- acumula historial dentro de una charla porque abre una nueva cada vez.
--
-- El camino `regen` (reescribir desde cero) YA usaba >=2 desde el principio,
-- así que el valor no es nuevo en el sistema: se le concede al barrido normal
-- lo que la reescritura ya hacía. Es el ÚNICO cambio respecto de
-- 20260729c_espejo_memoria.sql; el resto del cuerpo se copia tal cual.
--
-- Aplicar en: Supabase Dashboard → SQL Editor → New Query → Run.

CREATE OR REPLACE FUNCTION public.espejo_memoria_scan_targets(p_max integer DEFAULT 25)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_out jsonb := '[]'::jsonb;
BEGIN
    WITH pend AS (
        -- Charlas quietas ≥8h con ≥2 mensajes posteriores a su marca (v2).
        SELECT c.clerk_user_id, c.id AS conv_id, x.last_msg
          FROM oraculo_conversations c
          CROSS JOIN LATERAL (
              SELECT count(*)::int AS n_new, max(m.created_at) AS last_msg
                FROM oraculo_messages m
               WHERE m.conversation_id = c.id
                 AND m.created_at > COALESCE(c.memoria_distilled_at, '-infinity'::timestamptz)
          ) x
         WHERE c.last_at < now() - interval '8 hours'
           AND x.n_new >= 2
    ), regen AS (
        -- "Reescribir desde cero": entran también las charlas cortas (≥2).
        SELECT c.clerk_user_id, c.id AS conv_id, x.last_msg
          FROM espejo_memoria em
          JOIN oraculo_conversations c ON c.clerk_user_id = em.clerk_user_id
          CROSS JOIN LATERAL (
              SELECT count(*)::int AS n_new, max(m.created_at) AS last_msg
                FROM oraculo_messages m
               WHERE m.conversation_id = c.id
          ) x
         WHERE em.regen_requested
           AND c.last_at < now() - interval '8 hours'
           AND x.n_new >= 2
    ), unida AS (
        SELECT * FROM pend
        UNION
        SELECT * FROM regen
    ), con_prefs AS (
        -- Se salta a quien apagó la memoria O el contexto maestro (sin fila =
        -- defaults: ambos encendidos).
        SELECT u.*
          FROM unida u
          LEFT JOIN espejo_context_prefs p ON p.clerk_user_id = u.clerk_user_id
         WHERE COALESCE(p.master_enabled, true)
           AND COALESCE(p.memoria_enabled, true)
    ), usuarios AS (
        SELECT clerk_user_id, min(last_msg) AS oldest
          FROM con_prefs
         GROUP BY clerk_user_id
         ORDER BY oldest ASC
         LIMIT GREATEST(1, LEAST(COALESCE(p_max, 25), 100))
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
               'uid',   us.clerk_user_id,
               'convs', (SELECT jsonb_agg(jsonb_build_object('id', cp.conv_id, 'at', cp.last_msg)
                                          ORDER BY cp.last_msg ASC)
                           FROM con_prefs cp
                          WHERE cp.clerk_user_id = us.clerk_user_id)
           ) ORDER BY us.oldest ASC), '[]'::jsonb)
      INTO v_out
      FROM usuarios us;

    RETURN v_out;
END $$;


REVOKE ALL ON FUNCTION public.espejo_memoria_scan_targets(integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.espejo_memoria_scan_targets(integer) TO service_role;
