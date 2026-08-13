-- 20260804_correos_tres_listas.sql — El padrón de Correos pasa de UN
-- interruptor ("Solo lista de Android") a TRES listas seleccionables:
-- Android · Escáner Vibracional · Red Solar Viva.
--
-- Pedido de Zak (2026-08-04): con la web ya convertida en casa de marca y
-- el Escáner como producto, un booleano no alcanza para segmentar. Ahora
-- cada correo declara a QUÉ listas pertenece (puede estar en varias) y el
-- panel filtra por la que se quiera escribir.
--
-- Derivación (una sola fuente de verdad, aquí):
--   · en_android  ← android_waitlist (la landing de escanervibracional.com
--                   y redsolarviva.com/android).
--   · en_escaner  ← nodo_central con source que empieza con 'clerk_' o
--                   'email_one_click': gente que creó cuenta en el
--                   ecosistema del Escáner y dio consentimiento explícito
--                   (clerk_google_prefilled · clerk_google_consent ·
--                   clerk_signup_consent · email_one_click).
--   · en_rsv      ← nodo_central con cualquier otro source (el formulario
--                   "ÚNETE AL NODO CENTRAL" de la portada = redsolarviva_landing,
--                   origen_landing, admin_manual, import, NULL) MÁS los
--                   pases de Cámara Solar (exploration_passes), que son
--                   de Red Solar Viva, no del Escáner.
--
-- ⚠️ CAMBIA LA FIRMA (p_only_android boolean → p_lista text). PostgREST
-- resuelve por el set exacto de params y ambos segundos params tienen
-- DEFAULT, así que dejar las dos vivas daría un overload ambiguo → se
-- DROPEA la vieja antes de crear la nueva.
--
-- NO requiere redesplegar admin-action: el nombre de la RPC no cambia y
-- ya está en su whitelist (inyecta p_admin_clerk_id y reenvía p_lista).
--
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

DROP FUNCTION IF EXISTS public.admin_get_subscribers(text, boolean);

CREATE OR REPLACE FUNCTION public.admin_get_subscribers(
    p_admin_clerk_id text,
    p_lista          text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_lista    text;
BEGIN
    SELECT COALESCE(bool_or(COALESCE(is_admin, false)), false) INTO v_is_admin
    FROM profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT v_is_admin THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    -- Lista pedida. NULL / vacío / valor desconocido = sin filtro.
    v_lista := lower(COALESCE(NULLIF(trim(p_lista), ''), 'todos'));
    IF v_lista NOT IN ('todos', 'android', 'escaner', 'rsv') THEN
        v_lista := 'todos';
    END IF;

    RETURN (
        WITH internas AS (
            -- Cuentas propias: no son audiencia (mismo criterio que la
            -- Telemetría de Navegación).
            SELECT unnest(ARRAY[
                'cuerpodeluz555@gmail.com',
                'zakhaarsol@pm.me',
                'redsolarviva@pm.me',
                'veocancun@gmail.com',
                'veotuluzinterna@gmail.com',
                'diegosotoborja@gmail.com',
                'zakhaar@pm.me'
            ]) AS email
        ),
        fuentes AS (
            -- ANDROID: la lista de espera (la landing).
            SELECT lower(trim(w.email))  AS email,
                   'android'::text       AS lista,
                   'android'::text       AS fuente,
                   w.created_at          AS fecha,
                   w.notified_at         AS avisado
            FROM android_waitlist w
            WHERE w.email IS NOT NULL AND trim(w.email) <> ''

            UNION ALL

            -- NODO CENTRAL: se parte en dos listas según el source.
            -- Las altas que nacen de crear cuenta (clerk_*) o del enlace
            -- de un solo toque en el correo son del Escáner; el resto
            -- (formulario de la portada, alta manual, importaciones) es
            -- de Red Solar Viva.
            SELECT lower(trim(nc.email)) AS email,
                   CASE
                       WHEN left(lower(COALESCE(nc.source, '')), 6) = 'clerk_'
                         OR lower(COALESCE(nc.source, '')) = 'email_one_click'
                       THEN 'escaner'
                       ELSE 'rsv'
                   END                   AS lista,
                   'nodo'::text          AS fuente,
                   nc.subscribed_at      AS fecha,
                   NULL::timestamptz     AS avisado
            FROM nodo_central nc
            WHERE nc.email IS NOT NULL AND trim(nc.email) <> ''

            UNION ALL

            -- Cámara Solar grupal (pases de exploración) → Red Solar Viva.
            -- Su fecha es la de la sesión (event_date), la tabla no lleva
            -- created_at.
            -- NOTA: profiles (cuentas de la app) NO participa — tener
            -- cuenta no es opt-in a correos, y ahí vivían las cuentas de
            -- prueba *+clerk_test@example.com.
            SELECT lower(trim(ep.email))      AS email,
                   'rsv'::text                AS lista,
                   'camara'::text             AS fuente,
                   ep.event_date::timestamptz AS fecha,
                   NULL::timestamptz          AS avisado
            FROM exploration_passes ep
            WHERE ep.email IS NOT NULL AND trim(ep.email) <> ''
        ),
        deduped AS (
            -- Un correo = una fila, con TODAS las listas a las que
            -- pertenece. Se conserva la fecha más vieja. Defensa global:
            -- fuera correos de prueba (@example.com / clerk_test) vengan
            -- del origen que vengan, y fuera quien pidió no recibir.
            SELECT
                f.email,
                -- Etiqueta principal (precedencia android > escaner > rsv
                -- > camara). Los chips del panel salen de los booleanos;
                -- esto queda para el CSV y para quien lea una sola marca.
                CASE
                    WHEN bool_or(f.lista = 'android') THEN 'android'
                    WHEN bool_or(f.lista = 'escaner') THEN 'escaner'
                    WHEN bool_or(f.lista = 'rsv' AND f.fuente = 'nodo') THEN 'rsv'
                    ELSE 'camara'
                END                                          AS origen,
                min(f.fecha)                                 AS fecha,
                max(f.avisado)                               AS avisado,
                bool_or(f.lista = 'android')                 AS en_android,
                bool_or(f.lista = 'escaner')                 AS en_escaner,
                bool_or(f.lista = 'rsv')                     AS en_rsv
            FROM fuentes f
            WHERE f.email NOT IN (SELECT email FROM internas)
              AND f.email NOT LIKE '%@example.com'
              AND f.email NOT LIKE '%clerk_test%'
              AND NOT EXISTS (
                  SELECT 1 FROM email_opt_outs o
                  WHERE lower(trim(o.email)) = f.email
              )
            GROUP BY f.email
        ),
        filtrado AS (
            -- El filtro se aplica DESPUÉS del dedupe: un correo que está
            -- en dos listas aparece en las dos.
            SELECT d.* FROM deduped d
            WHERE v_lista = 'todos'
               OR (v_lista = 'android' AND d.en_android)
               OR (v_lista = 'escaner' AND d.en_escaner)
               OR (v_lista = 'rsv'     AND d.en_rsv)
        )
        SELECT json_build_object(
            'total',   (SELECT count(*) FROM filtrado),
            'android', (SELECT count(*) FROM filtrado WHERE en_android),
            'escaner', (SELECT count(*) FROM filtrado WHERE en_escaner),
            'rsv',     (SELECT count(*) FROM filtrado WHERE en_rsv),
            'lista',   v_lista,
            'rows',    COALESCE((
                SELECT json_agg(row_to_json(f) ORDER BY f.fecha DESC NULLS LAST)
                FROM filtrado f
            ), '[]'::json)
        )
    );
END;
$$;

-- Re-afirmar permisos (patrón de la casa: todo CREATE re-otorga a PUBLIC).
REVOKE ALL ON FUNCTION public.admin_get_subscribers(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_subscribers(text, text) TO service_role;

NOTIFY pgrst, 'reload schema';
