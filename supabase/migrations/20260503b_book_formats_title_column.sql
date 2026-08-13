-- 20260503b_book_formats_title_column.sql
-- Agrega columna book_title a public.book_formats para que el editor
-- de Supabase muestre el nombre del libro junto al book_id, sin tener
-- que cruzar contra public.books cada vez. Backfill con el title actual
-- de books + trigger BEFORE INSERT/UPDATE que mantiene la columna
-- sincronizada automáticamente cuando insertes nuevas filas o cambies
-- el book_id de una existente. También un trigger en public.books que
-- propaga renombres (UPDATE de title) a todas las filas hijas.
--
-- NOTA: Postgres agrega columnas nuevas al FINAL de la tabla y no
-- permite cambiar el orden físico sin recrear la tabla. Si quieres
-- ver `book_title` en las primeras posiciones, en el Dashboard de
-- Supabase abre el Table Editor → tres puntos arriba a la derecha →
-- "Customize columns" → arrastra `book_title` arriba. Es solo cosmético
-- (afecta la vista, no el schema), pero queda persistido por usuario.
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor → Run.

-- ── Columna ──────────────────────────────────────────────────────
alter table public.book_formats
    add column if not exists book_title text;

-- ── Backfill desde books ─────────────────────────────────────────
update public.book_formats bf
set book_title = b.title
from public.books b
where bf.book_id = b.id
  and (bf.book_title is null or bf.book_title <> b.title);

-- ── Trigger en book_formats: al insertar/actualizar, copia title ──
create or replace function public._sync_book_title_on_format()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_title text;
begin
    if new.book_id is null then
        new.book_title := null;
        return new;
    end if;
    select title into v_title
    from public.books
    where id = new.book_id;
    new.book_title := v_title;
    return new;
end;
$$;

drop trigger if exists trg_sync_book_title_on_format on public.book_formats;
create trigger trg_sync_book_title_on_format
    before insert or update of book_id on public.book_formats
    for each row
    execute function public._sync_book_title_on_format();

-- ── Trigger en books: al renombrar, propaga a book_formats ───────
create or replace function public._propagate_book_title_to_formats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.title is distinct from old.title then
        update public.book_formats
        set book_title = new.title
        where book_id = new.id;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_propagate_book_title on public.books;
create trigger trg_propagate_book_title
    after update of title on public.books
    for each row
    execute function public._propagate_book_title_to_formats();
