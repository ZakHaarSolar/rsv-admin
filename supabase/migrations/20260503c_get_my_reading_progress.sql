-- 20260503c_get_my_reading_progress.sql
-- RPC batch que devuelve TODO el progreso de lectura de un Tripulante
-- en una sola llamada. Lo usa MN_Codices para pintar la barra de
-- progreso bajo cada Códice sin hacer un round-trip por libro.
--
-- Aplicar pegando este archivo en Supabase Dashboard → SQL Editor → Run.

create or replace function public.get_my_reading_progress(
    p_clerk_id text
)
returns table (
    book_id text,
    percentage numeric,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    if p_clerk_id is null or btrim(p_clerk_id) = '' then
        return;
    end if;
    return query
    select rp.book_id, rp.percentage, rp.updated_at
    from public.reading_progress rp
    where rp.clerk_user_id = p_clerk_id
    order by rp.updated_at desc;
end;
$$;

grant execute on function public.get_my_reading_progress(text)
    to anon, authenticated;
