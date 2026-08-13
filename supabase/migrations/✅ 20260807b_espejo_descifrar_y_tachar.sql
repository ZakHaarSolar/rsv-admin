-- Red Solar Viva · EL PANEL DEL ESPEJO VUELVE A LEERSE (2026-08-07)
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente. Misma firma → NO requiere redeploy de admin-action.
--
-- 🜂 QUÉ PASÓ. El 2026-08-06 se tapó el nombre del Tripulante dentro del texto
-- (el Espejo saluda por su nombre y ahí se delataba el anonimato). Esa versión
-- reescribió `admin_get_oraculo_conversations` y devolvió:
--
--     public._rsv_tachar_identidad(m.content, p.full_name, p.email)
--
-- pero las conversaciones del Espejo viven CIFRADAS en reposo desde
-- 20260724i_cifrado_espejo, y la versión anterior las descifraba primero:
--
--     public._oraculo_decrypt(m.content, m.enc)
--
-- Al reescribir la función se perdió ese paso. Resultado: el panel dejó de
-- mostrar conversaciones y empezó a mostrar los bloques cifrados crudos
-- ("-----BEGIN PGP MESSAGE-----"), tanto en la lista como al abrir una.
--
-- LA CURA: descifrar PRIMERO, tachar DESPUÉS. El orden es todo: tachar sobre
-- texto cifrado no tapa nada (el nombre no está ahí en claro) y encima deja el
-- mensaje ilegible. Regla general: cuando un dato está cifrado en reposo, toda
-- transformación de CONTENIDO va después de descifrar.
--
-- 🜂 DOS ARREGLOS MÁS del tachado, que se descubren al poder leerlo:
--
-- (1) PALABRA COMPLETA. Buscaba cada palabra del nombre como subcadena. Un
--     Tripulante llamado "Sol" o "Luz" convertía "Sintonía Solar" en
--     "Sintonía ▮▮▮ar" y "la luz interna" en "la ▮▮▮ interna" en TODAS sus
--     conversaciones. Ahora se exige palabra completa (\m … \M): "Sol" tapa a
--     Sol y deja Solar en paz.
--
-- (2) SIN ACENTOS EN LOS DOS SENTIDOS. El comentario decía "sin acentos" pero
--     la comparación era literal: un perfil "José" no tapaba un "Jose" escrito
--     sin acento, que es justo como la gente se escribe a sí misma. Ahora el
--     nombre se aplana y cada vocal se convierte en su familia acentuada, así
--     José · Jose · JOSÉ caen los tres.
--
-- Lo que el Tripulante ve en SU Espejo no cambia en nada: esto solo alimenta
-- el panel de administración.

BEGIN;

-- ── Patrón tolerante a acentos para un nombre ─────────────────────────
-- Toma "José", devuelve  j[oóòöôõ]s[eéèëê]  (y escapa lo que sea metacarácter
-- de expresión regular). Se combina con (?i) y \m…\M en quien lo usa.
CREATE OR REPLACE FUNCTION public._rsv_patron_nombre(t text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    p text;
BEGIN
    /* 1) aplanar: minúsculas y sin acentos (reusa el helper existente). */
    p := public._rsv_plano(COALESCE(t, ''));
    IF p = '' THEN RETURN ''; END IF;

    /* 2) escapar metacaracteres de regex ANTES de meter corchetes propios. */
    p := regexp_replace(p, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g');

    /* 3) cada vocal (y ñ/ç) pasa a ser su familia acentuada. El orden es
          seguro: ninguna clase que insertamos contiene una letra que se
          reemplace después. */
    p := replace(p, 'a', '[aáàäâã]');
    p := replace(p, 'e', '[eéèëê]');
    p := replace(p, 'i', '[iíìïî]');
    p := replace(p, 'o', '[oóòöôõ]');
    p := replace(p, 'u', '[uúùüû]');
    p := replace(p, 'n', '[nñ]');
    p := replace(p, 'c', '[cç]');

    RETURN p;
END;
$$;

-- ── Tachado por PALABRA COMPLETA y tolerante a acentos ────────────────
-- El reemplazo se hace sobre el texto ORIGINAL, así el resto del mensaje
-- queda intacto.
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
    patron text;
    local  text;
BEGIN
    IF salida = '' THEN
        RETURN salida;
    END IF;

    /* Cualquier correo escrito en el texto, sea de quien sea: nombrar a un
       tercero es la misma fuga. */
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
            patron := public._rsv_patron_nombre(local);
            IF patron <> '' THEN
                salida := regexp_replace(
                    salida, '(?i)\m' || patron || '\M', '▮▮▮', 'g'
                );
            END IF;
        END IF;
    END IF;

    /* Cada palabra del nombre del perfil, como PALABRA COMPLETA. */
    IF COALESCE(nombre, '') <> '' THEN
        FOREACH pieza IN ARRAY regexp_split_to_array(trim(nombre), '\s+')
        LOOP
            IF length(pieza) >= 3 THEN
                patron := public._rsv_patron_nombre(pieza);
                IF patron <> '' THEN
                    salida := regexp_replace(
                        salida, '(?i)\m' || patron || '\M', '▮▮▮', 'g'
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN salida;
END;
$$;

-- ── La vista admin: DESCIFRA y luego tacha ────────────────────────────
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
                    /* 🜂 EL ORDEN ES EL ARREGLO: primero descifrar (el texto
                       vive cifrado en reposo), después tachar la identidad.
                       Al revés, el tachado no encuentra nada que tapar y el
                       panel muestra el bloque cifrado. */
                    'content', public._rsv_tachar_identidad(
                        public._oraculo_decrypt(m.content, m.enc),
                        p.full_name,
                        p.email
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

COMMIT;

NOTIFY pgrst, 'reload schema';
