-- Red Solar Viva · EL PANEL DEL ESPEJO NO PUEDE VER NOMBRES (2026-08-06)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente / re-ejecutable. Misma firma → NO requiere redeploy del
-- gateway admin-action.
--
-- 🜂 EL AGUJERO (Zak): el panel se construyó anónimo a propósito —devuelve un
-- alias por hash, jamás correo ni nombre— pero el ANONIMATO SE ROMPÍA SOLO,
-- porque el nombre viaja DENTRO del texto: el Espejo saluda a la persona por
-- su nombre y ahí queda escrito. Leyendo una conversación, Zak supo de quién
-- era. Un panel anónimo que se delata en la primera línea no es un panel
-- anónimo.
--
-- LA CURA: la redacción ocurre AQUÍ, donde el nombre se conoce y el admin no
-- lo recibe. Antes de devolver nada se tachan, sobre el texto de cada mensaje:
--   · cada palabra del nombre del perfil (≥3 letras, sin acentos, sin
--     distinguir mayúsculas),
--   · la parte local de su correo y el correo entero,
--   · el propio correo escrito en cualquier parte del texto (cualquiera, no
--     solo el suyo: nombrar a un tercero es la misma fuga).
-- Lo tachado se reemplaza por ▮▮▮, que se lee como censura deliberada y no
-- como un error de datos.
--
-- Lo que el Tripulante ve en SU Espejo no cambia en nada: esta función solo
-- alimenta el panel de administración.

-- Quita acentos y baja a minúsculas para comparar sin sorpresas.
CREATE OR REPLACE FUNCTION public._rsv_plano(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT lower(translate(
        COALESCE(t, ''),
        'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇáàäâãéèëêíìïîóòöôõúùüûñç',
        'AAAAAEEEEIIIIOOOOOUUUUNCaaaaaeeeeiiiiooooouuuunc'
    ));
$$;

/* Tacha en `txt` cada palabra de `nombre` (≥3 letras) y el correo `mail`.
   La comparación es sin acentos y sin mayúsculas, pero el reemplazo se hace
   sobre el texto ORIGINAL, así que el resto del mensaje queda intacto. */
CREATE OR REPLACE FUNCTION public._rsv_tachar_identidad(
    txt    text,
    nombre text,
    mail   text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    salida text := COALESCE(txt, '');
    pieza  text;
    local  text;
BEGIN
    IF salida = '' THEN
        RETURN salida;
    END IF;

    /* Cualquier correo escrito en el texto, sea de quien sea. */
    salida := regexp_replace(
        salida,
        '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
        '▮▮▮',
        'g'
    );

    /* La parte local del correo del dueño (suele ser su nombre). */
    IF COALESCE(mail, '') <> '' THEN
        local := split_part(mail, '@', 1);
        IF length(local) >= 4 THEN
            salida := regexp_replace(
                salida, '(?i)' || regexp_replace(local, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g'),
                '▮▮▮', 'g'
            );
        END IF;
    END IF;

    /* Cada palabra del nombre del perfil. */
    IF COALESCE(nombre, '') <> '' THEN
        FOREACH pieza IN ARRAY regexp_split_to_array(trim(nombre), '\s+')
        LOOP
            IF length(pieza) >= 3 THEN
                salida := regexp_replace(
                    salida,
                    '(?i)' || regexp_replace(pieza, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g'),
                    '▮▮▮',
                    'g'
                );
            END IF;
        END LOOP;
    END IF;

    RETURN salida;
END;
$$;

-- ── La vista admin, ahora con la identidad tachada ────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_oraculo_conversations(
    p_admin_clerk_id text,
    p_limit integer DEFAULT 40
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_result   json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles
    WHERE clerk_user_id = p_admin_clerk_id;

    IF NOT COALESCE(v_is_admin, false) THEN
        RAISE EXCEPTION 'not_admin';
    END IF;

    SELECT COALESCE(json_agg(c ORDER BY c.last_at DESC NULLS LAST), '[]'::json)
    INTO v_result
    FROM (
        SELECT
            conv.id AS conv_id,
            'Nodo ' || substr(md5(conv.clerk_user_id), 1, 6) AS alias,
            conv.last_at,
            (
                SELECT COALESCE(json_agg(json_build_object(
                    'role', m.role,
                    /* 🜂 Acá muere el nombre: nunca sale de la base. */
                    'content', public._rsv_tachar_identidad(
                        m.content, p.full_name, p.email
                    ),
                    'created_at', m.created_at
                ) ORDER BY m.created_at ASC), '[]'::json)
                FROM public.oraculo_messages m
                WHERE m.conversation_id = conv.id
            ) AS messages,
            (
                SELECT COUNT(*) FROM public.oraculo_messages m2
                WHERE m2.conversation_id = conv.id
            ) AS msg_count
        FROM public.oraculo_conversations conv
        LEFT JOIN LATERAL (
            SELECT pr.full_name, pr.email
            FROM public.profiles pr
            WHERE pr.clerk_user_id = conv.clerk_user_id
            LIMIT 1
        ) p ON TRUE
        ORDER BY conv.last_at DESC NULLS LAST
        LIMIT GREATEST(1, LEAST(p_limit, 200))
    ) c;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_oraculo_conversations(text, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_oraculo_conversations(text, integer)
    TO service_role;
