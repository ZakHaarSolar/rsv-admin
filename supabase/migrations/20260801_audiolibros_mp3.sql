-- Red Solar Viva · AUDIOLIBROS pasan de .m4a a .mp3
-- =====================================================================
-- Aplicar: Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Re-ejecutable: pegar entero cuantas veces haga falta, no rompe nada.
--
-- POR QUÉ
-- Todos los audiolibros ahora se producen en .mp3 (320 kbps) en vez de .m4a.
-- La URL de cada audiolibro se DERIVA del título con nombre_audiolibro(), que
-- terminaba en '.m4a'. Este script (1) cambia la derivación a '.mp3' y (2)
-- re-deriva las URLs de TODOS los audiolibros que ya existen, para que apunten
-- al archivo .mp3 sin tener que escribir ni una URL a mano. Cubre "El Agua que
-- Recuerda", "La Voz de Gaia" y cualquier otro que ya tenga fila.

-- ── 1) El nombre del archivo ahora termina en .mp3 ──────────────────
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
    ) || '.mp3';
$$;

-- 🜂 Un CREATE OR REPLACE vuelve a conceder EXECUTE a PUBLIC → hay que
-- re-cerrar, o la función quedaría llamable con la llave pública (el mismo
-- patrón que causó regresiones de seguridad en la auditoría). El trigger la
-- sigue usando porque _trg_catalog_audiobook es SECURITY DEFINER.
REVOKE ALL ON FUNCTION public.nombre_audiolibro(text)
    FROM PUBLIC, anon, authenticated;

-- ── 2) Re-derivar TODAS las URLs de audiolibro que ya existen ───────
-- Toma el título de cada libro y reconstruye la URL con la regla nueva (.mp3).
-- No toca el tamaño (file_size_mb): ese dato es solo para la pastilla de
-- descarga. Si quieres que muestre el peso real del .mp3, corre después
--   SELECT public.alta_audiolibro('El Agua que Recuerda', <MB>);
-- por libro; pero NO hace falta para que suene.
UPDATE public.book_formats bf
SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/Audiolibros/'
             || public.nombre_audiolibro(b.title)
FROM public.books b
WHERE bf.book_id = b.id
  AND bf.format_type = 'audiolibro';

-- ── 3) PostgREST al día + verificación ──────────────────────────────
NOTIFY pgrst, 'reload schema';

-- Debe mostrar cada audiolibro apuntando a un .mp3.
SELECT b.title      AS codice,
       bf.file_url,
       bf.file_size_mb
FROM public.book_formats bf
JOIN public.books b ON b.id = bf.book_id
WHERE bf.format_type = 'audiolibro'
ORDER BY b.title;

-- El nombre .mp3 que le toca a cada Códice cuando le hagas su audiolibro:
SELECT title AS codice, public.nombre_audiolibro(title) AS archivo_para_r2
FROM public.catalog_books ORDER BY title;
