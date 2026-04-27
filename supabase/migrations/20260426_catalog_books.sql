-- ════════════════════════════════════════════════════════════════════
-- catalog_books — fuente única de verdad para los libros que muestra
-- Códices (capa public, no requiere auth). Separada de la tabla books
-- existente que trackea purchases/book_formats — esta es solo para
-- display del catálogo (cards, descripciones, links de compra).
--
-- Aplicar: Supabase Dashboard → SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.catalog_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Cross-ref opcional al books.id existente (para linkear con
    -- book_formats/purchases si en algún momento queremos unificar).
    book_id TEXT,
    -- Autor: enum cerrado para que coincida con el filter del frontend
    -- (Zak'Haar / Aqua'Riia). Usamos el carácter ´ que ya está en el
    -- código del componente.
    author_option TEXT NOT NULL CHECK (
        author_option IN ('Zak´Haar', 'Aqua´Riia')
    ),
    title TEXT NOT NULL,
    cover_url TEXT,
    pdf_preview_url TEXT,
    trailer_url TEXT,
    page_count TEXT,
    publication_year TEXT,
    short_desc TEXT,
    long_desc TEXT,
    link_digital TEXT,
    link_audio TEXT,
    link_amazon_es TEXT,
    link_amazon_mx TEXT,
    link_amazon_us TEXT,
    link_amazon_de TEXT,
    -- Orden de display dentro de cada autor (menor primero).
    sort_order INTEGER NOT NULL DEFAULT 100,
    -- Toggle para esconder un libro sin borrarlo.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para query por autor + orden (el patrón del frontend).
CREATE INDEX IF NOT EXISTS idx_catalog_books_author_order
    ON public.catalog_books (author_option, sort_order)
    WHERE is_active = TRUE;

-- RLS: lectura pública (es un catálogo, no datos privados).
ALTER TABLE public.catalog_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS catalog_books_public_read ON public.catalog_books;
CREATE POLICY catalog_books_public_read
    ON public.catalog_books
    FOR SELECT
    USING (is_active = TRUE);

-- updated_at se mantiene automático.
CREATE OR REPLACE FUNCTION public.touch_catalog_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_catalog_books_updated_at ON public.catalog_books;
CREATE TRIGGER trg_catalog_books_updated_at
    BEFORE UPDATE ON public.catalog_books
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_catalog_books_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- Para llenar la tabla:
--   Opción 1 — Supabase Dashboard → Table Editor → catalog_books → +
--              Insert row (manual, fila por fila).
--   Opción 2 — SQL INSERT directo, ejemplo:
--
-- INSERT INTO public.catalog_books (
--     author_option, title, cover_url, short_desc, long_desc,
--     link_digital, page_count, publication_year, sort_order
-- ) VALUES (
--     'Zak´Haar',
--     'Códices de la Sexta Densidad',
--     'https://r2.redsolarviva.com/covers/codice-1.jpg',
--     'Manual de despertar para tripulantes que recién aterrizan...',
--     'Texto largo de descripción aquí. Soporta multiline.',
--     'https://buy.stripe.com/...',
--     '320',
--     '2025',
--     10
-- );
-- ════════════════════════════════════════════════════════════════════
