-- Red Solar Viva · UN CRISTAL = EL CÓDICE COMPLETO (todos sus formatos, ahora y a futuro)
-- =====================================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Re-ejecutable: pegarla dos veces no duplica nada ni cobra de más.
--
-- DECISIÓN (Zak, 2026-08-01): un Cristal de Códice (o la compra suelta) ya no
-- entrega UN formato: entrega el Códice ENTERO. Y la promesa es "ahora y a
-- futuro": el audiolibro que se produzca dentro de ocho meses aterriza SOLO en
-- la biblioteca de quien ya canjeó ese libro, sin canje nuevo y sin backfill
-- manual.
--
-- POR QUÉ (lo que se rompía con el modelo por-formato):
--   · Casi nadie gasta un segundo Cristal en el MISMO libro que ya tiene: quien
--     lee, lee; quien escucha, escucha. El catálogo no duraba 22 canjes, duraba
--     11 con una capa de fricción encima.
--   · Elegir formato es una decisión con arrepentimiento (eliges ebook y a la
--     semana quieres escucharlo manejando).
--   · Hoy solo 2 de 11 Códices tienen audiolibro. Prometer "los dos formatos"
--     dejaría 9 cojos; prometer "el Códice completo, ahora y a futuro" es
--     verdadero HOY y convierte cada audiolibro nuevo en un aviso a toda la
--     base que ya lo canjeó → motor de regreso a la app.
--   · El costo marginal por persona es CERO (R2 no cobra egreso).
--
-- CÓMO (3 piezas):
--   1. purchases.full_access — marca "este Tripulante tiene el Códice entero".
--   2. redeem_codice_with_cristal escribe TODOS los formatos entregables del
--      libro (los que existen hoy) y enciende full_access.
--   3. Un trigger sobre book_formats reparte cada formato NUEVO a todas las
--      compras completas de ese libro → la promesa "a futuro" se cumple sola.
--
-- 🜂 La fuente de verdad del acceso sigue siendo purchases.formats_purchased
-- (get_user_books la cruza con book_formats). NO se toca ninguna RPC de
-- lectura, así que la biblioteca, la Bóveda y el reproductor siguen igual.

-- ── 1) La marca ─────────────────────────────────────────────────────
ALTER TABLE public.purchases
    ADD COLUMN IF NOT EXISTS full_access boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.purchases.full_access IS
    'true = el Tripulante tiene el Códice COMPLETO: recibe también los formatos que se den de alta después (trigger trg_reparte_formato_nuevo sobre book_formats).';

-- ── 2) Qué formatos son entregables ─────────────────────────────────
-- Un formato cuenta solo si tiene archivo real. La misma guarda que ya usa
-- _refresh_catalog_audiobook: sin URL (o con '#') no es algo que se pueda
-- entregar, así que nunca entra a formats_purchased ni enciende una pastilla.
CREATE OR REPLACE FUNCTION public._codice_formatos_entregables(p_book_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        ARRAY(
            SELECT DISTINCT bf.format_type
            FROM public.book_formats bf
            WHERE bf.book_id = p_book_id
              AND COALESCE(NULLIF(TRIM(bf.format_type), ''), '') <> ''
              AND COALESCE(NULLIF(TRIM(bf.file_url), ''), '') <> ''
              AND TRIM(bf.file_url) <> '#'
            ORDER BY bf.format_type
        ),
        ARRAY[]::text[]
    );
$$;

REVOKE ALL ON FUNCTION public._codice_formatos_entregables(uuid)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._codice_formatos_entregables(uuid)
    TO service_role;

-- ── 3) El canje entrega el Códice ENTERO ────────────────────────────
-- La firma NO cambia (p_formats se conserva) para no tocar el gateway
-- user-action ni romper la app publicada: un cliente viejo que todavía mande
-- ["pdf"] o ["audiolibro"] recibe igual el Códice completo.
CREATE OR REPLACE FUNCTION public.redeem_codice_with_cristal(
    p_clerk_user_id text,
    p_book_id text,
    p_formats text[] DEFAULT ARRAY['pdf']::text[]   -- IGNORADO desde 2026-08-01
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_email text;
    v_canje_result json;
    v_existing_purchase_id uuid;
    v_existing_full boolean;
    v_book_uuid uuid;
    v_formatos text[];
BEGIN
    IF p_clerk_user_id IS NULL OR p_clerk_user_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'clerk_user_id requerido');
    END IF;
    IF p_book_id IS NULL OR p_book_id = '' THEN
        RETURN json_build_object('success', false, 'error', 'book_id requerido');
    END IF;

    BEGIN
        v_book_uuid := p_book_id::uuid;
    EXCEPTION WHEN others THEN
        RETURN json_build_object('success', false, 'error', 'book_id_invalido');
    END;

    -- Resolver perfil.
    SELECT id, email INTO v_user_id, v_email
    FROM public.profiles
    WHERE clerk_user_id = p_clerk_user_id
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'profile_not_found');
    END IF;

    -- ¿YA TIENE ESTE CÓDICE? Entonces no se cobra NADA.
    -- 🜂 El corte es por LIBRO, no por formato. Antes pedir el audiolibro
    -- teniendo el pdf cobraba un 2º Cristal; ahora el libro es uno solo.
    -- Y si la compra venía de antes (sin full_access), se completa GRATIS:
    -- ya pagó por ese Códice, cobrarle de nuevo por un formato que ahora
    -- viene incluido sería cobrar dos veces lo mismo.
    SELECT id, COALESCE(full_access, false)
      INTO v_existing_purchase_id, v_existing_full
    FROM public.purchases
    WHERE book_id = v_book_uuid
      AND lower(trim(email)) = lower(trim(v_email))
    LIMIT 1;

    IF v_existing_purchase_id IS NOT NULL THEN
        IF NOT v_existing_full THEN
            UPDATE public.purchases p
               SET full_access = true,
                   formats_purchased = ARRAY(
                       SELECT DISTINCT f
                       FROM unnest(
                           COALESCE(p.formats_purchased, ARRAY[]::text[])
                           || public._codice_formatos_entregables(v_book_uuid)
                       ) AS f
                       ORDER BY f
                   )
             WHERE p.id = v_existing_purchase_id;
        END IF;
        RETURN json_build_object(
            'success', true,
            'already_owned', true,
            'purchase_id', v_existing_purchase_id
        );
    END IF;

    -- Los formatos entregables de HOY. Los que nazcan después los reparte el
    -- trigger, así que aquí NUNCA se escribe un formato que no exista.
    v_formatos := public._codice_formatos_entregables(v_book_uuid);

    -- 🜂 Guarda anti-cristal-al-vacío: si el Códice no tiene NINGÚN archivo
    -- entregable (fila sin URL, alta a medias), NO se cobra el Cristal. Sin
    -- esto el Tripulante pagaría con su Cristal y se quedaría sin nada.
    IF array_length(v_formatos, 1) IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'codice_sin_formatos'
        );
    END IF;

    -- Canjear cristal (descontar uno disponible).
    v_canje_result := public.canjear_cristal(
        p_clerk_user_id,
        'codice',
        p_book_id
    );

    IF NOT (v_canje_result->>'success')::boolean THEN
        RETURN json_build_object(
            'success', false,
            'error', COALESCE(v_canje_result->>'error', 'canje_failed')
        );
    END IF;

    -- Registrar / ampliar la compra. Unión de formatos (nunca pisa lo ya
    -- adquirido) + full_access encendido.
    INSERT INTO public.purchases (
        user_id,
        email,
        book_id,
        formats_purchased,
        purchased_at,
        amount_cents,
        acquired_via,
        full_access
    ) VALUES (
        v_user_id,
        v_email,
        v_book_uuid,
        v_formatos,
        now(),
        0,
        'cristal',
        true
    )
    ON CONFLICT (email, book_id) DO UPDATE
        SET formats_purchased = ARRAY(
                SELECT DISTINCT f
                FROM unnest(
                    COALESCE(public.purchases.formats_purchased, ARRAY[]::text[])
                    || EXCLUDED.formats_purchased
                ) AS f
                ORDER BY f
            ),
            acquired_via = 'cristal',
            purchased_at = now(),
            full_access = true;

    RETURN json_build_object(
        'success', true,
        'already_owned', false,
        'book_id', p_book_id,
        'formats', v_formatos,
        'full_access', true,
        'cristal_id', v_canje_result->>'cristal_id'
    );
END $$;

-- Lock canónico: gateway-only (user-action inyecta el clerk_user_id verificado).
-- 🜂 Un CREATE OR REPLACE re-otorga EXECUTE a PUBLIC → hay que re-revocar SIEMPRE.
REVOKE ALL ON FUNCTION public.redeem_codice_with_cristal(text, text, text[])
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_codice_with_cristal(text, text, text[])
    TO service_role;

-- ── 4) Registrar una COMPRA SUELTA como Códice completo ─────────────
-- La usa el webhook de Stripe (pago único de un Códice en la web). Devuelve los
-- formatos entregables para que el webhook los escriba en el mismo upsert donde
-- guarda el pago, el device y la sesión de checkout.
CREATE OR REPLACE FUNCTION public.codice_formatos_para_compra(p_book_id text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uuid uuid;
BEGIN
    BEGIN
        v_uuid := p_book_id::uuid;
    EXCEPTION WHEN others THEN
        RETURN json_build_object('formats', ARRAY['pdf']::text[]);
    END;
    RETURN json_build_object(
        'formats', public._codice_formatos_entregables(v_uuid)
    );
END $$;

REVOKE ALL ON FUNCTION public.codice_formatos_para_compra(text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.codice_formatos_para_compra(text)
    TO service_role;

-- ── 5) "A FUTURO": el formato nuevo aterriza solo ───────────────────
-- Cuando se da de alta un audiolibro (alta_audiolibro) o cualquier formato
-- nuevo, se agrega a formats_purchased de TODAS las compras completas de ese
-- libro. Sin canje nuevo, sin backfill manual, sin build de la app.
CREATE OR REPLACE FUNCTION public._reparte_formato_a_completos(
    p_book_id uuid,
    p_format  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_book_id IS NULL OR COALESCE(NULLIF(TRIM(p_format), ''), '') = '' THEN
        RETURN;
    END IF;

    UPDATE public.purchases p
       SET formats_purchased = ARRAY(
               SELECT DISTINCT f
               FROM unnest(
                   COALESCE(p.formats_purchased, ARRAY[]::text[])
                   || ARRAY[TRIM(p_format)]
               ) AS f
               ORDER BY f
           )
     WHERE p.book_id = p_book_id
       AND COALESCE(p.full_access, false) = true
       -- Solo las que aún no lo tienen: así el UPDATE no toca filas de más
       -- (menos escritura, y no dispara triggers ajenos sin necesidad).
       AND NOT (ARRAY[TRIM(p_format)] <@ COALESCE(p.formats_purchased, ARRAY[]::text[]));
END $$;

-- 🜂 Postgres concede EXECUTE a PUBLIC al crear una función y PostgREST expone
-- lo que viva en el schema público → sin este REVOKE, cualquiera con la llave
-- pública podría llamarla y meter formatos falsos en las bibliotecas ajenas.
-- (La de trigger no se revoca: una función que devuelve `trigger` no es
-- invocable directamente ni por PostgREST, y el trigger la llama como dueño.)
REVOKE ALL ON FUNCTION public._reparte_formato_a_completos(uuid, text)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._reparte_formato_a_completos(uuid, text)
    TO service_role;

CREATE OR REPLACE FUNCTION public._trg_reparte_formato_nuevo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Solo importa el alta/actualización de un formato ENTREGABLE (con archivo
    -- real). Un DELETE no quita nada a nadie: si el formato desaparece de
    -- book_formats, get_user_books deja de devolverlo solo.
    IF TG_OP IN ('INSERT', 'UPDATE')
       AND COALESCE(NULLIF(TRIM(NEW.file_url), ''), '') <> ''
       AND TRIM(NEW.file_url) <> '#'
    THEN
        PERFORM public._reparte_formato_a_completos(NEW.book_id, NEW.format_type);
    END IF;
    RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_reparte_formato_nuevo ON public.book_formats;
CREATE TRIGGER trg_reparte_formato_nuevo
AFTER INSERT OR UPDATE ON public.book_formats
FOR EACH ROW EXECUTE FUNCTION public._trg_reparte_formato_nuevo();

-- ── 6) Poner al día lo que ya existe ────────────────────────────────
-- Toda fila de purchases es "este Tripulante adquirió este Códice digital"
-- (por Stripe, por Cristal o por regalo admin; Amazon no escribe aquí). Con la
-- regla nueva, todas pasan a completas y se les completan los formatos.
-- Es un regalo de buena fe a los primeros Tripulantes y evita la incoherencia
-- de "canjeé antes y me quedé sin audiolibro".
-- 🜂 Si prefieres NO regalar retroactivo, comenta este bloque ANTES de correr.
UPDATE public.purchases SET full_access = true WHERE full_access = false;

UPDATE public.purchases p
   SET formats_purchased = ARRAY(
           SELECT DISTINCT f
           FROM unnest(
               COALESCE(p.formats_purchased, ARRAY[]::text[])
               || public._codice_formatos_entregables(p.book_id)
           ) AS f
           ORDER BY f
       )
 WHERE p.book_id IS NOT NULL
   AND NOT (
       public._codice_formatos_entregables(p.book_id)
       <@ COALESCE(p.formats_purchased, ARRAY[]::text[])
   );

-- ── 7) PostgREST tiene que ver la columna nueva ─────────────────────
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════ VERIFICACIÓN ═══════════════════════════════
-- (a) Qué formatos entregables tiene cada Códice hoy.
SELECT b.title,
       public._codice_formatos_entregables(b.id) AS formatos_entregables
FROM public.books b
ORDER BY b.title;

-- (b) Las compras quedaron completas y con todos sus formatos.
SELECT COUNT(*) FILTER (WHERE full_access)                       AS compras_completas,
       COUNT(*) FILTER (WHERE NOT full_access)                   AS compras_parciales,
       COUNT(*)                                                  AS total
FROM public.purchases;

-- (c) Ninguna compra completa debería quedar corta respecto a su libro.
SELECT p.email, p.book_id, p.formats_purchased,
       public._codice_formatos_entregables(p.book_id) AS deberia_tener
FROM public.purchases p
WHERE COALESCE(p.full_access, false)
  AND NOT (public._codice_formatos_entregables(p.book_id)
           <@ COALESCE(p.formats_purchased, ARRAY[]::text[]));
-- ↑ debe devolver CERO filas.
