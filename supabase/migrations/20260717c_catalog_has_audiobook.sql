-- Red Solar Viva · AUDIOLIBROS sin pasar por Apple + alta en UNA línea
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Re-ejecutable: si ya corriste la versión anterior (la que falló), pega ESTA
-- entera encima. Arregla el error y deja todo al día.
--
-- ⚠️ FIX del error 42883 "operator does not exist: uuid = text":
-- book_formats.book_id es UUID y catalog_books.book_id es TEXT. En JSON los dos
-- se ven igual ("7d57f875-..."), por eso el primer intento los comparó directo.
-- Se comparan con bf.book_id::text = cb.book_id (nunca cb.book_id::uuid, que
-- REVIENTA si algún día una fila trae un texto que no sea uuid; el ::text no
-- puede fallar). Verificado contra la base: los 11 Códices tienen uuid válido,
-- sin nulos, espacios ni mayúsculas.
--
-- POR QUÉ
-- Los otros 10 audiolibros tienen que poder salir SIN build ni revisión de
-- Apple (misma norma que wallpapers, categorías y rituales).
-- La REPRODUCCIÓN ya era DB-driven (book_formats.file_url vía get_user_books).
-- La TIENDA no: la pastilla "DESBLOQUEAR · Audiolibro" se decidía con una lista
-- HARDCODEADA en lib/audiobooks.ts → un audiolibro nuevo quedaba invisible.
--
-- QUÉ DEJA
--   1. catalog_books.has_audiobook — el dato que enciende la pastilla, derivado
--      de book_formats por un trigger (una sola verdad, imposible de
--      desincronizar).
--   2. alta_audiolibro('Título', MB) — el alta en UNA línea. Arma la URL sola
--      desde el título, así NUNCA hay que escribir ni actualizar una URL.

-- ── 1) La columna ───────────────────────────────────────────────────
ALTER TABLE public.catalog_books
    ADD COLUMN IF NOT EXISTS has_audiobook boolean NOT NULL DEFAULT false;

-- ── 2) El nombre del archivo se DERIVA del título ───────────────────
-- Regla: minúsculas, sin acentos, espacios -> guiones.
--   'La Voz de Gaia'        -> la-voz-de-gaia.m4a   (así se llama el que ya vive en R2)
--   'Singularidad Orgánica' -> singularidad-organica.m4a
-- Subir el .m4a con ESE nombre es lo único que hay que respetar.
CREATE OR REPLACE FUNCTION public.nombre_audiolibro(p_title text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT trim(both '-' from
        lower(regexp_replace(
            translate(COALESCE(p_title, ''), 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN'),
            '[^a-zA-Z0-9]+', '-', 'g'
        ))
    ) || '.m4a';
$$;

-- ── 3) Recalculador (una sola definición de "tiene audiolibro") ─────
CREATE OR REPLACE FUNCTION public._refresh_catalog_audiobook(p_book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_book_id IS NULL THEN RETURN; END IF;
    UPDATE public.catalog_books cb
    SET has_audiobook = EXISTS (
        SELECT 1
        FROM public.book_formats bf
        WHERE bf.book_id = p_book_id
          AND bf.format_type = 'audiolibro'
          -- Una fila sin URL no es un audiolibro ofrecible.
          AND COALESCE(NULLIF(TRIM(bf.file_url), ''), '') <> ''
          AND TRIM(bf.file_url) <> '#'
    )
    WHERE cb.book_id = p_book_id::text;   -- cb.book_id es TEXT
END;
$$;

-- ── 4) El trigger que lo mantiene solo ──────────────────────────────
CREATE OR REPLACE FUNCTION public._trg_catalog_audiobook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Se refresca el libro viejo Y el nuevo: cubre el caso raro de que una fila
    -- cambie de book_id. (NEW no existe en DELETE ni OLD en INSERT → se
    -- discrimina por TG_OP, nunca por COALESCE(NEW..., OLD...), que revienta.)
    IF TG_OP <> 'INSERT' THEN
        PERFORM public._refresh_catalog_audiobook(OLD.book_id);
    END IF;
    IF TG_OP <> 'DELETE' THEN
        PERFORM public._refresh_catalog_audiobook(NEW.book_id);
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_catalog_audiobook ON public.book_formats;
CREATE TRIGGER trg_catalog_audiobook
AFTER INSERT OR UPDATE OR DELETE ON public.book_formats
FOR EACH ROW EXECUTE FUNCTION public._trg_catalog_audiobook();

-- ── 5) ALTA DE UN AUDIOLIBRO EN UNA LÍNEA ───────────────────────────
-- Uso:  SELECT public.alta_audiolibro('Terra Cristal', 41.2);
-- Arma la URL sola desde el título (nombre_audiolibro), da de alta el formato
-- y el trigger enciende la pastilla. Idempotente: si ya existe, lo actualiza.
CREATE OR REPLACE FUNCTION public.alta_audiolibro(
    p_title   text,
    p_size_mb numeric DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_base  text := 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/Audiolibros/';
    v_id    uuid;
    v_title text;
    v_file  text;
    v_url   text;
    v_accion text;
BEGIN
    SELECT b.id, b.title INTO v_id, v_title
    FROM public.books b
    WHERE lower(trim(b.title)) = lower(trim(p_title))
    LIMIT 1;

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'No existe ningún Códice con el título "%". Revisa que esté escrito igual que en la tabla books.', p_title;
    END IF;

    v_file := public.nombre_audiolibro(v_title);
    v_url  := v_base || v_file;

    UPDATE public.book_formats
    SET file_url     = v_url,
        file_size_mb = COALESCE(p_size_mb, file_size_mb),
        format_label = COALESCE(NULLIF(TRIM(format_label), ''), 'Audiolibro')
    WHERE book_id = v_id AND format_type = 'audiolibro';

    IF FOUND THEN
        v_accion := 'actualizado';
    ELSE
        INSERT INTO public.book_formats (
            book_id, format_type, format_label, file_url, file_size_mb, book_title
        ) VALUES (
            v_id, 'audiolibro', 'Audiolibro', v_url, p_size_mb, v_title
        );
        v_accion := 'dado de alta';
    END IF;

    RETURN format('%s: audiolibro %s. Sube el archivo a R2 como  Codices/Audiolibros/%s', v_title, v_accion, v_file);
END;
$$;

-- ── 6) Cerrar las funciones nuevas ──────────────────────────────────
-- 🜂 Postgres concede EXECUTE a PUBLIC por defecto al crear una función, y
-- PostgREST expone lo que viva en el schema público → sin esto, CUALQUIERA con
-- la llave pública podría llamar alta_audiolibro y meter formatos falsos.
-- Estas son de mantenimiento: se corren desde el SQL Editor (como postgres).
-- El trigger sigue funcionando porque _trg_catalog_audiobook es SECURITY
-- DEFINER → llama al recalculador como dueño, que siempre tiene EXECUTE.
-- (_trg_catalog_audiobook no se revoca: una función que devuelve `trigger` no
-- es invocable directamente, ni por PostgREST.)
REVOKE ALL ON FUNCTION public.alta_audiolibro(text, numeric)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._refresh_catalog_audiobook(uuid)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.nombre_audiolibro(text)
    FROM PUBLIC, anon, authenticated;

-- ── 7) Poner al día lo que ya existe ────────────────────────────────
UPDATE public.catalog_books cb
SET has_audiobook = EXISTS (
    SELECT 1
    FROM public.book_formats bf
    WHERE bf.book_id::text = cb.book_id      -- ⚠️ el cast va acá (uuid -> text)
      AND bf.format_type = 'audiolibro'
      AND COALESCE(NULLIF(TRIM(bf.file_url), ''), '') <> ''
      AND TRIM(bf.file_url) <> '#'
);

-- ── 8) PostgREST tiene que ver la columna nueva ─────────────────────
-- (la tienda pide catalog_books con select=* → sin esto la columna no viaja)
NOTIFY pgrst, 'reload schema';

-- ── Verificación ────────────────────────────────────────────────────
-- (a) Hoy debe salir SOLO "La Voz de Gaia" con la pastilla encendida.
SELECT title, has_audiobook FROM public.catalog_books WHERE has_audiobook ORDER BY title;

-- (b) Los nombres que le tocan a cada Códice cuando le toque su audiolibro.
SELECT title AS codice, public.nombre_audiolibro(title) AS archivo_para_r2
FROM public.catalog_books ORDER BY title;
