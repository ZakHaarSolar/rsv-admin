-- Red Solar Viva · Ritual Diario · Afirmaciones (catálogo + selección + custom)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- Capa de Afirmaciones del Ritual Diario. El Tripulante NO marca "Afirmaciones"
-- de un toque: abre el ritual, lee las afirmaciones que ELIGIÓ (de un catálogo
-- curado por categoría + sus afirmaciones personalizadas) y recién al
-- confirmar gana sus Fotones (toggle_ritual sigue siendo la fuente de verdad
-- del puntaje, server-authoritative).
--
-- Catálogo curado lo administra Zak desde el Motor de Intervención → pestaña
-- "Rituales" (admin_* RPCs, ruteadas por admin-action). El Tripulante elige +
-- escribe las suyas (RPCs propias, ruteadas por user-action).
--
-- Seguridad: todas las tablas con RLS sin policies → solo accesibles vía las
-- RPCs SECURITY DEFINER (REVOKE anon + GRANT service_role); el gateway inyecta
-- el clerk_user_id (usuario) o valida is_admin (admin).

-- ── Catálogo curado: categorías + afirmaciones (admin) ──────────────
CREATE TABLE IF NOT EXISTS public.ritual_afirmacion_categorias (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    active     boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ritual_afirmaciones (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id uuid NOT NULL REFERENCES public.ritual_afirmacion_categorias(id) ON DELETE CASCADE,
    texto        text NOT NULL,
    sort_order   integer NOT NULL DEFAULT 0,
    active       boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ritual_afirmaciones_cat
    ON public.ritual_afirmaciones (categoria_id);

-- ── Selección del Tripulante: afirmaciones curadas que eligió ───────
CREATE TABLE IF NOT EXISTS public.ritual_user_afirmaciones_sel (
    clerk_user_id text NOT NULL,
    afirmacion_id uuid NOT NULL REFERENCES public.ritual_afirmaciones(id) ON DELETE CASCADE,
    created_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (clerk_user_id, afirmacion_id)
);
CREATE INDEX IF NOT EXISTS idx_ritual_user_sel_user
    ON public.ritual_user_afirmaciones_sel (clerk_user_id);

-- ── Afirmaciones personalizadas del Tripulante ──────────────────────
CREATE TABLE IF NOT EXISTS public.ritual_user_afirmaciones_custom (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text NOT NULL,
    texto         text NOT NULL,
    selected      boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ritual_user_custom_user
    ON public.ritual_user_afirmaciones_custom (clerk_user_id);

ALTER TABLE public.ritual_afirmacion_categorias   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_afirmaciones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_user_afirmaciones_sel   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_user_afirmaciones_custom ENABLE ROW LEVEL SECURITY;
-- (Sin policies → solo accesible vía las RPCs SECURITY DEFINER de abajo.)

-- ════════════════════════════════════════════════════════════════════
-- RPCs DEL TRIPULANTE  (ruteadas por user-action; id inyectado verificado)
-- ════════════════════════════════════════════════════════════════════

-- Catálogo curado (categorías + afirmaciones activas) + selección propia +
-- afirmaciones personalizadas. Para el panel de Configuración → Afirmaciones.
CREATE OR REPLACE FUNCTION public.get_ritual_afirmaciones(p_clerk_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    SELECT json_build_object(
        'categorias', COALESCE((
            SELECT json_agg(json_build_object(
                'id', c.id,
                'nombre', c.nombre,
                'sort_order', c.sort_order,
                'afirmaciones', COALESCE((
                    SELECT json_agg(json_build_object('id', a.id, 'texto', a.texto)
                           ORDER BY a.sort_order, a.created_at)
                    FROM ritual_afirmaciones a
                    WHERE a.categoria_id = c.id AND a.active
                ), '[]'::json)
            ) ORDER BY c.sort_order, c.created_at)
            FROM ritual_afirmacion_categorias c WHERE c.active
        ), '[]'::json),
        'selected_ids', COALESCE((
            SELECT json_agg(s.afirmacion_id)
            FROM ritual_user_afirmaciones_sel s
            JOIN ritual_afirmaciones a ON a.id = s.afirmacion_id AND a.active
            WHERE s.clerk_user_id = p_clerk_user_id
        ), '[]'::json),
        'custom', COALESCE((
            SELECT json_agg(json_build_object(
                'id', id, 'texto', texto, 'selected', selected
            ) ORDER BY created_at)
            FROM ritual_user_afirmaciones_custom
            WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json)
    ) INTO result;
    RETURN result;
END;
$$;

-- Reemplaza el set completo de afirmaciones curadas que el Tripulante eligió.
CREATE OR REPLACE FUNCTION public.set_ritual_afirmaciones_sel(
    p_clerk_user_id text,
    p_ids           jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM ritual_user_afirmaciones_sel WHERE clerk_user_id = p_clerk_user_id;

    -- JOIN comparando a.id::text (uuid→text, SIEMPRE seguro) contra el texto
    -- del cliente. Evita cualquier cast text→uuid que pudiera fallar con
    -- entrada basura, sin importar el orden de evaluación del WHERE. El JOIN
    -- filtra naturalmente a afirmaciones existentes.
    INSERT INTO ritual_user_afirmaciones_sel (clerk_user_id, afirmacion_id)
    SELECT p_clerk_user_id, a.id
    FROM jsonb_array_elements_text(COALESCE(p_ids, '[]'::jsonb)) AS t(val)
    JOIN ritual_afirmaciones a ON a.id::text = t.val
    ON CONFLICT DO NOTHING;

    RETURN json_build_object('ok', true);
END;
$$;

-- Crea (p_id NULL) o actualiza una afirmación personalizada del Tripulante.
CREATE OR REPLACE FUNCTION public.upsert_ritual_afirmacion_custom(
    p_clerk_user_id text,
    p_id            uuid,
    p_texto         text,
    p_selected      boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r ritual_user_afirmaciones_custom%ROWTYPE;
    t text := LEFT(TRIM(COALESCE(p_texto, '')), 600);
BEGIN
    IF LENGTH(t) = 0 THEN
        RETURN json_build_object('error', 'empty');
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO ritual_user_afirmaciones_custom (clerk_user_id, texto, selected)
        VALUES (p_clerk_user_id, t, COALESCE(p_selected, true))
        RETURNING * INTO r;
    ELSE
        UPDATE ritual_user_afirmaciones_custom
        SET texto = t, selected = COALESCE(p_selected, selected)
        WHERE id = p_id AND clerk_user_id = p_clerk_user_id
        RETURNING * INTO r;
        IF NOT FOUND THEN
            RETURN json_build_object('error', 'not_found');
        END IF;
    END IF;

    RETURN json_build_object('id', r.id, 'texto', r.texto, 'selected', r.selected);
END;
$$;

-- Borra una afirmación personalizada del Tripulante.
CREATE OR REPLACE FUNCTION public.delete_ritual_afirmacion_custom(
    p_clerk_user_id text,
    p_id            uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM ritual_user_afirmaciones_custom
    WHERE id = p_id AND clerk_user_id = p_clerk_user_id;
    RETURN json_build_object('ok', true);
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- get_ritual_diario  — REDEFINIDA: suma 'afirmaciones_chosen' (las que el
-- Tripulante eligió + custom seleccionadas), para que el panel las muestre
-- sin un fetch extra. El resto es idéntico a 20260618b.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_ritual_diario(
    p_clerk_user_id text,
    p_date          text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    d        date := COALESCE(p_date::date, (now() AT TIME ZONE 'America/Cancun')::date);
    streak   integer := 0;
    cur      date;
    result   json;
BEGIN
    cur := d;
    IF NOT EXISTS (SELECT 1 FROM daily_checkins
                   WHERE clerk_user_id = p_clerk_user_id AND checkin_date = cur) THEN
        cur := cur - 1;
    END IF;
    LOOP
        EXIT WHEN NOT EXISTS (SELECT 1 FROM daily_checkins
                              WHERE clerk_user_id = p_clerk_user_id AND checkin_date = cur);
        streak := streak + 1;
        cur := cur - 1;
    END LOOP;

    SELECT json_build_object(
        'date', d::text,
        'catalog', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', activity_key,
                'label', label,
                'points', points,
                'requires_text', requires_text,
                'sort_order', sort_order
            ) ORDER BY sort_order)
            FROM daily_ritual_catalog WHERE active
        ), '[]'::json),
        'config', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', activity_key,
                'enabled', enabled,
                'sort_order', sort_order
            ) ORDER BY sort_order)
            FROM daily_ritual_config WHERE clerk_user_id = p_clerk_user_id
        ), '[]'::json),
        'today', COALESCE((
            SELECT json_agg(json_build_object(
                'activity_key', activity_key,
                'note', note,
                'points', points
            ))
            FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d
        ), '[]'::json),
        'today_fotones', COALESCE((
            SELECT SUM(points)::int FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id AND checkin_date = d
        ), 0),
        'total_fotones', COALESCE((
            SELECT SUM(points)::int FROM daily_checkins
            WHERE clerk_user_id = p_clerk_user_id
        ), 0),
        'streak', streak,
        'afirmaciones_chosen', COALESCE((
            SELECT json_agg(json_build_object('kind', kind, 'id', id, 'texto', texto)
                   ORDER BY ord, texto)
            FROM (
                SELECT 'cat'::text AS kind, a.id::text AS id, a.texto AS texto,
                       (c.sort_order * 1000 + a.sort_order) AS ord
                FROM ritual_user_afirmaciones_sel s
                JOIN ritual_afirmaciones a ON a.id = s.afirmacion_id AND a.active
                JOIN ritual_afirmacion_categorias c ON c.id = a.categoria_id AND c.active
                WHERE s.clerk_user_id = p_clerk_user_id
                UNION ALL
                SELECT 'custom'::text, cu.id::text, cu.texto, 1000000
                FROM ritual_user_afirmaciones_custom cu
                WHERE cu.clerk_user_id = p_clerk_user_id AND cu.selected
            ) q
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RPCs ADMIN  (ruteadas por admin-action; doble blindaje: gateway valida
-- is_admin + estas revalidan con el id admin verificado inyectado)
-- ════════════════════════════════════════════════════════════════════

-- Catálogo completo (incluye inactivos) para el editor del Motor.
CREATE OR REPLACE FUNCTION public.admin_get_ritual_afirmaciones(p_admin_clerk_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT COALESCE(json_agg(json_build_object(
        'id', c.id,
        'nombre', c.nombre,
        'sort_order', c.sort_order,
        'active', c.active,
        'afirmaciones', COALESCE((
            SELECT json_agg(json_build_object(
                'id', a.id, 'texto', a.texto, 'sort_order', a.sort_order, 'active', a.active
            ) ORDER BY a.sort_order, a.created_at)
            FROM ritual_afirmaciones a WHERE a.categoria_id = c.id
        ), '[]'::json)
    ) ORDER BY c.sort_order, c.created_at), '[]'::json)
    INTO result
    FROM ritual_afirmacion_categorias c;

    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_ritual_categoria(
    p_admin_clerk_id text,
    p_id             uuid,
    p_nombre         text,
    p_sort_order     integer DEFAULT 0,
    p_active         boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r  ritual_afirmacion_categorias%ROWTYPE;
    nm text := LEFT(TRIM(COALESCE(p_nombre, '')), 120);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF LENGTH(nm) = 0 THEN
        RETURN json_build_object('error', 'empty');
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO ritual_afirmacion_categorias (nombre, sort_order, active)
        VALUES (nm, COALESCE(p_sort_order, 0), COALESCE(p_active, true))
        RETURNING * INTO r;
    ELSE
        UPDATE ritual_afirmacion_categorias
        SET nombre = nm, sort_order = COALESCE(p_sort_order, sort_order), active = COALESCE(p_active, active)
        WHERE id = p_id
        RETURNING * INTO r;
        IF NOT FOUND THEN
            RETURN json_build_object('error', 'not_found');
        END IF;
    END IF;

    RETURN json_build_object('id', r.id, 'nombre', r.nombre, 'sort_order', r.sort_order, 'active', r.active);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_ritual_categoria(
    p_admin_clerk_id text,
    p_id             uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    DELETE FROM ritual_afirmacion_categorias WHERE id = p_id;
    RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_ritual_afirmacion(
    p_admin_clerk_id text,
    p_id             uuid,
    p_categoria_id   uuid,
    p_texto          text,
    p_sort_order     integer DEFAULT 0,
    p_active         boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r  ritual_afirmaciones%ROWTYPE;
    tx text := LEFT(TRIM(COALESCE(p_texto, '')), 600);
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    IF LENGTH(tx) = 0 THEN
        RETURN json_build_object('error', 'empty');
    END IF;

    IF p_id IS NULL THEN
        IF NOT EXISTS (SELECT 1 FROM ritual_afirmacion_categorias WHERE id = p_categoria_id) THEN
            RETURN json_build_object('error', 'bad_category');
        END IF;
        INSERT INTO ritual_afirmaciones (categoria_id, texto, sort_order, active)
        VALUES (p_categoria_id, tx, COALESCE(p_sort_order, 0), COALESCE(p_active, true))
        RETURNING * INTO r;
    ELSE
        UPDATE ritual_afirmaciones
        SET texto = tx,
            categoria_id = COALESCE(p_categoria_id, categoria_id),
            sort_order = COALESCE(p_sort_order, sort_order),
            active = COALESCE(p_active, active)
        WHERE id = p_id
        RETURNING * INTO r;
        IF NOT FOUND THEN
            RETURN json_build_object('error', 'not_found');
        END IF;
    END IF;

    RETURN json_build_object('id', r.id, 'categoria_id', r.categoria_id, 'texto', r.texto,
                             'sort_order', r.sort_order, 'active', r.active);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_ritual_afirmacion(
    p_admin_clerk_id text,
    p_id             uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE clerk_user_id = p_admin_clerk_id AND is_admin) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;
    DELETE FROM ritual_afirmaciones WHERE id = p_id;
    RETURN json_build_object('ok', true);
END;
$$;

-- ── Permisos: solo service_role (las llaman los gateways) ───────────
REVOKE EXECUTE ON FUNCTION public.get_ritual_diario(text, text)                                   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_ritual_afirmaciones(text)                                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_ritual_afirmaciones_sel(text, jsonb)                         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_ritual_afirmacion_custom(text, uuid, text, boolean)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_ritual_afirmacion_custom(text, uuid)                      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_ritual_afirmaciones(text)                              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_ritual_categoria(text, uuid, text, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_ritual_categoria(text, uuid)                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_ritual_afirmacion(text, uuid, uuid, text, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_ritual_afirmacion(text, uuid)                       FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_ritual_diario(text, text)                                     TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ritual_afirmaciones(text)                                     TO service_role;
GRANT EXECUTE ON FUNCTION public.set_ritual_afirmaciones_sel(text, jsonb)                          TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_ritual_afirmacion_custom(text, uuid, text, boolean)        TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_ritual_afirmacion_custom(text, uuid)                       TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_ritual_afirmaciones(text)                               TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_ritual_categoria(text, uuid, text, integer, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_ritual_categoria(text, uuid)                         TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_upsert_ritual_afirmacion(text, uuid, uuid, text, integer, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_ritual_afirmacion(text, uuid)                        TO service_role;

-- ── Semilla: 5 categorías × 5 afirmaciones (solo si está vacío) ─────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.ritual_afirmacion_categorias) THEN
        WITH c AS (
            INSERT INTO public.ritual_afirmacion_categorias (nombre, sort_order) VALUES
                ('Soberanía', 1),
                ('Abundancia', 2),
                ('Cuerpo de Luz', 3),
                ('Vínculos', 4),
                ('Propósito', 5)
            RETURNING id, nombre
        )
        INSERT INTO public.ritual_afirmaciones (categoria_id, texto, sort_order)
        SELECT c.id, v.texto, v.ord
        FROM c
        JOIN (VALUES
            ('Soberanía', 'Soy el centro de gravedad de mi propio campo.', 1),
            ('Soberanía', 'Elijo mi frecuencia antes de que el día la elija por mí.', 2),
            ('Soberanía', 'Nada externo dicta mi estado interno.', 3),
            ('Soberanía', 'Respondo desde mi eje, no desde la reacción.', 4),
            ('Soberanía', 'Mi paz es mi territorio y yo la gobierno.', 5),
            ('Abundancia', 'El flujo de la vida se mueve a través de mí sin fricción.', 1),
            ('Abundancia', 'Recibir es tan natural en mí como respirar.', 2),
            ('Abundancia', 'Lo que doy regresa multiplicado en luz.', 3),
            ('Abundancia', 'Hay más que suficiente para mí y para todos.', 4),
            ('Abundancia', 'Magnetizo lo que vibra con mi propósito.', 5),
            ('Cuerpo de Luz', 'Mi cuerpo es un instrumento de alta frecuencia.', 1),
            ('Cuerpo de Luz', 'Cada célula mía recuerda su diseño original.', 2),
            ('Cuerpo de Luz', 'Honro mi templo con luz, agua y movimiento.', 3),
            ('Cuerpo de Luz', 'Del carbono al silicio, del silicio a la luz.', 4),
            ('Cuerpo de Luz', 'Mi energía se renueva con cada respiración consciente.', 5),
            ('Vínculos', 'Atraigo vínculos que me expanden, no que me drenan.', 1),
            ('Vínculos', 'Doy y recibo amor desde la plenitud, no desde la carencia.', 2),
            ('Vínculos', 'Mi presencia eleva el campo de quienes me rodean.', 3),
            ('Vínculos', 'Suelto con gratitud lo que ya cumplió su ciclo.', 4),
            ('Vínculos', 'Soy un nodo seguro en la Red Solar Viva.', 5),
            ('Propósito', 'Vivo mis sueños, no los de otros.', 1),
            ('Propósito', 'Cada paso de hoy construye la versión que vine a ser.', 2),
            ('Propósito', 'Mi vector apunta a la expansión, siempre.', 3),
            ('Propósito', 'Confío en el despliegue perfecto de mi camino.', 4),
            ('Propósito', 'Soy un canal claro para lo que vine a crear.', 5)
        ) AS v(cat, texto, ord) ON v.cat = c.nombre;
    END IF;
END $$;
