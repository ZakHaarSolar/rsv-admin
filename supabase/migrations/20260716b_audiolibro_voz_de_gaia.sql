-- 20260716b_audiolibro_voz_de_gaia.sql v2 — Alta del formato AUDIOLIBRO.
-- =====================================================================
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run.
-- Pareja: MN_Codices v1.10 (botón de audífonos) + Co_Mobile v1.9 (pastilla).
--
-- v2 — FIX: book_formats.format_label es NOT NULL y la v1 no lo mandaba
-- (error 23502). Ahora se declara "Audiolibro" + su tamaño real en MB para
-- que la pastilla de descarga muestre "(47.8 MB)" como los demás formatos.
--
-- QUÉ HACE: registra el audiolibro de "La Voz de Gaia" como un formato más
-- del Códice, con su URL pública de R2. Es lo que hace que:
--   · get_user_books devuelva el formato a quien lo canjeó → aparece el botón
--     de audífonos en Mi biblioteca (el cliente exige POSEER el formato).
--   · el archivo tenga su URL en la DB (fuente de verdad); lib/audiobooks
--     queda solo como respaldo del cliente.
--
-- OJO: dar de alta el formato NO se lo regala a nadie. El acceso lo decide
-- purchases.formats_purchased, que solo se llena al canjear el Cristal o al
-- comprar el Códice. Esto solo declara que el formato EXISTE.
--
-- Idempotente: si ya existe la fila del audiolibro, actualiza URL/label/tamaño.

-- ── 1) Alta del formato (si no existe) ──────────────────────────────
INSERT INTO public.book_formats (
    book_id,
    format_type,
    format_label,
    file_url,
    file_size_mb,
    book_title
)
SELECT
    b.id,
    'audiolibro',
    'Audiolibro',
    'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/Audiolibros/la-voz-de-gaia.m4a',
    47.8,
    b.title
FROM public.books b
WHERE b.title = 'La Voz de Gaia'
  AND NOT EXISTS (
      SELECT 1 FROM public.book_formats bf
      WHERE bf.book_id = b.id AND bf.format_type = 'audiolibro'
  );

-- ── 2) Actualización (si ya existía de un intento previo) ───────────
UPDATE public.book_formats
SET file_url     = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/Audiolibros/la-voz-de-gaia.m4a',
    format_label = COALESCE(NULLIF(public.book_formats.format_label, ''), 'Audiolibro'),
    file_size_mb = 47.8
FROM public.books b
WHERE public.book_formats.book_id = b.id
  AND public.book_formats.format_type = 'audiolibro'
  AND b.title = 'La Voz de Gaia';

-- ── 3) Verificación (debe listar el audiolibro con su URL) ──────────
SELECT b.title, bf.format_type, bf.format_label, bf.file_size_mb, bf.file_url
FROM public.book_formats bf
JOIN public.books b ON b.id = bf.book_id
WHERE b.title = 'La Voz de Gaia'
ORDER BY bf.format_type;
