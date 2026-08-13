-- Migración 2026-05-09: PDFs de MediaFire → R2
--
-- Mueve los 11 PDFs del catálogo de Códices al bucket R2 público
-- (mismo bucket donde ya viven EPUBs y portadas). Eso permite que el
-- botón "Descargar PDF" del lente y de la PWA app baje el archivo
-- directo en lugar de abrir el viewer de MediaFire.
--
-- Aplicar en: Supabase Dashboard → SQL Editor → New Query → Run.
-- Idempotente: si las URLs ya están en R2 el UPDATE no hace nada.

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/Cuerpo%20de%20Silicio.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'Cuerpo de Silicio';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/El%20Agua%20que%20Recuerda.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'El Agua que Recuerda';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/El%20Arquitecto%20de%20la%20Realidad.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'El Arquitecto de la Realidad';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/La%20Fi%CC%81sica%20de%20la%20Voluntad.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'La Física de la Voluntad';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/La%20Muerte%20No%20Existe.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'La Muerte No Existe';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/La%20Voz%20de%20Gaia.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'La Voz de Gaia';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/Lenguaje%20Hologra%CC%81fico.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'Lenguaje Holográfico';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/Protocolo%20de%20Entrada.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'Protocolo de Entrada';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/Singularidad%20Orga%CC%81nica.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'Singularidad Orgánica';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/Sintiencia.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'Sintiencia';

UPDATE book_formats SET file_url = 'https://pub-94bd1d71bb304c91ad7b8e146063f337.r2.dev/Codices/PDF%C2%B4s/Terra%20Cristal.pdf'
FROM books WHERE book_formats.book_id = books.id AND book_formats.format_type = 'pdf' AND books.title = 'Terra Cristal';

-- Verificación: lista los PDFs actualizados con su title.
-- Pegá esto después del bloque de UPDATE para confirmar que las 11
-- filas migraron correctamente. Si alguna no aparece, el title de
-- books no matcheó exactamente y hay que revisar el spelling.
SELECT b.title, bf.format_type, bf.file_url
FROM book_formats bf
JOIN books b ON bf.book_id = b.id
WHERE bf.format_type = 'pdf'
  AND bf.file_url LIKE 'https://pub-94bd%'
ORDER BY b.title;
