-- Red Solar Viva · Barrido profundo (paso 3) — RPCs de protocolos + paywall Calibraciones
-- =====================================================================
-- Cierra los dos frentes que quedaban del barrido (ambos por el gateway
-- `user-action`, token de Clerk verificado → inyecta p_clerk_user_id):
--
--  A) `estado_tripulante_protocolos` (IDOR): anon leía/escribía protocolos
--     de cualquier Tripulante con un clerk_user_id forjable. 4 lecturas + 2
--     escrituras (seed del Enrutador + toggle de tareas) → RPCs SECURITY
--     DEFINER que operan SOLO sobre el id verificado.
--
--  B) `libreria_protocolos` (paywall): el contenido de las Calibraciones (la
--     promesa de Sintonía Solar) era anon-SELECT → leíble sin pagar. Las dos
--     RPC de catálogo/ruteo quedan MEMBER-GATED: reusan get_my_membership_tier
--     y devuelven contenido solo a sintonia/inmersion; a invitado → [].
--
-- ADDITIVE: no se candan las tablas todavía. El REVOKE/RLS lock de ambas va
-- en el LOTE POST-BUILD-LIVE (la build iOS viva lee ambas tablas directo;
-- candarlas ahora rompería la app publicada). Estos RPC son la base para
-- migrar los clientes (web ya, iOS en la build) ANTES del lock.
--
-- tareas_completadas = jsonb array. protocolo_id = uuid. estado: texto
-- (DESBLOQUEADO / EN_PROGRESO / INTEGRADO). No hay constraint único conocido
-- → los writes hacen "si existe UPDATE, si no INSERT" (espeja al cliente).

-- ═══════════════════════════════════════════════════════════════════
-- A) estado_tripulante_protocolos — IDOR (lecturas + escrituras propias)
-- ═══════════════════════════════════════════════════════════════════

-- A1) Protocolos activos del Tripulante + join embebido a libreria_protocolos.
--     Espeja: select=*,protocolo:libreria_protocolos(pilar,fase,titulo,
--     descripcion_corta,alerta_text,sugerencia_text,tareas_json) & estado!=INTEGRADO
CREATE OR REPLACE FUNCTION public.get_my_active_protocols(
    p_clerk_user_id text
) RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
        SELECT e.*,
            (
                SELECT row_to_json(lp)
                FROM (
                    SELECT lp.pilar, lp.fase, lp.titulo, lp.descripcion_corta,
                           lp.alerta_text, lp.sugerencia_text, lp.tareas_json
                    FROM public.libreria_protocolos lp
                    WHERE lp.id = e.protocolo_id
                ) lp
            ) AS protocolo
        FROM public.estado_tripulante_protocolos e
        WHERE e.clerk_user_id = p_clerk_user_id
          AND e.estado <> 'INTEGRADO'
    ) t;
$$;

-- A2) Estados (protocolo_id + estado) de TODAS las filas del Tripulante.
CREATE OR REPLACE FUNCTION public.get_my_protocol_states(
    p_clerk_user_id text
) RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        json_agg(json_build_object('protocolo_id', protocolo_id, 'estado', estado)),
        '[]'::json
    )
    FROM public.estado_tripulante_protocolos
    WHERE clerk_user_id = p_clerk_user_id;
$$;

-- A3) Sembrar protocolos (Enrutador): inserta DESBLOQUEADO los ids que aún
--     no tiene el Tripulante. Idempotente (NOT EXISTS por clerk+protocolo).
CREATE OR REPLACE FUNCTION public.seed_my_protocols(
    p_clerk_user_id text,
    p_protocolo_ids text[]
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_seeded int;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RAISE EXCEPTION 'clerk_user_id requerido' USING ERRCODE = '22023';
    END IF;

    WITH ins AS (
        INSERT INTO public.estado_tripulante_protocolos (
            clerk_user_id, protocolo_id, estado, tareas_completadas, fecha_desbloqueo
        )
        SELECT p_clerk_user_id, pid::uuid, 'DESBLOQUEADO', '[]'::jsonb, now()
        FROM unnest(p_protocolo_ids) AS pid
        WHERE NOT EXISTS (
            SELECT 1 FROM public.estado_tripulante_protocolos e
            WHERE e.clerk_user_id = p_clerk_user_id
              AND e.protocolo_id = pid::uuid
        )
        RETURNING 1
    )
    SELECT count(*) INTO v_seeded FROM ins;

    RETURN json_build_object('seeded', v_seeded);
END $$;

-- A4) Toggle de una tarea (atómico): si la fila existe, agrega/quita la tarea
--     y recalcula estado; si no, inserta EN_PROGRESO con esa tarea. Espeja el
--     read-modify-write del cliente (L2186 read + L2208 patch / L2225 insert).
CREATE OR REPLACE FUNCTION public.toggle_my_protocol_tarea(
    p_clerk_user_id text,
    p_protocolo_id text,
    p_tarea_id text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id uuid;
    v_tc jsonb;
BEGIN
    IF p_clerk_user_id IS NULL OR length(trim(p_clerk_user_id)) = 0 THEN
        RAISE EXCEPTION 'clerk_user_id requerido' USING ERRCODE = '22023';
    END IF;

    SELECT id, COALESCE(tareas_completadas, '[]'::jsonb)
      INTO v_id, v_tc
    FROM public.estado_tripulante_protocolos
    WHERE clerk_user_id = p_clerk_user_id
      AND protocolo_id = p_protocolo_id::uuid
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        IF v_tc ? p_tarea_id THEN
            -- quitar
            SELECT COALESCE(jsonb_agg(x), '[]'::jsonb)
              INTO v_tc
            FROM jsonb_array_elements_text(v_tc) AS x
            WHERE x <> p_tarea_id;
        ELSE
            -- agregar
            v_tc := v_tc || to_jsonb(p_tarea_id);
        END IF;

        UPDATE public.estado_tripulante_protocolos
        SET tareas_completadas = v_tc,
            estado = CASE WHEN jsonb_array_length(v_tc) > 0
                          THEN 'EN_PROGRESO' ELSE 'DESBLOQUEADO' END
        WHERE id = v_id;
    ELSE
        INSERT INTO public.estado_tripulante_protocolos (
            clerk_user_id, protocolo_id, estado, tareas_completadas, fecha_desbloqueo
        ) VALUES (
            p_clerk_user_id, p_protocolo_id::uuid, 'EN_PROGRESO',
            jsonb_build_array(p_tarea_id), now()
        );
    END IF;

    RETURN json_build_object('ok', true);
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- B) libreria_protocolos — paywall (member-gated, reusa get_my_membership_tier)
-- ═══════════════════════════════════════════════════════════════════

-- B1) Catálogo completo de Calibraciones — SOLO miembros. Invitado → [].
CREATE OR REPLACE FUNCTION public.get_libreria_protocolos(
    p_clerk_user_id text
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tier text;
BEGIN
    v_tier := (public.get_my_membership_tier(p_clerk_user_id) ->> 'tier');
    IF v_tier NOT IN ('sintonia', 'inmersion') THEN
        RETURN '[]'::json;  -- paywall: invitado no lee el contenido
    END IF;

    RETURN (
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
        FROM (
            SELECT id, pilar, fase, score_min, score_max, titulo,
                   descripcion_corta, alerta_text, sugerencia_text,
                   tareas_json, is_active
            FROM public.libreria_protocolos
            WHERE is_active = true
            ORDER BY pilar ASC, fase ASC
        ) t
    );
END $$;

-- B2) Ruteo del Enrutador (pilar + score) — SOLO miembros. Invitado → [].
CREATE OR REPLACE FUNCTION public.get_libreria_protocolos_for_routing(
    p_clerk_user_id text,
    p_pilar text,
    p_score int
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tier text;
BEGIN
    v_tier := (public.get_my_membership_tier(p_clerk_user_id) ->> 'tier');
    IF v_tier NOT IN ('sintonia', 'inmersion') THEN
        RETURN '[]'::json;
    END IF;

    RETURN (
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
        FROM (
            SELECT *
            FROM public.libreria_protocolos
            WHERE pilar = p_pilar
              AND is_active = true
              AND score_min <= p_score
            ORDER BY score_min ASC
        ) t
    );
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- Grants: solo el gateway (service_role) las invoca. REVOKE de anon.
-- ═══════════════════════════════════════════════════════════════════
REVOKE ALL ON FUNCTION public.get_my_active_protocols(text)             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_protocol_states(text)              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_my_protocols(text, text[])           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.toggle_my_protocol_tarea(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_libreria_protocolos(text)             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_libreria_protocolos_for_routing(text, text, int) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_active_protocols(text)             TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_protocol_states(text)              TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_my_protocols(text, text[])           TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_my_protocol_tarea(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_libreria_protocolos(text)             TO service_role;
GRANT EXECUTE ON FUNCTION public.get_libreria_protocolos_for_routing(text, text, int) TO service_role;
