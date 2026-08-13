-- 20260503_reading_progress.sql
-- Persistencia de progreso de lectura del Lector EPUB integrado.
-- Posición exacta vía CFI (Canonical Fragment Identifier de epubjs)
-- + porcentaje calculado, por (clerk_user_id, book_id).
--
-- RLS denied. Acceso solo via RPCs SECURITY DEFINER:
--   save_reading_progress(p_clerk_id, p_book_id, p_cfi, p_pct)
--   get_reading_progress(p_clerk_id, p_book_id)
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor → Run.

create table if not exists public.reading_progress (
    clerk_user_id text not null,
    book_id text not null,
    cfi text,
    percentage numeric not null default 0,
    updated_at timestamptz not null default now(),
    primary key (clerk_user_id, book_id)
);

alter table public.reading_progress enable row level security;

-- Sin policies: anon/authenticated NO acceden directo. Solo via RPCs.
revoke all on public.reading_progress from anon, authenticated;

create or replace function public.save_reading_progress(
    p_clerk_id text,
    p_book_id text,
    p_cfi text,
    p_pct numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if p_clerk_id is null or btrim(p_clerk_id) = '' then
        return;
    end if;
    if p_book_id is null or btrim(p_book_id) = '' then
        return;
    end if;

    insert into public.reading_progress
        (clerk_user_id, book_id, cfi, percentage, updated_at)
    values
        (p_clerk_id, p_book_id, p_cfi, coalesce(p_pct, 0), now())
    on conflict (clerk_user_id, book_id) do update set
        cfi = coalesce(excluded.cfi, public.reading_progress.cfi),
        percentage = coalesce(excluded.percentage, public.reading_progress.percentage),
        updated_at = now();
end;
$$;

create or replace function public.get_reading_progress(
    p_clerk_id text,
    p_book_id text
)
returns table (
    cfi text,
    percentage numeric,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select rp.cfi, rp.percentage, rp.updated_at
    from public.reading_progress rp
    where rp.clerk_user_id = p_clerk_id
      and rp.book_id = p_book_id
    limit 1;
end;
$$;

grant execute on function public.save_reading_progress(text, text, text, numeric)
    to anon, authenticated;
grant execute on function public.get_reading_progress(text, text)
    to anon, authenticated;
